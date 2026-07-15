'use client'

import {
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useRouter } from 'next/navigation'

import type {
  AdministrativeType,
  EducationNetwork,
  SchoolDto,
  SchoolStatus,
} from '@/lib/schools/school.dto'

interface OrganizationOption {
  id: string
  name: string
  short_name: string | null
  status: string
}

interface SchoolFormProps {
  schoolId?: string
  organizationId?: string
}

interface SchoolFormState {
  organization_id: string
  name: string
  short_name: string
  inep_code: string
  education_network: EducationNetwork
  administrative_type: AdministrativeType
  principal_name: string
  email: string
  phone: string
  website: string
  postal_code: string
  address: string
  number: string
  complement: string
  district: string
  city: string
  state: string
  country: string
  status: SchoolStatus
}

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

const INITIAL_FORM: SchoolFormState = {
  organization_id: '',
  name: '',
  short_name: '',
  inep_code: '',
  education_network: 'other',
  administrative_type: 'other',
  principal_name: '',
  email: '',
  phone: '',
  website: '',
  postal_code: '',
  address: '',
  number: '',
  complement: '',
  district: '',
  city: '',
  state: '',
  country: 'Brasil',
  status: 'active',
}

const EDUCATION_NETWORK_OPTIONS: Array<{
  value: EducationNetwork
  label: string
}> = [
  {
    value: 'municipal',
    label: 'Municipal',
  },
  {
    value: 'state',
    label: 'Estadual',
  },
  {
    value: 'federal',
    label: 'Federal',
  },
  {
    value: 'private',
    label: 'Privada',
  },
  {
    value: 'community',
    label: 'Comunitária',
  },
  {
    value: 'other',
    label: 'Outra',
  },
]

const ADMINISTRATIVE_TYPE_OPTIONS: Array<{
  value: AdministrativeType
  label: string
}> = [
  {
    value: 'public',
    label: 'Pública',
  },
  {
    value: 'private',
    label: 'Privada',
  },
  {
    value: 'philanthropic',
    label: 'Filantrópica',
  },
  {
    value: 'community',
    label: 'Comunitária',
  },
  {
    value: 'other',
    label: 'Outra',
  },
]

const STATUS_OPTIONS: Array<{
  value: SchoolStatus
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
  {
    value: 'archived',
    label: 'Arquivada',
  },
]

function getSchoolFormState(
  school: SchoolDto,
): SchoolFormState {
  return {
    organization_id:
      school.organization_id,

    name:
      school.name,

    short_name:
      school.short_name ?? '',

    inep_code:
      school.inep_code ?? '',

    education_network:
      school.education_network,

    administrative_type:
      school.administrative_type,

    principal_name:
      school.principal_name ?? '',

    email:
      school.email ?? '',

    phone:
      school.phone ?? '',

    website:
      school.website ?? '',

    postal_code:
      school.postal_code ?? '',

    address:
      school.address ?? '',

    number:
      school.number ?? '',

    complement:
      school.complement ?? '',

    district:
      school.district ?? '',

    city:
      school.city ?? '',

    state:
      school.state ?? '',

    country:
      school.country || 'Brasil',

    status:
      school.status,
  }
}

export default function SchoolForm({
  schoolId,
  organizationId,
}: SchoolFormProps) {
  const router = useRouter()

  const isEditing =
    Boolean(schoolId)

  const [form, setForm] =
    useState<SchoolFormState>({
      ...INITIAL_FORM,
      organization_id:
        organizationId ?? '',
    })

  const [organizations, setOrganizations] =
    useState<OrganizationOption[]>([])

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [archiving, setArchiving] =
    useState(false)

  const [error, setError] =
    useState<string | null>(null)

  const [success, setSuccess] =
    useState<string | null>(null)

  const pageTitle =
    useMemo(
      () =>
        isEditing
          ? 'Editar escola'
          : 'Cadastrar escola',
      [isEditing],
    )

  useEffect(() => {
    let active = true

    async function loadData() {
      setLoading(true)
      setError(null)

      try {
        const organizationResponse =
          await fetch(
            '/api/organizations',
            {
              method: 'GET',
              cache: 'no-store',
            },
          )

        const organizationPayload =
          (await organizationResponse.json()) as
            ApiResponse<
              OrganizationOption[]
            >

        if (
          !organizationResponse.ok ||
          !organizationPayload.success ||
          !organizationPayload.data
        ) {
          throw new Error(
            organizationPayload.error ??
              'Não foi possível carregar as organizações.',
          )
        }

        if (!active) {
          return
        }

        setOrganizations(
          organizationPayload.data,
        )

        if (schoolId) {
          const schoolResponse =
            await fetch(
              `/api/schools/${schoolId}`,
              {
                method: 'GET',
                cache: 'no-store',
              },
            )

          const schoolPayload =
            (await schoolResponse.json()) as
              ApiResponse<SchoolDto>

          if (
            !schoolResponse.ok ||
            !schoolPayload.success ||
            !schoolPayload.data
          ) {
            throw new Error(
              schoolPayload.error ??
                'Não foi possível carregar a escola.',
            )
          }

          if (!active) {
            return
          }

          setForm(
            getSchoolFormState(
              schoolPayload.data,
            ),
          )
        } else if (
          organizationId
        ) {
          setForm((current) => ({
            ...current,
            organization_id:
              organizationId,
          }))
        } else if (
          organizationPayload.data.length === 1
        ) {
          setForm((current) => ({
            ...current,
            organization_id:
              organizationPayload.data?.[0]
                ?.id ?? '',
          }))
        }
      } catch (loadError) {
        if (!active) {
          return
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Não foi possível carregar o formulário.',
        )
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void loadData()

    return () => {
      active = false
    }
  }, [
    organizationId,
    schoolId,
  ])

  function updateField<
    Key extends keyof SchoolFormState,
  >(
    key: Key,
    value: SchoolFormState[Key],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }))

    setError(null)
    setSuccess(null)
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const response =
        await fetch(
          isEditing
            ? `/api/schools/${schoolId}`
            : '/api/schools',
          {
            method:
              isEditing
                ? 'PATCH'
                : 'POST',

            headers: {
              'Content-Type':
                'application/json',
            },

            body: JSON.stringify(form),
          },
        )

      const payload =
        (await response.json()) as
          ApiResponse<SchoolDto>

      if (
        !response.ok ||
        !payload.success ||
        !payload.data
      ) {
        throw new Error(
          payload.error ??
            'Não foi possível salvar a escola.',
        )
      }

      setSuccess(
        payload.message ??
          'Escola salva com sucesso.',
      )

      if (!isEditing) {
        router.push(
          `/schools/${payload.data.id}`,
        )
        router.refresh()
      } else {
        setForm(
          getSchoolFormState(
            payload.data,
          ),
        )
        router.refresh()
      }
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Não foi possível salvar a escola.',
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleArchive() {
    if (!schoolId) {
      return
    }

    const confirmed =
      window.confirm(
        'Confirma o arquivamento desta escola?',
      )

    if (!confirmed) {
      return
    }

    setArchiving(true)
    setError(null)
    setSuccess(null)

    try {
      const response =
        await fetch(
          `/api/schools/${schoolId}`,
          {
            method: 'DELETE',
          },
        )

      const payload =
        (await response.json()) as
          ApiResponse<SchoolDto>

      if (
        !response.ok ||
        !payload.success
      ) {
        throw new Error(
          payload.error ??
            'Não foi possível arquivar a escola.',
        )
      }

      router.push('/schools')
      router.refresh()
    } catch (archiveError) {
      setError(
        archiveError instanceof Error
          ? archiveError.message
          : 'Não foi possível arquivar a escola.',
      )
    } finally {
      setArchiving(false)
    }
  }

  if (loading) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-slate-600">
          Carregando dados da escola...
        </p>
      </section>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="h-1 w-16 bg-[#0B7491]" />

        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          School Core
        </p>

        <h2 className="mt-2 text-xl font-bold text-slate-950">
          {pageTitle}
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          Informe os dados institucionais e
          vincule a escola à organização
          responsável.
        </p>

        {error ? (
          <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            {success}
          </div>
        ) : null}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-950">
          Dados institucionais
        </h3>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <label className="md:col-span-2">
            <span className="text-sm font-semibold text-slate-700">
              Organização
            </span>

            <select
              required
              value={form.organization_id}
              onChange={(event) =>
                updateField(
                  'organization_id',
                  event.target.value,
                )
              }
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#0B7491] focus:ring-2 focus:ring-[#0B7491]/20"
            >
              <option value="">
                Selecione uma organização
              </option>

              {organizations.map(
                (organization) => (
                  <option
                    key={organization.id}
                    value={organization.id}
                    disabled={
                      organization.status ===
                      'archived'
                    }
                  >
                    {organization.name}
                    {organization.status ===
                    'archived'
                      ? ' — Arquivada'
                      : ''}
                  </option>
                ),
              )}
            </select>
          </label>

          <label className="md:col-span-2">
            <span className="text-sm font-semibold text-slate-700">
              Nome da escola
            </span>

            <input
              required
              maxLength={200}
              value={form.name}
              onChange={(event) =>
                updateField(
                  'name',
                  event.target.value,
                )
              }
              className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-[#0B7491] focus:ring-2 focus:ring-[#0B7491]/20"
            />
          </label>

          <label>
            <span className="text-sm font-semibold text-slate-700">
              Nome curto
            </span>

            <input
              maxLength={100}
              value={form.short_name}
              onChange={(event) =>
                updateField(
                  'short_name',
                  event.target.value,
                )
              }
              className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-[#0B7491] focus:ring-2 focus:ring-[#0B7491]/20"
            />
          </label>

          <label>
            <span className="text-sm font-semibold text-slate-700">
              Código INEP
            </span>

            <input
              inputMode="numeric"
              maxLength={8}
              value={form.inep_code}
              onChange={(event) =>
                updateField(
                  'inep_code',
                  event.target.value.replace(
                    /\D/g,
                    '',
                  ),
                )
              }
              placeholder="8 números"
              className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-[#0B7491] focus:ring-2 focus:ring-[#0B7491]/20"
            />
          </label>

          <label>
            <span className="text-sm font-semibold text-slate-700">
              Rede de ensino
            </span>

            <select
              value={form.education_network}
              onChange={(event) =>
                updateField(
                  'education_network',
                  event.target
                    .value as EducationNetwork,
                )
              }
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#0B7491] focus:ring-2 focus:ring-[#0B7491]/20"
            >
              {EDUCATION_NETWORK_OPTIONS.map(
                (option) => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                ),
              )}
            </select>
          </label>

          <label>
            <span className="text-sm font-semibold text-slate-700">
              Tipo administrativo
            </span>

            <select
              value={
                form.administrative_type
              }
              onChange={(event) =>
                updateField(
                  'administrative_type',
                  event.target
                    .value as AdministrativeType,
                )
              }
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#0B7491] focus:ring-2 focus:ring-[#0B7491]/20"
            >
              {ADMINISTRATIVE_TYPE_OPTIONS.map(
                (option) => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                ),
              )}
            </select>
          </label>

          <label>
            <span className="text-sm font-semibold text-slate-700">
              Diretor responsável
            </span>

            <input
              maxLength={200}
              value={form.principal_name}
              onChange={(event) =>
                updateField(
                  'principal_name',
                  event.target.value,
                )
              }
              className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-[#0B7491] focus:ring-2 focus:ring-[#0B7491]/20"
            />
          </label>

          <label>
            <span className="text-sm font-semibold text-slate-700">
              Status
            </span>

            <select
              value={form.status}
              onChange={(event) =>
                updateField(
                  'status',
                  event.target
                    .value as SchoolStatus,
                )
              }
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#0B7491] focus:ring-2 focus:ring-[#0B7491]/20"
            >
              {STATUS_OPTIONS.map(
                (option) => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                ),
              )}
            </select>
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-950">
          Contato
        </h3>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <label>
            <span className="text-sm font-semibold text-slate-700">
              E-mail
            </span>

            <input
              type="email"
              maxLength={254}
              value={form.email}
              onChange={(event) =>
                updateField(
                  'email',
                  event.target.value,
                )
              }
              className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-[#0B7491] focus:ring-2 focus:ring-[#0B7491]/20"
            />
          </label>

          <label>
            <span className="text-sm font-semibold text-slate-700">
              Telefone
            </span>

            <input
              maxLength={30}
              value={form.phone}
              onChange={(event) =>
                updateField(
                  'phone',
                  event.target.value,
                )
              }
              className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-[#0B7491] focus:ring-2 focus:ring-[#0B7491]/20"
            />
          </label>

          <label className="md:col-span-2">
            <span className="text-sm font-semibold text-slate-700">
              Site
            </span>

            <input
              type="url"
              maxLength={500}
              value={form.website}
              onChange={(event) =>
                updateField(
                  'website',
                  event.target.value,
                )
              }
              placeholder="https://"
              className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-[#0B7491] focus:ring-2 focus:ring-[#0B7491]/20"
            />
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-950">
          Endereço
        </h3>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <label>
            <span className="text-sm font-semibold text-slate-700">
              CEP
            </span>

            <input
              maxLength={20}
              value={form.postal_code}
              onChange={(event) =>
                updateField(
                  'postal_code',
                  event.target.value,
                )
              }
              className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-[#0B7491] focus:ring-2 focus:ring-[#0B7491]/20"
            />
          </label>

          <label>
            <span className="text-sm font-semibold text-slate-700">
              País
            </span>

            <input
              maxLength={100}
              value={form.country}
              onChange={(event) =>
                updateField(
                  'country',
                  event.target.value,
                )
              }
              className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-[#0B7491] focus:ring-2 focus:ring-[#0B7491]/20"
            />
          </label>

          <label className="md:col-span-2">
            <span className="text-sm font-semibold text-slate-700">
              Endereço
            </span>

            <input
              maxLength={300}
              value={form.address}
              onChange={(event) =>
                updateField(
                  'address',
                  event.target.value,
                )
              }
              className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-[#0B7491] focus:ring-2 focus:ring-[#0B7491]/20"
            />
          </label>

          <label>
            <span className="text-sm font-semibold text-slate-700">
              Número
            </span>

            <input
              maxLength={20}
              value={form.number}
              onChange={(event) =>
                updateField(
                  'number',
                  event.target.value,
                )
              }
              className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-[#0B7491] focus:ring-2 focus:ring-[#0B7491]/20"
            />
          </label>

          <label>
            <span className="text-sm font-semibold text-slate-700">
              Complemento
            </span>

            <input
              maxLength={100}
              value={form.complement}
              onChange={(event) =>
                updateField(
                  'complement',
                  event.target.value,
                )
              }
              className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-[#0B7491] focus:ring-2 focus:ring-[#0B7491]/20"
            />
          </label>

          <label>
            <span className="text-sm font-semibold text-slate-700">
              Bairro
            </span>

            <input
              maxLength={120}
              value={form.district}
              onChange={(event) =>
                updateField(
                  'district',
                  event.target.value,
                )
              }
              className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-[#0B7491] focus:ring-2 focus:ring-[#0B7491]/20"
            />
          </label>

          <label>
            <span className="text-sm font-semibold text-slate-700">
              Cidade
            </span>

            <input
              maxLength={120}
              value={form.city}
              onChange={(event) =>
                updateField(
                  'city',
                  event.target.value,
                )
              }
              className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-[#0B7491] focus:ring-2 focus:ring-[#0B7491]/20"
            />
          </label>

          <label>
            <span className="text-sm font-semibold text-slate-700">
              Estado
            </span>

            <input
              maxLength={100}
              value={form.state}
              onChange={(event) =>
                updateField(
                  'state',
                  event.target.value,
                )
              }
              className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-[#0B7491] focus:ring-2 focus:ring-[#0B7491]/20"
            />
          </label>
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <button
          type="submit"
          disabled={
            saving ||
            archiving
          }
          className="inline-flex items-center justify-center rounded-lg bg-[#0B7491] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#09657e] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving
            ? 'Salvando...'
            : isEditing
              ? 'Salvar alterações'
              : 'Cadastrar escola'}
        </button>

        {isEditing ? (
          <button
            type="button"
            disabled={
              saving ||
              archiving ||
              form.status === 'archived'
            }
            onClick={handleArchive}
            className="inline-flex items-center justify-center rounded-lg border border-red-200 px-6 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {archiving
              ? 'Arquivando...'
              : 'Arquivar escola'}
          </button>
        ) : null}
      </section>
    </form>
  )
}