'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

type NavigationItem = {
  label: string
  href: string
}

const primaryNavigation: NavigationItem[] = [
  {
    label: 'Framework EDI',
    href: '/#framework',
  },
  {
    label: 'Ecossistema',
    href: '/#ecossistema',
  },
  {
    label: 'Professor Digital',
    href: '/professor-digital',
  },
  {
    label: 'Agenda EDI',
    href: '/agenda',
  },
  {
    label: 'Academy',
    href: '/academy',
  },
]

function isCurrentRoute(
  pathname: string,
  currentHash: string,
  href: string,
): boolean {
  if (href.startsWith('/#')) {
    return pathname === '/' && currentHash === href.slice(1)
  }

  return pathname === href || pathname.startsWith(`${href}/`)
}

export default function Header() {
  const pathname = usePathname()

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [currentHash, setCurrentHash] = useState('')

  useEffect(() => {
    setMobileMenuOpen(false)
    setCurrentHash(window.location.hash)
  }, [pathname])

  useEffect(() => {
    function handleHashChange(): void {
      setCurrentHash(window.location.hash)
      setMobileMenuOpen(false)
    }

    window.addEventListener('hashchange', handleHashChange)

    return () => {
      window.removeEventListener('hashchange', handleHashChange)
    }
  }, [])

  function closeMobileMenu(): void {
    setMobileMenuOpen(false)
  }

  return (
    <header className="sticky top-0 z-[60] border-b border-slate-100 bg-[#FCFCFD] text-[#071827] shadow-[0_2px_10px_rgba(7,24,39,0.04)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-[96px] items-center justify-between gap-3 lg:min-h-[100px] lg:gap-4">
          <Link
            href="/"
            aria-label="Ir para a página inicial da EduData IA"
            onClick={closeMobileMenu}
            className="flex min-w-0 shrink items-center rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B7491]"
          >
            <Image
              src="/logo-edudata-ia-header.png"
              alt="EduData IA"
              width={260}
              height={104}
              priority
              className="h-auto w-[205px] origin-left scale-[1.16] object-contain object-left sm:w-[225px] sm:scale-110 lg:w-[240px] lg:scale-100"
            />
          </Link>

          <nav
            aria-label="Navegação principal"
            className="hidden items-center gap-5 text-sm font-semibold text-slate-700 lg:flex"
          >
            {primaryNavigation.map((item) => {
              const current = isCurrentRoute(
                pathname,
                currentHash,
                item.href,
              )

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={
                    current
                      ? item.href.startsWith('/#')
                        ? 'location'
                        : 'page'
                      : undefined
                  }
                  className={`border-b-2 py-2 transition focus:outline-none focus:ring-2 focus:ring-[#0B7491] ${
                    current
                      ? 'border-[#0B7491] text-[#071827]'
                      : 'border-transparent hover:border-cyan-300 hover:text-[#071827]'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="hidden shrink-0 items-center gap-3 lg:flex">
            <Link
              href="/login"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-[#071827] transition hover:border-cyan-300 hover:bg-cyan-50 focus:outline-none focus:ring-2 focus:ring-[#0B7491]"
            >
              Entrar
            </Link>

            <Link
              href="/agenda"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#0B7491] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#09657E] focus:outline-none focus:ring-2 focus:ring-[#071827]"
            >
              Conhecer a Agenda
            </Link>
          </div>

          <button
            type="button"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
            aria-label={
              mobileMenuOpen
                ? 'Fechar menu principal'
                : 'Abrir menu principal'
            }
            onClick={() => setMobileMenuOpen((current) => !current)}
            className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-xl border border-[#071827] bg-[#071827] px-5 py-3 text-base font-semibold text-white transition hover:bg-[#0B2940] focus:outline-none focus:ring-2 focus:ring-[#0B7491] lg:hidden"
          >
            {mobileMenuOpen ? 'Fechar' : 'Menu'}
          </button>
        </div>

        {mobileMenuOpen ? (
          <div
            id="mobile-navigation"
            className="border-t border-slate-100 pb-5 pt-4 lg:hidden"
          >
            <nav
              aria-label="Navegação mobile"
              className="grid gap-2"
            >
              {primaryNavigation.map((item) => {
                const current = isCurrentRoute(
                  pathname,
                  currentHash,
                  item.href,
                )

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={
                      current
                        ? item.href.startsWith('/#')
                          ? 'location'
                          : 'page'
                        : undefined
                    }
                    onClick={closeMobileMenu}
                    className={`flex min-h-12 items-center justify-between rounded-xl border px-4 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-[#0B7491] ${
                      current
                        ? 'border-cyan-300 bg-cyan-50 text-cyan-950'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-cyan-300 hover:bg-cyan-50 hover:text-[#071827]'
                    }`}
                  >
                    <span>{item.label}</span>

                    <span
                      aria-hidden="true"
                      className={
                        current ? 'text-[#0B7491]' : 'text-slate-400'
                      }
                    >
                      →
                    </span>
                  </Link>
                )
              })}
            </nav>

            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
              <Link
                href="/login"
                onClick={closeMobileMenu}
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-[#071827] transition hover:border-cyan-300 hover:bg-cyan-50 focus:outline-none focus:ring-2 focus:ring-[#0B7491]"
              >
                Entrar
              </Link>

              <Link
                href="/agenda"
                onClick={closeMobileMenu}
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#0B7491] px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-[#09657E] focus:outline-none focus:ring-2 focus:ring-[#071827]"
              >
                Conhecer a Agenda
              </Link>
            </div>

            <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-xl border border-slate-200 bg-[#F5F8FB] px-4 py-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#0B7491]">
                  Arquitetura
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-600">
                  Plataforma Operacional de Inteligência Educacional
                </p>
              </div>

              <span className="font-mono text-xs font-bold text-[#0B7491]">
                EDI
              </span>
            </div>
          </div>
        ) : null}
      </div>
    </header>
  )
}