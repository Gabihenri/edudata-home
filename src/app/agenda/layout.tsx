import type { ReactNode } from 'react'

import Link from 'next/link'
import { redirect } from 'next/navigation'

import { AgendaMobileNavigation } from '@/components/agenda/AgendaMobileNavigation'
import { AgendaNavigation } from '@/components/agenda/AgendaNavigation'
import { AgendaSecondaryNavigation } from '@/components/agenda/AgendaSecondaryNavigation'
import AgendaPwaInstallPrompt from '@/components/pwa/AgendaPwaInstallPrompt'
import { requireSessionUser } from '@/lib/auth/session'
import { profileService } from '@/lib/profile/profile.service'

type AgendaLayoutProps = { children: ReactNode }

const quickActions = [
  { eyebrow: 'Organizar', label: 'Planejamento', href: '/agenda/planejamento' },
  { eyebrow: 'Registrar', label: 'Evidências', href: '/agenda/evidencias' },
  { eyebrow: 'Analisar', label: 'Indicadores', href: '/agenda/indicadores' },
] as const

function getDefaultDisplayName(user: Awaited<ReturnType<typeof requireSessionUser>>): string | null {
  const fullName = user.user_metadata?.full_name
  if (typeof fullName === 'string' && fullName.trim()) return fullName.trim()
  const name = user.user_metadata?.name
  if (typeof name === 'string' && name.trim()) return name.trim()
  if (user.email) return user.email.split('@')[0]?.trim() || null
  return null
}

export default async function AgendaLayout({ children }: AgendaLayoutProps) {
  try {
    const user = await requireSessionUser()
    const profile = await profileService.getOrCreate(user.id, getDefaultDisplayName(user))
    if (!profile.onboarding_completed) redirect('/perfil/onboarding')

    return (
      <div className="min-h-screen bg-[#EEF3F7] pb-[calc(4rem+env(safe-area-inset-bottom))] font-sans text-slate-950 lg:pb-0">
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 pb-5 pt-[max(1.25rem,calc(env(safe-area-inset-top)+0.75rem))] sm:px-6 sm:pb-7 sm:pt-[max(1.75rem,calc(env(safe-area-inset-top)+1rem))] lg:px-8 lg:pb-8 lg:pt-8">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-6">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.17em] sm:text-xs sm:tracking-[0.18em]">
                  <Link href="/portal" className="text-[#0B7491] transition hover:text-[#075F78]">EIOS</Link>
                  <span aria-hidden="true" className="text-slate-300">/</span>
                  <span className="text-slate-500">Produto especializado</span>
                </div>
                <div className="mt-3 flex items-start gap-4 sm:mt-4">
                  <div aria-hidden="true" className="mt-1 hidden h-16 w-1.5 shrink-0 rounded-full bg-[#0B7491] sm:block" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase leading-5 tracking-[0.18em] text-[#0B7491] sm:text-xs sm:tracking-[0.22em]">Evidências, inclusão e inteligência</p>
                    <h1 className="mt-1.5 text-[2rem] font-extrabold leading-[1.08] tracking-[-0.035em] text-[#071827] sm:mt-2 sm:text-4xl lg:text-[2.6rem]">Agenda Inteligente EDI</h1>
                    <p className="mt-2.5 max-w-3xl text-[15px] leading-6 text-slate-600 sm:mt-3 sm:text-base sm:leading-7">Planejamento, registros, evidências, acompanhamento e análise pedagógica em um único ambiente operacional.</p>
                  </div>
                </div>
              </div>
              <div className="hidden grid-cols-2 gap-3 sm:flex sm:flex-wrap lg:flex lg:max-w-sm lg:justify-end">
                <Link href="/portal" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-[#075F78]">Central EIOS</Link>
                <Link href="/agenda/dashboard" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#071827] px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-[#0B2940]">Visão geral</Link>
              </div>
            </div>

            <aside aria-label="Comece por aqui" className="mt-5 rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-4 sm:mt-6 sm:px-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#075F78] sm:text-xs">Experiência Guiada EDI</p>
                  <p className="mt-1 text-sm font-semibold text-[#071827]">Novo na Agenda ou não sabe por onde continuar?</p>
                  <p className="mt-1 text-sm leading-5 text-slate-600">A jornada guiada mostra seu estágio atual, explica os indicadores e recomenda o próximo passo.</p>
                </div>
                <Link href="/agenda/dashboard" className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-cyan-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-cyan-800">Ver meu próximo passo</Link>
              </div>
            </aside>

            <nav aria-label="Ações rápidas da Agenda" className="mt-5 grid grid-cols-3 gap-2 sm:mt-6 sm:gap-3">
              {quickActions.map(action => (
                <Link key={action.href} href={action.href} className="group flex min-h-[74px] min-w-0 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-2 py-3 text-center transition hover:border-cyan-300 hover:bg-cyan-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B7491] focus-visible:ring-offset-2 sm:min-h-[82px] sm:px-5 sm:py-4">
                  <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-500 transition group-hover:text-[#0B7491] sm:text-xs sm:tracking-[0.16em]">{action.eyebrow}</span>
                  <span className="mt-1.5 max-w-full truncate text-[13px] font-extrabold leading-4 tracking-tight text-[#071827] sm:text-base sm:leading-5">{action.label}</span>
                </Link>
              ))}
            </nav>
          </div>
        </section>

        <div className="hidden lg:block"><AgendaNavigation /></div>
        <AgendaSecondaryNavigation />
        <main className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8 lg:py-10">{children}</main>
        <footer className="border-t border-slate-200 bg-white"><div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8"><p>Agenda Inteligente EDI</p><p>Produto operacional integrado ao EIOS</p></div></footer>
        <AgendaPwaInstallPrompt />
        <AgendaMobileNavigation />
      </div>
    )
  } catch (error) {
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') throw error
    redirect('/login')
  }
}
