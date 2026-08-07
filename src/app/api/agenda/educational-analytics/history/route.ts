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
  listEducationalAnalyticsHistory,
  type EducationalAnalyticsRunRow,
} from '@/lib/agenda/repository/educational-analytics.repository'

export const dynamic =
  'force-dynamic'

export const runtime =
  'nodejs'

const FEATURE_CODE =
  'agenda.planning'

const NO_CACHE_HEADERS = {
  'Cache-Control':
    'no-store, no-cache, must-revalidate',
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
    process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

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

function normalizeLimit(
  value: string | null,
): number {
  if (!value) {
    return 20
  }

  const parsed = Number(value)

  if (!Number.isFinite(parsed)) {
    return 20
  }

  return Math.min(
    100,
    Math.max(1, Math.trunc(parsed)),
  )
}

function toHistoryItem(
  row: EducationalAnalyticsRunRow,
) {
  return {
    id: row.id,
    analysisId: row.analysis_id,
    analysisKey: row.analysis_key,
    versionId: row.version_id,
    versionNumber: row.version_number,
    versionLabel: row.version_label,
    versionStatus: row.version_status,
    isCurrentVersion: row.is_current_version,
    status: row.status,
    scope: row.scope,
    title: row.title,
    description: row.description,
    correlationCount: row.correlation_count,
    patternCount: row.pattern_count,
    anomalyCount: row.anomaly_count,
    influenceCount: row.influence_count,
    predictionCount: row.prediction_count,
    recommendationCount: row.recommendation_count,
    researchResultCount: row.research_result_count,
    requiresHumanReview: row.requires_human_review,
    humanReviewStatus: row.human_review_status,
    approved: row.approved,
    generatedAt: row.generated_at,
    completedAt: row.completed_at,
    reviewedAt: row.reviewed_at,
    createdAt: row.created_at,
    archivedAt: row.archived_at,
    warningsCount: Array.isArray(row.warnings)
      ? row.warnings.length
      : 0,
    errorsCount: Array.isArray(row.errors)
      ? row.errors.length
      : 0,
    reportAvailable:
      row.report_payload !== null,
  }
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
          ? 'Não foi possível carregar o histórico do Educational Analytics.'
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

    const searchParams =
      request.nextUrl.searchParams

    const rows =
      await listEducationalAnalyticsHistory({
        client,
        options: {
          userId: user.id,
          analysisKey:
            searchParams.get('analysisKey'),
          organizationId:
            searchParams.get('organizationId'),
          schoolId:
            searchParams.get('schoolId'),
          includeArchived:
            searchParams.get('includeArchived') === 'true',
          limit:
            normalizeLimit(
              searchParams.get('limit'),
            ),
        },
      })

    const items =
      rows.map(toHistoryItem)

    return NextResponse.json(
      {
        success: true,
        items,
        summary: {
          total: items.length,
          current:
            items.filter(
              item => item.isCurrentVersion,
            ).length,
          pendingReview:
            items.filter(
              item =>
                item.requiresHumanReview &&
                item.humanReviewStatus === 'pending',
            ).length,
          approved:
            items.filter(
              item => item.approved,
            ).length,
        },
        meta: {
          generatedAt:
            new Date().toISOString(),
        },
      },
      {
        status: 200,
        headers: NO_CACHE_HEADERS,
      },
    )
  } catch (error) {
    console.error(
      '[AGENDA_EDUCATIONAL_ANALYTICS_HISTORY_ERROR]',
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
