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

const SCATTER = [
  { x: 42, y: 39, z: 7 }, { x: 48, y: 45, z: 8 }, { x: 53, y: 49, z: 9 },
  { x: 58, y: 60, z: 10 }, { x: 63, y: 57, z: 8 }, { x: 68, y: 70, z: 12 },
  { x: 72, y: 74, z: 11 }, { x: 77, y: 73, z: 9 }, { x: 81, y: 86, z: 13 },
  { x: 88, y: 91, z: 10 }, { x: 93, y: 89, z: 8 },
]

function movingAverage(values: number[], window = 3) {
  return values.map((value, index) => {
    const start = Math.max(0, index - window + 1)
    const slice = values.slice(start, index + 1)
    return Number((slice.reduce((sum, item) => sum + item, 0) / slice.length).toFixed(1))
  })
}

export default function StatisticalExplorationPanel() {
  const [period, setPeriod] = useState<Period>('90d')
  const [series, setSeries] = useState<'score' | 'engagement' | 'evidence'>('score')

  const temporalData = useMemo(() => {
    const size = period === '7d' ? 4 : period === '30d' ? 6 : SERIES.length
    const data = SERIES.slice(-size)
    const average = movingAverage(data.map(item => item[series]))

    return data.map((item, index) => ({ ...item, movingAverage: average[index] }))
  }, [period, series])

  const values = temporalData.map(item => item[series])
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length
  const standardDeviation = Math.sqrt(variance)

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-gradient-to-r from-[#071827] via-[#0B2A40] to-[#0B7491] px-5 py-6 text-white sm:px-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-200">Laboratório analítico</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight">Exploração Estatística</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-200">Visualizações exploratórias para investigar distribuição, evolução temporal e relações entre variáveis. Os resultados indicam sinais para investigação, não conclusões causais.</p>
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
              <p className="mt-1 text-sm text-slate-500">Linha observada, referência esperada e média móvel.</p>
            </div>
            <select value={series} onChange={event => setSeries(event.target.value as typeof series)} className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-[#0B7491]">
              <option value="score">Score educacional</option>
              <option value="engagement">Engajamento</option>
              <option value="evidence">Evidências</option>
            </select>
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
        </article>

        <article className="rounded-2xl border border-slate-200 p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#0B7491]">Resumo estatístico</p>
          <div className="mt-5 space-y-4">
            <div><p className="text-sm text-slate-500">Média</p><p className="text-3xl font-bold text-slate-900">{mean.toFixed(1)}</p></div>
            <div><p className="text-sm text-slate-500">Desvio padrão</p><p className="text-2xl font-bold text-slate-900">{standardDeviation.toFixed(1)}</p></div>
            <div><p className="text-sm text-slate-500">Variação observada</p><p className="text-2xl font-bold text-slate-900">{Math.min(...values)}–{Math.max(...values)}</p></div>
          </div>
          <div className="mt-6 rounded-xl bg-[#EEF6F8] p-4 text-sm leading-6 text-slate-600">A leitura estatística deve ser contextualizada com turma, período, instrumentos e condições pedagógicas.</div>
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
        </article>

        <article className="rounded-2xl border border-slate-200 p-5 xl:col-span-2">
          <h3 className="font-bold text-slate-900">Relação entre variáveis</h3>
          <p className="mt-1 text-sm text-slate-500">Exemplo de dispersão para investigar associação entre participação e desempenho.</p>
          <div className="mt-5 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid />
                <XAxis type="number" dataKey="x" name="Participação" domain={[30, 100]} />
                <YAxis type="number" dataKey="y" name="Desempenho" domain={[30, 100]} />
                <ZAxis type="number" dataKey="z" range={[60, 180]} name="Volume" />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Scatter data={SCATTER} fill="#0B7491" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </article>
      </div>
    </section>
  )
}
