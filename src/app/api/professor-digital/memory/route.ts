import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

type ProfessionalMemory = {
  context?: unknown
  knowledge?: unknown
  production?: unknown
  developmentChoices?: unknown
  consent?: unknown
}

function getClient(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const accessToken = request.cookies.get('sb-access-token')?.value ?? request.cookies.get('access_token')?.value

  if (!url || !anonKey || !accessToken) return null

  return createClient(url, anonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
}

async function getAuthenticatedUser(request: NextRequest) {
  const supabase = getClient(request)
  if (!supabase) return { supabase: null, user: null }

  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) return { supabase, user: null }

  return { supabase, user: data.user }
}

export async function GET(request: NextRequest) {
  const { supabase, user } = await getAuthenticatedUser(request)
  if (!supabase || !user) {
    return NextResponse.json({ success: false, error: 'Usuário não autenticado.' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('professor_digital_profiles')
    .select('context, knowledge, production, development_choices, consent, updated_at')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ success: false, error: 'Não foi possível recuperar sua memória profissional.' }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    memory: data
      ? {
          context: data.context,
          knowledge: data.knowledge,
          production: data.production,
          developmentChoices: data.development_choices,
          consent: data.consent,
          updatedAt: data.updated_at,
        }
      : null,
  })
}

export async function PUT(request: NextRequest) {
  const { supabase, user } = await getAuthenticatedUser(request)
  if (!supabase || !user) {
    return NextResponse.json({ success: false, error: 'Usuário não autenticado.' }, { status: 401 })
  }

  let body: ProfessionalMemory
  try {
    body = (await request.json()) as ProfessionalMemory
  } catch {
    return NextResponse.json({ success: false, error: 'Dados inválidos.' }, { status: 400 })
  }

  const payload = {
    user_id: user.id,
    context: body.context ?? {},
    knowledge: body.knowledge ?? [],
    production: body.production ?? [],
    development_choices: body.developmentChoices ?? [],
    consent: body.consent ?? { eios: true, academy: false },
  }

  const { error } = await supabase
    .from('professor_digital_profiles')
    .upsert(payload, { onConflict: 'user_id' })

  if (error) {
    return NextResponse.json({ success: false, error: 'Não foi possível salvar sua memória profissional.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
