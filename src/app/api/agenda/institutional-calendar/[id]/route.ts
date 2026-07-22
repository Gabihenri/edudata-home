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
  type AcademicCalendarStatus,
  InstitutionalAcademicCalendarRepository,
  type UpdateSchoolYearInput,
} from '@/lib/agenda/repository/institutional-academic-calendar.repository'

import {
  InstitutionalAcademicCalendarService,
} from '@/lib/agenda/services/institutional-academic-calendar.service'

export const dynamic =
  'force-dynamic'

type RouteContext = {
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
    typeof value ===
      'object' &&
    value !== null &&
    !Array.isArray(
      value,
    )
  )
}

function hasOwnProperty(
  record: UnknownRecord,
  propertyName: string,
): boolean {
  return Object.prototype
    .hasOwnProperty
    .call(
      record,
      propertyName,
    )
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

async function readRequestBody(
  request: NextRequest,
): Promise<UnknownRecord> {
  let body: unknown

  try {
    body =
      await request.json()
  } catch {
    throw new Error(
      'O corpo da requisição é inválido.',
    )
  }

  if (!isRecord(body)) {
    throw new Error(
      'O corpo da requisição é inválido.',
    )
  }

  return body
}

function normalizeNullableText(
  value: unknown,
  fieldName: string,
  maximumLength: number,
): string | null {
  if (
    value === null
  ) {
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

function normalizeRequiredText(
  value: unknown,
  fieldName: string,
  maximumLength: number,
): string {
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

function normalizeInteger(
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

function normalizeNullableInteger(
  value: unknown,
  fieldName: string,
): number | null {
  if (
    value === null ||
    value === ''
  ) {
    return null
  }

  return normalizeInteger(
    value,
    fieldName,
  )
}

function normalizeBoolean(
  value: unknown,
  fieldName: string,
): boolean {
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

function normalizeStatus(
  value: unknown,
): AcademicCalendarStatus {
  return normalizeRequiredText(
    value,
    'Status',
    30,
  )
    .toLowerCase() as
    AcademicCalendarStatus
}

function createUpdateInput(
  body: UnknownRecord,
): UpdateSchoolYearInput {
  const input:
    UpdateSchoolYearInput = {}

  if (
    hasOwnProperty(
      body,
      'name',
    )
  ) {
    input.name =
      normalizeNullableText(
        body.name,
        'Nome do ano letivo',
        180,
      )
  }

  if (
    hasOwnProperty(
      body,
      'year',
    )
  ) {
    input.year =
      normalizeInteger(
        body.year,
        'Ano letivo',
      )
  }

  if (
    hasOwnProperty(
      body,
      'startDate',
    )
  ) {
    input.start_date =
      normalizeNullableText(
        body.startDate,
        'Data inicial',
        10,
      )
  }

  if (
    hasOwnProperty(
      body,
      'endDate',
    )
  ) {
    input.end_date =
      normalizeNullableText(
        body.endDate,
        'Data final',
        10,
      )
  }

  if (
    hasOwnProperty(
      body,
      'active',
    )
  ) {
    input.active =
      normalizeBoolean(
        body.active,
        'Situação ativa',
      )
  }

  if (
    hasOwnProperty(
      body,
      'status',
    )
  ) {
    input.status =
      normalizeStatus(
        body.status,
      )
  }

  if (
    hasOwnProperty(
      body,
      'timezone',
    )
  ) {
    input.timezone =
      normalizeRequiredText(
        body.timezone,
        'Fuso horário',
        100,
      )
  }

  if (
    hasOwnProperty(
      body,
      'minimumSchoolDays',
    )
  ) {
    input.minimum_school_days =
      normalizeInteger(
        body.minimumSchoolDays,
        'Quantidade mínima de dias letivos',
      )
  }

  if (
    hasOwnProperty(
      body,
      'minimumInstructionalHours',
    )
  ) {
    input.minimum_instructional_hours =
      normalizeNullableInteger(
        body.minimumInstructionalHours,
        'Carga horária mínima',
      )
  }

  if (
    hasOwnProperty(
      body,
      'calendarVersion',
    )
  ) {
    input.calendar_version =
      normalizeInteger(
        body.calendarVersion,
        'Versão do calendário',
      )
  }

  if (
    Object.keys(
      input,
    ).length === 0
  ) {
    throw new Error(
      'Informe ao menos um campo para atualização.',
    )
  }

  return input
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
      'não autorizado',
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
    ) ||
    message.includes(
      'informe ao menos',
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
  const status =
    getErrorStatus(
      error,
    )

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

export async function GET(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    await requireSessionUser()

    const service =
      createCalendarService(
        request,
      )

    const schoolYear =
      await service
        .getSchoolYear(
          context.params.id,
        )

    return NextResponse.json(
      {
        success: true,
        data:
          schoolYear,
      },
      {
        status: 200,
        headers:
          NO_CACHE_HEADERS,
      },
    )
  } catch (error) {
    console.error(
      '[INSTITUTIONAL_CALENDAR_SCHOOL_YEAR_GET_ERROR]',
      error,
    )

    return createErrorResponse(
      error,
      'Não foi possível carregar o ano letivo.',
    )
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    await requireSessionUser()

    const body =
      await readRequestBody(
        request,
      )

    const input =
      createUpdateInput(
        body,
      )

    const service =
      createCalendarService(
        request,
      )

    const schoolYear =
      await service
        .updateSchoolYear(
          context.params.id,
          input,
        )

    return NextResponse.json(
      {
        success: true,

        message:
          'Ano letivo atualizado com sucesso.',

        data:
          schoolYear,
      },
      {
        status: 200,
        headers:
          NO_CACHE_HEADERS,
      },
    )
  } catch (error) {
    console.error(
      '[INSTITUTIONAL_CALENDAR_SCHOOL_YEAR_PATCH_ERROR]',
      error,
    )

    return createErrorResponse(
      error,
      'Não foi possível atualizar o ano letivo.',
    )
  }
}