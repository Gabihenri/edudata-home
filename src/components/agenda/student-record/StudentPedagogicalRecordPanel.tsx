'use client'

import {
  useMemo,
  useState,
} from 'react'

type GradeEntry = {
  id: string
  title: string
  value: number | null
  percentage: number | null
  classification: string
  entry_type: string
  recorded_at: string
}

type OccurrenceItem = {
  id: string
  title: string
  description: string
  nature: string
  severity: string
  status: string
  positive: boolean
  occurred_at: string
}

type CaseItem = {
  id: string
  title: string
  summary: string
  origin: string
  priority: string
  status: string
  opened_at: string
}

type TimelineItem = {
  id: string
  type: 'grade' | 'occurrence' | 'case'
  title: string
  description: string
  occurredAt: string
  tag: string
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

export default function StudentPedagogicalRecordPanel() {
  const [studentId, setStudentId] = useState('')
  const [classId, setClassId] = useState('')
  const [componentId, setComponentId] = useState('')
  const [academicPeriodId, setAcademicPeriodId] = useState('')
  const [grades, setGrades] = useState<GradeEntry[]>([])
  const [occurrences, setOccurrences] = useState<OccurrenceItem[]>([])
  const [cases, setCases] = useState<CaseItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    if (!studentId.trim() || !classId.trim()) {
      setError('Informe estudante e turma para abrir o Caderno Pedagógico.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const gradeParams = new URLSearchParams({
        view: 'gradebook',
        studentId: studentId.trim(),
        classId: classId.trim(),
        componentId: componentId.trim(),
        academicPeriodId: academicPeriodId.trim(),
      })

      const occurrenceParams = new URLSearchParams({
        studentId: studentId.trim(),
        classId: classId.trim(),
        limit: '100',
      })

      const caseParams = new URLSearchParams({
        studentId: studentId.trim(),
        classId: classId.trim(),
        limit: '100',
      })

      if (academicPeriodId.trim()) {
        occurrenceParams.set('academicPeriodId', academicPeriodId.trim())
        caseParams.set('academicPeriodId', academicPeriodId.trim())
      }

      const [gradeResponse, occurrenceResponse, caseResponse] = await Promise.all([
        componentId.trim() && academicPeriodId.trim()
          ? fetch(`/api/agenda/avaliacoes?${gradeParams.toString()}`, {
              credentials: 'include',
              cache: 'no-store',
            })
          : Promise.resolve(null),
        fetch(`/api/agenda/ocorrencias?${occurrenceParams.toString()}`, {
          credentials: 'include',
          cache: 'no-store',
        }),
        fetch(`/api/agenda/casos?${caseParams.toString()}`, {
          credentials: 'include',
          cache: 'no-store',
        }),
      ])

      if (gradeResponse) {
        const gradeBody = await gradeResponse.json() as {
          success?: boolean
          items?: GradeEntry[]
          error?: string
        }
        if (!gradeResponse.ok || !gradeBody.success) {
          throw new Error(gradeBody.error || 'Não foi possível carregar as notas.')
        }
        setGrades(gradeBody.items ?? [])
      } else {
        setGrades([])
      }

      const occurrenceBody = await occurrenceResponse.json() as {
        success?: boolean
        rows?: OccurrenceItem[]
        items?: OccurrenceItem[]
        error?: string
      }
      if (!occurrenceResponse.ok || !occurrenceBody.success) {
        throw new Error(occurrenceBody.error || 'Não foi possível carregar as ocorrências.')
      }
      setOccurrences(occurrenceBody.rows ?? occurrenceBody.items ?? [])

      const caseBody = await caseResponse.json() as {
        success?: boolean
        items?: CaseItem[]
        error?: string
      }
      if (!caseResponse.ok || !caseBody.success) {
        throw new Error(caseBody.error || 'Não foi possível carregar os casos.')
      }
      setCases(caseBody.items ?? [])
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Não foi possível abrir o Caderno Pedagógico.',
      )
    } finally {
      setLoading(false)
    }
  }

  const currentClassification = useMemo(() => {
    const valid = grades.filter(
      item => typeof item.percentage === 'number' && Number.isFinite(item.percentage),
    )
    if (valid.length === 0) return 'not_classified'

    const average = valid.reduce(
      (sum, item) => sum + (item.percentage ?? 0),
      0,
    ) / valid.length

    if (average < 30) return 'critical'
    if (average < 50) return 'initial'
    if (average < 70) return 'developing'
    if (average < 80) return 'adequate'
    if (average < 90) return 'proficient'
    return 'advanced'
  }, [grades])

  const timeline = useMemo<TimelineItem[]>(() => {
    const gradeItems: TimelineItem[] = grades.map(item => ({
      id: item.id,
      type: 'grade',
      title: item.title,
      description:
        item.percentage === null
          ? `Nota registrada: ${item.value ?? '—'}`
          : `Resultado: ${item.percentage}% · ${CLASSIFICATION_LABELS[item.classification] ?? item.classification}`,
      occurredAt: item.recorded_at,
      tag: 'Avaliação',
    }))

    const occurrenceItems: TimelineItem[] = occurrences.map(item => ({
      id: item.id,
      type: 'occurrence',
      title: item.title,
      description: item.description,
      occurredAt: item.occurred_at,
      tag: item.positive ? 'Registro positivo' : 'Ocorrência',
    }))

    const caseItems: TimelineItem[] = cases.map(item => ({
      id: item.id,
      type: 'case',
      title: item.title,
      description: item.summary,
      occurredAt: item.opened_at,
      tag: 'Caso pedagógico',
    }))

    return [...gradeItems, ...occurrenceItems, ...caseItems]
      .filter(item => item.occurredAt)
      .sort(
        (first, second) =>
          new Date(second.occurredAt).getTime() -
          new Date(first.occurredAt).getTime(),
      )
  }, [grades, occurrences, cases])

  const pendingOccurrences = occurrences.filter(
    item => item.status !== 'resolved' && item.status !== 'archived',
  ).length
  const activeCases = cases.filter(
    item => item.status !== 'resolved' && item.status !== 'closed' && item.status !== 'archived',
  ).length

  return (
    <section className="space-y-6">
      <header className="rounded-[1.75rem] border border-slate-200 bg-[#071827] px-5 py-7 text-white shadow-sm sm:px-7">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
          Agenda Inteligente EDI · Student Intelligence
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Caderno Pedagógico Inteligente
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
          Visão longitudinal do estudante que reúne aprendizagem, registros comportamentais e acompanhamento pedagógico em uma única linha do tempo.
        </p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            ['Estudante', studentId, setStudentId, 'ID do estudante'],
            ['Turma', classId, setClassId, 'ID da turma'],
            ['Componente', componentId, setComponentId, 'Opcional para notas'],
            ['Período', academicPeriodId, setAcademicPeriodId, 'Opcional / necessário para notas'],
          ].map(([label, value, setter, placeholder]) => (
            <label key={String(label)} className="block text-sm font-semibold text-slate-700">
              {String(label)}
              <input
                value={String(value)}
                onChange={event => (setter as (value: string) => void)(event.target.value)}
                placeholder={String(placeholder)}
                className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-cyan-500"
              />
            </label>
          ))}
        </div>

        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="mt-4 rounded-xl bg-[#071827] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
        >
          Abrir caderno
        </button>

        {error ? (
          <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            {error}
          </p>
        ) : null}
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-cyan-200 bg-cyan-50 p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-cyan-800">Aprendizagem</p>
          <p className="mt-2 text-xl font-bold text-[#071827]">
            {CLASSIFICATION_LABELS[currentClassification] ?? currentClassification}
          </p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Avaliações/Notas</p>
          <p className="mt-2 text-2xl font-bold text-[#071827]">{grades.length}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Ocorrências pendentes</p>
          <p className="mt-2 text-2xl font-bold text-[#071827]">{pendingOccurrences}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Casos ativos</p>
          <p className="mt-2 text-2xl font-bold text-[#071827]">{activeCases}</p>
        </article>
      </div>

      <section className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">
        <header className="border-b border-slate-200 bg-slate-50 px-5 py-4">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#0B7491]">Timeline educacional</p>
          <h2 className="mt-1 font-bold text-[#071827]">Trajetória consolidada</h2>
        </header>

        {timeline.length === 0 ? (
          <div className="p-6 text-sm text-slate-600">
            Informe o estudante e carregue o caderno para consolidar os registros disponíveis.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {timeline.map(item => (
              <article key={`${item.type}-${item.id}`} className="grid gap-3 px-5 py-5 sm:grid-cols-[130px_minmax(0,1fr)]">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#0B7491]">{item.tag}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {new Intl.DateTimeFormat('pt-BR', {
                      dateStyle: 'short',
                    }).format(new Date(item.occurredAt))}
                  </p>
                </div>
                <div>
                  <h3 className="font-bold text-[#071827]">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#0B7491]">Aprendizagem</p>
          <h2 className="mt-2 font-bold text-[#071827]">Notas e classificações</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {grades.length} registros avaliativos disponíveis no contexto selecionado.
          </p>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#0B7491]">Acompanhamento</p>
          <h2 className="mt-2 font-bold text-[#071827]">Ocorrências</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {occurrences.length} registros, incluindo eventos positivos e situações que demandam acompanhamento.
          </p>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#0B7491]">Intervenção</p>
          <h2 className="mt-2 font-bold text-[#071827]">Casos pedagógicos</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {cases.length} casos estruturados vinculados ao estudante no contexto selecionado.
          </p>
        </section>
      </div>

      <aside className="rounded-2xl border border-cyan-200 bg-cyan-50 p-5 text-sm leading-6 text-slate-700">
        O Caderno Pedagógico é um histórico educacional de apoio profissional. Ele não é prontuário clínico, não produz diagnóstico e não autoriza decisões automáticas sobre o estudante.
      </aside>
    </section>
  )
}
