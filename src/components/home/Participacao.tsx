type ParticipationPath = {
  code: string
  category: string
  title: string
  description: string
  action: string
  href: string
  status: string
  statusClassName: string
  featured?: boolean
}

function createMailto(
  subject: string,
  body: string,
): string {
  return `mailto:sabinohc@gmail.com?subject=${encodeURIComponent(
    subject,
  )}&body=${encodeURIComponent(
    body,
  )}`
}

const participationPaths:
  ParticipationPath[] = [
    {
      code: '01',
      category: 'Produto prioritário',
      title: 'Conhecer a Agenda Inteligente EDI',
      description:
        'Experimente uma nova forma de planejar, registrar evidências, acompanhar tarefas e organizar o trabalho docente.',
      action: 'Conhecer a Agenda',
      href: '/agenda',
      status: 'Piloto',
      statusClassName:
        'border-amber-300/30 bg-amber-300/10 text-amber-100',
      featured: true,
    },
    {
      code: '02',
      category: 'Desenvolvimento profissional',
      title: 'Participar do Professor Digital',
      description:
        'Acompanhe formações e experiências sobre inteligência artificial, tecnologia, dados e prática educacional.',
      action: 'Conhecer o programa',
      href: '#professor-digital',
      status: 'Prioridade comercial',
      statusClassName:
        'border-cyan-300/30 bg-cyan-300/10 text-cyan-100',
    },
    {
      code: '03',
      category: 'Formação',
      title: 'Escolher uma formação na Academy',
      description:
        'Consulte cursos, trilhas e experiências formativas conectadas ao Framework EDI e às necessidades profissionais.',
      action: 'Explorar formações',
      href: '/academy#courses',
      status: 'Em implantação',
      statusClassName:
        'border-emerald-300/30 bg-emerald-300/10 text-emerald-100',
    },
    {
      code: '04',
      category: 'Escolas e redes',
      title: 'Apresentar um desafio institucional',
      description:
        'Converse sobre diagnóstico, formação, organização de processos, indicadores, automação ou projetos educacionais.',
      action: 'Solicitar conversa',
      href: createMailto(
        'Conversa institucional — EduData IA',
        'Olá, gostaria de apresentar um desafio institucional para a EduData IA.\n\nNome:\nInstituição:\nMunicípio/UF:\nDesafio ou necessidade:\nTelefone para contato:',
      ),
      status: 'Atendimento sob consulta',
      statusClassName:
        'border-white/20 bg-white/5 text-slate-200',
    },
  ]

const ecosystemPrinciples = [
  {
    code: '01',
    title: 'Evidências',
    description:
      'Compreender o contexto antes de decidir.',
  },
  {
    code: '02',
    title: 'Inclusão',
    description:
      'Considerar pessoas, acesso e participação.',
  },
  {
    code: '03',
    title: 'Inteligência',
    description:
      'Transformar informação em ação responsável.',
  },
]

const PARTNERSHIP_HREF =
  createMailto(
    'Parceria e colaboração — EduData IA',
    'Olá, gostaria de conversar sobre uma possibilidade de parceria ou colaboração com a EduData IA.\n\nNome:\nInstituição ou projeto:\nMunicípio/UF:\nProposta ou área de interesse:\nTelefone para contato:',
  )

export default function Participacao() {
  return (
    <section
      id="participacao"
      className="relative scroll-mt-24 overflow-hidden bg-[#071827] px-4 py-16 text-white sm:px-6 sm:py-20 lg:px-8 lg:py-24"
    >
      <div
        aria-hidden="true"
        className="absolute -right-40 -top-40 h-96 w-96 rounded-full border border-cyan-300/10"
      />

      <div
        aria-hidden="true"
        className="absolute -right-20 -top-20 h-56 w-56 rounded-full border border-cyan-300/10"
      />

      <div
        aria-hidden="true"
        className="absolute -bottom-48 -left-48 h-[28rem] w-[28rem] rounded-full border border-white/5"
      />

      <div className="relative mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.92fr)_minmax(340px,1.08fr)] lg:items-start lg:gap-14">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-lg border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-cyan-100">
                Próximo passo
              </span>

              <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                Pessoas e instituições
              </span>
            </div>

            <p className="mt-7 text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">
              Participação
            </p>

            <h2 className="mt-4 max-w-4xl text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl">
              Escolha como começar sua jornada na EduData IA.
            </h2>

            <p className="mt-6 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
              Você pode começar por uma ferramenta, uma formação, uma
              necessidade institucional ou uma conversa sobre colaboração.
            </p>

            <p className="mt-5 max-w-3xl text-base leading-7 text-slate-400">
              Cada caminho possui uma finalidade diferente, mas todos
              permanecem conectados pelos princípios do Framework EDI e pela
              arquitetura compartilhada da plataforma.
            </p>

            <div className="mt-8 grid gap-3 sm:flex sm:flex-wrap">
              <a
                href="/agenda"
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#0B7491] px-7 py-4 text-center font-semibold text-white transition hover:bg-[#0D829F] focus:outline-none focus:ring-2 focus:ring-cyan-300"
              >
                Conhecer a Agenda EDI
              </a>

              <a
                href="/academy#courses"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/20 bg-white/5 px-7 py-4 text-center font-semibold text-white transition hover:border-cyan-300/40 hover:bg-cyan-300/10 focus:outline-none focus:ring-2 focus:ring-cyan-300"
              >
                Explorar formações
              </a>
            </div>

            <section className="mt-10 overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/10">
              <header className="border-b border-white/10 px-5 py-5 sm:px-7">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
                  Base comum
                </p>

                <h3 className="mt-2 text-xl font-bold text-white sm:text-2xl">
                  Diferentes caminhos, os mesmos compromissos.
                </h3>
              </header>

              <div className="grid sm:grid-cols-3">
                {ecosystemPrinciples.map(
                  (
                    principle,
                    index,
                  ) => (
                    <article
                      key={principle.code}
                      className={`px-5 py-5 sm:px-6 ${
                        index <
                        ecosystemPrinciples.length -
                          1
                          ? 'border-b border-white/10 sm:border-b-0 sm:border-r'
                          : ''
                      }`}
                    >
                      <span className="font-mono text-xs font-bold text-cyan-300">
                        {principle.code}
                      </span>

                      <h4 className="mt-3 font-bold text-white">
                        {principle.title}
                      </h4>

                      <p className="mt-2 text-sm leading-6 text-slate-400">
                        {principle.description}
                      </p>
                    </article>
                  ),
                )}
              </div>
            </section>
          </div>

          <section
            aria-labelledby="participation-paths-title"
            className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.04] shadow-sm backdrop-blur-sm"
          >
            <header className="border-b border-white/10 px-5 py-5 sm:px-7">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
                Formas de participação
              </p>

              <h3
                id="participation-paths-title"
                className="mt-2 text-2xl font-bold text-white"
              >
                Encontre o caminho mais adequado ao seu momento.
              </h3>

              <p className="mt-3 text-sm leading-6 text-slate-400">
                Conheça o estágio e a finalidade de cada possibilidade antes
                de continuar.
              </p>
            </header>

            <div className="divide-y divide-white/10">
              {participationPaths.map(
                (path) => (
                  <a
                    key={path.code}
                    href={path.href}
                    aria-label={`${path.action}: ${path.title}`}
                    className={`group block px-5 py-5 transition focus:outline-none focus:ring-2 focus:ring-inset focus:ring-cyan-300 sm:px-7 ${
                      path.featured
                        ? 'bg-cyan-300/[0.07] hover:bg-cyan-300/[0.12]'
                        : 'hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <span className="font-mono text-xs font-bold text-cyan-300">
                          {path.code}
                        </span>

                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                          {path.category}
                        </p>
                      </div>

                      <span
                        className={`rounded-lg border px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.14em] ${path.statusClassName}`}
                      >
                        {path.status}
                      </span>
                    </div>

                    <h4 className="mt-4 text-xl font-bold leading-tight text-white sm:text-2xl">
                      {path.title}
                    </h4>

                    <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                      {path.description}
                    </p>

                    <div className="mt-5 flex items-center justify-between gap-4 border-t border-white/10 pt-4">
                      <span className="text-sm font-bold text-cyan-100">
                        {path.action}
                      </span>

                      <span
                        aria-hidden="true"
                        className="font-bold text-cyan-300 transition group-hover:translate-x-1"
                      >
                        →
                      </span>
                    </div>
                  </a>
                ),
              )}
            </div>
          </section>
        </div>

        <section className="mt-14 overflow-hidden rounded-[1.5rem] border border-cyan-300/20 bg-cyan-300/[0.07] sm:mt-16">
          <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
                Parcerias e colaboração
              </p>

              <h3 className="mt-3 max-w-4xl text-2xl font-bold leading-tight text-white sm:text-3xl">
                Projetos educacionais relevantes também podem ser construídos em conjunto.
              </h3>

              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">
                Instituições, pesquisadores, educadores e organizações podem
                apresentar propostas de formação, pesquisa, inovação,
                inclusão ou desenvolvimento tecnológico.
              </p>
            </div>

            <a
              href={PARTNERSHIP_HREF}
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-white px-7 py-4 text-center font-semibold text-[#071827] transition hover:bg-cyan-50 focus:outline-none focus:ring-2 focus:ring-cyan-300"
            >
              Apresentar uma proposta
            </a>
          </div>
        </section>

        <footer className="mt-12 border-t border-white/10 pt-8">
          <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <p className="max-w-4xl text-base leading-7 text-slate-400">
              A transformação educacional acontece quando conhecimento,
              pessoas, evidências e tecnologia trabalham de forma integrada.
            </p>

            <a
              href="/"
              className="inline-flex min-h-10 items-center justify-center rounded-xl border border-white/15 px-5 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-cyan-300/30 hover:bg-white/5 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-300"
            >
              Voltar ao início
            </a>
          </div>
        </footer>
      </div>
    </section>
  )
}