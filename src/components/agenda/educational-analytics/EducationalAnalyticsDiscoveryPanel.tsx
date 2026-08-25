'use client'

import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts'

import type { AnalyticsCorrelationResult } from '@/lib/agenda/educational-analytics/analytics.types'

type DiscoveryProps = {
  correlations: AnalyticsCorrelationResult[]
}

function strengthLabel(value: number): string {
  if (value >= 0.7) return 'forte'
  if (value >= 0.4) return 'moderada'
  if (value >= 0.2) return 'fraca'
  return 'muito fraca'
}

export default function EducationalAnalyticsDiscoveryPanel({ correlations }: DiscoveryProps) {
  const data = useMemo(
    () => correlations
      .filter(item => item.coefficient !== null && Number.isFinite(item.coefficient))
      .sort((a, b) => Math.abs(b.coefficient ?? 0) - Math.abs(a.coefficient ?? 0))
      .slice(0, 12)
      .map((item, index) => ({
        id: index + 1,
        label: `${item.variableXId} × ${item.variableYId}`,
        coefficient: Number((item.coefficient ?? 0).toFixed(3)),
        magnitude: Number(Math.abs(item.coefficient ?? 0).toFixed(3)),
        sampleSize: item.sampleSize,
        strength: item.strength,
      })),
    [correlations],
  )

  if (data.length === 0) return null

  return (
    <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0B7491]">EIOS · Descoberta</p>
          <h3 className="mt-1 text-xl font-bold text-[#071827]">Relações que merecem investigação</h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            O motor prioriza associações pela magnitude e pela base disponível. Os resultados orientam investigação pedagógica e não representam causalidade.
          </p>
        </div>
        <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <span className="font-semibold text-[#071827]">{data.length}</span> relações visualizadas
        </div>
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        <article className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50/50 p-4 sm:p-5">
          <h4 className="font-bold text-[#071827]">Mapa de magnitude e direção</h4>
          <p className="mt-1 text-sm text-slate-500">O eixo horizontal diferencia associações negativas e positivas.</p>
          <div className="mt-4 h-[330px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 12, right: 18, bottom: 18, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" dataKey="coefficient" domain={[-1, 1]} name="Coeficiente" tickLine={false} />
                <YAxis type="number" dataKey="magnitude" domain={[0, 1]} name="Magnitude" tickLine={false} />
                <ZAxis type="number" dataKey="sampleSize" range={[80, 420]} name="Amostra" />
                <Tooltip formatter={(value: number, name: string) => [name === 'Coeficiente' ? value.toFixed(3) : value, name]} />
                <Scatter data={data} name="Relações">
                  {data.map(item => (
                    <Cell key={item.id} fill={item.coefficient >= 0 ? '#0B7491' : '#B45309'} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50/50 p-4 sm:p-5">
          <h4 className="font-bold text-[#071827]">Ranking de associações</h4>
          <p className="mt-1 text-sm text-slate-500">Priorização visual para aprofundar a análise.</p>
          <div className="mt-4 h-[330px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ top: 8, right: 20, bottom: 0, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" domain={[0, 1]} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="label" width={145} tickLine={false} axisLine={false} fontSize={11} />
                <Tooltip formatter={(value: number) => [value.toFixed(3), 'Magnitude']} />
                <Bar dataKey="magnitude" radius={[0, 7, 7, 0]}>
                  {data.map(item => <Cell key={item.id} fill={item.magnitude >= 0.7 ? '#075F78' : '#0B7491'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {data.slice(0, 3).map(item => (
          <article key={item.id} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#0B7491]">Prioridade de investigação</p>
            <p className="mt-2 font-semibold text-[#071827]">{item.label}</p>
            <p className="mt-2 text-sm text-slate-600">
              Associação {item.coefficient >= 0 ? 'positiva' : 'negativa'} {strengthLabel(item.magnitude)} (r = {item.coefficient.toFixed(2)}), com {item.sampleSize} observações.
            </p>
          </article>
        ))}
      </div>
    </section>
  )
}
