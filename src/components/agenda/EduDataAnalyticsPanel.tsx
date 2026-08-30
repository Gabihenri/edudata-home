'use client'

import { useEffect, useState } from 'react'

type AnalyticsResponse = {
  success: boolean
  warnings?: string[]
  errors?: string[]
  executedCapabilities?: string[]
  analytics?: {
    patterns?: unknown[]
    anomalies?: unknown[]
    recommendations?: unknown[]
    correlations?: unknown[]
  } | null
  dataset?: {
    quality?: {
      status?: string
      score?: number
      validObservations?: number
      totalObservations?: number
      missingProportion?: number
      warnings?: string[]
    }
    generatedAt?: string
  }
}

function labelStatus(data: AnalyticsResponse | null): string {
  if (!data) return 'Aguardando análise'
  if (!data.success) return 'Dados ainda insuficientes'
  if ((data.errors?.length ?? 0) > 0) return 'Análise com restrições'
  if ((data.warnings?.length ?? 0) > 0 || (data.dataset?.quality?.warnings?.length ?? 0) > 0) return 'Análise disponível com limitações'
  return 'Análise disponível'
}

function getLimitations(data: AnalyticsResponse): string[] {
  return [
    ...(data.errors ?? []),
    ...(data.dataset?.quality?.warnings ?? []),
    ...(data.warnings ?? []),
  ].filter((value, index, values) => values.indexOf(value) === index).slice(0, 3)
}

export default function EduDataAnalyticsPanel() {
  const [data, setData] = useState<AnalyticsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function load() {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch('/api/agenda/educational-analytics/operational', { cache: 'no-store' })
        const result = await response.json() as AnalyticsResponse & { error?: string }

        // Uma resposta 422 pode representar uma limitação legítima dos dados
        // (por exemplo, ausência de observações suficientes), e não uma falha técnica.
        // Nesse caso, preservamos o resultado e mostramos o estado pedagógico ao usuário.
        if (!response.ok && result.dataset) {
          if (active) setData(result)
          return
        }

        if (!response.ok) {
          throw new Error(result?.error ?? 'Não foi possível carregar a análise.')
        }

        if (active) setData(result)
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Erro ao carregar a análise.')
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => { active = false }
  }, [])

  const patterns = data?.analytics?.patterns?.length ?? 0
  const anomalies = data?.analytics?.anomalies?.length ?? 0
  const recommendations = data?.analytics?.recommendations?.length ?? 0
  const correlations = data?.analytics?.correlations?.length ?? 0
  const quality = data?.dataset?.quality
  const limitations = data ? getLimitations(data) : []

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-500">EduData Analytics</p>
          <h2 className="text-xl font-bold text-slate-900">O que os dados da sua Agenda mostram</h2>
          <p className="mt-1 text-sm text-slate-600">Os resultados são interpretados a partir dos registros disponíveis e podem apresentar limitações quando ainda há poucos dados.</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">{labelStatus(data)}</span>
      </div>

      {loading && <p className="mt-6 text-sm text-slate-500">Analisando os dados operacionais...</p>}
      {error && <p className="mt-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">{error}</p>}

      {!loading && !error && data && (
        <>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Metric label="Padrões identificados" value={patterns} />
            <Metric label="Alertas encontrados" value={anomalies} />
            <Metric label="Correlações analisadas" value={correlations} />
            <Metric label="Recomendações disponíveis" value={recommendations} />
          </div>

          <div className="mt-5 rounded-xl bg-slate-50 p-4">
            <h3 className="font-semibold text-slate-900">Transparência da análise</h3>
            <div className="mt-2 grid gap-2 text-sm text-slate-600 sm:grid-cols-3">
              <span>Registros válidos: {quality?.validObservations ?? '—'}</span>
              <span>Registros avaliados: {quality?.totalObservations ?? '—'}</span>
              <span>Dados ausentes: {typeof quality?.missingProportion === 'number' ? `${Math.round(quality.missingProportion * 100)}%` : '—'}</span>
            </div>
            {limitations.length > 0 ? (
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
                {limitations.map((limitation, index) => <li key={index}>{limitation}</li>)}
              </ul>
            ) : null}
          </div>

          {!data.success && (
            <p className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
              A análise ainda não pode ser concluída com os registros atuais. Continue utilizando a Agenda; assim que houver dados suficientes, os indicadores serão atualizados automaticamente.
            </p>
          )}

          <p className="mt-4 text-xs text-slate-500">Importante: padrões e correlações ajudam a orientar decisões, mas uma associação estatística não comprova causalidade. Recomendações devem ser interpretadas com contexto e revisão humana.</p>
        </>
      )}
    </section>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-xl border border-slate-200 p-4"><p className="text-2xl font-bold text-slate-900">{value}</p><p className="mt-1 text-sm text-slate-600">{label}</p></div>
}
