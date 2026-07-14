import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

type OAuthSessionBody = {
  accessToken?: string
  refreshToken?: string
}

function getSupabaseAuthClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error(
      'As variáveis públicas do Supabase não estão configuradas.',
    )
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
    const requestOrigin = new URL(request.url).origin
    const origin = request.headers.get('origin')

    if (origin && origin !== requestOrigin) {
      return NextResponse.json(
        {
          success: false,
          error: 'Origem da solicitação não autorizada.',
        },
        {
          status: 403,
        },
      )
    }

    const body = (await request.json()) as OAuthSessionBody

    const accessToken = body.accessToken?.trim()
    const refreshToken = body.refreshToken?.trim()

    if (!accessToken || !refreshToken) {
      return NextResponse.json(
        {
          success: false,
          error: 'Sessão OAuth incompleta.',
        },
        {
          status: 400,
        },
      )
    }

    const supabase = getSupabaseAuthClient()

    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    })

    if (
      error ||
      !data.session ||
      !data.user
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Não foi possível validar a sessão do Google.',
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
        name:
          data.user.user_metadata?.full_name ??
          data.user.user_metadata?.name ??
          null,
        avatarUrl:
          data.user.user_metadata?.avatar_url ??
          data.user.user_metadata?.picture ??
          null,
      },
    })

    const isProduction =
      process.env.NODE_ENV === 'production'

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
        : 'Erro interno ao concluir o acesso pelo Google.'

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