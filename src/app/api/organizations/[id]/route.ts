import {
  NextRequest,
  NextResponse,
} from 'next/server'

import {
  requireOrganizationAdministrator,
  type OrganizationAuthorizationContext,
} from '@/lib/organization/organization.authorization'
import type { OrganizationDto } from '@/lib/organization/organization.dto'
import { organizationService } from '@/lib/organization/organization.service'

export const dynamic = 'force-dynamic'

interface RouteContext {
  params: {
    id: string
  }
}

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
    message.includes('fora do escopo') ||
    message.includes('escopo autorizado') ||
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
    message.includes('não encontrada')
  ) {
    return 404
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

function hasOrganizationAccess(
  context:
    OrganizationAuthorizationContext,
  organizationId: string,
): boolean {
  if (
    context.isPlatformAdministrator
  ) {
    return true
  }

  return context.organizationIds.includes(
    organizationId,
  )
}

function hasOrganizationWideScope(
  context:
    OrganizationAuthorizationContext,
  organizationId: string,
): boolean {
  if (
    context.isPlatformAdministrator
  ) {
    return true
  }

  return context.memberships.some(
    (membership) =>
      membership.organizationId ===
        organizationId &&
      membership.schoolId === null,
  )
}

function assertOrganizationAccess(
  context:
    OrganizationAuthorizationContext,
  organizationId: string,
): void {
  if (
    !hasOrganizationAccess(
      context,
      organizationId,
    )
  ) {
    throw new Error(
      'Organização fora do escopo autorizado.',
    )
  }
}

function assertOrganizationUpdateAccess(
  context:
    OrganizationAuthorizationContext,
  organizationId: string,
): void {
  assertOrganizationAccess(
    context,
    organizationId,
  )

  if (
    !hasOrganizationWideScope(
      context,
      organizationId,
    )
  ) {
    throw new Error(
      'Sem permissão para atualizar esta organização.',
    )
  }
}

function assertOrganizationArchiveAccess(
  context:
    OrganizationAuthorizationContext,
): void {
  if (
    context.isPlatformAdministrator
  ) {
    return
  }

  throw new Error(
    'Sem permissão para arquivar organizações.',
  )
}

async function loadAuthorizedOrganization(
  context:
    OrganizationAuthorizationContext,
  organizationId: string,
): Promise<OrganizationDto> {
  const organization =
    await organizationService.getById(
      organizationId,
    )

  assertOrganizationAccess(
    context,
    organization.id,
  )

  return organization
}

export async function GET(
  _request: NextRequest,
  context: RouteContext,
) {
  try {
    const authorization =
      await requireOrganizationAdministrator()

    const organization =
      await loadAuthorizedOrganization(
        authorization,
        context.params.id,
      )

    return NextResponse.json(
      {
        success: true,
        data: organization,
      },
      {
        status: 200,
        headers: NO_CACHE_HEADERS,
      },
    )
  } catch (error) {
    console.error(
      '[ORGANIZATION_GET_BY_ID_ERROR]',
      error,
    )

    return createErrorResponse(
      error,
      'Não foi possível carregar a organização.',
    )
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const authorization =
      await requireOrganizationAdministrator()

    const currentOrganization =
      await loadAuthorizedOrganization(
        authorization,
        context.params.id,
      )

    assertOrganizationUpdateAccess(
      authorization,
      currentOrganization.id,
    )

    const body: unknown =
      await request.json()

    const updatedOrganization =
      await organizationService.update(
        context.params.id,
        body,
      )

    assertOrganizationAccess(
      authorization,
      updatedOrganization.id,
    )

    return NextResponse.json(
      {
        success: true,
        message:
          'Organização atualizada com sucesso.',
        data: updatedOrganization,
      },
      {
        status: 200,
        headers: NO_CACHE_HEADERS,
      },
    )
  } catch (error) {
    console.error(
      '[ORGANIZATION_PATCH_ERROR]',
      error,
    )

    return createErrorResponse(
      error,
      'Não foi possível atualizar a organização.',
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  context: RouteContext,
) {
  try {
    const authorization =
      await requireOrganizationAdministrator()

    const organization =
      await loadAuthorizedOrganization(
        authorization,
        context.params.id,
      )

    assertOrganizationArchiveAccess(
      authorization,
    )

    const archivedOrganization =
      await organizationService.archive(
        organization.id,
      )

    return NextResponse.json(
      {
        success: true,
        message:
          'Organização arquivada com sucesso.',
        data: archivedOrganization,
      },
      {
        status: 200,
        headers: NO_CACHE_HEADERS,
      },
    )
  } catch (error) {
    console.error(
      '[ORGANIZATION_DELETE_ERROR]',
      error,
    )

    return createErrorResponse(
      error,
      'Não foi possível arquivar a organização.',
    )
  }
}