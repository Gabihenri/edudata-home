const aulas = [
  {
    titulo: 'Potência elétrica e consumo de energia',
    turma: '3ª Série A',
    disciplina: 'Física',
    status: 'Planejada',
  },
  {
    titulo: 'Circuitos elétricos simples',
    turma: '3ª Série B',
    disciplina: 'Física',
    status: 'Em preparação',
  },
  {
    titulo: 'Função afim aplicada a problemas reais',
    turma: '8º Ano A',
    disciplina: 'Matemática',
    status: 'Planejada',
  },
  {
    titulo: 'Revisão para avaliação bimestral',
    turma: '2ª Série B',
    disciplina: 'Física',
    status: 'Pendente',
  },
]

export function AgendaLessons() {
  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#5C1A8C]">
          Agenda Inteligente EDI
        </p>

        <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-950 md:text-6xl">
          Aulas
        </h1>

        <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">
          Organize aulas, objetivos, turmas, disciplinas e status de execução
          em uma visão conectada ao planejamento e às evidências.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {aulas.map((aula) => (
            <article
              key={aula.titulo}
              className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"
            >
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#5C1A8C]">
                {aula.disciplina}
              </p>

              <h2 className="mt-4 text-2xl font-bold text-slate-950">
                {aula.titulo}
              </h2>

              <div className="mt-6 space-y-2 text-slate-600">
                <p>
                  <strong>Turma:</strong> {aula.turma}
                </p>

                <p>
                  <strong>Status:</strong> {aula.status}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}