import {
  NextRequest,
  NextResponse,
} from 'next/server'

const EXACT_PUBLIC_ROUTES = [
  '/',
  '/login',
  '/agenda',
  '/professor-digital',
]

const PUBLIC_ROUTE_PREFIXES = [
  '/academy',
  '/participacao',
]

function isPublicRoute(
  pathname: string,
): boolean {
  if (
    EXACT_PUBLIC_ROUTES.includes(
      pathname,
    )
  ) {
    return true
  }

  return PUBLIC_ROUTE_PREFIXES.some(
    (route) =>
      pathname === route ||
      pathname.startsWith(
        `${route}/`,
      ),
  )
}

function isApiRoute(
  pathname: string,
): boolean {
  return pathname.startsWith(
    '/api/',
  )
}

function getAccessToken(
  request: NextRequest,
): string | null {
  return (
    request.cookies.get(
      'sb-access-token',
    )?.value ??
    request.cookies.get(
      'access_token',
    )?.value ??
    null
  )
}

export function middleware(
  request: NextRequest,
) {
  const {
    pathname,
    search,
  } = request.nextUrl

  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }

  const accessToken =
    getAccessToken(request)

  if (!accessToken) {
    if (isApiRoute(pathname)) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Usuário não autenticado.',
        },
        {
          status: 401,
          headers: {
            'Cache-Control':
              'no-store, no-cache, must-revalidate',
          },
        },
      )
    }

    const loginUrl =
      new URL(
        '/login',
        request.url,
      )

    loginUrl.searchParams.set(
      'redirectTo',
      `${pathname}${search}`,
    )

    return NextResponse.redirect(
      loginUrl,
    )
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/portal/:path*',
    '/perfil/:path*',
    '/agenda/:path*',
    '/professor-digital/:path*',
    '/dashboard/:path*',
    '/analytics/:path*',
    '/professor/:path*',
    '/admin/:path*',
    '/backoffice/:path*',
    '/experience-manager/:path*',

    '/api/portal/:path*',
    '/api/profile/:path*',
    '/api/agenda/:path*',
  ],
}