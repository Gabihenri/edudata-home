import { randomUUID } from 'crypto'

import type { SupabaseClient } from '@supabase/supabase-js'

import {
  ASSESSMENT_CENTER_CONTRACT_VERSION,
  DEFAULT_LEARNING_CLASSIFICATION_SCALE,
  type AssessmentDefinition,
  type AssessmentInstrumentType,
  type AssessmentPurpose,
  type GradebookEntry,
  type GradebookEntryType,
  type StudentAssessmentResult,
} from './assessment-center.contract'

import {
  enrichStudentAssessmentResult,
  classifyLearning,
} from './assessment-center.engine'

import {
  insertAssessment,
  insertGradebookEntry,
  listAssessmentResults,
  listAssessments,
  listGradebookEntries,
  upsertAssessmentResult,
  type AssessmentCenterScope,
} from './assessment-center.repository'

import type {
  AcademicAssessmentScaleType,
  AcademicCalculationMethod,
} from '@/lib/eios/academic/academic-learning.contract'

function nowIso(): string {
  return new Date().toISOString()
}

function required(value: string | null | undefined, field: string): string {
  const normalized = value?.trim()
  if (!normalized) throw new Error(`${field} é obrigatório.`)
  return normalized
}

export type CreateAssessmentInput = {
  title: string
  description?: string | null
  purpose: AssessmentPurpose
  instrumentType: AssessmentInstrumentType
  offeringId: string
  classId: string
  componentId: string
  academicPeriodId: string
  lessonId?: string | null
  scaleId?: string | null
  scaleType?: AcademicAssessmentScaleType
  calculationMethod?: AcademicCalculationMethod
  weight?: number
  maximumScore?: number | null
  passingScore?: number | null
  scheduledAt?: string | null
  learningOutcomeIds?: string[]
  criteria?: AssessmentDefinition['criteria']
  metadata?: Record<string, unknown>
  organizationId?: string | null
  schoolId?: string | null
}

export type SaveAssessmentResultInput = {
  id?: string
  assessmentId: string
  studentId: string
  enrollmentId?: string | null
  classId: string
  academicPeriodId: string
  status?: StudentAssessmentResult['status']
  rawScore?: number | null
  normalizedScore?: number | null
  percentage?: number | null
  concept?: string | null
  criterionResults?: StudentAssessmentResult['criterionResults']
  learningOutcomeResults?: StudentAssessmentResult['learningOutcomeResults']
  teacherFeedback?: string | null
  metadata?: Record<string, unknown>
  organizationId?: string | null
  schoolId?: string | null
}

export type CreateGradebookEntryInput = {
  id?: string
  studentId: string
  classId: string
  componentId: string
  academicPeriodId: string
  assessmentId?: string | null
  assessmentResultId?: string | null
  type?: GradebookEntryType
  title: string
  value?: number | null
  percentage?: number | null
  concept?: string | null
  weight?: number
  reason?: string | null
  supersedesEntryId?: string | null
  metadata?: Record<string, unknown>
  organizationId?: string | null
  schoolId?: string | null
}

function buildScope(
  userId: string,
  organizationId?: string | null,
  schoolId?: string | null,
): AssessmentCenterScope {
  return {
    userId: required(userId, 'userId'),
    organizationId: organizationId?.trim() || null,
    schoolId: schoolId?.trim() || null,
  }
}

export async function createAssessment({
  client,
  userId,
  input,
}: {
  client: SupabaseClient
  userId: string
  input: CreateAssessmentInput
}) {
  const timestamp = nowIso()

  const assessment: AssessmentDefinition = {
    id: `assessment:${randomUUID()}`,
    contractVersion: ASSESSMENT_CENTER_CONTRACT_VERSION,
    title: required(input.title, 'title'),
    description: input.description?.trim() || null,
    purpose: input.purpose,
    instrumentType: input.instrumentType,
    status: input.scheduledAt ? 'scheduled' : 'draft',
    offeringId: required(input.offeringId, 'offeringId'),
    classId: required(input.classId, 'classId'),
    componentId: required(input.componentId, 'componentId'),
    academicPeriodId: required(input.academicPeriodId, 'academicPeriodId'),
    lessonId: input.lessonId?.trim() || null,
    teacherId: required(userId, 'userId'),
    scaleId: input.scaleId?.trim() || null,
    scaleType: input.scaleType ?? 'numeric',
    calculationMethod: input.calculationMethod ?? 'weighted_average',
    weight: Number.isFinite(input.weight) && (input.weight ?? 0) > 0
      ? Number(input.weight)
      : 1,
    maximumScore: input.maximumScore ?? 10,
    passingScore: input.passingScore ?? 7,
    scheduledAt: input.scheduledAt ?? null,
    appliedAt: null,
    learningOutcomeIds: input.learningOutcomeIds ?? [],
    criteria: input.criteria ?? [],
    classificationScale: DEFAULT_LEARNING_CLASSIFICATION_SCALE,
    requiresHumanReview: true,
    createdAt: timestamp,
    updatedAt: timestamp,
    metadata: input.metadata ?? {},
  }

  const persisted = await insertAssessment({
    client,
    assessment,
    scope: buildScope(userId, input.organizationId, input.schoolId),
  })

  return {
    success: true,
    assessment,
    persisted,
  }
}

export async function saveAssessmentResult({
  client,
  userId,
  input,
}: {
  client: SupabaseClient
  userId: string
  input: SaveAssessmentResultInput
}) {
  const timestamp = nowIso()

  const result = enrichStudentAssessmentResult({
    result: {
      id: input.id?.trim() || `assessment-result:${randomUUID()}`,
      assessmentId: required(input.assessmentId, 'assessmentId'),
      studentId: required(input.studentId, 'studentId'),
      enrollmentId: input.enrollmentId?.trim() || null,
      classId: required(input.classId, 'classId'),
      academicPeriodId: required(input.academicPeriodId, 'academicPeriodId'),
      status: input.status ?? 'reviewed',
      rawScore: input.rawScore ?? null,
      normalizedScore: input.normalizedScore ?? null,
      percentage: input.percentage ?? null,
      concept: input.concept?.trim() || null,
      classification: 'not_classified',
      criterionResults: input.criterionResults ?? [],
      learningOutcomeResults: input.learningOutcomeResults ?? [],
      teacherFeedback: input.teacherFeedback?.trim() || null,
      recoveryRequired: false,
      recompositionRequired: false,
      reviewedBy: userId,
      reviewedAt: timestamp,
      finalizedBy: null,
      finalizedAt: null,
      createdAt: timestamp,
      updatedAt: timestamp,
      metadata: input.metadata ?? {},
    },
  })

  const persisted = await upsertAssessmentResult({
    client,
    result,
    scope: buildScope(userId, input.organizationId, input.schoolId),
  })

  return {
    success: true,
    result,
    persisted,
  }
}

export async function createGradeEntry({
  client,
  userId,
  input,
}: {
  client: SupabaseClient
  userId: string
  input: CreateGradebookEntryInput
}) {
  const percentage =
    typeof input.percentage === 'number' && Number.isFinite(input.percentage)
      ? Math.min(100, Math.max(0, input.percentage))
      : null

  const entry: GradebookEntry = {
    id: input.id?.trim() || `gradebook:${randomUUID()}`,
    studentId: required(input.studentId, 'studentId'),
    classId: required(input.classId, 'classId'),
    componentId: required(input.componentId, 'componentId'),
    academicPeriodId: required(input.academicPeriodId, 'academicPeriodId'),
    assessmentId: input.assessmentId?.trim() || null,
    assessmentResultId: input.assessmentResultId?.trim() || null,
    type: input.type ?? 'assessment',
    title: required(input.title, 'title'),
    value: input.value ?? null,
    percentage,
    concept: input.concept?.trim() || null,
    weight: Number.isFinite(input.weight) && (input.weight ?? 0) > 0
      ? Number(input.weight)
      : 1,
    classification: classifyLearning({ percentage }),
    recordedBy: required(userId, 'userId'),
    recordedAt: nowIso(),
    reason: input.reason?.trim() || null,
    supersedesEntryId: input.supersedesEntryId?.trim() || null,
    metadata: input.metadata ?? {},
  }

  const persisted = await insertGradebookEntry({
    client,
    entry,
    scope: buildScope(userId, input.organizationId, input.schoolId),
  })

  return {
    success: true,
    entry,
    persisted,
  }
}

export async function getAssessmentCenterOverview({
  client,
  userId,
  classId,
  academicPeriodId,
}: {
  client: SupabaseClient
  userId: string
  classId?: string | null
  academicPeriodId?: string | null
}) {
  const assessments = await listAssessments({
    client,
    scope: buildScope(userId),
    classId,
    academicPeriodId,
    limit: 100,
  })

  return {
    success: true,
    assessments,
    summary: {
      total: assessments.length,
      diagnostic: assessments.filter((item) => item.purpose === 'diagnostic').length,
      completed: assessments.filter((item) => item.status === 'completed').length,
      pendingReview: assessments.filter(
        (item) => item.requires_human_review === true && !item.reviewed_at,
      ).length,
    },
    generatedAt: nowIso(),
  }
}

export async function getAssessmentResults({
  client,
  userId,
  assessmentId,
}: {
  client: SupabaseClient
  userId: string
  assessmentId: string
}) {
  const items = await listAssessmentResults({
    client,
    scope: buildScope(userId),
    assessmentId,
  })

  return {
    success: true,
    items,
    generatedAt: nowIso(),
  }
}

export async function getStudentGradebook({
  client,
  userId,
  studentId,
  classId,
  componentId,
  academicPeriodId,
}: {
  client: SupabaseClient
  userId: string
  studentId: string
  classId: string
  componentId: string
  academicPeriodId: string
}) {
  const items = await listGradebookEntries({
    client,
    scope: buildScope(userId),
    studentId,
    classId,
    componentId,
    academicPeriodId,
  })

  return {
    success: true,
    items,
    generatedAt: nowIso(),
  }
}
