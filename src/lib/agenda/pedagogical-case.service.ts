import type { SupabaseClient } from '@supabase/supabase-js'

import {
  PEDAGOGICAL_CASE_CONTRACT_VERSION,
  type CreatePedagogicalCaseInput,
  type PedagogicalCase,
  type PedagogicalCaseListFilters,
  type PedagogicalCaseStatus,
} from '@/lib/eios/academic/pedagogical-case.contract'

import {
  insertPedagogicalCase,
  listPedagogicalCases,
  updatePedagogicalCase,
} from '@/lib/agenda/repository/pedagogical-case.repository'

function required(value: string | null | undefined, field: string): string {
  const normalized = value?.trim()
  if (!normalized) throw new Error(`${field} é obrigatório.`)
  return normalized
}

export async function createPedagogicalCase({
  client,
  userId,
  input,
}: {
  client: SupabaseClient
  userId: string
  input: Omit<CreatePedagogicalCaseInput, 'openedByUserId'>
}) {
  const normalizedUserId = required(userId, 'userId')
  const now = new Date().toISOString()
  const studentIds = Array.from(
    new Set([
      ...(input.studentIds ?? []),
      ...(input.studentId?.trim() ? [input.studentId.trim()] : []),
    ].filter(Boolean)),
  )

  if (studentIds.length === 0) {
    throw new Error('Informe ao menos um estudante para abrir o caso pedagógico.')
  }

  const correlationId = required(input.correlationId, 'correlationId')

  const pedagogicalCase: PedagogicalCase = {
    id: `pedagogical-case:${crypto.randomUUID()}`,
    contractVersion: PEDAGOGICAL_CASE_CONTRACT_VERSION,
    studentId: input.studentId?.trim() || studentIds[0] || null,
    studentIds,
    classId: required(input.classId, 'classId'),
    academicPeriodId: input.academicPeriodId?.trim() || null,
    organizationId: input.organizationId?.trim() || null,
    schoolId: input.schoolId?.trim() || null,
    title: required(input.title, 'title'),
    summary: required(input.summary, 'summary'),
    origin: input.origin,
    priority: input.priority ?? 'moderate',
    status: 'open',
    occurrenceIds: input.occurrenceIds ?? [],
    assessmentIds: input.assessmentIds ?? [],
    evidenceIds: input.evidenceIds ?? [],
    interventionIds: input.interventionIds ?? [],
    objectives: input.objectives ?? [],
    actions: input.actions ?? [],
    successCriteria: input.successCriteria ?? [],
    openedByUserId: normalizedUserId,
    openedAt: now,
    responsibleUserIds:
      input.responsibleUserIds?.length
        ? input.responsibleUserIds
        : [normalizedUserId],
    nextReviewAt: input.nextReviewAt ?? null,
    resolutionSummary: null,
    closedByUserId: null,
    closedAt: null,
    governance: {
      correlationId,
      requiresHumanReview: true,
    },
    metadata: input.metadata ?? {},
    createdAt: now,
    updatedAt: now,
  }

  const row = await insertPedagogicalCase({
    client,
    pedagogicalCase,
    userId: normalizedUserId,
  })

  return {
    success: true,
    item: row,
  }
}

export async function getPedagogicalCases({
  client,
  userId,
  filters,
}: {
  client: SupabaseClient
  userId: string
  filters?: PedagogicalCaseListFilters
}) {
  const items = await listPedagogicalCases({
    client,
    userId,
    filters,
  })

  return {
    success: true,
    items,
    summary: {
      total: items.length,
      open: items.filter(item => item.status === 'open').length,
      underFollowUp: items.filter(item => item.status === 'under_follow_up').length,
      resolved: items.filter(item => item.status === 'resolved' || item.status === 'closed').length,
      urgent: items.filter(item => item.priority === 'urgent').length,
    },
  }
}

export async function changePedagogicalCaseStatus({
  client,
  userId,
  caseId,
  status,
  resolutionSummary,
}: {
  client: SupabaseClient
  userId: string
  caseId: string
  status: PedagogicalCaseStatus
  resolutionSummary?: string | null
}) {
  const closesCase = status === 'closed' || status === 'resolved'
  const now = new Date().toISOString()

  const item = await updatePedagogicalCase({
    client,
    userId,
    caseId,
    patch: {
      status,
      resolution_summary: resolutionSummary?.trim() || null,
      ...(closesCase
        ? {
            closed_by_user_id: userId,
            closed_at: now,
          }
        : {}),
    },
  })

  return {
    success: true,
    item,
  }
}
