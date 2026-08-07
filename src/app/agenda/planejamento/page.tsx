'use client'

import { type FormEvent, useMemo, useState } from 'react'

import { AgendaPageShell } from '@/components/agenda/AgendaPageShell'
import { PlanningRecordActions } from '@/components/agenda/PlanningRecordActions'
import { usePedagogicalContext } from '@/lib/agenda/hooks/usePedagogicalContext'
import { usePlanning } from '@/lib/agenda/hooks/usePlanning'

type PlanningFormData = {
  title: string
  description: string
  objective: string
  methodology: string
  resources: string
  evaluation: string
  plannedDate: string
}

const initialFormData: PlanningFormData = {
  title: '',
  description: '',
  objective: '',
  methodology: '',
  resources: '',
  evaluation: '',
  plannedDate: '',
}

const inputClassName = [
  'min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3',
  'text-slate-950 outline-none transition placeholder:text-slate-400',
  'focus:border-[#0B7491] focus:ring-4 focus:ring-cyan-100',
  'disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500',
].join(' ')

function formatPlanningDate(value: string | null): string {
  if (!value) return 'Data não definida'

  const date = new Date(`${value}T12:00:00`)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(date)
}

function formatStatus(value: string): string {
  const labels: Record<string, string> = {
    rascunho: 'Rascunho',
    em_revisao: 'Em revisão',
    'em revisão': 'Em revisão',
    aprovado: 'Aprovado',
    programado: 'Programado',
    planejado: 'Planejado',
    executado: 'Executado',
    concluido: 'Concluído',
    concluído: 'Concluído',
    arquivado: 'Arquivado',
  }

  return labels[value] ?? value.replace(/_/g, ' ')
}

export default function AgendaPlanningPage() {
  const {
    planning,
    loading,
    mutating,
    error,
    reload,
    createPlanning,
    updatePlanning,
    archivePlanning,
    deletePlanning,
  } = usePlanning()

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

  const [formData, setFormData] = useState<PlanningFormData>(initialFormData)
  const [createOpen, setCreateOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [search, setSearch] = useState('')
  const [filterClassId, setFilterClassId] = useState('')

  const visiblePlanning = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase('pt-BR')

    return planning.filter(item => {
      const matchesClass = !filterClassId || item.class_id === filterClassId
      const matchesSearch =
        !normalizedSearch ||
        [item.title, item.objective, item.subject, item.class_name, item.description]
          .filter(Boolean)
          .some(value => String(value).toLocaleLowerCase('pt-BR').includes(normalizedSearch))

      return matchesClass && matchesSearch
    })
  }, [planning, search, filterClassId])

  const summary = useMemo(() => ({
    total: planning.length,
    drafts: planning.filter(item => item.status === 'rascunho').length,
    scheduled: planning.filter(item => Boolean(item.planned_date)).length,
    completed: planning.filter(item => ['executado', 'concluido', 'concluído'].includes(item.status)).length,
  }), [planning])

  function updateField<Key extends keyof PlanningFormData>(field: Key, value: PlanningFormData[Key]) {
    setFormData(current => ({ ...current, [field]: value }))
    setFormError('')
    setSuccessMessage('')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError('')
    setSuccessMessage('')

    if (!classId) {
      setFormError('Selecione uma turma cadastrada para criar o planejamento.')
      return
    }

    if (!formData.title.trim() || !formData.objective.trim()) {
      setFormError('Informe o título e o objetivo do planejamento.')
      return
    }

    setSaving(true)

    try {
      await createPlanning({
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        subject: selectedClass?.subject ?? null,
        class_name: selectedClass?.name ?? null,
        class_id: classId,
        academic_period_id: academicPeriodId || null,
        objective: formData.objective.trim(),
        methodology: formData.methodology.trim() || null,
        resources: formData.resources.trim() || null,
        evaluation: formData.evaluation.trim() || null,
        planned_date: formData.plannedDate || null,
        status: 'rascunho',
        school_id: selectedClass?.school_id ?? null,
        metadata: {
          source: 'agenda_planning_contextual_flow',
          className: selectedClass?.name ?? null,
          subject: selectedClass?.subject ?? null,
        },
      })

      setFormData(initialFormData)
      setSuccessMessage('Planejamento salvo e vinculado à turma selecionada.')
      setCreateOpen(false)
    } catch (saveError) {
      setFormError(
        saveError instanceof Error
          ? saveError.message
          : 'Não foi possível salvar o planejamento.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <AgendaPageShell
      eyebrow="Organização pedagógica"
      title="Planejamento pedagógico"
      description="Consulte seus planejamentos e crie novos registros sempre vinculados a uma turma e ao contexto acadêmico já existente."
    >
      <div className="space-y-6 sm:space-y-8">
        <section className="grid overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm sm:grid-cols-2 xl:grid-cols-4">
          {[
            ['Planejamentos', summary.total],
            ['Rascunhos', summary.drafts],
            ['Com data', summary.scheduled],
            ['Executados', summary.completed],
          ].map(([label, value], index) => (
            <article
              key={String(label)}
              className={[
                'p-5',
                index < 3 ? 'border-b border-slate-200 xl:border-b-0 xl:border-r' : '',
              ].join(' ')}
            >
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{label}</p>
              <p className="mt-3 text-3xl font-bold text-[#071827]">{value}</p>
            </article>
          ))}
        </section>

        <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0B7491]">Consulta</p>
              <h2 className="mt-1 text-xl font-bold text-[#071827]">Meus planejamentos</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Pesquise e filtre os registros existentes. A criação fica separada para não misturar consulta e operação.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCreateOpen(current => !current)}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#0B7491] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#09657E]"
            >
              {createOpen ? 'Fechar novo planejamento' : 'Novo planejamento'}
            </button>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(220px,0.45fr)_auto]">
            <input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Pesquisar por título, objetivo ou componente"
              className={inputClassName}
            />
            <select
              value={filterClassId}
              onChange={event => setFilterClassId(event.target.value)}
              disabled={classesLoading}
              className={inputClassName}
            >
              <option value="">Todas as turmas</option>
              {classes.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
            <button
              type="button"
              onClick={() => void reload()}
              disabled={loading}
              className="min-h-12 rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700"
            >
              Atualizar
            </button>
          </div>
        </section>

        {createOpen ? (
          <form onSubmit={handleSubmit} className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
            <header className="border-b border-slate-200 px-5 py-5 sm:px-7">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B7491]">Operação</p>
              <h2 className="mt-2 text-2xl font-bold text-[#071827]">Criar planejamento</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Primeiro selecione a turma. O componente e demais dados conhecidos são herdados automaticamente.
              </p>
            </header>

            <div className="space-y-6 p-5 sm:p-7">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Turma
                  <select
                    value={classId}
                    onChange={event => changeClass(event.target.value)}
                    disabled={classesLoading || saving}
                    required
                    className={`mt-2 ${inputClassName}`}
                  >
                    <option value="">{classesLoading ? 'Carregando turmas...' : 'Selecione a turma'}</option>
                    {classes.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.name}{item.subject ? ` · ${item.subject}` : ''}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-sm font-semibold text-slate-700">
                  Período letivo
                  <select
                    value={academicPeriodId}
                    onChange={event => setAcademicPeriodId(event.target.value)}
                    disabled={periodsLoading || academicPeriods.length === 0 || saving}
                    className={`mt-2 ${inputClassName}`}
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

              {selectedClass ? (
                <div className="grid gap-3 rounded-2xl border border-cyan-200 bg-cyan-50 p-4 text-sm text-slate-700 sm:grid-cols-3">
                  <div><span className="block text-xs font-bold uppercase text-[#0B7491]">Turma</span>{selectedClass.name}</div>
                  <div><span className="block text-xs font-bold uppercase text-[#0B7491]">Componente</span>{selectedClass.subject ?? 'Não informado'}</div>
                  <div><span className="block text-xs font-bold uppercase text-[#0B7491]">Ano/Série</span>{selectedClass.grade ?? selectedClass.school_year ?? 'Não informado'}</div>
                </div>
              ) : null}

              {(classesError || periodsError) ? (
                <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  {classesError || periodsError}
                </p>
              ) : null}

              <div className="grid gap-5">
                <label className="block text-sm font-semibold text-slate-700">
                  Título
                  <input
                    value={formData.title}
                    onChange={event => updateField('title', event.target.value)}
                    placeholder="Ex.: Sequência didática sobre energia"
                    required
                    className={`mt-2 ${inputClassName}`}
                  />
                </label>

                <label className="block text-sm font-semibold text-slate-700">
                  Objetivo
                  <textarea
                    value={formData.objective}
                    onChange={event => updateField('objective', event.target.value)}
                    rows={3}
                    required
                    className={`mt-2 ${inputClassName}`}
                  />
                </label>

                <label className="block text-sm font-semibold text-slate-700">
                  Contexto / descrição
                  <textarea
                    value={formData.description}
                    onChange={event => updateField('description', event.target.value)}
                    rows={3}
                    className={`mt-2 ${inputClassName}`}
                  />
                </label>

                <div className="grid gap-5 md:grid-cols-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Metodologia
                    <textarea value={formData.methodology} onChange={event => updateField('methodology', event.target.value)} rows={3} className={`mt-2 ${inputClassName}`} />
                  </label>
                  <label className="block text-sm font-semibold text-slate-700">
                    Recursos
                    <textarea value={formData.resources} onChange={event => updateField('resources', event.target.value)} rows={3} className={`mt-2 ${inputClassName}`} />
                  </label>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Acompanhamento / avaliação
                    <textarea value={formData.evaluation} onChange={event => updateField('evaluation', event.target.value)} rows={3} className={`mt-2 ${inputClassName}`} />
                  </label>
                  <label className="block text-sm font-semibold text-slate-700">
                    Data planejada
                    <input type="date" value={formData.plannedDate} onChange={event => updateField('plannedDate', event.target.value)} className={`mt-2 ${inputClassName}`} />
                  </label>
                </div>
              </div>

              {formError ? <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{formError}</p> : null}
              {successMessage ? <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{successMessage}</p> : null}

              <button
                type="submit"
                disabled={saving || mutating || !classId}
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#071827] px-6 py-3 text-sm font-bold text-white disabled:opacity-50"
              >
                {saving ? 'Salvando...' : 'Salvar planejamento'}
              </button>
            </div>
          </form>
        ) : null}

        {error ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">{error}</p>
        ) : null}

        <section className="space-y-4">
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">Carregando planejamentos...</div>
          ) : visiblePlanning.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
              Nenhum planejamento encontrado para os filtros selecionados.
            </div>
          ) : (
            visiblePlanning.map(item => (
              <article key={item.id} className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">
                <div className="p-5 sm:p-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-[0.12em]">
                        <span className="text-[#0B7491]">{formatStatus(item.status)}</span>
                        {item.class_name ? <span className="text-slate-400">· {item.class_name}</span> : null}
                        {item.subject ? <span className="text-slate-400">· {item.subject}</span> : null}
                      </div>
                      <h3 className="mt-2 text-xl font-bold text-[#071827]">{item.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{item.objective || 'Objetivo não informado.'}</p>
                      <p className="mt-3 text-xs text-slate-500">{formatPlanningDate(item.planned_date)}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-200 bg-slate-50 p-4 sm:p-5">
                  <PlanningRecordActions
                    planning={item}
                    disabled={mutating}
                    onUpdate={updatePlanning}
                    onArchive={archivePlanning}
                    onDelete={deletePlanning}
                  />
                </div>
              </article>
            ))
          )}
        </section>
      </div>
    </AgendaPageShell>
  )
}
