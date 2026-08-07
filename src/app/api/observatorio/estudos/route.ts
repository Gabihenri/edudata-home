import {
  createClient,
  type SupabaseClient,
} from '@supabase/supabase-js'
import {
  NextRequest,
  NextResponse,
} from 'next/server'

import { requireSessionUser } from '@/lib/auth/session'
import {
  createObservatoryStudy,
  getObservatoryStudies,
} from '@/lib/observatory/research-study.service'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate',
}

function getAccessToken(request: NextRequest): string {
  const token =
    request.cookies.get('sb-access-token')?.value ??
    request.cookies.get('access_token')?.value

  if (!token) throw new Error('Usuário não autenticado.')
  return token
}

function createAuthenticatedClient(accessToken: string): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error('Variáveis públicas do Supabase não configuradas.')
  }

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

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : 'Erro desconhecido.'
  const status = message.toLowerCase().includes('não autenticado') ? 401 : 500

  return NextResponse.json(
    {
      success: false,
      error:
        status >= 500
          ? 'Não foi possível processar os estudos do Observatório.'
          : message,
    },
    {
      status,
      headers: NO_CACHE_HEADERS,
    },
  )
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireSessionUser()
    const result = await getObservatoryStudies({
      client: createAuthenticatedClient(getAccessToken(request)),
      userId: user.id,
    })

    return NextResponse.json(result, {
      status: 200,
      headers: NO_CACHE_HEADERS,
    })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireSessionUser()
    const body = await request.json() as Record<string, unknown>

    const result = await createObservatoryStudy({
      client: createAuthenticatedClient(getAccessToken(request)),
      userId: user.id,
      input: body,
    })

    return NextResponse.json(result, {
      status: 201,
      headers: NO_CACHE_HEADERS,
    })
  } catch (error) {
    return errorResponse(error)
  }
}
