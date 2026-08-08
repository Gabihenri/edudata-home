'use client'

import Link from 'next/link'
import { type FormEvent, useEffect, useMemo, useState } from 'react'

import { AgendaPageShell } from '@/components/agenda/AgendaPageShell'
import { usePedagogicalContext } from '@/lib/agenda/hooks/usePedagogicalContext'
import { useLessons } from '@/lib/agenda/hooks/useLessons'
import { usePlanning } from '@/lib/agenda/hooks/usePlanning'
import type { AgendaLesson, AgendaLessonStatus } from '@/lib/agenda/repository/lessons.repository'

const STATUS_LABELS: Record<AgendaLessonStatus, string> = {
  planejada: 'Planejada',
  em_preparacao: 'Em preparação',
  realizada: 'Realizada',
  parcialmente_realizada: 'Parcialmente realizada',
  reagendada: 'Reagendada',
  cancelada: 'Cancelada',
}

type CalendarEvent = {
  id: string
  title: string
  event_type: string
  start_date: string
  end_date: string
  is_instructional_day: boolean
  counts_as_school_day: boolean
  suspends_classes: boolean
  status: string
}

type CalendarEventsResponse = {
  success?: boolean
  data?: CalendarEvent[]
  error?: string
}

const CALENDAR_EVENT_LABELS: Record<string, string> = {
  holiday: 'Feriado',
  optional_holiday: 'Ponto facultativo',
  recess: 'Férias / recesso escolar',
  planning: 'Planejamento pedagógico',
  teacher_training: 'Formação / ATPC',
  school_council: 'Conselho de classe',
  assessment: 'Avaliação / simulado',
  recovery: 'Recuperação',
  school_saturday: 'Dia letivo / reposição',
  closure: 'Suspensão de atividades',
  commemorative: 'Evento comemorativo',
  operational: 'Evento operacional',
  enrollment: 'Matrícula',
  deadline: 'Prazo institucional',
  other: 'Evento institucional',
}

function todayIso() {
  const date = new Date()
  const offset = date.getTimezoneOffset()
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10)
}

function formatDate(value: string | null) {
  if (!value) return 'Sem data'
  const date = new Date(`${value}T12:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(date)
}

function normalizeSkills(value: string) {
  return Array.from(
    new Set(
      value
        .split(/[\n,;]/)
        .map(item => item.trim())
        .filter(Boolean),
    ),
  )
}

export function AgendaLessonsOperational() {
  const {
    classes,
    classesLoading,
    classesError,
    classId,
    changeClass,
    selectedClass,
    institutionalContext,
    schoolYear,
    academicPeriods,
    periodsLoading,
    periodsError,
    academicPeriodId,
    setAcademicPeriodId,
  } = usePedagogicalContext()

  const {
    planning,
    loading: planningLoading,
  } = usePlanning()

  const {
    lessons,
    loading,
    mutating,
    error,
    clearError,
    loadLessons,
    createLesson,
    markAsPreparing,
    completeLesson,
    cancelLesson,
    deleteLesson,
  } = useLessons()

  const [createOpen, setCreateOpen] = useState(false)
  const [planningId, setPlanningId] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [checkingCalendar, setCheckingCalendar] = useState(false)
  const [calendarNotice, setCalendarNotice] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [scheduledDate, setScheduledDate] = useState(todayIso())
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [skills, setSkills] = useState('')
  const [methodology, setMethodology] = useState('')
  const [resources, setResources] = useState('')

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
    setCalendarNotice(null)
  }, [classId])

  useEffect(() => {
    setCalendarNotice(null)
  }, [scheduledDate])

  useEffect(() => {
    if (!selectedPlanning) return
    if (!title.trim()) setTitle(selectedPlanning.title)
    if (!description.trim() && selectedPlanning.description) {
      setDescription(selectedPlanning.description)
    }
    if (!methodology.trim() && selectedPlanning.methodology) {
      setMethodology(selectedPlanning.methodology)
    }
    if (!resources.trim() && selectedPlanning.resources) {
      setResources(selectedPlanning.resources)
    }
  }, [selectedPlanning, title, description, methodology, resources])

  const visibleLessons = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase('pt-BR')

    return lessons.filter(lesson => {
      if (classId && lesson.class_id !== classId) return false
      if (statusFilter && lesson.status !== statusFilter) return false
      if (!normalizedSearch) return true

      return [lesson.title, lesson.description, lesson.subject, lesson.observations]
        .filter(Boolean)
        .some(value => String(value).toLocaleLowerCase('pt-BR').includes(normalizedSearch))
    })
  }, [lessons, classId, statusFilter, search])

  const summary = useMemo(() => ({
    total: lessons.length,
    planned: lessons.filter(item => item.status === 'planejada').length,
    preparing: lessons.filter(item => item.status === 'em_preparacao').length,
    completed: lessons.filter(item => ['realizada', 'parcialmente_realizada'].includes(item.status)).length,
  }), [lessons])

  async function validateCalendarDate(): Promise<void> {
    setCalendarNotice(null)

    if (!scheduledDate || !schoolYear || !institutionalContext) return

    if (
      selectedClass?.school_id &&
      selectedClass.school_id !== institutionalContext.school.id
    ) {
      return
    }

    setCheckingCalendar(true)

    try {
      const params = new URLSearchParams({
        schoolYearId: schoolYear.id,
        startDate: scheduledDate,
        endDate: scheduledDate,
      })

      const response = await fetch(
        `/api/agenda/institutional-calendar/events?${params.toString()}`,
        { credentials: 'include', cache: 'no-store' },
      )
      const body = await response.json() as CalendarEventsResponse

      if (!response.ok || !body.success) {
        throw new Error(body.error || 'Não foi possível consultar o Calendário Acadêmico.')
      }

      const activeEvents = (body.data ?? []).filter(
        item => !['cancelled', 'archived'].includes(item.status),
      )

      const blockingEvent = activeEvents.find(item => item.suspends_classes)
      if (blockingEvent) {
        const typeLabel = CALENDAR_EVENT_LABELS[blockingEvent.event_type] ?? 'Evento institucional'
        throw new Error(
          `${typeLabel}: “${blockingEvent.title}”. Esta data está configurada com suspensão de aulas. Escolha outra data ou ajuste o Calendário Acadêmico.`,
        )
      }

      const instructionalEvent = activeEvents.find(item => item.is_instructional_day)
      const schoolActivity = activeEvents.find(item => item.counts_as_school_day)

      if (instructionalEvent) {
        setCalendarNotice(`Calendário Acadêmico: ${instructionalEvent.title} · data letiva confirmada.`)
      } else if (schoolActivity) {
        setCalendarNotice(`Calendário Acadêmico: ${schoolActivity.title} · atividade escolar cadastrada para esta data.`)
      }
    } finally {
      setCheckingCalendar(false)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    setSuccess(null)
    clearError()

    if (!classId) {
      setFormError('Selecione uma turma cadastrada.')
      return
    }

    if (!planningId || !selectedPlanning) {
      setFormError('Selecione um planejamento da turma. A Agenda não cria aulas sem planejamento.')
      return
    }

    if (!title.trim()) {
      setFormError('Informe o título da aula.')
      return
    }

    setSubmitting(true)

    try {
      await validateCalendarDate()

      await createLesson({
        title: title.trim(),
        classId,
        subject: selectedClass?.subject ?? selectedPlanning.subject ?? null,
        scheduledDate: scheduledDate || null,
        startTime: startTime || null,
        endTime: endTime || null,
        planningId,
        academicPeriodId: academicPeriodId || selectedPlanning.academic_period_id || null,
        description: description.trim() || null,
        skills: normalizeSkills(skills),
        methodology: methodology.trim() || selectedPlanning.methodology || null,
        resources: resources.trim() || selectedPlanning.resources || null,
        status: 'planejada',
        organizationId: institutionalContext?.organization.id ?? null,
        schoolId: selectedClass?.school_id ?? selectedPlanning.school_id ?? institutionalContext?.school.id ?? null,
        metadata: {
          source: 'agenda_lessons_operational',
          planningTitle: selectedPlanning.title,
          className: selectedClass?.name ?? selectedPlanning.class_name ?? null,
          calendarValidated: Boolean(scheduledDate && schoolYear && institutionalContext),
          schoolYearId: schoolYear?.id ?? null,
        },
      })

      setTitle('')
      setDescription('')
      setSkills('')
      setMethodology('')
      setResources('')
      setStartTime('')
      setEndTime('')
      setCreateOpen(false)
      setSuccess('Aula criada e vinculada ao planejamento selecionado.')
      await loadLessons()
    } catch (createError) {
      setFormError(
        createError instanceof Error
          ? createError.message
          : 'Não foi possível criar a aula.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  async function complete(lesson: AgendaLesson) {
    const observations = window.prompt(
      'Registre uma observação sobre a realização da aula:',
      lesson.observations ?? '',
    )
    if (observations === null) return

    try {
      await completeLesson(lesson.id, {
        observations: observations.trim() || null,
      })
      setSuccess('Aula registrada como realizada.')
    } catch {
      // O hook apresenta o erro.
    }
  }

  async function cancel(lesson: AgendaLesson) {
    const reason = window.prompt('Informe o motivo do cancelamento:')?.trim()
    if (!reason) return

    try {
      await cancelLesson(lesson.id, reason)
      setSuccess('Aula cancelada.')
    } catch {
      // O hook apresenta o erro.
    }
  }

  async function remove(lesson: AgendaLesson) {
    const confirmed = window.confirm(`Deseja excluir a aula “${lesson.title}”?`)
    if (!confirmed) return
    const reason = window.prompt('Informe o motivo da exclusão:')?.trim()
    if (!reason) return

    try {
      await deleteLesson(lesson.id, reason)
      setSuccess('Aula excluída.')
    } catch {
      // O hook apresenta o erro.
    }
  }

  return (
    <AgendaPageShell
      eyebrow="Execução pedagógica"
      title="Aulas"
      description="A aula nasce de uma turma e de um planejamento já existentes. A Agenda reaproveita o contexto e consulta o Calendário Acadêmico antes de registrar a execução."
    >
      <div className="space-y-6 sm:space-y-8">
        <section className="grid overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm sm:grid-cols-2 xl:grid-cols-4">
          {[
            ['Aulas', summary.total],
            ['Planejadas', summary.planned],
            ['Em preparação', summary.preparing],
            ['Realizadas', summary.completed],
          ].map(([label, value], index) => (
            <article key={String(label)} className={`p-5 ${index < 3 ? 'border-b border-slate-200 xl:border-b-0 xl:border-r' : ''}`}>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{label}</p>
              <p className="mt-3 text-3xl font-bold text-[#071827]">{value}</p>
            </article>
          ))}
        </section>

        <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0B7491]">Consulta</p>
              <h2 className="mt-1 text-xl font-bold text-[#071827]">Aulas registradas</h2>
            </div>
            <button
              type="button"
              onClick={() => setCreateOpen(current => !current)}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#0B7491] px-5 py-3 text-sm font-bold text-white"
            >
              {createOpen ? 'Fechar nova aula' : 'Nova aula'}
            </button>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_220px_auto]">
            <input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Pesquisar aulas"
              className="min-h-12 rounded-xl border border-slate-300 px-4 text-sm outline-none focus:border-cyan-500"
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
              value={statusFilter}
              onChange={event => setStatusFilter(event.target.value)}
              className="min-h-12 rounded-xl border border-slate-300 bg-white px-3 text-sm"
            >
              <option value="">Todos os status</option>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => void loadLessons()}
              disabled={loading}
              className="min-h-12 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700"
            >
              Atualizar
            </button>
          </div>
        </section>

        {createOpen ? (
          <form onSubmit={handleSubmit} className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B7491]">Operação</p>
            <h2 className="mt-2 text-2xl font-bold text-[#071827]">Criar aula a partir do planejamento</h2>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="text-sm font-semibold text-slate-700">
                Turma
                <select
                  value={classId}
                  onChange={event => changeClass(event.target.value)}
                  required
                  disabled={classesLoading}
                  className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 font-normal"
                >
                  <option value="">Selecione a turma</option>
                  {classes.map(item => (
                    <option key={item.id} value={item.id}>{item.name}{item.subject ? ` · ${item.subject}` : ''}</option>
                  ))}
                </select>
              </label>

              <label className="text-sm font-semibold text-slate-700">
                Planejamento
                <select
                  value={planningId}
                  onChange={event => setPlanningId(event.target.value)}
                  required
                  disabled={!classId || planningLoading}
                  className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 font-normal"
                >
                  <option value="">
                    {!classId
                      ? 'Selecione a turma primeiro'
                      : availablePlanning.length === 0
                        ? 'Nenhum planejamento disponível'
                        : 'Selecione o planejamento'}
                  </option>
                  {availablePlanning.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}
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
                  <option value="">Herdar do planejamento</option>
                  {academicPeriods.map(period => <option key={period.id} value={period.id}>{period.name}</option>)}
                </select>
              </label>

              <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-4 text-sm text-slate-700">
                <p className="text-xs font-bold uppercase text-[#0B7491]">Componente</p>
                <p className="mt-1 font-semibold">{selectedClass?.subject ?? selectedPlanning?.subject ?? 'Definido pelo planejamento/turma'}</p>
              </div>
            </div>

            {availablePlanning.length === 0 && classId && !planningLoading ? (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                Esta turma ainda não possui planejamento. Crie o planejamento antes da aula.
                <Link href="/agenda/planejamento" className="ml-2 font-bold underline">Ir para Planejamento</Link>
              </div>
            ) : null}

            {(classesError || periodsError) ? (
              <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{classesError || periodsError}</p>
            ) : null}

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="text-sm font-semibold text-slate-700 md:col-span-2">
                Título
                <input value={title} onChange={event => setTitle(event.target.value)} required className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-4 font-normal" />
              </label>

              <label className="text-sm font-semibold text-slate-700 md:col-span-2">
                Descrição
                <textarea value={description} onChange={event => setDescription(event.target.value)} rows={3} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal" />
              </label>

              <label className="text-sm font-semibold text-slate-700">
                Data
                <input type="date" value={scheduledDate} onChange={event => setScheduledDate(event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-3 font-normal" />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm font-semibold text-slate-700">
                  Início
                  <input type="time" value={startTime} onChange={event => setStartTime(event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-3 font-normal" />
                </label>
                <label className="text-sm font-semibold text-slate-700">
                  Término
                  <input type="time" value={endTime} onChange={event => setEndTime(event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-3 font-normal" />
                </label>
              </div>

              <label className="text-sm font-semibold text-slate-700 md:col-span-2">
                Habilidades
                <textarea value={skills} onChange={event => setSkills(event.target.value)} rows={3} placeholder="Separe por vírgula ou linha" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal" />
              </label>

              <label className="text-sm font-semibold text-slate-700">
                Metodologia
                <textarea value={methodology} onChange={event => setMethodology(event.target.value)} rows={3} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal" />
              </label>

              <label className="text-sm font-semibold text-slate-700">
                Recursos
                <textarea value={resources} onChange={event => setResources(event.target.value)} rows={3} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal" />
              </label>
            </div>

            {calendarNotice ? (
              <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">{calendarNotice}</p>
            ) : null}

            {schoolYear && institutionalContext ? (
              <p className="mt-4 rounded-xl border border-cyan-200 bg-cyan-50 p-3 text-xs leading-5 text-slate-700">
                A data será validada automaticamente no Calendário Acadêmico de {institutionalContext.school.name ?? 'sua instituição'} antes do registro da aula.
              </p>
            ) : null}

            {formError ? <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{formError}</p> : null}

            <button
              type="submit"
              disabled={submitting || checkingCalendar || mutating || !classId || !planningId}
              className="mt-5 inline-flex min-h-12 items-center justify-center rounded-xl bg-[#071827] px-6 py-3 text-sm font-bold text-white disabled:opacity-50"
            >
              {checkingCalendar ? 'Validando calendário...' : submitting ? 'Salvando...' : 'Salvar aula'}
            </button>
          </form>
        ) : null}

        {(error || success) ? (
          <p className={`rounded-xl border p-4 text-sm font-semibold ${error ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>
            {error || success}
          </p>
        ) : null}

        <section className="grid gap-4 xl:grid-cols-2">
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">Carregando aulas...</div>
          ) : visibleLessons.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 xl:col-span-2">Nenhuma aula encontrada.</div>
          ) : (
            visibleLessons.map(lesson => (
              <article key={lesson.id} className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">
                <header className="border-b border-slate-200 bg-slate-50 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#0B7491]">{STATUS_LABELS[lesson.status]}</p>
                      <h3 className="mt-2 text-xl font-bold text-[#071827]">{lesson.title}</h3>
                      <p className="mt-1 text-sm text-slate-500">{lesson.subject ?? 'Componente herdado do contexto'}</p>
                    </div>
                    <p className="text-xs text-slate-500">{formatDate(lesson.scheduled_date)}</p>
                  </div>
                </header>

                <div className="p-5">
                  {lesson.description ? <p className="text-sm leading-6 text-slate-600">{lesson.description}</p> : null}
                  <div className="mt-4 grid gap-2 text-xs sm:grid-cols-2">
                    <div className="rounded-xl bg-slate-50 p-3"><span className="block font-bold text-slate-500">Planejamento</span>{planning.find(item => item.id === lesson.planning_id)?.title ?? 'Vinculado'}</div>
                    <div className="rounded-xl bg-slate-50 p-3"><span className="block font-bold text-slate-500">Horário</span>{lesson.start_time?.slice(0, 5) ?? '—'}{lesson.end_time ? `–${lesson.end_time.slice(0, 5)}` : ''}</div>
                  </div>
                </div>

                <footer className="flex flex-wrap gap-2 border-t border-slate-200 bg-slate-50 p-4">
                  {lesson.status === 'planejada' ? (
                    <button type="button" onClick={() => void markAsPreparing(lesson.id)} disabled={mutating} className="rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-bold text-[#075F78]">Preparar</button>
                  ) : null}
                  {!['realizada', 'cancelada'].includes(lesson.status) ? (
                    <button type="button" onClick={() => void complete(lesson)} disabled={mutating} className="rounded-xl bg-[#071827] px-4 py-2 text-sm font-bold text-white">Registrar realização</button>
                  ) : null}
                  {lesson.status !== 'cancelada' ? (
                    <button type="button" onClick={() => void cancel(lesson)} disabled={mutating} className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700">Cancelar</button>
                  ) : null}
                  <Link href={`/agenda/evidencias/registro?source=lesson&id=${encodeURIComponent(lesson.id)}`} className="rounded-xl border border-cyan-200 bg-white px-4 py-2 text-sm font-bold text-[#075F78]">Registrar evidência</Link>
                  <button type="button" onClick={() => void remove(lesson)} disabled={mutating} className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700">Excluir</button>
                </footer>
              </article>
            ))
          )}
        </section>
      </div>
    </AgendaPageShell>
  )
}
