import {
  createClient,
  type SupabaseClient,
} from '@supabase/supabase-js'

import {
  NextRequest,
  NextResponse,
} from 'next/server'

import {
  requireSessionUser,
} from '@/lib/auth/session'

import type {
  InstitutionalPolicy,
} from '@/lib/eios/governance/institutional-policy.contract'

import {
  createAndPublishInstitutionalPolicy,
  getInstitutionalGovernanceOverview,
} from '@/lib/eios/governance/institutional-policy.service'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const NO_CACHE_HEADERS = {
  'Cache-Control':
    'no-store, no-cache, must-revalidate',
}

function getAccessToken(
  request: NextRequest,
): string {
  const token =
    request.cookies.get('sb-access-token')?.value ??
    request.cookies.get('access_token')?.value

  if (!token) {
    throw new Error('Usuário não autenticado.')
  }

  return token
}

function createAuthenticatedClient(
  accessToken: string,
): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error(
      'Variáveis públicas do Supabase não configuradas.',
    )
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

function errorResponse(
  error: unknown,
) {
  const message =
    error instanceof Error
      ? error.message
      : 'Erro desconhecido.'

  const normalized = message.toLowerCase()
  const status = normalized.includes('não autenticado')
    ? 401
    : normalized.includes('obrigatório') ||
        normalized.includes('pesos') ||
        normalized.includes('vigência')
      ? 400
      : 500

  return NextResponse.json(
    {
      success: false,
      error:
        status >= 500
          ? 'Não foi possível processar a governança institucional.'
          : message,
    },
    {
      status,
      headers: NO_CACHE_HEADERS,
    },
  )
}

export async function GET(
  request: NextRequest,
) {
  try {
    await requireSessionUser()

    const organizationId =
      request.nextUrl.searchParams.get('organizationId')?.trim()

    if (!organizationId) {
      throw new Error('organizationId é obrigatório.')
    }

    const overview =
      await getInstitutionalGovernanceOverview({
        client: createAuthenticatedClient(
          getAccessToken(request),
        ),
        organizationId,
      })

    return NextResponse.json(
      {
        success: true,
        overview,
      },
      {
        status: 200,
        headers: NO_CACHE_HEADERS,
      },
    )
  } catch (error) {
    return errorResponse(error)
  }
}

export async function POST(
  request: NextRequest,
) {
  try {
    const user = await requireSessionUser()
    const body = await request.json() as {
      organizationId?: string
      policy?: Omit<
        InstitutionalPolicy,
        | 'id'
        | 'organizationId'
        | 'createdAt'
        | 'updatedAt'
        | 'createdBy'
        | 'updatedBy'
        | 'contractVersion'
      >
    }

    const organizationId = body.organizationId?.trim()

    if (!organizationId) {
      throw new Error('organizationId é obrigatório.')
    }

    if (!body.policy) {
      throw new Error('policy é obrigatório.')
    }

    const policy =
      await createAndPublishInstitutionalPolicy({
        client: createAuthenticatedClient(
          getAccessToken(request),
        ),
        organizationId,
        userId: user.id,
        policy: body.policy,
      })

    return NextResponse.json(
      {
        success: true,
        policy,
      },
      {
        status: 201,
        headers: NO_CACHE_HEADERS,
      },
    )
  } catch (error) {
    return errorResponse(error)
  }
}
