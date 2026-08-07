'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

type EvolutionMetric =
  | 'correlations'
  | 'patterns'
  | 'anomalies'
  | 'influences'
  | 'predictions'
  | 'recommendations'
  | 'researchResults'

type EvolutionPoint = {
  runId: string
  analysisKey: string
  versionNumber: number
  versionLabel: string
  generatedAt: string
  status: string
  approved: boolean
  humanReviewStatus: string
  counts: Record<EvolutionMetric, number>
  dataQualityScore: number | null
}

type EvolutionTrend = {
  metric: EvolutionMetric
  first: number
  latest: number
  delta: number
  direction: 'up' | 'down' | 'stable'
}

type EvolutionResponse = {
  success: boolean
  points: EvolutionPoint[]
  trends: EvolutionTrend[]
  summary: {
    totalVersions: number
    approvedVersions: number
    pendingReviewVersions: number
    firstGeneratedAt: string | null
    latestGeneratedAt: string | null
  }
  warnings: string[]
  generatedAt: string
  error?: string
}

const METRIC_LABELS: Record<EvolutionMetric, string> = {
  correlations: 'Correlações',
  patterns: 'Padrões',
  anomalies: 'Anomalias',
  influences: 'Influências',
  predictions: 'Predições',
  recommendations: 'Recomendações',
  researchResults: 'Pesquisa',
}

function formatDate(value: string | null): string {
  if (!value) {
    return '—'
  }

  const date = new Date(value)

  return Number.isNaN(date.getTime())
    ? '—'
    : new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'short',
      }).format(date)
}

function formatQuality(value: number | null): string {
  if (value === null || !Number.isFinite(value)) {
    return '—'
  }

  const normalized = value <= 1 ? value * 100 : value

  return `${Math.round(normalized)}%`
}

function TrendBadge({
  trend,
}: {
  trend: EvolutionTrend
}) {
  const label =
    trend.direction === 'stable'
      ? 'estável'
      : trend.delta > 0
        ? `+${trend.delta}`
        : String(trend.delta)

  const classes =
    trend.direction === 'stable'
      ? 'border-slate-200 bg-slate-50 text-slate-600'
      : trend.direction === 'up'
        ? 'border-cyan-200 bg-cyan-50 text-cyan-800'
        : 'border-amber-200 bg-amber-50 text-amber-800'

  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-xs font-bold ${classes}`}
    >
      {label}
    </span>
  )
}

function EvolutionBars({
  points,
  metric,
}: {
  points: EvolutionPoint[]
  metric: EvolutionMetric
}) {
  const values = points.map(
    point => point.counts[metric],
  )
  const maximum = Math.max(1, ...values)

  return (
    <div className="mt-4 flex h-28 items-end gap-1.5">
      {points.map(point => {
        const value = point.counts[metric]
        const height = Math.max(
          value > 0 ? 12 : 4,
          Math.round((value / maximum) * 100),
        )

        return (
          <div
            key={`${metric}-${point.runId}`}
            className="group relative flex min-w-0 flex-1 items-end"
            title={`v${point.versionNumber}: ${value}`}
          >
            <div
              className="w-full rounded-t-md bg-[#0B7491]/80 transition group-hover:bg-[#075F78]"
              style={{ height: `${height}%` }}
            />
          </div>
        )
      })}
    </div>
  )
}

export default function EducationalAnalyticsEvolutionPanel() {
  const [data, setData] =
    useState<EvolutionResponse | null>(null)
  const [loading, setLoading] =
    useState(true)
  const [error, setError] =
    useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(
        '/api/agenda/educational-analytics/evolution?limit=30',
        {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
          headers: {
            Accept: 'application/json',
          },
        },
      )

      const body =
        await response.json() as EvolutionResponse

      if (!response.ok) {
        throw new Error(
          body.error ||
          'Não foi possível carregar a evolução analítica.',
        )
      }

      setData(body)
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Não foi possível carregar a evolução analítica.',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const points = useMemo(
    () => data?.points ?? [],
    [data],
  )

  const visibleTrends = useMemo(
    () =>
      (data?.trends ?? []).filter(
        trend =>
          trend.metric === 'correlations' ||
          trend.metric === 'patterns' ||
          trend.metric === 'anomalies' ||
          trend.metric === 'recommendations',
      ),
    [data],
  )

  if (loading) {
    return (
      <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B7491]">
          EIOS · Evolução longitudinal
        </p>
        <h2 className="mt-2 text-xl font-bold text-[#071827]">
          Consolidando séries históricas
        </h2>
      </section>
    )
  }

  if (error) {
    return (
      <section className="rounded-[1.75rem] border border-amber-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">
          EIOS · Evolução longitudinal
        </p>
        <h2 className="mt-2 text-xl font-bold text-[#071827]">
          Evolução indisponível
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          {error}
        </p>
        <button
          type="button"
          onClick={() => void load()}
          className="mt-4 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
        >
          Tentar novamente
        </button>
      </section>
    )
  }

  return (
    <section className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
      <header className="border-b border-slate-200 bg-slate-50 px-5 py-6 sm:px-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B7491]">
              EIOS · Dashboard Evolutivo
            </p>
            <h2 className="mt-2 text-2xl font-bold text-[#071827]">
              Evolução dos sinais analíticos
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Leitura longitudinal das versões persistidas. Mudanças representam variação dos sinais registrados, não evidência causal.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Atualizar evolução
          </button>
        </div>
      </header>

      <div className="space-y-7 p-5 sm:p-7">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
              Versões
            </p>
            <p className="mt-2 text-2xl font-bold text-[#071827]">
              {data?.summary.totalVersions ?? 0}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
              Aprovadas
            </p>
            <p className="mt-2 text-2xl font-bold text-[#071827]">
              {data?.summary.approvedVersions ?? 0}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
              Revisões pendentes
            </p>
            <p className="mt-2 text-2xl font-bold text-[#071827]">
              {data?.summary.pendingReviewVersions ?? 0}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
              Janela histórica
            </p>
            <p className="mt-2 text-sm font-bold text-[#071827]">
              {formatDate(data?.summary.firstGeneratedAt ?? null)} → {formatDate(data?.summary.latestGeneratedAt ?? null)}
            </p>
          </div>
        </div>

        {points.length < 2 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm leading-6 text-slate-600">
            Ainda não há versões suficientes para uma leitura evolutiva. Reprocessamentos futuros serão incorporados automaticamente ao histórico.
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {visibleTrends.map(trend => (
              <article
                key={trend.metric}
                className="rounded-2xl border border-slate-200 bg-white p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#0B7491]">
                      Série longitudinal
                    </p>
                    <h3 className="mt-1 font-bold text-[#071827]">
                      {METRIC_LABELS[trend.metric]}
                    </h3>
                  </div>
                  <TrendBadge trend={trend} />
                </div>

                <EvolutionBars
                  points={points}
                  metric={trend.metric}
                />

                <div className="mt-3 flex justify-between text-xs text-slate-500">
                  <span>v{points[0]?.versionNumber}</span>
                  <span>
                    {trend.first} → {trend.latest}
                  </span>
                  <span>v{points.at(-1)?.versionNumber}</span>
                </div>
              </article>
            ))}
          </div>
        )}

        {points.length > 0 ? (
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.12em] text-slate-500">
                <tr>
                  <th className="px-4 py-3">Versão</th>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Qualidade</th>
                  <th className="px-4 py-3">Correlações</th>
                  <th className="px-4 py-3">Padrões</th>
                  <th className="px-4 py-3">Anomalias</th>
                  <th className="px-4 py-3">Revisão</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {points.slice().reverse().map(point => (
                  <tr key={point.runId}>
                    <td className="px-4 py-3 font-semibold text-[#071827]">
                      v{point.versionNumber}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatDate(point.generatedAt)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatQuality(point.dataQualityScore)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {point.counts.correlations}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {point.counts.patterns}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {point.counts.anomalies}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {point.approved
                        ? 'Aprovada'
                        : point.humanReviewStatus}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {(data?.warnings.length ?? 0) > 0 ? (
          <details className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <summary className="cursor-pointer text-sm font-semibold text-amber-800">
              Avisos longitudinais ({data?.warnings.length})
            </summary>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-amber-800">
              {data?.warnings.map((warning, index) => (
                <li key={`${warning}-${index}`}>
                  {warning}
                </li>
              ))}
            </ul>
          </details>
        ) : null}
      </div>
    </section>
  )
}
