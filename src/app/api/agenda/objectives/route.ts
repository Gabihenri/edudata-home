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
  type CreateAgendaObjectiveServiceInput,
} from '@/lib/agenda/services/objectives.service'

import {
  requireSessionUser,
} from '@/lib/auth/session'

export const dynamic =
  'force-dynamic'

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
    value === undefined ||
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
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return 0
  }

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
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return 'rascunho'
  }

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
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return 'pedagogico'
  }

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
    return 'pedagogico'
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
  if (
    value === undefined ||
    value === null
  ) {
    return {}
  }

  if (!isRecord(value)) {
    throw new Error(
      'Os metadados do objetivo possuem formato inválido.',
    )
  }

  return value
}

function createObjectiveInput(
  body: UnknownRecord,
): CreateAgendaObjectiveServiceInput {
  return {
    title:
      normalizeRequiredText(
        body.title,
        'Título do objetivo',
        240,
      ),

    description:
      normalizeNullableText(
        body.description,
        'Descrição',
        5000,
      ),

    category:
      normalizeCategory(
        body.category,
      ),

    period:
      normalizeNullableText(
        body.period,
        'Período',
        250,
      ),

    class_id:
      normalizeNullableId(
        body.classId,
        'ID da turma',
      ),

    subject:
      normalizeNullableText(
        body.subject,
        'Componente curricular',
        250,
      ),

    responsible_user_id:
      normalizeNullableId(
        body.responsibleUserId,
        'ID do responsável',
      ),

    expected_indicator:
      normalizeNullableText(
        body.expectedIndicator,
        'Indicador esperado',
        3000,
      ),

    expected_evidence:
      normalizeNullableText(
        body.expectedEvidence,
        'Evidência esperada',
        3000,
      ),

    start_date:
      normalizeNullableDate(
        body.startDate,
        'Data inicial',
      ),

    end_date:
      normalizeNullableDate(
        body.endDate,
        'Data final',
      ),

    school_year_id:
      normalizeNullableId(
        body.schoolYearId,
        'ID do ano letivo',
      ),

    academic_period_id:
      normalizeNullableId(
        body.academicPeriodId,
        'ID do período acadêmico',
      ),

    status:
      normalizeStatus(
        body.status,
      ),

    progress:
      normalizeProgress(
        body.progress,
      ),

    school_id:
      normalizeNullableId(
        body.schoolId,
        'ID da escola',
      ),

    metadata:
      normalizeMetadata(
        body.metadata,
      ),
  }
}

function getSearchParameter(
  request: NextRequest,
  parameterName: string,
): string | null {
  const value =
    request.nextUrl.searchParams
      .get(parameterName)
      ?.trim()

  return value || null
}

function getStatusFilter(
  request: NextRequest,
): AgendaObjectiveStatus | null {
  const value =
    getSearchParameter(
      request,
      'status',
    )

  if (!value) {
    return null
  }

  return normalizeStatus(value)
}

function getCategoryFilter(
  request: NextRequest,
): AgendaObjectiveCategory | null {
  const value =
    getSearchParameter(
      request,
      'category',
    )

  if (!value) {
    return null
  }

  return normalizeCategory(value)
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
  request: NextRequest,
) {
  try {
    const user =
      await requireSessionUser()

    await requireFeatureAccess({
      userId:
        user.id,

      featureCode:
        'agenda.planning',

      options: {
        includeUsage:
          false,
      },
    })

    const data =
      await objectivesService.list(
        user.id,
        {
          status:
            getStatusFilter(
              request,
            ),

          category:
            getCategoryFilter(
              request,
            ),

          classId:
            getSearchParameter(
              request,
              'classId',
            ),

          schoolYearId:
            getSearchParameter(
              request,
              'schoolYearId',
            ),

          academicPeriodId:
            getSearchParameter(
              request,
              'academicPeriodId',
            ),

          responsibleUserId:
            getSearchParameter(
              request,
              'responsibleUserId',
            ),

          subject:
            getSearchParameter(
              request,
              'subject',
            ),

          period:
            getSearchParameter(
              request,
              'period',
            ),

          search:
            getSearchParameter(
              request,
              'search',
            ),
        },
      )

    return NextResponse.json(
      {
        success: true,
        total: data.length,
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
      '[AGENDA_OBJECTIVES_GET_ERROR]',
      error,
    )

    return createErrorResponse(
      error,
      'Não foi possível carregar os objetivos.',
    )
  }
}

export async function POST(
  request: NextRequest,
) {
  try {
    const user =
      await requireSessionUser()

    await requireFeatureAccess({
      userId:
        user.id,

      featureCode:
        'agenda.planning',

      options: {
        includeUsage:
          false,
      },
    })

    const body =
      await readRequestBody(
        request,
      )

    const input =
      createObjectiveInput(
        body,
      )

    /*
     * O proprietário e os campos de
     * auditoria são definidos no servidor.
     * O navegador não pode informar user_id,
     * created_by ou updated_by.
     */
    const data =
      await objectivesService.create(
        input,
        {
          actorUserId:
            user.id,

          schoolId:
            input.school_id,
        },
      )

    return NextResponse.json(
      {
        success: true,

        message:
          'Objetivo criado com sucesso.',

        data,
      },
      {
        status: 201,
        headers:
          NO_CACHE_HEADERS,
      },
    )
  } catch (error) {
    console.error(
      '[AGENDA_OBJECTIVES_POST_ERROR]',
      error,
    )

    return createErrorResponse(
      error,
      'Não foi possível criar o objetivo.',
    )
  }
}
