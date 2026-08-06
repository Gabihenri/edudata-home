/**
 * EduData IA — EIOS
 * Capability 04: Educational Analytics
 *
 * Contrato oficial de domínio do Educational Analytics Engine.
 *
 * Arquitetura preservada:
 *
 * Framework EDI
 * ↓
 * EIOS
 * ↓
 * Educational Analytics
 * ↓
 * Core Compartilhado
 * ↓
 * Produtos Especializados
 *
 * Este arquivo:
 * - define somente contratos e tipos;
 * - não executa cálculos;
 * - não acessa banco de dados;
 * - não contém componentes visuais;
 * - não produz decisões pedagógicas automáticas;
 * - preserva explicabilidade, privacidade e revisão humana;
 * - diferencia associação, correlação, predição e causalidade.
 */

export type AnalyticsMetadata =
  Record<string, unknown>

export type AnalyticsIdentifier =
  string

export type AnalyticsTimestamp =
  string

export type AnalyticsNullableTimestamp =
  string | null

export type AnalyticsScore =
  number | null

export type AnalyticsStatus =
  | 'draft'
  | 'queued'
  | 'processing'
  | 'completed'
  | 'completed_with_warnings'
  | 'failed'
  | 'cancelled'
  | 'archived'

export type AnalyticsType =
  | 'descriptive'
  | 'diagnostic'
  | 'correlational'
  | 'comparative'
  | 'longitudinal'
  | 'temporal'
  | 'spatial'
  | 'network'
  | 'influence'
  | 'pattern'
  | 'anomaly'
  | 'predictive'
  | 'prescriptive'
  | 'effectiveness'
  | 'research'
  | 'mixed'

export type AnalyticsCapability =
  | 'educational_analytics'
  | 'correlation_engine'
  | 'pattern_engine'
  | 'influence_engine'
  | 'prediction_engine'
  | 'recommendation_engine'
  | 'research_engine'

export type AnalyticsScope =
  | 'individual'
  | 'small_group'
  | 'subgroup'
  | 'class'
  | 'multiple_classes'
  | 'teacher'
  | 'school'
  | 'multiple_schools'
  | 'organization'
  | 'network'
  | 'region'
  | 'research_sample'

export type AnalyticsGranularity =
  | 'event'
  | 'lesson'
  | 'day'
  | 'week'
  | 'month'
  | 'bimester'
  | 'quarter'
  | 'semester'
  | 'academic_year'
  | 'custom'

export type AnalyticsSourceType =
  | 'evidence'
  | 'evidence_intelligence'
  | 'pedagogical_analysis'
  | 'pedagogical_intervention'
  | 'intervention_monitoring'
  | 'learning_graph'
  | 'planning'
  | 'lesson'
  | 'learning_objective'
  | 'skill'
  | 'competency'
  | 'indicator'
  | 'assessment'
  | 'assessment_result'
  | 'learning_result'
  | 'attendance'
  | 'behavior'
  | 'engagement'
  | 'group'
  | 'classroom_position'
  | 'external_event'
  | 'organization'
  | 'school'
  | 'class'
  | 'teacher'
  | 'student'
  | 'imported_dataset'
  | 'other'

export type AnalyticsEntityType =
  | 'student'
  | 'teacher'
  | 'class'
  | 'group'
  | 'school'
  | 'organization'
  | 'region'
  | 'planning'
  | 'lesson'
  | 'learning_objective'
  | 'skill'
  | 'competency'
  | 'evidence'
  | 'analysis'
  | 'intervention'
  | 'indicator'
  | 'assessment'
  | 'result'
  | 'external_event'
  | 'graph_node'
  | 'graph_edge'
  | 'dataset'
  | 'other'

export type AnalyticsMetricValueType =
  | 'integer'
  | 'decimal'
  | 'percentage'
  | 'proportion'
  | 'score'
  | 'duration'
  | 'count'
  | 'boolean'
  | 'category'
  | 'text'

export type AnalyticsAggregation =
  | 'none'
  | 'count'
  | 'sum'
  | 'mean'
  | 'median'
  | 'mode'
  | 'minimum'
  | 'maximum'
  | 'range'
  | 'variance'
  | 'standard_deviation'
  | 'percentile'
  | 'proportion'
  | 'rate'
  | 'weighted_mean'
  | 'custom'

export type AnalyticsDirection =
  | 'increasing'
  | 'decreasing'
  | 'stable'
  | 'oscillating'
  | 'mixed'
  | 'undetermined'

export type AnalyticsSeverity =
  | 'information'
  | 'low'
  | 'moderate'
  | 'high'
  | 'critical'

export type AnalyticsRiskLevel =
  | 'none'
  | 'low'
  | 'moderate'
  | 'high'
  | 'critical'
  | 'undetermined'

export type AnalyticsConfidenceLevel =
  | 'very_low'
  | 'low'
  | 'moderate'
  | 'high'
  | 'very_high'
  | 'undetermined'

export type AnalyticsEvidenceStrength =
  | 'insufficient'
  | 'weak'
  | 'moderate'
  | 'strong'
  | 'very_strong'
  | 'undetermined'

export type AnalyticsValidationStatus =
  | 'not_validated'
  | 'pending'
  | 'validated'
  | 'validated_with_restrictions'
  | 'rejected'

export type AnalyticsHumanDecision =
  | 'pending'
  | 'accepted'
  | 'adapted'
  | 'rejected'

export type AnalyticsCausalityStatus =
  | 'not_evaluated'
  | 'descriptive_only'
  | 'association_only'
  | 'correlation_only'
  | 'causal_hypothesis'
  | 'causal_analysis_required'
  | 'causal_relation_not_supported'
  | 'causal_relation_partially_supported'
  | 'causal_relation_supported'

export type AnalyticsCorrelationMethod =
  | 'pearson'
  | 'spearman'
  | 'kendall'
  | 'point_biserial'
  | 'phi'
  | 'cramers_v'
  | 'mutual_information'
  | 'partial_correlation'
  | 'cross_correlation'
  | 'custom'

export type AnalyticsCorrelationStrength =
  | 'negligible'
  | 'weak'
  | 'moderate'
  | 'strong'
  | 'very_strong'
  | 'undetermined'

export type AnalyticsPatternType =
  | 'trend'
  | 'recurrence'
  | 'cycle'
  | 'sequence'
  | 'cluster'
  | 'co_occurrence'
  | 'transition'
  | 'concentration'
  | 'dispersion'
  | 'reorganization'
  | 'group_formation'
  | 'group_fusion'
  | 'group_fragmentation'
  | 'behavioral_propagation'
  | 'learning_progression'
  | 'learning_regression'
  | 'external_event_response'
  | 'other'

export type AnalyticsAnomalyType =
  | 'point'
  | 'contextual'
  | 'collective'
  | 'temporal'
  | 'spatial'
  | 'network'
  | 'behavioral'
  | 'performance'
  | 'data_quality'
  | 'other'

export type AnalyticsInfluenceType =
  | 'direct'
  | 'indirect'
  | 'structural'
  | 'temporal'
  | 'spatial'
  | 'behavioral'
  | 'pedagogical'
  | 'social'
  | 'group'
  | 'teacher'
  | 'external_event'
  | 'undetermined'

export type AnalyticsPredictionType =
  | 'performance'
  | 'learning_progress'
  | 'learning_regression'
  | 'intervention_need'
  | 'intervention_effectiveness'
  | 'attendance_risk'
  | 'engagement_risk'
  | 'dropout_risk'
  | 'learning_gap'
  | 'group_reorganization'
  | 'behavioral_change'
  | 'other'

export type AnalyticsRecommendationType =
  | 'pedagogical'
  | 'methodological'
  | 'assessment'
  | 'recomposition'
  | 'inclusion'
  | 'monitoring'
  | 'organizational'
  | 'preventive'
  | 'corrective'
  | 'research'
  | 'data_quality'
  | 'governance'

export type AnalyticsResearchDesign =
  | 'exploratory'
  | 'descriptive'
  | 'correlational'
  | 'comparative'
  | 'longitudinal'
  | 'cross_sectional'
  | 'quasi_experimental'
  | 'experimental'
  | 'case_study'
  | 'mixed_methods'
  | 'network_analysis'
  | 'spatial_analysis'
  | 'time_series'
  | 'other'

export type AnalyticsPrivacyLevel =
  | 'public'
  | 'internal'
  | 'restricted'
  | 'confidential'
  | 'highly_restricted'

export type AnalyticsDataQualityDimension =
  | 'completeness'
  | 'consistency'
  | 'accuracy'
  | 'timeliness'
  | 'validity'
  | 'uniqueness'
  | 'representativeness'
  | 'traceability'

export type AnalyticsModelType =
  | 'deterministic'
  | 'statistical'
  | 'machine_learning'
  | 'rule_based'
  | 'graph_based'
  | 'hybrid'
  | 'human_defined'

export type AnalyticsModelLifecycleStatus =
  | 'development'
  | 'validation'
  | 'approved'
  | 'active'
  | 'monitoring'
  | 'deprecated'
  | 'suspended'
  | 'retired'

export interface AnalyticsTimeWindow {
  startAt: AnalyticsNullableTimestamp
  endAt: AnalyticsNullableTimestamp
  timezone: string | null
  granularity: AnalyticsGranularity
  academicYear: number | null
  academicPeriodIds: AnalyticsIdentifier[]
  comparisonStartAt: AnalyticsNullableTimestamp
  comparisonEndAt: AnalyticsNullableTimestamp
  metadata: AnalyticsMetadata
}

export interface AnalyticsEntityReference {
  id: AnalyticsIdentifier
  type: AnalyticsEntityType
  label: string | null
  sourceSystem: string | null
  sourceTable: string | null
  sourceField: string | null
  organizationId: AnalyticsIdentifier | null
  schoolId: AnalyticsIdentifier | null
  classIds: AnalyticsIdentifier[]
  groupIds: AnalyticsIdentifier[]
  metadata: AnalyticsMetadata
}

export interface AnalyticsSourceReference {
  id: AnalyticsIdentifier
  type: AnalyticsSourceType
  entityType: AnalyticsEntityType | null
  sourceSystem: string
  sourceTable: string | null
  sourceField: string | null
  sourceVersion: string | null
  observedAt: AnalyticsNullableTimestamp
  capturedAt: AnalyticsTimestamp
  checksum: string | null
  entityReferences: AnalyticsEntityReference[]
  metadata: AnalyticsMetadata
}

export interface AnalyticsContext {
  analysisId: AnalyticsIdentifier
  analysisKey: string
  title: string
  description: string | null
  type: AnalyticsType
  capability: AnalyticsCapability
  scope: AnalyticsScope
  organizationId: AnalyticsIdentifier | null
  schoolId: AnalyticsIdentifier | null
  ownerUserId: AnalyticsIdentifier | null
  requestedByUserId: AnalyticsIdentifier | null
  teacherIds: AnalyticsIdentifier[]
  studentIds: AnalyticsIdentifier[]
  classIds: AnalyticsIdentifier[]
  groupIds: AnalyticsIdentifier[]
  planningIds: AnalyticsIdentifier[]
  lessonIds: AnalyticsIdentifier[]
  learningObjectiveIds: AnalyticsIdentifier[]
  skillIds: AnalyticsIdentifier[]
  competencyIds: AnalyticsIdentifier[]
  evidenceIds: AnalyticsIdentifier[]
  interventionIds: AnalyticsIdentifier[]
  indicatorIds: AnalyticsIdentifier[]
  assessmentIds: AnalyticsIdentifier[]
  learningResultIds: AnalyticsIdentifier[]
  externalEventIds: AnalyticsIdentifier[]
  graphSnapshotIds: AnalyticsIdentifier[]
  timeWindow: AnalyticsTimeWindow
  tags: string[]
  metadata: AnalyticsMetadata
}

export interface AnalyticsVariableDefinition {
  id: AnalyticsIdentifier
  key: string
  label: string
  description: string | null
  entityType: AnalyticsEntityType
  sourceType: AnalyticsSourceType
  valueType: AnalyticsMetricValueType
  unit: string | null
  aggregation: AnalyticsAggregation
  role:
    | 'independent'
    | 'dependent'
    | 'control'
    | 'mediator'
    | 'moderator'
    | 'outcome'
    | 'exposure'
    | 'grouping'
    | 'temporal'
    | 'spatial'
    | 'other'
  nullable: boolean
  sensitive: boolean
  containsPersonalData: boolean
  containsMinorData: boolean
  categories: string[]
  validMinimum: number | null
  validMaximum: number | null
  transformation: string | null
  metadata: AnalyticsMetadata
}

export interface AnalyticsObservation {
  id: AnalyticsIdentifier
  entityId: AnalyticsIdentifier
  entityType: AnalyticsEntityType
  variableId: AnalyticsIdentifier
  numericValue: number | null
  textValue: string | null
  booleanValue: boolean | null
  categoryValue: string | null
  observedAt: AnalyticsNullableTimestamp
  recordedAt: AnalyticsTimestamp
  academicPeriodId: AnalyticsIdentifier | null
  classId: AnalyticsIdentifier | null
  groupId: AnalyticsIdentifier | null
  sourceReferences: AnalyticsSourceReference[]
  weight: number | null
  excluded: boolean
  exclusionReason: string | null
  metadata: AnalyticsMetadata
}

export interface AnalyticsMetricDefinition {
  id: AnalyticsIdentifier
  key: string
  label: string
  description: string | null
  valueType: AnalyticsMetricValueType
  unit: string | null
  aggregation: AnalyticsAggregation
  formula: string | null
  higherIsBetter: boolean | null
  minimumExpected: number | null
  maximumExpected: number | null
  targetValue: number | null
  warningThreshold: number | null
  criticalThreshold: number | null
  metadata: AnalyticsMetadata
}

export interface AnalyticsMetricResult {
  metricId: AnalyticsIdentifier
  entityId: AnalyticsIdentifier | null
  entityType: AnalyticsEntityType | null
  value: number | string | boolean | null
  numericValue: number | null
  previousValue: number | null
  absoluteChange: number | null
  relativeChange: number | null
  direction: AnalyticsDirection
  sampleSize: number
  validObservationCount: number
  missingObservationCount: number
  confidence: AnalyticsConfidence
  calculatedAt: AnalyticsTimestamp
  metadata: AnalyticsMetadata
}

export interface AnalyticsConfidence {
  value: AnalyticsScore
  level: AnalyticsConfidenceLevel
  evidenceStrength: AnalyticsEvidenceStrength
  sampleSize: number | null
  explanation: string | null
  method: string | null
  calculatedAt: AnalyticsNullableTimestamp
  requiresHumanReview: boolean
  metadata: AnalyticsMetadata
}

export interface AnalyticsStatisticalSignificance {
  evaluated: boolean
  testName: string | null
  statistic: number | null
  pValue: number | null
  alpha: number | null
  significant: boolean | null
  confidenceIntervalLower: number | null
  confidenceIntervalUpper: number | null
  degreesOfFreedom: number | null
  effectSize: number | null
  effectSizeMethod: string | null
  assumptionsMet: boolean | null
  assumptionWarnings: string[]
  metadata: AnalyticsMetadata
}

export interface AnalyticsCorrelationResult {
  id: AnalyticsIdentifier
  variableXId: AnalyticsIdentifier
  variableYId: AnalyticsIdentifier
  method: AnalyticsCorrelationMethod
  coefficient: number | null
  absoluteCoefficient: number | null
  strength: AnalyticsCorrelationStrength
  direction:
    | 'positive'
    | 'negative'
    | 'none'
    | 'undetermined'
  sampleSize: number
  missingPairCount: number
  significance: AnalyticsStatisticalSignificance
  confidence: AnalyticsConfidence
  causalityStatus: AnalyticsCausalityStatus
  controlVariableIds: AnalyticsIdentifier[]
  subgroupIds: AnalyticsIdentifier[]
  temporalLag: number | null
  temporalLagUnit: AnalyticsGranularity | null
  explanation: AnalyticsExplainability
  warnings: string[]
  metadata: AnalyticsMetadata
}

export interface AnalyticsPatternResult {
  id: AnalyticsIdentifier
  type: AnalyticsPatternType
  title: string
  description: string
  entityIds: AnalyticsIdentifier[]
  variableIds: AnalyticsIdentifier[]
  startAt: AnalyticsNullableTimestamp
  endAt: AnalyticsNullableTimestamp
  frequency: number | null
  recurrenceCount: number | null
  direction: AnalyticsDirection
  magnitude: number | null
  score: AnalyticsScore
  confidence: AnalyticsConfidence
  evidenceReferences: AnalyticsSourceReference[]
  requiresHumanReview: boolean
  explanation: AnalyticsExplainability
  metadata: AnalyticsMetadata
}

export interface AnalyticsAnomalyResult {
  id: AnalyticsIdentifier
  type: AnalyticsAnomalyType
  entityId: AnalyticsIdentifier | null
  entityType: AnalyticsEntityType | null
  variableId: AnalyticsIdentifier | null
  observedValue: number | null
  expectedValue: number | null
  deviation: number | null
  standardizedDeviation: number | null
  severity: AnalyticsSeverity
  detectedAt: AnalyticsTimestamp
  confidence: AnalyticsConfidence
  possibleExplanations: string[]
  evidenceReferences: AnalyticsSourceReference[]
  requiresHumanReview: boolean
  explanation: AnalyticsExplainability
  metadata: AnalyticsMetadata
}

export interface AnalyticsInfluencePath {
  id: AnalyticsIdentifier
  sourceEntityId: AnalyticsIdentifier
  targetEntityId: AnalyticsIdentifier
  nodeIds: AnalyticsIdentifier[]
  edgeIds: AnalyticsIdentifier[]
  pathLength: number
  weight: number | null
  confidence: AnalyticsConfidence
  direct: boolean
  temporal: boolean
  spatial: boolean
  validatedByHuman: boolean
  causalityStatus: AnalyticsCausalityStatus
  metadata: AnalyticsMetadata
}

export interface AnalyticsInfluenceResult {
  id: AnalyticsIdentifier
  type: AnalyticsInfluenceType
  sourceEntityId: AnalyticsIdentifier
  sourceEntityType: AnalyticsEntityType
  targetEntityIds: AnalyticsIdentifier[]
  targetEntityTypes: AnalyticsEntityType[]
  influenceScore: AnalyticsScore
  influenceDirection:
    | 'positive'
    | 'negative'
    | 'mixed'
    | 'neutral'
    | 'undetermined'
  radius: number | null
  affectedEntityCount: number
  propagationDepth: number | null
  paths: AnalyticsInfluencePath[]
  zoneEntityIds: AnalyticsIdentifier[]
  supportingCorrelationIds: AnalyticsIdentifier[]
  supportingPatternIds: AnalyticsIdentifier[]
  confidence: AnalyticsConfidence
  causalityStatus: AnalyticsCausalityStatus
  requiresHumanReview: boolean
  explanation: AnalyticsExplainability
  warnings: string[]
  metadata: AnalyticsMetadata
}

export interface AnalyticsPredictionClass {
  label: string
  probability: number
  rank: number
  metadata: AnalyticsMetadata
}

export interface AnalyticsPredictionResult {
  id: AnalyticsIdentifier
  type: AnalyticsPredictionType
  subjectEntityId: AnalyticsIdentifier
  subjectEntityType: AnalyticsEntityType
  predictedValue: number | string | boolean | null
  predictedNumericValue: number | null
  probability: number | null
  classes: AnalyticsPredictionClass[]
  riskLevel: AnalyticsRiskLevel
  predictionHorizon: number | null
  predictionHorizonUnit: AnalyticsGranularity | null
  validUntil: AnalyticsNullableTimestamp
  modelId: AnalyticsIdentifier | null
  modelVersion: string | null
  inputVariableIds: AnalyticsIdentifier[]
  confidence: AnalyticsConfidence
  uncertaintyLower: number | null
  uncertaintyUpper: number | null
  requiresHumanReview: boolean
  explanation: AnalyticsExplainability
  limitations: string[]
  metadata: AnalyticsMetadata
}

export interface AnalyticsRecommendationAction {
  id: AnalyticsIdentifier
  title: string
  description: string
  sequence: number
  responsibleRole: string | null
  plannedStartAt: AnalyticsNullableTimestamp
  plannedEndAt: AnalyticsNullableTimestamp
  expectedEvidenceIds: AnalyticsIdentifier[]
  indicatorIds: AnalyticsIdentifier[]
  successCriterionIds: AnalyticsIdentifier[]
  requiresTeacherDecision: boolean
  metadata: AnalyticsMetadata
}

export interface AnalyticsRecommendationResult {
  id: AnalyticsIdentifier
  type: AnalyticsRecommendationType
  title: string
  summary: string
  rationale: string
  priority:
    | 'low'
    | 'moderate'
    | 'high'
    | 'urgent'
    | 'critical'
  riskLevel: AnalyticsRiskLevel
  targetEntityIds: AnalyticsIdentifier[]
  sourceCorrelationIds: AnalyticsIdentifier[]
  sourcePatternIds: AnalyticsIdentifier[]
  sourceInfluenceIds: AnalyticsIdentifier[]
  sourcePredictionIds: AnalyticsIdentifier[]
  sourceInterventionIds: AnalyticsIdentifier[]
  actions: AnalyticsRecommendationAction[]
  confidence: AnalyticsConfidence
  teacherDecision: AnalyticsHumanDecision
  teacherDecisionRationale: string | null
  teacherDecidedAt: AnalyticsNullableTimestamp
  teacherDecidedBy: AnalyticsIdentifier | null
  requiresHumanReview: boolean
  explanation: AnalyticsExplainability
  limitations: string[]
  metadata: AnalyticsMetadata
}

export interface AnalyticsResearchQuestion {
  id: AnalyticsIdentifier
  question: string
  rationale: string | null
  primaryVariableIds: AnalyticsIdentifier[]
  secondaryVariableIds: AnalyticsIdentifier[]
  targetEntityTypes: AnalyticsEntityType[]
  metadata: AnalyticsMetadata
}

export interface AnalyticsResearchHypothesis {
  id: AnalyticsIdentifier
  type:
    | 'null'
    | 'alternative'
    | 'directional'
    | 'non_directional'
    | 'exploratory'
  statement: string
  variableIds: AnalyticsIdentifier[]
  expectedDirection: AnalyticsDirection
  generatedBy:
    | 'human'
    | 'engine'
    | 'hybrid'
  validationStatus: AnalyticsValidationStatus
  metadata: AnalyticsMetadata
}

export interface AnalyticsResearchResult {
  id: AnalyticsIdentifier
  title: string
  description: string
  design: AnalyticsResearchDesign
  questions: AnalyticsResearchQuestion[]
  hypotheses: AnalyticsResearchHypothesis[]
  populationDescription: string | null
  sampleDescription: string | null
  sampleSize: number
  inclusionCriteria: string[]
  exclusionCriteria: string[]
  methods: string[]
  variableIds: AnalyticsIdentifier[]
  correlationIds: AnalyticsIdentifier[]
  patternIds: AnalyticsIdentifier[]
  influenceIds: AnalyticsIdentifier[]
  predictionIds: AnalyticsIdentifier[]
  metricResults: AnalyticsMetricResult[]
  findings: string[]
  limitations: string[]
  futureQuestions: string[]
  reproducibility: AnalyticsReproducibility
  ethics: AnalyticsEthics
  privacy: AnalyticsPrivacy
  explanation: AnalyticsExplainability
  validationStatus: AnalyticsValidationStatus
  reviewedBy: AnalyticsIdentifier | null
  reviewedAt: AnalyticsNullableTimestamp
  metadata: AnalyticsMetadata
}

export interface AnalyticsExplainability {
  summary: string
  reasons: string[]
  rulesApplied: string[]
  variablesUsed: AnalyticsIdentifier[]
  sourceReferences: AnalyticsSourceReference[]
  assumptions: string[]
  limitations: string[]
  uncertaintyFactors: string[]
  alternativeExplanations: string[]
  causalityStatus: AnalyticsCausalityStatus
  generatedAt: AnalyticsTimestamp
  engineName: string | null
  engineVersion: string | null
  metadata: AnalyticsMetadata
}

export interface AnalyticsDataQualityScore {
  dimension: AnalyticsDataQualityDimension
  score: AnalyticsScore
  level:
    | 'unacceptable'
    | 'low'
    | 'moderate'
    | 'good'
    | 'excellent'
    | 'undetermined'
  issues: string[]
  affectedSourceIds: AnalyticsIdentifier[]
  metadata: AnalyticsMetadata
}

export interface AnalyticsDataQuality {
  overallScore: AnalyticsScore
  dimensions: AnalyticsDataQualityScore[]
  duplicateCount: number
  missingValueCount: number
  invalidValueCount: number
  excludedObservationCount: number
  warnings: string[]
  evaluatedAt: AnalyticsTimestamp
  metadata: AnalyticsMetadata
}

export interface AnalyticsPrivacy {
  level: AnalyticsPrivacyLevel
  containsPersonalData: boolean
  containsSensitiveData: boolean
  containsMinorData: boolean
  anonymized: boolean
  pseudonymized: boolean
  aggregated: boolean
  minimumGroupSize: number | null
  reidentificationRisk: AnalyticsRiskLevel
  lawfulBasis: string | null
  retentionPolicy: string | null
  accessRestrictions: string[]
  prohibitedUses: string[]
  notes: string | null
  metadata: AnalyticsMetadata
}

export interface AnalyticsEthics {
  humanOversightRequired: boolean
  professionalAutonomyPreserved: boolean
  automatedDecisionProhibited: boolean
  discriminationAssessmentRequired: boolean
  biasAssessmentRequired: boolean
  inclusionAssessmentRequired: boolean
  accessibilityAssessmentRequired: boolean
  humanSubjectsReviewRequired: boolean
  consentRequired: boolean
  consentVerified: boolean | null
  ethicalWarnings: string[]
  metadata: AnalyticsMetadata
}

export interface AnalyticsResearchEligibility {
  eligible: boolean
  longitudinalUseAllowed: boolean
  correlationUseAllowed: boolean
  predictionUseAllowed: boolean
  groupAnalysisAllowed: boolean
  subgroupAnalysisAllowed: boolean
  externalEventAnalysisAllowed: boolean
  zoneInfluenceAnalysisAllowed: boolean
  groupFormationAnalysisAllowed: boolean
  groupReorganizationAnalysisAllowed: boolean
  hypothesisGenerationAllowed: boolean
  causalInferenceAllowed: boolean
  anonymizationRequired: boolean
  aggregationRequired: boolean
  minimumGroupSize: number | null
  humanSubjectsReviewRequired: boolean
  restrictions: string[]
  notes: string | null
  metadata: AnalyticsMetadata
}

export interface AnalyticsReproducibility {
  reproducible: boolean
  deterministic: boolean
  randomSeed: string | null
  datasetVersion: string | null
  queryVersion: string | null
  codeVersion: string | null
  engineVersion: string | null
  rulesetVersion: string | null
  parameterSnapshot: AnalyticsMetadata
  sourceChecksums: string[]
  executedAt: AnalyticsTimestamp
  metadata: AnalyticsMetadata
}

export interface AnalyticsModelReference {
  id: AnalyticsIdentifier
  name: string
  version: string
  type: AnalyticsModelType
  lifecycleStatus: AnalyticsModelLifecycleStatus
  description: string | null
  owner: string | null
  trainingDataDescription: string | null
  validationDataDescription: string | null
  performanceMetrics: AnalyticsMetricResult[]
  approvedForUse: boolean
  approvedAt: AnalyticsNullableTimestamp
  approvedBy: AnalyticsIdentifier | null
  limitations: string[]
  prohibitedUses: string[]
  metadata: AnalyticsMetadata
}

export interface AnalyticsConfiguration {
  analysisTypes: AnalyticsType[]
  enabledCapabilities: AnalyticsCapability[]
  scope: AnalyticsScope
  timeWindow: AnalyticsTimeWindow
  variableDefinitions: AnalyticsVariableDefinition[]
  metricDefinitions: AnalyticsMetricDefinition[]
  correlationMethods: AnalyticsCorrelationMethod[]
  significanceLevel: number
  minimumSampleSize: number
  minimumGroupSize: number
  minimumConfidence: number
  maximumMissingProportion: number
  calculateCorrelations: boolean
  detectPatterns: boolean
  detectAnomalies: boolean
  calculateInfluence: boolean
  generatePredictions: boolean
  generateRecommendations: boolean
  generateResearchHypotheses: boolean
  requireHumanReview: boolean
  requireExplainability: boolean
  allowSensitiveAttributes: boolean
  allowCausalAnalysis: boolean
  includeArchivedData: boolean
  includeHistoricalVersions: boolean
  randomSeed: string | null
  metadata: AnalyticsMetadata
}

export interface AnalyticsTraceability {
  correlationId: string
  causationId: string | null
  requestId: string | null
  sessionId: string | null
  traceId: string | null
  sourceEventId: string | null
  parentAnalysisIds: AnalyticsIdentifier[]
  relatedAnalysisIds: AnalyticsIdentifier[]
  sourceGraphSnapshotIds: AnalyticsIdentifier[]
  sourceEvidenceIds: AnalyticsIdentifier[]
  sourceInterventionIds: AnalyticsIdentifier[]
  createdBy: AnalyticsIdentifier | null
  updatedBy: AnalyticsIdentifier | null
  reviewedBy: AnalyticsIdentifier | null
  metadata: AnalyticsMetadata
}

export interface AnalyticsVersion {
  id: AnalyticsIdentifier
  analysisKey: string
  versionNumber: number
  versionLabel: string
  status:
    | 'current'
    | 'superseded'
    | 'archived'
    | 'rejected'
  previousVersionId: AnalyticsIdentifier | null
  parentVersionId: AnalyticsIdentifier | null
  isCurrent: boolean
  createdAt: AnalyticsTimestamp
  createdBy: AnalyticsIdentifier | null
  changeReason: string | null
  changedFields: string[]
  metadata: AnalyticsMetadata
}

export interface AnalyticsEvent {
  id: AnalyticsIdentifier
  type:
    | 'analysis_requested'
    | 'analysis_started'
    | 'data_validated'
    | 'metric_calculated'
    | 'correlation_detected'
    | 'pattern_detected'
    | 'anomaly_detected'
    | 'influence_detected'
    | 'prediction_generated'
    | 'recommendation_generated'
    | 'research_hypothesis_generated'
    | 'human_review_requested'
    | 'human_review_completed'
    | 'analysis_completed'
    | 'analysis_failed'
    | 'analysis_archived'
  analysisId: AnalyticsIdentifier
  occurredAt: AnalyticsTimestamp
  actorId: AnalyticsIdentifier | null
  actorType:
    | 'user'
    | 'engine'
    | 'service'
    | 'system'
  payload: AnalyticsMetadata
  traceability: AnalyticsTraceability
  metadata: AnalyticsMetadata
}

export interface EducationalAnalyticsResult {
  id: AnalyticsIdentifier
  analysisKey: string
  context: AnalyticsContext
  configuration: AnalyticsConfiguration
  status: AnalyticsStatus
  sources: AnalyticsSourceReference[]
  observations: AnalyticsObservation[]
  metricResults: AnalyticsMetricResult[]
  correlations: AnalyticsCorrelationResult[]
  patterns: AnalyticsPatternResult[]
  anomalies: AnalyticsAnomalyResult[]
  influences: AnalyticsInfluenceResult[]
  predictions: AnalyticsPredictionResult[]
  recommendations: AnalyticsRecommendationResult[]
  researchResults: AnalyticsResearchResult[]
  dataQuality: AnalyticsDataQuality
  privacy: AnalyticsPrivacy
  ethics: AnalyticsEthics
  researchEligibility: AnalyticsResearchEligibility
  explainability: AnalyticsExplainability
  modelReferences: AnalyticsModelReference[]
  traceability: AnalyticsTraceability
  events: AnalyticsEvent[]
  version: AnalyticsVersion
  warnings: string[]
  errors: string[]
  generatedAt: AnalyticsTimestamp
  completedAt: AnalyticsNullableTimestamp
  archivedAt: AnalyticsNullableTimestamp
  metadata: AnalyticsMetadata
}

export interface BuildEducationalAnalyticsInput {
  context: AnalyticsContext
  configuration: AnalyticsConfiguration
  sources: AnalyticsSourceReference[]
  observations: AnalyticsObservation[]
  requestedByUserId: AnalyticsIdentifier | null
  correlationId: string
  causationId: string | null
  requestId: string | null
  sessionId: string | null
  traceId: string | null
  sourceEventId: string | null
  metadata: AnalyticsMetadata
}

export interface AnalyticsValidationIssue {
  code: string
  severity: AnalyticsSeverity
  message: string
  field: string | null
  entityId: AnalyticsIdentifier | null
  sourceId: AnalyticsIdentifier | null
  requiresHumanReview: boolean
  metadata: AnalyticsMetadata
}

export interface AnalyticsValidationResult {
  valid: boolean
  issues: AnalyticsValidationIssue[]
  sourceCount: number
  observationCount: number
  variableCount: number
  metricCount: number
  excludedObservationCount: number
  missingObservationCount: number
  generatedAt: AnalyticsTimestamp
  metadata: AnalyticsMetadata
}

export interface EducationalAnalyticsBuildResult {
  success: boolean
  analytics: EducationalAnalyticsResult | null
  validation: AnalyticsValidationResult
  warnings: string[]
  errors: string[]
  generatedAt: AnalyticsTimestamp
  correlationId: string
  metadata: AnalyticsMetadata
}

export interface AnalyticsReportSection {
  id: AnalyticsIdentifier
  title: string
  description: string | null
  order: number
  metricIds: AnalyticsIdentifier[]
  correlationIds: AnalyticsIdentifier[]
  patternIds: AnalyticsIdentifier[]
  anomalyIds: AnalyticsIdentifier[]
  influenceIds: AnalyticsIdentifier[]
  predictionIds: AnalyticsIdentifier[]
  recommendationIds: AnalyticsIdentifier[]
  researchResultIds: AnalyticsIdentifier[]
  narrative: string | null
  requiresHumanReview: boolean
  metadata: AnalyticsMetadata
}

export interface AnalyticsReport {
  id: AnalyticsIdentifier
  analysisId: AnalyticsIdentifier
  title: string
  subtitle: string | null
  summary: string
  audience:
    | 'teacher'
    | 'coordinator'
    | 'director'
    | 'supervision'
    | 'secretariat'
    | 'researcher'
    | 'public'
    | 'custom'
  sections: AnalyticsReportSection[]
  limitations: string[]
  ethicalWarnings: string[]
  privacyWarnings: string[]
  generatedAt: AnalyticsTimestamp
  generatedBy: AnalyticsIdentifier | null
  reviewedAt: AnalyticsNullableTimestamp
  reviewedBy: AnalyticsIdentifier | null
  approved: boolean
  exportFormats:
    Array<
      | 'json'
      | 'csv'
      | 'xlsx'
      | 'pdf'
      | 'html'
    >
  metadata: AnalyticsMetadata
}