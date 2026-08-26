'use client'

import { useMemo, useState } from 'react'

import { useEducationalAnalyticsDataset } from '@/hooks/agenda/useEducationalAnalyticsDataset'
import { validateExperiment, type ExperimentGoal, type ValidationSeverity } from '@/lib/agenda/educational-analytics/experiment-validation.engine'
import { evaluateModelReadiness } from '@/lib/agenda/educational-analytics/model-readiness.engine'

const NUMERIC_TYPES = new Set(['integer', 'decimal', 'percentage', 'proportion', 'score', 'count', 'duration'])

function goalLabel(goal: ExperimentGoal) {
  if (goal === 'classification') return 'Classificação'
  if (goal === 'forecasting') return 'Previsão temporal'
  return 'Regressão'
}

function strategyLabel(strategy: string) {
  if (strategy === 'stratified_holdout') return 'Holdout estratificado'
  if (strategy === 'temporal_holdout') return 'Holdout temporal'
  return 'Holdout aleatório'
}

function findingClass(severity: ValidationSeverity) {
  if (severity === 'blocker') return 'border-rose-200 bg-rose-50 text-rose-900'
  if (severity === 'warning') return 'border-amber-200 bg-amber-50 text-amber-900'
  return 'border-sky-200 bg-sky-50 text-sky-900'
}

export default function ModelExperimentLabPanel() {
  const { data, loading, error, refresh } = useEducationalAnalyticsDataset()
  const [goal, setGoal] = useState<ExperimentGoal>('regression')
  const [target, setTarget] = useState('')
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([])

  const setup = useMemo(() => {
    if (!data) return null

    const variables = data.configuration.variableDefinitions
      .filter(variable => NUMERIC_TYPES.has(variable.valueType))
      .map(variable => ({ id: variable.id, key: variable.key, label: variable.label, valueType: variable.valueType }))

    const valuesById = new Map<string, number[]>()
    const datedObservationIds = new Set<string>()
    variables.forEach(variable => valuesById.set(variable.id, []))

    data.observations
      .filter(observation => !observation.excluded && observation.numericValue !== null)
      .forEach(observation => {
        const values = valuesById.get(observation.variableId)
        if (values && observation.numericValue !== null) values.push(observation.numericValue)
        if (observation.observedAt ?? observation.recordedAt) datedObservationIds.add(observation.id)
      })

    const readinessVariables = variables.map(variable => ({ key: variable.key, label: variable.label, valueType: variable.valueType, values: valuesById.get(variable.id) ?? [] }))
    const observationCount = readinessVariables.reduce((maximum, variable) => Math.max(maximum, variable.values.length), 0)
    const readiness = evaluateModelReadiness({ variables: readinessVariables, observationCount, datedObservationCount: datedObservationIds.size })
    const temporalCoverage = observationCount > 0 ? datedObservationIds.size / observationCount : 0

    return { variables, readiness, observationCount, temporalCoverage }
  }, [data])

  const validation = useMemo(() => {
    if (!setup) return null
    return validateExperiment({
      goal,
      observationCount: setup.observationCount,
      targetKey: target || null,
      featureKeys: selectedFeatures,
      temporalCoverage: setup.temporalCoverage,
      readinessStatus: setup.readiness.status,
    })
  }, [goal, selectedFeatures, setup, target])

  const toggleFeature = (key: string) => {
    setSelectedFeatures(current => current.includes(key) ? current.filter(item => item !== key) : [...current, key])
  }

  const validFeatureCount = selectedFeatures.filter(feature => feature !== target).length

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-[#071827] px-5 py-6 text-white sm:px-7">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300">Laboratório de experimentos</p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight">Configuração e Validação de Modelagem</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">Defina o problema analítico, a variável-alvo e os sinais candidatos. O experimento é avaliado metodologicamente antes de qualquer treinamento.</p>
      </div>

      <div className="p-5 sm:p-7">
        {loading && <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">Carregando variáveis para o laboratório de experimentos...</div>}
        {!loading && error && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5"><p className="font-bold text-rose-900">Não foi possível preparar o experimento.</p><p className="mt-1 text-sm text-rose-700">{error}</p><button type="button" onClick={() => void refresh()} className="mt-4 rounded-xl bg-rose-700 px-4 py-2 text-sm font-bold text-white">Tentar novamente</button></div>}

        {!loading && !error && setup && validation && (
          <div className="space-y-6">
            <div className="grid gap-3 md:grid-cols-3">
              {(['regression', 'classification', 'forecasting'] as ExperimentGoal[]).map(item => <button key={item} type="button" onClick={() => setGoal(item)} className={`rounded-2xl border p-4 text-left transition ${goal === item ? 'border-cyan-500 bg-cyan-50 ring-1 ring-cyan-500' : 'border-slate-200 hover:border-slate-300'}`}><p className="font-bold text-slate-950">{goalLabel(item)}</p><p className="mt-1 text-xs leading-5 text-slate-600">{item === 'regression' ? 'Estimar uma variável numérica.' : item === 'classification' ? 'Separar observações em categorias.' : 'Explorar evolução ao longo do tempo.'}</p></button>)}
            </div>

            <div className="grid gap-5 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
              <div className="rounded-2xl border border-slate-200 p-5"><h3 className="font-bold text-slate-950">Variável-alvo</h3><p className="mt-1 text-sm leading-6 text-slate-600">Qual resultado este experimento pretende analisar?</p><select value={target} onChange={event => { setTarget(event.target.value); setSelectedFeatures(current => current.filter(feature => feature !== event.target.value)) }} className="mt-4 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900"><option value="">Selecione uma variável</option>{setup.variables.map(variable => <option key={variable.key} value={variable.key}>{variable.label}</option>)}</select></div>
              <div className="rounded-2xl border border-slate-200 p-5"><div className="flex items-end justify-between gap-4"><div><h3 className="font-bold text-slate-950">Features candidatas</h3><p className="mt-1 text-sm text-slate-600">Selecione os sinais que poderão ser avaliados.</p></div><span className="text-xs font-bold text-slate-500">{validFeatureCount} selecionada(s)</span></div><div className="mt-4 grid gap-2 sm:grid-cols-2">{setup.variables.filter(variable => variable.key !== target).map(variable => { const checked = selectedFeatures.includes(variable.key); return <label key={variable.key} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 ${checked ? 'border-cyan-400 bg-cyan-50' : 'border-slate-200'}`}><input type="checkbox" checked={checked} onChange={() => toggleFeature(variable.key)} /><span className="text-sm font-medium text-slate-800">{variable.label}</span></label> })}</div></div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Plano de validação</p><h3 className="mt-1 text-lg font-bold text-slate-950">{strategyLabel(validation.strategy)}</h3><p className="mt-1 text-sm text-slate-600">Treino: {validation.trainSize} observações · Teste: {validation.testSize} observações.</p></div><span className={`rounded-full px-3 py-1 text-xs font-bold ${validation.canAdvance ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>{validation.canAdvance ? 'Apto para próxima etapa' : 'Avanço bloqueado'}</span></div>
              <div className="mt-5 grid gap-3">{validation.findings.map(finding => <div key={finding.code} className={`rounded-xl border p-4 ${findingClass(finding.severity)}`}><div className="flex items-center justify-between gap-3"><p className="font-bold">{finding.title}</p><span className="text-[10px] font-bold uppercase tracking-wider">{finding.severity === 'blocker' ? 'Bloqueador' : finding.severity === 'warning' ? 'Alerta' : 'Informação'}</span></div><p className="mt-1 text-sm leading-6 opacity-90">{finding.message}</p></div>)}</div>
              <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700"><strong className="text-slate-950">Governança:</strong> o treinamento deve permanecer indisponível enquanto houver bloqueadores. Alertas exigem interpretação responsável e revisão humana antes de qualquer uso institucional.</div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
