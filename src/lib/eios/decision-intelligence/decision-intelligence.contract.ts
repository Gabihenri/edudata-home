export const DECISION_INTELLIGENCE_CONTRACT_VERSION =
  'decision-intelligence-v1' as const

export type DecisionIntelligenceContractVersion =
  typeof DECISION_INTELLIGENCE_CONTRACT_VERSION

export type DecisionRecord =
  Record<string, unknown>

export type DecisionStatus =
  | 'draft'
  | 'generated'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'expired'
  | 'archived'

export type DecisionType =
  | 'pedagogical_recommendation'
  | 'learning_risk'
  | 'attendance_risk'
  | 'engagement_risk'
  | 'performance_risk'
  | 'curriculum_gap'
  | 'assessment_review'
  | 'intervention'
  | 'recovery'
  | 'recomposition'
  | 'accessibility'
  | 'equity'
  | 'teacher_support'
  | 'class_support'
  | 'student_support'
  | 'institutional_support'
  | 'planning_adjustment'
  | 'lesson_adjustment'
  | 'resource_recommendation'
  | 'monitoring'
  | 'alert'
  | 'action_plan'
  | 'escalation'
  | 'human_review'
  | 'custom'

export type DecisionCategory =
  | 'learning'
  | 'teaching'
  | 'assessment'
  | 'attendance'
  | 'engagement'
  | 'participation'
  | 'behavior'
  | 'curriculum'
  | 'intervention'
  | 'recovery'
  | 'recomposition'
  | 'accessibility'
  | 'equity'
  | 'planning'
  | 'management'
  | 'governance'
  | 'data_quality'
  | 'privacy'
  | 'other'

export type DecisionPriority =
  | 'low'
  | 'medium'
  | 'high'
  | 'urgent'
  | 'critical'

export type DecisionSeverity =
  | 'informational'
  | 'low'
  | 'medium'
  | 'high'
  | 'critical'

export type DecisionConfidenceLevel =
  | 'unknown'
  | 'low'
  | 'medium'
  | 'high'
  | 'verified'

export type DecisionUrgency =
  | 'no_deadline'
  | 'monitor'
  | 'within_30_days'
  | 'within_15_days'
  | 'within_7_days'
  | 'within_72_hours'
  | 'immediate'

export type DecisionAudience =
  | 'student'
  | 'teacher'
  | 'coordinator'
  | 'school_management'
  | 'institutional_management'
  | 'family'
  | 'support_team'
  | 'multidisciplinary_team'
  | 'system_administrator'
  | 'researcher'
  | 'other'

export type DecisionSubjectType =
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
  | 'intervention'
  | 'event'
  | 'resource'
  | 'other'

export type DecisionSourceType =
  | 'evidence_intelligence'
  | 'knowledge_graph'
  | 'curriculum_intelligence'
  | 'academic_core'
  | 'semantic_engine'
  | 'agenda'
  | 'professor_digital'
  | 'analytics'
  | 'institutional_rule'
  | 'human_input'
  | 'external_system'
  | 'other'

export type DecisionGenerationMethod =
  | 'rule_based'
  | 'evidence_based'
  | 'graph_based'
  | 'statistical'
  | 'semantic'
  | 'hybrid'
  | 'human'
  | 'manual'

export type DecisionValidationMethod =
  | 'human_review'
  | 'rule_validation'
  | 'cross_evidence_validation'
  | 'institutional_validation'
  | 'automatic_validation'
  | 'not_validated'

export type DecisionFrameworkPillar =
  | 'evidence'
  | 'inclusion'
  | 'intelligence'

export type DecisionFrameworkDimension =
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
  | 'governance'
  | 'other'

export type DecisionRiskType =
  | 'learning'
  | 'attendance'
  | 'performance'
  | 'engagement'
  | 'participation'
  | 'behavior'
  | 'curriculum'
  | 'assessment'
  | 'intervention_failure'
  | 'recovery_failure'
  | 'accessibility'
  | 'equity'
  | 'dropout'
  | 'data_quality'
  | 'privacy'
  | 'operational'
  | 'other'

export type DecisionRiskLevel =
  | 'none'
  | 'low'
  | 'moderate'
  | 'high'
  | 'critical'

export type DecisionActionType =
  | 'observe'
  | 'monitor'
  | 'contact_student'
  | 'contact_family'
  | 'review_evidence'
  | 'review_assessment'
  | 'adjust_planning'
  | 'adjust_lesson'
  | 'create_intervention'
  | 'create_recovery_plan'
  | 'create_recomposition_plan'
  | 'provide_accessibility_support'
  | 'provide_teacher_support'
  | 'provide_learning_resource'
  | 'refer_support_team'
  | 'refer_management'
  | 'collect_more_evidence'
  | 'schedule_follow_up'
  | 'update_curriculum_alignment'
  | 'validate_data'
  | 'escalate'
  | 'close'
  | 'custom'

export type DecisionActionStatus =
  | 'pending'
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'blocked'
  | 'overdue'

export type DecisionOutcomeStatus =
  | 'not_started'
  | 'monitoring'
  | 'improved'
  | 'partially_improved'
  | 'unchanged'
  | 'worsened'
  | 'inconclusive'

export type DecisionVisibility =
  | 'private'
  | 'restricted'
  | 'institutional'
  | 'aggregated'
  | 'anonymous'
  | 'public'

export type DecisionSensitivity =
  | 'none'
  | 'personal'
  | 'academic'
  | 'behavioral'
  | 'health'
  | 'accessibility'
  | 'sensitive'
  | 'highly_sensitive'

export type DecisionSubjectReference = {
  subjectType:
    DecisionSubjectType

  subjectId:
    string

  role:
    | 'primary'
    | 'secondary'
    | 'context'
    | 'affected'
    | 'responsible'
    | 'observer'
    | 'other'

  metadata:
    DecisionRecord
}

export type DecisionEvidenceReference = {
  evidenceId:
    string

  relevance:
    number | null

  confidence:
    number | null

  supportsDecision:
    boolean

  contradictsDecision:
    boolean

  explanation:
    string | null

  metadata:
    DecisionRecord
}

export type DecisionConsolidationReference = {
  consolidationId:
    string

  relevance:
    number | null

  confidence:
    number | null

  explanation:
    string | null

  metadata:
    DecisionRecord
}

export type DecisionContradictionReference = {
  contradictionId:
    string

  severity:
    DecisionSeverity

  resolved:
    boolean

  impact:
    string | null

  metadata:
    DecisionRecord
}

export type DecisionKnowledgeGraphReference = {
  graphId:
    string | null

  nodeIds:
    string[]

  edgeIds:
    string[]

  pathIds:
    string[]

  relevance:
    number | null

  explanation:
    string | null

  metadata:
    DecisionRecord
}

export type DecisionCurriculumReference = {
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

  explanation:
    string | null

  metadata:
    DecisionRecord
}

export type DecisionFrameworkClassification = {
  pillar:
    DecisionFrameworkPillar

  dimensions:
    DecisionFrameworkDimension[]

  primaryDimension:
    DecisionFrameworkDimension

  confidence:
    number | null

  explanation:
    string

  classifiedBy:
    | 'human'
    | 'rule_engine'
    | 'decision_engine'
    | 'semantic_engine'
    | 'mixed'

  inferred:
    boolean

  humanReviewRequired:
    boolean

  metadata:
    DecisionRecord
}

export type DecisionRiskAssessment = {
  riskType:
    DecisionRiskType

  riskLevel:
    DecisionRiskLevel

  probability:
    number | null

  impact:
    number | null

  score:
    number | null

  severity:
    DecisionSeverity

  indicators:
    string[]

  protectiveFactors:
    string[]

  aggravatingFactors:
    string[]

  explanation:
    string

  calculatedAt:
    string

  calculatedBy:
    string | null

  humanReviewRequired:
    boolean

  metadata:
    DecisionRecord
}

export type DecisionRecommendation = {
  id:
    string

  title:
    string

  description:
    string

  actionType:
    DecisionActionType

  priority:
    DecisionPriority

  urgency:
    DecisionUrgency

  audience:
    DecisionAudience[]

  expectedOutcome:
    string | null

  rationale:
    string

  evidenceIds:
    string[]

  curriculumReferences:
    DecisionCurriculumReference[]

  confidence:
    number | null

  confidenceLevel:
    DecisionConfidenceLevel

  automaticallyGenerated:
    boolean

  requiresApproval:
    boolean

  approved:
    boolean

  approvedBy:
    string | null

  approvedAt:
    string | null

  metadata:
    DecisionRecord
}

export type DecisionAlert = {
  id:
    string

  title:
    string

  message:
    string

  severity:
    DecisionSeverity

  priority:
    DecisionPriority

  audience:
    DecisionAudience[]

  triggeredBy:
    string[]

  acknowledged:
    boolean

  acknowledgedBy:
    string | null

  acknowledgedAt:
    string | null

  expiresAt:
    string | null

  active:
    boolean

  metadata:
    DecisionRecord
}

export type DecisionAction = {
  id:
    string

  actionType:
    DecisionActionType

  title:
    string

  description:
    string | null

  status:
    DecisionActionStatus

  priority:
    DecisionPriority

  responsibleUserId:
    string | null

  responsibleRole:
    string | null

  startsAt:
    string | null

  dueAt:
    string | null

  completedAt:
    string | null

  dependsOnActionIds:
    string[]

  evidenceRequired:
    boolean

  evidenceIds:
    string[]

  expectedOutcome:
    string | null

  actualOutcome:
    string | null

  outcomeStatus:
    DecisionOutcomeStatus

  notes:
    string[]

  metadata:
    DecisionRecord
}

export type DecisionActionPlan = {
  id:
    string

  title:
    string

  description:
    string | null

  status:
    DecisionStatus

  priority:
    DecisionPriority

  subjectType:
    DecisionSubjectType

  subjectId:
    string

  objective:
    string

  actions:
    DecisionAction[]

  startsAt:
    string | null

  dueAt:
    string | null

  completedAt:
    string | null

  progress:
    number

  expectedOutcome:
    string | null

  actualOutcome:
    string | null

  outcomeStatus:
    DecisionOutcomeStatus

  createdAutomatically:
    boolean

  requiresApproval:
    boolean

  approved:
    boolean

  approvedBy:
    string | null

  approvedAt:
    string | null

  reviewFrequencyDays:
    number | null

  nextReviewAt:
    string | null

  metadata:
    DecisionRecord
}

export type DecisionRuleConditionOperator =
  | 'equals'
  | 'not_equals'
  | 'greater_than'
  | 'greater_than_or_equal'
  | 'less_than'
  | 'less_than_or_equal'
  | 'contains'
  | 'not_contains'
  | 'in'
  | 'not_in'
  | 'exists'
  | 'not_exists'
  | 'between'
  | 'changed'
  | 'trend_up'
  | 'trend_down'

export type DecisionRuleCondition = {
  id:
    string

  field:
    string

  operator:
    DecisionRuleConditionOperator

  value:
    unknown

  secondaryValue:
    unknown

  weight:
    number

  required:
    boolean

  explanation:
    string | null

  metadata:
    DecisionRecord
}

export type DecisionRuleOutcome = {
  decisionType:
    DecisionType

  category:
    DecisionCategory

  priority:
    DecisionPriority

  severity:
    DecisionSeverity

  urgency:
    DecisionUrgency

  title:
    string

  description:
    string

  recommendationTemplates:
    string[]

  actionTypes:
    DecisionActionType[]

  alert:
    boolean

  actionPlan:
    boolean

  requiresHumanReview:
    boolean

  metadata:
    DecisionRecord
}

export type DecisionRule = {
  id:
    string

  code:
    string

  name:
    string

  description:
    string | null

  active:
    boolean

  version:
    string

  source:
    DecisionSourceType

  subjectTypes:
    DecisionSubjectType[]

  categories:
    DecisionCategory[]

  conditions:
    DecisionRuleCondition[]

  minimumConditionScore:
    number

  outcome:
    DecisionRuleOutcome

  validFrom:
    string | null

  validUntil:
    string | null

  institutionId:
    string | null

  createdAt:
    string

  updatedAt:
    string

  createdBy:
    string | null

  updatedBy:
    string | null

  metadata:
    DecisionRecord
}

export type DecisionExplanation = {
  summary:
    string

  rationale:
    string

  supportingEvidence:
    string[]

  contradictions:
    string[]

  assumptions:
    string[]

  limitations:
    string[]

  alternatives:
    string[]

  confidenceExplanation:
    string | null

  humanReadable:
    boolean

  generatedAt:
    string

  metadata:
    DecisionRecord
}

export type DecisionPrivacyContext = {
  visibility:
    DecisionVisibility

  sensitivity:
    DecisionSensitivity

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
    DecisionRecord
}

export type DecisionAuditEntry = {
  id:
    string

  action:
    | 'created'
    | 'generated'
    | 'updated'
    | 'prioritized'
    | 'reviewed'
    | 'approved'
    | 'rejected'
    | 'started'
    | 'completed'
    | 'cancelled'
    | 'archived'
    | 'alerted'
    | 'escalated'
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
    DecisionStatus | null

  nextStatus:
    DecisionStatus | null

  description:
    string | null

  changes:
    DecisionRecord

  metadata:
    DecisionRecord
}

export type EducationalDecision = {
  id:
    string

  type:
    DecisionType

  category:
    DecisionCategory

  title:
    string

  description:
    string

  status:
    DecisionStatus

  priority:
    DecisionPriority

  severity:
    DecisionSeverity

  urgency:
    DecisionUrgency

  sourceType:
    DecisionSourceType

  generationMethod:
    DecisionGenerationMethod

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
    DecisionSubjectReference[]

  evidenceReferences:
    DecisionEvidenceReference[]

  consolidationReferences:
    DecisionConsolidationReference[]

  contradictionReferences:
    DecisionContradictionReference[]

  knowledgeGraphReferences:
    DecisionKnowledgeGraphReference[]

  curriculumReferences:
    DecisionCurriculumReference[]

  frameworkClassifications:
    DecisionFrameworkClassification[]

  risks:
    DecisionRiskAssessment[]

  recommendations:
    DecisionRecommendation[]

  alerts:
    DecisionAlert[]

  actionPlans:
    DecisionActionPlan[]

  confidence:
    number | null

  confidenceLevel:
    DecisionConfidenceLevel

  explanation:
    DecisionExplanation

  validationMethod:
    DecisionValidationMethod

  validated:
    boolean

  validatedBy:
    string | null

  validatedAt:
    string | null

  humanReviewRequired:
    boolean

  automaticExecutionAllowed:
    false

  causalClaimAllowed:
    false

  explainable:
    true

  privacy:
    DecisionPrivacyContext

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
    DecisionAuditEntry[]

  metadata:
    DecisionRecord
}

export type DecisionValidationIssue = {
  code:
    | 'missing_identifier'
    | 'missing_title'
    | 'missing_description'
    | 'missing_subject'
    | 'missing_evidence'
    | 'invalid_confidence'
    | 'invalid_priority'
    | 'invalid_status'
    | 'invalid_temporal_interval'
    | 'invalid_privacy_context'
    | 'missing_consent'
    | 'automatic_execution_not_allowed'
    | 'causal_claim_not_allowed'
    | 'unresolved_contradiction'
    | 'insufficient_evidence'
    | 'duplicate_decision'
    | 'invalid_action_plan'
    | 'invalid_rule'
    | 'inactive_reference'
    | 'other'

  severity:
    | 'warning'
    | 'error'

  decisionId:
    string | null

  field:
    string | null

  message:
    string
}

export type DecisionValidationResult = {
  valid:
    boolean

  decisionId:
    string | null

  issues:
    DecisionValidationIssue[]

  errors:
    string[]

  warnings:
    string[]

  requiresHumanReview:
    boolean
}

export type DecisionProcessingOptions = {
  validate:
    boolean

  evaluateRisks:
    boolean

  applyRules:
    boolean

  prioritize:
    boolean

  generateRecommendations:
    boolean

  generateAlerts:
    boolean

  generateActionPlans:
    boolean

  useKnowledgeGraph:
    boolean

  useCurriculumContext:
    boolean

  allowAutomaticApproval:
    boolean

  requireHumanReviewForSensitiveData:
    boolean

  requireHumanReviewForCriticalDecisions:
    boolean

  minimumConfidenceForAutomaticApproval:
    number

  maximumRecommendationsPerDecision:
    number

  maximumActionPlansPerDecision:
    number

  metadata:
    DecisionRecord
}

export type DecisionProcessingRequest = {
  requestId:
    string

  decisions:
    EducationalDecision[]

  rules:
    DecisionRule[]

  options:
    DecisionProcessingOptions

  requestedBy:
    string | null

  requestedAt:
    string

  metadata:
    DecisionRecord
}

export type DecisionRuleExecutionResult = {
  ruleId:
    string

  decisionId:
    string

  matched:
    boolean

  conditionScore:
    number

  matchedConditionIds:
    string[]

  failedConditionIds:
    string[]

  generatedDecisionType:
    DecisionType | null

  warnings:
    string[]

  errors:
    string[]

  metadata:
    DecisionRecord
}

export type DecisionProcessingResult = {
  success:
    boolean

  requestId:
    string

  decisions:
    EducationalDecision[]

  validationResults:
    DecisionValidationResult[]

  ruleExecutions:
    DecisionRuleExecutionResult[]

  recommendations:
    DecisionRecommendation[]

  alerts:
    DecisionAlert[]

  actionPlans:
    DecisionActionPlan[]

  warnings:
    string[]

  errors:
    string[]

  requiresHumanReview:
    boolean

  processedAt:
    string

  processingVersion:
    DecisionIntelligenceContractVersion
}

export type DecisionQuery = {
  decisionIds:
    string[]

  types:
    DecisionType[]

  categories:
    DecisionCategory[]

  statuses:
    DecisionStatus[]

  priorities:
    DecisionPriority[]

  severities:
    DecisionSeverity[]

  sourceTypes:
    DecisionSourceType[]

  subjectTypes:
    DecisionSubjectType[]

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

  evidenceId:
    string | null

  curriculumNodeId:
    string | null

  competencyId:
    string | null

  skillId:
    string | null

  minimumConfidence:
    number | null

  requiresHumanReview:
    boolean | null

  validated:
    boolean | null

  includeInactive:
    boolean

  startsAt:
    string | null

  endsAt:
    string | null

  limit:
    number

  offset:
    number

  metadata:
    DecisionRecord
}

export type DecisionQueryResult = {
  success:
    boolean

  decisions:
    EducationalDecision[]

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

export type DecisionIntelligenceContext = {
  contractVersion:
    DecisionIntelligenceContractVersion

  decisions:
    EducationalDecision[]

  rules:
    DecisionRule[]

  recommendations:
    DecisionRecommendation[]

  alerts:
    DecisionAlert[]

  actionPlans:
    DecisionActionPlan[]

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

  automaticExecutionAllowed:
    false

  causalClaimAllowed:
    false

  explainable:
    true

  metadata:
    DecisionRecord
}

export function clampDecisionConfidence(
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

export function clampDecisionPercentage(
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

export function getDecisionConfidenceLevel(
  confidence:
    number | null,
): DecisionConfidenceLevel {
  if (
    confidence ===
    null
  ) {
    return 'unknown'
  }

  const normalized =
    clampDecisionConfidence(
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

export function getDecisionPriorityWeight(
  priority:
    DecisionPriority,
): number {
  switch (
    priority
  ) {
    case 'critical':
      return 5

    case 'urgent':
      return 4

    case 'high':
      return 3

    case 'medium':
      return 2

    case 'low':
    default:
      return 1
  }
}

export function createDefaultDecisionProcessingOptions():
  DecisionProcessingOptions {
  return {
    validate:
      true,

    evaluateRisks:
      true,

    applyRules:
      true,

    prioritize:
      true,

    generateRecommendations:
      true,

    generateAlerts:
      true,

    generateActionPlans:
      true,

    useKnowledgeGraph:
      true,

    useCurriculumContext:
      true,

    allowAutomaticApproval:
      false,

    requireHumanReviewForSensitiveData:
      true,

    requireHumanReviewForCriticalDecisions:
      true,

    minimumConfidenceForAutomaticApproval:
      0.95,

    maximumRecommendationsPerDecision:
      5,

    maximumActionPlansPerDecision:
      3,

    metadata:
      {},
  }
}

export function createEmptyDecisionPrivacyContext():
  DecisionPrivacyContext {
  return {
    visibility:
      'restricted',

    sensitivity:
      'academic',

    containsPersonalData:
      false,

    containsSensitiveData:
      false,

    containsMinorData:
      false,

    anonymizationRequired:
      false,

    pseudonymizationRequired:
      false,

    consentRequired:
      false,

    consentConfirmed:
      false,

    legalBasis:
      null,

    retentionPolicy:
      null,

    retentionUntil:
      null,

    accessRoles:
      [],

    metadata:
      {},
  }
}

export function createEmptyDecisionExplanation():
  DecisionExplanation {
  return {
    summary:
      '',

    rationale:
      '',

    supportingEvidence:
      [],

    contradictions:
      [],

    assumptions:
      [],

    limitations:
      [],

    alternatives:
      [],

    confidenceExplanation:
      null,

    humanReadable:
      true,

    generatedAt:
      new Date()
        .toISOString(),

    metadata:
      {},
  }
}

export function createEmptyDecisionIntelligenceContext():
  DecisionIntelligenceContext {
  return {
    contractVersion:
      DECISION_INTELLIGENCE_CONTRACT_VERSION,

    decisions:
      [],

    rules:
      [],

    recommendations:
      [],

    alerts:
      [],

    actionPlans:
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

    automaticExecutionAllowed:
      false,

    causalClaimAllowed:
      false,

    explainable:
      true,

    metadata:
      {},
  }
}