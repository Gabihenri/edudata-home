/**
 * EduData IA — EIOS
 * Capability 04.10: Recommendation Engine
 *
 * Motor determinístico de recomendações educacionais explicáveis.
 *
 * Responsabilidades:
 * - transformar sinais analíticos em propostas de ação revisáveis;
 * - combinar anomalias, padrões, influência e previsões;
 * - tratar correlações apenas como evidência associativa;
 * - preservar decisão docente, revisão humana e autonomia profissional;
 * - impedir execução automática de ações pedagógicas.
 *
 * Limitações:
 * - não substitui julgamento profissional;
 * - não infere causalidade;
 * - não executa intervenções;
 * - não acessa banco de dados;
 * - não aplica RLS.
 */

import type {
  AnalyticsAnomalyResult,
  AnalyticsConfidence,
  AnalyticsCorrelationResult,
  AnalyticsExplainability,
  AnalyticsInfluenceResult,
  AnalyticsMetadata,
  AnalyticsPatternResult,
  AnalyticsPredictionResult,
  AnalyticsRecommendationAction,
  AnalyticsRecommendationResult,
  AnalyticsRecommendationType,
  AnalyticsRiskLevel,
  AnalyticsSeverity,
  AnalyticsTimestamp,
} from './analytics.types'

const ENGINE_NAME =
  'eios-recommendation-engine'

const ENGINE_VERSION =
  '1.0.0'

const RULESET_VERSION =
  'recommendation-ruleset-1.0.0'

const DEFAULT_MAX_RECOMMENDATIONS =
  20

export type RecommendationEngineInput = {
  correlations?: AnalyticsCorrelationResult[]
  patterns?: AnalyticsPatternResult[]
  anomalies?: AnalyticsAnomalyResult[]
  influences?: AnalyticsInfluenceResult[]
  predictions?: AnalyticsPredictionResult[]
  sourceInterventionIds?: string[]
  requestedByUserId?: string | null
  correlationId: string
  minimumConfidence?: number
  maxRecommendations?: number
  metadata?: AnalyticsMetadata
}

export type RecommendationEngineResult = {
  success: boolean
  recommendations: AnalyticsRecommendationResult[]
  warnings: string[]
  errors: string[]
  generatedAt: AnalyticsTimestamp
  correlationId: string
  metadata: AnalyticsMetadata
}

type RecommendationCandidate = {
  type: AnalyticsRecommendationType
  title: string
  summary: string
  rationale: string
  priority:
    | 'low'
    | 'moderate'
    | 'high'
    | 'urgent'
    | 'critical'
  riskLevel: AnalyticsRiskLevel
  targetEntityIds: string[]
  sourceCorrelationIds: string[]
  sourcePatternIds: string[]
  sourceInfluenceIds: string[]
  sourcePredictionIds: string[]
  confidence: AnalyticsConfidence
  actionTitle: string
  actionDescription: string
  limitations: string[]
  reasons: string[]
  variablesUsed: string[]
  metadata: AnalyticsMetadata
}

function nowIso(): AnalyticsTimestamp {
  return new Date().toISOString()
}

function clamp(
  value: number,
  minimum = 0,
  maximum = 1,
): number {
  return Math.min(
    maximum,
    Math.max(minimum, value),
  )
}

function uniqueStrings(
  values: Array<string | null | undefined>,
): string[] {
  return Array.from(
    new Set(
      values
        .filter(
          (value): value is string =>
            typeof value === 'string',
        )
        .map(value => value.trim())
        .filter(Boolean),
    ),
  )
}

function createStableHash(value: string): string {
  let hash = 2166136261

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return (hash >>> 0)
    .toString(16)
    .padStart(8, '0')
}

function createStableId(
  prefix: string,
  value: string,
): string {
  return `${prefix}-${createStableHash(value)}`
}

function severityToRisk(
  severity: AnalyticsSeverity,
): AnalyticsRiskLevel {
  switch (severity) {
    case 'critical':
      return 'critical'
    case 'high':
      return 'high'
    case 'moderate':
      return 'moderate'
    case 'low':
      return 'low'
    default:
      return 'none'
  }
}

function riskToPriority(
  risk: AnalyticsRiskLevel,
): RecommendationCandidate['priority'] {
  switch (risk) {
    case 'critical':
      return 'critical'
    case 'high':
      return 'urgent'
    case 'moderate':
      return 'high'
    case 'low':
      return 'moderate'
    default:
      return 'low'
  }
}

function confidenceValue(
  confidence: AnalyticsConfidence,
): number {
  return clamp(
    confidence.value ?? 0,
  )
}

function createConfidence({
  value,
  sampleSize,
  explanation,
  method,
}: {
  value: number
  sampleSize: number | null
  explanation: string
  method: string
}): AnalyticsConfidence {
  const normalized = clamp(value)

  return {
    value: normalized,
    level:
      normalized >= 0.85
        ? 'very_high'
        : normalized >= 0.7
          ? 'high'
          : normalized >= 0.5
            ? 'moderate'
            : normalized >= 0.3
              ? 'low'
              : 'very_low',
    evidenceStrength:
      normalized >= 0.85
        ? 'very_strong'
        : normalized >= 0.7
          ? 'strong'
          : normalized >= 0.5
            ? 'moderate'
            : normalized >= 0.3
              ? 'weak'
              : 'insufficient',
    sampleSize,
    explanation,
    method,
    calculatedAt: nowIso(),
    requiresHumanReview: true,
    metadata: {
      engineName: ENGINE_NAME,
      engineVersion: ENGINE_VERSION,
    },
  }
}

function createExplainability({
  candidate,
  generatedAt,
}: {
  candidate: RecommendationCandidate
  generatedAt: AnalyticsTimestamp
}): AnalyticsExplainability {
  return {
    summary:
      'Recomendação gerada a partir de sinais analíticos e sujeita à decisão profissional.',
    reasons: candidate.reasons,
    rulesApplied: [
      'human_review_required',
      'professional_autonomy_preserved',
      'association_is_not_causation',
      'recommendation_is_not_automatic_action',
      'risk_priority_mapping',
    ],
    variablesUsed:
      uniqueStrings(candidate.variablesUsed),
    sourceReferences: [],
    assumptions: [
      'Os sinais de entrada foram produzidos por motores analíticos autorizados.',
      'A recomendação deve ser contextualizada pelo profissional responsável.',
    ],
    limitations: candidate.limitations,
    uncertaintyFactors: [
      'Qualidade, cobertura e temporalidade dos dados podem alterar a interpretação.',
      'Associações observadas podem possuir explicações alternativas.',
    ],
    alternativeExplanations: [
      'Mudanças podem decorrer de fatores pedagógicos, contextuais ou externos não representados nos dados.',
    ],
    causalityStatus: 'association_only',
    generatedAt,
    engineName: ENGINE_NAME,
    engineVersion: ENGINE_VERSION,
    metadata: {
      rulesetVersion: RULESET_VERSION,
    },
  }
}

function createAction({
  candidate,
  recommendationId,
}: {
  candidate: RecommendationCandidate
  recommendationId: string
}): AnalyticsRecommendationAction {
  return {
    id: `${recommendationId}-action-1`,
    title: candidate.actionTitle,
    description: candidate.actionDescription,
    sequence: 1,
    responsibleRole: 'teacher',
    plannedStartAt: null,
    plannedEndAt: null,
    expectedEvidenceIds: [],
    indicatorIds: [],
    successCriterionIds: [],
    requiresTeacherDecision: true,
    metadata: {
      engineName: ENGINE_NAME,
    },
  }
}

function candidateFromAnomaly(
  anomaly: AnalyticsAnomalyResult,
): RecommendationCandidate {
  const riskLevel =
    severityToRisk(anomaly.severity)

  return {
    type:
      anomaly.type === 'data_quality'
        ? 'data_quality'
        : riskLevel === 'high' ||
            riskLevel === 'critical'
          ? 'corrective'
          : 'monitoring',
    title:
      anomaly.type === 'data_quality'
        ? 'Revisar qualidade dos dados antes de decidir'
        : 'Revisar ocorrência atípica identificada',
    summary:
      anomaly.entityId
        ? `Foi identificada uma ocorrência atípica relacionada à entidade ${anomaly.entityId}.`
        : 'Foi identificada uma ocorrência atípica que exige contextualização profissional.',
    rationale:
      anomaly.possibleExplanations.length > 0
        ? anomaly.possibleExplanations.join(' ')
        : 'A magnitude do desvio justifica verificação contextual antes de qualquer ação.',
    priority: riskToPriority(riskLevel),
    riskLevel,
    targetEntityIds:
      anomaly.entityId
        ? [anomaly.entityId]
        : [],
    sourceCorrelationIds: [],
    sourcePatternIds: [],
    sourceInfluenceIds: [],
    sourcePredictionIds: [],
    confidence: anomaly.confidence,
    actionTitle:
      'Verificar contexto e evidências associadas',
    actionDescription:
      'Revisar registros, evidências e contexto pedagógico relacionados ao desvio antes de decidir por intervenção.',
    limitations: [
      'Anomalia estatística não representa problema pedagógico por si só.',
      'O evento pode ser legítimo, contextual ou decorrente da qualidade dos dados.',
    ],
    reasons: [
      `Tipo de anomalia: ${anomaly.type}.`,
      `Severidade: ${anomaly.severity}.`,
    ],
    variablesUsed:
      anomaly.variableId
        ? [anomaly.variableId]
        : [],
    metadata: {
      source: 'anomaly',
      anomalyId: anomaly.id,
    },
  }
}

function candidateFromPrediction(
  prediction: AnalyticsPredictionResult,
): RecommendationCandidate {
  const risk =
    prediction.riskLevel

  const isLearningRisk = [
    'learning_regression',
    'learning_gap',
    'intervention_need',
  ].includes(prediction.type)

  return {
    type:
      isLearningRisk
        ? 'preventive'
        : 'monitoring',
    title:
      isLearningRisk
        ? 'Planejar verificação preventiva do risco projetado'
        : 'Acompanhar projeção analítica',
    summary:
      `A projeção ${prediction.type} para ${prediction.subjectEntityId} requer acompanhamento humano.`,
    rationale:
      prediction.explanation.summary,
    priority: riskToPriority(risk),
    riskLevel: risk,
    targetEntityIds: [
      prediction.subjectEntityId,
    ],
    sourceCorrelationIds: [],
    sourcePatternIds: [],
    sourceInfluenceIds: [],
    sourcePredictionIds: [
      prediction.id,
    ],
    confidence: prediction.confidence,
    actionTitle:
      'Validar a projeção com evidências recentes',
    actionDescription:
      'Confrontar a projeção com registros recentes, contexto da turma e evidências pedagógicas antes de definir qualquer intervenção.',
    limitations: [
      ...prediction.limitations,
      'Uma projeção não determina o resultado futuro.',
    ],
    reasons: [
      `Tipo de previsão: ${prediction.type}.`,
      `Nível de risco: ${prediction.riskLevel}.`,
      `Horizonte: ${prediction.predictionHorizon ?? 'não informado'} ${prediction.predictionHorizonUnit ?? ''}.`.trim(),
    ],
    variablesUsed:
      prediction.inputVariableIds,
    metadata: {
      source: 'prediction',
      predictionId: prediction.id,
    },
  }
}

function candidateFromPattern(
  pattern: AnalyticsPatternResult,
): RecommendationCandidate | null {
  const confidence =
    confidenceValue(pattern.confidence)

  if (confidence < 0.3) {
    return null
  }

  const isRegression =
    pattern.type === 'learning_regression'

  const isExternal =
    pattern.type === 'external_event_response'

  const type:
    AnalyticsRecommendationType =
    isRegression
      ? 'recomposition'
      : isExternal
        ? 'monitoring'
        : 'pedagogical'

  return {
    type,
    title:
      isRegression
        ? 'Avaliar necessidade de recomposição de aprendizagem'
        : isExternal
          ? 'Acompanhar reorganização após evento externo'
          : 'Revisar padrão educacional recorrente',
    summary: pattern.description,
    rationale:
      'O padrão apresenta recorrência ou direção suficiente para justificar análise pedagógica contextualizada.',
    priority:
      isRegression
        ? 'high'
        : 'moderate',
    riskLevel:
      isRegression
        ? 'moderate'
        : 'low',
    targetEntityIds:
      pattern.entityIds,
    sourceCorrelationIds: [],
    sourcePatternIds: [
      pattern.id,
    ],
    sourceInfluenceIds: [],
    sourcePredictionIds: [],
    confidence: pattern.confidence,
    actionTitle:
      isRegression
        ? 'Revisar objetivos e evidências de aprendizagem'
        : 'Comparar o padrão com o planejamento e o contexto',
    actionDescription:
      isRegression
        ? 'Verificar habilidades, objetivos, evidências e evolução recente para decidir se há necessidade de recomposição.'
        : 'Confrontar o padrão identificado com planejamento, registros de aula e evidências antes de propor mudança pedagógica.',
    limitations: [
      'Padrões detectados são descritivos e não demonstram causa.',
      'A interpretação depende do contexto pedagógico e temporal.',
    ],
    reasons: [
      `Padrão identificado: ${pattern.type}.`,
      `Direção: ${pattern.direction}.`,
    ],
    variablesUsed:
      pattern.variableIds,
    metadata: {
      source: 'pattern',
      patternId: pattern.id,
    },
  }
}

function candidateFromInfluence(
  influence: AnalyticsInfluenceResult,
): RecommendationCandidate | null {
  const score =
    influence.influenceScore ?? 0

  if (score < 0.3) {
    return null
  }

  return {
    type: 'monitoring',
    title:
      'Revisar zona ou relação de influência identificada',
    summary:
      `A análise estrutural indicou influência associativa envolvendo ${influence.affectedEntityCount} entidade(s).`,
    rationale:
      influence.explanation.summary,
    priority:
      score >= 0.8
        ? 'high'
        : score >= 0.6
          ? 'moderate'
          : 'low',
    riskLevel:
      score >= 0.8
        ? 'moderate'
        : 'low',
    targetEntityIds:
      uniqueStrings([
        influence.sourceEntityId,
        ...influence.targetEntityIds,
      ]),
    sourceCorrelationIds:
      influence.supportingCorrelationIds,
    sourcePatternIds:
      influence.supportingPatternIds,
    sourceInfluenceIds: [
      influence.id,
    ],
    sourcePredictionIds: [],
    confidence: influence.confidence,
    actionTitle:
      'Validar a relação no contexto real da turma',
    actionDescription:
      'Observar o contexto, revisar evidências e verificar se a estrutura identificada possui relevância pedagógica antes de agir.',
    limitations: [
      ...influence.warnings,
      'Influência estrutural representa associação, não transmissão causal.',
    ],
    reasons: [
      `Tipo de influência: ${influence.type}.`,
      `Entidades afetadas: ${influence.affectedEntityCount}.`,
    ],
    variablesUsed: [],
    metadata: {
      source: 'influence',
      influenceId: influence.id,
    },
  }
}

function candidateFromCorrelation(
  correlation: AnalyticsCorrelationResult,
): RecommendationCandidate | null {
  if (
    ![
      'strong',
      'very_strong',
    ].includes(correlation.strength) ||
    confidenceValue(correlation.confidence) < 0.5
  ) {
    return null
  }

  return {
    type: 'research',
    title:
      'Investigar associação estatística relevante',
    summary:
      `Foi observada associação ${correlation.strength} entre ${correlation.variableXId} e ${correlation.variableYId}.`,
    rationale:
      'A associação merece investigação adicional, mas não autoriza concluir causalidade nem definir intervenção automática.',
    priority: 'low',
    riskLevel: 'none',
    targetEntityIds: [],
    sourceCorrelationIds: [
      correlation.id,
    ],
    sourcePatternIds: [],
    sourceInfluenceIds: [],
    sourcePredictionIds: [],
    confidence: correlation.confidence,
    actionTitle:
      'Formular pergunta investigativa e revisar contexto',
    actionDescription:
      'Comparar a associação com evidências, períodos, subgrupos e explicações alternativas antes de utilizá-la em qualquer decisão.',
    limitations: [
      'Correlação não implica causalidade.',
      'A associação pode refletir variáveis de confusão ou coincidência contextual.',
    ],
    reasons: [
      `Método: ${correlation.method}.`,
      `Força: ${correlation.strength}.`,
      `Coeficiente: ${correlation.coefficient ?? 'indeterminado'}.`,
    ],
    variablesUsed: [
      correlation.variableXId,
      correlation.variableYId,
    ],
    metadata: {
      source: 'correlation',
      correlationResultId:
        correlation.id,
    },
  }
}

function buildRecommendation({
  candidate,
  correlationId,
  sourceInterventionIds,
  generatedAt,
  index,
}: {
  candidate: RecommendationCandidate
  correlationId: string
  sourceInterventionIds: string[]
  generatedAt: AnalyticsTimestamp
  index: number
}): AnalyticsRecommendationResult {
  const id =
    createStableId(
      'recommendation',
      `${correlationId}:${candidate.type}:${candidate.title}:${candidate.targetEntityIds.join(',')}:${index}`,
    )

  return {
    id,
    type: candidate.type,
    title: candidate.title,
    summary: candidate.summary,
    rationale: candidate.rationale,
    priority: candidate.priority,
    riskLevel: candidate.riskLevel,
    targetEntityIds:
      uniqueStrings(candidate.targetEntityIds),
    sourceCorrelationIds:
      uniqueStrings(candidate.sourceCorrelationIds),
    sourcePatternIds:
      uniqueStrings(candidate.sourcePatternIds),
    sourceInfluenceIds:
      uniqueStrings(candidate.sourceInfluenceIds),
    sourcePredictionIds:
      uniqueStrings(candidate.sourcePredictionIds),
    sourceInterventionIds:
      uniqueStrings(sourceInterventionIds),
    actions: [
      createAction({
        candidate,
        recommendationId: id,
      }),
    ],
    confidence:
      createConfidence({
        value:
          confidenceValue(candidate.confidence),
        sampleSize:
          candidate.confidence.sampleSize,
        explanation:
          candidate.confidence.explanation ??
          'Confiança herdada do sinal analítico de origem.',
        method:
          'source_signal_confidence',
      }),
    teacherDecision: 'pending',
    teacherDecisionRationale: null,
    teacherDecidedAt: null,
    teacherDecidedBy: null,
    requiresHumanReview: true,
    explanation:
      createExplainability({
        candidate,
        generatedAt,
      }),
    limitations: candidate.limitations,
    metadata: {
      ...candidate.metadata,
      engineName: ENGINE_NAME,
      engineVersion: ENGINE_VERSION,
      rulesetVersion: RULESET_VERSION,
      generatedAt,
    },
  }
}

function candidateScore(
  candidate: RecommendationCandidate,
): number {
  const priorityWeight:
    Record<
      RecommendationCandidate['priority'],
      number
    > = {
      low: 0.1,
      moderate: 0.3,
      high: 0.6,
      urgent: 0.8,
      critical: 1,
    }

  return (
    priorityWeight[candidate.priority] * 0.6 +
    confidenceValue(candidate.confidence) * 0.4
  )
}

export function runRecommendationEngine(
  input: RecommendationEngineInput,
): RecommendationEngineResult {
  const generatedAt = nowIso()
  const warnings: string[] = []
  const errors: string[] = []

  try {
    const correlationId =
      input.correlationId?.trim()

    if (!correlationId) {
      throw new Error(
        'correlationId é obrigatório.',
      )
    }

    const minimumConfidence =
      clamp(
        input.minimumConfidence ?? 0.3,
      )

    const maxRecommendations =
      Math.max(
        1,
        Math.floor(
          input.maxRecommendations ??
          DEFAULT_MAX_RECOMMENDATIONS,
        ),
      )

    const candidates:
      RecommendationCandidate[] = []

    for (const anomaly of input.anomalies ?? []) {
      candidates.push(
        candidateFromAnomaly(anomaly),
      )
    }

    for (const prediction of input.predictions ?? []) {
      candidates.push(
        candidateFromPrediction(prediction),
      )
    }

    for (const pattern of input.patterns ?? []) {
      const candidate =
        candidateFromPattern(pattern)

      if (candidate) {
        candidates.push(candidate)
      }
    }

    for (const influence of input.influences ?? []) {
      const candidate =
        candidateFromInfluence(influence)

      if (candidate) {
        candidates.push(candidate)
      }
    }

    for (const correlation of input.correlations ?? []) {
      const candidate =
        candidateFromCorrelation(correlation)

      if (candidate) {
        candidates.push(candidate)
      }
    }

    const eligible =
      candidates
        .filter(
          candidate =>
            confidenceValue(
              candidate.confidence,
            ) >= minimumConfidence,
        )
        .sort(
          (a, b) =>
            candidateScore(b) -
            candidateScore(a),
        )
        .slice(0, maxRecommendations)

    if (eligible.length === 0) {
      warnings.push(
        'Nenhum sinal analítico atingiu os critérios mínimos para recomendação.',
      )
    }

    const recommendations =
      eligible.map(
        (candidate, index) =>
          buildRecommendation({
            candidate,
            correlationId,
            sourceInterventionIds:
              input.sourceInterventionIds ?? [],
            generatedAt,
            index,
          }),
      )

    return {
      success: true,
      recommendations,
      warnings:
        uniqueStrings(warnings),
      errors: [],
      generatedAt,
      correlationId,
      metadata: {
        ...(input.metadata ?? {}),
        engineName: ENGINE_NAME,
        engineVersion: ENGINE_VERSION,
        rulesetVersion: RULESET_VERSION,
        candidateCount: candidates.length,
        recommendationCount:
          recommendations.length,
        minimumConfidence,
        maxRecommendations,
        humanReviewRequired: true,
        automatedActionProhibited: true,
      },
    }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Falha desconhecida no Recommendation Engine.'

    errors.push(message)

    return {
      success: false,
      recommendations: [],
      warnings: [],
      errors:
        uniqueStrings(errors),
      generatedAt,
      correlationId:
        input.correlationId?.trim() ||
        createStableId(
          'recommendation-run',
          generatedAt,
        ),
      metadata: {
        engineName: ENGINE_NAME,
        engineVersion: ENGINE_VERSION,
        rulesetVersion: RULESET_VERSION,
        failure: true,
      },
    }
  }
}

export function getRecommendationEngineInfo() {
  return {
    name: ENGINE_NAME,
    version: ENGINE_VERSION,
    rulesetVersion: RULESET_VERSION,
    mode: 'deterministic' as const,
    sources: [
      'correlation',
      'pattern',
      'anomaly',
      'influence',
      'prediction',
    ] as const,
    guarantees: [
      'teacher_decision_pending_by_default',
      'human_review_required',
      'professional_autonomy_preserved',
      'correlation_is_not_causation',
      'recommendation_is_not_automatic_action',
    ],
    limitations: [
      'Recomendações dependem da qualidade dos sinais analíticos de origem.',
      'Não executa ações pedagógicas.',
      'Não acessa banco de dados.',
      'Não aplica RLS.',
    ],
  }
}
