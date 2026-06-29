export default function SolucoesEscolas() {
  const solucoes = [
    'Formação Docente',
    'Gestão baseada em Evidências',
    'Inteligência Educacional',
    'Consultorias Especializadas',
    'IA para Escolas',
    'Tecnologia Assistiva',
  ]

  return (
    <section id="escolas" className="bg-[#F5F6F8] px-6 py-24 md:px-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-14 max-w-3xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
            Para Escolas
          </p>

          <h2 className="text-4xl font-bold text-[#0A3A5E]">
            Soluções para Escolas
          </h2>

          <p className="mt-6 text-lg leading-8 text-slate-600">
            A EduData IA apoia escolas e redes de ensino na construção de
            processos mais inteligentes, organizados e orientados por
            evidências.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {solucoes.map((solucao) => (
            <div
              key={solucao}
              className="rounded-3xl border border-white bg-white p-7 shadow-sm"
            >
              <p className="text-xl font-bold text-[#0A3A5E]">{solucao}</p>
            </div>
          ))}
        </div>

        <a
          href="#participacao"
          className="mt-10 inline-flex rounded-full bg-[#0A3A5E] px-7 py-4 font-semibold text-white transition hover:opacity-90"
        >
          Agendar Conversa
        </a>
      </div>
    </section>
  )
}