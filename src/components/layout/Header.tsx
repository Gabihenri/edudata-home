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
    <header className="sticky top-0 z-[60] border-b border-slate-200 bg-[#F8FAFC]/95 text-[#071827] shadow-sm backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-[88px] items-center justify-between gap-4 lg:min-h-[92px]">
          <Link
            href="/"
            aria-label="Ir para a página inicial da EduData IA"
            onClick={
              closeMobileMenu
            }
            className="flex min-w-0 shrink items-center rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B7491]"
          >
            <Image
              src="/logo-edudata-ia-header.png"
              alt="EduData IA"
              width={260}
              height={104}
              priority
              className="h-auto w-[164px] object-contain object-left sm:w-[190px] lg:w-[220px]"
            />
          </Link>

          <nav
            aria-label="Navegação principal"
            className="hidden items-center gap-5 text-sm font-semibold text-slate-700 lg:flex"
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
                    className={`border-b-2 py-2 transition focus:outline-none focus:ring-2 focus:ring-[#0B7491] ${
                      current
                        ? 'border-[#0B7491] text-[#071827]'
                        : 'border-transparent hover:border-cyan-300 hover:text-[#071827]'
                    }`}
                  >