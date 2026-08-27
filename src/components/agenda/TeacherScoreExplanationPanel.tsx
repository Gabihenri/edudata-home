'use client'

type ScoreDimension = {
  label: string
  score: number
  description: string
}

type TeacherScoreExplanationPanelProps = {
  overallScore: number
  dimensions: ScoreDimension[]
}

function clamp(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.min(100, Math.max(0, Math.round(value)))
}

function getImpactLabel(score: number): string {
  if (score >= 80) return 'Contribui positivamente para o resultado geral.'
  if (score >= 50) return 'Contribui parcialmente e ainda exige acompanhamento.'
  return 'É um dos fatores que mais reduzem o resultado geral.'
}

function getStatus(score: number): { label: string; className: string } {
  if (score >= 80) return { label: 'Bom desempenho', className: 'border-emerald-200 bg-emerald-50 text-emerald-800' }
  if (score >= 50) return { label: 'Atenção', className: 'border-amber-200 bg-amber-50 text-amber-800' }
  return { label: 'Prioridade', className: 'border-red-200 bg-red-50 text-red-800' }
}

function getNextStep(dimensions: ScoreDimension[]): string {
  const lowest = [...dimensions].sort((a, b) => a.score - b.score)[0]

  if (!lowest) return 'Continue acompanhando os registros do ciclo operacional.'
  if (clamp(lowest.score) >= 80) return 'Mantenha o acompanhamento do ciclo e preserve os registros atualizados.'

  return `Priorize ${lowest.label}: ${lowest.description}`
}

export function TeacherScoreExplanationPanel({ overallScore, dimensions }: TeacherScoreExplanationPanelProps) {
  const ordered = [...dimensions].sort((a, b) => a.score - b.score)
  const critical = ordered.filter(item => clamp(item.score) < 50)
  const positive = ordered.filter(item => clamp(item.score) >= 80)
  const attention = ordered.filter(item => clamp(item.score) >= 50 && clamp(item.score) < 80)
  const safeOverallScore = clamp(overallScore)

  return (
    <section aria-label="Explicação do E-Score" className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0B7491]">E-Score explicável</p>
          <h3 className="mt-2 text-xl font-bold text-[#071827] sm:text-2xl">Seu resultado não é uma caixa-preta.</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">O E-Score consolida dimensões do ciclo operacional. Ele é uma leitura do estado atual dos registros disponíveis, não uma avaliação definitiva da qualidade do professor.</p>
        </div>
        <div className="min-w-[160px] rounded-2xl border border-[#0B7491]/20 bg-cyan-50 px-5 py-4">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#075F78]">Resultado atual</p>
          <p className="mt-1 text-4xl font-bold tracking-tight text-[#071827]">{safeOverallScore}%</p>
          <p className="mt-1 text-xs leading-5 text-slate-600">Síntese do ciclo analisado</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#075F78]">1. Dados considerados</p>
          <p className="mt-3 text-sm leading-6 text-slate-700">O resultado utiliza as dimensões disponíveis do ciclo operacional, como planejamento, evidências, tarefas e organização da agenda.</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#075F78]">2. Leitura por dimensão</p>
          <p className="mt-3 text-sm leading-6 text-slate-700">Cada dimensão é analisada separadamente para evitar que um resultado positivo esconda uma pendência importante em outra área.</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#075F78]">3. Próxima ação</p>
          <p className="mt-3 text-sm leading-6 text-slate-700">A dimensão que mais precisa de atenção é destacada para ajudar você a transformar dados em uma ação prática.</p>
        </article>
      </div>

      <div className="mt-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Como o resultado está distribuído</p><h4 className="mt-1 text-lg font-bold text-[#071827]">Veja cada dimensão separadamente</h4></div>
          <p className="text-sm text-slate-500">Atualização depende dos registros e do próximo processamento.</p>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {ordered.map(item => {
            const score = clamp(item.score)
            const status = getStatus(score)
            return <article key={item.label} className="rounded-2xl border border-slate-200 bg-white p-4"><div className="flex items-start justify-between gap-3"><p className="text-sm font-bold text-slate-900">{item.label}</p><span className={`rounded-full border px-2 py-1 text-[11px] font-bold ${status.className}`}>{status.label}</span></div><p className="mt-5 text-3xl font-bold tracking-tight text-[#071827]">{score}%</p><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-cyan-600" style={{ width: `${score}%` }} /></div><p className="mt-3 text-xs leading-5 text-slate-600">{item.description}</p></article>
          })}
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-red-700">O que está reduzindo o score</p>
          {critical.length === 0 ? <p className="mt-3 text-sm leading-6 text-red-800">Nenhuma dimensão crítica foi identificada neste momento.</p> : <ul className="mt-3 space-y-3">{critical.map(item => <li key={item.label} className="rounded-xl border border-red-100 bg-white p-3"><div className="flex items-center justify-between gap-3"><span className="font-semibold text-slate-900">{item.label}</span><span className="font-bold text-red-700">{clamp(item.score)}%</span></div><p className="mt-1 text-sm leading-5 text-slate-600">{item.description} {getImpactLabel(item.score)}</p></li>)}</ul>}
        </article>
        <article className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">O que está funcionando bem</p>
          {positive.length === 0 ? <p className="mt-3 text-sm leading-6 text-emerald-800">Ainda não há uma dimensão com contribuição operacional forte.</p> : <ul className="mt-3 space-y-3">{positive.map(item => <li key={item.label} className="rounded-xl border border-emerald-100 bg-white p-3"><div className="flex items-center justify-between gap-3"><span className="font-semibold text-slate-900">{item.label}</span><span className="font-bold text-emerald-700">{clamp(item.score)}%</span></div><p className="mt-1 text-sm leading-5 text-slate-600">{item.description} {getImpactLabel(item.score)}</p></li>)}</ul>}
        </article>
      </div>

      {attention.length > 0 ? <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4"><p className="text-sm font-bold text-amber-900">Áreas que ainda exigem acompanhamento</p><p className="mt-1 text-sm leading-6 text-amber-800">{attention.map(item => `${item.label} (${clamp(item.score)}%)`).join(' · ')}</p></div> : null}

      <div className="mt-4 rounded-2xl border border-cyan-200 bg-cyan-50 p-5">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#075F78]">O que fazer agora</p>
        <p className="mt-2 text-base font-bold text-[#071827]">{getNextStep(dimensions)}</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">As mudanças não alteram o resultado manualmente: elas passam a ser refletidas quando novos registros forem processados, preservando rastreabilidade e governança.</p>
      </div>
    </section>
  )
}
