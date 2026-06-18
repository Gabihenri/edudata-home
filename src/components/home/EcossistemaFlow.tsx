export default function EcossistemaFlow() {
  const fluxo = [
    'Framework EDI',
    'Professor Digital',
    'Agenda Inteligente EDI',
    'EduData Analytics',
    'SGPA',
  ]

  return (
    <section id="ecossistema" className="bg-white px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-[#0A3A5E]">
          Ecossistema EduData IA
        </p>

        <h2 className="max-w-4xl text-4xl font-bold tracking-tight text-slate-950 md:text-5xl">
          Uma metodologia conectada a produtos, dados e governança.
        </h2>

        <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-700">
          A EduData IA conecta desenvolvimento profissional, registro de ações educacionais,
          análise de dados e governança institucional em um único ecossistema.
        </p>

        <div className="mt-12 grid gap-4 md:grid-cols-5">
          {fluxo.map((item) => (
            <div
              key={item}
              className="rounded-3xl border border-slate-200 bg-[#F5F6F8] p-6 text-center"
            >
              <h3 className="font-semibold text-slate-900">{item}</h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
