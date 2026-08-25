/**
 * EduData IA — EIOS
 * Capability 04.2: Correlation Discovery Engine
 *
 * Camada de descoberta exploratória sobre o Correlation Engine.
 * Varre pares de variáveis, executa métodos configurados e prioriza
 * associações estatisticamente relevantes para investigação humana.
 */

import {
  calculateCorrelations,
  type CorrelationEngineResult,
} from './correlation.engine'
import type {
  AnalyticsCorrelationMethod,
  AnalyticsCorrelationResult,
  AnalyticsMetadata,
  AnalyticsObservation,
  AnalyticsVariableDefinition,
} from './analytics.types'

export type CorrelationDiscoveryInput = {
  observations: AnalyticsObservation[]
  variableDefinitions: AnalyticsVariableDefinition[]
  methods?: AnalyticsCorrelationMethod[]
  minimumPairCount?: number
  minimumAbsoluteCoefficient?: number
  significanceLevel?: number
  metadata?: AnalyticsMetadata
}

export type DiscoveredCorrelation = {
  result: AnalyticsCorrelationResult
  priorityScore: number
  priority: 'high' | 'medium' | 'low'
  reason: string
}

export type CorrelationDiscoveryResult = {
  success: boolean
  discovered: DiscoveredCorrelation[]
  scannedVariablePairs: number
  warnings: string[]
  errors: string[]
  generatedAt: string
  metadata: AnalyticsMetadata
}

const DEFAULT_METHODS: AnalyticsCorrelationMethod[] = [
  'pearson',
  'spearman',
]

const DEFAULT_MINIMUM_COEFFICIENT = 0.3

function isNumericVariable(
  variable: AnalyticsVariableDefinition,
): boolean {
  return [
    'integer',
    'decimal',
    'percentage',
    'proportion',
    'score',
    'duration',
    'count',
  ].includes(variable.valueType)
}

function priorityScore(
  result: AnalyticsCorrelationResult,
): number {
  const coefficient = result.absoluteCoefficient ?? 0
  const sampleFactor = Math.min(result.sampleSize / 50, 1)
  const significanceFactor =
    result.statisticalSignificance.pValue === null
      ? 0.5
      : Math.max(0, 1 - result.statisticalSignificance.pValue)

  return Number(
    (
      coefficient * 0.55 +
      sampleFactor * 0.25 +
      significanceFactor * 0.2
    ).toFixed(4),
  )
}

function priorityFromScore(
  score: number): DiscoveredCorrelation['priority'] {
  if (score >= 0.7) return 'high'
  if (score >= 0.45) return 'medium'
  return 'low'
}

function reasonFor(
  result: AnalyticsCorrelationResult,
  score: number,
): string {
  const strength = result.strength.replace('_', ' ')
  const direction = result.direction === 'positive'
    ? 'positiva'
    : result.direction === 'negative'
      ? 'negativa'
      : 'indeterminada'

  return `Associação ${direction}, de força ${strength}, priorizada por magnitude, tamanho da amostra e evidência estatística (score ${score}). Correlação não implica causalidade.`
}

export function discoverCorrelations(
  input: CorrelationDiscoveryInput,
): CorrelationDiscoveryResult {
  const numericVariables = input.variableDefinitions.filter(isNumericVariable)
  const variablePairs = numericVariables.flatMap((variableX, index) =>
    numericVariables.slice(index + 1).map(variableY => ({
      variableXId: variableX.id,
      variableYId: variableY.id,
    })),
  )

  if (variablePairs.length === 0) {
    return {
      success: true,
      discovered: [],
      scannedVariablePairs: 0,
      warnings: ['Não há pares suficientes de variáveis numéricas para análise de correlação.'],
      errors: [],
      generatedAt: new Date().toISOString(),
      metadata: input.metadata ?? {},
    }
  }

  const engineResult: CorrelationEngineResult = calculateCorrelations({
    observations: input.observations,
    variableDefinitions: numericVariables,
    variablePairs,
    methods: input.methods ?? DEFAULT_METHODS,
    minimumPairCount: input.minimumPairCount,
    significanceLevel: input.significanceLevel,
    correlationId: `correlation-discovery-${Date.now()}`,
    metadata: {
      ...(input.metadata ?? {}),
      discoveryMode: 'automatic',
    },
  })

  const minimumCoefficient = input.minimumAbsoluteCoefficient ?? DEFAULT_MINIMUM_COEFFICIENT

  const discovered = engineResult.correlations
    .filter(result => (result.absoluteCoefficient ?? 0) >= minimumCoefficient)
    .map(result => {
      const score = priorityScore(result)
      return {
        result,
        priorityScore: score,
        priority: priorityFromScore(score),
        reason: reasonFor(result, score),
      }
    })
    .sort((first, second) => second.priorityScore - first.priorityScore)

  return {
    success: engineResult.success,
    discovered,
    scannedVariablePairs: variablePairs.length,
    warnings: engineResult.warnings,
    errors: engineResult.errors,
    generatedAt: new Date().toISOString(),
    metadata: {
      ...(input.metadata ?? {}),
      engine: 'eios-correlation-discovery-engine',
      version: '1.0.0',
      minimumAbsoluteCoefficient: minimumCoefficient,
    },
  }
}
