'use client'

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
  return new Intl.NumberFormat('pt-BR', {
    maximumFractionDigits: 2,
  }).format(value)
}

function getTrendLabel(trend: number): string {
  if (Math.abs(trend) < 0.35) return 'estável'
  return trend > 0 ? 'de crescimento' : 'de queda'
}

function getSignalLevel({
  trend,
  variationPercent,
  outlierCount,
}: Pick<AnalyticsInterventionSignalPanelProps, 'trend' | 'variationPercent' | 'outlierCount'>): {
  label: string
  description: string
} {
  const hasRelevantVariation = Math.abs(variationPercent) >= 15
  const hasStrongTrend = Math.abs(trend) >= 0.75

  if (hasStrongTrend || outlierCount >= 2 || hasRelevantVariation) {
    return {
      label: 'Sinal para revisão humana',
      description: 'O padrão merece interpretação pedagógica antes de qualquer encaminhamento.',
    }
  }

  return {
    label: 'Sem sinal crítico automático',
    description: 'A série permanece disponível para acompanhamento e comparação longitudinal.',
  }
}

export default function AnalyticsInterventionSignalPanel({
  variableLabel,
  observations,
  mean,
  trend,
  variationPercent,
  outlierCount,
  usingRealData,
}: AnalyticsInterventionSignalPanelProps) {
  const signal = getSignalLevel({
    trend,
    variationPercent,
    outlierCount,
  })

  return (
    <section className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#0B7491]">
            Ponte analítica → pedagógica
          </p>
          <h3 className="mt-2 text-xl font-bold text-slate-900">
            {signal.label}
          </h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            {signal.description} A EduData Analytics não cria nem executa uma intervenção por conta própria: este resultado é um insumo rastreável para a decisão do profissional responsável.
          </p>
        </div>
        <span className="rounded-full border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700">
          {usingRealData ? 'Dados do dataset atual' : 'Demonstração — não usar para decisão'}
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Variável observada</p>
          <p className="mt-2 text-sm font-bold text-slate-900">{variableLabel}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Base analítica</p>
          <p className="mt-2 text-sm font-bold text-slate-900">{observations} observações · média {formatNumber(mean)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Comportamento</p>
          <p className="mt-2 text-sm font-bold text-slate-900">Tendência {getTrendLabel(trend)} · variação {formatNumber(variationPercent)}%</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Pontos atípicos</p>
          <p className="mt-2 text-sm font-bold text-slate-900">{outlierCount} identificados</p>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white p-4">
        <p className="text-sm font-bold text-slate-900">Próxima etapa governada</p>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          Revisar o contexto, validar se o sinal tem significado pedagógico e somente então encaminhar, quando cabível, para uma intervenção longitudinal do EIOS.
        </p>
      </div>
    </section>
  )
}
