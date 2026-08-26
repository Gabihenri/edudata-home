export type ModelingVariableType =
  | 'integer'
  | 'decimal'
  | 'percentage'
  | 'proportion'
  | 'score'
  | 'count'
  | 'duration'

export interface ModelReadinessVariable {
  key: string
  label: string
  valueType: ModelingVariableType | string
  values: Array<number | null | undefined>
}

export interface ModelReadinessInput {
  variables: ModelReadinessVariable[]
  observationCount: number
  datedObservationCount?: number
}

export type ModelReadinessStatus = 'ready' | 'caution' | 'not-ready'

export interface ModelReadinessVariableProfile {
  key: string
  label: string
  validCount: number
  missingCount: number
  completeness: number
  distinctCount: number
  variance: number
  usableAsFeature: boolean
  usableAsTarget: boolean
  reasons: string[]
}

export interface ModelReadinessRecommendation {
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
}

export interface ModelReadinessResult {
  status: ModelReadinessStatus
  score: number
  sampleSize: number
  usableVariableCount: number
  candidateFeatureCount: number
  candidateTargetCount: number
  averageCompleteness: number
  temporalCoverage: 'available' | 'partial' | 'unavailable'
  profiles: ModelReadinessVariableProfile[]
  recommendations: ModelReadinessRecommendation[]
  summary: string
}

const NUMERIC_TYPES = new Set<ModelingVariableType>([
  'integer',
  'decimal',
  'percentage',
  'proportion',
  'score',
  'count',
  'duration',
])

function finiteValues(values: Array<number | null | undefined>): number[] {
  return values.filter((value): value is number => typeof value === 'number' && Number.isFinite(value))
}

function calculateVariance(values: number[]): number {
  if (values.length < 2) return 0
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length
  return values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length
}

function priorityWeight(priority: ModelReadinessRecommendation['priority']) {
  if (priority === 'high') return 20
  if (priority === 'medium') return 10
  return 5
}

export function evaluateModelReadiness(input: ModelReadinessInput): ModelReadinessResult {
  const sampleSize = Math.max(0, input.observationCount)

  const profiles = input.variables.map(variable => {
    const validValues = finiteValues(variable.values)
    const validCount = validValues.length
    const missingCount = Math.max(0, sampleSize - validCount)
    const completeness = sampleSize > 0 ? validCount / sampleSize : 0
    const distinctCount = new Set(validValues).size
    const variance = calculateVariance(validValues)
    const reasons: string[] = []
    const numericType = NUMERIC_TYPES.has(variable.valueType as ModelingVariableType)

    if (!numericType) reasons.push('Tipo de variável não suportado pelo laboratório de modelagem numérica.')
    if (validCount < 5) reasons.push('Quantidade insuficiente de observações válidas para exploração de modelagem.')
    if (completeness < 0.7) reasons.push('Completude abaixo de 70%; recomenda-se tratamento de dados ausentes.')
    if (distinctCount < 2) reasons.push('Variável sem variação suficiente para contribuir com um modelo.')
    if (variance === 0 && validCount > 0) reasons.push('Variância nula; a variável é constante na amostra analisada.')

    const usableAsFeature = numericType && validCount >= 5 && completeness >= 0.7 && distinctCount >= 2 && variance > 0
    const usableAsTarget = usableAsFeature && validCount >= 10

    return {
      key: variable.key,
      label: variable.label,
      validCount,
      missingCount,
      completeness,
      distinctCount,
      variance,
      usableAsFeature,
      usableAsTarget,
      reasons,
    }
  })

  const usableVariableCount = profiles.filter(profile => profile.usableAsFeature).length
  const candidateFeatureCount = usableVariableCount
  const candidateTargetCount = profiles.filter(profile => profile.usableAsTarget).length
  const averageCompleteness = profiles.length
    ? profiles.reduce((sum, profile) => sum + profile.completeness, 0) / profiles.length
    : 0

  const temporalCoverage = input.datedObservationCount === undefined || input.datedObservationCount === 0
    ? 'unavailable'
    : input.datedObservationCount >= sampleSize * 0.8
      ? 'available'
      : 'partial'

  const recommendations: ModelReadinessRecommendation[] = []

  if (sampleSize < 20) {
    recommendations.push({
      priority: 'high',
      title: 'Aumentar a amostra',
      description: 'A amostra atual é pequena para avaliação robusta de modelos. Priorize a coleta contínua e evite conclusões preditivas generalizáveis.',
    })
  } else if (sampleSize < 50) {
    recommendations.push({
      priority: 'medium',
      title: 'Ampliar a base histórica',
      description: 'Já é possível realizar experimentos exploratórios, mas uma base maior aumenta a estabilidade da validação e reduz a sensibilidade a variações ocasionais.',
    })
  }

  if (averageCompleteness < 0.8) {
    recommendations.push({
      priority: averageCompleteness < 0.6 ? 'high' : 'medium',
      title: 'Tratar dados ausentes',
      description: 'Avalie o mecanismo das ausências antes de imputar valores. Dados ausentes não devem ser convertidos automaticamente em zero.',
    })
  }

  if (usableVariableCount < 2) {
    recommendations.push({
      priority: 'high',
      title: 'Ampliar variáveis utilizáveis',
      description: 'Modelos multivariados precisam de mais sinais analíticos com variação e qualidade suficientes para investigação.',
    })
  }

  if (temporalCoverage === 'unavailable') {
    recommendations.push({
      priority: 'medium',
      title: 'Registrar dimensão temporal',
      description: 'Datas consistentes permitem acompanhar evolução, evitar vazamento temporal e testar modelos de tendência ou previsão.',
    })
  }

  if (candidateTargetCount === 0) {
    recommendations.push({
      priority: 'medium',
      title: 'Definir um desfecho mensurável',
      description: 'Para avançar para modelagem supervisionada, selecione ou construa uma variável-alvo com observações suficientes e variação real.',
    })
  }

  const penalties = recommendations.reduce((sum, recommendation) => sum + priorityWeight(recommendation.priority), 0)
  const sampleScore = Math.min(1, sampleSize / 50) * 30
  const completenessScore = averageCompleteness * 35
  const variableScore = Math.min(1, usableVariableCount / 4) * 25
  const temporalScore = temporalCoverage === 'available' ? 10 : temporalCoverage === 'partial' ? 5 : 0
  const score = Math.max(0, Math.min(100, Math.round(sampleScore + completenessScore + variableScore + temporalScore - penalties)))

  const status: ModelReadinessStatus = score >= 70 && candidateTargetCount > 0
    ? 'ready'
    : score >= 40
      ? 'caution'
      : 'not-ready'

  const summary = status === 'ready'
    ? 'O dataset apresenta condições exploratórias adequadas para iniciar experimentos de modelagem, mantendo validação e interpretação humana como requisitos.'
    : status === 'caution'
      ? 'O dataset permite investigação preparatória, mas ainda exige cuidados de qualidade, amostragem ou definição de variáveis antes de resultados preditivos confiáveis.'
      : 'O dataset ainda não possui condições mínimas suficientes para uma modelagem responsável; priorize coleta, qualidade e estruturação das variáveis.'

  return {
    status,
    score,
    sampleSize,
    usableVariableCount,
    candidateFeatureCount,
    candidateTargetCount,
    averageCompleteness,
    temporalCoverage,
    profiles,
    recommendations,
    summary,
  }
}
