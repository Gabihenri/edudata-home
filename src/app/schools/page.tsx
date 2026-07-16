import Link from 'next/link'

import SchoolTable from '@/components/school/SchoolTable'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Instituições | EduData IA',
  description:
    'Gestão das instituições e unidades educacionais vinculadas às organizações da EduData IA.',
}

export default function SchoolsPage() {
  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <header className="border-b border-white/10 bg-[#071827] text-white">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-300">
                EIOS — Institution Core
              </p>

              <h1 className="mt-3 text-3xl font-bold tracking-tight">
                Instituições
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                Gerencie escolas, institutos,
                faculdades, universidades,
                empresas e demais unidades
                vinculadas às organizações da
                plataforma.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/organizations"
                className="inline-flex items-center justify-center rounded-lg border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/10"
              >
                Organizações
              </Link>

              <Link
                href="/portal"
                className="inline-flex items-center justify-center rounded-lg border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/10"
              >
                Voltar para a Central
              </Link>

              <Link
                href="/schools/new"
                className="inline-flex items-center justify-center rounded-lg bg-[#0B7491] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#09657e]"
              >
                Nova instituição
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <SchoolTable />
      </div>
    </main>
  )
}