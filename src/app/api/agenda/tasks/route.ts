import {
  NextRequest,
  NextResponse,
} from 'next/server'

import { requireSessionUser } from '@/lib/auth/session'

import type { CreateAgendaTaskInput } from '@/lib/agenda/repository/tasks.repository'
import { tasksService } from '@/lib/agenda/services/tasks.service'

export const dynamic = 'force-dynamic'

type CreateTaskRequestBody = {
  title?: string
  description?: string | null
  status?: string | null
  priority?: string | null
  dueDate?: string | null
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
    message.includes('não encontrada')
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
     * A consulta já é filtrada no banco pelo
     * proprietário autenticado.
     */
    const data =
      await tasksService.listByUserId(
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
      '[AGENDA_TASKS_GET_ERROR]',
      error,
    )

    return createErrorResponse(
      error,
      'Não foi possível carregar as tarefas.',
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
      (await request.json()) as CreateTaskRequestBody

    const input: CreateAgendaTaskInput = {
      title:
        typeof body.title === 'string'
          ? body.title
          : '',

      description:
        normalizeOptionalText(
          body.description,
        ),

      status:
        normalizeOptionalText(
          body.status,
        ) ?? 'pendente',

      priority:
        normalizeOptionalText(
          body.priority,
        ) ?? 'media',

      due_date:
        normalizeOptionalText(
          body.dueDate,
        ),

      event_id:
        normalizeOptionalText(
          body.eventId,
        ),

      school_id:
        normalizeOptionalText(
          body.schoolId,
        ),
    }

    /*
     * O user_id é definido pelo servidor.
     * Nenhum proprietário enviado pelo navegador
     * será aceito.
     */
    const data =
      await tasksService.createOwned(
        user.id,
        input,
      )

    return NextResponse.json(
      {
        success: true,
        message:
          'Tarefa criada com sucesso.',
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
      '[AGENDA_TASKS_POST_ERROR]',
      error,
    )

    return createErrorResponse(
      error,
      'Não foi possível criar a tarefa.',
    )
  }
}