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

import {
  createAndPersistStudentOccurrence,
  getStudentOccurrences,
  reviewStudentOccurrenceStatus,
} from '@/lib/agenda/student-occurrence.service'

import type {
  CreateStudentOccurrenceInput,
  StudentOccurrenceListFilters,
  StudentOccurrenceStatus,
} from '@/lib/eios/academic/student-occurrence.contract'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const NO_CACHE_HEADERS = {
  'Cache-Control':
    'no-store, no-cache, must-revalidate',
}

function getAccessToken(
  request: NextRequest,
): string {
  const token =
    request.cookies.get(
      'sb-access-token',
    )?.value ??
    request.cookies.get(
      'access_token',
    )?.value

  if (!token) {
    throw new Error(
      'Usuário não autenticado.',
    )
  }

  return token
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

function parseBoolean(
  value: string | null,
): boolean | null {
  if (value === 'true') return true
  if (value === 'false') return false
  return null
}

function parseLimit(
  value: string | null,
): number | undefined {
  if (!value) return undefined

  const parsed = Number(value)

  return Number.isFinite(parsed)
    ? Math.trunc(parsed)
    : undefined
}

function createErrorResponse(
  error: unknown,
) {
  const message =
    error instanceof Error
      ? error.message
      : 'Erro desconhecido.'

  const normalized =
    message.toLowerCase()

  const status =
    normalized.includes('não autenticado')
      ? 401
      : normalized.includes('obrigatório')
        ? 400
        : 500

  return NextResponse.json(
    {
      success: false,
      error:
        status >= 500
          ? 'Não foi possível processar as ocorrências dos estudantes.'
          : message,
    },
    {
      status,
      headers: NO_CACHE_HEADERS,
    },
  )
}

export async function GET(
  request: NextRequest,
) {
  try {
    const user =
      await requireSessionUser()

    const params =
      request.nextUrl.searchParams

    const filters:
      StudentOccurrenceListFilters = {
      studentId:
        params.get('studentId'),
      classId:
        params.get('classId'),
      offeringId:
        params.get('offeringId'),
      academicPeriodId:
        params.get('academicPeriodId'),
      nature:
        params.get('nature') as
          StudentOccurrenceListFilters['nature'],
      severity:
        params.get('severity') as
          StudentOccurrenceListFilters['severity'],
      status:
        params.get('status') as
          StudentOccurrenceListFilters['status'],
      positive:
        parseBoolean(
          params.get('positive'),
        ),
      requiresFollowUp:
        parseBoolean(
          params.get('requiresFollowUp'),
        ),
      from: params.get('from'),
      to: params.get('to'),
      limit:
        parseLimit(params.get('limit')),
    }

    const result =
      await getStudentOccurrences({
        client:
          createAuthenticatedClient(
            getAccessToken(request),
          ),
        userId: user.id,
        filters,
      })

    return NextResponse.json(
      result,
      {
        status: 200,
        headers: NO_CACHE_HEADERS,
      },
    )
  } catch (error) {
    return createErrorResponse(error)
  }
}

export async function POST(
  request: NextRequest,
) {
  try {
    const user =
      await requireSessionUser()

    const body =
      await request.json() as
        Omit<
          CreateStudentOccurrenceInput,
          'recordedByUserId'
        >

    const result =
      await createAndPersistStudentOccurrence({
        client:
          createAuthenticatedClient(
            getAccessToken(request),
          ),
        userId: user.id,
        input: body,
      })

    return NextResponse.json(
      result,
      {
        status: 201,
        headers: NO_CACHE_HEADERS,
      },
    )
  } catch (error) {
    return createErrorResponse(error)
  }
}

export async function PATCH(
  request: NextRequest,
) {
  try {
    const user =
      await requireSessionUser()

    const body =
      await request.json() as {
        occurrenceId?: string
        status?: StudentOccurrenceStatus
      }

    if (!body.occurrenceId?.trim()) {
      throw new Error(
        'occurrenceId é obrigatório.',
      )
    }

    if (!body.status) {
      throw new Error(
        'status é obrigatório.',
      )
    }

    const result =
      await reviewStudentOccurrenceStatus({
        client:
          createAuthenticatedClient(
            getAccessToken(request),
          ),
        userId: user.id,
        occurrenceId:
          body.occurrenceId,
        status: body.status,
      })

    return NextResponse.json(
      result,
      {
        status: 200,
        headers: NO_CACHE_HEADERS,
      },
    )
  } catch (error) {
    return createErrorResponse(error)
  }
}
