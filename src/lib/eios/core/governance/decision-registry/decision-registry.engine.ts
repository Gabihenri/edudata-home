/** EduData IA — EIOS Governance Core — Decision Registry Engine 1.0 */

import type {
  CreateEiosDecisionInput,
  EiosDecisionRecord,
} from './decision-registry.types'

function normalizeRequired(value: string, field: string): string {
  const normalized = value.trim()
  if (!normalized) throw new Error(`${field} é obrigatório.`)
  return normalized
}

function stableId(parts: string[]): string {
  let hash = 2166136261
  const value = parts.join('|')

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return `decision-${(hash >>> 0).toString(16).padStart(8, '0')}`
}

export function createEiosDecisionRecord(
  input: CreateEiosDecisionInput,
): EiosDecisionRecord {
  const decidedAt = input.decidedAt ?? new Date().toISOString()
  const subjectId = normalizeRequired(input.subjectId, 'subjectId')
  const decidedBy = normalizeRequired(input.decidedBy, 'decidedBy')
  const reason = normalizeRequired(input.reason, 'reason')
  const correlationId = normalizeRequired(input.correlationId, 'correlationId')

  return {
    id: stableId([
      input.subjectType,
      subjectId,
      input.decision,
      decidedBy,
      decidedAt,
      correlationId,
    ]),
    schemaVersion: '1.0.0',
    subjectType: input.subjectType,
    subjectId,
    decision: input.decision,
    decidedBy,
    decidedByRole: input.decidedByRole ?? null,
    decidedAt,
    reason,
    adaptedContent: input.adaptedContent ?? null,
    evidence: input.evidence ?? [],
    analysisId: input.analysisId ?? null,
    runId: input.runId ?? null,
    recommendationId: input.recommendationId ?? null,
    interventionId: input.interventionId ?? null,
    correlationId,
    auditEventId: input.auditEventId ?? null,
    provenanceId: input.provenanceId ?? null,
    outcome: {
      observed: false,
      status: 'pending',
      observedAt: null,
      summary: null,
      metricChanges: {},
    },
    metadata: input.metadata ?? {},
  }
}

export function registerEiosDecisionOutcome(
  record: EiosDecisionRecord,
  outcome: EiosDecisionRecord['outcome'],
): EiosDecisionRecord {
  return {
    ...record,
    outcome: {
      ...outcome,
      observed: true,
      observedAt: outcome.observedAt ?? new Date().toISOString(),
    },
  }
}

export function getDecisionRegistryEngineInfo() {
  return {
    name: 'eios-governance-decision-registry-engine',
    version: '1.0.0',
    humanDecisionRequired: true,
    outcomeTracking: true,
  }
}
