import { ReactNode } from 'react'
import { redirect } from 'next/navigation'

import { requireSessionUser } from '@/lib/auth/session'
import { UserMenu } from '@/components/layout/UserMenu'

type AgendaLayoutProps = {
  children: ReactNode
}

export default async function AgendaLayout({
  children,
}: AgendaLayoutProps) {
  try {
    const user = await requireSessionUser()

    return (
      <div className="min-h-screen bg-slate-100">
        <header className="border-b bg-white">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
            <div>
              <h1 className="text-lg font-bold">
                Agenda Inteligente EDI
              </h1>
            </div>

            <UserMenu
              name={
                user.user_metadata?.name ??
                user.email?.split('@')[0] ??
                'Usuário'
              }
              email={user.email}
            />
          </div>
        </header>

        <main className="mx-auto max-w-7xl p-6">
          {children}
        </main>
      </div>
    )
  } catch {
    redirect('/login')
  }
}