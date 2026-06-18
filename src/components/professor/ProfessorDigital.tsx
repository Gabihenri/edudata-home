export function ProfessorDigital() {
  const etapas = [
    {
      titulo: 'Diagnóstico',
      descricao: 'Compreensão do estágio atual de desenvolvimento profissional.',
    },
    {
      titulo: 'Trilhas',
      descricao: 'Percursos formativos conectados à prática educacional.',
    },
    {
      titulo: 'Acompanhamento',
      descricao: 'Evolução acompanhada por evidências, registros e indicadores.',
    },
    {
      titulo: 'Certificação',
      descricao: 'Reconhecimento da trajetória e das competências desenvolvidas.',
    },
  ]

  return (
    <section id="professor" className="bg-[#F5F6F8] px-6 py-32">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-16 md:grid-cols-[0.9fr_1.1fr] md:items-center">
          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-[#1B6B3A]">
              Professor Digital
            </p>

            <h2 className="text-5xl font-bold tracking-tight text-slate-950 md:text-6xl">
              Uma jornada de evolução profissional.
            </h2>

            <p className="mt-8 text-xl leading-9 text-slate-600">
              O Professor Digital é a porta de entrada da EduData IA. Ele organiza
              o desenvolvimento profissional a partir de diagnóstico, prática,
              acompanhamento e evidências de evolução.
            </p>

            <div className="mt-10 h-16 w-16 clip-polygon-diamond bg-[#1B6B3A]" />
          </div>

          <div className="space-y-6">
            {etapas.map((etapa, index) => (
              <div
                key={etapa.titulo}
                className="grid gap-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-[80px_1fr]"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-slate-300 text-lg font-bold text-[#0A3A5E]">
                  {String(index + 1).padStart(2, '0')}
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-slate-950">
                    {etapa.titulo}
                  </h3>

                  <p className="mt-2 leading-7 text-slate-600">
                    {etapa.descricao}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}