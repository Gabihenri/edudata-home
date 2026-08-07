/** EduData IA — EIOS Governance Core — Workflow Engine 1.0 */

import type {
  EiosWorkflowSnapshot,
  EiosWorkflowState,
  EiosWorkflowTransition,
  EiosWorkflowTransitionRequest,
  EiosWorkflowValidationResult,
} from './workflow.types'

const TRANSITIONS: Record<EiosWorkflowState, EiosWorkflowState[]> = {
  draft: ['generated', 'archived'],
  generated: ['under_human_review', 'archived'],
  under_human_review: ['approved', 'rejected', 'archived'],
  approved: ['published', 'archived'],
  published: ['archived'],
  rejected: ['draft', 'archived'],
  archived: ['draft'],
}

export function validateEiosWorkflowTransition(
  request: EiosWorkflowTransitionRequest,
): EiosWorkflowValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const allowedTargets = TRANSITIONS[request.currentState]

  if (!request.resourceId.trim()) errors.push('resourceId é obrigatório.')
  if (!request.actorId.trim()) errors.push('actorId é obrigatório.')
  if (!request.correlationId.trim()) errors.push('correlationId é obrigatório.')

  if (!allowedTargets.includes(request.targetState)) {
    errors.push(
      `Transição ${request.currentState} → ${request.targetState} não permitida.`,
    )
  }

  const requiresHumanReview =
    request.requiresHumanReview ??
    request.targetState === 'under_human_review' ||
    request.targetState === 'approved' ||
    request.targetState === 'published'

  if (
    request.targetState === 'published' &&
    request.currentState !== 'approved'
  ) {
    errors.push('Publicação exige estado anterior aprovado.')
  }

  if (request.targetState === 'approved' && !request.reasonText?.trim()) {
    warnings.push('A aprovação deveria registrar justificativa humana explícita.')
  }

  return {
    allowed: errors.length === 0,
    requiresHumanReview,
    errors,
    warnings,
  }
}

export function createEiosWorkflowTransition(
  request: EiosWorkflowTransitionRequest,
): EiosWorkflowTransition {
  const validation = validateEiosWorkflowTransition(request)

  if (!validation.allowed) {
    throw new Error(validation.errors.join(' '))
  }

  const occurredAt = new Date().toISOString()
  const id = [
    'workflow',
    request.resourceType,
    request.resourceId,
    request.currentState,
    request.targetState,
    occurredAt,
  ].join(':')

  return {
    id,
    resourceType: request.resourceType,
    resourceId: request.resourceId,
    from: request.currentState,
    to: request.targetState,
    reason: request.reason,
    reasonText: request.reasonText ?? null,
    actorId: request.actorId,
    actorRole: request.actorRole ?? null,
    occurredAt,
    correlationId: request.correlationId,
    auditEventId: null,
    metadata: request.metadata ?? {},
  }
}

export function buildEiosWorkflowSnapshot(
  transition: EiosWorkflowTransition,
  requiresHumanReview = true,
): EiosWorkflowSnapshot {
  return {
    resourceType: transition.resourceType,
    resourceId: transition.resourceId,
    currentState: transition.to,
    previousState: transition.from,
    lastTransitionId: transition.id,
    updatedAt: transition.occurredAt,
    requiresHumanReview,
    approved: transition.to === 'approved' || transition.to === 'published',
    published: transition.to === 'published',
    archived: transition.to === 'archived',
  }
}

export function getWorkflowEngineInfo() {
  return {
    name: 'eios-governance-workflow-engine',
    version: '1.0.0',
    humanReviewPreserved: true,
    automaticPublicationProhibited: true,
  }
}
