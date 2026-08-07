/**
 * EduData IA — EIOS Governance Core
 * Governance Facade 1.0
 *
 * Entrada única para composição de auditoria, workflow, proveniência e decisão humana.
 */

import {
  createEiosAuditEvent,
} from './audit/audit.engine'
import type {
  CreateEiosAuditEventInput,
  EiosAuditEvent,
} from './audit/audit.types'
import {
  createEiosWorkflowTransition,
  buildEiosWorkflowSnapshot,
} from './workflow/workflow.engine'
import type {
  EiosWorkflowSnapshot,
  EiosWorkflowTransition,
  EiosWorkflowTransitionRequest,
} from './workflow/workflow.types'
import {
  createEiosProvenanceRecord,
} from './provenance/provenance.engine'
import type {
  CreateEiosProvenanceInput,
  EiosProvenanceRecord,
} from './provenance/provenance.types'
import {
  createEiosDecisionRecord,
} from './decision-registry/decision-registry.engine'
import type {
  CreateEiosDecisionInput,
  EiosDecisionRecord,
} from './decision-registry/decision-registry.types'

export type EiosGovernanceBundle = {
  audit: EiosAuditEvent
  workflow?: {
    transition: EiosWorkflowTransition
    snapshot: EiosWorkflowSnapshot
  } | null
  provenance?: EiosProvenanceRecord | null
  decision?: EiosDecisionRecord | null
  generatedAt: string
}

export type BuildEiosGovernanceBundleInput = {
  audit: CreateEiosAuditEventInput
  workflow?: EiosWorkflowTransitionRequest | null
  provenance?: CreateEiosProvenanceInput | null
  decision?: CreateEiosDecisionInput | null
}

export function buildEiosGovernanceBundle(
  input: BuildEiosGovernanceBundleInput,
): EiosGovernanceBundle {
  const audit = createEiosAuditEvent(input.audit)

  const workflow = input.workflow
    ? (() => {
        const transition = createEiosWorkflowTransition(input.workflow)
        return {
          transition: {
            ...transition,
            auditEventId: audit.id,
          },
          snapshot: buildEiosWorkflowSnapshot(
            transition,
            input.workflow?.requiresHumanReview ?? true,
          ),
        }
      })()
    : null

  const provenance = input.provenance
    ? createEiosProvenanceRecord(input.provenance)
    : null

  const decision = input.decision
    ? createEiosDecisionRecord({
        ...input.decision,
        auditEventId: input.decision.auditEventId ?? audit.id,
        provenanceId:
          input.decision.provenanceId ?? provenance?.id ?? null,
      })
    : null

  return {
    audit,
    workflow,
    provenance,
    decision,
    generatedAt: new Date().toISOString(),
  }
}

export function getGovernanceCoreInfo() {
  return {
    name: 'eios-governance-core',
    version: '1.0.0',
    architecture: 'shared_core',
    modules: [
      'audit',
      'workflow',
      'provenance',
      'decision_registry',
    ],
    guarantees: [
      'human_review_preserved',
      'no_automatic_publication',
      'traceability_by_default',
      'deterministic_integrity_hashes',
      'product_independent_contracts',
    ],
  }
}
