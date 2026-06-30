export default function EduDataInsights() {
  const insights = [
    {
      titulo: 'Pesquisas Educacionais',
      descricao:
        'Estudos, análises e levantamentos sobre desafios, tendências e inovação na educação.',
    },
    {
      titulo: 'Dashboards e Indicadores',
      descricao:
        'Visualizações, painéis e análises para apoiar decisões baseadas em evidências.',
    },
    {
      titulo: 'Estudos de Caso',
      descricao:
        'Experiências, aplicações e resultados de projetos desenvolvidos no ecossistema EduData IA.',
    },
    {
      titulo: 'Templates',
      descricao:
        'Modelos de relatórios, planejamentos, diagnósticos, rubricas e materiais para educadores.',
    },
    {
      titulo: 'Artigos',
      descricao:
        'Conteúdos sobre IA, dados, gestão educacional, inclusão, tecnologia e Framework EDI.',
    },
    {
      titulo: 'Observatório da Educação',
      descricao:
        'Monitoramento de tendências, políticas públicas, indicadores, tecnologias emergentes e futuro da educação.',
    },
  ]

  return (
    <section id="insights" className="bg-white px-6 py-24 md:px-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-14 max-w-4xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
            EduData Insights
          </p>

          <h2 className="text-4xl font-bold leading-tight text-[#0A3A5E] md:text-6xl">
            Conhecimento para orientar decisões educacionais.
          </h2>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">
            O EduData Insights reúne conteúdos, pesquisas, dashboards, estudos
            de caso e boas práticas para fortalecer a inteligência educacional
            baseada em Evidências, Inclusão e Inteligência.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {insights.map((item) => (
            <div
              key={item.titulo}
              className="rounded-3xl border border-slate-200 bg-[#F5F6F8] p-7 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <h3 className="text-xl font-bold text-[#0A3A5E]">
                {item.titulo}
              </h3>

              <p className="mt-4 leading-7 text-slate-600">
                {item.descricao}
              </p>
            </div>
          ))}
        </div>

        <a
          href="#participacao"
          className="mt-10 inline-flex rounded-full bg-[#0A3A5E] px-7 py-4 font-semibold text-white transition hover:opacity-90"
        >
          Explorar Conteúdos
        </a>
      </div>
    </section>
  )
}