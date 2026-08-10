'use client'

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  useClasses,
} from '@/lib/agenda/hooks/useClasses'

type AssessmentRow = {
  id: string
  title: string
  purpose: string
  status: string
  class_id: string
  component_id: string
  academic_period_id: string
  scheduled_at: string | null
  created_at: string
}

type OverviewResponse = {
  success: boolean
  assessments: AssessmentRow[]
  summary: {
    total: number
    diagnostic: number
    completed: number
    pendingReview: number
  }
  error?: string
}

const academicPeriods = [
  '1º Bimestre',
  '2º Bimestre',
  '3º Bimestre',
  '4º Bimestre',
]

function formatDate(
  value: string | null,
): string {
  if (!value) return '—'

  const date =
    new Date(value)

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return '—'
  }

  return new Intl.DateTimeFormat(
    'pt-BR',
    {
      dateStyle: 'short',
    },
  ).format(date)
}

export default function AssessmentCenterPanel() {
  const {
    classes,
    loading: loadingClasses,
  } = useClasses()

  const [data, setData] =
    useState<OverviewResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [search, setSearch] = useState('')
  const [title, setTitle] = useState('Avaliação Diagnóstica')
  const [classId, setClassId] = useState('')
  const [academicPeriod, setAcademicPeriod] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')

  const selectedClass = useMemo(
    () =>
      classes.find(
        agendaClass => agendaClass.id === classId,
      ) ?? null,
    [classes, classId],
  )

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(
        '/api/agenda/avaliacoes',
        {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
          headers: {
            Accept: 'application/json',
          },
        },
      )

      const body = await response.json() as OverviewResponse

      if (!response.ok || !body.success) {
        throw new Error(
          body.error || 'Não foi possível carregar as avaliações.',
        )
      }

      setData(body)
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Não foi possível carregar as avaliações.',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    if (!selectedClass) {
      setError('Selecione uma turma.')
      return
    }

    if (!academicPeriod.trim()) {
      setError('Informe o período letivo.')
      return
    }

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const component =
        selectedClass.subject?.trim() || 'Componente geral'

      const response = await fetch(
        '/api/agenda/avaliacoes',
        {
          method: 'POST',
          credentials: 'include',
          cache: 'no-store',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            operation: 'create_assessment',
            assessment: {
              title,
              purpose: 'diagnostic',
              instrumentType: 'written_test',
              offeringId: selectedClass.id,
              classId: selectedClass.id,
              componentId: component,
              academicPeriodId: academicPeriod.trim(),
              scaleType: 'numeric',
              calculationMethod: 'weighted_average',
              weight: 1,
              maximumScore: 10,
              passingScore: 7,
              scheduledAt: scheduledAt
                ? new Date(scheduledAt).toISOString()
                : null,
              learningOutcomeIds: [],
              criteria: [],
              metadata: {
                source: 'agenda_assessment_center',
                className: selectedClass.name,
                componentName: component,
                academicPeriodName: academicPeriod.trim(),
              },
            },
          }),
        },
      )

      const body = await response.json() as {
        success?: boolean
        error?: string
      }

      if (!response.ok || !body.success) {
        throw new Error(
          body.error || 'Não foi possível criar a avaliação.',
        )
      }

      setSuccess('Avaliação diagnóstica criada com sucesso.')
      setTitle('Avaliação Diagnóstica')
      setClassId('')
      setAcademicPeriod('')
      setScheduledAt('')
      setShowCreateForm(false)
      await load()
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Não foi possível criar a avaliação.',
      )
    } finally {
      setSaving(false)
    }
  }

  const assessments = useMemo(
    () => data?.assessments ?? [],
    [data],
  )

  const filteredAssessments = useMemo(() => {
    const query = search
      .trim()
      .toLocaleLowerCase('pt-BR')

    if (!query) return assessments

    return assessments.filter(assessment => {
      const agendaClass = classes.find(
        item => item.id === assessment.class_id,
      )

      const searchable = [
        assessment.title,
        assessment.purpose,
        assessment.status,
        agendaClass?.name ?? '',
        assessment.component_id,
        assessment.academic_period_id,
      ]
        .join(' ')
        .toLocaleLowerCase('pt-BR')

      return searchable.includes(query)
    })
  }, [assessments, classes, search])

  function getClassName(
    assessment: AssessmentRow,
  ) {
    return (
      classes.find(
        agendaClass => agendaClass.id === assessment.class_id,
      )?.name ?? 'Turma não identificada'
    )
  }

  return (
    <section className="space-y-5 sm:space-y-6">
      <header className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-[#071827] text-white shadow-sm sm:rounded-[1.75rem]">
        <div className="px-4 py-6 sm:px-7 sm:py-7">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-300 sm:text-xs">
            Agenda Inteligente EDI · Avaliação da Aprendizagem
          </p>

          <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Centro de Avaliações
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
                Consulte avaliações, acompanhe resultados e crie novos instrumentos somente quando necessário.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowCreateForm(current => !current)
                setError(null)
                setSuccess(null)
              }}
              className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-xl bg-[#0B7491] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#09657E]"
            >
              {showCreateForm ? 'Fechar criação' : 'Nova avaliação'}
            </button>
          </div>
        </div>
      </header>

      {showCreateForm ? (
        <form
          onSubmit={handleSubmit}
          className="rounded-[1.5rem] border border-cyan-200 bg-white p-4 shadow-sm ring-4 ring-cyan-50 sm:p-6"
        >
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0B7491]">
            Operação · Nova avaliação
          </p>

          <h2 className="mt-2 text-xl font-bold text-[#071827]">
            Criar avaliação diagnóstica
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            O contexto técnico é preenchido automaticamente a partir da turma selecionada.
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-semibold text-slate-700 md:col-span-2">
              Título
              <input
                value={title}
                onChange={event => setTitle(event.target.value)}
                required
                className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-cyan-500"
              />
            </label>

            <label className="block text-sm font-semibold text-slate-700">
              Turma
              <select
                value={classId}
                onChange={event => setClassId(event.target.value)}
                required
                disabled={loadingClasses}
                className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-normal outline-none focus:border-cyan-500"
              >
                <option value="">Selecione uma turma</option>
                {classes
                  .filter(agendaClass => agendaClass.active)
                  .map(agendaClass => (
                    <option
                      key={agendaClass.id}
                      value={agendaClass.id}
                    >
                      {agendaClass.name}
                      {agendaClass.subject
                        ? ` · ${agendaClass.subject}`
                        : ''}
                    </option>
                  ))}
              </select>
            </label>

            <label className="block text-sm font-semibold text-slate-700">
              Período letivo
              <select
                value={academicPeriod}
                onChange={event => setAcademicPeriod(event.target.value)}
                required
                className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-normal outline-none focus:border-cyan-500"
              >
                <option value="">Selecione o bimestre</option>
                {academicPeriods.map(period => (
                  <option key={period} value={period}>
                    {period}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-semibold text-slate-700 md:col-span-2">
              Data programada
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={event => setScheduledAt(event.target.value)}
                className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-cyan-500"
              />
            </label>
          </div>

          {error ? (
            <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              {error}
            </p>
          ) : null}

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="min-h-12 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={saving}
              className="min-h-12 rounded-xl bg-[#071827] px-5 py-3 text-sm font-bold text-white disabled:opacity-60"
            >
              {saving ? 'Salvando...' : 'Criar avaliação'}
            </button>
          </div>
        </form>
      ) : null}

      {success ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          {success}
        </p>
      ) : null}

      {!showCreateForm && error ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          {error}
        </p>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {[
          ['Avaliações', data?.summary.total ?? 0],
          ['Diagnósticas', data?.summary.diagnostic ?? 0],
          ['Concluídas', data?.summary.completed ?? 0],
          ['Revisão pendente', data?.summary.pendingReview ?? 0],
        ].map(([label, value]) => (
          <article
            key={String(label)}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 sm:text-xs sm:tracking-[0.13em]">
              {label}
            </p>
            <p className="mt-2 text-2xl font-bold text-[#071827] sm:text-3xl">
              {value}
            </p>
          </article>
        ))}
      </div>

      <section className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">
        <header className="border-b border-slate-200 bg-slate-50 px-4 py-4 sm:px-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0B7491]">
                Consulta
              </p>
              <h2 className="mt-1 font-bold text-[#071827]">
                Avaliações cadastradas
              </h2>
            </div>

            <button
              type="button"
              onClick={() => void load()}
              className="min-h-11 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50"
            >
              Atualizar
            </button>
          </div>

          <label className="mt-4 block text-sm font-semibold text-slate-700">
            Pesquisar
            <input
              type="search"
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Título, turma, componente ou período"
              className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 font-normal outline-none focus:border-cyan-500"
            />
          </label>
        </header>

        {loading ? (
          <div className="p-5 text-sm text-slate-600 sm:p-6">
            Carregando avaliações...
          </div>
        ) : filteredAssessments.length === 0 ? (
          <div className="p-5 text-sm leading-6 text-slate-600 sm:p-6">
            {assessments.length === 0
              ? 'Ainda não há avaliações cadastradas.'
              : 'Nenhuma avaliação corresponde à pesquisa.'}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredAssessments.map(assessment => (
              <article
                key={assessment.id}
                className="px-4 py-4 sm:px-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="break-words font-bold text-[#071827]">
                      {assessment.title}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {getClassName(assessment)}
                      {' · '}
                      {assessment.component_id}
                    </p>
                  </div>

                  <span className="shrink-0 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700">
                    {assessment.status}
                  </span>
                </div>

                <dl className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
                  <div className="rounded-lg bg-slate-50 px-3 py-2">
                    <dt className="font-semibold text-slate-500">Período</dt>
                    <dd className="mt-0.5 font-bold text-slate-700">
                      {assessment.academic_period_id}
                    </dd>
                  </div>

                  <div className="rounded-lg bg-slate-50 px-3 py-2">
                    <dt className="font-semibold text-slate-500">Tipo</dt>
                    <dd className="mt-0.5 font-bold text-slate-700">
                      {assessment.purpose}
                    </dd>
                  </div>

                  <div className="col-span-2 rounded-lg bg-slate-50 px-3 py-2 sm:col-span-1">
                    <dt className="font-semibold text-slate-500">Data</dt>
                    <dd className="mt-0.5 font-bold text-slate-700">
                      {formatDate(
                        assessment.scheduled_at ?? assessment.created_at,
                      )}
                    </dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        )}
      </section>

      <aside className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4 text-sm leading-6 text-slate-700 sm:p-5">
        A classificação gerada pelo Centro de Avaliações é apoio pedagógico. O professor mantém revisão e decisão final sobre classificação, recuperação e recomposição.
      </aside>
    </section>
  )
}
