'use client'

import Link from 'next/link'
import {
  useEffect,
  useState,
} from 'react'

type AccountType =
  | 'individual'
  | 'corporate'

type NoticeLevel =
  | 'info'
  | 'warning'
  | 'error'

type PortalNotice = {
  level: NoticeLevel
  code: string
  title: string
  message: string
}

type PortalContext = {
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

type PortalProduct = {
  code: string
  title: string
  description: string
  href: string
  enabled: boolean
  unavailableReason: string | null
}

type PortalResponse = {
  success: boolean

  user?: {
    id: string
    email: string | null
    displayName: string
    profileStatus: string
    onboardingCompleted: boolean
  }

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

export default function PortalPage() {
  const [
    portal,
    setPortal,
  ] = useState<PortalResponse | null>(
    null,
  )

  const [
    loading,
    setLoading,
  ] = useState(true)

  const [
    changingContext,
    setChangingContext,
  ] = useState(false)

  const [
    error,
    setError,
  ] = useState<string | null>(
    null,
  )

  async function loadPortal(
    query?: string,
  ) {
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
            cache: 'no-store',
          },
        )

      const result =
        (await response.json()) as PortalResponse

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
  }

  useEffect(() => {
    void loadPortal()
  }, [])

  async function handleContextChange(
    contextId: string,
  ) {
    const context =
      portal?.authorizedContexts?.find(
        (item) =>
          item.id === contextId,
      )

    if (!context) {
      return
    }

    setChangingContext(true)

    await loadPortal(
      createContextQuery(context),
    )
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="rounded-2xl border border-slate-200 bg-white p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              EduData IA
            </p>

            <p className="mt-4 text-lg font-semibold text-slate-900">
              Carregando contexto de acesso...
            </p>
          </div>
        </div>
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
      <main className="min-h-screen bg-slate-100">
        <div className="mx-auto max-w-3xl px-6 py-12">
          <section className="rounded-2xl border border-red-200 bg-white p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-red-700">
              Falha de acesso
            </p>

            <h1 className="mt-3 text-2xl font-bold text-slate-950">
              Não foi possível abrir a Central EduData IA
            </h1>

            <p className="mt-4 text-slate-600">
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
        </div>
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
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-300">
                EIOS — Central da Plataforma
              </p>

              <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                EduData IA
              </h1>

              <p className="mt-2 text-sm text-slate-300">
                Um único ecossistema, um único motor de inteligência, múltiplos produtos especializados.
              </p>
            </div>

            <div className="border-l-2 border-cyan-300 pl-4">
              <p className="text-sm font-semibold">
                {user.displayName}
              </p>

              <p className="mt-1 text-xs text-slate-300">
                {user.email}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Contexto ativo
            </p>

            <h2 className="mt-2 text-2xl font-bold text-slate-950">
              {activeContext.organization?.name ??
                'Acesso individual'}
            </h2>
          </div>

          <div className="grid gap-px bg-slate-200 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-white p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Tipo de acesso
              </p>

              <p className="mt-2 font-semibold text-slate-950">
                {getAccountTypeLabel(
                  activeContext.accountType,
                )}
              </p>
            </div>

            <div className="bg-white p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Perfil ativo
              </p>

              <p className="mt-2 font-semibold text-slate-950">
                {activeContext.roleLabel}
              </p>
            </div>

            <div className="bg-white p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Escola ou unidade
              </p>

              <p className="mt-2 font-semibold text-slate-950">
                {activeContext.school?.name ??
                  'Não se aplica'}
              </p>

              {activeContext.school?.city && (
                <p className="mt-1 text-sm text-slate-500">
                  {activeContext.school.city}
                  {activeContext.school.state
                    ? ` — ${activeContext.school.state}`
                    : ''}
                </p>
              )}
            </div>

            <div className="bg-white p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Status do vínculo
              </p>

              <p className="mt-2 font-semibold text-slate-950">
                {activeContext.status ===
                'active'
                  ? 'Ativo'
                  : activeContext.status}
              </p>
            </div>
          </div>

          {contexts.length > 1 && (
            <div className="border-t border-slate-200 px-6 py-5">
              <label
                htmlFor="active-context"
                className="block text-sm font-semibold text-slate-800"
              >
                Alterar contexto autorizado
              </label>

              <select
                id="active-context"
                value={activeContext.id}
                disabled={changingContext}
                onChange={(event) => {
                  void handleContextChange(
                    event.target.value,
                  )
                }}
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-700 lg:max-w-2xl"
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

              {changingContext && (
                <p className="mt-2 text-sm text-slate-500">
                  Validando o novo contexto...
                </p>
              )}
            </div>
          )}
        </section>

        {notices.length > 0 && (
          <section
            className="mt-6 space-y-3"
            aria-label="Notificações de acesso"
          >
            {notices.map(
              (notice) => (
                <article
                  key={`${notice.code}-${notice.title}`}
                  className={`rounded-xl border p-5 ${getNoticeClasses(
                    notice.level,
                  )}`}
                >
                  <h2 className="font-bold">
                    {notice.title}
                  </h2>

                  <p className="mt-1 text-sm">
                    {notice.message}
                  </p>
                </article>
              ),
            )}
          </section>
        )}

        {portal.onboardingRequired && (
          <section className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-950">
            <h2 className="font-bold">
              Cadastro incompleto
            </h2>

            <p className="mt-1 text-sm">
              Conclua as informações do perfil para utilizar todos os recursos liberados para sua conta.
            </p>
          </section>
        )}

        <section className="mt-10">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Produtos especializados
              </p>

              <h2 className="mt-2 text-2xl font-bold text-slate-950">
                Central EduData IA
              </h2>
            </div>

            <p className="text-sm text-slate-500">
              Os acessos são definidos pelo perfil, plano e vínculo ativo.
            </p>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {products.map(
              (product) => {
                if (!product.enabled) {
                  return (
                    <article
                      key={product.code}
                      className="flex min-h-56 flex-col rounded-2xl border border-slate-200 bg-slate-50 p-6 opacity-70"
                    >
                      <div className="h-1 w-16 bg-slate-300" />

                      <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Acesso restrito
                      </p>

                      <h3 className="mt-2 text-xl font-bold text-slate-800">
                        {product.title}
                      </h3>

                      <p className="mt-3 text-sm leading-6 text-slate-500">
                        {product.description}
                      </p>

                      <p className="mt-auto pt-6 text-xs font-semibold text-slate-500">
                        {product.unavailableReason}
                      </p>
                    </article>
                  )
                }

                return (
                  <Link
                    key={product.code}
                    href={product.href}
                    className="group flex min-h-56 flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-400 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-slate-700 focus:ring-offset-2"
                  >
                    <div className="h-1 w-16 bg-[#0B7491] transition-all group-hover:w-24" />

                    <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-[#0B7491]">
                      Produto disponível
                    </p>

                    <h3 className="mt-2 text-xl font-bold text-slate-950">
                      {product.title}
                    </h3>

                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {product.description}
                    </p>

                    <p className="mt-auto pt-6 text-sm font-semibold text-slate-900">
                      Acessar produto
                    </p>
                  </Link>
                )
              },
            )}
          </div>
        </section>
      </div>
    </main>
  )
}