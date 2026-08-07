import type {
  SupabaseClient,
} from '@supabase/supabase-js'

import type {
  StudentOccurrence,
  StudentOccurrenceListFilters,
} from '@/lib/eios/academic/student-occurrence.contract'

const TABLE_NAME =
  'agenda_student_occurrences'

const DEFAULT_LIMIT = 50
const MAX_LIMIT = 200

function required(
  value: string | null | undefined,
  field: string,
): string {
  const normalized = value?.trim()

  if (!normalized) {
    throw new Error(`${field} é obrigatório.`)
  }

  return normalized
}

function normalizeLimit(
  value: number | undefined,
) {
  if (
    value === undefined ||
    !Number.isFinite(value)
  ) {
    return DEFAULT_LIMIT
  }

  return Math.min(
    MAX_LIMIT,
    Math.max(1, Math.trunc(value)),
  )
}

export async function insertStudentOccurrence({
  client,
  occurrence,
  userId,
}: {
  client: SupabaseClient
  occurrence: StudentOccurrence
  userId: string
}) {
  const normalizedUserId =
    required(userId, 'userId')

  const { data, error } =
    await client
      .from(TABLE_NAME)
      .insert({
        id: occurrence.id,
        contract_version:
          occurrence.contractVersion,
        student_id:
          occurrence.studentId,
        class_id:
          occurrence.classId,
        offering_id:
          occurrence.offeringId ?? null,
        lesson_id:
          occurrence.lessonId ?? null,
        academic_period_id:
          occurrence.academicPeriodId ?? null,
        recorded_by_user_id:
          occurrence.recordedByUserId,
        recorded_at:
          occurrence.recordedAt,
        occurred_at:
          occurrence.occurredAt,
        nature: occurrence.nature,
        severity: occurrence.severity,
        status: occurrence.status,
        title: occurrence.title,
        description:
          occurrence.description,
        location:
          occurrence.location ?? null,
        positive: occurrence.positive,
        requires_follow_up:
          occurrence.requiresFollowUp,
        recurrent:
          occurrence.recurrent,
        recurrence_group_id:
          occurrence.recurrenceGroupId ?? null,
        people_involved:
          occurrence.peopleInvolved,
        actions: occurrence.actions,
        evidence_ids:
          occurrence.evidenceIds,
        intervention_ids:
          occurrence.interventionIds,
        governance:
          occurrence.governance,
        privacy: occurrence.privacy,
        metadata: occurrence.metadata,
        user_id: normalizedUserId,
        organization_id:
          occurrence.organizationId ?? null,
        school_id:
          occurrence.schoolId ?? null,
        reviewed_by:
          occurrence.governance.reviewedBy ?? null,
        reviewed_at:
          occurrence.governance.reviewedAt ?? null,
      })
      .select('*')
      .single()

  if (error) {
    throw new Error(
      `Não foi possível registrar a ocorrência: ${error.message}`,
    )
  }

  return data
}

export async function listStudentOccurrences({
  client,
  userId,
  filters = {},
}: {
  client: SupabaseClient
  userId: string
  filters?: StudentOccurrenceListFilters
}) {
  let query = client
    .from(TABLE_NAME)
    .select('*')
    .eq(
      'user_id',
      required(userId, 'userId'),
    )
    .is('archived_at', null)
    .order('occurred_at', {
      ascending: false,
    })
    .limit(
      normalizeLimit(filters.limit),
    )

  if (filters.studentId?.trim()) {
    query = query.eq(
      'student_id',
      filters.studentId.trim(),
    )
  }

  if (filters.classId?.trim()) {
    query = query.eq(
      'class_id',
      filters.classId.trim(),
    )
  }

  if (filters.offeringId?.trim()) {
    query = query.eq(
      'offering_id',
      filters.offeringId.trim(),
    )
  }

  if (filters.academicPeriodId?.trim()) {
    query = query.eq(
      'academic_period_id',
      filters.academicPeriodId.trim(),
    )
  }

  if (filters.nature) {
    query = query.eq(
      'nature',
      filters.nature,
    )
  }

  if (filters.severity) {
    query = query.eq(
      'severity',
      filters.severity,
    )
  }

  if (filters.status) {
    query = query.eq(
      'status',
      filters.status,
    )
  }

  if (filters.positive !== null && filters.positive !== undefined) {
    query = query.eq(
      'positive',
      filters.positive,
    )
  }

  if (
    filters.requiresFollowUp !== null &&
    filters.requiresFollowUp !== undefined
  ) {
    query = query.eq(
      'requires_follow_up',
      filters.requiresFollowUp,
    )
  }

  if (filters.from?.trim()) {
    query = query.gte(
      'occurred_at',
      filters.from.trim(),
    )
  }

  if (filters.to?.trim()) {
    query = query.lte(
      'occurred_at',
      filters.to.trim(),
    )
  }

  const { data, error } = await query

  if (error) {
    throw new Error(
      `Não foi possível consultar as ocorrências: ${error.message}`,
    )
  }

  return data ?? []
}

export async function updateStudentOccurrenceStatus({
  client,
  userId,
  occurrenceId,
  status,
  reviewedBy,
}: {
  client: SupabaseClient
  userId: string
  occurrenceId: string
  status:
    StudentOccurrence['status']
  reviewedBy?: string | null
}) {
  const patch: Record<string, unknown> = {
    status,
  }

  if (reviewedBy?.trim()) {
    patch.reviewed_by = reviewedBy.trim()
    patch.reviewed_at =
      new Date().toISOString()
  }

  const { data, error } =
    await client
      .from(TABLE_NAME)
      .update(patch)
      .eq(
        'id',
        required(
          occurrenceId,
          'occurrenceId',
        ),
      )
      .eq(
        'user_id',
        required(userId, 'userId'),
      )
      .select('*')
      .single()

  if (error) {
    throw new Error(
      `Não foi possível atualizar a ocorrência: ${error.message}`,
    )
  }

  return data
}
