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

export const dynamic =
  'force-dynamic'

export const runtime =
  'nodejs'

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
    process.env
      .NEXT_PUBLIC_SUPABASE_URL

  const anonKey =
    process.env
      .NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (
    !url ||
    !anonKey
  ) {
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
        persistSession:
          false,

        autoRefreshToken:
          false,

        detectSessionInUrl:
          false,
      },
    },
  )
}

async function requireSnapshotAccess(
  userId: string,
): Promise<void> {
  await requireFeatureAccess({
    userId,

    featureCode:
      'agenda.planning',

    options: {
      includeUsage:
        false,
    },
  })
}

function buildErrorResponse(
  error: unknown,
): NextResponse {
  if (
    isAccessDeniedError(
      error,
    )
  ) {
    return NextResponse.json(
      serializeAccessDeniedError(
        error,
      ),
      {
        status:
          403,

        headers:
          NO_CACHE_HEADERS,
      },
    )
  }

  const message =
    error instanceof Error
      ? error.message
      : 'Não foi possível carregar o ciclo operacional da Agenda.'

  const normalizedMessage =
    message.toLowerCase()

  if (
    normalizedMessage.includes(
      'não autenticado',
    )
  ) {
    return NextResponse.json(
      {
        success:
          false,

        error:
          'Usuário não autenticado.',
      },
      {
        status:
          401,

        headers:
          NO_CACHE_HEADERS,
      },
    )
  }

  if (
    normalizedMessage.includes(
      'não configurada',
    ) ||
    normalizedMessage.includes(
      'não configuradas',
    )
  ) {
    return NextResponse.json(
      {
        success:
          false,

        error:
          message,
      },
      {
        status:
          503,

        headers:
          NO_CACHE_HEADERS,
      },
    )
  }

  return NextResponse.json(
    {
      success:
        false,

      error:
        message,
    },
    {
      status:
        500,

      headers:
        NO_CACHE_HEADERS,
    },
  )
}

export async function GET(
  request: NextRequest,
): Promise<NextResponse> {
  try {
    const user =
      await requireSessionUser()

    await requireSnapshotAccess(
      user.id,
    )

    const client =
      createAuthenticatedClient(
        getAccessToken(
          request,
        ),
      )

    const result =
      await loadAgendaOperationalSnapshot({
        client,

        userId:
          user.id,
      })

    return NextResponse.json(
      {
        success:
          true,

        generatedAt:
          result.generatedAt,

        summary:
          result.summary,

        data:
          result.snapshot,
      },
      {
        status:
          200,

        headers:
          NO_CACHE_HEADERS,
      },
    )
  } catch (
    error
  ) {
    console.error(
      '[AGENDA_OPERATIONAL_SNAPSHOT_GET_ERROR]',
      {
        error:
          error instanceof Error
            ? error.message
            : error,
      },
    )

    return buildErrorResponse(
      error,
    )
  }
}