import Link from 'next/link'

import SchoolTable from '@/components/school/SchoolTable'
import { requireOrganizationAdministrator } from '@/lib/organization/organization.authorization'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Instituições | EduData IA',
  description:
    'Gestão das instituições e unidades educacionais vinculadas às organizações da EduData IA.',
}

async function hasInstitutionManagementAccess():
  Promise<boolean> {
  try {
    await requireOrganizationAdministrator()

    return true
  } catch {
    return false
  }
}

export default async function SchoolsPage() {
  const canManageInstitutions =
    await hasInstitutionManagementAccess()

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
              {canManageInstitutions ? (
                <Link
                  href="/organizations"
                  className="inline-flex items-center justify-center rounded-lg border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/10"
                >
                  Organizações
                </Link>
              ) : null}

              <Link
                href="/portal"
                className="inline-flex items-center justify-center rounded-lg border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/10"
              >
                Voltar para a Central
              </Link>

              {canManageInstitutions ? (
                <Link
                  href="/schools/new"
                  className="inline-flex items-center justify-center rounded-lg bg-[#0B7491] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#09657e]"
                >
                  Nova instituição
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {canManageInstitutions ? (
          <SchoolTable />
        ) : (
          <section className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
            <div className="h-1 w-16 bg-red-600" />

            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-red-600">
              Acesso institucional
            </p>

            <h2 className="mt-2 text-xl font-bold text-slate-950">
              Acesso não autorizado
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Seu perfil não possui vínculo
              administrativo ativo para
              consultar ou gerenciar
              instituições.
            </p>

            <Link
              href="/portal"
              className="mt-6 inline-flex items-center justify-center rounded-lg bg-[#0B7491] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#09657e]"
            >
              Voltar para a Central
            </Link>
          </section>
        )}
      </div>
    </main>
  )
}