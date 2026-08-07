/**
 * EduData IA — EIOS Academic Core
 * Student Occurrence Contract 1.0
 *
 * Registro longitudinal de ocorrências educacionais.
 * Não representa diagnóstico clínico, rótulo de estudante ou decisão automática.
 */

export const STUDENT_OCCURRENCE_CONTRACT_VERSION =
  'student-occurrence-v1' as const

export type StudentOccurrenceContractVersion =
  typeof STUDENT_OCCURRENCE_CONTRACT_VERSION

export type StudentOccurrenceNature =
  | 'behavior'
  | 'coexistence'
  | 'attendance'
  | 'engagement'
  | 'pedagogical'
  | 'mediation'
  | 'positive_recognition'
  | 'leadership'
  | 'protagonism'
  | 'collaboration'
  | 'support_needed'
  | 'other'

export type StudentOccurrenceSeverity =
  | 'informational'
  | 'low'
  | 'moderate'
  | 'high'
  | 'critical'

export type StudentOccurrenceStatus =
  | 'open'
  | 'under_follow_up'
  | 'resolved'
  | 'recurrent'
  | 'referred'
  | 'archived'

export type StudentOccurrenceActionType =
  | 'guidance'
  | 'individual_conversation'
  | 'mediation'
  | 'pedagogical_intervention'
  | 'family_contact'
  | 'coordination_referral'
  | 'management_referral'
  | 'support_network_referral'
  | 'positive_feedback'
  | 'follow_up_plan'
  | 'other'

export type StudentOccurrencePersonRole =
  | 'student'
  | 'teacher'
  | 'coordinator'
  | 'director'
  | 'staff'
  | 'guardian'
  | 'other'

export type StudentOccurrencePersonReference = {
  id: string
  role: StudentOccurrencePersonRole
  displayName?: string | null
}

export type StudentOccurrenceAction = {
  id: string
  type: StudentOccurrenceActionType
  description: string
  responsibleUserId: string
  occurredAt: string
  followUpDueAt?: string | null
  completed: boolean
  completedAt?: string | null
  metadata: Record<string, unknown>
}

export type StudentOccurrence = {
  id: string
  contractVersion:
    StudentOccurrenceContractVersion

  studentId: string
  classId: string
  offeringId?: string | null
  lessonId?: string | null
  academicPeriodId?: string | null

  recordedByUserId: string
  recordedAt: string
  occurredAt: string

  nature: StudentOccurrenceNature
  severity: StudentOccurrenceSeverity
  status: StudentOccurrenceStatus

  title: string
  description: string
  location?: string | null

  positive: boolean
  requiresFollowUp: boolean
  recurrent: boolean
  recurrenceGroupId?: string | null

  peopleInvolved:
    StudentOccurrencePersonReference[]
  actions: StudentOccurrenceAction[]

  evidenceIds: string[]
  interventionIds: string[]

  organizationId?: string | null
  schoolId?: string | null

  governance: {
    correlationId: string
    auditEventId?: string | null
    provenanceId?: string | null
    requiresHumanReview: boolean
    reviewedBy?: string | null
    reviewedAt?: string | null
  }

  privacy: {
    containsPersonalData: boolean
    containsSensitiveData: boolean
    restrictedAccess: boolean
  }

  metadata: Record<string, unknown>
}

export type CreateStudentOccurrenceInput = {
  studentId: string
  classId: string
  offeringId?: string | null
  lessonId?: string | null
  academicPeriodId?: string | null

  recordedByUserId: string
  occurredAt?: string

  nature: StudentOccurrenceNature
  severity?: StudentOccurrenceSeverity

  title: string
  description: string
  location?: string | null

  positive?: boolean
  requiresFollowUp?: boolean
  recurrent?: boolean
  recurrenceGroupId?: string | null

  peopleInvolved?:
    StudentOccurrencePersonReference[]
  actions?: StudentOccurrenceAction[]

  evidenceIds?: string[]
  interventionIds?: string[]

  organizationId?: string | null
  schoolId?: string | null

  correlationId: string
  metadata?: Record<string, unknown>
}

export type StudentOccurrenceListFilters = {
  studentId?: string | null
  classId?: string | null
  offeringId?: string | null
  academicPeriodId?: string | null
  nature?: StudentOccurrenceNature | null
  severity?: StudentOccurrenceSeverity | null
  status?: StudentOccurrenceStatus | null
  positive?: boolean | null
  requiresFollowUp?: boolean | null
  from?: string | null
  to?: string | null
  limit?: number
}
