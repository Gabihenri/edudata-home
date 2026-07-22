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
  type InstitutionalCalendarEvent,
  type InstitutionalCalendarEventType,
  type InstitutionalCalendarPriority,
  InstitutionalAcademicCalendarRepository,
  type UpdateInstitutionalCalendarEventInput,
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

function normalizeEventType(
  value: unknown,
): InstitutionalCalendarEventType {
  return normalizeRequiredText(
    value,
    'Tipo do evento',
    50,
  )
    .toLowerCase() as
    InstitutionalCalendarEventType
}

function normalizePriority(
  value: unknown,
): InstitutionalCalendarPriority {
  return normalizeRequiredText(
    value,
    'Prioridade do evento',
    30,
  )
    .toLowerCase() as
    InstitutionalCalendarPriority
}

function createUpdateInput(
  body: UnknownRecord,
  currentEvent:
    InstitutionalCalendarEvent,
): UpdateInstitutionalCalendarEventInput {
  if (
    currentEvent.status ===
    'cancelled'
  ) {
    throw new Error(
      'Um evento cancelado não pode ser editado.',
    )
  }

  const input:
    UpdateInstitutionalCalendarEventInput = {
      organization_id:
        currentEvent
          .organization_id,

      school_id:
        currentEvent
          .school_id,

      school_year_id:
        currentEvent
          .school_year_id,

      calendar_year:
        currentEvent
          .calendar_year,

      scope_level:
        currentEvent
          .scope_level,

      date_rule:
        currentEvent
          .date_rule,

      source_type:
        currentEvent
          .source_type,

      jurisdiction_country:
        currentEvent
          .jurisdiction_country,

      jurisdiction_state:
        currentEvent
          .jurisdiction_state,

      jurisdiction_city:
        currentEvent
          .jurisdiction_city,

      fixed_month:
        currentEvent
          .fixed_month,

      fixed_day:
        currentEvent
          .fixed_day,

      calculation_rule:
        currentEvent
          .calculation_rule,

      status:
        currentEvent.status,

      metadata:
        currentEvent.metadata,
    }

  let mutableFieldCount =
    0

  if (
    hasOwnProperty(
      body,
      'title',
    )
  ) {
    input.title =
      normalizeRequiredText(
        body.title,
        'Título do evento',
        220,
      )

    mutableFieldCount +=
      1
  }

  if (
    hasOwnProperty(
      body,
      'description',
    )
  ) {
    input.description =
      normalizeNullableText(
        body.description,
        'Descrição do evento',
        5000,
      )

    mutableFieldCount +=
      1
  }

  if (
    hasOwnProperty(
      body,
      'eventType',
    )
  ) {
    input.event_type =
      normalizeEventType(
        body.eventType,
      )

    mutableFieldCount +=
      1
  }

  if (
    hasOwnProperty(
      body,
      'academicPeriodId',
    )
  ) {
    input.academic_period_id =
      normalizeNullableText(
        body.academicPeriodId,
        'Período letivo',
        100,
      )

    mutableFieldCount +=
      1
  }

  if (
    hasOwnProperty(
      body,
      'sourceReference',
    )
  ) {
    input.source_reference =
      normalizeNullableText(
        body.sourceReference,
        'Referência institucional',
        500,
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
      'allDay',
    )
  ) {
    input.all_day =
      normalizeBoolean(
        body.allDay,
        'Evento de dia inteiro',
      )

    mutableFieldCount +=
      1
  }

  if (
    hasOwnProperty(
      body,
      'startTime',
    )
  ) {
    input.start_time =
      normalizeNullableText(
        body.startTime,
        'Horário inicial',
        8,
      )

    mutableFieldCount +=
      1
  }

  if (
    hasOwnProperty(
      body,
      'endTime',
    )
  ) {
    input.end_time =
      normalizeNullableText(
        body.endTime,
        'Horário final',
        8,
      )

    mutableFieldCount +=
      1
  }

  if (
    hasOwnProperty(
      body,
      'isInstructionalDay',
    )
  ) {
    input.is_instructional_day =
      normalizeBoolean(
        body.isInstructionalDay,
        'Dia letivo',
      )

    mutableFieldCount +=
      1
  }

  if (
    hasOwnProperty(
      body,
      'countsAsSchoolDay',
    )
  ) {
    input.counts_as_school_day =
      normalizeBoolean(
        body.countsAsSchoolDay,
        'Contabilização como dia escolar',
      )

    mutableFieldCount +=
      1
  }

  if (
    hasOwnProperty(
      body,
      'suspendsClasses',
    )
  ) {
    input.suspends_classes =
      normalizeBoolean(
        body.suspendsClasses,
        'Suspensão de aulas',
      )

    mutableFieldCount +=
      1
  }

  if (
    hasOwnProperty(
      body,
      'isMandatory',
    )
  ) {
    input.is_mandatory =
      normalizeBoolean(
        body.isMandatory,
        'Obrigatoriedade',
      )

    mutableFieldCount +=
      1
  }

  if (
    hasOwnProperty(
      body,
      'priority',
    )
  ) {
    input.priority =
      normalizePriority(
        body.priority,
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
      'cancelado não pode',
    ) ||
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
  context: RouteContext,
) {
  try {
    await requireSessionUser()

    const service =
      createCalendarService(
        request,
      )

    const event =
      await service
        .getInstitutionalEvent(
          context.params.id,
        )

    return NextResponse.json(
      {
        success: true,
        data: event,
      },
      {
        status: 200,
        headers:
          NO_CACHE_HEADERS,
      },
    )
  } catch (error) {
    console.error(
      '[INSTITUTIONAL_CALENDAR_EVENT_GET_ERROR]',
      error,
    )

    return createErrorResponse(
      error,
      'Não foi possível carregar o evento institucional.',
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

    const currentEvent =
      await service
        .getInstitutionalEvent(
          context.params.id,
        )

    const input =
      createUpdateInput(
        body,
        currentEvent,
      )

    const updatedEvent =
      await service
        .updateInstitutionalEvent(
          currentEvent.id,
          input,
        )

    return NextResponse.json(
      {
        success: true,

        message:
          'Evento institucional atualizado com sucesso.',

        data:
          updatedEvent,
      },
      {
        status: 200,
        headers:
          NO_CACHE_HEADERS,
      },
    )
  } catch (error) {
    console.error(
      '[INSTITUTIONAL_CALENDAR_EVENT_PATCH_ERROR]',
      error,
    )

    return createErrorResponse(
      error,
      'Não foi possível atualizar o evento institucional.',
    )
  }
}