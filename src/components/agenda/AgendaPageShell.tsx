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
      <div className="rounded-[32px] bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8 lg:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[#6B21A8]">
          {eyebrow}
        </p>

        <h1 className="mt-5 max-w-4xl text-4xl font-bold leading-tight text-[#081C2E] sm:text-5xl">
          {title}
        </h1>

        <p className="mt-6 max-w-4xl text-lg leading-9 text-slate-600 sm:text-[1.45rem]">
          {description}
        </p>

        {children ? <div className="mt-10">{children}</div> : null}
      </div>
    </section>
  )
}
