'use client'

import {
  type FormEvent,
  useState,
} from 'react'

import { AgendaPageShell } from '@/components/agenda/AgendaPageShell'
import { usePlanning } from '@/lib/agenda/hooks/usePlanning'

type PlanningFormData = {
  title: string
  objective: string
}

const initialFormData: PlanningFormData = {
  title: '',
  objective: '',
}

function formatPlanningDate(
  value: string | null,
): string {
  if (!value) {
    return 'Data não definida'
  }

  const [year, month, day] = value
    .split('-')
    .map(Number)

  const date = new Date(
    year,
    month - 1,
    day,
    12,
    0,
    0,
    0,
  )

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat(
    'pt-BR',
  ).format(date)
}

export default function AgendaPlanningPage() {
  const {
    planning,
    loading,
    error,
    reload,
    createPlanning,
  } = usePlanning()

  const [formData, setFormData] =
    useState<PlanningFormData>(
      initialFormData,
    )

  const [isSaving, setIsSaving] =
    useState(false)

  const [formError, setFormError] =
    useState('')

  const [successMessage, setSuccessMessage] =
    useState('')

  function updateField(
    field: keyof PlanningFormData,
    value: string,
  ) {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }))

    setFormError('')
    setSuccessMessage('')
  }

  function clearForm() {
    setFormData(initialFormData)
    setFormError('')
    setSuccessMessage('')
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    setFormError('')
    setSuccessMessage('')

    const title =
      formData.title.trim()

    const objective =
      formData.objective.trim()

    if (!title) {
      setFormError(
        'Informe o título do planejamento.',
      )

      return
    }

    if (!objective) {
      setFormError(
        'Informe o objetivo do planejamento.',
      )

      return
    }

    setIsSaving(true)

    try {
      await createPlanning({
        title,
        objective,

        description: null,
        subject: null,
        class_name: null,
        methodology: null,
        resources: null,
        evaluation: null,
        planned_date: null,

        status: 'rascunho',

        school_id: null,
        user_id: null,
      })

      setFormData(initialFormData)

      setSuccessMessage(
        'Planejamento salvo com sucesso.',
      )
    } catch (saveError) {
      setFormError(
        saveError instanceof Error
          ? saveError.message
          : 'Não foi possível salvar o planejamento.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <AgendaPageShell
      eyebrow="Agenda Inteligente EDI"
      title="Planejamento pedagógico"
      description="Organize objetivos, metodologias, recursos, avaliações e datas utilizando dados persistidos no Supabase."
    >
      <div className="grid gap-6">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-3xl border border-slate-200 bg-slate-50 p-6 sm:p-8">
            <h2 className="text-3xl font-bold text-[#081C2E]">
              Novo planejamento
            </h2>

            <form
              onSubmit={handleSubmit}
              className="mt-8 space-y-5"
            >
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
                  value={formData.title}
                  onChange={(event) =>
                    updateField(
                      'title',
                      event.target.value,
                    )
                  }
                  placeholder="Ex.: Sequência didática"
                  autoComplete="off"
                  className="min-h-[56px] w-full rounded-2xl border border-slate-300 bg-white px-4 text-base text-slate-900 outline-none transition focus:border-[#6B21A8] focus:ring-2 focus:ring-purple-200"
                />
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
                  rows={6}
                  value={formData.objective}
                  onChange={(event) =>
                    updateField(
                      'objective',
                      event.target.value,
                    )
                  }
                  placeholder="Descreva o objetivo pedagógico."
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-4 text-base text-slate-900 outline-none transition focus:border-[#6B21A8] focus:ring-2 focus:ring-purple-200"
                />
              </div>

              {formError ? (
                <div
                  role="alert"
                  className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 leading-7 text-red-700"
                >
                  {formError}
                </div>
              ) : null}

              {successMessage ? (
                <div
                  role="status"
                  className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 leading-7 text-emerald-800"
                >
                  {successMessage}
                </div>
              ) : null}

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex min-h-[56px] flex-1 cursor-pointer items-center justify-center rounded-full bg-[#6B21A8] px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-[#581C87] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving
                    ? 'Salvando...'
                    : 'Salvar planejamento'}
                </button>

                <button
                  type="button"
                  onClick={clearForm}
                  disabled={isSaving}
                  className="inline-flex min-h-[56px] flex-1 cursor-pointer items-center justify-center rounded-full border-2 border-slate-300 bg-white px-6 py-3 text-base font-semibold text-slate-700 transition hover:border-[#6B21A8] hover:bg-purple-50 hover:text-[#6B21A8] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Limpar campos
                </button>
              </div>
            </form>
          </section>

          <aside className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-[#081C2E]">
              Boas práticas
            </h2>

            <ul className="mt-6 space-y-4 text-base leading-8 text-slate-600">
              <li>
                • Defina objetivos claros de aprendizagem.
              </li>

              <li>
                • Relacione metodologias e evidências esperadas.
              </li>

              <li>
                • Estabeleça cronograma e formas de avaliação.
              </li>

              <li>
                • Mantenha registros para análise futura.
              </li>
            </ul>
          </aside>
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-700">
                Registros
              </p>

              <h2 className="mt-2 text-2xl font-bold text-[#081C2E]">
                Planejamentos cadastrados
              </h2>
            </div>

            <button
              type="button"
              onClick={() => void reload()}
              disabled={loading}
              className="inline-flex min-h-[48px] items-center justify-center rounded-full border-2 border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-[#6B21A8] hover:text-[#6B21A8] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? 'Atualizando...'
                : 'Atualizar'}
            </button>
          </div>

          {error ? (
            <div
              role="alert"
              className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 leading-7 text-red-700"
            >
              {error}
            </div>
          ) : null}

          {loading ? (
            <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-600">
              Carregando planejamentos...
            </div>
          ) : planning.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <h3 className="text-xl font-bold text-[#081C2E]">
                Nenhum planejamento cadastrado
              </h3>

              <p className="mt-3 leading-7 text-slate-600">
                Preencha o formulário acima para criar o primeiro planejamento.
              </p>
            </div>
          ) : (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {planning.map((item) => (
                <article
                  key={item.id}
                  className="rounded-3xl border border-slate-200 bg-slate-50 p-6"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-[#6B21A8]">
                      {item.status}
                    </span>

                    <span className="text-sm font-semibold text-slate-500">
                      {formatPlanningDate(
                        item.planned_date,
                      )}
                    </span>
                  </div>

                  <h3 className="mt-5 text-xl font-bold text-[#081C2E]">
                    {item.title}
                  </h3>

                  {item.objective ? (
                    <p className="mt-3 leading-7 text-slate-600">
                      {item.objective}
                    </p>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </AgendaPageShell>
  )
}