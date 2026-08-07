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

import {
  getEiosGovernanceOverview,
  persistEiosGovernanceBundle,
} from '@/lib/eios/core/governance/governance.service'

import type {
  BuildEiosGovernanceBundleInput,
} from '@/lib/eios/core/governance/governance.engine'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const NO_CACHE_HEADERS = {
  'Cache-Control':
    'no-store, no-cache, must-revalidate',
}

function getAccessToken(
  request: NextRequest,
): string {
  const accessToken =
    request.cookies.get(
      'sb-access-token',
    )?.value ??
    request.cookies.get(
      'access_token',
    )?.value

  if (!accessToken) {
    throw new Error(
      'Usuário não autenticado.',
    )
  }

  return accessToken
}

function createAuthenticatedClient(
  accessToken: string,
): SupabaseClient {
  const url =
    process.env
      .NEXT_PUBLIC_SUPABASE_URL
  const anonKey =
    process.env
      .NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error(
      'Variáveis públicas do Supabase não configuradas.',
    )
  }

  return createClient(
    url,
    anonKey,
    {
      global: {
        headers: {
          Authorization:
            `Bearer ${accessToken}`,
        },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  )
}

function normalizeLimit(
  value: string | null,
): number {
  const parsed = Number(value)

  if (!Number.isFinite(parsed)) {
    return 50
  }

  return Math.min(
    200,
    Math.max(1, Math.trunc(parsed)),
  )
}

function errorResponse(
  error: unknown,
) {
  const message =
    error instanceof Error
      ? error.message
      : 'Erro desconhecido.'

  const status =
    message.toLowerCase().includes(
      'não autenticado',
    )
      ? 401
      : 500

  return NextResponse.json(
    {
      success: false,
      error:
        status >= 500
          ? 'Não foi possível processar a governança do EIOS.'
          : message,
      meta: {
        generatedAt:
          new Date().toISOString(),
      },
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
    const user =
      await requireSessionUser()

    const client =
      createAuthenticatedClient(
        getAccessToken(request),
      )

    const overview =
      await getEiosGovernanceOverview({
        client,
        scope: {
          userId: user.id,
        },
        limit: normalizeLimit(
          request.nextUrl.searchParams
            .get('limit'),
        ),
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
    console.error(
      '[EIOS_GOVERNANCE_GET_ERROR]',
      error,
    )

    return errorResponse(error)
  }
}

export async function POST(
  request: NextRequest,
) {
  try {
    const user =
      await requireSessionUser()

    const body =
      await request.json() as {
        governance?: BuildEiosGovernanceBundleInput
      }

    if (!body.governance?.audit) {
      return NextResponse.json(
        {
          success: false,
          error:
            'governance.audit é obrigatório.',
        },
        {
          status: 400,
          headers: NO_CACHE_HEADERS,
        },
      )
    }

    const governance:
      BuildEiosGovernanceBundleInput = {
      ...body.governance,
      audit: {
        ...body.governance.audit,
        actor: {
          ...body.governance.audit.actor,
          type: 'user',
          id: user.id,
        },
      },
      workflow:
        body.governance.workflow
          ? {
              ...body.governance.workflow,
              actorId: user.id,
            }
          : null,
      decision:
        body.governance.decision
          ? {
              ...body.governance.decision,
              decidedBy: user.id,
            }
          : null,
      provenance:
        body.governance.provenance
          ? {
              ...body.governance.provenance,
              generatedBy: user.id,
            }
          : null,
    }

    const client =
      createAuthenticatedClient(
        getAccessToken(request),
      )

    const result =
      await persistEiosGovernanceBundle({
        client,
        scope: {
          userId: user.id,
        },
        governance,
      })

    return NextResponse.json(
      result,
      {
        status: 201,
        headers: NO_CACHE_HEADERS,
      },
    )
  } catch (error) {
    console.error(
      '[EIOS_GOVERNANCE_POST_ERROR]',
      error,
    )

    return errorResponse(error)
  }
}
