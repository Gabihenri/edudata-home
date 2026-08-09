'use client'

import Link from 'next/link'

export default function AgendaPublicHeader() {
  return (
    <header className="relative z-50 border-b border-white/10 bg-[#071827] text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-[84px] items-center justify-between gap-3 sm:min-h-[92px] sm:gap-4">
          <Link
            href="/"
            aria-label="Voltar para a Home da EduData IA"
            className="flex min-w-0 shrink-0 items-center"
          >
            <span
              aria-hidden="true"
              className="bg-gradient-to-br from-cyan-300 via-sky-400 to-indigo-500 bg-clip-text text-[40px] font-black leading-none tracking-[-0.08em] text-transparent sm:text-[46px]"
            >
              EDI
            </span>
          </Link>

          <div className="ml-auto flex shrink-0 items-center gap-2.5 sm:gap-3">
            <Link
              href="/login?redirectTo=%2Fagenda%2Fdashboard"
              className="inline-flex min-h-11 min-w-[78px] items-center justify-center rounded-xl border border-white/25 bg-white/5 px-3.5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 sm:min-h-12 sm:min-w-[94px] sm:px-4 sm:py-3 sm:text-base"
            >
              Entrar
            </Link>

            <Link
              href="/cadastro"
              className="inline-flex min-h-11 min-w-[108px] items-center justify-center rounded-xl bg-[#0B7491] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#09657E] sm:min-h-12 sm:min-w-[124px] sm:px-5 sm:py-3 sm:text-base"
            >
              Criar conta
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
