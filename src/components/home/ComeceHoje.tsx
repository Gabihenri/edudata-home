export default function ComeceHoje() {
  const cards = [
    {
      titulo: 'Professor Digital',
      descricao:
        'Programa de desenvolvimento profissional para professores que desejam utilizar Inteligência Artificial, dados e metodologias inovadoras em sua prática pedagógica.',
      botao: 'Conhecer Programa',
      link: '#professor-digital',
      cor: 'bg-[#0A3A5E]',
    },
    {
      titulo: 'Consultorias EduData IA',
      descricao:
        'Consultorias em gestão educacional, ciência de dados, automação, indicadores, formação docente e transformação digital para escolas e redes de ensino.',
      botao: 'Solicitar Diagnóstico',
      link: '#consultorias',
      cor: 'bg-[#1B6B3A]',
    },
    {
      titulo: 'EduData Insights',
      descricao:
        'Diagnósticos, dashboards, análises de indicadores e inteligência educacional para apoiar decisões baseadas em evidências.',
      botao: 'Conhecer Solução',
      link: '#insights',
      cor: 'bg-[#5C1A8C]',
    },
  ]

  return (
    <section className="bg-white px-6 py-24 md:px-20">
      <div className="mx-auto max-w-7xl">

        <div className="mb-14 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
            Comece Hoje
          </p>

          <h2 className="text-4xl font-bold text-[#0A3A5E]">
            Conheça as primeiras formas de fazer parte da EduData IA
          </h2>

          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-600">
            Seja você professor, gestor ou instituição de ensino, a EduData IA
            oferece caminhos para iniciar sua jornada em direção a uma educação
            baseada em Evidências, Inclusão e Inteligência.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {cards.map((card) => (
            <div
              key={card.titulo}
              className="flex flex-col rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition duration-300 hover:-translate-y-2 hover:shadow-xl"
            >
              <h3 className="mb-4 text-2xl font-bold text-[#0A3A5E]">
                {card.titulo}
              </h3>

              <p className="flex-1 text-slate-600 leading-8">
                {card.descricao}
              </p>

              <a
                href={card.link}
                className={`mt-8 inline-flex justify-center rounded-full px-6 py-3 font-semibold text-white transition hover:opacity-90 ${card.cor}`}
              >
                {card.botao}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}