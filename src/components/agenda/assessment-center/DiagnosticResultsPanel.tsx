'use client'

import {
  FormEvent,
  useState,
} from 'react'

type SavedResult = {
  id: string
  studentId: string
  percentage: number | null
  classification: string
  recoveryRequired: boolean
  recompositionRequired: boolean
}

const LABELS: Record<string, string> = {
  critical: 'Crítico',
  initial: 'Inicial',
  developing: 'Em desenvolvimento',
  adequate: 'Adequado',
  proficient: 'Proficiente',
  advanced: 'Avançado',
  not_classified: 'Não classificado',
}

export default function DiagnosticResultsPanel() {
  const [assessmentId, setAssessmentId] = useState('')
  const [studentId, setStudentId] = useState('')
  const [classId, setClassId] = useState('')
  const [academicPeriodId, setAcademicPeriodId] = useState('')
  const [percentage, setPercentage] = useState('')
  const [feedback, setFeedback] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState<SavedResult | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError(null)
    setSaved(null)

    try {
      const numericPercentage = Number(percentage)
      if (!Number.isFinite(numericPercentage)) {
        throw new Error('Informe um percentual válido.')
      }

      const response = await fetch('/api/agenda/avaliacoes', {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          operation: 'save_result',
          result: {
            assessmentId,
            studentId,
            classId,
            academicPeriodId,
            status: 'reviewed',
            percentage: numericPercentage,
            teacherFeedback: feedback || null,
            criterionResults: [],
            learningOutcomeResults: [],
            metadata: {
              source: 'agenda_diagnostic_results',
              humanReviewed: true,
            },
          },
        }),
      })

      const body = await response.json() as {
        success?: boolean
        error?: string
        result?: SavedResult
      }

      if (!response.ok || !body.success || !body.result) {
        throw new Error(body.error || 'Não foi possível registrar o resultado.')
      }

      setSaved(body.result)
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Não foi possível registrar o resultado.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="space-y-6">
      <header className="rounded-[1.75rem] border border-slate-200 bg-[#071827] px-5 py-7 text-white shadow-sm sm:px-7">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
          Agenda Inteligente EDI · Diagnóstico
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Resultados da Avaliação Diagnóstica
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
          Registre o desempenho observado e obtenha uma classificação pedagógica transparente, sempre sujeita à revisão profissional.
        </p>
      </header>

      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <form
          onSubmit={handleSubmit}
          className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
        >
          <h2 className="text-xl font-bold text-[#071827]">
            Registrar resultado
          </h2>

          <div className="mt-5 space-y-4">
            {[
              ['Avaliação', assessmentId, setAssessmentId, 'ID da avaliação'],
              ['Estudante', studentId, setStudentId, 'ID do estudante'],
              ['Turma', classId, setClassId, 'ID da turma'],
              ['Período letivo', academicPeriodId, setAcademicPeriodId, 'ID do período'],
            ].map(([label, value, setter, placeholder]) => (
              <label key={String(label)} className="block text-sm font-semibold text-slate-700">
                {String(label)}
                <input
                  required
                  value={String(value)}
                  onChange={(event) => (setter as (next: string) => void)(event.target.value)}
                  placeholder={String(placeholder)}
                  className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-cyan-500"
                />
              </label>
            ))}

            <label className="block text-sm font-semibold text-slate-700">
              Percentual de desempenho
              <input
                required
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={percentage}
                onChange={(event) => setPercentage(event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-cyan-500"
              />
            </label>

            <label className="block text-sm font-semibold text-slate-700">
              Devolutiva do professor
              <textarea
                value={feedback}
                onChange={(event) => setFeedback(event.target.value)}
                rows={4}
                className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-cyan-500"
              />
            </label>
          </div>

          {error ? (
            <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={saving}
            className="mt-5 w-full rounded-xl bg-[#071827] px-5 py-3 text-sm font-bold text-white disabled:opacity-60"
          >
            {saving ? 'Registrando...' : 'Registrar e classificar'}
          </button>
        </form>

        <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0B7491]">
            Classificação da aprendizagem
          </p>
          <h2 className="mt-2 text-xl font-bold text-[#071827]">
            Resultado revisável
          </h2>

          {!saved ? (
            <p className="mt-5 text-sm leading-6 text-slate-600">
              Registre um resultado para visualizar a classificação e os sinais de recuperação ou recomposição.
            </p>
          ) : (
            <div className="mt-5 space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                    Desempenho
                  </p>
                  <p className="mt-2 text-3xl font-bold text-[#071827]">
                    {saved.percentage ?? '—'}%
                  </p>
                </article>
                <article className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-cyan-800">
                    Nível
                  </p>
                  <p className="mt-2 text-xl font-bold text-[#071827]">
                    {LABELS[saved.classification] ?? saved.classification}
                  </p>
                </article>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <article className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-sm font-semibold text-[#071827]">Recuperação</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {saved.recoveryRequired ? 'Sinalizada para análise do professor.' : 'Sem sinal automático neste resultado.'}
                  </p>
                </article>
                <article className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-sm font-semibold text-[#071827]">Recomposição</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {saved.recompositionRequired ? 'Sinalizada para análise do professor.' : 'Sem sinal automático neste resultado.'}
                  </p>
                </article>
              </div>
            </div>
          )}

          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            A classificação não rotula o estudante e não autoriza intervenção automática. Ela organiza a evidência diagnóstica para apoiar a decisão profissional.
          </div>
        </section>
      </div>
    </section>
  )
}
