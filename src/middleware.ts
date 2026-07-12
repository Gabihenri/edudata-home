import { NextRequest, NextResponse } from 'next/server'

const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/academy',
  '/participacao',
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isPublicRoute = PUBLIC_ROUTES.some(
    (route) =>
      pathname === route || pathname.startsWith(`${route}/`),
  )

  if (isPublicRoute) {
    return NextResponse.next()
  }

  const accessToken =
    request.cookies.get('sb-access-token')?.value ??
    request.cookies.get('access_token')?.value

  if (!accessToken) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirectTo', pathname)

    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/agenda/:path*',
    '/dashboard/:path*',
    '/analytics/:path*',
    '/professor/:path*',
    '/admin/:path*',
    '/api/agenda/:path*',
  ],
}