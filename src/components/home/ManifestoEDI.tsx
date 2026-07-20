export default function ManifestoEDI() {
  return (
    <section
      id="manifesto"
      aria-labelledby="missao-edudata-title"
      className="bg-white px-4 py-12 sm:px-6 sm:py-16 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">
        <article className="relative overflow-hidden rounded-[2rem] border border-cyan-300/20 bg-[#071827] text-white shadow-xl shadow-slate-950/10">
          <div
            aria-hidden="true"
            className="absolute -right-20 -top-20 h-56 w-56 rounded-full border border-cyan-300/10"
          />

          <div
            aria-hidden="true"
            className="absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-cyan-300/40 to-transparent"
          />

          <div className="relative grid gap-8 p-7 sm:p-9 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:gap-12 lg:p-12">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300 sm:text-sm">
                Missão EduData IA
              </p>

              <h2
                id="missao-edudata-title"
                className="mt-5 max-w-5xl text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl"
              >
                Transformar dados, evidências e conhecimento em
                decisões que ampliem oportunidades de aprendizagem.
              </h2>

              <p className="mt-5 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
                Tecnologia com propósito para apoiar educadores,
                gestores e instituições na melhoria contínua da
                educação.
              </p>
            </div>

            <div className="flex min-w-0 flex-wrap gap-2 lg:max-w-xs lg:justify-end">
              <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm font-semibold text-cyan-100">
                Evidências
              </span>

              <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-4 py-2 text-sm font-semibold text-emerald-100">
                Inclusão
              </span>

              <span className="rounded-full border border-violet-300/20 bg-violet-300/10 px-4 py-2 text-sm font-semibold text-violet-100">
                Inteligência
              </span>
            </div>
          </div>
        </article>
      </div>
    </section>
  )
}