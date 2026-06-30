export default function Consultorias() {
  const consultorias = [
    {
      titulo: 'Gestão Educacional',
      descricao:
        'Apoio à organização de processos pedagógicos, planejamento estratégico e gestão baseada em evidências.',
    },
    {
      titulo: 'Ciência de Dados',
      descricao:
        'Análise de bases educacionais, indicadores, diagnósticos e relatórios para tomada de decisão.',
    },
    {
      titulo: 'Business Intelligence',
      descricao:
        'Construção de dashboards, painéis gerenciais e acompanhamento visual de indicadores educacionais.',
    },
    {
      titulo: 'IA para Educação',
      descricao:
        'Aplicação prática de Inteligência Artificial em planejamento, relatórios, formações e processos escolares.',
    },
    {
      titulo: 'Formação Continuada',
      descricao:
        'Capacitações para professores, gestores e equipes escolares em tecnologia, dados e Framework EDI.',
    },
    {
      titulo: 'Tecnologia Assistiva',
      descricao:
        'Projetos e soluções voltadas à inclusão, acessibilidade e adaptação de recursos educacionais.',
    },
    {
      titulo: 'Projetos Maker',
      descricao:
        'Desenvolvimento de projetos com Arduino, Raspberry Pi, robótica, sensores e laboratórios de ciências.',
    },
    {
      titulo: 'Soluções Personalizadas',
      descricao:
        'Desenvolvimento de ferramentas, automações, relatórios e sistemas sob medida para instituições de ensino.',
    },
  ]

  return (
    <section id="consultorias" className="bg-[#F5F6F8] px-6 py-24 md:px-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-14 max-w-4xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
            Consultorias EduData IA
          </p>

          <h2 className="text-4xl font-bold leading-tight text-[#0A3A5E] md:text-6xl">
            Apoio especializado para transformar desafios educacionais em
            soluções práticas.
          </h2>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">
            Atuamos com diagnóstico, dados, tecnologia, formação e inovação para
            apoiar escolas, redes de ensino e profissionais da educação em
            decisões mais inteligentes e baseadas em evidências.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {consultorias.map((item) => (
            <div
              key={item.titulo}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <h3 className="text-xl font-bold text-[#0A3A5E]">
                {item.titulo}
              </h3>

              <p className="mt-4 leading-7 text-slate-600">
                {item.descricao}
              </p>
            </div>
          ))}
        </div>

        <a
          href="#participacao"
          className="mt-10 inline-flex rounded-full bg-[#0A3A5E] px-7 py-4 font-semibold text-white transition hover:opacity-90"
        >
          Solicitar Diagnóstico
        </a>
      </div>
    </section>
  )
}