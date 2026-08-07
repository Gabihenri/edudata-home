import type {
  SupabaseClient,
} from '@supabase/supabase-js'

import type {
  EiosAuditEvent,
} from './audit/audit.types'
import type {
  EiosWorkflowTransition,
} from './workflow/workflow.types'
import type {
  EiosProvenanceRecord,
} from './provenance/provenance.types'
import type {
  EiosDecisionRecord,
} from './decision-registry/decision-registry.types'

export type EiosGovernanceScope = {
  userId: string
  organizationId?: string | null
  schoolId?: string | null
}

export type EiosGovernanceListOptions =
  EiosGovernanceScope & {
    limit?: number
  }

const AUDIT_TABLE =
  'eios_governance_audit_events'
const WORKFLOW_TABLE =
  'eios_governance_workflow_transitions'
const PROVENANCE_TABLE =
  'eios_governance_provenance_records'
const DECISION_TABLE =
  'eios_governance_decision_records'

const DEFAULT_LIMIT = 50
const MAX_LIMIT = 200

function normalizeRequiredText(
  value: string | null | undefined,
  fieldName: string,
): string {
  const normalized = value?.trim()

  if (!normalized) {
    throw new Error(`${fieldName} é obrigatório.`)
  }

  return normalized
}

function normalizeLimit(
  value: number | undefined,
): number {
  if (
    value === undefined ||
    !Number.isFinite(value)
  ) {
    return DEFAULT_LIMIT
  }

  return Math.min(
    MAX_LIMIT,
    Math.max(1, Math.trunc(value)),
  )
}

function scopeColumns(
  scope: EiosGovernanceScope,
) {
  return {
    user_id: normalizeRequiredText(
      scope.userId,
      'userId',
    ),
    organization_id:
      scope.organizationId?.trim() || null,
    school_id:
      scope.schoolId?.trim() || null,
  }
}

export async function insertEiosAuditEvent({
  client,
  event,
  scope,
}: {
  client: SupabaseClient
  event: EiosAuditEvent
  scope: EiosGovernanceScope
}) {
  const { data, error } =
    await client
      .from(AUDIT_TABLE)
      .insert({
        id: event.id,
        schema_version: event.schemaVersion,
        capability: event.capability,
        action: event.action,
        severity: event.severity,
        occurred_at: event.occurredAt,
        actor: event.actor,
        resource: event.resource,
        engine: event.engine ?? null,
        source_product:
          event.sourceProduct ?? null,
        framework_version:
          event.frameworkVersion ?? null,
        eios_version:
          event.eiosVersion ?? null,
        reason: event.reason ?? null,
        previous_state:
          event.previousState ?? null,
        new_state:
          event.newState ?? null,
        metadata: event.metadata,
        trace: event.trace,
        hash_algorithm:
          event.integrity.hashAlgorithm,
        previous_event_hash:
          event.integrity.previousEventHash ?? null,
        event_hash:
          event.integrity.eventHash,
        ...scopeColumns(scope),
      })
      .select('*')
      .single()

  if (error) {
    throw new Error(
      `Não foi possível persistir o evento de auditoria: ${error.message}`,
    )
  }

  return data
}

export async function insertEiosWorkflowTransition({
  client,
  transition,
  requiresHumanReview,
  scope,
}: {
  client: SupabaseClient
  transition: EiosWorkflowTransition
  requiresHumanReview: boolean
  scope: EiosGovernanceScope
}) {
  const { data, error } =
    await client
      .from(WORKFLOW_TABLE)
      .insert({
        id: transition.id,
        resource_type:
          transition.resourceType,
        resource_id:
          transition.resourceId,
        from_state: transition.from,
        to_state: transition.to,
        reason: transition.reason,
        reason_text:
          transition.reasonText ?? null,
        actor_id: transition.actorId,
        actor_role:
          transition.actorRole ?? null,
        occurred_at:
          transition.occurredAt,
        correlation_id:
          transition.correlationId,
        audit_event_id:
          transition.auditEventId ?? null,
        requires_human_review:
          requiresHumanReview,
        metadata: transition.metadata,
        ...scopeColumns(scope),
      })
      .select('*')
      .single()

  if (error) {
    throw new Error(
      `Não foi possível persistir a transição de workflow: ${error.message}`,
    )
  }

  return data
}

export async function insertEiosProvenanceRecord({
  client,
  record,
  scope,
}: {
  client: SupabaseClient
  record: EiosProvenanceRecord
  scope: EiosGovernanceScope
}) {
  const { data, error } =
    await client
      .from(PROVENANCE_TABLE)
      .insert({
        id: record.id,
        schema_version:
          record.schemaVersion,
        resource_type:
          record.resourceType,
        resource_id:
          record.resourceId,
        resource_version:
          record.resourceVersion ?? null,
        analysis_id:
          record.analysisId ?? null,
        run_id:
          record.runId ?? null,
        report_id:
          record.reportId ?? null,
        framework_version:
          record.frameworkVersion ?? null,
        eios_version:
          record.eiosVersion ?? null,
        source_product:
          record.sourceProduct ?? null,
        sources: record.sources,
        engines: record.engines,
        capabilities:
          record.capabilities,
        generated_by:
          record.generatedBy ?? null,
        generated_at:
          record.generatedAt,
        correlation_id:
          record.correlationId,
        parent_provenance_ids:
          record.parentProvenanceIds,
        hash_algorithm:
          record.integrity.hashAlgorithm,
        content_hash:
          record.integrity.contentHash,
        metadata: record.metadata,
        ...scopeColumns(scope),
      })
      .select('*')
      .single()

  if (error) {
    throw new Error(
      `Não foi possível persistir a proveniência: ${error.message}`,
    )
  }

  return data
}

export async function insertEiosDecisionRecord({
  client,
  record,
  scope,
}: {
  client: SupabaseClient
  record: EiosDecisionRecord
  scope: EiosGovernanceScope
}) {
  const { data, error } =
    await client
      .from(DECISION_TABLE)
      .insert({
        id: record.id,
        schema_version:
          record.schemaVersion,
        subject_type:
          record.subjectType,
        subject_id:
          record.subjectId,
        decision: record.decision,
        decided_by:
          record.decidedBy,
        decided_by_role:
          record.decidedByRole ?? null,
        decided_at:
          record.decidedAt,
        reason: record.reason,
        adapted_content:
          record.adaptedContent ?? null,
        evidence: record.evidence,
        analysis_id:
          record.analysisId ?? null,
        run_id:
          record.runId ?? null,
        recommendation_id:
          record.recommendationId ?? null,
        intervention_id:
          record.interventionId ?? null,
        correlation_id:
          record.correlationId,
        audit_event_id:
          record.auditEventId ?? null,
        provenance_id:
          record.provenanceId ?? null,
        outcome: record.outcome,
        metadata: record.metadata,
        ...scopeColumns(scope),
      })
      .select('*')
      .single()

  if (error) {
    throw new Error(
      `Não foi possível persistir a decisão humana: ${error.message}`,
    )
  }

  return data
}

export async function listEiosGovernanceAudit({
  client,
  options,
}: {
  client: SupabaseClient
  options: EiosGovernanceListOptions
}) {
  let query = client
    .from(AUDIT_TABLE)
    .select('*')
    .eq(
      'user_id',
      normalizeRequiredText(
        options.userId,
        'userId',
      ),
    )
    .order('occurred_at', {
      ascending: false,
    })
    .limit(normalizeLimit(options.limit))

  if (options.organizationId?.trim()) {
    query = query.eq(
      'organization_id',
      options.organizationId.trim(),
    )
  }

  if (options.schoolId?.trim()) {
    query = query.eq(
      'school_id',
      options.schoolId.trim(),
    )
  }

  const { data, error } = await query

  if (error) {
    throw new Error(
      `Não foi possível consultar a auditoria do EIOS: ${error.message}`,
    )
  }

  return data ?? []
}

export async function listEiosWorkflowTransitions({
  client,
  options,
}: {
  client: SupabaseClient
  options: EiosGovernanceListOptions
}) {
  const { data, error } =
    await client
      .from(WORKFLOW_TABLE)
      .select('*')
      .eq(
        'user_id',
        normalizeRequiredText(
          options.userId,
          'userId',
        ),
      )
      .order('occurred_at', {
        ascending: false,
      })
      .limit(normalizeLimit(options.limit))

  if (error) {
    throw new Error(
      `Não foi possível consultar o workflow do EIOS: ${error.message}`,
    )
  }

  return data ?? []
}

export async function listEiosDecisionRecords({
  client,
  options,
}: {
  client: SupabaseClient
  options: EiosGovernanceListOptions
}) {
  const { data, error } =
    await client
      .from(DECISION_TABLE)
      .select('*')
      .eq(
        'user_id',
        normalizeRequiredText(
          options.userId,
          'userId',
        ),
      )
      .order('decided_at', {
        ascending: false,
      })
      .limit(normalizeLimit(options.limit))

  if (error) {
    throw new Error(
      `Não foi possível consultar as decisões do EIOS: ${error.message}`,
    )
  }

  return data ?? []
}
