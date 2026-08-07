'use client'

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

import { usePedagogicalContext } from '@/lib/agenda/hooks/usePedagogicalContext'

type OccurrenceRow = {
  id: string
  student_id: string
  class_id: string
  nature: string
  severity: string
  status: string
  title: string
  description: string
  positive: boolean
  requires_follow_up: boolean
  occurred_at: string
}

type ListResponse = {
  success: boolean
  rows?: OccurrenceRow[]
  error?: string
}

const natureOptions = [
  ['behavior', 'Comportamento'],
  ['coexistence', 'Convivência'],
  ['attendance', 'Frequência'],
  ['engagement', 'Engajamento'],
  ['pedagogical', 'Pedagógica'],
  ['mediation', 'Mediação'],
  ['positive_recognition', 'Reconhecimento positivo'],
  ['leadership', 'Liderança'],
  ['protagonism', 'Protagonismo'],
  ['collaboration', 'Colaboração'],
  ['support_needed', 'Necessidade de apoio'],
  ['other', 'Outro'],
] as const

const severityOptions = [
  ['informational', 'Informativa'],
  ['low', 'Baixa'],
  ['moderate', 'Moderada'],
  ['high', 'Alta'],
  ['critical', 'Crítica'],
] as const

const natureLabels = Object.fromEntries(natureOptions)
const severityLabels = Object.fromEntries(severityOptions)

function formatDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Data indisponível'

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}

export default function StudentOccurrencesPanel() {
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
  } = usePedagogicalContext()

  const [rows, setRows] = useState<OccurrenceRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [nature, setNature] = useState('pedagogical')
  const [severity, setSeverity] = useState('informational')

  const loadRows = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({ limit: '100' })
      if (classId) params.set('classId', classId)
      if (studentId) params.set('studentId', studentId)
      if (academicPeriodId) params.set('academicPeriodId', academicPeriodId)

      const response = await fetch(
        `/api/agenda/ocorrencias?${params.toString()}`,
        { cache: 'no-store', credentials: 'include' },
      )

      const payload = await response.json() as ListResponse

      if (!response.ok || !payload.success) {
        throw new Error(payload.error ?? 'Não foi possível carregar as ocorrências.')
      }

      setRows(payload.rows ?? [])
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Não foi possível carregar as ocorrências.',
      )
    } finally {
      setLoading(false)
    }
  }, [classId, studentId, academicPeriodId])

  useEffect(() => {
    void loadRows()
  }, [loadRows])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!classId || !studentId) {
      setError('Selecione a turma e o estudante antes de registrar a ocorrência.')
      return
    }

    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      const response = await fetch('/api/agenda/ocorrencias', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          classId,
          academicPeriodId: academicPeriodId || null,
          nature,
          severity,
          title,
          description,
          correlationId: `agenda-occurrence:${Date.now()}`,
          metadata: {
            className: selectedClass?.name ?? null,
            studentName: selectedStudent?.full_name ?? null,
          },
        }),
      })

      const payload = await response.json() as {
        success: boolean
        error?: string
      }

      if (!response.ok || !payload.success) {
        throw new Error(payload.error ?? 'Não foi possível registrar a ocorrência.')
      }

      setTitle('')
      setDescription('')
      setCreateOpen(false)
      setSuccess('Ocorrência registrada e vinculada ao estudante selecionado.')
      await loadRows()
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Não foi possível registrar a ocorrência.',
      )
    } finally {
      setSaving(false)
    }
  }

  const visibleRows = useMemo(() => {
    const normalized = search.trim().toLocaleLowerCase('pt-BR')
    if (!normalized) return rows

    return rows.filter(row =>
      [
        row.title,
        row.description,
        natureLabels[row.nature as keyof typeof natureLabels],
        severityLabels[row.severity as keyof typeof severityLabels],
        row.status,
      ]
        .filter(Boolean)
        .some(value => String(value).toLocaleLowerCase('pt-BR').includes(normalized)),
    )
  }, [rows, search])

  const classNames = useMemo(
    () => new Map(classes.map(item => [item.id, item.name])),
    [classes],
  )

  return (
    <div className="space-y-6">
      <section className="rounded-[1.75rem] border border-slate-200 bg-[#071827] p-6 text-white shadow-sm sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
              Acompanhamento longitudinal
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Ocorrências educacionais</h1>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Consulte o histórico e registre novas situações somente a partir de uma turma e de um estudante já cadastrados.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCreateOpen(current => !current)}
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#0B7491] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#09657E]"
          >
            {createOpen ? 'Fechar registro' : 'Registrar ocorrência'}
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(200px,0.45fr)_minmax(220px,0.5fr)_auto]">
          <input
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Pesquisar no histórico"
            className="min-h-12 rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-cyan-500"
          />
          <select
            value={classId}
            onChange={event => changeClass(event.target.value)}
            disabled={classesLoading}
            className="min-h-12 rounded-xl border border-slate-300 bg-white px-3 text-sm"
          >
            <option value="">Todas as turmas</option>
            {classes.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <select
            value={studentId}
            onChange={event => setStudentId(event.target.value)}
            disabled={!classId || studentsLoading}
            className="min-h-12 rounded-xl border border-slate-300 bg-white px-3 text-sm"
          >
            <option value="">{classId ? 'Todos os estudantes' : 'Selecione uma turma'}</option>
            {students.map(student => (
              <option key={student.id} value={student.id}>
                {student.sequence_number ? `${student.sequence_number}. ` : ''}{student.full_name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => void loadRows()}
            disabled={loading}
            className="min-h-12 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700"
          >
            Atualizar
          </button>
        </div>
      </section>

      {createOpen ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B7491]">Operação</p>
            <h2 className="mt-2 text-2xl font-bold text-[#071827]">Registrar ocorrência educacional</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              O contexto pedagógico é herdado da Agenda. O professor registra somente a informação nova.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="text-sm font-semibold text-slate-700">
              Turma
              <select
                value={classId}
                onChange={event => changeClass(event.target.value)}
                disabled={classesLoading}
                required
                className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 font-normal"
              >
                <option value="">Selecione a turma</option>
                {classes.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </label>

            <label className="text-sm font-semibold text-slate-700">
              Estudante
              <select
                value={studentId}
                onChange={event => setStudentId(event.target.value)}
                disabled={!classId || studentsLoading}
                required
                className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 font-normal"
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

            <label className="text-sm font-semibold text-slate-700">
              Período letivo
              <select
                value={academicPeriodId}
                onChange={event => setAcademicPeriodId(event.target.value)}
                disabled={periodsLoading || academicPeriods.length === 0}
                className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 font-normal"
              >
                <option value="">
                  {periodsLoading
                    ? 'Carregando períodos...'
                    : academicPeriods.length === 0
                      ? 'Período ainda não configurado'
                      : 'Selecione o período'}
                </option>
                {academicPeriods.map(period => <option key={period.id} value={period.id}>{period.name}</option>)}
              </select>
            </label>

            <div className="hidden md:block" />

            <label className="text-sm font-semibold text-slate-700">
              Natureza
              <select value={nature} onChange={event => setNature(event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 font-normal">
                {natureOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>

            <label className="text-sm font-semibold text-slate-700">
              Gravidade
              <select value={severity} onChange={event => setSeverity(event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 font-normal">
                {severityOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>

            <label className="md:col-span-2 text-sm font-semibold text-slate-700">
              Título
              <input value={title} onChange={event => setTitle(event.target.value)} required className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-3 font-normal" />
            </label>

            <label className="md:col-span-2 text-sm font-semibold text-slate-700">
              Descrição objetiva
              <textarea value={description} onChange={event => setDescription(event.target.value)} required rows={4} className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-3 font-normal" />
            </label>

            {(classesError || studentsError || periodsError) ? (
              <p className="md:col-span-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                {classesError || studentsError || periodsError}
              </p>
            ) : null}

            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                disabled={saving || !classId || !studentId}
                className="min-h-12 rounded-xl bg-[#0B7491] px-6 py-3 font-semibold text-white transition hover:bg-[#09657E] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? 'Registrando…' : 'Registrar ocorrência'}
              </button>
            </div>
          </form>
        </section>
      ) : null}

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">{error}</p>
      ) : null}
      {success ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">{success}</p>
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <header className="border-b border-slate-200 px-6 py-5">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0B7491]">Consulta</p>
          <h2 className="mt-1 text-xl font-bold text-[#071827]">Histórico de ocorrências</h2>
          <p className="mt-1 text-sm text-slate-500">{visibleRows.length} registro(s) no contexto consultado.</p>
        </header>

        {loading ? (
          <p className="p-6 text-sm text-slate-500">Carregando…</p>
        ) : visibleRows.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">Nenhuma ocorrência encontrada.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {visibleRows.map(row => (
              <article key={row.id} className="grid gap-4 px-6 py-5 lg:grid-cols-[minmax(0,1fr)_auto]">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600">
                      {natureLabels[row.nature as keyof typeof natureLabels] ?? row.nature}
                    </span>
                    <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600">
                      {severityLabels[row.severity as keyof typeof severityLabels] ?? row.severity}
                    </span>
                    {row.positive ? (
                      <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-700">Positiva</span>
                    ) : null}
                  </div>

                  <h3 className="mt-3 font-bold text-[#071827]">{row.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{row.description}</p>
                  <p className="mt-3 text-xs text-slate-400">
                    {classNames.get(row.class_id) ?? 'Turma vinculada'}
                    {selectedStudent?.id === row.student_id ? ` · ${selectedStudent.full_name}` : ' · Estudante vinculado'}
                  </p>
                </div>

                <div className="lg:text-right">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{row.status}</p>
                  <p className="mt-2 text-xs text-slate-400">{formatDateTime(row.occurred_at)}</p>
                  {row.requires_follow_up ? (
                    <p className="mt-2 text-xs font-bold text-amber-700">Requer acompanhamento</p>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
