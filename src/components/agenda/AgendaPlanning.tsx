const planejamentos = [
  {
    titulo: 'Planejamento semanal',
    categoria: 'Rotina docente',
    descricao:
      'Organização das aulas, objetivos, metodologias, recursos e evidências previstas para a semana.',
  },
  {
    titulo: 'Intervenção pedagógica',
    categoria: 'Acompanhamento',
    descricao:
      'Registro de ações planejadas para apoiar estudantes, turmas ou grupos com necessidades específicas.',
  },
  {
    titulo: 'Projeto interdisciplinar',
    categoria: 'Projetos',
    descricao:
      'Estruturação de projetos com etapas, responsáveis, cronograma, evidências e indicadores de acompanhamento.',
  },
  {
    titulo: 'Formação docente',
    categoria: 'Academy',
    descricao:
      'Planejamento de estudos, trilhas formativas, cursos e aplicação prática na rotina pedagógica.',
  },
]

export function AgendaPlanning() {
  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#5C1A8C]">
          Agenda Inteligente EDI
        </p>

        <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-950 md:text-6xl">
          Planejamento pedagógico
        </h1>

        <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">
          Organize objetivos, ações, metodologias, recursos, prazos e
          evidências em uma estrutura alinhada ao Framework EDI.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {planejamentos.map((item) => (
            <article
              key={item.titulo}
              className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm"
            >
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#5C1A8C]">
                {item.categoria}
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

        <div className="mt-12 rounded-[2rem] bg-[#081C2E] p-8 text-white">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-300">
            Fluxo de planejamento
          </p>

          <h2 className="mt-4 text-3xl font-bold">
            Objetivo → Ação → Evidência → Indicador → Decisão
          </h2>

          <p className="mt-5 max-w-3xl leading-7 text-slate-200">
            Cada planejamento da Agenda deve gerar evidências e alimentar os
            indicadores pedagógicos da EduData IA.
          </p>
        </div>
      </div>
    </section>
  )
}