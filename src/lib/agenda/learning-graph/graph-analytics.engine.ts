/**
 * EduData IA — EIOS
 * Capability 03: Learning Graph
 *
 * Motor analítico estrutural do Learning Graph.
 *
 * Arquitetura:
 * Framework EDI
 * → EIOS
 * → Core Compartilhado
 * → Produtos Especializados
 *
 * Responsabilidades:
 * - calcular centralidade de grau;
 * - calcular centralidade de proximidade;
 * - calcular centralidade de intermediação;
 * - identificar nós isolados;
 * - identificar nós críticos;
 * - identificar pontes entre grupos;
 * - identificar componentes conectados;
 * - identificar zonas estruturais de influência;
 * - identificar cadeias pedagógicas;
 * - identificar concentração por tipo de nó;
 * - calcular cobertura de evidências;
 * - calcular cobertura de explicabilidade;
 * - calcular cobertura de revisão humana;
 * - preparar dados para Educational Analytics;
 * - preparar dados para Research Intelligence.
 *
 * Limitações:
 * - não executa inferência causal;
 * - não transforma correlação em causalidade;
 * - não substitui interpretação pedagógica humana;
 * - não acessa banco de dados;
 * - não persiste resultados;
 * - não contém componentes visuais.
 */

import type {
  LearningGraphEdge,
  LearningGraphMetadata,
  LearningGraphNode,
  LearningGraphNodeType,
  LearningGraphRelationType,
  LearningGraphSnapshot,
} from './learning-graph.types'

const ENGINE_NAME =
  'eios-graph-analytics-engine'

const ENGINE_VERSION =
  '1.0.0'

const RULESET_VERSION =
  'graph-analytics-ruleset-1.0.0'

const EPSILON =
  1e-9

export type GraphAnalyticsCentralityMetric =
  | 'degree'
  | 'in_degree'
  | 'out_degree'
  | 'closeness'
  | 'betweenness'
  | 'influence'

export type GraphAnalyticsNodeRole =
  | 'isolated'
  | 'peripheral'
  | 'connected'
  | 'influential'
  | 'bridge'
  | 'critical'
  | 'hub'

export type GraphAnalyticsRiskLevel =
  | 'none'
  | 'low'
  | 'moderate'
  | 'high'
  | 'critical'

export type GraphAnalyticsInfluenceLevel =
  | 'very_low'
  | 'low'
  | 'moderate'
  | 'high'
  | 'very_high'

export type GraphAnalyticsComponent = {
  id: string

  nodeIds: string[]

  edgeIds: string[]

  nodeCount: number

  edgeCount: number

  density: number | null

  averageDegree: number | null

  dominantNodeTypes:
    Array<{
      type:
        LearningGraphNodeType

      count: number

      proportion: number
    }>

  centralNodeIds: string[]

  isolated: boolean

  metadata:
    LearningGraphMetadata
}

export type GraphAnalyticsNodeMetrics = {
  nodeId: string

  nodeKey: string

  nodeType:
    LearningGraphNodeType

  title: string

  degree: number

  inDegree: number

  outDegree: number

  normalizedDegree:
    number | null

  normalizedInDegree:
    number | null

  normalizedOutDegree:
    number | null

  closenessCentrality:
    number | null

  betweennessCentrality:
    number | null

  influenceScore:
    number | null

  influenceLevel:
    GraphAnalyticsInfluenceLevel

  role:
    GraphAnalyticsNodeRole

  componentId: string | null

  neighborNodeIds: string[]

  incomingEdgeIds: string[]

  outgoingEdgeIds: string[]

  evidenceCoverage:
    number | null

  explainabilityCoverage:
    number | null

  humanValidationCoverage:
    number | null

  riskLevel:
    GraphAnalyticsRiskLevel

  warnings: string[]

  metadata:
    LearningGraphMetadata
}

export type GraphAnalyticsBridge = {
  nodeId: string

  nodeKey: string

  title: string

  nodeType:
    LearningGraphNodeType

  componentIds: string[]

  betweennessCentrality:
    number | null

  influenceScore:
    number | null

  connectedNodeIds: string[]

  connectedNodeTypes:
    LearningGraphNodeType[]

  explanation: string

  requiresHumanReview:
    boolean

  metadata:
    LearningGraphMetadata
}

export type GraphAnalyticsCriticalNode = {
  nodeId: string

  nodeKey: string

  title: string

  nodeType:
    LearningGraphNodeType

  role:
    GraphAnalyticsNodeRole

  riskLevel:
    GraphAnalyticsRiskLevel

  influenceScore:
    number | null

  degree: number

  betweennessCentrality:
    number | null

  reasons: string[]

  recommendedReview:
    string[]

  requiresHumanReview:
    boolean

  metadata:
    LearningGraphMetadata
}

export type GraphAnalyticsInfluenceZone = {
  id: string

  anchorNodeId: string

  anchorNodeKey: string

  anchorTitle: string

  anchorNodeType:
    LearningGraphNodeType

  radius: number

  nodeIds: string[]

  edgeIds: string[]

  nodeCount: number

  edgeCount: number

  averageConfidence:
    number | null

  averageInfluence:
    number | null

  dominantNodeTypes:
    Array<{
      type:
        LearningGraphNodeType

      count: number

      proportion: number
    }>

  relationTypes:
    Array<{
      type:
        LearningGraphRelationType

      count: number

      proportion: number
    }>

  evidenceCoverage:
    number | null

  explainabilityCoverage:
    number | null

  requiresHumanReview:
    boolean

  warnings: string[]

  metadata:
    LearningGraphMetadata
}

export type GraphAnalyticsLearningChain = {
  id: string

  startNodeId: string

  endNodeId: string

  nodeIds: string[]

  edgeIds: string[]

  length: number

  relationTypes:
    LearningGraphRelationType[]

  confidenceScore:
    number | null

  explainabilityScore:
    number | null

  containsEvidence: boolean

  containsAssessment: boolean

  containsIntervention: boolean

  containsLearningResult:
    boolean

  causalityWarning:
    boolean

  metadata:
    LearningGraphMetadata
}

export type GraphAnalyticsDistribution = {
  nodeTypes:
    Array<{
      type:
        LearningGraphNodeType

      count: number

      proportion: number
    }>

  relationTypes:
    Array<{
      type:
        LearningGraphRelationType

      count: number

      proportion: number
    }>

  privacyLevels:
    Array<{
      level: string

      count: number

      proportion: number
    }>

  temporalStatuses:
    Array<{
      status: string

      count: number

      proportion: number
    }>
}

export type GraphAnalyticsSummary = {
  graphId: string

  snapshotKey: string

  nodeCount: number

  edgeCount: number

  componentCount: number

  isolatedNodeCount: number

  bridgeNodeCount: number

  criticalNodeCount: number

  influenceZoneCount: number

  learningChainCount: number

  density: number | null

  averageDegree: number | null

  averageConfidence:
    number | null

  evidenceCoverage:
    number | null

  explainabilityCoverage:
    number | null

  humanValidationCoverage:
    number | null

  researchEligibleNodeCount:
    number

  researchEligibleEdgeCount:
    number

  requiresHumanReview:
    boolean

  warnings: string[]

  generatedAt: string
}

export type GraphAnalyticsResult = {
  success: boolean

  graphId: string

  snapshotKey: string

  summary:
    GraphAnalyticsSummary

  nodeMetrics:
    GraphAnalyticsNodeMetrics[]

  components:
    GraphAnalyticsComponent[]

  bridges:
    GraphAnalyticsBridge[]

  criticalNodes:
    GraphAnalyticsCriticalNode[]

  influenceZones:
    GraphAnalyticsInfluenceZone[]

  learningChains:
    GraphAnalyticsLearningChain[]

  distribution:
    GraphAnalyticsDistribution

  warnings: string[]

  errors: string[]

  engine: {
    name: string

    version: string

    rulesetVersion: string

    mode:
      'deterministic'

    generatedAt: string

    metadata:
      LearningGraphMetadata
  }

  metadata:
    LearningGraphMetadata
}

export type AnalyzeLearningGraphInput = {
  graph:
    LearningGraphSnapshot

  includeArchived?: boolean

  includeHistorical?: boolean

  calculateBetweenness?:
    boolean

  calculateCloseness?:
    boolean

  calculateInfluenceZones?:
    boolean

  calculateLearningChains?:
    boolean

  influenceZoneRadius?:
    number

  maximumLearningChainDepth?:
    number

  minimumInfluenceScore?:
    number

  minimumBridgeScore?:
    number

  minimumCriticalScore?:
    number

  maximumNodesForExactBetweenness?:
    number

  requestedByUserId?:
    string | null

  correlationId?: string | null

  metadata?:
    LearningGraphMetadata
}

type NormalizedAnalyzeLearningGraphInput = {
  graph:
    LearningGraphSnapshot

  includeArchived: boolean

  includeHistorical: boolean

  calculateBetweenness:
    boolean

  calculateCloseness:
    boolean

  calculateInfluenceZones:
    boolean

  calculateLearningChains:
    boolean

  influenceZoneRadius: number

  maximumLearningChainDepth:
    number

  minimumInfluenceScore:
    number

  minimumBridgeScore:
    number

  minimumCriticalScore:
    number

  maximumNodesForExactBetweenness:
    number

  requestedByUserId:
    string | null

  correlationId:
    string

  metadata:
    LearningGraphMetadata
}

type AdjacencyEntry = {
  nodeId: string

  edgeId: string

  direction:
    'outgoing' | 'incoming' | 'undirected'

  relationType:
    LearningGraphRelationType
}

type AdjacencyMap =
  Map<
    string,
    AdjacencyEntry[]
  >

type ComponentLookup =
  Map<
    string,
    string
  >

type NodeMetricDraft = {
  node:
    LearningGraphNode

  degree: number

  inDegree: number

  outDegree: number

  normalizedDegree:
    number | null

  normalizedInDegree:
    number | null

  normalizedOutDegree:
    number | null

  closenessCentrality:
    number | null

  betweennessCentrality:
    number | null

  influenceScore:
    number | null

  componentId:
    string | null

  neighborNodeIds: string[]

  incomingEdgeIds: string[]

  outgoingEdgeIds: string[]

  evidenceCoverage:
    number | null

  explainabilityCoverage:
    number | null

  humanValidationCoverage:
    number | null

  warnings: string[]
}

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

function clamp01(
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

function normalizeThreshold(
  value:
    number | null | undefined,
  fallback:
    number,
): number {
  return (
    clamp01(value) ??
    fallback
  )
}

function normalizeInteger(
  value:
    number | null | undefined,
  fallback:
    number,
  minimum:
    number,
  maximum:
    number,
): number {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value)
  ) {
    return fallback
  }

  return Math.min(
    maximum,
    Math.max(
      minimum,
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
  prefix: string,
  value: string,
): string {
  return [
    prefix,
    stableHash(value),
  ].join('-')
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

function calculateProportion(
  count: number,
  total: number,
): number {
  if (total <= 0) {
    return 0
  }

  return count / total
}

function normalizeInput(
  input:
    AnalyzeLearningGraphInput,
): NormalizedAnalyzeLearningGraphInput {
  const generatedAt =
    nowIso()

  return {
    graph:
      input.graph,

    includeArchived:
      input.includeArchived ??
      false,

    includeHistorical:
      input.includeHistorical ??
      false,

    calculateBetweenness:
      input.calculateBetweenness ??
      true,

    calculateCloseness:
      input.calculateCloseness ??
      true,

    calculateInfluenceZones:
      input.calculateInfluenceZones ??
      true,

    calculateLearningChains:
      input.calculateLearningChains ??
      true,

    influenceZoneRadius:
      normalizeInteger(
        input.influenceZoneRadius,
        2,
        1,
        6,
      ),

    maximumLearningChainDepth:
      normalizeInteger(
        input.maximumLearningChainDepth,
        8,
        2,
        20,
      ),

    minimumInfluenceScore:
      normalizeThreshold(
        input.minimumInfluenceScore,
        0.55,
      ),

    minimumBridgeScore:
      normalizeThreshold(
        input.minimumBridgeScore,
        0.25,
      ),

    minimumCriticalScore:
      normalizeThreshold(
        input.minimumCriticalScore,
        0.7,
      ),

    maximumNodesForExactBetweenness:
      normalizeInteger(
        input
          .maximumNodesForExactBetweenness,
        600,
        10,
        5_000,
      ),

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
        .correlationId ??
      createStableId(
        'graph-analytics-correlation',
        generatedAt,
      ),

    metadata: {
      ...(input.metadata ?? {}),
    },
  }
}

function getActiveNodes(
  input:
    NormalizedAnalyzeLearningGraphInput,
): LearningGraphNode[] {
  return input.graph.nodes
    .filter(
      node => {
        if (
          !input.includeArchived &&
          (
            node.archivedAt !==
              null ||
            node.attributes
              .status ===
              'archived'
          )
        ) {
          return false
        }

        if (
          !input.includeHistorical &&
          (
            node.time
              .temporalStatus ===
              'historical' ||
            !node.version.isCurrent
          )
        ) {
          return false
        }

        return true
      },
    )
}

function getActiveEdges(
  input:
    NormalizedAnalyzeLearningGraphInput,
  validNodeIds:
    Set<string>,
): LearningGraphEdge[] {
  return input.graph.edges
    .filter(
      edge => {
        if (
          !validNodeIds.has(
            edge.sourceNodeId,
          ) ||
          !validNodeIds.has(
            edge.targetNodeId,
          )
        ) {
          return false
        }

        if (
          !input.includeArchived &&
          edge.archivedAt !==
            null
        ) {
          return false
        }

        if (
          !input.includeHistorical &&
          (
            edge.time
              .temporalStatus ===
              'historical' ||
            !edge.version.isCurrent
          )
        ) {
          return false
        }

        return true
      },
    )
}

function createAdjacency(
  nodes:
    LearningGraphNode[],
  edges:
    LearningGraphEdge[],
): AdjacencyMap {
  const adjacency:
    AdjacencyMap =
      new Map()

  for (
    const node of nodes
  ) {
    adjacency.set(
      node.id,
      [],
    )
  }

  for (
    const edge of edges
  ) {
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
        nodeId:
          edge.targetNodeId,

        edgeId:
          edge.id,

        direction:
          'outgoing',

        relationType:
          edge.type,
      })

      targetEntries.push({
        nodeId:
          edge.sourceNodeId,

        edgeId:
          edge.id,

        direction:
          'incoming',

        relationType:
          edge.type,
      })

      continue
    }

    sourceEntries.push({
      nodeId:
        edge.targetNodeId,

      edgeId:
        edge.id,

      direction:
        'undirected',

      relationType:
        edge.type,
    })

    targetEntries.push({
      nodeId:
        edge.sourceNodeId,

      edgeId:
        edge.id,

      direction:
        'undirected',

      relationType:
        edge.type,
    })
  }

  return adjacency
}

function createUndirectedNeighborMap(
  adjacency:
    AdjacencyMap,
): Map<
  string,
  Set<string>
> {
  const neighbors =
    new Map<
      string,
      Set<string>
    >()

  for (
    const [
      nodeId,
      entries,
    ] of adjacency.entries()
  ) {
    neighbors.set(
      nodeId,
      new Set(
        entries.map(
          entry =>
            entry.nodeId,
        ),
      ),
    )
  }

  return neighbors
}

function calculateComponents(
  nodes:
    LearningGraphNode[],
  edges:
    LearningGraphEdge[],
  adjacency:
    AdjacencyMap,
): {
  components:
    GraphAnalyticsComponent[]

  lookup:
    ComponentLookup
} {
  const nodeById =
    new Map(
      nodes.map(
        node => [
          node.id,
          node,
        ],
      ),
    )

  const edgeById =
    new Map(
      edges.map(
        edge => [
          edge.id,
          edge,
        ],
      ),
    )

  const visited =
    new Set<string>()

  const lookup:
    ComponentLookup =
      new Map()

  const components:
    GraphAnalyticsComponent[] =
      []

  for (
    const node of nodes
  ) {
    if (
      visited.has(
        node.id,
      )
    ) {
      continue
    }

    const queue = [
      node.id,
    ]

    const componentNodeIds:
      string[] =
      []

    const componentEdgeIds =
      new Set<string>()

    while (
      queue.length > 0
    ) {
      const current =
        queue.shift()

      if (
        !current ||
        visited.has(
          current,
        )
      ) {
        continue
      }

      visited.add(
        current,
      )

      componentNodeIds.push(
        current,
      )

      for (
        const entry of
          adjacency.get(
            current,
          ) ??
          []
      ) {
        componentEdgeIds.add(
          entry.edgeId,
        )

        if (
          !visited.has(
            entry.nodeId,
          )
        ) {
          queue.push(
            entry.nodeId,
          )
        }
      }
    }

    const id =
      createStableId(
        'component',
        componentNodeIds
          .slice()
          .sort()
          .join(':'),
      )

    for (
      const nodeId of
        componentNodeIds
    ) {
      lookup.set(
        nodeId,
        id,
      )
    }

    const typeCounts =
      new Map<
        LearningGraphNodeType,
        number
      >()

    for (
      const nodeId of
        componentNodeIds
    ) {
      const currentNode =
        nodeById.get(
          nodeId,
        )

      if (!currentNode) {
        continue
      }

      typeCounts.set(
        currentNode.type,
        (
          typeCounts.get(
            currentNode.type,
          ) ??
          0
        ) + 1,
      )
    }

    const nodeCount =
      componentNodeIds.length

    const edgeIds =
      Array.from(
        componentEdgeIds,
      ).filter(
        edgeId =>
          edgeById.has(
            edgeId,
          ),
      )

    const edgeCount =
      edgeIds.length

    const possibleEdges =
      nodeCount > 1
        ? (
            nodeCount *
            (
              nodeCount - 1
            )
          ) /
          2
        : 0

    const degreeByNode =
      componentNodeIds.map(
        nodeId => ({
          nodeId,

          degree:
            new Set(
              (
                adjacency.get(
                  nodeId,
                ) ??
                []
              ).map(
                entry =>
                  entry.nodeId,
              ),
            ).size,
        }),
      )

    const maximumDegree =
      degreeByNode.reduce(
        (
          maximum,
          item,
        ) =>
          Math.max(
            maximum,
            item.degree,
          ),
        0,
      )

    components.push({
      id,

      nodeIds:
        componentNodeIds,

      edgeIds,

      nodeCount,

      edgeCount,

      density:
        possibleEdges > 0
          ? Math.min(
              1,
              edgeCount /
                possibleEdges,
            )
          : null,

      averageDegree:
        nodeCount > 0
          ? (
              edgeCount * 2
            ) /
            nodeCount
          : null,

      dominantNodeTypes:
        Array.from(
          typeCounts.entries(),
        )
          .map(
            (
              [
                type,
                count,
              ],
            ) => ({
              type,

              count,

              proportion:
                calculateProportion(
                  count,
                  nodeCount,
                ),
            }),
          )
          .sort(
            (
              first,
              second,
            ) =>
              second.count -
              first.count,
          ),

      centralNodeIds:
        degreeByNode
          .filter(
            item =>
              item.degree ===
                maximumDegree &&
              maximumDegree >
                0,
          )
          .map(
            item =>
              item.nodeId,
          ),

      isolated:
        nodeCount === 1 &&
        edgeCount === 0,

      metadata: {
        engineName:
          ENGINE_NAME,

        engineVersion:
          ENGINE_VERSION,
      },
    })
  }

  return {
    components,

    lookup,
  }
}

function breadthFirstDistances(
  startNodeId:
    string,
  neighbors:
    Map<
      string,
      Set<string>
    >,
): Map<
  string,
  number
> {
  const distances =
    new Map<
      string,
      number
    >()

  const queue = [
    startNodeId,
  ]

  distances.set(
    startNodeId,
    0,
  )

  while (
    queue.length > 0
  ) {
    const current =
      queue.shift()

    if (!current) {
      continue
    }

    const currentDistance =
      distances.get(
        current,
      ) ??
      0

    for (
      const neighbor of
        neighbors.get(
          current,
        ) ??
        []
    ) {
      if (
        distances.has(
          neighbor,
        )
      ) {
        continue
      }

      distances.set(
        neighbor,
        currentDistance +
        1,
      )

      queue.push(
        neighbor,
      )
    }
  }

  return distances
}

function calculateCloseness(
  nodeIds:
    string[],
  neighbors:
    Map<
      string,
      Set<string>
    >,
): Map<
  string,
  number | null
> {
  const result =
    new Map<
      string,
      number | null
    >()

  for (
    const nodeId of nodeIds
  ) {
    const distances =
      breadthFirstDistances(
        nodeId,
        neighbors,
      )

    const reachableDistances =
      Array.from(
        distances.entries(),
      )
        .filter(
          (
            [
              targetNodeId,
            ],
          ) =>
            targetNodeId !==
            nodeId,
        )
        .map(
          (
            [
              ,
              distance,
            ],
          ) =>
            distance,
        )

    if (
      reachableDistances.length ===
      0
    ) {
      result.set(
        nodeId,
        null,
      )

      continue
    }

    const distanceSum =
      reachableDistances.reduce(
        (
          total,
          distance,
        ) =>
          total + distance,
        0,
      )

    const reachableProportion =
      nodeIds.length > 1
        ? reachableDistances.length /
          (
            nodeIds.length -
            1
          )
        : 0

    result.set(
      nodeId,
      distanceSum > 0
        ? (
            reachableDistances.length /
            distanceSum
          ) *
          reachableProportion
        : null,
    )
  }

  return result
}

function calculateBetweenness(
  nodeIds:
    string[],
  neighbors:
    Map<
      string,
      Set<string>
    >,
): Map<
  string,
  number
> {
  const centrality =
    new Map<
      string,
      number
    >()

  for (
    const nodeId of nodeIds
  ) {
    centrality.set(
      nodeId,
      0,
    )
  }

  for (
    const source of nodeIds
  ) {
    const stack:
      string[] =
      []

    const predecessors =
      new Map<
        string,
        string[]
      >()

    const pathCounts =
      new Map<
        string,
        number
      >()

    const distances =
      new Map<
        string,
        number
      >()

    for (
      const nodeId of nodeIds
    ) {
      predecessors.set(
        nodeId,
        [],
      )

      pathCounts.set(
        nodeId,
        0,
      )

      distances.set(
        nodeId,
        -1,
      )
    }

    pathCounts.set(
      source,
      1,
    )

    distances.set(
      source,
      0,
    )

    const queue = [
      source,
    ]

    while (
      queue.length > 0
    ) {
      const current =
        queue.shift()

      if (!current) {
        continue
      }

      stack.push(
        current,
      )

      const currentDistance =
        distances.get(
          current,
        ) ??
        -1

      for (
        const neighbor of
          neighbors.get(
            current,
          ) ??
          []
      ) {
        if (
          (
            distances.get(
              neighbor,
            ) ??
            -1
          ) <
          0
        ) {
          queue.push(
            neighbor,
          )

          distances.set(
            neighbor,
            currentDistance +
            1,
          )
        }

        if (
          distances.get(
            neighbor,
          ) ===
          currentDistance +
          1
        ) {
          pathCounts.set(
            neighbor,
            (
              pathCounts.get(
                neighbor,
              ) ??
              0
            ) +
            (
              pathCounts.get(
                current,
              ) ??
              0
            ),
          )

          predecessors
            .get(
              neighbor,
            )
            ?.push(
              current,
            )
        }
      }
    }

    const dependency =
      new Map<
        string,
        number
      >()

    for (
      const nodeId of nodeIds
    ) {
      dependency.set(
        nodeId,
        0,
      )
    }

    while (
      stack.length > 0
    ) {
      const current =
        stack.pop()

      if (!current) {
        continue
      }

      for (
        const predecessor of
          predecessors.get(
            current,
          ) ??
          []
      ) {
        const currentPathCount =
          pathCounts.get(
            current,
          ) ??
          0

        if (
          currentPathCount <=
          0
        ) {
          continue
        }

        const contribution =
          (
            (
              pathCounts.get(
                predecessor,
              ) ??
              0
            ) /
            currentPathCount
          ) *
          (
            1 +
            (
              dependency.get(
                current,
              ) ??
              0
            )
          )

        dependency.set(
          predecessor,
          (
            dependency.get(
              predecessor,
            ) ??
            0
          ) +
          contribution,
        )
      }

      if (
        current !==
        source
      ) {
        centrality.set(
          current,
          (
            centrality.get(
              current,
            ) ??
            0
          ) +
          (
            dependency.get(
              current,
            ) ??
            0
          ),
        )
      }
    }
  }

  const normalization =
    nodeIds.length >
    2
      ? (
          (
            nodeIds.length -
            1
          ) *
          (
            nodeIds.length -
            2
          )
        ) /
        2
      : 0

  for (
    const nodeId of nodeIds
  ) {
    const raw =
      (
        centrality.get(
          nodeId,
        ) ??
        0
      ) /
      2

    centrality.set(
      nodeId,
      normalization > 0
        ? raw /
          normalization
        : 0,
    )
  }

  return centrality
}

function calculateNodeCoverage({
  node,
  incidentEdges,
}: {
  node:
    LearningGraphNode

  incidentEdges:
    LearningGraphEdge[]
}): {
  evidenceCoverage:
    number | null

  explainabilityCoverage:
    number | null

  humanValidationCoverage:
    number | null
} {
  if (
    incidentEdges.length ===
    0
  ) {
    return {
      evidenceCoverage:
        node.attributes
          .evidenceIds
          .length >
        0
          ? 1
          : 0,

      explainabilityCoverage:
        node.explainability
          .summary
          .trim()
          ? 1
          : 0,

      humanValidationCoverage:
        node.traceability
          .reviewedBy
          ? 1
          : 0,
    }
  }

  return {
    evidenceCoverage:
      incidentEdges.filter(
        edge =>
          edge.attributes
            .evidence.length >
          0,
      ).length /
      incidentEdges.length,

    explainabilityCoverage:
      (
        incidentEdges.filter(
          edge =>
            Boolean(
              edge.explainability
                .summary
                .trim(),
            ),
        ).length +
        (
          node.explainability
            .summary
            .trim()
            ? 1
            : 0
        )
      ) /
      (
        incidentEdges.length +
        1
      ),

    humanValidationCoverage:
      (
        incidentEdges.filter(
          edge =>
            edge.attributes
              .validatedByHuman,
        ).length +
        (
          node.traceability
            .reviewedBy
            ? 1
            : 0
        )
      ) /
      (
        incidentEdges.length +
        1
      ),
  }
}

function resolveInfluenceLevel(
  score:
    number | null,
): GraphAnalyticsInfluenceLevel {
  if (
    score === null ||
    score <
    0.2
  ) {
    return 'very_low'
  }

  if (score < 0.4) {
    return 'low'
  }

  if (score < 0.6) {
    return 'moderate'
  }

  if (score < 0.8) {
    return 'high'
  }

  return 'very_high'
}

function resolveRole({
  degree,
  normalizedDegree,
  betweenness,
  influence,
}: {
  degree: number

  normalizedDegree:
    number | null

  betweenness:
    number | null

  influence:
    number | null
}): GraphAnalyticsNodeRole {
  if (degree === 0) {
    return 'isolated'
  }

  if (
    influence !== null &&
    influence >= 0.85
  ) {
    return 'hub'
  }

  if (
    betweenness !== null &&
    betweenness >= 0.5
  ) {
    return 'bridge'
  }

  if (
    influence !== null &&
    influence >= 0.7
  ) {
    return 'critical'
  }

  if (
    influence !== null &&
    influence >= 0.55
  ) {
    return 'influential'
  }

  if (
    normalizedDegree !== null &&
    normalizedDegree <
    0.15
  ) {
    return 'peripheral'
  }

  return 'connected'
}

function resolveRiskLevel({
  role,
  evidenceCoverage,
  explainabilityCoverage,
  humanValidationCoverage,
  privacySensitive,
}: {
  role:
    GraphAnalyticsNodeRole

  evidenceCoverage:
    number | null

  explainabilityCoverage:
    number | null

  humanValidationCoverage:
    number | null

  privacySensitive:
    boolean
}): GraphAnalyticsRiskLevel {
  let score =
    0

  if (
    role === 'critical' ||
    role === 'hub'
  ) {
    score +=
      2
  }

  if (
    role === 'bridge'
  ) {
    score +=
      2
  }

  if (
    evidenceCoverage !==
      null &&
    evidenceCoverage <
      0.5
  ) {
    score +=
      1
  }

  if (
    explainabilityCoverage !==
      null &&
    explainabilityCoverage <
      0.5
  ) {
    score +=
      1
  }

  if (
    humanValidationCoverage !==
      null &&
    humanValidationCoverage <
      0.5
  ) {
    score +=
      1
  }

  if (privacySensitive) {
    score +=
      1
  }

  if (score >= 6) {
    return 'critical'
  }

  if (score >= 4) {
    return 'high'
  }

  if (score >= 2) {
    return 'moderate'
  }

  if (score >= 1) {
    return 'low'
  }

  return 'none'
}

function buildNodeMetrics({
  nodes,
  edges,
  adjacency,
  componentLookup,
  closeness,
  betweenness,
}: {
  nodes:
    LearningGraphNode[]

  edges:
    LearningGraphEdge[]

  adjacency:
    AdjacencyMap

  componentLookup:
    ComponentLookup

  closeness:
    Map<
      string,
      number | null
    >

  betweenness:
    Map<
      string,
      number
    >
}): GraphAnalyticsNodeMetrics[] {
  const maximumPossibleDegree =
    Math.max(
      0,
      nodes.length - 1,
    )

  const drafts:
    NodeMetricDraft[] =
      nodes.map(
        node => {
          const entries =
            adjacency.get(
              node.id,
            ) ??
            []

          const neighborNodeIds =
            uniqueStrings(
              entries.map(
                entry =>
                  entry.nodeId,
              ),
            )

          const incomingEdgeIds =
            uniqueStrings(
              entries
                .filter(
                  entry =>
                    entry.direction ===
                    'incoming',
                )
                .map(
                  entry =>
                    entry.edgeId,
                ),
            )

          const outgoingEdgeIds =
            uniqueStrings(
              entries
                .filter(
                  entry =>
                    entry.direction ===
                      'outgoing' ||
                    entry.direction ===
                      'undirected',
                )
                .map(
                  entry =>
                    entry.edgeId,
                ),
            )

          const inDegree =
            incomingEdgeIds.length

          const outDegree =
            outgoingEdgeIds.length

          const degree =
            neighborNodeIds.length

          const incidentEdgeIds =
            new Set(
              entries.map(
                entry =>
                  entry.edgeId,
              ),
            )

          const incidentEdges =
            edges.filter(
              edge =>
                incidentEdgeIds.has(
                  edge.id,
                ),
            )

          const coverage =
            calculateNodeCoverage({
              node,

              incidentEdges,
            })

          const normalizedDegree =
            maximumPossibleDegree >
            0
              ? degree /
                maximumPossibleDegree
              : null

          const normalizedInDegree =
            maximumPossibleDegree >
            0
              ? inDegree /
                maximumPossibleDegree
              : null

          const normalizedOutDegree =
            maximumPossibleDegree >
            0
              ? outDegree /
                maximumPossibleDegree
              : null

          return {
            node,

            degree,

            inDegree,

            outDegree,

            normalizedDegree,

            normalizedInDegree,

            normalizedOutDegree,

            closenessCentrality:
              closeness.get(
                node.id,
              ) ??
              null,

            betweennessCentrality:
              betweenness.get(
                node.id,
              ) ??
              null,

            influenceScore:
              null,

            componentId:
              componentLookup.get(
                node.id,
              ) ??
              null,

            neighborNodeIds,

            incomingEdgeIds,

            outgoingEdgeIds,

            evidenceCoverage:
              coverage
                .evidenceCoverage,

            explainabilityCoverage:
              coverage
                .explainabilityCoverage,

            humanValidationCoverage:
              coverage
                .humanValidationCoverage,

            warnings:
              [],
          }
        },
      )

  for (
    const draft of drafts
  ) {
    draft.influenceScore =
      clamp01(
        calculateAverage([
          draft
            .normalizedDegree,

          draft
            .closenessCentrality,

          draft
            .betweennessCentrality,

          draft.node
            .confidence.value,

          draft
            .evidenceCoverage,

          draft
            .explainabilityCoverage,
        ]),
      )

    if (
      draft.node.privacy
        .containsMinorData &&
      !draft.node.privacy
        .anonymized &&
      !draft.node.privacy
        .pseudonymized
    ) {
      draft.warnings.push(
        'O nó contém dados de menores sem anonimização ou pseudonimização.',
      )
    }

    if (
      draft.node
        .researchEligibility
        .eligible &&
      draft.node
        .researchEligibility
        .anonymizationRequired &&
      !draft.node.privacy
        .anonymized
    ) {
      draft.warnings.push(
        'O nó requer anonimização antes do uso em pesquisa.',
      )
    }

    if (
      (
        draft
          .evidenceCoverage ??
        0
      ) <
      0.5
    ) {
      draft.warnings.push(
        'A cobertura de evidências do nó é limitada.',
      )
    }

    if (
      (
        draft
          .explainabilityCoverage ??
        0
      ) <
      0.5
    ) {
      draft.warnings.push(
        'A cobertura de explicabilidade do nó é limitada.',
      )
    }
  }

  return drafts.map(
    draft => {
      const role =
        resolveRole({
          degree:
            draft.degree,

          normalizedDegree:
            draft
              .normalizedDegree,

          betweenness:
            draft
              .betweennessCentrality,

          influence:
            draft
              .influenceScore,
        })

      return {
        nodeId:
          draft.node.id,

        nodeKey:
          draft.node
            .nodeKey,

        nodeType:
          draft.node.type,

        title:
          draft.node
            .attributes.title,

        degree:
          draft.degree,

        inDegree:
          draft.inDegree,

        outDegree:
          draft.outDegree,

        normalizedDegree:
          draft
            .normalizedDegree,

        normalizedInDegree:
          draft
            .normalizedInDegree,

        normalizedOutDegree:
          draft
            .normalizedOutDegree,

        closenessCentrality:
          draft
            .closenessCentrality,

        betweennessCentrality:
          draft
            .betweennessCentrality,

        influenceScore:
          draft
            .influenceScore,

        influenceLevel:
          resolveInfluenceLevel(
            draft
              .influenceScore,
          ),

        role,

        componentId:
          draft.componentId,

        neighborNodeIds:
          draft
            .neighborNodeIds,

        incomingEdgeIds:
          draft
            .incomingEdgeIds,

        outgoingEdgeIds:
          draft
            .outgoingEdgeIds,

        evidenceCoverage:
          draft
            .evidenceCoverage,

        explainabilityCoverage:
          draft
            .explainabilityCoverage,

        humanValidationCoverage:
          draft
            .humanValidationCoverage,

        riskLevel:
          resolveRiskLevel({
            role,

            evidenceCoverage:
              draft
                .evidenceCoverage,

            explainabilityCoverage:
              draft
                .explainabilityCoverage,

            humanValidationCoverage:
              draft
                .humanValidationCoverage,

            privacySensitive:
              draft.node
                .privacy
                .containsSensitiveData ||
              draft.node
                .privacy
                .containsMinorData,
          }),

        warnings:
          uniqueStrings(
            draft.warnings,
          ),

        metadata: {
          engineName:
            ENGINE_NAME,

          engineVersion:
            ENGINE_VERSION,
        },
      }
    },
  )
}

function identifyBridges(
  nodeMetrics:
    GraphAnalyticsNodeMetrics[],
  nodeById:
    Map<
      string,
      LearningGraphNode
    >,
  minimumBridgeScore:
    number,
): GraphAnalyticsBridge[] {
  return nodeMetrics
    .filter(
      metric =>
        (
          metric
            .betweennessCentrality ??
          0
        ) >=
          minimumBridgeScore &&
        metric.degree >=
          2,
    )
    .map(
      metric => {
        const node =
          nodeById.get(
            metric.nodeId,
          )

        const connectedNodeTypes =
          uniqueStrings(
            metric
              .neighborNodeIds
              .map(
                nodeId =>
                  nodeById.get(
                    nodeId,
                  )?.type,
              ),
          ) as
            LearningGraphNodeType[]

        return {
          nodeId:
            metric.nodeId,

          nodeKey:
            metric.nodeKey,

          title:
            metric.title,

          nodeType:
            metric.nodeType,

          componentIds:
            metric.componentId
              ? [
                  metric
                    .componentId,
                ]
              : [],

          betweennessCentrality:
            metric
              .betweennessCentrality,

          influenceScore:
            metric
              .influenceScore,

          connectedNodeIds:
            metric
              .neighborNodeIds,

          connectedNodeTypes,

          explanation:
            'O nó ocupa posição de intermediação relevante entre diferentes partes do grafo. Essa posição indica conectividade estrutural, não causalidade pedagógica.',

          requiresHumanReview:
            true,

          metadata: {
            source:
              'deterministic_graph_analysis',

            nodeStatus:
              node?.attributes
                .status ??
              'unknown',
          },
        }
      },
    )
    .sort(
      (
        first,
        second,
      ) =>
        (
          second
            .betweennessCentrality ??
          0
        ) -
        (
          first
            .betweennessCentrality ??
          0
        ),
    )
}

function identifyCriticalNodes(
  nodeMetrics:
    GraphAnalyticsNodeMetrics[],
  minimumCriticalScore:
    number,
): GraphAnalyticsCriticalNode[] {
  return nodeMetrics
    .filter(
      metric =>
        (
          metric
            .influenceScore ??
          0
        ) >=
          minimumCriticalScore ||
        metric.riskLevel ===
          'critical' ||
        metric.riskLevel ===
          'high',
    )
    .map(
      metric => {
        const reasons:
          string[] =
          []

        if (
          (
            metric
              .influenceScore ??
            0
          ) >=
          minimumCriticalScore
        ) {
          reasons.push(
            'Influência estrutural elevada no grafo.',
          )
        }

        if (
          (
            metric
              .betweennessCentrality ??
            0
          ) >=
          0.4
        ) {
          reasons.push(
            'Elevada intermediação entre diferentes regiões do grafo.',
          )
        }

        if (
          (
            metric
              .evidenceCoverage ??
            0
          ) <
          0.5
        ) {
          reasons.push(
            'Cobertura de evidências insuficiente para a relevância estrutural observada.',
          )
        }

        if (
          (
            metric
              .humanValidationCoverage ??
            0
          ) <
          0.5
        ) {
          reasons.push(
            'Cobertura limitada de validação humana.',
          )
        }

        return {
          nodeId:
            metric.nodeId,

          nodeKey:
            metric.nodeKey,

          title:
            metric.title,

          nodeType:
            metric.nodeType,

          role:
            metric.role,

          riskLevel:
            metric.riskLevel,

          influenceScore:
            metric
              .influenceScore,

          degree:
            metric.degree,

          betweennessCentrality:
            metric
              .betweennessCentrality,

          reasons:
            uniqueStrings(
              reasons,
            ),

          recommendedReview: [
            'Verificar a qualidade e suficiência das evidências vinculadas.',
            'Validar a interpretação com profissional responsável.',
            'Avaliar impactos antes de utilizar o nó em recomendações ou intervenções.',
            'Não interpretar centralidade como desempenho, mérito ou causalidade.',
          ],

          requiresHumanReview:
            true,

          metadata: {
            engineName:
              ENGINE_NAME,

            engineVersion:
              ENGINE_VERSION,
          },
        }
      },
    )
    .sort(
      (
        first,
        second,
      ) =>
        (
          second
            .influenceScore ??
          0
        ) -
        (
          first
            .influenceScore ??
          0
        ),
    )
}

function collectInfluenceZone({
  anchorNodeId,
  radius,
  adjacency,
}: {
  anchorNodeId: string

  radius: number

  adjacency:
    AdjacencyMap
}): {
  nodeIds: string[]

  edgeIds: string[]
} {
  const visited =
    new Map<
      string,
      number
    >()

  const queue:
    Array<{
      nodeId: string

      depth: number
    }> = [
      {
        nodeId:
          anchorNodeId,

        depth:
          0,
      },
    ]

  const edgeIds =
    new Set<string>()

  while (
    queue.length > 0
  ) {
    const current =
      queue.shift()

    if (!current) {
      continue
    }

    const knownDepth =
      visited.get(
        current.nodeId,
      )

    if (
      knownDepth !==
        undefined &&
      knownDepth <=
        current.depth
    ) {
      continue
    }

    visited.set(
      current.nodeId,
      current.depth,
    )

    if (
      current.depth >=
      radius
    ) {
      continue
    }

    for (
      const entry of
        adjacency.get(
          current.nodeId,
        ) ??
        []
    ) {
      edgeIds.add(
        entry.edgeId,
      )

      queue.push({
        nodeId:
          entry.nodeId,

        depth:
          current.depth +
          1,
      })
    }
  }

  return {
    nodeIds:
      Array.from(
        visited.keys(),
      ),

    edgeIds:
      Array.from(
        edgeIds,
      ),
  }
}

function buildInfluenceZones({
  nodeMetrics,
  nodeById,
  edgeById,
  adjacency,
  radius,
  minimumInfluenceScore,
}: {
  nodeMetrics:
    GraphAnalyticsNodeMetrics[]

  nodeById:
    Map<
      string,
      LearningGraphNode
    >

  edgeById:
    Map<
      string,
      LearningGraphEdge
    >

  adjacency:
    AdjacencyMap

  radius: number

  minimumInfluenceScore:
    number
}): GraphAnalyticsInfluenceZone[] {
  return nodeMetrics
    .filter(
      metric =>
        (
          metric
            .influenceScore ??
          0
        ) >=
        minimumInfluenceScore,
    )
    .map(
      metric => {
        const anchorNode =
          nodeById.get(
            metric.nodeId,
          )

        const collected =
          collectInfluenceZone({
            anchorNodeId:
              metric.nodeId,

            radius,

            adjacency,
          })

        const zoneNodes =
          collected.nodeIds
            .map(
              nodeId =>
                nodeById.get(
                  nodeId,
                ),
            )
            .filter(
              (
                node,
              ): node is LearningGraphNode =>
                Boolean(node),
            )

        const zoneEdges =
          collected.edgeIds
            .map(
              edgeId =>
                edgeById.get(
                  edgeId,
                ),
            )
            .filter(
              (
                edge,
              ): edge is LearningGraphEdge =>
                Boolean(edge),
            )

        const nodeTypeCounts =
          new Map<
            LearningGraphNodeType,
            number
          >()

        const relationTypeCounts =
          new Map<
            LearningGraphRelationType,
            number
          >()

        for (
          const node of zoneNodes
        ) {
          nodeTypeCounts.set(
            node.type,
            (
              nodeTypeCounts.get(
                node.type,
              ) ??
              0
            ) + 1,
          )
        }

        for (
          const edge of zoneEdges
        ) {
          relationTypeCounts.set(
            edge.type,
            (
              relationTypeCounts.get(
                edge.type,
              ) ??
              0
            ) + 1,
          )
        }

        const zoneMetricLookup =
          new Map(
            nodeMetrics.map(
              item => [
                item.nodeId,
                item,
              ],
            ),
          )

        const warnings:
          string[] =
          []

        if (
          zoneNodes.some(
            node =>
              node.privacy
                .containsMinorData,
          )
        ) {
          warnings.push(
            'A zona inclui nós relacionados a menores e requer governança reforçada.',
          )
        }

        if (
          zoneEdges.some(
            edge =>
              edge.attributes
                .inferredRelation &&
              !edge.attributes
                .validatedByHuman,
          )
        ) {
          warnings.push(
            'A zona contém relações inferidas ainda não validadas por humano.',
          )
        }

        return {
          id:
            createStableId(
              'influence-zone',
              [
                metric.nodeId,
                String(radius),
              ].join(':'),
            ),

          anchorNodeId:
            metric.nodeId,

          anchorNodeKey:
            metric.nodeKey,

          anchorTitle:
            anchorNode
              ?.attributes.title ??
            metric.title,

          anchorNodeType:
            metric.nodeType,

          radius,

          nodeIds:
            collected.nodeIds,

          edgeIds:
            collected.edgeIds,

          nodeCount:
            zoneNodes.length,

          edgeCount:
            zoneEdges.length,

          averageConfidence:
            calculateAverage([
              ...zoneNodes.map(
                node =>
                  node.confidence
                    .value,
              ),

              ...zoneEdges.map(
                edge =>
                  edge.attributes
                    .confidence.value,
              ),
            ]),

          averageInfluence:
            calculateAverage(
              collected.nodeIds.map(
                nodeId =>
                  zoneMetricLookup.get(
                    nodeId,
                  )
                    ?.influenceScore,
              ),
            ),

          dominantNodeTypes:
            Array.from(
              nodeTypeCounts.entries(),
            )
              .map(
                (
                  [
                    type,
                    count,
                  ],
                ) => ({
                  type,

                  count,

                  proportion:
                    calculateProportion(
                      count,
                      zoneNodes.length,
                    ),
                }),
              )
              .sort(
                (
                  first,
                  second,
                ) =>
                  second.count -
                  first.count,
              ),

          relationTypes:
            Array.from(
              relationTypeCounts.entries(),
            )
              .map(
                (
                  [
                    type,
                    count,
                  ],
                ) => ({
                  type,

                  count,

                  proportion:
                    calculateProportion(
                      count,
                      zoneEdges.length,
                    ),
                }),
              )
              .sort(
                (
                  first,
                  second,
                ) =>
                  second.count -
                  first.count,
              ),

          evidenceCoverage:
            zoneEdges.length >
            0
              ? zoneEdges.filter(
                  edge =>
                    edge.attributes
                      .evidence.length >
                    0,
                ).length /
                zoneEdges.length
              : null,

          explainabilityCoverage:
            (
              zoneNodes.length +
              zoneEdges.length
            ) >
            0
              ? (
                  zoneNodes.filter(
                    node =>
                      Boolean(
                        node.explainability
                          .summary
                          .trim(),
                      ),
                  ).length +
                  zoneEdges.filter(
                    edge =>
                      Boolean(
                        edge.explainability
                          .summary
                          .trim(),
                      ),
                  ).length
                ) /
                (
                  zoneNodes.length +
                  zoneEdges.length
                )
              : null,

          requiresHumanReview:
            warnings.length >
            0,

          warnings,

          metadata: {
            anchorInfluenceScore:
              metric
                .influenceScore,

            structuralZone:
              true,

            causalInterpretation:
              false,
          },
        }
      },
    )
    .sort(
      (
        first,
        second,
      ) =>
        (
          second
            .averageInfluence ??
          0
        ) -
        (
          first
            .averageInfluence ??
          0
        ),
    )
}

function isLearningChainNode(
  node:
    LearningGraphNode,
): boolean {
  return [
    'planning',
    'lesson',
    'learning_objective',
    'skill',
    'competency',
    'evidence',
    'evidence_intelligence_run',
    'pedagogical_analysis',
    'pedagogical_intervention',
    'intervention_action',
    'indicator',
    'assessment',
    'assessment_result',
    'learning_result',
  ].includes(
    node.type,
  )
}

function isLearningChainRelation(
  relationType:
    LearningGraphRelationType,
): boolean {
  return [
    'planned_for',
    'executed_in',
    'addresses',
    'develops',
    'assesses',
    'produces',
    'documents',
    'supports',
    'requires',
    'precedes',
    'follows',
    'depends_on',
    'contributes_to',
    'indicates',
    'measures',
    'evaluates',
    'results_in',
    'recommends',
    'intervenes_on',
    'monitors',
    'derived_from',
  ].includes(
    relationType,
  )
}

function findLearningChains({
  nodes,
  edges,
  maximumDepth,
}: {
  nodes:
    LearningGraphNode[]

  edges:
    LearningGraphEdge[]

  maximumDepth: number
}): GraphAnalyticsLearningChain[] {
  const nodeById =
    new Map(
      nodes.map(
        node => [
          node.id,
          node,
        ],
      ),
    )

  const outgoing =
    new Map<
      string,
      LearningGraphEdge[]
    >()

  for (
    const node of nodes
  ) {
    outgoing.set(
      node.id,
      [],
    )
  }

  for (
    const edge of edges
  ) {
    if (
      !isLearningChainRelation(
        edge.type,
      )
    ) {
      continue
    }

    outgoing
      .get(
        edge.sourceNodeId,
      )
      ?.push(
        edge,
      )

    if (
      edge.direction !==
      'directed'
    ) {
      outgoing
        .get(
          edge.targetNodeId,
        )
        ?.push({
          ...edge,

          sourceNodeId:
            edge.targetNodeId,

          targetNodeId:
            edge.sourceNodeId,
        })
    }
  }

  const startNodes =
    nodes.filter(
      node =>
        isLearningChainNode(
          node,
        ) &&
        [
          'planning',
          'lesson',
          'learning_objective',
          'skill',
          'competency',
        ].includes(
          node.type,
        ),
    )

  const chains:
    GraphAnalyticsLearningChain[] =
      []

  const signatures =
    new Set<string>()

  for (
    const startNode of
      startNodes
  ) {
    const stack:
      Array<{
        nodeId: string

        nodeIds: string[]

        edgeIds: string[]

        relationTypes:
          LearningGraphRelationType[]

        visited:
          Set<string>
      }> = [
      {
        nodeId:
          startNode.id,

        nodeIds: [
          startNode.id,
        ],

        edgeIds:
          [],

        relationTypes:
          [],

        visited:
          new Set([
            startNode.id,
          ]),
      },
    ]

    while (
      stack.length > 0
    ) {
      const current =
        stack.pop()

      if (!current) {
        continue
      }

      const currentNode =
        nodeById.get(
          current.nodeId,
        )

      if (!currentNode) {
        continue
      }

      const reachedResult =
        [
          'assessment_result',
          'learning_result',
        ].includes(
          currentNode.type,
        )

      if (
        reachedResult &&
        current.edgeIds
          .length >
        0
      ) {
        const signature =
          current.nodeIds.join(
            '>',
          )

        if (
          !signatures.has(
            signature,
          )
        ) {
          signatures.add(
            signature,
          )

          const chainEdges =
            current.edgeIds
              .map(
                edgeId =>
                  edges.find(
                    edge =>
                      edge.id ===
                      edgeId,
                  ),
              )
              .filter(
                (
                  edge,
                ): edge is LearningGraphEdge =>
                  Boolean(edge),
              )

          const chainNodes =
            current.nodeIds
              .map(
                nodeId =>
                  nodeById.get(
                    nodeId,
                  ),
              )
              .filter(
                (
                  node,
                ): node is LearningGraphNode =>
                  Boolean(node),
              )

          chains.push({
            id:
              createStableId(
                'learning-chain',
                signature,
              ),

            startNodeId:
              startNode.id,

            endNodeId:
              current.nodeId,

            nodeIds:
              current.nodeIds,

            edgeIds:
              current.edgeIds,

            length:
              current.edgeIds
                .length,

            relationTypes:
              current
                .relationTypes,

            confidenceScore:
              calculateAverage(
                chainEdges.map(
                  edge =>
                    edge.attributes
                      .confidence.value,
                ),
              ),

            explainabilityScore:
              (
                chainEdges.length +
                chainNodes.length
              ) >
              0
                ? (
                    chainEdges.filter(
                      edge =>
                        Boolean(
                          edge.explainability
                            .summary
                            .trim(),
                        ),
                    ).length +
                    chainNodes.filter(
                      node =>
                        Boolean(
                          node.explainability
                            .summary
                            .trim(),
                        ),
                    ).length
                  ) /
                  (
                    chainEdges.length +
                    chainNodes.length
                  )
                : null,

            containsEvidence:
              chainNodes.some(
                node =>
                  node.type ===
                  'evidence',
              ),

            containsAssessment:
              chainNodes.some(
                node =>
                  node.type ===
                    'assessment' ||
                  node.type ===
                    'assessment_result',
              ),

            containsIntervention:
              chainNodes.some(
                node =>
                  node.type ===
                    'pedagogical_intervention' ||
                  node.type ===
                    'intervention_action',
              ),

            containsLearningResult:
              chainNodes.some(
                node =>
                  node.type ===
                  'learning_result',
              ),

            causalityWarning:
              chainEdges.some(
                edge =>
                  edge.type ===
                    'correlates_with' ||
                  edge.type ===
                    'associated_with' ||
                  edge.attributes
                    .causalityStatus ===
                    'correlation_only',
              ),

            metadata: {
              deterministicPath:
                true,

              causalClaim:
                false,
            },
          })
        }
      }

      if (
        current.edgeIds
          .length >=
        maximumDepth
      ) {
        continue
      }

      for (
        const edge of
          outgoing.get(
            current.nodeId,
          ) ??
          []
      ) {
        if (
          current.visited.has(
            edge.targetNodeId,
          )
        ) {
          continue
        }

        const targetNode =
          nodeById.get(
            edge.targetNodeId,
          )

        if (
          !targetNode ||
          !isLearningChainNode(
            targetNode,
          )
        ) {
          continue
        }

        const nextVisited =
          new Set(
            current.visited,
          )

        nextVisited.add(
          targetNode.id,
        )

        stack.push({
          nodeId:
            targetNode.id,

          nodeIds: [
            ...current
              .nodeIds,

            targetNode.id,
          ],

          edgeIds: [
            ...current
              .edgeIds,

            edge.id,
          ],

          relationTypes: [
            ...current
              .relationTypes,

            edge.type,
          ],

          visited:
            nextVisited,
        })
      }
    }
  }

  return chains
    .sort(
      (
        first,
        second,
      ) =>
        second.length -
        first.length,
    )
    .slice(
      0,
      500,
    )
}

function buildDistribution(
  nodes:
    LearningGraphNode[],
  edges:
    LearningGraphEdge[],
): GraphAnalyticsDistribution {
  const nodeTypes =
    new Map<
      LearningGraphNodeType,
      number
    >()

  const relationTypes =
    new Map<
      LearningGraphRelationType,
      number
    >()

  const privacyLevels =
    new Map<
      string,
      number
    >()

  const temporalStatuses =
    new Map<
      string,
      number
    >()

  for (
    const node of nodes
  ) {
    nodeTypes.set(
      node.type,
      (
        nodeTypes.get(
          node.type,
        ) ??
        0
      ) + 1,
    )

    privacyLevels.set(
      node.privacy.level,
      (
        privacyLevels.get(
          node.privacy.level,
        ) ??
        0
      ) + 1,
    )

    temporalStatuses.set(
      node.time
        .temporalStatus,
      (
        temporalStatuses.get(
          node.time
            .temporalStatus,
        ) ??
        0
      ) + 1,
    )
  }

  for (
    const edge of edges
  ) {
    relationTypes.set(
      edge.type,
      (
        relationTypes.get(
          edge.type,
        ) ??
        0
      ) + 1,
    )
  }

  return {
    nodeTypes:
      Array.from(
        nodeTypes.entries(),
      )
        .map(
          (
            [
              type,
              count,
            ],
          ) => ({
            type,

            count,

            proportion:
              calculateProportion(
                count,
                nodes.length,
              ),
          }),
        )
        .sort(
          (
            first,
            second,
          ) =>
            second.count -
            first.count,
        ),

    relationTypes:
      Array.from(
        relationTypes.entries(),
      )
        .map(
          (
            [
              type,
              count,
            ],
          ) => ({
            type,

            count,

            proportion:
              calculateProportion(
                count,
                edges.length,
              ),
          }),
        )
        .sort(
          (
            first,
            second,
          ) =>
            second.count -
            first.count,
        ),

    privacyLevels:
      Array.from(
        privacyLevels.entries(),
      )
        .map(
          (
            [
              level,
              count,
            ],
          ) => ({
            level,

            count,

            proportion:
              calculateProportion(
                count,
                nodes.length,
              ),
          }),
        )
        .sort(
          (
            first,
            second,
          ) =>
            second.count -
            first.count,
        ),

    temporalStatuses:
      Array.from(
        temporalStatuses.entries(),
      )
        .map(
          (
            [
              status,
              count,
            ],
          ) => ({
            status,

            count,

            proportion:
              calculateProportion(
                count,
                nodes.length,
              ),
          }),
        )
        .sort(
          (
            first,
            second,
          ) =>
            second.count -
            first.count,
        ),
  }
}

function createEmptySummary({
  graph,
  generatedAt,
  warnings,
}: {
  graph:
    LearningGraphSnapshot

  generatedAt: string

  warnings: string[]
}): GraphAnalyticsSummary {
  return {
    graphId:
      graph.id,

    snapshotKey:
      graph.snapshotKey,

    nodeCount:
      0,

    edgeCount:
      0,

    componentCount:
      0,

    isolatedNodeCount:
      0,

    bridgeNodeCount:
      0,

    criticalNodeCount:
      0,

    influenceZoneCount:
      0,

    learningChainCount:
      0,

    density:
      null,

    averageDegree:
      null,

    averageConfidence:
      null,

    evidenceCoverage:
      null,

    explainabilityCoverage:
      null,

    humanValidationCoverage:
      null,

    researchEligibleNodeCount:
      0,

    researchEligibleEdgeCount:
      0,

    requiresHumanReview:
      warnings.length >
      0,

    warnings,

    generatedAt,
  }
}

export function analyzeLearningGraph(
  input:
    AnalyzeLearningGraphInput,
): GraphAnalyticsResult {
  const generatedAt =
    nowIso()

  try {
    const normalized =
      normalizeInput(
        input,
      )

    const nodes =
      getActiveNodes(
        normalized,
      )

    const validNodeIds =
      new Set(
        nodes.map(
          node =>
            node.id,
        ),
      )

    const edges =
      getActiveEdges(
        normalized,
        validNodeIds,
      )

    const warnings:
      string[] =
      []

    if (
      nodes.length ===
      0
    ) {
      warnings.push(
        'O snapshot não possui nós elegíveis para análise.',
      )

      return {
        success:
          true,

        graphId:
          normalized.graph.id,

        snapshotKey:
          normalized.graph
            .snapshotKey,

        summary:
          createEmptySummary({
            graph:
              normalized.graph,

            generatedAt,

            warnings,
          }),

        nodeMetrics:
          [],

        components:
          [],

        bridges:
          [],

        criticalNodes:
          [],

        influenceZones:
          [],

        learningChains:
          [],

        distribution:
          {
            nodeTypes:
              [],

            relationTypes:
              [],

            privacyLevels:
              [],

            temporalStatuses:
              [],
          },

        warnings,

        errors:
          [],

        engine: {
          name:
            ENGINE_NAME,

          version:
            ENGINE_VERSION,

          rulesetVersion:
            RULESET_VERSION,

          mode:
            'deterministic',

          generatedAt,

          metadata: {
            correlationId:
              normalized
                .correlationId,
          },
        },

        metadata: {
          ...normalized.metadata,

          emptyGraph:
            true,
        },
      }
    }

    const adjacency =
      createAdjacency(
        nodes,
        edges,
      )

    const neighbors =
      createUndirectedNeighborMap(
        adjacency,
      )

    const componentResult =
      calculateComponents(
        nodes,
        edges,
        adjacency,
      )

    const nodeIds =
      nodes.map(
        node =>
          node.id,
      )

    const closeness =
      normalized
        .calculateCloseness
        ? calculateCloseness(
            nodeIds,
            neighbors,
          )
        : new Map<
            string,
            number | null
          >()

    let betweenness =
      new Map<
        string,
        number
      >()

    if (
      normalized
        .calculateBetweenness
    ) {
      if (
        nodes.length <=
        normalized
          .maximumNodesForExactBetweenness
      ) {
        betweenness =
          calculateBetweenness(
            nodeIds,
            neighbors,
          )
      } else {
        warnings.push(
          'A centralidade de intermediação exata foi desativada porque o grafo excede o limite configurado.',
        )

        for (
          const nodeId of
            nodeIds
        ) {
          betweenness.set(
            nodeId,
            0,
          )
        }
      }
    }

    const nodeMetrics =
      buildNodeMetrics({
        nodes,

        edges,

        adjacency,

        componentLookup:
          componentResult.lookup,

        closeness,

        betweenness,
      })

    const nodeById =
      new Map(
        nodes.map(
          node => [
            node.id,
            node,
          ],
        ),
      )

    const edgeById =
      new Map(
        edges.map(
          edge => [
            edge.id,
            edge,
          ],
        ),
      )

    const bridges =
      identifyBridges(
        nodeMetrics,
        nodeById,
        normalized
          .minimumBridgeScore,
      )

    const criticalNodes =
      identifyCriticalNodes(
        nodeMetrics,
        normalized
          .minimumCriticalScore,
      )

    const influenceZones =
      normalized
        .calculateInfluenceZones
        ? buildInfluenceZones({
            nodeMetrics,

            nodeById,

            edgeById,

            adjacency,

            radius:
              normalized
                .influenceZoneRadius,

            minimumInfluenceScore:
              normalized
                .minimumInfluenceScore,
          })
        : []

    const learningChains =
      normalized
        .calculateLearningChains
        ? findLearningChains({
            nodes,

            edges,

            maximumDepth:
              normalized
                .maximumLearningChainDepth,
          })
        : []

    const distribution =
      buildDistribution(
        nodes,
        edges,
      )

    const possibleEdges =
      nodes.length > 1
        ? (
            nodes.length *
            (
              nodes.length -
              1
            )
          ) /
          2
        : 0

    const density =
      possibleEdges > 0
        ? Math.min(
            1,
            edges.length /
              possibleEdges,
          )
        : null

    const averageDegree =
      nodes.length > 0
        ? (
            edges.length * 2
          ) /
          nodes.length
        : null

    const evidenceCoverage =
      edges.length > 0
        ? edges.filter(
            edge =>
              edge.attributes
                .evidence.length >
              0,
          ).length /
          edges.length
        : null

    const explainabilityCoverage =
      (
        nodes.length +
        edges.length
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
            edges.filter(
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
            edges.length
          )
        : null

    const humanValidationCoverage =
      (
        nodes.length +
        edges.length
      ) >
      0
        ? (
            nodes.filter(
              node =>
                Boolean(
                  node.traceability
                    .reviewedBy,
                ),
            ).length +
            edges.filter(
              edge =>
                edge.attributes
                  .validatedByHuman,
            ).length
          ) /
          (
            nodes.length +
            edges.length
          )
        : null

    if (
      (
        evidenceCoverage ??
        0
      ) <
      0.5
    ) {
      warnings.push(
        'Menos da metade das relações possui evidências vinculadas.',
      )
    }

    if (
      (
        explainabilityCoverage ??
        0
      ) <
      0.5
    ) {
      warnings.push(
        'A cobertura de explicabilidade do grafo está abaixo de 50%.',
      )
    }

    if (
      edges.some(
        edge =>
          edge.attributes
            .inferredRelation &&
          !edge.attributes
            .validatedByHuman,
      )
    ) {
      warnings.push(
        'Existem relações inferidas que ainda não foram validadas por humano.',
      )
    }

    if (
      learningChains.some(
        chain =>
          chain.causalityWarning,
      )
    ) {
      warnings.push(
        'Algumas cadeias contêm relações correlacionais. Elas não devem ser interpretadas como causalidade.',
      )
    }

    const summary:
      GraphAnalyticsSummary = {
      graphId:
        normalized.graph.id,

      snapshotKey:
        normalized.graph
          .snapshotKey,

      nodeCount:
        nodes.length,

      edgeCount:
        edges.length,

      componentCount:
        componentResult
          .components.length,

      isolatedNodeCount:
        nodeMetrics.filter(
          metric =>
            metric.role ===
            'isolated',
        ).length,

      bridgeNodeCount:
        bridges.length,

      criticalNodeCount:
        criticalNodes.length,

      influenceZoneCount:
        influenceZones.length,

      learningChainCount:
        learningChains.length,

      density,

      averageDegree,

      averageConfidence:
        calculateAverage([
          ...nodes.map(
            node =>
              node.confidence
                .value,
          ),

          ...edges.map(
            edge =>
              edge.attributes
                .confidence.value,
          ),
        ]),

      evidenceCoverage,

      explainabilityCoverage,

      humanValidationCoverage,

      researchEligibleNodeCount:
        nodes.filter(
          node =>
            node
              .researchEligibility
              .eligible,
        ).length,

      researchEligibleEdgeCount:
        edges.filter(
          edge =>
            edge
              .researchEligibility
              .eligible,
        ).length,

      requiresHumanReview:
        warnings.length >
          0 ||
        criticalNodes.length >
          0 ||
        bridges.length >
          0,

      warnings:
        uniqueStrings(
          warnings,
        ),

      generatedAt,
    }

    return {
      success:
        true,

      graphId:
        normalized.graph.id,

      snapshotKey:
        normalized.graph
          .snapshotKey,

      summary,

      nodeMetrics,

      components:
        componentResult
          .components,

      bridges,

      criticalNodes,

      influenceZones,

      learningChains,

      distribution,

      warnings:
        summary.warnings,

      errors:
        [],

      engine: {
        name:
          ENGINE_NAME,

        version:
          ENGINE_VERSION,

        rulesetVersion:
          RULESET_VERSION,

        mode:
          'deterministic',

        generatedAt,

        metadata: {
          correlationId:
            normalized
              .correlationId,

          requestedByUserId:
            normalized
              .requestedByUserId,

          calculateBetweenness:
            normalized
              .calculateBetweenness,

          calculateCloseness:
            normalized
              .calculateCloseness,

          calculateInfluenceZones:
            normalized
              .calculateInfluenceZones,

          calculateLearningChains:
            normalized
              .calculateLearningChains,

          exactBetweenness:
            nodes.length <=
            normalized
              .maximumNodesForExactBetweenness,

          causalInference:
            false,
        },
      },

      metadata: {
        ...normalized.metadata,

        sourceGraphVersionId:
          normalized.graph
            .version.id,

        sourceGraphGeneratedAt:
          normalized.graph
            .generatedAt,

        analyzedNodeCount:
          nodes.length,

        analyzedEdgeCount:
          edges.length,

        architecture:
          'Framework EDI → EIOS → Core Compartilhado → Produtos Especializados',
      },
    }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Não foi possível analisar o Learning Graph.'

    const graph =
      input.graph

    const warnings:
      string[] =
      []

    return {
      success:
        false,

      graphId:
        graph?.id ??
        'unknown',

      snapshotKey:
        graph?.snapshotKey ??
        'unknown',

      summary:
        graph
          ? createEmptySummary({
              graph,

              generatedAt,

              warnings,
            })
          : {
              graphId:
                'unknown',

              snapshotKey:
                'unknown',

              nodeCount:
                0,

              edgeCount:
                0,

              componentCount:
                0,

              isolatedNodeCount:
                0,

              bridgeNodeCount:
                0,

              criticalNodeCount:
                0,

              influenceZoneCount:
                0,

              learningChainCount:
                0,

              density:
                null,

              averageDegree:
                null,

              averageConfidence:
                null,

              evidenceCoverage:
                null,

              explainabilityCoverage:
                null,

              humanValidationCoverage:
                null,

              researchEligibleNodeCount:
                0,

              researchEligibleEdgeCount:
                0,

              requiresHumanReview:
                false,

              warnings:
                [],

              generatedAt,
            },

      nodeMetrics:
        [],

      components:
        [],

      bridges:
        [],

      criticalNodes:
        [],

      influenceZones:
        [],

      learningChains:
        [],

      distribution: {
        nodeTypes:
          [],

        relationTypes:
          [],

        privacyLevels:
          [],

        temporalStatuses:
          [],
      },

      warnings:
        [],

      errors: [
        message,
      ],

      engine: {
        name:
          ENGINE_NAME,

        version:
          ENGINE_VERSION,

        rulesetVersion:
          RULESET_VERSION,

        mode:
          'deterministic',

        generatedAt,

        metadata: {
          failure:
            true,
        },
      },

      metadata: {
        stage:
          'graph_analytics_exception',
      },
    }
  }
}

export function getGraphAnalyticsEngineInfo() {
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
      'in_degree',
      'out_degree',
      'closeness_centrality',
      'betweenness_centrality',
      'influence_score',
      'connected_components',
      'isolated_nodes',
      'bridge_detection',
      'critical_node_detection',
      'influence_zones',
      'learning_chains',
      'node_type_distribution',
      'relation_type_distribution',
      'evidence_coverage',
      'explainability_coverage',
      'human_validation_coverage',
      'research_eligibility_summary',
    ],

    limitations: [
      'Não realiza inferência causal.',
      'Não interpreta centralidade como desempenho, mérito ou aprendizagem.',
      'Não substitui avaliação pedagógica humana.',
      'Não persiste resultados.',
      'Não executa detecção probabilística de comunidades.',
      'Não executa predição.',
      'A centralidade de intermediação exata possui limite configurável de nós.',
    ],
  }
}