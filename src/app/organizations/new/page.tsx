import Link from 'next/link'

import OrganizationForm from '@/components/organization/OrganizationForm'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Nova organização | EduData IA',
  description:
    'Cadastro de uma nova organização institucional no EIOS.',
}

export default function NewOrganizationPage() {
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
                Nova organização
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                Cadastre uma instituição, secretaria, diretoria,
                rede de ensino, mantenedora ou outra estrutura
                organizacional da plataforma.
              </p>
            </div>

            <Link
              href="/organizations"
              className="inline-flex w-fit items-center justify-center rounded-lg border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/10"
            >
              Voltar para organizações
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-8">
        <OrganizationForm />
      </div>
    </main>
  )
}