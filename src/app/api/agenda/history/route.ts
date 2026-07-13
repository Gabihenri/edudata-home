import { NextResponse } from 'next/server'

import { historyService } from '@/lib/agenda/services/history.service'

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

  return 500
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    const data = await historyService.list({
      userId: searchParams.get('userId'),
      schoolId: searchParams.get('schoolId'),
      type: searchParams.get('type') as
        | 'evento'
        | 'planejamento'
        | 'evidencia'
        | 'tarefa'
        | null,
      search: searchParams.get('search'),
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      limit: searchParams.get('limit')
        ? Number(searchParams.get('limit'))
        : undefined,
    })

    return NextResponse.json({
      success: true,
      total: data.length,
      data,
    })
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Erro interno ao carregar o histórico.'

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