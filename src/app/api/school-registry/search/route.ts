import {
  NextRequest,
  NextResponse,
} from 'next/server'

import { requireOrganizationAdministrator } from '@/lib/organization/organization.authorization'
import { schoolRegistryService } from '@/lib/school-registry/school-registry.service'

export const dynamic = 'force-dynamic'

const NO_CACHE_HEADERS = {
  'Cache-Control':
    'no-store, no-cache, must-revalidate',
}

function getErrorStatus(
  error: unknown,
): number {
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
    message.includes('não encontrada')
  ) {
    return 404
  }

  if (
    message.includes('obrigatório') ||
    message.includes('inválido') ||
    message.includes('inválida') ||
    message.includes('pelo menos') ||
    message.includes('no máximo') ||
    message.includes('exatamente') ||
    message.includes('entre 1 e 50')
  ) {
    return 400
  }

  return 500
}

function createErrorResponse(
  error: unknown,
) {
  const status =
    getErrorStatus(error)

  const message =
    status >= 500
      ? 'Não foi possível pesquisar o cadastro nacional.'
      : error instanceof Error
        ? error.message
        : 'Não foi possível pesquisar o cadastro nacional.'

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

export async function GET(
  request: NextRequest,
) {
  try {
    await requireOrganizationAdministrator()

    const query =
      request.nextUrl.searchParams.get(
        'q',
      )

    const state =
      request.nextUrl.searchParams.get(
        'state',
      )

    const city =
      request.nextUrl.searchParams.get(
        'city',
      )

    const limit =
      request.nextUrl.searchParams.get(
        'limit',
      )

    const result =
      await schoolRegistryService.search({
        query,
        state,
        city,
        limit,
      })

    return NextResponse.json(
      {
        success: true,
        query: result.query,
        total: result.total,
        data: result.data,
      },
      {
        status: 200,
        headers: NO_CACHE_HEADERS,
      },
    )
  } catch (error) {
    console.error(
      '[SCHOOL_REGISTRY_SEARCH_ERROR]',
      error,
    )

    return createErrorResponse(error)
  }
}