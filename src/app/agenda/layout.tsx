import type {
  ReactNode,
} from 'react'

import Link from 'next/link'
import { redirect } from 'next/navigation'

import {
  AgendaNavigation,
} from '@/components/agenda/AgendaNavigation'
import {
  requireSessionUser,
} from '@/lib/auth/session'

type AgendaLayoutProps = {
  children: ReactNode
}

export default async function AgendaLayout({
  children,
}: AgendaLayoutProps) {
  try {
    await requireSessionUser()

    return (
      <div className="min-h-screen bg-[#EEF3F7] text-slate-950">
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-[0.18em]">
                  <Link
                    href="/portal"
                    className="text-[#0B7491] transition hover:text-[#075F78]"
                  >
                    EIOS
                  </Link>

                  <span
                    aria-hidden="true"
                    className="text-slate-300"
                  >
                    /
                  </span>

                  <span className="text-slate-500">
                    Produto especializado
                  </span>
                </div>

                <div className="mt-4 flex items-start gap-4">
                  <div
                    aria-hidden="true"
                    className="mt-1 hidden h-16 w-2 shrink-0 rounded-full bg-[#0B7491] sm:block"
                  />

                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#0B7491]">
                      Evidências, inclusão e
                      inteligência
                    </p>

                    <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#071827] sm:text-4xl">
                      Agenda Inteligente EDI
                    </h1>

                    <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">
                      Planejamento, registros,
                      evidências, acompanhamento
                      e análise pedagógica em um
                      único ambiente operacional.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap lg:max-w-sm lg:justify-end">
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

            <div className="mt-6 grid grid-cols-3 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
              <div className="border-r border-slate-200 px-3 py-4 text-center sm:px-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 sm:text-xs">
                  Organizar
                </p>

                <p className="mt-1 text-sm font-bold text-[#071827] sm:text-base">
                  Planejamento
                </p>
              </div>

              <div className="border-r border-slate-200 px-3 py-4 text-center sm:px-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 sm:text-xs">
                  Registrar
                </p>

                <p className="mt-1 text-sm font-bold text-[#071827] sm:text-base">
                  Evidências
                </p>
              </div>

              <div className="px-3 py-4 text-center sm:px-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 sm:text-xs">
                  Analisar
                </p>

                <p className="mt-1 text-sm font-bold text-[#071827] sm:text-base">
                  Indicadores
                </p>
              </div>
            </div>
          </div>
        </section>

        <AgendaNavigation />

        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
          {children}
        </main>

        <footer className="border-t border-slate-200 bg-white">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
            <p>
              Agenda Inteligente EDI
            </p>

            <p>
              Produto operacional integrado ao
              EIOS
            </p>
          </div>
        </footer>
      </div>
    )
  } catch {
    redirect('/login')
  }
}