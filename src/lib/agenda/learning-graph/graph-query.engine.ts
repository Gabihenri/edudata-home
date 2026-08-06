/**
 * EduData IA — EIOS
 * Capability 03: Learning Graph
 *
 * Motor oficial de consultas do Learning Graph.
 *
 * Responsabilidades:
 * - consultar nós e relações;
 * - aplicar filtros pedagógicos e organizacionais;
 * - localizar vizinhos;
 * - percorrer o grafo por profundidade;
 * - encontrar caminhos entre nós;
 * - extrair subgrafos;
 * - consultar zonas estruturais;
 * - aplicar filtros temporais;
 * - aplicar filtros de privacidade e pesquisa;
 * - ordenar e paginar resultados;
 * - oferecer uma interface única para todos os produtos do EIOS.
 *
 * Este motor:
 * - não acessa banco de dados;
 * - não contém interface visual;
 * - não altera o snapshot;
 * - não executa inferência causal;
 * - não transforma correlação em causalidade;
 * - não substitui autorização, RLS ou governança de acesso.
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

const ENGINE_NAME =
  'eios-graph-query-engine'

const ENGINE_VERSION =
  '1.0.0'

const RULESET_VERSION =
  'graph-query-ruleset-1.0.0'

const DEFAULT_LIMIT =
  50

const MAXIMUM_LIMIT =
  500

const DEFAULT_MAXIMUM_DEPTH =
  3

const MAXIMUM_DEPTH =
  12

const DEFAULT_CACHE_TTL_MS =
  30_000

const DEFAULT_MAXIMUM_CACHE_ENTRIES =
  200

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
  allowedLevels?:
    LearningGraphPrivacyLevel[]

  excludePersonalData?:
    boolean

  excludeSensitiveData?:
    boolean

  excludeMinorData?:
    boolean

  requireAnonymized?:
    boolean

  requirePseudonymized?:
    boolean

  requireAggregated?:
    boolean
}

export type LearningGraphResearchFilter = {
  requireEligible?:
    boolean

  requireLongitudinalUse?:
    boolean

  requireCorrelationUse?:
    boolean

  requirePredictionUse?:
    boolean

  requireGroupAnalysis?:
    boolean

  requireSubgroupAnalysis?:
    boolean

  requireExternalEventAnalysis?:
    boolean

  requireZoneInfluenceAnalysis?:
    boolean

  requireGroupFormationAnalysis?:
    boolean

  requireGroupReorganizationAnalysis?:
    boolean

  requireHypothesisGeneration?:
    boolean

  requireCausalInference?:
    boolean

  excludeHumanSubjectsReview?:
    boolean
}

export type LearningGraphTemporalFilter = {
  validAt?:
    string | null

  validFrom?:
    string | null

  validUntil?:
    string | null

  observedFrom?:
    string | null

  observedUntil?:
    string | null

  recordedFrom?:
    string | null

  recordedUntil?:
    string | null

  academicYears?:
    number[]

  academicPeriodIds?:
    string[]

  temporalStatuses?:
    LearningGraphTemporalStatus[]
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

  learningObjectiveIds?:
    string[]

  skillIds?: string[]

  competencyIds?: string[]

  curriculumReferenceIds?:
    string[]

  evidenceIds?: string[]

  evidenceIntelligenceRunIds?:
    string[]

  pedagogicalAnalysisIds?:
    string[]

  interventionIds?: string[]

  indicatorIds?: string[]

  assessmentIds?: string[]

  assessmentResultIds?:
    string[]

  learningResultIds?:
    string[]

  externalEventIds?: string[]

  locationIds?: string[]

  tags?: string[]

  matchMode?:
    LearningGraphQueryMatchMode
}

export type LearningGraphNodeFilter = {
  ids?: string[]

  keys?: string[]

  types?:
    LearningGraphNodeType[]

  subtypes?: string[]

  statuses?: string[]

  titleContains?: string | null

  descriptionContains?:
    string | null

  sourceEntityIds?: string[]

  sourceSystems?: string[]

  minimumConfidence?:
    number | null

  maximumConfidence?:
    number | null

  requireHumanReview?:
    boolean | null

  includeArchived?:
    boolean

  includeHistoricalVersions?:
    boolean

  pedagogical?:
    LearningGraphPedagogicalFilter

  temporal?:
    LearningGraphTemporalFilter

  privacy?:
    LearningGraphQueryPrivacyFilter

  research?:
    LearningGraphResearchFilter
}

export type LearningGraphEdgeFilter = {
  ids?: string[]

  keys?: string[]

  types?:
    LearningGraphRelationType[]

  customTypes?: string[]

  directions?:
    LearningGraphRelationDirection[]

  sourceNodeIds?: string[]

  targetNodeIds?: string[]

  nodeIds?: string[]

  minimumWeight?:
    number | null

  maximumWeight?:
    number | null

  minimumConfidence?:
    number | null

  maximumConfidence?:
    number | null

  directRelation?:
    boolean | null

  inferredRelation?:
    boolean | null

  validatedByHuman?:
    boolean | null

  positiveInfluence?:
    boolean | null

  includeArchived?:
    boolean

  includeHistoricalVersions?:
    boolean

  temporal?:
    LearningGraphTemporalFilter

  privacy?:
    LearningGraphQueryPrivacyFilter

  research?:
    LearningGraphResearchFilter
}

export type LearningGraphQueryPagination = {
  limit?: number

  cursor?: string | null

  offset?: number
}

export type LearningGraphQueryOrdering = {
  field:
    LearningGraphQueryOrderField

  direction:
    LearningGraphQueryOrderDirection
}

export type QueryLearningGraphInput = {
  graph:
    LearningGraphSnapshot

  query?:
    LearningGraphQuery

  nodeFilter?:
    LearningGraphNodeFilter

  edgeFilter?:
    LearningGraphEdgeFilter

  ordering?:
    LearningGraphQueryOrdering

  pagination?:
    LearningGraphQueryPagination

  includeMetrics?:
    boolean

  includeConnectedEdges?:
    boolean

  includeConnectedNodes?:
    boolean

  requestedByUserId?:
    string | null

  correlationId?:
    string | null

  useCache?:
    boolean

  cacheTtlMs?:
    number

  metadata?:
    LearningGraphMetadata
}

export type LearningGraphNeighborQueryInput = {
  graph:
    LearningGraphSnapshot

  nodeId: string

  direction?:
    LearningGraphTraversalDirection

  relationTypes?:
    LearningGraphRelationType[]

  neighborNodeTypes?:
    LearningGraphNodeType[]

  depth?: number

  includeStartNode?:
    boolean

  includeArchived?:
    boolean

  includeHistoricalVersions?:
    boolean

  minimumConfidence?:
    number | null

  privacy?:
    LearningGraphQueryPrivacyFilter

  research?:
    LearningGraphResearchFilter

  useCache?:
    boolean

  cacheTtlMs?:
    number

  correlationId?:
    string | null
}

export type LearningGraphPathQueryInput = {
  graph:
    LearningGraphSnapshot

  sourceNodeId: string

  targetNodeId: string

  strategy?:
    LearningGraphPathStrategy

  direction?:
    LearningGraphTraversalDirection

  relationTypes?:
    LearningGraphRelationType[]

  allowedNodeTypes?:
    LearningGraphNodeType[]

  maximumDepth?: number

  maximumPaths?: number

  includeArchived?:
    boolean

  includeHistoricalVersions?:
    boolean

  minimumConfidence?:
    number | null

  useCache?:
    boolean

  cacheTtlMs?:
    number

  correlationId?:
    string | null
}

export type LearningGraphSubgraphQueryInput = {
  graph:
    LearningGraphSnapshot

  rootNodeIds: string[]

  depth?: number

  direction?:
    LearningGraphTraversalDirection

  relationTypes?:
    LearningGraphRelationType[]

  nodeTypes?:
    LearningGraphNodeType[]

  includeRootNodes?:
    boolean

  includeArchived?:
    boolean

  includeHistoricalVersions?:
    boolean

  minimumConfidence?:
    number | null

  privacy?:
    LearningGraphQueryPrivacyFilter

  research?:
    LearningGraphResearchFilter

  useCache?:
    boolean

  cacheTtlMs?:
    number

  correlationId?:
    string | null
}

export type LearningGraphPath = {
  id: string

  sourceNodeId: string

  targetNodeId: string

  nodeIds: string[]

  edgeIds: string[]

  relationTypes:
    LearningGraphRelationType[]

  length: number

  averageConfidence:
    number | null

  minimumConfidence:
    number | null

  containsInferredRelations:
    boolean

  humanValidated:
    boolean

  causalityWarning:
    boolean

  metadata:
    LearningGraphMetadata
}

export type LearningGraphPathQueryResult = {
  success: boolean

  graphId: string

  snapshotKey: string

  sourceNodeId: string

  targetNodeId: string

  paths:
    LearningGraphPath[]

  totalPaths: number

  truncated: boolean

  warnings: string[]

  errors: string[]

  generatedAt: string

  correlationId: string

  metadata:
    LearningGraphMetadata
}

export type LearningGraphTraversalResult = {
  success: boolean

  graphId: string

  snapshotKey: string

  rootNodeIds: string[]

  nodes:
    LearningGraphNode[]

  edges:
    LearningGraphEdge[]

  depthReached: number

  visitedNodeCount: number

  visitedEdgeCount: number

  warnings: string[]

  errors: string[]

  generatedAt: string

  correlationId: string

  metadata:
    LearningGraphMetadata
}

export type LearningGraphQueryEngineInfo = {
  name: string

  version: string

  rulesetVersion: string

  mode:
    'deterministic'

  capabilities: string[]

  limitations: string[]
}

type NormalizedQueryInput = {
  graph:
    LearningGraphSnapshot

  query:
    LearningGraphQuery | null

  nodeFilter:
    LearningGraphNodeFilter

  edgeFilter:
    LearningGraphEdgeFilter

  ordering:
    LearningGraphQueryOrdering

  pagination:
    Required<
      LearningGraphQueryPagination
    >

  includeMetrics:
    boolean

  includeConnectedEdges:
    boolean

  includeConnectedNodes:
    boolean

  requestedByUserId:
    string | null

  correlationId: string

  useCache: boolean

  cacheTtlMs: number

  metadata:
    LearningGraphMetadata
}

type AdjacencyEntry = {
  edge:
    LearningGraphEdge

  neighborNodeId: string

  direction:
    'incoming'
    | 'outgoing'
    | 'undirected'
}

type GraphIndexes = {
  nodeById:
    Map<
      string,
      LearningGraphNode
    >

  nodeByKey:
    Map<
      string,
      LearningGraphNode
    >

  edgeById:
    Map<
      string,
      LearningGraphEdge
    >

  edgeByKey:
    Map<
      string,
      LearningGraphEdge
    >

  adjacency:
    Map<
      string,
      AdjacencyEntry[]
    >
}

type CacheEntry<T> = {
  value: T

  expiresAt: number

  createdAt: number
}

class LearningGraphQueryCache {
  private readonly entries =
    new Map<
      string,
      CacheEntry<unknown>
    >()

  constructor(
    private readonly maximumEntries:
      number,
  ) {}

  get<T>(
    key: string,
  ): T | null {
    const entry =
      this.entries.get(
        key,
      )

    if (!entry) {
      return null
    }

    if (
      entry.expiresAt <=
      Date.now()
    ) {
      this.entries.delete(
        key,
      )

      return null
    }

    this.entries.delete(
      key,
    )

    this.entries.set(
      key,
      entry,
    )

    return entry.value as T
  }

  set<T>({
    key,
    value,
    ttlMs,
  }: {
    key: string

    value: T

    ttlMs: number
  }): void {
    this.removeExpired()

    if (
      this.entries.has(
        key,
      )
    ) {
      this.entries.delete(
        key,
      )
    }

    while (
      this.entries.size >=
      this.maximumEntries
    ) {
      const firstKey =
        this.entries
          .keys()
          .next()
          .value as
          string | undefined

      if (!firstKey) {
        break
      }

      this.entries.delete(
        firstKey,
      )
    }

    const createdAt =
      Date.now()

    this.entries.set(
      key,
      {
        value,

        createdAt,

        expiresAt:
          createdAt +
          ttlMs,
      },
    )
  }

  clear(): void {
    this.entries.clear()
  }

  private removeExpired():
    void {
    const currentTime =
      Date.now()

    for (
      const [
        key,
        entry,
      ] of this.entries
    ) {
      if (
        entry.expiresAt <=
        currentTime
      ) {
        this.entries.delete(
          key,
        )
      }
    }
  }
}

const queryCache =
  new LearningGraphQueryCache(
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
  if (
    value === undefined ||
    value === null
  ) {
    return null
  }

  return value.trim() || null
}

function normalizeRequiredText(
  value:
    string | null | undefined,
  fieldName:
    string,
): string {
  const normalized =
    normalizeOptionalText(
      value,
    )

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

function clampScore(
  value:
    number | null | undefined,
): number | null {
  if (
    value === undefined ||
    value === null ||
    !Number.isFinite(value)
  ) {
    return null
  }

  return Math.min(
    1,
    Math.max(
      0,
      value,
    ),
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
    300_000,
    Math.max(
      1_000,
      Math.floor(value),
    ),
  )
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
      value.charCodeAt(
        index,
      )

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
    .padStart(
      8,
      '0',
    )
}

function createStableId(
  prefix:
    string,
  value:
    string,
): string {
  return [
    prefix,
    stableHash(value),
  ].join('-')
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

function calculateAverage(
  values:
    Array<
      number | null | undefined
    >,
): number | null {
  const validValues =
    values.filter(
      (
        value,
      ): value is number =>
        typeof value ===
          'number' &&
        Number.isFinite(value),
    )

  if (
    validValues.length ===
    0
  ) {
    return null
  }

  return (
    validValues.reduce(
      (
        total,
        value,
      ) =>
        total + value,
      0,
    ) /
    validValues.length
  )
}

function intersects(
  left:
    string[],
  right:
    string[],
): boolean {
  if (
    left.length === 0 ||
    right.length === 0
  ) {
    return false
  }

  const rightSet =
    new Set(right)

  return left.some(
    value =>
      rightSet.has(
        value,
      ),
  )
}

function containsAll(
  source:
    string[],
  required:
    string[],
): boolean {
  if (
    required.length ===
    0
  ) {
    return true
  }

  const sourceSet =
    new Set(source)

  return required.every(
    value =>
      sourceSet.has(
        value,
      ),
  )
}

function matchList({
  source,
  filter,
  mode,
}: {
  source: string[]

  filter:
    string[]

  mode:
    LearningGraphQueryMatchMode
}): boolean {
  if (
    filter.length ===
    0
  ) {
    return true
  }

  return mode ===
    'all'
    ? containsAll(
        source,
        filter,
      )
    : intersects(
        source,
        filter,
      )
}

function normalizePedagogicalFilter(
  value:
    LearningGraphPedagogicalFilter | undefined,
): LearningGraphPedagogicalFilter {
  return {
    userIds:
      uniqueStrings(
        value?.userIds ??
        [],
      ),

    teacherIds:
      uniqueStrings(
        value?.teacherIds ??
        [],
      ),

    studentIds:
      uniqueStrings(
        value?.studentIds ??
        [],
      ),

    organizationIds:
      uniqueStrings(
        value?.organizationIds ??
        [],
      ),

    schoolIds:
      uniqueStrings(
        value?.schoolIds ??
        [],
      ),

    classIds:
      uniqueStrings(
        value?.classIds ??
        [],
      ),

    groupIds:
      uniqueStrings(
        value?.groupIds ??
        [],
      ),

    planningIds:
      uniqueStrings(
        value?.planningIds ??
        [],
      ),

    lessonIds:
      uniqueStrings(
        value?.lessonIds ??
        [],
      ),

    learningObjectiveIds:
      uniqueStrings(
        value
          ?.learningObjectiveIds ??
        [],
      ),

    skillIds:
      uniqueStrings(
        value?.skillIds ??
        [],
      ),

    competencyIds:
      uniqueStrings(
        value?.competencyIds ??
        [],
      ),

    curriculumReferenceIds:
      uniqueStrings(
        value
          ?.curriculumReferenceIds ??
        [],
      ),

    evidenceIds:
      uniqueStrings(
        value?.evidenceIds ??
        [],
      ),

    evidenceIntelligenceRunIds:
      uniqueStrings(
        value
          ?.evidenceIntelligenceRunIds ??
        [],
      ),

    pedagogicalAnalysisIds:
      uniqueStrings(
        value
          ?.pedagogicalAnalysisIds ??
        [],
      ),

    interventionIds:
      uniqueStrings(
        value?.interventionIds ??
        [],
      ),

    indicatorIds:
      uniqueStrings(
        value?.indicatorIds ??
        [],
      ),

    assessmentIds:
      uniqueStrings(
        value?.assessmentIds ??
        [],
      ),

    assessmentResultIds:
      uniqueStrings(
        value
          ?.assessmentResultIds ??
        [],
      ),

    learningResultIds:
      uniqueStrings(
        value
          ?.learningResultIds ??
        [],
      ),

    externalEventIds:
      uniqueStrings(
        value?.externalEventIds ??
        [],
      ),

    locationIds:
      uniqueStrings(
        value?.locationIds ??
        [],
      ),

    tags:
      uniqueStrings(
        value?.tags ??
        [],
      ),

    matchMode:
      value?.matchMode ??
      'any',
  }
}

function normalizeTemporalFilter(
  value:
    LearningGraphTemporalFilter | undefined,
): LearningGraphTemporalFilter {
  return {
    validAt:
      normalizeDate(
        value?.validAt,
      ),

    validFrom:
      normalizeDate(
        value?.validFrom,
      ),

    validUntil:
      normalizeDate(
        value?.validUntil,
      ),

    observedFrom:
      normalizeDate(
        value?.observedFrom,
      ),

    observedUntil:
      normalizeDate(
        value?.observedUntil,
      ),

    recordedFrom:
      normalizeDate(
        value?.recordedFrom,
      ),

    recordedUntil:
      normalizeDate(
        value?.recordedUntil,
      ),

    academicYears:
      uniqueValues(
        (
          value?.academicYears ??
          []
        ).filter(
          year =>
            Number.isInteger(
              year,
            ),
        ),
      ),

    academicPeriodIds:
      uniqueStrings(
        value
          ?.academicPeriodIds ??
        [],
      ),

    temporalStatuses:
      uniqueValues(
        value
          ?.temporalStatuses ??
        [],
      ),
  }
}

function normalizePrivacyFilter(
  value:
    LearningGraphQueryPrivacyFilter | undefined,
): LearningGraphQueryPrivacyFilter {
  return {
    allowedLevels:
      uniqueValues(
        value?.allowedLevels ??
        [],
      ),

    excludePersonalData:
      value?.excludePersonalData ??
      false,

    excludeSensitiveData:
      value?.excludeSensitiveData ??
      false,

    excludeMinorData:
      value?.excludeMinorData ??
      false,

    requireAnonymized:
      value?.requireAnonymized ??
      false,

    requirePseudonymized:
      value?.requirePseudonymized ??
      false,

    requireAggregated:
      value?.requireAggregated ??
      false,
  }
}

function normalizeResearchFilter(
  value:
    LearningGraphResearchFilter | undefined,
): LearningGraphResearchFilter {
  return {
    requireEligible:
      value?.requireEligible ??
      false,

    requireLongitudinalUse:
      value
        ?.requireLongitudinalUse ??
      false,

    requireCorrelationUse:
      value
        ?.requireCorrelationUse ??
      false,

    requirePredictionUse:
      value
        ?.requirePredictionUse ??
      false,

    requireGroupAnalysis:
      value
        ?.requireGroupAnalysis ??
      false,

    requireSubgroupAnalysis:
      value
        ?.requireSubgroupAnalysis ??
      false,

    requireExternalEventAnalysis:
      value
        ?.requireExternalEventAnalysis ??
      false,

    requireZoneInfluenceAnalysis:
      value
        ?.requireZoneInfluenceAnalysis ??
      false,

    requireGroupFormationAnalysis:
      value
        ?.requireGroupFormationAnalysis ??
      false,

    requireGroupReorganizationAnalysis:
      value
        ?.requireGroupReorganizationAnalysis ??
      false,

    requireHypothesisGeneration:
      value
        ?.requireHypothesisGeneration ??
      false,

    requireCausalInference:
      value
        ?.requireCausalInference ??
      false,

    excludeHumanSubjectsReview:
      value
        ?.excludeHumanSubjectsReview ??
      false,
  }
}

function normalizeNodeFilter(
  value:
    LearningGraphNodeFilter | undefined,
): LearningGraphNodeFilter {
  return {
    ids:
      uniqueStrings(
        value?.ids ??
        [],
      ),

    keys:
      uniqueStrings(
        value?.keys ??
        [],
      ),

    types:
      uniqueValues(
        value?.types ??
        [],
      ),

    subtypes:
      uniqueStrings(
        value?.subtypes ??
        [],
      ),

    statuses:
      uniqueStrings(
        value?.statuses ??
        [],
      ),

    titleContains:
      normalizeOptionalText(
        value?.titleContains,
      ),

    descriptionContains:
      normalizeOptionalText(
        value
          ?.descriptionContains,
      ),

    sourceEntityIds:
      uniqueStrings(
        value
          ?.sourceEntityIds ??
        [],
      ),

    sourceSystems:
      uniqueStrings(
        value?.sourceSystems ??
        [],
      ),

    minimumConfidence:
      clampScore(
        value?.minimumConfidence,
      ),

    maximumConfidence:
      clampScore(
        value?.maximumConfidence,
      ),

    requireHumanReview:
      value
        ?.requireHumanReview ??
      null,

    includeArchived:
      value?.includeArchived ??
      false,

    includeHistoricalVersions:
      value
        ?.includeHistoricalVersions ??
      false,

    pedagogical:
      normalizePedagogicalFilter(
        value?.pedagogical,
      ),

    temporal:
      normalizeTemporalFilter(
        value?.temporal,
      ),

    privacy:
      normalizePrivacyFilter(
        value?.privacy,
      ),

    research:
      normalizeResearchFilter(
        value?.research,
      ),
  }
}

function normalizeEdgeFilter(
  value:
    LearningGraphEdgeFilter | undefined,
): LearningGraphEdgeFilter {
  return {
    ids:
      uniqueStrings(
        value?.ids ??
        [],
      ),

    keys:
      uniqueStrings(
        value?.keys ??
        [],
      ),

    types:
      uniqueValues(
        value?.types ??
        [],
      ),

    customTypes:
      uniqueStrings(
        value?.customTypes ??
        [],
      ),

    directions:
      uniqueValues(
        value?.directions ??
        [],
      ),

    sourceNodeIds:
      uniqueStrings(
        value
          ?.sourceNodeIds ??
        [],
      ),

    targetNodeIds:
      uniqueStrings(
        value
          ?.targetNodeIds ??
        [],
      ),

    nodeIds:
      uniqueStrings(
        value?.nodeIds ??
        [],
      ),

    minimumWeight:
      clampScore(
        value?.minimumWeight,
      ),

    maximumWeight:
      clampScore(
        value?.maximumWeight,
      ),

    minimumConfidence:
      clampScore(
        value?.minimumConfidence,
      ),

    maximumConfidence:
      clampScore(
        value?.maximumConfidence,
      ),

    directRelation:
      value?.directRelation ??
      null,

    inferredRelation:
      value?.inferredRelation ??
      null,

    validatedByHuman:
      value
        ?.validatedByHuman ??
      null,

    positiveInfluence:
      value
        ?.positiveInfluence ??
      null,

    includeArchived:
      value?.includeArchived ??
      false,

    includeHistoricalVersions:
      value
        ?.includeHistoricalVersions ??
      false,

    temporal:
      normalizeTemporalFilter(
        value?.temporal,
      ),

    privacy:
      normalizePrivacyFilter(
        value?.privacy,
      ),

    research:
      normalizeResearchFilter(
        value?.research,
      ),
  }
}

function mergeQueryIntoFilters({
  query,
  nodeFilter,
  edgeFilter,
}: {
  query:
    LearningGraphQuery | null

  nodeFilter:
    LearningGraphNodeFilter

  edgeFilter:
    LearningGraphEdgeFilter
}): {
  nodeFilter:
    LearningGraphNodeFilter

  edgeFilter:
    LearningGraphEdgeFilter
} {
  if (!query) {
    return {
      nodeFilter,

      edgeFilter,
    }
  }

  return {
    nodeFilter: {
      ...nodeFilter,

      ids:
        uniqueStrings([
          ...(
            nodeFilter.ids ??
            []
          ),

          ...(
            query.nodeIds ??
            []
          ),
        ]),

      keys:
        uniqueStrings([
          ...(
            nodeFilter.keys ??
            []
          ),

          ...(
            query.nodeKeys ??
            []
          ),
        ]),

      types:
        uniqueValues([
          ...(
            nodeFilter.types ??
            []
          ),

          ...(
            query.nodeTypes ??
            []
          ),
        ]),

      minimumConfidence:
        query.minimumConfidence ??
        nodeFilter
          .minimumConfidence,

      includeArchived:
        query.includeArchived ??
        nodeFilter
          .includeArchived,

      includeHistoricalVersions:
        query
          .includeHistoricalVersions ??
        nodeFilter
          .includeHistoricalVersions,

      pedagogical:
        normalizePedagogicalFilter({
          ...nodeFilter.pedagogical,

          organizationIds:
            uniqueStrings([
              ...(
                nodeFilter
                  .pedagogical
                  ?.organizationIds ??
                []
              ),

              ...(
                query.organizationId
                  ? [
                      query
                        .organizationId,
                    ]
                  : []
              ),
            ]),

          schoolIds:
            uniqueStrings([
              ...(
                nodeFilter
                  .pedagogical
                  ?.schoolIds ??
                []
              ),

              ...(
                query.schoolId
                  ? [
                      query
                        .schoolId,
                    ]
                  : []
              ),
            ]),

          classIds:
            uniqueStrings([
              ...(
                nodeFilter
                  .pedagogical
                  ?.classIds ??
                []
              ),

              ...(
                query.classIds ??
                []
              ),
            ]),

          planningIds:
            uniqueStrings([
              ...(
                nodeFilter
                  .pedagogical
                  ?.planningIds ??
                []
              ),

              ...(
                query.planningIds ??
                []
              ),
            ]),

          lessonIds:
            uniqueStrings([
              ...(
                nodeFilter
                  .pedagogical
                  ?.lessonIds ??
                []
              ),

              ...(
                query.lessonIds ??
                []
              ),
            ]),

          learningObjectiveIds:
            uniqueStrings([
              ...(
                nodeFilter
                  .pedagogical
                  ?.learningObjectiveIds ??
                []
              ),

              ...(
                query
                  .learningObjectiveIds ??
                []
              ),
            ]),

          skillIds:
            uniqueStrings([
              ...(
                nodeFilter
                  .pedagogical
                  ?.skillIds ??
                []
              ),

              ...(
                query.skillIds ??
                []
              ),
            ]),

          competencyIds:
            uniqueStrings([
              ...(
                nodeFilter
                  .pedagogical
                  ?.competencyIds ??
                []
              ),

              ...(
                query
                  .competencyIds ??
                []
              ),
            ]),

          evidenceIds:
            uniqueStrings([
              ...(
                nodeFilter
                  .pedagogical
                  ?.evidenceIds ??
                []
              ),

              ...(
                query.evidenceIds ??
                []
              ),
            ]),

          interventionIds:
            uniqueStrings([
              ...(
                nodeFilter
                  .pedagogical
                  ?.interventionIds ??
                []
              ),

              ...(
                query
                  .interventionIds ??
                []
              ),
            ]),

          indicatorIds:
            uniqueStrings([
              ...(
                nodeFilter
                  .pedagogical
                  ?.indicatorIds ??
                []
              ),

              ...(
                query.indicatorIds ??
                []
              ),
            ]),

          assessmentIds:
            uniqueStrings([
              ...(
                nodeFilter
                  .pedagogical
                  ?.assessmentIds ??
                []
              ),

              ...(
                query
                  .assessmentIds ??
                []
              ),
            ]),
        }),

      temporal:
        normalizeTemporalFilter({
          ...nodeFilter.temporal,

          validAt:
            query.validAt ??
            nodeFilter.temporal
              ?.validAt,

          academicPeriodIds:
            uniqueStrings([
              ...(
                nodeFilter
                  .temporal
                  ?.academicPeriodIds ??
                []
              ),

              ...(
                query
                  .academicPeriodIds ??
                []
              ),
            ]),
        }),
    },

    edgeFilter: {
      ...edgeFilter,

      ids:
        uniqueStrings([
          ...(
            edgeFilter.ids ??
            []
          ),

          ...(
            query.edgeIds ??
            []
          ),
        ]),

      types:
        uniqueValues([
          ...(
            edgeFilter.types ??
            []
          ),

          ...(
            query.relationTypes ??
            []
          ),
        ]),

      sourceNodeIds:
        uniqueStrings([
          ...(
            edgeFilter
              .sourceNodeIds ??
            []
          ),

          ...(
            query.sourceNodeIds ??
            []
          ),
        ]),

      targetNodeIds:
        uniqueStrings([
          ...(
            edgeFilter
              .targetNodeIds ??
            []
          ),

          ...(
            query.targetNodeIds ??
            []
          ),
        ]),

      minimumConfidence:
        query.minimumConfidence ??
        edgeFilter
          .minimumConfidence,

      includeArchived:
        query.includeArchived ??
        edgeFilter
          .includeArchived,

      includeHistoricalVersions:
        query
          .includeHistoricalVersions ??
        edgeFilter
          .includeHistoricalVersions,
    },
  }
}

function normalizeQueryInput(
  input:
    QueryLearningGraphInput,
): NormalizedQueryInput {
  const query =
    input.query ??
    null

  const merged =
    mergeQueryIntoFilters({
      query,

      nodeFilter:
        normalizeNodeFilter(
          input.nodeFilter,
        ),

      edgeFilter:
        normalizeEdgeFilter(
          input.edgeFilter,
        ),
    })

  return {
    graph:
      input.graph,

    query,

    nodeFilter:
      merged.nodeFilter,

    edgeFilter:
      merged.edgeFilter,

    ordering:
      input.ordering ?? {
        field:
          'updated_at',

        direction:
          'desc',
      },

    pagination: {
      limit:
        normalizeLimit(
          input.pagination
            ?.limit ??
          query?.limit,
        ),

      cursor:
        normalizeOptionalText(
          input.pagination
            ?.cursor ??
          query?.cursor,
        ) ??
        '',

      offset:
        normalizeOffset(
          input.pagination
            ?.offset,
        ),
    },

    includeMetrics:
      input.includeMetrics ??
      true,

    includeConnectedEdges:
      input
        .includeConnectedEdges ??
      true,

    includeConnectedNodes:
      input
        .includeConnectedNodes ??
      false,

    requestedByUserId:
      normalizeOptionalText(
        input.requestedByUserId,
      ),

    correlationId:
      normalizeOptionalText(
        input.correlationId,
      ) ??
      input.graph
        .traceability
        .correlationId,

    useCache:
      input.useCache ??
      true,

    cacheTtlMs:
      normalizeTtl(
        input.cacheTtlMs,
      ),

    metadata: {
      ...(input.metadata ?? {}),
    },
  }
}

function createIndexes(
  graph:
    LearningGraphSnapshot,
): GraphIndexes {
  const nodeById =
    new Map<
      string,
      LearningGraphNode
    >()

  const nodeByKey =
    new Map<
      string,
      LearningGraphNode
    >()

  const edgeById =
    new Map<
      string,
      LearningGraphEdge
    >()

  const edgeByKey =
    new Map<
      string,
      LearningGraphEdge
    >()

  const adjacency =
    new Map<
      string,
      AdjacencyEntry[]
    >()

  for (
    const node of
      graph.nodes
  ) {
    nodeById.set(
      node.id,
      node,
    )

    nodeByKey.set(
      node.nodeKey,
      node,
    )

    adjacency.set(
      node.id,
      [],
    )
  }

  for (
    const edge of
      graph.edges
  ) {
    edgeById.set(
      edge.id,
      edge,
    )

    edgeByKey.set(
      edge.edgeKey,
      edge,
    )

    const sourceEntries =
      adjacency.get(
        edge.sourceNodeId,
      )

    const targetEntries =
      adjacency.get(
        edge.targetNodeId,
      )

    if (
      !sourceEntries ||
      !targetEntries
    ) {
      continue
    }

    if (
      edge.direction ===
      'directed'
    ) {
      sourceEntries.push({
        edge,

        neighborNodeId:
          edge.targetNodeId,

        direction:
          'outgoing',
      })

      targetEntries.push({
        edge,

        neighborNodeId:
          edge.sourceNodeId,

        direction:
          'incoming',
      })

      continue
    }

    sourceEntries.push({
      edge,

      neighborNodeId:
        edge.targetNodeId,

      direction:
        'undirected',
    })

    targetEntries.push({
      edge,

      neighborNodeId:
        edge.sourceNodeId,

      direction:
        'undirected',
    })
  }

  return {
    nodeById,

    nodeByKey,

    edgeById,

    edgeByKey,

    adjacency,
  }
}

function matchesTemporalFilter(
  time:
    LearningGraphNode['time'],
  filter:
    LearningGraphTemporalFilter | undefined,
): boolean {
  if (!filter) {
    return true
  }

  const validFrom =
    normalizeDate(
      time.validFrom,
    )

  const validUntil =
    normalizeDate(
      time.validUntil,
    )

  const observedAt =
    normalizeDate(
      time.observedAt,
    )

  const recordedAt =
    normalizeDate(
      time.recordedAt,
    )

  const validAt =
    normalizeDate(
      filter.validAt,
    )

  if (validAt) {
    if (
      validFrom &&
      validFrom >
        validAt
    ) {
      return false
    }

    if (
      validUntil &&
      validUntil <
        validAt
    ) {
      return false
    }
  }

  const filterValidFrom =
    normalizeDate(
      filter.validFrom,
    )

  if (
    filterValidFrom &&
    validUntil &&
    validUntil <
      filterValidFrom
  ) {
    return false
  }

  const filterValidUntil =
    normalizeDate(
      filter.validUntil,
    )

  if (
    filterValidUntil &&
    validFrom &&
    validFrom >
      filterValidUntil
  ) {
    return false
  }

  const observedFrom =
    normalizeDate(
      filter.observedFrom,
    )

  if (
    observedFrom &&
    (
      !observedAt ||
      observedAt <
        observedFrom
    )
  ) {
    return false
  }

  const observedUntil =
    normalizeDate(
      filter.observedUntil,
    )

  if (
    observedUntil &&
    (
      !observedAt ||
      observedAt >
        observedUntil
    )
  ) {
    return false
  }

  const recordedFrom =
    normalizeDate(
      filter.recordedFrom,
    )

  if (
    recordedFrom &&
    (
      !recordedAt ||
      recordedAt <
        recordedFrom
    )
  ) {
    return false
  }

  const recordedUntil =
    normalizeDate(
      filter.recordedUntil,
    )

  if (
    recordedUntil &&
    (
      !recordedAt ||
      recordedAt >
        recordedUntil
    )
  ) {
    return false
  }

  if (
    (
      filter.academicYears ??
      []
    ).length >
      0 &&
    (
      time.academicYear ===
        undefined ||
      time.academicYear ===
        null ||
      !(
        filter.academicYears ??
        []
      ).includes(
        time.academicYear,
      )
    )
  ) {
    return false
  }

  if (
    (
      filter.academicPeriodIds ??
      []
    ).length >
      0 &&
    (
      !time.academicPeriodId ||
      !(
        filter
          .academicPeriodIds ??
        []
      ).includes(
        time.academicPeriodId,
      )
    )
  ) {
    return false
  }

  if (
    (
      filter.temporalStatuses ??
      []
    ).length >
      0 &&
    !(
      filter.temporalStatuses ??
      []
    ).includes(
      time.temporalStatus,
    )
  ) {
    return false
  }

  return true
}

function matchesPrivacyFilter(
  privacy:
    LearningGraphNode['privacy'],
  filter:
    LearningGraphQueryPrivacyFilter | undefined,
): boolean {
  if (!filter) {
    return true
  }

  if (
    (
      filter.allowedLevels ??
      []
    ).length >
      0 &&
    !(
      filter.allowedLevels ??
      []
    ).includes(
      privacy.level,
    )
  ) {
    return false
  }

  if (
    filter.excludePersonalData &&
    privacy.containsPersonalData
  ) {
    return false
  }

  if (
    filter.excludeSensitiveData &&
    privacy.containsSensitiveData
  ) {
    return false
  }

  if (
    filter.excludeMinorData &&
    privacy.containsMinorData
  ) {
    return false
  }

  if (
    filter.requireAnonymized &&
    !privacy.anonymized
  ) {
    return false
  }

  if (
    filter.requirePseudonymized &&
    !privacy.pseudonymized
  ) {
    return false
  }

  if (
    filter.requireAggregated &&
    !privacy.aggregated
  ) {
    return false
  }

  return true
}

function matchesResearchFilter(
  research:
    LearningGraphNode[
      'researchEligibility'
    ],
  filter:
    LearningGraphResearchFilter | undefined,
): boolean {
  if (!filter) {
    return true
  }

  if (
    filter.requireEligible &&
    !research.eligible
  ) {
    return false
  }

  if (
    filter.requireLongitudinalUse &&
    !research.longitudinalUseAllowed
  ) {
    return false
  }

  if (
    filter.requireCorrelationUse &&
    !research.correlationUseAllowed
  ) {
    return false
  }

  if (
    filter.requirePredictionUse &&
    !research.predictionUseAllowed
  ) {
    return false
  }

  if (
    filter.requireGroupAnalysis &&
    !research.groupAnalysisAllowed
  ) {
    return false
  }

  if (
    filter.requireSubgroupAnalysis &&
    !research.subgroupAnalysisAllowed
  ) {
    return false
  }

  if (
    filter
      .requireExternalEventAnalysis &&
    !research
      .externalEventAnalysisAllowed
  ) {
    return false
  }

  if (
    filter
      .requireZoneInfluenceAnalysis &&
    !research
      .zoneInfluenceAnalysisAllowed
  ) {
    return false
  }

  if (
    filter
      .requireGroupFormationAnalysis &&
    !research
      .groupFormationAnalysisAllowed
  ) {
    return false
  }

  if (
    filter
      .requireGroupReorganizationAnalysis &&
    !research
      .groupReorganizationAnalysisAllowed
  ) {
    return false
  }

  if (
    filter
      .requireHypothesisGeneration &&
    !research
      .hypothesisGenerationAllowed
  ) {
    return false
  }

  if (
    filter.requireCausalInference &&
    !research
      .causalInferenceAllowed
  ) {
    return false
  }

  if (
    filter
      .excludeHumanSubjectsReview &&
    research
      .humanSubjectsReviewRequired
  ) {
    return false
  }

  return true
}

function matchesPedagogicalFilter(
  node:
    LearningGraphNode,
  filter:
    LearningGraphPedagogicalFilter | undefined,
): boolean {
  if (!filter) {
    return true
  }

  const mode =
    filter.matchMode ??
    'any'

  const attributes =
    node.attributes

  const checks:
    boolean[] =
    []

  const addCheck = (
    source:
      string[],
    required:
      string[] | undefined,
  ) => {
    const normalizedRequired =
      required ??
      []

    if (
      normalizedRequired.length ===
      0
    ) {
      return
    }

    checks.push(
      matchList({
        source,

        filter:
          normalizedRequired,

        mode,
      }),
    )
  }

  addCheck(
    uniqueStrings([
      node.sourceEntity
        .entityId,

      attributes
        .ownerUserId,
    ]),
    filter.userIds,
  )

  addCheck(
    node.type ===
      'teacher'
      ? [
          node.sourceEntity
            .entityId,
        ]
      : [],
    filter.teacherIds,
  )

  addCheck(
    node.type ===
      'student'
      ? [
          node.sourceEntity
            .entityId,
        ]
      : [],
    filter.studentIds,
  )

  addCheck(
    uniqueStrings([
      attributes
        .organizationId,

      node.sourceEntity
        .organizationId,
    ]),
    filter.organizationIds,
  )

  addCheck(
    uniqueStrings([
      attributes.schoolId,

      node.sourceEntity
        .schoolId,
    ]),
    filter.schoolIds,
  )

  addCheck(
    attributes.classIds,
    filter.classIds,
  )

  addCheck(
    attributes.groupIds,
    filter.groupIds,
  )

  addCheck(
    attributes.planningIds,
    filter.planningIds,
  )

  addCheck(
    attributes.lessonIds,
    filter.lessonIds,
  )

  addCheck(
    attributes
      .learningObjectiveIds,
    filter.learningObjectiveIds,
  )

  addCheck(
    attributes.skillIds,
    filter.skillIds,
  )

  addCheck(
    attributes.competencyIds,
    filter.competencyIds,
  )

  addCheck(
    attributes
      .curriculumReferenceIds,
    filter
      .curriculumReferenceIds,
  )

  addCheck(
    attributes.evidenceIds,
    filter.evidenceIds,
  )

  addCheck(
    attributes
      .evidenceIntelligenceRunIds,
    filter
      .evidenceIntelligenceRunIds,
  )

  addCheck(
    attributes
      .pedagogicalAnalysisIds,
    filter
      .pedagogicalAnalysisIds,
  )

  addCheck(
    attributes.interventionIds,
    filter.interventionIds,
  )

  addCheck(
    attributes.indicatorIds,
    filter.indicatorIds,
  )

  addCheck(
    attributes.assessmentIds,
    filter.assessmentIds,
  )

  addCheck(
    attributes
      .assessmentResultIds,
    filter
      .assessmentResultIds,
  )

  addCheck(
    attributes
      .learningResultIds,
    filter.learningResultIds,
  )

  addCheck(
    attributes
      .externalEventIds,
    filter.externalEventIds,
  )

  addCheck(
    attributes.locationIds,
    filter.locationIds,
  )

  addCheck(
    attributes.tags,
    filter.tags,
  )

  if (
    checks.length ===
    0
  ) {
    return true
  }

  return mode ===
    'all'
    ? checks.every(Boolean)
    : checks.some(Boolean)
}

function matchesNodeFilter(
  node:
    LearningGraphNode,
  filter:
    LearningGraphNodeFilter,
): boolean {
  if (
    !filter.includeArchived &&
    (
      node.archivedAt !==
        null ||
      node.attributes.status ===
        'archived'
    )
  ) {
    return false
  }

  if (
    !filter
      .includeHistoricalVersions &&
    !node.version.isCurrent
  ) {
    return false
  }

  if (
    (
      filter.ids ??
      []
    ).length >
      0 &&
    !(
      filter.ids ??
      []
    ).includes(
      node.id,
    )
  ) {
    return false
  }

  if (
    (
      filter.keys ??
      []
    ).length >
      0 &&
    !(
      filter.keys ??
      []
    ).includes(
      node.nodeKey,
    )
  ) {
    return false
  }

  if (
    (
      filter.types ??
      []
    ).length >
      0 &&
    !(
      filter.types ??
      []
    ).includes(
      node.type,
    )
  ) {
    return false
  }

  if (
    (
      filter.subtypes ??
      []
    ).length >
      0 &&
    (
      !node.subtype ||
      !(
        filter.subtypes ??
        []
      ).includes(
        node.subtype,
      )
    )
  ) {
    return false
  }

  if (
    (
      filter.statuses ??
      []
    ).length >
      0 &&
    !(
      filter.statuses ??
      []
    ).includes(
      node.attributes.status,
    )
  ) {
    return false
  }

  const titleContains =
    normalizeOptionalText(
      filter.titleContains,
    )?.toLocaleLowerCase(
      'pt-BR',
    )

  if (
    titleContains &&
    !node.attributes.title
      .toLocaleLowerCase(
        'pt-BR',
      )
      .includes(
        titleContains,
      )
  ) {
    return false
  }

  const descriptionContains =
    normalizeOptionalText(
      filter.descriptionContains,
    )?.toLocaleLowerCase(
      'pt-BR',
    )

  if (
    descriptionContains &&
    !(
      node.attributes
        .description ??
      ''
    )
      .toLocaleLowerCase(
        'pt-BR',
      )
      .includes(
        descriptionContains,
      )
  ) {
    return false
  }

  if (
    (
      filter
        .sourceEntityIds ??
      []
    ).length >
      0 &&
    !(
      filter.sourceEntityIds ??
      []
    ).includes(
      node.sourceEntity
        .entityId,
    )
  ) {
    return false
  }

  if (
    (
      filter.sourceSystems ??
      []
    ).length >
      0 &&
    (
      !node.sourceEntity
        .sourceSystem ||
      !(
        filter.sourceSystems ??
        []
      ).includes(
        node.sourceEntity
          .sourceSystem,
      )
    )
  ) {
    return false
  }

  const confidence =
    node.confidence.value

  if (
    filter.minimumConfidence !==
      null &&
    filter.minimumConfidence !==
      undefined &&
    (
      confidence === null ||
      confidence <
        filter.minimumConfidence
    )
  ) {
    return false
  }

  if (
    filter.maximumConfidence !==
      null &&
    filter.maximumConfidence !==
      undefined &&
    (
      confidence === null ||
      confidence >
        filter.maximumConfidence
    )
  ) {
    return false
  }

  if (
    filter.requireHumanReview !==
      null &&
    filter.requireHumanReview !==
      undefined &&
    node.confidence
      .requiresHumanReview !==
      filter.requireHumanReview
  ) {
    return false
  }

  return (
    matchesPedagogicalFilter(
      node,
      filter.pedagogical,
    ) &&
    matchesTemporalFilter(
      node.time,
      filter.temporal,
    ) &&
    matchesPrivacyFilter(
      node.privacy,
      filter.privacy,
    ) &&
    matchesResearchFilter(
      node
        .researchEligibility,
      filter.research,
    )
  )
}

function matchesEdgeFilter(
  edge:
    LearningGraphEdge,
  filter:
    LearningGraphEdgeFilter,
): boolean {
  if (
    !filter.includeArchived &&
    edge.archivedAt !==
      null
  ) {
    return false
  }

  if (
    !filter
      .includeHistoricalVersions &&
    !edge.version.isCurrent
  ) {
    return false
  }

  if (
    (
      filter.ids ??
      []
    ).length >
      0 &&
    !(
      filter.ids ??
      []
    ).includes(
      edge.id,
    )
  ) {
    return false
  }

  if (
    (
      filter.keys ??
      []
    ).length >
      0 &&
    !(
      filter.keys ??
      []
    ).includes(
      edge.edgeKey,
    )
  ) {
    return false
  }

  if (
    (
      filter.types ??
      []
    ).length >
      0 &&
    !(
      filter.types ??
      []
    ).includes(
      edge.type,
    )
  ) {
    return false
  }

  if (
    (
      filter.customTypes ??
      []
    ).length >
      0 &&
    (
      !edge.customType ||
      !(
        filter.customTypes ??
        []
      ).includes(
        edge.customType,
      )
    )
  ) {
    return false
  }

  if (
    (
      filter.directions ??
      []
    ).length >
      0 &&
    !(
      filter.directions ??
      []
    ).includes(
      edge.direction,
    )
  ) {
    return false
  }

  if (
    (
      filter.sourceNodeIds ??
      []
    ).length >
      0 &&
    !(
      filter.sourceNodeIds ??
      []
    ).includes(
      edge.sourceNodeId,
    )
  ) {
    return false
  }

  if (
    (
      filter.targetNodeIds ??
      []
    ).length >
      0 &&
    !(
      filter.targetNodeIds ??
      []
    ).includes(
      edge.targetNodeId,
    )
  ) {
    return false
  }

  if (
    (
      filter.nodeIds ??
      []
    ).length >
      0 &&
    !(
      filter.nodeIds ??
      []
    ).some(
      nodeId =>
        nodeId ===
          edge.sourceNodeId ||
        nodeId ===
          edge.targetNodeId,
    )
  ) {
    return false
  }

  const weight =
    edge.attributes.weight

  if (
    filter.minimumWeight !==
      null &&
    filter.minimumWeight !==
      undefined &&
    (
      weight === null ||
      weight <
        filter.minimumWeight
    )
  ) {
    return false
  }

  if (
    filter.maximumWeight !==
      null &&
    filter.maximumWeight !==
      undefined &&
    (
      weight === null ||
      weight >
        filter.maximumWeight
    )
  ) {
    return false
  }

  const confidence =
    edge.attributes
      .confidence.value

  if (
    filter.minimumConfidence !==
      null &&
    filter.minimumConfidence !==
      undefined &&
    (
      confidence === null ||
      confidence <
        filter.minimumConfidence
    )
  ) {
    return false
  }

  if (
    filter.maximumConfidence !==
      null &&
    filter.maximumConfidence !==
      undefined &&
    (
      confidence === null ||
      confidence >
        filter.maximumConfidence
    )
  ) {
    return false
  }

  if (
    filter.directRelation !==
      null &&
    filter.directRelation !==
      undefined &&
    edge.attributes
      .directRelation !==
      filter.directRelation
  ) {
    return false
  }

  if (
    filter.inferredRelation !==
      null &&
    filter.inferredRelation !==
      undefined &&
    edge.attributes
      .inferredRelation !==
      filter.inferredRelation
  ) {
    return false
  }

  if (
    filter.validatedByHuman !==
      null &&
    filter.validatedByHuman !==
      undefined &&
    edge.attributes
      .validatedByHuman !==
      filter.validatedByHuman
  ) {
    return false
  }

  if (
    filter.positiveInfluence !==
      null &&
    filter.positiveInfluence !==
      undefined &&
    edge.attributes
      .positiveInfluence !==
      filter.positiveInfluence
  ) {
    return false
  }

  return (
    matchesTemporalFilter(
      edge.time,
      filter.temporal,
    ) &&
    matchesPrivacyFilter(
      edge.privacy,
      filter.privacy,
    ) &&
    matchesResearchFilter(
      edge
        .researchEligibility,
      filter.research,
    )
  )
}

function compareNullableNumbers(
  first:
    number | null,
  second:
    number | null,
): number {
  if (
    first === null &&
    second === null
  ) {
    return 0
  }

  if (first === null) {
    return 1
  }

  if (second === null) {
    return -1
  }

  return first - second
}

function sortNodes(
  nodes:
    LearningGraphNode[],
  ordering:
    LearningGraphQueryOrdering,
): LearningGraphNode[] {
  const direction =
    ordering.direction ===
      'asc'
      ? 1
      : -1

  return [
    ...nodes,
  ].sort(
    (
      first,
      second,
    ) => {
      let comparison =
        0

      switch (
        ordering.field
      ) {
        case 'created_at':
          comparison =
            Date.parse(
              first.createdAt,
            ) -
            Date.parse(
              second.createdAt,
            )
          break

        case 'updated_at':
          comparison =
            Date.parse(
              first.updatedAt,
            ) -
            Date.parse(
              second.updatedAt,
            )
          break

        case 'title':
          comparison =
            first.attributes.title
              .localeCompare(
                second
                  .attributes
                  .title,
                'pt-BR',
              )
          break

        case 'type':
          comparison =
            first.type
              .localeCompare(
                second.type,
              )
          break

        case 'confidence':
          comparison =
            compareNullableNumbers(
              first.confidence
                .value,
              second.confidence
                .value,
            )
          break

        case 'node_key':
          comparison =
            first.nodeKey
              .localeCompare(
                second.nodeKey,
              )
          break

        case 'edge_key':
          comparison =
            0
          break
      }

      return (
        comparison *
        direction
      )
    },
  )
}

function createCursor({
  offset,
  snapshotKey,
}: {
  offset: number

  snapshotKey: string
}): string {
  return [
    offset,
    stableHash(
      snapshotKey,
    ),
  ].join(':')
}

function parseCursor({
  cursor,
  snapshotKey,
}: {
  cursor:
    string | null | undefined

  snapshotKey: string
}): number {
  const normalized =
    normalizeOptionalText(
      cursor,
    )

  if (!normalized) {
    return 0
  }

  const [
    offsetValue,
    snapshotHash,
  ] =
    normalized.split(':')

  if (
    snapshotHash !==
    stableHash(
      snapshotKey,
    )
  ) {
    return 0
  }

  const offset =
    Number(offsetValue)

  return normalizeOffset(
    offset,
  )
}

function createCacheKey(
  operation:
    string,
  graph:
    LearningGraphSnapshot,
  input:
    unknown,
): string {
  return [
    operation,
    graph.id,
    graph.snapshotKey,
    graph.version.id,
    stableHash(
      JSON.stringify(input),
    ),
  ].join(':')
}

function cloneQueryResult(
  result:
    LearningGraphQueryResult,
): LearningGraphQueryResult {
  return {
    ...result,

    nodes: [
      ...result.nodes,
    ],

    edges: [
      ...result.edges,
    ],

    metrics:
      result.metrics
        ? {
            ...result.metrics,

            metadata: {
              ...result.metrics
                .metadata,
            },
          }
        : null,

    metadata: {
      ...result.metadata,
    },
  }
}

function createResultMetrics(
  nodes:
    LearningGraphNode[],
  edges:
    LearningGraphEdge[],
  generatedAt:
    string,
) {
  const nodeIds =
    new Set(
      nodes.map(
        node =>
          node.id,
      ),
    )

  const connectedEdges =
    edges.filter(
      edge =>
        nodeIds.has(
          edge.sourceNodeId,
        ) &&
        nodeIds.has(
          edge.targetNodeId,
        ),
    )

  const degree =
    new Map<
      string,
      number
    >()

  for (
    const node of nodes
  ) {
    degree.set(
      node.id,
      0,
    )
  }

  for (
    const edge of
      connectedEdges
  ) {
    degree.set(
      edge.sourceNodeId,
      (
        degree.get(
          edge.sourceNodeId,
        ) ??
        0
      ) + 1,
    )

    degree.set(
      edge.targetNodeId,
      (
        degree.get(
          edge.targetNodeId,
        ) ??
        0
      ) + 1,
    )
  }

  const possibleEdges =
    nodes.length > 1
      ? nodes.length *
        (
          nodes.length -
          1
        )
      : 0

  return {
    nodeCount:
      nodes.length,

    edgeCount:
      connectedEdges.length,

    activeNodeCount:
      nodes.filter(
        node =>
          node.archivedAt ===
            null &&
          node.attributes
            .status !==
            'archived',
      ).length,

    activeEdgeCount:
      connectedEdges.filter(
        edge =>
          edge.archivedAt ===
          null,
      ).length,

    inferredEdgeCount:
      connectedEdges.filter(
        edge =>
          edge.attributes
            .inferredRelation,
      ).length,

    humanValidatedEdgeCount:
      connectedEdges.filter(
        edge =>
          edge.attributes
            .validatedByHuman,
      ).length,

    isolatedNodeCount:
      Array.from(
        degree.values(),
      ).filter(
        value =>
          value === 0,
      ).length,

    connectedComponentCount:
      null,

    density:
      possibleEdges > 0
        ? connectedEdges.length /
          possibleEdges
        : null,

    averageDegree:
      nodes.length > 0
        ? (
            connectedEdges.length *
            2
          ) /
          nodes.length
        : null,

    confidenceScore:
      calculateAverage([
        ...nodes.map(
          node =>
            node.confidence
              .value,
        ),

        ...connectedEdges.map(
          edge =>
            edge.attributes
              .confidence.value,
        ),
      ]),

    evidenceCoverageScore:
      connectedEdges.length >
      0
        ? connectedEdges.filter(
            edge =>
              edge.attributes
                .evidence.length >
              0,
          ).length /
          connectedEdges.length
        : null,

    explainabilityCoverageScore:
      (
        nodes.length +
        connectedEdges.length
      ) >
      0
        ? (
            nodes.filter(
              node =>
                Boolean(
                  node.explainability
                    .summary
                    .trim(),
                ),
            ).length +
            connectedEdges.filter(
              edge =>
                Boolean(
                  edge.explainability
                    .summary
                    .trim(),
                ),
            ).length
          ) /
          (
            nodes.length +
            connectedEdges.length
          )
        : null,

    calculatedAt:
      generatedAt,

    metadata: {
      engineName:
        ENGINE_NAME,

      engineVersion:
        ENGINE_VERSION,

      partialResult:
        true,
    },
  }
}

export function queryLearningGraph(
  input:
    QueryLearningGraphInput,
): LearningGraphQueryResult {
  const generatedAt =
    nowIso()

  const normalized =
    normalizeQueryInput(
      input,
    )

  const cacheKey =
    createCacheKey(
      'query',
      normalized.graph,
      {
        query:
          normalized.query,

        nodeFilter:
          normalized.nodeFilter,

        edgeFilter:
          normalized.edgeFilter,

        ordering:
          normalized.ordering,

        pagination:
          normalized.pagination,

        includeMetrics:
          normalized
            .includeMetrics,

        includeConnectedEdges:
          normalized
            .includeConnectedEdges,

        includeConnectedNodes:
          normalized
            .includeConnectedNodes,
      },
    )

  if (
    normalized.useCache
  ) {
    const cached =
      queryCache.get<
        LearningGraphQueryResult
      >(
        cacheKey,
      )

    if (cached) {
      return cloneQueryResult(
        cached,
      )
    }
  }

  const indexes =
    createIndexes(
      normalized.graph,
    )

  let nodes =
    normalized.graph.nodes
      .filter(
        node =>
          matchesNodeFilter(
            node,
            normalized
              .nodeFilter,
          ),
      )

  let edges =
    normalized.graph.edges
      .filter(
        edge =>
          matchesEdgeFilter(
            edge,
            normalized
              .edgeFilter,
          ),
      )

  const explicitlyFilteredEdges =
    Boolean(
      (
        normalized.edgeFilter
          .ids ??
        []
      ).length ||
      (
        normalized.edgeFilter
          .keys ??
        []
      ).length ||
      (
        normalized.edgeFilter
          .types ??
        []
      ).length ||
      (
        normalized.edgeFilter
          .sourceNodeIds ??
        []
      ).length ||
      (
        normalized.edgeFilter
          .targetNodeIds ??
        []
      ).length ||
      (
        normalized.edgeFilter
          .nodeIds ??
        []
      ).length,
    )

  if (
    normalized
      .includeConnectedEdges &&
    !explicitlyFilteredEdges
  ) {
    const selectedNodeIds =
      new Set(
        nodes.map(
          node =>
            node.id,
        ),
      )

    edges =
      edges.filter(
        edge =>
          selectedNodeIds.has(
            edge.sourceNodeId,
          ) ||
          selectedNodeIds.has(
            edge.targetNodeId,
          ),
      )
  }

  if (
    normalized
      .includeConnectedNodes
  ) {
    const connectedNodeIds =
      new Set<string>()

    for (
      const edge of edges
    ) {
      connectedNodeIds.add(
        edge.sourceNodeId,
      )

      connectedNodeIds.add(
        edge.targetNodeId,
      )
    }

    const existingNodeIds =
      new Set(
        nodes.map(
          node =>
            node.id,
        ),
      )

    for (
      const nodeId of
        connectedNodeIds
    ) {
      if (
        existingNodeIds.has(
          nodeId,
        )
      ) {
        continue
      }

      const node =
        indexes.nodeById.get(
          nodeId,
        )

      if (
        node &&
        matchesNodeFilter(
          node,
          {
            ...normalized
              .nodeFilter,

            ids:
              [],

            keys:
              [],

            types:
              [],
          },
        )
      ) {
        nodes.push(node)

        existingNodeIds.add(
          node.id,
        )
      }
    }
  }

  nodes =
    sortNodes(
      nodes,
      normalized.ordering,
    )

  const cursorOffset =
    parseCursor({
      cursor:
        normalized.pagination
          .cursor,

      snapshotKey:
        normalized.graph
          .snapshotKey,
    })

  const effectiveOffset =
    cursorOffset +
    normalized.pagination
      .offset

  const paginatedNodes =
    nodes.slice(
      effectiveOffset,
      effectiveOffset +
      normalized.pagination
        .limit,
    )

  const paginatedNodeIds =
    new Set(
      paginatedNodes.map(
        node =>
          node.id,
      ),
    )

  const resultEdges =
    edges.filter(
      edge =>
        paginatedNodeIds.has(
          edge.sourceNodeId,
        ) ||
        paginatedNodeIds.has(
          edge.targetNodeId,
        ),
    )

  const nextOffset =
    effectiveOffset +
    paginatedNodes.length

  const nextCursor =
    nextOffset <
    nodes.length
      ? createCursor({
          offset:
            nextOffset,

          snapshotKey:
            normalized.graph
              .snapshotKey,
        })
      : null

  const result:
    LearningGraphQueryResult = {
    graphId:
      normalized.graph.id,

    nodes:
      paginatedNodes,

    edges:
      resultEdges,

    metrics:
      normalized.includeMetrics
        ? createResultMetrics(
            paginatedNodes,
            resultEdges,
            generatedAt,
          )
        : null,

    totalNodes:
      nodes.length,

    totalEdges:
      edges.length,

    nextCursor,

    generatedAt,

    metadata: {
      ...normalized.metadata,

      engineName:
        ENGINE_NAME,

      engineVersion:
        ENGINE_VERSION,

      rulesetVersion:
        RULESET_VERSION,

      requestedByUserId:
        normalized
          .requestedByUserId,

      correlationId:
        normalized
          .correlationId,

      offset:
        effectiveOffset,

      limit:
        normalized.pagination
          .limit,

      returnedNodeCount:
        paginatedNodes.length,

      returnedEdgeCount:
        resultEdges.length,

      cached:
        false,
    },
  }

  if (
    normalized.useCache
  ) {
    queryCache.set({
      key:
        cacheKey,

      value:
        result,

      ttlMs:
        normalized.cacheTtlMs,
    })
  }

  return cloneQueryResult(
    result,
  )
}

function isTraversalEntryAllowed({
  entry,
  direction,
  relationTypes,
  minimumConfidence,
  includeArchived,
  includeHistoricalVersions,
}: {
  entry:
    AdjacencyEntry

  direction:
    LearningGraphTraversalDirection

  relationTypes:
    LearningGraphRelationType[]

  minimumConfidence:
    number | null

  includeArchived:
    boolean

  includeHistoricalVersions:
    boolean
}): boolean {
  if (
    direction !==
      'both' &&
    entry.direction !==
      'undirected' &&
    entry.direction !==
      direction
  ) {
    return false
  }

  if (
    relationTypes.length >
      0 &&
    !relationTypes.includes(
      entry.edge.type,
    )
  ) {
    return false
  }

  if (
    !includeArchived &&
    entry.edge.archivedAt !==
      null
  ) {
    return false
  }

  if (
    !includeHistoricalVersions &&
    !entry.edge.version
      .isCurrent
  ) {
    return false
  }

  if (
    minimumConfidence !==
      null &&
    (
      entry.edge.attributes
        .confidence.value ===
        null ||
      entry.edge.attributes
        .confidence.value <
        minimumConfidence
    )
  ) {
    return false
  }

  return true
}

function traverseGraph({
  graph,
  rootNodeIds,
  depth,
  direction,
  relationTypes,
  nodeTypes,
  includeRootNodes,
  includeArchived,
  includeHistoricalVersions,
  minimumConfidence,
  privacy,
  research,
  correlationId,
}: {
  graph:
    LearningGraphSnapshot

  rootNodeIds: string[]

  depth: number

  direction:
    LearningGraphTraversalDirection

  relationTypes:
    LearningGraphRelationType[]

  nodeTypes:
    LearningGraphNodeType[]

  includeRootNodes:
    boolean

  includeArchived:
    boolean

  includeHistoricalVersions:
    boolean

  minimumConfidence:
    number | null

  privacy:
    LearningGraphQueryPrivacyFilter

  research:
    LearningGraphResearchFilter

  correlationId: string
}): LearningGraphTraversalResult {
  const generatedAt =
    nowIso()

  const indexes =
    createIndexes(
      graph,
    )

  const normalizedRoots =
    uniqueStrings(
      rootNodeIds,
    )

  const missingRoots =
    normalizedRoots.filter(
      rootNodeId =>
        !indexes.nodeById.has(
          rootNodeId,
        ),
    )

  if (
    missingRoots.length >
    0
  ) {
    return {
      success:
        false,

      graphId:
        graph.id,

      snapshotKey:
        graph.snapshotKey,

      rootNodeIds:
        normalizedRoots,

      nodes:
        [],

      edges:
        [],

      depthReached:
        0,

      visitedNodeCount:
        0,

      visitedEdgeCount:
        0,

      warnings:
        [],

      errors: [
        `Nós raiz não encontrados: ${missingRoots.join(', ')}.`,
      ],

      generatedAt,

      correlationId,

      metadata: {
        engineName:
          ENGINE_NAME,

        engineVersion:
          ENGINE_VERSION,
      },
    }
  }

  const visitedDepth =
    new Map<
      string,
      number
    >()

  const visitedEdgeIds =
    new Set<string>()

  const queue =
    normalizedRoots.map(
      nodeId => ({
        nodeId,

        depth:
          0,
      }),
    )

  let depthReached =
    0

  while (
    queue.length > 0
  ) {
    const current =
      queue.shift()

    if (!current) {
      continue
    }

    const previousDepth =
      visitedDepth.get(
        current.nodeId,
      )

    if (
      previousDepth !==
        undefined &&
      previousDepth <=
        current.depth
    ) {
      continue
    }

    visitedDepth.set(
      current.nodeId,
      current.depth,
    )

    depthReached =
      Math.max(
        depthReached,
        current.depth,
      )

    if (
      current.depth >=
      depth
    ) {
      continue
    }

    for (
      const entry of
        indexes.adjacency.get(
          current.nodeId,
        ) ??
        []
    ) {
      if (
        !isTraversalEntryAllowed({
          entry,

          direction,

          relationTypes,

          minimumConfidence,

          includeArchived,

          includeHistoricalVersions,
        })
      ) {
        continue
      }

      const neighbor =
        indexes.nodeById.get(
          entry.neighborNodeId,
        )

      if (!neighbor) {
        continue
      }

      if (
        nodeTypes.length >
          0 &&
        !nodeTypes.includes(
          neighbor.type,
        )
      ) {
        continue
      }

      if (
        !includeArchived &&
        (
          neighbor.archivedAt !==
            null ||
          neighbor.attributes
            .status ===
            'archived'
        )
      ) {
        continue
      }

      if (
        !includeHistoricalVersions &&
        !neighbor.version
          .isCurrent
      ) {
        continue
      }

      if (
        !matchesPrivacyFilter(
          neighbor.privacy,
          privacy,
        ) ||
        !matchesResearchFilter(
          neighbor
            .researchEligibility,
          research,
        )
      ) {
        continue
      }

      visitedEdgeIds.add(
        entry.edge.id,
      )

      queue.push({
        nodeId:
          neighbor.id,

        depth:
          current.depth +
          1,
      })
    }
  }

  if (!includeRootNodes) {
    for (
      const rootNodeId of
        normalizedRoots
    ) {
      visitedDepth.delete(
        rootNodeId,
      )
    }
  }

  const nodes =
    Array.from(
      visitedDepth.keys(),
    )
      .map(
        nodeId =>
          indexes.nodeById.get(
            nodeId,
          ),
      )
      .filter(
        (
          node,
        ): node is LearningGraphNode =>
          Boolean(node),
      )

  const nodeIds =
    new Set(
      nodes.map(
        node =>
          node.id,
      ),
    )

  const edges =
    Array.from(
      visitedEdgeIds,
    )
      .map(
        edgeId =>
          indexes.edgeById.get(
            edgeId,
          ),
      )
      .filter(
        (
          edge,
        ): edge is LearningGraphEdge =>
          Boolean(edge) &&
          (
            nodeIds.has(
              edge.sourceNodeId,
            ) ||
            nodeIds.has(
              edge.targetNodeId,
            ) ||
            normalizedRoots.includes(
              edge.sourceNodeId,
            ) ||
            normalizedRoots.includes(
              edge.targetNodeId,
            )
          ),
      )

  return {
    success:
      true,

    graphId:
      graph.id,

    snapshotKey:
      graph.snapshotKey,

    rootNodeIds:
      normalizedRoots,

    nodes,

    edges,

    depthReached,

    visitedNodeCount:
      nodes.length,

    visitedEdgeCount:
      edges.length,

    warnings:
      [],

    errors:
      [],

    generatedAt,

    correlationId,

    metadata: {
      engineName:
        ENGINE_NAME,

      engineVersion:
        ENGINE_VERSION,

      rulesetVersion:
        RULESET_VERSION,

      direction,

      requestedDepth:
        depth,
    },
  }
}

export function queryLearningGraphNeighbors(
  input:
    LearningGraphNeighborQueryInput,
): LearningGraphTraversalResult {
  const nodeId =
    normalizeRequiredText(
      input.nodeId,
      'ID do nó',
    )

  const depth =
    normalizeDepth(
      input.depth,
    )

  const correlationId =
    normalizeOptionalText(
      input.correlationId,
    ) ??
    input.graph
      .traceability
      .correlationId

  const normalized = {
    graph:
      input.graph,

    rootNodeIds: [
      nodeId,
    ],

    depth,

    direction:
      input.direction ??
      'both',

    relationTypes:
      uniqueValues(
        input.relationTypes ??
        [],
      ),

    nodeTypes:
      uniqueValues(
        input
          .neighborNodeTypes ??
        [],
      ),

    includeRootNodes:
      input.includeStartNode ??
      false,

    includeArchived:
      input.includeArchived ??
      false,

    includeHistoricalVersions:
      input
        .includeHistoricalVersions ??
      false,

    minimumConfidence:
      clampScore(
        input.minimumConfidence,
      ),

    privacy:
      normalizePrivacyFilter(
        input.privacy,
      ),

    research:
      normalizeResearchFilter(
        input.research,
      ),

    correlationId,
  }

  const cacheKey =
    createCacheKey(
      'neighbors',
      input.graph,
      normalized,
    )

  if (
    input.useCache ??
    true
  ) {
    const cached =
      queryCache.get<
        LearningGraphTraversalResult
      >(
        cacheKey,
      )

    if (cached) {
      return {
        ...cached,

        nodes: [
          ...cached.nodes,
        ],

        edges: [
          ...cached.edges,
        ],

        metadata: {
          ...cached.metadata,

          cached:
            true,
        },
      }
    }
  }

  const result =
    traverseGraph(
      normalized,
    )

  if (
    input.useCache ??
    true
  ) {
    queryCache.set({
      key:
        cacheKey,

      value:
        result,

      ttlMs:
        normalizeTtl(
          input.cacheTtlMs,
        ),
    })
  }

  return result
}

export function queryLearningGraphSubgraph(
  input:
    LearningGraphSubgraphQueryInput,
): LearningGraphTraversalResult {
  const rootNodeIds =
    uniqueStrings(
      input.rootNodeIds,
    )

  if (
    rootNodeIds.length ===
    0
  ) {
    throw new Error(
      'Ao menos um nó raiz é obrigatório.',
    )
  }

  const correlationId =
    normalizeOptionalText(
      input.correlationId,
    ) ??
    input.graph
      .traceability
      .correlationId

  const normalized = {
    graph:
      input.graph,

    rootNodeIds,

    depth:
      normalizeDepth(
        input.depth,
      ),

    direction:
      input.direction ??
      'both',

    relationTypes:
      uniqueValues(
        input.relationTypes ??
        [],
      ),

    nodeTypes:
      uniqueValues(
        input.nodeTypes ??
        [],
      ),

    includeRootNodes:
      input.includeRootNodes ??
      true,

    includeArchived:
      input.includeArchived ??
      false,

    includeHistoricalVersions:
      input
        .includeHistoricalVersions ??
      false,

    minimumConfidence:
      clampScore(
        input.minimumConfidence,
      ),

    privacy:
      normalizePrivacyFilter(
        input.privacy,
      ),

    research:
      normalizeResearchFilter(
        input.research,
      ),

    correlationId,
  }

  const cacheKey =
    createCacheKey(
      'subgraph',
      input.graph,
      normalized,
    )

  if (
    input.useCache ??
    true
  ) {
    const cached =
      queryCache.get<
        LearningGraphTraversalResult
      >(
        cacheKey,
      )

    if (cached) {
      return {
        ...cached,

        nodes: [
          ...cached.nodes,
        ],

        edges: [
          ...cached.edges,
        ],

        metadata: {
          ...cached.metadata,

          cached:
            true,
        },
      }
    }
  }

  const result =
    traverseGraph(
      normalized,
    )

  if (
    input.useCache ??
    true
  ) {
    queryCache.set({
      key:
        cacheKey,

      value:
        result,

      ttlMs:
        normalizeTtl(
          input.cacheTtlMs,
        ),
    })
  }

  return result
}

function isPathEntryAllowed({
  entry,
  direction,
  relationTypes,
  minimumConfidence,
  includeArchived,
  includeHistoricalVersions,
}: {
  entry:
    AdjacencyEntry

  direction:
    LearningGraphTraversalDirection

  relationTypes:
    LearningGraphRelationType[]

  minimumConfidence:
    number | null

  includeArchived:
    boolean

  includeHistoricalVersions:
    boolean
}): boolean {
  return isTraversalEntryAllowed({
    entry,

    direction,

    relationTypes,

    minimumConfidence,

    includeArchived,

    includeHistoricalVersions,
  })
}

function materializePath({
  graph,
  sourceNodeId,
  targetNodeId,
  nodeIds,
  edgeIds,
  indexes,
}: {
  graph:
    LearningGraphSnapshot

  sourceNodeId: string

  targetNodeId: string

  nodeIds: string[]

  edgeIds: string[]

  indexes:
    GraphIndexes
}): LearningGraphPath {
  const edges =
    edgeIds
      .map(
        edgeId =>
          indexes.edgeById.get(
            edgeId,
          ),
      )
      .filter(
        (
          edge,
        ): edge is LearningGraphEdge =>
          Boolean(edge),
      )

  const relationTypes =
    edges.map(
      edge =>
        edge.type,
    )

  const confidences =
    edges.map(
      edge =>
        edge.attributes
          .confidence.value,
    )

  const validConfidences =
    confidences.filter(
      (
        confidence,
      ): confidence is number =>
        typeof confidence ===
        'number',
    )

  const minimumConfidence =
    validConfidences.length >
    0
      ? Math.min(
          ...validConfidences,
        )
      : null

  return {
    id:
      createStableId(
        'path',
        [
          graph.snapshotKey,
          ...nodeIds,
          ...edgeIds,
        ].join(':'),
      ),

    sourceNodeId,

    targetNodeId,

    nodeIds,

    edgeIds,

    relationTypes,

    length:
      edgeIds.length,

    averageConfidence:
      calculateAverage(
        confidences,
      ),

    minimumConfidence,

    containsInferredRelations:
      edges.some(
        edge =>
          edge.attributes
            .inferredRelation,
      ),

    humanValidated:
      edges.every(
        edge =>
          edge.attributes
            .validatedByHuman,
      ),

    causalityWarning:
      edges.some(
        edge =>
          edge.type ===
            'correlates_with' ||
          edge.type ===
            'associated_with' ||
          edge.explainability
            .causalityStatus ===
            'correlation_only',
      ),

    metadata: {
      engineName:
        ENGINE_NAME,

      engineVersion:
        ENGINE_VERSION,

      causalClaim:
        false,
    },
  }
}

export function queryLearningGraphPaths(
  input:
    LearningGraphPathQueryInput,
): LearningGraphPathQueryResult {
  const generatedAt =
    nowIso()

  const sourceNodeId =
    normalizeRequiredText(
      input.sourceNodeId,
      'Nó de origem',
    )

  const targetNodeId =
    normalizeRequiredText(
      input.targetNodeId,
      'Nó de destino',
    )

  const strategy =
    input.strategy ??
    'shortest'

  const direction =
    input.direction ??
    'both'

  const maximumDepth =
    normalizeDepth(
      input.maximumDepth,
    )

  const maximumPaths =
    normalizeLimit(
      input.maximumPaths ??
      25,
    )

  const relationTypes =
    uniqueValues(
      input.relationTypes ??
      [],
    )

  const allowedNodeTypes =
    uniqueValues(
      input.allowedNodeTypes ??
      [],
    )

  const includeArchived =
    input.includeArchived ??
    false

  const includeHistoricalVersions =
    input
      .includeHistoricalVersions ??
    false

  const minimumConfidence =
    clampScore(
      input.minimumConfidence,
    )

  const correlationId =
    normalizeOptionalText(
      input.correlationId,
    ) ??
    input.graph
      .traceability
      .correlationId

  const cacheKey =
    createCacheKey(
      'paths',
      input.graph,
      {
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
      },
    )

  if (
    input.useCache ??
    true
  ) {
    const cached =
      queryCache.get<
        LearningGraphPathQueryResult
      >(
        cacheKey,
      )

    if (cached) {
      return {
        ...cached,

        paths:
          cached.paths.map(
            path => ({
              ...path,

              nodeIds: [
                ...path.nodeIds,
              ],

              edgeIds: [
                ...path.edgeIds,
              ],

              relationTypes: [
                ...path
                  .relationTypes,
              ],

              metadata: {
                ...path.metadata,
              },
            }),
          ),

        metadata: {
          ...cached.metadata,

          cached:
            true,
        },
      }
    }
  }

  const indexes =
    createIndexes(
      input.graph,
    )

  const sourceNode =
    indexes.nodeById.get(
      sourceNodeId,
    )

  const targetNode =
    indexes.nodeById.get(
      targetNodeId,
    )

  if (
    !sourceNode ||
    !targetNode
  ) {
    return {
      success:
        false,

      graphId:
        input.graph.id,

      snapshotKey:
        input.graph
          .snapshotKey,

      sourceNodeId,

      targetNodeId,

      paths:
        [],

      totalPaths:
        0,

      truncated:
        false,

      warnings:
        [],

      errors: [
        'O nó de origem ou destino não foi encontrado.',
      ],

      generatedAt,

      correlationId,

      metadata: {
        engineName:
          ENGINE_NAME,

        engineVersion:
          ENGINE_VERSION,
      },
    }
  }

  if (
    sourceNodeId ===
    targetNodeId
  ) {
    const path =
      materializePath({
        graph:
          input.graph,

        sourceNodeId,

        targetNodeId,

        nodeIds: [
          sourceNodeId,
        ],

        edgeIds:
          [],

        indexes,
      })

    return {
      success:
        true,

      graphId:
        input.graph.id,

      snapshotKey:
        input.graph
          .snapshotKey,

      sourceNodeId,

      targetNodeId,

      paths: [
        path,
      ],

      totalPaths:
        1,

      truncated:
        false,

      warnings:
        [],

      errors:
        [],

      generatedAt,

      correlationId,

      metadata: {
        engineName:
          ENGINE_NAME,

        engineVersion:
          ENGINE_VERSION,
      },
    }
  }

  const paths:
    LearningGraphPath[] =
    []

  const queue:
    Array<{
      nodeId: string

      nodeIds: string[]

      edgeIds: string[]

      visited:
        Set<string>
    }> = [
    {
      nodeId:
        sourceNodeId,

      nodeIds: [
        sourceNodeId,
      ],

      edgeIds:
        [],

      visited:
        new Set([
          sourceNodeId,
        ]),
    },
  ]

  let shortestLength:
    number | null =
    null

  let truncated =
    false

  while (
    queue.length > 0
  ) {
    const current =
      queue.shift()

    if (!current) {
      continue
    }

    if (
      current.edgeIds
        .length >=
      maximumDepth
    ) {
      continue
    }

    if (
      shortestLength !==
        null &&
      (
        strategy ===
          'shortest' ||
        strategy ===
          'all_shortest'
      ) &&
      current.edgeIds
        .length >=
        shortestLength
    ) {
      continue
    }

    for (
      const entry of
        indexes.adjacency.get(
          current.nodeId,
        ) ??
        []
    ) {
      if (
        !isPathEntryAllowed({
          entry,

          direction,

          relationTypes,

          minimumConfidence,

          includeArchived,

          includeHistoricalVersions,
        })
      ) {
        continue
      }

      if (
        current.visited.has(
          entry.neighborNodeId,
        )
      ) {
        continue
      }

      const neighbor =
        indexes.nodeById.get(
          entry.neighborNodeId,
        )

      if (!neighbor) {
        continue
      }

      if (
        allowedNodeTypes.length >
          0 &&
        neighbor.id !==
          targetNodeId &&
        !allowedNodeTypes.includes(
          neighbor.type,
        )
      ) {
        continue
      }

      if (
        !includeArchived &&
        (
          neighbor.archivedAt !==
            null ||
          neighbor.attributes
            .status ===
            'archived'
        )
      ) {
        continue
      }

      if (
        !includeHistoricalVersions &&
        !neighbor.version
          .isCurrent
      ) {
        continue
      }

      const nextNodeIds = [
        ...current.nodeIds,

        neighbor.id,
      ]

      const nextEdgeIds = [
        ...current.edgeIds,

        entry.edge.id,
      ]

      if (
        neighbor.id ===
        targetNodeId
      ) {
        const path =
          materializePath({
            graph:
              input.graph,

            sourceNodeId,

            targetNodeId,

            nodeIds:
              nextNodeIds,

            edgeIds:
              nextEdgeIds,

            indexes,
          })

        if (
          shortestLength ===
          null
        ) {
          shortestLength =
            path.length
        }

        if (
          strategy ===
            'all' ||
          path.length ===
            shortestLength
        ) {
          paths.push(
            path,
          )
        }

        if (
          strategy ===
            'shortest'
        ) {
          queue.length =
            0

          break
        }

        if (
          paths.length >=
          maximumPaths
        ) {
          truncated =
            true

          queue.length =
            0

          break
        }

        continue
      }

      const nextVisited =
        new Set(
          current.visited,
        )

      nextVisited.add(
        neighbor.id,
      )

      queue.push({
        nodeId:
          neighbor.id,

        nodeIds:
          nextNodeIds,

        edgeIds:
          nextEdgeIds,

        visited:
          nextVisited,
      })
    }
  }

  const warnings =
    paths.some(
      path =>
        path.causalityWarning,
    )
      ? [
          'Um ou mais caminhos contêm relações correlacionais. O caminho não representa causalidade comprovada.',
        ]
      : []

  const result:
    LearningGraphPathQueryResult = {
    success:
      true,

    graphId:
      input.graph.id,

    snapshotKey:
      input.graph
        .snapshotKey,

    sourceNodeId,

    targetNodeId,

    paths,

    totalPaths:
      paths.length,

    truncated,

    warnings,

    errors:
      [],

    generatedAt,

    correlationId,

    metadata: {
      engineName:
        ENGINE_NAME,

      engineVersion:
        ENGINE_VERSION,

      rulesetVersion:
        RULESET_VERSION,

      strategy,

      direction,

      maximumDepth,

      maximumPaths,

      causalInference:
        false,
    },
  }

  if (
    input.useCache ??
    true
  ) {
    queryCache.set({
      key:
        cacheKey,

      value:
        result,

      ttlMs:
        normalizeTtl(
          input.cacheTtlMs,
        ),
    })
  }

  return result
}

export function getLearningGraphNodeById({
  graph,
  nodeId,
}: {
  graph:
    LearningGraphSnapshot

  nodeId: string
}): LearningGraphNode | null {
  const normalizedId =
    normalizeRequiredText(
      nodeId,
      'ID do nó',
    )

  return (
    graph.nodes.find(
      node =>
        node.id ===
        normalizedId,
    ) ??
    null
  )
}

export function getLearningGraphNodeByKey({
  graph,
  nodeKey,
}: {
  graph:
    LearningGraphSnapshot

  nodeKey: string
}): LearningGraphNode | null {
  const normalizedKey =
    normalizeRequiredText(
      nodeKey,
      'Chave do nó',
    )

  return (
    graph.nodes.find(
      node =>
        node.nodeKey ===
        normalizedKey,
    ) ??
    null
  )
}

export function getLearningGraphEdgeById({
  graph,
  edgeId,
}: {
  graph:
    LearningGraphSnapshot

  edgeId: string
}): LearningGraphEdge | null {
  const normalizedId =
    normalizeRequiredText(
      edgeId,
      'ID da relação',
    )

  return (
    graph.edges.find(
      edge =>
        edge.id ===
        normalizedId,
    ) ??
    null
  )
}

export function getLearningGraphEdgeByKey({
  graph,
  edgeKey,
}: {
  graph:
    LearningGraphSnapshot

  edgeKey: string
}): LearningGraphEdge | null {
  const normalizedKey =
    normalizeRequiredText(
      edgeKey,
      'Chave da relação',
    )

  return (
    graph.edges.find(
      edge =>
        edge.edgeKey ===
        normalizedKey,
    ) ??
    null
  )
}

export function clearLearningGraphQueryCache():
  void {
  queryCache.clear()
}

export function getLearningGraphQueryEngineInfo():
  LearningGraphQueryEngineInfo {
  return {
    name:
      ENGINE_NAME,

    version:
      ENGINE_VERSION,

    rulesetVersion:
      RULESET_VERSION,

    mode:
      'deterministic',

    capabilities: [
      'node_query',
      'edge_query',
      'pedagogical_filters',
      'organization_filters',
      'class_filters',
      'teacher_filters',
      'student_filters',
      'planning_filters',
      'lesson_filters',
      'learning_objective_filters',
      'skill_filters',
      'competency_filters',
      'evidence_filters',
      'intervention_filters',
      'indicator_filters',
      'assessment_filters',
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
      'O cache é local ao processo e não substitui cache distribuído.',
      'Não aplica RLS ou autorização de sessão.',
      'Não executa inferência causal.',
      'Não cria novas relações.',
      'A busca de todos os caminhos é limitada por profundidade e quantidade.',
      'Não substitui validação pedagógica ou humana.',
    ],
  }
}