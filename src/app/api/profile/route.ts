import {
  NextRequest,
  NextResponse,
} from 'next/server'

import { requireSessionUser } from '@/lib/auth/session'
import type { UpdateUserProfileDto } from '@/lib/profile/profile.dto'
import { profileService } from '@/lib/profile/profile.service'

export const dynamic = 'force-dynamic'

type UpdateProfileRequestBody = {
  displayName?: unknown
  phone?: unknown
}

function getDefaultDisplayName(
  user: Awaited<
    ReturnType<typeof requireSessionUser>
  >,
): string | null {
  const fullName =
    user.user_metadata?.full_name

  if (
    typeof fullName === 'string' &&
    fullName.trim()
  ) {
    return fullName.trim()
  }

  const name =
    user.user_metadata?.name

  if (
    typeof name === 'string' &&
    name.trim()
  ) {
    return name.trim()
  }

  if (user.email) {
    return (
      user.email
        .split('@')[0]
        ?.trim() || null
    )
  }

  return null
}

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
    const user =
      await requireSessionUser()

    const profile =
      await profileService.getOrCreate(
        user.id,
        getDefaultDisplayName(user),
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
  request: NextRequest,
) {
  try {
    const user =
      await requireSessionUser()

    const body =
      (await request.json()) as UpdateProfileRequestBody

    const input:
      UpdateUserProfileDto = {
        display_name:
          typeof body.displayName ===
          'string'
            ? body.displayName
            : '',

        phone:
          typeof body.phone ===
          'string'
            ? body.phone
            : '',

        onboarding_completed:
          true,
      }

    const profile =
      await profileService.updateOwnProfile(
        user.id,
        input,
      )

    return NextResponse.json(
      {
        success: true,

        message:
          'Perfil atualizado com sucesso.',

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
      '[PROFILE_PATCH_ERROR]',
      error,
    )

    return createErrorResponse(
      error,
      'Não foi possível atualizar o perfil.',
    )
  }
}