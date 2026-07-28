import Link from 'next/link'

import type {
  ReactNode,
} from 'react'

export type CommandCenterPriorityLevel =
  | 'critical'
  | 'high'
  | 'medium'
  | 'low'
  | 'positive'

export type CommandCenterPriority = {
  id: string

  title: string
  description: string

  href: string
  actionLabel: string

  level:
    CommandCenterPriorityLevel

  estimatedMinutes?:
    number | null

  contextLabel?:
    string | null

  value?:
    number | null
}

export type CommandCenterMetric = {
  id: string

  label: string
  value: string

  description?: string
}

type CommandCenterProps = {
  userName?: string | null

  date?: Date

  priorities?: CommandCenterPriority[]

  metrics?: CommandCenterMetric[]

  intelligencePanel?: ReactNode

  timeline?: ReactNode

  professorDigital?: ReactNode

  loading?: boolean

  className?: string
}

type PriorityAppearance = {
  label: string

  borderClassName: string
  backgroundClassName: string
  markerClassName: string
  badgeClassName: string
  actionClassName: string
}

const PRIORITY_APPEARANCE:
  Record<
    CommandCenterPriorityLevel,
    PriorityAppearance
  > = {
    critical: {
      label:
        'Crítica',

      borderClassName:
        'border-red-200',

      backgroundClassName:
        'bg-red-50/70',

      markerClassName:
        'bg-red-600',

      badgeClassName:
        'border-red-200 bg-red-50 text-red-700',

      actionClassName:
        'border-red-300 bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600',
    },

    high: {
      label:
        'Alta',

      borderClassName:
        'border-orange-200',

      backgroundClassName:
        'bg-orange-50/70',

      markerClassName:
        'bg-orange-500',

      badgeClassName:
        'border-orange-200 bg-orange-50 text-orange-700',

      actionClassName:
        'border-orange-300 bg-orange-500 text-white hover:bg-orange-600 focus-visible:ring-orange-500',
    },

    medium: {
      label:
        'Média',

      borderClassName:
        'border-amber-200',

      backgroundClassName:
        'bg-amber-50/70',

      markerClassName:
        'bg-amber-500',

      badgeClassName:
        'border-amber-200 bg-amber-50 text-amber-700',

      actionClassName:
        'border-amber-300 bg-amber-500 text-slate-950 hover:bg-amber-600 focus-visible:ring-amber-500',
    },

    low: {
      label:
        'Baixa',

      borderClassName:
        'border-sky-200',

      backgroundClassName:
        'bg-sky-50/70',

      markerClassName:
        'bg-sky-600',

      badgeClassName:
        'border-sky-200 bg-sky-50 text-sky-700',

      actionClassName:
        'border-sky-300 bg-sky-600 text-white hover:bg-sky-700 focus-visible:ring-sky-600',
    },

    positive: {
      label:
        'Concluída',

      borderClassName:
        'border-emerald-200',

      backgroundClassName:
        'bg-emerald-50/70',

      markerClassName:
        'bg-emerald-600',

      badgeClassName:
        'border-emerald-200 bg-emerald-50 text-emerald-700',

      actionClassName:
        'border-emerald-300 bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-600',
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

function normalizeText(
  value:
    string |
    null |
    undefined,
): string {
  if (
    typeof value !==
    'string'
  ) {
    return ''
  }

  return value.trim()
}

function normalizeMinutes(
  value:
    number |
    null |
    undefined,
): number | null {
  if (
    typeof value !==
      'number' ||
    !Number.isFinite(
      value,
    )
  ) {
    return null
  }

  return Math.max(
    Math.trunc(
      value,
    ),
    0,
  )
}

function formatDate(
  date: Date,
): string {
  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return 'Data não informada'
  }

  const formattedDate =
    new Intl.DateTimeFormat(
      'pt-BR',
      {
        weekday:
          'long',

        day:
          '2-digit',

        month:
          'long',
      },
    ).format(
      date,
    )

  return (
    formattedDate
      .charAt(0)
      .toUpperCase() +
    formattedDate.slice(1)
  )
}

function getGreeting(
  date: Date,
): string {
  const hour =
    date.getHours()

  if (
    hour >= 5 &&
    hour < 12
  ) {
    return 'Bom dia'
  }

  if (
    hour >= 12 &&
    hour < 18
  ) {
    return 'Boa tarde'
  }

  return 'Boa noite'
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
      const orderDifference =
        PRIORITY_ORDER[
          firstPriority.level
        ] -
        PRIORITY_ORDER[
          secondPriority.level
        ]

      if (
        orderDifference !==
        0
      ) {
        return orderDifference
      }

      const firstMinutes =
        normalizeMinutes(
          firstPriority
            .estimatedMinutes,
        ) ??
        Number.MAX_SAFE_INTEGER

      const secondMinutes =
        normalizeMinutes(
          secondPriority
            .estimatedMinutes,
        ) ??
        Number.MAX_SAFE_INTEGER

      return (
        firstMinutes -
        secondMinutes
      )
    },
  )
}

function CommandCenterSkeleton() {
  return (
    <section
      aria-label="Carregando Centro de Comando Pedagógico"
      aria-busy="true"
      className="
        space-y-5
        animate-pulse
      "
    >
      <div
        className="
          rounded-[28px]
          border
          border-slate-800
          bg-slate-950
          p-6
          sm:p-8
        "
      >
        <div
          className="
            h-4
            w-32
            rounded
            bg-white/10
          "
        />

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
            w-56
            rounded
            bg-white/5
          "
        />
      </div>

      <div
        className="
          grid
          gap-4
          lg:grid-cols-3
        "
      >
        {Array.from({
          length:
            3,
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
                h-48
                rounded-[24px]
                border
                border-slate-200
                bg-slate-100
              "
            />
          ),
        )}
      </div>
    </section>
  )
}

function PriorityCard({
  priority,
  index,
}: {
  priority:
    CommandCenterPriority

  index: number
}) {
  const appearance =
    PRIORITY_APPEARANCE[
      priority.level
    ]

  const estimatedMinutes =
    normalizeMinutes(
      priority
        .estimatedMinutes,
    )

  const contextLabel =
    normalizeText(
      priority
        .contextLabel,
    )

  return (
    <article
      className={`
        flex
        h-full
        flex-col
        overflow-hidden
        rounded-[24px]
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
                flex
                h-9
                w-9
                shrink-0
                items-center
                justify-center
                rounded-xl
                text-sm
                font-bold
                text-white
                ${appearance.markerClassName}
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
                Prioridade do dia
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
                {priority.title}
              </h3>
            </div>
          </div>

          <span
            className={`
              inline-flex
              shrink-0
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
        </div>

        <p
          className="
            mt-4
            text-sm
            leading-6
            text-slate-700
          "
        >
          {priority.description}
        </p>

        <div
          className="
            mt-5
            flex
            flex-wrap
            gap-2
          "
        >
          {contextLabel ? (
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
              {contextLabel}
            </span>
          ) : null}

          {estimatedMinutes !==
          null ? (
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
              Cerca de{' '}
              {estimatedMinutes}{' '}
              min
            </span>
          ) : null}

          {typeof priority.value ===
            'number' &&
          Number.isFinite(
            priority.value,
          ) ? (
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
                priority.value,
              )}{' '}
              registro(s)
            </span>
          ) : null}
        </div>

        <div
          className="
            mt-auto
            pt-5
          "
        >
          <Link
            href={
              priority.href
            }
            className={`
              inline-flex
              min-h-11
              w-full
              items-center
              justify-center
              rounded-xl
              border
              px-4
              py-2.5
              text-sm
              font-semibold
              transition
              focus-visible:outline-none
              focus-visible:ring-2
              focus-visible:ring-offset-2
              ${appearance.actionClassName}
            `}
          >
            {
              priority
                .actionLabel
            }
          </Link>
        </div>
      </div>
    </article>
  )
}

function CommandCenterEmptyPriorities() {
  return (
    <div
      className="
        rounded-[24px]
        border
        border-emerald-200
        bg-emerald-50
        px-5
        py-7
        text-center
      "
    >
      <div
        aria-hidden="true"
        className="
          mx-auto
          flex
          h-12
          w-12
          items-center
          justify-center
          rounded-2xl
          border
          border-emerald-200
          bg-white
        "
      >
        <div
          className="
            h-5
            w-3
            rotate-45
            border-b-2
            border-r-2
            border-emerald-700
          "
        />
      </div>

      <h3
        className="
          mt-4
          text-lg
          font-bold
          text-slate-950
        "
      >
        Nenhuma prioridade pendente
      </h3>

      <p
        className="
          mx-auto
          mt-2
          max-w-xl
          text-sm
          leading-6
          text-slate-600
        "
      >
        O ciclo analisado não possui ações prioritárias para este momento.
        Continue atualizando seus registros para manter a inteligência do EIOS
        consistente.
      </p>
    </div>
  )
}

export default function CommandCenter({
  userName =
    null,

  date =
    new Date(),

  priorities =
    [],

  metrics =
    [],

  intelligencePanel,

  timeline,

  professorDigital,

  loading =
    false,

  className =
    '',
}: CommandCenterProps) {
  if (loading) {
    return (
      <div
        className={
          className
        }
      >
        <CommandCenterSkeleton />
      </div>
    )
  }

  const normalizedUserName =
    normalizeText(
      userName,
    )

  const orderedPriorities =
    sortPriorities(
      priorities,
    )

  const pendingPriorities =
    orderedPriorities.filter(
      priority =>
        priority.level !==
        'positive',
    )

  const totalEstimatedMinutes =
    pendingPriorities.reduce(
      (
        total,
        priority,
      ) =>
        total +
        (
          normalizeMinutes(
            priority
              .estimatedMinutes,
          ) ??
          0
        ),
      0,
    )

  const greeting =
    getGreeting(
      date,
    )

  return (
    <section
      aria-label="Centro de Comando Pedagógico"
      className={`
        space-y-5
        ${className}
      `}
    >
      <header
        className="
          relative
          overflow-hidden
          rounded-[28px]
          border
          border-slate-800
          bg-slate-950
          px-5
          py-6
          text-white
          shadow-[0_24px_80px_-48px_rgba(15,23,42,0.9)]
          sm:px-7
          sm:py-8
        "
      >
        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            inset-0
          "
        >
          <div
            className="
              absolute
              -right-20
              -top-24
              h-64
              w-64
              rounded-full
              border
              border-cyan-400/20
            "
          />

          <div
            className="
              absolute
              -right-4
              -top-8
              h-36
              w-36
              rounded-full
              border
              border-cyan-300/10
            "
          />

          <div
            className="
              absolute
              bottom-0
              left-0
              h-px
              w-full
              bg-gradient-to-r
              from-transparent
              via-cyan-400/50
              to-transparent
            "
          />
        </div>

        <div
          className="
            relative
            z-10
            grid
            gap-6
            lg:grid-cols-[1fr_auto]
            lg:items-end
          "
        >
          <div>
            <p
              className="
                text-xs
                font-semibold
                uppercase
                tracking-[0.18em]
                text-cyan-300
              "
            >
              Centro de Comando Pedagógico
            </p>

            <h1
              className="
                mt-3
                text-3xl
                font-bold
                tracking-tight
                text-white
                sm:text-4xl
              "
            >
              {greeting}
              {normalizedUserName
                ? `, ${normalizedUserName}`
                : ''}
              .
            </h1>

            <p
              className="
                mt-3
                text-sm
                font-medium
                text-slate-300
                sm:text-base
              "
            >
              {formatDate(
                date,
              )}
            </p>

            <p
              className="
                mt-4
                max-w-2xl
                text-sm
                leading-6
                text-slate-300
                sm:text-base
                sm:leading-7
              "
            >
              O EIOS organizou as informações do ciclo pedagógico para
              destacar o que merece sua atenção primeiro.
            </p>
          </div>

          <div
            className="
              grid
              grid-cols-2
              gap-3
            "
          >
            <div
              className="
                rounded-2xl
                border
                border-white/10
                bg-white/[0.05]
                px-4
                py-4
              "
            >
              <p
                className="
                  text-[10px]
                  font-semibold
                  uppercase
                  tracking-[0.15em]
                  text-slate-400
                "
              >
                Prioridades
              </p>

              <p
                className="
                  mt-1
                  text-3xl
                  font-bold
                  text-white
                "
              >
                {
                  pendingPriorities
                    .length
                }
              </p>
            </div>

            <div
              className="
                rounded-2xl
                border
                border-white/10
                bg-white/[0.05]
                px-4
                py-4
              "
            >
              <p
                className="
                  text-[10px]
                  font-semibold
                  uppercase
                  tracking-[0.15em]
                  text-slate-400
                "
              >
                Tempo estimado
              </p>

              <p
                className="
                  mt-1
                  text-3xl
                  font-bold
                  text-white
                "
              >
                {
                  totalEstimatedMinutes
                }
                <span
                  className="
                    ml-1
                    text-sm
                    font-semibold
                    text-slate-400
                  "
                >
                  min
                </span>
              </p>
            </div>
          </div>
        </div>
      </header>

      {metrics.length >
      0 ? (
        <section
          aria-label="Resumo operacional do dia"
          className="
            grid
            gap-3
            sm:grid-cols-2
            xl:grid-cols-4
          "
        >
          {metrics.map(
            metric => (
              <article
                key={
                  metric.id
                }
                className="
                  rounded-[20px]
                  border
                  border-slate-200
                  bg-white
                  px-4
                  py-4
                  shadow-sm
                "
              >
                <p
                  className="
                    text-[10px]
                    font-semibold
                    uppercase
                    tracking-[0.14em]
                    text-slate-500
                  "
                >
                  {metric.label}
                </p>

                <p
                  className="
                    mt-2
                    text-2xl
                    font-bold
                    tracking-tight
                    text-slate-950
                  "
                >
                  {metric.value}
                </p>

                {metric.description ? (
                  <p
                    className="
                      mt-2
                      text-xs
                      leading-5
                      text-slate-500
                    "
                  >
                    {
                      metric
                        .description
                    }
                  </p>
                ) : null}
              </article>
            ),
          )}
        </section>
      ) : null}

      <section
        aria-labelledby="command-center-priorities"
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
          <p
            className="
              text-xs
              font-semibold
              uppercase
              tracking-[0.18em]
              text-cyan-700
            "
          >
            Próximas ações
          </p>

          <h2
            id="command-center-priorities"
            className="
              mt-1
              text-xl
              font-bold
              tracking-tight
              text-slate-950
              sm:text-2xl
            "
          >
            Prioridades do dia
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
            Ações organizadas por prioridade e tempo estimado, com base nas
            recomendações estruturadas pelo EIOS.
          </p>
        </div>

        <div
          className="
            p-5
            sm:p-7
          "
        >
          {orderedPriorities.length ===
          0 ? (
            <CommandCenterEmptyPriorities />
          ) : (
            <div
              className="
                grid
                gap-4
                lg:grid-cols-2
                xl:grid-cols-3
              "
            >
              {orderedPriorities.map(
                (
                  priority,
                  index,
                ) => (
                  <PriorityCard
                    key={
                      priority.id
                    }
                    priority={
                      priority
                    }
                    index={
                      index
                    }
                  />
                ),
              )}
            </div>
          )}
        </div>
      </section>

      {timeline ||
      professorDigital ? (
        <div
          className="
            grid
            gap-5
            xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]
          "
        >
          {timeline ? (
            <div>
              {timeline}
            </div>
          ) : null}

          {professorDigital ? (
            <div>
              {professorDigital}
            </div>
          ) : null}
        </div>
      ) : null}

      {intelligencePanel ? (
        <div>
          {intelligencePanel}
        </div>
      ) : null}
    </section>
  )
}