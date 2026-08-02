import {
  NextRequest,
  NextResponse,
} from 'next/server'

import {
  requireSessionUser,
} from '@/lib/auth/session'

export const dynamic =
  'force-dynamic'

export const runtime =
  'nodejs'

type UnknownRecord =
  Record<string, unknown>

type CapabilityId =
  | 'planning.daily_priorities'
  | 'planning.weekly_planning_analysis'
  | 'evidence.completion_analysis'
  | 'tasks.smart_prioritization'
  | 'calendar.workload_balance'
  | 'teacher.performance_snapshot'

type CapabilityRequestBody = {
  capability_id?: unknown
  payload?: unknown
}

const CAPABILITY_PATHS:
  Record<CapabilityId, string> = {
    'planning.daily_priorities':
      '/api/v1/intelligence/planning/daily-priorities',

    'planning.weekly_planning_analysis':
      '/api/v1/intelligence/planning/weekly-analysis',

    'evidence.completion_analysis':
      '/api/v1/intelligence/evidence/completion-analysis',

    'tasks.smart_prioritization':
      '/api/v1/intelligence/tasks/smart-prioritization',

    'calendar.workload_balance':
      '/api/v1/intelligence/calendar/workload-balance',

    'teacher.performance_snapshot':
      '/api/v1/intelligence/teacher/performance-snapshot',
  }

const REQUEST_TIMEOUT_MS =
  25_000

const NO_CACHE_HEADERS = {
  'Cache-Control':
    'no-store, no-cache, must-revalidate',
}

function isRecord(
  value: unknown,
): value is UnknownRecord {
  return (
    typeof value ===
      'object'
    && value !== null
    && !Array.isArray(
      value,
    )
  )
}

function normalizeText(
  value: unknown,
): string | null {
  if (
    typeof value !==
    'string'
  ) {
    return null
  }

  const normalized =
    value.trim()

  return normalized || null
}

function isCapabilityId(
  value: unknown,
): value is CapabilityId {
  return (
    typeof value ===
      'string'
    && Object.prototype
      .hasOwnProperty.call(
        CAPABILITY_PATHS,
        value,
      )
  )
}

function getBackendBaseUrl():
  string {
  const value =
    process.env
      .EDI_BACKEND_URL
    ?? process.env
      .BACKEND_API_URL
    ?? process.env
      .NEXT_PUBLIC_API_URL

  if (
    !value?.trim()
  ) {
    throw new Error(
      'A URL do backend EIOS não está configurada.',
    )
  }

  return value
    .trim()
    .replace(
      /\/+$/,
      '',
    )
}

function buildBackendUrl(
  capabilityId: CapabilityId,
): string {
  const baseUrl =
    getBackendBaseUrl()

  return (
    `${baseUrl}`
    + CAPABILITY_PATHS[
      capabilityId
    ]
  )
}

function getErrorMessage(
  value: unknown,
  fallback: string,
): string {
  if (!isRecord(value)) {
    return fallback
  }

  return (
    normalizeText(
      value.detail,
    )
    ?? normalizeText(
      value.error,
    )
    ?? normalizeText(
      value.message,
    )
    ?? fallback
  )
}

function buildErrorResponse(
  error: unknown,
): NextResponse {
  const message =
    error instanceof Error
      ? error.message
      : 'Não foi possível executar a capacidade do EIOS.'

  const normalizedMessage =
    message
      .toLowerCase()

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
        'tempo máximo',
      )
    || normalizedMessage
      .includes(
        'backend eios',
      )
    || normalizedMessage
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

async function parseRequestBody(
  request: NextRequest,
): Promise<CapabilityRequestBody> {
  let body:
    unknown

  try {
    body =
      await request.json()
  } catch {
    throw new Error(
      'O corpo da requisição possui formato inválido.',
    )
  }

  if (!isRecord(body)) {
    throw new Error(
      'O corpo da requisição deve ser um objeto.',
    )
  }

  return {
    capability_id:
      body.capability_id,

    payload:
      body.payload,
  }
}

async function callCapabilityBackend({
  capabilityId,
  payload,
  userId,
}: {
  capabilityId:
    CapabilityId

  payload:
    UnknownRecord

  userId:
    string
}): Promise<unknown> {
  const backendUrl =
    buildBackendUrl(
      capabilityId,
    )

  const controller =
    new AbortController()

  const timeoutId =
    setTimeout(
      () => {
        controller.abort()
      },
      REQUEST_TIMEOUT_MS,
    )

  console.info(
    '[EDI_CAPABILITY_PROXY_REQUEST]',
    {
      capabilityId,
      backendUrl,
      userId,
    },
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

            'X-EDI-Capability':
              capabilityId,

            'X-EDI-User-Id':
              userId,
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

    const contentType =
      response.headers.get(
        'content-type',
      )

    let responseBody:
      unknown =
      null

    if (
      contentType
        ?.toLowerCase()
        .includes(
          'application/json',
        )
    ) {
      try {
        responseBody =
          await response.json()
      } catch {
        responseBody =
          null
      }
    } else {
      let responseText =
        ''

      try {
        responseText =
          await response.text()
      } catch {
        responseText =
          ''
      }

      console.error(
        '[EDI_CAPABILITY_PROXY_NON_JSON_RESPONSE]',
        {
          capabilityId,
          backendUrl,
          status:
            response.status,
          contentType,
          responsePreview:
            responseText.slice(
              0,
              300,
            ),
        },
      )

      throw new Error(
        `O backend EIOS retornou conteúdo não JSON para '${capabilityId}'.`,
      )
    }

    if (
      !response.ok
    ) {
      const message =
        getErrorMessage(
          responseBody,
          `A capacidade '${capabilityId}' respondeu com status ${response.status}.`,
        )

      console.error(
        '[EDI_CAPABILITY_PROXY_BACKEND_ERROR]',
        {
          capabilityId,
          backendUrl,
          status:
            response.status,
          message,
        },
      )

      throw new Error(
        message,
      )
    }

    if (
      !isRecord(
        responseBody,
      )
    ) {
      throw new Error(
        `A capacidade '${capabilityId}' retornou uma resposta inválida.`,
      )
    }

    console.info(
      '[EDI_CAPABILITY_PROXY_SUCCESS]',
      {
        capabilityId,
        backendUrl,
        status:
          response.status,
      },
    )

    return responseBody
  } catch (
    error
  ) {
    if (
      error instanceof Error
      && error.name ===
        'AbortError'
    ) {
      console.error(
        '[EDI_CAPABILITY_PROXY_TIMEOUT]',
        {
          capabilityId,
          backendUrl,
          timeoutMs:
            REQUEST_TIMEOUT_MS,
        },
      )

      throw new Error(
        `A capacidade '${capabilityId}' excedeu o tempo máximo de resposta do backend EIOS.`,
      )
    }

    throw error
  } finally {
    clearTimeout(
      timeoutId,
    )
  }
}

export async function POST(
  request: NextRequest,
) {
  try {
    const user =
      await requireSessionUser()

    const body =
      await parseRequestBody(
        request,
      )

    if (
      !isCapabilityId(
        body.capability_id,
      )
    ) {
      return NextResponse.json(
        {
          success:
            false,

          error:
            'Capacidade EIOS inválida ou não autorizada.',
        },
        {
          status:
            400,

          headers:
            NO_CACHE_HEADERS,
        },
      )
    }

    if (
      !isRecord(
        body.payload,
      )
    ) {
      return NextResponse.json(
        {
          success:
            false,

          error:
            'O payload da capacidade deve ser um objeto.',
        },
        {
          status:
            400,

          headers:
            NO_CACHE_HEADERS,
        },
      )
    }

    const backendResponse =
      await callCapabilityBackend({
        capabilityId:
          body.capability_id,

        payload:
          body.payload,

        userId:
          user.id,
      })

    return NextResponse.json(
      backendResponse,
      {
        status:
          200,

        headers:
          NO_CACHE_HEADERS,
      },
    )
  } catch (
    error
  ) {
    console.error(
      '[EDI_CAPABILITY_PROXY_ERROR]',
      {
        error:
          error instanceof Error
            ? error.message
            : String(
                error,
              ),
      },
    )

    return buildErrorResponse(
      error,
    )
  }
}
