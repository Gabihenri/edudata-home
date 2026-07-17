import type { ReactNode } from 'react'

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
    <section className="mx-auto max-w-6xl">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7 lg:p-8">
        <header className="border-l-4 border-cyan-500 pl-4 sm:pl-5">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#0B7491]">
            {eyebrow}
          </p>

          <h1 className="mt-2 max-w-4xl text-3xl font-bold leading-tight tracking-tight text-[#081C2E] sm:text-4xl">
            {title}
          </h1>

          <p className="mt-3 max-w-4xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
            {description}
          </p>
        </header>

        {children ? (
          <div className="mt-7">
            {children}
          </div>
        ) : null}
      </div>
    </section>
  )
}