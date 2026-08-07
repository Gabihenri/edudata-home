import {
  createClient,
  type SupabaseClient,
} from '@supabase/supabase-js'

import {
  NextRequest,
  NextResponse,
} from 'next/server'

import { requireSessionUser } from '@/lib/auth/session'

import {
  changePedagogicalCaseStatus,
  createPedagogicalCase,
  getPedagogicalCases,
} from '@/lib/agenda/pedagogical-case.service'

import type {
  CreatePedagogicalCaseInput,
  PedagogicalCaseListFilters,
  PedagogicalCaseStatus,
} from '@/lib/eios/academic/pedagogical-case.contract'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate',
}

function getAccessToken(request: NextRequest): string {
  const token =
    request.cookies.get('sb-access-token')?.value ??
    request.cookies.get('access_token')?.value

  if (!token) throw new Error('Usuário não autenticado.')
  return token
}

function createAuthenticatedClient(accessToken: string): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error('Variáveis públicas do Supabase não configuradas.')
  }

  return createClient(url, anonKey, {
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
  })
}

function parseLimit(value: string | null): number | undefined {
  if (!value) return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.trunc(parsed) : undefined
}

function createErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : 'Erro desconhecido.'
  const normalized = message.toLowerCase()
  const status = normalized.includes('não autenticado')
    ? 401
    : normalized.includes('obrigatório') || normalized.includes('informe')
      ? 400
      : 500

  return NextResponse.json(
    {
      success: false,
      error:
        status >= 500
          ? 'Não foi possível processar os casos pedagógicos.'
          : message,
    },
    {
      status,
      headers: NO_CACHE_HEADERS,
    },
  )
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireSessionUser()
    const params = request.nextUrl.searchParams

    const filters: PedagogicalCaseListFilters = {
      studentId: params.get('studentId'),
      classId: params.get('classId'),
      academicPeriodId: params.get('academicPeriodId'),
      status: params.get('status') as PedagogicalCaseListFilters['status'],
      priority: params.get('priority') as PedagogicalCaseListFilters['priority'],
      limit: parseLimit(params.get('limit')),
    }

    const result = await getPedagogicalCases({
      client: createAuthenticatedClient(getAccessToken(request)),
      userId: user.id,
      filters,
    })

    return NextResponse.json(result, {
      status: 200,
      headers: NO_CACHE_HEADERS,
    })
  } catch (error) {
    return createErrorResponse(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireSessionUser()
    const body = await request.json() as Omit<CreatePedagogicalCaseInput, 'openedByUserId'>

    const result = await createPedagogicalCase({
      client: createAuthenticatedClient(getAccessToken(request)),
      userId: user.id,
      input: body,
    })

    return NextResponse.json(result, {
      status: 201,
      headers: NO_CACHE_HEADERS,
    })
  } catch (error) {
    return createErrorResponse(error)
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireSessionUser()
    const body = await request.json() as {
      caseId?: string
      status?: PedagogicalCaseStatus
      resolutionSummary?: string | null
    }

    if (!body.caseId?.trim()) throw new Error('caseId é obrigatório.')
    if (!body.status) throw new Error('status é obrigatório.')

    const result = await changePedagogicalCaseStatus({
      client: createAuthenticatedClient(getAccessToken(request)),
      userId: user.id,
      caseId: body.caseId,
      status: body.status,
      resolutionSummary: body.resolutionSummary,
    })

    return NextResponse.json(result, {
      status: 200,
      headers: NO_CACHE_HEADERS,
    })
  } catch (error) {
    return createErrorResponse(error)
  }
}
