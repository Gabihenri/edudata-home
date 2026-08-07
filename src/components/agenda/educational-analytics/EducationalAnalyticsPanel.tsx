'use client'

import {
  useCallback,
  useEffect,
  useState,
} from 'react'

import type {
  AnalyticsAnomalyResult,
  AnalyticsCorrelationResult,
  AnalyticsPatternResult,
  EducationalAnalyticsResult,
} from '@/lib/agenda/educational-analytics/analytics.types'

type AnalyticsApiResponse = {
  success: boolean
  analytics: EducationalAnalyticsResult | null
  executedCapabilities: string[]
  warnings: string[]
  errors: string[]
  snapshot?: {
    summary?: {
      totalPlanning: number
      totalObjectives: number
      totalLessons: number
      totalEvidences: number
      totalRecords: number
    }
    generatedAt?: string
  }
  error?: string
}

function formatCoefficient(
  value: number | null,
): string {
  if (
    value === null ||
    !Number.isFinite(value)
  ) {
    return '—'
  }

  return value.toFixed(2)
}

function formatPercentage(
  value: number | null,
): string {
  if (
    value === null ||
    !Number.isFinite(value)
  ) {
    return '—'
  }

  const normalized =
    value <= 1
      ? value * 100
      : value

  return `${Math.round(normalized)}%`
}

function correlationLabel(
  item: AnalyticsCorrelationResult,
): string {
  return `${item.variableXId} × ${item.variableYId}`
}

function Metric({
  label,
  value,
  description,
}: {
  label: string
  value: string
  description: string
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-3xl font-bold text-[#071827]">
        {value}
      </p>

      <p className="mt-2 text-sm leading-6 text-slate-500">
        {description}
      </p>
    </article>
  )
}

function CorrelationCard({
  item,
}: {
  item: AnalyticsCorrelationResult
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#0B7491]">
            {item.method}
          </p>

          <h4 className="mt-1 font-semibold text-[#071827]">
            {correlationLabel(item)}
          </h4>
        </div>

        <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-sm font-bold text-[#075F78]">
          r = {formatCoefficient(item.coefficient)}
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div>
          <p className="text-xs text-slate-500">Força</p>
          <p className="mt-1 text-sm font-semibold text-slate-800">
            {item.strength}
          </p>
        </div>

        <div>
          <p className="text-xs text-slate-500">Amostra</p>
          <p className="mt-1 text-sm font-semibold text-slate-800">
            {item.sampleSize}
          </p>
        </div>

        <div>
          <p className="text-xs text-slate-500">Confiança</p>
          <p className="mt-1 text-sm font-semibold text-slate-800">
            {formatPercentage(item.confidence.value)}
          </p>
        </div>
      </div>

      <p className="mt-4 text-xs leading-5 text-slate-500">
        Associação estatística. Não representa causalidade.
      </p>
    </article>
  )
}

export default function EducationalAnalyticsPanel() {
  const [data, setData] =
    useState<AnalyticsApiResponse | null>(null)
  const [loading, setLoading] =
    useState(true)
  const [error, setError] =
    useState<string | null>(null)

  const load =
    useCallback(
      async (): Promise<void> => {
        setLoading(true)
        setError(null)

        try {
          const response =
            await fetch(
              '/api/agenda/educational-analytics/operational',
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
            await response.json() as
              AnalyticsApiResponse

          if (!response.ok) {
            throw new Error(
              body.error ||
              body.errors?.[0] ||
              'Não foi possível executar a análise educacional.',
            )
          }

          setData(body)
        } catch (loadError) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Não foi possível executar a análise educacional.',
          )
        } finally {
          setLoading(false)
        }
      },
      [],
    )

  useEffect(
    () => {
      void load()
    },
    [load],
  )

  if (loading) {
    return (
      <section className="rounded-[1.75rem] border border-cyan-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B7491]">
          EIOS · Educational Analytics
        </p>
        <h2 className="mt-2 text-2xl font-bold text-[#071827]">
          Processando inteligência educacional
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Correlacionando registros, procurando padrões e verificando anomalias com explicabilidade e revisão humana.
        </p>
      </section>
    )
  }

  if (error || !data?.analytics) {
    return (
      <section className="rounded-[1.75rem] border border-amber-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">
          EIOS · Educational Analytics
        </p>
        <h2 className="mt-2 text-2xl font-bold text-[#071827]">
          Análise indisponível
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {error ?? 'Ainda não há dados suficientes para uma análise válida.'}
        </p>
        <button
          type="button"
          onClick={() => void load()}
          className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Tentar novamente
        </button>
      </section>
    )
  }

  const analytics = data.analytics
  const correlations =
    [...analytics.correlations]
      .sort(
        (first, second) =>
          Math.abs(second.coefficient ?? 0) -
          Math.abs(first.coefficient ?? 0),
      )
      .slice(0, 6)
  const patterns:
    AnalyticsPatternResult[] =
    analytics.patterns.slice(0, 6)
  const anomalies:
    AnalyticsAnomalyResult[] =
    analytics.anomalies.slice(0, 6)

  return (
    <section className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
      <header className="border-b border-slate-200 bg-[#071827] px-5 py-6 text-white sm:px-7">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
          EIOS · Educational Analytics
        </p>
        <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold">
              Inteligência sobre os registros da Agenda
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
              Correlações, padrões e anomalias calculados sobre dados operacionais autorizados. Toda leitura é explicável e permanece sujeita à decisão profissional.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
          >
            Reprocessar análise
          </button>
        </div>
      </header>

      <div className="space-y-7 p-5 sm:p-7">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric
            label="Observações"
            value={String(analytics.observations.length)}
            description="Registros convertidos para o contrato analítico."
          />
          <Metric
            label="Correlações"
            value={String(analytics.correlations.length)}
            description="Associações estatísticas avaliadas pelos motores EIOS."
          />
          <Metric
            label="Padrões"
            value={String(analytics.patterns.length)}
            description="Tendências, recorrências e estruturas detectadas."
          />
          <Metric
            label="Anomalias"
            value={String(analytics.anomalies.length)}
            description="Eventos fora do comportamento esperado para revisão."
          />
        </div>

        {correlations.length > 0 ? (
          <div>
            <div className="mb-4">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0B7491]">
                Correlação
              </p>
              <h3 className="mt-1 text-xl font-bold text-[#071827]">
                Relações com maior magnitude
              </h3>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {correlations.map(item => (
                <CorrelationCard
                  key={item.id}
                  item={item}
                />
              ))}
            </div>
          </div>
        ) : null}

        {patterns.length > 0 ? (
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0B7491]">
              Padrões
            </p>
            <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {patterns.map(item => (
                <article
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                    {item.type}
                  </p>
                  <h4 className="mt-2 font-semibold text-[#071827]">
                    {item.title}
                  </h4>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {item.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        ) : null}

        {anomalies.length > 0 ? (
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-700">
              Pontos para revisão
            </p>
            <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {anomalies.map(item => (
                <article
                  key={item.id}
                  className="rounded-2xl border border-amber-200 bg-amber-50 p-4"
                >
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-amber-700">
                    {item.type} · {item.severity}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-amber-950">
                    Variável: {item.variableId ?? 'não identificada'}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-amber-800">
                    Requer interpretação humana antes de qualquer intervenção.
                  </p>
                </article>
              ))}
            </div>
          </div>
        ) : null}

        {analytics.warnings.length > 0 ? (
          <details className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <summary className="cursor-pointer text-sm font-semibold text-slate-700">
              Limitações e avisos ({analytics.warnings.length})
            </summary>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
              {analytics.warnings.map((warning, index) => (
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
