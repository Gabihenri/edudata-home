import {
  EvidenceIntelligenceRunsRepository,
  evidenceIntelligenceRunsRepository,
  type CreateEvidenceIntelligenceRunInput,
  type EvidenceIntelligenceHumanReviewStatus,
  type EvidenceIntelligenceJsonArray,
  type EvidenceIntelligenceJsonObject,
  type EvidenceIntelligenceRun,
  type EvidenceIntelligenceRunQueryOptions,
} from '@/lib/agenda/repository/evidence-intelligence-runs.repository'

export type StartEvidenceIntelligenceRunInput = {
  evidenceId:
    string

  eventId?:
    string | null

  idempotencyKey:
    string

  engineName?:
    string

  engineVersion:
    string

  contractVersion?:
    string | null

  processingSource?:
    string

  requestedBy?:
    string | null

  correlationId?:
    string | null

  causationId?:
    string | null

  parentEventId?:
    string | null

  traceId?:
    string | null

  metadata?:
    EvidenceIntelligenceJsonObject
}

export type CompleteEvidenceIntelligenceRunInput = {
  qualityScore?:
    number | null

  reliabilityScore?:
    number | null

  confidenceScore?:
    number | null

  quality?:
    EvidenceIntelligenceJsonObject

  reliability?:
    EvidenceIntelligenceJsonObject

  frameworkClassifications?:
    EvidenceIntelligenceJsonArray

  validation?:
    EvidenceIntelligenceJsonObject

  explanation?:
    EvidenceIntelligenceJsonObject

  warnings?:
    EvidenceIntelligenceJsonArray

  errors?:
    EvidenceIntelligenceJsonArray

  requiresHumanReview?:
    boolean

  metadata?:
    EvidenceIntelligenceJsonObject

  processedAt?:
    string
}

export type FailEvidenceIntelligenceRunInput = {
  error:
    unknown

  errors?:
    EvidenceIntelligenceJsonArray

  warnings?:
    EvidenceIntelligenceJsonArray

  metadata?:
    EvidenceIntelligenceJsonObject

  failedAt?:
    string
}

export type ReviewEvidenceIntelligenceRunInput = {
  status:
    Exclude<
      EvidenceIntelligenceHumanReviewStatus,
      'not_required'
    >

  reviewedBy:
    string

  notes?:
    string | null

  reviewedAt?:
    string

  metadata?:
    EvidenceIntelligenceJsonObject
}

export type StartEvidenceIntelligenceRunResult = {
  run:
    EvidenceIntelligenceRun

  created:
    boolean

  idempotent:
    boolean
}

const DEFAULT_ENGINE_NAME =
  'evidence-intelligence'

const DEFAULT_PROCESSING_SOURCE =
  'agenda-evidence-created-event'

function nowIso(): string {
  return new Date()
    .toISOString()
}

function normalizeRequiredText(
  value:
    string | null | undefined,
  fieldName:
    string,
): string {
  const normalizedValue =
    value?.trim()

  if (!normalizedValue) {
    throw new Error(
      `${fieldName} é obrigatório.`,
    )
  }

  return normalizedValue
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

  return value.trim() ||
    null
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

  return 'Erro inesperado durante o processamento do Evidence Intelligence.'
}

function mergeMetadata(
  current:
    EvidenceIntelligenceJsonObject,
  additional:
    EvidenceIntelligenceJsonObject | undefined,
): EvidenceIntelligenceJsonObject {
  return {
    ...current,
    ...additional,
  }
}

function normalizeCreateInput(
  input:
    StartEvidenceIntelligenceRunInput,
): CreateEvidenceIntelligenceRunInput {
  return {
    evidence_id:
      normalizeRequiredText(
        input.evidenceId,
        'ID da evidência',
      ),

    event_id:
      normalizeOptionalText(
        input.eventId,
      ),

    idempotency_key:
      normalizeRequiredText(
        input.idempotencyKey,
        'Chave de idempotência',
      ),

    engine_name:
      normalizeOptionalText(
        input.engineName,
      ) ??
      DEFAULT_ENGINE_NAME,

    engine_version:
      normalizeRequiredText(
        input.engineVersion,
        'Versão do motor',
      ),

    contract_version:
      normalizeOptionalText(
        input.contractVersion,
      ),

    processing_source:
      normalizeOptionalText(
        input.processingSource,
      ) ??
      DEFAULT_PROCESSING_SOURCE,

    processing_status:
      'pending',

    requires_human_review:
      false,

    human_review_status:
      'not_required',

    requested_by:
      normalizeOptionalText(
        input.requestedBy,
      ),

    correlation_id:
      normalizeOptionalText(
        input.correlationId,
      ),

    causation_id:
      normalizeOptionalText(
        input.causationId,
      ),

    parent_event_id:
      normalizeOptionalText(
        input.parentEventId,
      ),

    trace_id:
      normalizeOptionalText(
        input.traceId,
      ),

    started_at:
      nowIso(),

    metadata: {
      ...input.metadata,

      lifecycle:
        'created',

      lifecycleVersion:
        '1.0.0',

      createdByService:
        'evidence-intelligence-runs-service',
    },
  }
}

export class EvidenceIntelligenceRunsService {
  constructor(
    private readonly repository:
      EvidenceIntelligenceRunsRepository =
      evidenceIntelligenceRunsRepository,
  ) {}

  async start(
    input:
      StartEvidenceIntelligenceRunInput,
  ): Promise<
    StartEvidenceIntelligenceRunResult
  > {
    const idempotencyKey =
      normalizeRequiredText(
        input.idempotencyKey,
        'Chave de idempotência',
      )

    const existingRun =
      await this.repository
        .findByIdempotencyKey(
          idempotencyKey,
        )

    if (existingRun) {
      return {
        run:
          existingRun,

        created:
          false,

        idempotent:
          true,
      }
    }

    const run =
      await this.repository.create(
        normalizeCreateInput(
          input,
        ),
      )

    return {
      run,

      created:
        true,

      idempotent:
        false,
    }
  }

  async markProcessing(
    runId:
      string,
  ): Promise<
    EvidenceIntelligenceRun
  > {
    const run =
      await this.requireById(
        runId,
      )

    if (
      run.processing_status ===
        'completed' ||
      run.processing_status ===
        'requires_human_review' ||
      run.processing_status ===
        'cancelled' ||
      run.processing_status ===
        'ignored'
    ) {
      throw new Error(
        `A execução ${run.id} não pode voltar ao status processing porque está com status ${run.processing_status}.`,
      )
    }

    return this.repository.update(
      run.id,
      {
        processing_status:
          'processing',

        attempt_count:
          run.attempt_count +
          1,

        failed_at:
          null,

        last_error:
          null,

        metadata:
          mergeMetadata(
            run.metadata,
            {
              lifecycle:
                'processing',

              processingStartedAt:
                nowIso(),
            },
          ),
      },
    )
  }

  async complete(
    runId:
      string,
    input:
      CompleteEvidenceIntelligenceRunInput,
  ): Promise<
    EvidenceIntelligenceRun
  > {
    const run =
      await this.requireById(
        runId,
      )

    const requiresHumanReview =
      input.requiresHumanReview ??
      false

    const processingStatus =
      requiresHumanReview
        ? 'requires_human_review'
        : 'completed'

    const humanReviewStatus:
      EvidenceIntelligenceHumanReviewStatus =
      requiresHumanReview
        ? 'pending'
        : 'not_required'

    return this.repository.update(
      run.id,
      {
        processing_status:
          processingStatus,

        quality_score:
          input.qualityScore,

        reliability_score:
          input.reliabilityScore,

        confidence_score:
          input.confidenceScore,

        quality:
          input.quality ??
          {},

        reliability:
          input.reliability ??
          {},

        framework_classifications:
          input.frameworkClassifications ??
          [],

        validation:
          input.validation ??
          {},

        explanation:
          input.explanation ??
          {},

        warnings:
          input.warnings ??
          [],

        errors:
          input.errors ??
          [],

        requires_human_review:
          requiresHumanReview,

        human_review_status:
          humanReviewStatus,

        processed_at:
          input.processedAt ??
          nowIso(),

        failed_at:
          null,

        last_error:
          null,

        metadata:
          mergeMetadata(
            run.metadata,
            {
              ...input.metadata,

              lifecycle:
                processingStatus,

              completedByService:
                'evidence-intelligence-runs-service',
            },
          ),
      },
    )
  }

  async fail(
    runId:
      string,
    input:
      FailEvidenceIntelligenceRunInput,
  ): Promise<
    EvidenceIntelligenceRun
  > {
    const run =
      await this.requireById(
        runId,
      )

    const message =
      getErrorMessage(
        input.error,
      )

    return this.repository.update(
      run.id,
      {
        processing_status:
          'failed',

        errors:
          input.errors ??
          [
            message,
          ],

        warnings:
          input.warnings ??
          run.warnings,

        failed_at:
          input.failedAt ??
          nowIso(),

        last_error:
          message,

        metadata:
          mergeMetadata(
            run.metadata,
            {
              ...input.metadata,

              lifecycle:
                'failed',

              failureRecordedBy:
                'evidence-intelligence-runs-service',
            },
          ),
      },
    )
  }

  async markIgnored({
    runId,
    reason,
    metadata,
  }: {
    runId:
      string

    reason:
      string

    metadata?:
      EvidenceIntelligenceJsonObject
  }): Promise<
    EvidenceIntelligenceRun
  > {
    const run =
      await this.requireById(
        runId,
      )

    const normalizedReason =
      normalizeRequiredText(
        reason,
        'Motivo',
      )

    return this.repository.update(
      run.id,
      {
        processing_status:
          'ignored',

        processed_at:
          nowIso(),

        warnings: [
          ...run.warnings,
          normalizedReason,
        ],

        metadata:
          mergeMetadata(
            run.metadata,
            {
              ...metadata,

              lifecycle:
                'ignored',

              ignoredReason:
                normalizedReason,
            },
          ),
      },
    )
  }

  async cancel({
    runId,
    reason,
    requestedBy,
    metadata,
  }: {
    runId:
      string

    reason:
      string

    requestedBy?:
      string | null

    metadata?:
      EvidenceIntelligenceJsonObject
  }): Promise<
    EvidenceIntelligenceRun
  > {
    const run =
      await this.requireById(
        runId,
      )

    const normalizedReason =
      normalizeRequiredText(
        reason,
        'Motivo do cancelamento',
      )

    return this.repository.update(
      run.id,
      {
        processing_status:
          'cancelled',

        requested_by:
          normalizeOptionalText(
            requestedBy,
          ) ??
          run.requested_by,

        processed_at:
          nowIso(),

        warnings: [
          ...run.warnings,
          normalizedReason,
        ],

        metadata:
          mergeMetadata(
            run.metadata,
            {
              ...metadata,

              lifecycle:
                'cancelled',

              cancellationReason:
                normalizedReason,

              cancelledAt:
                nowIso(),
            },
          ),
      },
    )
  }

  async registerHumanReview({
    runId,
    input,
  }: {
    runId:
      string

    input:
      ReviewEvidenceIntelligenceRunInput
  }): Promise<
    EvidenceIntelligenceRun
  > {
    const run =
      await this.requireById(
        runId,
      )

    if (
      !run.requires_human_review &&
      run.processing_status !==
        'requires_human_review'
    ) {
      throw new Error(
        'Esta execução não está marcada para revisão humana.',
      )
    }

    const reviewedBy =
      normalizeRequiredText(
        input.reviewedBy,
        'ID do responsável pela revisão',
      )

    const reviewCompleted =
      input.status ===
        'approved' ||
      input.status ===
        'rejected' ||
      input.status ===
        'changes_requested'

    return this.repository.update(
      run.id,
      {
        human_review_status:
          input.status,

        human_reviewed_by:
          reviewedBy,

        human_reviewed_at:
          reviewCompleted
            ? input.reviewedAt ??
              nowIso()
            : null,

        human_review_notes:
          normalizeOptionalText(
            input.notes,
          ),

        metadata:
          mergeMetadata(
            run.metadata,
            {
              ...input.metadata,

              lifecycle:
                'human_review',

              humanReviewStatus:
                input.status,

              humanReviewUpdatedAt:
                nowIso(),
            },
          ),
      },
    )
  }

  async findById(
    runId:
      string,
  ): Promise<
    EvidenceIntelligenceRun | null
  > {
    return this.repository.findById(
      normalizeRequiredText(
        runId,
        'ID da execução',
      ),
    )
  }

  async requireById(
    runId:
      string,
  ): Promise<
    EvidenceIntelligenceRun
  > {
    const run =
      await this.findById(
        runId,
      )

    if (!run) {
      throw new Error(
        'Execução do Evidence Intelligence não encontrada.',
      )
    }

    return run
  }

  async findByEvidenceId(
    evidenceId:
      string,
    options: {
      limit?: number
    } = {},
  ): Promise<
    EvidenceIntelligenceRun[]
  > {
    return this.repository
      .findByEvidenceId(
        normalizeRequiredText(
          evidenceId,
          'ID da evidência',
        ),
        options,
      )
  }

  async findLatestByEvidenceId(
    evidenceId:
      string,
  ): Promise<
    EvidenceIntelligenceRun | null
  > {
    return this.repository
      .findLatestByEvidenceId(
        normalizeRequiredText(
          evidenceId,
          'ID da evidência',
        ),
      )
  }

  async findByEventId(
    eventId:
      string,
  ): Promise<
    EvidenceIntelligenceRun[]
  > {
    return this.repository
      .findByEventId(
        normalizeRequiredText(
          eventId,
          'ID do evento',
        ),
      )
  }

  async findByIdempotencyKey(
    idempotencyKey:
      string,
  ): Promise<
    EvidenceIntelligenceRun | null
  > {
    return this.repository
      .findByIdempotencyKey(
        normalizeRequiredText(
          idempotencyKey,
          'Chave de idempotência',
        ),
      )
  }

  async existsByIdempotencyKey(
    idempotencyKey:
      string,
  ): Promise<boolean> {
    return this.repository
      .existsByIdempotencyKey(
        normalizeRequiredText(
          idempotencyKey,
          'Chave de idempotência',
        ),
      )
  }

  async findAll(
    options:
      EvidenceIntelligenceRunQueryOptions = {},
  ): Promise<
    EvidenceIntelligenceRun[]
  > {
    return this.repository.findAll(
      options,
    )
  }
}

export const evidenceIntelligenceRunsService =
  new EvidenceIntelligenceRunsService()