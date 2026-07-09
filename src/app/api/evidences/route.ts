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
    .from('agenda_evidences')
    .select('*')
    .order('created_at', { ascending: false })

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
    title: body.title,
    description: body.description ?? null,
    evidence_type: body.evidenceType ?? 'texto',
    file_url: body.fileUrl ?? null,
    external_url: body.externalUrl ?? null,
    planning_id: body.planningId ?? null,
    event_id: body.eventId ?? null,
    school_id: body.schoolId ?? null,
    user_id: body.userId ?? null,
  }

  if (!payload.title) {
    return NextResponse.json(
      { success: false, error: 'Título é obrigatório.' },
      { status: 400 },
    )
  }

  const { data, error } = await supabase
    .from('agenda_evidences')
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