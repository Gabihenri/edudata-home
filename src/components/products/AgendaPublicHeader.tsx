'use client'

import Link from 'next/link'
import { useState } from 'react'

const navigation = [
  { label: 'Framework EDI', href: '/#framework' },
  { label: 'Ecossistema', href: '/#ecossistema' },
  { label: 'Professor Digital', href: '/professor-digital' },
  { label: 'Agenda EDI', href: '/agenda' },
  { label: 'Academy', href: '/academy' },
]

export default function AgendaPublicHeader() {
  const [open, setOpen] = useState(false)

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

            <button
              type="button"
              aria-expanded={open}
              aria-controls="agenda-public-menu"
              onClick={() => setOpen(current => !current)}
              className="inline-flex min-h-11 min-w-[108px] items-center justify-center rounded-xl bg-[#0B7491] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#09657E] sm:min-h-12 sm:min-w-[124px] sm:px-5 sm:py-3 sm:text-base"
            >
              {open ? 'Fechar' : 'Menu'}
            </button>
          </div>
        </div>

        {open ? (
          <div
            id="agenda-public-menu"
            className="border-t border-white/10 pb-5 pt-4"
          >
            <nav aria-label="Navegação da Agenda" className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {navigation.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex min-h-12 items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:border-cyan-300/40 hover:bg-white/10"
                >
                  <span>{item.label}</span>
                  <span aria-hidden="true" className="text-cyan-300">→</span>
                </Link>
              ))}

              <Link
                href="/cadastro"
                onClick={() => setOpen(false)}
                className="flex min-h-12 items-center justify-between rounded-xl bg-[#0B7491] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#09657E]"
              >
                <span>Criar conta</span>
                <span aria-hidden="true">→</span>
              </Link>
            </nav>
          </div>
        ) : null}
      </div>
    </header>
  )
}
