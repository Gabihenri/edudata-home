import Link from 'next/link'

type CopilotAction = {
  code: string
  title: string
  description: string
  input: string
  output: string
  href: string
  action: string
}

const actions: CopilotAction[] = [
  {
    code: '01',
    title: 'Planejar com contexto',
    description:
      'Use objetivos, aulas anteriores e evidências registradas para orientar o próximo planejamento.',
    input: 'Planejamentos, objetivos, aulas e evidências',
    output: 'Próximas ações pedagógicas contextualizadas',
    href: '/professor-digital/recomendacoes',
    action: 'Abrir recomendações',
  },
  {
    code: '02',
    title: 'Analisar avaliações',
    description:
      'Consulte diagnósticos e resultados antes de definir recuperação, recomposição ou novos instrumentos.',
    input: 'Avaliações, resultados e habilidades',
    output: 'Prioridades de aprendizagem para revisão humana',
    href: '/agenda/avaliacoes/resultados',
    action: 'Abrir diagnóstico',
  },
  {
    code: '03',
    title: 'Interpretar a aprendizagem',
    description:
      'Acompanhe nível atual, tendência e necessidade de intervenção sem transformar classificação em rótulo.',
    input: 'Notas, percentuais e histórico avaliativo',
    output: 'Leitura transparente da evolução',
    href: '/agenda/avaliacoes/classificacao',
    action: 'Abrir classificação',
  },
  {
    code: '04',
    title: 'Compreender o estudante',
    description:
      'Reúna aprendizagem, ocorrências e casos pedagógicos numa visão longitudinal antes de tomar decisões.',
    input: 'Notas, ocorrências e casos',
    output: 'Timeline pedagógica integrada',
    href: '/agenda/caderno',
    action: 'Abrir caderno',
  },
  {
    code: '05',
    title: 'Revisar evidências',
    description:
      'Consulte qualidade, confiabilidade, classificação EDI e revisão humana das evidências pedagógicas.',
    input: 'Evidências registradas',
    output: 'Sinais explicáveis para decisão profissional',
    href: '/agenda/evidencias/inteligencia',
    action: 'Abrir inteligência',
  },
  {
    code: '06',
    title: 'Estruturar acompanhamento',
    description:
      'Transforme uma necessidade identificada em caso pedagógico com responsáveis, ações e acompanhamento.',
    input: 'Ocorrências, avaliações e observações',
    output: 'Plano de acompanhamento estruturado',
    href: '/agenda/casos',
    action: 'Abrir casos',
  },
]

export default function PedagogicalCopilotHub() {
  return (
    <main className="min-h-screen bg-[#EEF3F7] text-slate-950">
      <section className="bg-[#071827] text-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">
            Professor Digital · EIOS
          </p>
          <h1 className="mt-3 max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl">
            Copiloto Pedagógico
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
            O Professor Digital interpreta o contexto produzido pela Agenda Inteligente EDI e organiza caminhos para planejamento, análise, intervenção e recomposição. Ele recomenda; o professor decide.
          </p>

          <div className="mt-7 flex flex-wrap gap-2 text-xs font-bold uppercase tracking-[0.12em]">
            <span className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1.5 text-cyan-200">
              Agenda registra
            </span>
            <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-slate-200">
              EIOS interpreta
            </span>
            <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-slate-200">
              Copiloto recomenda
            </span>
            <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-emerald-200">
              Professor decide
            </span>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {actions.map(item => (
            <Link
              key={item.code}
              href={item.href}
              className="group flex min-h-80 flex-col rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-300"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="font-mono text-xs font-bold text-[#0B7491]">
                  {item.code}
                </span>
                <span aria-hidden="true" className="h-2.5 w-2.5 rotate-45 border border-cyan-500 transition group-hover:bg-cyan-500" />
              </div>

              <h2 className="mt-5 text-xl font-bold text-[#071827]">
                {item.title}
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {item.description}
              </p>

              <div className="mt-5 space-y-3 border-t border-slate-200 pt-4 text-xs leading-5">
                <div>
                  <p className="font-bold uppercase tracking-[0.1em] text-slate-400">Entrada</p>
                  <p className="mt-1 text-slate-600">{item.input}</p>
                </div>
                <div>
                  <p className="font-bold uppercase tracking-[0.1em] text-slate-400">Entrega</p>
                  <p className="mt-1 text-slate-600">{item.output}</p>
                </div>
              </div>

              <span className="mt-auto pt-5 text-sm font-bold text-[#075F78] transition group-hover:translate-x-1">
                {item.action} →
              </span>
            </Link>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-[1.5rem] border border-cyan-200 bg-cyan-50 p-6">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-cyan-800">
              Papel do Professor Digital
            </p>
            <h2 className="mt-2 text-xl font-bold text-[#071827]">
              Interpretar e apoiar decisões
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              O Copiloto não substitui a Agenda e não é um diário. Ele utiliza os dados autorizados da operação pedagógica para ajudar o professor a compreender prioridades e escolher próximos passos.
            </p>
          </article>

          <article className="rounded-[1.5rem] border border-slate-200 bg-white p-6">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
              Governança
            </p>
            <h2 className="mt-2 text-xl font-bold text-[#071827]">
              Revisão humana obrigatória
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Recomendações, classificações e sinais analíticos permanecem explicáveis e revisáveis. Nenhuma intervenção, sanção ou decisão sobre o estudante é executada automaticamente.
            </p>
          </article>
        </section>
      </div>
    </main>
  )
}
