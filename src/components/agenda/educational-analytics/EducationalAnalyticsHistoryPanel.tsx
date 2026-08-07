'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

type AnalyticsHistoryItem = {
  id: string
  analysisId: string
  analysisKey: string
  versionId: string
  versionNumber: number
  versionLabel: string
  versionStatus: string
  isCurrentVersion: boolean
  status: string
  scope: string
  title: string
  description: string | null
  correlationCount: number
  patternCount: number
  anomalyCount: number
  influenceCount: number
  predictionCount: number
  recommendationCount: number
  researchResultCount: number
  requiresHumanReview: boolean
  humanReviewStatus: string
  approved: boolean
  generatedAt: string
  completedAt: string | null
  reviewedAt: string | null
  createdAt: string
  archivedAt: string | null
  warningsCount: number
  errorsCount: number
  reportAvailable: boolean
}

type AnalyticsHistoryResponse = {
  success: boolean
  items: AnalyticsHistoryItem[]
  summary: {
    total: number
    current: number
    pendingReview: number
    approved: number
  }
  meta: {
    generatedAt: string
  }
  error?: string
}

function formatDateTime(
  value: string | null,
): string {
  if (!value) {
    return '—'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '—'
  }

  return new Intl.DateTimeFormat(
    'pt-BR',
    {
      dateStyle: 'short',
      timeStyle: 'short',
    },
  ).format(date)
}

function StatusBadge({
  item,
}: {
  item: AnalyticsHistoryItem
}) {
  if (item.approved) {
    return (
      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
        Revisado e aprovado
      </span>
    )
  }

  if (
    item.requiresHumanReview &&
    item.humanReviewStatus === 'pending'
  ) {
    return (
      <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
        Revisão pendente
      </span>
    )
  }

  return (
    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600">
      {item.status}
    </span>
  )
}

function SummaryMetric({
  label,
  value,
}: {
  label: string
  value: number
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold text-[#071827]">
        {value}
      </p>
    </div>
  )
}

export default function EducationalAnalyticsHistoryPanel() {
  const [data, setData] =
    useState<AnalyticsHistoryResponse | null>(null)
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
              '/api/agenda/educational-analytics/history?limit=30',
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
              AnalyticsHistoryResponse

          if (!response.ok) {
            throw new Error(
              body.error ||
              'Não foi possível carregar o histórico analítico.',
            )
          }

          setData(body)
        } catch (loadError) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Não foi possível carregar o histórico analítico.',
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

  const items =
    useMemo(
      () => data?.items ?? [],
      [data],
    )

  if (loading) {
    return (
      <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B7491]">
          EIOS · Histórico longitudinal
        </p>
        <h2 className="mt-2 text-xl font-bold text-[#071827]">
          Carregando versões analíticas
        </h2>
      </section>
    )
  }

  if (error) {
    return (
      <section className="rounded-[1.75rem] border border-amber-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">
          EIOS · Histórico longitudinal
        </p>
        <h2 className="mt-2 text-xl font-bold text-[#071827]">
          Histórico indisponível
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
      <header className="border-b border-slate-200 px-5 py-6 sm:px-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B7491]">
              EIOS · Histórico longitudinal
            </p>
            <h2 className="mt-2 text-2xl font-bold text-[#071827]">
              Linha do tempo analítica
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Acompanhe versões persistidas, revisões humanas e a evolução dos sinais produzidos pelo Educational Analytics.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Atualizar histórico
          </button>
        </div>
      </header>

      <div className="space-y-6 p-5 sm:p-7">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryMetric
            label="Execuções"
            value={data?.summary.total ?? 0}
          />
          <SummaryMetric
            label="Versões atuais"
            value={data?.summary.current ?? 0}
          />
          <SummaryMetric
            label="Revisões pendentes"
            value={data?.summary.pendingReview ?? 0}
          />
          <SummaryMetric
            label="Aprovadas"
            value={data?.summary.approved ?? 0}
          />
        </div>

        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
            Ainda não há execuções persistidas para exibir. Ao reprocessar a análise, novas versões passam a compor esta linha do tempo.
          </div>
        ) : (
          <div className="space-y-3">
            {items.map(item => (
              <article
                key={item.id}
                className="rounded-2xl border border-slate-200 bg-white p-5"
              >
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#0B7491]">
                        Versão {item.versionNumber}
                      </span>
                      {item.isCurrentVersion ? (
                        <span className="rounded-full bg-[#071827] px-2.5 py-1 text-[11px] font-bold text-white">
                          Atual
                        </span>
                      ) : null}
                      <StatusBadge item={item} />
                    </div>

                    <h3 className="mt-2 font-bold text-[#071827]">
                      {item.title}
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      Gerada em {formatDateTime(item.generatedAt)} · escopo {item.scope}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-x-5 gap-y-2 text-xs sm:grid-cols-4">
                    <div>
                      <p className="text-slate-500">Correlações</p>
                      <p className="mt-1 font-bold text-slate-800">{item.correlationCount}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Padrões</p>
                      <p className="mt-1 font-bold text-slate-800">{item.patternCount}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Anomalias</p>
                      <p className="mt-1 font-bold text-slate-800">{item.anomalyCount}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Recomendações</p>
                      <p className="mt-1 font-bold text-slate-800">{item.recommendationCount}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
                  {item.reportAvailable ? (
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
                      Relatório disponível
                    </span>
                  ) : null}
                  {item.warningsCount > 0 ? (
                    <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-700">
                      {item.warningsCount} aviso(s)
                    </span>
                  ) : null}
                  {item.errorsCount > 0 ? (
                    <span className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-rose-700">
                      {item.errorsCount} erro(s)
                    </span>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
