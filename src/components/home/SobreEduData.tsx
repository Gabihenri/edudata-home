type IdentityLayer = {
  code: string
  title: string
  description: string
}

type InstitutionalCommitment = {
  code: string
  title: string
  description: string
}

const identityLayers:
  IdentityLayer[] = [
    {
      code: '01',
      title: 'Framework EDI',
      description:
        'Patrimônio científico, metodológico e pedagógico que orienta as decisões da plataforma.',
    },
    {
      code: '02',
      title: 'EIOS',
      description:
        'Fundação tecnológica responsável por conectar identidade, dados, segurança e inteligência.',
    },
    {
      code: '03',
      title: 'Produtos especializados',
      description:
        'Experiências construídas para necessidades específicas de pessoas e instituições educacionais.',
    },
  ]

const institutionalCommitments:
  InstitutionalCommitment[] = [
    {
      code: 'C01',
      title: 'Partir do problema real',
      description:
        'Compreender o contexto educacional antes de propor ferramentas, processos ou tecnologias.',
    },
    {
      code: 'C02',
      title: 'Preservar o contexto',
      description:
        'Utilizar dados e evidências sem desconsiderar pessoas, condições e características locais.',
    },
    {
      code: 'C03',
      title: 'Apoiar profissionais',
      description:
        'Reduzir fragmentação e carga operacional para ampliar o tempo dedicado ao trabalho educacional.',
    },
    {
      code: 'C04',
      title: 'Acompanhar a evolução',
      description:
        'Transformar registros em informações que permitam analisar ações, resultados e oportunidades.',
    },
  ]

export default function SobreEduData() {
  return (
    <section
      id="sobre"
      className="scroll-mt-24 bg-[#EEF3F7] px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24"
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.92fr)_minmax(340px,1.08fr)] lg:items-start lg:gap-14">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[#075F78]">
                Identidade institucional
              </span>

              <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                Educação e tecnologia
              </span>
            </div>

            <p className="mt-7 text-xs font-bold uppercase tracking-[0.22em] text-[#0B7491]">
              Sobre a EduData IA
            </p>

            <h2 className="mt-4 max-w-4xl text-4xl font-bold leading-[1.08] tracking-tight text-[#071827] sm:text-5xl">
              Uma plataforma construída a partir dos desafios reais da educação.
            </h2>

            <p className="mt-6 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
              A EduData IA desenvolve uma Plataforma Operacional de
              Inteligência Educacional para apoiar professores, equipes
              pedagógicas, gestores e instituições.
            </p>

            <p className="mt-5 max-w-3xl text-base leading-7 text-slate-500">
              Seu propósito é conectar formação, organização do trabalho,
              registros, evidências, dados e inteligência para fortalecer
              ações educacionais e decisões mais conscientes.
            </p>

            <div className="mt-8 grid gap-3 sm:flex sm:flex-wrap">
              <a
                href="#framework"
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#071827] px-7 py-4 text-center font-semibold text-white transition hover:bg-[#0B2940] focus:outline-none focus:ring-2 focus:ring-[#0B7491]"
              >
                Conhecer o Framework EDI
              </a>

              <a
                href="#participacao"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-7 py-4 text-center font-semibold text-[#071827] transition hover:border-cyan-300 hover:bg-cyan-50 focus:outline-none focus:ring-2 focus:ring-[#0B7491]"
              >
                Participar do ecossistema
              </a>
            </div>

            <section className="mt-10 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">
              <header className="border-b border-slate-200 px-5 py-5 sm:px-7">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B7491]">
                  Propósito
                </p>

                <h3 className="mt-2 text-xl font-bold text-[#071827] sm:text-2xl">
                  Tecnologia para ampliar a capacidade humana de compreender e agir.
                </h3>
              </header>

              <div className="grid sm:grid-cols-3">
                <article className="border-b border-slate-200 px-5 py-5 sm:border-b-0 sm:border-r sm:px-6">
                  <span className="font-mono text-xs font-bold text-[#0B7491]">
                    01
                  </span>

                  <h4 className="mt-3 font-bold text-[#071827]">
                    Organizar
                  </h4>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Conectar informações, processos e responsabilidades.
                  </p>
                </article>

                <article className="border-b border-slate-200 px-5 py-5 sm:border-b-0 sm:border-r sm:px-6">
                  <span className="font-mono text-xs font-bold text-[#0B7491]">
                    02
                  </span>

                  <h4 className="mt-3 font-bold text-[#071827]">
                    Compreender
                  </h4>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Transformar registros em evidências e informações.
                  </p>
                </article>

                <article className="px-5 py-5 sm:px-6">
                  <span className="font-mono text-xs font-bold text-[#0B7491]">
                    03
                  </span>

                  <h4 className="mt-3 font-bold text-[#071827]">
                    Apoiar
                  </h4>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Fortalecer ações, acompanhamento e decisões.
                  </p>
                </article>
              </div>
            </section>
          </div>

          <section className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#071827] text-white shadow-sm">
            <header className="border-b border-white/10 px-5 py-5 sm:px-7">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
                O que é a EduData IA
              </p>

              <h3 className="mt-2 text-2xl font-bold">
                Um ecossistema, não um conjunto de softwares isolados.
              </h3>

              <p className="mt-3 text-sm leading-6 text-slate-300">
                Metodologia, tecnologia e produtos possuem responsabilidades
                diferentes, mas permanecem conectados pela mesma arquitetura.
              </p>
            </header>

            <div className="divide-y divide-white/10">
              {identityLayers.map(
                (
                  layer,
                  index,
                ) => (
                  <article
                    key={layer.code}
                    className={`grid grid-cols-[42px_minmax(0,1fr)] gap-4 px-5 py-5 sm:px-7 ${
                      index ===
                      identityLayers.length -
                        1
                        ? 'bg-cyan-300/10'
                        : ''
                    }`}
                  >
                    <span className="font-mono text-xs font-bold text-cyan-300">
                      {layer.code}
                    </span>

                    <div>
                      <h4
                        className={`text-lg font-bold ${
                          index ===
                          identityLayers.length -
                            1
                            ? 'text-cyan-100'
                            : 'text-white'
                        }`}
                      >
                        {layer.title}
                      </h4>

                      <p className="mt-2 text-sm leading-6 text-slate-300">
                        {layer.description}
                      </p>
                    </div>
                  </article>
                ),
              )}
            </div>

            <footer className="border-t border-cyan-300/20 bg-black/10 px-5 py-5 sm:px-7">
              <p className="text-sm font-semibold leading-6 text-cyan-100">
                Framework EDI → EIOS → Core compartilhado → Produtos
              </p>
            </footer>
          </section>
        </div>

        <section className="mt-14 sm:mt-16">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#0B7491]">
              Compromissos permanentes
            </p>

            <h3 className="mt-4 text-3xl font-bold tracking-tight text-[#071827] sm:text-4xl">
              Princípios que orientam cada produto e cada serviço.
            </h3>

            <p className="mt-5 text-base leading-7 text-slate-600">
              A tecnologia deve servir ao trabalho educacional, preservar o
              contexto e apoiar pessoas em vez de substituir sua capacidade
              profissional.
            </p>
          </div>

          <div className="mt-9 grid overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm md:grid-cols-2 xl:grid-cols-4">
            {institutionalCommitments.map(
              (
                commitment,
                index,
              ) => (
                <article
                  key={commitment.code}
                  className={`p-5 sm:p-6 ${
                    index < 3
                      ? 'border-b border-slate-200 xl:border-b-0 xl:border-r'
                      : ''
                  } ${
                    index === 0 ||
                    index === 2
                      ? 'md:border-r'
                      : ''
                  } ${
                    index === 1
                      ? 'xl:border-r'
                      : ''
                  }`}
                >
                  <span className="font-mono text-xs font-bold text-[#0B7491]">
                    {commitment.code}
                  </span>

                  <h4 className="mt-3 text-xl font-bold text-[#071827]">
                    {commitment.title}
                  </h4>

                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {commitment.description}
                  </p>
                </article>
              ),
            )}
          </div>
        </section>

        <section className="mt-12 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white">
          <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B7491]">
                Missão institucional
              </p>

              <h3 className="mt-3 max-w-4xl text-2xl font-bold leading-tight text-[#071827] sm:text-3xl">
                Transformar dados, evidências e conhecimento em decisões que ampliem oportunidades de aprendizagem.
              </h3>
            </div>

            <a
              href="#participacao"
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#0B7491] px-7 py-4 text-center font-semibold text-white transition hover:bg-[#09657E] focus:outline-none focus:ring-2 focus:ring-[#071827]"
            >
              Conhecer formas de participação
            </a>
          </div>
        </section>
      </div>
    </section>
  )
}