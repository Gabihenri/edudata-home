import type {
  AnalyticsHumanDecisionInput,
  AnalyticsHumanDecisionRecord,
} from './analytics-human-decision.types'

export type AnalyticsInterventionIntegrationContext = {
  decision: AnalyticsHumanDecisionRecord
  signal: {
    id: string
    label: string
  }
  evidenceSnapshot: Record<string, unknown>
}

export type AnalyticsInterventionIntegrationResult = {
  shouldCreateIntervention: boolean
  source: 'edudata_analytics'
  decisionId: string
  interventionId: string | null
}

/**
 * Define the governed boundary between Analytics and the official
 * Pedagogical Interventions domain. Analytics never creates an intervention
 * without an explicit human decision.
 */
export function prepareAnalyticsInterventionIntegration(
  context: AnalyticsInterventionIntegrationContext,
): AnalyticsInterventionIntegrationResult {
  const shouldCreateIntervention = context.decision.status === 'forwarded'

  return {
    shouldCreateIntervention,
    source: 'edudata_analytics',
    decisionId: context.decision.id,
    interventionId: context.decision.interventionId,
  }
}

export function buildAnalyticsInterventionMetadata(
  input: AnalyticsHumanDecisionInput,
): Record<string, unknown> {
  return {
    source: 'edudata_analytics',
    signal_id: input.signalId,
    source_analysis_id: input.sourceAnalysisId ?? null,
    human_decision_status: input.status,
    evidence_snapshot: input.evidenceSnapshot,
  }
}
