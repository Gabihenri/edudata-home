'use client'

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'

import PedagogicalCopilotPanel from '@/components/agenda/evidence-intelligence/PedagogicalCopilotPanel'

import PedagogicalInterventionMonitoringPanel from '@/components/agenda/evidence-intelligence/PedagogicalInterventionMonitoringPanel'

import type {
  GeneratePedagogicalInterventionInput,
  PedagogicalIntervention,
  PedagogicalTeacherDecisionType,
} from '@/lib/agenda/evidence-intelligence/pedagogical-intervention.types'

type EvidencePedagogicalCopilotProps = {
  evidenceId: string

  evidenceIntelligenceRunId?: string | null

  sourceAnalysisId?: string | null

  sourceEventId?: string | null

  requestId?: string | null

  sessionId?: string | null

  traceId?: string | null

  generationInput:
    GeneratePedagogicalInterventionInput | null

  initiallyOpen?: boolean

  className?: string

  onInterventionChange?: (
    intervention:
      PedagogicalIntervention | null,
  ) => void
}

type LoadingState =
  | 'idle'
  | 'loading'
  | 'generating'
  | 'updating'
  | 'success'
  | 'error'

type InterventionListResponse = {
  success: boolean

  data?: {
    interventions?:
      PedagogicalIntervention[]
  }

  error?: string
}

type InterventionCreateResponse = {
  success: boolean

  data?: {
    intervention?:
      PedagogicalIntervention

    persistence?: {
      created: boolean

      idempotent: boolean

      databaseId: string

      versionId: string
    }

    warnings?: string[]
  }

  error?: string

  errors?: Array<{
    code?: string

    message?: string
  }>
}

type InterventionPatchResponse = {
  success: boolean

  data?: {
    intervention?:
      PedagogicalIntervention
  }

  error?: string
}

const LIST_API_PATH =
  '/api/agenda/evidences/intelligence/pedagogical-interventions'

const DECISION_LABELS:
  Record<
    Exclude<
      PedagogicalTeacherDecisionType,
      'pending'
    >,
    string
  > = {
    accepted:
      'Intervenção aceita pelo professor.',

    adapted:
      'Intervenção selecionada para adaptação pelo professor.',

    rejected:
      'Intervenção rejeitada pelo professor.',
  }

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  )
}

function normalizeOptionalText(
  value:
    string | null | undefined,
): string | null {
  if (
    value === undefined ||
    value === null
  ) {
    return null
  }

  return value.trim() || null
}

function getErrorMessage(
  error: unknown,
  fallbackMessage: string,
): string {
  if (
    error instanceof Error &&
    error.message.trim()
  ) {
    return error.message.trim()
  }

  if (
    typeof error === 'string' &&
    error.trim()
  ) {
    return error.trim()
  }

  return fallbackMessage
}

async function readResponseError(
  response: Response,
  fallbackMessage: string,
): Promise<string> {
  try {
    const body: unknown =
      await response.json()

    if (
      isRecord(body) &&
      typeof body.error === 'string' &&
      body.error.trim()
    ) {
      return body.error.trim()
    }

    if (
      isRecord(body) &&
      Array.isArray(body.errors)
    ) {
      const messages =
        body.errors
          .map(
            item => {
              if (
                isRecord(item) &&
                typeof item.message ===
                  'string'
              ) {
                return item.message.trim()
              }

              return ''
            },
          )
          .filter(Boolean)

      if (messages.length > 0) {
        return messages.join(' ')
      }
    }
  } catch {
    return fallbackMessage
  }

  return fallbackMessage
}

function createDecisionRationale(
  decision:
    Exclude<
      PedagogicalTeacherDecisionType,
      'pending'
    >,
): string {
  return DECISION_LABELS[decision]
}

function createInterventionUrl(
  interventionId: string,
): string {
  return [
    LIST_API_PATH,
    encodeURIComponent(
      interventionId,
    ),
  ].join('/')
}

function createIdempotencyKey({
  evidenceId,
  evidenceIntelligenceRunId,
  correlationId,
}: {
  evidenceId: string

  evidenceIntelligenceRunId:
    string | null | undefined

  correlationId: string
}): string {
  return [
    'evidence',
    evidenceId,
    normalizeOptionalText(
      evidenceIntelligenceRunId,
    ) ??
      'without-run',
    correlationId,
  ].join(':')
}

export function EvidencePedagogicalCopilot({
  evidenceId,
  evidenceIntelligenceRunId = null,
  sourceAnalysisId = null,
  sourceEventId = null,
  requestId = null,
  sessionId = null,
  traceId = null,
  generationInput,
  initiallyOpen = false,
  className = '',
  onInterventionChange,
}: EvidencePedagogicalCopilotProps) {
  const [
    open,
    setOpen,
  ] = useState(
    initiallyOpen,
  )

  const [
    intervention,
    setIntervention,
  ] = useState<
    PedagogicalIntervention | null
  >(null)

  const [
    loadingState,
    setLoadingState,
  ] = useState<LoadingState>(
    'idle',
  )

  const [
    error,
    setError,
  ] = useState<
    string | null
  >(null)

  const [
    message,
    setMessage,
  ] = useState<
    string | null
  >(null)

  const [
    loaded,
    setLoaded,
  ] = useState(false)

  const loadingRef =
    useRef(false)

  const updateIntervention =
    useCallback(
      (
        nextIntervention:
          PedagogicalIntervention | null,
      ) => {
        setIntervention(
          nextIntervention,
        )

        onInterventionChange?.(
          nextIntervention,
        )
      },
      [
        onInterventionChange,
      ],
    )

  const loadIntervention =
    useCallback(
      async ({
        force = false,
      }: {
        force?: boolean
      } = {}): Promise<void> => {
        if (
          loadingRef.current ||
          (
            loaded &&
            !force
          )
        ) {
          return
        }

        loadingRef.current =
          true

        setLoadingState(
          'loading',
        )

        setError(null)
        setMessage(null)

        try {
          const searchParams =
            new URLSearchParams({
              evidenceId,

              isCurrentVersion:
                'true',

              includeArchived:
                'false',

              limit:
                '1',
            })

          const response =
            await fetch(
              `${LIST_API_PATH}?${searchParams.toString()}`,
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

          if (!response.ok) {
            throw new Error(
              await readResponseError(
                response,
                'Não foi possível consultar o Copiloto Pedagógico.',
              ),
            )
          }

          const body =
            await response.json() as
              InterventionListResponse

          const currentIntervention =
            body.data
              ?.interventions
              ?.[0] ??
            null

          updateIntervention(
            currentIntervention,
          )

          setLoaded(true)

          setLoadingState(
            'success',
          )
        } catch (loadError) {
          setLoaded(true)

          setLoadingState(
            'error',
          )

          setError(
            getErrorMessage(
              loadError,
              'Não foi possível carregar a intervenção pedagógica.',
            ),
          )
        } finally {
          loadingRef.current =
            false
        }
      },
      [
        evidenceId,
        loaded,
        updateIntervention,
      ],
    )

  useEffect(
    () => {
      loadingRef.current =
        false

      setLoaded(false)

      updateIntervention(null)

      setError(null)

      setMessage(null)

      setLoadingState(
        'idle',
      )
    },
    [
      evidenceId,
      updateIntervention,
    ],
  )

  useEffect(
    () => {
      if (
        open &&
        !loaded &&
        loadingState ===
          'idle'
      ) {
        void loadIntervention()
      }
    },
    [
      loadIntervention,
      loaded,
      loadingState,
      open,
    ],
  )

  async function generateIntervention():
    Promise<void> {
    if (!generationInput) {
      setError(
        'A análise pedagógica ainda não possui dados suficientes para gerar uma intervenção.',
      )

      return
    }

    if (
      loadingRef.current ||
      loadingState ===
        'generating' ||
      loadingState ===
        'updating'
    ) {
      return
    }

    loadingRef.current =
      true

    setLoadingState(
      'generating',
    )

    setError(null)
    setMessage(null)

    try {
      const idempotencyKey =
        createIdempotencyKey({
          evidenceId,

          evidenceIntelligenceRunId,

          correlationId:
            generationInput
              .correlationId,
        })

      const response =
        await fetch(
          LIST_API_PATH,
          {
            method:
              'POST',

            credentials:
              'include',

            cache:
              'no-store',

            headers: {
              Accept:
                'application/json',

              'Content-Type':
                'application/json',
            },

            body:
              JSON.stringify({
                input: {
                  ...generationInput,

                  context: {
                    ...generationInput
                      .context,

                    links: {
                      ...generationInput
                        .context
                        .links,

                      evidenceIds:
                        Array.from(
                          new Set([
                            evidenceId,

                            ...generationInput
                              .context
                              .links
                              .evidenceIds,
                          ]),
                        ),
                    },
                  },
                },

                persistence: {
                  evidenceId,

                  evidenceIntelligenceRunId:
                    normalizeOptionalText(
                      evidenceIntelligenceRunId,
                    ),

                  sourceAnalysisId:
                    normalizeOptionalText(
                      sourceAnalysisId,
                    ),

                  sourceEventId:
                    normalizeOptionalText(
                      sourceEventId,
                    ),

                  idempotencyKey,

                  requestId:
                    normalizeOptionalText(
                      requestId,
                    ),

                  sessionId:
                    normalizeOptionalText(
                      sessionId,
                    ),

                  traceId:
                    normalizeOptionalText(
                      traceId,
                    ),
                },
              }),
          },
        )

      if (!response.ok) {
        throw new Error(
          await readResponseError(
            response,
            'Não foi possível gerar a intervenção pedagógica.',
          ),
        )
      }

      const body =
        await response.json() as
          InterventionCreateResponse

      const createdIntervention =
        body.data
          ?.intervention

      if (!createdIntervention) {
        throw new Error(
          'A API não retornou a intervenção gerada.',
        )
      }

      updateIntervention(
        createdIntervention,
      )

      setLoaded(true)

      setLoadingState(
        'success',
      )

      setMessage(
        body.data
          ?.persistence
          ?.idempotent
          ? 'A intervenção já existia e foi carregada.'
          : 'Intervenção pedagógica gerada e registrada.',
      )
    } catch (generationError) {
      setLoadingState(
        'error',
      )

      setError(
        getErrorMessage(
          generationError,
          'Não foi possível gerar a intervenção pedagógica.',
        ),
      )
    } finally {
      loadingRef.current =
        false
    }
  }

  async function recordDecision(
    decision:
      Exclude<
        PedagogicalTeacherDecisionType,
        'pending'
      >,
  ): Promise<void> {
    if (!intervention) {
      throw new Error(
        'Intervenção pedagógica não carregada.',
      )
    }

    if (
      loadingRef.current ||
      loadingState ===
        'updating'
    ) {
      return
    }

    loadingRef.current =
      true

    setLoadingState(
      'updating',
    )

    setError(null)
    setMessage(null)

    try {
      const response =
        await fetch(
          createInterventionUrl(
            intervention.id,
          ),
          {
            method:
              'PATCH',

            credentials:
              'include',

            cache:
              'no-store',

            headers: {
              Accept:
                'application/json',

              'Content-Type':
                'application/json',
            },

            body:
              JSON.stringify({
                action:
                  'teacher_decision',

                decision,

                rationale:
                  createDecisionRationale(
                    decision,
                  ),

                adaptations:
                  decision ===
                  'adapted'
                    ? [
                        'A intervenção será ajustada pelo professor antes da execução.',
                      ]
                    : [],

                acceptedRecommendations:
                  decision ===
                  'accepted'
                    ? intervention
                        .plan
                        .actions
                        .map(
                          action =>
                            action.title,
                        )
                    : [],

                rejectedRecommendations:
                  decision ===
                  'rejected'
                    ? intervention
                        .plan
                        .actions
                        .map(
                          action =>
                            action.title,
                        )
                    : [],

                professionalNotes:
                  [],

                expectedVersionId:
                  intervention
                    .version
                    .id,

                occurredAt:
                  new Date()
                    .toISOString(),
              }),
          },
        )

      if (!response.ok) {
        throw new Error(
          await readResponseError(
            response,
            'Não foi possível registrar a decisão docente.',
          ),
        )
      }

      const body =
        await response.json() as
          InterventionPatchResponse

      const updatedIntervention =
        body.data
          ?.intervention

      if (!updatedIntervention) {
        throw new Error(
          'A API não retornou a intervenção atualizada.',
        )
      }

      updateIntervention(
        updatedIntervention,
      )

      setLoadingState(
        'success',
      )

      setMessage(
        DECISION_LABELS[
          decision
        ],
      )
    } catch (decisionError) {
      setLoadingState(
        'error',
      )

      const errorMessage =
        getErrorMessage(
          decisionError,
          'Não foi possível registrar a decisão docente.',
        )

      setError(
        errorMessage,
      )

      throw new Error(
        errorMessage,
      )
    } finally {
      loadingRef.current =
        false
    }
  }

  function handleAccept():
    Promise<void> {
    return recordDecision(
      'accepted',
    )
  }

  function handleAdapt():
    Promise<void> {
    return recordDecision(
      'adapted',
    )
  }

  function handleReject():
    Promise<void> {
    return recordDecision(
      'rejected',
    )
  }

  function handleLongitudinalChange(
    updatedIntervention:
      PedagogicalIntervention,
  ): void {
    updateIntervention(
      updatedIntervention,
    )

    setError(null)

    setMessage(
      'Acompanhamento longitudinal atualizado.',
    )
  }

  const isBusy =
    loadingState ===
      'loading' ||
    loadingState ===
      'generating' ||
    loadingState ===
      'updating'

  return (
    <section
      className={[
        'overflow-hidden rounded-3xl',
        'border border-slate-200',
        'bg-white shadow-sm',
        className,
      ].join(' ')}
      aria-labelledby={
        `pedagogical-copilot-controller-${evidenceId}`
      }
    >
      <header
        className={[
          'flex flex-col gap-4',
          'border-b border-slate-200',
          'bg-slate-50 px-5 py-5',
          'sm:flex-row',
          'sm:items-center',
          'sm:justify-between',
        ].join(' ')}
      >
        <div>
          <p
            className={[
              'text-xs font-semibold',
              'uppercase tracking-[0.16em]',
              'text-[#087E8B]',
            ].join(' ')}
          >
            Capability 02 · EIOS
          </p>

          <h2
            id={
              `pedagogical-copilot-controller-${evidenceId}`
            }
            className={[
              'mt-1 text-lg font-bold',
              'text-[#092A45]',
            ].join(' ')}
          >
            Copiloto Pedagógico
          </h2>

          <p
            className={[
              'mt-1 text-sm',
              'leading-6',
              'text-slate-600',
            ].join(' ')}
          >
            Converte a análise da evidência
            em um plano de intervenção,
            execução, acompanhamento e
            avaliação sujeitos à decisão
            profissional do professor.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            const nextOpen =
              !open

            setOpen(
              nextOpen,
            )

            if (
              nextOpen &&
              !loaded
            ) {
              void loadIntervention()
            }
          }}
          className={[
            'inline-flex items-center',
            'justify-center rounded-xl',
            'border border-slate-300',
            'bg-white px-4 py-2',
            'text-sm font-semibold',
            'text-slate-700',
            'transition',
            'hover:bg-slate-100',
            'focus:outline-none',
            'focus:ring-2',
            'focus:ring-[#087E8B]',
            'focus:ring-offset-2',
          ].join(' ')}
          aria-expanded={open}
        >
          {open
            ? 'Fechar copiloto'
            : 'Abrir copiloto'}
        </button>
      </header>

      {open ? (
        <div
          className={[
            'space-y-5',
            'px-5 py-5',
          ].join(' ')}
        >
          {loadingState ===
          'loading' ? (
            <div
              role="status"
              className={[
                'rounded-2xl border',
                'border-cyan-200',
                'bg-cyan-50 p-4',
                'text-sm text-cyan-900',
              ].join(' ')}
            >
              Carregando intervenção
              pedagógica...
            </div>
          ) : null}

          {loadingState ===
          'generating' ? (
            <div
              role="status"
              className={[
                'rounded-2xl border',
                'border-cyan-200',
                'bg-cyan-50 p-4',
                'text-sm text-cyan-900',
              ].join(' ')}
            >
              Gerando e registrando a
              intervenção pedagógica...
            </div>
          ) : null}

          {loadingState ===
          'updating' ? (
            <div
              role="status"
              className={[
                'rounded-2xl border',
                'border-cyan-200',
                'bg-cyan-50 p-4',
                'text-sm text-cyan-900',
              ].join(' ')}
            >
              Registrando a decisão
              profissional...
            </div>
          ) : null}

          {error ? (
            <div
              role="alert"
              className={[
                'rounded-2xl border',
                'border-red-200',
                'bg-red-50 p-4',
                'text-sm leading-6',
                'text-red-900',
              ].join(' ')}
            >
              <p className="font-semibold">
                Não foi possível concluir
                a operação
              </p>

              <p className="mt-1">
                {error}
              </p>

              <button
                type="button"
                onClick={() =>
                  void loadIntervention({
                    force:
                      true,
                  })
                }
                disabled={isBusy}
                className={[
                  'mt-3 rounded-lg',
                  'border border-red-300',
                  'bg-white px-3 py-2',
                  'text-xs font-semibold',
                  'text-red-800',
                  'transition',
                  'hover:bg-red-100',
                  'disabled:cursor-not-allowed',
                  'disabled:opacity-50',
                ].join(' ')}
              >
                Tentar novamente
              </button>
            </div>
          ) : null}

          {message ? (
            <div
              aria-live="polite"
              className={[
                'rounded-2xl border',
                'border-emerald-200',
                'bg-emerald-50 p-4',
                'text-sm text-emerald-900',
              ].join(' ')}
            >
              {message}
            </div>
          ) : null}

          {!isBusy &&
          !intervention ? (
            <div
              className={[
                'rounded-2xl border',
                'border-dashed',
                'border-slate-300',
                'bg-slate-50 p-5',
              ].join(' ')}
            >
              <h3
                className={[
                  'font-semibold',
                  'text-[#092A45]',
                ].join(' ')}
              >
                Nenhuma intervenção
                registrada
              </h3>

              <p
                className={[
                  'mt-2 text-sm',
                  'leading-6',
                  'text-slate-600',
                ].join(' ')}
              >
                Gere um plano com objetivos,
                ações, recomposição,
                inclusão, indicadores e
                critérios de sucesso a partir
                da análise atual.
              </p>

              <button
                type="button"
                onClick={() =>
                  void generateIntervention()
                }
                disabled={
                  !generationInput ||
                  isBusy
                }
                className={[
                  'mt-4 inline-flex',
                  'items-center',
                  'justify-center',
                  'rounded-xl',
                  'bg-[#087E8B]',
                  'px-4 py-3',
                  'text-sm font-semibold',
                  'text-white',
                  'transition',
                  'hover:bg-[#066A75]',
                  'focus:outline-none',
                  'focus:ring-2',
                  'focus:ring-[#087E8B]',
                  'focus:ring-offset-2',
                  'disabled:cursor-not-allowed',
                  'disabled:opacity-50',
                ].join(' ')}
              >
                Gerar intervenção pedagógica
              </button>

              {!generationInput ? (
                <p
                  className={[
                    'mt-3 text-xs',
                    'leading-5',
                    'text-amber-800',
                  ].join(' ')}
                >
                  A geração será liberada
                  quando a Evidence
                  Intelligence fornecer o
                  contrato diagnóstico
                  completo.
                </p>
              ) : null}
            </div>
          ) : null}

          {intervention ? (
            <div className="space-y-6">
              <PedagogicalCopilotPanel
                intervention={
                  intervention
                }
                disabled={isBusy}
                onAccept={
                  handleAccept
                }
                onAdapt={
                  handleAdapt
                }
                onReject={
                  handleReject
                }
              />

              <PedagogicalInterventionMonitoringPanel
                intervention={
                  intervention
                }
                disabled={isBusy}
                onInterventionChange={
                  handleLongitudinalChange
                }
              />
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}

export default EvidencePedagogicalCopilot