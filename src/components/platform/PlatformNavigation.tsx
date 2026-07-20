'use client'

import Link from 'next/link'
import {
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  usePathname,
  useRouter,
} from 'next/navigation'

type AccountType =
  | 'individual'
  | 'corporate'

interface PortalUser {
  id: string
  email: string | null
  displayName: string
  profileStatus: string
  onboardingCompleted: boolean
}

interface PortalContext {
  id: string
  accountType: AccountType

  organization: {
    id: string
    name: string
  } | null

  school: {
    id: string
    name: string
    shortName: string | null
    city: string | null
    state: string | null
  } | null

  role: string
  roleLabel: string
  hierarchyLevel: number
  scopeType: string
  status: string
  onboardingCompleted: boolean
}

interface PortalProduct {
  code: string
  title: string
  description: string
  href: string
  enabled: boolean
  unavailableReason: string | null
}

interface PortalResponse {
  success: boolean
  user?: PortalUser
  accountType?: AccountType
  activeContext?: PortalContext
  products?: PortalProduct[]
  error?: string
}

interface NavigationItem {
  key: string
  label: string
  href: string
  group:
    | 'core'
    | 'product'
    | 'management'
    | 'account'
}

const PLATFORM_ROLES =
  new Set([
    'platform_admin',
    'super_admin',
  ])

const INSTITUTION_CORE_ROLES =
  new Set([
    'platform_admin',
    'super_admin',
    'institution_admin',
    'regional_manager',
    'supervisor',
    'principal',
    'vice_principal',
  ])

const ORGANIZATION_CORE_ROLES =
  new Set([
    'platform_admin',
    'super_admin',
    'institution_admin',
    'regional_manager',
    'supervisor',
  ])

const PRODUCT_ORDER = [
  'professor_digital',
  'agenda_edi',
  'academy',
  'analytics',
  'sgpa',
  'observatory',
  'community',
  'backoffice',
  'experience_manager',
]

const PRODUCT_LABELS:
  Record<string, string> = {
    professor_digital:
      'Professor Digital',

    agenda_edi:
      'Agenda EDI',

    academy:
      'Academy',

    analytics:
      'Analytics',

    sgpa:
      'SGPA',

    observatory:
      'Observatório',

    community:
      'Comunidade',

    backoffice:
      'BackOffice',

    experience_manager:
      'Experience Manager',
  }

const GROUP_LABELS:
  Record<
    NavigationItem['group'],
    string
  > = {
    core:
      'Central',

    product:
      'Produtos',

    management:
      'Gestão',

    account:
      'Conta',
  }

function isActivePath(
  pathname: string,
  href: string,
): boolean {
  if (href === '/') {
    return pathname === '/'
  }

  if (href === '/portal') {
    return pathname === '/portal'
  }

  return (
    pathname === href ||
    pathname.startsWith(
      `${href}/`,
    )
  )
}

function getContextName(
  context: PortalContext,
): string {
  if (context.school) {
    return (
      context.school.shortName ??
      context.school.name
    )
  }

  if (context.organization) {
    return context.organization.name
  }

  return 'Acesso individual'
}

function getProductHref(
  product: PortalProduct,
): string {
  if (
    product.code ===
    'agenda_edi'
  ) {
    return '/agenda/dashboard'
  }

  return product.href
}

function createNavigationItems(
  portal: PortalResponse,
): NavigationItem[] {
  const context =
    portal.activeContext

  if (!context) {
    return [
      {
        key:
          'portal',

        label:
          'Central da Plataforma',

        href:
          '/portal',

        group:
          'core',
      },

      {
        key:
          'support',

        label:
          'Suporte EDI',

        href:
          '/suporte',

        group:
          'core',
      },

      {
        key:
          'profile',

        label:
          'Meu perfil',

        href:
          '/perfil',

        group:
          'account',
      },
    ]
  }

  const items:
    NavigationItem[] = [
      {
        key:
          'portal',

        label:
          'Central da Plataforma',

        href:
          '/portal',

        group:
          'core',
      },

      {
        key:
          'support',

        label:
          'Suporte EDI',

        href:
          '/suporte',

        group:
          'core',
      },
    ]

  const enabledProducts =
    new Map(
      (portal.products ?? [])
        .filter(
          product =>
            product.enabled,
        )
        .map(
          product => [
            product.code,
            product,
          ],
        ),
    )

  PRODUCT_ORDER.forEach(
    productCode => {
      const product =
        enabledProducts.get(
          productCode,
        )

      if (!product) {
        return
      }

      items.push({
        key:
          `product:${product.code}`,

        label:
          PRODUCT_LABELS[
            product.code
          ] ?? product.title,

        href:
          getProductHref(
            product,
          ),

        group:
          product.code ===
            'backoffice' ||
          product.code ===
            'experience_manager'
            ? 'management'
            : 'product',
      })
    },
  )

  if (
    INSTITUTION_CORE_ROLES.has(
      context.role,
    )
  ) {
    items.push({
      key:
        'institution-core',

      label:
        'Instituições',

      href:
        '/schools',

      group:
        'management',
    })
  }

  if (
    ORGANIZATION_CORE_ROLES.has(
      context.role,
    )
  ) {
    items.push({
      key:
        'organization-core',

      label:
        'Organizações',

      href:
        '/organizations',

      group:
        'management',
    })
  }

  items.push(
    {
      key:
        'profile',

      label:
        'Meu perfil',

      href:
        '/perfil',

      group:
        'account',
    },

    {
      key:
        'home',

      label:
        'Home EduData IA',

      href:
        '/',

      group:
        'account',
    },
  )

  const uniqueItems =
    new Map<
      string,
      NavigationItem
    >()

  items.forEach(item => {
    uniqueItems.set(
      item.href,
      item,
    )
  })

  return [
    ...uniqueItems.values(),
  ]
}

function groupNavigationItems(
  items: NavigationItem[],
) {
  return items.reduce(
    (
      groups,
      item,
    ) => {
      groups[item.group].push(
        item,
      )

      return groups
    },
    {
      core:
        [] as NavigationItem[],

      product:
        [] as NavigationItem[],

      management:
        [] as NavigationItem[],

      account:
        [] as NavigationItem[],
    },
  )
}

export function PlatformNavigation() {
  const pathname =
    usePathname()

  const router =
    useRouter()

  const [
    portal,
    setPortal,
  ] =
    useState<PortalResponse | null>(
      null,
    )

  const [
    loading,
    setLoading,
  ] =
    useState(true)

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

  useEffect(() => {
    let active = true

    const controller =
      new AbortController()

    async function loadPortal() {
      try {
        const response =
          await fetch(
            '/api/portal',
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

        if (
          response.status ===
          401
        ) {
          router.replace(
            '/login',
          )

          return
        }

        const result =
          (await response.json()) as
            PortalResponse

        if (
          !response.ok ||
          !result.success
        ) {
          throw new Error(
            result.error ??
              'Não foi possível carregar a navegação.',
          )
        }

        if (active) {
          setPortal(result)
        }
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
          setPortal(null)
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void loadPortal()

    return () => {
      active = false
      controller.abort()
    }
  }, [router])

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    if (
      !menuOpen ||
      typeof window ===
        'undefined'
    ) {
      return
    }

    const scrollPosition =
      window.scrollY

    const previousBodyStyles = {
      position:
        document.body.style
          .position,

      top:
        document.body.style.top,

      left:
        document.body.style.left,

      right:
        document.body.style.right,

      width:
        document.body.style.width,

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
  }, [menuOpen])

  const navigationItems =
    useMemo(
      () =>
        portal
          ? createNavigationItems(
              portal,
            )
          : [
              {
                key:
                  'portal',

                label:
                  'Central da Plataforma',

                href:
                  '/portal',

                group:
                  'core' as const,
              },

              {
                key:
                  'support',

                label:
                  'Suporte EDI',

                href:
                  '/suporte',

                group:
                  'core' as const,
              },

              {
                key:
                  'profile',

                label:
                  'Meu perfil',

                href:
                  '/perfil',

                group:
                  'account' as const,
              },
            ],
      [portal],
    )

  const groupedItems =
    useMemo(
      () =>
        groupNavigationItems(
          navigationItems,
        ),
      [navigationItems],
    )

  const primaryItems =
    useMemo(() => {
      const preferredKeys =
        new Set([
          'portal',
          'support',
          'product:professor_digital',
          'product:agenda_edi',
          'institution-core',
          'organization-core',
          'profile',
        ])

      return navigationItems.filter(
        item =>
          preferredKeys.has(
            item.key,
          ),
      )
    }, [navigationItems])

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
      router.replace(
        '/login',
      )

      router.refresh()
    }
  }

  const user =
    portal?.user

  const activeContext =
    portal?.activeContext

  const isPlatformAdministrator =
    activeContext
      ? PLATFORM_ROLES.has(
          activeContext.role,
        )
      : false

  return (
    <header className="sticky top-0 z-[70] w-full max-w-full overflow-x-hidden border-b border-white/10 bg-[#071827] text-white shadow-lg shadow-slate-950/10">
      <div className="mx-auto w-full max-w-7xl overflow-x-hidden px-4 sm:px-6">
        <div className="flex min-h-20 w-full min-w-0 max-w-full items-center justify-between gap-3 sm:gap-4">
          <Link
            href="/portal"
            className="min-w-0 flex-1 overflow-hidden"
            aria-label="Abrir a Central da Plataforma"
          >
            <p className="max-w-full truncate text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
              EIOS
            </p>

            <p className="max-w-full truncate text-base font-bold text-white">
              Central da Plataforma
            </p>

            {!loading &&
            activeContext ? (
              <p className="mt-1 max-w-full truncate text-xs text-slate-300">
                {getContextName(
                  activeContext,
                )}
                {' — '}
                {
                  activeContext.roleLabel
                }
              </p>
            ) : null}
          </Link>

          <nav className="hidden min-w-0 items-center gap-2 xl:flex">
            {primaryItems.map(
              item => {
                const activePath =
                  isActivePath(
                    pathname,
                    item.href,
                  )

                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    aria-current={
                      activePath
                        ? 'page'
                        : undefined
                    }
                    className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition ${
                      activePath
                        ? 'bg-white text-[#071827]'
                        : 'text-slate-200 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </Link>
                )
              },
            )}
          </nav>

          <div className="hidden min-w-0 shrink-0 items-center gap-4 xl:flex">
            <div className="min-w-0 max-w-48 text-right">
              <p className="truncate text-sm font-semibold text-white">
                {user?.displayName ??
                  'Usuário EduData IA'}
              </p>

              <p className="truncate text-xs text-slate-300">
                {isPlatformAdministrator
                  ? 'Administração da plataforma'
                  : activeContext?.roleLabel ??
                    'Perfil ativo'}
              </p>
            </div>

            <button
              type="button"
              onClick={
                handleLogout
              }
              disabled={
                loggingOut
              }
              className="shrink-0 rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loggingOut
                ? 'Saindo...'
                : 'Sair'}
            </button>
          </div>

          <button
            type="button"
            onClick={() =>
              setMenuOpen(
                current =>
                  !current,
              )
            }
            aria-expanded={
              menuOpen
            }
            aria-controls="platform-navigation-menu"
            className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg border border-white/20 px-4 text-sm font-semibold text-white transition hover:bg-white/10 xl:hidden"
          >
            {menuOpen
              ? 'Fechar'
              : 'Menu'}
          </button>
        </div>

        {menuOpen ? (
          <div
            id="platform-navigation-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Menu da Central da Plataforma"
            className="fixed inset-x-0 top-20 z-[80] h-[calc(100dvh-5rem)] w-screen max-w-full overflow-x-hidden bg-[#071827] xl:hidden"
          >
            <div className="mx-auto flex h-full w-full max-w-7xl min-w-0 flex-col overflow-x-hidden px-4 sm:px-6">
              <div className="min-h-0 min-w-0 flex-1 touch-pan-y overflow-x-hidden overflow-y-auto overscroll-contain py-5">
                {!loading &&
                user ? (
                  <div className="mb-5 min-w-0 max-w-full overflow-hidden rounded-xl border border-white/10 bg-white/5 p-4">
                    <p className="max-w-full truncate font-semibold text-white">
                      {
                        user.displayName
                      }
                    </p>

                    {user.email ? (
                      <p className="mt-1 max-w-full break-all text-sm text-slate-300">
                        {user.email}
                      </p>
                    ) : null}

                    {activeContext ? (
                      <p className="mt-3 max-w-full break-words text-sm text-cyan-200">
                        {
                          activeContext.roleLabel
                        }
                        {' — '}
                        {getContextName(
                          activeContext,
                        )}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                <div className="min-w-0 max-w-full space-y-6 pb-6">
                  {(
                    Object.keys(
                      groupedItems,
                    ) as Array<
                      keyof typeof groupedItems
                    >
                  ).map(group => {
                    const items =
                      groupedItems[group]

                    if (
                      items.length ===
                      0
                    ) {
                      return null
                    }

                    return (
                      <section
                        key={group}
                        className="min-w-0 max-w-full"
                      >
                        <p className="max-w-full truncate text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                          {
                            GROUP_LABELS[
                              group
                            ]
                          }
                        </p>

                        <div className="mt-2 grid min-w-0 max-w-full gap-2 sm:grid-cols-2">
                          {items.map(
                            item => {
                              const activePath =
                                isActivePath(
                                  pathname,
                                  item.href,
                                )

                              return (
                                <Link
                                  key={
                                    item.key
                                  }
                                  href={
                                    item.href
                                  }
                                  aria-current={
                                    activePath
                                      ? 'page'
                                      : undefined
                                  }
                                  className={`min-w-0 max-w-full break-words rounded-lg border px-4 py-3 text-sm font-semibold transition ${
                                    activePath
                                      ? 'border-white bg-white text-[#071827]'
                                      : 'border-white/10 bg-white/5 text-white hover:border-white/30 hover:bg-white/10'
                                  }`}
                                >
                                  {
                                    item.label
                                  }
                                </Link>
                              )
                            },
                          )}
                        </div>
                      </section>
                    )
                  })}
                </div>
              </div>

              <footer className="min-w-0 max-w-full shrink-0 overflow-x-hidden border-t border-white/10 bg-[#071827] pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-4">
                <button
                  type="button"
                  onClick={
                    handleLogout
                  }
                  disabled={
                    loggingOut
                  }
                  aria-label="Sair da plataforma"
                  className="mx-auto flex min-h-11 max-w-full items-center justify-center gap-2 rounded-xl border border-red-300/30 bg-red-500/[0.06] px-5 py-3 text-sm font-semibold text-red-100 transition hover:border-red-300/50 hover:bg-red-500/10 focus:outline-none focus:ring-4 focus:ring-red-300/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-5 w-5 shrink-0"
                  >
                    <path
                      d="M10 5H6.75A1.75 1.75 0 0 0 5 6.75v10.5A1.75 1.75 0 0 0 6.75 19H10"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />

                    <path
                      d="M14 8l4 4-4 4"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    <path
                      d="M18 12H9"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>

                  <span className="truncate">
                    {loggingOut
                      ? 'Encerrando sessão...'
                      : 'Sair da plataforma'}
                  </span>
                </button>

                <p className="mt-2 max-w-full break-words text-center text-xs leading-5 text-slate-400">
                  Encerra com segurança a sessão atual.
                </p>
              </footer>
            </div>
          </div>
        ) : null}
      </div>
    </header>
  )
}