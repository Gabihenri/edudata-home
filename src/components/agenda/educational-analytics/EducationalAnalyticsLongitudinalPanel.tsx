'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

type Metric =
  | 'correlations'
  | 'patterns'
  | 'anomalies'
  | 'influences'
  | 'predictions'
  | 'recommendations'
  | 'researchResults'

type Direction =
  | 'increasing'
  | 'decreasing'
  | 'stable'
  | 'mixed'
  | 'insufficient_data'

type Stability =
  | 'high'
  | 'moderate'
  | 'low'
  | 'insufficient_data'

type Volatility =
  | 'low'
  | 'moderate'
  | 'high'
  | 'insufficient_data'

type MetricSignal = {
  metric: Metric
  observations: number
  firstValue: number | null
  latestValue: number | null
  absoluteDelta: number | null
  relativeDelta: number | null
  mean: number | null
  standardDeviation: number | null
  coefficientOfVariation: number | null
  direction: Direction
  directionPersistence: number | null
  stability: Stability
  volatility: Volatility
  changeSignificance:
    | 'none'
    | 'small'
    | 'moderate'
    | 'large'
    | 'insufficient_data'
  changePoints: Array<{
    fromRunId: string
    toRunId: string
    fromVersionNumber: number
    toVersionNumber: number
    delta: number
    relativeDelta: number | null
  }>
  explanation: string
}

type Intelligence = {
  analysisKey: string | null
  versionCount: number
  firstGeneratedAt: string | null
  latestGeneratedAt: string | null
  metricSignals: MetricSignal[]
  qualitySignal: {
    observations: number
    firstScore: number | null
    latestScore: number | null
    absoluteDelta: number | null
    direction: Direction
    stability: Stability
    volatility: Volatility
    explanation: string
  }
  persistentSignals: MetricSignal[]
  significantChanges: MetricSignal[]
  overallStability: Stability
  overallVolatility: Volatility
  dataSufficiency:
    | 'insufficient'
    | 'limited'
    | 'adequate'
    | 'strong'
  warnings: string[]
  generatedAt: string
}

type LongitudinalResponse = {
  success: boolean
  intelligence: Intelligence
  error?: string
}

const LABELS: Record<Metric, string> = {
  correlations: 'Correlações',
  patterns: 'Padrões',
  anomalies: 'Anomalias',
  influences: 'Influências',
  predictions: 'Predições',
  recommendations: 'Recomendações',
  researchResults: 'Pesquisa',
}

function formatPercent(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return '—'
  return `${Math.round(value * 100)}%`
}

function formatQuality(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return '—'
  const normalized = value <= 1 ? value * 100 : value
  return `${Math.round(normalized)}%`
}

function directionLabel(value: Direction): string {
  const labels: Record<Direction, string> = {
    increasing: 'crescimento persistente',
    decreasing: 'redução persistente',
    stable: 'estável',
    mixed: 'oscilante',
    insufficient_data: 'dados insuficientes',
  }
  return labels[value]
}

function levelLabel(
  value: Stability | Volatility,
): string {
  const labels = {
    high: 'alta',
    moderate: 'moderada',
    low: 'baixa',
    insufficient_data: 'indeterminada',
  }
  return labels[value]
}

function SummaryCard({
  label,
  value,
  description,
}: {
  label: string
  value: string
  description: string
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold text-[#071827]">
        {value}
      </p>
      <p className="mt-2 text-xs leading-5 text-slate-500">
        {description}
      </p>
    </article>
  )
}

function SignalCard({
  signal,
}: {
  signal: MetricSignal
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#0B7491]">
            Sinal longitudinal
          </p>
          <h3 className="mt-1 font-bold text-[#071827]">
            {LABELS[signal.metric]}
          </h3>
        </div>
        <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-800">
          {directionLabel(signal.direction)}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <p className="text-xs text-slate-500">Persistência</p>
          <p className="mt-1 text-sm font-semibold text-slate-800">
            {formatPercent(signal.directionPersistence)}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Estabilidade</p>
          <p className="mt-1 text-sm font-semibold text-slate-800">
            {levelLabel(signal.stability)}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Volatilidade</p>
          <p className="mt-1 text-sm font-semibold text-slate-800">
            {levelLabel(signal.volatility)}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Mudanças fortes</p>
          <p className="mt-1 text-sm font-semibold text-slate-800">
            {signal.changePoints.length}
          </p>
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-600">
        {signal.explanation}
      </p>
    </article>
  )
}

export default function EducationalAnalyticsLongitudinalPanel() {
  const [data, setData] =
    useState<LongitudinalResponse | null>(null)
  const [loading, setLoading] =
    useState(true)
  const [error, setError] =
    useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(
        '/api/agenda/educational-analytics/longitudinal?limit=50',
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
        await response.json() as LongitudinalResponse

      if (!response.ok) {
        throw new Error(
          body.error ||
          'Não foi possível carregar a inteligência longitudinal.',
        )
      }

      setData(body)
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Não foi possível carregar a inteligência longitudinal.',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const intelligence = data?.intelligence ?? null

  const prioritySignals = useMemo(
    () => {
      if (!intelligence) return []
      const byMetric = new Map<Metric, MetricSignal>()
      ;[
        ...intelligence.persistentSignals,
        ...intelligence.significantChanges,
      ].forEach(signal => byMetric.set(signal.metric, signal))
      return Array.from(byMetric.values()).slice(0, 6)
    },
    [intelligence],
  )

  if (loading) {
    return (
      <section className="rounded-[1.75rem] border border-cyan-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B7491]">
          EIOS · Inteligência longitudinal
        </p>
        <h2 className="mt-2 text-xl font-bold text-[#071827]">
          Interpretando persistência e estabilidade
        </h2>
      </section>
    )
  }

  if (error || !intelligence) {
    return (
      <section className="rounded-[1.75rem] border border-amber-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">
          EIOS · Inteligência longitudinal
        </p>
        <h2 className="mt-2 text-xl font-bold text-[#071827]">
          Inteligência longitudinal indisponível
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          {error ?? 'Ainda não há dados suficientes.'}
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
      <header className="border-b border-slate-200 bg-[#071827] px-5 py-6 text-white sm:px-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
              EIOS · Sprint 04.16
            </p>
            <h2 className="mt-2 text-2xl font-bold">
              Inteligência Longitudinal
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
              O EIOS consolida versões históricas para identificar persistência, estabilidade, volatilidade e mudanças relevantes. Esses sinais são descritivos, não causais, e exigem interpretação profissional.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
          >
            Recalcular sinais
          </button>
        </div>
      </header>

      <div className="space-y-7 p-5 sm:p-7">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="Série histórica"
            value={String(intelligence.versionCount)}
            description={`Suficiência: ${intelligence.dataSufficiency}.`}
          />
          <SummaryCard
            label="Estabilidade geral"
            value={levelLabel(intelligence.overallStability)}
            description="Consistência relativa dos sinais entre versões."
          />
          <SummaryCard
            label="Volatilidade geral"
            value={levelLabel(intelligence.overallVolatility)}
            description="Intensidade das oscilações históricas observadas."
          />
          <SummaryCard
            label="Qualidade atual"
            value={formatQuality(intelligence.qualitySignal.latestScore)}
            description={`Evolução da qualidade: ${directionLabel(intelligence.qualitySignal.direction)}.`}
          />
        </div>

        {prioritySignals.length > 0 ? (
          <div>
            <div className="mb-4">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0B7491]">
                Sinais prioritários
              </p>
              <h3 className="mt-1 text-xl font-bold text-[#071827]">
                Persistências e mudanças relevantes
              </h3>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {prioritySignals.map(signal => (
                <SignalCard
                  key={signal.metric}
                  signal={signal}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm leading-6 text-slate-600">
            Ainda não há persistências ou mudanças suficientemente robustas para destacar. O EIOS continuará acumulando versões para fortalecer a leitura longitudinal.
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
              Qualidade da série
            </p>
            <h3 className="mt-2 font-bold text-[#071827]">
              Consistência dos dados ao longo do tempo
            </h3>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-slate-500">Primeiro escore</p>
                <p className="mt-1 font-semibold text-slate-800">
                  {formatQuality(intelligence.qualitySignal.firstScore)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Último escore</p>
                <p className="mt-1 font-semibold text-slate-800">
                  {formatQuality(intelligence.qualitySignal.latestScore)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Estabilidade</p>
                <p className="mt-1 font-semibold text-slate-800">
                  {levelLabel(intelligence.qualitySignal.stability)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Volatilidade</p>
                <p className="mt-1 font-semibold text-slate-800">
                  {levelLabel(intelligence.qualitySignal.volatility)}
                </p>
              </div>
            </div>
            <p className="mt-4 text-xs leading-5 text-slate-500">
              {intelligence.qualitySignal.explanation}
            </p>
          </article>

          <article className="rounded-2xl border border-cyan-200 bg-cyan-50 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-cyan-800">
              Governança EIOS
            </p>
            <h3 className="mt-2 font-bold text-[#071827]">
              Interpretação humana obrigatória
            </h3>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              Persistência, volatilidade e mudança histórica são sinais analíticos. Não comprovam causalidade, não classificam pessoas e não autorizam intervenção automática. O profissional decide como contextualizar cada leitura.
            </p>
          </article>
        </div>

        {intelligence.warnings.length > 0 ? (
          <details className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <summary className="cursor-pointer text-sm font-semibold text-amber-800">
              Limitações longitudinais ({intelligence.warnings.length})
            </summary>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-amber-800">
              {intelligence.warnings.map((warning, index) => (
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
