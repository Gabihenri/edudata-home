'use client'

import Link from 'next/link'

export default function AgendaPublicHeader() {
  return (
    <header className="relative z-50 border-b border-white/10 bg-[#071827] text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-[88px] items-center justify-between gap-2.5 sm:min-h-[96px] sm:gap-4">
          <Link
            href="/"
            aria-label="Voltar para a Home da EduData IA"
            className="flex min-w-0 items-center gap-2.5 sm:gap-3"
          >
            <span
              aria-hidden="true"
              className="shrink-0 bg-gradient-to-br from-cyan-300 via-sky-400 to-indigo-500 bg-clip-text text-[38px] font-black leading-none tracking-[-0.08em] text-transparent sm:text-[44px]"
            >
              EDI
            </span>

            <span
              aria-hidden="true"
              className="h-10 w-px shrink-0 bg-white/25 sm:h-12"
            />

            <span className="min-w-0 leading-tight">
              <span className="block whitespace-nowrap text-[11px] font-bold tracking-tight text-white sm:text-sm">
                EDUDATA IA
              </span>
              <span className="mt-1 block whitespace-nowrap text-[9px] font-normal text-slate-400 sm:text-[11px]">
                Inteligência Educacional
              </span>
            </span>
          </Link>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <Link
              href="/login?redirectTo=%2Fagenda%2Fdashboard"
              className="inline-flex min-h-11 min-w-[72px] items-center justify-center rounded-xl border border-white/25 bg-white/5 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 sm:min-h-12 sm:min-w-[92px] sm:px-4 sm:py-3 sm:text-base"
            >
              Entrar
            </Link>

            <Link
              href="/cadastro"
              className="inline-flex min-h-11 min-w-[100px] items-center justify-center rounded-xl bg-[#0B7491] px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-[#09657E] sm:min-h-12 sm:min-w-[118px] sm:px-4 sm:py-3 sm:text-base"
            >
              Criar conta
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
