export function FrameworkEDI() {
  const pilares = [
    {
      titulo: 'Evidências',
      cor: '#0A3A5E',
      descricao:
        'Observação, indicadores, evidências pedagógicas e tomada de decisão baseada em dados.',
      forma: 'clip-polygon-triangle',
    },
    {
      titulo: 'Inclusão',
      cor: '#1B6B3A',
      descricao:
        'Acessibilidade, participação, diversidade e desenho universal para aprendizagem.',
      forma: 'clip-polygon-diamond',
    },
    {
      titulo: 'Inteligência',
      cor: '#5C1A8C',
      descricao:
        'Análise, aprendizagem contínua, inovação e inteligência educacional.',
      forma: 'clip-polygon-hexagon',
    },
  ]

  return (
    <section id="framework" className="bg-white px-6 py-32">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
            Framework EDI
          </p>

          <h2 className="text-5xl font-bold tracking-tight text-slate-950 md:text-6xl">
            A estrutura que orienta
            <br />
            toda a EduData IA.
          </h2>

          <p className="mt-8 text-xl leading-9 text-slate-600">
            O Framework EDI organiza a prática educacional a partir de três pilares
            complementares: Evidências, Inclusão e Inteligência.
          </p>
        </div>

        <div className="mt-24 grid gap-12 md:grid-cols-3">
          {pilares.map((pilar) => (
            <div
              key={pilar.titulo}
              className="border-t pt-8"
              style={{ borderColor: pilar.cor }}
            >
              <div
                className={`mb-8 h-16 w-16 ${pilar.forma}`}
                style={{ backgroundColor: pilar.cor }}
              />

              <h3
                className="mb-4 text-3xl font-bold"
                style={{ color: pilar.cor }}
              >
                {pilar.titulo}
              </h3>

              <p className="leading-8 text-slate-600">
                {pilar.descricao}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}