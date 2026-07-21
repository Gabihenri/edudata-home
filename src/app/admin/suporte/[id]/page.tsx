'use client'

import Link from 'next/link'

import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  useParams,
  usePathname,
} from 'next/navigation'

type StaffRole =
  | 'agent'
  | 'manager'
  | 'administrator'

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

type SupportPriority =
  | 'low'
  | 'normal'
  | 'high'
  | 'urgent'

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

type SlaLight =
  | 'green'
  | 'yellow'
  | 'orange'
  | 'red'
  | 'gray'

type SupportScope = {
  currentUserId: string
  staffRole: StaffRole
  canViewAll: boolean
  canAssign: boolean
  canManageStaff: boolean
}

type SupportTicket = {
  id: string
  protocol: string
  requester_user_id: string
  requester_account_type: string | null
  requester_role: string | null
  requester_service_tier: string | null
  organization_id: string | null
  school_id: string | null
  product_code: string
  category: string
  subject: string
  priority: SupportPriority
  priority_score: number
  priority_overridden: boolean
  impact: SupportImpact
  urgency: SupportUrgency
  status: SupportStatus
  operational_status: string
  assigned_to_user_id: string | null
  sla_policy_code: string | null
  sla_policy_name: string | null
  sla_clock_status: string
  active_sla_due_at: string | null
  first_response_at: string | null
  seconds_until_sla_breach: number | null
  sla_light: SlaLight
  created_at: string
  updated_at: string
}

type SupportMessage = {
  id: string
  author_user_id: string | null
  author_type:
    | 'requester'
    | 'support'
    | 'system'

  visibility: MessageVisibility

  message_type:
    | 'message'
    | 'system_event'

  body: string
  created_at: string
}

type StatusHistoryItem = {
  id: string
  previous_status: SupportStatus | null
  new_status: SupportStatus
  actor_type: string
  reason: string | null
  created_at: string
}

type AssignmentHistoryItem = {
  id: string
  previous_assignee_user_id: string | null
  new_assignee_user_id: string | null
  reason: string | null
  created_at: string
}

type PriorityHistoryItem = {
  id: string
  previous_priority: SupportPriority | null
  new_priority: SupportPriority
  new_score: number | null
  reason: string | null
  created_at: string
}

type SlaHistoryItem = {
  id: string
  event_type: string
  previous_clock_status: string | null
  new_clock_status: string | null
  due_at: string | null
  event_at: string
  reason: string | null
}

type StaffMember = {
  id: string
  userId: string
  displayName: string
  role: string
  roleLabel: string
  status: string
}

type TicketDetail = {
  ticket: SupportTicket
  messages: SupportMessage[]
  statusHistory: StatusHistoryItem[]
  assignmentHistory: AssignmentHistoryItem[]
  priorityHistory: PriorityHistoryItem[]
  slaHistory: SlaHistoryItem[]
  staffMembers: StaffMember[]
  markedReadCount: number
}

type TicketApiResponse = {
  success: boolean
  error?: string
  scope?: SupportScope
  data?: TicketDetail
  message?: string
}

const STATUS_OPTIONS: Array<{
  value: SupportStatus
  label: string
}> = [
  {
    value: 'open',
    label: 'Aberto',
  },
  {
    value: 'in_analysis',
    label: 'Em análise',
  },
  {
    value: 'waiting_user',
    label: 'Aguardando usuário',
  },
  {
    value: 'waiting_support',
    label: 'Aguardando equipe',
  },
  {
    value: 'resolved',
    label: 'Resolvido',
  },
  {
    value: 'closed',
    label: 'Encerrado',
  },
  {
    value: 'reopened',
    label: 'Reaberto',
  },
]

const IMPACT_OPTIONS: Array<{
  value: SupportImpact
  label: string
}> = [
  {
    value: 'single_user',
    label: 'Um usuário',
  },
  {
    value: 'multiple_users',
    label: 'Vários usuários',
  },
  {
    value: 'school',
    label: 'Escola',
  },
  {
    value: 'organization',
    label: 'Instituição',
  },
  {
    value: 'network',
    label: 'Rede de ensino',
  },
  {
    value: 'platform',
    label: 'Plataforma',
  },
]

const URGENCY_OPTIONS: Array<{
  value: SupportUrgency
  label: string
}> = [
  {
    value: 'low',
    label: 'Baixa',
  },
  {
    value: 'normal',
    label: 'Normal',
  },
  {
    value: 'high',
    label: 'Alta',
  },
  {
    value: 'critical',
    label: 'Crítica',
  },
]

const PRIORITY_OPTIONS: Array<{
  value: SupportPriority
  label: string
}> = [
  {
    value: 'low',
    label: 'Baixa',
  },
  {
    value: 'normal',
    label: 'Normal',
  },
  {
    value: 'high',
    label: 'Alta',
  },
  {
    value: 'urgent',
    label: 'Urgente',
  },
]

const STATUS_LABELS:
  Record<SupportStatus, string> = {
    open: 'Aberto',
    in_analysis: 'Em análise',
    waiting_user: 'Aguardando usuário',
    waiting_support: 'Aguardando equipe',
    resolved: 'Resolvido',
    closed: 'Encerrado',
    reopened: 'Reaberto',
  }

const PRIORITY_LABELS:
  Record<SupportPriority, string> = {
    low: 'Baixa',
    normal: 'Normal',
    high: 'Alta',
    urgent: 'Urgente',
  }

const PRODUCT_LABELS:
  Record<string, string> = {
    platform: 'Central EIOS',
    agenda_edi: 'Agenda Inteligente EDI',
    professor_digital: 'Professor Digital',
    academy: 'EduData Academy',
    analytics: 'EduData Analytics',
    sgpa: 'SGPA',
    observatory: 'Observatório da Educação',
    community: 'Comunidade EduData IA',
    backoffice: 'BackOffice',
    experience_manager: 'Experience Manager',
  }

const CATEGORY_LABELS:
  Record<string, string> = {
    technical: 'Problema técnico',
    access: 'Acesso ou autenticação',
    billing: 'Pagamento ou cobrança',
    product: 'Produto ou funcionalidade',
    pedagogical: 'Orientação pedagógica',
    privacy: 'Privacidade ou segurança',
    suggestion: 'Sugestão',
    other: 'Outro',
  }

const ACCOUNT_LABELS:
  Record<string, string> = {
    individual: 'Usuário individual',
    corporate: 'Institucional',
    platform: 'Operação da plataforma',
  }

const SERVICE_LABELS:
  Record<string, string> = {
    individual_free: 'Individual gratuito',
    individual_pro: 'Professor Pro',
    institutional: 'Institucional',
    network: 'Rede de ensino',
    platform: 'Plataforma',
  }

const SLA_PRESENTATION = {
  green: {
    label: 'Dentro do prazo',
    dot: 'bg-emerald-500',
    badge:
      'border-emerald-200 bg-emerald-50 text-emerald-800',
  },
  yellow: {
    label: 'Atenção',
    dot: 'bg-amber-400',
    badge:
      'border-amber-200 bg-amber-50 text-amber-900',
  },
  orange: {
    label: 'Prazo crítico',
    dot: 'bg-orange-500',
    badge:
      'border-orange-200 bg-orange-50 text-orange-900',
  },
  red: {
    label: 'SLA estourado',
    dot: 'bg-red-600',
    badge:
      'border-red-200 bg-red-50 text-red-800',
  },
  gray: {
    label: 'Relógio pausado ou encerrado',
    dot: 'bg-slate-400',
    badge:
      'border-slate-200 bg-slate-50 text-slate-700',
  },
} as const

function formatDateTime(
  value: string | null,
): string {
  if (!value) {
    return '—'
  }

  const date =
    new Date(value)

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return '—'
  }

  return new Intl.DateTimeFormat(
    'pt-BR',
    {
      dateStyle: 'short',
      timeStyle: 'short',
      timeZone:
        'America/Sao_Paulo',
    },
  ).format(date)
}

function formatDuration(
  seconds: number | null,
): string {
  if (
    seconds === null ||
    !Number.isFinite(seconds)
  ) {
    return '—'
  }

  const breached =
    seconds < 0

  const totalMinutes =
    Math.floor(
      Math.abs(seconds) / 60,
    )

  const days =
    Math.floor(
      totalMinutes / 1440,
    )

  const hours =
    Math.floor(
      (
        totalMinutes %
        1440
      ) / 60,
    )

  const minutes =
    totalMinutes % 60

  const parts: string[] = []

  if (days > 0) {
    parts.push(
      `${days}d`,
    )
  }

  if (
    hours > 0 ||
    days > 0
  ) {
    parts.push(
      `${hours}h`,
    )
  }

  parts.push(
    `${minutes}min`,
  )

  const duration =
    parts.join(' ')

  return breached
    ? `Estourado há ${duration}`
    : `${duration} restantes`
}

function getLabel(
  labels: Record<string, string>,
  value: string | null,
): string {
  if (!value) {
    return '—'
  }

  return (
    labels[value] ??
    value
  )
}

function getMessageStyle(
  message: SupportMessage,
): string {
  if (
    message.visibility ===
    'internal'
  ) {
    return [
      'border-amber-200',
      'bg-amber-50',
      'text-amber-950',
    ].join(' ')
  }

  if (
    message.author_type ===
    'requester'
  ) {
    return [
      'border-cyan-200',
      'bg-cyan-50',
      'text-slate-950',
    ].join(' ')
  }

  if (
    message.author_type ===
    'system'
  ) {
    return [
      'border-slate-200',
      'bg-slate-100',
      'text-slate-700',
    ].join(' ')
  }

  return [
    'border-slate-200',
    'bg-white',
    'text-slate-950',
  ].join(' ')
}

function getMessageAuthor(
  message: SupportMessage,
): string {
  if (
    message.visibility ===
    'internal'
  ) {
    return 'Nota interna'
  }

  if (
    message.author_type ===
    'support'
  ) {
    return 'Equipe de suporte'
  }

  if (
    message.author_type ===
    'system'
  ) {
    return 'Sistema EIOS'
  }

  return 'Solicitante'
}

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: string
  description?: string
}) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-700">
        {eyebrow}
      </p>

      <h2 className="mt-2 break-words text-2xl font-bold text-[#081C2E]">
        {title}
      </h2>

      {description ? (
        <p className="mt-3 break-words text-sm leading-6 text-slate-600">
          {description}
        </p>
      ) : null}
    </div>
  )
}

export default function AdminSupportTicketPage() {
  const params =
    useParams()

  const pathname =
    usePathname()

  const rawTicketId =
    params?.id

  const ticketId =
    typeof rawTicketId ===
    'string'
      ? rawTicketId
      : Array.isArray(
            rawTicketId,
          )
        ? rawTicketId[0]
        : ''

  const [
    scope,
    setScope,
  ] =
    useState<SupportScope | null>(
      null,
    )

  const [
    detail,
    setDetail,
  ] =
    useState<TicketDetail | null>(
      null,
    )

  const [
    loading,
    setLoading,
  ] =
    useState(true)

  const [
    refreshing,
    setRefreshing,
  ] =
    useState(false)

  const [
    activeAction,
    setActiveAction,
  ] =
    useState<string | null>(
      null,
    )

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    )

  const [
    successMessage,
    setSuccessMessage,
  ] =
    useState<string | null>(
      null,
    )

  const [
    message,
    setMessage,
  ] =
    useState('')

  const [
    visibility,
    setVisibility,
  ] =
    useState<MessageVisibility>(
      'shared',
    )

  const [
    selectedStatus,
    setSelectedStatus,
  ] =
    useState<SupportStatus>(
      'in_analysis',
    )

  const [
    statusReason,
    setStatusReason,
  ] =
    useState('')

  const [
    selectedAssignee,
    setSelectedAssignee,
  ] =
    useState('')

  const [
    assignmentReason,
    setAssignmentReason,
  ] =
    useState('')

  const [
    impact,
    setImpact,
  ] =
    useState<SupportImpact>(
      'single_user',
    )

  const [
    urgency,
    setUrgency,
  ] =
    useState<SupportUrgency>(
      'normal',
    )

  const [
    manualPriority,
    setManualPriority,
  ] =
    useState<
      SupportPriority | ''
    >('')

  const [
    classificationReason,
    setClassificationReason,
  ] =
    useState('')

  const loadTicket =
    useCallback(
      async (
        silent = false,
      ) => {
        if (!ticketId) {
          setError(
            'Identificador do chamado não encontrado.',
          )

          setLoading(false)

          return
        }

        try {
          if (silent) {
            setRefreshing(true)
          } else {
            setLoading(true)
          }

          setError(null)

          const response =
            await fetch(
              `/api/admin/support/tickets/${encodeURIComponent(
                ticketId,
              )}`,
              {
                method: 'GET',
                credentials:
                  'include',
                cache: 'no-store',
                headers: {
                  Accept:
                    'application/json',
                },
              },
            )

          if (
            response.status ===
            401
          ) {
            window.location.assign(
              `/login?redirectTo=${encodeURIComponent(
                pathname,
              )}`,
            )

            return
          }

          const result =
            (await response.json()) as
              TicketApiResponse

          if (
            !response.ok ||
            !result.success ||
            !result.scope ||
            !result.data
          ) {
            throw new Error(
              result.error ??
                'Não foi possível carregar o atendimento.',
            )
          }

          setScope(
            result.scope,
          )

          setDetail(
            result.data,
          )
        } catch (
          requestError
        ) {
          setError(
            requestError instanceof
              Error
              ? requestError.message
              : 'Não foi possível carregar o atendimento.',
          )
        } finally {
          setLoading(false)
          setRefreshing(false)
        }
      },
      [
        pathname,
        ticketId,
      ],
    )

  useEffect(
    () => {
      void loadTicket()
    },
    [
      loadTicket,
    ],
  )

  useEffect(
    () => {
      if (!detail) {
        return
      }

      setSelectedStatus(
        detail.ticket.status,
      )

      setSelectedAssignee(
        detail.ticket
          .assigned_to_user_id ??
          '',
      )

      setImpact(
        detail.ticket.impact,
      )

      setUrgency(
        detail.ticket.urgency,
      )

      setManualPriority(
        detail.ticket
          .priority_overridden
          ? detail.ticket.priority
          : '',
      )
    },
    [
      detail,
    ],
  )

  const ticket =
    detail?.ticket ??
    null

  const currentAssignee =
    useMemo(
      () =>
        detail?.staffMembers.find(
          (
            member:
              StaffMember,
          ) =>
            member.userId ===
            detail.ticket
              .assigned_to_user_id,
        ) ??
        null,
      [
        detail,
      ],
    )

  async function performMutation(
    method:
      | 'POST'
      | 'PATCH',

    body:
      Record<string, unknown>,

    actionName: string,

    fallbackError: string,
  ): Promise<boolean> {
    if (
      !ticketId ||
      activeAction
    ) {
      return false
    }

    try {
      setActiveAction(
        actionName,
      )

      setError(null)
      setSuccessMessage(null)

      const response =
        await fetch(
          `/api/admin/support/tickets/${encodeURIComponent(
            ticketId,
          )}`,
          {
            method,
            credentials:
              'include',
            cache: 'no-store',
            headers: {
              Accept:
                'application/json',

              'Content-Type':
                'application/json',
            },
            body:
              JSON.stringify(body),
          },
        )

      if (
        response.status ===
        401
      ) {
        window.location.assign(
          `/login?redirectTo=${encodeURIComponent(
            pathname,
          )}`,
        )

        return false
      }

      const result =
        (await response.json()) as
          TicketApiResponse

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.error ??
            fallbackError,
        )
      }

      setSuccessMessage(
        result.message ??
          'Operação realizada com sucesso.',
      )

      await loadTicket(true)

      return true
    } catch (
      mutationError
    ) {
      setError(
        mutationError instanceof
          Error
          ? mutationError.message
          : fallbackError,
      )

      return false
    } finally {
      setActiveAction(null)
    }
  }

  async function submitMessage(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    if (!message.trim()) {
      return
    }

    const success =
      await performMutation(
        'POST',
        {
          message,
          visibility,
        },
        'message',
        'Não foi possível registrar a mensagem.',
      )

    if (success) {
      setMessage('')
    }
  }

  async function submitStatus(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    if (
      (
        selectedStatus ===
          'resolved' ||
        selectedStatus ===
          'closed'
      ) &&
      !statusReason.trim()
    ) {
      setError(
        'Informe a justificativa para resolver ou encerrar.',
      )

      return
    }

    const success =
      await performMutation(
        'PATCH',
        {
          action: 'status',
          status:
            selectedStatus,
          reason:
            statusReason,
        },
        'status',
        'Não foi possível alterar o status.',
      )

    if (success) {
      setStatusReason('')
    }
  }

  async function assignSelf() {
    await performMutation(
      'PATCH',
      {
        action:
          'assign_self',

        reason:
          'Chamado assumido pelo operador atual no BackOffice.',
      },
      'assign_self',
      'Não foi possível assumir o chamado.',
    )
  }

  async function submitAssignment(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    if (!selectedAssignee) {
      setError(
        'Selecione um responsável.',
      )

      return
    }

    const success =
      await performMutation(
        'PATCH',
        {
          action: 'assign',

          assigneeUserId:
            selectedAssignee,

          reason:
            assignmentReason,
        },
        'assign',
        'Não foi possível atribuir o chamado.',
      )

    if (success) {
      setAssignmentReason('')
    }
  }

  async function submitClassification(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    if (
      manualPriority &&
      !classificationReason.trim()
    ) {
      setError(
        'A prioridade manual exige justificativa.',
      )

      return
    }

    const success =
      await performMutation(
        'PATCH',
        {
          action:
            'classify',

          impact,
          urgency,

          manualPriority:
            manualPriority ||
            null,

          reason:
            classificationReason,
        },
        'classify',
        'Não foi possível atualizar a classificação.',
      )

    if (success) {
      setClassificationReason('')
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-[65vh] items-center justify-center">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-cyan-700" />

          <p className="mt-5 font-semibold text-slate-700">
            Carregando atendimento...
          </p>
        </div>
      </main>
    )
  }

  if (
    !detail ||
    !ticket ||
    !scope
  ) {
    return (
      <main className="flex min-h-[65vh] items-center justify-center">
        <section className="w-full max-w-xl rounded-3xl border border-red-200 bg-white p-7 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-700">
            Atendimento indisponível
          </p>

          <h1 className="mt-3 text-2xl font-bold text-[#081C2E]">
            Não foi possível abrir o chamado
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            {error ??
              'O chamado não foi encontrado.'}
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() =>
                void loadTicket()
              }
              className="min-h-11 rounded-xl bg-[#081C2E] px-5 py-3 text-sm font-bold text-white"
            >
              Tentar novamente
            </button>

            <Link
              href="/admin/suporte"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700"
            >
              Voltar para a fila
            </Link>
          </div>
        </section>
      </main>
    )
  }

  const sla =
    SLA_PRESENTATION[
      ticket.sla_light
    ]

  const sharedMessageBlocked =
    (
      ticket.status ===
        'resolved' ||
      ticket.status ===
        'closed'
    ) &&
    visibility ===
      'shared'

  return (
    <main className="w-full max-w-full overflow-x-hidden">
      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-[#071827] text-white shadow-sm">
        <div
          className={`h-1.5 ${sla.dot}`}
        />

        <div className="p-6 sm:p-8 lg:p-10">
          <Link
            href="/admin/suporte"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-white/20 px-5 py-3 text-sm font-bold text-white sm:w-auto"
          >
            Voltar para a fila
          </Link>

          <p className="mt-7 break-all text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">
            {ticket.protocol}
          </p>

          <h1 className="mt-4 break-words text-3xl font-bold sm:text-4xl">
            {ticket.subject}
          </h1>

          <div className="mt-5 flex flex-wrap gap-2">
            <span className="rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-800">
              {
                STATUS_LABELS[
                  ticket.status
                ]
              }
            </span>

            <span className="rounded-full border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-bold text-violet-800">
              {
                PRIORITY_LABELS[
                  ticket.priority
                ]
              }
            </span>

            <span
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold ${sla.badge}`}
            >
              <span
                className={`h-2.5 w-2.5 rounded-full ${sla.dot}`}
              />

              {sla.label}
            </span>
          </div>

          <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                Responsável
              </p>

              <p className="mt-2 font-bold">
                {currentAssignee
                  ?.displayName ??
                  'Sem responsável'}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                Produto
              </p>

              <p className="mt-2 font-bold">
                {getLabel(
                  PRODUCT_LABELS,
                  ticket.product_code,
                )}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                Categoria
              </p>

              <p className="mt-2 font-bold">
                {getLabel(
                  CATEGORY_LABELS,
                  ticket.category,
                )}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                Tempo do SLA
              </p>

              <p className="mt-2 font-bold">
                {formatDuration(
                  ticket
                    .seconds_until_sla_breach,
                )}
              </p>
            </div>
          </div>
        </div>
      </section>

      {error ? (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-800">
          {error}
        </div>
      ) : null}

      {successMessage ? (
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm font-semibold text-emerald-800">
          {successMessage}
        </div>
      ) : null}

      <div className="mt-8 grid min-w-0 gap-8 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <section className="min-w-0 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 p-6 sm:flex-row sm:items-end sm:justify-between sm:p-8">
            <SectionHeader
              eyebrow="Atendimento"
              title="Conversa do chamado"
              description={`${detail.messages.length} mensagens registradas.`}
            />

            <button
              type="button"
              onClick={() =>
                void loadTicket(
                  true,
                )
              }
              disabled={
                refreshing
              }
              className="min-h-11 rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 disabled:opacity-50"
            >
              {refreshing
                ? 'Atualizando...'
                : 'Atualizar conversa'}
            </button>
          </div>

          <div className="space-y-4 bg-slate-50 p-4 sm:p-8">
            {detail.messages.map(
              (
                supportMessage:
                  SupportMessage,
              ) => (
                <article
                  key={
                    supportMessage.id
                  }
                  className={`rounded-2xl border p-5 shadow-sm ${getMessageStyle(
                    supportMessage,
                  )}`}
                >
                  <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
                    <p className="text-xs font-bold uppercase tracking-[0.16em]">
                      {getMessageAuthor(
                        supportMessage,
                      )}
                    </p>

                    <time className="text-xs text-slate-500">
                      {formatDateTime(
                        supportMessage.created_at,
                      )}
                    </time>
                  </div>

                  <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7">
                    {
                      supportMessage.body
                    }
                  </p>
                </article>
              ),
            )}
          </div>

          <form
            onSubmit={
              submitMessage
            }
            className="border-t border-slate-200 p-6 sm:p-8"
          >
            <SectionHeader
              eyebrow="Comunicação"
              title="Registrar mensagem"
            />

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <label className="rounded-2xl border border-slate-300 p-4">
                <input
                  type="radio"
                  name="visibility"
                  checked={
                    visibility ===
                    'shared'
                  }
                  onChange={() =>
                    setVisibility(
                      'shared',
                    )
                  }
                />

                <span className="ml-3 font-bold text-slate-800">
                  Resposta ao solicitante
                </span>
              </label>

              <label className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <input
                  type="radio"
                  name="visibility"
                  checked={
                    visibility ===
                    'internal'
                  }
                  onChange={() =>
                    setVisibility(
                      'internal',
                    )
                  }
                />

                <span className="ml-3 font-bold text-amber-950">
                  Nota interna
                </span>
              </label>
            </div>

            {sharedMessageBlocked ? (
              <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
                Reabra o chamado antes de enviar uma resposta ao solicitante.
              </p>
            ) : null}

            <textarea
              value={message}
              onChange={
                event =>
                  setMessage(
                    event.target
                      .value,
                  )
              }
              maxLength={10000}
              rows={7}
              placeholder="Digite a mensagem."
              className="mt-5 w-full rounded-2xl border border-slate-300 px-4 py-4 text-sm leading-7 outline-none focus:border-cyan-600"
            />

            <button
              type="submit"
              disabled={
                !message.trim() ||
                sharedMessageBlocked ||
                activeAction !==
                  null
              }
              className="mt-4 min-h-12 w-full rounded-xl bg-[#081C2E] px-6 py-3 text-sm font-bold text-white disabled:opacity-50"
            >
              {activeAction ===
              'message'
                ? 'Registrando...'
                : visibility ===
                    'internal'
                  ? 'Registrar nota interna'
                  : 'Enviar resposta'}
            </button>
          </form>
        </section>

        <aside className="min-w-0 space-y-6">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <SectionHeader
              eyebrow="Responsabilidade"
              title="Atribuição"
            />

            <p className="mt-5 rounded-2xl bg-slate-50 p-4 font-bold text-slate-800">
              {currentAssignee
                ?.displayName ??
                'Sem responsável'}
            </p>

            {scope.canAssign ? (
              <>
                <button
                  type="button"
                  onClick={() =>
                    void assignSelf()
                  }
                  disabled={
                    activeAction !==
                      null ||
                    ticket
                      .assigned_to_user_id ===
                      scope.currentUserId
                  }
                  className="mt-4 min-h-12 w-full rounded-xl bg-cyan-700 px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
                >
                  {ticket
                    .assigned_to_user_id ===
                  scope.currentUserId
                    ? 'Atribuído a você'
                    : 'Assumir chamado'}
                </button>

                <form
                  onSubmit={
                    submitAssignment
                  }
                  className="mt-5 space-y-4 border-t border-slate-200 pt-5"
                >
                  <select
                    value={
                      selectedAssignee
                    }
                    onChange={
                      event =>
                        setSelectedAssignee(
                          event.target
                            .value,
                        )
                    }
                    className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3"
                  >
                    <option value="">
                      Selecione um operador
                    </option>

                    {detail.staffMembers.map(
                      (
                        member:
                          StaffMember,
                      ) => (
                        <option
                          key={
                            member.userId
                          }
                          value={
                            member.userId
                          }
                        >
                          {member.displayName} — {member.roleLabel}
                        </option>
                      ),
                    )}
                  </select>

                  <textarea
                    value={
                      assignmentReason
                    }
                    onChange={
                      event =>
                        setAssignmentReason(
                          event.target
                            .value,
                        )
                    }
                    maxLength={1000}
                    rows={3}
                    placeholder="Motivo da atribuição"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                  />

                  <button
                    type="submit"
                    disabled={
                      !selectedAssignee ||
                      activeAction !==
                        null
                    }
                    className="min-h-11 w-full rounded-xl border border-cyan-700 px-5 py-3 text-sm font-bold text-cyan-800 disabled:opacity-50"
                  >
                    Confirmar atribuição
                  </button>
                </form>
              </>
            ) : null}
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <SectionHeader
              eyebrow="Andamento"
              title="Alterar status"
            />

            <form
              onSubmit={
                submitStatus
              }
              className="mt-5 space-y-4"
            >
              <select
                value={
                  selectedStatus
                }
                onChange={
                  event =>
                    setSelectedStatus(
                      event.target
                        .value as
                        SupportStatus,
                    )
                }
                className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3"
              >
                {STATUS_OPTIONS.map(
                  option => (
                    <option
                      key={
                        option.value
                      }
                      value={
                        option.value
                      }
                    >
                      {option.label}
                    </option>
                  ),
                )}
              </select>

              <textarea
                value={
                  statusReason
                }
                onChange={
                  event =>
                    setStatusReason(
                      event.target
                        .value,
                    )
                }
                maxLength={1000}
                rows={4}
                placeholder="Justificativa"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
              />

              <button
                type="submit"
                disabled={
                  activeAction !==
                  null
                }
                className="min-h-11 w-full rounded-xl bg-[#081C2E] px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
              >
                Atualizar status
              </button>
            </form>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <SectionHeader
              eyebrow="Priorização"
              title="Classificação"
            />

            <form
              onSubmit={
                submitClassification
              }
              className="mt-5 space-y-4"
            >
              <select
                value={impact}
                onChange={
                  event =>
                    setImpact(
                      event.target
                        .value as
                        SupportImpact,
                    )
                }
                className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3"
              >
                {IMPACT_OPTIONS.map(
                  option => (
                    <option
                      key={
                        option.value
                      }
                      value={
                        option.value
                      }
                    >
                      {option.label}
                    </option>
                  ),
                )}
              </select>

              <select
                value={urgency}
                onChange={
                  event =>
                    setUrgency(
                      event.target
                        .value as
                        SupportUrgency,
                    )
                }
                className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3"
              >
                {URGENCY_OPTIONS.map(
                  option => (
                    <option
                      key={
                        option.value
                      }
                      value={
                        option.value
                      }
                    >
                      {option.label}
                    </option>
                  ),
                )}
              </select>

              <select
                value={
                  manualPriority
                }
                onChange={
                  event =>
                    setManualPriority(
                      event.target
                        .value as
                        SupportPriority |
                        '',
                    )
                }
                className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3"
              >
                <option value="">
                  Usar prioridade calculada
                </option>

                {PRIORITY_OPTIONS.map(
                  option => (
                    <option
                      key={
                        option.value
                      }
                      value={
                        option.value
                      }
                    >
                      {option.label}
                    </option>
                  ),
                )}
              </select>

              <textarea
                value={
                  classificationReason
                }
                onChange={
                  event =>
                    setClassificationReason(
                      event.target
                        .value,
                    )
                }
                maxLength={1000}
                rows={4}
                placeholder="Justificativa da classificação"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
              />

              <button
                type="submit"
                disabled={
                  activeAction !==
                  null
                }
                className="min-h-11 w-full rounded-xl border border-violet-300 bg-violet-50 px-5 py-3 text-sm font-bold text-violet-800 disabled:opacity-50"
              >
                Atualizar classificação
              </button>
            </form>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <SectionHeader
              eyebrow="Acordo de serviço"
              title="SLA"
            />

            <div
              className={`mt-5 rounded-2xl border p-4 ${sla.badge}`}
            >
              <p className="font-bold">
                {sla.label}
              </p>

              <p className="mt-2 text-lg font-bold">
                {formatDuration(
                  ticket
                    .seconds_until_sla_breach,
                )}
              </p>
            </div>

            <dl className="mt-5 space-y-4">
              <div>
                <dt className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                  Política
                </dt>

                <dd className="mt-2 font-bold text-slate-800">
                  {ticket
                    .sla_policy_name ??
                    '—'}
                </dd>

                <dd className="text-sm text-slate-600">
                  {ticket
                    .sla_policy_code ??
                    '—'}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                  Prazo
                </dt>

                <dd className="mt-2 font-bold text-slate-800">
                  {formatDateTime(
                    ticket
                      .active_sla_due_at,
                  )}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                  Primeira resposta
                </dt>

                <dd className="mt-2 font-bold text-slate-800">
                  {formatDateTime(
                    ticket
                      .first_response_at,
                  )}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <SectionHeader
              eyebrow="Solicitante"
              title="Contexto"
            />

            <dl className="mt-5 space-y-4">
              <div>
                <dt className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                  Tipo de conta
                </dt>

                <dd className="mt-2 font-bold text-slate-800">
                  {getLabel(
                    ACCOUNT_LABELS,
                    ticket
                      .requester_account_type,
                  )}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                  Perfil
                </dt>

                <dd className="mt-2 font-bold text-slate-800">
                  {ticket
                    .requester_role ??
                    '—'}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                  Nível de serviço
                </dt>

                <dd className="mt-2 font-bold text-slate-800">
                  {getLabel(
                    SERVICE_LABELS,
                    ticket
                      .requester_service_tier,
                  )}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                  Criado em
                </dt>

                <dd className="mt-2 font-bold text-slate-800">
                  {formatDateTime(
                    ticket.created_at,
                  )}
                </dd>
              </div>
            </dl>
          </section>
        </aside>
      </div>

      <section className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <SectionHeader
          eyebrow="Auditoria"
          title="Históricos"
          description="Mudanças de status, atribuições, prioridade e SLA."
        />

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <details
            open
            className="rounded-2xl border border-slate-200"
          >
            <summary className="cursor-pointer px-5 py-4 font-bold">
              Status ({detail.statusHistory.length})
            </summary>

            <div className="space-y-3 border-t border-slate-200 p-5">
              {detail.statusHistory.map(
                (
                  item:
                    StatusHistoryItem,
                ) => (
                  <div
                    key={item.id}
                    className="rounded-xl bg-slate-50 p-4"
                  >
                    <p className="font-bold">
                      {item.previous_status
                        ? STATUS_LABELS[
                            item
                              .previous_status
                          ]
                        : 'Início'}
                      {' → '}
                      {
                        STATUS_LABELS[
                          item
                            .new_status
                        ]
                      }
                    </p>

                    <p className="mt-2 text-sm text-slate-600">
                      {item.reason ??
                        'Sem justificativa.'}
                    </p>

                    <p className="mt-2 text-xs text-slate-500">
                      {formatDateTime(
                        item.created_at,
                      )}
                    </p>
                  </div>
                ),
              )}
            </div>
          </details>

          <details className="rounded-2xl border border-slate-200">
            <summary className="cursor-pointer px-5 py-4 font-bold">
              Atribuições ({detail.assignmentHistory.length})
            </summary>

            <div className="space-y-3 border-t border-slate-200 p-5">
              {detail.assignmentHistory.map(
                (
                  item:
                    AssignmentHistoryItem,
                ) => (
                  <div
                    key={item.id}
                    className="rounded-xl bg-slate-50 p-4"
                  >
                    <p className="break-all font-bold">
                      {item
                        .new_assignee_user_id ??
                        'Sem responsável'}
                    </p>

                    <p className="mt-2 text-sm text-slate-600">
                      {item.reason ??
                        'Sem justificativa.'}
                    </p>

                    <p className="mt-2 text-xs text-slate-500">
                      {formatDateTime(
                        item.created_at,
                      )}
                    </p>
                  </div>
                ),
              )}
            </div>
          </details>

          <details className="rounded-2xl border border-slate-200">
            <summary className="cursor-pointer px-5 py-4 font-bold">
              Prioridade ({detail.priorityHistory.length})
            </summary>

            <div className="space-y-3 border-t border-slate-200 p-5">
              {detail.priorityHistory.map(
                (
                  item:
                    PriorityHistoryItem,
                ) => (
                  <div
                    key={item.id}
                    className="rounded-xl bg-slate-50 p-4"
                  >
                    <p className="font-bold">
                      {item.previous_priority
                        ? PRIORITY_LABELS[
                            item
                              .previous_priority
                          ]
                        : 'Inicial'}
                      {' → '}
                      {
                        PRIORITY_LABELS[
                          item
                            .new_priority
                        ]
                      }
                    </p>

                    <p className="mt-2 text-sm text-slate-600">
                      Pontuação:{' '}
                      {item.new_score ??
                        '—'}
                    </p>

                    <p className="mt-2 text-xs text-slate-500">
                      {formatDateTime(
                        item.created_at,
                      )}
                    </p>
                  </div>
                ),
              )}
            </div>
          </details>

          <details className="rounded-2xl border border-slate-200">
            <summary className="cursor-pointer px-5 py-4 font-bold">
              SLA ({detail.slaHistory.length})
            </summary>

            <div className="space-y-3 border-t border-slate-200 p-5">
              {detail.slaHistory.map(
                (
                  item:
                    SlaHistoryItem,
                ) => (
                  <div
                    key={item.id}
                    className="rounded-xl bg-slate-50 p-4"
                  >
                    <p className="font-bold">
                      {
                        item.event_type
                      }
                    </p>

                    <p className="mt-2 text-sm text-slate-600">
                      {item
                        .previous_clock_status ??
                        '—'}
                      {' → '}
                      {item
                        .new_clock_status ??
                        '—'}
                    </p>

                    <p className="mt-2 text-xs text-slate-500">
                      {formatDateTime(
                        item.event_at,
                      )}
                    </p>
                  </div>
                ),
              )}
            </div>
          </details>
        </div>
      </section>
    </main>
  )
}