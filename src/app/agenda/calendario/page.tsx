'use client'

import {
  FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'

import { AgendaPageShell } from '@/components/agenda/AgendaPageShell'

type AgendaEvent = {
  id: string
  title: string
  description: string | null
  event_type: string
  start_at: string
  end_at: string | null
  status: string
  priority: string
}

type EventsApiResponse = {
  success: boolean
  data?: AgendaEvent[]
  error?: string
}

type SessionApiResponse = {
  success: boolean
  authenticated: boolean
  user: {
    id: string
    email?: string
    name?: string
  } | null
  error?: string
}

type EventFormData = {
  title: string
  description: string
  eventType: string
  startAt: string
  endAt: string
  priority: string
}

const initialFormData: EventFormData = {
  title: '',
  description: '',
  eventType: 'pedagogico',
  startAt: '',
  endAt: '',
  priority: 'media',
}

function formatDateTime(value: string): string {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Data não informada'
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}

function getPriorityLabel(priority: string): string {
  const labels: Record<string, string> = {
    baixa: 'Baixa',
    media: 'Média',
    alta: 'Alta',
    urgente: 'Urgente',
  }

  return labels[priority] ?? priority
}

function getEventTypeLabel(eventType: string): string {
  const labels: Record<string, string> = {
    pedagogico: 'Pedagógico',
    aula: 'Aula',
    reuniao: 'Reunião',
    formacao: 'Formação',
    avaliacao: 'Avaliação',
    prazo: 'Prazo',
    outro: 'Outro',
  }

  return labels[eventType] ?? eventType
}

export default function AgendaCalendarPage() {
  const formSectionRef =
    useRef<HTMLDivElement | null>(null)

  const eventsSectionRef =
    useRef<HTMLDivElement | null>(null)

  const [userId, setUserId] = useState('')
  const [events, setEvents] = useState<AgendaEvent[]>([])
  const [formData, setFormData] =
    useState<EventFormData>(initialFormData)

  const [showForm, setShowForm] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const loadEvents = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage('')

    try {
      const sessionResponse = await fetch(
        '/api/auth/session',
        {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        },
      )

      const sessionResult =
        (await sessionResponse.json()) as SessionApiResponse

      if (
        !sessionResponse.ok ||
        !sessionResult.success ||
        !sessionResult.user
      ) {
        throw new Error(
          sessionResult.error ??
            'Não foi possível identificar o usuário conectado.',
        )
      }

      const currentUserId = sessionResult.user.id

      setUserId(currentUserId)

      const eventsResponse = await fetch(
        `/api/agenda/events?userId=${encodeURIComponent(
          currentUserId,
        )}`,
        {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        },
      )

      const eventsResult =
        (await eventsResponse.json()) as EventsApiResponse

      if (
        !eventsResponse.ok ||
        !eventsResult.success
      ) {
        throw new Error(
          eventsResult.error ??
            'Não foi possível carregar os eventos.',
        )
      }

      setEvents(eventsResult.data ?? [])
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Não foi possível carregar o calendário.',
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadEvents()
  }, [loadEvents])

  function updateField(
    field: keyof EventFormData,
    value: string,
  ) {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function openNewEventForm() {
    setShowForm(true)
    setErrorMessage('')
    setSuccessMessage('')

    window.setTimeout(() => {
      formSectionRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }, 50)
  }

  function scrollToCompleteAgenda() {
    eventsSectionRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
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

    const startDate = new Date(formData.startAt)
    const endDate = formData.endAt
      ? new Date(formData.endAt)
      : null

    if (Number.isNaN(startDate.getTime())) {
      setErrorMessage(
        'A data inicial informada é inválida.',
      )

      return
    }

    if (
      endDate &&
      Number.isNaN(endDate.getTime())
    ) {
      setErrorMessage(
        'A data final informada é inválida.',
      )

      return
    }

    if (
      endDate &&
      endDate.getTime() < startDate.getTime()
    ) {
      setErrorMessage(
        'A data final não pode ser anterior à data inicial.',
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
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: formData.title.trim(),
            description:
              formData.description.trim() || null,
            eventType: formData.eventType,
            startAt: startDate.toISOString(),
            endAt: endDate
              ? endDate.toISOString()
              : null,
            status: 'planejado',
            priority: formData.priority,
            userId,
          }),
        },
      )

      const result =
        (await response.json()) as EventsApiResponse

      if (!response.ok || !result.success) {
        throw new Error(
          result.error ??
            'Não foi possível criar o evento.',
        )
      }

      setFormData(initialFormData)
      setShowForm(false)

      setSuccessMessage(
        'Evento criado e registrado no calendário.',
      )

      await loadEvents()

      window.setTimeout(() => {
        eventsSectionRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
      }, 100)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Não foi possível criar o evento.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <AgendaPageShell
      eyebrow="Agenda Inteligente EDI"
      title="Calendário pedagógico"
      description="Organize aulas, reuniões, formações, prazos e ações pedagógicas utilizando dados reais da Agenda Inteligente EDI."
    >
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section
          ref={eventsSectionRef}
          className="scroll-mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-5 sm:p-8"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-700">
                Agenda completa
              </p>

              <h2 className="mt-2 text-2xl font-bold text-[#081C2E]">
                Eventos registrados
              </h2>
            </div>

            <button
              type="button"
              onClick={() => void loadEvents()}
              disabled={isLoading}
              className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading
                ? 'Atualizando...'
                : 'Atualizar agenda'}
            </button>
          </div>

          {successMessage ? (
            <div
              role="status"
              className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm leading-6 text-emerald-800"
            >
              {successMessage}
            </div>
          ) : null}

          {errorMessage && !showForm ? (
            <div
              role="alert"
              className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm leading-6 text-red-700"
            >
              {errorMessage}
            </div>
          ) : null}

          {isLoading ? (
            <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-600">
              Carregando eventos...
            </div>
          ) : events.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <h3 className="text-xl font-bold text-[#081C2E]">
                Nenhum evento registrado
              </h3>

              <p className="mt-3 leading-7 text-slate-600">
                Utilize o botão Novo evento para iniciar seu calendário.
              </p>

              <button
                type="button"
                onClick={openNewEventForm}
                className="mt-6 inline-flex min-h-[52px] items-center justify-center rounded-full bg-[#6B21A8] px-7 py-3 font-semibold text-white transition hover:bg-[#581C87]"
              >
                Criar primeiro evento
              </button>
            </div>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {events.map((agendaEvent) => (
                <article
                  key={agendaEvent.id}
                  className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-cyan-700">
                      {getEventTypeLabel(
                        agendaEvent.event_type,
                      )}
                    </span>

                    <span className="text-xs font-semibold text-slate-500">
                      Prioridade{' '}
                      {getPriorityLabel(
                        agendaEvent.priority,
                      )}
                    </span>
                  </div>

                  <h3 className="mt-5 text-xl font-bold text-[#081C2E]">
                    {agendaEvent.title}
                  </h3>

                  {agendaEvent.description ? (
                    <p className="mt-3 leading-7 text-slate-600">
                      {agendaEvent.description}
                    </p>
                  ) : null}

                  <dl className="mt-5 space-y-2 text-sm text-slate-600">
                    <div>
                      <dt className="font-semibold text-slate-800">
                        Início
                      </dt>
                      <dd>
                        {formatDateTime(
                          agendaEvent.start_at,
                        )}
                      </dd>
                    </div>

                    {agendaEvent.end_at ? (
                      <div>
                        <dt className="font-semibold text-slate-800">
                          Término
                        </dt>
                        <dd>
                          {formatDateTime(
                            agendaEvent.end_at,
                          )}
                        </dd>
                      </div>
                    ) : null}
                  </dl>
                </article>
              ))}
            </div>
          )}
        </section>

        <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-2xl font-bold text-[#081C2E]">
            Ações rápidas
          </h2>

          <p className="mt-3 leading-7 text-slate-600">
            Crie um compromisso ou consulte todos os eventos registrados.
          </p>

          <div className="mt-6 flex flex-col gap-3">
            <button
              type="button"
              onClick={openNewEventForm}
              className="inline-flex min-h-[56px] w-full cursor-pointer items-center justify-center rounded-full bg-[#6B21A8] px-6 py-4 text-base font-semibold text-white shadow-sm transition hover:bg-[#581C87] active:scale-[0.98]"
            >
              Novo evento
            </button>

            <button
              type="button"
              onClick={scrollToCompleteAgenda}
              className="inline-flex min-h-[56px] w-full cursor-pointer items-center justify-center rounded-full border-2 border-slate-300 bg-white px-6 py-4 text-base font-semibold text-slate-700 transition hover:border-[#6B21A8] hover:bg-purple-50 hover:text-[#6B21A8] active:scale-[0.98]"
            >
              Ver agenda completa
            </button>
          </div>
        </aside>
      </div>

      {showForm ? (
        <div
          ref={formSectionRef}
          className="mt-8 scroll-mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#6B21A8]">
                Novo registro
              </p>

              <h2 className="mt-2 text-3xl font-bold text-[#081C2E]">
                Criar evento
              </h2>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowForm(false)
                setErrorMessage('')
              }}
              className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Fechar
            </button>
          </div>

          <form
            onSubmit={handleCreateEvent}
            className="mt-8 grid gap-5"
          >
            <div>
              <label
                htmlFor="event-title"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Título
              </label>

              <input
                id="event-title"
                type="text"
                required
                value={formData.title}
                onChange={(event) =>
                  updateField(
                    'title',
                    event.target.value,
                  )
                }
                placeholder="Ex.: Reunião pedagógica"
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-4 text-slate-900 outline-none transition focus:border-[#6B21A8] focus:ring-2 focus:ring-purple-200"
              />
            </div>

            <div>
              <label
                htmlFor="event-description"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Descrição
              </label>

              <textarea
                id="event-description"
                rows={4}
                value={formData.description}
                onChange={(event) =>
                  updateField(
                    'description',
                    event.target.value,
                  )
                }
                placeholder="Descreva o compromisso ou a ação pedagógica."
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-4 text-slate-900 outline-none transition focus:border-[#6B21A8] focus:ring-2 focus:ring-purple-200"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="event-type"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Tipo de evento
                </label>

                <select
                  id="event-type"
                  value={formData.eventType}
                  onChange={(event) =>
                    updateField(
                      'eventType',
                      event.target.value,
                    )
                  }
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-4 text-slate-900 outline-none transition focus:border-[#6B21A8] focus:ring-2 focus:ring-purple-200"
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
                  <option value="outro">
                    Outro
                  </option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="event-priority"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Prioridade
                </label>

                <select
                  id="event-priority"
                  value={formData.priority}
                  onChange={(event) =>
                    updateField(
                      'priority',
                      event.target.value,
                    )
                  }
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-4 text-slate-900 outline-none transition focus:border-[#6B21A8] focus:ring-2 focus:ring-purple-200"
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

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="event-start"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Início
                </label>

                <input
                  id="event-start"
                  type="datetime-local"
                  required
                  value={formData.startAt}
                  onChange={(event) =>
                    updateField(
                      'startAt',
                      event.target.value,
                    )
                  }
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-4 text-slate-900 outline-none transition focus:border-[#6B21A8] focus:ring-2 focus:ring-purple-200"
                />
              </div>

              <div>
                <label
                  htmlFor="event-end"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Término
                </label>

                <input
                  id="event-end"
                  type="datetime-local"
                  value={formData.endAt}
                  min={formData.startAt || undefined}
                  onChange={(event) =>
                    updateField(
                      'endAt',
                      event.target.value,
                    )
                  }
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-4 text-slate-900 outline-none transition focus:border-[#6B21A8] focus:ring-2 focus:ring-purple-200"
                />
              </div>
            </div>

            {errorMessage ? (
              <div
                role="alert"
                className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm leading-6 text-red-700"
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
                  : 'Salvar evento'}
              </button>

              <button
                type="button"
                onClick={() =>
                  setFormData(initialFormData)
                }
                disabled={isSaving}
                className="inline-flex min-h-[56px] items-center justify-center rounded-full border-2 border-slate-300 bg-white px-7 py-4 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Limpar campos
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </AgendaPageShell>
  )
}