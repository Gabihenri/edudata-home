import {
  NextRequest,
  NextResponse,
} from 'next/server'

import {
  isAccessDeniedError,
  requireFeatureAccess,
  serializeAccessDeniedError,
} from '@/lib/access/guards/require-feature-access'

import type {
  AgendaHistoryItemType,
} from '@/lib/agenda'

import { historyService } from '@/lib/agenda/services/history.service'
import { requireSessionUser } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

const NO_CACHE_HEADERS = {
  'Cache-Control':
    'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
  Vary: 'Cookie',
}

const VALID_HISTORY_TYPES =
  new Set<AgendaHistoryItemType>([
    'evento',
    'planejamento',
    'evidencia',
    'tarefa',
  ])

function normalizeOptionalText(
  value: string | null,
): string | null {
  if (!value) {
    return null
  }

  const normalizedValue =
    value.trim()

  return normalizedValue || null
}

function normalizeHistoryType(
  value: string | null,
): AgendaHistoryItemType | null {
  const normalizedValue =
    normalizeOptionalText(value)

  if (!normalizedValue) {
    return null
  }

  if (
    !VALID_HISTORY_TYPES.has(
      normalizedValue as AgendaHistoryItemType,
    )
  ) {
    throw new Error(
      'Tipo de histórico inválido.',
    )
  }

  return normalizedValue as AgendaHistoryItemType
}

function normalizeLimit(
  value: string | null,
): number | undefined {
  const normalizedValue =
    normalizeOptionalText(value)

  if (!normalizedValue) {
    return undefined
  }

  const parsedValue =
    Number(normalizedValue)

  if (
    !Number.isInteger(parsedValue) ||
    parsedValue <= 0
  ) {
    throw new Error(
      'Limite de registros inválido.',
    )
  }

  return Math.min(
    parsedValue,
    500,
  )
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
    message.includes('acesso negado') ||
    message.includes('proibido') ||
    message.includes('forbidden') ||
    message.includes('permission denied')
  ) {
    return 403
  }

  if (
    message.includes('obrigatório') ||
    message.includes('obrigatória') ||
    message.includes('inválido') ||
    message.includes('inválida') ||
    message.includes('não pode') ||
    message.includes('limite')
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

export async function GET(
  request: NextRequest,
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

    const { searchParams } =
      request.nextUrl

    /*
     * REGRA DE GOVERNANÇA
     *
     * O proprietário da consulta é sempre obtido
     * da sessão autenticada.
     *
     * Os parâmetros userId e schoolId enviados
     * pelo navegador não são aceitos como fonte
     * de autorização.
     *
     * Professores, usuários individuais e pares
     * consultam somente seus próprios registros.
     *
     * Consultas institucionais de coordenadores,
     * diretores e gestores deverão utilizar
     * posteriormente um escopo resolvido pelo
     * servidor, baseado em vínculos e hierarquia.
     */
    const data =
      await historyService.list({
        userId: user.id,
        schoolId: null,

        type:
          normalizeHistoryType(
            searchParams.get('type'),
          ),

        search:
          normalizeOptionalText(
            searchParams.get('search'),
          ),

        startDate:
          normalizeOptionalText(
            searchParams.get(
              'startDate',
            ),
          ),

        endDate:
          normalizeOptionalText(
            searchParams.get(
              'endDate',
            ),
          ),

        limit:
          normalizeLimit(
            searchParams.get('limit'),
          ),
      })

    return NextResponse.json(
      {
        success: true,
        total: data.length,
        data,
      },
      {
        status: 200,
        headers: NO_CACHE_HEADERS,
      },
    )
  } catch (error) {
    console.error(
      '[AGENDA_HISTORY_GET_ERROR]',
      error,
    )

    return createErrorResponse(
      error,
      'Não foi possível carregar o histórico pedagógico.',
    )
  }
}