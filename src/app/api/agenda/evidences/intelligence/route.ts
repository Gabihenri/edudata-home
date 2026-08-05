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
  EvidenceIntelligenceRunsRepository,
  type EvidenceIntelligenceHumanReviewStatus,
  type EvidenceIntelligenceRunStatus,
} from '@/lib/agenda/repository/evidence-intelligence-runs.repository'

import {
  EvidenceIntelligenceRunsService,
} from '@/lib/agenda/services/evidence-intelligence-runs.service'

import {
  requireSessionUser,
} from '@/lib/auth/session'

export const dynamic =
  'force-dynamic'

const NO_CACHE_HEADERS = {
  'Cache-Control':
    'no-store, no-cache, must-revalidate',
}

const DEFAULT_LIMIT =
  50

const MAXIMUM_LIMIT =
  200

const PROCESSING_STATUSES:
  EvidenceIntelligenceRunStatus[] = [
    'pending',
    'processing',
    'completed',
    'requires_human_review',
    'failed',
    'cancelled',
    'ignored',
  ]

const HUMAN_REVIEW_STATUSES:
  EvidenceIntelligenceHumanReviewStatus[] = [
    'not_required',
    'pending',
    'in_review',
    'approved',
    'rejected',
    'changes_requested',
  ]

function getAccessToken(
  request:
    NextRequest,
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
  accessToken:
    string,
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

function createService(
  request:
    NextRequest,
): EvidenceIntelligenceRunsService {
  const accessToken =
    getAccessToken(
      request,
    )

  const client =
    createAuthenticatedClient(
      accessToken,
    )

  return new EvidenceIntelligenceRunsService(
    new EvidenceIntelligenceRunsRepository(
      client,
    ),
  )
}

function normalizeOptionalText(
  value:
    string | null,
): string | null {
  if (!value) {
    return null
  }

  return value.trim() ||
    null
}

function normalizeLimit(
  value:
    string | null,
): number {
  if (
    value === null ||
    value.trim() ===
      ''
  ) {
    return DEFAULT_LIMIT
  }

  const normalizedValue =
    Number(
      value,
    )

  if (
    !Number.isInteger(
      normalizedValue,
    ) ||
    normalizedValue < 1
  ) {
    throw new Error(
      'O limite deve ser um número inteiro positivo.',
    )
  }

  return Math.min(
    normalizedValue,
    MAXIMUM_LIMIT,
  )
}

function normalizeBoolean(
  value:
    string | null,
): boolean | null {
  if (
    value === null ||
    value.trim() ===
      ''
  ) {
    return null
  }

  const normalizedValue =
    value
      .trim()
      .toLowerCase()

  if (
    normalizedValue ===
      'true' ||
    normalizedValue ===
      '1'
  ) {
    return true
  }

  if (
    normalizedValue ===
      'false' ||
    normalizedValue ===
      '0'
  ) {
    return false
  }

  throw new Error(
    'O parâmetro de revisão humana deve ser true ou false.',
  )
}

function normalizeProcessingStatus(
  value:
    string | null,
): EvidenceIntelligenceRunStatus | null {
  const normalizedValue =
    normalizeOptionalText(
      value,
    )

  if (!normalizedValue) {
    return null
  }

  if (
    !PROCESSING_STATUSES.includes(
      normalizedValue as
        EvidenceIntelligenceRunStatus,
    )
  ) {
    throw new Error(
      'Status de processamento inválido.',
    )
  }

  return normalizedValue as
    EvidenceIntelligenceRunStatus
}

function normalizeHumanReviewStatus(
  value:
    string | null,
): EvidenceIntelligenceHumanReviewStatus | null {
  const normalizedValue =
    normalizeOptionalText(
      value,
    )

  if (!normalizedValue) {
    return null
  }

  if (
    !HUMAN_REVIEW_STATUSES.includes(
      normalizedValue as
        EvidenceIntelligenceHumanReviewStatus,
    )
  ) {
    throw new Error(
      'Status de revisão humana inválido.',
    )
  }

  return normalizedValue as
    EvidenceIntelligenceHumanReviewStatus
}

function getErrorStatus(
  error:
    unknown,
): number {
  if (
    !(error instanceof
      Error)
  ) {
    return 500
  }

  const message =
    error.message
      .toLowerCase()

  if (
    message.includes(
      'não autenticado',
    ) ||
    message.includes(
      'sessão',
    ) ||
    message.includes(
      'unauthorized',
    )
  ) {
    return 401
  }

  if (
    message.includes(
      'sem permissão',
    ) ||
    message.includes(
      'não possui permissão',
    ) ||
    message.includes(
      'forbidden',
    ) ||
    message.includes(
      'permission denied',
    ) ||
    message.includes(
      'row-level security',
    )
  ) {
    return 403
  }

  if (
    message.includes(
      'inválido',
    ) ||
    message.includes(
      'inválida',
    ) ||
    message.includes(
      'número inteiro',
    ) ||
    message.includes(
      'deve ser',
    )
  ) {
    return 400
  }

  return 500
}

function createErrorResponse(
  error:
    unknown,
  fallbackMessage:
    string,
) {
  if (
    isAccessDeniedError(
      error,
    )
  ) {
    return NextResponse.json(
      serializeAccessDeniedError(
        error,
      ),
      {
        status:
          403,

        headers:
          NO_CACHE_HEADERS,
      },
    )
  }

  const status =
    getErrorStatus(
      error,
    )

  const message =
    status >= 500
      ? fallbackMessage
      : error instanceof
          Error
        ? error.message
        : fallbackMessage

  return NextResponse.json(
    {
      success:
        false,

      error:
        message,
    },
    {
      status,

      headers:
        NO_CACHE_HEADERS,
    },
  )
}

export async function GET(
  request:
    NextRequest,
) {
  try {
    const user =
      await requireSessionUser()

    await requireFeatureAccess({
      userId:
        user.id,

      featureCode:
        'evidences.text',

      options: {
        includeUsage:
          false,
      },
    })

    const searchParams =
      request.nextUrl
        .searchParams

    const limit =
      normalizeLimit(
        searchParams.get(
          'limit',
        ),
      )

    const processingStatus =
      normalizeProcessingStatus(
        searchParams.get(
          'status',
        ),
      )

    const humanReviewStatus =
      normalizeHumanReviewStatus(
        searchParams.get(
          'humanReviewStatus',
        ),
      )

    const requiresHumanReview =
      normalizeBoolean(
        searchParams.get(
          'requiresHumanReview',
        ),
      )

    const evidenceId =
      normalizeOptionalText(
        searchParams.get(
          'evidenceId',
        ),
      )

    const eventId =
      normalizeOptionalText(
        searchParams.get(
          'eventId',
        ),
      )

    const organizationId =
      normalizeOptionalText(
        searchParams.get(
          'organizationId',
        ),
      )

    const schoolId =
      normalizeOptionalText(
        searchParams.get(
          'schoolId',
        ),
      )

    const engineName =
      normalizeOptionalText(
        searchParams.get(
          'engineName',
        ),
      )

    const service =
      createService(
        request,
      )

    const runs =
      await service.findAll({
        evidenceId,

        eventId,

        userId:
          user.id,

        organizationId,

        schoolId,

        processingStatus,

        humanReviewStatus,

        requiresHumanReview,

        engineName,

        limit,
      })

    const summary =
      runs.reduce(
        (
          accumulator,
          run,
        ) => {
          accumulator.total +=
            1

          if (
            run.processing_status ===
              'completed'
          ) {
            accumulator.completed +=
              1
          }

          if (
            run.processing_status ===
              'requires_human_review'
          ) {
            accumulator.requiresHumanReview +=
              1
          }

          if (
            run.processing_status ===
              'failed'
          ) {
            accumulator.failed +=
              1
          }

          if (
            run.processing_status ===
              'pending' ||
            run.processing_status ===
              'processing'
          ) {
            accumulator.inProgress +=
              1
          }

          if (
            run.human_review_status ===
              'pending' ||
            run.human_review_status ===
              'in_review'
          ) {
            accumulator.pendingHumanReview +=
              1
          }

          return accumulator
        },
        {
          total:
            0,

          completed:
            0,

          requiresHumanReview:
            0,

          failed:
            0,

          inProgress:
            0,

          pendingHumanReview:
            0,
        },
      )

    const qualityScores =
      runs
        .map(
          run =>
            run.quality_score,
        )
        .filter(
          (
            value,
          ): value is number =>
            typeof value ===
              'number',
        )

    const reliabilityScores =
      runs
        .map(
          run =>
            run.reliability_score,
        )
        .filter(
          (
            value,
          ): value is number =>
            typeof value ===
              'number',
        )

    const confidenceScores =
      runs
        .map(
          run =>
            run.confidence_score,
        )
        .filter(
          (
            value,
          ): value is number =>
            typeof value ===
              'number',
        )

    const average = (
      values:
        number[],
    ): number | null => {
      if (
        values.length ===
          0
      ) {
        return null
      }

      return (
        values.reduce(
          (
            total,
            value,
          ) =>
            total +
            value,
          0,
        ) /
        values.length
      )
    }

    return NextResponse.json(
      {
        success:
          true,

        data: {
          runs,

          summary: {
            ...summary,

            averageQualityScore:
              average(
                qualityScores,
              ),

            averageReliabilityScore:
              average(
                reliabilityScores,
              ),

            averageConfidenceScore:
              average(
                confidenceScores,
              ),
          },
        },

        filters: {
          evidenceId,

          eventId,

          organizationId,

          schoolId,

          processingStatus,

          humanReviewStatus,

          requiresHumanReview,

          engineName,

          limit,
        },

        meta: {
          returnedItems:
            runs.length,

          generatedAt:
            new Date()
              .toISOString(),
        },
      },
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
      '[AGENDA_EVIDENCE_INTELLIGENCE_LIST_ERROR]',
      {
        message:
          error instanceof
            Error
            ? error.message
            : 'Erro desconhecido.',

        occurredAt:
          new Date()
            .toISOString(),
      },
    )

    return createErrorResponse(
      error,
      'Não foi possível carregar as análises inteligentes.',
    )
  }
}