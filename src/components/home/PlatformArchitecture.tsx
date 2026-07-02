import { platform } from '@/lib/data/platform'

export default function PlatformArchitecture() {
  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#0A3A5E]">
            Plataforma EduData IA
          </p>

          <h2 className="mt-4 text-4xl font-bold text-[#081C2E] md:text-5xl">
            {platform.title}
          </h2>

          <p className="mt-6 text-lg leading-8 text-slate-600">
            Um único ecossistema, um único motor de inteligência, múltiplos
            produtos especializados.
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {platform.layers.map((layer) => (
            <div
              key={layer.id}
              className="rounded-3xl border border-slate-200 bg-[#F8FAFC] p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#0A3A5E]">
                {layer.subtitle}
              </p>

              <h3 className="mt-4 text-2xl font-bold text-[#081C2E]">
                {layer.title}
              </h3>

              <p className="mt-5 leading-7 text-slate-600">
                {layer.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}