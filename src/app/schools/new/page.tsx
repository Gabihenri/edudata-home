import Link from 'next/link'

import SchoolForm from '@/components/school/SchoolForm'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Nova Escola | EduData IA',
  description:
    'Cadastro de escola ou unidade educacional vinculada a uma organização da EduData IA.',
}

interface NewSchoolPageProps {
  searchParams?: {
    organization_id?: string | string[]
  }
}

export default function NewSchoolPage({
  searchParams,
}: NewSchoolPageProps) {
  const organizationIdParam =
    searchParams?.organization_id

  const organizationId =
    Array.isArray(organizationIdParam)
      ? organizationIdParam[0]
      : organizationIdParam

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
                Nova escola
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                Cadastre uma escola ou unidade educacional
                e vincule-a à organização responsável.
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
        <SchoolForm
          organizationId={organizationId}
        />
      </div>
    </main>
  )
}