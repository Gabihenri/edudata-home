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

  const message =
    error.message.toLowerCase()

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

  const status =
    getErrorStatus(error)

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
        generatedAt:
          new Date().toISOString(),
      },
    },
    {
      status,
      headers: NO_CACHE_HEADERS,
    },
  )
}

export async function POST(
  request: NextRequest,
) {
  try {
    const user =
      await requireSessionUser()

    await requireFeatureAccess({
      userId: user.id,
      featureCode: FEATURE_CODE,
      options: {
        includeUsage: false,
      },
    })

    const body =
      normalizeBody(
        await request.json(),
      )

    const input:
      BuildEducationalAnalyticsInput = {
      ...body.input,
      requestedByUserId:
        user.id,
      correlationId:
        body.input
          .correlationId
          ?.trim() ||
        `analytics-${crypto.randomUUID()}`,
    }

    const result =
      runEducationalAnalyticsWithReport({
        ...body,
        input,
        metadata: {
          ...(body.metadata ?? {}),
          apiRoute:
            '/api/agenda/educational-analytics',
          authenticatedUserId:
            user.id,
        },
      })

    return NextResponse.json(
      result,
      {
        status:
          result.success
            ? 200
            : 422,
        headers:
          NO_CACHE_HEADERS,
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
        occurredAt:
          new Date().toISOString(),
      },
    )

    return createErrorResponse(error)
  }
}
