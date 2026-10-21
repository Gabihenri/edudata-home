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

function isPlatformAdminRole(role: unknown): boolean {
  if (typeof role !== 'string') return false

  const normalizedRole = role
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s-]+/g, '_')

  // Match the Core's platform-admin aliases without accepting generic
  // administrator roles that may be limited to a single institution.
  return [
    'platform_admin',
    'super_admin',
    'admin_plataforma',
    'administrador_plataforma',
    'superadmin',
    'super_administrator',
    'superadministrator',
    'superadministrador',
    'superadministrador_edudata_ia',
  ].includes(normalizedRole)
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

  if (profile?.status !== 'active' || !isPlatformAdminRole(profile?.role)) {
    throw new Error('Usuário não autorizado.')
  }

  return supabase
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function GET() {
  try {
    const supabase = await requireAcademyAdmin()

    const { data, error } = await supabase
      .from('matriculas_na_academia')
      .select('id, course_slug, name, email, phone, school_name, role, status, source, notes, created_at')
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
    const body: unknown = await request.json()

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json(
        { success: false, error: 'Corpo da requisição inválido.' },
        { status: 400 },
      )
    }

    const input = body as Record<string, unknown>
    const rawName = input.fullName ?? input.nome ?? input.name
    const rawEmail = input.email
    const name = typeof rawName === 'string' ? rawName.trim() : ''
    const email = typeof rawEmail === 'string' ? rawEmail.trim().toLowerCase() : ''

    if (name.length < 2 || name.length > 120) {
      return NextResponse.json(
        { success: false, error: 'Informe um nome entre 2 e 120 caracteres.' },
        { status: 400 },
      )
    }

    if (email.length > 254 || !isValidEmail(email)) {
      return NextResponse.json(
        { success: false, error: 'Informe um endereço de e-mail válido.' },
        { status: 400 },
      )
    }

    if (input.lgpd !== true) {
      return NextResponse.json(
        {
          success: false,
          error: 'É necessário aceitar a Política de Privacidade.',
        },
        { status: 400 },
      )
    }

    const supabase = getServiceRoleSupabase()

    const courseValue = input.courseSlug ?? input.curso ?? input.courseId
    const phoneValue = input.whatsapp ?? input.telefone ?? input.phone
    const schoolValue = input.school ?? input.escola
    const roleValue = input.role ?? input.cargo
    const notesValue = input.notes

    const payload = {
      course_slug:
        typeof courseValue === 'string' && courseValue.trim()
          ? courseValue.trim().slice(0, 160)
          : 'professor-digital',
      name,
      email,
      phone:
        typeof phoneValue === 'string' && phoneValue.trim()
          ? phoneValue.trim().slice(0, 40)
          : null,
      school_name:
        typeof schoolValue === 'string' && schoolValue.trim()
          ? schoolValue.trim().slice(0, 180)
          : null,
      role:
        typeof roleValue === 'string' && roleValue.trim()
          ? roleValue.trim().slice(0, 120)
          : null,
      status: 'novo',
      source: 'academy',
      lgpd_consent: true,
      privacy_consent_at: new Date().toISOString(),
      privacy_notice_version: null,
      notes:
        typeof notesValue === 'string' && notesValue.trim()
          ? notesValue.trim().slice(0, 2000)
          : null,
    }

    const { error } = await supabase
      .from('matriculas_na_academia')
      .insert(payload)

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Não foi possível registrar a inscrição.' },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Inscrição realizada com sucesso.',
    })
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno ao processar inscrição.',
      },
      { status: 500 },
    )
  }
}
