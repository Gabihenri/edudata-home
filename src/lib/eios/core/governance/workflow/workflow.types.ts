/** EduData IA — EIOS Governance Core — Workflow Contract 1.0 */

export type EiosWorkflowState =
  | 'draft'
  | 'generated'
  | 'under_human_review'
  | 'approved'
  | 'published'
  | 'rejected'
  | 'archived'

export type EiosWorkflowResourceType =
  | 'analysis'
  | 'evidence'
  | 'intervention'
  | 'recommendation'
  | 'report'
  | 'export'
  | 'decision'
  | 'custom'

export type EiosWorkflowTransitionReason =
  | 'generated'
  | 'submitted_for_review'
  | 'human_approval'
  | 'human_rejection'
  | 'published'
  | 'archived'
  | 'restored'
  | 'corrected'
  | 'custom'

export type EiosWorkflowTransition = {
  id: string
  resourceType: EiosWorkflowResourceType
  resourceId: string
  from: EiosWorkflowState
  to: EiosWorkflowState
  reason: EiosWorkflowTransitionReason
  reasonText?: string | null
  actorId: string
  actorRole?: string | null
  occurredAt: string
  correlationId: string
  auditEventId?: string | null
  metadata: Record<string, unknown>
}

export type EiosWorkflowSnapshot = {
  resourceType: EiosWorkflowResourceType
  resourceId: string
  currentState: EiosWorkflowState
  previousState?: EiosWorkflowState | null
  lastTransitionId?: string | null
  updatedAt: string
  requiresHumanReview: boolean
  approved: boolean
  published: boolean
  archived: boolean
}

export type EiosWorkflowTransitionRequest = {
  resourceType: EiosWorkflowResourceType
  resourceId: string
  currentState: EiosWorkflowState
  targetState: EiosWorkflowState
  reason: EiosWorkflowTransitionReason
  reasonText?: string | null
  actorId: string
  actorRole?: string | null
  correlationId: string
  requiresHumanReview?: boolean
  metadata?: Record<string, unknown>
}

export type EiosWorkflowValidationResult = {
  allowed: boolean
  requiresHumanReview: boolean
  errors: string[]
  warnings: string[]
}
