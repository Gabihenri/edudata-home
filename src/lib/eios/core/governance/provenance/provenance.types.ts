/** EduData IA — EIOS Governance Core — Provenance Contract 1.0 */

export type EiosProvenanceSourceType =
  | 'dataset'
  | 'evidence'
  | 'analysis'
  | 'report'
  | 'recommendation'
  | 'intervention'
  | 'graph'
  | 'external_system'
  | 'custom'

export type EiosProvenanceSource = {
  type: EiosProvenanceSourceType
  id: string
  version?: string | null
  hash?: string | null
  generatedAt?: string | null
  uri?: string | null
}

export type EiosProvenanceEngine = {
  name: string
  version: string
  rulesetVersion?: string | null
  capability: string
}

export type EiosProvenanceRecord = {
  id: string
  schemaVersion: '1.0.0'
  resourceType: string
  resourceId: string
  resourceVersion?: string | null
  analysisId?: string | null
  runId?: string | null
  reportId?: string | null
  frameworkVersion?: string | null
  eiosVersion?: string | null
  sourceProduct?: string | null
  sources: EiosProvenanceSource[]
  engines: EiosProvenanceEngine[]
  capabilities: string[]
  generatedBy?: string | null
  generatedAt: string
  correlationId: string
  parentProvenanceIds: string[]
  integrity: {
    hashAlgorithm: 'fnv1a32'
    contentHash: string
  }
  metadata: Record<string, unknown>
}

export type CreateEiosProvenanceInput = {
  resourceType: string
  resourceId: string
  resourceVersion?: string | null
  analysisId?: string | null
  runId?: string | null
  reportId?: string | null
  frameworkVersion?: string | null
  eiosVersion?: string | null
  sourceProduct?: string | null
  sources?: EiosProvenanceSource[]
  engines?: EiosProvenanceEngine[]
  capabilities?: string[]
  generatedBy?: string | null
  generatedAt?: string
  correlationId: string
  parentProvenanceIds?: string[]
  metadata?: Record<string, unknown>
}
