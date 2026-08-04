import {
  type DecisionRule,
  type DecisionRuleExecutionResult,
  type EducationalDecision,
} from './decision-intelligence.contract'

import {
  evaluateDecisionRules,
  type DecisionRuleBatchEvaluationResult,
} from './decision-rules.service'

import {
  applyDecisionPrioritization,
  prioritizeEducationalDecision,
  type DecisionPrioritizationResult,
  type DecisionPrioritizationWeights,
} from './decision-prioritization.service'

import {
  applyDecisionRecommendations,
  type DecisionRecommendationGenerationOptions,
} from './decision-recommendation.service'

import {
  applyDecisionAlerts,
  type DecisionAlertGenerationOptions,
} from './decision-alert.service'

import {
  applyDecisionActionPlans,
  type DecisionActionPlanGenerationOptions,
} from './decision-action-plan.service'

export type DecisionIntelligenceProcessingOptions = {
  rules?:
    DecisionRule[]

  additionalData?:
    Record<string, unknown>

  prioritizationWeights?:
    Partial<DecisionPrioritizationWeights>

  recommendationOptions?:
    Partial<DecisionRecommendationGenerationOptions>

  alertOptions?:
    Partial<DecisionAlertGenerationOptions>

  actionPlanOptions?:
    Partial<DecisionActionPlanGenerationOptions>

  applyRules?:
    boolean

  applyPrioritization?:
    boolean

  generateRecommendations?:
    boolean

  generateAlerts?:
    boolean

  generateActionPlans?:
    boolean

  stopOnError?:
    boolean
}

export type DecisionIntelligencePipelineStage =
  | 'rules'
  | 'prioritization'
  | 'recommendations'
  | 'alerts'
  | 'action_plans'
  | 'consolidation'

export type DecisionIntelligenceStageResult = {
  stage:
    DecisionIntelligencePipelineStage

  success:
    boolean

  startedAt:
    string

  completedAt:
    string

  durationMs:
    number

  warnings:
    string[]

  errors:
    string[]

  metadata:
    Record<string, unknown>
}

export type DecisionIntelligenceExplainability = {
  summary:
    string

  rationale:
    string[]

  evidenceIds:
    string[]

  matchedRuleIds:
    string[]

  prioritizationReasons:
    string[]

  recommendationIds:
    string[]

  alertIds:
    string[]

  actionPlanIds:
    string[]

  humanReviewReasons:
    string[]

  limitations:
    string[]
}

export type DecisionIntelligencePrivacyAssessment = {
  containsPersonalData:
    boolean

  containsSensitiveData:
    boolean

  containsMinorData:
    boolean

  anonymized:
    boolean

  requiresConsent:
    boolean

  legalBasis:
    string | null

  retentionPolicy:
    string | null

  humanReviewRequired:
    boolean

  restrictions:
    string[]
}

export type DecisionIntelligenceResult = {
  success:
    boolean

  decisionId:
    string

  decision:
    EducationalDecision

  originalDecision:
    EducationalDecision

  ruleEvaluation:
    DecisionRuleBatchEvaluationResult

  prioritization:
    DecisionPrioritizationResult | null

  ruleExecutions:
    DecisionRuleExecutionResult[]

  stages:
    DecisionIntelligenceStageResult[]

  explainability:
    DecisionIntelligenceExplainability

  privacyAssessment:
    DecisionIntelligencePrivacyAssessment

  warnings:
    string[]

  errors:
    string[]

  requiresHumanReview:
    boolean

  startedAt:
    string

  completedAt:
    string

  durationMs:
    number

  metadata:
    Record<string, unknown>
}

const DEFAULT_OPTIONS: Required<
  Pick<
    DecisionIntelligenceProcessingOptions,
    | 'applyRules'
    | 'applyPrioritization'
    | 'generateRecommendations'
    | 'generateAlerts'
    | 'generateActionPlans'
    | 'stopOnError'
  >
> = {
  applyRules:
    true,

  applyPrioritization:
    true,

  generateRecommendations:
    true,

  generateAlerts:
    true,

  generateActionPlans:
    true,

  stopOnError:
    true,
}

function nowIso():
  string {
  return new Date()
    .toISOString()
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

function getErrorMessage(
  error:
    unknown,
): string {
  if (
    error instanceof Error
  ) {
    return error.message
  }

  if (
    typeof error ===
      'string' &&
    error.trim()
  ) {
    return error.trim()
  }

  return 'Erro inesperado durante o processamento da inteligência decisória.'
}

function createEmptyRuleEvaluation():
  DecisionRuleBatchEvaluationResult {
  return {
    success:
      true,

    executions:
      [],

    matchedRules:
      [],

    unmatchedRules:
      [],

    warnings:
      [],

    errors:
      [],
  }
}

function createStageResult({
  stage,
  success,
  startedAt,
  warnings = [],
  errors = [],
  metadata = {},
}: {
  stage:
    DecisionIntelligencePipelineStage

  success:
    boolean

  startedAt:
    string

  warnings?:
    string[]

  errors?:
    string[]

  metadata?:
    Record<string, unknown>
}): DecisionIntelligenceStageResult {
  const completedAt =
    nowIso()

  return {
    stage,

    success,

    startedAt,

    completedAt,

    durationMs:
      Math.max(
        0,
        Date.parse(
          completedAt,
        ) -
        Date.parse(
          startedAt,
        ),
      ),

    warnings:
      uniqueStrings(
        warnings,
      ),

    errors:
      uniqueStrings(
        errors,
      ),

    metadata,
  }
}

function shouldStopPipeline({
  stopOnError,
  errors,
}: {
  stopOnError:
    boolean

  errors:
    string[]
}): boolean {
  return (
    stopOnError &&
    errors.length >
      0
  )
}

function buildPrivacyAssessment(
  decision:
    EducationalDecision,
): DecisionIntelligencePrivacyAssessment {
  const restrictions:
    string[] = []

  if (
    decision.privacy
      .containsSensitiveData
  ) {
    restrictions.push(
      'A decisão contém dados pessoais sensíveis e exige acesso restrito.',
    )
  }

  if (
    decision.privacy
      .containsMinorData
  ) {
    restrictions.push(
      'A decisão contém dados de menores e exige proteção reforçada.',
    )
  }

  if (
    !decision.privacy
      .anonymized
  ) {
    restrictions.push(
      'Os dados não estão integralmente anonimizados.',
    )
  }

  if (
    decision.privacy
      .requiresConsent
  ) {
    restrictions.push(
      'O tratamento pode depender de consentimento ou de outra base legal aplicável.',
    )
  }

  if (
    !decision.privacy
      .legalBasis
  ) {
    restrictions.push(
      'A base legal para o tratamento dos dados deve ser validada.',
    )
  }

  const humanReviewRequired =
    decision
      .humanReviewRequired ||
    decision.privacy
      .containsSensitiveData ||
    decision.privacy
      .containsMinorData ||
    decision.privacy
      .requiresConsent

  return {
    containsPersonalData:
      decision.privacy
        .containsPersonalData,

    containsSensitiveData:
      decision.privacy
        .containsSensitiveData,

    containsMinorData:
      decision.privacy
        .containsMinorData,

    anonymized:
      decision.privacy
        .anonymized,

    requiresConsent:
      decision.privacy
        .requiresConsent,

    legalBasis:
      decision.privacy
        .legalBasis,

    retentionPolicy:
      decision.privacy
        .retentionPolicy,

    humanReviewRequired,

    restrictions:
      uniqueStrings(
        restrictions,
      ),
  }
}

function buildExplainability({
  decision,
  originalDecision,
  ruleEvaluation,
  prioritization,
  warnings,
}: {
  decision:
    EducationalDecision

  originalDecision:
    EducationalDecision

  ruleEvaluation:
    DecisionRuleBatchEvaluationResult

  prioritization:
    DecisionPrioritizationResult | null

  warnings:
    string[]
}): DecisionIntelligenceExplainability {
  const rationale:
    string[] = []

  const humanReviewReasons:
    string[] = []

  const limitations:
    string[] = []

  rationale.push(
    decision.explanation
      .rationale,
  )

  rationale.push(
    ...decision.explanation
      .factors,
  )

  if (
    prioritization
  ) {
    rationale.push(
      ...prioritization
        .reasons,
    )
  }

  if (
    ruleEvaluation
      .matchedRules
      .length >
    0
  ) {
    rationale.push(
      `${ruleEvaluation.matchedRules.length} regra(s) decisória(s) foram atendidas.`,
    )
  }

  if (
    originalDecision
      .priority !==
    decision.priority
  ) {
    rationale.push(
      `A prioridade foi recalculada de "${originalDecision.priority}" para "${decision.priority}".`,
    )
  }

  if (
    decision
      .humanReviewRequired
  ) {
    humanReviewReasons.push(
      'A decisão foi marcada como dependente de revisão humana.',
    )
  }

  if (
    decision.privacy
      .containsSensitiveData
  ) {
    humanReviewReasons.push(
      'A decisão envolve dados pessoais sensíveis.',
    )
  }

  if (
    decision.privacy
      .containsMinorData
  ) {
    humanReviewReasons.push(
      'A decisão envolve dados de menores.',
    )
  }

  if (
    decision.recommendations
      .some(
        recommendation =>
          recommendation
            .requiresApproval,
      )
  ) {
    humanReviewReasons.push(
      'Uma ou mais recomendações exigem aprovação.',
    )
  }

  if (
    decision.actionPlans
      .some(
        actionPlan =>
          actionPlan
            .requiresApproval,
      )
  ) {
    humanReviewReasons.push(
      'Um ou mais planos de ação exigem aprovação.',
    )
  }

  if (
    originalDecision
      .evidenceReferences
      .length ===
    0
  ) {
    limitations.push(
      'A decisão não possui referências explícitas a evidências.',
    )
  }

  if (
    originalDecision
      .confidence ===
    null
  ) {
    limitations.push(
      'A decisão não possui nível de confiança calculado.',
    )
  }

  if (
    ruleEvaluation
      .executions
      .length ===
    0
  ) {
    limitations.push(
      'Nenhuma regra decisória foi executada.',
    )
  }

  limitations.push(
    ...warnings,
  )

  const summaryParts = [
    `${ruleEvaluation.matchedRules.length} regra(s) atendida(s)`,
    `${decision.recommendations.length} recomendação(ões)`,
    `${decision.alerts.length} alerta(s)`,
    `${decision.actionPlans.length} plano(s) de ação`,
  ]

  return {
    summary:
      `Processamento concluído com ${summaryParts.join(', ')}.`,

    rationale:
      uniqueStrings(
        rationale,
      ),

    evidenceIds:
      uniqueStrings(
        decision
          .evidenceReferences
          .map(
            reference =>
              reference
                .evidenceId,
          ),
      ),

    matchedRuleIds:
      uniqueStrings(
        ruleEvaluation
          .matchedRules
          .map(
            rule =>
              rule.id,
          ),
      ),

    prioritizationReasons:
      uniqueStrings(
        prioritization
          ?.reasons ??
        [],
      ),

    recommendationIds:
      uniqueStrings(
        decision
          .recommendations
          .map(
            recommendation =>
              recommendation.id,
          ),
      ),

    alertIds:
      uniqueStrings(
        decision.alerts
          .map(
            alert =>
              alert.id,
          ),
      ),

    actionPlanIds:
      uniqueStrings(
        decision
          .actionPlans
          .map(
            actionPlan =>
              actionPlan.id,
          ),
      ),

    humanReviewReasons:
      uniqueStrings(
        humanReviewReasons,
      ),

    limitations:
      uniqueStrings(
        limitations,
      ),
  }
}

function consolidateDecision({
  decision,
  ruleEvaluation,
  prioritization,
  explainability,
  privacyAssessment,
  stages,
  warnings,
  errors,
  startedAt,
  completedAt,
}: {
  decision:
    EducationalDecision

  ruleEvaluation:
    DecisionRuleBatchEvaluationResult

  prioritization:
    DecisionPrioritizationResult | null

  explainability:
    DecisionIntelligenceExplainability

  privacyAssessment:
    DecisionIntelligencePrivacyAssessment

  stages:
    DecisionIntelligenceStageResult[]

  warnings:
    string[]

  errors:
    string[]

  startedAt:
    string

  completedAt:
    string
}): EducationalDecision {
  const requiresHumanReview =
    decision
      .humanReviewRequired ||
    privacyAssessment
      .humanReviewRequired ||
    explainability
      .humanReviewReasons
      .length >
      0 ||
    errors.length >
      0

  return {
    ...decision,

    humanReviewRequired:
      requiresHumanReview,

    updatedAt:
      completedAt,

    metadata: {
      ...decision.metadata,

      decisionIntelligence: {
        engine:
          'decision-intelligence',

        version:
          'v1',

        framework:
          'Framework EDI',

        startedAt,

        completedAt,

        durationMs:
          Math.max(
            0,
            Date.parse(
              completedAt,
            ) -
            Date.parse(
              startedAt,
            ),
          ),

        success:
          errors.length ===
          0,

        pipeline: [
          'rules',
          'prioritization',
          'recommendations',
          'alerts',
          'action_plans',
          'consolidation',
        ],

        stages,

        rules: {
          executionCount:
            ruleEvaluation
              .executions
              .length,

          matchedRuleIds:
            ruleEvaluation
              .matchedRules
              .map(
                rule =>
                  rule.id,
              ),

          unmatchedRuleIds:
            ruleEvaluation
              .unmatchedRules
              .map(
                rule =>
                  rule.id,
              ),

          executions:
            ruleEvaluation
              .executions,
        },

        prioritization:
          prioritization
            ? {
                originalPriority:
                  prioritization
                    .originalPriority,

                calculatedPriority:
                  prioritization
                    .calculatedPriority,

                score:
                  prioritization
                    .score,

                confidence:
                  prioritization
                    .confidence,

                confidenceLevel:
                  prioritization
                    .confidenceLevel,

                breakdown:
                  prioritization
                    .breakdown,

                reasons:
                  prioritization
                    .reasons,
              }
            : null,

        explainability,

        privacy:
          privacyAssessment,

        lgpd: {
          containsPersonalData:
            privacyAssessment
              .containsPersonalData,

          containsSensitiveData:
            privacyAssessment
              .containsSensitiveData,

          containsMinorData:
            privacyAssessment
              .containsMinorData,

          anonymized:
            privacyAssessment
              .anonymized,

          requiresConsent:
            privacyAssessment
              .requiresConsent,

          legalBasis:
            privacyAssessment
              .legalBasis,

          retentionPolicy:
            privacyAssessment
              .retentionPolicy,

          restrictions:
            privacyAssessment
              .restrictions,
        },

        humanReview: {
          required:
            requiresHumanReview,

          reasons:
            explainability
              .humanReviewReasons,
        },

        totals: {
          recommendations:
            decision
              .recommendations
              .length,

          alerts:
            decision
              .alerts
              .length,

          actionPlans:
            decision
              .actionPlans
              .length,

          actions:
            decision
              .actionPlans
              .reduce(
                (
                  total,
                  actionPlan,
                ) =>
                  total +
                  actionPlan
                    .actions
                    .length,
                0,
              ),
        },

        warnings:
          uniqueStrings(
            warnings,
          ),

        errors:
          uniqueStrings(
            errors,
          ),
      },
    },
  }
}

export function processDecisionIntelligence({
  decision,
  options = {},
}: {
  decision:
    EducationalDecision

  options?:
    DecisionIntelligenceProcessingOptions
}): DecisionIntelligenceResult {
  const startedAt =
    nowIso()

  const originalDecision: EducationalDecision = {
    ...decision,

    recommendations: [
      ...decision
        .recommendations,
    ],

    alerts: [
      ...decision.alerts,
    ],

    actionPlans:
      decision.actionPlans
        .map(
          actionPlan => ({
            ...actionPlan,

            actions: [
              ...actionPlan.actions,
            ],
          }),
        ),

    auditTrail: [
      ...decision.auditTrail,
    ],

    metadata: {
      ...decision.metadata,
    },
  }

  const normalizedOptions = {
    ...DEFAULT_OPTIONS,
    ...options,
  }

  const stages:
    DecisionIntelligenceStageResult[] = []

  const warnings:
    string[] = []

  const errors:
    string[] = []

  let enrichedDecision: EducationalDecision = {
    ...decision,
  }

  let ruleEvaluation =
    createEmptyRuleEvaluation()

  let prioritization:
    DecisionPrioritizationResult | null =
      null

  if (
    normalizedOptions
      .applyRules
  ) {
    const stageStartedAt =
      nowIso()

    try {
      ruleEvaluation =
        evaluateDecisionRules({
          rules:
            normalizedOptions
              .rules ??
            [],

          context: {
            decision:
              enrichedDecision,

            additionalData:
              normalizedOptions
                .additionalData,
          },
        })

      warnings.push(
        ...ruleEvaluation
          .warnings,
      )

      errors.push(
        ...ruleEvaluation
          .errors,
      )

      enrichedDecision = {
        ...enrichedDecision,

        humanReviewRequired:
          enrichedDecision
            .humanReviewRequired ||
          ruleEvaluation
            .errors
            .length >
            0,

        updatedAt:
          nowIso(),

        metadata: {
          ...enrichedDecision
            .metadata,

          decisionRuleEvaluation: {
            evaluatedAt:
              nowIso(),

            success:
              ruleEvaluation
                .success,

            executionCount:
              ruleEvaluation
                .executions
                .length,

            matchedRuleIds:
              ruleEvaluation
                .matchedRules
                .map(
                  rule =>
                    rule.id,
                ),

            unmatchedRuleIds:
              ruleEvaluation
                .unmatchedRules
                .map(
                  rule =>
                    rule.id,
                ),

            executions:
              ruleEvaluation
                .executions,

            warnings:
              ruleEvaluation
                .warnings,

            errors:
              ruleEvaluation
                .errors,
          },
        },
      }

      stages.push(
        createStageResult({
          stage:
            'rules',

          success:
            ruleEvaluation
              .success,

          startedAt:
            stageStartedAt,

          warnings:
            ruleEvaluation
              .warnings,

          errors:
            ruleEvaluation
              .errors,

          metadata: {
            executionCount:
              ruleEvaluation
                .executions
                .length,

            matchedRuleCount:
              ruleEvaluation
                .matchedRules
                .length,
          },
        }),
      )
    } catch (
      error
    ) {
      const message =
        getErrorMessage(
          error,
        )

      errors.push(
        message,
      )

      stages.push(
        createStageResult({
          stage:
            'rules',

          success:
            false,

          startedAt:
            stageStartedAt,

          errors: [
            message,
          ],
        }),
      )
    }
  }

  if (
    !shouldStopPipeline({
      stopOnError:
        normalizedOptions
          .stopOnError,

      errors,
    }) &&
    normalizedOptions
      .applyPrioritization
  ) {
    const stageStartedAt =
      nowIso()

    try {
      prioritization =
        prioritizeEducationalDecision({
          decision:
            enrichedDecision,

          weights:
            normalizedOptions
              .prioritizationWeights,
        })

      warnings.push(
        ...prioritization
          .warnings,
      )

      errors.push(
        ...prioritization
          .errors,
      )

      enrichedDecision =
        applyDecisionPrioritization({
          decision:
            enrichedDecision,

          weights:
            normalizedOptions
              .prioritizationWeights,
        })

      stages.push(
        createStageResult({
          stage:
            'prioritization',

          success:
            prioritization
              .success,

          startedAt:
            stageStartedAt,

          warnings:
            prioritization
              .warnings,

          errors:
            prioritization
              .errors,

          metadata: {
            originalPriority:
              prioritization
                .originalPriority,

            calculatedPriority:
              prioritization
                .calculatedPriority,

            score:
              prioritization
                .score,
          },
        }),
      )
    } catch (
      error
    ) {
      const message =
        getErrorMessage(
          error,
        )

      errors.push(
        message,
      )

      stages.push(
        createStageResult({
          stage:
            'prioritization',

          success:
            false,

          startedAt:
            stageStartedAt,

          errors: [
            message,
          ],
        }),
      )
    }
  }

  if (
    !shouldStopPipeline({
      stopOnError:
        normalizedOptions
          .stopOnError,

      errors,
    }) &&
    normalizedOptions
      .generateRecommendations
  ) {
    const stageStartedAt =
      nowIso()

    try {
      const previousCount =
        enrichedDecision
          .recommendations
          .length

      enrichedDecision =
        applyDecisionRecommendations({
          decision:
            enrichedDecision,

          ruleExecutions:
            ruleEvaluation
              .executions,

          options:
            normalizedOptions
              .recommendationOptions,
        })

      const recommendationMetadata =
        enrichedDecision
          .metadata
          .recommendationGeneration

      stages.push(
        createStageResult({
          stage:
            'recommendations',

          success:
            true,

          startedAt:
            stageStartedAt,

          metadata: {
            previousCount,

            generatedCount:
              enrichedDecision
                .recommendations
                .length,

            generation:
              recommendationMetadata,
          },
        }),
      )
    } catch (
      error
    ) {
      const message =
        getErrorMessage(
          error,
        )

      errors.push(
        message,
      )

      stages.push(
        createStageResult({
          stage:
            'recommendations',

          success:
            false,

          startedAt:
            stageStartedAt,

          errors: [
            message,
          ],
        }),
      )
    }
  }

  if (
    !shouldStopPipeline({
      stopOnError:
        normalizedOptions
          .stopOnError,

      errors,
    }) &&
    normalizedOptions
      .generateAlerts
  ) {
    const stageStartedAt =
      nowIso()

    try {
      const previousCount =
        enrichedDecision
          .alerts
          .length

      enrichedDecision =
        applyDecisionAlerts({
          decision:
            enrichedDecision,

          options:
            normalizedOptions
              .alertOptions,
        })

      const alertMetadata =
        enrichedDecision
          .metadata
          .alertGeneration

      stages.push(
        createStageResult({
          stage:
            'alerts',

          success:
            true,

          startedAt:
            stageStartedAt,

          metadata: {
            previousCount,

            generatedCount:
              enrichedDecision
                .alerts
                .length,

            generation:
              alertMetadata,
          },
        }),
      )
    } catch (
      error
    ) {
      const message =
        getErrorMessage(
          error,
        )

      errors.push(
        message,
      )

      stages.push(
        createStageResult({
          stage:
            'alerts',

          success:
            false,

          startedAt:
            stageStartedAt,

          errors: [
            message,
          ],
        }),
      )
    }
  }

  if (
    !shouldStopPipeline({
      stopOnError:
        normalizedOptions
          .stopOnError,

      errors,
    }) &&
    normalizedOptions
      .generateActionPlans
  ) {
    const stageStartedAt =
      nowIso()

    try {
      const previousCount =
        enrichedDecision
          .actionPlans
          .length

      enrichedDecision =
        applyDecisionActionPlans({
          decision:
            enrichedDecision,

          options:
            normalizedOptions
              .actionPlanOptions,
        })

      const actionPlanMetadata =
        enrichedDecision
          .metadata
          .actionPlanGeneration

      stages.push(
        createStageResult({
          stage:
            'action_plans',

          success:
            true,

          startedAt:
            stageStartedAt,

          metadata: {
            previousCount,

            generatedCount:
              enrichedDecision
                .actionPlans
                .length,

            generation:
              actionPlanMetadata,
          },
        }),
      )
    } catch (
      error
    ) {
      const message =
        getErrorMessage(
          error,
        )

      errors.push(
        message,
      )

      stages.push(
        createStageResult({
          stage:
            'action_plans',

          success:
            false,

          startedAt:
            stageStartedAt,

          errors: [
            message,
          ],
        }),
      )
    }
  }

  const consolidationStartedAt =
    nowIso()

  const consolidatedWarnings =
    uniqueStrings(
      warnings,
    )

  const consolidatedErrors =
    uniqueStrings(
      errors,
    )

  const privacyAssessment =
    buildPrivacyAssessment(
      enrichedDecision,
    )

  const explainability =
    buildExplainability({
      decision:
        enrichedDecision,

      originalDecision,

      ruleEvaluation,

      prioritization,

      warnings:
        consolidatedWarnings,
    })

  const completedAt =
    nowIso()

  enrichedDecision =
    consolidateDecision({
      decision:
        enrichedDecision,

      ruleEvaluation,

      prioritization,

      explainability,

      privacyAssessment,

      stages,

      warnings:
        consolidatedWarnings,

      errors:
        consolidatedErrors,

      startedAt,

      completedAt,
    })

  stages.push(
    createStageResult({
      stage:
        'consolidation',

      success:
        consolidatedErrors
          .length ===
        0,

      startedAt:
        consolidationStartedAt,

      warnings:
        consolidatedWarnings,

      errors:
        consolidatedErrors,

      metadata: {
        recommendationCount:
          enrichedDecision
            .recommendations
            .length,

        alertCount:
          enrichedDecision
            .alerts
            .length,

        actionPlanCount:
          enrichedDecision
            .actionPlans
            .length,

        humanReviewRequired:
          enrichedDecision
            .humanReviewRequired,
      },
    }),
  )

  enrichedDecision = {
    ...enrichedDecision,

    metadata: {
      ...enrichedDecision.metadata,

      decisionIntelligence: {
        ...(
          enrichedDecision
            .metadata
            .decisionIntelligence as
            Record<string, unknown>
        ),

        stages,
      },
    },
  }

  return {
    success:
      consolidatedErrors
        .length ===
      0,

    decisionId:
      enrichedDecision.id,

    decision:
      enrichedDecision,

    originalDecision,

    ruleEvaluation,

    prioritization,

    ruleExecutions:
      ruleEvaluation
        .executions,

    stages,

    explainability,

    privacyAssessment,

    warnings:
      consolidatedWarnings,

    errors:
      consolidatedErrors,

    requiresHumanReview:
      enrichedDecision
        .humanReviewRequired,

    startedAt,

    completedAt,

    durationMs:
      Math.max(
        0,
        Date.parse(
          completedAt,
        ) -
        Date.parse(
          startedAt,
        ),
      ),

    metadata: {
      engine:
        'decision-intelligence',

      version:
        'v1',

      framework:
        'Framework EDI',

      pipelineCompleted:
        consolidatedErrors
          .length ===
        0,

      stageCount:
        stages.length,

      matchedRuleCount:
        ruleEvaluation
          .matchedRules
          .length,

      recommendationCount:
        enrichedDecision
          .recommendations
          .length,

      alertCount:
        enrichedDecision
          .alerts
          .length,

      actionPlanCount:
        enrichedDecision
          .actionPlans
          .length,
    },
  }
}

export function enrichEducationalDecision({
  decision,
  rules = [],
  additionalData,
  prioritizationWeights,
  recommendationOptions,
  alertOptions,
  actionPlanOptions,
}: {
  decision:
    EducationalDecision

  rules?:
    DecisionRule[]

  additionalData?:
    Record<string, unknown>

  prioritizationWeights?:
    Partial<DecisionPrioritizationWeights>

  recommendationOptions?:
    Partial<DecisionRecommendationGenerationOptions>

  alertOptions?:
    Partial<DecisionAlertGenerationOptions>

  actionPlanOptions?:
    Partial<DecisionActionPlanGenerationOptions>
}): EducationalDecision {
  return processDecisionIntelligence({
    decision,

    options: {
      rules,
      additionalData,
      prioritizationWeights,
      recommendationOptions,
      alertOptions,
      actionPlanOptions,
    },
  }).decision
}

export function validateDecisionIntelligenceResult(
  result:
    DecisionIntelligenceResult,
): {
  valid:
    boolean

  warnings:
    string[]

  errors:
    string[]
} {
  const warnings:
    string[] = [
      ...result.warnings,
    ]

  const errors:
    string[] = [
      ...result.errors,
    ]

  if (
    result.decisionId !==
    result.decision.id
  ) {
    errors.push(
      'O identificador do resultado não corresponde ao identificador da decisão.',
    )
  }

  if (
    result.stages.length ===
    0
  ) {
    errors.push(
      'Nenhuma etapa do pipeline foi registrada.',
    )
  }

  if (
    result.decision
      .recommendations
      .length ===
      0
  ) {
    warnings.push(
      'A decisão processada não possui recomendações.',
    )
  }

  if (
    result.requiresHumanReview &&
    result.explainability
      .humanReviewReasons
      .length ===
      0
  ) {
    warnings.push(
      'A revisão humana foi exigida sem justificativa consolidada.',
    )
  }

  if (
    result.privacyAssessment
      .containsPersonalData &&
    !result.privacyAssessment
      .legalBasis
  ) {
    warnings.push(
      'A decisão contém dados pessoais sem base legal registrada.',
    )
  }

  return {
    valid:
      errors.length ===
      0,

    warnings:
      uniqueStrings(
        warnings,
      ),

    errors:
      uniqueStrings(
        errors,
      ),
  }
}

export const decisionIntelligenceService = {
  process:
    processDecisionIntelligence,

  enrich:
    enrichEducationalDecision,

  validate:
    validateDecisionIntelligenceResult,
}