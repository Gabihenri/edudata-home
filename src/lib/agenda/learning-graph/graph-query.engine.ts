from pathlib import Path

content = r'''/**

 * EduData IA — EIOS

 * Capability 03: Learning Graph

 *

 * Motor oficial de consultas do Learning Graph.

 *

 * Responsabilidades:

 * - consultar nós e relações;

 * - aplicar filtros pedagógicos, temporais, de privacidade e pesquisa;

 * - localizar vizinhos;

 * - extrair subgrafos;

 * - encontrar caminhos;

 * - ordenar e paginar resultados;

 * - oferecer cache local determinístico.

 *

 * Este motor não acessa banco de dados, não altera o snapshot,

 * não aplica RLS e não produz inferência causal.

 */

import type {

  LearningGraphEdge,

  LearningGraphMetadata,

  LearningGraphNode,

  LearningGraphNodeType,

  LearningGraphPrivacyLevel,

  LearningGraphQuery,

  LearningGraphQueryResult,

  LearningGraphRelationDirection,

  LearningGraphRelationType,

  LearningGraphSnapshot,

  LearningGraphTemporalStatus,

} from './learning-graph.types'

const ENGINE_NAME = 'eios-graph-query-engine'

const ENGINE_VERSION = '1.0.1'

const RULESET_VERSION = 'graph-query-ruleset-1.0.1'

const DEFAULT_LIMIT = 50

const MAXIMUM_LIMIT = 500

const DEFAULT_MAXIMUM_DEPTH = 3

const MAXIMUM_DEPTH = 12

const DEFAULT_CACHE_TTL_MS = 30_000

const MAXIMUM_CACHE_TTL_MS = 300_000

const DEFAULT_MAXIMUM_CACHE_ENTRIES = 200

export type LearningGraphQueryOrderField =

  | 'created_at'

  | 'updated_at'

  | 'title'

  | 'type'

  | 'confidence'

  | 'node_key'

  | 'edge_key'

export type LearningGraphQueryOrderDirection = 'asc' | 'desc'

export type LearningGraphQueryMatchMode = 'all' | 'any'

export type LearningGraphTraversalDirection = 'outgoing' | 'incoming' | 'both'

export type LearningGraphPathStrategy = 'shortest' | 'all_shortest' | 'all'

export type LearningGraphQueryPrivacyFilter = {

  allowedLevels?: LearningGraphPrivacyLevel[]

  excludePersonalData?: boolean

  excludeSensitiveData?: boolean

  excludeMinorData?: boolean

  requireAnonymized?: boolean

  requirePseudonymized?: boolean

  requireAggregated?: boolean

}

export type LearningGraphResearchFilter = {

  requireEligible?: boolean

  requireLongitudinalUse?: boolean

  requireCorrelationUse?: boolean

  requirePredictionUse?: boolean

  requireGroupAnalysis?: boolean

  requireSubgroupAnalysis?: boolean

  requireExternalEventAnalysis?: boolean

  requireZoneInfluenceAnalysis?: boolean

  requireGroupFormationAnalysis?: boolean

  requireGroupReorganizationAnalysis?: boolean

  requireHypothesisGeneration?: boolean

  requireCausalInference?: boolean

  excludeHumanSubjectsReview?: boolean

}

export type LearningGraphTemporalFilter = {

  validAt?: string | null

  validFrom?: string | null

  validUntil?: string | null

  observedFrom?: string | null

  observedUntil?: string | null

  recordedFrom?: string | null

  recordedUntil?: string | null

  academicYears?: number[]

  academicPeriodIds?: string[]

  temporalStatuses?: LearningGraphTemporalStatus[]

}

export type LearningGraphPedagogicalFilter = {

  userIds?: string[]

  teacherIds?: string[]

  studentIds?: string[]

  organizationIds?: string[]

  schoolIds?: string[]

  classIds?: string[]

  groupIds?: string[]

  planningIds?: string[]

  lessonIds?: string[]

  learningObjectiveIds?: string[]

  skillIds?: string[]

  competencyIds?: string[]

  curriculumReferenceIds?: string[]

  evidenceIds?: string[]

  evidenceIntelligenceRunIds?: string[]

  pedagogicalAnalysisIds?: string[]

  interventionIds?: string[]

  indicatorIds?: string[]

  assessmentIds?: string[]

  assessmentResultIds?: string[]

  learningResultIds?: string[]

  externalEventIds?: string[]

  locationIds?: string[]

  tags?: string[]

  matchMode?: LearningGraphQueryMatchMode

}

export type LearningGraphNodeFilter = {

  ids?: string[]

  keys?: string[]

  types?: LearningGraphNodeType[]

  subtypes?: string[]

  statuses?: string[]

  titleContains?: string | null

  descriptionContains?: string | null

  sourceEntityIds?: string[]

  sourceSystems?: string[]

  minimumConfidence?: number | null

  maximumConfidence?: number | null

  requireHumanReview?: boolean | null

  includeArchived?: boolean

  includeHistoricalVersions?: boolean

  pedagogical?: LearningGraphPedagogicalFilter

  temporal?: LearningGraphTemporalFilter

  privacy?: LearningGraphQueryPrivacyFilter

  research?: LearningGraphResearchFilter

}

export type LearningGraphEdgeFilter = {

  ids?: string[]

  keys?: string[]

  types?: LearningGraphRelationType[]

  customTypes?: string[]

  directions?: LearningGraphRelationDirection[]

  sourceNodeIds?: string[]

  targetNodeIds?: string[]

  nodeIds?: string[]

  minimumWeight?: number | null

  maximumWeight?: number | null

  minimumConfidence?: number | null

  maximumConfidence?: number | null

  directRelation?: boolean | null

  inferredRelation?: boolean | null

  validatedByHuman?: boolean | null

  positiveInfluence?: boolean | null

  includeArchived?: boolean

  includeHistoricalVersions?: boolean

  temporal?: LearningGraphTemporalFilter

  privacy?: LearningGraphQueryPrivacyFilter

  research?: LearningGraphResearchFilter

}

export type LearningGraphQueryPagination = {

  limit?: number

  cursor?: string | null

  offset?: number

}

export type LearningGraphQueryOrdering = {

  field: LearningGraphQueryOrderField

  direction: LearningGraphQueryOrderDirection

}

export type QueryLearningGraphInput = {

  graph: LearningGraphSnapshot

  query?: LearningGraphQuery

  nodeFilter?: LearningGraphNodeFilter

  edgeFilter?: LearningGraphEdgeFilter

  ordering?: LearningGraphQueryOrdering

  pagination?: LearningGraphQueryPagination

  includeMetrics?: boolean

  includeConnectedEdges?: boolean

  includeConnectedNodes?: boolean

  requestedByUserId?: string | null

  correlationId?: string | null

  useCache?: boolean

  cacheTtlMs?: number

  metadata?: LearningGraphMetadata

}

export type LearningGraphNeighborQueryInput = {

  graph: LearningGraphSnapshot

  nodeId: string

  direction?: LearningGraphTraversalDirection

  relationTypes?: LearningGraphRelationType[]

  neighborNodeTypes?: LearningGraphNodeType[]

  depth?: number

  includeStartNode?: boolean

  includeArchived?: boolean

  includeHistoricalVersions?: boolean

  minimumConfidence?: number | null

  privacy?: LearningGraphQueryPrivacyFilter

  research?: LearningGraphResearchFilter

  useCache?: boolean

  cacheTtlMs?: number

  correlationId?: string | null

}

export type LearningGraphPathQueryInput = {

  graph: LearningGraphSnapshot

  sourceNodeId: string

  targetNodeId: string

  strategy?: LearningGraphPathStrategy

  direction?: LearningGraphTraversalDirection

  relationTypes?: LearningGraphRelationType[]

  allowedNodeTypes?: LearningGraphNodeType[]

  maximumDepth?: number

  maximumPaths?: number

  includeArchived?: boolean

  includeHistoricalVersions?: boolean

  minimumConfidence?: number | null

  useCache?: boolean

  cacheTtlMs?: number

  correlationId?: string | null

}

export type LearningGraphSubgraphQueryInput = {

  graph: LearningGraphSnapshot

  rootNodeIds: string[]

  depth?: number

  direction?: LearningGraphTraversalDirection

  relationTypes?: LearningGraphRelationType[]

  nodeTypes?: LearningGraphNodeType[]

  includeRootNodes?: boolean

  includeArchived?: boolean

  includeHistoricalVersions?: boolean

  minimumConfidence?: number | null

  privacy?: LearningGraphQueryPrivacyFilter

  research?: LearningGraphResearchFilter

  useCache?: boolean

  cacheTtlMs?: number

  correlationId?: string | null

}

export type LearningGraphPath = {

  id: string

  sourceNodeId: string

  targetNodeId: string

  nodeIds: string[]

  edgeIds: string[]

  relationTypes: LearningGraphRelationType[]

  length: number

  averageConfidence: number | null

  minimumConfidence: number | null

  containsInferredRelations: boolean

  humanValidated: boolean

  causalityWarning: boolean

  metadata: LearningGraphMetadata

}

export type LearningGraphPathQueryResult = {

  success: boolean

  graphId: string

  snapshotKey: string

  sourceNodeId: string

  targetNodeId: string

  paths: LearningGraphPath[]

  totalPaths: number

  truncated: boolean

  warnings: string[]

  errors: string[]

  generatedAt: string

  correlationId: string

  metadata: LearningGraphMetadata

}

export type LearningGraphTraversalResult = {

  success: boolean

  graphId: string

  snapshotKey: string

  rootNodeIds: string[]

  nodes: LearningGraphNode[]

  edges: LearningGraphEdge[]

  depthReached: number

  visitedNodeCount: number

  visitedEdgeCount: number

  warnings: string[]

  errors: string[]

  generatedAt: string

  correlationId: string

  metadata: LearningGraphMetadata

}

export type LearningGraphQueryEngineInfo = {

  name: string

  version: string

  rulesetVersion: string

  mode: 'deterministic'

  capabilities: string[]

  limitations: string[]

}

type AdjacencyEntry = {

  edge: LearningGraphEdge

  neighborNodeId: string

  direction: 'incoming' | 'outgoing' | 'undirected'

}

type GraphIndexes = {

  nodeById: Map<string, LearningGraphNode>

  nodeByKey: Map<string, LearningGraphNode>

  edgeById: Map<string, LearningGraphEdge>

  edgeByKey: Map<string, LearningGraphEdge>

  adjacency: Map<string, AdjacencyEntry[]>

}

type CacheEntry<T> = {

  value: T

  expiresAt: number

}

class QueryCache {

  private readonly entries = new Map<string, CacheEntry<unknown>>()

  constructor(private readonly maximumEntries: number) {}

  get<T>(key: string): T | null {

    const entry = this.entries.get(key)

    if (!entry) {

      return null

    }

    if (entry.expiresAt <= Date.now()) {

      this.entries.delete(key)

      return null

    }

    this.entries.delete(key)

    this.entries.set(key, entry)

    return entry.value as T

  }

  set<T>(key: string, value: T, ttlMs: number): void {

    this.removeExpired()

    if (this.entries.has(key)) {

      this.entries.delete(key)

    }

    while (this.entries.size >= this.maximumEntries) {

      const oldestKey = this.entries.keys().next().value as string | undefined

      if (!oldestKey) {

        break

      }

      this.entries.delete(oldestKey)

    }

    this.entries.set(key, {

      value,

      expiresAt: Date.now() + ttlMs,

    })

  }

  clear(): void {

    this.entries.clear()

  }

  private removeExpired(): void {

    const now = Date.now()

    for (const [key, entry] of this.entries) {

      if (entry.expiresAt <= now) {

        this.entries.delete(key)

      }

    }

  }

}

const queryCache = new QueryCache(DEFAULT_MAXIMUM_CACHE_ENTRIES)

function nowIso(): string {

  return new Date().toISOString()

}

function normalizeOptionalText(

  value: string | null | undefined,

): string | null {

  return value?.trim() || null

}

function normalizeRequiredText(

  value: string | null | undefined,

  fieldName: string,

): string {

  const normalized = normalizeOptionalText(value)

  if (!normalized) {

    throw new Error(`${fieldName} é obrigatório.`)

  }

  return normalized

}

function uniqueStrings(

  values: Array<string | null | undefined>,

): string[] {

  return Array.from(

    new Set(

      values

        .filter((value): value is string => typeof value === 'string')

        .map(value => value.trim())

        .filter(Boolean),

    ),

  )

}

function uniqueValues<T>(values: T[]): T[] {

  return Array.from(new Set(values))

}

function normalizeScore(

  value: number | null | undefined,

): number | null {

  if (value === null || value === undefined || !Number.isFinite(value)) {

    return null

  }

  return Math.min(1, Math.max(0, value))

}

function normalizeLimit(value: number | null | undefined): number {

  if (typeof value !== 'number' || !Number.isFinite(value)) {

    return DEFAULT_LIMIT

  }

  return Math.min(MAXIMUM_LIMIT, Math.max(1, Math.floor(value)))

}

function normalizeOffset(value: number | null | undefined): number {

  if (typeof value !== 'number' || !Number.isFinite(value)) {

    return 0

  }

  return Math.max(0, Math.floor(value))

}

function normalizeDepth(value: number | null | undefined): number {

  if (typeof value !== 'number' || !Number.isFinite(value)) {

    return DEFAULT_MAXIMUM_DEPTH

  }

  return Math.min(MAXIMUM_DEPTH, Math.max(0, Math.floor(value)))

}

function normalizeTtl(value: number | null | undefined): number {

  if (typeof value !== 'number' || !Number.isFinite(value)) {

    return DEFAULT_CACHE_TTL_MS

  }

  return Math.min(

    MAXIMUM_CACHE_TTL_MS,

    Math.max(1_000, Math.floor(value)),

  )

}

function normalizeDate(value: string | null | undefined): string | null {

  if (!value || Number.isNaN(Date.parse(value))) {

    return null

  }

  return new Date(value).toISOString()

}

function stableHash(value: string): string {

  let hash = 2166136261

  for (let index = 0; index < value.length; index += 1) {

    hash ^= value.charCodeAt(index)

    hash = Math.imul(hash, 16777619)

  }

  return (hash >>> 0).toString(16).padStart(8, '0')

}

function createStableId(prefix: string, value: string): string {

  return `${prefix}-${stableHash(value)}`

}

function calculateAverage(

  values: Array<number | null | undefined>,

): number | null {

  const valid = values.filter(

    (value): value is number =>

      typeof value === 'number' && Number.isFinite(value),

  )

  if (valid.length === 0) {

    return null

  }

  return valid.reduce((total, value) => total + value, 0) / valid.length

}

function intersects(source: string[], filter: string[]): boolean {

  const filterSet = new Set(filter)

  return source.some(value => filterSet.has(value))

}

function containsAll(source: string[], filter: string[]): boolean {

  const sourceSet = new Set(source)

  return filter.every(value => sourceSet.has(value))

}

function matchesList(

  source: string[],

  filter: string[] | undefined,

  mode: LearningGraphQueryMatchMode = 'any',

): boolean {

  const required = filter ?? []

  if (required.length === 0) {

    return true

  }

  return mode === 'all'

    ? containsAll(source, required)

    : intersects(source, required)

}

function matchesTemporal(

  time: LearningGraphNode['time'],

  filter?: LearningGraphTemporalFilter,

): boolean {

  if (!filter) {

    return true

  }

  const validFrom = normalizeDate(time.validFrom)

  const validUntil = normalizeDate(time.validUntil)

  const observedAt = normalizeDate(time.observedAt)

  const recordedAt = normalizeDate(time.recordedAt)

  const validAt = normalizeDate(filter.validAt)

  if (validAt) {

    if (validFrom && validFrom > validAt) return false

    if (validUntil && validUntil < validAt) return false

  }

  const filterValidFrom = normalizeDate(filter.validFrom)

  const filterValidUntil = normalizeDate(filter.validUntil)

  const observedFrom = normalizeDate(filter.observedFrom)

  const observedUntil = normalizeDate(filter.observedUntil)

  const recordedFrom = normalizeDate(filter.recordedFrom)

  const recordedUntil = normalizeDate(filter.recordedUntil)

  if (filterValidFrom && validUntil && validUntil < filterValidFrom) {

    return false

  }

  if (filterValidUntil && validFrom && validFrom > filterValidUntil) {

    return false

  }

  if (observedFrom && (!observedAt || observedAt < observedFrom)) {

    return false

  }

  if (observedUntil && (!observedAt || observedAt > observedUntil)) {

    return false

  }

  if (recordedFrom && (!recordedAt || recordedAt < recordedFrom)) {

    return false

  }

  if (recordedUntil && (!recordedAt || recordedAt > recordedUntil)) {

    return false

  }

  if (

    (filter.academicYears?.length ?? 0) > 0 &&

    (time.academicYear === null ||

      time.academicYear === undefined ||

      !filter.academicYears?.includes(time.academicYear))

  ) {

    return false

  }

  if (

    (filter.academicPeriodIds?.length ?? 0) > 0 &&

    (!time.academicPeriodId ||

      !filter.academicPeriodIds?.includes(time.academicPeriodId))

  ) {

    return false

  }

  if (

    (filter.temporalStatuses?.length ?? 0) > 0 &&

    !filter.temporalStatuses?.includes(time.temporalStatus)

  ) {

    return false

  }

  return true

}

function matchesPrivacy(

  privacy: LearningGraphNode['privacy'],

  filter?: LearningGraphQueryPrivacyFilter,

): boolean {

  if (!filter) return true

  if (

    (filter.allowedLevels?.length ?? 0) > 0 &&

    !filter.allowedLevels?.includes(privacy.level)

  ) {

    return false

  }

  if (filter.excludePersonalData && privacy.containsPersonalData) return false

  if (filter.excludeSensitiveData && privacy.containsSensitiveData) return false

  if (filter.excludeMinorData && privacy.containsMinorData) return false

  if (filter.requireAnonymized && !privacy.anonymized) return false

  if (filter.requirePseudonymized && !privacy.pseudonymized) return false

  if (filter.requireAggregated && !privacy.aggregated) return false

  return true

}

function matchesResearch(

  research: LearningGraphNode['researchEligibility'],

  filter?: LearningGraphResearchFilter,

): boolean {

  if (!filter) return true

  if (filter.requireEligible && !research.eligible) return false

  if (filter.requireLongitudinalUse && !research.longitudinalUseAllowed) return false

  if (filter.requireCorrelationUse && !research.correlationUseAllowed) return false

  if (filter.requirePredictionUse && !research.predictionUseAllowed) return false

  if (filter.requireGroupAnalysis && !research.groupAnalysisAllowed) return false

  if (filter.requireSubgroupAnalysis && !research.subgroupAnalysisAllowed) return false

  if (

    filter.requireExternalEventAnalysis &&

    !research.externalEventAnalysisAllowed

  ) return false

  if (

    filter.requireZoneInfluenceAnalysis &&

    !research.zoneInfluenceAnalysisAllowed

  ) return false

  if (

    filter.requireGroupFormationAnalysis &&

    !research.groupFormationAnalysisAllowed

  ) return false

  if (

    filter.requireGroupReorganizationAnalysis &&

    !research.groupReorganizationAnalysisAllowed

  ) return false

  if (

    filter.requireHypothesisGeneration &&

    !research.hypothesisGenerationAllowed

  ) return false

  if (filter.requireCausalInference && !research.causalInferenceAllowed) {

    return false

  }

  if (

    filter.excludeHumanSubjectsReview &&

    research.humanSubjectsReviewRequired

  ) return false

  return true

}

function matchesPedagogical(

  node: LearningGraphNode,

  filter?: LearningGraphPedagogicalFilter,

): boolean {

  if (!filter) return true

  const mode = filter.matchMode ?? 'any'

  const attributes = node.attributes

  const checks: boolean[] = []

  const add = (source: string[], required?: string[]) => {

    if ((required?.length ?? 0) > 0) {

      checks.push(matchesList(source, required, mode))

    }

  }

  add(

    uniqueStrings([

      node.sourceEntity.entityId,

      attributes.ownerUserId,

    ]),

    filter.userIds,

  )

  add(

    node.type === 'teacher' ? [node.sourceEntity.entityId] : [],

    filter.teacherIds,

  )

  add(

    node.type === 'student' ? [node.sourceEntity.entityId] : [],

    filter.studentIds,

  )

  add(

    uniqueStrings([

      node.sourceEntity.organizationId,

      attributes.organizationId,

    ]),

    filter.organizationIds,

  )

  add(

    uniqueStrings([

      node.sourceEntity.schoolId,

      attributes.schoolId,

    ]),

    filter.schoolIds,

  )

  add(attributes.classIds, filter.classIds)

  add(attributes.groupIds, filter.groupIds)

  add(attributes.planningIds, filter.planningIds)

  add(attributes.lessonIds, filter.lessonIds)

  add(attributes.learningObjectiveIds, filter.learningObjectiveIds)

  add(attributes.skillIds, filter.skillIds)

  add(attributes.competencyIds, filter.competencyIds)

  add(attributes.curriculumReferenceIds, filter.curriculumReferenceIds)

  add(attributes.evidenceIds, filter.evidenceIds)

  add(

    attributes.evidenceIntelligenceRunIds,

    filter.evidenceIntelligenceRunIds,

  )

  add(attributes.pedagogicalAnalysisIds, filter.pedagogicalAnalysisIds)

  add(attributes.interventionIds, filter.interventionIds)

  add(attributes.indicatorIds, filter.indicatorIds)

  add(attributes.assessmentIds, filter.assessmentIds)

  add(attributes.assessmentResultIds, filter.assessmentResultIds)

  add(attributes.learningResultIds, filter.learningResultIds)

  add(attributes.externalEventIds, filter.externalEventIds)

  add(attributes.locationIds, filter.locationIds)

  add(attributes.tags, filter.tags)

  if (checks.length === 0) {

    return true

  }

  return mode === 'all' ? checks.every(Boolean) : checks.some(Boolean)

}

function matchesNode(

  node: LearningGraphNode,

  filter: LearningGraphNodeFilter,

): boolean {

  if (

    !filter.includeArchived &&

    (node.archivedAt !== null || node.attributes.status === 'archived')

  ) return false

  if (!filter.includeHistoricalVersions && !node.version.isCurrent) return false

  if ((filter.ids?.length ?? 0) > 0 && !filter.ids?.includes(node.id)) return false

  if ((filter.keys?.length ?? 0) > 0 && !filter.keys?.includes(node.nodeKey)) return false

  if ((filter.types?.length ?? 0) > 0 && !filter.types?.includes(node.type)) return false

  if (

    (filter.subtypes?.length ?? 0) > 0 &&

    (!node.subtype || !filter.subtypes?.includes(node.subtype))

  ) return false

  if (

    (filter.statuses?.length ?? 0) > 0 &&

    !filter.statuses?.includes(node.attributes.status)

  ) return false

  const titleContains = normalizeOptionalText(filter.titleContains)?.toLowerCase()

  const descriptionContains =

    normalizeOptionalText(filter.descriptionContains)?.toLowerCase()

  if (

    titleContains &&

    !node.attributes.title.toLowerCase().includes(titleContains)

  ) return false

  if (

    descriptionContains &&

    !(node.attributes.description ?? '').toLowerCase().includes(descriptionContains)

  ) return false

  if (

    (filter.sourceEntityIds?.length ?? 0) > 0 &&

    !filter.sourceEntityIds?.includes(node.sourceEntity.entityId)

  ) return false

  if (

    (filter.sourceSystems?.length ?? 0) > 0 &&

    (!node.sourceEntity.sourceSystem ||

      !filter.sourceSystems?.includes(node.sourceEntity.sourceSystem))

  ) return false

  const confidence = node.confidence.value

  if (

    filter.minimumConfidence !== null &&

    filter.minimumConfidence !== undefined &&

    (confidence === null || confidence < filter.minimumConfidence)

  ) return false

  if (

    filter.maximumConfidence !== null &&

    filter.maximumConfidence !== undefined &&

    (confidence === null || confidence > filter.maximumConfidence)

  ) return false

  if (

    filter.requireHumanReview !== null &&

    filter.requireHumanReview !== undefined &&

    node.confidence.requiresHumanReview !== filter.requireHumanReview

  ) return false

  return (

    matchesPedagogical(node, filter.pedagogical) &&

    matchesTemporal(node.time, filter.temporal) &&

    matchesPrivacy(node.privacy, filter.privacy) &&

    matchesResearch(node.researchEligibility, filter.research)

  )

}

function matchesEdge(

  edge: LearningGraphEdge,

  filter: LearningGraphEdgeFilter,

): boolean {

  if (!filter.includeArchived && edge.archivedAt !== null) return false

  if (!filter.includeHistoricalVersions && !edge.version.isCurrent) return false

  if ((filter.ids?.length ?? 0) > 0 && !filter.ids?.includes(edge.id)) return false

  if ((filter.keys?.length ?? 0) > 0 && !filter.keys?.includes(edge.edgeKey)) return false

  if ((filter.types?.length ?? 0) > 0 && !filter.types?.includes(edge.type)) return false

  if (

    (filter.customTypes?.length ?? 0) > 0 &&

    (!edge.customType || !filter.customTypes?.includes(edge.customType))

  ) return false

  if (

    (filter.directions?.length ?? 0) > 0 &&

    !filter.directions?.includes(edge.direction)

  ) return false

  if (

    (filter.sourceNodeIds?.length ?? 0) > 0 &&

    !filter.sourceNodeIds?.includes(edge.sourceNodeId)

  ) return false

  if (

    (filter.targetNodeIds?.length ?? 0) > 0 &&

    !filter.targetNodeIds?.includes(edge.targetNodeId)

  ) return false

  if (

    (filter.nodeIds?.length ?? 0) > 0 &&

    !filter.nodeIds?.some(

      nodeId => nodeId === edge.sourceNodeId || nodeId === edge.targetNodeId,

    )

  ) return false

  const weight = edge.attributes.weight

  const confidence = edge.attributes.confidence.value

  if (

    filter.minimumWeight !== null &&

    filter.minimumWeight !== undefined &&

    (weight === null || weight < filter.minimumWeight)

  ) return false

  if (

    filter.maximumWeight !== null &&

    filter.maximumWeight !== undefined &&

    (weight === null || weight > filter.maximumWeight)

  ) return false

  if (

    filter.minimumConfidence !== null &&

    filter.minimumConfidence !== undefined &&

    (confidence === null || confidence < filter.minimumConfidence)

  ) return false

  if (

    filter.maximumConfidence !== null &&

    filter.maximumConfidence !== undefined &&

    (confidence === null || confidence > filter.maximumConfidence)

  ) return false

  if (

    filter.directRelation !== null &&

    filter.directRelation !== undefined &&

    edge.attributes.directRelation !== filter.directRelation

  ) return false

  if (

    filter.inferredRelation !== null &&

    filter.inferredRelation !== undefined &&

    edge.attributes.inferredRelation !== filter.inferredRelation

  ) return false

  if (

    filter.validatedByHuman !== null &&

    filter.validatedByHuman !== undefined &&

    edge.attributes.validatedByHuman !== filter.validatedByHuman

  ) return false

  if (

    filter.positiveInfluence !== null &&

    filter.positiveInfluence !== undefined &&

    edge.attributes.positiveInfluence !== filter.positiveInfluence

  ) return false

  return (

    matchesTemporal(edge.time, filter.temporal) &&

    matchesPrivacy(edge.privacy, filter.privacy) &&

    matchesResearch(edge.researchEligibility, filter.research)

  )

}

function createIndexes(graph: LearningGraphSnapshot): GraphIndexes {

  const nodeById = new Map<string, LearningGraphNode>()

  const nodeByKey = new Map<string, LearningGraphNode>()

  const edgeById = new Map<string, LearningGraphEdge>()

  const edgeByKey = new Map<string, LearningGraphEdge>()

  const adjacency = new Map<string, AdjacencyEntry[]>()

  for (const node of graph.nodes) {

    nodeById.set(node.id, node)

    nodeByKey.set(node.nodeKey, node)

    adjacency.set(node.id, [])

  }

  for (const edge of graph.edges) {

    edgeById.set(edge.id, edge)

    edgeByKey.set(edge.edgeKey, edge)

    const source = adjacency.get(edge.sourceNodeId)

    const target = adjacency.get(edge.targetNodeId)

    if (!source || !target) {

      continue

    }

    if (edge.direction === 'directed') {

      source.push({

        edge,

        neighborNodeId: edge.targetNodeId,

        direction: 'outgoing',

      })

      target.push({

        edge,

        neighborNodeId: edge.sourceNodeId,

        direction: 'incoming',

      })

    } else {

      source.push({

        edge,

        neighborNodeId: edge.targetNodeId,

        direction: 'undirected',

      })

      target.push({

        edge,

        neighborNodeId: edge.sourceNodeId,

        direction: 'undirected',

      })

    }

  }

  return {

    nodeById,

    nodeByKey,

    edgeById,

    edgeByKey,

    adjacency,

  }

}

function mergeLegacyQuery(

  query: LearningGraphQuery | undefined,

  nodeFilter: LearningGraphNodeFilter,

  edgeFilter: LearningGraphEdgeFilter,

): {

  nodeFilter: LearningGraphNodeFilter

  edgeFilter: LearningGraphEdgeFilter

} {

  if (!query) {

    return { nodeFilter, edgeFilter }

  }

  return {

    nodeFilter: {

      ...nodeFilter,

      ids: uniqueStrings([...(nodeFilter.ids ?? []), ...(query.nodeIds ?? [])]),

      keys: uniqueStrings([...(nodeFilter.keys ?? []), ...(query.nodeKeys ?? [])]),

      types: uniqueValues([...(nodeFilter.types ?? []), ...(query.nodeTypes ?? [])]),

      minimumConfidence: query.minimumConfidence ?? nodeFilter.minimumConfidence,

      includeArchived: query.includeArchived ?? nodeFilter.includeArchived,

      includeHistoricalVersions:

        query.includeHistoricalVersions ?? nodeFilter.includeHistoricalVersions,

      pedagogical: {

        ...(nodeFilter.pedagogical ?? {}),

        organizationIds: uniqueStrings([

          ...(nodeFilter.pedagogical?.organizationIds ?? []),

          ...(query.organizationId ? [query.organizationId] : []),

        ]),

        schoolIds: uniqueStrings([

          ...(nodeFilter.pedagogical?.schoolIds ?? []),

          ...(query.schoolId ? [query.schoolId] : []),

        ]),

        classIds: uniqueStrings([

          ...(nodeFilter.pedagogical?.classIds ?? []),

          ...(query.classIds ?? []),

        ]),

        planningIds: uniqueStrings([

          ...(nodeFilter.pedagogical?.planningIds ?? []),

          ...(query.planningIds ?? []),

        ]),

        lessonIds: uniqueStrings([

          ...(nodeFilter.pedagogical?.lessonIds ?? []),

          ...(query.lessonIds ?? []),

        ]),

        learningObjectiveIds: uniqueStrings([

          ...(nodeFilter.pedagogical?.learningObjectiveIds ?? []),

          ...(query.learningObjectiveIds ?? []),

        ]),

        skillIds: uniqueStrings([

          ...(nodeFilter.pedagogical?.skillIds ?? []),

          ...(query.skillIds ?? []),

        ]),

        competencyIds: uniqueStrings([

          ...(nodeFilter.pedagogical?.competencyIds ?? []),

          ...(query.competencyIds ?? []),

        ]),

        evidenceIds: uniqueStrings([

          ...(nodeFilter.pedagogical?.evidenceIds ?? []),

          ...(query.evidenceIds ?? []),

        ]),

        interventionIds: uniqueStrings([

          ...(nodeFilter.pedagogical?.interventionIds ?? []),

          ...(query.interventionIds ?? []),

        ]),

        indicatorIds: uniqueStrings([

          ...(nodeFilter.pedagogical?.indicatorIds ?? []),

          ...(query.indicatorIds ?? []),

        ]),

        assessmentIds: uniqueStrings([

          ...(nodeFilter.pedagogical?.assessmentIds ?? []),

          ...(query.assessmentIds ?? []),

        ]),

      },

      temporal: {

        ...(nodeFilter.temporal ?? {}),

        validAt: query.validAt ?? nodeFilter.temporal?.validAt,

        academicPeriodIds: uniqueStrings([

          ...(nodeFilter.temporal?.academicPeriodIds ?? []),

          ...(query.academicPeriodIds ?? []),

        ]),

      },

    },

    edgeFilter: {

      ...edgeFilter,

      ids: uniqueStrings([...(edgeFilter.ids ?? []), ...(query.edgeIds ?? [])]),

      types: uniqueValues([

        ...(edgeFilter.types ?? []),

        ...(query.relationTypes ?? []),

      ]),

      sourceNodeIds: uniqueStrings([

        ...(edgeFilter.sourceNodeIds ?? []),

        ...(query.sourceNodeIds ?? []),

      ]),

      targetNodeIds: uniqueStrings([

        ...(edgeFilter.targetNodeIds ?? []),

        ...(query.targetNodeIds ?? []),

      ]),

      minimumConfidence: query.minimumConfidence ?? edgeFilter.minimumConfidence,

      includeArchived: query.includeArchived ?? edgeFilter.includeArchived,

      includeHistoricalVersions:

        query.includeHistoricalVersions ?? edgeFilter.includeHistoricalVersions,

    },

  }

}

function compareNodes(

  first: LearningGraphNode,

  second: LearningGraphNode,

  ordering: LearningGraphQueryOrdering,

): number {

  const multiplier = ordering.direction === 'asc' ? 1 : -1

  let comparison = 0

  switch (ordering.field) {

    case 'created_at':

      comparison = Date.parse(first.createdAt) - Date.parse(second.createdAt)

      break

    case 'updated_at':

      comparison = Date.parse(first.updatedAt) - Date.parse(second.updatedAt)

      break

    case 'title':

      comparison = first.attributes.title.localeCompare(

        second.attributes.title,

        'pt-BR',

      )

      break

    case 'type':

      comparison = first.type.localeCompare(second.type)

      break

    case 'confidence':

      comparison =

        (first.confidence.value ?? Number.NEGATIVE_INFINITY) -

        (second.confidence.value ?? Number.NEGATIVE_INFINITY)

      break

    case 'node_key':

      comparison = first.nodeKey.localeCompare(second.nodeKey)

      break

    case 'edge_key':

      comparison = 0

      break

  }

  return comparison * multiplier

}

function createCursor(offset: number, snapshotKey: string): string {

  return `${offset}:${stableHash(snapshotKey)}`

}

function parseCursor(

  cursor: string | null | undefined,

  snapshotKey: string,

): number {

  const normalized = normalizeOptionalText(cursor)

  if (!normalized) {

    return 0

  }

  const [offsetText, hash] = normalized.split(':')

  if (hash !== stableHash(snapshotKey)) {

    return 0

  }

  return normalizeOffset(Number(offsetText))

}

function createCacheKey(

  operation: string,

  graph: LearningGraphSnapshot,

  input: unknown,

): string {

  return [

    operation,

    graph.id,

    graph.snapshotKey,

    graph.version.id,

    stableHash(JSON.stringify(input)),

  ].join(':')

}

function createResultMetrics(

  nodes: LearningGraphNode[],

  edges: LearningGraphEdge[],

  generatedAt: string,

): LearningGraphQueryResult['metrics'] {

  const nodeIds = new Set(nodes.map(node => node.id))

  const connectedEdges = edges.filter(

    edge =>

      nodeIds.has(edge.sourceNodeId) &&

      nodeIds.has(edge.targetNodeId),

  )

  const degree = new Map<string, number>()

  for (const node of nodes) {

    degree.set(node.id, 0)

  }

  for (const edge of connectedEdges) {

    degree.set(edge.sourceNodeId, (degree.get(edge.sourceNodeId) ?? 0) + 1)

    degree.set(edge.targetNodeId, (degree.get(edge.targetNodeId) ?? 0) + 1)

  }

  const possibleEdges =

    nodes.length > 1 ? nodes.length * (nodes.length - 1) : 0

  return {

    nodeCount: nodes.length,

    edgeCount: connectedEdges.length,

    activeNodeCount: nodes.filter(

      node => node.archivedAt === null && node.attributes.status !== 'archived',

    ).length,

    activeEdgeCount: connectedEdges.filter(edge => edge.archivedAt === null).length,

    inferredEdgeCount: connectedEdges.filter(

      edge => edge.attributes.inferredRelation,

    ).length,

    humanValidatedEdgeCount: connectedEdges.filter(

      edge => edge.attributes.validatedByHuman,

    ).length,

    isolatedNodeCount: Array.from(degree.values()).filter(value => value === 0)

      .length,

    connectedComponentCount: null,

    density:

      possibleEdges > 0 ? connectedEdges.length / possibleEdges : null,

    averageDegree:

      nodes.length > 0 ? (connectedEdges.length * 2) / nodes.length : null,

    confidenceScore: calculateAverage([

      ...nodes.map(node => node.confidence.value),

      ...connectedEdges.map(edge => edge.attributes.confidence.value),

    ]),

    evidenceCoverageScore:

      connectedEdges.length > 0

        ? connectedEdges.filter(edge => edge.attributes.evidence.length > 0)

            .length / connectedEdges.length

        : null,

    explainabilityCoverageScore:

      nodes.length + connectedEdges.length > 0

        ? (

            nodes.filter(node => Boolean(node.explainability.summary.trim()))

              .length +

            connectedEdges.filter(edge =>

              Boolean(edge.explainability.summary.trim()),

            ).length

          ) /

          (nodes.length + connectedEdges.length)

        : null,

    calculatedAt: generatedAt,

    metadata: {

      engineName: ENGINE_NAME,

      engineVersion: ENGINE_VERSION,

      partialResult: true,

    },

  }

}

export function queryLearningGraph(

  input: QueryLearningGraphInput,

): LearningGraphQueryResult {

  const generatedAt = nowIso()

  const merged = mergeLegacyQuery(

    input.query,

    input.nodeFilter ?? {},

    input.edgeFilter ?? {},

  )

  const ordering: LearningGraphQueryOrdering = input.ordering ?? {

    field: 'updated_at',

    direction: 'desc',

  }

  const limit = normalizeLimit(input.pagination?.limit ?? input.query?.limit)

  const offset =

    parseCursor(

      input.pagination?.cursor ?? input.query?.cursor,

      input.graph.snapshotKey,

    ) + normalizeOffset(input.pagination?.offset)

  const cacheInput = {

    query: input.query,

    nodeFilter: merged.nodeFilter,

    edgeFilter: merged.edgeFilter,

    ordering,

    limit,

    offset,

    includeMetrics: input.includeMetrics ?? true,

    includeConnectedEdges: input.includeConnectedEdges ?? true,

    includeConnectedNodes: input.includeConnectedNodes ?? false,

  }

  const cacheKey = createCacheKey('query', input.graph, cacheInput)

  if (input.useCache ?? true) {

    const cached = queryCache.get<LearningGraphQueryResult>(cacheKey)

    if (cached) {

      return {

        ...cached,

        nodes: [...cached.nodes],

        edges: [...cached.edges],

        metadata: {

          ...cached.metadata,

          cached: true,

        },

      }

    }

  }

  const indexes = createIndexes(input.graph)

  let nodes = input.graph.nodes.filter(node =>

    matchesNode(node, merged.nodeFilter),

  )

  let edges = input.graph.edges.filter(edge =>

    matchesEdge(edge, merged.edgeFilter),

  )

  const edgeFilterWasExplicit =

    (merged.edgeFilter.ids?.length ?? 0) > 0 ||

    (merged.edgeFilter.keys?.length ?? 0) > 0 ||

    (merged.edgeFilter.types?.length ?? 0) > 0 ||

    (merged.edgeFilter.sourceNodeIds?.length ?? 0) > 0 ||

    (merged.edgeFilter.targetNodeIds?.length ?? 0) > 0 ||

    (merged.edgeFilter.nodeIds?.length ?? 0) > 0

  if ((input.includeConnectedEdges ?? true) && !edgeFilterWasExplicit) {

    const selectedIds = new Set(nodes.map(node => node.id))

    edges = edges.filter(

      edge =>

        selectedIds.has(edge.sourceNodeId) ||

        selectedIds.has(edge.targetNodeId),

    )

  }

  if (input.includeConnectedNodes ?? false) {

    const existingIds = new Set(nodes.map(node => node.id))

    for (const edge of edges) {

      for (const nodeId of [edge.sourceNodeId, edge.targetNodeId]) {

        if (existingIds.has(nodeId)) continue

        const node = indexes.nodeById.get(nodeId)

        if (node && matchesNode(node, {

          ...merged.nodeFilter,

          ids: [],

          keys: [],

          types: [],

        })) {

          nodes.push(node)

          existingIds.add(node.id)

        }

      }

    }

  }

  nodes = [...nodes].sort((first, second) =>

    compareNodes(first, second, ordering),

  )

  const paginatedNodes = nodes.slice(offset, offset + limit)

  const paginatedNodeIds = new Set(paginatedNodes.map(node => node.id))

  const resultEdges = edges.filter(

    edge =>

      paginatedNodeIds.has(edge.sourceNodeId) ||

      paginatedNodeIds.has(edge.targetNodeId),

  )

  const nextOffset = offset + paginatedNodes.length

  const nextCursor =

    nextOffset < nodes.length

      ? createCursor(nextOffset, input.graph.snapshotKey)

      : null

  const result: LearningGraphQueryResult = {

    graphId: input.graph.id,

    nodes: paginatedNodes,

    edges: resultEdges,

    metrics:

      input.includeMetrics ?? true

        ? createResultMetrics(paginatedNodes, resultEdges, generatedAt)

        : null,

    totalNodes: nodes.length,

    totalEdges: edges.length,

    nextCursor,

    generatedAt,

    metadata: {

      ...(input.metadata ?? {}),

      engineName: ENGINE_NAME,

      engineVersion: ENGINE_VERSION,

      rulesetVersion: RULESET_VERSION,

      requestedByUserId: normalizeOptionalText(input.requestedByUserId),

      correlationId:

        normalizeOptionalText(input.correlationId) ??

        input.graph.traceability.correlationId,

      offset,

      limit,

      returnedNodeCount: paginatedNodes.length,

      returnedEdgeCount: resultEdges.length,

      cached: false,

    },

  }

  if (input.useCache ?? true) {

    queryCache.set(cacheKey, result, normalizeTtl(input.cacheTtlMs))

  }

  return result

}

function isEntryAllowed(

  entry: AdjacencyEntry,

  options: {

    direction: LearningGraphTraversalDirection

    relationTypes: LearningGraphRelationType[]

    minimumConfidence: number | null

    includeArchived: boolean

    includeHistoricalVersions: boolean

  },

): boolean {

  if (

    options.direction !== 'both' &&

    entry.direction !== 'undirected' &&

    entry.direction !== options.direction

  ) return false

  if (

    options.relationTypes.length > 0 &&

    !options.relationTypes.includes(entry.edge.type)

  ) return false

  if (!options.includeArchived && entry.edge.archivedAt !== null) return false

  if (

    !options.includeHistoricalVersions &&

    !entry.edge.version.isCurrent

  ) return false

  const confidence = entry.edge.attributes.confidence.value

  if (

    options.minimumConfidence !== null &&

    (confidence === null || confidence < options.minimumConfidence)

  ) return false

  return true

}

function traverseGraph(options: {

  graph: LearningGraphSnapshot

  rootNodeIds: string[]

  depth: number

  direction: LearningGraphTraversalDirection

  relationTypes: LearningGraphRelationType[]

  nodeTypes: LearningGraphNodeType[]

  includeRootNodes: boolean

  includeArchived: boolean

  includeHistoricalVersions: boolean

  minimumConfidence: number | null

  privacy: LearningGraphQueryPrivacyFilter

  research: LearningGraphResearchFilter

  correlationId: string

}): LearningGraphTraversalResult {

  const generatedAt = nowIso()

  const indexes = createIndexes(options.graph)

  const roots = uniqueStrings(options.rootNodeIds)

  const missingRoots = roots.filter(root => !indexes.nodeById.has(root))

  if (missingRoots.length > 0) {

    return {

      success: false,

      graphId: options.graph.id,

      snapshotKey: options.graph.snapshotKey,

      rootNodeIds: roots,

      nodes: [],

      edges: [],

      depthReached: 0,

      visitedNodeCount: 0,

      visitedEdgeCount: 0,

      warnings: [],

      errors: [`Nós raiz não encontrados: ${missingRoots.join(', ')}.`],

      generatedAt,

      correlationId: options.correlationId,

      metadata: {

        engineName: ENGINE_NAME,

        engineVersion: ENGINE_VERSION,

      },

    }

  }

  const visitedDepth = new Map<string, number>()

  const visitedEdgeIds = new Set<string>()

  const queue = roots.map(nodeId => ({ nodeId, depth: 0 }))

  let depthReached = 0

  while (queue.length > 0) {

    const current = queue.shift()

    if (!current) continue

    const previousDepth = visitedDepth.get(current.nodeId)

    if (previousDepth !== undefined && previousDepth <= current.depth) {

      continue

    }

    visitedDepth.set(current.nodeId, current.depth)

    depthReached = Math.max(depthReached, current.depth)

    if (current.depth >= options.depth) {

      continue

    }

    for (const entry of indexes.adjacency.get(current.nodeId) ?? []) {

      if (!isEntryAllowed(entry, options)) continue

      const neighbor = indexes.nodeById.get(entry.neighborNodeId)

      if (!neighbor) continue

      if (

        options.nodeTypes.length > 0 &&

        !options.nodeTypes.includes(neighbor.type)

      ) continue

      if (

        !options.includeArchived &&

        (neighbor.archivedAt !== null ||

          neighbor.attributes.status === 'archived')

      ) continue

      if (

        !options.includeHistoricalVersions &&

        !neighbor.version.isCurrent

      ) continue

      if (!matchesPrivacy(neighbor.privacy, options.privacy)) continue

      if (!matchesResearch(neighbor.researchEligibility, options.research)) {

        continue

      }

      visitedEdgeIds.add(entry.edge.id)

      queue.push({

        nodeId: neighbor.id,

        depth: current.depth + 1,

      })

    }

  }

  if (!options.includeRootNodes) {

    for (const root of roots) {

      visitedDepth.delete(root)

    }

  }

  const nodes: LearningGraphNode[] = []

  for (const nodeId of visitedDepth.keys()) {

    const node = indexes.nodeById.get(nodeId)

    if (node) {

      nodes.push(node)

    }

  }

  const nodeIds = new Set(nodes.map(node => node.id))

  const edges: LearningGraphEdge[] = []

  /*

   * TypeScript-safe materialization:

   * o valor retornado por Map.get é verificado antes do acesso.

   */

  for (const edgeId of visitedEdgeIds) {

    const edge = indexes.edgeById.get(edgeId)

    if (!edge) {

      continue

    }

    const connectsVisited =

      nodeIds.has(edge.sourceNodeId) ||

      nodeIds.has(edge.targetNodeId)

    const connectsRoot =

      roots.includes(edge.sourceNodeId) ||

      roots.includes(edge.targetNodeId)

    if (connectsVisited || connectsRoot) {

      edges.push(edge)

    }

  }

  return {

    success: true,

    graphId: options.graph.id,

    snapshotKey: options.graph.snapshotKey,

    rootNodeIds: roots,

    nodes,

    edges,

    depthReached,

    visitedNodeCount: nodes.length,

    visitedEdgeCount: edges.length,

    warnings: [],

    errors: [],

    generatedAt,

    correlationId: options.correlationId,

    metadata: {

      engineName: ENGINE_NAME,

      engineVersion: ENGINE_VERSION,

      rulesetVersion: RULESET_VERSION,

      direction: options.direction,

      requestedDepth: options.depth,

    },

  }

}

export function queryLearningGraphNeighbors(

  input: LearningGraphNeighborQueryInput,

): LearningGraphTraversalResult {

  const normalized = {

    graph: input.graph,

    rootNodeIds: [normalizeRequiredText(input.nodeId, 'ID do nó')],

    depth: normalizeDepth(input.depth),

    direction: input.direction ?? 'both',

    relationTypes: uniqueValues(input.relationTypes ?? []),

    nodeTypes: uniqueValues(input.neighborNodeTypes ?? []),

    includeRootNodes: input.includeStartNode ?? false,

    includeArchived: input.includeArchived ?? false,

    includeHistoricalVersions: input.includeHistoricalVersions ?? false,

    minimumConfidence: normalizeScore(input.minimumConfidence),

    privacy: input.privacy ?? {},

    research: input.research ?? {},

    correlationId:

      normalizeOptionalText(input.correlationId) ??

      input.graph.traceability.correlationId,

  }

  const cacheKey = createCacheKey('neighbors', input.graph, normalized)

  if (input.useCache ?? true) {

    const cached = queryCache.get<LearningGraphTraversalResult>(cacheKey)

    if (cached) {

      return {

        ...cached,

        nodes: [...cached.nodes],

        edges: [...cached.edges],

        metadata: {

          ...cached.metadata,

          cached: true,

        },

      }

    }

  }

  const result = traverseGraph(normalized)

  if (input.useCache ?? true) {

    queryCache.set(cacheKey, result, normalizeTtl(input.cacheTtlMs))

  }

  return result

}

export function queryLearningGraphSubgraph(

  input: LearningGraphSubgraphQueryInput,

): LearningGraphTraversalResult {

  const rootNodeIds = uniqueStrings(input.rootNodeIds)

  if (rootNodeIds.length === 0) {

    throw new Error('Ao menos um nó raiz é obrigatório.')

  }

  const normalized = {

    graph: input.graph,

    rootNodeIds,

    depth: normalizeDepth(input.depth),

    direction: input.direction ?? 'both',

    relationTypes: uniqueValues(input.relationTypes ?? []),

    nodeTypes: uniqueValues(input.nodeTypes ?? []),

    includeRootNodes: input.includeRootNodes ?? true,

    includeArchived: input.includeArchived ?? false,

    includeHistoricalVersions: input.includeHistoricalVersions ?? false,

    minimumConfidence: normalizeScore(input.minimumConfidence),

    privacy: input.privacy ?? {},

    research: input.research ?? {},

    correlationId:

      normalizeOptionalText(input.correlationId) ??

      input.graph.traceability.correlationId,

  }

  const cacheKey = createCacheKey('subgraph', input.graph, normalized)

  if (input.useCache ?? true) {

    const cached = queryCache.get<LearningGraphTraversalResult>(cacheKey)

    if (cached) {

      return {

        ...cached,

        nodes: [...cached.nodes],

        edges: [...cached.edges],

        metadata: {

          ...cached.metadata,

          cached: true,

        },

      }

    }

  }

  const result = traverseGraph(normalized)

  if (input.useCache ?? true) {

    queryCache.set(cacheKey, result, normalizeTtl(input.cacheTtlMs))

  }

  return result

}

function materializePath(

  graph: LearningGraphSnapshot,

  indexes: GraphIndexes,

  sourceNodeId: string,

  targetNodeId: string,

  nodeIds: string[],

  edgeIds: string[],

): LearningGraphPath {

  const edges: LearningGraphEdge[] = []

  for (const edgeId of edgeIds) {

    const edge = indexes.edgeById.get(edgeId)

    if (edge) {

      edges.push(edge)

    }

  }

  const validConfidences = edges

    .map(edge => edge.attributes.confidence.value)

    .filter((value): value is number => typeof value === 'number')

  return {

    id: createStableId(

      'path',

      [graph.snapshotKey, ...nodeIds, ...edgeIds].join(':'),

    ),

    sourceNodeId,

    targetNodeId,

    nodeIds,

    edgeIds,

    relationTypes: edges.map(edge => edge.type),

    length: edgeIds.length,

    averageConfidence: calculateAverage(validConfidences),

    minimumConfidence:

      validConfidences.length > 0 ? Math.min(...validConfidences) : null,

    containsInferredRelations: edges.some(

      edge => edge.attributes.inferredRelation,

    ),

    humanValidated: edges.every(edge => edge.attributes.validatedByHuman),

    causalityWarning: edges.some(

      edge =>

        edge.type === 'correlates_with' ||

        edge.type === 'associated_with' ||

        edge.explainability.causalityStatus === 'correlation_only',

    ),

    metadata: {

      engineName: ENGINE_NAME,

      engineVersion: ENGINE_VERSION,

      causalClaim: false,

    },

  }

}

export function queryLearningGraphPaths(

  input: LearningGraphPathQueryInput,

): LearningGraphPathQueryResult {

  const generatedAt = nowIso()

  const sourceNodeId = normalizeRequiredText(

    input.sourceNodeId,

    'Nó de origem',

  )

  const targetNodeId = normalizeRequiredText(

    input.targetNodeId,

    'Nó de destino',

  )

  const strategy = input.strategy ?? 'shortest'

  const direction = input.direction ?? 'both'

  const maximumDepth = normalizeDepth(input.maximumDepth)

  const maximumPaths = normalizeLimit(input.maximumPaths ?? 25)

  const relationTypes = uniqueValues(input.relationTypes ?? [])

  const allowedNodeTypes = uniqueValues(input.allowedNodeTypes ?? [])

  const includeArchived = input.includeArchived ?? false

  const includeHistoricalVersions =

    input.includeHistoricalVersions ?? false

  const minimumConfidence = normalizeScore(input.minimumConfidence)

  const correlationId =

    normalizeOptionalText(input.correlationId) ??

    input.graph.traceability.correlationId

  const cacheInput = {

    sourceNodeId,

    targetNodeId,

    strategy,

    direction,

    maximumDepth,

    maximumPaths,

    relationTypes,

    allowedNodeTypes,

    includeArchived,

    includeHistoricalVersions,

    minimumConfidence,

  }

  const cacheKey = createCacheKey('paths', input.graph, cacheInput)

  if (input.useCache ?? true) {

    const cached = queryCache.get<LearningGraphPathQueryResult>(cacheKey)

    if (cached) {

      return {

        ...cached,

        paths: cached.paths.map(path => ({

          ...path,

          nodeIds: [...path.nodeIds],

          edgeIds: [...path.edgeIds],

          relationTypes: [...path.relationTypes],

          metadata: { ...path.metadata },

        })),

        metadata: {

          ...cached.metadata,

          cached: true,

        },

      }

    }

  }

  const indexes = createIndexes(input.graph)

  if (

    !indexes.nodeById.has(sourceNodeId) ||

    !indexes.nodeById.has(targetNodeId)

  ) {

    return {

      success: false,

      graphId: input.graph.id,

      snapshotKey: input.graph.snapshotKey,

      sourceNodeId,

      targetNodeId,

      paths: [],

      totalPaths: 0,

      truncated: false,

      warnings: [],

      errors: ['O nó de origem ou destino não foi encontrado.'],

      generatedAt,

      correlationId,

      metadata: {

        engineName: ENGINE_NAME,

        engineVersion: ENGINE_VERSION,

      },

    }

  }

  if (sourceNodeId === targetNodeId) {

    const path = materializePath(

      input.graph,

      indexes,

      sourceNodeId,

      targetNodeId,

      [sourceNodeId],

      [],

    )

    return {

      success: true,

      graphId: input.graph.id,

      snapshotKey: input.graph.snapshotKey,

      sourceNodeId,

      targetNodeId,

      paths: [path],

      totalPaths: 1,

      truncated: false,

      warnings: [],

      errors: [],

      generatedAt,

      correlationId,

      metadata: {

        engineName: ENGINE_NAME,

        engineVersion: ENGINE_VERSION,

      },

    }

  }

  const paths: LearningGraphPath[] = []

  const queue: Array<{

    nodeId: string

    nodeIds: string[]

    edgeIds: string[]

    visited: Set<string>

  }> = [

    {

      nodeId: sourceNodeId,

      nodeIds: [sourceNodeId],

      edgeIds: [],

      visited: new Set([sourceNodeId]),

    },

  ]

  let shortestLength: number | null = null

  let truncated = false

  while (queue.length > 0) {

    const current = queue.shift()

    if (!current) continue

    if (current.edgeIds.length >= maximumDepth) continue

    if (

      shortestLength !== null &&

      (strategy === 'shortest' || strategy === 'all_shortest') &&

      current.edgeIds.length >= shortestLength

    ) {

      continue

    }

    for (const entry of indexes.adjacency.get(current.nodeId) ?? []) {

      if (

        !isEntryAllowed(entry, {

          direction,

          relationTypes,

          minimumConfidence,

          includeArchived,

          includeHistoricalVersions,

        })

      ) continue

      if (current.visited.has(entry.neighborNodeId)) continue

      const neighbor = indexes.nodeById.get(entry.neighborNodeId)

      if (!neighbor) continue

      if (

        allowedNodeTypes.length > 0 &&

        neighbor.id !== targetNodeId &&

        !allowedNodeTypes.includes(neighbor.type)

      ) continue

      if (

        !includeArchived &&

        (neighbor.archivedAt !== null ||

          neighbor.attributes.status === 'archived')

      ) continue

      if (!includeHistoricalVersions && !neighbor.version.isCurrent) continue

      const nextNodeIds = [...current.nodeIds, neighbor.id]

      const nextEdgeIds = [...current.edgeIds, entry.edge.id]

      if (neighbor.id === targetNodeId) {

        const path = materializePath(

          input.graph,

          indexes,

          sourceNodeId,

          targetNodeId,

          nextNodeIds,

          nextEdgeIds,

        )

        if (shortestLength === null) {

          shortestLength = path.length

        }

        if (strategy === 'all' || path.length === shortestLength) {

          paths.push(path)

        }

        if (strategy === 'shortest') {

          queue.length = 0

          break

        }

        if (paths.length >= maximumPaths) {

          truncated = true

          queue.length = 0

          break

        }

        continue

      }

      const visited = new Set(current.visited)

      visited.add(neighbor.id)

      queue.push({

        nodeId: neighbor.id,

        nodeIds: nextNodeIds,

        edgeIds: nextEdgeIds,

        visited,

      })

    }

  }

  const warnings = paths.some(path => path.causalityWarning)

    ? [

        'Um ou mais caminhos contêm relações correlacionais. O caminho não representa causalidade comprovada.',

      ]

    : []

  const result: LearningGraphPathQueryResult = {

    success: true,

    graphId: input.graph.id,

    snapshotKey: input.graph.snapshotKey,

    sourceNodeId,

    targetNodeId,

    paths,

    totalPaths: paths.length,

    truncated,

    warnings,

    errors: [],

    generatedAt,

    correlationId,

    metadata: {

      engineName: ENGINE_NAME,

      engineVersion: ENGINE_VERSION,

      rulesetVersion: RULESET_VERSION,

      strategy,

      direction,

      maximumDepth,

      maximumPaths,

      causalInference: false,

    },

  }

  if (input.useCache ?? true) {

    queryCache.set(cacheKey, result, normalizeTtl(input.cacheTtlMs))

  }

  return result

}

export function getLearningGraphNodeById({

  graph,

  nodeId,

}: {

  graph: LearningGraphSnapshot

  nodeId: string

}): LearningGraphNode | null {

  const id = normalizeRequiredText(nodeId, 'ID do nó')

  return graph.nodes.find(node => node.id === id) ?? null

}

export function getLearningGraphNodeByKey({

  graph,

  nodeKey,

}: {

  graph: LearningGraphSnapshot

  nodeKey: string

}): LearningGraphNode | null {

  const key = normalizeRequiredText(nodeKey, 'Chave do nó')

  return graph.nodes.find(node => node.nodeKey === key) ?? null

}

export function getLearningGraphEdgeById({

  graph,

  edgeId,

}: {

  graph: LearningGraphSnapshot

  edgeId: string

}): LearningGraphEdge | null {

  const id = normalizeRequiredText(edgeId, 'ID da relação')

  return graph.edges.find(edge => edge.id === id) ?? null

}

export function getLearningGraphEdgeByKey({

  graph,

  edgeKey,

}: {

  graph: LearningGraphSnapshot

  edgeKey: string

}): LearningGraphEdge | null {

  const key = normalizeRequiredText(edgeKey, 'Chave da relação')

  return graph.edges.find(edge => edge.edgeKey === key) ?? null

}

export function clearLearningGraphQueryCache(): void {

  queryCache.clear()

}

export function getLearningGraphQueryEngineInfo():

  LearningGraphQueryEngineInfo {

  return {

    name: ENGINE_NAME,

    version: ENGINE_VERSION,

    rulesetVersion: RULESET_VERSION,

    mode: 'deterministic',

    capabilities: [

      'node_query',

      'edge_query',

      'pedagogical_filters',

      'organizational_filters',

      'temporal_filters',

      'privacy_filters',

      'research_governance_filters',

      'neighbor_query',

      'radius_traversal',

      'subgraph_extraction',

      'shortest_path',

      'all_shortest_paths',

      'bounded_path_search',

      'ordering',

      'cursor_pagination',

      'memory_cache',

    ],

    limitations: [

      'Não acessa banco de dados.',

      'O cache é local ao processo.',

      'Não aplica RLS ou autorização de sessão.',

      'Não executa inferência causal.',

      'Não cria novas relações.',

      'A busca de caminhos é limitada por profundidade e quantidade.',

      'Não substitui validação pedagógica humana.',

    ],

  }

}

'''

path = Path('/mnt/data/graph-query.engine.ts')

path.write_text(content, encoding='utf-8')

print(f'Arquivo criado: {path} ({len(content.splitlines())} linhas)')