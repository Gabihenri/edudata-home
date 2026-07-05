export function ProfessorDigital() {
  const etapas = [
    {
      numero: '01',
      titulo: 'Diagnóstico',
      descricao:
        'Identifica o estágio atual do educador, suas práticas, necessidades formativas e oportunidades de evolução.',
    },
    {
      numero: '02',
      titulo: 'Planejamento',
      descricao:
        'Organiza metas, prioridades e caminhos formativos conectados ao Framework EDI e à realidade escolar.',
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
        'Transforma aprendizagem em ação concreta por meio de ferramentas digitais, IA e metodologias aplicadas.',
    },
    {
      numero: '05',
      titulo: 'Evidências',
      descricao:
        'Registra práticas, experiências, materiais, resultados e produções relevantes do percurso formativo.',
    },
    {
      numero: '06',
      titulo: 'Indicadores',
      descricao:
        'Converte registros em dados para acompanhamento, análise e melhoria contínua da prática docente.',
    },
    {
      numero: '07',
      titulo: 'Certificação',
      descricao:
        'Reconhece a trajetória formativa e o desenvolvimento profissional baseado em evidências.',
    },
  ]

  const trilhas = [
    'IA aplicada à Educação',
    'Google Workspace',
    'Canva Educacional',
    'LaTeX',
    'Dashboards Educacionais',
    'Framework EDI',
    'Comunidade de prática',
    'Certificação',
  ]

  const links = [
    { label: 'Abrir Professor Digital', href: '/professor-digital' },
    { label: 'Perfil docente', href: '/professor-digital/perfil' },
    { label: 'Plano de desenvolvimento', href: '/professor-digital/plano' },
    { label: 'Evidências', href: '/professor-digital/evidencias' },
    { label: 'Recomendações', href: '/professor-digital/recomendacoes' },
    { label: 'Agenda integrada', href: '/professor-digital/agenda' },
  ]

  return (
    <section id="professor-digital" className="bg-[#F5F6F8] px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-16 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-[#1B6B3A]">
              Professor Digital
            </p>

            <h2 className="text-4xl font-bold leading-tight tracking-tight text-slate-950 md:text-6xl">
              Programa Professor Digital
            </h2>

            <p className="mt-8 max-w-2xl text-lg leading-8 text-slate-600">
              O Programa Professor Digital é a principal porta de entrada do
              ecossistema EduData IA. Ele prepara educadores para utilizar
              tecnologia, inteligência artificial, dados e metodologias
              inovadoras de forma prática, ética e aplicada à realidade escolar.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {trilhas.map((trilha) => (
                <span
                  key={trilha}
                  className="rounded-full border border-[#1B6B3A]/20 bg-white px-4 py-2 text-sm font-semibold text-[#1B6B3A]"
                >
                  {trilha}
                </span>
              ))}
            </div>

            <div className="mt-10 flex flex-wrap gap-3">
              {links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="rounded-full bg-[#0A3A5E] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  {link.label}
                </a>
              ))}
            </div>

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
            <div className="absolute left-7 top-8 hidden h-[calc(100%-4rem)] w-px bg-slate-300 lg:block" />

            <div className="space-y-5">
              {etapas.map((etapa) => (
                <div
                  key={etapa.numero}
                  className="relative rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="grid gap-5 sm:grid-cols-[72px_1fr]">
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
              Cada formação gera prática.
            </h3>
          </div>

          <div className="border-t border-[#1B6B3A] pt-6">
            <h3 className="text-xl font-bold text-[#1B6B3A]">
              Cada prática gera evidências.
            </h3>
          </div>

          <div className="border-t border-[#5C1A8C] pt-6">
            <h3 className="text-xl font-bold text-[#5C1A8C]">
              Cada evidência apoia decisões.
            </h3>
          </div>
        </div>
      </div>
    </section>
  )
}