import { NextResponse } from 'next/server'

import { getSessionUser } from '@/lib/auth/session'

export async function GET() {
  try {
    const user = await getSessionUser()

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          authenticated: false,
          user: null,
        },
        {
          status: 401,
        },
      )
    }

    return NextResponse.json({
      success: true,
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        name:
          user.user_metadata?.name ??
          user.email?.split('@')[0] ??
          'Usuário',
        metadata: user.user_metadata ?? {},
      },
    })
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Erro interno ao consultar a sessão.'

    return NextResponse.json(
      {
        success: false,
        authenticated: false,
        user: null,
        error: message,
      },
      {
        status: 500,
      },
    )
  }
}