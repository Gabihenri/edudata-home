import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error('Variáveis do Supabase não configuradas.')
  }

  return createClient(url, key)
}

export async function GET() {
  const supabase = getSupabase()

  const { data, error } = await supabase
    .from('matriculas_na_academia')
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
    course_slug: body.courseSlug || body.curso || body.courseId || null,
    name: body.fullName || body.nome || body.name,
    email: body.email,
    phone: body.whatsapp || body.telefone || body.phone,
    school_name: body.school || body.escola,
    role: body.role || body.cargo,
    status: 'novo',
    source: 'academy',
    notes: body.notes || null,
  }

  const { data, error } = await supabase
    .from('matriculas_na_academia')
    .insert(payload)
    .select()
    .single()

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    )
  }

  return NextResponse.json({
    success: true,
    data,
  })
}