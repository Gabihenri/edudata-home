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
  PlanningRepository,
} from '@/lib/agenda/repository/planning.repository'

import {
  PlanningService,
} from '@/lib/agenda/services/planning.service'

import {
  requireSessionUser,
} from '@/lib/auth/session'

export const dynamic =
  'force-dynamic'

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

function createPlanningService(
  request: NextRequest,
): PlanningService {
  const client =
    createAuthenticatedClient(
      getAccessToken(
        request,
      ),
    )

  const repository =
    new PlanningRepository(
      client,
    )

  return new PlanningService(
    repository,
  )
}

function getErrorStatus(
  error: unknown,
): number {
  if (
    !(error instanceof Error)
  ) {
    return 500
  }

  const message =
    error.message
      .toLowerCase()

  if (
    message.includes(
      'não autenticado',
    ) ||
    message.includes(
      'unauthorized',
    )
  ) {
    return 401
  }

  if (
    message.includes(
      'permission denied',
    ) ||
    message.includes(
      'row-level security',
    ) ||
    message.includes(
      'sem permissão',
    ) ||
    message.includes(
      'não autorizado',
    ) ||
    message.includes(
      'forbidden',
    )
  ) {
    return 403
  }

  if (
    message.includes(
      'não encontrado',
    )
  ) {
    return 404
  }

  return 500
}

function createErrorResponse(
  error: unknown,
) {
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
        status: 403,
        headers:
          NO_CACHE_HEADERS,
      },
    )
  }

  const status =
    getErrorStatus(
      error,
    )

  const message =
    status >= 500
      ? 'Não foi possível carregar a lixeira de planejamentos.'
      : error instanceof Error
        ? error.message
        : 'Não foi possível carregar a lixeira de planejamentos.'

  return NextResponse.json(
    {
      success: false,
      error: message,
    },
    {
      status,
      headers:
        NO_CACHE_HEADERS,
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
      userId:
        user.id,

      featureCode:
        'agenda.planning',

      options: {
        includeUsage:
          false,
      },
    })

    const service =
      createPlanningService(
        request,
      )

    const records =
      await service
        .listByUserId(
          user.id,
          {
            includeDeleted:
              true,
          },
        )

    const deletedRecords =
      records
        .filter(
          record =>
            record.deleted_at !==
            null,
        )
        .sort(
          (
            firstRecord,
            secondRecord,
          ) => {
            const firstDate =
              firstRecord
                .deleted_at
                ? new Date(
                    firstRecord
                      .deleted_at,
                  ).getTime()
                : 0

            const secondDate =
              secondRecord
                .deleted_at
                ? new Date(
                    secondRecord
                      .deleted_at,
                  ).getTime()
                : 0

            return (
              secondDate -
              firstDate
            )
          },
        )

    return NextResponse.json(
      {
        success: true,
        total:
          deletedRecords.length,
        data:
          deletedRecords,
      },
      {
        status: 200,
        headers:
          NO_CACHE_HEADERS,
      },
    )
  } catch (error) {
    console.error(
      '[AGENDA_PLANNING_DELETED_GET_ERROR]',
      error,
    )

    return createErrorResponse(
      error,
    )
  }
}