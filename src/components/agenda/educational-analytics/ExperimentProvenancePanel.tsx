'use client'

import { useMemo } from 'react'

import { useEducationalAnalyticsDataset } from '@/hooks/agenda/useEducationalAnalyticsDataset'
import { createExperimentProvenance } from '@/lib/agenda/educational-analytics/experiment-provenance.engine'

type Props = {
  experimentType?: string
  targetVariable?: string
  featureVariable?: string
  observationCount?: number
  trainCount?: number
  testCount?: number
  metrics?: Record<string, number>
}

export default function ExperimentProvenancePanel({
  experimentType = 'Regressão linear',
  targetVariable = 'Não definido',
  featureVariable = 'Não definida',
  observationCount = 0,
  trainCount = 0,
  testCount = 0,
  metrics = {},
}: Props) {
  const { data } = useEducationalAnalyticsDataset()

  const provenance = useMemo(() => createExperimentProvenance({
    experimentType,
    targetVariable,
    featureVariable,
    observationCount,
    trainCount,
    testCount,
    metrics,
  }), [experimentType, featureVariable, metrics, observationCount, targetVariable, testCount, trainCount])

  const datasetVersion = data?.metadata?.generatedAt ?? 'Dataset atual'

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#0B7491]">Rastreabilidade do experimento</p>
      <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">Proveniência e reprodutibilidade</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">Cada execução deve poder ser identificada, revisada e comparada. Este registro descreve a configuração analítica; ele não substitui a persistência institucional de resultados.</p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Identificador</p><p className="mt-2 break-all font-mono text-sm font-bold text-slate-900">{provenance.id}</p></div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Versão</p><p className="mt-2 text-lg font-bold text-slate-900">{provenance.version}</p></div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Dataset</p><p className="mt-2 text-sm font-bold text-slate-900">{datasetVersion}</p></div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Fingerprint</p><p className="mt-2 font-mono text-sm font-bold text-slate-900">{provenance.fingerprint}</p></div>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 p-5"><p className="font-bold text-slate-950">Registro de execução</p><ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">{provenance.reproducibility.map(item => <li key={item} className="flex gap-2"><span aria-hidden="true">•</span><span>{item}</span></li>)}</ul></div>
      <p className="mt-4 text-xs leading-5 text-slate-500">Governança: resultados devem ser interpretados por pessoas responsáveis, no contexto pedagógico e institucional. O registro técnico não autoriza decisões automatizadas sobre estudantes.</p>
    </section>
  )
}
