'use client'

import { useMemo, useState } from 'react'

import { usePedagogicalContext } from '@/lib/agenda/hooks/usePedagogicalContext'

type GradeEntry = {
  id: string
  title: string
  value: number | null
  percentage: number | null
  weight: number
  classification: string
  entry_type: string
  recorded_at: string
}

type GradebookResponse = {
  success: boolean
  items: GradeEntry[]
  error?: string
}

const CLASSIFICATION_LABELS: Record<string, string> = {
  critical: 'Crítico',
  initial: 'Inicial',
  developing: 'Em desenvolvimento',
  adequate: 'Adequado',
  proficient: 'Proficiente',
  advanced: 'Avançado',
  not_classified: 'Não classificado',
}

const CLASSIFICATION_PRIORITY: Record<string, number> = {
  critical: 1,
  initial: 2,
  developing: 3,
  adequate: 4,
  proficient: 5,
  advanced: 6,
  not_classified: 0,
}

function classifyPercentage(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return 'not_classified'
  if (value < 30) return 'critical'
  if (value < 50) return 'initial'
  if (value < 70) return 'developing'
  if (value < 80) return 'adequate'
  if (value < 90) return 'proficient'
  return 'advanced'
}

export default function LearningClassificationPanel() {
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

  const [items, setItems] = useState<GradeEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const componentId = selectedClass?.subject?.trim() ?? ''

  async function load() {
    if (!studentId || !classId || !componentId || !academicPeriodId) {
      setError('Selecione turma, estudante e período. O componente é herdado da turma cadastrada.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        view: 'gradebook',
        studentId,
        classId,
        componentId,
        academicPeriodId,
      })

      const response = await fetch(`/api/agenda/avaliacoes?${params.toString()}`, {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      })

      const body = await response.json() as GradebookResponse

      if (!response.ok || !body.success) {
        throw new Error(body.error || 'Não foi possível carregar a classificação.')
      }

      setItems(body.items ?? [])
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Não foi possível carregar a classificação.',
      )
    } finally {
      setLoading(false)
    }
  }

  const summary = useMemo(() => {
    const valid = items.filter(
      item => typeof item.percentage === 'number' && Number.isFinite(item.percentage),
    )

    if (valid.length === 0) {
      return {
        average: null as number | null,
        classification: 'not_classified',
        trend: 'insufficient_data',
        requiresIntervention: false,
      }
    }

    const average = valid.reduce(
      (sum, item) => sum + (item.percentage ?? 0),
      0,
    ) / valid.length

    const ordered = [...valid].sort(
      (first, second) =>
        new Date(first.recorded_at).getTime() -
        new Date(second.recorded_at).getTime(),
    )

    const first = ordered[0]?.percentage ?? average
    const latest = ordered[ordered.length - 1]?.percentage ?? average
    const delta = latest - first
    const trend =
      ordered.length < 2
        ? 'insufficient_data'
        : Math.abs(delta) < 2
          ? 'stable'
          : delta > 0
            ? 'up'
            : 'down'

    const classification = classifyPercentage(average)

    return {
      average,
      classification,
      trend,
      requiresIntervention:
        CLASSIFICATION_PRIORITY[classification] > 0 &&
        CLASSIFICATION_PRIORITY[classification] <= 3,
    }
  }, [items])

  const trendLabel =
    summary.trend === 'up'
      ? 'Em evolução'
      : summary.trend === 'down'
        ? 'Em queda'
        : summary.trend === 'stable'
          ? 'Estável'
          : 'Dados insuficientes'

  return (
    <section className="space-y-6">
      <header className="rounded-[1.75rem] border border-slate-200 bg-[#071827] px-5 py-7 text-white shadow-sm sm:px-7">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">Agenda Inteligente EDI · Avaliação da Aprendizagem</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Classificação da Aprendizagem</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
          Consolidação transparente das evidências avaliativas usando o contexto já registrado. A decisão pedagógica permanece com o professor.
        </p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0B7491]">Contexto de consulta</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="block text-sm font-semibold text-slate-700">
            Turma
            <select value={classId} onChange={event => { changeClass(event.target.value); setItems([]) }} disabled={classesLoading} className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 font-normal">
              <option value="">Selecione a turma</option>
              {classes.map(item => <option key={item.id} value={item.id}>{item.name}{item.subject ? ` · ${item.subject}` : ''}</option>)}
            </select>
          </label>

          <label className="block text-sm font-semibold text-slate-700">
            Estudante
            <select value={studentId} onChange={event => { setStudentId(event.target.value); setItems([]) }} disabled={!classId || studentsLoading} className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 font-normal">
              <option value="">{!classId ? 'Selecione a turma primeiro' : studentsLoading ? 'Carregando estudantes...' : 'Selecione o estudante'}</option>
              {students.map(student => <option key={student.id} value={student.id}>{student.sequence_number ? `${student.sequence_number}. ` : ''}{student.full_name}</option>)}
            </select>
          </label>

          <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-3 text-sm text-slate-700">
            <p className="text-xs font-bold uppercase text-[#0B7491]">Componente</p>
            <p className="mt-2 font-semibold">{componentId || 'Selecione uma turma configurada'}</p>
          </div>

          <label className="block text-sm font-semibold text-slate-700">
            Período letivo
            <select value={academicPeriodId} onChange={event => { setAcademicPeriodId(event.target.value); setItems([]) }} disabled={periodsLoading || academicPeriods.length === 0} className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 font-normal">
              <option value="">Selecione o período</option>
              {academicPeriods.map(period => <option key={period.id} value={period.id}>{period.name}</option>)}
            </select>
          </label>
        </div>

        <button type="button" onClick={() => void load()} disabled={loading || !studentId || !componentId || !academicPeriodId} className="mt-4 rounded-xl bg-[#071827] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
          {loading ? 'Atualizando...' : 'Atualizar classificação'}
        </button>

        {error ? <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{error}</p> : null}
      </section>

      {selectedStudent ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm">
          <span className="font-bold text-[#071827]">{selectedStudent.full_name}</span>
          <span className="mx-2 text-slate-300">·</span>
          {selectedClass?.name ?? 'Turma'}
          <span className="mx-2 text-slate-300">·</span>
          {selectedAcademicPeriod?.name ?? 'Período'}
        </section>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Média percentual</p>
          <p className="mt-2 text-3xl font-bold text-[#071827]">{summary.average === null ? '—' : `${summary.average.toFixed(1)}%`}</p>
        </article>
        <article className="rounded-2xl border border-cyan-200 bg-cyan-50 p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-cyan-800">Nível atual</p>
          <p className="mt-2 text-xl font-bold text-[#071827]">{CLASSIFICATION_LABELS[summary.classification] ?? summary.classification}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Tendência</p>
          <p className="mt-2 text-xl font-bold text-[#071827]">{trendLabel}</p>
        </article>
        <article className={`rounded-2xl border p-5 shadow-sm ${summary.requiresIntervention ? 'border-amber-200 bg-amber-50' : 'border-emerald-200 bg-emerald-50'}`}>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-600">Acompanhamento</p>
          <p className="mt-2 text-xl font-bold text-[#071827]">{summary.requiresIntervention ? 'Requer atenção' : 'Sem alerta atual'}</p>
        </article>
      </div>

      <section className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">
        <header className="border-b border-slate-200 bg-slate-50 px-5 py-4">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#0B7491]">Histórico classificatório</p>
          <h2 className="mt-1 font-bold text-[#071827]">Evolução dos instrumentos registrados</h2>
        </header>

        {items.length === 0 ? (
          <div className="p-6 text-sm text-slate-600">Nenhum lançamento carregado.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {items.map(item => (
              <div key={item.id} className="grid gap-3 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_100px_180px] sm:items-center">
                <div>
                  <p className="font-semibold text-[#071827]">{item.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.entry_type}</p>
                </div>
                <p className="text-sm font-semibold text-slate-700">{item.percentage === null ? '—' : `${item.percentage}%`}</p>
                <p className="text-sm font-semibold text-[#075F78]">{CLASSIFICATION_LABELS[item.classification] ?? item.classification}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <aside className="rounded-2xl border border-cyan-200 bg-cyan-50 p-5 text-sm leading-6 text-slate-700">
        A classificação é um apoio interpretativo baseado em faixas explícitas. Ela não rotula o estudante, não substitui avaliação profissional e não autoriza intervenção automática.
      </aside>
    </section>
  )
}
