import { NextResponse } from 'next/server'
import {
  eventsService,
  type CreateAgendaEventInput,
} from '@/lib/agenda'

function getErrorStatus(error: unknown): number {
  if (!(error instanceof Error)) {
    return 500
  }

  const message = error.message.toLowerCase()

  if (
    message.includes('obrigatório') ||
    message.includes('inválida') ||
    message.includes('anterior')
  ) {
    return 400
  }

  if (message.includes('não encontrado')) {
    return 404
  }

  return 500
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    const userId = searchParams.get('userId')
    const schoolId = searchParams.get('schoolId')

    let data

    if (userId) {
      data = await eventsService.listByUserId(userId)
    } else if (schoolId) {
      data = await eventsService.listBySchoolId(schoolId)
    } else {
      data = await eventsService.listAll()
    }

    return NextResponse.json({
      success: true,
      total: data.length,
      data,
    })
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Erro interno ao listar eventos.'

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

    const input: CreateAgendaEventInput = {
      title: body.title,
      description: body.description ?? null,
      event_type: body.eventType ?? 'pedagogico',
      start_at: body.startAt,
      end_at: body.endAt ?? null,
      status: body.status ?? 'planejado',
      priority: body.priority ?? 'media',
      school_id: body.schoolId ?? null,
      user_id: body.userId ?? null,
      planning_id: body.planningId ?? null,
      evidence_id: body.evidenceId ?? null,
    }

    const data = await eventsService.create(input)

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
        : 'Erro interno ao criar evento.'

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