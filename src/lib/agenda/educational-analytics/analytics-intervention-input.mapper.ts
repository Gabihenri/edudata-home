import type {
  GeneratePedagogicalInterventionInput,
  PedagogicalInterventionPriority,
  PedagogicalInterventionPrivacy,
  PedagogicalInterventionResearchEligibility,
} from '../evidence-intelligence/pedagogical-intervention.types'
import type { AnalyticsHumanDecisionRecord } from './analytics-human-decision.types'

export type AnalyticsInterventionMapperContext = {
  decision: AnalyticsHumanDecisionRecord
  organizationId?: string | null
  schoolId?: string | null
  requestedByUserId: string
  privacy: PedagogicalInterventionPrivacy
  researchEligibility?: Partial<PedagogicalInterventionResearchEligibility>
}

function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function numberValue(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function resolvePriority(snapshot: Record<string, unknown>): PedagogicalInterventionPriority {
  const variation = Math.abs(numberValue(snapshot.variationPercent) ?? 0)
  const outliers = numberValue(snapshot.outlierCount) ?? 0
  const trend = Math.abs(numberValue(snapshot.trend) ?? 0)
  if (variation >= 30 || outliers >= 5 || trend >= 1.5) return 'high'
  if (variation >= 15 || outliers >= 2 || trend >= 0.75) return 'moderate'
  return 'low'
}

export function mapAnalyticsDecisionToPedagogicalInterventionInput(
  context: AnalyticsInterventionMapperContext,
): GeneratePedagogicalInterventionInput {
  const snapshot = context.decision.evidenceSnapshot
  const variableLabel = text(snapshot.variableLabel) ?? 'Indicador analítico'
  const signalLabel = text(snapshot.signalLabel) ?? 'Sinal identificado pela análise educacional'
  const observations = numberValue(snapshot.observations)
  const mean = numberValue(snapshot.mean)
  const trend = numberValue(snapshot.trend)
  const variationPercent = numberValue(snapshot.variationPercent)
  const outlierCount = numberValue(snapshot.outlierCount)
  const rationale = context.decision.justification ?? 'Encaminhamento registrado após revisão humana do sinal analítico.'

  return {
    organizationId: context.organizationId ?? null,
    schoolId: context.schoolId ?? null,
    requestedByUserId: context.requestedByUserId,
    sourceProduct: 'edudata_analytics',
    context: {
      title: `Encaminhamento analítico: ${variableLabel}`,
      summary: `${signalLabel}. ${rationale}`,
      audience: {
        scope: 'school',
        targetType: 'school',
        targetIds: [],
        estimatedParticipants: null,
        groupId: null,
        groupLabel: null,
        selectionRationale: 'Encaminhamento originado por sinal agregado da EduData Analytics.',
        anonymized: true,
        aggregated: true,
      },
      links: {
        classIds: [], planningIds: [], lessonIds: [], learningObjectiveIds: [], skillIds: [], competencyIds: [], curriculumReferenceIds: [], evidenceIds: [], indicatorIds: [], assessmentIds: [], assessmentResultIds: [], relatedInterventionIds: [],
        additionalEntities: [{ entityType: 'indicator', entityId: context.decision.signalId, label: variableLabel, relationship: 'analytics_signal', sourceSystem: 'edudata_analytics', metadata: { decision_id: context.decision.id } }],
      },
      contextualFactors: ['Sinal identificado por análise estatística agregada.', 'Encaminhamento autorizado por decisão humana explícita.'],
      constraints: ['Não interpretar correlação como causalidade.', 'Não executar ações pedagógicas sem validação profissional.'],
      availableResources: [], previousActions: [], teacherObservations: [rationale],
    },
    diagnostic: {
      problemStatement: `${signalLabel}: ${variableLabel}.`,
      pedagogicalInterpretation: 'O resultado analítico deve ser interpretado no contexto pedagógico antes da definição das ações.',
      observedPatterns: [`${observations ?? 0} observações analisadas`, `Média: ${mean ?? 'não informada'}`, `Tendência: ${trend ?? 'não informada'}`, `Variação: ${variationPercent ?? 'não informada'}%`, `${outlierCount ?? 0} pontos atípicos`],
      strengths: [], learningGaps: [], inclusionBarriers: [], engagementFactors: [], probableCauses: [],
      sources: [{ sourceType: 'analytics', sourceId: context.decision.signalId, description: 'Snapshot analítico utilizado na decisão humana.', metadata: snapshot }, { sourceType: 'human_review', sourceId: context.decision.id, description: rationale }],
      risk: { level: 'undetermined', types: ['other'], summary: 'O Analytics identificou um sinal que requer contextualização humana.', signals: [signalLabel], protectiveFactors: [], aggravatingFactors: [], requiresImmediateHumanAttention: false, limitations: ['O sinal não estabelece causalidade nem substitui avaliação pedagógica.'] },
      requiresAdditionalEvidence: false, additionalEvidenceNeeded: [], assumptions: ['Os dados representam corretamente a janela analítica selecionada.'], limitations: ['A análise estatística isolada não determina a intervenção adequada.'],
    },
    preferredPriority: resolvePriority(snapshot), constraints: ['Preservar a decisão humana e a governança pedagógica.'], teacherPreferences: [], excludedApproaches: ['Intervenção automática sem revisão profissional.'], requiredMethodologies: [], requiredHumanReview: true,
    privacy: context.privacy,
    researchEligibility: context.researchEligibility,
    correlationId: `analytics-decision:${context.decision.id}`,
    metadata: { source: 'edudata_analytics', capability: 'educational_analytics', analytics_signal_id: context.decision.signalId, analytics_decision_id: context.decision.id, source_analysis_id: context.decision.sourceAnalysisId, evidence_snapshot: snapshot },
  }
}
