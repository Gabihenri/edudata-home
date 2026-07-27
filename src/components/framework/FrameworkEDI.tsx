import {
  framework,
  frameworkPillars,
} from '@/lib/data/framework'

const pillarStyles = [
  {
    code: '01',
    border:
      'border-[#0B7491]/25',
    background:
      'bg-[#0B7491]/5',
    label:
      'text-[#075F78]',
    shape:
      'border-[#0B7491]/25 bg-[#0B7491]/10',
    dot:
      'bg-[#0B7491]',
  },
  {
    code: '02',
    border:
      'border-emerald-700/20',
    background:
      'bg-emerald-700/5',
    label:
      'text-emerald-800',
    shape:
      'border-emerald-700/20 bg-emerald-700/10',
    dot:
      'bg-emerald-700',
  },
  {
    code: '03',
    border:
      'border-violet-700/20',
    background:
      'bg-violet-700/5',
    label:
      'text-violet-800',
    shape:
      'border-violet-700/20 bg-violet-700/10',
    dot:
      'bg-violet-700',
  },
]

export function FrameworkEDI() {
  return (
    <section
      id="framework"
      className="scroll-mt-24 bg-white px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24"
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.84fr)_minmax(0,1.16fr)] lg:items-start lg:gap-16">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[#075F78]">
                Base metodológica
              </span>

              <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                Patrimônio científico e pedagógico
              </span>
            </div>

            <p className="mt-7 text-xs font-bold uppercase tracking-[0.22em] text-[#0B7491]">
              {framework.title}
            </p>

            <h2 className="mt-4 max-w-4xl text-4xl font-bold leading-[1.08] tracking-tight text-[#071827] sm:text-5xl">
              {framework.subtitle}
            </h2>

            <p className="mt-6 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
              O Framework EDI integra Evidências, Inclusão e Inteligência
              como princípios permanentes para orientar produtos,
              processos e decisões da Plataforma EduData IA.
            </p>

            <p className="mt-5 max-w-3xl text-base leading-7 text-slate-500">
              {framework.principle}
            </p>

            <div className="mt-8 grid gap-3 sm:flex sm:flex-wrap">
              <a
                href="#como-funciona"
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#071827] px-7 py-4 text-center font-semibold text-white transition hover:bg-[#0B2940] focus:outline-none focus:ring-2 focus:ring-[#0B7491]"
              >
                Entender como funciona
              </a>

              <a
                href="#professor-digital"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-7 py-4 text-center font-semibold text-[#071827] transition hover:border-cyan-300 hover:bg-cyan-50 focus:outline-none focus:ring-2 focus:ring-[#0B7491]"
              >
                Ver aplicação prática
              </a>
            </div>

            <section className="mt-10 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-[#071827] text-white">
              <header className="border-b border-white/10 px-5 py-5 sm:px-7">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
                  Fluxo de transformação
                </p>

                <h3 className="mt-2 text-xl font-bold sm:text-2xl">
                  Do registro ao impacto educacional.
                </h3>
              </header>

              <div className="divide-y divide-white/10">
                <div className="grid grid-cols-[42px_minmax(0,1fr)] gap-4 px-5 py-4 sm:px-7">
                  <span className="font-mono text-xs font-bold text-cyan-300">
                    01
                  </span>

                  <p className="font-semibold text-slate-200">
                    Evidências organizam a realidade observada.
                  </p>
                </div>

                <div className="grid grid-cols-[42px_minmax(0,1fr)] gap-4 px-5 py-4 sm:px-7">
                  <span className="font-mono text-xs font-bold text-cyan-300">
                    02
                  </span>

                  <p className="font-semibold text-slate-200">
                    Inclusão garante acesso, contexto e proteção.
                  </p>
                </div>

                <div className="grid grid-cols-[42px_minmax(0,1fr)] gap-4 px-5 py-4 sm:px-7">
                  <span className="font-mono text-xs font-bold text-cyan-300">
                    03
                  </span>

                  <p className="font-semibold text-slate-200">
                    Inteligência transforma dados em orientação.
                  </p>
                </div>

                <div className="grid grid-cols-[42px_minmax(0,1fr)] gap-4 bg-cyan-300/10 px-5 py-4 sm:px-7">
                  <span className="font-mono text-xs font-bold text-cyan-300">
                    04
                  </span>

                  <p className="font-bold text-cyan-100">
                    Ação e acompanhamento produzem impacto.
                  </p>
                </div>
              </div>
            </section>
          </div>

          <section
            aria-labelledby="framework-pillars-title"
            className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-[#EEF3F7] shadow-sm"
          >
            <header className="border-b border-slate-200 bg-white px-5 py-5 sm:px-7">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B7491]">
                Pilares estruturantes
              </p>

              <h3
                id="framework-pillars-title"
                className="mt-2 text-2xl font-bold text-[#071827]"
              >
                Três princípios conectados em um único método.
              </h3>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                Cada pilar possui uma responsabilidade própria, mas atua de
                forma integrada aos demais.
              </p>
            </header>

            <div className="space-y-4 p-4 sm:p-6">
              {frameworkPillars.map(
                (
                  pillar,
                  index,
                ) => {
                  const style =
                    pillarStyles[index] ??
                    pillarStyles[0]

                  return (
                    <article
                      key={pillar.id}
                      className={`overflow-hidden rounded-2xl border bg-white ${style.border}`}
                    >
                      <div className="grid gap-5 p-5 sm:grid-cols-[74px_minmax(0,1fr)] sm:p-6">
                        <div
                          aria-hidden="true"
                          className={`flex h-16 w-16 items-center justify-center rounded-2xl border ${style.shape}`}
                        >
                          <div
                            className={`h-5 w-5 rotate-45 ${style.dot}`}
                          />
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <p
                              className={`text-xs font-bold uppercase tracking-[0.18em] ${style.label}`}
                            >
                              Pilar {style.code}
                            </p>

                            <span className="font-mono text-xs font-bold text-slate-400">
                              EDI
                            </span>
                          </div>

                          <h4 className="mt-3 text-2xl font-bold text-[#071827]">
                            {pillar.title}
                          </h4>

                          <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">
                            {pillar.description}
                          </p>
                        </div>
                      </div>

                      <footer
                        className={`border-t px-5 py-3 sm:px-6 ${style.border} ${style.background}`}
                      >
                        <p
                          className={`text-xs font-semibold uppercase tracking-[0.14em] ${style.label}`}
                        >
                          Framework EDI
                        </p>
                      </footer>
                    </article>
                  )
                },
              )}
            </div>

            <footer className="border-t border-cyan-200 bg-cyan-50 px-5 py-5 sm:px-7">
              <p className="text-sm font-semibold leading-6 text-cyan-950">
                Evidências → Inclusão → Inteligência → Ação → Impacto
              </p>
            </footer>
          </section>
        </div>
      </div>
    </section>
  )
}