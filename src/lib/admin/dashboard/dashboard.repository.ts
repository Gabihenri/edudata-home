import {
  createClient,
  type SupabaseClient,
} from '@supabase/supabase-js'

export type AdminDashboardMetrics = {
  users: {
    total: number
    active: number
    newLast7Days: number
    newLast30Days: number
  }

  subscriptions: {
    totalActive: number
    freeActive: number
    professorProActive: number
  }

  upgrades: {
    open: number
    contactPending: number
    qualified: number
    approved: number
    converted: number
  }

  organizations: {
    total: number
    active: number
  }

  schools: {
    total: number
  }

  support: {
    open: number
    inService: number
    waitingUser: number
    urgent: number
    highPriority: number
  }

  agenda: {
    events: number
    planning: number
    evidences: number
  }

  academy: {
    courses: number
    enrollments: number
  }
}

type CountResult = {
  count: number | null
  error: {
    message: string
  } | null
}

function createDashboardClient(): SupabaseClient {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL não configurada.',
    )
  }

  if (!serviceRoleKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY não configurada.',
    )
  }

  return createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  )
}

function normalizeCount(
  result: CountResult,
  context: string,
): number {
  if (result.error) {
    throw new Error(
      `${context}: ${result.error.message}`,
    )
  }

  return result.count ?? 0
}

function getIsoDateBeforeDays(
  days: number,
): string {
  const date = new Date()

  date.setUTCDate(
    date.getUTCDate() - days,
  )

  return date.toISOString()
}

class AdminDashboardRepository {
  private get client(): SupabaseClient {
    return createDashboardClient()
  }

  async getMetrics(): Promise<AdminDashboardMetrics> {
    const sevenDaysAgo =
      getIsoDateBeforeDays(7)

    const thirtyDaysAgo =
      getIsoDateBeforeDays(30)

    const client = this.client

    const {
      data: freePlan,
      error: freePlanError,
    } = await client
      .from('plans')
      .select('id')
      .eq('code', 'edi_free')
      .maybeSingle()

    if (freePlanError) {
      throw new Error(
        `Erro ao localizar o plano Free: ${freePlanError.message}`,
      )
    }

    const {
      data: professorProPlan,
      error: professorProPlanError,
    } = await client
      .from('plans')
      .select('id')
      .eq(
        'code',
        'edi_professor_pro',
      )
      .maybeSingle()

    if (professorProPlanError) {
      throw new Error(
        `Erro ao localizar o Professor Pro: ${professorProPlanError.message}`,
      )
    }

    const [
      usersTotal,
      usersActive,
      usersLast7Days,
      usersLast30Days,

      subscriptionsTotalActive,
      subscriptionsFreeActive,
      subscriptionsProfessorProActive,

      upgradesOpen,
      upgradesContactPending,
      upgradesQualified,
      upgradesApproved,
      upgradesConverted,

      organizationsTotal,
      organizationsActive,
      schoolsTotal,

      supportOpen,
      supportInAnalysis,
      supportWaitingSupport,
      supportWaitingUser,
      supportUrgent,
      supportHigh,

      agendaEvents,
      agendaPlanning,
      agendaEvidences,

      academyCourses,
      academyEnrollments,
    ] = await Promise.all([
      client
        .from('user_profiles')
        .select('*', {
          count: 'exact',
          head: true,
        }),

      client
        .from('user_profiles')
        .select('*', {
          count: 'exact',
          head: true,
        })
        .eq('status', 'active'),

      client
        .from('user_profiles')
        .select('*', {
          count: 'exact',
          head: true,
        })
        .gte(
          'created_at',
          sevenDaysAgo,
        ),

      client
        .from('user_profiles')
        .select('*', {
          count: 'exact',
          head: true,
        })
        .gte(
          'created_at',
          thirtyDaysAgo,
        ),

      client
        .from('subscriptions')
        .select('*', {
          count: 'exact',
          head: true,
        })
        .in('status', [
          'active',
          'trialing',
          'past_due',
        ]),

      freePlan?.id
        ? client
            .from('subscriptions')
            .select('*', {
              count: 'exact',
              head: true,
            })
            .eq(
              'plan_id',
              freePlan.id,
            )
            .in('status', [
              'active',
              'trialing',
              'past_due',
            ])
        : Promise.resolve({
            count: 0,
            error: null,
          }),

      professorProPlan?.id
        ? client
            .from('subscriptions')
            .select('*', {
              count: 'exact',
              head: true,
            })
            .eq(
              'plan_id',
              professorProPlan.id,
            )
            .in('status', [
              'active',
              'trialing',
              'past_due',
            ])
        : Promise.resolve({
            count: 0,
            error: null,
          }),

      client
        .from('upgrade_requests')
        .select('*', {
          count: 'exact',
          head: true,
        })
        .in('status', [
          'requested',
          'contact_pending',
          'contacted',
          'qualified',
          'proposal_sent',
          'approved',
        ]),

      client
        .from('upgrade_requests')
        .select('*', {
          count: 'exact',
          head: true,
        })
        .eq(
          'status',
          'contact_pending',
        ),

      client
        .from('upgrade_requests')
        .select('*', {
          count: 'exact',
          head: true,
        })
        .eq(
          'status',
          'qualified',
        ),

      client
        .from('upgrade_requests')
        .select('*', {
          count: 'exact',
          head: true,
        })
        .eq(
          'status',
          'approved',
        ),

      client
        .from('upgrade_requests')
        .select('*', {
          count: 'exact',
          head: true,
        })
        .eq(
          'status',
          'converted',
        ),

      client
        .from('organizations')
        .select('*', {
          count: 'exact',
          head: true,
        }),

      client
        .from('organizations')
        .select('*', {
          count: 'exact',
          head: true,
        })
        .eq('status', 'active'),

      client
        .from('schools')
        .select('*', {
          count: 'exact',
          head: true,
        }),

      client
        .from('support_tickets')
        .select('*', {
          count: 'exact',
          head: true,
        })
        .in('status', [
          'open',
          'reopened',
        ]),

      client
        .from('support_tickets')
        .select('*', {
          count: 'exact',
          head: true,
        })
        .eq(
          'status',
          'in_analysis',
        ),

      client
        .from('support_tickets')
        .select('*', {
          count: 'exact',
          head: true,
        })
        .eq(
          'status',
          'waiting_support',
        ),

      client
        .from('support_tickets')
        .select('*', {
          count: 'exact',
          head: true,
        })
        .eq(
          'status',
          'waiting_user',
        ),

      client
        .from('support_tickets')
        .select('*', {
          count: 'exact',
          head: true,
        })
        .eq(
          'priority',
          'urgent',
        )
        .not(
          'status',
          'in',
          '("resolved","closed")',
        ),

      client
        .from('support_tickets')
        .select('*', {
          count: 'exact',
          head: true,
        })
        .eq(
          'priority',
          'high',
        )
        .not(
          'status',
          'in',
          '("resolved","closed")',
        ),

      client
        .from('agenda_events')
        .select('*', {
          count: 'exact',
          head: true,
        }),

      client
        .from('agenda_planning')
        .select('*', {
          count: 'exact',
          head: true,
        }),

      client
        .from('agenda_evidences')
        .select('*', {
          count: 'exact',
          head: true,
        }),

      client
        .from('academy_courses')
        .select('*', {
          count: 'exact',
          head: true,
        }),

      client
        .from('academy_enrollments')
        .select('*', {
          count: 'exact',
          head: true,
        }),
    ])

    return {
      users: {
        total: normalizeCount(
          usersTotal,
          'Erro ao contar usuários',
        ),

        active: normalizeCount(
          usersActive,
          'Erro ao contar usuários ativos',
        ),

        newLast7Days:
          normalizeCount(
            usersLast7Days,
            'Erro ao contar novos usuários dos últimos 7 dias',
          ),

        newLast30Days:
          normalizeCount(
            usersLast30Days,
            'Erro ao contar novos usuários dos últimos 30 dias',
          ),
      },

      subscriptions: {
        totalActive:
          normalizeCount(
            subscriptionsTotalActive,
            'Erro ao contar assinaturas ativas',
          ),

        freeActive:
          normalizeCount(
            subscriptionsFreeActive,
            'Erro ao contar assinaturas Free',
          ),

        professorProActive:
          normalizeCount(
            subscriptionsProfessorProActive,
            'Erro ao contar assinaturas Professor Pro',
          ),
      },

      upgrades: {
        open: normalizeCount(
          upgradesOpen,
          'Erro ao contar solicitações de upgrade abertas',
        ),

        contactPending:
          normalizeCount(
            upgradesContactPending,
            'Erro ao contar contatos pendentes',
          ),

        qualified:
          normalizeCount(
            upgradesQualified,
            'Erro ao contar oportunidades qualificadas',
          ),

        approved:
          normalizeCount(
            upgradesApproved,
            'Erro ao contar upgrades aprovados',
          ),

        converted:
          normalizeCount(
            upgradesConverted,
            'Erro ao contar upgrades convertidos',
          ),
      },

      organizations: {
        total: normalizeCount(
          organizationsTotal,
          'Erro ao contar organizações',
        ),

        active: normalizeCount(
          organizationsActive,
          'Erro ao contar organizações ativas',
        ),
      },

      schools: {
        total: normalizeCount(
          schoolsTotal,
          'Erro ao contar escolas',
        ),
      },

      support: {
        open:
          normalizeCount(
            supportOpen,
            'Erro ao contar chamados abertos',
          ),

        inService:
          normalizeCount(
            supportInAnalysis,
            'Erro ao contar chamados em análise',
          ) +
          normalizeCount(
            supportWaitingSupport,
            'Erro ao contar chamados aguardando suporte',
          ),

        waitingUser:
          normalizeCount(
            supportWaitingUser,
            'Erro ao contar chamados aguardando usuário',
          ),

        urgent:
          normalizeCount(
            supportUrgent,
            'Erro ao contar chamados urgentes',
          ),

        highPriority:
          normalizeCount(
            supportHigh,
            'Erro ao contar chamados de prioridade alta',
          ),
      },

      agenda: {
        events: normalizeCount(
          agendaEvents,
          'Erro ao contar eventos da Agenda',
        ),

        planning:
          normalizeCount(
            agendaPlanning,
            'Erro ao contar planejamentos',
          ),

        evidences:
          normalizeCount(
            agendaEvidences,
            'Erro ao contar evidências',
          ),
      },

      academy: {
        courses: normalizeCount(
          academyCourses,
          'Erro ao contar cursos da Academy',
        ),

        enrollments:
          normalizeCount(
            academyEnrollments,
            'Erro ao contar matrículas da Academy',
          ),
      },
    }
  }
}

export const adminDashboardRepository =
  new AdminDashboardRepository()