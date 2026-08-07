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
  loadAgendaOperationalSnapshot,
} from '@/lib/agenda/services/operational-snapshot.service'

import {
  buildAgendaEducationalAnalyticsInput,
} from '@/lib/agenda/educational-analytics/agenda-analytics.adapter'

import {
  runEducationalAnalytics,
} from '@/lib/agenda/educational-analytics/educational-analytics.service'

export const dynamic =
  'force-dynamic'

export const runtime =
  'nodejs'

const NO_CACHE_HEADERS = {
  'Cache-Control':
    'no-store, no-cache, must-revalidate',
}

const FEATURE_CODE =
  'agenda.planning'

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
    process.env
      .NEXT_PUBLIC_SUPABASE_URL

  const anonKey =
    process.env
      .NEXT_PUBLIC_SUPABASE_ANON_KEY

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

  const status =
    message.toLowerCase()
      .includes('não autenticado')
      ? 401
      : 500

  return NextResponse.json(
    {
      success: false,
      error:
        status === 500
          ? 'Não foi possível executar a análise automática da Agenda.'
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

    const client =
      createAuthenticatedClient(
        getAccessToken(request),
      )

    const snapshotResult =
      await loadAgendaOperationalSnapshot({
        client,
        userId: user.id,
      })

    const input =
      buildAgendaEducationalAnalyticsInput({
        snapshot:
          snapshotResult.snapshot,
        userId:
          user.id,
        correlationId:
          `agenda-operational-${crypto.randomUUID()}`,
      })

    const result =
      runEducationalAnalytics({
        input,
        executeCorrelation: true,
        executePattern: true,
        executeInfluence: false,
        metadata: {
          source:
            'agenda_operational_snapshot',
          snapshotGeneratedAt:
            snapshotResult.generatedAt,
        },
      })

    return NextResponse.json(
      {
        ...result,
        snapshot: {
          summary:
            snapshotResult.summary,
          generatedAt:
            snapshotResult.generatedAt,
        },
      },
      {
        status:
          result.success
            ? 200
            : 422,
        headers:
          NO_CACHE_HEADERS,
      },
    )
  } catch (error) {
    console.error(
      '[AGENDA_EDUCATIONAL_ANALYTICS_OPERATIONAL_ERROR]',
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
