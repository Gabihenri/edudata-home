'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts'

import { useEducationalAnalyticsDataset } from '@/hooks/agenda/useEducationalAnalyticsDataset'

type Period = '7d' | '30d' | '90d'
type MovingAverageWindow = 2 | 3 | 4

type DemoKey = 'score' | 'engagement' | 'evidence'
type DataRow = Record<string, number | string | undefined> & {
  period: string
  timestamp?: string
}

const DEMO_SERIES: DataRow[] = [
  { period: 'Sem 1', engagement: 62, evidence: 54, score: 58 },
  { period: 'Sem 2', engagement: 66, evidence: 59, score: 61 },
  { period: 'Sem 3', engagement: 64, evidence: 63, score: 65 },
  { period: 'Sem 4', engagement: 71, evidence: 68, score: 69 },
  { period: 'Sem 5', engagement: 74, evidence: 72, score: 73 },
  { period: 'Sem 6', engagement: 78, evidence: 75, score: 77 },
  { period: 'Sem 7', engagement: 76, evidence: 79, score: 80 },
  { period: 'Sem 8', engagement: 82, evidence: 83, score: 84 },
]

const DEMO_VARIABLES: Record<DemoKey, { label: string; short: string }> = {
  score: { label: 'Score educacional', short: 'Score' },
  engagement: { label: 'Engajamento', short: 'Engaj.' },
  evidence: { label: 'Evidências', short: 'Evid.' },
}

function numericValue(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value)
    ? value
    : undefined
}

function movingAverage(
  values: Array<number | undefined>,
  window: MovingAverageWindow,
): Array<number | undefined> {
  return values.map((_, index) => {
    const start = Math.max(0, index - window + 1)
    const validValues = values
      .slice(start, index + 1)
      .filter((value): value is number => value !== undefined)

    if (!validValues.length) return undefined

    return validValues.reduce((sum, value) => sum + value, 0)
      / validValues.length
  })
}

function percentile(values: number[], value: number) {
  if (!values.length) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const position = (sorted.length - 1) * value
  const lower = Math.floor(position)
  const upper = Math.ceil(position)
  if (lower === upper) return sorted[lower]
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower)
}

function linearTrend(values: number[]) {
  if (values.length < 2) return 0
  const meanX = (values.length - 1) / 2
  const meanY = values.reduce((sum, value) => sum + value, 0) / values.length
  let numerator = 0
  let denominator = 0
  values.forEach((value, index) => {
    numerator += (index - meanX) * (value - meanY)
    denominator += (index - meanX) ** 2
  })
  return denominator === 0 ? 0 : numerator / denominator
}

function pearsonCorrelation(xValues: number[], yValues: number[]) {
  const pairs = xValues.map((value, index) => [value, yValues[index]] as const)
    .filter((pair): pair is readonly [number, number] => Number.isFinite(pair[0]) && Number.isFinite(pair[1]))
  if (pairs.length < 2) return 0
  const meanX = pairs.reduce((sum, pair) => sum + pair[0], 0) / pairs.length
  const meanY = pairs.reduce((sum, pair) => sum + pair[1], 0) / pairs.length
  let numerator = 0
  let xSum = 0
  let ySum = 0
  pairs.forEach(([x, y]) => {
    const dx = x - meanX
    const dy = y - meanY
    numerator += dx * dy
    xSum += dx ** 2
    ySum += dy ** 2
  })
  const denominator = Math.sqrt(xSum * ySum)
  return denominator === 0 ? 0 : numerator / denominator
}

function formatTrend(trend: number) {
  if (Math.abs(trend) < 0.35) return 'Estável'
  return trend > 0 ? 'Crescimento' : 'Queda'
}

function correlationLabel(correlation: number) {
  const magnitude = Math.abs(correlation)
  const direction = correlation >= 0 ? 'positiva' : 'negativa'
  if (magnitude >= 0.8) return `Muito forte ${direction}`
  if (magnitude >= 0.6) return `Forte ${direction}`
  if (magnitude >= 0.4) return `Moderada ${direction}`
  if (magnitude >= 0.2) return `Fraca ${direction}`
  return 'Muito fraca'
}

function correlationTone(correlation: number) {
  const intensity = Math.min(Math.abs(correlation), 1)
  if (correlation >= 0) return { backgroundColor: `rgba(11, 116, 145, ${0.08 + intensity * 0.82})`, color: intensity > 0.55 ? '#fff' : '#0f172a' }
  return { backgroundColor: `rgba(239, 68, 68, ${0.08 + intensity * 0.72})`, color: intensity > 0.55 ? '#fff' : '#0f172a' }
}

function formatPeriod(value: string | null, index: number) {
  if (!value) return `Obs. ${index + 1}`
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return `Obs. ${index + 1}`
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(date)
}

function filterDataByPeriod(data: DataRow[], period: Period): DataRow[] {
  const datedRows = data.filter(row => row.timestamp && !Number.isNaN(new Date(row.timestamp).getTime()))

  if (datedRows.length === data.length && datedRows.length > 0) {
    const latestTimestamp = Math.max(...datedRows.map(row => new Date(row.timestamp!).getTime()))
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90
    const cutoff = latestTimestamp - days * 24 * 60 * 60 * 1000

    return datedRows.filter(row => new Date(row.timestamp!).getTime() >= cutoff)
  }

  const size = period === '7d' ? 4 : period === '30d' ? 6 : data.length
  return data.slice(-size)
}

export default function StatisticalExplorationPanel() {
  const { data, quality, operationalSummary, generatedAt, loading, error, refresh } = useEducationalAnalyticsDataset()
  const [period, setPeriod] = useState<Period>('90d')
  const [window, setWindow] = useState<MovingAverageWindow>(3)
  const [selectedVariable, setSelectedVariable] = useState('score')
  const [scatterX, setScatterX] = useState('engagement')
  const [scatterY, setScatterY] = useState('score')

  const realVariables = useMemo(() => (data?.configuration.variableDefinitions ?? [])
    .filter(variable => ['integer', 'decimal', 'percentage', 'proportion', 'score', 'count', 'duration'].includes(variable.valueType))
    .map(variable => ({ id: variable.id, key: variable.key, label: variable.label, short: variable.label.slice(0, 12) })), [data])

  const usingRealData = realVariables.length > 0 && (data?.observations.length ?? 0) > 0
  const variables = usingRealData
    ? realVariables
    : Object.entries(DEMO_VARIABLES).map(([key, meta]) => ({ id: key, key, label: meta.label, short: meta.short }))

  useEffect(() => {
    if (!variables.some(variable => variable.key === selectedVariable)) setSelectedVariable(variables[0]?.key ?? 'score')
    if (!variables.some(variable => variable.key === scatterX)) setScatterX(variables[0]?.key ?? 'score')
    if (!variables.some(variable => variable.key === scatterY)) setScatterY(variables[1]?.key ?? variables[0]?.key ?? 'score')
  }, [selectedVariable, scatterX, scatterY, variables])

  const fullData = useMemo<DataRow[]>(() => {
    if (!usingRealData || !data) return DEMO_SERIES
    const variableById = new Map(data.configuration.variableDefinitions.map(variable => [variable.id, variable.key]))
    const grouped = new Map<string, DataRow>()

    data.observations
      .filter(observation => !observation.excluded && observation.numericValue !== null)
      .forEach((observation, index) => {
        const timestamp = observation.observedAt ?? observation.recordedAt ?? null
        const key = timestamp ?? observation.id
        const variableKey = variableById.get(observation.variableId)
        if (!variableKey) return

        const current = grouped.get(key) ?? {
          period: formatPeriod(timestamp, index),
          ...(timestamp ? { timestamp } : {}),
        }
        current[variableKey] = observation.numericValue ?? undefined
        grouped.set(key, current)
      })

    return Array.from(grouped.entries())
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([, value]) => value)
  }, [data, usingRealData])

  const limitedData = useMemo(
    () => filterDataByPeriod(fullData, period),
    [fullData, period],
  )

  const temporalData = useMemo<DataRow[]>(() => {
    const average = movingAverage(
      limitedData.map(item => numericValue(item[selectedVariable])),
      window,
    )

    return limitedData.map((item, index) => ({
      ...item,
      movingAverage: average[index],
    }))
  }, [limitedData, selectedVariable, window])

  const values = limitedData
    .map(item => numericValue(item[selectedVariable]))
    .filter((value): value is number => value !== undefined)

  const mean = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0
  const variance = values.length ? values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length : 0
  const standardDeviation = Math.sqrt(variance)
  const median = percentile(values, 0.5)
  const firstQuartile = percentile(values, 0.25)
  const thirdQuartile = percentile(values, 0.75)
  const interquartileRange = thirdQuartile - firstQuartile
  const coefficientOfVariation = mean === 0 ? 0 : (standardDeviation / mean) * 100
  const trend = linearTrend(values)
  const variationPercent = values.length < 2 || values[0] === 0 ? 0 : ((values.at(-1)! - values[0]) / values[0]) * 100
  const outliers = values.filter(value => value > thirdQuartile + interquartileRange * 1.5 || value < firstQuartile - interquartileRange * 1.5)

  const distribution = useMemo(() => {
    if (!values.length) return []
    const min = Math.min(...values)
    const max = Math.max(...values)
    const step = Math.max((max - min) / 5, 1)
    return Array.from({ length: 5 }, (_, index) => {
      const start = min + step * index
      const end = index === 4 ? max : min + step * (index + 1)
      return {
        range: `${start.toFixed(0)}–${end.toFixed(0)}`,
        observations: values.filter(value => index === 4 ? value >= start && value <= end : value >= start && value < end).length,
      }
    })
  }, [values])

  const correlationMatrix = useMemo(() => variables.map(row => ({
    variable: row.key,
    values: variables.map(column => pearsonCorrelation(
      limitedData.map(item => Number(item[row.key])),
      limitedData.map(item => Number(item[column.key])),
    )),
  })), [limitedData, variables])

  const scatterData = limitedData.flatMap(item => {
    const x = numericValue(item[scatterX])
    const y = numericValue(item[scatterY])
    const z = numericValue(item[selectedVariable])

    return x === undefined || y === undefined
      ? []
      : [{ x, y, z: z ?? 1, period: item.period }]
  })
  const scatterCorrelation = pearsonCorrelation(scatterData.map(item => item.x), scatterData.map(item => item.y))

  const strongestRelationship = useMemo(() => variables
    .flatMap((left, index) => variables.slice(index + 1).map(right => ({
      left,
      right,
      value: pearsonCorrelation(
        limitedData.map(item => Number(item[left.key])),
        limitedData.map(item => Number(item[right.key])),
      ),
    })))
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))[0], [limitedData, variables])

  const qualityLabel = quality?.status ?? (usingRealData ? 'carregando' : 'demonstração')
  const selectedLabel = variables.find(variable => variable.key === selectedVariable)?.label ?? selectedVariable
  const missingSelectedValues = limitedData.length - values.length

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-gradient-to-r from-[#071827] via-[#0B2A40] to-[#0B7491] px-5 py-6 text-white sm:px-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-200">Laboratório analítico</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight">Exploração Estatística</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-200">Investigação de distribuição, tendência, dispersão, variabilidade e relações entre variáveis. Os resultados indicam sinais para investigação e não conclusões causais.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(['7d', '30d', '90d'] as Period[]).map(option => <button key={option} type="button" onClick={() => setPeriod(option)} className={`rounded-xl px-3 py-2 text-xs font-bold transition ${period === option ? 'bg-white text-[#071827]' : 'border border-white/20 text-white hover:bg-white/10'}`}>{option === '7d' ? '7 dias' : option === '30d' ? '30 dias' : '90 dias'}</button>)}
          </div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-4">
          <div className="rounded-xl bg-white/10 px-3 py-2"><p className="text-[10px] uppercase tracking-[0.14em] text-cyan-100">Fonte</p><p className="mt-1 text-sm font-bold">{usingRealData ? 'Agenda Inteligente EDI' : 'Modo demonstração'}</p></div>
          <div className="rounded-xl bg-white/10 px-3 py-2"><p className="text-[10px] uppercase tracking-[0.14em] text-cyan-100">Observações</p><p className="mt-1 text-sm font-bold">{quality?.validObservationCount ?? (usingRealData ? data?.observations.length : DEMO_SERIES.length) ?? 0}</p></div>
          <div className="rounded-xl bg-white/10 px-3 py-2"><p className="text-[10px] uppercase tracking-[0.14em] text-cyan-100">Qualidade</p><p className="mt-1 text-sm font-bold capitalize">{qualityLabel}</p></div>
          <div className="rounded-xl bg-white/10 px-3 py-2"><p className="text-[10px] uppercase tracking-[0.14em] text-cyan-100">Gerado</p><p className="mt-1 text-sm font-bold">{generatedAt ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(generatedAt)) : '—'}</p></div>
        </div>
      </div>

      <div className="p-5 sm:p-7">
        {loading && <div className="mb-5 rounded-2xl border border-cyan-100 bg-cyan-50 p-4 text-sm text-slate-700">Carregando Dataset Analítico Educacional…</div>}
        {error && <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-slate-700 sm:flex-row sm:items-center sm:justify-between"><span>{error} O laboratório permanece disponível em modo demonstração.</span><button type="button" onClick={() => void refresh()} className="rounded-xl bg-[#0B7491] px-3 py-2 text-xs font-bold text-white">Tentar novamente</button></div>}
        {usingRealData && quality && quality.status !== 'good' && quality.status !== 'usable' && <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-slate-700">Os dados reais foram carregados, mas a qualidade da amostra exige cautela metodológica. Resultados exploratórios devem ser interpretados considerando completude e tamanho da amostra.</div>}

        <div className="grid gap-5 xl:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-[#F8FAFC] p-5 xl:col-span-2">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="font-bold text-slate-900">Série temporal e tendência</h3><p className="mt-1 text-sm text-slate-500">Linha observada e média móvel configurável, preservando lacunas dos dados reais.</p></div><div className="flex gap-2"><select value={selectedVariable} onChange={event => setSelectedVariable(event.target.value)} className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700">{variables.map(variable => <option key={variable.key} value={variable.key}>{variable.label}</option>)}</select><select value={window} onChange={event => setWindow(Number(event.target.value) as MovingAverageWindow)} className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700"><option value={2}>MM 2 períodos</option><option value={3}>MM 3 períodos</option><option value={4}>MM 4 períodos</option></select></div></div>
            <div className="mt-5 h-72"><ResponsiveContainer width="100%" height="100%"><LineChart data={temporalData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="period" /><YAxis /><Tooltip /><ReferenceLine y={mean} strokeDasharray="5 5" label="Média" /><Line type="monotone" dataKey={selectedVariable} stroke="#0B7491" strokeWidth={3} name={selectedLabel} connectNulls={false} /><Line type="monotone" dataKey="movingAverage" stroke="#0F766E" strokeWidth={2} strokeDasharray="6 4" dot={false} name="Média móvel" connectNulls={false} /></LineChart></ResponsiveContainer></div>
            <div className="mt-4 grid gap-3 sm:grid-cols-4"><div className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-xs text-slate-500">Tendência</p><p className="mt-1 font-bold">{formatTrend(trend)}</p></div><div className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-xs text-slate-500">Variação</p><p className="mt-1 font-bold">{variationPercent >= 0 ? '+' : ''}{variationPercent.toFixed(1)}%</p></div><div className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-xs text-slate-500">Inclinação</p><p className="mt-1 font-bold">{trend.toFixed(2)} / período</p></div><div className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-xs text-slate-500">Lacunas</p><p className="mt-1 font-bold">{missingSelectedValues}</p></div></div>
          </article>

          <article className="rounded-2xl border border-slate-200 p-5"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#0B7491]">Resumo estatístico</p><div className="mt-5 grid grid-cols-2 gap-4"><div><p className="text-sm text-slate-500">Média</p><p className="text-2xl font-bold">{mean.toFixed(1)}</p></div><div><p className="text-sm text-slate-500">Mediana</p><p className="text-2xl font-bold">{median.toFixed(1)}</p></div><div><p className="text-sm text-slate-500">Desvio padrão</p><p className="text-xl font-bold">{standardDeviation.toFixed(1)}</p></div><div><p className="text-sm text-slate-500">CV</p><p className="text-xl font-bold">{coefficientOfVariation.toFixed(1)}%</p></div><div><p className="text-sm text-slate-500">Quartis</p><p className="text-sm font-bold">{firstQuartile.toFixed(1)} · {thirdQuartile.toFixed(1)}</p></div><div><p className="text-sm text-slate-500">Outliers</p><p className="text-xl font-bold">{outliers.length}</p></div></div><div className="mt-6 rounded-xl bg-[#EEF6F8] p-4 text-sm leading-6 text-slate-600">{operationalSummary ? 'Os indicadores foram preparados a partir do contexto operacional autorizado da Agenda.' : 'A leitura estatística deve considerar contexto, período e condições pedagógicas.'}</div></article>

          <article className="rounded-2xl border border-slate-200 p-5"><h3 className="font-bold text-slate-900">Distribuição</h3><p className="mt-1 text-sm text-slate-500">Concentração das observações válidas por faixa.</p><div className="mt-5 h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={distribution}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="range" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="observations" fill="#0B7491" radius={[6, 6, 0, 0]} name="Observações" /></BarChart></ResponsiveContainer></div><div className="mt-4 grid grid-cols-2 gap-3 text-sm"><div className="rounded-xl bg-slate-50 p-3"><p className="text-slate-500">Amplitude</p><p className="mt-1 font-bold">{values.length ? (Math.max(...values) - Math.min(...values)).toFixed(1) : '0'}</p></div><div className="rounded-xl bg-slate-50 p-3"><p className="text-slate-500">IQR</p><p className="mt-1 font-bold">{interquartileRange.toFixed(1)}</p></div></div></article>

          <article className="rounded-2xl border border-slate-200 p-5 xl:col-span-2"><div className="flex flex-col gap-4 lg:flex-row lg:justify-between"><div><h3 className="font-bold text-slate-900">Relação entre variáveis</h3><p className="mt-1 text-sm text-slate-500">Selecione as variáveis para investigar associação apenas nas observações com pares válidos.</p></div><div className="flex gap-2"><select value={scatterX} onChange={event => setScatterX(event.target.value)} className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold">{variables.map(variable => <option key={variable.key} value={variable.key}>X: {variable.label}</option>)}</select><select value={scatterY} onChange={event => setScatterY(event.target.value)} className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold">{variables.map(variable => <option key={variable.key} value={variable.key}>Y: {variable.label}</option>)}</select></div></div><div className="mt-4 rounded-xl bg-[#EEF6F8] px-4 py-3"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#0B7491]">Pearson exploratório</p><p className="mt-1 text-lg font-bold">r = {scatterCorrelation.toFixed(2)} · {correlationLabel(scatterCorrelation)}</p><p className="mt-1 text-xs text-slate-500">Pares válidos no período: {scatterData.length}</p></div><div className="mt-5 h-64"><ResponsiveContainer width="100%" height="100%"><ScatterChart><CartesianGrid /><XAxis type="number" dataKey="x" /><YAxis type="number" dataKey="y" /><ZAxis type="number" dataKey="z" range={[60, 180]} /><Tooltip cursor={{ strokeDasharray: '3 3' }} /><Scatter data={scatterData} fill="#0B7491" /></ScatterChart></ResponsiveContainer></div><p className="mt-3 text-xs leading-5 text-slate-500">Correlação mede associação linear no conjunto analisado e não demonstra causalidade.</p></article>

          <article className="rounded-2xl border border-slate-200 p-5 xl:col-span-3"><div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#0B7491]">Descoberta de relações</p><h3 className="mt-1 font-bold text-slate-900">Matriz de correlação</h3><p className="mt-1 text-sm text-slate-500">Visão simultânea das relações lineares entre as variáveis disponíveis.</p></div>{strongestRelationship && <div className="rounded-xl border border-cyan-100 bg-[#F4FAFB] px-4 py-3 text-sm"><p className="text-xs text-slate-500">Relação mais intensa</p><p className="mt-1 font-bold">{strongestRelationship.left.label} × {strongestRelationship.right.label}</p><p className="mt-1 text-[#0B7491]">r = {strongestRelationship.value.toFixed(2)} · {correlationLabel(strongestRelationship.value)}</p></div>}</div><div className="mt-6 overflow-x-auto"><div className="min-w-[620px]"><div className="grid gap-2 text-center text-xs" style={{ gridTemplateColumns: `repeat(${variables.length + 1}, minmax(0, 1fr))` }}><div className="p-3" />{variables.map(variable => <div key={variable.key} className="rounded-xl bg-slate-100 p-3 font-bold text-slate-700">{variable.short}</div>)}{correlationMatrix.map(row => <div key={row.variable} className="contents"><div className="flex items-center rounded-xl bg-slate-100 p-3 font-bold text-slate-700">{variables.find(variable => variable.key === row.variable)?.short}</div>{row.values.map((value, index) => <div key={`${row.variable}-${variables[index]?.key}`} className="rounded-xl p-3 font-bold shadow-sm" style={correlationTone(value)}>{value.toFixed(2)}</div>)}</div>)}</div></div></div><div className="mt-5 flex flex-wrap gap-3 text-xs text-slate-500"><span>+1 associação positiva forte</span><span>0 ausência de associação linear</span><span>−1 associação negativa forte</span><span className="ml-auto">A diagonal é sempre 1,00.</span></div></article>
        </div>
      </div>
    </section>
  )
}
