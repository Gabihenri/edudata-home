'use client'

import {
  useMemo,
} from 'react'

import {
  useAgendaIntelligence,
} from '@/lib/agenda/hooks/useAgendaIntelligence'

import IntelligenceHeader, {
  type IntelligenceSource,
} from './IntelligenceHeader'

import IntelligenceIndicators from './IntelligenceIndicators'
import IntelligenceInsights from './IntelligenceInsights'
import IntelligenceRecommendations from './IntelligenceRecommendations'
import IntelligenceScore from './IntelligenceScore'

type EDIIntelligencePanelProps = {
  source?: IntelligenceSource
  title?: string
  description?: string
  maximumInsights?: number
  maximumRecommendations?: number
  showHeader?: boolean
  showScore?: boolean
  showIndicators?: boolean
  showInsights?: boolean
  showRecommendations?: boolean
  className?: string
}

type UnknownRecord =
  Record<string, unknown>

function isRecord(
  value: unknown,
): value is UnknownRecord {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  )
}

function numberValue(
  value: unknown,
): number {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value)
  ) {
    return 0
  }

  return value
}

function readNumber(
  record: UnknownRecord,
  key: string,
): number {
  return numberValue(
    record[key],
  )
}

function PanelLoadingState() {
  return (
    <section
      aria-label="Carregando Painel de Inteligência EDI"
      aria-busy="true"
      className="space-y-5"
    >
      <div
        className="
          animate-pulse
          rounded-[28px]
          border
          border-slate-200
          bg-slate-950
          p-6
          sm:p-8
        "
      >
        <div className="h-4 w-40 rounded bg-white/10" />

        <div
          className="
            mt-4
            h-9
            w-72
            max-w-full
            rounded
            bg-white/10
          "
        />

        <div
          className="
            mt-4
            h-4
            w-full
            max-w-2xl
            rounded
            bg-white/5
          "
        />
      </div>

      {Array.from({
        length: 4,
      }).map(
        (
          _,
          index,
        ) => (
          <div
            key={index}
            className="
              h-72
              animate-pulse
              rounded-[28px]
              border
              border-slate-200
              bg-slate-100
            "
          />
        ),
      )}
    </section>
  )
}

function PanelErrorState({
  message,
  onRetry,
}: {
  message: string
  onRetry: () => void
}) {
  return (
    <section
      role="alert"
      className="
        rounded-[28px]
        border
        border-red-200
        bg-white
        p-5
        shadow-sm
        sm:p-7
      "
    >
      <div
        className="
          flex
          flex-col
          gap-5
          sm:flex-row
          sm:items-start
          sm:justify-between
        "
      >
        <div className="flex items-start gap-4">
          <div
            aria-hidden="true"
            className="
              flex
              h-12
              w-12
              shrink-0
              items-center
              justify-center
              rounded-2xl
              border
              border-red-200
              bg-red-50
            "
          >
            <div
              className="
                h-5
                w-5
                rounded-full
                border-2
                border-red-600
                before:mx-auto
                before:mt-1
                before:block
                before:h-2
                before:w-0.5
                before:rounded-full
                before:bg-red-600
                after:mx-auto
                after:mt-1
                after:block
                after:h-0.5
                after:w-0.5
                after:rounded-full
                after:bg-red-600
              "
            />
          </div>

          <div>
            <p
              className="
                text-xs
                font-semibold
                uppercase
                tracking-[0.18em]
                text-red-700
              "
            >
              Inteligência EDI indisponível
            </p>

            <h2
              className="
                mt-1
                text-xl
                font-bold
                tracking-tight
                text-slate-950
              "
            >
              Não foi possível carregar a análise
            </h2>

            <p
              className="
                mt-2
                max-w-2xl
                text-sm
                leading-6
                text-slate-600
              "
            >
              {message}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onRetry}
          className="
            inline-flex
            min-h-11
            items-center
            justify-center
            rounded-xl
            border
            border-slate-300
            bg-white
            px-4
            py-2.5
            text-sm
            font-semibold
            text-slate-800
            transition
            hover:border-cyan-400
            hover:text-cyan-800
            focus-visible:outline-none
            focus-visible:ring-2
            focus-visible:ring-cyan-600
            focus-visible:ring-offset-2
          "
        >
          Tentar novamente
        </button>
      </div>
    </section>
  )
}

function PanelEmptyState({
  onRefresh,
}: {
  onRefresh: () => void
}) {
  return (
    <section
      className="
        rounded-[28px]
        border
        border-slate-200
        bg-white
        px-5
        py-10
        text-center
        shadow-sm
        sm:px-7
      "
    >
      <div
        aria-hidden="true"
        className="
          mx-auto
          flex
          h-16
          w-16
          items-center
          justify-center
          rounded-3xl
          border
          border-cyan-200
          bg-cyan-50
        "
      >
        <div className="relative h-8 w-8">
          <span
            className="
              absolute
              left-0
              top-0
              h-3
              w-3
              border-l-2
              border-t-2
              border-cyan-700
            "
          />

          <span
            className="
              absolute
              bottom-0
              right-0
              h-3
              w-3
              border-b-2
              border-r-2
              border-cyan-700
            "
          />

          <span
            className="
              absolute
              left-1/2
              top-1/2
              h-2.5
              w-2.5
              -translate-x-1/2
              -translate-y-1/2
              rotate-45
              bg-cyan-600
            "
          />
        </div>
      </div>

      <h2
        className="
          mt-5
          text-xl
          font-bold
          tracking-tight
          text-slate-950
        "
      >
        Ainda não há dados suficientes para a análise
      </h2>

      <p
        className="
          mx-auto
          mt-2
          max-w-2xl
          text-sm
          leading-6
          text-slate-600
        "
      >
        Registre planejamentos, objetivos, aulas ou evidências para que o
        EIOS produza indicadores, insights e recomendações contextualizadas.
      </p>

      <button
        type="button"
        onClick={onRefresh}
        className="
          mt-6
          inline-flex
          min-h-11
          items-center
          justify-center
          rounded-xl
          border
          border-cyan-300
          bg-cyan-600
          px-4
          py-2.5
          text-sm
          font-semibold
          text-white
          transition
          hover:bg-cyan-700
          focus-visible:outline-none
          focus-visible:ring-2
          focus-visible:ring-cyan-600
          focus-visible:ring-offset-2
        "
      >
        Atualizar inteligência
      </button>
    </section>
  )
}

export default function EDIIntelligencePanel({
  source = 'agenda',
  title = 'Inteligência EDI',
  description =
    'Análise operacional produzida pelo EIOS a partir dos registros autorizados do ciclo pedagógico.',
  maximumInsights = 6,
  maximumRecommendations = 6,
  showHeader = true,
  showScore = true,
  showIndicators = true,
  showInsights = true,
  showRecommendations = true,
  className = '',
}: EDIIntelligencePanelProps) {
  const {
    intelligence,
    analytics,
    insights,
    recommendations,
    loading,
    refreshing,
    error,
    generatedAt,
    operationalScore,
    reload,
  } = useAgendaIntelligence()

  const analyticsSummary =
    useMemo(
      () =>
        isRecord(
          analytics.summary,
        )
          ? analytics.summary
          : {},
      [
        analytics.summary,
      ],
    )

  const ediIndicators =
    useMemo(
      () =>
        isRecord(
          analytics.edi_indicators,
        )
          ? analytics.edi_indicators
          : {},
      [
        analytics.edi_indicators,
      ],
    )

  const operationalFindings =
    useMemo(
      () =>
        isRecord(
          analytics.operational_findings,
        )
          ? analytics.operational_findings
          : {},
      [
        analytics.operational_findings,
      ],
    )

  const hasOperationalData =
    readNumber(
      analyticsSummary,
      'total_planning',
    ) > 0 ||
    readNumber(
      analyticsSummary,
      'total_objectives',
    ) > 0 ||
    readNumber(
      analyticsSummary,
      'total_lessons',
    ) > 0 ||
    readNumber(
      analyticsSummary,
      'total_evidences',
    ) > 0

  if (
    loading &&
    !intelligence
  ) {
    return (
      <div className={className}>
        <PanelLoadingState />
      </div>
    )
  }

  if (
    error &&
    !intelligence
  ) {
    return (
      <div className={className}>
        <PanelErrorState
          message={error}
          onRetry={
            () => {
              void reload()
            }
          }
        />
      </div>
    )
  }

  if (
    !hasOperationalData
  ) {
    return (
      <div className={className}>
        {showHeader ? (
          <IntelligenceHeader
            source={source}
            title={title}
            description={description}
            generatedAt={generatedAt}
            refreshing={refreshing}
            onRefresh={
              () => {
                void reload()
              }
            }
          />
        ) : null}

        <div
          className={
            showHeader
              ? 'mt-5'
              : ''
          }
        >
          <PanelEmptyState
            onRefresh={
              () => {
                void reload()
              }
            }
          />
        </div>
      </div>
    )
  }

  return (
    <section
      aria-label="Painel de Inteligência EDI"
      className={`
        space-y-5
        ${className}
      `}
    >
      {showHeader ? (
        <IntelligenceHeader
          source={source}
          title={title}
          description={description}
          generatedAt={generatedAt}
          refreshing={refreshing}
          onRefresh={
            () => {
              void reload()
            }
          }
        />
      ) : null}

      {error ? (
        <div
          role="status"
          className="
            rounded-2xl
            border
            border-amber-200
            bg-amber-50
            px-4
            py-3
            text-sm
            text-amber-800
          "
        >
          A análise anterior permanece visível, mas a atualização mais recente
          não foi concluída: {error}
        </div>
      ) : null}

      {showScore ? (
        <IntelligenceScore
          score={operationalScore}
          loading={loading}
          planningRate={
            readNumber(
              ediIndicators,
              'planning_execution_rate',
            )
          }
          executionRate={
            readNumber(
              ediIndicators,
              'execution_rate',
            )
          }
          objectiveRate={
            readNumber(
              ediIndicators,
              'objective_coverage_rate',
            )
          }
          evidenceRate={
            readNumber(
              ediIndicators,
              'evidence_coverage_rate',
            )
          }
        />
      ) : null}

      {showIndicators ? (
        <IntelligenceIndicators
          loading={loading}
          executionRate={
            readNumber(
              ediIndicators,
              'execution_rate',
            )
          }
          evidenceCoverageRate={
            readNumber(
              ediIndicators,
              'evidence_coverage_rate',
            )
          }
          objectiveCoverageRate={
            readNumber(
              ediIndicators,
              'objective_coverage_rate',
            )
          }
          planningExecutionRate={
            readNumber(
              ediIndicators,
              'planning_execution_rate',
            )
          }
          evidenceObjectiveLinkRate={
            readNumber(
              ediIndicators,
              'evidence_objective_link_rate',
            )
          }
          evidenceLessonLinkRate={
            readNumber(
              ediIndicators,
              'evidence_lesson_link_rate',
            )
          }
          totalPlanning={
            readNumber(
              analyticsSummary,
              'total_planning',
            )
          }
          totalLessons={
            readNumber(
              analyticsSummary,
              'total_lessons',
            )
          }
          totalObjectives={
            readNumber(
              analyticsSummary,
              'total_objectives',
            )
          }
          totalEvidences={
            readNumber(
              analyticsSummary,
              'total_evidences',
            )
          }
          totalPendingItems={
            readNumber(
              analyticsSummary,
              'total_pending_items',
            )
          }
          completedLessonsWithoutEvidence={
            readNumber(
              operationalFindings,
              'completed_lessons_without_evidence',
            )
          }
          activeObjectivesWithoutEvidence={
            readNumber(
              operationalFindings,
              'active_objectives_without_evidence',
            )
          }
          planningWithoutLessons={
            readNumber(
              operationalFindings,
              'planning_without_lessons',
            )
          }
          evidencesWithoutObjective={
            readNumber(
              operationalFindings,
              'evidences_without_objective',
            )
          }
        />
      ) : null}

      {showInsights ? (
        <IntelligenceInsights
          insights={insights}
          loading={loading}
          maximumItems={maximumInsights}
        />
      ) : null}

      {showRecommendations ? (
        <IntelligenceRecommendations
          recommendations={recommendations}
          loading={loading}
          maximumItems={maximumRecommendations}
        />
      ) : null}
    </section>
  )
}
