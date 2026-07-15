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
    successMessage,
    setSuccessMessage,
  ] = useState<string | null>(
    null,
  )

  async function loadProfile() {
    try {
      setLoading(true)
      setError(null)

      const response =
        await fetch(
          '/api/profile',
          {
            method: 'GET',
            cache: 'no-store',
          },
        )

      const result =
        (await response.json()) as ProfileApiResponse

      if (
        !response.ok ||
        !result.success ||
        !result.profile
      ) {
        throw new Error(
          result.error ??
          'Não foi possível carregar o perfil.',
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

      setEmail(
        result.user?.email ?? null,
      )
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
        (await response.json()) as ProfileApiResponse

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
          Atualize seus dados pessoais. Perfil, instituição, hierarquia e permissões são administrados pela gestão responsável.
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
            {getRoleLabel(role)}
          </p>
        </div>

        <div className="bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Status
          </p>

          <p className="mt-2 text-sm font-semibold text-slate-950">
            {getStatusLabel(status)}
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

      <form
        onSubmit={handleSubmit}
        className="space-y-6 px-6 py-7"
      >
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
            Esse nome será exibido nas interfaces da plataforma.
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
            Perfil, cargo, instituição, escola, nível hierárquico e permissões não podem ser alterados nesta tela. Em contas corporativas, essas informações são definidas pela chefia ou pelo administrador institucional.
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