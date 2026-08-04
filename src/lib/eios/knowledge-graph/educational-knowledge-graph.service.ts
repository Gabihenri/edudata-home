import {
  clampEducationalGraphConfidence,
  type EducationalGraphConfidenceLevel,
  type EducationalGraphEdge,
  type EducationalGraphEdgeType,
  type EducationalGraphNode,
  type EducationalGraphNodeType,
  type EducationalGraphQuery,
  type EducationalGraphQueryPath,
  type EducationalGraphQueryResult,
  type EducationalKnowledgeGraphContext,
} from './educational-knowledge-graph.contract'

export type EducationalGraphValidationIssue = {
  code:
    | 'duplicate_node'
    | 'duplicate_edge'
    | 'missing_source_node'
    | 'missing_target_node'
    | 'self_reference'
    | 'invalid_temporal_interval'
    | 'invalid_spatial_consent'
    | 'invalid_confidence'
    | 'inactive_reference'

  severity:
    'warning'
    | 'error'

  entityType:
    'node'
    | 'edge'
    | 'graph'

  entityId:
    string | null

  message:
    string
}

export type EducationalGraphValidationResult = {
  valid:
    boolean

  issues:
    EducationalGraphValidationIssue[]

  errors:
    string[]

  warnings:
    string[]
}

export type EducationalGraphMutationResult = {
  success:
    boolean

  context:
    EducationalKnowledgeGraphContext

  errors:
    string[]

  warnings:
    string[]
}

export type EducationalGraphNeighbor = {
  node:
    EducationalGraphNode

  edges:
    EducationalGraphEdge[]

  direction:
    'incoming'
    | 'outgoing'
    | 'both'
}

export type EducationalGraphNeighborhoodResult = {
  success:
    boolean

  centerNode:
    EducationalGraphNode | null

  neighbors:
    EducationalGraphNeighbor[]

  errors:
    string[]

  warnings:
    string[]
}

type EducationalGraphIndex = {
  nodesById:
    Map<string, EducationalGraphNode>

  edgesById:
    Map<string, EducationalGraphEdge>

  outgoingEdgesByNodeId:
    Map<string, EducationalGraphEdge[]>

  incomingEdgesByNodeId:
    Map<string, EducationalGraphEdge[]>

  nodesByType:
    Map<EducationalGraphNodeType, EducationalGraphNode[]>

  edgesByType:
    Map<EducationalGraphEdgeType, EducationalGraphEdge[]>
}

function uniqueStrings(
  values:
    string[],
): string[] {
  return Array.from(
    new Set(
      values
        .map(value => value.trim())
        .filter(Boolean),
    ),
  )
}

function isValidDate(
  value:
    string | null,
): boolean {
  if (!value) {
    return true
  }

  return !Number.isNaN(
    Date.parse(value),
  )
}

function isValidInterval(
  startsAt:
    string | null,

  endsAt:
    string | null,
): boolean {
  if (
    !isValidDate(startsAt) ||
    !isValidDate(endsAt)
  ) {
    return false
  }

  if (
    !startsAt ||
    !endsAt
  ) {
    return true
  }

  return (
    Date.parse(startsAt) <=
    Date.parse(endsAt)
  )
}

function normalizeConfidence(
  value:
    number | null,
): number | null {
  if (
    value ===
    null
  ) {
    return null
  }

  return clampEducationalGraphConfidence(
    value,
  )
}

function confidenceLevelFromValue(
  confidence:
    number | null,
): EducationalGraphConfidenceLevel {
  if (
    confidence ===
    null
  ) {
    return 'unknown'
  }

  const normalized =
    clampEducationalGraphConfidence(
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

function cloneContext(
  context:
    EducationalKnowledgeGraphContext,
): EducationalKnowledgeGraphContext {
  return {
    ...context,

    metadata: {
      ...context.metadata,

      warnings: [
        ...context
          .metadata
          .warnings,
      ],
    },

    nodes: [
      ...context.nodes,
    ],

    edges: [
      ...context.edges,
    ],

    spatialZones: [
      ...context.spatialZones,
    ],

    seats: [
      ...context.seats,
    ],

    positionSnapshots: [
      ...context.positionSnapshots,
    ],

    subgroups: [
      ...context.subgroups,
    ],

    influenceZones: [
      ...context.influenceZones,
    ],

    heatmapCells: [
      ...context.heatmapCells,
    ],

    temporalSnapshots: [
      ...context.temporalSnapshots,
    ],

    correlations: [
      ...context.correlations,
    ],
  }
}

function buildGraphIndex(
  context:
    EducationalKnowledgeGraphContext,
): EducationalGraphIndex {
  const nodesById =
    new Map<
      string,
      EducationalGraphNode
    >()

  const edgesById =
    new Map<
      string,
      EducationalGraphEdge
    >()

  const outgoingEdgesByNodeId =
    new Map<
      string,
      EducationalGraphEdge[]
    >()

  const incomingEdgesByNodeId =
    new Map<
      string,
      EducationalGraphEdge[]
    >()

  const nodesByType =
    new Map<
      EducationalGraphNodeType,
      EducationalGraphNode[]
    >()

  const edgesByType =
    new Map<
      EducationalGraphEdgeType,
      EducationalGraphEdge[]
    >()

  for (
    const node
    of context.nodes
  ) {
    nodesById.set(
      node.id,
      node,
    )

    const typedNodes =
      nodesByType.get(
        node.type,
      ) ??
      []

    typedNodes.push(
      node,
    )

    nodesByType.set(
      node.type,
      typedNodes,
    )
  }

  for (
    const edge
    of context.edges
  ) {
    edgesById.set(
      edge.id,
      edge,
    )

    const outgoing =
      outgoingEdgesByNodeId.get(
        edge.sourceNodeId,
      ) ??
      []

    outgoing.push(
      edge,
    )

    outgoingEdgesByNodeId.set(
      edge.sourceNodeId,
      outgoing,
    )

    const incoming =
      incomingEdgesByNodeId.get(
        edge.targetNodeId,
      ) ??
      []

    incoming.push(
      edge,
    )

    incomingEdgesByNodeId.set(
      edge.targetNodeId,
      incoming,
    )

    const typedEdges =
      edgesByType.get(
        edge.type,
      ) ??
      []

    typedEdges.push(
      edge,
    )

    edgesByType.set(
      edge.type,
      typedEdges,
    )
  }

  return {
    nodesById,
    edgesById,
    outgoingEdgesByNodeId,
    incomingEdgesByNodeId,
    nodesByType,
    edgesByType,
  }
}

function validateNode(
  node:
    EducationalGraphNode,
): EducationalGraphValidationIssue[] {
  const issues:
    EducationalGraphValidationIssue[] =
      []

  if (
    !node.id.trim()
  ) {
    issues.push({
      code:
        'duplicate_node',

      severity:
        'error',

      entityType:
        'node',

      entityId:
        null,

      message:
        'O identificador do nó é obrigatório.',
    })
  }

  if (
    !node.label.trim()
  ) {
    issues.push({
      code:
        'inactive_reference',

      severity:
        'error',

      entityType:
        'node',

      entityId:
        node.id,

      message:
        'O rótulo do nó é obrigatório.',
    })
  }

  if (
    node.temporalContext &&
    !isValidInterval(
      node
        .temporalContext
        .startsAt,
      node
        .temporalContext
        .endsAt,
    )
  ) {
    issues.push({
      code:
        'invalid_temporal_interval',

      severity:
        'error',

      entityType:
        'node',

      entityId:
        node.id,

      message:
        'O intervalo temporal do nó é inválido.',
    })
  }

  if (
    node.spatialContext
      ?.consentRequired &&
    !node
      .spatialContext
      .consentConfirmed
  ) {
    issues.push({
      code:
        'invalid_spatial_consent',

      severity:
        'warning',

      entityType:
        'node',

      entityId:
        node.id,

      message:
        'O nó possui informação espacial que exige consentimento ainda não confirmado.',
    })
  }

  return issues
}

function validateEdge({
  edge,
  index,
}: {
  edge:
    EducationalGraphEdge

  index:
    EducationalGraphIndex
}): EducationalGraphValidationIssue[] {
  const issues:
    EducationalGraphValidationIssue[] =
      []

  const sourceNode =
    index.nodesById.get(
      edge.sourceNodeId,
    )

  const targetNode =
    index.nodesById.get(
      edge.targetNodeId,
    )

  if (!sourceNode) {
    issues.push({
      code:
        'missing_source_node',

      severity:
        'error',

      entityType:
        'edge',

      entityId:
        edge.id,

      message:
        `O nó de origem "${edge.sourceNodeId}" não existe no grafo.`,
    })
  }

  if (!targetNode) {
    issues.push({
      code:
        'missing_target_node',

      severity:
        'error',

      entityType:
        'edge',

      entityId:
        edge.id,

      message:
        `O nó de destino "${edge.targetNodeId}" não existe no grafo.`,
    })
  }

  if (
    edge.sourceNodeId ===
      edge.targetNodeId
  ) {
    issues.push({
      code:
        'self_reference',

      severity:
        'warning',

      entityType:
        'edge',

      entityId:
        edge.id,

      message:
        'A relação conecta o nó a ele mesmo e deve ser revisada.',
    })
  }

  if (
    edge.confidence !==
      null &&
    (
      edge.confidence <
        0 ||
      edge.confidence >
        1
    )
  ) {
    issues.push({
      code:
        'invalid_confidence',

      severity:
        'error',

      entityType:
        'edge',

      entityId:
        edge.id,

      message:
        'A confiança da relação deve estar entre 0 e 1.',
    })
  }

  if (
    !isValidInterval(
      edge.validFrom,
      edge.validUntil,
    )
  ) {
    issues.push({
      code:
        'invalid_temporal_interval',

      severity:
        'error',

      entityType:
        'edge',

      entityId:
        edge.id,

      message:
        'O intervalo de validade da relação é inválido.',
    })
  }

  if (
    edge.temporalContext &&
    !isValidInterval(
      edge
        .temporalContext
        .startsAt,
      edge
        .temporalContext
        .endsAt,
    )
  ) {
    issues.push({
      code:
        'invalid_temporal_interval',

      severity:
        'error',

      entityType:
        'edge',

      entityId:
        edge.id,

      message:
        'O intervalo temporal da relação é inválido.',
    })
  }

  if (
    sourceNode &&
    !sourceNode.active
  ) {
    issues.push({
      code:
        'inactive_reference',

      severity:
        'warning',

      entityType:
        'edge',

      entityId:
        edge.id,

      message:
        'O nó de origem da relação está inativo.',
    })
  }

  if (
    targetNode &&
    !targetNode.active
  ) {
    issues.push({
      code:
        'inactive_reference',

      severity:
        'warning',

      entityType:
        'edge',

      entityId:
        edge.id,

      message:
        'O nó de destino da relação está inativo.',
    })
  }

  return issues
}

export function validateEducationalKnowledgeGraph(
  context:
    EducationalKnowledgeGraphContext,
): EducationalGraphValidationResult {
  const issues:
    EducationalGraphValidationIssue[] =
      []

  const nodeIds =
    new Set<string>()

  const edgeIds =
    new Set<string>()

  for (
    const node
    of context.nodes
  ) {
    if (
      nodeIds.has(
        node.id,
      )
    ) {
      issues.push({
        code:
          'duplicate_node',

        severity:
          'error',

        entityType:
          'node',

        entityId:
          node.id,

        message:
          `O nó "${node.id}" está duplicado.`,
      })
    }

    nodeIds.add(
      node.id,
    )

    issues.push(
      ...validateNode(
        node,
      ),
    )
  }

  const index =
    buildGraphIndex(
      context,
    )

  for (
    const edge
    of context.edges
  ) {
    if (
      edgeIds.has(
        edge.id,
      )
    ) {
      issues.push({
        code:
          'duplicate_edge',

        severity:
          'error',

        entityType:
          'edge',

        entityId:
          edge.id,

        message:
          `A relação "${edge.id}" está duplicada.`,
      })
    }

    edgeIds.add(
      edge.id,
    )

    issues.push(
      ...validateEdge({
        edge,
        index,
      }),
    )
  }

  const errors =
    issues
      .filter(
        issue =>
          issue.severity ===
          'error',
      )
      .map(
        issue =>
          issue.message,
      )

  const warnings =
    issues
      .filter(
        issue =>
          issue.severity ===
          'warning',
      )
      .map(
        issue =>
          issue.message,
      )

  return {
    valid:
      errors.length ===
      0,

    issues,

    errors:
      uniqueStrings(
        errors,
      ),

    warnings:
      uniqueStrings(
        warnings,
      ),
  }
}

export function addEducationalGraphNode({
  context,
  node,
}: {
  context:
    EducationalKnowledgeGraphContext

  node:
    EducationalGraphNode
}): EducationalGraphMutationResult {
  const nextContext =
    cloneContext(
      context,
    )

  if (
    nextContext.nodes.some(
      currentNode =>
        currentNode.id ===
        node.id,
    )
  ) {
    return {
      success:
        false,

      context,

      errors: [
        `Já existe um nó com o identificador "${node.id}".`,
      ],

      warnings:
        [],
    }
  }

  const issues =
    validateNode(
      node,
    )

  const errors =
    issues
      .filter(
        issue =>
          issue.severity ===
          'error',
      )
      .map(
        issue =>
          issue.message,
      )

  const warnings =
    issues
      .filter(
        issue =>
          issue.severity ===
          'warning',
      )
      .map(
        issue =>
          issue.message,
      )

  if (
    errors.length >
    0
  ) {
    return {
      success:
        false,

      context,

      errors:
        uniqueStrings(
          errors,
        ),

      warnings:
        uniqueStrings(
          warnings,
        ),
    }
  }

  nextContext.nodes.push({
    ...node,

    updatedAt:
      new Date()
        .toISOString(),
  })

  nextContext.metadata = {
    ...nextContext.metadata,

    generatedAt:
      new Date()
        .toISOString(),

    containsPersonalData:
      nextContext
        .metadata
        .containsPersonalData ||
      node.containsPersonalData,

    containsSensitiveData:
      nextContext
        .metadata
        .containsSensitiveData ||
      node.containsSensitiveData,

    anonymizationRequired:
      nextContext
        .metadata
        .anonymizationRequired ||
      node.containsPersonalData ||
      node.containsSensitiveData,

    warnings:
      uniqueStrings([
        ...nextContext
          .metadata
          .warnings,
        ...warnings,
      ]),
  }

  return {
    success:
      true,

    context:
      nextContext,

    errors:
      [],

    warnings:
      uniqueStrings(
        warnings,
      ),
  }
}

export function updateEducationalGraphNode({
  context,
  node,
}: {
  context:
    EducationalKnowledgeGraphContext

  node:
    EducationalGraphNode
}): EducationalGraphMutationResult {
  const nextContext =
    cloneContext(
      context,
    )

  const nodeIndex =
    nextContext.nodes.findIndex(
      currentNode =>
        currentNode.id ===
        node.id,
    )

  if (
    nodeIndex <
    0
  ) {
    return {
      success:
        false,

      context,

      errors: [
        `O nó "${node.id}" não foi encontrado.`,
      ],

      warnings:
        [],
    }
  }

  const issues =
    validateNode(
      node,
    )

  const errors =
    issues
      .filter(
        issue =>
          issue.severity ===
          'error',
      )
      .map(
        issue =>
          issue.message,
      )

  const warnings =
    issues
      .filter(
        issue =>
          issue.severity ===
          'warning',
      )
      .map(
        issue =>
          issue.message,
      )

  if (
    errors.length >
    0
  ) {
    return {
      success:
        false,

      context,

      errors:
        uniqueStrings(
          errors,
        ),

      warnings:
        uniqueStrings(
          warnings,
        ),
    }
  }

  nextContext.nodes[
    nodeIndex
  ] = {
    ...node,

    updatedAt:
      new Date()
        .toISOString(),
  }

  nextContext.metadata = {
    ...nextContext.metadata,

    generatedAt:
      new Date()
        .toISOString(),

    warnings:
      uniqueStrings([
        ...nextContext
          .metadata
          .warnings,
        ...warnings,
      ]),
  }

  return {
    success:
      true,

    context:
      nextContext,

    errors:
      [],

    warnings:
      uniqueStrings(
        warnings,
      ),
  }
}

export function removeEducationalGraphNode({
  context,
  nodeId,
  removeConnectedEdges = false,
}: {
  context:
    EducationalKnowledgeGraphContext

  nodeId:
    string

  removeConnectedEdges?:
    boolean
}): EducationalGraphMutationResult {
  const nodeExists =
    context.nodes.some(
      node =>
        node.id ===
        nodeId,
    )

  if (!nodeExists) {
    return {
      success:
        false,

      context,

      errors: [
        `O nó "${nodeId}" não foi encontrado.`,
      ],

      warnings:
        [],
    }
  }

  const connectedEdges =
    context.edges.filter(
      edge =>
        edge.sourceNodeId ===
          nodeId ||
        edge.targetNodeId ===
          nodeId,
    )

  if (
    connectedEdges.length >
      0 &&
    !removeConnectedEdges
  ) {
    return {
      success:
        false,

      context,

      errors: [
        `O nó "${nodeId}" possui ${connectedEdges.length} relação(ões) conectada(s).`,
      ],

      warnings: [
        'Remova as relações antes de excluir o nó ou autorize a exclusão em cascata.',
      ],
    }
  }

  const nextContext =
    cloneContext(
      context,
    )

  nextContext.nodes =
    nextContext.nodes.filter(
      node =>
        node.id !==
        nodeId,
    )

  if (
    removeConnectedEdges
  ) {
    nextContext.edges =
      nextContext.edges.filter(
        edge =>
          edge.sourceNodeId !==
            nodeId &&
          edge.targetNodeId !==
            nodeId,
      )
  }

  nextContext.metadata = {
    ...nextContext.metadata,

    generatedAt:
      new Date()
        .toISOString(),
  }

  return {
    success:
      true,

    context:
      nextContext,

    errors:
      [],

    warnings:
      connectedEdges.length >
        0
        ? [
            `${connectedEdges.length} relação(ões) conectada(s) foram removidas junto com o nó.`,
          ]
        : [],
  }
}

export function addEducationalGraphEdge({
  context,
  edge,
}: {
  context:
    EducationalKnowledgeGraphContext

  edge:
    EducationalGraphEdge
}): EducationalGraphMutationResult {
  if (
    context.edges.some(
      currentEdge =>
        currentEdge.id ===
        edge.id,
    )
  ) {
    return {
      success:
        false,

      context,

      errors: [
        `Já existe uma relação com o identificador "${edge.id}".`,
      ],

      warnings:
        [],
    }
  }

  const index =
    buildGraphIndex(
      context,
    )

  const normalizedEdge:
    EducationalGraphEdge = {
    ...edge,

    confidence:
      normalizeConfidence(
        edge.confidence,
      ),

    confidenceLevel:
      confidenceLevelFromValue(
        edge.confidence,
      ),

    causalClaimAllowed:
      false,

    updatedAt:
      new Date()
        .toISOString(),
  }

  const issues =
    validateEdge({
      edge:
        normalizedEdge,

      index,
    })

  const errors =
    issues
      .filter(
        issue =>
          issue.severity ===
          'error',
      )
      .map(
        issue =>
          issue.message,
      )

  const warnings =
    issues
      .filter(
        issue =>
          issue.severity ===
          'warning',
      )
      .map(
        issue =>
          issue.message,
      )

  if (
    errors.length >
    0
  ) {
    return {
      success:
        false,

      context,

      errors:
        uniqueStrings(
          errors,
        ),

      warnings:
        uniqueStrings(
          warnings,
        ),
    }
  }

  const nextContext =
    cloneContext(
      context,
    )

  nextContext.edges.push(
    normalizedEdge,
  )

  nextContext.metadata = {
    ...nextContext.metadata,

    generatedAt:
      new Date()
        .toISOString(),

    humanReviewRequired:
      nextContext
        .metadata
        .humanReviewRequired ||
      normalizedEdge
        .humanReviewRequired ||
      normalizedEdge
        .inferred,

    warnings:
      uniqueStrings([
        ...nextContext
          .metadata
          .warnings,
        ...warnings,
      ]),
  }

  return {
    success:
      true,

    context:
      nextContext,

    errors:
      [],

    warnings:
      uniqueStrings(
        warnings,
      ),
  }
}

export function updateEducationalGraphEdge({
  context,
  edge,
}: {
  context:
    EducationalKnowledgeGraphContext

  edge:
    EducationalGraphEdge
}): EducationalGraphMutationResult {
  const edgeIndex =
    context.edges.findIndex(
      currentEdge =>
        currentEdge.id ===
        edge.id,
    )

  if (
    edgeIndex <
    0
  ) {
    return {
      success:
        false,

      context,

      errors: [
        `A relação "${edge.id}" não foi encontrada.`,
      ],

      warnings:
        [],
    }
  }

  const normalizedEdge:
    EducationalGraphEdge = {
    ...edge,

    confidence:
      normalizeConfidence(
        edge.confidence,
      ),

    confidenceLevel:
      confidenceLevelFromValue(
        edge.confidence,
      ),

    causalClaimAllowed:
      false,

    updatedAt:
      new Date()
        .toISOString(),
  }

  const index =
    buildGraphIndex(
      context,
    )

  const issues =
    validateEdge({
      edge:
        normalizedEdge,

      index,
    })

  const errors =
    issues
      .filter(
        issue =>
          issue.severity ===
          'error',
      )
      .map(
        issue =>
          issue.message,
      )

  const warnings =
    issues
      .filter(
        issue =>
          issue.severity ===
          'warning',
      )
      .map(
        issue =>
          issue.message,
      )

  if (
    errors.length >
    0
  ) {
    return {
      success:
        false,

      context,

      errors:
        uniqueStrings(
          errors,
        ),

      warnings:
        uniqueStrings(
          warnings,
        ),
    }
  }

  const nextContext =
    cloneContext(
      context,
    )

  nextContext.edges[
    edgeIndex
  ] = normalizedEdge

  nextContext.metadata = {
    ...nextContext.metadata,

    generatedAt:
      new Date()
        .toISOString(),

    humanReviewRequired:
      nextContext
        .metadata
        .humanReviewRequired ||
      normalizedEdge
        .humanReviewRequired ||
      normalizedEdge
        .inferred,
  }

  return {
    success:
      true,

    context:
      nextContext,

    errors:
      [],

    warnings:
      uniqueStrings(
        warnings,
      ),
  }
}

export function removeEducationalGraphEdge({
  context,
  edgeId,
}: {
  context:
    EducationalKnowledgeGraphContext

  edgeId:
    string
}): EducationalGraphMutationResult {
  const edgeExists =
    context.edges.some(
      edge =>
        edge.id ===
        edgeId,
    )

  if (!edgeExists) {
    return {
      success:
        false,

      context,

      errors: [
        `A relação "${edgeId}" não foi encontrada.`,
      ],

      warnings:
        [],
    }
  }

  const nextContext =
    cloneContext(
      context,
    )

  nextContext.edges =
    nextContext.edges.filter(
      edge =>
        edge.id !==
        edgeId,
    )

  nextContext.metadata = {
    ...nextContext.metadata,

    generatedAt:
      new Date()
        .toISOString(),
  }

  return {
    success:
      true,

    context:
      nextContext,

    errors:
      [],

    warnings:
      [],
  }
}

export function getEducationalGraphNeighborhood({
  context,
  nodeId,
  edgeTypes,
  direction = 'both',
  includeInactive = false,
}: {
  context:
    EducationalKnowledgeGraphContext

  nodeId:
    string

  edgeTypes?:
    EducationalGraphEdgeType[]

  direction?:
    'incoming'
    | 'outgoing'
    | 'both'

  includeInactive?:
    boolean
}): EducationalGraphNeighborhoodResult {
  const index =
    buildGraphIndex(
      context,
    )

  const centerNode =
    index.nodesById.get(
      nodeId,
    ) ??
    null

  if (!centerNode) {
    return {
      success:
        false,

      centerNode:
        null,

      neighbors:
        [],

      errors: [
        `O nó "${nodeId}" não foi encontrado.`,
      ],

      warnings:
        [],
    }
  }

  const outgoingEdges =
    direction ===
      'incoming'
      ? []
      : index
          .outgoingEdgesByNodeId
          .get(
            nodeId,
          ) ??
        []

  const incomingEdges =
    direction ===
      'outgoing'
      ? []
      : index
          .incomingEdgesByNodeId
          .get(
            nodeId,
          ) ??
        []

  const selectedEdges = [
    ...outgoingEdges,
    ...incomingEdges,
  ].filter(
    edge =>
      (
        !edgeTypes ||
        edgeTypes.length ===
          0 ||
        edgeTypes.includes(
          edge.type,
        )
      ) &&
      (
        includeInactive ||
        edge.active
      ),
  )

  const neighborMap =
    new Map<
      string,
      EducationalGraphNeighbor
    >()

  for (
    const edge
    of selectedEdges
  ) {
    const outgoing =
      edge.sourceNodeId ===
      nodeId

    const neighborNodeId =
      outgoing
        ? edge.targetNodeId
        : edge.sourceNodeId

    const neighborNode =
      index.nodesById.get(
        neighborNodeId,
      )

    if (
      !neighborNode ||
      (
        !includeInactive &&
        !neighborNode.active
      )
    ) {
      continue
    }

    const current =
      neighborMap.get(
        neighborNodeId,
      )

    if (current) {
      current.edges.push(
        edge,
      )

      current.direction =
        current.direction ===
        (
          outgoing
            ? 'outgoing'
            : 'incoming'
        )
          ? current.direction
          : 'both'

      continue
    }

    neighborMap.set(
      neighborNodeId,
      {
        node:
          neighborNode,

        edges: [
          edge,
        ],

        direction:
          outgoing
            ? 'outgoing'
            : 'incoming',
      },
    )
  }

  return {
    success:
      true,

    centerNode,

    neighbors:
      Array.from(
        neighborMap.values(),
      ),

    errors:
      [],

    warnings:
      [],
  }
}

function buildPath({
  targetNodeId,
  parentNodeByNodeId,
  parentEdgeByNodeId,
}: {
  targetNodeId:
    string

  parentNodeByNodeId:
    Map<string, string | null>

  parentEdgeByNodeId:
    Map<string, string>
}): EducationalGraphQueryPath {
  const nodeIds:
    string[] = []

  const edgeIds:
    string[] = []

  let currentNodeId:
    string | null =
      targetNodeId

  while (
    currentNodeId
  ) {
    nodeIds.push(
      currentNodeId,
    )

    const parentNodeId =
      parentNodeByNodeId.get(
        currentNodeId,
      ) ??
      null

    const parentEdgeId =
      parentEdgeByNodeId.get(
        currentNodeId,
      )

    if (
      parentEdgeId
    ) {
      edgeIds.push(
        parentEdgeId,
      )
    }

    currentNodeId =
      parentNodeId
  }

  nodeIds.reverse()
  edgeIds.reverse()

  return {
    nodeIds,
    edgeIds,

    depth:
      edgeIds.length,

    confidence:
      null,

    explanation:
      'Caminho encontrado por busca em largura no grafo educacional.',
  }
}

export function queryEducationalKnowledgeGraph({
  context,
  query,
}: {
  context:
    EducationalKnowledgeGraphContext

  query:
    EducationalGraphQuery
}): EducationalGraphQueryResult {
  const index =
    buildGraphIndex(
      context,
    )

  const warnings:
    string[] = []

  const errors:
    string[] = []

  const selectedNodeIds =
    new Set<string>()

  const selectedEdgeIds =
    new Set<string>()

  const paths:
    EducationalGraphQueryPath[] =
      []

  const maximumDepth =
    Math.max(
      0,
      Math.min(
        query.maximumDepth,
        12,
      ),
    )

  for (
    const startNodeId
    of query.startNodeIds
  ) {
    if (
      !index.nodesById.has(
        startNodeId,
      )
    ) {
      warnings.push(
        `O nó inicial "${startNodeId}" não foi encontrado.`,
      )

      continue
    }

    const queue:
      Array<{
        nodeId:
          string

        depth:
          number
      }> = [
      {
        nodeId:
          startNodeId,

        depth:
          0,
      },
    ]

    const visited =
      new Set<string>([
        startNodeId,
      ])

    const parentNodeByNodeId =
      new Map<
        string,
        string | null
      >([
        [
          startNodeId,
          null,
        ],
      ])

    const parentEdgeByNodeId =
      new Map<
        string,
        string
      >()

    while (
      queue.length >
      0
    ) {
      const current =
        queue.shift()

      if (!current) {
        break
      }

      const currentNode =
        index.nodesById.get(
          current.nodeId,
        )

      if (!currentNode) {
        continue
      }

      const nodeMatches =
        (
          query.nodeTypes.length ===
            0 ||
          query.nodeTypes.includes(
            currentNode.type,
          )
        ) &&
        (
          !query.institutionId ||
          currentNode.institutionId ===
            query.institutionId
        ) &&
        (
          !query.classId ||
          currentNode.classId ===
            query.classId
        ) &&
        (
          !query.lessonId ||
          currentNode.lessonId ===
            query.lessonId
        ) &&
        (
          !query.componentId ||
          currentNode.componentId ===
            query.componentId
        ) &&
        (
          !query.curriculumNodeId ||
          currentNode.curriculumNodeId ===
            query.curriculumNodeId
        )

      if (
        nodeMatches
      ) {
        selectedNodeIds.add(
          currentNode.id,
        )

        if (
          current.depth >
          0
        ) {
          paths.push(
            buildPath({
              targetNodeId:
                currentNode.id,

              parentNodeByNodeId,

              parentEdgeByNodeId,
            }),
          )
        }
      }

      if (
        current.depth >=
        maximumDepth
      ) {
        continue
      }

      const outgoingEdges =
        index
          .outgoingEdgesByNodeId
          .get(
            current.nodeId,
          ) ??
        []

      const incomingEdges =
        index
          .incomingEdgesByNodeId
          .get(
            current.nodeId,
          ) ??
        []

      const candidateEdges = [
        ...outgoingEdges,
        ...incomingEdges,
      ]

      for (
        const edge
        of candidateEdges
      ) {
        if (
          !edge.active
        ) {
          continue
        }

        if (
          !query
            .includeInferredEdges &&
          edge.inferred
        ) {
          continue
        }

        if (
          query.edgeTypes.length >
            0 &&
          !query.edgeTypes.includes(
            edge.type,
          )
        ) {
          continue
        }

        if (
          query.minimumConfidence !==
            null &&
          (
            edge.confidence ===
              null ||
            edge.confidence <
              query.minimumConfidence
          )
        ) {
          continue
        }

        const nextNodeId =
          edge.sourceNodeId ===
          current.nodeId
            ? edge.targetNodeId
            : edge.sourceNodeId

        selectedEdgeIds.add(
          edge.id,
        )

        if (
          visited.has(
            nextNodeId,
          )
        ) {
          continue
        }

        visited.add(
          nextNodeId,
        )

        parentNodeByNodeId.set(
          nextNodeId,
          current.nodeId,
        )

        parentEdgeByNodeId.set(
          nextNodeId,
          edge.id,
        )

        queue.push({
          nodeId:
            nextNodeId,

          depth:
            current.depth +
            1,
        })
      }
    }
  }

  const nodes =
    Array.from(
      selectedNodeIds,
    )
      .map(
        nodeId =>
          index.nodesById.get(
            nodeId,
          ),
      )
      .filter(
        (
          node,
        ): node is EducationalGraphNode =>
          Boolean(node),
      )

  const edges =
    Array.from(
      selectedEdgeIds,
    )
      .map(
        edgeId =>
          index.edgesById.get(
            edgeId,
          ),
      )
      .filter(
        (
          edge,
        ): edge is EducationalGraphEdge =>
          Boolean(edge),
      )

  if (
    nodes.length ===
    0
  ) {
    warnings.push(
      'A consulta não encontrou nós compatíveis com os filtros informados.',
    )
  }

  const requiresHumanReview =
    edges.some(
      edge =>
        edge
          .humanReviewRequired ||
        edge.inferred ||
        edge.confidenceLevel ===
          'low' ||
        edge.confidenceLevel ===
          'unknown',
    )

  return {
    success:
      errors.length ===
      0,

    nodes,
    edges,
    paths,

    warnings:
      uniqueStrings(
        warnings,
      ),

    errors:
      uniqueStrings(
        errors,
      ),

    requiresHumanReview,
  }
}

export function getEducationalGraphNodesByType({
  context,
  type,
  includeInactive = false,
}: {
  context:
    EducationalKnowledgeGraphContext

  type:
    EducationalGraphNodeType

  includeInactive?:
    boolean
}): EducationalGraphNode[] {
  const index =
    buildGraphIndex(
      context,
    )

  return (
    index.nodesByType.get(
      type,
    ) ??
    []
  ).filter(
    node =>
      includeInactive ||
      node.active,
  )
}

export function getEducationalGraphEdgesByType({
  context,
  type,
  includeInactive = false,
}: {
  context:
    EducationalKnowledgeGraphContext

  type:
    EducationalGraphEdgeType

  includeInactive?:
    boolean
}): EducationalGraphEdge[] {
  const index =
    buildGraphIndex(
      context,
    )

  return (
    index.edgesByType.get(
      type,
    ) ??
    []
  ).filter(
    edge =>
      includeInactive ||
      edge.active,
  )
}

export const educationalKnowledgeGraphService = {
  validate:
    validateEducationalKnowledgeGraph,

  addNode:
    addEducationalGraphNode,

  updateNode:
    updateEducationalGraphNode,

  removeNode:
    removeEducationalGraphNode,

  addEdge:
    addEducationalGraphEdge,

  updateEdge:
    updateEducationalGraphEdge,

  removeEdge:
    removeEducationalGraphEdge,

  getNeighborhood:
    getEducationalGraphNeighborhood,

  query:
    queryEducationalKnowledgeGraph,

  getNodesByType:
    getEducationalGraphNodesByType,

  getEdgesByType:
    getEducationalGraphEdgesByType,

  getConfidenceLevel:
    confidenceLevelFromValue,
}