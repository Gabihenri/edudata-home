'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

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

type CycleDimension = {
  label: string
  value: number
  description: string
}

function formatCoefficient(value: number | null): string {
  return value === null || !Number.isFinite(value) ? '—' : value.toFixed(2)
}

function formatPercentage(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return '—'
  return `${Math.round((value <= 1 ? value * 100 : value))}%`
}

function formatDate(value?: string): string {
  if (!value) return 'Atualização não informada'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? 'Atualização não informada'
    : new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

function correlationLabel(item: AnalyticsCorrelationResult): string {
  return `${item.variableXId} × ${item.variableYId}`
}

function Metric({ label, value, description }: { label: string; value: string; description: string }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-[#071827]">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
    </article>
  )
}

function StatisticalVisualizations({
  dimensions,
  correlations,
  generatedAt,
}: {
  dimensions: CycleDimension[]
  correlations: AnalyticsCorrelationResult[]
  generatedAt?: string
}) {
  const cycleData = dimensions.map((item, index) => ({ ...item, order: index + 1 }))
  const correlationData = correlations
    .filter(item => item.coefficient !== null && Number.isFinite(item.coefficient))
    .map(item => ({
      label: correlationLabel(item),
      coefficient: Number((item.coefficient ?? 0).toFixed(3)),
      magnitude: Number(Math.abs(item.coefficient ?? 0).toFixed(3)),
      direction: (item.coefficient ?? 0) >= 0 ? 'Positiva' : 'Negativa',
    }))

  return (
    <section className="space-y-5 rounded-[1.5rem] border border-slate-200 bg-slate-50/70 p-5 sm:p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0B7491]">Laboratório Visual</p>
          <h3 className="mt-1 text-xl font-bold text-[#071827]">Visualização estatística dos dados educacionais</h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Gráficos responsivos e interativos para transformar registros em padrões visuais. A camada está preparada para receber séries históricas persistidas conforme novos snapshots forem disponibilizados.
          </p>
        </div>
        <p className="text-xs text-slate-500">Snapshot: {formatDate(generatedAt)}</p>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <article className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#0B7491]">Distribuição operacional</p>
          <h4 className="mt-1 text-lg font-bold text-[#071827]">Cobertura do ciclo EDI</h4>
          <p className="mt-1 text-sm text-slate-500">Comparação direta entre as dimensões disponíveis.</p>
          <div className="mt-5 h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cycleData} margin={{ top: 18, right: 12, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip cursor={{ fill: 'rgba(8, 28, 46, 0.05)' }} formatter={(value: number) => [value, 'Registros']} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {cycleData.map(item => <Cell key={item.label} fill={item.order === 4 ? '#0B7491' : '#071827'} />)}
                  <LabelList dataKey="value" position="top" fill="#475569" fontSize={12} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#0B7491]">Leitura do ciclo</p>
          <h4 className="mt-1 text-lg font-bold text-[#071827]">Perfil visual das dimensões</h4>
          <p className="mt-1 text-sm text-slate-500">A linha evidencia diferenças de cobertura entre as etapas.</p>
          <div className="mt-5 h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cycleData} margin={{ top: 18, right: 12, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip formatter={(value: number) => [value, 'Registros']} />
                <Legend />
                <Line type="monotone" dataKey="value" name="Registros" stroke="#0B7491" strokeWidth={3} dot={{ r: 5, fill: '#071827' }} activeDot={{ r: 7 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>
      </div>

      {correlationData.length > 0 ? (
        <article className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#0B7491]">Correlação estatística</p>
          <h4 className="mt-1 text-lg font-bold text-[#071827]">Magnitude das associações identificadas</h4>
          <p className="mt-1 text-sm text-slate-500">Valores próximos de 1 ou -1 possuem maior magnitude de associação. Correlação não implica causalidade.</p>
          <div className="mt-5 h-[360px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={correlationData} layout="vertical" margin={{ top: 8, right: 30, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" domain={[0, 1]} tickLine={false} axisLine={false} fontSize={12} />
                <YAxis type="category" dataKey="label" width={160} tickLine={false} axisLine={false} fontSize={11} />
                <Tooltip formatter={(value: number, _name, item) => [`${value.toFixed(3)} (${String(item.payload.direction).toLowerCase()})`, 'Magnitude']} />
                <Bar dataKey="magnitude" name="Magnitude" radius={[0, 8, 8, 0]} fill="#0B7491">
                  <LabelList dataKey="coefficient" position="right" formatter={(value: number) => `r ${value >= 0 ? '+' : ''}${value.toFixed(2)}`} fill="#475569" fontSize={11} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      ) : null}

      <div className="rounded-xl border border-cyan-100 bg-cyan-50/70 p-4 text-sm leading-6 text-slate-600">
        <span className="font-semibold text-[#075F78]">Próximo salto analítico:</span> conectar os snapshots históricos ao motor gráfico para permitir filtros de período, séries semanais e mensais, médias móveis, comparação entre períodos e análise de tendência sobre dados reais.
      </div>
    </section>
  )
}

function CorrelationCard({ item }: { item: AnalyticsCorrelationResult }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#0B7491]">{item.method}</p>
          <h4 className="mt-1 font-semibold text-[#071827]">{correlationLabel(item)}</h4>
        </div>
        <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-sm font-bold text-[#075F78]">r = {formatCoefficient(item.coefficient)}</span>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div><p className="text-xs text-slate-500">Força</p><p className="mt-1 text-sm font-semibold text-slate-800">{item.strength}</p></div>
        <div><p className="text-xs text-slate-500">Amostra</p><p className="mt-1 text-sm font-semibold text-slate-800">{item.sampleSize}</p></div>
        <div><p className="text-xs text-slate-500">Confiança</p><p className="mt-1 text-sm font-semibold text-slate-800">{formatPercentage(item.confidence.value)}</p></div>
      </div>
      <p className="mt-4 text-xs leading-5 text-slate-500">Associação estatística. Não representa causalidade.</p>
    </article>
  )
}

export default function EducationalAnalyticsPanel() {
  const [data, setData] = useState<AnalyticsApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (): Promise<void> => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/agenda/educational-analytics/operational', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      })
      const body = (await response.json()) as AnalyticsApiResponse
      if (!response.ok) throw new Error(body.error || body.errors?.[0] || 'Não foi possível executar a análise educacional.')
      setData(body)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Não foi possível executar a análise educacional.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const dimensions = useMemo<CycleDimension[]>(() => {
    const summary = data?.snapshot?.summary
    return [
      { label: 'Planejar', value: summary?.totalPlanning ?? 0, description: 'Planejamentos disponíveis' },
      { label: 'Registrar', value: summary?.totalLessons ?? 0, description: 'Aulas e registros disponíveis' },
      { label: 'Evidenciar', value: summary?.totalEvidences ?? 0, description: 'Evidências disponíveis' },
      { label: 'Analisar', value: data?.analytics?.observations.length ?? 0, description: 'Observações disponíveis para análise' },
    ]
  }, [data])

  if (loading) return <section className="rounded-[1.75rem] border border-cyan-200 bg-white p-6 shadow-sm"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B7491]">EIOS · Educational Analytics</p><h2 className="mt-2 text-2xl font-bold text-[#071827]">Processando inteligência educacional</h2><p className="mt-2 text-sm leading-6 text-slate-500">Correlacionando registros, procurando padrões e preparando visualizações estatísticas.</p></section>

  if (error || !data?.analytics) return <section className="rounded-[1.75rem] border border-amber-200 bg-white p-6 shadow-sm"><p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">EIOS · Educational Analytics</p><h2 className="mt-2 text-2xl font-bold text-[#071827]">Análise indisponível</h2><p className="mt-2 text-sm leading-6 text-slate-600">{error ?? 'Ainda não há dados suficientes para uma análise válida.'}</p><button type="button" onClick={() => void load()} className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Tentar novamente</button></section>

  const analytics = data.analytics
  const availableDimensions = dimensions.filter(item => item.value > 0)
  const coverageRate = dimensions.length ? availableDimensions.length / dimensions.length : 0
  const coverageLabel = availableDimensions.length === 0 ? 'Dados iniciais' : availableDimensions.length === dimensions.length ? 'Cobertura completa' : 'Cobertura parcial'
  const correlations = [...analytics.correlations].sort((a, b) => Math.abs(b.coefficient ?? 0) - Math.abs(a.coefficient ?? 0)).slice(0, 6)
  const patterns: AnalyticsPatternResult[] = analytics.patterns.slice(0, 6)
  const anomalies: AnalyticsAnomalyResult[] = analytics.anomalies.slice(0, 6)

  return (
    <section className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
      <header className="border-b border-slate-200 bg-[#071827] px-5 py-6 text-white sm:px-7">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">EIOS · Educational Analytics</p>
        <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div><h2 className="text-2xl font-bold">Ciência de Dados aplicada à Educação</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">Análise estatística, visualizações profissionais e inteligência contextualizada a partir de dados educacionais autorizados.</p></div>
          <button type="button" onClick={() => void load()} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15">Reprocessar análise</button>
        </div>
      </header>

      <div className="space-y-7 p-5 sm:p-7">
        <section className="rounded-2xl border border-cyan-100 bg-cyan-50/50 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0B7491]">Base da análise</p><h3 className="mt-1 text-xl font-bold text-[#071827]">{coverageLabel}: {availableDimensions.length} de {dimensions.length} dimensões com dados</h3><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Ausência de registros não é interpretada como baixo desempenho. Os resultados devem ser lidos de acordo com a cobertura e as limitações da base.</p></div>
            <div className="rounded-xl border border-cyan-200 bg-white px-4 py-3 text-left lg:text-right"><p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Cobertura</p><p className="mt-1 text-2xl font-bold text-[#075F78]">{formatPercentage(coverageRate)}</p><p className="mt-1 text-xs text-slate-500">Atualizado em {formatDate(data.snapshot?.generatedAt)}</p></div>
          </div>
          <p className="mt-4 text-xs leading-5 text-slate-500">Fonte atual: Agenda Inteligente EDI. Outras fontes autorizadas poderão ser incorporadas progressivamente.</p>
        </section>

        <StatisticalVisualizations dimensions={dimensions} correlations={correlations} generatedAt={data.snapshot?.generatedAt} />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Observações" value={String(analytics.observations.length)} description="Registros convertidos para o contrato analítico." />
          <Metric label="Correlações" value={String(analytics.correlations.length)} description="Associações estatísticas avaliadas pelos motores EIOS." />
          <Metric label="Padrões" value={String(analytics.patterns.length)} description="Tendências e recorrências detectadas." />
          <Metric label="Pontos para revisão" value={String(analytics.anomalies.length)} description="Sinais que exigem interpretação humana." />
        </div>

        {correlations.length > 0 ? <div><div className="mb-4"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0B7491]">Detalhamento</p><h3 className="mt-1 text-xl font-bold text-[#071827]">Relações com maior magnitude</h3></div><div className="grid gap-4 lg:grid-cols-2">{correlations.map(item => <CorrelationCard key={item.id} item={item} />)}</div></div> : null}

        {patterns.length > 0 ? <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0B7491]">Padrões</p><div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{patterns.map(item => <article key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{item.type}</p><h4 className="mt-2 font-semibold text-[#071827]">{item.title}</h4><p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p></article>)}</div></div> : null}

        {anomalies.length > 0 ? <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-700">Pontos para revisão</p><div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{anomalies.map(item => <article key={item.id} className="rounded-2xl border border-amber-200 bg-amber-50 p-4"><p className="text-xs font-bold uppercase tracking-[0.12em] text-amber-700">{item.type} · {item.severity}</p><p className="mt-2 text-sm font-semibold text-amber-950">Variável: {item.variableId ?? 'não identificada'}</p><p className="mt-2 text-xs leading-5 text-amber-800">Requer interpretação humana antes de qualquer intervenção.</p></article>)}</div></div> : null}

        {analytics.warnings.length > 0 ? <details className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><summary className="cursor-pointer text-sm font-semibold text-slate-700">Limitações e avisos ({analytics.warnings.length})</summary><ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">{analytics.warnings.map((warning, index) => <li key={`${warning}-${index}`}>{warning}</li>)}</ul></details> : null}
      </div>
    </section>
  )
}
