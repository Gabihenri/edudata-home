'use client'

import {
  type FormEvent,
  useEffect,
  useState,
} from 'react'

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

    platform_admin:
      'Administrador da Plataforma',

    admin:
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
    ROLE_LABELS[normalizedRole] ??
    role
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
    normalizedStatus === 'active'
  ) {
    return 'Ativo'
  }

  if (
    normalizedStatus === 'pending'
  ) {
    return 'Pendente'
  }

  if (
    normalizedStatus === 'suspended'
  ) {
    return 'Suspenso'
  }

  if (
    normalizedStatus === 'rejected'
  ) {
    return 'Rejeitado'
  }

  if (
    normalizedStatus === 'archived'
  ) {
    return 'Arquivado'
  }

  return status
}

function getAccountTypeLabel(
  accountType:
    AccountType | null,
): string {
  if (
    accountType === 'corporate'
  ) {
    return 'Conta institucional'
  }

  if (
    accountType === 'individual'
  ) {
    return 'Conta individual'
  }

  return 'Não identificado'
}

function getScopeLabel(
  scopeType: string | null,
): string {
  if (!scopeType) {
    return 'Não identificado'
  }

  return (
    SCOPE_LABELS[scopeType] ??
    scopeType
  )
}

export default function ProfileForm() {
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
  ] = useState<string | null>(
    null,
  )

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
  ] = useState<PortalContext | null>(
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
    error,
    setError,
  ] = useState<string | null>(
    null,
  )

  const [
    contextWarning,
    setContextWarning,
  ] = useState<string | null>(
    null,
  )

  const [
    successMessage,
    setSuccessMessage,
  ] = useState<string | null>(
    null,
  )

  async function loadProfile() {
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
        profileResult.profile.role,
      )

      setStatus(
        profileResult.profile.status,
      )

      setOnboardingCompleted(
        profileResult.profile
          .onboardingCompleted,
      )

      setEmail(
        profileResult.user?.email ??
        null,
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
  }

  useEffect(() => {
    void loadProfile()
  }, [])

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    try {
      setSaving(true)
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

            body: JSON.stringify({
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
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Meu Perfil
        </p>

        <p className="mt-4 text-base font-semibold text-slate-900">
          Carregando informações do usuário...
        </p>
      </section>
    )
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-6 py-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Identidade do usuário
        </p>

        <h1 className="mt-2 text-2xl font-bold text-slate-950">
          Meu Perfil
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          Atualize seus dados pessoais. Perfil,
          instituição, hierarquia e permissões
          são administrados pela gestão
          responsável.
        </p>
      </div>

      <div className="grid gap-px bg-slate-200 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            E-mail
          </p>

          <p className="mt-2 break-all text-sm font-semibold text-slate-950">
            {email ??
              'Não informado'}
          </p>
        </div>

        <div className="bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Perfil
          </p>

          <p className="mt-2 text-sm font-semibold text-slate-950">
            {activeContext?.roleLabel ??
              getRoleLabel(role)}
          </p>
        </div>

        <div className="bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Status
          </p>

          <p className="mt-2 text-sm font-semibold text-slate-950">
            {getStatusLabel(
              activeContext?.status ??
              status,
            )}
          </p>
        </div>

        <div className="bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Cadastro
          </p>

          <p className="mt-2 text-sm font-semibold text-slate-950">
            {onboardingCompleted
              ? 'Concluído'
              : 'Incompleto'}
          </p>
        </div>
      </div>

      <div className="border-t border-slate-200 px-6 py-7">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Contexto de acesso
        </p>

        <h2 className="mt-2 text-xl font-bold text-slate-950">
          Dados institucionais
        </h2>

        <p className="mt-2 text-sm text-slate-600">
          Essas informações são somente para
          consulta e não podem ser alteradas pelo
          usuário.
        </p>

        {contextWarning && (
          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            {contextWarning}
          </div>
        )}

        <div className="mt-6 grid gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 sm:grid-cols-2 lg:grid-cols-3">
          <div className="bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Tipo de conta
            </p>

            <p className="mt-2 text-sm font-semibold text-slate-950">
              {getAccountTypeLabel(
                activeContext?.accountType ??
                null,
              )}
            </p>
          </div>

          <div className="bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Instituição
            </p>

            <p className="mt-2 text-sm font-semibold text-slate-950">
              {activeContext
                ?.organization
                ?.name ??
                'Não se aplica'}
            </p>
          </div>

          <div className="bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Escola ou unidade
            </p>

            <p className="mt-2 text-sm font-semibold text-slate-950">
              {activeContext
                ?.school
                ?.name ??
                'Não se aplica'}
            </p>

            {activeContext?.school?.city && (
              <p className="mt-1 text-xs text-slate-500">
                {activeContext.school.city}
                {activeContext.school.state
                  ? ` — ${activeContext.school.state}`
                  : ''}
              </p>
            )}
          </div>

          <div className="bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Perfil ativo
            </p>

            <p className="mt-2 text-sm font-semibold text-slate-950">
              {activeContext
                ?.roleLabel ??
                getRoleLabel(role)}
            </p>
          </div>

          <div className="bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Nível hierárquico
            </p>

            <p className="mt-2 text-sm font-semibold text-slate-950">
              {activeContext
                ? activeContext
                    .hierarchyLevel
                : 'Não se aplica'}
            </p>
          </div>

          <div className="bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Escopo de acesso
            </p>

            <p className="mt-2 text-sm font-semibold text-slate-950">
              {getScopeLabel(
                activeContext
                  ?.scopeType ??
                null,
              )}
            </p>
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 border-t border-slate-200 px-6 py-7"
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Dados editáveis
          </p>

          <h2 className="mt-2 text-xl font-bold text-slate-950">
            Informações pessoais
          </h2>
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900"
          >
            {error}
          </div>
        )}

        {successMessage && (
          <div
            role="status"
            className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"
          >
            {successMessage}
          </div>
        )}

        <div>
          <label
            htmlFor="display-name"
            className="block text-sm font-semibold text-slate-800"
          >
            Nome de exibição
          </label>

          <input
            id="display-name"
            name="displayName"
            type="text"
            value={displayName}
            onChange={(event) => {
              setDisplayName(
                event.target.value,
              )
            }}
            minLength={3}
            maxLength={120}
            required
            autoComplete="name"
            className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-[#0B7491] focus:ring-2 focus:ring-[#0B7491]/20"
          />

          <p className="mt-2 text-xs text-slate-500">
            Esse nome será exibido nas interfaces
            da plataforma.
          </p>
        </div>

        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-semibold text-slate-800"
          >
            Telefone
          </label>

          <input
            id="phone"
            name="phone"
            type="tel"
            value={phone}
            onChange={(event) => {
              setPhone(
                event.target.value,
              )
            }}
            maxLength={24}
            autoComplete="tel"
            placeholder="(11) 99999-9999"
            className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-[#0B7491] focus:ring-2 focus:ring-[#0B7491]/20"
          />
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-sm font-semibold text-slate-900">
            Dados institucionais protegidos
          </p>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Perfil, cargo, instituição, escola,
            nível hierárquico e permissões não
            podem ser alterados nesta tela. Em
            contas corporativas, essas informações
            são definidas pela chefia ou pelo
            administrador institucional.
          </p>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-[#071827] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#0B2A40] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving
              ? 'Salvando...'
              : 'Salvar alterações'}
          </button>

          <button
            type="button"
            disabled={saving}
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