'use client'

import {
  type FormEvent,
  useMemo,
  useState,
} from 'react'

import type {
  PedagogicalIntervention,
  PedagogicalInterventionEffect,
  PedagogicalInterventionEvaluationStatus,
  PedagogicalProgressLevel,
} from '@/lib/agenda/evidence-intelligence/pedagogical-intervention.types'

type PedagogicalInterventionMonitoringPanelProps = {
  intervention:
    PedagogicalIntervention

  disabled?: boolean

  className?: string

  onInterventionChange?: (
    intervention:
      PedagogicalIntervention,
  ) => void
}

type OperationState =
  | 'idle'
  | 'starting'
  | 'progress'
  | 'checkpoint'
  | 'indicator'
  | 'criterion'
  | 'evaluation'

type ApiResponse = {
  success: boolean

  data?: {
    intervention?:
      PedagogicalIntervention

    operation?: {
      action?: string

      occurredAt?: string
    }
  }

  error?: string
}

type ProgressFormState = {
  progressLevel:
    PedagogicalProgressLevel

  progressPercentage:
    string

  summary:
    string

  achievements:
    string

  difficulties:
    string

  adjustmentsMade:
    string

  nextActions:
    string

  teacherObservations:
    string

  nextMonitoringAt:
    string
}

type EvaluationFormState = {
  status:
    Exclude<
      PedagogicalInterventionEvaluationStatus,
      | 'not_started'
      | 'collecting_evidence'
      | 'under_review'
    >

  effect:
    PedagogicalInterventionEffect

  effectivenessScore:
    string

  confidenceScore:
    string

  summary:
    string

  positiveOutcomes:
    string

  negativeOutcomes:
    string

  contributingFactors:
    string

  limitingFactors:
    string

  continuationRecommendations:
    string

  redesignRecommendations:
    string
}

const PROGRESS_LEVEL_LABELS:
  Record<
    PedagogicalProgressLevel,
    string
  > = {
    not_observed:
      'Não observado',

    insufficient:
      'Insuficiente',

    initial:
      'Inicial',

    developing:
      'Em desenvolvimento',

    adequate:
      'Adequado',

    advanced:
      'Avançado',
  }

const EXECUTION_STATUS_LABELS:
  Record<string, string> = {
    not_started:
      'Não iniciada',

    scheduled:
      'Agendada',

    in_progress:
      'Em andamento',

    partially_completed:
      'Parcialmente concluída',

    completed:
      'Concluída',

    paused:
      'Pausada',

    cancelled:
      'Cancelada',

    not_applicable:
      'Não aplicável',
  }

const EVALUATION_STATUS_LABELS:
  Record<string, string> = {
    not_started:
      'Não iniciada',

    collecting_evidence:
      'Coletando evidências',

    under_review:
      'Em análise',

    effective:
      'Efetiva',

    partially_effective:
      'Parcialmente efetiva',

    ineffective:
      'Inefetiva',

    inconclusive:
      'Inconclusiva',

    requires_continuation:
      'Requer continuidade',

    requires_redesign:
      'Requer reformulação',
  }

const CHECKPOINT_STATUS_LABELS:
  Record<string, string> = {
    pending:
      'Pendente',

    scheduled:
      'Agendado',

    completed:
      'Concluído',

    overdue:
      'Atrasado',

    cancelled:
      'Cancelado',

    rescheduled:
      'Reagendado',
  }

const SUCCESS_CRITERION_LABELS:
  Record<string, string> = {
    not_evaluated:
      'Não avaliado',

    achieved:
      'Alcançado',

    partially_achieved:
      'Parcialmente alcançado',

    not_achieved:
      'Não alcançado',

    inconclusive:
      'Inconclusivo',
  }

const EFFECT_LABELS:
  Record<
    PedagogicalInterventionEffect,
    string
  > = {
    positive:
      'Positivo',

    neutral:
      'Neutro',

    negative:
      'Negativo',

    mixed:
      'Misto',

    not_determined:
      'Não determinado',
  }

const FINAL_EVALUATION_STATUSES:
  Array<
    Exclude<
      PedagogicalInterventionEvaluationStatus,
      | 'not_started'
      | 'collecting_evidence'
      | 'under_review'
    >
  > = [
    'effective',
    'partially_effective',
    'ineffective',
    'inconclusive',
    'requires_continuation',
    'requires_redesign',
  ]

const EFFECTS:
  PedagogicalInterventionEffect[] = [
    'positive',
    'neutral',
    'negative',
    'mixed',
    'not_determined',
  ]

const API_PATH =
  '/api/agenda/evidences/intelligence/pedagogical-interventions'

function createInitialProgressForm(
  intervention:
    PedagogicalIntervention,
): ProgressFormState {
  return {
    progressLevel:
      'developing',

    progressPercentage:
      String(
        intervention.monitoring
          .progressPercentage ??
        0,
      ),

    summary:
      '',

    achievements:
      '',

    difficulties:
      '',

    adjustmentsMade:
      '',

    nextActions:
      '',

    teacherObservations:
      '',

    nextMonitoringAt:
      '',
  }
}

function createInitialEvaluationForm():
  EvaluationFormState {
  return {
    status:
      'effective',

    effect:
      'positive',

    effectivenessScore:
      '',

    confidenceScore:
      '',

    summary:
      '',

    positiveOutcomes:
      '',

    negativeOutcomes:
      '',

    contributingFactors:
      '',

    limitingFactors:
      '',

    continuationRecommendations:
      '',

    redesignRecommendations:
      '',
  }
}

function parseTextList(
  value:
    string,
): string[] {
  return Array.from(
    new Set(
      value
        .split(/\n|;/)
        .map(
          item =>
            item.trim(),
        )
        .filter(Boolean),
    ),
  )
}

function normalizeOptionalDate(
  value:
    string,
): string | null {
  if (!value.trim()) {
    return null
  }

  const date =
    new Date(value)

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return null
  }

  return date.toISOString()
}

function normalizeOptionalScore(
  value:
    string,
): number | null {
  if (!value.trim()) {
    return null
  }

  const score =
    Number(value)

  if (
    !Number.isFinite(score)
  ) {
    return null
  }

  return Math.min(
    1,
    Math.max(
      0,
      score,
    ),
  )
}

function formatDateTime(
  value:
    string | null | undefined,
): string {
  if (!value) {
    return 'Não informado'
  }

  const date =
    new Date(value)

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return 'Data inválida'
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

function formatValue(
  value:
    number | string | boolean | null | undefined,
): string {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return 'Não informado'
  }

  if (
    typeof value ===
    'boolean'
  ) {
    return value
      ? 'Sim'
      : 'Não'
  }

  return String(value)
}

function createInterventionUrl(
  interventionId:
    string,
): string {
  return [
    API_PATH,
    encodeURIComponent(
      interventionId,
    ),
  ].join('/')
}

async function readError(
  response:
    Response,
): Promise<string> {
  try {
    const body =
      await response.json() as
        ApiResponse

    if (
      typeof body.error ===
        'string' &&
      body.error.trim()
    ) {
      return body.error
    }
  } catch {
    return `Erro HTTP ${response.status}.`
  }

  return `Erro HTTP ${response.status}.`
}

function Section({
  title,
  description,
  children,
  defaultOpen = false,
}: {
  title: string

  description?: string

  children:
    React.ReactNode

  defaultOpen?: boolean
}) {
  return (
    <details
      open={defaultOpen}
      className={[
        'group overflow-hidden',
        'rounded-2xl border',
        'border-slate-200',
        'bg-white',
      ].join(' ')}
    >
      <summary
        className={[
          'flex cursor-pointer',
          'list-none items-start',
          'justify-between gap-4',
          'px-5 py-4',
          'transition',
          'hover:bg-slate-50',
        ].join(' ')}
      >
        <span>
          <span
            className={[
              'block text-sm',
              'font-semibold',
              'text-[#092A45]',
            ].join(' ')}
          >
            {title}
          </span>

          {description ? (
            <span
              className={[
                'mt-1 block',
                'text-xs leading-5',
                'text-slate-600',
              ].join(' ')}
            >
              {description}
            </span>
          ) : null}
        </span>

        <span
          aria-hidden="true"
          className={[
            'text-lg',
            'text-slate-500',
            'transition-transform',
            'group-open:rotate-45',
          ].join(' ')}
        >
          +
        </span>
      </summary>

      <div
        className={[
          'border-t',
          'border-slate-100',
          'px-5 py-5',
        ].join(' ')}
      >
        {children}
      </div>
    </details>
  )
}

function Metric({
  label,
  value,
  description,
}: {
  label: string

  value: string

  description?: string
}) {
  return (
    <div
      className={[
        'rounded-xl border',
        'border-slate-200',
        'bg-slate-50 p-4',
      ].join(' ')}
    >
      <p
        className={[
          'text-xs font-semibold',
          'uppercase',
          'tracking-[0.12em]',
          'text-slate-500',
        ].join(' ')}
      >
        {label}
      </p>

      <p
        className={[
          'mt-2 text-lg',
          'font-bold',
          'text-[#092A45]',
        ].join(' ')}
      >
        {value}
      </p>

      {description ? (
        <p
          className={[
            'mt-1 text-xs',
            'leading-5',
            'text-slate-500',
          ].join(' ')}
        >
          {description}
        </p>
      ) : null}
    </div>
  )
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
}: {
  label: string

  value: string

  onChange: (
    value:
      string,
  ) => void

  placeholder?: string

  required?: boolean

  disabled?: boolean
}) {
  return (
    <label className="block">
      <span
        className={[
          'text-sm font-semibold',
          'text-slate-800',
        ].join(' ')}
      >
        {label}
      </span>

      <textarea
        value={value}
        onChange={
          event =>
            onChange(
              event.target.value,
            )
        }
        required={required}
        disabled={disabled}
        rows={3}
        placeholder={placeholder}
        className={[
          'mt-2 w-full',
          'rounded-xl border',
          'border-slate-300',
          'bg-white px-3 py-2',
          'text-sm text-slate-900',
          'outline-none',
          'transition',
          'focus:border-[#087E8B]',
          'focus:ring-2',
          'focus:ring-cyan-100',
          'disabled:cursor-not-allowed',
          'disabled:bg-slate-100',
        ].join(' ')}
      />
    </label>
  )
}

export default function PedagogicalInterventionMonitoringPanel({
  intervention,
  disabled = false,
  className = '',
  onInterventionChange,
}: PedagogicalInterventionMonitoringPanelProps) {
  const [
    operationState,
    setOperationState,
  ] = useState<OperationState>(
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
    progressForm,
    setProgressForm,
  ] = useState<
    ProgressFormState
  >(
    () =>
      createInitialProgressForm(
        intervention,
      ),
  )

  const [
    evaluationForm,
    setEvaluationForm,
  ] = useState<
    EvaluationFormState
  >(
    createInitialEvaluationForm,
  )

  const progressPercentage =
    intervention.monitoring
      .progressPercentage ??
    0

  const isBusy =
    disabled ||
    operationState !==
      'idle'

  const canStart =
    (
      intervention.teacherDecision
        .decision ===
        'accepted' ||
      intervention.teacherDecision
        .decision ===
        'adapted'
    ) &&
    (
      intervention.monitoring
        .executionStatus ===
        'not_started' ||
      intervention.monitoring
        .executionStatus ===
        'scheduled'
    )

  const canRecordProgress =
    intervention.monitoring
      .executionStatus ===
      'in_progress' ||
    intervention.monitoring
      .executionStatus ===
      'partially_completed'

  const canEvaluate =
    intervention.monitoring
      .executionStatus ===
      'completed' ||
    intervention.status ===
      'completed' ||
    intervention.status ===
      'under_evaluation'

  const orderedEvents =
    useMemo(
      () =>
        [
          ...intervention
            .traceability
            .auditEvents,
        ].sort(
          (
            first,
            second,
          ) =>
            Date.parse(
              second.occurredAt,
            ) -
            Date.parse(
              first.occurredAt,
            ),
        ),
      [
        intervention
          .traceability
          .auditEvents,
      ],
    )

  async function executeAction(
    action:
      Record<string, unknown>,
    state:
      Exclude<
        OperationState,
        'idle'
      >,
    successMessage:
      string,
  ): Promise<
    PedagogicalIntervention
  > {
    setOperationState(
      state,
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
              JSON.stringify(
                action,
              ),
          },
        )

      if (!response.ok) {
        throw new Error(
          await readError(
            response,
          ),
        )
      }

      const body =
        await response.json() as
          ApiResponse

      const updated =
        body.data
          ?.intervention

      if (!updated) {
        throw new Error(
          'A API não retornou a intervenção atualizada.',
        )
      }

      onInterventionChange?.(
        updated,
      )

      setMessage(
        successMessage,
      )

      return updated
    } catch (operationError) {
      const errorMessage =
        operationError instanceof Error
          ? operationError.message
          : 'Não foi possível concluir a operação.'

      setError(
        errorMessage,
      )

      throw operationError
    } finally {
      setOperationState(
        'idle',
      )
    }
  }

  async function handleStart():
    Promise<void> {
    await executeAction(
      {
        action:
          'start',

        occurredAt:
          new Date()
            .toISOString(),

        nextMonitoringAt:
          normalizeOptionalDate(
            progressForm
              .nextMonitoringAt,
          ),

        notes:
          parseTextList(
            progressForm
              .nextActions,
          ),
      },
      'starting',
      'Intervenção iniciada.',
    )
  }

  async function handleProgressSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault()

    const percentage =
      Number(
        progressForm
          .progressPercentage,
      )

    if (
      !Number.isFinite(
        percentage,
      ) ||
      percentage < 0 ||
      percentage > 100
    ) {
      setError(
        'O percentual deve estar entre 0 e 100.',
      )

      return
    }

    await executeAction(
      {
        action:
          'record_progress',

        progressLevel:
          progressForm
            .progressLevel,

        progressPercentage:
          percentage,

        summary:
          progressForm
            .summary,

        achievements:
          parseTextList(
            progressForm
              .achievements,
          ),

        difficulties:
          parseTextList(
            progressForm
              .difficulties,
          ),

        adjustmentsMade:
          parseTextList(
            progressForm
              .adjustmentsMade,
          ),

        nextActions:
          parseTextList(
            progressForm
              .nextActions,
          ),

        teacherObservations:
          parseTextList(
            progressForm
              .teacherObservations,
          ),

        currentChallenges:
          parseTextList(
            progressForm
              .difficulties,
          ),

        currentStrengths:
          parseTextList(
            progressForm
              .achievements,
          ),

        recommendedAdjustments:
          parseTextList(
            progressForm
              .adjustmentsMade,
          ),

        nextMonitoringAt:
          normalizeOptionalDate(
            progressForm
              .nextMonitoringAt,
          ),

        expectedVersionId:
          intervention
            .version.id,

        occurredAt:
          new Date()
            .toISOString(),
      },
      'progress',
      'Progresso registrado.',
    )

    setProgressForm(
      current => ({
        ...current,

        summary:
          '',

        achievements:
          '',

        difficulties:
          '',

        adjustmentsMade:
          '',

        nextActions:
          '',

        teacherObservations:
          '',
      }),
    )
  }

  async function completeCheckpoint(
    checkpointId:
      string,
  ): Promise<void> {
    await executeAction(
      {
        action:
          'complete_checkpoint',

        checkpointId,

        status:
          'completed',

        completedAt:
          new Date()
            .toISOString(),

        expectedVersionId:
          intervention
            .version.id,
      },
      'checkpoint',
      'Checkpoint concluído.',
    )
  }

  async function updateIndicator(
    indicatorId:
      string,
    currentValue:
      string,
  ): Promise<void> {
    const numericValue =
      Number(
        currentValue,
      )

    const value:
      number | string =
      currentValue.trim() !==
        '' &&
      Number.isFinite(
        numericValue,
      )
        ? numericValue
        : currentValue

    await executeAction(
      {
        action:
          'update_indicator',

        indicatorId,

        currentValue:
          value,

        measuredAt:
          new Date()
            .toISOString(),

        expectedVersionId:
          intervention
            .version.id,
      },
      'indicator',
      'Indicador atualizado.',
    )
  }

  async function updateCriterion(
    criterionId:
      string,
    status:
      'achieved' |
      'partially_achieved' |
      'not_achieved' |
      'inconclusive',
  ): Promise<void> {
    await executeAction(
      {
        action:
          'update_success_criterion',

        criterionId,

        observedValue:
          status,

        status,

        occurredAt:
          new Date()
            .toISOString(),

        expectedVersionId:
          intervention
            .version.id,
      },
      'criterion',
      'Critério de sucesso atualizado.',
    )
  }

  async function handleEvaluationSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault()

    await executeAction(
      {
        action:
          'evaluate',

        status:
          evaluationForm.status,

        effect:
          evaluationForm.effect,

        effectivenessScore:
          normalizeOptionalScore(
            evaluationForm
              .effectivenessScore,
          ),

        confidenceScore:
          normalizeOptionalScore(
            evaluationForm
              .confidenceScore,
          ),

        summary:
          evaluationForm.summary,

        achievedObjectives:
          intervention
            .successCriteria
            .filter(
              criterion =>
                criterion.status ===
                'achieved',
            )
            .flatMap(
              criterion =>
                criterion
                  .objectiveIds,
            ),

        partiallyAchievedObjectives:
          intervention
            .successCriteria
            .filter(
              criterion =>
                criterion.status ===
                'partially_achieved',
            )
            .flatMap(
              criterion =>
                criterion
                  .objectiveIds,
            ),

        unachievedObjectives:
          intervention
            .successCriteria
            .filter(
              criterion =>
                criterion.status ===
                'not_achieved',
            )
            .flatMap(
              criterion =>
                criterion
                  .objectiveIds,
            ),

        evidenceIds:
          intervention.context
            .links
            .evidenceIds,

        positiveOutcomes:
          parseTextList(
            evaluationForm
              .positiveOutcomes,
          ),

        negativeOutcomes:
          parseTextList(
            evaluationForm
              .negativeOutcomes,
          ),

        contributingFactors:
          parseTextList(
            evaluationForm
              .contributingFactors,
          ),

        limitingFactors:
          parseTextList(
            evaluationForm
              .limitingFactors,
          ),

        continuationRecommendations:
          parseTextList(
            evaluationForm
              .continuationRecommendations,
          ),

        redesignRecommendations:
          parseTextList(
            evaluationForm
              .redesignRecommendations,
          ),

        requiresHumanValidation:
          true,

        expectedVersionId:
          intervention
            .version.id,

        occurredAt:
          new Date()
            .toISOString(),
      },
      'evaluation',
      'Avaliação de efetividade registrada.',
    )
  }

  return (
    <section
      className={[
        'space-y-5',
        'rounded-3xl',
        'border border-slate-200',
        'bg-slate-50 p-5',
        className,
      ].join(' ')}
      aria-labelledby={
        `intervention-monitoring-${intervention.id}`
      }
    >
      <header>
        <p
          className={[
            'text-xs font-semibold',
            'uppercase',
            'tracking-[0.16em]',
            'text-[#087E8B]',
          ].join(' ')}
        >
          Ciclo longitudinal · EIOS
        </p>

        <h3
          id={
            `intervention-monitoring-${intervention.id}`
          }
          className={[
            'mt-1 text-lg',
            'font-bold',
            'text-[#092A45]',
          ].join(' ')}
        >
          Acompanhamento da intervenção
        </h3>

        <p
          className={[
            'mt-1 text-sm',
            'leading-6',
            'text-slate-600',
          ].join(' ')}
        >
          Registre execução, progresso,
          indicadores, checkpoints e
          efetividade da intervenção.
        </p>
      </header>

      {error ? (
        <div
          role="alert"
          className={[
            'rounded-xl border',
            'border-red-200',
            'bg-red-50 p-4',
            'text-sm text-red-900',
          ].join(' ')}
        >
          {error}
        </div>
      ) : null}

      {message ? (
        <div
          aria-live="polite"
          className={[
            'rounded-xl border',
            'border-emerald-200',
            'bg-emerald-50 p-4',
            'text-sm text-emerald-900',
          ].join(' ')}
        >
          {message}
        </div>
      ) : null}

      <div
        className={[
          'grid gap-3',
          'sm:grid-cols-2',
          'lg:grid-cols-4',
        ].join(' ')}
      >
        <Metric
          label="Execução"
          value={
            EXECUTION_STATUS_LABELS[
              intervention
                .monitoring
                .executionStatus
            ] ??
            intervention
              .monitoring
              .executionStatus
          }
        />

        <Metric
          label="Progresso"
          value={`${Math.round(
            progressPercentage,
          )}%`}
          description={
            `Último registro: ${
              formatDateTime(
                intervention
                  .monitoring
                  .lastMonitoredAt,
              )
            }`
          }
        />

        <Metric
          label="Avaliação"
          value={
            EVALUATION_STATUS_LABELS[
              intervention
                .effectiveness
                ?.status ??
              'not_started'
            ] ??
            'Não iniciada'
          }
        />

        <Metric
          label="Próximo acompanhamento"
          value={
            formatDateTime(
              intervention
                .monitoring
                .nextMonitoringAt,
            )
          }
        />
      </div>

      <div
        className={[
          'h-3 overflow-hidden',
          'rounded-full',
          'bg-slate-200',
        ].join(' ')}
        aria-label={
          `Progresso de ${Math.round(
            progressPercentage,
          )}%`
        }
      >
        <div
          className={[
            'h-full rounded-full',
            'bg-[#087E8B]',
            'transition-all',
          ].join(' ')}
          style={{
            width:
              `${Math.min(
                100,
                Math.max(
                  0,
                  progressPercentage,
                ),
              )}%`,
          }}
        />
      </div>

      {canStart ? (
        <button
          type="button"
          disabled={isBusy}
          onClick={() =>
            void handleStart()
          }
          className={[
            'inline-flex',
            'items-center',
            'justify-center',
            'rounded-xl',
            'bg-[#087E8B]',
            'px-4 py-3',
            'text-sm font-semibold',
            'text-white',
            'transition',
            'hover:bg-[#066A75]',
            'disabled:cursor-not-allowed',
            'disabled:opacity-50',
          ].join(' ')}
        >
          {operationState ===
          'starting'
            ? 'Iniciando...'
            : 'Iniciar intervenção'}
        </button>
      ) : null}

      <Section
        title="Registrar progresso"
        description="Registre avanços, dificuldades, ajustes e próximas ações."
        defaultOpen={
          canRecordProgress
        }
      >
        {canRecordProgress ? (
          <form
            onSubmit={
              event =>
                void handleProgressSubmit(
                  event,
                )
            }
            className="space-y-4"
          >
            <div
              className={[
                'grid gap-4',
                'sm:grid-cols-2',
              ].join(' ')}
            >
              <label>
                <span
                  className={[
                    'text-sm font-semibold',
                    'text-slate-800',
                  ].join(' ')}
                >
                  Nível de progresso
                </span>

                <select
                  value={
                    progressForm
                      .progressLevel
                  }
                  disabled={isBusy}
                  onChange={
                    event =>
                      setProgressForm(
                        current => ({
                          ...current,

                          progressLevel:
                            event.target
                              .value as
                              PedagogicalProgressLevel,
                        }),
                      )
                  }
                  className={[
                    'mt-2 w-full',
                    'rounded-xl border',
                    'border-slate-300',
                    'bg-white px-3 py-2',
                    'text-sm',
                  ].join(' ')}
                >
                  {(
                    Object.keys(
                      PROGRESS_LEVEL_LABELS,
                    ) as
                      PedagogicalProgressLevel[]
                  ).map(
                    level => (
                      <option
                        key={level}
                        value={level}
                      >
                        {
                          PROGRESS_LEVEL_LABELS[
                            level
                          ]
                        }
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label>
                <span
                  className={[
                    'text-sm font-semibold',
                    'text-slate-800',
                  ].join(' ')}
                >
                  Progresso (%)
                </span>

                <input
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  required
                  disabled={isBusy}
                  value={
                    progressForm
                      .progressPercentage
                  }
                  onChange={
                    event =>
                      setProgressForm(
                        current => ({
                          ...current,

                          progressPercentage:
                            event.target
                              .value,
                        }),
                      )
                  }
                  className={[
                    'mt-2 w-full',
                    'rounded-xl border',
                    'border-slate-300',
                    'bg-white px-3 py-2',
                    'text-sm',
                  ].join(' ')}
                />
              </label>
            </div>

            <TextAreaField
              label="Resumo do progresso"
              value={
                progressForm.summary
              }
              required
              disabled={isBusy}
              onChange={
                value =>
                  setProgressForm(
                    current => ({
                      ...current,
                      summary:
                        value,
                    }),
                  )
              }
              placeholder="Descreva o que ocorreu desde o último acompanhamento."
            />

            <div
              className={[
                'grid gap-4',
                'lg:grid-cols-2',
              ].join(' ')}
            >
              <TextAreaField
                label="Avanços"
                value={
                  progressForm
                    .achievements
                }
                disabled={isBusy}
                onChange={
                  value =>
                    setProgressForm(
                      current => ({
                        ...current,
                        achievements:
                          value,
                      }),
                    )
                }
                placeholder="Um item por linha."
              />

              <TextAreaField
                label="Dificuldades"
                value={
                  progressForm
                    .difficulties
                }
                disabled={isBusy}
                onChange={
                  value =>
                    setProgressForm(
                      current => ({
                        ...current,
                        difficulties:
                          value,
                      }),
                    )
                }
                placeholder="Um item por linha."
              />

              <TextAreaField
                label="Ajustes realizados"
                value={
                  progressForm
                    .adjustmentsMade
                }
                disabled={isBusy}
                onChange={
                  value =>
                    setProgressForm(
                      current => ({
                        ...current,
                        adjustmentsMade:
                          value,
                      }),
                    )
                }
                placeholder="Um item por linha."
              />

              <TextAreaField
                label="Próximas ações"
                value={
                  progressForm
                    .nextActions
                }
                disabled={isBusy}
                onChange={
                  value =>
                    setProgressForm(
                      current => ({
                        ...current,
                        nextActions:
                          value,
                      }),
                    )
                }
                placeholder="Um item por linha."
              />
            </div>

            <TextAreaField
              label="Observações profissionais"
              value={
                progressForm
                  .teacherObservations
              }
              disabled={isBusy}
              onChange={
                value =>
                  setProgressForm(
                    current => ({
                      ...current,
                      teacherObservations:
                        value,
                    }),
                  )
              }
            />

            <label className="block">
              <span
                className={[
                  'text-sm font-semibold',
                  'text-slate-800',
                ].join(' ')}
              >
                Próximo monitoramento
              </span>

              <input
                type="datetime-local"
                value={
                  progressForm
                    .nextMonitoringAt
                }
                disabled={isBusy}
                onChange={
                  event =>
                    setProgressForm(
                      current => ({
                        ...current,

                        nextMonitoringAt:
                          event.target
                            .value,
                      }),
                    )
                }
                className={[
                  'mt-2 w-full',
                  'rounded-xl border',
                  'border-slate-300',
                  'bg-white px-3 py-2',
                  'text-sm',
                ].join(' ')}
              />
            </label>

            <button
              type="submit"
              disabled={isBusy}
              className={[
                'rounded-xl',
                'bg-[#087E8B]',
                'px-4 py-3',
                'text-sm font-semibold',
                'text-white',
                'transition',
                'hover:bg-[#066A75]',
                'disabled:cursor-not-allowed',
                'disabled:opacity-50',
              ].join(' ')}
            >
              {operationState ===
              'progress'
                ? 'Registrando...'
                : 'Registrar progresso'}
            </button>
          </form>
        ) : (
          <p
            className={[
              'rounded-xl border',
              'border-dashed',
              'border-slate-300',
              'bg-slate-50 p-4',
              'text-sm text-slate-600',
            ].join(' ')}
          >
            Inicie a intervenção antes
            de registrar o progresso.
          </p>
        )}
      </Section>

      <Section
        title="Checkpoints"
        description="Marcos de diagnóstico, execução, avaliação e acompanhamento."
      >
        {intervention.schedule
          .checkpoints.length ===
        0 ? (
          <p
            className={[
              'text-sm',
              'text-slate-600',
            ].join(' ')}
          >
            Nenhum checkpoint
            cadastrado.
          </p>
        ) : (
          <div className="space-y-3">
            {intervention.schedule
              .checkpoints
              .map(
                checkpoint => (
                  <article
                    key={
                      checkpoint.id
                    }
                    className={[
                      'rounded-xl border',
                      'border-slate-200',
                      'bg-slate-50 p-4',
                    ].join(' ')}
                  >
                    <div
                      className={[
                        'flex flex-col',
                        'gap-3',
                        'sm:flex-row',
                        'sm:items-start',
                        'sm:justify-between',
                      ].join(' ')}
                    >
                      <div>
                        <p
                          className={[
                            'font-semibold',
                            'text-[#092A45]',
                          ].join(' ')}
                        >
                          {
                            checkpoint.title
                          }
                        </p>

                        <p
                          className={[
                            'mt-1 text-sm',
                            'text-slate-600',
                          ].join(' ')}
                        >
                          {
                            checkpoint.description
                          }
                        </p>

                        <p
                          className={[
                            'mt-2 text-xs',
                            'text-slate-500',
                          ].join(' ')}
                        >
                          Previsto para{' '}
                          {formatDateTime(
                            checkpoint
                              .plannedAt,
                          )}
                        </p>
                      </div>

                      <span
                        className={[
                          'rounded-full',
                          'border',
                          'border-slate-300',
                          'bg-white px-3',
                          'py-1 text-xs',
                          'font-semibold',
                          'text-slate-700',
                        ].join(' ')}
                      >
                        {
                          CHECKPOINT_STATUS_LABELS[
                            checkpoint
                              .status
                          ] ??
                          checkpoint
                            .status
                        }
                      </span>
                    </div>

                    {checkpoint.status !==
                    'completed' ? (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() =>
                          void completeCheckpoint(
                            checkpoint.id,
                          )
                        }
                        className={[
                          'mt-3 rounded-lg',
                          'border',
                          'border-[#087E8B]',
                          'bg-white px-3',
                          'py-2 text-xs',
                          'font-semibold',
                          'text-[#087E8B]',
                          'transition',
                          'hover:bg-cyan-50',
                          'disabled:opacity-50',
                        ].join(' ')}
                      >
                        Concluir checkpoint
                      </button>
                    ) : null}
                  </article>
                ),
              )}
          </div>
        )}
      </Section>

      <Section
        title="Indicadores"
        description="Atualize os valores observados durante a intervenção."
      >
        {intervention.indicators
          .length === 0 ? (
          <p className="text-sm text-slate-600">
            Nenhum indicador cadastrado.
          </p>
        ) : (
          <div className="space-y-3">
            {intervention.indicators
              .map(
                indicator => (
                  <IndicatorEditor
                    key={
                      indicator.id
                    }
                    name={
                      indicator.name
                    }
                    description={
                      indicator.description
                    }
                    currentValue={
                      indicator
                        .currentValue
                    }
                    targetValue={
                      indicator
                        .targetValue
                    }
                    disabled={isBusy}
                    onSave={
                      value =>
                        updateIndicator(
                          indicator.id,
                          value,
                        )
                    }
                  />
                ),
              )}
          </div>
        )}
      </Section>

      <Section
        title="Critérios de sucesso"
        description="Registre o grau de alcance dos resultados esperados."
      >
        {intervention
          .successCriteria
          .length === 0 ? (
          <p className="text-sm text-slate-600">
            Nenhum critério cadastrado.
          </p>
        ) : (
          <div className="space-y-3">
            {intervention
              .successCriteria
              .map(
                criterion => (
                  <article
                    key={
                      criterion.id
                    }
                    className={[
                      'rounded-xl border',
                      'border-slate-200',
                      'bg-slate-50 p-4',
                    ].join(' ')}
                  >
                    <p
                      className={[
                        'font-semibold',
                        'text-[#092A45]',
                      ].join(' ')}
                    >
                      {criterion.title}
                    </p>

                    <p
                      className={[
                        'mt-1 text-sm',
                        'text-slate-600',
                      ].join(' ')}
                    >
                      {
                        criterion.description
                      }
                    </p>

                    <p
                      className={[
                        'mt-2 text-xs',
                        'font-semibold',
                        'text-slate-600',
                      ].join(' ')}
                    >
                      Situação:{' '}
                      {
                        SUCCESS_CRITERION_LABELS[
                          criterion.status
                        ] ??
                        criterion.status
                      }
                    </p>

                    <div
                      className={[
                        'mt-3 flex',
                        'flex-wrap gap-2',
                      ].join(' ')}
                    >
                      <CriterionButton
                        label="Alcançado"
                        disabled={isBusy}
                        onClick={() =>
                          updateCriterion(
                            criterion.id,
                            'achieved',
                          )
                        }
                      />

                      <CriterionButton
                        label="Parcial"
                        disabled={isBusy}
                        onClick={() =>
                          updateCriterion(
                            criterion.id,
                            'partially_achieved',
                          )
                        }
                      />

                      <CriterionButton
                        label="Não alcançado"
                        disabled={isBusy}
                        onClick={() =>
                          updateCriterion(
                            criterion.id,
                            'not_achieved',
                          )
                        }
                      />

                      <CriterionButton
                        label="Inconclusivo"
                        disabled={isBusy}
                        onClick={() =>
                          updateCriterion(
                            criterion.id,
                            'inconclusive',
                          )
                        }
                      />
                    </div>
                  </article>
                ),
              )}
          </div>
        )}
      </Section>

      <Section
        title="Avaliação de efetividade"
        description="Avalie os resultados após a conclusão da execução."
        defaultOpen={
          canEvaluate
        }
      >
        {canEvaluate ? (
          <form
            onSubmit={
              event =>
                void handleEvaluationSubmit(
                  event,
                )
            }
            className="space-y-4"
          >
            <div
              className={[
                'grid gap-4',
                'sm:grid-cols-2',
              ].join(' ')}
            >
              <label>
                <span className="text-sm font-semibold text-slate-800">
                  Resultado
                </span>

                <select
                  value={
                    evaluationForm
                      .status
                  }
                  disabled={isBusy}
                  onChange={
                    event =>
                      setEvaluationForm(
                        current => ({
                          ...current,

                          status:
                            event.target
                              .value as
                              EvaluationFormState[
                                'status'
                              ],
                        }),
                      )
                  }
                  className={[
                    'mt-2 w-full',
                    'rounded-xl border',
                    'border-slate-300',
                    'bg-white px-3 py-2',
                    'text-sm',
                  ].join(' ')}
                >
                  {FINAL_EVALUATION_STATUSES.map(
                    status => (
                      <option
                        key={status}
                        value={status}
                      >
                        {
                          EVALUATION_STATUS_LABELS[
                            status
                          ]
                        }
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label>
                <span className="text-sm font-semibold text-slate-800">
                  Efeito observado
                </span>

                <select
                  value={
                    evaluationForm
                      .effect
                  }
                  disabled={isBusy}
                  onChange={
                    event =>
                      setEvaluationForm(
                        current => ({
                          ...current,

                          effect:
                            event.target
                              .value as
                              PedagogicalInterventionEffect,
                        }),
                      )
                  }
                  className={[
                    'mt-2 w-full',
                    'rounded-xl border',
                    'border-slate-300',
                    'bg-white px-3 py-2',
                    'text-sm',
                  ].join(' ')}
                >
                  {EFFECTS.map(
                    effect => (
                      <option
                        key={effect}
                        value={effect}
                      >
                        {
                          EFFECT_LABELS[
                            effect
                          ]
                        }
                      </option>
                    ),
                  )}
                </select>
              </label>
            </div>

            <div
              className={[
                'grid gap-4',
                'sm:grid-cols-2',
              ].join(' ')}
            >
              <label>
                <span className="text-sm font-semibold text-slate-800">
                  Efetividade (0 a 1)
                </span>

                <input
                  type="number"
                  min={0}
                  max={1}
                  step={0.01}
                  value={
                    evaluationForm
                      .effectivenessScore
                  }
                  disabled={isBusy}
                  onChange={
                    event =>
                      setEvaluationForm(
                        current => ({
                          ...current,

                          effectivenessScore:
                            event.target
                              .value,
                        }),
                      )
                  }
                  className={[
                    'mt-2 w-full',
                    'rounded-xl border',
                    'border-slate-300',
                    'bg-white px-3 py-2',
                    'text-sm',
                  ].join(' ')}
                />
              </label>

              <label>
                <span className="text-sm font-semibold text-slate-800">
                  Confiança (0 a 1)
                </span>

                <input
                  type="number"
                  min={0}
                  max={1}
                  step={0.01}
                  value={
                    evaluationForm
                      .confidenceScore
                  }
                  disabled={isBusy}
                  onChange={
                    event =>
                      setEvaluationForm(
                        current => ({
                          ...current,

                          confidenceScore:
                            event.target
                              .value,
                        }),
                      )
                  }
                  className={[
                    'mt-2 w-full',
                    'rounded-xl border',
                    'border-slate-300',
                    'bg-white px-3 py-2',
                    'text-sm',
                  ].join(' ')}
                />
              </label>
            </div>

            <TextAreaField
              label="Síntese da avaliação"
              value={
                evaluationForm.summary
              }
              required
              disabled={isBusy}
              onChange={
                value =>
                  setEvaluationForm(
                    current => ({
                      ...current,
                      summary:
                        value,
                    }),
                  )
              }
            />

            <div
              className={[
                'grid gap-4',
                'lg:grid-cols-2',
              ].join(' ')}
            >
              <TextAreaField
                label="Resultados positivos"
                value={
                  evaluationForm
                    .positiveOutcomes
                }
                disabled={isBusy}
                onChange={
                  value =>
                    setEvaluationForm(
                      current => ({
                        ...current,
                        positiveOutcomes:
                          value,
                      }),
                    )
                }
              />

              <TextAreaField
                label="Resultados negativos"
                value={
                  evaluationForm
                    .negativeOutcomes
                }
                disabled={isBusy}
                onChange={
                  value =>
                    setEvaluationForm(
                      current => ({
                        ...current,
                        negativeOutcomes:
                          value,
                      }),
                    )
                }
              />

              <TextAreaField
                label="Fatores contribuintes"
                value={
                  evaluationForm
                    .contributingFactors
                }
                disabled={isBusy}
                onChange={
                  value =>
                    setEvaluationForm(
                      current => ({
                        ...current,
                        contributingFactors:
                          value,
                      }),
                    )
                }
              />

              <TextAreaField
                label="Fatores limitantes"
                value={
                  evaluationForm
                    .limitingFactors
                }
                disabled={isBusy}
                onChange={
                  value =>
                    setEvaluationForm(
                      current => ({
                        ...current,
                        limitingFactors:
                          value,
                      }),
                    )
                }
              />

              <TextAreaField
                label="Recomendações de continuidade"
                value={
                  evaluationForm
                    .continuationRecommendations
                }
                disabled={isBusy}
                onChange={
                  value =>
                    setEvaluationForm(
                      current => ({
                        ...current,
                        continuationRecommendations:
                          value,
                      }),
                    )
                }
              />

              <TextAreaField
                label="Recomendações de reformulação"
                value={
                  evaluationForm
                    .redesignRecommendations
                }
                disabled={isBusy}
                onChange={
                  value =>
                    setEvaluationForm(
                      current => ({
                        ...current,
                        redesignRecommendations:
                          value,
                      }),
                    )
                }
              />
            </div>

            <button
              type="submit"
              disabled={isBusy}
              className={[
                'rounded-xl',
                'bg-[#092A45]',
                'px-4 py-3',
                'text-sm font-semibold',
                'text-white',
                'transition',
                'hover:bg-[#123D5B]',
                'disabled:opacity-50',
              ].join(' ')}
            >
              {operationState ===
              'evaluation'
                ? 'Avaliando...'
                : 'Registrar avaliação final'}
            </button>
          </form>
        ) : (
          <p
            className={[
              'rounded-xl border',
              'border-dashed',
              'border-slate-300',
              'bg-slate-50 p-4',
              'text-sm text-slate-600',
            ].join(' ')}
          >
            A avaliação final será
            liberada quando a intervenção
            estiver concluída.
          </p>
        )}
      </Section>

      <Section
        title="Histórico longitudinal"
        description="Eventos rastreáveis produzidos durante o ciclo da intervenção."
      >
        {orderedEvents.length ===
        0 ? (
          <p className="text-sm text-slate-600">
            Nenhum evento registrado.
          </p>
        ) : (
          <ol className="space-y-3">
            {orderedEvents.map(
              event => (
                <li
                  key={event.id}
                  className={[
                    'rounded-xl border',
                    'border-slate-200',
                    'bg-white p-4',
                  ].join(' ')}
                >
                  <div
                    className={[
                      'flex flex-col',
                      'gap-2',
                      'sm:flex-row',
                      'sm:items-start',
                      'sm:justify-between',
                    ].join(' ')}
                  >
                    <div>
                      <p
                        className={[
                          'text-sm',
                          'font-semibold',
                          'text-[#092A45]',
                        ].join(' ')}
                      >
                        {event.type
                          .replaceAll(
                            '_',
                            ' ',
                          )}
                      </p>

                      <p
                        className={[
                          'mt-1 text-sm',
                          'leading-6',
                          'text-slate-600',
                        ].join(' ')}
                      >
                        {event.reason}
                      </p>
                    </div>

                    <time
                      className={[
                        'text-xs',
                        'text-slate-500',
                      ].join(' ')}
                    >
                      {formatDateTime(
                        event.occurredAt,
                      )}
                    </time>
                  </div>

                  <p
                    className={[
                      'mt-2 text-xs',
                      'text-slate-500',
                    ].join(' ')}
                  >
                    Responsável:{' '}
                    {event.actorId ??
                      'Sistema'}
                  </p>
                </li>
              ),
            )}
          </ol>
        )}
      </Section>
    </section>
  )
}

function CriterionButton({
  label,
  disabled,
  onClick,
}: {
  label: string

  disabled: boolean

  onClick:
    () => Promise<void>
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() =>
        void onClick()
      }
      className={[
        'rounded-lg border',
        'border-slate-300',
        'bg-white px-3 py-2',
        'text-xs font-semibold',
        'text-slate-700',
        'transition',
        'hover:bg-slate-100',
        'disabled:opacity-50',
      ].join(' ')}
    >
      {label}
    </button>
  )
}

function IndicatorEditor({
  name,
  description,
  currentValue,
  targetValue,
  disabled,
  onSave,
}: {
  name: string

  description: string

  currentValue:
    number | string | boolean | null | undefined

  targetValue:
    number | string | boolean | null | undefined

  disabled: boolean

  onSave: (
    value:
      string,
  ) => Promise<void>
}) {
  const [
    value,
    setValue,
  ] = useState(
    currentValue ===
      null ||
    currentValue ===
      undefined
      ? ''
      : String(
          currentValue,
        ),
  )

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
          'font-semibold',
          'text-[#092A45]',
        ].join(' ')}
      >
        {name}
      </p>

      <p
        className={[
          'mt-1 text-sm',
          'text-slate-600',
        ].join(' ')}
      >
        {description}
      </p>

      <div
        className={[
          'mt-3 grid gap-3',
          'sm:grid-cols-2',
        ].join(' ')}
      >
        <Metric
          label="Atual"
          value={
            formatValue(
              currentValue,
            )
          }
        />

        <Metric
          label="Meta"
          value={
            formatValue(
              targetValue,
            )
          }
        />
      </div>

      <div
        className={[
          'mt-3 flex',
          'flex-col gap-2',
          'sm:flex-row',
        ].join(' ')}
      >
        <input
          value={value}
          disabled={disabled}
          onChange={
            event =>
              setValue(
                event.target.value,
              )
          }
          placeholder="Novo valor"
          className={[
            'min-w-0 flex-1',
            'rounded-lg border',
            'border-slate-300',
            'bg-white px-3 py-2',
            'text-sm',
          ].join(' ')}
        />

        <button
          type="button"
          disabled={
            disabled ||
            !value.trim()
          }
          onClick={() =>
            void onSave(
              value,
            )
          }
          className={[
            'rounded-lg',
            'bg-[#087E8B]',
            'px-3 py-2',
            'text-xs font-semibold',
            'text-white',
            'disabled:opacity-50',
          ].join(' ')}
        >
          Atualizar
        </button>
      </div>
    </article>
  )
}