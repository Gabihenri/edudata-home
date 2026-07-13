'use client'

import { FormEvent, useState } from 'react'

import { usePlanning } from '@/lib/agenda/hooks/usePlanning'

type PlanningFormState = {
  title: string
  description: string
  subject: string
  className: string
  objective: string
  methodology: string
  resources: string
  evaluation: string
  plannedDate: string
}

const initialForm: PlanningFormState = {
  title: '',
  description: '',
  subject: '',
  className: '',
  objective: '',
  methodology: '',
  resources: '',
  evaluation: '',
  plannedDate: '',
}

export function AgendaPlanning() {
  const {
    planning,
    loading,
    error,
    reload,
    createPlanning,
  } = usePlanning()

  const [form, setForm] = useState<PlanningFormState>(initialForm)
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
      await createPlanning({
        title: form.title,
        description: form.description || null,
        subject: form.subject || null,
        class_name: form.className || null,
        objective: form.objective || null,
        methodology: form.methodology || null,
        resources: form.resources || null,
        evaluation: form.evaluation || null,
        planned_date: form.plannedDate || null,
        status: 'rascunho',
      })

      setForm(initialForm)
      setSuccessMessage('Planejamento criado com sucesso.')
    } catch (createError) {
      setFormError(
        createError instanceof Error
          ? createError.message
          : 'Não foi possível criar o planejamento.',
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
          Planejamento pedagógico
        </h1>

        <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">
          Organize objetivos, metodologias, recursos, avaliações e datas
          utilizando dados persistidos no Supabase.
        </p>

        <div className="mt-12 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <form
            onSubmit={handleSubmit}
            className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm"
          >
            <h2 className="text-2xl font-bold text-slate-950">
              Novo planejamento
            </h2>

            <div className="mt-6 space-y-5">
              <div>
                <label
                  htmlFor="planning-title"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Título
                </label>

                <input
                  id="planning-title"
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
                  htmlFor="planning-description"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Descrição
                </label>

                <textarea
                  id="planning-description"
                  rows={3}
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

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="planning-subject"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Disciplina
                  </label>

                  <input
                    id="planning-subject"
                    type="text"
                    value={form.subject}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        subject: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-[#5C1A8C] focus:ring-2 focus:ring-[#5C1A8C]/20"
                  />
                </div>

                <div>
                  <label
                    htmlFor="planning-class"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Turma
                  </label>

                  <input
                    id="planning-class"
                    type="text"
                    value={form.className}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        className: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-[#5C1A8C] focus:ring-2 focus:ring-[#5C1A8C]/20"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="planning-objective"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Objetivo
                </label>

                <textarea
                  id="planning-objective"
                  rows={3}
                  value={form.objective}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      objective: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-[#5C1A8C] focus:ring-2 focus:ring-[#5C1A8C]/20"
                />
              </div>

              <div>
                <label
                  htmlFor="planning-methodology"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Metodologia
                </label>

                <textarea
                  id="planning-methodology"
                  rows={3}
                  value={form.methodology}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      methodology: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-[#5C1A8C] focus:ring-2 focus:ring-[#5C1A8C]/20"
                />
              </div>

              <div>
                <label
                  htmlFor="planning-resources"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Recursos
                </label>

                <textarea
                  id="planning-resources"
                  rows={3}
                  value={form.resources}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      resources: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-[#5C1A8C] focus:ring-2 focus:ring-[#5C1A8C]/20"
                />
              </div>

              <div>
                <label
                  htmlFor="planning-evaluation"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Avaliação
                </label>

                <textarea
                  id="planning-evaluation"
                  rows={3}
                  value={form.evaluation}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      evaluation: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-[#5C1A8C] focus:ring-2 focus:ring-[#5C1A8C]/20"
                />
              </div>

              <div>
                <label
                  htmlFor="planning-date"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Data planejada
                </label>

                <input
                  id="planning-date"
                  type="date"
                  value={form.plannedDate}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      plannedDate: event.target.value,
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
              {submitting ? 'Salvando...' : 'Criar planejamento'}
            </button>
          </form>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-2xl font-bold text-slate-950">
                Planejamentos cadastrados
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
                Carregando planejamentos...
              </p>
            ) : null}

            {error ? (
              <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
                {error}
              </div>
            ) : null}

            {!loading && !error && planning.length === 0 ? (
              <p className="mt-8 text-slate-500">
                Nenhum planejamento cadastrado.
              </p>
            ) : null}

            <div className="mt-8 space-y-5">
              {planning.map((item) => (
                <article
                  key={item.id}
                  className="rounded-3xl border border-slate-200 bg-[#F5F6F8] p-6"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#5C1A8C]">
                        {item.status}
                      </p>

                      <h3 className="mt-3 text-xl font-bold text-slate-950">
                        {item.title}
                      </h3>
                    </div>

                    {item.planned_date ? (
                      <span className="rounded-full bg-[#081C2E] px-4 py-2 text-xs font-bold text-white">
                        {new Date(
                          `${item.planned_date}T00:00:00`,
                        ).toLocaleDateString('pt-BR')}
                      </span>
                    ) : null}
                  </div>

                  {item.description ? (
                    <p className="mt-4 leading-7 text-slate-600">
                      {item.description}
                    </p>
                  ) : null}

                  <div className="mt-5 grid gap-3 text-sm text-slate-600 md:grid-cols-2">
                    <p>
                      <strong>Disciplina:</strong>{' '}
                      {item.subject ?? 'Não informada'}
                    </p>

                    <p>
                      <strong>Turma:</strong>{' '}
                      {item.class_name ?? 'Não informada'}
                    </p>
                  </div>

                  {item.objective ? (
                    <p className="mt-4 text-sm leading-6 text-slate-600">
                      <strong>Objetivo:</strong> {item.objective}
                    </p>
                  ) : null}
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}