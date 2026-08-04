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
    currentNodeId !==
    null
  ) {
    nodeIds.push(
      currentNodeId,
    )

    const parentNodeId:
      string | null =
        parentNodeByNodeId.get(
          currentNodeId,
        ) ??
        null

    const parentEdgeId:
      string | undefined =
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