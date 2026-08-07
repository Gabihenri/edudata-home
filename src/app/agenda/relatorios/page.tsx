'use client'

import { useEffect, useMemo, useState } from 'react'

import { AgendaPageShell } from '@/components/agenda/AgendaPageShell'
import { usePedagogicalContext } from '@/lib/agenda/hooks/usePedagogicalContext'

type ReportType = 'occurrences' | 'grades' | 'attendance'

type CalendarContext = {
  organization: { id: string; name: string }
  school: {
    id: string
    name: string
    shortName: string | null
    city: string | null
    state: string | null
  }
  roleLabel: string
}

type OccurrenceRow = {
  id: string
  title: string
  description: string
  nature: string
  severity: string
  status: string
  positive: boolean
  requires_follow_up: boolean
  occurred_at: string
}

type GradeRow = {
  id: string
  title: string
  value: number | null
  percentage: number | null
  concept: string | null
  classification: string
  recorded_at: string
}

type AttendanceRow = {
  student_id: string
  status: string
  notes?: string | null
}

const attendanceLabels: Record<string, string> = {
  present: 'Presente',
  absent: 'Falta',
  justified: 'Justificada',
  late: 'Atraso',
  not_recorded: 'Não registrado',
}

const occurrenceNatureLabels: Record<string, string> = {
  behavior: 'Comportamento',
  coexistence: 'Convivência',
  attendance: 'Frequência',
  engagement: 'Engajamento',
  pedagogical: 'Pedagógica',
  mediation: 'Mediação',
  positive_recognition: 'Reconhecimento positivo',
  leadership: 'Liderança',
  protagonism: 'Protagonismo',
  collaboration: 'Colaboração',
  support_needed: 'Necessidade de apoio',
  other: 'Outro',
}

function todayIso() {
  const date = new Date()
  const offset = date.getTimezoneOffset()
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10)
}

function formatDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}

export default function AgendaReportsPage() {
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
    academicPeriodId,
    setAcademicPeriodId,
    selectedAcademicPeriod,
  } = usePedagogicalContext()

  const [reportType, setReportType] = useState<ReportType>('occurrences')
  const [lessonDate, setLessonDate] = useState(todayIso())
  const [context, setContext] = useState<CalendarContext | null>(null)
  const [occurrences, setOccurrences] = useState<OccurrenceRow[]>([])
  const [grades, setGrades] = useState<GradeRow[]>([])
  const [attendance, setAttendance] = useState<AttendanceRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generatedAt, setGeneratedAt] = useState<Date | null>(null)

  useEffect(() => {
    async function loadContext() {
      try {
        const response = await fetch(
          '/api/agenda/institutional-calendar/contexts?limit=100',
          { credentials: 'include', cache: 'no-store' },
        )
        const body = await response.json() as {
          success?: boolean
          data?: CalendarContext[]
        }

        setContext(body.success ? (body.data?.[0] ?? null) : null)
      } catch {
        setContext(null)
      }
    }

    void loadContext()
  }, [])

  const reportTitle = useMemo(() => {
    if (reportType === 'grades') return 'Relatório de Notas'
    if (reportType === 'attendance') return 'Relatório de Frequência'
    return 'Relatório de Ocorrências'
  }, [reportType])

  async function generateReport() {
    if (!classId) {
      setError('Selecione uma turma para gerar o relatório.')
      return
    }

    if ((reportType === 'occurrences' || reportType === 'grades') && !studentId) {
      setError('Selecione um estudante para este relatório.')
      return
    }

    if (reportType === 'grades' && !academicPeriodId) {
      setError('Selecione o período letivo para o relatório de notas.')
      return
    }

    setLoading(true)
    setError(null)
    setOccurrences([])
    setGrades([])
    setAttendance([])

    try {
      if (reportType === 'occurrences') {
        const params = new URLSearchParams({
          classId,
          studentId,
          limit: '200',
        })
        if (academicPeriodId) params.set('academicPeriodId', academicPeriodId)

        const response = await fetch(`/api/agenda/ocorrencias?${params.toString()}`, {
          credentials: 'include',
          cache: 'no-store',
        })
        const body = await response.json() as {
          success?: boolean
          rows?: OccurrenceRow[]
          error?: string
        }

        if (!response.ok || !body.success) {
          throw new Error(body.error || 'Não foi possível gerar o relatório de ocorrências.')
        }

        setOccurrences(body.rows ?? [])
      }

      if (reportType === 'grades') {
        const componentId = selectedClass?.subject?.trim()
        if (!componentId) {
          throw new Error('A turma selecionada precisa ter componente curricular configurado.')
        }

        const params = new URLSearchParams({
          view: 'gradebook',
          studentId,
          classId,
          componentId,
          academicPeriodId,
        })

        const response = await fetch(`/api/agenda/avaliacoes?${params.toString()}`, {
          credentials: 'include',
          cache: 'no-store',
        })
        const body = await response.json() as {
          success?: boolean
          items?: GradeRow[]
          error?: string
        }

        if (!response.ok || !body.success) {
          throw new Error(body.error || 'Não foi possível gerar o relatório de notas.')
        }

        setGrades(body.items ?? [])
      }

      if (reportType === 'attendance') {
        const params = new URLSearchParams({ classId, lessonDate })
        const response = await fetch(`/api/agenda/diario-classe?${params.toString()}`, {
          credentials: 'include',
          cache: 'no-store',
        })
        const body = await response.json() as {
          success?: boolean
          attendance?: AttendanceRow[]
          error?: string
        }

        if (!response.ok || !body.success) {
          throw new Error(body.error || 'Não foi possível gerar o relatório de frequência.')
        }

        setAttendance(body.attendance ?? [])
      }

      setGeneratedAt(new Date())
    } catch (reportError) {
      setError(
        reportError instanceof Error
          ? reportError.message
          : 'Não foi possível gerar o relatório.',
      )
    } finally {
      setLoading(false)
    }
  }

  const attendanceByStudent = useMemo(
    () => new Map(attendance.map(item => [item.student_id, item])),
    [attendance],
  )

  const hasReport = generatedAt !== null

  return (
    <AgendaPageShell
      eyebrow="EIOS · Report Intelligence"
      title="Central de Relatórios"
      description="Gere documentos padronizados a partir dos registros existentes, sem redigitar dados. O cabeçalho respeita o contexto individual ou institucional disponível."
    >
      <div className="space-y-6 sm:space-y-8">
        <section className="print:hidden rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="grid gap-4 lg:grid-cols-3">
            <label className="text-sm font-semibold text-slate-700">
              Modelo
              <select
                value={reportType}
                onChange={event => {
                  setReportType(event.target.value as ReportType)
                  setGeneratedAt(null)
                }}
                className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 font-normal"
              >
                <option value="occurrences">Ocorrências</option>
                <option value="grades">Notas</option>
                <option value="attendance">Frequência</option>
              </select>
            </label>

            <label className="text-sm font-semibold text-slate-700">
              Turma
              <select
                value={classId}
                onChange={event => {
                  changeClass(event.target.value)
                  setGeneratedAt(null)
                }}
                disabled={classesLoading}
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
                onChange={event => {
                  setStudentId(event.target.value)
                  setGeneratedAt(null)
                }}
                disabled={!classId || studentsLoading || reportType === 'attendance'}
                className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 font-normal"
              >
                <option value="">
                  {reportType === 'attendance'
                    ? 'Relatório da turma'
                    : classId
                      ? 'Selecione o estudante'
                      : 'Selecione a turma primeiro'}
                </option>
                {students.map(student => (
                  <option key={student.id} value={student.id}>
                    {student.sequence_number ? `${student.sequence_number}. ` : ''}{student.full_name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="text-sm font-semibold text-slate-700">
              Período letivo
              <select
                value={academicPeriodId}
                onChange={event => {
                  setAcademicPeriodId(event.target.value)
                  setGeneratedAt(null)
                }}
                disabled={academicPeriods.length === 0 || reportType === 'attendance'}
                className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 font-normal"
              >
                <option value="">Todos / não informado</option>
                {academicPeriods.map(period => <option key={period.id} value={period.id}>{period.name}</option>)}
              </select>
            </label>

            <label className="text-sm font-semibold text-slate-700">
              Data da frequência
              <input
                type="date"
                value={lessonDate}
                onChange={event => {
                  setLessonDate(event.target.value)
                  setGeneratedAt(null)
                }}
                disabled={reportType !== 'attendance'}
                className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 font-normal disabled:bg-slate-100"
              />
            </label>
          </div>

          {error ? (
            <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{error}</p>
          ) : null}

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => void generateReport()}
              disabled={loading || !classId}
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#071827] px-6 py-3 text-sm font-bold text-white disabled:opacity-50"
            >
              {loading ? 'Gerando…' : 'Gerar relatório'}
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              disabled={!hasReport}
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-700 disabled:opacity-40"
            >
              Imprimir / Salvar em PDF
            </button>
          </div>
        </section>

        {hasReport ? (
          <article className="mx-auto max-w-[210mm] bg-white p-6 shadow-sm print:max-w-none print:p-0 print:shadow-none">
            <header className="border-b-2 border-[#071827] pb-5">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B7491]">
                    {context?.organization.name ?? 'Agenda Inteligente EDI'}
                  </p>
                  <h1 className="mt-1 text-2xl font-bold text-[#071827]">
                    {context?.school.name ?? 'Relatório Individual'}
                  </h1>
                  {context?.school.city || context?.school.state ? (
                    <p className="mt-1 text-xs text-slate-500">
                      {[context?.school.city, context?.school.state].filter(Boolean).join(' · ')}
                    </p>
                  ) : null}
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Agenda Inteligente EDI</p>
                  <p className="mt-1 text-xs text-slate-500">EIOS · Report Intelligence</p>
                </div>
              </div>

              <div className="mt-5 rounded-xl bg-slate-50 p-4">
                <h2 className="text-xl font-bold text-[#071827]">{reportTitle}</h2>
                <dl className="mt-3 grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-4">
                  <div><dt className="font-bold text-slate-500">Turma</dt><dd className="mt-1 text-slate-800">{selectedClass?.name ?? '—'}</dd></div>
                  <div><dt className="font-bold text-slate-500">Estudante</dt><dd className="mt-1 text-slate-800">{selectedStudent?.full_name ?? 'Turma completa'}</dd></div>
                  <div><dt className="font-bold text-slate-500">Período</dt><dd className="mt-1 text-slate-800">{selectedAcademicPeriod?.name ?? (reportType === 'attendance' ? lessonDate : '—')}</dd></div>
                  <div><dt className="font-bold text-slate-500">Emissão</dt><dd className="mt-1 text-slate-800">{generatedAt ? formatDateTime(generatedAt.toISOString()) : '—'}</dd></div>
                </dl>
              </div>
            </header>

            <section className="py-6">
              {reportType === 'occurrences' ? (
                occurrences.length === 0 ? (
                  <p className="text-sm text-slate-600">Nenhuma ocorrência encontrada no contexto selecionado.</p>
                ) : (
                  <div className="space-y-4">
                    {occurrences.map((item, index) => (
                      <section key={item.id} className="break-inside-avoid rounded-xl border border-slate-200 p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#0B7491]">Ocorrência {String(index + 1).padStart(2, '0')}</p>
                            <h3 className="mt-1 font-bold text-[#071827]">{item.title}</h3>
                          </div>
                          <p className="text-xs text-slate-500">{formatDateTime(item.occurred_at)}</p>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-slate-700">{item.description}</p>
                        <dl className="mt-4 grid gap-2 text-xs sm:grid-cols-3">
                          <div><dt className="font-bold text-slate-500">Natureza</dt><dd>{occurrenceNatureLabels[item.nature] ?? item.nature}</dd></div>
                          <div><dt className="font-bold text-slate-500">Gravidade</dt><dd>{item.severity}</dd></div>
                          <div><dt className="font-bold text-slate-500">Status</dt><dd>{item.status}</dd></div>
                        </dl>
                      </section>
                    ))}
                  </div>
                )
              ) : null}

              {reportType === 'grades' ? (
                grades.length === 0 ? (
                  <p className="text-sm text-slate-600">Nenhuma nota encontrada no contexto selecionado.</p>
                ) : (
                  <div className="overflow-hidden rounded-xl border border-slate-200">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                        <tr>
                          <th className="px-4 py-3">Instrumento</th>
                          <th className="px-4 py-3">Nota</th>
                          <th className="px-4 py-3">Percentual</th>
                          <th className="px-4 py-3">Classificação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {grades.map(item => (
                          <tr key={item.id}>
                            <td className="px-4 py-3 font-semibold text-[#071827]">{item.title}</td>
                            <td className="px-4 py-3">{item.value ?? '—'}</td>
                            <td className="px-4 py-3">{item.percentage === null ? '—' : `${item.percentage}%`}</td>
                            <td className="px-4 py-3">{item.classification || item.concept || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              ) : null}

              {reportType === 'attendance' ? (
                <div className="overflow-hidden rounded-xl border border-slate-200">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Nº</th>
                        <th className="px-4 py-3">Estudante</th>
                        <th className="px-4 py-3">Situação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {students.map((student, index) => {
                        const entry = attendanceByStudent.get(student.id)
                        return (
                          <tr key={student.id}>
                            <td className="px-4 py-3">{student.sequence_number ?? index + 1}</td>
                            <td className="px-4 py-3 font-semibold text-[#071827]">{student.full_name}</td>
                            <td className="px-4 py-3">{attendanceLabels[entry?.status ?? 'not_recorded'] ?? entry?.status ?? 'Não registrado'}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </section>

            <footer className="mt-6 border-t border-slate-300 pt-4 text-[10px] leading-5 text-slate-500">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p>Documento gerado pela Agenda Inteligente EDI.</p>
                  <p>Framework EDI → EIOS → Report Intelligence.</p>
                </div>
                <div className="text-right">
                  <p>Rastreabilidade: {generatedAt ? `EDI-${generatedAt.getTime()}` : '—'}</p>
                  <p>Dados sujeitos às permissões e políticas do contexto de uso.</p>
                </div>
              </div>
            </footer>
          </article>
        ) : null}

        <style jsx global>{`
          @media print {
            @page {
              size: A4;
              margin: 14mm;
            }

            body {
              background: white !important;
            }

            header, nav, footer[data-app-shell] {
              display: none !important;
            }

            .break-inside-avoid {
              break-inside: avoid;
            }
          }
        `}</style>
      </div>
    </AgendaPageShell>
  )
}
