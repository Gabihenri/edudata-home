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
  if (
    href.startsWith('/#')
  ) {
    const targetHash =
      href.slice(1)

    return (
      pathname === '/' &&
      currentHash === targetHash
    )
  }

  if (
    href === '/'
  ) {
    return (
      pathname === '/' &&
      !currentHash
    )
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

  const [
    currentHash,
    setCurrentHash,
  ] =
    useState('')

  useEffect(() => {
    setMobileMenuOpen(false)

    setCurrentHash(
      window.location.hash,
    )
  }, [pathname])

  useEffect(() => {
    function handleHashChange() {
      setCurrentHash(
        window.location.hash,
      )

      setMobileMenuOpen(false)
    }

    window.addEventListener(
      'hashchange',
      handleHashChange,
    )

    return () => {
      window.removeEventListener(
        'hashchange',
        handleHashChange,
      )
    }
  }, [])

  function closeMobileMenu():
    void {
    setMobileMenuOpen(false)
  }

  return (
    <header className="sticky top-0 z-[60] border-b border-white/10 bg-[#071827] text-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-[72px] items-center justify-between gap-4 lg:min-h-[84px]">
          <Link
            href="/"
            aria-label="Ir para a página inicial da EduData IA"
            onClick={
              closeMobileMenu
            }
            className="flex min-w-0 shrink items-center rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-300"
          >
            <Image
              src="/logo-edudata-ia-header.png"
              alt="EduData IA"
              width={260}
              height={104}
              priority
              className="h-auto w-[132px] object-contain object-left sm:w-[170px] lg:w-[208px]"
            />
          </Link>

          <nav
            aria-label="Navegação principal"
            className="hidden items-center gap-5 text-sm font-semibold text-slate-300 lg:flex"
          >
            {primaryNavigation.map(
              (item) => {
                const current =
                  isCurrentRoute(
                    pathname,
                    currentHash,
                    item.href,
                  )

                const ariaCurrent =
                  current
                    ? item.href.startsWith(
                        '/#',
                      )
                      ? 'location'
                      : 'page'
                    : undefined

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={
                      ariaCurrent
                    }
                    className={`border-b-2 py-2 transition focus:outline-none focus:ring-2 focus:ring-cyan-300 ${
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
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-300"
            >
              Entrar
            </Link>

            <Link
              href="/agenda"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#0B7491] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#09657E] focus:outline-none focus:ring-2 focus:ring-cyan-300"
            >
              Conhecer a Agenda
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
                (
                  current,
                ) =>
                  !current,
              )
            }
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-300 lg:hidden"
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
                      currentHash,
                      item.href,
                    )

                  const ariaCurrent =
                    current
                      ? item.href.startsWith(
                          '/#',
                        )
                        ? 'location'
                        : 'page'
                      : undefined

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={
                        ariaCurrent
                      }
                      onClick={
                        closeMobileMenu
                      }
                      className={`flex min-h-12 items-center justify-between rounded-xl border px-4 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-cyan-300 ${
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
                onClick={
                  closeMobileMenu
                }
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-300"
              >
                Entrar
              </Link>

              <Link
                href="/agenda"
                onClick={
                  closeMobileMenu
                }
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#0B7491] px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-[#09657E] focus:outline-none focus:ring-2 focus:ring-cyan-300"
              >
                Conhecer a Agenda
              </Link>
            </div>

            <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-300">
                  Arquitetura
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-400">
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