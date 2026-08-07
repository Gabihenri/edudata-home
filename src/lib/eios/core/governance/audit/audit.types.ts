/**
 * EduData IA — EIOS Governance Core
 * Audit Contract 1.0
 *
 * Contrato compartilhado de auditoria para capabilities e produtos do EIOS.
 * Não depende de React, Next.js, Supabase ou produto específico.
 */

export type EiosAuditCapability =
  | 'evidence_intelligence'
  | 'pedagogical_copilot'
  | 'educational_analytics'
  | 'learning_graph'
  | 'organizational_intelligence'
  | 'research_intelligence'
  | 'semantic_core'
  | 'governance_core'
  | 'compliance_core'
  | 'identity_core'
  | 'graph_core'
  | 'integration_core'
  | 'observability_core'
  | 'custom'

export type EiosAuditAction =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'generate'
  | 'analyze'
  | 'recommend'
  | 'review'
  | 'approve'
  | 'reject'
  | 'publish'
  | 'archive'
  | 'restore'
  | 'export'
  | 'share'
  | 'execute'
  | 'transition'
  | 'custom'

export type EiosAuditSeverity =
  | 'info'
  | 'warning'
  | 'critical'

export type EiosAuditActorType =
  | 'user'
  | 'service'
  | 'engine'
  | 'system'

export type EiosAuditResourceType =
  | 'analysis'
  | 'evidence'
  | 'intervention'
  | 'recommendation'
  | 'report'
  | 'export'
  | 'workflow'
  | 'decision'
  | 'graph_node'
  | 'graph_edge'
  | 'dataset'
  | 'policy'
  | 'custom'

export type EiosAuditJson =
  | null
  | boolean
  | number
  | string
  | EiosAuditJson[]
  | { [key: string]: EiosAuditJson }

export type EiosAuditActor = {
  type: EiosAuditActorType
  id: string
  displayName?: string | null
  role?: string | null
  organizationId?: string | null
  schoolId?: string | null
}

export type EiosAuditResource = {
  type: EiosAuditResourceType
  id: string
  parentId?: string | null
  analysisId?: string | null
  runId?: string | null
  reportId?: string | null
}

export type EiosAuditEngineReference = {
  name: string
  version: string
  rulesetVersion?: string | null
}

export type EiosAuditTrace = {
  eventId: string
  correlationId: string
  causationId?: string | null
  requestId?: string | null
  sessionId?: string | null
  traceId?: string | null
}

export type EiosAuditEvent = {
  id: string
  schemaVersion: '1.0.0'
  capability: EiosAuditCapability
  action: EiosAuditAction
  severity: EiosAuditSeverity
  occurredAt: string
  actor: EiosAuditActor
  resource: EiosAuditResource
  engine?: EiosAuditEngineReference | null
  sourceProduct?: string | null
  frameworkVersion?: string | null
  eiosVersion?: string | null
  reason?: string | null
  previousState?: EiosAuditJson
  newState?: EiosAuditJson
  metadata: Record<string, EiosAuditJson>
  trace: EiosAuditTrace
  integrity: {
    hashAlgorithm: 'fnv1a32'
    previousEventHash?: string | null
    eventHash: string
  }
}

export type CreateEiosAuditEventInput = {
  capability: EiosAuditCapability
  action: EiosAuditAction
  severity?: EiosAuditSeverity
  occurredAt?: string
  actor: EiosAuditActor
  resource: EiosAuditResource
  engine?: EiosAuditEngineReference | null
  sourceProduct?: string | null
  frameworkVersion?: string | null
  eiosVersion?: string | null
  reason?: string | null
  previousState?: EiosAuditJson
  newState?: EiosAuditJson
  metadata?: Record<string, EiosAuditJson>
  correlationId: string
  causationId?: string | null
  requestId?: string | null
  sessionId?: string | null
  traceId?: string | null
  previousEventHash?: string | null
}

export type EiosAuditChainValidation = {
  valid: boolean
  totalEvents: number
  firstInvalidEventId: string | null
  errors: string[]
  validatedAt: string
}
