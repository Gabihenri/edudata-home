'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  EvidencePedagogicalAnalysis,
  type EvidencePedagogicalAnalysisData,
  type EvidencePedagogicalDimension,
  type EvidencePedagogicalInsight,
} from '@/components/agenda/evidence-intelligence/EvidencePedagogicalAnalysis'

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
  event_id: string | null
  engine_name: string
  engine_version: string
  processing_status: IntelligenceProcessingStatus
  quality_score: number | null
  reliability_score: number | null
  confidence_score: number | null
  quality: Record<string, unknown>
  reliability: Record<string, unknown>
  framework_classifications: unknown[]
  validation: Record<string, unknown>
  explanation: Record<string, unknown>
  requires_human_review: boolean
  human_review_status: HumanReviewStatus
  warnings: unknown[]
  errors: unknown[]
  attempt_count: number
  processed_at: string | null
  failed_at: string | null
  last_error: string | null
  created_at: string
  updated_at: string
}

type IntelligenceApiResponse = {
  success: boolean
  data: {
    evidence: {
      id: string
      title: string
      evidenceType: string
      containsIdentifiableMinor: boolean
      createdAt: string
      updatedAt: string
    }
    intelligence: {
      available: boolean
      latest: IntelligenceRun | null
      history: IntelligenceRun[]
      summary: {
        totalRuns: number
        completedRuns: number
        failedRuns: number
        pendingReviewRuns: number
        latestStatus: IntelligenceProcessingStatus | null
        latestRequiresHumanReview: boolean
        latestProcessedAt: string | null
        latestEngineVersion: string | null
      }
    }
  }
  meta: {
    includeHistory: boolean
    historyLimit: number
    returnedHistoryItems: number
    generatedAt: string
  }
}

type EvidenceIntelligencePanelProps = {
  evidenceId: string
  evidenceTitle?: string
  initiallyOpen?: boolean
}

type LoadingState =
  | 'idle'
  | 'loading'
  | 'success'
  | 'error'

const STATUS_LABELS: Record<IntelligenceProcessingStatus, string> = {
  pending: 'Aguardando anÃ¡lise',
  processing: 'Analisando',
  completed: 'AnÃ¡lise concluÃ­da',
  requires_human_review: 'RevisÃ£o humana necessÃ¡ria',
  failed: 'Falha na anÃ¡lise',
  cancelled: 'AnÃ¡lise cancelada',
  ignored: 'AnÃ¡lise nÃ£o executada',
}

const HUMAN_REVIEW_LABELS: Record<HumanReviewStatus, string> = {
  not_required: 'NÃ£o necessÃ¡ria',
  pending: 'Pendente',
  in_review: 'Em revisÃ£o',
  approved: 'Aprovada',
  rejected: 'Rejeitada',
  changes_requested: 'Ajustes solicitados',
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

function isFiniteNumber(
  value: unknown,
): value is number {
  return (
    typeof value === 'number' &&
    Number.isFinite(value)
  )
}

function isStringArray(
  value: unknown,
): value is string[] {
  return (
    Array.isArray(value) &&
    value.every(
      item => typeof item === 'string',
    )
  )
}

function formatDateTime(
  value: string | null,
): string {
  if (!value) {
    return 'NÃ£o informado'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Data indisponÃ­vel'
  }

  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatNormalizedScore(
  value: number | null,
): string {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value)
  ) {
    return 'NÃ£o calculado'
  }

  return `${Math.round(value * 100)}%`
}

function getNormalizedScoreDescription(
  value: number | null,
): string {
  if (typeof value !== 'number') {
    return 'Ainda nÃ£o hÃ¡ pontuaÃ§Ã£o disponÃ­vel.'
  }

  if (value >= 0.85) {
    return 'NÃ­vel elevado.'
  }

  if (value >= 0.65) {
    return 'NÃ­vel adequado, com possibilidade de aprimoramento.'
  }

  if (value >= 0.4) {
    return 'NÃ­vel intermediÃ¡rio. Recomenda-se complementar o registro.'
  }

  return 'NÃ­vel baixo. Recomenda-se revisar e ampliar a evidÃªncia.'
}

function getStatusClasses(
  status: IntelligenceProcessingStatus,
): string {
  if (status === 'completed') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-800'
  }

  if (status === 'requires_human_review') {
    return 'border-amber-200 bg-amber-50 text-amber-900'
  }

  if (status === 'failed') {
    return 'border-rose-200 bg-rose-50 text-rose-800'
  }

  if (
    status === 'processing' ||
    status === 'pending'
  ) {
    return 'border-blue-200 bg-blue-50 text-blue-800'
  }

  return 'border-slate-200 bg-slate-50 text-slate-700'
}

function stringifyMessage(
  value: unknown,
): string {
  if (typeof value === 'string') {
    return value
  }

  if (
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return String(value)
  }

  if (isRecord(value)) {
    if (typeof value.message === 'string') {
      return value.message
    }

    if (typeof value.description === 'string') {
      return value.description
    }
  }

  try {
    return JSON.stringify(value)
  } catch {
    return 'InformaÃ§Ã£o indisponÃ­vel'
  }
}

function getClassificationLabel(
  classification: unknown,
): string {
  if (typeof classification === 'string') {
    return classification
  }

  if (!isRecord(classification)) {
    return stringifyMessage(classification)
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

  for (const key of candidateKeys) {
    const value = classification[key]

    if (
      typeof value === 'string' &&
      value.trim()
    ) {
      return value.trim()
    }
  }

  return stringifyMessage(classification)
}

function parseDimension(
  value: unknown,
): EvidencePedagogicalDimension | null {
  if (!isRecord(value)) {
    return null
  }

  const dimension = value.dimension
  const level = value.level

  if (
    dimension !== 'evidence' &&
    dimension !== 'inclusion' &&
    dimension !== 'intelligence'
  ) {
    return null
  }

  if (
    level !== 'initial' &&
    level !== 'developing' &&
    level !== 'adequate' &&
    level !== 'advanced'
  ) {
    return null
  }

  if (
    typeof value.label !== 'string' ||
    !isFiniteNumber(value.score) ||
    typeof value.explanation !== 'string'
  ) {
    return null
  }

  return {
    dimension,
    label: value.label,
    score: value.score,
    level,
    explanation: value.explanation,
    strengths: isStringArray(value.strengths)
      ? value.strengths
      : [],
    gaps: isStringArray(value.gaps)
      ? value.gaps
      : [],
  }
}

function parseInsight(
  value: unknown,
): EvidencePedagogicalInsight | null {
  if (!isRecord(value)) {
    return null
  }

  const severity = value.severity

  if (
    severity !== 'information' &&
    severity !== 'attention' &&
    severity !== 'priority' &&
    severity !== 'critical'
  ) {
    return null
  }

  if (
    typeof value.id !== 'string' ||
    typeof value.category !== 'string' ||
    typeof value.title !== 'string' ||
    typeof value.description !== 'string' ||
    typeof value.recommendation !== 'string' ||
    !isFiniteNumber(value.priority) ||
    typeof value.requiresHumanReview !== 'boolean'
  ) {
    return null
  }

  return {
    id: value.id,
    category: value.category,
    severity,
    title: value.title,
    description: value.description,
    recommendation: value.recommendation,
    evidence: isStringArray(value.evidence)
      ? value.evidence
      : [],
    priority: value.priority,
    requiresHumanReview: value.requiresHumanReview,
  }
}

function parsePedagogicalInsights(
  explanation: Record<string, unknown>,
): EvidencePedagogicalAnalysisData | null {
  const raw = explanation.pedagogicalInsights

  if (!isRecord(raw)) {
    return null
  }

  if (
    typeof raw.success !== 'boolean' ||
    typeof raw.summary !== 'string' ||
    !isFiniteNumber(raw.evidenceScore) ||
    !isFiniteNumber(raw.inclusionScore) ||
    !isFiniteNumber(raw.intelligenceScore) ||
    !isFiniteNumber(raw.overallScore) ||
    typeof raw.requiresHumanReview !== 'boolean' ||
    typeof raw.generatedAt !== 'string'
  ) {
    return null
  }

  const dimensions = Array.isArray(raw.dimensions)
    ? raw.dimensions
        .map(parseDimension)
        .filter(
          (
            item,
          ): item is EvidencePedagogicalDimension =>
            item !== null,
        )
    : []

  const insights = Array.isArray(raw.insights)
    ? raw.insights
        .map(parseInsight)
        .filter(
          (
            item,
          ): item is EvidencePedagogicalInsight =>
            item !== null,
        )
    : []

  const rawEngine = raw.engine
  const engine = isRecord(rawEngine)
    ? {
        name:
          typeof rawEngine.name === 'string'
            ? rawEngine.name
            : 'pedagogical-insights',
        version:
          typeof rawEngine.version === 'string'
            ? rawEngine.version
            : 'desconhecida',
        mode:
          typeof rawEngine.mode === 'string'
            ? rawEngine.mode
            : 'nÃ£o informado',
      }
    : {
        name: 'pedagogical-insights',
        version: 'desconhecida',
        mode: 'nÃ£o informado',
      }

  return {
    success: raw.success,
    summary: raw.summary,
    evidenceScore: raw.evidenceScore,
    inclusionScore: raw.inclusionScore,
    intelligenceScore: raw.intelligenceScore,
    overallScore: raw.overallScore,
    dimensions,
    insights,
    strengths: isStringArray(raw.strengths)
      ? raw.strengths
      : [],
    improvementOpportunities:
      isStringArray(raw.improvementOpportunities)
        ? raw.improvementOpportunities
        : [],
    recommendedNextActions:
      isStringArray(raw.recommendedNextActions)
        ? raw.recommendedNextActions
        : [],
    requiresHumanReview: raw.requiresHumanReview,
    generatedAt: raw.generatedAt,
    engine,
    metadata: isRecord(raw.metadata)
      ? raw.metadata
      : {},
  }
}

async function readErrorResponse(
  response: Response,
): Promise<string> {
  try {
    const body: unknown = await response.json()

    if (
      isRecord(body) &&
      typeof body.error === 'string'
    ) {
      return body.error
    }
  } catch {
    return `Erro HTTP ${response.status}.`
  }

  return `Erro HTTP ${response.status}.`
}

function getErrorMessage(
  error: unknown,
): string {
  if (error instanceof Error) {
    return error.message
  }

  if (
    typeof error === 'string' &&
    error.trim()
  ) {
    return error.trim()
  }

  return 'NÃ£o foi possÃ­vel carregar a anÃ¡lise inteligente.'
}

function ScoreCard({
  label,
  value,
  description,
}: {
  label: string
  value: string
  description: string
}) {
  return (
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
        {label}
      </p>

      <p
        className={[
          'mt-2 text-2xl',
          'font-bold text-slate-950',
        ].join(' ')}
      >
        {value}
      </p>

      <p
        className={[
          'mt-1 text-xs',
          'leading-5 text-slate-600',
        ].join(' ')}
      >
        {description}
      </p>
    </article>
  )
}

export function EvidenceIntelligencePanel({
  evidenceId,
  evidenceTitle,
  initiallyOpen = false,
}: EvidenceIntelligencePanelProps) {
  const [open, setOpen] = useState(initiallyOpen)
  const [loadingState, setLoadingState] =
    useState<LoadingState>('idle')
  const [data, setData] = useState<
    IntelligenceApiResponse['data'] | null
  >(null)
  const [error, setError] =
    useState<string | null>(null)

  const loadIntelligence = useCallback(
    async ({
      force = false,
    }: {
      force?: boolean
    } = {}): Promise<void> => {
      if (
        !force &&
        loadingState === 'loading'
      ) {
        return
      }

      setLoadingState('loading')
      setError(null)

      try {
        const response = await fetch(
          `/api/agenda/evidences/${encodeURIComponent(
            evidenceId,
          )}/intelligence?includeHistory=true&limit=10`,
          {
            method: 'GET',
            credentials: 'include',
            cache: 'no-store',
            headers: {
              Accept: 'application/json',
            },
          },
        )

        if (!response.ok) {
          throw new Error(
            await readErrorResponse(response),
          )
        }

        const body =
          (await response.json()) as IntelligenceApiResponse

        if (!body.success) {
          throw new Error(
            'A API nÃ£o concluiu a consulta da anÃ¡lise.',
          )
        }

        setData(body.data)
        setLoadingState('success')
      } catch (loadError) {
        setData(null)
        setError(getErrorMessage(loadError))
        setLoadingState('error')
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
      loadingState === 'idle'
    ) {
      void loadIntelligence()
    }
  }, [
    loadIntelligence,
    loadingState,
    open,
  ])

  const latest =
    data?.intelligence.latest ?? null

  const history =
    data?.intelligence.history ?? []

  const pedagogicalInsights = useMemo(
    () =>
      latest
        ? parsePedagogicalInsights(
            latest.explanation,
          )
        : null,
    [latest],
  )

  const classifications = useMemo(
    () =>
      latest?.framework_classifications
        .map(getClassificationLabel)
        .filter(
          value => Boolean(value.trim()),
        ) ?? [],
    [latest],
  )

  const warnings = useMemo(
    () =>
      latest?.warnings.map(stringifyMessage) ??
      [],
    [latest],
  )

  const errors = useMemo(
    () =>
      latest?.errors.map(stringifyMessage) ??
      [],
    [latest],
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
          setOpen(current => !current)
        }}
        className={[
          'flex w-full items-center',
          'justify-between gap-4',
          'px-5 py-4 text-left',
          'transition hover:bg-slate-50',
        ].join(' ')}
        aria-expanded={open}
      >
        <span>
          <span
            className={[
              'block text-sm font-semibold',
              'text-slate-950',
            ].join(' ')}
          >
            AnÃ¡lise inteligente EDI
          </span>

          <span
            className={[
              'mt-1 block text-xs',
              'text-slate-500',
            ].join(' ')}
          >
            {evidenceTitle
              ? `EvidÃªncia: ${evidenceTitle}`
              : 'Scores, qualidade, confiabilidade e recomendaÃ§Ãµes pedagÃ³gicas.'}
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
          {open ? 'Ocultar' : 'Consultar'}
        </span>
      </button>

      {open ? (
        <div
          className={[
            'border-t border-slate-200',
            'px-5 py-5',
          ].join(' ')}
        >
          {loadingState === 'loading' ? (
            <div
              className={[
                'rounded-xl border',
                'border-blue-200',
                'bg-blue-50 px-4 py-4',
                'text-sm text-blue-800',
              ].join(' ')}
            >
              Carregando a anÃ¡lise inteligente...
            </div>
          ) : null}

          {loadingState === 'error' &&
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
                NÃ£o foi possÃ­vel carregar
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
                    force: true,
                  })
                }}
                className={[
                  'mt-3 rounded-lg',
                  'border border-rose-300',
                  'bg-white px-3 py-2',
                  'text-xs font-semibold',
                  'text-rose-800',
                  'transition hover:bg-rose-100',
                ].join(' ')}
              >
                Tentar novamente
              </button>
            </div>
          ) : null}

          {loadingState === 'success' &&
          data &&
          !data.intelligence.available ? (
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
                AnÃ¡lise ainda nÃ£o disponÃ­vel
              </p>

              <p
                className={[
                  'mt-1 text-sm',
                  'text-slate-600',
                ].join(' ')}
              >
                A evidÃªncia ainda nÃ£o possui uma execuÃ§Ã£o persistida do Evidence Intelligence.
              </p>
            </div>
          ) : null}

          {loadingState === 'success' &&
          latest ? (
            <div className="space-y-6">
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
                  {' Â· '}
                  {formatDateTime(
                    latest.processed_at ??
                      latest.updated_at,
                  )}
                </span>
              </div>

              {pedagogicalInsights ? (
                <EvidencePedagogicalAnalysis
                  analysis={pedagogicalInsights}
                  evidenceTitle={
                    evidenceTitle ??
                    data?.evidence.title
                  }
                />
              ) : (
                <div
                  className={[
                    'rounded-xl border',
                    'border-slate-200',
                    'bg-slate-50 p-4',
                  ].join(' ')}
                >
                  <p
                    className={[
                      'text-sm font-semibold',
                      'text-slate-800',
                    ].join(' ')}
                  >
                    Leitura pedagÃ³gica nÃ£o disponÃ­vel nesta execuÃ§Ã£o
                  </p>

                  <p
                    className={[
                      'mt-1 text-sm',
                      'leading-6 text-slate-600',
                    ].join(' ')}
                  >
                    ExecuÃ§Ãµes anteriores Ã  versÃ£o pedagÃ³gica do motor nÃ£o possuem scores EDI e recomendaÃ§Ãµes persistidas.
                  </p>
                </div>
              )}

              <section>
                <p
                  className={[
                    'text-xs font-bold',
                    'uppercase',
                    'tracking-[0.14em]',
                    'text-[#0B7491]',
                  ].join(' ')}
                >
                  Qualidade e confiabilidade tÃ©cnica
                </p>

                <div
                  className={[
                    'mt-4 grid gap-3',
                    'sm:grid-cols-3',
                  ].join(' ')}
                >
                  <ScoreCard
                    label="Qualidade tÃ©cnica"
                    value={formatNormalizedScore(
                      latest.quality_score,
                    )}
                    description={getNormalizedScoreDescription(
                      latest.quality_score,
                    )}
                  />

                  <ScoreCard
                    label="Confiabilidade"
                    value={formatNormalizedScore(
                      latest.reliability_score,
                    )}
                    description={getNormalizedScoreDescription(
                      latest.reliability_score,
                    )}
                  />

                  <ScoreCard
                    label="ConfianÃ§a"
                    value={formatNormalizedScore(
                      latest.confidence_score,
                    )}
                    description={getNormalizedScoreDescription(
                      latest.confidence_score,
                    )}
                  />
                </div>
              </section>

              {latest.requires_human_review ||
              pedagogicalInsights
                ?.requiresHumanReview ? (
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
                    RevisÃ£o humana necessÃ¡ria
                  </p>

                  <p
                    className={[
                      'mt-1 text-sm',
                      'leading-6 text-amber-900',
                    ].join(' ')}
                  >
                    SituaÃ§Ã£o:{' '}
                    {
                      HUMAN_REVIEW_LABELS[
                        latest.human_review_status
                      ]
                    }
                    . A interpretaÃ§Ã£o final permanece sob responsabilidade profissional.
                  </p>
                </div>
              ) : null}

              {classifications.length > 0 ? (
                <section>
                  <h4
                    className={[
                      'text-sm font-semibold',
                      'text-slate-900',
                    ].join(' ')}
                  >
                    ClassificaÃ§Ãµes do Framework EDI
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
                </section>
              ) : null}

              {warnings.length > 0 ? (
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
                    Pontos de atenÃ§Ã£o tÃ©cnicos
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

              {errors.length > 0 ? (
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

              <section
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
                    HistÃ³rico de processamento
                  </h4>

                  <span
                    className={[
                      'text-xs',
                      'text-slate-500',
                    ].join(' ')}
                  >
                    {history.length} execuÃ§Ã£o(Ãµes)
                  </span>
                </div>

                <div className="mt-3 space-y-2">
                  {history.map(run => (
                    <div
                      key={run.id}
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
                        versÃ£o {run.engine_version}
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              <button
                type="button"
                onClick={() => {
                  void loadIntelligence({
                    force: true,
                  })
                }}
                className={[
                  'rounded-lg border',
                  'border-slate-300',
                  'bg-white px-3 py-2',
                  'text-xs font-semibold',
                  'text-slate-700',
                  'transition hover:bg-slate-100',
                ].join(' ')}
              >
                Atualizar anÃ¡lise
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}
