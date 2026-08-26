export type ExperimentProvenanceInput = {
  experimentType: string
  targetVariable: string
  featureVariable: string
  observationCount: number
  trainCount: number
  testCount: number
  metrics: Record<string, number>
}

export type ExperimentProvenance = ExperimentProvenanceInput & {
  id: string
  executedAt: string
  version: '1.0'
  fingerprint: string
  reproducibility: string[]
}

function normalize(value: string) {
  return value.trim().toLowerCase()
}

function fingerprint(input: ExperimentProvenanceInput) {
  const payload = [
    normalize(input.experimentType),
    normalize(input.targetVariable),
    normalize(input.featureVariable),
    input.observationCount,
    input.trainCount,
    input.testCount,
    ...Object.entries(input.metrics)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, value]) => `${key}:${Number(value).toFixed(8)}`),
  ].join('|')

  let hash = 2166136261
  for (let index = 0; index < payload.length; index += 1) {
    hash ^= payload.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return `EDI-${(hash >>> 0).toString(16).toUpperCase().padStart(8, '0')}`
}

export function createExperimentProvenance(input: ExperimentProvenanceInput): ExperimentProvenance {
  const executedAt = new Date().toISOString()
  const record = {
    ...input,
    id: `${fingerprint(input)}-${executedAt.slice(0, 10).replaceAll('-', '')}`,
    executedAt,
    version: '1.0' as const,
    fingerprint: fingerprint(input),
    reproducibility: [
      `Modelo: ${input.experimentType}`,
      `Variável-alvo: ${input.targetVariable}`,
      `Variável explicativa: ${input.featureVariable}`,
      `Observações: ${input.observationCount}`,
      `Divisão: ${input.trainCount} treino / ${input.testCount} teste`,
      'Execução determinística para a mesma configuração e conjunto de valores.',
    ],
  }

  return record
}
