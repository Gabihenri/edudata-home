import { NextResponse } from 'next/server'

import { dashboardService } from '@/lib/agenda/services/dashboard.service'

export async function GET() {
  try {
    const data = await dashboardService.getSummary()

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
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
        status: 500,
      },
    )
  }
}