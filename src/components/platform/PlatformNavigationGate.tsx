'use client'

import {
  usePathname,
} from 'next/navigation'

import {
  PlatformNavigation,
} from '@/components/platform/PlatformNavigation'

const EXACT_PRIVATE_ROUTES = [
  '/portal',
  '/perfil',
  '/professor-digital',
  '/organizations',
  '/schools',
  '/backoffice',
  '/experience-manager',
  '/analytics',
  '/sgpa',
] as const

const PRIVATE_ROUTE_PREFIXES = [
  '/portal/',
  '/perfil/',
  '/professor-digital/',
  '/organizations/',
  '/schools/',
  '/backoffice/',
  '/experience-manager/',
  '/analytics/',
  '/sgpa/',
  '/agenda/',
] as const

function isPrivateRoute(
  pathname: string,
): boolean {
  if (
    EXACT_PRIVATE_ROUTES.some(
      (route) =>
        pathname === route,
    )
  ) {
    return true
  }

  return PRIVATE_ROUTE_PREFIXES.some(
    (prefix) =>
      pathname.startsWith(
        prefix,
      ),
  )
}

export default function PlatformNavigationGate() {
  const pathname =
    usePathname()

  /*
   * /agenda é a página pública de apresentação
   * do produto.
   *
   * Os módulos operacionais privados começam em:
   * /agenda/dashboard
   * /agenda/calendario
   * /agenda/planejamento
   * /agenda/evidencias
   * e demais rotas internas.
   */
  if (
    pathname === '/agenda'
  ) {
    return null
  }

  if (
    !isPrivateRoute(
      pathname,
    )
  ) {
    return null
  }

  return (
    <PlatformNavigation />
  )
}