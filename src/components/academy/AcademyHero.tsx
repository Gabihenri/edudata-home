export default function AcademyHero() {
  return (
    <section className="bg-gradient-to-br from-[#F5F6F8] via-white to-[#E8EEF4] px-6 py-24 md:px-20">
      <div className="mx-auto max-w-7xl">

        <div className="grid gap-16 md:grid-cols-[1fr_0.9fr] md:items-center">

          <div>

            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
              EduData IA Academy
            </p>

            <h1 className="text-5xl font-bold leading-tight text-[#0A3A5E] md:text-6xl">
              Aprenda. Desenvolva. Transforme.
            </h1>

            <p className="mt-8 max-w-2xl text-xl leading-9 text-slate-600">
              A Academy é a porta de entrada para o ecossistema EduData IA.
              Desenvolvemos professores, gestores e instituições por meio de
              formações baseadas no Framework EDI, conectando Evidências,
              Inclusão e Inteligência.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">

              <a
                href="#courses"
                className="rounded-full bg-[#0A3A5E] px-8 py-4 font-semibold text-white transition hover:opacity-90"
              >
                Explorar Cursos
              </a>

              <a
                href="/"
                className="rounded-full border border-[#0A3A5E] px-8 py-4 font-semibold text-[#0A3A5E] transition hover:bg-[#0A3A5E] hover:text-white"
              >
                Voltar ao Ecossistema
              </a>

            </div>

          </div>

          <div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-10 shadow-xl">

              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
                Destaques
              </p>

              <div className="mt-8 space-y-5">

                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700">
                    Cursos
                  </span>

                  <span className="text-3xl font-bold text-[#0A3A5E]">
                    5
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700">
                    Certificados
                  </span>

                  <span className="text-3xl font-bold text-[#1B6B3A]">
                    Sim
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700">
                    Modalidade
                  </span>

                  <span className="text-3xl font-bold text-[#5C1A8C]">
                    Online
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700">
                    Framework
                  </span>

                  <span className="text-xl font-bold text-[#0A3A5E]">
                    EDI
                  </span>
                </div>

              </div>

            </div>

          </div>

        </div>

      </div>
    </section>
  )
}