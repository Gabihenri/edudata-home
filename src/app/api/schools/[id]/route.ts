import {
  NextRequest,
  NextResponse,
} from 'next/server'

import {
  requireOrganizationAdministrator,
  type OrganizationAuthorizationContext,
} from '@/lib/organization/organization.authorization'
import type { SchoolDto } from '@/lib/schools/school.dto'
import { schoolService } from '@/lib/schools/school.service'

export const dynamic = 'force-dynamic'

interface RouteContext {
  params: {
    id: string
  }
}

type UnknownRecord =
  Record<string, unknown>

const NO_CACHE_HEADERS = {
  'Cache-Control':
    'no-store, no-cache, must-revalidate',
}

function isRecord(
  value: unknown,
): value is UnknownRecord {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  )
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
    message.includes('nenhum campo') ||
    message.includes('exatamente')
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

function hasSchoolAccess(
  context:
    OrganizationAuthorizationContext,
  school: SchoolDto,
): boolean {
  if (
    context.isPlatformAdministrator
  ) {
    return true
  }

  return context.memberships.some(
    (membership) =>
      membership.organizationId ===
        school.organization_id &&
      (
        membership.schoolId === null ||
        membership.schoolId ===
          school.id
      ),
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

function assertSchoolAccess(
  context:
    OrganizationAuthorizationContext,
  school: SchoolDto,
): void {
  if (
    !hasSchoolAccess(
      context,
      school,
    )
  ) {
    throw new Error(
      'Instituição fora do escopo autorizado.',
    )
  }
}

function readTargetOrganizationId(
  body: unknown,
): string | null {
  if (!isRecord(body)) {
    throw new Error(
      'Dados da instituição inválidos.',
    )
  }

  if (
    !Object.prototype.hasOwnProperty.call(
      body,
      'organization_id',
    )
  ) {
    return null
  }

  const organizationId =
    body.organization_id

  if (
    typeof organizationId !==
      'string' ||
    !organizationId.trim()
  ) {
    throw new Error(
      'Identificador da organização inválido.',
    )
  }

  return organizationId.trim()
}

function assertOrganizationTransferAccess(
  context:
    OrganizationAuthorizationContext,
  currentSchool: SchoolDto,
  targetOrganizationId: string | null,
): void {
  if (
    !targetOrganizationId ||
    targetOrganizationId ===
      currentSchool.organization_id
  ) {
    return
  }

  if (
    context.isPlatformAdministrator
  ) {
    return
  }

  const canManageCurrentOrganization =
    hasOrganizationWideScope(
      context,
      currentSchool.organization_id,
    )

  const canManageTargetOrganization =
    hasOrganizationWideScope(
      context,
      targetOrganizationId,
    )

  if (
    !canManageCurrentOrganization ||
    !canManageTargetOrganization
  ) {
    throw new Error(
      'Sem permissão para transferir a instituição entre organizações.',
    )
  }
}

async function loadAuthorizedSchool(
  context:
    OrganizationAuthorizationContext,
  schoolId: string,
): Promise<SchoolDto> {
  const school =
    await schoolService.getById(
      schoolId,
    )

  assertSchoolAccess(
    context,
    school,
  )

  return school
}

export async function GET(
  _request: NextRequest,
  context: RouteContext,
) {
  try {
    const authorization =
      await requireOrganizationAdministrator()

    const school =
      await loadAuthorizedSchool(
        authorization,
        context.params.id,
      )

    return NextResponse.json(
      {
        success: true,
        data: school,
      },
      {
        status: 200,
        headers: NO_CACHE_HEADERS,
      },
    )
  } catch (error) {
    console.error(
      '[SCHOOL_GET_BY_ID_ERROR]',
      error,
    )

    return createErrorResponse(
      error,
      'Não foi possível carregar a instituição.',
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

    const currentSchool =
      await loadAuthorizedSchool(
        authorization,
        context.params.id,
      )

    const body: unknown =
      await request.json()

    const targetOrganizationId =
      readTargetOrganizationId(
        body,
      )

    assertOrganizationTransferAccess(
      authorization,
      currentSchool,
      targetOrganizationId,
    )

    const updatedSchool =
      await schoolService.update(
        context.params.id,
        body,
      )

    assertSchoolAccess(
      authorization,
      updatedSchool,
    )

    return NextResponse.json(
      {
        success: true,
        message:
          'Instituição atualizada com sucesso.',
        data: updatedSchool,
      },
      {
        status: 200,
        headers: NO_CACHE_HEADERS,
      },
    )
  } catch (error) {
    console.error(
      '[SCHOOL_PATCH_ERROR]',
      error,
    )

    return createErrorResponse(
      error,
      'Não foi possível atualizar a instituição.',
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

    await loadAuthorizedSchool(
      authorization,
      context.params.id,
    )

    const archivedSchool =
      await schoolService.archive(
        context.params.id,
      )

    return NextResponse.json(
      {
        success: true,
        message:
          'Instituição arquivada com sucesso.',
        data: archivedSchool,
      },
      {
        status: 200,
        headers: NO_CACHE_HEADERS,
      },
    )
  } catch (error) {
    console.error(
      '[SCHOOL_DELETE_ERROR]',
      error,
    )

    return createErrorResponse(
      error,
      'Não foi possível arquivar a instituição.',
    )
  }
}