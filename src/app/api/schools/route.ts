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
    message.includes('obrigatório') ||
    message.includes('inválido') ||
    message.includes('inválida') ||
    message.includes('no máximo') ||
    message.includes('nenhum campo') ||
    message.includes('exatamente')
  ) {
    return 400
  }

  if (
    message.includes('não encontrada')
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

function readOrganizationId(
  value: unknown,
): string {
  if (!isRecord(value)) {
    throw new Error(
      'Dados da instituição inválidos.',
    )
  }

  const organizationId =
    value.organization_id

  if (
    typeof organizationId !==
      'string' ||
    !organizationId.trim()
  ) {
    throw new Error(
      'Identificador da organização é obrigatório.',
    )
  }

  return organizationId.trim()
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

function getScopedSchoolIds(
  context:
    OrganizationAuthorizationContext,
  organizationId: string,
): string[] {
  return [
    ...new Set(
      context.memberships
        .filter(
          (membership) =>
            membership.organizationId ===
              organizationId &&
            Boolean(
              membership.schoolId,
            ),
        )
        .map(
          (membership) =>
            membership.schoolId,
        )
        .filter(
          (
            schoolId,
          ): schoolId is string =>
            Boolean(schoolId),
        ),
    ),
  ]
}

function sortInstitutions(
  institutions: SchoolDto[],
): SchoolDto[] {
  return [...institutions].sort(
    (first, second) =>
      first.name.localeCompare(
        second.name,
        'pt-BR',
        {
          sensitivity: 'base',
        },
      ),
  )
}

function removeDuplicatedInstitutions(
  institutions: SchoolDto[],
): SchoolDto[] {
  const institutionsById =
    new Map<string, SchoolDto>()

  institutions.forEach(
    (institution) => {
      institutionsById.set(
        institution.id,
        institution,
      )
    },
  )

  return sortInstitutions(
    [...institutionsById.values()],
  )
}

async function loadSchoolByScopedId(
  schoolId: string,
  organizationId: string,
): Promise<SchoolDto | null> {
  try {
    const institution =
      await schoolService.getById(
        schoolId,
      )

    if (
      institution.organization_id !==
      organizationId
    ) {
      return null
    }

    return institution
  } catch (error) {
    if (
      error instanceof Error &&
      error.message
        .toLowerCase()
        .includes('não encontrada')
    ) {
      return null
    }

    throw error
  }
}

async function listScopedInstitutions(
  context:
    OrganizationAuthorizationContext,
  requestedOrganizationId:
    string | null,
): Promise<SchoolDto[]> {
  if (
    context.isPlatformAdministrator
  ) {
    if (requestedOrganizationId) {
      return schoolService.listByOrganizationId(
        requestedOrganizationId,
      )
    }

    return schoolService.listAll()
  }

  if (
    requestedOrganizationId &&
    !hasOrganizationAccess(
      context,
      requestedOrganizationId,
    )
  ) {
    throw new Error(
      'Organização fora do escopo autorizado.',
    )
  }

  const organizationIds =
    requestedOrganizationId
      ? [requestedOrganizationId]
      : context.organizationIds

  const institutionGroups =
    await Promise.all(
      organizationIds.map(
        async (organizationId) => {
          if (
            hasOrganizationWideScope(
              context,
              organizationId,
            )
          ) {
            return schoolService.listByOrganizationId(
              organizationId,
            )
          }

          const schoolIds =
            getScopedSchoolIds(
              context,
              organizationId,
            )

          const scopedInstitutions =
            await Promise.all(
              schoolIds.map(
                (schoolId) =>
                  loadSchoolByScopedId(
                    schoolId,
                    organizationId,
                  ),
              ),
            )

          return scopedInstitutions.filter(
            (
              institution,
            ): institution is SchoolDto =>
              institution !== null,
          )
        },
      ),
    )

  return removeDuplicatedInstitutions(
    institutionGroups.flat(),
  )
}

function assertCanCreateInstitution(
  context:
    OrganizationAuthorizationContext,
  organizationId: string,
): void {
  if (
    context.isPlatformAdministrator
  ) {
    return
  }

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

  if (
    !hasOrganizationWideScope(
      context,
      organizationId,
    )
  ) {
    throw new Error(
      'Sem permissão para cadastrar instituições nesta organização.',
    )
  }
}

export async function GET(
  request: NextRequest,
) {
  try {
    const authorization =
      await requireOrganizationAdministrator()

    const organizationId =
      request.nextUrl.searchParams.get(
        'organization_id',
      )

    const institutions =
      await listScopedInstitutions(
        authorization,
        organizationId,
      )

    return NextResponse.json(
      {
        success: true,
        total: institutions.length,
        data: institutions,
      },
      {
        status: 200,
        headers: NO_CACHE_HEADERS,
      },
    )
  } catch (error) {
    console.error(
      '[SCHOOLS_GET_ERROR]',
      error,
    )

    return createErrorResponse(
      error,
      'Não foi possível carregar as instituições.',
    )
  }
}

export async function POST(
  request: NextRequest,
) {
  try {
    const authorization =
      await requireOrganizationAdministrator()

    const body: unknown =
      await request.json()

    const organizationId =
      readOrganizationId(body)

    assertCanCreateInstitution(
      authorization,
      organizationId,
    )

    const institution =
      await schoolService.create(
        body,
      )

    return NextResponse.json(
      {
        success: true,
        message:
          'Instituição cadastrada com sucesso.',
        data: institution,
      },
      {
        status: 201,
        headers: NO_CACHE_HEADERS,
      },
    )
  } catch (error) {
    console.error(
      '[SCHOOLS_POST_ERROR]',
      error,
    )

    return createErrorResponse(
      error,
      'Não foi possível cadastrar a instituição.',
    )
  }
}