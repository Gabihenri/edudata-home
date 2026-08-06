/**
 * EduData IA — EIOS
 * Capability 04: Educational Analytics
 *
 * Orquestrador oficial do Educational Analytics Engine.
 *
 * Arquitetura:
 * Framework EDI
 * → EIOS
 * → Educational Analytics
 * → Core Compartilhado
 * → Produtos Especializados
 *
 * Responsabilidades:
 * - validar a entrada analítica;
 * - normalizar contexto, configuração e observações;
 * - avaliar qualidade inicial dos dados;
 * - aplicar guardas de privacidade, ética e pesquisa;
 * - preparar a execução dos motores especializados;
 * - consolidar resultados, eventos e rastreabilidade;
 * - preservar explicabilidade e revisão humana;
 * - impedir decisões pedagógicas automatizadas.
 */

import type {
  AnalyticsConfidence,
  AnalyticsConfiguration,
  AnalyticsContext,
  AnalyticsDataQuality,
  AnalyticsDataQualityDimension,
  AnalyticsDataQualityScore,
  AnalyticsEthics,
  AnalyticsEvent,
  AnalyticsExplainability,
  AnalyticsIdentifier,
  AnalyticsMetadata,
  AnalyticsObservation,
  AnalyticsPrivacy,
  AnalyticsResearchEligibility,
  AnalyticsReproducibility,
  AnalyticsSeverity,
  AnalyticsSourceReference,
  AnalyticsStatus,
  AnalyticsTimestamp,
  AnalyticsTraceability,
  AnalyticsValidationIssue,
  AnalyticsValidationResult,
  AnalyticsVariableDefinition,
  AnalyticsVersion,
  BuildEducationalAnalyticsInput,
  EducationalAnalyticsBuildResult,
  EducationalAnalyticsResult,
} from './analytics.types'

const ENGINE_NAME = 'eios-educational-analytics-engine'
const ENGINE_VERSION = '1.0.0'
const RULESET_VERSION = 'educational-analytics-ruleset-1.0.0'
const DEFAULT_TIMEZONE = 'America/Sao_Paulo'

type NormalizedBuildInput = {
  context: AnalyticsContext
  configuration: AnalyticsConfiguration
  sources: AnalyticsSourceReference[]
  observations: AnalyticsObservation[]
  requestedByUserId: AnalyticsIdentifier | null
  correlationId: string
  causationId: string | null
  requestId: string | null
  sessionId: string | null
  traceId: string | null
  sourceEventId: string | null
  metadata: AnalyticsMetadata
}

type GovernanceEvaluation = {
  allowed: boolean
  privacy: AnalyticsPrivacy
  ethics: AnalyticsEthics
  researchEligibility: AnalyticsResearchEligibility
  issues: AnalyticsValidationIssue[]
  warnings: string[]
}

type QualityEvaluation = {
  quality: AnalyticsDataQuality
  issues: AnalyticsValidationIssue[]
  warnings: string[]
}

function nowIso(): AnalyticsTimestamp {
  return new Date().toISOString()
}

function normalizeOptionalText(
  value: string | null | undefined,
): string | null {
  return value?.trim() || null
}

function normalizeRequiredText(
  value: string | null | undefined,
  fieldName: string,
): string {
  const normalized = normalizeOptionalText(value)

  if (!normalized) {
    throw new Error(`${fieldName} é obrigatório.`)
  }

  return normalized
}

function uniqueStrings(
  values: Array<string | null | undefined>,
): string[] {
  return Array.from(
    new Set(
      values
        .filter((value): value is string => typeof value === 'string')
        .map(value => value.trim())
        .filter(Boolean),
    ),
  )
}

function clampScore(
  value: number | null | undefined,
): number | null {
  if (
    value === null ||
    value === undefined ||
    !Number.isFinite(value)
  ) {
    return null
  }

  return Math.min(1, Math.max(0, value))
}

function safeNumber(
  value: number | null | undefined,
  fallback = 0,
): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? value
    : fallback
}

function createStableHash(value: string): string {
  let hash = 2166136261

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return (hash >>> 0).toString(16).padStart(8, '0')
}

function createStableId(prefix: string, value: string): string {
  return `${prefix}-${createStableHash(value)}`
}

function calculateAverage(
  values: Array<number | null | undefined>,
): number | null {
  const validValues = values.filter(
    (value): value is number =>
      typeof value === 'number' && Number.isFinite(value),
  )

  if (validValues.length === 0) {
    return null
  }

  return (
    validValues.reduce((total, value) => total + value, 0) /
    validValues.length
  )
}

function createValidationIssue({
  code,
  severity,
  message,
  field = null,
  entityId = null,
  sourceId = null,
  requiresHumanReview = false,
  metadata = {},
}: {
  code: string
  severity: AnalyticsSeverity
  message: string
  field?: string | null
  entityId?: AnalyticsIdentifier | null
  sourceId?: AnalyticsIdentifier | null
  requiresHumanReview?: boolean
  metadata?: AnalyticsMetadata
}): AnalyticsValidationIssue {
  return {
    code,
    severity,
    message,
    field,
    entityId,
    sourceId,
    requiresHumanReview,
    metadata,
  }
}

function normalizeVariableDefinition(
  variable: AnalyticsVariableDefinition,
): AnalyticsVariableDefinition {
  return {
    ...variable,
    id: normalizeRequiredText(variable.id, 'variable.id'),
    key: normalizeRequiredText(variable.key, 'variable.key'),
    label: normalizeRequiredText(variable.label, 'variable.label'),
    description: normalizeOptionalText(variable.description),
    unit: normalizeOptionalText(variable.unit),
    transformation: normalizeOptionalText(variable.transformation),
    categories: uniqueStrings(variable.categories),
    metadata: { ...variable.metadata },
  }
}

function normalizeSource(
  source: AnalyticsSourceReference,
): AnalyticsSourceReference {
  return {
    ...source,
    id: normalizeRequiredText(source.id, 'source.id'),
    sourceSystem: normalizeRequiredText(
      source.sourceSystem,
      'source.sourceSystem',
    ),
    sourceTable: normalizeOptionalText(source.sourceTable),
    sourceField: normalizeOptionalText(source.sourceField),
    sourceVersion: normalizeOptionalText(source.sourceVersion),
    checksum: normalizeOptionalText(source.checksum),
    entityReferences: source.entityReferences.map(entity => ({
      ...entity,
      id: normalizeRequiredText(entity.id, 'entity.id'),
      label: normalizeOptionalText(entity.label),
      sourceSystem: normalizeOptionalText(entity.sourceSystem),
      sourceTable: normalizeOptionalText(entity.sourceTable),
      sourceField: normalizeOptionalText(entity.sourceField),
      organizationId: normalizeOptionalText(entity.organizationId),
      schoolId: normalizeOptionalText(entity.schoolId),
      classIds: uniqueStrings(entity.classIds),
      groupIds: uniqueStrings(entity.groupIds),
      metadata: { ...entity.metadata },
    })),
    metadata: { ...source.metadata },
  }
}

function normalizeObservation(
  observation: AnalyticsObservation,
): AnalyticsObservation {
  return {
    ...observation,
    id: normalizeRequiredText(observation.id, 'observation.id'),
    entityId: normalizeRequiredText(
      observation.entityId,
      'observation.entityId',
    ),
    variableId: normalizeRequiredText(
      observation.variableId,
      'observation.variableId',
    ),
    numericValue:
      typeof observation.numericValue === 'number' &&
      Number.isFinite(observation.numericValue)
        ? observation.numericValue
        : null,
    textValue: normalizeOptionalText(observation.textValue),
    categoryValue: normalizeOptionalText(
      observation.categoryValue,
    ),
    academicPeriodId: normalizeOptionalText(
      observation.academicPeriodId,
    ),
    classId: normalizeOptionalText(observation.classId),
    groupId: normalizeOptionalText(observation.groupId),
    sourceReferences: observation.sourceReferences.map(
      normalizeSource,
    ),
    weight:
      observation.weight === null
        ? null
        : Math.max(0, safeNumber(observation.weight, 1)),
    exclusionReason: normalizeOptionalText(
      observation.exclusionReason,
    ),
    metadata: { ...observation.metadata },
  }
}

function normalizeContext(
  context: AnalyticsContext,
  requestedByUserId: AnalyticsIdentifier | null,
): AnalyticsContext {
  return {
    ...context,
    analysisId: normalizeRequiredText(
      context.analysisId,
      'context.analysisId',
    ),
    analysisKey: normalizeRequiredText(
      context.analysisKey,
      'context.analysisKey',
    ),
    title: normalizeRequiredText(context.title, 'context.title'),
    description: normalizeOptionalText(context.description),
    organizationId: normalizeOptionalText(context.organizationId),
    schoolId: normalizeOptionalText(context.schoolId),
    ownerUserId: normalizeOptionalText(context.ownerUserId),
    requestedByUserId:
      requestedByUserId ??
      normalizeOptionalText(context.requestedByUserId),
    teacherIds: uniqueStrings(context.teacherIds),
    studentIds: uniqueStrings(context.studentIds),
    classIds: uniqueStrings(context.classIds),
    groupIds: uniqueStrings(context.groupIds),
    planningIds: uniqueStrings(context.planningIds),
    lessonIds: uniqueStrings(context.lessonIds),
    learningObjectiveIds: uniqueStrings(
      context.learningObjectiveIds,
    ),
    skillIds: uniqueStrings(context.skillIds),
    competencyIds: uniqueStrings(context.competencyIds),
    evidenceIds: uniqueStrings(context.evidenceIds),
    interventionIds: uniqueStrings(context.interventionIds),
    indicatorIds: uniqueStrings(context.indicatorIds),
    assessmentIds: uniqueStrings(context.assessmentIds),
    learningResultIds: uniqueStrings(context.learningResultIds),
    externalEventIds: uniqueStrings(context.externalEventIds),
    graphSnapshotIds: uniqueStrings(context.graphSnapshotIds),
    tags: uniqueStrings(context.tags),
    timeWindow: {
      ...context.timeWindow,
      timezone:
        normalizeOptionalText(context.timeWindow.timezone) ??
        DEFAULT_TIMEZONE,
      academicPeriodIds: uniqueStrings(
        context.timeWindow.academicPeriodIds,
      ),
      metadata: { ...context.timeWindow.metadata },
    },
    metadata: { ...context.metadata },
  }
}

function normalizeConfiguration(
  configuration: AnalyticsConfiguration,
): AnalyticsConfiguration {
  return {
    ...configuration,
    analysisTypes: Array.from(
      new Set(configuration.analysisTypes),
    ),
    enabledCapabilities: Array.from(
      new Set(configuration.enabledCapabilities),
    ),
    correlationMethods: Array.from(
      new Set(configuration.correlationMethods),
    ),
    significanceLevel: Math.min(
      1,
      Math.max(
        0,
        safeNumber(configuration.significanceLevel, 0.05),
      ),
    ),
    minimumSampleSize: Math.max(
      1,
      Math.floor(
        safeNumber(configuration.minimumSampleSize, 2),
      ),
    ),
    minimumGroupSize: Math.max(
      1,
      Math.floor(
        safeNumber(configuration.minimumGroupSize, 5),
      ),
    ),
    minimumConfidence:
      clampScore(configuration.minimumConfidence) ?? 0.5,
    maximumMissingProportion:
      clampScore(configuration.maximumMissingProportion) ?? 0.2,
    variableDefinitions:
      configuration.variableDefinitions.map(
        normalizeVariableDefinition,
      ),
    metricDefinitions: configuration.metricDefinitions.map(
      metric => ({
        ...metric,
        id: normalizeRequiredText(metric.id, 'metric.id'),
        key: normalizeRequiredText(metric.key, 'metric.key'),
        label: normalizeRequiredText(metric.label, 'metric.label'),
        description: normalizeOptionalText(metric.description),
        unit: normalizeOptionalText(metric.unit),
        formula: normalizeOptionalText(metric.formula),
        metadata: { ...metric.metadata },
      }),
    ),
    timeWindow: {
      ...configuration.timeWindow,
      timezone:
        normalizeOptionalText(configuration.timeWindow.timezone) ??
        DEFAULT_TIMEZONE,
      academicPeriodIds: uniqueStrings(
        configuration.timeWindow.academicPeriodIds,
      ),
      metadata: { ...configuration.timeWindow.metadata },
    },
    metadata: { ...configuration.metadata },
  }
}

function normalizeInput(
  input: BuildEducationalAnalyticsInput,
): NormalizedBuildInput {
  const requestedByUserId =
    normalizeOptionalText(input.requestedByUserId)

  return {
    context: normalizeContext(input.context, requestedByUserId),
    configuration: normalizeConfiguration(input.configuration),
    sources: input.sources.map(normalizeSource),
    observations: input.observations.map(normalizeObservation),
    requestedByUserId,
    correlationId: normalizeRequiredText(
      input.correlationId,
      'correlationId',
    ),
    causationId: normalizeOptionalText(input.causationId),
    requestId: normalizeOptionalText(input.requestId),
    sessionId: normalizeOptionalText(input.sessionId),
    traceId: normalizeOptionalText(input.traceId),
    sourceEventId: normalizeOptionalText(input.sourceEventId),
    metadata: { ...input.metadata },
  }
}

function findDuplicatedValues(values: string[]): string[] {
  const counts = new Map<string, number>()

  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1)
  }

  return Array.from(counts.entries())
    .filter(([, count]) => count > 1)
    .map(([value]) => value)
}

function countObservationValues(
  observation: AnalyticsObservation,
): number {
  return [
    observation.numericValue,
    observation.textValue,
    observation.booleanValue,
    observation.categoryValue,
  ].filter(
    value => value !== null && value !== undefined,
  ).length
}

function validateNormalizedInput(
  input: NormalizedBuildInput,
): AnalyticsValidationResult {
  const issues: AnalyticsValidationIssue[] = []

  if (input.configuration.variableDefinitions.length === 0) {
    issues.push(
      createValidationIssue({
        code: 'ANALYTICS_VARIABLES_EMPTY',
        severity: 'high',
        message: 'Nenhuma variável analítica foi definida.',
        field: 'configuration.variableDefinitions',
        requiresHumanReview: true,
      }),
    )
  }

  if (input.sources.length === 0) {
    issues.push(
      createValidationIssue({
        code: 'ANALYTICS_SOURCES_EMPTY',
        severity: 'moderate',
        message: 'Nenhuma fonte de dados foi informada.',
        field: 'sources',
        requiresHumanReview: true,
      }),
    )
  }

  if (input.observations.length === 0) {
    issues.push(
      createValidationIssue({
        code: 'ANALYTICS_OBSERVATIONS_EMPTY',
        severity: 'high',
        message: 'Nenhuma observação foi informada.',
        field: 'observations',
        requiresHumanReview: true,
      }),
    )
  }

  const variableIds = new Set(
    input.configuration.variableDefinitions.map(
      variable => variable.id,
    ),
  )

  for (const duplicatedId of findDuplicatedValues(
    input.configuration.variableDefinitions.map(
      variable => variable.id,
    ),
  )) {
    issues.push(
      createValidationIssue({
        code: 'ANALYTICS_VARIABLE_DUPLICATED',
        severity: 'high',
        message: `A variável ${duplicatedId} está duplicada.`,
        field: 'configuration.variableDefinitions',
        entityId: duplicatedId,
      }),
    )
  }

  for (const duplicatedId of findDuplicatedValues(
    input.observations.map(observation => observation.id),
  )) {
    issues.push(
      createValidationIssue({
        code: 'ANALYTICS_OBSERVATION_DUPLICATED',
        severity: 'high',
        message: `A observação ${duplicatedId} está duplicada.`,
        field: 'observations',
        entityId: duplicatedId,
      }),
    )
  }

  for (const observation of input.observations) {
    if (!variableIds.has(observation.variableId)) {
      issues.push(
        createValidationIssue({
          code: 'ANALYTICS_VARIABLE_NOT_FOUND',
          severity: 'high',
          message:
            `A variável ${observation.variableId} da observação ` +
            `${observation.id} não foi encontrada.`,
          field: 'observations.variableId',
          entityId: observation.id,
        }),
      )
    }

    const populatedValues =
      countObservationValues(observation)

    if (populatedValues === 0 && !observation.excluded) {
      issues.push(
        createValidationIssue({
          code: 'ANALYTICS_OBSERVATION_EMPTY_VALUE',
          severity: 'moderate',
          message:
            `A observação ${observation.id} não possui valor ` +
            'utilizável.',
          field: 'observations',
          entityId: observation.id,
          requiresHumanReview: true,
        }),
      )
    }

    if (populatedValues > 1) {
      issues.push(
        createValidationIssue({
          code: 'ANALYTICS_OBSERVATION_MULTIPLE_VALUES',
          severity: 'moderate',
          message:
            `A observação ${observation.id} possui mais de um ` +
            'campo de valor preenchido.',
          field: 'observations',
          entityId: observation.id,
          requiresHumanReview: true,
        }),
      )
    }
  }

  if (
    input.configuration.generatePredictions &&
    !input.configuration.enabledCapabilities.includes(
      'prediction_engine',
    )
  ) {
    issues.push(
      createValidationIssue({
        code: 'ANALYTICS_PREDICTION_CAPABILITY_DISABLED',
        severity: 'moderate',
        message:
          'Predições foram solicitadas, mas prediction_engine ' +
          'não está habilitado.',
        field: 'configuration.enabledCapabilities',
      }),
    )
  }

  if (
    input.configuration.allowCausalAnalysis &&
    !input.configuration.generateResearchHypotheses
  ) {
    issues.push(
      createValidationIssue({
        code: 'ANALYTICS_CAUSAL_WITHOUT_RESEARCH',
        severity: 'high',
        message:
          'Análise causal não pode ser habilitada sem ' +
          'governança de pesquisa.',
        field: 'configuration.allowCausalAnalysis',
        requiresHumanReview: true,
      }),
    )
  }

  const excludedObservationCount =
    input.observations.filter(
      observation => observation.excluded,
    ).length

  const missingObservationCount =
    input.observations.filter(
      observation => countObservationValues(observation) === 0,
    ).length

  return {
    valid: !issues.some(
      issue =>
        issue.severity === 'critical' ||
        issue.severity === 'high',
    ),
    issues,
    sourceCount: input.sources.length,
    observationCount: input.observations.length,
    variableCount:
      input.configuration.variableDefinitions.length,
    metricCount:
      input.configuration.metricDefinitions.length,
    excludedObservationCount,
    missingObservationCount,
    generatedAt: nowIso(),
    metadata: {
      engineName: ENGINE_NAME,
      engineVersion: ENGINE_VERSION,
    },
  }
}

function resolveQualityLevel(
  score: number,
): AnalyticsDataQualityScore['level'] {
  if (!Number.isFinite(score)) return 'undetermined'
  if (score < 0.2) return 'unacceptable'
  if (score < 0.4) return 'low'
  if (score < 0.7) return 'moderate'
  if (score < 0.9) return 'good'
  return 'excellent'
}

function evaluateDataQuality(
  input: NormalizedBuildInput,
): QualityEvaluation {
  const issues: AnalyticsValidationIssue[] = []
  const warnings: string[] = []
  const observations = input.observations
  const total = observations.length

  const missingValueCount = observations.filter(
    observation => countObservationValues(observation) === 0,
  ).length

  const excludedObservationCount = observations.filter(
    observation => observation.excluded,
  ).length

  const invalidValueCount = observations.filter(
    observation =>
      observation.numericValue !== null &&
      !Number.isFinite(observation.numericValue),
  ).length

  const duplicateCount = findDuplicatedValues(
    observations.map(observation => observation.id),
  ).length

  const dimensions: Array<{
    dimension: AnalyticsDataQualityDimension
    score: number
    issues: string[]
  }> = [
    {
      dimension: 'completeness',
      score:
        total > 0 ? 1 - missingValueCount / total : 0,
      issues:
        missingValueCount > 0
          ? [`${missingValueCount} observações sem valor.`]
          : [],
    },
    {
      dimension: 'consistency',
      score:
        total > 0
          ? observations.filter(
              observation =>
                countObservationValues(observation) <= 1,
            ).length / total
          : 0,
      issues: [],
    },
    {
      dimension: 'accuracy',
      score:
        total > 0 ? 1 - invalidValueCount / total : 0,
      issues:
        invalidValueCount > 0
          ? [`${invalidValueCount} valores inválidos.`]
          : [],
    },
    {
      dimension: 'timeliness',
      score:
        total > 0
          ? observations.filter(
              observation => Boolean(observation.recordedAt),
            ).length / total
          : 0,
      issues: [],
    },
    {
      dimension: 'validity',
      score:
        total > 0 ? 1 - invalidValueCount / total : 0,
      issues: [],
    },
    {
      dimension: 'uniqueness',
      score:
        total > 0 ? 1 - duplicateCount / total : 0,
      issues:
        duplicateCount > 0
          ? [`${duplicateCount} identificadores duplicados.`]
          : [],
    },
    {
      dimension: 'representativeness',
      score:
        total >= input.configuration.minimumSampleSize
          ? 1
          : total /
            input.configuration.minimumSampleSize,
      issues:
        total < input.configuration.minimumSampleSize
          ? ['Amostra abaixo do mínimo configurado.']
          : [],
    },
    {
      dimension: 'traceability',
      score:
        total > 0
          ? observations.filter(
              observation =>
                observation.sourceReferences.length > 0,
            ).length / total
          : 0,
      issues: [],
    },
  ]

  const normalizedDimensions: AnalyticsDataQualityScore[] =
    dimensions.map(item => ({
      dimension: item.dimension,
      score: clampScore(item.score),
      level: resolveQualityLevel(item.score),
      issues: item.issues,
      affectedSourceIds: [],
      metadata: {
        engineName: ENGINE_NAME,
      },
    }))

  const overallScore = calculateAverage(
    normalizedDimensions.map(
      dimension => dimension.score,
    ),
  )

  const missingProportion =
    total > 0 ? missingValueCount / total : 1

  if (
    missingProportion >
    input.configuration.maximumMissingProportion
  ) {
    const message =
      'A proporção de dados ausentes excede o limite configurado.'

    warnings.push(message)

    issues.push(
      createValidationIssue({
        code: 'ANALYTICS_MISSING_PROPORTION_EXCEEDED',
        severity: 'high',
        message,
        field: 'observations',
        requiresHumanReview: true,
      }),
    )
  }

  if (total < input.configuration.minimumSampleSize) {
    const message =
      'O tamanho da amostra é insuficiente para parte das análises.'

    warnings.push(message)

    issues.push(
      createValidationIssue({
        code: 'ANALYTICS_SAMPLE_SIZE_INSUFFICIENT',
        severity: 'high',
        message,
        field: 'observations',
        requiresHumanReview: true,
      }),
    )
  }

  return {
    quality: {
      overallScore,
      dimensions: normalizedDimensions,
      duplicateCount,
      missingValueCount,
      invalidValueCount,
      excludedObservationCount,
      warnings: uniqueStrings(warnings),
      evaluatedAt: nowIso(),
      metadata: {
        engineName: ENGINE_NAME,
        engineVersion: ENGINE_VERSION,
      },
    },
    issues,
    warnings,
  }
}

function evaluateGovernance(
  input: NormalizedBuildInput,
): GovernanceEvaluation {
  const issues: AnalyticsValidationIssue[] = []
  const warnings: string[] = []
  const variables =
    input.configuration.variableDefinitions

  const containsPersonalData = variables.some(
    variable => variable.containsPersonalData,
  )
  const containsMinorData = variables.some(
    variable => variable.containsMinorData,
  )
  const containsSensitiveData = variables.some(
    variable => variable.sensitive,
  )

  const anonymized = Boolean(input.metadata.anonymized)
  const pseudonymized = Boolean(input.metadata.pseudonymized)
  const aggregated = Boolean(input.metadata.aggregated)

  const privacy: AnalyticsPrivacy = {
    level: containsSensitiveData
      ? 'highly_restricted'
      : containsMinorData
        ? 'confidential'
        : containsPersonalData
          ? 'restricted'
          : 'internal',
    containsPersonalData,
    containsSensitiveData,
    containsMinorData,
    anonymized,
    pseudonymized,
    aggregated,
    minimumGroupSize: input.configuration.minimumGroupSize,
    reidentificationRisk:
      containsSensitiveData && !anonymized
        ? 'high'
        : containsPersonalData
          ? 'moderate'
          : 'low',
    lawfulBasis:
      typeof input.metadata.lawfulBasis === 'string'
        ? input.metadata.lawfulBasis
        : null,
    retentionPolicy:
      typeof input.metadata.retentionPolicy === 'string'
        ? input.metadata.retentionPolicy
        : null,
    accessRestrictions:
      containsSensitiveData || containsMinorData
        ? [
            'Acesso restrito a usuários autorizados.',
            'Uso exclusivamente educacional ou de pesquisa aprovada.',
          ]
        : [],
    prohibitedUses: [
      'Decisão pedagógica totalmente automatizada.',
      'Classificação discriminatória.',
      'Uso punitivo sem revisão humana.',
      'Inferência causal baseada apenas em correlação.',
    ],
    notes:
      'RLS e autorização devem ser aplicadas externamente.',
    metadata: {
      engineName: ENGINE_NAME,
    },
  }

  const ethics: AnalyticsEthics = {
    humanOversightRequired: true,
    professionalAutonomyPreserved: true,
    automatedDecisionProhibited: true,
    discriminationAssessmentRequired: containsSensitiveData,
    biasAssessmentRequired:
      input.configuration.generatePredictions ||
      input.configuration.generateRecommendations,
    inclusionAssessmentRequired: true,
    accessibilityAssessmentRequired: true,
    humanSubjectsReviewRequired:
      input.configuration.generateResearchHypotheses ||
      input.context.type === 'research',
    consentRequired:
      containsPersonalData &&
      input.context.type === 'research',
    consentVerified:
      typeof input.metadata.consentVerified === 'boolean'
        ? input.metadata.consentVerified
        : null,
    ethicalWarnings: [],
    metadata: {
      engineName: ENGINE_NAME,
    },
  }

  const researchEligibility: AnalyticsResearchEligibility = {
    eligible:
      input.configuration.generateResearchHypotheses ||
      input.context.type === 'research',
    longitudinalUseAllowed:
      input.configuration.analysisTypes.includes('longitudinal'),
    correlationUseAllowed:
      input.configuration.calculateCorrelations,
    predictionUseAllowed:
      input.configuration.generatePredictions &&
      !containsSensitiveData,
    groupAnalysisAllowed:
      input.context.scope !== 'individual',
    subgroupAnalysisAllowed:
      input.context.scope === 'subgroup' ||
      input.context.scope === 'research_sample' ||
      input.context.groupIds.length > 0,
    externalEventAnalysisAllowed:
      input.context.externalEventIds.length > 0,
    zoneInfluenceAnalysisAllowed:
      input.configuration.calculateInfluence &&
      input.context.graphSnapshotIds.length > 0,
    groupFormationAnalysisAllowed:
      input.configuration.detectPatterns &&
      input.context.groupIds.length > 0,
    groupReorganizationAnalysisAllowed:
      input.configuration.detectPatterns &&
      input.context.groupIds.length > 0,
    hypothesisGenerationAllowed:
      input.configuration.generateResearchHypotheses,
    causalInferenceAllowed:
      input.configuration.allowCausalAnalysis &&
      input.configuration.generateResearchHypotheses &&
      Boolean(input.metadata.causalGovernanceApproved),
    anonymizationRequired:
      containsPersonalData ||
      containsMinorData ||
      containsSensitiveData,
    aggregationRequired:
      containsMinorData || containsSensitiveData,
    minimumGroupSize: input.configuration.minimumGroupSize,
    humanSubjectsReviewRequired:
      ethics.humanSubjectsReviewRequired,
    restrictions: [],
    notes:
      'Elegibilidade não representa aprovação ética automática.',
    metadata: {
      engineName: ENGINE_NAME,
    },
  }

  if (
    researchEligibility.anonymizationRequired &&
    !anonymized &&
    !pseudonymized
  ) {
    const message =
      'Os dados exigem anonimização ou pseudonimização.'

    warnings.push(message)

    issues.push(
      createValidationIssue({
        code: 'ANALYTICS_ANONYMIZATION_REQUIRED',
        severity: 'high',
        message,
        field: 'privacy',
        requiresHumanReview: true,
      }),
    )
  }

  if (
    researchEligibility.aggregationRequired &&
    !aggregated &&
    input.context.scope !== 'individual'
  ) {
    const message =
      'Dados sensíveis ou de menores devem ser agregados.'

    warnings.push(message)

    issues.push(
      createValidationIssue({
        code: 'ANALYTICS_AGGREGATION_REQUIRED',
        severity: 'high',
        message,
        field: 'privacy',
        requiresHumanReview: true,
      }),
    )
  }

  if (
    input.configuration.allowCausalAnalysis &&
    !researchEligibility.causalInferenceAllowed
  ) {
    const message =
      'A análise causal foi bloqueada pela governança.'

    warnings.push(message)

    issues.push(
      createValidationIssue({
        code: 'ANALYTICS_CAUSAL_ANALYSIS_BLOCKED',
        severity: 'critical',
        message,
        field: 'configuration.allowCausalAnalysis',
        requiresHumanReview: true,
      }),
    )
  }

  if (
    input.configuration.generatePredictions &&
    containsSensitiveData
  ) {
    const message =
      'Predições com atributos sensíveis foram bloqueadas.'

    warnings.push(message)

    issues.push(
      createValidationIssue({
        code: 'ANALYTICS_SENSITIVE_PREDICTION_BLOCKED',
        severity: 'critical',
        message,
        field: 'configuration.generatePredictions',
        requiresHumanReview: true,
      }),
    )
  }

  return {
    allowed: !issues.some(
      issue => issue.severity === 'critical',
    ),
    privacy,
    ethics,
    researchEligibility,
    issues,
    warnings,
  }
}

function buildTraceability(
  input: NormalizedBuildInput,
): AnalyticsTraceability {
  return {
    correlationId: input.correlationId,
    causationId: input.causationId,
    requestId: input.requestId,
    sessionId: input.sessionId,
    traceId: input.traceId,
    sourceEventId: input.sourceEventId,
    parentAnalysisIds: [],
    relatedAnalysisIds: [],
    sourceGraphSnapshotIds:
      input.context.graphSnapshotIds,
    sourceEvidenceIds: input.context.evidenceIds,
    sourceInterventionIds:
      input.context.interventionIds,
    createdBy: input.requestedByUserId,
    updatedBy: input.requestedByUserId,
    reviewedBy: null,
    metadata: {
      engineName: ENGINE_NAME,
      engineVersion: ENGINE_VERSION,
    },
  }
}

function buildVersion(
  input: NormalizedBuildInput,
  generatedAt: AnalyticsTimestamp,
): AnalyticsVersion {
  return {
    id: createStableId(
      'analytics-version',
      `${input.context.analysisKey}:${generatedAt}`,
    ),
    analysisKey: input.context.analysisKey,
    versionNumber: 1,
    versionLabel: '1.0',
    status: 'current',
    previousVersionId: null,
    parentVersionId: null,
    isCurrent: true,
    createdAt: generatedAt,
    createdBy: input.requestedByUserId,
    changeReason: 'Initial analytics orchestration result.',
    changedFields: [
      'context',
      'configuration',
      'sources',
      'observations',
      'dataQuality',
      'privacy',
      'ethics',
      'researchEligibility',
      'explainability',
      'traceability',
    ],
    metadata: {
      engineName: ENGINE_NAME,
      engineVersion: ENGINE_VERSION,
    },
  }
}

function buildReproducibility(
  input: NormalizedBuildInput,
  generatedAt: AnalyticsTimestamp,
): AnalyticsReproducibility {
  return {
    reproducible: true,
    deterministic: true,
    randomSeed: input.configuration.randomSeed,
    datasetVersion:
      typeof input.metadata.datasetVersion === 'string'
        ? input.metadata.datasetVersion
        : null,
    queryVersion:
      typeof input.metadata.queryVersion === 'string'
        ? input.metadata.queryVersion
        : null,
    codeVersion:
      typeof input.metadata.codeVersion === 'string'
        ? input.metadata.codeVersion
        : null,
    engineVersion: ENGINE_VERSION,
    rulesetVersion: RULESET_VERSION,
    parameterSnapshot: {
      configuration: input.configuration,
      context: input.context,
    },
    sourceChecksums: uniqueStrings(
      input.sources.map(source => source.checksum),
    ),
    executedAt: generatedAt,
    metadata: {
      engineName: ENGINE_NAME,
    },
  }
}

function buildExplainability({
  input,
  validation,
  quality,
  governance,
  generatedAt,
}: {
  input: NormalizedBuildInput
  validation: AnalyticsValidationResult
  quality: AnalyticsDataQuality
  governance: GovernanceEvaluation
  generatedAt: AnalyticsTimestamp
}): AnalyticsExplainability {
  return {
    summary:
      'O Educational Analytics Engine validou, normalizou e ' +
      'aplicou governança inicial aos dados.',
    reasons: [
      `Foram avaliadas ${input.observations.length} observações.`,
      `Foram avaliadas ${input.sources.length} fontes.`,
      `Qualidade inicial: ${quality.overallScore ?? 'indeterminada'}.`,
    ],
    rulesApplied: [
      'input_normalization',
      'variable_reference_validation',
      'observation_value_validation',
      'minimum_sample_size_check',
      'missing_data_threshold_check',
      'privacy_classification',
      'anonymization_requirement_check',
      'aggregation_requirement_check',
      'causal_governance_check',
      'sensitive_prediction_guard',
      'human_oversight_requirement',
    ],
    variablesUsed:
      input.configuration.variableDefinitions.map(
        variable => variable.id,
      ),
    sourceReferences: input.sources,
    assumptions: [
      'Os identificadores são estáveis no contexto do EIOS.',
      'As datas seguem ISO 8601 quando presentes.',
      'Os dados vieram de fontes autorizadas.',
    ],
    limitations: [
      'Este orquestrador não executa cálculos especializados.',
      'Associação não representa causalidade.',
      'Predições e recomendações exigem revisão humana.',
      'RLS deve ser aplicada externamente.',
    ],
    uncertaintyFactors: [
      ...quality.warnings,
      ...governance.warnings,
    ],
    alternativeExplanations:
      validation.issues.length > 0
        ? [
            'Resultados incompletos podem decorrer de ausência ou inconsistência dos dados.',
            'Diferenças podem decorrer de contexto não representado nas fontes.',
          ]
        : [],
    causalityStatus:
      input.configuration.allowCausalAnalysis &&
      governance.researchEligibility.causalInferenceAllowed
        ? 'causal_analysis_required'
        : 'descriptive_only',
    generatedAt,
    engineName: ENGINE_NAME,
    engineVersion: ENGINE_VERSION,
    metadata: {
      rulesetVersion: RULESET_VERSION,
      validationIssueCount: validation.issues.length,
    },
  }
}

function createEvent({
  analysisId,
  type,
  traceability,
  actorId,
  payload = {},
}: {
  analysisId: AnalyticsIdentifier
  type: AnalyticsEvent['type']
  traceability: AnalyticsTraceability
  actorId: AnalyticsIdentifier | null
  payload?: AnalyticsMetadata
}): AnalyticsEvent {
  const occurredAt = nowIso()

  return {
    id: createStableId(
      'analytics-event',
      `${analysisId}:${type}:${occurredAt}`,
    ),
    type,
    analysisId,
    occurredAt,
    actorId,
    actorType: actorId ? 'user' : 'engine',
    payload,
    traceability,
    metadata: {
      engineName: ENGINE_NAME,
    },
  }
}

function resolveStatus({
  validation,
  governance,
  warnings,
}: {
  validation: AnalyticsValidationResult
  governance: GovernanceEvaluation
  warnings: string[]
}): AnalyticsStatus {
  if (!validation.valid || !governance.allowed) {
    return 'failed'
  }

  return warnings.length > 0
    ? 'completed_with_warnings'
    : 'completed'
}

function buildAnalyticsResult({
  input,
  validation,
  quality,
  governance,
  generatedAt,
}: {
  input: NormalizedBuildInput
  validation: AnalyticsValidationResult
  quality: AnalyticsDataQuality
  governance: GovernanceEvaluation
  generatedAt: AnalyticsTimestamp
}): EducationalAnalyticsResult {
  const traceability = buildTraceability(input)

  const warnings = uniqueStrings([
    ...quality.warnings,
    ...governance.warnings,
    ...validation.issues
      .filter(
        issue =>
          issue.severity === 'information' ||
          issue.severity === 'low' ||
          issue.severity === 'moderate',
      )
      .map(issue => issue.message),
    'Motores especializados ainda não foram executados.',
  ])

  const errors = uniqueStrings(
    validation.issues
      .filter(
        issue =>
          issue.severity === 'critical' ||
          issue.severity === 'high',
      )
      .map(issue => issue.message),
  )

  const status = resolveStatus({
    validation,
    governance,
    warnings,
  })

  const events: AnalyticsEvent[] = [
    createEvent({
      analysisId: input.context.analysisId,
      type: 'analysis_requested',
      traceability,
      actorId: input.requestedByUserId,
      payload: {
        sourceCount: input.sources.length,
        observationCount: input.observations.length,
      },
    }),
    createEvent({
      analysisId: input.context.analysisId,
      type: 'analysis_started',
      traceability,
      actorId: null,
    }),
    createEvent({
      analysisId: input.context.analysisId,
      type: 'data_validated',
      traceability,
      actorId: null,
      payload: {
        valid: validation.valid,
        issueCount: validation.issues.length,
      },
    }),
  ]

  if (status === 'failed') {
    events.push(
      createEvent({
        analysisId: input.context.analysisId,
        type: 'analysis_failed',
        traceability,
        actorId: null,
        payload: { errors },
      }),
    )
  } else {
    if (
      input.configuration.requireHumanReview ||
      warnings.length > 0
    ) {
      events.push(
        createEvent({
          analysisId: input.context.analysisId,
          type: 'human_review_requested',
          traceability,
          actorId: null,
          payload: {
            reason:
              'Governança, qualidade ou configuração exige revisão humana.',
          },
        }),
      )
    }

    events.push(
      createEvent({
        analysisId: input.context.analysisId,
        type: 'analysis_completed',
        traceability,
        actorId: null,
        payload: { status },
      }),
    )
  }

  return {
    id: input.context.analysisId,
    analysisKey: input.context.analysisKey,
    context: input.context,
    configuration: input.configuration,
    status,
    sources: input.sources,
    observations: input.observations,
    metricResults: [],
    correlations: [],
    patterns: [],
    anomalies: [],
    influences: [],
    predictions: [],
    recommendations: [],
    researchResults: [],
    dataQuality: quality,
    privacy: governance.privacy,
    ethics: governance.ethics,
    researchEligibility: governance.researchEligibility,
    explainability: buildExplainability({
      input,
      validation,
      quality,
      governance,
      generatedAt,
    }),
    modelReferences: [],
    traceability,
    events,
    version: buildVersion(input, generatedAt),
    warnings,
    errors,
    generatedAt,
    completedAt: generatedAt,
    archivedAt: null,
    metadata: {
      ...input.metadata,
      engineName: ENGINE_NAME,
      engineVersion: ENGINE_VERSION,
      rulesetVersion: RULESET_VERSION,
      orchestrationOnly: true,
      specializedEnginesExecuted: false,
      reproducibility: buildReproducibility(
        input,
        generatedAt,
      ),
    },
  }
}

export function validateEducationalAnalyticsInput(
  input: BuildEducationalAnalyticsInput,
): AnalyticsValidationResult {
  try {
    return validateNormalizedInput(
      normalizeInput(input),
    )
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Falha desconhecida na validação analítica.'

    return {
      valid: false,
      issues: [
        createValidationIssue({
          code: 'ANALYTICS_VALIDATION_EXCEPTION',
          severity: 'critical',
          message,
          requiresHumanReview: true,
        }),
      ],
      sourceCount: input.sources?.length ?? 0,
      observationCount: input.observations?.length ?? 0,
      variableCount:
        input.configuration?.variableDefinitions?.length ?? 0,
      metricCount:
        input.configuration?.metricDefinitions?.length ?? 0,
      excludedObservationCount: 0,
      missingObservationCount: 0,
      generatedAt: nowIso(),
      metadata: {
        engineName: ENGINE_NAME,
        engineVersion: ENGINE_VERSION,
        failure: true,
      },
    }
  }
}

export function buildEducationalAnalytics(
  input: BuildEducationalAnalyticsInput,
): EducationalAnalyticsBuildResult {
  const generatedAt = nowIso()

  try {
    const normalized = normalizeInput(input)
    const validation = validateNormalizedInput(normalized)
    const qualityEvaluation = evaluateDataQuality(normalized)

    validation.issues.push(...qualityEvaluation.issues)

    const governance = evaluateGovernance(normalized)

    validation.issues.push(...governance.issues)
    validation.valid = !validation.issues.some(
      issue =>
        issue.severity === 'critical' ||
        issue.severity === 'high',
    )

    const analytics = buildAnalyticsResult({
      input: normalized,
      validation,
      quality: qualityEvaluation.quality,
      governance,
      generatedAt,
    })

    return {
      success: analytics.status !== 'failed',
      analytics,
      validation,
      warnings: analytics.warnings,
      errors: analytics.errors,
      generatedAt,
      correlationId: normalized.correlationId,
      metadata: {
        engineName: ENGINE_NAME,
        engineVersion: ENGINE_VERSION,
        rulesetVersion: RULESET_VERSION,
        orchestrationOnly: true,
      },
    }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Não foi possível construir o resultado analítico.'

    const correlationId =
      normalizeOptionalText(input.correlationId) ??
      createStableId(
        'analytics-correlation',
        generatedAt,
      )

    const validation: AnalyticsValidationResult = {
      valid: false,
      issues: [
        createValidationIssue({
          code: 'ANALYTICS_BUILD_EXCEPTION',
          severity: 'critical',
          message,
          requiresHumanReview: true,
        }),
      ],
      sourceCount: input.sources?.length ?? 0,
      observationCount: input.observations?.length ?? 0,
      variableCount:
        input.configuration?.variableDefinitions?.length ?? 0,
      metricCount:
        input.configuration?.metricDefinitions?.length ?? 0,
      excludedObservationCount: 0,
      missingObservationCount: 0,
      generatedAt,
      metadata: {
        engineName: ENGINE_NAME,
        engineVersion: ENGINE_VERSION,
        failure: true,
      },
    }

    return {
      success: false,
      analytics: null,
      validation,
      warnings: [],
      errors: [message],
      generatedAt,
      correlationId,
      metadata: {
        engineName: ENGINE_NAME,
        engineVersion: ENGINE_VERSION,
        rulesetVersion: RULESET_VERSION,
        stage: 'build_exception',
      },
    }
  }
}

export function getEducationalAnalyticsEngineInfo() {
  return {
    name: ENGINE_NAME,
    version: ENGINE_VERSION,
    rulesetVersion: RULESET_VERSION,
    mode: 'deterministic' as const,
    capability: 'educational_analytics' as const,
    responsibilities: [
      'input_validation',
      'context_normalization',
      'configuration_normalization',
      'data_quality_assessment',
      'privacy_governance',
      'ethics_governance',
      'research_eligibility',
      'traceability',
      'versioning',
      'event_generation',
      'explainability',
      'human_review_request',
      'result_consolidation',
    ],
    specializedEngines: [
      'correlation_engine',
      'pattern_engine',
      'influence_engine',
      'prediction_engine',
      'recommendation_engine',
      'research_engine',
    ],
    limitations: [
      'Não executa correlações estatísticas nesta versão.',
      'Não detecta padrões ou anomalias nesta versão.',
      'Não calcula influência nesta versão.',
      'Não gera predições nesta versão.',
      'Não gera recomendações nesta versão.',
      'Não substitui revisão humana.',
      'Não aplica RLS ou autorização de acesso.',
      'Não transforma associação em causalidade.',
    ],
  }
}
