export default function FinalCTA() {
  return (
    <section className="bg-[#081C2E] px-6 py-24 text-white">
      <div className="mx-auto max-w-5xl text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-300">
          EduData IA Platform
        </p>

        <h2 className="mt-6 text-4xl font-bold leading-tight md:text-6xl">
          Um ecossistema para transformar dados, formação e gestão em inteligência educacional.
        </h2>

        <p className="mx-auto mt-8 max-w-3xl text-lg leading-8 text-slate-300">
          Conecte sua escola, rede ou instituição ao Framework EDI e ao EDI
          Intelligence Engine para desenvolver pessoas, organizar evidências e
          apoiar decisões educacionais com mais clareza.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <a
            href="#participacao"
            className="rounded-full bg-white px-8 py-4 font-semibold text-[#081C2E] transition hover:opacity-90"
          >
            Participar do Ecossistema
          </a>

          <a
            href="/academy"
            className="rounded-full border border-white px-8 py-4 font-semibold text-white transition hover:bg-white hover:text-[#081C2E]"
          >
            Conhecer a Academy
          </a>
        </div>
      </div>
    </section>
  )
}