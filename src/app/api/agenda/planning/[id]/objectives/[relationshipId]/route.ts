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
  PlanningObjectivesRepository,
  type AgendaPlanningObjectiveMetadata,
  type AgendaPlanningObjectiveRole,
} from '@/lib/agenda/repository/planning-objectives.repository'

import {
  PlanningObjectivesService,
  type UpdatePlanningObjectiveLinkInput,
} from '@/lib/agenda/services/planning-objectives.service'

import {
  requireSessionUser,
} from '@/lib/auth/session'

export const dynamic =
  'force-dynamic'

type RouteContext = {
  params: {
    id: string
    relationshipId: string
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

function createPlanningObjectivesService(
  request: NextRequest,
): PlanningObjectivesService {
  const client =
    createAuthenticatedClient(
      getAccessToken(
        request,
      ),
    )

  const repository =
    new PlanningObjectivesRepository(
      client,
    )

  return new PlanningObjectivesService(
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
): AgendaPlanningObjectiveRole {
  if (
    value !== 'primary' &&
    value !== 'supporting'
  ) {
    throw new Error(
      'O papel do objetivo no planejamento é inválido.',
    )
  }

  return value
}

function normalizeSequence(
  value: unknown,
): number {
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
): AgendaPlanningObjectiveMetadata {
  if (!isRecord(value)) {
    throw new Error(
      'Os metadados do vínculo possuem formato inválido.',
    )
  }

  return value
}

function createUpdateInput(
  body: UnknownRecord,
): UpdatePlanningObjectiveLinkInput {
  const input:
    UpdatePlanningObjectiveLinkInput = {}

  let mutableFieldCount =
    0

  if (
    hasOwnProperty(
      body,
      'role',
    )
  ) {
    input.role =
      normalizeRole(
        body.role,
      )

    mutableFieldCount +=
      1
  }

  if (
    hasOwnProperty(
      body,
      'sequence',
    )
  ) {
    input.sequence =
      normalizeSequence(
        body.sequence,
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
    input.organizationId =
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
    input.schoolId =
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
      'Nenhum campo válido foi informado para atualizar o vínculo.',
    )
  }

  return input
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

function validatePlanningRelationship(
  planningId: string,
  relationshipPlanningId: string,
): void {
  if (
    planningId !==
    relationshipPlanningId
  ) {
    throw new Error(
      'O vínculo informado não pertence ao planejamento solicitado.',
    )
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
      'não pertence ao planejamento',
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
      'já possui um objetivo principal',
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

    await requirePlanningAccess(
      user.id,
    )

    const service =
      createPlanningObjectivesService(
        request,
      )

    const data =
      await service.getById(
        context.params
          .relationshipId,

        user.id,
      )

    validatePlanningRelationship(
      context.params.id,
      data.planning_id,
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
      '[AGENDA_PLANNING_OBJECTIVE_RELATIONSHIP_GET_ERROR]',
      error,
    )

    return createErrorResponse(
      error,
      'Não foi possível carregar o vínculo entre planejamento e objetivo.',
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

    const service =
      createPlanningObjectivesService(
        request,
      )

    const currentRelationship =
      await service.getById(
        context.params
          .relationshipId,

        user.id,
      )

    validatePlanningRelationship(
      context.params.id,
      currentRelationship
        .planning_id,
    )

    const data =
      await service.update(
        currentRelationship.id,

        createUpdateInput(
          body,
        ),

        user.id,
      )

    return NextResponse.json(
      {
        success:
          true,

        message:
          'Vínculo entre planejamento e objetivo atualizado com sucesso.',

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
      '[AGENDA_PLANNING_OBJECTIVE_RELATIONSHIP_PATCH_ERROR]',
      error,
    )

    return createErrorResponse(
      error,
      'Não foi possível atualizar o vínculo entre planejamento e objetivo.',
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
      createPlanningObjectivesService(
        request,
      )

    const currentRelationship =
      await service.getById(
        context.params
          .relationshipId,

        user.id,
      )

    validatePlanningRelationship(
      context.params.id,
      currentRelationship
        .planning_id,
    )

    await service.remove({
      relationshipId:
        currentRelationship.id,

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
          'Objetivo removido do planejamento com sucesso.',
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
      '[AGENDA_PLANNING_OBJECTIVE_RELATIONSHIP_DELETE_ERROR]',
      error,
    )

    return createErrorResponse(
      error,
      'Não foi possível remover o objetivo do planejamento.',
    )
  }
}