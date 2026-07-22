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
  type CreateInstitutionalCalendarEventInput,
  InstitutionalAcademicCalendarRepository,
  type InstitutionalCalendarDateRule,
  type InstitutionalCalendarEventStatus,
  type InstitutionalCalendarEventType,
  type InstitutionalCalendarPriority,
  type InstitutionalCalendarSourceType,
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

function normalizeOptionalInteger(
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
    value === undefined
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

function normalizeOptionalIntegerQuery(
  value: string | null,
  fieldName: string,
): number | undefined {
  if (!value?.trim()) {
    return undefined
  }

  return normalizeRequiredInteger(
    value,
    fieldName,
  )
}

function normalizeOptionalQueryText(
  value: string | null,
  maximumLength = 500,
): string | undefined {
  if (!value?.trim()) {
    return undefined
  }

  const normalizedValue =
    value.trim()

  if (
    normalizedValue.length >
    maximumLength
  ) {
    throw new Error(
      `O filtro não pode ultrapassar ${maximumLength} caracteres.`,
    )
  }

  return normalizedValue
}

function normalizeCsvFilter<
  Value extends string,
>(
  value: string | null,
): Value[] | undefined {
  if (!value) {
    return undefined
  }

  const values =
    value
      .split(',')
      .map(
        currentValue =>
          currentValue
            .trim()
            .toLowerCase(),
      )
      .filter(Boolean)

  if (
    values.length === 0
  ) {
    return undefined
  }

  return values as Value[]
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

    const calendarYear =
      normalizeOptionalIntegerQuery(
        request.nextUrl
          .searchParams
          .get(
            'calendarYear',
          ),
        'Ano do calendário',
      )

    const startDate =
      normalizeOptionalQueryText(
        request.nextUrl
          .searchParams
          .get(
            'startDate',
          ),
        10,
      )

    const endDate =
      normalizeOptionalQueryText(
        request.nextUrl
          .searchParams
          .get(
            'endDate',
          ),
        10,
      )

    const eventTypes =
      normalizeCsvFilter<
        InstitutionalCalendarEventType
      >(
        request.nextUrl
          .searchParams
          .get(
            'eventTypes',
          ),
      )

    const statuses =
      normalizeCsvFilter<
        InstitutionalCalendarEventStatus
      >(
        request.nextUrl
          .searchParams
          .get(
            'statuses',
          ),
      )

    const priorities =
      normalizeCsvFilter<
        InstitutionalCalendarPriority
      >(
        request.nextUrl
          .searchParams
          .get(
            'priorities',
          ),
      )

    const service =
      createCalendarService(
        request,
      )

    const events =
      await service
        .listInstitutionalEvents({
          schoolYearId,
          calendarYear,
          startDate,
          endDate,
          eventTypes,
          statuses,
          priorities,
          includeDeleted,
        })

    return NextResponse.json(
      {
        success: true,

        mode:
          'institutional-calendar-events',

        total:
          events.length,

        data:
          events,
      },
      {
        status: 200,
        headers:
          NO_CACHE_HEADERS,
      },
    )
  } catch (error) {
    console.error(
      '[INSTITUTIONAL_CALENDAR_EVENTS_GET_ERROR]',
      error,
    )

    return createErrorResponse(
      error,
      'Não foi possível carregar os eventos institucionais.',
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
      CreateInstitutionalCalendarEventInput = {
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

        academic_period_id:
          normalizeOptionalText(
            body.academicPeriodId,
            'Período letivo',
            100,
          ),

        calendar_year:
          normalizeRequiredInteger(
            body.calendarYear,
            'Ano do calendário',
          ),

        title:
          normalizeRequiredText(
            body.title,
            'Título do evento',
            220,
          ),

        description:
          normalizeOptionalText(
            body.description,
            'Descrição do evento',
            5000,
          ),

        event_type:
          normalizeRequiredText(
            body.eventType,
            'Tipo do evento',
            50,
          ) as
            InstitutionalCalendarEventType,

        scope_level:
          'school',

        date_rule:
          body.dateRule ===
          undefined
            ? 'year_specific'
            : normalizeRequiredText(
                body.dateRule,
                'Regra de data',
                50,
              ) as
                InstitutionalCalendarDateRule,

        source_type:
          body.sourceType ===
          undefined
            ? 'institutional'
            : normalizeRequiredText(
                body.sourceType,
                'Origem do evento',
                50,
              ) as
                InstitutionalCalendarSourceType,

        source_reference:
          normalizeOptionalText(
            body.sourceReference,
            'Referência oficial',
            500,
          ),

        jurisdiction_country:
          body.jurisdictionCountry ===
          undefined
            ? 'Brasil'
            : normalizeOptionalText(
                body.jurisdictionCountry,
                'País',
                180,
              ),

        jurisdiction_state:
          normalizeOptionalText(
            body.jurisdictionState,
            'Estado',
            2,
          ),

        jurisdiction_city:
          normalizeOptionalText(
            body.jurisdictionCity,
            'Município',
            180,
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

        all_day:
          normalizeOptionalBoolean(
            body.allDay,
            'Evento de dia inteiro',
          ) ??
          true,

        start_time:
          normalizeOptionalText(
            body.startTime,
            'Horário inicial',
            8,
          ),

        end_time:
          normalizeOptionalText(
            body.endTime,
            'Horário final',
            8,
          ),

        fixed_month:
          normalizeOptionalInteger(
            body.fixedMonth,
            'Mês fixo',
          ),

        fixed_day:
          normalizeOptionalInteger(
            body.fixedDay,
            'Dia fixo',
          ),

        is_instructional_day:
          normalizeOptionalBoolean(
            body.isInstructionalDay,
            'Dia letivo',
          ) ??
          false,

        counts_as_school_day:
          normalizeOptionalBoolean(
            body.countsAsSchoolDay,
            'Contabilização como dia escolar',
          ) ??
          false,

        suspends_classes:
          normalizeOptionalBoolean(
            body.suspendsClasses,
            'Suspensão de aulas',
          ) ??
          false,

        is_mandatory:
          normalizeOptionalBoolean(
            body.isMandatory,
            'Obrigatoriedade',
          ) ??
          false,

        priority:
          body.priority ===
          undefined
            ? 'normal'
            : normalizeRequiredText(
                body.priority,
                'Prioridade',
                30,
              ) as
                InstitutionalCalendarPriority,

        status:
          'draft',
      }

    const service =
      createCalendarService(
        request,
      )

    const event =
      await service
        .createInstitutionalEvent(
          input,
        )

    return NextResponse.json(
      {
        success: true,

        message:
          'Evento institucional criado com sucesso.',

        data:
          event,
      },
      {
        status: 201,
        headers:
          NO_CACHE_HEADERS,
      },
    )
  } catch (error) {
    console.error(
      '[INSTITUTIONAL_CALENDAR_EVENTS_POST_ERROR]',
      error,
    )

    return createErrorResponse(
      error,
      'Não foi possível criar o evento institucional.',
    )
  }
}