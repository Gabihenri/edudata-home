type IntelligenceScoreProps = {
  score: number

  title?: string
  description?: string

  trend?: number | null
  trendLabel?: string

  loading?: boolean

  planningRate?: number
  executionRate?: number
  objectiveRate?: number
  evidenceRate?: number
}

type ScoreClassification = {
  label: string
  description: string
}

type IndicatorItem = {
  label: string
  value: number
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

function formatPercentage(
  value: number,
): string {
  return new Intl.NumberFormat(
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
  )
}

function getScoreClassification(
  score: number,
): ScoreClassification {
  const normalizedScore =
    clampPercentage(
      score,
    )

  if (
    normalizedScore >=
    90
  ) {
    return {
      label:
        'Ciclo amplamente consolidado',

      description:
        'Os registros operacionais apresentam alta consistência entre planejamento, execução, objetivos e evidências.',
    }
  }

  if (
    normalizedScore >=
    75
  ) {
    return {
      label:
        'Ciclo pedagógico consistente',

      description:
        'A operação apresenta boa integração, com oportunidades pontuais de melhoria e replanejamento.',
    }
  }

  if (
    normalizedScore >=
    60
  ) {
    return {
      label:
        'Ciclo em consolidação',

      description:
        'Os principais registros estão presentes, mas ainda existem lacunas que merecem acompanhamento.',
    }
  }

  if (
    normalizedScore >=
    40
  ) {
    return {
      label:
        'Ciclo requer atenção',

      description:
        'Há pendências relevantes que podem comprometer a rastreabilidade do trabalho pedagógico.',
    }
  }

  return {
    label:
      'Ciclo requer intervenção',

    description:
      'É recomendável priorizar planejamento, execução, objetivos e evidências para restabelecer o fluxo operacional.',
  }
}

function getTrendLabel(
  trend: number | null,
  customLabel?: string,
): string | null {
  if (
    trend === null ||
    !Number.isFinite(
      trend,
    )
  ) {
    return null
  }

  if (customLabel) {
    return customLabel
  }

  if (trend > 0) {
    return 'Evolução positiva'
  }

  if (trend < 0) {
    return 'Redução no período'
  }

  return 'Estabilidade no período'
}

function getTrendSymbol(
  trend: number,
): string {
  if (trend > 0) {
    return '↑'
  }

  if (trend < 0) {
    return '↓'
  }

  return '→'
}

function IntelligenceScoreSkeleton() {
  return (
    <section
      aria-label="Carregando score da Inteligência EDI"
      aria-busy="true"
      className="
        animate-pulse
        overflow-hidden
        rounded-[28px]
        border
        border-slate-200
        bg-white
        p-5
        shadow-sm
        sm:p-7
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
          mt-6
          grid
          gap-6
          lg:grid-cols-[220px_1fr]
        "
      >
        <div
          className="
            h-52
            rounded-3xl
            bg-slate-100
          "
        />

        <div
          className="
            space-y-4
          "
        >
          <div
            className="
              h-7
              w-2/3
              rounded
              bg-slate-200
            "
          />

          <div
            className="
              h-4
              w-full
              rounded
              bg-slate-100
            "
          />

          <div
            className="
              h-4
              w-5/6
              rounded
              bg-slate-100
            "
          />

          <div
            className="
              mt-8
              grid
              gap-3
              sm:grid-cols-2
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
                    h-20
                    rounded-2xl
                    bg-slate-100
                  "
                />
              ),
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export default function IntelligenceScore({
  score,

  title =
    'Score Operacional EDI',

  description =
    'Indicador consolidado do ciclo pedagógico, calculado pelo EIOS a partir dos registros autorizados.',

  trend =
    null,

  trendLabel,

  loading =
    false,

  planningRate =
    0,

  executionRate =
    0,

  objectiveRate =
    0,

  evidenceRate =
    0,
}: IntelligenceScoreProps) {
  if (loading) {
    return (
      <IntelligenceScoreSkeleton />
    )
  }

  const normalizedScore =
    clampPercentage(
      score,
    )

  const classification =
    getScoreClassification(
      normalizedScore,
    )

  const normalizedTrend =
    trend !== null &&
    Number.isFinite(
      trend,
    )
      ? trend
      : null

  const resolvedTrendLabel =
    getTrendLabel(
      normalizedTrend,
      trendLabel,
    )

  const indicators:
    IndicatorItem[] = [
      {
        label:
          'Planejamento',

        value:
          clampPercentage(
            planningRate,
          ),
      },
      {
        label:
          'Execução',

        value:
          clampPercentage(
            executionRate,
          ),
      },
      {
        label:
          'Objetivos',

        value:
          clampPercentage(
            objectiveRate,
          ),
      },
      {
        label:
          'Evidências',

        value:
          clampPercentage(
            evidenceRate,
          ),
      },
    ]

  const circumference =
    2 *
    Math.PI *
    54

  const progressOffset =
    circumference -
    (
      normalizedScore /
      100
    ) *
    circumference

  return (
    <section
      aria-labelledby="intelligence-score-title"
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
            gap-2
            sm:flex-row
            sm:items-start
            sm:justify-between
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

            <h3
              id="intelligence-score-title"
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
            </h3>

            <p
              className="
                mt-2
                max-w-2xl
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
              inline-flex
              items-center
              rounded-full
              border
              border-slate-200
              bg-slate-50
              px-3
              py-1.5
              text-xs
              font-semibold
              text-slate-600
            "
          >
            Produzido pelo EIOS
          </div>
        </div>
      </div>

      <div
        className="
          grid
          gap-7
          px-5
          py-6
          sm:px-7
          sm:py-7
          lg:grid-cols-[240px_1fr]
          lg:items-center
        "
      >
        <div
          className="
            flex
            flex-col
            items-center
            justify-center
          "
        >
          <div
            className="
              relative
              flex
              h-52
              w-52
              items-center
              justify-center
            "
          >
            <svg
              aria-hidden="true"
              className="
                h-full
                w-full
                -rotate-90
              "
              viewBox="0 0 128 128"
            >
              <circle
                cx="64"
                cy="64"
                r="54"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="
                  text-slate-100
                "
              />

              <circle
                cx="64"
                cy="64"
                r="54"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={
                  circumference
                }
                strokeDashoffset={
                  progressOffset
                }
                className="
                  text-cyan-600
                  transition-all
                  duration-700
                  ease-out
                "
              />
            </svg>

            <div
              className="
                absolute
                inset-0
                flex
                flex-col
                items-center
                justify-center
                text-center
              "
            >
              <span
                className="
                  text-5xl
                  font-bold
                  tracking-tight
                  text-slate-950
                "
              >
                {formatPercentage(
                  normalizedScore,
                )}
              </span>

              <span
                className="
                  mt-1
                  text-xs
                  font-semibold
                  uppercase
                  tracking-[0.18em]
                  text-slate-500
                "
              >
                de 100
              </span>
            </div>
          </div>

          <div
            className="
              mt-4
              text-center
            "
          >
            <p
              className="
                text-sm
                font-bold
                text-slate-900
              "
            >
              {
                classification.label
              }
            </p>

            {normalizedTrend !==
            null ? (
              <div
                className="
                  mt-2
                  inline-flex
                  items-center
                  gap-2
                  rounded-full
                  border
                  border-slate-200
                  bg-slate-50
                  px-3
                  py-1.5
                "
              >
                <span
                  aria-hidden="true"
                  className="
                    text-sm
                    font-bold
                    text-cyan-700
                  "
                >
                  {getTrendSymbol(
                    normalizedTrend,
                  )}
                </span>

                <span
                  className="
                    text-xs
                    font-semibold
                    text-slate-700
                  "
                >
                  {normalizedTrend >
                  0
                    ? '+'
                    : ''}
                  {formatPercentage(
                    normalizedTrend,
                  )}{' '}
                  pontos
                </span>

                {resolvedTrendLabel ? (
                  <span
                    className="
                      hidden
                      text-xs
                      text-slate-500
                      sm:inline
                    "
                  >
                    {
                      resolvedTrendLabel
                    }
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        <div>
          <div
            className="
              rounded-2xl
              border
              border-slate-200
              bg-slate-50
              px-4
              py-4
              sm:px-5
            "
          >
            <p
              className="
                text-xs
                font-semibold
                uppercase
                tracking-[0.16em]
                text-slate-500
              "
            >
              Leitura operacional
            </p>

            <p
              className="
                mt-2
                text-sm
                leading-6
                text-slate-700
              "
            >
              {
                classification.description
              }
            </p>
          </div>

          <div
            className="
              mt-5
              grid
              gap-3
              sm:grid-cols-2
            "
          >
            {indicators.map(
              indicator => (
                <article
                  key={
                    indicator.label
                  }
                  className="
                    rounded-2xl
                    border
                    border-slate-200
                    bg-white
                    px-4
                    py-4
                  "
                >
                  <div
                    className="
                      flex
                      items-center
                      justify-between
                      gap-3
                    "
                  >
                    <p
                      className="
                        text-sm
                        font-semibold
                        text-slate-800
                      "
                    >
                      {
                        indicator.label
                      }
                    </p>

                    <p
                      className="
                        text-sm
                        font-bold
                        text-slate-950
                      "
                    >
                      {formatPercentage(
                        indicator.value,
                      )}
                      %
                    </p>
                  </div>

                  <div
                    className="
                      mt-3
                      h-2
                      overflow-hidden
                      rounded-full
                      bg-slate-100
                    "
                  >
                    <div
                      aria-hidden="true"
                      className="
                        h-full
                        rounded-full
                        bg-cyan-600
                        transition-all
                        duration-700
                        ease-out
                      "
                      style={{
                        width:
                          `${indicator.value}%`,
                      }}
                    />
                  </div>

                  <p
                    className="
                      mt-2
                      text-xs
                      text-slate-500
                    "
                  >
                    Indicador calculado
                    a partir dos registros
                    do ciclo operacional.
                  </p>
                </article>
              ),
            )}
          </div>
        </div>
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
            O score apoia a decisão
            pedagógica e não substitui
            a análise profissional.
          </p>

          <p
            className="
              font-medium
              text-slate-600
            "
          >
            Determinístico,
            rastreável e auditável
          </p>
        </div>
      </footer>
    </section>
  )
}