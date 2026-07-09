import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error('Variáveis do Supabase não configuradas.')
  }

  return createClient(url, key)
}

export async function GET() {
  const supabase = getSupabase()

  const { data, error } = await supabase
    .from('agenda_classes')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    )
  }

  return NextResponse.json({
    success: true,
    total: data?.length ?? 0,
    data,
  })
}

export async function POST(request: Request) {
  const body = await request.json()
  const supabase = getSupabase()

  const payload = {
    name: body.name,
    school_year: body.schoolYear ?? null,
    grade: body.grade ?? null,
    subject: body.subject ?? null,
    students_count: body.studentsCount ?? 0,
    school_id: body.schoolId ?? null,
    teacher_id: body.teacherId ?? null,
    active: body.active ?? true,
  }

  if (!payload.name) {
    return NextResponse.json(
      { success: false, error: 'Nome da turma é obrigatório.' },
      { status: 400 },
    )
  }

  const { data, error } = await supabase
    .from('agenda_classes')
    .insert(payload)
    .select()
    .single()

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    )
  }

  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status: 201 },
  )
}