export default function SobreEduData() {
  const valores = [
    {
      titulo: 'Evidências',
      descricao: 'Decisões baseadas em dados, contexto e resultados.',
      cor: '#0A3A5E',
      forma: 'clip-polygon-triangle',
    },
    {
      titulo: 'Inclusão',
      descricao: 'Soluções acessíveis desde a sua concepção.',
      cor: '#1B6B3A',
      forma: 'clip-polygon-diamond',
    },
    {
      titulo: 'Inteligência',
      descricao: 'Informação transformada em ação com propósito.',
      cor: '#5C1A8C',
      forma: 'clip-polygon-hexagon',
    },
  ]

  return (
    <section id="sobre" className="bg-[#F5F6F8] px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-16 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-[#0A3A5E]">
              Sobre a EduData IA
            </p>

            <h2 className="text-4xl font-bold leading-tight tracking-tight text-slate-950 md:text-6xl">
              Educação orientada por evidências. Tecnologia com propósito.
            </h2>

            <p className="mt-8 text-lg leading-8 text-slate-600">
              A EduData IA nasceu da experiência prática em sala de aula, da
              gestão educacional e da busca por soluções capazes de transformar
              dados, evidências e conhecimento em decisões que ampliem
              oportunidades de aprendizagem.
            </p>

            <p className="mt-6 text-lg leading-8 text-slate-600">
              Nosso trabalho conecta educação, ciência de dados, inteligência
              artificial, inclusão e tecnologia aplicada para apoiar educadores,
              gestores e instituições na melhoria contínua da prática educacional.
            </p>
          </div>

          <div className="rounded-[2rem] bg-[#081C2E] p-8 text-white shadow-xl">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-300">
              Nossa missão
            </p>

            <h3 className="mt-6 text-3xl font-bold leading-tight">
              Transformar dados, evidências e conhecimento em decisões que
              ampliem oportunidades de aprendizagem.
            </h3>

            <div className="mt-10 border-t border-white/10 pt-8">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-300">
                Nossa visão
              </p>

              <p className="mt-4 text-lg leading-8 text-slate-300">
                Construir um ecossistema educacional baseado em Evidências,
                Inclusão e Inteligência.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-20">
          <p className="mb-8 text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
            Valores que orientam a EduData IA
          </p>

          <div className="grid gap-8 md:grid-cols-3">
            {valores.map((valor) => (
              <div
                key={valor.titulo}
                className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm"
              >
                <div
                  className={`mb-8 h-16 w-16 ${valor.forma}`}
                  style={{ backgroundColor: valor.cor }}
                />

                <h3
                  className="text-3xl font-bold"
                  style={{ color: valor.cor }}
                >
                  {valor.titulo}
                </h3>

                <p className="mt-4 leading-8 text-slate-600">
                  {valor.descricao}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}