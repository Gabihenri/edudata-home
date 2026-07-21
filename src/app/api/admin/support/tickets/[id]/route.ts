import {
  createClient,
  type SupabaseClient,
} from '@supabase/supabase-js'

import {
  NextRequest,
  NextResponse,
} from 'next/server'

import { requireSessionUser } from '@/lib/auth/session'

export const dynamic =
  'force-dynamic'

type RouteContext = {
  params: {
    id: string
  }
}

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

type MessageVisibility =
  | 'shared'
  | 'internal'

type SupportStatus =
  | 'open'
  | 'in_analysis'
  | 'waiting_user'
  | 'waiting_support'
  | 'resolved'
  | 'closed'
  | 'reopened'

type SupportImpact =
  | 'single_user'
  | 'multiple_users'
  | 'school'
  | 'organization'
  | 'network'
  | 'platform'

type SupportUrgency =
  | 'low'
  | 'normal'
  | 'high'
  | 'critical'

type SupportPriority =
  | 'low'
  | 'normal'
  | 'high'
  | 'urgent'

type ManagementAction =
  | 'status'
  | 'assign'
  | 'assign_self'
  | 'classify'

type PostBody = {
  message?: unknown
  visibility?: unknown
}

type PatchBody = {
  action?: unknown
  status?: unknown
  reason?: unknown
  assigneeUserId?: unknown
  impact?: unknown
  urgency?: unknown
  manualPriority?: unknown
}

type ActiveStaffMember = {
  id: string
  userId: string
  displayName: string
  role: string
  roleLabel: string
  status: string
  canViewAll: boolean
  canAssign: boolean
  canManageStaff: boolean
}

const NO_CACHE_HEADERS = {
  'Cache-Control':
    'no-store, no-cache, must-revalidate',
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const SUPPORT_STATUSES:
  readonly SupportStatus[] = [
    'open',
    'in_analysis',
    'waiting_user',
    'waiting_support',
    'resolved',
    'closed',
    'reopened',
  ]

const MESSAGE_VISIBILITIES:
  readonly MessageVisibility[] = [
    'shared',
    'internal',
  ]

const SUPPORT_IMPACTS:
  readonly SupportImpact[] = [
    'single_user',
    'multiple_users',
    'school',
    'organization',
    'network',
    'platform',
  ]

const SUPPORT_URGENCIES:
  readonly SupportUrgency[] = [
    'low',
    'normal',
    'high',
    'critical',
  ]

const SUPPORT_PRIORITIES:
  readonly SupportPriority[] = [
    'low',
    'normal',
    'high',
    'urgent',
  ]

const MANAGEMENT_ACTIONS:
  readonly ManagementAction[] = [
    'status',
    'assign',
    'assign_self',
    'classify',
  ]

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

function normalizeTicketId(
  value: unknown,
): string {
  return normalizeUuid(
    value,
    'O identificador do chamado',
  )
}

function normalizeUuid(
  value: unknown,
  fieldName: string,
): string {
  if (
    typeof value !==
    'string'
  ) {
    throw new Error(
      `${fieldName} é inválido.`,
    )
  }

  const normalizedValue =
    value.trim()

  if (
    !UUID_PATTERN.test(
      normalizedValue,
    )
  ) {
    throw new Error(
      `${fieldName} é inválido.`,
    )
  }

  return normalizedValue
}

function normalizeRequiredText(
  value: unknown,
  fieldName: string,
  maximumLength: number,
): string {
  if (
    typeof value !==
    'string'
  ) {
    throw new Error(
      `${fieldName} é obrigatório.`,
    )
  }

  const normalizedValue =
    value.trim()

  if (!normalizedValue) {
    throw new Error(
      `${fieldName} é obrigatório.`,
    )
  }

  if (
    normalizedValue.length >
    maximumLength
  ) {
    throw new Error(
      `${fieldName} ultrapassa ${maximumLength} caracteres.`,
    )
  }

  return normalizedValue
}

function normalizeOptionalText(
  value: unknown,
  maximumLength: number,
): string | null {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return null
  }

  if (
    typeof value !==
    'string'
  ) {
    throw new Error(
      'O texto informado é inválido.',
    )
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
      `O texto informado ultrapassa ${maximumLength} caracteres.`,
    )
  }

  return normalizedValue
}

function normalizeEnum<
  T extends string,
>(
  value: unknown,
  allowedValues: readonly T[],
  fieldName: string,
): T {
  if (
    typeof value !==
    'string'
  ) {
    throw new Error(
      `${fieldName} é inválido.`,
    )
  }

  const normalizedValue =
    value
      .trim()
      .toLowerCase()

  if (
    !allowedValues.includes(
      normalizedValue as T,
    )
  ) {
    throw new Error(
      `${fieldName} é inválido.`,
    )
  }

  return normalizedValue as T
}

function normalizeOptionalEnum<
  T extends string,
>(
  value: unknown,
  allowedValues: readonly T[],
  fieldName: string,
): T | null {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return null
  }

  return normalizeEnum(
    value,
    allowedValues,
    fieldName,
  )
}

function getRoleLabel(
  role: string,
): string {
  if (
    role ===
    'administrator'
  ) {
    return 'Administrador'
  }

  if (
    role ===
    'manager'
  ) {
    return 'Gestor'
  }

  return 'Agente'
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
      'não possui permissão',
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
      'obrigatório',
    ) ||
    message.includes(
      'obrigatória',
    ) ||
    message.includes(
      'inválido',
    ) ||
    message.includes(
      'inválida',
    ) ||
    message.includes(
      'ultrapassa',
    ) ||
    message.includes(
      'justificativa',
    ) ||
    message.includes(
      'precisa ser reaberto',
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
  const status =
    getErrorStatus(error)

  const message =
    status >= 500
      ? fallbackMessage
      : error instanceof Error
        ? error.message
        : fallbackMessage

  return NextResponse.json(
    {
      success: false,
      error: message,
    },
    {
      status,
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

async function requireTicketAccess(
  supabase: SupabaseClient,
  ticketId: string,
) {
  const {
    data,
    error,
  } =
    await supabase
      .from(
        'support_ticket_operations',
      )
      .select('*')
      .eq(
        'id',
        ticketId,
      )
      .maybeSingle()

  if (error) {
    throw new Error(
      error.message,
    )
  }

  if (!data) {
    throw new Error(
      'Chamado não encontrado ou sem permissão de acesso.',
    )
  }

  return data
}

async function loadActiveStaffMembers(
  supabase: SupabaseClient,
  currentUserId: string,
  staff: SupportStaffContext,
): Promise<ActiveStaffMember[]> {
  if (!staff.canAssign) {
    return [
      {
        id:
          staff.id,

        userId:
          staff.userId,

        displayName:
          'Você',

        role:
          staff.role,

        roleLabel:
          getRoleLabel(
            staff.role,
          ),

        status:
          'active',

        canViewAll:
          staff.canViewAll,

        canAssign:
          staff.canAssign,

        canManageStaff:
          staff.canManageStaff,
      },
    ]
  }

  const {
    data,
    error,
  } =
    await supabase.rpc(
      'list_active_support_staff',
    )

  if (error) {
    throw new Error(
      error.message,
    )
  }

  return (
    data ?? []
  ).map(
    member => {
      const userId =
        String(
          member.user_id,
        )

      const role =
        String(
          member.staff_role,
        )

      const originalDisplayName =
        typeof member.display_name ===
          'string' &&
        member.display_name.trim()
          ? member.display_name.trim()
          : 'Operador de suporte'

      return {
        id:
          String(
            member.id,
          ),

        userId,

        displayName:
          userId ===
          currentUserId
            ? `${originalDisplayName} (você)`
            : originalDisplayName,

        role,

        roleLabel:
          getRoleLabel(role),

        status:
          String(
            member.status,
          ),

        canViewAll:
          member.can_view_all ===
          true,

        canAssign:
          member.can_assign ===
          true,

        canManageStaff:
          member
            .can_manage_staff ===
          true,
      }
    },
  )
}

async function loadTicketDetail(
  supabase: SupabaseClient,
  ticketId: string,
  currentUserId: string,
  staff: SupportStaffContext,
) {
  const ticket =
    await requireTicketAccess(
      supabase,
      ticketId,
    )

  const [
    messagesResult,
    statusHistoryResult,
    assignmentHistoryResult,
    priorityHistoryResult,
    slaHistoryResult,
    markReadResult,
    staffMembers,
  ] =
    await Promise.all([
      supabase
        .from(
          'support_messages',
        )
        .select(`
          id,
          ticket_id,
          author_user_id,
          author_type,
          visibility,
          message_type,
          body,
          metadata,
          created_at
        `)
        .eq(
          'ticket_id',
          ticketId,
        )
        .order(
          'created_at',
          {
            ascending: true,
          },
        ),

      supabase
        .from(
          'support_status_history',
        )
        .select(`
          id,
          ticket_id,
          previous_status,
          new_status,
          changed_by_user_id,
          actor_type,
          visibility,
          reason,
          created_at
        `)
        .eq(
          'ticket_id',
          ticketId,
        )
        .order(
          'created_at',
          {
            ascending: true,
          },
        ),

      supabase
        .from(
          'support_assignment_history',
        )
        .select(`
          id,
          ticket_id,
          previous_assignee_user_id,
          new_assignee_user_id,
          changed_by_user_id,
          reason,
          created_at
        `)
        .eq(
          'ticket_id',
          ticketId,
        )
        .order(
          'created_at',
          {
            ascending: true,
          },
        ),

      supabase
        .from(
          'support_priority_history',
        )
        .select(`
          id,
          ticket_id,
          previous_priority,
          new_priority,
          previous_score,
          new_score,
          previous_impact,
          new_impact,
          previous_urgency,
          new_urgency,
          changed_by_user_id,
          change_source,
          reason,
          metadata,
          created_at
        `)
        .eq(
          'ticket_id',
          ticketId,
        )
        .order(
          'created_at',
          {
            ascending: true,
          },
        ),

      supabase
        .from(
          'support_sla_history',
        )
        .select(`
          id,
          ticket_id,
          sla_policy_id,
          event_type,
          previous_clock_status,
          new_clock_status,
          due_at,
          event_at,
          changed_by_user_id,
          reason,
          metadata,
          created_at
        `)
        .eq(
          'ticket_id',
          ticketId,
        )
        .order(
          'created_at',
          {
            ascending: true,
          },
        ),

      supabase.rpc(
        'mark_support_ticket_read',
        {
          p_ticket_id:
            ticketId,
        },
      ),

      loadActiveStaffMembers(
        supabase,
        currentUserId,
        staff,
      ),
    ])

  if (messagesResult.error) {
    throw new Error(
      messagesResult.error.message,
    )
  }

  if (statusHistoryResult.error) {
    throw new Error(
      statusHistoryResult.error.message,
    )
  }

  if (
    assignmentHistoryResult.error
  ) {
    throw new Error(
      assignmentHistoryResult
        .error.message,
    )
  }

  if (priorityHistoryResult.error) {
    throw new Error(
      priorityHistoryResult
        .error.message,
    )
  }

  if (slaHistoryResult.error) {
    throw new Error(
      slaHistoryResult
        .error.message,
    )
  }

  if (markReadResult.error) {
    throw new Error(
      markReadResult.error.message,
    )
  }

  return {
    ticket,

    messages:
      messagesResult.data ??
      [],

    statusHistory:
      statusHistoryResult.data ??
      [],

    assignmentHistory:
      assignmentHistoryResult.data ??
      [],

    priorityHistory:
      priorityHistoryResult.data ??
      [],

    slaHistory:
      slaHistoryResult.data ??
      [],

    staffMembers,

    markedReadCount:
      typeof markReadResult.data ===
        'number'
        ? markReadResult.data
        : 0,
  }
}

async function prepareRequest(
  request: NextRequest,
) {
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

  return {
    sessionUser,
    supabase,
    staff,
  }
}

export async function GET(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const {
      sessionUser,
      supabase,
      staff,
    } =
      await prepareRequest(
        request,
      )

    const ticketId =
      normalizeTicketId(
        context.params.id,
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

    const data =
      await loadTicketDetail(
        supabase,
        ticketId,
        sessionUser.id,
        staff,
      )

    return NextResponse.json(
      {
        success: true,

        scope: {
          currentUserId:
            sessionUser.id,

          staffRole:
            staff.role,

          canViewAll:
            staff.canViewAll,

          canAssign:
            staff.canAssign,

          canManageStaff:
            staff.canManageStaff,
        },

        data,
      },
      {
        status: 200,
        headers:
          NO_CACHE_HEADERS,
      },
    )
  } catch (error) {
    console.error(
      '[ADMIN_SUPPORT_TICKET_GET_ERROR]',
      error,
    )

    return createErrorResponse(
      error,
      'Não foi possível carregar o atendimento administrativo.',
    )
  }
}

export async function POST(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const {
      sessionUser,
      supabase,
      staff,
    } =
      await prepareRequest(
        request,
      )

    const ticketId =
      normalizeTicketId(
        context.params.id,
      )

    await requireTicketAccess(
      supabase,
      ticketId,
    )

    const body =
      (await request.json()) as
        PostBody

    const message =
      normalizeRequiredText(
        body.message,
        'A mensagem',
        10000,
      )

    const visibility =
      normalizeEnum(
        body.visibility ??
          'shared',
        MESSAGE_VISIBILITIES,
        'A visibilidade da mensagem',
      )

    const {
      data:
        createdMessageId,
      error:
        createdMessageError,
    } =
      await supabase.rpc(
        'send_support_staff_message',
        {
          p_ticket_id:
            ticketId,

          p_body:
            message,

          p_visibility:
            visibility,

          p_metadata: {
            channel:
              'admin_support',

            origin:
              'admin_ticket_detail_api',

            visibility,

            version:
              'v1.0',
          },
        },
      )

    if (createdMessageError) {
      throw new Error(
        createdMessageError.message,
      )
    }

    const normalizedMessageId =
      normalizeUuid(
        createdMessageId,
        'O identificador da mensagem',
      )

    const data =
      await loadTicketDetail(
        supabase,
        ticketId,
        sessionUser.id,
        staff,
      )

    return NextResponse.json(
      {
        success: true,

        message:
          visibility ===
          'internal'
            ? 'Nota interna registrada com sucesso.'
            : 'Resposta enviada ao solicitante com sucesso.',

        createdMessageId:
          normalizedMessageId,

        data,
      },
      {
        status: 201,
        headers:
          NO_CACHE_HEADERS,
      },
    )
  } catch (error) {
    console.error(
      '[ADMIN_SUPPORT_TICKET_POST_ERROR]',
      error,
    )

    return createErrorResponse(
      error,
      'Não foi possível registrar a mensagem administrativa.',
    )
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const {
      sessionUser,
      supabase,
      staff,
    } =
      await prepareRequest(
        request,
      )

    const ticketId =
      normalizeTicketId(
        context.params.id,
      )

    await requireTicketAccess(
      supabase,
      ticketId,
    )

    const body =
      (await request.json()) as
        PatchBody

    const action =
      normalizeEnum(
        body.action,
        MANAGEMENT_ACTIONS,
        'A ação administrativa',
      )

    let successMessage =
      'Chamado atualizado com sucesso.'

    if (action === 'status') {
      const status =
        normalizeEnum(
          body.status,
          SUPPORT_STATUSES,
          'O status',
        )

      const reason =
        normalizeOptionalText(
          body.reason,
          1000,
        )

      if (
        (
          status ===
            'resolved' ||
          status ===
            'closed'
        ) &&
        !reason
      ) {
        throw new Error(
          'A resolução ou o encerramento exige uma justificativa.',
        )
      }

      const {
        error,
      } =
        await supabase.rpc(
          'change_support_staff_ticket_status',
          {
            p_ticket_id:
              ticketId,

            p_new_status:
              status,

            p_reason:
              reason,
          },
        )

      if (error) {
        throw new Error(
          error.message,
        )
      }

      successMessage =
        'Status atualizado com sucesso.'
    }

    if (action === 'assign') {
      if (!staff.canAssign) {
        throw new Error(
          'Usuário sem permissão para atribuir chamados.',
        )
      }

      const assigneeUserId =
        normalizeUuid(
          body.assigneeUserId,
          'O responsável',
        )

      const reason =
        normalizeOptionalText(
          body.reason,
          1000,
        )

      const {
        error,
      } =
        await supabase.rpc(
          'assign_support_ticket',
          {
            p_ticket_id:
              ticketId,

            p_assignee_user_id:
              assigneeUserId,

            p_reason:
              reason,
          },
        )

      if (error) {
        throw new Error(
          error.message,
        )
      }

      successMessage =
        'Responsável atribuído com sucesso.'
    }

    if (
      action ===
      'assign_self'
    ) {
      if (!staff.canAssign) {
        throw new Error(
          'Usuário sem permissão para atribuir chamados.',
        )
      }

      const reason =
        normalizeOptionalText(
          body.reason,
          1000,
        ) ??
        'Chamado assumido pelo operador atual.'

      const {
        error,
      } =
        await supabase.rpc(
          'assign_support_ticket',
          {
            p_ticket_id:
              ticketId,

            p_assignee_user_id:
              sessionUser.id,

            p_reason:
              reason,
          },
        )

      if (error) {
        throw new Error(
          error.message,
        )
      }

      successMessage =
        'Chamado atribuído a você com sucesso.'
    }

    if (
      action ===
      'classify'
    ) {
      const impact =
        normalizeEnum(
          body.impact,
          SUPPORT_IMPACTS,
          'O impacto',
        )

      const urgency =
        normalizeEnum(
          body.urgency,
          SUPPORT_URGENCIES,
          'A urgência',
        )

      const manualPriority =
        normalizeOptionalEnum(
          body.manualPriority,
          SUPPORT_PRIORITIES,
          'A prioridade manual',
        )

      const reason =
        normalizeOptionalText(
          body.reason,
          1000,
        )

      if (
        manualPriority &&
        !reason
      ) {
        throw new Error(
          'A prioridade manual exige uma justificativa.',
        )
      }

      const {
        error,
      } =
        await supabase.rpc(
          'classify_support_ticket',
          {
            p_ticket_id:
              ticketId,

            p_impact:
              impact,

            p_urgency:
              urgency,

            p_manual_priority:
              manualPriority,

            p_reason:
              reason,
          },
        )

      if (error) {
        throw new Error(
          error.message,
        )
      }

      successMessage =
        'Classificação atualizada com sucesso.'
    }

    const data =
      await loadTicketDetail(
        supabase,
        ticketId,
        sessionUser.id,
        staff,
      )

    return NextResponse.json(
      {
        success: true,

        message:
          successMessage,

        data,
      },
      {
        status: 200,
        headers:
          NO_CACHE_HEADERS,
      },
    )
  } catch (error) {
    console.error(
      '[ADMIN_SUPPORT_TICKET_PATCH_ERROR]',
      error,
    )

    return createErrorResponse(
      error,
      'Não foi possível atualizar o atendimento administrativo.',
    )
  }
}