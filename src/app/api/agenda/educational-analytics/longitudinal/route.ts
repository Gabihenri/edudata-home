import {
  createClient,
  type SupabaseClient,
} from '@supabase/supabase-js'

import {
  NextRequest,
  NextResponse,
} from 'next/server'

import {
  isAccessDeniedError,
  requireFeatureAccess,
  serializeAccessDeniedError,
} from '@/lib/access/guards/require-feature-access'

import {
  requireSessionUser,
} from '@/lib/auth/session'

import {
  buildEducationalAnalyticsEvolution,
} from '@/lib/agenda/educational-analytics/educational-analytics-evolution.service'

import {
  buildLongitudinalIntelligence,
} from '@/lib/agenda/educational-analytics/longitudinal-intelligence.engine'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const FEATURE_CODE = 'agenda.planning'

const NO_CACHE_HEADERS = {
  'Cache-Control':
    'no-store, no-cache, must-revalidate',
}

function getAccessToken(
  request: NextRequest,
): string {
  const accessToken =
    request.cookies.get('sb-access-token')?.value ??
    request.cookies.get('access_token')?.value

  if (!accessToken) {
    throw new Error('Usuário não autenticado.')
  }

  return accessToken
}

function createAuthenticatedClient(
  accessToken: string,
): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error(
      'Variáveis públicas do Supabase não configuradas.',
    )
  }

  return createClient(url, anonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
}

function normalizeLimit(
  value: string | null,
): number {
  const parsed = Number(value ?? 50)

  return Number.isFinite(parsed)
    ? Math.min(100, Math.max(2, Math.trunc(parsed)))
    : 50
}

function createErrorResponse(error: unknown) {
  if (isAccessDeniedError(error)) {
    return NextResponse.json(
      serializeAccessDeniedError(error),
      {
        status: 403,
        headers: NO_CACHE_HEADERS,
      },
    )
  }

  const message =
    error instanceof Error
      ? error.message
      : 'Erro desconhecido.'

  const status =
    message.toLowerCase().includes('não autenticado')
      ? 401
      : 500

  return NextResponse.json(
    {
      success: false,
      error:
        status === 500
          ? 'Não foi possível gerar a inteligência longitudinal do Educational Analytics.'
          : message,
      meta: {
        generatedAt: new Date().toISOString(),
      },
    },
    {
      status,
      headers: NO_CACHE_HEADERS,
    },
  )
}

export async function GET(
  request: NextRequest,
) {
  try {
    const user = await requireSessionUser()

    await requireFeatureAccess({
      userId: user.id,
      featureCode: FEATURE_CODE,
      options: {
        includeUsage: false,
      },
    })

    const client = createAuthenticatedClient(
      getAccessToken(request),
    )

    const analysisKey =
      request.nextUrl.searchParams.get('analysisKey')

    const evolution =
      await buildEducationalAnalyticsEvolution({
        client,
        userId: user.id,
        analysisKey,
        limit: normalizeLimit(
          request.nextUrl.searchParams.get('limit'),
        ),
      })

    const intelligence =
      buildLongitudinalIntelligence(evolution)

    return NextResponse.json(
      {
        success: true,
        intelligence,
        source: {
          analysisKey,
          versionCount:
            evolution.summary.totalVersions,
          firstGeneratedAt:
            evolution.summary.firstGeneratedAt,
          latestGeneratedAt:
            evolution.summary.latestGeneratedAt,
        },
        meta: {
          generatedAt:
            new Date().toISOString(),
          apiRoute:
            '/api/agenda/educational-analytics/longitudinal',
        },
      },
      {
        status: 200,
        headers: NO_CACHE_HEADERS,
      },
    )
  } catch (error) {
    console.error(
      '[AGENDA_EDUCATIONAL_ANALYTICS_LONGITUDINAL_ERROR]',
      {
        message:
          error instanceof Error
            ? error.message
            : 'Erro desconhecido.',
        occurredAt: new Date().toISOString(),
      },
    )

    return createErrorResponse(error)
  }
}
