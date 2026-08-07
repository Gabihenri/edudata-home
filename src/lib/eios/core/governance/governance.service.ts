/**
 * EduData IA — EIOS Governance Core
 * Governance Service 1.0
 *
 * Orquestra composição, persistência e leitura das trilhas compartilhadas
 * de auditoria, workflow, proveniência e decisão humana.
 */

import type {
  SupabaseClient,
} from '@supabase/supabase-js'

import {
  buildEiosGovernanceBundle,
  type BuildEiosGovernanceBundleInput,
  type EiosGovernanceBundle,
} from './governance.engine'

import {
  insertEiosAuditEvent,
  insertEiosWorkflowTransition,
  insertEiosProvenanceRecord,
  insertEiosDecisionRecord,
  listEiosGovernanceAudit,
  listEiosWorkflowTransitions,
  listEiosDecisionRecords,
  type EiosGovernanceScope,
} from './governance.repository'

export type PersistEiosGovernanceBundleInput = {
  client: SupabaseClient
  scope: EiosGovernanceScope
  governance: BuildEiosGovernanceBundleInput
}

export type PersistEiosGovernanceBundleResult = {
  success: boolean
  bundle: EiosGovernanceBundle
  persisted: {
    audit: boolean
    workflow: boolean
    provenance: boolean
    decision: boolean
  }
  generatedAt: string
}

export type EiosGovernanceOverview = {
  auditEvents: unknown[]
  workflowTransitions: unknown[]
  decisions: unknown[]
  totals: {
    auditEvents: number
    workflowTransitions: number
    decisions: number
  }
  generatedAt: string
}

export async function persistEiosGovernanceBundle(
  input: PersistEiosGovernanceBundleInput,
): Promise<PersistEiosGovernanceBundleResult> {
  const bundle =
    buildEiosGovernanceBundle(
      input.governance,
    )

  const persisted = {
    audit: false,
    workflow: false,
    provenance: false,
    decision: false,
  }

  await insertEiosAuditEvent({
    client: input.client,
    event: bundle.audit,
    scope: input.scope,
  })
  persisted.audit = true

  if (bundle.provenance) {
    await insertEiosProvenanceRecord({
      client: input.client,
      record: bundle.provenance,
      scope: input.scope,
    })
    persisted.provenance = true
  }

  if (bundle.workflow) {
    await insertEiosWorkflowTransition({
      client: input.client,
      transition:
        bundle.workflow.transition,
      requiresHumanReview:
        bundle.workflow.snapshot
          .requiresHumanReview,
      scope: input.scope,
    })
    persisted.workflow = true
  }

  if (bundle.decision) {
    await insertEiosDecisionRecord({
      client: input.client,
      record: bundle.decision,
      scope: input.scope,
    })
    persisted.decision = true
  }

  return {
    success: true,
    bundle,
    persisted,
    generatedAt:
      new Date().toISOString(),
  }
}

export async function getEiosGovernanceOverview({
  client,
  scope,
  limit = 50,
}: {
  client: SupabaseClient
  scope: EiosGovernanceScope
  limit?: number
}): Promise<EiosGovernanceOverview> {
  const options = {
    ...scope,
    limit,
  }

  const [
    auditEvents,
    workflowTransitions,
    decisions,
  ] = await Promise.all([
    listEiosGovernanceAudit({
      client,
      options,
    }),
    listEiosWorkflowTransitions({
      client,
      options,
    }),
    listEiosDecisionRecords({
      client,
      options,
    }),
  ])

  return {
    auditEvents,
    workflowTransitions,
    decisions,
    totals: {
      auditEvents:
        auditEvents.length,
      workflowTransitions:
        workflowTransitions.length,
      decisions:
        decisions.length,
    },
    generatedAt:
      new Date().toISOString(),
  }
}

export function getGovernanceServiceInfo() {
  return {
    name: 'eios-governance-service',
    version: '1.0.0',
    architecture: 'shared_core',
    guarantees: [
      'append_only_audit',
      'human_review_preserved',
      'product_independent_persistence',
      'single_governance_entrypoint',
    ],
  }
}
