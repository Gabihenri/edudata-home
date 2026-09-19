'use client'

import {
  useCallback,
  useEffect,
  useState,
} from 'react'

type OperationalSummary = {
  conflicts: number
  pending: number
  evidencePending: number
  workloadHours: number
  coveragePercent: number
  ruleAlerts: number
  criticalRules: number
}

type RuleEvaluation = {
  rule_code: string
  severity: 'critical' | 'high' | 'medium'
  resource_id: string
  title: string
  rule_name: string
  explanation: string
  reference_at: string | null
  context: Record<string, unknown>
}


type OperationalResponse = {
  success: boolean
  generatedAt: string
  summary: OperationalSummary
  conflicts: Array<{
    event_id: string
    conflicting_event_id: string
    conflict_type: string
    event_title: string
    conflicting_event_title: string
    event_start_at: string
    conflicting_start_at: string
    explanation: string
  }>
  pending: Array<{
    pending_type: string
    resource_id: string
    title: string
    due_at: string | null
    pending_reason: string
  }>
  workload: Array<{
    week_reference: string
    estimated_hours: number
    event_count: number
    substitution_event_count: number
  }>
  coverage: Array<{
    week_reference: string
    planned_events: number
    completed_events: number
    evidenced_events: number
    evidence_coverage_percent: number
  }>
  rules: RuleEvaluation[]
}

function formatDate(value: string | null): string {
  if (!value) return 'Sem prazo'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Data indisponível'

  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  })
}

function metricLabel(value: number): string {
  return value.toLocaleString('pt-BR', {
    maximumFractionDigits: 1,
  })
}

export function AgendaOperationalIntelligencePanel() {
  const [data, setData] =
    useState<OperationalResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] =
    useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(
        '/api/agenda/operational',
        {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        },
      )

      const result =
        (await response.json()) as
          | OperationalResponse
          | { error?: string }

      if (
        !response.ok ||
        !('success' in result) ||
        !result.success
      ) {
        throw new Error(
          'error' in result && result.error
            ? result.error
            : 'Não foi possível carregar a inteligência operacional.',
        )
      }

      setData(result)
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Não foi possível carregar a inteligência operacional.',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <section
      aria-labelledby="agenda-operational-intelligence-title"
      className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#0B7491]">
            EIOS · Camada operacional
          </p>

          <h2
            id="agenda-operational-intelligence-title"
            className="mt-2 text-2xl font-bold text-[#081C2E]"
          >
            Inteligência operacional da Agenda
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Conflitos, pendências, carga e cobertura são apresentados
            como sinais de apoio à decisão. Nenhuma alteração é executada
            automaticamente.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Atualizando...' : 'Atualizar'}
        </button>
      </div>

      {error && (
        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {error}
        </div>
      )}

      {loading && !data && (
        <p className="mt-6 text-sm text-slate-500">
          Calculando sinais operacionais...
        </p>
      )}

      {data && (
        <>
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-[#081C2E]">
                  Central de Alertas EDI
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  {data.summary.ruleAlerts} sinal(is) operacional(is) · {data.summary.criticalRules} crítico(s)
                </p>
              </div>
              <span className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                Apoio à decisão
              </span>
            </div>

            {data.rules.length > 0 ? (
              <ul className="mt-4 space-y-3">
                {data.rules.slice(0, 6).map(rule => (
                  <li
                    key={rule.rule_code + '-' + rule.resource_id}
                    className="rounded-2xl border border-slate-200 bg-white p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {rule.rule_name}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          {rule.title}
                        </p>
                      </div>
                      <span className="rounded-full border border-slate-200 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-600">
                        {rule.severity}
                      </span>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      {rule.explanation}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
                Nenhum alerta operacional encontrado no contexto visível.
              </p>
            )}
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Metric
              label="Conflitos"
              value={metricLabel(data.summary.conflicts)}
              tone="critical"
            />
            <Metric
              label="Pendências"
              value={metricLabel(data.summary.pending)}
              tone="warning"
            />
            <Metric
              label="Evidências pendentes"
              value={metricLabel(data.summary.evidencePending)}
              tone="attention"
            />
            <Metric
              label="Horas na semana"
              value={metricLabel(data.summary.workloadHours)}
              tone="neutral"
            />
            <Metric
              label="Cobertura de evidências"
              value={metricLabel(data.summary.coveragePercent) + '%'}
              tone="positive"
            />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <OperationalList
              title="Conflitos detectados"
              empty="Nenhum conflito temporal visível."
            >
              {data.conflicts.slice(0, 5).map(conflict => (
                <li
                  key={
                    conflict.event_id +
                    '-' +
                    conflict.conflicting_event_id
                  }
                  className="rounded-2xl border border-slate-200 p-4"
                >
                  <p className="font-semibold text-slate-900">
                    {conflict.event_title}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Sobreposição com{' '}
                    <strong>
                      {conflict.conflicting_event_title}
                    </strong>
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    {formatDate(conflict.event_start_at)} ·{' '}
                    {conflict.explanation}
                  </p>
                </li>
              ))}
            </OperationalList>

            <OperationalList
              title="Próximas pendências"
              empty="Nenhuma pendência encontrada."
            >
              {data.pending.slice(0, 5).map(item => (
                <li
                  key={
                    item.pending_type +
                    '-' +
                    item.resource_id
                  }
                  className="rounded-2xl border border-slate-200 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-semibold text-slate-900">
                      {item.title}
                    </p>
                    <span className="text-xs font-semibold text-slate-500">
                      {formatDate(item.due_at)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">
                    {item.pending_reason}
                  </p>
                </li>
              ))}
            </OperationalList>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            <strong className="text-slate-900">
              Regra EDI:
            </strong>{' '}
            a inteligência identifica situações e apresenta contexto;
            a ação operacional permanece sob decisão do usuário autorizado.
          </div>
        </>
      )}
    </section>
  )
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: 'critical' | 'warning' | 'attention' | 'positive' | 'neutral'
}) {
  const classes = {
    critical:
      'border-rose-200 bg-rose-50 text-rose-900',
    warning:
      'border-amber-200 bg-amber-50 text-amber-900',
    attention:
      'border-blue-200 bg-blue-50 text-blue-900',
    positive:
      'border-emerald-200 bg-emerald-50 text-emerald-900',
    neutral:
      'border-slate-200 bg-slate-50 text-slate-900',
  }[tone]

  return (
    <div className={'rounded-2xl border p-4 ' + classes}>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-70">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold">
        {value}
      </p>
    </div>
  )
}

function OperationalList({
  title,
  empty,
  children,
}: {
  title: string
  empty: string
  children: React.ReactNode
}) {
  const hasChildren =
    Array.isArray(children)
      ? children.length > 0
      : Boolean(children)

  return (
    <div>
      <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-700">
        {title}
      </h3>

      {hasChildren ? (
        <ul className="mt-3 space-y-3">
          {children}
        </ul>
      ) : (
        <p className="mt-3 rounded-2xl border border-slate-200 p-4 text-sm text-slate-500">
          {empty}
        </p>
      )}
    </div>
  )
}
