import Link from 'next/link'

import type {
  AgendaIntelligenceImpact,
  AgendaIntelligencePriority,
  AgendaIntelligenceSeverity,
  AgendaRecommendation,
} from '@/lib/agenda/hooks/useAgendaIntelligence'

type IntelligenceRecommendationsProps = {
  recommendations?: AgendaRecommendation[]

  loading?: boolean

  maximumItems?: number

  title?: string

  description?: string

  emptyTitle?: string

  emptyDescription?: string
}

type RecommendationAppearance = {
  label: string

  borderClassName: string

  backgroundClassName: string

  badgeClassName: string

  markerClassName: string

  actionClassName: string
}

const PRIORITY_APPEARANCE:
  Record<
    string,
    RecommendationAppearance
  > = {
    high: {
      label:
        'Prioridade alta',

      borderClassName:
        'border-red-200',

      backgroundClassName:
        'bg-red-50/50',

      badgeClassName:
        'border-red-200 bg-red-50 text-red-700',

      markerClassName:
        'bg-red-600',

      actionClassName:
        'border-red-300 bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600',
    },

    medium: {
      label:
        'Prioridade média',

      borderClassName:
        'border-amber-200',

      backgroundClassName:
        'bg-amber-50/50',

      badgeClassName:
        'border-amber-200 bg-amber-50 text-amber-700',

      markerClassName:
        'bg-amber-500',

      actionClassName:
        'border-amber-300 bg-amber-500 text-slate-950 hover:bg-amber-600 focus-visible:ring-amber-500',
    },

    low: {
      label:
        'Prioridade baixa',

      borderClassName:
        'border-sky-200',

      backgroundClassName:
        'bg-sky-50/50',

      badgeClassName:
        'border-sky-200 bg-sky-50 text-sky-700',

      markerClassName:
        'bg-sky-600',

      actionClassName:
        'border-sky-300 bg-sky-600 text-white hover:bg-sky-700 focus-visible:ring-sky-600',
    },
  }

const SEVERITY_LABELS:
  Record<
    string,
    string
  > = {
    critical:
      'Crítico',

    warning:
      'Atenção',

    attention:
      'Em acompanhamento',

    opportunity:
      'Oportunidade',

    positive:
      'Positivo',
  }

const IMPACT_LABELS:
  Record<
    string,
    string
  > = {
    high:
      'Impacto alto',

    medium:
      'Impacto médio',

    low:
      'Impacto baixo',
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

const IMPACT_ORDER:
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
    PRIORITY_APPEARANCE
  ) {
    return normalizedValue
  }

  return 'medium'
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
    SEVERITY_LABELS
  ) {
    return normalizedValue
  }

  return 'attention'
}

function normalizeImpact(
  value:
    AgendaIntelligenceImpact |
    undefined,
): string {
  const normalizedValue =
    normalizeText(
      value,
    ).toLowerCase()

  if (
    normalizedValue in
    IMPACT_LABELS
  ) {
    return normalizedValue
  }

  return 'medium'
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

function normalizeConfidence(
  value: unknown,
): number {
  const normalizedValue =
    normalizeNumber(
      value,
    )

  return Math.min(
    Math.max(
      normalizedValue,
      0,
    ),
    1,
  )
}

function formatConfidence(
  value: number,
): string {
  return `${new Intl.NumberFormat(
    'pt-BR',
    {
      maximumFractionDigits:
        0,
    },
  ).format(
    value *
      100,
  )}%`
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

function getRelatedRecordsTotal(
  recommendation:
    AgendaRecommendation,
): number {
  const explicitTotal =
    normalizeNumber(
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
    return ids.length
  }

  return 0
}

function getDestinationPath(
  recommendation:
    AgendaRecommendation,
): string | null {
  const path =
    normalizeText(
      recommendation
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
  recommendation:
    AgendaRecommendation,
): string {
  return (
    normalizeText(
      recommendation
        .destination
        ?.action_label,
    ) ||
    'Executar ação'
  )
}

function sortRecommendations(
  recommendations:
    AgendaRecommendation[],
): AgendaRecommendation[] {
  return [
    ...recommendations,
  ].sort(
    (
      firstRecommendation,
      secondRecommendation,
    ) => {
      const firstPriority =
        normalizePriority(
          firstRecommendation
            .priority,
        )

      const secondPriority =
        normalizePriority(
          secondRecommendation
            .priority,
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

      const firstSeverity =
        normalizeSeverity(
          firstRecommendation
            .severity,
        )

      const secondSeverity =
        normalizeSeverity(
          secondRecommendation
            .severity,
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

      const firstImpact =
        normalizeImpact(
          firstRecommendation
            .estimated_impact,
        )

      const secondImpact =
        normalizeImpact(
          secondRecommendation
            .estimated_impact,
        )

      const impactDifference =
        (
          IMPACT_ORDER[
            firstImpact
          ] ??
          99
        ) -
        (
          IMPACT_ORDER[
            secondImpact
          ] ??
          99
        )

      if (
        impactDifference !==
        0
      ) {
        return impactDifference
      }

      return (
        normalizeNumber(
          secondRecommendation
            .value,
        ) -
        normalizeNumber(
          firstRecommendation
            .value,
        )
      )
    },
  )
}

function countByPriority(
  recommendations:
    AgendaRecommendation[],
  priority: string,
): number {
  return recommendations.filter(
    recommendation =>
      normalizePriority(
        recommendation
          .priority,
      ) ===
      priority,
  ).length
}

function IntelligenceRecommendationsSkeleton() {
  return (
    <section
      aria-label="Carregando recomendações da Inteligência EDI"
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
            w-44
            rounded
            bg-slate-200
          "
        />

        <div
          className="
            mt-3
            h-7
            w-80
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
          space-y-4
          p-5
          sm:p-7
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
                h-60
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

function IntelligenceRecommendationsEmptyState({
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
            border-emerald-200
            bg-emerald-50
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
                left-1
                top-3
                h-2
                w-3
                -rotate-45
                border-b-2
                border-l-2
                border-emerald-700
              "
            />

            <span
              className="
                absolute
                right-0
                top-1
                h-5
                w-3
                rotate-45
                border-b-2
                border-r-2
                border-emerald-700
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

function RecommendationCard({
  recommendation,
  index,
}: {
  recommendation:
    AgendaRecommendation

  index: number
}) {
  const priority =
    normalizePriority(
      recommendation.priority,
    )

  const severity =
    normalizeSeverity(
      recommendation.severity,
    )

  const impact =
    normalizeImpact(
      recommendation
        .estimated_impact,
    )

  const confidence =
    normalizeConfidence(
      recommendation.confidence,
    )

  const appearance =
    PRIORITY_APPEARANCE[
      priority
    ]

  const destinationPath =
    getDestinationPath(
      recommendation,
    )

  const actionLabel =
    getActionLabel(
      recommendation,
    )

  const relatedRecordsTotal =
    getRelatedRecordsTotal(
      recommendation,
    )

  const reason =
    normalizeText(
      recommendation.reason,
    )

  const recommendedAction =
    normalizeText(
      recommendation
        .recommended_action,
    )

  const sourceInsightCode =
    normalizeText(
      recommendation
        .source_insight
        ?.code,
    )

  const sourceIndicator =
    normalizeText(
      recommendation
        .source_insight
        ?.indicator,
    )

  const value =
    normalizeNumber(
      recommendation.value,
    )

  return (
    <article
      className={`
        overflow-hidden
        rounded-3xl
        border
        ${appearance.borderClassName}
        ${appearance.backgroundClassName}
      `}
    >
      <div
        className="
          grid
          gap-5
          p-5
          sm:p-6
          lg:grid-cols-[1fr_220px]
        "
      >
        <div
          className="
            min-w-0
          "
        >
          <div
            className="
              flex
              items-start
              gap-3
            "
          >
            <div
              aria-hidden="true"
              className={`
                mt-1
                flex
                h-8
                w-8
                shrink-0
                items-center
                justify-center
                rounded-xl
                ${appearance.markerClassName}
                text-sm
                font-bold
                text-white
              `}
            >
              {index + 1}
            </div>

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
                Ação recomendada pelo EIOS
              </p>

              <h3
                className="
                  mt-1
                  text-lg
                  font-bold
                  leading-6
                  text-slate-950
                  sm:text-xl
                "
              >
                {
                  recommendation.title
                }
              </h3>
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
                SEVERITY_LABELS[
                  severity
                ]
              }
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
                IMPACT_LABELS[
                  impact
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

          {reason ? (
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
                Por que esta ação foi recomendada
              </p>

              <p
                className="
                  mt-2
                  text-sm
                  leading-6
                  text-slate-700
                "
              >
                {reason}
              </p>
            </div>
          ) : null}

          {recommendedAction ? (
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
                Próxima ação
              </p>

              <p
                className="
                  mt-2
                  text-sm
                  font-semibold
                  leading-6
                  text-slate-900
                "
              >
                {recommendedAction}
              </p>
            </div>
          ) : null}
        </div>

        <aside
          className="
            flex
            flex-col
            rounded-2xl
            border
            border-white/80
            bg-white/75
            p-4
          "
        >
          <div
            className="
              grid
              grid-cols-2
              gap-3
              lg:grid-cols-1
            "
          >
            <div
              className="
                rounded-xl
                border
                border-slate-200
                bg-slate-50
                px-3
                py-3
              "
            >
              <p
                className="
                  text-[9px]
                  font-semibold
                  uppercase
                  tracking-[0.14em]
                  text-slate-500
                "
              >
                Confiança
              </p>

              <p
                className="
                  mt-1
                  text-xl
                  font-bold
                  text-slate-950
                "
              >
                {formatConfidence(
                  confidence,
                )}
              </p>
            </div>

            <div
              className="
                rounded-xl
                border
                border-slate-200
                bg-slate-50
                px-3
                py-3
              "
            >
              <p
                className="
                  text-[9px]
                  font-semibold
                  uppercase
                  tracking-[0.14em]
                  text-slate-500
                "
              >
                Valor analisado
              </p>

              <p
                className="
                  mt-1
                  text-xl
                  font-bold
                  text-slate-950
                "
              >
                {formatValue(
                  value,
                  recommendation
                    .value_unit,
                )}
              </p>
            </div>
          </div>

          <div
            className="
              mt-4
              rounded-xl
              border
              border-slate-200
              bg-slate-50
              px-3
              py-3
            "
          >
            <p
              className="
                text-[9px]
                font-semibold
                uppercase
                tracking-[0.14em]
                text-slate-500
              "
            >
              Origem da recomendação
            </p>

            <p
              className="
                mt-1
                break-words
                text-xs
                font-medium
                leading-5
                text-slate-700
              "
            >
              {sourceIndicator ||
                sourceInsightCode ||
                'Insight operacional EDI'}
            </p>
          </div>

          {destinationPath ? (
            <Link
              href={
                destinationPath
              }
              className={`
                mt-4
                inline-flex
                min-h-11
                items-center
                justify-center
                rounded-xl
                border
                px-4
                py-2.5
                text-center
                text-sm
                font-semibold
                transition
                focus-visible:outline-none
                focus-visible:ring-2
                focus-visible:ring-offset-2
                ${appearance.actionClassName}
              `}
            >
              {actionLabel}
            </Link>
          ) : null}
        </aside>
      </div>
    </article>
  )
}

export default function IntelligenceRecommendations({
  recommendations =
    [],

  loading =
    false,

  maximumItems =
    6,

  title =
    'Recomendações priorizadas',

  description =
    'Ações sugeridas pelo EIOS a partir dos indicadores e insights do ciclo pedagógico.',

  emptyTitle =
    'Nenhuma ação prioritária identificada',

  emptyDescription =
    'O EIOS não encontrou recomendações que exijam intervenção imediata no conjunto analisado.',
}: IntelligenceRecommendationsProps) {
  if (loading) {
    return (
      <IntelligenceRecommendationsSkeleton />
    )
  }

  const normalizedMaximumItems =
    normalizeMaximumItems(
      maximumItems,
    )

  const orderedRecommendations =
    sortRecommendations(
      recommendations,
    )

  const visibleRecommendations =
    orderedRecommendations.slice(
      0,
      normalizedMaximumItems,
    )

  const hiddenRecommendationsCount =
    Math.max(
      orderedRecommendations.length -
        visibleRecommendations.length,
      0,
    )

  const highPriorityCount =
    countByPriority(
      orderedRecommendations,
      'high',
    )

  const mediumPriorityCount =
    countByPriority(
      orderedRecommendations,
      'medium',
    )

  const lowPriorityCount =
    countByPriority(
      orderedRecommendations,
      'low',
    )

  return (
    <section
      aria-labelledby="intelligence-recommendations-title"
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
              id="intelligence-recommendations-title"
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
                {highPriorityCount}
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
                altas
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
                {mediumPriorityCount}
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
                médias
              </p>
            </div>

            <div
              className="
                min-w-[88px]
                rounded-2xl
                border
                border-sky-200
                bg-sky-50
                px-3
                py-3
                text-center
              "
            >
              <p
                className="
                  text-xl
                  font-bold
                  text-sky-700
                "
              >
                {lowPriorityCount}
              </p>

              <p
                className="
                  mt-1
                  text-[9px]
                  font-semibold
                  uppercase
                  tracking-[0.12em]
                  text-sky-600
                "
              >
                baixas
              </p>
            </div>
          </div>
        </div>
      </div>

      {visibleRecommendations.length ===
      0 ? (
        <IntelligenceRecommendationsEmptyState
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
            space-y-4
            p-5
            sm:p-7
          "
        >
          {visibleRecommendations.map(
            (
              recommendation,
              index,
            ) => (
              <RecommendationCard
                key={
                  recommendation.code
                }
                recommendation={
                  recommendation
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
            As recomendações apoiam a tomada de decisão e não
            substituem o julgamento profissional.
          </p>

          <p
            className="
              font-medium
              text-slate-600
            "
          >
            {hiddenRecommendationsCount >
            0
              ? `${hiddenRecommendationsCount} recomendação(ões) adicional(is) não exibida(s)`
              : `${orderedRecommendations.length} recomendação(ões) analisada(s)`}
          </p>
        </div>
      </footer>
    </section>
  )
}