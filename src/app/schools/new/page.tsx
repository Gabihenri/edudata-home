import Link from 'next/link'

import SchoolForm from '@/components/school/SchoolForm'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Nova instituição | EduData IA',
  description:
    'Cadastro de escolas, institutos, faculdades, universidades, empresas e outras instituições na EduData IA.',
}

interface NewInstitutionPageProps {
  searchParams?: {
    organization_id?:
      | string
      | string[]
  }
}

function readOrganizationId(
  value:
    | string
    | string[]
    | undefined,
): string | undefined {
  if (
    typeof value === 'string' &&
    value.trim()
  ) {
    return value.trim()
  }

  if (
    Array.isArray(value) &&
    typeof value[0] === 'string' &&
    value[0].trim()
  ) {
    return value[0].trim()
  }

  return undefined
}

export default function NewInstitutionPage({
  searchParams,
}: NewInstitutionPageProps) {
  const organizationId =
    readOrganizationId(
      searchParams?.organization_id,
    )

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <header className="border-b border-white/10 bg-[#071827] text-white">
        <div className="mx-auto max-w-5xl px-6 py-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-300">
                EIOS — Institution Core
              </p>

              <h1 className="mt-3 text-3xl font-bold tracking-tight">
                Nova instituição
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                Localize uma escola brasileira
                no Cadastro Nacional INEP ou
                realize o cadastro manual de
                institutos, faculdades,
                universidades, empresas e
                outras instituições.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/schools"
                className="inline-flex items-center justify-center rounded-lg border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/10"
              >
                Voltar para instituições
              </Link>

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
        <SchoolForm
          organizationId={
            organizationId
          }
        />
      </div>
    </main>
  )
}