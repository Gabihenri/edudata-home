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
  EvidencesRepository,
} from '@/lib/agenda/repository/evidences.repository'
import {
  EvidencesService,
} from '@/lib/agenda/services/evidences.service'
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

function createEvidencesService(
  request: NextRequest,
): EvidencesService {
  const accessToken =
    getAccessToken(request)

  const client =
    createAuthenticatedClient(accessToken)

  const repository =
    new EvidencesRepository(client)

  return new EvidencesService(repository)
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

function normalizeDeletionReason(
  body: unknown,
): string {
  if (!isRecord(body)) {
    throw new Error(
      'Motivo da exclusão é obrigatório.',
    )
  }

  const reason =
    body.reason

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
      'proibido',
    ) ||
    message.includes(
      'forbidden',
    ) ||
    message.includes(
      'permission denied',
    ) ||
    message.includes(
      'row-level security',
    )
  ) {
    return 403
  }

  if (
    message.includes(
      'não encontrada',
    ) ||
    message.includes(
      'já excluída',
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
    isAccessDeniedError(error)
  ) {
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

    const evidenceId =
      normalizeEvidenceId(
        context.params.id,
      )

    const service =
      createEvidencesService(request)

    const evidence =
      await service.getById(evidenceId)

    const requiredFeature =
      evidence.evidence_type === 'imagem' ||
      evidence.evidence_type === 'pdf'
        ? 'evidences.upload'
        : 'evidences.text'

    await requireFeatureAccess({
      userId: user.id,
      featureCode: requiredFeature,
      options: {
        includeUsage: false,
      },
    })

    const body =
      await readRequestBody(request)

    const reason =
      normalizeDeletionReason(body)

    await service.delete(
      evidenceId,
      {
        actorUserId: user.id,
        reason,
      },
    )

    return NextResponse.json(
      {
        success: true,
        message:
          'Evidência excluída de forma governada.',
        data: {
          evidenceId,
          deletedAt:
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
      '[AGENDA_EVIDENCE_DELETE_ERROR]',
      error,
    )

    return createErrorResponse(
      error,
      'Não foi possível excluir a evidência.',
    )
  }
}
