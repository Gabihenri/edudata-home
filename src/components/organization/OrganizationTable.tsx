'use client'

import Link from 'next/link'
import {
  useCallback,
  useEffect,
  useState,
} from 'react'

import type {
  OrganizationDto,
  OrganizationStatus,
} from '@/lib/organization/organization.dto'

interface OrganizationsApiResponse {
  success: boolean
  total?: number
  data?: OrganizationDto[]
  error?: string
}

const STATUS_LABELS:
  Record<OrganizationStatus, string> = {
    active: 'Ativa',
    inactive: 'Inativa',
    pending: 'Pendente',
    suspended: 'Suspensa',
    archived: 'Arquivada',
  }

const STATUS_CLASSES:
  Record<OrganizationStatus, string> = {
    active:
      'border-emerald-200 bg-emerald-50 text-emerald-700',
    inactive:
      'border-slate-200 bg-slate-100 text-slate-600',
    pending:
      'border-amber-200 bg-amber-50 text-amber-700',
    suspended:
      'border-red-200 bg-red-50 text-red-700',
    archived:
      'border-slate-300 bg-slate-200 text-slate-700',
  }

function formatLocation(
  organization: OrganizationDto,
): string {
  const parts = [
    organization.city,
    organization.state,
  ].filter(Boolean)

  return parts.length > 0
    ? parts.join(' — ')
    : 'Não informado'
}

function formatOrganizationType(
  value: string,
): string {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    )
}

export default function OrganizationTable() {
  const [
    organizations,
    setOrganizations,
  ] = useState<OrganizationDto[]>([])

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState<string | null>(null)

  const loadOrganizations =
    useCallback(async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(
          '/api/organizations',
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
            OrganizationsApiResponse

        if (
          !response.ok ||
          !result.success
        ) {
          throw new Error(
            result.error ||
              'Não foi possível carregar as organizações.',
          )
        }

        setOrganizations(
          Array.isArray(result.data)
            ? result.data
            : [],
        )
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : 'Não foi possível carregar as organizações.',
        )
      } finally {
        setLoading(false)
      }
    }, [])

  useEffect(() => {
    void loadOrganizations()
  }, [loadOrganizations])

  if (loading) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-medium text-slate-600">
          Carregando organizações...
        </p>
      </section>
    )
  }

  if (error) {
    return (
      <section className="rounded-2xl border border-red-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold text-red-700">
          {error}
        </p>

        <button
          type="button"
          onClick={() =>
            void loadOrganizations()
          }
          className="mt-5 rounded-lg bg-[#0B7491] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#095f77]"
        >
          Tentar novamente
        </button>
      </section>
    )
  }

  if (organizations.length === 0) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="h-1 w-16 bg-[#0B7491]" />

        <h2 className="mt-5 text-xl font-bold text-slate-950">
          Nenhuma organização cadastrada
        </h2>

        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
          Cadastre a primeira organização
          institucional para iniciar a
          estrutura de escolas, vínculos e
          permissões do EIOS.
        </p>

        <Link
          href="/organizations/new"
          className="mt-6 inline-flex rounded-lg bg-[#0B7491] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#095f77]"
        >
          Cadastrar organização
        </Link>
      </section>
    )
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Organization Core
          </p>

          <h2 className="mt-1 text-xl font-bold text-slate-950">
            Organizações cadastradas
          </h2>
        </div>

        <p className="text-sm font-semibold text-slate-600">
          Total: {organizations.length}
        </p>
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                Organização
              </th>

              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                Tipo
              </th>

              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                Localização
              </th>

              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                Status
              </th>

              <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                Acesso
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200 bg-white">
            {organizations.map(
              (organization) => (
                <tr
                  key={organization.id}
                  className="transition hover:bg-slate-50"
                >
                  <td className="px-6 py-5">
                    <p className="font-semibold text-slate-950">
                      {organization.name}
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      {organization.short_name ||
                        organization.document ||
                        'Sem nome curto ou documento'}
                    </p>
                  </td>

                  <td className="px-6 py-5 text-sm text-slate-700">
                    {formatOrganizationType(
                      organization.organization_type,
                    )}
                  </td>

                  <td className="px-6 py-5 text-sm text-slate-700">
                    {formatLocation(
                      organization,
                    )}
                  </td>

                  <td className="px-6 py-5">
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${STATUS_CLASSES[organization.status]}`}
                    >
                      {
                        STATUS_LABELS[
                          organization.status
                        ]
                      }
                    </span>
                  </td>

                  <td className="px-6 py-5 text-right">
                    <Link
                      href={`/organizations/${organization.id}`}
                      className="text-sm font-semibold text-[#0B7491] transition hover:text-[#095f77]"
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

      <div className="divide-y divide-slate-200 md:hidden">
        {organizations.map(
          (organization) => (
            <article
              key={organization.id}
              className="p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-bold text-slate-950">
                    {organization.name}
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    {organization.short_name ||
                      formatOrganizationType(
                        organization.organization_type,
                      )}
                  </p>
                </div>

                <span
                  className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${STATUS_CLASSES[organization.status]}`}
                >
                  {
                    STATUS_LABELS[
                      organization.status
                    ]
                  }
                </span>
              </div>

              <dl className="mt-5 grid gap-4 text-sm">
                <div>
                  <dt className="font-semibold text-slate-500">
                    Tipo
                  </dt>

                  <dd className="mt-1 text-slate-800">
                    {formatOrganizationType(
                      organization.organization_type,
                    )}
                  </dd>
                </div>

                <div>
                  <dt className="font-semibold text-slate-500">
                    Localização
                  </dt>

                  <dd className="mt-1 text-slate-800">
                    {formatLocation(
                      organization,
                    )}
                  </dd>
                </div>
              </dl>

              <Link
                href={`/organizations/${organization.id}`}
                className="mt-5 inline-flex text-sm font-semibold text-[#0B7491]"
              >
                Gerenciar organização
              </Link>
            </article>
          ),
        )}
      </div>
    </section>
  )
}