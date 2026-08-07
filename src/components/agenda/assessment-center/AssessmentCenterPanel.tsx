'use client'

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

type AssessmentRow = {
  id: string
  title: string
  purpose: string
  status: string
  class_id: string
  component_id: string
  academic_period_id: string
  scheduled_at: string | null
  created_at: string
}

type OverviewResponse = {
  success: boolean
  assessments: AssessmentRow[]
  summary: {
    total: number
    diagnostic: number
    completed: number
    pendingReview: number
  }
  error?: string
}

function formatDate(value: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
  }).format(date)
}

export default function AssessmentCenterPanel() {
  const [data, setData] = useState<OverviewResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [title, setTitle] = useState('Avaliação Diagnóstica')
  const [classId, setClassId] = useState('')
  const [componentId, setComponentId] = useState('')
  const [academicPeriodId, setAcademicPeriodId] = useState('')
  const [offeringId, setOfferingId] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/agenda/avaliacoes', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
        headers: {
          Accept: 'application/json',
        },
      })

      const body = await response.json() as OverviewResponse

      if (!response.ok || !body.success) {
        throw new Error(body.error || 'Não foi possível carregar as avaliações.')
      }

      setData(body)
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Não foi possível carregar as avaliações.',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/agenda/avaliacoes', {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          operation: 'create_assessment',
          assessment: {
            title,
            purpose: 'diagnostic',
            instrumentType: 'written_test',
            offeringId,
            classId,
            componentId,
            academicPeriodId,
            scaleType: 'numeric',
            calculationMethod: 'weighted_average',
            weight: 1,
            maximumScore: 10,
            passingScore: 7,
            scheduledAt: scheduledAt
              ? new Date(scheduledAt).toISOString()
              : null,
            learningOutcomeIds: [],
            criteria: [],
            metadata: {
              source: 'agenda_assessment_center',
            },
          },
        }),
      })

      const body = await response.json() as {
        success?: boolean
        error?: string
      }

      if (!response.ok || !body.success) {
        throw new Error(body.error || 'Não foi possível criar a avaliação.')
      }

      setSuccess('Avaliação diagnóstica criada com sucesso.')
      setTitle('Avaliação Diagnóstica')
      setScheduledAt('')
      await load()
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Não foi possível criar a avaliação.',
      )
    } finally {
      setSaving(false)
    }
  }

  const assessments = useMemo(
    () => data?.assessments ?? [],
    [data],
  )

  return (
    <section className="space-y-5 sm:space-y-6">
      <header className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-[#071827] text-white shadow-sm sm:rounded-[1.75rem]">
        <div className="px-4 py-6 sm:px-7 sm:py-7">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-300 sm:text-xs">
            Agenda Inteligente EDI · Avaliação da Aprendizagem
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            Centro de Avaliações
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
            Avaliações diagnósticas, resultados, diário de notas, classificação da aprendizagem, recuperação e recomposição em um único fluxo governado pelo EIOS.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {[
          ['Avaliações', data?.summary.total ?? 0],
          ['Diagnósticas', data?.summary.diagnostic ?? 0],
          ['Concluídas', data?.summary.completed ?? 0],
          ['Revisão pendente', data?.summary.pendingReview ?? 0],
        ].map(([label, value]) => (
          <article
            key={String(label)}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 sm:text-xs sm:tracking-[0.13em]">
              {label}
            </p>
            <p className="mt-2 text-2xl font-bold text-[#071827] sm:text-3xl">
              {value}
            </p>
          </article>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.4fr] xl:gap-6">
        <form
          onSubmit={handleSubmit}
          className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-6"
        >
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0B7491]">
            Nova avaliação
          </p>
          <h2 className="mt-2 text-xl font-bold text-[#071827]">
            Avaliação Diagnóstica
          </h2>

          <div className="mt-5 space-y-4">
            <label className="block text-sm font-semibold text-slate-700">
              Título
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
                className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-cyan-500"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-slate-700">
                Turma
                <input
                  value={classId}
                  onChange={(event) => setClassId(event.target.value)}
                  required
                  placeholder="ID da turma"
                  className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-cyan-500"
                />
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Componente
                <input
                  value={componentId}
                  onChange={(event) => setComponentId(event.target.value)}
                  required
                  placeholder="ID do componente"
                  className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-cyan-500"
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-slate-700">
                Período letivo
                <input
                  value={academicPeriodId}
                  onChange={(event) => setAcademicPeriodId(event.target.value)}
                  required
                  placeholder="ID do período"
                  className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-cyan-500"
                />
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Oferta
                <input
                  value={offeringId}
                  onChange={(event) => setOfferingId(event.target.value)}
                  required
                  placeholder="ID da oferta"
                  className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-cyan-500"
                />
              </label>
            </div>

            <label className="block text-sm font-semibold text-slate-700">
              Data programada
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(event) => setScheduledAt(event.target.value)}
                className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-cyan-500"
              />
            </label>
          </div>

          {error ? (
            <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              {error}
            </p>
          ) : null}

          {success ? (
            <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
              {success}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={saving}
            className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-[#071827] px-5 py-3 text-sm font-bold text-white disabled:opacity-60"
          >
            {saving ? 'Salvando...' : 'Criar avaliação diagnóstica'}
          </button>
        </form>

        <section className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-4 sm:px-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0B7491]">
                Histórico
              </p>
              <h2 className="mt-1 font-bold text-[#071827]">
                Avaliações cadastradas
              </h2>
            </div>
            <button
              type="button"
              onClick={() => void load()}
              className="min-h-11 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50"
            >
              Atualizar
            </button>
          </header>

          {loading ? (
            <div className="p-5 text-sm text-slate-600 sm:p-6">
              Carregando avaliações...
            </div>
          ) : assessments.length === 0 ? (
            <div className="p-5 text-sm leading-6 text-slate-600 sm:p-6">
              Ainda não há avaliações cadastradas. Crie a primeira avaliação diagnóstica acima.
            </div>
          ) : (
            <>
              <div className="divide-y divide-slate-100 md:hidden">
                {assessments.map((assessment) => (
                  <article key={assessment.id} className="px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="break-words font-bold text-[#071827]">
                          {assessment.title}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-[#075F78]">
                          {assessment.purpose}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700">
                        {assessment.status}
                      </span>
                    </div>

                    <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-lg bg-slate-50 px-3 py-2">
                        <dt className="font-semibold text-slate-500">Turma</dt>
                        <dd className="mt-0.5 break-all font-bold text-slate-700">{assessment.class_id}</dd>
                      </div>
                      <div className="rounded-lg bg-slate-50 px-3 py-2">
                        <dt className="font-semibold text-slate-500">Data</dt>
                        <dd className="mt-0.5 font-bold text-slate-700">
                          {formatDate(assessment.scheduled_at ?? assessment.created_at)}
                        </dd>
                      </div>
                    </dl>
                  </article>
                ))}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.1em] text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Avaliação</th>
                      <th className="px-4 py-3">Turma</th>
                      <th className="px-4 py-3">Tipo</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Data</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {assessments.map((assessment) => (
                      <tr key={assessment.id}>
                        <td className="px-4 py-3 font-semibold text-[#071827]">
                          {assessment.title}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {assessment.class_id}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {assessment.purpose}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {assessment.status}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {formatDate(assessment.scheduled_at ?? assessment.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      </div>

      <aside className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4 text-sm leading-6 text-slate-700 sm:p-5">
        A classificação gerada pelo Centro de Avaliações é apoio pedagógico. O professor mantém revisão e decisão final sobre classificação, recuperação e recomposição.
      </aside>
    </section>
  )
}
