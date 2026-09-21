'use client'

import { useState } from 'react'

type DecisionStatus = 'under_review' | 'needs_evidence' | 'forwarded' | 'archived'

type AnalyticsInterventionSignalPanelProps = {
  variableLabel: string
  observations: number
  mean: number
  trend: number
  variationPercent: number
  outlierCount: number
  usingRealData: boolean
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(value)
}

function getTrendLabel(trend: number): string {
  if (Math.abs(trend) < 0.35) return 'estável'
  return trend > 0 ? 'de crescimento' : 'de queda'
}

function getSignalLevel({ trend, variationPercent, outlierCount }: Pick<AnalyticsInterventionSignalPanelProps, 'trend' | 'variationPercent' | 'outlierCount'>) {
  const hasRelevantVariation = Math.abs(variationPercent) >= 15
  const hasStrongTrend = Math.abs(trend) >= 0.75
  if (hasStrongTrend || outlierCount >= 2 || hasRelevantVariation) return { label: 'Sinal para revisão humana', description: 'O padrão merece interpretação pedagógica antes de qualquer encaminhamento.' }
  return { label: 'Sem sinal crítico automático', description: 'A série permanece disponível para acompanhamento e comparação longitudinal.' }
}

const DECISIONS: Array<{ value: DecisionStatus; label: string; description: string }> = [
  { value: 'under_review', label: 'Manter em revisão', description: 'O sinal permanece em análise, sem ação automática.' },
  { value: 'needs_evidence', label: 'Solicitar mais evidências', description: 'São necessários dados ou evidências adicionais antes de decidir.' },
  { value: 'forwarded', label: 'Encaminhar para intervenção', description: 'O responsável reconhece o sinal e inicia o encaminhamento pedagógico.' },
  { value: 'archived', label: 'Arquivar sinal', description: 'O sinal não gera encaminhamento neste contexto e recebe encerramento justificado.' },
]

export default function AnalyticsInterventionSignalPanel(props: AnalyticsInterventionSignalPanelProps) {
  const { variableLabel, observations, mean, trend, variationPercent, outlierCount, usingRealData } = props
  const signal = getSignalLevel({ trend, variationPercent, outlierCount })
  const [decision, setDecision] = useState<DecisionStatus>('under_review')
  const [justification, setJustification] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const selectedDecision = DECISIONS.find(item => item.value === decision) ?? DECISIONS[0]
  const canDecide = usingRealData && !saving && (decision === 'under_review' || justification.trim().length >= 12)
  const signalId = `analytics:${variableLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`

  async function registerDecision() {
    if (!canDecide) return
    setSaving(true)
    setSubmitted(false)
    setError(null)

    try {
      const response = await fetch('/api/agenda/educational-analytics/decisions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signalId,
          status: decision,
          justification: justification.trim() || undefined,
          evidenceSnapshot: {
            variableLabel,
            observations,
            mean,
            trend,
            variationPercent,
            outlierCount,
            signalLabel: signal.label,
            usingRealData,
          },
        }),
      })

      const payload = await response.json() as { success?: boolean; error?: string }
      if (!response.ok || !payload.success) throw new Error(payload.error || 'Não foi possível registrar a decisão.')

      setSubmitted(true)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Não foi possível registrar a decisão.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#0B7491]">Ponte analítica → decisão humana</p><h3 className="mt-2 text-xl font-bold text-slate-900">{signal.label}</h3><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{signal.description} A EduData Analytics não cria nem executa uma intervenção por conta própria: este resultado é um insumo rastreável para decisão do profissional responsável.</p></div>
        <span className="rounded-full border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700">{usingRealData ? 'Dados do dataset atual' : 'Demonstração — não usar para decisão'}</span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Variável observada" value={variableLabel} /><Metric label="Base analítica" value={`${observations} observações · média ${formatNumber(mean)}`} /><Metric label="Comportamento" value={`Tendência ${getTrendLabel(trend)} · variação ${formatNumber(variationPercent)}%`} /><Metric label="Pontos atípicos" value={`${outlierCount} identificados`} />
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5">
        <p className="text-sm font-bold text-slate-900">Decisão humana rastreável</p>
        <p className="mt-1 text-sm leading-6 text-slate-600">Selecione o desfecho para este sinal. Encaminhamentos e arquivamentos exigem uma justificativa para impedir decisões automáticas ou sem contexto.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">{DECISIONS.map(item => <button key={item.value} type="button" onClick={() => { setDecision(item.value); setSubmitted(false); setError(null) }} disabled={!usingRealData || saving} className={`rounded-2xl border p-4 text-left transition ${decision === item.value ? 'border-[#0B7491] bg-cyan-50' : 'border-slate-200 hover:border-slate-300'} disabled:cursor-not-allowed disabled:opacity-50`}><p className="text-sm font-bold text-slate-900">{item.label}</p><p className="mt-1 text-xs leading-5 text-slate-600">{item.description}</p></button>)}</div>
        <label className="mt-4 block"><span className="text-xs font-bold uppercase tracking-wider text-slate-500">Justificativa da decisão</span><textarea value={justification} onChange={event => { setJustification(event.target.value); setSubmitted(false); setError(null) }} disabled={!usingRealData || saving} rows={4} placeholder="Registre o contexto, as evidências consideradas e o fundamento da decisão…" className="mt-2 w-full rounded-xl border border-slate-300 p-3 text-sm outline-none focus:border-[#0B7491] disabled:cursor-not-allowed disabled:bg-slate-100" /></label>
        {!usingRealData ? <p className="mt-3 text-xs font-medium text-amber-700">A decisão permanece desabilitada enquanto o painel estiver em modo demonstração.</p> : null}
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs text-slate-500">Status selecionado: <strong>{selectedDecision.label}</strong>{decision !== 'under_review' ? ' · justificativa obrigatória' : ''}</p><button type="button" onClick={registerDecision} disabled={!canDecide} className="rounded-xl bg-[#081C2E] px-4 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">{saving ? 'Registrando…' : 'Registrar decisão'}</button></div>
        {error ? <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
        {submitted ? <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">Decisão registrada com sucesso no fluxo auditável. O histórico permanece vinculado ao sinal e às evidências utilizadas nesta revisão.</div> : null}
      </div>
    </section>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p><p className="mt-2 text-sm font-bold text-slate-900">{value}</p></div>
}
