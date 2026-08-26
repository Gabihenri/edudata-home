export type ExperimentGoal = 'regression' | 'classification' | 'forecasting'
export type ValidationStrategy = 'random_holdout' | 'stratified_holdout' | 'temporal_holdout'
export type ValidationSeverity = 'info' | 'warning' | 'blocker'
export type ExperimentReadinessStatus = 'ready' | 'caution' | 'not_ready' | 'not-ready'

export interface ExperimentValidationInput {
  goal: ExperimentGoal
  observationCount: number
  targetKey: string | null
  featureKeys: string[]
  temporalCoverage: number
  readinessStatus: ExperimentReadinessStatus
}

export interface ValidationFinding {
  code: string
  severity: ValidationSeverity
  title: string
  message: string
}

export interface ExperimentValidationResult {
  canAdvance: boolean
  strategy: ValidationStrategy
  trainSize: number
  testSize: number
  findings: ValidationFinding[]
}

export function validateExperiment(input: ExperimentValidationInput): ExperimentValidationResult {
  const findings: ValidationFinding[] = []
  const uniqueFeatures = [...new Set(input.featureKeys.filter(Boolean))]
  const hasTarget = Boolean(input.targetKey)

  if (!hasTarget) {
    findings.push({ code: 'missing_target', severity: 'blocker', title: 'Variável-alvo ausente', message: 'Defina explicitamente qual resultado o experimento pretende analisar.' })
  }

  if (uniqueFeatures.length === 0) {
    findings.push({ code: 'missing_features', severity: 'blocker', title: 'Features ausentes', message: 'Selecione ao menos um sinal candidato para avaliar no experimento.' })
  }

  if (input.targetKey && uniqueFeatures.includes(input.targetKey)) {
    findings.push({ code: 'target_leakage', severity: 'blocker', title: 'Possível vazamento direto', message: 'A variável-alvo não pode ser usada simultaneamente como feature do experimento.' })
  }

  if (input.readinessStatus === 'not_ready' || input.readinessStatus === 'not-ready') {
    findings.push({ code: 'readiness_blocked', severity: 'blocker', title: 'Dados ainda não estão prontos', message: 'Revise qualidade, completude e variabilidade antes de configurar a validação.' })
  }

  if (input.observationCount < 30) {
    findings.push({ code: 'small_sample', severity: 'blocker', title: 'Amostra insuficiente', message: 'A amostra disponível é pequena para uma divisão mínima entre treino e teste.' })
  } else if (input.observationCount < 100) {
    findings.push({ code: 'limited_sample', severity: 'warning', title: 'Amostra limitada', message: 'Resultados devem ser interpretados com cautela e não devem sustentar decisões automatizadas.' })
  }

  const strategy: ValidationStrategy = input.goal === 'forecasting'
    ? 'temporal_holdout'
    : input.goal === 'classification'
      ? 'stratified_holdout'
      : 'random_holdout'

  if (input.goal === 'forecasting' && input.temporalCoverage === 0) {
    findings.push({ code: 'missing_time', severity: 'blocker', title: 'Dimensão temporal ausente', message: 'Experimentos de previsão temporal exigem observações com referência de tempo válida.' })
  }

  if (input.goal === 'forecasting' && input.temporalCoverage > 0 && input.temporalCoverage < 0.7) {
    findings.push({ code: 'limited_time_coverage', severity: 'warning', title: 'Cobertura temporal limitada', message: 'Há poucas observações datadas para uma validação temporal robusta.' })
  }

  if (input.observationCount >= 30 && input.observationCount < uniqueFeatures.length * 10) {
    findings.push({ code: 'feature_sample_ratio', severity: 'warning', title: 'Muitas features para a amostra', message: 'Reduza o número de sinais ou amplie a amostra para diminuir risco de sobreajuste.' })
  }

  findings.push({
    code: 'human_review',
    severity: 'info',
    title: 'Revisão humana necessária',
    message: 'A validação estatística não substitui revisão pedagógica, contextual e ética antes de qualquer uso institucional.',
  })

  const testSize = Math.max(1, Math.round(input.observationCount * 0.2))
  const trainSize = Math.max(0, input.observationCount - testSize)

  return {
    canAdvance: !findings.some(finding => finding.severity === 'blocker'),
    strategy,
    trainSize,
    testSize,
    findings,
  }
}
