import {
  clampDecisionPercentage,
  type DecisionAction,
  type DecisionActionPlan,
  type DecisionActionStatus,
  type DecisionActionType,
  type DecisionOutcomeStatus,
  type DecisionPriority,
  type DecisionRecommendation,
  type EducationalDecision,
} from './decision-intelligence.contract'

export type DecisionActionPlanGenerationOptions = {
  maximumPlansPerDecision:
    number

  maximumActionsPerPlan:
    number

  defaultReviewFrequencyDays:
    number

  defaultDueDays:
    number

  requireApprovalForCriticalPlans:
    boolean

  requireEvidenceForCompletion:
    boolean
}

export type DecisionActionPlanGenerationResult = {
  success:
    boolean

  decisionId:
    string

  actionPlans:
    DecisionActionPlan[]

  warnings:
    string[]

  errors:
    string[]

  requiresHumanReview:
    boolean
}

export type DecisionActionPlanBatchResult = {
  success:
    boolean

  results:
    DecisionActionPlanGenerationResult[]

  actionPlans:
    DecisionActionPlan[]

  warnings:
    string[]

  errors:
    string[]

  requiresHumanReview:
    boolean
}

const DEFAULT_OPTIONS:
  DecisionActionPlanGenerationOptions = {
  maximumPlansPerDecision:
    3,

  maximumActionsPerPlan:
    8,

  defaultReviewFrequencyDays:
    7,

  defaultDueDays:
    30,

  requireApprovalForCriticalPlans:
    true,

  requireEvidenceForCompletion:
    true,
}

function nowIso():
  string {
  return new Date()
    .toISOString()
}

function createId(
  prefix:
    string,
): string {
  return [
    prefix,
    Date.now(),
    Math.random()
      .toString(36)
      .slice(2, 10),
  ].join(
    '-',
  )
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

function addDays(
  date:
    Date,

  days:
    number,
): string {
  return new Date(
    date.getTime() +
      days *
      24 *
      60 *
      60 *
      1000,
  ).toISOString()
}

function normalizeOptions(
  options?:
    Partial<DecisionActionPlanGenerationOptions>,
): DecisionActionPlanGenerationOptions {
  return {
    maximumPlansPerDecision:
      Math.max(
        1,
        Math.floor(
          options?.maximumPlansPerDecision ??
          DEFAULT_OPTIONS.maximumPlansPerDecision,
        ),
      ),

    maximumActionsPerPlan:
      Math.max(
        1,
        Math.floor(
          options?.maximumActionsPerPlan ??
          DEFAULT_OPTIONS.maximumActionsPerPlan,
        ),
      ),

    defaultReviewFrequencyDays:
      Math.max(
        1,
        Math.floor(
          options?.defaultReviewFrequencyDays ??
          DEFAULT_OPTIONS.defaultReviewFrequencyDays,
        ),
      ),

    defaultDueDays:
      Math.max(
        1,
        Math.floor(
          options?.defaultDueDays ??
          DEFAULT_OPTIONS.defaultDueDays,
        ),
      ),

    requireApprovalForCriticalPlans:
      options?.requireApprovalForCriticalPlans ??
      DEFAULT_OPTIONS.requireApprovalForCriticalPlans,

    requireEvidenceForCompletion:
      options?.requireEvidenceForCompletion ??
      DEFAULT_OPTIONS.requireEvidenceForCompletion,
  }
}

function getPriorityWeight(
  priority:
    DecisionPriority,
): number {
  switch (
    priority
  ) {
    case 'critical':
      return 5

    case 'urgent':
      return 4

    case 'high':
      return 3

    case 'medium':
      return 2

    case 'low':
    default:
      return 1
  }
}

function getActionDueDays(
  priority:
    DecisionPriority,

  defaultDueDays:
    number,
): number {
  switch (
    priority
  ) {
    case 'critical':
      return 1

    case 'urgent':
      return 3

    case 'high':
      return 7

    case 'medium':
      return 15

    case 'low':
    default:
      return defaultDueDays
  }
}

function mapActionTypeToTitle(
  actionType:
    DecisionActionType,
): string {
  switch (
    actionType
  ) {
    case 'observe':
      return 'Observar a situaÃ§Ã£o'

    case 'monitor':
      return 'Monitorar evoluÃ§Ã£o'

    case 'contact_student':
      return 'Realizar contato com o estudante'

    case 'contact_family':
      return 'Realizar contato com a famÃ­lia'

    case 'review_evidence':
      return 'Revisar evidÃªncias'

    case 'review_assessment':
      return 'Revisar avaliaÃ§Ã£o'

    case 'adjust_planning':
      return 'Ajustar planejamento'

    case 'adjust_lesson':
      return 'Ajustar aula'

    case 'create_intervention':
      return 'Criar intervenÃ§Ã£o'

    case 'create_recovery_plan':
      return 'Criar plano de recuperaÃ§Ã£o'

    case 'create_recomposition_plan':
      return 'Criar plano de recomposiÃ§Ã£o'

    case 'provide_accessibility_support':
      return 'Providenciar apoio de acessibilidade'

    case 'provide_teacher_support':
      return 'Providenciar apoio ao professor'

    case 'provide_learning_resource':
      return 'Disponibilizar recurso de aprendizagem'

    case 'refer_support_team':
      return 'Encaminhar para equipe de apoio'

    case 'refer_management':
      return 'Encaminhar para gestÃ£o'

    case 'collect_more_evidence':
      return 'Coletar novas evidÃªncias'

    case 'schedule_follow_up':
      return 'Agendar acompanhamento'

    case 'update_curriculum_alignment':
      return 'Atualizar alinhamento curricular'

    case 'validate_data':
      return 'Validar dados'

    case 'escalate':
      return 'Escalar situaÃ§Ã£o'

    case 'close':
      return 'Encerrar acompanhamento'

    case 'custom':
    default:
      return 'Executar aÃ§Ã£o personalizada'
  }
}

function createActionFromRecommendation({
  recommendation,
  index,
  options,
}: {
  recommendation:
    DecisionRecommendation

  index:
    number

  options:
    DecisionActionPlanGenerationOptions
}): DecisionAction {
  const start =
    new Date()

  const dueDays =
    getActionDueDays(
      recommendation.priority,
      options.defaultDueDays,
    )

  return {
    id:
      createId(
        'decision-action',
      ),

    actionType:
      recommendation.actionType,

    title:
      recommendation.title ||
      mapActionTypeToTitle(
        recommendation.actionType,
      ),

    description:
      recommendation.description,

    status:
      index ===
        0
        ? 'pending'
        : 'scheduled',

    priority:
      recommendation.priority,

    responsibleUserId:
      null,

    responsibleRole:
      recommendation.audience[0] ??
      null,

    startsAt:
      index ===
        0
        ? nowIso()
        : addDays(
            start,
            index,
          ),

    dueAt:
      addDays(
        start,
        dueDays +
        index,
      ),

    completedAt:
      null,

    dependsOnActionIds:
      [],

    evidenceRequired:
      options
        .requireEvidenceForCompletion,

    evidenceIds:
      recommendation.evidenceIds,

    expectedOutcome:
      recommendation.expectedOutcome,

    actualOutcome:
      null,

    outcomeStatus:
      'not_started',

    notes:
      [],

    metadata: {
      recommendationId:
        recommendation.id,

      generatedAt:
        nowIso(),

      generatedBy:
        'decision-action-plan-engine',
    },
  }
}

function linkActionDependencies(
  actions:
    DecisionAction[],
): DecisionAction[] {
  return actions.map(
    (
      action,
      index,
    ) => ({
      ...action,

      dependsOnActionIds:
        index ===
          0
          ? []
          : [
              actions[
                index -
                1
              ].id,
            ],
    }),
  )
}

function calculateProgress(
  actions:
    DecisionAction[],
): number {
  if (
    actions.length ===
    0
  ) {
    return 0
  }

  const completed =
    actions.filter(
      action =>
        action.status ===
        'completed',
    ).length

  return clampDecisionPercentage(
    (
      completed /
      actions.length
    ) *
    100,
  )
}

function createActionPlan({
  decision,
  title,
  description,
  objective,
  recommendations,
  options,
}: {
  decision:
    EducationalDecision

  title:
    string

  description:
    string | null

  objective:
    string

  recommendations:
    DecisionRecommendation[]

  options:
    DecisionActionPlanGenerationOptions
}): DecisionActionPlan {
  const actions =
    linkActionDependencies(
      recommendations
        .slice(
          0,
          options
            .maximumActionsPerPlan,
        )
        .map(
          (
            recommendation,
            index,
          ) =>
            createActionFromRecommendation({
              recommendation,
              index,
              options,
            }),
        ),
    )

  const startsAt =
    actions[0]
      ?.startsAt ??
    nowIso()

  const dueAt =
    actions
      .map(
        action =>
          action.dueAt,
      )
      .filter(
        (
          value,
        ): value is string =>
          Boolean(
            value,
          ),
      )
      .sort()
      .at(
        -1,
      ) ??
    addDays(
      new Date(),
      options.defaultDueDays,
    )

  const criticalPlan =
    decision.priority ===
      'critical' ||
    decision.severity ===
      'critical'

  return {
    id:
      createId(
        'decision-action-plan',
      ),

    title,

    description,

    status:
      'generated',

    priority:
      decision.priority,

    subjectType:
      decision.subjects[0]
        ?.subjectType ??
      'other',

    subjectId:
      decision.subjects[0]
        ?.subjectId ??
      decision.id,

    objective,

    actions,

    startsAt,

    dueAt,

    completedAt:
      null,

    progress:
      calculateProgress(
        actions,
      ),

    expectedOutcome:
      recommendations
        .map(
          recommendation =>
            recommendation
              .expectedOutcome,
        )
        .filter(
          (
            value,
          ): value is string =>
            Boolean(
              value,
            ),
        )
        .join(' ') ||
      null,

    actualOutcome:
      null,

    outcomeStatus:
      'not_started',

    createdAutomatically:
      true,

    requiresApproval:
      recommendations.some(
        recommendation =>
          recommendation
            .requiresApproval,
      ) ||
      (
        options
          .requireApprovalForCriticalPlans &&
        criticalPlan
      ),

    approved:
      false,

    approvedBy:
      null,

    approvedAt:
      null,

    reviewFrequencyDays:
      options
        .defaultReviewFrequencyDays,

    nextReviewAt:
      addDays(
        new Date(),
        options
          .defaultReviewFrequencyDays,
      ),

    metadata: {
      decisionId:
        decision.id,

      recommendationIds:
        recommendations.map(
          recommendation =>
            recommendation.id,
        ),

      generatedAt:
        nowIso(),

      generatedBy:
        'decision-action-plan-engine',
    },
  }
}

function groupRecommendations(
  recommendations:
    DecisionRecommendation[],
): DecisionRecommendation[][] {
  const groups =
    new Map<
      string,
      DecisionRecommendation[]
    >()

  for (
    const recommendation
    of recommendations
  ) {
    const key =
      recommendation.actionType

    const current =
      groups.get(
        key,
      ) ??
      []

    current.push(
      recommendation,
    )

    groups.set(
      key,
      current,
    )
  }

  return Array.from(
    groups.values(),
  )
}

function sortRecommendations(
  recommendations:
    DecisionRecommendation[],
): DecisionRecommendation[] {
  return [
    ...recommendations,
  ].sort(
    (
      first,
      second,
    ) => {
      const priorityDifference =
        getPriorityWeight(
          second.priority,
        ) -
        getPriorityWeight(
          first.priority,
        )

      if (
        priorityDifference !==
        0
      ) {
        return priorityDifference
      }

      return (
        (
          second.confidence ??
          0
        ) -
        (
          first.confidence ??
          0
        )
      )
    },
  )
}

export function generateDecisionActionPlans({
  decision,
  options,
}: {
  decision:
    EducationalDecision

  options?:
    Partial<DecisionActionPlanGenerationOptions>
}): DecisionActionPlanGenerationResult {
  const normalizedOptions =
    normalizeOptions(
      options,
    )

  const warnings:
    string[] = []

  const errors:
    string[] = []

  const recommendations =
    sortRecommendations(
      decision.recommendations,
    )

  if (
    recommendations.length ===
    0
  ) {
    warnings.push(
      'A decisÃ£o nÃ£o possui recomendaÃ§Ãµes para gerar planos de aÃ§Ã£o.',
    )

    return {
      success:
        true,

      decisionId:
        decision.id,

      actionPlans:
        [],

      warnings,

      errors,

      requiresHumanReview:
        decision
          .humanReviewRequired,
    }
  }

  const recommendationGroups =
    groupRecommendations(
      recommendations,
    )

  const actionPlans =
    recommendationGroups
      .slice(
        0,
        normalizedOptions
          .maximumPlansPerDecision,
      )
      .map(
        (
          group,
          index,
        ) =>
          createActionPlan({
            decision,

            title:
              index ===
                0
                ? `Plano de aÃ§Ã£o â ${decision.title}`
                : `Plano complementar ${index + 1} â ${decision.title}`,

            description:
              decision.description,

            objective:
              group[0]
                ?.expectedOutcome ??
              decision.explanation.summary ??
              decision.description,

            recommendations:
              group,

            options:
              normalizedOptions,
          }),
      )

  if (
    recommendationGroups.length >
    actionPlans.length
  ) {
    warnings.push(
      `O resultado foi limitado a ${normalizedOptions.maximumPlansPerDecision} planos de aÃ§Ã£o.`,
    )
  }

  return {
    success:
      errors.length ===
      0,

    decisionId:
      decision.id,

    actionPlans,

    warnings:
      uniqueStrings(
        warnings,
      ),

    errors:
      uniqueStrings(
        errors,
      ),

    requiresHumanReview:
      decision
        .humanReviewRequired ||
      actionPlans.some(
        plan =>
          plan
            .requiresApproval,
      ),
  }
}

export function generateDecisionActionPlansBatch({
  decisions,
  options,
}: {
  decisions:
    EducationalDecision[]

  options?:
    Partial<DecisionActionPlanGenerationOptions>
}): DecisionActionPlanBatchResult {
  const results =
    decisions.map(
      decision =>
        generateDecisionActionPlans({
          decision,
          options,
        }),
    )

  const actionPlans =
    results.flatMap(
      result =>
        result.actionPlans,
    )

  const warnings =
    uniqueStrings(
      results.flatMap(
        result =>
          result.warnings,
      ),
    )

  const errors =
    uniqueStrings(
      results.flatMap(
        result =>
          result.errors,
      ),
    )

  return {
    success:
      errors.length ===
      0,

    results,

    actionPlans,

    warnings,

    errors,

    requiresHumanReview:
      results.some(
        result =>
          result
            .requiresHumanReview,
      ),
  }
}

export function updateDecisionActionStatus({
  action,
  status,
  actualOutcome,
}: {
  action:
    DecisionAction

  status:
    DecisionActionStatus

  actualOutcome?:
    string | null
}): DecisionAction {
  const completed =
    status ===
    'completed'

  const outcomeStatus:
    DecisionOutcomeStatus =
      completed
        ? actualOutcome
          ? 'improved'
          : 'monitoring'
        : action.outcomeStatus

  return {
    ...action,

    status,

    completedAt:
      completed
        ? nowIso()
        : null,

    actualOutcome:
      actualOutcome ??
      action.actualOutcome,

    outcomeStatus,

    metadata: {
      ...action.metadata,

      statusUpdatedAt:
        nowIso(),
    },
  }
}

export function recalculateDecisionActionPlan(
  plan:
    DecisionActionPlan,
): DecisionActionPlan {
  const progress =
    calculateProgress(
      plan.actions,
    )

  const completed =
    progress >=
    100

  return {
    ...plan,

    progress,

    status:
      completed
        ? 'completed'
        : plan.status ===
            'completed'
          ? 'in_progress'
          : plan.status,

    completedAt:
      completed
        ? plan.completedAt ??
          nowIso()
        : null,

    outcomeStatus:
      completed
        ? plan.outcomeStatus ===
            'not_started'
          ? 'monitoring'
          : plan.outcomeStatus
        : plan.outcomeStatus,

    nextReviewAt:
      completed
        ? null
        : plan.nextReviewAt,

    metadata: {
      ...plan.metadata,

      recalculatedAt:
        nowIso(),
    },
  }
}

export function approveDecisionActionPlan({
  plan,
  approvedBy,
}: {
  plan:
    DecisionActionPlan

  approvedBy:
    string
}): DecisionActionPlan {
  return {
    ...plan,

    approved:
      true,

    approvedBy,

    approvedAt:
      nowIso(),

    status:
      plan.status ===
        'generated'
        ? 'approved'
        : plan.status,

    metadata: {
      ...plan.metadata,

      approvalRecordedAt:
        nowIso(),
    },
  }
}

export function applyDecisionActionPlans({
  decision,
  options,
}: {
  decision:
    EducationalDecision

  options?:
    Partial<DecisionActionPlanGenerationOptions>
}): EducationalDecision {
  const generation =
    generateDecisionActionPlans({
      decision,
      options,
    })

  return {
    ...decision,

    actionPlans:
      generation.actionPlans,

    humanReviewRequired:
      decision
        .humanReviewRequired ||
      generation
        .requiresHumanReview,

    updatedAt:
      nowIso(),

    auditTrail: [
      ...decision.auditTrail,

      {
        id:
          createId(
            'audit-action-plan',
          ),

        action:
          'generated',

        actorId:
          null,

        actorType:
          'service',

        occurredAt:
          nowIso(),

        previousStatus:
          decision.status,

        nextStatus:
          decision.status,

        description:
          'Planos de aÃ§Ã£o gerados pelo Decision Action Plan Engine.',

        changes: {
          actionPlanCount:
            generation
              .actionPlans
              .length,

          requiresHumanReview:
            generation
              .requiresHumanReview,
        },

        metadata: {
          engine:
            'decision-action-plan',

          version:
            'v1',

          warnings:
            generation.warnings,
        },
      },
    ],

    metadata: {
      ...decision.metadata,

      actionPlanGeneration: {
        generatedAt:
          nowIso(),

        actionPlanCount:
          generation
            .actionPlans
            .length,

        warnings:
          generation.warnings,

        errors:
          generation.errors,
      },
    },
  }
}

export function createDefaultDecisionActionPlanOptions():
  DecisionActionPlanGenerationOptions {
  return {
    ...DEFAULT_OPTIONS,
  }
}

export const decisionActionPlanService = {
  generate:
    generateDecisionActionPlans,

  generateBatch:
    generateDecisionActionPlansBatch,

  updateActionStatus:
    updateDecisionActionStatus,

  recalculate:
    recalculateDecisionActionPlan,

  approve:
    approveDecisionActionPlan,

  apply:
    applyDecisionActionPlans,

  createDefaultOptions:
    createDefaultDecisionActionPlanOptions,
}
