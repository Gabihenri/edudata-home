'use client'

import Link from 'next/link'

import {
  type FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'

import {
  useParams,
  usePathname,
} from 'next/navigation'

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

type SupportAuthorType =
  | 'requester'
  | 'support'
  | 'system'

type SupportVisibility =
  | 'shared'
  | 'internal'

type SupportMessageType =
  | 'message'
  | 'system_event'

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

interface SupportMessage {
  id: string
  ticket_id: string

  author_user_id:
    | string
    | null

  author_type:
    SupportAuthorType

  visibility:
    SupportVisibility

  message_type:
    SupportMessageType

  body: string
  created_at: string
}

interface SupportStatusHistoryItem {
  id: string
  ticket_id: string

  previous_status:
    | SupportStatus
    | null

  new_status:
    SupportStatus

  actor_type:
    SupportAuthorType

  visibility:
    SupportVisibility

  reason:
    | string
    | null

  created_at: string
}

interface SupportTicketDetail {
  ticket: SupportTicket
  messages: SupportMessage[]

  statusHistory:
    SupportStatusHistoryItem[]

  markedReadCount: number
}

interface SupportTicketResponse {
  success: boolean
  data?: SupportTicketDetail
  error?: string
}

interface CreateMessageResponse {
  success: boolean
  message?: string

  data?: {
    message: SupportMessage

    ticket:
      | {
          id: string
          protocol: string
          status: SupportStatus
          last_message_at: string
          last_requester_message_at:
            | string
            | null
          last_support_message_at:
            | string
            | null
          status_changed_at: string
          updated_at: string
        }
      | null
  }

  error?: string
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
      'Privacidade e proteção de dados',

    suggestion:
      'Sugestão de melhoria',

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

const PRODUCT_LABELS:
  Record<string, string> = {
    platform:
      'Central EIOS',

    professor_digital:
      'Professor Digital',

    agenda_edi:
      'Agenda Inteligente EDI',

    academy:
      'EduData Academy',

    analytics:
      'EduData Analytics',

    sgpa:
      'SGPA',

    observatory:
      'Observatório da Educação',

    community:
      'Comunidade EduData IA',

    backoffice:
      'BackOffice',

    experience_manager:
      'Experience Manager',
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

function getProductLabel(
  productCode: string,
): string {
  return (
    PRODUCT_LABELS[
      productCode
    ] ??
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
      'border-slate-300',
      'bg-slate-100',
      'text-slate-700',
    ].join(' ')
  }

  if (
    status === 'waiting_user'
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
    status === 'in_analysis'
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

function getAuthorLabel(
  authorType:
    SupportAuthorType,
): string {
  if (
    authorType === 'support'
  ) {
    return 'Equipe de suporte'
  }

  if (
    authorType === 'system'
  ) {
    return 'Sistema EIOS'
  }

  return 'Solicitante'
}

function getMessageContainerClasses(
  message: SupportMessage,
): string {
  if (
    message.message_type ===
    'system_event'
  ) {
    return [
      'mx-auto',
      'max-w-xl',
      'border-slate-200',
      'bg-slate-100',
      'text-slate-700',
    ].join(' ')
  }

  if (
    message.visibility ===
    'internal'
  ) {
    return [
      'mr-auto',
      'max-w-2xl',
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
      'ml-auto',
      'max-w-2xl',
      'border-cyan-200',
      'bg-cyan-50',
      'text-slate-950',
    ].join(' ')
  }

  return [
    'mr-auto',
    'max-w-2xl',
    'border-slate-200',
    'bg-white',
    'text-slate-950',
  ].join(' ')
}

export default function SupportTicketPage() {
  const params =
    useParams<{
      id: string | string[]
    }>()

  const pathname =
    usePathname()

  const rawTicketId =
    params?.id

  const ticketId =
    Array.isArray(
      rawTicketId,
    )
      ? rawTicketId[0]
      : rawTicketId

  const messagesEndRef =
    useRef<HTMLDivElement | null>(
      null,
    )

  const [
    detail,
    setDetail,
  ] =
    useState<SupportTicketDetail | null>(
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
    submitting,
    setSubmitting,
  ] =
    useState(false)

  const [
    message,
    setMessage,
  ] =
    useState('')

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

  const loadTicket =
    useCallback(
      async (
        options?: {
          silent?: boolean
        },
      ) => {
        const silent =
          options?.silent ===
          true

        if (!ticketId) {
          setError(
            'O identificador do chamado não foi localizado.',
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
              `/api/support/tickets/${encodeURIComponent(
                ticketId,
              )}`,
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
              SupportTicketResponse

          if (
            !response.ok ||
            !result.success ||
            !result.data
          ) {
            throw new Error(
              result.error ??
                'Não foi possível carregar o chamado.',
            )
          }

          setDetail(
            result.data,
          )
        } catch (loadError) {
          setError(
            loadError instanceof
              Error
              ? loadError.message
              : 'Não foi possível carregar o chamado.',
          )
        } finally {
          if (silent) {
            setRefreshing(false)
          } else {
            setLoading(false)
          }
        }
      },
      [
        pathname,
        ticketId,
      ],
    )

  useEffect(() => {
    void loadTicket()
  }, [loadTicket])

  useEffect(() => {
    messagesEndRef
      .current
      ?.scrollIntoView({
        block:
          'end',
      })
  }, [
    detail?.messages.length,
  ])

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    if (
      submitting ||
      !ticketId
    ) {
      return
    }

    try {
      setSubmitting(true)
      setError(null)
      setSuccessMessage(null)

      const response =
        await fetch(
          `/api/support/tickets/${encodeURIComponent(
            ticketId,
          )}`,
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
                message,
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
          CreateMessageResponse

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.error ??
            'Não foi possível enviar a mensagem.',
        )
      }

      setMessage('')

      setSuccessMessage(
        'Mensagem enviada com sucesso.',
      )

      await loadTicket({
        silent:
          true,
      })
    } catch (submitError) {
      setError(
        submitError instanceof
          Error
          ? submitError.message
          : 'Não foi possível enviar a mensagem.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-slate-100 px-6 py-12">
        <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-cyan-700" />

          <p className="mt-5 text-sm font-semibold text-slate-700">
            Carregando chamado...
          </p>
        </section>
      </main>
    )
  }

  if (
    error &&
    !detail
  ) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-slate-100 px-6 py-12">
        <section className="w-full max-w-xl rounded-2xl border border-red-200 bg-white p-8 shadow-sm">
          <div className="h-1 w-16 bg-red-600" />

          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-red-600">
            Falha ao carregar
          </p>

          <h1 className="mt-2 text-2xl font-bold text-slate-950">
            Não foi possível abrir o chamado
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            {error}
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() =>
                void loadTicket()
              }
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Tentar novamente
            </button>

            <Link
              href="/suporte"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Voltar para o suporte
            </Link>
          </div>
        </section>
      </main>
    )
  }

  if (!detail) {
    return null
  }

  const {
    ticket,
    messages,
    statusHistory,
  } = detail

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <header className="border-b border-white/10 bg-[#071827] text-white">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <Link
            href="/suporte"
            className="inline-flex min-h-10 items-center rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-cyan-300 hover:text-white"
          >
            Voltar para meus chamados
          </Link>

          <p className="mt-8 text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">
            {ticket.protocol}
          </p>

          <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <h1 className="break-words text-3xl font-bold tracking-tight sm:text-4xl">
                {ticket.subject}
              </h1>

              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">
                Acompanhe o histórico e mantenha a comunicação
                com a equipe da EduData IA dentro deste
                protocolo.
              </p>
            </div>

            <span
              className={`inline-flex w-fit shrink-0 rounded-full border px-4 py-2 text-sm font-bold ${getStatusClasses(
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
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-8 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.55fr)]">
        <section className="self-start overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">
                Conversa interna
              </p>

              <h2 className="mt-3 text-2xl font-bold text-[#071827]">
                Histórico de mensagens
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                {messages.length === 1
                  ? '1 mensagem registrada.'
                  : `${messages.length} mensagens registradas.`}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                void loadTicket({
                  silent:
                    true,
                })
              }
              disabled={
                refreshing
              }
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {refreshing
                ? 'Atualizando...'
                : 'Atualizar conversa'}
            </button>
          </div>

          <div className="space-y-4 bg-slate-50 p-4 sm:p-8">
            {messages.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
                <p className="text-sm leading-6 text-slate-600">
                  Nenhuma mensagem foi encontrada neste chamado.
                </p>
              </div>
            ) : null}

            {messages.map(
              supportMessage => (
                <article
                  key={
                    supportMessage.id
                  }
                  className={`rounded-2xl border px-5 py-4 shadow-sm ${getMessageContainerClasses(
                    supportMessage,
                  )}`}
                >
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs font-bold uppercase tracking-[0.12em]">
                      {getAuthorLabel(
                        supportMessage.author_type,
                      )}
                    </p>

                    <time
                      dateTime={
                        supportMessage.created_at
                      }
                      className="text-xs opacity-70"
                    >
                      {formatDate(
                        supportMessage.created_at,
                      )}
                    </time>
                  </div>

                  {supportMessage.visibility ===
                  'internal' ? (
                    <p className="mt-3 text-xs font-bold uppercase tracking-[0.12em] text-amber-700">
                      Nota interna
                    </p>
                  ) : null}

                  <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 sm:text-base">
                    {
                      supportMessage.body
                    }
                  </p>
                </article>
              ),
            )}

            <div
              ref={
                messagesEndRef
              }
            />
          </div>

          <form
            onSubmit={
              handleSubmit
            }
            className="border-t border-slate-200 p-6 sm:p-8"
          >
            <label
              htmlFor="support-reply"
              className="block text-sm font-semibold text-slate-800"
            >
              Nova mensagem
            </label>

            <textarea
              id="support-reply"
              required
              minLength={1}
              maxLength={10000}
              rows={6}
              value={
                message
              }
              onChange={event =>
                setMessage(
                  event.target.value,
                )
              }
              placeholder="Escreva uma nova informação, dúvida ou resposta para a equipe de suporte."
              className="mt-2 w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm leading-6 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-cyan-700 focus:ring-4 focus:ring-cyan-100"
            />

            <div className="mt-2 flex items-center justify-between gap-4">
              <p className="text-xs leading-5 text-slate-500">
                Sua resposta ficará compartilhada com a equipe
                autorizada de suporte.
              </p>

              <p className="shrink-0 text-xs text-slate-500">
                {message.length}/10000
              </p>
            </div>

            <div
              aria-live="polite"
              className="mt-4 space-y-3"
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
              className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-[#071827] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#0B2B43] focus:outline-none focus:ring-4 focus:ring-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting
                ? 'Enviando mensagem...'
                : 'Enviar mensagem'}
            </button>

            {ticket.status ===
              'resolved' ||
            ticket.status ===
              'closed' ? (
              <p className="mt-4 text-center text-xs leading-5 text-slate-500">
                Uma nova resposta poderá reabrir este chamado
                automaticamente.
              </p>
            ) : null}
          </form>
        </section>

        <div className="space-y-8">
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Informações
              </p>

              <h2 className="mt-2 text-xl font-bold text-[#071827]">
                Dados do chamado
              </h2>
            </div>

            <dl className="divide-y divide-slate-200">
              <div className="p-6">
                <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
                  Produto
                </dt>

                <dd className="mt-2 text-sm font-semibold text-slate-900">
                  {getProductLabel(
                    ticket.product_code,
                  )}
                </dd>
              </div>

              <div className="p-6">
                <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
                  Categoria
                </dt>

                <dd className="mt-2 text-sm font-semibold text-slate-900">
                  {
                    CATEGORY_LABELS[
                      ticket.category
                    ]
                  }
                </dd>
              </div>

              <div className="p-6">
                <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
                  Prioridade
                </dt>

                <dd className="mt-2 text-sm font-semibold text-slate-900">
                  {
                    PRIORITY_LABELS[
                      ticket.priority
                    ]
                  }
                </dd>
              </div>

              <div className="p-6">
                <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
                  Criado em
                </dt>

                <dd className="mt-2 text-sm font-semibold text-slate-900">
                  {formatDate(
                    ticket.created_at,
                  )}
                </dd>
              </div>

              <div className="p-6">
                <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
                  Última atualização
                </dt>

                <dd className="mt-2 text-sm font-semibold text-slate-900">
                  {formatDate(
                    ticket.last_message_at,
                  )}
                </dd>
              </div>
            </dl>
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Andamento
              </p>

              <h2 className="mt-2 text-xl font-bold text-[#071827]">
                Histórico de status
              </h2>
            </div>

            <div className="p-6">
              {statusHistory.length ===
              0 ? (
                <p className="text-sm leading-6 text-slate-600">
                  Nenhuma alteração de status foi registrada.
                </p>
              ) : (
                <ol className="space-y-5 border-l-2 border-slate-200 pl-5">
                  {statusHistory.map(
                    historyItem => (
                      <li
                        key={
                          historyItem.id
                        }
                        className="relative"
                      >
                        <div className="absolute -left-[1.68rem] top-1 h-3 w-3 rounded-full border-2 border-white bg-cyan-700 ring-2 ring-slate-200" />

                        <p className="text-sm font-bold text-slate-900">
                          {
                            STATUS_LABELS[
                              historyItem.new_status
                            ]
                          }
                        </p>

                        {historyItem.reason ? (
                          <p className="mt-1 text-sm leading-6 text-slate-600">
                            {
                              historyItem.reason
                            }
                          </p>
                        ) : null}

                        {historyItem.visibility ===
                        'internal' ? (
                          <p className="mt-2 text-xs font-bold uppercase tracking-[0.1em] text-amber-700">
                            Registro interno
                          </p>
                        ) : null}

                        <time
                          dateTime={
                            historyItem.created_at
                          }
                          className="mt-2 block text-xs text-slate-500"
                        >
                          {formatDate(
                            historyItem.created_at,
                          )}
                        </time>
                      </li>
                    ),
                  )}
                </ol>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}