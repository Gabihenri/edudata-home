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
]

export function AgendaNavigation() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Navegação da Agenda Inteligente EDI"
      className="overflow-x-auto border-b border-slate-200 bg-white"
    >
      <div className="mx-auto flex min-w-max max-w-7xl gap-2 px-6 py-3">
        {navigationItems.map((item) => {
          const isActive =
            pathname === item.href ||
            pathname.startsWith(`${item.href}/`)

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={[
                'rounded-full px-4 py-2 text-sm font-semibold transition',
                isActive
                  ? 'bg-[#5C1A8C] text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950',
              ].join(' ')}
            >
              {item.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}