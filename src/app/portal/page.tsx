'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

type Product = {
  title: string
  description: string
  href: string
  icon: string
  enabled: boolean
}

export default function PortalPage() {
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch('/api/portal')

        const json = await response.json()

        if (json.success) {
          setProducts(json.products)
        }
      } catch (error) {
        console.error(error)
      }
    }

    load()
  }, [])

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-7xl p-8">

        <h1 className="text-4xl font-bold text-slate-900">
          EduData IA
        </h1>

        <p className="mt-2 text-slate-600">
          Central da Plataforma
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">

          {products.map(product => (

            <Link
              key={product.href}
              href={product.enabled ? product.href : '#'}
            >

              <div className={`rounded-xl border bg-white p-6 shadow transition hover:shadow-xl ${
                product.enabled
                  ? ''
                  : 'opacity-50'
              }`}>

                <div className="text-5xl">
                  {product.icon}
                </div>

                <h2 className="mt-4 text-xl font-bold">
                  {product.title}
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  {product.description}
                </p>

              </div>

            </Link>

          ))}

        </div>

      </div>
    </main>
  )
}