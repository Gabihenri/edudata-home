import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

type SignUpRequestBody = {
  email?: string
  password?: string
  displayName?: string
}

function getSupabaseAuthClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error('Variáveis do Supabase não configuradas.')
  }

  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
}

function normalizeEmail(value: string | undefined): string {
  return value?.trim().toLowerCase() ?? ''
}

function normalizeDisplayName(value: string | undefined): string {
  return value?.trim().replace(/\s+/g, ' ') ?? ''
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SignUpRequestBody

    const email = normalizeEmail(body.email)
    const password = body.password ?? ''
    const displayName = normalizeDisplayName(body.displayName)

    if (!displayName) {
      return NextResponse.json(
        {
          success: false,
          error: 'Informe seu nome.',
        },
        { status: 400 },
      )
    }

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Informe um e-mail válido.',
        },
        { status: 400 },
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        {
          success: false,
          error: 'A senha deve possuir pelo menos 8 caracteres.',
        },
        { status: 400 },
      )
    }

    const supabase = getSupabaseAuthClient()

    const emailRedirectTo = new URL(
      '/login?redirectTo=%2Fagenda%2Fdashboard',
      request.url,
    ).toString()

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo,
        data: {
          display_name: displayName,
          full_name: displayName,
          role: 'individual',
          source: 'agenda_public_signup',
        },
      },
    })

    if (error) {
      const normalizedMessage = error.message.toLowerCase()

      const message =
        normalizedMessage.includes('already') ||
        normalizedMessage.includes('registered') ||
        normalizedMessage.includes('exists')
          ? 'Este e-mail já possui uma conta. Entre com suas credenciais.'
          : normalizedMessage.includes('signup') &&
              normalizedMessage.includes('disabled')
            ? 'Novos cadastros estão temporariamente indisponíveis. Tente entrar com Google.'
            : 'Não foi possível criar sua conta agora.'

      return NextResponse.json(
        {
          success: false,
          error: message,
        },
        { status: 400 },
      )
    }

    if (!data.user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Não foi possível concluir a criação da conta.',
        },
        { status: 500 },
      )
    }

    if (!data.session) {
      return NextResponse.json({
        success: true,
        requiresEmailConfirmation: true,
        user: {
          id: data.user.id,
          email: data.user.email,
        },
      })
    }

    const response = NextResponse.json({
      success: true,
      requiresEmailConfirmation: false,
      user: {
        id: data.user.id,
        email: data.user.email,
      },
    })

    const isProduction = process.env.NODE_ENV === 'production'

    response.cookies.set({
      name: 'sb-access-token',
      value: data.session.access_token,
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: data.session.expires_in,
    })

    response.cookies.set({
      name: 'sb-refresh-token',
      value: data.session.refresh_token,
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    })

    return response
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Erro interno ao criar conta.'

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 },
    )
  }
}
