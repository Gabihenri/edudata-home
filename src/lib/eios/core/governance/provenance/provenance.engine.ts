/** EduData IA — EIOS Governance Core — Provenance Engine 1.0 */

import type {
  CreateEiosProvenanceInput,
  EiosProvenanceRecord,
} from './provenance.types'

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value)
  }

  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`
  }

  const record = value as Record<string, unknown>
  const keys = Object.keys(record).sort()

  return `{${keys
    .map(key => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
    .join(',')}}`
}

function fnv1a32(value: string): string {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(16).padStart(8, '0')
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.map(value => value.trim()).filter(Boolean)))
}

export function createEiosProvenanceRecord(
  input: CreateEiosProvenanceInput,
): EiosProvenanceRecord {
  const generatedAt = input.generatedAt ?? new Date().toISOString()
  const capabilities = unique(input.capabilities ?? [])
  const parentProvenanceIds = unique(input.parentProvenanceIds ?? [])

  const payload = {
    resourceType: input.resourceType,
    resourceId: input.resourceId,
    resourceVersion: input.resourceVersion ?? null,
    analysisId: input.analysisId ?? null,
    runId: input.runId ?? null,
    reportId: input.reportId ?? null,
    frameworkVersion: input.frameworkVersion ?? null,
    eiosVersion: input.eiosVersion ?? null,
    sourceProduct: input.sourceProduct ?? null,
    sources: input.sources ?? [],
    engines: input.engines ?? [],
    capabilities,
    generatedBy: input.generatedBy ?? null,
    generatedAt,
    correlationId: input.correlationId,
    parentProvenanceIds,
    metadata: input.metadata ?? {},
  }

  const contentHash = fnv1a32(stableStringify(payload))

  return {
    id: `provenance-${contentHash}`,
    schemaVersion: '1.0.0',
    ...payload,
    integrity: {
      hashAlgorithm: 'fnv1a32',
      contentHash,
    },
  }
}

export function verifyEiosProvenanceRecord(
  record: EiosProvenanceRecord,
): boolean {
  const payload = {
    resourceType: record.resourceType,
    resourceId: record.resourceId,
    resourceVersion: record.resourceVersion ?? null,
    analysisId: record.analysisId ?? null,
    runId: record.runId ?? null,
    reportId: record.reportId ?? null,
    frameworkVersion: record.frameworkVersion ?? null,
    eiosVersion: record.eiosVersion ?? null,
    sourceProduct: record.sourceProduct ?? null,
    sources: record.sources,
    engines: record.engines,
    capabilities: record.capabilities,
    generatedBy: record.generatedBy ?? null,
    generatedAt: record.generatedAt,
    correlationId: record.correlationId,
    parentProvenanceIds: record.parentProvenanceIds,
    metadata: record.metadata,
  }

  return fnv1a32(stableStringify(payload)) === record.integrity.contentHash
}

export function getProvenanceEngineInfo() {
  return {
    name: 'eios-governance-provenance-engine',
    version: '1.0.0',
    deterministic: true,
    integrityHash: 'fnv1a32',
  }
}
