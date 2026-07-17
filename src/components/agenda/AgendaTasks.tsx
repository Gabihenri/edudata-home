'use client'

import {
  type FormEvent,
  useMemo,
  useState,
} from 'react'

import {
  AgendaPageShell,
} from '@/components/agenda/AgendaPageShell'
import {
  useTasks,
} from '@/lib/agenda/hooks/useTasks'

type TaskPriority =
  | 'baixa'
  | 'media'
  | 'alta'

type TaskFormState = {
  title: string
  description: string
  priority: TaskPriority
  dueDate: string
}

type PriorityOption = {
  value: TaskPriority
  label: string
  description: string
}

const TIMEZONE =
  'America/Sao_Paulo'

const initialForm:
  TaskFormState = {
  title: '',
  description: '',
  priority: 'media',
  dueDate: '',
}

const priorityOptions:
  PriorityOption[] = [
    {
      value: 'baixa',
      label: 'Baixa',
      description:
        'Pode ser executada após as demandas principais.',
    },
    {
      value: 'media',
      label: 'Média',
      description:
        'Deve ser acompanhada na rotina de trabalho.',
    },
    {
      value: 'alta',
      label: 'Alta',
      description:
        'Exige atenção e execução prioritária.',
    },
  ]

const inputClassName = [
  'min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3',
  'text-slate-950 outline-none transition placeholder:text-slate-400',
  'focus:border-[#0B7491] focus:ring-4 focus:ring-cyan-100',
  'disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500',
].join(' ')

function normalizeValue(
  value: string,
): string {
  return value
    .normalize('NFD')
    .replace(
      /[\u0300-\u036f]/g,
      '',
    )
    .toLowerCase()
    .trim()
}

function isTaskCompleted(
  status: string,
): boolean {
  const normalized =
    normalizeValue(status)

  return [
    'concluida',
    'concluido',
    'finalizada',
    'finalizado',
    'completa',
    'completo',
    'done',
  ].includes(normalized)
}

function formatTaskStatus(
  status: string,
): string {
  const normalized =
    normalizeValue(status)

  const labels:
    Record<string, string> = {
    pendente: 'Pendente',
    andamento: 'Em andamento',
    em_andamento:
      'Em andamento',
    concluida: 'Concluída',
    concluido: 'Concluída',
    finalizada: 'Finalizada',
    finalizado: 'Finalizada',
    cancelada: 'Cancelada',
    cancelado: 'Cancelada',
  }

  return (
    labels[normalized] ??
    status
      .replace(
        /_/g,
        ' ',
      )
      .replace(
        /\b\w/g,
        (character) =>
          character.toUpperCase(),
      )
  )
}

function formatPriority(
  priority: string,
): string {
  const normalized =
    normalizeValue(priority)

  const labels:
    Record<string, string> = {
    baixa: 'Baixa',
    media: 'Média',
    alta: 'Alta',
    urgente: 'Urgente',
  }

  return (
    labels[normalized] ??
    priority
  )
}

function formatDueDate(
  value: string | null,
): string {
  if (!value) {
    return 'Prazo não informado'
  }

  const date =
    new Date(value)

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return 'Prazo indisponível'
  }

  return new Intl.DateTimeFormat(
    'pt-BR',
    {
      timeZone:
        TIMEZONE,

      dateStyle:
        'medium',

      timeStyle:
        'short',
    },
  ).format(date)
}

function getPriorityClasses(
  priority: string,
): string {
  const normalized =
    normalizeValue(priority)

  if (
    normalized === 'alta' ||
    normalized === 'urgente'
  ) {
    return [
      'border-red-200',
      'bg-red-50',
      'text-red-800',
    ].join(' ')
  }

  if (
    normalized === 'media'
  ) {
    return [
      'border-amber-200',
      'bg-amber-50',
      'text-amber-800',
    ].join(' ')
  }

  return [
    'border-emerald-200',
    'bg-emerald-50',
    'text-emerald-800',
  ].join(' ')
}

function getDeadlinePresentation(
  dueDate: string | null,
  status: string,
): {
  label: string
  classes: string
} {
  if (
    isTaskCompleted(status)
  ) {
    return {
      label:
        'Concluída',

      classes:
        'border-emerald-200 bg-emerald-50 text-emerald-800',
    }
  }

  if (!dueDate) {
    return {
      label:
        'Sem prazo',

      classes:
        'border-slate-200 bg-slate-50 text-slate-600',
    }
  }

  const date =
    new Date(dueDate)

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return {
      label:
        'Prazo indisponível',

      classes:
        'border-slate-200 bg-slate-50 text-slate-600',
    }
  }

  const difference =
    date.getTime() -
    Date.now()

  if (difference < 0) {
    return {
      label:
        'Atrasada',

      classes:
        'border-red-200 bg-red-50 text-red-800',
    }
  }

  const oneDay =
    24 *
    60 *
    60 *
    1000

  if (
    difference <= oneDay
  ) {
    return {
      label:
        'Vence em breve',

      classes:
        'border-amber-200 bg-amber-50 text-amber-800',
    }
  }

  return {
    label:
      'No prazo',

    classes:
      'border-cyan-200 bg-cyan-50 text-[#075F78]',
  }
}

export function AgendaTasks() {
  const {
    tasks,
    loading,
    error,
    reload,
    createTask,
  } = useTasks()

  const [
    form,
    setForm,
  ] =
    useState<TaskFormState>(
      initialForm,
    )

  const [
    submitting,
    setSubmitting,
  ] =
    useState(false)

  const [
    formError,
    setFormError,
  ] =
    useState<string | null>(
      null,
    )

  const [
    successMessage,
    setSuccessMessage,
  ] =
    useState<string | null>(
      null,
    )

  const summary =
    useMemo(() => {
      const pending =
        tasks.filter(
          (task) =>
            !isTaskCompleted(
              task.status,
            ),
        )

      const overdue =
        pending.filter(
          (task) => {
            if (
              !task.due_date
            ) {
              return false
            }

            const dueDate =
              new Date(
                task.due_date,
              )

            return (
              !Number.isNaN(
                dueDate.getTime(),
              ) &&
              dueDate.getTime() <
                Date.now()
            )
          },
        )

      const highPriority =
        pending.filter(
          (task) => {
            const priority =
              normalizeValue(
                task.priority,
              )

            return (
              priority ===
                'alta' ||
              priority ===
                'urgente'
            )
          },
        )

      return {
        total:
          tasks.length,

        pending:
          pending.length,

        overdue:
          overdue.length,

        highPriority:
          highPriority.length,
      }
    }, [tasks])

  function updateField<
    Key extends
      keyof TaskFormState,
  >(
    key: Key,
    value:
      TaskFormState[Key],
  ): void {
    setForm(
      (current) => ({
        ...current,
        [key]: value,
      }),
    )

    setFormError(
      null,
    )

    setSuccessMessage(
      null,
    )
  }

  function clearForm(): void {
    if (submitting) {
      return
    }

    setForm(
      initialForm,
    )

    setFormError(
      null,
    )

    setSuccessMessage(
      null,
    )
  }

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault()

    setSubmitting(
      true,
    )

    setFormError(
      null,
    )

    setSuccessMessage(
      null,
    )

    try {
      const title =
        form.title.trim()

      if (!title) {
        throw new Error(
          'Informe o título da tarefa.',
        )
      }

      await createTask({
        title,

        description:
          form.description
            .trim() ||
          null,

        status:
          'pendente',

        priority:
          form.priority,

        due_date:
          form.dueDate
            ? new Date(
                form.dueDate,
              ).toISOString()
            : null,
      })

      setForm(
        initialForm,
      )

      setSuccessMessage(
        'Tarefa criada com sucesso.',
      )
    } catch (createError) {
      setFormError(
        createError instanceof Error
          ? createError.message
          : 'Não foi possível criar a tarefa.',
      )
    } finally {
      setSubmitting(
        false,
      )
    }
  }

  return (
    <AgendaPageShell
      eyebrow="Organização e execução"
      title="Tarefas e pendências"
      description="Organize ações, prazos e prioridades pedagógicas em um fluxo operacional integrado à Agenda Inteligente EDI."
    >
      <div className="space-y-6 sm:space-y-8">
        <section
          aria-label="Resumo das tarefas"
          className="grid overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm sm:grid-cols-2 xl:grid-cols-4"
        >
          <article className="border-b border-slate-200 p-5 sm:border-r xl:border-b-0">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              Total ativo
            </p>

            <p className="mt-3 text-3xl font-bold text-[#071827]">
              {
                summary.total
              }
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Tarefas registradas
            </p>
          </article>

          <article className="border-b border-slate-200 p-5 xl:border-b-0 xl:border-r">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              Pendentes
            </p>

            <p className="mt-3 text-3xl font-bold text-[#071827]">
              {
                summary.pending
              }
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Ações em aberto
            </p>
          </article>

          <article className="border-b border-slate-200 p-5 sm:border-r sm:border-b-0">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              Alta prioridade
            </p>

            <p className="mt-3 text-3xl font-bold text-[#071827]">
              {
                summary.highPriority
              }
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Demandas prioritárias
            </p>
          </article>

          <article className="p-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              Atrasadas
            </p>

            <p className="mt-3 text-3xl font-bold text-[#071827]">
              {
                summary.overdue
              }
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Prazos vencidos
            </p>
          </article>
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(320px,0.8fr)_minmax(0,1.2fr)]">
          <form
            onSubmit={
              handleSubmit
            }
            className="self-start overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm xl:sticky xl:top-[176px]"
          >
            <header className="border-b border-slate-200 px-5 py-5 sm:px-7">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#071827] font-mono text-xs font-bold text-cyan-300">
                  05
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B7491]">
                    Nova demanda
                  </p>

                  <h2 className="mt-2 text-2xl font-bold text-[#071827]">
                    Criar tarefa
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Registre uma ação, atribua prioridade e defina o prazo.
                  </p>
                </div>
              </div>
            </header>

            <div className="space-y-6 p-5 sm:p-7">
              <div>
                <label
                  htmlFor="task-title"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Título
                </label>

                <input
                  id="task-title"
                  type="text"
                  required
                  value={
                    form.title
                  }
                  onChange={(
                    event,
                  ) =>
                    updateField(
                      'title',
                      event.target
                        .value,
                    )
                  }
                  placeholder="Ex.: Revisar planejamento semanal"
                  className={
                    inputClassName
                  }
                />
              </div>

              <div>
                <label
                  htmlFor="task-description"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Descrição
                </label>

                <textarea
                  id="task-description"
                  rows={5}
                  value={
                    form.description
                  }
                  onChange={(
                    event,
                  ) =>
                    updateField(
                      'description',
                      event.target
                        .value,
                    )
                  }
                  placeholder="Descreva a ação necessária, seu contexto e o resultado esperado."
                  className={`${inputClassName} resize-y`}
                />
              </div>

              <fieldset>
                <legend className="text-sm font-semibold text-slate-700">
                  Prioridade
                </legend>

                <div className="mt-3 grid gap-3">
                  {priorityOptions.map(
                    (
                      option,
                    ) => {
                      const active =
                        form.priority ===
                        option.value

                      return (
                        <label
                          key={
                            option.value
                          }
                          className={`cursor-pointer rounded-xl border p-4 transition ${
                            active
                              ? 'border-[#0B7491] bg-cyan-50'
                              : 'border-slate-200 bg-white hover:border-cyan-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="task-priority"
                            value={
                              option.value
                            }
                            checked={
                              active
                            }
                            onChange={() =>
                              updateField(
                                'priority',
                                option.value,
                              )
                            }
                            className="sr-only"
                          />

                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="font-bold text-[#071827]">
                                {
                                  option.label
                                }
                              </p>

                              <p className="mt-1 text-sm leading-5 text-slate-500">
                                {
                                  option.description
                                }
                              </p>
                            </div>

                            <span
                              aria-hidden="true"
                              className={`mt-1 h-3 w-3 shrink-0 rounded-full ${
                                active
                                  ? 'bg-[#0B7491]'
                                  : 'border border-slate-300 bg-white'
                              }`}
                            />
                          </div>
                        </label>
                      )
                    },
                  )}
                </div>
              </fieldset>

              <div>
                <label
                  htmlFor="task-due-date"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Prazo
                </label>

                <input
                  id="task-due-date"
                  type="datetime-local"
                  value={
                    form.dueDate
                  }
                  onChange={(
                    event,
                  ) =>
                    updateField(
                      'dueDate',
                      event.target
                        .value,
                    )
                  }
                  className={
                    inputClassName
                  }
                />

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  O prazo é opcional, mas ajuda a identificar atrasos e demandas urgentes.
                </p>
              </div>

              {formError ? (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold leading-6 text-red-700"
                >
                  {formError}
                </div>
              ) : null}

              {successMessage ? (
                <div
                  role="status"
                  className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold leading-6 text-emerald-800"
                >
                  {
                    successMessage
                  }
                </div>
              ) : null}
            </div>

            <footer className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-5 py-5 sm:flex-row sm:px-7">
              <button
                type="button"
                onClick={
                  clearForm
                }
                disabled={
                  submitting
                }
                className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-[#075F78] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Limpar
              </button>

              <button
                type="submit"
                disabled={
                  submitting
                }
                className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl bg-[#0B7491] px-5 py-3 font-semibold text-white transition hover:bg-[#09657E] disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {submitting
                  ? 'Salvando...'
                  : 'Criar tarefa'}
              </button>
            </footer>
          </form>

          <section className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
            <header className="border-b border-slate-200 px-5 py-5 sm:px-7">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B7491]">
                    Fluxo de execução
                  </p>

                  <h2 className="mt-2 text-2xl font-bold text-[#071827]">
                    Tarefas cadastradas
                  </h2>

                  <p className="mt-2 text-sm text-slate-500">
                    {tasks.length}{' '}
                    tarefa
                    {tasks.length === 1
                      ? ''
                      : 's'}{' '}
                    registrada
                    {tasks.length === 1
                      ? ''
                      : 's'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    void reload()
                  }
                  disabled={
                    loading
                  }
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-[#075F78] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading
                    ? 'Atualizando...'
                    : 'Atualizar tarefas'}
                </button>
              </div>
            </header>

            <div className="p-5 sm:p-7">
              {error ? (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700"
                >
                  {error}
                </div>
              ) : null}

              {loading ? (
                <div
                  role="status"
                  className="rounded-xl border border-cyan-200 bg-cyan-50 p-5 text-sm font-semibold text-cyan-900"
                >
                  Carregando tarefas...
                </div>
              ) : null}

              {!loading &&
              !error &&
              tasks.length ===
                0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                  <h3 className="text-lg font-bold text-[#071827]">
                    Nenhuma tarefa cadastrada
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Utilize o formulário para registrar a primeira ação ou pendência.
                  </p>
                </div>
              ) : null}

              {!loading &&
              tasks.length >
                0 ? (
                <div className="grid gap-4 lg:grid-cols-2">
                  {tasks.map(
                    (
                      task,
                      index,
                    ) => {
                      const deadline =
                        getDeadlinePresentation(
                          task.due_date,
                          task.status,
                        )

                      return (
                        <article
                          key={
                            task.id
                          }
                          className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
                        >
                          <header className="border-b border-slate-200 bg-slate-50 px-5 py-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex min-w-0 items-start gap-3">
                                <span className="font-mono text-xs font-bold text-[#0B7491]">
                                  {String(
                                    index +
                                      1,
                                  ).padStart(
                                    2,
                                    '0',
                                  )}
                                </span>

                                <div className="min-w-0">
                                  <span className="inline-flex rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-[#075F78]">
                                    {formatTaskStatus(
                                      task.status,
                                    )}
                                  </span>

                                  <h3 className="mt-3 break-words text-xl font-bold text-[#071827]">
                                    {
                                      task.title
                                    }
                                  </h3>
                                </div>
                              </div>

                              <span
                                className={`shrink-0 rounded-lg border px-3 py-2 text-xs font-bold ${getPriorityClasses(
                                  task.priority,
                                )}`}
                              >
                                {formatPriority(
                                  task.priority,
                                )}
                              </span>
                            </div>
                          </header>

                          <div className="space-y-4 p-5">
                            {task.description ? (
                              <p className="break-words text-sm leading-6 text-slate-600">
                                {
                                  task.description
                                }
                              </p>
                            ) : (
                              <p className="text-sm italic text-slate-400">
                                Sem descrição complementar.
                              </p>
                            )}

                            <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                                    Prazo
                                  </p>

                                  <p className="mt-2 text-sm font-semibold text-slate-700">
                                    {formatDueDate(
                                      task.due_date,
                                    )}
                                  </p>
                                </div>

                                <span
                                  className={`rounded-lg border px-3 py-2 text-xs font-bold ${deadline.classes}`}
                                >
                                  {
                                    deadline.label
                                  }
                                </span>
                              </div>
                            </section>

                            <div className="grid grid-cols-2 gap-3 border-t border-slate-200 pt-4">
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                                  Situação
                                </p>

                                <p className="mt-1 text-sm font-semibold text-slate-700">
                                  {formatTaskStatus(
                                    task.status,
                                  )}
                                </p>
                              </div>

                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                                  Prioridade
                                </p>

                                <p className="mt-1 text-sm font-semibold text-slate-700">
                                  {formatPriority(
                                    task.priority,
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                        </article>
                      )
                    },
                  )}
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </AgendaPageShell>
  )
}