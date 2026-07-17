'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navigationItems = [
  {
    label: 'Dashboard',
    href: '/agenda/dashboard',
  },
  {
    label: 'Calendário',
    href: '/agenda/calendario',
  },
  {
    label: 'Planejamento',
    href: '/agenda/planejamento',
  },
  {
    label: 'Evidências',
    href: '/agenda/evidencias',
  },
  {
    label: 'Tarefas',
    href: '/agenda/tarefas',
  },
  {
    label: 'Turmas',
    href: '/agenda/turmas',
  },
  {
    label: 'Aulas',
    href: '/agenda/aulas',
  },
  {
    label: 'Objetivos',
    href: '/agenda/objetivos',
  },
  {
    label: 'Indicadores',
    href: '/agenda/indicadores',
  },
  {
    label: 'Histórico',
    href: '/agenda/historico',
  },
] as const

export function AgendaNavigation() {
  const pathname = usePathname()

  const currentItem =
    navigationItems.find(
      (item) =>
        pathname === item.href ||
        pathname.startsWith(
          `${item.href}/`,
        ),
    ) ?? navigationItems[0]

  function isItemActive(
    href: string,
  ) {
    return (
      pathname === href ||
      pathname.startsWith(
        `${href}/`,
      )
    )
  }

  function getLinkClassName(
    isActive: boolean,
  ) {
    return [
      'inline-flex min-h-[44px] w-full items-center justify-center rounded-xl border px-3 py-2.5',
      'text-center text-sm font-semibold transition duration-200',
      'focus:outline-none focus:ring-4 focus:ring-cyan-100',
      isActive
        ? 'border-[#0B7491] bg-[#0B7491] text-white shadow-sm'
        : 'border-slate-200 bg-white text-slate-700 hover:border-cyan-300 hover:bg-cyan-50 hover:text-[#075F78]',
    ].join(' ')
  }

  return (
    <nav
      aria-label="Navegação da Agenda Inteligente EDI"
      className="border-b border-slate-200 bg-white"
    >
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="md:hidden">
          <details className="group">
            <summary className="flex min-h-[48px] cursor-pointer list-none items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-800 shadow-sm transition hover:border-cyan-300 focus:outline-none focus:ring-4 focus:ring-cyan-100 [&::-webkit-details-marker]:hidden">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#0B7491]">
                  Agenda EDI
                </p>

                <p className="mt-0.5 truncate text-sm font-bold text-[#081C2E]">
                  {currentItem.label}
                </p>
              </div>

              <span
                aria-hidden="true"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-cyan-200 bg-cyan-50 transition group-open:bg-[#0B7491]"
              >
                <span className="h-2.5 w-2.5 rotate-45 border-b-2 border-r-2 border-[#0B7491] transition group-open:-rotate-135 group-open:border-white" />
              </span>
            </summary>

            <div className="mt-2 grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2.5 shadow-sm">
              {navigationItems.map(
                (item) => {
                  const isActive =
                    isItemActive(
                      item.href,
                    )

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={
                        isActive
                          ? 'page'
                          : undefined
                      }
                      className={getLinkClassName(
                        isActive,
                      )}
                    >
                      {item.label}
                    </Link>
                  )
                },
              )}
            </div>
          </details>
        </div>

        <div className="hidden gap-2 md:grid md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-10">
          {navigationItems.map(
            (item) => {
              const isActive =
                isItemActive(
                  item.href,
                )

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={
                    isActive
                      ? 'page'
                      : undefined
                  }
                  className={getLinkClassName(
                    isActive,
                  )}
                >
                  {item.label}
                </Link>
              )
            },
          )}
        </div>
      </div>
    </nav>
  )
}