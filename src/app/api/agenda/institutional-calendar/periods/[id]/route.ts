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
  type AcademicPeriod,
  type AcademicPeriodType,
  InstitutionalAcademicCalendarRepository,
  type UpdateAcademicPeriodInput,
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
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
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
  const client =
    createAuthenticatedClient(
      getAccessToken(
        request,
      ),
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

function normalizeNullableText(
  value: unknown,
  fieldName: string,
  maximumLength: number,
): string | null {
  if (
    value === null ||
    value === ''
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
        ? Number(value)
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

function normalizeStatus(
  value: unknown,
): AcademicCalendarStatus {
  return normalizeRequiredText(
    value,
    'Status do período',
    30,
  )
    .toLowerCase() as
    AcademicCalendarStatus
}

function normalizePeriodType(
  value: unknown,
): AcademicPeriodType {
  return normalizeRequiredText(
    value,
    'Tipo do período',
    30,
  )
    .toLowerCase() as
    AcademicPeriodType
}

function createUpdateInput(
  body: UnknownRecord,
  currentPeriod: AcademicPeriod,
): UpdateAcademicPeriodInput {
  const input:
    UpdateAcademicPeriodInput = {
      organization_id:
        currentPeriod
          .organization_id,

      school_id:
        currentPeriod
          .school_id,

      school_year_id:
        currentPeriod
          .school_year_id,
    }

  let mutableFieldCount =
    0

  if (
    hasOwnProperty(
      body,
      'name',
    )
  ) {
    input.name =
      normalizeRequiredText(
        body.name,
        'Nome do período',
        180,
      )

    mutableFieldCount +=
      1
  }

  if (
    hasOwnProperty(
      body,
      'code',
    )
  ) {
    input.code =
      normalizeNullableText(
        body.code,
        'Código do período',
        80,
      )

    mutableFieldCount +=
      1
  }

  if (
    hasOwnProperty(
      body,
      'periodType',
    )
  ) {
    input.period_type =
      normalizePeriodType(
        body.periodType,
      )

    mutableFieldCount +=
      1
  }

  if (
    hasOwnProperty(
      body,
      'sequence',
    )
  ) {
    input.sequence =
      normalizeInteger(
        body.sequence,
        'Sequência do período',
      )

    mutableFieldCount +=
      1
  }

  if (
    hasOwnProperty(
      body,
      'startDate',
    )
  ) {
    input.start_date =
      normalizeRequiredText(
        body.startDate,
        'Data inicial',
        10,
      )

    mutableFieldCount +=
      1
  }

  if (
    hasOwnProperty(
      body,
      'endDate',
    )
  ) {
    input.end_date =
      normalizeRequiredText(
        body.endDate,
        'Data final',
        10,
      )

    mutableFieldCount +=
      1
  }

  if (
    hasOwnProperty(
      body,
      'instructionalDaysTarget',
    )
  ) {
    input.instructional_days_target =
      normalizeNullableInteger(
        body.instructionalDaysTarget,
        'Meta de dias letivos',
      )

    mutableFieldCount +=
      1
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

    mutableFieldCount +=
      1
  }

  if (
    mutableFieldCount ===
    0
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
      'entre 1 e 20',
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

    const period =
      await service
        .getAcademicPeriod(
          context.params.id,
        )

    return NextResponse.json(
      {
        success: true,
        mode:
          'academic-period',

        data:
          period,
      },
      {
        status: 200,
        headers:
          NO_CACHE_HEADERS,
      },
    )
  } catch (error) {
    console.error(
      '[INSTITUTIONAL_CALENDAR_PERIOD_GET_ERROR]',
      error,
    )

    return createErrorResponse(
      error,
      'Não foi possível carregar o período letivo.',
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

    const service =
      createCalendarService(
        request,
      )

    const currentPeriod =
      await service
        .getAcademicPeriod(
          context.params.id,
        )

    const input =
      createUpdateInput(
        body,
        currentPeriod,
      )

    const updatedPeriod =
      await service
        .updateAcademicPeriod(
          currentPeriod.id,
          input,
        )

    return NextResponse.json(
      {
        success: true,

        message:
          'Período letivo atualizado com sucesso.',

        data:
          updatedPeriod,
      },
      {
        status: 200,
        headers:
          NO_CACHE_HEADERS,
      },
    )
  } catch (error) {
    console.error(
      '[INSTITUTIONAL_CALENDAR_PERIOD_PATCH_ERROR]',
      error,
    )

    return createErrorResponse(
      error,
      'Não foi possível atualizar o período letivo.',
    )
  }
}