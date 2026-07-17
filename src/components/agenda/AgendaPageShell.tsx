import type {
  ReactNode,
} from 'react'

type AgendaPageShellProps = {
  eyebrow: string
  title: string
  description: string
  children?: ReactNode
}

export function AgendaPageShell({
  eyebrow,
  title,
  description,
  children,
}: AgendaPageShellProps) {
  return (
    <section className="mx-auto w-full max-w-7xl">
      <header className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#071827] text-white shadow-sm sm:rounded-[2rem]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full border border-cyan-300/15" />

          <div className="absolute -right-6 -top-10 h-40 w-40 rounded-full border border-cyan-300/10" />

          <div className="absolute bottom-0 right-0 h-px w-2/3 bg-gradient-to-l from-cyan-300/30 to-transparent" />

          <div className="absolute bottom-0 right-[18%] h-24 w-px bg-gradient-to-t from-cyan-300/25 to-transparent" />

          <div className="absolute left-0 top-0 h-full w-1.5 bg-[#0B7491]" />
        </div>

        <div className="relative px-6 py-7 sm:px-8 sm:py-9 lg:px-10 lg:py-10">
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] sm:text-xs">
            <span className="text-cyan-300">
              EIOS
            </span>

            <span
              aria-hidden="true"
              className="text-slate-500"
            >
              /
            </span>

            <span className="text-slate-300">
              Agenda Inteligente EDI
            </span>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">
                {eyebrow}
              </p>

              <h1 className="mt-3 max-w-4xl text-3xl font-bold leading-[1.08] tracking-tight text-white sm:text-4xl lg:text-5xl">
                {title}
              </h1>

              <p className="mt-4 max-w-4xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
                {description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap lg:max-w-xs lg:justify-end">
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                  Ambiente
                </p>

                <p className="mt-1 text-sm font-bold text-white">
                  Operacional
                </p>
              </div>

              <div className="rounded-xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-200">
                  Governança
                </p>

                <p className="mt-1 text-sm font-bold text-white">
                  EIOS ativa
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative grid grid-cols-3 border-t border-white/10 bg-white/[0.03]">
          <div className="border-r border-white/10 px-3 py-3 text-center sm:px-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
              Evidências
            </p>
          </div>

          <div className="border-r border-white/10 px-3 py-3 text-center sm:px-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
              Inclusão
            </p>
          </div>

          <div className="px-3 py-3 text-center sm:px-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
              Inteligência
            </p>
          </div>
        </div>
      </header>

      {children ? (
        <div className="mt-6 sm:mt-8">
          {children}
        </div>
      ) : null}
    </section>
  )
}