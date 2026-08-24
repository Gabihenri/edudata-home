type SolutionStatus = {
  label: string
  className: string
}

type SchoolSolution = {
  code: string
  axis: string
  title: string
  description: string
  deliveries: string[]
  action: string
  href: string
  status: SolutionStatus
}

type InstitutionalStep = {
  code: string
  title: string
  description: string
}

const solutions:
  SchoolSolution[] = [
    {
      code: '01',
      axis: 'Evidências',
      title:
        'Diagnóstico EDI da Escola',
      description:
        'Mapeamento dos processos pedagógicos, indicadores, documentos, tecnologias e necessidades institucionais para identificar prioridades reais de desenvolvimento.',
      deliveries: [
        'Diagnóstico institucional',
        'Identificação de necessidades',
        'Prioridades de intervenção',
        'Relatório executivo',
        'Plano inicial de desenvolvimento',
      ],
      action:
        'Solicitar diagnóstico',
      href: '/contato',      status: {
        label:
          'Disponível sob consulta',
        className:
          'border-emerald-200 bg-emerald-50 text-emerald-800',
      },
    },
    {
      code: '02',
      axis: 'Desenvolvimento',
      title:
        'Desenvolvimento Profissional Docente',
      description:
        'Programas formativos para professores e equipes pedagógicas, articulando inteligência artificial, dados, planejamento, inclusão e práticas aplicáveis à realidade escolar.',
      deliveries: [
        'Formação continuada',
        'Trilhas de aprendizagem',
        'Oficinas práticas',
        'Acompanhamento profissional',
        'Certificação, quando disponível',
      ],
      action:
        'Conhecer as formações',
      href: '/academy',
      status: {
        label:
          'Formações disponíveis',
        className:
          'border-cyan-200 bg-cyan-50 text-[#075F78]',
      },
    },
    {
      code: '03',
      axis: 'Organização',
      title:
        'Planejamento e Gestão Pedagógica',
      description:
        'Estruturação dos processos de planejamento, acompanhamento, registro de ações, reuniões, intervenções, responsabilidades e evidências pedagógicas.',
      deliveries: [
        'Organização dos processos',
        'Acompanhamento de ações',
        'Registro de evidências',
        'Definição de responsabilidades',
        'Redução de retrabalho',
      ],
      action:
        'Conhecer a Agenda EDI',
      href: '/agenda',
      status: {
        label:
          'Piloto em andamento',
        className:
          'border-amber-200 bg-amber-50 text-amber-800',
      },
    },
    {
      code: '04',
      axis: 'Inteligência',
      title:
        'Indicadores e Inteligência Educacional',
      description:
        'Organização de dados, construção de indicadores e elaboração de análises para apoiar professores, coordenadores, diretores e redes de ensino.',
      deliveries: [
        'Painéis de indicadores',
        'Identificação de tendências',
        'Alertas e prioridades',
        'Relatórios executivos',
        'Apoio à tomada de decisão',
      ],
      action:
        'Conhecer a proposta',
      href: '/analytics',
      status: {
        label:
          'Em desenvolvimento',
        className:
          'border-slate-200 bg-slate-100 text-slate-700',
      },
    },
    {
      code: '05',
      axis: 'Processos',
      title:
        'Automação e Organização Institucional',
      description:
        'Análise de tarefas administrativas e pedagógicas repetitivas para reduzir controles dispersos, duplicidade de informações e perda de documentos.',
      deliveries: [
        'Mapeamento de processos',
        'Automação de fluxos',
        'Organização documental',
        'Integração de ferramentas',
        'Redução da carga operacional',
      ],
      action:
        'Solicitar análise',
      href: '/contato',      status: {
        label:
          'Disponível sob consulta',
        className:
          'border-emerald-200 bg-emerald-50 text-emerald-800',
      },
    },
    {
      code: '06',
      axis: 'Transformação',
      title:
        'Plano EDI de Transformação Escolar',
      description:
        'Programa integrado para instituições que desejam conectar diagnóstico, desenvolvimento profissional, processos, evidências, indicadores e acompanhamento.',
      deliveries: [
        'Diagnóstico inicial',
        'Objetivos estratégicos',
        'Plano de ação por etapas',
        'Indicadores de acompanhamento',
        'Relatório de evolução',
      ],
      action:
        'Agendar conversa',
      href: '/contato',      status: {
        label:
          'Disponível sob consulta',
        className:
          'border-emerald-200 bg-emerald-50 text-emerald-800',
      },
    },
  ]

const institutionalJourney:
  InstitutionalStep[] = [
    {
      code: '01',
      title: 'Diagnosticar',
      description:
        'Compreender o contexto e identificar as necessidades prioritárias.',
    },
    {
      code: '02',
      title: 'Planejar',
      description:
        'Definir objetivos, responsabilidades, etapas e indicadores.',
    },
    {
      code: '03',
      title: 'Desenvolver',
      description:
        'Formar pessoas e organizar processos educacionais.',
    },
    {
      code: '04',
      title: 'Evidenciar',
      description:
        'Registrar ações, práticas, documentos e resultados.',
    },
    {
      code: '05',
      title: 'Analisar',
      description:
        'Transformar registros em informações para acompanhamento.',
    },
    {
      code: '06',
      title: 'Evoluir',
      description:
        'Ajustar ações e fortalecer a capacidade institucional.',
    },
  ]

export default function SolucoesEscolas() {
  return (
    <section
      id="escolas"
      className="scroll-mt-24 bg-white px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24"
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.84fr)_minmax(0,1.16fr)] lg:items-start lg:gap-14">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[#075F78]">
                Soluções institucionais
              </span>

              <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                Escolas e redes de ensino
              </span>
            </div>

            <p className="mt-7 text-xs font-bold uppercase tracking-[0.22em] text-[#0B7491]">
              Para escolas
            </p>

            <h2 className="mt-4 max-w-4xl text-4xl font-bold leading-[1.08] tracking-tight text-[#071827] sm:text-5xl">
              Organização, formação e inteligência para enfrentar desafios reais da escola.
            </h2>

            <p className="mt-6 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
              A EduData IA apoia escolas e redes na organização dos
              processos pedagógicos, no desenvolvimento das equipes e na
              utilização de evidências para acompanhar ações e tomar
              decisões.
            </p>

            <p className="mt-5 max-w-3xl text-base leading-7 text-slate-500">
              A atuação pode começar por uma necessidade específica ou por
              um diagnóstico institucional mais amplo, respeitando o
              contexto, a capacidade e as prioridades de cada organização.
            </p>

            <div className="mt-8 grid gap-3 sm:flex sm:flex-wrap">
              <a
                href="/contato"
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#071827] px-7 py-4 text-center font-semibold text-white transition hover:bg-[#0B2940] focus:outline-none focus:ring-2 focus:ring-[#0B7491]"
              >
                Agendar conversa institucional
              </a>

              <a
                href="#solucoes-institucionais"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-7 py-4 text-center font-semibold text-[#071827] transition hover:border-cyan-300 hover:bg-cyan-50 focus:outline-none focus:ring-2 focus:ring-[#0B7491]"
              >
                Conhecer as soluções
              </a>
            </div>
          </div>

          <section className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-[#071827] text-white shadow-sm">
            <header className="border-b border-white/10 px-5 py-5 sm:px-7">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
                Jornada institucional EDI
              </p>

              <h3 className="mt-2 text-2xl font-bold">
                Da compreensão do contexto à evolução institucional.
              </h3>

              <p className="mt-3 text-sm leading-6 text-slate-300">
                Uma sequência estruturada para orientar o trabalho sem
                impor soluções desconectadas da realidade escolar.
              </p>
            </header>

            <div className="divide-y divide-white/10">
              {institutionalJourney.map(
                (
                  step,
                  index,
                ) => (
                  <article
                    key={step.code}
                    className={`grid grid-cols-[42px_minmax(0,1fr)] gap-4 px-5 py-4 sm:px-7 ${
                      index ===
                      institutionalJourney.length -
                        1
                        ? 'bg-cyan-300/10'
                        : ''
                    }`}
                  >
                    <span className="font-mono text-xs font-bold text-cyan-300">
                      {step.code}
                    </span>

                    <div>
                      <h4
                        className={`font-bold ${
                          index ===
                          institutionalJourney.length -
                            1
                            ? 'text-cyan-100'
                            : 'text-white'
                        }`}
                      >
                        {step.title}
                      </h4>

                      <p className="mt-1 text-sm leading-6 text-slate-300">
                        {step.description}
                      </p>
                    </div>
                  </article>
                ),
              )}
            </div>

            <footer className="border-t border-cyan-300/20 bg-black/10 px-5 py-5 sm:px-7">
              <p className="text-sm font-semibold leading-6 text-cyan-100">
                Diagnóstico → Planejamento → Desenvolvimento → Evidências → Análise → Evolução
              </p>
            </footer>
          </section>
        </div>

        <section
          id="solucoes-institucionais"
          className="scroll-mt-24 mt-14 sm:mt-16"
        >
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#0B7491]">
              Portfólio institucional
            </p>

            <h3 className="mt-4 text-3xl font-bold tracking-tight text-[#071827] sm:text-4xl">
              Soluções que podem atuar de forma independente ou integrada.
            </h3>

            <p className="mt-5 text-base leading-7 text-slate-600">
              Cada proposta possui objetivo, entregas e estágio de
              disponibilidade apresentados de forma transparente.
            </p>
          </div>

          <div className="mt-9 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {solutions.map(
              (solution) => (
                <a
                  key={solution.code}
                  href={solution.href}
                  aria-label={`${solution.action}: ${solution.title}`}
                  className="group flex min-h-[34rem] flex-col overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm transition hover:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-[#0B7491]"
                >
                  <header className="border-b border-slate-200 bg-slate-50 px-5 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className="font-mono text-xs font-bold text-[#0B7491]">
                        {solution.code}
                      </span>

                      <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                        {solution.axis}
                      </span>
                    </div>
                  </header>

                  <div className="flex flex-1 flex-col p-5 sm:p-6">
                    <span
                      className={`w-fit rounded-lg border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] ${solution.status.className}`}
                    >
                      {solution.status.label}
                    </span>

                    <h4 className="mt-5 text-2xl font-bold leading-tight text-[#071827]">
                      {solution.title}
                    </h4>

                    <p className="mt-4 text-sm leading-6 text-slate-600">
                      {solution.description}
                    </p>

                    <div className="mt-6 border-t border-slate-200 pt-5">
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0B7491]">
                        Entregas previstas
                      </p>

                      <ul className="mt-4 space-y-3">
                        {solution.deliveries.map(
                          (
                            delivery,
                            index,
                          ) => (
                            <li
                              key={delivery}
                              className="grid grid-cols-[28px_minmax(0,1fr)] gap-3 text-sm leading-6 text-slate-600"
                            >
                              <span className="font-mono text-[10px] font-bold text-[#0B7491]">
                                {String(
                                  index + 1,
                                ).padStart(
                                  2,
                                  '0',
                                )}
                              </span>

                              <span>
                                {delivery}
                              </span>
                            </li>
                          ),
                        )}
                      </ul>
                    </div>
                  </div>

                  <footer className="flex items-center justify-between gap-4 border-t border-slate-200 px-5 py-4 sm:px-6">
                    <span className="text-sm font-bold text-[#071827]">
                      {solution.action}
                    </span>

                    <span
                      aria-hidden="true"
                      className="font-bold text-[#0B7491] transition group-hover:translate-x-1"
                    >
                      →
                    </span>
                  </footer>
                </a>
              ),
            )}
          </div>
        </section>

        <section className="mt-12 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-[#EEF3F7]">
          <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B7491]">
                Necessidade específica
              </p>

              <h3 className="mt-3 text-2xl font-bold text-[#071827] sm:text-3xl">
                A escola não precisa contratar uma transformação completa para começar.
              </h3>

              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
                O primeiro trabalho pode ser um diagnóstico, uma formação,
                uma análise de processo ou a organização de uma necessidade
                pedagógica prioritária.
              </p>
            </div>

            <a
              href="/contato"              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#0B7491] px-7 py-4 text-center font-semibold text-white transition hover:bg-[#09657E] focus:outline-none focus:ring-2 focus:ring-[#071827]"
            >
              Apresentar uma necessidade
            </a>
          </div>
        </section>
      </div>
    </section>
  )
}