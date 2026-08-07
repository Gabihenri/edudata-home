import type { SupabaseClient } from '@supabase/supabase-js'

import type {
  PedagogicalCase,
  PedagogicalCaseListFilters,
} from '@/lib/eios/academic/pedagogical-case.contract'

const TABLE_NAME = 'agenda_pedagogical_cases'

function required(value: string | null | undefined, field: string): string {
  const normalized = value?.trim()
  if (!normalized) throw new Error(`${field} é obrigatório.`)
  return normalized
}

function normalizeLimit(value?: number) {
  if (value === undefined || !Number.isFinite(value)) return 50
  return Math.min(200, Math.max(1, Math.trunc(value)))
}

export async function insertPedagogicalCase({
  client,
  pedagogicalCase,
  userId,
}: {
  client: SupabaseClient
  pedagogicalCase: PedagogicalCase
  userId: string
}) {
  const normalizedUserId = required(userId, 'userId')

  const { data, error } = await client
    .from(TABLE_NAME)
    .insert({
      id: pedagogicalCase.id,
      contract_version: pedagogicalCase.contractVersion,
      student_id: pedagogicalCase.studentId ?? null,
      student_ids: pedagogicalCase.studentIds,
      class_id: pedagogicalCase.classId,
      academic_period_id: pedagogicalCase.academicPeriodId ?? null,
      title: pedagogicalCase.title,
      summary: pedagogicalCase.summary,
      origin: pedagogicalCase.origin,
      priority: pedagogicalCase.priority,
      status: pedagogicalCase.status,
      occurrence_ids: pedagogicalCase.occurrenceIds,
      assessment_ids: pedagogicalCase.assessmentIds,
      evidence_ids: pedagogicalCase.evidenceIds,
      intervention_ids: pedagogicalCase.interventionIds,
      objectives: pedagogicalCase.objectives,
      actions: pedagogicalCase.actions,
      success_criteria: pedagogicalCase.successCriteria,
      opened_by_user_id: pedagogicalCase.openedByUserId,
      opened_at: pedagogicalCase.openedAt,
      responsible_user_ids: pedagogicalCase.responsibleUserIds,
      next_review_at: pedagogicalCase.nextReviewAt ?? null,
      resolution_summary: pedagogicalCase.resolutionSummary ?? null,
      closed_by_user_id: pedagogicalCase.closedByUserId ?? null,
      closed_at: pedagogicalCase.closedAt ?? null,
      governance: pedagogicalCase.governance,
      metadata: pedagogicalCase.metadata,
      user_id: normalizedUserId,
      organization_id: pedagogicalCase.organizationId ?? null,
      school_id: pedagogicalCase.schoolId ?? null,
    })
    .select('*')
    .single()

  if (error) {
    throw new Error(`Não foi possível abrir o caso pedagógico: ${error.message}`)
  }

  return data
}

export async function listPedagogicalCases({
  client,
  userId,
  filters = {},
}: {
  client: SupabaseClient
  userId: string
  filters?: PedagogicalCaseListFilters
}) {
  let query = client
    .from(TABLE_NAME)
    .select('*')
    .eq('user_id', required(userId, 'userId'))
    .is('archived_at', null)
    .order('created_at', { ascending: false })
    .limit(normalizeLimit(filters.limit))

  if (filters.studentId?.trim()) {
    query = query.eq('student_id', filters.studentId.trim())
  }
  if (filters.classId?.trim()) {
    query = query.eq('class_id', filters.classId.trim())
  }
  if (filters.academicPeriodId?.trim()) {
    query = query.eq('academic_period_id', filters.academicPeriodId.trim())
  }
  if (filters.status) query = query.eq('status', filters.status)
  if (filters.priority) query = query.eq('priority', filters.priority)

  const { data, error } = await query

  if (error) {
    throw new Error(`Não foi possível consultar os casos pedagógicos: ${error.message}`)
  }

  return data ?? []
}

export async function updatePedagogicalCase({
  client,
  userId,
  caseId,
  patch,
}: {
  client: SupabaseClient
  userId: string
  caseId: string
  patch: Record<string, unknown>
}) {
  const { data, error } = await client
    .from(TABLE_NAME)
    .update(patch)
    .eq('id', required(caseId, 'caseId'))
    .eq('user_id', required(userId, 'userId'))
    .select('*')
    .single()

  if (error) {
    throw new Error(`Não foi possível atualizar o caso pedagógico: ${error.message}`)
  }

  return data
}
