export default function NossosProdutos() {
  const produtos = [
    {
      nome: 'Professor Digital',
      status: 'Disponível',
      descricao:
        'Programa de formação para educadores em IA, ferramentas digitais, dados, Canva, LaTeX, dashboards e Framework EDI.',
      cor: '#1B6B3A',
    },
    {
      nome: 'Consultorias EduData IA',
      status: 'Disponível',
      descricao:
        'Diagnósticos, formação, ciência de dados, automação e apoio à transformação digital de escolas e redes.',
      cor: '#0A3A5E',
    },
    {
      nome: 'EduData Analytics',
      status: 'Disponível',
      descricao:
        'Dashboards, indicadores educacionais, diagnósticos e inteligência para tomada de decisão baseada em evidências.',
      cor: '#0A3A5E',
    },
    {
      nome: 'SGPA',
      status: 'Disponível',
      descricao:
        'Sistema de apoio à gestão pedagógica, governança documental, monitoramento e organização de evidências.',
      cor: '#1B6B3A',
    },
    {
      nome: 'Agenda Inteligente EDI',
      status: 'Em desenvolvimento',
      descricao:
        'Plataforma em construção para conectar planejamento, registros, evidências, indicadores e inteligência educacional.',
      cor: '#5C1A8C',
    },
    {
      nome: 'EduData Academy',
      status: 'Em expansão',
      descricao:
        'Ambiente de trilhas, cursos, formações e certificações para profissionais da educação.',
      cor: '#5C1A8C',
    },
  ]

  return (
    <section id="produtos" className="bg-[#F5F6F8] px-6 py-24 md:px-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-14 max-w-4xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
            Nossos Produtos
          </p>

          <h2 className="text-4xl font-bold leading-tight text-[#0A3A5E] md:text-6xl">
            Soluções que conectam formação, dados, gestão e inteligência.
          </h2>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">
            O ecossistema EduData IA reúne produtos, programas e soluções em
            diferentes estágios de desenvolvimento para apoiar professores,
            escolas, gestores e redes de ensino.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {produtos.map((produto) => (
            <div
              key={produto.nome}
              className="flex flex-col rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"
            >
              <div className="mb-6 flex items-center justify-between gap-4">
                <span
                  className="rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white"
                  style={{ backgroundColor: produto.cor }}
                >
                  {produto.status}
                </span>
              </div>

              <h3 className="text-2xl font-bold text-slate-950">
                {produto.nome}
              </h3>

              <p className="mt-4 flex-1 leading-7 text-slate-600">
                {produto.descricao}
              </p>
            </div>
          ))}
        </div>

        <a
          href="#ecossistema"
          className="mt-10 inline-flex rounded-full bg-[#0A3A5E] px-7 py-4 font-semibold text-white transition hover:opacity-90"
        >
          Conhecer o Ecossistema
        </a>
      </div>
    </section>
  )
}