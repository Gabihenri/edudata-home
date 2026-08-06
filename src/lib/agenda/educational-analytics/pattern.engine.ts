/**
 * EduData IA — EIOS
 * Capability 04.2: Pattern Engine
 *
 * Motor determinístico de padrões e anomalias educacionais.
 *
 * Responsabilidades:
 * - detectar tendências, progressões e regressões;
 * - identificar recorrências, concentração e dispersão;
 * - detectar anomalias pontuais e contextuais;
 * - reconhecer padrões de grupos quando os dados permitirem;
 * - registrar confiança, evidências e explicabilidade;
 * - preservar revisão humana e autonomia profissional.
 *
 * Limitações:
 * - não executa inferência causal;
 * - não classifica estudantes de forma punitiva;
 * - não substitui avaliação pedagógica humana;
 * - não acessa banco de dados;
 * - não aplica RLS.
 */

import type {
  AnalyticsAnomalyResult,
  AnalyticsConfidence,
  AnalyticsDirection,
  AnalyticsEntityType,
  AnalyticsExplainability,
  AnalyticsIdentifier,
  AnalyticsMetadata,
  AnalyticsObservation,
  AnalyticsPatternResult,
  AnalyticsPatternType,
  AnalyticsSeverity,
  AnalyticsSourceReference,
  AnalyticsTimestamp,
  AnalyticsVariableDefinition,
} from './analytics.types'

const ENGINE_NAME = 'eios-pattern-engine'
const ENGINE_VERSION = '1.0.0'
const RULESET_VERSION = 'pattern-ruleset-1.0.0'

const DEFAULT_MINIMUM_OBSERVATIONS = 3
const DEFAULT_TREND_THRESHOLD = 0.05
const DEFAULT_ANOMALY_Z_THRESHOLD = 2.5
const DEFAULT_RECURRENCE_TOLERANCE = 0.05
const EPSILON = 1e-12

export type PatternGroupingStrategy =
  | 'entity'
  | 'entity_and_variable'
  | 'class_and_variable'
  | 'group_and_variable'
  | 'variable'
  | 'custom'

export type PatternEngineConfiguration = {
  detectTrends?: boolean
  detectRecurrences?: boolean
  detectConcentration?: boolean
  detectDispersion?: boolean
  detectAnomalies?: boolean
  detectGroupPatterns?: boolean
  detectExternalEventResponses?: boolean
  minimumObservations?: number
  trendThreshold?: number
  anomalyZThreshold?: number
  recurrenceTolerance?: number
  groupingStrategy?: PatternGroupingStrategy
  requireObservedAt?: boolean
}

export type PatternEngineInput = {
  observations: AnalyticsObservation[]
  variableDefinitions: AnalyticsVariableDefinition[]
  sourceReferences?: AnalyticsSourceReference[]
  configuration?: PatternEngineConfiguration
  externalEventIds?: AnalyticsIdentifier[]
  requestedByUserId?: AnalyticsIdentifier | null
  correlationId: string
  metadata?: AnalyticsMetadata
}

export type PatternSeriesPoint = {
  observationId: AnalyticsIdentifier
  entityId: AnalyticsIdentifier
  entityType: AnalyticsEntityType
  variableId: AnalyticsIdentifier
  value: number
  observedAt: AnalyticsTimestamp | null
  recordedAt: AnalyticsTimestamp
  classId: AnalyticsIdentifier | null
  groupId: AnalyticsIdentifier | null
  academicPeriodId: AnalyticsIdentifier | null
  sourceReferences: AnalyticsSourceReference[]
  metadata: AnalyticsMetadata
}

export type PatternSeries = {
  key: string
  entityIds: AnalyticsIdentifier[]
  entityTypes: AnalyticsEntityType[]
  variableIds: AnalyticsIdentifier[]
  classIds: AnalyticsIdentifier[]
  groupIds: AnalyticsIdentifier[]
  points: PatternSeriesPoint[]
}

export type PatternEngineResult = {
  success: boolean
  patterns: AnalyticsPatternResult[]
  anomalies: AnalyticsAnomalyResult[]
  seriesCount: number
  observationCount: number
  warnings: string[]
  errors: string[]
  generatedAt: AnalyticsTimestamp
  correlationId: string
  metadata: AnalyticsMetadata
}

type LinearTrend = {
  slope: number | null
  intercept: number | null
  direction: AnalyticsDirection
  normalizedMagnitude: number | null
  fitScore: number | null
}

type DistributionSummary = {
  count: number
  mean: number | null
  median: number | null
  minimum: number | null
  maximum: number | null
  range: number | null
  variance: number | null
  standardDeviation: number | null
  coefficientOfVariation: number | null
}

type RecurrenceSummary = {
  recurrent: boolean
  recurrenceCount: number
  frequency: number | null
  score: number | null
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

function clamp(
  value: number,
  minimum: number,
  maximum: number,
): number {
  return Math.min(maximum, Math.max(minimum, value))
}

function uniqueStrings(
  values: Array<string | null | undefined>,
): string[] {
  return Array.from(
    new Set(
      values
        .filter(
          (value): value is string =>
            typeof value === 'string',
        )
        .map(value => value.trim())
        .filter(Boolean),
    ),
  )
}

function stableHash(value: string): string {
  let hash = 2166136261

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return (hash >>> 0).toString(16).padStart(8, '0')
}

function createStableId(
  prefix: string,
  value: string,
): string {
  return `${prefix}-${stableHash(value)}`
}

function mean(values: number[]): number | null {
  if (values.length === 0) {
    return null
  }

  return (
    values.reduce(
      (total, value) => total + value,
      0,
    ) / values.length
  )
}

function median(values: number[]): number | null {
  if (values.length === 0) {
    return null
  }

  const sorted = [...values].sort(
    (first, second) => first - second,
  )

  const middle = Math.floor(sorted.length / 2)

  if (sorted.length % 2 === 0) {
    return (
      sorted[middle - 1] +
      sorted[middle]
    ) / 2
  }

  return sorted[middle]
}

function variance(values: number[]): number | null {
  if (values.length < 2) {
    return null
  }

  const average = mean(values)

  if (average === null) {
    return null
  }

  return (
    values.reduce(
      (total, value) =>
        total + (value - average) ** 2,
      0,
    ) /
    (values.length - 1)
  )
}

function standardDeviation(
  values: number[],
): number | null {
  const calculatedVariance = variance(values)

  if (calculatedVariance === null) {
    return null
  }

  return Math.sqrt(
    Math.max(0, calculatedVariance),
  )
}

function summarizeDistribution(
  values: number[],
): DistributionSummary {
  if (values.length === 0) {
    return {
      count: 0,
      mean: null,
      median: null,
      minimum: null,
      maximum: null,
      range: null,
      variance: null,
      standardDeviation: null,
      coefficientOfVariation: null,
    }
  }

  const average = mean(values)
  const minimum = Math.min(...values)
  const maximum = Math.max(...values)
  const calculatedVariance = variance(values)
  const deviation = standardDeviation(values)

  return {
    count: values.length,
    mean: average,
    median: median(values),
    minimum,
    maximum,
    range: maximum - minimum,
    variance: calculatedVariance,
    standardDeviation: deviation,
    coefficientOfVariation:
      average !== null &&
      Math.abs(average) > EPSILON &&
      deviation !== null
        ? Math.abs(deviation / average)
        : null,
  }
}

function calculateLinearTrend(
  points: PatternSeriesPoint[],
  threshold: number,
): LinearTrend {
  if (points.length < 2) {
    return {
      slope: null,
      intercept: null,
      direction: 'undetermined',
      normalizedMagnitude: null,
      fitScore: null,
    }
  }

  const xValues = points.map(
    (_, index) => index,
  )
  const yValues = points.map(
    point => point.value,
  )

  const xMean = mean(xValues)
  const yMean = mean(yValues)

  if (xMean === null || yMean === null) {
    return {
      slope: null,
      intercept: null,
      direction: 'undetermined',
      normalizedMagnitude: null,
      fitScore: null,
    }
  }

  let numerator = 0
  let denominator = 0

  for (let index = 0; index < points.length; index += 1) {
    const xDifference = xValues[index] - xMean
    const yDifference = yValues[index] - yMean

    numerator += xDifference * yDifference
    denominator += xDifference ** 2
  }

  if (denominator <= EPSILON) {
    return {
      slope: null,
      intercept: null,
      direction: 'undetermined',
      normalizedMagnitude: null,
      fitScore: null,
    }
  }

  const slope = numerator / denominator
  const intercept = yMean - slope * xMean
  const scale =
    Math.max(
      EPSILON,
      Math.abs(yMean),
      Math.max(...yValues.map(Math.abs)),
    )
  const normalizedMagnitude = Math.abs(slope) / scale

  let direction: AnalyticsDirection

  if (normalizedMagnitude < threshold) {
    direction = 'stable'
  } else {
    direction =
      slope > 0
        ? 'increasing'
        : 'decreasing'
  }

  const predicted = xValues.map(
    value => intercept + slope * value,
  )

  const totalVariation = yValues.reduce(
    (total, value) =>
      total + (value - yMean) ** 2,
    0,
  )

  const residualVariation = yValues.reduce(
    (total, value, index) =>
      total +
      (value - predicted[index]) ** 2,
    0,
  )

  const fitScore =
    totalVariation <= EPSILON
      ? 1
      : clamp(
          1 -
            residualVariation /
              totalVariation,
          0,
          1,
        )

  return {
    slope,
    intercept,
    direction,
    normalizedMagnitude,
    fitScore,
  }
}

function calculateRecurrence(
  values: number[],
  tolerance: number,
): RecurrenceSummary {
  if (values.length < 3) {
    return {
      recurrent: false,
      recurrenceCount: 0,
      frequency: null,
      score: null,
    }
  }

  const summary = summarizeDistribution(values)
  const scale =
    Math.max(
      EPSILON,
      Math.abs(summary.mean ?? 0),
      summary.range ?? 0,
    )

  const absoluteTolerance =
    Math.max(EPSILON, scale * tolerance)

  let recurrenceCount = 0
  const gaps: number[] = []

  for (
    let first = 0;
    first < values.length - 1;
    first += 1
  ) {
    for (
      let second = first + 1;
      second < values.length;
      second += 1
    ) {
      if (
        Math.abs(
          values[first] -
            values[second],
        ) <= absoluteTolerance
      ) {
        recurrenceCount += 1
        gaps.push(second - first)
        break
      }
    }
  }

  const possible =
    values.length - 1

  const score =
    possible > 0
      ? clamp(
          recurrenceCount /
            possible,
          0,
          1,
        )
      : null

  return {
    recurrent:
      recurrenceCount >= 2 &&
      (score ?? 0) >= 0.5,
    recurrenceCount,
    frequency: mean(gaps),
    score,
  }
}

function resolveConfidenceLevel(
  score: number | null,
): AnalyticsConfidence['level'] {
  if (score === null) return 'undetermined'
  if (score < 0.2) return 'very_low'
  if (score < 0.4) return 'low'
  if (score < 0.6) return 'moderate'
  if (score < 0.8) return 'high'
  return 'very_high'
}

function resolveEvidenceStrength(
  score: number | null,
): AnalyticsConfidence['evidenceStrength'] {
  if (score === null) return 'undetermined'
  if (score < 0.2) return 'insufficient'
  if (score < 0.4) return 'weak'
  if (score < 0.7) return 'moderate'
  if (score < 0.9) return 'strong'
  return 'very_strong'
}

function buildConfidence({
  score,
  sampleSize,
  method,
  explanation,
}: {
  score: number | null
  sampleSize: number
  method: string
  explanation: string
}): AnalyticsConfidence {
  const normalizedScore =
    score === null
      ? null
      : clamp(score, 0, 1)

  return {
    value: normalizedScore,
    level:
      resolveConfidenceLevel(
        normalizedScore,
      ),
    evidenceStrength:
      resolveEvidenceStrength(
        normalizedScore,
      ),
    sampleSize,
    explanation,
    method,
    calculatedAt: nowIso(),
    requiresHumanReview:
      normalizedScore === null ||
      normalizedScore < 0.7,
    metadata: {
      engineName: ENGINE_NAME,
      engineVersion: ENGINE_VERSION,
    },
  }
}

function createSeriesKey(
  observation: AnalyticsObservation,
  strategy: PatternGroupingStrategy,
): string {
  switch (strategy) {
    case 'entity':
      return observation.entityId

    case 'entity_and_variable':
      return [
        observation.entityId,
        observation.variableId,
      ].join('::')

    case 'class_and_variable':
      return [
        observation.classId ?? 'no-class',
        observation.variableId,
      ].join('::')

    case 'group_and_variable':
      return [
        observation.groupId ?? 'no-group',
        observation.variableId,
      ].join('::')

    case 'variable':
      return observation.variableId

    case 'custom':
      return (
        typeof observation.metadata.patternKey ===
        'string'
          ? observation.metadata.patternKey.trim()
          : ''
      ) ||
        [
          observation.entityId,
          observation.variableId,
        ].join('::')
  }
}

function toSeriesPoint(
  observation: AnalyticsObservation,
): PatternSeriesPoint | null {
  if (
    observation.excluded ||
    typeof observation.numericValue !==
      'number' ||
    !Number.isFinite(
      observation.numericValue,
    )
  ) {
    return null
  }

  return {
    observationId: observation.id,
    entityId: observation.entityId,
    entityType: observation.entityType,
    variableId: observation.variableId,
    value: observation.numericValue,
    observedAt: observation.observedAt,
    recordedAt: observation.recordedAt,
    classId: observation.classId,
    groupId: observation.groupId,
    academicPeriodId:
      observation.academicPeriodId,
    sourceReferences:
      observation.sourceReferences,
    metadata: {
      ...observation.metadata,
    },
  }
}

function buildSeries(
  observations: AnalyticsObservation[],
  strategy: PatternGroupingStrategy,
  requireObservedAt: boolean,
): PatternSeries[] {
  const groups =
    new Map<string, PatternSeries>()

  for (const observation of observations) {
    if (
      requireObservedAt &&
      !observation.observedAt
    ) {
      continue
    }

    const point =
      toSeriesPoint(observation)

    if (!point) {
      continue
    }

    const key =
      createSeriesKey(
        observation,
        strategy,
      )

    const current =
      groups.get(key) ?? {
        key,
        entityIds: [],
        entityTypes: [],
        variableIds: [],
        classIds: [],
        groupIds: [],
        points: [],
      }

    current.entityIds =
      uniqueStrings([
        ...current.entityIds,
        observation.entityId,
      ])

    current.entityTypes =
      Array.from(
        new Set([
          ...current.entityTypes,
          observation.entityType,
        ]),
      )

    current.variableIds =
      uniqueStrings([
        ...current.variableIds,
        observation.variableId,
      ])

    current.classIds =
      uniqueStrings([
        ...current.classIds,
        observation.classId,
      ])

    current.groupIds =
      uniqueStrings([
        ...current.groupIds,
        observation.groupId,
      ])

    current.points.push(point)

    groups.set(key, current)
  }

  return Array.from(groups.values())
    .map(series => ({
      ...series,
      points: [...series.points].sort(
        (first, second) => {
          const firstDate =
            Date.parse(
              first.observedAt ??
                first.recordedAt,
            )

          const secondDate =
            Date.parse(
              second.observedAt ??
                second.recordedAt,
            )

          if (
            Number.isNaN(firstDate) ||
            Number.isNaN(secondDate)
          ) {
            return first.observationId.localeCompare(
              second.observationId,
            )
          }

          return firstDate - secondDate
        },
      ),
    }))
}

function collectSourceReferences(
  series: PatternSeries,
): AnalyticsSourceReference[] {
  const map =
    new Map<
      string,
      AnalyticsSourceReference
    >()

  for (const point of series.points) {
    for (
      const source of
        point.sourceReferences
    ) {
      map.set(source.id, source)
    }
  }

  return Array.from(map.values())
}

function createExplainability({
  summary,
  reasons,
  variablesUsed,
  sources,
  rulesApplied,
  limitations,
  uncertaintyFactors,
  alternatives,
}: {
  summary: string
  reasons: string[]
  variablesUsed: string[]
  sources: AnalyticsSourceReference[]
  rulesApplied: string[]
  limitations?: string[]
  uncertaintyFactors?: string[]
  alternatives?: string[]
}): AnalyticsExplainability {
  return {
    summary,
    reasons,
    rulesApplied,
    variablesUsed:
      uniqueStrings(variablesUsed),
    sourceReferences: sources,
    assumptions: [
      'As observações pertencem à mesma unidade de análise definida.',
      'A ordenação temporal representa adequadamente a sequência dos registros.',
      'Os valores numéricos são comparáveis dentro de cada variável.',
    ],
    limitations: [
      'Padrões detectados não demonstram causalidade.',
      'A ausência de dados pode alterar a interpretação.',
      'O contexto pedagógico deve ser validado por profissional responsável.',
      ...(limitations ?? []),
    ],
    uncertaintyFactors: [
      'Tamanho da amostra.',
      'Periodicidade irregular.',
      'Dados ausentes.',
      'Eventos externos não registrados.',
      ...(uncertaintyFactors ?? []),
    ],
    alternativeExplanations: [
      'O padrão pode decorrer de mudança de instrumento ou critério de registro.',
      'O padrão pode decorrer de fatores contextuais não representados.',
      ...(alternatives ?? []),
    ],
    causalityStatus: 'association_only',
    generatedAt: nowIso(),
    engineName: ENGINE_NAME,
    engineVersion: ENGINE_VERSION,
    metadata: {
      rulesetVersion: RULESET_VERSION,
    },
  }
}

function resolveTrendPatternType(
  direction: AnalyticsDirection,
): AnalyticsPatternType {
  if (direction === 'increasing') {
    return 'learning_progression'
  }

  if (direction === 'decreasing') {
    return 'learning_regression'
  }

  return 'trend'
}

function buildTrendPattern({
  series,
  trend,
  variableLabels,
}: {
  series: PatternSeries
  trend: LinearTrend
  variableLabels: Map<string, string>
}): AnalyticsPatternResult | null {
  if (
    trend.slope === null ||
    trend.direction === 'undetermined'
  ) {
    return null
  }

  const variableLabel =
    series.variableIds
      .map(
        variableId =>
          variableLabels.get(
            variableId,
          ) ??
          variableId,
      )
      .join(', ')

  const score =
    clamp(
      (
        trend.fitScore ??
        0
      ) *
        Math.min(
          1,
          series.points.length / 10,
        ),
      0,
      1,
    )

  const start =
    series.points[0]

  const end =
    series.points[
      series.points.length - 1
    ]

  return {
    id: createStableId(
      'pattern-trend',
      [
        series.key,
        trend.direction,
        start.observationId,
        end.observationId,
      ].join(':'),
    ),
    type:
      resolveTrendPatternType(
        trend.direction,
      ),
    title:
      trend.direction === 'increasing'
        ? `Progressão identificada em ${variableLabel}`
        : trend.direction === 'decreasing'
          ? `Regressão identificada em ${variableLabel}`
          : `Estabilidade identificada em ${variableLabel}`,
    description:
      `A série apresentou direção ${trend.direction}, inclinação ${trend.slope.toFixed(6)} e ajuste ${(
        trend.fitScore ?? 0
      ).toFixed(4)}.`,
    entityIds:
      series.entityIds,
    variableIds:
      series.variableIds,
    startAt:
      start.observedAt ??
      start.recordedAt,
    endAt:
      end.observedAt ??
      end.recordedAt,
    frequency:
      null,
    recurrenceCount:
      null,
    direction:
      trend.direction,
    magnitude:
      trend.normalizedMagnitude,
    score,
    confidence:
      buildConfidence({
        score,
        sampleSize:
          series.points.length,
        method:
          'linear_trend',
        explanation:
          'Confiança calculada pelo ajuste linear e tamanho da série.',
      }),
    evidenceReferences:
      collectSourceReferences(
        series,
      ),
    requiresHumanReview:
      score < 0.7,
    explanation:
      createExplainability({
        summary:
          `Foi detectada uma tendência ${trend.direction} na série ${series.key}.`,
        reasons: [
          `${series.points.length} observações foram ordenadas temporalmente.`,
          `Inclinação calculada: ${trend.slope.toFixed(6)}.`,
          `Ajuste linear: ${(
            trend.fitScore ?? 0
          ).toFixed(4)}.`,
        ],
        variablesUsed:
          series.variableIds,
        sources:
          collectSourceReferences(
            series,
          ),
        rulesApplied: [
          'temporal_ordering',
          'least_squares_trend',
          'normalized_slope_threshold',
          'human_review_guard',
        ],
      }),
    metadata: {
      engineName: ENGINE_NAME,
      engineVersion: ENGINE_VERSION,
      seriesKey: series.key,
      slope: trend.slope,
      intercept: trend.intercept,
      fitScore: trend.fitScore,
    },
  }
}

function buildRecurrencePattern({
  series,
  recurrence,
  variableLabels,
}: {
  series: PatternSeries
  recurrence: RecurrenceSummary
  variableLabels: Map<string, string>
}): AnalyticsPatternResult | null {
  if (!recurrence.recurrent) {
    return null
  }

  const start = series.points[0]
  const end =
    series.points[
      series.points.length - 1
    ]

  const variableLabel =
    series.variableIds
      .map(
        variableId =>
          variableLabels.get(
            variableId,
          ) ??
          variableId,
      )
      .join(', ')

  return {
    id: createStableId(
      'pattern-recurrence',
      [
        series.key,
        recurrence.recurrenceCount,
      ].join(':'),
    ),
    type: 'recurrence',
    title:
      `Recorrência identificada em ${variableLabel}`,
    description:
      `Foram identificadas ${recurrence.recurrenceCount} repetições aproximadas na série.`,
    entityIds:
      series.entityIds,
    variableIds:
      series.variableIds,
    startAt:
      start.observedAt ??
      start.recordedAt,
    endAt:
      end.observedAt ??
      end.recordedAt,
    frequency:
      recurrence.frequency,
    recurrenceCount:
      recurrence.recurrenceCount,
    direction:
      'oscillating',
    magnitude:
      recurrence.score,
    score:
      recurrence.score,
    confidence:
      buildConfidence({
        score:
          recurrence.score,
        sampleSize:
          series.points.length,
        method:
          'approximate_recurrence',
        explanation:
          'Confiança baseada na proporção de valores recorrentes.',
      }),
    evidenceReferences:
      collectSourceReferences(
        series,
      ),
    requiresHumanReview:
      (
        recurrence.score ??
        0
      ) < 0.7,
    explanation:
      createExplainability({
        summary:
          `Foi detectado padrão recorrente na série ${series.key}.`,
        reasons: [
          `${recurrence.recurrenceCount} recorrências aproximadas foram identificadas.`,
          `Frequência média estimada: ${recurrence.frequency ?? 'indeterminada'}.`,
        ],
        variablesUsed:
          series.variableIds,
        sources:
          collectSourceReferences(
            series,
          ),
        rulesApplied: [
          'value_similarity',
          'recurrence_tolerance',
          'recurrence_frequency_estimation',
        ],
      }),
    metadata: {
      engineName: ENGINE_NAME,
      engineVersion: ENGINE_VERSION,
      seriesKey: series.key,
    },
  }
}

function buildDistributionPattern({
  series,
  summary,
  type,
  variableLabels,
}: {
  series: PatternSeries
  summary: DistributionSummary
  type: 'concentration' | 'dispersion'
  variableLabels: Map<string, string>
}): AnalyticsPatternResult {
  const coefficient =
    summary.coefficientOfVariation

  const score =
    coefficient === null
      ? null
      : type === 'concentration'
        ? clamp(
            1 - coefficient,
            0,
            1,
          )
        : clamp(
            coefficient,
            0,
            1,
          )

  const variableLabel =
    series.variableIds
      .map(
        variableId =>
          variableLabels.get(
            variableId,
          ) ??
          variableId,
      )
      .join(', ')

  const start = series.points[0]
  const end =
    series.points[
      series.points.length - 1
    ]

  return {
    id: createStableId(
      `pattern-${type}`,
      [
        series.key,
        summary.count,
        coefficient ?? 'null',
      ].join(':'),
    ),
    type,
    title:
      type === 'concentration'
        ? `Concentração identificada em ${variableLabel}`
        : `Dispersão identificada em ${variableLabel}`,
    description:
      `A série apresentou coeficiente de variação ${coefficient?.toFixed(4) ?? 'indeterminado'}.`,
    entityIds:
      series.entityIds,
    variableIds:
      series.variableIds,
    startAt:
      start.observedAt ??
      start.recordedAt,
    endAt:
      end.observedAt ??
      end.recordedAt,
    frequency:
      null,
    recurrenceCount:
      null,
    direction:
      'stable',
    magnitude:
      coefficient,
    score,
    confidence:
      buildConfidence({
        score,
        sampleSize:
          series.points.length,
        method:
          'coefficient_of_variation',
        explanation:
          'Confiança baseada no tamanho da série e na dispersão relativa.',
      }),
    evidenceReferences:
      collectSourceReferences(
        series,
      ),
    requiresHumanReview:
      score === null ||
      score < 0.7,
    explanation:
      createExplainability({
        summary:
          `Foi detectado padrão de ${type} na série ${series.key}.`,
        reasons: [
          `Média: ${summary.mean ?? 'indeterminada'}.`,
          `Desvio-padrão: ${summary.standardDeviation ?? 'indeterminado'}.`,
          `Coeficiente de variação: ${coefficient ?? 'indeterminado'}.`,
        ],
        variablesUsed:
          series.variableIds,
        sources:
          collectSourceReferences(
            series,
          ),
        rulesApplied: [
          'distribution_summary',
          'coefficient_of_variation',
          `${type}_classification`,
        ],
      }),
    metadata: {
      engineName: ENGINE_NAME,
      engineVersion: ENGINE_VERSION,
      seriesKey: series.key,
      distribution: summary,
    },
  }
}

function resolveAnomalySeverity(
  absoluteZScore: number,
): AnalyticsSeverity {
  if (absoluteZScore >= 4) {
    return 'critical'
  }

  if (absoluteZScore >= 3.5) {
    return 'high'
  }

  if (absoluteZScore >= 3) {
    return 'moderate'
  }

  return 'low'
}

function buildAnomalies({
  series,
  threshold,
}: {
  series: PatternSeries
  threshold: number
}): AnalyticsAnomalyResult[] {
  const values =
    series.points.map(
      point => point.value,
    )

  const average = mean(values)
  const deviation =
    standardDeviation(values)

  if (
    average === null ||
    deviation === null ||
    deviation <= EPSILON
  ) {
    return []
  }

  const results:
    AnalyticsAnomalyResult[] =
    []

  for (const point of series.points) {
    const zScore =
      (point.value - average) /
      deviation

    const absoluteZScore =
      Math.abs(zScore)

    if (absoluteZScore < threshold) {
      continue
    }

    const confidenceScore =
      clamp(
        absoluteZScore / 5,
        0,
        1,
      )

    results.push({
      id: createStableId(
        'anomaly',
        [
          series.key,
          point.observationId,
          zScore.toFixed(6),
        ].join(':'),
      ),
      type: 'point',
      entityId:
        point.entityId,
      entityType:
        point.entityType,
      variableId:
        point.variableId,
      observedValue:
        point.value,
      expectedValue:
        average,
      deviation:
        point.value -
        average,
      standardizedDeviation:
        zScore,
      severity:
        resolveAnomalySeverity(
          absoluteZScore,
        ),
      detectedAt:
        nowIso(),
      confidence:
        buildConfidence({
          score:
            confidenceScore,
          sampleSize:
            series.points.length,
          method:
            'z_score',
          explanation:
            'Confiança baseada na distância padronizada em relação à média.',
        }),
      possibleExplanations: [
        'Mudança real de desempenho ou comportamento.',
        'Erro de registro ou instrumento.',
        'Evento contextual não registrado.',
        'Mudança de critério de avaliação.',
      ],
      evidenceReferences:
        point.sourceReferences,
      requiresHumanReview:
        true,
      explanation:
        createExplainability({
          summary:
            `A observação ${point.observationId} foi classificada como anômala.`,
          reasons: [
            `Valor observado: ${point.value}.`,
            `Valor esperado pela média: ${average}.`,
            `Z-score: ${zScore.toFixed(4)}.`,
          ],
          variablesUsed: [
            point.variableId,
          ],
          sources:
            point.sourceReferences,
          rulesApplied: [
            'distribution_mean',
            'sample_standard_deviation',
            'z_score_threshold',
            'mandatory_human_review',
          ],
          limitations: [
            'A distribuição normal não foi testada.',
            'Um valor extremo pode ser pedagogicamente legítimo.',
          ],
        }),
      metadata: {
        engineName: ENGINE_NAME,
        engineVersion: ENGINE_VERSION,
        seriesKey: series.key,
        threshold,
      },
    })
  }

  return results
}

function buildGroupPattern({
  series,
  patternType,
}: {
  series: PatternSeries
  patternType:
    | 'group_formation'
    | 'group_fusion'
    | 'group_fragmentation'
    | 'reorganization'
}): AnalyticsPatternResult | null {
  if (
    series.groupIds.length === 0 ||
    series.entityIds.length < 2
  ) {
    return null
  }

  const score =
    clamp(
      Math.min(
        1,
        series.entityIds.length /
          10,
      ) *
        Math.min(
          1,
          series.points.length /
            20,
        ),
      0,
      1,
    )

  const start = series.points[0]
  const end =
    series.points[
      series.points.length - 1
    ]

  return {
    id: createStableId(
      `pattern-${patternType}`,
      [
        series.key,
        ...series.groupIds,
        ...series.entityIds,
      ].join(':'),
    ),
    type: patternType,
    title:
      `Padrão de ${patternType} identificado`,
    description:
      `A série reúne ${series.entityIds.length} entidades e ${series.groupIds.length} grupos relacionados.`,
    entityIds:
      series.entityIds,
    variableIds:
      series.variableIds,
    startAt:
      start.observedAt ??
      start.recordedAt,
    endAt:
      end.observedAt ??
      end.recordedAt,
    frequency:
      null,
    recurrenceCount:
      null,
    direction:
      'mixed',
    magnitude:
      score,
    score,
    confidence:
      buildConfidence({
        score,
        sampleSize:
          series.points.length,
        method:
          'group_structure_heuristic',
        explanation:
          'Confiança heurística baseada em entidades, grupos e quantidade de registros.',
      }),
    evidenceReferences:
      collectSourceReferences(
        series,
      ),
    requiresHumanReview:
      true,
    explanation:
      createExplainability({
        summary:
          `Foi identificado possível padrão de ${patternType}.`,
        reasons: [
          `${series.entityIds.length} entidades participam da série.`,
          `${series.groupIds.length} grupos estão associados.`,
        ],
        variablesUsed:
          series.variableIds,
        sources:
          collectSourceReferences(
            series,
          ),
        rulesApplied: [
          'group_membership_presence',
          'multi_entity_series',
          'group_structure_heuristic',
          'mandatory_human_review',
        ],
        limitations: [
          'A estrutura do grupo deve ser validada no Learning Graph.',
          'O motor não infere vínculos sociais ausentes.',
        ],
      }),
    metadata: {
      engineName: ENGINE_NAME,
      engineVersion: ENGINE_VERSION,
      seriesKey: series.key,
      groupIds:
        series.groupIds,
    },
  }
}

function buildExternalEventPattern({
  series,
  externalEventIds,
}: {
  series: PatternSeries
  externalEventIds: string[]
}): AnalyticsPatternResult | null {
  if (
    externalEventIds.length === 0 ||
    series.points.length < 3
  ) {
    return null
  }

  const midpoint =
    Math.floor(
      series.points.length / 2,
    )

  const before =
    series.points
      .slice(0, midpoint)
      .map(point => point.value)

  const after =
    series.points
      .slice(midpoint)
      .map(point => point.value)

  const beforeMean =
    mean(before)

  const afterMean =
    mean(after)

  if (
    beforeMean === null ||
    afterMean === null
  ) {
    return null
  }

  const scale =
    Math.max(
      EPSILON,
      Math.abs(beforeMean),
      Math.abs(afterMean),
    )

  const magnitude =
    Math.abs(
      afterMean -
        beforeMean,
    ) / scale

  if (magnitude < 0.1) {
    return null
  }

  const score =
    clamp(
      magnitude *
        Math.min(
          1,
          series.points.length /
            10,
        ),
      0,
      1,
    )

  const direction:
    AnalyticsDirection =
    afterMean > beforeMean
      ? 'increasing'
      : 'decreasing'

  const start = series.points[0]
  const end =
    series.points[
      series.points.length - 1
    ]

  return {
    id: createStableId(
      'pattern-external-event',
      [
        series.key,
        ...externalEventIds,
      ].join(':'),
    ),
    type:
      'external_event_response',
    title:
      'Mudança associada a evento externo',
    description:
      `A média da série mudou de ${beforeMean.toFixed(4)} para ${afterMean.toFixed(4)}.`,
    entityIds:
      series.entityIds,
    variableIds:
      series.variableIds,
    startAt:
      start.observedAt ??
      start.recordedAt,
    endAt:
      end.observedAt ??
      end.recordedAt,
    frequency:
      null,
    recurrenceCount:
      null,
    direction,
    magnitude,
    score,
    confidence:
      buildConfidence({
        score,
        sampleSize:
          series.points.length,
        method:
          'before_after_mean_difference',
        explanation:
          'Confiança baseada na diferença relativa entre segmentos da série.',
      }),
    evidenceReferences:
      collectSourceReferences(
        series,
      ),
    requiresHumanReview:
      true,
    explanation:
      createExplainability({
        summary:
          'Foi detectada mudança temporal associável a eventos externos informados.',
        reasons: [
          `Média anterior: ${beforeMean.toFixed(4)}.`,
          `Média posterior: ${afterMean.toFixed(4)}.`,
          `Magnitude relativa: ${magnitude.toFixed(4)}.`,
        ],
        variablesUsed:
          series.variableIds,
        sources:
          collectSourceReferences(
            series,
          ),
        rulesApplied: [
          'series_midpoint_partition',
          'before_after_mean_difference',
          'external_event_association_guard',
        ],
        limitations: [
          'A divisão temporal é aproximada.',
          'Associação temporal não comprova efeito causal do evento.',
        ],
      }),
    metadata: {
      engineName: ENGINE_NAME,
      engineVersion: ENGINE_VERSION,
      seriesKey: series.key,
      externalEventIds,
      beforeMean,
      afterMean,
    },
  }
}

function resolveConfiguration(
  configuration:
    PatternEngineConfiguration | undefined,
): Required<
  Omit<
    PatternEngineConfiguration,
    'groupingStrategy'
  >
> & {
  groupingStrategy:
    PatternGroupingStrategy
} {
  return {
    detectTrends:
      configuration
        ?.detectTrends ??
      true,
    detectRecurrences:
      configuration
        ?.detectRecurrences ??
      true,
    detectConcentration:
      configuration
        ?.detectConcentration ??
      true,
    detectDispersion:
      configuration
        ?.detectDispersion ??
      true,
    detectAnomalies:
      configuration
        ?.detectAnomalies ??
      true,
    detectGroupPatterns:
      configuration
        ?.detectGroupPatterns ??
      true,
    detectExternalEventResponses:
      configuration
        ?.detectExternalEventResponses ??
      true,
    minimumObservations:
      Math.max(
        2,
        Math.floor(
          configuration
            ?.minimumObservations ??
            DEFAULT_MINIMUM_OBSERVATIONS,
        ),
      ),
    trendThreshold:
      clamp(
        configuration
          ?.trendThreshold ??
          DEFAULT_TREND_THRESHOLD,
        0,
        1,
      ),
    anomalyZThreshold:
      Math.max(
        1,
        configuration
          ?.anomalyZThreshold ??
          DEFAULT_ANOMALY_Z_THRESHOLD,
      ),
    recurrenceTolerance:
      clamp(
        configuration
          ?.recurrenceTolerance ??
          DEFAULT_RECURRENCE_TOLERANCE,
        0.0001,
        1,
      ),
    groupingStrategy:
      configuration
        ?.groupingStrategy ??
      'entity_and_variable',
    requireObservedAt:
      configuration
        ?.requireObservedAt ??
      false,
  }
}

export function runPatternEngine(
  input: PatternEngineInput,
): PatternEngineResult {
  const generatedAt = nowIso()
  const warnings: string[] = []
  const errors: string[] = []

  try {
    const correlationId =
      normalizeRequiredText(
        input.correlationId,
        'correlationId',
      )

    const configuration =
      resolveConfiguration(
        input.configuration,
      )

    const variableLabels =
      new Map(
        input.variableDefinitions.map(
          variable => [
            variable.id,
            variable.label,
          ],
        ),
      )

    const series =
      buildSeries(
        input.observations,
        configuration.groupingStrategy,
        configuration.requireObservedAt,
      )

    const patterns:
      AnalyticsPatternResult[] =
      []

    const anomalies:
      AnalyticsAnomalyResult[] =
      []

    for (const currentSeries of series) {
      if (
        currentSeries.points.length <
        configuration.minimumObservations
      ) {
        warnings.push(
          `A série ${currentSeries.key} possui apenas ${currentSeries.points.length} observações.`,
        )
        continue
      }

      const values =
        currentSeries.points.map(
          point => point.value,
        )

      const distribution =
        summarizeDistribution(
          values,
        )

      if (
        configuration.detectTrends
      ) {
        const trend =
          calculateLinearTrend(
            currentSeries.points,
            configuration
              .trendThreshold,
          )

        const trendPattern =
          buildTrendPattern({
            series:
              currentSeries,
            trend,
            variableLabels,
          })

        if (trendPattern) {
          patterns.push(
            trendPattern,
          )
        }
      }

      if (
        configuration.detectRecurrences
      ) {
        const recurrence =
          calculateRecurrence(
            values,
            configuration
              .recurrenceTolerance,
          )

        const recurrencePattern =
          buildRecurrencePattern({
            series:
              currentSeries,
            recurrence,
            variableLabels,
          })

        if (recurrencePattern) {
          patterns.push(
            recurrencePattern,
          )
        }
      }

      const coefficient =
        distribution
          .coefficientOfVariation

      if (
        configuration
          .detectConcentration &&
        coefficient !== null &&
        coefficient <= 0.25
      ) {
        patterns.push(
          buildDistributionPattern({
            series:
              currentSeries,
            summary:
              distribution,
            type:
              'concentration',
            variableLabels,
          }),
        )
      }

      if (
        configuration
          .detectDispersion &&
        coefficient !== null &&
        coefficient >= 0.5
      ) {
        patterns.push(
          buildDistributionPattern({
            series:
              currentSeries,
            summary:
              distribution,
            type:
              'dispersion',
            variableLabels,
          }),
        )
      }

      if (
        configuration.detectAnomalies
      ) {
        anomalies.push(
          ...buildAnomalies({
            series:
              currentSeries,
            threshold:
              configuration
                .anomalyZThreshold,
          }),
        )
      }

      if (
        configuration
          .detectGroupPatterns &&
        currentSeries.groupIds
          .length > 0
      ) {
        const groupPattern =
          buildGroupPattern({
            series:
              currentSeries,
            patternType:
              currentSeries.groupIds
                .length > 1
                ? 'group_fusion'
                : 'group_formation',
          })

        if (groupPattern) {
          patterns.push(
            groupPattern,
          )
        }
      }

      if (
        configuration
          .detectExternalEventResponses
      ) {
        const externalPattern =
          buildExternalEventPattern({
            series:
              currentSeries,
            externalEventIds:
              uniqueStrings(
                input.externalEventIds ??
                  [],
              ),
          })

        if (externalPattern) {
          patterns.push(
            externalPattern,
          )
        }
      }
    }

    return {
      success:
        errors.length === 0,
      patterns,
      anomalies,
      seriesCount:
        series.length,
      observationCount:
        input.observations.length,
      warnings:
        uniqueStrings(warnings),
      errors:
        uniqueStrings(errors),
      generatedAt,
      correlationId,
      metadata: {
        ...(input.metadata ?? {}),
        engineName:
          ENGINE_NAME,
        engineVersion:
          ENGINE_VERSION,
        rulesetVersion:
          RULESET_VERSION,
        groupingStrategy:
          configuration
            .groupingStrategy,
        minimumObservations:
          configuration
            .minimumObservations,
        patternCount:
          patterns.length,
        anomalyCount:
          anomalies.length,
      },
    }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Falha desconhecida no Pattern Engine.'

    return {
      success: false,
      patterns: [],
      anomalies: [],
      seriesCount: 0,
      observationCount:
        input.observations
          ?.length ??
        0,
      warnings: [],
      errors: [message],
      generatedAt,
      correlationId:
        normalizeOptionalText(
          input.correlationId,
        ) ??
        createStableId(
          'pattern-run',
          generatedAt,
        ),
      metadata: {
        engineName:
          ENGINE_NAME,
        engineVersion:
          ENGINE_VERSION,
        rulesetVersion:
          RULESET_VERSION,
        failure: true,
      },
    }
  }
}

export function getPatternEngineInfo() {
  return {
    name:
      ENGINE_NAME,
    version:
      ENGINE_VERSION,
    rulesetVersion:
      RULESET_VERSION,
    mode:
      'deterministic' as const,
    supportedPatterns: [
      'trend',
      'learning_progression',
      'learning_regression',
      'recurrence',
      'concentration',
      'dispersion',
      'group_formation',
      'group_fusion',
      'external_event_response',
    ] as AnalyticsPatternType[],
    supportedAnomalies: [
      'point',
    ] as const,
    plannedPatterns: [
      'cycle',
      'sequence',
      'cluster',
      'co_occurrence',
      'transition',
      'reorganization',
      'group_fragmentation',
      'behavioral_propagation',
    ] as AnalyticsPatternType[],
    guarantees: [
      'deterministic_processing',
      'human_review_preserved',
      'explainability_generated',
      'causal_inference_prohibited',
      'non_punitive_use',
    ],
    limitations: [
      'A detecção de tendência usa regressão linear simples.',
      'A anomalia usa z-score sem teste de normalidade.',
      'Padrões de grupo são heurísticos.',
      'Eventos externos são tratados como associação temporal.',
      'Não acessa banco de dados.',
      'Não aplica RLS.',
    ],
  }
}
