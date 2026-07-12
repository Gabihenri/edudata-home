import { NextResponse } from 'next/server'

import {
  getCurrentUserRole,
  getRolePermissions,
} from '@/lib/auth'

export async function GET() {
  try {
    const role = await getCurrentUserRole()

    if (!role) {
      return NextResponse.json(
        {
          success: false,
          authenticated: false,
          role: null,
          permissions: [],
          error: 'Perfil do usuário não encontrado.',
        },
        {
          status: 401,
        },
      )
    }

    return NextResponse.json({
      success: true,
      authenticated: true,
      role,
      permissions: getRolePermissions(role),
    })
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Erro interno ao consultar o perfil do usuário.'

    return NextResponse.json(
      {
        success: false,
        authenticated: false,
        role: null,
        permissions: [],
        error: message,
      },
      {
        status: 500,
      },
    )
  }
}