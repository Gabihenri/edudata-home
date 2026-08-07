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
  compareEducationalAnalyticsHistoricalRuns,
} from '@/lib/agenda/educational-analytics/educational-analytics-history.service'

export const dynamic =
  'force-dynamic'

export const runtime =
  'nodejs'

const FEATURE_CODE =
  'agenda.planning'

const NO_CACHE_HEADERS = {
  'Cache-Control':
    'no-store, no-cache, must-revalidate',
}

function getAccessToken(
  request: NextRequest,
): string {
  const accessToken =
    request.cookies.get(
      'sb-access-token',
    )?.value ??
    request.cookies.get(
      'access_token',
    )?.value

  if (!accessToken) {
    throw new Error(
      'Usuário não autenticado.',
    )
  }

  return accessToken
}

function createAuthenticatedClient(
  accessToken: string,
): SupabaseClient {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error(
      'Variáveis públicas do Supabase não configuradas.',
    )
  }

  return createClient(
    url,
    anonKey,
    {
      global: {
        headers: {
          Authorization:
            `Bearer ${accessToken}`,
        },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  )
}

function createErrorResponse(
  error: unknown,
) {
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

  const normalized =
    message.toLowerCase()

  const status =
    normalized.includes('não autenticado')
      ? 401
      : normalized.includes('não foram encontradas')
        ? 404
        : normalized.includes('obrigatório')
          ? 400
          : 500

  return NextResponse.json(
    {
      success: false,
      error:
        status >= 500
          ? 'Não foi possível comparar as versões do histórico analítico.'
          : message,
      meta: {
        generatedAt:
          new Date().toISOString(),
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
    const user =
      await requireSessionUser()

    await requireFeatureAccess({
      userId: user.id,
      featureCode: FEATURE_CODE,
      options: {
        includeUsage: false,
      },
    })

    const searchParams =
      request.nextUrl.searchParams

    const baseRunId =
      searchParams.get('baseRunId')
    const targetRunId =
      searchParams.get('targetRunId')

    if (!baseRunId || !targetRunId) {
      return NextResponse.json(
        {
          success: false,
          error:
            'baseRunId e targetRunId são obrigatórios.',
          meta: {
            generatedAt:
              new Date().toISOString(),
          },
        },
        {
          status: 400,
          headers: NO_CACHE_HEADERS,
        },
      )
    }

    const comparison =
      await compareEducationalAnalyticsHistoricalRuns({
        client:
          createAuthenticatedClient(
            getAccessToken(request),
          ),
        userId:
          user.id,
        baseRunId,
        targetRunId,
      })

    return NextResponse.json(
      {
        success: true,
        comparison,
        meta: {
          generatedAt:
            new Date().toISOString(),
        },
      },
      {
        status: 200,
        headers: NO_CACHE_HEADERS,
      },
    )
  } catch (error) {
    console.error(
      '[AGENDA_EDUCATIONAL_ANALYTICS_HISTORY_COMPARE_ERROR]',
      {
        message:
          error instanceof Error
            ? error.message
            : 'Erro desconhecido.',
        occurredAt:
          new Date().toISOString(),
      },
    )

    return createErrorResponse(error)
  }
}
