'use client'

import { useEffect, useMemo, useState } from 'react'

import { useEducationalAnalyticsDataset } from '@/hooks/agenda/useEducationalAnalyticsDataset'
import { createExperimentProvenance, type ExperimentProvenance } from '@/lib/agenda/educational-analytics/experiment-provenance.engine'
import { saveExperiment } from '@/lib/agenda/educational-analytics/experiment-history.store'
import { runLinearRegression, type RegressionRow } from '@/lib/agenda/educational-analytics/linear-regression.engine'

const NUMERIC_TYPES = new Set(['integer', 'decimal', 'percentage', 'proportion', 'score', 'count', 'duration'])

type PersistenceState = 'idle' | 'saving' | 'saved' | 'error'

export default function LinearRegressionExperimentPanel() {
  const { data, loading, error, refresh } = useEducationalAnalyticsDataset()
  const [targetKey, setTargetKey] = useState('')
  const [featureKey, setFeatureKey] = useState('')
  const [executed, setExecuted] = useState(false)
  const [provenance, setProvenance] = useState<ExperimentProvenance | null>(null)
  const [persistenceState, setPersistenceState] = useState<PersistenceState>('idle')
  const [persistenceError, setPersistenceError] = useState<string | null>(null)
  const [persistedExperimentId, setPersistedExperimentId] = useState<string | null>(null)

  const setup = useMemo(() => {
    if (!data) return null
    const variables = data.configuration.variableDefinitions.filter(variable => NUMERIC_TYPES.has(variable.valueType))
    const variableByKey = new Map(variables.map(variable => [variable.key, variable]))
    const rowsByEntity = new Map<string, Map<string, number>>()

    data.observations.filter(observation => !observation.excluded && observation.numericValue !== null).forEach(observation => {
      const variable = variables.find(item => item.id === observation.variableId)
      if (!variable || observation.numericValue === null) return
      const row = rowsByEntity.get(observation.entityId) ?? new Map<string, number>()
      row.set(variable.key, observation.numericValue)
      rowsByEntity.set(observation.entityId, row)
    })

    return { variables, variableByKey, rowsByEntity }
  }, [data])

  const rows = useMemo<RegressionRow[]>(() => {
    if (!setup || !targetKey || !featureKey || targetKey === featureKey) return []
    return [...setup.rowsByEntity.values()].flatMap(values => {
      const target = values.get(targetKey)
      const feature = values.get(featureKey)
      return Number.isFinite(target) && Number.isFinite(feature) ? [{ target: target as number, features: [feature as number] }] : []
    })
  }, [featureKey, setup, targetKey])

  const result = useMemo(() => executed ? runLinearRegression(rows) : null, [executed, rows])

  useEffect(() => {
    if (!result || !setup || !targetKey || !featureKey) return
    const target = setup.variableByKey.get(targetKey)?.label ?? targetKey
    const feature = setup.variableByKey.get(featureKey)?.label ?? featureKey
    const next = createExperimentProvenance({
      experimentType: 'Regressão linear simples',
      targetVariable: target,
      featureVariable: feature,
      observationCount: rows.length,
      trainCount: result.trainSize,
      testCount: result.testSize,
      metrics: { mae: result.metrics.mae, rmse: result.metrics.rmse, r2: result.metrics.r2 ?? Number.NaN },
    })
    saveExperiment({
      ...next,
      status: 'completed',
      equation: `ŷ = ${result.intercept.toFixed(4)} + (${result.coefficients[0].toFixed(4)} × x)`,
    })
    setProvenance(next)
    setPersistenceState('idle')
    setPersistenceError(null)
    setPersistedExperimentId(null)
  }, [executed, featureKey, result, rows.length, setup, targetKey])

  useEffect(() => {
    if (!result || !provenance || !setup || !targetKey || !featureKey || persistenceState !== 'idle') return

    const target = setup.variableByKey.get(targetKey)?.label ?? targetKey
    const feature = setup.variableByKey.get(featureKey)?.label ?? featureKey
    const controller = new AbortController()
    setPersistenceState('saving')

    void (async () => {
      try {
        const response = await fetch('/api/agenda/educational-analytics/experiments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: provenance.id,
            experimentType: 'Regressão linear simples',
            targetVariable: target,
            featureVariable: feature,
            observationCount: rows.length,
            trainCount: result.trainSize,
            testCount: result.testSize,
            fingerprint: provenance.fingerprint,
            equation: `ŷ = ${result.intercept.toFixed(4)} + (${result.coefficients[0].toFixed(4)} × x)`,
            metrics: result.metrics,
          }),
          signal: controller.signal,
        })
        const payload = await response.json() as { success?: boolean; error?: string; experiment?: { id?: string } }
        if (!response.ok || !payload.success) throw new Error(payload.error || 'Não foi possível persistir o experimento.')
        setPersistedExperimentId(payload.experiment?.id ?? provenance.id)
        setPersistenceState('saved')
      } catch (caught) {
        if (caught instanceof DOMException && caught.name === 'AbortError') return
        setPersistenceError(caught instanceof Error ? caught.message : 'Não foi possível persistir o experimento.')
        setPersistenceState('error')
      }
    })()

    return () => controller.abort()
  }, [featureKey, persistenceState, provenance, result, rows.length, setup, targetKey])

  function resetExecution() {
    setExecuted(false)
    setProvenance(null)
    setPersistenceState('idle')
    setPersistenceError(null)
    setPersistedExperimentId(null)
  }

  function retryPersistence() {
    setPersistenceError(null)
    setPersistenceState('idle')
  }

  return <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
    <div className="border-b border-slate-200 bg-[#0B7491] px-5 py-6 text-white sm:px-7"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-100">Execução controlada</p><h2 className="mt-2 text-2xl font-bold tracking-tight">Primeiro experimento: Regressão Linear</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-cyan-50">Modelo estatístico simples e explicável. Cada execução bem-sucedida gera proveniência, histórico local e persistência institucional auditável.</p></div>
    <div className="p-5 sm:p-7">
      {loading && <p className="text-sm text-slate-600">Preparando dados do experimento...</p>}
      {!loading && error && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5"><p className="font-bold text-rose-900">Não foi possível preparar a regressão.</p><button type="button" onClick={() => void refresh()} className="mt-3 rounded-xl bg-rose-700 px-4 py-2 text-sm font-bold text-white">Tentar novamente</button></div>}
      {!loading && !error && setup && <div className="space-y-5"><div className="grid gap-4 md:grid-cols-2"><label className="text-sm font-bold text-slate-800">Variável-alvo<select value={targetKey} onChange={event => { setTargetKey(event.target.value); resetExecution() }} className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 font-normal"><option value="">Selecione</option>{setup.variables.map(variable => <option key={variable.key} value={variable.key}>{variable.label}</option>)}</select></label><label className="text-sm font-bold text-slate-800">Variável explicativa<select value={featureKey} onChange={event => { setFeatureKey(event.target.value); resetExecution() }} className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 font-normal"><option value="">Selecione</option>{setup.variables.filter(variable => variable.key !== targetKey).map(variable => <option key={variable.key} value={variable.key}>{variable.label}</option>)}</select></label></div>
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5"><p className="text-sm font-bold text-slate-900">Amostra alinhada: {rows.length} observações completas</p><p className="mt-1 text-sm text-slate-600">A divisão é temporalmente neutra e usa os primeiros 80% para treino e os 20% finais para teste.</p><button type="button" disabled={rows.length < 5} onClick={() => setExecuted(true)} className="mt-4 rounded-xl bg-[#071827] px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">Executar experimento</button></div>
      {executed && !result && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">Não foi possível ajustar um modelo estável com esta combinação. Isso pode ocorrer por falta de variabilidade ou dados insuficientes.</div>}
      {result && <div className="space-y-5"><div className="grid gap-3 sm:grid-cols-3"><div className="rounded-2xl border border-slate-200 p-5"><p className="text-xs font-bold uppercase text-slate-500">MAE</p><p className="mt-2 text-2xl font-bold">{result.metrics.mae.toFixed(3)}</p></div><div className="rounded-2xl border border-slate-200 p-5"><p className="text-xs font-bold uppercase text-slate-500">RMSE</p><p className="mt-2 text-2xl font-bold">{result.metrics.rmse.toFixed(3)}</p></div><div className="rounded-2xl border border-slate-200 p-5"><p className="text-xs font-bold uppercase text-slate-500">R²</p><p className="mt-2 text-2xl font-bold">{result.metrics.r2 === null ? 'N/A' : result.metrics.r2.toFixed(3)}</p></div></div><div className="rounded-2xl border border-slate-200 p-5"><p className="font-bold text-slate-950">Equação estimada</p><p className="mt-2 font-mono text-sm text-slate-700">ŷ = {result.intercept.toFixed(4)} + ({result.coefficients[0].toFixed(4)} × x)</p><p className="mt-3 text-sm leading-6 text-slate-600">Treino: {result.trainSize} · Teste: {result.testSize}. O coeficiente descreve associação linear no conjunto analisado; não demonstra causalidade.</p></div>{provenance && <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-5 text-sm text-cyan-950"><p className="font-bold">Execução registrada</p><p className="mt-1">ID auditável: <span className="font-mono">{provenance.id}</span></p><p className="mt-1">Fingerprint: <span className="font-mono">{provenance.fingerprint}</span></p>{persistenceState === 'saving' && <p className="mt-2 text-cyan-800">Registrando também no histórico institucional...</p>}{persistenceState === 'saved' && <p className="mt-2 text-emerald-800">Persistência institucional concluída. Registro: <span className="font-mono">{persistedExperimentId}</span></p>}{persistenceState === 'error' && <div className="mt-3 rounded-xl border border-rose-200 bg-white p-3 text-rose-900"><p>O resultado foi mantido no histórico local, mas a persistência institucional falhou: {persistenceError}</p><button type="button" onClick={retryPersistence} className="mt-3 rounded-lg bg-rose-700 px-3 py-2 text-xs font-bold text-white">Tentar persistir novamente</button></div>}</div>}<div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm leading-6 text-slate-700"><strong className="text-slate-950">Revisão humana obrigatória:</strong> avalie contexto, qualidade dos dados, limites da amostra e possíveis fatores externos antes de utilizar este resultado em relatórios ou intervenções.</div></div>}</div>}
    </div>
  </section>
}
