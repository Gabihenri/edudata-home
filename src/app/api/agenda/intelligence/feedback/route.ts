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

export const dynamic =
  'force-dynamic'

const ALLOWED_OUTCOMES = new Set([
  'accepted',
  'rejected',
  'ignored',
  'edited',
  'executed',
  'positive',
  'neutral',
  'negative',
])

const ALLOWED_RESULTS = new Set([
  'positive',
  'neutral',
  'negative',
])

type UnknownRecord =
  Record<string, unknown>

function isRecord(
  value: unknown,
): value is UnknownRecord {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  )
}

function getAccessToken(
  request: NextRequest,
): string {
  const accessToken =
    request.cookies.get('sb-access-token')?.value ??
    request.cookies.get('access_token')?.value

  if (!accessToken) {
    throw new Error('Usuário não autenticado.')
  }

  return accessToken
}

function createAuthenticatedClient(
  accessToken: string,
): SupabaseClient {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL

  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

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
          Authorization: `Bearer ${accessToken}`,
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

function normalizeOptionalText(
  value: unknown,
  fieldName: string,
  maximumLength = 120,
): string | null {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return null
  }

  if (typeof value !== 'string') {
    throw new Error(
      `${fieldName} possui formato inválido.`,
    )
  }

  const normalized = value.trim()

  if (!normalized) {
    return null
  }

  if (normalized.length > maximumLength) {
    throw new Error(
      `${fieldName} não pode ultrapassar ${maximumLength} caracteres.`,
    )
  }

  return normalized
}

function getErrorStatus(
  error: unknown,
): number {
  if (!(error instanceof Error)) {
    return 500
  }

  const message = error.message.toLowerCase()

  if (
    message.includes('não autenticado') ||
    message.includes('unauthorized')
  ) {
    return 401
  }

  if (
    message.includes('permission denied') ||
    message.includes('row-level security') ||
    message.includes('sem permissão') ||
    message.includes('não autorizado')
  ) {
    return 403
  }

  if (
    message.includes('inválido') ||
    message.includes('formato') ||
    message.includes('obrigatório') ||
    message.includes('não pode ultrapassar')
  ) {
    return 400
  }

  return 500
}

export async function POST(
  request: NextRequest,
) {
  try {
    const user =
      await requireSessionUser()

    const body: unknown =
      await request.json()

    if (!isRecord(body)) {
      throw new Error(
        'Payload de feedback inválido.',
      )
    }

    const outcome =
      normalizeOptionalText(
        body.outcome,
        'Outcome',
        32,
      )

    if (
      !outcome ||
      !ALLOWED_OUTCOMES.has(outcome)
    ) {
      throw new Error(
        'Resultado de feedback inválido.',
      )
    }

    const result =
      normalizeOptionalText(
        body.result,
        'Resultado',
        32,
      )

    if (
      result &&
      !ALLOWED_RESULTS.has(result)
    ) {
      throw new Error(
        'Resultado de aprendizagem inválido.',
      )
    }

    const organizationId =
      normalizeOptionalText(
        body.organizationId,
        'ID da organização',
        36,
      )

    const schoolId =
      normalizeOptionalText(
        body.schoolId,
        'ID da escola',
        36,
      )

    const recommendationId =
      normalizeOptionalText(
        body.recommendation_id,
        'ID da recomendação',
        120,
      )

    const recommendationType =
      normalizeOptionalText(
        body.recommendation_type,
        'Tipo da recomendação',
        120,
      )

    const contextType =
      normalizeOptionalText(
        body.context_type,
        'Tipo de contexto',
        120,
      )

    const executed =
      typeof body.executed === 'boolean'
        ? body.executed
        : null

    const accessToken =
      getAccessToken(request)

    const client =
      createAuthenticatedClient(accessToken)

    const { data, error } =
      await client
        .from('agenda_learning_events')
        .insert({
          organization_id: organizationId,
          school_id: schoolId,
          user_id: user.id,
          recommendation_id: recommendationId,
          recommendation_type: recommendationType,
          module: 'agenda',
          context_type: contextType,
          outcome,
          executed,
          result,
        })
        .select('id, created_at')
        .single()

    if (error) {
      throw error
    }

    return NextResponse.json(
      {
        success: true,
        status: 'persisted',
        contractVersion: 'learning-v2',
        event: {
          id: data.id,
          createdAt: data.created_at,
          outcome,
          result,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    const status =
      getErrorStatus(error)

    return NextResponse.json(
      {
        success: false,
        error:
          status >= 500
            ? 'Não foi possível registrar o feedback de aprendizagem.'
            : error instanceof Error
              ? error.message
              : 'Não foi possível registrar o feedback de aprendizagem.',
      },
      { status },
    )
  }
}
