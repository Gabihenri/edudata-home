const objetivos = [
  {
    titulo: 'Elevar a aprendizagem',
    categoria: 'Pedagógico',
    descricao:
      'Planejar ações para melhorar os resultados de aprendizagem com base em evidências.',
  },
  {
    titulo: 'Fortalecer a participação',
    categoria: 'Engajamento',
    descricao:
      'Promover estratégias que ampliem a participação dos estudantes nas atividades.',
  },
  {
    titulo: 'Acompanhar indicadores',
    categoria: 'Gestão',
    descricao:
      'Monitorar indicadores educacionais para apoiar a tomada de decisão.',
  },
  {
    titulo: 'Desenvolvimento profissional',
    categoria: 'Formação',
    descricao:
      'Registrar metas de formação e evolução contínua dos professores.',
  },
]

export function AgendaGoals() {
  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#5C1A8C]">
          Agenda Inteligente EDI
        </p>

        <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-950 md:text-6xl">
          Objetivos
        </h1>

        <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">
          Defina metas pedagógicas e acompanhe sua evolução integrada ao
          Framework EDI.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {objetivos.map((objetivo) => (
            <article
              key={objetivo.titulo}
              className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"
            >
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#5C1A8C]">
                {objetivo.categoria}
              </p>

              <h2 className="mt-4 text-2xl font-bold text-slate-950">
                {objetivo.titulo}
              </h2>

              <p className="mt-4 leading-7 text-slate-600">
                {objetivo.descricao}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}