export default function EduDataAcademy() {
  const trilhas = [
    'Professor Digital',
    'IA para Educadores',
    'Google Workspace',
    'Canva Educacional',
    'LaTeX Acadêmico',
    'Automação Educacional',
    'Dados Educacionais',
    'Projetos Maker',
    'Educação Inclusiva',
    'Framework EDI',
    'Certificação EduData IA',
  ]

  return (
    <section id="academy" className="bg-white px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-[#5C1A8C]">
              EduData Academy
            </p>

            <h2 className="text-4xl font-bold leading-tight tracking-tight text-slate-950 md:text-6xl">
              Aprender. Aplicar. Evoluir.
            </h2>

            <p className="mt-8 max-w-2xl text-lg leading-8 text-slate-600">
              A EduData Academy é a porta de entrada formativa do ecossistema.
              Ela organiza trilhas de desenvolvimento profissional para educadores,
              gestores e instituições que desejam aplicar o Framework EDI na prática.
            </p>

            <div className="mt-10 rounded-[2rem] bg-[#081C2E] p-8 text-white shadow-xl">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-300">
                Jornada formativa
              </p>

              <div className="mt-6 grid gap-5 md:grid-cols-3">
                <div className="border-t border-[#0A3A5E] pt-4">
                  <p className="text-xl font-bold text-[#7DD3FC]">
                    Aprender
                  </p>
                  <p className="mt-2 text-slate-300">
                    Conhecer fundamentos, ferramentas e metodologias.
                  </p>
                </div>

                <div className="border-t border-[#1B6B3A] pt-4">
                  <p className="text-xl font-bold text-[#A7F3D0]">
                    Aplicar
                  </p>
                  <p className="mt-2 text-slate-300">
                    Transformar formação em prática educacional.
                  </p>
                </div>

                <div className="border-t border-[#5C1A8C] pt-4">
                  <p className="text-xl font-bold text-[#DDD6FE]">
                    Evoluir
                  </p>
                  <p className="mt-2 text-slate-300">
                    Acompanhar avanços, evidências e certificações.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-[#F5F6F8] p-6 shadow-sm">
            <p className="mb-8 text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
              Trilha de aprendizagem
            </p>

            <div className="relative">
              <div className="absolute left-5 top-4 hidden h-[calc(100%-2rem)] w-px bg-slate-300 md:block" />

              <div className="space-y-4">
                {trilhas.map((trilha, index) => (
                  <div
                    key={trilha}
                    className="relative grid gap-4 rounded-2xl bg-white p-5 shadow-sm md:grid-cols-[56px_1fr]"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#081C2E] text-sm font-bold text-white">
                      {String(index + 1).padStart(2, '0')}
                    </div>

                    <div>
                      <h3 className="text-xl font-bold text-slate-950">
                        {trilha}
                      </h3>

                      <p className="mt-1 text-slate-600">
                        Etapa formativa integrada à jornada EduData IA.
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-4">
          <div className="border-t border-[#0A3A5E] pt-6">
            <h3 className="text-xl font-bold text-[#0A3A5E]">
              Formação conecta pessoas.
            </h3>
          </div>

          <div className="border-t border-[#1B6B3A] pt-6">
            <h3 className="text-xl font-bold text-[#1B6B3A]">
              Prática gera evidências.
            </h3>
          </div>

          <div className="border-t border-[#5C1A8C] pt-6">
            <h3 className="text-xl font-bold text-[#5C1A8C]">
              Certificação reconhece trajetórias.
            </h3>
          </div>

          <div className="border-t border-slate-400 pt-6">
            <h3 className="text-xl font-bold text-slate-800">
              Comunidade sustenta evolução.
            </h3>
          </div>
        </div>
      </div>
    </section>
  )
}
