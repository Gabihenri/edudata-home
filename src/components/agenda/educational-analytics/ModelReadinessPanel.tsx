'use client'

import { useMemo } from 'react'

import { useEducationalAnalyticsDataset } from '@/hooks/agenda/useEducationalAnalyticsDataset'
import {
  evaluateModelReadiness,
  type ModelReadinessStatus,
} from '@/lib/agenda/educational-analytics/model-readiness.engine'

const NUMERIC_TYPES = new Set([
  'integer',
  'decimal',
  'percentage',
  'proportion',
  'score',
  'count',
  'duration',
])

function formatPercent(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatStatus(status: ModelReadinessStatus) {
  if (status === 'ready') return 'Pronto para exploração'
  if (status === 'caution') return 'Avançar com cautela'
  return 'Ainda não pronto'
}

function statusClasses(status: ModelReadinessStatus) {
  if (status === 'ready') return 'border-emerald-200 bg-emerald-50 text-emerald-800'
  if (status === 'caution') return 'border-amber-200 bg-amber-50 text-amber-800'
  return 'border-rose-200 bg-rose-50 text-rose-800'
}

function priorityClasses(priority: 'high' | 'medium' | 'low') {
  if (priority === 'high') return 'border-rose-200 bg-rose-50 text-rose-800'
  if (priority === 'medium') return 'border-amber-200 bg-amber-50 text-amber-800'
  return 'border-sky-200 bg-sky-50 text-sky-800'
}

function priorityLabel(priority: 'high' | 'medium' | 'low') {
  if (priority === 'high') return 'Alta prioridade'
  if (priority === 'medium') return 'Prioridade média'
  return 'Baixa prioridade'
}

export default function ModelReadinessPanel() {
  const { data, loading, error, refresh } = useEducationalAnalyticsDataset()

  const readiness = useMemo(() => {
    if (!data) return null

    const numericVariables = data.configuration.variableDefinitions
      .filter(variable => NUMERIC_TYPES.has(variable.valueType))

    const valuesByVariable = new Map<string, number[]>()
    const datedObservationIds = new Set<string>()

    numericVariables.forEach(variable => {
      valuesByVariable.set(variable.id, [])
    })

    data.observations
      .filter(observation => !observation.excluded && observation.numericValue !== null)
      .forEach(observation => {
        const values = valuesByVariable.get(observation.variableId)
        if (!values || observation.numericValue === null) return
        values.push(observation.numericValue)
        if (observation.observedAt ?? observation.recordedAt) {
          datedObservationIds.add(observation.id)
        }
      })

    const variables = numericVariables.map(variable => ({
      key: variable.key,
      label: variable.label,
      valueType: variable.valueType,
      values: valuesByVariable.get(variable.id) ?? [],
    }))

    const observationCount = variables.reduce(
      (maximum, variable) => Math.max(maximum, variable.values.length),
      0,
    )

    return evaluateModelReadiness({
      variables,
      observationCount,
      datedObservationCount: datedObservationIds.size,
    })
  }, [data])

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-slate-950 px-5 py-6 text-white sm:px-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300">Laboratório de modelagem</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight">Prontidão para Modelagem</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">Avaliação preparatória da qualidade da amostra, completude, variabilidade e estrutura temporal antes de qualquer experimento preditivo. Este painel não treina modelos nem produz decisões automáticas.</p>
          </div>
          {readiness && (
            <div className={`rounded-2xl border px-4 py-3 ${statusClasses(readiness.status)}`}>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] opacity-75">Score de prontidão</p>
              <div className="mt-1 flex items-end gap-2"><strong className="text-3xl leading-none">{readiness.score}</strong><span className="pb-0.5 text-xs font-bold">/100</span></div>
              <p className="mt-2 text-xs font-semibold">{formatStatus(readiness.status)}</p>
            </div>
          )}
        </div>
      </div>

      <div className="p-5 sm:p-7">
        {loading && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-8 text-sm text-slate-600">Carregando o Dataset Analítico Educacional para avaliação de prontidão...</div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5">
            <p className="font-bold text-rose-900">Não foi possível avaliar a prontidão para modelagem.</p>
            <p className="mt-1 text-sm text-rose-700">{error}</p>
            <button type="button" onClick={() => void refresh()} className="mt-4 rounded-xl bg-rose-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-rose-800">Tentar novamente</button>
          </div>
        )}

        {!loading && !error && !readiness && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-8">
            <p className="font-bold text-slate-900">Aguardando dados analíticos.</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">Quando o Dataset Analítico Educacional possuir observações e variáveis numéricas disponíveis, a plataforma poderá avaliar as condições de exploração para modelagem.</p>
          </div>
        )}

        {!loading && !error && readiness && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm leading-6 text-slate-700">{readiness.summary}</p>
              <p className="mt-3 text-xs leading-5 text-slate-500">A completude é estimada a partir da maior série numérica disponível no recorte atual. Antes de treinar modelos, a estrutura analítica deve ser revisada quanto à unidade de análise, alinhamento temporal, população e possíveis vieses.</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <div className="rounded-2xl border border-slate-200 p-4"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Amostra de referência</p><p className="mt-2 text-2xl font-bold text-slate-950">{readiness.sampleSize}</p></div>
              <div className="rounded-2xl border border-slate-200 p-4"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Variáveis utilizáveis</p><p className="mt-2 text-2xl font-bold text-slate-950">{readiness.usableVariableCount}</p></div>
              <div className="rounded-2xl border border-slate-200 p-4"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Features candidatas</p><p className="mt-2 text-2xl font-bold text-slate-950">{readiness.candidateFeatureCount}</p></div>
              <div className="rounded-2xl border border-slate-200 p-4"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Alvos candidatos</p><p className="mt-2 text-2xl font-bold text-slate-950">{readiness.candidateTargetCount}</p></div>
              <div className="rounded-2xl border border-slate-200 p-4"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Completude média</p><p className="mt-2 text-2xl font-bold text-slate-950">{formatPercent(readiness.averageCompleteness)}</p><p className="mt-1 text-xs text-slate-500">Temporal: {readiness.temporalCoverage === 'available' ? 'disponível' : readiness.temporalCoverage === 'partial' ? 'parcial' : 'indisponível'}</p></div>
            </div>

            <div>
              <div className="mb-3 flex items-end justify-between gap-4"><div><h3 className="text-lg font-bold text-slate-950">Recomendações metodológicas</h3><p className="mt-1 text-sm text-slate-600">Ações sugeridas antes de avançar para experimentos supervisionados ou previsões.</p></div></div>
              {readiness.recommendations.length ? (
                <div className="grid gap-3 lg:grid-cols-2">
                  {readiness.recommendations.map(recommendation => (
                    <article key={`${recommendation.priority}-${recommendation.title}`} className="rounded-2xl border border-slate-200 p-4">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] ${priorityClasses(recommendation.priority)}`}>{priorityLabel(recommendation.priority)}</span>
                      <h4 className="mt-3 font-bold text-slate-950">{recommendation.title}</h4>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{recommendation.description}</p>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">Nenhuma recomendação crítica foi identificada neste recorte. Isso não substitui a validação metodológica, a definição do problema e a avaliação humana do contexto.</div>
              )}
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <div className="border-b border-slate-200 bg-slate-50 px-5 py-4"><h3 className="font-bold text-slate-950">Diagnóstico das variáveis</h3><p className="mt-1 text-sm text-slate-600">Disponibilidade e qualidade de cada sinal para exploração de modelagem.</p></div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-white text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500"><tr><th className="px-5 py-3">Variável</th><th className="px-5 py-3">Válidos</th><th className="px-5 py-3">Completude</th><th className="px-5 py-3">Distintos</th><th className="px-5 py-3">Feature</th><th className="px-5 py-3">Alvo</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {readiness.profiles.map(profile => (
                      <tr key={profile.key} className="align-top">
                        <td className="px-5 py-4"><p className="font-semibold text-slate-950">{profile.label}</p>{profile.reasons.length > 0 && <p className="mt-1 max-w-md text-xs leading-5 text-slate-500">{profile.reasons[0]}</p>}</td>
                        <td className="px-5 py-4 text-slate-700">{profile.validCount}</td>
                        <td className="px-5 py-4 text-slate-700">{formatPercent(profile.completeness)}</td>
                        <td className="px-5 py-4 text-slate-700">{profile.distinctCount}</td>
                        <td className="px-5 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${profile.usableAsFeature ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>{profile.usableAsFeature ? 'Elegível' : 'Revisar'}</span></td>
                        <td className="px-5 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${profile.usableAsTarget ? 'bg-cyan-100 text-cyan-800' : 'bg-slate-100 text-slate-600'}`}>{profile.usableAsTarget ? 'Candidato' : 'Indisponível'}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-2xl border border-cyan-100 bg-cyan-50 p-5 text-sm leading-6 text-slate-700">
              <strong className="text-slate-950">Governança analítica:</strong> correlações e sinais estatísticos não demonstram causalidade. Um futuro modelo deve passar por definição explícita do objetivo, validação de dados, prevenção de vazamento, avaliação de desempenho, análise de vieses e revisão humana antes de qualquer uso institucional.
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
