import Link from 'next/link'
import { redirect } from 'next/navigation'

import {
  requireSessionUser,
} from '@/lib/auth/session'

import SgpaGovernancePanel from '@/components/sgpa/SgpaGovernancePanel'

export const metadata = {
  title:
    'Painel SGPA | EduData IA',
  description:
    'Painel operacional de governança, auditoria e decisões humanas do EIOS.',
}

export default async function SgpaDashboardPage() {
  try {
    await requireSessionUser()
  } catch {
    redirect('/login')
  }

  return (
    <main className="min-h-screen bg-[#F5F6F8] text-slate-950">
      <section className="border-b border-slate-200 bg-[#071827] text-white">
        <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">
                EIOS / Governance Core
              </p>

              <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                SGPA — Painel de Governança
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300 sm:text-base">
                Auditoria, workflow e decisões humanas consolidados em uma única visão institucional.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/analytics/dashboard"
                className="rounded-xl border border-white/20 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Analytics
              </Link>

              <Link
                href="/portal"
                className="rounded-xl bg-[#0B7491] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#09657E]"
              >
                Central EIOS
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <SgpaGovernancePanel />
      </div>
    </main>
  )
}
