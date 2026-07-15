'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'

import SchoolForm from '@/components/school/SchoolForm'

export default function SchoolPage() {
  const params = useParams<{
    id: string | string[]
  }>()

  const schoolId = Array.isArray(params.id)
    ? params.id[0]
    : params.id

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <header className="border-b border-white/10 bg-[#071827] text-white">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-300">
                EIOS — School Core
              </p>

              <h1 className="mt-3 text-3xl font-bold tracking-tight">
                Gerenciar escola
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                Atualize os dados institucionais, o vínculo
                organizacional, o contato e a localização
                da escola.
              </p>
            </div>

            <Link
              href="/schools"
              className="inline-flex w-fit items-center justify-center rounded-lg border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/10"
            >
              Voltar para escolas
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-8">
        {schoolId ? (
          <SchoolForm schoolId={schoolId} />
        ) : (
          <section className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
            <p className="font-semibold text-red-700">
              Identificador da escola não encontrado.
            </p>

            <Link
              href="/schools"
              className="mt-5 inline-flex rounded-lg bg-[#0B7491] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#09657e]"
            >
              Voltar para escolas
            </Link>
          </section>
        )}
      </div>
    </main>
  )
}