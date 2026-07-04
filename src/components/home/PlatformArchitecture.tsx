import { platform } from '@/lib/data/platform'

export default function PlatformArchitecture() {
  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-6">

        <div className="mx-auto max-w-4xl text-center">

          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#0A3A5E]">
            Arquitetura Oficial
          </p>

          <h2 className="mt-4 text-5xl font-bold text-[#081C2E]">
            Framework EDI → EIOS → Produtos
          </h2>

          <p className="mt-6 text-lg leading-8 text-slate-600">
            A EduData IA separa metodologia, tecnologia e aplicações.
            O Framework EDI orienta as decisões. O EIOS executa a inteligência.
            Os produtos utilizam os mesmos serviços inteligentes.
          </p>

        </div>

        <div className="mt-20 grid gap-8 md:grid-cols-4">

          {platform.layers.map((layer) => (
            <div
              key={layer.id}
              className="rounded-3xl border border-slate-200 bg-[#F8FAFC] p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >

              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-700">
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

        <div className="mt-16 rounded-3xl border border-[#0A3A5E]/10 bg-[#081C2E] p-10 text-white">

          <h3 className="text-3xl font-bold">
            Fluxo Oficial da Plataforma
          </h3>

          <div className="mt-10 flex flex-col items-center justify-center gap-6 text-center text-xl font-semibold lg:flex-row">

            <div>Framework EDI</div>

            <div className="text-cyan-400">→</div>

            <div>EIOS</div>

            <div className="text-cyan-400">→</div>

            <div>Core Compartilhado</div>

            <div className="text-cyan-400">→</div>

            <div>Produtos Inteligentes</div>

          </div>

        </div>

      </div>
    </section>
  )
}