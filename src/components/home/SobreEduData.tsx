export default function SobreEduData() {
  const valores = [
    {
      titulo:
        'Evidências',

      descricao:
        'Decisões baseadas em dados, contexto e resultados.',

      cor:
        '#0A3A5E',

      forma:
        'clip-polygon-triangle',
    },

    {
      titulo:
        'Inclusão',

      descricao:
        'Soluções acessíveis desde a sua concepção.',

      cor:
        '#1B6B3A',

      forma:
        'clip-polygon-diamond',
    },

    {
      titulo:
        'Inteligência',

      descricao:
        'Informação transformada em ação com propósito.',

      cor:
        '#5C1A8C',

      forma:
        'clip-polygon-hexagon',
    },
  ]

  return (
    <section
      id="sobre"
      className="bg-[#F5F6F8] px-6 py-20 sm:py-24"
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] lg:items-center lg:gap-16">
          <div className="min-w-0">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-[#0A3A5E]">
              Sobre a EduData IA
            </p>

            <h2 className="max-w-4xl text-4xl font-bold leading-tight tracking-tight text-slate-950 md:text-5xl">
              Educação orientada por evidências.
              Tecnologia com propósito.
            </h2>

            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">
              A EduData IA é uma Plataforma Operacional de
              Inteligência Educacional que conecta evidências,
              inclusão, dados e tecnologia para apoiar
              educadores, gestores e instituições na melhoria
              contínua da educação.
            </p>
          </div>

          <article className="relative min-w-0 overflow-hidden rounded-[2rem] border border-[#0A3A5E]/15 bg-white p-7 shadow-sm sm:p-8">
            <div
              aria-hidden="true"
              className="absolute inset-y-0 left-0 w-1.5 bg-[#0A3A5E]"
            />

            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#0A3A5E]">
              Nossa missão
            </p>

            <h3 className="mt-5 text-2xl font-bold leading-snug text-slate-950 sm:text-3xl">
              Transformar dados, evidências e conhecimento em
              decisões que ampliem oportunidades de
              aprendizagem.
            </h3>

            <div className="mt-6 flex items-center gap-3 border-t border-slate-200 pt-5">
              <div
                aria-hidden="true"
                className="h-3 w-3 rotate-45 bg-[#0A3A5E]"
              />

              <p className="text-sm font-semibold text-slate-600">
                Evidências, Inclusão e Inteligência.
              </p>
            </div>
          </article>
        </div>

        <div className="mt-16 sm:mt-20">
          <p className="mb-8 text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
            Pilares que orientam a EduData IA
          </p>

          <div className="grid gap-6 md:grid-cols-3">
            {valores.map(
              valor => (
                <article
                  key={
                    valor.titulo
                  }
                  className="min-w-0 rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-8"
                >
                  <div
                    aria-hidden="true"
                    className={`mb-7 h-12 w-12 ${valor.forma}`}
                    style={{
                      backgroundColor:
                        valor.cor,
                    }}
                  />

                  <h3
                    className="text-2xl font-bold"
                    style={{
                      color:
                        valor.cor,
                    }}
                  >
                    {
                      valor.titulo
                    }
                  </h3>

                  <p className="mt-3 leading-7 text-slate-600">
                    {
                      valor.descricao
                    }
                  </p>
                </article>
              ),
            )}
          </div>
        </div>
      </div>
    </section>
  )
}