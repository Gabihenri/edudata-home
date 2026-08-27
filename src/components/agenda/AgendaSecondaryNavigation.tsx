'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const items = [
  {
    label: 'Turmas',
    shortLabel: 'Turmas',
    href: '/agenda/turmas',
  },
  {
    label: 'Diário de Classe',
    shortLabel: 'Diário',
    href: '/agenda/diario-classe',
  },
  {
    label: 'Avaliações',
    shortLabel: 'Avaliações',
    href: '/agenda/avaliacoes',
    exact: true,
  },
  {
    label: 'Diagnóstico',
    shortLabel: 'Diagnóstico',
    href: '/agenda/avaliacoes/resultados',
  },
  {
    label: 'Diário de Notas',
    shortLabel: 'Notas',
    href: '/agenda/avaliacoes/notas',
  },
  {
    label: 'Classificação',
    shortLabel: 'Classificação',
    href: '/agenda/avaliacoes/classificacao',
  },
  {
    label: 'Ocorrências',
    shortLabel: 'Ocorrências',
    href: '/agenda/ocorrencias',
  },
  {
    label: 'Casos Pedagógicos',
    shortLabel: 'Casos',
    href: '/agenda/casos',
  },
  {
    label: 'Estudantes',
    shortLabel: 'Estudantes',
    href: '/agenda/caderno',
  },
] as const

function isActive(
  pathname: string,
  item: (typeof items)[number],
) {
  if ('exact' in item && item.exact) {
    return pathname === item.href
  }

  return (
    pathname === item.href ||
    pathname.startsWith(`${item.href}/`)
  )
}

export function AgendaSecondaryNavigation() {
  const pathname = usePathname()

  return (
    <section className="border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="mb-3 flex items-center gap-3">
          <span className="h-px w-7 shrink-0 bg-[#0B7491]" />
          <p className="text-[10px] font-bold uppercase leading-4 tracking-[0.16em] text-[#0B7491] sm:text-xs sm:tracking-[0.18em]">
            Operação e acompanhamento pedagógico
          </p>
        </div>

        <nav
          aria-label="Ferramentas pedagógicas da Agenda"
          className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5"
        >
          {items.map(item => {
            const active = isActive(pathname, item)

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                title={item.label}
                className={[
                  'relative flex min-h-12 min-w-0 items-center justify-center rounded-xl border px-2.5 py-2.5 text-center text-[13px] font-bold leading-4 transition-all duration-200 sm:text-sm',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B7491] focus-visible:ring-offset-2',
                  active
                    ? 'border-[#071827] bg-[#071827] text-white shadow-sm'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-cyan-300 hover:bg-cyan-50 hover:text-[#075F78]',
                ].join(' ')}
              >
                {active ? (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-4 bottom-0 h-0.5 rounded-full bg-cyan-300"
                  />
                ) : null}

                <span className="sm:hidden">
                  {item.shortLabel}
                </span>
                <span className="hidden sm:inline">
                  {item.label}
                </span>
              </Link>
            )
          })}
        </nav>
      </div>
    </section>
  )
}
