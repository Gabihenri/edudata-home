'use client'

import { FormEvent, useState } from 'react'

import { useTasks } from '@/lib/agenda/hooks/useTasks'

type TaskFormState = {
  title: string
  description: string
  priority: string
  dueDate: string
}

const initialForm: TaskFormState = {
  title: '',
  description: '',
  priority: 'media',
  dueDate: '',
}

export function AgendaTasks() {
  const {
    tasks,
    loading,
    error,
    reload,
    createTask,
  } = useTasks()

  const [form, setForm] = useState<TaskFormState>(initialForm)
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
      await createTask({
        title: form.title,
        description: form.description || null,
        status: 'pendente',
        priority: form.priority,
        due_date: form.dueDate
          ? new Date(form.dueDate).toISOString()
          : null,
      })

      setForm(initialForm)
      setSuccessMessage('Tarefa criada com sucesso.')
    } catch (createError) {
      setFormError(
        createError instanceof Error
          ? createError.message
          : 'Não foi possível criar a tarefa.',
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
          Tarefas e pendências
        </h1>

        <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">
          Organize prioridades, prazos e ações pedagógicas utilizando dados
          persistidos no Supabase.
        </p>

        <div className="mt-12 grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <form
            onSubmit={handleSubmit}
            className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm"
          >
            <h2 className="text-2xl font-bold text-slate-950">
              Nova tarefa
            </h2>

            <div className="mt-6 space-y-5">
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
                  htmlFor="task-description"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Descrição
                </label>

                <textarea
                  id="task-description"
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
                  htmlFor="task-priority"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Prioridade
                </label>

                <select
                  id="task-priority"
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
                  htmlFor="task-due-date"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Prazo
                </label>

                <input
                  id="task-due-date"
                  type="datetime-local"
                  value={form.dueDate}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      dueDate: event.target.value,
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
              {submitting ? 'Salvando...' : 'Criar tarefa'}
            </button>
          </form>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-2xl font-bold text-slate-950">
                Tarefas cadastradas
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
                Carregando tarefas...
              </p>
            ) : null}

            {error ? (
              <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
                {error}
              </div>
            ) : null}

            {!loading && !error && tasks.length === 0 ? (
              <p className="mt-8 text-slate-500">
                Nenhuma tarefa cadastrada.
              </p>
            ) : null}

            <div className="mt-8 space-y-5">
              {tasks.map((task) => (
                <article
                  key={task.id}
                  className="rounded-3xl border border-slate-200 bg-[#F5F6F8] p-6"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#5C1A8C]">
                        {task.status}
                      </p>

                      <h3 className="mt-3 text-xl font-bold text-slate-950">
                        {task.title}
                      </h3>
                    </div>

                    <span className="rounded-full bg-[#081C2E] px-4 py-2 text-xs font-bold uppercase text-white">
                      {task.priority}
                    </span>
                  </div>

                  {task.description ? (
                    <p className="mt-4 leading-7 text-slate-600">
                      {task.description}
                    </p>
                  ) : null}

                  <p className="mt-5 text-sm text-slate-600">
                    <strong>Prazo:</strong>{' '}
                    {task.due_date
                      ? new Date(task.due_date).toLocaleString('pt-BR')
                      : 'Não informado'}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}