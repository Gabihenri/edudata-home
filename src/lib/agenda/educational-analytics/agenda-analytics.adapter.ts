/**
 * EduData IA — EIOS
 * Capability 04: Educational Analytics
 *
 * Adaptador oficial da base operacional da Agenda para o contrato analítico.
 *
 * Não executa análise. Apenas transforma registros operacionais autorizados
 * em fontes, variáveis e observações compatíveis com o EIOS.
 */

import type {
  AgendaOperationalSnapshot,
} from '@/lib/agenda/services/operational-snapshot.service'

import type {
  AnalyticsObservation,
  AnalyticsSourceReference,
  AnalyticsTimeWindow,
  AnalyticsVariableDefinition,
  BuildEducationalAnalyticsInput,
} from './analytics.types'

export type BuildAgendaAnalyticsInput = {
  snapshot:
    AgendaOperationalSnapshot

  userId: string

  analysisId?: string

  analysisKey?: string

  title?: string

  correlationId?: string

  organizationId?: string | null

  schoolId?: string | null

  academicYear?: number | null
}

const VARIABLE_DEFINITIONS:
  AnalyticsVariableDefinition[] = [
    {
      id: 'planning_duration_minutes',
      key: 'planning_duration_minutes',
      label: 'Duração planejada',
      description:
        'Duração prevista do planejamento em minutos.',
      entityType: 'class',
      sourceType: 'planning',
      valueType: 'duration',
      unit: 'minutes',
      aggregation: 'mean',
      role: 'independent',
      nullable: true,
      sensitive: false,
      containsPersonalData: false,
      containsMinorData: false,
      categories: [],
      validMinimum: 0,
      validMaximum: null,
      transformation: null,
      metadata: {},
    },
    {
      id: 'objective_progress',
      key: 'objective_progress',
      label: 'Progresso do objetivo',
      description:
        'Percentual de progresso registrado no objetivo pedagógico.',
      entityType: 'class',
      sourceType: 'learning_objective',
      valueType: 'percentage',
      unit: 'percent',
      aggregation: 'mean',
      role: 'outcome',
      nullable: true,
      sensitive: false,
      containsPersonalData: false,
      containsMinorData: false,
      categories: [],
      validMinimum: 0,
      validMaximum: 100,
      transformation: null,
      metadata: {},
    },
    {
      id: 'lesson_completion',
      key: 'lesson_completion',
      label: 'Conclusão da aula',
      description:
        'Indicador binário de conclusão da aula.',
      entityType: 'class',
      sourceType: 'lesson',
      valueType: 'proportion',
      unit: 'ratio',
      aggregation: 'mean',
      role: 'outcome',
      nullable: false,
      sensitive: false,
      containsPersonalData: false,
      containsMinorData: false,
      categories: [],
      validMinimum: 0,
      validMaximum: 1,
      transformation: null,
      metadata: {},
    },
    {
      id: 'evidence_recorded',
      key: 'evidence_recorded',
      label: 'Evidência registrada',
      description:
        'Contagem unitária de evidências pedagógicas registradas.',
      entityType: 'class',
      sourceType: 'evidence',
      valueType: 'count',
      unit: 'record',
      aggregation: 'sum',
      role: 'outcome',
      nullable: false,
      sensitive: false,
      containsPersonalData: false,
      containsMinorData: false,
      categories: [],
      validMinimum: 0,
      validMaximum: null,
      transformation: null,
      metadata: {},
    },
    {
      id: 'evidence_file_size_bytes',
      key: 'evidence_file_size_bytes',
      label: 'Tamanho do arquivo da evidência',
      description:
        'Tamanho técnico do arquivo associado à evidência, quando disponível.',
      entityType: 'class',
      sourceType: 'evidence',
      valueType: 'count',
      unit: 'bytes',
      aggregation: 'mean',
      role: 'other',
      nullable: true,
      sensitive: false,
      containsPersonalData: false,
      containsMinorData: false,
      categories: [],
      validMinimum: 0,
      validMaximum: null,
      transformation: null,
      metadata: {},
    },
  ]

function nowIso(): string {
  return new Date().toISOString()
}

function normalizeText(
  value: unknown,
): string | null {
  return typeof value === 'string' &&
    value.trim()
    ? value.trim()
    : null
}

function normalizeNumber(
  value: unknown,
): number | null {
  if (
    typeof value === 'number' &&
    Number.isFinite(value)
  ) {
    return value
  }

  if (
    typeof value === 'string' &&
    value.trim()
  ) {
    const parsed = Number(value)

    return Number.isFinite(parsed)
      ? parsed
      : null
  }

  return null
}

function uniqueStrings(
  values: Array<string | null>,
): string[] {
  return Array.from(
    new Set(
      values.filter(
        (value): value is string =>
          Boolean(value),
      ),
    ),
  )
}

function asRecord(
  value: unknown,
): Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  )
    ? value as Record<string, unknown>
    : {}
}

function createSource(
  id: string,
  type:
    AnalyticsSourceReference['type'],
  table: string,
): AnalyticsSourceReference {
  return {
    id,
    type,
    entityType: null,
    sourceSystem: 'agenda_inteligente_edi',
    sourceTable: table,
    sourceField: null,
    sourceVersion: '1',
    observedAt: null,
    capturedAt: nowIso(),
    checksum: null,
    entityReferences: [],
    metadata: {
      adapter:
        'agenda-analytics-adapter',
    },
  }
}

function buildTimeWindow(
  dates: Array<string | null>,
  academicYear:
    number | null,
  academicPeriodIds:
    string[],
): AnalyticsTimeWindow {
  const validDates =
    dates
      .filter(
        (value): value is string =>
          Boolean(value) &&
          !Number.isNaN(
            Date.parse(value as string),
          ),
      )
      .map(
        value =>
          new Date(value).toISOString(),
      )
      .sort()

  return {
    startAt:
      validDates[0] ?? null,
    endAt:
      validDates.at(-1) ?? null,
    timezone:
      'America/Sao_Paulo',
    granularity:
      'day',
    academicYear,
    academicPeriodIds,
    comparisonStartAt: null,
    comparisonEndAt: null,
    metadata: {},
  }
}

function createObservation({
  id,
  entityId,
  variableId,
  numericValue,
  observedAt,
  recordedAt,
  academicPeriodId,
  classId,
  source,
  metadata,
}: {
  id: string
  entityId: string
  variableId: string
  numericValue: number | null
  observedAt: string | null
  recordedAt: string
  academicPeriodId: string | null
  classId: string | null
  source: AnalyticsSourceReference
  metadata?: Record<string, unknown>
}): AnalyticsObservation {
  return {
    id,
    entityId,
    entityType: 'class',
    variableId,
    numericValue,
    textValue: null,
    booleanValue: null,
    categoryValue: null,
    observedAt,
    recordedAt,
    academicPeriodId,
    classId,
    groupId: null,
    sourceReferences: [source],
    weight: 1,
    excluded:
      numericValue === null,
    exclusionReason:
      numericValue === null
        ? 'Valor numérico indisponível.'
        : null,
    metadata: {
      ...(metadata ?? {}),
      adapter:
        'agenda-analytics-adapter',
    },
  }
}

export function buildAgendaEducationalAnalyticsInput(
  input: BuildAgendaAnalyticsInput,
): BuildEducationalAnalyticsInput {
  const userId =
    input.userId.trim()

  if (!userId) {
    throw new Error(
      'O usuário é obrigatório para construir a análise da Agenda.',
    )
  }

  const generatedAt = nowIso()
  const planningSource =
    createSource(
      'agenda-planning',
      'planning',
      'agenda_planning',
    )
  const objectiveSource =
    createSource(
      'agenda-objectives',
      'learning_objective',
      'agenda_objectives',
    )
  const lessonSource =
    createSource(
      'agenda-lessons',
      'lesson',
      'agenda_lessons',
    )
  const evidenceSource =
    createSource(
      'agenda-evidences',
      'evidence',
      'agenda_evidences',
    )

  const observations:
    AnalyticsObservation[] = []

  const organizationIds: string[] = []
  const schoolIds: string[] = []
  const classIds: string[] = []
  const academicPeriodIds: string[] = []
  const dates: Array<string | null> = []

  for (const planning of input.snapshot.planning) {
    const record = asRecord(planning)
    const id = normalizeText(record.id)
    if (!id) continue

    const classId = normalizeText(record.class_id)
    const periodId = normalizeText(record.academic_period_id)
    const entityId = classId ?? id

    organizationIds.push(normalizeText(record.organization_id) ?? '')
    schoolIds.push(normalizeText(record.school_id) ?? '')
    if (classId) classIds.push(classId)
    if (periodId) academicPeriodIds.push(periodId)

    const observedAt =
      normalizeText(record.planned_date) ??
      normalizeText(record.created_at)
    const recordedAt =
      normalizeText(record.created_at) ??
      generatedAt

    dates.push(observedAt)

    observations.push(
      createObservation({
        id: `planning-duration:${id}`,
        entityId,
        variableId:
          'planning_duration_minutes',
        numericValue:
          normalizeNumber(record.duration_minutes),
        observedAt,
        recordedAt,
        academicPeriodId: periodId,
        classId,
        source: planningSource,
        metadata: {
          sourceRecordId: id,
          status:
            normalizeText(record.status),
        },
      }),
    )
  }

  for (const objective of input.snapshot.objectives) {
    const record = asRecord(objective)
    const id = normalizeText(record.id)
    if (!id) continue

    const classId = normalizeText(record.class_id)
    const periodId = normalizeText(record.academic_period_id)
    const entityId = classId ?? id

    organizationIds.push(normalizeText(record.organization_id) ?? '')
    schoolIds.push(normalizeText(record.school_id) ?? '')
    if (classId) classIds.push(classId)
    if (periodId) academicPeriodIds.push(periodId)

    const observedAt =
      normalizeText(record.end_date) ??
      normalizeText(record.start_date) ??
      normalizeText(record.created_at)
    const recordedAt =
      normalizeText(record.created_at) ??
      generatedAt

    dates.push(observedAt)

    observations.push(
      createObservation({
        id: `objective-progress:${id}`,
        entityId,
        variableId:
          'objective_progress',
        numericValue:
          normalizeNumber(record.progress),
        observedAt,
        recordedAt,
        academicPeriodId: periodId,
        classId,
        source: objectiveSource,
        metadata: {
          sourceRecordId: id,
          status:
            normalizeText(record.status),
        },
      }),
    )
  }

  for (const lesson of input.snapshot.lessons) {
    const record = asRecord(lesson)
    const id = normalizeText(record.id)
    if (!id) continue

    const classId = normalizeText(record.class_id)
    const periodId = normalizeText(record.academic_period_id)
    const entityId = classId ?? id
    const status =
      normalizeText(record.status)
        ?.toLowerCase() ?? ''
    const completed =
      Boolean(
        normalizeText(record.completed_at),
      ) ||
      [
        'completed',
        'concluida',
        'concluída',
      ].includes(status)

    organizationIds.push(normalizeText(record.organization_id) ?? '')
    schoolIds.push(normalizeText(record.school_id) ?? '')
    if (classId) classIds.push(classId)
    if (periodId) academicPeriodIds.push(periodId)

    const observedAt =
      normalizeText(record.scheduled_date) ??
      normalizeText(record.created_at)
    const recordedAt =
      normalizeText(record.created_at) ??
      generatedAt

    dates.push(observedAt)

    observations.push(
      createObservation({
        id: `lesson-completion:${id}`,
        entityId,
        variableId:
          'lesson_completion',
        numericValue:
          completed ? 1 : 0,
        observedAt,
        recordedAt,
        academicPeriodId: periodId,
        classId,
        source: lessonSource,
        metadata: {
          sourceRecordId: id,
          status,
        },
      }),
    )
  }

  for (const evidence of input.snapshot.evidences) {
    const record = asRecord(evidence)
    const id = normalizeText(record.id)
    if (!id) continue

    const classId = normalizeText(record.class_id)
    const periodId = normalizeText(record.academic_period_id)
    const entityId = classId ?? id

    organizationIds.push(normalizeText(record.organization_id) ?? '')
    schoolIds.push(normalizeText(record.school_id) ?? '')
    if (classId) classIds.push(classId)
    if (periodId) academicPeriodIds.push(periodId)

    const observedAt =
      normalizeText(record.created_at)
    const recordedAt =
      observedAt ?? generatedAt

    dates.push(observedAt)

    observations.push(
      createObservation({
        id: `evidence-recorded:${id}`,
        entityId,
        variableId:
          'evidence_recorded',
        numericValue: 1,
        observedAt,
        recordedAt,
        academicPeriodId: periodId,
        classId,
        source: evidenceSource,
        metadata: {
          sourceRecordId: id,
          evidenceType:
            normalizeText(record.evidence_type),
          containsIdentifiableMinor:
            record.contains_identifiable_minor === true,
        },
      }),
    )

    observations.push(
      createObservation({
        id: `evidence-file-size:${id}`,
        entityId,
        variableId:
          'evidence_file_size_bytes',
        numericValue:
          normalizeNumber(record.file_size_bytes),
        observedAt,
        recordedAt,
        academicPeriodId: periodId,
        classId,
        source: evidenceSource,
        metadata: {
          sourceRecordId: id,
        },
      }),
    )
  }

  const normalizedOrganizationIds =
    uniqueStrings(
      organizationIds.map(
        value => value || null,
      ),
    )
  const normalizedSchoolIds =
    uniqueStrings(
      schoolIds.map(
        value => value || null,
      ),
    )
  const normalizedClassIds =
    uniqueStrings(
      classIds.map(
        value => value || null,
      ),
    )
  const normalizedAcademicPeriodIds =
    uniqueStrings(
      academicPeriodIds.map(
        value => value || null,
      ),
    )

  const timeWindow =
    buildTimeWindow(
      dates,
      input.academicYear ?? null,
      normalizedAcademicPeriodIds,
    )

  const analysisId =
    input.analysisId?.trim() ||
    `agenda-analytics-${crypto.randomUUID()}`
  const analysisKey =
    input.analysisKey?.trim() ||
    `agenda:${userId}:${timeWindow.startAt ?? 'all'}:${timeWindow.endAt ?? 'all'}`
  const correlationId =
    input.correlationId?.trim() ||
    `agenda-correlation-${crypto.randomUUID()}`

  return {
    context: {
      analysisId,
      analysisKey,
      title:
        input.title?.trim() ||
        'Análise educacional da Agenda Inteligente EDI',
      description:
        'Análise integrada dos registros operacionais da Agenda, com correlações, padrões e anomalias sujeitas à revisão humana.',
      type: 'mixed',
      capability:
        'educational_analytics',
      scope:
        normalizedClassIds.length > 1
          ? 'multiple_classes'
          : normalizedClassIds.length === 1
            ? 'class'
            : 'teacher',
      organizationId:
        input.organizationId ??
        normalizedOrganizationIds[0] ??
        null,
      schoolId:
        input.schoolId ??
        normalizedSchoolIds[0] ??
        null,
      ownerUserId: userId,
      requestedByUserId: userId,
      teacherIds: [userId],
      studentIds: [],
      classIds:
        normalizedClassIds,
      groupIds: [],
      planningIds:
        input.snapshot.planning
          .map(item =>
            normalizeText(
              asRecord(item).id,
            ),
          )
          .filter(
            (value): value is string =>
              Boolean(value),
          ),
      lessonIds:
        input.snapshot.lessons
          .map(item =>
            normalizeText(
              asRecord(item).id,
            ),
          )
          .filter(
            (value): value is string =>
              Boolean(value),
          ),
      learningObjectiveIds:
        input.snapshot.objectives
          .map(item =>
            normalizeText(
              asRecord(item).id,
            ),
          )
          .filter(
            (value): value is string =>
              Boolean(value),
          ),
      skillIds: [],
      competencyIds: [],
      evidenceIds:
        input.snapshot.evidences
          .map(item =>
            normalizeText(
              asRecord(item).id,
            ),
          )
          .filter(
            (value): value is string =>
              Boolean(value),
          ),
      interventionIds: [],
      indicatorIds: [],
      assessmentIds: [],
      learningResultIds: [],
      externalEventIds: [],
      graphSnapshotIds: [],
      timeWindow,
      tags: [
        'agenda',
        'eios',
        'educational-analytics',
      ],
      metadata: {
        generatedFromOperationalSnapshot:
          true,
      },
    },
    configuration: {
      analysisTypes: [
        'descriptive',
        'correlational',
        'longitudinal',
        'pattern',
        'anomaly',
      ],
      enabledCapabilities: [
        'educational_analytics',
        'correlation_engine',
        'pattern_engine',
      ],
      scope:
        normalizedClassIds.length > 1
          ? 'multiple_classes'
          : normalizedClassIds.length === 1
            ? 'class'
            : 'teacher',
      timeWindow,
      variableDefinitions:
        VARIABLE_DEFINITIONS.map(
          variable => ({
            ...variable,
            metadata: {
              ...variable.metadata,
            },
          }),
        ),
      metricDefinitions: [],
      correlationMethods: [
        'pearson',
        'spearman',
        'kendall',
      ],
      significanceLevel: 0.05,
      minimumSampleSize: 3,
      minimumGroupSize: 5,
      minimumConfidence: 0.5,
      maximumMissingProportion: 0.4,
      calculateCorrelations: true,
      detectPatterns: true,
      detectAnomalies: true,
      calculateInfluence: false,
      generatePredictions: false,
      generateRecommendations: false,
      generateResearchHypotheses: false,
      requireHumanReview: true,
      requireExplainability: true,
      allowSensitiveAttributes: false,
      allowCausalAnalysis: false,
      includeArchivedData: false,
      includeHistoricalVersions: false,
      randomSeed: null,
      metadata: {
        adapter:
          'agenda-analytics-adapter',
      },
    },
    sources: [
      planningSource,
      objectiveSource,
      lessonSource,
      evidenceSource,
    ],
    observations,
    requestedByUserId: userId,
    correlationId,
    causationId: null,
    requestId: null,
    sessionId: null,
    traceId: null,
    sourceEventId: null,
    metadata: {
      adapter:
        'agenda-analytics-adapter',
      generatedAt,
      snapshotCounts: {
        planning:
          input.snapshot.planning.length,
        objectives:
          input.snapshot.objectives.length,
        lessons:
          input.snapshot.lessons.length,
        evidences:
          input.snapshot.evidences.length,
      },
    },
  }
}
