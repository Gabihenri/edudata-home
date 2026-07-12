import { NextResponse } from 'next/server'
import {
  evidencesService,
  type CreateAgendaEvidenceInput,
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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    const userId = searchParams.get('userId')
    const schoolId = searchParams.get('schoolId')
    const planningId = searchParams.get('planningId')
    const eventId = searchParams.get('eventId')

    let data

    if (userId) {
      data = await evidencesService.listByUserId(userId)
    } else if (schoolId) {
      data = await evidencesService.listBySchoolId(schoolId)
    } else if (planningId) {
      data = await evidencesService.listByPlanningId(planningId)
    } else if (eventId) {
      data = await evidencesService.listByEventId(eventId)
    } else {
      data = await evidencesService.listAll()
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
        : 'Erro interno ao listar evidências.'

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

    const input: CreateAgendaEvidenceInput = {
      title: body.title,
      description: body.description ?? null,
      evidence_type: body.evidenceType ?? 'texto',
      file_url: body.fileUrl ?? null,
      external_url: body.externalUrl ?? null,
      planning_id: body.planningId ?? null,
      event_id: body.eventId ?? null,
      school_id: body.schoolId ?? null,
      user_id: body.userId ?? null,
    }

    const data = await evidencesService.create(input)

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
        : 'Erro interno ao criar evidência.'

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