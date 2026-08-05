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

type PedagogicalDimension =
  | 'evidence'
  | 'inclusion'
  | 'intelligence'

type PedagogicalDimensionLevel =
  | 'initial'
  | 'developing'
  | 'adequate'
  | 'advanced'

type PedagogicalInsightSeverity =
  | 'information'
  | 'attention'
  | 'priority'
  | 'critical'

type PedagogicalDimensionScore = {
  dimension:
    PedagogicalDimension

  label:
    string

  score:
    number

  level:
    PedagogicalDimensionLevel

  explanation:
    string

  strengths:
    string[]

  gaps:
    string[]
}

type PedagogicalInsight = {
  id:
    string

  category:
    string

  severity:
    PedagogicalInsightSeverity

  title:
    string

  description:
    string

  recommendation:
    string

  evidence:
    string[]

  priority:
    number

  requiresHumanReview:
    boolean
}

type PedagogicalInsights = {
  success:
    boolean

  summary:
    string

  evidenceScore:
    number

  inclusionScore:
    number

  intelligenceScore:
    number

  overallScore:
    number

  dimensions:
    PedagogicalDimensionScore[]

  insights:
    PedagogicalInsight[]

  strengths:
    string[]

  improvementOpportunities:
    string[]

  recommendedNextActions:
    string[]

  requiresHumanReview:
    boolean

  generatedAt:
    string

  engine: {
    name:
      string

    version:
      string

    mode:
      string
  }

  metadata:
    Record<string, unknown>
}

type IntelligenceRun = {
  id:
    string

  evidence_id:
    string

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

const DIMENSION_LEVEL_LABELS:
  Record<
    PedagogicalDimensionLevel,
    string
  > = {
    initial:
      'Inicial',

    developing:
      'Em desenvolvimento',

    adequate:
      'Adequado',

    advanced:
      'Avançado',
  }

const SEVERITY_LABELS:
  Record<
    PedagogicalInsightSeverity,
    string
  > = {
    information:
      'Informação',

    attention:
      'Atenção',

    priority:
      'Prioridade',

    critical:
      'Crítico',
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

function isStringArray(
  value:
    unknown,
): value is string[] {
  return (
    Array.isArray(
      value,
    ) &&
    value.every(
      item =>
        typeof item ===
        'string',
    )
  )
}

function isFiniteNumber(
  value:
    unknown,
): value is number {
  return (
    typeof value ===
      'number' &&
    Number.isFinite(
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

function formatNormalizedScore(
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

function formatPercentageScore(
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
    value,
  )}%`
}

function getNormalizedScoreDescription(
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

function getSeverityClasses(
  severity:
    PedagogicalInsightSeverity,
): string {
  if (
    severity ===
      'critical'
  ) {
    return [
      'border-rose-200',
      'bg-rose-50',
      'text-rose-900',
    ].join(' ')
  }

  if (
    severity ===
      'priority'
  ) {
    return [
      'border-orange-200',
      'bg-orange-50',
      'text-orange-900',
    ].join(' ')
  }

  if (
    severity ===
      'attention'
  ) {
    return [
      'border-amber-200',
      'bg-amber-50',
      'text-amber-900',
    ].join(' ')
  }

  return [
    'border-blue-200',
    'bg-blue-50',
    'text-blue-900',
  ].join(' ')
}

function getDimensionClasses(
  level:
    PedagogicalDimensionLevel,
): string {
  if (
    level ===
      'advanced'
  ) {
    return [
      'border-emerald-200',
      'bg-emerald-50',
      'text-emerald-900',
    ].join(' ')
  }

  if (
    level ===
      'adequate'
  ) {
    return [
      'border-cyan-200',
      'bg-cyan-50',
      'text-cyan-900',
    ].join(' ')
  }

  if (
    level ===
      'developing'
  ) {
    return [
      'border-amber-200',
      'bg-amber-50',
      'text-amber-900',
    ].join(' ')
  }

  return [
    'border-rose-200',
    'bg-rose-50',
    'text-rose-900',
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

function parseDimension(
  value:
    unknown,
): PedagogicalDimensionScore | null {
  if (
    !isRecord(
      value,
    )
  ) {
    return null
  }

  const dimension =
    value.dimension

  const label =
    value.label

  const score =
    value.score

  const level =
    value.level

  const explanation =
    value.explanation

  if (
    dimension !==
      'evidence' &&
    dimension !==
      'inclusion' &&
    dimension !==
      'intelligence'
  ) {
    return null
  }

  if (
    typeof label !==
      'string' ||
    !isFiniteNumber(
      score,
    ) ||
    (
      level !==
        'initial' &&
      level !==
        'developing' &&
      level !==
        'adequate' &&
      level !==
        'advanced'
    ) ||
    typeof explanation !==
      'string'
  ) {
    return null
  }

  return {
    dimension,

    label,

    score,

    level,

    explanation,

    strengths:
      isStringArray(
        value.strengths,
      )
        ? value.strengths
        : [],

    gaps:
      isStringArray(
        value.gaps,
      )
        ? value.gaps
        : [],
  }
}

function parseInsight(
  value:
    unknown,
): PedagogicalInsight | null {
  if (
    !isRecord(
      value,
    )
  ) {
    return null
  }

  const severity =
    value.severity

  if (
    severity !==
      'information' &&
    severity !==
      'attention' &&
    severity !==
      'priority' &&
    severity !==
      'critical'
  ) {
    return null
  }

  if (
    typeof value.id !==
      'string' ||
    typeof value.category !==
      'string' ||
    typeof value.title !==
      'string' ||
    typeof value.description !==
      'string' ||
    typeof value.recommendation !==
      'string' ||
    !isFiniteNumber(
      value.priority,
    ) ||
    typeof value.requiresHumanReview !==
      'boolean'
  ) {
    return null
  }

  return {
    id:
      value.id,

    category:
      value.category,

    severity,

    title:
      value.title,

    description:
      value.description,

    recommendation:
      value.recommendation,

    evidence:
      isStringArray(
        value.evidence,
      )
        ? value.evidence
        : [],

    priority:
      value.priority,

    requiresHumanReview:
      value.requiresHumanReview,
  }
}

function parsePedagogicalInsights(
  explanation:
    Record<string, unknown>,
): PedagogicalInsights | null {
  const rawInsights =
    explanation
      .pedagogicalInsights

  if (
    !isRecord(
      rawInsights,
    )
  ) {
    return null
  }

  if (
    typeof rawInsights.success !==
      'boolean' ||
    typeof rawInsights.summary !==
      'string' ||
    !isFiniteNumber(
      rawInsights.evidenceScore,
    ) ||
    !isFiniteNumber(
      rawInsights.inclusionScore,
    ) ||
    !isFiniteNumber(
      rawInsights.intelligenceScore,
    ) ||
    !isFiniteNumber(
      rawInsights.overallScore,
    ) ||
    typeof rawInsights.requiresHumanReview !==
      'boolean' ||
    typeof rawInsights.generatedAt !==
      'string'
  ) {
    return null
  }

  const dimensions =
    Array.isArray(
      rawInsights.dimensions,
    )
      ? rawInsights
          .dimensions
          .map(
            parseDimension,
          )
          .filter(
            (
              item,
            ): item is PedagogicalDimensionScore =>
              item !==
              null,
          )
      : []

  const insights =
    Array.isArray(
      rawInsights.insights,
    )
      ? rawInsights
          .insights
          .map(
            parseInsight,
          )
          .filter(
            (
              item,
            ): item is PedagogicalInsight =>
              item !==
              null,
          )
      : []

  const rawEngine =
    rawInsights.engine

  const engine =
    isRecord(
      rawEngine,
    )
      ? {
          name:
            typeof rawEngine.name ===
              'string'
              ? rawEngine.name
              : 'pedagogical-insights',

          version:
            typeof rawEngine.version ===
              'string'
              ? rawEngine.version
              : 'desconhecida',

          mode:
            typeof rawEngine.mode ===
              'string'
              ? rawEngine.mode
              : 'não informado',
        }
      : {
          name:
            'pedagogical-insights',

          version:
            'desconhecida',

          mode:
            'não informado',
        }

  return {
    success:
      rawInsights.success,

    summary:
      rawInsights.summary,

    evidenceScore:
      rawInsights.evidenceScore,

    inclusionScore:
      rawInsights.inclusionScore,

    intelligenceScore:
      rawInsights.intelligenceScore,

    overallScore:
      rawInsights.overallScore,

    dimensions,

    insights,

    strengths:
      isStringArray(
        rawInsights.strengths,
      )
        ? rawInsights.strengths
        : [],

    improvementOpportunities:
      isStringArray(
        rawInsights.improvementOpportunities,
      )
        ? rawInsights.improvementOpportunities
        : [],

    recommendedNextActions:
      isStringArray(
        rawInsights.recommendedNextActions,
      )
        ? rawInsights.recommendedNextActions
        : [],

    requiresHumanReview:
      rawInsights.requiresHumanReview,

    generatedAt:
      rawInsights.generatedAt,

    engine,

    metadata:
      isRecord(
        rawInsights.metadata,
      )
        ? rawInsights.metadata
        : {},
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

function ScoreCard({
  label,
  value,
  description,
}: {
  label:
    string

  value:
    string

  description:
    string
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
        force?:
          boolean
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

  const pedagogicalInsights =
    useMemo(
      () =>
        latest
          ? parsePedagogicalInsights(
              latest.explanation,
            )
          : null,
      [
        latest,
      ],
    )

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
              : 'Scores EDI, qualidade, confiabilidade e recomendações pedagógicas.'}
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
                  'transition hover:bg-rose-100',
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
                  'transition hover:bg-slate-100',
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
              className="space-y-6"
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

              {pedagogicalInsights ? (
                <section
                  className={[
                    'overflow-hidden rounded-2xl',
                    'border border-cyan-200',
                    'bg-white',
                  ].join(' ')}
                >
                  <header
                    className={[
                      'border-b border-cyan-200',
                      'bg-cyan-50 px-5 py-4',
                    ].join(' ')}
                  >
                    <p
                      className={[
                        'text-xs font-bold uppercase',
                        'tracking-[0.16em]',
                        'text-cyan-800',
                      ].join(' ')}
                    >
                      Leitura pedagógica do Framework EDI
                    </p>

                    <h3
                      className={[
                        'mt-2 text-lg font-bold',
                        'text-slate-950',
                      ].join(' ')}
                    >
                      Score geral: {
                        formatPercentageScore(
                          pedagogicalInsights
                            .overallScore,
                        )
                      }
                    </h3>

                    <p
                      className={[
                        'mt-2 text-sm leading-6',
                        'text-slate-700',
                      ].join(' ')}
                    >
                      {
                        pedagogicalInsights
                          .summary
                      }
                    </p>
                  </header>

                  <div
                    className={[
                      'grid gap-px bg-slate-200',
                      'sm:grid-cols-3',
                    ].join(' ')}
                  >
                    {pedagogicalInsights
                      .dimensions
                      .map(
                        dimension => (
                          <article
                            key={
                              dimension
                                .dimension
                            }
                            className={[
                              'bg-white p-4',
                            ].join(' ')}
                          >
                            <p
                              className={[
                                'text-xs font-bold',
                                'uppercase tracking-wide',
                                'text-slate-500',
                              ].join(' ')}
                            >
                              {
                                dimension.label
                              }
                            </p>

                            <p
                              className={[
                                'mt-2 text-3xl',
                                'font-bold text-slate-950',
                              ].join(' ')}
                            >
                              {
                                formatPercentageScore(
                                  dimension.score,
                                )
                              }
                            </p>

                            <span
                              className={[
                                'mt-2 inline-flex',
                                'rounded-full border',
                                'px-2.5 py-1',
                                'text-xs font-semibold',
                                getDimensionClasses(
                                  dimension.level,
                                ),
                              ].join(' ')}
                            >
                              {
                                DIMENSION_LEVEL_LABELS[
                                  dimension.level
                                ]
                              }
                            </span>

                            <p
                              className={[
                                'mt-3 text-xs',
                                'leading-5 text-slate-600',
                              ].join(' ')}
                            >
                              {
                                dimension
                                  .explanation
                              }
                            </p>
                          </article>
                        ),
                      )}
                  </div>
                </section>
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
                    Leitura pedagógica não disponível nesta execução
                  </p>

                  <p
                    className={[
                      'mt-1 text-sm',
                      'leading-6 text-slate-600',
                    ].join(' ')}
                  >
                    Execuções anteriores à versão pedagógica do motor não possuem scores EDI e recomendações persistidas. Registre uma nova evidência para gerar essa camada.
                  </p>
                </div>
              )}

              <div
                className={[
                  'grid gap-3',
                  'sm:grid-cols-3',
                ].join(' ')}
              >
                <ScoreCard
                  label="Qualidade técnica"
                  value={
                    formatNormalizedScore(
                      latest.quality_score,
                    )
                  }
                  description={
                    getNormalizedScoreDescription(
                      latest.quality_score,
                    )
                  }
                />

                <ScoreCard
                  label="Confiabilidade"
                  value={
                    formatNormalizedScore(
                      latest.reliability_score,
                    )
                  }
                  description={
                    getNormalizedScoreDescription(
                      latest.reliability_score,
                    )
                  }
                />

                <ScoreCard
                  label="Confiança"
                  value={
                    formatNormalizedScore(
                      latest.confidence_score,
                    )
                  }
                  description={
                    getNormalizedScoreDescription(
                      latest.confidence_score,
                    )
                  }
                />
              </div>

              {pedagogicalInsights &&
              pedagogicalInsights
                .strengths
                .length >
                0 ? (
                <section
                  className={[
                    'rounded-xl border',
                    'border-emerald-200',
                    'bg-emerald-50 p-4',
                  ].join(' ')}
                >
                  <h4
                    className={[
                      'text-sm font-bold',
                      'text-emerald-950',
                    ].join(' ')}
                  >
                    Pontos fortes
                  </h4>

                  <ul
                    className={[
                      'mt-3 space-y-2',
                      'text-sm leading-6',
                      'text-emerald-900',
                    ].join(' ')}
                  >
                    {pedagogicalInsights
                      .strengths
                      .map(
                        strength => (
                          <li
                            key={
                              strength
                            }
                          >
                            {strength}
                          </li>
                        ),
                      )}
                  </ul>
                </section>
              ) : null}

              {pedagogicalInsights &&
              pedagogicalInsights
                .recommendedNextActions
                .length >
                0 ? (
                <section
                  className={[
                    'rounded-xl border',
                    'border-cyan-200',
                    'bg-cyan-50 p-4',
                  ].join(' ')}
                >
                  <h4
                    className={[
                      'text-sm font-bold',
                      'text-cyan-950',
                    ].join(' ')}
                  >
                    Próximas ações recomendadas
                  </h4>

                  <ol
                    className={[
                      'mt-3 space-y-3',
                      'text-sm leading-6',
                      'text-cyan-950',
                    ].join(' ')}
                  >
                    {pedagogicalInsights
                      .recommendedNextActions
                      .map(
                        (
                          action,
                          index,
                        ) => (
                          <li
                            key={
                              action
                            }
                            className="flex gap-3"
                          >
                            <span
                              className={[
                                'flex h-6 w-6',
                                'shrink-0 items-center',
                                'justify-center rounded-full',
                                'bg-cyan-800',
                                'text-xs font-bold',
                                'text-white',
                              ].join(' ')}
                            >
                              {index +
                                1}
                            </span>

                            <span>
                              {action}
                            </span>
                          </li>
                        ),
                      )}
                  </ol>
                </section>
              ) : null}

              {pedagogicalInsights &&
              pedagogicalInsights
                .insights
                .length >
                0 ? (
                <section>
                  <h4
                    className={[
                      'text-sm font-bold',
                      'text-slate-950',
                    ].join(' ')}
                  >
                    Diagnóstico pedagógico
                  </h4>

                  <div
                    className={[
                      'mt-3 space-y-3',
                    ].join(' ')}
                  >
                    {pedagogicalInsights
                      .insights
                      .map(
                        insight => (
                          <article
                            key={
                              insight.id
                            }
                            className={[
                              'rounded-xl border',
                              'p-4',
                              getSeverityClasses(
                                insight.severity,
                              ),
                            ].join(' ')}
                          >
                            <div
                              className={[
                                'flex flex-wrap',
                                'items-start',
                                'justify-between',
                                'gap-3',
                              ].join(' ')}
                            >
                              <div>
                                <p
                                  className={[
                                    'text-xs font-bold',
                                    'uppercase',
                                    'tracking-wide',
                                  ].join(' ')}
                                >
                                  {
                                    SEVERITY_LABELS[
                                      insight
                                        .severity
                                    ]
                                  }
                                  {' · '}
                                  prioridade {
                                    insight.priority
                                  }
                                </p>

                                <h5
                                  className={[
                                    'mt-1 text-sm',
                                    'font-bold',
                                  ].join(' ')}
                                >
                                  {
                                    insight.title
                                  }
                                </h5>
                              </div>

                              {insight
                                .requiresHumanReview ? (
                                <span
                                  className={[
                                    'rounded-full border',
                                    'border-current',
                                    'px-2.5 py-1',
                                    'text-xs font-bold',
                                  ].join(' ')}
                                >
                                  Revisão humana
                                </span>
                              ) : null}
                            </div>

                            <p
                              className={[
                                'mt-2 text-sm',
                                'leading-6',
                              ].join(' ')}
                            >
                              {
                                insight
                                  .description
                              }
                            </p>

                            <div
                              className={[
                                'mt-3 rounded-lg',
                                'border border-current/20',
                                'bg-white/60 p-3',
                              ].join(' ')}
                            >
                              <p
                                className={[
                                  'text-xs font-bold',
                                  'uppercase',
                                  'tracking-wide',
                                ].join(' ')}
                              >
                                Recomendação
                              </p>

                              <p
                                className={[
                                  'mt-1 text-sm',
                                  'leading-6',
                                ].join(' ')}
                              >
                                {
                                  insight
                                    .recommendation
                                }
                              </p>
                            </div>
                          </article>
                        ),
                      )}
                  </div>
                </section>
              ) : null}

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
                    Revisão humana necessária
                  </p>

                  <p
                    className={[
                      'mt-1 text-sm',
                      'leading-6 text-amber-900',
                    ].join(' ')}
                  >
                    Situação: {
                      HUMAN_REVIEW_LABELS[
                        latest.human_review_status
                      ]
                    }. A análise apoia a decisão pedagógica, mas a interpretação final permanece sob responsabilidade profissional.
                  </p>
                </div>
              ) : null}

              {classifications.length >
              0 ? (
                <section>
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
                </section>
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
                    Pontos de atenção técnicos
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
              </section>

              <div
                className={[
                  'flex flex-wrap gap-3',
                ].join(' ')}
              >
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
                    'transition hover:bg-slate-100',
                  ].join(' ')}
                >
                  Atualizar análise
                </button>

                {pedagogicalInsights ? (
                  <span
                    className={[
                      'inline-flex items-center',
                      'rounded-lg border',
                      'border-slate-200',
                      'bg-slate-50 px-3 py-2',
                      'text-xs text-slate-500',
                    ].join(' ')}
                  >
                    Insights {
                      pedagogicalInsights
                        .engine
                        .version
                    }
                    {' · '}
                    {formatDateTime(
                      pedagogicalInsights
                        .generatedAt,
                    )}
                  </span>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}