'use client'

import {
  type FormEvent,
  useCallback,
  useEffect,
  useState,
} from 'react'

import { usePathname } from 'next/navigation'

type SupportCategory =
  | 'technical'
  | 'access'
  | 'billing'
  | 'product'
  | 'pedagogical'
  | 'privacy'
  | 'suggestion'
  | 'other'

type SupportPriority =
  | 'low'
  | 'normal'
  | 'high'
  | 'urgent'

type SupportStatus =
  | 'open'
  | 'in_analysis'
  | 'waiting_user'
  | 'waiting_support'
  | 'resolved'
  | 'closed'
  | 'reopened'

interface SupportTicket {
  id: string
  protocol: string

  requester_user_id: string

  organization_id:
    | string
    | null

  school_id:
    | string
    | null

  product_code: string

  source_module:
    | string
    | null

  source_path:
    | string
    | null

  category: SupportCategory
  subject: string
  priority: SupportPriority
  status: SupportStatus

  assigned_to_user_id:
    | string
    | null

  last_message_at: string

  last_requester_message_at:
    | string
    | null

  last_support_message_at:
    | string
    | null

  status_changed_at: string

  resolved_at:
    | string
    | null

  closed_at:
    | string
    | null

  created_at: string
  updated_at: string
}

interface SupportTicketsResponse {
  success: boolean
  total?: number
  data?: SupportTicket[]
  error?: string
}

interface CreateSupportTicketResponse {
  success: boolean

  message?: string

  data?: {
    id: string
    protocol: string
    category: SupportCategory
    priority: SupportPriority
    productCode: string
    status: SupportStatus
  }

  error?: string
}

interface SelectOption<T extends string> {
  value: T
  label: string
}

const CATEGORY_OPTIONS:
  SelectOption<SupportCategory>[] = [
    {
      value: 'technical',
      label: 'Problema técnico',
    },
    {
      value: 'access',
      label: 'Acesso ou conta',
    },
    {
      value: 'billing',
      label: 'Pagamento ou ativação',
    },
    {
      value: 'product',
      label: 'Produto ou funcionalidade',
    },
    {
      value: 'pedagogical',
      label: 'Questão pedagógica',
    },
    {
      value: 'privacy',
      label: 'Privacidade e proteção de dados',
    },
    {
      value: 'suggestion',
      label: 'Sugestão de melhoria',
    },
    {
      value: 'other',
      label: 'Outro assunto',
    },
  ]

const PRIORITY_OPTIONS:
  SelectOption<SupportPriority>[] = [
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

const PRODUCT_OPTIONS = [
  {
    value: 'platform',
    label: 'Central EIOS',
  },
  {
    value: 'professor_digital',
    label: 'Professor Digital',
  },
  {
    value: 'agenda_edi',
    label: 'Agenda Inteligente EDI',
  },
  {
    value: 'academy',
    label: 'EduData Academy',
  },
  {
    value: 'analytics',
    label: 'EduData Analytics',
  },
  {
    value: 'sgpa',
    label: 'SGPA',
  },
  {
    value: 'observatory',
    label: 'Observatório da Educação',
  },
  {
    value: 'community',
    label: 'Comunidade EduData IA',
  },
  {
    value: 'backoffice',
    label: 'BackOffice',
  },
  {
    value: 'experience_manager',
    label: 'Experience Manager',
  },
] as const

const CATEGORY_LABELS:
  Record<SupportCategory, string> = {
    technical:
      'Problema técnico',

    access:
      'Acesso ou conta',

    billing:
      'Pagamento ou ativação',

    product:
      'Produto ou funcionalidade',

    pedagogical:
      'Questão pedagógica',

    privacy:
      'Privacidade',

    suggestion:
      'Sugestão',

    other:
      'Outro assunto',
  }

const PRIORITY_LABELS:
  Record<SupportPriority, string> = {
    low:
      'Baixa',

    normal:
      'Normal',

    high:
      'Alta',

    urgent:
      'Urgente',
  }

const STATUS_LABELS:
  Record<SupportStatus, string> = {
    open:
      'Aberto',

    in_analysis:
      'Em análise',

    waiting_user:
      'Aguardando você',

    waiting_support:
      'Aguardando equipe',

    resolved:
      'Resolvido',

    closed:
      'Encerrado',

    reopened:
      'Reaberto',
  }

function getProductLabel(
  productCode: string,
): string {
  const product =
    PRODUCT_OPTIONS.find(
      option =>
        option.value ===
        productCode,
    )

  return (
    product?.label ??
    productCode
  )
}

function getStatusClasses(
  status: SupportStatus,
): string {
  if (
    status === 'resolved'
  ) {
    return [
      'border-emerald-200',
      'bg-emerald-50',
      'text-emerald-800',
    ].join(' ')
  }

  if (
    status === 'closed'
  ) {
    return [
      'border-slate-200',
      'bg-slate-100',
      'text-slate-700',
    ].join(' ')
  }

  if (
    status ===
    'waiting_user'
  ) {
    return [
      'border-amber-200',
      'bg-amber-50',
      'text-amber-800',
    ].join(' ')
  }

  if (
    status ===
    'waiting_support'
  ) {
    return [
      'border-blue-200',
      'bg-blue-50',
      'text-blue-800',
    ].join(' ')
  }

  if (
    status ===
    'in_analysis'
  ) {
    return [
      'border-violet-200',
      'bg-violet-50',
      'text-violet-800',
    ].join(' ')
  }

  return [
    'border-cyan-200',
    'bg-cyan-50',
    'text-cyan-800',
  ].join(' ')
}

function formatDate(
  value: string,
): string {
  const date =
    new Date(value)

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value
  }

  return new Intl.DateTimeFormat(
    'pt-BR',
    {
      dateStyle:
        'short',

      timeStyle:
        'short',
    },
  ).format(date)
}

export default function SupportPage() {
  const pathname =
    usePathname()

  const [
    tickets,
    setTickets,
  ] =
    useState<SupportTicket[]>(
      [],
    )

  const [
    loading,
    setLoading,
  ] =
    useState(true)

  const [
    submitting,
    setSubmitting,
  ] =
    useState(false)

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
    category,
    setCategory,
  ] =
    useState<SupportCategory>(
      'technical',
    )

  const [
    productCode,
    setProductCode,
  ] =
    useState('platform')

  const [
    priority,
    setPriority,
  ] =
    useState<SupportPriority>(
      'normal',
    )

  const [
    subject,
    setSubject,
  ] =
    useState('')

  const [
    message,
    setMessage,
  ] =
    useState('')

  const loadTickets =
    useCallback(
      async () => {
        try {
          setLoading(true)
          setError(null)

          const response =
            await fetch(
              '/api/support/tickets',
              {
                method:
                  'GET',

                credentials:
                  'include',

                cache:
                  'no-store',
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
              SupportTicketsResponse

          if (
            !response.ok ||
            !result.success
          ) {
            throw new Error(
              result.error ??
                'Não foi possível carregar os chamados.',
            )
          }

          setTickets(
            result.data ?? [],
          )
        } catch (loadError) {
          setError(
            loadError instanceof
              Error
              ? loadError.message
              : 'Não foi possível carregar os chamados.',
          )
        } finally {
          setLoading(false)
        }
      },
      [pathname],
    )

  useEffect(() => {
    void loadTickets()
  }, [loadTickets])

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    if (submitting) {
      return
    }

    try {
      setSubmitting(true)
      setError(null)
      setSuccessMessage(null)

      const response =
        await fetch(
          '/api/support/tickets',
          {
            method:
              'POST',

            credentials:
              'include',

            cache:
              'no-store',

            headers: {
              'Content-Type':
                'application/json',
            },

            body:
              JSON.stringify({
                category,
                subject,
                message,
                productCode,

                sourceModule:
                  'support_center',

                sourcePath:
                  pathname,

                priority,

                sourceContext: {
                  pageVersion:
                    'v1.0',

                  channel:
                    'internal_support',

                  origin:
                    'support_page',
                },
              }),
          },
        )

      if (
        response.status === 401
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
          CreateSupportTicketResponse

      if (
        !response.ok ||
        !result.success ||
        !result.data
      ) {
        throw new Error(
          result.error ??
            'Não foi possível abrir o chamado.',
        )
      }

      setSuccessMessage(
        `Chamado ${result.data.protocol} aberto com sucesso.`,
      )

      setSubject('')
      setMessage('')
      setPriority('normal')

      await loadTickets()
    } catch (submitError) {
      setError(
        submitError instanceof
          Error
          ? submitError.message
          : 'Não foi possível abrir o chamado.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <header className="border-b border-white/10 bg-[#071827] text-white">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
            EIOS — Core Compartilhado
          </p>

          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
            Central de Suporte EDI
          </h1>

          <p className="mt-5 max-w-3xl text-base leading-8 text-slate-300 sm:text-lg">
            Abra solicitações, acompanhe protocolos e
            mantenha a comunicação com a equipe da
            EduData IA dentro da própria plataforma.
          </p>

          <div className="mt-8 grid max-w-3xl gap-4 sm:grid-cols-2">
            <div className="border-l-4 border-cyan-300 pl-4">
              <p className="text-sm font-bold text-white">
                Canal interno
              </p>

              <p className="mt-1 text-sm leading-6 text-slate-300">
                As mensagens ficam registradas no
                histórico do chamado.
              </p>
            </div>

            <div className="border-l-4 border-slate-500 pl-4">
              <p className="text-sm font-bold text-white">
                Acesso protegido
              </p>

              <p className="mt-1 text-sm leading-6 text-slate-300">
                Cada usuário acessa somente os chamados
                autorizados para sua conta.
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-8 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <section className="self-start overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">
              Nova solicitação
            </p>

            <h2 className="mt-3 text-2xl font-bold text-[#071827]">
              Abrir chamado
            </h2>

            <p className="mt-3 text-sm leading-7 text-slate-600">
              Descreva o que aconteceu e informe o produto
              relacionado. O sistema gerará um protocolo
              automaticamente.
            </p>
          </div>

          <form
            onSubmit={
              handleSubmit
            }
            className="space-y-6 p-6 sm:p-8"
          >
            <div>
              <label
                htmlFor="support-product"
                className="block text-sm font-semibold text-slate-800"
              >
                Produto ou área
              </label>

              <select
                id="support-product"
                value={
                  productCode
                }
                onChange={event =>
                  setProductCode(
                    event.target
                      .value,
                  )
                }
                className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-950 outline-none transition focus:border-cyan-700 focus:ring-4 focus:ring-cyan-100"
              >
                {PRODUCT_OPTIONS.map(
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
            </div>

            <div>
              <label
                htmlFor="support-category"
                className="block text-sm font-semibold text-slate-800"
              >
                Categoria
              </label>

              <select
                id="support-category"
                value={
                  category
                }
                onChange={event =>
                  setCategory(
                    event.target
                      .value as
                      SupportCategory,
                  )
                }
                className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-950 outline-none transition focus:border-cyan-700 focus:ring-4 focus:ring-cyan-100"
              >
                {CATEGORY_OPTIONS.map(
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
            </div>

            <div>
              <label
                htmlFor="support-priority"
                className="block text-sm font-semibold text-slate-800"
              >
                Prioridade
              </label>

              <select
                id="support-priority"
                value={
                  priority
                }
                onChange={event =>
                  setPriority(
                    event.target
                      .value as
                      SupportPriority,
                  )
                }
                className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-950 outline-none transition focus:border-cyan-700 focus:ring-4 focus:ring-cyan-100"
              >
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

              <p className="mt-2 text-xs leading-5 text-slate-500">
                Use urgente somente quando o problema impedir
                o acesso ou o uso da plataforma.
              </p>
            </div>

            <div>
              <label
                htmlFor="support-subject"
                className="block text-sm font-semibold text-slate-800"
              >
                Assunto
              </label>

              <input
                id="support-subject"
                type="text"
                required
                minLength={5}
                maxLength={200}
                value={
                  subject
                }
                onChange={event =>
                  setSubject(
                    event.target
                      .value,
                  )
                }
                placeholder="Exemplo: não consigo acessar meu planejamento"
                className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-cyan-700 focus:ring-4 focus:ring-cyan-100"
              />

              <p className="mt-2 text-right text-xs text-slate-500">
                {subject.length}/200
              </p>
            </div>

            <div>
              <label
                htmlFor="support-message"
                className="block text-sm font-semibold text-slate-800"
              >
                Descrição
              </label>

              <textarea
                id="support-message"
                required
                minLength={1}
                maxLength={10000}
                rows={7}
                value={
                  message
                }
                onChange={event =>
                  setMessage(
                    event.target
                      .value,
                  )
                }
                placeholder="Explique o problema, o resultado esperado e o que já tentou fazer."
                className="mt-2 w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm leading-6 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-cyan-700 focus:ring-4 focus:ring-cyan-100"
              />

              <p className="mt-2 text-right text-xs text-slate-500">
                {message.length}/10000
              </p>
            </div>

            <div
              aria-live="polite"
              className="space-y-3"
            >
              {error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-800">
                  {error}
                </div>
              ) : null}

              {successMessage ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold leading-6 text-emerald-800">
                  {successMessage}
                </div>
              ) : null}
            </div>

            <button
              type="submit"
              disabled={
                submitting
              }
              className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-[#071827] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#0B2B43] focus:outline-none focus:ring-4 focus:ring-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting
                ? 'Abrindo chamado...'
                : 'Abrir chamado'}
            </button>

            <p className="text-center text-xs leading-5 text-slate-500">
              A primeira versão aceita mensagens de texto.
              Anexos serão incorporados posteriormente em
              armazenamento privado.
            </p>
          </form>
        </section>

        <section className="self-start overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Histórico
              </p>

              <h2 className="mt-3 text-2xl font-bold text-[#071827]">
                Meus chamados
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                {tickets.length ===
                1
                  ? '1 chamado disponível.'
                  : `${tickets.length} chamados disponíveis.`}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                void loadTickets()
              }
              disabled={
                loading
              }
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? 'Atualizando...'
                : 'Atualizar lista'}
            </button>
          </div>

          <div className="p-6 sm:p-8">
            {loading ? (
              <div className="flex min-h-64 items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-cyan-700" />

                  <p className="mt-4 text-sm font-semibold text-slate-600">
                    Carregando chamados...
                  </p>
                </div>
              </div>
            ) : null}

            {!loading &&
            tickets.length ===
              0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
                <div className="mx-auto h-1 w-16 bg-cyan-700" />

                <h3 className="mt-6 text-xl font-bold text-[#071827]">
                  Nenhum chamado aberto
                </h3>

                <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-600">
                  Quando você abrir uma solicitação, o
                  protocolo e o andamento aparecerão nesta
                  área.
                </p>
              </div>
            ) : null}

            {!loading &&
            tickets.length >
              0 ? (
              <div className="space-y-4">
                {tickets.map(
                  ticket => (
                    <article
                      key={
                        ticket.id
                      }
                      className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
                    >
                      <div className="h-1 bg-cyan-700" />

                      <div className="p-5 sm:p-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <p className="text-xs font-bold uppercase tracking-[0.14em] text-cyan-700">
                              {
                                ticket.protocol
                              }
                            </p>

                            <h3 className="mt-2 break-words text-lg font-bold text-[#071827]">
                              {
                                ticket.subject
                              }
                            </h3>
                          </div>

                          <span
                            className={`inline-flex w-fit shrink-0 rounded-full border px-3 py-1 text-xs font-bold ${getStatusClasses(
                              ticket.status,
                            )}`}
                          >
                            {
                              STATUS_LABELS[
                                ticket.status
                              ]
                            }
                          </span>
                        </div>

                        <dl className="mt-5 grid gap-4 border-t border-slate-200 pt-5 sm:grid-cols-2">
                          <div>
                            <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
                              Produto
                            </dt>

                            <dd className="mt-1 text-sm font-semibold text-slate-800">
                              {getProductLabel(
                                ticket.product_code,
                              )}
                            </dd>
                          </div>

                          <div>
                            <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
                              Categoria
                            </dt>

                            <dd className="mt-1 text-sm font-semibold text-slate-800">
                              {
                                CATEGORY_LABELS[
                                  ticket.category
                                ]
                              }
                            </dd>
                          </div>

                          <div>
                            <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
                              Prioridade
                            </dt>

                            <dd className="mt-1 text-sm font-semibold text-slate-800">
                              {
                                PRIORITY_LABELS[
                                  ticket.priority
                                ]
                              }
                            </dd>
                          </div>

                          <div>
                            <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
                              Última atualização
                            </dt>

                            <dd className="mt-1 text-sm font-semibold text-slate-800">
                              {formatDate(
                                ticket.last_message_at,
                              )}
                            </dd>
                          </div>
                        </dl>
                      </div>
                    </article>
                  ),
                )}
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  )
}