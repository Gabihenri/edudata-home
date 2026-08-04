import type {
  AcademicEducationLevel,
  AcademicLearningOutcomeSource,
  AcademicLearningOutcomeType,
} from '@/lib/eios/academic/academic-learning.contract'

export const CURRICULUM_INTELLIGENCE_CONTRACT_VERSION =
  'curriculum-intelligence-v1' as const

export type CurriculumIntelligenceContractVersion =
  typeof CURRICULUM_INTELLIGENCE_CONTRACT_VERSION

export type CurriculumRecord =
  Record<string, unknown>

export type CurriculumStatus =
  | 'draft'
  | 'under_review'
  | 'active'
  | 'superseded'
  | 'revoked'
  | 'archived'

export type CurriculumFrameworkType =
  | 'international'
  | 'national'
  | 'state'
  | 'municipal'
  | 'network'
  | 'institutional'
  | 'program'
  | 'course'
  | 'school'
  | 'teacher'
  | 'corporate'
  | 'custom'

export type CurriculumTerritoryLevel =
  | 'global'
  | 'country'
  | 'state'
  | 'municipality'
  | 'education_network'
  | 'institution'
  | 'campus'
  | 'school'
  | 'program'
  | 'course'
  | 'offering'

export type CurriculumNodeType =
  | 'framework'
  | 'version'
  | 'education_stage'
  | 'education_level'
  | 'area'
  | 'field'
  | 'program'
  | 'course'
  | 'component'
  | 'unit'
  | 'topic'
  | 'knowledge_object'
  | 'competency'
  | 'skill'
  | 'learning_outcome'
  | 'graduate_profile'
  | 'professional_standard'
  | 'accreditation_requirement'
  | 'assessment_criterion'
  | 'custom'

export type CurriculumRelationType =
  | 'belongs_to'
  | 'contains'
  | 'part_of'
  | 'equivalent_to'
  | 'complements'
  | 'unfolds'
  | 'replaces'
  | 'supersedes'
  | 'derived_from'
  | 'aligned_with'
  | 'prerequisite_of'
  | 'corequisite_of'
  | 'precedes'
  | 'follows'
  | 'supports'
  | 'assessed_by'
  | 'evidenced_by'
  | 'priority_for_recovery'
  | 'interdisciplinary_with'
  | 'related_to'

export type CurriculumCoverageStatus =
  | 'not_planned'
  | 'planned'
  | 'in_progress'
  | 'worked'
  | 'assessed'
  | 'evidenced'
  | 'consolidated'
  | 'needs_recovery'
  | 'not_applicable'

export type CurriculumPriority =
  | 'optional'
  | 'recommended'
  | 'essential'
  | 'mandatory'
  | 'critical'

export type CurriculumDifficultyLevel =
  | 'not_estimated'
  | 'introductory'
  | 'basic'
  | 'intermediate'
  | 'advanced'
  | 'specialized'

export type CurriculumImportSourceType =
  | 'manual'
  | 'spreadsheet'
  | 'csv'
  | 'json'
  | 'xml'
  | 'api'
  | 'pdf'
  | 'official_portal'
  | 'integration'
  | 'other'

export type CurriculumImportStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'completed_with_warnings'
  | 'failed'
  | 'cancelled'

export type CurriculumAlignmentStatus =
  | 'unmapped'
  | 'suggested'
  | 'reviewed'
  | 'validated'
  | 'rejected'

export type CurriculumIntelligenceConfidence =
  | 'unknown'
  | 'low'
  | 'medium'
  | 'high'
  | 'verified'

export type CurriculumFramework = {
  id:
    string

  code:
    string | null

  name:
    string

  shortName:
    string | null

  description:
    string | null

  type:
    CurriculumFrameworkType

  source:
    AcademicLearningOutcomeSource

  educationLevels:
    AcademicEducationLevel[]

  countryCode:
    string | null

  stateCode:
    string | null

  municipalityCode:
    string | null

  organizationId:
    string | null

  institutionId:
    string | null

  official:
    boolean

  sourceUrl:
    string | null

  publisher:
    string | null

  status:
    CurriculumStatus

  metadata:
    CurriculumRecord
}

export type CurriculumVersion = {
  id:
    string

  frameworkId:
    string

  code:
    string | null

  name:
    string

  version:
    string

  description:
    string | null

  validFrom:
    string | null

  validUntil:
    string | null

  publishedAt:
    string | null

  importedAt:
    string | null

  sourceHash:
    string | null

  previousVersionId:
    string | null

  nextVersionId:
    string | null

  status:
    CurriculumStatus

  metadata:
    CurriculumRecord
}

export type CurriculumTerritory = {
  id:
    string

  frameworkId:
    string

  versionId:
    string

  level:
    CurriculumTerritoryLevel

  countryCode:
    string | null

  stateCode:
    string | null

  municipalityCode:
    string | null

  organizationId:
    string | null

  institutionId:
    string | null

  campusId:
    string | null

  schoolId:
    string | null

  programId:
    string | null

  courseId:
    string | null

  name:
    string

  active:
    boolean

  metadata:
    CurriculumRecord
}

export type CurriculumNode = {
  id:
    string

  frameworkId:
    string

  versionId:
    string

  territoryId:
    string | null

  parentNodeId:
    string | null

  type:
    CurriculumNodeType

  outcomeType:
    AcademicLearningOutcomeType | null

  code:
    string | null

  localCode:
    string | null

  title:
    string

  description:
    string | null

  educationLevel:
    AcademicEducationLevel | null

  stageCode:
    string | null

  gradeCode:
    string | null

  componentCode:
    string | null

  programId:
    string | null

  courseId:
    string | null

  componentId:
    string | null

  sequence:
    number | null

  workloadHours:
    number | null

  credits:
    number | null

  masteryThreshold:
    number | null

  priority:
    CurriculumPriority

  difficulty:
    CurriculumDifficultyLevel

  validFrom:
    string | null

  validUntil:
    string | null

  active:
    boolean

  metadata:
    CurriculumRecord
}

export type CurriculumRelation = {
  id:
    string

  frameworkId:
    string

  versionId:
    string

  sourceNodeId:
    string

  targetNodeId:
    string

  type:
    CurriculumRelationType

  confidence:
    number | null

  confidenceLevel:
    CurriculumIntelligenceConfidence

  explanation:
    string | null

  evidenceIds:
    string[]

  validated:
    boolean

  validatedBy:
    string | null

  validatedAt:
    string | null

  causalClaimAllowed:
    false

  active:
    boolean

  metadata:
    CurriculumRecord
}

export type CurriculumEquivalence = {
  id:
    string

  sourceFrameworkId:
    string

  sourceVersionId:
    string

  sourceNodeId:
    string

  targetFrameworkId:
    string

  targetVersionId:
    string

  targetNodeId:
    string

  relation:
    | 'equivalent'
    | 'partial_equivalence'
    | 'broader_than'
    | 'narrower_than'
    | 'related'

  confidence:
    number

  status:
    CurriculumAlignmentStatus

  explanation:
    string

  reviewedBy:
    string | null

  reviewedAt:
    string | null

  metadata:
    CurriculumRecord
}

export type CurriculumSequence = {
  id:
    string

  frameworkId:
    string

  versionId:
    string

  name:
    string

  description:
    string | null

  educationLevel:
    AcademicEducationLevel | null

  componentId:
    string | null

  nodeIds:
    string[]

  mandatory:
    boolean

  estimatedWorkloadHours:
    number | null

  metadata:
    CurriculumRecord
}

export type CurriculumMethodologyReference = {
  id:
    string

  curriculumNodeId:
    string

  title:
    string

  description:
    string | null

  methodologyType:
    string

  educationLevels:
    AcademicEducationLevel[]

  estimatedDurationMinutes:
    number | null

  resourceIds:
    string[]

  evidenceIds:
    string[]

  source:
    AcademicLearningOutcomeSource

  active:
    boolean

  metadata:
    CurriculumRecord
}

export type CurriculumResourceReference = {
  id:
    string

  curriculumNodeId:
    string

  title:
    string

  description:
    string | null

  type:
    | 'document'
    | 'book'
    | 'article'
    | 'video'
    | 'simulation'
    | 'experiment'
    | 'dataset'
    | 'software'
    | 'website'
    | 'lesson_plan'
    | 'assessment'
    | 'rubric'
    | 'other'

  url:
    string | null

  storagePath:
    string | null

  official:
    boolean

  active:
    boolean

  metadata:
    CurriculumRecord
}

export type CurriculumApplicabilityContext = {
  institutionId:
    string | null

  campusId:
    string | null

  schoolId:
    string | null

  programId:
    string | null

  courseId:
    string | null

  curriculumMatrixId:
    string | null

  componentId:
    string | null

  offeringId:
    string | null

  classId:
    string | null

  academicPeriodId:
    string | null

  educationLevel:
    AcademicEducationLevel | null

  countryCode:
    string | null

  stateCode:
    string | null

  municipalityCode:
    string | null

  academicYear:
    number | null

  metadata:
    CurriculumRecord
}

export type CurriculumApplicabilityRule = {
  id:
    string

  frameworkId:
    string

  versionId:
    string

  territoryId:
    string | null

  priority:
    number

  context:
    CurriculumApplicabilityContext

  mandatory:
    boolean

  active:
    boolean

  explanation:
    string | null

  metadata:
    CurriculumRecord
}

export type CurriculumResolvedFramework = {
  frameworkId:
    string

  versionId:
    string

  territoryId:
    string | null

  priority:
    number

  mandatory:
    boolean

  source:
    AcademicLearningOutcomeSource

  explanation:
    string

  confidence:
    number

  requiresHumanReview:
    boolean
}

export type CurriculumResolutionInput = {
  context:
    CurriculumApplicabilityContext

  requestedFrameworkIds?:
    string[]

  requestedVersionIds?:
    string[]

  includeInherited:
    boolean

  includeOptional:
    boolean
}

export type CurriculumResolutionResult = {
  success:
    boolean

  resolvedFrameworks:
    CurriculumResolvedFramework[]

  primaryFramework:
    CurriculumResolvedFramework | null

  warnings:
    string[]

  errors:
    string[]

  requiresHumanReview:
    boolean
}

export type CurriculumCoverageRecord = {
  id:
    string

  frameworkId:
    string

  versionId:
    string

  curriculumNodeId:
    string

  institutionId:
    string | null

  programId:
    string | null

  courseId:
    string | null

  offeringId:
    string | null

  classId:
    string | null

  componentId:
    string | null

  academicPeriodId:
    string

  planningIds:
    string[]

  lessonIds:
    string[]

  assessmentIds:
    string[]

  evidenceIds:
    string[]

  interventionIds:
    string[]

  status:
    CurriculumCoverageStatus

  plannedCount:
    number

  lessonCount:
    number

  assessmentCount:
    number

  evidenceCount:
    number

  interventionCount:
    number

  averagePerformance:
    number | null

  masteryPercentage:
    number | null

  firstPlannedAt:
    string | null

  firstWorkedAt:
    string | null

  lastWorkedAt:
    string | null

  lastAssessedAt:
    string | null

  lastEvidencedAt:
    string | null

  dataQuality:
    | 'complete'
    | 'partial'
    | 'insufficient'
    | 'not_evaluated'

  metadata:
    CurriculumRecord
}

export type CurriculumCoverageSummary = {
  totalNodes:
    number

  mandatoryNodes:
    number

  plannedNodes:
    number

  workedNodes:
    number

  assessedNodes:
    number

  evidencedNodes:
    number

  consolidatedNodes:
    number

  recoveryNodes:
    number

  plannedPercentage:
    number

  workedPercentage:
    number

  assessedPercentage:
    number

  evidencedPercentage:
    number

  consolidatedPercentage:
    number
}

export type CurriculumGap = {
  id:
    string

  curriculumNodeId:
    string

  type:
    | 'not_planned'
    | 'not_worked'
    | 'not_assessed'
    | 'not_evidenced'
    | 'low_performance'
    | 'missing_prerequisite'
    | 'sequence_break'
    | 'coverage_delay'

  severity:
    | 'low'
    | 'medium'
    | 'high'
    | 'critical'

  explanation:
    string

  recommendedAction:
    string | null

  requiresHumanReview:
    boolean

  metadata:
    CurriculumRecord
}

export type CurriculumRecommendation = {
  id:
    string

  curriculumNodeId:
    string | null

  type:
    | 'planning'
    | 'sequence'
    | 'assessment'
    | 'evidence'
    | 'recovery'
    | 'resource'
    | 'alignment'
    | 'review'

  priority:
    CurriculumPriority

  title:
    string

  description:
    string

  reason:
    string

  expectedImpact:
    string | null

  actionLabel:
    string | null

  actionHref:
    string | null

  confidence:
    number | null

  requiresConfirmation:
    true

  automaticExecutionAllowed:
    false

  metadata:
    CurriculumRecord
}

export type CurriculumImportJob = {
  id:
    string

  frameworkId:
    string | null

  versionId:
    string | null

  sourceType:
    CurriculumImportSourceType

  sourceName:
    string

  sourceUrl:
    string | null

  sourceFileName:
    string | null

  status:
    CurriculumImportStatus

  startedAt:
    string | null

  completedAt:
    string | null

  totalRecords:
    number

  processedRecords:
    number

  importedRecords:
    number

  ignoredRecords:
    number

  failedRecords:
    number

  warnings:
    string[]

  errors:
    string[]

  importedBy:
    string

  metadata:
    CurriculumRecord
}

export type CurriculumImportMapping = {
  id:
    string

  importJobId:
    string

  sourceField:
    string

  targetField:
    string

  nodeType:
    CurriculumNodeType | null

  transformation:
    | 'direct'
    | 'normalized'
    | 'lookup'
    | 'composite'
    | 'custom'

  transformationExpression:
    string | null

  required:
    boolean

  metadata:
    CurriculumRecord
}

export type CurriculumVersionChange = {
  id:
    string

  frameworkId:
    string

  previousVersionId:
    string

  currentVersionId:
    string

  sourceNodeId:
    string | null

  targetNodeId:
    string | null

  type:
    | 'created'
    | 'updated'
    | 'renamed'
    | 'moved'
    | 'split'
    | 'merged'
    | 'replaced'
    | 'revoked'
    | 'unchanged'

  description:
    string

  impactLevel:
    | 'none'
    | 'low'
    | 'medium'
    | 'high'

  requiresMigration:
    boolean

  metadata:
    CurriculumRecord
}

export type CurriculumIntelligenceSnapshot = {
  id:
    string

  frameworkId:
    string

  versionId:
    string

  context:
    CurriculumApplicabilityContext

  recordedAt:
    string

  coverage:
    CurriculumCoverageSummary

  gapIds:
    string[]

  recommendationIds:
    string[]

  dataQualityScore:
    number | null

  calculationVersion:
    string

  metadata:
    CurriculumRecord
}

export type CurriculumIntelligenceMetadata = {
  contractVersion:
    CurriculumIntelligenceContractVersion

  generatedAt:
    string

  status:
    CurriculumStatus

  dataQuality:
    | 'complete'
    | 'partial'
    | 'insufficient'
    | 'not_evaluated'

  warnings:
    string[]

  containsPersonalData:
    false

  containsSensitiveData:
    false

  automatedDecisionAllowed:
    false

  causalClaimAllowed:
    false

  humanReviewRequired:
    boolean

  explainable:
    true
}

export type CurriculumIntelligenceContext = {
  metadata:
    CurriculumIntelligenceMetadata

  frameworks:
    CurriculumFramework[]

  versions:
    CurriculumVersion[]

  territories:
    CurriculumTerritory[]

  nodes:
    CurriculumNode[]

  relations:
    CurriculumRelation[]

  equivalences:
    CurriculumEquivalence[]

  sequences:
    CurriculumSequence[]

  methodologyReferences:
    CurriculumMethodologyReference[]

  resources:
    CurriculumResourceReference[]

  applicabilityRules:
    CurriculumApplicabilityRule[]

  coverageRecords:
    CurriculumCoverageRecord[]

  gaps:
    CurriculumGap[]

  recommendations:
    CurriculumRecommendation[]

  importJobs:
    CurriculumImportJob[]

  importMappings:
    CurriculumImportMapping[]

  versionChanges:
    CurriculumVersionChange[]

  snapshots:
    CurriculumIntelligenceSnapshot[]
}

export type CurriculumIntelligenceResult = {
  success:
    boolean

  context:
    CurriculumIntelligenceContext | null

  errors:
    string[]

  warnings:
    string[]
}

export function clampCurriculumPercentage(
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

export function clampCurriculumConfidence(
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
    1,
    Math.max(
      0,
      Math.round(
        value *
          10000,
      ) /
        10000,
    ),
  )
}

export function createEmptyCurriculumCoverageSummary():
  CurriculumCoverageSummary {
  return {
    totalNodes:
      0,

    mandatoryNodes:
      0,

    plannedNodes:
      0,

    workedNodes:
      0,

    assessedNodes:
      0,

    evidencedNodes:
      0,

    consolidatedNodes:
      0,

    recoveryNodes:
      0,

    plannedPercentage:
      0,

    workedPercentage:
      0,

    assessedPercentage:
      0,

    evidencedPercentage:
      0,

    consolidatedPercentage:
      0,
  }
}

export function createEmptyCurriculumIntelligenceContext():
  CurriculumIntelligenceContext {
  return {
    metadata: {
      contractVersion:
        CURRICULUM_INTELLIGENCE_CONTRACT_VERSION,

      generatedAt:
        new Date()
          .toISOString(),

      status:
        'draft',

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

    frameworks:
      [],

    versions:
      [],

    territories:
      [],

    nodes:
      [],

    relations:
      [],

    equivalences:
      [],

    sequences:
      [],

    methodologyReferences:
      [],

    resources:
      [],

    applicabilityRules:
      [],

    coverageRecords:
      [],

    gaps:
      [],

    recommendations:
      [],

    importJobs:
      [],

    importMappings:
      [],

    versionChanges:
      [],

    snapshots:
      [],
  }
}