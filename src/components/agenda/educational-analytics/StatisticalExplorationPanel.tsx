'use client'

import { useMemo, useState } from 'react'
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

type Period = '7d' | '30d' | '90d'
type SeriesKey = 'score' | 'engagement' | 'evidence'
type MovingAverageWindow = 2 | 3 | 4

const SERIES = [
  { period: 'Sem 1', engagement: 62, evidence: 54, score: 58, expected: 55 },
  { period: 'Sem 2', engagement: 66, evidence: 59, score: 61, expected: 56 },
  { period: 'Sem 3', engagement: 64, evidence: 63, score: 65, expected: 58 },
  { period: 'Sem 4', engagement: 71, evidence: 68, score: 69, expected: 60 },
  { period: 'Sem 5', engagement: 74, evidence: 72, score: 73, expected: 62 },
  { period: 'Sem 6', engagement: 78, evidence: 75, score: 77, expected: 64 },
  { period: 'Sem 7', engagement: 76, evidence: 79, score: 80, expected: 66 },
  { period: 'Sem 8', engagement: 82, evidence: 83, score: 84, expected: 68 },
]

const DISTRIBUTION = [
  { range: '0–20', students: 2 },
  { range: '21–40', students: 5 },
  { range: '41–60', students: 11 },
  { range: '61–80', students: 18 },
  { range: '81–100', students: 9 },
]

const VARIABLE_META: Record<SeriesKey, { label: string; short: string }> = {
  score: { label: 'Score educacional', short: 'Score' },
  engagement: { label: 'Engajamento', short: 'Engaj.' },
  evidence: { label: 'Evidências', short: 'Evid.' },
}

const VARIABLES = Object.keys(VARIABLE_META) as SeriesKey[]

function movingAverage(values: number[], window: MovingAverageWindow) {
  return values.map((_, index) => {
    const start = Math.max(0, index - window + 1)
    const slice = values.slice(start, index + 1)
    return Number((slice.reduce((sum, item) => sum + item, 0) / slice.length).toFixed(1))
  })
}

function percentile(values: number[], value: number) {
  if (values.length === 0) return 0
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
  const size = Math.min(xValues.length, yValues.length)
  if (size < 2) return 0

  const x = xValues.slice(0, size)
  const y = yValues.slice(0, size)
  const meanX = x.reduce((sum, value) => sum + value, 0) / size
  const meanY = y.reduce((sum, value) => sum + value, 0) / size

  let numerator = 0
  let xSum = 0
  let ySum = 0

  x.forEach((value, index) => {
    const xDeviation = value - meanX
    const yDeviation = y[index] - meanY
    numerator += xDeviation * yDeviation
    xSum += xDeviation ** 2
    ySum += yDeviation ** 2
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
  if (correlation >= 0) {
    return { backgroundColor: `rgba(11, 116, 145, ${0.08 + intensity * 0.82})`, color: intensity > 0.55 ? '#ffffff' : '#0f172a' }
  }
  return { backgroundColor: `rgba(239, 68, 68, ${0.08 + intensity * 0.72})`, color: intensity > 0.55 ? '#ffffff' : '#0f172a' }
}

export default function StatisticalExplorationPanel() {
  const [period, setPeriod] = useState<Period>('90d')
  const [series, setSeries] = useState<SeriesKey>('score')
  const [window, setWindow] = useState<MovingAverageWindow>(3)
  const [scatterX, setScatterX] = useState<SeriesKey>('engagement')
  const [scatterY, setScatterY] = useState<SeriesKey>('score')

  const temporalData = useMemo(() => {
    const size = period === '7d' ? 4 : period === '30d' ? 6 : SERIES.length
    const data = SERIES.slice(-size)
    const average = movingAverage(data.map(item => item[series]), window)

    return data.map((item, index) => ({ ...item, movingAverage: average[index] }))
  }, [period, series, window])

  const values = temporalData.map(item => item[series])
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length
  const standardDeviation = Math.sqrt(variance)
  const median = percentile(values, 0.5)
  const firstQuartile = percentile(values, 0.25)
  const thirdQuartile = percentile(values, 0.75)
  const interquartileRange = thirdQuartile - firstQuartile
  const coefficientOfVariation = mean === 0 ? 0 : (standardDeviation / mean) * 100
  const trend = linearTrend(values)
  const firstValue = values[0]
  const lastValue = values[values.length - 1]
  const variationPercent = firstValue === 0 ? 0 : ((lastValue - firstValue) / firstValue) * 100
  const outlierLimit = thirdQuartile + interquartileRange * 1.5
  const lowerOutlierLimit = firstQuartile - interquartileRange * 1.5
  const outliers = values.filter(value => value > outlierLimit || value < lowerOutlierLimit)

  const correlationData = useMemo(() => {
    const size = period === '7d' ? 4 : period === '30d' ? 6 : SERIES.length
    return SERIES.slice(-size)
  }, [period])

  const correlationMatrix = useMemo(() => VARIABLES.map(row => ({
    variable: row,
    values: VARIABLES.map(column => pearsonCorrelation(
      correlationData.map(item => item[row]),
      correlationData.map(item => item[column]),
    )),
  })), [correlationData])

  const scatterData = correlationData.map(item => ({
    x: item[scatterX],
    y: item[scatterY],
    z: item.evidence,
    period: item.period,
  }))

  const scatterCorrelation = pearsonCorrelation(
    correlationData.map(item => item[scatterX]),
    correlationData.map(item => item[scatterY]),
  )

  const strongestRelationship = useMemo(() => {
    const pairs = VARIABLES.flatMap((left, leftIndex) => VARIABLES
      .slice(leftIndex + 1)
      .map(right => ({
        left,
        right,
        value: pearsonCorrelation(
          correlationData.map(item => item[left]),
          correlationData.map(item => item[right]),
        ),
      })))

    return pairs.sort((a, b) => Math.abs(b.value) - Math.abs(a.value))[0]
  }, [correlationData])

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-gradient-to-r from-[#071827] via-[#0B2A40] to-[#0B7491] px-5 py-6 text-white sm:px-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-200">Laboratório analítico</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight">Exploração Estatística</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-200">Laboratório exploratório para investigar distribuição, tendência, dispersão, variabilidade e relações entre variáveis. Os resultados indicam sinais para investigação, não conclusões causais.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(['7d', '30d', '90d'] as Period[]).map(option => (
              <button key={option} type="button" onClick={() => setPeriod(option)} className={`rounded-xl px-3 py-2 text-xs font-bold transition ${period === option ? 'bg-white text-[#071827]' : 'border border-white/20 text-white hover:bg-white/10'}`}>
                {option === '7d' ? 'Curto prazo' : option === '30d' ? '30 dias' : '90 dias'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-5 p-5 sm:p-7 xl:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-[#F8FAFC] p-5 xl:col-span-2">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-bold text-slate-900">Série temporal e tendência</h3>
              <p className="mt-1 text-sm text-slate-500">Linha observada, referência esperada e média móvel configurável.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <select value={series} onChange={event => setSeries(event.target.value as SeriesKey)} className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-[#0B7491]">
                {VARIABLES.map(variable => <option key={variable} value={variable}>{VARIABLE_META[variable].label}</option>)}
              </select>
              <select value={window} onChange={event => setWindow(Number(event.target.value) as MovingAverageWindow)} className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-[#0B7491]" aria-label="Janela da média móvel">
                <option value={2}>MM 2 períodos</option>
                <option value={3}>MM 3 períodos</option>
                <option value={4}>MM 4 períodos</option>
              </select>
            </div>
          </div>
          <div className="mt-5 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={temporalData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <ReferenceLine y={mean} strokeDasharray="5 5" label="Média" />
                <Line type="monotone" dataKey={series} stroke="#0B7491" strokeWidth={3} dot={{ r: 4 }} name="Observado" />
                <Line type="monotone" dataKey="movingAverage" stroke="#0F766E" strokeWidth={2} strokeDasharray="6 4" dot={false} name="Média móvel" />
                <Line type="monotone" dataKey="expected" stroke="#64748B" strokeWidth={2} strokeDasharray="2 5" dot={false} name="Referência" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-xs font-semibold text-slate-500">Tendência</p><p className="mt-1 font-bold text-slate-900">{formatTrend(trend)}</p></div>
            <div className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-xs font-semibold text-slate-500">Variação</p><p className="mt-1 font-bold text-slate-900">{variationPercent >= 0 ? '+' : ''}{variationPercent.toFixed(1)}%</p></div>
            <div className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-xs font-semibold text-slate-500">Inclinação</p><p className="mt-1 font-bold text-slate-900">{trend.toFixed(2)} / período</p></div>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#0B7491]">Resumo estatístico</p>
          <div className="mt-5 grid grid-cols-2 gap-4">
            <div><p className="text-sm text-slate-500">Média</p><p className="text-2xl font-bold text-slate-900">{mean.toFixed(1)}</p></div>
            <div><p className="text-sm text-slate-500">Mediana</p><p className="text-2xl font-bold text-slate-900">{median.toFixed(1)}</p></div>
            <div><p className="text-sm text-slate-500">Desvio padrão</p><p className="text-xl font-bold text-slate-900">{standardDeviation.toFixed(1)}</p></div>
            <div><p className="text-sm text-slate-500">CV</p><p className="text-xl font-bold text-slate-900">{coefficientOfVariation.toFixed(1)}%</p></div>
            <div><p className="text-sm text-slate-500">Quartis</p><p className="text-sm font-bold text-slate-900">{firstQuartile.toFixed(1)} · {thirdQuartile.toFixed(1)}</p></div>
            <div><p className="text-sm text-slate-500">Outliers</p><p className="text-xl font-bold text-slate-900">{outliers.length}</p></div>
          </div>
          <div className="mt-6 rounded-xl bg-[#EEF6F8] p-4 text-sm leading-6 text-slate-600">A leitura estatística deve ser contextualizada com turma, período, instrumentos e condições pedagógicas. Variabilidade não representa, por si só, problema educacional.</div>
        </article>

        <article className="rounded-2xl border border-slate-200 p-5 xl:col-span-1">
          <h3 className="font-bold text-slate-900">Distribuição</h3>
          <p className="mt-1 text-sm text-slate-500">Concentração das observações por faixa.</p>
          <div className="mt-5 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={DISTRIBUTION} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="range" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="students" fill="#0B7491" radius={[6, 6, 0, 0]} name="Observações" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-slate-50 p-3"><p className="text-slate-500">Amplitude</p><p className="mt-1 font-bold text-slate-900">{Math.max(...values) - Math.min(...values)}</p></div>
            <div className="rounded-xl bg-slate-50 p-3"><p className="text-slate-500">IQR</p><p className="mt-1 font-bold text-slate-900">{interquartileRange.toFixed(1)}</p></div>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 p-5 xl:col-span-2">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h3 className="font-bold text-slate-900">Relação entre variáveis</h3>
              <p className="mt-1 text-sm text-slate-500">Selecione as variáveis para investigar a associação no gráfico de dispersão.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <select value={scatterX} onChange={event => setScatterX(event.target.value as SeriesKey)} className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
                {VARIABLES.map(variable => <option key={variable} value={variable}>X: {VARIABLE_META[variable].label}</option>)}
              </select>
              <select value={scatterY} onChange={event => setScatterY(event.target.value as SeriesKey)} className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
                {VARIABLES.map(variable => <option key={variable} value={variable}>Y: {VARIABLE_META[variable].label}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl bg-[#EEF6F8] px-4 py-3">
            <div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#0B7491]">Pearson exploratório</p><p className="mt-1 text-lg font-bold text-slate-900">r = {scatterCorrelation.toFixed(2)}</p></div>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-700">{correlationLabel(scatterCorrelation)}</span>
          </div>
          <div className="mt-5 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid />
                <XAxis type="number" dataKey="x" name={VARIABLE_META[scatterX].label} domain={[30, 100]} />
                <YAxis type="number" dataKey="y" name={VARIABLE_META[scatterY].label} domain={[30, 100]} />
                <ZAxis type="number" dataKey="z" range={[60, 180]} name="Evidências" />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} labelFormatter={() => ''} />
                <Scatter data={scatterData} fill="#0B7491" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-3 text-xs leading-5 text-slate-500">O coeficiente mede associação linear no conjunto exploratório. Correlação não demonstra causalidade e deve ser interpretada considerando tamanho da amostra, qualidade dos dados e variáveis de confusão.</p>
        </article>

        <article className="rounded-2xl border border-slate-200 p-5 xl:col-span-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#0B7491]">Descoberta de relações</p>
              <h3 className="mt-1 font-bold text-slate-900">Matriz de correlação</h3>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">Visão simultânea das relações lineares entre as variáveis disponíveis. A intensidade e a direção são calculadas para o período selecionado.</p>
            </div>
            {strongestRelationship && (
              <div className="rounded-xl border border-cyan-100 bg-[#F4FAFB] px-4 py-3 text-sm">
                <p className="text-xs font-semibold text-slate-500">Relação mais intensa no período</p>
                <p className="mt-1 font-bold text-slate-900">{VARIABLE_META[strongestRelationship.left].label} × {VARIABLE_META[strongestRelationship.right].label}</p>
                <p className="mt-1 text-[#0B7491]">r = {strongestRelationship.value.toFixed(2)} · {correlationLabel(strongestRelationship.value)}</p>
              </div>
            )}
          </div>

          <div className="mt-6 overflow-x-auto">
            <div className="min-w-[620px]">
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="p-3" />
                {VARIABLES.map(variable => <div key={variable} className="rounded-xl bg-slate-100 p-3 font-bold text-slate-700">{VARIABLE_META[variable].short}</div>)}
                {correlationMatrix.map(row => (
                  <div key={row.variable} className="contents">
                    <div className="flex items-center rounded-xl bg-slate-100 p-3 font-bold text-slate-700">{VARIABLE_META[row.variable].short}</div>
                    {row.values.map((value, index) => (
                      <div key={`${row.variable}-${VARIABLES[index]}`} className="rounded-xl p-3 font-bold shadow-sm" style={correlationTone(value)} title={`${VARIABLE_META[row.variable].label} × ${VARIABLE_META[VARIABLES[index]].label}: r = ${value.toFixed(3)}`}>
                        {value.toFixed(2)}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span className="font-semibold text-slate-700">Leitura:</span>
            <span>+1 associação positiva forte</span>
            <span>0 ausência de associação linear</span>
            <span>−1 associação negativa forte</span>
            <span className="ml-auto">A diagonal é sempre 1,00.</span>
          </div>
        </article>
      </div>
    </section>
  )
}
