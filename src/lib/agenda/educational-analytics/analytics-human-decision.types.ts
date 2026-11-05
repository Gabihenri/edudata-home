export type AnalyticsHumanDecisionStatus =
  | 'under_review'
  | 'needs_evidence'
  | 'forwarded'
  | 'archived'

export type AnalyticsHumanDecisionInput = {
  signalId: string
  status: AnalyticsHumanDecisionStatus
  justification?: string
  sourceAnalysisId?: string | null
  evidenceSnapshot: Record<string, unknown>
}

export type AnalyticsHumanDecisionRecord = {
  id: string
  signalId: string
  status: AnalyticsHumanDecisionStatus
  justification: string | null
  sourceAnalysisId: string | null
  evidenceSnapshot: Record<string, unknown>
  interventionId: string | null
  decidedAt: string
  decidedBy: string
}

export type AnalyticsDecisionRegistrationResult = {
  decision: AnalyticsHumanDecisionRecord
  interventionCreated: boolean
}
