/**
 * EduData IA — EIOS
 * Capability 04.1: Correlation Engine
 *
 * Motor determinístico de correlações educacionais.
 *
 * Este arquivo:
 * - calcula Pearson, Spearman e Kendall;
 * - produz matriz de correlação;
 * - classifica força, direção, confiança e significância aproximada;
 * - preserva explicabilidade e revisão humana;
 * - não executa inferência causal;
 * - não acessa banco de dados;
 * - não aplica RLS.
 */

import type {
  AnalyticsConfidence,
  AnalyticsCorrelationMethod,
  AnalyticsCorrelationResult,
  AnalyticsCorrelationStrength,
  AnalyticsExplainability,
  AnalyticsIdentifier,
  AnalyticsMetadata,
  AnalyticsObservation,
  AnalyticsStatisticalSignificance,
  AnalyticsTimestamp,
  AnalyticsVariableDefinition,
} from './analytics.types'

const ENGINE_NAME = 'eios-correlation-engine'
const ENGINE_VERSION = '1.0.0'
const RULESET_VERSION = 'correlation-ruleset-1.0.0'
const DEFAULT_ALPHA = 0.05
const DEFAULT_MINIMUM_PAIRS = 3
const EPSILON = 1e-12

export type CorrelationPairingStrategy =
  | 'entity'
  | 'entity_and_period'
  | 'entity_period_class'
  | 'custom_key'

export type CorrelationEngineInput = {
  observations: AnalyticsObservation[]
  variableDefinitions: AnalyticsVariableDefinition[]
  variablePairs?: Array<{
    variableXId: AnalyticsIdentifier
    variableYId: AnalyticsIdentifier
  }>
  methods?: AnalyticsCorrelationMethod[]
  pairingStrategy?: CorrelationPairingStrategy
  minimumPairCount?: number
  significanceLevel?: number
  controlVariableIds?: AnalyticsIdentifier[]
  subgroupIds?: AnalyticsIdentifier[]
  temporalLag?: number | null
  temporalLagUnit?:
    | 'event'
    | 'lesson'
    | 'day'
    | 'week'
    | 'month'
    | 'bimester'
    | 'quarter'
    | 'semester'
    | 'academic_year'
    | 'custom'
    | null
  correlationId: string
  metadata?: AnalyticsMetadata
}

export type CorrelationMatrixCell = {
  variableXId: AnalyticsIdentifier
  variableYId: AnalyticsIdentifier
  method: AnalyticsCorrelationMethod
  coefficient: number | null
  sampleSize: number
  strength: AnalyticsCorrelationStrength
  direction:
    | 'positive'
    | 'negative'
    | 'none'
    | 'undetermined'
  significant: boolean | null
  pValue: number | null
  resultId: AnalyticsIdentifier | null
}

export type CorrelationMatrixResult = {
  method: AnalyticsCorrelationMethod
  variableIds: AnalyticsIdentifier[]
  cells: CorrelationMatrixCell[]
  generatedAt: AnalyticsTimestamp
  metadata: AnalyticsMetadata
}

export type CorrelationEngineResult = {
  success: boolean
  correlations: AnalyticsCorrelationResult[]
  matrices: CorrelationMatrixResult[]
  warnings: string[]
  errors: string[]
  generatedAt: AnalyticsTimestamp
  correlationId: string
  metadata: AnalyticsMetadata
}

type NumericObservation = {
  variableId: string
  pairingKey: string
  value: number
}

type NumericPair = {
  x: number
  y: number
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

function uniqueStrings(values: string[]): string[] {
  return Array.from(
    new Set(
      values
        .map(value => value.trim())
        .filter(Boolean),
    ),
  )
}

function clamp(
  value: number,
  minimum: number,
  maximum: number,
): number {
  return Math.min(maximum, Math.max(minimum, value))
}

function stableHash(value: string): string {
  let hash = 2166136261

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return (hash >>> 0).toString(16).padStart(8, '0')
}

function createStableId(prefix: string, value: string): string {
  return `${prefix}-${stableHash(value)}`
}

function mean(values: number[]): number | null {
  if (values.length === 0) {
    return null
  }

  return values.reduce((total, value) => total + value, 0) /
    values.length
}

function normalCdf(value: number): number {
  const sign = value < 0 ? -1 : 1
  const x = Math.abs(value) / Math.sqrt(2)
  const t = 1 / (1 + 0.3275911 * x)
  const polynomial =
    1 -
    (
      (
        (
          (
            1.061405429 * t -
            1.453152027
          ) *
            t +
          1.421413741
        ) *
          t -
        0.284496736
      ) *
        t +
      0.254829592
    ) *
      t *
      Math.exp(-x * x)

  return 0.5 * (1 + sign * polynomial)
}

function twoSidedPValue(zScore: number): number {
  return clamp(
    2 * (1 - normalCdf(Math.abs(zScore))),
    0,
    1,
  )
}

function fisherInterval(
  coefficient: number,
  sampleSize: number,
  alpha: number,
): {
  lower: number | null
  upper: number | null
} {
  if (
    sampleSize <= 3 ||
    Math.abs(coefficient) >= 1
  ) {
    return {
      lower: null,
      upper: null,
    }
  }

  const z =
    0.5 *
    Math.log(
      (1 + coefficient) /
        (1 - coefficient),
    )

  const standardError =
    1 / Math.sqrt(sampleSize - 3)

  const critical =
    alpha <= 0.01
      ? 2.575829
      : alpha <= 0.05
        ? 1.959964
        : 1.644854

  return {
    lower:
      Math.tanh(
        z - critical * standardError,
      ),
    upper:
      Math.tanh(
        z + critical * standardError,
      ),
  }
}

function resolveStrength(
  coefficient: number | null,
): AnalyticsCorrelationStrength {
  if (coefficient === null) return 'undetermined'

  const absolute = Math.abs(coefficient)

  if (absolute < 0.1) return 'negligible'
  if (absolute < 0.3) return 'weak'
  if (absolute < 0.5) return 'moderate'
  if (absolute < 0.7) return 'strong'
  return 'very_strong'
}

function resolveDirection(
  coefficient: number | null,
): AnalyticsCorrelationResult['direction'] {
  if (coefficient === null) return 'undetermined'
  if (Math.abs(coefficient) < EPSILON) return 'none'

  return coefficient > 0
    ? 'positive'
    : 'negative'
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
  coefficient,
  sampleSize,
  pValue,
  method,
}: {
  coefficient: number | null
  sampleSize: number
  pValue: number | null
  method: AnalyticsCorrelationMethod
}): AnalyticsConfidence {
  if (
    coefficient === null ||
    sampleSize < DEFAULT_MINIMUM_PAIRS
  ) {
    return {
      value: null,
      level: 'undetermined',
      evidenceStrength: 'insufficient',
      sampleSize,
      explanation:
        'Não há pares suficientes para estimar confiança.',
      method,
      calculatedAt: nowIso(),
      requiresHumanReview: true,
      metadata: {
        engineName: ENGINE_NAME,
      },
    }
  }

  const sampleFactor = clamp(sampleSize / 30, 0, 1)
  const significanceFactor =
    pValue === null
      ? 0.5
      : clamp(1 - pValue, 0, 1)
  const effectFactor = Math.abs(coefficient)

  const value = clamp(
    0.35 * sampleFactor +
      0.35 * significanceFactor +
      0.3 * effectFactor,
    0,
    1,
  )

  return {
    value,
    level: resolveConfidenceLevel(value),
    evidenceStrength:
      resolveEvidenceStrength(value),
    sampleSize,
    explanation:
      'Confiança composta por amostra, significância aproximada e magnitude.',
    method,
    calculatedAt: nowIso(),
    requiresHumanReview: value < 0.7,
    metadata: {
      engineName: ENGINE_NAME,
      engineVersion: ENGINE_VERSION,
    },
  }
}

function createPairingKey(
  observation: AnalyticsObservation,
  strategy: CorrelationPairingStrategy,
): string {
  switch (strategy) {
    case 'entity':
      return observation.entityId

    case 'entity_and_period':
      return [
        observation.entityId,
        observation.academicPeriodId ?? 'no-period',
      ].join('::')

    case 'entity_period_class':
      return [
        observation.entityId,
        observation.academicPeriodId ?? 'no-period',
        observation.classId ?? 'no-class',
      ].join('::')

    case 'custom_key':
      return (
        typeof observation.metadata.pairingKey === 'string'
          ? observation.metadata.pairingKey.trim()
          : ''
      ) || observation.entityId
  }
}

function toNumericObservations(
  observations: AnalyticsObservation[],
  strategy: CorrelationPairingStrategy,
): NumericObservation[] {
  return observations
    .filter(
      observation =>
        !observation.excluded &&
        typeof observation.numericValue === 'number' &&
        Number.isFinite(observation.numericValue),
    )
    .map(observation => ({
      variableId: observation.variableId,
      pairingKey: createPairingKey(
        observation,
        strategy,
      ),
      value: observation.numericValue as number,
    }))
}

function aggregate(
  observations: NumericObservation[],
): Map<string, number> {
  const groups =
    new Map<string, number[]>()

  for (const observation of observations) {
    const current =
      groups.get(observation.pairingKey) ?? []

    current.push(observation.value)
    groups.set(observation.pairingKey, current)
  }

  const result = new Map<string, number>()

  for (const [key, values] of groups) {
    const average = mean(values)

    if (average !== null) {
      result.set(key, average)
    }
  }

  return result
}

function buildPairs(
  observations: NumericObservation[],
  variableXId: string,
  variableYId: string,
): NumericPair[] {
  const xMap = aggregate(
    observations.filter(
      observation =>
        observation.variableId === variableXId,
    ),
  )

  const yMap = aggregate(
    observations.filter(
      observation =>
        observation.variableId === variableYId,
    ),
  )

  const pairs: NumericPair[] = []

  for (const [key, x] of xMap) {
    const y = yMap.get(key)

    if (y !== undefined) {
      pairs.push({ x, y })
    }
  }

  return pairs
}

function pearson(
  pairs: NumericPair[],
): number | null {
  if (pairs.length < 2) return null

  const xValues = pairs.map(pair => pair.x)
  const yValues = pairs.map(pair => pair.y)
  const xMean = mean(xValues)
  const yMean = mean(yValues)

  if (xMean === null || yMean === null) {
    return null
  }

  let numerator = 0
  let xDenominator = 0
  let yDenominator = 0

  for (const pair of pairs) {
    const xDifference = pair.x - xMean
    const yDifference = pair.y - yMean

    numerator += xDifference * yDifference
    xDenominator += xDifference ** 2
    yDenominator += yDifference ** 2
  }

  const denominator =
    Math.sqrt(
      xDenominator * yDenominator,
    )

  if (denominator <= EPSILON) {
    return null
  }

  return clamp(
    numerator / denominator,
    -1,
    1,
  )
}

function rankValues(values: number[]): number[] {
  const indexed = values.map(
    (value, index) => ({
      value,
      index,
    }),
  )

  indexed.sort(
    (first, second) =>
      first.value - second.value,
  )

  const ranks = new Array<number>(values.length)
  let cursor = 0

  while (cursor < indexed.length) {
    let end = cursor

    while (
      end + 1 < indexed.length &&
      indexed[end + 1].value ===
        indexed[cursor].value
    ) {
      end += 1
    }

    const rank =
      (cursor + end + 2) / 2

    for (
      let index = cursor;
      index <= end;
      index += 1
    ) {
      ranks[indexed[index].index] = rank
    }

    cursor = end + 1
  }

  return ranks
}

function spearman(
  pairs: NumericPair[],
): number | null {
  if (pairs.length < 2) return null

  const xRanks = rankValues(
    pairs.map(pair => pair.x),
  )
  const yRanks = rankValues(
    pairs.map(pair => pair.y),
  )

  return pearson(
    pairs.map((pair, index) => ({
      x: xRanks[index],
      y: yRanks[index],
    })),
  )
}

function kendall(
  pairs: NumericPair[],
): number | null {
  if (pairs.length < 2) return null

  let concordant = 0
  let discordant = 0
  let tiesX = 0
  let tiesY = 0

  for (
    let first = 0;
    first < pairs.length - 1;
    first += 1
  ) {
    for (
      let second = first + 1;
      second < pairs.length;
      second += 1
    ) {
      const xDifference =
        pairs[first].x - pairs[second].x
      const yDifference =
        pairs[first].y - pairs[second].y

      if (
        Math.abs(xDifference) < EPSILON &&
        Math.abs(yDifference) < EPSILON
      ) {
        tiesX += 1
        tiesY += 1
      } else if (
        Math.abs(xDifference) < EPSILON
      ) {
        tiesX += 1
      } else if (
        Math.abs(yDifference) < EPSILON
      ) {
        tiesY += 1
      } else if (
        xDifference * yDifference > 0
      ) {
        concordant += 1
      } else {
        discordant += 1
      }
    }
  }

  const denominator =
    Math.sqrt(
      (concordant + discordant + tiesX) *
        (concordant + discordant + tiesY),
    )

  if (denominator <= EPSILON) {
    return null
  }

  return clamp(
    (concordant - discordant) /
      denominator,
    -1,
    1,
  )
}

function calculateCoefficient(
  method: AnalyticsCorrelationMethod,
  pairs: NumericPair[],
): {
  coefficient: number | null
  warning: string | null
} {
  switch (method) {
    case 'pearson':
      return {
        coefficient: pearson(pairs),
        warning: null,
      }

    case 'spearman':
      return {
        coefficient: spearman(pairs),
        warning: null,
      }

    case 'kendall':
      return {
        coefficient: kendall(pairs),
        warning: null,
      }

    case 'point_biserial':
      return {
        coefficient: pearson(pairs),
        warning:
          'Point-biserial foi aproximada por Pearson.',
      }

    case 'phi':
      return {
        coefficient: pearson(pairs),
        warning:
          'Phi foi aproximada por Pearson.',
      }

    case 'cramers_v':
    case 'mutual_information':
    case 'partial_correlation':
    case 'cross_correlation':
    case 'custom':
      return {
        coefficient: null,
        warning:
          `O método ${method} ainda não está implementado.`,
      }
  }
}

function approximateSignificance(
  coefficient: number | null,
  sampleSize: number,
  alpha: number,
  method: AnalyticsCorrelationMethod,
): AnalyticsStatisticalSignificance {
  if (
    coefficient === null ||
    sampleSize < DEFAULT_MINIMUM_PAIRS ||
    Math.abs(coefficient) >= 1
  ) {
    return {
      evaluated: false,
      testName: null,
      statistic: null,
      pValue: null,
      alpha,
      significant: null,
      confidenceIntervalLower: null,
      confidenceIntervalUpper: null,
      degreesOfFreedom: null,
      effectSize:
        coefficient === null
          ? null
          : Math.abs(coefficient),
      effectSizeMethod:
        coefficient === null
          ? null
          : 'absolute_correlation',
      assumptionsMet: null,
      assumptionWarnings: [
        'Significância não estimada com os dados disponíveis.',
      ],
      metadata: {
        engineName: ENGINE_NAME,
      },
    }
  }

  const denominator =
    Math.max(
      EPSILON,
      1 - coefficient ** 2,
    )

  const statistic =
    coefficient *
    Math.sqrt(
      (sampleSize - 2) /
        denominator,
    )

  const pValue =
    twoSidedPValue(statistic)

  const interval =
    fisherInterval(
      coefficient,
      sampleSize,
      alpha,
    )

  return {
    evaluated: true,
    testName:
      `${method}_normal_approximation`,
    statistic,
    pValue,
    alpha,
    significant: pValue < alpha,
    confidenceIntervalLower:
      interval.lower,
    confidenceIntervalUpper:
      interval.upper,
    degreesOfFreedom:
      sampleSize - 2,
    effectSize:
      Math.abs(coefficient),
    effectSizeMethod:
      'absolute_correlation',
    assumptionsMet: null,
    assumptionWarnings: [
      'O p-value usa aproximação normal.',
      'Os pressupostos estatísticos não foram validados integralmente.',
    ],
    metadata: {
      engineName: ENGINE_NAME,
      engineVersion: ENGINE_VERSION,
      approximation: true,
    },
  }
}

function buildExplainability({
  variableXId,
  variableYId,
  method,
  coefficient,
  sampleSize,
  warnings,
}: {
  variableXId: string
  variableYId: string
  method: AnalyticsCorrelationMethod
  coefficient: number | null
  sampleSize: number
  warnings: string[]
}): AnalyticsExplainability {
  return {
    summary:
      coefficient === null
        ? `Não foi possível calcular ${method} entre ${variableXId} e ${variableYId}.`
        : `A correlação ${method} entre ${variableXId} e ${variableYId} foi ${resolveDirection(coefficient)}, com força ${resolveStrength(coefficient)}.`,
    reasons: [
      `${sampleSize} pares completos foram utilizados.`,
      coefficient === null
        ? 'Coeficiente indisponível.'
        : `Coeficiente: ${coefficient.toFixed(6)}.`,
    ],
    rulesApplied: [
      'pairwise_complete',
      'context_pairing',
      `${method}_correlation`,
      'strength_classification',
      'significance_approximation',
      'causality_guard',
    ],
    variablesUsed: [
      variableXId,
      variableYId,
    ],
    sourceReferences: [],
    assumptions: [
      'Os pares representam a mesma unidade de análise.',
      'Os valores são comparáveis dentro de cada variável.',
    ],
    limitations: [
      'Correlação não demonstra causalidade.',
      'Variáveis omitidas podem explicar a associação.',
      'O p-value é aproximado.',
      ...warnings,
    ],
    uncertaintyFactors: [
      'Tamanho da amostra.',
      'Dados ausentes.',
      'Empates.',
      'Baixa variabilidade.',
    ],
    alternativeExplanations: [
      'A associação pode decorrer de uma terceira variável.',
      'A relação pode ser contextual, temporal ou espúria.',
    ],
    causalityStatus: 'correlation_only',
    generatedAt: nowIso(),
    engineName: ENGINE_NAME,
    engineVersion: ENGINE_VERSION,
    metadata: {
      rulesetVersion: RULESET_VERSION,
    },
  }
}

function generateVariablePairs(
  variableIds: string[],
): Array<{
  variableXId: string
  variableYId: string
}> {
  const pairs: Array<{
    variableXId: string
    variableYId: string
  }> = []

  for (
    let first = 0;
    first < variableIds.length - 1;
    first += 1
  ) {
    for (
      let second = first + 1;
      second < variableIds.length;
      second += 1
    ) {
      pairs.push({
        variableXId: variableIds[first],
        variableYId: variableIds[second],
      })
    }
  }

  return pairs
}

function buildCorrelationResult({
  variableXId,
  variableYId,
  method,
  pairs,
  alpha,
  correlationId,
  input,
}: {
  variableXId: string
  variableYId: string
  method: AnalyticsCorrelationMethod
  pairs: NumericPair[]
  alpha: number
  correlationId: string
  input: CorrelationEngineInput
}): AnalyticsCorrelationResult {
  const calculation =
    calculateCoefficient(method, pairs)

  const coefficient =
    calculation.coefficient

  const significance =
    approximateSignificance(
      coefficient,
      pairs.length,
      alpha,
      method,
    )

  const warnings =
    calculation.warning
      ? [calculation.warning]
      : []

  return {
    id: createStableId(
      'correlation',
      [
        correlationId,
        variableXId,
        variableYId,
        method,
      ].join(':'),
    ),
    variableXId,
    variableYId,
    method,
    coefficient,
    absoluteCoefficient:
      coefficient === null
        ? null
        : Math.abs(coefficient),
    strength: resolveStrength(coefficient),
    direction: resolveDirection(coefficient),
    sampleSize: pairs.length,
    missingPairCount: 0,
    significance,
    confidence: buildConfidence({
      coefficient,
      sampleSize: pairs.length,
      pValue: significance.pValue,
      method,
    }),
    causalityStatus: 'correlation_only',
    controlVariableIds:
      uniqueStrings(
        input.controlVariableIds ?? [],
      ),
    subgroupIds:
      uniqueStrings(
        input.subgroupIds ?? [],
      ),
    temporalLag:
      input.temporalLag ?? null,
    temporalLagUnit:
      input.temporalLagUnit ?? null,
    explanation: buildExplainability({
      variableXId,
      variableYId,
      method,
      coefficient,
      sampleSize: pairs.length,
      warnings,
    }),
    warnings,
    metadata: {
      engineName: ENGINE_NAME,
      engineVersion: ENGINE_VERSION,
      rulesetVersion: RULESET_VERSION,
    },
  }
}

function buildMatrix(
  method: AnalyticsCorrelationMethod,
  variableIds: string[],
  correlations: AnalyticsCorrelationResult[],
): CorrelationMatrixResult {
  const map =
    new Map<string, AnalyticsCorrelationResult>()

  for (const result of correlations) {
    if (result.method !== method) {
      continue
    }

    map.set(
      [
        result.variableXId,
        result.variableYId,
      ].sort().join('::'),
      result,
    )
  }

  const cells: CorrelationMatrixCell[] = []

  for (const variableXId of variableIds) {
    for (const variableYId of variableIds) {
      if (variableXId === variableYId) {
        cells.push({
          variableXId,
          variableYId,
          method,
          coefficient: 1,
          sampleSize: 0,
          strength: 'very_strong',
          direction: 'positive',
          significant: true,
          pValue: 0,
          resultId: null,
        })

        continue
      }

      const result =
        map.get(
          [
            variableXId,
            variableYId,
          ].sort().join('::'),
        )

      cells.push({
        variableXId,
        variableYId,
        method,
        coefficient:
          result?.coefficient ?? null,
        sampleSize:
          result?.sampleSize ?? 0,
        strength:
          result?.strength ?? 'undetermined',
        direction:
          result?.direction ?? 'undetermined',
        significant:
          result?.significance.significant ?? null,
        pValue:
          result?.significance.pValue ?? null,
        resultId:
          result?.id ?? null,
      })
    }
  }

  return {
    method,
    variableIds,
    cells,
    generatedAt: nowIso(),
    metadata: {
      engineName: ENGINE_NAME,
      engineVersion: ENGINE_VERSION,
    },
  }
}

export function runCorrelationEngine(
  input: CorrelationEngineInput,
): CorrelationEngineResult {
  const generatedAt = nowIso()
  const warnings: string[] = []

  try {
    const correlationId =
      normalizeRequiredText(
        input.correlationId,
        'correlationId',
      )

    const methods =
      input.methods?.length
        ? Array.from(new Set(input.methods))
        : ['pearson' as const]

    const minimumPairCount =
      Math.max(
        2,
        Math.floor(
          input.minimumPairCount ??
            DEFAULT_MINIMUM_PAIRS,
        ),
      )

    const alpha =
      clamp(
        input.significanceLevel ??
          DEFAULT_ALPHA,
        0.0001,
        0.5,
      )

    const strategy =
      input.pairingStrategy ??
      'entity_and_period'

    const numericObservations =
      toNumericObservations(
        input.observations,
        strategy,
      )

    const numericVariableIds =
      uniqueStrings(
        input.variableDefinitions
          .filter(
            variable =>
              [
                'integer',
                'decimal',
                'percentage',
                'proportion',
                'score',
                'duration',
                'count',
              ].includes(
                variable.valueType,
              ),
          )
          .map(variable => variable.id),
      )

    const requestedPairs =
      input.variablePairs?.length
        ? input.variablePairs
        : generateVariablePairs(
            numericVariableIds,
          )

    const correlations:
      AnalyticsCorrelationResult[] = []

    for (const pair of requestedPairs) {
      if (
        pair.variableXId ===
        pair.variableYId
      ) {
        warnings.push(
          `O par ${pair.variableXId}/${pair.variableYId} foi ignorado.`,
        )
        continue
      }

      const pairs =
        buildPairs(
          numericObservations,
          pair.variableXId,
          pair.variableYId,
        )

      if (pairs.length < minimumPairCount) {
        warnings.push(
          `O par ${pair.variableXId}/${pair.variableYId} possui apenas ${pairs.length} pares completos.`,
        )
      }

      for (const method of methods) {
        const result =
          buildCorrelationResult({
            variableXId:
              pair.variableXId,
            variableYId:
              pair.variableYId,
            method,
            pairs,
            alpha,
            correlationId,
            input,
          })

        correlations.push(result)
        warnings.push(...result.warnings)
      }
    }

    return {
      success: true,
      correlations,
      matrices:
        methods.map(
          method =>
            buildMatrix(
              method,
              numericVariableIds,
              correlations,
            ),
        ),
      warnings:
        uniqueStrings(warnings),
      errors: [],
      generatedAt,
      correlationId,
      metadata: {
        ...(input.metadata ?? {}),
        engineName: ENGINE_NAME,
        engineVersion: ENGINE_VERSION,
        rulesetVersion: RULESET_VERSION,
        pairingStrategy: strategy,
        numericObservationCount:
          numericObservations.length,
        numericVariableCount:
          numericVariableIds.length,
        correlationCount:
          correlations.length,
      },
    }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Falha desconhecida no Correlation Engine.'

    return {
      success: false,
      correlations: [],
      matrices: [],
      warnings: [],
      errors: [message],
      generatedAt,
      correlationId:
        normalizeOptionalText(
          input.correlationId,
        ) ??
        createStableId(
          'correlation-run',
          generatedAt,
        ),
      metadata: {
        engineName: ENGINE_NAME,
        engineVersion: ENGINE_VERSION,
        rulesetVersion: RULESET_VERSION,
        failure: true,
      },
    }
  }
}

export function getCorrelationEngineInfo() {
  return {
    name: ENGINE_NAME,
    version: ENGINE_VERSION,
    rulesetVersion: RULESET_VERSION,
    mode: 'deterministic' as const,
    supportedMethods: [
      'pearson',
      'spearman',
      'kendall',
      'point_biserial',
      'phi',
    ] as AnalyticsCorrelationMethod[],
    plannedMethods: [
      'cramers_v',
      'mutual_information',
      'partial_correlation',
      'cross_correlation',
      'custom',
    ] as AnalyticsCorrelationMethod[],
    guarantees: [
      'correlation_is_not_causation',
      'human_review_preserved',
      'deterministic_pairing',
      'explainability_generated',
    ],
    limitations: [
      'O p-value usa aproximação normal.',
      'Pressupostos estatísticos não são validados integralmente.',
      'Não executa inferência causal.',
      'Não acessa banco de dados.',
      'Não aplica RLS.',
    ],
  }
}
