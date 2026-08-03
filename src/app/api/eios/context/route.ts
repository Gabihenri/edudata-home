import {
  createClient,
  type SupabaseClient,
} from '@supabase/supabase-js'

import {
  NextRequest,
  NextResponse,
} from 'next/server'

import {
  isAccessDeniedError,
  requireFeatureAccess,
  serializeAccessDeniedError,
} from '@/lib/access/guards/require-feature-access'

import {
  requireSessionUser,
} from '@/lib/auth/session'

import {
  loadAgendaOperationalSnapshot,
} from '@/lib/agenda/services/operational-snapshot.service'

import {
  createEducationalContext,
} from '@/lib/eios/context/educational-context.service'

import type {
  EducationalContextAccessScope,
  EducationalContextIdentifier,
  EducationalContextPeriod,
  EducationalContextRole,
} from '@/lib/eios/context/educational-context.contract'

export const dynamic =
  'force-dynamic'

export const runtime =
  'nodejs'

type UnknownRecord =
  Record<string, unknown>

const NO_CACHE_HEADERS = {
  'Cache-Control':
    'no-store, no-cache, must-revalidate',
}

const ALLOWED_ROLES =
  new Set<EducationalContextRole>([
    'individual_user',
    'teacher',
    'coordinator',
    'supervisor',
    'manager',
    'institution_administrator',
    'system_administrator',
  ])

const ROLE_ALIASES:
  Record<
    string,
    EducationalContextRole
  > = {
    individual:
      'individual_user',

    individual_user:
      'individual_user',

    usuario_individual:
      'individual_user',

    professor:
      'teacher',

    teacher:
      'teacher',

    docente:
      'teacher',

    coordenador:
      'coordinator',

    coordinator:
      'coordinator',

    coordenacao:
      'coordinator',

    supervisor:
      'supervisor',

    supervisor_pedagogico:
      'supervisor',

    gestor:
      'manager',

    manager:
      'manager',

    diretor:
      'manager',

    director:
      'manager',

    admin:
      'institution_administrator',

    administrador:
      'institution_administrator',

    institution_admin:
      'institution_administrator',

    institution_administrator:
      'institution_administrator',

    administrador_institucional:
      'institution_administrator',

    superadmin:
      'system_administrator',

    super_admin:
      'system_administrator',

    system_admin:
      'system_administrator',

    system_administrator:
      'system_administrator',

    administrador_sistema:
      'system_administrator',
  }

function isRecord(
  value: unknown,
): value is UnknownRecord {
  return (
    typeof value ===
      'object' &&
    value !== null &&
    !Array.isArray(
      value,
    )
  )
}

function normalizeOptionalText(
  value: unknown,
): string | null {
  if (
    typeof value !==
    'string'
  ) {
    return null
  }

  const normalizedValue =
    value.trim()

  return (
    normalizedValue ||
    null
  )
}

function normalizeRoleValue(
  value: unknown,
): EducationalContextRole | null {
  const normalizedValue =
    normalizeOptionalText(
      value,
    )
      ?.toLowerCase()
      .normalize('NFD')
      .replace(
        /[\u0300-\u036f]/g,
        '',
      )
      .replace(
        /[\s-]+/g,
        '_',
      )

  if (!normalizedValue) {
    return null
  }

  const alias =
    ROLE_ALIASES[
      normalizedValue
    ]

  if (alias) {
    return alias
  }

  if (
    ALLOWED_ROLES.has(
      normalizedValue as
        EducationalContextRole,
    )
  ) {
    return normalizedValue as
      EducationalContextRole
  }

  return null
}

function resolveUserRole(
  user: unknown,
): EducationalContextRole {
  if (!isRecord(user)) {
    return 'teacher'
  }

  const appMetadata =
    isRecord(
      user.app_metadata,
    )
      ? user.app_metadata
      : {}

  const userMetadata =
    isRecord(
      user.user_metadata,
    )
      ? user.user_metadata
      : {}

  const candidates = [
    appMetadata.role,
    appMetadata.system_role,
    appMetadata.user_role,
    appMetadata.profile,
    userMetadata.role,
    userMetadata.system_role,
    userMetadata.user_role,
    userMetadata.profile,
  ]

  for (
    const candidate
    of candidates
  ) {
    const role =
      normalizeRoleValue(
        candidate,
      )

    if (role) {
      return role
    }
  }

  return 'teacher'
}

function resolveAccessScope(
  role:
    EducationalContextRole,
): EducationalContextAccessScope {
  if (
    role ===
    'system_administrator'
  ) {
    return 'platform'
  }

  if (
    role ===
    'institution_administrator'
  ) {
    return 'organization'
  }

  if (
    role ===
    'manager'
  ) {
    return 'school'
  }

  if (
    role ===
      'coordinator' ||
    role ===
      'supervisor'
  ) {
    return 'assigned_team'
  }

  if (
    role ===
    'teacher'
  ) {
    return 'assigned_classes'
  }

  return 'self'
}

function getAccessToken(
  request: NextRequest,
): string {
  const accessToken =
    request.cookies.get(
      'sb-access-token',
    )?.value
    ?? request.cookies.get(
      'access_token',
    )?.value

  if (!accessToken) {
    throw new Error(
      'Usuário não autenticado.',
    )
  }

  return accessToken
}

function createAuthenticatedClient(
  accessToken: string,
): SupabaseClient {
  const url =
    process.env
      .NEXT_PUBLIC_SUPABASE_URL

  const anonKey =
    process.env
      .NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (
    !url ||
    !anonKey
  ) {
    throw new Error(
      'Variáveis públicas do Supabase não configuradas.',
    )
  }

  return createClient(
    url,
    anonKey,
    {
      global: {
        headers: {
          Authorization:
            `Bearer ${accessToken}`,
        },
      },

      auth: {
        persistSession:
          false,

        autoRefreshToken:
          false,

        detectSessionInUrl:
          false,
      },
    },
  )
}

function getTimeZone(
  request: NextRequest,
): string {
  const queryTimeZone =
    normalizeOptionalText(
      request
        .nextUrl
        .searchParams
        .get(
          'timezone',
        ),
    )

  const headerTimeZone =
    normalizeOptionalText(
      request.headers.get(
        'x-edi-timezone',
      ),
    )

  return (
    queryTimeZone ??
    headerTimeZone ??
    'America/Sao_Paulo'
  )
}

function getReferenceDate(
  request: NextRequest,
): string {
  const requestedDate =
    normalizeOptionalText(
      request
        .nextUrl
        .searchParams
        .get(
          'referenceDate',
        ),
    )

  if (!requestedDate) {
    return new Date()
      .toISOString()
  }

  const parsedDate =
    new Date(
      requestedDate,
    )

  if (
    Number.isNaN(
      parsedDate.getTime(),
    )
  ) {
    throw new Error(
      'A data de referência informada é inválida.',
    )
  }

  return parsedDate
    .toISOString()
}

function inferOrganizationId(
  records:
    UnknownRecord[],
): string | null {
  for (
    const record
    of records
  ) {
    const organizationId =
      normalizeOptionalText(
        record.organization_id,
      )
      ?? normalizeOptionalText(
        record.organizationId,
      )

    if (organizationId) {
      return organizationId
    }
  }

  return null
}

function inferSchoolId(
  records:
    UnknownRecord[],
): string | null {
  for (
    const record
    of records
  ) {
    const schoolId =
      normalizeOptionalText(
        record.school_id,
      )
      ?? normalizeOptionalText(
        record.schoolId,
      )

    if (schoolId) {
      return schoolId
    }
  }

  return null
}

function buildIdentity({
  userId,
  role,
  records,
}: {
  userId: string

  role:
    EducationalContextRole

  records:
    UnknownRecord[]
}): EducationalContextIdentifier {
  return {
    userId,

    organizationId:
      inferOrganizationId(
        records,
      ),

    schoolId:
      inferSchoolId(
        records,
      ),

    role,

    accessScope:
      resolveAccessScope(
        role,
      ),
  }
}

function buildPeriod(
  request: NextRequest,
): EducationalContextPeriod {
  const referenceDate =
    getReferenceDate(
      request,
    )

  const parsedDate =
    new Date(
      referenceDate,
    )

  return {
    referenceDate,

    timezone:
      getTimeZone(
        request,
      ),

    academicYear:
      parsedDate.getUTCFullYear(),

    academicPeriod:
      null,

    periodStart:
      null,

    periodEnd:
      null,
  }
}

function getErrorMessage(
  error: unknown,
): string {
  if (
    error instanceof Error
  ) {
    return error.message
  }

  return String(error)
}

async function requireContextAccess(
  userId: string,
): Promise<void> {
  await requireFeatureAccess({
    userId,

    featureCode:
      'agenda.planning',

    options: {
      includeUsage:
        false,
    },
  })
}

function buildErrorResponse(
  error: unknown,
): NextResponse {
  if (
    isAccessDeniedError(
      error,
    )
  ) {
    return NextResponse.json(
      serializeAccessDeniedError(
        error,
      ),
      {
        status:
          403,

        headers:
          NO_CACHE_HEADERS,
      },
    )
  }

  const message =
    getErrorMessage(
      error,
    )

  const normalizedMessage =
    message
      .trim()
      .toLowerCase()

  if (
    normalizedMessage.includes(
      'não autenticado',
    )
  ) {
    return NextResponse.json(
      {
        success:
          false,

        error:
          'Usuário não autenticado.',
      },
      {
        status:
          401,

        headers:
          NO_CACHE_HEADERS,
      },
    )
  }

  if (
    normalizedMessage.includes(
      'data de referência',
    )
  ) {
    return NextResponse.json(
      {
        success:
          false,

        error:
          message,
      },
      {
        status:
          400,

        headers:
          NO_CACHE_HEADERS,
      },
    )
  }

  if (
    normalizedMessage.includes(
      'supabase',
    )
    || normalizedMessage.includes(
      'configurad',
    )
  ) {
    return NextResponse.json(
      {
        success:
          false,

        error:
          message,
      },
      {
        status:
          503,

        headers:
          NO_CACHE_HEADERS,
      },
    )
  }

  return NextResponse.json(
    {
      success:
        false,

      error:
        message,
    },
    {
      status:
        500,

      headers:
        NO_CACHE_HEADERS,
    },
  )
}

export async function GET(
  request: NextRequest,
): Promise<NextResponse> {
  try {
    const user =
      await requireSessionUser()

    await requireContextAccess(
      user.id,
    )

    const accessToken =
      getAccessToken(
        request,
      )

    const client =
      createAuthenticatedClient(
        accessToken,
      )

    const {
      snapshot,
    } =
      await loadAgendaOperationalSnapshot({
        client,

        userId:
          user.id,
      })

    const planning =
      snapshot.planning as
        UnknownRecord[]

    const objectives =
      snapshot.objectives as
        UnknownRecord[]

    const lessons =
      snapshot.lessons as
        UnknownRecord[]

    const evidences =
      snapshot.evidences as
        UnknownRecord[]

    const allAgendaRecords = [
      ...planning,
      ...objectives,
      ...lessons,
      ...evidences,
    ]

    const role =
      resolveUserRole(
        user,
      )

    const result =
      createEducationalContext({
        identity:
          buildIdentity({
            userId:
              user.id,

            role,

            records:
              allAgendaRecords,
          }),

        period:
          buildPeriod(
            request,
          ),

        agenda: {
          planning,

          objectives,

          lessons,

          evidences,

          tasks:
            [],

          calendarEvents:
            [],
        },

        sources: [
          'agenda',
          'professor_digital',
          'analytics',
        ],
      })

    if (
      !result.success ||
      !result.context
    ) {
      return NextResponse.json(
        {
          success:
            false,

          error:
            result.errors[0]
            ?? 'Não foi possível gerar o contexto educacional.',

          errors:
            result.errors,

          warnings:
            result.warnings,
        },
        {
          status:
            422,

          headers:
            NO_CACHE_HEADERS,
        },
      )
    }

    return NextResponse.json(
      {
        success:
          true,

        generatedAt:
          result.context
            .metadata
            .generatedAt,

        contractVersion:
          result.context
            .metadata
            .contractVersion,

        context:
          result.context,

        warnings:
          result.warnings,
      },
      {
        status:
          200,

        headers:
          NO_CACHE_HEADERS,
      },
    )
  } catch (error) {
    console.error(
      '[EIOS_CONTEXT_GET_ERROR]',
      {
        error:
          getErrorMessage(
            error,
          ),
      },
    )

    return buildErrorResponse(
      error,
    )
  }
}