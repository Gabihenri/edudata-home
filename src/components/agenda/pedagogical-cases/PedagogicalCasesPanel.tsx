'use client'

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from 'react'

import { usePedagogicalContext } from '@/lib/agenda/hooks/usePedagogicalContext'

type CaseItem = {
  id: string
  student_id: string | null
  class_id: string
  title: string
  summary: string
  origin: string
  priority: string
  status: string
  opened_at: string
  next_review_at: string | null
}

type CasesResponse = {
  success: boolean
  items: CaseItem[]
  summary?: {
    total: number
    open: number
    underFollowUp: number
    resolved: number
    urgent: number
  }
  error?: string
}

const STATUS_LABELS: Record<string, string> = {
  open: 'Aberto',
  under_analysis: 'Em análise',
  action_plan_defined: 'Plano definido',
  under_follow_up: 'Em acompanhamento',
  resolved: 'Resolvido',
  closed: 'Encerrado',
  archived: 'Arquivado',
}

const PRIORITY_LABELS: Record<string, string> = {
  low: 'Baixa',
  moderate: 'Moderada',
  high: 'Alta',
  urgent: 'Urgente',
}

export default function PedagogicalCasesPanel() {
  const {
    classes,
    classesLoading,
    classesError,
    classId,
    changeClass,
    selectedClass,
    students,
    studentsLoading,
    studentsError,
    studentId,
    setStudentId,
    selectedStudent,
    academicPeriods,
    periodsLoading,
    periodsError,
    academicPeriodId,
    setAcademicPeriodId,
    selectedAcademicPeriod,
  } = usePedagogicalContext()

  const [title, setTitle] = useState('')
  const [summaryText, setSummaryText] = useState('')
  const [origin, setOrigin] = useState('teacher_observation')
  const [priority, setPriority] = useState('moderate')
  const [nextReviewAt, setNextReviewAt] = useState('')
  const [items, setItems] = useState<CaseItem[]>([])
  const [summary, setSummary] = useState<CasesResponse['summary']>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [search, setSearch] = useState('')

  async function load() {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({ limit: '100' })
      if (studentId.trim()) params.set('studentId', studentId.trim())
      if (classId.trim()) params.set('classId', classId.trim())
      if (academicPeriodId.trim()) params.set('academicPeriodId', academicPeriodId.trim())

      const response = await fetch(`/api/agenda/casos?${params.toString()}`, {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      })
      const body = await response.json() as CasesResponse

      if (!response.ok || !body.success) {
        throw new Error(body.error || 'Não foi possível carregar os casos.')
      }

      setItems(body.items ?? [])
      setSummary(body.summary)
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Não foi possível carregar os casos.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // A consulta inicial não deve depender do formulário de criação.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!classId || !studentId) {
      setError('Selecione uma turma e um estudante antes de abrir o caso.')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/agenda/casos', {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          studentId,
          studentIds: [studentId],
          classId,
          academicPeriodId: academicPeriodId || null,
          title,
          summary: summaryText,
          origin,
          priority,
          occurrenceIds: [],
          assessmentIds: [],
          evidenceIds: [],
          interventionIds: [],
          objectives: [],
          actions: [],
          successCriteria: [],
          responsibleUserIds: [],
          nextReviewAt: nextReviewAt || null,
          correlationId: `pedagogical-case:${Date.now()}`,
          metadata: {
            source: 'agenda_pedagogical_cases_panel',
            className: selectedClass?.name ?? null,
            studentName: selectedStudent?.full_name ?? null,
            academicPeriodName: selectedAcademicPeriod?.name ?? null,
          },
        }),
      })

      const body = await response.json() as {
        success?: boolean
        error?: string
      }

      if (!response.ok || !body.success) {
        throw new Error(body.error || 'Não foi possível abrir o caso.')
      }

      setSuccess('Caso pedagógico aberto e registrado para acompanhamento.')
      setTitle('')
      setSummaryText('')
      setNextReviewAt('')
      setCreateOpen(false)
      await load()
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Não foi possível abrir o caso.',
      )
    } finally {
      setLoading(false)
    }
  }

  async function changeStatus(caseId: string, status: string) {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/agenda/casos', {
        method: 'PATCH',
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ caseId, status }),
      })

      const body = await response.json() as {
        success?: boolean
        error?: string
      }

      if (!response.ok || !body.success) {
        throw new Error(body.error || 'Não foi possível atualizar o caso.')
      }

      await load()
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : 'Não foi possível atualizar o caso.',
      )
    } finally {
      setLoading(false)
    }
  }

  const visibleItems = useMemo(() => {
    const normalized = search.trim().toLocaleLowerCase('pt-BR')
    if (!normalized) return items

    return items.filter(item =>
      [item.title, item.summary, STATUS_LABELS[item.status], PRIORITY_LABELS[item.priority]]
        .filter(Boolean)
        .some(value => String(value).toLocaleLowerCase('pt-BR').includes(normalized)),
    )
  }, [items, search])

  return (
    <section className="space-y-6">
      <header className="rounded-[1.75rem] border border-slate-200 bg-[#071827] px-5 py-7 text-white shadow-sm sm:px-7">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
          Agenda Inteligente EDI · Acompanhamento
        </p>
        <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Casos Pedagógicos</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
              Consulte o acompanhamento já registrado e abra um novo caso somente a partir de turma, estudante e período existentes no contexto pedagógico.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCreateOpen(current => !current)}
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#0B7491] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#09657E]"
          >
            {createOpen ? 'Fechar cadastro' : 'Abrir novo caso'}
          </button>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          ['Total', summary?.total ?? 0],
          ['Abertos', summary?.open ?? 0],
          ['Em acompanhamento', summary?.underFollowUp ?? 0],
          ['Resolvidos', summary?.resolved ?? 0],
          ['Urgentes', summary?.urgent ?? 0],
        ].map(([label, value]) => (
          <article key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{String(label)}</p>
            <p className="mt-2 text-2xl font-bold text-[#071827]">{String(value)}</p>
          </article>
        ))}
      </div>

      {createOpen ? (
        <form onSubmit={handleSubmit} className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0B7491]">Operação</p>
              <h2 className="mt-1 text-xl font-bold text-[#071827]">Abrir caso pedagógico</h2>
            </div>
            <p className="text-xs text-slate-500">Os dados de contexto são reaproveitados da Agenda.</p>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            <label className="block text-sm font-semibold text-slate-700">
              Turma
              <select
                value={classId}
                onChange={event => changeClass(event.target.value)}
                disabled={classesLoading}
                required
                className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-normal"
              >
                <option value="">{classesLoading ? 'Carregando turmas...' : 'Selecione a turma'}</option>
                {classes.map(item => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-semibold text-slate-700">
              Estudante
              <select
                value={studentId}
                onChange={event => setStudentId(event.target.value)}
                disabled={!classId || studentsLoading}
                required
                className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-normal"
              >
                <option value="">
                  {!classId
                    ? 'Selecione a turma primeiro'
                    : studentsLoading
                      ? 'Carregando estudantes...'
                      : 'Selecione o estudante'}
                </option>
                {students.map(student => (
                  <option key={student.id} value={student.id}>
                    {student.sequence_number ? `${student.sequence_number}. ` : ''}{student.full_name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-semibold text-slate-700">
              Período letivo
              <select
                value={academicPeriodId}
                onChange={event => setAcademicPeriodId(event.target.value)}
                disabled={periodsLoading || academicPeriods.length === 0}
                className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-normal"
              >
                <option value="">
                  {periodsLoading
                    ? 'Carregando períodos...'
                    : academicPeriods.length === 0
                      ? 'Período ainda não configurado'
                      : 'Selecione o período'}
                </option>
                {academicPeriods.map(period => (
                  <option key={period.id} value={period.id}>{period.name}</option>
                ))}
              </select>
            </label>
          </div>

          {(classesError || studentsError || periodsError) ? (
            <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              {classesError || studentsError || periodsError}
            </p>
          ) : null}

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <label className="block text-sm font-semibold text-slate-700 lg:col-span-2">
              Título
              <input value={title} onChange={event => setTitle(event.target.value)} required className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal" />
            </label>

            <label className="block text-sm font-semibold text-slate-700 lg:col-span-2">
              Motivo e contexto
              <textarea value={summaryText} onChange={event => setSummaryText(event.target.value)} required rows={4} className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal" />
            </label>

            <label className="block text-sm font-semibold text-slate-700">
              Origem
              <select value={origin} onChange={event => setOrigin(event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-normal">
                <option value="teacher_observation">Observação docente</option>
                <option value="occurrence">Ocorrência</option>
                <option value="assessment">Avaliação</option>
                <option value="attendance">Frequência</option>
                <option value="evidence">Evidência</option>
                <option value="coordination">Coordenação</option>
                <option value="family_contact">Contato com família</option>
                <option value="other">Outro</option>
              </select>
            </label>

            <label className="block text-sm font-semibold text-slate-700">
              Prioridade
              <select value={priority} onChange={event => setPriority(event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-normal">
                <option value="low">Baixa</option>
                <option value="moderate">Moderada</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
              </select>
            </label>

            <label className="block text-sm font-semibold text-slate-700 lg:col-span-2">
              Próxima revisão
              <input type="datetime-local" value={nextReviewAt} onChange={event => setNextReviewAt(event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal" />
            </label>
          </div>

          {error ? <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{error}</p> : null}
          {success ? <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{success}</p> : null}

          <button
            type="submit"
            disabled={loading || !classId || !studentId}
            className="mt-5 inline-flex min-h-12 items-center justify-center rounded-xl bg-[#071827] px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
          >
            {loading ? 'Salvando...' : 'Abrir caso pedagógico'}
          </button>
        </form>
      ) : null}

      <section className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">
        <header className="border-b border-slate-200 bg-slate-50 px-5 py-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#0B7491]">Consulta</p>
              <h2 className="mt-1 font-bold text-[#071827]">Casos registrados</h2>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder="Pesquisar casos"
                className="min-h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-cyan-500"
              />
              <button type="button" onClick={() => void load()} disabled={loading} className="min-h-11 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-60">
                Atualizar
              </button>
            </div>
          </div>
        </header>

        {visibleItems.length === 0 ? (
          <div className="p-6 text-sm text-slate-600">Nenhum caso encontrado.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {visibleItems.map(item => (
              <article key={item.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap gap-2 text-xs font-bold uppercase tracking-[0.1em]">
                      <span className="text-[#0B7491]">{PRIORITY_LABELS[item.priority] ?? item.priority}</span>
                      <span className="text-slate-400">·</span>
                      <span className="text-slate-500">{STATUS_LABELS[item.status] ?? item.status}</span>
                    </div>
                    <h3 className="mt-2 text-lg font-bold text-[#071827]">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{item.summary}</p>
                  </div>
                  <select
                    value={item.status}
                    onChange={event => void changeStatus(item.id, event.target.value)}
                    className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
                  >
                    <option value="open">Aberto</option>
                    <option value="under_analysis">Em análise</option>
                    <option value="action_plan_defined">Plano definido</option>
                    <option value="under_follow_up">Em acompanhamento</option>
                    <option value="resolved">Resolvido</option>
                    <option value="closed">Encerrado</option>
                  </select>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <aside className="rounded-2xl border border-cyan-200 bg-cyan-50 p-5 text-sm leading-6 text-slate-700">
        Um caso pedagógico organiza acompanhamento e responsabilidade. Ele não representa diagnóstico clínico, punição ou classificação automática do estudante.
      </aside>
    </section>
  )
}
