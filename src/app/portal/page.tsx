'use client'

import Link from 'next/link'
import {
  useCallback,
  useEffect,
  useState,
} from 'react'

import ProfileCompletionNotice from '@/components/profile/ProfileCompletionNotice'

type AccountType =
  | 'individual'
  | 'corporate'

type NoticeLevel =
  | 'info'
  | 'warning'
  | 'error'

interface PortalNotice {
  level: NoticeLevel
  code: string
  title: string
  message: string
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

interface PortalUser {
  id: string
  email: string | null
  displayName: string
  profileStatus: string
  onboardingCompleted: boolean
}

interface PortalResponse {
  success: boolean
  user?: PortalUser
  accountType?: AccountType
  activeContext?: PortalContext
  authorizedContexts?: PortalContext[]
  onboardingRequired?: boolean
  notices?: PortalNotice[]
  products?: PortalProduct[]
  error?: string
}

function getAccountTypeLabel(
  accountType: AccountType,
): string {
  return accountType === 'corporate'
    ? 'Conta institucional'
    : 'Conta individual'
}

function getContextLabel(
  context: PortalContext,
): string {
  const parts = [
    context.organization?.name,
    context.school?.shortName ??
      context.school?.name,
    context.roleLabel,
  ].filter(Boolean)

  return parts.join(' — ')
}

function createContextQuery(
  context: PortalContext,
): string {
  const params =
    new URLSearchParams()

  if (context.organization?.id) {
    params.set(
      'organizationId',
      context.organization.id,
    )
  }

  if (context.school?.id) {
    params.set(
      'schoolId',
      context.school.id,
    )
  }

  params.set(
    'role',
    context.role,
  )

  return params.toString()
}

function getNoticeClasses(
  level: NoticeLevel,
): string {
  if (level === 'error') {
    return [
      'border-red-200',
      'bg-red-50',
      'text-red-900',
    ].join(' ')
  }

  if (level === 'warning') {
    return [
      'border-amber-200',
      'bg-amber-50',
      'text-amber-900',
    ].join(' ')
  }

  return [
    'border-blue-200',
    'bg-blue-50',
    'text-blue-900',
  ].join(' ')
}

function getNoticeBarClass(
  level: NoticeLevel,
): string {
  if (level === 'error') {
    return 'bg-red-600'
  }

  if (level === 'warning') {
    return 'bg-amber-500'
  }

  return 'bg-blue-600'
}

function getStatusLabel(
  status: string,
): string {
  if (status === 'active') {
    return 'Ativo'
  }

  if (status === 'pending') {
    return 'Pendente'
  }

  if (status === 'inactive') {
    return 'Inativo'
  }

  if (status === 'suspended') {
    return 'Suspenso'
  }

  return status
}

export default function PortalPage() {
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
    changingContext,
    setChangingContext,
  ] =
    useState(false)

  const [
    error,
    setError,
  ] =
    useState<string | null>(null)

  const loadPortal =
    useCallback(
      async (
        query?: string,
      ) => {
        try {
          setError(null)

          const endpoint =
            query
              ? `/api/portal?${query}`
              : '/api/portal'

          const response =
            await fetch(
              endpoint,
              {
                method: 'GET',
                cache: 'no-store',
              },
            )

          const result =
            (await response.json()) as
              PortalResponse

          if (
            !response.ok ||
            !result.success
          ) {
            throw new Error(
              result.error ??
                'Não foi possível carregar a Central EduData IA.',
            )
          }

          setPortal(result)
        } catch (loadError) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Não foi possível carregar a Central EduData IA.',
          )
        } finally {
          setLoading(false)
          setChangingContext(false)
        }
      },
      [],
    )

  useEffect(() => {
    void loadPortal()
  }, [loadPortal])

  async function handleContextChange(
    contextId: string,
  ) {
    const context =
      portal
        ?.authorizedContexts
        ?.find(
          (item) =>
            item.id ===
            contextId,
        )

    if (!context) {
      return
    }

    setChangingContext(true)

    await loadPortal(
      createContextQuery(
        context,
      ),
    )
  }

  if (loading) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-slate-100 px-6 py-12">
        <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#0B7491]" />

          <p className="mt-5 text-sm font-semibold text-slate-700">
            Carregando contexto de acesso...
          </p>
        </section>
      </main>
    )
  }

  if (
    error ||
    !portal ||
    !portal.user ||
    !portal.activeContext
  ) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-slate-100 px-6 py-12">
        <section className="w-full max-w-xl rounded-2xl border border-red-200 bg-white p-8 shadow-sm">
          <div className="h-1 w-16 bg-red-600" />

          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-red-600">
            Falha de acesso
          </p>

          <h1 className="mt-2 text-2xl font-bold text-slate-950">
            Não foi possível abrir a
            Central EduData IA
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            {error ??
              'O perfil ou o vínculo institucional não pôde ser identificado.'}
          </p>

          <button
            type="button"
            onClick={() => {
              setLoading(true)
              void loadPortal()
            }}
            className="mt-6 rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Tentar novamente
          </button>
        </section>
      </main>
    )
  }

  const {
    user,
    activeContext,
  } = portal

  const contexts =
    portal.authorizedContexts ?? []

  const notices =
    portal.notices ?? []

  const products =
    portal.products ?? []

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <header className="border-b border-white/10 bg-[#071827] text-white">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-300">
            EIOS — Central da Plataforma
          </p>

          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
            EduData IA
          </h1>

          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
            Um único ecossistema, um único
            motor de inteligência, múltiplos
            produtos especializados.
          </p>

          <div className="mt-8 border-l-4 border-cyan-300 pl-5">
            <p className="text-lg font-bold text-white">
              {user.displayName}
            </p>

            {user.email ? (
              <p className="mt-1 break-all text-sm text-slate-300">
                {user.email}
              </p>
            ) : null}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Contexto ativo
            </p>

            <h2 className="mt-2 text-2xl font-bold text-slate-950">
              {activeContext
                .organization
                ?.name ??
                'Acesso individual'}
            </h2>
          </div>

          <dl className="divide-y divide-slate-200">
            <div className="p-6">
              <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                Tipo de acesso
              </dt>

              <dd className="mt-3 text-lg font-semibold text-slate-950">
                {getAccountTypeLabel(
                  activeContext.accountType,
                )}
              </dd>
            </div>

            <div className="p-6">
              <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                Perfil ativo
              </dt>

              <dd className="mt-3 text-lg font-semibold text-slate-950">
                {
                  activeContext.roleLabel
                }
              </dd>
            </div>

            <div className="p-6">
              <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                Escola ou unidade
              </dt>

              <dd className="mt-3 text-lg font-semibold text-slate-950">
                {activeContext.school
                  ?.name ??
                  'Não se aplica'}
              </dd>

              {activeContext.school
                ?.city ? (
                <p className="mt-2 text-sm text-slate-500">
                  {
                    activeContext
                      .school.city
                  }

                  {activeContext
                    .school.state
                    ? ` — ${activeContext.school.state}`
                    : ''}
                </p>
              ) : null}
            </div>

            <div className="p-6">
              <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                Status do vínculo
              </dt>

              <dd className="mt-3 text-lg font-semibold text-slate-950">
                {getStatusLabel(
                  activeContext.status,
                )}
              </dd>
            </div>
          </dl>
        </section>

        {contexts.length > 1 ? (
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <label>
              <span className="text-sm font-semibold text-slate-700">
                Alterar contexto autorizado
              </span>

              <select
                value={
                  activeContext.id
                }
                disabled={
                  changingContext
                }
                onChange={(event) => {
                  void handleContextChange(
                    event.target.value,
                  )
                }}
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-[#0B7491] focus:ring-2 focus:ring-[#0B7491]/20 lg:max-w-2xl"
              >
                {contexts.map(
                  (context) => (
                    <option
                      key={context.id}
                      value={context.id}
                    >
                      {getContextLabel(
                        context,
                      )}
                    </option>
                  ),
                )}
              </select>
            </label>

            {changingContext ? (
              <p className="mt-3 text-sm font-medium text-[#0B7491]">
                Validando o novo
                contexto...
              </p>
            ) : null}
          </section>
        ) : null}

        {notices.length > 0 ? (
          <div className="mt-6 space-y-4">
            {notices.map(
              (notice) => (
                <section
                  key={`${notice.code}-${notice.title}`}
                  className={`rounded-2xl border p-6 shadow-sm ${getNoticeClasses(
                    notice.level,
                  )}`}
                >
                  <div
                    className={`h-1 w-16 ${getNoticeBarClass(
                      notice.level,
                    )}`}
                  />

                  <h2 className="mt-5 text-lg font-bold">
                    {notice.title}
                  </h2>

                  <p className="mt-2 text-sm leading-6">
                    {notice.message}
                  </p>
                </section>
              ),
            )}
          </div>
        ) : null}

        {portal.onboardingRequired ? (
          <ProfileCompletionNotice
            returnTo="/portal"
          />
        ) : null}

        <section className="mt-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Produtos especializados
          </p>

          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
            Central EduData IA
          </h2>

          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
            Os acessos são definidos pelo
            perfil, plano e vínculo ativo.
          </p>

          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {products.map(
              (product) => {
                if (!product.enabled) {
                  return (
                    <article
                      key={product.code}
                      className="rounded-2xl border border-slate-200 bg-slate-100 p-6"
                    >
                      <div className="h-1 w-16 bg-slate-400" />

                      <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Acesso restrito
                      </p>

                      <h3 className="mt-2 text-xl font-bold text-slate-700">
                        {product.title}
                      </h3>

                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        {
                          product.description
                        }
                      </p>

                      {product.unavailableReason ? (
                        <p className="mt-4 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                          {
                            product.unavailableReason
                          }
                        </p>
                      ) : null}
                    </article>
                  )
                }

                return (
                  <article
                    key={product.code}
                    className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                  >
                    <div className="h-1 w-16 bg-[#0B7491]" />

                    <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-[#0B7491]">
                      Produto disponível
                    </p>

                    <h3 className="mt-2 text-xl font-bold text-slate-950">
                      {product.title}
                    </h3>

                    <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">
                      {
                        product.description
                      }
                    </p>

                    <Link
                      href={product.href}
                      className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-[#0B7491] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#09657e]"
                    >
                      Acessar produto
                    </Link>
                  </article>
                )
              },
            )}
          </div>
        </section>
      </div>
    </main>
  )
}