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

function getCurrentAgendaWeekReference(): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())

  const year = parts.find(part => part.type === 'year')?.value
  const month = parts.find(part => part.type === 'month')?.value
  const day = parts.find(part => part.type === 'day')?.value

  if (!year || !month || !day) {
    throw new Error('Não foi possível determinar a semana operacional.')
  }

  const localDate = new Date(`${year}-${month}-${day}T00:00:00Z`)
  const dayOfWeek = localDate.getUTCDay()
  const daysFromMonday = (dayOfWeek + 6) % 7
  localDate.setUTCDate(localDate.getUTCDate() - daysFromMonday)

  return localDate.toISOString().slice(0, 10)
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

    const orderedPending = [...pending].sort((left, right) => {
      const leftItem = left as {
        due_at?: string | null
        pending_reason?: string
      }
      const rightItem = right as {
        due_at?: string | null
        pending_reason?: string
      }

      const priority = (reason?: string) =>
        reason === 'overdue' ? 0 :
        reason === 'high_priority' ? 1 : 2

      const priorityDifference =
        priority(leftItem.pending_reason) -
        priority(rightItem.pending_reason)

      if (priorityDifference !== 0) {
        return priorityDifference
      }

      if (!leftItem.due_at && !rightItem.due_at) return 0
      if (!leftItem.due_at) return 1
      if (!rightItem.due_at) return -1

      return (
        new Date(leftItem.due_at).getTime() -
        new Date(rightItem.due_at).getTime()
      )
    })

    const coverageTotals = coverage.reduce(
      (totals, item) => {
        const row = item as {
          planned_events?: number
          evidenced_events?: number
        }

        return {
          planned:
            totals.planned +
            Number(row.planned_events ?? 0),
          evidenced:
            totals.evidenced +
            Number(row.evidenced_events ?? 0),
        }
      },
      { planned: 0, evidenced: 0 },
    )

    const summary = {
      conflicts: conflicts.length,
      pending: orderedPending.length,
      evidencePending: eventStates.filter(
        item =>
          (item as { operational_state?: string })
            .operational_state === 'evidence_pending',
      ).length,
      workloadHours: workload.reduce(
        (total, item) => {
          const row = item as {
            week_reference?: string
            estimated_hours?: number
          }

          return row.week_reference === getCurrentAgendaWeekReference()
            ? total + Number(row.estimated_hours ?? 0)
            : total
        },
        0,
      ),
      ruleAlerts: rules.length,
      criticalRules: rules.filter(
        item => (item as { severity?: string }).severity === 'critical',
      ).length,
      coveragePercent:
        coverageTotals.planned > 0
          ? Math.round(
              (coverageTotals.evidenced /
                coverageTotals.planned) *
                100,
            )
          : 0,
    }

    return NextResponse.json(
      {
        success: true,
        generatedAt: new Date().toISOString(),
        summary,
        conflicts,
        pending: orderedPending,
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
