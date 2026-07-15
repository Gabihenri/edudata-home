import Link from 'next/link'

import OrganizationTable from '@/components/organization/OrganizationTable'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Organizações | EduData IA',
  description:
    'Gestão das organizações institucionais vinculadas ao EIOS.',
}

export default function OrganizationsPage() {
  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <header className="border-b border-white/10 bg-[#071827] text-white">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-300">
                EIOS — Organization Core
              </p>

              <h1 className="mt-3 text-3xl font-bold tracking-tight">
                Organizações
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                Gerencie instituições, redes, secretarias,
                diretorias e demais estruturas organizacionais
                compartilhadas pelos produtos da EduData IA.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/portal"
                className="inline-flex items-center justify-center rounded-lg border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/10"
              >
                Voltar para a Central
              </Link>

              <Link
                href="/organizations/new"
                className="inline-flex items-center justify-center rounded-lg bg-[#0B7491] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#095f77]"
              >
                Nova organização
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <OrganizationTable />
      </div>
    </main>
  )
}