'use client'

import Link from 'next/link'
import {
  useEffect,
  useState,
} from 'react'
import {
  usePathname,
} from 'next/navigation'

type NavigationGroup =
  | 'Operação'
  | 'Organização'
  | 'Inteligência'

type NavigationItem = {
  code: string
  label: string
  description: string
  href: string
  group: NavigationGroup
}

const navigationItems:
  NavigationItem[] = [
    {
      code: '01',
      label: 'Dashboard',
      description:
        'Visão geral da operação',
      href:
        '/agenda/dashboard',
      group:
        'Operação',
    },
    {
      code: '02',
      label: 'Calendário',
      description:
        'Compromissos e prazos',
      href:
        '/agenda/calendario',
      group:
        'Operação',
    },
    {
      code: '03',
      label: 'Planejamento',
      description:
        'Planos e ações pedagógicas',
      href:
        '/agenda/planejamento',
      group:
        'Operação',
    },
    {
      code: '04',
      label: 'Evidências',
      description:
        'Registros e arquivos protegidos',
      href:
        '/agenda/evidencias',
      group:
        'Operação',
    },
    {
      code: '05',
      label: 'Tarefas',
      description:
        'Pendências e entregas',
      href:
        '/agenda/tarefas',
      group:
        'Organização',
    },
    {
      code: '06',
      label: 'Turmas',
      description:
        'Contextos de aprendizagem',
      href:
        '/agenda/turmas',
      group:
        'Organização',
    },
    {
      code: '07',
      label: 'Aulas',
      description:
        'Registros de aula',
      href:
        '/agenda/aulas',
      group:
        'Organização',
    },
    {
      code: '08',
      label: 'Objetivos',
      description:
        'Metas e acompanhamento',
      href:
        '/agenda/objetivos',
      group:
        'Inteligência',
    },
    {
      code: '09',
      label: 'Indicadores',
      description:
        'Leitura e análise de dados',
      href:
        '/agenda/indicadores',
      group:
        'Inteligência',
    },
    {
      code: '10',
      label: 'Histórico',
      description:
        'Memória e auditoria',
      href:
        '/agenda/historico',
      group:
        'Inteligência',
    },
  ]

const navigationGroups:
  NavigationGroup[] = [
    'Operação',
    'Organização',
    'Inteligência',
  ]

function isActivePath(
  pathname: string,
  href: string,
): boolean {
  return (
    pathname === href ||
    pathname.startsWith(
      `${href}/`,
    )
  )
}

function getNavigationItemClass(
  active: boolean,
): string {
  return [
    'group flex min-w-[168px] flex-1 items-center gap-3 rounded-xl border px-4 py-3 text-left',
    'transition duration-200 focus:outline-none focus:ring-4 focus:ring-cyan-100',
    active
      ? 'border-[#071827] bg-[#071827] text-white shadow-sm'
      : 'border-slate-200 bg-white text-slate-700 hover:border-cyan-300 hover:bg-cyan-50',
  ].join(' ')
}

export function AgendaNavigation() {
  const pathname =
    usePathname()

  const [
    mobileMenuOpen,
    setMobileMenuOpen,
  ] = useState(false)

  const currentItem =
    navigationItems.find(
      (item) =>
        isActivePath(
          pathname,
          item.href,
        ),
    ) ??
    navigationItems[0]

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  return (
    <nav
      aria-label="Módulos da Agenda Inteligente EDI"
      className="sticky top-20 z-[50] border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-[72px] items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#0B7491] sm:text-xs">
              Módulos operacionais
            </p>

            <div className="mt-1 flex min-w-0 items-center gap-2">
              <span className="shrink-0 font-mono text-xs font-bold text-slate-400">
                {currentItem.code}
              </span>

              <p className="truncate text-sm font-bold text-[#071827] sm:text-base">
                {currentItem.label}
              </p>
            </div>
          </div>

          <button
            type="button"
            aria-expanded={
              mobileMenuOpen
            }
            aria-controls="agenda-mobile-navigation"
            onClick={() =>
              setMobileMenuOpen(
                (current) =>
                  !current,
              )
            }
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-[#075F78] lg:hidden"
          >
            {mobileMenuOpen
              ? 'Fechar módulos'
              : 'Ver módulos'}
          </button>

          <div className="hidden items-center gap-3 lg:flex">
            <Link
              href="/portal"
              className="inline-flex min-h-10 items-center justify-center rounded-lg px-3 py-2 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-[#071827]"
            >
              Central EIOS
            </Link>

            <span
              aria-hidden="true"
              className="h-6 w-px bg-slate-200"
            />

            <p className="text-sm font-semibold text-slate-500">
              Agenda Inteligente EDI
            </p>
          </div>
        </div>

        {mobileMenuOpen ? (
          <div
            id="agenda-mobile-navigation"
            className="border-t border-slate-200 pb-5 pt-4 lg:hidden"
          >
            <div className="space-y-6">
              {navigationGroups.map(
                (group) => {
                  const items =
                    navigationItems.filter(
                      (item) =>
                        item.group ===
                        group,
                    )

                  return (
                    <section
                      key={group}
                    >
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                        {group}
                      </p>

                      <div className="mt-2 grid gap-2 sm:grid-cols-2">
                        {items.map(
                          (item) => {
                            const active =
                              isActivePath(
                                pathname,
                                item.href,
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
                                className={`rounded-xl border p-4 transition ${
                                  active
                                    ? 'border-[#071827] bg-[#071827] text-white'
                                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-cyan-300 hover:bg-cyan-50'
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <span
                                    className={`font-mono text-xs font-bold ${
                                      active
                                        ? 'text-cyan-300'
                                        : 'text-[#0B7491]'
                                    }`}
                                  >
                                    {
                                      item.code
                                    }
                                  </span>

                                  <div className="min-w-0">
                                    <p className="font-bold">
                                      {
                                        item.label
                                      }
                                    </p>

                                    <p
                                      className={`mt-1 text-xs leading-5 ${
                                        active
                                          ? 'text-slate-300'
                                          : 'text-slate-500'
                                      }`}
                                    >
                                      {
                                        item.description
                                      }
                                    </p>
                                  </div>
                                </div>
                              </Link>
                            )
                          },
                        )}
                      </div>
                    </section>
                  )
                },
              )}
            </div>

            <Link
              href="/portal"
              className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Voltar à Central EIOS
            </Link>
          </div>
        ) : null}

        <div className="hidden border-t border-slate-200 py-3 lg:block">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {navigationItems.map(
              (item) => {
                const active =
                  isActivePath(
                    pathname,
                    item.href,
                  )

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={
                      active
                        ? 'page'
                        : undefined
                    }
                    className={getNavigationItemClass(
                      active,
                    )}
                  >
                    <span
                      className={`font-mono text-xs font-bold ${
                        active
                          ? 'text-cyan-300'
                          : 'text-[#0B7491]'
                      }`}
                    >
                      {item.code}
                    </span>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">
                        {item.label}
                      </p>

                      <p
                        className={`mt-0.5 truncate text-[11px] ${
                          active
                            ? 'text-slate-300'
                            : 'text-slate-500 group-hover:text-slate-600'
                        }`}
                      >
                        {item.group}
                      </p>
                    </div>
                  </Link>
                )
              },
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}