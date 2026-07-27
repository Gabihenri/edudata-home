import Link from 'next/link'

type LearningStep = {
  code: string
  title: string
  description: string
}

type LearningArea = {
  code: string
  title: string
  description: string
}

const learningJourney:
  LearningStep[] = [
    {
      code: '01',
      title: 'Conhecer',
      description:
        'Compreender conceitos, tecnologias, metodologias e fundamentos educacionais.',
    },
    {
      code: '02',
      title: 'Aplicar',
      description:
        'Transformar conhecimento em planejamento, prática e solução para situações reais.',
    },
    {
      code: '03',
      title: 'Evidenciar',
      description:
        'Registrar produções, experiências, resultados e aprendizagens construídas.',
    },
    {
      code: '04',
      title: 'Evoluir',
      description:
        'Utilizar evidências para acompanhar o desenvolvimento profissional.',
    },
  ]

const learningAreas:
  LearningArea[] = [
    {
      code: 'A01',
      title: 'Inteligência artificial',
      description:
        'Uso responsável e aplicado da IA no planejamento e na prática educacional.',
    },
    {
      code: 'A02',
      title: 'Tecnologias educacionais',
      description:
        'Google Workspace, ferramentas digitais, automação e produtividade.',
    },
    {
      code: 'A03',
      title: 'Dados e indicadores',
      description:
        'Organização, análise e comunicação de informações educacionais.',
    },
    {
      code: 'A04',
      title: 'Produção acadêmica',
      description:
        'LaTeX, documentação, materiais didáticos e comunicação científica.',
    },
    {
      code: 'A05',
      title: 'Educação inclusiva',
      description:
        'Acessibilidade, participação, proteção e respeito aos diferentes contextos.',
    },
    {
      code: 'A06',
      title: 'Framework EDI',
      description:
        'Evidências, Inclusão e Inteligência aplicadas ao desenvolvimento profissional.',
    },
  ]

const academyConnections = [
  {
    code: '01',
    title: 'Formação',
    description:
      'Conhecimento estruturado em cursos e trilhas.',
  },
  {
    code: '02',
    title: 'Prática',
    description:
      'Aplicação em situações educacionais reais.',
  },
  {
    code: '03',
    title: 'Evidências',
    description:
      'Registro das produções e experiências.',
  },
  {
    code: '04',
    title: 'Desenvolvimento',
    description:
      'Acompanhamento da evolução profissional.',
  },
]

export default function EduDataAcademy() {
  return (
    <section
      id="academy"
      className="scroll-mt-24 bg-[#EEF3F7] px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24"
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.92fr)_minmax(340px,1.08fr)] lg:items-start lg:gap-14">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[#075F78]">
                Formação profissional
              </span>

              <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                Integrada ao ecossistema
              </span>
            </div>

            <p className="mt-7 text-xs font-bold uppercase tracking-[0.22em] text-[#0B7491]">
              EduData Academy
            </p>

            <h2 className="mt-4 max-w-4xl text-4xl font-bold leading-[1.08] tracking-tight text-[#071827] sm:text-5xl">
              Formação conectada à prática e ao desenvolvimento profissional.
            </h2>

            <p className="mt-6 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
              A EduData Academy organiza cursos, trilhas e experiências
              formativas para professores, equipes pedagógicas, gestores e
              instituições educacionais.
            </p>

            <p className="mt-5 max-w-3xl text-base leading-7 text-slate-500">
              Cada formação busca transformar conhecimento em aplicação,
              registros e evidências capazes de fortalecer a prática
              profissional.
            </p>

            <div className="mt-8 grid gap-3 sm:flex sm:flex-wrap">
              <Link
                href="/academy#courses"
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#0B7491] px-7 py-4 text-center font-semibold text-white transition hover:bg-[#09657E] focus:outline-none focus:ring-2 focus:ring-[#071827]"
              >
                Ver cursos e formações
              </Link>

              <Link
                href="/academy"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-7 py-4 text-center font-semibold text-[#071827] transition hover:border-cyan-300 hover:bg-cyan-50 focus:outline-none focus:ring-2 focus:ring-[#0B7491]"
              >
                Acessar a Academy
              </Link>
            </div>

            <section className="mt-10 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-[#071827] text-white shadow-sm">
              <header className="border-b border-white/10 px-5 py-5 sm:px-7">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
                    Jornada formativa
                  </p>

                  <span className="rounded-lg border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-100">
                    Framework EDI
                  </span>
                </div>

                <h3 className="mt-3 text-xl font-bold sm:text-2xl">
                  Do conhecimento à evolução profissional.
                </h3>
              </header>

              <div className="divide-y divide-white/10">
                {learningJourney.map(
                  (
                    step,
                    index,
                  ) => (
                    <article
                      key={step.code}
                      className={`grid grid-cols-[42px_minmax(0,1fr)] gap-4 px-5 py-4 sm:px-7 ${
                        index ===
                        learningJourney.length -
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
                            learningJourney.length -
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
                  Conhecer → Aplicar → Evidenciar → Evoluir
                </p>
              </footer>
            </section>
          </div>

          <section
            aria-labelledby="academy-learning-areas-title"
            className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm"
          >
            <header className="border-b border-slate-200 px-5 py-5 sm:px-7">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B7491]">
                  Áreas formativas
                </p>

                <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-800">
                  Em implantação
                </span>
              </div>

              <h3
                id="academy-learning-areas-title"
                className="mt-3 text-2xl font-bold text-[#071827]"
              >
                Diferentes áreas em uma única experiência de aprendizagem.
              </h3>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                As formações podem ser acessadas individualmente ou
                organizadas em trilhas de desenvolvimento.
              </p>
            </header>

            <div className="grid md:grid-cols-2">
              {learningAreas.map(
                (
                  area,
                  index,
                ) => (
                  <article
                    key={area.code}
                    className={`p-5 sm:p-6 ${
                      index < 4
                        ? 'border-b border-slate-200'
                        : ''
                    } ${
                      index % 2 === 0
                        ? 'md:border-r md:border-slate-200'
                        : ''
                    }`}
                  >
                    <span className="font-mono text-xs font-bold text-[#0B7491]">
                      {area.code}
                    </span>

                    <h4 className="mt-3 text-xl font-bold text-[#071827]">
                      {area.title}
                    </h4>

                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {area.description}
                    </p>
                  </article>
                ),
              )}
            </div>

            <footer className="border-t border-cyan-200 bg-cyan-50 px-5 py-5 sm:px-7">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="text-sm font-semibold leading-6 text-cyan-950">
                  Consulte cursos, modalidades, níveis e inscrições na página
                  da Academy.
                </p>

                <Link
                  href="/academy#courses"
                  className="inline-flex min-h-10 items-center justify-center rounded-xl bg-[#071827] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0B2940] focus:outline-none focus:ring-2 focus:ring-[#0B7491]"
                >
                  Explorar formações
                </Link>
              </div>
            </footer>
          </section>
        </div>

        <section className="mt-14 sm:mt-16">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#0B7491]">
              Formação integrada
            </p>

            <h3 className="mt-4 text-3xl font-bold tracking-tight text-[#071827] sm:text-4xl">
              A aprendizagem não termina quando o curso acaba.
            </h3>

            <p className="mt-5 text-base leading-7 text-slate-600">
              A Academy se conecta aos produtos da EduData IA para que a
              formação possa continuar na prática profissional.
            </p>
          </div>

          <div className="mt-9 grid overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm sm:grid-cols-2 lg:grid-cols-4">
            {academyConnections.map(
              (
                connection,
                index,
              ) => (
                <article
                  key={connection.code}
                  className={`p-5 sm:p-6 ${
                    index < 3
                      ? 'border-b border-slate-200 lg:border-b-0 lg:border-r'
                      : ''
                  } ${
                    index === 0
                      ? 'sm:border-r'
                      : ''
                  } ${
                    index === 2
                      ? 'sm:border-r'
                      : ''
                  }`}
                >
                  <span className="font-mono text-xs font-bold text-[#0B7491]">
                    {connection.code}
                  </span>

                  <h4 className="mt-3 text-xl font-bold text-[#071827]">
                    {connection.title}
                  </h4>

                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {connection.description}
                  </p>
                </article>
              ),
            )}
          </div>
        </section>

        <section className="mt-12 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-[#071827] text-white">
          <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
                Desenvolvimento profissional
              </p>

              <h3 className="mt-3 text-2xl font-bold sm:text-3xl">
                Comece por uma formação e avance pelo ecossistema.
              </h3>

              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">
                Conheça os cursos disponíveis e escolha uma formação
                relacionada às suas necessidades profissionais.
              </p>
            </div>

            <Link
              href="/academy#courses"
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#0B7491] px-7 py-4 text-center font-semibold text-white transition hover:bg-[#09657E] focus:outline-none focus:ring-2 focus:ring-cyan-300"
            >
              Escolher uma formação
            </Link>
          </div>
        </section>
      </div>
    </section>
  )
}