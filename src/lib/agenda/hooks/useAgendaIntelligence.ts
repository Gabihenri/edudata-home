'use client'

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'

export type AgendaIntelligenceSeverity =
  | 'critical'
  | 'warning'
  | 'attention'
  | 'opportunity'
  | 'positive'
  | string

export type AgendaIntelligencePriority =
  | 'high'
  | 'medium'
  | 'low'
  | string

export type AgendaIntelligenceImpact =
  | 'high'
  | 'medium'
  | 'low'
  | string

export type AgendaIntelligenceContext =
  Record<string, unknown>

export type AgendaIntelligenceContract =
  Record<string, unknown>

export type AgendaTeacherProfile =
  Record<string, unknown>

export type AgendaAnalyticsSummary = {
  total_planning?: number
  total_objectives?: number
  total_active_objectives?: number
  total_lessons?: number
  total_active_lessons?: number
  total_completed_lessons?: number
  total_cancelled_lessons?: number
  total_evidences?: number
  total_pending_items?: number
  total_protected_evidences?: number
  total_evidences_with_identifiable_minor?: number
  total_agenda_events?: number
  total_users?: number
  total_trainings?: number
  [key: string]:
    unknown
}

export type AgendaEdiIndicators = {
  execution_rate?: number
  evidence_coverage_rate?: number
  objective_coverage_rate?: number
  planning_execution_rate?: number
  evidence_objective_link_rate?: number
  evidence_lesson_link_rate?: number
  operational_score?: number
  evidence_index?: number
  training_index?: number
  agenda_usage_index?: number
  [key: string]:
    unknown
}

export type AgendaOperationalFindings = {
  completed_lessons_without_evidence?: number
  active_objectives_without_evidence?: number
  planning_without_lessons?: number
  evidences_without_objective?: number
  evidences_without_lesson?: number
  completed_lessons_with_evidence?: number
  objectives_with_evidence?: number
  planning_with_lessons?: number
  [key: string]:
    unknown
}

export type AgendaIntelligenceReferences = {
  completed_lesson_ids_without_evidence?: string[]
  objective_ids_without_evidence?: string[]
  planning_ids_without_lessons?: string[]
  evidence_ids_without_objective?: string[]
  evidence_ids_without_lesson?: string[]
  [key: string]:
    unknown
}

export type AgendaAnalytics = {
  context?: AgendaIntelligenceContext
  contract?: AgendaIntelligenceContract
  summary?: AgendaAnalyticsSummary
  edi_indicators?: AgendaEdiIndicators
  operational_findings?: AgendaOperationalFindings
  references?: AgendaIntelligenceReferences
  [key: string]:
    unknown
}

export type AgendaInsightSource = {
  engine?: string
  indicator?: string | null
  module?: string
  legacy?: boolean
  [key: string]:
    unknown
}

export type AgendaIntelligenceDestination = {
  module?: string
  path?: string
  action_label?: string
  [key: string]:
    unknown
}

export type AgendaRelatedRecords = {
  type?: string | null
  ids?: string[]
  total?: number
  [key: string]:
    unknown
}

export type AgendaInsight = {
  code: string
  type: string
  severity: AgendaIntelligenceSeverity
  priority: AgendaIntelligencePriority
  title: string
  description: string
  recommendation: string
  value: number
  value_unit?: string
  source?: AgendaInsightSource
  destination?: AgendaIntelligenceDestination
  related_records?: AgendaRelatedRecords
  [key: string]:
    unknown
}

export type AgendaInsightsSummary = {
  critical?: number
  warning?: number
  attention?: number
  opportunity?: number
  positive?: number
  [key: string]:
    unknown
}

export type AgendaInsights = {
  context?: AgendaIntelligenceContext
  contract?: AgendaIntelligenceContract
  total?: number
  summary?: AgendaInsightsSummary
  insights?: AgendaInsight[]
  [key: string]:
    unknown
}

export type AgendaRecommendationSource = {
  code?: string | null
  indicator?: string | null
  engine?: string
  legacy?: boolean
  [key: string]:
    unknown
}

export type AgendaRecommendation = {
  code: string
  type: string
  priority: AgendaIntelligencePriority
  severity: AgendaIntelligenceSeverity
  title: string
  reason: string
  recommended_action: string
  destination?: AgendaIntelligenceDestination
  estimated_impact?: AgendaIntelligenceImpact
  confidence?: number
  value?: number
  value_unit?: string
  related_records?: AgendaRelatedRecords
  source_insight?: AgendaRecommendationSource
  [key: string]:
    unknown
}

export type AgendaRecommendationsSummary = {
  high_priority?: number
  medium_priority?: number
  low_priority?: number
  high_impact?: number
  [key: string]:
    unknown
}

export type AgendaRecommendations = {
  context?: AgendaIntelligenceContext
  contract?: AgendaIntelligenceContract
  total?: number
  summary?: AgendaRecommendationsSummary
  recommendations?: AgendaRecommendation[]
  [key: string]:
    unknown
}

export type AgendaLearning =
  Record<string, unknown>

export type AgendaIntelligenceData = {
  success: true
  generated_at: string
  module: string
  contract_version: string
  context: AgendaIntelligenceContext
  contract: AgendaIntelligenceContract
  profile: AgendaTeacherProfile
  analytics: AgendaAnalytics
  insights: AgendaInsights
  recommendations: AgendaRecommendations
  learning: AgendaLearning
}

type AgendaIntelligenceErrorResponse = {
  success?: false
  error?: string
  code?: string
  upgradeRequired?: boolean
  access?: Record<
    string,
    unknown
  >
}

type UseAgendaIntelligenceOptions = {
  autoLoad?: boolean
}

type UseAgendaIntelligenceResult = {
  intelligence:
    AgendaIntelligenceData |
    null

  analytics:
    AgendaAnalytics

  insights:
    AgendaInsight[]

  recommendations:
    AgendaRecommendation[]

  loading: boolean
  refreshing: boolean

  error:
    string |
    null

  generatedAt:
    string |
    null

  operationalScore:
    number

  loadIntelligence:
    () => Promise<
      AgendaIntelligenceData |
      null
    >

  reload:
    () => Promise<
      AgendaIntelligenceData |
      null
    >

  clearError:
    () => void
}

function isRecord(
  value: unknown,
): value is
  Record<string, unknown> {
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
): string | null {
  if (
    typeof value !==
    'string'
  ) {
    return null
  }

  const normalizedValue =
    value.trim()

  return (
    normalizedValue ||
    null
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

function normalizeInsight(
  value: unknown,
): AgendaInsight | null {
  if (!isRecord(value)) {
    return null
  }

  const code =
    normalizeText(
      value.code,
    )

  const title =
    normalizeText(
      value.title,
    )

  if (
    !code ||
    !title
  ) {
    return null
  }

  return {
    ...value,

    code,

    type:
      normalizeText(
        value.type,
      ) ??
      'operational',

    severity:
      normalizeText(
        value.severity,
      ) ??
      'attention',

    priority:
      normalizeText(
        value.priority,
      ) ??
      'medium',

    title,

    description:
      normalizeText(
        value.description,
      ) ??
      '',

    recommendation:
      normalizeText(
        value.recommendation,
      ) ??
      '',

    value:
      normalizeNumber(
        value.value,
      ),

    value_unit:
      normalizeText(
        value.value_unit,
      ) ??
      'count',

    source:
      isRecord(
        value.source,
      )
        ? value.source
        : {},

    destination:
      isRecord(
        value.destination,
      )
        ? value.destination
        : {},

    related_records:
      isRecord(
        value.related_records,
      )
        ? value.related_records
        : {},
  }
}

function normalizeRecommendation(
  value: unknown,
): AgendaRecommendation | null {
  if (!isRecord(value)) {
    return null
  }

  const code =
    normalizeText(
      value.code,
    )

  const title =
    normalizeText(
      value.title,
    )

  if (
    !code ||
    !title
  ) {
    return null
  }

  return {
    ...value,

    code,

    type:
      normalizeText(
        value.type,
      ) ??
      'operational',

    priority:
      normalizeText(
        value.priority,
      ) ??
      'medium',

    severity:
      normalizeText(
        value.severity,
      ) ??
      'attention',

    title,

    reason:
      normalizeText(
        value.reason,
      ) ??
      '',

    recommended_action:
      normalizeText(
        value
          .recommended_action,
      ) ??
      '',

    destination:
      isRecord(
        value.destination,
      )
        ? value.destination
        : {},

    estimated_impact:
      normalizeText(
        value
          .estimated_impact,
      ) ??
      'medium',

    confidence:
      normalizeNumber(
        value.confidence,
      ),

    value:
      normalizeNumber(
        value.value,
      ),

    value_unit:
      normalizeText(
        value.value_unit,
      ) ??
      'count',

    related_records:
      isRecord(
        value.related_records,
      )
        ? value.related_records
        : {},

    source_insight:
      isRecord(
        value.source_insight,
      )
        ? value.source_insight
        : {},
  }
}

function parseIntelligenceData(
  value: unknown,
): AgendaIntelligenceData {
  if (!isRecord(value)) {
    throw new Error(
      'A resposta da inteligência possui formato inválido.',
    )
  }

  if (
    value.success !==
    true
  ) {
    throw new Error(
      normalizeText(
        value.error,
      ) ??
      'Não foi possível carregar a inteligência da Agenda.',
    )
  }

  const analytics =
    isRecord(
      value.analytics,
    )
      ? value.analytics
      : {}

  const insights =
    isRecord(
      value.insights,
    )
      ? value.insights
      : {}

  const recommendations =
    isRecord(
      value.recommendations,
    )
      ? value.recommendations
      : {}

  return {
    success:
      true,

    generated_at:
      normalizeText(
        value.generated_at,
      ) ??
      new Date()
        .toISOString(),

    module:
      normalizeText(
        value.module,
      ) ??
      'agenda',

    contract_version:
      normalizeText(
        value
          .contract_version,
      ) ??
      'agenda-operational-v1',

    context:
      isRecord(
        value.context,
      )
        ? value.context
        : {},

    contract:
      isRecord(
        value.contract,
      )
        ? value.contract
        : {},

    profile:
      isRecord(
        value.profile,
      )
        ? value.profile
        : {},

    analytics,

    insights,

    recommendations,

    learning:
      isRecord(
        value.learning,
      )
        ? value.learning
        : {},
  }
}

function extractErrorMessage(
  value: unknown,
  fallback: string,
): string {
  if (!isRecord(value)) {
    return fallback
  }

  return (
    normalizeText(
      value.error,
    ) ??
    normalizeText(
      value.message,
    ) ??
    fallback
  )
}

export function useAgendaIntelligence(
  options:
    UseAgendaIntelligenceOptions =
    {},
): UseAgendaIntelligenceResult {
  const {
    autoLoad =
      true,
  } = options

  const [
    intelligence,
    setIntelligence,
  ] = useState<
    AgendaIntelligenceData |
    null
  >(
    null,
  )

  const [
    loading,
    setLoading,
  ] = useState(
    autoLoad,
  )

  const [
    refreshing,
    setRefreshing,
  ] = useState(
    false,
  )

  const [
    error,
    setError,
  ] = useState<
    string |
    null
  >(
    null,
  )

  const mountedRef =
    useRef(
      true,
    )

  const requestIdRef =
    useRef(
      0,
    )

  const intelligenceRef =
    useRef<
      AgendaIntelligenceData |
      null
    >(
      null,
    )

  const autoLoadStartedRef =
    useRef(
      false,
    )

  useEffect(
    () => {
      mountedRef.current =
        true

      return () => {
        mountedRef.current =
          false

        requestIdRef.current +=
          1
      }
    },
    [],
  )

  const loadIntelligence =
    useCallback(
      async (): Promise<
        AgendaIntelligenceData |
        null
      > => {
        const requestId =
          requestIdRef.current +
          1

        requestIdRef.current =
          requestId

        const isInitialLoad =
          intelligenceRef.current ===
          null

        if (
          mountedRef.current
        ) {
          if (
            isInitialLoad
          ) {
            setLoading(
              true,
            )

            setRefreshing(
              false,
            )
          } else {
            setRefreshing(
              true,
            )
          }

          setError(
            null,
          )
        }

        try {
          const response =
            await fetch(
              '/api/agenda/intelligence',
              {
                method:
                  'GET',

                headers: {
                  Accept:
                    'application/json',
                },

                cache:
                  'no-store',

                credentials:
                  'same-origin',
              },
            )

          let responseBody:
            unknown

          try {
            responseBody =
              await response.json()
          } catch {
            responseBody =
              null
          }

          if (
            !response.ok
          ) {
            throw new Error(
              extractErrorMessage(
                responseBody,
                'Não foi possível carregar a inteligência da Agenda.',
              ),
            )
          }

          const parsedData =
            parseIntelligenceData(
              responseBody,
            )

          if (
            !mountedRef.current ||
            requestId !==
              requestIdRef.current
          ) {
            return null
          }

          intelligenceRef.current =
            parsedData

          setIntelligence(
            parsedData,
          )

          setError(
            null,
          )

          return parsedData
        } catch (
          currentError
        ) {
          const message =
            currentError instanceof
              Error
              ? currentError.message
              : 'Não foi possível carregar a inteligência da Agenda.'

          if (
            mountedRef.current &&
            requestId ===
              requestIdRef.current
          ) {
            setError(
              message,
            )
          }

          return null
        } finally {
          if (
            mountedRef.current &&
            requestId ===
              requestIdRef.current
          ) {
            setLoading(
              false,
            )

            setRefreshing(
              false,
            )
          }
        }
      },
      [],
    )

  useEffect(
    () => {
      if (
        !autoLoad
      ) {
        setLoading(
          false,
        )

        return
      }

      if (
        autoLoadStartedRef.current
      ) {
        return
      }

      autoLoadStartedRef.current =
        true

      void loadIntelligence()
    },
    [
      autoLoad,
      loadIntelligence,
    ],
  )

  const clearError =
    useCallback(
      () => {
        setError(
          null,
        )
      },
      [],
    )

  const analytics =
    intelligence
      ?.analytics ??
    {}

  const insightItems =
    Array.isArray(
      intelligence
        ?.insights
        ?.insights,
    )
      ? intelligence
          ?.insights
          ?.insights
          ?.map(
            normalizeInsight,
          )
          .filter(
            (
              insight,
            ): insight is
              AgendaInsight =>
              Boolean(
                insight,
              ),
          ) ??
        []
      : []

  const recommendationItems =
    Array.isArray(
      intelligence
        ?.recommendations
        ?.recommendations,
    )
      ? intelligence
          ?.recommendations
          ?.recommendations
          ?.map(
            normalizeRecommendation,
          )
          .filter(
            (
              recommendation,
            ): recommendation is
              AgendaRecommendation =>
              Boolean(
                recommendation,
              ),
          ) ??
        []
      : []

  const operationalScore =
    normalizeNumber(
      intelligence
        ?.analytics
        ?.edi_indicators
        ?.operational_score,
    )

  return {
    intelligence,

    analytics,

    insights:
      insightItems,

    recommendations:
      recommendationItems,

    loading,

    refreshing,

    error,

    generatedAt:
      intelligence
        ?.generated_at ??
      null,

    operationalScore,

    loadIntelligence,

    reload:
      loadIntelligence,

    clearError,
  }
}