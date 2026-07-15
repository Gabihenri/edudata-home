import {
  NextRequest,
  NextResponse,
} from 'next/server'

import {
  createClient,
  type SupabaseClient,
} from '@supabase/supabase-js'

import { requireSessionUser } from '@/lib/auth/session'

import { organizationService } from '@/lib/organization/organization.service'

export const dynamic = 'force-dynamic'

type DatabaseRecord =
  Record<string, unknown>

const NO_CACHE_HEADERS = {
  'Cache-Control':
    'no-store, no-cache, must-revalidate',
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

function readString(
  record:
    | DatabaseRecord
    | null,
  key: string,
): string | null {
  if (!record) {
    return null
  }

  const value = record[key]

  if (
    typeof value !== 'string' ||
    !value.trim()
  ) {
    return null
  }

  return value.trim()
}

function normalizeRole(
  value: string | null,
): string | null {
  if (!value) {
    return null
  }

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
  value: string | null,
): boolean {
  return (
    value
      ?.trim()
      .toLowerCase() ===
    'active'
  )
}

async function requirePlatformAdministrator():
  Promise<void> {
  const user =
    await requireSessionUser()

  const client =
    createAuthorizationClient()

  const {
    data,
    error,
  } = await client
    .from('user_profiles')
    .select('role,status')
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

  const profile =
    isRecord(data)
      ? data
      : null

  const role =
    normalizeRole(
      readString(
        profile,
        'role',
      ),
    )

  const status =
    readString(
      profile,
      'status',
    )

  if (!isActiveStatus(status)) {
    throw new Error(
      'Perfil inativo ou pendente.',
    )
  }

  if (
    !role ||
    !PLATFORM_ROLES.has(role)
  ) {
    throw new Error(
      'Sem permissão para administrar organizações.',
    )
  }
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
      'perfil inativo',
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
      'já existe',
    ) ||
    message.includes(
      'duplicate',
    ) ||
    message.includes(
      'unique',
    )
  ) {
    return 409
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
      'no máximo',
    ) ||
    message.includes(
      'nenhum campo',
    )
  ) {
    return 400
  }

  if (
    message.includes(
      'não encontrada',
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
      headers:
        NO_CACHE_HEADERS,
    },
  )
}

export async function GET() {
  try {
    await requirePlatformAdministrator()

    const organizations =
      await organizationService.listAll()

    return NextResponse.json(
      {
        success: true,
        total:
          organizations.length,
        data:
          organizations,
      },
      {
        status: 200,
        headers:
          NO_CACHE_HEADERS,
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
    await requirePlatformAdministrator()

    const body:
      unknown =
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
        data:
          organization,
      },
      {
        status: 201,
        headers:
          NO_CACHE_HEADERS,
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