export const EVIDENCE_INTELLIGENCE_CONTRACT_VERSION =
  'evidence-intelligence-v1' as const

export type EvidenceIntelligenceContractVersion =
  typeof EVIDENCE_INTELLIGENCE_CONTRACT_VERSION

export type EvidenceRecord =
  Record<string, unknown>

export type EvidenceStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'validated'
  | 'rejected'
  | 'superseded'
  | 'archived'

export type EvidenceType =
  | 'attendance'
  | 'absence'
  | 'assessment'
  | 'assessment_item'
  | 'grade'
  | 'activity'
  | 'assignment'
  | 'project'
  | 'portfolio'
  | 'observation'
  | 'participation'
  | 'engagement'
  | 'behavior'
  | 'interaction'
  | 'oral_production'
  | 'written_production'
  | 'practical_production'
  | 'laboratory_activity'
  | 'digital_activity'
  | 'self_assessment'
  | 'peer_assessment'
  | 'teacher_feedback'
  | 'student_feedback'
  | 'family_feedback'
  | 'intervention'
  | 'recovery_action'
  | 'recomposition_action'
  | 'accommodation'
  | 'accessibility_action'
  | 'learning_support'
  | 'academic_event'
  | 'contextual_event'
  | 'teacher_effort'
  | 'lesson_record'
  | 'planning_record'
  | 'curriculum_coverage'
  | 'competency_demonstration'
  | 'skill_demonstration'
  | 'learning_objective_progress'
  | 'document'
  | 'image'
  | 'audio'
  | 'video'
  | 'sensor_record'
  | 'external_record'
  | 'custom'

export type EvidenceSourceType =
  | 'agenda'
  | 'professor_digital'
  | 'academic_core'
  | 'semantic_engine'
  | 'curriculum_engine'
  | 'knowledge_graph'
  | 'assessment_system'
  | 'attendance_system'
  | 'learning_management_system'
  | 'student_information_system'
  | 'institutional_system'
  | 'teacher_manual_entry'
  | 'student_submission'
  | 'family_submission'
  | 'automatic_import'
  | 'external_integration'
  | 'sensor'
  | 'iot'
  | 'research'
  | 'other'

export type EvidenceModality =
  | 'structured_data'
  | 'text'
  | 'document'
  | 'image'
  | 'audio'
  | 'video'
  | 'spatial'
  | 'temporal_series'
  | 'semantic_vector'
  | 'sensor_data'
  | 'mixed'

export type EvidenceStrength =
  | 'inconclusive'
  | 'weak'
  | 'moderate'
  | 'strong'
  | 'very_strong'

export type EvidenceConfidenceLevel =
  | 'unknown'
  | 'low'
  | 'medium'
  | 'high'
  | 'verified'

export type EvidenceQualityLevel =
  | 'not_evaluated'
  | 'insufficient'
  | 'partial'
  | 'adequate'
  | 'high'

export type EvidenceFrameworkPillar =
  | 'evidence'
  | 'inclusion'
  | 'intelligence'

export type EvidenceFrameworkDimension =
  | 'learning'
  | 'teaching'
  | 'participation'
  | 'engagement'
  | 'attendance'
  | 'performance'
  | 'curriculum'
  | 'assessment'
  | 'intervention'
  | 'recovery'
  | 'recomposition'
  | 'accessibility'
  | 'equity'
  | 'context'
  | 'behavior'
  | 'interaction'
  | 'teacher_effort'
  | 'institutional_support'
  | 'decision_support'
  | 'other'

export type EvidenceSubjectType =
  | 'student'
  | 'student_group'
  | 'class'
  | 'teacher'
  | 'lesson'
  | 'planning'
  | 'component'
  | 'course'
  | 'program'
  | 'institution'
  | 'campus'
  | 'curriculum'
  | 'competency'
  | 'skill'
  | 'knowledge_object'
  | 'learning_objective'
  | 'assessment'
  | 'assessment_item'
  | 'intervention'
  | 'event'
  | 'resource'
  | 'other'

export type EvidenceVisibility =
  | 'private'
  | 'restricted'
  | 'institutional'
  | 'aggregated'
  | 'anonymous'
  | 'public'

export type EvidenceSensitivity =
  | 'none'
  | 'personal'
  | 'academic'
  | 'behavioral'
  | 'health'
  | 'accessibility'
  | 'sensitive'
  | 'highly_sensitive'

export type EvidenceValidationMethod =
  | 'manual_review'
  | 'cross_source_validation'
  | 'rule_based'
  | 'statistical_validation'
  | 'semantic_validation'
  | 'curriculum_validation'
  | 'document_validation'
  | 'automatic_validation'
  | 'not_validated'

export type EvidenceAggregationMethod =
  | 'count'
  | 'sum'
  | 'average'
  | 'weighted_average'
  | 'median'
  | 'minimum'
  | 'maximum'
  | 'latest'
  | 'trend'
  | 'proportion'
  | 'consensus'
  | 'rule_based'
  | 'custom'

export type EvidenceTemporalContext = {
  occurredAt:
    string | null

  recordedAt:
    string

  startsAt:
    string | null

  endsAt:
    string | null

  validFrom:
    string | null

  validUntil:
    string | null

  academicYear:
    number | null

  academicPeriodId:
    string | null

  sequence:
    number | null

  timezone:
    string | null

  metadata:
    EvidenceRecord
}

export type EvidenceSpatialContext = {
  institutionId:
    string | null

  campusId:
    string | null

  buildingId:
    string | null

  roomId:
    string | null

  classroomId:
    string | null

  classroomMapId:
    string | null

  seatId:
    string | null

  zoneId:
    string | null

  virtualEnvironmentId:
    string | null

  x:
    number | null

  y:
    number | null

  z:
    number | null

  latitude:
    number | null

  longitude:
    number | null

  coordinateSystem:
    string | null

  source:
    | 'manual'
    | 'classroom_map'
    | 'seat_assignment'
    | 'sensor'
    | 'camera'
    | 'gps'
    | 'virtual_platform'
    | 'inferred'
    | 'other'

  accuracy:
    number | null

  consentRequired:
    boolean

  consentConfirmed:
    boolean

  metadata:
    EvidenceRecord
}

export type EvidenceFileReference = {
  id:
    string

  fileName:
    string

  mimeType:
    string

  sizeBytes:
    number | null

  storageProvider:
    string | null

  storagePath:
    string | null

  publicUrl:
    string | null

  checksum:
    string | null

  modality:
    EvidenceModality

  containsPersonalData:
    boolean

  containsSensitiveData:
    boolean

  createdAt:
    string

  metadata:
    EvidenceRecord
}

export type EvidenceExternalReference = {
  system:
    string

  entityType:
    string

  entityId:
    string

  url:
    string | null

  importedAt:
    string | null

  metadata:
    EvidenceRecord
}

export type EvidenceSubjectReference = {
  subjectType:
    EvidenceSubjectType

  subjectId:
    string

  role:
    | 'primary'
    | 'secondary'
    | 'context'
    | 'observer'
    | 'author'
    | 'reviewer'
    | 'other'

  metadata:
    EvidenceRecord
}

export type EvidenceCurriculumReference = {
  frameworkId:
    string | null

  versionId:
    string | null

  curriculumNodeId:
    string | null

  competencyId:
    string | null

  skillId:
    string | null

  knowledgeObjectId:
    string | null

  learningObjectiveId:
    string | null

  alignmentConfidence:
    number | null

  alignmentExplanation:
    string | null

  inferred:
    boolean

  humanReviewRequired:
    boolean

  metadata:
    EvidenceRecord
}

export type EvidenceAssessmentReference = {
  assessmentId:
    string | null

  assessmentItemId:
    string | null

  attemptId:
    string | null

  score:
    number | null

  maximumScore:
    number | null

  normalizedScore:
    number | null

  grade:
    string | null

  rubricId:
    string | null

  rubricLevelId:
    string | null

  metadata:
    EvidenceRecord
}

export type EvidenceInterventionReference = {
  interventionId:
    string

  interventionType:
    string

  startsAt:
    string | null

  endsAt:
    string | null

  intendedOutcome:
    string | null

  resultEvidenceId:
    string | null

  metadata:
    EvidenceRecord
}

export type EvidenceFrameworkClassification = {
  pillar:
    EvidenceFrameworkPillar

  dimensions:
    EvidenceFrameworkDimension[]

  primaryDimension:
    EvidenceFrameworkDimension

  confidence:
    number | null

  explanation:
    string

  inferred:
    boolean

  classifiedBy:
    | 'human'
    | 'rule_engine'
    | 'semantic_engine'
    | 'evidence_engine'
    | 'mixed'

  humanReviewRequired:
    boolean

  metadata:
    EvidenceRecord
}

export type EvidenceQualityCriteria = {
  relevance:
    number | null

  reliability:
    number | null

  validity:
    number | null

  completeness:
    number | null

  timeliness:
    number | null

  consistency:
    number | null

  traceability:
    number | null

  objectivity:
    number | null

  representativeness:
    number | null

  accessibility:
    number | null

  metadata:
    EvidenceRecord
}

export type EvidenceQualityAssessment = {
  level:
    EvidenceQualityLevel

  overallScore:
    number | null

  criteria:
    EvidenceQualityCriteria

  strengths:
    string[]

  limitations:
    string[]

  missingInformation:
    string[]

  evaluatedAt:
    string | null

  evaluatedBy:
    string | null

  evaluationMethod:
    | 'human'
    | 'automatic'
    | 'mixed'
    | 'not_evaluated'

  humanReviewRequired:
    boolean

  metadata:
    EvidenceRecord
}

export type EvidenceReliabilityAssessment = {
  confidence:
    number | null

  confidenceLevel:
    EvidenceConfidenceLevel

  strength:
    EvidenceStrength

  sourceReliability:
    number | null

  internalConsistency:
    number | null

  corroborationCount:
    number

  contradictionCount:
    number

  verified:
    boolean

  verifiedBy:
    string | null

  verifiedAt:
    string | null

  validationMethod:
    EvidenceValidationMethod

  explanation:
    string | null

  limitations:
    string[]

  humanReviewRequired:
    boolean

  metadata:
    EvidenceRecord
}

export type EvidencePrivacyContext = {
  visibility:
    EvidenceVisibility

  sensitivity:
    EvidenceSensitivity

  containsPersonalData:
    boolean

  containsSensitiveData:
    boolean

  containsMinorData:
    boolean

  anonymizationRequired:
    boolean

  pseudonymizationRequired:
    boolean

  consentRequired:
    boolean

  consentConfirmed:
    boolean

  legalBasis:
    string | null

  retentionPolicy:
    string | null

  retentionUntil:
    string | null

  accessRoles:
    string[]

  metadata:
    EvidenceRecord
}

export type EvidenceAuditEntry = {
  id:
    string

  action:
    | 'created'
    | 'updated'
    | 'submitted'
    | 'classified'
    | 'validated'
    | 'rejected'
    | 'consolidated'
    | 'linked'
    | 'unlinked'
    | 'anonymized'
    | 'exported'
    | 'archived'
    | 'restored'
    | 'other'

  actorId:
    string | null

  actorType:
    | 'user'
    | 'system'
    | 'service'
    | 'agent'
    | 'integration'
    | 'unknown'

  occurredAt:
    string

  previousStatus:
    EvidenceStatus | null

  nextStatus:
    EvidenceStatus | null

  description:
    string | null

  changes:
    EvidenceRecord

  metadata:
    EvidenceRecord
}

export type EducationalEvidence = {
  id:
    string

  type:
    EvidenceType

  title:
    string

  description:
    string | null

  status:
    EvidenceStatus

  sourceType:
    EvidenceSourceType

  sourceId:
    string | null

  organizationId:
    string | null

  institutionId:
    string | null

  campusId:
    string | null

  programId:
    string | null

  courseId:
    string | null

  componentId:
    string | null

  offeringId:
    string | null

  classId:
    string | null

  lessonId:
    string | null

  planningId:
    string | null

  teacherId:
    string | null

  studentId:
    string | null

  studentGroupId:
    string | null

  academicPeriodId:
    string | null

  subjects:
    EvidenceSubjectReference[]

  curriculumReferences:
    EvidenceCurriculumReference[]

  assessmentReference:
    EvidenceAssessmentReference | null

  interventionReferences:
    EvidenceInterventionReference[]

  frameworkClassifications:
    EvidenceFrameworkClassification[]

  modalities:
    EvidenceModality[]

  value:
    unknown

  unit:
    string | null

  normalizedValue:
    number | null

  textualContent:
    string | null

  temporalContext:
    EvidenceTemporalContext

  spatialContext:
    EvidenceSpatialContext | null

  files:
    EvidenceFileReference[]

  externalReferences:
    EvidenceExternalReference[]

  relatedEvidenceIds:
    string[]

  supersedesEvidenceId:
    string | null

  supersededByEvidenceId:
    string | null

  quality:
    EvidenceQualityAssessment

  reliability:
    EvidenceReliabilityAssessment

  privacy:
    EvidencePrivacyContext

  knowledgeGraphNodeId:
    string | null

  knowledgeGraphEdgeIds:
    string[]

  version:
    number

  active:
    boolean

  createdAt:
    string

  updatedAt:
    string

  createdBy:
    string | null

  updatedBy:
    string | null

  auditTrail:
    EvidenceAuditEntry[]

  metadata:
    EvidenceRecord
}

export type EvidenceConsolidationGroup = {
  id:
    string

  name:
    string

  description:
    string | null

  evidenceIds:
    string[]

  subjectType:
    EvidenceSubjectType

  subjectId:
    string

  curriculumReference:
    EvidenceCurriculumReference | null

  startsAt:
    string | null

  endsAt:
    string | null

  aggregationMethod:
    EvidenceAggregationMethod

  weights:
    Record<string, number>

  minimumEvidenceCount:
    number

  excludeRejectedEvidence:
    boolean

  excludeSupersededEvidence:
    boolean

  metadata:
    EvidenceRecord
}

export type EvidenceConsolidatedResult = {
  id:
    string

  consolidationGroupId:
    string

  subjectType:
    EvidenceSubjectType

  subjectId:
    string

  evidenceIds:
    string[]

  evidenceCount:
    number

  validEvidenceCount:
    number

  rejectedEvidenceCount:
    number

  normalizedValue:
    number | null

  strength:
    EvidenceStrength

  confidence:
    number | null

  confidenceLevel:
    EvidenceConfidenceLevel

  qualityLevel:
    EvidenceQualityLevel

  trend:
    | 'strong_decline'
    | 'decline'
    | 'stable'
    | 'growth'
    | 'strong_growth'
    | 'insufficient_data'

  consistency:
    number | null

  coverage:
    number | null

  explanation:
    string

  limitations:
    string[]

  warnings:
    string[]

  requiresHumanReview:
    boolean

  calculatedAt:
    string

  calculationVersion:
    string

  metadata:
    EvidenceRecord
}

export type EvidenceContradiction = {
  id:
    string

  evidenceIdA:
    string

  evidenceIdB:
    string

  contradictionType:
    | 'value'
    | 'classification'
    | 'temporal'
    | 'subject'
    | 'curriculum'
    | 'source'
    | 'status'
    | 'other'

  severity:
    | 'low'
    | 'medium'
    | 'high'
    | 'critical'

  explanation:
    string

  resolvableAutomatically:
    boolean

  resolution:
    string | null

  resolved:
    boolean

  resolvedBy:
    string | null

  resolvedAt:
    string | null

  requiresHumanReview:
    boolean

  metadata:
    EvidenceRecord
}

export type EvidenceValidationIssue = {
  code:
    | 'missing_identifier'
    | 'missing_title'
    | 'missing_source'
    | 'missing_subject'
    | 'invalid_temporal_context'
    | 'invalid_spatial_context'
    | 'invalid_confidence'
    | 'invalid_normalized_value'
    | 'invalid_privacy_context'
    | 'missing_consent'
    | 'invalid_curriculum_reference'
    | 'invalid_assessment_reference'
    | 'invalid_status'
    | 'duplicate_evidence'
    | 'circular_supersession'
    | 'inactive_reference'
    | 'other'

  severity:
    | 'warning'
    | 'error'

  evidenceId:
    string | null

  field:
    string | null

  message:
    string
}

export type EvidenceValidationResult = {
  valid:
    boolean

  evidenceId:
    string | null

  issues:
    EvidenceValidationIssue[]

  errors:
    string[]

  warnings:
    string[]

  requiresHumanReview:
    boolean
}

export type EvidenceProcessingOptions = {
  validate:
    boolean

  classifyFramework:
    boolean

  evaluateQuality:
    boolean

  evaluateReliability:
    boolean

  detectContradictions:
    boolean

  consolidate:
    boolean

  linkKnowledgeGraph:
    boolean

  allowAutomaticValidation:
    boolean

  allowAutomaticClassification:
    boolean

  requireHumanReviewForSensitiveData:
    boolean

  minimumConfidenceForAutomaticValidation:
    number

  metadata:
    EvidenceRecord
}

export type EvidenceProcessingRequest = {
  requestId:
    string

  evidence:
    EducationalEvidence[]

  consolidationGroups:
    EvidenceConsolidationGroup[]

  options:
    EvidenceProcessingOptions

  requestedBy:
    string | null

  requestedAt:
    string

  metadata:
    EvidenceRecord
}

export type EvidenceKnowledgeGraphLink = {
  evidenceId:
    string

  nodeId:
    string | null

  edgeIds:
    string[]

  success:
    boolean

  warnings:
    string[]

  errors:
    string[]

  metadata:
    EvidenceRecord
}

export type EvidenceProcessingResult = {
  success:
    boolean

  requestId:
    string

  evidence:
    EducationalEvidence[]

  validationResults:
    EvidenceValidationResult[]

  consolidations:
    EvidenceConsolidatedResult[]

  contradictions:
    EvidenceContradiction[]

  knowledgeGraphLinks:
    EvidenceKnowledgeGraphLink[]

  warnings:
    string[]

  errors:
    string[]

  requiresHumanReview:
    boolean

  processedAt:
    string

  processingVersion:
    EvidenceIntelligenceContractVersion
}

export type EvidenceQuery = {
  evidenceIds:
    string[]

  types:
    EvidenceType[]

  statuses:
    EvidenceStatus[]

  sourceTypes:
    EvidenceSourceType[]

  pillars:
    EvidenceFrameworkPillar[]

  dimensions:
    EvidenceFrameworkDimension[]

  subjectTypes:
    EvidenceSubjectType[]

  organizationId:
    string | null

  institutionId:
    string | null

  campusId:
    string | null

  programId:
    string | null

  courseId:
    string | null

  componentId:
    string | null

  offeringId:
    string | null

  classId:
    string | null

  lessonId:
    string | null

  planningId:
    string | null

  teacherId:
    string | null

  studentId:
    string | null

  studentGroupId:
    string | null

  curriculumNodeId:
    string | null

  competencyId:
    string | null

  skillId:
    string | null

  assessmentId:
    string | null

  interventionId:
    string | null

  startsAt:
    string | null

  endsAt:
    string | null

  minimumConfidence:
    number | null

  minimumQualityScore:
    number | null

  includeInactive:
    boolean

  includeRejected:
    boolean

  includeSuperseded:
    boolean

  includeSensitiveData:
    boolean

  limit:
    number

  offset:
    number

  metadata:
    EvidenceRecord
}

export type EvidenceQueryResult = {
  success:
    boolean

  evidence:
    EducationalEvidence[]

  total:
    number

  limit:
    number

  offset:
    number

  warnings:
    string[]

  errors:
    string[]

  requiresHumanReview:
    boolean
}

export type EvidenceIntelligenceContext = {
  contractVersion:
    EvidenceIntelligenceContractVersion

  evidence:
    EducationalEvidence[]

  consolidationGroups:
    EvidenceConsolidationGroup[]

  consolidations:
    EvidenceConsolidatedResult[]

  contradictions:
    EvidenceContradiction[]

  knowledgeGraphLinks:
    EvidenceKnowledgeGraphLink[]

  generatedAt:
    string

  containsPersonalData:
    boolean

  containsSensitiveData:
    boolean

  anonymizationRequired:
    boolean

  consentRequired:
    boolean

  humanReviewRequired:
    boolean

  automatedDecisionAllowed:
    false

  causalClaimAllowed:
    false

  explainable:
    true

  metadata:
    EvidenceRecord
}

export function clampEvidenceConfidence(
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

export function clampEvidencePercentage(
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

export function getEvidenceConfidenceLevel(
  confidence:
    number | null,
): EvidenceConfidenceLevel {
  if (
    confidence ===
    null
  ) {
    return 'unknown'
  }

  const normalized =
    clampEvidenceConfidence(
      confidence,
    )

  if (
    normalized >=
    0.98
  ) {
    return 'verified'
  }

  if (
    normalized >=
    0.85
  ) {
    return 'high'
  }

  if (
    normalized >=
    0.65
  ) {
    return 'medium'
  }

  if (
    normalized >
    0
  ) {
    return 'low'
  }

  return 'unknown'
}

export function getEvidenceStrength(
  confidence:
    number | null,
): EvidenceStrength {
  if (
    confidence ===
    null
  ) {
    return 'inconclusive'
  }

  const normalized =
    clampEvidenceConfidence(
      confidence,
    )

  if (
    normalized >=
    0.9
  ) {
    return 'very_strong'
  }

  if (
    normalized >=
    0.75
  ) {
    return 'strong'
  }

  if (
    normalized >=
    0.55
  ) {
    return 'moderate'
  }

  if (
    normalized >
    0
  ) {
    return 'weak'
  }

  return 'inconclusive'
}

export function createEmptyEvidenceQualityCriteria():
  EvidenceQualityCriteria {
  return {
    relevance:
      null,

    reliability:
      null,

    validity:
      null,

    completeness:
      null,

    timeliness:
      null,

    consistency:
      null,

    traceability:
      null,

    objectivity:
      null,

    representativeness:
      null,

    accessibility:
      null,

    metadata:
      {},
  }
}

export function createDefaultEvidenceProcessingOptions():
  EvidenceProcessingOptions {
  return {
    validate:
      true,

    classifyFramework:
      true,

    evaluateQuality:
      true,

    evaluateReliability:
      true,

    detectContradictions:
      true,

    consolidate:
      true,

    linkKnowledgeGraph:
      true,

    allowAutomaticValidation:
      false,

    allowAutomaticClassification:
      true,

    requireHumanReviewForSensitiveData:
      true,

    minimumConfidenceForAutomaticValidation:
      0.9,

    metadata:
      {},
  }
}

export function createEmptyEvidenceIntelligenceContext():
  EvidenceIntelligenceContext {
  return {
    contractVersion:
      EVIDENCE_INTELLIGENCE_CONTRACT_VERSION,

    evidence:
      [],

    consolidationGroups:
      [],

    consolidations:
      [],

    contradictions:
      [],

    knowledgeGraphLinks:
      [],

    generatedAt:
      new Date()
        .toISOString(),

    containsPersonalData:
      false,

    containsSensitiveData:
      false,

    anonymizationRequired:
      false,

    consentRequired:
      false,

    humanReviewRequired:
      false,

    automatedDecisionAllowed:
      false,

    causalClaimAllowed:
      false,

    explainable:
      true,

    metadata:
      {},
  }
}