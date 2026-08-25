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
  loadAgendaAnalyticsDataset,
} from '@/lib/agenda/educational-analytics/agenda-analytics-dataset.service'

import {
  runEducationalAnalyticsWithReport,
} from '@/lib/agenda/educational-analytics/educational-analytics-report.service'

import type {
  RunEducationalAnalyticsInput,
} from '@/lib/agenda/educational-analytics/educational-analytics.service'

import type {
  BuildEducationalAnalyticsInput,
} from '@/lib/agenda/educational-analytics/analytics.types'

export const dynamic =
  'force-dynamic'

export const runtime =
  'nodejs'

const NO_CACHE_HEADERS = {
  'Cache-Control':
    'no-store, no-cache, must-revalidate',
}

const FEATURE_CODE =
  'agenda.planning'

type UnknownRecord =
  Record<string, unknown>

function isRecord(
  value: unknown,
): value is UnknownRecord {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  )
}

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

  if (!url || !anonKey) {
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
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  )
}

function normalizeBody(
  value: unknown,
): RunEducationalAnalyticsInput {
  if (!isRecord(value)) {
    throw new Error(
      'O corpo da solicitação é inválido.',
    )
  }

  if (
    !isRecord(value.input) ||
    !isRecord(value.input.context) ||
    !isRecord(value.input.configuration) ||
    !Array.isArray(value.input.sources) ||
    !Array.isArray(value.input.observations)
  ) {
    throw new Error(
      'O campo input não possui o contrato mínimo do Educational Analytics.',
    )
  }

  return value as unknown as
    RunEducationalAnalyticsInput
}

function getErrorStatus(
  error: unknown,
): number {
  if (!(error instanceof Error)) {
    return 500
  }

  const message = error.message.toLowerCase()

  if (
    message.includes('não autenticado') ||
    message.includes('sessão') ||
    message.includes('unauthorized')
  ) {
    return 401
  }

  if (
    message.includes('inválido') ||
    message.includes('inválida') ||
    message.includes('obrigatório') ||
    message.includes('obrigatória') ||
    message.includes('contrato mínimo')
  ) {
    return 400
  }

  if (
    message.includes('não configurada') ||
    message.includes('não configuradas')
  ) {
    return 503
  }

  return 500
}

function createErrorResponse(
  error: unknown,
) {
  if (isAccessDeniedError(error)) {
    return NextResponse.json(
      serializeAccessDeniedError(error),
      {
        status: 403,
        headers: NO_CACHE_HEADERS,
      },
    )
  }

  const status = getErrorStatus(error)

  return NextResponse.json(
    {
      success: false,
      error:
        status >= 500
          ? 'Não foi possível executar o Educational Analytics.'
          : error instanceof Error
            ? error.message
            : 'Solicitação inválida.',
      meta: {
        generatedAt: new Date().toISOString(),
      },
    },
    {
      status,
      headers: NO_CACHE_HEADERS,
    },
  )
}

async function requireAnalyticsAccess(
  userId: string,
): Promise<void> {
  await requireFeatureAccess({
    userId,
    featureCode: FEATURE_CODE,
    options: {
      includeUsage: false,
    },
  })
}

export async function GET(
  request: NextRequest,
): Promise<NextResponse> {
  try {
    const user = await requireSessionUser()

    await requireAnalyticsAccess(user.id)

    const client = createAuthenticatedClient(
      getAccessToken(request),
    )

    const dataset = await loadAgendaAnalyticsDataset({
      client,
      userId: user.id,
    })

    return NextResponse.json(
      {
        success: true,
        generatedAt: dataset.generatedAt,
        data: dataset.input,
        quality: dataset.quality,
        operationalSummary:
          dataset.operationalSummary,
      },
      {
        status: 200,
        headers: NO_CACHE_HEADERS,
      },
    )
  } catch (error) {
    console.error(
      '[EDUCATIONAL_ANALYTICS_DATASET_GET_ERROR]',
      {
        message:
          error instanceof Error
            ? error.message
            : 'Erro desconhecido.',
        occurredAt: new Date().toISOString(),
      },
    )

    return createErrorResponse(error)
  }
}

export async function POST(
  request: NextRequest,
) {
  try {
    const user = await requireSessionUser()

    await requireAnalyticsAccess(user.id)

    const body = normalizeBody(
      await request.json(),
    )

    const input: BuildEducationalAnalyticsInput = {
      ...body.input,
      requestedByUserId: user.id,
      correlationId:
        body.input.correlationId?.trim() ||
        `analytics-${crypto.randomUUID()}`,
    }

    const result = runEducationalAnalyticsWithReport({
      ...body,
      input,
      metadata: {
        ...(body.metadata ?? {}),
        apiRoute:
          '/api/agenda/educational-analytics',
        authenticatedUserId: user.id,
      },
    })

    return NextResponse.json(
      result,
      {
        status: result.success
          ? 200
          : 422,
        headers: NO_CACHE_HEADERS,
      },
    )
  } catch (error) {
    console.error(
      '[EDUCATIONAL_ANALYTICS_API_ERROR]',
      {
        message:
          error instanceof Error
            ? error.message
            : 'Erro desconhecido.',
        occurredAt: new Date().toISOString(),
      },
    )

    return createErrorResponse(error)
  }
}
