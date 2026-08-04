import {
  EVIDENCE_INTELLIGENCE_CONTRACT_VERSION,
  createDefaultEvidenceProcessingOptions,
  type EducationalEvidence,
  type EvidenceConsolidatedResult,
  type EvidenceContradiction,
  type EvidenceKnowledgeGraphLink,
  type EvidenceProcessingOptions,
  type EvidenceProcessingRequest,
  type EvidenceProcessingResult,
  type EvidenceValidationResult,
} from './evidence-intelligence.contract'

import {
  evaluateEducationalEvidence,
} from './evidence-intelligence.service'

import {
  consolidateEvidenceBatch,
  type EvidenceBatchConsolidationResult,
} from './evidence-consolidator.service'

import {
  detectEvidenceContradictions,
  type EvidenceContradictionDetectionResult,
} from './evidence-contradiction.service'

export type EvidenceBatchProcessingStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'completed_with_warnings'
  | 'failed'
  | 'cancelled'

export type EvidenceBatchProcessingStage =
  | 'validation'
  | 'normalization'
  | 'quality'
  | 'reliability'
  | 'classification'
  | 'contradictions'
  | 'consolidation'
  | 'knowledge_graph'
  | 'finalization'

export type EvidenceBatchItemStatus =
  | 'pending'
  | 'processed'
  | 'failed'
  | 'skipped'

export type EvidenceBatchItemResult = {
  evidenceId:
    string

  status:
    EvidenceBatchItemStatus

  evidence:
    EducationalEvidence | null

  validation:
    EvidenceValidationResult | null

  warnings:
    string[]

  errors:
    string[]

  requiresHumanReview:
    boolean

  processingTimeMs:
    number
}

export type EvidenceBatchStageMetric = {
  stage:
    EvidenceBatchProcessingStage

  startedAt:
    string

  completedAt:
    string

  durationMs:
    number

  processedCount:
    number

  successCount:
    number

  failureCount:
    number

  warningCount:
    number
}

export type EvidenceBatchProcessingMetrics = {
  requestId:
    string

  status:
    EvidenceBatchProcessingStatus

  totalEvidenceCount:
    number

  processedEvidenceCount:
    number

  successfulEvidenceCount:
    number

  failedEvidenceCount:
    number

  skippedEvidenceCount:
    number

  validationErrorCount:
    number

  warningCount:
    number

  contradictionCount:
    number

  consolidationCount:
    number

  knowledgeGraphLinkCount:
    number

  startedAt:
    string

  completedAt:
    string | null

  durationMs:
    number | null

  stages:
    EvidenceBatchStageMetric[]
}

export type EvidenceBatchProcessingExecution = {
  result:
    EvidenceProcessingResult

  status:
    EvidenceBatchProcessingStatus

  metrics:
    EvidenceBatchProcessingMetrics

  items:
    EvidenceBatchItemResult[]
}

export type EvidenceBatchProcessingConfiguration = {
  concurrency:
    number

  stopOnFirstError:
    boolean

  continueOnItemFailure:
    boolean

  maximumEvidencePerBatch:
    number

  generateKnowledgeGraphLinks:
    boolean
}

const DEFAULT_CONFIGURATION:
  EvidenceBatchProcessingConfiguration = {
  concurrency:
    8,

  stopOnFirstError:
    false,

  continueOnItemFailure:
    true,

  maximumEvidencePerBatch:
    5000,

  generateKnowledgeGraphLinks:
    true,
}

function nowIso():
  string {
  return new Date()
    .toISOString()
}

function uniqueStrings(
  values:
    string[],
): string[] {
  return Array.from(
    new Set(
      values
        .map(
          value =>
            value.trim(),
        )
        .filter(
          Boolean,
        ),
    ),
  )
}

function createStageMetric({
  stage,
  startedAt,
  completedAt,
  processedCount,
  successCount,
  failureCount,
  warningCount,
}: {
  stage:
    EvidenceBatchProcessingStage

  startedAt:
    string

  completedAt:
    string

  processedCount:
    number

  successCount:
    number

  failureCount:
    number

  warningCount:
    number
}): EvidenceBatchStageMetric {
  return {
    stage,

    startedAt,

    completedAt,

    durationMs:
      Math.max(
        0,
        Date.parse(
          completedAt,
        ) -
        Date.parse(
          startedAt,
        ),
      ),

    processedCount,

    successCount,

    failureCount,

    warningCount,
  }
}

function mergeProcessingOptions(
  options:
    EvidenceProcessingOptions,
): EvidenceProcessingOptions {
  const defaults =
    createDefaultEvidenceProcessingOptions()

  return {
    ...defaults,
    ...options,

    metadata: {
      ...defaults.metadata,
      ...options.metadata,
    },
  }
}

function normalizeConfiguration(
  configuration:
    Partial<EvidenceBatchProcessingConfiguration> | undefined,
): EvidenceBatchProcessingConfiguration {
  const concurrency =
    Math.max(
      1,
      Math.min(
        32,
        Math.floor(
          configuration?.concurrency ??
          DEFAULT_CONFIGURATION.concurrency,
        ),
      ),
    )

  const maximumEvidencePerBatch =
    Math.max(
      1,
      Math.floor(
        configuration?.maximumEvidencePerBatch ??
        DEFAULT_CONFIGURATION.maximumEvidencePerBatch,
      ),
    )

  return {
    concurrency,

    stopOnFirstError:
      configuration?.stopOnFirstError ??
      DEFAULT_CONFIGURATION.stopOnFirstError,

    continueOnItemFailure:
      configuration?.continueOnItemFailure ??
      DEFAULT_CONFIGURATION.continueOnItemFailure,

    maximumEvidencePerBatch,

    generateKnowledgeGraphLinks:
      configuration?.generateKnowledgeGraphLinks ??
      DEFAULT_CONFIGURATION.generateKnowledgeGraphLinks,
  }
}

function validateProcessingRequest(
  request:
    EvidenceProcessingRequest,

  configuration:
    EvidenceBatchProcessingConfiguration,
): string[] {
  const errors:
    string[] = []

  if (
    !request.requestId.trim()
  ) {
    errors.push(
      'O identificador da requisição de processamento é obrigatório.',
    )
  }

  if (
    request.evidence.length ===
    0
  ) {
    errors.push(
      'A requisição deve conter ao menos uma evidência.',
    )
  }

  if (
    request.evidence.length >
    configuration.maximumEvidencePerBatch
  ) {
    errors.push(
      `O lote excede o limite de ${configuration.maximumEvidencePerBatch} evidências.`,
    )
  }

  if (
    Number.isNaN(
      Date.parse(
        request.requestedAt,
      ),
    )
  ) {
    errors.push(
      'A data da requisição é inválida.',
    )
  }

  const observedIds =
    new Set<string>()

  for (
    const evidence
    of request.evidence
  ) {
    if (
      observedIds.has(
        evidence.id,
      )
    ) {
      errors.push(
        `A evidência "${evidence.id}" está duplicada no lote.`,
      )
    }

    observedIds.add(
      evidence.id,
    )
  }

  return uniqueStrings(
    errors,
  )
}

async function mapWithConcurrency<TInput, TOutput>({
  values,
  concurrency,
  handler,
}: {
  values:
    TInput[]

  concurrency:
    number

  handler:
    (
      value:
        TInput,

      index:
        number,
    ) => Promise<TOutput>
}): Promise<TOutput[]> {
  const results:
    TOutput[] =
      new Array(
        values.length,
      )

  let nextIndex =
    0

  async function worker():
    Promise<void> {
    while (
      true
    ) {
      const currentIndex =
        nextIndex

      nextIndex +=
        1

      if (
        currentIndex >=
        values.length
      ) {
        return
      }

      results[
        currentIndex
      ] =
        await handler(
          values[
            currentIndex
          ],
          currentIndex,
        )
    }
  }

  const workers =
    Array.from(
      {
        length:
          Math.min(
            concurrency,
            values.length,
          ),
      },
      () =>
        worker(),
    )

  await Promise.all(
    workers,
  )

  return results
}

async function processEvidenceItem({
  evidence,
  options,
}: {
  evidence:
    EducationalEvidence

  options:
    EvidenceProcessingOptions
}): Promise<EvidenceBatchItemResult> {
  const startedAt =
    Date.now()

  try {
    const evaluation =
      evaluateEducationalEvidence({
        evidence,
        options,
      })

    return {
      evidenceId:
        evidence.id,

      status:
        evaluation.success
          ? 'processed'
          : 'failed',

      evidence:
        evaluation.evidence,

      validation: {
        valid:
          evaluation.errors.length ===
          0,

        evidenceId:
          evidence.id,

        issues:
          [],

        errors:
          evaluation.errors,

        warnings:
          evaluation.warnings,

        requiresHumanReview:
          evaluation.requiresHumanReview,
      },

      warnings:
        evaluation.warnings,

      errors:
        evaluation.errors,

      requiresHumanReview:
        evaluation.requiresHumanReview,

      processingTimeMs:
        Date.now() -
        startedAt,
    }
  } catch (
    error
  ) {
    return {
      evidenceId:
        evidence.id,

      status:
        'failed',

      evidence:
        null,

      validation:
        null,

      warnings:
        [],

      errors: [
        error instanceof Error
          ? error.message
          : 'Erro inesperado ao processar a evidência.',
      ],

      requiresHumanReview:
        true,

      processingTimeMs:
        Date.now() -
        startedAt,
    }
  }
}

function createKnowledgeGraphLinks(
  evidence:
    EducationalEvidence[],
): EvidenceKnowledgeGraphLink[] {
  return evidence.map(
    item => ({
      evidenceId:
        item.id,

      nodeId:
        item.knowledgeGraphNodeId,

      edgeIds:
        item.knowledgeGraphEdgeIds,

      success:
        Boolean(
          item.knowledgeGraphNodeId ||
          item.knowledgeGraphEdgeIds.length >
          0,
        ),

      warnings:
        item.knowledgeGraphNodeId ||
        item.knowledgeGraphEdgeIds.length >
        0
          ? []
          : [
              'A evidência ainda não possui vínculo com o Knowledge Graph.',
            ],

      errors:
        [],

      metadata: {
        generatedBy:
          'evidence-batch-processing',

        generatedAt:
          nowIso(),
      },
    }),
  )
}

function createEmptyMetrics({
  requestId,
  totalEvidenceCount,
  startedAt,
}: {
  requestId:
    string

  totalEvidenceCount:
    number

  startedAt:
    string
}): EvidenceBatchProcessingMetrics {
  return {
    requestId,

    status:
      'pending',

    totalEvidenceCount,

    processedEvidenceCount:
      0,

    successfulEvidenceCount:
      0,

    failedEvidenceCount:
      0,

    skippedEvidenceCount:
      0,

    validationErrorCount:
      0,

    warningCount:
      0,

    contradictionCount:
      0,

    consolidationCount:
      0,

    knowledgeGraphLinkCount:
      0,

    startedAt,

    completedAt:
      null,

    durationMs:
      null,

    stages:
      [],
  }
}

export async function processEvidenceBatch({
  request,
  configuration,
}: {
  request:
    EvidenceProcessingRequest

  configuration?:
    Partial<EvidenceBatchProcessingConfiguration>
}): Promise<EvidenceBatchProcessingExecution> {
  const startedAt =
    nowIso()

  const normalizedConfiguration =
    normalizeConfiguration(
      configuration,
    )

  const options =
    mergeProcessingOptions(
      request.options,
    )

  const metrics =
    createEmptyMetrics({
      requestId:
        request.requestId,

      totalEvidenceCount:
        request.evidence.length,

      startedAt,
    })

  metrics.status =
    'processing'

  const requestErrors =
    validateProcessingRequest(
      request,
      normalizedConfiguration,
    )

  if (
    requestErrors.length >
    0
  ) {
    const completedAt =
      nowIso()

    metrics.status =
      'failed'

    metrics.completedAt =
      completedAt

    metrics.durationMs =
      Math.max(
        0,
        Date.parse(
          completedAt,
        ) -
        Date.parse(
          startedAt,
        ),
      )

    return {
      status:
        'failed',

      metrics,

      items:
        [],

      result: {
        success:
          false,

        requestId:
          request.requestId,

        evidence:
          [],

        validationResults:
          [],

        consolidations:
          [],

        contradictions:
          [],

        knowledgeGraphLinks:
          [],

        warnings:
          [],

        errors:
          requestErrors,

        requiresHumanReview:
          true,

        processedAt:
          completedAt,

        processingVersion:
          EVIDENCE_INTELLIGENCE_CONTRACT_VERSION,
      },
    }
  }

  const evidenceStageStartedAt =
    nowIso()

  const items =
    await mapWithConcurrency({
      values:
        request.evidence,

      concurrency:
        normalizedConfiguration.concurrency,

      handler:
        async evidence =>
          processEvidenceItem({
            evidence,
            options,
          }),
    })

  const evidenceStageCompletedAt =
    nowIso()

  const successfulItems =
    items.filter(
      item =>
        item.status ===
        'processed' &&
        item.evidence !==
        null,
    )

  const failedItems =
    items.filter(
      item =>
        item.status ===
        'failed',
    )

  const skippedItems =
    items.filter(
      item =>
        item.status ===
        'skipped',
    )

  metrics.stages.push(
    createStageMetric({
      stage:
        'validation',

      startedAt:
        evidenceStageStartedAt,

      completedAt:
        evidenceStageCompletedAt,

      processedCount:
        items.length,

      successCount:
        successfulItems.length,

      failureCount:
        failedItems.length,

      warningCount:
        items.reduce(
          (
            total,
            item,
          ) =>
            total +
            item.warnings.length,
          0,
        ),
    }),
  )

  if (
    failedItems.length >
      0 &&
    (
      normalizedConfiguration
        .stopOnFirstError ||
      !normalizedConfiguration
        .continueOnItemFailure
    )
  ) {
    const completedAt =
      nowIso()

    metrics.status =
      'failed'

    metrics.processedEvidenceCount =
      items.length

    metrics.successfulEvidenceCount =
      successfulItems.length

    metrics.failedEvidenceCount =
      failedItems.length

    metrics.skippedEvidenceCount =
      skippedItems.length

    metrics.warningCount =
      items.reduce(
        (
          total,
          item,
        ) =>
          total +
          item.warnings.length,
        0,
      )

    metrics.validationErrorCount =
      items.reduce(
        (
          total,
          item,
        ) =>
          total +
          item.errors.length,
        0,
      )

    metrics.completedAt =
      completedAt

    metrics.durationMs =
      Math.max(
        0,
        Date.parse(
          completedAt,
        ) -
        Date.parse(
          startedAt,
        ),
      )

    return {
      status:
        'failed',

      metrics,

      items,

      result: {
        success:
          false,

        requestId:
          request.requestId,

        evidence:
          successfulItems
            .map(
              item =>
                item.evidence,
            )
            .filter(
              (
                evidence,
              ): evidence is EducationalEvidence =>
                evidence !==
                null,
            ),

        validationResults:
          items
            .map(
              item =>
                item.validation,
            )
            .filter(
              (
                validation,
              ): validation is EvidenceValidationResult =>
                validation !==
                null,
            ),

        consolidations:
          [],

        contradictions:
          [],

        knowledgeGraphLinks:
          [],

        warnings:
          uniqueStrings(
            items.flatMap(
              item =>
                item.warnings,
            ),
          ),

        errors:
          uniqueStrings(
            items.flatMap(
              item =>
                item.errors,
            ),
          ),

        requiresHumanReview:
          true,

        processedAt:
          completedAt,

        processingVersion:
          EVIDENCE_INTELLIGENCE_CONTRACT_VERSION,
      },
    }
  }

  const processedEvidence =
    successfulItems
      .map(
        item =>
          item.evidence,
      )
      .filter(
        (
          evidence,
        ): evidence is EducationalEvidence =>
          evidence !==
          null,
      )

  let contradictionResult:
    EvidenceContradictionDetectionResult = {
    success:
      true,

    contradictions:
      [],

    analyzedEvidenceCount:
      0,

    analyzedPairCount:
      0,

    warnings:
      [],

    errors:
      [],

    requiresHumanReview:
      false,
  }

  if (
    options.detectContradictions
  ) {
    const contradictionStageStartedAt =
      nowIso()

    contradictionResult =
      detectEvidenceContradictions({
        evidence:
          processedEvidence,
      })

    const contradictionStageCompletedAt =
      nowIso()

    metrics.stages.push(
      createStageMetric({
        stage:
          'contradictions',

        startedAt:
          contradictionStageStartedAt,

        completedAt:
          contradictionStageCompletedAt,

        processedCount:
          contradictionResult
            .analyzedEvidenceCount,

        successCount:
          contradictionResult.success
            ? contradictionResult
                .analyzedEvidenceCount
            : 0,

        failureCount:
          contradictionResult.errors.length,

        warningCount:
          contradictionResult.warnings.length,
      }),
    )
  }

  let consolidationResult:
    EvidenceBatchConsolidationResult = {
    success:
      true,

    results:
      [],

    executions:
      [],

    warnings:
      [],

    errors:
      [],

    requiresHumanReview:
      false,
  }

  if (
    options.consolidate &&
    request.consolidationGroups.length >
      0
  ) {
    const consolidationStageStartedAt =
      nowIso()

    consolidationResult =
      consolidateEvidenceBatch({
        groups:
          request.consolidationGroups,

        evidence:
          processedEvidence,
      })

    const consolidationStageCompletedAt =
      nowIso()

    metrics.stages.push(
      createStageMetric({
        stage:
          'consolidation',

        startedAt:
          consolidationStageStartedAt,

        completedAt:
          consolidationStageCompletedAt,

        processedCount:
          request
            .consolidationGroups
            .length,

        successCount:
          consolidationResult
            .results
            .length,

        failureCount:
          consolidationResult
            .executions
            .filter(
              execution =>
                !execution.success,
            )
            .length,

        warningCount:
          consolidationResult
            .warnings
            .length,
      }),
    )
  }

  let knowledgeGraphLinks:
    EvidenceKnowledgeGraphLink[] =
      []

  if (
    options.linkKnowledgeGraph &&
    normalizedConfiguration
      .generateKnowledgeGraphLinks
  ) {
    const knowledgeGraphStageStartedAt =
      nowIso()

    knowledgeGraphLinks =
      createKnowledgeGraphLinks(
        processedEvidence,
      )

    const knowledgeGraphStageCompletedAt =
      nowIso()

    metrics.stages.push(
      createStageMetric({
        stage:
          'knowledge_graph',

        startedAt:
          knowledgeGraphStageStartedAt,

        completedAt:
          knowledgeGraphStageCompletedAt,

        processedCount:
          processedEvidence.length,

        successCount:
          knowledgeGraphLinks.filter(
            link =>
              link.success,
          ).length,

        failureCount:
          knowledgeGraphLinks.filter(
            link =>
              !link.success,
          ).length,

        warningCount:
          knowledgeGraphLinks.reduce(
            (
              total,
              link,
            ) =>
              total +
              link.warnings.length,
            0,
          ),
      }),
    )
  }

  const validationResults =
    items
      .map(
        item =>
          item.validation,
      )
      .filter(
        (
          validation,
        ): validation is EvidenceValidationResult =>
          validation !==
          null,
      )

  const contradictions:
    EvidenceContradiction[] =
      contradictionResult
        .contradictions

  const consolidations:
    EvidenceConsolidatedResult[] =
      consolidationResult.results

  const warnings =
    uniqueStrings([
      ...items.flatMap(
        item =>
          item.warnings,
      ),

      ...contradictionResult
        .warnings,

      ...consolidationResult
        .warnings,

      ...knowledgeGraphLinks.flatMap(
        link =>
          link.warnings,
      ),
    ])

  const errors =
    uniqueStrings([
      ...items.flatMap(
        item =>
          item.errors,
      ),

      ...contradictionResult
        .errors,

      ...consolidationResult
        .errors,

      ...knowledgeGraphLinks.flatMap(
        link =>
          link.errors,
      ),
    ])

  const requiresHumanReview =
    items.some(
      item =>
        item.requiresHumanReview,
    ) ||
    contradictionResult
      .requiresHumanReview ||
    consolidationResult
      .requiresHumanReview ||
    contradictions.some(
      contradiction =>
        contradiction
          .requiresHumanReview,
    ) ||
    consolidations.some(
      consolidation =>
        consolidation
          .requiresHumanReview,
    )

  const completedAt =
    nowIso()

  const status:
    EvidenceBatchProcessingStatus =
      errors.length >
        0
        ? successfulItems.length >
            0
          ? 'completed_with_warnings'
          : 'failed'
        : warnings.length >
            0
          ? 'completed_with_warnings'
          : 'completed'

  metrics.status =
    status

  metrics.processedEvidenceCount =
    items.length

  metrics.successfulEvidenceCount =
    successfulItems.length

  metrics.failedEvidenceCount =
    failedItems.length

  metrics.skippedEvidenceCount =
    skippedItems.length

  metrics.validationErrorCount =
    validationResults.reduce(
      (
        total,
        validation,
      ) =>
        total +
        validation.errors.length,
      0,
    )

  metrics.warningCount =
    warnings.length

  metrics.contradictionCount =
    contradictions.length

  metrics.consolidationCount =
    consolidations.length

  metrics.knowledgeGraphLinkCount =
    knowledgeGraphLinks.filter(
      link =>
        link.success,
    ).length

  metrics.completedAt =
    completedAt

  metrics.durationMs =
    Math.max(
      0,
      Date.parse(
        completedAt,
      ) -
      Date.parse(
        startedAt,
      ),
    )

  const result:
    EvidenceProcessingResult = {
    success:
      status ===
        'completed' ||
      status ===
        'completed_with_warnings',

    requestId:
      request.requestId,

    evidence:
      processedEvidence,

    validationResults,

    consolidations,

    contradictions,

    knowledgeGraphLinks,

    warnings,

    errors,

    requiresHumanReview,

    processedAt:
      completedAt,

    processingVersion:
      EVIDENCE_INTELLIGENCE_CONTRACT_VERSION,
  }

  return {
    result,
    status,
    metrics,
    items,
  }
}

export function createEvidenceProcessingRequest({
  requestId,
  evidence,
  requestedBy = null,
  options,
}: {
  requestId:
    string

  evidence:
    EducationalEvidence[]

  requestedBy?:
    string | null

  options?:
    Partial<EvidenceProcessingOptions>
}): EvidenceProcessingRequest {
  const defaultOptions =
    createDefaultEvidenceProcessingOptions()

  return {
    requestId,

    evidence,

    consolidationGroups:
      [],

    options: {
      ...defaultOptions,
      ...options,

      metadata: {
        ...defaultOptions.metadata,
        ...options?.metadata,
      },
    },

    requestedBy,

    requestedAt:
      nowIso(),

    metadata: {
      createdBy:
        'evidence-batch-processing',

      contractVersion:
        EVIDENCE_INTELLIGENCE_CONTRACT_VERSION,
    },
  }
}

export function createDefaultEvidenceBatchConfiguration():
  EvidenceBatchProcessingConfiguration {
  return {
    ...DEFAULT_CONFIGURATION,
  }
}

export const evidenceBatchProcessingService = {
  process:
    processEvidenceBatch,

  createRequest:
    createEvidenceProcessingRequest,

  createDefaultConfiguration:
    createDefaultEvidenceBatchConfiguration,
}