export function ProfessorDigital() {
  const etapas = [
    {
      numero: '01',
      titulo: 'Diagnóstico',
      descricao:
        'Compreende o estágio atual do educador, suas práticas, necessidades e oportunidades de evolução.',
    },
    {
      numero: '02',
      titulo: 'Planejamento',
      descricao:
        'Organiza metas, prioridades e caminhos formativos conectados ao Framework EDI.',
    },
    {
      numero: '03',
      titulo: 'Formação',
      descricao:
        'Desenvolve competências digitais, pedagógicas, inclusivas e orientadas por dados.',
    },
    {
      numero: '04',
      titulo: 'Prática',
      descricao:
        'Transforma aprendizagem em ação concreta no cotidiano educacional.',
    },
    {
      numero: '05',
      titulo: 'Evidências',
      descricao:
        'Registra práticas, experiências, resultados e produções relevantes.',
    },
    {
      numero: '06',
      titulo: 'Indicadores',
      descricao:
        'Converte registros em dados para acompanhamento, análise e melhoria contínua.',
    },
    {
      numero: '07',
      titulo: 'Certificação',
      descricao:
        'Reconhece a trajetória formativa e o desenvolvimento profissional baseado em evidências.',
    },
  ]

  return (
    <section id="professor" className="bg-[#F5F6F8] px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-16 md:grid-cols-[0.95fr_1.05fr] md:items-start">
          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-[#1B6B3A]">
              Professor Digital
            </p>

            <h2 className="text-4xl font-bold leading-tight tracking-tight text-slate-950 md:text-6xl">
              Desenvolvimento profissional orientado por evidências.
            </h2>

            <p className="mt-8 max-w-2xl text-lg leading-8 text-slate-600">
              O Professor Digital é a porta de entrada da EduData IA. Ele organiza
              a evolução profissional por meio de diagnóstico, planejamento,
              formação, prática, evidências, indicadores e certificação.
            </p>

            <div className="mt-10 rounded-[2rem] border border-white/70 bg-white/70 p-8 shadow-sm backdrop-blur">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
                Conexão com o ecossistema
              </p>

              <div className="mt-6 space-y-3 text-lg font-semibold text-slate-800">
                <p>Professor Digital</p>
                <p className="text-[#1B6B3A]">↓</p>
                <p>Agenda Inteligente EDI</p>
                <p className="text-[#0A3A5E]">↓</p>
                <p>EduData Analytics</p>
                <p className="text-[#5C1A8C]">↓</p>
                <p>SGPA</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute left-7 top-8 hidden h-[calc(100%-4rem)] w-px bg-slate-300 md:block" />

            <div className="space-y-5">
              {etapas.map((etapa) => (
                <div
                  key={etapa.numero}
                  className="relative rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="grid gap-5 md:grid-cols-[72px_1fr]">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full border border-slate-300 bg-[#F5F6F8] text-sm font-bold text-[#0A3A5E]">
                      {etapa.numero}
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
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          <div className="border-t border-[#0A3A5E] pt-6">
            <h3 className="text-xl font-bold text-[#0A3A5E]">
              Cada ação gera evidências.
            </h3>
          </div>

          <div className="border-t border-[#1B6B3A] pt-6">
            <h3 className="text-xl font-bold text-[#1B6B3A]">
              Cada evidência gera dados.
            </h3>
          </div>

          <div className="border-t border-[#5C1A8C] pt-6">
            <h3 className="text-xl font-bold text-[#5C1A8C]">
              Cada dado apoia decisões.
            </h3>
          </div>
        </div>
      </div>
    </section>
  )
}