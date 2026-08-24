'use client'

import { type FormEvent, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

import { usePedagogicalContext } from '@/lib/agenda/hooks/usePedagogicalContext'

type SavedResult = {
  id: string
  studentId: string
  percentage: number | null
  classification: string
  recoveryRequired: boolean
  recompositionRequired: boolean
}

type AssessmentOption = {
  id: string
  title: string
  class_id: string
  academic_period_id: string
  status: string
  scheduled_at: string | null
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
  const {
    classes,
    classesLoading,
    classId,
    changeClass,
    selectedClass,
    students,
    studentsLoading,
    studentId,
    setStudentId,
    selectedStudent,
    academicPeriods,
    periodsLoading,
    academicPeriodId,
    setAcademicPeriodId,
    selectedAcademicPeriod,
  } = usePedagogicalContext()

  const [assessmentId, setAssessmentId] = useState('')
  const [assessments, setAssessments] = useState<AssessmentOption[]>([])
  const [assessmentLoading, setAssessmentLoading] = useState(false)
  const [percentage, setPercentage] = useState('')
  const [feedback, setFeedback] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState<SavedResult | null>(null)

  useEffect(() => {
    async function loadAssessments() {
      setAssessmentId('')
      setAssessments([])
      if (!classId || !academicPeriodId) return

      setAssessmentLoading(true)
      try {
        const params = new URLSearchParams({
          classId,
          academicPeriodId,
          limit: '100',
        })
        const response = await fetch(`/api/agenda/avaliacoes?${params.toString()}`, {
          credentials: 'include',
          cache: 'no-store',
        })
        const body = await response.json() as {
          success?: boolean
          assessments?: AssessmentOption[]
          error?: string
        }

        if (!response.ok || !body.success) {
          throw new Error(body.error || 'Não foi possível carregar as avaliações.')
        }

        setAssessments(body.assessments ?? [])
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar as avaliações.')
      } finally {
        setAssessmentLoading(false)
      }
    }

    void loadAssessments()
  }, [classId, academicPeriodId])

  const selectedAssessment = useMemo(
    () => assessments.find(item => item.id === assessmentId) ?? null,
    [assessments, assessmentId],
  )

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError(null)
    setSaved(null)

    try {
      if (!assessmentId || !studentId || !classId || !academicPeriodId) {
        throw new Error('Selecione turma, período, avaliação e estudante.')
      }

      const numericPercentage = Number(percentage)
      if (!Number.isFinite(numericPercentage) || numericPercentage < 0 || numericPercentage > 100) {
        throw new Error('Informe um percentual válido entre 0 e 100.')
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
              assessmentTitle: selectedAssessment?.title ?? null,
              studentName: selectedStudent?.full_name ?? null,
              className: selectedClass?.name ?? null,
              academicPeriodName: selectedAcademicPeriod?.name ?? null,
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
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">Agenda Inteligente EDI · Diagnóstico</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Resultados da Avaliação Diagnóstica</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
          Selecione o contexto já existente e registre apenas o desempenho observado e a devolutiva profissional.
        </p>
      </header>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <form onSubmit={handleSubmit} className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0B7491]">Contexto da avaliação</p>
          <h2 className="mt-2 text-xl font-bold text-[#071827]">Registrar resultado</h2>

          <div className="mt-5 space-y-4">
            <label className="block text-sm font-semibold text-slate-700">
              Turma
              <select value={classId} onChange={event => changeClass(event.target.value)} disabled={classesLoading} required className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 font-normal">
                <option value="">Selecione a turma</option>
                {classes.map(item => <option key={item.id} value={item.id}>{item.name}{item.subject ? ` · ${item.subject}` : ''}</option>)}
              </select>
            </label>

            <label className="block text-sm font-semibold text-slate-700">
              Período letivo
              <select value={academicPeriodId} onChange={event => setAcademicPeriodId(event.target.value)} disabled={periodsLoading || academicPeriods.length === 0} required className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 font-normal">
                <option value="">Selecione o período</option>
                {academicPeriods.map(period => <option key={period.id} value={period.id}>{period.name}</option>)}
              </select>
            </label>

            <label className="block text-sm font-semibold text-slate-700">
              Avaliação
              <select value={assessmentId} onChange={event => setAssessmentId(event.target.value)} disabled={!classId || !academicPeriodId || assessmentLoading} required className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 font-normal">
                <option value="">
                  {assessmentLoading ? 'Carregando avaliações...' : assessments.length === 0 ? 'Nenhuma avaliação no contexto' : 'Selecione a avaliação'}
                </option>
                {assessments.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}
              </select>
            </label>

            {classId && academicPeriodId && !assessmentLoading && assessments.length === 0 ? (
              <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-4">
                <p className="font-semibold text-[#071827]">
                  Falta apenas criar a avaliação para registrar o resultado.
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  O resultado precisa ficar vinculado a uma avaliação. Crie o instrumento para esta turma e período e depois volte para continuar o registro.
                </p>
                <Link
                  href="/agenda/avaliacoes"
                  className="mt-3 inline-flex min-h-11 items-center rounded-xl bg-[#071827] px-4 py-2 text-sm font-bold text-white"
                >
                  Criar avaliação
                </Link>
              </div>
            ) : null}

            <label className="block text-sm font-semibold text-slate-700">
              Estudante
              <select value={studentId} onChange={event => setStudentId(event.target.value)} disabled={!classId || studentsLoading} required className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 font-normal">
                <option value="">{studentsLoading ? 'Carregando estudantes...' : 'Selecione o estudante'}</option>
                {students.map(student => (
                  <option key={student.id} value={student.id}>{student.sequence_number ? `${student.sequence_number}. ` : ''}{student.full_name}</option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-semibold text-slate-700">
              Percentual de desempenho
              <input required type="number" min="0" max="100" step="0.01" value={percentage} onChange={event => setPercentage(event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-3 font-normal outline-none focus:border-cyan-500" />
            </label>

            <label className="block text-sm font-semibold text-slate-700">
              Devolutiva do professor
              <textarea value={feedback} onChange={event => setFeedback(event.target.value)} rows={4} className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-cyan-500" />
            </label>
          </div>

          {error ? <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{error}</p> : null}

          <button
            type="submit"
            disabled={saving || !assessmentId || !studentId}
            title={!assessmentId ? 'Selecione ou crie uma avaliação para continuar.' : !studentId ? 'Selecione um estudante para continuar.' : undefined}
            className="mt-5 w-full rounded-xl bg-[#071827] px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? 'Registrando...' : !assessmentId ? 'Selecione ou crie uma avaliação' : !studentId ? 'Selecione um estudante' : 'Registrar e classificar'}
          </button>
        </form>

        <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0B7491]">Classificação da aprendizagem</p>
          <h2 className="mt-2 text-xl font-bold text-[#071827]">Resultado revisável</h2>

          {!saved ? (
            <p className="mt-5 text-sm leading-6 text-slate-600">Registre um resultado para visualizar a classificação e os sinais de recuperação ou recomposição.</p>
          ) : (
            <div className="mt-5 space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Desempenho</p>
                  <p className="mt-2 text-3xl font-bold text-[#071827]">{saved.percentage ?? '—'}%</p>
                </article>
                <article className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-cyan-800">Nível</p>
                  <p className="mt-2 text-xl font-bold text-[#071827]">{LABELS[saved.classification] ?? saved.classification}</p>
                </article>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <article className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-sm font-semibold text-[#071827]">Recuperação</p>
                  <p className="mt-1 text-sm text-slate-600">{saved.recoveryRequired ? 'Sinalizada para análise do professor.' : 'Sem sinal automático neste resultado.'}</p>
                </article>
                <article className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-sm font-semibold text-[#071827]">Recomposição</p>
                  <p className="mt-1 text-sm text-slate-600">{saved.recompositionRequired ? 'Sinalizada para análise do professor.' : 'Sem sinal automático neste resultado.'}</p>
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
