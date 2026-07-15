import Link from 'next/link'

import ProfileForm from '@/components/profile/ProfileForm'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Meu Perfil | EduData IA',
  description:
    'Gerenciamento dos dados pessoais e do contexto de acesso do usuário na EduData IA.',
}

export default function ProfilePage() {
  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <header className="border-b border-white/10 bg-[#071827] text-white">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-300">
                EIOS — Identity Core
              </p>

              <h1 className="mt-3 text-3xl font-bold tracking-tight">
                Meu Perfil
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                Gerencie seus dados pessoais. Perfil,
                instituição, hierarquia e permissões
                permanecem sob controle da gestão
                responsável.
              </p>
            </div>

            <Link
              href="/portal"
              className="inline-flex w-fit items-center justify-center rounded-lg border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/10"
            >
              Voltar para a Central
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-8">
        <ProfileForm />

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="h-1 w-16 bg-[#0B7491]" />

          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Governança de acesso
          </p>

          <h2 className="mt-2 text-lg font-bold text-slate-950">
            Identidade compartilhada entre todos os produtos
          </h2>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            As informações deste perfil são utilizadas pela
            Agenda Inteligente EDI, Professor Digital,
            EduData Analytics, EduData Academy, SGPA e
            demais produtos da plataforma. Alterações de
            cargo, vínculo institucional ou nível de acesso
            dependem de autorização administrativa.
          </p>
        </section>
      </div>
    </main>
  )
}