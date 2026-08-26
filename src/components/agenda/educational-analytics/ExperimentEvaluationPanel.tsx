'use client'

import { useMemo } from 'react'

import { useEducationalAnalyticsDataset } from '@/hooks/agenda/useEducationalAnalyticsDataset'
import { evaluateModelReadiness } from '@/lib/agenda/educational-analytics/model-readiness.engine'

const NUMERIC_TYPES = new Set(['integer', 'decimal', 'percentage', 'proportion', 'score', 'count', 'duration'])

type EvaluationItem = {
  label: string
  description: string
  status: 'ready' | 'attention' | 'blocked'
}

function statusLabel(status: EvaluationItem['status']) {
  if (status === 'ready') return 'Atendido'
  if (status === 'attention') return 'Atenção'
  return 'Bloqueado'
}

function statusClass(status: EvaluationItem['status']) {
  if (status === 'ready') return 'border-emerald-200 bg-emerald-50 text-emerald-900'
  if (status === 'attention') return 'border-amber-200 bg-amber-50 text-amber-900'
  return 'border-rose-200 bg-rose-50 text-rose-900'
}

export default function ExperimentEvaluationPanel() {
  const { data, loading, error, refresh } = useEducationalAnalyticsDataset()

  const evaluation = useMemo(() => {
    if (!data) return null

    const variables = data.configuration.variableDefinitions.filter(variable => NUMERIC_TYPES.has(variable.valueType))
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

    const readinessVariables = variables.map(variable => ({
      key: variable.key,
      label: variable.label,
      valueType: variable.valueType,
      values: valuesById.get(variable.id) ?? [],
    }))

    const observationCount = readinessVariables.reduce((maximum, variable) => Math.max(maximum, variable.values.length), 0)
    const readiness = evaluateModelReadiness({
      variables: readinessVariables,
      observationCount,
      datedObservationCount: datedObservationIds.size,
    })

    const temporalCoverage = observationCount > 0 ? datedObservationIds.size / observationCount : 0
    const items: EvaluationItem[] = [
      {
        label: 'Volume de dados',
        description: observationCount >= 100 ? 'A amostra oferece base inicial para experimentação exploratória.' : observationCount >= 30 ? 'A amostra permite experimentação com cautela.' : 'Amplie a amostra antes de avançar para treinamento.',
        status: observationCount >= 100 ? 'ready' : observationCount >= 30 ? 'attention' : 'blocked',
      },
      {
        label: 'Qualidade e prontidão',
        description: `Score de prontidão atual: ${readiness.score}/100.`,
        status: readiness.status === 'ready' ? 'ready' : readiness.status === 'caution' ? 'attention' : 'blocked',
      },
      {
        label: 'Variabilidade analítica',
        description: variables.length >= 2 ? `${variables.length} variáveis numéricas estão disponíveis para exploração.` : 'É necessário ampliar o conjunto de variáveis antes de comparar relações.',
        status: variables.length >= 2 ? 'ready' : 'attention',
      },
      {
        label: 'Cobertura temporal',
        description: temporalCoverage >= 0.7 ? 'A dimensão temporal apresenta cobertura suficiente para análises longitudinais iniciais.' : temporalCoverage > 0 ? 'Existem dados temporais, mas a cobertura ainda é limitada.' : 'Não há cobertura temporal suficiente para experimentos de previsão.',
        status: temporalCoverage >= 0.7 ? 'ready' : temporalCoverage > 0 ? 'attention' : 'blocked',
      },
      {
        label: 'Governança e revisão humana',
        description: 'Resultados analíticos devem ser revisados no contexto pedagógico antes de orientar decisões institucionais.',
        status: 'attention',
      },
    ]

    const ready = items.filter(item => item.status === 'ready').length
    const attention = items.filter(item => item.status === 'attention').length
    const blocked = items.filter(item => item.status === 'blocked').length
    const score = Math.round((ready * 100 + attention * 55) / (items.length * 100) * 100)

    return { items, score, ready, attention, blocked, observationCount }
  }, [data])

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-6 sm:px-7">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#0B7491]">Avaliação pré-experimento</p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">Qualidade da configuração analítica</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Uma leitura consolidada das condições que precisam estar presentes antes da execução de modelos. Esta avaliação não substitui validação metodológica nem revisão humana.</p>
      </div>

      <div className="p-5 sm:p-7">
        {loading && <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">Avaliando as condições do experimento...</div>}
        {!loading && error && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5"><p className="font-bold text-rose-900">Não foi possível avaliar o experimento.</p><p className="mt-1 text-sm text-rose-700">{error}</p><button type="button" onClick={() => void refresh()} className="mt-4 rounded-xl bg-rose-700 px-4 py-2 text-sm font-bold text-white">Tentar novamente</button></div>}
        {!loading && !error && evaluation && (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-[1.1fr_1.9fr]">
              <div className="rounded-2xl bg-[#071827] p-6 text-white"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-300">Índice de preparação</p><p className="mt-3 text-5xl font-bold tracking-tight">{evaluation.score}%</p><p className="mt-3 text-sm leading-6 text-slate-300">Leitura orientativa baseada em qualidade, volume, cobertura e governança dos dados disponíveis.</p></div>
              <div className="grid grid-cols-3 gap-3"><div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5"><p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Atendidos</p><p className="mt-2 text-3xl font-bold text-emerald-950">{evaluation.ready}</p></div><div className="rounded-2xl border border-amber-200 bg-amber-50 p-5"><p className="text-xs font-bold uppercase tracking-wider text-amber-700">Atenção</p><p className="mt-2 text-3xl font-bold text-amber-950">{evaluation.attention}</p></div><div className="rounded-2xl border border-rose-200 bg-rose-50 p-5"><p className="text-xs font-bold uppercase tracking-wider text-rose-700">Bloqueios</p><p className="mt-2 text-3xl font-bold text-rose-950">{evaluation.blocked}</p></div></div>
            </div>

            <div className="space-y-3">{evaluation.items.map(item => <article key={item.label} className={`rounded-2xl border p-5 ${statusClass(item.status)}`}><div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start"><div><h3 className="font-bold">{item.label}</h3><p className="mt-1 text-sm leading-6 opacity-90">{item.description}</p></div><span className="shrink-0 rounded-full border border-current/20 bg-white/40 px-3 py-1 text-[10px] font-bold uppercase tracking-wider">{statusLabel(item.status)}</span></div></article>)}</div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm leading-6 text-slate-700"><strong className="text-slate-950">Próxima decisão:</strong> quando não houver bloqueadores críticos, o experimento poderá seguir para execução controlada. A primeira implementação deve priorizar modelos simples, métricas transparentes e resultados explicáveis.</div>
          </div>
        )}
      </div>
    </section>
  )
}
