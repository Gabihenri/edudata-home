export function AgendaInteligente() {
  const fluxo = [
    {
      numero: '01',
      titulo: 'Planeje',
      descricao:
        'Organize objetivos, ações, projetos, formações, intervenções e metas de desenvolvimento educacional.',
    },
    {
      numero: '02',
      titulo: 'Registre',
      descricao:
        'Documente aulas, reuniões, apoios, práticas pedagógicas, atividades adaptadas e ações institucionais.',
    },
    {
      numero: '03',
      titulo: 'Evidencie',
      descricao:
        'Associe registros a evidências, relatos, documentos, produções, links, imagens e resultados observáveis.',
    },
    {
      numero: '04',
      titulo: 'Analise',
      descricao:
        'Transforme registros em indicadores para acompanhamento, tomada de decisão e melhoria contínua.',
    },
  ]

  const aplicacoes = [
    'Planejamento pedagógico',
    'Registro da prática profissional',
    'Gestão de evidências',
    'Acompanhamento de ações',
    'Indicadores educacionais',
    'Relatórios institucionais',
  ]

  return (
    <section id="agenda" className="bg-white px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-16 md:grid-cols-[0.95fr_1.05fr] md:items-start">
          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-[#5C1A8C]">
              Agenda Inteligente EDI
            </p>

            <h2 className="text-4xl font-bold leading-tight tracking-tight text-slate-950 md:text-6xl">
              O sistema operacional do desenvolvimento profissional.
            </h2>

            <p className="mt-8 max-w-2xl text-lg leading-8 text-slate-600">
              A Agenda Inteligente EDI transforma ações educacionais em registros,
              registros em evidências e evidências em dados para apoiar decisões,
              relatórios, Analytics e governança pedagógica.
            </p>

            <div className="mt-10 rounded-[2rem] bg-[#081C2E] p-8 text-white shadow-xl">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-300">
                Conexão estratégica
              </p>

              <div className="mt-6 space-y-3 text-lg font-semibold">
                <p>Agenda Inteligente EDI</p>
                <p className="text-[#7DD3FC]">↓</p>
                <p>EduData Analytics</p>
                <p className="text-[#A7F3D0]">↓</p>
                <p>SGPA</p>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            {fluxo.map((item) => (
              <div
                key={item.numero}
                className="rounded-3xl border border-slate-200 bg-[#F5F6F8] p-6 shadow-sm"
              >
                <div className="grid gap-5 md:grid-cols-[72px_1fr]">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#5C1A8C] text-sm font-bold text-white">
                    {item.numero}
                  </div>

                  <div>
                    <h3 className="text-2xl font-bold text-slate-950">
                      {item.titulo}
                    </h3>

                    <p className="mt-2 leading-7 text-slate-600">
                      {item.descricao}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16">
          <p className="mb-8 text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
            Aplicações da Agenda
          </p>

          <div className="grid gap-4 md:grid-cols-3">
            {aplicacoes.map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-slate-200 bg-white p-5 text-lg font-semibold text-slate-800 shadow-sm"
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          <div className="border-t border-[#0A3A5E] pt-6">
            <h3 className="text-xl font-bold text-[#0A3A5E]">
              Registros estruturam a prática.
            </h3>
          </div>

          <div className="border-t border-[#1B6B3A] pt-6">
            <h3 className="text-xl font-bold text-[#1B6B3A]">
              Evidências sustentam decisões.
            </h3>
          </div>

          <div className="border-t border-[#5C1A8C] pt-6">
            <h3 className="text-xl font-bold text-[#5C1A8C]">
              Dados alimentam inteligência.
            </h3>
          </div>
        </div>
      </div>
    </section>
  )
}