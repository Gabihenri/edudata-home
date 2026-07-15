import { NextResponse } from 'next/server'

import { dashboardService } from '@/lib/agenda/services/dashboard.service'
import { requireSessionUser } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

function getErrorStatus(error: unknown): number {
  if (!(error instanceof Error)) {
    return 500
  }

  const message = error.message.toLowerCase()

  if (
    message.includes('não autenticado') ||
    message.includes('não autorizado') ||
    message.includes('unauthorized')
  ) {
    return 401
  }

  if (
    message.includes('proibido') ||
    message.includes('sem permissão') ||
    message.includes('forbidden')
  ) {
    return 403
  }

  return 500
}

export async function GET() {
  try {
    const user = await requireSessionUser()

    const data = await dashboardService.getSummary(user.id)

    return NextResponse.json(
      {
        success: true,
        data,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      },
    )
  } catch (error) {
    console.error('[AGENDA_DASHBOARD_GET_ERROR]', error)

    const message =
      error instanceof Error
        ? error.message
        : 'Erro interno ao carregar o dashboard.'

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      {
        status: getErrorStatus(error),
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      },
    )
  }
}