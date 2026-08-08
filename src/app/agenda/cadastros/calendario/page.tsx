'use client'

import { type FormEvent, useEffect, useMemo, useState } from 'react'

import { AgendaPageShell } from '@/components/agenda/AgendaPageShell'
import { usePedagogicalContext } from '@/lib/agenda/hooks/usePedagogicalContext'

type CalendarContext = {
  id: string
  organization: { id: string; name: string }
  school: { id: string; name: string; shortName: string | null; city: string | null; state: string | null }
  canManage: boolean
}

type SchoolYear = {
  id: string
  year: number
  name: string | null
  start_date: string | null
  end_date: string | null
  active: boolean
  status: string
  minimum_school_days?: number | null
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
  priority: string
}

const EVENT_TYPES = [
  ['instructional_day', 'Dia letivo'],
  ['vacation', 'Férias'],
  ['recess', 'Recesso escolar'],
  ['holiday', 'Feriado'],
  ['optional_holiday', 'Ponto facultativo'],
  ['planning', 'Planejamento pedagógico'],
  ['class_council', 'Conselho de classe'],
  ['teacher_training', 'Formação / ATPC'],
  ['assessment', 'Avaliação / Simulado'],
  ['school_event', 'Evento escolar'],
  ['suspension', 'Suspensão de atividades'],
] as const

const inputClassName = 'min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-[#071827] outline-none focus:border-[#0B7491] focus:ring-4 focus:ring-cyan-100'

function labelForEventType(value: string) {
  return EVENT_TYPES.find(([type]) => type === value)?.[1] ?? value.replace(/_/g, ' ')
}

export default function AcademicCalendarRegistryPage() {
  const { academicPeriods, selectedSchoolYear, reloadAcademicPeriods } = usePedagogicalContext()
  const [contexts, setContexts] = useState<CalendarContext[]>([])
  const [contextId, setContextId] = useState('')
  const [schoolYears, setSchoolYears] = useState<SchoolYear[]>([])
  const [schoolYearId, setSchoolYearId] = useState('')
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [eventType, setEventType] = useState('instructional_day')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [academicPeriodId, setAcademicPeriodId] = useState('')
  const [description, setDescription] = useState('')

  const selectedContext = useMemo(
    () => contexts.find(item => item.id === contextId) ?? contexts[0] ?? null,
    [contexts, contextId],
  )

  const selectedYear = useMemo(
    () => schoolYears.find(item => item.id === schoolYearId) ?? null,
    [schoolYears, schoolYearId],
  )

  const selectedEventDefaults = useMemo(() => {
    const noClass = ['vacation', 'recess', 'holiday', 'optional_holiday', 'suspension'].includes(eventType)
    const instructional = eventType === 'instructional_day'
    return {
      isInstructionalDay: instructional,
      countsAsSchoolDay: instructional,
      suspendsClasses: noClass,
    }
  }, [eventType])

  async function loadContexts() {
    const response = await fetch('/api/agenda/institutional-calendar/contexts?limit=100', {
      credentials: 'include', cache: 'no-store',
    })
    const body = await response.json() as { success?: boolean; data?: CalendarContext[]; error?: string }
    if (!response.ok || !body.success) throw new Error(body.error || 'Não foi possível carregar os contextos institucionais.')
    const next = body.data ?? []
    setContexts(next)
    if (!contextId && next[0]) setContextId(next[0].id)
  }

  async function loadSchoolYears(context = selectedContext) {
    if (!context) return
    const params = new URLSearchParams({
      organizationId: context.organization.id,
      schoolId: context.school.id,
    })
    const response = await fetch(`/api/agenda/institutional-calendar?${params.toString()}`, {
      credentials: 'include', cache: 'no-store',
    })
    const body = await response.json() as { success?: boolean; data?: SchoolYear[]; error?: string }
    if (!response.ok || !body.success) throw new Error(body.error || 'Não foi possível carregar os anos letivos.')
    const next = body.data ?? []
    setSchoolYears(next)
    const preferred = next.find(item => item.active) ?? next.find(item => item.id === selectedSchoolYear?.id) ?? next[0]
    setSchoolYearId(preferred?.id ?? '')
  }

  async function loadEvents(nextSchoolYearId = schoolYearId) {
    if (!nextSchoolYearId) {
      setEvents([])
      return
    }
    const response = await fetch(`/api/agenda/institutional-calendar/events?schoolYearId=${encodeURIComponent(nextSchoolYearId)}`, {
      credentials: 'include', cache: 'no-store',
    })
    const body = await response.json() as { success?: boolean; data?: CalendarEvent[]; error?: string }
    if (!response.ok || !body.success) throw new Error(body.error || 'Não foi possível carregar os eventos do calendário.')
    setEvents(body.data ?? [])
  }

  useEffect(() => {
    setLoading(true)
    setError(null)
    void loadContexts()
      .catch(loadError => setError(loadError instanceof Error ? loadError.message : 'Erro ao carregar calendário.'))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!selectedContext) return
    setLoading(true)
    setError(null)
    void loadSchoolYears(selectedContext)
      .catch(loadError => setError(loadError instanceof Error ? loadError.message : 'Erro ao carregar anos letivos.'))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedContext?.id])

  useEffect(() => {
    if (!schoolYearId) return
    void loadEvents(schoolYearId).catch(loadError => {
      setError(loadError instanceof Error ? loadError.message : 'Erro ao carregar eventos.')
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schoolYearId])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedContext || !selectedYear) {
      setError('Selecione uma instituição/unidade e um ano letivo.')
      return
    }
    if (!title.trim() || !startDate || !endDate) {
      setError('Informe título, data inicial e data final.')
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
          eventType,
          startDate,
          endDate,
          allDay: true,
          isInstructionalDay: selectedEventDefaults.isInstructionalDay,
          countsAsSchoolDay: selectedEventDefaults.countsAsSchoolDay,
          suspendsClasses: selectedEventDefaults.suspendsClasses,
          isMandatory: eventType === 'teacher_training' || eventType === 'class_council',
          priority: selectedEventDefaults.suspendsClasses ? 'high' : 'normal',
          sourceType: 'institutional',
        }),
      })
      const body = await response.json() as { success?: boolean; error?: string }
      if (!response.ok || !body.success) throw new Error(body.error || 'Não foi possível cadastrar o evento.')

      setTitle('')
      setDescription('')
      setStartDate('')
      setEndDate('')
      setSuccess('Evento acadêmico cadastrado com sucesso.')
      await Promise.all([loadEvents(selectedYear.id), reloadAcademicPeriods()])
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Não foi possível cadastrar o evento.')
    } finally {
      setSaving(false)
    }
  }

  const summary = useMemo(() => ({
    total: events.length,
    instructional: events.filter(item => item.is_instructional_day || item.counts_as_school_day).length,
    noClass: events.filter(item => item.suspends_classes).length,
    periods: academicPeriods.length,
  }), [events, academicPeriods])

  return (
    <AgendaPageShell
      eyebrow="EIOS Registry · Calendário"
      title="Calendário Acadêmico"
      description="Cadastre dias letivos, férias, recessos, feriados, pontos facultativos e eventos da instituição. Esses dados passam a orientar Planejamento, Aulas, Diário e Relatórios."
    >
      <div className="space-y-6 sm:space-y-8">
        <section className="grid overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm sm:grid-cols-2 xl:grid-cols-4">
          {[
            ['Eventos', summary.total],
            ['Dias letivos/eventos letivos', summary.instructional],
            ['Suspensões de aula', summary.noClass],
            ['Períodos cadastrados', summary.periods],
          ].map(([label, value], index) => (
            <article key={String(label)} className={`p-5 ${index < 3 ? 'border-b border-slate-200 xl:border-b-0 xl:border-r' : ''}`}>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{label}</p>
              <p className="mt-3 text-3xl font-bold text-[#071827]">{value}</p>
            </article>
          ))}
        </section>

        <form onSubmit={handleSubmit} className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-col gap-2">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0B7491]">Novo evento acadêmico</p>
            <h2 className="text-2xl font-bold text-[#071827]">Cadastrar data ou período</h2>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <label className="text-sm font-semibold text-slate-700">Instituição / unidade
              <select value={contextId} onChange={event => setContextId(event.target.value)} className={`mt-2 ${inputClassName}`} disabled={contexts.length <= 1}>
                {contexts.map(item => <option key={item.id} value={item.id}>{item.organization.name} · {item.school.name}</option>)}
              </select>
            </label>

            <label className="text-sm font-semibold text-slate-700">Ano letivo
              <select value={schoolYearId} onChange={event => setSchoolYearId(event.target.value)} className={`mt-2 ${inputClassName}`}>
                <option value="">Selecione</option>
                {schoolYears.map(item => <option key={item.id} value={item.id}>{item.name ?? item.year}</option>)}
              </select>
            </label>

            <label className="text-sm font-semibold text-slate-700">Período letivo (opcional)
              <select value={academicPeriodId} onChange={event => setAcademicPeriodId(event.target.value)} className={`mt-2 ${inputClassName}`}>
                <option value="">Todo o ano / sem período específico</option>
                {academicPeriods.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </label>

            <label className="text-sm font-semibold text-slate-700">Tipo
              <select value={eventType} onChange={event => setEventType(event.target.value)} className={`mt-2 ${inputClassName}`}>
                {EVENT_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>

            <label className="text-sm font-semibold text-slate-700 md:col-span-2">Título
              <input value={title} onChange={event => setTitle(event.target.value)} placeholder="Ex.: Recesso escolar de julho" className={`mt-2 ${inputClassName}`} />
            </label>

            <label className="text-sm font-semibold text-slate-700">Data inicial
              <input type="date" value={startDate} onChange={event => { setStartDate(event.target.value); if (!endDate) setEndDate(event.target.value) }} className={`mt-2 ${inputClassName}`} />
            </label>

            <label className="text-sm font-semibold text-slate-700">Data final
              <input type="date" value={endDate} onChange={event => setEndDate(event.target.value)} className={`mt-2 ${inputClassName}`} />
            </label>

            <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-4 text-sm text-slate-700">
              <p className="text-xs font-bold uppercase text-[#075F78]">Regra automática</p>
              <p className="mt-1 font-semibold">{selectedEventDefaults.isInstructionalDay ? 'Conta como dia letivo' : selectedEventDefaults.suspendsClasses ? 'Suspende aulas' : 'Evento acadêmico sem suspensão automática'}</p>
            </div>

            <label className="text-sm font-semibold text-slate-700 md:col-span-2 xl:col-span-3">Descrição (opcional)
              <textarea rows={3} value={description} onChange={event => setDescription(event.target.value)} className={`mt-2 ${inputClassName}`} />
            </label>
          </div>

          {error ? <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-900">{error}</p> : null}
          {success ? <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">{success}</p> : null}

          <button type="submit" disabled={saving || loading || !selectedContext || !selectedYear} className="mt-5 min-h-12 rounded-xl bg-[#071827] px-6 py-3 text-sm font-bold text-white disabled:opacity-50">
            {saving ? 'Salvando...' : 'Cadastrar no calendário'}
          </button>
        </form>

        <section className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
          <header className="border-b border-slate-200 bg-slate-50 px-5 py-5 sm:px-7">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0B7491]">Calendário cadastrado</p>
            <h2 className="mt-1 text-xl font-bold text-[#071827]">Eventos do ano letivo</h2>
          </header>

          {events.length === 0 ? (
            <div className="p-6 text-sm text-slate-600">Nenhum evento cadastrado para o ano selecionado.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {events
                .slice()
                .sort((a, b) => a.start_date.localeCompare(b.start_date))
                .map(item => (
                  <article key={item.id} className="grid gap-3 px-5 py-4 sm:grid-cols-[130px_minmax(0,1fr)_180px] sm:items-center sm:px-7">
                    <div className="text-sm font-bold text-[#071827]">
                      {new Intl.DateTimeFormat('pt-BR').format(new Date(`${item.start_date}T12:00:00`))}
                      {item.end_date !== item.start_date ? <span className="block text-xs font-normal text-slate-500">até {new Intl.DateTimeFormat('pt-BR').format(new Date(`${item.end_date}T12:00:00`))}</span> : null}
                    </div>
                    <div>
                      <p className="font-bold text-[#071827]">{item.title}</p>
                      <p className="mt-1 text-xs text-slate-500">{labelForEventType(item.event_type)}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-[0.1em]">
                      {item.is_instructional_day || item.counts_as_school_day ? <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-emerald-800">Letivo</span> : null}
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
