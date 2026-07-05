import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error('Variáveis do Supabase não configuradas.')
  }

  return createClient(url, key)
}

export async function GET() {
  try {
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
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Erro interno ao buscar inscrições.',
      },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body.fullName && !body.nome && !body.name) {
      return NextResponse.json(
        { success: false, error: 'Nome é obrigatório.' },
        { status: 400 },
      )
    }

    if (!body.email) {
      return NextResponse.json(
        { success: false, error: 'E-mail é obrigatório.' },
        { status: 400 },
      )
    }

    if (!body.lgpd) {
      return NextResponse.json(
        {
          success: false,
          error: 'É necessário aceitar a Política de Privacidade.',
        },
        { status: 400 },
      )
    }

    const supabase = getSupabase()

    const payload = {
      course_slug: body.courseSlug || body.curso || body.courseId || 'professor-digital',
      name: body.fullName || body.nome || body.name,
      email: body.email,
      phone: body.whatsapp || body.telefone || body.phone || null,
      school_name: body.school || body.escola || null,
      role: body.role || body.cargo || null,
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
      message: 'Inscrição realizada com sucesso.',
      data,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Erro interno ao processar inscrição.',
      },
      { status: 500 },
    )
  }
}