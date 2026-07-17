import Image from 'next/image'
import Link from 'next/link'

type OperationalStep = {
  code: string
  title: string
  description: string
}

const operationalFlow:
  OperationalStep[] = [
    {
      code: '01',
      title: 'Planejar',
      description:
        'Organize aulas, objetivos, estratégias e recursos pedagógicos.',
    },
    {
      code: '02',
      title: 'Registrar',
      description:
        'Documente práticas, produções, evidências e informações relevantes.',
    },
    {
      code: '03',
      title: 'Acompanhar',
      description:
        'Consulte turmas, tarefas, compromissos e trajetórias de aprendizagem.',
    },
    {
      code: '04',
      title: 'Analisar',
      description:
        'Utilize dados e recomendações para apoiar decisões pedagógicas.',
    },
  ]

const ediPillars = [
  'Evidências',
  'Inclusão',
  'Inteligência',
]

export function ProfessorDigitalHero() {
  return (
    <section className="relative overflow-hidden bg-[#071827] text-white">
      <div
        aria-hidden="true"
        className="absolute -right-24 -top-24 h-72 w-72 rounded-full border border-cyan-300/10"
      />

      <div
        aria-hidden="true"
        className="absolute -right-8 top-36 h-44 w-44 rounded-full border border-cyan-300/10"
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
              Integrado ao EIOS
            </span>
          </div>

          <p className="mt-7 text-xs font-bold uppercase tracking-[0.22em] text-cyan-300 sm:text-sm">
            Professor Digital
          </p>

          <h1 className="mt-4 max-w-4xl text-4xl font-bold leading-[1.07] tracking-tight text-white sm:text-5xl lg:text-6xl">
            Inteligência educacional para fortalecer o trabalho docente.
          </h1>

          <p className="mt-6 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
            Planeje aulas, organize evidências, acompanhe estudantes e
            reduza tarefas operacionais com recursos integrados ao
            ecossistema EduData IA.
          </p>

          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-400">
            O Professor Digital preserva a autonomia docente e transforma
            registros cotidianos em apoio ao planejamento, ao
            acompanhamento e à tomada de decisão.
          </p>

          <div className="mt-8 flex flex-wrap gap-2">
            {ediPillars.map(
              (pillar) => (
                <span
                  key={pillar}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200"
                >
                  {pillar}
                </span>
              ),
            )}
          </div>

          <div className="mt-9 grid gap-3 sm:flex sm:flex-wrap">
            <Link
              href="/professor-digital/agenda"
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#0B7491] px-7 py-4 text-center font-semibold text-white transition hover:bg-[#09657E]"
            >
              Acessar o Professor Digital
            </Link>

            <Link
              href="#recursos-professor-digital"
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/20 bg-white/5 px-7 py-4 text-center font-semibold text-white transition hover:border-cyan-300/40 hover:bg-white/10"
            >
              Conhecer recursos
            </Link>
          </div>
        </div>

        <aside className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/10">
          <header className="border-b border-white/10 px-5 py-5 sm:px-7">
            <div className="flex items-center justify-between gap-5">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
                  Fluxo operacional
                </p>

                <h2 className="mt-2 text-xl font-bold text-white sm:text-2xl">
                  Trabalho docente conectado
                </h2>
              </div>

              <Image
                src="/logo-professor-digital.png"
                alt="Professor Digital"
                width={320}
                height={128}
                priority
                className="h-auto w-28 shrink-0 object-contain sm:w-36"
              />
            </div>
          </header>

          <div className="divide-y divide-white/10">
            {operationalFlow.map(
              (step) => (
                <article
                  key={step.code}
                  className="grid grid-cols-[40px_minmax(0,1fr)] gap-4 px-5 py-5 sm:px-7"
                >
                  <span className="font-mono text-xs font-bold text-cyan-300">
                    {step.code}
                  </span>

                  <div>
                    <h3 className="font-bold text-white">
                      {step.title}
                    </h3>

                    <p className="mt-1 text-sm leading-6 text-slate-300">
                      {step.description}
                    </p>
                  </div>
                </article>
              ),
            )}
          </div>

          <footer className="border-t border-cyan-300/20 bg-cyan-300/10 px-5 py-5 sm:px-7">
            <p className="text-sm font-semibold leading-6 text-cyan-100">
              Planejar, registrar, acompanhar e analisar em um único
              ambiente.
            </p>
          </footer>
        </aside>
      </div>
    </section>
  )
}