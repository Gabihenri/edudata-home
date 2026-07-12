import { NextResponse } from 'next/server'
import {
  planningService,
  type CreateAgendaPlanningInput,
} from '@/lib/agenda'

function getErrorStatus(error: unknown): number {
  if (!(error instanceof Error)) {
    return 500
  }

  const message = error.message.toLowerCase()

  if (
    message.includes('obrigatório') ||
    message.includes('inválida')
  ) {
    return 400
  }

  if (message.includes('não encontrado')) {
    return 404
  }

  return 500
}

export async function GET() {
  try {
    const data = await planningService.listAll()

    return NextResponse.json({
      success: true,
      total: data.length,
      data,
    })
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Erro interno ao listar planejamentos.'

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

    const input: CreateAgendaPlanningInput = {
      title: body.title,
      description: body.description ?? null,
      subject: body.subject ?? null,
      class_name: body.className ?? null,
      objective: body.objective ?? null,
      methodology: body.methodology ?? null,
      resources: body.resources ?? null,
      evaluation: body.evaluation ?? null,
      planned_date: body.plannedDate ?? null,
      status: body.status ?? 'rascunho',
      school_id: body.schoolId ?? null,
      user_id: body.userId ?? null,
    }

    const data = await planningService.create(input)

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
        : 'Erro interno ao criar planejamento.'

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