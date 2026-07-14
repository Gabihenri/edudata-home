'use client'

import {
  type FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'

import { AgendaPageShell } from '@/components/agenda/AgendaPageShell'

type ScheduleMode = 'pontual' | 'recorrente'

type AgendaEvent = {
  id: string
  title: string
  description: string | null
  event_type: string
  start_at: string
  end_at: string | null
  status: string
  priority: string
  schedule_mode: ScheduleMode | 'modelo'
  recurrence_frequency: 'none' | 'weekly'
  recurrence_interval: number
  recurrence_until: string | null
  series_id: string | null
  week_reference: string | null
}

type EventsApiResponse = {
  success: boolean
  total?: number
  message?: string
  data?: AgendaEvent[]
  error?: string
}

type EventFormData = {
  title: string
  description: string
  eventType: string
  priority: string
  startAt: string
  endAt: string
  scheduleMode: ScheduleMode
  recurrenceInterval: string
  recurrenceUntil: string
}

const TIMEZONE = 'America/Sao_Paulo'

const timePresets = [
  {
    label: 'Escolher manualmente',
    value: 'custom',
  },
  {
    label: '07h00 às 07h50',
    value: '07:00|07:50',
  },
  {
    label: '13h00 às 13h50',
    value: '13:00|13:50',
  },
  {
    label: '14h20 às 15h10',
    value: '14:20|15:10',
  },
  {
    label: '15h10 às 16h00',
    value: '15:10|16:00',
  },
  {
    label: '18h50 às 19h40',
    value: '18:50|19:40',
  },
  {
    label: '19h40 às 20h30',
    value: '19:40|20:30',
  },
]

function padNumber(value: number): string {
  return String(value).padStart(2, '0')
}

function formatDateInput(date: Date): string {
  return [
    date.getFullYear(),
    padNumber(date.getMonth() + 1),
    padNumber(date.getDate()),
  ].join('-')
}

function parseDateInput(value: string): Date {
  const [year, month, day] = value
    .split('-')
    .map(Number)

  return new Date(
    year,
    month - 1,
    day,
    12,
    0,
    0,
    0,
  )
}

function addDays(
  date: Date,
  numberOfDays: number,
): Date {
  const result = new Date(date)

  result.setDate(
    result.getDate() + numberOfDays,
  )

  return result
}

function addWeeksToDateInput(
  dateInput: string,
  weeks: number,
): string {
  return formatDateInput(
    addDays(
      parseDateInput(dateInput),
      weeks * 7,
    ),
  )
}

function getWeekReference(
  date: Date,
): string {
  const result = new Date(date)

  result.setHours(12, 0, 0, 0)

  const weekday =
    result.getDay() === 0
      ? 7
      : result.getDay()

  result.setDate(
    result.getDate() - weekday + 1,
  )

  return formatDateInput(result)
}

function formatWeekLabel(
  weekReference: string,
): string {
  const startDate =
    parseDateInput(weekReference)

  const endDate =
    addDays(startDate, 6)

  const formatter =
    new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })

  return `${formatter.format(
    startDate,
  )} a ${formatter.format(endDate)}`
}

function formatEventDateTime(
  value: string,
): string {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Data não informada'
  }

  return new Intl.DateTimeFormat(
    'pt-BR',
    {
      timeZone: TIMEZONE,
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    },
  ).format(date)
}

function getEventTypeLabel(
  value: string,
): string {
  const labels: Record<string, string> = {
    pedagogico: 'Pedagógico',
    aula: 'Aula',
    reuniao: 'Reunião',
    formacao: 'Formação',
    avaliacao: 'Avaliação',
    prazo: 'Prazo',
    acompanhamento: 'Acompanhamento',
    outro: 'Outro',
  }

  return labels[value] ?? value
}

function getPriorityLabel(
  value: string,
): string {
  const labels: Record<string, string> = {
    baixa: 'Baixa',
    media: 'Média',
    alta: 'Alta',
    urgente: 'Urgente',
  }

  return labels[value] ?? value
}

function createInitialForm(
  weekReference: string,
  scheduleMode: ScheduleMode,
): EventFormData {
  return {
    title: '',
    description: '',
    eventType: 'pedagogico',
    priority: 'media',
    startAt: `${weekReference}T14:20`,
    endAt: `${weekReference}T15:10`,
    scheduleMode,
    recurrenceInterval: '1',
    recurrenceUntil:
      addWeeksToDateInput(
        weekReference,
        8,
      ),
  }
}

export default function AgendaCalendarPage() {
  const formSectionRef =
    useRef<HTMLDivElement | null>(null)

  const eventsSectionRef =
    useRef<HTMLDivElement | null>(null)

  const [selectedWeek, setSelectedWeek] =
    useState(() =>
      getWeekReference(new Date()),
    )

  const [events, setEvents] =
    useState<AgendaEvent[]>([])

  const [formData, setFormData] =
    useState<EventFormData>(() =>
      createInitialForm(
        getWeekReference(new Date()),
        'pontual',
      ),
    )

  const [selectedPreset, setSelectedPreset] =
    useState('14:20|15:10')

  const [showForm, setShowForm] =
    useState(false)

  const [isLoading, setIsLoading] =
    useState(true)

  const [isSaving, setIsSaving] =
    useState(false)

  const [errorMessage, setErrorMessage] =
    useState('')

  const [
    successMessage,
    setSuccessMessage,
  ] = useState('')

  const loadEvents = useCallback(
    async () => {
      setIsLoading(true)
      setErrorMessage('')

      try {
        const response = await fetch(
          `/api/agenda/events?weekReference=${encodeURIComponent(
            selectedWeek,
          )}`,
          {
            method: 'GET',
            credentials: 'include',
            cache: 'no-store',
          },
        )

        const result =
          (await response.json()) as EventsApiResponse

        if (
          !response.ok ||
          !result.success
        ) {
          throw new Error(
            result.error ??
              'Não foi possível carregar a semana.',
          )
        }

        setEvents(result.data ?? [])
      } catch (error) {
        setEvents([])

        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Não foi possível carregar os eventos.',
        )
      } finally {
        setIsLoading(false)
      }
    },
    [selectedWeek],
  )

  useEffect(() => {
    void loadEvents()
  }, [loadEvents])

  function updateFormField(
    field: keyof EventFormData,
    value: string,
  ) {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function selectWeek(
    weekReference: string,
  ) {
    setSelectedWeek(weekReference)
    setErrorMessage('')
    setSuccessMessage('')
  }

  function selectCurrentWeek() {
    selectWeek(
      getWeekReference(new Date()),
    )
  }

  function selectNextWeek() {
    selectWeek(
      addWeeksToDateInput(
        getWeekReference(new Date()),
        1,
      ),
    )
  }

  function moveWeek(direction: number) {
    selectWeek(
      addWeeksToDateInput(
        selectedWeek,
        direction,
      ),
    )
  }

  function openEventForm(
    scheduleMode: ScheduleMode,
  ) {
    setFormData(
      createInitialForm(
        selectedWeek,
        scheduleMode,
      ),
    )

    setSelectedPreset(
      '14:20|15:10',
    )

    setErrorMessage('')
    setSuccessMessage('')
    setShowForm(true)

    window.setTimeout(() => {
      formSectionRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }, 50)
  }

  function applyTimePreset(
    value: string,
  ) {
    setSelectedPreset(value)

    if (value === 'custom') {
      return
    }

    const [startTime, endTime] =
      value.split('|')

    const selectedDate =
      formData.startAt.slice(0, 10) ||
      selectedWeek

    setFormData((current) => ({
      ...current,
      startAt: `${selectedDate}T${startTime}`,
      endAt: `${selectedDate}T${endTime}`,
    }))
  }

  async function handleCreateEvent(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    setErrorMessage('')
    setSuccessMessage('')

    if (!formData.title.trim()) {
      setErrorMessage(
        'Informe o título do evento.',
      )

      return
    }

    if (!formData.startAt) {
      setErrorMessage(
        'Informe a data e o horário inicial.',
      )

      return
    }

    const startDate =
      new Date(formData.startAt)

    const endDate =
      formData.endAt
        ? new Date(formData.endAt)
        : null

    if (
      Number.isNaN(startDate.getTime())
    ) {
      setErrorMessage(
        'A data inicial é inválida.',
      )

      return
    }

    if (
      endDate &&
      Number.isNaN(endDate.getTime())
    ) {
      setErrorMessage(
        'A data final é inválida.',
      )

      return
    }

    if (
      endDate &&
      endDate.getTime() <=
        startDate.getTime()
    ) {
      setErrorMessage(
        'O término precisa ser posterior ao início.',
      )

      return
    }

    if (
      formData.scheduleMode ===
        'recorrente' &&
      !formData.recurrenceUntil
    ) {
      setErrorMessage(
        'Informe até quando o horário deverá se repetir.',
      )

      return
    }

    if (
      formData.scheduleMode ===
        'recorrente' &&
      formData.recurrenceUntil <
        formData.startAt.slice(0, 10)
    ) {
      setErrorMessage(
        'A repetição não pode terminar antes do primeiro evento.',
      )

      return
    }

    setIsSaving(true)

    try {
      const response = await fetch(
        '/api/agenda/events',
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            title:
              formData.title.trim(),

            description:
              formData.description.trim() ||
              null,

            eventType:
              formData.eventType,

            priority:
              formData.priority,

            startAt:
              startDate.toISOString(),

            endAt:
              endDate
                ? endDate.toISOString()
                : null,

            status: 'planejado',

            scheduleMode:
              formData.scheduleMode,

            recurrenceFrequency:
              formData.scheduleMode ===
              'recorrente'
                ? 'weekly'
                : 'none',

            recurrenceInterval:
              formData.scheduleMode ===
              'recorrente'
                ? Number(
                    formData.recurrenceInterval,
                  )
                : 1,

            recurrenceUntil:
              formData.scheduleMode ===
              'recorrente'
                ? formData.recurrenceUntil
                : null,
          }),
        },
      )

      const result =
        (await response.json()) as EventsApiResponse

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.error ??
            'Não foi possível salvar o evento.',
        )
      }

      setSuccessMessage(
        result.message ??
          'Evento salvo com sucesso.',
      )

      setShowForm(false)

      const eventWeek =
        getWeekReference(startDate)

      setSelectedWeek(eventWeek)

      window.setTimeout(() => {
        eventsSectionRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
      }, 100)

      if (eventWeek === selectedWeek) {
        await loadEvents()
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Não foi possível salvar o evento.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <AgendaPageShell
      eyebrow="Agenda Inteligente EDI"
      title="Calendário pedagógico"
      description="Planeje a semana atual ou prepare antecipadamente as ações da próxima semana."
    >
      <div className="grid gap-6">
        <section className="rounded-3xl border border-slate-200 bg-slate-50 p-5 sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-700">
                Semana em planejamento
              </p>

              <h2 className="mt-2 text-2xl font-bold text-[#081C2E]">
                {formatWeekLabel(
                  selectedWeek,
                )}
              </h2>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:flex">
              <button
                type="button"
                onClick={selectCurrentWeek}
                className="inline-flex min-h-[50px] items-center justify-center rounded-full border-2 border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-[#6B21A8] hover:text-[#6B21A8]"
              >
                Semana atual
              </button>

              <button
                type="button"
                onClick={selectNextWeek}
                className="inline-flex min-h-[50px] items-center justify-center rounded-full bg-[#6B21A8] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#581C87]"
              >
                Planejar próxima semana
              </button>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-[52px_1fr_52px] gap-3">
            <button
              type="button"
              onClick={() => moveWeek(-1)}
              aria-label="Semana anterior"
              className="inline-flex min-h-[52px] items-center justify-center rounded-2xl border border-slate-300 bg-white text-xl font-bold text-slate-700 transition hover:bg-slate-100"
            >
              ←
            </button>

            <input
              type="date"
              value={selectedWeek}
              onChange={(event) =>
                selectWeek(
                  getWeekReference(
                    parseDateInput(
                      event.target.value,
                    ),
                  ),
                )
              }
              aria-label="Selecionar semana"
              className="min-h-[52px] w-full rounded-2xl border border-slate-300 bg-white px-4 font-semibold text-slate-700 outline-none transition focus:border-[#6B21A8] focus:ring-2 focus:ring-purple-200"
            />

            <button
              type="button"
              onClick={() => moveWeek(1)}
              aria-label="Próxima semana"
              className="inline-flex min-h-[52px] items-center justify-center rounded-2xl border border-slate-300 bg-white text-xl font-bold text-slate-700 transition hover:bg-slate-100"
            >
              →
            </button>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <button
            type="button"
            onClick={() =>
              openEventForm('pontual')
            }
            className="rounded-3xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-purple-300 hover:shadow-md"
          >
            <span className="inline-flex rounded-full bg-purple-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-[#6B21A8]">
              Pontual
            </span>

            <h2 className="mt-4 text-xl font-bold text-[#081C2E]">
              Novo evento
            </h2>

            <p className="mt-2 leading-7 text-slate-600">
              Registre uma ação específica apenas nesta semana.
            </p>
          </button>

          <button
            type="button"
            onClick={() =>
              openEventForm('recorrente')
            }
            className="rounded-3xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-purple-300 hover:shadow-md"
          >
            <span className="inline-flex rounded-full bg-cyan-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-cyan-800">
              Semanal
            </span>

            <h2 className="mt-4 text-xl font-bold text-[#081C2E]">
              Guardar este horário
            </h2>

            <p className="mt-2 leading-7 text-slate-600">
              Repita o compromisso no mesmo dia e horário pelas próximas semanas.
            </p>
          </button>

          <button
            type="button"
            onClick={() => {
              selectNextWeek()

              window.setTimeout(() => {
                eventsSectionRef.current?.scrollIntoView({
                  behavior: 'smooth',
                  block: 'start',
                })
              }, 100)
            }}
            className="rounded-3xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-purple-300 hover:shadow-md"
          >
            <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-emerald-800">
              Antecipado
            </span>

            <h2 className="mt-4 text-xl font-bold text-[#081C2E]">
              Próxima semana
            </h2>

            <p className="mt-2 leading-7 text-slate-600">
              Prepare antecipadamente as ações pedagógicas da semana seguinte.
            </p>
          </button>
        </section>

        {successMessage ? (
          <div
            role="status"
            className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 leading-7 text-emerald-800"
          >
            {successMessage}
          </div>
        ) : null}

        {errorMessage && !showForm ? (
          <div
            role="alert"
            className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 leading-7 text-red-700"
          >
            {errorMessage}
          </div>
        ) : null}

        <section
          ref={eventsSectionRef}
          className="scroll-mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-700">
                Agenda da semana
              </p>

              <h2 className="mt-2 text-2xl font-bold text-[#081C2E]">
                Compromissos registrados
              </h2>
            </div>

            <button
              type="button"
              onClick={() =>
                void loadEvents()
              }
              disabled={isLoading}
              className="inline-flex min-h-[50px] items-center justify-center rounded-full border-2 border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading
                ? 'Atualizando...'
                : 'Atualizar agenda'}
            </button>
          </div>

          {isLoading ? (
            <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-600">
              Carregando a semana...
            </div>
          ) : events.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <h3 className="text-xl font-bold text-[#081C2E]">
                Semana ainda sem eventos
              </h3>

              <p className="mt-3 leading-7 text-slate-600">
                Adicione uma ação pontual ou guarde um horário para as próximas semanas.
              </p>

              <button
                type="button"
                onClick={() =>
                  openEventForm('pontual')
                }
                className="mt-6 inline-flex min-h-[52px] items-center justify-center rounded-full bg-[#6B21A8] px-7 py-3 font-semibold text-white transition hover:bg-[#581C87]"
              >
                Adicionar primeiro evento
              </button>
            </div>
          ) : (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {events.map((agendaEvent) => (
                <article
                  key={agendaEvent.id}
                  className="rounded-3xl border border-slate-200 bg-slate-50 p-6"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-cyan-800">
                      {getEventTypeLabel(
                        agendaEvent.event_type,
                      )}
                    </span>

                    {agendaEvent.schedule_mode ===
                    'recorrente' ? (
                      <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-[#6B21A8]">
                        Semanal
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-slate-700">
                        Pontual
                      </span>
                    )}
                  </div>

                  <h3 className="mt-5 text-xl font-bold text-[#081C2E]">
                    {agendaEvent.title}
                  </h3>

                  {agendaEvent.description ? (
                    <p className="mt-3 leading-7 text-slate-600">
                      {agendaEvent.description}
                    </p>
                  ) : null}

                  <dl className="mt-5 space-y-3 text-sm text-slate-600">
                    <div>
                      <dt className="font-bold text-slate-800">
                        Início
                      </dt>

                      <dd className="mt-1">
                        {formatEventDateTime(
                          agendaEvent.start_at,
                        )}
                      </dd>
                    </div>

                    {agendaEvent.end_at ? (
                      <div>
                        <dt className="font-bold text-slate-800">
                          Término
                        </dt>

                        <dd className="mt-1">
                          {formatEventDateTime(
                            agendaEvent.end_at,
                          )}
                        </dd>
                      </div>
                    ) : null}

                    <div>
                      <dt className="font-bold text-slate-800">
                        Prioridade
                      </dt>

                      <dd className="mt-1">
                        {getPriorityLabel(
                          agendaEvent.priority,
                        )}
                      </dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          )}
        </section>

        {showForm ? (
          <section
            ref={formSectionRef}
            className="scroll-mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#6B21A8]">
                  {formData.scheduleMode ===
                  'recorrente'
                    ? 'Horário semanal'
                    : 'Evento pontual'}
                </p>

                <h2 className="mt-2 text-3xl font-bold text-[#081C2E]">
                  {formData.scheduleMode ===
                  'recorrente'
                    ? 'Guardar horário'
                    : 'Novo evento'}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setErrorMessage('')
                }}
                className="inline-flex min-h-[46px] items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Fechar
              </button>
            </div>

            <form
              onSubmit={handleCreateEvent}
              className="mt-8 grid gap-6"
            >
              <div>
                <label
                  htmlFor="event-title"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Título
                </label>

                <input
                  id="event-title"
                  type="text"
                  required
                  value={formData.title}
                  onChange={(event) =>
                    updateFormField(
                      'title',
                      event.target.value,
                    )
                  }
                  placeholder="Ex.: Planejamento semanal"
                  className="min-h-[54px] w-full rounded-2xl border border-slate-300 bg-white px-4 text-slate-900 outline-none transition focus:border-[#6B21A8] focus:ring-2 focus:ring-purple-200"
                />
              </div>

              <div>
                <label
                  htmlFor="event-description"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Descrição
                </label>

                <textarea
                  id="event-description"
                  rows={4}
                  value={formData.description}
                  onChange={(event) =>
                    updateFormField(
                      'description',
                      event.target.value,
                    )
                  }
                  placeholder="Descreva a ação pedagógica."
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-4 text-slate-900 outline-none transition focus:border-[#6B21A8] focus:ring-2 focus:ring-purple-200"
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="event-type"
                    className="mb-2 block text-sm font-bold text-slate-700"
                  >
                    Tipo de evento
                  </label>

                  <select
                    id="event-type"
                    value={formData.eventType}
                    onChange={(event) =>
                      updateFormField(
                        'eventType',
                        event.target.value,
                      )
                    }
                    className="min-h-[54px] w-full rounded-2xl border border-slate-300 bg-white px-4 text-slate-900 outline-none transition focus:border-[#6B21A8] focus:ring-2 focus:ring-purple-200"
                  >
                    <option value="pedagogico">
                      Pedagógico
                    </option>

                    <option value="aula">
                      Aula
                    </option>

                    <option value="reuniao">
                      Reunião
                    </option>

                    <option value="formacao">
                      Formação
                    </option>

                    <option value="avaliacao">
                      Avaliação
                    </option>

                    <option value="prazo">
                      Prazo
                    </option>

                    <option value="acompanhamento">
                      Acompanhamento
                    </option>

                    <option value="outro">
                      Outro
                    </option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="event-priority"
                    className="mb-2 block text-sm font-bold text-slate-700"
                  >
                    Prioridade
                  </label>

                  <select
                    id="event-priority"
                    value={formData.priority}
                    onChange={(event) =>
                      updateFormField(
                        'priority',
                        event.target.value,
                      )
                    }
                    className="min-h-[54px] w-full rounded-2xl border border-slate-300 bg-white px-4 text-slate-900 outline-none transition focus:border-[#6B21A8] focus:ring-2 focus:ring-purple-200"
                  >
                    <option value="baixa">
                      Baixa
                    </option>

                    <option value="media">
                      Média
                    </option>

                    <option value="alta">
                      Alta
                    </option>

                    <option value="urgente">
                      Urgente
                    </option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="time-preset"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Horário pré-programado
                </label>

                <select
                  id="time-preset"
                  value={selectedPreset}
                  onChange={(event) =>
                    applyTimePreset(
                      event.target.value,
                    )
                  }
                  className="min-h-[54px] w-full rounded-2xl border border-slate-300 bg-white px-4 text-slate-900 outline-none transition focus:border-[#6B21A8] focus:ring-2 focus:ring-purple-200"
                >
                  {timePresets.map(
                    (preset) => (
                      <option
                        key={preset.value}
                        value={preset.value}
                      >
                        {preset.label}
                      </option>
                    ),
                  )}
                </select>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="event-start"
                    className="mb-2 block text-sm font-bold text-slate-700"
                  >
                    Início
                  </label>

                  <input
                    id="event-start"
                    type="datetime-local"
                    required
                    value={formData.startAt}
                    onChange={(event) => {
                      updateFormField(
                        'startAt',
                        event.target.value,
                      )

                      setSelectedPreset(
                        'custom',
                      )
                    }}
                    className="min-h-[54px] w-full rounded-2xl border border-slate-300 bg-white px-4 text-slate-900 outline-none transition focus:border-[#6B21A8] focus:ring-2 focus:ring-purple-200"
                  />
                </div>

                <div>
                  <label
                    htmlFor="event-end"
                    className="mb-2 block text-sm font-bold text-slate-700"
                  >
                    Término
                  </label>

                  <input
                    id="event-end"
                    type="datetime-local"
                    value={formData.endAt}
                    min={
                      formData.startAt ||
                      undefined
                    }
                    onChange={(event) => {
                      updateFormField(
                        'endAt',
                        event.target.value,
                      )

                      setSelectedPreset(
                        'custom',
                      )
                    }}
                    className="min-h-[54px] w-full rounded-2xl border border-slate-300 bg-white px-4 text-slate-900 outline-none transition focus:border-[#6B21A8] focus:ring-2 focus:ring-purple-200"
                  />
                </div>
              </div>

              <fieldset>
                <legend className="text-sm font-bold text-slate-700">
                  Tipo de agendamento
                </legend>

                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <label
                    className={[
                      'cursor-pointer rounded-3xl border-2 p-5 transition',
                      formData.scheduleMode ===
                      'pontual'
                        ? 'border-[#6B21A8] bg-purple-50'
                        : 'border-slate-200 bg-white hover:border-slate-300',
                    ].join(' ')}
                  >
                    <input
                      type="radio"
                      name="schedule-mode"
                      value="pontual"
                      checked={
                        formData.scheduleMode ===
                        'pontual'
                      }
                      onChange={() =>
                        updateFormField(
                          'scheduleMode',
                          'pontual',
                        )
                      }
                      className="mr-3"
                    />

                    <span className="font-bold text-[#081C2E]">
                      Apenas uma vez
                    </span>

                    <span className="mt-2 block leading-7 text-slate-600">
                      O compromisso ocorrerá somente na data selecionada.
                    </span>
                  </label>

                  <label
                    className={[
                      'cursor-pointer rounded-3xl border-2 p-5 transition',
                      formData.scheduleMode ===
                      'recorrente'
                        ? 'border-[#6B21A8] bg-purple-50'
                        : 'border-slate-200 bg-white hover:border-slate-300',
                    ].join(' ')}
                  >
                    <input
                      type="radio"
                      name="schedule-mode"
                      value="recorrente"
                      checked={
                        formData.scheduleMode ===
                        'recorrente'
                      }
                      onChange={() =>
                        updateFormField(
                          'scheduleMode',
                          'recorrente',
                        )
                      }
                      className="mr-3"
                    />

                    <span className="font-bold text-[#081C2E]">
                      Repetir nas próximas semanas
                    </span>

                    <span className="mt-2 block leading-7 text-slate-600">
                      Guarda o mesmo dia e horário pelo período escolhido.
                    </span>
                  </label>
                </div>
              </fieldset>

              {formData.scheduleMode ===
              'recorrente' ? (
                <div className="grid gap-5 rounded-3xl border border-purple-200 bg-purple-50 p-5 md:grid-cols-2">
                  <div>
                    <label
                      htmlFor="recurrence-interval"
                      className="mb-2 block text-sm font-bold text-slate-700"
                    >
                      Frequência
                    </label>

                    <select
                      id="recurrence-interval"
                      value={
                        formData.recurrenceInterval
                      }
                      onChange={(event) =>
                        updateFormField(
                          'recurrenceInterval',
                          event.target.value,
                        )
                      }
                      className="min-h-[54px] w-full rounded-2xl border border-purple-200 bg-white px-4 text-slate-900 outline-none transition focus:border-[#6B21A8] focus:ring-2 focus:ring-purple-200"
                    >
                      <option value="1">
                        Toda semana
                      </option>

                      <option value="2">
                        A cada duas semanas
                      </option>

                      <option value="3">
                        A cada três semanas
                      </option>

                      <option value="4">
                        A cada quatro semanas
                      </option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="recurrence-until"
                      className="mb-2 block text-sm font-bold text-slate-700"
                    >
                      Repetir até
                    </label>

                    <input
                      id="recurrence-until"
                      type="date"
                      required
                      min={
                        formData.startAt.slice(
                          0,
                          10,
                        ) || undefined
                      }
                      value={
                        formData.recurrenceUntil
                      }
                      onChange={(event) =>
                        updateFormField(
                          'recurrenceUntil',
                          event.target.value,
                        )
                      }
                      className="min-h-[54px] w-full rounded-2xl border border-purple-200 bg-white px-4 text-slate-900 outline-none transition focus:border-[#6B21A8] focus:ring-2 focus:ring-purple-200"
                    />
                  </div>
                </div>
              ) : null}

              {errorMessage ? (
                <div
                  role="alert"
                  className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 leading-7 text-red-700"
                >
                  {errorMessage}
                </div>
              ) : null}

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex min-h-[56px] items-center justify-center rounded-full bg-[#6B21A8] px-7 py-4 font-semibold text-white transition hover:bg-[#581C87] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving
                    ? 'Salvando...'
                    : formData.scheduleMode ===
                        'recorrente'
                      ? 'Guardar horário semanal'
                      : 'Salvar evento pontual'}
                </button>

                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() =>
                    setFormData(
                      createInitialForm(
                        selectedWeek,
                        formData.scheduleMode,
                      ),
                    )
                  }
                  className="inline-flex min-h-[56px] items-center justify-center rounded-full border-2 border-slate-300 bg-white px-7 py-4 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Limpar campos
                </button>
              </div>
            </form>
          </section>
        ) : null}
      </div>
    </AgendaPageShell>
  )
}