import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

import { requireSessionUser } from '@/lib/auth/session'

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

function required(value: string | null, label: string): string {
  const normalized = value?.trim()
  if (!normalized) throw new Error(`${label} é obrigatório.`)
  return normalized
}

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : 'Erro desconhecido.'
  const normalized = message.toLowerCase()
  const status = normalized.includes('não autenticado')
    ? 401
    : normalized.includes('obrigatório')
      ? 400
      : 500

  return NextResponse.json(
    {
      success: false,
      error: status >= 500 ? 'Não foi possível gerar os dados do relatório.' : message,
    },
    { status, headers: NO_CACHE_HEADERS },
  )
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireSessionUser()
    const client = createAuthenticatedClient(getAccessToken(request))

    const classId = required(request.nextUrl.searchParams.get('classId'), 'Turma')
    const academicPeriodId = request.nextUrl.searchParams.get('academicPeriodId')?.trim() || null
    const from = request.nextUrl.searchParams.get('from')?.trim() || null
    const to = request.nextUrl.searchParams.get('to')?.trim() || null

    const { data: roster, error: rosterError } = await client
      .from('agenda_class_students')
      .select('id,class_id,full_name,enrollment_code,sequence_number,active')
      .eq('user_id', user.id)
      .eq('class_id', classId)
      .eq('active', true)
      .is('archived_at', null)
      .order('sequence_number', { ascending: true, nullsFirst: false })
      .order('full_name', { ascending: true })

    if (rosterError) {
      throw new Error(`Não foi possível carregar a lista nominal: ${rosterError.message}`)
    }

    let attendanceQuery = client
      .from('agenda_attendance_entries')
      .select('id,class_id,student_id,lesson_date,status,notes,recorded_at')
      .eq('user_id', user.id)
      .eq('class_id', classId)
      .is('archived_at', null)
      .order('lesson_date', { ascending: true })

    if (from) attendanceQuery = attendanceQuery.gte('lesson_date', from)
    if (to) attendanceQuery = attendanceQuery.lte('lesson_date', to)

    const { data: attendance, error: attendanceError } = await attendanceQuery

    if (attendanceError) {
      throw new Error(`Não foi possível carregar a frequência: ${attendanceError.message}`)
    }

    let gradeQuery = client
      .from('agenda_gradebook_entries')
      .select('id,student_id,class_id,component_id,academic_period_id,title,value,percentage,concept,classification,entry_type,weight,recorded_at')
      .eq('user_id', user.id)
      .eq('class_id', classId)
      .is('archived_at', null)
      .order('recorded_at', { ascending: true })

    if (academicPeriodId) {
      gradeQuery = gradeQuery.eq('academic_period_id', academicPeriodId)
    }

    const { data: grades, error: gradesError } = await gradeQuery

    if (gradesError) {
      throw new Error(`Não foi possível carregar as notas: ${gradesError.message}`)
    }

    return NextResponse.json(
      {
        success: true,
        roster: roster ?? [],
        attendance: attendance ?? [],
        grades: grades ?? [],
      },
      { status: 200, headers: NO_CACHE_HEADERS },
    )
  } catch (error) {
    return errorResponse(error)
  }
}
