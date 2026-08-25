'use client'

import { useMemo } from 'react'

import type { AnalyticsCorrelationResult } from '@/lib/agenda/educational-analytics/analytics.types'

type Props = {
  correlations: AnalyticsCorrelationResult[]
}

function format(value: number | null): string {
  return value === null || !Number.isFinite(value) ? '—' : value.toFixed(3)
}

function priority(result: AnalyticsCorrelationResult): 'Alta' | 'Média' | 'Baixa' {
  const magnitude = Math.abs(result.coefficient ?? 0)
  if (magnitude >= 0.7) return 'Alta'
  if (magnitude >= 0.45) return 'Média'
  return 'Baixa'
}

export default function CorrelationDiscoveryPanel({ correlations }: Props) {
  const discoveries = useMemo(
    () => correlations
      .filter(item => item.coefficient !== null && Number.isFinite(item.coefficient))
      .map(item => ({
        ...item,
        magnitude: Math.abs(item.coefficient ?? 0),
        priority: priority(item),
      }))
      .sort((a, b) => b.magnitude - a.magnitude),
    [correlations],
  )

  return (
    <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0B7491]">Descoberta automática</p>
          <h3 className="mt-1 text-xl font-bold text-[#071827]">Relações estatísticas encontradas</h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            O EIOS prioriza associações por magnitude para apoiar a investigação analítica. As relações apresentadas são hipóteses estatísticas e não evidências de causalidade.
          </p>
        </div>
        <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-sm font-semibold text-[#075F78]">
          {discoveries.length} relações disponíveis
        </span>
      </div>

      {discoveries.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm leading-6 text-slate-600">
          Ainda não existem correlações suficientes para priorização automática. À medida que novos datasets e observações forem disponibilizados, o Laboratório Analítico poderá ampliar a varredura de relações.
        </div>
      ) : (
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          {discoveries.slice(0, 9).map(item => (
            <article key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold text-[#071827]">{item.variableXId} × {item.variableYId}</p>
                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-600">Prioridade {item.priority}</span>
              </div>
              <p className="mt-4 text-2xl font-bold text-[#0B7491]">r = {format(item.coefficient)}</p>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500">
                <span>{item.method}</span>
                <span>n = {item.sampleSize}</span>
                <span>{item.strength}</span>
              </div>
              <p className="mt-4 text-xs leading-5 text-slate-500">Associação encontrada automaticamente. Requer interpretação humana e validação metodológica.</p>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
