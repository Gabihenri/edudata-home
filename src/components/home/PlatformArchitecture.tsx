import { platform } from '@/lib/data/platform'

export default function PlatformArchitecture() {
  return (
    <section className="py-24 bg-white">
      <div className="mx-auto max-w-7xl px-6">

        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#0A3A5E]">
            Plataforma EduData IA
          </p>

          <h2 className="mt-4 text-4xl font-bold text-[#081C2E]">
            {platform.title}
          </h2>

          <p className="mt-6 text-lg text-slate-600">
            Um único ecossistema, um único motor de inteligência,
            múltiplos produtos especializados.
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-5">
          {platform.layers.map((layer) => (
            <div
              key={layer.title}
              className="rounded-3xl border border-slate-200 bg-[#F8FAFC] p-8 shadow-sm"
            >
              <h3 className="text-xl font-bold text-[#0A3A5E]">
                {layer.title}
              </h3>

              <p className="mt-4 leading-7 text-slate-600">
                {layer.description}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}