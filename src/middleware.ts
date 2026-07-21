import {
  NextRequest,
  NextResponse,
} from 'next/server'

const ACCESS_TOKEN_COOKIE =
  'sb-access-token'

const REFRESH_TOKEN_COOKIE =
  'sb-refresh-token'

const TOKEN_RENEWAL_MARGIN_SECONDS =
  60

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

type RefreshSessionResponse = {
  access_token?: unknown
  refresh_token?: unknown
  expires_in?: unknown
}

type RefreshedSession = {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

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
    route =>
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
      ACCESS_TOKEN_COOKIE,
    )?.value ??
    request.cookies.get(
      'access_token',
    )?.value ??
    null
  )
}

function getRefreshToken(
  request: NextRequest,
): string | null {
  return (
    request.cookies.get(
      REFRESH_TOKEN_COOKIE,
    )?.value ??
    null
  )
}

function decodeBase64Url(
  value: string,
): string {
  const normalizedValue =
    value
      .replace(/-/g, '+')
      .replace(/_/g, '/')

  const paddingLength =
    (4 -
      (normalizedValue.length %
        4)) %
    4

  const paddedValue =
    normalizedValue +
    '='.repeat(
      paddingLength,
    )

  return atob(
    paddedValue,
  )
}

function getTokenExpiration(
  accessToken: string,
): number | null {
  try {
    const tokenParts =
      accessToken.split('.')

    if (
      tokenParts.length <
      2
    ) {
      return null
    }

    const payload =
      JSON.parse(
        decodeBase64Url(
          tokenParts[1],
        ),
      ) as {
        exp?: unknown
      }

    if (
      typeof payload.exp !==
        'number' ||
      !Number.isFinite(
        payload.exp,
      )
    ) {
      return null
    }

    return payload.exp
  } catch {
    return null
  }
}

function isAccessTokenFresh(
  accessToken: string,
): boolean {
  const expiration =
    getTokenExpiration(
      accessToken,
    )

  if (!expiration) {
    return false
  }

  const currentTime =
    Math.floor(
      Date.now() / 1000,
    )

  return (
    expiration >
    currentTime +
      TOKEN_RENEWAL_MARGIN_SECONDS
  )
}

function normalizeExpiresIn(
  value: unknown,
): number {
  if (
    typeof value ===
      'number' &&
    Number.isFinite(value) &&
    value > 0
  ) {
    return Math.floor(
      value,
    )
  }

  return 60 * 60
}

async function refreshSession(
  refreshToken: string,
): Promise<RefreshedSession | null> {
  const supabaseUrl =
    process.env
      .NEXT_PUBLIC_SUPABASE_URL

  const anonKey =
    process.env
      .NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (
    !supabaseUrl ||
    !anonKey
  ) {
    console.error(
      '[AUTH_REFRESH_CONFIGURATION_ERROR]',
      'Variáveis públicas do Supabase não configuradas.',
    )

    return null
  }

  try {
    const response =
      await fetch(
        `${supabaseUrl}/auth/v1/token?grant_type=refresh_token`,
        {
          method:
            'POST',

          headers: {
            apikey:
              anonKey,

            Authorization:
              `Bearer ${anonKey}`,

            'Content-Type':
              'application/json',
          },

          body:
            JSON.stringify({
              refresh_token:
                refreshToken,
            }),

          cache:
            'no-store',
        },
      )

    if (!response.ok) {
      console.warn(
        '[AUTH_REFRESH_REJECTED]',
        response.status,
      )

      return null
    }

    const data =
      (await response.json()) as
        RefreshSessionResponse

    if (
      typeof data.access_token !==
        'string' ||
      !data.access_token.trim() ||
      typeof data.refresh_token !==
        'string' ||
      !data.refresh_token.trim()
    ) {
      console.error(
        '[AUTH_REFRESH_INVALID_RESPONSE]',
      )

      return null
    }

    return {
      accessToken:
        data.access_token,

      refreshToken:
        data.refresh_token,

      expiresIn:
        normalizeExpiresIn(
          data.expires_in,
        ),
    }
  } catch (error) {
    console.error(
      '[AUTH_REFRESH_ERROR]',
      error,
    )

    return null
  }
}

function setSessionCookies(
  response: NextResponse,
  session: RefreshedSession,
) {
  const isProduction =
    process.env.NODE_ENV ===
    'production'

  response.cookies.set({
    name:
      ACCESS_TOKEN_COOKIE,

    value:
      session.accessToken,

    httpOnly:
      true,

    secure:
      isProduction,

    sameSite:
      'lax',

    path:
      '/',

    maxAge:
      session.expiresIn,
  })

  response.cookies.set({
    name:
      REFRESH_TOKEN_COOKIE,

    value:
      session.refreshToken,

    httpOnly:
      true,

    secure:
      isProduction,

    sameSite:
      'lax',

    path:
      '/',

    maxAge:
      60 * 60 * 24 * 30,
  })
}

function clearSessionCookies(
  response: NextResponse,
) {
  const isProduction =
    process.env.NODE_ENV ===
    'production'

  response.cookies.set({
    name:
      ACCESS_TOKEN_COOKIE,

    value:
      '',

    httpOnly:
      true,

    secure:
      isProduction,

    sameSite:
      'lax',

    path:
      '/',

    maxAge:
      0,
  })

  response.cookies.set({
    name:
      REFRESH_TOKEN_COOKIE,

    value:
      '',

    httpOnly:
      true,

    secure:
      isProduction,

    sameSite:
      'lax',

    path:
      '/',

    maxAge:
      0,
  })

  response.cookies.set({
    name:
      'access_token',

    value:
      '',

    httpOnly:
      true,

    secure:
      isProduction,

    sameSite:
      'lax',

    path:
      '/',

    maxAge:
      0,
  })
}

function createUnauthenticatedResponse(
  request: NextRequest,
): NextResponse {
  const {
    pathname,
    search,
  } = request.nextUrl

  if (isApiRoute(pathname)) {
    const response =
      NextResponse.json(
        {
          success:
            false,

          error:
            'Usuário não autenticado.',
        },
        {
          status:
            401,

          headers: {
            'Cache-Control':
              'no-store, no-cache, must-revalidate',
          },
        },
      )

    clearSessionCookies(
      response,
    )

    return response
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

  const response =
    NextResponse.redirect(
      loginUrl,
    )

  clearSessionCookies(
    response,
  )

  return response
}

function createRefreshedResponse(
  request: NextRequest,
  session: RefreshedSession,
): NextResponse {
  /*
   * Atualiza os cookies da requisição atual para que
   * Route Handlers e Server Components recebam o novo
   * access token sem precisar de uma segunda navegação.
   */

  request.cookies.set(
    ACCESS_TOKEN_COOKIE,
    session.accessToken,
  )

  request.cookies.set(
    REFRESH_TOKEN_COOKIE,
    session.refreshToken,
  )

  const requestHeaders =
    new Headers(
      request.headers,
    )

  const forwardedCookieHeader =
    request.cookies
      .getAll()
      .map(
        cookie =>
          `${cookie.name}=${cookie.value}`,
      )
      .join('; ')

  requestHeaders.set(
    'cookie',
    forwardedCookieHeader,
  )

  const response =
    NextResponse.next({
      request: {
        headers:
          requestHeaders,
      },
    })

  setSessionCookies(
    response,
    session,
  )

  return response
}

export async function middleware(
  request: NextRequest,
) {
  const {
    pathname,
  } = request.nextUrl

  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }

  const accessToken =
    getAccessToken(
      request,
    )

  if (
    accessToken &&
    isAccessTokenFresh(
      accessToken,
    )
  ) {
    return NextResponse.next()
  }

  const refreshToken =
    getRefreshToken(
      request,
    )

  if (!refreshToken) {
    return createUnauthenticatedResponse(
      request,
    )
  }

  const refreshedSession =
    await refreshSession(
      refreshToken,
    )

  if (!refreshedSession) {
    return createUnauthenticatedResponse(
      request,
    )
  }

  return createRefreshedResponse(
    request,
    refreshedSession,
  )
}

export const config = {
  matcher: [
    '/portal/:path*',
    '/perfil/:path*',
    '/suporte/:path*',
    '/agenda/:path*',
    '/professor-digital/:path*',
    '/dashboard/:path*',
    '/analytics/:path*',
    '/professor/:path*',
    '/admin/:path*',
    '/backoffice/:path*',
    '/experience-manager/:path*',

    '/api/admin/:path*',
    '/api/portal/:path*',
    '/api/profile/:path*',
    '/api/support/:path*',
    '/api/agenda/:path*',
  ],
}