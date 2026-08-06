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
  generatePedagogicalInterventionService,
} from '@/lib/agenda/evidence-intelligence/pedagogical-intervention.service'

import {
  createPedagogicalInterventionPersistenceService,
  type PersistPedagogicalInterventionContext,
} from '@/lib/agenda/evidence-intelligence/pedagogical-intervention.persistence.service'

import type {
  GeneratePedagogicalInterventionInput,
  PedagogicalHumanReviewStatus,
  PedagogicalInterventionEvaluationStatus,
  PedagogicalInterventionExecutionStatus,
  PedagogicalInterventionPriority,
  PedagogicalInterventionRiskLevel,
  PedagogicalInterventionScope,
  PedagogicalInterventionStatus,
  PedagogicalTeacherDecisionType,
} from '@/lib/agenda/evidence-intelligence/pedagogical-intervention.types'

import type {
  PedagogicalInterventionQueryOptions,
} from '@/lib/agenda/repository/pedagogical-interventions.repository'

import {
  requireSessionUser,
} from '@/lib/auth/session'

export const dynamic =
  'force-dynamic'

const NO_CACHE_HEADERS = {
  'Cache-Control':
    'no-store, no-cache, must-revalidate',
}

const FEATURE_CODE =
  'evidences.text'

const DEFAULT_LIMIT =
  50

const MAXIMUM_LIMIT =
  200

const INTERVENTION_STATUSES:
  PedagogicalInterventionStatus[] = [
    'draft',
    'generated',
    'awaiting_teacher_decision',
    'accepted',
    'adapted',
    'rejected',
    'scheduled',
    'in_progress',
    'paused',
    'completed',
    'cancelled',
    'under_evaluation',
    'evaluated',
    'archived',
  ]

const PRIORITIES:
  PedagogicalInterventionPriority[] = [
    'low',
    'moderate',
    'high',
    'urgent',
    'critical',
  ]

const RISK_LEVELS:
  PedagogicalInterventionRiskLevel[] = [
    'none',
    'low',
    'moderate',
    'high',
    'critical',
    'undetermined',
  ]

const SCOPES:
  PedagogicalInterventionScope[] = [
    'individual',
    'small_group',
    'subgroup',
    'class',
    'multiple_classes',
    'school',
    'organization',
    'network',
  ]

const TEACHER_DECISIONS:
  PedagogicalTeacherDecisionType[] = [
    'pending',
    'accepted',
    'adapted',
    'rejected',
  ]

const HUMAN_REVIEW_STATUSES:
  PedagogicalHumanReviewStatus[] = [
    'not_required',
    'pending',
    'in_review',
    'approved',
    'approved_with_changes',
    'changes_requested',
    'rejected',
  ]

const EXECUTION_STATUSES:
  PedagogicalInterventionExecutionStatus[] = [
    'not_started',
    'scheduled',
    'in_progress',
    'partially_completed',
    'completed',
    'paused',
    'cancelled',
    'not_applicable',
  ]

const EVALUATION_STATUSES:
  PedagogicalInterventionEvaluationStatus[] = [
    'not_started',
    'collecting_evidence',
    'under_review',
    'effective',
    'partially_effective',
    'ineffective',
    'inconclusive',
    'requires_continuation',
    'requires_redesign',
  ]

type CreatePedagogicalInterventionRequest = {
  input:
    GeneratePedagogicalInterventionInput

  persistence?: {
    evidenceId?: string | null

    evidenceIntelligenceRunId?:
      string | null

    sourceAnalysisId?:
      string | null

    sourceEventId?:
      string | null

    idempotencyKey?:
      string | null

    requestId?:
      string | null

    sessionId?:
      string | null

    traceId?:
      string | null
  }
}

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

function createPersistenceService(
  request:
    NextRequest,
) {
  const accessToken =
    getAccessToken(request)

  const client =
    createAuthenticatedClient(
      accessToken,
    )

  return createPedagogicalInterventionPersistenceService(
    client,
  )
}

function normalizeOptionalText(
  value:
    string | null | undefined,
): string | null {
  if (!value) {
    return null
  }

  return value.trim() || null
}

function normalizeLimit(
  value:
    string | null,
): number {
  if (
    value === null ||
    value.trim() === ''
  ) {
    return DEFAULT_LIMIT
  }

  const normalizedValue =
    Number(value)

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
    value.trim() === ''
  ) {
    return null
  }

  const normalizedValue =
    value
      .trim()
      .toLowerCase()

  if (
    normalizedValue === 'true' ||
    normalizedValue === '1'
  ) {
    return true
  }

  if (
    normalizedValue === 'false' ||
    normalizedValue === '0'
  ) {
    return false
  }

  throw new Error(
    'O parâmetro booleano deve ser true ou false.',
  )
}

function normalizeEnum<T extends string>(
  value:
    string | null,
  allowedValues:
    readonly T[],
  fieldName:
    string,
): T | null {
  const normalizedValue =
    normalizeOptionalText(value)

  if (!normalizedValue) {
    return null
  }

  if (
    !allowedValues.includes(
      normalizedValue as T,
    )
  ) {
    throw new Error(
      `${fieldName} inválido.`,
    )
  }

  return normalizedValue as T
}

function normalizeRequestBody(
  value: unknown,
): CreatePedagogicalInterventionRequest {
  if (
    !value ||
    typeof value !== 'object'
  ) {
    throw new Error(
      'O corpo da solicitação é inválido.',
    )
  }

  const body =
    value as Partial<
      CreatePedagogicalInterventionRequest
    >

  if (
    !body.input ||
    typeof body.input !== 'object'
  ) {
    throw new Error(
      'O campo input é obrigatório.',
    )
  }

  return {
    input:
      body.input,

    persistence:
      body.persistence &&
      typeof body.persistence ===
        'object'
        ? body.persistence
        : undefined,
  }
}

function getErrorStatus(
  error: unknown,
): number {
  if (
    !(error instanceof Error)
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
      'já possui',
    ) ||
    message.includes(
      'idempotência',
    ) ||
    message.includes(
      'duplic',
    ) ||
    message.includes(
      'alterada por outro processo',
    )
  ) {
    return 409
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
      'deve ser',
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
  error: unknown,
  fallbackMessage: string,
) {
  if (
    isAccessDeniedError(error)
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
    getErrorStatus(error)

  const message =
    status >= 500
      ? fallbackMessage
      : error instanceof Error
        ? error.message
        : fallbackMessage

  return NextResponse.json(
    {
      success:
        false,

      error:
        message,

      meta: {
        generatedAt:
          new Date()
            .toISOString(),
      },
    },
    {
      status,

      headers:
        NO_CACHE_HEADERS,
    },
  )
}

async function requirePedagogicalCopilotAccess() {
  const user =
    await requireSessionUser()

  await requireFeatureAccess({
    userId:
      user.id,

    featureCode:
      FEATURE_CODE,

    options: {
      includeUsage:
        false,
    },
  })

  return user
}

function createQueryOptions(
  request:
    NextRequest,
  userId:
    string,
): PedagogicalInterventionQueryOptions {
  const searchParams =
    request.nextUrl
      .searchParams

  return {
    interventionKey:
      normalizeOptionalText(
        searchParams.get(
          'interventionId',
        ),
      ),

    versionId:
      normalizeOptionalText(
        searchParams.get(
          'versionId',
        ),
      ),

    evidenceId:
      normalizeOptionalText(
        searchParams.get(
          'evidenceId',
        ),
      ),

    evidenceIntelligenceRunId:
      normalizeOptionalText(
        searchParams.get(
          'evidenceIntelligenceRunId',
        ),
      ),

    userId,

    organizationId:
      normalizeOptionalText(
        searchParams.get(
          'organizationId',
        ),
      ),

    schoolId:
      normalizeOptionalText(
        searchParams.get(
          'schoolId',
        ),
      ),

    ownerUserId:
      normalizeOptionalText(
        searchParams.get(
          'ownerUserId',
        ),
      ),

    correlationId:
      normalizeOptionalText(
        searchParams.get(
          'correlationId',
        ),
      ),

    status:
      normalizeEnum(
        searchParams.get(
          'status',
        ),
        INTERVENTION_STATUSES,
        'Status da intervenção',
      ),

    priority:
      normalizeEnum(
        searchParams.get(
          'priority',
        ),
        PRIORITIES,
        'Prioridade',
      ),

    riskLevel:
      normalizeEnum(
        searchParams.get(
          'riskLevel',
        ),
        RISK_LEVELS,
        'Nível de risco',
      ),

    scope:
      normalizeEnum(
        searchParams.get(
          'scope',
        ),
        SCOPES,
        'Escopo',
      ),

    teacherDecision:
      normalizeEnum(
        searchParams.get(
          'teacherDecision',
        ),
        TEACHER_DECISIONS,
        'Decisão docente',
      ),

    humanReviewStatus:
      normalizeEnum(
        searchParams.get(
          'humanReviewStatus',
        ),
        HUMAN_REVIEW_STATUSES,
        'Status da revisão humana',
      ),

    executionStatus:
      normalizeEnum(
        searchParams.get(
          'executionStatus',
        ),
        EXECUTION_STATUSES,
        'Status da execução',
      ),

    evaluationStatus:
      normalizeEnum(
        searchParams.get(
          'evaluationStatus',
        ),
        EVALUATION_STATUSES,
        'Status da avaliação',
      ),

    requiresHumanReview:
      normalizeBoolean(
        searchParams.get(
          'requiresHumanReview',
        ),
      ),

    isCurrentVersion:
      normalizeBoolean(
        searchParams.get(
          'isCurrentVersion',
        ),
      ) ??
      true,

    includeArchived:
      normalizeBoolean(
        searchParams.get(
          'includeArchived',
        ),
      ) ??
      false,

    plannedFrom:
      normalizeOptionalText(
        searchParams.get(
          'plannedFrom',
        ),
      ),

    plannedTo:
      normalizeOptionalText(
        searchParams.get(
          'plannedTo',
        ),
      ),

    limit:
      normalizeLimit(
        searchParams.get(
          'limit',
        ),
      ),
  }
}

export async function GET(
  request:
    NextRequest,
) {
  try {
    const user =
      await requirePedagogicalCopilotAccess()

    const service =
      createPersistenceService(
        request,
      )

    const options =
      createQueryOptions(
        request,
        user.id,
      )

    const interventions =
      await service.findAll(
        options,
      )

    const summaries =
      interventions.map(
        intervention => ({
          id:
            intervention.id,

          versionId:
            intervention.version.id,

          versionNumber:
            intervention.version
              .versionNumber,

          title:
            intervention.context.title,

          summary:
            intervention.context.summary,

          status:
            intervention.status,

          priority:
            intervention.priority,

          riskLevel:
            intervention.diagnostic
              .risk
              .level,

          scope:
            intervention.context
              .audience
              .scope,

          teacherDecision:
            intervention
              .teacherDecision
              .decision,

          humanReviewStatus:
            intervention
              .humanReview
              .status,

          executionStatus:
            intervention.monitoring
              .executionStatus,

          evaluationStatus:
            intervention.effectiveness
              ?.status ??
            'not_started',

          progressPercentage:
            intervention.monitoring
              .progressPercentage,

          plannedStartAt:
            intervention.schedule
              .plannedStartAt,

          plannedEndAt:
            intervention.schedule
              .plannedEndAt,

          createdAt:
            intervention.createdAt,

          updatedAt:
            intervention.updatedAt,
        }),
      )

    return NextResponse.json(
      {
        success:
          true,

        data: {
          interventions,

          summaries,
        },

        filters:
          options,

        meta: {
          returnedItems:
            interventions.length,

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
  } catch (error) {
    console.error(
      '[PEDAGOGICAL_INTERVENTIONS_LIST_ERROR]',
      {
        message:
          error instanceof Error
            ? error.message
            : 'Erro desconhecido.',

        occurredAt:
          new Date()
            .toISOString(),
      },
    )

    return createErrorResponse(
      error,
      'Não foi possível carregar as intervenções pedagógicas.',
    )
  }
}

export async function POST(
  request:
    NextRequest,
) {
  try {
    const user =
      await requirePedagogicalCopilotAccess()

    const body =
      normalizeRequestBody(
        await request.json(),
      )

    const generationInput:
      GeneratePedagogicalInterventionInput = {
      ...body.input,

      requestedByUserId:
        user.id,

      correlationId:
        normalizeOptionalText(
          body.input
            .correlationId,
        ) ??
        `pedagogical-intervention-${crypto.randomUUID()}`,
    }

    const generationResult =
      generatePedagogicalInterventionService(
        generationInput,
      )

    if (
      !generationResult.success ||
      !generationResult.intervention
    ) {
      return NextResponse.json(
        {
          success:
            false,

          error:
            'Não foi possível gerar a intervenção pedagógica.',

          warnings:
            generationResult.warnings,

          errors:
            generationResult.errors,

          logs:
            generationResult.logs,

          meta:
            generationResult.meta,
        },
        {
          status:
            422,

          headers:
            NO_CACHE_HEADERS,
        },
      )
    }

    const persistenceService =
      createPersistenceService(
        request,
      )

    const persistenceContext:
      PersistPedagogicalInterventionContext = {
      userId:
        user.id,

      organizationId:
        normalizeOptionalText(
          generationInput
            .organizationId,
        ),

      schoolId:
        normalizeOptionalText(
          generationInput
            .schoolId,
        ),

      evidenceId:
        normalizeOptionalText(
          body.persistence
            ?.evidenceId,
        ),

      evidenceIntelligenceRunId:
        normalizeOptionalText(
          body.persistence
            ?.evidenceIntelligenceRunId,
        ),

      sourceAnalysisId:
        normalizeOptionalText(
          body.persistence
            ?.sourceAnalysisId,
        ),

      sourceEventId:
        normalizeOptionalText(
          body.persistence
            ?.sourceEventId,
        ),

      idempotencyKey:
        normalizeOptionalText(
          body.persistence
            ?.idempotencyKey,
        ),

      requestId:
        normalizeOptionalText(
          body.persistence
            ?.requestId,
        ),

      sessionId:
        normalizeOptionalText(
          body.persistence
            ?.sessionId,
        ),

      traceId:
        normalizeOptionalText(
          body.persistence
            ?.traceId,
        ),
    }

    const persistenceResult =
      await persistenceService.persist(
        generationResult.intervention,
        persistenceContext,
      )

    return NextResponse.json(
      {
        success:
          true,

        data: {
          intervention:
            persistenceResult
              .intervention,

          summary:
            persistenceResult
              .summary,

          persistence: {
            created:
              persistenceResult
                .created,

            idempotent:
              persistenceResult
                .idempotent,

            databaseId:
              persistenceResult
                .row
                .id,

            versionId:
              persistenceResult
                .row
                .version_id,
          },

          warnings:
            generationResult.warnings,
        },

        meta: {
          correlationId:
            persistenceResult
              .intervention
              .traceability
              .correlationId,

          generatedAt:
            generationResult
              .meta
              .generatedAt,

          persistedAt:
            persistenceResult
              .row
              .created_at,
        },
      },
      {
        status:
          persistenceResult.created
            ? 201
            : 200,

        headers:
          NO_CACHE_HEADERS,
      },
    )
  } catch (error) {
    console.error(
      '[PEDAGOGICAL_INTERVENTION_CREATE_ERROR]',
      {
        message:
          error instanceof Error
            ? error.message
            : 'Erro desconhecido.',

        occurredAt:
          new Date()
            .toISOString(),
      },
    )

    return createErrorResponse(
      error,
      'Não foi possível gerar e persistir a intervenção pedagógica.',
    )
  }
}