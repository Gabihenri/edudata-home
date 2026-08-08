import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

import { requireSessionUser } from '@/lib/auth/session'
import {
  addClassStudent,
  listAttendanceByDate,
  listClassRoster,
  upsertAttendance,
  type AttendanceStatus,
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
        normalized.includes('não corresponde') ||
        normalized.includes('não encontrado')
      ? 400
      : 500

  return NextResponse.json(
    {
      success: false,
      error: status >= 500 ? 'Não foi possível processar o Diário de Classe.' : message,
    },
    { status, headers: NO_CACHE_HEADERS },
  )
}

async function requirePlanningContext({
  client,
  userId,
  classId,
  planningId,
}: {
  client: SupabaseClient
  userId: string
  classId: string
  planningId: string
}) {
  const { data, error } = await client
    .from('agenda_planning')
    .select('id,class_id,status,title')
    .eq('id', planningId)
    .eq('user_id', userId)
    .is('deleted_at', null)
    .maybeSingle()

  if (error) {
    throw new Error(`Não foi possível validar o planejamento: ${error.message}`)
  }

  if (!data) {
    throw new Error('Planejamento não encontrado para o usuário atual.')
  }

  if (data.class_id !== classId) {
    throw new Error('O planejamento selecionado não corresponde à turma informada.')
  }

  if (data.status === 'arquivado') {
    throw new Error('O planejamento selecionado está arquivado.')
  }

  return data
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireSessionUser()
    const client = createAuthenticatedClient(getAccessToken(request))
    const classId = request.nextUrl.searchParams.get('classId')?.trim()
    const lessonDate = request.nextUrl.searchParams.get('lessonDate')?.trim()
    const planningId = request.nextUrl.searchParams.get('planningId')?.trim()

    if (!classId) throw new Error('classId é obrigatório.')

    if (lessonDate) {
      if (!planningId) throw new Error('planningId é obrigatório para abrir o Diário de Classe.')
      await requirePlanningContext({ client, userId: user.id, classId, planningId })
    }

    const roster = await listClassRoster({ client, userId: user.id, classId })

    // A lista nominal é a primeira dependência do Diário.
    // Se a turma estiver vazia, não consultamos frequência: a tela deve
    // orientar o usuário a cadastrar/importar estudantes, e não apresentar
    // um erro técnico de uma etapa que ainda não pode ser utilizada.
    if (roster.length === 0) {
      return NextResponse.json(
        {
          success: true,
          roster: [],
          attendance: [],
          state: 'empty_roster',
        },
        { status: 200, headers: NO_CACHE_HEADERS },
      )
    }

    const attendance = lessonDate
      ? await listAttendanceByDate({ client, userId: user.id, classId, lessonDate })
      : []

    return NextResponse.json(
      {
        success: true,
        roster,
        attendance,
        state: 'ready',
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
      operation?: 'add_student' | 'attendance'
      classId?: string
      planningId?: string
      fullName?: string
      enrollmentCode?: string | null
      sequenceNumber?: number | null
      studentId?: string
      lessonDate?: string
      status?: AttendanceStatus
      notes?: string | null
    }

    if (!body.classId?.trim()) throw new Error('classId é obrigatório.')

    if (body.operation === 'add_student') {
      if (!body.fullName?.trim()) throw new Error('fullName é obrigatório.')
      const student = await addClassStudent({
        client,
        userId: user.id,
        classId: body.classId,
        fullName: body.fullName,
        enrollmentCode: body.enrollmentCode,
        sequenceNumber: body.sequenceNumber,
      })
      return NextResponse.json(
        { success: true, student },
        { status: 201, headers: NO_CACHE_HEADERS },
      )
    }

    if (body.operation === 'attendance') {
      if (!body.planningId?.trim()) throw new Error('planningId é obrigatório.')
      if (!body.studentId?.trim()) throw new Error('studentId é obrigatório.')
      if (!body.lessonDate?.trim()) throw new Error('lessonDate é obrigatório.')
      if (!body.status) throw new Error('status é obrigatório.')

      await requirePlanningContext({
        client,
        userId: user.id,
        classId: body.classId,
        planningId: body.planningId,
      })

      const attendance = await upsertAttendance({
        client,
        userId: user.id,
        classId: body.classId,
        studentId: body.studentId,
        lessonDate: body.lessonDate,
        status: body.status,
        notes: body.notes,
      })

      return NextResponse.json(
        { success: true, attendance },
        { status: 200, headers: NO_CACHE_HEADERS },
      )
    }

    throw new Error('operation é obrigatória.')
  } catch (error) {
    return errorResponse(error)
  }
}
