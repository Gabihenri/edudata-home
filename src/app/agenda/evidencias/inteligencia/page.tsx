'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

import Link from 'next/link'

import {
  AgendaPageShell,
} from '@/components/agenda/AgendaPageShell'

type ProcessingStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'requires_human_review'
  | 'failed'
  | 'cancelled'
  | 'ignored'

type HumanReviewStatus =
  | 'not_required'
  | 'pending'
  | 'in_review'
  | 'approved'
  | 'rejected'
  | 'changes_requested'

type IntelligenceRun = {
  id:
    string

  evidence_id:
    string

  event_id:
    string | null

  idempotency_key:
    string

  engine_name:
    string

  engine_version:
    string

  contract_version:
    string | null

  processing_source:
    string

  processing_status:
    ProcessingStatus

  quality_score:
    number | null

  reliability_score:
    number | null

  confidence_score:
    number | null

  quality:
    Record<string, unknown>

  reliability:
    Record<string, unknown>

  framework_classifications:
    unknown[]

  validation:
    Record<string, unknown>

  explanation:
    Record<string, unknown>

  requires_human_review:
    boolean

  human_review_status:
    HumanReviewStatus

  human_reviewed_at:
    string | null

  human_reviewed_by:
    string | null

  human_review_notes:
    string | null

  warnings:
    unknown[]

  errors:
    unknown[]

  attempt_count:
    number

  correlation_id:
    string | null

  causation_id:
    string | null

  parent_event_id:
    string | null

  trace_id:
    string | null

  user_id:
    string

  organization_id:
    string | null

  school_id:
    string | null

  requested_by:
    string | null

  started_at:
    string

  processed_at:
    string | null

  failed_at:
    string | null

  last_error:
    string | null

  metadata:
    Record<string, unknown>

  created_at:
    string

  updated_at:
    string
}

type IntelligenceSummary = {
  total:
    number

  completed:
    number

  requiresHumanReview:
    number

  failed:
    number

  inProgress:
    number

  pendingHumanReview:
    number

  averageQualityScore:
    number | null

  averageReliabilityScore:
    number | null

  averageConfidenceScore:
    number | null
}

type IntelligenceApiResponse = {
  success:
    boolean

  data: {
    runs:
      IntelligenceRun[]

    summary:
      IntelligenceSummary
  }

  filters: {
    evidenceId:
      string | null

    eventId:
      string | null

    organizationId:
      string | null

    schoolId:
      string | null

    processingStatus:
      ProcessingStatus | null

    humanReviewStatus:
      HumanReviewStatus | null

    requiresHumanReview:
      boolean | null

    engineName:
      string | null

    limit:
      number
  }

  meta: {
    returnedItems:
      number

    generatedAt:
      string
  }
}

type LoadingStatus =
  | 'idle'
  | 'loading'
  | 'success'
  | 'error'

type StatusFilter =
  | 'all'
  | ProcessingStatus

const STATUS_LABELS:
  Record<
    ProcessingStatus,
    string
  > = {
    pending:
      'Aguardando',

    processing:
      'Em processamento',

    completed:
      'Concluída',

    requires_human_review:
      'Revisão necessária',

    failed:
      'Falhou',

    cancelled:
      'Cancelada',

    ignored:
      'Ignorada',
  }

const REVIEW_LABELS:
  Record<
    HumanReviewStatus,
    string
  > = {
    not_required:
      'Não necessária',

    pending:
      'Pendente',

    in_review:
      'Em revisão',

    approved:
      'Aprovada',

    rejected:
      'Rejeitada',

    changes_requested:
      'Ajustes solicitados',
  }

const STATUS_FILTER_OPTIONS:
  Array<{
    value:
      StatusFilter

    label:
      string
  }> = [
    {
      value:
        'all',

      label:
        'Todas',
    },
    {
      value:
        'completed',

      label:
        'Concluídas',
    },
    {
      value:
        'requires_human_review',

      label:
        'Revisão necessária',
    },
    {
      value:
        'processing',

      label:
        'Em processamento',
    },
    {
      value:
        'pending',

      label:
        'Aguardando',
    },
    {
      value:
        'failed',

      label:
        'Falhas',
    },
  ]

function isRecord(
  value:
    unknown,
): value is Record<
  string,
  unknown
> {
  return (
    typeof value ===
      'object' &&
    value !==
      null &&
    !Array.isArray(
      value,
    )
  )
}

function getErrorMessage(
  error:
    unknown,
): string {
  if (
    error instanceof Error
  ) {
    return error.message
  }

  if (
    typeof error ===
      'string' &&
    error.trim()
  ) {
    return error.trim()
  }

  return 'Não foi possível carregar as evidências inteligentes.'
}

function formatDateTime(
  value:
    string | null,
): string {
  if (!value) {
    return 'Data não informada'
  }

  const date =
    new Date(
      value,
    )

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return 'Data indisponível'
  }

  return date.toLocaleString(
    'pt-BR',
    {
      day:
        '2-digit',

      month:
        '2-digit',

      year:
        'numeric',

      hour:
        '2-digit',

      minute:
        '2-digit',
    },
  )
}

function formatScore(
  value:
    number | null,
): string {
  if (
    typeof value !==
      'number' ||
    !Number.isFinite(
      value,
    )
  ) {
    return '—'
  }

  return `${Math.round(
    value *
      100,
  )}%`
}

function getStatusClasses(
  status:
    ProcessingStatus,
): string {
  if (
    status ===
      'completed'
  ) {
    return [
      'border-emerald-200',
      'bg-emerald-50',
      'text-emerald-800',
    ].join(' ')
  }

  if (
    status ===
      'requires_human_review'
  ) {
    return [
      'border-amber-200',
      'bg-amber-50',
      'text-amber-900',
    ].join(' ')
  }

  if (
    status ===
      'failed'
  ) {
    return [
      'border-rose-200',
      'bg-rose-50',
      'text-rose-800',
    ].join(' ')
  }

  if (
    status ===
      'processing' ||
    status ===
      'pending'
  ) {
    return [
      'border-blue-200',
      'bg-blue-50',
      'text-blue-800',
    ].join(' ')
  }

  return [
    'border-slate-200',
    'bg-slate-50',
    'text-slate-700',
  ].join(' ')
}

function stringifyValue(
  value:
    unknown,
): string {
  if (
    typeof value ===
      'string'
  ) {
    return value
  }

  if (
    typeof value ===
      'number' ||
    typeof value ===
      'boolean'
  ) {
    return String(
      value,
    )
  }

  if (
    isRecord(
      value,
    )
  ) {
    const labelCandidates = [
      value.label,
      value.name,
      value.title,
      value.message,
      value.description,
      value.classification,
      value.category,
      value.dimension,
      value.pillar,
    ]

    for (
      const candidate
      of labelCandidates
    ) {
      if (
        typeof candidate ===
          'string' &&
        candidate.trim()
      ) {
        return candidate.trim()
      }
    }
  }

  try {
    return JSON.stringify(
      value,
    )
  } catch {
    return 'Informação indisponível'
  }
}

async function readErrorResponse(
  response:
    Response,
): Promise<string> {
  try {
    const body:
      unknown =
      await response.json()

    if (
      isRecord(
        body,
      ) &&
      typeof body.error ===
        'string'
    ) {
      return body.error
    }
  } catch {
    return `Erro HTTP ${response.status}.`
  }

  return `Erro HTTP ${response.status}.`
}

function SummaryCard({
  label,
  value,
  description,
}: {
  label:
    string

  value:
    string | number

  description:
    string
}) {
  return (
    <article
      className={[
        'border-b border-slate-200',
        'p-5',
        'sm:border-r',
        'xl:border-b-0',
      ].join(' ')}
    >
      <p
        className={[
          'text-xs font-bold',
          'uppercase tracking-[0.15em]',
          'text-slate-500',
        ].join(' ')}
      >
        {label}
      </p>

      <p
        className={[
          'mt-3 text-3xl',
          'font-bold text-[#071827]',
        ].join(' ')}
      >
        {value}
      </p>

      <p
        className={[
          'mt-1 text-sm',
          'text-slate-500',
        ].join(' ')}
      >
        {description}
      </p>
    </article>
  )
}

export default function AgendaEvidenceIntelligencePage() {
  const [
    loadingStatus,
    setLoadingStatus,
  ] = useState<
    LoadingStatus
  >('idle')

  const [
    runs,
    setRuns,
  ] = useState<
    IntelligenceRun[]
  >([])

  const [
    summary,
    setSummary,
  ] = useState<
    IntelligenceSummary
  >({
    total:
      0,

    completed:
      0,

    requiresHumanReview:
      0,

    failed:
      0,

    inProgress:
      0,

    pendingHumanReview:
      0,

    averageQualityScore:
      null,

    averageReliabilityScore:
      null,

    averageConfidenceScore:
      null,
  })

  const [
    statusFilter,
    setStatusFilter,
  ] = useState<
    StatusFilter
  >('all')

  const [
    searchTerm,
    setSearchTerm,
  ] = useState('')

  const [
    error,
    setError,
  ] = useState<
    string | null
  >(null)

  const [
    generatedAt,
    setGeneratedAt,
  ] = useState<
    string | null
  >(null)

  const loadRuns =
    useCallback(
      async (): Promise<void> => {
        setLoadingStatus(
          'loading',
        )

        setError(
          null,
        )

        try {
          const query =
            new URLSearchParams()

          query.set(
            'limit',
            '100',
          )

          if (
            statusFilter !==
              'all'
          ) {
            query.set(
              'status',
              statusFilter,
            )
          }

          const response =
            await fetch(
              `/api/agenda/evidences/intelligence?${query.toString()}`,
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

          if (
            !response.ok
          ) {
            throw new Error(
              await readErrorResponse(
                response,
              ),
            )
          }

          const body =
            await response.json() as
              IntelligenceApiResponse

          if (
            !body.success
          ) {
            throw new Error(
              'A API não concluiu a consulta.',
            )
          }

          setRuns(
            body.data.runs,
          )

          setSummary(
            body.data.summary,
          )

          setGeneratedAt(
            body.meta.generatedAt,
          )

          setLoadingStatus(
            'success',
          )
        } catch (
          loadError
        ) {
          setRuns(
            [],
          )

          setError(
            getErrorMessage(
              loadError,
            ),
          )

          setLoadingStatus(
            'error',
          )
        }
      },
      [
        statusFilter,
      ],
    )

  useEffect(() => {
    void loadRuns()
  }, [
    loadRuns,
  ])

  const filteredRuns =
    useMemo(() => {
      const normalizedSearch =
        searchTerm
          .trim()
          .toLowerCase()

      if (
        !normalizedSearch
      ) {
        return runs
      }

      return runs.filter(
        run => {
          const searchableValues = [
            run.id,
            run.evidence_id,
            run.event_id,
            run.engine_name,
            run.engine_version,
            run.processing_status,
            run.human_review_status,
            run.last_error,
          ]

          return searchableValues
            .filter(
              (
                value,
              ): value is string =>
                typeof value ===
                  'string',
            )
            .some(
              value =>
                value
                  .toLowerCase()
                  .includes(
                    normalizedSearch,
                  ),
            )
        },
      )
    }, [
      runs,
      searchTerm,
    ])

  return (
    <main
      className="min-h-screen bg-[#F5F6F8]"
    >
      <AgendaPageShell
        eyebrow="Evidence Intelligence"
        title="Evidências Inteligentes"
        description="Acompanhe qualidade, confiabilidade, classificações EDI, revisões humanas e histórico de processamento das evidências pedagógicas."
      >
        <div
          className="space-y-6 sm:space-y-8"
        >
          <section
            className={[
              'overflow-hidden',
              'rounded-[1.75rem]',
              'border border-cyan-200',
              'bg-cyan-50',
              'shadow-sm',
            ].join(' ')}
          >
            <div
              className={[
                'flex flex-col gap-5',
                'px-5 py-6',
                'sm:px-7',
                'lg:flex-row',
                'lg:items-center',
                'lg:justify-between',
              ].join(' ')}
            >
              <div>
                <p
                  className={[
                    'text-xs font-bold',
                    'uppercase tracking-[0.18em]',
                    'text-[#075F78]',
                  ].join(' ')}
                >
                  Evidências Inteligentes v0.1
                </p>

                <h2
                  className={[
                    'mt-2 text-2xl',
                    'font-bold text-[#071827]',
                  ].join(' ')}
                >
                  Inteligência aplicada à documentação pedagógica
                </h2>

                <p
                  className={[
                    'mt-2 max-w-3xl',
                    'text-sm leading-6',
                    'text-slate-600',
                  ].join(' ')}
                >
                  Os resultados apresentados apoiam a análise profissional e não substituem a decisão pedagógica humana.
                </p>
              </div>

              <div
                className={[
                  'flex flex-col gap-3',
                  'sm:flex-row',
                ].join(' ')}
              >
                <Link
                  href="/agenda/evidencias"
                  className={[
                    'inline-flex min-h-11',
                    'items-center justify-center',
                    'rounded-xl border',
                    'border-cyan-300',
                    'bg-white px-5 py-3',
                    'text-sm font-bold',
                    'text-[#075F78]',
                    'transition',
                    'hover:bg-cyan-100',
                  ].join(' ')}
                >
                  Registrar evidência
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    void loadRuns()
                  }}
                  disabled={
                    loadingStatus ===
                    'loading'
                  }
                  className={[
                    'inline-flex min-h-11',
                    'items-center justify-center',
                    'rounded-xl',
                    'bg-[#071827]',
                    'px-5 py-3',
                    'text-sm font-bold',
                    'text-white',
                    'transition',
                    'hover:bg-[#0B7491]',
                    'disabled:opacity-60',
                  ].join(' ')}
                >
                  {loadingStatus ===
                  'loading'
                    ? 'Atualizando...'
                    : 'Atualizar dados'}
                </button>
              </div>
            </div>
          </section>

          <section
            aria-label="Resumo das análises"
            className={[
              'grid overflow-hidden',
              'rounded-[1.5rem]',
              'border border-slate-200',
              'bg-white shadow-sm',
              'sm:grid-cols-2',
              'xl:grid-cols-4',
            ].join(' ')}
          >
            <SummaryCard
              label="Processamentos"
              value={
                summary.total
              }
              description="Execuções registradas"
            />

            <SummaryCard
              label="Concluídas"
              value={
                summary.completed
              }
              description="Análises finalizadas"
            />

            <SummaryCard
              label="Revisão humana"
              value={
                summary.pendingHumanReview
              }
              description="Pendências profissionais"
            />

            <SummaryCard
              label="Falhas"
              value={
                summary.failed
              }
              description="Processamentos com erro"
            />
          </section>

          <section
            aria-label="Médias das análises"
            className={[
              'grid gap-4',
              'sm:grid-cols-3',
            ].join(' ')}
          >
            <article
              className={[
                'rounded-2xl border',
                'border-slate-200',
                'bg-white p-5',
                'shadow-sm',
              ].join(' ')}
            >
              <p
                className={[
                  'text-xs font-bold',
                  'uppercase tracking-[0.15em]',
                  'text-slate-500',
                ].join(' ')}
              >
                Qualidade média
              </p>

              <p
                className={[
                  'mt-3 text-3xl',
                  'font-bold text-[#071827]',
                ].join(' ')}
              >
                {formatScore(
                  summary
                    .averageQualityScore,
                )}
              </p>

              <p
                className={[
                  'mt-1 text-sm',
                  'text-slate-500',
                ].join(' ')}
              >
                Clareza e completude dos registros.
              </p>
            </article>

            <article
              className={[
                'rounded-2xl border',
                'border-slate-200',
                'bg-white p-5',
                'shadow-sm',
              ].join(' ')}
            >
              <p
                className={[
                  'text-xs font-bold',
                  'uppercase tracking-[0.15em]',
                  'text-slate-500',
                ].join(' ')}
              >
                Confiabilidade média
              </p>

              <p
                className={[
                  'mt-3 text-3xl',
                  'font-bold text-[#071827]',
                ].join(' ')}
              >
                {formatScore(
                  summary
                    .averageReliabilityScore,
                )}
              </p>

              <p
                className={[
                  'mt-1 text-sm',
                  'text-slate-500',
                ].join(' ')}
              >
                Consistência das informações analisadas.
              </p>
            </article>

            <article
              className={[
                'rounded-2xl border',
                'border-slate-200',
                'bg-white p-5',
                'shadow-sm',
              ].join(' ')}
            >
              <p
                className={[
                  'text-xs font-bold',
                  'uppercase tracking-[0.15em]',
                  'text-slate-500',
                ].join(' ')}
              >
                Confiança média
              </p>

              <p
                className={[
                  'mt-3 text-3xl',
                  'font-bold text-[#071827]',
                ].join(' ')}
              >
                {formatScore(
                  summary
                    .averageConfidenceScore,
                )}
              </p>

              <p
                className={[
                  'mt-1 text-sm',
                  'text-slate-500',
                ].join(' ')}
              >
                Segurança estimada do processamento.
              </p>
            </article>
          </section>

          <section
            className={[
              'overflow-hidden',
              'rounded-[1.75rem]',
              'border border-slate-200',
              'bg-white shadow-sm',
            ].join(' ')}
          >
            <header
              className={[
                'border-b',
                'border-slate-200',
                'px-5 py-5',
                'sm:px-7',
              ].join(' ')}
            >
              <div
                className={[
                  'flex flex-col gap-4',
                  'lg:flex-row',
                  'lg:items-end',
                  'lg:justify-between',
                ].join(' ')}
              >
                <div>
                  <p
                    className={[
                      'text-xs font-bold',
                      'uppercase tracking-[0.18em]',
                      'text-[#0B7491]',
                    ].join(' ')}
                  >
                    Histórico inteligente
                  </p>

                  <h2
                    className={[
                      'mt-2 text-2xl',
                      'font-bold text-[#071827]',
                    ].join(' ')}
                  >
                    Análises registradas
                  </h2>

                  <p
                    className={[
                      'mt-2 text-sm',
                      'leading-6 text-slate-500',
                    ].join(' ')}
                  >
                    Consulte o resultado mais recente e a rastreabilidade de cada execução.
                  </p>
                </div>

                <div
                  className={[
                    'grid gap-3',
                    'sm:grid-cols-2',
                  ].join(' ')}
                >
                  <label
                    className="block"
                  >
                    <span
                      className={[
                        'text-xs font-bold',
                        'uppercase tracking-wide',
                        'text-slate-500',
                      ].join(' ')}
                    >
                      Status
                    </span>

                    <select
                      value={
                        statusFilter
                      }
                      onChange={
                        event =>
                          setStatusFilter(
                            event
                              .target
                              .value as
                              StatusFilter,
                          )
                      }
                      className={[
                        'mt-2 min-h-11',
                        'w-full rounded-xl',
                        'border border-slate-300',
                        'bg-white px-4',
                        'text-sm text-slate-800',
                        'outline-none',
                        'focus:border-[#0B7491]',
                        'focus:ring-4',
                        'focus:ring-cyan-100',
                      ].join(' ')}
                    >
                      {STATUS_FILTER_OPTIONS.map(
                        option => (
                          <option
                            key={
                              option.value
                            }
                            value={
                              option.value
                            }
                          >
                            {
                              option.label
                            }
                          </option>
                        ),
                      )}
                    </select>
                  </label>

                  <label
                    className="block"
                  >
                    <span
                      className={[
                        'text-xs font-bold',
                        'uppercase tracking-wide',
                        'text-slate-500',
                      ].join(' ')}
                    >
                      Buscar
                    </span>

                    <input
                      type="search"
                      value={
                        searchTerm
                      }
                      onChange={
                        event =>
                          setSearchTerm(
                            event
                              .target
                              .value,
                          )
                      }
                      placeholder="ID, evento ou versão"
                      className={[
                        'mt-2 min-h-11',
                        'w-full rounded-xl',
                        'border border-slate-300',
                        'bg-white px-4',
                        'text-sm text-slate-800',
                        'outline-none',
                        'placeholder:text-slate-400',
                        'focus:border-[#0B7491]',
                        'focus:ring-4',
                        'focus:ring-cyan-100',
                      ].join(' ')}
                    />
                  </label>
                </div>
              </div>
            </header>

            {error ? (
              <div
                className={[
                  'border-b',
                  'border-rose-200',
                  'bg-rose-50',
                  'px-5 py-4',
                  'text-sm font-semibold',
                  'text-rose-800',
                  'sm:px-7',
                ].join(' ')}
              >
                {error}
              </div>
            ) : null}

            {loadingStatus ===
            'loading' ? (
              <div
                className={[
                  'p-8 text-center',
                  'text-sm font-semibold',
                  'text-slate-500',
                ].join(' ')}
              >
                Carregando análises inteligentes...
              </div>
            ) : null}

            {loadingStatus ===
              'success' &&
            filteredRuns.length ===
              0 ? (
              <div
                className="p-8 text-center"
              >
                <p
                  className={[
                    'text-lg font-bold',
                    'text-[#071827]',
                  ].join(' ')}
                >
                  Nenhuma análise encontrada
                </p>

                <p
                  className={[
                    'mt-2 text-sm',
                    'text-slate-500',
                  ].join(' ')}
                >
                  Registre uma nova evidência ou altere os filtros da consulta.
                </p>
              </div>
            ) : null}

            {loadingStatus ===
              'success' &&
            filteredRuns.length >
              0 ? (
              <div
                className={[
                  'grid gap-4',
                  'p-5 sm:p-7',
                  'xl:grid-cols-2',
                ].join(' ')}
              >
                {filteredRuns.map(
                  run => {
                    const classifications =
                      run
                        .framework_classifications
                        .map(
                          stringifyValue,
                        )
                        .filter(
                          value =>
                            Boolean(
                              value.trim(),
                            ),
                        )

                    const warnings =
                      run.warnings
                        .map(
                          stringifyValue,
                        )
                        .filter(
                          value =>
                            Boolean(
                              value.trim(),
                            ),
                        )

                    return (
                      <article
                        key={
                          run.id
                        }
                        className={[
                          'overflow-hidden',
                          'rounded-2xl',
                          'border',
                          'border-slate-200',
                          'bg-white',
                        ].join(' ')}
                      >
                        <header
                          className={[
                            'border-b',
                            'border-slate-200',
                            'bg-slate-50',
                            'px-5 py-4',
                          ].join(' ')}
                        >
                          <div
                            className={[
                              'flex items-start',
                              'justify-between',
                              'gap-4',
                            ].join(' ')}
                          >
                            <div
                              className="min-w-0"
                            >
                              <p
                                className={[
                                  'text-xs font-bold',
                                  'uppercase',
                                  'tracking-[0.14em]',
                                  'text-slate-500',
                                ].join(' ')}
                              >
                                Evidência
                              </p>

                              <p
                                className={[
                                  'mt-2 break-all',
                                  'font-mono text-xs',
                                  'font-semibold',
                                  'text-[#071827]',
                                ].join(' ')}
                              >
                                {
                                  run.evidence_id
                                }
                              </p>
                            </div>

                            <span
                              className={[
                                'shrink-0',
                                'rounded-full',
                                'border px-3 py-1',
                                'text-xs font-bold',
                                getStatusClasses(
                                  run
                                    .processing_status,
                                ),
                              ].join(' ')}
                            >
                              {
                                STATUS_LABELS[
                                  run
                                    .processing_status
                                ]
                              }
                            </span>
                          </div>
                        </header>

                        <div
                          className={[
                            'space-y-4',
                            'p-5',
                          ].join(' ')}
                        >
                          <div
                            className={[
                              'grid gap-3',
                              'sm:grid-cols-3',
                            ].join(' ')}
                          >
                            <div
                              className={[
                                'rounded-xl',
                                'border',
                                'border-slate-200',
                                'bg-slate-50',
                                'p-3',
                              ].join(' ')}
                            >
                              <p
                                className={[
                                  'text-[10px]',
                                  'font-bold uppercase',
                                  'tracking-wide',
                                  'text-slate-500',
                                ].join(' ')}
                              >
                                Qualidade
                              </p>

                              <p
                                className={[
                                  'mt-2 text-xl',
                                  'font-bold',
                                  'text-[#071827]',
                                ].join(' ')}
                              >
                                {formatScore(
                                  run
                                    .quality_score,
                                )}
                              </p>
                            </div>

                            <div
                              className={[
                                'rounded-xl',
                                'border',
                                'border-slate-200',
                                'bg-slate-50',
                                'p-3',
                              ].join(' ')}
                            >
                              <p
                                className={[
                                  'text-[10px]',
                                  'font-bold uppercase',
                                  'tracking-wide',
                                  'text-slate-500',
                                ].join(' ')}
                              >
                                Confiabilidade
                              </p>

                              <p
                                className={[
                                  'mt-2 text-xl',
                                  'font-bold',
                                  'text-[#071827]',
                                ].join(' ')}
                              >
                                {formatScore(
                                  run
                                    .reliability_score,
                                )}
                              </p>
                            </div>

                            <div
                              className={[
                                'rounded-xl',
                                'border',
                                'border-slate-200',
                                'bg-slate-50',
                                'p-3',
                              ].join(' ')}
                            >
                              <p
                                className={[
                                  'text-[10px]',
                                  'font-bold uppercase',
                                  'tracking-wide',
                                  'text-slate-500',
                                ].join(' ')}
                              >
                                Confiança
                              </p>

                              <p
                                className={[
                                  'mt-2 text-xl',
                                  'font-bold',
                                  'text-[#071827]',
                                ].join(' ')}
                              >
                                {formatScore(
                                  run
                                    .confidence_score,
                                )}
                              </p>
                            </div>
                          </div>

                          <div
                            className={[
                              'grid gap-3',
                              'sm:grid-cols-2',
                            ].join(' ')}
                          >
                            <div>
                              <p
                                className={[
                                  'text-xs font-bold',
                                  'uppercase',
                                  'tracking-wide',
                                  'text-slate-500',
                                ].join(' ')}
                              >
                                Motor
                              </p>

                              <p
                                className={[
                                  'mt-1 text-sm',
                                  'font-semibold',
                                  'text-slate-800',
                                ].join(' ')}
                              >
                                {run.engine_name}
                                {' · '}
                                versão {
                                  run.engine_version
                                }
                              </p>
                            </div>

                            <div>
                              <p
                                className={[
                                  'text-xs font-bold',
                                  'uppercase',
                                  'tracking-wide',
                                  'text-slate-500',
                                ].join(' ')}
                              >
                                Processada em
                              </p>

                              <p
                                className={[
                                  'mt-1 text-sm',
                                  'font-semibold',
                                  'text-slate-800',
                                ].join(' ')}
                              >
                                {formatDateTime(
                                  run.processed_at ??
                                    run.updated_at,
                                )}
                              </p>
                            </div>
                          </div>

                          {run.requires_human_review ? (
                            <div
                              className={[
                                'rounded-xl',
                                'border',
                                'border-amber-200',
                                'bg-amber-50',
                                'p-4',
                              ].join(' ')}
                            >
                              <p
                                className={[
                                  'text-sm font-bold',
                                  'text-amber-950',
                                ].join(' ')}
                              >
                                Revisão humana
                              </p>

                              <p
                                className={[
                                  'mt-1 text-sm',
                                  'text-amber-900',
                                ].join(' ')}
                              >
                                {
                                  REVIEW_LABELS[
                                    run
                                      .human_review_status
                                  ]
                                }
                              </p>
                            </div>
                          ) : null}

                          {classifications.length >
                          0 ? (
                            <div>
                              <p
                                className={[
                                  'text-xs font-bold',
                                  'uppercase',
                                  'tracking-wide',
                                  'text-slate-500',
                                ].join(' ')}
                              >
                                Classificações EDI
                              </p>

                              <div
                                className={[
                                  'mt-2 flex',
                                  'flex-wrap gap-2',
                                ].join(' ')}
                              >
                                {classifications
                                  .slice(
                                    0,
                                    6,
                                  )
                                  .map(
                                    (
                                      classification,
                                      index,
                                    ) => (
                                      <span
                                        key={`${run.id}-${classification}-${index}`}
                                        className={[
                                          'rounded-full',
                                          'border',
                                          'border-cyan-200',
                                          'bg-cyan-50',
                                          'px-3 py-1',
                                          'text-xs font-bold',
                                          'text-[#075F78]',
                                        ].join(' ')}
                                      >
                                        {
                                          classification
                                        }
                                      </span>
                                    ),
                                  )}
                              </div>
                            </div>
                          ) : null}

                          {warnings.length >
                          0 ? (
                            <div
                              className={[
                                'rounded-xl',
                                'border',
                                'border-amber-200',
                                'bg-amber-50',
                                'p-4',
                              ].join(' ')}
                            >
                              <p
                                className={[
                                  'text-sm font-bold',
                                  'text-amber-950',
                                ].join(' ')}
                              >
                                Pontos de atenção
                              </p>

                              <ul
                                className={[
                                  'mt-2 space-y-1',
                                  'text-sm',
                                  'text-amber-900',
                                ].join(' ')}
                              >
                                {warnings
                                  .slice(
                                    0,
                                    3,
                                  )
                                  .map(
                                    (
                                      warning,
                                      index,
                                    ) => (
                                      <li
                                        key={`${run.id}-warning-${index}`}
                                      >
                                        {
                                          warning
                                        }
                                      </li>
                                    ),
                                  )}
                              </ul>
                            </div>
                          ) : null}

                          {run.last_error ? (
                            <div
                              className={[
                                'rounded-xl',
                                'border',
                                'border-rose-200',
                                'bg-rose-50',
                                'p-4',
                              ].join(' ')}
                            >
                              <p
                                className={[
                                  'text-sm font-bold',
                                  'text-rose-950',
                                ].join(' ')}
                              >
                                Erro registrado
                              </p>

                              <p
                                className={[
                                  'mt-1 text-sm',
                                  'text-rose-900',
                                ].join(' ')}
                              >
                                {
                                  run.last_error
                                }
                              </p>
                            </div>
                          ) : null}

                          <Link
                            href={`/agenda/evidencias?intelligenceEvidenceId=${encodeURIComponent(
                              run.evidence_id,
                            )}`}
                            className={[
                              'inline-flex',
                              'min-h-11 w-full',
                              'items-center',
                              'justify-center',
                              'rounded-xl',
                              'border',
                              'border-cyan-200',
                              'bg-cyan-50',
                              'px-4 py-3',
                              'text-sm font-bold',
                              'text-[#075F78]',
                              'transition',
                              'hover:bg-cyan-100',
                            ].join(' ')}
                          >
                            Abrir evidências
                          </Link>
                        </div>
                      </article>
                    )
                  },
                )}
              </div>
            ) : null}

            <footer
              className={[
                'border-t',
                'border-slate-200',
                'bg-slate-50',
                'px-5 py-4',
                'text-xs',
                'text-slate-500',
                'sm:px-7',
              ].join(' ')}
            >
              {generatedAt
                ? `Consulta atualizada em ${formatDateTime(
                    generatedAt,
                  )}.`
                : 'Aguardando atualização da consulta.'}
            </footer>
          </section>

          <aside
            className={[
              'overflow-hidden',
              'rounded-[1.75rem]',
              'border border-slate-200',
              'bg-[#071827]',
              'text-white',
              'shadow-sm',
            ].join(' ')}
          >
            <header
              className={[
                'border-b',
                'border-white/10',
                'px-5 py-5',
                'sm:px-7',
              ].join(' ')}
            >
              <p
                className={[
                  'text-xs font-bold',
                  'uppercase tracking-[0.18em]',
                  'text-cyan-300',
                ].join(' ')}
              >
                Governança EDI
              </p>

              <h2
                className={[
                  'mt-2 text-2xl',
                  'font-bold',
                ].join(' ')}
              >
                Inteligência explicável e decisão humana
              </h2>
            </header>

            <div
              className={[
                'grid divide-y',
                'divide-white/10',
                'sm:grid-cols-3',
                'sm:divide-x',
                'sm:divide-y-0',
              ].join(' ')}
            >
              <article
                className="px-5 py-5 sm:px-7"
              >
                <p
                  className={[
                    'font-mono text-xs',
                    'font-bold text-cyan-300',
                  ].join(' ')}
                >
                  01
                </p>

                <h3
                  className="mt-3 font-bold"
                >
                  Evidência
                </h3>

                <p
                  className={[
                    'mt-1 text-sm',
                    'leading-6',
                    'text-slate-300',
                  ].join(' ')}
                >
                  O registro pedagógico permanece como fonte principal.
                </p>
              </article>

              <article
                className="px-5 py-5 sm:px-7"
              >
                <p
                  className={[
                    'font-mono text-xs',
                    'font-bold text-cyan-300',
                  ].join(' ')}
                >
                  02
                </p>

                <h3
                  className="mt-3 font-bold"
                >
                  Inteligência
                </h3>

                <p
                  className={[
                    'mt-1 text-sm',
                    'leading-6',
                    'text-slate-300',
                  ].join(' ')}
                >
                  O EIOS organiza qualidade, confiabilidade e classificação.
                </p>
              </article>

              <article
                className="px-5 py-5 sm:px-7"
              >
                <p
                  className={[
                    'font-mono text-xs',
                    'font-bold text-cyan-300',
                  ].join(' ')}
                >
                  03
                </p>

                <h3
                  className="mt-3 font-bold"
                >
                  Decisão
                </h3>

                <p
                  className={[
                    'mt-1 text-sm',
                    'leading-6',
                    'text-slate-300',
                  ].join(' ')}
                >
                  A interpretação final permanece sob responsabilidade profissional.
                </p>
              </article>
            </div>
          </aside>
        </div>
      </AgendaPageShell>
    </main>
  )
}