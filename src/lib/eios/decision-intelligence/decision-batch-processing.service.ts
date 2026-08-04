import {
  type DecisionRule,
  type EducationalDecision,
} from './decision-intelligence.contract'

import {
  processDecisionIntelligence,
  type DecisionIntelligenceProcessingOptions,
  type DecisionIntelligenceResult,
} from './decision-intelligence.service'

export type DecisionBatchExecutionMode =
  | 'sequential'
  | 'parallel'

export type DecisionBatchProcessingOptions = {
  rules?: DecisionRule[]

  additionalDataByDecisionId?: Record<
    string,
    Record<string, unknown>
  >

  intelligenceOptions?: Omit<
    DecisionIntelligenceProcessingOptions,
    | 'rules'
    | 'additionalData'
  >

  executionMode?: DecisionBatchExecutionMode

  concurrency?: number

  continueOnError?: boolean

  preserveInputOrder?: boolean
}

export type DecisionBatchItemStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'

export type DecisionBatchItemResult = {
  index: number

  decisionId: string

  status: DecisionBatchItemStatus

  success: boolean

  result: DecisionIntelligenceResult | null

  warnings: string[]

  errors: string[]

  startedAt: string

  completedAt: string

  durationMs: number

  metadata: Record<string, unknown>
}

export type DecisionBatchMetrics = {
  total: number

  completed: number

  failed: number

  succeeded: number

  requiresHumanReview: number

  recommendationsGenerated: number

  alertsGenerated: number

  actionPlansGenerated: number

  actionsGenerated: number

  averageDurationMs: number

  minimumDurationMs: number

  maximumDurationMs: number
}

export type DecisionBatchProcessingResult = {
  success: boolean

  batchId: string

  executionMode: DecisionBatchExecutionMode

  concurrency: number

  total: number

  completed: number

  failed: number

  results: DecisionBatchItemResult[]

  successfulResults: DecisionIntelligenceResult[]

  failedDecisionIds: string[]

  warnings: string[]

  errors: string[]

  requiresHumanReview: boolean

  metrics: DecisionBatchMetrics

  startedAt: string

  completedAt: string

  durationMs: number

  metadata: Record<string, unknown>
}

const DEFAULT_OPTIONS: Required<
  Pick<
    DecisionBatchProcessingOptions,
    | 'executionMode'
    | 'concurrency'
    | 'continueOnError'
    | 'preserveInputOrder'
  >
> = {
  executionMode: 'sequential',
  concurrency: 4,
  continueOnError: true,
  preserveInputOrder: true,
}

function nowIso(): string {
  return new Date().toISOString()
}

function createId(prefix: string): string {
  return [
    prefix,
    Date.now(),
    Math.random()
      .toString(36)
      .slice(2, 10),
  ].join('-')
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(
    new Set(
      values
        .map(value => value.trim())
        .filter(Boolean),
    ),
  )
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  if (
    typeof error === 'string' &&
    error.trim()
  ) {
    return error.trim()
  }

  return 'Erro inesperado durante o processamento em lote.'
}

function normalizeConcurrency(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_OPTIONS.concurrency
  }

  return Math.min(
    20,
    Math.max(
      1,
      Math.floor(value),
    ),
  )
}

function normalizeOptions(
  options: DecisionBatchProcessingOptions = {},
): Required<
  Pick<
    DecisionBatchProcessingOptions,
    | 'executionMode'
    | 'concurrency'
    | 'continueOnError'
    | 'preserveInputOrder'
  >
> &
  Omit<
    DecisionBatchProcessingOptions,
    | 'executionMode'
    | 'concurrency'
    | 'continueOnError'
    | 'preserveInputOrder'
  > {
  return {
    ...options,

    executionMode:
      options.executionMode ??
      DEFAULT_OPTIONS.executionMode,

    concurrency:
      normalizeConcurrency(
        options.concurrency ??
        DEFAULT_OPTIONS.concurrency,
      ),

    continueOnError:
      options.continueOnError ??
      DEFAULT_OPTIONS.continueOnError,

    preserveInputOrder:
      options.preserveInputOrder ??
      DEFAULT_OPTIONS.preserveInputOrder,
  }
}

function createFailedItemResult({
  index,
  decisionId,
  startedAt,
  error,
}: {
  index: number
  decisionId: string
  startedAt: string
  error: unknown
}): DecisionBatchItemResult {
  const completedAt = nowIso()
  const message = getErrorMessage(error)

  return {
    index,
    decisionId,
    status: 'failed',
    success: false,
    result: null,
    warnings: [],
    errors: [message],
    startedAt,
    completedAt,

    durationMs: Math.max(
      0,
      Date.parse(completedAt) -
        Date.parse(startedAt),
    ),

    metadata: {
      failedAt: completedAt,
    },
  }
}

function processDecisionBatchItem({
  decision,
  index,
  options,
}: {
  decision: EducationalDecision
  index: number
  options: ReturnType<typeof normalizeOptions>
}): DecisionBatchItemResult {
  const startedAt = nowIso()

  try {
    const result =
      processDecisionIntelligence({
        decision,

        options: {
          ...options.intelligenceOptions,

          rules:
            options.rules ?? [],

          additionalData:
            options
              .additionalDataByDecisionId
              ?.[decision.id],
        },
      })

    const completedAt = nowIso()

    return {
      index,
      decisionId: decision.id,
      status:
        result.success
          ? 'completed'
          : 'failed',

      success: result.success,
      result,
      warnings: result.warnings,
      errors: result.errors,
      startedAt,
      completedAt,

      durationMs: Math.max(
        0,
        Date.parse(completedAt) -
          Date.parse(startedAt),
      ),

      metadata: {
        requiresHumanReview:
          result.requiresHumanReview,

        recommendationCount:
          result.decision
            .recommendations
            .length,

        alertCount:
          result.decision
            .alerts
            .length,

        actionPlanCount:
          result.decision
            .actionPlans
            .length,
      },
    }
  } catch (error) {
    return createFailedItemResult({
      index,
      decisionId: decision.id,
      startedAt,
      error,
    })
  }
}

async function processSequentially({
  decisions,
  options,
}: {
  decisions: EducationalDecision[]
  options: ReturnType<typeof normalizeOptions>
}): Promise<DecisionBatchItemResult[]> {
  const results: DecisionBatchItemResult[] = []

  for (
    let index = 0;
    index < decisions.length;
    index += 1
  ) {
    const result =
      processDecisionBatchItem({
        decision:
          decisions[index],

        index,

        options,
      })

    results.push(result)

    if (
      !result.success &&
      !options.continueOnError
    ) {
      break
    }
  }

  return results
}

async function processParallelChunk({
  decisions,
  startIndex,
  options,
}: {
  decisions: EducationalDecision[]
  startIndex: number
  options: ReturnType<typeof normalizeOptions>
}): Promise<DecisionBatchItemResult[]> {
  return Promise.all(
    decisions.map(
      async (
        decision,
        chunkIndex,
      ) =>
        processDecisionBatchItem({
          decision,

          index:
            startIndex +
            chunkIndex,

          options,
        }),
    ),
  )
}

async function processInParallel({
  decisions,
  options,
}: {
  decisions: EducationalDecision[]
  options: ReturnType<typeof normalizeOptions>
}): Promise<DecisionBatchItemResult[]> {
  const results: DecisionBatchItemResult[] = []

  for (
    let startIndex = 0;
    startIndex < decisions.length;
    startIndex += options.concurrency
  ) {
    const chunk =
      decisions.slice(
        startIndex,
        startIndex +
          options.concurrency,
      )

    const chunkResults =
      await processParallelChunk({
        decisions: chunk,
        startIndex,
        options,
      })

    results.push(
      ...chunkResults,
    )

    if (
      !options.continueOnError &&
      chunkResults.some(
        result =>
          !result.success,
      )
    ) {
      break
    }
  }

  return results
}

function calculateMetrics(
  results: DecisionBatchItemResult[],
): DecisionBatchMetrics {
  const completed =
    results.filter(
      result =>
        result.status ===
        'completed',
    ).length

  const failed =
    results.filter(
      result =>
        result.status ===
        'failed',
    ).length

  const successfulResults =
    results
      .map(result => result.result)
      .filter(
        (
          result,
        ): result is DecisionIntelligenceResult =>
          Boolean(result),
      )

  const durations =
    results.map(
      result =>
        result.durationMs,
    )

  const totalDuration =
    durations.reduce(
      (
        total,
        value,
      ) =>
        total + value,
      0,
    )

  const recommendationsGenerated =
    successfulResults.reduce(
      (
        total,
        result,
      ) =>
        total +
        result.decision
          .recommendations
          .length,
      0,
    )

  const alertsGenerated =
    successfulResults.reduce(
      (
        total,
        result,
      ) =>
        total +
        result.decision
          .alerts
          .length,
      0,
    )

  const actionPlansGenerated =
    successfulResults.reduce(
      (
        total,
        result,
      ) =>
        total +
        result.decision
          .actionPlans
          .length,
      0,
    )

  const actionsGenerated =
    successfulResults.reduce(
      (
        total,
        result,
      ) =>
        total +
        result.decision
          .actionPlans
          .reduce(
            (
              actionTotal,
              plan,
            ) =>
              actionTotal +
              plan.actions.length,
            0,
          ),
      0,
    )

  return {
    total: results.length,
    completed,
    failed,
    succeeded:
      results.filter(
        result =>
          result.success,
      ).length,

    requiresHumanReview:
      successfulResults.filter(
        result =>
          result.requiresHumanReview,
      ).length,

    recommendationsGenerated,
    alertsGenerated,
    actionPlansGenerated,
    actionsGenerated,

    averageDurationMs:
      durations.length > 0
        ? totalDuration /
          durations.length
        : 0,

    minimumDurationMs:
      durations.length > 0
        ? Math.min(
            ...durations,
          )
        : 0,

    maximumDurationMs:
      durations.length > 0
        ? Math.max(
            ...durations,
          )
        : 0,
  }
}

export async function processDecisionBatch({
  decisions,
  options = {},
}: {
  decisions: EducationalDecision[]
  options?: DecisionBatchProcessingOptions
}): Promise<DecisionBatchProcessingResult> {
  const startedAt = nowIso()
  const batchId =
    createId(
      'decision-batch',
    )

  const normalizedOptions =
    normalizeOptions(options)

  const warnings: string[] = []
  const errors: string[] = []

  if (
    decisions.length === 0
  ) {
    warnings.push(
      'O lote nÃ£o possui decisÃµes para processamento.',
    )
  }

  let results:
    DecisionBatchItemResult[] = []

  try {
    results =
      normalizedOptions
        .executionMode ===
      'parallel'
        ? await processInParallel({
            decisions,
            options:
              normalizedOptions,
          })
        : await processSequentially({
            decisions,
            options:
              normalizedOptions,
          })
  } catch (error) {
    errors.push(
      getErrorMessage(error),
    )
  }

  if (
    normalizedOptions
      .preserveInputOrder
  ) {
    results = [
      ...results,
    ].sort(
      (
        first,
        second,
      ) =>
        first.index -
        second.index,
    )
  }

  warnings.push(
    ...results.flatMap(
      result =>
        result.warnings,
    ),
  )

  errors.push(
    ...results.flatMap(
      result =>
        result.errors,
    ),
  )

  const completedAt = nowIso()

  const successfulResults =
    results
      .filter(
        result =>
          result.success &&
          result.result,
      )
      .map(
        result =>
          result.result as
          DecisionIntelligenceResult,
      )

  const failedDecisionIds =
    uniqueStrings(
      results
        .filter(
          result =>
            !result.success,
        )
        .map(
          result =>
            result.decisionId,
        ),
    )

  const metrics =
    calculateMetrics(results)

  return {
    success:
      errors.length === 0 &&
      failedDecisionIds.length === 0,

    batchId,

    executionMode:
      normalizedOptions
        .executionMode,

    concurrency:
      normalizedOptions
        .concurrency,

    total:
      decisions.length,

    completed:
      results.length,

    failed:
      failedDecisionIds.length,

    results,

    successfulResults,

    failedDecisionIds,

    warnings:
      uniqueStrings(warnings),

    errors:
      uniqueStrings(errors),

    requiresHumanReview:
      successfulResults.some(
        result =>
          result
            .requiresHumanReview,
      ),

    metrics,

    startedAt,

    completedAt,

    durationMs: Math.max(
      0,
      Date.parse(completedAt) -
        Date.parse(startedAt),
    ),

    metadata: {
      engine:
        'decision-batch-processing',

      version:
        'v1',

      framework:
        'Framework EDI',

      processedDecisionIds:
        results.map(
          result =>
            result.decisionId,
        ),

      continueOnError:
        normalizedOptions
          .continueOnError,

      preserveInputOrder:
        normalizedOptions
          .preserveInputOrder,
    },
  }
}

export async function processDecisionBatchSequentially({
  decisions,
  options = {},
}: {
  decisions: EducationalDecision[]
  options?: Omit<
    DecisionBatchProcessingOptions,
    'executionMode'
  >
}): Promise<DecisionBatchProcessingResult> {
  return processDecisionBatch({
    decisions,

    options: {
      ...options,
      executionMode:
        'sequential',
    },
  })
}

export async function processDecisionBatchInParallel({
  decisions,
  options = {},
}: {
  decisions: EducationalDecision[]
  options?: Omit<
    DecisionBatchProcessingOptions,
    'executionMode'
  >
}): Promise<DecisionBatchProcessingResult> {
  return processDecisionBatch({
    decisions,

    options: {
      ...options,
      executionMode:
        'parallel',
    },
  })
}

export function validateDecisionBatchResult(
  result: DecisionBatchProcessingResult,
): {
  valid: boolean
  warnings: string[]
  errors: string[]
} {
  const warnings = [
    ...result.warnings,
  ]

  const errors = [
    ...result.errors,
  ]

  if (
    result.total <
    result.completed
  ) {
    errors.push(
      'O nÃºmero de itens concluÃ­dos Ã© maior que o total informado.',
    )
  }

  if (
    result.failed !==
    result.failedDecisionIds
      .length
  ) {
    errors.push(
      'A quantidade de falhas nÃ£o corresponde aos identificadores registrados.',
    )
  }

  if (
    result.completed <
    result.total
  ) {
    warnings.push(
      'O lote foi encerrado antes de processar todas as decisÃµes.',
    )
  }

  if (
    result.executionMode ===
      'parallel' &&
    result.concurrency < 1
  ) {
    errors.push(
      'A concorrÃªncia do processamento paralelo Ã© invÃ¡lida.',
    )
  }

  return {
    valid:
      errors.length === 0,

    warnings:
      uniqueStrings(warnings),

    errors:
      uniqueStrings(errors),
  }
}

export const decisionBatchProcessingService = {
  process:
    processDecisionBatch,

  processSequentially:
    processDecisionBatchSequentially,

  processInParallel:
    processDecisionBatchInParallel,

  validate:
    validateDecisionBatchResult,
}
