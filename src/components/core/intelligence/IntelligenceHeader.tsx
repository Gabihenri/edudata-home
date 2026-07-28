import type {
  ReactNode,
} from 'react'

export type IntelligenceSource =
  | 'agenda'
  | 'professor'
  | 'analytics'
  | 'institution'
  | 'platform'

type IntelligenceHeaderProps = {
  source?: IntelligenceSource

  title?: string
  description?: string

  generatedAt?: string | null

  refreshing?: boolean

  onRefresh?: (() => void) | null

  actions?: ReactNode
}

const SOURCE_LABELS:
  Record<
    IntelligenceSource,
    string
  > = {
    agenda:
      'Agenda Inteligente EDI',

    professor:
      'Professor Digital',

    analytics:
      'EduData Analytics',

    institution:
      'Inteligência Institucional',

    platform:
      'EduData IA Platform',
  }

function formatGeneratedAt(
  value?: string | null,
): string {
  if (!value) {
    return 'Análise ainda não gerada'
  }

  const date =
    new Date(
      value,
    )

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return 'Análise atualizada'
  }

  return new Intl.DateTimeFormat(
    'pt-BR',
    {
      dateStyle:
        'short',

      timeStyle:
        'short',
    },
  ).format(
    date,
  )
}

export default function IntelligenceHeader({
  source =
    'platform',

  title =
    'Inteligência EDI',

  description =
    'Análise operacional produzida pelo EIOS a partir de dados autorizados do ecossistema.',

  generatedAt =
    null,

  refreshing =
    false,

  onRefresh =
    null,

  actions,
}: IntelligenceHeaderProps) {
  const sourceLabel =
    SOURCE_LABELS[
      source
    ]

  const generatedAtLabel =
    formatGeneratedAt(
      generatedAt,
    )

  return (
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
        sm:py-7
        lg:px-8
      "
    >
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          inset-0
          overflow-hidden
        "
      >
        <div
          className="
            absolute
            -right-16
            -top-20
            h-56
            w-56
            rounded-full
            border
            border-cyan-400/20
          "
        />

        <div
          className="
            absolute
            -right-6
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

        <div
          className="
            absolute
            right-16
            top-12
            h-2
            w-2
            rotate-45
            border
            border-cyan-300/50
          "
        />

        <div
          className="
            absolute
            right-28
            top-24
            h-1.5
            w-1.5
            rotate-45
            bg-cyan-300/40
          "
        />
      </div>

      <div
        className="
          relative
          z-10
          flex
          flex-col
          gap-6
          lg:flex-row
          lg:items-start
          lg:justify-between
        "
      >
        <div
          className="
            max-w-3xl
          "
        >
          <div
            className="
              mb-4
              flex
              flex-wrap
              items-center
              gap-2
            "
          >
            <span
              className="
                inline-flex
                items-center
                rounded-full
                border
                border-cyan-400/30
                bg-cyan-400/10
                px-3
                py-1
                text-[11px]
                font-semibold
                uppercase
                tracking-[0.18em]
                text-cyan-200
              "
            >
              Core Compartilhado
            </span>

            <span
              className="
                inline-flex
                items-center
                rounded-full
                border
                border-white/10
                bg-white/5
                px-3
                py-1
                text-[11px]
                font-medium
                uppercase
                tracking-[0.14em]
                text-slate-300
              "
            >
              {sourceLabel}
            </span>
          </div>

          <div
            className="
              flex
              items-start
              gap-4
            "
          >
            <div
              aria-hidden="true"
              className="
                mt-1
                hidden
                h-12
                w-12
                shrink-0
                items-center
                justify-center
                rounded-2xl
                border
                border-cyan-300/30
                bg-cyan-400/10
                sm:flex
              "
            >
              <div
                className="
                  relative
                  h-6
                  w-6
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
                    border-cyan-200
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
                    border-cyan-200
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
                    bg-cyan-300
                  "
                />
              </div>
            </div>

            <div>
              <p
                className="
                  mb-2
                  text-xs
                  font-semibold
                  uppercase
                  tracking-[0.2em]
                  text-cyan-300
                "
              >
                Análise produzida pelo EIOS
              </p>

              <h2
                className="
                  text-2xl
                  font-bold
                  tracking-tight
                  text-white
                  sm:text-3xl
                  lg:text-4xl
                "
              >
                {title}
              </h2>

              <p
                className="
                  mt-3
                  max-w-2xl
                  text-sm
                  leading-6
                  text-slate-300
                  sm:text-base
                  sm:leading-7
                "
              >
                {description}
              </p>
            </div>
          </div>
        </div>

        <div
          className="
            flex
            w-full
            flex-col
            gap-3
            sm:w-auto
            sm:min-w-[240px]
            sm:items-end
          "
        >
          <div
            className="
              w-full
              rounded-2xl
              border
              border-white/10
              bg-white/[0.04]
              px-4
              py-3
              sm:w-auto
            "
          >
            <p
              className="
                text-[10px]
                font-semibold
                uppercase
                tracking-[0.16em]
                text-slate-400
              "
            >
              Última atualização
            </p>

            <p
              className="
                mt-1
                text-sm
                font-medium
                text-slate-100
              "
            >
              {generatedAtLabel}
            </p>
          </div>

          <div
            className="
              flex
              w-full
              flex-col
              gap-2
              sm:w-auto
              sm:flex-row
              sm:justify-end
            "
          >
            {actions}

            {onRefresh ? (
              <button
                type="button"
                onClick={
                  onRefresh
                }
                disabled={
                  refreshing
                }
                aria-busy={
                  refreshing
                }
                className="
                  inline-flex
                  min-h-11
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  border
                  border-cyan-300/30
                  bg-cyan-400/10
                  px-4
                  py-2.5
                  text-sm
                  font-semibold
                  text-cyan-100
                  transition
                  hover:border-cyan-200/50
                  hover:bg-cyan-400/20
                  focus-visible:outline-none
                  focus-visible:ring-2
                  focus-visible:ring-cyan-300
                  focus-visible:ring-offset-2
                  focus-visible:ring-offset-slate-950
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              >
                <span
                  aria-hidden="true"
                  className={
                    refreshing
                      ? `
                        h-4
                        w-4
                        animate-spin
                        rounded-full
                        border-2
                        border-cyan-100/30
                        border-t-cyan-100
                      `
                      : `
                        relative
                        h-4
                        w-4
                        rounded-full
                        border
                        border-cyan-200
                        before:absolute
                        before:-right-0.5
                        before:-top-0.5
                        before:h-1.5
                        before:w-1.5
                        before:rotate-45
                        before:border-r
                        before:border-t
                        before:border-cyan-200
                      `
                  }
                />

                {refreshing
                  ? 'Atualizando análise'
                  : 'Atualizar inteligência'}
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div
        className="
          relative
          z-10
          mt-6
          grid
          gap-2
          border-t
          border-white/10
          pt-5
          sm:grid-cols-3
        "
      >
        <div
          className="
            rounded-xl
            bg-white/[0.03]
            px-3
            py-2.5
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
            Fundamento
          </p>

          <p
            className="
              mt-1
              text-sm
              font-medium
              text-slate-200
            "
          >
            Framework EDI
          </p>
        </div>

        <div
          className="
            rounded-xl
            bg-white/[0.03]
            px-3
            py-2.5
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
            Motor
          </p>

          <p
            className="
              mt-1
              text-sm
              font-medium
              text-slate-200
            "
          >
            EDI Intelligence Engine
          </p>
        </div>

        <div
          className="
            rounded-xl
            bg-white/[0.03]
            px-3
            py-2.5
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
            Governança
          </p>

          <p
            className="
              mt-1
              text-sm
              font-medium
              text-slate-200
            "
          >
            Determinística e auditável
          </p>
        </div>
      </div>
    </header>
  )
}