export default function PublicoAlvo() {
  const publicos = [
    {
      titulo: 'Professores',
      descricao:
        'Formação prática para uso de IA, ferramentas digitais, Canva, LaTeX, dashboards e metodologias inovadoras.',
      itens: ['Professor Digital', 'IA para Educação', 'Google Workspace', 'Canva', 'LaTeX'],
      cor: '#0A3A5E',
    },
    {
      titulo: 'Escolas',
      descricao:
        'Apoio para formação continuada, consultorias, gestão baseada em evidências e implantação do Framework EDI.',
      itens: ['Formação Continuada', 'Consultorias', 'Framework EDI', 'Gestão por Evidências'],
      cor: '#1B6B3A',
    },
    {
      titulo: 'Gestores',
      descricao:
        'Soluções para análise de indicadores, dashboards, governança pedagógica, relatórios e tomada de decisão.',
      itens: ['EduData Analytics', 'Dashboards', 'Indicadores', 'SGPA'],
      cor: '#5C1A8C',
    },
    {
      titulo: 'Redes de Ensino',
      descricao:
        'Projetos estratégicos em ciência de dados, diagnósticos institucionais e inteligência educacional.',
      itens: ['Diagnósticos', 'Ciência de Dados', 'Projetos Estratégicos', 'Inteligência Educacional'],
      cor: '#0A3A5E',
    },
  ]

  return (
    <section id="publico-alvo" className="bg-white px-6 py-24 md:px-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-14 max-w-4xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
            Para quem é a EduData IA?
          </p>

          <h2 className="text-4xl font-bold leading-tight text-[#0A3A5E] md:text-6xl">
            Soluções para professores, escolas, gestores e redes de ensino.
          </h2>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">
            A EduData IA organiza tecnologia, formação, dados e inteligência
            educacional para diferentes necessidades do ecossistema escolar.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {publicos.map((publico) => (
            <div
              key={publico.titulo}
              className="rounded-3xl border border-slate-200 bg-[#F5F6F8] p-8 shadow-sm"
            >
              <div
                className="mb-6 h-2 w-24 rounded-full"
                style={{ backgroundColor: publico.cor }}
              />

              <h3 className="text-2xl font-bold text-slate-950">
                {publico.titulo}
              </h3>

              <p className="mt-4 leading-7 text-slate-600">
                {publico.descricao}
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                {publico.itens.map((item) => (
                  <span
                    key={item}
                    className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <a
          href="#participacao"
          className="mt-10 inline-flex rounded-full bg-[#0A3A5E] px-7 py-4 font-semibold text-white transition hover:opacity-90"
        >
          Encontrar minha solução
        </a>
      </div>
    </section>
  )
}