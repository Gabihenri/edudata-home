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
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center gap-6">
              <Link
                href="/agenda/dashboard"
                aria-label="Ir para o painel da Agenda Inteligente EDI"
                className="flex justify-center"
              >
                <div className="relative h-24 w-[220px] sm:h-28 sm:w-[260px] md:h-32 md:w-[300px]">
                  <Image
                    src="/logo-agenda-inteligente-edi.png"
                    alt="Agenda Inteligente EDI"
                    fill
                    priority
                    sizes="(max-width: 640px) 220px, (max-width: 768px) 260px, 300px"
                    className="object-contain"
                  />
                </div>
              </Link>

              <div className="w-full max-w-3xl rounded-[28px] bg-white px-5 py-5 shadow-sm ring-1 ring-slate-200 sm:px-6">
                <UserMenu
                  name={userName}
                  email={user.email}
                />
              </div>
            </div>

            <div className="mt-6 border-t border-white/10 pt-6">
              <div className="flex flex-col items-center gap-5 text-center">
                <p className="max-w-3xl text-lg leading-9 text-slate-300 sm:text-xl">
                  Planeje, registre, evidencie e analise sua rotina pedagógica.
                </p>

                <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-center">
                  <Link
                    href="/professor-digital"
                    className="inline-flex min-h-[52px] items-center justify-center rounded-full border border-white/15 px-6 py-3 text-base font-semibold text-white transition hover:bg-white/10"
                  >
                    Professor Digital
                  </Link>

                  <Link
                    href="/"
                    className="inline-flex min-h-[52px] items-center justify-center rounded-full border border-white/15 px-6 py-3 text-base font-semibold text-white transition hover:bg-white/10"
                  >
                    Voltar para a Home
                  </Link>
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