import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

type LoginRequestBody = {
  email?: string
  password?: string
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

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LoginRequestBody

    const email = body.email?.trim().toLowerCase()
    const password = body.password

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          error: 'E-mail e senha são obrigatórios.',
        },
        {
          status: 400,
        },
      )
    }

    const supabase = getSupabaseAuthClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error || !data.session || !data.user) {
      return NextResponse.json(
        {
          success: false,
          error: 'E-mail ou senha inválidos.',
        },
        {
          status: 401,
        },
      )
    }

    const response = NextResponse.json({
      success: true,
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
        : 'Erro interno ao realizar login.'

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      {
        status: 500,
      },
    )
  }
}