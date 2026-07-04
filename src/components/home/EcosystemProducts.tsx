import Link from 'next/link'

import { products } from '@/lib/data/products'

export default function EcosystemProducts() {
  return (
    <section id="ecossistema" className="bg-[#F8FAFC] py-24">
      <div className="mx-auto max-w-7xl px-6">

        <div className="max-w-4xl">

          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#0A3A5E]">
            Ecossistema EduData IA
          </p>

          <h2 className="mt-4 text-5xl font-bold text-[#081C2E]">
            Produtos especializados sobre o mesmo EIOS
          </h2>

          <p className="mt-6 text-lg leading-8 text-slate-600">
            Cada produto possui uma finalidade específica, porém todos compartilham
            o mesmo Framework EDI, o mesmo EIOS e o mesmo Core Compartilhado.
            Isso garante inteligência reutilizável, integração nativa e evolução
            contínua da plataforma.
          </p>

        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-2 xl:grid-cols-3">

          {products.map((product) => (

            <Link
              key={product.id}
              href={product.href}
              className="group rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition hover:-translate-y-2 hover:border-cyan-500 hover:shadow-xl"
            >

              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-700">
                Produto EIOS
              </p>

              <h3 className="mt-4 text-2xl font-bold text-[#081C2E] group-hover:text-cyan-700">
                {product.name}
              </h3>

              <p className="mt-5 leading-7 text-slate-600">
                {product.description}
              </p>

              <div className="mt-8 flex items-center justify-between border-t pt-6">

                <span className="text-sm font-semibold text-emerald-700">
                  Integrado ao EIOS
                </span>

                <span className="text-xl font-bold text-cyan-700">
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