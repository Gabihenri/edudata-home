const tarefas = [
  {
    titulo: 'Revisar planejamento semanal',
    categoria: 'Planejamento',
    prioridade: 'Alta',
    prazo: 'Hoje',
    status: 'Pendente',
  },
  {
    titulo: 'Registrar evidências da aula prática',
    categoria: 'Evidências',
    prioridade: 'Alta',
    prazo: 'Amanhã',
    status: 'Em andamento',
  },
  {
    titulo: 'Atualizar metas da turma',
    categoria: 'Indicadores',
    prioridade: 'Média',
    prazo: 'Esta semana',
    status: 'Pendente',
  },
  {
    titulo: 'Concluir formação docente',
    categoria: 'Academy',
    prioridade: 'Média',
    prazo: 'Sexta-feira',
    status: 'Em andamento',
  },
]

export function AgendaTasks() {
  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#5C1A8C]">
          Agenda Inteligente EDI
        </p>

        <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-950 md:text-6xl">
          Tarefas e pendências
        </h1>

        <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">
          Organize prioridades, prazos, pendências e ações pedagógicas em uma
          visão operacional integrada ao EIOS.
        </p>

        <div className="mt-12 grid gap-5">
          {tarefas.map((tarefa) => (
            <article
              key={tarefa.titulo}
              className="grid gap-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-[1.4fr_0.8fr_0.6fr_0.6fr]"
            >
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#5C1A8C]">
                  {tarefa.categoria}
                </p>

                <h2 className="mt-3 text-xl font-bold text-slate-950">
                  {tarefa.titulo}
                </h2>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-500">
                  Prioridade
                </p>
                <p className="mt-2 font-bold text-slate-950">
                  {tarefa.prioridade}
                </p>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-500">Prazo</p>
                <p className="mt-2 font-bold text-slate-950">{tarefa.prazo}</p>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-500">Status</p>
                <p className="mt-2 rounded-full bg-[#081C2E] px-4 py-2 text-center text-sm font-bold text-white">
                  {tarefa.status}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}