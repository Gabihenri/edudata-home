export default function Participacao() {
  const caminhos = [
    {
      titulo: 'Solicitar demonstração',
      descricao:
        'Conheça como a EduData IA pode apoiar sua escola, rede ou instituição.',
      destaque: 'Para gestores e instituições',
    },
    {
      titulo: 'Participar da Academy',
      descricao:
        'Inicie uma trilha de formação em IA, dados, inclusão e tecnologia educacional.',
      destaque: 'Para educadores',
    },
    {
      titulo: 'Conhecer o ecossistema',
      descricao:
        'Entenda como Framework EDI, Agenda, Analytics, SGPA e Academy se conectam.',
      destaque: 'Para parceiros',
    },
    {
      titulo: 'Desenvolver projetos',
      descricao:
        'Construa soluções educacionais com dados, automação, IA, maker e acessibilidade.',
      destaque: 'Para inovação',
    },
  ]

  return (
    <section id="participar" className="bg-[#081C2E] px-6 py-28 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-slate-300">
              Participar
            </p>

            <h2 className="text-4xl font-bold leading-tight tracking-tight md:text-6xl">
              Faça parte do ecossistema EduData IA.
            </h2>

            <p className="mt-8 max-w-2xl text-lg leading-8 text-slate-300">
              A EduData IA conecta educadores, gestores, instituições e parceiros
              em torno de uma educação orientada por evidências, inclusão e
              inteligência.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <a
                href="mailto:sabinohc@gmail.com?subject=Solicitar demonstração EduData IA"
                className="rounded-full bg-white px-8 py-4 font-semibold text-[#081C2E] transition hover:opacity-90"
              >
                Solicitar demonstração
              </a>

              <a
                href="#academy"
                className="rounded-full border border-white/30 px-8 py-4 font-semibold text-white transition hover:bg-white hover:text-[#081C2E]"
              >
                Conhecer a Academy
              </a>
            </div>
          </div>

          <div className="grid gap-5">
            {caminhos.map((item) => (
              <div
                key={item.titulo}
                className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur"
              >
                <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                  {item.destaque}
                </p>

                <h3 className="text-2xl font-bold text-white">
                  {item.titulo}
                </h3>

                <p className="mt-3 leading-7 text-slate-300">
                  {item.descricao}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-20 border-t border-white/10 pt-10 text-center">
          <p className="text-2xl font-light leading-relaxed text-slate-300">
            Transformamos evidências em decisões, inclusão em oportunidades e
            inteligência em ação.
          </p>
        </div>
      </div>
    </section>
  )
}
