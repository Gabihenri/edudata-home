/**
 * EduData IA — EIOS
 * Capability 02: Pedagogical Copilot
 *
 * Serviço longitudinal das intervenções pedagógicas.
 *
 * Responsabilidades:
 * - registrar início da execução;
 * - registrar progresso pedagógico;
 * - concluir checkpoints;
 * - atualizar indicadores;
 * - atualizar critérios de sucesso;
 * - acompanhar desafios, forças e ajustes;
 * - registrar avaliação de efetividade;
 * - preservar rastreabilidade e autonomia profissional.
 *
 * Este arquivo não gera intervenções.
 * Este arquivo não acessa o banco diretamente.
 * Toda persistência passa pelo Repository já validado.
 */

import type {
  SupabaseClient,
} from '@supabase/supabase-js'

import {
  PedagogicalInterventionsRepository,
  type PedagogicalInterventionRow,
  type UpdatePedagogicalInterventionInput,
} from '@/lib/agenda/repository/pedagogical-interventions.repository'

import {
  mapPedagogicalInterventionRowToDomain,
} from './pedagogical-intervention.persistence.service'

import type {
  PedagogicalCheckpointStatus,
  PedagogicalIntervention,
  PedagogicalInterventionAuditEvent,
  PedagogicalInterventionCheckpoint,
  PedagogicalInterventionEffect,
  PedagogicalInterventionEffectiveness,
  PedagogicalInterventionEvaluationStatus,
  PedagogicalInterventionExecutionStatus,
  PedagogicalInterventionIndicator,
  PedagogicalInterventionProgressRecord,
  PedagogicalInterventionProgressRecord as ProgressRecord,
  PedagogicalProgressLevel,
  PedagogicalSuccessCriterion,
  PedagogicalSuccessCriterionStatus,
} from './pedagogical-intervention.types'

const SERVICE_NAME =
  'pedagogical-intervention-longitudinal-service'

const SERVICE_VERSION =
  '1.0.0'

export type StartPedagogicalInterventionInput = {
  interventionId: string

  actorId: string

  occurredAt?: string

  nextMonitoringAt?: string | null

  notes?: string[]
}

export type RecordPedagogicalProgressInput = {
  interventionId: string

  actorId: string

  progressLevel:
    PedagogicalProgressLevel

  progressPercentage: number

  summary: string

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

export type CompletePedagogicalCheckpointInput = {
  interventionId: string

  checkpointId: string

  actorId: string

  status?:
    Extract<
      PedagogicalCheckpointStatus,
      'completed' | 'cancelled' | 'rescheduled'
    >

  findings?: string[]

  decisions?: string[]

  nextActions?: string[]

  notes?: string | null

  completedAt?: string

  expectedVersionId?: string | null
}

export type UpdatePedagogicalIndicatorInput = {
  interventionId: string

  indicatorId: string

  actorId: string

  currentValue:
    number | string | boolean | null

  measuredAt?: string

  nextMeasurementAt?: string | null

  metadata?:
    Record<string, unknown>

  expectedVersionId?: string | null
}

export type UpdatePedagogicalSuccessCriterionInput = {
  interventionId: string

  criterionId: string

  actorId: string

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

export type EvaluatePedagogicalInterventionInput = {
  interventionId: string

  actorId: string

  status:
    Exclude<
      PedagogicalInterventionEvaluationStatus,
      'not_started' | 'collecting_evidence' | 'under_review'
    >

  effect:
    PedagogicalInterventionEffect

  effectivenessScore?: number | null

  confidenceScore?: number | null

  summary: string

  achievedObjectives?: string[]

  partiallyAchievedObjectives?: string[]

  unachievedObjectives?: string[]

  successfulActions?: string[]

  ineffectiveActions?: string[]

  evidenceIds?: string[]

  indicatorResults?:
    PedagogicalInterventionIndicator[]

  successCriteria?:
    PedagogicalSuccessCriterion[]

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

export type PedagogicalLongitudinalOperationResult = {
  intervention:
    PedagogicalIntervention

  databaseRow:
    PedagogicalInterventionRow

  operation:
    | 'started'
    | 'progress_recorded'
    | 'checkpoint_updated'
    | 'indicator_updated'
    | 'success_criterion_updated'
    | 'evaluated'

  occurredAt: string
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

function normalizeIsoDateTime(
  value:
    string | null | undefined,
  fieldName:
    string,
  fallback?: string,
): string {
  const candidate =
    normalizeOptionalText(value) ??
    fallback

  if (
    !candidate ||
    Number.isNaN(
      Date.parse(candidate),
    )
  ) {
    throw new Error(
      `${fieldName} é inválida.`,
    )
  }

  return new Date(candidate)
    .toISOString()
}

function normalizeNullableIsoDateTime(
  value:
    string | null | undefined,
  fieldName:
    string,
): string | null {
  if (
    value === undefined ||
    value === null ||
    value.trim() === ''
  ) {
    return null
  }

  if (
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

function normalizePercentage(
  value: number,
): number {
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
  fieldName:
    string,
): number | null {
  if (
    value === undefined ||
    value === null
  ) {
    return null
  }

  if (
    !Number.isFinite(value) ||
    value < 0 ||
    value > 1
  ) {
    throw new Error(
      `${fieldName} deve estar entre 0 e 1.`,
    )
  }

  return value
}

function asJsonObject(
  value: object,
): Record<string, unknown> {
  return value as unknown as
    Record<string, unknown>
}

function asJsonArray(
  value: unknown[],
): unknown[] {
  return value
}

function createAuditEvent({
  intervention,
  actorId,
  type,
  reason,
  changedFields,
  occurredAt,
}: {
  intervention:
    PedagogicalIntervention

  actorId: string

  type:
    PedagogicalInterventionAuditEvent['type']

  reason: string

  changedFields: string[]

  occurredAt: string
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
      serviceName:
        SERVICE_NAME,

      serviceVersion:
        SERVICE_VERSION,
    },
  }
}

function appendAuditEvent(
  intervention:
    PedagogicalIntervention,
  event:
    PedagogicalInterventionAuditEvent,
) {
  const traceability = {
    ...intervention.traceability,

    auditEvents: [
      ...intervention
        .traceability
        .auditEvents,

      event,
    ],
  }

  return {
    traceability,

    auditEvents:
      traceability.auditEvents,
  }
}

function resolveExecutionStatus(
  percentage: number,
  currentStatus:
    PedagogicalInterventionExecutionStatus,
): PedagogicalInterventionExecutionStatus {
  if (
    currentStatus ===
      'cancelled' ||
    currentStatus ===
      'paused'
  ) {
    return currentStatus
  }

  if (percentage >= 100) {
    return 'completed'
  }

  if (percentage > 0) {
    return 'in_progress'
  }

  return currentStatus ===
    'scheduled'
    ? 'scheduled'
    : 'not_started'
}

export class PedagogicalInterventionLongitudinalService {
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

  private async loadCurrent({
    interventionId,
    expectedVersionId,
  }: {
    interventionId: string

    expectedVersionId?:
      string | null
  }): Promise<{
    row:
      PedagogicalInterventionRow

    intervention:
      PedagogicalIntervention
  }> {
    const normalizedInterventionId =
      normalizeRequiredText(
        interventionId,
        'ID da intervenção',
      )

    const row =
      await this.repository
        .findCurrentByInterventionKey(
          normalizedInterventionId,
        )

    if (!row) {
      throw new Error(
        'Intervenção pedagógica não encontrada.',
      )
    }

    if (
      expectedVersionId &&
      row.version_id !==
        expectedVersionId
    ) {
      throw new Error(
        'A intervenção foi alterada por outro processo. Atualize os dados antes de continuar.',
      )
    }

    return {
      row,

      intervention:
        mapPedagogicalInterventionRowToDomain(
          row,
        ),
    }
  }

  private async persistUpdate({
    row,
    update,
    operation,
    occurredAt,
  }: {
    row:
      PedagogicalInterventionRow

    update:
      UpdatePedagogicalInterventionInput

    operation:
      PedagogicalLongitudinalOperationResult['operation']

    occurredAt: string
  }): Promise<PedagogicalLongitudinalOperationResult> {
    const updatedRow =
      await this.repository.update(
        row.id,
        update,
      )

    return {
      intervention:
        mapPedagogicalInterventionRowToDomain(
          updatedRow,
        ),

      databaseRow:
        updatedRow,

      operation,

      occurredAt,
    }
  }

  async start(
    input:
      StartPedagogicalInterventionInput,
  ): Promise<PedagogicalLongitudinalOperationResult> {
    const actorId =
      normalizeRequiredText(
        input.actorId,
        'ID do responsável',
      )

    const occurredAt =
      normalizeIsoDateTime(
        input.occurredAt,
        'Data de início',
        nowIso(),
      )

    const {
      row,
      intervention,
    } = await this.loadCurrent({
      interventionId:
        input.interventionId,
    })

    if (
      intervention
        .teacherDecision
        .decision === 'pending'
    ) {
      throw new Error(
        'A intervenção deve ser aceita ou adaptada pelo professor antes do início.',
      )
    }

    if (
      intervention
        .teacherDecision
        .decision === 'rejected'
    ) {
      throw new Error(
        'Uma intervenção rejeitada não pode ser iniciada.',
      )
    }

    if (
      intervention.monitoring
        .executionStatus ===
      'completed'
    ) {
      throw new Error(
        'A intervenção já foi concluída.',
      )
    }

    const auditEvent =
      createAuditEvent({
        intervention,

        actorId,

        type:
          'started',

        reason:
          'Execução da intervenção iniciada pelo responsável.',

        changedFields: [
          'status',
          'monitoring.executionStatus',
          'schedule.actualStartAt',
          'monitoring.lastMonitoredAt',
          'traceability.auditEvents',
        ],

        occurredAt,
      })

    const audit =
      appendAuditEvent(
        intervention,
        auditEvent,
      )

    const schedule = {
      ...intervention.schedule,

      actualStartAt:
        intervention.schedule
          .actualStartAt ??
        occurredAt,
    }

    const monitoring = {
      ...intervention.monitoring,

      executionStatus:
        'in_progress' as const,

      lastMonitoredAt:
        occurredAt,

      nextMonitoringAt:
        normalizeNullableIsoDateTime(
          input.nextMonitoringAt,
          'Próximo monitoramento',
        ) ??
        intervention.monitoring
          .nextMonitoringAt,

      nextActions:
        uniqueStrings([
          ...intervention.monitoring
            .nextActions,

          ...(input.notes ?? []),
        ]),
    }

    return this.persistUpdate({
      row,

      operation:
        'started',

      occurredAt,

      update: {
        status:
          'in_progress',

        execution_status:
          'in_progress',

        actual_start_at:
          schedule.actualStartAt,

        next_monitoring_at:
          monitoring.nextMonitoringAt,

        schedule:
          asJsonObject(
            schedule,
          ),

        monitoring:
          asJsonObject(
            monitoring,
          ),

        traceability:
          asJsonObject(
            audit.traceability,
          ),

        audit_events:
          asJsonArray(
            audit.auditEvents,
          ),

        updated_by:
          actorId,
      },
    })
  }

  async recordProgress(
    input:
      RecordPedagogicalProgressInput,
  ): Promise<PedagogicalLongitudinalOperationResult> {
    const actorId =
      normalizeRequiredText(
        input.actorId,
        'ID do responsável',
      )

    const occurredAt =
      normalizeIsoDateTime(
        input.occurredAt,
        'Data do registro',
        nowIso(),
      )

    const progressPercentage =
      normalizePercentage(
        input.progressPercentage,
      )

    const {
      row,
      intervention,
    } = await this.loadCurrent({
      interventionId:
        input.interventionId,

      expectedVersionId:
        input.expectedVersionId,
    })

    if (
      intervention
        .teacherDecision
        .decision === 'pending'
    ) {
      throw new Error(
        'A decisão docente deve ser registrada antes do acompanhamento.',
      )
    }

    const progressRecord:
      ProgressRecord = {
      id: [
        'progress',
        intervention.id,
        occurredAt,
      ]
        .join('-')
        .replace(
          /[^a-zA-Z0-9-]/g,
          '-',
        ),

      recordedAt:
        occurredAt,

      recordedBy:
        actorId,

      progressLevel:
        input.progressLevel,

      summary:
        normalizeRequiredText(
          input.summary,
          'Resumo do progresso',
        ),

      achievements:
        uniqueStrings(
          input.achievements ?? [],
        ),

      difficulties:
        uniqueStrings(
          input.difficulties ?? [],
        ),

      unexpectedEffects:
        uniqueStrings(
          input.unexpectedEffects ?? [],
        ),

      actionIds:
        uniqueStrings(
          input.actionIds ?? [],
        ),

      objectiveIds:
        uniqueStrings(
          input.objectiveIds ?? [],
        ),

      indicatorIds:
        uniqueStrings(
          input.indicatorIds ?? [],
        ),

      evidenceIds:
        uniqueStrings(
          input.evidenceIds ?? [],
        ),

      teacherObservations:
        uniqueStrings(
          input.teacherObservations ??
          [],
        ),

      studentFeedback:
        uniqueStrings(
          input.studentFeedback ??
          [],
        ),

      recommendedAdjustments:
        uniqueStrings(
          input.recommendedAdjustments ??
          [],
        ),

      metadata: {
        serviceName:
          SERVICE_NAME,

        serviceVersion:
          SERVICE_VERSION,
      },
    }

    const executionStatus =
      resolveExecutionStatus(
        progressPercentage,
        intervention.monitoring
          .executionStatus,
      )

    const monitoring = {
      ...intervention.monitoring,

      executionStatus,

      progressPercentage,

      progressRecords: [
        ...intervention.monitoring
          .progressRecords,

        progressRecord,
      ],

      currentChallenges:
        uniqueStrings(
          input.currentChallenges ??
          input.difficulties ??
          intervention.monitoring
            .currentChallenges,
        ),

      currentStrengths:
        uniqueStrings(
          input.currentStrengths ??
          input.achievements ??
          intervention.monitoring
            .currentStrengths,
        ),

      adjustmentsMade:
        uniqueStrings([
          ...intervention.monitoring
            .adjustmentsMade,

          ...(input.adjustmentsMade ??
            []),
        ]),

      nextActions:
        uniqueStrings(
          input.nextActions ??
          input.recommendedAdjustments ??
          intervention.monitoring
            .nextActions,
        ),

      lastMonitoredAt:
        occurredAt,

      nextMonitoringAt:
        normalizeNullableIsoDateTime(
          input.nextMonitoringAt,
          'Próximo monitoramento',
        ),
    }

    const auditEvent =
      createAuditEvent({
        intervention,

        actorId,

        type:
          'checkpoint_recorded',

        reason:
          progressRecord.summary,

        changedFields: [
          'monitoring.progressRecords',
          'monitoring.progressPercentage',
          'monitoring.executionStatus',
          'monitoring.currentChallenges',
          'monitoring.currentStrengths',
          'monitoring.adjustmentsMade',
          'monitoring.nextActions',
          'traceability.auditEvents',
        ],

        occurredAt,
      })

    const audit =
      appendAuditEvent(
        intervention,
        auditEvent,
      )

    const completed =
      executionStatus ===
      'completed'

    return this.persistUpdate({
      row,

      operation:
        'progress_recorded',

      occurredAt,

      update: {
        status:
          completed
            ? 'completed'
            : 'in_progress',

        execution_status:
          executionStatus,

        progress_percentage:
          progressPercentage,

        actual_start_at:
          intervention.schedule
            .actualStartAt ??
          occurredAt,

        actual_end_at:
          completed
            ? occurredAt
            : intervention.schedule
                .actualEndAt,

        next_monitoring_at:
          monitoring.nextMonitoringAt,

        monitoring:
          asJsonObject(
            monitoring,
          ),

        traceability:
          asJsonObject(
            audit.traceability,
          ),

        audit_events:
          asJsonArray(
            audit.auditEvents,
          ),

        updated_by:
          actorId,
      },
    })
  }

  async completeCheckpoint(
    input:
      CompletePedagogicalCheckpointInput,
  ): Promise<PedagogicalLongitudinalOperationResult> {
    const actorId =
      normalizeRequiredText(
        input.actorId,
        'ID do responsável',
      )

    const checkpointId =
      normalizeRequiredText(
        input.checkpointId,
        'ID do checkpoint',
      )

    const occurredAt =
      normalizeIsoDateTime(
        input.completedAt,
        'Data de conclusão',
        nowIso(),
      )

    const {
      row,
      intervention,
    } = await this.loadCurrent({
      interventionId:
        input.interventionId,

      expectedVersionId:
        input.expectedVersionId,
    })

    const checkpointIndex =
      intervention.schedule
        .checkpoints
        .findIndex(
          checkpoint =>
            checkpoint.id ===
            checkpointId,
        )

    if (
      checkpointIndex < 0
    ) {
      throw new Error(
        'Checkpoint pedagógico não encontrado.',
      )
    }

    const currentCheckpoint =
      intervention.schedule
        .checkpoints[
          checkpointIndex
        ]

    const updatedCheckpoint:
      PedagogicalInterventionCheckpoint = {
      ...currentCheckpoint,

      status:
        input.status ??
        'completed',

      completedAt:
        occurredAt,

      findings:
        uniqueStrings([
          ...currentCheckpoint.findings,

          ...(input.findings ?? []),
        ]),

      decisions:
        uniqueStrings([
          ...currentCheckpoint.decisions,

          ...(input.decisions ?? []),
        ]),

      nextActions:
        uniqueStrings([
          ...currentCheckpoint.nextActions,

          ...(input.nextActions ?? []),
        ]),

      notes:
        normalizeOptionalText(
          input.notes,
        ) ??
        currentCheckpoint.notes,
    }

    const checkpoints = [
      ...intervention.schedule
        .checkpoints,
    ]

    checkpoints[
      checkpointIndex
    ] = updatedCheckpoint

    const schedule = {
      ...intervention.schedule,

      checkpoints,
    }

    const auditEvent =
      createAuditEvent({
        intervention,

        actorId,

        type:
          'checkpoint_recorded',

        reason:
          `Checkpoint atualizado: ${updatedCheckpoint.title}.`,

        changedFields: [
          'schedule.checkpoints',
          'traceability.auditEvents',
        ],

        occurredAt,
      })

    const audit =
      appendAuditEvent(
        intervention,
        auditEvent,
      )

    return this.persistUpdate({
      row,

      operation:
        'checkpoint_updated',

      occurredAt,

      update: {
        schedule:
          asJsonObject(
            schedule,
          ),

        traceability:
          asJsonObject(
            audit.traceability,
          ),

        audit_events:
          asJsonArray(
            audit.auditEvents,
          ),

        updated_by:
          actorId,
      },
    })
  }

  async updateIndicator(
    input:
      UpdatePedagogicalIndicatorInput,
  ): Promise<PedagogicalLongitudinalOperationResult> {
    const actorId =
      normalizeRequiredText(
        input.actorId,
        'ID do responsável',
      )

    const indicatorId =
      normalizeRequiredText(
        input.indicatorId,
        'ID do indicador',
      )

    const occurredAt =
      normalizeIsoDateTime(
        input.measuredAt,
        'Data da medição',
        nowIso(),
      )

    const {
      row,
      intervention,
    } = await this.loadCurrent({
      interventionId:
        input.interventionId,

      expectedVersionId:
        input.expectedVersionId,
    })

    const indicatorIndex =
      intervention.indicators
        .findIndex(
          indicator =>
            indicator.id ===
            indicatorId,
        )

    if (
      indicatorIndex < 0
    ) {
      throw new Error(
        'Indicador pedagógico não encontrado.',
      )
    }

    const indicators = [
      ...intervention.indicators,
    ]

    indicators[
      indicatorIndex
    ] = {
      ...indicators[
        indicatorIndex
      ],

      currentValue:
        input.currentValue,

      measuredAt:
        occurredAt,

      nextMeasurementAt:
        normalizeNullableIsoDateTime(
          input.nextMeasurementAt,
          'Próxima medição',
        ),

      metadata: {
        ...indicators[
          indicatorIndex
        ].metadata,

        ...input.metadata,

        lastUpdatedBy:
          actorId,

        longitudinalServiceVersion:
          SERVICE_VERSION,
      },
    }

    const auditEvent =
      createAuditEvent({
        intervention,

        actorId,

        type:
          'indicator_updated',

        reason:
          `Indicador atualizado: ${indicators[indicatorIndex].name}.`,

        changedFields: [
          'indicators',
          'traceability.auditEvents',
        ],

        occurredAt,
      })

    const audit =
      appendAuditEvent(
        intervention,
        auditEvent,
      )

    return this.persistUpdate({
      row,

      operation:
        'indicator_updated',

      occurredAt,

      update: {
        indicators:
          asJsonArray(
            indicators,
          ),

        traceability:
          asJsonObject(
            audit.traceability,
          ),

        audit_events:
          asJsonArray(
            audit.auditEvents,
          ),

        updated_by:
          actorId,
      },
    })
  }

  async updateSuccessCriterion(
    input:
      UpdatePedagogicalSuccessCriterionInput,
  ): Promise<PedagogicalLongitudinalOperationResult> {
    const actorId =
      normalizeRequiredText(
        input.actorId,
        'ID do responsável',
      )

    const criterionId =
      normalizeRequiredText(
        input.criterionId,
        'ID do critério de sucesso',
      )

    const occurredAt =
      normalizeIsoDateTime(
        input.occurredAt,
        'Data da avaliação',
        nowIso(),
      )

    const {
      row,
      intervention,
    } = await this.loadCurrent({
      interventionId:
        input.interventionId,

      expectedVersionId:
        input.expectedVersionId,
    })

    const criterionIndex =
      intervention.successCriteria
        .findIndex(
          criterion =>
            criterion.id ===
            criterionId,
        )

    if (
      criterionIndex < 0
    ) {
      throw new Error(
        'Critério de sucesso não encontrado.',
      )
    }

    const successCriteria = [
      ...intervention.successCriteria,
    ]

    successCriteria[
      criterionIndex
    ] = {
      ...successCriteria[
        criterionIndex
      ],

      observedValue:
        input.observedValue,

      status:
        input.status,

      evaluationNotes:
        normalizeOptionalText(
          input.evaluationNotes,
        ),

      metadata: {
        ...successCriteria[
          criterionIndex
        ].metadata,

        ...input.metadata,

        evaluatedAt:
          occurredAt,

        evaluatedBy:
          actorId,

        longitudinalServiceVersion:
          SERVICE_VERSION,
      },
    }

    const auditEvent =
      createAuditEvent({
        intervention,

        actorId,

        type:
          'evaluated',

        reason:
          `Critério de sucesso avaliado: ${successCriteria[criterionIndex].title}.`,

        changedFields: [
          'successCriteria',
          'traceability.auditEvents',
        ],

        occurredAt,
      })

    const audit =
      appendAuditEvent(
        intervention,
        auditEvent,
      )

    return this.persistUpdate({
      row,

      operation:
        'success_criterion_updated',

      occurredAt,

      update: {
        success_criteria:
          asJsonArray(
            successCriteria,
          ),

        traceability:
          asJsonObject(
            audit.traceability,
          ),

        audit_events:
          asJsonArray(
            audit.auditEvents,
          ),

        updated_by:
          actorId,
      },
    })
  }

  async evaluate(
    input:
      EvaluatePedagogicalInterventionInput,
  ): Promise<PedagogicalLongitudinalOperationResult> {
    const actorId =
      normalizeRequiredText(
        input.actorId,
        'ID do avaliador',
      )

    const occurredAt =
      normalizeIsoDateTime(
        input.occurredAt,
        'Data da avaliação',
        nowIso(),
      )

    const {
      row,
      intervention,
    } = await this.loadCurrent({
      interventionId:
        input.interventionId,

      expectedVersionId:
        input.expectedVersionId,
    })

    if (
      intervention.monitoring
        .executionStatus !==
        'completed' &&
      intervention.status !==
        'completed' &&
      intervention.status !==
        'under_evaluation'
    ) {
      throw new Error(
        'A intervenção deve estar concluída ou em avaliação antes do registro de efetividade.',
      )
    }

    const effectiveness:
      PedagogicalInterventionEffectiveness = {
      status:
        input.status,

      effect:
        input.effect,

      effectivenessScore:
        normalizeScore(
          input.effectivenessScore,
          'Pontuação de efetividade',
        ),

      confidenceScore:
        normalizeScore(
          input.confidenceScore,
          'Pontuação de confiança',
        ),

      summary:
        normalizeRequiredText(
          input.summary,
          'Resumo da avaliação',
        ),

      achievedObjectives:
        uniqueStrings(
          input.achievedObjectives ??
          [],
        ),

      partiallyAchievedObjectives:
        uniqueStrings(
          input.partiallyAchievedObjectives ??
          [],
        ),

      unachievedObjectives:
        uniqueStrings(
          input.unachievedObjectives ??
          [],
        ),

      successfulActions:
        uniqueStrings(
          input.successfulActions ??
          [],
        ),

      ineffectiveActions:
        uniqueStrings(
          input.ineffectiveActions ??
          [],
        ),

      evidenceIds:
        uniqueStrings(
          input.evidenceIds ??
          [],
        ),

      indicatorResults:
        input.indicatorResults ??
        intervention.indicators,

      successCriteria:
        input.successCriteria ??
        intervention.successCriteria,

      positiveOutcomes:
        uniqueStrings(
          input.positiveOutcomes ??
          [],
        ),

      negativeOutcomes:
        uniqueStrings(
          input.negativeOutcomes ??
          [],
        ),

      unintendedOutcomes:
        uniqueStrings(
          input.unintendedOutcomes ??
          [],
        ),

      contributingFactors:
        uniqueStrings(
          input.contributingFactors ??
          [],
        ),

      limitingFactors:
        uniqueStrings(
          input.limitingFactors ??
          [],
        ),

      continuationRecommendations:
        uniqueStrings(
          input.continuationRecommendations ??
          [],
        ),

      redesignRecommendations:
        uniqueStrings(
          input.redesignRecommendations ??
          [],
        ),

      evaluatedBy:
        actorId,

      evaluatedAt:
        occurredAt,

      requiresHumanValidation:
        input.requiresHumanValidation ??
        true,
    }

    const auditEvent =
      createAuditEvent({
        intervention,

        actorId,

        type:
          'evaluated',

        reason:
          effectiveness.summary,

        changedFields: [
          'status',
          'effectiveness',
          'evaluationStatus',
          'traceability.auditEvents',
        ],

        occurredAt,
      })

    const audit =
      appendAuditEvent(
        intervention,
        auditEvent,
      )

    return this.persistUpdate({
      row,

      operation:
        'evaluated',

      occurredAt,

      update: {
        status:
          'evaluated',

        evaluation_status:
          input.status,

        effectiveness:
          asJsonObject(
            effectiveness,
          ),

        effectiveness_score:
          effectiveness
            .effectivenessScore,

        evaluated_at:
          occurredAt,

        evaluated_by:
          actorId,

        actual_end_at:
          intervention.schedule
            .actualEndAt ??
          occurredAt,

        traceability:
          asJsonObject(
            audit.traceability,
          ),

        audit_events:
          asJsonArray(
            audit.auditEvents,
          ),

        updated_by:
          actorId,

        metadata:
          asJsonObject({
            ...intervention.metadata,

            lastEvaluationStatus:
              input.status,

            lastEvaluatedAt:
              occurredAt,

            longitudinalService:
              SERVICE_NAME,

            longitudinalServiceVersion:
              SERVICE_VERSION,
          }),
      },
    })
  }
}

export function createPedagogicalInterventionLongitudinalService(
  client?:
    SupabaseClient,
): PedagogicalInterventionLongitudinalService {
  return new PedagogicalInterventionLongitudinalService(
    client,
  )
}