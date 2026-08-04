'use client'

import {
  type FormEvent,
  useState,
} from 'react'

import {
  useEvents,
} from '@/lib/agenda/hooks/useEvents'

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

const fieldClasses = [
  'w-full',
  'rounded-xl',
  'border',
  'border-border-strong',
  'bg-surface',
  'px-4',
  'py-3.5',
  'text-base',
  'text-content-primary',
  'outline-none',
  'transition',
  'duration-250',
  'placeholder:text-content-subtle',
  'focus:border-brand-secondary',
  'focus:ring-2',
  'focus:ring-brand-secondary/20',
  'disabled:cursor-not-allowed',
  'disabled:bg-surface-muted',
  'disabled:text-content-muted',
].join(' ')

function formatEventType(
  value: string,
): string {
  const labels:
    Record<string, string> = {
      pedagogico:
        'Pedagógico',

      aula:
        'Aula',

      reuniao:
        'Reunião',

      formacao:
        'Formação',

      prazo:
        'Prazo',
    }

  return (
    labels[value] ??
    value
  )
}

function formatPriority(
  value: string,
): string {
  const labels:
    Record<string, string> = {
      baixa:
        'Baixa',

      media:
        'Média',

      alta:
        'Alta',
    }

  return (
    labels[value] ??
    value
  )
}

function getPriorityClasses(
  priority: string,
): string {
  if (
    priority ===
    'alta'
  ) {
    return [
      'border-status-dangerBorder',
      'bg-status-dangerBackground',
      'text-status-danger',
    ].join(' ')
  }

  if (
    priority ===
    'media'
  ) {
    return [
      'border-status-warningBorder',
      'bg-status-warningBackground',
      'text-status-warning',
    ].join(' ')
  }

  return [
    'border-status-successBorder',
    'bg-status-successBackground',
    'text-status-success',
  ].join(' ')
}

function SelectArrow() {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-content-muted"
    >
      <svg
        viewBox="0 0 20 20"
        fill="none"
        className="h-5 w-5"
      >
        <path
          d="m6 8 4 4 4-4"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  )
}

export function AgendaCalendar() {
  const {
    events,
    loading,
    error,
    reload,
    createEvent,
  } = useEvents()

  const [
    form,
    setForm,
  ] = useState<EventFormState>(
    initialForm,
  )

  const [
    submitting,
    setSubmitting,
  ] = useState(false)

  const [
    formError,
    setFormError,
  ] = useState<
    string | null
  >(null)

  const [
    successMessage,
    setSuccessMessage,
  ] = useState<
    string | null
  >(null)

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault()

    setSubmitting(true)
    setFormError(null)
    setSuccessMessage(null)

    try {
      await createEvent({
        title:
          form.title,

        description:
          form.description ||
          null,

        event_type:
          form.eventType,

        start_at:
          new Date(
            form.startAt,
          ).toISOString(),

        end_at:
          form.endAt
            ? new Date(
                form.endAt,
              ).toISOString()
            : null,

        status:
          'planejado',

        priority:
          form.priority,
      })

      setForm(
        initialForm,
      )

      setSuccessMessage(
        'Evento criado com sucesso.',
      )
    } catch (
      createError
    ) {
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
    <section className="w-full">
      <div className="grid gap-6 lg:grid-cols-[minmax(320px,0.8fr)_minmax(0,1.2fr)]">
        <form
          onSubmit={
            handleSubmit
          }
          className="relative overflow-hidden rounded-panel border border-border bg-surface p-6 shadow-card sm:p-8"
        >
          <div
            aria-hidden="true"
            className="absolute left-0 top-0 h-full w-1 bg-brand-secondary"
          />

          <div className="relative">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand-secondary">
              Agenda Inteligente EDI
            </p>

            <h2 className="mt-3 text-2xl font-bold tracking-tight text-content-primary">
              Novo evento
            </h2>

            <p className="mt-3 text-sm leading-6 text-content-secondary">
              Cadastre compromissos, aulas, reuniões, formações e prazos da
              rotina pedagógica.
            </p>

            <div className="mt-7 space-y-5">
              <div>
                <label
                  htmlFor="event-title"
                  className="mb-2 block text-sm font-semibold text-content-primary"
                >
                  Título
                </label>

                <input
                  id="event-title"
                  type="text"
                  required
                  value={
                    form.title
                  }
                  onChange={
                    event =>
                      setForm(
                        current => ({
                          ...current,

                          title:
                            event
                              .target
                              .value,
                        }),
                      )
                  }
                  className={
                    fieldClasses
                  }
                />
              </div>

              <div>
                <label
                  htmlFor="event-description"
                  className="mb-2 block text-sm font-semibold text-content-primary"
                >
                  Descrição
                </label>

                <textarea
                  id="event-description"
                  rows={
                    4
                  }
                  value={
                    form.description
                  }
                  onChange={
                    event =>
                      setForm(
                        current => ({
                          ...current,

                          description:
                            event
                              .target
                              .value,
                        }),
                      )
                  }
                  className={`${fieldClasses} resize-y`}
                />
              </div>

              <div>
                <label
                  htmlFor="event-type"
                  className="mb-2 block text-sm font-semibold text-content-primary"
                >
                  Tipo
                </label>

                <div className="relative">
                  <select
                    id="event-type"
                    value={
                      form.eventType
                    }
                    onChange={
                      event =>
                        setForm(
                          current => ({
                            ...current,

                            eventType:
                              event
                                .target
                                .value,
                          }),
                        )
                    }
                    className={`${fieldClasses} appearance-none pr-12`}
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

                    <option value="prazo">
                      Prazo
                    </option>
                  </select>

                  <SelectArrow />
                </div>
              </div>

              <div>
                <label
                  htmlFor="event-priority"
                  className="mb-2 block text-sm font-semibold text-content-primary"
                >
                  Prioridade
                </label>

                <div className="relative">
                  <select
                    id="event-priority"
                    value={
                      form.priority
                    }
                    onChange={
                      event =>
                        setForm(
                          current => ({
                            ...current,

                            priority:
                              event
                                .target
                                .value,
                          }),
                        )
                    }
                    className={`${fieldClasses} appearance-none pr-12`}
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
                  </select>

                  <SelectArrow />
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="event-start"
                    className="mb-2 block text-sm font-semibold text-content-primary"
                  >
                    Início
                  </label>

                  <input
                    id="event-start"
                    type="datetime-local"
                    required
                    value={
                      form.startAt
                    }
                    onChange={
                      event =>
                        setForm(
                          current => ({
                            ...current,

                            startAt:
                              event
                                .target
                                .value,
                          }),
                        )
                    }
                    className={
                      fieldClasses
                    }
                    style={{
                      colorScheme:
                        'light',
                    }}
                  />
                </div>

                <div>
                  <label
                    htmlFor="event-end"
                    className="mb-2 block text-sm font-semibold text-content-primary"
                  >
                    Término
                  </label>

                  <input
                    id="event-end"
                    type="datetime-local"
                    value={
                      form.endAt
                    }
                    onChange={
                      event =>
                        setForm(
                          current => ({
                            ...current,

                            endAt:
                              event
                                .target
                                .value,
                          }),
                        )
                    }
                    className={
                      fieldClasses
                    }
                    style={{
                      colorScheme:
                        'light',
                    }}
                  />
                </div>
              </div>
            </div>

            {
              formError ? (
                <div
                  role="alert"
                  className="mt-5 rounded-card border border-status-dangerBorder bg-status-dangerBackground p-4 text-sm font-semibold text-status-danger"
                >
                  {
                    formError
                  }
                </div>
              ) : null
            }

            {
              successMessage ? (
                <div
                  role="status"
                  className="mt-5 rounded-card border border-status-successBorder bg-status-successBackground p-4 text-sm font-semibold text-status-success"
                >
                  {
                    successMessage
                  }
                </div>
              ) : null
            }

            <button
              type="submit"
              disabled={
                submitting
              }
              className="mt-6 w-full rounded-full bg-brand-secondary px-6 py-4 font-semibold text-white transition duration-250 hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-secondary focus-visible:ring-offset-2"
            >
              {
                submitting
                  ? 'Salvando...'
                  : 'Criar evento'
              }
            </button>
          </div>
        </form>

        <section className="relative overflow-hidden rounded-panel border border-border bg-surface p-6 shadow-card sm:p-8">
          <div
            aria-hidden="true"
            className="absolute left-0 top-0 h-full w-1 bg-brand-secondary"
          />

          <div className="relative">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand-secondary">
                  Acompanhamento
                </p>

                <h2 className="mt-3 text-2xl font-bold tracking-tight text-content-primary">
                  Eventos cadastrados
                </h2>
              </div>

              <button
                type="button"
                onClick={
                  () => {
                    void reload()
                  }
                }
                className="inline-flex w-fit rounded-full border border-border-strong bg-surface px-5 py-2.5 text-sm font-semibold text-brand-primary transition duration-250 hover:bg-surface-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-secondary focus-visible:ring-offset-2"
              >
                Atualizar
              </button>
            </div>

            {
              loading ? (
                <div
                  aria-busy="true"
                  className="mt-8 space-y-4"
                >
                  <div className="h-32 animate-pulse rounded-panel bg-surface-muted" />

                  <div className="h-32 animate-pulse rounded-panel bg-surface-muted" />
                </div>
              ) : null
            }

            {
              error ? (
                <div
                  role="alert"
                  className="mt-8 rounded-card border border-status-dangerBorder bg-status-dangerBackground p-5 text-status-danger"
                >
                  {
                    error
                  }
                </div>
              ) : null
            }

            {
              !loading &&
              !error &&
              events.length ===
                0 ? (
                <div className="mt-8 rounded-panel border border-dashed border-border-strong bg-surface-muted p-8 text-center">
                  <p className="font-semibold text-content-primary">
                    Nenhum evento cadastrado
                  </p>

                  <p className="mt-2 text-sm leading-6 text-content-secondary">
                    Utilize o formulário para registrar o primeiro evento da
                    agenda.
                  </p>
                </div>
              ) : null
            }

            <div className="mt-8 space-y-4">
              {
                events.map(
                  agendaEvent => (
                    <article
                      key={
                        agendaEvent.id
                      }
                      className="relative overflow-hidden rounded-panel border border-border bg-surface-muted p-5 sm:p-6"
                    >
                      <div
                        aria-hidden="true"
                        className="absolute left-0 top-0 h-full w-1 bg-brand-secondary"
                      />

                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-secondary">
                            {
                              formatEventType(
                                agendaEvent.event_type,
                              )
                            }
                          </p>

                          <h3 className="mt-2 text-xl font-bold text-content-primary">
                            {
                              agendaEvent.title
                            }
                          </h3>
                        </div>

                        <span
                          className={[
                            'rounded-full',
                            'border',
                            'px-3',
                            'py-1.5',
                            'text-xs',
                            'font-bold',
                            getPriorityClasses(
                              agendaEvent.priority,
                            ),
                          ].join(' ')}
                        >
                          {
                            formatPriority(
                              agendaEvent.priority,
                            )
                          }
                        </span>
                      </div>

                      {
                        agendaEvent.description ? (
                          <p className="mt-4 text-sm leading-7 text-content-secondary">
                            {
                              agendaEvent.description
                            }
                          </p>
                        ) : null
                      }

                      <dl className="mt-5 grid gap-4 border-t border-border pt-4 text-sm sm:grid-cols-2">
                        <div>
                          <dt className="font-semibold text-content-muted">
                            Início
                          </dt>

                          <dd className="mt-1 text-content-primary">
                            {
                              new Date(
                                agendaEvent.start_at,
                              ).toLocaleString(
                                'pt-BR',
                              )
                            }
                          </dd>
                        </div>

                        <div>
                          <dt className="font-semibold text-content-muted">
                            Término
                          </dt>

                          <dd className="mt-1 text-content-primary">
                            {
                              agendaEvent.end_at
                                ? new Date(
                                    agendaEvent.end_at,
                                  ).toLocaleString(
                                    'pt-BR',
                                  )
                                : 'Não informado'
                            }
                          </dd>
                        </div>
                      </dl>
                    </article>
                  ),
                )
              }
            </div>
          </div>
        </section>
      </div>
    </section>
  )
}