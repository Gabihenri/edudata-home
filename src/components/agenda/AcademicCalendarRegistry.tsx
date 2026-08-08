'use client'

import { type FormEvent, useEffect, useMemo, useState } from 'react'

import { AgendaPageShell } from '@/components/agenda/AgendaPageShell'
import { usePedagogicalContext } from '@/lib/agenda/hooks/usePedagogicalContext'

type CalendarContext = {
  id: string
  organization: { id: string; name: string }
  school: { id: string; name: string }
}

type SchoolYear = {
  id: string
  year: number
  name: string | null
  active: boolean
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

type EventPreset = {
  value: string
  label: string
  instructional: boolean
  schoolDay: boolean
  suspends: boolean
  mandatory: boolean
}

const EVENT_PRESETS: EventPreset[] = [
  { value: 'school_saturday', label: 'Dia letivo / reposição', instructional: true, schoolDay: true, suspends: false, mandatory: true },
  { value: 'recess', label: 'Férias / recesso escolar', instructional: false, schoolDay: false, suspends: true, mandatory: false },
  { value: 'holiday', label: 'Feriado', instructional: false, schoolDay: false, suspends: true, mandatory: false },
  { value: 'optional_holiday', label: 'Ponto facultativo', instructional: false, schoolDay: false, suspends: true, mandatory: false },
  { value: 'planning', label: 'Planejamento pedagógico', instructional: false, schoolDay: true, suspends: true, mandatory: true },
  { value: 'school_council', label: 'Conselho de classe', instructional: false, schoolDay: true, suspends: false, mandatory: true },
  { value: 'teacher_training', label: 'Formação / ATPC', instructional: false, schoolDay: true, suspends: false, mandatory: true },
  { value: 'assessment', label: 'Avaliação / simulado', instructional: true, schoolDay: true, suspends: false, mandatory: true },
  { value: 'closure', label: 'Suspensão de atividades', instructional: false, schoolDay: false, suspends: true, mandatory: false },
  { value: 'commemorative', label: 'Evento comemorativo', instructional: false, schoolDay: true, suspends: false, mandatory: false },
  { value: 'operational', label: 'Evento operacional', instructional: false, schoolDay: true, suspends: false, mandatory: false },
]

const fieldClass = 'mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-[#071827] outline-none focus:border-[#0B7491] focus:ring-4 focus:ring-cyan-100'

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(`${value}T12:00:00`))
}

function eventLabel(value: string) {
  return EVENT_PRESETS.find(item => item.value === value)?.label ?? value.replace(/_/g, ' ')
}

export function AcademicCalendarRegistry() {
  const { academicPeriods, reloadAcademicPeriods } = usePedagogicalContext()
  const [contexts, setContexts] = useState<CalendarContext[]>([])
  const [contextId, setContextId] = useState('')
  const [schoolYears, setSchoolYears] = useState<SchoolYear[]>([])
  const [schoolYearId, setSchoolYearId] = useState('')
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [eventType, setEventType] = useState(EVENT_PRESETS[0].value)
  const [academicPeriodId, setAcademicPeriodId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const selectedContext = useMemo(() => contexts.find(item => item.id === contextId) ?? contexts[0] ?? null, [contexts, contextId])
  const selectedYear = useMemo(() => schoolYears.find(item => item.id === schoolYearId) ?? null, [schoolYears, schoolYearId])
  const preset = useMemo(() => EVENT_PRESETS.find(item => item.value === eventType) ?? EVENT_PRESETS[0], [eventType])

  async function fetchJson<T>(url: string): Promise<T> {
    const response = await fetch(url, { credentials: 'include', cache: 'no-store' })
    const body = await response.json() as T & { success?: boolean; error?: string }
    if (!response.ok || body.success === false) throw new Error(body.error || 'Não foi possível carregar os dados.')
    return body
  }

  useEffect(() => {
    setLoading(true)
    void fetchJson<{ success: boolean; data: CalendarContext[] }>('/api/agenda/institutional-calendar/contexts?limit=100')
      .then(body => {
        setContexts(body.data ?? [])
        if (body.data?.[0]) setContextId(body.data[0].id)
      })
      .catch(loadError => setError(loadError instanceof Error ? loadError.message : 'Erro ao carregar contextos.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selectedContext) return
    const params = new URLSearchParams({ organizationId: selectedContext.organization.id, schoolId: selectedContext.school.id })
    setLoading(true)
    void fetchJson<{ success: boolean; data: SchoolYear[] }>(`/api/agenda/institutional-calendar?${params.toString()}`)
      .then(body => {
        const years = body.data ?? []
        setSchoolYears(years)
        setSchoolYearId((years.find(item => item.active) ?? years[0])?.id ?? '')
      })
      .catch(loadError => setError(loadError instanceof Error ? loadError.message : 'Erro ao carregar ano letivo.'))
      .finally(() => setLoading(false))
  }, [selectedContext?.id])

  async function loadEvents(id = schoolYearId) {
    if (!id) return setEvents([])
    const body = await fetchJson<{ success: boolean; data: CalendarEvent[] }>(`/api/agenda/institutional-calendar/events?schoolYearId=${encodeURIComponent(id)}`)
    setEvents(body.data ?? [])
  }

  useEffect(() => {
    if (!schoolYearId) return
    void loadEvents(schoolYearId).catch(loadError => setError(loadError instanceof Error ? loadError.message : 'Erro ao carregar eventos.'))
  }, [schoolYearId])

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedContext || !selectedYear || !title.trim() || !startDate || !endDate) {
      setError('Selecione o contexto, o ano letivo e informe título e datas.')
      return
    }

    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const response = await fetch('/api/agenda/institutional-calendar/events', {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          organizationId: selectedContext.organization.id,
          schoolId: selectedContext.school.id,
          schoolYearId: selectedYear.id,
          academicPeriodId: academicPeriodId || null,
          calendarYear: selectedYear.year,
          title: title.trim(),
          description: description.trim() || null,
          eventType: preset.value,
          startDate,
          endDate,
          allDay: true,
          isInstructionalDay: preset.instructional,
          countsAsSchoolDay: preset.schoolDay,
          suspendsClasses: preset.suspends,
          isMandatory: preset.mandatory,
          priority: preset.suspends ? 'high' : 'normal',
          sourceType: 'institutional',
        }),
      })
      const body = await response.json() as { success?: boolean; error?: string }
      if (!response.ok || !body.success) throw new Error(body.error || 'Não foi possível cadastrar a data.')

      setTitle('')
      setDescription('')
      setStartDate('')
      setEndDate('')
      setSuccess('Calendário atualizado com sucesso.')
      await Promise.all([loadEvents(selectedYear.id), reloadAcademicPeriods()])
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Não foi possível salvar o calendário.')
    } finally {
      setSaving(false)
    }
  }

  const totals = useMemo(() => ({
    events: events.length,
    instructional: events.filter(item => item.is_instructional_day || item.counts_as_school_day).length,
    closures: events.filter(item => item.suspends_classes).length,
  }), [events])

  return (
    <AgendaPageShell eyebrow="EIOS Registry · Calendário" title="Calendário Acadêmico" description="Cadastre dias letivos, férias, recessos, feriados, pontos facultativos e eventos institucionais que orientam toda a operação pedagógica.">
      <div className="space-y-6 sm:space-y-8">
        <section className="grid overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm sm:grid-cols-3">
          {[['Eventos', totals.events], ['Eventos/dias letivos', totals.instructional], ['Suspensões de aula', totals.closures]].map(([label, value], index) => (
            <article key={String(label)} className={`p-5 ${index < 2 ? 'border-b border-slate-200 sm:border-b-0 sm:border-r' : ''}`}>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{label}</p>
              <p className="mt-3 text-3xl font-bold text-[#071827]">{value}</p>
            </article>
          ))}
        </section>

        <form onSubmit={save} className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0B7491]">Cadastro</p>
          <h2 className="mt-1 text-2xl font-bold text-[#071827]">Nova data ou período</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <label className="text-sm font-semibold text-slate-700">Instituição / unidade
              <select value={contextId} onChange={event => setContextId(event.target.value)} className={fieldClass} disabled={contexts.length <= 1}>
                {contexts.map(item => <option key={item.id} value={item.id}>{item.organization.name} · {item.school.name}</option>)}
              </select>
            </label>
            <label className="text-sm font-semibold text-slate-700">Ano letivo
              <select value={schoolYearId} onChange={event => setSchoolYearId(event.target.value)} className={fieldClass}>
                <option value="">Selecione</option>
                {schoolYears.map(item => <option key={item.id} value={item.id}>{item.name ?? item.year}</option>)}
              </select>
            </label>
            <label className="text-sm font-semibold text-slate-700">Período letivo
              <select value={academicPeriodId} onChange={event => setAcademicPeriodId(event.target.value)} className={fieldClass}>
                <option value="">Todo o ano</option>
                {academicPeriods.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </label>
            <label className="text-sm font-semibold text-slate-700">Tipo
              <select value={eventType} onChange={event => setEventType(event.target.value)} className={fieldClass}>
                {EVENT_PRESETS.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </label>
            <label className="text-sm font-semibold text-slate-700 md:col-span-2">Título
              <input value={title} onChange={event => setTitle(event.target.value)} className={fieldClass} placeholder="Ex.: Recesso escolar de julho" />
            </label>
            <label className="text-sm font-semibold text-slate-700">Data inicial
              <input type="date" value={startDate} onChange={event => { setStartDate(event.target.value); if (!endDate) setEndDate(event.target.value) }} className={fieldClass} />
            </label>
            <label className="text-sm font-semibold text-slate-700">Data final
              <input type="date" value={endDate} onChange={event => setEndDate(event.target.value)} className={fieldClass} />
            </label>
            <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-4 text-sm text-slate-700">
              <p className="text-xs font-bold uppercase text-[#075F78]">Efeito na Agenda</p>
              <p className="mt-1 font-semibold">{preset.instructional ? 'Conta como dia letivo' : preset.suspends ? 'Suspende aulas' : preset.schoolDay ? 'Conta como atividade escolar' : 'Evento informativo'}</p>
            </div>
            <label className="text-sm font-semibold text-slate-700 md:col-span-2 xl:col-span-3">Descrição
              <textarea value={description} onChange={event => setDescription(event.target.value)} rows={3} className={fieldClass} />
            </label>
          </div>
          {error ? <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-900">{error}</p> : null}
          {success ? <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">{success}</p> : null}
          <button type="submit" disabled={saving || loading || !selectedContext || !selectedYear} className="mt-5 min-h-12 rounded-xl bg-[#071827] px-6 py-3 text-sm font-bold text-white disabled:opacity-50">{saving ? 'Salvando...' : 'Cadastrar no calendário'}</button>
        </form>

        <section className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
          <header className="border-b border-slate-200 bg-slate-50 px-5 py-5 sm:px-7">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0B7491]">Calendário cadastrado</p>
            <h2 className="mt-1 text-xl font-bold text-[#071827]">Datas e eventos do ano letivo</h2>
          </header>
          {events.length === 0 ? <p className="p-6 text-sm text-slate-600">Nenhum evento cadastrado.</p> : (
            <div className="divide-y divide-slate-100">
              {[...events].sort((a, b) => a.start_date.localeCompare(b.start_date)).map(item => (
                <article key={item.id} className="grid gap-3 px-5 py-4 sm:grid-cols-[150px_minmax(0,1fr)_180px] sm:items-center sm:px-7">
                  <p className="text-sm font-bold text-[#071827]">{formatDate(item.start_date)}{item.end_date !== item.start_date ? <span className="block text-xs font-normal text-slate-500">até {formatDate(item.end_date)}</span> : null}</p>
                  <div><p className="font-bold text-[#071827]">{item.title}</p><p className="mt-1 text-xs text-slate-500">{eventLabel(item.event_type)}</p></div>
                  <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-[0.1em]">
                    {item.is_instructional_day || item.counts_as_school_day ? <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-emerald-800">Letivo/Escolar</span> : null}
                    {item.suspends_classes ? <span className="rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-amber-800">Sem aula</span> : null}
                    <span className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-slate-600">{item.status}</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </AgendaPageShell>
  )
}
