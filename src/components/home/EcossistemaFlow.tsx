import { products } from '@/lib/data/products'

function EcossistemaFlow() {
  const colors = ['#0A3A5E', '#1B6B3A', '#5C1A8C']

  const camadas = [
    {
      numero: '01',
      titulo: 'Framework EDI',
      papel: 'Metodologia',
      descricao:
        'Estabelece os princípios de Evidências, Inclusão e Inteligência que orientam todo o ecossistema EduData IA.',
      cor: '#0A3A5E',
    },
    ...products.map((product, index) => ({
      numero: String(index + 2).padStart(2, '0'),
      titulo: product.name,
      papel: product.featured ? 'Produto Estratégico' : 'Produto',
      descricao: product.description,
      cor: colors[index % colors.length],
    })),
  ]

  return (
    <section id="ecossistema" className="bg-[#F5F6F8] px-6 py-28">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-4xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-[#0A3A5E]">
            Ecossistema EduData IA
          </p>

          <h2 className="text-4xl font-bold leading-tight tracking-tight text-slate-950 md:text-6xl">
            Um ecossistema integrado para transformar a educação.
          </h2>

          <p className="mt-8 max-w-3xl text-lg leading-8 text-slate-600">
            O Framework EDI conecta metodologia, desenvolvimento profissional,
            registros pedagógicos, inteligência analítica, governança e formação
            continuada em uma arquitetura única de inteligência educacional.
          </p>
        </div>

        <div className="mt-20 grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div className="relative">
            <div className="absolute left-7 top-8 hidden h-[calc(100%-4rem)] w-px bg-slate-300 md:block" />

            <div className="space-y-5">
              {camadas.map((camada) => (
                <div
                  key={camada.numero}
                  className="relative rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="grid gap-5 md:grid-cols-[72px_1fr]">
                    <div
                      className="flex h-14 w-14 items-center justify-center rounded-full text-sm font-bold text-white"
                      style={{ backgroundColor: camada.cor }}
                    >
                      {camada.numero}
                    </div>

                    <div>
                      <p
                        className="mb-2 text-sm font-semibold uppercase tracking-[0.2em]"
                        style={{ color: camada.cor }}
                      >
                        {camada.papel}
                      </p>

                      <h3 className="text-2xl font-bold text-slate-950">
                        {camada.titulo}
                      </h3>

                      <p className="mt-2 leading-7 text-slate-600">
                        {camada.descricao}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] bg-[#081C2E] p-8 text-white shadow-xl lg:sticky lg:top-28">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-300">
              Arquitetura do Ecossistema
            </p>

            <h3 className="mt-6 text-3xl font-bold leading-tight">
              Tudo começa no Framework EDI.
            </h3>

            <p className="mt-6 text-lg leading-8 text-slate-300">
              Cada módulo do ecossistema possui uma função específica, mas todos
              compartilham a mesma base metodológica, o mesmo Core e o mesmo EDI
              Intelligence Engine.
            </p>

            <a
              href="#professor-digital"
              className="mt-10 inline-flex rounded-full bg-white px-7 py-4 font-semibold text-[#081C2E] transition hover:opacity-90"
            >
              Conheça o Professor Digital
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

export { EcossistemaFlow }
export default EcossistemaFlow