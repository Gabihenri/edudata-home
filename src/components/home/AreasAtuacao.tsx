export default function AreasAtuacao() {
  const areas = [
    {
      titulo: 'Inteligência Artificial na Educação',
      grupo: 'Tecnologia',
    },
    {
      titulo: 'Ciência de Dados Educacionais',
      grupo: 'Dados',
    },
    {
      titulo: 'Business Intelligence',
      grupo: 'Dados',
    },
    {
      titulo: 'Gestão Educacional',
      grupo: 'Gestão',
    },
    {
      titulo: 'Formação Continuada',
      grupo: 'Formação',
    },
    {
      titulo: 'Google Workspace',
      grupo: 'Ferramentas',
    },
    {
      titulo: 'Microsoft Office',
      grupo: 'Ferramentas',
    },
    {
      titulo: 'Canva Educacional',
      grupo: 'Ferramentas',
    },
    {
      titulo: 'LaTeX',
      grupo: 'Produção Técnica',
    },
    {
      titulo: 'Dashboards Educacionais',
      grupo: 'Dados',
    },
    {
      titulo: 'Tecnologia Maker',
      grupo: 'Arduino • Raspberry Pi • Robótica',
    },
    {
      titulo: 'Tecnologia Assistiva',
      grupo: 'Inclusão',
    },
  ]

  return (
    <section id="areas-atuacao" className="bg-white px-6 py-24 md:px-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-14 max-w-4xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
            Áreas de Atuação
          </p>

          <h2 className="text-4xl font-bold leading-tight text-[#0A3A5E] md:text-6xl">
            Conhecimento aplicado para transformar a educação.
          </h2>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">
            A EduData IA integra tecnologia, formação, pesquisa e inteligência
            educacional para apoiar professores, gestores, escolas e redes de
            ensino na resolução de desafios reais da educação.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {areas.map((area) => (
            <div
              key={area.titulo}
              className="rounded-3xl border border-slate-200 bg-[#F5F6F8] p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                {area.grupo}
              </p>

              <h3 className="text-lg font-bold text-[#0A3A5E]">
                {area.titulo}
              </h3>
            </div>
          ))}
        </div>

        <div className="mt-12">
          <a
            href="#participacao"
            className="inline-flex rounded-full bg-[#0A3A5E] px-7 py-4 font-semibold text-white transition hover:opacity-90"
          >
            Conheça nossas soluções
          </a>
        </div>
      </div>
    </section>
  )
}