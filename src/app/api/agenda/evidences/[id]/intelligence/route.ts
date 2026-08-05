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
} from '@/lib/agenda/repository/evidence-intelligence-runs.repository'

import {
  EvidencesRepository,
} from '@/lib/agenda/repository/evidences.repository'

import {
  EvidenceIntelligenceRunsService,
} from '@/lib/agenda/services/evidence-intelligence-runs.service'

import {
  EvidencesService,
} from '@/lib/agenda/services/evidences.service'

import {
  requireSessionUser,
} from '@/lib/auth/session'

export const dynamic =
  'force-dynamic'

type RouteContext = {
  params: {
    id:
      string
  }
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const NO_CACHE_HEADERS = {
  'Cache-Control':
    'no-store, no-cache, must-revalidate',
}

const DEFAULT_HISTORY_LIMIT =
  20

const MAXIMUM_HISTORY_LIMIT =
  100

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

function createServices(
  request:
    NextRequest,
): {
  evidencesService:
    EvidencesService

  intelligenceRunsService:
    EvidenceIntelligenceRunsService
} {
  const accessToken =
    getAccessToken(
      request,
    )

  const client =
    createAuthenticatedClient(
      accessToken,
    )

  return {
    evidencesService:
      new EvidencesService(
        new EvidencesRepository(
          client,
        ),
      ),

    intelligenceRunsService:
      new EvidenceIntelligenceRunsService(
        new EvidenceIntelligenceRunsRepository(
          client,
        ),
      ),
  }
}

function normalizeEvidenceId(
  value:
    string | undefined,
): string {
  const normalizedValue =
    value?.trim()

  if (
    !normalizedValue ||
    !UUID_PATTERN.test(
      normalizedValue,
    )
  ) {
    throw new Error(
      'Identificador da evidência inválido.',
    )
  }

  return normalizedValue
}

function normalizeBooleanQuery(
  value:
    string | null,
  defaultValue:
    boolean,
): boolean {
  if (
    value === null ||
    value.trim() ===
      ''
  ) {
    return defaultValue
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
    'O parâmetro booleano informado é inválido.',
  )
}

function normalizeHistoryLimit(
  value:
    string | null,
): number {
  if (
    value === null ||
    value.trim() ===
      ''
  ) {
    return DEFAULT_HISTORY_LIMIT
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
      'O limite do histórico deve ser um número inteiro positivo.',
    )
  }

  return Math.min(
    normalizedValue,
    MAXIMUM_HISTORY_LIMIT,
  )
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
      'unauthorized',
    ) ||
    message.includes(
      'sessão',
    )
  ) {
    return 401
  }

  if (
    message.includes(
      'não possui permissão',
    ) ||
    message.includes(
      'sem permissão',
    ) ||
    message.includes(
      'não autorizado',
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
      'não encontrada',
    ) ||
    message.includes(
      'não encontrado',
    )
  ) {
    return 404
  }

  if (
    message.includes(
      'inválido',
    ) ||
    message.includes(
      'inválida',
    ) ||
    message.includes(
      'obrigatório',
    ) ||
    message.includes(
      'obrigatória',
    ) ||
    message.includes(
      'número inteiro',
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
  context:
    RouteContext,
) {
  try {
    const user =
      await requireSessionUser()

    const evidenceId =
      normalizeEvidenceId(
        context.params.id,
      )

    const searchParams =
      request.nextUrl
        .searchParams

    const includeHistory =
      normalizeBooleanQuery(
        searchParams.get(
          'includeHistory',
        ),
        true,
      )

    const historyLimit =
      normalizeHistoryLimit(
        searchParams.get(
          'limit',
        ),
      )

    const {
      evidencesService,
      intelligenceRunsService,
    } =
      createServices(
        request,
      )

    /*
     * A consulta da evidência ocorre com o cliente
     * autenticado e, portanto, preserva as políticas RLS.
     */
    const evidence =
      await evidencesService
        .getById(
          evidenceId,
        )

    const requiredFeature =
      evidence.evidence_type ===
        'imagem' ||
      evidence.evidence_type ===
        'pdf'
        ? 'evidences.upload'
        : 'evidences.text'

    await requireFeatureAccess({
      userId:
        user.id,

      featureCode:
        requiredFeature,

      options: {
        includeUsage:
          false,
      },
    })

    const latest =
      await intelligenceRunsService
        .findLatestByEvidenceId(
          evidenceId,
        )

    const history =
      includeHistory
        ? await intelligenceRunsService
            .findByEvidenceId(
              evidenceId,
              {
                limit:
                  historyLimit,
              },
            )
        : []

    const completedRuns =
      history.filter(
        run =>
          run.processing_status ===
            'completed' ||
          run.processing_status ===
            'requires_human_review',
      )

    const failedRuns =
      history.filter(
        run =>
          run.processing_status ===
            'failed',
      )

    const pendingReviewRuns =
      history.filter(
        run =>
          run.requires_human_review &&
          (
            run.human_review_status ===
              'pending' ||
            run.human_review_status ===
              'in_review'
          ),
      )

    return NextResponse.json(
      {
        success:
          true,

        data: {
          evidence: {
            id:
              evidence.id,

            title:
              evidence.title,

            evidenceType:
              evidence.evidence_type,

            organizationId:
              evidence.organization_id,

            schoolId:
              evidence.school_id,

            classId:
              evidence.class_id,

            lessonId:
              evidence.lesson_id,

            planningId:
              evidence.planning_id,

            containsIdentifiableMinor:
              evidence
                .contains_identifiable_minor,

            createdAt:
              evidence.created_at,

            updatedAt:
              evidence.updated_at,
          },

          intelligence: {
            available:
              latest !==
              null,

            latest,

            history,

            summary: {
              totalRuns:
                history.length,

              completedRuns:
                completedRuns.length,

              failedRuns:
                failedRuns.length,

              pendingReviewRuns:
                pendingReviewRuns.length,

              latestStatus:
                latest
                  ?.processing_status ??
                null,

              latestRequiresHumanReview:
                latest
                  ?.requires_human_review ??
                false,

              latestProcessedAt:
                latest
                  ?.processed_at ??
                null,

              latestEngineVersion:
                latest
                  ?.engine_version ??
                null,
            },
          },
        },

        meta: {
          includeHistory,

          historyLimit,

          returnedHistoryItems:
            history.length,

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
      '[AGENDA_EVIDENCE_INTELLIGENCE_GET_ERROR]',
      {
        evidenceId:
          context.params.id,

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
      'Não foi possível carregar a análise inteligente da evidência.',
    )
  }
}