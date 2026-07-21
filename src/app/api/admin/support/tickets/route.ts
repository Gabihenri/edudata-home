import {
  createClient,
  type SupabaseClient,
} from '@supabase/supabase-js'

import {
  NextRequest,
  NextResponse,
} from 'next/server'

import { requireSessionUser } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

type SupportStatus =
  | 'open'
  | 'in_analysis'
  | 'waiting_user'
  | 'waiting_support'
  | 'resolved'
  | 'closed'
  | 'reopened'

type OperationalStatus =
  | 'open'
  | 'in_service'
  | 'waiting_user'
  | 'closed'

type SupportPriority =
  | 'low'
  | 'normal'
  | 'high'
  | 'urgent'

type SupportCategory =
  | 'technical'
  | 'access'
  | 'billing'
  | 'product'
  | 'pedagogical'
  | 'privacy'
  | 'suggestion'
  | 'other'

type SlaLight =
  | 'green'
  | 'yellow'
  | 'orange'
  | 'red'
  | 'gray'

type AccountType =
  | 'individual'
  | 'corporate'
  | 'platform'

type ServiceTier =
  | 'individual_free'
  | 'individual_pro'
  | 'institutional'
  | 'network'
  | 'platform'

type AssignmentFilter =
  | 'all'
  | 'assigned'
  | 'unassigned'
  | 'mine'

type SortMode =
  | 'sla'
  | 'priority'
  | 'oldest'
  | 'newest'
  | 'updated'

type SupportStaffRole =
  | 'agent'
  | 'manager'
  | 'administrator'

type SupportStaffContext = {
  id: string
  userId: string
  role: SupportStaffRole
  canViewAll: boolean
  canAssign: boolean
  canManageStaff: boolean
}

const NO_CACHE_HEADERS = {
  'Cache-Control':
    'no-store, no-cache, must-revalidate',
}

const SUPPORT_STATUSES: SupportStatus[] = [
  'open',
  'in_analysis',
  'waiting_user',
  'waiting_support',
  'resolved',
  'closed',
  'reopened',
]

const OPERATIONAL_STATUSES: OperationalStatus[] = [
  'open',
  'in_service',
  'waiting_user',
  'closed',
]

const SUPPORT_PRIORITIES: SupportPriority[] = [
  'low',
  'normal',
  'high',
  'urgent',
]

const SUPPORT_CATEGORIES: SupportCategory[] = [
  'technical',
  'access',
  'billing',
  'product',
  'pedagogical',
  'privacy',
  'suggestion',
  'other',
]

const SLA_LIGHTS: SlaLight[] = [
  'green',
  'yellow',
  'orange',
  'red',
  'gray',
]

const ACCOUNT_TYPES: AccountType[] = [
  'individual',
  'corporate',
  'platform',
]

const SERVICE_TIERS: ServiceTier[] = [
  'individual_free',
  'individual_pro',
  'institutional',
  'network',
  'platform',
]

const ASSIGNMENT_FILTERS: AssignmentFilter[] = [
  'all',
  'assigned',
  'unassigned',
  'mine',
]

const SORT_MODES: SortMode[] = [
  'sla',
  'priority',
  'oldest',
  'newest',
  'updated',
]

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

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

function normalizeOptionalText(
  value: string | null,
  maximumLength: number,
): string | null {
  if (!value) {
    return null
  }

  const normalizedValue =
    value.trim()

  if (!normalizedValue) {
    return null
  }

  if (
    normalizedValue.length >
    maximumLength
  ) {
    throw new Error(
      `O valor informado ultrapassa ${maximumLength} caracteres.`,
    )
  }

  return normalizedValue
}

function normalizeCodeFilter(
  value: string | null,
  fieldName: string,
): string | null {
  const normalizedValue =
    normalizeOptionalText(
      value,
      120,
    )

  if (!normalizedValue) {
    return null
  }

  const code =
    normalizedValue.toLowerCase()

  if (
    !/^[a-z0-9][a-z0-9._-]*$/.test(
      code,
    )
  ) {
    throw new Error(
      `${fieldName} possui formato inválido.`,
    )
  }

  return code
}

function normalizeUuidFilter(
  value: string | null,
  fieldName: string,
): string | null {
  const normalizedValue =
    normalizeOptionalText(
      value,
      50,
    )

  if (!normalizedValue) {
    return null
  }

  if (
    !UUID_PATTERN.test(
      normalizedValue,
    )
  ) {
    throw new Error(
      `${fieldName} possui identificador inválido.`,
    )
  }

  return normalizedValue
}

function normalizeEnumFilter<
  T extends string,
>(
  value: string | null,
  allowedValues: readonly T[],
  fieldName: string,
): T | null {
  const normalizedValue =
    normalizeOptionalText(
      value,
      80,
    )?.toLowerCase()

  if (!normalizedValue) {
    return null
  }

  if (
    !allowedValues.includes(
      normalizedValue as T,
    )
  ) {
    throw new Error(
      `${fieldName} possui valor inválido.`,
    )
  }

  return normalizedValue as T
}

function normalizePositiveInteger(
  value: string | null,
  fieldName: string,
  fallbackValue: number,
  minimumValue: number,
  maximumValue: number,
): number {
  if (!value) {
    return fallbackValue
  }

  const parsedValue =
    Number.parseInt(
      value,
      10,
    )

  if (
    !Number.isInteger(
      parsedValue,
    ) ||
    parsedValue <
      minimumValue ||
    parsedValue >
      maximumValue
  ) {
    throw new Error(
      `${fieldName} deve estar entre ${minimumValue} e ${maximumValue}.`,
    )
  }

  return parsedValue
}

function normalizeSearch(
  value: string | null,
): string | null {
  const normalizedValue =
    normalizeOptionalText(
      value,
      100,
    )

  if (!normalizedValue) {
    return null
  }

  const safeValue =
    normalizedValue
      .replace(
        /[,*()%_\\]/g,
        ' ',
      )
      .replace(
        /\s+/g,
        ' ',
      )
      .trim()

  return safeValue || null
}

function getErrorStatus(
  error: unknown,
): number {
  if (
    error instanceof
      SyntaxError
  ) {
    return 400
  }

  if (
    !(error instanceof Error)
  ) {
    return 500
  }

  const message =
    error.message.toLowerCase()

  if (
    message.includes(
      'não autenticado',
    ) ||
    message.includes(
      'unauthorized',
    )
  ) {
    return 401
  }

  if (
    message.includes(
      'não pertence à equipe',
    ) ||
    message.includes(
      'sem permissão',
    ) ||
    message.includes(
      'permission denied',
    ) ||
    message.includes(
      'forbidden',
    )
  ) {
    return 403
  }

  if (
    message.includes(
      'não encontrado',
    )
  ) {
    return 404
  }

  if (
    message.includes(
      'inválido',
    ) ||
    message.includes(
      'inválida',
    ) ||
    message.includes(
      'deve estar entre',
    ) ||
    message.includes(
      'ultrapassa',
    )
  ) {
    return 400
  }

  return 500
}

function createErrorResponse(
  error: unknown,
  fallbackMessage: string,
) {
  const message =
    error instanceof Error
      ? error.message
      : fallbackMessage

  return NextResponse.json(
    {
      success: false,
      error: message,
    },
    {
      status:
        getErrorStatus(error),

      headers:
        NO_CACHE_HEADERS,
    },
  )
}

async function requireSupportStaff(
  supabase: SupabaseClient,
  userId: string,
): Promise<SupportStaffContext> {
  const {
    data,
    error,
  } =
    await supabase
      .from(
        'support_staff_members',
      )
      .select(`
        id,
        user_id,
        staff_role,
        status,
        can_view_all,
        can_assign,
        can_manage_staff
      `)
      .eq(
        'user_id',
        userId,
      )
      .maybeSingle()

  if (error) {
    throw new Error(
      error.message,
    )
  }

  if (
    !data ||
    data.status !== 'active'
  ) {
    throw new Error(
      'Usuário não pertence à equipe ativa de suporte.',
    )
  }

  if (
    data.staff_role !==
      'agent' &&
    data.staff_role !==
      'manager' &&
    data.staff_role !==
      'administrator'
  ) {
    throw new Error(
      'O papel da equipe de suporte é inválido.',
    )
  }

  return {
    id:
      String(data.id),

    userId:
      String(data.user_id),

    role:
      data.staff_role,

    canViewAll:
      data.can_view_all ===
      true,

    canAssign:
      data.can_assign ===
      true,

    canManageStaff:
      data.can_manage_staff ===
      true,
  }
}

function applySort(
  query: any,
  sort: SortMode,
) {
  if (sort === 'priority') {
    return query
      .order(
        'priority_sort_rank',
        {
          ascending: true,
        },
      )
      .order(
        'sla_sort_rank',
        {
          ascending: true,
        },
      )
      .order(
        'requester_sort_rank',
        {
          ascending: true,
        },
      )
      .order(
        'created_at',
        {
          ascending: true,
        },
      )
  }

  if (sort === 'oldest') {
    return query.order(
      'created_at',
      {
        ascending: true,
      },
    )
  }

  if (sort === 'newest') {
    return query.order(
      'created_at',
      {
        ascending: false,
      },
    )
  }

  if (sort === 'updated') {
    return query.order(
      'updated_at',
      {
        ascending: false,
      },
    )
  }

  return query
    .order(
      'sla_sort_rank',
      {
        ascending: true,
      },
    )
    .order(
      'priority_sort_rank',
      {
        ascending: true,
      },
    )
    .order(
      'requester_sort_rank',
      {
        ascending: true,
      },
    )
    .order(
      'created_at',
      {
        ascending: true,
      },
    )
}

export async function GET(
  request: NextRequest,
) {
  try {
    const sessionUser =
      await requireSessionUser()

    if (!sessionUser?.id) {
      throw new Error(
        'Usuário não autenticado.',
      )
    }

    const accessToken =
      getAccessToken(request)

    const supabase =
      createAuthenticatedClient(
        accessToken,
      )

    const staff =
      await requireSupportStaff(
        supabase,
        sessionUser.id,
      )

    const searchParams =
      request.nextUrl.searchParams

    const status =
      normalizeEnumFilter(
        searchParams.get(
          'status',
        ),
        SUPPORT_STATUSES,
        'O filtro de status',
      )

    const operationalStatus =
      normalizeEnumFilter(
        searchParams.get(
          'operationalStatus',
        ),
        OPERATIONAL_STATUSES,
        'O status operacional',
      )

    const priority =
      normalizeEnumFilter(
        searchParams.get(
          'priority',
        ),
        SUPPORT_PRIORITIES,
        'A prioridade',
      )

    const category =
      normalizeEnumFilter(
        searchParams.get(
          'category',
        ),
        SUPPORT_CATEGORIES,
        'A categoria',
      )

    const slaLight =
      normalizeEnumFilter(
        searchParams.get(
          'sla',
        ),
        SLA_LIGHTS,
        'O farol de SLA',
      )

    const accountType =
      normalizeEnumFilter(
        searchParams.get(
          'accountType',
        ),
        ACCOUNT_TYPES,
        'O tipo de conta',
      )

    const serviceTier =
      normalizeEnumFilter(
        searchParams.get(
          'serviceTier',
        ),
        SERVICE_TIERS,
        'O nível de serviço',
      )

    const assignment =
      normalizeEnumFilter(
        searchParams.get(
          'assignment',
        ),
        ASSIGNMENT_FILTERS,
        'O filtro de atribuição',
      ) ?? 'all'

    const sort =
      normalizeEnumFilter(
        searchParams.get(
          'sort',
        ),
        SORT_MODES,
        'A ordenação',
      ) ?? 'sla'

    const productCode =
      normalizeCodeFilter(
        searchParams.get(
          'productCode',
        ),
        'O produto',
      )

    const requesterRole =
      normalizeCodeFilter(
        searchParams.get(
          'requesterRole',
        ),
        'O perfil do solicitante',
      )

    const organizationId =
      normalizeUuidFilter(
        searchParams.get(
          'organizationId',
        ),
        'A instituição',
      )

    const schoolId =
      normalizeUuidFilter(
        searchParams.get(
          'schoolId',
        ),
        'A escola',
      )

    const assignedToUserId =
      normalizeUuidFilter(
        searchParams.get(
          'assignedToUserId',
        ),
        'O responsável',
      )

    const search =
      normalizeSearch(
        searchParams.get(
          'search',
        ),
      )

    const page =
      normalizePositiveInteger(
        searchParams.get(
          'page',
        ),
        'A página',
        1,
        1,
        10000,
      )

    const limit =
      normalizePositiveInteger(
        searchParams.get(
          'limit',
        ),
        'O limite',
        50,
        1,
        100,
      )

    const {
      error:
        refreshError,
    } =
      await supabase.rpc(
        'refresh_support_sla_state',
      )

    if (refreshError) {
      throw new Error(
        refreshError.message,
      )
    }

    let metrics:
      Record<
        string,
        unknown
      > | null = null

    if (staff.canViewAll) {
      const {
        data:
          metricsData,

        error:
          metricsError,
      } =
        await supabase
          .from(
            'support_dashboard_metrics',
          )
          .select(`
            total_tickets,
            open_tickets,
            in_service_tickets,
            waiting_user_tickets,
            closed_tickets,
            sla_green,
            sla_yellow,
            sla_orange,
            sla_red,
            unassigned_tickets,
            average_first_response_minutes,
            average_resolution_minutes,
            sla_compliance_percent
          `)
          .single()

      if (metricsError) {
        throw new Error(
          metricsError.message,
        )
      }

      metrics =
        metricsData ?? null
    }

    let queueQuery =
      supabase
        .from(
          'support_ticket_operations',
        )
        .select(`
          id,
          protocol,
          requester_user_id,
          requester_account_type,
          requester_role,
          requester_hierarchy_level,
          requester_plan_code,
          requester_service_tier,
          organization_id,
          school_id,
          product_code,
          source_module,
          source_path,
          category,
          subject,
          requested_priority,
          calculated_priority,
          priority,
          priority_score,
          priority_overridden,
          priority_changed_at,
          impact,
          urgency,
          status,
          operational_status,
          assigned_to_user_id,
          sla_policy_id,
          sla_policy_code,
          sla_policy_name,
          is_contractual,
          warning_percent,
          critical_percent,
          sla_light,
          sla_clock_status,
          sla_started_at,
          active_sla_due_at,
          seconds_until_sla_breach,
          first_response_due_at,
          resolution_due_at,
          first_response_at,
          first_response_breached_at,
          resolution_breached_at,
          sla_paused_at,
          sla_paused_seconds,
          sla_pause_reason,
          last_sla_evaluated_at,
          last_message_at,
          last_requester_message_at,
          last_support_message_at,
          status_changed_at,
          resolved_at,
          closed_at,
          created_at,
          updated_at,
          sla_sort_rank,
          priority_sort_rank,
          requester_sort_rank
        `, {
          count: 'exact',
        })

    /*
     * Integrantes sem can_view_all recebem somente
     * chamados atribuídos a eles. Isso impede que
     * chamados pessoais abertos pelo próprio agente
     * sejam misturados à fila administrativa.
     */
    if (!staff.canViewAll) {
      queueQuery =
        queueQuery.eq(
          'assigned_to_user_id',
          sessionUser.id,
        )
    }

    if (status) {
      queueQuery =
        queueQuery.eq(
          'status',
          status,
        )
    }

    if (operationalStatus) {
      queueQuery =
        queueQuery.eq(
          'operational_status',
          operationalStatus,
        )
    }

    if (priority) {
      queueQuery =
        queueQuery.eq(
          'priority',
          priority,
        )
    }

    if (category) {
      queueQuery =
        queueQuery.eq(
          'category',
          category,
        )
    }

    if (slaLight) {
      queueQuery =
        queueQuery.eq(
          'sla_light',
          slaLight,
        )
    }

    if (accountType) {
      queueQuery =
        queueQuery.eq(
          'requester_account_type',
          accountType,
        )
    }

    if (serviceTier) {
      queueQuery =
        queueQuery.eq(
          'requester_service_tier',
          serviceTier,
        )
    }

    if (productCode) {
      queueQuery =
        queueQuery.eq(
          'product_code',
          productCode,
        )
    }

    if (requesterRole) {
      queueQuery =
        queueQuery.eq(
          'requester_role',
          requesterRole,
        )
    }

    if (organizationId) {
      queueQuery =
        queueQuery.eq(
          'organization_id',
          organizationId,
        )
    }

    if (schoolId) {
      queueQuery =
        queueQuery.eq(
          'school_id',
          schoolId,
        )
    }

    if (
      staff.canViewAll &&
      assignedToUserId
    ) {
      queueQuery =
        queueQuery.eq(
          'assigned_to_user_id',
          assignedToUserId,
        )
    } else if (
      staff.canViewAll &&
      assignment ===
        'assigned'
    ) {
      queueQuery =
        queueQuery.not(
          'assigned_to_user_id',
          'is',
          null,
        )
    } else if (
      staff.canViewAll &&
      assignment ===
        'unassigned'
    ) {
      queueQuery =
        queueQuery.is(
          'assigned_to_user_id',
          null,
        )
    } else if (
      staff.canViewAll &&
      assignment ===
        'mine'
    ) {
      queueQuery =
        queueQuery.eq(
          'assigned_to_user_id',
          sessionUser.id,
        )
    }

    if (search) {
      queueQuery =
        queueQuery.or(
          `protocol.ilike.*${search}*,subject.ilike.*${search}*`,
        )
    }

    queueQuery =
      applySort(
        queueQuery,
        sort,
      )

    const offset =
      (page - 1) *
      limit

    const {
      data,
      error,
      count,
    } =
      await queueQuery.range(
        offset,
        offset + limit - 1,
      )

    if (error) {
      throw new Error(
        error.message,
      )
    }

    const total =
      count ?? 0

    const totalPages =
      total === 0
        ? 0
        : Math.ceil(
            total / limit,
          )

    return NextResponse.json(
      {
        success: true,

        scope: {
          staffRole:
            staff.role,

          canViewAll:
            staff.canViewAll,

          canAssign:
            staff.canAssign,

          canManageStaff:
            staff.canManageStaff,

          queueMode:
            staff.canViewAll
              ? 'all_authorized'
              : 'assigned_to_current_user',

          metricsAvailable:
            staff.canViewAll,
        },

        metrics,

        filters: {
          status,
          operationalStatus,
          priority,
          category,
          slaLight,
          accountType,
          serviceTier,
          productCode,
          requesterRole,
          organizationId,
          schoolId,

          assignment:
            staff.canViewAll
              ? assignment
              : 'mine',

          assignedToUserId:
            staff.canViewAll
              ? assignedToUserId
              : sessionUser.id,

          search,
          sort,
        },

        pagination: {
          page,
          limit,
          total,
          totalPages,

          hasPreviousPage:
            page > 1,

          hasNextPage:
            totalPages > 0 &&
            page < totalPages,
        },

        data:
          data ?? [],
      },
      {
        status: 200,
        headers:
          NO_CACHE_HEADERS,
      },
    )
  } catch (error) {
    console.error(
      '[ADMIN_SUPPORT_TICKETS_GET_ERROR]',
      error,
    )

    return createErrorResponse(
      error,
      'Não foi possível carregar a fila administrativa de suporte.',
    )
  }
}