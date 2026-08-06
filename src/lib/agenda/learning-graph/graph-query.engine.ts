/**
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

export type LearningGraphQueryOrderDirection =
  | 'asc'
  | 'desc'

export type LearningGraphQueryMatchMode =
  | 'all'
  | 'any'

export type LearningGraphTraversalDirection =
  | 'outgoing'
  | 'incoming'
  | 'both'

export type LearningGraphPathStrategy =
  | 'shortest'
  | 'all_shortest'
  | 'all'

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
  direction:
    | 'incoming'
    | 'outgoing'
    | 'undirected'
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
  private readonly entries =
    new Map<string, CacheEntry<unknown>>()

  constructor(
    private readonly maximumEntries: number,
  ) {}

  get<T>(key: string): T | null {
    const entry =
      this.entries.get(key)

    if (!entry) {
      return null
    }

    if (
      entry.expiresAt <=
      Date.now()
    ) {
      this.entries.delete(key)
      return null
    }

    this.entries.delete(key)
    this.entries.set(key, entry)

    return entry.value as T
  }

  set<T>(
    key: string,
    value: T,
    ttlMs: number,
  ): void {
    this.removeExpired()

    if (this.entries.has(key)) {
      this.entries.delete(key)
    }

    while (
      this.entries.size >=
      this.maximumEntries
    ) {
      const oldestKey =
        this.entries
          .keys()
          .next()
          .value as
          string | undefined

      if (!oldestKey) {
        break
      }

      this.entries.delete(oldestKey)
    }

    this.entries.set(key, {
      value,
      expiresAt:
        Date.now() +
        ttlMs,
    })
  }

  clear(): void {
    this.entries.clear()
  }

  private removeExpired(): void {
    const now =
      Date.now()

    for (
      const [
        key,
        entry,
      ] of this.entries
    ) {
      if (
        entry.expiresAt <=
        now
      ) {
        this.entries.delete(key)
      }
    }
  }
}

const queryCache =
  new QueryCache(
    DEFAULT_MAXIMUM_CACHE_ENTRIES,
  )

function nowIso(): string {
  return new Date()
    .toISOString()
}

function normalizeOptionalText(
  value:
    string | null | undefined,
): string | null {
  return value?.trim() || null
}

function normalizeRequiredText(
  value:
    string | null | undefined,
  fieldName: string,
): string {
  const normalized =
    normalizeOptionalText(value)

  if (!normalized) {
    throw new Error(
      `${fieldName} é obrigatório.`,
    )
  }

  return normalized
}

function uniqueStrings(
  values:
    Array<
      string | null | undefined
    >,
): string[] {
  return Array.from(
    new Set(
      values
        .filter(
          (
            value,
          ): value is string =>
            typeof value ===
            'string',
        )
        .map(
          value =>
            value.trim(),
        )
        .filter(Boolean),
    ),
  )
}

function uniqueValues<T>(
  values: T[],
): T[] {
  return Array.from(
    new Set(values),
  )
}

function normalizeScore(
  value:
    number | null | undefined,
): number | null {
  if (
    value === null ||
    value === undefined ||
    !Number.isFinite(value)
  ) {
    return null
  }

  return Math.min(
    1,
    Math.max(0, value),
  )
}

function normalizeLimit(
  value:
    number | null | undefined,
): number {
  if (
    typeof value !==
      'number' ||
    !Number.isFinite(value)
  ) {
    return DEFAULT_LIMIT
  }

  return Math.min(
    MAXIMUM_LIMIT,
    Math.max(
      1,
      Math.floor(value),
    ),
  )
}

function normalizeOffset(
  value:
    number | null | undefined,
): number {
  if (
    typeof value !==
      'number' ||
    !Number.isFinite(value)
  ) {
    return 0
  }

  return Math.max(
    0,
    Math.floor(value),
  )
}

function normalizeDepth(
  value:
    number | null | undefined,
): number {
  if (
    typeof value !==
      'number' ||
    !Number.isFinite(value)
  ) {
    return DEFAULT_MAXIMUM_DEPTH
  }

  return Math.min(
    MAXIMUM_DEPTH,
    Math.max(
      0,
      Math.floor(value),
    ),
  )
}

function normalizeTtl(
  value:
    number | null | undefined,
): number {
  if (
    typeof value !==
      'number' ||
    !Number.isFinite(value)
  ) {
    return DEFAULT_CACHE_TTL_MS
  }

  return Math.min(
    MAXIMUM_CACHE_TTL_MS,
    Math.max(
      1_000,
      Math.floor(value),
    ),
  )
}

function normalizeDate(
  value:
    string | null | undefined,
): string | null {
  if (
    !value ||
    Number.isNaN(
      Date.parse(value),
    )
  ) {
    return null
  }

  return new Date(value)
    .toISOString()
}

function stableHash(
  value: string,
): string {
  let hash =
    2166136261

  for (
    let index = 0;
    index < value.length;
    index += 1
  ) {
    hash ^=
      value.charCodeAt(index)

    hash =
      Math.imul(
        hash,
        16777619,
      )
  }

  return (
    hash >>> 0
  )
    .toString(16)
    .padStart(8, '0')
}

function createStableId(
  prefix: string,
  value: string,
): string {
  return `${prefix}-${stableHash(value)}`
}

function calculateAverage(
  values:
    Array<
      number | null | undefined
    >,
): number | null {
  const valid =
    values.filter(
      (
        value,
      ): value is number =>
        typeof value ===
          'number' &&
        Number.isFinite(value),
    )

  if (valid.length === 0) {
    return null
  }

  return (
    valid.reduce(
      (
        total,
        value,
      ) =>
        total + value,
      0,
    ) /
    valid.length
  )
}

function intersects(
  source: string[],
  filter: string[],
): boolean {
  const filterSet =
    new Set(filter)

  return source.some(
    value =>
      filterSet.has(value),
  )
}

function containsAll(
  source: string[],
  filter: string[],
): boolean {
  const sourceSet =
    new Set(source)

  return filter.every(
    value =>
      sourceSet.has(value),
  )
}

function matchesList(
  source: string[],
  filter:
    string[] | undefined,
  mode:
    LearningGraphQueryMatchMode =
      'any',
): boolean {
  const required =
    filter ?? []

  if (required.length === 0) {
    return true
  }

  return mode === 'all'
    ? containsAll(
        source,
        required,
      )
    : intersects(
        source,
        required,
      )
}