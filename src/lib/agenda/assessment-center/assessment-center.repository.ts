import type { SupabaseClient } from '@supabase/supabase-js'

import type {
  AssessmentDefinition,
  GradebookEntry,
  StudentAssessmentResult,
} from './assessment-center.contract'

export type AssessmentCenterScope = {
  userId: string
  organizationId?: string | null
  schoolId?: string | null
}

const ASSESSMENTS_TABLE = 'agenda_assessments'
const RESULTS_TABLE = 'agenda_assessment_results'
const GRADEBOOK_TABLE = 'agenda_gradebook_entries'

function required(value: string | null | undefined, field: string): string {
  const normalized = value?.trim()
  if (!normalized) throw new Error(`${field} é obrigatório.`)
  return normalized
}

function scopeColumns(scope: AssessmentCenterScope) {
  return {
    user_id: required(scope.userId, 'userId'),
    organization_id: scope.organizationId?.trim() || null,
    school_id: scope.schoolId?.trim() || null,
  }
}

function toAssessmentRow(
  assessment: AssessmentDefinition,
  scope: AssessmentCenterScope,
) {
  return {
    id: assessment.id,
    contract_version: assessment.contractVersion,
    title: assessment.title,
    description: assessment.description ?? null,
    purpose: assessment.purpose,
    instrument_type: assessment.instrumentType,
    status: assessment.status,
    offering_id: assessment.offeringId,
    class_id: assessment.classId,
    component_id: assessment.componentId,
    academic_period_id: assessment.academicPeriodId,
    lesson_id: assessment.lessonId ?? null,
    teacher_id: assessment.teacherId,
    scale_id: assessment.scaleId ?? null,
    scale_type: assessment.scaleType,
    calculation_method: assessment.calculationMethod,
    weight: assessment.weight,
    maximum_score: assessment.maximumScore ?? null,
    passing_score: assessment.passingScore ?? null,
    scheduled_at: assessment.scheduledAt ?? null,
    applied_at: assessment.appliedAt ?? null,
    learning_outcome_ids: assessment.learningOutcomeIds,
    criteria: assessment.criteria,
    classification_scale: assessment.classificationScale,
    requires_human_review: true,
    metadata: assessment.metadata,
    created_by: assessment.teacherId,
    updated_by: assessment.teacherId,
    created_at: assessment.createdAt,
    updated_at: assessment.updatedAt,
    ...scopeColumns(scope),
  }
}

function toResultRow(
  result: StudentAssessmentResult,
  scope: AssessmentCenterScope,
) {
  return {
    id: result.id,
    assessment_id: result.assessmentId,
    student_id: result.studentId,
    enrollment_id: result.enrollmentId ?? null,
    class_id: result.classId,
    academic_period_id: result.academicPeriodId,
    status: result.status,
    raw_score: result.rawScore ?? null,
    normalized_score: result.normalizedScore ?? null,
    percentage: result.percentage ?? null,
    concept: result.concept ?? null,
    classification: result.classification,
    criterion_results: result.criterionResults,
    learning_outcome_results: result.learningOutcomeResults,
    teacher_feedback: result.teacherFeedback ?? null,
    recovery_required: result.recoveryRequired,
    recomposition_required: result.recompositionRequired,
    reviewed_by: result.reviewedBy ?? null,
    reviewed_at: result.reviewedAt ?? null,
    finalized_by: result.finalizedBy ?? null,
    finalized_at: result.finalizedAt ?? null,
    metadata: result.metadata,
    created_at: result.createdAt,
    updated_at: result.updatedAt,
    ...scopeColumns(scope),
  }
}

function toGradebookRow(
  entry: GradebookEntry,
  scope: AssessmentCenterScope,
) {
  return {
    id: entry.id,
    student_id: entry.studentId,
    class_id: entry.classId,
    component_id: entry.componentId,
    academic_period_id: entry.academicPeriodId,
    assessment_id: entry.assessmentId ?? null,
    assessment_result_id: entry.assessmentResultId ?? null,
    entry_type: entry.type,
    title: entry.title,
    value: entry.value ?? null,
    percentage: entry.percentage ?? null,
    concept: entry.concept ?? null,
    weight: entry.weight,
    classification: entry.classification,
    recorded_by: entry.recordedBy,
    recorded_at: entry.recordedAt,
    reason: entry.reason ?? null,
    supersedes_entry_id: entry.supersedesEntryId ?? null,
    metadata: entry.metadata,
    ...scopeColumns(scope),
  }
}

export async function insertAssessment({
  client,
  assessment,
  scope,
}: {
  client: SupabaseClient
  assessment: AssessmentDefinition
  scope: AssessmentCenterScope
}) {
  const { data, error } = await client
    .from(ASSESSMENTS_TABLE)
    .insert(toAssessmentRow(assessment, scope))
    .select('*')
    .single()

  if (error) {
    throw new Error(`Não foi possível salvar a avaliação: ${error.message}`)
  }

  return data
}

export async function upsertAssessmentResult({
  client,
  result,
  scope,
}: {
  client: SupabaseClient
  result: StudentAssessmentResult
  scope: AssessmentCenterScope
}) {
  const { data, error } = await client
    .from(RESULTS_TABLE)
    .upsert(toResultRow(result, scope), {
      onConflict: 'assessment_id,student_id',
    })
    .select('*')
    .single()

  if (error) {
    throw new Error(`Não foi possível salvar o resultado: ${error.message}`)
  }

  return data
}

export async function insertGradebookEntry({
  client,
  entry,
  scope,
}: {
  client: SupabaseClient
  entry: GradebookEntry
  scope: AssessmentCenterScope
}) {
  const { data, error } = await client
    .from(GRADEBOOK_TABLE)
    .insert(toGradebookRow(entry, scope))
    .select('*')
    .single()

  if (error) {
    throw new Error(`Não foi possível lançar a nota: ${error.message}`)
  }

  return data
}

export async function listAssessments({
  client,
  scope,
  classId,
  academicPeriodId,
  limit = 50,
}: {
  client: SupabaseClient
  scope: AssessmentCenterScope
  classId?: string | null
  academicPeriodId?: string | null
  limit?: number
}) {
  let query = client
    .from(ASSESSMENTS_TABLE)
    .select('*')
    .eq('user_id', required(scope.userId, 'userId'))
    .is('archived_at', null)
    .order('created_at', { ascending: false })
    .limit(Math.min(200, Math.max(1, Math.trunc(limit))))

  if (classId?.trim()) query = query.eq('class_id', classId.trim())
  if (academicPeriodId?.trim()) {
    query = query.eq('academic_period_id', academicPeriodId.trim())
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Não foi possível carregar as avaliações: ${error.message}`)
  }

  return data ?? []
}

export async function listAssessmentResults({
  client,
  scope,
  assessmentId,
}: {
  client: SupabaseClient
  scope: AssessmentCenterScope
  assessmentId: string
}) {
  const { data, error } = await client
    .from(RESULTS_TABLE)
    .select('*')
    .eq('user_id', required(scope.userId, 'userId'))
    .eq('assessment_id', required(assessmentId, 'assessmentId'))
    .is('archived_at', null)
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(`Não foi possível carregar os resultados: ${error.message}`)
  }

  return data ?? []
}

export async function listGradebookEntries({
  client,
  scope,
  studentId,
  classId,
  componentId,
  academicPeriodId,
}: {
  client: SupabaseClient
  scope: AssessmentCenterScope
  studentId: string
  classId: string
  componentId: string
  academicPeriodId: string
}) {
  const { data, error } = await client
    .from(GRADEBOOK_TABLE)
    .select('*')
    .eq('user_id', required(scope.userId, 'userId'))
    .eq('student_id', required(studentId, 'studentId'))
    .eq('class_id', required(classId, 'classId'))
    .eq('component_id', required(componentId, 'componentId'))
    .eq('academic_period_id', required(academicPeriodId, 'academicPeriodId'))
    .is('archived_at', null)
    .order('recorded_at', { ascending: true })

  if (error) {
    throw new Error(`Não foi possível carregar o diário de notas: ${error.message}`)
  }

  return data ?? []
}
