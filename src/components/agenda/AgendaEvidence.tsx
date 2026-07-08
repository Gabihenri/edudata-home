const evidencias = [
  {
    titulo: 'Registro de aula',
    tipo: 'Prática pedagógica',
    descricao:
      'Documentação de aulas, metodologias, recursos utilizados, participação dos estudantes e encaminhamentos.',
  },
  {
    titulo: 'Produção dos estudantes',
    tipo: 'Aprendizagem',
    descricao:
      'Organização de produções, atividades, avaliações, registros fotográficos, links e arquivos.',
  },
  {
    titulo: 'Ação de apoio',
    tipo: 'Intervenção',
    descricao:
      'Evidências de acompanhamento individual, recuperação, adaptação, tutoria ou apoio pedagógico.',
  },
  {
    titulo: 'Reunião pedagógica',
    tipo: 'Gestão',
    descricao:
      'Registro de pautas, decisões, encaminhamentos, responsáveis, prazos e devolutivas institucionais.',
  },
]

export function AgendaEvidence() {
  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#5C1A8C]">
          Agenda Inteligente EDI
        </p>

        <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-950 md:text-6xl">
          Evidências pedagógicas
        </h1>

        <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">
          Registre práticas, ações, produções, reuniões e resultados em uma
          estrutura preparada para análise pedagógica e tomada de decisão.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {evidencias.map((item) => (
            <article
              key={item.titulo}
              className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm"
            >
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#5C1A8C]">
                {item.tipo}
              </p>

              <h2 className="mt-4 text-2xl font-bold text-slate-950">
                {item.titulo}
              </h2>

              <p className="mt-4 leading-7 text-slate-600">
                {item.descricao}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-12 rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
            Tipos de evidência
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-4">
            {['Texto', 'Imagem', 'PDF', 'Link'].map((tipo) => (
              <div
                key={tipo}
                className="rounded-2xl bg-[#081C2E] p-5 text-center font-bold text-white"
              >
                {tipo}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}