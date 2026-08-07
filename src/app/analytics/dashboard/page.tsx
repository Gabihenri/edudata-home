import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import EducationalAnalyticsComparisonPanel from '@/components/agenda/educational-analytics/EducationalAnalyticsComparisonPanel'
import EducationalAnalyticsEvolutionPanel from '@/components/agenda/educational-analytics/EducationalAnalyticsEvolutionPanel'
import EducationalAnalyticsHistoryPanel from '@/components/agenda/educational-analytics/EducationalAnalyticsHistoryPanel'
import EducationalAnalyticsLongitudinalPanel from '@/components/agenda/educational-analytics/EducationalAnalyticsLongitudinalPanel'
import EducationalAnalyticsPanel from '@/components/agenda/educational-analytics/EducationalAnalyticsPanel'
import InstitutionalExportPanel from '@/components/agenda/educational-analytics/InstitutionalExportPanel'
import { requireSessionUser } from '@/lib/auth/session'

export const metadata: Metadata = {
  title: 'Dashboard | EduData Analytics',
  description:
    'Ambiente operacional de inteligência educacional, histórico, evolução, comparação e relatórios do EduData Analytics.',
}

export default async function AnalyticsDashboardPage() {
  try {
    await requireSessionUser()
  } catch {
    redirect('/login')
  }

  return (
    <main className="min-h-screen bg-[#EEF3F7] text-slate-950">
      <section className="border-b border-white/10 bg-[#071827] text-white">
        <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-[0.18em]">
                <Link
                  href="/portal"
                  className="text-cyan-300 transition hover:text-cyan-200"
                >
                  EIOS
                </Link>
                <span className="text-slate-500">/</span>
                <span className="text-slate-300">Produto especializado</span>
              </div>

              <p className="mt-5 text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">
                Dados · inteligência · decisão
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                EduData Analytics
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300 sm:text-base sm:leading-7">
                Ambiente operacional para análise educacional, histórico longitudinal, comparação de versões e relatórios institucionais explicáveis.
              </p>
            </div>

            <nav className="flex flex-wrap gap-3" aria-label="Navegação do EduData Analytics">
              <Link
                href="/analytics"
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/20 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Sobre o produto
              </Link>
              <Link
                href="/agenda/indicadores"
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#0B7491] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#09657E]"
              >
                Indicadores da Agenda
              </Link>
            </nav>
          </div>

          <div className="mt-7 grid grid-cols-2 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] sm:grid-cols-4">
            <div className="border-b border-r border-white/10 px-4 py-4 sm:border-b-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Analisar</p>
              <p className="mt-1 text-sm font-bold">Sinais</p>
            </div>
            <div className="border-b border-white/10 px-4 py-4 sm:border-b-0 sm:border-r">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Comparar</p>
              <p className="mt-1 text-sm font-bold">Versões</p>
            </div>
            <div className="border-r border-white/10 px-4 py-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Evoluir</p>
              <p className="mt-1 text-sm font-bold">Tendências</p>
            </div>
            <div className="px-4 py-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Decidir</p>
              <p className="mt-1 text-sm font-bold">Relatórios</p>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <EducationalAnalyticsPanel />
        <EducationalAnalyticsHistoryPanel />
        <EducationalAnalyticsComparisonPanel />
        <EducationalAnalyticsEvolutionPanel />
        <EducationalAnalyticsLongitudinalPanel />
        <InstitutionalExportPanel />
      </div>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>EduData Analytics</p>
          <p>Inteligência educacional integrada ao EIOS</p>
        </div>
      </footer>
    </main>
  )
}
