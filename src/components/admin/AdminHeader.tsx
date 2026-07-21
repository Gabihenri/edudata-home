'use client'

import Link from 'next/link'

import {
  useEffect,
  useState,
} from 'react'

import {
  usePathname,
  useRouter,
} from 'next/navigation'

type AdminNavigationItem = {
  label: string
  href: string
  description: string
  group:
    | 'operacao'
    | 'produtos'
    | 'gestao'
    | 'plataforma'
}

const ADMIN_ITEMS:
  AdminNavigationItem[] = [
    {
      label:
        'Dashboard',

      href:
        '/admin',

      description:
        'Visão geral do BackOffice EIOS.',

      group:
        'operacao',
    },
    {
      label:
        'Suporte EDI',

      href:
        '/admin/suporte',

      description:
        'Fila, SLA, prioridades e atendimento.',

      group:
        'operacao',
    },
    {
      label:
        'Escolas',

      href:
        '/admin/escolas',

      description:
        'Gestão da base institucional de escolas.',

      group:
        'gestao',
    },
    {
      label:
        'Professores',

      href:
        '/admin/professores',

      description:
        'Gestão de perfis e vínculos docentes.',

      group:
        'gestao',
    },
    {
      label:
        'Usuários',

      href:
        '/admin/usuarios',

      description:
        'Contas, perfis e acessos da plataforma.',

      group:
        'gestao',
    },
    {
      label:
        'CRM',

      href:
        '/admin/crm',

      description:
        'Leads, relacionamentos e oportunidades.',

      group:
        'gestao',
    },
    {
      label:
        'EduData Academy',

      href:
        '/admin/academy',

      description:
        'Cursos, trilhas, inscrições e certificações.',

      group:
        'produtos',
    },
    {
      label:
        'Professor Digital',

      href:
        '/admin/professor-digital',

      description:
        'Gestão da porta de entrada formativa.',

      group:
        'produtos',
    },
    {
      label:
        'Agenda Inteligente EDI',

      href:
        '/admin/agenda',

      description:
        'Operação, planejamento e evidências.',

      group:
        'produtos',
    },
    {
      label:
        'Analytics',

      href:
        '/admin/analytics',

      description:
        'Indicadores e inteligência educacional.',

      group:
        'produtos',
    },
    {
      label:
        'Produtos',

      href:
        '/admin/produtos',

      description:
        'Catálogo e configurações dos produtos.',

      group:
        'plataforma',
    },
    {
      label:
        'Experience Manager',

      href:
        '/admin/experience-manager',

      description:
        'Conteúdo, identidade e experiência pública.',

      group:
        'plataforma',
    },
    {
      label:
        'Configurações',

      href:
        '/admin/configuracoes',

      description:
        'Parâmetros gerais do ecossistema.',

      group:
        'plataforma',
    },
  ]

const GROUP_LABELS:
  Record<
    AdminNavigationItem['group'],
    string
  > = {
    operacao:
      'Operação',

    produtos:
      'Produtos especializados',

    gestao:
      'Gestão',

    plataforma:
      'Plataforma',
  }

const GROUP_ORDER:
  AdminNavigationItem['group'][] = [
    'operacao',
    'produtos',
    'gestao',
    'plataforma',
  ]

function isActivePath(
  pathname: string,
  href: string,
): boolean {
  if (href === '/admin') {
    return pathname === '/admin'
  }

  return (
    pathname === href ||
    pathname.startsWith(
      `${href}/`,
    )
  )
}

export default function AdminHeader() {
  const pathname =
    usePathname()

  const router =
    useRouter()

  const [
    menuOpen,
    setMenuOpen,
  ] =
    useState(false)

  const [
    loggingOut,
    setLoggingOut,
  ] =
    useState(false)

  useEffect(
    () => {
      setMenuOpen(false)
    },
    [
      pathname,
    ],
  )

  useEffect(
    () => {
      if (!menuOpen) {
        return
      }

      const scrollPosition =
        window.scrollY

      const previousBodyStyles = {
        position:
          document.body.style
            .position,

        top:
          document.body.style
            .top,

        left:
          document.body.style
            .left,

        right:
          document.body.style
            .right,

        width:
          document.body.style
            .width,

        overflow:
          document.body.style
            .overflow,
      }

      const previousHtmlOverflow =
        document.documentElement
          .style.overflow

      document.body.style.position =
        'fixed'

      document.body.style.top =
        `-${scrollPosition}px`

      document.body.style.left =
        '0'

      document.body.style.right =
        '0'

      document.body.style.width =
        '100%'

      document.body.style.overflow =
        'hidden'

      document.documentElement
        .style.overflow =
        'hidden'

      function handleKeyDown(
        event: KeyboardEvent,
      ) {
        if (
          event.key ===
          'Escape'
        ) {
          setMenuOpen(false)
        }
      }

      window.addEventListener(
        'keydown',
        handleKeyDown,
      )

      return () => {
        window.removeEventListener(
          'keydown',
          handleKeyDown,
        )

        document.body.style.position =
          previousBodyStyles.position

        document.body.style.top =
          previousBodyStyles.top

        document.body.style.left =
          previousBodyStyles.left

        document.body.style.right =
          previousBodyStyles.right

        document.body.style.width =
          previousBodyStyles.width

        document.body.style.overflow =
          previousBodyStyles.overflow

        document.documentElement
          .style.overflow =
          previousHtmlOverflow

        window.scrollTo(
          0,
          scrollPosition,
        )
      }
    },
    [
      menuOpen,
    ],
  )

  async function handleLogout() {
    if (loggingOut) {
      return
    }

    setLoggingOut(true)

    try {
      await fetch(
        '/api/auth/logout',
        {
          method:
            'POST',

          credentials:
            'include',

          cache:
            'no-store',
        },
      )
    } finally {
      setMenuOpen(false)

      router.replace(
        '/login',
      )

      router.refresh()
    }
  }

  return (
    <header className="sticky top-0 z-[70] w-full max-w-full overflow-x-hidden border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      <div className="flex min-h-20 w-full min-w-0 max-w-full items-center justify-between gap-3 px-4 sm:px-6 lg:px-10">
        <Link
          href="/admin"
          aria-label="Abrir o dashboard do BackOffice EIOS"
          className="min-w-0 flex-1 overflow-hidden"
        >
          <p className="max-w-full truncate text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700 sm:tracking-[0.25em]">
            BackOffice EIOS
          </p>

          <h1 className="mt-1 max-w-full truncate text-lg font-bold text-[#081C2E] sm:text-xl">
            EduData IA Platform
          </h1>
        </Link>

        <div className="hidden shrink-0 rounded-full bg-[#081C2E] px-5 py-2 text-sm font-semibold text-white lg:inline-flex">
          Admin
        </div>

        <button
          type="button"
          onClick={() =>
            setMenuOpen(
              currentValue =>
                !currentValue,
            )
          }
          aria-expanded={
            menuOpen
          }
          aria-controls="admin-mobile-navigation"
          className="inline-flex min-h-12 min-w-20 shrink-0 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-[#081C2E] transition hover:border-cyan-600 hover:text-cyan-800 focus:outline-none focus:ring-4 focus:ring-cyan-100 lg:hidden"
        >
          {menuOpen
            ? 'Fechar'
            : 'Menu'}
        </button>
      </div>

      {menuOpen ? (
        <div
          id="admin-mobile-navigation"
          role="dialog"
          aria-modal="true"
          aria-label="Menu do BackOffice EIOS"
          className="fixed inset-x-0 top-20 z-[80] h-[calc(100dvh-5rem)] w-screen max-w-full overflow-x-hidden bg-[#071827] text-white lg:hidden"
        >
          <div className="mx-auto flex h-full w-full min-w-0 max-w-4xl flex-col overflow-x-hidden px-4 sm:px-6">
            <div className="min-h-0 min-w-0 flex-1 touch-pan-y overflow-x-hidden overflow-y-auto overscroll-contain py-5">
              <section className="min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">
                  Administração
                </p>

                <h2 className="mt-3 break-words text-2xl font-bold text-white">
                  BackOffice EIOS
                </h2>

                <p className="mt-2 break-words text-sm leading-6 text-slate-300">
                  Centro operacional da
                  EduData IA Platform.
                </p>
              </section>

              <nav
                aria-label="Áreas administrativas"
                className="mt-6 min-w-0 space-y-7 pb-6"
              >
                {GROUP_ORDER.map(
                  group => {
                    const groupItems =
                      ADMIN_ITEMS.filter(
                        item =>
                          item.group ===
                          group,
                      )

                    return (
                      <section
                        key={group}
                        className="min-w-0 max-w-full"
                      >
                        <p className="max-w-full truncate text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                          {
                            GROUP_LABELS[
                              group
                            ]
                          }
                        </p>

                        <div className="mt-3 grid min-w-0 max-w-full gap-3 sm:grid-cols-2">
                          {groupItems.map(
                            item => {
                              const activePath =
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
                                  onClick={() =>
                                    setMenuOpen(
                                      false,
                                    )
                                  }
                                  aria-current={
                                    activePath
                                      ? 'page'
                                      : undefined
                                  }
                                  className={`min-w-0 max-w-full rounded-xl border p-4 transition focus:outline-none focus:ring-4 focus:ring-cyan-300/10 ${
                                    activePath
                                      ? 'border-cyan-300 bg-cyan-300/10 text-white'
                                      : 'border-white/10 bg-white/5 text-white hover:border-white/30 hover:bg-white/10'
                                  }`}
                                >
                                  <span className="block break-words text-sm font-bold">
                                    {
                                      item.label
                                    }
                                  </span>

                                  <span
                                    className={`mt-1 block break-words text-xs leading-5 ${
                                      activePath
                                        ? 'text-cyan-100'
                                        : 'text-slate-300'
                                    }`}
                                  >
                                    {
                                      item.description
                                    }
                                  </span>
                                </Link>
                              )
                            },
                          )}
                        </div>
                      </section>
                    )
                  },
                )}
              </nav>
            </div>

            <footer className="min-w-0 max-w-full shrink-0 overflow-x-hidden border-t border-white/10 bg-[#071827] pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Link
                  href="/portal"
                  onClick={() =>
                    setMenuOpen(false)
                  }
                  className="inline-flex min-h-11 min-w-0 items-center justify-center rounded-xl border border-white/20 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Central da Plataforma
                </Link>

                <button
                  type="button"
                  onClick={
                    handleLogout
                  }
                  disabled={
                    loggingOut
                  }
                  className="inline-flex min-h-11 min-w-0 items-center justify-center rounded-xl border border-red-300/30 bg-red-500/[0.06] px-4 py-3 text-sm font-semibold text-red-100 transition hover:border-red-300/50 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loggingOut
                    ? 'Encerrando sessão...'
                    : 'Sair da plataforma'}
                </button>
              </div>

              <p className="mt-3 break-words text-center text-xs leading-5 text-slate-400">
                O acesso às áreas administrativas
                depende das permissões da conta.
              </p>
            </footer>
          </div>
        </div>
      ) : null}
    </header>
  )
}