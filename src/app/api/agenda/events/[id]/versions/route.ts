import {
  NextRequest,
  NextResponse,
} from 'next/server'

import {
  isAccessDeniedError,
  requireFeatureAccess,
  serializeAccessDeniedError,
} from '@/lib/access/guards/require-feature-access'

import { requireSessionUser } from '@/lib/auth/session'

import { eventAuditService } from '@/lib/agenda/services/event-audit.service'

export const dynamic = 'force-dynamic'

type RouteContext = {
  params: {
    id: string
  }
}

const NO_CACHE_HEADERS = {
  'Cache-Control':
    'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
  Vary: 'Cookie',
}

function parseLimit(
  value: string | null,
): number | undefined {
  if (!value) {
    return undefined
  }

  const parsedValue =
    Number(value)

  if (
    !Number.isInteger(
      parsedValue,
    ) ||
    parsedValue < 1
  ) {
    throw new Error(
      'O limite de versões deve ser um número inteiro positivo.',
    )
  }

  return parsedValue
}

function getErrorStatus(
  error: unknown,
): number {
  if (!(error instanceof Error)) {
    return 500
  }

  const message =
    error.message.toLowerCase()

  if (
    message.includes(
      'não autenticado',
    ) ||
    message.includes(
      'não autorizado',
    ) ||
    message.includes(
      'unauthorized',
    )
  ) {
    return 401
  }

  if (
    message.includes(
      'não possui permissão',
    ) ||
    message.includes(
      'sem permissão',
    ) ||
    message.includes(
      'acesso negado',
    ) ||
    message.includes(
      'proibido',
    ) ||
    message.includes(
      'forbidden',
    ) ||
    message.includes(
      'permission denied',
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

  if (
    message.includes(
      'obrigatório',
    ) ||
    message.includes(
      'obrigatória',
    ) ||
    message.includes(
      'inválido',
    ) ||
    message.includes(
      'inválida',
    ) ||
    message.includes(
      'número inteiro',
    )
  ) {
    return 400
  }

  return 500
}

function createErrorResponse(
  error: unknown,
  fallbackMessage: string,
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
    getErrorStatus(error)

  const message =
    status >= 500
      ? fallbackMessage
      : error instanceof Error
        ? error.message
        : fallbackMessage

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
  context: RouteContext,
) {
  try {
    const user =
      await requireSessionUser()

    await requireFeatureAccess({
      userId:
        user.id,

      featureCode:
        'agenda.events',

      options: {
        includeUsage: false,
      },
    })

    const limit =
      parseLimit(
        request.nextUrl
          .searchParams
          .get('limit'),
      )

    const result =
      await eventAuditService
        .listEventVersions(
          {
            eventId:
              context.params.id,

            limit,
          },
          {
            requesterUserId:
              user.id,
          },
        )

    return NextResponse.json(
      {
        success: true,

        data: {
          event: {
            id:
              result.event.id,

            title:
              result.event.title,

            isDeleted:
              result.event
                .isDeleted,
          },

          total:
            result.total,

          versions:
            result.versions,
        },
      },
      {
        status: 200,
        headers:
          NO_CACHE_HEADERS,
      },
    )
  } catch (error) {
    console.error(
      '[AGENDA_EVENT_VERSIONS_ERROR]',
      error,
    )

    return createErrorResponse(
      error,
      'Não foi possível carregar as versões do evento.',
    )
  }
}