'use client'

import {
  usePathname,
} from 'next/navigation'

import {
  PlatformNavigation,
} from '@/components/platform/PlatformNavigation'

const PUBLIC_PRODUCT_ROUTES = [
  '/agenda',
  '/professor-digital',
] as const

const EXACT_PRIVATE_ROUTES = [
  '/portal',
  '/perfil',
  '/suporte',
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
  '/suporte/',
  '/professor-digital/',
  '/organizations/',
  '/schools/',
  '/backoffice/',
  '/experience-manager/',
  '/analytics/',
  '/sgpa/',
  '/agenda/',
] as const

function isPublicProductRoute(
  pathname: string,
): boolean {
  return PUBLIC_PRODUCT_ROUTES.some(
    (route) =>
      pathname === route,
  )
}

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
   * Páginas públicas de apresentação:
   *
   * /agenda
   * /professor-digital
   *
   * Essas páginas apresentam os produtos e não devem
   * exibir a navegação privada da Central EIOS.
   *
   * Os módulos operacionais continuam privados:
   *
   * /agenda/dashboard
   * /agenda/calendario
   * /agenda/planejamento
   * /agenda/evidencias
   * /professor-digital/...
   * /suporte
   */
  if (
    isPublicProductRoute(
      pathname,
    )
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