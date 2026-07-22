'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

import Link from 'next/link'

import {
  AgendaPageShell,
} from '@/components/agenda/AgendaPageShell'

import {
  InstitutionalCalendarEventsPanel,
} from '@/components/agenda/InstitutionalCalendarEventsPanel'

import {
  useInstitutionalAcademicCalendar,
} from '@/lib/agenda/hooks/useInstitutionalAcademicCalendar'

type CalendarContext = {
  id: string

  organization: {
    id: string
    name: string
  }

  school: {
    id: string
    name: string
    shortName: string | null
    city: string | null
    state: string | null
  }

  role: string
  roleLabel: string

  hierarchyLevel: number
  scopeType: string

  canManage: boolean
}

type CalendarContextsResponse = {
  success: boolean

  isPlatformAdmin?: boolean
  total?: number

  data?: CalendarContext[]

  error?: string
}

const CONTEXTS_API_URL =
  '/api/agenda/institutional-calendar/contexts?limit=100'

const DATE_FORMATTER =
  new Intl.DateTimeFormat(
    'pt-BR',
    {
      timeZone: 'UTC',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    },
  )

function formatDate(
  value:
    | string
    | null
    | undefined,
): string {
  if (!value) {
    return 'Não definida'
  }

  const date =
    new Date(
      `${value}T00:00:00Z`,
    )

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return 'Data inválida'
  }

  return DATE_FORMATTER.format(
    date,
  )
}

function sortContexts(
  contexts:
    CalendarContext[],
): CalendarContext[] {
  return [
    ...contexts,
  ].sort(
    (
      firstContext,
      secondContext,
    ) => {
      const organizationComparison =
        firstContext
          .organization
          .name
          .localeCompare(
            secondContext
              .organization
              .name,
            'pt-BR',
          )

      if (
        organizationComparison !==
        0
      ) {
        return organizationComparison
      }

      return firstContext
        .school
        .name
        .localeCompare(
          secondContext
            .school
            .name,
          'pt-BR',
        )
    },
  )
}

async function readContextsResponse(
  response: Response,
): Promise<
  CalendarContextsResponse
> {
  try {
    return (
      await response.json()
    ) as CalendarContextsResponse
  } catch {
    throw new Error(
      'A resposta dos contextos institucionais é inválida.',
    )
  }
}

function getSchoolLocation(
  context:
    CalendarContext,
): string {
  const parts = [
    context.school.city,
    context.school.state,
  ].filter(Boolean)

  if (
    parts.length ===
    0
  ) {
    return 'Localização não informada'
  }

  return parts.join(
    ' / ',
  )
}

export default function InstitutionalCalendarEventsPage() {
  const {
    schoolYears,
    selectedSchoolYearId,
    snapshot,

    loadingSchoolYears,
    loadingSnapshot,

    error:
      calendarError,

    loadSchoolYears,
    selectSchoolYear,

    clearSnapshot,
    clearError:
      clearCalendarError,
  } =
    useInstitutionalAcademicCalendar()

  const [
    contexts,
    setContexts,
  ] =
    useState<
      CalendarContext[]
    >([])

  const [
    selectedContextId,
    setSelectedContextId,
  ] =
    useState('')

  const [
    loadingContexts,
    setLoadingContexts,
  ] =
    useState(true)

  const [
    contextError,
    setContextError,
  ] =
    useState<string | null>(
      null,
    )

  const [
    actionMessage,
    setActionMessage,
  ] =
    useState<string | null>(
      null,
    )

  const selectedContext =
    useMemo(
      () =>
        contexts.find(
          context =>
            context.id ===
            selectedContextId,
        ) ??
        null,
      [
        contexts,
        selectedContextId,
      ],
    )

  const visibleSchoolYears =
    useMemo(
      () => {
        if (!selectedContext) {
          return []
        }

        return schoolYears.filter(
          schoolYear =>
            schoolYear
              .organization_id ===
              selectedContext
                .organization.id &&
            schoolYear
              .school_id ===
              selectedContext
                .school.id,
        )
      },
      [
        schoolYears,
        selectedContext,
      ],
    )

  const validSnapshot =
    useMemo(
      () => {
        if (
          !snapshot ||
          !selectedContext
        ) {
          return null
        }

        if (
          snapshot
            .schoolYear
            .organization_id !==
            selectedContext
              .organization.id ||
          snapshot
            .schoolYear
            .school_id !==
            selectedContext
              .school.id
        ) {
          return null
        }

        return snapshot
      },
      [
        selectedContext,
        snapshot,
      ],
    )

  const loadContexts =
    useCallback(
      async (): Promise<void> => {
        setLoadingContexts(
          true,
        )

        setContextError(
          null,
        )

        try {
          const response =
            await fetch(
              CONTEXTS_API_URL,
              {
                method:
                  'GET',

                credentials:
                  'include',

                cache:
                  'no-store',
              },
            )

          const result =
            await readContextsResponse(
              response,
            )

          if (
            !response.ok ||
            !result.success ||
            !Array.isArray(
              result.data,
            )
          ) {
            throw new Error(
              result.error ??
                'Não foi possível carregar os contextos institucionais.',
            )
          }

          const nextContexts =
            sortContexts(
              result.data,
            )

          setContexts(
            nextContexts,
          )

          setSelectedContextId(
            currentContextId => {
              if (
                currentContextId &&
                nextContexts.some(
                  context =>
                    context.id ===
                    currentContextId,
                )
              ) {
                return currentContextId
              }

              return (
                nextContexts[0]
                  ?.id ??
                ''
              )
            },
          )
        } catch (
          loadError
        ) {
          setContexts(
            [],
          )

          setSelectedContextId(
            '',
          )

          setContextError(
            loadError instanceof
              Error
              ? loadError.message
              : 'Erro inesperado ao carregar os contextos institucionais.',
          )
        } finally {
          setLoadingContexts(
            false,
          )
        }
      },
      [],
    )

  useEffect(() => {
    void loadContexts()
  }, [
    loadContexts,
  ])

  useEffect(() => {
    if (!selectedContext) {
      clearSnapshot()
      return
    }

    clearCalendarError()
    clearSnapshot()

    setContextError(
      null,
    )

    setActionMessage(
      null,
    )

    void loadSchoolYears({
      organizationId:
        selectedContext
          .organization.id,

      schoolId:
        selectedContext
          .school.id,

      includeDeleted:
        false,
    })
  }, [
    clearCalendarError,
    clearSnapshot,
    loadSchoolYears,
    selectedContext,
  ])

  function handleContextChange(
    contextId: string,
  ): void {
    setSelectedContextId(
      contextId,
    )

    setContextError(
      null,
    )

    setActionMessage(
      null,
    )

    clearCalendarError()
    clearSnapshot()
  }

  async function handleSchoolYearChange(
    schoolYearId: string,
  ): Promise<void> {
    setActionMessage(
      null,
    )

    clearCalendarError()

    if (!schoolYearId) {
      await selectSchoolYear(
        null,
      )

      return
    }

    try {
      await selectSchoolYear(
        schoolYearId,
      )

      setActionMessage(
        'Ano letivo selecionado.',
      )
    } catch {
      // A mensagem segura é registrada pelo Hook.
    }
  }

  const loading =
    loadingContexts ||
    loadingSchoolYears ||
    loadingSnapshot

  return (
    <AgendaPageShell
      eyebrow="Governança temporal"
      title="Eventos do Calendário Institucional"
      description="Cadastre férias, recessos, feriados, formações, avaliações e demais datas que afetam o funcionamento e a contagem dos dias escolares."
    >
      <div className="space-y-6 sm:space-y-8">
        <nav className="grid gap-3 sm:grid-cols-2 lg:flex lg:flex-wrap">
          <Link
            href="/agenda/calendario/institucional"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-cyan-300 bg-cyan-50 px-5 py-3 text-center text-sm font-bold text-cyan-900 transition hover:border-cyan-600 hover:bg-cyan-100 lg:w-auto"
          >
            Voltar à estrutura institucional
          </Link>

          <Link
            href="/agenda/calendario"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-center text-sm font-bold text-slate-700 transition hover:border-cyan-500 hover:bg-cyan-50 lg:w-auto"
          >
            Voltar ao calendário operacional
          </Link>

          <button
            type="button"
            onClick={() =>
              void loadContexts()
            }
            disabled={
              loadingContexts
            }
            className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-cyan-500 hover:bg-cyan-50 disabled:cursor-not-allowed disabled:opacity-60 lg:ml-auto lg:w-auto"
          >
            {loadingContexts
              ? 'Atualizando contextos...'
              : 'Atualizar contextos'}
          </button>
        </nav>

        {contextError ? (
          <div
            role="alert"
            className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-semibold leading-6 text-red-700"
          >
            {contextError}
          </div>
        ) : null}

        {calendarError ? (
          <div
            role="alert"
            className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-semibold leading-6 text-red-700"
          >
            {calendarError}
          </div>
        ) : null}

        {actionMessage ? (
          <div
            role="status"
            className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm font-semibold leading-6 text-emerald-800"
          >
            {actionMessage}
          </div>
        ) : null}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <header className="border-b border-slate-200 bg-slate-50 px-5 py-5 sm:px-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-800">
              Escopo institucional
            </p>

            <h2 className="mt-2 text-xl font-bold text-[#071827] sm:text-2xl">
              Organização, escola e ano letivo
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Somente contextos e anos letivos autorizados para a conta autenticada são exibidos.
            </p>
          </header>

          <div className="p-5 sm:p-6">
            {loadingContexts ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm font-semibold text-slate-600">
                Carregando contextos autorizados...
              </div>
            ) : contexts.length ===
              0 ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
                <p className="font-bold text-amber-900">
                  Nenhum contexto institucional disponível
                </p>

                <p className="mt-2 text-sm leading-6 text-amber-800">
                  A conta não possui vínculo ativo com uma escola autorizada para administrar o calendário institucional.
                </p>
              </div>
            ) : (
              <div className="grid gap-5 lg:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-bold text-slate-700">
                    Contexto de trabalho
                  </span>

                  <select
                    value={
                      selectedContextId
                    }
                    onChange={
                      event =>
                        handleContextChange(
                          event.target.value,
                        )
                    }
                    disabled={
                      loading
                    }
                    className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {contexts.map(
                      context => (
                        <option
                          key={
                            context.id
                          }
                          value={
                            context.id
                          }
                        >
                          {
                            context
                              .organization
                              .name
                          } — {
                            context
                              .school
                              .name
                          }
                        </option>
                      ),
                    )}
                  </select>
                </label>

                <label className="block">
                  <span className="text-sm font-bold text-slate-700">
                    Ano letivo
                  </span>

                  <select
                    value={
                      selectedSchoolYearId ??
                      ''
                    }
                    onChange={
                      event =>
                        void handleSchoolYearChange(
                          event.target.value,
                        )
                    }
                    disabled={
                      loading ||
                      visibleSchoolYears
                        .length === 0
                    }
                    className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {visibleSchoolYears
                      .length === 0 ? (
                      <option value="">
                        Nenhum ano letivo disponível
                      </option>
                    ) : null}

                    {visibleSchoolYears.map(
                      schoolYear => (
                        <option
                          key={
                            schoolYear.id
                          }
                          value={
                            schoolYear.id
                          }
                        >
                          {schoolYear.name ??
                            `Ano Letivo ${schoolYear.year}`}
                        </option>
                      ),
                    )}
                  </select>
                </label>
              </div>
            )}

            {selectedContext ? (
              <div className="mt-5 grid gap-4 rounded-2xl border border-cyan-200 bg-cyan-50/70 p-5 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-800">
                    Organização
                  </p>

                  <p className="mt-1 break-words text-sm font-bold text-[#071827]">
                    {
                      selectedContext
                        .organization
                        .name
                    }
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-800">
                    Escola
                  </p>

                  <p className="mt-1 break-words text-sm font-bold text-[#071827]">
                    {
                      selectedContext
                        .school
                        .name
                    }
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-800">
                    Localização
                  </p>

                  <p className="mt-1 text-sm font-bold text-[#071827]">
                    {getSchoolLocation(
                      selectedContext,
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-800">
                    Perfil
                  </p>

                  <p className="mt-1 text-sm font-bold text-[#071827]">
                    {
                      selectedContext
                        .roleLabel
                    }
                  </p>

                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {selectedContext
                      .canManage
                      ? 'Gestão autorizada'
                      : 'Somente consulta'}
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </section>

        {loadingSchoolYears ||
        loadingSnapshot ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm font-semibold text-slate-600 shadow-sm">
            Carregando estrutura do ano letivo...
          </div>
        ) : null}

        {!loading &&
        selectedContext &&
        visibleSchoolYears.length ===
          0 ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
            <p className="font-bold text-amber-900">
              Nenhum ano letivo cadastrado
            </p>

            <p className="mt-2 text-sm leading-6 text-amber-800">
              Cadastre primeiro o ano letivo na página de estrutura institucional.
            </p>

            <Link
              href="/agenda/calendario/institucional"
              className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-[#071827] px-5 py-3 text-sm font-bold text-white transition hover:bg-cyan-900 sm:w-auto"
            >
              Abrir estrutura institucional
            </Link>
          </div>
        ) : null}

        {validSnapshot &&
        selectedContext ? (
          <>
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-800">
                    Ano selecionado
                  </p>

                  <h2 className="mt-2 text-xl font-bold text-[#071827] sm:text-2xl">
                    {validSnapshot
                      .schoolYear
                      .name ??
                      `Ano Letivo ${validSnapshot.schoolYear.year}`}
                  </h2>
                </div>

                <span className="inline-flex w-fit rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">
                  {validSnapshot
                    .schoolYear
                    .status ===
                  'published'
                    ? 'Publicado'
                    : validSnapshot
                          .schoolYear
                          .status ===
                        'closed'
                      ? 'Encerrado'
                      : validSnapshot
                            .schoolYear
                            .status ===
                          'archived'
                        ? 'Arquivado'
                        : 'Rascunho'}
                </span>
              </div>

              <div className="mt-5 grid gap-4 border-t border-slate-200 pt-5 sm:grid-cols-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                    Início
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-700">
                    {formatDate(
                      validSnapshot
                        .schoolYear
                        .start_date,
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                    Encerramento
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-700">
                    {formatDate(
                      validSnapshot
                        .schoolYear
                        .end_date,
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                    Períodos cadastrados
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-700">
                    {
                      validSnapshot
                        .periods
                        .length
                    }
                  </p>
                </div>
              </div>
            </section>

            <InstitutionalCalendarEventsPanel
              organizationId={
                selectedContext
                  .organization.id
              }
              schoolId={
                selectedContext
                  .school.id
              }
              schoolYearId={
                validSnapshot
                  .schoolYear.id
              }
              calendarYear={
                validSnapshot
                  .schoolYear.year
              }
              schoolYearStartDate={
                validSnapshot
                  .schoolYear
                  .start_date
              }
              schoolYearEndDate={
                validSnapshot
                  .schoolYear
                  .end_date
              }
              schoolState={
                selectedContext
                  .school.state
              }
              schoolCity={
                selectedContext
                  .school.city
              }
              periods={
                validSnapshot.periods
              }
              canManage={
                selectedContext
                  .canManage
              }
            />
          </>
        ) : null}
      </div>
    </AgendaPageShell>
  )
}