/**
 * EduData IA — EIOS Academic Core
 * Pedagogical Case Contract 1.0
 *
 * Acompanhamento estruturado de estudante ou grupo.
 * Não representa diagnóstico clínico, sanção automática ou rotulagem.
 */

export const PEDAGOGICAL_CASE_CONTRACT_VERSION =
  'pedagogical-case-v1' as const

export type PedagogicalCaseStatus =
  | 'open'
  | 'under_analysis'
  | 'action_plan_defined'
  | 'under_follow_up'
  | 'resolved'
  | 'closed'
  | 'archived'

export type PedagogicalCasePriority =
  | 'low'
  | 'moderate'
  | 'high'
  | 'urgent'

export type PedagogicalCaseOrigin =
  | 'occurrence'
  | 'assessment'
  | 'attendance'
  | 'evidence'
  | 'teacher_observation'
  | 'coordination'
  | 'family_contact'
  | 'other'

export type PedagogicalCaseAction = {
  id: string
  title: string
  description: string
  responsibleUserId: string
  dueAt?: string | null
  completed: boolean
  completedAt?: string | null
  evidenceIds: string[]
  metadata: Record<string, unknown>
}

export type PedagogicalCase = {
  id: string
  contractVersion: typeof PEDAGOGICAL_CASE_CONTRACT_VERSION
  studentId?: string | null
  studentIds: string[]
  classId: string
  academicPeriodId?: string | null
  organizationId?: string | null
  schoolId?: string | null

  title: string
  summary: string
  origin: PedagogicalCaseOrigin
  priority: PedagogicalCasePriority
  status: PedagogicalCaseStatus

  occurrenceIds: string[]
  assessmentIds: string[]
  evidenceIds: string[]
  interventionIds: string[]

  objectives: string[]
  actions: PedagogicalCaseAction[]
  successCriteria: string[]

  openedByUserId: string
  openedAt: string
  responsibleUserIds: string[]
  nextReviewAt?: string | null

  resolutionSummary?: string | null
  closedByUserId?: string | null
  closedAt?: string | null

  governance: {
    correlationId: string
    requiresHumanReview: true
    reviewedBy?: string | null
    reviewedAt?: string | null
  }

  metadata: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export type CreatePedagogicalCaseInput = {
  studentId?: string | null
  studentIds?: string[]
  classId: string
  academicPeriodId?: string | null
  organizationId?: string | null
  schoolId?: string | null

  title: string
  summary: string
  origin: PedagogicalCaseOrigin
  priority?: PedagogicalCasePriority

  occurrenceIds?: string[]
  assessmentIds?: string[]
  evidenceIds?: string[]
  interventionIds?: string[]

  objectives?: string[]
  actions?: PedagogicalCaseAction[]
  successCriteria?: string[]

  openedByUserId: string
  responsibleUserIds?: string[]
  nextReviewAt?: string | null
  correlationId: string
  metadata?: Record<string, unknown>
}

export type PedagogicalCaseListFilters = {
  studentId?: string | null
  classId?: string | null
  academicPeriodId?: string | null
  status?: PedagogicalCaseStatus | null
  priority?: PedagogicalCasePriority | null
  limit?: number
}
