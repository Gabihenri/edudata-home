'use client'

import Link from 'next/link'

export default function EscolaPage() {
  return (
    <main className="min-h-screen bg-[#F5F6F8] px-6 py-16">
      <div className="mx-auto max-w-5xl">

        <h1 className="text-5xl font-bold text-[#081C2E]">
          Selecione sua Escola
        </h1>

        <p className="mt-4 text-lg text-slate-600">
          O Professor Digital utiliza a escola para carregar
          indicadores, Agenda Inteligente EDI,
          Evidências, Plano de Desenvolvimento e
          recomendações produzidas pelo EIOS.
        </p>

        <div className="mt-12 rounded-3xl bg-white p-8 shadow">

          <label className="mb-3 block font-semibold">
            Procurar escola
          </label>

          <input
            className="w-full rounded-xl border p-4"
            placeholder="Digite o nome da escola..."
          />

          <div className="mt-10 flex flex-wrap gap-4">

            <button
              className="rounded-xl bg-[#0A3A5E] px-6 py-3 font-semibold text-white"
            >
              Buscar
            </button>

            <button
              className="rounded-xl border border-[#0A3A5E] px-6 py-3 font-semibold"
            >
              Cadastrar nova escola
            </button>

          </div>

        </div>

        <div className="mt-10">

          <Link
            href="/professor-digital"
            className="text-[#0A3A5E] font-semibold"
          >
            ← Voltar ao Professor Digital
          </Link>

        </div>

      </div>
    </main>
  )
}
