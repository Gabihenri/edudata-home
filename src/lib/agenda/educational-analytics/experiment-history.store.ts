import type { ExperimentProvenance } from './experiment-provenance.engine'

export type StoredExperiment = ExperimentProvenance & {
  equation: string
  status: 'completed'
}

const STORAGE_KEY = 'edudata.analytics.experiment-history.v1'

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function read(): StoredExperiment[] {
  if (!canUseStorage()) return []

  try {
    const value = window.localStorage.getItem(STORAGE_KEY)
    if (!value) return []
    const parsed: unknown = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.filter((item): item is StoredExperiment => Boolean(item) && typeof item === 'object' && 'id' in item) : []
  } catch {
    return []
  }
}

export function saveExperiment(experiment: StoredExperiment) {
  if (!canUseStorage()) return
  const current = read().filter(item => item.id !== experiment.id)
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify([experiment, ...current].slice(0, 100)))
}

export function listExperiments() {
  return read().sort((left, right) => right.executedAt.localeCompare(left.executedAt))
}
