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
  createPedagogicalInterventionLongitudinalService,
  type CompletePedagogicalCheckpointInput,
  type EvaluatePedagogicalInterventionInput,
  type RecordPedagogicalProgressInput,
  type StartPedagogicalInterventionInput,
  type UpdatePedagogicalIndicatorInput,
  type UpdatePedagogicalSuccessCriterionInput,
} from '@/lib/agenda/evidence-intelligence/pedagogical-intervention.longitudinal.service'

import {
  createPedagogicalInterventionPersistenceService,
  type RecordHumanReviewPersistenceInput,
  type RecordTeacherDecisionPersistenceInput,
} from '@/lib/agenda/evidence-intelligence/pedagogical-intervention.persistence.service'

import type {
  PedagogicalCheckpointStatus,
  PedagogicalHumanReviewerRole,
  PedagogicalHumanReviewStatus,
  PedagogicalInterventionEffect,
  PedagogicalInterventionEvaluationStatus,
  PedagogicalProgressLevel,
  PedagogicalSuccessCriterionStatus,
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

type StartAction = {
  action:
    'start'

  nextMonitoringAt?: string | null

  notes?: string[]

  occurredAt?: string
}

type RecordProgressAction = {
  action:
    'record_progress'

  progressLevel:
    PedagogicalProgressLevel

  progressPercentage:
    number

  summary:
    string

  achievements?: string[]

  difficulties?: string[]

  unexpectedEffects?: string[]

  actionIds?: string[]

  objectiveIds?: string[]

  indicatorIds?: string[]

  evidenceIds?: string[]

  teacherObservations?: string[]

  studentFeedback?: string[]

  recommendedAdjustments?: string[]

  currentChallenges?: string[]

  currentStrengths?: string[]

  adjustmentsMade?: string[]

  nextActions?: string[]

  nextMonitoringAt?: string | null

  occurredAt?: string

  expectedVersionId?: string | null
}

type CompleteCheckpointAction = {
  action:
    'complete_checkpoint'

  checkpointId:
    string

  status?:
    Extract<
      PedagogicalCheckpointStatus,
      | 'completed'
      | 'cancelled'
      | 'rescheduled'
    >

  findings?: string[]

  decisions?: string[]

  nextActions?: string[]

  notes?: string | null

  completedAt?: string

  expectedVersionId?: string | null
}

type UpdateIndicatorAction = {
  action:
    'update_indicator'

  indicatorId:
    string

  currentValue:
    number | string | boolean | null

  measuredAt?: string

  nextMeasurementAt?: string | null

  metadata?:
    Record<string, unknown>

  expectedVersionId?: string | null
}

type UpdateSuccessCriterionAction = {
  action:
    'update_success_criterion'

  criterionId:
    string

  observedValue:
    number | string | boolean | null

  status:
    PedagogicalSuccessCriterionStatus

  evaluationNotes?: string | null

  metadata?:
    Record<string, unknown>

  occurredAt?: string

  expectedVersionId?: string | null
}

type EvaluateAction = {
  action:
    'evaluate'

  status:
    Exclude<
      PedagogicalInterventionEvaluationStatus,
      | 'not_started'
      | 'collecting_evidence'
      | 'under_review'
    >

  effect:
    PedagogicalInterventionEffect

  effectivenessScore?: number | null

  confidenceScore?: number | null

  summary:
    string

  achievedObjectives?: string[]

  partiallyAchievedObjectives?: string[]

  unachievedObjectives?: string[]

  successfulActions?: string[]

  ineffectiveActions?: string[]

  evidenceIds?: string[]

  positiveOutcomes?: string[]

  negativeOutcomes?: string[]

  unintendedOutcomes?: string[]

  contributingFactors?: string[]

  limitingFactors?: string[]

  continuationRecommendations?: string[]

  redesignRecommendations?: string[]

  requiresHumanValidation?: boolean

  occurredAt?: string

  expectedVersionId?: string | null
}

type ArchiveAction = {
  action:
    'archive'
}

type PatchRequest =
  | TeacherDecisionAction
  | HumanReviewAction
  | StartAction
  | RecordProgressAction
  | CompleteCheckpointAction
  | UpdateIndicatorAction
  | UpdateSuccessCriterionAction
  | EvaluateAction
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

const PROGRESS_LEVELS:
  PedagogicalProgressLevel[] = [
    'not_observed',
    'insufficient',
    'initial',
    'developing',
    'adequate',
    'advanced',
  ]

const CHECKPOINT_COMPLETION_STATUSES:
  Array<
    Extract<
      PedagogicalCheckpointStatus,
      | 'completed'
      | 'cancelled'
      | 'rescheduled'
    >
  > = [
    'completed',
    'cancelled',
    'rescheduled',
  ]

const SUCCESS_CRITERION_STATUSES:
  PedagogicalSuccessCriterionStatus[] = [
    'not_evaluated',
    'achieved',
    'partially_achieved',
    'not_achieved',
    'inconclusive',
  ]

const FINAL_EVALUATION_STATUSES:
  Array<
    Exclude<
      PedagogicalInterventionEvaluationStatus,
      | 'not_started'
      | 'collecting_evidence'
      | 'under_review'
    >
  > = [
    'effective',
    'partially_effective',
    'ineffective',
    'inconclusive',
    'requires_continuation',
    'requires_redesign',
  ]

const INTERVENTION_EFFECTS:
  PedagogicalInterventionEffect[] = [
    'positive',
    'neutral',
    'negative',
    'mixed',
    'not_determined',
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

function createServices(
  request:
    NextRequest,
) {
  const accessToken =
    getAccessToken(
      request,
    )

  const client =
    createAuthenticatedClient(
      accessToken,
    )

  return {
    persistence:
      createPedagogicalInterventionPersistenceService(
        client,
      ),

    longitudinal:
      createPedagogicalInterventionLongitudinalService(
        client,
      ),
  }
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
  value:
    unknown,
  fieldName:
    string,
): string[] {
  if (
    value === undefined ||
    value === null
  ) {
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
            typeof item ===
            'string',
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
  value:
    unknown,
  fieldName:
    string,
): boolean {
  if (
    typeof value !==
    'boolean'
  ) {
    throw new Error(
      `${fieldName} deve ser verdadeiro ou falso.`,
    )
  }

  return value
}

function normalizeOptionalBoolean(
  value:
    unknown,
  fieldName:
    string,
): boolean | undefined {
  if (
    value === undefined ||
    value === null
  ) {
    return undefined
  }

  return normalizeBoolean(
    value,
    fieldName,
  )
}

function normalizeNumber(
  value:
    unknown,
  fieldName:
    string,
): number {
  if (
    typeof value !==
      'number' ||
    !Number.isFinite(value)
  ) {
    throw new Error(
      `${fieldName} deve ser um número válido.`,
    )
  }

  return value
}

function normalizeOptionalScore(
  value:
    unknown,
  fieldName:
    string,
): number | null | undefined {
  if (value === undefined) {
    return undefined
  }

  if (value === null) {
    return null
  }

  const normalized =
    normalizeNumber(
      value,
      fieldName,
    )

  if (
    normalized < 0 ||
    normalized > 1
  ) {
    throw new Error(
      `${fieldName} deve estar entre 0 e 1.`,
    )
  }

  return normalized
}

function normalizePercentage(
  value:
    unknown,
): number {
  const normalized =
    normalizeNumber(
      value,
      'Percentual de progresso',
    )

  if (
    normalized < 0 ||
    normalized > 100
  ) {
    throw new Error(
      'O percentual de progresso deve estar entre 0 e 100.',
    )
  }

  return normalized
}

function normalizeRecord(
  value:
    unknown,
  fieldName:
    string,
): Record<string, unknown> {
  if (
    value === undefined ||
    value === null
  ) {
    return {}
  }

  if (
    typeof value !==
      'object' ||
    Array.isArray(value)
  ) {
    throw new Error(
      `${fieldName} deve ser um objeto.`,
    )
  }

  return value as
    Record<string, unknown>
}

function normalizeScalarValue(
  value:
    unknown,
  fieldName:
    string,
): number | string | boolean | null {
  if (
    value === null ||
    typeof value ===
      'number' ||
    typeof value ===
      'string' ||
    typeof value ===
      'boolean'
  ) {
    return value
  }

  throw new Error(
    `${fieldName} deve ser texto, número, verdadeiro, falso ou nulo.`,
  )
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
    'O parâmetro includeHistory deve ser true ou false.',
  )
}

function normalizeOccurredAt(
  value:
    unknown,
): string | undefined {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return undefined
  }

  if (
    typeof value !==
      'string' ||
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

function normalizeNullableDate(
  value:
    unknown,
  fieldName:
    string,
): string | null | undefined {
  if (value === undefined) {
    return undefined
  }

  if (
    value === null ||
    value === ''
  ) {
    return null
  }

  if (
    typeof value !==
      'string' ||
    Number.isNaN(
      Date.parse(value),
    )
  ) {
    throw new Error(
      `${fieldName} é inválida.`,
    )
  }

  return new Date(value)
    .toISOString()
}

function normalizeEnum<
  T extends string,
>(
  value:
    unknown,
  allowedValues:
    readonly T[],
  fieldName:
    string,
): T {
  if (
    typeof value !==
      'string' ||
    !allowedValues.includes(
      value as T,
    )
  ) {
    throw new Error(
      `${fieldName} inválido.`,
    )
  }

  return value as T
}

function normalizeOptionalEnum<
  T extends string,
>(
  value:
    unknown,
  allowedValues:
    readonly T[],
  fieldName:
    string,
): T | undefined {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return undefined
  }

  return normalizeEnum(
    value,
    allowedValues,
    fieldName,
  )
}

function normalizeExpectedVersionId(
  value:
    unknown,
): string | null {
  return normalizeOptionalText(
    typeof value ===
      'string'
      ? value
      : null,
  )
}

function normalizePatchBody(
  value:
    unknown,
): PatchRequest {
  if (
    !value ||
    typeof value !==
      'object' ||
    Array.isArray(value)
  ) {
    throw new Error(
      'O corpo da solicitação é inválido.',
    )
  }

  const body =
    value as
      Record<string, unknown>

  if (
    body.action ===
    'teacher_decision'
  ) {
    return {
      action:
        'teacher_decision',

      decision:
        normalizeEnum(
          body.decision,
          TEACHER_DECISIONS,
          'Decisão docente',
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
          body
            .acceptedRecommendations,
          'Recomendações aceitas',
        ),

      rejectedRecommendations:
        normalizeStringArray(
          body
            .rejectedRecommendations,
          'Recomendações rejeitadas',
        ),

      professionalNotes:
        normalizeStringArray(
          body.professionalNotes,
          'Observações profissionais',
        ),

      expectedVersionId:
        normalizeExpectedVersionId(
          body.expectedVersionId,
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
        normalizeEnum(
          body.status,
          HUMAN_REVIEW_STATUSES,
          'Status da revisão humana',
        ),

      reviewerRole:
        normalizeEnum(
          body.reviewerRole,
          HUMAN_REVIEWER_ROLES,
          'Papel do revisor',
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
          body
            .limitationsAcknowledged,
          'Confirmação das limitações',
        ),

      professionalResponsibilityConfirmed:
        normalizeBoolean(
          body
            .professionalResponsibilityConfirmed,
          'Confirmação da responsabilidade profissional',
        ),

      expectedVersionId:
        normalizeExpectedVersionId(
          body.expectedVersionId,
        ),

      occurredAt:
        normalizeOccurredAt(
          body.occurredAt,
        ),
    }
  }

  if (
    body.action ===
    'start'
  ) {
    return {
      action:
        'start',

      nextMonitoringAt:
        normalizeNullableDate(
          body.nextMonitoringAt,
          'Próximo monitoramento',
        ),

      notes:
        normalizeStringArray(
          body.notes,
          'Observações',
        ),

      occurredAt:
        normalizeOccurredAt(
          body.occurredAt,
        ),
    }
  }

  if (
    body.action ===
    'record_progress'
  ) {
    return {
      action:
        'record_progress',

      progressLevel:
        normalizeEnum(
          body.progressLevel,
          PROGRESS_LEVELS,
          'Nível de progresso',
        ),

      progressPercentage:
        normalizePercentage(
          body.progressPercentage,
        ),

      summary:
        normalizeRequiredText(
          typeof body.summary ===
            'string'
            ? body.summary
            : null,
          'Resumo do progresso',
        ),

      achievements:
        normalizeStringArray(
          body.achievements,
          'Avanços',
        ),

      difficulties:
        normalizeStringArray(
          body.difficulties,
          'Dificuldades',
        ),

      unexpectedEffects:
        normalizeStringArray(
          body.unexpectedEffects,
          'Efeitos inesperados',
        ),

      actionIds:
        normalizeStringArray(
          body.actionIds,
          'IDs das ações',
        ),

      objectiveIds:
        normalizeStringArray(
          body.objectiveIds,
          'IDs dos objetivos',
        ),

      indicatorIds:
        normalizeStringArray(
          body.indicatorIds,
          'IDs dos indicadores',
        ),

      evidenceIds:
        normalizeStringArray(
          body.evidenceIds,
          'IDs das evidências',
        ),

      teacherObservations:
        normalizeStringArray(
          body.teacherObservations,
          'Observações do professor',
        ),

      studentFeedback:
        normalizeStringArray(
          body.studentFeedback,
          'Devolutivas dos estudantes',
        ),

      recommendedAdjustments:
        normalizeStringArray(
          body.recommendedAdjustments,
          'Ajustes recomendados',
        ),

      currentChallenges:
        normalizeStringArray(
          body.currentChallenges,
          'Desafios atuais',
        ),

      currentStrengths:
        normalizeStringArray(
          body.currentStrengths,
          'Forças atuais',
        ),

      adjustmentsMade:
        normalizeStringArray(
          body.adjustmentsMade,
          'Ajustes realizados',
        ),

      nextActions:
        normalizeStringArray(
          body.nextActions,
          'Próximas ações',
        ),

      nextMonitoringAt:
        normalizeNullableDate(
          body.nextMonitoringAt,
          'Próximo monitoramento',
        ),

      occurredAt:
        normalizeOccurredAt(
          body.occurredAt,
        ),

      expectedVersionId:
        normalizeExpectedVersionId(
          body.expectedVersionId,
        ),
    }
  }

  if (
    body.action ===
    'complete_checkpoint'
  ) {
    return {
      action:
        'complete_checkpoint',

      checkpointId:
        normalizeRequiredText(
          typeof body.checkpointId ===
            'string'
            ? body.checkpointId
            : null,
          'ID do checkpoint',
        ),

      status:
        normalizeOptionalEnum(
          body.status,
          CHECKPOINT_COMPLETION_STATUSES,
          'Status do checkpoint',
        ),

      findings:
        normalizeStringArray(
          body.findings,
          'Constatações',
        ),

      decisions:
        normalizeStringArray(
          body.decisions,
          'Decisões',
        ),

      nextActions:
        normalizeStringArray(
          body.nextActions,
          'Próximas ações',
        ),

      notes:
        normalizeOptionalText(
          typeof body.notes ===
            'string'
            ? body.notes
            : null,
        ),

      completedAt:
        normalizeOccurredAt(
          body.completedAt,
        ),

      expectedVersionId:
        normalizeExpectedVersionId(
          body.expectedVersionId,
        ),
    }
  }

  if (
    body.action ===
    'update_indicator'
  ) {
    return {
      action:
        'update_indicator',

      indicatorId:
        normalizeRequiredText(
          typeof body.indicatorId ===
            'string'
            ? body.indicatorId
            : null,
          'ID do indicador',
        ),

      currentValue:
        normalizeScalarValue(
          body.currentValue,
          'Valor atual do indicador',
        ),

      measuredAt:
        normalizeOccurredAt(
          body.measuredAt,
        ),

      nextMeasurementAt:
        normalizeNullableDate(
          body.nextMeasurementAt,
          'Próxima medição',
        ),

      metadata:
        normalizeRecord(
          body.metadata,
          'Metadados do indicador',
        ),

      expectedVersionId:
        normalizeExpectedVersionId(
          body.expectedVersionId,
        ),
    }
  }

  if (
    body.action ===
    'update_success_criterion'
  ) {
    return {
      action:
        'update_success_criterion',

      criterionId:
        normalizeRequiredText(
          typeof body.criterionId ===
            'string'
            ? body.criterionId
            : null,
          'ID do critério de sucesso',
        ),

      observedValue:
        normalizeScalarValue(
          body.observedValue,
          'Valor observado',
        ),

      status:
        normalizeEnum(
          body.status,
          SUCCESS_CRITERION_STATUSES,
          'Status do critério de sucesso',
        ),

      evaluationNotes:
        normalizeOptionalText(
          typeof body.evaluationNotes ===
            'string'
            ? body.evaluationNotes
            : null,
        ),

      metadata:
        normalizeRecord(
          body.metadata,
          'Metadados do critério',
        ),

      occurredAt:
        normalizeOccurredAt(
          body.occurredAt,
        ),

      expectedVersionId:
        normalizeExpectedVersionId(
          body.expectedVersionId,
        ),
    }
  }

  if (
    body.action ===
    'evaluate'
  ) {
    return {
      action:
        'evaluate',

      status:
        normalizeEnum(
          body.status,
          FINAL_EVALUATION_STATUSES,
          'Status da avaliação',
        ),

      effect:
        normalizeEnum(
          body.effect,
          INTERVENTION_EFFECTS,
          'Efeito da intervenção',
        ),

      effectivenessScore:
        normalizeOptionalScore(
          body.effectivenessScore,
          'Pontuação de efetividade',
        ),

      confidenceScore:
        normalizeOptionalScore(
          body.confidenceScore,
          'Pontuação de confiança',
        ),

      summary:
        normalizeRequiredText(
          typeof body.summary ===
            'string'
            ? body.summary
            : null,
          'Resumo da avaliação',
        ),

      achievedObjectives:
        normalizeStringArray(
          body.achievedObjectives,
          'Objetivos alcançados',
        ),

      partiallyAchievedObjectives:
        normalizeStringArray(
          body
            .partiallyAchievedObjectives,
          'Objetivos parcialmente alcançados',
        ),

      unachievedObjectives:
        normalizeStringArray(
          body.unachievedObjectives,
          'Objetivos não alcançados',
        ),

      successfulActions:
        normalizeStringArray(
          body.successfulActions,
          'Ações bem-sucedidas',
        ),

      ineffectiveActions:
        normalizeStringArray(
          body.ineffectiveActions,
          'Ações ineficazes',
        ),

      evidenceIds:
        normalizeStringArray(
          body.evidenceIds,
          'Evidências da avaliação',
        ),

      positiveOutcomes:
        normalizeStringArray(
          body.positiveOutcomes,
          'Resultados positivos',
        ),

      negativeOutcomes:
        normalizeStringArray(
          body.negativeOutcomes,
          'Resultados negativos',
        ),

      unintendedOutcomes:
        normalizeStringArray(
          body.unintendedOutcomes,
          'Resultados não previstos',
        ),

      contributingFactors:
        normalizeStringArray(
          body.contributingFactors,
          'Fatores contribuintes',
        ),

      limitingFactors:
        normalizeStringArray(
          body.limitingFactors,
          'Fatores limitantes',
        ),

      continuationRecommendations:
        normalizeStringArray(
          body
            .continuationRecommendations,
          'Recomendações de continuidade',
        ),

      redesignRecommendations:
        normalizeStringArray(
          body.redesignRecommendations,
          'Recomendações de reformulação',
        ),

      requiresHumanValidation:
        normalizeOptionalBoolean(
          body.requiresHumanValidation,
          'Validação humana',
        ),

      occurredAt:
        normalizeOccurredAt(
          body.occurredAt,
        ),

      expectedVersionId:
        normalizeExpectedVersionId(
          body.expectedVersionId,
        ),
    }
  }

  if (
    body.action ===
    'archive'
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
  error:
    unknown,
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
    ) ||
    message.includes(
      'já foi concluída',
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
    ) ||
    message.includes(
      'não pode ser',
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

    const {
      persistence,
    } = createServices(
      request,
    )

    if (includeHistory) {
      const result =
        await persistence
          .findHistory(
            interventionId,
          )

      if (
        !result.current &&
        result.versions.length ===
          0
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
      await persistence
        .findCurrent(
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
            intervention
              .version.id,

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

    const {
      persistence,
      longitudinal,
    } = createServices(
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
          body
            .acceptedRecommendations,

        rejectedRecommendations:
          body
            .rejectedRecommendations,

        professionalNotes:
          body.professionalNotes,

        expectedVersionId:
          body.expectedVersionId,

        occurredAt:
          body.occurredAt,
      }

      const intervention =
        await persistence
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
              intervention
                .version.id,

            updatedAt:
              intervention
                .updatedAt,
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
          body
            .limitationsAcknowledged,

        professionalResponsibilityConfirmed:
          body
            .professionalResponsibilityConfirmed,

        expectedVersionId:
          body.expectedVersionId,

        occurredAt:
          body.occurredAt,
      }

      const intervention =
        await persistence
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
              intervention
                .version.id,

            updatedAt:
              intervention
                .updatedAt,
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
      'start'
    ) {
      const input:
        StartPedagogicalInterventionInput = {
        interventionId,

        actorId:
          user.id,

        nextMonitoringAt:
          body.nextMonitoringAt,

        notes:
          body.notes,

        occurredAt:
          body.occurredAt,
      }

      const result =
        await longitudinal.start(
          input,
        )

      return NextResponse.json(
        {
          success:
            true,

          data: {
            intervention:
              result.intervention,

            operation: {
              action:
                body.action,

              type:
                result.operation,

              recordedBy:
                user.id,

              occurredAt:
                result.occurredAt,
            },
          },

          meta: {
            interventionId,

            versionId:
              result.intervention
                .version.id,

            updatedAt:
              result.intervention
                .updatedAt,
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
      'record_progress'
    ) {
      const input:
        RecordPedagogicalProgressInput = {
        interventionId,

        actorId:
          user.id,

        progressLevel:
          body.progressLevel,

        progressPercentage:
          body.progressPercentage,

        summary:
          body.summary,

        achievements:
          body.achievements,

        difficulties:
          body.difficulties,

        unexpectedEffects:
          body.unexpectedEffects,

        actionIds:
          body.actionIds,

        objectiveIds:
          body.objectiveIds,

        indicatorIds:
          body.indicatorIds,

        evidenceIds:
          body.evidenceIds,

        teacherObservations:
          body.teacherObservations,

        studentFeedback:
          body.studentFeedback,

        recommendedAdjustments:
          body
            .recommendedAdjustments,

        currentChallenges:
          body.currentChallenges,

        currentStrengths:
          body.currentStrengths,

        adjustmentsMade:
          body.adjustmentsMade,

        nextActions:
          body.nextActions,

        nextMonitoringAt:
          body.nextMonitoringAt,

        occurredAt:
          body.occurredAt,

        expectedVersionId:
          body.expectedVersionId,
      }

      const result =
        await longitudinal
          .recordProgress(
            input,
          )

      return NextResponse.json(
        {
          success:
            true,

          data: {
            intervention:
              result.intervention,

            operation: {
              action:
                body.action,

              type:
                result.operation,

              progressLevel:
                body.progressLevel,

              progressPercentage:
                body.progressPercentage,

              recordedBy:
                user.id,

              occurredAt:
                result.occurredAt,
            },
          },

          meta: {
            interventionId,

            versionId:
              result.intervention
                .version.id,

            updatedAt:
              result.intervention
                .updatedAt,
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
      'complete_checkpoint'
    ) {
      const input:
        CompletePedagogicalCheckpointInput = {
        interventionId,

        checkpointId:
          body.checkpointId,

        actorId:
          user.id,

        status:
          body.status,

        findings:
          body.findings,

        decisions:
          body.decisions,

        nextActions:
          body.nextActions,

        notes:
          body.notes,

        completedAt:
          body.completedAt,

        expectedVersionId:
          body.expectedVersionId,
      }

      const result =
        await longitudinal
          .completeCheckpoint(
            input,
          )

      return NextResponse.json(
        {
          success:
            true,

          data: {
            intervention:
              result.intervention,

            operation: {
              action:
                body.action,

              type:
                result.operation,

              checkpointId:
                body.checkpointId,

              status:
                body.status ??
                'completed',

              recordedBy:
                user.id,

              occurredAt:
                result.occurredAt,
            },
          },

          meta: {
            interventionId,

            versionId:
              result.intervention
                .version.id,

            updatedAt:
              result.intervention
                .updatedAt,
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
      'update_indicator'
    ) {
      const input:
        UpdatePedagogicalIndicatorInput = {
        interventionId,

        indicatorId:
          body.indicatorId,

        actorId:
          user.id,

        currentValue:
          body.currentValue,

        measuredAt:
          body.measuredAt,

        nextMeasurementAt:
          body.nextMeasurementAt,

        metadata:
          body.metadata,

        expectedVersionId:
          body.expectedVersionId,
      }

      const result =
        await longitudinal
          .updateIndicator(
            input,
          )

      return NextResponse.json(
        {
          success:
            true,

          data: {
            intervention:
              result.intervention,

            operation: {
              action:
                body.action,

              type:
                result.operation,

              indicatorId:
                body.indicatorId,

              currentValue:
                body.currentValue,

              recordedBy:
                user.id,

              occurredAt:
                result.occurredAt,
            },
          },

          meta: {
            interventionId,

            versionId:
              result.intervention
                .version.id,

            updatedAt:
              result.intervention
                .updatedAt,
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
      'update_success_criterion'
    ) {
      const input:
        UpdatePedagogicalSuccessCriterionInput = {
        interventionId,

        criterionId:
          body.criterionId,

        actorId:
          user.id,

        observedValue:
          body.observedValue,

        status:
          body.status,

        evaluationNotes:
          body.evaluationNotes,

        metadata:
          body.metadata,

        occurredAt:
          body.occurredAt,

        expectedVersionId:
          body.expectedVersionId,
      }

      const result =
        await longitudinal
          .updateSuccessCriterion(
            input,
          )

      return NextResponse.json(
        {
          success:
            true,

          data: {
            intervention:
              result.intervention,

            operation: {
              action:
                body.action,

              type:
                result.operation,

              criterionId:
                body.criterionId,

              status:
                body.status,

              observedValue:
                body.observedValue,

              recordedBy:
                user.id,

              occurredAt:
                result.occurredAt,
            },
          },

          meta: {
            interventionId,

            versionId:
              result.intervention
                .version.id,

            updatedAt:
              result.intervention
                .updatedAt,
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
      'evaluate'
    ) {
      const input:
        EvaluatePedagogicalInterventionInput = {
        interventionId,

        actorId:
          user.id,

        status:
          body.status,

        effect:
          body.effect,

        effectivenessScore:
          body.effectivenessScore,

        confidenceScore:
          body.confidenceScore,

        summary:
          body.summary,

        achievedObjectives:
          body.achievedObjectives,

        partiallyAchievedObjectives:
          body
            .partiallyAchievedObjectives,

        unachievedObjectives:
          body.unachievedObjectives,

        successfulActions:
          body.successfulActions,

        ineffectiveActions:
          body.ineffectiveActions,

        evidenceIds:
          body.evidenceIds,

        positiveOutcomes:
          body.positiveOutcomes,

        negativeOutcomes:
          body.negativeOutcomes,

        unintendedOutcomes:
          body.unintendedOutcomes,

        contributingFactors:
          body.contributingFactors,

        limitingFactors:
          body.limitingFactors,

        continuationRecommendations:
          body
            .continuationRecommendations,

        redesignRecommendations:
          body
            .redesignRecommendations,

        requiresHumanValidation:
          body
            .requiresHumanValidation,

        occurredAt:
          body.occurredAt,

        expectedVersionId:
          body.expectedVersionId,
      }

      const result =
        await longitudinal
          .evaluate(
            input,
          )

      return NextResponse.json(
        {
          success:
            true,

          data: {
            intervention:
              result.intervention,

            operation: {
              action:
                body.action,

              type:
                result.operation,

              status:
                body.status,

              effect:
                body.effect,

              effectivenessScore:
                body.effectivenessScore ??
                null,

              recordedBy:
                user.id,

              occurredAt:
                result.occurredAt,
            },
          },

          meta: {
            interventionId,

            versionId:
              result.intervention
                .version.id,

            updatedAt:
              result.intervention
                .updatedAt,
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
      await persistence.archive(
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
              intervention
                .archivedAt,
          },
        },

        meta: {
          interventionId,

          versionId:
            intervention
              .version.id,

          updatedAt:
            intervention
              .updatedAt,
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