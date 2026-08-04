import type {
  AcademicSemanticEntityType,
  AcademicSemanticRelationType,
} from '@/lib/eios/semantic/academic-semantic.contract'

export const EDUCATIONAL_KNOWLEDGE_GRAPH_CONTRACT_VERSION =
  'educational-knowledge-graph-v1' as const

export type EducationalKnowledgeGraphContractVersion =
  typeof EDUCATIONAL_KNOWLEDGE_GRAPH_CONTRACT_VERSION

export type EducationalGraphRecord =
  Record<string, unknown>

export type EducationalGraphStatus =
  | 'draft'
  | 'active'
  | 'under_review'
  | 'deprecated'
  | 'archived'

export type EducationalGraphDataQuality =
  | 'complete'
  | 'partial'
  | 'insufficient'
  | 'not_evaluated'

export type EducationalGraphNodeType =
  | AcademicSemanticEntityType
  | 'CURRICULUM_FRAMEWORK'
  | 'CURRICULUM_VERSION'
  | 'CURRICULUM_NODE'
  | 'PLANNING'
  | 'LESSON'
  | 'CLASSROOM'
  | 'BUILDING'
  | 'PHYSICAL_POSITION'
  | 'VIRTUAL_ENVIRONMENT'
  | 'RESOURCE'
  | 'CONTEXTUAL_EVENT'
  | 'TEACHER_EFFORT_EVENT'
  | 'INTERVENTION_RESULT'
  | 'DECISION_RECORD'
  | 'RESEARCH_OBSERVATION'
  | 'SENSOR'
  | 'DEVICE'
  | 'DATASET'
  | 'DOCUMENT'
  | 'IMAGE'
  | 'VIDEO'
  | 'AUDIO'
  | 'SPATIAL_ZONE'
  | 'LEARNING_SUBGROUP'
  | 'CUSTOM'

export type EducationalGraphEdgeType =
  | AcademicSemanticRelationType
  | 'LOCATED_IN'
  | 'POSITIONED_AT'
  | 'NEAR'
  | 'INTERACTS_WITH'
  | 'MEMBER_OF_SUBGROUP'
  | 'INFLUENCE_ZONE_OF'
  | 'OBSERVED_DURING'
  | 'OCCURRED_DURING'
  | 'MEASURED_BY'
  | 'RECORDED_BY'
  | 'HAS_RESULT'
  | 'HAS_INDICATOR'
  | 'HAS_EVIDENCE'
  | 'HAS_CONTEXT'
  | 'HAS_POSITION'
  | 'HAS_TEMPORAL_STATE'
  | 'HAS_SPATIAL_STATE'
  | 'WORKS_ON'
  | 'DEMONSTRATES'
  | 'REQUIRES_RECOVERY'
  | 'RECEIVED_INTERVENTION'
  | 'PRECEDES_RESULT'
  | 'FOLLOWS_INTERVENTION'
  | 'CO_OCCURS_WITH'
  | 'CORRELATED_WITH'
  | 'SIMILAR_TO'
  | 'CUSTOM'

export type EducationalGraphSourceType =
  | 'academic_core'
  | 'curriculum_engine'
  | 'semantic_engine'
  | 'agenda'
  | 'professor_digital'
  | 'assessment'
  | 'attendance'
  | 'evidence'
  | 'analytics'
  | 'intervention'
  | 'institution'
  | 'import'
  | 'sensor'
  | 'iot'
  | 'manual'
  | 'research'
  | 'external_integration'
  | 'other'

export type EducationalGraphModality =
  | 'structured_data'
  | 'text'
  | 'document'
  | 'image'
  | 'video'
  | 'audio'
  | 'spatial'
  | 'temporal_series'
  | 'semantic_vector'
  | 'sensor_data'
  | 'mixed'

export type EducationalGraphVisibility =
  | 'private'
  | 'restricted'
  | 'institutional'
  | 'aggregated'
  | 'anonymous'
  | 'public'

export type EducationalGraphSensitivity =
  | 'none'
  | 'personal'
  | 'academic'
  | 'behavioral'
  | 'sensitive'
  | 'highly_sensitive'

export type EducationalGraphConfidenceLevel =
  | 'unknown'
  | 'low'
  | 'medium'
  | 'high'
  | 'verified'

export type EducationalGraphTemporalRelation =
  | 'before'
  | 'after'
  | 'during'
  | 'overlaps'
  | 'starts'
  | 'finishes'
  | 'contains'
  | 'equals'
  | 'unknown'

export type EducationalGraphSpatialReferenceType =
  | 'global_coordinates'
  | 'campus'
  | 'building'
  | 'floor'
  | 'room'
  | 'classroom_map'
  | 'seat'
  | 'zone'
  | 'virtual_space'
  | 'relative_position'
  | 'unknown'

export type EducationalGraphPositionSource =
  | 'manual'
  | 'classroom_map'
  | 'seat_assignment'
  | 'sensor'
  | 'camera'
  | 'bluetooth'
  | 'wifi'
  | 'rfid'
  | 'gps'
  | 'virtual_platform'
  | 'inferred'
  | 'other'

export type EducationalGraphCoordinates = {
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

  altitude:
    number | null

  coordinateSystem:
    string | null
}

export type EducationalGraphTemporalContext = {
  occurredAt:
    string | null

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
    EducationalGraphRecord
}

export type EducationalGraphSpatialContext = {
  referenceType:
    EducationalGraphSpatialReferenceType

  institutionId:
    string | null

  campusId:
    string | null

  buildingId:
    string | null

  floorId:
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

  coordinates:
    EducationalGraphCoordinates

  source:
    EducationalGraphPositionSource

  accuracy:
    number | null

  consentRequired:
    boolean

  consentConfirmed:
    boolean

  metadata:
    EducationalGraphRecord
}

export type EducationalGraphEvidenceReference = {
  evidenceId:
    string

  evidenceType:
    string

  sourceType:
    EducationalGraphSourceType

  modality:
    EducationalGraphModality

  description:
    string | null

  recordedAt:
    string | null

  verified:
    boolean

  verifiedBy:
    string | null

  confidence:
    number | null

  metadata:
    EducationalGraphRecord
}

export type EducationalGraphExternalReference = {
  system:
    string

  entityType:
    string

  entityId:
    string

  url:
    string | null

  metadata:
    EducationalGraphRecord
}

export type EducationalGraphNode = {
  id:
    string

  type:
    EducationalGraphNodeType

  semanticEntityType:
    AcademicSemanticEntityType | null

  canonicalEntityId:
    string | null

  label:
    string

  description:
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

  studentId:
    string | null

  teacherId:
    string | null

  curriculumNodeId:
    string | null

  lessonId:
    string | null

  assessmentId:
    string | null

  evidenceId:
    string | null

  interventionId:
    string | null

  indicatorId:
    string | null

  decisionId:
    string | null

  modalities:
    EducationalGraphModality[]

  temporalContext:
    EducationalGraphTemporalContext | null

  spatialContext:
    EducationalGraphSpatialContext | null

  evidenceReferences:
    EducationalGraphEvidenceReference[]

  externalReferences:
    EducationalGraphExternalReference[]

  status:
    EducationalGraphStatus

  visibility:
    EducationalGraphVisibility

  sensitivity:
    EducationalGraphSensitivity

  containsPersonalData:
    boolean

  containsSensitiveData:
    boolean

  active:
    boolean

  version:
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
    EducationalGraphRecord
}

export type EducationalGraphEdgeMetrics = {
  occurrenceCount:
    number

  lessonCount:
    number

  assessmentCount:
    number

  evidenceCount:
    number

  interventionCount:
    number

  interactionCount:
    number

  durationMinutes:
    number | null

  distance:
    number | null

  distanceUnit:
    'meters'
    | 'centimeters'
    | 'pixels'
    | 'relative'
    | null

  averagePerformance:
    number | null

  performanceVariation:
    number | null

  attendancePercentage:
    number | null

  masteryPercentage:
    number | null

  associationStrength:
    number | null

  statisticalSignificance:
    number | null

  sampleSize:
    number | null

  metadata:
    EducationalGraphRecord
}

export type EducationalGraphEdge = {
  id:
    string

  type:
    EducationalGraphEdgeType

  semanticRelationType:
    AcademicSemanticRelationType | null

  sourceNodeId:
    string

  targetNodeId:
    string

  directed:
    boolean

  label:
    string | null

  description:
    string | null

  sourceType:
    EducationalGraphSourceType

  temporalRelation:
    EducationalGraphTemporalRelation | null

  temporalContext:
    EducationalGraphTemporalContext | null

  spatialContext:
    EducationalGraphSpatialContext | null

  metrics:
    EducationalGraphEdgeMetrics

  evidenceReferences:
    EducationalGraphEvidenceReference[]

  confidence:
    number | null

  confidenceLevel:
    EducationalGraphConfidenceLevel

  explanation:
    string | null

  inferred:
    boolean

  verified:
    boolean

  verifiedBy:
    string | null

  verifiedAt:
    string | null

  causalClaimAllowed:
    false

  humanReviewRequired:
    boolean

  status:
    EducationalGraphStatus

  active:
    boolean

  validFrom:
    string | null

  validUntil:
    string | null

  createdAt:
    string

  updatedAt:
    string

  createdBy:
    string | null

  metadata:
    EducationalGraphRecord
}

export type EducationalGraphSpatialZone = {
  id:
    string

  classroomId:
    string

  classroomMapId:
    string

  name:
    string

  description:
    string | null

  type:
    | 'front'
    | 'center'
    | 'back'
    | 'left'
    | 'right'
    | 'teacher_zone'
    | 'interaction_zone'
    | 'low_interaction_zone'
    | 'high_performance_zone'
    | 'attention_zone'
    | 'custom'

  polygon:
    EducationalGraphCoordinates[]

  active:
    boolean

  metadata:
    EducationalGraphRecord
}

export type EducationalGraphSeat = {
  id:
    string

  classroomId:
    string

  classroomMapId:
    string

  code:
    string

  row:
    number | null

  column:
    number | null

  coordinates:
    EducationalGraphCoordinates

  zoneIds:
    string[]

  accessible:
    boolean

  active:
    boolean

  metadata:
    EducationalGraphRecord
}

export type EducationalGraphPositionSnapshot = {
  id:
    string

  nodeId:
    string

  classroomId:
    string

  classroomMapId:
    string

  lessonId:
    string | null

  seatId:
    string | null

  zoneIds:
    string[]

  coordinates:
    EducationalGraphCoordinates

  source:
    EducationalGraphPositionSource

  recordedAt:
    string

  startsAt:
    string | null

  endsAt:
    string | null

  accuracy:
    number | null

  verified:
    boolean

  metadata:
    EducationalGraphRecord
}

export type EducationalGraphSubgroup = {
  id:
    string

  classId:
    string

  lessonId:
    string | null

  name:
    string

  description:
    string | null

  memberNodeIds:
    string[]

  detectedBy:
    | 'manual'
    | 'spatial_proximity'
    | 'interaction_pattern'
    | 'performance_similarity'
    | 'behavioral_events'
    | 'curriculum_performance'
    | 'mixed'

  confidence:
    number | null

  requiresHumanReview:
    boolean

  createdAt:
    string

  validUntil:
    string | null

  metadata:
    EducationalGraphRecord
}

export type EducationalGraphInfluenceZone = {
  id:
    string

  classroomId:
    string

  lessonId:
    string | null

  sourceNodeId:
    string | null

  subgroupId:
    string | null

  center:
    EducationalGraphCoordinates

  radius:
    number | null

  radiusUnit:
    'meters'
    | 'centimeters'
    | 'pixels'
    | 'relative'
    | null

  intensity:
    number | null

  eventCount:
    number

  evidenceIds:
    string[]

  startsAt:
    string | null

  endsAt:
    string | null

  confidence:
    number | null

  requiresHumanReview:
    boolean

  metadata:
    EducationalGraphRecord
}

export type EducationalGraphHeatmapCell = {
  id:
    string

  classroomId:
    string

  classroomMapId:
    string

  lessonId:
    string | null

  x:
    number

  y:
    number

  width:
    number

  height:
    number

  value:
    number

  normalizedValue:
    number

  eventCount:
    number

  studentCount:
    number

  indicatorType:
    | 'performance'
    | 'attendance'
    | 'interaction'
    | 'behavior'
    | 'evidence'
    | 'participation'
    | 'intervention'
    | 'custom'

  metadata:
    EducationalGraphRecord
}

export type EducationalGraphTemporalSnapshot = {
  id:
    string

  graphId:
    string

  recordedAt:
    string

  academicPeriodId:
    string | null

  nodeIds:
    string[]

  edgeIds:
    string[]

  positionSnapshotIds:
    string[]

  subgroupIds:
    string[]

  influenceZoneIds:
    string[]

  heatmapCellIds:
    string[]

  calculationVersion:
    string

  dataQuality:
    EducationalGraphDataQuality

  metadata:
    EducationalGraphRecord
}

export type EducationalGraphQuery = {
  id:
    string

  startNodeIds:
    string[]

  nodeTypes:
    EducationalGraphNodeType[]

  edgeTypes:
    EducationalGraphEdgeType[]

  maximumDepth:
    number

  startsAt:
    string | null

  endsAt:
    string | null

  institutionId:
    string | null

  classId:
    string | null

  lessonId:
    string | null

  componentId:
    string | null

  curriculumNodeId:
    string | null

  includeSpatialData:
    boolean

  includeTemporalData:
    boolean

  includeEvidence:
    boolean

  includeInferredEdges:
    boolean

  minimumConfidence:
    number | null

  metadata:
    EducationalGraphRecord
}

export type EducationalGraphQueryPath = {
  nodeIds:
    string[]

  edgeIds:
    string[]

  depth:
    number

  confidence:
    number | null

  explanation:
    string | null
}

export type EducationalGraphQueryResult = {
  success:
    boolean

  nodes:
    EducationalGraphNode[]

  edges:
    EducationalGraphEdge[]

  paths:
    EducationalGraphQueryPath[]

  warnings:
    string[]

  errors:
    string[]

  requiresHumanReview:
    boolean
}

export type EducationalGraphCorrelation = {
  id:
    string

  sourceNodeId:
    string

  targetNodeId:
    string

  sourceMetric:
    string

  targetMetric:
    string

  method:
    | 'pearson'
    | 'spearman'
    | 'kendall'
    | 'chi_square'
    | 'regression'
    | 'spatial_autocorrelation'
    | 'temporal_cross_correlation'
    | 'descriptive_association'
    | 'custom'

  coefficient:
    number | null

  pValue:
    number | null

  confidenceIntervalLower:
    number | null

  confidenceIntervalUpper:
    number | null

  sampleSize:
    number

  startsAt:
    string | null

  endsAt:
    string | null

  explanation:
    string

  limitations:
    string[]

  causalClaimAllowed:
    false

  requiresHumanReview:
    boolean

  calculatedAt:
    string

  calculationVersion:
    string

  metadata:
    EducationalGraphRecord
}

export type EducationalGraphMetadata = {
  contractVersion:
    EducationalKnowledgeGraphContractVersion

  generatedAt:
    string

  status:
    EducationalGraphStatus

  dataQuality:
    EducationalGraphDataQuality

  warnings:
    string[]

  containsPersonalData:
    boolean

  containsSensitiveData:
    boolean

  anonymizationRequired:
    boolean

  consentRequired:
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

export type EducationalKnowledgeGraphContext = {
  metadata:
    EducationalGraphMetadata

  graphId:
    string

  name:
    string

  description:
    string | null

  nodes:
    EducationalGraphNode[]

  edges:
    EducationalGraphEdge[]

  spatialZones:
    EducationalGraphSpatialZone[]

  seats:
    EducationalGraphSeat[]

  positionSnapshots:
    EducationalGraphPositionSnapshot[]

  subgroups:
    EducationalGraphSubgroup[]

  influenceZones:
    EducationalGraphInfluenceZone[]

  heatmapCells:
    EducationalGraphHeatmapCell[]

  temporalSnapshots:
    EducationalGraphTemporalSnapshot[]

  correlations:
    EducationalGraphCorrelation[]
}

export type EducationalKnowledgeGraphResult = {
  success:
    boolean

  context:
    EducationalKnowledgeGraphContext | null

  errors:
    string[]

  warnings:
    string[]
}

export function clampEducationalGraphConfidence(
  value:
    number,
): number {
  if (!Number.isFinite(value)) {
    return 0
  }

  return Math.min(
    1,
    Math.max(
      0,
      Math.round(value * 10000) / 10000,
    ),
  )
}

export function clampEducationalGraphPercentage(
  value:
    number,
): number {
  if (!Number.isFinite(value)) {
    return 0
  }

  return Math.min(
    100,
    Math.max(
      0,
      Math.round(value * 100) / 100,
    ),
  )
}

export function createEmptyEducationalGraphCoordinates():
  EducationalGraphCoordinates {
  return {
    x: null,
    y: null,
    z: null,
    latitude: null,
    longitude: null,
    altitude: null,
    coordinateSystem: null,
  }
}

export function createEmptyEducationalKnowledgeGraphContext({
  graphId,
  name,
  description = null,
}: {
  graphId: string
  name: string
  description?: string | null
}): EducationalKnowledgeGraphContext {
  return {
    metadata: {
      contractVersion:
        EDUCATIONAL_KNOWLEDGE_GRAPH_CONTRACT_VERSION,

      generatedAt:
        new Date().toISOString(),

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

      anonymizationRequired:
        false,

      consentRequired:
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

    graphId,
    name,
    description,

    nodes: [],
    edges: [],
    spatialZones: [],
    seats: [],
    positionSnapshots: [],
    subgroups: [],
    influenceZones: [],
    heatmapCells: [],
    temporalSnapshots: [],
    correlations: [],
  }
}