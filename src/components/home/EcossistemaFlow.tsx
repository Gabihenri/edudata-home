export default function EcossistemaFlow() {
  const camadas = [
    {
      numero: '01',
      titulo: 'Framework EDI',
      papel: 'Fundamento metodológico',
      descricao:
        'Integra Evidências, Inclusão e Inteligência como base de todo o ecossistema EduData IA.',
      cor: '#0A3A5E',
    },
    {
      numero: '02',
      titulo: 'Programa Professor Digital',
      papel: 'Porta de entrada',
      descricao:
        'Desenvolve educadores por meio de IA, ferramentas digitais, dados, prática pedagógica e Framework EDI.',
      cor: '#1B6B3A',
    },
    {
      numero: '03',
      titulo: 'Agenda Inteligente EDI',
      papel: 'Planejamento e evidências',
      descricao:
        'Organiza planejamento, registros, evidências e acompanhamento pedagógico em uma plataforma em desenvolvimento.',
      cor: '#5C1A8C',
    },
    {
      numero: '04',
      titulo: 'EduData Analytics',
      papel: 'Inteligência educacional',
      descricao:
        'Transforma dados educacionais em indicadores, dashboards, diagnósticos e apoio à tomada de decisão.',
      cor: '#0A3A5E',
    },
    {
      numero: '05',
      titulo: 'SGPA',
      papel: 'Governança pedagógica',
      descricao:
        'Apoia organização, conformidade, monitoramento institucional, evidências e gestão educacional.',
      cor: '#1B6B3A',
    },
    {
      numero: '06',
      titulo: 'Escolas e Redes de Ensino',
      papel: 'Aplicação prática',
      descricao:
        'Conectam formação, gestão, dados e tecnologia aos desafios reais da educação.',
      cor: '#5C1A8C',
    },
    {
      numero: '07',
      titulo: 'Transformação Educacional',
      papel: 'Impacto esperado',
      descricao:
        'Resultado da integração entre metodologia, desenvolvimento profissional, inteligência e ação institucional.',
      cor: '#0A3A5E',
    },
  ]

  return (
    <section id="ecossistema" className="bg-[#F5F6F8] px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-4xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-[#0A3A5E]">
            Ecossistema EduData IA
          </p>

          <h2 className="text-4xl font-bold leading-tight tracking-tight text-slate-950 md:text-6xl">
            Uma jornada integrada para transformar evidências em impacto
            educacional.
          </h2>

          <p className="mt-8 max-w-3xl text-lg leading-8 text-slate-600">
            A EduData IA conecta metodologia, desenvolvimento profissional,
            planejamento pedagógico, inteligência analítica, governança e ação
            institucional em um ecossistema orientado por Evidências, Inclusão e
            Inteligência.
          </p>
        </div>

        <div className="mt-16 grid gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-start">
          <div className="relative">
            <div className="absolute left-7 top-8 hidden h-[calc(100%-4rem)] w-px bg-slate-300 md:block" />

            <div className="space-y-5">
              {camadas.map((camada) => (
                <div
                  key={camada.numero}
                  className="relative rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="grid gap-5 md:grid-cols-[72px_1fr]">
                    <div
                      className="flex h-14 w-14 items-center justify-center rounded-full text-sm font-bold text-white"
                      style={{ backgroundColor: camada.cor }}
                    >
                      {camada.numero}
                    </div>

                    <div>
                      <p
                        className="mb-2 text-sm font-semibold uppercase tracking-[0.2em]"
                        style={{ color: camada.cor }}
                      >
                        {camada.papel}
                      </p>

                      <h3 className="text-2xl font-bold text-slate-950">
                        {camada.titulo}
                      </h3>

                      <p className="mt-2 leading-7 text-slate-600">
                        {camada.descricao}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] bg-[#081C2E] p-8 text-white shadow-xl lg:sticky lg:top-32">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-300">
              Leitura estratégica
            </p>

            <h3 className="mt-6 text-3xl font-bold leading-tight">
              A EduData IA não é um produto isolado.
            </h3>

            <p className="mt-6 text-lg leading-8 text-slate-300">
              É uma arquitetura educacional em camadas. O Framework orienta a
              metodologia, o Programa Professor Digital desenvolve pessoas, a
              Agenda organiza evidências, o Analytics gera inteligência e o
              SGPA fortalece a governança pedagógica.
            </p>

            <div className="mt-10 grid gap-4">
              <div className="border-t border-[#0A3A5E] pt-4">
                <p className="font-semibold text-[#7DD3FC]">Método</p>
                <p className="text-slate-300">
                  Framework EDI como fundamento do ecossistema.
                </p>
              </div>

              <div className="border-t border-[#1B6B3A] pt-4">
                <p className="font-semibold text-[#A7F3D0]">
                  Desenvolvimento
                </p>
                <p className="text-slate-300">
                  Professor Digital como porta de entrada.
                </p>
              </div>

              <div className="border-t border-[#5C1A8C] pt-4">
                <p className="font-semibold text-[#DDD6FE]">Inteligência</p>
                <p className="text-slate-300">
                  Agenda, Analytics e SGPA conectando dados à decisão.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          <div className="border-t border-[#0A3A5E] pt-6">
            <h3 className="text-xl font-bold text-[#0A3A5E]">
              Metodologia orienta pessoas.
            </h3>
          </div>

          <div className="border-t border-[#1B6B3A] pt-6">
            <h3 className="text-xl font-bold text-[#1B6B3A]">
              Evidências estruturam decisões.
            </h3>
          </div>

          <div className="border-t border-[#5C1A8C] pt-6">
            <h3 className="text-xl font-bold text-[#5C1A8C]">
              Inteligência gera transformação.
            </h3>
          </div>
        </div>
      </div>
    </section>
  )
}