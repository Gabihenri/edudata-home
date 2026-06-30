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
        <div className="max-w-4xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
            Framework EDI
          </p>

          <h2 className="text-5xl font-bold tracking-tight text-slate-950 md:text-6xl">
            O fundamento de todo o ecossistema EduData IA.
          </h2>

          <p className="mt-8 text-xl leading-9 text-slate-600">
            O Framework EDI constitui a base metodológica da EduData IA,
            integrando <strong>Evidências</strong>, <strong>Inclusão</strong> e
            <strong> Inteligência</strong> para orientar pessoas, instituições e
            tecnologias na construção de uma educação mais eficiente,
            acessível e inovadora.
          </p>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-500">
            Todos os produtos, formações, consultorias, pesquisas e soluções da
            EduData IA derivam do Framework EDI, garantindo unidade
            metodológica, coerência estratégica e integração entre todos os
            componentes do ecossistema.
          </p>

          <div className="mt-10">
            <a
              href="#ecossistema"
              className="inline-flex rounded-full bg-[#0A3A5E] px-7 py-4 font-semibold text-white transition hover:opacity-90"
            >
              Ver o Ecossistema EDI
            </a>
          </div>
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