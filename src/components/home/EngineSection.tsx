import { engine, engineCapabilities } from '@/lib/data/engine'

export default function EngineSection() {
  return (
    <section className="bg-[#081C2E] px-6 py-24 text-white">
      <div className="mx-auto max-w-7xl">

        <div className="mb-12 rounded-3xl border border-cyan-400/20 bg-cyan-400/5 p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">
            Sistema Operacional da Plataforma
          </p>

          <h2 className="mt-3 text-5xl font-bold">
            {engine.title}
          </h2>

          <p className="mt-3 text-2xl text-slate-200">
            {engine.subtitle}
          </p>

          <p className="mt-6 max-w-4xl leading-8 text-slate-300">
            {engine.description}
          </p>
        </div>

        <div className="grid gap-16 lg:grid-cols-[0.9fr_1.1fr]">

          <div>

            <h3 className="text-2xl font-bold">
              O EIOS coordena toda a inteligência da EduData IA
            </h3>

            <p className="mt-6 leading-8 text-slate-300">
              Todos os produtos compartilham o mesmo núcleo inteligente.
              O Framework EDI define a metodologia; o EIOS operacionaliza
              essa inteligência através de contexto, memória,
              conhecimento, recomendações, aprendizagem e apoio à decisão.
            </p>

            <div className="mt-10 rounded-3xl border border-emerald-400/20 bg-emerald-400/5 p-6">
              <h4 className="font-semibold text-emerald-300">
                Princípio Arquitetural
              </h4>

              <p className="mt-3 leading-8 text-slate-300">
                {engine.principle}
              </p>
            </div>

          </div>

          <div className="grid gap-5 md:grid-cols-2">

            {engineCapabilities.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:border-cyan-400/40 hover:bg-white/10"
              >
                <h3 className="text-lg font-semibold text-white">
                  {item.title}
                </h3>

                <p className="mt-4 leading-7 text-slate-300">
                  {item.description}
                </p>
              </div>
            ))}

          </div>

        </div>

      </div>
    </section>
  )
}