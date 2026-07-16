'use client'

import {
  type FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { useRouter } from 'next/navigation'

type ProfileData = {
  userId: string
  displayName: string | null
  phone: string | null
  role: string
  status: string
  onboardingCompleted: boolean
}

type ProfileApiResponse = {
  success: boolean
  message?: string
  error?: string

  user?: {
    id: string
    email: string | null
  }

  profile?: ProfileData
}

type AccountType =
  | 'individual'
  | 'corporate'

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

type PortalApiResponse = {
  success: boolean
  activeContext?: PortalContext
  error?: string
}

const ROLE_LABELS:
  Record<string, string> = {
    student: 'Estudante',
    aluno: 'Estudante',

    teacher: 'Professor',
    professor: 'Professor',

    coordinator: 'Coordenador',
    coordenador: 'Coordenador',

    vice_principal: 'Vice-diretor',
    vice_diretor: 'Vice-diretor',

    principal: 'Diretor',
    director: 'Diretor',
    diretor: 'Diretor',

    supervisor: 'Supervisor',

    regional_manager:
      'Gestor Regional',

    gestor_regional:
      'Gestor Regional',

    institution_admin:
      'Administrador Institucional',

    admin_institucional:
      'Administrador Institucional',

    admin:
      'Administrador Institucional',

    platform_admin:
      'Administrador da Plataforma',

    super_admin:
      'Superadministrador EduData IA',
  }

const SCOPE_LABELS:
  Record<string, string> = {
    self:
      'Somente os próprios registros',

    team:
      'Equipe sob responsabilidade',

    area:
      'Área sob responsabilidade',

    school:
      'Escola ou unidade',

    organization:
      'Instituição',

    network:
      'Rede institucional',

    platform:
      'Plataforma EduData IA',
  }

function normalizeRole(
  role: string,
): string {
  return role
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(
      /[\u0300-\u036f]/g,
      '',
    )
    .replace(
      /[\s-]+/g,
      '_',
    )
}

function getRoleLabel(
  role: string,
): string {
  const normalizedRole =
    normalizeRole(role)

  return (
    ROLE_LABELS[
      normalizedRole
    ] ?? role
  )
}

function getStatusLabel(
  status: string,
): string {
  const normalizedStatus =
    status
      .trim()
      .toLowerCase()

  if (
    normalizedStatus ===
    'active'
  ) {
    return 'Ativo'
  }

  if (
    normalizedStatus ===
    'pending'
  ) {
    return 'Pendente'
  }

  if (
    normalizedStatus ===
    'suspended'
  ) {
    return 'Suspenso'
  }

  if (
    normalizedStatus ===
    'rejected'
  ) {
    return 'Rejeitado'
  }

  if (
    normalizedStatus ===
    'archived'
  ) {
    return 'Arquivado'
  }

  return status
}

function getAccountTypeLabel(
  accountType:
    | AccountType
    | null,
): string {
  if (
    accountType ===
    'corporate'
  ) {
    return 'Conta institucional'
  }

  if (
    accountType ===
    'individual'
  ) {
    return 'Conta individual'
  }

  return 'Não identificado'
}

function getScopeLabel(
  scopeType:
    | string
    | null,
): string {
  if (!scopeType) {
    return 'Não identificado'
  }

  return (
    SCOPE_LABELS[
      scopeType
    ] ?? scopeType
  )
}

function getSafeReturnTo():
  | string
  | null {
  if (
    typeof window ===
    'undefined'
  ) {
    return null
  }

  const params =
    new URLSearchParams(
      window.location.search,
    )

  const returnTo =
    params.get('returnTo')

  if (
    !returnTo ||
    !returnTo.startsWith('/') ||
    returnTo.startsWith('//')
  ) {
    return null
  }

  return returnTo
}

export default function ProfileForm() {
  const router =
    useRouter()

  const redirectTimeoutRef =
    useRef<number | null>(
      null,
    )

  const [
    displayName,
    setDisplayName,
  ] = useState('')

  const [
    phone,
    setPhone,
  ] = useState('')

  const [
    email,
    setEmail,
  ] = useState<
    string | null
  >(null)

  const [
    role,
    setRole,
  ] = useState('')

  const [
    status,
    setStatus,
  ] = useState('')

  const [
    onboardingCompleted,
    setOnboardingCompleted,
  ] = useState(false)

  const [
    activeContext,
    setActiveContext,
  ] =
    useState<PortalContext | null>(
      null,
    )

  const [
    loading,
    setLoading,
  ] = useState(true)

  const [
    saving,
    setSaving,
  ] = useState(false)

  const [
    redirecting,
    setRedirecting,
  ] = useState(false)

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    )

  const [
    contextWarning,
    setContextWarning,
  ] =
    useState<string | null>(
      null,
    )

  const [
    successMessage,
    setSuccessMessage,
  ] =
    useState<string | null>(
      null,
    )

  const loadProfile =
    useCallback(
      async () => {
        try {
          setLoading(true)
          setError(null)
          setContextWarning(null)

          const [
            profileResponse,
            portalResponse,
          ] = await Promise.all([
            fetch(
              '/api/profile',
              {
                method: 'GET',
                cache: 'no-store',
              },
            ),

            fetch(
              '/api/portal',
              {
                method: 'GET',
                cache: 'no-store',
              },
            ),
          ])

          const profileResult =
            (await profileResponse.json()) as
              ProfileApiResponse

          const portalResult =
            (await portalResponse.json()) as
              PortalApiResponse

          if (
            !profileResponse.ok ||
            !profileResult.success ||
            !profileResult.profile
          ) {
            throw new Error(
              profileResult.error ??
                'Não foi possível carregar o perfil.',
            )
          }

          setDisplayName(
            profileResult.profile
              .displayName ?? '',
          )

          setPhone(
            profileResult.profile
              .phone ?? '',
          )

          setRole(
            profileResult.profile
              .role,
          )

          setStatus(
            profileResult.profile
              .status,
          )

          setOnboardingCompleted(
            profileResult.profile
              .onboardingCompleted,
          )

          setEmail(
            profileResult.user
              ?.email ?? null,
          )

          if (
            portalResponse.ok &&
            portalResult.success &&
            portalResult.activeContext
          ) {
            setActiveContext(
              portalResult.activeContext,
            )
          } else {
            setActiveContext(null)

            setContextWarning(
              portalResult.error ??
                'O contexto institucional não pôde ser carregado.',
            )
          }
        } catch (loadError) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Não foi possível carregar o perfil.',
          )
        } finally {
          setLoading(false)
        }
      },
      [],
    )

  useEffect(() => {
    void loadProfile()
  }, [loadProfile])

  useEffect(() => {
    return () => {
      if (
        redirectTimeoutRef.current !==
        null
      ) {
        window.clearTimeout(
          redirectTimeoutRef.current,
        )
      }
    }
  }, [])

  async function handleSubmit(
    event: FormEvent,
  ) {
    event.preventDefault()

    try {
      setSaving(true)
      setRedirecting(false)
      setError(null)
      setSuccessMessage(null)

      const response =
        await fetch(
          '/api/profile',
          {
            method: 'PATCH',

            headers: {
              'Content-Type':
                'application/json',
            },

            body:
              JSON.stringify({
                displayName,
                phone,
              }),
          },
        )

      const result =
        (await response.json()) as
          ProfileApiResponse

      if (
        !response.ok ||
        !result.success ||
        !result.profile
      ) {
        throw new Error(
          result.error ??
            'Não foi possível atualizar o perfil.',
        )
      }

      setDisplayName(
        result.profile
          .displayName ?? '',
      )

      setPhone(
        result.profile.phone ?? '',
      )

      setRole(
        result.profile.role,
      )

      setStatus(
        result.profile.status,
      )

      setOnboardingCompleted(
        result.profile
          .onboardingCompleted,
      )

      setSuccessMessage(
        result.message ??
          'Perfil atualizado com sucesso.',
      )

      const returnTo =
        getSafeReturnTo()

      if (returnTo) {
        setRedirecting(true)

        redirectTimeoutRef.current =
          window.setTimeout(
            () => {
              router.replace(
                returnTo,
              )

              router.refresh()
            },
            800,
          )
      }
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Não foi possível atualizar o perfil.',
      )
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#0B7491]" />

        <p className="mt-5 text-center text-sm font-semibold text-slate-700">
          Carregando informações do usuário...
        </p>
      </section>
    )
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-6">
        <div className="h-1 w-16 bg-[#0B7491]" />

        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Identidade do usuário
        </p>

        <h2 className="mt-2 text-2xl font-bold text-slate-950">
          Meu Perfil
        </h2>

        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          Atualize seus dados pessoais.
          Perfil, instituição, hierarquia
          e permissões são administrados
          pela gestão responsável.
        </p>
      </div>

      <dl className="divide-y divide-slate-200">
        <div className="p-6">
          <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            E-mail
          </dt>

          <dd className="mt-3 break-all text-base font-semibold text-slate-950">
            {email ??
              'Não informado'}
          </dd>
        </div>

        <div className="p-6">
          <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            Perfil
          </dt>

          <dd className="mt-3 text-base font-semibold text-slate-950">
            {activeContext
              ?.roleLabel ??
              getRoleLabel(role)}
          </dd>
        </div>

        <div className="p-6">
          <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            Status
          </dt>

          <dd className="mt-3 text-base font-semibold text-slate-950">
            {getStatusLabel(
              activeContext
                ?.status ??
                status,
            )}
          </dd>
        </div>

        <div className="p-6">
          <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            Cadastro
          </dt>

          <dd className="mt-3 text-base font-semibold text-slate-950">
            {onboardingCompleted
              ? 'Concluído'
              : 'Incompleto'}
          </dd>
        </div>
      </dl>

      <div className="border-t border-slate-200 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Contexto de acesso
        </p>

        <h2 className="mt-2 text-2xl font-bold text-slate-950">
          Dados institucionais
        </h2>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          Essas informações são somente
          para consulta e não podem ser
          alteradas pelo usuário.
        </p>

        {contextWarning ? (
          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
            {contextWarning}
          </div>
        ) : null}

        <dl className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
          <div className="border-b border-slate-200 p-5">
            <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Tipo de conta
            </dt>

            <dd className="mt-3 font-semibold text-slate-950">
              {getAccountTypeLabel(
                activeContext
                  ?.accountType ??
                  null,
              )}
            </dd>
          </div>

          <div className="border-b border-slate-200 p-5">
            <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Instituição
            </dt>

            <dd className="mt-3 font-semibold text-slate-950">
              {activeContext
                ?.organization
                ?.name ??
                'Não se aplica'}
            </dd>
          </div>

          <div className="border-b border-slate-200 p-5">
            <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Escola ou unidade
            </dt>

            <dd className="mt-3 font-semibold text-slate-950">
              {activeContext
                ?.school
                ?.name ??
                'Não se aplica'}
            </dd>

            {activeContext
              ?.school
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

          <div className="border-b border-slate-200 p-5">
            <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Perfil ativo
            </dt>

            <dd className="mt-3 font-semibold text-slate-950">
              {activeContext
                ?.roleLabel ??
                getRoleLabel(role)}
            </dd>
          </div>

          <div className="border-b border-slate-200 p-5">
            <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Nível hierárquico
            </dt>

            <dd className="mt-3 font-semibold text-slate-950">
              {activeContext
                ? activeContext
                    .hierarchyLevel
                : 'Não se aplica'}
            </dd>
          </div>

          <div className="p-5">
            <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Escopo de acesso
            </dt>

            <dd className="mt-3 font-semibold text-slate-950">
              {getScopeLabel(
                activeContext
                  ?.scopeType ??
                  null,
              )}
            </dd>
          </div>
        </dl>
      </div>

      <form
        onSubmit={handleSubmit}
        className="border-t border-slate-200 p-6"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Dados editáveis
        </p>

        <h2 className="mt-2 text-2xl font-bold text-slate-950">
          Informações pessoais
        </h2>

        {error ? (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700"
          >
            {error}
          </div>
        ) : null}

        {successMessage ? (
          <div
            role="status"
            className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-700"
          >
            {redirecting
              ? `${successMessage} Retornando à Central da Plataforma...`
              : successMessage}
          </div>
        ) : null}

        <div className="mt-6 grid gap-5">
          <label>
            <span className="text-sm font-semibold text-slate-700">
              Nome de exibição
            </span>

            <input
              type="text"
              value={displayName}
              onChange={(event) =>
                setDisplayName(
                  event.target.value,
                )
              }
              minLength={3}
              maxLength={120}
              required
              autoComplete="name"
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-[#0B7491] focus:ring-2 focus:ring-[#0B7491]/20"
            />

            <span className="mt-2 block text-sm text-slate-500">
              Esse nome será exibido nas
              interfaces da plataforma.
            </span>
          </label>

          <label>
            <span className="text-sm font-semibold text-slate-700">
              Telefone
            </span>

            <input
              type="tel"
              value={phone}
              onChange={(event) =>
                setPhone(
                  event.target.value,
                )
              }
              maxLength={24}
              autoComplete="tel"
              placeholder="(11) 99999-9999"
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-[#0B7491] focus:ring-2 focus:ring-[#0B7491]/20"
            />
          </label>
        </div>

        <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 px-4 py-4">
          <p className="font-semibold text-blue-950">
            Dados institucionais protegidos
          </p>

          <p className="mt-2 text-sm leading-6 text-blue-900">
            Perfil, cargo, instituição,
            escola, nível hierárquico e
            permissões não podem ser
            alterados nesta tela. Em contas
            corporativas, essas informações
            são definidas pela chefia ou pelo
            administrador institucional.
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="submit"
            disabled={
              saving ||
              redirecting
            }
            className="rounded-lg bg-[#0B7491] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#09657e] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {redirecting
              ? 'Retornando à Central...'
              : saving
                ? 'Salvando...'
                : 'Salvar alterações'}
          </button>

          <button
            type="button"
            disabled={
              saving ||
              redirecting
            }
            onClick={() => {
              void loadProfile()
            }}
            className="rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Recarregar dados
          </button>
        </div>
      </form>
    </section>
  )
}