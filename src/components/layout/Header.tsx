'use client'

import {
  useEffect,
  useState,
} from 'react'

import Image from 'next/image'
import Link from 'next/link'
import {
  usePathname,
} from 'next/navigation'

type NavigationItem = {
  label: string
  href: string
}

const primaryNavigation:
  NavigationItem[] = [
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
      label: 'Agenda Inteligente EDI',
      href: '/agenda',
    },
    {
      label: 'EduData Academy',
      href: '/academy',
    },
  ]

function isCurrentRoute(
  pathname: string,
  href: string,
): boolean {
  if (
    href.startsWith('/#')
  ) {
    return pathname === '/'
  }

  if (
    href === '/'
  ) {
    return pathname === '/'
  }

  return (
    pathname === href ||
    pathname.startsWith(
      `${href}/`,
    )
  )
}

export default function Header() {
  const pathname =
    usePathname()

  const [
    mobileMenuOpen,
    setMobileMenuOpen,
  ] =
    useState(false)

  useEffect(() => {
    setMobileMenuOpen(
      false,
    )
  }, [pathname])

  return (
    <header className="sticky top-0 z-[60] border-b border-white/10 bg-[#050816] text-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-[72px] items-center justify-between gap-4 lg:min-h-[88px]">
          <Link
            href="/"
            aria-label="Ir para a página inicial da EduData IA"
            className="flex min-w-0 shrink items-center"
          >
            <Image
              src="/logo-edudata-ia-header.png"
              alt="EduData IA"
              width={260}
              height={104}
              priority
              className="h-auto w-[132px] object-contain object-left sm:w-[170px] lg:w-[220px]"
            />
          </Link>

          <nav
            aria-label="Navegação principal"
            className="hidden items-center gap-6 text-sm font-semibold text-slate-200 lg:flex"
          >
            {primaryNavigation.map(
              (item) => {
                const current =
                  isCurrentRoute(
                    pathname,
                    item.href,
                  )

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={
                      current
                        ? 'page'
                        : undefined
                    }
                    className={`border-b-2 py-2 transition ${
                      current
                        ? 'border-cyan-300 text-white'
                        : 'border-transparent hover:border-white/20 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </Link>
                )
              },
            )}
          </nav>

          <div className="hidden shrink-0 items-center gap-3 lg:flex">
            <Link
              href="/login"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Entrar
            </Link>

            <Link
              href="/academy#courses"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#0B7491] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#09657E]"
            >
              Inscrever-se
            </Link>
          </div>

          <button
            type="button"
            aria-expanded={
              mobileMenuOpen
            }
            aria-controls="mobile-navigation"
            aria-label={
              mobileMenuOpen
                ? 'Fechar menu principal'
                : 'Abrir menu principal'
            }
            onClick={() =>
              setMobileMenuOpen(
                (current) =>
                  !current,
              )
            }
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10 lg:hidden"
          >
            {mobileMenuOpen
              ? 'Fechar'
              : 'Menu'}
          </button>
        </div>

        {mobileMenuOpen ? (
          <div
            id="mobile-navigation"
            className="border-t border-white/10 pb-5 pt-4 lg:hidden"
          >
            <nav
              aria-label="Navegação mobile"
              className="grid gap-2"
            >
              {primaryNavigation.map(
                (item) => {
                  const current =
                    isCurrentRoute(
                      pathname,
                      item.href,
                    )

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={
                        current
                          ? 'page'
                          : undefined
                      }
                      className={`flex min-h-12 items-center justify-between rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                        current
                          ? 'border-cyan-300/30 bg-cyan-300/10 text-cyan-100'
                          : 'border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <span>
                        {item.label}
                      </span>

                      <span
                        aria-hidden="true"
                        className={
                          current
                            ? 'text-cyan-300'
                            : 'text-slate-500'
                        }
                      >
                        →
                      </span>
                    </Link>
                  )
                },
              )}
            </nav>

            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/10 pt-4">
              <Link
                href="/login"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Entrar
              </Link>

              <Link
                href="/academy#courses"
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#0B7491] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#09657E]"
              >
                Inscrever-se
              </Link>
            </div>

            <div className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-300">
                  EIOS
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Plataforma Operacional de Inteligência Educacional
                </p>
              </div>

              <span className="font-mono text-xs font-bold text-cyan-300">
                EDI
              </span>
            </div>
          </div>
        ) : null}
      </div>
    </header>
  )
}