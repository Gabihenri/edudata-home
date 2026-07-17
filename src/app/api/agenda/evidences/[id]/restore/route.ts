import {
  NextRequest,
  NextResponse,
} from 'next/server'

import {
  isAccessDeniedError,
  requireFeatureAccess,
  serializeAccessDeniedError,
} from '@/lib/access/guards/require-feature-access'
import { evidencesService } from '@/lib/agenda/services/evidences.service'
import { requireSessionUser } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

type RouteContext = {
  params: {
    id: string
  }
}

type UnknownRecord =
  Record<string, unknown>

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const MAX_RESTORATION_REASON_LENGTH =
  500

const NO_CACHE_HEADERS = {
  'Cache-Control':
    'no-store, no-cache, must-revalidate, proxy-revalidate',

  Pragma:
    'no-cache',

  Expires:
    '0',

  Vary:
    'Cookie',
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

function normalizeEvidenceId(
  value: string | undefined,
): string {
  const normalizedValue =
    value?.trim()

  if (
    !normalizedValue ||
    !UUID_PATTERN.test(
      normalizedValue,
    )
  ) {
    throw new Error(
      'Identificador da evidência inválido.',
    )
  }

  return normalizedValue
}

function normalizeRestorationReason(
  body: unknown,
): string {
  if (!isRecord(body)) {
    throw new Error(
      'Motivo da restauração é obrigatório.',
    )
  }

  const reason =
    body.reason

  if (
    typeof reason !== 'string' ||
    !reason.trim()
  ) {
    throw new Error(
      'Motivo da restauração é obrigatório.',
    )
  }

  const normalizedReason =
    reason.trim()

  if (
    normalizedReason.length >
    MAX_RESTORATION_REASON_LENGTH
  ) {
    throw new Error(
      `O motivo da restauração não pode ultrapassar ${MAX_RESTORATION_REASON_LENGTH} caracteres.`,
    )
  }

  return normalizedReason
}

async function readRequestBody(
  request: NextRequest,
): Promise<unknown> {
  try {
    return await request.json()
  } catch {
    throw new Error(
      'Motivo da restauração é obrigatório.',
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
    message.includes(
      'não autenticado',
    ) ||
    message.includes(
      'não autorizado',
    ) ||
    message.includes(
      'unauthorized',
    ) ||
    message.includes(
      'sessão',
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
      'não encontrada',
    ) ||
    message.includes(
      'não encontrado',
    )
  ) {
    return 404
  }

  if (
    message.includes(
      'não está excluída',
    ) ||
    message.includes(
      'não está excluído',
    ) ||
    message.includes(
      'já foi restaurada',
    ) ||
    message.includes(
      'já foi restaurado',
    )
  ) {
    return 409
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
      'ultrapassar',
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

export async function POST(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const user =
      await requireSessionUser()

    const evidenceId =
      normalizeEvidenceId(
        context.params.id,
      )

    /*
     * A restauração não envia um novo arquivo
     * nem consome cota de upload.
     *
     * O acesso ao módulo de evidências é
     * validado sem incrementar uso.
     */
    await requireFeatureAccess({
      userId:
        user.id,

      featureCode:
        'evidences.text',

      options: {
        includeUsage:
          false,
      },
    })

    const body =
      await readRequestBody(
        request,
      )

    const reason =
      normalizeRestorationReason(
        body,
      )

    const evidence =
      await evidencesService.restore(
        evidenceId,
        {
          actorUserId:
            user.id,

          reason,
        },
      )

    return NextResponse.json(
      {
        success: true,

        message:
          'Evidência restaurada com sucesso.',

        data:
          evidence,
      },
      {
        status: 200,
        headers:
          NO_CACHE_HEADERS,
      },
    )
  } catch (error) {
    console.error(
      '[AGENDA_EVIDENCE_RESTORE_ERROR]',
      error,
    )

    return createErrorResponse(
      error,
      'Não foi possível restaurar a evidência.',
    )
  }
}