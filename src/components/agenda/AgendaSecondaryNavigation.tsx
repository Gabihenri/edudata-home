'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const items = [
  {
    label: 'Diário de Classe',
    href: '/agenda/diario-classe',
  },
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
    label: 'Estudantes',
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
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="mb-2.5 flex items-center gap-3">
          <span className="h-px w-7 shrink-0 bg-[#0B7491]" />
          <p className="whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.18em] text-[#0B7491] sm:text-xs">
            Operação e acompanhamento pedagógico
          </p>
        </div>

        <div className="-mx-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <nav
            aria-label="Ferramentas pedagógicas da Agenda"
            className="flex min-w-max items-center gap-1.5 rounded-2xl border border-slate-200 bg-[#F8FAFC] p-1.5 shadow-[0_8px_28px_-24px_rgba(15,23,42,0.45)]"
          >
            {items.map(item => {
              const active = isActive(pathname, item)

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={[
                    'relative inline-flex h-10 shrink-0 items-center justify-center whitespace-nowrap rounded-xl px-3.5 text-sm font-semibold transition-all duration-200',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B7491] focus-visible:ring-offset-2',
                    active
                      ? 'bg-[#071827] text-white shadow-sm'
                      : 'text-slate-600 hover:bg-white hover:text-[#075F78] hover:shadow-sm',
                  ].join(' ')}
                >
                  {active ? (
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-cyan-300"
                    />
                  ) : null}

                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>

        <p className="mt-1.5 text-[10px] text-slate-400 sm:hidden">
          Deslize para ver todas as ferramentas.
        </p>
      </div>
    </section>
  )
}
