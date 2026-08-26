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

export function TeacherScoreExplanationPanel({
  overallScore,
  dimensions,
}: TeacherScoreExplanationPanelProps) {
  const ordered = [...dimensions].sort((a, b) => a.score - b.score)
  const critical = ordered.filter(item => clamp(item.score) < 50)
  const positive = ordered.filter(item => clamp(item.score) >= 80)

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0B7491]">
            E-Score explicável
          </p>
          <h3 className="mt-2 text-xl font-bold text-[#071827]">
            Entenda como seu resultado foi formado
          </h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            O score geral consolida diferentes dimensões do ciclo operacional. Um resultado elevado em uma dimensão não elimina automaticamente as pendências das demais.
          </p>
        </div>
        <div className="rounded-2xl border border-[#0B7491]/20 bg-cyan-50 px-5 py-4">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#075F78]">Resultado atual</p>
          <p className="mt-1 text-3xl font-bold tracking-tight text-[#071827]">{clamp(overallScore)}%</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-red-700">O que está reduzindo o score</p>
          {critical.length === 0 ? (
            <p className="mt-3 text-sm leading-6 text-red-800">Nenhuma dimensão crítica foi identificada neste momento.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {critical.map(item => (
                <li key={item.label} className="rounded-xl border border-red-100 bg-white p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-slate-900">{item.label}</span>
                    <span className="font-bold text-red-700">{clamp(item.score)}%</span>
                  </div>
                  <p className="mt-1 text-sm leading-5 text-slate-600">{item.description} {getImpactLabel(item.score)}</p>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">O que está funcionando bem</p>
          {positive.length === 0 ? (
            <p className="mt-3 text-sm leading-6 text-emerald-800">Ainda não há uma dimensão com contribuição operacional forte.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {positive.map(item => (
                <li key={item.label} className="rounded-xl border border-emerald-100 bg-white p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-slate-900">{item.label}</span>
                    <span className="font-bold text-emerald-700">{clamp(item.score)}%</span>
                  </div>
                  <p className="mt-1 text-sm leading-5 text-slate-600">{item.description} {getImpactLabel(item.score)}</p>
                </li>
              ))}
            </ul>
          )}
        </article>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-bold text-[#071827]">Próximo passo recomendado</p>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          Priorize as dimensões com menor resultado, verifique os registros e pendências relacionados e atualize o ciclo operacional. As mudanças devem refletir no próximo processamento do snapshot, mantendo rastreabilidade e governança.
        </p>
      </div>
    </section>
  )
}
