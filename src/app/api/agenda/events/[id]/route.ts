import {
  NextRequest,
  NextResponse,
} from 'next/server'

import {
  isAccessDeniedError,
  requireFeatureAccess,
  serializeAccessDeniedError,
} from '@/lib/access/guards/require-feature-access'

import { eventsService } from '@/lib/agenda'
import { requireSessionUser } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

type RouteContext = {
  params: {
    id: string
  }
}

type UnknownRecord =
  Record<string, unknown>

const NO_CACHE_HEADERS = {
  'Cache-Control':
    'no-store, no-cache, must-revalidate',
}

function isRecord(
  value: unknown,
): value is UnknownRecord {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  )
}

function normalizeDeletionReason(
  body: unknown,
): string {
  if (!isRecord(body)) {
    throw new Error(
      'Motivo da exclusão é obrigatório.',
    )
  }

  const reason = body.reason

  if (
    typeof reason !== 'string' ||
    !reason.trim()
  ) {
    throw new Error(
      'Motivo da exclusão é obrigatório.',
    )
  }

  return reason.trim()
}

async function readRequestBody(
  request: NextRequest,
): Promise<unknown> {
  try {
    return await request.json()
  } catch {
    throw new Error(
      'Motivo da exclusão é obrigatório.',
    )
  }
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
    message.includes('não autenticado') ||
    message.includes('não autorizado') ||
    message.includes('unauthorized')
  ) {
    return 401
  }

  if (
    message.includes('não possui permissão') ||
    message.includes('sem permissão') ||
    message.includes('proibido') ||
    message.includes('forbidden') ||
    message.includes('permission denied')
  ) {
    return 403
  }

  if (
    message.includes('não encontrado') ||
    message.includes('já excluído')
  ) {
    return 404
  }

  if (
    message.includes('obrigatório') ||
    message.includes('obrigatória') ||
    message.includes('inválido') ||
    message.includes('inválida') ||
    message.includes('ultrapassar')
  ) {
    return 400
  }

  return 500
}

function createErrorResponse(
  error: unknown,
  fallbackMessage: string,
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
      headers: NO_CACHE_HEADERS,
    },
  )
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const user =
      await requireSessionUser()

    await requireFeatureAccess({
      userId: user.id,
      featureCode: 'agenda.events',
      options: {
        includeUsage: false,
      },
    })

    const body =
      await readRequestBody(request)

    const reason =
      normalizeDeletionReason(body)

    await eventsService.delete(
      context.params.id,
      {
        actorUserId: user.id,
        reason,
      },
    )

    return NextResponse.json(
      {
        success: true,
        message:
          'Evento excluído com sucesso.',
      },
      {
        status: 200,
        headers: NO_CACHE_HEADERS,
      },
    )
  } catch (error) {
    console.error(
      '[AGENDA_EVENT_DELETE_ERROR]',
      error,
    )

    return createErrorResponse(
      error,
      'Não foi possível excluir o evento.',
    )
  }
}