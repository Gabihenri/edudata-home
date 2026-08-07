'use client'

import { useEffect, useMemo, useState } from 'react'

import { useClasses } from '@/lib/agenda/hooks/useClasses'

type AttendanceStatus =
  | 'present'
  | 'absent'
  | 'justified'
  | 'late'
  | 'not_recorded'

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
  student?: RosterStudent
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

const attendanceOptions: Array<{
  value: AttendanceStatus
  label: string
  short: string
}> = [
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
  const { classes, loading: classesLoading } = useClasses()
  const [classId, setClassId] = useState('')
  const [lessonDate, setLessonDate] = useState(todayIso())
  const [componentId, setComponentId] = useState('')
  const [academicPeriodId, setAcademicPeriodId] = useState('')
  const [instrumentTitle, setInstrumentTitle] = useState('Avaliação')
  const [roster, setRoster] = useState<RosterStudent[]>([])
  const [drafts, setDrafts] = useState<Record<string, RowDraft>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newStudentName, setNewStudentName] = useState('')
  const [addingStudent, setAddingStudent] = useState(false)

  const selectedClass = useMemo(
    () => classes.find(item => item.id === classId) ?? null,
    [classes, classId],
  )

  useEffect(() => {
    if (selectedClass?.subject && !componentId) {
      setComponentId(selectedClass.subject)
    }
  }, [selectedClass, componentId])

  async function loadDiary() {
    if (!classId) {
      setError('Selecione uma turma.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({ classId, lessonDate })
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
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Não foi possível abrir o Diário de Classe.',
      )
    } finally {
      setLoading(false)
    }
  }

  async function saveAttendance(student: RosterStudent, status: AttendanceStatus) {
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
          studentId: student.id,
          lessonDate,
          status,
        }),
      })
      const body = await response.json() as DiaryResponse
      if (!response.ok || !body.success) {
        throw new Error(body.error || 'Não foi possível salvar a frequência.')
      }

      setDrafts(current => ({
        ...current,
        [student.id]: {
          ...current[student.id],
          savingAttendance: false,
          message: 'Frequência salva',
        },
      }))
    } catch (saveError) {
      setDrafts(current => ({
        ...current,
        [student.id]: {
          ...current[student.id],
          savingAttendance: false,
          message:
            saveError instanceof Error
              ? saveError.message
              : 'Erro ao salvar frequência.',
        },
      }))
    }
  }

  async function saveGrade(student: RosterStudent) {
    const row = drafts[student.id]
    if (!row) return

    if (!componentId.trim() || !academicPeriodId.trim() || !instrumentTitle.trim()) {
      setError('Para lançar nota, informe componente, período e instrumento no topo.')
      return
    }

    if (row.grade === '' && row.percentage === '') {
      setError(`Informe nota ou percentual para ${student.full_name}.`)
      return
    }

    setError(null)
    setDrafts(current => ({
      ...current,
      [student.id]: {
        ...current[student.id],
        savingGrade: true,
        message: null,
      },
    }))

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
          operation: 'create_grade',
          grade: {
            studentId: student.id,
            classId,
            componentId: componentId.trim(),
            academicPeriodId: academicPeriodId.trim(),
            type: 'assessment',
            title: instrumentTitle.trim(),
            value: row.grade === '' ? null : Number(row.grade),
            percentage: row.percentage === '' ? null : Number(row.percentage),
            weight: 1,
            metadata: {
              source: 'agenda_class_diary',
              lessonDate,
              studentName: student.full_name,
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
        [student.id]: {
          ...current[student.id],
          savingGrade: false,
          message: 'Nota salva',
        },
      }))
    } catch (saveError) {
      setDrafts(current => ({
        ...current,
        [student.id]: {
          ...current[student.id],
          savingGrade: false,
          message:
            saveError instanceof Error
              ? saveError.message
              : 'Erro ao salvar nota.',
        },
      }))
    }
  }

  async function addStudent() {
    if (!classId || !newStudentName.trim()) return
    setAddingStudent(true)
    setError(null)

    try {
      const response = await fetch('/api/agenda/diario-classe', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'add_student',
          classId,
          fullName: newStudentName.trim(),
          sequenceNumber: roster.length + 1,
        }),
      })
      const body = await response.json() as DiaryResponse
      if (!response.ok || !body.success || !body.student) {
        throw new Error(body.error || 'Não foi possível adicionar o estudante.')
      }
      setNewStudentName('')
      await loadDiary()
    } catch (addError) {
      setError(
        addError instanceof Error
          ? addError.message
          : 'Não foi possível adicionar o estudante.',
      )
    } finally {
      setAddingStudent(false)
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
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">
            Agenda Inteligente EDI · Operação da turma
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Diário de Classe</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
            Uma única lista nominal para frequência e notas. O estudante permanece visível durante todo o lançamento para reduzir trocas e registros incorretos.
          </p>
        </div>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <label className="text-sm font-semibold text-slate-700 xl:col-span-2">
            Turma
            <select
              value={classId}
              onChange={event => setClassId(event.target.value)}
              disabled={classesLoading}
              className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-normal outline-none focus:border-cyan-500"
            >
              <option value="">Selecione a turma</option>
              {classes.filter(item => item.active).map(item => (
                <option key={item.id} value={item.id}>
                  {item.name}{item.subject ? ` · ${item.subject}` : ''}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-semibold text-slate-700">
            Data da aula
            <input
              type="date"
              value={lessonDate}
              onChange={event => setLessonDate(event.target.value)}
              className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal"
            />
          </label>

          <label className="text-sm font-semibold text-slate-700">
            Componente
            <input
              value={componentId}
              onChange={event => setComponentId(event.target.value)}
              placeholder="Ex.: Física"
              className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal"
            />
          </label>

          <label className="text-sm font-semibold text-slate-700">
            Período
            <input
              value={academicPeriodId}
              onChange={event => setAcademicPeriodId(event.target.value)}
              placeholder="Ex.: 2º bimestre"
              className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal"
            />
          </label>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <label className="text-sm font-semibold text-slate-700">
            Instrumento de avaliação
            <input
              value={instrumentTitle}
              onChange={event => setInstrumentTitle(event.target.value)}
              placeholder="Ex.: Avaliação diagnóstica 1"
              className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal"
            />
          </label>
          <button
            type="button"
            onClick={() => void loadDiary()}
            disabled={loading || !classId}
            className="min-h-12 rounded-xl bg-[#071827] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#0B2940] disabled:opacity-60"
          >
            {loading ? 'Carregando…' : 'Abrir turma'}
          </button>
        </div>

        {error ? (
          <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-900">
            {error}
          </p>
        ) : null}
      </section>

      {classId && roster.length === 0 && !loading ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-[#071827]">Lista nominal ainda vazia</p>
          <p className="mt-1 text-sm text-slate-600">
            Adicione os estudantes uma única vez. Depois, o Diário sempre abrirá a mesma lista da turma.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              value={newStudentName}
              onChange={event => setNewStudentName(event.target.value)}
              placeholder="Nome completo do estudante"
              className="min-h-12 flex-1 rounded-xl border border-slate-300 px-4 py-3"
            />
            <button
              type="button"
              onClick={() => void addStudent()}
              disabled={addingStudent || !newStudentName.trim()}
              className="min-h-12 rounded-xl bg-[#0B7491] px-5 py-3 font-bold text-white disabled:opacity-60"
            >
              Adicionar estudante
            </button>
          </div>
        </section>
      ) : null}

      {roster.length > 0 ? (
        <section className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">
          <header className="flex flex-col gap-4 border-b border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#0B7491]">Lista nominal</p>
              <h2 className="mt-1 text-xl font-bold text-[#071827]">
                {selectedClass?.name ?? 'Turma'} · {roster.length} estudantes
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void markAllPresent()}
                className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-800"
              >
                Marcar todos presentes
              </button>
              <input
                value={newStudentName}
                onChange={event => setNewStudentName(event.target.value)}
                placeholder="Adicionar estudante"
                className="min-h-10 rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={() => void addStudent()}
                disabled={addingStudent || !newStudentName.trim()}
                className="rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-bold text-[#075F78] disabled:opacity-60"
              >
                Adicionar
              </button>
            </div>
          </header>

          <div className="divide-y divide-slate-100">
            {roster.map((student, index) => {
              const row = drafts[student.id]
              if (!row) return null

              return (
                <article
                  key={student.id}
                  className="grid gap-4 px-4 py-5 sm:px-5 lg:grid-cols-[minmax(220px,1fr)_auto_minmax(260px,0.8fr)_auto] lg:items-center"
                >
                  <div className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                      Estudante {String(student.sequence_number ?? index + 1).padStart(2, '0')}
                    </p>
                    <p className="mt-1 truncate text-base font-bold text-[#071827]">
                      {student.full_name}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2" aria-label={`Frequência de ${student.full_name}`}>
                    {attendanceOptions.map(option => {
                      const active = row.attendance === option.value
                      return (
                        <button
                          key={option.value}
                          type="button"
                          title={option.label}
                          onClick={() => void saveAttendance(student, option.value)}
                          disabled={row.savingAttendance}
                          className={`h-11 min-w-11 rounded-xl border px-3 text-sm font-black transition ${
                            active
                              ? 'border-cyan-400 bg-[#071827] text-white ring-2 ring-cyan-100'
                              : 'border-slate-300 bg-white text-slate-700 hover:border-cyan-300 hover:bg-cyan-50'
                          }`}
                        >
                          {option.short}
                        </button>
                      )
                    })}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <label className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">
                      Nota
                      <input
                        type="number"
                        step="0.01"
                        value={row.grade}
                        onChange={event =>
                          setDrafts(current => ({
                            ...current,
                            [student.id]: { ...current[student.id], grade: event.target.value, message: null },
                          }))
                        }
                        className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3 py-2 text-base font-semibold text-[#071827]"
                      />
                    </label>
                    <label className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">
                      Percentual
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={row.percentage}
                        onChange={event =>
                          setDrafts(current => ({
                            ...current,
                            [student.id]: { ...current[student.id], percentage: event.target.value, message: null },
                          }))
                        }
                        className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3 py-2 text-base font-semibold text-[#071827]"
                      />
                    </label>
                  </div>

                  <div className="flex min-w-32 flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => void saveGrade(student)}
                      disabled={row.savingGrade}
                      className="min-h-11 rounded-xl bg-[#0B7491] px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
                    >
                      {row.savingGrade ? 'Salvando…' : 'Salvar nota'}
                    </button>
                    <p className={`min-h-5 text-center text-xs font-semibold ${
                      row.message?.includes('salva') ? 'text-emerald-700' : 'text-slate-500'
                    }`}>
                      {row.message ?? ' '}
                    </p>
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      ) : null}

      <aside className="rounded-2xl border border-cyan-200 bg-cyan-50 p-5 text-sm leading-6 text-slate-700">
        O Diário de Classe é a tela operacional de lançamento coletivo. O Caderno Pedagógico continua sendo a visão individual e longitudinal do estudante; Analytics analisa os resultados e o Professor Digital apoia a interpretação e a intervenção.
      </aside>
    </section>
  )
}
