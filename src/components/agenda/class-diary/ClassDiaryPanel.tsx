'use client'

import { useEffect, useMemo, useState } from 'react'

import { usePedagogicalContext } from '@/lib/agenda/hooks/usePedagogicalContext'
import { usePlanning } from '@/lib/agenda/hooks/usePlanning'

type AttendanceStatus = 'present' | 'absent' | 'justified' | 'late' | 'not_recorded'

type RosterStudent = {
  id: string
  class_id: string
  full_name: string
  enrollment_code: string | null
  sequence_number: number | null
  active: boolean
}

type AttendanceEntry = {
  student_id: string
  status: AttendanceStatus
}

type DiaryResponse = {
  success: boolean
  roster?: RosterStudent[]
  attendance?: AttendanceEntry[]
  error?: string
}

type RowDraft = {
  attendance: AttendanceStatus
  grade: string
  percentage: string
  savingAttendance: boolean
  savingGrade: boolean
  message: string | null
}

const attendanceOptions: Array<{ value: AttendanceStatus; label: string; short: string }> = [
  { value: 'present', label: 'Presente', short: 'P' },
  { value: 'absent', label: 'Falta', short: 'F' },
  { value: 'justified', label: 'Justificada', short: 'J' },
  { value: 'late', label: 'Atraso', short: 'A' },
]

function todayIso() {
  const date = new Date()
  const offset = date.getTimezoneOffset()
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10)
}

export default function ClassDiaryPanel() {
  const {
    classes,
    classesLoading,
    classesError,
    classId,
    changeClass,
    selectedClass,
    academicPeriods,
    periodsLoading,
    periodsError,
    academicPeriodId,
    setAcademicPeriodId,
  } = usePedagogicalContext()

  const { planning, loading: planningLoading } = usePlanning()

  const [planningId, setPlanningId] = useState('')
  const [lessonDate, setLessonDate] = useState(todayIso())
  const [instrumentTitle, setInstrumentTitle] = useState('Avaliação')
  const [roster, setRoster] = useState<RosterStudent[]>([])
  const [drafts, setDrafts] = useState<Record<string, RowDraft>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const availablePlanning = useMemo(
    () => planning.filter(item => item.class_id === classId && item.status !== 'arquivado'),
    [planning, classId],
  )

  const selectedPlanning = useMemo(
    () => availablePlanning.find(item => item.id === planningId) ?? null,
    [availablePlanning, planningId],
  )

  useEffect(() => {
    setPlanningId('')
    setRoster([])
    setDrafts({})
  }, [classId])

  async function loadDiary() {
    if (!classId) return setError('Selecione uma turma.')
    if (!planningId) return setError('Selecione um planejamento antes de abrir a chamada.')

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({ classId, lessonDate, planningId })
      const response = await fetch(`/api/agenda/diario-classe?${params.toString()}`, {
        credentials: 'include',
        cache: 'no-store',
      })
      const body = await response.json() as DiaryResponse

      if (!response.ok || !body.success) {
        throw new Error(body.error || 'Não foi possível abrir o Diário de Classe.')
      }

      const attendanceMap = new Map(
        (body.attendance ?? []).map(item => [item.student_id, item.status]),
      )

      const nextDrafts: Record<string, RowDraft> = {}
      for (const student of body.roster ?? []) {
        nextDrafts[student.id] = {
          attendance: attendanceMap.get(student.id) ?? 'not_recorded',
          grade: '',
          percentage: '',
          savingAttendance: false,
          savingGrade: false,
          message: null,
        }
      }

      setRoster(body.roster ?? [])
      setDrafts(nextDrafts)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Não foi possível abrir o Diário de Classe.')
    } finally {
      setLoading(false)
    }
  }

  async function saveAttendance(student: RosterStudent, status: AttendanceStatus) {
    if (!planningId) {
      setError('Selecione um planejamento válido antes de registrar frequência.')
      return
    }

    setDrafts(current => ({
      ...current,
      [student.id]: {
        ...current[student.id],
        attendance: status,
        savingAttendance: true,
        message: null,
      },
    }))

    try {
      const response = await fetch('/api/agenda/diario-classe', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'attendance',
          classId,
          planningId,
          studentId: student.id,
          lessonDate,
          status,
          notes: selectedPlanning ? `Planejamento: ${selectedPlanning.title}` : null,
        }),
      })
      const body = await response.json() as DiaryResponse
      if (!response.ok || !body.success) {
        throw new Error(body.error || 'Não foi possível salvar a frequência.')
      }

      setDrafts(current => ({
        ...current,
        [student.id]: { ...current[student.id], savingAttendance: false, message: 'Frequência salva' },
      }))
    } catch (saveError) {
      setDrafts(current => ({
        ...current,
        [student.id]: {
          ...current[student.id],
          savingAttendance: false,
          message: saveError instanceof Error ? saveError.message : 'Erro ao salvar frequência.',
        },
      }))
    }
  }

  async function saveGrade(student: RosterStudent) {
    const row = drafts[student.id]
    if (!row) return

    const componentId = selectedClass?.subject?.trim() ?? ''
    if (!planningId || !componentId || !academicPeriodId || !instrumentTitle.trim()) {
      setError('Planejamento, componente e período letivo são obrigatórios para lançar nota.')
      return
    }

    if (row.grade === '' && row.percentage === '') {
      setError(`Informe nota ou percentual para ${student.full_name}.`)
      return
    }

    setError(null)
    setDrafts(current => ({
      ...current,
      [student.id]: { ...current[student.id], savingGrade: true, message: null },
    }))

    try {
      const response = await fetch('/api/agenda/avaliacoes', {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          operation: 'create_grade',
          grade: {
            studentId: student.id,
            classId,
            componentId,
            academicPeriodId,
            type: 'assessment',
            title: instrumentTitle.trim(),
            value: row.grade === '' ? null : Number(row.grade),
            percentage: row.percentage === '' ? null : Number(row.percentage),
            weight: 1,
            metadata: {
              source: 'agenda_class_diary',
              lessonDate,
              studentName: student.full_name,
              planningId,
              planningTitle: selectedPlanning?.title ?? null,
            },
          },
        }),
      })

      const body = await response.json() as { success?: boolean; error?: string }
      if (!response.ok || !body.success) {
        throw new Error(body.error || 'Não foi possível salvar a nota.')
      }

      setDrafts(current => ({
        ...current,
        [student.id]: { ...current[student.id], savingGrade: false, message: 'Nota salva' },
      }))
    } catch (saveError) {
      setDrafts(current => ({
        ...current,
        [student.id]: {
          ...current[student.id],
          savingGrade: false,
          message: saveError instanceof Error ? saveError.message : 'Erro ao salvar nota.',
        },
      }))
    }
  }

  async function markAllPresent() {
    for (const student of roster) {
      if (drafts[student.id]?.attendance !== 'present') {
        await saveAttendance(student, 'present')
      }
    }
  }

  return (
    <section className="space-y-6">
      <header className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-[#071827] text-white shadow-sm">
        <div className="border-l-4 border-cyan-400 px-5 py-7 sm:px-7">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">Agenda Inteligente EDI · Operação da turma</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Diário de Classe</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
            Turma, planejamento, período e lista nominal vêm do contexto cadastrado. A chamada registra somente o que aconteceu na aula.
          </p>
        </div>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="text-sm font-semibold text-slate-700">
            Turma
            <select value={classId} onChange={event => changeClass(event.target.value)} disabled={classesLoading} className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 font-normal">
              <option value="">Selecione a turma</option>
              {classes.map(item => <option key={item.id} value={item.id}>{item.name}{item.subject ? ` · ${item.subject}` : ''}</option>)}
            </select>
          </label>

          <label className="text-sm font-semibold text-slate-700">
            Planejamento
            <select value={planningId} onChange={event => setPlanningId(event.target.value)} disabled={!classId || planningLoading} className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 font-normal">
              <option value="">{!classId ? 'Selecione a turma primeiro' : availablePlanning.length === 0 ? 'Nenhum planejamento disponível' : 'Selecione o planejamento'}</option>
              {availablePlanning.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}
            </select>
          </label>

          <label className="text-sm font-semibold text-slate-700">
            Data da aula
            <input type="date" value={lessonDate} onChange={event => setLessonDate(event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-3 font-normal" />
          </label>

          <label className="text-sm font-semibold text-slate-700">
            Período letivo
            <select value={academicPeriodId} onChange={event => setAcademicPeriodId(event.target.value)} disabled={periodsLoading || academicPeriods.length === 0} className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 font-normal">
              <option value="">{periodsLoading ? 'Carregando períodos...' : academicPeriods.length === 0 ? 'Período não configurado' : 'Selecione o período'}</option>
              {academicPeriods.map(period => <option key={period.id} value={period.id}>{period.name}</option>)}
            </select>
          </label>
        </div>

        {classId && availablePlanning.length === 0 && !planningLoading ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
            Esta turma ainda não possui planejamento. Crie o planejamento antes de abrir a chamada.
          </div>
        ) : null}

        {selectedClass ? (
          <div className="mt-4 grid gap-3 rounded-xl border border-cyan-200 bg-cyan-50 p-4 text-sm text-slate-700 sm:grid-cols-3">
            <div><span className="block text-xs font-bold uppercase text-[#0B7491]">Turma</span>{selectedClass.name}</div>
            <div><span className="block text-xs font-bold uppercase text-[#0B7491]">Componente</span>{selectedClass.subject ?? 'Não configurado'}</div>
            <div><span className="block text-xs font-bold uppercase text-[#0B7491]">Planejamento</span>{selectedPlanning?.title ?? 'Selecione acima'}</div>
          </div>
        ) : null}

        <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <label className="text-sm font-semibold text-slate-700">
            Instrumento de avaliação
            <input value={instrumentTitle} onChange={event => setInstrumentTitle(event.target.value)} placeholder="Ex.: Avaliação diagnóstica 1" className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-3 font-normal" />
          </label>
          <button type="button" onClick={() => void loadDiary()} disabled={loading || !classId || !planningId} className="min-h-12 rounded-xl bg-[#071827] px-6 py-3 text-sm font-bold text-white disabled:opacity-50">
            {loading ? 'Carregando…' : 'Abrir chamada'}
          </button>
        </div>

        {(classesError || periodsError || error) ? (
          <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-900">{error || classesError || periodsError}</p>
        ) : null}
      </section>

      {classId && planningId && roster.length === 0 && !loading ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-[#071827]">Nenhum estudante vinculado a esta turma.</p>
          <p className="mt-1 text-sm leading-6 text-slate-600">A chamada não cadastra estudantes. Cadastre ou importe a lista nominal na gestão da turma e retorne ao Diário.</p>
        </section>
      ) : null}

      {roster.length > 0 ? (
        <section className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">
          <header className="flex flex-col gap-4 border-b border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#0B7491]">Lista nominal</p>
              <h2 className="mt-1 text-xl font-bold text-[#071827]">{selectedClass?.name ?? 'Turma'} · {roster.length} estudantes</h2>
              <p className="mt-1 text-xs text-slate-500">{selectedPlanning?.title ?? ''} · {lessonDate}</p>
            </div>
            <button type="button" onClick={() => void markAllPresent()} className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-800">Marcar todos presentes</button>
          </header>

          <div className="divide-y divide-slate-100">
            {roster.map((student, index) => {
              const row = drafts[student.id]
              if (!row) return null

              return (
                <article key={student.id} className="grid gap-4 px-4 py-5 sm:px-5 lg:grid-cols-[minmax(220px,1fr)_auto_minmax(260px,0.8fr)_auto] lg:items-center">
                  <div className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Estudante {String(student.sequence_number ?? index + 1).padStart(2, '0')}</p>
                    <p className="mt-1 truncate text-base font-bold text-[#071827]">{student.full_name}</p>
                    {student.enrollment_code ? <p className="mt-1 text-xs text-slate-500">Matrícula {student.enrollment_code}</p> : null}
                  </div>

                  <div className="flex flex-wrap gap-2" aria-label={`Frequência de ${student.full_name}`}>
                    {attendanceOptions.map(option => {
                      const active = row.attendance === option.value
                      return (
                        <button key={option.value} type="button" title={option.label} onClick={() => void saveAttendance(student, option.value)} disabled={row.savingAttendance} className={`h-11 min-w-11 rounded-xl border px-3 text-sm font-black transition ${active ? 'border-cyan-400 bg-[#071827] text-white ring-2 ring-cyan-100' : 'border-slate-300 bg-white text-slate-700 hover:border-cyan-300 hover:bg-cyan-50'}`}>
                          {option.short}
                        </button>
                      )
                    })}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <label className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">
                      Nota
                      <input type="number" step="0.01" value={row.grade} onChange={event => setDrafts(current => ({ ...current, [student.id]: { ...current[student.id], grade: event.target.value, message: null } }))} className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3 py-2 text-base font-semibold text-[#071827]" />
                    </label>
                    <label className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">
                      Percentual
                      <input type="number" min="0" max="100" step="0.01" value={row.percentage} onChange={event => setDrafts(current => ({ ...current, [student.id]: { ...current[student.id], percentage: event.target.value, message: null } }))} className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3 py-2 text-base font-semibold text-[#071827]" />
                    </label>
                  </div>

                  <div className="flex min-w-32 flex-col gap-2">
                    <button type="button" onClick={() => void saveGrade(student)} disabled={row.savingGrade} className="min-h-11 rounded-xl bg-[#0B7491] px-4 py-2 text-sm font-bold text-white disabled:opacity-60">{row.savingGrade ? 'Salvando…' : 'Salvar nota'}</button>
                    <p className={`min-h-5 text-center text-xs font-semibold ${row.message?.includes('salva') ? 'text-emerald-700' : 'text-slate-500'}`}>{row.message ?? ' '}</p>
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      ) : null}

      <aside className="rounded-2xl border border-cyan-200 bg-cyan-50 p-5 text-sm leading-6 text-slate-700">
        O Diário de Classe é uma tela operacional. Cadastros de turma e estudante ficam fora da chamada; o Diário apenas consome o contexto previamente organizado e registra o que aconteceu na aula.
      </aside>
    </section>
  )
}
