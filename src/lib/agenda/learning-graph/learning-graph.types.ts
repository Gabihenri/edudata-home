/**
 * EduData IA — EIOS
 * Capability 03: Learning Graph
 *
 * Contrato oficial do grafo educacional compartilhado.
 *
 * Arquitetura:
 * Framework EDI
 * → EIOS
 * → Core Compartilhado
 * → Produtos Especializados
 *
 * O Learning Graph conecta entidades educacionais sem substituir
 * os registros operacionais que permanecem como fontes de verdade.
 *
 * Regras:
 * - não contém acesso ao banco;
 * - não contém componentes visuais;
 * - não duplica regras dos produtos;
 * - preserva temporalidade, explicabilidade e rastreabilidade;
 * - permite anonimização e agregação;
 * - não transforma correlação em causalidade automaticamente;
 * - decisões pedagógicas permanecem sob responsabilidade humana.
 */

export type LearningGraphMetadata =
  Record<string, unknown>

export type LearningGraphCapability =
  | 'evidence_intelligence'
  | 'pedagogical_copilot'
  | 'learning_graph'
  | 'educational_analytics'
  | 'organizational_intelligence'
  | 'research_intelligence'

export type LearningGraphSourceProduct =
  | 'agenda_inteligente_edi'
  | 'professor_digital'
  | 'edudata_analytics'
  | 'sgpa'
  | 'edudata_academy'
  | 'observatorio'
  | 'backoffice'
  | 'experience_manager'
  | 'eios_core'
  | 'external_system'

export type LearningGraphNodeType =
  | 'user'
  | 'teacher'
  | 'student'
  | 'professional'
  | 'organization'
  | 'school'
  | 'class'
  | 'group'
  | 'subgroup'
  | 'planning'
  | 'lesson'
  | 'learning_objective'
  | 'skill'
  | 'competency'
  | 'curriculum_reference'
  | 'evidence'
  | 'evidence_intelligence_run'
  | 'pedagogical_analysis'
  | 'pedagogical_intervention'
  | 'intervention_action'
  | 'intervention_checkpoint'
  | 'indicator'
  | 'success_criterion'
  | 'assessment'
  | 'assessment_result'
  | 'learning_result'
  | 'progress_record'
  | 'methodology'
  | 'resource'
  | 'external_event'
  | 'academic_period'
  | 'location'
  | 'research_cohort'
  | 'hypothesis'
  | 'custom'

export type LearningGraphNodeStatus =
  | 'active'
  | 'inactive'
  | 'draft'
  | 'pending'
  | 'completed'
  | 'archived'
  | 'superseded'
  | 'cancelled'
  | 'unknown'

export type LearningGraphRelationType =
  | 'belongs_to'
  | 'contains'
  | 'member_of'
  | 'teaches'
  | 'learns_in'
  | 'responsible_for'
  | 'planned_for'
  | 'derived_from'
  | 'executed_in'
  | 'addresses'
  | 'develops'
  | 'assesses'
  | 'produces'
  | 'documents'
  | 'supports'
  | 'requires'
  | 'precedes'
  | 'follows'
  | 'depends_on'
  | 'contributes_to'
  | 'influences'
  | 'is_influenced_by'
  | 'correlates_with'
  | 'associated_with'
  | 'indicates'
  | 'measures'
  | 'evaluates'
  | 'results_in'
  | 'improves'
  | 'worsens'
  | 'maintains'
  | 'responds_to'
  | 'triggered_by'
  | 'recommends'
  | 'intervenes_on'
  | 'monitors'
  | 'validates'
  | 'reviews'
  | 'accepts'
  | 'adapts'
  | 'rejects'
  | 'replaces'
  | 'supersedes'
  | 'similar_to'
  | 'part_of'
  | 'aggregated_from'
  | 'anonymized_from'
  | 'located_in'
  | 'occurred_during'
  | 'affected_by_external_event'
  | 'forms_group_with'
  | 'migrated_to_group'
  | 'merged_with_group'
  | 'split_from_group'
  | 'supports_hypothesis'
  | 'contradicts_hypothesis'
  | 'custom'

export type LearningGraphRelationDirection =
  | 'directed'
  | 'bidirectional'
  | 'undirected'

export type LearningGraphEvidenceLevel =
  | 'none'
  | 'weak'
  | 'moderate'
  | 'strong'
  | 'very_strong'
  | 'undetermined'

export type LearningGraphConfidenceLevel =
  | 'very_low'
  | 'low'
  | 'moderate'
  | 'high'
  | 'very_high'
  | 'undetermined'

export type LearningGraphCausalityStatus =
  | 'not_evaluated'
  | 'correlation_only'
  | 'possible_causal_relation'
  | 'supported_causal_relation'
  | 'rejected_causal_relation'
  | 'inconclusive'

export type LearningGraphTemporalStatus =
  | 'current'
  | 'historical'
  | 'planned'
  | 'projected'
  | 'expired'
  | 'unknown'

export type LearningGraphPrivacyLevel =
  | 'public'
  | 'internal'
  | 'restricted'
  | 'sensitive'
  | 'highly_sensitive'

export type LearningGraphAggregationLevel =
  | 'individual'
  | 'small_group'
  | 'subgroup'
  | 'class'
  | 'multiple_classes'
  | 'school'
  | 'organization'
  | 'network'
  | 'research_cohort'

export type LearningGraphHumanReviewStatus =
  | 'not_required'
  | 'pending'
  | 'in_review'
  | 'approved'
  | 'approved_with_changes'
  | 'changes_requested'
  | 'rejected'

export type LearningGraphChangeType =
  | 'created'
  | 'updated'
  | 'activated'
  | 'deactivated'
  | 'archived'
  | 'superseded'
  | 'validated'
  | 'invalidated'
  | 'merged'
  | 'split'
  | 'recalculated'

export type LearningGraphActorType =
  | 'system'
  | 'teacher'
  | 'student'
  | 'coordinator'
  | 'director'
  | 'supervisor'
  | 'administrator'
  | 'researcher'
  | 'service'
  | 'external_system'

export type LearningGraphEntityReference = {
  entityType:
    LearningGraphNodeType

  entityId: string

  graphNodeId?: string | null

  label?: string | null

  sourceSystem?: string | null

  sourceProduct?:
    LearningGraphSourceProduct | null

  organizationId?: string | null

  schoolId?: string | null

  metadata?:
    LearningGraphMetadata
}

export type LearningGraphTimeInterval = {
  validFrom: string | null

  validUntil: string | null

  observedAt: string | null

  recordedAt: string

  temporalStatus:
    LearningGraphTemporalStatus

  academicYear?: number | null

  academicPeriodId?: string | null

  timezone?: string | null
}

export type LearningGraphScore = {
  value: number | null

  level:
    LearningGraphConfidenceLevel

  explanation: string | null

  calculatedAt: string | null

  method: string | null

  engineName: string | null

  engineVersion: string | null

  requiresHumanReview: boolean

  metadata:
    LearningGraphMetadata
}

export type LearningGraphProvenance = {
  sourceType:
    | 'database_record'
    | 'user_input'
    | 'evidence'
    | 'assessment'
    | 'analytics'
    | 'engine'
    | 'inference'
    | 'integration'
    | 'research'
    | 'external_event'

  sourceId: string | null

  sourceTable: string | null

  sourceField: string | null

  sourceSystem: string

  sourceProduct:
    LearningGraphSourceProduct

  capability:
    LearningGraphCapability

  capturedAt: string

  observedAt: string | null

  importedAt: string | null

  createdBy: string | null

  checksum: string | null

  metadata:
    LearningGraphMetadata
}

export type LearningGraphExplainability = {
  summary: string

  reasons: string[]

  evidenceReferences:
    LearningGraphEntityReference[]

  rulesApplied: string[]

  assumptions: string[]

  limitations: string[]

  uncertaintyFactors: string[]

  alternativeExplanations: string[]

  humanInterpretationRequired:
    boolean

  causalityStatus:
    LearningGraphCausalityStatus

  generatedAt: string

  engineName: string | null

  engineVersion: string | null

  metadata:
    LearningGraphMetadata
}

export type LearningGraphPrivacy = {
  level:
    LearningGraphPrivacyLevel

  containsPersonalData: boolean

  containsSensitiveData: boolean

  containsMinorData: boolean

  anonymized: boolean

  pseudonymized: boolean

  aggregated: boolean

  aggregationLevel:
    LearningGraphAggregationLevel

  minimumGroupSize:
    number | null

  legalBasis: string | null

  retentionPolicy: string | null

  accessRestrictions: string[]

  prohibitedUses: string[]

  notes: string | null
}

export type LearningGraphResearchEligibility = {
  eligible: boolean

  anonymizationRequired: boolean

  pseudonymizationRequired:
    boolean

  aggregationRequired: boolean

  longitudinalUseAllowed: boolean

  correlationUseAllowed: boolean

  predictionUseAllowed: boolean

  groupAnalysisAllowed: boolean

  subgroupAnalysisAllowed: boolean

  externalEventAnalysisAllowed:
    boolean

  zoneInfluenceAnalysisAllowed:
    boolean

  groupFormationAnalysisAllowed:
    boolean

  groupReorganizationAnalysisAllowed:
    boolean

  hypothesisGenerationAllowed:
    boolean

  causalInferenceAllowed: boolean

  humanSubjectsReviewRequired:
    boolean

  minimumGroupSize:
    number | null

  restrictions: string[]

  notes: string | null
}

export type LearningGraphTraceability = {
  correlationId: string

  causationId: string | null

  requestId: string | null

  sessionId: string | null

  traceId: string | null

  sourceEventId: string | null

  parentNodeIds: string[]

  parentEdgeIds: string[]

  relatedNodeIds: string[]

  relatedEdgeIds: string[]

  createdBy: string | null

  updatedBy: string | null

  reviewedBy: string | null

  metadata:
    LearningGraphMetadata
}

export type LearningGraphVersion = {
  id: string

  graphEntityKey: string

  versionNumber: number

  versionLabel: string

  status:
    | 'current'
    | 'superseded'
    | 'archived'
    | 'rejected'

  previousVersionId: string | null

  parentVersionId: string | null

  isCurrent: boolean

  createdAt: string

  createdBy: string | null

  changeReason: string | null

  changedFields: string[]

  metadata:
    LearningGraphMetadata
}

export type LearningGraphNodeAttributes = {
  title: string

  description: string | null

  status:
    LearningGraphNodeStatus

  tags: string[]

  organizationId: string | null

  schoolId: string | null

  ownerUserId: string | null

  classIds: string[]

  groupIds: string[]

  planningIds: string[]

  lessonIds: string[]

  learningObjectiveIds: string[]

  skillIds: string[]

  competencyIds: string[]

  curriculumReferenceIds: string[]

  evidenceIds: string[]

  evidenceIntelligenceRunIds:
    string[]

  pedagogicalAnalysisIds:
    string[]

  interventionIds: string[]

  indicatorIds: string[]

  assessmentIds: string[]

  assessmentResultIds: string[]

  learningResultIds: string[]

  externalEventIds: string[]

  academicPeriodIds: string[]

  locationIds: string[]

  values:
    LearningGraphMetadata

  metadata:
    LearningGraphMetadata
}

export type LearningGraphNode = {
  id: string

  nodeKey: string

  type:
    LearningGraphNodeType

  subtype: string | null

  sourceEntity:
    LearningGraphEntityReference

  attributes:
    LearningGraphNodeAttributes

  time:
    LearningGraphTimeInterval

  provenance:
    LearningGraphProvenance[]

  confidence:
    LearningGraphScore

  explainability:
    LearningGraphExplainability

  privacy:
    LearningGraphPrivacy

  researchEligibility:
    LearningGraphResearchEligibility

  traceability:
    LearningGraphTraceability

  version:
    LearningGraphVersion

  createdAt: string

  updatedAt: string

  archivedAt: string | null
}

export type LearningGraphRelationEvidence = {
  id: string

  evidenceType:
    | 'direct_record'
    | 'teacher_observation'
    | 'assessment_result'
    | 'evidence_intelligence'
    | 'intervention_monitoring'
    | 'analytics'
    | 'research'
    | 'external_source'
    | 'inference'

  reference:
    LearningGraphEntityReference

  supportsRelation: boolean

  relevanceScore: number | null

  reliabilityScore: number | null

  confidenceScore: number | null

  observedAt: string | null

  explanation: string | null

  metadata:
    LearningGraphMetadata
}

export type LearningGraphEdgeAttributes = {
  label: string | null

  description: string | null

  weight: number | null

  strength:
    LearningGraphEvidenceLevel

  confidence:
    LearningGraphScore

  causalityStatus:
    LearningGraphCausalityStatus

  positiveInfluence:
    boolean | null

  directRelation: boolean

  inferredRelation: boolean

  validatedByHuman: boolean

  humanReviewStatus:
    LearningGraphHumanReviewStatus

  evidence:
    LearningGraphRelationEvidence[]

  conditions: string[]

  limitations: string[]

  tags: string[]

  metadata:
    LearningGraphMetadata
}

export type LearningGraphEdge = {
  id: string

  edgeKey: string

  type:
    LearningGraphRelationType

  customType: string | null

  direction:
    LearningGraphRelationDirection

  sourceNodeId: string

  targetNodeId: string

  reciprocalEdgeId: string | null

  attributes:
    LearningGraphEdgeAttributes

  time:
    LearningGraphTimeInterval

  provenance:
    LearningGraphProvenance[]

  explainability:
    LearningGraphExplainability

  privacy:
    LearningGraphPrivacy

  researchEligibility:
    LearningGraphResearchEligibility

  traceability:
    LearningGraphTraceability

  version:
    LearningGraphVersion

  createdAt: string

  updatedAt: string

  archivedAt: string | null
}

export type LearningGraphContext = {
  graphId: string

  graphKey: string

  title: string

  description: string | null

  organizationId: string | null

  schoolId: string | null

  ownerUserId: string | null

  academicYear: number | null

  academicPeriodIds: string[]

  classIds: string[]

  nodeTypes:
    LearningGraphNodeType[]

  relationTypes:
    LearningGraphRelationType[]

  aggregationLevel:
    LearningGraphAggregationLevel

  privacy:
    LearningGraphPrivacy

  metadata:
    LearningGraphMetadata
}

export type LearningGraphMetrics = {
  nodeCount: number

  edgeCount: number

  activeNodeCount: number

  activeEdgeCount: number

  inferredEdgeCount: number

  humanValidatedEdgeCount: number

  isolatedNodeCount: number

  connectedComponentCount:
    number | null

  density: number | null

  averageDegree: number | null

  confidenceScore: number | null

  evidenceCoverageScore:
    number | null

  explainabilityCoverageScore:
    number | null

  calculatedAt: string

  metadata:
    LearningGraphMetadata
}

export type LearningGraphSnapshot = {
  id: string

  snapshotKey: string

  context:
    LearningGraphContext

  nodes:
    LearningGraphNode[]

  edges:
    LearningGraphEdge[]

  metrics:
    LearningGraphMetrics

  generatedAt: string

  engine: {
    name: string

    version: string

    mode:
      | 'deterministic'
      | 'hybrid'
      | 'statistical'
      | 'manual'

    rulesetVersion:
      string | null

    metadata:
      LearningGraphMetadata
  }

  traceability:
    LearningGraphTraceability

  version:
    LearningGraphVersion

  warnings: string[]

  errors: string[]

  metadata:
    LearningGraphMetadata
}

export type LearningGraphNodeInput = {
  nodeKey: string

  type:
    LearningGraphNodeType

  subtype?: string | null

  sourceEntity:
    LearningGraphEntityReference

  attributes:
    LearningGraphNodeAttributes

  time:
    LearningGraphTimeInterval

  provenance:
    LearningGraphProvenance[]

  confidence:
    LearningGraphScore

  explainability:
    LearningGraphExplainability

  privacy:
    LearningGraphPrivacy

  researchEligibility:
    LearningGraphResearchEligibility

  traceability:
    LearningGraphTraceability

  metadata?:
    LearningGraphMetadata
}

export type LearningGraphEdgeInput = {
  edgeKey: string

  type:
    LearningGraphRelationType

  customType?: string | null

  direction:
    LearningGraphRelationDirection

  sourceNodeId: string

  targetNodeId: string

  reciprocalEdgeId?: string | null

  attributes:
    LearningGraphEdgeAttributes

  time:
    LearningGraphTimeInterval

  provenance:
    LearningGraphProvenance[]

  explainability:
    LearningGraphExplainability

  privacy:
    LearningGraphPrivacy

  researchEligibility:
    LearningGraphResearchEligibility

  traceability:
    LearningGraphTraceability

  metadata?:
    LearningGraphMetadata
}

export type BuildLearningGraphInput = {
  context:
    LearningGraphContext

  nodes:
    LearningGraphNodeInput[]

  edges:
    LearningGraphEdgeInput[]

  includeArchived: boolean

  includeHistoricalVersions:
    boolean

  calculateMetrics: boolean

  validateReferentialIntegrity:
    boolean

  inferRelations: boolean

  requireHumanReviewForInferences:
    boolean

  minimumInferenceConfidence:
    number

  requestedByUserId: string | null

  correlationId: string

  causationId?: string | null

  requestId?: string | null

  sessionId?: string | null

  traceId?: string | null

  sourceEventId?: string | null

  metadata?:
    LearningGraphMetadata
}

export type LearningGraphValidationIssue = {
  code: string

  severity:
    | 'information'
    | 'warning'
    | 'error'
    | 'critical'

  message: string

  field: string | null

  nodeId: string | null

  edgeId: string | null

  relatedEntityIds: string[]

  requiresHumanReview: boolean

  metadata:
    LearningGraphMetadata
}

export type LearningGraphValidationResult = {
  valid: boolean

  issues:
    LearningGraphValidationIssue[]

  nodeCount: number

  edgeCount: number

  invalidNodeIds: string[]

  invalidEdgeIds: string[]

  orphanNodeIds: string[]

  duplicatedNodeKeys: string[]

  duplicatedEdgeKeys: string[]

  generatedAt: string

  metadata:
    LearningGraphMetadata
}

export type LearningGraphBuildResult = {
  success: boolean

  graph:
    LearningGraphSnapshot | null

  validation:
    LearningGraphValidationResult

  warnings: string[]

  errors: string[]

  generatedAt: string

  correlationId: string

  metadata:
    LearningGraphMetadata
}

export type LearningGraphChangeEvent = {
  id: string

  graphId: string

  entityType:
    'node' | 'edge' | 'graph'

  entityId: string

  changeType:
    LearningGraphChangeType

  actorType:
    LearningGraphActorType

  actorId: string | null

  occurredAt: string

  previousVersionId: string | null

  newVersionId: string | null

  changedFields: string[]

  reason: string | null

  correlationId: string

  causationId: string | null

  traceId: string | null

  metadata:
    LearningGraphMetadata
}

export type LearningGraphQuery = {
  graphId: string

  nodeIds?: string[]

  nodeKeys?: string[]

  nodeTypes?:
    LearningGraphNodeType[]

  edgeIds?: string[]

  relationTypes?:
    LearningGraphRelationType[]

  sourceNodeIds?: string[]

  targetNodeIds?: string[]

  classIds?: string[]

  planningIds?: string[]

  lessonIds?: string[]

  learningObjectiveIds?: string[]

  skillIds?: string[]

  competencyIds?: string[]

  evidenceIds?: string[]

  interventionIds?: string[]

  indicatorIds?: string[]

  assessmentIds?: string[]

  academicPeriodIds?: string[]

  organizationId?: string | null

  schoolId?: string | null

  validAt?: string | null

  includeArchived?: boolean

  includeHistoricalVersions?:
    boolean

  includeInferredRelations?:
    boolean

  minimumConfidence?: number | null

  maximumDepth?: number

  limit?: number

  cursor?: string | null
}

export type LearningGraphQueryResult = {
  graphId: string

  nodes:
    LearningGraphNode[]

  edges:
    LearningGraphEdge[]

  metrics:
    LearningGraphMetrics | null

  totalNodes: number

  totalEdges: number

  nextCursor: string | null

  generatedAt: string

  metadata:
    LearningGraphMetadata
}