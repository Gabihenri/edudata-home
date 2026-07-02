import Link from 'next/link'

import { products } from '@/lib/data/products'

export default function EcosystemProducts() {
  return (
    <section id="ecossistema" className="bg-[#F8FAFC] py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#0A3A5E]">
            Ecossistema EduData IA
          </p>

          <h2 className="mt-4 text-4xl font-bold text-[#081C2E] md:text-5xl">
            Produtos conectados ao mesmo núcleo inteligente
          </h2>

          <p className="mt-6 text-lg leading-8 text-slate-600">
            Todos os produtos utilizam o mesmo Framework EDI, o mesmo
            EDI Intelligence Engine, o mesmo Core Compartilhado e a mesma
            infraestrutura tecnológica.
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => (
            <Link
              key={product.id}
              href={product.href}
              className="group rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition hover:-translate-y-2 hover:shadow-xl"
            >
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#0A3A5E]">
                Produto
              </p>

              <h3 className="mt-4 text-2xl font-bold text-[#081C2E] group-hover:text-[#0A3A5E]">
                {product.name}
              </h3>

              <p className="mt-5 leading-7 text-slate-600">
                {product.description}
              </p>

              <div className="mt-8 flex items-center justify-between">
                <span className="text-sm font-semibold text-[#1B6B3A]">
                  Integrado ao Engine
                </span>

                <span className="font-bold text-[#0A3A5E]">
                  →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}