import Link from 'next/link'

type AcademyPillar = {
  code: string
  title: string
  description: string
}

type ArchitectureLayer = {
  code: string
  title: string
  description: string
  highlighted?: boolean
}

const academyPillars:
  AcademyPillar[] = [
    {
      code: '01',
      title: 'Evidências',
      description:
        'Formações relacionadas à prática, ao contexto profissional e aos resultados observáveis.',
    },
    {
      code: '02',
      title: 'Inclusão',
      description:
        'Experiências acessíveis, responsáveis e conectadas às diferentes realidades educacionais.',
    },
    {
      code: '03',
      title: 'Inteligência',
      description:
        'Conhecimentos aplicados à análise, à organização do trabalho e à tomada de decisão.',
    },
  ]

const architectureLayers:
  ArchitectureLayer[] = [
    {
      code: '01',
      title: 'Framework EDI',
      description:
        'Base científica, metodológica e pedagógica.',
    },
    {
      code: '02',
      title: 'EIOS',
      description:
        'Base tecnológica compartilhada pela plataforma.',
    },
    {
      code: '03',
      title: 'EduData Academy',
      description:
        'Formação e desenvolvimento profissional.',
      highlighted: true,
    },
    {
      code: '04',
      title: 'Cursos e trilhas',
      description:
        'Aplicações formativas para pessoas e instituições.',
    },
  ]

export default function AcademyHero() {
  return (
    <section className="relative overflow-hidden bg-[#071827] text-white">
      <div
        aria-hidden="true"
        className="absolute -right-24 -top-24 h-72 w-72 rounded-full border border-cyan-300/10"
      />

      <div
        aria-hidden="true"
        className="absolute -right-8 top-32 h-44 w-44 rounded-full border border-cyan-300/10"
      />

      <div
        aria-hidden="true"
        className="absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-cyan-300/30 to-transparent"
      />

      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[minmax(0,1.08fr)_minmax(340px,0.92fr)] lg:items-center lg:gap-14 lg:px-8 lg:py-20">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-lg border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-cyan-200">
              Produto especializado
            </span>

            <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
              Formação integrada ao EIOS
            </span>
          </div>

          <p className="mt-7 text-xs font-bold uppercase tracking-[0.22em] text-cyan-300 sm:text-sm">
            EduData Academy
          </p>

          <h1 className="mt-4 max-w-4xl text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl">
            Formação profissional baseada em evidências, inclusão e inteligência.
          </h1>

          <p className="mt-6 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
            A EduData Academy conecta conhecimento, prática educacional e
            desenvolvimento profissional por meio de cursos e trilhas
            fundamentados no Framework EDI.
          </p>

          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-400">
            Professores, gestores e instituições encontram formações
            relacionadas aos produtos, às metodologias e às tecnologias do
            ecossistema EduData IA.
          </p>

          <div className="mt-8 grid gap-3 sm:flex sm:flex-wrap">
            <Link
              href="#courses"
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#0B7491] px-7 py-4 text-center font-semibold text-white transition hover:bg-[#09657E]"
            >
              Explorar formações
            </Link>

            <Link
              href="/academy/inscricao"
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/20 bg-white/5 px-7 py-4 text-center font-semibold text-white transition hover:border-cyan-300/40 hover:bg-white/10"
            >
              Realizar inscrição
            </Link>
          </div>

          <div className="mt-9 grid overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] sm:grid-cols-3">
            {academyPillars.map(
              (
                pillar,
                index,
              ) => (
                <article
                  key={pillar.code}
                  className={`px-5 py-5 ${
                    index < 2
                      ? 'border-b border-white/10 sm:border-b-0 sm:border-r'
                      : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-cyan-300">
                      {pillar.code}
                    </span>

                    <h2 className="font-bold text-white">
                      {pillar.title}
                    </h2>
                  </div>

                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    {pillar.description}
                  </p>
                </article>
              ),
            )}
          </div>
        </div>

        <aside className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/10">
          <header className="border-b border-white/10 px-5 py-5 sm:px-7">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
              Arquitetura oficial
            </p>

            <h2 className="mt-2 text-2xl font-bold text-white">
              Formação dentro do ecossistema
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-300">
              A Academy não é uma plataforma isolada de cursos. Ela é o
              núcleo de formação e desenvolvimento profissional da
              EduData IA.
            </p>
          </header>

          <div className="divide-y divide-white/10">
            {architectureLayers.map(
              (layer) => (
                <article
                  key={layer.code}
                  className={`grid grid-cols-[40px_minmax(0,1fr)] gap-4 px-5 py-5 sm:px-7 ${
                    layer.highlighted
                      ? 'bg-cyan-300/10'
                      : ''
                  }`}
                >
                  <span className="font-mono text-xs font-bold text-cyan-300">
                    {layer.code}
                  </span>

                  <div>
                    <h3
                      className={`font-bold ${
                        layer.highlighted
                          ? 'text-cyan-100'
                          : 'text-white'
                      }`}
                    >
                      {layer.title}
                    </h3>

                    <p className="mt-1 text-sm leading-6 text-slate-300">
                      {layer.description}
                    </p>
                  </div>
                </article>
              ),
            )}
          </div>

          <footer className="border-t border-cyan-300/20 bg-cyan-300/10 px-5 py-5 sm:px-7">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-200">
              Desenvolvimento profissional
            </p>

            <p className="mt-2 text-sm font-semibold leading-6 text-cyan-100">
              Conhecimento aplicado à prática educacional e à evolução
              contínua das pessoas e instituições.
            </p>
          </footer>
        </aside>
      </div>
    </section>
  )
}