/**
 * EduData IA — EIOS Academic Core
 * Student Occurrence Engine 1.0
 */

import {
  STUDENT_OCCURRENCE_CONTRACT_VERSION,
  type CreateStudentOccurrenceInput,
  type StudentOccurrence,
} from './student-occurrence.contract'

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

function nowIso() {
  return new Date().toISOString()
}

function unique(
  values: string[] | undefined,
): string[] {
  return Array.from(
    new Set(
      (values ?? [])
        .map(value => value.trim())
        .filter(Boolean),
    ),
  )
}

export function createStudentOccurrence(
  input: CreateStudentOccurrenceInput,
): StudentOccurrence {
  const recordedAt = nowIso()
  const studentId = required(
    input.studentId,
    'studentId',
  )
  const classId = required(
    input.classId,
    'classId',
  )
  const recordedByUserId = required(
    input.recordedByUserId,
    'recordedByUserId',
  )
  const title = required(
    input.title,
    'title',
  )
  const description = required(
    input.description,
    'description',
  )
  const correlationId = required(
    input.correlationId,
    'correlationId',
  )

  const positive =
    input.positive ??
    [
      'positive_recognition',
      'leadership',
      'protagonism',
      'collaboration',
    ].includes(input.nature)

  const requiresFollowUp =
    input.requiresFollowUp ??
    (!positive &&
      (input.severity === 'high' ||
        input.severity === 'critical'))

  const recurrent =
    input.recurrent ?? false

  const status = recurrent
    ? 'recurrent'
    : requiresFollowUp
      ? 'under_follow_up'
      : 'open'

  const id = [
    'occurrence',
    studentId,
    classId,
    input.nature,
    recordedAt,
  ].join(':')

  return {
    id,
    contractVersion:
      STUDENT_OCCURRENCE_CONTRACT_VERSION,
    studentId,
    classId,
    offeringId:
      input.offeringId?.trim() || null,
    lessonId:
      input.lessonId?.trim() || null,
    academicPeriodId:
      input.academicPeriodId?.trim() || null,
    recordedByUserId,
    recordedAt,
    occurredAt:
      input.occurredAt ?? recordedAt,
    nature: input.nature,
    severity:
      input.severity ?? 'informational',
    status,
    title,
    description,
    location:
      input.location?.trim() || null,
    positive,
    requiresFollowUp,
    recurrent,
    recurrenceGroupId:
      input.recurrenceGroupId?.trim() || null,
    peopleInvolved:
      input.peopleInvolved ?? [],
    actions:
      input.actions ?? [],
    evidenceIds:
      unique(input.evidenceIds),
    interventionIds:
      unique(input.interventionIds),
    organizationId:
      input.organizationId?.trim() || null,
    schoolId:
      input.schoolId?.trim() || null,
    governance: {
      correlationId,
      auditEventId: null,
      provenanceId: null,
      requiresHumanReview: true,
      reviewedBy: null,
      reviewedAt: null,
    },
    privacy: {
      containsPersonalData: true,
      containsSensitiveData: false,
      restrictedAccess: true,
    },
    metadata: {
      ...(input.metadata ?? {}),
      automatedLabelingProhibited: true,
      automaticDisciplinaryDecisionProhibited: true,
    },
  }
}

export function getStudentOccurrenceEngineInfo() {
  return {
    name: 'eios-student-occurrence-engine',
    version: '1.0.0',
    contractVersion:
      STUDENT_OCCURRENCE_CONTRACT_VERSION,
    guarantees: [
      'human_review_required',
      'no_automatic_student_labeling',
      'no_automatic_disciplinary_decision',
      'positive_and_follow_up_events_supported',
      'longitudinal_traceability',
    ],
  }
}
