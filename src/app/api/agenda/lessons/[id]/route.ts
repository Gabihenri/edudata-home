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
  LessonsRepository,
  type AgendaLessonMetadata,
  type AgendaLessonStatus,
} from '@/lib/agenda/repository/lessons.repository'

import {
  LessonsService,
  type CompleteAgendaLessonInput,
  type RescheduleAgendaLessonInput,
  type UpdateAgendaLessonServiceInput,
} from '@/lib/agenda/services/lessons.service'

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

type LessonPatchAction =
  | 'update'
  | 'prepare'
  | 'complete'
  | 'reschedule'
  | 'cancel'

const NO_CACHE_HEADERS = {
  'Cache-Control':
    'no-store, no-cache, must-revalidate',
}

const VALID_STATUSES:
  AgendaLessonStatus[] = [
    'planejada',
    'em_preparacao',
    'realizada',
    'parcialmente_realizada',
    'reagendada',
    'cancelada',
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

function createLessonsService(
  request: NextRequest,
): LessonsService {
  const client =
    createAuthenticatedClient(
      getAccessToken(
        request,
      ),
    )

  return new LessonsService(
    new LessonsRepository(
      client,
    ),
  )
}

async function requireLessonsAccess(
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

function normalizeOptionalText(
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

function normalizeOptionalId(
  value: unknown,
  fieldName: string,
): string | null {
  return normalizeOptionalText(
    value,
    fieldName,
    36,
  )
}

function normalizeDate(
  value: unknown,
  fieldName: string,
): string | null {
  const normalizedValue =
    normalizeOptionalText(
      value,
      fieldName,
      10,
    )

  if (!normalizedValue) {
    return null
  }

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      normalizedValue,
    )
  ) {
    throw new Error(
      `${fieldName} possui formato inválido.`,
    )
  }

  const parsedDate =
    new Date(
      `${normalizedValue}T00:00:00`,
    )

  if (
    Number.isNaN(
      parsedDate.getTime(),
    )
  ) {
    throw new Error(
      `${fieldName} é inválida.`,
    )
  }

  return normalizedValue
}

function normalizeTime(
  value: unknown,
  fieldName: string,
): string | null {
  const normalizedValue =
    normalizeOptionalText(
      value,
      fieldName,
      8,
    )

  if (!normalizedValue) {
    return null
  }

  if (
    !/^\d{2}:\d{2}(:\d{2})?$/.test(
      normalizedValue,
    )
  ) {
    throw new Error(
      `${fieldName} possui formato inválido.`,
    )
  }

  return normalizedValue
}

function normalizeDateTime(
  value: unknown,
  fieldName: string,
): string | null {
  const normalizedValue =
    normalizeOptionalText(
      value,
      fieldName,
      50,
    )

  if (!normalizedValue) {
    return null
  }

  const parsedValue =
    new Date(
      normalizedValue,
    )

  if (
    Number.isNaN(
      parsedValue.getTime(),
    )
  ) {
    throw new Error(
      `${fieldName} possui formato inválido.`,
    )
  }

  return parsedValue
    .toISOString()
}

function normalizeStatus(
  value: unknown,
): AgendaLessonStatus {
  if (
    typeof value !==
    'string' ||
    !VALID_STATUSES.includes(
      value as AgendaLessonStatus,
    )
  ) {
    throw new Error(
      'O status da aula é inválido.',
    )
  }

  return value as
    AgendaLessonStatus
}

function normalizeSkills(
  value: unknown,
): string[] {
  if (!Array.isArray(value)) {
    throw new Error(
      'A lista de habilidades possui formato inválido.',
    )
  }

  const skills =
    value.map(
      (
        skill,
        index,
      ) => {
        if (
          typeof skill !==
          'string'
        ) {
          throw new Error(
            `A habilidade da posição ${index + 1} possui formato inválido.`,
          )
        }

        return skill.trim()
      },
    )
      .filter(Boolean)

  return Array.from(
    new Set(
      skills,
    ),
  )
}

function normalizeMetadata(
  value: unknown,
): AgendaLessonMetadata {
  if (!isRecord(value)) {
    throw new Error(
      'Os metadados da aula possuem formato inválido.',
    )
  }

  return value
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

function validateTimeRange(
  startTime: string | null,
  endTime: string | null,
): void {
  if (
    !startTime ||
    !endTime
  ) {
    return
  }

  if (
    endTime <=
    startTime
  ) {
    throw new Error(
      'O horário final deve ser posterior ao horário inicial.',
    )
  }
}

function normalizePatchAction(
  value: unknown,
): LessonPatchAction {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return 'update'
  }

  if (
    value !== 'update' &&
    value !== 'prepare' &&
    value !== 'complete' &&
    value !== 'reschedule' &&
    value !== 'cancel'
  ) {
    throw new Error(
      'A ação solicitada para a aula é inválida.',
    )
  }

  return value
}

function createUpdateInput(
  body: UnknownRecord,
): UpdateAgendaLessonServiceInput {
  const input:
    UpdateAgendaLessonServiceInput = {}

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
        'Título da aula',
        240,
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
      normalizeOptionalId(
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
      normalizeOptionalText(
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
      'scheduledDate',
    )
  ) {
    input.scheduled_date =
      normalizeDate(
        body.scheduledDate,
        'Data da aula',
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
      normalizeTime(
        body.startTime,
        'Horário inicial',
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
      normalizeTime(
        body.endTime,
        'Horário final',
      )

    mutableFieldCount +=
      1
  }

  validateTimeRange(
    input.start_time ??
      null,

    input.end_time ??
      null,
  )

  if (
    hasOwnProperty(
      body,
      'planningId',
    )
  ) {
    input.planning_id =
      normalizeOptionalId(
        body.planningId,
        'ID do planejamento',
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
      normalizeOptionalId(
        body.academicPeriodId,
        'ID do período acadêmico',
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
      normalizeOptionalText(
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
      'skills',
    )
  ) {
    input.skills =
      normalizeSkills(
        body.skills,
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
      normalizeOptionalText(
        body.resources,
        'Recursos',
        5000,
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
      normalizeOptionalText(
        body.methodology,
        'Metodologia',
        5000,
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
      'observations',
    )
  ) {
    input.observations =
      normalizeOptionalText(
        body.observations,
        'Observações',
        5000,
      )

    mutableFieldCount +=
      1
  }

  if (
    hasOwnProperty(
      body,
      'nextAction',
    )
  ) {
    input.next_action =
      normalizeOptionalText(
        body.nextAction,
        'Próxima ação',
        3000,
      )

    mutableFieldCount +=
      1
  }

  if (
    hasOwnProperty(
      body,
      'organizationId',
    )
  ) {
    input.organization_id =
      normalizeOptionalId(
        body.organizationId,
        'ID da organização',
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
      normalizeOptionalId(
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
    mutableFieldCount ===
    0
  ) {
    throw new Error(
      'Nenhum campo válido foi informado para atualizar a aula.',
    )
  }

  return input
}

function createCompleteInput(
  body: UnknownRecord,
): CompleteAgendaLessonInput {
  return {
    actualStartAt:
      hasOwnProperty(
        body,
        'actualStartAt',
      )
        ? normalizeDateTime(
            body.actualStartAt,
            'Início real da aula',
          )
        : null,

    actualEndAt:
      hasOwnProperty(
        body,
        'actualEndAt',
      )
        ? normalizeDateTime(
            body.actualEndAt,
            'Término real da aula',
          )
        : null,

    observations:
      hasOwnProperty(
        body,
        'observations',
      )
        ? normalizeOptionalText(
            body.observations,
            'Observações',
            5000,
          )
        : null,

    nextAction:
      hasOwnProperty(
        body,
        'nextAction',
      )
        ? normalizeOptionalText(
            body.nextAction,
            'Próxima ação',
            3000,
          )
        : null,

    partiallyCompleted:
      hasOwnProperty(
        body,
        'partiallyCompleted',
      )
        ? normalizeBoolean(
            body.partiallyCompleted,
            'Indicador de realização parcial',
          )
        : false,
  }
}

function createRescheduleInput(
  body: UnknownRecord,
): RescheduleAgendaLessonInput {
  const startTime =
    hasOwnProperty(
      body,
      'startTime',
    )
      ? normalizeTime(
          body.startTime,
          'Novo horário inicial',
        )
      : null

  const endTime =
    hasOwnProperty(
      body,
      'endTime',
    )
      ? normalizeTime(
          body.endTime,
          'Novo horário final',
        )
      : null

  validateTimeRange(
    startTime,
    endTime,
  )

  const scheduledDate =
    normalizeDate(
      body.scheduledDate,
      'Nova data da aula',
    )

  if (!scheduledDate) {
    throw new Error(
      'A nova data da aula é obrigatória.',
    )
  }

  return {
    scheduledDate,

    startTime,
    endTime,

    reason:
      normalizeRequiredText(
        body.reason,
        'Motivo do reagendamento',
        2000,
      ),
  }
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
      'não pertence ao usuário',
    ) ||
    message.includes(
      'forbidden',
    )
  ) {
    return 403
  }

  if (
    message.includes(
      'não encontrada',
    )
  ) {
    return 404
  }

  if (
    message.includes(
      'já realizada',
    ) ||
    message.includes(
      'já está cancelada',
    ) ||
    message.includes(
      'aula cancelada',
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
      'formato',
    ) ||
    message.includes(
      'não pode',
    ) ||
    message.includes(
      'deve ser',
    ) ||
    message.includes(
      'posterior',
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
        status:
          403,

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
      success:
        false,

      error:
        message,
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

    await requireLessonsAccess(
      user.id,
    )

    const service =
      createLessonsService(
        request,
      )

    const data =
      await service.getById(
        context.params.id,
        user.id,
      )

    return NextResponse.json(
      {
        success:
          true,

        data,
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
      '[AGENDA_LESSON_GET_ERROR]',
      error,
    )

    return createErrorResponse(
      error,
      'Não foi possível carregar a aula.',
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

    await requireLessonsAccess(
      user.id,
    )

    const body =
      await readRequestBody(
        request,
      )

    const action =
      normalizePatchAction(
        body.action,
      )

    const service =
      createLessonsService(
        request,
      )

    const actorContext = {
      actorUserId:
        user.id,

      organizationId:
        hasOwnProperty(
          body,
          'organizationId',
        )
          ? normalizeOptionalId(
              body.organizationId,
              'ID da organização',
            )
          : null,

      schoolId:
        hasOwnProperty(
          body,
          'schoolId',
        )
          ? normalizeOptionalId(
              body.schoolId,
              'ID da escola',
            )
          : null,
    }

    if (
      action ===
      'prepare'
    ) {
      const data =
        await service
          .markAsPreparing(
            context.params.id,
            actorContext,
          )

      return NextResponse.json(
        {
          success:
            true,

          message:
            'Aula colocada em preparação com sucesso.',

          data,
        },
        {
          status:
            200,

          headers:
            NO_CACHE_HEADERS,
        },
      )
    }

    if (
      action ===
      'complete'
    ) {
      const data =
        await service.complete(
          context.params.id,

          createCompleteInput(
            body,
          ),

          actorContext,
        )

      return NextResponse.json(
        {
          success:
            true,

          message:
            data.status ===
            'parcialmente_realizada'
              ? 'Aula registrada como parcialmente realizada.'
              : 'Aula registrada como realizada com sucesso.',

          data,
        },
        {
          status:
            200,

          headers:
            NO_CACHE_HEADERS,
        },
      )
    }

    if (
      action ===
      'reschedule'
    ) {
      const data =
        await service.reschedule(
          context.params.id,

          createRescheduleInput(
            body,
          ),

          actorContext,
        )

      return NextResponse.json(
        {
          success:
            true,

          message:
            'Aula reagendada com sucesso.',

          data,
        },
        {
          status:
            200,

          headers:
            NO_CACHE_HEADERS,
        },
      )
    }

    if (
      action ===
      'cancel'
    ) {
      const data =
        await service.cancel(
          context.params.id,

          {
            reason:
              normalizeRequiredText(
                body.reason,
                'Motivo do cancelamento',
                2000,
              ),
          },

          actorContext,
        )

      return NextResponse.json(
        {
          success:
            true,

          message:
            'Aula cancelada com sucesso.',

          data,
        },
        {
          status:
            200,

          headers:
            NO_CACHE_HEADERS,
        },
      )
    }

    const data =
      await service.update(
        context.params.id,

        createUpdateInput(
          body,
        ),

        actorContext,
      )

    return NextResponse.json(
      {
        success:
          true,

        message:
          'Aula atualizada com sucesso.',

        data,
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
      '[AGENDA_LESSON_PATCH_ERROR]',
      error,
    )

    return createErrorResponse(
      error,
      'Não foi possível atualizar a aula.',
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

    await requireLessonsAccess(
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

    const service =
      createLessonsService(
        request,
      )

    await service.remove(
      context.params.id,

      {
        reason:
          getDeletionReason(
            request,
            body,
          ),
      },

      {
        actorUserId:
          user.id,
      },
    )

    return NextResponse.json(
      {
        success:
          true,

        message:
          'Aula excluída com sucesso.',
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
      '[AGENDA_LESSON_DELETE_ERROR]',
      error,
    )

    return createErrorResponse(
      error,
      'Não foi possível excluir a aula.',
    )
  }
}