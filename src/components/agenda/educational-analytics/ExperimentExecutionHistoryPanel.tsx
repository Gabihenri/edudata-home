'use client'

import { useEffect, useState } from 'react'

import { listExperiments, type StoredExperiment } from '@/lib/agenda/educational-analytics/experiment-history.store'

export default function ExperimentExecutionHistoryPanel() {
  const [experiments, setExperiments] = useState<StoredExperiment[]>([])

  useEffect(() => {
    setExperiments(listExperiments())
  }, [])

  return <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
    <div className="border-b border-slate-200 px-5 py-6 sm:px-7"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#0B7491]">Memória científica</p><h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">Histórico de execuções</h2><p className="mt-2 text-sm leading-6 text-slate-600">Recupere e compare os experimentos executados nesta instalação. A persistência institucional em banco de dados será a próxima evolução desta camada.</p></div>
    <div className="p-5 sm:p-7">{experiments.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">Ainda não há experimentos registrados. Execute uma regressão linear para iniciar o histórico auditável.</div> : <div className="space-y-3">{experiments.map(experiment => <article key={experiment.id} className="rounded-2xl border border-slate-200 p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="font-bold text-slate-950">{experiment.experimentType}</p><p className="mt-1 text-sm text-slate-600">{experiment.targetVariable} ← {experiment.featureVariable}</p><p className="mt-2 font-mono text-xs text-slate-500">{experiment.id}</p></div><time className="text-xs text-slate-500">{new Date(experiment.executedAt).toLocaleString('pt-BR')}</time></div><div className="mt-4 grid gap-2 text-sm sm:grid-cols-4"><div><span className="text-slate-500">MAE</span><p className="font-bold">{experiment.metrics.mae?.toFixed(3) ?? 'N/A'}</p></div><div><span className="text-slate-500">RMSE</span><p className="font-bold">{experiment.metrics.rmse?.toFixed(3) ?? 'N/A'}</p></div><div><span className="text-slate-500">R²</span><p className="font-bold">{Number.isFinite(experiment.metrics.r2) ? experiment.metrics.r2.toFixed(3) : 'N/A'}</p></div><div><span className="text-slate-500">Amostra</span><p className="font-bold">{experiment.observationCount}</p></div></div></article>)}</div>}</div>
  </section>
}
