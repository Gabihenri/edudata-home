'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

type NavigationItem = {
  code: string
  label: string
  href: string
  description: string
}

const primaryItems: NavigationItem[] = [
  {
    code: '01',
    label: 'Início',
    href: '/agenda/dashboard',
    description: 'Visão geral da Agenda',
  },
  {
    code: '02',
    label: 'Calendário',
    href: '/agenda/calendario',
    description: 'Compromissos e prazos',
  },
  {
    code: '03',
    label: 'Planejar',
    href: '/agenda/planejamento',
    description: 'Planejamento pedagógico',
  },
  {
    code: '04',
    label: 'Diário',
    href: '/agenda/diario-classe',
    description: 'Diário de Classe unificado',
  },
]

const menuGroups = [
  {
    title: 'Operação',
    items: [
      {
        code: '01',
        label: 'Dashboard',
        href: '/agenda/dashboard',
        description: 'Visão geral da operação',
      },
      {
        code: '02',
        label: 'Calendário',
        href: '/agenda/calendario',
        description: 'Compromissos e prazos',
      },
      {
        code: '03',
        label: 'Planejamento',
        href: '/agenda/planejamento',
        description: 'Planos e ações pedagógicas',
      },
      {
        code: '04',
        label: 'Diário de Classe',
        href: '/agenda/diario-classe',
        description: 'Frequência e registros em uma única lista',
      },
      {
        code: '05',
        label: 'Evidências',
        href: '/agenda/evidencias',
        description: 'Registros pedagógicos e evidências',
      },
      {
        code: '06',
        label: 'Tarefas',
        href: '/agenda/tarefas',
        description: 'Pendências e entregas',
      },
    ],
  },
  {
    title: 'Turmas e acompanhamento',
    items: [
      {
        code: '07',
        label: 'Turmas',
        href: '/agenda/turmas',
        description: 'Turmas e contextos de aprendizagem',
      },
      {
        code: '08',
        label: 'Aulas',
        href: '/agenda/aulas',
        description: 'Registros de aula',
      },
      {
        code: '09',
        label: 'Avaliações',
        href: '/agenda/avaliacoes',
        description: 'Instrumentos e resultados',
      },
      {
        code: '10',
        label: 'Ocorrências',
        href: '/agenda/ocorrencias',
        description: 'Registros de ocorrências',
      },
      {
        code: '11',
        label: 'Casos Pedagógicos',
        href: '/agenda/casos',
        description: 'Acompanhamento estruturado',
      },
      {
        code: '12',
        label: 'Estudantes',
        href: '/agenda/caderno',
        description: 'Pesquisa e Caderno Pedagógico do estudante',
      },
    ],
  },
  {
    title: 'Inteligência',
    items: [
      {
        code: '13',
        label: 'Objetivos',
        href: '/agenda/objetivos',
        description: 'Metas e acompanhamento',
      },
      {
        code: '14',
        label: 'Evidências Inteligentes',
        href: '/agenda/evidencias/inteligencia',
        description: 'Qualidade, classificação e análise EDI',
      },
      {
        code: '15',
        label: 'Indicadores',
        href: '/agenda/indicadores',
        description: 'Leitura e análise de dados',
      },
      {
        code: '16',
        label: 'Histórico',
        href: '/agenda/historico',
        description: 'Memória e rastreabilidade',
      },
    ],
  },
] as const

function isPathActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function AgendaMobileNavigation() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!menuOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setMenuOpen(false)
    }

    window.addEventListener('keydown', handleEscape)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleEscape)
    }
  }, [menuOpen])

  return (
    <>
      <nav
        aria-label="Navegação principal móvel da Agenda"
        className="fixed inset-x-0 bottom-0 z-[90] border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_30px_-24px_rgba(15,23,42,0.55)] backdrop-blur lg:hidden"
      >
        <div className="mx-auto grid min-h-[64px] max-w-xl grid-cols-5 px-1">
          {primaryItems.map(item => {
            const active = isPathActive(pathname, item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={[
                  'relative flex min-h-[56px] min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-2 text-center transition',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B7491] focus-visible:ring-inset',
                  active
                    ? 'text-[#071827]'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-[#075F78]',
                ].join(' ')}
              >
                {active ? (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-3 top-0 h-0.5 rounded-full bg-[#0B7491]"
                  />
                ) : null}

                <span className="font-mono text-[9px] font-bold tracking-[0.1em] text-[#0B7491]">
                  {item.code}
                </span>
                <span className="max-w-full truncate text-[11px] font-bold leading-4 sm:text-xs">
                  {item.label}
                </span>
              </Link>
            )
          })}

          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-expanded={menuOpen}
            aria-controls="agenda-mobile-menu-sheet"
            className="relative flex min-h-[56px] min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-2 text-center text-slate-500 transition hover:bg-slate-50 hover:text-[#075F78] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B7491] focus-visible:ring-inset"
          >
            <span className="font-mono text-[9px] font-bold tracking-[0.1em] text-[#0B7491]">
              00
            </span>
            <span className="text-[11px] font-bold leading-4 sm:text-xs">
              Menu
            </span>
          </button>
        </div>
      </nav>

      {menuOpen ? (
        <div
          className="fixed inset-0 z-[140] bg-slate-950/45 lg:hidden"
          role="presentation"
          onMouseDown={event => {
            if (event.target === event.currentTarget) setMenuOpen(false)
          }}
        >
          <section
            id="agenda-mobile-menu-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Todos os módulos da Agenda Inteligente EDI"
            className="absolute inset-x-0 bottom-0 flex max-h-[88dvh] flex-col overflow-hidden rounded-t-[1.75rem] bg-white pb-[env(safe-area-inset-bottom)] shadow-2xl"
          >
            <header className="shrink-0 border-b border-slate-200 bg-[#071827] px-4 pb-4 pt-5 text-white sm:px-6">
              <div className="mx-auto flex max-w-xl items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300">
                    Agenda Inteligente EDI
                  </p>
                  <h2 className="mt-1 text-lg font-bold">
                    Todos os módulos
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/20 bg-white/5 px-4 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Fechar
                </button>
              </div>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6">
              <div className="mx-auto max-w-xl space-y-7 pb-5">
                {menuGroups.map(group => (
                  <section key={group.title}>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                      {group.title}
                    </p>

                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      {group.items.map(item => {
                        const active = isPathActive(pathname, item.href)

                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            aria-current={active ? 'page' : undefined}
                            className={[
                              'flex min-h-[72px] items-start gap-3 rounded-xl border p-3.5 transition',
                              active
                                ? 'border-[#071827] bg-[#071827] text-white'
                                : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-cyan-300 hover:bg-cyan-50',
                            ].join(' ')}
                          >
                            <span
                              className={[
                                'shrink-0 font-mono text-[10px] font-bold',
                                active ? 'text-cyan-300' : 'text-[#0B7491]',
                              ].join(' ')}
                            >
                              {item.code}
                            </span>

                            <span className="min-w-0">
                              <span className="block font-bold">
                                {item.label}
                              </span>
                              <span
                                className={[
                                  'mt-1 block text-xs leading-5',
                                  active ? 'text-slate-300' : 'text-slate-500',
                                ].join(' ')}
                              >
                                {item.description}
                              </span>
                            </span>
                          </Link>
                        )
                      })}
                    </div>
                  </section>
                ))}
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </>
  )
}
