'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const items = [
  {
    label: 'Avaliações',
    href: '/agenda/avaliacoes',
    exact: true,
  },
  {
    label: 'Diagnóstico',
    href: '/agenda/avaliacoes/resultados',
  },
  {
    label: 'Diário de Notas',
    href: '/agenda/avaliacoes/notas',
  },
  {
    label: 'Classificação',
    href: '/agenda/avaliacoes/classificacao',
  },
  {
    label: 'Ocorrências',
    href: '/agenda/ocorrencias',
  },
  {
    label: 'Casos Pedagógicos',
    href: '/agenda/casos',
  },
  {
    label: 'Caderno Pedagógico',
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
          <span className="h-px w-8 bg-[#0B7491]" />
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#0B7491] sm:text-xs">
            Acompanhamento pedagógico
          </p>
        </div>

        <nav
          aria-label="Ferramentas pedagógicas da Agenda"
          className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-2.5"
        >
          {items.map(item => {
            const active = isActive(pathname, item)

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={[
                  'group relative inline-flex min-h-12 items-center justify-center overflow-hidden rounded-xl border px-4 py-3 text-center text-sm font-bold transition-all duration-200',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B7491] focus-visible:ring-offset-2',
                  active
                    ? 'border-[#0B7491] bg-[#071827] text-white shadow-[0_10px_24px_-16px_rgba(7,24,39,0.9)]'
                    : 'border-slate-200 bg-[#F8FAFC] text-slate-700 hover:-translate-y-px hover:border-cyan-300 hover:bg-cyan-50 hover:text-[#075F78]',
                ].join(' ')}
              >
                {active ? (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 top-0 h-[3px] bg-cyan-300"
                  />
                ) : null}

                <span className="relative">
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
