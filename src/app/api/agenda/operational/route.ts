import {
  createClient,
  type SupabaseClient,
} from '@supabase/supabase-js'

import {
  NextRequest,
  NextResponse,
} from 'next/server'

import {
  isAccessDeniedError,
  requireFeatureAccess,
  serializeAccessDeniedError,
} from '@/lib/access/guards/require-feature-access'

import {
  requireSessionUser,
} from '@/lib/auth/session'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate',
}

function getAccessToken(request: NextRequest): string {
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

async function readView<T>(
  client: SupabaseClient,
  viewName:
    | 'agenda_operational_conflicts'
    | 'agenda_operational_event_state'
    | 'agenda_operational_pending'
    | 'agenda_operational_workload'
    | 'agenda_operational_coverage'
    | 'agenda_edi_rule_evaluations',
  userId: string | null,
): Promise<T[]> {
  let query = client
    .from(viewName)
    .select('*')

  if (userId) {
    query = query.eq('user_id', userId)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(
      `Erro ao consultar ${viewName}: ${error.message}`,
    )
  }

  return (data ?? []) as T[]
}

export async function GET(
  request: NextRequest,
) {
  try {
    const user = await requireSessionUser()

    await requireFeatureAccess({
      userId: user.id,
      featureCode: 'agenda.planning',
      options: {
        includeUsage: false,
      },
    })

    const client = createAuthenticatedClient(
      getAccessToken(request),
    )

    const [
      conflicts,
      eventStates,
      pending,
      workload,
      coverage,
      rules,
    ] = await Promise.all([
      readView(client, 'agenda_operational_conflicts', null),
      readView(client, 'agenda_operational_event_state', user.id),
      readView(client, 'agenda_operational_pending', user.id),
      readView(client, 'agenda_operational_workload', user.id),
      readView(client, 'agenda_operational_coverage', user.id),
      readView(client, 'agenda_edi_rule_evaluations', user.id),
    ])

    const summary = {
      conflicts: conflicts.length,
      pending: pending.length,
      evidencePending: eventStates.filter(
        item =>
          (item as { operational_state?: string })
            .operational_state === 'evidence_pending',
      ).length,
      workloadHours: workload.reduce(
        (total, item) =>
          total +
          Number(
            (item as { estimated_hours?: number })
              .estimated_hours ?? 0,
          ),
        0,
      ),
      ruleAlerts: rules.length,
      criticalRules: rules.filter(
        item => (item as { severity?: string }).severity === 'critical',
      ).length,
      coveragePercent:
        coverage.length > 0
          ? Math.round(
              coverage.reduce(
                (total, item) =>
                  total +
                  Number(
                    (item as {
                      evidence_coverage_percent?: number
                    }).evidence_coverage_percent ?? 0,
                  ),
                0,
              ) / coverage.length,
            )
          : 0,
    }

    return NextResponse.json(
      {
        success: true,
        generatedAt: new Date().toISOString(),
        summary,
        conflicts,
        pending,
        workload,
        coverage,
        rules,
      },
      {
        status: 200,
        headers: NO_CACHE_HEADERS,
      },
    )
  } catch (error) {
    console.error(
      '[AGENDA_OPERATIONAL_INTELLIGENCE_ERROR]',
      error,
    )

    if (isAccessDeniedError(error)) {
      return NextResponse.json(
        serializeAccessDeniedError(error),
        {
          status: 403,
          headers: NO_CACHE_HEADERS,
        },
      )
    }

    const message =
      error instanceof Error
        ? error.message
        : 'Erro interno ao carregar a inteligência operacional.'

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      {
        status: message
          .toLowerCase()
          .includes('não autenticado')
          ? 401
          : 500,
        headers: NO_CACHE_HEADERS,
      },
    )
  }
}
