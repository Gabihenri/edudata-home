import {
  NextRequest,
  NextResponse,
} from 'next/server'

import { requireSessionUser } from '@/lib/auth/session'
import type { UpdateAgendaTaskInput } from '@/lib/agenda/repository/tasks.repository'
import { tasksService } from '@/lib/agenda/services/tasks.service'

export const dynamic = 'force-dynamic'

type RouteContext = {
  params: {
    id: string
  }
}

type UpdateTaskRequestBody = {
  title?: string
  description?: string | null
  status?: string
  priority?: string
  dueDate?: string | null
}

function getErrorStatus(error: unknown): number {
  if (error instanceof SyntaxError) return 400
  if (!(error instanceof Error)) return 500

  const message = error.message.toLowerCase()

  if (message.includes('não autenticado') || message.includes('não autorizado')) return 401
  if (message.includes('sem permissão') || message.includes('proibido')) return 403
  if (message.includes('não encontrada')) return 404
  if (message.includes('obrigatório') || message.includes('inválido') || message.includes('não pode ficar vazio')) return 400

  return 500
}

function createErrorResponse(error: unknown, fallbackMessage: string) {
  const message = error instanceof Error ? error.message : fallbackMessage

  return NextResponse.json(
    { success: false, error: message },
    {
      status: getErrorStatus(error),
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
    },
  )
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteContext,
) {
  try {
    const user = await requireSessionUser()
    const body = (await request.json()) as UpdateTaskRequestBody

    const input: UpdateAgendaTaskInput = {}

    if (typeof body.title === 'string') input.title = body.title
    if (body.description === null || typeof body.description === 'string') input.description = body.description
    if (typeof body.status === 'string') input.status = body.status
    if (typeof body.priority === 'string') input.priority = body.priority
    if (body.dueDate === null || typeof body.dueDate === 'string') input.due_date = body.dueDate

    if (Object.keys(input).length === 0) {
      throw new Error('Informe ao menos um campo para atualização.')
    }

    const data = await tasksService.updateOwned(params.id, user.id, input)

    return NextResponse.json(
      {
        success: true,
        message: 'Status da tarefa atualizado com sucesso.',
        data,
      },
      {
        status: 200,
        headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
      },
    )
  } catch (error) {
    console.error('[AGENDA_TASK_PATCH_ERROR]', error)
    return createErrorResponse(error, 'Não foi possível atualizar a tarefa.')
  }
}
