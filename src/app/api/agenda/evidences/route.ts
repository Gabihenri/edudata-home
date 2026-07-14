import { NextResponse } from 'next/server'

import { requireSessionUser } from '@/lib/auth/session'
import { evidencesService } from '@/lib/agenda/services/evidences.service'
import type {
  AgendaEvidenceType,
  CreateAgendaEvidenceInput,
} from '@/lib/agenda/repository/evidences.repository'

export const dynamic = 'force-dynamic'

type CreateEvidenceRequestBody = {
  title?: string
  description?: string | null

  evidenceType?: string

  fileUrl?: string | null
  externalUrl?: string | null

  planningId?: string | null
  eventId?: string | null
  schoolId?: string | null
}

function normalizeOptionalText(
  value: unknown,
): string | null {
  if (typeof value !== 'string') {
    return null
  }

  const normalizedValue = value.trim()

  return normalizedValue || null
}

function normalizeEvidenceType(
  value: unknown,
): AgendaEvidenceType {
  if (typeof value !== 'string') {
    return 'texto'
  }

  const normalizedValue =
    value.trim().toLowerCase()

  if (
    normalizedValue === 'texto' ||
    normalizedValue === 'imagem' ||
    normalizedValue === 'pdf' ||
    normalizedValue === 'link'
  ) {
    return normalizedValue
  }

  return normalizedValue as AgendaEvidenceType
}

function getErrorStatus(
  error: unknown,
): number {
  if (error instanceof SyntaxError) {
    return 400
  }

  if (!(error instanceof Error)) {
    return 500
  }

  const message = error.message.toLowerCase()

  if (
    message.includes('não autenticado') ||
    message.includes('não autorizado') ||
    message.includes('permissão')
  ) {
    return 401
  }

  if (
    message.includes('obrigatório') ||
    message.includes('obrigatória') ||
    message.includes('inválido') ||
    message.includes('inválida') ||
    message.includes('informe') ||
    message.includes('envie')
  ) {
    return 400
  }

  if (message.includes('não encontrada')) {
    return 404
  }

  return 500
}

function createErrorResponse(
  error: unknown,
  fallbackMessage: string,
) {
  const message =
    error instanceof Error
      ? error.message
      : fallbackMessage

  return NextResponse.json(
    {
      success: false,
      error: message,
    },
    {
      status: getErrorStatus(error),
      headers: {
        'Cache-Control': 'no-store',
      },
    },
  )
}

export async function GET(
  request: Request,
) {
  try {
    const user = await requireSessionUser()

    const { searchParams } = new URL(
      request.url,
    )

    const planningId =
      normalizeOptionalText(
        searchParams.get('planningId'),
      )

    const eventId =
      normalizeOptionalText(
        searchParams.get('eventId'),
      )

    const evidenceType =
      normalizeOptionalText(
        searchParams.get('evidenceType'),
      )

    /*
     * A consulta começa sempre pelas evidências do
     * usuário autenticado. Os filtros são aplicados
     * somente dentro desse conjunto.
     */
    let data =
      await evidencesService.listByUserId(
        user.id,
      )

    if (planningId) {
      data = data.filter(
        (evidence) =>
          evidence.planning_id === planningId,
      )
    }

    if (eventId) {
      data = data.filter(
        (evidence) =>
          evidence.event_id === eventId,
      )
    }

    if (evidenceType) {
      data = data.filter(
        (evidence) =>
          evidence.evidence_type ===
          evidenceType,
      )
    }

    return NextResponse.json(
      {
        success: true,
        total: data.length,
        data,
      },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      },
    )
  } catch (error) {
    return createErrorResponse(
      error,
      'Não foi possível carregar as evidências.',
    )
  }
}

export async function POST(
  request: Request,
) {
  try {
    const user = await requireSessionUser()

    const body =
      (await request.json()) as CreateEvidenceRequestBody

    const input: CreateAgendaEvidenceInput = {
      title:
        typeof body.title === 'string'
          ? body.title
          : '',

      description:
        normalizeOptionalText(
          body.description,
        ),

      evidence_type:
        normalizeEvidenceType(
          body.evidenceType,
        ),

      file_url:
        normalizeOptionalText(
          body.fileUrl,
        ),

      external_url:
        normalizeOptionalText(
          body.externalUrl,
        ),

      planning_id:
        normalizeOptionalText(
          body.planningId,
        ),

      event_id:
        normalizeOptionalText(
          body.eventId,
        ),

      school_id:
        normalizeOptionalText(
          body.schoolId,
        ),

      /*
       * O usuário vem exclusivamente da sessão.
       * Não aceitamos userId enviado pelo navegador.
       */
      user_id: user.id,
    }

    const data =
      await evidencesService.create(input)

    return NextResponse.json(
      {
        success: true,
        message:
          'Evidência criada com sucesso.',
        data,
      },
      {
        status: 201,
        headers: {
          'Cache-Control': 'no-store',
        },
      },
    )
  } catch (error) {
    return createErrorResponse(
      error,
      'Não foi possível criar a evidência.',
    )
  }
}