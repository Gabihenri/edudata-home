/**
 * EduData IA — EIOS
 * Capability 04: Educational Analytics
 * Sprint 04.16 — Longitudinal Intelligence Engine
 *
 * Consolida séries evolutivas já persistidas em sinais longitudinais explicáveis.
 *
 * Regras:
 * - não recalcula análises especializadas;
 * - não infere causalidade;
 * - não toma decisões automáticas;
 * - classifica persistência, estabilidade, volatilidade e mudanças relativas;
 * - exige interpretação humana para qualquer uso pedagógico ou institucional.
 */

import type {
  EducationalAnalyticsEvolutionMetric,
  EducationalAnalyticsEvolutionPoint,
  EducationalAnalyticsEvolutionResult,
} from './educational-analytics-evolution.service'

export type LongitudinalDirection =
  | 'increasing'
  | 'decreasing'
  | 'stable'
  | 'mixed'
  | 'insufficient_data'

export type LongitudinalStability =
  | 'high'
  | 'moderate'
  | 'low'
  | 'insufficient_data'

export type LongitudinalVolatility =
  | 'low'
  | 'moderate'
  | 'high'
  | 'insufficient_data'

export type LongitudinalChangeSignificance =
  | 'none'
  | 'small'
  | 'moderate'
  | 'large'
  | 'insufficient_data'

export type LongitudinalMetricSignal = {
  metric: EducationalAnalyticsEvolutionMetric
  observations: number
  firstValue: number | null
  latestValue: number | null
  absoluteDelta: number | null
  relativeDelta: number | null
  mean: number | null
  standardDeviation: number | null
  coefficientOfVariation: number | null
  direction: LongitudinalDirection
  directionPersistence: number | null
  stability: LongitudinalStability
  volatility: LongitudinalVolatility
  changeSignificance: LongitudinalChangeSignificance
  changePoints: Array<{
    fromRunId: string
    toRunId: string
    fromVersionNumber: number
    toVersionNumber: number
    delta: number
    relativeDelta: number | null
  }>
  requiresHumanReview: true
  explanation: string
}

export type LongitudinalQualitySignal = {
  observations: number
  firstScore: number | null
  latestScore: number | null
  absoluteDelta: number | null
  direction: LongitudinalDirection
  stability: LongitudinalStability
  volatility: LongitudinalVolatility
  explanation: string
}

export type LongitudinalIntelligenceResult = {
  analysisKey: string | null
  versionCount: number
  firstGeneratedAt: string | null
  latestGeneratedAt: string | null
  metricSignals: LongitudinalMetricSignal[]
  qualitySignal: LongitudinalQualitySignal
  persistentSignals: LongitudinalMetricSignal[]
  significantChanges: LongitudinalMetricSignal[]
  overallStability: LongitudinalStability
  overallVolatility: LongitudinalVolatility
  dataSufficiency:
    | 'insufficient'
    | 'limited'
    | 'adequate'
    | 'strong'
  requiresHumanReview: true
  warnings: string[]
  generatedAt: string
  metadata: {
    engine: 'eios-longitudinal-intelligence-engine'
    version: '1.0.0'
    causalityStatus: 'association_only'
    automatedDecisionProhibited: true
  }
}

const METRICS: EducationalAnalyticsEvolutionMetric[] = [
  'correlations',
  'patterns',
  'anomalies',
  'influences',
  'predictions',
  'recommendations',
  'researchResults',
]

function mean(values: number[]): number | null {
  if (values.length === 0) return null
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function standardDeviation(values: number[]): number | null {
  if (values.length < 2) return null
  const average = mean(values)
  if (average === null) return null
  const variance =
    values.reduce(
      (sum, value) => sum + Math.pow(value - average, 2),
      0,
    ) / values.length
  return Math.sqrt(variance)
}

function relativeDelta(first: number, latest: number): number | null {
  if (first === 0) {
    return latest === 0 ? 0 : null
  }
  return (latest - first) / Math.abs(first)
}

function classifyDirection(
  values: number[],
): {
  direction: LongitudinalDirection
  persistence: number | null
} {
  if (values.length < 2) {
    return {
      direction: 'insufficient_data',
      persistence: null,
    }
  }

  const deltas = values.slice(1).map(
    (value, index) => value - values[index],
  )

  const nonZero = deltas.filter(delta => delta !== 0)

  if (nonZero.length === 0) {
    return {
      direction: 'stable',
      persistence: 1,
    }
  }

  const positive = nonZero.filter(delta => delta > 0).length
  const negative = nonZero.filter(delta => delta < 0).length
  const dominant = Math.max(positive, negative)
  const persistence = dominant / nonZero.length

  if (persistence < 0.67) {
    return {
      direction: 'mixed',
      persistence,
    }
  }

  return {
    direction:
      positive > negative
        ? 'increasing'
        : 'decreasing',
    persistence,
  }
}

function classifyStability(
  coefficientOfVariation: number | null,
  observations: number,
): LongitudinalStability {
  if (observations < 2 || coefficientOfVariation === null) {
    return 'insufficient_data'
  }
  if (coefficientOfVariation <= 0.15) return 'high'
  if (coefficientOfVariation <= 0.35) return 'moderate'
  return 'low'
}

function classifyVolatility(
  coefficientOfVariation: number | null,
  observations: number,
): LongitudinalVolatility {
  if (observations < 2 || coefficientOfVariation === null) {
    return 'insufficient_data'
  }
  if (coefficientOfVariation <= 0.15) return 'low'
  if (coefficientOfVariation <= 0.35) return 'moderate'
  return 'high'
}

function classifyChangeSignificance(
  relative: number | null,
  absolute: number,
  observations: number,
): LongitudinalChangeSignificance {
  if (observations < 2) return 'insufficient_data'
  if (absolute === 0) return 'none'

  if (relative === null) {
    return Math.abs(absolute) >= 3
      ? 'large'
      : Math.abs(absolute) >= 2
        ? 'moderate'
        : 'small'
  }

  const magnitude = Math.abs(relative)
  if (magnitude < 0.1) return 'small'
  if (magnitude < 0.3) return 'moderate'
  return 'large'
}

function detectChangePoints(
  points: EducationalAnalyticsEvolutionPoint[],
  metric: EducationalAnalyticsEvolutionMetric,
) {
  const changes: LongitudinalMetricSignal['changePoints'] = []

  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1]
    const current = points[index]
    const previousValue = previous.counts[metric]
    const currentValue = current.counts[metric]
    const delta = currentValue - previousValue
    const relative = relativeDelta(previousValue, currentValue)

    const isSignificant =
      relative === null
        ? Math.abs(delta) >= 2
        : Math.abs(relative) >= 0.3

    if (isSignificant) {
      changes.push({
        fromRunId: previous.runId,
        toRunId: current.runId,
        fromVersionNumber: previous.versionNumber,
        toVersionNumber: current.versionNumber,
        delta,
        relativeDelta: relative,
      })
    }
  }

  return changes
}

function metricLabel(metric: EducationalAnalyticsEvolutionMetric): string {
  const labels: Record<EducationalAnalyticsEvolutionMetric, string> = {
    correlations: 'correlações',
    patterns: 'padrões',
    anomalies: 'anomalias',
    influences: 'influências',
    predictions: 'previsões',
    recommendations: 'recomendações',
    researchResults: 'resultados de pesquisa',
  }
  return labels[metric]
}

function buildMetricSignal(
  points: EducationalAnalyticsEvolutionPoint[],
  metric: EducationalAnalyticsEvolutionMetric,
): LongitudinalMetricSignal {
  const values = points.map(point => point.counts[metric])
  const observations = values.length
  const firstValue = values[0] ?? null
  const latestValue = values.at(-1) ?? null
  const average = mean(values)
  const deviation = standardDeviation(values)
  const coefficientOfVariation =
    average !== null && average !== 0 && deviation !== null
      ? deviation / Math.abs(average)
      : deviation === 0
        ? 0
        : null

  const directionResult = classifyDirection(values)
  const absoluteDelta =
    firstValue !== null && latestValue !== null
      ? latestValue - firstValue
      : null
  const relative =
    firstValue !== null && latestValue !== null
      ? relativeDelta(firstValue, latestValue)
      : null
  const stability = classifyStability(coefficientOfVariation, observations)
  const volatility = classifyVolatility(coefficientOfVariation, observations)
  const changeSignificance =
    absoluteDelta === null
      ? 'insufficient_data'
      : classifyChangeSignificance(relative, absoluteDelta, observations)

  return {
    metric,
    observations,
    firstValue,
    latestValue,
    absoluteDelta,
    relativeDelta: relative,
    mean: average,
    standardDeviation: deviation,
    coefficientOfVariation,
    direction: directionResult.direction,
    directionPersistence: directionResult.persistence,
    stability,
    volatility,
    changeSignificance,
    changePoints: detectChangePoints(points, metric),
    requiresHumanReview: true,
    explanation:
      observations < 2
        ? `Ainda não há versões suficientes para interpretar longitudinalmente ${metricLabel(metric)}.`
        : `A série de ${metricLabel(metric)} foi classificada como ${directionResult.direction}, com estabilidade ${stability} e volatilidade ${volatility}. Esta leitura é descritiva e não causal.`,
  }
}

function buildQualitySignal(
  points: EducationalAnalyticsEvolutionPoint[],
): LongitudinalQualitySignal {
  const values = points
    .map(point => point.dataQualityScore)
    .filter((value): value is number => value !== null)

  const firstScore = values[0] ?? null
  const latestScore = values.at(-1) ?? null
  const average = mean(values)
  const deviation = standardDeviation(values)
  const coefficientOfVariation =
    average !== null && average !== 0 && deviation !== null
      ? deviation / Math.abs(average)
      : deviation === 0
        ? 0
        : null

  const directionResult = classifyDirection(values)

  return {
    observations: values.length,
    firstScore,
    latestScore,
    absoluteDelta:
      firstScore !== null && latestScore !== null
        ? latestScore - firstScore
        : null,
    direction: directionResult.direction,
    stability: classifyStability(coefficientOfVariation, values.length),
    volatility: classifyVolatility(coefficientOfVariation, values.length),
    explanation:
      values.length < 2
        ? 'Ainda não há versões suficientes com escore de qualidade para interpretar sua evolução.'
        : 'A qualidade dos dados é avaliada longitudinalmente apenas como sinal de consistência da série; não representa qualidade pedagógica.',
  }
}

function aggregateStability(
  signals: LongitudinalMetricSignal[],
): LongitudinalStability {
  const scored = signals
    .map(signal => signal.stability)
    .filter(
      (value): value is Exclude<LongitudinalStability, 'insufficient_data'> =>
        value !== 'insufficient_data',
    )

  if (scored.length === 0) return 'insufficient_data'

  const values = scored.map(value =>
    value === 'high' ? 3 : value === 'moderate' ? 2 : 1,
  )
  const average = mean(values) ?? 0

  if (average >= 2.5) return 'high'
  if (average >= 1.5) return 'moderate'
  return 'low'
}

function aggregateVolatility(
  signals: LongitudinalMetricSignal[],
): LongitudinalVolatility {
  const scored = signals
    .map(signal => signal.volatility)
    .filter(
      (value): value is Exclude<LongitudinalVolatility, 'insufficient_data'> =>
        value !== 'insufficient_data',
    )

  if (scored.length === 0) return 'insufficient_data'

  const values = scored.map(value =>
    value === 'high' ? 3 : value === 'moderate' ? 2 : 1,
  )
  const average = mean(values) ?? 0

  if (average >= 2.5) return 'high'
  if (average >= 1.5) return 'moderate'
  return 'low'
}

function dataSufficiency(versionCount: number): LongitudinalIntelligenceResult['dataSufficiency'] {
  if (versionCount < 2) return 'insufficient'
  if (versionCount < 4) return 'limited'
  if (versionCount < 8) return 'adequate'
  return 'strong'
}

export function buildLongitudinalIntelligence(
  evolution: EducationalAnalyticsEvolutionResult,
): LongitudinalIntelligenceResult {
  const metricSignals = METRICS.map(
    metric => buildMetricSignal(evolution.points, metric),
  )

  const persistentSignals = metricSignals.filter(signal =>
    signal.directionPersistence !== null &&
    signal.directionPersistence >= 0.75 &&
    signal.direction !== 'stable' &&
    signal.direction !== 'mixed',
  )

  const significantChanges = metricSignals.filter(signal =>
    signal.changeSignificance === 'moderate' ||
    signal.changeSignificance === 'large' ||
    signal.changePoints.length > 0,
  )

  const warnings = [...evolution.warnings]

  if (evolution.points.length < 4) {
    warnings.push(
      'A série longitudinal ainda é curta; sinais persistentes devem ser interpretados com cautela.',
    )
  }

  const analysisKeys = Array.from(
    new Set(evolution.points.map(point => point.analysisKey)),
  )

  if (analysisKeys.length > 1) {
    warnings.push(
      'Foram encontradas múltiplas chaves de análise; a consolidação longitudinal é exploratória até que uma analysisKey seja filtrada.',
    )
  }

  return {
    analysisKey:
      analysisKeys.length === 1
        ? analysisKeys[0]
        : null,
    versionCount: evolution.points.length,
    firstGeneratedAt: evolution.summary.firstGeneratedAt,
    latestGeneratedAt: evolution.summary.latestGeneratedAt,
    metricSignals,
    qualitySignal: buildQualitySignal(evolution.points),
    persistentSignals,
    significantChanges,
    overallStability: aggregateStability(metricSignals),
    overallVolatility: aggregateVolatility(metricSignals),
    dataSufficiency: dataSufficiency(evolution.points.length),
    requiresHumanReview: true,
    warnings: Array.from(new Set(warnings)),
    generatedAt: new Date().toISOString(),
    metadata: {
      engine: 'eios-longitudinal-intelligence-engine',
      version: '1.0.0',
      causalityStatus: 'association_only',
      automatedDecisionProhibited: true,
    },
  }
}
