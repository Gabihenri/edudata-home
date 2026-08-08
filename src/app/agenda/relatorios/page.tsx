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

type IndividualIdentity = {
  professionalTitle: string | null
  registrationLabel: string | null
  registrationValue: string | null
  city: string | null
  state: string | null
  addressLine: string | null
  footerText: string | null
  showEduDataBrand: boolean
}

type IndividualProfile = {
  displayName: string
  email: string | null
  phone: string | null
  role: string
  identity: IndividualIdentity
}

type Organization = {
  id: string
  name: string
  short_name?: string | null
  email?: string | null
  phone?: string | null
  website?: string | null
  logo_url?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  zip_code?: string | null
}

type School = {
  id: string
  name: string
  short_name?: string | null
  inep_code?: string | null
  principal_name?: string | null
  email?: string | null
  phone?: string | null
  website?: string | null
  postal_code?: string | null
  address?: string | null
  number?: string | null
  complement?: string | null
  district?: string | null
  city?: string | null
  state?: string | null
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

type RosterStudent = {
  id: string
  class_id: string
  full_name: string
  enrollment_code: string | null
  sequence_number: number | null
  active: boolean
}

type GradeRow = {
  id: string
  student_id: string
  title: string
  value: number | null
  percentage: number | null
  concept: string | null
  classification: string
  entry_type: string
  recorded_at: string
}

type AttendanceRow = {
  id: string
  student_id: string
  lesson_date: string
  status: string
  notes: string | null
}

type AggregateResponse = {
  success?: boolean
  roster?: RosterStudent[]
  attendance?: AttendanceRow[]
  grades?: GradeRow[]
  error?: string
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

const severityLabels: Record<string, string> = {
  informational: 'Informativa',
  low: 'Baixa',
  moderate: 'Moderada',
  high: 'Alta',
  critical: 'Crítica',
}

const classificationLabels: Record<string, string> = {
  critical: 'Crítico',
  initial: 'Inicial',
  developing: 'Em desenvolvimento',
  adequate: 'Adequado',
  proficient: 'Proficiente',
  advanced: 'Avançado',
  not_classified: 'Não classificado',
}

function formatDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}

function formatDate(value: string) {
  const date = new Date(`${value}T12:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('pt-BR').format(date)
}

function percentage(value: number) {
  return `${value.toFixed(1).replace('.', ',')}%`
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
  const [context, setContext] = useState<CalendarContext | null>(null)
  const [individualProfile, setIndividualProfile] = useState<IndividualProfile | null>(null)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [school, setSchool] = useState<School | null>(null)
  const [occurrences, setOccurrences] = useState<OccurrenceRow[]>([])
  const [roster, setRoster] = useState<RosterStudent[]>([])
  const [grades, setGrades] = useState<GradeRow[]>([])
  const [attendance, setAttendance] = useState<AttendanceRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generatedAt, setGeneratedAt] = useState<Date | null>(null)

  useEffect(() => {
    async function loadDocumentContext() {
      try {
        const [contextsResponse, profileResponse] = await Promise.all([
          fetch('/api/agenda/institutional-calendar/contexts?limit=100', {
            credentials: 'include',
            cache: 'no-store',
          }),
          fetch('/api/agenda/registry/document-identity', {
            credentials: 'include',
            cache: 'no-store',
          }),
        ])

        const contextsBody = await contextsResponse.json() as {
          success?: boolean
          data?: CalendarContext[]
        }
        const profileBody = await profileResponse.json() as {
          success?: boolean
          data?: IndividualProfile
        }

        setContext(contextsResponse.ok && contextsBody.success ? (contextsBody.data?.[0] ?? null) : null)
        setIndividualProfile(profileResponse.ok && profileBody.success ? (profileBody.data ?? null) : null)
      } catch {
        setContext(null)
        setIndividualProfile(null)
      }
    }

    void loadDocumentContext()
  }, [])

  useEffect(() => {
    if (!context) {
      setOrganization(null)
      setSchool(null)
      return
    }

    let cancelled = false

    async function loadInstitutionalHeader() {
      try {
        const [organizationResponse, schoolResponse] = await Promise.all([
          fetch(`/api/organizations/${context!.organization.id}`, { credentials: 'include', cache: 'no-store' }),
          fetch(`/api/schools/${context!.school.id}`, { credentials: 'include', cache: 'no-store' }),
        ])

        const organizationBody = await organizationResponse.json() as { success?: boolean; data?: Organization }
        const schoolBody = await schoolResponse.json() as { success?: boolean; data?: School }

        if (!cancelled) {
          setOrganization(organizationResponse.ok && organizationBody.success ? (organizationBody.data ?? null) : null)
          setSchool(schoolResponse.ok && schoolBody.success ? (schoolBody.data ?? null) : null)
        }
      } catch {
        if (!cancelled) {
          setOrganization(null)
          setSchool(null)
        }
      }
    }

    void loadInstitutionalHeader()
    return () => { cancelled = true }
  }, [context?.organization.id, context?.school.id])

  const reportTitle =
    reportType === 'grades'
      ? 'Relatório de Notas'
      : reportType === 'attendance'
        ? 'Relatório de Frequência'
        : 'Relatório de Ocorrências'

  const attendanceSummary = useMemo(() => {
    return roster.map(student => {
      const entries = attendance.filter(item => item.student_id === student.id)
      const present = entries.filter(item => item.status === 'present').length
      const absent = entries.filter(item => item.status === 'absent').length
      const justified = entries.filter(item => item.status === 'justified').length
      const late = entries.filter(item => item.status === 'late').length
      const total = entries.filter(item => item.status !== 'not_recorded').length
      const attendanceRate = total === 0 ? 0 : ((present + late) / total) * 100

      return {
        student,
        total,
        present,
        absent,
        justified,
        late,
        attendanceRate,
      }
    })
  }, [roster, attendance])

  const gradeSummary = useMemo(() => {
    return roster.map(student => {
      const entries = grades.filter(item => item.student_id === student.id)
      const percentages = entries
        .map(item => item.percentage)
        .filter((value): value is number => typeof value === 'number' && Number.isFinite(value))
      const averagePercentage = percentages.length === 0
        ? null
        : percentages.reduce((sum, value) => sum + value, 0) / percentages.length
      const latest = [...entries].sort(
        (first, second) => new Date(second.recorded_at).getTime() - new Date(first.recorded_at).getTime(),
      )[0]

      return {
        student,
        entries,
        averagePercentage,
        latestClassification: latest?.classification ?? 'not_classified',
      }
    })
  }, [roster, grades])

  async function generateReport() {
    if (!classId) {
      setError('Selecione uma turma para gerar o relatório.')
      return
    }

    if (reportType === 'occurrences' && !studentId) {
      setError('Selecione um estudante para o relatório de ocorrência.')
      return
    }

    if ((reportType === 'grades' || reportType === 'attendance') && !academicPeriodId) {
      setError('Selecione o período letivo para consolidar os dados.')
      return
    }

    setLoading(true)
    setError(null)
    setGeneratedAt(null)
    setOccurrences([])
    setRoster([])
    setGrades([])
    setAttendance([])

    try {
      if (reportType === 'occurrences') {
        const params = new URLSearchParams({ classId, studentId, limit: '200' })
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
      } else {
        const params = new URLSearchParams({
          classId,
          academicPeriodId,
        })

        if (selectedAcademicPeriod) {
          params.set('from', selectedAcademicPeriod.start_date)
          params.set('to', selectedAcademicPeriod.end_date)
        }

        const response = await fetch(`/api/agenda/relatorios/dados?${params.toString()}`, {
          credentials: 'include',
          cache: 'no-store',
        })
        const body = await response.json() as AggregateResponse

        if (!response.ok || !body.success) {
          throw new Error(body.error || 'Não foi possível consolidar os dados do relatório.')
        }

        setRoster(body.roster ?? [])
        setAttendance(body.attendance ?? [])
        setGrades(body.grades ?? [])
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

  const individualGrades = studentId
    ? grades.filter(item => item.student_id === studentId)
    : []

  const hasReport = generatedAt !== null

  const institutionalLocation = school
    ? [school.address, school.number, school.district, school.city, school.state].filter(Boolean).join(' · ')
    : [context?.school.city, context?.school.state].filter(Boolean).join(' · ')

  const individualLocation = [
    individualProfile?.identity.city,
    individualProfile?.identity.state,
  ].filter(Boolean).join(' · ')

  return (
    <AgendaPageShell
      eyebrow="EIOS · Report Intelligence"
      title="Central de Relatórios"
      description="Documentos profissionais gerados a partir dos dados já existentes. O usuário seleciona o contexto e a Agenda monta o relatório."
    >
      <div className="space-y-6 sm:space-y-8">
        <section className="print:hidden rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="grid gap-4 lg:grid-cols-4">
            <label className="text-sm font-semibold text-slate-700">
              Modelo
              <select
                value={reportType}
                onChange={event => {
                  setReportType(event.target.value as ReportType)
                  setGeneratedAt(null)
                  setStudentId('')
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
                {classes.map(item => <option key={item.id} value={item.id}>{item.name}{item.subject ? ` · ${item.subject}` : ''}</option>)}
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
                    : reportType === 'grades'
                      ? 'Turma completa (ou escolha um estudante)'
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

            <label className="text-sm font-semibold text-slate-700">
              Período letivo
              <select
                value={academicPeriodId}
                onChange={event => {
                  setAcademicPeriodId(event.target.value)
                  setGeneratedAt(null)
                }}
                disabled={academicPeriods.length === 0}
                className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 font-normal"
              >
                <option value="">{reportType === 'occurrences' ? 'Todos / opcional' : 'Selecione o período'}</option>
                {academicPeriods.map(period => <option key={period.id} value={period.id}>{period.name}</option>)}
              </select>
            </label>
          </div>

          <div className="mt-5 rounded-xl border border-cyan-200 bg-cyan-50 p-4 text-sm leading-6 text-slate-700">
            {reportType === 'occurrences'
              ? 'O relatório de ocorrência é individual e reúne os registros do estudante no contexto escolhido.'
              : reportType === 'grades'
                ? 'Sem estudante selecionado, o documento consolida a turma. Ao escolher um estudante, gera o histórico individual.'
                : 'A frequência é consolidada automaticamente entre o início e o fim do período letivo selecionado.'}
          </div>

          {error ? <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{error}</p> : null}

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
                <div className="flex min-w-0 items-start gap-4">
                  {context && organization?.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={organization.logo_url} alt="" className="h-14 w-14 shrink-0 object-contain" />
                  ) : null}
                  <div className="min-w-0">
                    {context ? (
                      <>
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B7491]">
                          {organization?.name ?? context.organization.name}
                        </p>
                        <h1 className="mt-1 text-2xl font-bold text-[#071827]">
                          {school?.name ?? context.school.name}
                        </h1>
                        {school?.inep_code ? <p className="mt-1 text-xs text-slate-500">INEP {school.inep_code}</p> : null}
                        {institutionalLocation ? <p className="mt-1 text-xs text-slate-500">{institutionalLocation}</p> : null}
                        <p className="mt-1 text-xs text-slate-500">
                          {[school?.phone, school?.email].filter(Boolean).join(' · ')}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B7491]">Perfil profissional individual</p>
                        <h1 className="mt-1 text-2xl font-bold text-[#071827]">{individualProfile?.displayName ?? 'Professor'}</h1>
                        <p className="mt-1 text-sm font-semibold text-[#0B7491]">{individualProfile?.identity.professionalTitle ?? 'Professor'}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {[individualProfile?.email, individualProfile?.phone].filter(Boolean).join(' · ')}
                        </p>
                        {individualLocation ? <p className="mt-1 text-xs text-slate-500">{individualLocation}</p> : null}
                      </>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  {(context || individualProfile?.identity.showEduDataBrand !== false) ? (
                    <>
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Agenda Inteligente EDI</p>
                      <p className="mt-1 text-xs text-slate-500">EIOS · Report Intelligence</p>
                    </>
                  ) : null}
                </div>
              </div>

              <div className="mt-5 rounded-xl bg-slate-50 p-4">
                <h2 className="text-xl font-bold text-[#071827]">{reportTitle}</h2>
                <dl className="mt-3 grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-4">
                  <div><dt className="font-bold text-slate-500">Turma</dt><dd className="mt-1 text-slate-800">{selectedClass?.name ?? '—'}</dd></div>
                  <div><dt className="font-bold text-slate-500">Componente</dt><dd className="mt-1 text-slate-800">{selectedClass?.subject ?? '—'}</dd></div>
                  <div><dt className="font-bold text-slate-500">Estudante</dt><dd className="mt-1 text-slate-800">{selectedStudent?.full_name ?? 'Turma completa'}</dd></div>
                  <div><dt className="font-bold text-slate-500">Período</dt><dd className="mt-1 text-slate-800">{selectedAcademicPeriod?.name ?? '—'}</dd></div>
                  <div className="lg:col-span-4"><dt className="font-bold text-slate-500">Emissão</dt><dd className="mt-1 text-slate-800">{generatedAt ? formatDateTime(generatedAt.toISOString()) : '—'}</dd></div>
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
                          <div><dt className="font-bold text-slate-500">Gravidade</dt><dd>{severityLabels[item.severity] ?? item.severity}</dd></div>
                          <div><dt className="font-bold text-slate-500">Status</dt><dd>{item.status}</dd></div>
                        </dl>
                        {item.requires_follow_up ? <p className="mt-3 text-xs font-bold text-amber-700">Requer acompanhamento pedagógico.</p> : null}
                      </section>
                    ))}
                    <div className="mt-10 grid grid-cols-2 gap-10 pt-8 text-center text-xs text-slate-500">
                      <div className="border-t border-slate-400 pt-2">Professor / responsável pelo registro</div>
                      <div className="border-t border-slate-400 pt-2">Coordenação / gestão, quando aplicável</div>
                    </div>
                  </div>
                )
              ) : null}

              {reportType === 'grades' && studentId ? (
                individualGrades.length === 0 ? (
                  <p className="text-sm text-slate-600">Nenhuma nota encontrada para o estudante no período.</p>
                ) : (
                  <div className="overflow-hidden rounded-xl border border-slate-200">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                        <tr><th className="px-4 py-3">Instrumento</th><th className="px-4 py-3">Nota</th><th className="px-4 py-3">%</th><th className="px-4 py-3">Classificação</th></tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {individualGrades.map(item => (
                          <tr key={item.id}>
                            <td className="px-4 py-3 font-semibold text-[#071827]">{item.title}</td>
                            <td className="px-4 py-3">{item.value ?? '—'}</td>
                            <td className="px-4 py-3">{item.percentage === null ? '—' : percentage(item.percentage)}</td>
                            <td className="px-4 py-3">{classificationLabels[item.classification] ?? item.classification}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              ) : null}

              {reportType === 'grades' && !studentId ? (
                <div className="overflow-hidden rounded-xl border border-slate-200">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                      <tr><th className="px-4 py-3">Nº</th><th className="px-4 py-3">Estudante</th><th className="px-4 py-3">Registros</th><th className="px-4 py-3">Média %</th><th className="px-4 py-3">Nível recente</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {gradeSummary.map((item, index) => (
                        <tr key={item.student.id}>
                          <td className="px-4 py-3">{item.student.sequence_number ?? index + 1}</td>
                          <td className="px-4 py-3 font-semibold text-[#071827]">{item.student.full_name}</td>
                          <td className="px-4 py-3">{item.entries.length}</td>
                          <td className="px-4 py-3">{item.averagePercentage === null ? '—' : percentage(item.averagePercentage)}</td>
                          <td className="px-4 py-3">{classificationLabels[item.latestClassification] ?? item.latestClassification}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}

              {reportType === 'attendance' ? (
                <div>
                  <p className="mb-4 text-xs text-slate-500">
                    Intervalo: {selectedAcademicPeriod ? `${formatDate(selectedAcademicPeriod.start_date)} a ${formatDate(selectedAcademicPeriod.end_date)}` : 'período não informado'}.
                  </p>
                  <div className="overflow-hidden rounded-xl border border-slate-200">
                    <table className="w-full text-left text-xs sm:text-sm">
                      <thead className="bg-slate-50 text-[10px] uppercase text-slate-500 sm:text-xs">
                        <tr><th className="px-3 py-3">Nº</th><th className="px-3 py-3">Estudante</th><th className="px-3 py-3">P</th><th className="px-3 py-3">F</th><th className="px-3 py-3">J</th><th className="px-3 py-3">A</th><th className="px-3 py-3">Frequência</th></tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {attendanceSummary.map((item, index) => (
                          <tr key={item.student.id}>
                            <td className="px-3 py-3">{item.student.sequence_number ?? index + 1}</td>
                            <td className="px-3 py-3 font-semibold text-[#071827]">{item.student.full_name}</td>
                            <td className="px-3 py-3">{item.present}</td>
                            <td className="px-3 py-3">{item.absent}</td>
                            <td className="px-3 py-3">{item.justified}</td>
                            <td className="px-3 py-3">{item.late}</td>
                            <td className="px-3 py-3 font-semibold">{item.total === 0 ? '—' : percentage(item.attendanceRate)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-3 text-[10px] leading-5 text-slate-500">P = presença · F = falta · J = falta justificada · A = atraso. O cálculo exibido considera presença e atraso como comparecimento entre registros válidos.</p>
                </div>
              ) : null}
            </section>

            <footer className="mt-6 border-t border-slate-300 pt-4 text-[10px] leading-5 text-slate-500">
              {context ? (
                <p className="mb-2">{school?.principal_name ? `Direção: ${school.principal_name}. ` : ''}{school?.website ?? organization?.website ?? ''}</p>
              ) : individualProfile?.identity.footerText ? (
                <p className="mb-2">{individualProfile.identity.footerText}</p>
              ) : null}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  {(context || individualProfile?.identity.showEduDataBrand !== false) ? <p>Documento gerado pela Agenda Inteligente EDI.</p> : null}
                  <p>Framework EDI → EIOS → Report Intelligence.</p>
                </div>
                <div className="text-right"><p>Rastreabilidade: {generatedAt ? `EDI-${generatedAt.getTime()}` : '—'}</p><p>Dados sujeitos às permissões e políticas do contexto de uso.</p></div>
              </div>
            </footer>
          </article>
        ) : null}

        <style jsx global>{`
          @media print {
            @page { size: A4; margin: 14mm; }
            body { background: white !important; }
            .break-inside-avoid { break-inside: avoid; }
          }
        `}</style>
      </div>
    </AgendaPageShell>
  )
}
