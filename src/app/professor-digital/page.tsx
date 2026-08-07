import type {
  Metadata,
} from 'next'

import Link from 'next/link'

export const metadata: Metadata = {
  title:
    'Professor Digital | EduData IA',
  description:
    'Copiloto pedagógico e ambiente de desenvolvimento profissional docente integrado ao EIOS.',
}

const capabilities = [
  {
    code: '01',
    eyebrow: 'Interpretar',
    title: 'Copiloto Pedagógico',
    description:
      'Interpreta o contexto produzido pela Agenda e organiza prioridades, próximos passos e possibilidades de intervenção para revisão humana.',
    href: '/professor-digital/copiloto',
    action: 'Abrir Copiloto',
  },
  {
    code: '02',
    eyebrow: 'Orientar',
    title: 'Recomendações',
    description:
      'Transforma evidências, avaliações e histórico pedagógico em recomendações explicáveis, sem substituir a decisão profissional.',
    href: '/professor-digital/recomendacoes',
    action: 'Ver recomendações',
  },
  {
    code: '03',
    eyebrow: 'Desenvolver',
    title: 'Plano de Desenvolvimento',
    description:
      'Organiza metas, competências e ações de desenvolvimento profissional a partir do contexto e das necessidades do professor.',
    href: '/professor-digital/plano',
    action: 'Abrir plano',
  },
  {
    code: '04',
    eyebrow: 'Compreender',
    title: 'Perfil Docente',
    description:
      'Consolida identidade profissional, trajetória, indicadores e evolução do perfil EDI sem transformar dados em rótulos.',
    href: '/professor-digital/perfil',
    action: 'Consultar perfil',
  },
  {
    code: '05',
    eyebrow: 'Contextualizar',
    title: 'Contexto Institucional',
    description:
      'Mantém o contexto da escola e da atuação docente disponível para qualificar análises e evitar recomendações genéricas.',
    href: '/professor-digital/escola',
    action: 'Revisar contexto',
  },
]

const intelligenceFlow = [
  {
    code: '01',
    title: 'Agenda registra',
    description:
      'Planejamentos, avaliações, evidências, frequência, ocorrências e acompanhamentos são registrados na operação docente.',
  },
  {
    code: '02',
    title: 'EIOS interpreta',
    description:
      'O Core correlaciona somente os dados autorizados pela governança vigente e preserva contexto, rastreabilidade e explicabilidade.',
  },
  {
    code: '03',
    title: 'Professor Digital recomenda',
    description:
      'O Copiloto apresenta hipóteses, prioridades e caminhos pedagógicos contextualizados para análise profissional.',
  },
  {
    code: '04',
    title: 'Professor decide',
    description:
      'Toda recomendação permanece revisável. A decisão pedagógica e a intervenção continuam sob responsabilidade humana.',
  },
]

function CapabilityCard({
  code,
  eyebrow,
  title,
  description,
  href,
  action,
}: (typeof capabilities)[number]) {
  return (
    <Link
      href={href}
      className="group relative flex min-h-64 flex-col overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2"
    >
      <div
        aria-hidden="true"
        className="absolute left-0 top-0 h-full w-1 bg-[#0B7491]"
      />

      <div className="flex items-start justify-between gap-4">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B7491]">
          {eyebrow}
        </p>
        <span className="font-mono text-xs font-bold text-slate-400">
          {code}
        </span>
      </div>

      <h2 className="mt-4 text-xl font-bold text-[#071827]">
        {title}
      </h2>

      <p className="mt-3 text-sm leading-7 text-slate-600">
        {description}
      </p>

      <span className="mt-auto pt-6 text-sm font-bold text-[#075F78] transition group-hover:translate-x-1">
        {action} →
      </span>
    </Link>
  )
}

export default function ProfessorDigitalPage() {
  return (
    <main className="min-h-screen bg-[#EEF3F7] text-slate-950">
      <section className="relative overflow-hidden bg-[#071827] text-white">
        <div
          aria-hidden="true"
          className="absolute -right-24 top-8 h-72 w-72 rounded-full border border-cyan-300/10"
        />
        <div
          aria-hidden="true"
          className="absolute -right-2 top-32 h-40 w-40 rounded-full border border-cyan-300/10"
        />

        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-[0.18em]">
            <span className="text-cyan-300">EIOS</span>
            <span aria-hidden="true" className="text-slate-500">/</span>
            <span className="text-slate-300">Produto especializado</span>
          </div>

          <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.38fr)] lg:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">
                Inteligência para apoiar o trabalho docente
              </p>

              <h1 className="mt-3 max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Professor Digital
              </h1>

              <p className="mt-5 max-w-4xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
                Copiloto pedagógico que interpreta o contexto produzido pela Agenda Inteligente EDI, organiza recomendações explicáveis e apoia o desenvolvimento profissional sem substituir a autonomia do professor.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="/professor-digital/copiloto"
                  className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#0B7491] px-6 py-3 font-semibold text-white transition hover:bg-[#09657E] focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                >
                  Abrir Copiloto Pedagógico
                </Link>

                <Link
                  href="/agenda"
                  className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/20 bg-white/5 px-6 py-3 font-semibold text-white transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                >
                  Ir para Agenda EDI
                </Link>
              </div>
            </div>

            <aside className="rounded-[1.5rem] border border-cyan-300/20 bg-cyan-300/10 p-5">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-200">
                O que este produto faz
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-200">
                Interpreta, recomenda, contextualiza e acompanha desenvolvimento profissional.
              </p>

              <div className="mt-5 border-t border-white/10 pt-5">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                  O que não faz
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Não substitui o Diário, não registra frequência e não duplica as ferramentas operacionais da Agenda.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-10 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <section aria-labelledby="pd-capabilities">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#0B7491]">
            Capabilities do produto
          </p>
          <h2
            id="pd-capabilities"
            className="mt-2 text-3xl font-bold tracking-tight text-[#071827] sm:text-4xl"
          >
            Interpretar para apoiar decisões
          </h2>
          <p className="mt-3 max-w-3xl leading-7 text-slate-600">
            Cada área possui uma finalidade própria. As ferramentas operacionais continuam na Agenda; o Professor Digital utiliza esse contexto para produzir apoio pedagógico e desenvolvimento profissional.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {capabilities.map(item => (
              <CapabilityCard
                key={item.code}
                {...item}
              />
            ))}
          </div>
        </section>

        <section aria-labelledby="pd-flow">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#0B7491]">
            Fluxo EIOS
          </p>
          <h2
            id="pd-flow"
            className="mt-2 text-3xl font-bold tracking-tight text-[#071827]"
          >
            Um produto diferente da Agenda, conectado à mesma inteligência
          </h2>

          <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">
            {intelligenceFlow.map((item, index) => (
              <article
                key={item.code}
                className={`grid gap-3 px-5 py-5 sm:grid-cols-[70px_minmax(0,1fr)] sm:px-7 ${
                  index < intelligenceFlow.length - 1
                    ? 'border-b border-slate-200'
                    : ''
                }`}
              >
                <span className="font-mono text-xs font-bold text-[#0B7491]">
                  {item.code}
                </span>
                <div>
                  <h3 className="font-bold text-[#071827]">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {item.description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-[1.5rem] border border-cyan-200 bg-cyan-50 p-6">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-800">
              Equidade Inteligente
            </p>
            <h2 className="mt-2 text-xl font-bold text-[#071827]">
              Recomendações precisam de contexto
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              O Professor Digital não aplica uma orientação universal a realidades diferentes. A análise deve considerar contexto docente, institucional e as políticas autorizadas pela governança.
            </p>
          </article>

          <article className="rounded-[1.5rem] border border-slate-200 bg-white p-6">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              Revisão humana
            </p>
            <h2 className="mt-2 text-xl font-bold text-[#071827]">
              O professor permanece no centro da decisão
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Recomendações, classificações e sinais permanecem explicáveis, rastreáveis e revisáveis. Nenhuma intervenção pedagógica é executada automaticamente.
            </p>
          </article>
        </section>
      </div>
    </main>
  )
}
