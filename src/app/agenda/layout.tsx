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
    const user =
      await requireSessionUser()

    const userName =
      user.user_metadata?.full_name ??
      user.user_metadata?.name ??
      user.email?.split('@')[0] ??
      'Usuário'

    return (
      <div className="min-h-screen bg-[#F4F7FA]">
        <header className="border-b border-white/10 bg-[#071826] text-white">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
            <Link
              href="/agenda/dashboard"
              aria-label="Ir para o painel da Agenda Inteligente EDI"
              className="self-center sm:self-auto"
            >
              <div className="relative h-20 w-[300px] overflow-visible sm:h-24 sm:w-[340px]">
                <Image
                  src="/logo-agenda-inteligente-edi.png"
                  alt="Agenda Inteligente EDI"
                  fill
                  priority
                  sizes="(max-width: 640px) 300px, 340px"
                  className="scale-[1.18] object-contain object-center"
                />
              </div>
            </Link>

            <div className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:w-auto">
              <div className="flex justify-center sm:justify-end">
                <UserMenu
                  name={userName}
                  email={user.email}
                />
              </div>
            </div>
          </div>
        </header>

        <AgendaNavigation />

        <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-7 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    )
  } catch {
    redirect('/login')
  }
}