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
    .from('agenda_events')
    .select('*')
    .order('start_at', { ascending: true })

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
    event_type: body.eventType ?? 'pedagogico',
    start_at: body.startAt,
    end_at: body.endAt ?? null,
    status: body.status ?? 'planejado',
    priority: body.priority ?? 'media',
    school_id: body.schoolId ?? null,
    user_id: body.userId ?? null,
    planning_id: body.planningId ?? null,
    evidence_id: body.evidenceId ?? null,
  }

  if (!payload.title || !payload.start_at) {
    return NextResponse.json(
      { success: false, error: 'Título e data inicial são obrigatórios.' },
      { status: 400 },
    )
  }

  const { data, error } = await supabase
    .from('agenda_events')
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