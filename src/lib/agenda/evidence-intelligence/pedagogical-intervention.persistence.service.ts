/**
 * EduData IA — EIOS
 * Capability 02: Pedagogical Copilot
 *
 * Serviço de persistência das intervenções pedagógicas.
 *
 * Responsabilidades:
 * - converter o domínio para o modelo do banco;
 * - garantir idempotência;
 * - persistir intervenções;
 * - reconstruir o domínio a partir do banco;
 * - carregar versão corrente e histórico;
 * - registrar decisão docente;
 * - registrar revisão humana;
 * - arquivar logicamente.
 *
 * Este arquivo não contém regras de geração pedagógica.
 */

import type {
  SupabaseClient,
} from '@supabase/supabase-js'

import {
  PedagogicalInterventionsRepository,
  type CreatePedagogicalInterventionInput,
  type PedagogicalInterventionJsonArray,
  type PedagogicalInterventionJsonObject,
  type PedagogicalInterventionQueryOptions,
  type PedagogicalInterventionRow,
  type UpdatePedagogicalInterventionInput,
} from '@/lib/agenda/repository/pedagogical-interventions.repository'

import type {
  PedagogicalHumanReview,
  PedagogicalHumanReviewerRole,
  PedagogicalHumanReviewStatus,
  PedagogicalIntervention,
  PedagogicalInterventionAuditEvent,
  PedagogicalInterventionHistoryItem,
  PedagogicalInterventionMetadata,
  PedagogicalInterventionSummary,
  PedagogicalTeacherDecision,
  PedagogicalTeacherDecisionType,
} from './pedagogical-intervention.types'

import {
  createPedagogicalInterventionSummary,
} from './pedagogical-intervention.service'

const SERVICE_NAME =
  'pedagogical-intervention-persistence-service'

const SERVICE_VERSION =
  '1.0.0'

export type PersistPedagogicalInterventionContext = {
  userId: string

  organizationId?: string | null

  schoolId?: string | null

  evidenceId?: string | null

  evidenceIntelligenceRunId?: string | null

  sourceAnalysisId?: string | null

  sourceEventId?: string | null

  idempotencyKey?: string | null

  requestId?: string | null

  sessionId?: string | null

  traceId?: string | null
}

export type PersistPedagogicalInterventionResult = {
  created: boolean

  idempotent: boolean

  intervention:
    PedagogicalIntervention

  row:
    PedagogicalInterventionRow

  summary:
    PedagogicalInterventionSummary
}

export type PedagogicalInterventionHistoryResult = {
  current:
    PedagogicalIntervention | null

  versions:
    PedagogicalIntervention[]

  history:
    PedagogicalInterventionHistoryItem[]
}

export type RecordTeacherDecisionPersistenceInput = {
  interventionId: string

  teacherId: string

  decision: Exclude<
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

export type RecordHumanReviewPersistenceInput = {
  interventionId: string

  reviewerId: string

  reviewerRole:
    PedagogicalHumanReviewerRole

  status: Exclude<
    PedagogicalHumanReviewStatus,
    | 'not_required'
    | 'pending'
    | 'in_review'
  >

  summary: string

  comments?: string[]

  requestedChanges?: string[]

  approvedElements?: string[]

  rejectedElements?: string[]

  limitationsAcknowledged: boolean

  professionalResponsibilityConfirmed:
    boolean

  expectedVersionId?: string | null

  occurredAt?: string
}

function nowIso(): string {
  return new Date()
    .toISOString()
}

function normalizeRequiredText(
  value:
    string | null | undefined,
  fieldName:
    string,
): string {
  const normalized =
    value?.trim()

  if (!normalized) {
    throw new Error(
      `${fieldName} é obrigatório.`,
    )
  }

  return normalized
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

function uniqueStrings(
  values:
    Array<string | null | undefined>,
): string[] {
  return Array.from(
    new Set(
      values
        .filter(
          (
            value,
          ): value is string =>
            typeof value === 'string',
        )
        .map(
          value =>
            value.trim(),
        )
        .filter(Boolean),
    ),
  )
}

function asJsonObject(
  value: object,
): PedagogicalInterventionJsonObject {
  return value as unknown as
    PedagogicalInterventionJsonObject
}

function asJsonArray(
  value: unknown[],
): PedagogicalInterventionJsonArray {
  return value as
    PedagogicalInterventionJsonArray
}

function fromJsonObject<T>(
  value:
    PedagogicalInterventionJsonObject,
): T {
  return value as unknown as T
}

function fromNullableJsonObject<T>(
  value:
    PedagogicalInterventionJsonObject | null,
): T | null {
  if (value === null) {
    return null
  }

  return value as unknown as T
}

function fromJsonArray<T>(
  value:
    PedagogicalInterventionJsonArray,
): T[] {
  return value as T[]
}

function resolveIdempotencyKey(
  intervention:
    PedagogicalIntervention,
  context:
    PersistPedagogicalInterventionContext,
): string {
  const explicitKey =
    normalizeOptionalText(
      context.idempotencyKey,
    )

  if (explicitKey) {
    return explicitKey
  }

  return [
    'pedagogical-intervention',
    intervention.id,
    intervention.version.id,
    intervention.version.versionNumber,
  ].join(':')
}

function resolveEvidenceId(
  intervention:
    PedagogicalIntervention,
  context:
    PersistPedagogicalInterventionContext,
): string | null {
  return (
    normalizeOptionalText(
      context.evidenceId,
    ) ??
    normalizeOptionalText(
      intervention.context
        .links
        .evidenceIds[0],
    )
  )
}

function resolveEvidenceIntelligenceRunId(
  intervention:
    PedagogicalIntervention,
  context:
    PersistPedagogicalInterventionContext,
): string | null {
  return (
    normalizeOptionalText(
      context.evidenceIntelligenceRunId,
    ) ??
    normalizeOptionalText(
      intervention.traceability
        .sourceIntelligenceRunIds[0],
    )
  )
}

function buildCreateInput(
  intervention:
    PedagogicalIntervention,
  context:
    PersistPedagogicalInterventionContext,
): CreatePedagogicalInterventionInput {
  const userId =
    normalizeRequiredText(
      context.userId,
      'ID do usuário',
    )

  const organizationId =
    normalizeOptionalText(
      context.organizationId ??
      intervention.organizationId,
    )

  const schoolId =
    normalizeOptionalText(
      context.schoolId ??
      intervention.schoolId,
    )

  const ownerUserId =
    normalizeOptionalText(
      intervention.ownerUserId,
    ) ??
    userId

  const traceability =
    intervention.traceability

  const effectivenessScore =
    intervention.effectiveness
      ?.effectivenessScore

  return {
    intervention_key:
      intervention.id,

    version_id:
      intervention.version.id,

    version_number:
      intervention.version
        .versionNumber,

    version_label:
      intervention.version
        .versionLabel,

    version_status:
      intervention.version.status,

    previous_version_id:
      null,

    parent_version_id:
      null,

    is_current_version:
      intervention.version.status ===
      'current',

    idempotency_key:
      resolveIdempotencyKey(
        intervention,
        context,
      ),

    evidence_id:
      resolveEvidenceId(
        intervention,
        context,
      ),

    evidence_intelligence_run_id:
      resolveEvidenceIntelligenceRunId(
        intervention,
        context,
      ),

    source_analysis_id:
      normalizeOptionalText(
        context.sourceAnalysisId ??
        traceability
          .sourceAnalysisIds[0],
      ),

    source_event_id:
      normalizeOptionalText(
        context.sourceEventId ??
        traceability.auditEvents[0]
          ?.id,
      ),

    class_ids:
      asJsonArray(
        intervention.context
          .links
          .classIds,
      ),

    planning_ids:
      asJsonArray(
        intervention.context
          .links
          .planningIds,
      ),

    lesson_ids:
      asJsonArray(
        intervention.context
          .links
          .lessonIds,
      ),

    learning_objective_ids:
      asJsonArray(
        intervention.context
          .links
          .learningObjectiveIds,
      ),

    skill_ids:
      asJsonArray(
        intervention.context
          .links
          .skillIds,
      ),

    competency_ids:
      asJsonArray(
        intervention.context
          .links
          .competencyIds,
      ),

    indicator_ids:
      asJsonArray(
        intervention.context
          .links
          .indicatorIds,
      ),

    assessment_ids:
      asJsonArray(
        intervention.context
          .links
          .assessmentIds,
      ),

    related_intervention_ids:
      asJsonArray(
        intervention.context
          .links
          .relatedInterventionIds,
      ),

    additional_entities:
      asJsonArray(
        intervention.context
          .links
          .additionalEntities,
      ),

    title:
      intervention.context.title,

    summary:
      intervention.context.summary,

    status:
      intervention.status,

    priority:
      intervention.priority,

    risk_level:
      intervention.diagnostic
        .risk
        .level,

    scope:
      intervention.context
        .audience
        .scope,

    source:
      intervention.source,

    source_product:
      intervention.sourceProduct,

    capability:
      intervention.capability,

    context:
      asJsonObject(
        intervention.context,
      ),

    diagnostic:
      asJsonObject(
        intervention.diagnostic,
      ),

    plan:
      asJsonObject(
        intervention.plan,
      ),

    expected_evidence:
      asJsonArray(
        intervention.expectedEvidence,
      ),

    indicators:
      asJsonArray(
        intervention.indicators,
      ),

    success_criteria:
      asJsonArray(
        intervention.successCriteria,
      ),

    schedule:
      asJsonObject(
        intervention.schedule,
      ),

    monitoring:
      asJsonObject(
        intervention.monitoring,
      ),

    effectiveness:
      intervention.effectiveness
        ? asJsonObject(
            intervention.effectiveness,
          )
        : null,

    explainability:
      asJsonObject(
        intervention.explainability,
      ),

    privacy:
      asJsonObject(
        intervention.privacy,
      ),

    research_eligibility:
      asJsonObject(
        intervention
          .researchEligibility,
      ),

    engine:
      asJsonObject(
        intervention.engine,
      ),

    teacher_decision:
      intervention.teacherDecision
        .decision,

    teacher_decision_payload:
      asJsonObject(
        intervention.teacherDecision,
      ),

    teacher_decided_at:
      intervention.teacherDecision
        .decidedAt ??
      null,

    teacher_decided_by:
      normalizeOptionalText(
        intervention.teacherDecision
          .teacherId,
      ),

    teacher_decision_rationale:
      normalizeOptionalText(
        intervention.teacherDecision
          .rationale,
      ),

    teacher_autonomy_confirmed:
      intervention.teacherDecision
        .autonomyConfirmed,

    requires_human_review:
      intervention.humanReview
        .required,

    human_review_status:
      intervention.humanReview
        .status,

    human_review_payload:
      asJsonObject(
        intervention.humanReview,
      ),

    human_review_requested_at:
      intervention.humanReview
        .requestedAt ??
      null,

    human_review_started_at:
      intervention.humanReview
        .startedAt ??
      null,

    human_review_completed_at:
      intervention.humanReview
        .completedAt ??
      null,

    human_reviewed_by:
      normalizeOptionalText(
        intervention.humanReview
          .reviewerId,
      ),

    human_reviewer_role:
      normalizeOptionalText(
        intervention.humanReview
          .reviewerRole,
      ),

    execution_status:
      intervention.monitoring
        .executionStatus,

    evaluation_status:
      intervention.effectiveness
        ?.status ??
      'not_started',

    progress_percentage:
      intervention.monitoring
        .progressPercentage ??
      0,

    planned_start_at:
      intervention.schedule
        .plannedStartAt ??
      null,

    planned_end_at:
      intervention.schedule
        .plannedEndAt ??
      null,

    actual_start_at:
      intervention.schedule
        .actualStartAt ??
      null,

    actual_end_at:
      intervention.schedule
        .actualEndAt ??
      null,

    next_monitoring_at:
      intervention.monitoring
        .nextMonitoringAt ??
      null,

    evaluated_at:
      intervention.effectiveness
        ?.evaluatedAt ??
      null,

    evaluated_by:
      normalizeOptionalText(
        intervention.effectiveness
          ?.evaluatedBy,
      ),

    effectiveness_score:
      typeof effectivenessScore ===
        'number'
        ? effectivenessScore
        : null,

    user_id:
      userId,

    organization_id:
      organizationId,

    school_id:
      schoolId,

    owner_user_id:
      ownerUserId,

    created_by:
      userId,

    updated_by:
      userId,

    correlation_id:
      traceability.correlationId,

    causation_id:
      normalizeOptionalText(
        traceability.causationId,
      ),

    request_id:
      normalizeOptionalText(
        context.requestId ??
        traceability.requestId,
      ),

    session_id:
      normalizeOptionalText(
        context.sessionId ??
        traceability.sessionId,
      ),

    trace_id:
      normalizeOptionalText(
        context.traceId,
      ),

    traceability:
      asJsonObject(
        traceability,
      ),

    audit_events:
      asJsonArray(
        traceability.auditEvents,
      ),

    warnings:
      asJsonArray(
        intervention.engine.warnings,
      ),

    errors: [],

    metadata:
      asJsonObject({
        ...intervention.metadata,

        persistenceService:
          SERVICE_NAME,

        persistenceServiceVersion:
          SERVICE_VERSION,

        persistedAt:
          nowIso(),
      }),

    created_at:
      intervention.createdAt,

    updated_at:
      intervention.updatedAt,

    archived_at:
      intervention.archivedAt ??
      null,
  }
}

function mapRowToDomain(
  row:
    PedagogicalInterventionRow,
): PedagogicalIntervention {
  const context =
    fromJsonObject<
      PedagogicalIntervention['context']
    >(row.context)

  const diagnostic =
    fromJsonObject<
      PedagogicalIntervention['diagnostic']
    >(row.diagnostic)

  const plan =
    fromJsonObject<
      PedagogicalIntervention['plan']
    >(row.plan)

  const schedule =
    fromJsonObject<
      PedagogicalIntervention['schedule']
    >(row.schedule)

  const monitoring =
    fromJsonObject<
      PedagogicalIntervention['monitoring']
    >(row.monitoring)

  const teacherDecision =
    fromJsonObject<
      PedagogicalTeacherDecision
    >(
      row.teacher_decision_payload,
    )

  const humanReview =
    fromJsonObject<
      PedagogicalHumanReview
    >(
      row.human_review_payload,
    )

  const traceability =
    fromJsonObject<
      PedagogicalIntervention['traceability']
    >(row.traceability)

  const metadata =
    fromJsonObject<
      PedagogicalInterventionMetadata
    >(row.metadata)

  return {
    id:
      row.intervention_key,

    organizationId:
      row.organization_id,

    schoolId:
      row.school_id,

    ownerUserId:
      row.owner_user_id,

    status:
      row.status,

    priority:
      row.priority,

    source:
      row.source as
        PedagogicalIntervention['source'],

    sourceProduct:
      row.source_product as
        PedagogicalIntervention['sourceProduct'],

    capability:
      'pedagogical_copilot',

    context,

    diagnostic,

    plan,

    expectedEvidence:
      fromJsonArray<
        PedagogicalIntervention[
          'expectedEvidence'
        ][number]
      >(row.expected_evidence),

    indicators:
      fromJsonArray<
        PedagogicalIntervention[
          'indicators'
        ][number]
      >(row.indicators),

    successCriteria:
      fromJsonArray<
        PedagogicalIntervention[
          'successCriteria'
        ][number]
      >(row.success_criteria),

    schedule,

    humanReview: {
      ...humanReview,

      required:
        row.requires_human_review,

      status:
        row.human_review_status,

      reviewerId:
        row.human_reviewed_by,

      reviewerRole:
        row.human_reviewer_role as
          PedagogicalHumanReviewerRole | null,

      requestedAt:
        row.human_review_requested_at,

      startedAt:
        row.human_review_started_at,

      completedAt:
        row.human_review_completed_at,
    },

    teacherDecision: {
      ...teacherDecision,

      decision:
        row.teacher_decision,

      teacherId:
        row.teacher_decided_by,

      decidedAt:
        row.teacher_decided_at,

      rationale:
        row.teacher_decision_rationale,

      autonomyConfirmed:
        row.teacher_autonomy_confirmed,
    },

    monitoring: {
      ...monitoring,

      executionStatus:
        row.execution_status,

      progressPercentage:
        row.progress_percentage,

      nextMonitoringAt:
        row.next_monitoring_at,
    },

    effectiveness:
      fromNullableJsonObject<
        NonNullable<
          PedagogicalIntervention[
            'effectiveness'
          ]
        >
      >(row.effectiveness),

    explainability:
      fromJsonObject<
        PedagogicalIntervention[
          'explainability'
        ]
      >(row.explainability),

    privacy:
      fromJsonObject<
        PedagogicalIntervention[
          'privacy'
        ]
      >(row.privacy),

    researchEligibility:
      fromJsonObject<
        PedagogicalIntervention[
          'researchEligibility'
        ]
      >(row.research_eligibility),

    traceability: {
      ...traceability,

      correlationId:
        row.correlation_id,

      causationId:
        row.causation_id,

      requestId:
        row.request_id,

      sessionId:
        row.session_id,

      auditEvents:
        fromJsonArray<
          PedagogicalInterventionAuditEvent
        >(row.audit_events),
    },

    version: {
      id:
        row.version_id,

      interventionId:
        row.intervention_key,

      versionNumber:
        row.version_number,

      versionLabel:
        row.version_label,

      status:
        row.version_status,

      previousVersionId:
        row.previous_version_id,

      parentVersionId:
        row.parent_version_id,

      createdAt:
        row.created_at,

      createdBy:
        row.created_by,

      reason:
        'Versão reconstruída a partir da persistência.',

      changeSummary: [],

      changedFields: [],

      engineName:
        null,

      engineVersion:
        null,

      modelName:
        null,

      promptVersion:
        null,

      rulesetVersion:
        null,

      frameworkVersion:
        null,
    },

    engine:
      fromJsonObject<
        PedagogicalIntervention[
          'engine'
        ]
      >(row.engine),

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at,

    archivedAt:
      row.archived_at,

    metadata,
  }
}

function createHistoryItem(
  intervention:
    PedagogicalIntervention,
): PedagogicalInterventionHistoryItem {
  return {
    interventionId:
      intervention.id,

    version:
      intervention.version,

    status:
      intervention.status,

    teacherDecision:
      intervention.teacherDecision
        .decision,

    humanReviewStatus:
      intervention.humanReview
        .status,

    executionStatus:
      intervention.monitoring
        .executionStatus,

    evaluationStatus:
      intervention.effectiveness
        ?.status ??
      'not_started',

    occurredAt:
      intervention.updatedAt,

    summary:
      intervention.context.summary,

    eventIds:
      intervention.traceability
        .auditEvents
        .map(
          event =>
            event.id,
        ),
  }
}

function buildAuditEvent({
  intervention,
  type,
  actorId,
  reason,
  occurredAt,
  changedFields,
}: {
  intervention:
    PedagogicalIntervention

  type:
    PedagogicalInterventionAuditEvent['type']

  actorId: string

  reason: string

  occurredAt: string

  changedFields: string[]
}): PedagogicalInterventionAuditEvent {
  return {
    id: [
      'event',
      type,
      intervention.id,
      occurredAt,
    ]
      .join('-')
      .replace(
        /[^a-zA-Z0-9-]/g,
        '-',
      ),

    type,

    occurredAt,

    actorType:
      'teacher',

    actorId,

    source:
      'professor',

    product:
      intervention.sourceProduct,

    capability:
      'pedagogical_copilot',

    previousStatus:
      intervention.status,

    newStatus:
      intervention.status,

    reason,

    changedFields,

    metadata: {
      persistenceService:
        SERVICE_NAME,

      persistenceServiceVersion:
        SERVICE_VERSION,
    },
  }
}

export class PedagogicalInterventionPersistenceService {
  private readonly repository:
    PedagogicalInterventionsRepository

  constructor(
    repositoryOrClient?:
      | PedagogicalInterventionsRepository
      | SupabaseClient,
  ) {
    if (
      repositoryOrClient instanceof
      PedagogicalInterventionsRepository
    ) {
      this.repository =
        repositoryOrClient

      return
    }

    this.repository =
      new PedagogicalInterventionsRepository(
        repositoryOrClient,
      )
  }

  async persist(
    intervention:
      PedagogicalIntervention,
    context:
      PersistPedagogicalInterventionContext,
  ): Promise<PersistPedagogicalInterventionResult> {
    const createInput =
      buildCreateInput(
        intervention,
        context,
      )

    const existing =
      await this.repository
        .findByIdempotencyKey(
          createInput.idempotency_key,
        )

    if (existing) {
      const mapped =
        mapRowToDomain(
          existing,
        )

      return {
        created: false,

        idempotent: true,

        intervention:
          mapped,

        row:
          existing,

        summary:
          createPedagogicalInterventionSummary(
            mapped,
          ),
      }
    }

    const createdRow =
      await this.repository.create(
        createInput,
      )

    const persistedIntervention =
      mapRowToDomain(
        createdRow,
      )

    return {
      created: true,

      idempotent: false,

      intervention:
        persistedIntervention,

      row:
        createdRow,

      summary:
        createPedagogicalInterventionSummary(
          persistedIntervention,
        ),
    }
  }

  async findByDatabaseId(
    id: string,
  ): Promise<PedagogicalIntervention | null> {
    const row =
      await this.repository.findById(
        id,
      )

    return row
      ? mapRowToDomain(row)
      : null
  }

  async findByVersionId(
    versionId: string,
  ): Promise<PedagogicalIntervention | null> {
    const row =
      await this.repository
        .findByVersionId(
          versionId,
        )

    return row
      ? mapRowToDomain(row)
      : null
  }

  async findCurrent(
    interventionId: string,
  ): Promise<PedagogicalIntervention | null> {
    const row =
      await this.repository
        .findCurrentByInterventionKey(
          interventionId,
        )

    return row
      ? mapRowToDomain(row)
      : null
  }

  async findAll(
    options:
      PedagogicalInterventionQueryOptions = {},
  ): Promise<PedagogicalIntervention[]> {
    const rows =
      await this.repository.findAll(
        options,
      )

    return rows.map(
      mapRowToDomain,
    )
  }

  async findHistory(
    interventionId: string,
  ): Promise<PedagogicalInterventionHistoryResult> {
    const normalizedId =
      normalizeRequiredText(
        interventionId,
        'ID da intervenção',
      )

    const rows =
      await this.repository
        .findVersions(
          normalizedId,
        )

    const versions =
      rows.map(
        mapRowToDomain,
      )

    const current =
      versions.find(
        intervention =>
          intervention.version.status ===
            'current' &&
          !intervention.archivedAt,
      ) ??
      null

    return {
      current,

      versions,

      history:
        versions.map(
          createHistoryItem,
        ),
    }
  }

  async recordTeacherDecision(
    input:
      RecordTeacherDecisionPersistenceInput,
  ): Promise<PedagogicalIntervention> {
    const teacherId =
      normalizeRequiredText(
        input.teacherId,
        'ID do professor',
      )

    const intervention =
      await this.findCurrent(
        input.interventionId,
      )

    if (!intervention) {
      throw new Error(
        'Intervenção pedagógica não encontrada.',
      )
    }

    if (
      input.expectedVersionId &&
      intervention.version.id !==
        input.expectedVersionId
    ) {
      throw new Error(
        'A intervenção foi alterada por outro processo. Atualize os dados antes de registrar a decisão.',
      )
    }

    if (
      intervention.teacherDecision
        .decision !== 'pending'
    ) {
      throw new Error(
        'A intervenção já possui uma decisão docente registrada.',
      )
    }

    const occurredAt =
      input.occurredAt ??
      nowIso()

    const teacherDecision:
      PedagogicalTeacherDecision = {
      decision:
        input.decision,

      teacherId,

      decidedAt:
        occurredAt,

      rationale:
        normalizeRequiredText(
          input.rationale,
          'Justificativa da decisão',
        ),

      adaptations:
        uniqueStrings(
          input.adaptations ?? [],
        ),

      rejectedRecommendations:
        uniqueStrings(
          input.rejectedRecommendations ??
          [],
        ),

      acceptedRecommendations:
        uniqueStrings(
          input.acceptedRecommendations ??
          [],
        ),

      professionalNotes:
        uniqueStrings(
          input.professionalNotes ??
          [],
        ),

      requiresNewVersion:
        input.decision ===
        'adapted',

      autonomyConfirmed:
        true,
    }

    const newStatus =
      input.decision

    const auditEvent =
      buildAuditEvent({
        intervention,

        type:
          input.decision,

        actorId:
          teacherId,

        reason:
          teacherDecision.rationale ??
          'Decisão docente registrada.',

        occurredAt,

        changedFields: [
          'status',
          'teacherDecision',
          'traceability.auditEvents',
        ],
      })

    const updatedTraceability = {
      ...intervention.traceability,

      auditEvents: [
        ...intervention
          .traceability
          .auditEvents,
        auditEvent,
      ],
    }

    const update:
      UpdatePedagogicalInterventionInput = {
      status:
        newStatus,

      teacher_decision:
        input.decision,

      teacher_decision_payload:
        asJsonObject(
          teacherDecision,
        ),

      teacher_decided_at:
        occurredAt,

      teacher_decided_by:
        teacherId,

      teacher_decision_rationale:
        teacherDecision.rationale,

      teacher_autonomy_confirmed:
        true,

      traceability:
        asJsonObject(
          updatedTraceability,
        ),

      audit_events:
        asJsonArray(
          updatedTraceability
            .auditEvents,
        ),

      updated_by:
        teacherId,

      metadata:
        asJsonObject({
          ...intervention.metadata,

          lastTeacherDecision:
            input.decision,

          lastTeacherDecisionAt:
            occurredAt,
        }),
    }

    const currentRow =
      await this.repository
        .findByVersionId(
          intervention.version.id,
        )

    if (!currentRow) {
      throw new Error(
        'Versão persistida da intervenção não encontrada.',
      )
    }

    const updatedRow =
      await this.repository.update(
        currentRow.id,
        update,
      )

    return mapRowToDomain(
      updatedRow,
    )
  }

  async recordHumanReview(
    input:
      RecordHumanReviewPersistenceInput,
  ): Promise<PedagogicalIntervention> {
    const reviewerId =
      normalizeRequiredText(
        input.reviewerId,
        'ID do revisor',
      )

    const intervention =
      await this.findCurrent(
        input.interventionId,
      )

    if (!intervention) {
      throw new Error(
        'Intervenção pedagógica não encontrada.',
      )
    }

    if (
      input.expectedVersionId &&
      intervention.version.id !==
        input.expectedVersionId
    ) {
      throw new Error(
        'A intervenção foi alterada por outro processo. Atualize os dados antes de registrar a revisão.',
      )
    }

    const occurredAt =
      input.occurredAt ??
      nowIso()

    const humanReview:
      PedagogicalHumanReview = {
      required:
        true,

      status:
        input.status,

      reviewerId,

      reviewerRole:
        input.reviewerRole,

      requestedAt:
        intervention.humanReview
          .requestedAt ??
        occurredAt,

      startedAt:
        intervention.humanReview
          .startedAt ??
        occurredAt,

      completedAt:
        occurredAt,

      summary:
        normalizeRequiredText(
          input.summary,
          'Resumo da revisão',
        ),

      comments:
        uniqueStrings(
          input.comments ?? [],
        ),

      requestedChanges:
        uniqueStrings(
          input.requestedChanges ??
          [],
        ),

      approvedElements:
        uniqueStrings(
          input.approvedElements ??
          [],
        ),

      rejectedElements:
        uniqueStrings(
          input.rejectedElements ??
          [],
        ),

      limitationsAcknowledged:
        input.limitationsAcknowledged,

      professionalResponsibilityConfirmed:
        input
          .professionalResponsibilityConfirmed,
    }

    const auditEvent =
      buildAuditEvent({
        intervention,

        type:
          'review_completed',

        actorId:
          reviewerId,

        reason:
          humanReview.summary ??
          'Revisão humana concluída.',

        occurredAt,

        changedFields: [
          'humanReview',
          'traceability.auditEvents',
        ],
      })

    const updatedTraceability = {
      ...intervention.traceability,

      auditEvents: [
        ...intervention
          .traceability
          .auditEvents,
        auditEvent,
      ],
    }

    const update:
      UpdatePedagogicalInterventionInput = {
      requires_human_review:
        true,

      human_review_status:
        input.status,

      human_review_payload:
        asJsonObject(
          humanReview,
        ),

      human_review_requested_at:
        humanReview.requestedAt,

      human_review_started_at:
        humanReview.startedAt,

      human_review_completed_at:
        occurredAt,

      human_reviewed_by:
        reviewerId,

      human_reviewer_role:
        input.reviewerRole,

      traceability:
        asJsonObject(
          updatedTraceability,
        ),

      audit_events:
        asJsonArray(
          updatedTraceability
            .auditEvents,
        ),

      updated_by:
        reviewerId,

      metadata:
        asJsonObject({
          ...intervention.metadata,

          lastHumanReviewStatus:
            input.status,

          lastHumanReviewAt:
            occurredAt,
        }),
    }

    const currentRow =
      await this.repository
        .findByVersionId(
          intervention.version.id,
        )

    if (!currentRow) {
      throw new Error(
        'Versão persistida da intervenção não encontrada.',
      )
    }

    const updatedRow =
      await this.repository.update(
        currentRow.id,
        update,
      )

    return mapRowToDomain(
      updatedRow,
    )
  }

  async archive(
    interventionId: string,
    userId: string,
  ): Promise<PedagogicalIntervention> {
    const normalizedUserId =
      normalizeRequiredText(
        userId,
        'ID do usuário',
      )

    const intervention =
      await this.findCurrent(
        interventionId,
      )

    if (!intervention) {
      throw new Error(
        'Intervenção pedagógica não encontrada.',
      )
    }

    const currentRow =
      await this.repository
        .findByVersionId(
          intervention.version.id,
        )

    if (!currentRow) {
      throw new Error(
        'Versão persistida da intervenção não encontrada.',
      )
    }

    const archivedRow =
      await this.repository.archive(
        currentRow.id,
        normalizedUserId,
      )

    return mapRowToDomain(
      archivedRow,
    )
  }
}

export function createPedagogicalInterventionPersistenceService(
  client?:
    SupabaseClient,
): PedagogicalInterventionPersistenceService {
  return new PedagogicalInterventionPersistenceService(
    client,
  )
}

export {
  buildCreateInput as createPedagogicalInterventionPersistenceInput,
  mapRowToDomain as mapPedagogicalInterventionRowToDomain,
}