'use client'

import {
  type FormEvent,
  useState,
} from 'react'

import type {
  SchoolRegistrySearchItemDto,
} from '@/lib/school-registry/school-registry.dto'

interface SchoolRegistrySearchProps {
  onSelect: (
    institution: SchoolRegistrySearchItemDto,
  ) => void
}

interface SearchApiResponse {
  success: boolean
  total?: number
  data?: SchoolRegistrySearchItemDto[]
  error?: string
}

const STATE_OPTIONS = [
  '',
  'AC',
  'AL',
  'AP',
  'AM',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MT',
  'MS',
  'MG',
  'PA',
  'PB',
  'PR',
  'PE',
  'PI',
  'RJ',
  'RN',
  'RS',
  'RO',
  'RR',
  'SC',
  'SP',
  'SE',
  'TO',
]

export default function SchoolRegistrySearch({
  onSelect,
}: SchoolRegistrySearchProps) {
  const [query, setQuery] =
    useState('')

  const [state, setState] =
    useState('')

  const [city, setCity] =
    useState('')

  const [results, setResults] =
    useState<
      SchoolRegistrySearchItemDto[]
    >([])

  const [total, setTotal] =
    useState(0)

  const [loading, setLoading] =
    useState(false)

  const [searched, setSearched] =
    useState(false)

  const [error, setError] =
    useState<string | null>(null)

  async function handleSearch(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    setLoading(true)
    setError(null)
    setSearched(false)

    try {
      const searchParams =
        new URLSearchParams()

      searchParams.set(
        'q',
        query.trim(),
      )

      searchParams.set(
        'limit',
        '30',
      )

      if (state) {
        searchParams.set(
          'state',
          state,
        )
      }

      if (city.trim()) {
        searchParams.set(
          'city',
          city.trim(),
        )
      }

      const response =
        await fetch(
          `/api/school-registry/search?${searchParams.toString()}`,
          {
            method: 'GET',
            cache: 'no-store',
          },
        )

      const payload =
        (await response.json()) as
          SearchApiResponse

      if (
        !response.ok ||
        !payload.success
      ) {
        throw new Error(
          payload.error ??
            'Não foi possível pesquisar o cadastro nacional.',
        )
      }

      setResults(
        payload.data ?? [],
      )

      setTotal(
        payload.total ?? 0,
      )

      setSearched(true)
    } catch (searchError) {
      setResults([])
      setTotal(0)
      setSearched(true)

      setError(
        searchError instanceof Error
          ? searchError.message
          : 'Não foi possível pesquisar o cadastro nacional.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-6">
        <div className="h-1 w-16 bg-[#0B7491]" />

        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Cadastro Nacional
        </p>

        <h2 className="mt-2 text-xl font-bold text-slate-950">
          Buscar instituição pelo INEP
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          Pesquise pelo nome da instituição,
          código INEP, município ou estado.
        </p>

        <form
          onSubmit={handleSearch}
          className="mt-6 space-y-5"
        >
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">
              Nome ou código INEP
            </span>

            <input
              required
              minLength={3}
              maxLength={150}
              value={query}
              onChange={(event) =>
                setQuery(
                  event.target.value,
                )
              }
              placeholder="Ex.: República do Suriname ou 23216506"
              className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-[#0B7491] focus:ring-2 focus:ring-[#0B7491]/20"
            />
          </label>

          <div className="grid gap-5 md:grid-cols-2">
            <label>
              <span className="text-sm font-semibold text-slate-700">
                Estado
              </span>

              <select
                value={state}
                onChange={(event) =>
                  setState(
                    event.target.value,
                  )
                }
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#0B7491] focus:ring-2 focus:ring-[#0B7491]/20"
              >
                <option value="">
                  Todos os estados
                </option>

                {STATE_OPTIONS
                  .filter(Boolean)
                  .map((option) => (
                    <option
                      key={option}
                      value={option}
                    >
                      {option}
                    </option>
                  ))}
              </select>
            </label>

            <label>
              <span className="text-sm font-semibold text-slate-700">
                Município
              </span>

              <input
                maxLength={120}
                value={city}
                onChange={(event) =>
                  setCity(
                    event.target.value,
                  )
                }
                placeholder="Ex.: São Paulo"
                className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-[#0B7491] focus:ring-2 focus:ring-[#0B7491]/20"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center rounded-lg bg-[#0B7491] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#09657e] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? 'Pesquisando...'
              : 'Pesquisar cadastro nacional'}
          </button>
        </form>

        {error ? (
          <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        ) : null}
      </div>

      {searched && !error ? (
        <div className="p-6">
          <p className="text-sm font-semibold text-slate-700">
            {total === 0
              ? 'Nenhuma instituição encontrada.'
              : `${total} ${
                  total === 1
                    ? 'instituição encontrada'
                    : 'instituições encontradas'
                }`}
          </p>

          {total > results.length ? (
            <p className="mt-1 text-xs text-slate-500">
              Exibindo os primeiros{' '}
              {results.length} resultados.
              Refine a pesquisa para localizar
              a instituição correta.
            </p>
          ) : null}

          <div className="mt-5 space-y-4">
            {results.map(
              (institution) => (
                <article
                  key={institution.id}
                  className="rounded-xl border border-slate-200 p-5 transition hover:border-[#0B7491]/50"
                >
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#0B7491]">
                        INEP{' '}
                        {institution.inep_code}
                      </p>

                      <h3 className="mt-2 font-bold text-slate-950">
                        {institution.name}
                      </h3>

                      <p className="mt-2 text-sm text-slate-600">
                        {[
                          institution.city,
                          institution.state,
                        ]
                          .filter(Boolean)
                          .join(' — ') ||
                          'Localização não informada'}
                      </p>

                      {institution.address ? (
                        <p className="mt-1 text-sm text-slate-500">
                          {institution.address}
                        </p>
                      ) : null}

                      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                        <div>
                          <dt className="font-semibold text-slate-500">
                            Dependência
                          </dt>

                          <dd className="mt-1 text-slate-800">
                            {institution.administrative_dependency ??
                              'Não informada'}
                          </dd>
                        </div>

                        <div>
                          <dt className="font-semibold text-slate-500">
                            Localização
                          </dt>

                          <dd className="mt-1 text-slate-800">
                            {institution.location ??
                              'Não informada'}
                          </dd>
                        </div>
                      </dl>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        onSelect(
                          institution,
                        )
                      }
                      className="inline-flex shrink-0 items-center justify-center rounded-lg bg-[#0B7491] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#09657e]"
                    >
                      Selecionar
                    </button>
                  </div>
                </article>
              ),
            )}
          </div>
        </div>
      ) : null}
    </section>
  )
}