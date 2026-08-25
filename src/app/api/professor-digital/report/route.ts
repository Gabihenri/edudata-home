import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { buildWeeklyProfessionalReport } from '@/lib/eios/professor-digital'

function getClient(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const token = request.cookies.get('sb-access-token')?.value ?? request.cookies.get('access_token')?.value
  if (!url || !anonKey || !token) return null

  return createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
}

export async function GET(request: NextRequest) {
  const supabase = getClient(request)
  if (!supabase) {
    return NextResponse.json({ success: false, error: 'Usuário não autenticado.' }, { status: 401 })
  }

  const { data: authData } = await supabase.auth.getUser()
  if (!authData.user) {
    return NextResponse.json({ success: false, error: 'Usuário não autenticado.' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('professor_digital_profiles')
    .select('context, knowledge, production')
    .eq('user_id', authData.user.id)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ success: false, error: 'Não foi possível gerar a síntese profissional.' }, { status: 500 })
  }

  const report = buildWeeklyProfessionalReport({
    context: (data?.context ?? {}) as never,
    knowledge: (data?.knowledge ?? []) as never,
    production: (data?.production ?? []) as never,
  })

  return NextResponse.json({
    success: true,
    report,
    principles: [
      'Leitura baseada nos registros que o próprio profissional autorizou.',
      'Síntese reflexiva, sem nota, ranking, rótulo comportamental ou avaliação psicológica.',
      'O professor pode revisar e corrigir os próprios registros de origem.',
    ],
  })
}
