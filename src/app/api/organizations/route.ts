import {
  NextRequest,
  NextResponse,
} from 'next/server'

import { requireOrganizationAdministrator } from '@/lib/organization/organization.authorization'
import { organizationService } from '@/lib/organization/organization.service'

export const dynamic = 'force-dynamic'

const NO_CACHE_HEADERS = {
  'Cache-Control':
    'no-store, no-cache, must-revalidate',
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
    message.includes('não autenticado') ||
    message.includes('não autorizado') ||
    message.includes('unauthorized')
  ) {
    return 401
  }

  if (
    message.includes('sem permissão') ||
    message.includes('perfil inativo') ||
    message.includes('perfil de acesso') ||
    message.includes('proibido') ||
    message.includes('forbidden')
  ) {
    return 403
  }

  if (
    message.includes('já existe') ||
    message.includes('duplicate') ||
    message.includes('unique')
  ) {
    return 409
  }

  if (
    message.includes('obrigatório') ||
    message.includes('inválido') ||
    message.includes('inválida') ||
    message.includes('no máximo') ||
    message.includes('nenhum campo')
  ) {
    return 400
  }

  if (message.includes('não encontrada')) {
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
    status >= 500
      ? fallbackMessage
      : error instanceof Error
        ? error.message
        : fallbackMessage

  return NextResponse.json(
    {
      success: false,
      error: message,
    },
    {
      status,
      headers: NO_CACHE_HEADERS,
    },
  )
}

export async function GET() {
  try {
    await requireOrganizationAdministrator()

    const organizations =
      await organizationService.listAll()

    return NextResponse.json(
      {
        success: true,
        total: organizations.length,
        data: organizations,
      },
      {
        status: 200,
        headers: NO_CACHE_HEADERS,
      },
    )
  } catch (error) {
    console.error(
      '[ORGANIZATIONS_GET_ERROR]',
      error,
    )

    return createErrorResponse(
      error,
      'Não foi possível carregar as organizações.',
    )
  }
}

export async function POST(
  request: NextRequest,
) {
  try {
    await requireOrganizationAdministrator()

    const body: unknown =
      await request.json()

    const organization =
      await organizationService.create(
        body,
      )

    return NextResponse.json(
      {
        success: true,
        message:
          'Organização cadastrada com sucesso.',
        data: organization,
      },
      {
        status: 201,
        headers: NO_CACHE_HEADERS,
      },
    )
  } catch (error) {
    console.error(
      '[ORGANIZATIONS_POST_ERROR]',
      error,
    )

    return createErrorResponse(
      error,
      'Não foi possível cadastrar a organização.',
    )
  }
}