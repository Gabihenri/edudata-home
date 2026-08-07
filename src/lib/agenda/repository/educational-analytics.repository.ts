import type {
  SupabaseClient,
} from '@supabase/supabase-js'

export type EducationalAnalyticsJson =
  Record<string, unknown>

export type EducationalAnalyticsRunVersionStatus =
  | 'current'
  | 'superseded'
  | 'archived'
  | 'rejected'

export type EducationalAnalyticsHumanReviewStatus =
  | 'pending'
  | 'in_review'
  | 'approved'
  | 'approved_with_changes'
  | 'rejected'

export type EducationalAnalyticsRunRow = {
  id: string
  analysis_id: string
  analysis_key: string
  version_id: string
  version_number: number
  version_label: string
  version_status:
    EducationalAnalyticsRunVersionStatus
  previous_version_id: string | null
  parent_version_id: string | null
  is_current_version: boolean
  idempotency_key: string
  status: string
  scope: string
  title: string
  description: string | null
  capability: 'educational_analytics'
  source_product: string
  context: EducationalAnalyticsJson
  configuration: EducationalAnalyticsJson
  data_quality: EducationalAnalyticsJson
  privacy: EducationalAnalyticsJson
  ethics: EducationalAnalyticsJson
  research_eligibility: EducationalAnalyticsJson
  explainability: EducationalAnalyticsJson
  traceability: EducationalAnalyticsJson
  analytics_payload: EducationalAnalyticsJson
  report_payload: EducationalAnalyticsJson | null
  correlation_count: number
  pattern_count: number
  anomaly_count: number
  influence_count: number
  prediction_count: number
  recommendation_count: number
  research_result_count: number
  contains_personal_data: boolean
  contains_sensitive_data: boolean
  contains_minor_data: boolean
  anonymized: boolean
  pseudonymized: boolean
  requires_human_review: boolean
  human_review_status:
    EducationalAnalyticsHumanReviewStatus
  human_review_payload: EducationalAnalyticsJson
  reviewed_at: string | null
  reviewed_by: string | null
  approved: boolean
  approved_at: string | null
  approved_by: string | null
  user_id: string
  organization_id: string | null
  school_id: string | null
  owner_user_id: string | null
  created_by: string | null
  updated_by: string | null
  correlation_id: string
  causation_id: string | null
  request_id: string | null
  session_id: string | null
  trace_id: string | null
  warnings: unknown[]
  errors: unknown[]
  metadata: EducationalAnalyticsJson
  generated_at: string
  completed_at: string | null
  created_at: string
  updated_at: string
  archived_at: string | null
}

export type CreateEducationalAnalyticsRunInput =
  Omit<
    EducationalAnalyticsRunRow,
    | 'id'
    | 'created_at'
    | 'updated_at'
  > & {
    id?: string
    created_at?: string
    updated_at?: string
  }

export type EducationalAnalyticsHistoryOptions = {
  userId: string
  analysisKey?: string | null
  organizationId?: string | null
  schoolId?: string | null
  includeArchived?: boolean
  limit?: number
}

export type EducationalAnalyticsReviewInput = {
  status:
    EducationalAnalyticsHumanReviewStatus
  payload?: EducationalAnalyticsJson
  reviewedBy: string
  approved?: boolean
}

const TABLE_NAME =
  'agenda_educational_analytics_runs'

const DEFAULT_LIMIT = 50
const MAX_LIMIT = 200

function normalizeRequiredText(
  value: string | null | undefined,
  fieldName: string,
): string {
  const normalized =
    value?.trim()

  if (!normalized) {
    throw new Error(
      `${fieldName} é obrigatório.`,
    )
  }

  return normalized
}

function normalizeLimit(
  value: number | undefined,
): number {
  if (
    value === undefined ||
    !Number.isFinite(value)
  ) {
    return DEFAULT_LIMIT
  }

  return Math.min(
    MAX_LIMIT,
    Math.max(
      1,
      Math.trunc(value),
    ),
  )
}

export async function findEducationalAnalyticsRunByIdempotencyKey({
  client,
  idempotencyKey,
}: {
  client: SupabaseClient
  idempotencyKey: string
}): Promise<EducationalAnalyticsRunRow | null> {
  const normalizedKey =
    normalizeRequiredText(
      idempotencyKey,
      'idempotencyKey',
    )

  const { data, error } =
    await client
      .from(TABLE_NAME)
      .select('*')
      .eq(
        'idempotency_key',
        normalizedKey,
      )
      .maybeSingle()

  if (error) {
    throw new Error(
      `Não foi possível consultar a execução analítica: ${error.message}`,
    )
  }

  return data as
    EducationalAnalyticsRunRow | null
}

export async function getCurrentEducationalAnalyticsRun({
  client,
  analysisKey,
  userId,
}: {
  client: SupabaseClient
  analysisKey: string
  userId: string
}): Promise<EducationalAnalyticsRunRow | null> {
  const normalizedAnalysisKey =
    normalizeRequiredText(
      analysisKey,
      'analysisKey',
    )
  const normalizedUserId =
    normalizeRequiredText(
      userId,
      'userId',
    )

  const { data, error } =
    await client
      .from(TABLE_NAME)
      .select('*')
      .eq(
        'analysis_key',
        normalizedAnalysisKey,
      )
      .eq(
        'user_id',
        normalizedUserId,
      )
      .eq(
        'is_current_version',
        true,
      )
      .is(
        'archived_at',
        null,
      )
      .maybeSingle()

  if (error) {
    throw new Error(
      `Não foi possível localizar a versão atual da análise: ${error.message}`,
    )
  }

  return data as
    EducationalAnalyticsRunRow | null
}

export async function createEducationalAnalyticsRun({
  client,
  input,
}: {
  client: SupabaseClient
  input: CreateEducationalAnalyticsRunInput
}): Promise<EducationalAnalyticsRunRow> {
  normalizeRequiredText(
    input.analysis_id,
    'analysis_id',
  )
  normalizeRequiredText(
    input.analysis_key,
    'analysis_key',
  )
  normalizeRequiredText(
    input.version_id,
    'version_id',
  )
  normalizeRequiredText(
    input.idempotency_key,
    'idempotency_key',
  )
  normalizeRequiredText(
    input.user_id,
    'user_id',
  )
  normalizeRequiredText(
    input.correlation_id,
    'correlation_id',
  )

  const { data, error } =
    await client
      .from(TABLE_NAME)
      .insert(input)
      .select('*')
      .single()

  if (error) {
    throw new Error(
      `Não foi possível persistir a execução analítica: ${error.message}`,
    )
  }

  return data as
    EducationalAnalyticsRunRow
}

export async function supersedeEducationalAnalyticsRun({
  client,
  id,
  updatedBy,
}: {
  client: SupabaseClient
  id: string
  updatedBy: string
}): Promise<EducationalAnalyticsRunRow> {
  const normalizedId =
    normalizeRequiredText(id, 'id')
  const normalizedUserId =
    normalizeRequiredText(
      updatedBy,
      'updatedBy',
    )

  const { data, error } =
    await client
      .from(TABLE_NAME)
      .update({
        version_status:
          'superseded',
        is_current_version:
          false,
        updated_by:
          normalizedUserId,
      })
      .eq('id', normalizedId)
      .select('*')
      .single()

  if (error) {
    throw new Error(
      `Não foi possível encerrar a versão anterior da análise: ${error.message}`,
    )
  }

  return data as
    EducationalAnalyticsRunRow
}

export async function restoreEducationalAnalyticsRunAsCurrent({
  client,
  id,
  updatedBy,
}: {
  client: SupabaseClient
  id: string
  updatedBy: string
}): Promise<void> {
  const { error } =
    await client
      .from(TABLE_NAME)
      .update({
        version_status:
          'current',
        is_current_version:
          true,
        updated_by:
          normalizeRequiredText(
            updatedBy,
            'updatedBy',
          ),
      })
      .eq(
        'id',
        normalizeRequiredText(id, 'id'),
      )

  if (error) {
    throw new Error(
      `Não foi possível restaurar a versão anterior da análise: ${error.message}`,
    )
  }
}

export async function listEducationalAnalyticsHistory({
  client,
  options,
}: {
  client: SupabaseClient
  options: EducationalAnalyticsHistoryOptions
}): Promise<EducationalAnalyticsRunRow[]> {
  let query =
    client
      .from(TABLE_NAME)
      .select('*')
      .eq(
        'user_id',
        normalizeRequiredText(
          options.userId,
          'userId',
        ),
      )
      .order(
        'generated_at',
        {
          ascending: false,
        },
      )
      .limit(
        normalizeLimit(options.limit),
      )

  if (options.analysisKey?.trim()) {
    query = query.eq(
      'analysis_key',
      options.analysisKey.trim(),
    )
  }

  if (options.organizationId?.trim()) {
    query = query.eq(
      'organization_id',
      options.organizationId.trim(),
    )
  }

  if (options.schoolId?.trim()) {
    query = query.eq(
      'school_id',
      options.schoolId.trim(),
    )
  }

  if (!options.includeArchived) {
    query = query.is(
      'archived_at',
      null,
    )
  }

  const { data, error } =
    await query

  if (error) {
    throw new Error(
      `Não foi possível carregar o histórico analítico: ${error.message}`,
    )
  }

  return (
    data ?? []
  ) as EducationalAnalyticsRunRow[]
}

export async function reviewEducationalAnalyticsRun({
  client,
  id,
  input,
}: {
  client: SupabaseClient
  id: string
  input: EducationalAnalyticsReviewInput
}): Promise<EducationalAnalyticsRunRow> {
  const reviewedAt =
    new Date().toISOString()
  const approved =
    input.approved ??
    (
      input.status === 'approved' ||
      input.status ===
        'approved_with_changes'
    )

  const { data, error } =
    await client
      .from(TABLE_NAME)
      .update({
        human_review_status:
          input.status,
        human_review_payload:
          input.payload ?? {},
        reviewed_at:
          reviewedAt,
        reviewed_by:
          normalizeRequiredText(
            input.reviewedBy,
            'reviewedBy',
          ),
        approved,
        approved_at:
          approved
            ? reviewedAt
            : null,
        approved_by:
          approved
            ? input.reviewedBy
            : null,
        updated_by:
          input.reviewedBy,
      })
      .eq(
        'id',
        normalizeRequiredText(id, 'id'),
      )
      .select('*')
      .single()

  if (error) {
    throw new Error(
      `Não foi possível registrar a revisão humana: ${error.message}`,
    )
  }

  return data as
    EducationalAnalyticsRunRow
}

export async function archiveEducationalAnalyticsRun({
  client,
  id,
  updatedBy,
}: {
  client: SupabaseClient
  id: string
  updatedBy: string
}): Promise<EducationalAnalyticsRunRow> {
  const archivedAt =
    new Date().toISOString()

  const { data, error } =
    await client
      .from(TABLE_NAME)
      .update({
        version_status:
          'archived',
        is_current_version:
          false,
        status:
          'archived',
        archived_at:
          archivedAt,
        updated_by:
          normalizeRequiredText(
            updatedBy,
            'updatedBy',
          ),
      })
      .eq(
        'id',
        normalizeRequiredText(id, 'id'),
      )
      .select('*')
      .single()

  if (error) {
    throw new Error(
      `Não foi possível arquivar a execução analítica: ${error.message}`,
    )
  }

  return data as
    EducationalAnalyticsRunRow
}
