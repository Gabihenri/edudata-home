'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

type IntelligenceProcessingStatus =
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
  id: string
  evidence_id: string

  event_id:
    string | null

  engine_name:
    string

  engine_version:
    string

  processing_status:
    IntelligenceProcessingStatus

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

  warnings:
    unknown[]

  errors:
    unknown[]

  attempt_count:
    number

  processed_at:
    string | null

  failed_at:
    string | null

  last_error:
    string | null

  created_at:
    string

  updated_at:
    string
}

type IntelligenceApiResponse = {
  success:
    boolean

  data: {
    evidence: {
      id:
        string

      title:
        string

      evidenceType:
        string

      containsIdentifiableMinor:
        boolean

      createdAt:
        string

      updatedAt:
        string
    }

    intelligence: {
      available:
        boolean

      latest:
        IntelligenceRun | null

      history:
        IntelligenceRun[]

      summary: {
        totalRuns:
          number

        completedRuns:
          number

        failedRuns:
          number

        pendingReviewRuns:
          number

        latestStatus:
          IntelligenceProcessingStatus | null

        latestRequiresHumanReview:
          boolean

        latestProcessedAt:
          string | null

        latestEngineVersion:
          string | null
      }
    }
  }

  meta: {
    includeHistory:
      boolean

    historyLimit:
      number

    returnedHistoryItems:
      number

    generatedAt:
      string
  }
}

type EvidenceIntelligencePanelProps = {
  evidenceId:
    string

  evidenceTitle?:
    string

  initiallyOpen?:
    boolean
}

type LoadingState =
  | 'idle'
  | 'loading'
  | 'success'
  | 'error'

const STATUS_LABELS:
  Record<
    IntelligenceProcessingStatus,
    string
  > = {
    pending:
      'Aguardando análise',

    processing:
      'Analisando',

    completed:
      'Análise concluída',

    requires_human_review:
      'Revisão humana necessária',

    failed:
      'Falha na análise',

    cancelled:
      'Análise cancelada',

    ignored:
      'Análise não executada',
  }

const HUMAN_REVIEW_LABELS:
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

  return 'Não foi possível carregar a análise inteligente.'
}

function formatDateTime(
  value:
    string | null,
): string {
  if (!value) {
    return 'Não informado'
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
    return 'Não calculado'
  }

  return `${Math.round(
    value *
      100,
  )}%`
}

function getScoreDescription(
  value:
    number | null,
): string {
  if (
    typeof value !==
      'number'
  ) {
    return 'Ainda não há pontuação disponível.'
  }

  if (
    value >=
      0.85
  ) {
    return 'Nível elevado.'
  }

  if (
    value >=
      0.65
  ) {
    return 'Nível adequado, com possibilidade de aprimoramento.'
  }

  if (
    value >=
      0.4
  ) {
    return 'Nível intermediário. Recomenda-se complementar o registro.'
  }

  return 'Nível baixo. Recomenda-se revisar e ampliar a evidência.'
}

function getStatusClasses(
  status:
    IntelligenceProcessingStatus,
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

function stringifyMessage(
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
    const message =
      value.message

    if (
      typeof message ===
        'string'
    ) {
      return message
    }

    const description =
      value.description

    if (
      typeof description ===
        'string'
    ) {
      return description
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

function getClassificationLabel(
  classification:
    unknown,
): string {
  if (
    typeof classification ===
      'string'
  ) {
    return classification
  }

  if (
    !isRecord(
      classification,
    )
  ) {
    return stringifyMessage(
      classification,
    )
  }

  const candidateKeys = [
    'label',
    'name',
    'classification',
    'category',
    'dimension',
    'pillar',
    'type',
  ]

  for (
    const key
    of candidateKeys
  ) {
    const value =
      classification[key]

    if (
      typeof value ===
        'string' &&
      value.trim()
    ) {
      return value.trim()
    }
  }

  return stringifyMessage(
    classification,
  )
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

export function EvidenceIntelligencePanel({
  evidenceId,
  evidenceTitle,
  initiallyOpen = false,
}: EvidenceIntelligencePanelProps) {
  const [
    open,
    setOpen,
  ] = useState(
    initiallyOpen,
  )

  const [
    loadingState,
    setLoadingState,
  ] = useState<
    LoadingState
  >('idle')

  const [
    data,
    setData,
  ] = useState<
    IntelligenceApiResponse['data'] | null
  >(null)

  const [
    error,
    setError,
  ] = useState<
    string | null
  >(null)

  const loadIntelligence =
    useCallback(
      async ({
        force = false,
      }: {
        force?: boolean
      } = {}):
        Promise<void> => {
        if (
          !force &&
          loadingState ===
            'loading'
        ) {
          return
        }

        setLoadingState(
          'loading',
        )

        setError(
          null,
        )

        try {
          const response =
            await fetch(
              `/api/agenda/evidences/${encodeURIComponent(
                evidenceId,
              )}/intelligence?includeHistory=true&limit=10`,
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
              'A API não concluiu a consulta da análise.',
            )
          }

          setData(
            body.data,
          )

          setLoadingState(
            'success',
          )
        } catch (
          loadError
        ) {
          setData(
            null,
          )

          setError(
            getErrorMessage(
              loadError,
            ),
          )

          setLoadingState(
            'error',
          )
        }
      },
      [
        evidenceId,
        loadingState,
      ],
    )

  useEffect(() => {
    if (
      open &&
      loadingState ===
        'idle'
    ) {
      void loadIntelligence()
    }
  }, [
    loadIntelligence,
    loadingState,
    open,
  ])

  const latest =
    data
      ?.intelligence
      .latest ??
    null

  const history =
    data
      ?.intelligence
      .history ??
    []

  const classifications =
    useMemo(
      () =>
        latest
          ?.framework_classifications
          .map(
            getClassificationLabel,
          )
          .filter(
            value =>
              Boolean(
                value.trim(),
              ),
          ) ??
        [],
      [
        latest,
      ],
    )

  const warnings =
    useMemo(
      () =>
        latest
          ?.warnings
          .map(
            stringifyMessage,
          ) ??
        [],
      [
        latest,
      ],
    )

  const errors =
    useMemo(
      () =>
        latest
          ?.errors
          .map(
            stringifyMessage,
          ) ??
        [],
      [
        latest,
      ],
    )

  return (
    <section
      className={[
        'overflow-hidden rounded-2xl',
        'border border-slate-200',
        'bg-white shadow-sm',
      ].join(' ')}
    >
      <button
        type="button"
        onClick={() => {
          setOpen(
            current =>
              !current,
          )
        }}
        className={[
          'flex w-full items-center',
          'justify-between gap-4',
          'px-5 py-4 text-left',
          'transition hover:bg-slate-50',
        ].join(' ')}
        aria-expanded={
          open
        }
      >
        <span>
          <span
            className={[
              'block text-sm font-semibold',
              'text-slate-950',
            ].join(' ')}
          >
            Análise inteligente EDI
          </span>

          <span
            className={[
              'mt-1 block text-xs',
              'text-slate-500',
            ].join(' ')}
          >
            {evidenceTitle
              ? `Evidência: ${evidenceTitle}`
              : 'Qualidade, confiabilidade e classificação pedagógica.'}
          </span>
        </span>

        <span
          className={[
            'rounded-full border',
            'border-slate-200',
            'bg-slate-50 px-3 py-1',
            'text-xs font-semibold',
            'text-slate-700',
          ].join(' ')}
        >
          {open
            ? 'Ocultar'
            : 'Consultar'}
        </span>
      </button>

      {open ? (
        <div
          className={[
            'border-t border-slate-200',
            'px-5 py-5',
          ].join(' ')}
        >
          {loadingState ===
          'loading' ? (
            <div
              className={[
                'rounded-xl border',
                'border-blue-200',
                'bg-blue-50 px-4 py-4',
                'text-sm text-blue-800',
              ].join(' ')}
            >
              Carregando a análise inteligente…
            </div>
          ) : null}

          {loadingState ===
            'error' &&
          error ? (
            <div
              className={[
                'rounded-xl border',
                'border-rose-200',
                'bg-rose-50 px-4 py-4',
              ].join(' ')}
            >
              <p
                className={[
                  'text-sm font-semibold',
                  'text-rose-900',
                ].join(' ')}
              >
                Não foi possível carregar
              </p>

              <p
                className={[
                  'mt-1 text-sm',
                  'text-rose-800',
                ].join(' ')}
              >
                {error}
              </p>

              <button
                type="button"
                onClick={() => {
                  void loadIntelligence({
                    force:
                      true,
                  })
                }}
                className={[
                  'mt-3 rounded-lg',
                  'border border-rose-300',
                  'bg-white px-3 py-2',
                  'text-xs font-semibold',
                  'text-rose-800',
                  'transition',
                  'hover:bg-rose-100',
                ].join(' ')}
              >
                Tentar novamente
              </button>
            </div>
          ) : null}

          {loadingState ===
            'success' &&
          data &&
          !data.intelligence
            .available ? (
            <div
              className={[
                'rounded-xl border',
                'border-slate-200',
                'bg-slate-50 px-4 py-4',
              ].join(' ')}
            >
              <p
                className={[
                  'text-sm font-semibold',
                  'text-slate-800',
                ].join(' ')}
              >
                Análise ainda não disponível
              </p>

              <p
                className={[
                  'mt-1 text-sm',
                  'text-slate-600',
                ].join(' ')}
              >
                A evidência foi registrada, mas ainda não possui uma execução persistida do Evidence Intelligence.
              </p>

              <button
                type="button"
                onClick={() => {
                  void loadIntelligence({
                    force:
                      true,
                  })
                }}
                className={[
                  'mt-3 rounded-lg',
                  'border border-slate-300',
                  'bg-white px-3 py-2',
                  'text-xs font-semibold',
                  'text-slate-700',
                  'transition',
                  'hover:bg-slate-100',
                ].join(' ')}
              >
                Atualizar consulta
              </button>
            </div>
          ) : null}

          {loadingState ===
            'success' &&
          latest ? (
            <div
              className="space-y-5"
            >
              <div
                className={[
                  'flex flex-wrap items-center',
                  'justify-between gap-3',
                ].join(' ')}
              >
                <span
                  className={[
                    'inline-flex rounded-full',
                    'border px-3 py-1',
                    'text-xs font-semibold',
                    getStatusClasses(
                      latest.processing_status,
                    ),
                  ].join(' ')}
                >
                  {
                    STATUS_LABELS[
                      latest.processing_status
                    ]
                  }
                </span>

                <span
                  className={[
                    'text-xs',
                    'text-slate-500',
                  ].join(' ')}
                >
                  Motor {latest.engine_version}
                  {' · '}
                  {formatDateTime(
                    latest.processed_at ??
                      latest.updated_at,
                  )}
                </span>
              </div>

              <div
                className={[
                  'grid gap-3',
                  'sm:grid-cols-3',
                ].join(' ')}
              >
                <article
                  className={[
                    'rounded-xl border',
                    'border-slate-200',
                    'bg-slate-50 p-4',
                  ].join(' ')}
                >
                  <p
                    className={[
                      'text-xs font-semibold',
                      'uppercase tracking-wide',
                      'text-slate-500',
                    ].join(' ')}
                  >
                    Qualidade
                  </p>

                  <p
                    className={[
                      'mt-2 text-2xl',
                      'font-bold text-slate-950',
                    ].join(' ')}
                  >
                    {formatScore(
                      latest.quality_score,
                    )}
                  </p>

                  <p
                    className={[
                      'mt-1 text-xs',
                      'text-slate-600',
                    ].join(' ')}
                  >
                    {getScoreDescription(
                      latest.quality_score,
                    )}
                  </p>
                </article>

                <article
                  className={[
                    'rounded-xl border',
                    'border-slate-200',
                    'bg-slate-50 p-4',
                  ].join(' ')}
                >
                  <p
                    className={[
                      'text-xs font-semibold',
                      'uppercase tracking-wide',
                      'text-slate-500',
                    ].join(' ')}
                  >
                    Confiabilidade
                  </p>

                  <p
                    className={[
                      'mt-2 text-2xl',
                      'font-bold text-slate-950',
                    ].join(' ')}
                  >
                    {formatScore(
                      latest.reliability_score,
                    )}
                  </p>

                  <p
                    className={[
                      'mt-1 text-xs',
                      'text-slate-600',
                    ].join(' ')}
                  >
                    {getScoreDescription(
                      latest.reliability_score,
                    )}
                  </p>
                </article>

                <article
                  className={[
                    'rounded-xl border',
                    'border-slate-200',
                    'bg-slate-50 p-4',
                  ].join(' ')}
                >
                  <p
                    className={[
                      'text-xs font-semibold',
                      'uppercase tracking-wide',
                      'text-slate-500',
                    ].join(' ')}
                  >
                    Confiança
                  </p>

                  <p
                    className={[
                      'mt-2 text-2xl',
                      'font-bold text-slate-950',
                    ].join(' ')}
                  >
                    {formatScore(
                      latest.confidence_score,
                    )}
                  </p>

                  <p
                    className={[
                      'mt-1 text-xs',
                      'text-slate-600',
                    ].join(' ')}
                  >
                    {getScoreDescription(
                      latest.confidence_score,
                    )}
                  </p>
                </article>
              </div>

              {latest.requires_human_review ? (
                <div
                  className={[
                    'rounded-xl border',
                    'border-amber-200',
                    'bg-amber-50 px-4 py-4',
                  ].join(' ')}
                >
                  <p
                    className={[
                      'text-sm font-semibold',
                      'text-amber-950',
                    ].join(' ')}
                  >
                    Revisão humana necessária
                  </p>

                  <p
                    className={[
                      'mt-1 text-sm',
                      'text-amber-900',
                    ].join(' ')}
                  >
                    Situação: {
                      HUMAN_REVIEW_LABELS[
                        latest.human_review_status
                      ]
                    }. A análise auxilia a decisão pedagógica, mas não substitui a avaliação profissional.
                  </p>
                </div>
              ) : null}

              {classifications.length >
              0 ? (
                <div>
                  <h4
                    className={[
                      'text-sm font-semibold',
                      'text-slate-900',
                    ].join(' ')}
                  >
                    Classificações do Framework EDI
                  </h4>

                  <div
                    className={[
                      'mt-3 flex flex-wrap',
                      'gap-2',
                    ].join(' ')}
                  >
                    {classifications.map(
                      (
                        classification,
                        index,
                      ) => (
                        <span
                          key={`${classification}-${index}`}
                          className={[
                            'rounded-full border',
                            'border-cyan-200',
                            'bg-cyan-50',
                            'px-3 py-1',
                            'text-xs font-semibold',
                            'text-[#075F78]',
                          ].join(' ')}
                        >
                          {classification}
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
                    'rounded-xl border',
                    'border-amber-200',
                    'bg-amber-50 p-4',
                  ].join(' ')}
                >
                  <h4
                    className={[
                      'text-sm font-semibold',
                      'text-amber-950',
                    ].join(' ')}
                  >
                    Pontos de atenção
                  </h4>

                  <ul
                    className={[
                      'mt-2 space-y-2',
                      'text-sm text-amber-900',
                    ].join(' ')}
                  >
                    {warnings.map(
                      (
                        warning,
                        index,
                      ) => (
                        <li
                          key={`${warning}-${index}`}
                        >
                          {warning}
                        </li>
                      ),
                    )}
                  </ul>
                </div>
              ) : null}

              {errors.length >
              0 ? (
                <div
                  className={[
                    'rounded-xl border',
                    'border-rose-200',
                    'bg-rose-50 p-4',
                  ].join(' ')}
                >
                  <h4
                    className={[
                      'text-sm font-semibold',
                      'text-rose-950',
                    ].join(' ')}
                  >
                    Erros registrados
                  </h4>

                  <ul
                    className={[
                      'mt-2 space-y-2',
                      'text-sm text-rose-900',
                    ].join(' ')}
                  >
                    {errors.map(
                      (
                        runError,
                        index,
                      ) => (
                        <li
                          key={`${runError}-${index}`}
                        >
                          {runError}
                        </li>
                      ),
                    )}
                  </ul>
                </div>
              ) : null}

              <div
                className={[
                  'rounded-xl border',
                  'border-slate-200',
                  'bg-white p-4',
                ].join(' ')}
              >
                <div
                  className={[
                    'flex flex-wrap items-center',
                    'justify-between gap-2',
                  ].join(' ')}
                >
                  <h4
                    className={[
                      'text-sm font-semibold',
                      'text-slate-900',
                    ].join(' ')}
                  >
                    Histórico de processamento
                  </h4>

                  <span
                    className={[
                      'text-xs',
                      'text-slate-500',
                    ].join(' ')}
                  >
                    {history.length} execução(ões)
                  </span>
                </div>

                <div
                  className={[
                    'mt-3 space-y-2',
                  ].join(' ')}
                >
                  {history.map(
                    run => (
                      <div
                        key={
                          run.id
                        }
                        className={[
                          'flex flex-wrap',
                          'items-center',
                          'justify-between',
                          'gap-2 rounded-lg',
                          'border border-slate-200',
                          'bg-slate-50',
                          'px-3 py-3',
                        ].join(' ')}
                      >
                        <div>
                          <p
                            className={[
                              'text-xs font-semibold',
                              'text-slate-800',
                            ].join(' ')}
                          >
                            {
                              STATUS_LABELS[
                                run.processing_status
                              ]
                            }
                          </p>

                          <p
                            className={[
                              'mt-1 text-xs',
                              'text-slate-500',
                            ].join(' ')}
                          >
                            {formatDateTime(
                              run.processed_at ??
                                run.updated_at,
                            )}
                          </p>
                        </div>

                        <span
                          className={[
                            'text-xs font-medium',
                            'text-slate-600',
                          ].join(' ')}
                        >
                          versão {run.engine_version}
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  void loadIntelligence({
                    force:
                      true,
                  })
                }}
                className={[
                  'rounded-lg border',
                  'border-slate-300',
                  'bg-white px-3 py-2',
                  'text-xs font-semibold',
                  'text-slate-700',
                  'transition',
                  'hover:bg-slate-100',
                ].join(' ')}
              >
                Atualizar análise
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}