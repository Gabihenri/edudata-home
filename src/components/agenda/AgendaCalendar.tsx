const eventos = [
  {
    data: 'Segunda',
    titulo: 'Planejamento semanal',
    tipo: 'Planejamento',
    horario: '14h20',
  },
  {
    data: 'Terça',
    titulo: 'Registro de evidências',
    tipo: 'Evidências',
    horario: '16h00',
  },
  {
    data: 'Quarta',
    titulo: 'Acompanhamento pedagógico',
    tipo: 'Gestão',
    horario: '15h30',
  },
  {
    data: 'Quinta',
    titulo: 'Formação docente',
    tipo: 'Academy',
    horario: '18h00',
  },
  {
    data: 'Sexta',
    titulo: 'Análise de indicadores',
    tipo: 'Analytics',
    horario: '17h20',
  },
]

export function AgendaCalendar() {
  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#5C1A8C]">
          Agenda Inteligente EDI
        </p>

        <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-950 md:text-6xl">
          Calendário pedagógico
        </h1>

        <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">
          Organize aulas, reuniões, formações, prazos e evidências em uma visão
          semanal integrada.
        </p>

        <div className="mt-12 grid gap-5 md:grid-cols-5">
          {eventos.map((evento) => (
            <article
              key={`${evento.data}-${evento.titulo}`}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#5C1A8C]">
                {evento.data}
              </p>

              <h2 className="mt-5 text-xl font-bold text-slate-950">
                {evento.titulo}
              </h2>

              <p className="mt-3 text-sm font-semibold text-slate-500">
                {evento.tipo}
              </p>

              <p className="mt-6 rounded-full bg-[#081C2E] px-4 py-2 text-center text-sm font-bold text-white">
                {evento.horario}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}