import type { Metadata } from 'next'

import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Professor Digital | EduData IA',
  description:
    'Copiloto pedagógico e ambiente de desenvolvimento profissional que interpreta contextos, produz recomendações explicáveis e apoia decisões docentes.',
}

const capabilities = [
  {
    code: '01',
    eyebrow: 'Interpretar',
    title: 'Copiloto Pedagógico',
    description:
      'Lê o contexto disponível e organiza prioridades, perguntas e próximos passos para apoiar a análise profissional.',
    href: '/professor-digital/copiloto',
    action: 'Abrir Copiloto',
  },
  {
    code: '02',
    eyebrow: 'Orientar',
    title: 'Recomendações',
    description:
      'Transforma evidências, avaliações e histórico pedagógico em recomendações contextualizadas e explicáveis.',
    href: '/professor-digital/recomendacoes',
    action: 'Ver recomendações',
  },
  {
    code: '03',
    eyebrow: 'Desenvolver',
    title: 'Plano de Desenvolvimento',
    description:
      'Organiza metas, competências e ações de desenvolvimento profissional a partir das necessidades e objetivos do professor.',
    href: '/professor-digital/plano',
    action: 'Abrir plano',
  },
  {
    code: '04',
    eyebrow: 'Compreender',
    title: 'Perfil Docente',
    description:
      'Consolida trajetória, interesses, indicadores e evolução profissional sem transformar dados em rótulos automáticos.',
    href: '/professor-digital/perfil',
    action: 'Consultar perfil',
  },
  {
    code: '05',
    eyebrow: 'Contextualizar',
    title: 'Contexto Institucional',
    description:
      'Considera escola, atuação e condições do trabalho para evitar orientações genéricas e descoladas da realidade.',
    href: '/professor-digital/escola',
    action: 'Revisar contexto',
  },
]

const intelligenceFlow = [
  {
    code: '01',
    title: 'A operação gera contexto',
    description:
      'Planejamentos, registros, evidências e resultados podem formar o contexto autorizado para acompanhamento pedagógico.',
  },
  {
    code: '02',
    title: 'O EIOS organiza a inteligência',
    description:
      'O Core conecta apenas os dados autorizados, preservando contexto, governança, rastreabilidade e explicabilidade.',
  },
  {
    code: '03',
    title: 'O Professor Digital interpreta',
    description:
      'O produto transforma contexto em perguntas, prioridades, recomendações e possibilidades de desenvolvimento profissional.',
  },
  {
    code: '04',
    title: 'O professor decide e age',
    description:
      'Nenhuma recomendação substitui a autonomia docente. A decisão e a intervenção permanecem sob responsabilidade humana.',
  },
]

const differences = [
  {
    agenda: 'Organiza o trabalho',
    professor: 'Interpreta o contexto do trabalho',
  },
  {
    agenda: 'Registra o que aconteceu',
    professor: 'Ajuda a compreender o que os registros indicam',
  },
  {
    agenda: 'Preserva evidências e histórico',
    professor: 'Transforma contexto em recomendações e desenvolvimento',
  },
  {
    agenda: 'Apoia a execução da rotina',
    professor: 'Apoia reflexão, decisão e evolução profissional',
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

      <h3 className="mt-4 text-xl font-bold text-[#071827]">{title}</h3>

      <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>

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

        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[minmax(0,1.08fr)_minmax(340px,0.92fr)] lg:items-center lg:gap-14 lg:px-8 lg:py-20">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-lg border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-cyan-200">
                Produto especializado
              </span>
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                Integrado ao EIOS
              </span>
            </div>

            <p className="mt-7 text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">
              Professor Digital
            </p>

            <h1 className="mt-4 max-w-4xl text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl">
              Inteligência para refletir, decidir e evoluir na prática docente.
            </h1>

            <p className="mt-6 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
              O Professor Digital é um copiloto pedagógico e ambiente de
              desenvolvimento profissional. Ele interpreta contextos,
              organiza recomendações explicáveis e apoia o professor nas suas
              decisões — sem substituir sua autonomia.
            </p>

            <div className="mt-8 grid gap-3 sm:flex sm:flex-wrap">
              <Link
                href="/professor-digital/copiloto"
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#0B7491] px-7 py-4 text-center font-semibold text-white transition hover:bg-[#09657E] focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              >
                Abrir Copiloto Pedagógico
              </Link>

              <Link
                href="#como-funciona"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-cyan-200/35 bg-cyan-200/10 px-7 py-4 text-center font-semibold text-cyan-50 transition hover:border-cyan-200/60 hover:bg-cyan-200/15 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-300/30"
              >
                Entender como funciona
              </Link>
            </div>

            <p className="mt-5 text-sm leading-6 text-slate-400">
              A Agenda Inteligente EDI organiza a operação. O Professor Digital
              transforma contexto em apoio à reflexão e ao desenvolvimento.
            </p>
          </div>

          <aside className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.04]">
            <header className="border-b border-white/10 px-5 py-5 sm:px-7">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
                Função do produto
              </p>
              <h2 className="mt-2 text-xl font-bold text-white sm:text-2xl">
                Apoiar decisões, não executar a rotina
              </h2>
            </header>

            <div className="space-y-5 px-5 py-5 sm:px-7 sm:py-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-200">
                  O que faz
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-200">
                  Interpreta contexto, apresenta recomendações, organiza
                  prioridades e acompanha o desenvolvimento profissional.
                </p>
              </div>

              <div className="border-t border-white/10 pt-5">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                  O que não faz
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Não é agenda, não é diário de classe e não substitui o
                  registro de frequência, eventos, tarefas ou evidências.
                </p>
              </div>
            </div>

            <footer className="border-t border-cyan-300/20 bg-cyan-300/10 px-5 py-4 sm:px-7">
              <p className="text-sm font-semibold leading-6 text-cyan-100">
                Interpretar → recomendar → desenvolver → decidir.
              </p>
            </footer>
          </aside>
        </div>
      </section>

      <section
        id="como-funciona"
        className="scroll-mt-24 px-4 py-14 sm:px-6 sm:py-20 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#0B7491]">
              Como o Professor Digital atua
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-[#071827] sm:text-4xl">
              Da informação à decisão pedagógica, com o professor no centro.
            </h2>
            <p className="mt-5 text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
              O produto não compete com a Agenda Inteligente EDI. Cada um ocupa
              uma função diferente dentro do mesmo ecossistema: a Agenda sustenta
              a operação; o Professor Digital utiliza o contexto disponível para
              apoiar interpretação e desenvolvimento.
            </p>
          </div>

          <div className="mt-10 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">
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
                  <h3 className="font-bold text-[#071827]">{item.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {item.description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#0B7491]">
              Recursos do produto
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-[#071827] sm:text-4xl">
              Cinco formas de apoiar o professor além da rotina operacional.
            </h2>
            <p className="mt-5 text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
              Cada recurso existe para qualificar a análise, orientar próximos
              passos e apoiar o crescimento profissional. O Professor Digital
              não replica as ferramentas de calendário, registros ou tarefas.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {capabilities.map((item) => (
              <CapabilityCard key={item.code} {...item} />
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#0B7491]">
              Funções complementares
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-[#071827] sm:text-4xl">
              Agenda Inteligente EDI e Professor Digital não são o mesmo produto.
            </h2>
            <p className="mt-5 text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
              Eles compartilham a mesma base de inteligência, mas resolvem
              necessidades diferentes. Essa separação evita duplicação de
              funcionalidades e deixa claro o papel de cada experiência.
            </p>
          </div>

          <div className="mt-10 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">
            <div className="grid border-b border-slate-200 bg-slate-50 text-sm font-bold text-[#071827] sm:grid-cols-2">
              <div className="px-5 py-4 sm:px-7">
                Agenda Inteligente EDI
              </div>
              <div className="border-t border-slate-200 px-5 py-4 text-[#0B7491] sm:border-l sm:border-t-0 sm:px-7">
                Professor Digital
              </div>
            </div>

            {differences.map((item, index) => (
              <div
                key={item.agenda}
                className={`grid text-sm leading-6 sm:grid-cols-2 ${
                  index < differences.length - 1 ? 'border-b border-slate-200' : ''
                }`}
              >
                <div className="px-5 py-4 text-slate-700 sm:px-7">
                  {item.agenda}
                </div>
                <div className="border-t border-slate-100 bg-cyan-50/50 px-5 py-4 font-medium text-[#075F78] sm:border-l sm:border-t-0 sm:px-7">
                  {item.professor}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/agenda"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-[#071827] transition hover:border-cyan-300 hover:bg-cyan-50"
            >
              Conhecer a Agenda EDI
            </Link>
            <Link
              href="/professor-digital/copiloto"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#0B7491] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#09657E]"
            >
              Acessar o Professor Digital
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-[#071827] px-4 py-14 text-white sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.72fr)] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">
              Arquitetura da plataforma
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Um produto especializado construído sobre a mesma inteligência.
            </h2>
            <p className="mt-5 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
              O Professor Digital compartilha identidade, acesso, governança e
              inteligência com o ecossistema EduData IA. Isso permite integrar
              contextos sem transformar todos os produtos em uma única interface.
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
            <div className="divide-y divide-white/10">
              <div className="px-5 py-4 font-semibold">Framework EDI</div>
              <div className="px-5 py-4 font-semibold">EIOS</div>
              <div className="px-5 py-4 font-semibold">Core compartilhado</div>
              <div className="bg-cyan-300/10 px-5 py-4 font-bold text-cyan-100">
                Professor Digital
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-white px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B7491]">
              Comece pelo apoio que precisa agora
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#071827]">
              Um copiloto para apoiar o professor, não para substituí-lo.
            </h2>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
              Explore o Professor Digital para organizar reflexões, receber
              recomendações contextualizadas e acompanhar seu desenvolvimento
              profissional.
            </p>
          </div>

          <Link
            href="/professor-digital/copiloto"
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#0B7491] px-7 py-4 text-center font-semibold text-white transition hover:bg-[#09657E]"
          >
            Abrir Professor Digital
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-[#F8FAFB]">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>Professor Digital</p>
          <p>Produto de inteligência e desenvolvimento profissional integrado ao EIOS</p>
        </div>
      </footer>
    </main>
  )
}
