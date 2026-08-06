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
  createPedagogicalInterventionPersistenceService,
  type RecordHumanReviewPersistenceInput,
  type RecordTeacherDecisionPersistenceInput,
} from '@/lib/agenda/evidence-intelligence/pedagogical-intervention.persistence.service'

import type {
  PedagogicalHumanReviewerRole,
  PedagogicalHumanReviewStatus,
  PedagogicalTeacherDecisionType,
} from '@/lib/agenda/evidence-intelligence/pedagogical-intervention.types'

import {
  requireSessionUser,
} from '@/lib/auth/session'

export const dynamic =
  'force-dynamic'

type RouteContext = {
  params: {
    id: string
  }
}

type TeacherDecisionAction = {
  action:
    'teacher_decision'

  decision:
    Exclude<
      PedagogicalTeacherDecisionType,
      'pending'
    >

  rationale: string

  adaptations?: string[]

  acceptedRecommendations?: string[]

  rejectedRecommendations?: string[]

  professionalNotes?: string[]

  expectedVersionId?: string | null

  occurredAt?: string
}

type HumanReviewAction = {
  action:
    'human_review'

  status:
    Exclude<
      PedagogicalHumanReviewStatus,
      | 'not_required'
      | 'pending'
      | 'in_review'
    >

  reviewerRole:
    PedagogicalHumanReviewerRole

  summary: string

  comments?: string[]

  requestedChanges?: string[]

  approvedElements?: string[]

  rejectedElements?: string[]

  limitationsAcknowledged:
    boolean

  professionalResponsibilityConfirmed:
    boolean

  expectedVersionId?: string | null

  occurredAt?: string
}

type ArchiveAction = {
  action:
    'archive'
}

type PatchRequest =
  | TeacherDecisionAction
  | HumanReviewAction
  | ArchiveAction

const NO_CACHE_HEADERS = {
  'Cache-Control':
    'no-store, no-cache, must-revalidate',
}

const FEATURE_CODE =
  'evidences.text'

const TEACHER_DECISIONS:
  Array<
    Exclude<
      PedagogicalTeacherDecisionType,
      'pending'
    >
  > = [
    'accepted',
    'adapted',
    'rejected',
  ]

const HUMAN_REVIEW_STATUSES:
  Array<
    Exclude<
      PedagogicalHumanReviewStatus,
      | 'not_required'
      | 'pending'
      | 'in_review'
    >
  > = [
    'approved',
    'approved_with_changes',
    'changes_requested',
    'rejected',
  ]

const HUMAN_REVIEWER_ROLES:
  PedagogicalHumanReviewerRole[] = [
    'teacher',
    'coordinator',
    'director',
    'supervisor',
    'specialized_professional',
    'administrator',
    'researcher',
    'other',
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

function normalizeRequiredText(
  value:
    string | null | undefined,
  fieldName:
    string,
): string {
  const normalizedValue =
    value?.trim()

  if (!normalizedValue) {
    throw new Error(
      `${fieldName} é obrigatório.`,
    )
  }

  return normalizedValue
}

function normalizeOptionalText(
  value:
    string | null | undefined,
): string | null {
  if (
    value === undefined ||
    value === null
  ) {
    return null
  }

  return value.trim() || null
}

function normalizeStringArray(
  value: unknown,
  fieldName: string,
): string[] {
  if (value === undefined) {
    return []
  }

  if (!Array.isArray(value)) {
    throw new Error(
      `${fieldName} deve ser uma lista.`,
    )
  }

  return Array.from(
    new Set(
      value
        .filter(
          (
            item,
          ): item is string =>
            typeof item === 'string',
        )
        .map(
          item =>
            item.trim(),
        )
        .filter(Boolean),
    ),
  )
}

function normalizeBoolean(
  value: unknown,
  fieldName: string,
): boolean {
  if (typeof value !== 'boolean') {
    throw new Error(
      `${fieldName} deve ser verdadeiro ou falso.`,
    )
  }

  return value
}

function normalizeInterventionId(
  value:
    string | undefined,
): string {
  const normalizedValue =
    value?.trim()

  if (!normalizedValue) {
    throw new Error(
      'Identificador da intervenção inválido.',
    )
  }

  if (
    normalizedValue.length >
    180
  ) {
    throw new Error(
      'Identificador da intervenção inválido.',
    )
  }

  return normalizedValue
}

function normalizeIncludeHistory(
  value:
    string | null,
): boolean {
  if (
    value === null ||
    value.trim() === ''
  ) {
    return false
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
    'O parâmetro includeHistory deve ser true ou false.',
  )
}

function normalizeTeacherDecision(
  value: unknown,
): Exclude<
  PedagogicalTeacherDecisionType,
  'pending'
> {
  if (
    typeof value !== 'string' ||
    !TEACHER_DECISIONS.includes(
      value as Exclude<
        PedagogicalTeacherDecisionType,
        'pending'
      >,
    )
  ) {
    throw new Error(
      'Decisão docente inválida.',
    )
  }

  return value as Exclude<
    PedagogicalTeacherDecisionType,
    'pending'
  >
}

function normalizeHumanReviewStatus(
  value: unknown,
): Exclude<
  PedagogicalHumanReviewStatus,
  | 'not_required'
  | 'pending'
  | 'in_review'
> {
  if (
    typeof value !== 'string' ||
    !HUMAN_REVIEW_STATUSES.includes(
      value as Exclude<
        PedagogicalHumanReviewStatus,
        | 'not_required'
        | 'pending'
        | 'in_review'
      >,
    )
  ) {
    throw new Error(
      'Status da revisão humana inválido.',
    )
  }

  return value as Exclude<
    PedagogicalHumanReviewStatus,
    | 'not_required'
    | 'pending'
    | 'in_review'
  >
}

function normalizeReviewerRole(
  value: unknown,
): PedagogicalHumanReviewerRole {
  if (
    typeof value !== 'string' ||
    !HUMAN_REVIEWER_ROLES.includes(
      value as
        PedagogicalHumanReviewerRole,
    )
  ) {
    throw new Error(
      'Papel do revisor inválido.',
    )
  }

  return value as
    PedagogicalHumanReviewerRole
}

function normalizeOccurredAt(
  value: unknown,
): string | undefined {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return undefined
  }

  if (
    typeof value !== 'string' ||
    Number.isNaN(
      Date.parse(value),
    )
  ) {
    throw new Error(
      'A data informada é inválida.',
    )
  }

  return new Date(value)
    .toISOString()
}

function normalizePatchBody(
  value: unknown,
): PatchRequest {
  if (
    !value ||
    typeof value !== 'object'
  ) {
    throw new Error(
      'O corpo da solicitação é inválido.',
    )
  }

  const body =
    value as Record<
      string,
      unknown
    >

  if (
    body.action ===
    'teacher_decision'
  ) {
    return {
      action:
        'teacher_decision',

      decision:
        normalizeTeacherDecision(
          body.decision,
        ),

      rationale:
        normalizeRequiredText(
          typeof body.rationale ===
            'string'
            ? body.rationale
            : null,
          'Justificativa da decisão',
        ),

      adaptations:
        normalizeStringArray(
          body.adaptations,
          'Adaptações',
        ),

      acceptedRecommendations:
        normalizeStringArray(
          body.acceptedRecommendations,
          'Recomendações aceitas',
        ),

      rejectedRecommendations:
        normalizeStringArray(
          body.rejectedRecommendations,
          'Recomendações rejeitadas',
        ),

      professionalNotes:
        normalizeStringArray(
          body.professionalNotes,
          'Observações profissionais',
        ),

      expectedVersionId:
        normalizeOptionalText(
          typeof body.expectedVersionId ===
            'string'
            ? body.expectedVersionId
            : null,
        ),

      occurredAt:
        normalizeOccurredAt(
          body.occurredAt,
        ),
    }
  }

  if (
    body.action ===
    'human_review'
  ) {
    return {
      action:
        'human_review',

      status:
        normalizeHumanReviewStatus(
          body.status,
        ),

      reviewerRole:
        normalizeReviewerRole(
          body.reviewerRole,
        ),

      summary:
        normalizeRequiredText(
          typeof body.summary ===
            'string'
            ? body.summary
            : null,
          'Resumo da revisão',
        ),

      comments:
        normalizeStringArray(
          body.comments,
          'Comentários',
        ),

      requestedChanges:
        normalizeStringArray(
          body.requestedChanges,
          'Alterações solicitadas',
        ),

      approvedElements:
        normalizeStringArray(
          body.approvedElements,
          'Elementos aprovados',
        ),

      rejectedElements:
        normalizeStringArray(
          body.rejectedElements,
          'Elementos rejeitados',
        ),

      limitationsAcknowledged:
        normalizeBoolean(
          body.limitationsAcknowledged,
          'Confirmação das limitações',
        ),

      professionalResponsibilityConfirmed:
        normalizeBoolean(
          body.professionalResponsibilityConfirmed,
          'Confirmação da responsabilidade profissional',
        ),

      expectedVersionId:
        normalizeOptionalText(
          typeof body.expectedVersionId ===
            'string'
            ? body.expectedVersionId
            : null,
        ),

      occurredAt:
        normalizeOccurredAt(
          body.occurredAt,
        ),
    }
  }

  if (
    body.action === 'archive'
  ) {
    return {
      action:
        'archive',
    }
  }

  throw new Error(
    'Ação de atualização inválida.',
  )
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
      'já possui',
    ) ||
    message.includes(
      'alterada por outro processo',
    ) ||
    message.includes(
      'conflito',
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
      'deve estar',
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

export async function GET(
  request:
    NextRequest,
  context:
    RouteContext,
) {
  try {
    await requirePedagogicalCopilotAccess()

    const interventionId =
      normalizeInterventionId(
        context.params.id,
      )

    const includeHistory =
      normalizeIncludeHistory(
        request.nextUrl
          .searchParams
          .get(
            'includeHistory',
          ),
      )

    const service =
      createPersistenceService(
        request,
      )

    if (includeHistory) {
      const result =
        await service.findHistory(
          interventionId,
        )

      if (
        !result.current &&
        result.versions.length === 0
      ) {
        throw new Error(
          'Intervenção pedagógica não encontrada.',
        )
      }

      return NextResponse.json(
        {
          success:
            true,

          data: {
            current:
              result.current,

            versions:
              result.versions,

            history:
              result.history,
          },

          meta: {
            interventionId,

            includeHistory:
              true,

            returnedVersions:
              result.versions.length,

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
    }

    const intervention =
      await service.findCurrent(
        interventionId,
      )

    if (!intervention) {
      throw new Error(
        'Intervenção pedagógica não encontrada.',
      )
    }

    return NextResponse.json(
      {
        success:
          true,

        data: {
          intervention,
        },

        meta: {
          interventionId,

          includeHistory:
            false,

          versionId:
            intervention.version.id,

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
      '[PEDAGOGICAL_INTERVENTION_GET_ERROR]',
      {
        interventionId:
          context.params.id,

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
      'Não foi possível carregar a intervenção pedagógica.',
    )
  }
}

export async function PATCH(
  request:
    NextRequest,
  context:
    RouteContext,
) {
  try {
    const user =
      await requirePedagogicalCopilotAccess()

    const interventionId =
      normalizeInterventionId(
        context.params.id,
      )

    const body =
      normalizePatchBody(
        await request.json(),
      )

    const service =
      createPersistenceService(
        request,
      )

    if (
      body.action ===
      'teacher_decision'
    ) {
      const input:
        RecordTeacherDecisionPersistenceInput = {
        interventionId,

        teacherId:
          user.id,

        decision:
          body.decision,

        rationale:
          body.rationale,

        adaptations:
          body.adaptations,

        acceptedRecommendations:
          body.acceptedRecommendations,

        rejectedRecommendations:
          body.rejectedRecommendations,

        professionalNotes:
          body.professionalNotes,

        expectedVersionId:
          body.expectedVersionId,

        occurredAt:
          body.occurredAt,
      }

      const intervention =
        await service
          .recordTeacherDecision(
            input,
          )

      return NextResponse.json(
        {
          success:
            true,

          data: {
            intervention,

            operation: {
              action:
                body.action,

              decision:
                body.decision,

              recordedBy:
                user.id,

              recordedAt:
                intervention
                  .teacherDecision
                  .decidedAt,
            },
          },

          meta: {
            interventionId,

            versionId:
              intervention.version.id,

            updatedAt:
              intervention.updatedAt,
          },
        },
        {
          status:
            200,

          headers:
            NO_CACHE_HEADERS,
        },
      )
    }

    if (
      body.action ===
      'human_review'
    ) {
      const input:
        RecordHumanReviewPersistenceInput = {
        interventionId,

        reviewerId:
          user.id,

        reviewerRole:
          body.reviewerRole,

        status:
          body.status,

        summary:
          body.summary,

        comments:
          body.comments,

        requestedChanges:
          body.requestedChanges,

        approvedElements:
          body.approvedElements,

        rejectedElements:
          body.rejectedElements,

        limitationsAcknowledged:
          body.limitationsAcknowledged,

        professionalResponsibilityConfirmed:
          body
            .professionalResponsibilityConfirmed,

        expectedVersionId:
          body.expectedVersionId,

        occurredAt:
          body.occurredAt,
      }

      const intervention =
        await service
          .recordHumanReview(
            input,
          )

      return NextResponse.json(
        {
          success:
            true,

          data: {
            intervention,

            operation: {
              action:
                body.action,

              status:
                body.status,

              reviewerRole:
                body.reviewerRole,

              recordedBy:
                user.id,

              recordedAt:
                intervention
                  .humanReview
                  .completedAt,
            },
          },

          meta: {
            interventionId,

            versionId:
              intervention.version.id,

            updatedAt:
              intervention.updatedAt,
          },
        },
        {
          status:
            200,

          headers:
            NO_CACHE_HEADERS,
        },
      )
    }

    const intervention =
      await service.archive(
        interventionId,
        user.id,
      )

    return NextResponse.json(
      {
        success:
          true,

        data: {
          intervention,

          operation: {
            action:
              'archive',

            archivedBy:
              user.id,

            archivedAt:
              intervention.archivedAt,
          },
        },

        meta: {
          interventionId,

          versionId:
            intervention.version.id,

          updatedAt:
            intervention.updatedAt,
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
      '[PEDAGOGICAL_INTERVENTION_PATCH_ERROR]',
      {
        interventionId:
          context.params.id,

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
      'Não foi possível atualizar a intervenção pedagógica.',
    )
  }
}