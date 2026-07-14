'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const items = [
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
]

export function AgendaNavigation() {
  const pathname = usePathname()

  return (
    <nav className="border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {items.map((item) => {
            const isActive = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  'inline-flex min-h-[56px] items-center justify-center rounded-full px-5 py-3 text-center text-base font-semibold transition',
                  isActive
                    ? 'bg-[#6B21A8] text-white shadow-sm'
                    : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 hover:text-slate-900',
                ].join(' ')}
                aria-current={isActive ? 'page' : undefined}
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