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
  type AgendaLessonQueryOptions,
  type AgendaLessonStatus,
} from '@/lib/agenda/repository/lessons.repository'

import {
  LessonsService,
  type CreateAgendaLessonServiceInput,
} from '@/lib/agenda/services/lessons.service'

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

  const repository =
    new LessonsRepository(
      client,
    )

  return new LessonsService(
    repository,
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

function normalizeStatus(
  value: unknown,
): AgendaLessonStatus {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return 'planejada'
  }

  if (
    typeof value !==
    'string' ||
    !VALID_STATUSES.includes(
      value as
        AgendaLessonStatus,
    )
  ) {
    throw new Error(
      'O status da aula é inválido.',
    )
  }

  return value as
    AgendaLessonStatus
}

function normalizeStatuses(
  value: string | null,
): AgendaLessonStatus[] | undefined {
  if (!value?.trim()) {
    return undefined
  }

  const statuses =
    value
      .split(',')
      .map(
        status =>
          status.trim(),
      )
      .filter(Boolean)

  const invalidStatus =
    statuses.find(
      status =>
        !VALID_STATUSES.includes(
          status as
            AgendaLessonStatus,
        ),
    )

  if (invalidStatus) {
    throw new Error(
      `O status "${invalidStatus}" é inválido.`,
    )
  }

  return statuses as
    AgendaLessonStatus[]
}

function normalizeSkills(
  value: unknown,
): string[] {
  if (
    value === undefined ||
    value === null
  ) {
    return []
  }

  if (!Array.isArray(value)) {
    throw new Error(
      'A lista de habilidades possui formato inválido.',
    )
  }

  const normalizedSkills =
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
      normalizedSkills,
    ),
  )
}

function normalizeMetadata(
  value: unknown,
): AgendaLessonMetadata {
  if (
    value === undefined ||
    value === null
  ) {
    return {}
  }

  if (!isRecord(value)) {
    throw new Error(
      'Os metadados da aula possuem formato inválido.',
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

function createLessonInput(
  body: UnknownRecord,
): CreateAgendaLessonServiceInput {
  const startTime =
    normalizeTime(
      body.startTime,
      'Horário inicial',
    )

  const endTime =
    normalizeTime(
      body.endTime,
      'Horário final',
    )

  validateTimeRange(
    startTime,
    endTime,
  )

  return {
    title:
      normalizeRequiredText(
        body.title,
        'Título da aula',
        240,
      ),

    class_id:
      normalizeOptionalId(
        body.classId,
        'ID da turma',
      ),

    subject:
      normalizeOptionalText(
        body.subject,
        'Componente curricular',
        250,
      ),

    scheduled_date:
      normalizeDate(
        body.scheduledDate,
        'Data da aula',
      ),

    start_time:
      startTime,

    end_time:
      endTime,

    planning_id:
      normalizeOptionalId(
        body.planningId,
        'ID do planejamento',
      ),

    academic_period_id:
      normalizeOptionalId(
        body.academicPeriodId,
        'ID do período acadêmico',
      ),

    description:
      normalizeOptionalText(
        body.description,
        'Descrição',
        5000,
      ),

    skills:
      normalizeSkills(
        body.skills,
      ),

    resources:
      normalizeOptionalText(
        body.resources,
        'Recursos',
        5000,
      ),

    methodology:
      normalizeOptionalText(
        body.methodology,
        'Metodologia',
        5000,
      ),

    status:
      normalizeStatus(
        body.status,
      ),

    observations:
      normalizeOptionalText(
        body.observations,
        'Observações',
        5000,
      ),

    next_action:
      normalizeOptionalText(
        body.nextAction,
        'Próxima ação',
        3000,
      ),

    organization_id:
      normalizeOptionalId(
        body.organizationId,
        'ID da organização',
      ),

    school_id:
      normalizeOptionalId(
        body.schoolId,
        'ID da escola',
      ),

    metadata:
      normalizeMetadata(
        body.metadata,
      ),
  }
}

function createQueryOptions(
  request: NextRequest,
): AgendaLessonQueryOptions {
  const searchParams =
    request.nextUrl
      .searchParams

  return {
    includeDeleted:
      searchParams.get(
        'includeDeleted',
      ) === 'true',

    organizationId:
      searchParams.get(
        'organizationId',
      ),

    schoolId:
      searchParams.get(
        'schoolId',
      ),

    classId:
      searchParams.get(
        'classId',
      ),

    planningId:
      searchParams.get(
        'planningId',
      ),

    academicPeriodId:
      searchParams.get(
        'academicPeriodId',
      ),

    status:
      searchParams.get(
        'status',
      ) as
        AgendaLessonStatus |
        null,

    statuses:
      normalizeStatuses(
        searchParams.get(
          'statuses',
        ),
      ),

    subject:
      searchParams.get(
        'subject',
      ),

    scheduledDateFrom:
      searchParams.get(
        'scheduledDateFrom',
      ),

    scheduledDateTo:
      searchParams.get(
        'scheduledDateTo',
      ),

    search:
      searchParams.get(
        'search',
      ),
  }
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
      'posterior',
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

    const options =
      createQueryOptions(
        request,
      )

    if (
      options.status &&
      !VALID_STATUSES.includes(
        options.status,
      )
    ) {
      throw new Error(
        'O status informado é inválido.',
      )
    }

    const data =
      await service.list(
        user.id,
        options,
      )

    return NextResponse.json(
      {
        success:
          true,

        total:
          data.length,

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
      '[AGENDA_LESSONS_GET_ERROR]',
      error,
    )

    return createErrorResponse(
      error,
      'Não foi possível carregar as aulas.',
    )
  }
}

export async function POST(
  request: NextRequest,
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

    const service =
      createLessonsService(
        request,
      )

    const data =
      await service.create(
        createLessonInput(
          body,
        ),
        {
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
        },
      )

    return NextResponse.json(
      {
        success:
          true,

        message:
          'Aula criada com sucesso.',

        data,
      },
      {
        status:
          201,

        headers:
          NO_CACHE_HEADERS,
      },
    )
  } catch (error) {
    console.error(
      '[AGENDA_LESSONS_POST_ERROR]',
      error,
    )

    return createErrorResponse(
      error,
      'Não foi possível criar a aula.',
    )
  }
}