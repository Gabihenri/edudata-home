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
  LessonObjectivesRepository,
  type AgendaLessonObjectiveMetadata,
  type AgendaLessonObjectiveRole,
} from '@/lib/agenda/repository/lesson-objectives.repository'

import {
  LessonObjectivesService,
  type LessonObjectiveSelection,
} from '@/lib/agenda/services/lesson-objectives.service'

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

function createLessonObjectivesService(
  request: NextRequest,
): LessonObjectivesService {
  const client =
    createAuthenticatedClient(
      getAccessToken(
        request,
      ),
    )

  const repository =
    new LessonObjectivesRepository(
      client,
    )

  return new LessonObjectivesService(
    repository,
  )
}

async function requireLessonObjectivesAccess(
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

function normalizeOptionalId(
  value: unknown,
  fieldName: string,
): string | null {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return null
  }

  return normalizeRequiredText(
    value,
    fieldName,
    36,
  )
}

function normalizeRole(
  value: unknown,
): AgendaLessonObjectiveRole {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return 'supporting'
  }

  if (
    value !== 'primary' &&
    value !== 'supporting'
  ) {
    throw new Error(
      'O papel do objetivo na aula é inválido.',
    )
  }

  return value
}

function normalizeSequence(
  value: unknown,
  fallbackValue: number,
): number {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return fallbackValue
  }

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
    ) ||
    parsedValue < 1
  ) {
    throw new Error(
      'A sequência deve ser um número inteiro maior ou igual a 1.',
    )
  }

  return parsedValue
}

function normalizeMetadata(
  value: unknown,
): AgendaLessonObjectiveMetadata {
  if (
    value === undefined ||
    value === null
  ) {
    return {}
  }

  if (!isRecord(value)) {
    throw new Error(
      'Os metadados do vínculo possuem formato inválido.',
    )
  }

  return value
}

function normalizeSelection(
  value: unknown,
  index: number,
): LessonObjectiveSelection {
  if (!isRecord(value)) {
    throw new Error(
      `O objetivo da posição ${index + 1} possui formato inválido.`,
    )
  }

  return {
    objectiveId:
      normalizeRequiredText(
        value.objectiveId,
        `ID do objetivo da posição ${index + 1}`,
        36,
      ),

    role:
      normalizeRole(
        value.role,
      ),

    sequence:
      normalizeSequence(
        value.sequence,
        index + 1,
      ),

    metadata:
      normalizeMetadata(
        value.metadata,
      ),
  }
}

function normalizeSelections(
  value: unknown,
): LessonObjectiveSelection[] {
  if (!Array.isArray(value)) {
    throw new Error(
      'A lista de objetivos possui formato inválido.',
    )
  }

  return value.map(
    (
      selection,
      index,
    ) =>
      normalizeSelection(
        selection,
        index,
      ),
  )
}

function getRemovalReason(
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
    'Motivo da remoção',
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
      'não encontrado',
    )
  ) {
    return 404
  }

  if (
    message.includes(
      'já está vinculado',
    ) ||
    message.includes(
      'já possui um objetivo principal',
    ) ||
    message.includes(
      'não pode ser vinculado mais de uma vez',
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
      'deve ser'
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

    await requireLessonObjectivesAccess(
      user.id,
    )

    const service =
      createLessonObjectivesService(
        request,
      )

    const data =
      await service
        .listObjectivesByLesson(
          context.params.id,
          user.id,
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
      '[AGENDA_LESSON_OBJECTIVES_GET_ERROR]',
      error,
    )

    return createErrorResponse(
      error,
      'Não foi possível carregar os objetivos da aula.',
    )
  }
}

export async function POST(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const user =
      await requireSessionUser()

    await requireLessonObjectivesAccess(
      user.id,
    )

    const body =
      await readRequestBody(
        request,
      )

    const service =
      createLessonObjectivesService(
        request,
      )

    const data =
      await service.link({
        lessonId:
          context.params.id,

        objectiveId:
          normalizeRequiredText(
            body.objectiveId,
            'ID do objetivo',
            36,
          ),

        role:
          normalizeRole(
            body.role,
          ),

        sequence:
          normalizeSequence(
            body.sequence,
            1,
          ),

        userId:
          user.id,

        organizationId:
          normalizeOptionalId(
            body.organizationId,
            'ID da organização',
          ),

        schoolId:
          normalizeOptionalId(
            body.schoolId,
            'ID da escola',
          ),

        metadata:
          normalizeMetadata(
            body.metadata,
          ),
      })

    return NextResponse.json(
      {
        success:
          true,

        message:
          'Objetivo vinculado à aula com sucesso.',

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
      '[AGENDA_LESSON_OBJECTIVES_POST_ERROR]',
      error,
    )

    return createErrorResponse(
      error,
      'Não foi possível vincular o objetivo à aula.',
    )
  }
}

export async function PUT(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const user =
      await requireSessionUser()

    await requireLessonObjectivesAccess(
      user.id,
    )

    const body =
      await readRequestBody(
        request,
      )

    const selections =
      normalizeSelections(
        body.objectives,
      )

    const service =
      createLessonObjectivesService(
        request,
      )

    const data =
      await service.synchronize({
        lessonId:
          context.params.id,

        objectives:
          selections,

        userId:
          user.id,

        organizationId:
          normalizeOptionalId(
            body.organizationId,
            'ID da organização',
          ),

        schoolId:
          normalizeOptionalId(
            body.schoolId,
            'ID da escola',
          ),
      })

    return NextResponse.json(
      {
        success:
          true,

        message:
          'Objetivos da aula sincronizados com sucesso.',

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
      '[AGENDA_LESSON_OBJECTIVES_PUT_ERROR]',
      error,
    )

    return createErrorResponse(
      error,
      'Não foi possível sincronizar os objetivos da aula.',
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

    await requireLessonObjectivesAccess(
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
      createLessonObjectivesService(
        request,
      )

    await service
      .removeAllFromLesson({
        lessonId:
          context.params.id,

        userId:
          user.id,

        reason:
          getRemovalReason(
            request,
            body,
          ),
      })

    return NextResponse.json(
      {
        success:
          true,

        message:
          'Objetivos removidos da aula com sucesso.',
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
      '[AGENDA_LESSON_OBJECTIVES_DELETE_ERROR]',
      error,
    )

    return createErrorResponse(
      error,
      'Não foi possível remover os objetivos da aula.',
    )
  }
}