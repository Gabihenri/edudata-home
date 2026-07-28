import type {
  CommandCenterMetric,
  CommandCenterPriority,
  CommandCenterPriorityLevel,
} from '@/components/dashboard/CommandCenter'

import type {
  AgendaAnalytics,
  AgendaRecommendation,
} from '@/lib/agenda/hooks/useAgendaIntelligence'

type UnknownRecord =
  Record<string, unknown>

export type CommandCenterViewModel = {
  priorities:
    CommandCenterPriority[]

  metrics:
    CommandCenterMetric[]

  totalEstimatedMinutes:
    number
}

type RecommendationPresentationRule = {
  defaultHref: string
  defaultActionLabel: string
  defaultContextLabel: string
  estimatedMinutes: number
}

const RECOMMENDATION_RULES:
  Record<
    string,
    RecommendationPresentationRule
  > = {
    evidence: {
      defaultHref:
        '/agenda/evidencias',

      defaultActionLabel:
        'Registrar evidência',

      defaultContextLabel:
        'Evidências',

      estimatedMinutes:
        5,
    },

    evidences: {
      defaultHref:
        '/agenda/evidencias',

      defaultActionLabel:
        'Revisar evidências',

      defaultContextLabel:
        'Evidências',

      estimatedMinutes:
        5,
    },

    planning: {
      defaultHref:
        '/agenda/planejamento',

      defaultActionLabel:
        'Abrir planejamento',

      defaultContextLabel:
        'Planejamento',

      estimatedMinutes:
        8,
    },

    objective: {
      defaultHref:
        '/agenda/objetivos',

      defaultActionLabel:
        'Revisar objetivos',

      defaultContextLabel:
        'Objetivos',

      estimatedMinutes:
        6,
    },

    objectives: {
      defaultHref:
        '/agenda/objetivos',

      defaultActionLabel:
        'Revisar objetivos',

      defaultContextLabel:
        'Objetivos',

      estimatedMinutes:
        6,
    },

    lesson: {
      defaultHref:
        '/agenda/aulas',

      defaultActionLabel:
        'Abrir aulas',

      defaultContextLabel:
        'Aulas',

      estimatedMinutes:
        5,
    },

    lessons: {
      defaultHref:
        '/agenda/aulas',

      defaultActionLabel:
        'Abrir aulas',

      defaultContextLabel:
        'Aulas',

      estimatedMinutes:
        5,
    },

    methodology: {
      defaultHref:
        '/agenda/aulas',

      defaultActionLabel:
        'Atualizar metodologia',

      defaultContextLabel:
        'Metodologia',

      estimatedMinutes:
        7,
    },

    operational: {
      defaultHref:
        '/agenda/dashboard',

      defaultActionLabel:
        'Revisar situação',

      defaultContextLabel:
        'Ciclo pedagógico',

      estimatedMinutes:
        5,
    },
  }

const PRIORITY_ORDER:
  Record<
    CommandCenterPriorityLevel,
    number
  > = {
    critical:
      0,

    high:
      1,

    medium:
      2,

    low:
      3,

    positive:
      4,
  }

function isRecord(
  value: unknown,
): value is UnknownRecord {
  return (
    typeof value ===
      'object' &&
    value !== null &&
    !Array.isArray(
      value,
    )
  )
}

function normalizeText(
  value: unknown,
): string {
  if (
    typeof value !==
    'string'
  ) {
    return ''
  }

  return value.trim()
}

function normalizeCode(
  value: unknown,
): string {
  return normalizeText(
    value,
  )
    .toLowerCase()
    .replace(
      /[^a-z0-9._-]/g,
      '',
    )
}

function normalizeNumber(
  value: unknown,
): number {
  if (
    typeof value !==
      'number' ||
    !Number.isFinite(
      value,
    )
  ) {
    return 0
  }

  return value
}

function normalizeCount(
  value: unknown,
): number {
  return Math.max(
    Math.trunc(
      normalizeNumber(
        value,
      ),
    ),
    0,
  )
}

function normalizePercentage(
  value: unknown,
): number {
  return Math.min(
    Math.max(
      normalizeNumber(
        value,
      ),
      0,
    ),
    100,
  )
}

function formatPercentage(
  value: unknown,
): string {
  return `${new Intl.NumberFormat(
    'pt-BR',
    {
      minimumFractionDigits:
        0,

      maximumFractionDigits:
        1,
    },
  ).format(
    normalizePercentage(
      value,
    ),
  )}%`
}

function formatCount(
  value: unknown,
): string {
  return new Intl.NumberFormat(
    'pt-BR',
  ).format(
    normalizeCount(
      value,
    ),
  )
}

function normalizePath(
  value: unknown,
): string | null {
  const path =
    normalizeText(
      value,
    )

  if (
    !path ||
    !path.startsWith(
      '/',
    )
  ) {
    return null
  }

  return path
}

function normalizeRecommendationType(
  recommendation:
    AgendaRecommendation,
): string {
  const type =
    normalizeCode(
      recommendation.type,
    )

  if (type) {
    return type
  }

  const relatedRecordType =
    normalizeCode(
      recommendation
        .related_records
        ?.type,
    )

  if (relatedRecordType) {
    return relatedRecordType
  }

  return 'operational'
}

function resolvePresentationRule(
  recommendation:
    AgendaRecommendation,
): RecommendationPresentationRule {
  const recommendationType =
    normalizeRecommendationType(
      recommendation,
    )

  if (
    recommendationType in
    RECOMMENDATION_RULES
  ) {
    return (
      RECOMMENDATION_RULES[
        recommendationType
      ]
    )
  }

  const code =
    normalizeCode(
      recommendation.code,
    )

  if (
    code.includes(
      'evidence',
    )
  ) {
    return (
      RECOMMENDATION_RULES
        .evidence
    )
  }

  if (
    code.includes(
      'planning',
    )
  ) {
    return (
      RECOMMENDATION_RULES
        .planning
    )
  }

  if (
    code.includes(
      'objective',
    )
  ) {
    return (
      RECOMMENDATION_RULES
        .objective
    )
  }

  if (
    code.includes(
      'lesson',
    )
  ) {
    return (
      RECOMMENDATION_RULES
        .lesson
    )
  }

  if (
    code.includes(
      'methodology',
    )
  ) {
    return (
      RECOMMENDATION_RULES
        .methodology
    )
  }

  return (
    RECOMMENDATION_RULES
      .operational
  )
}

function resolvePriorityLevel(
  recommendation:
    AgendaRecommendation,
): CommandCenterPriorityLevel {
  const severity =
    normalizeCode(
      recommendation.severity,
    )

  const priority =
    normalizeCode(
      recommendation.priority,
    )

  if (
    severity ===
    'critical'
  ) {
    return 'critical'
  }

  if (
    priority ===
      'high' ||
    severity ===
      'warning'
  ) {
    return 'high'
  }

  if (
    priority ===
      'medium' ||
    severity ===
      'attention'
  ) {
    return 'medium'
  }

  if (
    severity ===
      'positive'
  ) {
    return 'positive'
  }

  return 'low'
}

function resolveEstimatedMinutes(
  recommendation:
    AgendaRecommendation,

  rule:
    RecommendationPresentationRule,
): number {
  const relatedRecords =
    resolveRelatedRecordsTotal(
      recommendation,
    )

  if (
    relatedRecords <=
    1
  ) {
    return (
      rule.estimatedMinutes
    )
  }

  const additionalMinutes =
    Math.min(
      (
        relatedRecords -
        1
      ) *
        2,
      20,
    )

  return (
    rule.estimatedMinutes +
    additionalMinutes
  )
}

function resolveRelatedRecordsTotal(
  recommendation:
    AgendaRecommendation,
): number {
  const explicitTotal =
    normalizeCount(
      recommendation
        .related_records
        ?.total,
    )

  if (
    explicitTotal >
    0
  ) {
    return explicitTotal
  }

  const ids =
    recommendation
      .related_records
      ?.ids

  if (
    Array.isArray(
      ids,
    )
  ) {
    return ids.filter(
      id =>
        typeof id ===
          'string' &&
        id.trim(),
    ).length
  }

  return normalizeCount(
    recommendation.value,
  )
}

function resolveHref(
  recommendation:
    AgendaRecommendation,

  rule:
    RecommendationPresentationRule,
): string {
  return (
    normalizePath(
      recommendation
        .destination
        ?.path,
    ) ??
    rule.defaultHref
  )
}

function resolveActionLabel(
  recommendation:
    AgendaRecommendation,

  rule:
    RecommendationPresentationRule,
): string {
  return (
    normalizeText(
      recommendation
        .destination
        ?.action_label,
    ) ||
    rule.defaultActionLabel
  )
}

function resolveContextLabel(
  recommendation:
    AgendaRecommendation,

  rule:
    RecommendationPresentationRule,
): string {
  const relatedRecordType =
    normalizeText(
      recommendation
        .related_records
        ?.type,
    )

  if (
    relatedRecordType
  ) {
    return (
      relatedRecordType
        .charAt(0)
        .toUpperCase() +
      relatedRecordType.slice(
        1,
      )
    )
  }

  return (
    rule.defaultContextLabel
  )
}

function buildPriorityId(
  recommendation:
    AgendaRecommendation,

  index: number,
): string {
  const code =
    normalizeCode(
      recommendation.code,
    )

  if (code) {
    return code
  }

  return (
    `command-center-priority-${index + 1}`
  )
}

function sortPriorities(
  priorities:
    CommandCenterPriority[],
): CommandCenterPriority[] {
  return [
    ...priorities,
  ].sort(
    (
      firstPriority,
      secondPriority,
    ) => {
      const levelDifference =
        PRIORITY_ORDER[
          firstPriority.level
        ] -
        PRIORITY_ORDER[
          secondPriority.level
        ]

      if (
        levelDifference !==
        0
      ) {
        return levelDifference
      }

      const firstMinutes =
        firstPriority
          .estimatedMinutes ??
        Number.MAX_SAFE_INTEGER

      const secondMinutes =
        secondPriority
          .estimatedMinutes ??
        Number.MAX_SAFE_INTEGER

      return (
        firstMinutes -
        secondMinutes
      )
    },
  )
}

export function adaptRecommendationToCommandCenterPriority(
  recommendation:
    AgendaRecommendation,

  index =
    0,
): CommandCenterPriority {
  const rule =
    resolvePresentationRule(
      recommendation,
    )

  const relatedRecordsTotal =
    resolveRelatedRecordsTotal(
      recommendation,
    )

  const title =
    normalizeText(
      recommendation.title,
    ) ||
    normalizeText(
      recommendation
        .recommended_action,
    ) ||
    'Revisar ação pedagógica'

  const description =
    normalizeText(
      recommendation
        .recommended_action,
    ) ||
    normalizeText(
      recommendation.reason,
    ) ||
    'Revise os registros relacionados e atualize o ciclo pedagógico.'

  return {
    id:
      buildPriorityId(
        recommendation,
        index,
      ),

    title,

    description,

    href:
      resolveHref(
        recommendation,
        rule,
      ),

    actionLabel:
      resolveActionLabel(
        recommendation,
        rule,
      ),

    level:
      resolvePriorityLevel(
        recommendation,
      ),

    estimatedMinutes:
      resolveEstimatedMinutes(
        recommendation,
        rule,
      ),

    contextLabel:
      resolveContextLabel(
        recommendation,
        rule,
      ),

    value:
      relatedRecordsTotal >
      0
        ? relatedRecordsTotal
        : null,
  }
}

export function adaptRecommendationsToCommandCenterPriorities(
  recommendations:
    AgendaRecommendation[] =
    [],
): CommandCenterPriority[] {
  const priorities =
    recommendations
      .filter(
        recommendation =>
          isRecord(
            recommendation,
          ),
      )
      .map(
        (
          recommendation,
          index,
        ) =>
          adaptRecommendationToCommandCenterPriority(
            recommendation,
            index,
          ),
      )

  return sortPriorities(
    priorities,
  )
}

export function adaptAnalyticsToCommandCenterMetrics(
  analytics:
    AgendaAnalytics =
    {},
): CommandCenterMetric[] {
  const summary =
    isRecord(
      analytics.summary,
    )
      ? analytics.summary
      : {}

  const indicators =
    isRecord(
      analytics.edi_indicators,
    )
      ? analytics.edi_indicators
      : {}

  return [
    {
      id:
        'operational-score',

      label:
        'Score EDI',

      value:
        formatPercentage(
          indicators
            .operational_score,
        ),

      description:
        'Leitura consolidada do ciclo pedagógico.',
    },
    {
      id:
        'pending-items',

      label:
        'Pendências',

      value:
        formatCount(
          summary
            .total_pending_items,
        ),

      description:
        'Registros que exigem revisão ou complementação.',
    },
    {
      id:
        'execution-rate',

      label:
        'Execução',

      value:
        formatPercentage(
          indicators
            .execution_rate,
        ),

      description:
        'Aulas realizadas em relação ao ciclo ativo.',
    },
    {
      id:
        'evidence-coverage',

      label:
        'Cobertura de evidências',

      value:
        formatPercentage(
          indicators
            .evidence_coverage_rate,
        ),

      description:
        'Aulas realizadas que possuem evidência vinculada.',
    },
  ]
}

export function createCommandCenterViewModel({
  recommendations =
    [],

  analytics =
    {},
}: {
  recommendations?:
    AgendaRecommendation[]

  analytics?:
    AgendaAnalytics
}): CommandCenterViewModel {
  const priorities =
    adaptRecommendationsToCommandCenterPriorities(
      recommendations,
    )

  const metrics =
    adaptAnalyticsToCommandCenterMetrics(
      analytics,
    )

  const totalEstimatedMinutes =
    priorities.reduce(
      (
        total,
        priority,
      ) =>
        total +
        (
          priority
            .estimatedMinutes ??
          0
        ),
      0,
    )

  return {
    priorities,
    metrics,
    totalEstimatedMinutes,
  }
}