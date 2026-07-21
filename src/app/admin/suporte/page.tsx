'use client'

import {
  type ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

type SupportMetrics = {
  total_tickets: number
  open_tickets: number
  in_service_tickets: number
  waiting_user_tickets: number
  closed_tickets: number
  sla_green: number
  sla_yellow: number
  sla_orange: number
  sla_red: number
  unassigned_tickets: number
  average_first_response_minutes: number | null
  average_resolution_minutes: number | null
  sla_compliance_percent: number | null
}

type SupportScope = {
  staffRole:
    | 'agent'
    | 'manager'
    | 'administrator'

  canViewAll: boolean
  canAssign: boolean
  canManageStaff: boolean

  queueMode:
    | 'all_authorized'
    | 'assigned_to_current_user'

  metricsAvailable: boolean
}

type SupportTicket = {
  id: string
  protocol: string

  requester_user_id: string

  requester_account_type:
    | 'individual'
    | 'corporate'
    | 'platform'
    | null

  requester_role: string | null

  requester_hierarchy_level:
    number | null

  requester_plan_code:
    string | null

  requester_service_tier:
    | 'individual_free'
    | 'individual_pro'
    | 'institutional'
    | 'network'
    | 'platform'
    | null

  organization_id: string | null
  school_id: string | null

  product_code: string

  source_module:
    string | null

  source_path:
    string | null

  category: string
  subject: string

  requested_priority:
    string | null

  calculated_priority:
    string | null

  priority:
    | 'low'
    | 'normal'
    | 'high'
    | 'urgent'

  priority_score: number

  priority_overridden: boolean

  impact: string
  urgency: string

  status: string
  operational_status: string

  assigned_to_user_id:
    string | null

  sla_policy_code:
    string | null

  sla_policy_name:
    string | null

  is_contractual:
    boolean | null

  sla_light:
    | 'green'
    | 'yellow'
    | 'orange'
    | 'red'
    | 'gray'

  sla_clock_status: string

  active_sla_due_at:
    string | null

  seconds_until_sla_breach:
    number | null

  first_response_due_at:
    string | null

  resolution_due_at:
    string | null

  first_response_at:
    string | null

  first_response_breached_at:
    string | null

  resolution_breached_at:
    string | null

  sla_paused_at:
    string | null

  sla_paused_seconds:
    number

  sla_pause_reason:
    string | null

  last_message_at:
    string

  last_requester_message_at:
    string | null

  last_support_message_at:
    string | null

  status_changed_at:
    string

  resolved_at:
    string | null

  closed_at:
    string | null

  created_at: string
  updated_at: string
}

type Pagination = {
  page: number
  limit: number
  total: number
  totalPages: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

type SupportApiResponse = {
  success: boolean
  error?: string

  scope?: SupportScope

  metrics:
    SupportMetrics | null

  pagination:
    Pagination

  data:
    SupportTicket[]
}

type FilterState = {
  search: string
  operationalStatus: string
  priority: string
  category: string
  sla: string
  accountType: string
  serviceTier: string
  productCode: string
  requesterRole: string
  assignment: string
  organizationId: string
  schoolId: string
  sort: string
}

const INITIAL_FILTERS: FilterState = {
  search: '',
  operationalStatus: '',
  priority: '',
  category: '',
  sla: '',
  accountType: '',
  serviceTier: '',
  productCode: '',
  requesterRole: '',
  assignment: 'all',
  organizationId: '',
  schoolId: '',
  sort: 'sla',
}

const NO_VALUE = '—'

const STATUS_LABELS:
  Record<string, string> = {
    open:
      'Aberto',

    in_analysis:
      'Em análise',

    waiting_user:
      'Aguardando usuário',

    waiting_support:
      'Aguardando equipe',

    resolved:
      'Resolvido',

    closed:
      'Fechado',

    reopened:
      'Reaberto',

    in_service:
      'Em atendimento',
  }

const PRIORITY_LABELS:
  Record<string, string> = {
    low:
      'Baixa',

    normal:
      'Normal',

    high:
      'Alta',

    urgent:
      'Urgente',
  }

const CATEGORY_LABELS:
  Record<string, string> = {
    technical:
      'Problema técnico',

    access:
      'Acesso ou autenticação',

    billing:
      'Pagamento ou cobrança',

    product:
      'Produto ou funcionalidade',

    pedagogical:
      'Orientação pedagógica',

    privacy:
      'Privacidade ou segurança',

    suggestion:
      'Sugestão',

    other:
      'Outro',
  }

const ACCOUNT_LABELS:
  Record<string, string> = {
    individual:
      'Usuário individual',

    corporate:
      'Institucional',

    platform:
      'Operação da plataforma',
  }

const SERVICE_TIER_LABELS:
  Record<string, string> = {
    individual_free:
      'Individual gratuito',

    individual_pro:
      'Professor Pro',

    institutional:
      'Institucional',

    network:
      'Rede de ensino',

    platform:
      'Plataforma',
  }

const PRODUCT_LABELS:
  Record<string, string> = {
    platform:
      'Central EIOS',

    agenda_edi:
      'Agenda Inteligente EDI',

    professor_digital:
      'Professor Digital',

    academy:
      'EduData Academy',

    analytics:
      'EduData Analytics',

    sgpa:
      'SGPA',

    observatory:
      'Observatório da Educação',
  }

const SLA_PRESENTATION = {
  green: {
    label:
      'Dentro do prazo',

    dot:
      'bg-emerald-500',

    badge:
      'border-emerald-200 bg-emerald-50 text-emerald-800',
  },

  yellow: {
    label:
      'Atenção',

    dot:
      'bg-amber-400',

    badge:
      'border-amber-200 bg-amber-50 text-amber-900',
  },

  orange: {
    label:
      'Prazo crítico',

    dot:
      'bg-orange-500',

    badge:
      'border-orange-200 bg-orange-50 text-orange-900',
  },

  red: {
    label:
      'SLA estourado',

    dot:
      'bg-red-600',

    badge:
      'border-red-200 bg-red-50 text-red-800',
  },

  gray: {
    label:
      'Relógio encerrado ou pausado',

    dot:
      'bg-slate-400',

    badge:
      'border-slate-200 bg-slate-50 text-slate-700',
  },
} as const

function formatDateTime(
  value: string | null,
): string {
  if (!value) {
    return NO_VALUE
  }

  const date =
    new Date(value)

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return NO_VALUE
  }

  return new Intl.DateTimeFormat(
    'pt-BR',
    {
      dateStyle:
        'short',

      timeStyle:
        'short',

      timeZone:
        'America/Sao_Paulo',
    },
  ).format(date)
}

function formatMinutes(
  value: number | null,
): string {
  if (
    value === null ||
    !Number.isFinite(value)
  ) {
    return NO_VALUE
  }

  if (value < 60) {
    return `${Math.round(value)} min`
  }

  const hours =
    Math.floor(
      value / 60,
    )

  const minutes =
    Math.round(
      value % 60,
    )

  if (minutes === 0) {
    return `${hours}h`
  }

  return `${hours}h ${minutes}min`
}

function formatDurationFromSeconds(
  value: number | null,
): string {
  if (
    value === null ||
    !Number.isFinite(value)
  ) {
    return NO_VALUE
  }

  const breached =
    value < 0

  const absoluteSeconds =
    Math.abs(value)

  const totalMinutes =
    Math.floor(
      absoluteSeconds / 60,
    )

  const days =
    Math.floor(
      totalMinutes /
      1440,
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

  if (breached) {
    return `Estourado há ${duration}`
  }

  return `${duration} restantes`
}

function getLabel(
  labels: Record<string, string>,
  value: string | null,
): string {
  if (!value) {
    return NO_VALUE
  }

  return (
    labels[value] ??
    value
  )
}

function buildQueryString(
  filters: FilterState,
  page: number,
): string {
  const params =
    new URLSearchParams()

  params.set(
    'page',
    String(page),
  )

  params.set(
    'limit',
    '50',
  )

  const entries:
    Array<
      [
        string,
        string,
      ]
    > = [
      [
        'search',
        filters.search,
      ],
      [
        'operationalStatus',
        filters.operationalStatus,
      ],
      [
        'priority',
        filters.priority,
      ],
      [
        'category',
        filters.category,
      ],
      [
        'sla',
        filters.sla,
      ],
      [
        'accountType',
        filters.accountType,
      ],
      [
        'serviceTier',
        filters.serviceTier,
      ],
      [
        'productCode',
        filters.productCode,
      ],
      [
        'requesterRole',
        filters.requesterRole,
      ],
      [
        'assignment',
        filters.assignment,
      ],
      [
        'organizationId',
        filters.organizationId,
      ],
      [
        'schoolId',
        filters.schoolId,
      ],
      [
        'sort',
        filters.sort,
      ],
    ]

  entries.forEach(
    ([
      key,
      value,
    ]) => {
      const normalizedValue =
        value.trim()

      if (normalizedValue) {
        params.set(
          key,
          normalizedValue,
        )
      }
    },
  )

  return params.toString()
}

function MetricCard({
  label,
  value,
  description,
  emphasis = false,
}: {
  label: string
  value: string | number
  description: string
  emphasis?: boolean
}) {
  return (
    <article
      className={`min-w-0 rounded-3xl border p-5 shadow-sm sm:p-6 ${
        emphasis
          ? 'border-red-200 bg-red-50'
          : 'border-slate-200 bg-white'
      }`}
    >
      <p
        className={`text-xs font-bold uppercase tracking-[0.18em] ${
          emphasis
            ? 'text-red-700'
            : 'text-slate-500'
        }`}
      >
        {label}
      </p>

      <p
        className={`mt-3 text-3xl font-bold tracking-tight ${
          emphasis
            ? 'text-red-800'
            : 'text-[#081C2E]'
        }`}
      >
        {value}
      </p>

      <p className="mt-2 text-sm leading-6 text-slate-600">
        {description}
      </p>
    </article>
  )
}

function SelectField({
  label,
  name,
  value,
  options,
  onChange,
}: {
  label: string
  name: keyof FilterState
  value: string

  options:
    Array<{
      value: string
      label: string
    }>

  onChange: (
    name: keyof FilterState,
    value: string,
  ) => void
}) {
  return (
    <label className="min-w-0">
      <span className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </span>

      <select
        value={value}
        onChange={event =>
          onChange(
            name,
            event.target.value,
          )
        }
        className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
      >
        {options.map(
          option => (
            <option
              key={option.value}
              value={option.value}
            >
              {option.label}
            </option>
          ),
        )}
      </select>
    </label>
  )
}

export default function AdminSupportPage() {
  const [
    filters,
    setFilters,
  ] =
    useState<FilterState>(
      INITIAL_FILTERS,
    )

  const [
    page,
    setPage,
  ] =
    useState(1)

  const [
    response,
    setResponse,
  ] =
    useState<SupportApiResponse | null>(
      null,
    )

  const [
    loading,
    setLoading,
  ] =
    useState(true)

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    )

  const loadQueue =
    useCallback(
      async () => {
        setLoading(true)
        setError(null)

        try {
          const queryString =
            buildQueryString(
              filters,
              page,
            )

          const request =
            await fetch(
              `/api/admin/support/tickets?${queryString}`,
              {
                method:
                  'GET',

                credentials:
                  'include',

                cache:
                  'no-store',

                headers: {
                  Accept:
                    'application/json',
                },
              },
            )

          const result =
            (await request.json()) as
              SupportApiResponse

          if (
            !request.ok ||
            result.success !==
              true
          ) {
            throw new Error(
              result.error ??
                'Não foi possível carregar a fila de suporte.',
            )
          }

          setResponse(result)
        } catch (requestError) {
          setResponse(null)

          setError(
            requestError instanceof
              Error
              ? requestError.message
              : 'Não foi possível carregar a fila de suporte.',
          )
        } finally {
          setLoading(false)
        }
      },
      [
        filters,
        page,
      ],
    )

  useEffect(
    () => {
      void loadQueue()
    },
    [
      loadQueue,
    ],
  )

  const metrics =
    response?.metrics ??
    null

  const tickets =
    response?.data ??
    []

  const pagination =
    response?.pagination ??
    null

  const scope =
    response?.scope ??
    null

  const mainMetrics =
    useMemo(
      () => [
        {
          label:
            'Total',

          value:
            metrics?.total_tickets ??
            NO_VALUE,

          description:
            'Chamados autorizados na fila.',
        },
        {
          label:
            'Abertos',

          value:
            metrics?.open_tickets ??
            NO_VALUE,

          description:
            'Aguardando triagem inicial.',
        },
        {
          label:
            'Em atendimento',

          value:
            metrics?.in_service_tickets ??
            NO_VALUE,

          description:
            'Em análise ou aguardando equipe.',
        },
        {
          label:
            'Aguardando usuário',

          value:
            metrics?.waiting_user_tickets ??
            NO_VALUE,

          description:
            'Relógio de SLA pode estar pausado.',
        },
        {
          label:
            'Sem responsável',

          value:
            metrics?.unassigned_tickets ??
            NO_VALUE,

          description:
            'Chamados que precisam de atribuição.',
        },
        {
          label:
            'SLA estourado',

          value:
            metrics?.sla_red ??
            NO_VALUE,

          description:
            'Chamados acima do prazo de atendimento.',

          emphasis:
            true,
        },
      ],
      [
        metrics,
      ],
    )

  function updateFilter(
    name: keyof FilterState,
    value: string,
  ) {
    setPage(1)

    setFilters(
      currentFilters => ({
        ...currentFilters,
        [name]:
          value,
      }),
    )
  }

  function handleSearchChange(
    event:
      ChangeEvent<HTMLInputElement>,
  ) {
    updateFilter(
      'search',
      event.target.value,
    )
  }

  function resetFilters() {
    setFilters(
      INITIAL_FILTERS,
    )

    setPage(1)
  }

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      <section className="rounded-[2rem] border border-slate-200 bg-[#071827] p-6 text-white shadow-sm sm:p-8 lg:p-10">
        <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-300 sm:text-sm">
              EIOS — Gestão de serviços
            </p>

            <h1 className="mt-4 max-w-4xl text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Central de Operações e Suporte EDI
            </h1>

            <p className="mt-5 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
              Gestão da fila, prioridades,
              acordos de nível de serviço,
              responsáveis e tempos de
              solução da plataforma.
            </p>
          </div>

          <div className="min-w-0 rounded-2xl border border-white/10 bg-white/5 p-5 lg:min-w-64">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-200">
              Escopo atual
            </p>

            <p className="mt-3 text-lg font-bold">
              {scope
                ? getLabel(
                    {
                      agent:
                        'Agente de suporte',

                      manager:
                        'Gestor de suporte',

                      administrator:
                        'Administrador',
                    },
                    scope.staffRole,
                  )
                : NO_VALUE}
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-300">
              {scope?.canViewAll
                ? 'Visão completa dos chamados autorizados.'
                : 'Visão restrita aos chamados atribuídos.'}
            </p>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="support-summary-title"
        className="mt-8"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-700">
              Operação
            </p>

            <h2
              id="support-summary-title"
              className="mt-2 text-2xl font-bold text-[#081C2E] sm:text-3xl"
            >
              Resumo da fila
            </h2>
          </div>

          <button
            type="button"
            onClick={() =>
              void loadQueue()
            }
            disabled={loading}
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-cyan-500 hover:text-cyan-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? 'Atualizando...'
              : 'Atualizar dados'}
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {mainMetrics.map(
            metric => (
              <MetricCard
                key={metric.label}
                label={metric.label}
                value={metric.value}
                description={
                  metric.description
                }
                emphasis={
                  metric.emphasis
                }
              />
            ),
          )}
        </div>
      </section>

      <section
        aria-labelledby="support-sla-title"
        className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
      >
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-700">
            Acordo de nível de serviço
          </p>

          <h2
            id="support-sla-title"
            className="mt-2 text-2xl font-bold text-[#081C2E] sm:text-3xl"
          >
            Farol do SLA
          </h2>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {(
            [
              {
                color:
                  'green',

                count:
                  metrics?.sla_green ??
                  NO_VALUE,
              },
              {
                color:
                  'yellow',

                count:
                  metrics?.sla_yellow ??
                  NO_VALUE,
              },
              {
                color:
                  'orange',

                count:
                  metrics?.sla_orange ??
                  NO_VALUE,
              },
              {
                color:
                  'red',

                count:
                  metrics?.sla_red ??
                  NO_VALUE,
              },
            ] as const
          ).map(item => {
            const presentation =
              SLA_PRESENTATION[
                item.color
              ]

            return (
              <article
                key={item.color}
                className="rounded-2xl border border-slate-200 p-5"
              >
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className={`h-3.5 w-3.5 shrink-0 rounded-full ${presentation.dot}`}
                  />

                  <p className="font-bold text-slate-800">
                    {
                      presentation.label
                    }
                  </p>
                </div>

                <p className="mt-4 text-3xl font-bold text-[#081C2E]">
                  {item.count}
                </p>
              </article>
            )
          })}
        </div>

        <div className="mt-6 grid gap-4 border-t border-slate-200 pt-6 sm:grid-cols-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
              Primeira resposta
            </p>

            <p className="mt-2 text-xl font-bold text-[#081C2E]">
              {formatMinutes(
                metrics
                  ?.average_first_response_minutes ??
                  null,
              )}
            </p>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
              Tempo para solução
            </p>

            <p className="mt-2 text-xl font-bold text-[#081C2E]">
              {formatMinutes(
                metrics
                  ?.average_resolution_minutes ??
                  null,
              )}
            </p>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
              Cumprimento do SLA
            </p>

            <p className="mt-2 text-xl font-bold text-[#081C2E]">
              {metrics
                ?.sla_compliance_percent ===
              null
                ? NO_VALUE
                : `${metrics?.sla_compliance_percent}%`}
            </p>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="support-filters-title"
        className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-700">
              Organização da fila
            </p>

            <h2
              id="support-filters-title"
              className="mt-2 text-2xl font-bold text-[#081C2E] sm:text-3xl"
            >
              Filtros operacionais
            </h2>
          </div>

          <button
            type="button"
            onClick={
              resetFilters
            }
            className="min-h-11 rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-cyan-500 hover:text-cyan-800"
          >
            Limpar filtros
          </button>
        </div>

        <div className="mt-6">
          <label>
            <span className="mb-2 block text-sm font-semibold text-slate-700">
              Protocolo ou assunto
            </span>

            <input
              type="search"
              value={
                filters.search
              }
              onChange={
                handleSearchChange
              }
              placeholder="Pesquisar chamado"
              className="min-h-12 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
            />
          </label>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SelectField
            label="Status"
            name="operationalStatus"
            value={
              filters.operationalStatus
            }
            onChange={
              updateFilter
            }
            options={[
              {
                value:
                  '',

                label:
                  'Todos os status',
              },
              {
                value:
                  'open',

                label:
                  'Aberto',
              },
              {
                value:
                  'in_service',

                label:
                  'Em atendimento',
              },
              {
                value:
                  'waiting_user',

                label:
                  'Aguardando usuário',
              },
              {
                value:
                  'closed',

                label:
                  'Encerrado',
              },
            ]}
          />

          <SelectField
            label="Farol do SLA"
            name="sla"
            value={
              filters.sla
            }
            onChange={
              updateFilter
            }
            options={[
              {
                value:
                  '',

                label:
                  'Todos os faróis',
              },
              {
                value:
                  'green',

                label:
                  'Verde — dentro do prazo',
              },
              {
                value:
                  'yellow',

                label:
                  'Amarelo — atenção',
              },
              {
                value:
                  'orange',

                label:
                  'Laranja — crítico',
              },
              {
                value:
                  'red',

                label:
                  'Vermelho — estourado',
              },
              {
                value:
                  'gray',

                label:
                  'Cinza — pausado ou encerrado',
              },
            ]}
          />

          <SelectField
            label="Prioridade"
            name="priority"
            value={
              filters.priority
            }
            onChange={
              updateFilter
            }
            options={[
              {
                value:
                  '',

                label:
                  'Todas as prioridades',
              },
              {
                value:
                  'urgent',

                label:
                  'Urgente',
              },
              {
                value:
                  'high',

                label:
                  'Alta',
              },
              {
                value:
                  'normal',

                label:
                  'Normal',
              },
              {
                value:
                  'low',

                label:
                  'Baixa',
              },
            ]}
          />

          <SelectField
            label="Categoria"
            name="category"
            value={
              filters.category
            }
            onChange={
              updateFilter
            }
            options={[
              {
                value:
                  '',

                label:
                  'Todas as categorias',
              },
              ...Object.entries(
                CATEGORY_LABELS,
              ).map(
                ([
                  value,
                  label,
                ]) => ({
                  value,
                  label,
                }),
              ),
            ]}
          />

          <SelectField
            label="Tipo de conta"
            name="accountType"
            value={
              filters.accountType
            }
            onChange={
              updateFilter
            }
            options={[
              {
                value:
                  '',

                label:
                  'Todos os tipos',
              },
              {
                value:
                  'corporate',

                label:
                  'Institucional',
              },
              {
                value:
                  'platform',

                label:
                  'Plataforma',
              },
              {
                value:
                  'individual',

                label:
                  'Individual',
              },
            ]}
          />

          <SelectField
            label="Nível de serviço"
            name="serviceTier"
            value={
              filters.serviceTier
            }
            onChange={
              updateFilter
            }
            options={[
              {
                value:
                  '',

                label:
                  'Todos os níveis',
              },
              {
                value:
                  'network',

                label:
                  'Rede de ensino',
              },
              {
                value:
                  'institutional',

                label:
                  'Institucional',
              },
              {
                value:
                  'platform',

                label:
                  'Plataforma',
              },
              {
                value:
                  'individual_pro',

                label:
                  'Professor Pro',
              },
              {
                value:
                  'individual_free',

                label:
                  'Individual gratuito',
              },
            ]}
          />

          <SelectField
            label="Produto"
            name="productCode"
            value={
              filters.productCode
            }
            onChange={
              updateFilter
            }
            options={[
              {
                value:
                  '',

                label:
                  'Todos os produtos',
              },
              ...Object.entries(
                PRODUCT_LABELS,
              ).map(
                ([
                  value,
                  label,
                ]) => ({
                  value,
                  label,
                }),
              ),
            ]}
          />

          <SelectField
            label="Perfil do solicitante"
            name="requesterRole"
            value={
              filters.requesterRole
            }
            onChange={
              updateFilter
            }
            options={[
              {
                value:
                  '',

                label:
                  'Todos os perfis',
              },
              {
                value:
                  'super_admin',

                label:
                  'Superadministrador',
              },
              {
                value:
                  'platform_admin',

                label:
                  'Administrador da plataforma',
              },
              {
                value:
                  'regional_manager',

                label:
                  'Gestor de rede',
              },
              {
                value:
                  'director',

                label:
                  'Diretor',
              },
              {
                value:
                  'coordinator',

                label:
                  'Coordenador',
              },
              {
                value:
                  'teacher',

                label:
                  'Professor',
              },
              {
                value:
                  'student',

                label:
                  'Estudante',
              },
            ]}
          />

          <SelectField
            label="Responsável"
            name="assignment"
            value={
              filters.assignment
            }
            onChange={
              updateFilter
            }
            options={[
              {
                value:
                  'all',

                label:
                  'Todos',
              },
              {
                value:
                  'unassigned',

                label:
                  'Sem responsável',
              },
              {
                value:
                  'assigned',

                label:
                  'Com responsável',
              },
              {
                value:
                  'mine',

                label:
                  'Atribuídos a mim',
              },
            ]}
          />

          <SelectField
            label="Ordenação"
            name="sort"
            value={
              filters.sort
            }
            onChange={
              updateFilter
            }
            options={[
              {
                value:
                  'sla',

                label:
                  'Risco de SLA',
              },
              {
                value:
                  'priority',

                label:
                  'Prioridade',
              },
              {
                value:
                  'oldest',

                label:
                  'Mais antigos',
              },
              {
                value:
                  'newest',

                label:
                  'Mais recentes',
              },
              {
                value:
                  'updated',

                label:
                  'Última atualização',
              },
            ]}
          />
        </div>

        <details className="mt-6 rounded-2xl border border-slate-200 bg-slate-50">
          <summary className="cursor-pointer px-5 py-4 text-sm font-bold text-slate-700">
            Filtros institucionais avançados
          </summary>

          <div className="grid gap-4 border-t border-slate-200 p-5 md:grid-cols-2">
            <label>
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                ID da instituição
              </span>

              <input
                type="text"
                value={
                  filters.organizationId
                }
                onChange={event =>
                  updateFilter(
                    'organizationId',
                    event.target.value,
                  )
                }
                placeholder="UUID da instituição"
                className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
              />
            </label>

            <label>
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                ID da escola
              </span>

              <input
                type="text"
                value={
                  filters.schoolId
                }
                onChange={event =>
                  updateFilter(
                    'schoolId',
                    event.target.value,
                  )
                }
                placeholder="UUID da escola"
                className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
              />
            </label>
          </div>
        </details>
      </section>

      <section
        aria-labelledby="support-queue-title"
        className="mt-8"
      >
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-700">
            Fila operacional
          </p>

          <h2
            id="support-queue-title"
            className="mt-2 text-2xl font-bold text-[#081C2E] sm:text-3xl"
          >
            Chamados priorizados
          </h2>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            A ordem padrão considera
            estouro de SLA, risco,
            prioridade, tipo de atendimento
            e antiguidade.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-semibold leading-6 text-red-800"
          >
            {error}
          </div>
        )}

        {loading && (
          <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-600 shadow-sm">
            Carregando fila de suporte...
          </div>
        )}

        {!loading &&
          !error &&
          tickets.length ===
            0 && (
            <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <p className="text-lg font-bold text-[#081C2E]">
                Nenhum chamado encontrado
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Ajuste os filtros para
                consultar outros chamados.
              </p>
            </div>
          )}

        {!loading &&
          !error &&
          tickets.length >
            0 && (
            <div className="mt-6 space-y-5">
              {tickets.map(
                ticket => {
                  const sla =
                    SLA_PRESENTATION[
                      ticket.sla_light
                    ]

                  return (
                    <article
                      key={
                        ticket.id
                      }
                      className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm"
                    >
                      <div
                        className={`h-1.5 w-full ${sla.dot}`}
                      />

                      <div className="p-6 sm:p-7">
                        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
                          <div className="min-w-0">
                            <p className="break-all text-xs font-bold uppercase tracking-[0.18em] text-cyan-700 sm:break-normal">
                              {
                                ticket.protocol
                              }
                            </p>

                            <h3 className="mt-3 break-words text-2xl font-bold text-[#081C2E]">
                              {
                                ticket.subject
                              }
                            </h3>

                            <div className="mt-4 flex flex-wrap gap-2">
                              <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-800">
                                {getLabel(
                                  STATUS_LABELS,
                                  ticket.operational_status,
                                )}
                              </span>

                              <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-800">
                                {getLabel(
                                  PRIORITY_LABELS,
                                  ticket.priority,
                                )}
                              </span>

                              <span
                                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${sla.badge}`}
                              >
                                <span
                                  aria-hidden="true"
                                  className={`h-2.5 w-2.5 rounded-full ${sla.dot}`}
                                />

                                {
                                  sla.label
                                }
                              </span>
                            </div>
                          </div>

                          <div className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:min-w-64">
                            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                              Tempo do SLA
                            </p>

                            <p className="mt-2 break-words text-lg font-bold text-[#081C2E]">
                              {formatDurationFromSeconds(
                                ticket.seconds_until_sla_breach,
                              )}
                            </p>

                            <p className="mt-2 text-sm leading-6 text-slate-600">
                              Prazo:{' '}
                              {formatDateTime(
                                ticket.active_sla_due_at,
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="mt-6 grid gap-5 border-t border-slate-200 pt-6 sm:grid-cols-2 xl:grid-cols-4">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                              Produto
                            </p>

                            <p className="mt-2 break-words font-bold text-slate-800">
                              {getLabel(
                                PRODUCT_LABELS,
                                ticket.product_code,
                              )}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                              Categoria
                            </p>

                            <p className="mt-2 break-words font-bold text-slate-800">
                              {getLabel(
                                CATEGORY_LABELS,
                                ticket.category,
                              )}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                              Solicitante
                            </p>

                            <p className="mt-2 break-words font-bold text-slate-800">
                              {getLabel(
                                ACCOUNT_LABELS,
                                ticket.requester_account_type,
                              )}
                            </p>

                            <p className="mt-1 break-words text-sm text-slate-600">
                              Perfil:{' '}
                              {ticket.requester_role ??
                                NO_VALUE}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                              Nível de serviço
                            </p>

                            <p className="mt-2 break-words font-bold text-slate-800">
                              {getLabel(
                                SERVICE_TIER_LABELS,
                                ticket.requester_service_tier,
                              )}
                            </p>

                            <p className="mt-1 break-words text-sm text-slate-600">
                              {
                                ticket.sla_policy_code ??
                                NO_VALUE
                              }
                            </p>
                          </div>
                        </div>

                        <div className="mt-6 grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:grid-cols-2 lg:grid-cols-4">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                              Pontuação
                            </p>

                            <p className="mt-2 font-bold text-slate-800">
                              {
                                ticket.priority_score
                              }
                            </p>
                          </div>

                          <div>
                            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                              Responsável
                            </p>

                            <p
                              className={`mt-2 font-bold ${
                                ticket.assigned_to_user_id
                                  ? 'text-emerald-700'
                                  : 'text-red-700'
                              }`}
                            >
                              {ticket.assigned_to_user_id
                                ? 'Atribuído'
                                : 'Sem responsável'}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                              Criado em
                            </p>

                            <p className="mt-2 font-bold text-slate-800">
                              {formatDateTime(
                                ticket.created_at,
                              )}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                              Atualização
                            </p>

                            <p className="mt-2 font-bold text-slate-800">
                              {formatDateTime(
                                ticket.updated_at,
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
                          <p className="text-sm leading-6 text-slate-600">
                            O atendimento detalhado,
                            atribuição e alteração de
                            status serão conectados na
                            próxima etapa.
                          </p>

                          <span className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#081C2E] px-5 py-3 text-center text-sm font-bold text-white">
                            Chamado na fila
                          </span>
                        </div>
                      </div>
                    </article>
                  )
                },
              )}
            </div>
          )}

        {pagination &&
          pagination.totalPages >
            1 && (
            <nav
              aria-label="Paginação dos chamados"
              className="mt-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <p className="text-sm font-semibold text-slate-600">
                Página{' '}
                {
                  pagination.page
                }{' '}
                de{' '}
                {
                  pagination.totalPages
                }
              </p>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={
                    !pagination.hasPreviousPage
                  }
                  onClick={() =>
                    setPage(
                      currentPage =>
                        Math.max(
                          1,
                          currentPage -
                            1,
                        ),
                    )
                  }
                  className="min-h-11 rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Anterior
                </button>

                <button
                  type="button"
                  disabled={
                    !pagination.hasNextPage
                  }
                  onClick={() =>
                    setPage(
                      currentPage =>
                        currentPage +
                        1,
                    )
                  }
                  className="min-h-11 rounded-xl bg-[#081C2E] px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Próxima
                </button>
              </div>
            </nav>
          )}
      </section>
    </div>
  )
}