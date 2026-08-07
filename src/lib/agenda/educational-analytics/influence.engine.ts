/**
 * EduData IA — EIOS
 * Capability 04.3: Influence Engine
 *
 * Motor determinístico de influência educacional.
 *
 * Responsabilidades:
 * - modelar relações ponderadas entre entidades educacionais;
 * - calcular centralidade, conectividade, coesão e propagação;
 * - identificar componentes, comunidades e zonas de influência;
 * - considerar proximidade espacial quando disponível;
 * - produzir resultados explicáveis e auditáveis;
 * - preservar revisão humana e autonomia profissional.
 *
 * Limitações:
 * - influência calculada não representa causalidade;
 * - não produz classificação punitiva;
 * - não substitui avaliação pedagógica humana;
 * - não acessa banco de dados;
 * - não aplica RLS.
 */

import type {
  AnalyticsConfidence,
  AnalyticsCausalityStatus,
  AnalyticsEntityType,
  AnalyticsExplainability,
  AnalyticsIdentifier,
  AnalyticsInfluencePath,
  AnalyticsInfluenceResult,
  AnalyticsInfluenceType,
  AnalyticsMetadata,
  AnalyticsSourceReference,
  AnalyticsTimestamp,
} from './analytics.types'

const ENGINE_NAME = 'eios-influence-engine'
const ENGINE_VERSION = '1.0.0'
const RULESET_VERSION = 'influence-ruleset-1.0.0'

const EPSILON = 1e-12
const DEFAULT_MAXIMUM_DEPTH = 4
const DEFAULT_MINIMUM_EDGE_WEIGHT = 0
const DEFAULT_SPATIAL_RADIUS = 2
const DEFAULT_PROPAGATION_DECAY = 0.7
const DEFAULT_COMMUNITY_ITERATIONS = 20

export type InfluenceDirection =
  | 'positive'
  | 'negative'
  | 'neutral'
  | 'mixed'
  | 'undetermined'

export type InfluenceEdgeDirection =
  | 'directed'
  | 'undirected'

export type InfluenceRelationType =
  | 'interaction'
  | 'collaboration'
  | 'communication'
  | 'proximity'
  | 'behavioral_similarity'
  | 'performance_similarity'
  | 'group_membership'
  | 'teacher_support'
  | 'pedagogical_intervention'
  | 'external_event'
  | 'learning_dependency'
  | 'custom'

export type InfluenceNode = {
  id: AnalyticsIdentifier
  entityId: AnalyticsIdentifier
  entityType: AnalyticsEntityType
  label: string | null
  classIds: AnalyticsIdentifier[]
  groupIds: AnalyticsIdentifier[]
  organizationId: AnalyticsIdentifier | null
  schoolId: AnalyticsIdentifier | null
  position: {
    x: number | null
    y: number | null
    zoneId: AnalyticsIdentifier | null
  } | null
  attributes: AnalyticsMetadata
  sourceReferences: AnalyticsSourceReference[]
}

export type InfluenceEdge = {
  id: AnalyticsIdentifier
  sourceNodeId: AnalyticsIdentifier
  targetNodeId: AnalyticsIdentifier
  type: InfluenceRelationType
  direction: InfluenceEdgeDirection
  weight: number
  confidence: number | null
  influenceDirection: InfluenceDirection
  observedAt: AnalyticsTimestamp | null
  validFrom: AnalyticsTimestamp | null
  validUntil: AnalyticsTimestamp | null
  direct: boolean
  inferred: boolean
  validatedByHuman: boolean
  sourceReferences: AnalyticsSourceReference[]
  metadata: AnalyticsMetadata
}

export type InfluenceNodeMetrics = {
  nodeId: AnalyticsIdentifier
  degree: number
  weightedDegree: number
  inDegree: number
  outDegree: number
  closeness: number | null
  betweenness: number | null
  eigenvector: number | null
  isolationScore: number
  influenceScore: number
  positiveInfluenceScore: number
  negativeInfluenceScore: number
  centralityRank: number | null
  metadata: AnalyticsMetadata
}

export type InfluenceCommunity = {
  id: AnalyticsIdentifier
  nodeIds: AnalyticsIdentifier[]
  edgeIds: AnalyticsIdentifier[]
  density: number
  cohesion: number
  averageWeight: number | null
  dominantEntityTypes: AnalyticsEntityType[]
  leaderNodeIds: AnalyticsIdentifier[]
  isolatedNodeIds: AnalyticsIdentifier[]
  metadata: AnalyticsMetadata
}

export type InfluenceZone = {
  id: AnalyticsIdentifier
  centerNodeId: AnalyticsIdentifier | null
  nodeIds: AnalyticsIdentifier[]
  edgeIds: AnalyticsIdentifier[]
  radius: number | null
  spatial: boolean
  density: number
  cohesion: number
  positiveInfluenceScore: number
  negativeInfluenceScore: number
  influenceDirection: InfluenceDirection
  metadata: AnalyticsMetadata
}

export type InfluencePropagationStep = {
  depth: number
  sourceNodeIds: AnalyticsIdentifier[]
  reachedNodeIds: AnalyticsIdentifier[]
  edgeIds: AnalyticsIdentifier[]
  propagationScore: number
}

export type InfluencePropagation = {
  id: AnalyticsIdentifier
  originNodeIds: AnalyticsIdentifier[]
  reachedNodeIds: AnalyticsIdentifier[]
  pathIds: AnalyticsIdentifier[]
  maximumDepth: number
  propagationSpeed: number | null
  persistenceScore: number | null
  steps: InfluencePropagationStep[]
  influenceDirection: InfluenceDirection
  confidence: AnalyticsConfidence
  metadata: AnalyticsMetadata
}

export type InfluenceEngineConfiguration = {
  maximumDepth?: number
  minimumEdgeWeight?: number
  includeInferredEdges?: boolean
  includeUndirectedEdges?: boolean
  calculateCloseness?: boolean
  calculateBetweenness?: boolean
  calculateEigenvector?: boolean
  detectCommunities?: boolean
  detectSpatialZones?: boolean
  detectPropagation?: boolean
  spatialRadius?: number
  propagationDecay?: number
  communityIterations?: number
  maximumPathsPerOrigin?: number
}

export type InfluenceEngineInput = {
  nodes: InfluenceNode[]
  edges: InfluenceEdge[]
  originNodeIds?: AnalyticsIdentifier[]
  targetNodeIds?: AnalyticsIdentifier[]
  influenceTypes?: AnalyticsInfluenceType[]
  externalEventIds?: AnalyticsIdentifier[]
  configuration?: InfluenceEngineConfiguration
  requestedByUserId?: AnalyticsIdentifier | null
  correlationId: string
  metadata?: AnalyticsMetadata
}

export type InfluenceEngineResult = {
  success: boolean
  influences: AnalyticsInfluenceResult[]
  nodeMetrics: InfluenceNodeMetrics[]
  communities: InfluenceCommunity[]
  zones: InfluenceZone[]
  propagations: InfluencePropagation[]
  warnings: string[]
  errors: string[]
  generatedAt: AnalyticsTimestamp
  correlationId: string
  metadata: AnalyticsMetadata
}

type ResolvedConfiguration = {
  maximumDepth: number
  minimumEdgeWeight: number
  includeInferredEdges: boolean
  includeUndirectedEdges: boolean
  calculateCloseness: boolean
  calculateBetweenness: boolean
  calculateEigenvector: boolean
  detectCommunities: boolean
  detectSpatialZones: boolean
  detectPropagation: boolean
  spatialRadius: number
  propagationDecay: number
  communityIterations: number
  maximumPathsPerOrigin: number
}

type GraphIndexes = {
  nodeById: Map<string, InfluenceNode>
  edgeById: Map<string, InfluenceEdge>
  outgoing: Map<string, InfluenceEdge[]>
  incoming: Map<string, InfluenceEdge[]>
  adjacent: Map<string, InfluenceEdge[]>
}

type ShortestPathState = {
  distance: Map<string, number>
  previous: Map<string, string[]>
  pathCount: Map<string, number>
  order: string[]
}

function nowIso(): AnalyticsTimestamp {
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
        .filter(
          (value): value is string =>
            typeof value === 'string',
        )
        .map(value => value.trim())
        .filter(Boolean),
    ),
  )
}

function clamp(
  value: number,
  minimum: number,
  maximum: number,
): number {
  return Math.min(maximum, Math.max(minimum, value))
}

function mean(values: number[]): number | null {
  if (values.length === 0) {
    return null
  }

  return values.reduce(
    (total, value) => total + value,
    0,
  ) / values.length
}

function stableHash(value: string): string {
  let hash = 2166136261

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return (hash >>> 0)
    .toString(16)
    .padStart(8, '0')
}

function createStableId(
  prefix: string,
  value: string,
): string {
  return `${prefix}-${stableHash(value)}`
}

function resolveConfiguration(
  input:
    InfluenceEngineConfiguration | undefined,
): ResolvedConfiguration {
  return {
    maximumDepth:
      Math.max(
        1,
        Math.min(
          12,
          Math.floor(
            input?.maximumDepth ??
              DEFAULT_MAXIMUM_DEPTH,
          ),
        ),
      ),
    minimumEdgeWeight:
      Math.max(
        0,
        input?.minimumEdgeWeight ??
          DEFAULT_MINIMUM_EDGE_WEIGHT,
      ),
    includeInferredEdges:
      input?.includeInferredEdges ??
      true,
    includeUndirectedEdges:
      input?.includeUndirectedEdges ??
      true,
    calculateCloseness:
      input?.calculateCloseness ??
      true,
    calculateBetweenness:
      input?.calculateBetweenness ??
      true,
    calculateEigenvector:
      input?.calculateEigenvector ??
      true,
    detectCommunities:
      input?.detectCommunities ??
      true,
    detectSpatialZones:
      input?.detectSpatialZones ??
      true,
    detectPropagation:
      input?.detectPropagation ??
      true,
    spatialRadius:
      Math.max(
        0.1,
        input?.spatialRadius ??
          DEFAULT_SPATIAL_RADIUS,
      ),
    propagationDecay:
      clamp(
        input?.propagationDecay ??
          DEFAULT_PROPAGATION_DECAY,
        0.01,
        1,
      ),
    communityIterations:
      Math.max(
        1,
        Math.min(
          100,
          Math.floor(
            input?.communityIterations ??
              DEFAULT_COMMUNITY_ITERATIONS,
          ),
        ),
      ),
    maximumPathsPerOrigin:
      Math.max(
        1,
        Math.min(
          100,
          Math.floor(
            input?.maximumPathsPerOrigin ??
              20,
          ),
        ),
      ),
  }
}

function normalizeNode(
  node: InfluenceNode,
): InfluenceNode {
  return {
    ...node,
    id:
      normalizeRequiredText(
        node.id,
        'node.id',
      ),
    entityId:
      normalizeRequiredText(
        node.entityId,
        'node.entityId',
      ),
    label:
      normalizeOptionalText(
        node.label,
      ),
    classIds:
      uniqueStrings(
        node.classIds,
      ),
    groupIds:
      uniqueStrings(
        node.groupIds,
      ),
    organizationId:
      normalizeOptionalText(
        node.organizationId,
      ),
    schoolId:
      normalizeOptionalText(
        node.schoolId,
      ),
    position:
      node.position
        ? {
            x:
              typeof node.position.x === 'number' &&
              Number.isFinite(node.position.x)
                ? node.position.x
                : null,
            y:
              typeof node.position.y === 'number' &&
              Number.isFinite(node.position.y)
                ? node.position.y
                : null,
            zoneId:
              normalizeOptionalText(
                node.position.zoneId,
              ),
          }
        : null,
    attributes: {
      ...node.attributes,
    },
    sourceReferences:
      [...node.sourceReferences],
  }
}

function normalizeEdge(
  edge: InfluenceEdge,
): InfluenceEdge {
  return {
    ...edge,
    id:
      normalizeRequiredText(
        edge.id,
        'edge.id',
      ),
    sourceNodeId:
      normalizeRequiredText(
        edge.sourceNodeId,
        'edge.sourceNodeId',
      ),
    targetNodeId:
      normalizeRequiredText(
        edge.targetNodeId,
        'edge.targetNodeId',
      ),
    weight:
      Math.max(
        0,
        Number.isFinite(edge.weight)
          ? edge.weight
          : 0,
      ),
    confidence:
      edge.confidence === null ||
      !Number.isFinite(edge.confidence)
        ? null
        : clamp(
            edge.confidence,
            0,
            1,
          ),
    sourceReferences:
      [...edge.sourceReferences],
    metadata: {
      ...edge.metadata,
    },
  }
}

function createIndexes(
  nodes: InfluenceNode[],
  edges: InfluenceEdge[],
): GraphIndexes {
  const nodeById =
    new Map<string, InfluenceNode>()
  const edgeById =
    new Map<string, InfluenceEdge>()
  const outgoing =
    new Map<string, InfluenceEdge[]>()
  const incoming =
    new Map<string, InfluenceEdge[]>()
  const adjacent =
    new Map<string, InfluenceEdge[]>()

  for (const node of nodes) {
    nodeById.set(node.id, node)
    outgoing.set(node.id, [])
    incoming.set(node.id, [])
    adjacent.set(node.id, [])
  }

  for (const edge of edges) {
    if (
      !nodeById.has(edge.sourceNodeId) ||
      !nodeById.has(edge.targetNodeId)
    ) {
      continue
    }

    edgeById.set(edge.id, edge)
    outgoing
      .get(edge.sourceNodeId)
      ?.push(edge)
    incoming
      .get(edge.targetNodeId)
      ?.push(edge)
    adjacent
      .get(edge.sourceNodeId)
      ?.push(edge)
    adjacent
      .get(edge.targetNodeId)
      ?.push(edge)

    if (edge.direction === 'undirected') {
      outgoing
        .get(edge.targetNodeId)
        ?.push(edge)
      incoming
        .get(edge.sourceNodeId)
        ?.push(edge)
    }
  }

  return {
    nodeById,
    edgeById,
    outgoing,
    incoming,
    adjacent,
  }
}

function filterEdges(
  edges: InfluenceEdge[],
  configuration: ResolvedConfiguration,
): InfluenceEdge[] {
  return edges.filter(edge => {
    if (
      edge.weight <
      configuration.minimumEdgeWeight
    ) {
      return false
    }

    if (
      !configuration.includeInferredEdges &&
      edge.inferred
    ) {
      return false
    }

    if (
      !configuration.includeUndirectedEdges &&
      edge.direction === 'undirected'
    ) {
      return false
    }

    return true
  })
}

function getNeighborId(
  edge: InfluenceEdge,
  nodeId: string,
): string | null {
  if (edge.sourceNodeId === nodeId) {
    return edge.targetNodeId
  }

  if (edge.targetNodeId === nodeId) {
    return edge.sourceNodeId
  }

  return null
}

function edgeDirectionScore(
  edge: InfluenceEdge,
): number {
  switch (edge.influenceDirection) {
    case 'positive':
      return edge.weight
    case 'negative':
      return -edge.weight
    case 'neutral':
      return 0
    case 'mixed':
      return 0
    case 'undetermined':
      return 0
  }
}

function calculateDegreeMetrics(
  nodeId: string,
  indexes: GraphIndexes,
): {
  degree: number
  weightedDegree: number
  inDegree: number
  outDegree: number
  positive: number
  negative: number
} {
  const outgoing =
    indexes.outgoing.get(nodeId) ?? []
  const incoming =
    indexes.incoming.get(nodeId) ?? []
  const adjacent =
    indexes.adjacent.get(nodeId) ?? []

  const uniqueEdgeIds =
    new Set(
      adjacent.map(edge => edge.id),
    )

  let weightedDegree = 0
  let positive = 0
  let negative = 0

  for (const edge of adjacent) {
    weightedDegree += edge.weight

    const score =
      edgeDirectionScore(edge)

    if (score > 0) {
      positive += score
    } else if (score < 0) {
      negative += Math.abs(score)
    }
  }

  return {
    degree: uniqueEdgeIds.size,
    weightedDegree,
    inDegree:
      new Set(
        incoming.map(edge => edge.id),
      ).size,
    outDegree:
      new Set(
        outgoing.map(edge => edge.id),
      ).size,
    positive,
    negative,
  }
}

function shortestPathsFrom(
  originNodeId: string,
  indexes: GraphIndexes,
): ShortestPathState {
  const distance =
    new Map<string, number>()
  const previous =
    new Map<string, string[]>()
  const pathCount =
    new Map<string, number>()
  const order: string[] = []
  const queue: string[] = []

  for (const nodeId of indexes.nodeById.keys()) {
    distance.set(nodeId, Infinity)
    previous.set(nodeId, [])
    pathCount.set(nodeId, 0)
  }

  distance.set(originNodeId, 0)
  pathCount.set(originNodeId, 1)
  queue.push(originNodeId)

  while (queue.length > 0) {
    const current =
      queue.shift()

    if (!current) {
      continue
    }

    order.push(current)

    const currentDistance =
      distance.get(current) ??
      Infinity

    for (
      const edge of
        indexes.outgoing.get(current) ??
        []
    ) {
      const neighbor =
        getNeighborId(edge, current)

      if (!neighbor) {
        continue
      }

      const candidate =
        currentDistance + 1

      const neighborDistance =
        distance.get(neighbor) ??
        Infinity

      if (candidate < neighborDistance) {
        distance.set(neighbor, candidate)
        queue.push(neighbor)
        pathCount.set(
          neighbor,
          pathCount.get(current) ?? 0,
        )
        previous.set(neighbor, [current])
      } else if (
        candidate === neighborDistance
      ) {
        pathCount.set(
          neighbor,
          (pathCount.get(neighbor) ?? 0) +
            (pathCount.get(current) ?? 0),
        )
        previous
          .get(neighbor)
          ?.push(current)
      }
    }
  }

  return {
    distance,
    previous,
    pathCount,
    order,
  }
}

function calculateCloseness(
  nodeId: string,
  indexes: GraphIndexes,
): number | null {
  const state =
    shortestPathsFrom(
      nodeId,
      indexes,
    )

  const distances =
    Array.from(
      state.distance.entries(),
    )
      .filter(
        ([target, value]) =>
          target !== nodeId &&
          Number.isFinite(value),
      )
      .map(([, value]) => value)

  if (distances.length === 0) {
    return null
  }

  const total =
    distances.reduce(
      (sum, value) => sum + value,
      0,
    )

  if (total <= EPSILON) {
    return null
  }

  return distances.length / total
}

function calculateBetweenness(
  indexes: GraphIndexes,
): Map<string, number> {
  const score =
    new Map<string, number>()

  for (const nodeId of indexes.nodeById.keys()) {
    score.set(nodeId, 0)
  }

  for (const source of indexes.nodeById.keys()) {
    const state =
      shortestPathsFrom(
        source,
        indexes,
      )

    const dependency =
      new Map<string, number>()

    for (const nodeId of indexes.nodeById.keys()) {
      dependency.set(nodeId, 0)
    }

    const stack =
      [...state.order].reverse()

    for (const nodeId of stack) {
      const predecessors =
        state.previous.get(nodeId) ??
        []

      for (const predecessor of predecessors) {
        const nodePathCount =
          state.pathCount.get(nodeId) ??
          0
        const predecessorPathCount =
          state.pathCount.get(predecessor) ??
          0

        if (nodePathCount <= EPSILON) {
          continue
        }

        const contribution =
          (
            predecessorPathCount /
            nodePathCount
          ) *
          (
            1 +
            (dependency.get(nodeId) ?? 0)
          )

        dependency.set(
          predecessor,
          (dependency.get(predecessor) ?? 0) +
            contribution,
        )
      }

      if (nodeId !== source) {
        score.set(
          nodeId,
          (score.get(nodeId) ?? 0) +
            (dependency.get(nodeId) ?? 0),
        )
      }
    }
  }

  const maximum =
    Math.max(
      0,
      ...score.values(),
    )

  if (maximum > EPSILON) {
    for (const [nodeId, value] of score) {
      score.set(
        nodeId,
        value / maximum,
      )
    }
  }

  return score
}

function calculateEigenvector(
  indexes: GraphIndexes,
  iterations = 50,
): Map<string, number> {
  const nodeIds =
    Array.from(
      indexes.nodeById.keys(),
    )

  const score =
    new Map<string, number>()

  const initial =
    nodeIds.length > 0
      ? 1 / Math.sqrt(nodeIds.length)
      : 0

  for (const nodeId of nodeIds) {
    score.set(nodeId, initial)
  }

  for (let iteration = 0; iteration < iterations; iteration += 1) {
    const next =
      new Map<string, number>()

    for (const nodeId of nodeIds) {
      let total = 0

      for (
        const edge of
          indexes.incoming.get(nodeId) ??
          []
      ) {
        const neighbor =
          getNeighborId(edge, nodeId)

        if (!neighbor) {
          continue
        }

        total +=
          (score.get(neighbor) ?? 0) *
          Math.max(EPSILON, edge.weight)
      }

      next.set(nodeId, total)
    }

    const norm =
      Math.sqrt(
        Array.from(next.values())
          .reduce(
            (sum, value) =>
              sum + value ** 2,
            0,
          ),
      )

    if (norm <= EPSILON) {
      break
    }

    for (const nodeId of nodeIds) {
      score.set(
        nodeId,
        (next.get(nodeId) ?? 0) /
          norm,
      )
    }
  }

  return score
}

function connectedComponents(
  indexes: GraphIndexes,
): string[][] {
  const visited =
    new Set<string>()
  const components: string[][] = []

  for (const nodeId of indexes.nodeById.keys()) {
    if (visited.has(nodeId)) {
      continue
    }

    const component: string[] = []
    const queue = [nodeId]
    visited.add(nodeId)

    while (queue.length > 0) {
      const current =
        queue.shift()

      if (!current) {
        continue
      }

      component.push(current)

      for (
        const edge of
          indexes.adjacent.get(current) ??
          []
      ) {
        const neighbor =
          getNeighborId(edge, current)

        if (
          neighbor &&
          !visited.has(neighbor)
        ) {
          visited.add(neighbor)
          queue.push(neighbor)
        }
      }
    }

    components.push(component)
  }

  return components
}

function calculateDensity(
  nodeIds: string[],
  edges: InfluenceEdge[],
): number {
  const nodeSet =
    new Set(nodeIds)

  const relevantEdges =
    edges.filter(
      edge =>
        nodeSet.has(edge.sourceNodeId) &&
        nodeSet.has(edge.targetNodeId),
    )

  const count =
    nodeIds.length

  if (count < 2) {
    return 0
  }

  const maximum =
    count * (count - 1) / 2

  return clamp(
    relevantEdges.length / maximum,
    0,
    1,
  )
}

function calculateCohesion(
  nodeIds: string[],
  edges: InfluenceEdge[],
): number {
  const nodeSet =
    new Set(nodeIds)

  const weights =
    edges
      .filter(
        edge =>
          nodeSet.has(edge.sourceNodeId) &&
          nodeSet.has(edge.targetNodeId),
      )
      .map(edge => edge.weight)

  if (weights.length === 0) {
    return 0
  }

  const average =
    mean(weights) ?? 0

  return clamp(
    average /
      Math.max(
        1,
        Math.max(...weights),
      ),
    0,
    1,
  )
}

function detectCommunities(
  indexes: GraphIndexes,
  iterations: number,
): InfluenceCommunity[] {
  const labels =
    new Map<string, string>()

  for (const nodeId of indexes.nodeById.keys()) {
    labels.set(nodeId, nodeId)
  }

  const nodeIds =
    Array.from(
      indexes.nodeById.keys(),
    ).sort()

  for (let iteration = 0; iteration < iterations; iteration += 1) {
    let changed = false

    for (const nodeId of nodeIds) {
      const scores =
        new Map<string, number>()

      for (
        const edge of
          indexes.adjacent.get(nodeId) ??
          []
      ) {
        const neighbor =
          getNeighborId(edge, nodeId)

        if (!neighbor) {
          continue
        }

        const label =
          labels.get(neighbor) ??
          neighbor

        scores.set(
          label,
          (scores.get(label) ?? 0) +
            Math.max(EPSILON, edge.weight),
        )
      }

      if (scores.size === 0) {
        continue
      }

      const best =
        Array.from(scores.entries())
          .sort(
            (first, second) =>
              second[1] - first[1] ||
              first[0].localeCompare(
                second[0],
              ),
          )[0]

      if (
        best &&
        labels.get(nodeId) !== best[0]
      ) {
        labels.set(nodeId, best[0])
        changed = true
      }
    }

    if (!changed) {
      break
    }
  }

  const grouped =
    new Map<string, string[]>()

  for (const [nodeId, label] of labels) {
    const current =
      grouped.get(label) ?? []

    current.push(nodeId)
    grouped.set(label, current)
  }

  return Array.from(grouped.entries())
    .map(([label, communityNodes]) => {
      const nodeSet =
        new Set(communityNodes)

      const edges =
        Array.from(
          indexes.edgeById.values(),
        ).filter(
          edge =>
            nodeSet.has(edge.sourceNodeId) &&
            nodeSet.has(edge.targetNodeId),
        )

      const weightedDegrees =
        communityNodes.map(nodeId => ({
          nodeId,
          value:
            calculateDegreeMetrics(
              nodeId,
              indexes,
            ).weightedDegree,
        }))

      weightedDegrees.sort(
        (first, second) =>
          second.value - first.value,
      )

      const maximum =
        weightedDegrees[0]?.value ??
        0

      const leaders =
        weightedDegrees
          .filter(
            item =>
              maximum > 0 &&
              item.value >=
                maximum * 0.8,
          )
          .map(item => item.nodeId)

      const isolated =
        weightedDegrees
          .filter(
            item =>
              item.value <= EPSILON,
          )
          .map(item => item.nodeId)

      const entityTypes =
        communityNodes
          .map(
            nodeId =>
              indexes.nodeById.get(nodeId)
                ?.entityType,
          )
          .filter(
            (
              value,
            ): value is AnalyticsEntityType =>
              Boolean(value),
          )

      const frequency =
        new Map<AnalyticsEntityType, number>()

      for (const type of entityTypes) {
        frequency.set(
          type,
          (frequency.get(type) ?? 0) + 1,
        )
      }

      const dominant =
        Array.from(frequency.entries())
          .sort(
            (first, second) =>
              second[1] - first[1],
          )
          .slice(0, 3)
          .map(([type]) => type)

      return {
        id:
          createStableId(
            'influence-community',
            `${label}:${communityNodes.sort().join(':')}`,
          ),
        nodeIds:
          [...communityNodes].sort(),
        edgeIds:
          edges.map(edge => edge.id),
        density:
          calculateDensity(
            communityNodes,
            edges,
          ),
        cohesion:
          calculateCohesion(
            communityNodes,
            edges,
          ),
        averageWeight:
          mean(
            edges.map(edge => edge.weight),
          ),
        dominantEntityTypes:
          dominant,
        leaderNodeIds:
          leaders,
        isolatedNodeIds:
          isolated,
        metadata: {
          engineName:
            ENGINE_NAME,
          label,
        },
      }
    })
}

function euclideanDistance(
  first: InfluenceNode,
  second: InfluenceNode,
): number | null {
  const firstPosition =
    first.position
  const secondPosition =
    second.position

  if (
    !firstPosition ||
    !secondPosition ||
    firstPosition.x === null ||
    firstPosition.y === null ||
    secondPosition.x === null ||
    secondPosition.y === null
  ) {
    return null
  }

  return Math.sqrt(
    (
      firstPosition.x -
      secondPosition.x
    ) ** 2 +
    (
      firstPosition.y -
      secondPosition.y
    ) ** 2,
  )
}

function detectSpatialZones(
  nodes: InfluenceNode[],
  edges: InfluenceEdge[],
  radius: number,
): InfluenceZone[] {
  const positioned =
    nodes.filter(
      node =>
        node.position?.x !== null &&
        node.position?.y !== null,
    )

  const visited =
    new Set<string>()
  const zones: InfluenceZone[] = []

  for (const node of positioned) {
    if (visited.has(node.id)) {
      continue
    }

    const zoneNodes: string[] = []
    const queue = [node.id]
    visited.add(node.id)

    while (queue.length > 0) {
      const currentId =
        queue.shift()

      if (!currentId) {
        continue
      }

      zoneNodes.push(currentId)

      const current =
        positioned.find(
          item =>
            item.id === currentId,
        )

      if (!current) {
        continue
      }

      for (const candidate of positioned) {
        if (visited.has(candidate.id)) {
          continue
        }

        const distance =
          euclideanDistance(
            current,
            candidate,
          )

        if (
          distance !== null &&
          distance <= radius
        ) {
          visited.add(candidate.id)
          queue.push(candidate.id)
        }
      }
    }

    const nodeSet =
      new Set(zoneNodes)

    const zoneEdges =
      edges.filter(
        edge =>
          nodeSet.has(edge.sourceNodeId) &&
          nodeSet.has(edge.targetNodeId),
      )

    const positive =
      zoneEdges.reduce(
        (total, edge) =>
          total +
          (
            edge.influenceDirection ===
            'positive'
              ? edge.weight
              : 0
          ),
        0,
      )

    const negative =
      zoneEdges.reduce(
        (total, edge) =>
          total +
          (
            edge.influenceDirection ===
            'negative'
              ? edge.weight
              : 0
          ),
        0,
      )

    const direction:
      InfluenceDirection =
      positive > negative
        ? 'positive'
        : negative > positive
          ? 'negative'
          : positive === 0 &&
              negative === 0
            ? 'neutral'
            : 'mixed'

    zones.push({
      id:
        createStableId(
          'influence-zone',
          zoneNodes.sort().join(':'),
        ),
      centerNodeId:
        zoneNodes[0] ?? null,
      nodeIds:
        [...zoneNodes].sort(),
      edgeIds:
        zoneEdges.map(edge => edge.id),
      radius,
      spatial: true,
      density:
        calculateDensity(
          zoneNodes,
          zoneEdges,
        ),
      cohesion:
        calculateCohesion(
          zoneNodes,
          zoneEdges,
        ),
      positiveInfluenceScore:
        positive,
      negativeInfluenceScore:
        negative,
      influenceDirection:
        direction,
      metadata: {
        engineName:
          ENGINE_NAME,
      },
    })
  }

  return zones
}

function buildNodeMetrics(
  indexes: GraphIndexes,
  configuration: ResolvedConfiguration,
): InfluenceNodeMetrics[] {
  const betweenness =
    configuration.calculateBetweenness
      ? calculateBetweenness(indexes)
      : new Map<string, number>()

  const eigenvector =
    configuration.calculateEigenvector
      ? calculateEigenvector(indexes)
      : new Map<string, number>()

  const metrics =
    Array.from(indexes.nodeById.keys())
      .map(nodeId => {
        const degree =
          calculateDegreeMetrics(
            nodeId,
            indexes,
          )

        const closeness =
          configuration.calculateCloseness
            ? calculateCloseness(
                nodeId,
                indexes,
              )
            : null

        const betweennessValue =
          configuration.calculateBetweenness
            ? betweenness.get(nodeId) ??
              null
            : null

        const eigenvectorValue =
          configuration.calculateEigenvector
            ? eigenvector.get(nodeId) ??
              null
            : null

        const degreeScore =
          clamp(
            degree.weightedDegree /
              Math.max(
                1,
                indexes.edgeById.size,
              ),
            0,
            1,
          )

        const influenceScore =
          clamp(
            0.35 * degreeScore +
              0.25 *
                (closeness ?? 0) +
              0.2 *
                (betweennessValue ?? 0) +
              0.2 *
                (eigenvectorValue ?? 0),
            0,
            1,
          )

        const isolationScore =
          degree.degree === 0
            ? 1
            : clamp(
                1 -
                  degree.degree /
                    Math.max(
                      1,
                      indexes.nodeById.size - 1,
                    ),
                0,
                1,
              )

        return {
          nodeId,
          degree:
            degree.degree,
          weightedDegree:
            degree.weightedDegree,
          inDegree:
            degree.inDegree,
          outDegree:
            degree.outDegree,
          closeness,
          betweenness:
            betweennessValue,
          eigenvector:
            eigenvectorValue,
          isolationScore,
          influenceScore,
          positiveInfluenceScore:
            degree.positive,
          negativeInfluenceScore:
            degree.negative,
          centralityRank:
            null,
          metadata: {
            engineName:
              ENGINE_NAME,
          },
        }
      })

  metrics.sort(
    (first, second) =>
      second.influenceScore -
      first.influenceScore,
  )

  return metrics.map(
    (metric, index) => ({
      ...metric,
      centralityRank:
        index + 1,
    }),
  )
}

function resolveConfidenceLevel(
  value: number | null,
): AnalyticsConfidence['level'] {
  if (value === null) return 'undetermined'
  if (value < 0.2) return 'very_low'
  if (value < 0.4) return 'low'
  if (value < 0.6) return 'moderate'
  if (value < 0.8) return 'high'
  return 'very_high'
}

function resolveEvidenceStrength(
  value: number | null,
): AnalyticsConfidence['evidenceStrength'] {
  if (value === null) return 'undetermined'
  if (value < 0.2) return 'insufficient'
  if (value < 0.4) return 'weak'
  if (value < 0.7) return 'moderate'
  if (value < 0.9) return 'strong'
  return 'very_strong'
}

function buildConfidence(
  value: number | null,
  sampleSize: number,
  method: string,
  explanation: string,
): AnalyticsConfidence {
  const normalized =
    value === null
      ? null
      : clamp(value, 0, 1)

  return {
    value: normalized,
    level:
      resolveConfidenceLevel(
        normalized,
      ),
    evidenceStrength:
      resolveEvidenceStrength(
        normalized,
      ),
    sampleSize,
    explanation,
    method,
    calculatedAt:
      nowIso(),
    requiresHumanReview:
      normalized === null ||
      normalized < 0.7,
    metadata: {
      engineName:
        ENGINE_NAME,
      engineVersion:
        ENGINE_VERSION,
    },
  }
}

function collectSourceReferences(
  nodes: InfluenceNode[],
  edges: InfluenceEdge[],
): AnalyticsSourceReference[] {
  const map =
    new Map<
      string,
      AnalyticsSourceReference
    >()

  for (const node of nodes) {
    for (const source of node.sourceReferences) {
      map.set(source.id, source)
    }
  }

  for (const edge of edges) {
    for (const source of edge.sourceReferences) {
      map.set(source.id, source)
    }
  }

  return Array.from(map.values())
}

function buildExplainability({
  summary,
  reasons,
  variablesUsed,
  sourceReferences,
  rulesApplied,
  limitations = [],
  uncertaintyFactors = [],
  alternatives = [],
}: {
  summary: string
  reasons: string[]
  variablesUsed: string[]
  sourceReferences: AnalyticsSourceReference[]
  rulesApplied: string[]
  limitations?: string[]
  uncertaintyFactors?: string[]
  alternatives?: string[]
}): AnalyticsExplainability {
  return {
    summary,
    reasons,
    rulesApplied,
    variablesUsed:
      uniqueStrings(
        variablesUsed,
      ),
    sourceReferences,
    assumptions: [
      'Os nós representam entidades educacionais distintas.',
      'As arestas representam relações observadas ou inferidas de forma autorizada.',
      'Os pesos estão em escala comparável dentro da análise.',
    ],
    limitations: [
      'Influência calculada não representa causalidade.',
      'Centralidade não representa liderança pedagógica automática.',
      'Relações ausentes podem alterar os resultados.',
      'A interpretação exige revisão humana.',
      ...limitations,
    ],
    uncertaintyFactors: [
      'Qualidade das relações registradas.',
      'Pesos definidos para as arestas.',
      'Temporalidade e persistência das conexões.',
      'Possíveis relações não observadas.',
      ...uncertaintyFactors,
    ],
    alternativeExplanations: [
      'A centralidade pode decorrer de função institucional.',
      'A proximidade pode decorrer da organização física da sala.',
      'A propagação pode decorrer de evento externo comum.',
      ...alternatives,
    ],
    causalityStatus:
      'association_only',
    generatedAt:
      nowIso(),
    engineName:
      ENGINE_NAME,
    engineVersion:
      ENGINE_VERSION,
    metadata: {
      rulesetVersion:
        RULESET_VERSION,
    },
  }
}

function enumeratePaths(
  originNodeId: string,
  indexes: GraphIndexes,
  maximumDepth: number,
  maximumPaths: number,
): AnalyticsInfluencePath[] {
  const paths:
    AnalyticsInfluencePath[] =
    []

  type QueueItem = {
    nodeId: string
    nodeIds: string[]
    edgeIds: string[]
    relationTypes: string[]
    confidenceValues: number[]
    containsInferred: boolean
    validatedByHuman: boolean
  }

  const queue: QueueItem[] = [
    {
      nodeId: originNodeId,
      nodeIds: [originNodeId],
      edgeIds: [],
      relationTypes: [],
      confidenceValues: [],
      containsInferred: false,
      validatedByHuman: true,
    },
  ]

  while (
    queue.length > 0 &&
    paths.length < maximumPaths
  ) {
    const current =
      queue.shift()

    if (!current) {
      continue
    }

    if (
      current.edgeIds.length >=
      maximumDepth
    ) {
      continue
    }

    for (
      const edge of
        indexes.outgoing.get(current.nodeId) ??
        []
    ) {
      const neighbor =
        getNeighborId(
          edge,
          current.nodeId,
        )

      if (
        !neighbor ||
        current.nodeIds.includes(neighbor)
      ) {
        continue
      }

      const nextNodeIds = [
        ...current.nodeIds,
        neighbor,
      ]

      const nextEdgeIds = [
        ...current.edgeIds,
        edge.id,
      ]

      const nextConfidence = [
        ...current.confidenceValues,
        edge.confidence ?? 0.5,
      ]

      const pathId =
        createStableId(
          'influence-path',
          [
            originNodeId,
            neighbor,
            ...nextEdgeIds,
          ].join(':'),
        )

      paths.push({
        id: pathId,
        sourceNodeId:
          originNodeId,
        targetNodeId:
          neighbor,
        nodeIds:
          nextNodeIds,
        edgeIds:
          nextEdgeIds,
        relationTypes:
          nextEdgeIds.map(
            edgeId =>
              indexes.edgeById.get(edgeId)
                ?.type ??
              'custom',
          ) as never,
        length:
          nextEdgeIds.length,
        averageConfidence:
          mean(nextConfidence),
        minimumConfidence:
          nextConfidence.length > 0
            ? Math.min(...nextConfidence)
            : null,
        containsInferredRelations:
          current.containsInferred ||
          edge.inferred,
        humanValidated:
          current.validatedByHuman &&
          edge.validatedByHuman,
        causalityWarning:
          true,
        metadata: {
          engineName:
            ENGINE_NAME,
        },
      })

      queue.push({
        nodeId:
          neighbor,
        nodeIds:
          nextNodeIds,
        edgeIds:
          nextEdgeIds,
        relationTypes: [
          ...current.relationTypes,
          edge.type,
        ],
        confidenceValues:
          nextConfidence,
        containsInferred:
          current.containsInferred ||
          edge.inferred,
        validatedByHuman:
          current.validatedByHuman &&
          edge.validatedByHuman,
      })

      if (
        paths.length >=
        maximumPaths
      ) {
        break
      }
    }
  }

  return paths
}

function buildPropagation(
  originNodeId: string,
  indexes: GraphIndexes,
  configuration: ResolvedConfiguration,
): InfluencePropagation {
  const steps:
    InfluencePropagationStep[] =
    []

  const reached =
    new Set<string>([
      originNodeId,
    ])

  let frontier =
    new Set<string>([
      originNodeId,
    ])

  const pathIds: string[] = []
  let directionScore = 0

  for (
    let depth = 1;
    depth <= configuration.maximumDepth;
    depth += 1
  ) {
    const next =
      new Set<string>()
    const stepEdges =
      new Set<string>()
    let stepScore = 0

    for (const current of frontier) {
      for (
        const edge of
          indexes.outgoing.get(current) ??
          []
      ) {
        const neighbor =
          getNeighborId(edge, current)

        if (
          !neighbor ||
          reached.has(neighbor)
        ) {
          continue
        }

        reached.add(neighbor)
        next.add(neighbor)
        stepEdges.add(edge.id)

        const decayed =
          edge.weight *
          configuration.propagationDecay **
            (depth - 1)

        stepScore += decayed
        directionScore +=
          edgeDirectionScore(edge) *
          configuration.propagationDecay **
            (depth - 1)

        pathIds.push(
          createStableId(
            'propagation-path',
            `${originNodeId}:${current}:${neighbor}:${edge.id}`,
          ),
        )
      }
    }

    if (next.size === 0) {
      break
    }

    steps.push({
      depth,
      sourceNodeIds:
        Array.from(frontier),
      reachedNodeIds:
        Array.from(next),
      edgeIds:
        Array.from(stepEdges),
      propagationScore:
        stepScore,
    })

    frontier = next
  }

  const reachedNodeIds =
    Array.from(reached)
      .filter(
        nodeId =>
          nodeId !== originNodeId,
      )

  const direction:
    InfluenceDirection =
    directionScore > EPSILON
      ? 'positive'
      : directionScore < -EPSILON
        ? 'negative'
        : 'neutral'

  const persistenceScore =
    steps.length === 0
      ? null
      : clamp(
          steps.length /
            configuration.maximumDepth,
          0,
          1,
        )

  const propagationSpeed =
    steps.length === 0
      ? null
      : reachedNodeIds.length /
        steps.length

  const confidenceValue =
    clamp(
      0.5 *
        Math.min(
          1,
          reachedNodeIds.length /
            Math.max(
              1,
              indexes.nodeById.size - 1,
            ),
        ) +
        0.5 *
          (persistenceScore ?? 0),
      0,
      1,
    )

  return {
    id:
      createStableId(
        'influence-propagation',
        `${originNodeId}:${reachedNodeIds.sort().join(':')}`,
      ),
    originNodeIds:
      [originNodeId],
    reachedNodeIds,
    pathIds,
    maximumDepth:
      steps.length,
    propagationSpeed,
    persistenceScore,
    steps,
    influenceDirection:
      direction,
    confidence:
      buildConfidence(
        confidenceValue,
        reachedNodeIds.length,
        'breadth_first_propagation',
        'Confiança baseada em alcance e persistência da propagação.',
      ),
    metadata: {
      engineName:
        ENGINE_NAME,
      originNodeId,
    },
  }
}

function buildInfluenceResults(
  nodes: InfluenceNode[],
  edges: InfluenceEdge[],
  metrics: InfluenceNodeMetrics[],
  indexes: GraphIndexes,
  configuration: ResolvedConfiguration,
  originNodeIds: string[],
): AnalyticsInfluenceResult[] {
  const results:
    AnalyticsInfluenceResult[] =
    []

  const metricByNode =
    new Map(
      metrics.map(metric => [
        metric.nodeId,
        metric,
      ]),
    )

  for (const originNodeId of originNodeIds) {
    const origin =
      indexes.nodeById.get(
        originNodeId,
      )

    if (!origin) {
      continue
    }

    const paths =
      enumeratePaths(
        originNodeId,
        indexes,
        configuration.maximumDepth,
        configuration.maximumPathsPerOrigin,
      )

    const targetNodeIds =
      uniqueStrings(
        paths.map(
          path =>
            path.targetNodeId,
        ),
      )

    const targetEntityTypes =
      targetNodeIds
        .map(
          nodeId =>
            indexes.nodeById.get(nodeId)
              ?.entityType,
        )
        .filter(
          (
            value,
          ): value is AnalyticsEntityType =>
            Boolean(value),
        )

    const originMetric =
      metricByNode.get(
        originNodeId,
      )

    const relevantEdges =
      edges.filter(
        edge =>
          edge.sourceNodeId ===
            originNodeId ||
          edge.targetNodeId ===
            originNodeId,
      )

    const positive =
      relevantEdges.reduce(
        (total, edge) =>
          total +
          (
            edge.influenceDirection ===
            'positive'
              ? edge.weight
              : 0
          ),
        0,
      )

    const negative =
      relevantEdges.reduce(
        (total, edge) =>
          total +
          (
            edge.influenceDirection ===
            'negative'
              ? edge.weight
              : 0
          ),
        0,
      )

    const direction:
      AnalyticsInfluenceResult['influenceDirection'] =
      positive > negative
        ? 'positive'
        : negative > positive
          ? 'negative'
          : positive === 0 &&
              negative === 0
            ? 'neutral'
            : 'mixed'

    const score =
      originMetric
        ?.influenceScore ??
      0

    const sourceReferences =
      collectSourceReferences(
        [origin],
        relevantEdges,
      )

    const causalityStatus:
      AnalyticsCausalityStatus =
      'association_only'

    results.push({
      id:
        createStableId(
          'influence-result',
          `${originNodeId}:${targetNodeIds.sort().join(':')}`,
        ),
      type:
        resolveInfluenceType(
          relevantEdges,
          origin,
        ),
      sourceEntityId:
        origin.entityId,
      sourceEntityType:
        origin.entityType,
      targetEntityIds:
        targetNodeIds
          .map(
            nodeId =>
              indexes.nodeById.get(nodeId)
                ?.entityId,
          )
          .filter(
            (
              value,
            ): value is string =>
              Boolean(value),
          ),
      targetEntityTypes,
      influenceScore:
        score,
      influenceDirection:
        direction,
      radius:
        null,
      affectedEntityCount:
        targetNodeIds.length,
      propagationDepth:
        paths.length > 0
          ? Math.max(
              ...paths.map(
                path => path.length,
              ),
            )
          : null,
      paths,
      zoneEntityIds:
        [],
      supportingCorrelationIds:
        [],
      supportingPatternIds:
        [],
      confidence:
        buildConfidence(
          score,
          relevantEdges.length,
          'graph_centrality_aggregation',
          'Confiança baseada em centralidade, conectividade e alcance.',
        ),
      causalityStatus,
      requiresHumanReview:
        true,
      explanation:
        buildExplainability({
          summary:
            `A entidade ${origin.entityId} apresentou influência estrutural estimada de ${score.toFixed(4)}.`,
          reasons: [
            `Grau: ${originMetric?.degree ?? 0}.`,
            `Grau ponderado: ${originMetric?.weightedDegree ?? 0}.`,
            `Entidades alcançadas: ${targetNodeIds.length}.`,
            `Caminhos identificados: ${paths.length}.`,
          ],
          variablesUsed: [
            'degree',
            'weighted_degree',
            'closeness',
            'betweenness',
            'eigenvector',
          ],
          sourceReferences,
          rulesApplied: [
            'degree_centrality',
            'weighted_degree',
            'closeness_centrality',
            'betweenness_centrality',
            'eigenvector_centrality',
            'path_enumeration',
            'causality_guard',
            'mandatory_human_review',
          ],
        }),
      warnings: [
        'Influência calculada representa associação estrutural, não causalidade.',
      ],
      metadata: {
        engineName:
          ENGINE_NAME,
        engineVersion:
          ENGINE_VERSION,
        rulesetVersion:
          RULESET_VERSION,
        originNodeId,
        positiveWeight:
          positive,
        negativeWeight:
          negative,
      },
    })
  }

  return results
}

function resolveInfluenceType(
  edges: InfluenceEdge[],
  node: InfluenceNode,
): AnalyticsInfluenceType {
  if (
    edges.some(
      edge =>
        edge.type ===
        'teacher_support',
    ) ||
    node.entityType === 'teacher'
  ) {
    return 'teacher'
  }

  if (
    edges.some(
      edge =>
        edge.type ===
        'proximity',
    )
  ) {
    return 'spatial'
  }

  if (
    edges.some(
      edge =>
        edge.type ===
        'external_event',
    )
  ) {
    return 'external_event'
  }

  if (
    edges.some(
      edge =>
        edge.type ===
        'behavioral_similarity',
    )
  ) {
    return 'behavioral'
  }

  if (
    edges.some(
      edge =>
        edge.type ===
        'group_membership',
    )
  ) {
    return 'group'
  }

  if (
    edges.some(
      edge =>
        edge.type ===
        'pedagogical_intervention',
    )
  ) {
    return 'pedagogical'
  }

  return 'structural'
}

function validateInput(
  nodes: InfluenceNode[],
  edges: InfluenceEdge[],
): string[] {
  const errors: string[] = []
  const nodeIds =
    new Set<string>()

  for (const node of nodes) {
    if (nodeIds.has(node.id)) {
      errors.push(
        `Nó duplicado: ${node.id}.`,
      )
    }

    nodeIds.add(node.id)
  }

  const edgeIds =
    new Set<string>()

  for (const edge of edges) {
    if (edgeIds.has(edge.id)) {
      errors.push(
        `Aresta duplicada: ${edge.id}.`,
      )
    }

    edgeIds.add(edge.id)

    if (
      !nodeIds.has(edge.sourceNodeId)
    ) {
      errors.push(
        `Aresta ${edge.id} referencia origem inexistente ${edge.sourceNodeId}.`,
      )
    }

    if (
      !nodeIds.has(edge.targetNodeId)
    ) {
      errors.push(
        `Aresta ${edge.id} referencia destino inexistente ${edge.targetNodeId}.`,
      )
    }

    if (
      edge.sourceNodeId ===
      edge.targetNodeId
    ) {
      errors.push(
        `Aresta ${edge.id} possui autorrelação.`,
      )
    }
  }

  return uniqueStrings(errors)
}

export function runInfluenceEngine(
  input: InfluenceEngineInput,
): InfluenceEngineResult {
  const generatedAt =
    nowIso()
  const warnings: string[] = []

  try {
    const correlationId =
      normalizeRequiredText(
        input.correlationId,
        'correlationId',
      )

    const configuration =
      resolveConfiguration(
        input.configuration,
      )

    const nodes =
      input.nodes.map(
        normalizeNode,
      )

    const edges =
      filterEdges(
        input.edges.map(
          normalizeEdge,
        ),
        configuration,
      )

    const validationErrors =
      validateInput(
        nodes,
        edges,
      )

    if (validationErrors.length > 0) {
      return {
        success: false,
        influences: [],
        nodeMetrics: [],
        communities: [],
        zones: [],
        propagations: [],
        warnings: [],
        errors:
          validationErrors,
        generatedAt,
        correlationId,
        metadata: {
          engineName:
            ENGINE_NAME,
          engineVersion:
            ENGINE_VERSION,
          rulesetVersion:
            RULESET_VERSION,
          stage:
            'validation',
        },
      }
    }

    const indexes =
      createIndexes(
        nodes,
        edges,
      )

    const metrics =
      buildNodeMetrics(
        indexes,
        configuration,
      )

    const components =
      connectedComponents(
        indexes,
      )

    if (components.length > 1) {
      warnings.push(
        `O grafo possui ${components.length} componentes desconectados.`,
      )
    }

    const communities =
      configuration.detectCommunities
        ? detectCommunities(
            indexes,
            configuration.communityIterations,
          )
        : []

    const zones =
      configuration.detectSpatialZones
        ? detectSpatialZones(
            nodes,
            edges,
            configuration.spatialRadius,
          )
        : []

    const originNodeIds =
      uniqueStrings(
        input.originNodeIds?.length
          ? input.originNodeIds
          : metrics
              .slice(
                0,
                Math.min(
                  10,
                  metrics.length,
                ),
              )
              .map(
                metric =>
                  metric.nodeId,
              ),
      )

    const propagations =
      configuration.detectPropagation
        ? originNodeIds
            .filter(
              nodeId =>
                indexes.nodeById.has(nodeId),
            )
            .map(
              nodeId =>
                buildPropagation(
                  nodeId,
                  indexes,
                  configuration,
                ),
            )
        : []

    const influences =
      buildInfluenceResults(
        nodes,
        edges,
        metrics,
        indexes,
        configuration,
        originNodeIds,
      )

    return {
      success: true,
      influences,
      nodeMetrics:
        metrics,
      communities,
      zones,
      propagations,
      warnings:
        uniqueStrings(warnings),
      errors: [],
      generatedAt,
      correlationId,
      metadata: {
        ...(input.metadata ?? {}),
        engineName:
          ENGINE_NAME,
        engineVersion:
          ENGINE_VERSION,
        rulesetVersion:
          RULESET_VERSION,
        nodeCount:
          nodes.length,
        edgeCount:
          edges.length,
        componentCount:
          components.length,
        communityCount:
          communities.length,
        zoneCount:
          zones.length,
        propagationCount:
          propagations.length,
        influenceCount:
          influences.length,
        configuration,
      },
    }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Falha desconhecida no Influence Engine.'

    return {
      success: false,
      influences: [],
      nodeMetrics: [],
      communities: [],
      zones: [],
      propagations: [],
      warnings: [],
      errors: [message],
      generatedAt,
      correlationId:
        normalizeOptionalText(
          input.correlationId,
        ) ??
        createStableId(
          'influence-run',
          generatedAt,
        ),
      metadata: {
        engineName:
          ENGINE_NAME,
        engineVersion:
          ENGINE_VERSION,
        rulesetVersion:
          RULESET_VERSION,
        failure: true,
      },
    }
  }
}

export function getInfluenceEngineInfo() {
  return {
    name:
      ENGINE_NAME,
    version:
      ENGINE_VERSION,
    rulesetVersion:
      RULESET_VERSION,
    mode:
      'deterministic' as const,
    capabilities: [
      'degree_centrality',
      'weighted_degree',
      'closeness_centrality',
      'betweenness_centrality',
      'eigenvector_centrality',
      'connected_components',
      'label_propagation_communities',
      'spatial_influence_zones',
      'temporal_propagation',
      'path_enumeration',
      'explainability',
    ],
    guarantees: [
      'causality_not_inferred',
      'human_review_required',
      'professional_autonomy_preserved',
      'non_punitive_use',
      'deterministic_processing',
    ],
    limitations: [
      'Betweenness pode ser custosa em grafos muito grandes.',
      'Eigenvector utiliza aproximação iterativa.',
      'Comunidades usam propagação de rótulos heurística.',
      'Zonas espaciais dependem de coordenadas confiáveis.',
      'Propagação representa alcance estrutural, não transmissão causal.',
      'Não acessa banco de dados.',
      'Não aplica RLS.',
    ],
  }
}
