import { NextResponse } from 'next/server'
import {
  classesService,
  type CreateAgendaClassInput,
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

    const teacherId = searchParams.get('teacherId')
    const schoolId = searchParams.get('schoolId')

    let data

    if (teacherId) {
      data = await classesService.listByTeacherId(teacherId)
    } else if (schoolId) {
      data = await classesService.listBySchoolId(schoolId)
    } else {
      data = await classesService.listAll()
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
        : 'Erro interno ao listar turmas.'

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

    const input: CreateAgendaClassInput = {
      name: body.name,
      school_year: body.schoolYear ?? null,
      grade: body.grade ?? null,
      subject: body.subject ?? null,
      students_count: body.studentsCount ?? 0,
      school_id: body.schoolId ?? null,
      teacher_id: body.teacherId ?? null,
      active: body.active ?? true,
    }

    const data = await classesService.create(input)

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
        : 'Erro interno ao criar turma.'

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