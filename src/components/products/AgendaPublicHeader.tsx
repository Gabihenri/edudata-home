'use client'

import Image from 'next/image'
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
        <div className="flex min-h-[100px] items-center justify-between gap-3 sm:min-h-[108px]">
          <Link
            href="/"
            aria-label="Voltar para a Home da EduData IA"
            className="flex min-w-0 flex-1 items-center"
          >
            <Image
              src="/logo-edudata-ia-header.png"
              alt="EduData IA — Inteligência Educacional"
              width={260}
              height={104}
              priority
              className="h-auto w-[190px] max-w-full object-contain object-left sm:w-[225px]"
            />
          </Link>

          <nav
            aria-label="Navegação principal"
            className="hidden items-center gap-5 text-sm font-semibold text-slate-300 lg:flex"
          >
            {navigation.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="border-b-2 border-transparent py-2 transition hover:border-cyan-300 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <Link
              href="/login?redirectTo=%2Fagenda%2Fdashboard"
              className="inline-flex min-h-12 min-w-[92px] items-center justify-center rounded-xl border border-white/25 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 sm:min-w-[104px] sm:px-5 sm:text-base"
            >
              Entrar
            </Link>

            <Link
              href="/cadastro"
              className="inline-flex min-h-12 min-w-[118px] items-center justify-center rounded-xl bg-[#0B7491] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#09657E] sm:min-w-[132px] sm:px-5 sm:text-base"
            >
              Criar conta
            </Link>

            <button
              type="button"
              aria-expanded={open}
              aria-controls="agenda-public-menu"
              onClick={() => setOpen(current => !current)}
              className="hidden min-h-12 items-center justify-center rounded-xl border border-white/25 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 lg:hidden"
            >
              {open ? 'Fechar' : 'Menu'}
            </button>
          </div>
        </div>

        {open ? (
          <div id="agenda-public-menu" className="border-t border-white/10 pb-5 pt-4 lg:hidden">
            <nav aria-label="Navegação mobile" className="grid gap-2">
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
            </nav>
          </div>
        ) : null}
      </div>
    </header>
  )
}
