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

type AccountProfile = {
  displayName: string | null
  email: string | null
  role: string
  status: string
}

type ProfileApiResponse = {
  success: boolean
  error?: string

  user?: {
    id: string
    email: string | null
  }

  profile?: {
    userId: string
    displayName: string | null
    phone: string | null
    role: string
    status: string
    onboardingCompleted: boolean
  }
}

const navigationItems: NavigationItem[] = [
  {
    code: '01',
    label: 'Dashboard',
    description: 'Visão geral da operação',
    href: '/agenda/dashboard',
    group: 'Operação',
  },
  {
    code: '02',
    label: 'Calendário',
    description: 'Compromissos e prazos',
    href: '/agenda/calendario',
    group: 'Operação',
  },
  {
    code: '03',
    label: 'Planejamento',
    description: 'Planos e ações pedagógicas',
    href: '/agenda/planejamento',
    group: 'Operação',
  },
  {
    code: '04',
    label: 'Evidências',
    description: 'Registros e arquivos protegidos',
    href: '/agenda/evidencias',
    group: 'Operação',
  },
  {
    code: '05',
    label: 'Tarefas',
    description: 'Pendências e entregas',
    href: '/agenda/tarefas',
    group: 'Organização',
  },
  {
    code: '06',
    label: 'Turmas',
    description: 'Contextos de aprendizagem',
    href: '/agenda/turmas',
    group: 'Organização',
  },
  {
    code: '07',
    label: 'Aulas',
    description: 'Registros de aula',
    href: '/agenda/aulas',
    group: 'Organização',
  },
  {
    code: '08',
    label: 'Objetivos',
    description: 'Metas e acompanhamento',
    href: '/agenda/objetivos',
    group: 'Inteligência',
  },
  {
    code: '09',
    label: 'Indicadores',
    description: 'Leitura e análise de dados',
    href: '/agenda/indicadores',
    group: 'Inteligência',
  },
  {
    code: '10',
    label: 'Histórico',
    description: 'Memória e auditoria',
    href: '/agenda/historico',
    group: 'Inteligência',
  },
]

const navigationGroups: NavigationGroup[] = [
  'Operação',
  'Organização',
  'Inteligência',
]

const ROLE_LABELS: Record<string, string> = {
  individual: 'Usuário individual',
  teacher: 'Professor',
  professor: 'Professor',
  coordinator: 'Coordenador',
  pedagogical_coordinator: 'Coordenador pedagógico',
  principal: 'Diretor',
  vice_principal: 'Vice-diretor',
  manager: 'Gestor',
  institution_admin: 'Administrador institucional',
  platform_admin: 'Administrador da plataforma',
  super_admin: 'Superadministrador',
}

function isActivePath(
  pathname: string,
  href: string,
): boolean {
  return (
    pathname === href ||
    pathname.startsWith(`${href}/`)
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

function getRoleLabel(
  role: string,
): string {
  const normalizedRole =
    role.trim().toLowerCase()

  const knownLabel =
    ROLE_LABELS[normalizedRole]

  if (knownLabel) {
    return knownLabel
  }

  if (!normalizedRole) {
    return 'Perfil individual'
  }

  return normalizedRole
    .split('_')
    .filter(Boolean)
    .map(
      part =>
        part.charAt(0).toUpperCase() +
        part.slice(1),
    )
    .join(' ')
}

function getStatusLabel(
  status: string,
): string {
  const normalizedStatus =
    status.trim().toLowerCase()

  const statusLabels:
    Record<string, string> = {
      active: 'Conta ativa',
      pending: 'Conta pendente',
      inactive: 'Conta inativa',
      suspended: 'Conta suspensa',
    }

  return (
    statusLabels[normalizedStatus] ??
    'Status não informado'
  )
}

export function AgendaNavigation() {
  const pathname = usePathname()
  const router = useRouter()

  const [
    mobileMenuOpen,
    setMobileMenuOpen,
  ] = useState(false)

  const [
    accountProfile,
    setAccountProfile,
  ] =
    useState<AccountProfile | null>(
      null,
    )

  const [
    profileLoading,
    setProfileLoading,
  ] = useState(true)

  const [
    loggingOut,
    setLoggingOut,
  ] = useState(false)

  const currentItem =
    navigationItems.find(
      item =>
        isActivePath(
          pathname,
          item.href,
        ),
    ) ?? navigationItems[0]

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    let active = true

    const controller =
      new AbortController()

    async function loadProfile() {
      try {
        const response =
          await fetch('/api/profile', {
            method: 'GET',
            credentials: 'include',
            cache: 'no-store',
            signal: controller.signal,
          })

        const result =
          (await response.json()) as
            ProfileApiResponse

        if (response.status === 401) {
          router.replace('/login')
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
            result.profile.displayName,
          email:
            result.user?.email ?? null,
          role:
            result.profile.role,
          status:
            result.profile.status,
        })
      } catch (error) {
        if (
          error instanceof Error &&
          error.name === 'AbortError'
        ) {
          return
        }

        if (active) {
          setAccountProfile(null)
        }
      } finally {
        if (active) {
          setProfileLoading(false)
        }
      }
    }

    void loadProfile()

    return () => {
      active = false
      controller.abort()
    }
  }, [router])

  async function handleLogout() {
    if (loggingOut) {
      return
    }

    setLoggingOut(true)

    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
      })
    } finally {
      window.location.assign(
        '/login?changeAccount=1&redirectTo=%2Fagenda%2Fdashboard',
      )
    }
  }

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
                current => !current,
              )
            }
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-[#075F78] lg:hidden"
          >
            {mobileMenuOpen
              ? 'Fechar menu'
              : 'Menu'}
          </button>

          <div className="hidden items-center gap-2 lg:flex">
            <Link
              href="/portal"
              className="inline-flex min-h-10 items-center justify-center rounded-lg px-3 py-2 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-[#071827]"
            >
              Central EIOS
            </Link>

            <Link
              href="/perfil"
              className="inline-flex min-h-10 items-center justify-center rounded-lg px-3 py-2 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-[#071827]"
            >
              Minha conta
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="inline-flex min-h-10 items-center justify-center rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700 transition hover:border-red-300 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loggingOut
                ? 'Saindo...'
                : 'Sair e trocar conta'}
            </button>
          </div>
        </div>

        {mobileMenuOpen ? (
          <div
            id="agenda-mobile-navigation"
            className="border-t border-slate-200 pb-5 pt-4 lg:hidden"
          >
            <section
              aria-label="Conta ativa"
              className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"
            >
              <header className="border-b border-slate-200 bg-white px-4 py-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#0B7491]">
                  Conta ativa
                </p>

                {profileLoading ? (
                  <p className="mt-2 text-sm text-slate-500">
                    Carregando informações da conta...
                  </p>
                ) : (
                  <>
                    <p className="mt-2 font-bold text-[#071827]">
                      {accountProfile
                        ?.displayName ??
                        'Usuário EduData IA'}
                    </p>

                    {accountProfile
                      ?.email ? (
                      <p className="mt-1 break-all text-sm text-slate-600">
                        {accountProfile.email}
                      </p>
                    ) : null}

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs font-semibold text-[#075F78]">
                        {getRoleLabel(
                          accountProfile
                            ?.role ?? '',
                        )}
                      </span>

                      <span className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">
                        {getStatusLabel(
                          accountProfile
                            ?.status ?? '',
                        )}
                      </span>
                    </div>
                  </>
                )}
              </header>

              <div className="grid gap-2 p-4 sm:grid-cols-2">
                <Link
                  href="/perfil"
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-[#075F78]"
                >
                  Meu perfil
                </Link>

                <Link
                  href="/portal"
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-[#075F78]"
                >
                  Central EIOS
                </Link>
              </div>

              <div className="border-t border-red-100 bg-red-50 p-4">
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-red-300 bg-white px-5 py-3 text-sm font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loggingOut
                    ? 'Encerrando sessão...'
                    : 'Sair e trocar de conta'}
                </button>

                <p className="mt-2 text-center text-xs leading-5 text-red-700">
                  Encerra o acesso atual e retorna à tela de login.
                </p>
              </div>
            </section>

            <div className="mt-6 space-y-6">
              {navigationGroups.map(
                group => {
                  const items =
                    navigationItems.filter(
                      item =>
                        item.group ===
                        group,
                    )

                  return (
                    <section key={group}>
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                        {group}
                      </p>

                      <div className="mt-2 grid gap-2 sm:grid-cols-2">
                        {items.map(
                          item => {
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
                                    {item.code}
                                  </span>

                                  <div className="min-w-0">
                                    <p className="font-bold">
                                      {item.label}
                                    </p>

                                    <p
                                      className={`mt-1 text-xs leading-5 ${
                                        active
                                          ? 'text-slate-300'
                                          : 'text-slate-500'
                                      }`}
                                    >
                                      {item.description}
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
        ) : null}

        <div className="hidden border-t border-slate-200 py-3 lg:block">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {navigationItems.map(
              item => {
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