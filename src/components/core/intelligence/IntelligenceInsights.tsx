import Link from 'next/link'

import type {
  AgendaInsight,
  AgendaIntelligencePriority,
  AgendaIntelligenceSeverity,
} from '@/lib/agenda/hooks/useAgendaIntelligence'

type IntelligenceInsightsProps = {
  insights?: AgendaInsight[]

  loading?: boolean

  maximumItems?: number

  title?: string

  description?: string

  emptyTitle?: string

  emptyDescription?: string
}

type InsightAppearance = {
  label: string

  borderClassName: string

  backgroundClassName: string

  badgeClassName: string

  markerClassName: string

  valueClassName: string
}

const SEVERITY_APPEARANCE:
  Record<
    string,
    InsightAppearance
  > = {
    critical: {
      label:
        'Crítico',

      borderClassName:
        'border-red-200',

      backgroundClassName:
        'bg-red-50/60',

      badgeClassName:
        'border-red-200 bg-red-50 text-red-700',

      markerClassName:
        'bg-red-600',

      valueClassName:
        'text-red-700',
    },

    warning: {
      label:
        'Atenção',

      borderClassName:
        'border-amber-200',

      backgroundClassName:
        'bg-amber-50/60',

      badgeClassName:
        'border-amber-200 bg-amber-50 text-amber-700',

      markerClassName:
        'bg-amber-500',

      valueClassName:
        'text-amber-700',
    },

    attention: {
      label:
        'Acompanhamento',

      borderClassName:
        'border-sky-200',

      backgroundClassName:
        'bg-sky-50/60',

      badgeClassName:
        'border-sky-200 bg-sky-50 text-sky-700',

      markerClassName:
        'bg-sky-600',

      valueClassName:
        'text-sky-700',
    },

    opportunity: {
      label:
        'Oportunidade',

      borderClassName:
        'border-violet-200',

      backgroundClassName:
        'bg-violet-50/60',

      badgeClassName:
        'border-violet-200 bg-violet-50 text-violet-700',

      markerClassName:
        'bg-violet-600',

      valueClassName:
        'text-violet-700',
    },

    positive: {
      label:
        'Positivo',

      borderClassName:
        'border-emerald-200',

      backgroundClassName:
        'bg-emerald-50/60',

      badgeClassName:
        'border-emerald-200 bg-emerald-50 text-emerald-700',

      markerClassName:
        'bg-emerald-600',

      valueClassName:
        'text-emerald-700',
    },
  }

const PRIORITY_LABELS:
  Record<
    string,
    string
  > = {
    high:
      'Prioridade alta',

    medium:
      'Prioridade média',

    low:
      'Prioridade baixa',
  }

const SEVERITY_ORDER:
  Record<
    string,
    number
  > = {
    critical:
      0,

    warning:
      1,

    attention:
      2,

    opportunity:
      3,

    positive:
      4,
  }

const PRIORITY_ORDER:
  Record<
    string,
    number
  > = {
    high:
      0,

    medium:
      1,

    low:
      2,
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

function normalizeSeverity(
  value:
    AgendaIntelligenceSeverity,
): string {
  const normalizedValue =
    normalizeText(
      value,
    ).toLowerCase()

  if (
    normalizedValue in
    SEVERITY_APPEARANCE
  ) {
    return normalizedValue
  }

  return 'attention'
}

function normalizePriority(
  value:
    AgendaIntelligencePriority,
): string {
  const normalizedValue =
    normalizeText(
      value,
    ).toLowerCase()

  if (
    normalizedValue in
    PRIORITY_LABELS
  ) {
    return normalizedValue
  }

  return 'medium'
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

function normalizeMaximumItems(
  value: number,
): number {
  if (
    !Number.isFinite(
      value,
    )
  ) {
    return 6
  }

  return Math.min(
    Math.max(
      Math.trunc(
        value,
      ),
      1,
    ),
    20,
  )
}

function formatValue(
  value: number,
  unit?: string,
): string {
  const normalizedUnit =
    normalizeText(
      unit,
    ).toLowerCase()

  if (
    normalizedUnit ===
    'percent'
  ) {
    return `${new Intl.NumberFormat(
      'pt-BR',
      {
        minimumFractionDigits:
          0,

        maximumFractionDigits:
          1,
      },
    ).format(
      value,
    )}%`
  }

  return new Intl.NumberFormat(
    'pt-BR',
    {
      minimumFractionDigits:
        0,

      maximumFractionDigits:
        1,
    },
  ).format(
    value,
  )
}

function sortInsights(
  insights: AgendaInsight[],
): AgendaInsight[] {
  return [
    ...insights,
  ].sort(
    (
      firstInsight,
      secondInsight,
    ) => {
      const firstSeverity =
        normalizeSeverity(
          firstInsight.severity,
        )

      const secondSeverity =
        normalizeSeverity(
          secondInsight.severity,
        )

      const severityDifference =
        (
          SEVERITY_ORDER[
            firstSeverity
          ] ??
          99
        ) -
        (
          SEVERITY_ORDER[
            secondSeverity
          ] ??
          99
        )

      if (
        severityDifference !==
        0
      ) {
        return severityDifference
      }

      const firstPriority =
        normalizePriority(
          firstInsight.priority,
        )

      const secondPriority =
        normalizePriority(
          secondInsight.priority,
        )

      const priorityDifference =
        (
          PRIORITY_ORDER[
            firstPriority
          ] ??
          99
        ) -
        (
          PRIORITY_ORDER[
            secondPriority
          ] ??
          99
        )

      if (
        priorityDifference !==
        0
      ) {
        return priorityDifference
      }

      return (
        normalizeNumber(
          secondInsight.value,
        ) -
        normalizeNumber(
          firstInsight.value,
        )
      )
    },
  )
}

function countBySeverity(
  insights: AgendaInsight[],
  severity: string,
): number {
  return insights.filter(
    insight =>
      normalizeSeverity(
        insight.severity,
      ) ===
      severity,
  ).length
}

function getRelatedRecordsTotal(
  insight: AgendaInsight,
): number {
  const explicitTotal =
    normalizeNumber(
      insight
        .related_records
        ?.total,
    )

  if (
    explicitTotal >
    0
  ) {
    return explicitTotal
  }

  const relatedIds =
    insight
      .related_records
      ?.ids

  if (
    Array.isArray(
      relatedIds,
    )
  ) {
    return relatedIds.length
  }

  return 0
}

function getDestinationPath(
  insight: AgendaInsight,
): string | null {
  const path =
    normalizeText(
      insight
        .destination
        ?.path,
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

function getActionLabel(
  insight: AgendaInsight,
): string {
  return (
    normalizeText(
      insight
        .destination
        ?.action_label,
    ) ||
    'Abrir módulo'
  )
}

function IntelligenceInsightsSkeleton() {
  return (
    <section
      aria-label="Carregando insights da Inteligência EDI"
      aria-busy="true"
      className="
        animate-pulse
        overflow-hidden
        rounded-[28px]
        border
        border-slate-200
        bg-white
        shadow-sm
      "
    >
      <div
        className="
          border-b
          border-slate-100
          px-5
          py-5
          sm:px-7
        "
      >
        <div
          className="
            h-4
            w-36
            rounded
            bg-slate-200
          "
        />

        <div
          className="
            mt-3
            h-7
            w-72
            max-w-full
            rounded
            bg-slate-200
          "
        />

        <div
          className="
            mt-3
            h-4
            w-full
            max-w-2xl
            rounded
            bg-slate-100
          "
        />
      </div>

      <div
        className="
          grid
          gap-4
          p-5
          sm:p-7
          lg:grid-cols-2
        "
      >
        {Array.from({
          length:
            4,
        }).map(
          (
            _,
            index,
          ) => (
            <div
              key={
                index
              }
              className="
                h-64
                rounded-3xl
                bg-slate-100
              "
            />
          ),
        )}
      </div>
    </section>
  )
}

function IntelligenceInsightsEmptyState({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div
      className="
        px-5
        py-10
        sm:px-7
      "
    >
      <div
        className="
          mx-auto
          max-w-xl
          rounded-3xl
          border
          border-dashed
          border-slate-300
          bg-slate-50
          px-6
          py-9
          text-center
        "
      >
        <div
          aria-hidden="true"
          className="
            mx-auto
            flex
            h-14
            w-14
            items-center
            justify-center
            rounded-2xl
            border
            border-cyan-200
            bg-cyan-50
          "
        >
          <div
            className="
              relative
              h-7
              w-7
            "
          >
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
                h-2
                w-2
                -translate-x-1/2
                -translate-y-1/2
                rotate-45
                bg-cyan-600
              "
            />
          </div>
        </div>

        <h3
          className="
            mt-5
            text-lg
            font-bold
            text-slate-950
          "
        >
          {title}
        </h3>

        <p
          className="
            mt-2
            text-sm
            leading-6
            text-slate-600
          "
        >
          {description}
        </p>
      </div>
    </div>
  )
}

function InsightCard({
  insight,
  index,
}: {
  insight: AgendaInsight
  index: number
}) {
  const severity =
    normalizeSeverity(
      insight.severity,
    )

  const priority =
    normalizePriority(
      insight.priority,
    )

  const appearance =
    SEVERITY_APPEARANCE[
      severity
    ]

  const destinationPath =
    getDestinationPath(
      insight,
    )

  const actionLabel =
    getActionLabel(
      insight,
    )

  const relatedRecordsTotal =
    getRelatedRecordsTotal(
      insight,
    )

  const value =
    normalizeNumber(
      insight.value,
    )

  const description =
    normalizeText(
      insight.description,
    )

  const recommendation =
    normalizeText(
      insight.recommendation,
    )

  return (
    <article
      className={`
        flex
        h-full
        flex-col
        overflow-hidden
        rounded-3xl
        border
        ${appearance.borderClassName}
        ${appearance.backgroundClassName}
      `}
    >
      <div
        className="
          flex
          flex-1
          flex-col
          p-5
          sm:p-6
        "
      >
        <div
          className="
            flex
            items-start
            justify-between
            gap-4
          "
        >
          <div
            className="
              flex
              min-w-0
              items-start
              gap-3
            "
          >
            <div
              aria-hidden="true"
              className={`
                mt-1
                h-3
                w-3
                shrink-0
                rounded-sm
                ${appearance.markerClassName}
              `}
            />

            <div
              className="
                min-w-0
              "
            >
              <p
                className="
                  text-[10px]
                  font-semibold
                  uppercase
                  tracking-[0.16em]
                  text-slate-500
                "
              >
                Insight EDI {index + 1}
              </p>

              <h3
                className="
                  mt-1
                  text-lg
                  font-bold
                  leading-6
                  text-slate-950
                "
              >
                {insight.title}
              </h3>
            </div>
          </div>

          <div
            className="
              shrink-0
              text-right
            "
          >
            <p
              className={`
                text-2xl
                font-bold
                tracking-tight
                ${appearance.valueClassName}
              `}
            >
              {formatValue(
                value,
                insight.value_unit,
              )}
            </p>

            <p
              className="
                mt-0.5
                text-[10px]
                font-medium
                uppercase
                tracking-[0.12em]
                text-slate-500
              "
            >
              valor analisado
            </p>
          </div>
        </div>

        <div
          className="
            mt-4
            flex
            flex-wrap
            gap-2
          "
        >
          <span
            className={`
              inline-flex
              items-center
              rounded-full
              border
              px-2.5
              py-1
              text-[10px]
              font-semibold
              uppercase
              tracking-[0.12em]
              ${appearance.badgeClassName}
            `}
          >
            {appearance.label}
          </span>

          <span
            className="
              inline-flex
              items-center
              rounded-full
              border
              border-slate-200
              bg-white/70
              px-2.5
              py-1
              text-[10px]
              font-semibold
              uppercase
              tracking-[0.12em]
              text-slate-600
            "
          >
            {
              PRIORITY_LABELS[
                priority
              ]
            }
          </span>

          {relatedRecordsTotal >
          0 ? (
            <span
              className="
                inline-flex
                items-center
                rounded-full
                border
                border-slate-200
                bg-white/70
                px-2.5
                py-1
                text-[10px]
                font-semibold
                uppercase
                tracking-[0.12em]
                text-slate-600
              "
            >
              {new Intl.NumberFormat(
                'pt-BR',
              ).format(
                relatedRecordsTotal,
              )}{' '}
              registro(s)
            </span>
          ) : null}
        </div>

        {description ? (
          <div
            className="
              mt-5
              rounded-2xl
              border
              border-white/80
              bg-white/70
              px-4
              py-4
            "
          >
            <p
              className="
                text-[10px]
                font-semibold
                uppercase
                tracking-[0.16em]
                text-slate-500
              "
            >
              O que o EIOS identificou
            </p>

            <p
              className="
                mt-2
                text-sm
                leading-6
                text-slate-700
              "
            >
              {description}
            </p>
          </div>
        ) : null}

        {recommendation ? (
          <div
            className="
              mt-4
            "
          >
            <p
              className="
                text-[10px]
                font-semibold
                uppercase
                tracking-[0.16em]
                text-cyan-800
              "
            >
              Orientação operacional
            </p>

            <p
              className="
                mt-2
                text-sm
                font-medium
                leading-6
                text-slate-800
              "
            >
              {recommendation}
            </p>
          </div>
        ) : null}

        <div
          className="
            mt-auto
            pt-5
          "
        >
          <div
            className="
              flex
              flex-col
              gap-3
              border-t
              border-slate-200/70
              pt-4
              sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >
            <div>
              <p
                className="
                  text-[10px]
                  font-semibold
                  uppercase
                  tracking-[0.14em]
                  text-slate-400
                "
              >
                Origem
              </p>

              <p
                className="
                  mt-1
                  text-xs
                  font-medium
                  text-slate-600
                "
              >
                {normalizeText(
                  insight
                    .source
                    ?.indicator,
                ) ||
                  'Indicador operacional EDI'}
              </p>
            </div>

            {destinationPath ? (
              <Link
                href={
                  destinationPath
                }
                className="
                  inline-flex
                  min-h-10
                  items-center
                  justify-center
                  rounded-xl
                  border
                  border-slate-300
                  bg-white
                  px-4
                  py-2
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
                {actionLabel}
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  )
}

export default function IntelligenceInsights({
  insights =
    [],

  loading =
    false,

  maximumItems =
    6,

  title =
    'Insights do EIOS',

  description =
    'Interpretações estruturadas do ciclo pedagógico, ordenadas por severidade, prioridade e impacto operacional.',

  emptyTitle =
    'Nenhum insight prioritário identificado',

  emptyDescription =
    'O EIOS não encontrou situações que exijam atenção no conjunto de dados analisado.',
}: IntelligenceInsightsProps) {
  if (loading) {
    return (
      <IntelligenceInsightsSkeleton />
    )
  }

  const normalizedMaximumItems =
    normalizeMaximumItems(
      maximumItems,
    )

  const orderedInsights =
    sortInsights(
      insights,
    )

  const visibleInsights =
    orderedInsights.slice(
      0,
      normalizedMaximumItems,
    )

  const hiddenInsightsCount =
    Math.max(
      orderedInsights.length -
        visibleInsights.length,
      0,
    )

  const criticalCount =
    countBySeverity(
      orderedInsights,
      'critical',
    )

  const warningCount =
    countBySeverity(
      orderedInsights,
      'warning',
    )

  const positiveCount =
    countBySeverity(
      orderedInsights,
      'positive',
    )

  return (
    <section
      aria-labelledby="intelligence-insights-title"
      className="
        overflow-hidden
        rounded-[28px]
        border
        border-slate-200
        bg-white
        shadow-[0_20px_70px_-50px_rgba(15,23,42,0.55)]
      "
    >
      <div
        className="
          border-b
          border-slate-100
          px-5
          py-5
          sm:px-7
        "
      >
        <div
          className="
            flex
            flex-col
            gap-5
            lg:flex-row
            lg:items-start
            lg:justify-between
          "
        >
          <div>
            <p
              className="
                text-xs
                font-semibold
                uppercase
                tracking-[0.18em]
                text-cyan-700
              "
            >
              Inteligência EDI
            </p>

            <h2
              id="intelligence-insights-title"
              className="
                mt-1
                text-xl
                font-bold
                tracking-tight
                text-slate-950
                sm:text-2xl
              "
            >
              {title}
            </h2>

            <p
              className="
                mt-2
                max-w-3xl
                text-sm
                leading-6
                text-slate-600
              "
            >
              {description}
            </p>
          </div>

          <div
            className="
              grid
              grid-cols-3
              gap-2
            "
          >
            <div
              className="
                min-w-[88px]
                rounded-2xl
                border
                border-red-200
                bg-red-50
                px-3
                py-3
                text-center
              "
            >
              <p
                className="
                  text-xl
                  font-bold
                  text-red-700
                "
              >
                {criticalCount}
              </p>

              <p
                className="
                  mt-1
                  text-[9px]
                  font-semibold
                  uppercase
                  tracking-[0.12em]
                  text-red-600
                "
              >
                críticos
              </p>
            </div>

            <div
              className="
                min-w-[88px]
                rounded-2xl
                border
                border-amber-200
                bg-amber-50
                px-3
                py-3
                text-center
              "
            >
              <p
                className="
                  text-xl
                  font-bold
                  text-amber-700
                "
              >
                {warningCount}
              </p>

              <p
                className="
                  mt-1
                  text-[9px]
                  font-semibold
                  uppercase
                  tracking-[0.12em]
                  text-amber-600
                "
              >
                atenção
              </p>
            </div>

            <div
              className="
                min-w-[88px]
                rounded-2xl
                border
                border-emerald-200
                bg-emerald-50
                px-3
                py-3
                text-center
              "
            >
              <p
                className="
                  text-xl
                  font-bold
                  text-emerald-700
                "
              >
                {positiveCount}
              </p>

              <p
                className="
                  mt-1
                  text-[9px]
                  font-semibold
                  uppercase
                  tracking-[0.12em]
                  text-emerald-600
                "
              >
                positivos
              </p>
            </div>
          </div>
        </div>
      </div>

      {visibleInsights.length ===
      0 ? (
        <IntelligenceInsightsEmptyState
          title={
            emptyTitle
          }
          description={
            emptyDescription
          }
        />
      ) : (
        <div
          className="
            grid
            gap-4
            p-5
            sm:p-7
            xl:grid-cols-2
          "
        >
          {visibleInsights.map(
            (
              insight,
              index,
            ) => (
              <InsightCard
                key={
                  insight.code
                }
                insight={
                  insight
                }
                index={
                  index
                }
              />
            ),
          )}
        </div>
      )}

      <footer
        className="
          border-t
          border-slate-100
          bg-slate-50/70
          px-5
          py-4
          sm:px-7
        "
      >
        <div
          className="
            flex
            flex-col
            gap-2
            text-xs
            text-slate-500
            sm:flex-row
            sm:items-center
            sm:justify-between
          "
        >
          <p>
            Insights determinísticos,
            rastreáveis e derivados dos
            indicadores produzidos pelo EIOS.
          </p>

          <p
            className="
              font-medium
              text-slate-600
            "
          >
            {hiddenInsightsCount >
            0
              ? `${hiddenInsightsCount} insight(s) adicional(is) não exibido(s)`
              : `${orderedInsights.length} insight(s) analisado(s)`}
          </p>
        </div>
      </footer>
    </section>
  )
}