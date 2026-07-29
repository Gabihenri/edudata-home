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
  30_000

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

async function callIntelligenceBackend(
  payload: UnknownRecord,
): Promise<
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
        getIntelligenceBackendUrl(),
        {
          method:
            'POST',

          headers: {
            Accept:
              'application/json',

            'Content-Type':
              'application/json',
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
        'O EDI Intelligence Engine não conseguiu processar os dados.'

      throw new Error(
        errorMessage,
      )
    }

    return parsedBody
  } catch (
    error
  ) {
    if (
      error instanceof
        Error &&
      error.name ===
        'AbortError'
    ) {
      throw new Error(
        'O EDI Intelligence Engine excedeu o tempo máximo de resposta.',
      )
    }

    throw error
  } finally {
    clearTimeout(
      timeoutId,
    )
  }
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
          error instanceof
            Error
            ? error.message
            : error,
      },
    )

    return buildErrorResponse(
      error,
    )
  }
}