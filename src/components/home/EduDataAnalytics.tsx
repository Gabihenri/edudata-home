export default function EduDataAnalytics() {
  const fluxo = [
    {
      numero: '01',
      titulo: 'Registros',
      descricao:
        'Dados gerados a partir da Agenda Inteligente EDI e das ações educacionais.',
    },
    {
      numero: '02',
      titulo: 'Evidências',
      descricao:
        'Documentos, práticas, resultados e produções transformados em informação estruturada.',
    },
    {
      numero: '03',
      titulo: 'Indicadores',
      descricao:
        'Consolidação de métricas para acompanhamento pedagógico e institucional.',
    },
    {
      numero: '04',
      titulo: 'Insights',
      descricao:
        'Identificação de tendências, oportunidades e pontos de atenção.',
    },
    {
      numero: '05',
      titulo: 'Decisões',
      descricao:
        'Apoio estratégico para gestores, coordenadores e educadores.',
    },
  ]

  const aplicacoes = [
    'Painéis Estratégicos',
    'Indicadores Pedagógicos',
    'Monitoramento Institucional',
    'Análise de Tendências',
    'Relatórios Automatizados',
    'Tomada de Decisão',
  ]

  return (
    <section id="analytics" className="bg-white px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-16 md:grid-cols-[0.95fr_1.05fr] md:items-start">
          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-[#0A3A5E]">
              EduData Analytics
            </p>

            <h2 className="text-4xl font-bold leading-tight tracking-tight text-slate-950 md:text-6xl">
              Transformando evidências em inteligência educacional.
            </h2>

            <p className="mt-8 max-w-2xl text-lg leading-8 text-slate-600">
              O EduData Analytics converte registros e evidências em indicadores,
              insights e informações estratégicas para apoiar a tomada de decisão
              em todos os níveis da organização educacional.
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
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#0A3A5E] text-sm font-bold text-white">
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
            Aplicações do Analytics
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
              Evidências revelam padrões.
            </h3>
          </div>

          <div className="border-t border-[#1B6B3A] pt-6">
            <h3 className="text-xl font-bold text-[#1B6B3A]">
              Indicadores apoiam decisões.
            </h3>
          </div>

          <div className="border-t border-[#5C1A8C] pt-6">
            <h3 className="text-xl font-bold text-[#5C1A8C]">
              Inteligência impulsiona resultados.
            </h3>
          </div>
        </div>
      </div>
    </section>
  )
}
