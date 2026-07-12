'use client'

import { FormEvent, useState } from 'react'

import { useEvents } from '@/lib/agenda/hooks/useEvents'

type EventFormState = {
  title: string
  description: string
  eventType: string
  startAt: string
  endAt: string
  priority: string
}

const initialForm: EventFormState = {
  title: '',
  description: '',
  eventType: 'pedagogico',
  startAt: '',
  endAt: '',
  priority: 'media',
}

export function AgendaCalendar() {
  const {
    events,
    loading,
    error,
    reload,
    createEvent,
  } = useEvents()

  const [form, setForm] = useState<EventFormState>(initialForm)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(
    null,
  )

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault()

    setSubmitting(true)
    setFormError(null)
    setSuccessMessage(null)

    try {
      await createEvent({
        title: form.title,
        description: form.description || null,
        event_type: form.eventType,
        start_at: new Date(form.startAt).toISOString(),
        end_at: form.endAt
          ? new Date(form.endAt).toISOString()
          : null,
        status: 'planejado',
        priority: form.priority,
      })

      setForm(initialForm)
      setSuccessMessage('Evento criado com sucesso.')
    } catch (createError) {
      setFormError(
        createError instanceof Error
          ? createError.message
          : 'Não foi possível criar o evento.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#5C1A8C]">
          Agenda Inteligente EDI
        </p>

        <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-950 md:text-6xl">
          Calendário pedagógico
        </h1>

        <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">
          Organize aulas, reuniões, formações, prazos e ações pedagógicas
          utilizando dados reais da Agenda Inteligente EDI.
        </p>

        <div className="mt-12 grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <form
            onSubmit={handleSubmit}
            className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm"
          >
            <h2 className="text-2xl font-bold text-slate-950">
              Novo evento
            </h2>

            <div className="mt-6 space-y-5">
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
                  value={form.title}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-[#5C1A8C] focus:ring-2 focus:ring-[#5C1A8C]/20"
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
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-[#5C1A8C] focus:ring-2 focus:ring-[#5C1A8C]/20"
                />
              </div>

              <div>
                <label
                  htmlFor="event-type"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Tipo
                </label>

                <select
                  id="event-type"
                  value={form.eventType}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      eventType: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-[#5C1A8C] focus:ring-2 focus:ring-[#5C1A8C]/20"
                >
                  <option value="pedagogico">Pedagógico</option>
                  <option value="aula">Aula</option>
                  <option value="reuniao">Reunião</option>
                  <option value="formacao">Formação</option>
                  <option value="prazo">Prazo</option>
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
                  value={form.priority}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      priority: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-[#5C1A8C] focus:ring-2 focus:ring-[#5C1A8C]/20"
                >
                  <option value="baixa">Baixa</option>
                  <option value="media">Média</option>
                  <option value="alta">Alta</option>
                </select>
              </div>

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
                  value={form.startAt}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      startAt: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-[#5C1A8C] focus:ring-2 focus:ring-[#5C1A8C]/20"
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
                  value={form.endAt}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      endAt: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-[#5C1A8C] focus:ring-2 focus:ring-[#5C1A8C]/20"
                />
              </div>
            </div>

            {formError ? (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                {formError}
              </div>
            ) : null}

            {successMessage ? (
              <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
                {successMessage}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="mt-6 w-full rounded-full bg-[#5C1A8C] px-6 py-4 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Salvando...' : 'Criar evento'}
            </button>
          </form>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-2xl font-bold text-slate-950">
                Eventos cadastrados
              </h2>

              <button
                type="button"
                onClick={() => void reload()}
                className="rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Atualizar
              </button>
            </div>

            {loading ? (
              <p className="mt-8 text-slate-600">
                Carregando eventos...
              </p>
            ) : null}

            {error ? (
              <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
                {error}
              </div>
            ) : null}

            {!loading && !error && events.length === 0 ? (
              <p className="mt-8 text-slate-500">
                Nenhum evento cadastrado.
              </p>
            ) : null}

            <div className="mt-8 space-y-5">
              {events.map((agendaEvent) => (
                <article
                  key={agendaEvent.id}
                  className="rounded-3xl border border-slate-200 bg-[#F5F6F8] p-6"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#5C1A8C]">
                        {agendaEvent.event_type}
                      </p>

                      <h3 className="mt-3 text-xl font-bold text-slate-950">
                        {agendaEvent.title}
                      </h3>
                    </div>

                    <span className="rounded-full bg-[#081C2E] px-4 py-2 text-xs font-bold uppercase text-white">
                      {agendaEvent.priority}
                    </span>
                  </div>

                  {agendaEvent.description ? (
                    <p className="mt-4 leading-7 text-slate-600">
                      {agendaEvent.description}
                    </p>
                  ) : null}

                  <div className="mt-5 grid gap-3 text-sm text-slate-600 md:grid-cols-2">
                    <p>
                      <strong>Início:</strong>{' '}
                      {new Date(
                        agendaEvent.start_at,
                      ).toLocaleString('pt-BR')}
                    </p>

                    <p>
                      <strong>Término:</strong>{' '}
                      {agendaEvent.end_at
                        ? new Date(
                            agendaEvent.end_at,
                          ).toLocaleString('pt-BR')
                        : 'Não informado'}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}