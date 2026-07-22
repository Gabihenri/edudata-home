'use client'

import {
  type FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import {
  useInstitutionalAcademicEvents,
} from '@/lib/agenda/hooks/useInstitutionalAcademicEvents'

import type {
  AcademicPeriod,
  InstitutionalCalendarEvent,
  InstitutionalCalendarEventStatus,
  InstitutionalCalendarEventType,
  InstitutionalCalendarPriority,
} from '@/lib/agenda/repository/institutional-academic-calendar.repository'

type InstitutionalCalendarEventsPanelProps = {
  organizationId: string
  schoolId: string
  schoolYearId: string

  calendarYear: number

  schoolYearStartDate:
    | string
    | null

  schoolYearEndDate:
    | string
    | null

  schoolState?:
    | string
    | null

  schoolCity?:
    | string
    | null

  periods: AcademicPeriod[]

  canManage: boolean

  onEventsChanged?: (
    events:
      InstitutionalCalendarEvent[],
  ) => void
}

type EventFormState = {
  title: string
  description: string

  eventType:
    InstitutionalCalendarEventType

  academicPeriodId: string

  startDate: string
  endDate: string

  allDay: boolean

  startTime: string
  endTime: string

  sourceReference: string

  isInstructionalDay: boolean
  countsAsSchoolDay: boolean
  suspendsClasses: boolean
  isMandatory: boolean

  priority:
    InstitutionalCalendarPriority
}

const EVENT_TYPE_OPTIONS: Array<{
  value:
    InstitutionalCalendarEventType

  label: string
}> = [
  {
    value: 'holiday',
    label: 'Feriado',
  },
  {
    value: 'optional_holiday',
    label: 'Ponto facultativo',
  },
  {
    value: 'recess',
    label: 'Férias ou recesso',
  },
  {
    value: 'planning',
    label: 'Planejamento',
  },
  {
    value: 'teacher_training',
    label: 'Formação docente',
  },
  {
    value: 'school_council',
    label: 'Conselho escolar',
  },
  {
    value: 'assessment',
    label: 'Avaliação',
  },
  {
    value: 'recovery',
    label: 'Recuperação',
  },
  {
    value: 'school_saturday',
    label: 'Sábado letivo',
  },
  {
    value: 'closure',
    label: 'Suspensão ou fechamento',
  },
  {
    value: 'commemorative',
    label: 'Data comemorativa',
  },
  {
    value: 'operational',
    label: 'Evento operacional',
  },
  {
    value: 'enrollment',
    label: 'Matrícula',
  },
  {
    value: 'deadline',
    label: 'Prazo institucional',
  },
  {
    value: 'other',
    label: 'Outro',
  },
]

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

function createEmptyForm(): EventFormState {
  return {
    title: '',
    description: '',

    eventType:
      'recess',

    academicPeriodId:
      '',

    startDate: '',
    endDate: '',

    allDay: true,

    startTime: '',
    endTime: '',

    sourceReference:
      '',

    isInstructionalDay:
      false,

    countsAsSchoolDay:
      false,

    suspendsClasses:
      true,

    isMandatory:
      false,

    priority:
      'normal',
  }
}

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

function formatDateRange(
  startDate: string,
  endDate: string,
): string {
  if (
    startDate ===
    endDate
  ) {
    return formatDate(
      startDate,
    )
  }

  return [
    formatDate(
      startDate,
    ),

    formatDate(
      endDate,
    ),
  ].join(' até ')
}

function formatTime(
  value:
    | string
    | null,
): string {
  if (!value) {
    return ''
  }

  return value.slice(
    0,
    5,
  )
}

function getEventTypeLabel(
  eventType:
    InstitutionalCalendarEventType,
): string {
  return (
    EVENT_TYPE_OPTIONS.find(
      option =>
        option.value ===
        eventType,
    )?.label ??
    'Outro'
  )
}

function getStatusLabel(
  status:
    InstitutionalCalendarEventStatus,
): string {
  if (
    status ===
    'published'
  ) {
    return 'Publicado'
  }

  if (
    status ===
    'cancelled'
  ) {
    return 'Cancelado'
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
    InstitutionalCalendarEventStatus,
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
    'cancelled'
  ) {
    return [
      'border-red-200',
      'bg-red-50',
      'text-red-700',
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

function getPriorityLabel(
  priority:
    InstitutionalCalendarPriority,
): string {
  if (
    priority ===
    'critical'
  ) {
    return 'Crítica'
  }

  if (
    priority ===
    'high'
  ) {
    return 'Alta'
  }

  return 'Normal'
}

function getPriorityClasses(
  priority:
    InstitutionalCalendarPriority,
): string {
  if (
    priority ===
    'critical'
  ) {
    return [
      'border-red-200',
      'bg-red-50',
      'text-red-700',
    ].join(' ')
  }

  if (
    priority ===
    'high'
  ) {
    return [
      'border-orange-200',
      'bg-orange-50',
      'text-orange-800',
    ].join(' ')
  }

  return [
    'border-slate-200',
    'bg-slate-50',
    'text-slate-700',
  ].join(' ')
}

function InstitutionalEventCard({
  event,
}: {
  event:
    InstitutionalCalendarEvent
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={[
                'inline-flex rounded-full border px-3 py-1 text-xs font-bold',
                getStatusClasses(
                  event.status,
                ),
              ].join(' ')}
            >
              {getStatusLabel(
                event.status,
              )}
            </span>

            <span className="inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-900">
              {getEventTypeLabel(
                event.event_type,
              )}
            </span>

            <span
              className={[
                'inline-flex rounded-full border px-3 py-1 text-xs font-bold',
                getPriorityClasses(
                  event.priority,
                ),
              ].join(' ')}
            >
              Prioridade {
                getPriorityLabel(
                  event.priority,
                ).toLowerCase()
              }
            </span>
          </div>

          <h3 className="mt-4 break-words text-lg font-bold text-[#071827]">
            {event.title}
          </h3>

          {event.description ? (
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
              {event.description}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-5 grid gap-4 border-t border-slate-200 pt-5 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
            Período
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-700">
            {formatDateRange(
              event.start_date,
              event.end_date,
            )}
          </p>
        </div>

        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
            Horário
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-700">
            {event.all_day
              ? 'Dia inteiro'
              : [
                  formatTime(
                    event.start_time,
                  ),
                  formatTime(
                    event.end_time,
                  ),
                ]
                  .filter(
                    Boolean,
                  )
                  .join(' até ') ||
                'Não informado'}
          </p>
        </div>

        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
            Funcionamento
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-700">
            {event.suspends_classes
              ? 'Suspende aulas'
              : 'Não suspende aulas'}
          </p>
        </div>

        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
            Contagem
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-700">
            {event.is_instructional_day
              ? 'Dia letivo'
              : event.counts_as_school_day
                ? 'Dia escolar'
                : 'Não contabilizado'}
          </p>
        </div>
      </div>

      {event.source_reference ? (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
            Referência institucional
          </p>

          <p className="mt-1 break-words text-sm leading-6 text-slate-600">
            {event.source_reference}
          </p>
        </div>
      ) : null}
    </article>
  )
}

export function InstitutionalCalendarEventsPanel({
  organizationId,
  schoolId,
  schoolYearId,

  calendarYear,

  schoolYearStartDate,
  schoolYearEndDate,

  schoolState,
  schoolCity,

  periods,

  canManage,

  onEventsChanged,
}: InstitutionalCalendarEventsPanelProps) {
  const {
    institutionalEvents,
    loadedSchoolYearId,

    loadingInstitutionalEvents,
    creatingInstitutionalEvent,

    error,

    loadInstitutionalEvents,
    reloadInstitutionalEvents,

    createInstitutionalEvent,

    clearInstitutionalEvents,
    clearError,
  } =
    useInstitutionalAcademicEvents()

  const [
    showCreateForm,
    setShowCreateForm,
  ] =
    useState(false)

  const [
    form,
    setForm,
  ] =
    useState<EventFormState>(
      createEmptyForm(),
    )

  const [
    actionMessage,
    setActionMessage,
  ] =
    useState<string | null>(
      null,
    )

  const onEventsChangedRef =
    useRef(
      onEventsChanged,
    )

  useEffect(() => {
    onEventsChangedRef.current =
      onEventsChanged
  }, [
    onEventsChanged,
  ])

  const visibleEvents =
    useMemo(
      () => {
        if (
          loadedSchoolYearId !==
          schoolYearId
        ) {
          return []
        }

        return institutionalEvents
      },
      [
        institutionalEvents,
        loadedSchoolYearId,
        schoolYearId,
      ],
    )

  useEffect(() => {
    if (!schoolYearId) {
      clearInstitutionalEvents()
      return
    }

    void loadInstitutionalEvents({
      schoolYearId,
      calendarYear,
      includeDeleted:
        false,
    })
      .then(
        events => {
          onEventsChangedRef
            .current?.(
              events,
            )
        },
      )
      .catch(() => {
        // A mensagem segura é registrada pelo Hook.
      })
  }, [
    calendarYear,
    clearInstitutionalEvents,
    loadInstitutionalEvents,
    schoolYearId,
  ])

  function updateForm(
    patch:
      Partial<EventFormState>,
  ): void {
    setForm(
      currentForm => ({
        ...currentForm,
        ...patch,
      }),
    )
  }

  function resetForm(): void {
    setForm(
      createEmptyForm(),
    )
  }

  function handleToggleCreateForm(): void {
    clearError()

    setActionMessage(
      null,
    )

    if (
      !showCreateForm
    ) {
      resetForm()
    }

    setShowCreateForm(
      currentValue =>
        !currentValue,
    )
  }

  async function handleRefresh(): Promise<void> {
    setActionMessage(
      null,
    )

    clearError()

    try {
      const events =
        await reloadInstitutionalEvents()

      onEventsChangedRef
        .current?.(
          events,
        )

      setActionMessage(
        'Eventos institucionais atualizados.',
      )
    } catch {
      // A mensagem segura é registrada pelo Hook.
    }
  }

  async function handleCreateEvent(
    event:
      FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault()

    if (!canManage) {
      return
    }

    setActionMessage(
      null,
    )

    clearError()

    try {
      const createdEvent =
        await createInstitutionalEvent({
          organizationId,
          schoolId,
          schoolYearId,

          academicPeriodId:
            form.academicPeriodId ||
            null,

          calendarYear,

          title:
            form.title,

          description:
            form.description
              .trim() ||
            null,

          eventType:
            form.eventType,

          dateRule:
            'year_specific',

          sourceType:
            'institutional',

          sourceReference:
            form.sourceReference
              .trim() ||
            null,

          jurisdictionCountry:
            'Brasil',

          jurisdictionState:
            schoolState
              ?.trim()
              .toUpperCase() ||
            null,

          jurisdictionCity:
            schoolCity
              ?.trim() ||
            null,

          startDate:
            form.startDate,

          endDate:
            form.endDate,

          allDay:
            form.allDay,

          startTime:
            form.allDay
              ? null
              : form.startTime,

          endTime:
            form.allDay
              ? null
              : form.endTime ||
                null,

          isInstructionalDay:
            form.isInstructionalDay,

          countsAsSchoolDay:
            form.countsAsSchoolDay,

          suspendsClasses:
            form.suspendsClasses,

          isMandatory:
            form.isMandatory,

          priority:
            form.priority,
        })

      const events =
        await loadInstitutionalEvents({
          schoolYearId,
          calendarYear,
          includeDeleted:
            false,
        })

      onEventsChangedRef
        .current?.(
          events,
        )

      setActionMessage(
        `Evento “${createdEvent.title}” criado como rascunho.`,
      )

      setShowCreateForm(
        false,
      )

      resetForm()
    } catch {
      // A mensagem segura é registrada pelo Hook.
    }
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <header className="flex flex-col gap-4 border-b border-slate-200 bg-slate-50 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-800">
            Datas institucionais
          </p>

          <h2 className="mt-2 text-xl font-bold text-[#071827] sm:text-2xl">
            Eventos oficiais, férias e recessos
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Registre períodos sem aulas, feriados, formações, planejamentos, avaliações e demais datas que afetam o funcionamento escolar.
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <button
            type="button"
            onClick={() =>
              void handleRefresh()
            }
            disabled={
              loadingInstitutionalEvents ||
              creatingInstitutionalEvent
            }
            className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-cyan-300 bg-cyan-50 px-5 py-3 text-sm font-bold text-cyan-900 transition hover:border-cyan-600 hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {loadingInstitutionalEvents
              ? 'Atualizando...'
              : 'Atualizar eventos'}
          </button>

          {canManage ? (
            <button
              type="button"
              onClick={
                handleToggleCreateForm
              }
              disabled={
                creatingInstitutionalEvent
              }
              className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-[#071827] px-5 py-3 text-sm font-bold text-white transition hover:bg-cyan-900 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {showCreateForm
                ? 'Fechar cadastro'
                : 'Novo evento'}
            </button>
          ) : null}
        </div>
      </header>

      {error ? (
        <div
          role="alert"
          className="m-5 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-semibold leading-6 text-red-700 sm:m-6"
        >
          {error}
        </div>
      ) : null}

      {actionMessage ? (
        <div
          role="status"
          className="m-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm font-semibold leading-6 text-emerald-800 sm:m-6"
        >
          {actionMessage}
        </div>
      ) : null}

      {showCreateForm &&
      canManage ? (
        <form
          onSubmit={
            handleCreateEvent
          }
          className="border-b border-slate-200 bg-cyan-50/60 p-5 sm:p-6"
        >
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <label className="block sm:col-span-2">
              <span className="text-sm font-bold text-slate-700">
                Título do evento
              </span>

              <input
                type="text"
                required
                maxLength={220}
                autoFocus
                value={
                  form.title
                }
                onChange={
                  currentEvent =>
                    updateForm({
                      title:
                        currentEvent
                          .target
                          .value,
                    })
                }
                placeholder="Ex.: Férias docentes de julho"
                disabled={
                  creatingInstitutionalEvent
                }
                className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </label>

            <label className="block">
              <span className="text-sm font-bold text-slate-700">
                Tipo
              </span>

              <select
                value={
                  form.eventType
                }
                onChange={
                  currentEvent =>
                    updateForm({
                      eventType:
                        currentEvent
                          .target
                          .value as
                          InstitutionalCalendarEventType,
                    })
                }
                disabled={
                  creatingInstitutionalEvent
                }
                className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {EVENT_TYPE_OPTIONS.map(
                  option => (
                    <option
                      key={
                        option.value
                      }
                      value={
                        option.value
                      }
                    >
                      {option.label}
                    </option>
                  ),
                )}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-bold text-slate-700">
                Prioridade
              </span>

              <select
                value={
                  form.priority
                }
                onChange={
                  currentEvent =>
                    updateForm({
                      priority:
                        currentEvent
                          .target
                          .value as
                          InstitutionalCalendarPriority,
                    })
                }
                disabled={
                  creatingInstitutionalEvent
                }
                className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="normal">
                  Normal
                </option>

                <option value="high">
                  Alta
                </option>

                <option value="critical">
                  Crítica
                </option>
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-bold text-slate-700">
                Data inicial
              </span>

              <input
                type="date"
                required
                min={
                  schoolYearStartDate ??
                  undefined
                }
                max={
                  schoolYearEndDate ??
                  undefined
                }
                value={
                  form.startDate
                }
                onChange={
                  currentEvent =>
                    updateForm({
                      startDate:
                        currentEvent
                          .target
                          .value,

                      endDate:
                        form.endDate ||
                        currentEvent
                          .target
                          .value,
                    })
                }
                disabled={
                  creatingInstitutionalEvent
                }
                className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </label>

            <label className="block">
              <span className="text-sm font-bold text-slate-700">
                Data final
              </span>

              <input
                type="date"
                required
                min={
                  form.startDate ||
                  schoolYearStartDate ||
                  undefined
                }
                max={
                  schoolYearEndDate ??
                  undefined
                }
                value={
                  form.endDate
                }
                onChange={
                  currentEvent =>
                    updateForm({
                      endDate:
                        currentEvent
                          .target
                          .value,
                    })
                }
                disabled={
                  creatingInstitutionalEvent
                }
                className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </label>

            <label className="block sm:col-span-2">
              <span className="text-sm font-bold text-slate-700">
                Período letivo relacionado
              </span>

              <select
                value={
                  form.academicPeriodId
                }
                onChange={
                  currentEvent =>
                    updateForm({
                      academicPeriodId:
                        currentEvent
                          .target
                          .value,
                    })
                }
                disabled={
                  creatingInstitutionalEvent
                }
                className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="">
                  Sem vínculo específico
                </option>

                {periods.map(
                  period => (
                    <option
                      key={
                        period.id
                      }
                      value={
                        period.id
                      }
                    >
                      {period.sequence}. {period.name}
                    </option>
                  ),
                )}
              </select>
            </label>

            <label className="block sm:col-span-2 lg:col-span-4">
              <span className="text-sm font-bold text-slate-700">
                Descrição
              </span>

              <textarea
                rows={4}
                maxLength={5000}
                value={
                  form.description
                }
                onChange={
                  currentEvent =>
                    updateForm({
                      description:
                        currentEvent
                          .target
                          .value,
                    })
                }
                placeholder="Informações complementares sobre a data ou o período."
                disabled={
                  creatingInstitutionalEvent
                }
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </label>

            <label className="block sm:col-span-2 lg:col-span-4">
              <span className="text-sm font-bold text-slate-700">
                Referência institucional
              </span>

              <input
                type="text"
                maxLength={500}
                value={
                  form.sourceReference
                }
                onChange={
                  currentEvent =>
                    updateForm({
                      sourceReference:
                        currentEvent
                          .target
                          .value,
                    })
                }
                placeholder="Ex.: calendário informado pela unidade escolar"
                disabled={
                  creatingInstitutionalEvent
                }
                className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </label>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <label className="flex min-h-14 items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
              <input
                type="checkbox"
                checked={
                  form.allDay
                }
                onChange={
                  currentEvent =>
                    updateForm({
                      allDay:
                        currentEvent
                          .target
                          .checked,
                    })
                }
                disabled={
                  creatingInstitutionalEvent
                }
                className="h-5 w-5 accent-cyan-700"
              />

              <span className="text-sm font-bold text-slate-700">
                Dia inteiro
              </span>
            </label>

            <label className="flex min-h-14 items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
              <input
                type="checkbox"
                checked={
                  form.suspendsClasses
                }
                onChange={
                  currentEvent =>
                    updateForm({
                      suspendsClasses:
                        currentEvent
                          .target
                          .checked,
                    })
                }
                disabled={
                  creatingInstitutionalEvent
                }
                className="h-5 w-5 accent-cyan-700"
              />

              <span className="text-sm font-bold text-slate-700">
                Suspende aulas
              </span>
            </label>

            <label className="flex min-h-14 items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
              <input
                type="checkbox"
                checked={
                  form.isInstructionalDay
                }
                onChange={
                  currentEvent =>
                    updateForm({
                      isInstructionalDay:
                        currentEvent
                          .target
                          .checked,
                    })
                }
                disabled={
                  creatingInstitutionalEvent
                }
                className="h-5 w-5 accent-cyan-700"
              />

              <span className="text-sm font-bold text-slate-700">
                É dia letivo
              </span>
            </label>

            <label className="flex min-h-14 items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
              <input
                type="checkbox"
                checked={
                  form.countsAsSchoolDay
                }
                onChange={
                  currentEvent =>
                    updateForm({
                      countsAsSchoolDay:
                        currentEvent
                          .target
                          .checked,
                    })
                }
                disabled={
                  creatingInstitutionalEvent
                }
                className="h-5 w-5 accent-cyan-700"
              />

              <span className="text-sm font-bold text-slate-700">
                Conta como dia escolar
              </span>
            </label>

            <label className="flex min-h-14 items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
              <input
                type="checkbox"
                checked={
                  form.isMandatory
                }
                onChange={
                  currentEvent =>
                    updateForm({
                      isMandatory:
                        currentEvent
                          .target
                          .checked,
                    })
                }
                disabled={
                  creatingInstitutionalEvent
                }
                className="h-5 w-5 accent-cyan-700"
              />

              <span className="text-sm font-bold text-slate-700">
                Obrigatório
              </span>
            </label>
          </div>

          {!form.allDay ? (
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-bold text-slate-700">
                  Horário inicial
                </span>

                <input
                  type="time"
                  required
                  value={
                    form.startTime
                  }
                  onChange={
                    currentEvent =>
                      updateForm({
                        startTime:
                          currentEvent
                            .target
                            .value,
                      })
                  }
                  disabled={
                    creatingInstitutionalEvent
                  }
                  className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </label>

              <label className="block">
                <span className="text-sm font-bold text-slate-700">
                  Horário final
                </span>

                <input
                  type="time"
                  value={
                    form.endTime
                  }
                  onChange={
                    currentEvent =>
                      updateForm({
                        endTime:
                          currentEvent
                            .target
                            .value,
                      })
                  }
                  disabled={
                    creatingInstitutionalEvent
                  }
                  className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </label>
            </div>
          ) : null}

          <div className="mt-5 rounded-xl border border-cyan-200 bg-white p-4 text-sm leading-6 text-slate-600">
            O evento será criado como <strong>rascunho</strong>. As datas devem permanecer entre {formatDate(
              schoolYearStartDate,
            )} e {formatDate(
              schoolYearEndDate,
            )}.
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              disabled={
                creatingInstitutionalEvent
              }
              className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-[#071827] px-6 py-3 text-sm font-bold text-white transition hover:bg-cyan-900 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {creatingInstitutionalEvent
                ? 'Criando evento...'
                : 'Criar evento'}
            </button>

            <button
              type="button"
              onClick={() => {
                setShowCreateForm(
                  false,
                )

                resetForm()
              }}
              disabled={
                creatingInstitutionalEvent
              }
              className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-700 transition hover:border-cyan-500 hover:bg-cyan-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : null}

      <div className="p-5 sm:p-6">
        <div className="mb-5 flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
              Eventos registrados
            </p>

            <p className="mt-1 text-2xl font-bold text-[#071827]">
              {visibleEvents.length}
            </p>
          </div>

          <p className="text-sm font-semibold text-slate-600">
            Ano de referência {calendarYear}
          </p>
        </div>

        {loadingInstitutionalEvents ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm font-semibold text-slate-600">
            Carregando eventos institucionais...
          </div>
        ) : visibleEvents.length ===
          0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
            <p className="font-bold text-[#071827]">
              Nenhum evento institucional cadastrado
            </p>

            <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Cadastre férias, recessos, feriados e outras datas que afetam o calendário da unidade.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {visibleEvents.map(
              event => (
                <InstitutionalEventCard
                  key={
                    event.id
                  }
                  event={
                    event
                  }
                />
              ),
            )}
          </div>
        )}
      </div>
    </section>
  )
}