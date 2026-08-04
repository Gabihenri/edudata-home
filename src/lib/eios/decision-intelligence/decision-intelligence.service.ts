function buildExplainability({
  decision,
  originalDecision,
  ruleEvaluation,
  prioritization,
  warnings,
}: {
  decision: EducationalDecision
  originalDecision: EducationalDecision
  ruleEvaluation: DecisionRuleBatchEvaluationResult
  prioritization: DecisionPrioritizationResult | null
  warnings: string[]
}): DecisionIntelligenceExplainability {
  const rationale: string[] = []
  const humanReviewReasons: string[] = []
  const limitations: string[] = []

  rationale.push(
    decision.explanation
      .summary,
  )

  rationale.push(
    decision.explanation
      .rationale,
  )

  rationale.push(
    ...decision.explanation
      .supportingEvidence,
  )

  rationale.push(
    ...decision.explanation
      .assumptions,
  )

  rationale.push(
    ...decision.explanation
      .alternatives,
  )

  if (
    decision.explanation
      .confidenceExplanation
  ) {
    rationale.push(
      decision.explanation
        .confidenceExplanation,
    )
  }

  if (prioritization) {
    rationale.push(
      ...prioritization.reasons,
    )
  }

  if (
    ruleEvaluation
      .matchedRules
      .length > 0
  ) {
    rationale.push(
      `${ruleEvaluation.matchedRules.length} regra(s) decisória(s) foram atendidas.`,
    )
  }

  if (
    originalDecision.priority !==
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
    decision.privacy
      .anonymizationRequired
  ) {
    humanReviewReasons.push(
      'Os dados exigem anonimização antes de uso ampliado.',
    )
  }

  if (
    decision.privacy
      .pseudonymizationRequired
  ) {
    humanReviewReasons.push(
      'Os dados exigem pseudonimização.',
    )
  }

  if (
    decision.privacy
      .consentRequired &&
    !decision.privacy
      .consentConfirmed
  ) {
    humanReviewReasons.push(
      'O consentimento necessário ainda não foi confirmado.',
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

  limitations.push(
    ...decision.explanation
      .limitations,
  )

  limitations.push(
    ...decision.explanation
      .contradictions,
  )

  if (
    originalDecision
      .evidenceReferences
      .length === 0
  ) {
    limitations.push(
      'A decisão não possui referências explícitas a evidências.',
    )
  }

  if (
    originalDecision
      .confidence === null
  ) {
    limitations.push(
      'A decisão não possui nível de confiança calculado.',
    )
  }

  if (
    ruleEvaluation
      .executions
      .length === 0
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
      uniqueStrings(rationale),

    evidenceIds:
      uniqueStrings(
        decision.evidenceReferences.map(
          reference =>
            reference.evidenceId,
        ),
      ),

    matchedRuleIds:
      uniqueStrings(
        ruleEvaluation.matchedRules.map(
          rule =>
            rule.id,
        ),
      ),

    prioritizationReasons:
      uniqueStrings(
        prioritization?.reasons ?? [],
      ),

    recommendationIds:
      uniqueStrings(
        decision.recommendations.map(
          recommendation =>
            recommendation.id,
        ),
      ),

    alertIds:
      uniqueStrings(
        decision.alerts.map(
          alert =>
            alert.id,
        ),
      ),

    actionPlanIds:
      uniqueStrings(
        decision.actionPlans.map(
          actionPlan =>
            actionPlan.id,
        ),
      ),

    humanReviewReasons:
      uniqueStrings(
        humanReviewReasons,
      ),

    limitations:
      uniqueStrings(limitations),
  }
}