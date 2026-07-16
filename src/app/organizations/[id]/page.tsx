import Link from 'next/link'

import OrganizationForm from '@/components/organization/OrganizationForm'
import { requireOrganizationAdministrator } from '@/lib/organization/organization.authorization'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Gerenciar organização | EduData IA',
  description:
    'Consulta e atualização dos dados de uma organização da plataforma EduData IA.',
}

interface OrganizationPageProps {
  params: {
    id: string
  }
}

interface OrganizationPageAccess {
  allowed: boolean
  message: string
}

async function resolveOrganizationAccess(
  organizationId: string,
): Promise<OrganizationPageAccess> {
  try {
    const authorization =
      await requireOrganizationAdministrator()

    if (
      authorization.isPlatformAdministrator
    ) {
      return {
        allowed: true,
        message: '',
      }
    }

    if (
      !authorization.organizationIds.includes(
        organizationId,
      )
    ) {
      return {
        allowed: false,
        message:
          'Esta organização está fora do seu escopo institucional autorizado.',
      }
    }

    return {
      allowed: true,
      message: '',
    }
  } catch {
    return {
      allowed: false,
      message:
        'Seu perfil não possui permissão para consultar ou gerenciar esta organização.',
    }
  }
}

export default async function OrganizationPage({
  params,
}: OrganizationPageProps) {
  const access =
    await resolveOrganizationAccess(
      params.id,
    )

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <header className="border-b border-white/10 bg-[#071827] text-white">
        <div className="mx-auto max-w-5xl px-6 py-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-300">
                EIOS — Organization Core
              </p>

              <h1 className="mt-3 text-3xl font-bold tracking-tight">
                Gerenciar organização
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                Consulte e atualize os dados
                institucionais, administrativos,
                de contato e localização desta
                organização.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              {access.allowed ? (
                <Link
                  href="/organizations"
                  className="inline-flex items-center justify-center rounded-lg border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/10"
                >
                  Voltar para organizações
                </Link>
              ) : null}

              <Link
                href="/portal"
                className="inline-flex items-center justify-center rounded-lg border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/10"
              >
                Voltar para a Central
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-8">
        {access.allowed ? (
          <OrganizationForm
            organizationId={params.id}
          />
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
              {access.message}
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