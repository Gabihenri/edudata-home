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
  type CreateAgendaPlanningInput,
} from '@/lib/agenda/repository/planning.repository'

import {
  PlanningService,
} from '@/lib/agenda/services/planning.service'

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
    value === undefined ||
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

function normalizeNullablePositiveInteger(
  value: unknown,
  fieldName: string,
): number | null {
  if (
    value === null ||
    value === undefined ||
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
  defaultValue: boolean,
): boolean {
  if (
    value === undefined ||
    value === null
  ) {
    return defaultValue
  }

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
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return 'rascunho'
  }

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

function createPlanningInput(
  body: UnknownRecord,
): CreateAgendaPlanningInput {
  const input:
    CreateAgendaPlanningInput = {
      title:
        normalizeRequiredText(
          body.title,
          'Título do planejamento',
          240,
        ),

      description:
        normalizeNullableText(
          body.description,
          'Descrição',
          10000,
        ),

      subject:
        normalizeNullableText(
          body.subject,
          'Disciplina',
          180,
        ),

      class_name:
        normalizeNullableText(
          body.className,
          'Turma',
          180,
        ),

      objective:
        normalizeNullableText(
          body.objective,
          'Objetivo',
          10000,
        ),

      methodology:
        normalizeNullableText(
          body.methodology,
          'Estratégia',
          10000,
        ),

      resources:
        normalizeNullableText(
          body.resources,
          'Recursos',
          10000,
        ),

      evaluation:
        normalizeNullableText(
          body.evaluation,
          'Avaliação',
          10000,
        ),

      planned_date:
        normalizeNullableText(
          body.plannedDate,
          'Data do planejamento',
          10,
        ),

      planned_start_time:
        normalizeNullableText(
          body.plannedStartTime,
          'Horário inicial',
          8,
        ),

      planned_end_time:
        normalizeNullableText(
          body.plannedEndTime,
          'Horário final',
          8,
        ),

      duration_minutes:
        normalizeNullablePositiveInteger(
          body.durationMinutes,
          'Duração',
        ),

      status:
        normalizePlanningStatus(
          body.status,
        ),

      class_id:
        normalizeNullableId(
          body.classId,
          'ID da turma',
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

      is_template:
        normalizeBoolean(
          body.isTemplate,
          'Indicador de modelo',
          false,
        ),

      template_name:
        normalizeNullableText(
          body.templateName,
          'Nome do modelo',
          240,
        ),

      school_id:
        normalizeNullableId(
          body.schoolId,
          'ID da escola',
        ),
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

    const service =
      createPlanningService(
        request,
      )

    const data =
      await service
        .listByUserId(
          user.id,
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
      '[AGENDA_PLANNING_GET_ERROR]',
      error,
    )

    return createErrorResponse(
      error,
      'Não foi possível carregar os planejamentos.',
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
      createPlanningInput(
        body,
      )

    /*
     * O proprietário é definido no servidor.
     * user_id, organization_id e campos de
     * auditoria não são aceitos do navegador.
     */
    const service =
      createPlanningService(
        request,
      )

    const data =
      await service
        .createOwned(
          user.id,
          input,
        )

    return NextResponse.json(
      {
        success: true,

        message:
          'Planejamento criado com sucesso.',

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
      '[AGENDA_PLANNING_POST_ERROR]',
      error,
    )

    return createErrorResponse(
      error,
      'Não foi possível criar o planejamento.',
    )
  }
}