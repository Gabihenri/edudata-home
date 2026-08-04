import {
  clampDecisionConfidence,
  clampDecisionPercentage,
  getDecisionConfidenceLevel,
  getDecisionPriorityWeight,
  type DecisionAction,
  type DecisionActionPlan,
  type DecisionAlert,
  type DecisionPriority,
  type DecisionRecommendation,
  type DecisionRiskAssessment,
  type DecisionSeverity,
  type DecisionUrgency,
  type EducationalDecision,
} from './decision-intelligence.contract'

export type DecisionPrioritizationWeights = {
  priority:
    number

  severity:
    number

  urgency:
    number

  confidence:
    number

  risk:
    number

  humanReview:
    number
}

export type DecisionPrioritizationBreakdown = {
  priorityScore:
    number

  severityScore:
    number

  urgencyScore:
    number

  confidenceScore:
    number

  riskScore:
    number

  humanReviewScore:
    number

  weightedScore:
    number

  normalizedScore:
    number
}

export type DecisionPrioritizationResult = {
  success:
    boolean

  decisionId:
    string

  originalPriority:
    DecisionPriority

  calculatedPriority:
    DecisionPriority

  score:
    number

  confidence:
    number | null

  confidenceLevel:
    ReturnType<
      typeof getDecisionConfidenceLevel
    >

  breakdown:
    DecisionPrioritizationBreakdown

  reasons:
    string[]

  warnings:
    string[]

  errors:
    string[]
}

export type PrioritizedDecision = {
  decision:
    EducationalDecision

  prioritization:
    DecisionPrioritizationResult
}

export type DecisionPrioritizationBatchResult = {
  success:
    boolean

  decisions:
    PrioritizedDecision[]

  warnings:
    string[]

  errors:
    string[]
}

const DEFAULT_WEIGHTS:
  DecisionPrioritizationWeights = {
  priority:
    0.2,

  severity:
    0.2,

  urgency:
    0.2,

  confidence:
    0.15,

  risk:
    0.2,

  humanReview:
    0.05,
}

function uniqueStrings(
  values:
    string[],
): string[] {
  return Array.from(
    new Set(
      values
        .map(
          value =>
            value.trim(),
        )
        .filter(
          Boolean,
        ),
    ),
  )
}

function normalizeWeights(
  weights?:
    Partial<DecisionPrioritizationWeights>,
): DecisionPrioritizationWeights {
  const merged = {
    ...DEFAULT_WEIGHTS,
    ...weights,
  }

  const total =
    Object.values(
      merged,
    ).reduce(
      (
        sum,
        value,
      ) =>
        sum +
        (
          Number.isFinite(
            value,
          )
            ? Math.max(
                0,
                value,
              )
            : 0
        ),
      0,
    )

  if (
    total <=
    0
  ) {
    return {
      ...DEFAULT_WEIGHTS,
    }
  }

  return {
    priority:
      merged.priority /
      total,

    severity:
      merged.severity /
      total,

    urgency:
      merged.urgency /
      total,

    confidence:
      merged.confidence /
      total,

    risk:
      merged.risk /
      total,

    humanReview:
      merged.humanReview /
      total,
  }
}

function getSeverityScore(
  severity:
    DecisionSeverity,
): number {
  switch (
    severity
  ) {
    case 'critical':
      return 100

    case 'high':
      return 80

    case 'medium':
      return 60

    case 'low':
      return 35

    case 'informational':
    default:
      return 10
  }
}

function getUrgencyScore(
  urgency:
    DecisionUrgency,
): number {
  switch (
    urgency
  ) {
    case 'immediate':
      return 100

    case 'within_72_hours':
      return 90

    case 'within_7_days':
      return 80

    case 'within_15_days':
      return 65

    case 'within_30_days':
      return 50

    case 'monitor':
      return 30

    case 'no_deadline':
    default:
      return 10
  }
}

function getPriorityScore(
  priority:
    DecisionPriority,
): number {
  return clampDecisionPercentage(
    getDecisionPriorityWeight(
      priority,
    ) *
    20,
  )
}

function getRiskAssessmentScore(
  risk:
    DecisionRiskAssessment,
): number {
  if (
    risk.score !==
    null
  ) {
    return clampDecisionPercentage(
      risk.score,
    )
  }

  const probability =
    risk.probability ??
    0

  const impact =
    risk.impact ??
    0

  return clampDecisionPercentage(
    (
      probability *
      0.5
    ) +
    (
      impact *
      0.5
    ),
  )
}

function getAggregatedRiskScore(
  risks:
    DecisionRiskAssessment[],
): number {
  if (
    risks.length ===
    0
  ) {
    return 0
  }

  const scores =
    risks.map(
      getRiskAssessmentScore,
    )

  const maximum =
    Math.max(
      ...scores,
    )

  const average =
    scores.reduce(
      (
        total,
        value,
      ) =>
        total +
        value,
      0,
    ) /
    scores.length

  return clampDecisionPercentage(
    (
      maximum *
      0.7
    ) +
    (
      average *
      0.3
    ),
  )
}

function getConfidenceScore(
  confidence:
    number | null,
): number {
  if (
    confidence ===
    null
  ) {
    return 0
  }

  return clampDecisionPercentage(
    clampDecisionConfidence(
      confidence,
    ) *
    100,
  )
}

function getHumanReviewScore(
  humanReviewRequired:
    boolean,
): number {
  return humanReviewRequired
    ? 100
    : 0
}

function getCalculatedPriority(
  score:
    number,
): DecisionPriority {
  if (
    score >=
    90
  ) {
    return 'critical'
  }

  if (
    score >=
    75
  ) {
    return 'urgent'
  }

  if (
    score >=
    55
  ) {
    return 'high'
  }

  if (
    score >=
    30
  ) {
    return 'medium'
  }

  return 'low'
}

function buildReasons({
  decision,
  breakdown,
  calculatedPriority,
}: {
  decision:
    EducationalDecision

  breakdown:
    DecisionPrioritizationBreakdown

  calculatedPriority:
    DecisionPriority
}): string[] {
  const reasons:
    string[] = []

  reasons.push(
    `Prioridade calculada como "${calculatedPriority}" a partir de score normalizado de ${breakdown.normalizedScore.toFixed(2)}.`,
  )

  if (
    breakdown.severityScore >=
    80
  ) {
    reasons.push(
      'A severidade elevada aumentou significativamente a prioridade.',
    )
  }

  if (
    breakdown.urgencyScore >=
    80
  ) {
    reasons.push(
      'A urgÃªncia temporal exige resposta em curto prazo.',
    )
  }

  if (
    breakdown.riskScore >=
    70
  ) {
    reasons.push(
      'Os riscos associados apresentam impacto relevante.',
    )
  }

  if (
    breakdown.confidenceScore <
    65
  ) {
    reasons.push(
      'A confianÃ§a limitada recomenda anÃ¡lise cuidadosa antes da execuÃ§Ã£o.',
    )
  }

  if (
    decision.humanReviewRequired
  ) {
    reasons.push(
      'A decisÃ£o exige revisÃ£o humana antes de aprovaÃ§Ã£o ou execuÃ§Ã£o.',
    )
  }

  if (
    decision.privacy
      .containsSensitiveData ||
    decision.privacy
      .containsMinorData
  ) {
    reasons.push(
      'O contexto contÃ©m dados sensÃ­veis ou de menores e requer governanÃ§a reforÃ§ada.',
    )
  }

  return uniqueStrings(
    reasons,
  )
}

export function prioritizeEducationalDecision({
  decision,
  weights,
}: {
  decision:
    EducationalDecision

  weights?:
    Partial<DecisionPrioritizationWeights>
}): DecisionPrioritizationResult {
  const normalizedWeights =
    normalizeWeights(
      weights,
    )

  const priorityScore =
    getPriorityScore(
      decision.priority,
    )

  const severityScore =
    getSeverityScore(
      decision.severity,
    )

  const urgencyScore =
    getUrgencyScore(
      decision.urgency,
    )

  const confidenceScore =
    getConfidenceScore(
      decision.confidence,
    )

  const riskScore =
    getAggregatedRiskScore(
      decision.risks,
    )

  const humanReviewScore =
    getHumanReviewScore(
      decision.humanReviewRequired,
    )

  const weightedScore =
    (
      priorityScore *
      normalizedWeights.priority
    ) +
    (
      severityScore *
      normalizedWeights.severity
    ) +
    (
      urgencyScore *
      normalizedWeights.urgency
    ) +
    (
      confidenceScore *
      normalizedWeights.confidence
    ) +
    (
      riskScore *
      normalizedWeights.risk
    ) +
    (
      humanReviewScore *
      normalizedWeights.humanReview
    )

  const normalizedScore =
    clampDecisionPercentage(
      weightedScore,
    )

  const calculatedPriority =
    getCalculatedPriority(
      normalizedScore,
    )

  const warnings:
    string[] = []

  if (
    decision.confidence ===
    null
  ) {
    warnings.push(
      'A decisÃ£o nÃ£o possui confianÃ§a calculada.',
    )
  }

  if (
    decision.risks.length ===
    0
  ) {
    warnings.push(
      'A decisÃ£o nÃ£o possui avaliaÃ§Ã£o de risco associada.',
    )
  }

  if (
    decision.priority !==
    calculatedPriority
  ) {
    warnings.push(
      `A prioridade informada (${decision.priority}) difere da prioridade calculada (${calculatedPriority}).`,
    )
  }

  const breakdown:
    DecisionPrioritizationBreakdown = {
    priorityScore,
    severityScore,
    urgencyScore,
    confidenceScore,
    riskScore,
    humanReviewScore,
    weightedScore,
    normalizedScore,
  }

  return {
    success:
      true,

    decisionId:
      decision.id,

    originalPriority:
      decision.priority,

    calculatedPriority,

    score:
      normalizedScore,

    confidence:
      decision.confidence,

    confidenceLevel:
      getDecisionConfidenceLevel(
        decision.confidence,
      ),

    breakdown,

    reasons:
      buildReasons({
        decision,
        breakdown,
        calculatedPriority,
      }),

    warnings:
      uniqueStrings(
        warnings,
      ),

    errors:
      [],
  }
}

function comparePrioritizedDecisions(
  first:
    PrioritizedDecision,

  second:
    PrioritizedDecision,
): number {
  const scoreDifference =
    second
      .prioritization
      .score -
    first
      .prioritization
      .score

  if (
    scoreDifference !==
    0
  ) {
    return scoreDifference
  }

  const urgencyDifference =
    getUrgencyScore(
      second
        .decision
        .urgency,
    ) -
    getUrgencyScore(
      first
        .decision
        .urgency,
    )

  if (
    urgencyDifference !==
    0
  ) {
    return urgencyDifference
  }

  const severityDifference =
    getSeverityScore(
      second
        .decision
        .severity,
    ) -
    getSeverityScore(
      first
        .decision
        .severity,
    )

  if (
    severityDifference !==
    0
  ) {
    return severityDifference
  }

  return first
    .decision
    .id
    .localeCompare(
      second
        .decision
        .id,
    )
}

export function prioritizeEducationalDecisions({
  decisions,
  weights,
}: {
  decisions:
    EducationalDecision[]

  weights?:
    Partial<DecisionPrioritizationWeights>
}): DecisionPrioritizationBatchResult {
  const prioritized =
    decisions
      .map(
        decision => ({
          decision: {
            ...decision,
          },

          prioritization:
            prioritizeEducationalDecision({
              decision,
              weights,
            }),
        }),
      )
      .sort(
        comparePrioritizedDecisions,
      )

  const warnings =
    uniqueStrings(
      prioritized.flatMap(
        item =>
          item
            .prioritization
            .warnings,
      ),
    )

  const errors =
    uniqueStrings(
      prioritized.flatMap(
        item =>
          item
            .prioritization
            .errors,
      ),
    )

  return {
    success:
      errors.length ===
      0,

    decisions:
      prioritized,

    warnings,

    errors,
  }
}

function sortByPriorityAndUrgency<T extends {
  priority:
    DecisionPriority

  urgency:
    DecisionUrgency
}>(
  values:
    T[],
): T[] {
  return [
    ...values,
  ].sort(
    (
      first,
      second,
    ) => {
      const priorityDifference =
        getPriorityScore(
          second.priority,
        ) -
        getPriorityScore(
          first.priority,
        )

      if (
        priorityDifference !==
        0
      ) {
        return priorityDifference
      }

      return (
        getUrgencyScore(
          second.urgency,
        ) -
        getUrgencyScore(
          first.urgency,
        )
      )
    },
  )
}

export function prioritizeRecommendations(
  recommendations:
    DecisionRecommendation[],
): DecisionRecommendation[] {
  return sortByPriorityAndUrgency(
    recommendations,
  )
}

export function prioritizeAlerts(
  alerts:
    DecisionAlert[],
): DecisionAlert[] {
  return [
    ...alerts,
  ].sort(
    (
      first,
      second,
    ) => {
      const priorityDifference =
        getPriorityScore(
          second.priority,
        ) -
        getPriorityScore(
          first.priority,
        )

      if (
        priorityDifference !==
        0
      ) {
        return priorityDifference
      }

      return (
        getSeverityScore(
          second.severity,
        ) -
        getSeverityScore(
          first.severity,
        )
      )
    },
  )
}

function getActionStatusWeight(
  status:
    DecisionAction['status'],
): number {
  switch (
    status
  ) {
    case 'overdue':
      return 100

    case 'blocked':
      return 90

    case 'pending':
      return 80

    case 'scheduled':
      return 70

    case 'in_progress':
      return 60

    case 'completed':
      return 20

    case 'cancelled':
    default:
      return 0
  }
}

export function prioritizeActions(
  actions:
    DecisionAction[],
): DecisionAction[] {
  return [
    ...actions,
  ].sort(
    (
      first,
      second,
    ) => {
      const statusDifference =
        getActionStatusWeight(
          second.status,
        ) -
        getActionStatusWeight(
          first.status,
        )

      if (
        statusDifference !==
        0
      ) {
        return statusDifference
      }

      const priorityDifference =
        getPriorityScore(
          second.priority,
        ) -
        getPriorityScore(
          first.priority,
        )

      if (
        priorityDifference !==
        0
      ) {
        return priorityDifference
      }

      const firstDueAt =
        first.dueAt
          ? Date.parse(
              first.dueAt,
            )
          : Number.POSITIVE_INFINITY

      const secondDueAt =
        second.dueAt
          ? Date.parse(
              second.dueAt,
            )
          : Number.POSITIVE_INFINITY

      if (
        firstDueAt !==
        secondDueAt
      ) {
        return (
          firstDueAt -
          secondDueAt
        )
      }

      return first.id.localeCompare(
        second.id,
      )
    },
  )
}

export function prioritizeActionPlans(
  actionPlans:
    DecisionActionPlan[],
): DecisionActionPlan[] {
  return [
    ...actionPlans,
  ]
    .map(
      plan => ({
        ...plan,

        actions:
          prioritizeActions(
            plan.actions,
          ),
      }),
    )
    .sort(
      (
        first,
        second,
      ) => {
        const priorityDifference =
          getPriorityScore(
            second.priority,
          ) -
          getPriorityScore(
            first.priority,
          )

        if (
          priorityDifference !==
          0
        ) {
          return priorityDifference
        }

        const firstProgress =
          clampDecisionPercentage(
            first.progress,
          )

        const secondProgress =
          clampDecisionPercentage(
            second.progress,
          )

        if (
          firstProgress !==
          secondProgress
        ) {
          return (
            firstProgress -
            secondProgress
          )
        }

        const firstDueAt =
          first.dueAt
            ? Date.parse(
                first.dueAt,
              )
            : Number.POSITIVE_INFINITY

        const secondDueAt =
          second.dueAt
            ? Date.parse(
                second.dueAt,
              )
            : Number.POSITIVE_INFINITY

        return (
          firstDueAt -
          secondDueAt
        )
      },
    )
}

export function applyDecisionPrioritization({
  decision,
  weights,
}: {
  decision:
    EducationalDecision

  weights?:
    Partial<DecisionPrioritizationWeights>
}): EducationalDecision {
  const prioritization =
    prioritizeEducationalDecision({
      decision,
      weights,
    })

  return {
    ...decision,

    priority:
      prioritization
        .calculatedPriority,

    recommendations:
      prioritizeRecommendations(
        decision.recommendations,
      ),

    alerts:
      prioritizeAlerts(
        decision.alerts,
      ),

    actionPlans:
      prioritizeActionPlans(
        decision.actionPlans,
      ),

    updatedAt:
      new Date()
        .toISOString(),

    auditTrail: [
      ...decision.auditTrail,

      {
        id:
          `audit-priority-${decision.id}-${Date.now()}`,

        action:
          'prioritized',

        actorId:
          null,

        actorType:
          'service',

        occurredAt:
          new Date()
            .toISOString(),

        previousStatus:
          decision.status,

        nextStatus:
          decision.status,

        description:
          'DecisÃ£o priorizada pelo Decision Prioritization Engine.',

        changes: {
          originalPriority:
            prioritization
              .originalPriority,

          calculatedPriority:
            prioritization
              .calculatedPriority,

          score:
            prioritization.score,

          reasons:
            prioritization.reasons,
        },

        metadata: {
          engine:
            'decision-prioritization',

          version:
            'v1',
        },
      },
    ],

    metadata: {
      ...decision.metadata,

      prioritization: {
        score:
          prioritization.score,

        breakdown:
          prioritization.breakdown,

        reasons:
          prioritization.reasons,

        warnings:
          prioritization.warnings,
      },
    },
  }
}

export function createDefaultDecisionPrioritizationWeights():
  DecisionPrioritizationWeights {
  return {
    ...DEFAULT_WEIGHTS,
  }
}

export const decisionPrioritizationService = {
  prioritize:
    prioritizeEducationalDecision,

  prioritizeBatch:
    prioritizeEducationalDecisions,

  prioritizeRecommendations,

  prioritizeAlerts,

  prioritizeActions,

  prioritizeActionPlans,

  apply:
    applyDecisionPrioritization,

  createDefaultWeights:
    createDefaultDecisionPrioritizationWeights,
}
