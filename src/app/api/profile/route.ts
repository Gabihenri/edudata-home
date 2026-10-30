import {
  NextRequest,
  NextResponse,
} from 'next/server'

import { requireSessionAccessToken, requireSessionUser } from '@/lib/auth/session'
import { profileService } from '@/lib/profile/profile.service'

export const dynamic = 'force-dynamic'

function getErrorStatus(
  error: unknown,
): number {
  if (error instanceof SyntaxError) {
    return 400
  }

  if (!(error instanceof Error)) {
    return 500
  }

  const message =
    error.message.toLowerCase()

  if (
    message.includes(
      'não autenticado',
    ) ||
    message.includes(
      'não autorizado',
    ) ||
    message.includes(
      'unauthorized',
    )
  ) {
    return 401
  }

  if (
    message.includes(
      'sem permissão',
    ) ||
    message.includes(
      'proibido',
    ) ||
    message.includes(
      'forbidden',
    )
  ) {
    return 403
  }

  if (
    message.includes(
      'obrigatório',
    ) ||
    message.includes(
      'inválido',
    ) ||
    message.includes(
      'inválida',
    ) ||
    message.includes(
      'pelo menos',
    ) ||
    message.includes(
      'no máximo',
    )
  ) {
    return 400
  }

  if (
    message.includes(
      'não encontrado',
    )
  ) {
    return 404
  }

  return 500
}

function createErrorResponse(
  error: unknown,
  fallbackMessage: string,
) {
  const status =
    getErrorStatus(error)

  const message =
    error instanceof Error
      ? error.message
      : fallbackMessage

  return NextResponse.json(
    {
      success: false,
      error: message,
    },
    {
      status,
      headers: {
        'Cache-Control':
          'no-store, no-cache, must-revalidate',
      },
    },
  )
}

export async function GET() {
  try {
    const [accessToken, user] = await Promise.all([
      requireSessionAccessToken(),
      requireSessionUser(),
    ])

    const profile =
      await profileService.getOrCreate(
        accessToken,
        user.id,
      )

    return NextResponse.json(
      {
        success: true,

        user: {
          id: user.id,
          email: user.email ?? null,
        },

        profile: {
          userId:
            profile.user_id,

          displayName:
            profile.display_name,

          phone:
            profile.phone,

          role:
            profile.role,

          status:
            profile.status,

          onboardingCompleted:
            profile.onboarding_completed,
        },
      },
      {
        status: 200,
        headers: {
          'Cache-Control':
            'no-store, no-cache, must-revalidate',
        },
      },
    )
  } catch (error) {
    console.error(
      '[PROFILE_GET_ERROR]',
      error,
    )

    return createErrorResponse(
      error,
      'Não foi possível carregar o perfil.',
    )
  }
}

export async function PATCH(
  _request: NextRequest,
) {
  return NextResponse.json(
    {
      success: false,
      error: (
        'A edição do perfil está temporariamente indisponível. '
        + 'O banco ainda não autoriza UPDATE individual por RLS.'
      ),
    },
    {
      status: 501,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    },
  )
}
