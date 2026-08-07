import type {
  ReactNode,
} from 'react'

import Link from 'next/link'
import { redirect } from 'next/navigation'

import {
  AgendaMobileNavigation,
} from '@/components/agenda/AgendaMobileNavigation'
import {
  AgendaNavigation,
} from '@/components/agenda/AgendaNavigation'
import {
  AgendaSecondaryNavigation,
} from '@/components/agenda/AgendaSecondaryNavigation'
import AgendaPwaInstallPrompt from '@/components/pwa/AgendaPwaInstallPrompt'
import {
  requireSessionUser,
} from '@/lib/auth/session'
import {
  profileService,
} from '@/lib/profile/profile.service'

type AgendaLayoutProps = {
  children: ReactNode
}

function getDefaultDisplayName(
  user: Awaited<
    ReturnType<typeof requireSessionUser>
  >,
): string | null {
  const fullName =
    user.user_metadata?.full_name

  if (
    typeof fullName === 'string' &&
    fullName.trim()
  ) {
    return fullName.trim()
  }

  const name =
    user.user_metadata?.name

  if (
    typeof name === 'string' &&
    name.trim()
  ) {
    return name.trim()
  }

  if (user.email) {
    return (
      user.email
        .split('@')[0]
        ?.trim() || null
    )
  }

  return null
}

export default async function AgendaLayout({
  children,
}: AgendaLayoutProps) {
  try {
    const user =
      await requireSessionUser()

    const profile =
      await profileService.getOrCreate(
        user.id,
        getDefaultDisplayName(user),
      )

    if (!profile.onboarding_completed) {
      redirect('/perfil/onboarding')
    }

    return (
      <div className="min-h-screen bg-[#EEF3F7] pb-[calc(4rem+env(safe-area-inset-bottom))] text-slate-950 lg:pb-0">
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-6">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] sm:text-xs">
                  <Link
                    href="/portal"
                    className="text-[#0B7491] transition hover:text-[#075F78]"
                  >
                    EIOS
                  </Link>

                  <span aria-hidden="true" className="text-slate-300">/</span>

                  <span className="text-slate-500">
                    Produto especializado
                  </span>
                </div>

                <div className="mt-3 flex items-start gap-4 sm:mt-4">
                  <div
                    aria-hidden="true"
                    className="mt-1 hidden h-16 w-2 shrink-0 rounded-full bg-[#0B7491] sm:block"
                  />

                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#0B7491] sm:text-xs sm:tracking-[0.22em]">
                      Evidências, inclusão e inteligência
                    </p>

                    <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-[#071827] sm:mt-2 sm:text-4xl">
                      Agenda Inteligente EDI
                    </h1>

                    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 sm:mt-3 sm:text-base sm:leading-7">
                      Planejamento, registros, evidências, acompanhamento e análise pedagógica em um único ambiente operacional.
                    </p>
                  </div>
                </div>
              </div>

              <div className="hidden grid-cols-2 gap-3 sm:flex sm:flex-wrap lg:flex lg:max-w-sm lg:justify-end">
                <Link
                  href="/portal"
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-[#075F78]"
                >
                  Central EIOS
                </Link>

                <Link
                  href="/agenda/dashboard"
                  className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#071827] px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-[#0B2940]"
                >
                  Visão geral
                </Link>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-3 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 sm:mt-6">
              <div className="border-r border-slate-200 px-2 py-3 text-center sm:px-5 sm:py-4">
                <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-500 sm:text-xs sm:tracking-[0.14em]">Organizar</p>
                <p className="mt-1 truncate text-xs font-bold text-[#071827] sm:text-base">Planejamento</p>
              </div>

              <div className="border-r border-slate-200 px-2 py-3 text-center sm:px-5 sm:py-4">
                <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-500 sm:text-xs sm:tracking-[0.14em]">Registrar</p>
                <p className="mt-1 truncate text-xs font-bold text-[#071827] sm:text-base">Evidências</p>
              </div>

              <div className="px-2 py-3 text-center sm:px-5 sm:py-4">
                <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-500 sm:text-xs sm:tracking-[0.14em]">Analisar</p>
                <p className="mt-1 truncate text-xs font-bold text-[#071827] sm:text-base">Indicadores</p>
              </div>
            </div>
          </div>
        </section>

        <div className="hidden lg:block">
          <AgendaNavigation />
        </div>

        <AgendaSecondaryNavigation />

        <main className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
          {children}
        </main>

        <footer className="border-t border-slate-200 bg-white">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
            <p>Agenda Inteligente EDI</p>
            <p>Produto operacional integrado ao EIOS</p>
          </div>
        </footer>

        <AgendaPwaInstallPrompt />
        <AgendaMobileNavigation />
      </div>
    )
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === 'NEXT_REDIRECT'
    ) {
      throw error
    }

    redirect('/login')
  }
}
