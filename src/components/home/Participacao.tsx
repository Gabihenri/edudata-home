export default function Participacao() {
  const caminhos = [
    {
      titulo: 'Programa Professor Digital',
      descricao:
        'Participe das formações em Inteligência Artificial, Google Workspace, Canva, LaTeX, Dashboards e Framework EDI.',
      destaque: 'Formação',
    },
    {
      titulo: 'Consultorias EduData IA',
      descricao:
        'Solicite diagnósticos institucionais, projetos de dados, consultorias e apoio à transformação digital.',
      destaque: 'Escolas e Redes',
    },
    {
      titulo: 'Comunidade EduData IA',
      descricao:
        'Acompanhe a evolução do Framework EDI, da Agenda Inteligente e participe da construção do ecossistema.',
      destaque: 'Comunidade',
    },
    {
      titulo: 'Projetos de Inovação',
      descricao:
        'Desenvolva projetos em IA, Ciência de Dados, Tecnologia Maker, Analytics e Tecnologia Assistiva.',
      destaque: 'Parcerias',
    },
  ]

  return (
    <section id="participacao" className="bg-[#081C2E] px-6 py-28 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-slate-300">
              Comunidade EduData IA
            </p>

            <h2 className="text-4xl font-bold leading-tight tracking-tight md:text-6xl">
              Faça parte da construção do ecossistema EduData IA.
            </h2>

            <p className="mt-8 max-w-2xl text-lg leading-8 text-slate-300">
              Acompanhe a evolução do Framework EDI, participe das formações,
              conheça novos projetos e contribua para o desenvolvimento de
              soluções educacionais baseadas em Evidências, Inclusão e
              Inteligência.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <a
                href="mailto:sabinohc@gmail.com?subject=Comunidade EduData IA"
                className="rounded-full bg-white px-8 py-4 font-semibold text-[#081C2E] transition hover:opacity-90"
              >
                Entrar para a Comunidade
              </a>

              <a
                href="#professor-digital"
                className="rounded-full border border-white/30 px-8 py-4 font-semibold text-white transition hover:bg-white hover:text-[#081C2E]"
              >
                Conhecer o Professor Digital
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
          <p className="mx-auto max-w-4xl text-2xl font-light leading-relaxed text-slate-300">
            A EduData IA acredita que a transformação da educação acontece
            quando metodologia, pessoas, tecnologia e evidências trabalham de
            forma integrada.
          </p>
        </div>
      </div>
    </section>
  )
}