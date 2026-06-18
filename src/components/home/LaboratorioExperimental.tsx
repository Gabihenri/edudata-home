export default function LaboratorioExperimental() {
  const itens = [
    'Física Inclusiva',
    'Sonificação de Dados',
    'Tecnologia Assistiva',
    'Experimentos Acessíveis',
  ]

  return (
    <section id="laboratorio" className="bg-[#F5F6F8] px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-[#5C1A8C]">
          Ciência para Todos
        </p>

        <h2 className="max-w-4xl text-4xl font-bold tracking-tight text-slate-950 md:text-5xl">
          Laboratório Experimental de Ciências Acessível
        </h2>

        <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-700">
          Uma frente de inovação inclusiva para experimentos de Física, Química e Matemática,
          com descrição auditiva, sensores, sonificação de dados e inteligência educacional.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-4">
          {itens.map((item) => (
            <div key={item} className="rounded-3xl bg-white p-6 shadow-sm">
              <h3 className="font-semibold text-slate-900">{item}</h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
