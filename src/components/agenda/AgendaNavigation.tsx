'use client'

import Link from 'next/link'

import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  createPortal,
} from 'react-dom'

import {
  usePathname,
  useRouter,
} from 'next/navigation'

type NavigationGroup =
  | 'Operação'
  | 'Organização'
  | 'Inteligência'

type NavigationItem = {
  code:
    string

  label:
    string

  description:
    string

  href:
    string

  group:
    NavigationGroup

  emphasis?:
    boolean
}

type AccountProfile = {
  displayName:
    string | null

  email:
    string | null

  role:
    string

  status:
    string
}

type ProfileApiResponse = {
  success:
    boolean

  error?:
    string

  user?: {
    id:
      string

    email:
      string | null
  }

  profile?: {
    userId:
      string

    displayName:
      string | null

    phone:
      string | null

    role:
      string

    status:
      string

    onboardingCompleted:
      boolean
  }
}

const navigationItems:
  NavigationItem[] = [
    {
      code:
        '01',

      label:
        'Dashboard',

      description:
        'Visão geral da operação',

      href:
        '/agenda/dashboard',

      group:
        'Operação',
    },
    {
      code:
        '02',

      label:
        'Calendário',

      description:
        'Compromissos e prazos',

      href:
        '/agenda/calendario',

      group:
        'Operação',
    },
    {
      code:
        '03',

      label:
        'Planejamento',

      description:
        'Planos e ações pedagógicas',

      href:
        '/agenda/planejamento',

      group:
        'Operação',
    },
    {
      code:
        '04',

      label:
        'Evidências',

      description:
        'Registros e arquivos protegidos',

      href:
        '/agenda/evidencias',

      group:
        'Operação',
    },
    {
      code:
        '05',

      label:
        'Tarefas',

      description:
        'Pendências e entregas',

      href:
        '/agenda/tarefas',

      group:
        'Organização',
    },
    {
      code:
        '06',

      label:
        'Turmas',

      description:
        'Contextos de aprendizagem',

      href:
        '/agenda/turmas',

      group:
        'Organização',
    },
    {
      code:
        '07',

      label:
        'Aulas',

      description:
        'Registros de aula',

      href:
        '/agenda/aulas',

      group:
        'Organização',
    },
    {
      code:
        '08',

      label:
        'Objetivos',

      description:
        'Metas e acompanhamento',

      href:
        '/agenda/objetivos',

      group:
        'Inteligência',
    },
    {
      code:
        '09',

      label:
        'Evidências Inteligentes',

      description:
        'Scores, diagnósticos e recomendações EDI',

      href:
        '/agenda/evidencias/inteligencia',

      group:
        'Inteligência',

      emphasis:
        true,
    },
    {
      code:
        '10',

      label:
        'Indicadores',

      description:
        'Leitura e análise de dados',

      href:
        '/agenda/indicadores',

      group:
        'Inteligência',
    },
    {
      code:
        '11',

      label:
        'Histórico',

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

const ROLE_LABELS:
  Record<string, string> = {
    individual:
      'Usuário individual',

    teacher:
      'Professor',

    professor:
      'Professor',

    coordinator:
      'Coordenador',

    pedagogical_coordinator:
      'Coordenador pedagógico',

    principal:
      'Diretor',

    vice_principal:
      'Vice-diretor',

    manager:
      'Gestor',

    institution_admin:
      'Administrador institucional',

    platform_admin:
      'Administrador da plataforma',

    super_admin:
      'Superadministrador',
  }

function pathMatchesItem(
  pathname:
    string,
  href:
    string,
): boolean {
  return (
    pathname ===
      href ||
    pathname.startsWith(
      `${href}/`,
    )
  )
}

function resolveCurrentItem(
  pathname:
    string,
): NavigationItem {
  const matchingItems =
    navigationItems
      .filter(
        item =>
          pathMatchesItem(
            pathname,
            item.href,
          ),
      )
      .sort(
        (
          first,
          second,
        ) =>
          second.href.length -
          first.href.length,
      )

  return (
    matchingItems[0] ??
    navigationItems[0]
  )
}

function getNavigationItemClass({
  active,
  emphasis,
}: {
  active:
    boolean

  emphasis:
    boolean
}): string {
  const baseClasses = [
    'group relative flex min-w-[184px]',
    'flex-1 items-center gap-3',
    'rounded-xl border px-4 py-3',
    'text-left transition duration-200',
    'focus:outline-none',
    'focus:ring-4 focus:ring-cyan-100',
  ]

  if (active) {
    return [
      ...baseClasses,
      'border-[#071827]',
      'bg-[#071827]',
      'text-white shadow-sm',
    ].join(' ')
  }

  if (emphasis) {
    return [
      ...baseClasses,
      'border-cyan-300',
      'bg-cyan-50',
      'text-[#075F78]',
      'hover:border-cyan-500',
      'hover:bg-cyan-100',
    ].join(' ')
  }

  return [
    ...baseClasses,
    'border-slate-200',
    'bg-white',
    'text-slate-700',
    'hover:border-cyan-300',
    'hover:bg-cyan-50',
  ].join(' ')
}

function getRoleLabel(
  role:
    string,
): string {
  const normalizedRole =
    role
      .trim()
      .toLowerCase()

  const knownLabel =
    ROLE_LABELS[
      normalizedRole
    ]

  if (knownLabel) {
    return knownLabel
  }

  if (!normalizedRole) {
    return 'Perfil individual'
  }

  return normalizedRole
    .split('_')
    .filter(
      Boolean,
    )
    .map(
      part =>
        part
          .charAt(0)
          .toUpperCase() +
        part.slice(1),
    )
    .join(' ')
}

function getStatusLabel(
  status:
    string,
): string {
  const normalizedStatus =
    status
      .trim()
      .toLowerCase()

  const labels:
    Record<string, string> = {
      active:
        'Conta ativa',

      pending:
        'Conta pendente',

      inactive:
        'Conta inativa',

      suspended:
        'Conta suspensa',
    }

  return (
    labels[
      normalizedStatus
    ] ??
    'Status não informado'
  )
}

export function AgendaNavigation() {
  const pathname =
    usePathname()

  const router =
    useRouter()

  const [
    mobileMenuOpen,
    setMobileMenuOpen,
  ] = useState(
    false,
  )

  const [
    mounted,
    setMounted,
  ] = useState(
    false,
  )

  const [
    accountProfile,
    setAccountProfile,
  ] = useState<
    AccountProfile | null
  >(null)

  const [
    profileLoading,
    setProfileLoading,
  ] = useState(
    true,
  )

  const [
    loggingOut,
    setLoggingOut,
  ] = useState(
    false,
  )

  const currentItem =
    useMemo(
      () =>
        resolveCurrentItem(
          pathname,
        ),
      [
        pathname,
      ],
    )

  useEffect(() => {
    setMounted(
      true,
    )

    return () => {
      setMounted(
        false,
      )
    }
  }, [])

  useEffect(() => {
    setMobileMenuOpen(
      false,
    )
  }, [
    pathname,
  ])

  useEffect(() => {
    if (
      !mobileMenuOpen ||
      typeof window ===
        'undefined'
    ) {
      return
    }

    const previousBodyOverflow =
      document.body
        .style.overflow

    const previousBodyOverscroll =
      document.body
        .style
        .overscrollBehavior

    const previousHtmlOverflow =
      document
        .documentElement
        .style.overflow

    const previousHtmlOverscroll =
      document
        .documentElement
        .style
        .overscrollBehavior

    document.body
      .style.overflow =
      'hidden'

    document.body
      .style
      .overscrollBehavior =
      'none'

    document
      .documentElement
      .style.overflow =
      'hidden'

    document
      .documentElement
      .style
      .overscrollBehavior =
      'none'

    function handleKeyDown(
      event:
        KeyboardEvent,
    ): void {
      if (
        event.key ===
          'Escape'
      ) {
        setMobileMenuOpen(
          false,
        )
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

      document.body
        .style.overflow =
        previousBodyOverflow

      document.body
        .style
        .overscrollBehavior =
        previousBodyOverscroll

      document
        .documentElement
        .style.overflow =
        previousHtmlOverflow

      document
        .documentElement
        .style
        .overscrollBehavior =
        previousHtmlOverscroll
    }
  }, [
    mobileMenuOpen,
  ])

  useEffect(() => {
    let active =
      true

    const controller =
      new AbortController()

    async function loadProfile():
      Promise<void> {
      try {
        const response =
          await fetch(
            '/api/profile',
            {
              method:
                'GET',

              credentials:
                'include',

              cache:
                'no-store',

              signal:
                controller.signal,
            },
          )

        const result =
          await response
            .json() as
            ProfileApiResponse

        if (
          response.status ===
          401
        ) {
          router.replace(
            '/login',
          )

          return
        }

        if (
          !response.ok ||
          !result.success ||
          !result.profile
        ) {
          return
        }

        if (!active) {
          return
        }

        setAccountProfile({
          displayName:
            result.profile
              .displayName,

          email:
            result.user
              ?.email ??
            null,

          role:
            result.profile
              .role,

          status:
            result.profile
              .status,
        })
      } catch (error) {
        if (
          error instanceof
            Error &&
          error.name ===
            'AbortError'
        ) {
          return
        }

        if (active) {
          setAccountProfile(
            null,
          )
        }
      } finally {
        if (active) {
          setProfileLoading(
            false,
          )
        }
      }
    }

    void loadProfile()

    return () => {
      active =
        false

      controller.abort()
    }
  }, [
    router,
  ])

  function closeMobileMenu():
    void {
    setMobileMenuOpen(
      false,
    )
  }

  async function handleLogout():
    Promise<void> {
    if (loggingOut) {
      return
    }

    setLoggingOut(
      true,
    )

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
      window.location.assign(
        '/login?changeAccount=1&redirectTo=%2Fagenda%2Fdashboard',
      )
    }
  }

  const mobileMenu =
    mounted &&
    mobileMenuOpen
      ? createPortal(
          <section
            id="agenda-mobile-navigation"
            role="dialog"
            aria-modal="true"
            aria-label="Menu da Agenda Inteligente EDI"
            className={[
              'fixed inset-0 z-[150]',
              'flex h-[100dvh]',
              'min-h-0 w-screen',
              'max-w-full flex-col',
              'overflow-hidden',
              'bg-white text-slate-950',
              'lg:hidden',
            ].join(' ')}
          >
            <header
              className={[
                'shrink-0 border-b',
                'border-slate-200',
                'bg-[#071827]',
                'px-4 pb-4',
                'pt-[calc(1rem+env(safe-area-inset-top))]',
                'text-white sm:px-6',
              ].join(' ')}
            >
              <div
                className={[
                  'mx-auto flex w-full',
                  'max-w-7xl items-center',
                  'justify-between gap-4',
                ].join(' ')}
              >
                <div
                  className="min-w-0"
                >
                  <p
                    className={[
                      'text-[10px] font-bold',
                      'uppercase',
                      'tracking-[0.2em]',
                      'text-cyan-300',
                    ].join(' ')}
                  >
                    Agenda Inteligente EDI
                  </p>

                  <div
                    className={[
                      'mt-1 flex min-w-0',
                      'items-center gap-2',
                    ].join(' ')}
                  >
                    <span
                      className={[
                        'shrink-0 font-mono',
                        'text-xs font-bold',
                        'text-slate-400',
                      ].join(' ')}
                    >
                      {currentItem.code}
                    </span>

                    <p
                      className={[
                        'truncate text-base',
                        'font-bold text-white',
                      ].join(' ')}
                    >
                      {currentItem.label}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={
                    closeMobileMenu
                  }
                  aria-label="Fechar menu da Agenda"
                  className={[
                    'inline-flex min-h-11',
                    'shrink-0 items-center',
                    'justify-center rounded-xl',
                    'border border-white/20',
                    'bg-white/5 px-4',
                    'text-sm font-semibold',
                    'text-white transition',
                    'hover:bg-white/10',
                  ].join(' ')}
                >
                  Fechar
                </button>
              </div>
            </header>

            <div
              className={[
                'min-h-0 flex-1',
                'touch-pan-y',
                'overflow-x-hidden',
                'overflow-y-scroll',
                'overscroll-contain',
                'bg-white px-4 py-5',
                'sm:px-6',
              ].join(' ')}
              style={{
                WebkitOverflowScrolling:
                  'touch',
              }}
            >
              <div
                className={[
                  'mx-auto w-full',
                  'max-w-7xl',
                ].join(' ')}
              >
                <section
                  aria-label="Conta ativa"
                  className={[
                    'overflow-hidden',
                    'rounded-2xl border',
                    'border-slate-200',
                    'bg-slate-50',
                  ].join(' ')}
                >
                  <header
                    className={[
                      'border-b',
                      'border-slate-200',
                      'bg-white px-4 py-4',
                    ].join(' ')}
                  >
                    <p
                      className={[
                        'text-[10px] font-bold',
                        'uppercase',
                        'tracking-[0.18em]',
                        'text-[#0B7491]',
                      ].join(' ')}
                    >
                      Conta ativa
                    </p>

                    {profileLoading ? (
                      <p
                        className={[
                          'mt-2 text-sm',
                          'text-slate-500',
                        ].join(' ')}
                      >
                        Carregando informações da conta...
                      </p>
                    ) : (
                      <>
                        <p
                          className={[
                            'mt-2 break-words',
                            'font-bold',
                            'text-[#071827]',
                          ].join(' ')}
                        >
                          {accountProfile
                            ?.displayName ??
                            'Usuário EduData IA'}
                        </p>

                        {accountProfile
                          ?.email ? (
                          <p
                            className={[
                              'mt-1 break-all',
                              'text-sm',
                              'text-slate-600',
                            ].join(' ')}
                          >
                            {
                              accountProfile
                                .email
                            }
                          </p>
                        ) : null}

                        <div
                          className={[
                            'mt-3 flex',
                            'flex-wrap gap-2',
                          ].join(' ')}
                        >
                          <span
                            className={[
                              'rounded-lg border',
                              'border-cyan-200',
                              'bg-cyan-50',
                              'px-3 py-2',
                              'text-xs font-semibold',
                              'text-[#075F78]',
                            ].join(' ')}
                          >
                            {getRoleLabel(
                              accountProfile
                                ?.role ??
                                '',
                            )}
                          </span>

                          <span
                            className={[
                              'rounded-lg border',
                              'border-slate-200',
                              'bg-slate-100',
                              'px-3 py-2',
                              'text-xs font-semibold',
                              'text-slate-600',
                            ].join(' ')}
                          >
                            {getStatusLabel(
                              accountProfile
                                ?.status ??
                                '',
                            )}
                          </span>
                        </div>
                      </>
                    )}
                  </header>

                  <div
                    className={[
                      'grid gap-2 p-4',
                      'sm:grid-cols-2',
                    ].join(' ')}
                  >
                    <Link
                      href="/perfil"
                      onClick={
                        closeMobileMenu
                      }
                      className={[
                        'inline-flex min-h-11',
                        'w-full items-center',
                        'justify-center',
                        'rounded-xl border',
                        'border-slate-300',
                        'bg-white px-4 py-3',
                        'text-center text-sm',
                        'font-semibold',
                        'text-slate-700',
                        'transition',
                        'hover:border-cyan-300',
                        'hover:bg-cyan-50',
                        'hover:text-[#075F78]',
                      ].join(' ')}
                    >
                      Meu perfil
                    </Link>

                    <Link
                      href="/portal"
                      onClick={
                        closeMobileMenu
                      }
                      className={[
                        'inline-flex min-h-11',
                        'w-full items-center',
                        'justify-center',
                        'rounded-xl border',
                        'border-slate-300',
                        'bg-white px-4 py-3',
                        'text-center text-sm',
                        'font-semibold',
                        'text-slate-700',
                        'transition',
                        'hover:border-cyan-300',
                        'hover:bg-cyan-50',
                        'hover:text-[#075F78]',
                      ].join(' ')}
                    >
                      Central EIOS
                    </Link>
                  </div>
                </section>

                <div
                  className={[
                    'mt-6 space-y-7',
                    'pb-8',
                  ].join(' ')}
                >
                  {navigationGroups.map(
                    group => {
                      const items =
                        navigationItems.filter(
                          item =>
                            item.group ===
                            group,
                        )

                      return (
                        <section
                          key={
                            group
                          }
                        >
                          <p
                            className={[
                              'text-xs font-bold',
                              'uppercase',
                              'tracking-[0.16em]',
                              'text-slate-400',
                            ].join(' ')}
                          >
                            {group}
                          </p>

                          <div
                            className={[
                              'mt-2 grid gap-2',
                              'sm:grid-cols-2',
                            ].join(' ')}
                          >
                            {items.map(
                              item => {
                                const active =
                                  currentItem
                                    .href ===
                                  item.href

                                return (
                                  <Link
                                    key={
                                      item.href
                                    }
                                    href={
                                      item.href
                                    }
                                    onClick={
                                      closeMobileMenu
                                    }
                                    aria-current={
                                      active
                                        ? 'page'
                                        : undefined
                                    }
                                    className={[
                                      'relative rounded-xl',
                                      'border p-4',
                                      'transition',
                                      active
                                        ? [
                                            'border-[#071827]',
                                            'bg-[#071827]',
                                            'text-white',
                                          ].join(' ')
                                        : item.emphasis
                                          ? [
                                              'border-cyan-300',
                                              'bg-cyan-50',
                                              'text-[#075F78]',
                                              'hover:border-cyan-500',
                                              'hover:bg-cyan-100',
                                            ].join(' ')
                                          : [
                                              'border-slate-200',
                                              'bg-slate-50',
                                              'text-slate-700',
                                              'hover:border-cyan-300',
                                              'hover:bg-cyan-50',
                                            ].join(' '),
                                    ].join(' ')}
                                  >
                                    {item.emphasis ? (
                                      <span
                                        aria-hidden="true"
                                        className={[
                                          'absolute inset-x-0',
                                          'top-0 h-1',
                                          'rounded-t-xl',
                                          active
                                            ? 'bg-cyan-300'
                                            : 'bg-cyan-600',
                                        ].join(' ')}
                                      />
                                    ) : null}

                                    <div
                                      className={[
                                        'flex items-start',
                                        'gap-3',
                                      ].join(' ')}
                                    >
                                      <span
                                        className={[
                                          'font-mono text-xs',
                                          'font-bold',
                                          active
                                            ? 'text-cyan-300'
                                            : 'text-[#0B7491]',
                                        ].join(' ')}
                                      >
                                        {item.code}
                                      </span>

                                      <div
                                        className="min-w-0"
                                      >
                                        <p
                                          className={[
                                            'break-words',
                                            'font-bold',
                                          ].join(' ')}
                                        >
                                          {item.label}
                                        </p>

                                        <p
                                          className={[
                                            'mt-1 text-xs',
                                            'leading-5',
                                            active
                                              ? 'text-slate-300'
                                              : 'text-slate-500',
                                          ].join(' ')}
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
              </div>
            </div>

            <footer
              className={[
                'shrink-0 border-t',
                'border-red-100',
                'bg-red-50 px-4',
                'pb-[calc(0.75rem+env(safe-area-inset-bottom))]',
                'pt-3 sm:px-6',
              ].join(' ')}
            >
              <div
                className={[
                  'mx-auto w-full',
                  'max-w-7xl',
                ].join(' ')}
              >
                <button
                  type="button"
                  onClick={
                    handleLogout
                  }
                  disabled={
                    loggingOut
                  }
                  className={[
                    'inline-flex min-h-12',
                    'w-full items-center',
                    'justify-center',
                    'rounded-xl border',
                    'border-red-300',
                    'bg-white px-5 py-3',
                    'text-sm font-bold',
                    'text-red-700 transition',
                    'hover:bg-red-100',
                    'disabled:cursor-not-allowed',
                    'disabled:opacity-60',
                  ].join(' ')}
                >
                  {loggingOut
                    ? 'Encerrando sessão...'
                    : 'Sair e trocar de conta'}
                </button>

                <p
                  className={[
                    'mt-2 text-center',
                    'text-xs leading-5',
                    'text-red-700',
                  ].join(' ')}
                >
                  Encerra o acesso atual e retorna à tela de login.
                </p>
              </div>
            </footer>
          </section>,
          document.body,
        )
      : null

  return (
    <>
      <nav
        aria-label="Módulos da Agenda Inteligente EDI"
        className={[
          'sticky top-20 z-[50]',
          'border-b border-slate-200',
          'bg-white shadow-sm',
        ].join(' ')}
      >
        <div
          className={[
            'mx-auto max-w-7xl',
            'px-4 sm:px-6',
            'lg:px-8',
          ].join(' ')}
        >
          <div
            className={[
              'flex min-h-[72px]',
              'items-center',
              'justify-between gap-4',
            ].join(' ')}
          >
            <div
              className="min-w-0"
            >
              <p
                className={[
                  'text-[10px] font-bold',
                  'uppercase',
                  'tracking-[0.2em]',
                  'text-[#0B7491]',
                  'sm:text-xs',
                ].join(' ')}
              >
                Módulos operacionais
              </p>

              <div
                className={[
                  'mt-1 flex min-w-0',
                  'items-center gap-2',
                ].join(' ')}
              >
                <span
                  className={[
                    'shrink-0 font-mono',
                    'text-xs font-bold',
                    'text-slate-400',
                  ].join(' ')}
                >
                  {currentItem.code}
                </span>

                <p
                  className={[
                    'truncate text-sm',
                    'font-bold',
                    'text-[#071827]',
                    'sm:text-base',
                  ].join(' ')}
                >
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
                  true,
                )
              }
              className={[
                'inline-flex min-h-11',
                'shrink-0 items-center',
                'justify-center rounded-xl',
                'border border-slate-300',
                'bg-white px-4',
                'text-sm font-semibold',
                'text-slate-700',
                'transition',
                'hover:border-cyan-300',
                'hover:bg-cyan-50',
                'hover:text-[#075F78]',
                'lg:hidden',
              ].join(' ')}
            >
              Menu
            </button>

            <div
              className={[
                'hidden items-center',
                'gap-2 lg:flex',
              ].join(' ')}
            >
              <Link
                href="/portal"
                className={[
                  'inline-flex min-h-10',
                  'items-center justify-center',
                  'rounded-lg px-3 py-2',
                  'text-sm font-semibold',
                  'text-slate-500',
                  'transition',
                  'hover:bg-slate-100',
                  'hover:text-[#071827]',
                ].join(' ')}
              >
                Central EIOS
              </Link>

              <Link
                href="/perfil"
                className={[
                  'inline-flex min-h-10',
                  'items-center justify-center',
                  'rounded-lg px-3 py-2',
                  'text-sm font-semibold',
                  'text-slate-500',
                  'transition',
                  'hover:bg-slate-100',
                  'hover:text-[#071827]',
                ].join(' ')}
              >
                Minha conta
              </Link>

              <button
                type="button"
                onClick={
                  handleLogout
                }
                disabled={
                  loggingOut
                }
                className={[
                  'inline-flex min-h-10',
                  'items-center justify-center',
                  'rounded-lg border',
                  'border-red-200',
                  'bg-white px-3 py-2',
                  'text-sm font-semibold',
                  'text-red-700',
                  'transition',
                  'hover:border-red-300',
                  'hover:bg-red-50',
                  'disabled:cursor-not-allowed',
                  'disabled:opacity-60',
                ].join(' ')}
              >
                {loggingOut
                  ? 'Saindo...'
                  : 'Sair e trocar conta'}
              </button>
            </div>
          </div>

          <div
            className={[
              'hidden border-t',
              'border-slate-200',
              'py-3 lg:block',
            ].join(' ')}
          >
            <div
              className={[
                'flex gap-2',
                'overflow-x-auto pb-1',
              ].join(' ')}
            >
              {navigationItems.map(
                item => {
                  const active =
                    currentItem.href ===
                    item.href

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
                        getNavigationItemClass({
                          active,

                          emphasis:
                            Boolean(
                              item.emphasis,
                            ),
                        })
                      }
                    >
                      {item.emphasis ? (
                        <span
                          aria-hidden="true"
                          className={[
                            'absolute inset-x-0',
                            'top-0 h-1',
                            'rounded-t-xl',
                            active
                              ? 'bg-cyan-300'
                              : 'bg-cyan-600',
                          ].join(' ')}
                        />
                      ) : null}

                      <span
                        className={[
                          'font-mono text-xs',
                          'font-bold',
                          active
                            ? 'text-cyan-300'
                            : 'text-[#0B7491]',
                        ].join(' ')}
                      >
                        {item.code}
                      </span>

                      <div
                        className="min-w-0"
                      >
                        <p
                          className={[
                            'truncate text-sm',
                            'font-bold',
                          ].join(' ')}
                        >
                          {item.label}
                        </p>

                        <p
                          className={[
                            'mt-0.5 truncate',
                            'text-[11px]',
                            active
                              ? 'text-slate-300'
                              : 'text-slate-500 group-hover:text-slate-600',
                          ].join(' ')}
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

      {mobileMenu}
    </>
  )
}