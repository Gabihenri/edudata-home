'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

type HistoryItem = {
  id: string
  versionNumber: number
  versionLabel: string
  title: string
  generatedAt: string
  isCurrentVersion: boolean
  approved: boolean
  humanReviewStatus: string
}

type HistoryResponse = {
  success: boolean
  items: HistoryItem[]
  error?: string
}

type CountDelta = {
  base: number
  target: number
  delta: number
}

type CollectionDiff = {
  addedIds: string[]
  removedIds: string[]
  maintainedIds: string[]
}

type HistoricalComparison = {
  sameAnalysisKey: boolean
  direction: 'forward' | 'backward' | 'same_version'
  counts: {
    correlations: CountDelta
    patterns: CountDelta
    anomalies: CountDelta
    influences: CountDelta
    predictions: CountDelta
    recommendations: CountDelta
    researchResults: CountDelta
  }
  collections: {
    correlations: CollectionDiff
    patterns: CollectionDiff
    anomalies: CollectionDiff
    influences: CollectionDiff
    predictions: CollectionDiff
    recommendations: CollectionDiff
    researchResults: CollectionDiff
  }
  review: {
    baseStatus: string
    targetStatus: string
    baseApproved: boolean
    targetApproved: boolean
  }
  warnings: string[]
}

type ComparisonResponse = {
  success: boolean
  comparison?: HistoricalComparison
  error?: string
}

type HistoricalDetail = {
  row: {
    id: string
    version_number: number
    version_label: string
    title: string
    description: string | null
    status: string
    scope: string
    generated_at: string
    completed_at: string | null
    approved: boolean
    human_review_status: string
    correlation_count: number
    pattern_count: number
    anomaly_count: number
    influence_count: number
    prediction_count: number
    recommendation_count: number
    research_result_count: number
    warnings: unknown[]
    errors: unknown[]
  }
  report: Record<string, unknown> | null
}

type DetailResponse = {
  success: boolean
  detail?: HistoricalDetail
  error?: string
}

const CATEGORY_LABELS = {
  correlations: 'Correlações',
  patterns: 'Padrões',
  anomalies: 'Anomalias',
  influences: 'Influências',
  predictions: 'Projeções',
  recommendations: 'Recomendações',
  researchResults: 'Pesquisa',
} as const

function formatDateTime(
  value: string,
): string {
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

function DeltaBadge({
  delta,
}: {
  delta: number
}) {
  const label =
    delta > 0
      ? `+${delta}`
      : String(delta)

  const className =
    delta > 0
      ? 'border-cyan-200 bg-cyan-50 text-cyan-800'
      : delta < 0
        ? 'border-amber-200 bg-amber-50 text-amber-800'
        : 'border-slate-200 bg-slate-50 text-slate-600'

  return (
    <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${className}`}>
      {label}
    </span>
  )
}

function DiffMetric({
  label,
  value,
}: {
  label: string
  value: CountDelta
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
          {label}
        </p>
        <DeltaBadge delta={value.delta} />
      </div>
      <div className="mt-3 flex items-end gap-2">
        <span className="text-sm text-slate-500">
          {value.base}
        </span>
        <span className="text-slate-300">→</span>
        <span className="text-2xl font-bold text-[#071827]">
          {value.target}
        </span>
      </div>
    </article>
  )
}

export default function EducationalAnalyticsComparisonPanel() {
  const [items, setItems] =
    useState<HistoryItem[]>([])
  const [baseRunId, setBaseRunId] =
    useState('')
  const [targetRunId, setTargetRunId] =
    useState('')
  const [comparison, setComparison] =
    useState<HistoricalComparison | null>(null)
  const [detail, setDetail] =
    useState<HistoricalDetail | null>(null)
  const [loading, setLoading] =
    useState(true)
  const [comparing, setComparing] =
    useState(false)
  const [loadingDetail, setLoadingDetail] =
    useState(false)
  const [error, setError] =
    useState<string | null>(null)

  const loadHistory =
    useCallback(
      async (): Promise<void> => {
        setLoading(true)
        setError(null)

        try {
          const response =
            await fetch(
              '/api/agenda/educational-analytics/history?limit=50',
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
              HistoryResponse

          if (!response.ok) {
            throw new Error(
              body.error ||
              'Não foi possível carregar as versões analíticas.',
            )
          }

          const loaded =
            body.items ?? []

          setItems(loaded)

          if (loaded.length >= 2) {
            setBaseRunId(
              loaded[1].id,
            )
            setTargetRunId(
              loaded[0].id,
            )
          } else if (loaded.length === 1) {
            setBaseRunId(
              loaded[0].id,
            )
            setTargetRunId(
              loaded[0].id,
            )
          }
        } catch (loadError) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Não foi possível carregar as versões analíticas.',
          )
        } finally {
          setLoading(false)
        }
      },
      [],
    )

  useEffect(
    () => {
      void loadHistory()
    },
    [loadHistory],
  )

  const canCompare =
    Boolean(baseRunId && targetRunId)

  const compare =
    useCallback(
      async (): Promise<void> => {
        if (!canCompare) {
          return
        }

        setComparing(true)
        setError(null)
        setDetail(null)

        try {
          const query =
            new URLSearchParams({
              baseRunId,
              targetRunId,
            })

          const response =
            await fetch(
              `/api/agenda/educational-analytics/history/compare?${query.toString()}`,
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
              ComparisonResponse

          if (!response.ok || !body.comparison) {
            throw new Error(
              body.error ||
              'Não foi possível comparar as versões.',
            )
          }

          setComparison(
            body.comparison,
          )
        } catch (compareError) {
          setError(
            compareError instanceof Error
              ? compareError.message
              : 'Não foi possível comparar as versões.',
          )
        } finally {
          setComparing(false)
        }
      },
      [
        baseRunId,
        canCompare,
        targetRunId,
      ],
    )

  const loadDetail =
    useCallback(
      async (): Promise<void> => {
        if (!targetRunId) {
          return
        }

        setLoadingDetail(true)
        setError(null)

        try {
          const response =
            await fetch(
              `/api/agenda/educational-analytics/history/${encodeURIComponent(targetRunId)}`,
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
              DetailResponse

          if (!response.ok || !body.detail) {
            throw new Error(
              body.error ||
              'Não foi possível abrir o detalhe da versão.',
            )
          }

          setDetail(body.detail)
        } catch (detailError) {
          setError(
            detailError instanceof Error
              ? detailError.message
              : 'Não foi possível abrir o detalhe da versão.',
          )
        } finally {
          setLoadingDetail(false)
        }
      },
      [targetRunId],
    )

  const selectedTarget =
    useMemo(
      () =>
        items.find(
          item => item.id === targetRunId,
        ) ?? null,
      [items, targetRunId],
    )

  if (loading) {
    return (
      <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B7491]">
          EIOS · Evolução analítica
        </p>
        <h2 className="mt-2 text-xl font-bold text-[#071827]">
          Preparando comparação de versões
        </h2>
      </section>
    )
  }

  return (
    <section className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
      <header className="border-b border-slate-200 bg-slate-50 px-5 py-6 sm:px-7">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B7491]">
          EIOS · Evolução analítica
        </p>
        <h2 className="mt-2 text-2xl font-bold text-[#071827]">
          Comparação entre versões
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Compare duas execuções persistidas para identificar mudanças nos sinais analíticos. Diferenças representam evolução dos dados e do processamento, não causalidade.
        </p>
      </header>

      <div className="space-y-6 p-5 sm:p-7">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
            Ainda não existem versões históricas suficientes para comparação.
          </div>
        ) : (
          <>
            <div className="grid gap-4 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                  Versão-base
                </span>
                <select
                  value={baseRunId}
                  onChange={event => {
                    setBaseRunId(
                      event.target.value,
                    )
                    setComparison(null)
                  }}
                  className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-800"
                >
                  {items.map(item => (
                    <option
                      key={item.id}
                      value={item.id}
                    >
                      v{item.versionNumber} · {formatDateTime(item.generatedAt)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                  Versão-alvo
                </span>
                <select
                  value={targetRunId}
                  onChange={event => {
                    setTargetRunId(
                      event.target.value,
                    )
                    setComparison(null)
                    setDetail(null)
                  }}
                  className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-800"
                >
                  {items.map(item => (
                    <option
                      key={item.id}
                      value={item.id}
                    >
                      v{item.versionNumber} · {formatDateTime(item.generatedAt)}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={!canCompare || comparing}
                  onClick={() => void compare()}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#071827] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {comparing
                    ? 'Comparando...'
                    : 'Comparar'}
                </button>
                <button
                  type="button"
                  disabled={!targetRunId || loadingDetail}
                  onClick={() => void loadDetail()}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 disabled:opacity-50"
                >
                  {loadingDetail
                    ? 'Abrindo...'
                    : 'Detalhes'}
                </button>
              </div>
            </div>

            {error ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                {error}
              </div>
            ) : null}

            {comparison ? (
              <div className="space-y-5">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {(
                    Object.keys(
                      CATEGORY_LABELS,
                    ) as Array<
                      keyof typeof CATEGORY_LABELS
                    >
                  ).map(key => (
                    <DiffMetric
                      key={key}
                      label={CATEGORY_LABELS[key]}
                      value={comparison.counts[key]}
                    />
                  ))}
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  {(
                    Object.keys(
                      CATEGORY_LABELS,
                    ) as Array<
                      keyof typeof CATEGORY_LABELS
                    >
                  ).map(key => {
                    const diff =
                      comparison.collections[key]

                    return (
                      <article
                        key={key}
                        className="rounded-2xl border border-slate-200 bg-white p-4"
                      >
                        <h3 className="font-bold text-[#071827]">
                          {CATEGORY_LABELS[key]}
                        </h3>
                        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                          <div className="rounded-xl bg-cyan-50 p-3 text-cyan-800">
                            <p className="font-bold text-lg">
                              {diff.addedIds.length}
                            </p>
                            <p>Adicionados</p>
                          </div>
                          <div className="rounded-xl bg-amber-50 p-3 text-amber-800">
                            <p className="font-bold text-lg">
                              {diff.removedIds.length}
                            </p>
                            <p>Removidos</p>
                          </div>
                          <div className="rounded-xl bg-slate-50 p-3 text-slate-700">
                            <p className="font-bold text-lg">
                              {diff.maintainedIds.length}
                            </p>
                            <p>Mantidos</p>
                          </div>
                        </div>
                      </article>
                    )
                  })}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                  Revisão humana: <strong>{comparison.review.baseStatus}</strong> → <strong>{comparison.review.targetStatus}</strong>. A versão-alvo {comparison.review.targetApproved ? 'está aprovada' : 'ainda não está aprovada'}.
                </div>

                {comparison.warnings.length > 0 ? (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                    {comparison.warnings.join(' ')}
                  </div>
                ) : null}
              </div>
            ) : null}

            {detail ? (
              <article className="rounded-2xl border border-cyan-200 bg-cyan-50/40 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#0B7491]">
                      Detalhe histórico · v{detail.row.version_number}
                    </p>
                    <h3 className="mt-1 text-lg font-bold text-[#071827]">
                      {detail.row.title}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">
                      {detail.row.description || 'Sem descrição adicional.'}
                    </p>
                  </div>
                  <span className="rounded-full border border-cyan-200 bg-white px-3 py-1 text-xs font-bold text-[#075F78]">
                    {detail.row.status}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <p className="text-xs text-slate-500">Gerada</p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {formatDateTime(detail.row.generated_at)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Revisão</p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {detail.row.human_review_status}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Aprovada</p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {detail.row.approved ? 'Sim' : 'Não'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Relatório</p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {detail.report ? 'Disponível' : 'Não disponível'}
                    </p>
                  </div>
                </div>

                <p className="mt-4 text-xs leading-5 text-slate-500">
                  Versão selecionada: {selectedTarget ? `v${selectedTarget.versionNumber}` : detail.row.version_label}. O payload completo permanece preservado no histórico para auditoria e rastreabilidade.
                </p>
              </article>
            ) : null}
          </>
        )}
      </div>
    </section>
  )
}
