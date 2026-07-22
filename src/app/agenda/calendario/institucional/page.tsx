'use client'

import {
  type FormEvent,
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
  useInstitutionalAcademicCalendar,
} from '@/lib/agenda/hooks/useInstitutionalAcademicCalendar'

import type {
  AcademicCalendarStatus,
  SchoolYear,
} from '@/lib/agenda/repository/institutional-academic-calendar.repository'

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

function getStatusLabel(
  status:
    AcademicCalendarStatus,
): string {
  if (
    status ===
    'published'
  ) {
    return 'Publicado'
  }

  if (
    status ===
    'closed'
  ) {
    return 'Encerrado'
  }

  if (
    status ===
    'archived'
  ) {
    return 'Arquivado'
  }

  return 'Rascunho'
}

function getStatusClasses(
  status:
    AcademicCalendarStatus,
): string {
  if (
    status ===
    'published'
  ) {
    return [
      'border-emerald-200',
      'bg-emerald-50',
      'text-emerald-800',
    ].join(' ')
  }

  if (
    status ===
    'closed'
  ) {
    return [
      'border-slate-300',
      'bg-slate-100',
      'text-slate-700',
    ].join(' ')
  }

  if (
    status ===
    'archived'
  ) {
    return [
      'border-violet-200',
      'bg-violet-50',
      'text-violet-800',
    ].join(' ')
  }

  return [
    'border-amber-200',
    'bg-amber-50',
    'text-amber-800',
  ].join(' ')
}

function getSchoolLocation(
  context:
    CalendarContext,
): string {
  const locationParts = [
    context.school.city,
    context.school.state,
  ].filter(Boolean)

  if (
    locationParts.length ===
    0
  ) {
    return 'Localização não informada'
  }

  return locationParts.join(
    ' / ',
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

function readContextsResponse(
  response: Response,
): Promise<CalendarContextsResponse> {
  return response
    .json()
    .catch(
      () => {
        throw new Error(
          'A resposta dos contextos institucionais é inválida.',
        )
      },
    ) as Promise<CalendarContextsResponse>
}

function SchoolYearCard({
  schoolYear,
  selected,
  loading,
  onOpen,
}: {
  schoolYear: SchoolYear
  selected: boolean
  loading: boolean
  onOpen: () => void
}) {
  return (
    <article
      className={[
        'rounded-2xl border bg-white p-5 shadow-sm transition',
        selected
          ? 'border-cyan-500 ring-2 ring-cyan-100'
          : 'border-slate-200',
      ].join(' ')}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={[
                'inline-flex rounded-full border px-3 py-1 text-xs font-bold',
                getStatusClasses(
                  schoolYear.status,
                ),
              ].join(' ')}
            >
              {getStatusLabel(
                schoolYear.status,
              )}
            </span>

            {schoolYear.active ? (
              <span className="inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-800">
                Ativo
              </span>
            ) : null}
          </div>

          <h3 className="mt-4 break-words text-xl font-bold text-[#071827]">
            {schoolYear.name ??
              `${schoolYear.year} — Ano letivo`}
          </h3>

          <p className="mt-1 text-sm font-semibold text-slate-500">
            Referência {schoolYear.year}
          </p>
        </div>

        <button
          type="button"
          onClick={onOpen}
          disabled={loading}
          className="inline-flex min-h-11 w-full shrink-0 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-cyan-500 hover:bg-cyan-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {loading && selected
            ? 'Carregando...'
            : selected
              ? 'Atualizar estrutura'
              : 'Abrir estrutura'}
        </button>
      </div>

      <div className="mt-5 grid gap-3 border-t border-slate-200 pt-5 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
            Início
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-700">
            {formatDate(
              schoolYear.start_date,
            )}
          </p>
        </div>

        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
            Encerramento
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-700">
            {formatDate(
              schoolYear.end_date,
            )}
          </p>
        </div>

        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
            Dias letivos
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-700">
            {
              schoolYear
                .minimum_school_days
            }
          </p>
        </div>

        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
            Versão
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-700">
            {
              schoolYear
                .calendar_version
            }
          </p>
        </div>
      </div>
    </article>
  )
}

export default function InstitutionalAcademicCalendarPage() {
  const {
    schoolYears,
    selectedSchoolYearId,
    snapshot,

    loadingSchoolYears,
    loadingSnapshot,
    creatingSchoolYear,

    error:
      calendarError,

    loadSchoolYears,
    selectSchoolYear,
    createSchoolYear,

    clearSnapshot,
    clearError,
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
    useState<string>(
      '',
    )

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
    isPlatformAdmin,
    setIsPlatformAdmin,
  ] =
    useState(false)

  const [
    showCreateForm,
    setShowCreateForm,
  ] =
    useState(false)

  const [
    actionMessage,
    setActionMessage,
  ] =
    useState<string | null>(
      null,
    )

  const [
    formYear,
    setFormYear,
  ] =
    useState(
      String(
        new Date()
          .getFullYear(),
      ),
    )

  const [
    formName,
    setFormName,
  ] =
    useState('')

  const [
    formStartDate,
    setFormStartDate,
  ] =
    useState('')

  const [
    formEndDate,
    setFormEndDate,
  ] =
    useState('')

  const [
    formMinimumDays,
    setFormMinimumDays,
  ] =
    useState('200')

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
            schoolYear.school_id ===
              selectedContext
                .school.id,
        )
      },
      [
        schoolYears,
        selectedContext,
      ],
    )

  const snapshotBelongsToContext =
    Boolean(
      snapshot &&
      selectedContext &&
      snapshot
        .schoolYear
        .organization_id ===
        selectedContext
          .organization.id &&
      snapshot
        .schoolYear
        .school_id ===
        selectedContext
          .school.id,
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

          setIsPlatformAdmin(
            result.isPlatformAdmin ??
              false,
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
      return
    }

    clearError()
    clearSnapshot()

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
    clearError,
    clearSnapshot,
    loadSchoolYears,
    selectedContext,
  ])

  async function handleCreateSchoolYear(
    event:
      FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault()

    if (!selectedContext) {
      setContextError(
        'Selecione um contexto institucional.',
      )

      return
    }

    if (
      !selectedContext.canManage
    ) {
      setContextError(
        'O perfil atual não possui autorização para criar anos letivos.',
      )

      return
    }

    const year =
      Number(
        formYear,
      )

    const minimumSchoolDays =
      Number(
        formMinimumDays,
      )

    setActionMessage(
      null,
    )

    try {
      const createdSchoolYear =
        await createSchoolYear({
          organizationId:
            selectedContext
              .organization.id,

          schoolId:
            selectedContext
              .school.id,

          year,

          name:
            formName.trim() ||
            null,

          startDate:
            formStartDate ||
            null,

          endDate:
            formEndDate ||
            null,

          active:
            true,

          status:
            'draft',

          timezone:
            'America/Sao_Paulo',

          minimumSchoolDays,

          calendarVersion:
            1,
        })

      setActionMessage(
        `Ano letivo ${createdSchoolYear.year} criado como rascunho.`,
      )

      setShowCreateForm(
        false,
      )

      setFormName('')
      setFormStartDate('')
      setFormEndDate('')

      await loadSchoolYears({
        organizationId:
          selectedContext
            .organization.id,

        schoolId:
          selectedContext
            .school.id,

        includeDeleted:
          false,
      })
    } catch {
      // O Hook já registra a mensagem segura em calendarError.
    }
  }

  async function handleOpenSchoolYear(
    schoolYearId: string,
  ): Promise<void> {
    setActionMessage(
      null,
    )

    try {
      await selectSchoolYear(
        schoolYearId,
      )

      setActionMessage(
        'Estrutura do calendário letivo carregada.',
      )
    } catch {
      // O Hook já registra a mensagem segura em calendarError.
    }
  }

  function handleContextChange(
    nextContextId: string,
  ): void {
    setSelectedContextId(
      nextContextId,
    )

    setShowCreateForm(
      false,
    )

    setActionMessage(
      null,
    )
  }

  return (
    <AgendaPageShell
      eyebrow="Governança temporal"
      title="Calendário Letivo Institucional"
      description="Organize anos letivos, períodos acadêmicos, datas oficiais, horários de funcionamento e exceções escolares dentro do Core Compartilhado do EIOS."
    >
      <div className="space-y-6 sm:space-y-8">
        <nav className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/agenda/calendario"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-cyan-500 hover:bg-cyan-50 sm:w-auto"
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
            className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-cyan-300 bg-cyan-50 px-5 py-3 text-sm font-bold text-cyan-900 transition hover:border-cyan-600 hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
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
              Organização e unidade escolar
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Somente organizações e escolas autorizadas para a conta autenticada são exibidas.
            </p>
          </header>

          <div className="p-5 sm:p-6">
            {loadingContexts ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm font-semibold text-slate-600">
                Carregando contextos autorizados...
              </div>
            ) : contexts.length === 0 ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
                <p className="font-bold text-amber-900">
                  Nenhum contexto institucional disponível
                </p>

                <p className="mt-2 text-sm leading-6 text-amber-800">
                  A conta não possui vínculo ativo com uma escola autorizada para o Calendário Letivo Institucional.
                </p>
              </div>
            ) : (
              <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.7fr)]">
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
                    className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100"
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

                {selectedContext ? (
                  <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-4">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full border border-cyan-300 bg-white px-3 py-1 text-xs font-bold text-cyan-900">
                        {
                          selectedContext
                            .roleLabel
                        }
                      </span>

                      <span
                        className={[
                          'rounded-full border px-3 py-1 text-xs font-bold',
                          selectedContext.canManage
                            ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                            : 'border-slate-300 bg-slate-100 text-slate-700',
                        ].join(' ')}
                      >
                        {selectedContext.canManage
                          ? 'Gestão autorizada'
                          : 'Somente leitura'}
                      </span>
                    </div>

                    <p className="mt-3 font-bold text-[#071827]">
                      {
                        selectedContext
                          .school
                          .name
                      }
                    </p>

                    <p className="mt-1 text-sm text-slate-600">
                      {getSchoolLocation(
                        selectedContext,
                      )}
                    </p>

                    {isPlatformAdmin ? (
                      <p className="mt-2 text-xs font-bold uppercase tracking-[0.12em] text-cyan-800">
                        Escopo de plataforma
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </section>

        {selectedContext ? (
          <>
            <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
                  Anos letivos
                </p>

                <p className="mt-3 text-3xl font-bold text-[#071827]">
                  {
                    visibleSchoolYears
                      .length
                  }
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
                  Períodos
                </p>

                <p className="mt-3 text-3xl font-bold text-[#071827]">
                  {snapshotBelongsToContext
                    ? snapshot
                        ?.periods
                        .length ??
                      0
                    : 0}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
                  Eventos oficiais
                </p>

                <p className="mt-3 text-3xl font-bold text-[#071827]">
                  {snapshotBelongsToContext
                    ? snapshot
                        ?.events
                        .length ??
                      0
                    : 0}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
                  Exceções
                </p>

                <p className="mt-3 text-3xl font-bold text-[#071827]">
                  {snapshotBelongsToContext
                    ? snapshot
                        ?.exceptions
                        .length ??
                      0
                    : 0}
                </p>
              </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <header className="flex flex-col gap-4 border-b border-slate-200 bg-slate-50 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-800">
                    Estrutura acadêmica
                  </p>

                  <h2 className="mt-2 text-xl font-bold text-[#071827] sm:text-2xl">
                    Anos letivos da unidade
                  </h2>
                </div>

                {selectedContext.canManage ? (
                  <button
                    type="button"
                    onClick={() => {
                      clearError()

                      setShowCreateForm(
                        currentValue =>
                          !currentValue,
                      )
                    }}
                    className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-[#071827] px-5 py-3 text-sm font-bold text-white transition hover:bg-cyan-900 sm:w-auto"
                  >
                    {showCreateForm
                      ? 'Fechar cadastro'
                      : 'Novo ano letivo'}
                  </button>
                ) : null}
              </header>

              {showCreateForm &&
              selectedContext
                .canManage ? (
                <form
                  onSubmit={
                    handleCreateSchoolYear
                  }
                  className="border-b border-slate-200 bg-cyan-50/60 p-5 sm:p-6"
                >
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    <label className="block">
                      <span className="text-sm font-bold text-slate-700">
                        Ano
                      </span>

                      <input
                        type="number"
                        min="2000"
                        max="2100"
                        required
                        value={
                          formYear
                        }
                        onChange={
                          event =>
                            setFormYear(
                              event
                                .target
                                .value,
                            )
                        }
                        className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100"
                      />
                    </label>

                    <label className="block sm:col-span-1 lg:col-span-2">
                      <span className="text-sm font-bold text-slate-700">
                        Nome institucional
                      </span>

                      <input
                        type="text"
                        maxLength={180}
                        value={
                          formName
                        }
                        onChange={
                          event =>
                            setFormName(
                              event
                                .target
                                .value,
                            )
                        }
                        placeholder="Ex.: Ano Letivo 2026"
                        className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100"
                      />
                    </label>

                    <label className="block">
                      <span className="text-sm font-bold text-slate-700">
                        Dias letivos
                      </span>

                      <input
                        type="number"
                        min="0"
                        max="366"
                        required
                        value={
                          formMinimumDays
                        }
                        onChange={
                          event =>
                            setFormMinimumDays(
                              event
                                .target
                                .value,
                            )
                        }
                        className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100"
                      />
                    </label>

                    <label className="block sm:col-span-1 lg:col-span-2">
                      <span className="text-sm font-bold text-slate-700">
                        Data inicial
                      </span>

                      <input
                        type="date"
                        value={
                          formStartDate
                        }
                        onChange={
                          event =>
                            setFormStartDate(
                              event
                                .target
                                .value,
                            )
                        }
                        className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100"
                      />
                    </label>

                    <label className="block sm:col-span-1 lg:col-span-2">
                      <span className="text-sm font-bold text-slate-700">
                        Data final
                      </span>

                      <input
                        type="date"
                        value={
                          formEndDate
                        }
                        onChange={
                          event =>
                            setFormEndDate(
                              event
                                .target
                                .value,
                            )
                        }
                        className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100"
                      />
                    </label>
                  </div>

                  <div className="mt-5 rounded-xl border border-cyan-200 bg-white p-4 text-sm leading-6 text-slate-600">
                    O ano letivo será criado como <strong>rascunho</strong>. A publicação ocorrerá somente após a configuração e a validação institucional.
                  </div>

                  <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                    <button
                      type="submit"
                      disabled={
                        creatingSchoolYear
                      }
                      className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-[#071827] px-6 py-3 text-sm font-bold text-white transition hover:bg-cyan-900 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                    >
                      {creatingSchoolYear
                        ? 'Criando ano letivo...'
                        : 'Criar ano letivo'}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setShowCreateForm(
                          false,
                        )
                      }
                      disabled={
                        creatingSchoolYear
                      }
                      className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-700 transition hover:border-cyan-500 hover:bg-cyan-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              ) : null}

              <div className="p-5 sm:p-6">
                {loadingSchoolYears ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm font-semibold text-slate-600">
                    Carregando anos letivos...
                  </div>
                ) : visibleSchoolYears
                    .length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                    <p className="font-bold text-[#071827]">
                      Nenhum ano letivo cadastrado
                    </p>

                    <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                      A unidade selecionada ainda não possui uma estrutura de calendário institucional. Usuários autorizados podem iniciar o primeiro ano letivo como rascunho.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {visibleSchoolYears.map(
                      schoolYear => (
                        <SchoolYearCard
                          key={
                            schoolYear.id
                          }
                          schoolYear={
                            schoolYear
                          }
                          selected={
                            selectedSchoolYearId ===
                            schoolYear.id
                          }
                          loading={
                            loadingSnapshot
                          }
                          onOpen={() =>
                            void handleOpenSchoolYear(
                              schoolYear.id,
                            )
                          }
                        />
                      ),
                    )}
                  </div>
                )}
              </div>
            </section>

            {snapshotBelongsToContext &&
            snapshot ? (
              <section className="overflow-hidden rounded-2xl border border-cyan-200 bg-white shadow-sm">
                <header className="border-b border-cyan-200 bg-cyan-50 px-5 py-5 sm:px-6">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-800">
                    Estrutura carregada
                  </p>

                  <h2 className="mt-2 text-xl font-bold text-[#071827] sm:text-2xl">
                    {
                      snapshot
                        .schoolYear
                        .name ??
                      `${snapshot.schoolYear.year} — Ano letivo`
                    }
                  </h2>
                </header>

                <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-4">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                      Períodos
                    </p>

                    <p className="mt-2 text-2xl font-bold text-[#071827]">
                      {
                        snapshot
                          .periods
                          .length
                      }
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                      Eventos
                    </p>

                    <p className="mt-2 text-2xl font-bold text-[#071827]">
                      {
                        snapshot
                          .events
                          .length
                      }
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                      Horários
                    </p>

                    <p className="mt-2 text-2xl font-bold text-[#071827]">
                      {
                        snapshot
                          .operatingHours
                          .length
                      }
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                      Exceções
                    </p>

                    <p className="mt-2 text-2xl font-bold text-[#071827]">
                      {
                        snapshot
                          .exceptions
                          .length
                      }
                    </p>
                  </div>
                </div>
              </section>
            ) : null}
          </>
        ) : null}
      </div>
    </AgendaPageShell>
  )
}