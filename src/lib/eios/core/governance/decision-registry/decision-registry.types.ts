/** EduData IA — EIOS Governance Core — Decision Registry Contract 1.0 */

export type EiosDecisionType =
  | 'accept'
  | 'adapt'
  | 'reject'
  | 'approve'
  | 'publish'
  | 'archive'
  | 'defer'
  | 'custom'

export type EiosDecisionSubjectType =
  | 'recommendation'
  | 'intervention'
  | 'analysis'
  | 'report'
  | 'evidence'
  | 'workflow'
  | 'custom'

export type EiosDecisionEvidenceReference = {
  type: string
  id: string
  version?: string | null
  relevance?: number | null
}

export type EiosDecisionOutcome = {
  observed: boolean
  status:
    | 'pending'
    | 'positive'
    | 'neutral'
    | 'negative'
    | 'inconclusive'
  observedAt?: string | null
  summary?: string | null
  metricChanges?: Record<string, number>
}

export type EiosDecisionRecord = {
  id: string
  schemaVersion: '1.0.0'
  subjectType: EiosDecisionSubjectType
  subjectId: string
  decision: EiosDecisionType
  decidedBy: string
  decidedByRole?: string | null
  decidedAt: string
  reason: string
  adaptedContent?: string | null
  evidence: EiosDecisionEvidenceReference[]
  analysisId?: string | null
  runId?: string | null
  recommendationId?: string | null
  interventionId?: string | null
  correlationId: string
  auditEventId?: string | null
  provenanceId?: string | null
  outcome: EiosDecisionOutcome
  metadata: Record<string, unknown>
}

export type CreateEiosDecisionInput = {
  subjectType: EiosDecisionSubjectType
  subjectId: string
  decision: EiosDecisionType
  decidedBy: string
  decidedByRole?: string | null
  decidedAt?: string
  reason: string
  adaptedContent?: string | null
  evidence?: EiosDecisionEvidenceReference[]
  analysisId?: string | null
  runId?: string | null
  recommendationId?: string | null
  interventionId?: string | null
  correlationId: string
  auditEventId?: string | null
  provenanceId?: string | null
  metadata?: Record<string, unknown>
}
