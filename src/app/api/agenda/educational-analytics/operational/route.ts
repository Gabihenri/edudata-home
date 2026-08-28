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

import {
  persistEducationalAnalyticsRun,
} from '@/lib/agenda/educational-analytics/educational-analytics.persistence.service'

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

  const message =
    error instanceof Error
      ? error.message
      : 'Erro desconhecido.'

  const status =
    message.toLowerCase()
      .includes('não autenticado')
      ? 401
      : 500

  return NextResponse.json(
    {
      success: false,
      error:
        status === 500
          ? 'Não foi possível executar a análise automática da Agenda.'
          : message,
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

export async function GET(
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

    const client =
      createAuthenticatedClient(
        getAccessToken(request),
      )

    const dataset =
      await loadAgendaAnalyticsDataset({
        client,
        userId: user.id,
        correlationId:
          `agenda-operational-${crypto.randomUUID()}`,
      })

    const result =
      runEducationalAnalyticsWithReport({
        input: dataset.input,
        executeCorrelation: true,
        executePattern: true,
        executeInfluence: false,
        executeRecommendation: true,
        metadata: {
          source:
            'agenda_operational_snapshot',
          snapshotGeneratedAt:
            dataset.generatedAt,
          datasetQuality:
            dataset.quality.status,
        },
      })

    let persistence:
      | Awaited<
          ReturnType<
            typeof persistEducationalAnalyticsRun
          >
        >
      | {
          persisted: false
          reusedExisting: false
          row: null
          previousVersionId: null
          generatedAt: string
          warnings: string[]
          error: string
        }

    try {
      persistence =
        await persistEducationalAnalyticsRun({
          client,
          execution:
            result,
          userId:
            user.id,
        })
    } catch (persistenceError) {
      const message =
        persistenceError instanceof Error
          ? persistenceError.message
          : 'Erro desconhecido de persistência.'

      console.error(
        '[AGENDA_EDUCATIONAL_ANALYTICS_PERSISTENCE_ERROR]',
        {
          message,
          analysisId:
            result.analytics?.id ?? null,
          occurredAt:
            new Date().toISOString(),
        },
      )

      persistence = {
        persisted: false,
        reusedExisting: false,
        row: null,
        previousVersionId: null,
        generatedAt:
          new Date().toISOString(),
        warnings: [
          'A análise foi executada, mas o histórico não pôde ser persistido nesta execução.',
        ],
        error:
          message,
      }
    }

    return NextResponse.json(
      {
        ...result,
        persistence,
        dataset: {
          quality:
            dataset.quality,
          generatedAt:
            dataset.generatedAt,
          operationalSummary:
            dataset.operationalSummary,
        },
      },
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
      '[AGENDA_EDUCATIONAL_ANALYTICS_OPERATIONAL_ERROR]',
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
