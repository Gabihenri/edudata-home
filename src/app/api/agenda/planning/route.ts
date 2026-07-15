import {
  NextRequest,
  NextResponse,
} from 'next/server'

import { requireSessionUser } from '@/lib/auth/session'

import type { CreateAgendaPlanningInput } from '@/lib/agenda/repository/planning.repository'
import { planningService } from '@/lib/agenda/services/planning.service'

export const dynamic = 'force-dynamic'

type CreatePlanningRequestBody = {
  title?: string
  description?: string | null
  subject?: string | null
  className?: string | null
  objective?: string | null
  methodology?: string | null
  resources?: string | null
  evaluation?: string | null
  plannedDate?: string | null
  status?: string | null
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

function getErrorStatus(
  error: unknown,
): number {
  if (error instanceof SyntaxError) {
    return 400
  }

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
    message.includes('sem permissão') ||
    message.includes('proibido') ||
    message.includes('forbidden')
  ) {
    return 403
  }

  if (
    message.includes('obrigatório') ||
    message.includes('obrigatória') ||
    message.includes('inválido') ||
    message.includes('inválida') ||
    message.includes('não pode ficar vazio')
  ) {
    return 400
  }

  if (
    message.includes('não encontrado')
  ) {
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
        'Cache-Control':
          'no-store, no-cache, must-revalidate',
      },
    },
  )
}

export async function GET() {
  try {
    const user =
      await requireSessionUser()

    /*
     * A consulta ocorre diretamente no banco,
     * limitada ao proprietário autenticado.
     */
    const data =
      await planningService.listByUserId(
        user.id,
      )

    return NextResponse.json(
      {
        success: true,
        total: data.length,
        data,
      },
      {
        status: 200,
        headers: {
          'Cache-Control':
            'no-store, no-cache, must-revalidate',
        },
      },
    )
  } catch (error) {
    console.error(
      '[AGENDA_PLANNING_GET_ERROR]',
      error,
    )

    return createErrorResponse(
      error,
      'Não foi possível carregar os planejamentos.',
    )
  }
}

export async function POST(
  request: NextRequest,
) {
  try {
    const user =
      await requireSessionUser()

    const body =
      (await request.json()) as CreatePlanningRequestBody

    const input: CreateAgendaPlanningInput = {
      title:
        typeof body.title === 'string'
          ? body.title
          : '',

      description:
        normalizeOptionalText(
          body.description,
        ),

      subject:
        normalizeOptionalText(
          body.subject,
        ),

      class_name:
        normalizeOptionalText(
          body.className,
        ),

      objective:
        normalizeOptionalText(
          body.objective,
        ),

      methodology:
        normalizeOptionalText(
          body.methodology,
        ),

      resources:
        normalizeOptionalText(
          body.resources,
        ),

      evaluation:
        normalizeOptionalText(
          body.evaluation,
        ),

      planned_date:
        normalizeOptionalText(
          body.plannedDate,
        ),

      status:
        normalizeOptionalText(
          body.status,
        ) ?? 'rascunho',

      school_id:
        normalizeOptionalText(
          body.schoolId,
        ),
    }

    /*
     * O proprietário é definido pelo servidor.
     * O navegador não pode escolher outro user_id.
     */
    const data =
      await planningService.createOwned(
        user.id,
        input,
      )

    return NextResponse.json(
      {
        success: true,
        message:
          'Planejamento criado com sucesso.',
        data,
      },
      {
        status: 201,
        headers: {
          'Cache-Control':
            'no-store, no-cache, must-revalidate',
        },
      },
    )
  } catch (error) {
    console.error(
      '[AGENDA_PLANNING_POST_ERROR]',
      error,
    )

    return createErrorResponse(
      error,
      'Não foi possível criar o planejamento.',
    )
  }
}