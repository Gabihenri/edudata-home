type IntelligenceIndicatorStatus =
  | 'critical'
  | 'warning'
  | 'attention'
  | 'positive'
  | 'neutral'

type IntelligenceIndicator = {
  id: string
  label: string
  value: number
  unit?: 'percent' | 'count'
  description?: string
  status?: IntelligenceIndicatorStatus
}

type IntelligenceIndicatorGroup = {
  id: string
  title: string
  description: string
  indicators: IntelligenceIndicator[]
}

type IntelligenceIndicatorsProps = {
  executionRate?: number
  evidenceCoverageRate?: number
  objectiveCoverageRate?: number
  planningExecutionRate?: number
  evidenceObjectiveLinkRate?: number
  evidenceLessonLinkRate?: number

  totalPlanning?: number
  totalLessons?: number
  totalObjectives?: number
  totalEvidences?: number
  totalPendingItems?: number

  completedLessonsWithoutEvidence?: number
  activeObjectivesWithoutEvidence?: number
  planningWithoutLessons?: number
  evidencesWithoutObjective?: number

  loading?: boolean
}

type StatusAppearance = {
  label: string
  badgeClassName: string
  progressClassName: string
  markerClassName: string
}

const STATUS_APPEARANCE:
  Record<
    IntelligenceIndicatorStatus,
    StatusAppearance
  > = {
    critical: {
      label: 'Crítico',
      badgeClassName:
        'border-red-200 bg-red-50 text-red-700',
      progressClassName:
        'bg-red-600',
      markerClassName:
        'bg-red-600',
    },

    warning: {
      label: 'Atenção',
      badgeClassName:
        'border-amber-200 bg-amber-50 text-amber-700',
      progressClassName:
        'bg-amber-500',
      markerClassName:
        'bg-amber-500',
    },

    attention: {
      label: 'Em acompanhamento',
      badgeClassName:
        'border-sky-200 bg-sky-50 text-sky-700',
      progressClassName:
        'bg-sky-600',
      markerClassName:
        'bg-sky-600',
    },

    positive: {
      label: 'Consistente',
      badgeClassName:
        'border-emerald-200 bg-emerald-50 text-emerald-700',
      progressClassName:
        'bg-emerald-600',
      markerClassName:
        'bg-emerald-600',
    },

    neutral: {
      label: 'Sem referência',
      badgeClassName:
        'border-slate-200 bg-slate-50 text-slate-600',
      progressClassName:
        'bg-slate-400',
      markerClassName:
        'bg-slate-400',
    },
  }

function clampPercentage(
  value: number,
): number {
  if (
    !Number.isFinite(
      value,
    )
  ) {
    return 0
  }

  return Math.min(
    Math.max(
      value,
      0,
    ),
    100,
  )
}

function normalizeCount(
  value: number,
): number {
  if (
    !Number.isFinite(
      value,
    )
  ) {
    return 0
  }

  return Math.max(
    Math.trunc(
      value,
    ),
    0,
  )
}

function formatNumber(
  value: number,
  unit: 'percent' | 'count',
): string {
  if (
    unit ===
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
      clampPercentage(
        value,
      ),
    )}%`
  }

  return new Intl.NumberFormat(
    'pt-BR',
  ).format(
    normalizeCount(
      value,
    ),
  )
}

function getPercentageStatus(
  value: number,
): IntelligenceIndicatorStatus {
  const normalizedValue =
    clampPercentage(
      value,
    )

  if (
    normalizedValue >=
    80
  ) {
    return 'positive'
  }

  if (
    normalizedValue >=
    60
  ) {
    return 'attention'
  }

  if (
    normalizedValue >=
    40
  ) {
    return 'warning'
  }

  return 'critical'
}

function getPendingStatus(
  value: number,
): IntelligenceIndicatorStatus {
  const normalizedValue =
    normalizeCount(
      value,
    )

  if (
    normalizedValue ===
    0
  ) {
    return 'positive'
  }

  if (
    normalizedValue <=
    2
  ) {
    return 'attention'
  }

  if (
    normalizedValue <=
    5
  ) {
    return 'warning'
  }

  return 'critical'
}

function IntelligenceIndicatorsSkeleton() {
  return (
    <section
      aria-label="Carregando indicadores da Inteligência EDI"
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
            w-40
            rounded
            bg-slate-200
          "
        />

        <div
          className="
            mt-3
            h-7
            w-64
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
          gap-5
          p-5
          sm:p-7
          xl:grid-cols-2
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
                rounded-3xl
                border
                border-slate-200
                p-5
              "
            >
              <div
                className="
                  h-5
                  w-32
                  rounded
                  bg-slate-200
                "
              />

              <div
                className="
                  mt-4
                  space-y-3
                "
              >
                {Array.from({
                  length:
                    2,
                }).map(
                  (
                    __,
                    itemIndex,
                  ) => (
                    <div
                      key={
                        itemIndex
                      }
                      className="
                        h-28
                        rounded-2xl
                        bg-slate-100
                      "
                    />
                  ),
                )}
              </div>
            </div>
          ),
        )}
      </div>
    </section>
  )
}

function IndicatorCard({
  indicator,
}: {
  indicator:
    IntelligenceIndicator
}) {
  const unit =
    indicator.unit ??
    'percent'

  const value =
    unit ===
    'percent'
      ? clampPercentage(
          indicator.value,
        )
      : normalizeCount(
          indicator.value,
        )

  const status =
    indicator.status ??
    (
      unit ===
      'percent'
        ? getPercentageStatus(
            value,
          )
        : getPendingStatus(
            value,
          )
    )

  const appearance =
    STATUS_APPEARANCE[
      status
    ]

  return (
    <article
      className="
        rounded-2xl
        border
        border-slate-200
        bg-white
        p-4
        transition
        hover:border-slate-300
        hover:shadow-sm
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
            min-w-0
          "
        >
          <div
            className="
              flex
              items-center
              gap-2
            "
          >
            <span
              aria-hidden="true"
              className={`
                h-2
                w-2
                shrink-0
                rounded-full
                ${appearance.markerClassName}
              `}
            />

            <h4
              className="
                text-sm
                font-semibold
                text-slate-900
              "
            >
              {
                indicator.label
              }
            </h4>
          </div>

          {indicator.description ? (
            <p
              className="
                mt-2
                text-xs
                leading-5
                text-slate-500
              "
            >
              {
                indicator.description
              }
            </p>
          ) : null}
        </div>

        <p
          className="
            shrink-0
            text-xl
            font-bold
            tracking-tight
            text-slate-950
          "
        >
          {formatNumber(
            value,
            unit,
          )}
        </p>
      </div>

      {unit ===
      'percent' ? (
        <div
          className="
            mt-4
          "
        >
          <div
            className="
              h-2
              overflow-hidden
              rounded-full
              bg-slate-100
            "
          >
            <div
              aria-hidden="true"
              className={`
                h-full
                rounded-full
                transition-all
                duration-700
                ease-out
                ${appearance.progressClassName}
              `}
              style={{
                width:
                  `${value}%`,
              }}
            />
          </div>
        </div>
      ) : null}

      <div
        className="
          mt-4
          flex
          items-center
          justify-between
          gap-3
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
          {
            appearance.label
          }
        </span>

        <span
          className="
            text-[10px]
            font-medium
            uppercase
            tracking-[0.12em]
            text-slate-400
          "
        >
          EIOS
        </span>
      </div>
    </article>
  )
}

function IndicatorGroup({
  group,
}: {
  group:
    IntelligenceIndicatorGroup
}) {
  return (
    <section
      aria-labelledby={
        `indicator-group-${group.id}`
      }
      className="
        rounded-3xl
        border
        border-slate-200
        bg-slate-50/60
        p-4
        sm:p-5
      "
    >
      <div
        className="
          border-b
          border-slate-200
          pb-4
        "
      >
        <p
          className="
            text-[10px]
            font-semibold
            uppercase
            tracking-[0.18em]
            text-cyan-700
          "
        >
          Ciclo operacional
        </p>

        <h3
          id={
            `indicator-group-${group.id}`
          }
          className="
            mt-1
            text-lg
            font-bold
            tracking-tight
            text-slate-950
          "
        >
          {
            group.title
          }
        </h3>

        <p
          className="
            mt-2
            text-sm
            leading-6
            text-slate-600
          "
        >
          {
            group.description
          }
        </p>
      </div>

      <div
        className="
          mt-4
          grid
          gap-3
        "
      >
        {group.indicators.map(
          indicator => (
            <IndicatorCard
              key={
                indicator.id
              }
              indicator={
                indicator
              }
            />
          ),
        )}
      </div>
    </section>
  )
}

export default function IntelligenceIndicators({
  executionRate =
    0,

  evidenceCoverageRate =
    0,

  objectiveCoverageRate =
    0,

  planningExecutionRate =
    0,

  evidenceObjectiveLinkRate =
    0,

  evidenceLessonLinkRate =
    0,

  totalPlanning =
    0,

  totalLessons =
    0,

  totalObjectives =
    0,

  totalEvidences =
    0,

  totalPendingItems =
    0,

  completedLessonsWithoutEvidence =
    0,

  activeObjectivesWithoutEvidence =
    0,

  planningWithoutLessons =
    0,

  evidencesWithoutObjective =
    0,

  loading =
    false,
}: IntelligenceIndicatorsProps) {
  if (loading) {
    return (
      <IntelligenceIndicatorsSkeleton />
    )
  }

  const groups:
    IntelligenceIndicatorGroup[] = [
      {
        id:
          'planning',

        title:
          'Planejamento',

        description:
          'Relação entre os planejamentos registrados e sua transformação em ações pedagógicas.',

        indicators: [
          {
            id:
              'planning-execution-rate',

            label:
              'Planejamentos com execução',

            value:
              planningExecutionRate,

            unit:
              'percent',

            description:
              'Percentual de planejamentos que já originaram pelo menos uma aula.',
          },
          {
            id:
              'planning-total',

            label:
              'Planejamentos registrados',

            value:
              totalPlanning,

            unit:
              'count',

            status:
              totalPlanning >
              0
                ? 'positive'
                : 'neutral',

            description:
              'Total de planejamentos ativos considerados na análise.',
          },
          {
            id:
              'planning-without-lessons',

            label:
              'Planejamentos sem aulas',

            value:
              planningWithoutLessons,

            unit:
              'count',

            description:
              'Planejamentos que ainda não foram transformados em aulas.',
          },
        ],
      },

      {
        id:
          'execution',

        title:
          'Execução',

        description:
          'Acompanhamento das aulas realizadas e da continuidade do ciclo operacional.',

        indicators: [
          {
            id:
              'execution-rate',

            label:
              'Taxa de execução das aulas',

            value:
              executionRate,

            unit:
              'percent',

            description:
              'Percentual de aulas realizadas em relação às aulas não canceladas.',
          },
          {
            id:
              'lessons-total',

            label:
              'Aulas registradas',

            value:
              totalLessons,

            unit:
              'count',

            status:
              totalLessons >
              0
                ? 'positive'
                : 'neutral',

            description:
              'Total de aulas ativas analisadas pelo EIOS.',
          },
          {
            id:
              'completed-without-evidence',

            label:
              'Aulas realizadas sem evidências',

            value:
              completedLessonsWithoutEvidence,

            unit:
              'count',

            description:
              'Aulas concluídas que ainda não possuem evidência pedagógica vinculada.',
          },
        ],
      },

      {
        id:
          'objectives',

        title:
          'Objetivos',

        description:
          'Cobertura e rastreabilidade dos objetivos de aprendizagem no ciclo pedagógico.',

        indicators: [
          {
            id:
              'objective-coverage-rate',

            label:
              'Cobertura dos objetivos',

            value:
              objectiveCoverageRate,

            unit:
              'percent',

            description:
              'Percentual de objetivos ativos que possuem evidência principal vinculada.',
          },
          {
            id:
              'objectives-total',

            label:
              'Objetivos registrados',

            value:
              totalObjectives,

            unit:
              'count',

            status:
              totalObjectives >
              0
                ? 'positive'
                : 'neutral',

            description:
              'Total de objetivos considerados no período analisado.',
          },
          {
            id:
              'objectives-without-evidence',

            label:
              'Objetivos sem evidências',

            value:
              activeObjectivesWithoutEvidence,

            unit:
              'count',

            description:
              'Objetivos ativos ainda não documentados por evidências.',
          },
        ],
      },

      {
        id:
          'evidences',

        title:
          'Evidências',

        description:
          'Qualidade dos vínculos entre evidências, aulas e objetivos do trabalho pedagógico.',

        indicators: [
          {
            id:
              'evidence-coverage-rate',

            label:
              'Cobertura de evidências',

            value:
              evidenceCoverageRate,

            unit:
              'percent',

            description:
              'Percentual de aulas realizadas que possuem evidência vinculada.',
          },
          {
            id:
              'evidence-objective-link-rate',

            label:
              'Vínculo com objetivos',

            value:
              evidenceObjectiveLinkRate,

            unit:
              'percent',

            description:
              'Percentual de evidências relacionadas diretamente a um objetivo.',
          },
          {
            id:
              'evidence-lesson-link-rate',

            label:
              'Vínculo com aulas',

            value:
              evidenceLessonLinkRate,

            unit:
              'percent',

            description:
              'Percentual de evidências relacionadas diretamente a uma aula.',
          },
          {
            id:
              'evidences-total',

            label:
              'Evidências registradas',

            value:
              totalEvidences,

            unit:
              'count',

            status:
              totalEvidences >
              0
                ? 'positive'
                : 'neutral',

            description:
              'Total de evidências consideradas na análise operacional.',
          },
          {
            id:
              'evidences-without-objective',

            label:
              'Evidências sem objetivo',

            value:
              evidencesWithoutObjective,

            unit:
              'count',

            description:
              'Evidências sem vínculo direto com um objetivo principal.',
          },
        ],
      },
    ]

  return (
    <section
      aria-labelledby="intelligence-indicators-title"
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
            gap-4
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
              id="intelligence-indicators-title"
              className="
                mt-1
                text-xl
                font-bold
                tracking-tight
                text-slate-950
                sm:text-2xl
              "
            >
              Indicadores do ciclo pedagógico
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
              Leitura estruturada das etapas de planejamento,
              execução, objetivos e evidências, produzida pelo
              EIOS a partir dos registros autorizados.
            </p>
          </div>

          <div
            className="
              inline-flex
              items-center
              justify-between
              gap-5
              rounded-2xl
              border
              border-slate-200
              bg-slate-50
              px-4
              py-3
            "
          >
            <div>
              <p
                className="
                  text-[10px]
                  font-semibold
                  uppercase
                  tracking-[0.16em]
                  text-slate-500
                "
              >
                Pendências operacionais
              </p>

              <p
                className="
                  mt-1
                  text-2xl
                  font-bold
                  text-slate-950
                "
              >
                {formatNumber(
                  totalPendingItems,
                  'count',
                )}
              </p>
            </div>

            <span
              className={`
                rounded-full
                border
                px-3
                py-1.5
                text-xs
                font-semibold
                ${
                  STATUS_APPEARANCE[
                    getPendingStatus(
                      totalPendingItems,
                    )
                  ]
                    .badgeClassName
                }
              `}
            >
              {
                STATUS_APPEARANCE[
                  getPendingStatus(
                    totalPendingItems,
                  )
                ].label
              }
            </span>
          </div>
        </div>
      </div>

      <div
        className="
          grid
          gap-5
          p-5
          sm:p-7
          xl:grid-cols-2
        "
      >
        {groups.map(
          group => (
            <IndicatorGroup
              key={
                group.id
              }
              group={
                group
              }
            />
          ),
        )}
      </div>

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
            Os indicadores apoiam o acompanhamento e o
            replanejamento, sem substituir a análise profissional.
          </p>

          <p
            className="
              font-medium
              text-slate-600
            "
          >
            Framework EDI · EIOS
          </p>
        </div>
      </footer>
    </section>
  )
}