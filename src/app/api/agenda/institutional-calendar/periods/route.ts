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
  type AcademicPeriodType,
  type CreateAcademicPeriodInput,
  InstitutionalAcademicCalendarRepository,
} from '@/lib/agenda/repository/institutional-academic-calendar.repository'

import {
  InstitutionalAcademicCalendarService,
} from '@/lib/agenda/services/institutional-academic-calendar.service'

export const dynamic =
  'force-dynamic'

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
): string | null | undefined {
  if (
    value === undefined
  ) {
    return undefined
  }

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

function normalizeRequiredInteger(
  value: unknown,
  fieldName: string,
): number {
  const parsedValue =
    typeof value === 'number'
      ? value
      : typeof value === 'string' &&
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
) {
  try {
    await requireSessionUser()

    const schoolYearId =
      normalizeRequiredText(
        request.nextUrl
          .searchParams
          .get(
            'schoolYearId',
          ),
        'Ano letivo',
        100,
      )

    const includeDeleted =
      normalizeBooleanQuery(
        request.nextUrl
          .searchParams
          .get(
            'includeDeleted',
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

    const service =
      createCalendarService(
        request,
      )

    const periods =
      await service
        .listAcademicPeriods({
          schoolYearId,
          statuses,
          includeDeleted,
        })

    return NextResponse.json(
      {
        success: true,
        mode:
          'academic-periods',
        total:
          periods.length,
        data:
          periods,
      },
      {
        status: 200,
        headers:
          NO_CACHE_HEADERS,
      },
    )
  } catch (error) {
    console.error(
      '[INSTITUTIONAL_CALENDAR_PERIODS_GET_ERROR]',
      error,
    )

    return createErrorResponse(
      error,
      'Não foi possível carregar os períodos letivos.',
    )
  }
}

export async function POST(
  request: NextRequest,
) {
  try {
    await requireSessionUser()

    const body =
      await readRequestBody(
        request,
      )

    const input:
      CreateAcademicPeriodInput = {
        organization_id:
          normalizeRequiredText(
            body.organizationId,
            'Organização',
            100,
          ),

        school_id:
          normalizeRequiredText(
            body.schoolId,
            'Escola',
            100,
          ),

        school_year_id:
          normalizeRequiredText(
            body.schoolYearId,
            'Ano letivo',
            100,
          ),

        name:
          normalizeRequiredText(
            body.name,
            'Nome do período',
            180,
          ),

        code:
          normalizeOptionalText(
            body.code,
            'Código do período',
            80,
          ),

        period_type:
          body.periodType ===
          undefined
            ? 'custom'
            : normalizeRequiredText(
                body.periodType,
                'Tipo do período',
                30,
              ) as AcademicPeriodType,

        sequence:
          normalizeRequiredInteger(
            body.sequence,
            'Sequência do período',
          ),

        start_date:
          normalizeRequiredText(
            body.startDate,
            'Data inicial',
            10,
          ),

        end_date:
          normalizeRequiredText(
            body.endDate,
            'Data final',
            10,
          ),

        instructional_days_target:
          normalizeNullableInteger(
            body.instructionalDaysTarget,
            'Meta de dias letivos',
          ),

        status:
          body.status ===
          undefined
            ? 'draft'
            : normalizeRequiredText(
                body.status,
                'Status do período',
                30,
              ) as AcademicCalendarStatus,
      }

    const service =
      createCalendarService(
        request,
      )

    const period =
      await service
        .createAcademicPeriod(
          input,
        )

    return NextResponse.json(
      {
        success: true,

        message:
          'Período letivo criado com sucesso.',

        data:
          period,
      },
      {
        status: 201,
        headers:
          NO_CACHE_HEADERS,
      },
    )
  } catch (error) {
    console.error(
      '[INSTITUTIONAL_CALENDAR_PERIODS_POST_ERROR]',
      error,
    )

    return createErrorResponse(
      error,
      'Não foi possível criar o período letivo.',
    )
  }
}