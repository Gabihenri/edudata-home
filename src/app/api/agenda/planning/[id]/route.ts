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
  PlanningRepository,
  type AgendaPlanningStatus,
  type UpdateAgendaPlanningInput,
} from '@/lib/agenda/repository/planning.repository'

import {
  PlanningService,
} from '@/lib/agenda/services/planning.service'

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

const PLANNING_STATUSES:
  readonly AgendaPlanningStatus[] = [
    'rascunho',
    'em_revisao',
    'em revisão',
    'aprovado',
    'programado',
    'executado',
    'arquivado',

    // Compatibilidade com registros legados.
    'planejado',
    'concluido',
    'concluído',
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

function createPlanningService(
  request: NextRequest,
): PlanningService {
  const client =
    createAuthenticatedClient(
      getAccessToken(
        request,
      ),
    )

  const repository =
    new PlanningRepository(
      client,
    )

  return new PlanningService(
    repository,
  )
}

async function requirePlanningAccess(
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

function normalizeNullableTime(
  value: unknown,
  fieldName: string,
): string | null {
  return normalizeNullableText(
    value,
    fieldName,
    8,
  )
}

function normalizeNullablePositiveInteger(
  value: unknown,
  fieldName: string,
): number | null {
  if (
    value === null ||
    value === ''
  ) {
    return null
  }

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
    ) ||
    parsedValue <= 0
  ) {
    throw new Error(
      `${fieldName} deve ser um número inteiro maior que zero.`,
    )
  }

  return parsedValue
}

function normalizeBoolean(
  value: unknown,
  fieldName: string,
): boolean {
  if (
    typeof value !==
    'boolean'
  ) {
    throw new Error(
      `${fieldName} possui formato inválido.`,
    )
  }

  return value
}

function normalizePlanningStatus(
  value: unknown,
): AgendaPlanningStatus {
  if (
    typeof value !==
    'string'
  ) {
    throw new Error(
      'Status do planejamento possui formato inválido.',
    )
  }

  const normalizedValue =
    value.trim() as
      AgendaPlanningStatus

  if (
    !PLANNING_STATUSES.includes(
      normalizedValue,
    )
  ) {
    throw new Error(
      'Status do planejamento é inválido.',
    )
  }

  return normalizedValue
}

function createUpdateInput(
  body: UnknownRecord,
): UpdateAgendaPlanningInput {
  const input:
    UpdateAgendaPlanningInput = {}

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
        'Título do planejamento',
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
        10000,
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
        'Disciplina',
        180,
      )

    mutableFieldCount +=
      1
  }

  if (
    hasOwnProperty(
      body,
      'className',
    )
  ) {
    input.class_name =
      normalizeNullableText(
        body.className,
        'Turma',
        180,
      )

    mutableFieldCount +=
      1
  }

  if (
    hasOwnProperty(
      body,
      'objective',
    )
  ) {
    input.objective =
      normalizeNullableText(
        body.objective,
        'Objetivo',
        10000,
      )

    mutableFieldCount +=
      1
  }

  if (
    hasOwnProperty(
      body,
      'methodology',
    )
  ) {
    input.methodology =
      normalizeNullableText(
        body.methodology,
        'Estratégia',
        10000,
      )

    mutableFieldCount +=
      1
  }

  if (
    hasOwnProperty(
      body,
      'resources',
    )
  ) {
    input.resources =
      normalizeNullableText(
        body.resources,
        'Recursos',
        10000,
      )

    mutableFieldCount +=
      1
  }

  if (
    hasOwnProperty(
      body,
      'evaluation',
    )
  ) {
    input.evaluation =
      normalizeNullableText(
        body.evaluation,
        'Avaliação',
        10000,
      )

    mutableFieldCount +=
      1
  }

  if (
    hasOwnProperty(
      body,
      'plannedDate',
    )
  ) {
    input.planned_date =
      normalizeNullableDate(
        body.plannedDate,
        'Data do planejamento',
      )

    mutableFieldCount +=
      1
  }

  if (
    hasOwnProperty(
      body,
      'plannedStartTime',
    )
  ) {
    input.planned_start_time =
      normalizeNullableTime(
        body.plannedStartTime,
        'Horário inicial',
      )

    mutableFieldCount +=
      1
  }

  if (
    hasOwnProperty(
      body,
      'plannedEndTime',
    )
  ) {
    input.planned_end_time =
      normalizeNullableTime(
        body.plannedEndTime,
        'Horário final',
      )

    mutableFieldCount +=
      1
  }

  if (
    hasOwnProperty(
      body,
      'durationMinutes',
    )
  ) {
    input.duration_minutes =
      normalizeNullablePositiveInteger(
        body.durationMinutes,
        'Duração',
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
      normalizePlanningStatus(
        body.status,
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
      'isTemplate',
    )
  ) {
    input.is_template =
      normalizeBoolean(
        body.isTemplate,
        'Indicador de modelo',
      )

    mutableFieldCount +=
      1
  }

  if (
    hasOwnProperty(
      body,
      'templateName',
    )
  ) {
    input.template_name =
      normalizeNullableText(
        body.templateName,
        'Nome do modelo',
        240,
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
      'statusChangeReason',
    )
  ) {
    input.status_change_reason =
      normalizeNullableText(
        body.statusChangeReason,
        'Motivo da mudança de status',
        2000,
      )

    mutableFieldCount +=
      1
  }

  if (
    hasOwnProperty(
      body,
      'archiveReason',
    )
  ) {
    input.archive_reason =
      normalizeNullableText(
        body.archiveReason,
        'Motivo do arquivamento',
        2000,
      )

    mutableFieldCount +=
      1
  }

  if (
    input.status_change_reason !==
      undefined &&
    input.status ===
      undefined
  ) {
    throw new Error(
      'Informe o novo status junto com o motivo da mudança.',
    )
  }

  if (
    input.archive_reason !==
      undefined &&
    input.status !==
      'arquivado'
  ) {
    throw new Error(
      'O motivo do arquivamento somente pode ser informado com o status arquivado.',
    )
  }

  if (
    input.status ===
      'arquivado' &&
    !input.archive_reason &&
    !input.status_change_reason
  ) {
    throw new Error(
      'Motivo do arquivamento é obrigatório.',
    )
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

function normalizeDeletionReason(
  body: UnknownRecord,
): string {
  return normalizeRequiredText(
    body.reason,
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
      'não possui permissão',
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
      'já excluído',
    ) ||
    message.includes(
      'já está excluído',
    ) ||
    message.includes(
      'duplicate',
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
      'invalid',
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
      'deve ser posterior',
    ) ||
    message.includes(
      'informe '
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
  context: RouteContext,
) {
  try {
    const user =
      await requireSessionUser()

    await requirePlanningAccess(
      user.id,
    )

    const service =
      createPlanningService(
        request,
      )

    const data =
      await service
        .getOwnedById(
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
      '[AGENDA_PLANNING_DETAIL_GET_ERROR]',
      error,
    )

    return createErrorResponse(
      error,
      'Não foi possível carregar o planejamento.',
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

    await requirePlanningAccess(
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

    const service =
      createPlanningService(
        request,
      )

    const data =
      await service
        .updateOwned(
          context.params.id,
          user.id,
          input,
        )

    return NextResponse.json(
      {
        success: true,

        message:
          'Planejamento atualizado com sucesso.',

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
      '[AGENDA_PLANNING_DETAIL_PATCH_ERROR]',
      error,
    )

    return createErrorResponse(
      error,
      'Não foi possível atualizar o planejamento.',
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

    await requirePlanningAccess(
      user.id,
    )

    const body =
      await readRequestBody(
        request,
      )

    const reason =
      normalizeDeletionReason(
        body,
      )

    const service =
      createPlanningService(
        request,
      )

    const data =
      await service
        .softDeleteOwned(
          context.params.id,
          user.id,
          reason,
        )

    return NextResponse.json(
      {
        success: true,

        message:
          'Planejamento excluído logicamente com sucesso.',

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
      '[AGENDA_PLANNING_DETAIL_DELETE_ERROR]',
      error,
    )

    return createErrorResponse(
      error,
      'Não foi possível excluir o planejamento.',
    )
  }
}