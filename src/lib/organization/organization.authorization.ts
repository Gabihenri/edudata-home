import {
  createClient,
  type SupabaseClient,
} from '@supabase/supabase-js'

import { requireSessionUser } from '@/lib/auth/session'

type DatabaseRecord =
  Record<string, unknown>

export interface OrganizationAuthorizationContext {
  userId: string
  role: string
  status: string
}

const PLATFORM_ROLES = new Set([
  'platform_admin',
  'super_admin',
])

const ROLE_ALIASES:
  Record<string, string> = {
    admin: 'platform_admin',
    administrator: 'platform_admin',
    administrador: 'platform_admin',
    admin_plataforma:
      'platform_admin',
    administrador_plataforma:
      'platform_admin',

    superadmin: 'super_admin',
    super_administrator:
      'super_admin',
    superadministrator:
      'super_admin',
    superadministrador:
      'super_admin',
    superadministrador_edudata_ia:
      'super_admin',
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

export async function requireOrganizationAdministrator():
  Promise<OrganizationAuthorizationContext> {
  const user =
    await requireSessionUser()

  const client =
    createAuthorizationClient()

  const {
    data,
    error,
  } = await client
    .from('user_profiles')
    .select(
      'role,status',
    )
    .eq(
      'user_id',
      user.id,
    )
    .maybeSingle()

  if (error) {
    throw new Error(
      `Erro ao verificar autorização: ${error.message}`,
    )
  }

  if (!isRecord(data)) {
    throw new Error(
      'Perfil de acesso não encontrado.',
    )
  }

  const originalRole =
    readRequiredString(
      data,
      'role',
    )

  const role =
    normalizeRole(
      originalRole,
    )

  const status =
    readRequiredString(
      data,
      'status',
    )

  if (!isActiveStatus(status)) {
    throw new Error(
      'Perfil inativo ou pendente.',
    )
  }

  if (
    !PLATFORM_ROLES.has(role)
  ) {
    throw new Error(
      'Sem permissão para administrar organizações.',
    )
  }

  return {
    userId: user.id,
    role,
    status,
  }
}