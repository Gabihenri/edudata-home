const turmas = [
  {
    nome: '3ª Série A',
    estudantes: 36,
    disciplina: 'Física',
    status: 'Ativa',
  },
  {
    nome: '2ª Série B',
    estudantes: 34,
    disciplina: 'Física',
    status: 'Ativa',
  },
  {
    nome: '1ª Série C',
    estudantes: 38,
    disciplina: 'Física',
    status: 'Ativa',
  },
  {
    nome: '8º Ano A',
    estudantes: 32,
    disciplina: 'Matemática',
    status: 'Ativa',
  },
]

export function AgendaClasses() {
  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#5C1A8C]">
          Agenda Inteligente EDI
        </p>

        <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-950 md:text-6xl">
          Turmas
        </h1>

        <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">
          Gerencie suas turmas, disciplinas e estudantes em um único ambiente
          integrado à Agenda Inteligente EDI.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {turmas.map((turma) => (
            <article
              key={turma.nome}
              className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"
            >
              <h2 className="text-2xl font-bold text-slate-950">
                {turma.nome}
              </h2>

              <div className="mt-6 space-y-2 text-slate-600">
                <p>
                  <strong>Disciplina:</strong> {turma.disciplina}
                </p>

                <p>
                  <strong>Estudantes:</strong> {turma.estudantes}
                </p>

                <p>
                  <strong>Status:</strong> {turma.status}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}