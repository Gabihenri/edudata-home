import {
  createClient,
  type SupabaseClient,
} from '@supabase/supabase-js'

export type EvidenceIntelligenceRunStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'requires_human_review'
  | 'failed'
  | 'cancelled'
  | 'ignored'

export type EvidenceIntelligenceHumanReviewStatus =
  | 'not_required'
  | 'pending'
  | 'in_review'
  | 'approved'
  | 'rejected'
  | 'changes_requested'

export type EvidenceIntelligenceJsonObject =
  Record<string, unknown>

export type EvidenceIntelligenceJsonArray =
  unknown[]

export type EvidenceIntelligenceRun = {
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
    EvidenceIntelligenceRunStatus

  quality_score:
    number | null

  reliability_score:
    number | null

  confidence_score:
    number | null

  quality:
    EvidenceIntelligenceJsonObject

  reliability:
    EvidenceIntelligenceJsonObject

  framework_classifications:
    EvidenceIntelligenceJsonArray

  validation:
    EvidenceIntelligenceJsonObject

  explanation:
    EvidenceIntelligenceJsonObject

  requires_human_review:
    boolean

  human_review_status:
    EvidenceIntelligenceHumanReviewStatus

  human_reviewed_at:
    string | null

  human_reviewed_by:
    string | null

  human_review_notes:
    string | null

  warnings:
    EvidenceIntelligenceJsonArray

  errors:
    EvidenceIntelligenceJsonArray

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
    EvidenceIntelligenceJsonObject

  created_at:
    string

  updated_at:
    string
}

export type CreateEvidenceIntelligenceRunInput = {
  evidence_id:
    string

  event_id?:
    string | null

  idempotency_key:
    string

  engine_name?:
    string

  engine_version:
    string

  contract_version?:
    string | null

  processing_source?:
    string

  processing_status?:
    EvidenceIntelligenceRunStatus

  quality_score?:
    number | null

  reliability_score?:
    number | null

  confidence_score?:
    number | null

  quality?:
    EvidenceIntelligenceJsonObject

  reliability?:
    EvidenceIntelligenceJsonObject

  framework_classifications?:
    EvidenceIntelligenceJsonArray

  validation?:
    EvidenceIntelligenceJsonObject

  explanation?:
    EvidenceIntelligenceJsonObject

  requires_human_review?:
    boolean

  human_review_status?:
    EvidenceIntelligenceHumanReviewStatus

  human_reviewed_at?:
    string | null

  human_reviewed_by?:
    string | null

  human_review_notes?:
    string | null

  warnings?:
    EvidenceIntelligenceJsonArray

  errors?:
    EvidenceIntelligenceJsonArray

  attempt_count?:
    number

  correlation_id?:
    string | null

  causation_id?:
    string | null

  parent_event_id?:
    string | null

  trace_id?:
    string | null

  requested_by?:
    string | null

  started_at?:
    string

  processed_at?:
    string | null

  failed_at?:
    string | null

  last_error?:
    string | null

  metadata?:
    EvidenceIntelligenceJsonObject
}

export type UpdateEvidenceIntelligenceRunInput =
  Partial<
    Omit<
      CreateEvidenceIntelligenceRunInput,
      | 'evidence_id'
      | 'idempotency_key'
    >
  >

export type EvidenceIntelligenceRunQueryOptions = {
  evidenceId?:
    string | null

  eventId?:
    string | null

  userId?:
    string | null

  organizationId?:
    string | null

  schoolId?:
    string | null

  processingStatus?:
    EvidenceIntelligenceRunStatus | null

  humanReviewStatus?:
    EvidenceIntelligenceHumanReviewStatus | null

  requiresHumanReview?:
    boolean | null

  engineName?:
    string | null

  limit?:
    number
}

const TABLE_NAME =
  'agenda_evidence_intelligence_runs'

const DEFAULT_ENGINE_NAME =
  'evidence-intelligence'

const DEFAULT_PROCESSING_SOURCE =
  'agenda-evidence-created-event'

function createLegacyServerClient():
  SupabaseClient {
  const url =
    process.env
      .NEXT_PUBLIC_SUPABASE_URL

  const key =
    process.env
      .SUPABASE_SERVICE_ROLE_KEY ??
    process.env
      .NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (
    !url ||
    !key
  ) {
    throw new Error(
      'Variáveis do Supabase não configuradas.',
    )
  }

  return createClient(
    url,
    key,
    {
      auth: {
        persistSession:
          false,

        autoRefreshToken:
          false,

        detectSessionInUrl:
          false,
      },
    },
  )
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
): string | null | undefined {
  if (
    value === undefined
  ) {
    return undefined
  }

  if (
    value === null
  ) {
    return null
  }

  return value.trim() ||
    null
}

function normalizeScore(
  value:
    number | null | undefined,
  fieldName:
    string,
): number | null | undefined {
  if (
    value === undefined ||
    value === null
  ) {
    return value
  }

  if (
    !Number.isFinite(
      value,
    ) ||
    value < 0 ||
    value > 1
  ) {
    throw new Error(
      `${fieldName} deve estar entre 0 e 1.`,
    )
  }

  return value
}

function normalizeAttemptCount(
  value:
    number | undefined,
): number | undefined {
  if (
    value === undefined
  ) {
    return undefined
  }

  if (
    !Number.isInteger(
      value,
    ) ||
    value < 1
  ) {
    throw new Error(
      'A quantidade de tentativas deve ser um número inteiro maior ou igual a 1.',
    )
  }

  return value
}

function normalizeLimit(
  value:
    number | undefined,
): number {
  if (
    value === undefined
  ) {
    return 100
  }

  if (
    !Number.isInteger(
      value,
    ) ||
    value < 1
  ) {
    throw new Error(
      'O limite de resultados deve ser um número inteiro positivo.',
    )
  }

  return Math.min(
    value,
    500,
  )
}

function assignIfDefined(
  payload:
    Record<string, unknown>,
  key:
    string,
  value:
    unknown,
): void {
  if (
    value !== undefined
  ) {
    payload[key] =
      value
  }
}

function buildCreatePayload(
  input:
    CreateEvidenceIntelligenceRunInput,
): Record<string, unknown> {
  return {
    evidence_id:
      normalizeRequiredText(
        input.evidence_id,
        'ID da evidência',
      ),

    event_id:
      normalizeOptionalText(
        input.event_id,
      ) ??
      null,

    idempotency_key:
      normalizeRequiredText(
        input.idempotency_key,
        'Chave de idempotência',
      ),

    engine_name:
      normalizeOptionalText(
        input.engine_name,
      ) ??
      DEFAULT_ENGINE_NAME,

    engine_version:
      normalizeRequiredText(
        input.engine_version,
        'Versão do motor',
      ),

    contract_version:
      normalizeOptionalText(
        input.contract_version,
      ) ??
      null,

    processing_source:
      normalizeOptionalText(
        input.processing_source,
      ) ??
      DEFAULT_PROCESSING_SOURCE,

    processing_status:
      input.processing_status ??
      'pending',

    quality_score:
      normalizeScore(
        input.quality_score,
        'Pontuação de qualidade',
      ) ??
      null,

    reliability_score:
      normalizeScore(
        input.reliability_score,
        'Pontuação de confiabilidade',
      ) ??
      null,

    confidence_score:
      normalizeScore(
        input.confidence_score,
        'Pontuação de confiança',
      ) ??
      null,

    quality:
      input.quality ??
      {},

    reliability:
      input.reliability ??
      {},

    framework_classifications:
      input.framework_classifications ??
      [],

    validation:
      input.validation ??
      {},

    explanation:
      input.explanation ??
      {},

    requires_human_review:
      input.requires_human_review ??
      false,

    human_review_status:
      input.human_review_status ??
      'not_required',

    human_reviewed_at:
      input.human_reviewed_at ??
      null,

    human_reviewed_by:
      normalizeOptionalText(
        input.human_reviewed_by,
      ) ??
      null,

    human_review_notes:
      normalizeOptionalText(
        input.human_review_notes,
      ) ??
      null,

    warnings:
      input.warnings ??
      [],

    errors:
      input.errors ??
      [],

    attempt_count:
      normalizeAttemptCount(
        input.attempt_count,
      ) ??
      1,

    correlation_id:
      normalizeOptionalText(
        input.correlation_id,
      ) ??
      null,

    causation_id:
      normalizeOptionalText(
        input.causation_id,
      ) ??
      null,

    parent_event_id:
      normalizeOptionalText(
        input.parent_event_id,
      ) ??
      null,

    trace_id:
      normalizeOptionalText(
        input.trace_id,
      ) ??
      null,

    requested_by:
      normalizeOptionalText(
        input.requested_by,
      ) ??
      null,

    started_at:
      input.started_at ??
      new Date()
        .toISOString(),

    processed_at:
      input.processed_at ??
      null,

    failed_at:
      input.failed_at ??
      null,

    last_error:
      normalizeOptionalText(
        input.last_error,
      ) ??
      null,

    metadata:
      input.metadata ??
      {},
  }
}

function buildUpdatePayload(
  input:
    UpdateEvidenceIntelligenceRunInput,
): Record<string, unknown> {
  const payload:
    Record<string, unknown> = {
    updated_at:
      new Date()
        .toISOString(),
  }

  assignIfDefined(
    payload,
    'event_id',
    normalizeOptionalText(
      input.event_id,
    ),
  )

  assignIfDefined(
    payload,
    'engine_name',
    normalizeOptionalText(
      input.engine_name,
    ),
  )

  assignIfDefined(
    payload,
    'engine_version',
    normalizeOptionalText(
      input.engine_version,
    ),
  )

  assignIfDefined(
    payload,
    'contract_version',
    normalizeOptionalText(
      input.contract_version,
    ),
  )

  assignIfDefined(
    payload,
    'processing_source',
    normalizeOptionalText(
      input.processing_source,
    ),
  )

  assignIfDefined(
    payload,
    'processing_status',
    input.processing_status,
  )

  assignIfDefined(
    payload,
    'quality_score',
    normalizeScore(
      input.quality_score,
      'Pontuação de qualidade',
    ),
  )

  assignIfDefined(
    payload,
    'reliability_score',
    normalizeScore(
      input.reliability_score,
      'Pontuação de confiabilidade',
    ),
  )

  assignIfDefined(
    payload,
    'confidence_score',
    normalizeScore(
      input.confidence_score,
      'Pontuação de confiança',
    ),
  )

  assignIfDefined(
    payload,
    'quality',
    input.quality,
  )

  assignIfDefined(
    payload,
    'reliability',
    input.reliability,
  )

  assignIfDefined(
    payload,
    'framework_classifications',
    input.framework_classifications,
  )

  assignIfDefined(
    payload,
    'validation',
    input.validation,
  )

  assignIfDefined(
    payload,
    'explanation',
    input.explanation,
  )

  assignIfDefined(
    payload,
    'requires_human_review',
    input.requires_human_review,
  )

  assignIfDefined(
    payload,
    'human_review_status',
    input.human_review_status,
  )

  assignIfDefined(
    payload,
    'human_reviewed_at',
    input.human_reviewed_at,
  )

  assignIfDefined(
    payload,
    'human_reviewed_by',
    normalizeOptionalText(
      input.human_reviewed_by,
    ),
  )

  assignIfDefined(
    payload,
    'human_review_notes',
    normalizeOptionalText(
      input.human_review_notes,
    ),
  )

  assignIfDefined(
    payload,
    'warnings',
    input.warnings,
  )

  assignIfDefined(
    payload,
    'errors',
    input.errors,
  )

  assignIfDefined(
    payload,
    'attempt_count',
    normalizeAttemptCount(
      input.attempt_count,
    ),
  )

  assignIfDefined(
    payload,
    'correlation_id',
    normalizeOptionalText(
      input.correlation_id,
    ),
  )

  assignIfDefined(
    payload,
    'causation_id',
    normalizeOptionalText(
      input.causation_id,
    ),
  )

  assignIfDefined(
    payload,
    'parent_event_id',
    normalizeOptionalText(
      input.parent_event_id,
    ),
  )

  assignIfDefined(
    payload,
    'trace_id',
    normalizeOptionalText(
      input.trace_id,
    ),
  )

  assignIfDefined(
    payload,
    'requested_by',
    normalizeOptionalText(
      input.requested_by,
    ),
  )

  assignIfDefined(
    payload,
    'started_at',
    input.started_at,
  )

  assignIfDefined(
    payload,
    'processed_at',
    input.processed_at,
  )

  assignIfDefined(
    payload,
    'failed_at',
    input.failed_at,
  )

  assignIfDefined(
    payload,
    'last_error',
    normalizeOptionalText(
      input.last_error,
    ),
  )

  assignIfDefined(
    payload,
    'metadata',
    input.metadata,
  )

  return payload
}

function normalizeRun(
  value:
    unknown,
): EvidenceIntelligenceRun {
  return value as
    EvidenceIntelligenceRun
}

export class EvidenceIntelligenceRunsRepository {
  private readonly injectedClient:
    SupabaseClient | null

  constructor(
    client?:
      SupabaseClient,
  ) {
    this.injectedClient =
      client ??
      null
  }

  private get client():
    SupabaseClient {
    /*
     * APIs autenticadas devem injetar o cliente do usuário,
     * preservando as políticas RLS.
     *
     * Fluxos internos do EIOS podem utilizar o cliente
     * de servidor enquanto a persistência assíncrona
     * e o padrão Outbox ainda não estiverem concluídos.
     */
    return (
      this.injectedClient ??
      createLegacyServerClient()
    )
  }

  async create(
    input:
      CreateEvidenceIntelligenceRunInput,
  ): Promise<
    EvidenceIntelligenceRun
  > {
    const payload =
      buildCreatePayload(
        input,
      )

    const {
      data,
      error,
    } =
      await this.client
        .from(
          TABLE_NAME,
        )
        .insert(
          payload,
        )
        .select('*')
        .single()

    if (error) {
      throw new Error(
        `Não foi possível criar a execução do Evidence Intelligence: ${error.message}`,
      )
    }

    return normalizeRun(
      data,
    )
  }

  async update(
    id:
      string,
    input:
      UpdateEvidenceIntelligenceRunInput,
  ): Promise<
    EvidenceIntelligenceRun
  > {
    const normalizedId =
      normalizeRequiredText(
        id,
        'ID da execução',
      )

    const payload =
      buildUpdatePayload(
        input,
      )

    const {
      data,
      error,
    } =
      await this.client
        .from(
          TABLE_NAME,
        )
        .update(
          payload,
        )
        .eq(
          'id',
          normalizedId,
        )
        .select('*')
        .single()

    if (error) {
      throw new Error(
        `Não foi possível atualizar a execução do Evidence Intelligence: ${error.message}`,
      )
    }

    return normalizeRun(
      data,
    )
  }

  async findById(
    id:
      string,
  ): Promise<
    EvidenceIntelligenceRun | null
  > {
    const normalizedId =
      normalizeRequiredText(
        id,
        'ID da execução',
      )

    const {
      data,
      error,
    } =
      await this.client
        .from(
          TABLE_NAME,
        )
        .select('*')
        .eq(
          'id',
          normalizedId,
        )
        .maybeSingle()

    if (error) {
      throw new Error(
        `Não foi possível consultar a execução do Evidence Intelligence: ${error.message}`,
      )
    }

    return data
      ? normalizeRun(
          data,
        )
      : null
  }

  async findByIdempotencyKey(
    idempotencyKey:
      string,
  ): Promise<
    EvidenceIntelligenceRun | null
  > {
    const normalizedKey =
      normalizeRequiredText(
        idempotencyKey,
        'Chave de idempotência',
      )

    const {
      data,
      error,
    } =
      await this.client
        .from(
          TABLE_NAME,
        )
        .select('*')
        .eq(
          'idempotency_key',
          normalizedKey,
        )
        .maybeSingle()

    if (error) {
      throw new Error(
        `Não foi possível consultar a execução pela chave de idempotência: ${error.message}`,
      )
    }

    return data
      ? normalizeRun(
          data,
        )
      : null
  }

  async existsByIdempotencyKey(
    idempotencyKey:
      string,
  ): Promise<boolean> {
    const run =
      await this
        .findByIdempotencyKey(
          idempotencyKey,
        )

    return run !==
      null
  }

  async findByEventId(
    eventId:
      string,
  ): Promise<
    EvidenceIntelligenceRun[]
  > {
    const normalizedEventId =
      normalizeRequiredText(
        eventId,
        'ID do evento',
      )

    const {
      data,
      error,
    } =
      await this.client
        .from(
          TABLE_NAME,
        )
        .select('*')
        .eq(
          'event_id',
          normalizedEventId,
        )
        .order(
          'created_at',
          {
            ascending:
              false,
          },
        )

    if (error) {
      throw new Error(
        `Não foi possível consultar as execuções pelo evento: ${error.message}`,
      )
    }

    return (
      data ??
      []
    ).map(
      normalizeRun,
    )
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
    const normalizedEvidenceId =
      normalizeRequiredText(
        evidenceId,
        'ID da evidência',
      )

    const limit =
      normalizeLimit(
        options.limit,
      )

    const {
      data,
      error,
    } =
      await this.client
        .from(
          TABLE_NAME,
        )
        .select('*')
        .eq(
          'evidence_id',
          normalizedEvidenceId,
        )
        .order(
          'created_at',
          {
            ascending:
              false,
          },
        )
        .limit(
          limit,
        )

    if (error) {
      throw new Error(
        `Não foi possível consultar o histórico inteligente da evidência: ${error.message}`,
      )
    }

    return (
      data ??
      []
    ).map(
      normalizeRun,
    )
  }

  async findLatestByEvidenceId(
    evidenceId:
      string,
  ): Promise<
    EvidenceIntelligenceRun | null
  > {
    const normalizedEvidenceId =
      normalizeRequiredText(
        evidenceId,
        'ID da evidência',
      )

    const {
      data,
      error,
    } =
      await this.client
        .from(
          TABLE_NAME,
        )
        .select('*')
        .eq(
          'evidence_id',
          normalizedEvidenceId,
        )
        .order(
          'created_at',
          {
            ascending:
              false,
          },
        )
        .limit(
          1,
        )
        .maybeSingle()

    if (error) {
      throw new Error(
        `Não foi possível consultar a última análise da evidência: ${error.message}`,
      )
    }

    return data
      ? normalizeRun(
          data,
        )
      : null
  }

  async findAll(
    options:
      EvidenceIntelligenceRunQueryOptions = {},
  ): Promise<
    EvidenceIntelligenceRun[]
  > {
    let query =
      this.client
        .from(
          TABLE_NAME,
        )
        .select('*')

    if (
      options.evidenceId
    ) {
      query =
        query.eq(
          'evidence_id',
          options.evidenceId,
        )
    }

    if (
      options.eventId
    ) {
      query =
        query.eq(
          'event_id',
          options.eventId,
        )
    }

    if (
      options.userId
    ) {
      query =
        query.eq(
          'user_id',
          options.userId,
        )
    }

    if (
      options.organizationId
    ) {
      query =
        query.eq(
          'organization_id',
          options.organizationId,
        )
    }

    if (
      options.schoolId
    ) {
      query =
        query.eq(
          'school_id',
          options.schoolId,
        )
    }

    if (
      options.processingStatus
    ) {
      query =
        query.eq(
          'processing_status',
          options.processingStatus,
        )
    }

    if (
      options.humanReviewStatus
    ) {
      query =
        query.eq(
          'human_review_status',
          options.humanReviewStatus,
        )
    }

    if (
      typeof
        options.requiresHumanReview ===
      'boolean'
    ) {
      query =
        query.eq(
          'requires_human_review',
          options.requiresHumanReview,
        )
    }

    if (
      options.engineName
    ) {
      query =
        query.eq(
          'engine_name',
          options.engineName,
        )
    }

    const {
      data,
      error,
    } =
      await query
        .order(
          'created_at',
          {
            ascending:
              false,
          },
        )
        .limit(
          normalizeLimit(
            options.limit,
          ),
        )

    if (error) {
      throw new Error(
        `Não foi possível consultar as execuções do Evidence Intelligence: ${error.message}`,
      )
    }

    return (
      data ??
      []
    ).map(
      normalizeRun,
    )
  }
}

export const evidenceIntelligenceRunsRepository =
  new EvidenceIntelligenceRunsRepository()