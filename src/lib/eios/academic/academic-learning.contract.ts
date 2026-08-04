export const ACADEMIC_LEARNING_CONTRACT_VERSION =
  'academic-learning-v1' as const

export type AcademicLearningContractVersion =
  typeof ACADEMIC_LEARNING_CONTRACT_VERSION

export type AcademicRecord =
  Record<string, unknown>

export type AcademicEducationLevel =
  | 'early_childhood'
  | 'elementary'
  | 'secondary'
  | 'technical'
  | 'vocational'
  | 'undergraduate'
  | 'graduate'
  | 'extension'
  | 'corporate'
  | 'other'

export type AcademicOrganizationType =
  | 'education_network'
  | 'university'
  | 'university_center'
  | 'college'
  | 'institute'
  | 'school'
  | 'training_center'
  | 'company'
  | 'other'

export type AcademicPeriodType =
  | 'annual'
  | 'semester'
  | 'trimester'
  | 'quarter'
  | 'bimester'
  | 'module'
  | 'cycle'
  | 'custom'

export type AcademicOfferingStatus =
  | 'draft'
  | 'planned'
  | 'open'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'archived'

export type AcademicLessonStatus =
  | 'draft'
  | 'planned'
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'validated'
  | 'cancelled'
  | 'archived'

export type AcademicEnrollmentStatus =
  | 'pending'
  | 'active'
  | 'transferred'
  | 'withdrawn'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'archived'

export type AcademicLearningOutcomeType =
  | 'skill'
  | 'competency'
  | 'learning_objective'
  | 'course_outcome'
  | 'program_outcome'
  | 'graduate_profile'
  | 'professional_standard'
  | 'accreditation_requirement'
  | 'knowledge_object'
  | 'custom'

export type AcademicLearningOutcomeSource =
  | 'international'
  | 'national'
  | 'state'
  | 'municipal'
  | 'institutional'
  | 'school'
  | 'program'
  | 'course'
  | 'teacher'
  | 'custom'

export type AcademicOutcomeRelationType =
  | 'equivalent_to'
  | 'complements'
  | 'unfolds'
  | 'replaces'
  | 'prerequisite_of'
  | 'corequisite_of'
  | 'related_to'
  | 'supports'
  | 'assesses'
  | 'priority_for_recovery'

export type AcademicAssessmentType =
  | 'diagnostic'
  | 'formative'
  | 'summative'
  | 'exam'
  | 'quiz'
  | 'assignment'
  | 'project'
  | 'seminar'
  | 'presentation'
  | 'portfolio'
  | 'laboratory'
  | 'practical'
  | 'internship'
  | 'extension_activity'
  | 'research'
  | 'thesis'
  | 'observation'
  | 'self_assessment'
  | 'peer_assessment'
  | 'rubric'
  | 'other'

export type AcademicAssessmentScaleType =
  | 'numeric'
  | 'percentage'
  | 'concept'
  | 'letter'
  | 'rubric'
  | 'competency_level'
  | 'pass_fail'
  | 'completed_not_completed'
  | 'custom'

export type AcademicCalculationMethod =
  | 'simple_average'
  | 'weighted_average'
  | 'sum'
  | 'highest_score'
  | 'latest_score'
  | 'most_frequent_level'
  | 'rubric'
  | 'manual'
  | 'custom_formula'

export type AcademicAttendanceStatus =
  | 'present'
  | 'absent'
  | 'late'
  | 'excused'
  | 'remote'
  | 'partial'
  | 'not_recorded'

export type AcademicInterventionType =
  | 'content_review'
  | 'learning_recovery'
  | 'learning_recomposition'
  | 'individual_support'
  | 'group_support'
  | 'methodological_change'
  | 'differentiated_activity'
  | 'formative_feedback'
  | 'curricular_adaptation'
  | 'accessibility_support'
  | 'mentoring'
  | 'tutoring'
  | 'academic_advising'
  | 'other'

export type AcademicInterventionStatus =
  | 'draft'
  | 'planned'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'under_review'

export type AcademicEventType =
  | 'lesson'
  | 'assessment'
  | 'intervention'
  | 'teacher_training'
  | 'teacher_absence'
  | 'student_absence'
  | 'teacher_change'
  | 'class_composition_change'
  | 'calendar_interruption'
  | 'curriculum_change'
  | 'institutional_project'
  | 'observation'
  | 'feedback'
  | 'academic_support'
  | 'other'

export type AcademicIndicatorTrend =
  | 'up'
  | 'down'
  | 'stable'
  | 'unknown'

export type AcademicIndicatorLevel =
  | 'student'
  | 'group'
  | 'class'
  | 'offering'
  | 'component'
  | 'course'
  | 'program'
  | 'school'
  | 'campus'
  | 'institution'
  | 'network'

export type AcademicDataQuality =
  | 'complete'
  | 'partial'
  | 'insufficient'
  | 'not_evaluated'

export type AcademicAuditAction =
  | 'created'
  | 'updated'
  | 'deleted'
  | 'restored'
  | 'validated'
  | 'closed'
  | 'reopened'
  | 'imported'
  | 'exported'

export type AcademicInstitution = {
  id:
    string

  organizationId:
    string | null

  code:
    string | null

  name:
    string

  type:
    AcademicOrganizationType

  educationLevels:
    AcademicEducationLevel[]

  countryCode:
    string | null

  stateCode:
    string | null

  municipalityCode:
    string | null

  active:
    boolean

  metadata:
    AcademicRecord
}

export type AcademicCampus = {
  id:
    string

  institutionId:
    string

  code:
    string | null

  name:
    string

  active:
    boolean

  metadata:
    AcademicRecord
}

export type AcademicUnit = {
  id:
    string

  institutionId:
    string

  campusId:
    string | null

  parentUnitId:
    string | null

  code:
    string | null

  name:
    string

  active:
    boolean

  metadata:
    AcademicRecord
}

export type AcademicProgram = {
  id:
    string

  institutionId:
    string

  campusId:
    string | null

  unitId:
    string | null

  code:
    string | null

  name:
    string

  educationLevel:
    AcademicEducationLevel

  degreeName:
    string | null

  totalCredits:
    number | null

  totalWorkloadHours:
    number | null

  active:
    boolean

  metadata:
    AcademicRecord
}

export type AcademicCurriculumMatrix = {
  id:
    string

  institutionId:
    string

  programId:
    string | null

  code:
    string | null

  name:
    string

  version:
    string

  educationLevel:
    AcademicEducationLevel

  validFrom:
    string | null

  validUntil:
    string | null

  active:
    boolean

  source:
    AcademicLearningOutcomeSource

  metadata:
    AcademicRecord
}

export type AcademicComponent = {
  id:
    string

  institutionId:
    string

  programId:
    string | null

  curriculumMatrixId:
    string | null

  code:
    string | null

  name:
    string

  shortName:
    string | null

  educationLevel:
    AcademicEducationLevel

  workloadHours:
    number | null

  credits:
    number | null

  required:
    boolean

  prerequisiteComponentIds:
    string[]

  corequisiteComponentIds:
    string[]

  active:
    boolean

  metadata:
    AcademicRecord
}

export type AcademicPeriod = {
  id:
    string

  institutionId:
    string

  academicYear:
    number

  code:
    string | null

  name:
    string

  type:
    AcademicPeriodType

  sequence:
    number | null

  startsAt:
    string

  endsAt:
    string

  active:
    boolean

  metadata:
    AcademicRecord
}

export type AcademicOffering = {
  id:
    string

  institutionId:
    string

  campusId:
    string | null

  unitId:
    string | null

  programId:
    string | null

  curriculumMatrixId:
    string | null

  componentId:
    string

  academicPeriodId:
    string

  classId:
    string

  code:
    string | null

  name:
    string

  educationLevel:
    AcademicEducationLevel

  status:
    AcademicOfferingStatus

  teacherIds:
    string[]

  primaryTeacherId:
    string

  substituteTeacherIds:
    string[]

  sharedTeacherIds:
    string[]

  maximumStudents:
    number | null

  workloadHours:
    number | null

  credits:
    number | null

  startsAt:
    string | null

  endsAt:
    string | null

  metadata:
    AcademicRecord
}

export type AcademicStudent = {
  id:
    string

  institutionId:
    string

  externalCode:
    string | null

  displayName:
    string

  active:
    boolean

  metadata:
    AcademicRecord
}

export type AcademicEnrollment = {
  id:
    string

  studentId:
    string

  offeringId:
    string

  classId:
    string

  academicPeriodId:
    string

  enrolledAt:
    string

  endedAt:
    string | null

  status:
    AcademicEnrollmentStatus

  metadata:
    AcademicRecord
}

export type AcademicLearningOutcome = {
  id:
    string

  frameworkId:
    string | null

  curriculumMatrixId:
    string | null

  parentOutcomeId:
    string | null

  code:
    string | null

  localCode:
    string | null

  title:
    string

  description:
    string

  type:
    AcademicLearningOutcomeType

  source:
    AcademicLearningOutcomeSource

  educationLevel:
    AcademicEducationLevel

  componentId:
    string | null

  programId:
    string | null

  territoryCode:
    string | null

  version:
    string | null

  validFrom:
    string | null

  validUntil:
    string | null

  active:
    boolean

  masteryThreshold:
    number | null

  metadata:
    AcademicRecord
}

export type AcademicLearningOutcomeRelation = {
  id:
    string

  sourceOutcomeId:
    string

  targetOutcomeId:
    string

  type:
    AcademicOutcomeRelationType

  explanation:
    string | null

  active:
    boolean

  metadata:
    AcademicRecord
}

export type AcademicPlanning = {
  id:
    string

  offeringId:
    string

  classId:
    string

  componentId:
    string

  academicPeriodId:
    string

  teacherId:
    string

  title:
    string

  description:
    string | null

  startsAt:
    string | null

  endsAt:
    string | null

  learningOutcomeIds:
    string[]

  status:
    | 'draft'
    | 'active'
    | 'completed'
    | 'cancelled'
    | 'archived'

  metadata:
    AcademicRecord
}

export type AcademicLesson = {
  id:
    string

  offeringId:
    string

  classId:
    string

  componentId:
    string

  academicPeriodId:
    string

  teacherId:
    string

  planningId:
    string | null

  title:
    string

  description:
    string | null

  scheduledStartAt:
    string

  scheduledEndAt:
    string | null

  actualStartAt:
    string | null

  actualEndAt:
    string | null

  status:
    AcademicLessonStatus

  contentPlanned:
    string | null

  contentDelivered:
    string | null

  methodology:
    string | null

  resources:
    string[]

  learningOutcomeIds:
    string[]

  evidenceIds:
    string[]

  attendanceCompleted:
    boolean

  diaryCompleted:
    boolean

  validatedBy:
    string | null

  validatedAt:
    string | null

  metadata:
    AcademicRecord
}

export type AcademicAttendanceRecord = {
  id:
    string

  lessonId:
    string

  offeringId:
    string

  classId:
    string

  studentId:
    string

  status:
    AcademicAttendanceStatus

  minutesPresent:
    number | null

  justification:
    string | null

  documentEvidenceId:
    string | null

  recordedBy:
    string

  recordedAt:
    string

  metadata:
    AcademicRecord
}

export type AcademicAssessmentScale = {
  id:
    string

  institutionId:
    string

  name:
    string

  type:
    AcademicAssessmentScaleType

  minimumValue:
    number | null

  maximumValue:
    number | null

  passingValue:
    number | null

  levels:
    Array<{
      code:
        string

      label:
        string

      minimum:
        number | null

      maximum:
        number | null

      passing:
        boolean
    }>

  active:
    boolean

  metadata:
    AcademicRecord
}

export type AcademicAssessmentRule = {
  id:
    string

  institutionId:
    string

  programId:
    string | null

  componentId:
    string | null

  educationLevel:
    AcademicEducationLevel

  name:
    string

  scaleId:
    string

  calculationMethod:
    AcademicCalculationMethod

  customFormula:
    string | null

  minimumAttendancePercentage:
    number | null

  allowRecovery:
    boolean

  allowSubstituteAssessment:
    boolean

  allowFinalExam:
    boolean

  roundingPrecision:
    number

  active:
    boolean

  metadata:
    AcademicRecord
}

export type AcademicAssessment = {
  id:
    string

  offeringId:
    string

  classId:
    string

  componentId:
    string

  academicPeriodId:
    string

  lessonId:
    string | null

  teacherId:
    string

  assessmentRuleId:
    string | null

  scaleId:
    string

  title:
    string

  description:
    string | null

  type:
    AcademicAssessmentType

  scheduledAt:
    string | null

  appliedAt:
    string | null

  dueAt:
    string | null

  weight:
    number

  maximumScore:
    number | null

  learningOutcomeIds:
    string[]

  status:
    | 'draft'
    | 'scheduled'
    | 'open'
    | 'applied'
    | 'graded'
    | 'closed'
    | 'cancelled'

  metadata:
    AcademicRecord
}

export type AcademicAssessmentItem = {
  id:
    string

  assessmentId:
    string

  sequence:
    number

  title:
    string | null

  prompt:
    string | null

  maximumScore:
    number | null

  weight:
    number

  learningOutcomeIds:
    string[]

  correctAnswer:
    string | null

  metadata:
    AcademicRecord
}

export type AcademicAssessmentResult = {
  id:
    string

  assessmentId:
    string

  offeringId:
    string

  classId:
    string

  studentId:
    string

  score:
    number | null

  normalizedScore:
    number | null

  concept:
    string | null

  passed:
    boolean | null

  submittedAt:
    string | null

  gradedAt:
    string | null

  gradedBy:
    string | null

  attemptNumber:
    number

  feedback:
    string | null

  metadata:
    AcademicRecord
}

export type AcademicAssessmentItemResult = {
  id:
    string

  assessmentResultId:
    string

  assessmentItemId:
    string

  studentId:
    string

  score:
    number | null

  normalizedScore:
    number | null

  response:
    string | null

  correct:
    boolean | null

  feedback:
    string | null

  metadata:
    AcademicRecord
}

export type AcademicOutcomePerformance = {
  id:
    string

  studentId:
    string

  offeringId:
    string

  classId:
    string

  learningOutcomeId:
    string

  academicPeriodId:
    string

  score:
    number | null

  masteryLevel:
    string | null

  mastered:
    boolean | null

  evidenceCount:
    number

  assessmentCount:
    number

  firstMeasuredAt:
    string | null

  lastMeasuredAt:
    string | null

  calculationMethod:
    AcademicCalculationMethod

  metadata:
    AcademicRecord
}

export type AcademicEvidence = {
  id:
    string

  offeringId:
    string

  classId:
    string

  componentId:
    string

  academicPeriodId:
    string

  lessonId:
    string | null

  assessmentId:
    string | null

  studentId:
    string | null

  teacherId:
    string

  title:
    string

  description:
    string | null

  type:
    | 'document'
    | 'image'
    | 'video'
    | 'audio'
    | 'link'
    | 'observation'
    | 'rubric'
    | 'portfolio'
    | 'other'

  learningOutcomeIds:
    string[]

  storagePath:
    string | null

  externalUrl:
    string | null

  recordedAt:
    string

  metadata:
    AcademicRecord
}

export type AcademicIntervention = {
  id:
    string

  offeringId:
    string

  classId:
    string

  componentId:
    string

  academicPeriodId:
    string

  lessonId:
    string | null

  teacherId:
    string

  type:
    AcademicInterventionType

  status:
    AcademicInterventionStatus

  title:
    string

  description:
    string | null

  reason:
    string

  objective:
    string

  studentIds:
    string[]

  learningOutcomeIds:
    string[]

  baselineIndicatorId:
    string | null

  targetValue:
    number | null

  plannedStartAt:
    string | null

  plannedEndAt:
    string | null

  completedAt:
    string | null

  followUpAssessmentId:
    string | null

  evidenceIds:
    string[]

  resultSummary:
    string | null

  metadata:
    AcademicRecord
}

export type AcademicTeacherEffortEvent = {
  id:
    string

  teacherId:
    string

  offeringId:
    string

  classId:
    string

  lessonId:
    string | null

  interventionId:
    string | null

  type:
    | 'planning'
    | 'lesson_delivery'
    | 'feedback'
    | 'assessment_design'
    | 'assessment_grading'
    | 'content_review'
    | 'methodological_change'
    | 'student_support'
    | 'family_contact'
    | 'professional_development'
    | 'evidence_registration'
    | 'other'

  description:
    string

  effortValue:
    number | null

  effortUnit:
    'minutes'
    | 'hours'
    | 'occurrences'
    | 'points'
    | null

  occurredAt:
    string

  evidenceIds:
    string[]

  metadata:
    AcademicRecord
}

export type AcademicContextualEvent = {
  id:
    string

  institutionId:
    string

  campusId:
    string | null

  programId:
    string | null

  offeringId:
    string | null

  classId:
    string | null

  studentId:
    string | null

  teacherId:
    string | null

  type:
    AcademicEventType

  title:
    string

  description:
    string | null

  startsAt:
    string

  endsAt:
    string | null

  impactLevel:
    | 'low'
    | 'medium'
    | 'high'
    | 'unknown'

  verified:
    boolean

  verifiedBy:
    string | null

  metadata:
    AcademicRecord
}

export type AcademicPerformanceSnapshot = {
  id:
    string

  level:
    AcademicIndicatorLevel

  institutionId:
    string

  campusId:
    string | null

  programId:
    string | null

  offeringId:
    string | null

  classId:
    string | null

  componentId:
    string | null

  studentId:
    string | null

  learningOutcomeId:
    string | null

  academicPeriodId:
    string

  assessmentId:
    string | null

  recordedAt:
    string

  participantCount:
    number

  average:
    number | null

  median:
    number | null

  minimum:
    number | null

  maximum:
    number | null

  standardDeviation:
    number | null

  belowExpectedPercentage:
    number | null

  expectedPercentage:
    number | null

  aboveExpectedPercentage:
    number | null

  attendancePercentage:
    number | null

  dataQuality:
    AcademicDataQuality

  calculationVersion:
    string

  metadata:
    AcademicRecord
}

export type AcademicEvolutionIndicator = {
  id:
    string

  level:
    AcademicIndicatorLevel

  currentSnapshotId:
    string

  previousSnapshotId:
    string | null

  currentValue:
    number | null

  previousValue:
    number | null

  absoluteVariation:
    number | null

  percentageVariation:
    number | null

  trend:
    AcademicIndicatorTrend

  confidence:
    number | null

  explanation:
    string

  calculatedAt:
    string

  metadata:
    AcademicRecord
}

export type AcademicPerformanceEventLink = {
  id:
    string

  evolutionIndicatorId:
    string

  eventType:
    'lesson'
    | 'assessment'
    | 'intervention'
    | 'teacher_effort'
    | 'contextual_event'
    | 'evidence'

  eventId:
    string

  relation:
    | 'before'
    | 'during'
    | 'after'
    | 'overlaps'
    | 'associated'

  timeDistanceDays:
    number | null

  associationStrength:
    number | null

  explanation:
    string | null

  causalClaimAllowed:
    false

  metadata:
    AcademicRecord
}

export type AcademicDecisionRecord = {
  id:
    string

  institutionId:
    string

  offeringId:
    string | null

  classId:
    string | null

  studentId:
    string | null

  indicatorIds:
    string[]

  eventLinkIds:
    string[]

  title:
    string

  description:
    string

  decision:
    string

  rationale:
    string

  decidedBy:
    string

  decidedAt:
    string

  reviewAt:
    string | null

  status:
    | 'draft'
    | 'active'
    | 'under_review'
    | 'completed'
    | 'cancelled'

  resultSummary:
    string | null

  metadata:
    AcademicRecord
}

export type AcademicAuditEntry = {
  id:
    string

  entityType:
    string

  entityId:
    string

  action:
    AcademicAuditAction

  performedBy:
    string

  performedAt:
    string

  reason:
    string | null

  previousData:
    AcademicRecord | null

  newData:
    AcademicRecord | null

  metadata:
    AcademicRecord
}

export type AcademicLearningMetadata = {
  contractVersion:
    AcademicLearningContractVersion

  generatedAt:
    string

  dataQuality:
    AcademicDataQuality

  warnings:
    string[]

  containsPersonalData:
    boolean

  containsSensitiveData:
    boolean

  automatedDecisionAllowed:
    false

  causalClaimAllowed:
    false

  humanReviewRequired:
    boolean

  explainable:
    true
}

export type AcademicLearningContext = {
  metadata:
    AcademicLearningMetadata

  institution:
    AcademicInstitution | null

  campus:
    AcademicCampus | null

  unit:
    AcademicUnit | null

  program:
    AcademicProgram | null

  curriculumMatrix:
    AcademicCurriculumMatrix | null

  component:
    AcademicComponent | null

  academicPeriod:
    AcademicPeriod | null

  offering:
    AcademicOffering | null

  planning:
    AcademicPlanning[]

  lessons:
    AcademicLesson[]

  students:
    AcademicStudent[]

  enrollments:
    AcademicEnrollment[]

  learningOutcomes:
    AcademicLearningOutcome[]

  outcomeRelations:
    AcademicLearningOutcomeRelation[]

  attendance:
    AcademicAttendanceRecord[]

  assessmentScales:
    AcademicAssessmentScale[]

  assessmentRules:
    AcademicAssessmentRule[]

  assessments:
    AcademicAssessment[]

  assessmentItems:
    AcademicAssessmentItem[]

  assessmentResults:
    AcademicAssessmentResult[]

  assessmentItemResults:
    AcademicAssessmentItemResult[]

  outcomePerformance:
    AcademicOutcomePerformance[]

  evidences:
    AcademicEvidence[]

  interventions:
    AcademicIntervention[]

  teacherEffortEvents:
    AcademicTeacherEffortEvent[]

  contextualEvents:
    AcademicContextualEvent[]

  performanceSnapshots:
    AcademicPerformanceSnapshot[]

  evolutionIndicators:
    AcademicEvolutionIndicator[]

  performanceEventLinks:
    AcademicPerformanceEventLink[]

  decisions:
    AcademicDecisionRecord[]

  auditTrail:
    AcademicAuditEntry[]
}

export type AcademicLearningResult = {
  success:
    boolean

  context:
    AcademicLearningContext | null

  errors:
    string[]

  warnings:
    string[]
}

export function clampAcademicPercentage(
  value:
    number,
): number {
  if (
    !Number.isFinite(
      value,
    )
  ) {
    return 0
  }

  return Math.min(
    100,
    Math.max(
      0,
      Math.round(
        value *
          100,
      ) /
        100,
    ),
  )
}

export function createEmptyAcademicLearningContext():
  AcademicLearningContext {
  return {
    metadata: {
      contractVersion:
        ACADEMIC_LEARNING_CONTRACT_VERSION,

      generatedAt:
        new Date()
          .toISOString(),

      dataQuality:
        'not_evaluated',

      warnings:
        [],

      containsPersonalData:
        false,

      containsSensitiveData:
        false,

      automatedDecisionAllowed:
        false,

      causalClaimAllowed:
        false,

      humanReviewRequired:
        false,

      explainable:
        true,
    },

    institution:
      null,

    campus:
      null,

    unit:
      null,

    program:
      null,

    curriculumMatrix:
      null,

    component:
      null,

    academicPeriod:
      null,

    offering:
      null,

    planning:
      [],

    lessons:
      [],

    students:
      [],

    enrollments:
      [],

    learningOutcomes:
      [],

    outcomeRelations:
      [],

    attendance:
      [],

    assessmentScales:
      [],

    assessmentRules:
      [],

    assessments:
      [],

    assessmentItems:
      [],

    assessmentResults:
      [],

    assessmentItemResults:
      [],

    outcomePerformance:
      [],

    evidences:
      [],

    interventions:
      [],

    teacherEffortEvents:
      [],

    contextualEvents:
      [],

    performanceSnapshots:
      [],

    evolutionIndicators:
      [],

    performanceEventLinks:
      [],

    decisions:
      [],

    auditTrail:
      [],
  }
}