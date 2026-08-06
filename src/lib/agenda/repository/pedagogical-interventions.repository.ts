import {
  createClient,
  type SupabaseClient,
} from '@supabase/supabase-js'

import type {
  PedagogicalHumanReviewStatus,
  PedagogicalInterventionEvaluationStatus,
  PedagogicalInterventionExecutionStatus,
  PedagogicalInterventionPriority,
  PedagogicalInterventionRiskLevel,
  PedagogicalInterventionScope,
  PedagogicalInterventionStatus,
  PedagogicalTeacherDecisionType,
} from '@/lib/agenda/evidence-intelligence/pedagogical-intervention.types'

export type PedagogicalInterventionVersionStatus =
  | 'current'
  | 'superseded'
  | 'archived'
  | 'rejected'

export type PedagogicalInterventionJsonObject =
  Record<string, unknown>

export type PedagogicalInterventionJsonArray =
  unknown[]

export type PedagogicalInterventionRow = {
  id: string

  intervention_key: string

  version_id: string

  version_number: number

  version_label: string

  version_status:
    PedagogicalInterventionVersionStatus

  previous_version_id: string | null

  parent_version_id: string | null

  is_current_version: boolean

  idempotency_key: string

  evidence_id: string | null

  evidence_intelligence_run_id:
    string | null

  source_analysis_id: string | null

  source_event_id: string | null

  class_ids:
    PedagogicalInterventionJsonArray

  planning_ids:
    PedagogicalInterventionJsonArray

  lesson_ids:
    PedagogicalInterventionJsonArray

  learning_objective_ids:
    PedagogicalInterventionJsonArray

  skill_ids:
    PedagogicalInterventionJsonArray

  competency_ids:
    PedagogicalInterventionJsonArray

  indicator_ids:
    PedagogicalInterventionJsonArray

  assessment_ids:
    PedagogicalInterventionJsonArray

  related_intervention_ids:
    PedagogicalInterventionJsonArray

  additional_entities:
    PedagogicalInterventionJsonArray

  title: string

  summary: string

  status:
    PedagogicalInterventionStatus

  priority:
    PedagogicalInterventionPriority

  risk_level:
    PedagogicalInterventionRiskLevel

  scope:
    PedagogicalInterventionScope

  source: string

  source_product: string

  capability: 'pedagogical_copilot'

  context:
    PedagogicalInterventionJsonObject

  diagnostic:
    PedagogicalInterventionJsonObject

  plan:
    PedagogicalInterventionJsonObject

  expected_evidence:
    PedagogicalInterventionJsonArray

  indicators:
    PedagogicalInterventionJsonArray

  success_criteria:
    PedagogicalInterventionJsonArray

  schedule:
    PedagogicalInterventionJsonObject

  monitoring:
    PedagogicalInterventionJsonObject

  effectiveness:
    PedagogicalInterventionJsonObject | null

  explainability:
    PedagogicalInterventionJsonObject

  privacy:
    PedagogicalInterventionJsonObject

  research_eligibility:
    PedagogicalInterventionJsonObject

  engine:
    PedagogicalInterventionJsonObject

  teacher_decision:
    PedagogicalTeacherDecisionType

  teacher_decision_payload:
    PedagogicalInterventionJsonObject

  teacher_decided_at: string | null

  teacher_decided_by: string | null

  teacher_decision_rationale:
    string | null

  teacher_autonomy_confirmed: boolean

  requires_human_review: boolean

  human_review_status:
    PedagogicalHumanReviewStatus

  human_review_payload:
    PedagogicalInterventionJsonObject

  human_review_requested_at:
    string | null

  human_review_started_at:
    string | null

  human_review_completed_at:
    string | null

  human_reviewed_by: string | null

  human_reviewer_role: string | null

  execution_status:
    PedagogicalInterventionExecutionStatus

  evaluation_status:
    PedagogicalInterventionEvaluationStatus

  progress_percentage: number

  planned_start_at: string | null

  planned_end_at: string | null

  actual_start_at: string | null

  actual_end_at: string | null

  next_monitoring_at: string | null

  evaluated_at: string | null

  evaluated_by: string | null

  effectiveness_score: number | null

  user_id: string

  organization_id: string | null

  school_id: string | null

  owner_user_id: string | null

  created_by: string | null

  updated_by: string | null

  correlation_id: string

  causation_id: string | null

  request_id: string | null

  session_id: string | null

  trace_id: string | null

  traceability:
    PedagogicalInterventionJsonObject

  audit_events:
    PedagogicalInterventionJsonArray

  warnings:
    PedagogicalInterventionJsonArray

  errors:
    PedagogicalInterventionJsonArray

  metadata:
    PedagogicalInterventionJsonObject

  created_at: string

  updated_at: string

  archived_at: string | null
}

export type CreatePedagogicalInterventionInput = {
  intervention_key: string

  version_id: string

  version_number?: number

  version_label?: string

  version_status?:
    PedagogicalInterventionVersionStatus

  previous_version_id?: string | null

  parent_version_id?: string | null

  is_current_version?: boolean

  idempotency_key: string

  evidence_id?: string | null

  evidence_intelligence_run_id?:
    string | null

  source_analysis_id?: string | null

  source_event_id?: string | null

  class_ids?:
    PedagogicalInterventionJsonArray

  planning_ids?:
    PedagogicalInterventionJsonArray

  lesson_ids?:
    PedagogicalInterventionJsonArray

  learning_objective_ids?:
    PedagogicalInterventionJsonArray

  skill_ids?:
    PedagogicalInterventionJsonArray

  competency_ids?:
    PedagogicalInterventionJsonArray

  indicator_ids?:
    PedagogicalInterventionJsonArray

  assessment_ids?:
    PedagogicalInterventionJsonArray

  related_intervention_ids?:
    PedagogicalInterventionJsonArray

  additional_entities?:
    PedagogicalInterventionJsonArray

  title: string

  summary: string

  status?:
    PedagogicalInterventionStatus

  priority?:
    PedagogicalInterventionPriority

  risk_level?:
    PedagogicalInterventionRiskLevel

  scope?:
    PedagogicalInterventionScope

  source?: string

  source_product?: string

  capability?: 'pedagogical_copilot'

  context?:
    PedagogicalInterventionJsonObject

  diagnostic?:
    PedagogicalInterventionJsonObject

  plan?:
    PedagogicalInterventionJsonObject

  expected_evidence?:
    PedagogicalInterventionJsonArray

  indicators?:
    PedagogicalInterventionJsonArray

  success_criteria?:
    PedagogicalInterventionJsonArray

  schedule?:
    PedagogicalInterventionJsonObject

  monitoring?:
    PedagogicalInterventionJsonObject

  effectiveness?:
    PedagogicalInterventionJsonObject | null

  explainability?:
    PedagogicalInterventionJsonObject

  privacy?:
    PedagogicalInterventionJsonObject

  research_eligibility?:
    PedagogicalInterventionJsonObject

  engine?:
    PedagogicalInterventionJsonObject

  teacher_decision?:
    PedagogicalTeacherDecisionType

  teacher_decision_payload?:
    PedagogicalInterventionJsonObject

  teacher_decided_at?: string | null

  teacher_decided_by?: string | null

  teacher_decision_rationale?:
    string | null

  teacher_autonomy_confirmed?: boolean

  requires_human_review?: boolean

  human_review_status?:
    PedagogicalHumanReviewStatus

  human_review_payload?:
    PedagogicalInterventionJsonObject

  human_review_requested_at?:
    string | null

  human_review_started_at?:
    string | null

  human_review_completed_at?:
    string | null

  human_reviewed_by?: string | null

  human_reviewer_role?: string | null

  execution_status?:
    PedagogicalInterventionExecutionStatus

  evaluation_status?:
    PedagogicalInterventionEvaluationStatus

  progress_percentage?: number

  planned_start_at?: string | null

  planned_end_at?: string | null

  actual_start_at?: string | null

  actual_end_at?: string | null

  next_monitoring_at?: string | null

  evaluated_at?: string | null

  evaluated_by?: string | null

  effectiveness_score?: number | null

  user_id: string

  organization_id?: string | null

  school_id?: string | null

  owner_user_id?: string | null

  created_by?: string | null

  updated_by?: string | null

  correlation_id: string

  causation_id?: string | null

  request_id?: string | null

  session_id?: string | null

  trace_id?: string | null

  traceability?:
    PedagogicalInterventionJsonObject

  audit_events?:
    PedagogicalInterventionJsonArray

  warnings?:
    PedagogicalInterventionJsonArray

  errors?:
    PedagogicalInterventionJsonArray

  metadata?:
    PedagogicalInterventionJsonObject

  created_at?: string

  updated_at?: string

  archived_at?: string | null
}

export type UpdatePedagogicalInterventionInput =
  Partial<
    Omit<
      CreatePedagogicalInterventionInput,
      | 'intervention_key'
      | 'version_id'
      | 'version_number'
      | 'idempotency_key'
      | 'user_id'
      | 'created_at'
    >
  >

export type PedagogicalInterventionQueryOptions = {
  interventionKey?: string | null

  versionId?: string | null

  evidenceId?: string | null

  evidenceIntelligenceRunId?:
    string | null

  userId?: string | null

  organizationId?: string | null

  schoolId?: string | null

  ownerUserId?: string | null

  correlationId?: string | null

  status?:
    PedagogicalInterventionStatus | null

  priority?:
    PedagogicalInterventionPriority | null

  riskLevel?:
    PedagogicalInterventionRiskLevel | null

  scope?:
    PedagogicalInterventionScope | null

  teacherDecision?:
    PedagogicalTeacherDecisionType | null

  humanReviewStatus?:
    PedagogicalHumanReviewStatus | null

  executionStatus?:
    PedagogicalInterventionExecutionStatus | null

  evaluationStatus?:
    PedagogicalInterventionEvaluationStatus | null

  requiresHumanReview?: boolean | null

  isCurrentVersion?: boolean | null

  includeArchived?: boolean

  plannedFrom?: string | null

  plannedTo?: string | null

  limit?: number
}

const TABLE_NAME =
  'agenda_pedagogical_interventions'

const DEFAULT_SOURCE =
  'eios_engine'

const DEFAULT_SOURCE_PRODUCT =
  'agenda_inteligente_edi'

function createLegacyServerClient():
  SupabaseClient {
  const url =
    process.env
      .NEXT_PUBLIC_SUPABASE_URL

  const key =
    process.env
      .SUPABASE_SERVICE_ROLE_KEY ??
    process.env
      .NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (
    !url ||
    !key
  ) {
    throw new Error(
      'Variáveis do Supabase não configuradas.',
    )
  }

  return createClient(
    url,
    key,
    {
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
): string | null | undefined {
  if (value === undefined) {
    return undefined
  }

  if (value === null) {
    return null
  }

  return value.trim() || null
}

function normalizePositiveInteger(
  value:
    number | undefined,
  fieldName:
    string,
): number | undefined {
  if (value === undefined) {
    return undefined
  }

  if (
    !Number.isInteger(value) ||
    value < 1
  ) {
    throw new Error(
      `${fieldName} deve ser um número inteiro maior ou igual a 1.`,
    )
  }

  return value
}

function normalizePercentage(
  value:
    number | undefined,
): number | undefined {
  if (value === undefined) {
    return undefined
  }

  if (
    !Number.isFinite(value) ||
    value < 0 ||
    value > 100
  ) {
    throw new Error(
      'O progresso deve estar entre 0 e 100.',
    )
  }

  return value
}

function normalizeScore(
  value:
    number | null | undefined,
): number | null | undefined {
  if (
    value === undefined ||
    value === null
  ) {
    return value
  }

  if (
    !Number.isFinite(value) ||
    value < 0 ||
    value > 1
  ) {
    throw new Error(
      'A pontuação de efetividade deve estar entre 0 e 1.',
    )
  }

  return value
}

function normalizeLimit(
  value:
    number | undefined,
): number {
  if (value === undefined) {
    return 100
  }

  if (
    !Number.isInteger(value) ||
    value < 1
  ) {
    throw new Error(
      'O limite deve ser um número inteiro positivo.',
    )
  }

  return Math.min(
    value,
    500,
  )
}

function assignIfDefined(
  payload:
    Record<string, unknown>,
  key:
    string,
  value:
    unknown,
): void {
  if (value !== undefined) {
    payload[key] =
      value
  }
}

function buildCreatePayload(
  input:
    CreatePedagogicalInterventionInput,
): Record<string, unknown> {
  return {
    intervention_key:
      normalizeRequiredText(
        input.intervention_key,
        'Chave da intervenção',
      ),

    version_id:
      normalizeRequiredText(
        input.version_id,
        'ID da versão',
      ),

    version_number:
      normalizePositiveInteger(
        input.version_number,
        'Número da versão',
      ) ?? 1,

    version_label:
      normalizeOptionalText(
        input.version_label,
      ) ?? '1.0',

    version_status:
      input.version_status ??
      'current',

    previous_version_id:
      normalizeOptionalText(
        input.previous_version_id,
      ) ?? null,

    parent_version_id:
      normalizeOptionalText(
        input.parent_version_id,
      ) ?? null,

    is_current_version:
      input.is_current_version ??
      true,

    idempotency_key:
      normalizeRequiredText(
        input.idempotency_key,
        'Chave de idempotência',
      ),

    evidence_id:
      normalizeOptionalText(
        input.evidence_id,
      ) ?? null,

    evidence_intelligence_run_id:
      normalizeOptionalText(
        input.evidence_intelligence_run_id,
      ) ?? null,

    source_analysis_id:
      normalizeOptionalText(
        input.source_analysis_id,
      ) ?? null,

    source_event_id:
      normalizeOptionalText(
        input.source_event_id,
      ) ?? null,

    class_ids:
      input.class_ids ?? [],

    planning_ids:
      input.planning_ids ?? [],

    lesson_ids:
      input.lesson_ids ?? [],

    learning_objective_ids:
      input.learning_objective_ids ?? [],

    skill_ids:
      input.skill_ids ?? [],

    competency_ids:
      input.competency_ids ?? [],

    indicator_ids:
      input.indicator_ids ?? [],

    assessment_ids:
      input.assessment_ids ?? [],

    related_intervention_ids:
      input.related_intervention_ids ?? [],

    additional_entities:
      input.additional_entities ?? [],

    title:
      normalizeRequiredText(
        input.title,
        'Título',
      ),

    summary:
      normalizeRequiredText(
        input.summary,
        'Resumo',
      ),

    status:
      input.status ??
      'draft',

    priority:
      input.priority ??
      'moderate',

    risk_level:
      input.risk_level ??
      'undetermined',

    scope:
      input.scope ??
      'individual',

    source:
      normalizeOptionalText(
        input.source,
      ) ?? DEFAULT_SOURCE,

    source_product:
      normalizeOptionalText(
        input.source_product,
      ) ?? DEFAULT_SOURCE_PRODUCT,

    capability:
      input.capability ??
      'pedagogical_copilot',

    context:
      input.context ?? {},

    diagnostic:
      input.diagnostic ?? {},

    plan:
      input.plan ?? {},

    expected_evidence:
      input.expected_evidence ?? [],

    indicators:
      input.indicators ?? [],

    success_criteria:
      input.success_criteria ?? [],

    schedule:
      input.schedule ?? {},

    monitoring:
      input.monitoring ?? {},

    effectiveness:
      input.effectiveness ?? null,

    explainability:
      input.explainability ?? {},

    privacy:
      input.privacy ?? {},

    research_eligibility:
      input.research_eligibility ?? {},

    engine:
      input.engine ?? {},

    teacher_decision:
      input.teacher_decision ??
      'pending',

    teacher_decision_payload:
      input.teacher_decision_payload ?? {},

    teacher_decided_at:
      input.teacher_decided_at ?? null,

    teacher_decided_by:
      normalizeOptionalText(
        input.teacher_decided_by,
      ) ?? null,

    teacher_decision_rationale:
      normalizeOptionalText(
        input.teacher_decision_rationale,
      ) ?? null,

    teacher_autonomy_confirmed:
      input.teacher_autonomy_confirmed ??
      false,

    requires_human_review:
      input.requires_human_review ??
      true,

    human_review_status:
      input.human_review_status ??
      'pending',

    human_review_payload:
      input.human_review_payload ?? {},

    human_review_requested_at:
      input.human_review_requested_at ??
      null,

    human_review_started_at:
      input.human_review_started_at ??
      null,

    human_review_completed_at:
      input.human_review_completed_at ??
      null,

    human_reviewed_by:
      normalizeOptionalText(
        input.human_reviewed_by,
      ) ?? null,

    human_reviewer_role:
      normalizeOptionalText(
        input.human_reviewer_role,
      ) ?? null,

    execution_status:
      input.execution_status ??
      'not_started',

    evaluation_status:
      input.evaluation_status ??
      'not_started',

    progress_percentage:
      normalizePercentage(
        input.progress_percentage,
      ) ?? 0,

    planned_start_at:
      input.planned_start_at ?? null,

    planned_end_at:
      input.planned_end_at ?? null,

    actual_start_at:
      input.actual_start_at ?? null,

    actual_end_at:
      input.actual_end_at ?? null,

    next_monitoring_at:
      input.next_monitoring_at ?? null,

    evaluated_at:
      input.evaluated_at ?? null,

    evaluated_by:
      normalizeOptionalText(
        input.evaluated_by,
      ) ?? null,

    effectiveness_score:
      normalizeScore(
        input.effectiveness_score,
      ) ?? null,

    user_id:
      normalizeRequiredText(
        input.user_id,
        'ID do usuário',
      ),

    organization_id:
      normalizeOptionalText(
        input.organization_id,
      ) ?? null,

    school_id:
      normalizeOptionalText(
        input.school_id,
      ) ?? null,

    owner_user_id:
      normalizeOptionalText(
        input.owner_user_id,
      ) ?? null,

    created_by:
      normalizeOptionalText(
        input.created_by,
      ) ?? null,

    updated_by:
      normalizeOptionalText(
        input.updated_by,
      ) ?? null,

    correlation_id:
      normalizeRequiredText(
        input.correlation_id,
        'ID de correlação',
      ),

    causation_id:
      normalizeOptionalText(
        input.causation_id,
      ) ?? null,

    request_id:
      normalizeOptionalText(
        input.request_id,
      ) ?? null,

    session_id:
      normalizeOptionalText(
        input.session_id,
      ) ?? null,

    trace_id:
      normalizeOptionalText(
        input.trace_id,
      ) ?? null,

    traceability:
      input.traceability ?? {},

    audit_events:
      input.audit_events ?? [],

    warnings:
      input.warnings ?? [],

    errors:
      input.errors ?? [],

    metadata:
      input.metadata ?? {},

    created_at:
      input.created_at ??
      new Date().toISOString(),

    updated_at:
      input.updated_at ??
      new Date().toISOString(),

    archived_at:
      input.archived_at ?? null,
  }
}

function buildUpdatePayload(
  input:
    UpdatePedagogicalInterventionInput,
): Record<string, unknown> {
  const payload:
    Record<string, unknown> = {
    updated_at:
      new Date().toISOString(),
  }

  assignIfDefined(
    payload,
    'version_label',
    normalizeOptionalText(
      input.version_label,
    ),
  )

  assignIfDefined(
    payload,
    'version_status',
    input.version_status,
  )

  assignIfDefined(
    payload,
    'previous_version_id',
    normalizeOptionalText(
      input.previous_version_id,
    ),
  )

  assignIfDefined(
    payload,
    'parent_version_id',
    normalizeOptionalText(
      input.parent_version_id,
    ),
  )

  assignIfDefined(
    payload,
    'is_current_version',
    input.is_current_version,
  )

  assignIfDefined(
    payload,
    'evidence_id',
    normalizeOptionalText(
      input.evidence_id,
    ),
  )

  assignIfDefined(
    payload,
    'evidence_intelligence_run_id',
    normalizeOptionalText(
      input.evidence_intelligence_run_id,
    ),
  )

  assignIfDefined(
    payload,
    'source_analysis_id',
    normalizeOptionalText(
      input.source_analysis_id,
    ),
  )

  assignIfDefined(
    payload,
    'source_event_id',
    normalizeOptionalText(
      input.source_event_id,
    ),
  )

  assignIfDefined(
    payload,
    'class_ids',
    input.class_ids,
  )

  assignIfDefined(
    payload,
    'planning_ids',
    input.planning_ids,
  )

  assignIfDefined(
    payload,
    'lesson_ids',
    input.lesson_ids,
  )

  assignIfDefined(
    payload,
    'learning_objective_ids',
    input.learning_objective_ids,
  )

  assignIfDefined(
    payload,
    'skill_ids',
    input.skill_ids,
  )

  assignIfDefined(
    payload,
    'competency_ids',
    input.competency_ids,
  )

  assignIfDefined(
    payload,
    'indicator_ids',
    input.indicator_ids,
  )

  assignIfDefined(
    payload,
    'assessment_ids',
    input.assessment_ids,
  )

  assignIfDefined(
    payload,
    'related_intervention_ids',
    input.related_intervention_ids,
  )

  assignIfDefined(
    payload,
    'additional_entities',
    input.additional_entities,
  )

  assignIfDefined(
    payload,
    'title',
    input.title === undefined
      ? undefined
      : normalizeRequiredText(
          input.title,
          'Título',
        ),
  )

  assignIfDefined(
    payload,
    'summary',
    input.summary === undefined
      ? undefined
      : normalizeRequiredText(
          input.summary,
          'Resumo',
        ),
  )

  assignIfDefined(
    payload,
    'status',
    input.status,
  )

  assignIfDefined(
    payload,
    'priority',
    input.priority,
  )

  assignIfDefined(
    payload,
    'risk_level',
    input.risk_level,
  )

  assignIfDefined(
    payload,
    'scope',
    input.scope,
  )

  assignIfDefined(
    payload,
    'source',
    normalizeOptionalText(
      input.source,
    ),
  )

  assignIfDefined(
    payload,
    'source_product',
    normalizeOptionalText(
      input.source_product,
    ),
  )

  assignIfDefined(
    payload,
    'capability',
    input.capability,
  )

  assignIfDefined(
    payload,
    'context',
    input.context,
  )

  assignIfDefined(
    payload,
    'diagnostic',
    input.diagnostic,
  )

  assignIfDefined(
    payload,
    'plan',
    input.plan,
  )

  assignIfDefined(
    payload,
    'expected_evidence',
    input.expected_evidence,
  )

  assignIfDefined(
    payload,
    'indicators',
    input.indicators,
  )

  assignIfDefined(
    payload,
    'success_criteria',
    input.success_criteria,
  )

  assignIfDefined(
    payload,
    'schedule',
    input.schedule,
  )

  assignIfDefined(
    payload,
    'monitoring',
    input.monitoring,
  )

  assignIfDefined(
    payload,
    'effectiveness',
    input.effectiveness,
  )

  assignIfDefined(
    payload,
    'explainability',
    input.explainability,
  )

  assignIfDefined(
    payload,
    'privacy',
    input.privacy,
  )

  assignIfDefined(
    payload,
    'research_eligibility',
    input.research_eligibility,
  )

  assignIfDefined(
    payload,
    'engine',
    input.engine,
  )

  assignIfDefined(
    payload,
    'teacher_decision',
    input.teacher_decision,
  )

  assignIfDefined(
    payload,
    'teacher_decision_payload',
    input.teacher_decision_payload,
  )

  assignIfDefined(
    payload,
    'teacher_decided_at',
    input.teacher_decided_at,
  )

  assignIfDefined(
    payload,
    'teacher_decided_by',
    normalizeOptionalText(
      input.teacher_decided_by,
    ),
  )

  assignIfDefined(
    payload,
    'teacher_decision_rationale',
    normalizeOptionalText(
      input.teacher_decision_rationale,
    ),
  )

  assignIfDefined(
    payload,
    'teacher_autonomy_confirmed',
    input.teacher_autonomy_confirmed,
  )

  assignIfDefined(
    payload,
    'requires_human_review',
    input.requires_human_review,
  )

  assignIfDefined(
    payload,
    'human_review_status',
    input.human_review_status,
  )

  assignIfDefined(
    payload,
    'human_review_payload',
    input.human_review_payload,
  )

  assignIfDefined(
    payload,
    'human_review_requested_at',
    input.human_review_requested_at,
  )

  assignIfDefined(
    payload,
    'human_review_started_at',
    input.human_review_started_at,
  )

  assignIfDefined(
    payload,
    'human_review_completed_at',
    input.human_review_completed_at,
  )

  assignIfDefined(
    payload,
    'human_reviewed_by',
    normalizeOptionalText(
      input.human_reviewed_by,
    ),
  )

  assignIfDefined(
    payload,
    'human_reviewer_role',
    normalizeOptionalText(
      input.human_reviewer_role,
    ),
  )

  assignIfDefined(
    payload,
    'execution_status',
    input.execution_status,
  )

  assignIfDefined(
    payload,
    'evaluation_status',
    input.evaluation_status,
  )

  assignIfDefined(
    payload,
    'progress_percentage',
    normalizePercentage(
      input.progress_percentage,
    ),
  )

  assignIfDefined(
    payload,
    'planned_start_at',
    input.planned_start_at,
  )

  assignIfDefined(
    payload,
    'planned_end_at',
    input.planned_end_at,
  )

  assignIfDefined(
    payload,
    'actual_start_at',
    input.actual_start_at,
  )

  assignIfDefined(
    payload,
    'actual_end_at',
    input.actual_end_at,
  )

  assignIfDefined(
    payload,
    'next_monitoring_at',
    input.next_monitoring_at,
  )

  assignIfDefined(
    payload,
    'evaluated_at',
    input.evaluated_at,
  )

  assignIfDefined(
    payload,
    'evaluated_by',
    normalizeOptionalText(
      input.evaluated_by,
    ),
  )

  assignIfDefined(
    payload,
    'effectiveness_score',
    normalizeScore(
      input.effectiveness_score,
    ),
  )

  assignIfDefined(
    payload,
    'organization_id',
    normalizeOptionalText(
      input.organization_id,
    ),
  )

  assignIfDefined(
    payload,
    'school_id',
    normalizeOptionalText(
      input.school_id,
    ),
  )

  assignIfDefined(
    payload,
    'owner_user_id',
    normalizeOptionalText(
      input.owner_user_id,
    ),
  )

  assignIfDefined(
    payload,
    'created_by',
    normalizeOptionalText(
      input.created_by,
    ),
  )

  assignIfDefined(
    payload,
    'updated_by',
    normalizeOptionalText(
      input.updated_by,
    ),
  )

  assignIfDefined(
    payload,
    'correlation_id',
    input.correlation_id === undefined
      ? undefined
      : normalizeRequiredText(
          input.correlation_id,
          'ID de correlação',
        ),
  )

  assignIfDefined(
    payload,
    'causation_id',
    normalizeOptionalText(
      input.causation_id,
    ),
  )

  assignIfDefined(
    payload,
    'request_id',
    normalizeOptionalText(
      input.request_id,
    ),
  )

  assignIfDefined(
    payload,
    'session_id',
    normalizeOptionalText(
      input.session_id,
    ),
  )

  assignIfDefined(
    payload,
    'trace_id',
    normalizeOptionalText(
      input.trace_id,
    ),
  )

  assignIfDefined(
    payload,
    'traceability',
    input.traceability,
  )

  assignIfDefined(
    payload,
    'audit_events',
    input.audit_events,
  )

  assignIfDefined(
    payload,
    'warnings',
    input.warnings,
  )

  assignIfDefined(
    payload,
    'errors',
    input.errors,
  )

  assignIfDefined(
    payload,
    'metadata',
    input.metadata,
  )

  assignIfDefined(
    payload,
    'archived_at',
    input.archived_at,
  )

  return payload
}

export class PedagogicalInterventionsRepository {
  private readonly client:
    SupabaseClient

  constructor(
    client?:
      SupabaseClient,
  ) {
    this.client =
      client ??
      createLegacyServerClient()
  }

  async create(
    input:
      CreatePedagogicalInterventionInput,
  ): Promise<PedagogicalInterventionRow> {
    const payload =
      buildCreatePayload(input)

    const {
      data,
      error,
    } = await this.client
      .from(TABLE_NAME)
      .insert(payload)
      .select('*')
      .single()

    if (error) {
      throw new Error(
        `Não foi possível criar a intervenção pedagógica: ${error.message}`,
      )
    }

    return data as
      PedagogicalInterventionRow
  }

  async findById(
    id:
      string,
  ): Promise<PedagogicalInterventionRow | null> {
    const normalizedId =
      normalizeRequiredText(
        id,
        'ID da intervenção',
      )

    const {
      data,
      error,
    } = await this.client
      .from(TABLE_NAME)
      .select('*')
      .eq(
        'id',
        normalizedId,
      )
      .maybeSingle()

    if (error) {
      throw new Error(
        `Não foi possível carregar a intervenção pedagógica: ${error.message}`,
      )
    }

    return data as
      PedagogicalInterventionRow | null
  }

  async findByVersionId(
    versionId:
      string,
  ): Promise<PedagogicalInterventionRow | null> {
    const normalizedVersionId =
      normalizeRequiredText(
        versionId,
        'ID da versão',
      )

    const {
      data,
      error,
    } = await this.client
      .from(TABLE_NAME)
      .select('*')
      .eq(
        'version_id',
        normalizedVersionId,
      )
      .maybeSingle()

    if (error) {
      throw new Error(
        `Não foi possível carregar a versão da intervenção: ${error.message}`,
      )
    }

    return data as
      PedagogicalInterventionRow | null
  }

  async findCurrentByInterventionKey(
    interventionKey:
      string,
  ): Promise<PedagogicalInterventionRow | null> {
    const normalizedKey =
      normalizeRequiredText(
        interventionKey,
        'Chave da intervenção',
      )

    const {
      data,
      error,
    } = await this.client
      .from(TABLE_NAME)
      .select('*')
      .eq(
        'intervention_key',
        normalizedKey,
      )
      .eq(
        'is_current_version',
        true,
      )
      .maybeSingle()

    if (error) {
      throw new Error(
        `Não foi possível carregar a versão corrente: ${error.message}`,
      )
    }

    return data as
      PedagogicalInterventionRow | null
  }

  async findByIdempotencyKey(
    idempotencyKey:
      string,
  ): Promise<PedagogicalInterventionRow | null> {
    const normalizedKey =
      normalizeRequiredText(
        idempotencyKey,
        'Chave de idempotência',
      )

    const {
      data,
      error,
    } = await this.client
      .from(TABLE_NAME)
      .select('*')
      .eq(
        'idempotency_key',
        normalizedKey,
      )
      .maybeSingle()

    if (error) {
      throw new Error(
        `Não foi possível verificar a idempotência: ${error.message}`,
      )
    }

    return data as
      PedagogicalInterventionRow | null
  }

  async findVersions(
    interventionKey:
      string,
  ): Promise<PedagogicalInterventionRow[]> {
    const normalizedKey =
      normalizeRequiredText(
        interventionKey,
        'Chave da intervenção',
      )

    const {
      data,
      error,
    } = await this.client
      .from(TABLE_NAME)
      .select('*')
      .eq(
        'intervention_key',
        normalizedKey,
      )
      .order(
        'version_number',
        {
          ascending:
            false,
        },
      )

    if (error) {
      throw new Error(
        `Não foi possível carregar o histórico de versões: ${error.message}`,
      )
    }

    return (
      data ?? []
    ) as PedagogicalInterventionRow[]
  }

  async findAll(
    options:
      PedagogicalInterventionQueryOptions = {},
  ): Promise<PedagogicalInterventionRow[]> {
    const limit =
      normalizeLimit(
        options.limit,
      )

    let query =
      this.client
        .from(TABLE_NAME)
        .select('*')

    if (options.interventionKey) {
      query =
        query.eq(
          'intervention_key',
          options.interventionKey.trim(),
        )
    }

    if (options.versionId) {
      query =
        query.eq(
          'version_id',
          options.versionId.trim(),
        )
    }

    if (options.evidenceId) {
      query =
        query.eq(
          'evidence_id',
          options.evidenceId.trim(),
        )
    }

    if (
      options.evidenceIntelligenceRunId
    ) {
      query =
        query.eq(
          'evidence_intelligence_run_id',
          options
            .evidenceIntelligenceRunId
            .trim(),
        )
    }

    if (options.userId) {
      query =
        query.eq(
          'user_id',
          options.userId.trim(),
        )
    }

    if (options.organizationId) {
      query =
        query.eq(
          'organization_id',
          options.organizationId.trim(),
        )
    }

    if (options.schoolId) {
      query =
        query.eq(
          'school_id',
          options.schoolId.trim(),
        )
    }

    if (options.ownerUserId) {
      query =
        query.eq(
          'owner_user_id',
          options.ownerUserId.trim(),
        )
    }

    if (options.correlationId) {
      query =
        query.eq(
          'correlation_id',
          options.correlationId.trim(),
        )
    }

    if (options.status) {
      query =
        query.eq(
          'status',
          options.status,
        )
    }

    if (options.priority) {
      query =
        query.eq(
          'priority',
          options.priority,
        )
    }

    if (options.riskLevel) {
      query =
        query.eq(
          'risk_level',
          options.riskLevel,
        )
    }

    if (options.scope) {
      query =
        query.eq(
          'scope',
          options.scope,
        )
    }

    if (options.teacherDecision) {
      query =
        query.eq(
          'teacher_decision',
          options.teacherDecision,
        )
    }

    if (
      options.humanReviewStatus
    ) {
      query =
        query.eq(
          'human_review_status',
          options.humanReviewStatus,
        )
    }

    if (options.executionStatus) {
      query =
        query.eq(
          'execution_status',
          options.executionStatus,
        )
    }

    if (options.evaluationStatus) {
      query =
        query.eq(
          'evaluation_status',
          options.evaluationStatus,
        )
    }

    if (
      options.requiresHumanReview !==
      undefined &&
      options.requiresHumanReview !==
      null
    ) {
      query =
        query.eq(
          'requires_human_review',
          options.requiresHumanReview,
        )
    }

    if (
      options.isCurrentVersion !==
      undefined &&
      options.isCurrentVersion !==
      null
    ) {
      query =
        query.eq(
          'is_current_version',
          options.isCurrentVersion,
        )
    }

    if (!options.includeArchived) {
      query =
        query.is(
          'archived_at',
          null,
        )
    }

    if (options.plannedFrom) {
      query =
        query.gte(
          'planned_start_at',
          options.plannedFrom,
        )
    }

    if (options.plannedTo) {
      query =
        query.lte(
          'planned_end_at',
          options.plannedTo,
        )
    }

    const {
      data,
      error,
    } = await query
      .order(
        'updated_at',
        {
          ascending:
            false,
        },
      )
      .limit(limit)

    if (error) {
      throw new Error(
        `Não foi possível listar as intervenções pedagógicas: ${error.message}`,
      )
    }

    return (
      data ?? []
    ) as PedagogicalInterventionRow[]
  }

  async update(
    id:
      string,
    input:
      UpdatePedagogicalInterventionInput,
  ): Promise<PedagogicalInterventionRow> {
    const normalizedId =
      normalizeRequiredText(
        id,
        'ID da intervenção',
      )

    const payload =
      buildUpdatePayload(input)

    const {
      data,
      error,
    } = await this.client
      .from(TABLE_NAME)
      .update(payload)
      .eq(
        'id',
        normalizedId,
      )
      .select('*')
      .single()

    if (error) {
      throw new Error(
        `Não foi possível atualizar a intervenção pedagógica: ${error.message}`,
      )
    }

    return data as
      PedagogicalInterventionRow
  }

  async archive(
    id:
      string,
    updatedBy?:
      string | null,
  ): Promise<PedagogicalInterventionRow> {
    return this.update(
      id,
      {
        status:
          'archived',

        version_status:
          'archived',

        is_current_version:
          false,

        archived_at:
          new Date().toISOString(),

        updated_by:
          updatedBy ?? null,
      },
    )
  }
}