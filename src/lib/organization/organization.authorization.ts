import {
  createClient,
  type SupabaseClient,
} from '@supabase/supabase-js'

import { requireSessionUser } from '@/lib/auth/session'

type DatabaseRecord =
  Record<string, unknown>

export interface OrganizationAuthorizationMembership {
  id: string
  organizationId: string
  schoolId: string | null
  role: string
  status: string
  hierarchyLevel: number
  scopeType: string
  canManageUsers: boolean
  canManageProducts: boolean
}

export interface OrganizationAuthorizationContext {
  userId: string
  role: string
  status: string
  isPlatformAdministrator: boolean
  organizationIds: string[]
  schoolIds: string[]
  memberships:
    OrganizationAuthorizationMembership[]
}

const PLATFORM_ROLES =
  new Set([
    'platform_admin',
    'super_admin',
  ])

const INSTITUTION_MANAGEMENT_ROLES =
  new Set([
    'institution_admin',
    'regional_manager',
    'supervisor',
    'principal',
    'vice_principal',
  ])

const ROLE_ALIASES:
  Record<string, string> = {
    admin: 'platform_admin',
    administrator:
      'platform_admin',
    administrador:
      'platform_admin',
    admin_plataforma:
      'platform_admin',
    administrador_plataforma:
      'platform_admin',

    superadmin:
      'super_admin',
    super_administrator:
      'super_admin',
    superadministrator:
      'super_admin',
    superadministrador:
      'super_admin',
    superadministrador_edudata_ia:
      'super_admin',

    institution_admin:
      'institution_admin',
    institutional_admin:
      'institution_admin',
    admin_institucional:
      'institution_admin',
    administrador_institucional:
      'institution_admin',

    regional_manager:
      'regional_manager',
    gestor_regional:
      'regional_manager',

    supervisor:
      'supervisor',

    principal:
      'principal',
    director:
      'principal',
    diretor:
      'principal',

    vice_principal:
      'vice_principal',
    vice_director:
      'vice_principal',
    vice_diretor:
      'vice_principal',
  }

function createAuthorizationClient():
  SupabaseClient {
  const url =
    process.env
      .NEXT_PUBLIC_SUPABASE_URL

  const serviceRoleKey =
    process.env
      .SUPABASE_SERVICE_ROLE_KEY

  if (!url) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL não configurada.',
    )
  }

  if (!serviceRoleKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY não configurada.',
    )
  }

  return createClient(
    url,
    serviceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  )
}

function isRecord(
  value: unknown,
): value is DatabaseRecord {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  )
}

function readRequiredString(
  record: DatabaseRecord,
  key: string,
): string {
  const value =
    record[key]

  if (
    typeof value !== 'string' ||
    !value.trim()
  ) {
    throw new Error(
      `Campo de autorização inválido: ${key}.`,
    )
  }

  return value.trim()
}

function readOptionalString(
  record: DatabaseRecord,
  key: string,
): string | null {
  const value =
    record[key]

  if (
    typeof value !== 'string' ||
    !value.trim()
  ) {
    return null
  }

  return value.trim()
}

function readBoolean(
  record: DatabaseRecord,
  key: string,
): boolean {
  return record[key] === true
}

function readNumber(
  record: DatabaseRecord,
  key: string,
  fallback: number,
): number {
  const value =
    record[key]

  if (
    typeof value === 'number' &&
    Number.isFinite(value)
  ) {
    return value
  }

  if (
    typeof value === 'string' &&
    value.trim()
  ) {
    const parsed =
      Number(value)

    if (Number.isFinite(parsed)) {
      return parsed
    }
  }

  return fallback
}

function normalizeRole(
  value: string,
): string {
  const normalized =
    value
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(
        /[\u0300-\u036f]/g,
        '',
      )
      .replace(
        /[\s-]+/g,
        '_',
      )

  return (
    ROLE_ALIASES[normalized] ??
    normalized
  )
}

function isActiveStatus(
  value: string,
): boolean {
  return (
    value
      .trim()
      .toLowerCase() ===
    'active'
  )
}

function isAccessPeriodValid(
  record: DatabaseRecord,
): boolean {
  const startsAt =
    readOptionalString(
      record,
      'access_starts_at',
    )

  const endsAt =
    readOptionalString(
      record,
      'access_ends_at',
    )

  const now =
    Date.now()

  if (startsAt) {
    const startsAtTime =
      new Date(
        startsAt,
      ).getTime()

    if (
      !Number.isNaN(
        startsAtTime,
      ) &&
      startsAtTime > now
    ) {
      return false
    }
  }

  if (endsAt) {
    const endsAtTime =
      new Date(
        endsAt,
      ).getTime()

    if (
      !Number.isNaN(
        endsAtTime,
      ) &&
      endsAtTime < now
    ) {
      return false
    }
  }

  return true
}

function parseMembership(
  value: unknown,
):
  | OrganizationAuthorizationMembership
  | null {
  if (!isRecord(value)) {
    return null
  }

  const id =
    readOptionalString(
      value,
      'id',
    )

  const organizationId =
    readOptionalString(
      value,
      'organization_id',
    )

  const originalRole =
    readOptionalString(
      value,
      'role',
    )

  const status =
    readOptionalString(
      value,
      'status',
    )

  if (
    !id ||
    !organizationId ||
    !originalRole ||
    !status
  ) {
    return null
  }

  return {
    id,
    organizationId,

    schoolId:
      readOptionalString(
        value,
        'school_id',
      ),

    role:
      normalizeRole(
        originalRole,
      ),

    status,

    hierarchyLevel:
      readNumber(
        value,
        'hierarchy_level',
        10,
      ),

    scopeType:
      readOptionalString(
        value,
        'scope_type',
      ) ?? 'self',

    canManageUsers:
      readBoolean(
        value,
        'can_manage_users',
      ),

    canManageProducts:
      readBoolean(
        value,
        'can_manage_products',
      ),
  }
}

function isManagementMembership(
  membership:
    OrganizationAuthorizationMembership,
  source: DatabaseRecord,
): boolean {
  if (
    !isActiveStatus(
      membership.status,
    )
  ) {
    return false
  }

  if (
    !isAccessPeriodValid(source)
  ) {
    return false
  }

  if (
    INSTITUTION_MANAGEMENT_ROLES.has(
      membership.role,
    )
  ) {
    return true
  }

  return (
    membership.canManageUsers ||
    membership.canManageProducts
  )
}

function uniqueValues(
  values: Array<string | null>,
): string[] {
  return [
    ...new Set(
      values.filter(
        (
          value,
        ): value is string =>
          Boolean(value),
      ),
    ),
  ]
}

export async function requireOrganizationAdministrator():
  Promise<OrganizationAuthorizationContext> {
  const user =
    await requireSessionUser()

  const client =
    createAuthorizationClient()

  const [
    profileResult,
    membershipsResult,
  ] = await Promise.all([
    client
      .from('user_profiles')
      .select(
        'role,status',
      )
      .eq(
        'user_id',
        user.id,
      )
      .maybeSingle(),

    client
      .from(
        'organization_members',
      )
      .select(
        [
          'id',
          'organization_id',
          'school_id',
          'role',
          'status',
          'hierarchy_level',
          'scope_type',
          'can_manage_users',
          'can_manage_products',
          'access_starts_at',
          'access_ends_at',
        ].join(','),
      )
      .eq(
        'user_id',
        user.id,
      ),
  ])

  if (profileResult.error) {
    throw new Error(
      `Erro ao verificar perfil de autorização: ${profileResult.error.message}`,
    )
  }

  if (
    membershipsResult.error
  ) {
    throw new Error(
      `Erro ao verificar vínculos institucionais: ${membershipsResult.error.message}`,
    )
  }

  if (
    !isRecord(
      profileResult.data,
    )
  ) {
    throw new Error(
      'Perfil de acesso não encontrado.',
    )
  }

  const originalRole =
    readRequiredString(
      profileResult.data,
      'role',
    )

  const role =
    normalizeRole(
      originalRole,
    )

  const status =
    readRequiredString(
      profileResult.data,
      'status',
    )

  if (
    !isActiveStatus(status)
  ) {
    throw new Error(
      'Perfil inativo ou pendente.',
    )
  }

  if (
    PLATFORM_ROLES.has(role)
  ) {
    return {
      userId: user.id,
      role,
      status,
      isPlatformAdministrator:
        true,
      organizationIds: [],
      schoolIds: [],
      memberships: [],
    }
  }

  const membershipSources =
    Array.isArray(
      membershipsResult.data,
    )
      ? membershipsResult.data
      : []

  const memberships:
    OrganizationAuthorizationMembership[] =
      []

  membershipSources.forEach(
    (source) => {
      const membership =
        parseMembership(source)

      if (
        !membership ||
        !isRecord(source)
      ) {
        return
      }

      if (
        isManagementMembership(
          membership,
          source,
        )
      ) {
        memberships.push(
          membership,
        )
      }
    },
  )

  if (
    memberships.length === 0
  ) {
    throw new Error(
      'Sem permissão para administrar instituições.',
    )
  }

  return {
    userId: user.id,
    role,
    status,
    isPlatformAdministrator:
      false,

    organizationIds:
      uniqueValues(
        memberships.map(
          (membership) =>
            membership.organizationId,
        ),
      ),

    schoolIds:
      uniqueValues(
        memberships.map(
          (membership) =>
            membership.schoolId,
        ),
      ),

    memberships,
  }
}