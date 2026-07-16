'use client'

import { usePathname } from 'next/navigation'

import { PlatformNavigation } from '@/components/platform/PlatformNavigation'

const PRIVATE_ROUTES = [
  '/portal',
  '/perfil',
  '/agenda',
  '/professor-digital',
  '/organizations',
  '/schools',
  '/backoffice',
  '/experience-manager',
  '/analytics',
  '/sgpa',
]

function isPrivateRoute(
  pathname: string,
): boolean {
  return PRIVATE_ROUTES.some(
    (route) =>
      pathname === route ||
      pathname.startsWith(
        `${route}/`,
      ),
  )
}

export default function PlatformNavigationGate() {
  const pathname =
    usePathname()

  if (
    !isPrivateRoute(pathname)
  ) {
    return null
  }

  return <PlatformNavigation />
}