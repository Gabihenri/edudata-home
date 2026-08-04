import type {
  TeacherProfileDimension,
  TeacherProfileLevel,
  TeacherProfileRecommendation,
  TeacherProfileSource,
  TeacherProfileStatus,
} from '@/lib/eios/profile/teacher-profile.contract'

export const PEDAGOGICAL_IDENTITY_CONTRACT_VERSION =
  'pedagogical-identity-v1' as const

export type PedagogicalIdentityContractVersion =
  typeof PEDAGOGICAL_IDENTITY_CONTRACT_VERSION

export type PedagogicalIdentityStatus =
  TeacherProfileStatus

export type PedagogicalIdentityLevel =
  TeacherProfileLevel

export type PedagogicalIdentitySource =
  TeacherProfileSource
  | 'class_diary'
  | 'academy'
  | 'assessment'
  | 'observation'

export type PedagogicalIdentityRecord =
  Record<string, unknown>

export type PedagogicalIdentityProfessionalData = {
  displayName:
    string | null

  professionalTitle:
    string | null

  educationLevel:
    string | null

  initialEducation:
    string | null

  specializations:
    string[]

  certifications:
    string[]

  teachingAreas:
    string[]

  curriculumComponents:
    string[]

  teachingStages:
    string[]

  yearsOfExperience:
    number | null

  institutionName:
    string | null

  schoolName:
    string | null

  biography:
    string | null
}

export type PedagogicalIdentityPracticeSummary = {
  planningRecords:
    number

  objectiveRecords:
    number

  lessonRecords:
    number

  evidenceRecords:
    number

  taskRecords:
    number

  calendarRecords:
    number

  classDiaryRecords:
    number

  assessmentRecords:
    number

  observationRecords:
    number

  professionalDevelopmentRecords:
    number
}

export type PedagogicalIdentityCompetencyStatus =
  | 'not_assessed'
  | 'emerging'
  | 'developing'
  | 'consistent'
  | 'advanced'

export type PedagogicalIdentityCompetency = {
  id:
    string

  name:
    string

  description:
    string | null

  category:
    string | null

  status:
    PedagogicalIdentityCompetencyStatus

  score:
    number | null

  evidenceCount:
    number

  source:
    PedagogicalIdentitySource

  lastUpdatedAt:
    string | null
}

export type PedagogicalIdentityDevelopmentGoalStatus =
  | 'draft'
  | 'active'
  | 'paused'
  | 'completed'
  | 'cancelled'

export type PedagogicalIdentityDevelopmentGoal = {
  id:
    string

  title:
    string

  description:
    string | null

  status:
    PedagogicalIdentityDevelopmentGoalStatus

  progress:
    number

  targetDate:
    string | null

  competencyIds:
    string[]

  source:
    PedagogicalIdentitySource

  createdAt:
    string | null

  updatedAt:
    string | null
}

export type PedagogicalIdentityTimelineEventType =
  | 'profile_created'
  | 'profile_updated'
  | 'planning_created'
  | 'lesson_completed'
  | 'evidence_registered'
  | 'assessment_completed'
  | 'observation_completed'
  | 'competency_updated'
  | 'development_goal_created'
  | 'development_goal_completed'
  | 'training_completed'
  | 'score_updated'
  | 'recommendation_created'
  | 'recommendation_completed'

export type PedagogicalIdentityTimelineEvent = {
  id:
    string

  type:
    PedagogicalIdentityTimelineEventType

  title:
    string

  description:
    string | null

  occurredAt:
    string

  source:
    PedagogicalIdentitySource

  relatedEntityType:
    string | null

  relatedEntityId:
    string | null

  metadata:
    PedagogicalIdentityRecord
}

export type PedagogicalIdentityScoreSnapshot = {
  id:
    string

  ediScore:
    number

  level:
    PedagogicalIdentityLevel

  recordedAt:
    string

  source:
    PedagogicalIdentitySource

  dimensions:
    TeacherProfileDimension[]
}

export type PedagogicalIdentityEvolution = {
  currentScore:
    number

  previousScore:
    number | null

  variation:
    number | null

  variationPercentage:
    number | null

  trend:
    | 'up'
    | 'down'
    | 'stable'
    | 'unknown'

  last30Days:
    PedagogicalIdentityScoreSnapshot[]

  last6Months:
    PedagogicalIdentityScoreSnapshot[]

  last12Months:
    PedagogicalIdentityScoreSnapshot[]
}

export type PedagogicalIdentityMetadata = {
  contractVersion:
    PedagogicalIdentityContractVersion

  generatedAt:
    string

  status:
    PedagogicalIdentityStatus

  sources:
    PedagogicalIdentitySource[]

  dataQualityScore:
    number | null

  warnings:
    string[]

  containsSensitiveData:
    boolean

  automatedDecisionAllowed:
    false

  humanReviewRequired:
    boolean

  explainable:
    true
}

export type PedagogicalIdentity = {
  metadata:
    PedagogicalIdentityMetadata

  professional:
    PedagogicalIdentityProfessionalData

  ediScore:
    number

  level:
    PedagogicalIdentityLevel

  levelLabel:
    string

  summary:
    string

  practice:
    PedagogicalIdentityPracticeSummary

  dimensions:
    TeacherProfileDimension[]

  competencies:
    PedagogicalIdentityCompetency[]

  developmentGoals:
    PedagogicalIdentityDevelopmentGoal[]

  recommendations:
    TeacherProfileRecommendation[]

  evolution:
    PedagogicalIdentityEvolution

  timeline:
    PedagogicalIdentityTimelineEvent[]
}

export type CreatePedagogicalIdentityInput = {
  professional?:
    Partial<PedagogicalIdentityProfessionalData>

  competencies?:
    PedagogicalIdentityCompetency[]

  developmentGoals?:
    PedagogicalIdentityDevelopmentGoal[]

  scoreHistory?:
    PedagogicalIdentityScoreSnapshot[]

  timeline?:
    PedagogicalIdentityTimelineEvent[]
}

export type PedagogicalIdentityResult = {
  success:
    boolean

  identity:
    PedagogicalIdentity | null

  errors:
    string[]

  warnings:
    string[]
}

export function clampPedagogicalIdentityScore(
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

export function normalizePedagogicalIdentityProgress(
  value:
    number,
): number {
  return clampPedagogicalIdentityScore(
    value,
  )
}

export function createEmptyProfessionalData():
  PedagogicalIdentityProfessionalData {
  return {
    displayName:
      null,

    professionalTitle:
      null,

    educationLevel:
      null,

    initialEducation:
      null,

    specializations:
      [],

    certifications:
      [],

    teachingAreas:
      [],

    curriculumComponents:
      [],

    teachingStages:
      [],

    yearsOfExperience:
      null,

    institutionName:
      null,

    schoolName:
      null,

    biography:
      null,
  }
}

export function createEmptyPracticeSummary():
  PedagogicalIdentityPracticeSummary {
  return {
    planningRecords:
      0,

    objectiveRecords:
      0,

    lessonRecords:
      0,

    evidenceRecords:
      0,

    taskRecords:
      0,

    calendarRecords:
      0,

    classDiaryRecords:
      0,

    assessmentRecords:
      0,

    observationRecords:
      0,

    professionalDevelopmentRecords:
      0,
  }
}

export function createEmptyEvolution():
  PedagogicalIdentityEvolution {
  return {
    currentScore:
      0,

    previousScore:
      null,

    variation:
      null,

    variationPercentage:
      null,

    trend:
      'unknown',

    last30Days:
      [],

    last6Months:
      [],

    last12Months:
      [],
  }
}

export function createEmptyPedagogicalIdentity(
  warnings:
    string[] = [],
): PedagogicalIdentity {
  return {
    metadata: {
      contractVersion:
        PEDAGOGICAL_IDENTITY_CONTRACT_VERSION,

      generatedAt:
        new Date()
          .toISOString(),

      status:
        'empty',

      sources:
        [],

      dataQualityScore:
        null,

      warnings,

      containsSensitiveData:
        false,

      automatedDecisionAllowed:
        false,

      humanReviewRequired:
        false,

      explainable:
        true,
    },

    professional:
      createEmptyProfessionalData(),

    ediScore:
      0,

    level:
      'initial',

    levelLabel:
      'Inicial',

    summary:
      'A identidade pedagógica ainda não possui dados suficientes para uma análise completa.',

    practice:
      createEmptyPracticeSummary(),

    dimensions:
      [],

    competencies:
      [],

    developmentGoals:
      [],

    recommendations:
      [],

    evolution:
      createEmptyEvolution(),

    timeline:
      [],
  }
}