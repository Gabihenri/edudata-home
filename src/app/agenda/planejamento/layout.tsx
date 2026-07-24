'use client'

import Link from 'next/link'

import {
  usePathname,
} from 'next/navigation'

import type {
  ReactNode,
} from 'react'

type PlanningLayoutProps = {
  children: ReactNode
}

type PlanningNavigationItem = {
  code: string
  label: string
  description: string
  href: string
  exact: boolean
}

const navigationItems:
  PlanningNavigationItem[] = [
    {
      code:
        '03.1',

      label:
        'Planejamentos',

      description:
        'Registros ativos e arquivados',

      href:
        '/agenda/planejamento',

      exact:
        true,
    },
    {
      code:
        '03.2',

      label:
        'Lixeira',

      description:
        'Excluídos e restauração',

      href:
        '/agenda/planejamento/lixeira',

      exact:
        false,
    },
  ]

function isActivePath(
  pathname: string,
  item:
    PlanningNavigationItem,
): boolean {
  if (item.exact) {
    return (
      pathname ===
      item.href
    )
  }

  return (
    pathname ===
      item.href ||
    pathname.startsWith(
      `${item.href}/`,
    )
  )
}

function getItemClassName(
  active: boolean,
): string {
  return [
    'group flex min-w-0 items-start gap-3 rounded-xl border px-4 py-4',
    'text-left transition duration-200 focus:outline-none focus:ring-4 focus:ring-cyan-100',
    active
      ? 'border-[#071827] bg-[#071827] text-white shadow-sm'
      : 'border-slate-200 bg-white text-slate-700 hover:border-cyan-300 hover:bg-cyan-50',
  ].join(' ')
}

export default function PlanningLayout({
  children,
}: PlanningLayoutProps) {
  const pathname =
    usePathname()

  return (
    <div className="space-y-6 sm:space-y-8">
      <nav
        aria-label="Áreas do módulo de Planejamento"
        className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-50 p-3 shadow-sm sm:p-4"
      >
        <div className="mb-3 px-1">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B7491]">
            Módulo 03 — Planejamento
          </p>

          <p className="mt-1 text-sm leading-6 text-slate-600">
            Gerencie registros disponíveis, exclusões lógicas e restaurações auditáveis.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {navigationItems.map(
            item => {
              const active =
                isActivePath(
                  pathname,
                  item,
                )

              return (
                <Link
                  key={
                    item.href
                  }
                  href={
                    item.href
                  }
                  aria-current={
                    active
                      ? 'page'
                      : undefined
                  }
                  className={
                    getItemClassName(
                      active,
                    )
                  }
                >
                  <span
                    className={`shrink-0 font-mono text-xs font-bold ${
                      active
                        ? 'text-cyan-300'
                        : 'text-[#0B7491]'
                    }`}
                  >
                    {item.code}
                  </span>

                  <span className="min-w-0">
                    <span className="block break-words font-bold">
                      {item.label}
                    </span>

                    <span
                      className={`mt-1 block break-words text-xs leading-5 ${
                        active
                          ? 'text-slate-300'
                          : 'text-slate-500'
                      }`}
                    >
                      {
                        item.description
                      }
                    </span>
                  </span>
                </Link>
              )
            },
          )}
        </div>
      </nav>

      {children}
    </div>
  )
}