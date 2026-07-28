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
  requireSessionUser,
} from '@/lib/auth/session'

export const dynamic =
  'force-dynamic'

export const runtime =
  'nodejs'

type UnknownRecord =
  Record<string, unknown>

type OperationalRecord =
  Record<string, unknown>

type SupabaseCollectionResult = {
  data:
    | OperationalRecord[]
    | null

  error: {
    message: string
  } | null
}

type IntelligenceBackendResponse = {
  success?: boolean

  message?: string

  data?: {
    generated_at?: string

    module?: string

    contract_version?: string

    engine?: UnknownRecord
  }

  detail?: string
}

const NO_CACHE_HEADERS = {
  'Cache-Control':
    'no-store, no-cache, must-revalidate',
}

const REQUEST_TIMEOUT_MS =
  30_000

const MAX_RECORDS_PER_COLLECTION =
  5000

const PLANNING_SELECT = [
  'id',
  'title',
  'description',
  'subject',
  'class_name',
  'objective',
  'methodology',
  'planned_date',
  'status',
  'class_id',
  'school_year_id',
  'academic_period_id',
  'school_id',
  'organization_id',
  'user_id',
  'created_at',
  'updated_at',
].join(',')

const OBJECTIVES_SELECT = [
  'id',
  'title',
  'description',
  'category',
  'period',
  'class_id',
  'subject',
  'responsible_user_id',
  'expected_indicator',
  'expected_evidence',
  'start_date',
  'end_date',
  'school_year_id',
  'academic_period_id',
  'status',
  'progress',
  'user_id',
  'organization_id',
  'school_id',
  'created_at',
  'updated_at',
].join(',')

const LESSONS_SELECT = [
  'id',
  'title',
  'description',
  'subject',
  'status',
  'scheduled_date',
  'start_time',
  'end_time',
  'planning_id',
  'class_id',
  'academic_period_id',
  'organization_id',
  'school_id',
  'user_id',
  'created_at',
  'updated_at',
].join(',')

const EVIDENCES_SELECT = [
  'id',
  'title',
  'evidence_type',
  'lesson_id',
  'planning_id',
  'objective_id',
  'class_id',
  'academic_period_id',
  'organization_id',
  'school_id',
  'user_id',
  'contains_identifiable_minor',
  'storage_bucket',
  'storage_path',
  'created_at',
  'updated_at',
].join(',')

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

  if (
    !url ||
    !anonKey
  ) {
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

function getIntelligenceBackendUrl():
  string {
  const baseUrl =
    process.env
      .EDI_BACKEND_URL ??
    process.env
      .BACKEND_API_URL ??
    process.env
      .NEXT_PUBLIC_API_URL

  if (
    !baseUrl?.trim()
  ) {
    throw new Error(
      'A URL do backend EIOS não está configurada.',
    )
  }

  const normalizedBaseUrl =
    baseUrl
      .trim()
      .replace(
        /\/+$/,
        '',
      )

  return (
    `${normalizedBaseUrl}` +
    '/api/v1/intelligence/agenda'
  )
}

function isRecord(
  value: unknown,
): value is UnknownRecord {
  return (
    typeof value ===
      'object' &&
    value !== null &&
    !Array.isArray(
      value,
    )
  )
}

function normalizeOptionalText(
  value: unknown,
): string | null {
  if (
    typeof value !==
    'string'
  ) {
    return null
  }

  const normalizedValue =
    value.trim()

  return (
    normalizedValue ||
    null
  )
}

function limitCollection(
  collection:
    OperationalRecord[],
  collectionName: string,
): OperationalRecord[] {
  if (
    collection.length >
    MAX_RECORDS_PER_COLLECTION
  ) {
    throw new Error(
      `A coleção ${collectionName} ultrapassou o limite operacional permitido.`,
    )
  }

  return collection
}

function unwrapCollection(
  result:
    SupabaseCollectionResult,

  collectionName: string,
): OperationalRecord[] {
  if (
    result.error
  ) {
    throw new Error(
      `Não foi possível carregar ${collectionName}: ${result.error.message}`,
    )
  }

  return limitCollection(
    result.data ??
    [],
    collectionName,
  )
}

async function requireIntelligenceAccess(
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

async function loadPlanning(
  client: SupabaseClient,
  userId: string,
): Promise<
  SupabaseCollectionResult
> {
  const {
    data,
    error,
  } = await client
    .from(
      'agenda_planning',
    )
    .select(
      PLANNING_SELECT,
    )
    .eq(
      'user_id',
      userId,
    )
    .is(
      'deleted_at',
      null,
    )
    .order(
      'updated_at',
      {
        ascending:
          false,
      },
    )
    .limit(
      MAX_RECORDS_PER_COLLECTION,
    )

  return {
    data:
      data as
        OperationalRecord[] |
        null,

    error,
  }
}

async function loadObjectives(
  client: SupabaseClient,
  userId: string,
): Promise<
  SupabaseCollectionResult
> {
  const {
    data,
    error,
  } = await client
    .from(
      'agenda_objectives',
    )
    .select(
      OBJECTIVES_SELECT,
    )
    .eq(
      'user_id',
      userId,
    )
    .is(
      'deleted_at',
      null,
    )
    .order(
      'updated_at',
      {
        ascending:
          false,
      },
    )
    .limit(
      MAX_RECORDS_PER_COLLECTION,
    )

  return {
    data:
      data as
        OperationalRecord[] |
        null,

    error,
  }
}

async function loadLessons(
  client: SupabaseClient,
  userId: string,
): Promise<
  SupabaseCollectionResult
> {
  const {
    data,
    error,
  } = await client
    .from(
      'agenda_lessons',
    )
    .select(
      LESSONS_SELECT,
    )
    .eq(
      'user_id',
      userId,
    )
    .is(
      'deleted_at',
      null,
    )
    .order(
      'updated_at',
      {
        ascending:
          false,
      },
    )
    .limit(
      MAX_RECORDS_PER_COLLECTION,
    )

  return {
    data:
      data as
        OperationalRecord[] |
        null,

    error,
  }
}

async function loadEvidences(
  client: SupabaseClient,
  userId: string,
): Promise<
  SupabaseCollectionResult
> {
  const {
    data,
    error,
  } = await client
    .from(
      'agenda_evidences',
    )
    .select(
      EVIDENCES_SELECT,
    )
    .eq(
      'user_id',
      userId,
    )
    .is(
      'deleted_at',
      null,
    )
    .order(
      'updated_at',
      {
        ascending:
          false,
      },
    )
    .limit(
      MAX_RECORDS_PER_COLLECTION,
    )

  return {
    data:
      data as
        OperationalRecord[] |
        null,

    error,
  }
}

function inferContext(
  userId: string,

  collections: {
    planning:
      OperationalRecord[]

    objectives:
      OperationalRecord[]

    lessons:
      OperationalRecord[]

    evidences:
      OperationalRecord[]
  },
): UnknownRecord {
  const allRecords = [
    ...collections.planning,
    ...collections.objectives,
    ...collections.lessons,
    ...collections.evidences,
  ]

  const organizationId =
    allRecords
      .map(
        record =>
          normalizeOptionalText(
            record
              .organization_id,
          ),
      )
      .find(Boolean) ??
    null

  const schoolId =
    allRecords
      .map(
        record =>
          normalizeOptionalText(
            record
              .school_id,
          ),
      )
      .find(Boolean) ??
    null

  return {
    user_id:
      userId,

    organization_id:
      organizationId,

    school_id:
      schoolId,

    role:
      null,

    metadata: {
      source:
        'next-agenda-intelligence-route',

      scope:
        'authenticated-user',

      rls_applied:
        true,

      contract_version:
        'agenda-operational-v1',
    },
  }
}

async function callIntelligenceBackend(
  payload: UnknownRecord,
): Promise<
  IntelligenceBackendResponse
> {
  const controller =
    new AbortController()

  const timeoutId =
    setTimeout(
      () => {
        controller.abort()
      },
      REQUEST_TIMEOUT_MS,
    )

  try {
    const response =
      await fetch(
        getIntelligenceBackendUrl(),
        {
          method:
            'POST',

          headers: {
            Accept:
              'application/json',

            'Content-Type':
              'application/json',
          },

          body:
            JSON.stringify(
              payload,
            ),

          cache:
            'no-store',

          signal:
            controller.signal,
        },
      )

    let responseBody:
      unknown

    try {
      responseBody =
        await response.json()
    } catch {
      responseBody =
        null
    }

    const parsedBody =
      isRecord(
        responseBody,
      )
        ? responseBody as
          IntelligenceBackendResponse
        : {}

    if (
      !response.ok
    ) {
      const errorMessage =
        normalizeOptionalText(
          parsedBody.detail,
        ) ??
        normalizeOptionalText(
          parsedBody.message,
        ) ??
        'O EDI Intelligence Engine não conseguiu processar os dados.'

      throw new Error(
        errorMessage,
      )
    }

    return parsedBody
  } catch (
    error
  ) {
    if (
      error instanceof
        Error &&
      error.name ===
        'AbortError'
    ) {
      throw new Error(
        'O EDI Intelligence Engine excedeu o tempo máximo de resposta.',
      )
    }

    throw error
  } finally {
    clearTimeout(
      timeoutId,
    )
  }
}

function buildSuccessResponse(
  backendResponse:
    IntelligenceBackendResponse,
): NextResponse {
  const backendData =
    isRecord(
      backendResponse.data,
    )
      ? backendResponse.data
      : {}

  const engine =
    isRecord(
      backendData.engine,
    )
      ? backendData.engine
      : {}

  return NextResponse.json(
    {
      success:
        true,

      generated_at:
        normalizeOptionalText(
          backendData
            .generated_at,
        ) ??
        new Date()
          .toISOString(),

      module:
        normalizeOptionalText(
          backendData.module,
        ) ??
        'agenda',

      contract_version:
        normalizeOptionalText(
          backendData
            .contract_version,
        ) ??
        'agenda-operational-v1',

      context:
        isRecord(
          engine.context,
        )
          ? engine.context
          : {},

      contract:
        isRecord(
          engine.contract,
        )
          ? engine.contract
          : {},

      profile:
        isRecord(
          engine.profile,
        )
          ? engine.profile
          : {},

      analytics:
        isRecord(
          engine.analytics,
        )
          ? engine.analytics
          : {},

      insights:
        isRecord(
          engine.insights,
        )
          ? engine.insights
          : {},

      recommendations:
        isRecord(
          engine
            .recommendations,
        )
          ? engine
              .recommendations
          : {},

      learning:
        isRecord(
          engine.learning,
        )
          ? engine.learning
          : {},
    },
    {
      status:
        200,

      headers:
        NO_CACHE_HEADERS,
    },
  )
}

function buildErrorResponse(
  error: unknown,
): NextResponse {
  if (
    isAccessDeniedError(
      error,
    )
  ) {
    const serializedError =
      serializeAccessDeniedError(
        error,
      )

    return NextResponse.json(
      serializedError,
      {
        status:
          403,

        headers:
          NO_CACHE_HEADERS,
      },
    )
  }

  const message =
    error instanceof
      Error
      ? error.message
      : 'Não foi possível processar a inteligência da Agenda.'

  const normalizedMessage =
    message.toLowerCase()

  if (
    normalizedMessage
      .includes(
        'não autenticado',
      )
  ) {
    return NextResponse.json(
      {
        success:
          false,

        error:
          'Usuário não autenticado.',
      },
      {
        status:
          401,

        headers:
          NO_CACHE_HEADERS,
      },
    )
  }

  if (
    normalizedMessage
      .includes(
        'não está configurada',
      ) ||
    normalizedMessage
      .includes(
        'não configuradas',
      )
  ) {
    return NextResponse.json(
      {
        success:
          false,

        error:
          message,
      },
      {
        status:
          503,

        headers:
          NO_CACHE_HEADERS,
      },
    )
  }

  return NextResponse.json(
    {
      success:
        false,

      error:
        message,
    },
    {
      status:
        500,

      headers:
        NO_CACHE_HEADERS,
    },
  )
}

export async function GET(
  request: NextRequest,
): Promise<NextResponse> {
  try {
    const user =
      await requireSessionUser()

    await requireIntelligenceAccess(
      user.id,
    )

    const client =
      createAuthenticatedClient(
        getAccessToken(
          request,
        ),
      )

    const [
      planningResult,
      objectivesResult,
      lessonsResult,
      evidencesResult,
    ] = await Promise.all([
      loadPlanning(
        client,
        user.id,
      ),

      loadObjectives(
        client,
        user.id,
      ),

      loadLessons(
        client,
        user.id,
      ),

      loadEvidences(
        client,
        user.id,
      ),
    ])

    const planning =
      unwrapCollection(
        planningResult,
        'os planejamentos',
      )

    const objectives =
      unwrapCollection(
        objectivesResult,
        'os objetivos',
      )

    const lessons =
      unwrapCollection(
        lessonsResult,
        'as aulas',
      )

    const evidences =
      unwrapCollection(
        evidencesResult,
        'as evidências',
      )

    const collections = {
      planning,
      objectives,
      lessons,
      evidences,
    }

    const payload: UnknownRecord = {
      context:
        inferContext(
          user.id,
          collections,
        ),

      planning,
      objectives,
      lessons,
      evidences,

      interactions:
        [],

      accepted_recommendations:
        0,
    }

    const backendResponse =
      await callIntelligenceBackend(
        payload,
      )

    return buildSuccessResponse(
      backendResponse,
    )
  } catch (
    error
  ) {
    console.error(
      '[AGENDA_INTELLIGENCE_GET_ERROR]',
      {
        error:
          error instanceof
          Error
            ? error.message
            : error,
      },
    )

    return buildErrorResponse(
      error,
    )
  }
}
