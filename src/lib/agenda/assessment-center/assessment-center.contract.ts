/**
 * EduData IA — Agenda Inteligente EDI
 * Centro de Avaliações — contrato 1.0
 *
 * Complementa o domínio acadêmico compartilhado do EIOS sem duplicar
 * estudantes, turmas, ofertas, períodos ou escalas de avaliação.
 */

import type {
  AcademicAssessmentScaleType,
  AcademicAssessmentType,
  AcademicCalculationMethod,
} from '@/lib/eios/academic/academic-learning.contract'

export const ASSESSMENT_CENTER_CONTRACT_VERSION =
  'assessment-center-v1' as const

export type AssessmentCenterContractVersion =
  typeof ASSESSMENT_CENTER_CONTRACT_VERSION

export type AssessmentStatus =
  | 'draft'
  | 'scheduled'
  | 'open'
  | 'applied'
  | 'under_review'
  | 'completed'
  | 'cancelled'
  | 'archived'

export type AssessmentPurpose =
  | 'diagnostic'
  | 'formative'
  | 'summative'
  | 'recovery'
  | 'recomposition'
  | 'classification'
  | 'monitoring'

export type AssessmentInstrumentType =
  | AcademicAssessmentType
  | 'written_test'
  | 'oral_activity'
  | 'practical_activity'
  | 'participation'
  | 'observation_record'

export type LearningClassificationCode =
  | 'critical'
  | 'initial'
  | 'developing'
  | 'adequate'
  | 'proficient'
  | 'advanced'
  | 'not_classified'

export type LearningClassification = {
  code: LearningClassificationCode
  label: string
  description?: string | null
  minimumPercentage?: number | null
  maximumPercentage?: number | null
  colorToken?: string | null
  priority: number
}

export type AssessmentCriterion = {
  id: string
  title: string
  description?: string | null
  weight: number
  maximumScore?: number | null
  learningOutcomeIds: string[]
  metadata: Record<string, unknown>
}

export type AssessmentDefinition = {
  id: string
  contractVersion: AssessmentCenterContractVersion
  title: string
  description?: string | null
  purpose: AssessmentPurpose
  instrumentType: AssessmentInstrumentType
  status: AssessmentStatus
  offeringId: string
  classId: string
  componentId: string
  academicPeriodId: string
  lessonId?: string | null
  teacherId: string
  scaleId?: string | null
  scaleType: AcademicAssessmentScaleType
  calculationMethod: AcademicCalculationMethod
  weight: number
  maximumScore?: number | null
  passingScore?: number | null
  scheduledAt?: string | null
  appliedAt?: string | null
  learningOutcomeIds: string[]
  criteria: AssessmentCriterion[]
  classificationScale: LearningClassification[]
  requiresHumanReview: true
  createdAt: string
  updatedAt: string
  metadata: Record<string, unknown>
}

export type StudentAssessmentResultStatus =
  | 'not_started'
  | 'in_progress'
  | 'submitted'
  | 'reviewed'
  | 'finalized'
  | 'absent'
  | 'excused'

export type StudentCriterionResult = {
  criterionId: string
  score?: number | null
  percentage?: number | null
  classification?: LearningClassificationCode | null
  feedback?: string | null
  evidenceIds: string[]
  metadata: Record<string, unknown>
}

export type StudentAssessmentResult = {
  id: string
  assessmentId: string
  studentId: string
  enrollmentId?: string | null
  classId: string
  academicPeriodId: string
  status: StudentAssessmentResultStatus
  rawScore?: number | null
  normalizedScore?: number | null
  percentage?: number | null
  concept?: string | null
  classification: LearningClassificationCode
  criterionResults: StudentCriterionResult[]
  learningOutcomeResults: Array<{
    learningOutcomeId: string
    percentage?: number | null
    classification: LearningClassificationCode
    evidenceIds: string[]
  }>
  teacherFeedback?: string | null
  recoveryRequired: boolean
  recompositionRequired: boolean
  reviewedBy?: string | null
  reviewedAt?: string | null
  finalizedBy?: string | null
  finalizedAt?: string | null
  createdAt: string
  updatedAt: string
  metadata: Record<string, unknown>
}

export type GradebookEntryType =
  | 'assessment'
  | 'recovery'
  | 'recomposition'
  | 'manual_adjustment'
  | 'final_grade'

export type GradebookEntry = {
  id: string
  studentId: string
  classId: string
  componentId: string
  academicPeriodId: string
  assessmentId?: string | null
  assessmentResultId?: string | null
  type: GradebookEntryType
  title: string
  value?: number | null
  percentage?: number | null
  concept?: string | null
  weight: number
  classification: LearningClassificationCode
  recordedBy: string
  recordedAt: string
  reason?: string | null
  supersedesEntryId?: string | null
  metadata: Record<string, unknown>
}

export type GradebookSummary = {
  studentId: string
  classId: string
  componentId: string
  academicPeriodId: string
  calculationMethod: AcademicCalculationMethod
  currentValue?: number | null
  currentPercentage?: number | null
  currentConcept?: string | null
  currentClassification: LearningClassificationCode
  assessmentCount: number
  recoveryCount: number
  recompositionCount: number
  trend: 'up' | 'down' | 'stable' | 'insufficient_data'
  requiresIntervention: boolean
  calculatedAt: string
  entryIds: string[]
}

export type DiagnosticAssessmentSummary = {
  assessmentId: string
  classId: string
  academicPeriodId: string
  totalStudents: number
  assessedStudents: number
  absentStudents: number
  classificationDistribution: Record<LearningClassificationCode, number>
  criticalLearningOutcomeIds: string[]
  priorityLearningOutcomeIds: string[]
  studentsRequiringRecovery: string[]
  studentsRequiringRecomposition: string[]
  generatedAt: string
}

export const DEFAULT_LEARNING_CLASSIFICATION_SCALE:
  LearningClassification[] = [
    {
      code: 'critical',
      label: 'Crítico',
      minimumPercentage: 0,
      maximumPercentage: 29.99,
      priority: 1,
    },
    {
      code: 'initial',
      label: 'Inicial',
      minimumPercentage: 30,
      maximumPercentage: 49.99,
      priority: 2,
    },
    {
      code: 'developing',
      label: 'Em desenvolvimento',
      minimumPercentage: 50,
      maximumPercentage: 69.99,
      priority: 3,
    },
    {
      code: 'adequate',
      label: 'Adequado',
      minimumPercentage: 70,
      maximumPercentage: 79.99,
      priority: 4,
    },
    {
      code: 'proficient',
      label: 'Proficiente',
      minimumPercentage: 80,
      maximumPercentage: 89.99,
      priority: 5,
    },
    {
      code: 'advanced',
      label: 'Avançado',
      minimumPercentage: 90,
      maximumPercentage: 100,
      priority: 6,
    },
  ]
