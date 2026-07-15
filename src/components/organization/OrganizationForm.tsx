'use client'

import Link from 'next/link'
import {
  type ChangeEvent,
  type FormEvent,
  useCallback,
  useEffect,
  useState,
} from 'react'
import {
  useRouter,
} from 'next/navigation'

import type {
  OrganizationDto,
  OrganizationStatus,
} from '@/lib/organization/organization.dto'

interface OrganizationFormProps {
  organizationId?: string
}

interface OrganizationApiResponse {
  success: boolean
  data?: OrganizationDto
  message?: string
  error?: string
}

interface OrganizationFormState {
  name: string
  short_name: string
  organization_type: string
  document: string
  email: string
  phone: string
  website: string
  logo_url: string
  address: string
  city: string
  state: string
  zip_code: string
  country: string
  status: OrganizationStatus
}

const INITIAL_STATE:
  OrganizationFormState = {
    name: '',
    short_name: '',
    organization_type: '',
    document: '',
    email: '',
    phone: '',
    website: '',
    logo_url: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    country: 'Brasil',
    status: 'active',
  }

const ORGANIZATION_TYPES = [
  {
    value: 'platform',
    label: 'Plataforma',
  },
  {
    value: 'education_department',
    label: 'Secretaria de Educação',
  },
  {
    value: 'regional_board',
    label: 'Diretoria Regional',
  },
  {
    value: 'school_network',
    label: 'Rede de ensino',
  },
  {
    value: 'maintainer',
    label: 'Mantenedora',
  },
  {
    value: 'university',
    label: 'Universidade',
  },
  {
    value: 'company',
    label: 'Empresa',
  },
  {
    value: 'nonprofit',
    label: 'Organização social',
  },
  {
    value: 'other',
    label: 'Outra',
  },
]

const STATUS_OPTIONS: Array<{
  value: OrganizationStatus
  label: string
}> = [
  {
    value: 'active',
    label: 'Ativa',
  },
  {
    value: 'inactive',
    label: 'Inativa',
  },
  {
    value: 'pending',
    label: 'Pendente',
  },
  {
    value: 'suspended',
    label: 'Suspensa',
  },
]

function organizationToFormState(
  organization: OrganizationDto,
): OrganizationFormState {
  return {
    name: organization.name,
    short_name:
      organization.short_name ?? '',
    organization_type:
      organization.organization_type,
    document:
      organization.document ?? '',
    email:
      organization.email ?? '',
    phone:
      organization.phone ?? '',
    website:
      organization.website ?? '',
    logo_url:
      organization.logo_url ?? '',
    address:
      organization.address ?? '',
    city:
      organization.city ?? '',
    state:
      organization.state ?? '',
    zip_code:
      organization.zip_code ?? '',
    country:
      organization.country || 'Brasil',
    status:
      organization.status,
  }
}

function createPayload(
  form: OrganizationFormState,
) {
  return {
    name:
      form.name.trim(),

    short_name:
      form.short_name.trim(),

    organization_type:
      form.organization_type.trim(),

    document:
      form.document.trim(),

    email:
      form.email.trim(),

    phone:
      form.phone.trim(),

    website:
      form.website.trim(),

    logo_url:
      form.logo_url.trim(),

    address:
      form.address.trim(),

    city:
      form.city.trim(),

    state:
      form.state.trim(),

    zip_code:
      form.zip_code.trim(),

    country:
      form.country.trim() ||
      'Brasil',

    status:
      form.status,
  }
}

export default function OrganizationForm({
  organizationId,
}: OrganizationFormProps) {
  const router =
    useRouter()

  const isEditing =
    Boolean(organizationId)

  const [
    form,
    setForm,
  ] = useState<OrganizationFormState>(
    INITIAL_STATE,
  )

  const [
    loading,
    setLoading,
  ] = useState(isEditing)

  const [
    saving,
    setSaving,
  ] = useState(false)

  const [
    error,
    setError,
  ] = useState<string | null>(null)

  const [
    successMessage,
    setSuccessMessage,
  ] = useState<string | null>(null)

  const loadOrganization =
    useCallback(async () => {
      if (!organizationId) {
        return
      }

      setLoading(true)
      setError(null)

      try {
        const response =
          await fetch(
            `/api/organizations/${organizationId}`,
            {
              method: 'GET',
              cache: 'no-store',
              headers: {
                Accept:
                  'application/json',
              },
            },
          )

        const result =
          (await response.json()) as
            OrganizationApiResponse

        if (
          !response.ok ||
          !result.success ||
          !result.data
        ) {
          throw new Error(
            result.error ||
              'Não foi possível carregar a organização.',
          )
        }

        setForm(
          organizationToFormState(
            result.data,
          ),
        )
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : 'Não foi possível carregar a organização.',
        )
      } finally {
        setLoading(false)
      }
    }, [organizationId])

  useEffect(() => {
    void loadOrganization()
  }, [loadOrganization])

  function handleChange(
    event:
      ChangeEvent<
        | HTMLInputElement
        | HTMLSelectElement
      >,
  ) {
    const {
      name,
      value,
    } = event.target

    setForm(
      (current) => ({
        ...current,
        [name]: value,
      }),
    )

    setError(null)
    setSuccessMessage(null)
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    setError(null)
    setSuccessMessage(null)

    if (!form.name.trim()) {
      setError(
        'Nome da organização é obrigatório.',
      )
      return
    }

    if (
      !form.organization_type.trim()
    ) {
      setError(
        'Tipo da organização é obrigatório.',
      )
      return
    }

    setSaving(true)

    try {
      const endpoint =
        organizationId
          ? `/api/organizations/${organizationId}`
          : '/api/organizations'

      const response =
        await fetch(
          endpoint,
          {
            method:
              organizationId
                ? 'PATCH'
                : 'POST',

            cache: 'no-store',

            headers: {
              Accept:
                'application/json',
              'Content-Type':
                'application/json',
            },

            body: JSON.stringify(
              createPayload(form),
            ),
          },
        )

      const result =
        (await response.json()) as
          OrganizationApiResponse

      if (
        !response.ok ||
        !result.success ||
        !result.data
      ) {
        throw new Error(
          result.error ||
            'Não foi possível salvar a organização.',
        )
      }

      setSuccessMessage(
        result.message ||
          'Organização salva com sucesso.',
      )

      if (!organizationId) {
        router.push(
          `/organizations/${result.data.id}`,
        )
        router.refresh()
        return
      }

      setForm(
        organizationToFormState(
          result.data,
        ),
      )

      router.refresh()
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Não foi possível salvar a organização.',
      )
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-medium text-slate-600">
          Carregando organização...
        </p>
      </section>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      {error ? (
        <section className="rounded-xl border border-red-200 bg-red-50 px-5 py-4">
          <p className="text-sm font-semibold text-red-700">
            {error}
          </p>
        </section>
      ) : null}

      {successMessage ? (
        <section className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4">
          <p className="text-sm font-semibold text-emerald-700">
            {successMessage}
          </p>
        </section>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="h-1 w-16 bg-[#0B7491]" />

        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Identificação institucional
        </p>

        <h2 className="mt-2 text-xl font-bold text-slate-950">
          Dados principais
        </h2>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <label className="md:col-span-2">
            <span className="text-sm font-semibold text-slate-700">
              Nome da organização
            </span>

            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              maxLength={200}
              placeholder="Nome completo da organização"
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-[#0B7491] focus:ring-2 focus:ring-[#0B7491]/20"
            />
          </label>

          <label>
            <span className="text-sm font-semibold text-slate-700">
              Nome curto
            </span>

            <input
              name="short_name"
              value={form.short_name}
              onChange={handleChange}
              maxLength={100}
              placeholder="Sigla ou nome resumido"
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-[#0B7491] focus:ring-2 focus:ring-[#0B7491]/20"
            />
          </label>

          <label>
            <span className="text-sm font-semibold text-slate-700">
              Tipo
            </span>

            <select
              name="organization_type"
              value={
                form.organization_type
              }
              onChange={handleChange}
              required
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-[#0B7491] focus:ring-2 focus:ring-[#0B7491]/20"
            >
              <option value="">
                Selecione
              </option>

              {ORGANIZATION_TYPES.map(
                (type) => (
                  <option
                    key={type.value}
                    value={type.value}
                  >
                    {type.label}
                  </option>
                ),
              )}
            </select>
          </label>

          <label>
            <span className="text-sm font-semibold text-slate-700">
              Documento
            </span>

            <input
              name="document"
              value={form.document}
              onChange={handleChange}
              maxLength={50}
              placeholder="CNPJ ou documento institucional"
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-[#0B7491] focus:ring-2 focus:ring-[#0B7491]/20"
            />
          </label>

          <label>
            <span className="text-sm font-semibold text-slate-700">
              Status
            </span>

            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-[#0B7491] focus:ring-2 focus:ring-[#0B7491]/20"
            >
              {STATUS_OPTIONS.map(
                (status) => (
                  <option
                    key={status.value}
                    value={status.value}
                  >
                    {status.label}
                  </option>
                ),
              )}
            </select>
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Contato e presença digital
        </p>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <label>
            <span className="text-sm font-semibold text-slate-700">
              E-mail
            </span>

            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              maxLength={254}
              placeholder="contato@organizacao.org"
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-[#0B7491] focus:ring-2 focus:ring-[#0B7491]/20"
            />
          </label>

          <label>
            <span className="text-sm font-semibold text-slate-700">
              Telefone
            </span>

            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              maxLength={30}
              placeholder="Telefone institucional"
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-[#0B7491] focus:ring-2 focus:ring-[#0B7491]/20"
            />
          </label>

          <label>
            <span className="text-sm font-semibold text-slate-700">
              Site
            </span>

            <input
              type="url"
              name="website"
              value={form.website}
              onChange={handleChange}
              maxLength={500}
              placeholder="https://organizacao.org"
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-[#0B7491] focus:ring-2 focus:ring-[#0B7491]/20"
            />
          </label>

          <label>
            <span className="text-sm font-semibold text-slate-700">
              URL do logotipo
            </span>

            <input
              type="url"
              name="logo_url"
              value={form.logo_url}
              onChange={handleChange}
              maxLength={500}
              placeholder="https://..."
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-[#0B7491] focus:ring-2 focus:ring-[#0B7491]/20"
            />
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Localização
        </p>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <label className="md:col-span-2">
            <span className="text-sm font-semibold text-slate-700">
              Endereço
            </span>

            <input
              name="address"
              value={form.address}
              onChange={handleChange}
              maxLength={300}
              placeholder="Endereço institucional"
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-[#0B7491] focus:ring-2 focus:ring-[#0B7491]/20"
            />
          </label>

          <label>
            <span className="text-sm font-semibold text-slate-700">
              Cidade
            </span>

            <input
              name="city"
              value={form.city}
              onChange={handleChange}
              maxLength={120}
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-[#0B7491] focus:ring-2 focus:ring-[#0B7491]/20"
            />
          </label>

          <label>
            <span className="text-sm font-semibold text-slate-700">
              Estado
            </span>

            <input
              name="state"
              value={form.state}
              onChange={handleChange}
              maxLength={100}
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-[#0B7491] focus:ring-2 focus:ring-[#0B7491]/20"
            />
          </label>

          <label>
            <span className="text-sm font-semibold text-slate-700">
              CEP
            </span>

            <input
              name="zip_code"
              value={form.zip_code}
              onChange={handleChange}
              maxLength={20}
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-[#0B7491] focus:ring-2 focus:ring-[#0B7491]/20"
            />
          </label>

          <label>
            <span className="text-sm font-semibold text-slate-700">
              País
            </span>

            <input
              name="country"
              value={form.country}
              onChange={handleChange}
              maxLength={100}
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-[#0B7491] focus:ring-2 focus:ring-[#0B7491]/20"
            />
          </label>
        </div>
      </section>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link
          href="/organizations"
          className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Cancelar
        </Link>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center rounded-lg bg-[#0B7491] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#095f77] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving
            ? 'Salvando...'
            : isEditing
              ? 'Salvar alterações'
              : 'Cadastrar organização'}
        </button>
      </div>
    </form>
  )
}