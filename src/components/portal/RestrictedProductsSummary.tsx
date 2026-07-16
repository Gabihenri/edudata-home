'use client'

import { useId, useState } from 'react'

interface RestrictedProduct {
  code: string
  title: string
  description: string
  unavailableReason: string | null
}

interface RestrictedProductsSummaryProps {
  products: RestrictedProduct[]
}

export default function RestrictedProductsSummary({
  products,
}: RestrictedProductsSummaryProps) {
  const [isOpen, setIsOpen] = useState(false)
  const contentId = useId()

  if (products.length === 0) {
    return null
  }

  const productCountMessage =
    products.length === 1
      ? '1 produto não está liberado para o contexto ativo.'
      : `${products.length} produtos não estão liberados para o contexto ativo.`

  return (
    <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="p-6">
        <div className="flex items-start justify-between gap-5">
          <div>
            <div className="h-1 w-16 bg-slate-400" />

            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Outros produtos
            </p>

            <h2 className="mt-2 text-xl font-bold text-slate-950">
              Produtos não disponíveis
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              {productCountMessage}
            </p>
          </div>

          <button
            type="button"
            aria-expanded={isOpen}
            aria-controls={contentId}
            onClick={() => {
              setIsOpen((current) => !current)
            }}
            className={`shrink-0 rounded-lg border px-4 py-2 text-sm font-semibold transition ${
              isOpen
                ? 'border-slate-950 bg-slate-950 text-white'
                : 'border-slate-300 bg-white text-slate-700 hover:border-slate-500 hover:bg-slate-50'
            }`}
          >
            {isOpen
              ? 'Ocultar produtos'
              : 'Ver produtos'}
          </button>
        </div>
      </div>

      {isOpen ? (
        <div
          id={contentId}
          className="border-t border-slate-200 px-6 pb-6"
        >
          <div className="divide-y divide-slate-200">
            {products.map((product) => (
              <article
                key={product.code}
                className="py-5"
              >
                <h3 className="text-base font-bold text-slate-900">
                  {product.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {product.description}
                </p>

                <p className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  {product.unavailableReason ??
                    'Produto não liberado para o perfil, plano ou vínculo ativo.'}
                </p>
              </article>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  )
}