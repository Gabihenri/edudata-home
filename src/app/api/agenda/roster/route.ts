import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

import { requireSessionUser } from '@/lib/auth/session'
import {
  addClassStudent,
  listClassRoster,
} from '@/lib/agenda/repository/class-diary.repository'

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
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
}

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : 'Erro desconhecido.'
  const normalized = message.toLowerCase()
  const status = normalized.includes('não autenticado')
    ? 401
    : normalized.includes('obrigatório') ||
        normalized.includes('inteiro maior que zero')
      ? 400
      : 500

  return NextResponse.json(
    {
      success: false,
      code: status >= 500 ? 'ROSTER_UNAVAILABLE' : 'INVALID_ROSTER_REQUEST',
      error:
        status >= 500
          ? 'Não foi possível carregar ou atualizar a lista de estudantes.'
          : message,
    },
    { status, headers: NO_CACHE_HEADERS },
  )
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireSessionUser()
    const client = createAuthenticatedClient(getAccessToken(request))
    const classId = request.nextUrl.searchParams.get('classId')?.trim()

    if (!classId) throw new Error('classId é obrigatório.')

    const roster = await listClassRoster({
      client,
      userId: user.id,
      classId,
    })

    return NextResponse.json(
      {
        success: true,
        state: roster.length === 0 ? 'empty' : 'ready',
        roster,
        total: roster.length,
      },
      { status: 200, headers: NO_CACHE_HEADERS },
    )
  } catch (error) {
    return errorResponse(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireSessionUser()
    const client = createAuthenticatedClient(getAccessToken(request))
    const body = await request.json() as {
      classId?: string
      fullName?: string
      enrollmentCode?: string | null
      sequenceNumber?: number | null
    }

    const classId = body.classId?.trim()
    const fullName = body.fullName?.trim()

    if (!classId) throw new Error('classId é obrigatório.')
    if (!fullName) throw new Error('fullName é obrigatório.')

    if (
      body.sequenceNumber !== undefined &&
      body.sequenceNumber !== null &&
      (!Number.isInteger(body.sequenceNumber) || body.sequenceNumber <= 0)
    ) {
      throw new Error('O número de chamada deve ser um inteiro maior que zero.')
    }

    const student = await addClassStudent({
      client,
      userId: user.id,
      classId,
      fullName,
      enrollmentCode: body.enrollmentCode,
      sequenceNumber: body.sequenceNumber,
    })

    return NextResponse.json(
      { success: true, student },
      { status: 201, headers: NO_CACHE_HEADERS },
    )
  } catch (error) {
    return errorResponse(error)
  }
}
