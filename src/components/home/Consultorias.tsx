type ConsultingArea = {
  code: string
  axis: string
  title: string
  description: string
  applications: string[]
}

type ConsultingStep = {
  code: string
  title: string
  description: string
}

const consultingAreas:
  ConsultingArea[] = [
    {
      code: 'C01',
      axis: 'Gestão',
      title: 'Gestão educacional',
      description:
        'Apoio à organização de processos pedagógicos, responsabilidades, prioridades, documentos e rotinas institucionais.',
      applications: [
        'Planejamento estratégico',
        'Organização de processos',
        'Acompanhamento pedagógico',
      ],
    },
    {
      code: 'C02',
      axis: 'Evidências',
      title: 'Dados e indicadores',
      description:
        'Análise de bases educacionais e construção de informações úteis para acompanhamento e tomada de decisão.',
      applications: [
        'Diagnósticos',
        'Indicadores educacionais',
        'Relatórios executivos',
      ],
    },
    {
      code: 'C03',
      axis: 'Inteligência',
      title: 'Dashboards e Business Intelligence',
      description:
        'Desenvolvimento de painéis para comunicar resultados, tendências, prioridades e pontos de atenção.',
      applications: [
        'Dashboards',
        'Painéis gerenciais',
        'Visualização de dados',
      ],
    },
    {
      code: 'C04',
      axis: 'Tecnologia',
      title: 'Inteligência artificial para educação',
      description:
        'Aplicação responsável da inteligência artificial em atividades docentes, pedagógicas e institucionais.',
      applications: [
        'Planejamento',
        'Produção de materiais',
        'Automação de tarefas',
      ],
    },
    {
      code: 'C05',
      axis: 'Desenvolvimento',
      title: 'Formação continuada',
      description:
        'Formações práticas para professores, gestores e equipes sobre tecnologia, dados e aplicação do Framework EDI.',
      applications: [
        'Cursos e oficinas',
        'Trilhas formativas',
        'Acompanhamento profissional',
      ],
    },
    {
      code: 'C06',
      axis: 'Inclusão',
      title: 'Acessibilidade e tecnologia assistiva',
      description:
        'Análise e desenvolvimento de recursos que ampliem acesso, participação e autonomia no contexto educacional.',
      applications: [
        'Acessibilidade digital',
        'Adaptação de recursos',
        'Tecnologias assistivas',
      ],
    },
    {
      code: 'C07',
      axis: 'Inovação',
      title: 'Projetos Maker e STEM',
      description:
        'Planejamento de experiências com robótica, programação, sensores e laboratórios aplicados à educação.',
      applications: [
        'Arduino e Raspberry Pi',
        'Robótica educacional',
        'Laboratórios de ciências',
      ],
    },
    {
      code: 'C08',
      axis: 'Processos',
      title: 'Automação e soluções personalizadas',
      description:
        'Desenvolvimento de fluxos, ferramentas e integrações para necessidades específicas de instituições educacionais.',
      applications: [
        'Automação de processos',
        'Integração de ferramentas',
        'Soluções sob medida',
      ],
    },
  ]

const consultingJourney:
  ConsultingStep[] = [
    {
      code: '01',
      title: 'Compreender',
      description:
        'Identificar o problema, o contexto e as pessoas envolvidas.',
    },
    {
      code: '02',
      title: 'Diagnosticar',
      description:
        'Analisar processos, registros, dados e recursos existentes.',
    },
    {
      code: '03',
      title: 'Propor',
      description:
        'Definir uma solução viável, etapas, entregas e responsabilidades.',
    },
    {
      code: '04',
      title: 'Implementar',
      description:
        'Apoiar a execução, a formação das equipes e os ajustes necessários.',
    },
    {
      code: '05',
      title: 'Acompanhar',
      description:
        'Verificar evidências, resultados e oportunidades de evolução.',
    },
  ]

const CONSULTING_CONTACT_HREF = '/contato'

export default function Consultorias() {
  return (
    <section
      id="consultorias"
      className="scroll-mt-24 bg-white px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24"
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(340px,1.1fr)] lg:items-start lg:gap-14">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[#075F78]">
                Apoio especializado
              </span>

              <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                Pessoas e instituições
              </span>
            </div>

            <p className="mt-7 text-xs font-bold uppercase tracking-[0.22em] text-[#0B7491]">
              Consultorias EduData IA
            </p>

            <h2 className="mt-4 max-w-4xl text-4xl font-bold leading-[1.08] tracking-tight text-[#071827] sm:text-5xl">
              Conhecimento técnico aplicado a desafios reais da educação.
            </h2>

            <p className="mt-6 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
              As consultorias conectam experiência educacional, dados,
              tecnologia e desenvolvimento profissional para apoiar
              necessidades específicas de professores, escolas e redes de
              ensino.
            </p>

            <p className="mt-5 max-w-3xl text-base leading-7 text-slate-500">
              O trabalho começa pela compreensão do contexto. A solução é
              definida somente depois da análise dos processos, recursos,
              limitações e objetivos da organização.
            </p>

            <div className="mt-8 grid gap-3 sm:flex sm:flex-wrap">
              <a
                href={CONSULTING_CONTACT_HREF}
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#071827] px-7 py-4 text-center font-semibold text-white transition hover:bg-[#0B2940] focus:outline-none focus:ring-2 focus:ring-[#0B7491]"
              >
                Solicitar conversa inicial
              </a>

              <a
                href="#areas-consultoria"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-7 py-4 text-center font-semibold text-[#071827] transition hover:border-cyan-300 hover:bg-cyan-50 focus:outline-none focus:ring-2 focus:ring-[#0B7491]"
              >
                Conhecer áreas de atuação
              </a>
            </div>

            <section className="mt-10 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-[#EEF3F7]">
              <header className="border-b border-slate-200 bg-white px-5 py-5 sm:px-7">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B7491]">
                  Formatos de atuação
                </p>
              </header>

              <div className="grid sm:grid-cols-3">
                <article className="border-b border-slate-200 px-5 py-5 sm:border-b-0 sm:border-r sm:px-6">
                  <span className="font-mono text-xs font-bold text-[#0B7491]">
                    01
                  </span>

                  <h3 className="mt-3 font-bold text-[#071827]">
                    Diagnóstico
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Análise de uma situação, processo ou necessidade.
                  </p>
                </article>

                <article className="border-b border-slate-200 px-5 py-5 sm:border-b-0 sm:border-r sm:px-6">
                  <span className="font-mono text-xs font-bold text-[#0B7491]">
                    02
                  </span>

                  <h3 className="mt-3 font-bold text-[#071827]">
                    Projeto
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Desenvolvimento de uma solução com entregas definidas.
                  </p>
                </article>

                <article className="px-5 py-5 sm:px-6">
                  <span className="font-mono text-xs font-bold text-[#0B7491]">
                    03
                  </span>

                  <h3 className="mt-3 font-bold text-[#071827]">
                    Acompanhamento
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Apoio continuado à implementação e à evolução.
                  </p>
                </article>
              </div>
            </section>
          </div>

          <section className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-[#071827] text-white shadow-sm">
            <header className="border-b border-white/10 px-5 py-5 sm:px-7">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
                Método de trabalho
              </p>

              <h3 className="mt-2 text-2xl font-bold">
                Da necessidade à solução aplicada.
              </h3>

              <p className="mt-3 text-sm leading-6 text-slate-300">
                Cada trabalho segue uma sequência que protege o contexto e
                evita respostas genéricas ou desconectadas da realidade.
              </p>
            </header>

            <div className="divide-y divide-white/10">
              {consultingJourney.map(
                (
                  step,
                  index,
                ) => (
                  <article
                    key={step.code}
                    className={`grid grid-cols-[42px_minmax(0,1fr)] gap-4 px-5 py-4 sm:px-7 sm:py-5 ${
                      index ===
                      consultingJourney.length -
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
                          consultingJourney.length -
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
                Compreender → Diagnosticar → Propor → Implementar → Acompanhar
              </p>
            </footer>
          </section>
        </div>

        <section
          id="areas-consultoria"
          className="mt-14 scroll-mt-24 sm:mt-16"
        >
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#0B7491]">
              Áreas de atuação
            </p>

            <h3 className="mt-4 text-3xl font-bold tracking-tight text-[#071827] sm:text-4xl">
              Especialidades que podem atuar isoladamente ou de forma integrada.
            </h3>

            <p className="mt-5 text-base leading-7 text-slate-600">
              O escopo é definido conforme a necessidade apresentada e não
              exige a contratação de todo o ecossistema.
            </p>
          </div>

          <div className="mt-9 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {consultingAreas.map(
              (area) => (
                <article
                  key={area.code}
                  className="flex min-h-[25rem] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
                  <header className="flex items-center justify-between gap-4 border-b border-slate-200 bg-slate-50 px-5 py-4">
                    <span className="font-mono text-xs font-bold text-[#0B7491]">
                      {area.code}
                    </span>

                    <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                      {area.axis}
                    </span>
                  </header>

                  <div className="flex flex-1 flex-col p-5">
                    <h4 className="text-xl font-bold leading-tight text-[#071827]">
                      {area.title}
                    </h4>

                    <p className="mt-4 text-sm leading-6 text-slate-600">
                      {area.description}
                    </p>

                    <div className="mt-6 border-t border-slate-200 pt-5">
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0B7491]">
                        Aplicações
                      </p>

                      <ul className="mt-4 space-y-3">
                        {area.applications.map(
                          (
                            application,
                            index,
                          ) => (
                            <li
                              key={application}
                              className="grid grid-cols-[26px_minmax(0,1fr)] gap-2 text-sm leading-6 text-slate-600"
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
                                {application}
                              </span>
                            </li>
                          ),
                        )}
                      </ul>
                    </div>
                  </div>
                </article>
              ),
            )}
          </div>
        </section>

        <section className="mt-12 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-[#EEF3F7]">
          <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B7491]">
                Primeiro contato
              </p>

              <h3 className="mt-3 text-2xl font-bold text-[#071827] sm:text-3xl">
                Apresente o desafio antes de escolher a solução.
              </h3>

              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
                A conversa inicial serve para compreender a necessidade e
                verificar qual formato de trabalho é mais adequado.
              </p>
            </div>

            <a
              href={CONSULTING_CONTACT_HREF}
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#0B7491] px-7 py-4 text-center font-semibold text-white transition hover:bg-[#09657E] focus:outline-none focus:ring-2 focus:ring-[#071827]"
            >
              Solicitar análise inicial
            </a>
          </div>
        </section>
      </div>
    </section>
  )
}