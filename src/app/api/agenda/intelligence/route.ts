import {
  createClient,
  type SupabaseClient,
} from '@supabase/supabase-js'

import {
  NextRequest,
  NextResponse,
} from 'next/server'

import {
  isAccessDeniedError,
  requireFeatureAccess,
  serializeAccessDeniedError,
} from '@/lib/access/guards/require-feature-access'

import {
  requireSessionUser,
} from '@/lib/auth/session'

import {
  loadAgendaOperationalSnapshot,
  type AgendaOperationalSnapshot,
} from '@/lib/agenda/services/operational-snapshot.service'

export const dynamic =
  'force-dynamic'

export const runtime =
  'nodejs'

type UnknownRecord =
  Record<string, unknown>

type IntelligenceBackendResponse = {
  success?: boolean

  message?: string

  data?: {
    generated_at?: string

    module?: string

    contract_version?: string

    engine?: UnknownRecord
  }

  detail?: string
}

const NO_CACHE_HEADERS = {
  'Cache-Control':
    'no-store, no-cache, must-revalidate',
}

const REQUEST_TIMEOUT_MS =
  90_000

const MAX_BACKEND_ATTEMPTS =
  2

const RETRY_DELAY_MS =
  1_500

function getAccessToken(
  request: NextRequest,
): string {
  const accessToken =
    request.cookies.get(
      'sb-access-token',
    )?.value ??
    request.cookies.get(
      'access_token',
    )?.value

  if (!accessToken) {
    throw new Error(
      'Usuário não autenticado.',
    )
  }

  return accessToken
}

function createAuthenticatedClient(
  accessToken: string,
): SupabaseClient {
  const url =
    process.env
      .NEXT_PUBLIC_SUPABASE_URL

  const anonKey =
    process.env
      .NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (
    !url ||
    !anonKey
  ) {
    throw new Error(
      'Variáveis públicas do Supabase não configuradas.',
    )
  }

  return createClient(
    url,
    anonKey,
    {
      global: {
        headers: {
          Authorization:
            `Bearer ${accessToken}`,
        },
      },

      auth: {
        persistSession:
          false,

        autoRefreshToken:
          false,

        detectSessionInUrl:
          false,
      },
    },
  )
}

function getIntelligenceBackendUrl():
  string {
  const baseUrl =
    process.env
      .EDI_BACKEND_URL ??
    process.env
      .BACKEND_API_URL ??
    process.env
      .NEXT_PUBLIC_API_URL

  if (
    !baseUrl?.trim()
  ) {
    throw new Error(
      'A URL do backend EIOS não está configurada.',
    )
  }

  const normalizedBaseUrl =
    baseUrl
      .trim()
      .replace(
        /\/+$/,
        '',
      )

  return (
    `${normalizedBaseUrl}` +
    '/api/v1/intelligence/agenda'
  )
}

function isRecord(
  value: unknown,
): value is UnknownRecord {
  return (
    typeof value ===
      'object' &&
    value !== null &&
    !Array.isArray(
      value,
    )
  )
}

function normalizeOptionalText(
  value: unknown,
): string | null {
  if (
    typeof value !==
    'string'
  ) {
    return null
  }

  const normalizedValue =
    value.trim()

  return (
    normalizedValue ||
    null
  )
}

function getErrorMessage(
  error: unknown,
): string {
  if (
    error instanceof Error
  ) {
    return error.message
  }

  return String(
    error,
  )
}

function getErrorCauseCode(
  error: unknown,
): string | null {
  if (
    !(error instanceof Error)
  ) {
    return null
  }

  const cause =
    error.cause

  if (
    !isRecord(
      cause,
    )
  ) {
    return null
  }

  const code =
    cause.code

  return (
    typeof code ===
      'string'
      ? code
      : null
  )
}

function isRetryableNetworkError(
  error: unknown,
): boolean {
  if (
    !(error instanceof Error)
  ) {
    return false
  }

  if (
    error.name ===
    'AbortError'
  ) {
    return true
  }

  const normalizedMessage =
    error.message
      .trim()
      .toLowerCase()

  if (
    normalizedMessage ===
      'fetch failed' ||
    normalizedMessage.includes(
      'network',
    ) ||
    normalizedMessage.includes(
      'socket',
    ) ||
    normalizedMessage.includes(
      'connection',
    ) ||
    normalizedMessage.includes(
      'timeout',
    ) ||
    normalizedMessage.includes(
      'timed out',
    )
  ) {
    return true
  }

  const retryableCodes =
    new Set([
      'ECONNRESET',
      'ECONNREFUSED',
      'EAI_AGAIN',
      'ENETUNREACH',
      'ETIMEDOUT',
      'UND_ERR_CONNECT_TIMEOUT',
      'UND_ERR_HEADERS_TIMEOUT',
      'UND_ERR_SOCKET',
    ])

  const causeCode =
    getErrorCauseCode(
      error,
    )

  return (
    causeCode !==
      null &&
    retryableCodes.has(
      causeCode,
    )
  )
}

function wait(
  delayMs: number,
): Promise<void> {
  return new Promise(
    resolve => {
      setTimeout(
        resolve,
        delayMs,
      )
    },
  )
}

async function requireIntelligenceAccess(
  userId: string,
): Promise<void> {
  await requireFeatureAccess({
    userId,

    featureCode:
      'agenda.planning',

    options: {
      includeUsage:
        false,
    },
  })
}

function inferContext(
  userId: string,

  snapshot:
    AgendaOperationalSnapshot,
): UnknownRecord {
  const allRecords = [
    ...snapshot.planning,
    ...snapshot.objectives,
    ...snapshot.lessons,
    ...snapshot.evidences,
  ]

  const organizationId =
    allRecords
      .map(
        record =>
          normalizeOptionalText(
            record
              .organization_id,
          ),
      )
      .find(Boolean) ??
    null

  const schoolId =
    allRecords
      .map(
        record =>
          normalizeOptionalText(
            record
              .school_id,
          ),
      )
      .find(Boolean) ??
    null

  return {
    user_id:
      userId,

    organization_id:
      organizationId,

    school_id:
      schoolId,

    role:
      null,

    metadata: {
      source:
        'next-agenda-intelligence-route',

      scope:
        'authenticated-user',

      rls_applied:
        true,

      snapshot_source:
        'operational-snapshot-service',

      contract_version:
        'agenda-operational-v1',
    },
  }
}

function createIntelligencePayload({
  userId,
  snapshot,
}: {
  userId: string

  snapshot:
    AgendaOperationalSnapshot
}): UnknownRecord {
  return {
    context:
      inferContext(
        userId,
        snapshot,
      ),

    planning:
      snapshot.planning,

    objectives:
      snapshot.objectives,

    lessons:
      snapshot.lessons,

    evidences:
      snapshot.evidences,

    interactions:
      [],

    accepted_recommendations:
      0,
  }
}

async function performBackendRequest({
  backendUrl,
  payload,
  attempt,
}: {
  backendUrl: string

  payload: UnknownRecord

  attempt: number
}): Promise<
  IntelligenceBackendResponse
> {
  const controller =
    new AbortController()

  const timeoutId =
    setTimeout(
      () => {
        controller.abort()
      },
      REQUEST_TIMEOUT_MS,
    )

  try {
    const response =
      await fetch(
        backendUrl,
        {
          method:
            'POST',

          headers: {
            Accept:
              'application/json',

            'Content-Type':
              'application/json',

            'X-EDI-Contract-Version':
              'agenda-operational-v1',

            'X-EDI-Request-Attempt':
              String(
                attempt,
              ),
          },

          body:
            JSON.stringify(
              payload,
            ),

          cache:
            'no-store',

          signal:
            controller.signal,
        },
      )

    let responseBody:
      unknown

    try {
      responseBody =
        await response.json()
    } catch {
      responseBody =
        null
    }

    const parsedBody =
      isRecord(
        responseBody,
      )
        ? responseBody as
          IntelligenceBackendResponse
        : {}

    if (
      !response.ok
    ) {
      const errorMessage =
        normalizeOptionalText(
          parsedBody.detail,
        ) ??
        normalizeOptionalText(
          parsedBody.message,
        ) ??
        `O EDI Intelligence Engine respondeu com status ${response.status}.`

      throw new Error(
        errorMessage,
      )
    }

    return parsedBody
  } finally {
    clearTimeout(
      timeoutId,
    )
  }
}

async function callIntelligenceBackend(
  payload: UnknownRecord,
): Promise<
  IntelligenceBackendResponse
> {
  const backendUrl =
    getIntelligenceBackendUrl()

  let lastError:
    unknown =
    null

  for (
    let attempt = 1;
    attempt <=
      MAX_BACKEND_ATTEMPTS;
    attempt += 1
  ) {
    try {
      return await performBackendRequest({
        backendUrl,
        payload,
        attempt,
      })
    } catch (
      error
    ) {
      lastError =
        error

      const retryable =
        isRetryableNetworkError(
          error,
        )

      console.error(
        '[EDI_INTELLIGENCE_BACKEND_ATTEMPT_ERROR]',
        {
          attempt,

          maximumAttempts:
            MAX_BACKEND_ATTEMPTS,

          backendUrl,

          retryable,

          error:
            getErrorMessage(
              error,
            ),

          causeCode:
            getErrorCauseCode(
              error,
            ),
        },
      )

      const hasAnotherAttempt =
        attempt <
        MAX_BACKEND_ATTEMPTS

      if (
        !retryable ||
        !hasAnotherAttempt
      ) {
        break
      }

      await wait(
        RETRY_DELAY_MS,
      )
    }
  }

  if (
    lastError instanceof
      Error &&
    lastError.name ===
      'AbortError'
  ) {
    throw new Error(
      'O EDI Intelligence Engine excedeu o tempo máximo de resposta.',
    )
  }

  if (
    isRetryableNetworkError(
      lastError,
    )
  ) {
    throw new Error(
      'Não foi possível estabelecer comunicação com o backend EIOS após duas tentativas.',
    )
  }

  throw (
    lastError instanceof Error
      ? lastError
      : new Error(
          'Não foi possível acessar o backend EIOS.',
        )
  )
}

function buildSuccessResponse(
  backendResponse:
    IntelligenceBackendResponse,
): NextResponse {
  const backendData =
    isRecord(
      backendResponse.data,
    )
      ? backendResponse.data
      : {}

  const engine =
    isRecord(
      backendData.engine,
    )
      ? backendData.engine
      : {}

  return NextResponse.json(
    {
      success:
        true,

      generated_at:
        normalizeOptionalText(
          backendData
            .generated_at,
        ) ??
        new Date()
          .toISOString(),

      module:
        normalizeOptionalText(
          backendData.module,
        ) ??
        'agenda',

      contract_version:
        normalizeOptionalText(
          backendData
            .contract_version,
        ) ??
        'agenda-operational-v1',

      context:
        isRecord(
          engine.context,
        )
          ? engine.context
          : {},

      contract:
        isRecord(
          engine.contract,
        )
          ? engine.contract
          : {},

      profile:
        isRecord(
          engine.profile,
        )
          ? engine.profile
          : {},

      analytics:
        isRecord(
          engine.analytics,
        )
          ? engine.analytics
          : {},

      insights:
        isRecord(
          engine.insights,
        )
          ? engine.insights
          : {},

      recommendations:
        isRecord(
          engine
            .recommendations,
        )
          ? engine
              .recommendations
          : {},

      learning:
        isRecord(
          engine.learning,
        )
          ? engine.learning
          : {},
    },
    {
      status:
        200,

      headers:
        NO_CACHE_HEADERS,
    },
  )
}

function buildErrorResponse(
  error: unknown,
): NextResponse {
  if (
    isAccessDeniedError(
      error,
    )
  ) {
    const serializedError =
      serializeAccessDeniedError(
        error,
      )

    return NextResponse.json(
      serializedError,
      {
        status:
          403,

        headers:
          NO_CACHE_HEADERS,
      },
    )
  }

  const message =
    error instanceof
      Error
      ? error.message
      : 'Não foi possível processar a inteligência da Agenda.'

  const normalizedMessage =
    message.toLowerCase()

  if (
    normalizedMessage
      .includes(
        'não autenticado',
      )
  ) {
    return NextResponse.json(
      {
        success:
          false,

        error:
          'Usuário não autenticado.',
      },
      {
        status:
          401,

        headers:
          NO_CACHE_HEADERS,
      },
    )
  }

  if (
    normalizedMessage
      .includes(
        'não está configurada',
      ) ||
    normalizedMessage
      .includes(
        'não configuradas',
      )
  ) {
    return NextResponse.json(
      {
        success:
          false,

        error:
          message,
      },
      {
        status:
          503,

        headers:
          NO_CACHE_HEADERS,
      },
    )
  }

  if (
    normalizedMessage
      .includes(
        'backend eios',
      ) ||
    normalizedMessage
      .includes(
        'tempo máximo',
      ) ||
    normalizedMessage
      .includes(
        'comunicação',
      )
  ) {
    return NextResponse.json(
      {
        success:
          false,

        error:
          message,
      },
      {
        status:
          503,

        headers:
          NO_CACHE_HEADERS,
      },
    )
  }

  return NextResponse.json(
    {
      success:
        false,

      error:
        message,
    },
    {
      status:
        500,

      headers:
        NO_CACHE_HEADERS,
    },
  )
}

export async function GET(
  request: NextRequest,
): Promise<NextResponse> {
  try {
    const user =
      await requireSessionUser()

    await requireIntelligenceAccess(
      user.id,
    )

    const client =
      createAuthenticatedClient(
        getAccessToken(
          request,
        ),
      )

    const {
      snapshot,
    } =
      await loadAgendaOperationalSnapshot({
        client,

        userId:
          user.id,
      })

    const payload =
      createIntelligencePayload({
        userId:
          user.id,

        snapshot,
      })

    const backendResponse =
      await callIntelligenceBackend(
        payload,
      )

    return buildSuccessResponse(
      backendResponse,
    )
  } catch (
    error
  ) {
    console.error(
      '[AGENDA_INTELLIGENCE_GET_ERROR]',
      {
        error:
          getErrorMessage(
            error,
          ),

        causeCode:
          getErrorCauseCode(
            error,
          ),
      },
    )

    return buildErrorResponse(
      error,
    )
  }
}