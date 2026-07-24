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
  type AgendaObjectiveCategory,
  type AgendaObjectiveStatus,
} from '@/lib/agenda/repository/objectives.repository'

import {
  objectivesService,
  type UpdateAgendaObjectiveServiceInput,
} from '@/lib/agenda/services/objectives.service'

import {
  requireSessionUser,
} from '@/lib/auth/session'

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

const OBJECTIVE_STATUSES:
  readonly AgendaObjectiveStatus[] = [
    'rascunho',
    'ativo',
    'em_acompanhamento',
    'concluido',
    'suspenso',
    'cancelado',
    'arquivado',
  ]

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

async function requireObjectivesAccess(
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
    typeof value !== 'string'
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
    typeof value !== 'string'
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

function normalizeNullableId(
  value: unknown,
  fieldName: string,
): string | null {
  return normalizeNullableText(
    value,
    fieldName,
    36,
  )
}

function normalizeNullableDate(
  value: unknown,
  fieldName: string,
): string | null {
  return normalizeNullableText(
    value,
    fieldName,
    10,
  )
}

function normalizeProgress(
  value: unknown,
): number {
  const parsedValue =
    typeof value === 'number'
      ? value
      : typeof value === 'string' &&
          value.trim()
        ? Number(value)
        : Number.NaN

  if (
    !Number.isFinite(
      parsedValue,
    )
  ) {
    throw new Error(
      'O progresso deve ser um número válido.',
    )
  }

  if (
    parsedValue < 0 ||
    parsedValue > 100
  ) {
    throw new Error(
      'O progresso deve estar entre 0 e 100.',
    )
  }

  return Number(
    parsedValue.toFixed(2),
  )
}

function normalizeStatus(
  value: unknown,
): AgendaObjectiveStatus {
  if (
    typeof value !== 'string'
  ) {
    throw new Error(
      'Status do objetivo possui formato inválido.',
    )
  }

  const normalizedValue =
    value.trim() as
      AgendaObjectiveStatus

  if (
    !OBJECTIVE_STATUSES.includes(
      normalizedValue,
    )
  ) {
    throw new Error(
      'Status do objetivo é inválido.',
    )
  }

  return normalizedValue
}

function normalizeCategory(
  value: unknown,
): AgendaObjectiveCategory {
  if (
    typeof value !== 'string'
  ) {
    throw new Error(
      'Categoria do objetivo possui formato inválido.',
    )
  }

  const normalizedValue =
    value
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_')

  if (!normalizedValue) {
    throw new Error(
      'Categoria do objetivo é obrigatória.',
    )
  }

  if (
    normalizedValue.length >
    100
  ) {
    throw new Error(
      'Categoria do objetivo não pode ultrapassar 100 caracteres.',
    )
  }

  return normalizedValue
}

function normalizeMetadata(
  value: unknown,
): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new Error(
      'Os metadados do objetivo possuem formato inválido.',
    )
  }

  return value
}

function createUpdateInput(
  body: UnknownRecord,
): UpdateAgendaObjectiveServiceInput {
  const input:
    UpdateAgendaObjectiveServiceInput = {}

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
        'Título do objetivo',
        240,
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
        'Descrição',
        5000,
      )

    mutableFieldCount +=
      1
  }

  if (
    hasOwnProperty(
      body,
      'category',
    )
  ) {
    input.category =
      normalizeCategory(
        body.category,
      )

    mutableFieldCount +=
      1
  }

  if (
    hasOwnProperty(
      body,
      'period',
    )
  ) {
    input.period =
      normalizeNullableText(
        body.period,
        'Período',
        250,
      )

    mutableFieldCount +=
      1
  }

  if (
    hasOwnProperty(
      body,
      'classId',
    )
  ) {
    input.class_id =
      normalizeNullableId(
        body.classId,
        'ID da turma',
      )

    mutableFieldCount +=
      1
  }

  if (
    hasOwnProperty(
      body,
      'subject',
    )
  ) {
    input.subject =
      normalizeNullableText(
        body.subject,
        'Componente curricular',
        250,
      )

    mutableFieldCount +=
      1
  }

  if (
    hasOwnProperty(
      body,
      'responsibleUserId',
    )
  ) {
    input.responsible_user_id =
      normalizeNullableId(
        body.responsibleUserId,
        'ID do responsável',
      )

    mutableFieldCount +=
      1
  }

  if (
    hasOwnProperty(
      body,
      'expectedIndicator',
    )
  ) {
    input.expected_indicator =
      normalizeNullableText(
        body.expectedIndicator,
        'Indicador esperado',
        3000,
      )

    mutableFieldCount +=
      1
  }

  if (
    hasOwnProperty(
      body,
      'expectedEvidence',
    )
  ) {
    input.expected_evidence =
      normalizeNullableText(
        body.expectedEvidence,
        'Evidência esperada',
        3000,
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
      normalizeNullableDate(
        body.startDate,
        'Data inicial',
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
      normalizeNullableDate(
        body.endDate,
        'Data final',
      )

    mutableFieldCount +=
      1
  }

  if (
    hasOwnProperty(
      body,
      'schoolYearId',
    )
  ) {
    input.school_year_id =
      normalizeNullableId(
        body.schoolYearId,
        'ID do ano letivo',
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
      normalizeNullableId(
        body.academicPeriodId,
        'ID do período acadêmico',
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
    hasOwnProperty(
      body,
      'progress',
    )
  ) {
    input.progress =
      normalizeProgress(
        body.progress,
      )

    mutableFieldCount +=
      1
  }

  if (
    hasOwnProperty(
      body,
      'schoolId',
    )
  ) {
    input.school_id =
      normalizeNullableId(
        body.schoolId,
        'ID da escola',
      )

    mutableFieldCount +=
      1
  }

  if (
    hasOwnProperty(
      body,
      'metadata',
    )
  ) {
    input.metadata =
      normalizeMetadata(
        body.metadata,
      )

    mutableFieldCount +=
      1
  }

  if (
    mutableFieldCount === 0
  ) {
    throw new Error(
      'Nenhum campo válido foi informado para atualização.',
    )
  }

  return input
}

function getDeletionReason(
  request: NextRequest,
  body: UnknownRecord,
): string {
  const bodyReason =
    hasOwnProperty(
      body,
      'reason',
    )
      ? body.reason
      : undefined

  const queryReason =
    request.nextUrl
      .searchParams
      .get('reason')

  return normalizeRequiredText(
    bodyReason ??
      queryReason,
    'Motivo da exclusão',
    2000,
  )
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
      'não possui acesso',
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
      'formato',
    ) ||
    message.includes(
      'não pode',
    ) ||
    message.includes(
      'deve ser',
    ) ||
    message.includes(
      'anterior',
    ) ||
    message.includes(
      'nenhum campo',
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
        status: 403,
        headers:
          NO_CACHE_HEADERS,
      },
    )
  }

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
  _request: NextRequest,
  context: RouteContext,
) {
  try {
    const user =
      await requireSessionUser()

    await requireObjectivesAccess(
      user.id,
    )

    const data =
      await objectivesService
        .getById(
          context.params.id,
          user.id,
        )

    return NextResponse.json(
      {
        success: true,
        data,
      },
      {
        status: 200,
        headers:
          NO_CACHE_HEADERS,
      },
    )
  } catch (error) {
    console.error(
      '[AGENDA_OBJECTIVE_GET_ERROR]',
      error,
    )

    return createErrorResponse(
      error,
      'Não foi possível carregar o objetivo.',
    )
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const user =
      await requireSessionUser()

    await requireObjectivesAccess(
      user.id,
    )

    const body =
      await readRequestBody(
        request,
      )

    const input =
      createUpdateInput(
        body,
      )

    const data =
      await objectivesService
        .update(
          context.params.id,
          input,
          {
            actorUserId:
              user.id,
          },
        )

    return NextResponse.json(
      {
        success: true,

        message:
          'Objetivo atualizado com sucesso.',

        data,
      },
      {
        status: 200,
        headers:
          NO_CACHE_HEADERS,
      },
    )
  } catch (error) {
    console.error(
      '[AGENDA_OBJECTIVE_PATCH_ERROR]',
      error,
    )

    return createErrorResponse(
      error,
      'Não foi possível atualizar o objetivo.',
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const user =
      await requireSessionUser()

    await requireObjectivesAccess(
      user.id,
    )

    let body: UnknownRecord = {}

    const contentType =
      request.headers.get(
        'content-type',
      )

    if (
      contentType?.includes(
        'application/json',
      )
    ) {
      body =
        await readRequestBody(
          request,
        )
    }

    const reason =
      getDeletionReason(
        request,
        body,
      )

    await objectivesService
      .remove(
        context.params.id,
        user.id,
        reason,
      )

    return NextResponse.json(
      {
        success: true,

        message:
          'Objetivo excluído com sucesso.',
      },
      {
        status: 200,
        headers:
          NO_CACHE_HEADERS,
      },
    )
  } catch (error) {
    console.error(
      '[AGENDA_OBJECTIVE_DELETE_ERROR]',
      error,
    )

    return createErrorResponse(
      error,
      'Não foi possível excluir o objetivo.',
    )
  }
}
