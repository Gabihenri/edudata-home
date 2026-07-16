'use client'

import Link from 'next/link'
import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import type {
  InstitutionType,
  RegistrationOrigin,
  SchoolDto,
  SchoolStatus,
} from '@/lib/schools/school.dto'

interface OrganizationOption {
  id: string
  name: string
  short_name: string | null
}

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

const STATUS_LABELS: Record<
  SchoolStatus,
  string
> = {
  active: 'Ativa',
  inactive: 'Inativa',
  pending: 'Pendente',
  suspended: 'Suspensa',
  archived: 'Arquivada',
}

const NETWORK_LABELS: Record<
  SchoolDto['education_network'],
  string
> = {
  municipal: 'Municipal',
  state: 'Estadual',
  federal: 'Federal',
  private: 'Privada',
  community: 'Comunitária',
  other: 'Outra ou não se aplica',
}

const INSTITUTION_TYPE_LABELS: Record<
  InstitutionType,
  string
> = {
  school: 'Escola',
  institute: 'Instituto',
  college: 'Faculdade',
  university: 'Universidade',
  company: 'Empresa',
  training_center: 'Centro de formação',
  ngo: 'ONG',
  government_agency: 'Órgão público',
  education_department:
    'Secretaria ou diretoria de ensino',
  research_center: 'Centro de pesquisa',
  other: 'Outra instituição',
}

const REGISTRATION_ORIGIN_LABELS: Record<
  RegistrationOrigin,
  string
> = {
  inep: 'Cadastro Nacional INEP',
  manual: 'Cadastro manual',
}

function getStatusClass(
  status: SchoolStatus,
): string {
  switch (status) {
    case 'active':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700'

    case 'pending':
      return 'border-amber-200 bg-amber-50 text-amber-700'

    case 'suspended':
      return 'border-orange-200 bg-orange-50 text-orange-700'

    case 'archived':
      return 'border-slate-300 bg-slate-100 text-slate-600'

    case 'inactive':
    default:
      return 'border-red-200 bg-red-50 text-red-700'
  }
}

function getOrganizationName(
  organization: OrganizationOption,
): string {
  const officialName =
    organization.name.trim()

  if (officialName) {
    return officialName
  }

  const shortName =
    organization.short_name?.trim()

  if (shortName) {
    return shortName
  }

  return 'Organização não identificada'
}

function getInstitutionType(
  institution: SchoolDto,
): InstitutionType {
  return (
    institution.institution_type ??
    'school'
  )
}

function getRegistrationOrigin(
  institution: SchoolDto,
): RegistrationOrigin {
  return (
    institution.registration_origin ??
    'manual'
  )
}

function getLocation(
  institution: SchoolDto,
): string {
  const city =
    institution.city?.trim()

  const state =
    institution.state?.trim()

  if (city && state) {
    return `${city} — ${state}`
  }

  return (
    city ||
    state ||
    'Não informada'
  )
}

function getInstitutionReference(
  institution: SchoolDto,
): string {
  if (institution.inep_code) {
    return `INEP ${institution.inep_code}`
  }

  if (institution.short_name) {
    return institution.short_name
  }

  return REGISTRATION_ORIGIN_LABELS[
    getRegistrationOrigin(
      institution,
    )
  ]
}

export default function SchoolTable() {
  const [
    institutions,
    setInstitutions,
  ] = useState<SchoolDto[]>([])

  const [
    organizations,
    setOrganizations,
  ] = useState<
    OrganizationOption[]
  >([])

  const [search, setSearch] =
    useState('')

  const [
    showArchived,
    setShowArchived,
  ] = useState(false)

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function loadData() {
      setLoading(true)
      setError(null)

      try {
        const [
          institutionsResponse,
          organizationsResponse,
        ] = await Promise.all([
          fetch('/api/schools', {
            method: 'GET',
            cache: 'no-store',
          }),

          fetch('/api/organizations', {
            method: 'GET',
            cache: 'no-store',
          }),
        ])

        const institutionsPayload =
          (await institutionsResponse.json()) as
            ApiResponse<
              SchoolDto[]
            >

        const organizationsPayload =
          (await organizationsResponse.json()) as
            ApiResponse<
              OrganizationOption[]
            >

        if (
          !institutionsResponse.ok ||
          !institutionsPayload.success ||
          !institutionsPayload.data
        ) {
          throw new Error(
            institutionsPayload.error ??
              'Não foi possível carregar as instituições.',
          )
        }

        if (
          !organizationsResponse.ok ||
          !organizationsPayload.success ||
          !organizationsPayload.data
        ) {
          throw new Error(
            organizationsPayload.error ??
              'Não foi possível carregar as organizações.',
          )
        }

        if (!active) {
          return
        }

        setInstitutions(
          institutionsPayload.data,
        )

        setOrganizations(
          organizationsPayload.data,
        )
      } catch (loadError) {
        if (!active) {
          return
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Não foi possível carregar as instituições.',
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
  }, [])

  const organizationNames =
    useMemo(() => {
      return new Map<string, string>(
        organizations.map(
          (organization) => [
            organization.id,
            getOrganizationName(
              organization,
            ),
          ],
        ),
      )
    }, [organizations])

  const activeInstitutionsCount =
    useMemo(
      () =>
        institutions.filter(
          (institution) =>
            institution.status !==
            'archived',
        ).length,
      [institutions],
    )

  const archivedInstitutionsCount =
    useMemo(
      () =>
        institutions.filter(
          (institution) =>
            institution.status ===
            'archived',
        ).length,
      [institutions],
    )

  const filteredInstitutions =
    useMemo(() => {
      const normalizedSearch =
        search
          .trim()
          .toLowerCase()

      return institutions.filter(
        (institution) => {
          if (
            !showArchived &&
            institution.status ===
              'archived'
          ) {
            return false
          }

          if (!normalizedSearch) {
            return true
          }

          const organizationName =
            organizationNames.get(
              institution.organization_id,
            ) ?? ''

          const institutionType =
            INSTITUTION_TYPE_LABELS[
              getInstitutionType(
                institution,
              )
            ]

          const registrationOrigin =
            REGISTRATION_ORIGIN_LABELS[
              getRegistrationOrigin(
                institution,
              )
            ]

          const searchableText = [
            institution.name,
            institution.short_name,
            institution.inep_code,
            institution.city,
            institution.state,
            organizationName,
            institutionType,
            registrationOrigin,
            NETWORK_LABELS[
              institution
                .education_network
            ],
            STATUS_LABELS[
              institution.status
            ],
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()

          return searchableText.includes(
            normalizedSearch,
          )
        },
      )
    }, [
      institutions,
      organizationNames,
      search,
      showArchived,
    ])

  if (loading) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-slate-600">
          Carregando instituições...
        </p>
      </section>
    )
  }

  if (error) {
    return (
      <section className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
        <p className="font-semibold text-red-700">
          {error}
        </p>
      </section>
    )
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="h-1 w-16 bg-[#0B7491]" />

            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Institution Core
            </p>

            <h2 className="mt-2 text-xl font-bold text-slate-950">
              Instituições cadastradas
            </h2>

            <p className="mt-2 text-sm text-slate-600">
              {activeInstitutionsCount}{' '}
              {activeInstitutionsCount === 1
                ? 'instituição disponível'
                : 'instituições disponíveis'}

              {archivedInstitutionsCount >
              0
                ? ` · ${archivedInstitutionsCount} arquivada${
                    archivedInstitutionsCount ===
                    1
                      ? ''
                      : 's'
                  }`
                : ''}
            </p>
          </div>

          <Link
            href="/schools/new"
            className="inline-flex items-center justify-center rounded-lg bg-[#0B7491] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#09657e]"
          >
            Nova instituição
          </Link>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">
              Pesquisar
            </span>

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
              placeholder="Nome, INEP, tipo, cidade, organização ou status"
              className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-[#0B7491] focus:ring-2 focus:ring-[#0B7491]/20"
            />
          </label>

          {archivedInstitutionsCount >
          0 ? (
            <button
              type="button"
              onClick={() =>
                setShowArchived(
                  (current) =>
                    !current,
                )
              }
              className="inline-flex min-h-12 items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-[#0B7491] hover:text-[#0B7491]"
            >
              {showArchived
                ? 'Ocultar arquivadas'
                : `Mostrar arquivadas (${archivedInstitutionsCount})`}
            </button>
          ) : null}
        </div>
      </div>

      {filteredInstitutions.length ===
      0 ? (
        <div className="p-6">
          <p className="text-sm font-medium text-slate-600">
            {institutions.length === 0
              ? 'Nenhuma instituição cadastrada.'
              : 'Nenhuma instituição corresponde aos filtros selecionados.'}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4 p-4 md:hidden">
            {filteredInstitutions.map(
              (institution) => {
                const institutionType =
                  getInstitutionType(
                    institution,
                  )

                const registrationOrigin =
                  getRegistrationOrigin(
                    institution,
                  )

                return (
                  <article
                    key={institution.id}
                    className="rounded-xl border border-slate-200 p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-bold text-slate-950">
                          {
                            institution.name
                          }
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                          {getInstitutionReference(
                            institution,
                          )}
                        </p>
                      </div>

                      <span
                        className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClass(
                          institution.status,
                        )}`}
                      >
                        {
                          STATUS_LABELS[
                            institution
                              .status
                          ]
                        }
                      </span>
                    </div>

                    <dl className="mt-5 space-y-3 text-sm">
                      <div>
                        <dt className="font-semibold text-slate-500">
                          Organização
                        </dt>

                        <dd className="mt-1 text-slate-800">
                          {organizationNames.get(
                            institution.organization_id,
                          ) ??
                            'Organização não identificada'}
                        </dd>
                      </div>

                      <div>
                        <dt className="font-semibold text-slate-500">
                          Tipo
                        </dt>

                        <dd className="mt-1 text-slate-800">
                          {
                            INSTITUTION_TYPE_LABELS[
                              institutionType
                            ]
                          }
                        </dd>
                      </div>

                      <div>
                        <dt className="font-semibold text-slate-500">
                          Origem do cadastro
                        </dt>

                        <dd className="mt-1 text-slate-800">
                          {
                            REGISTRATION_ORIGIN_LABELS[
                              registrationOrigin
                            ]
                          }
                        </dd>
                      </div>

                      <div>
                        <dt className="font-semibold text-slate-500">
                          Rede
                        </dt>

                        <dd className="mt-1 text-slate-800">
                          {
                            NETWORK_LABELS[
                              institution
                                .education_network
                            ]
                          }
                        </dd>
                      </div>

                      <div>
                        <dt className="font-semibold text-slate-500">
                          Localização
                        </dt>

                        <dd className="mt-1 text-slate-800">
                          {getLocation(
                            institution,
                          )}
                        </dd>
                      </div>
                    </dl>

                    <Link
                      href={`/schools/${institution.id}`}
                      className="mt-5 inline-flex w-full items-center justify-center rounded-lg border border-[#0B7491] px-4 py-3 text-sm font-semibold text-[#0B7491] transition hover:bg-[#0B7491]/5"
                    >
                      Gerenciar
                    </Link>
                  </article>
                )
              },
            )}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[1050px] border-collapse text-left">
              <thead className="bg-slate-50">
                <tr className="border-b border-slate-200">
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Instituição
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Tipo
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Organização
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Cadastro
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Localização
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Status
                  </th>

                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Ação
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredInstitutions.map(
                  (institution) => (
                    <tr
                      key={institution.id}
                      className="border-b border-slate-100 last:border-b-0"
                    >
                      <td className="px-6 py-5">
                        <p className="font-semibold text-slate-950">
                          {
                            institution.name
                          }
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          {getInstitutionReference(
                            institution,
                          )}
                        </p>
                      </td>

                      <td className="px-6 py-5 text-sm text-slate-700">
                        {
                          INSTITUTION_TYPE_LABELS[
                            getInstitutionType(
                              institution,
                            )
                          ]
                        }
                      </td>

                      <td className="px-6 py-5 text-sm text-slate-700">
                        {organizationNames.get(
                          institution.organization_id,
                        ) ??
                          'Não identificada'}
                      </td>

                      <td className="px-6 py-5 text-sm text-slate-700">
                        {
                          REGISTRATION_ORIGIN_LABELS[
                            getRegistrationOrigin(
                              institution,
                            )
                          ]
                        }
                      </td>

                      <td className="px-6 py-5 text-sm text-slate-700">
                        {getLocation(
                          institution,
                        )}
                      </td>

                      <td className="px-6 py-5">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClass(
                            institution.status,
                          )}`}
                        >
                          {
                            STATUS_LABELS[
                              institution
                                .status
                            ]
                          }
                        </span>
                      </td>

                      <td className="px-6 py-5 text-right">
                        <Link
                          href={`/schools/${institution.id}`}
                          className="inline-flex items-center justify-center rounded-lg border border-[#0B7491] px-4 py-2 text-sm font-semibold text-[#0B7491] transition hover:bg-[#0B7491]/5"
                        >
                          Gerenciar
                        </Link>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  )
}