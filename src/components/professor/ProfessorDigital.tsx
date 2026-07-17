import Link from 'next/link'

type JourneyStep = {
  code: string
  title: string
  description: string
}

type LearningTrack = {
  code: string
  title: string
}

type ProductAccess = {
  code: string
  label: string
  description: string
  href: string
  primary?: boolean
}

const journeySteps:
  JourneyStep[] = [
    {
      code: '01',
      title: 'Diagnóstico',
      description:
        'Identifica o estágio atual do educador, suas práticas, necessidades formativas e oportunidades de evolução.',
    },
    {
      code: '02',
      title: 'Planejamento',
      description:
        'Organiza metas, prioridades e caminhos formativos conectados ao Framework EDI e à realidade escolar.',
    },
    {
      code: '03',
      title: 'Formação',
      description:
        'Desenvolve competências digitais, pedagógicas, inclusivas e orientadas por dados.',
    },
    {
      code: '04',
      title: 'Prática',
      description:
        'Transforma aprendizagem em ação concreta por meio de ferramentas digitais, inteligência artificial e metodologias aplicadas.',
    },
    {
      code: '05',
      title: 'Evidências',
      description:
        'Registra práticas, experiências, materiais, resultados e produções relevantes do percurso formativo.',
    },
    {
      code: '06',
      title: 'Indicadores',
      description:
        'Converte registros em informações para acompanhamento, análise e melhoria contínua da prática docente.',
    },
    {
      code: '07',
      title: 'Certificação',
      description:
        'Reconhece a trajetória formativa e o desenvolvimento profissional baseado em evidências.',
    },
  ]

const learningTracks:
  LearningTrack[] = [
    {
      code: 'T01',
      title: 'IA aplicada à Educação',
    },
    {
      code: 'T02',
      title: 'Google Workspace',
    },
    {
      code: 'T03',
      title: 'Canva Educacional',
    },
    {
      code: 'T04',
      title: 'LaTeX',
    },
    {
      code: 'T05',
      title: 'Dashboards Educacionais',
    },
    {
      code: 'T06',
      title: 'Framework EDI',
    },
    {
      code: 'T07',
      title: 'Comunidade de prática',
    },
    {
      code: 'T08',
      title: 'Certificação',
    },
  ]

const productAccesses:
  ProductAccess[] = [
    {
      code: 'A01',
      label: 'Abrir Professor Digital',
      description:
        'Conheça a apresentação institucional do produto.',
      href: '/professor-digital',
      primary: true,
    },
    {
      code: 'A02',
      label: 'Perfil docente',
      description:
        'Consulte as informações profissionais do educador.',
      href: '/professor-digital/perfil',
    },
    {
      code: 'A03',
      label: 'Plano de desenvolvimento',
      description:
        'Organize objetivos e prioridades de evolução profissional.',
      href: '/professor-digital/plano',
    },
    {
      code: 'A04',
      label: 'Evidências',
      description:
        'Registre e consulte produções e experiências profissionais.',
      href: '/professor-digital/evidencias',
    },
    {
      code: 'A05',
      label: 'Recomendações',
      description:
        'Acesse orientações relacionadas ao percurso docente.',
      href: '/professor-digital/recomendacoes',
    },
    {
      code: 'A06',
      label: 'Agenda integrada',
      description:
        'Organize ações e compromissos pedagógicos.',
      href: '/professor-digital/agenda',
    },
  ]

const ecosystemLayers = [
  {
    code: '01',
    title: 'Professor Digital',
  },
  {
    code: '02',
    title: 'Agenda Inteligente EDI',
  },
  {
    code: '03',
    title: 'EduData Analytics',
  },
  {
    code: '04',
    title: 'SGPA',
  },
]

export function ProfessorDigital() {
  return (
    <section
      id="professor-digital"
      className="bg-[#EEF3F7] px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24"
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:items-start lg:gap-16">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[#075F78]">
                Produto especializado
              </span>

              <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                Integrado ao EIOS
              </span>
            </div>

            <p className="mt-7 text-xs font-bold uppercase tracking-[0.22em] text-[#0B7491]">
              Professor Digital
            </p>

            <h2 className="mt-4 text-4xl font-bold leading-[1.08] tracking-tight text-[#071827] sm:text-5xl">
              Desenvolvimento profissional conectado à prática docente.
            </h2>

            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
              O Professor Digital é uma das principais portas de entrada
              do ecossistema EduData IA. Ele prepara educadores para
              utilizar tecnologia, inteligência artificial, dados e
              metodologias de forma prática, ética e aplicada à realidade
              escolar.
            </p>

            <section className="mt-10">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B7491]">
                  Trilhas formativas
                </p>

                <h3 className="mt-3 text-2xl font-bold text-[#071827]">
                  Áreas de desenvolvimento
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  As trilhas são áreas de aprendizagem e não botões de
                  navegação.
                </p>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {learningTracks.map(
                  (track) => (
                    <article
                      key={track.code}
                      className="grid min-h-20 grid-cols-[42px_minmax(0,1fr)] items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3"
                    >
                      <span className="font-mono text-xs font-bold text-[#0B7491]">
                        {track.code}
                      </span>

                      <p className="text-sm font-bold leading-5 text-[#071827]">
                        {track.title}
                      </p>
                    </article>
                  ),
                )}
              </div>
            </section>

            <section
              aria-label="Acessos do Professor Digital"
              className="mt-10"
            >
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B7491]">
                  Acessos do produto
                </p>

                <h3 className="mt-3 text-2xl font-bold text-[#071827]">
                  Ambientes e recursos
                </h3>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {productAccesses.map(
                  (access) => (
                    <Link
                      key={access.href}
                      href={access.href}
                      className={`group flex min-h-32 flex-col justify-between rounded-xl border p-5 transition ${
                        access.primary
                          ? 'border-[#071827] bg-[#071827] text-white hover:bg-[#0B2940]'
                          : 'border-slate-200 bg-white text-[#071827] hover:border-cyan-300 hover:bg-cyan-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <span
                          className={`font-mono text-xs font-bold ${
                            access.primary
                              ? 'text-cyan-300'
                              : 'text-[#0B7491]'
                          }`}
                        >
                          {access.code}
                        </span>

                        <span
                          aria-hidden="true"
                          className={`transition group-hover:translate-x-1 ${
                            access.primary
                              ? 'text-cyan-300'
                              : 'text-[#0B7491]'
                          }`}
                        >
                          →
                        </span>
                      </div>

                      <div className="mt-5">
                        <h4 className="font-bold">
                          {access.label}
                        </h4>

                        <p
                          className={`mt-2 text-sm leading-6 ${
                            access.primary
                              ? 'text-slate-300'
                              : 'text-slate-600'
                          }`}
                        >
                          {access.description}
                        </p>
                      </div>
                    </Link>
                  ),
                )}
              </div>
            </section>

            <section className="mt-10 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">
              <header className="border-b border-slate-200 px-5 py-5 sm:px-7">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B7491]">
                  Conexão com o ecossistema
                </p>

                <h3 className="mt-2 text-xl font-bold text-[#071827]">
                  Produtos conectados pelo EIOS
                </h3>
              </header>

              <div className="divide-y divide-slate-200">
                {ecosystemLayers.map(
                  (layer) => (
                    <div
                      key={layer.code}
                      className="flex items-center justify-between gap-4 px-5 py-4 sm:px-7"
                    >
                      <span className="font-semibold text-[#071827]">
                        {layer.title}
                      </span>

                      <span className="font-mono text-xs font-bold text-[#0B7491]">
                        {layer.code}
                      </span>
                    </div>
                  ),
                )}
              </div>
            </section>
          </div>

          <section className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
            <header className="border-b border-slate-200 px-5 py-5 sm:px-7">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B7491]">
                Percurso profissional
              </p>

              <h3 className="mt-2 text-2xl font-bold text-[#071827]">
                Da análise à certificação
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Um ciclo contínuo de desenvolvimento baseado em prática,
                evidências e inteligência.
              </p>
            </header>

            <div className="divide-y divide-slate-200">
              {journeySteps.map(
                (step) => (
                  <article
                    key={step.code}
                    className="grid grid-cols-[44px_minmax(0,1fr)] gap-4 px-5 py-5 sm:px-7"
                  >
                    <span className="font-mono text-xs font-bold text-[#0B7491]">
                      {step.code}
                    </span>

                    <div>
                      <h4 className="text-lg font-bold text-[#071827]">
                        {step.title}
                      </h4>

                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {step.description}
                      </p>
                    </div>
                  </article>
                ),
              )}
            </div>
          </section>
        </div>

        <section className="mt-14 grid overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm sm:grid-cols-3">
          <article className="border-b border-slate-200 p-6 sm:border-b-0 sm:border-r">
            <p className="font-mono text-xs font-bold text-[#0B7491]">
              01
            </p>

            <h3 className="mt-3 font-bold text-[#071827]">
              Cada formação gera prática.
            </h3>
          </article>

          <article className="border-b border-slate-200 p-6 sm:border-b-0 sm:border-r">
            <p className="font-mono text-xs font-bold text-[#0B7491]">
              02
            </p>

            <h3 className="mt-3 font-bold text-[#071827]">
              Cada prática gera evidências.
            </h3>
          </article>

          <article className="p-6">
            <p className="font-mono text-xs font-bold text-[#0B7491]">
              03
            </p>

            <h3 className="mt-3 font-bold text-[#071827]">
              Cada evidência apoia decisões.
            </h3>
          </article>
        </section>
      </div>
    </section>
  )
}