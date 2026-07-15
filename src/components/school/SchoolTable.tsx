'use client'

import Link from 'next/link'
import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import type {
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
  other: 'Outra',
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

export default function SchoolTable() {
  const [schools, setSchools] =
    useState<SchoolDto[]>([])

  const [organizations, setOrganizations] =
    useState<OrganizationOption[]>([])

  const [search, setSearch] =
    useState('')

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
          schoolsResponse,
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

        const schoolsPayload =
          (await schoolsResponse.json()) as
            ApiResponse<SchoolDto[]>

        const organizationsPayload =
          (await organizationsResponse.json()) as
            ApiResponse<
              OrganizationOption[]
            >

        if (
          !schoolsResponse.ok ||
          !schoolsPayload.success ||
          !schoolsPayload.data
        ) {
          throw new Error(
            schoolsPayload.error ??
              'Não foi possível carregar as escolas.',
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

        setSchools(schoolsPayload.data)
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
            : 'Não foi possível carregar as escolas.',
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
      return new Map(
        organizations.map(
          (organization) => [
            organization.id,
            organization.short_name ||
              organization.name,
          ],
        ),
      )
    }, [organizations])

  const filteredSchools =
    useMemo(() => {
      const normalizedSearch =
        search.trim().toLowerCase()

      if (!normalizedSearch) {
        return schools
      }

      return schools.filter((school) => {
        const organizationName =
          organizationNames.get(
            school.organization_id,
          ) ?? ''

        const searchableText = [
          school.name,
          school.short_name,
          school.inep_code,
          school.city,
          school.state,
          organizationName,
          NETWORK_LABELS[
            school.education_network
          ],
          STATUS_LABELS[school.status],
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()

        return searchableText.includes(
          normalizedSearch,
        )
      })
    }, [
      organizationNames,
      schools,
      search,
    ])

  if (loading) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-slate-600">
          Carregando escolas...
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
              School Core
            </p>

            <h2 className="mt-2 text-xl font-bold text-slate-950">
              Escolas cadastradas
            </h2>

            <p className="mt-2 text-sm text-slate-600">
              {schools.length}{' '}
              {schools.length === 1
                ? 'escola cadastrada'
                : 'escolas cadastradas'}
            </p>
          </div>

          <Link
            href="/schools/new"
            className="inline-flex items-center justify-center rounded-lg bg-[#0B7491] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#09657e]"
          >
            Nova escola
          </Link>
        </div>

        <label className="mt-6 block">
          <span className="text-sm font-semibold text-slate-700">
            Pesquisar
          </span>

          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Nome, INEP, cidade, organização ou status"
            className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-[#0B7491] focus:ring-2 focus:ring-[#0B7491]/20"
          />
        </label>
      </div>

      {filteredSchools.length === 0 ? (
        <div className="p-6">
          <p className="text-sm font-medium text-slate-600">
            {schools.length === 0
              ? 'Nenhuma escola cadastrada.'
              : 'Nenhuma escola corresponde à pesquisa.'}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4 p-4 md:hidden">
            {filteredSchools.map(
              (school) => (
                <article
                  key={school.id}
                  className="rounded-xl border border-slate-200 p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-slate-950">
                        {school.name}
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        {school.short_name ||
                          school.inep_code ||
                          'Sem nome curto ou INEP'}
                      </p>
                    </div>

                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClass(
                        school.status,
                      )}`}
                    >
                      {
                        STATUS_LABELS[
                          school.status
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
                          school.organization_id,
                        ) ??
                          'Organização não identificada'}
                      </dd>
                    </div>

                    <div>
                      <dt className="font-semibold text-slate-500">
                        Rede
                      </dt>

                      <dd className="mt-1 text-slate-800">
                        {
                          NETWORK_LABELS[
                            school
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
                        {[
                          school.city,
                          school.state,
                        ]
                          .filter(Boolean)
                          .join(' — ') ||
                          'Não informada'}
                      </dd>
                    </div>
                  </dl>

                  <Link
                    href={`/schools/${school.id}`}
                    className="mt-5 inline-flex w-full items-center justify-center rounded-lg border border-[#0B7491] px-4 py-3 text-sm font-semibold text-[#0B7491] transition hover:bg-[#0B7491]/5"
                  >
                    Gerenciar
                  </Link>
                </article>
              ),
            )}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[920px] border-collapse text-left">
              <thead className="bg-slate-50">
                <tr className="border-b border-slate-200">
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Escola
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Organização
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Rede
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
                {filteredSchools.map(
                  (school) => (
                    <tr
                      key={school.id}
                      className="border-b border-slate-100 last:border-b-0"
                    >
                      <td className="px-6 py-5">
                        <p className="font-semibold text-slate-950">
                          {school.name}
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          {school.short_name ||
                            school.inep_code ||
                            'Sem nome curto ou INEP'}
                        </p>
                      </td>

                      <td className="px-6 py-5 text-sm text-slate-700">
                        {organizationNames.get(
                          school.organization_id,
                        ) ??
                          'Não identificada'}
                      </td>

                      <td className="px-6 py-5 text-sm text-slate-700">
                        {
                          NETWORK_LABELS[
                            school
                              .education_network
                          ]
                        }
                      </td>

                      <td className="px-6 py-5 text-sm text-slate-700">
                        {[
                          school.city,
                          school.state,
                        ]
                          .filter(Boolean)
                          .join(' — ') ||
                          'Não informada'}
                      </td>

                      <td className="px-6 py-5">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClass(
                            school.status,
                          )}`}
                        >
                          {
                            STATUS_LABELS[
                              school.status
                            ]
                          }
                        </span>
                      </td>

                      <td className="px-6 py-5 text-right">
                        <Link
                          href={`/schools/${school.id}`}
                          className="inline-flex rounded-lg border border-[#0B7491] px-4 py-2 text-sm font-semibold text-[#0B7491] transition hover:bg-[#0B7491]/5"
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