import {
  createClient,
  type SupabaseClient,
} from '@supabase/supabase-js'

import {
  NextRequest,
  NextResponse,
} from 'next/server'

import {
  requireSessionUser,
} from '@/lib/auth/session'

import {
  InstitutionalAcademicCalendarRepository,
  type AcademicCalendarStatus,
  type CreateSchoolYearInput,
} from '@/lib/agenda/repository/institutional-academic-calendar.repository'

import {
  InstitutionalAcademicCalendarService,
} from '@/lib/agenda/services/institutional-academic-calendar.service'

export const dynamic =
  'force-dynamic'

const NO_CACHE_HEADERS = {
  'Cache-Control':
    'no-store, no-cache, must-revalidate',
}

type CreateSchoolYearBody = {
  organizationId?: unknown
  schoolId?: unknown

  year?: unknown

  name?: unknown

  startDate?: unknown
  endDate?: unknown

  active?: unknown
  status?: unknown

  timezone?: unknown

  minimumSchoolDays?: unknown

  minimumInstructionalHours?:
    unknown

  calendarVersion?: unknown
}

function getAccessToken(
  request: NextRequest,
): string {
  const accessToken =
    request.cookies.get(
      'sb-access-token',
    )?.value ??
    request.cookies.get(
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

  if (!url || !anonKey) {
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
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  )
}

function createCalendarService(
  request: NextRequest,
): InstitutionalAcademicCalendarService {
  const accessToken =
    getAccessToken(
      request,
    )

  const client =
    createAuthenticatedClient(
      accessToken,
    )

  const repository =
    new InstitutionalAcademicCalendarRepository(
      client,
    )

  return new InstitutionalAcademicCalendarService(
    repository,
  )
}

function normalizeRequiredText(
  value: unknown,
  fieldName: string,
  maximumLength = 500,
): string {
  if (
    typeof value !==
    'string'
  ) {
    throw new Error(
      `${fieldName} é obrigatório.`,
    )
  }

  const normalizedValue =
    value.trim()

  if (!normalizedValue) {
    throw new Error(
      `${fieldName} é obrigatório.`,
    )
  }

  if (
    normalizedValue.length >
    maximumLength
  ) {
    throw new Error(
      `${fieldName} não pode ultrapassar ${maximumLength} caracteres.`,
    )
  }

  return normalizedValue
}

function normalizeOptionalText(
  value: unknown,
  fieldName: string,
  maximumLength = 500,
): string | undefined {
  if (
    value === undefined
  ) {
    return undefined
  }

  if (value === null) {
    return undefined
  }

  if (
    typeof value !==
    'string'
  ) {
    throw new Error(
      `${fieldName} possui formato inválido.`,
    )
  }

  const normalizedValue =
    value.trim()

  if (!normalizedValue) {
    return undefined
  }

  if (
    normalizedValue.length >
    maximumLength
  ) {
    throw new Error(
      `${fieldName} não pode ultrapassar ${maximumLength} caracteres.`,
    )
  }

  return normalizedValue
}

function normalizeNullableText(
  value: unknown,
  fieldName: string,
  maximumLength = 500,
): string | null | undefined {
  if (
    value === undefined
  ) {
    return undefined
  }

  if (value === null) {
    return null
  }

  if (
    typeof value !==
    'string'
  ) {
    throw new Error(
      `${fieldName} possui formato inválido.`,
    )
  }

  const normalizedValue =
    value.trim()

  if (!normalizedValue) {
    return null
  }

  if (
    normalizedValue.length >
    maximumLength
  ) {
    throw new Error(
      `${fieldName} não pode ultrapassar ${maximumLength} caracteres.`,
    )
  }

  return normalizedValue
}

function normalizeRequiredInteger(
  value: unknown,
  fieldName: string,
): number {
  const parsedValue =
    typeof value ===
      'number'
      ? value
      : typeof value ===
          'string' &&
        value.trim()
        ? Number(
            value,
          )
        : Number.NaN

  if (
    !Number.isInteger(
      parsedValue,
    )
  ) {
    throw new Error(
      `${fieldName} deve ser um número inteiro.`,
    )
  }

  return parsedValue
}

function normalizeOptionalInteger(
  value: unknown,
  fieldName: string,
): number | undefined {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return undefined
  }

  return normalizeRequiredInteger(
    value,
    fieldName,
  )
}

function normalizeNullableInteger(
  value: unknown,
  fieldName: string,
): number | null | undefined {
  if (
    value === undefined
  ) {
    return undefined
  }

  if (
    value === null ||
    value === ''
  ) {
    return null
  }

  return normalizeRequiredInteger(
    value,
    fieldName,
  )
}

function normalizeOptionalBoolean(
  value: unknown,
  fieldName: string,
): boolean | undefined {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return undefined
  }

  if (
    typeof value ===
    'boolean'
  ) {
    return value
  }

  if (
    typeof value ===
    'string'
  ) {
    const normalizedValue =
      value
        .trim()
        .toLowerCase()

    if (
      normalizedValue ===
      'true'
    ) {
      return true
    }

    if (
      normalizedValue ===
      'false'
    ) {
      return false
    }
  }

  throw new Error(
    `${fieldName} deve ser verdadeiro ou falso.`,
  )
}

function normalizeOptionalYearQuery(
  value: string | null,
): number | undefined {
  if (!value) {
    return undefined
  }

  return normalizeRequiredInteger(
    value,
    'Ano letivo',
  )
}

function normalizeBooleanQuery(
  value: string | null,
): boolean {
  if (!value) {
    return false
  }

  const normalizedValue =
    value
      .trim()
      .toLowerCase()

  if (
    normalizedValue ===
    'true'
  ) {
    return true
  }

  if (
    normalizedValue ===
    'false'
  ) {
    return false
  }

  throw new Error(
    'O filtro includeDeleted deve ser verdadeiro ou falso.',
  )
}

function normalizeStatusFilters(
  value: string | null,
): AcademicCalendarStatus[] | undefined {
  if (!value) {
    return undefined
  }

  const statuses =
    value
      .split(',')
      .map(
        status =>
          status
            .trim()
            .toLowerCase(),
      )
      .filter(Boolean)

  if (
    statuses.length === 0
  ) {
    return undefined
  }

  return statuses as
    AcademicCalendarStatus[]
}

function getErrorStatus(
  error: unknown,
): number {
  if (
    error instanceof
    SyntaxError
  ) {
    return 400
  }

  if (
    !(error instanceof Error)
  ) {
    return 500
  }

  const message =
    error.message
      .toLowerCase()

  if (
    message.includes(
      'não autenticado',
    ) ||
    message.includes(
      'unauthorized',
    )
  ) {
    return 401
  }

  if (
    message.includes(
      'permission denied',
    ) ||
    message.includes(
      'row-level security',
    ) ||
    message.includes(
      'sem permissão',
    ) ||
    message.includes(
      'forbidden',
    )
  ) {
    return 403
  }

  if (
    message.includes(
      'não encontrado',
    ) ||
    message.includes(
      'não encontrada',
    )
  ) {
    return 404
  }

  if (
    message.includes(
      'duplicate',
    ) ||
    message.includes(
      'já existe',
    ) ||
    message.includes(
      'unique constraint',
    )
  ) {
    return 409
  }

  if (
    message.includes(
      'obrigatório',
    ) ||
    message.includes(
      'obrigatória',
    ) ||
    message.includes(
      'inválido',
    ) ||
    message.includes(
      'inválida',
    ) ||
    message.includes(
      'deve ',
    ) ||
    message.includes(
      'não pode',
    ) ||
    message.includes(
      'formato',
    ) ||
    message.includes(
      'corresponde',
    )
  ) {
    return 400
  }

  return 500
}

function createErrorResponse(
  error: unknown,
  fallbackMessage: string,
) {
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
      status:
        getErrorStatus(
          error,
        ),

      headers:
        NO_CACHE_HEADERS,
    },
  )
}

export async function GET(
  request: NextRequest,
) {
  try {
    await requireSessionUser()

    const service =
      createCalendarService(
        request,
      )

    const schoolYearId =
      request.nextUrl
        .searchParams
        .get(
          'schoolYearId',
        )
        ?.trim() ||
      null

    if (schoolYearId) {
      const snapshot =
        await service
          .getSchoolCalendarSnapshot(
            schoolYearId,
          )

      return NextResponse.json(
        {
          success: true,

          mode:
            'snapshot',

          data:
            snapshot,
        },
        {
          status: 200,
          headers:
            NO_CACHE_HEADERS,
        },
      )
    }

    const organizationId =
      request.nextUrl
        .searchParams
        .get(
          'organizationId',
        )
        ?.trim() ||
      undefined

    const schoolId =
      request.nextUrl
        .searchParams
        .get(
          'schoolId',
        )
        ?.trim() ||
      undefined

    const year =
      normalizeOptionalYearQuery(
        request.nextUrl
          .searchParams
          .get(
            'year',
          ),
      )

    const statuses =
      normalizeStatusFilters(
        request.nextUrl
          .searchParams
          .get(
            'statuses',
          ),
      )

    const includeDeleted =
      normalizeBooleanQuery(
        request.nextUrl
          .searchParams
          .get(
            'includeDeleted',
          ),
      )

    const schoolYears =
      await service
        .listSchoolYears({
          organizationId,
          schoolId,
          year,
          statuses,
          includeDeleted,
        })

    return NextResponse.json(
      {
        success: true,

        mode:
          'school-years',

        total:
          schoolYears.length,

        filters: {
          organizationId:
            organizationId ??
            null,

          schoolId:
            schoolId ??
            null,

          year:
            year ??
            null,

          statuses:
            statuses ??
            null,

          includeDeleted,
        },

        data:
          schoolYears,
      },
      {
        status: 200,
        headers:
          NO_CACHE_HEADERS,
      },
    )
  } catch (error) {
    console.error(
      '[INSTITUTIONAL_CALENDAR_GET_ERROR]',
      error,
    )

    return createErrorResponse(
      error,
      'Não foi possível carregar o calendário letivo institucional.',
    )
  }
}

export async function POST(
  request: NextRequest,
) {
  try {
    await requireSessionUser()

    const service =
      createCalendarService(
        request,
      )

    const body =
      (await request.json()) as
        CreateSchoolYearBody

    const organizationId =
      normalizeRequiredText(
        body.organizationId,
        'Organização',
        100,
      )

    const schoolId =
      normalizeRequiredText(
        body.schoolId,
        'Escola',
        100,
      )

    const year =
      normalizeRequiredInteger(
        body.year,
        'Ano letivo',
      )

    const name =
      normalizeNullableText(
        body.name,
        'Nome do ano letivo',
        180,
      )

    const startDate =
      normalizeNullableText(
        body.startDate,
        'Data inicial',
        10,
      )

    const endDate =
      normalizeNullableText(
        body.endDate,
        'Data final',
        10,
      )

    const active =
      normalizeOptionalBoolean(
        body.active,
        'Situação ativa',
      )

    const status =
      normalizeOptionalText(
        body.status,
        'Status',
        30,
      ) as
        | AcademicCalendarStatus
        | undefined

    const timezone =
      normalizeOptionalText(
        body.timezone,
        'Fuso horário',
        100,
      )

    const minimumSchoolDays =
      normalizeOptionalInteger(
        body.minimumSchoolDays,
        'Quantidade mínima de dias letivos',
      )

    const minimumInstructionalHours =
      normalizeNullableInteger(
        body.minimumInstructionalHours,
        'Carga horária mínima',
      )

    const calendarVersion =
      normalizeOptionalInteger(
        body.calendarVersion,
        'Versão do calendário',
      )

    const input:
      CreateSchoolYearInput = {
        organization_id:
          organizationId,

        school_id:
          schoolId,

        year,
      }

    if (
      name !== undefined
    ) {
      input.name =
        name
    }

    if (
      startDate !==
      undefined
    ) {
      input.start_date =
        startDate
    }

    if (
      endDate !==
      undefined
    ) {
      input.end_date =
        endDate
    }

    if (
      active !== undefined
    ) {
      input.active =
        active
    }

    if (
      status !== undefined
    ) {
      input.status =
        status
    }

    if (
      timezone !== undefined
    ) {
      input.timezone =
        timezone
    }

    if (
      minimumSchoolDays !==
      undefined
    ) {
      input.minimum_school_days =
        minimumSchoolDays
    }

    if (
      minimumInstructionalHours !==
      undefined
    ) {
      input
        .minimum_instructional_hours =
        minimumInstructionalHours
    }

    if (
      calendarVersion !==
      undefined
    ) {
      input.calendar_version =
        calendarVersion
    }

    const schoolYear =
      await service
        .createSchoolYear(
          input,
        )

    return NextResponse.json(
      {
        success: true,

        message:
          'Ano letivo criado com sucesso.',

        data:
          schoolYear,
      },
      {
        status: 201,
        headers:
          NO_CACHE_HEADERS,
      },
    )
  } catch (error) {
    console.error(
      '[INSTITUTIONAL_CALENDAR_POST_ERROR]',
      error,
    )

    return createErrorResponse(
      error,
      'Não foi possível criar o ano letivo.',
    )
  }
}