import Link from 'next/link'

import OrganizationTable from '@/components/organization/OrganizationTable'
import { requireOrganizationAdministrator } from '@/lib/organization/organization.authorization'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Organizações | EduData IA',
  description:
    'Gestão das organizações vinculadas à plataforma EduData IA.',
}

interface OrganizationPageAccess {
  canView: boolean
  canCreate: boolean
  message: string
}

async function resolveOrganizationAccess():
  Promise<OrganizationPageAccess> {
  try {
    const authorization =
      await requireOrganizationAdministrator()

    return {
      canView: true,

      canCreate:
        authorization.isPlatformAdministrator,

      message: '',
    }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Seu perfil não possui permissão para administrar organizações.'

    return {
      canView: false,
      canCreate: false,
      message,
    }
  }
}

export default async function OrganizationsPage() {
  const access =
    await resolveOrganizationAccess()

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
                Gerencie instituições, redes,
                secretarias, diretorias e demais
                estruturas organizacionais
                compartilhadas pelos produtos da
                EduData IA.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/portal"
                className="inline-flex items-center justify-center rounded-lg border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/10"
              >
                Voltar para a Central
              </Link>

              {access.canCreate ? (
                <Link
                  href="/organizations/new"
                  className="inline-flex items-center justify-center rounded-lg bg-[#0B7491] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#09657e]"
                >
                  Nova organização
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {access.canView ? (
          <OrganizationTable />
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
              {access.message ===
              'Usuário não autenticado.'
                ? 'Sua sessão não está ativa. Entre novamente na plataforma para continuar.'
                : 'Seu perfil não possui vínculo administrativo ativo para consultar ou gerenciar organizações.'}
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