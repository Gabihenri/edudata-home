import { NextResponse } from 'next/server'
import {
  tasksService,
  type CreateAgendaTaskInput,
} from '@/lib/agenda'

function getErrorStatus(error: unknown): number {
  if (!(error instanceof Error)) {
    return 500
  }

  const message = error.message.toLowerCase()

  if (
    message.includes('obrigatório') ||
    message.includes('inválido') ||
    message.includes('inválida')
  ) {
    return 400
  }

  if (message.includes('não encontrada')) {
    return 404
  }

  return 500
}

export async function GET() {
  try {
    const data = await tasksService.listAll()

    return NextResponse.json({
      success: true,
      total: data.length,
      data,
    })
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Erro interno ao listar tarefas.'

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      {
        status: getErrorStatus(error),
      },
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const input: CreateAgendaTaskInput = {
      title: body.title,
      description: body.description ?? null,
      status: body.status ?? 'pendente',
      priority: body.priority ?? 'media',
      due_date: body.dueDate ?? null,
      event_id: body.eventId ?? null,
      school_id: body.schoolId ?? null,
      user_id: body.userId ?? null,
    }

    const data = await tasksService.create(input)

    return NextResponse.json(
      {
        success: true,
        data,
      },
      {
        status: 201,
      },
    )
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Erro interno ao criar tarefa.'

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      {
        status: getErrorStatus(error),
      },
    )
  }
}