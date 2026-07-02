import { engine, engineCapabilities } from '@/lib/data/engine'

export default function EngineSection() {
  return (
    <section className="bg-[#081C2E] px-6 py-24 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-300">
              Núcleo Inteligente
            </p>

            <h2 className="mt-4 text-4xl font-bold md:text-6xl">
              {engine.title}
            </h2>

            <p className="mt-6 text-xl leading-9 text-slate-300">
              {engine.subtitle}
            </p>

            <p className="mt-6 leading-8 text-slate-400">
              {engine.description}
            </p>

            <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6">
              <p className="font-semibold text-white">
                {engine.principle}
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {engineCapabilities.map((capability) => (
              <div
                key={capability.id}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur"
              >
                <h3 className="font-semibold text-slate-100">
                  {capability.title}
                </h3>

                <p className="mt-3 leading-7 text-slate-400">
                  {capability.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}