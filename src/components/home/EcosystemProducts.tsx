import Link from 'next/link'

import { products } from '@/lib/data/products'

const availableNowIds = ['agenda-edi', 'academy']
const activeExpansionIds = ['professor-digital', 'analytics', 'sgpa']
const roadmapIds = ['observatorio', 'comunidade']

const statusById: Record<string, { label: string; className: string }> = {
  'professor-digital': {
    label: 'Em validação',
    className: 'border-sky-200 bg-sky-50 text-sky-800',
  },
  'agenda-edi': {
    label: 'Piloto',
    className: 'border-amber-200 bg-amber-50 text-amber-800',
  },
  academy: {
    label: 'Disponível',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  },
  analytics: {
    label: 'Operacional',
    className: 'border-cyan-200 bg-cyan-50 text-[#075F78]',
  },
  sgpa: {
    label: 'Em implantação',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  },
  observatorio: {
    label: 'Roadmap',
    className: 'border-slate-200 bg-slate-100 text-slate-600',
  },
  comunidade: {
    label: 'Roadmap',
    className: 'border-slate-200 bg-slate-100 text-slate-600',
  },
}

function getProducts(ids: string[]) {
  return products
    .filter((product) => ids.includes(product.id))
    .sort((a, b) => a.order - b.order)
}

function status(productId: string) {
  return (
    statusById[productId] ?? {
      label: 'Em evolução',
      className: 'border-slate-200 bg-slate-100 text-slate-600',
    }
  )
}

function action(productId: string) {
  const actions: Record<string, string> = {
    'professor-digital': 'Conhecer o produto',
    'agenda-edi': 'Conhecer a Agenda',
    academy: 'Acessar a Academy',
    analytics: 'Saiba mais',
    sgpa: 'Saiba mais',
    observatorio: 'Saiba mais',
    comunidade: 'Saiba mais',
  }

  return actions[productId] ?? 'Saiba mais'
}

export default function EcosystemProducts() {
  const availableNow = getProducts(availableNowIds)
  const activeExpansion = getProducts(activeExpansionIds)
  const roadmap = getProducts(roadmapIds)

  return (
    <section
      id="ecossistema"
      className="scroll-mt-24 bg-[#EEF3F7] px-4 py-14 sm:px-6 lg:px-8 lg:py-18"
    >
      <div className="mx-auto max-w-7xl">
        <div className="max-w-4xl">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#0B7491]">
            Ecossistema EduData IA
          </p>
          <h2 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-[#071827] sm:text-4xl lg:text-5xl">
            Produtos especializados, uma única base de inteligência educacional.
          </h2>
          <p className="mt-5 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
            Conheça as experiências já disponíveis e acompanhe a evolução dos
            próximos produtos e camadas da plataforma.
          </p>
        </div>

        <section className="mt-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B7491]">
                Disponíveis agora
              </p>
              <h3 className="mt-2 text-2xl font-bold text-[#071827] sm:text-3xl">
                Onde a experiência começa.
              </h3>
            </div>
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-3">
            {availableNow.map((product) => {
              const productStatus = status(product.id)

              return (
                <Link
                  key={product.id}
                  href={product.href}
                  className="group flex flex-col overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm transition hover:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-[#0B7491]"
                >
                  <header className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4">
                    <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#0B7491]">
                      {product.category}
                    </span>
                    <span
                      className={`rounded-lg border px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] ${productStatus.className}`}
                    >
                      {productStatus.label}
                    </span>
                  </header>

                  <div className="flex flex-1 flex-col p-5">
                    <h4 className="text-2xl font-bold text-[#071827]">
                      {product.name}
                    </h4>
                    <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">
                      {product.description}
                    </p>
                  </div>

                  <footer className="flex items-center justify-between border-t border-slate-200 px-5 py-4">
                    <span className="text-sm font-bold text-[#071827]">
                      {action(product.id)}
                    </span>
                    <span aria-hidden="true" className="font-bold text-[#0B7491] transition group-hover:translate-x-1">
                      →
                    </span>
                  </footer>
                </Link>
              )
            })}
          </div>
        </section>

        <section className="mt-12">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
            Em desenvolvimento e expansão
          </p>
          <h3 className="mt-2 text-2xl font-bold text-[#071827] sm:text-3xl">
            Produtos em evolução e próximas camadas do ecossistema.
          </h3>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {activeExpansion.map((product) => (
              <Link
                key={product.id}
                href={product.href}
                className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-[#0B7491]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                      {product.category}
                    </p>
                    <h4 className="mt-2 text-xl font-bold text-[#071827]">
                      {product.name}
                    </h4>
                  </div>
                  <span className={`rounded-lg border px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] ${status(product.id).className}`}>
                    {status(product.id).label}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {product.description}
                </p>
                {product.id === 'professor-digital' && (
                  <p className="mt-3 text-sm leading-6 text-slate-500">
                    Um ambiente de autoanálise e inteligência profissional para
                    compreender a própria trajetória, visualizar padrões de atuação
                    e identificar possibilidades de desenvolvimento. A Agenda
                    Inteligente EDI organiza e registra a rotina; o Professor Digital
                    interpreta a trajetória e apoia reflexão e desenvolvimento.
                  </p>
                )}
                <span className="mt-4 inline-block text-sm font-bold text-[#075F78]">
                  {action(product.id)} →
                </span>
              </Link>
            ))}
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {roadmap.map((product) => (
              <Link
                key={product.id}
                href={product.href}
                className="rounded-2xl border border-slate-200 bg-white/70 p-5 transition hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0B7491]"
              >
                <div className="flex items-center justify-between gap-4">
                  <h4 className="text-lg font-bold text-[#071827]">
                    {product.name}
                  </h4>
                  <span className={`rounded-lg border px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] ${status(product.id).className}`}>
                    Roadmap
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {product.description}
                </p>
                <span className="mt-3 inline-block text-sm font-semibold text-slate-600">
                  Saiba mais →
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </section>
  )
}
