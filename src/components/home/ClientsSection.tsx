import { clients } from '@/lib/data/clients'

export default function ClientsSection() {
  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-6">

        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#0A3A5E]">
            Para quem é a Plataforma
          </p>

          <h2 className="mt-4 text-4xl font-bold text-[#081C2E]">
            Desenvolvida para todo o ecossistema educacional
          </h2>

          <p className="mt-6 text-lg leading-8 text-slate-600">
            A Plataforma EduData IA atende diferentes perfis, mantendo
            um único Framework EDI e um único EDI Intelligence Engine.
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {clients.map((client) => (
            <div
              key={client.title}
              className="rounded-3xl border border-slate-200 bg-[#F8FAFC] p-8 shadow-sm"
            >
              <h3 className="text-2xl font-bold text-[#0A3A5E]">
                {client.title}
              </h3>

              <p className="mt-4 leading-7 text-slate-600">
                {client.description}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}