import type { ReactNode } from 'react'

import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { AgendaNavigation } from '@/components/agenda/AgendaNavigation'
import { UserMenu } from '@/components/layout/UserMenu'
import { requireSessionUser } from '@/lib/auth/session'

type AgendaLayoutProps = {
  children: ReactNode
}

export default async function AgendaLayout({
  children,
}: AgendaLayoutProps) {
  try {
    const user = await requireSessionUser()

    const userName =
      user.user_metadata?.full_name ??
      user.user_metadata?.name ??
      user.email?.split('@')[0] ??
      'Usuário'

    return (
      <div className="min-h-screen bg-[#F4F7FA]">
        <header className="border-b border-white/10 bg-[#071826] text-white">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-7 lg:px-8">
            <div className="flex flex-col items-center">
              <Link
                href="/agenda/dashboard"
                aria-label="Ir para o painel da Agenda Inteligente EDI"
                className="flex w-full justify-center"
              >
                <div className="relative h-24 w-full max-w-[330px] overflow-visible sm:h-28 sm:max-w-[410px] lg:h-28 lg:max-w-[450px]">
                  <Image
                    src="/logo-agenda-inteligente-edi.png"
                    alt="Agenda Inteligente EDI"
                    fill
                    priority
                    sizes="(max-width: 640px) 330px, (max-width: 1024px) 410px, 450px"
                    className="scale-[1.6] object-contain object-center sm:scale-[1.7]"
                  />
                </div>
              </Link>

              <div className="mt-5 w-full max-w-xl rounded-[24px] border border-slate-200 bg-white px-5 py-4 shadow-sm sm:px-7">
                <div className="flex justify-center">
                  <div className="inline-flex max-w-full">
                    <UserMenu
                      name={userName}
                      email={user.email}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 w-full max-w-5xl border-t border-white/10 pt-6">
                <div className="flex flex-col items-center gap-5 text-center">
                  <p className="max-w-3xl text-base leading-7 text-slate-300 sm:text-lg">
                    Planeje, registre, evidencie e analise sua rotina
                    pedagógica.
                  </p>

                  <div className="flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
                    <Link
                      href="/professor-digital"
                      className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/10 sm:min-w-[190px]"
                    >
                      Professor Digital
                    </Link>

                    <Link
                      href="/"
                      className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/10 sm:min-w-[190px]"
                    >
                      Voltar para a Home
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <AgendaNavigation />

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
          {children}
        </main>
      </div>
    )
  } catch {
    redirect('/login')
  }
}