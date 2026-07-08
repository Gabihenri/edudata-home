const indicadores = [
  {
    titulo: 'Planejamentos',
    valor: '12',
    cor: 'bg-blue-600',
  },
  {
    titulo: 'Evidências',
    valor: '28',
    cor: 'bg-emerald-600',
  },
  {
    titulo: 'Aulas',
    valor: '42',
    cor: 'bg-violet-600',
  },
  {
    titulo: 'Pendências',
    valor: '04',
    cor: 'bg-amber-500',
  },
  {
    titulo: 'Formações',
    valor: '03',
    cor: 'bg-cyan-600',
  },
  {
    titulo: 'IA Score',
    valor: '94%',
    cor: 'bg-[#081C2E]',
  },
]

export function AgendaIndicators() {
  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#5C1A8C]">
          Agenda Inteligente EDI
        </p>

        <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-950 md:text-6xl">
          Indicadores
        </h1>

        <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">
          Acompanhe indicadores pedagógicos e operacionais da Agenda
          Inteligente EDI.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-3 lg:grid-cols-6">
          {indicadores.map((item) => (
            <article
              key={item.titulo}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div
                className={`mb-4 h-2 rounded-full ${item.cor}`}
              />

              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                {item.titulo}
              </p>

              <p className="mt-5 text-5xl font-bold text-[#081C2E]">
                {item.valor}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}