import { NextRequest, NextResponse } from 'next/server'

/**
 * Rotas públicas exatas.
 *
 * Apenas o endereço informado será público.
 * As subrotas continuarão protegidas.
 */
const EXACT_PUBLIC_ROUTES = [
  '/',
  '/login',
  '/agenda',
  '/professor-digital',
]

/**
 * Seções totalmente públicas.
 *
 * A rota principal e todas as suas subrotas serão públicas.
 */
const PUBLIC_ROUTE_PREFIXES = [
  '/academy',
  '/participacao',
]

function isPublicRoute(pathname: string): boolean {
  if (EXACT_PUBLIC_ROUTES.includes(pathname)) {
    return true
  }

  return PUBLIC_ROUTE_PREFIXES.some(
    (route) =>
      pathname === route || pathname.startsWith(`${route}/`),
  )
}

function isApiRoute(pathname: string): boolean {
  return pathname.startsWith('/api/')
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }

  const accessToken =
    request.cookies.get('sb-access-token')?.value ??
    request.cookies.get('access_token')?.value

  if (!accessToken) {
    if (isApiRoute(pathname)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Não autenticado.',
        },
        {
          status: 401,
        },
      )
    }

    const loginUrl = new URL('/login', request.url)

    loginUrl.searchParams.set(
      'redirectTo',
      `${pathname}${search}`,
    )

    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/agenda/:path*',
    '/professor-digital/:path*',
    '/dashboard/:path*',
    '/analytics/:path*',
    '/professor/:path*',
    '/admin/:path*',
    '/api/agenda/:path*',
  ],
}