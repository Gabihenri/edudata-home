import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

import { requireSessionUser } from '@/lib/auth/session'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function getServiceRoleSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Credenciais administrativas do Supabase não configuradas.')
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
}

function isAdminRole(role: unknown): boolean {
  if (typeof role !== 'string') return false

  return [
    'admin',
    'administrator',
    'platform_admin',
    'super_admin',
    'diretor',
    'director',
    'coordenador',
    'coordinator',
  ].includes(role.trim().toLowerCase())
}

async function requireAcademyAdmin() {
  const sessionUser = await requireSessionUser()

  if (!sessionUser?.id) {
    throw new Error('Usuário não autenticado.')
  }

  const supabase = getServiceRoleSupabase()

  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('role, status')
    .eq('user_id', sessionUser.id)
    .maybeSingle()

  if (error) {
    throw new Error('Não foi possível validar as permissões administrativas.')
  }

  if (profile?.status !== 'active' || !isAdminRole(profile?.role)) {
    throw new Error('Usuário não autorizado.')
  }

  return supabase
}

export async function GET() {
  try {
    const supabase = await requireAcademyAdmin()

    const { data, error } = await supabase
      .from('matriculas_na_academia')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Não foi possível carregar as inscrições.' },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      total: data?.length ?? 0,
      data,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Acesso não autorizado.'
    const status = message.includes('não autenticado') ? 401 : 403

    return NextResponse.json(
      { success: false, error: message },
      { status },
    )
  }
}

export async function POST(request: NextRequest) {
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

    const supabase = getServiceRoleSupabase()

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
        { success: false, error: 'Não foi possível registrar a inscrição.' },
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