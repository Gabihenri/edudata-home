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
        pathname.startsWith(`${item.href}/`),
    ) ?? navigationItems[0]

  function isItemActive(href: string) {
    return (
      pathname === href ||
      pathname.startsWith(`${href}/`)
    )
  }

  function getLinkClassName(
    isActive: boolean,
  ) {
    return [
      'inline-flex min-h-[48px] w-full items-center justify-center rounded-2xl border px-4 py-3',
      'text-center text-sm font-semibold transition',
      'focus:outline-none focus:ring-4 focus:ring-purple-200',
      isActive
        ? 'border-[#6B21A8] bg-[#6B21A8] text-white shadow-sm'
        : 'border-slate-200 bg-white text-slate-700 hover:border-purple-300 hover:bg-purple-50 hover:text-[#6B21A8]',
    ].join(' ')
  }

  return (
    <nav
      aria-label="Navegação da Agenda Inteligente EDI"
      className="border-b border-slate-200 bg-white shadow-sm"
    >
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        {/* Navegação para celular */}
        <div className="md:hidden">
          <details className="group">
            <summary className="flex min-h-[54px] cursor-pointer list-none items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 text-slate-800 transition hover:border-purple-300 [&::-webkit-details-marker]:hidden">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                  Módulo atual
                </p>

                <p className="mt-1 truncate text-base font-bold text-[#081C2E]">
                  {currentItem.label}
                </p>
              </div>

              <span
                aria-hidden="true"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#6B21A8] text-xl font-bold text-white transition group-open:rotate-180"
              >
                ↓
              </span>
            </summary>

            <div className="mt-3 grid grid-cols-2 gap-2 rounded-3xl border border-slate-200 bg-slate-50 p-3">
              {navigationItems.map((item) => {
                const isActive =
                  isItemActive(item.href)

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
              })}
            </div>
          </details>
        </div>

        {/* Navegação para tablet e computador */}
        <div className="hidden gap-3 md:grid md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-10">
          {navigationItems.map((item) => {
            const isActive =
              isItemActive(item.href)

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
          })}
        </div>
      </div>
    </nav>
  )
}