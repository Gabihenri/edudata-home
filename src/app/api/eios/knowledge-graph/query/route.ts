import {
  NextRequest,
  NextResponse,
} from 'next/server'

import type {
  EducationalGraphEdge,
  EducationalGraphNode,
  EducationalGraphQuery,
  EducationalKnowledgeGraphContext,
} from '@/lib/eios/knowledge-graph/educational-knowledge-graph.contract'

import {
  queryEducationalKnowledgeGraph,
  validateEducationalKnowledgeGraph,
} from '@/lib/eios/knowledge-graph/educational-knowledge-graph.service'

export const dynamic =
  'force-dynamic'

export const runtime =
  'nodejs'

const NO_CACHE_HEADERS = {
  'Cache-Control':
    'no-store, no-cache, must-revalidate',
}

type KnowledgeGraphQueryRequestBody = {
  context?:
    unknown

  query?:
    unknown

  validateGraph?:
    unknown
}

function isRecord(
  value:
    unknown,
): value is Record<string, unknown> {
  return (
    typeof value ===
      'object' &&
    value !==
      null &&
    !Array.isArray(
      value,
    )
  )
}

function isString(
  value:
    unknown,
): value is string {
  return (
    typeof value ===
      'string'
  )
}

function isNullableString(
  value:
    unknown,
): value is string | null {
  return (
    value ===
      null ||
    isString(
      value,
    )
  )
}

function isBoolean(
  value:
    unknown,
): value is boolean {
  return (
    typeof value ===
      'boolean'
  )
}

function isNumber(
  value:
    unknown,
): value is number {
  return (
    typeof value ===
      'number' &&
    Number.isFinite(
      value,
    )
  )
}

function isNullableNumber(
  value:
    unknown,
): value is number | null {
  return (
    value ===
      null ||
    isNumber(
      value,
    )
  )
}

function isStringArray(
  value:
    unknown,
): value is string[] {
  return (
    Array.isArray(
      value,
    ) &&
    value.every(
      item =>
        typeof item ===
        'string',
    )
  )
}

function isEducationalGraphNode(
  value:
    unknown,
): value is EducationalGraphNode {
  if (
    !isRecord(
      value,
    )
  ) {
    return false
  }

  return (
    isString(
      value.id,
    ) &&
    isString(
      value.type,
    ) &&
    (
      value.semanticEntityType ===
        null ||
      isString(
        value.semanticEntityType,
      )
    ) &&
    isNullableString(
      value.canonicalEntityId,
    ) &&
    isString(
      value.label,
    ) &&
    isNullableString(
      value.description,
    ) &&
    isNullableString(
      value.organizationId,
    ) &&
    isNullableString(
      value.institutionId,
    ) &&
    isNullableString(
      value.campusId,
    ) &&
    isNullableString(
      value.programId,
    ) &&
    isNullableString(
      value.courseId,
    ) &&
    isNullableString(
      value.componentId,
    ) &&
    isNullableString(
      value.offeringId,
    ) &&
    isNullableString(
      value.classId,
    ) &&
    isNullableString(
      value.studentId,
    ) &&
    isNullableString(
      value.teacherId,
    ) &&
    isNullableString(
      value.curriculumNodeId,
    ) &&
    isNullableString(
      value.lessonId,
    ) &&
    isNullableString(
      value.assessmentId,
    ) &&
    isNullableString(
      value.evidenceId,
    ) &&
    isNullableString(
      value.interventionId,
    ) &&
    isNullableString(
      value.indicatorId,
    ) &&
    isNullableString(
      value.decisionId,
    ) &&
    isStringArray(
      value.modalities,
    ) &&
    (
      value.temporalContext ===
        null ||
      isRecord(
        value.temporalContext,
      )
    ) &&
    (
      value.spatialContext ===
        null ||
      isRecord(
        value.spatialContext,
      )
    ) &&
    Array.isArray(
      value.evidenceReferences,
    ) &&
    Array.isArray(
      value.externalReferences,
    ) &&
    isString(
      value.status,
    ) &&
    isString(
      value.visibility,
    ) &&
    isString(
      value.sensitivity,
    ) &&
    isBoolean(
      value.containsPersonalData,
    ) &&
    isBoolean(
      value.containsSensitiveData,
    ) &&
    isBoolean(
      value.active,
    ) &&
    isNullableString(
      value.version,
    ) &&
    isString(
      value.createdAt,
    ) &&
    isString(
      value.updatedAt,
    ) &&
    isNullableString(
      value.createdBy,
    ) &&
    isNullableString(
      value.updatedBy,
    ) &&
    isRecord(
      value.metadata,
    )
  )
}

function isEducationalGraphEdge(
  value:
    unknown,
): value is EducationalGraphEdge {
  if (
    !isRecord(
      value,
    )
  ) {
    return false
  }

  return (
    isString(
      value.id,
    ) &&
    isString(
      value.type,
    ) &&
    (
      value.semanticRelationType ===
        null ||
      isString(
        value.semanticRelationType,
      )
    ) &&
    isString(
      value.sourceNodeId,
    ) &&
    isString(
      value.targetNodeId,
    ) &&
    isBoolean(
      value.directed,
    ) &&
    isNullableString(
      value.label,
    ) &&
    isNullableString(
      value.description,
    ) &&
    isString(
      value.sourceType,
    ) &&
    (
      value.temporalRelation ===
        null ||
      isString(
        value.temporalRelation,
      )
    ) &&
    (
      value.temporalContext ===
        null ||
      isRecord(
        value.temporalContext,
      )
    ) &&
    (
      value.spatialContext ===
        null ||
      isRecord(
        value.spatialContext,
      )
    ) &&
    isRecord(
      value.metrics,
    ) &&
    Array.isArray(
      value.evidenceReferences,
    ) &&
    isNullableNumber(
      value.confidence,
    ) &&
    isString(
      value.confidenceLevel,
    ) &&
    isNullableString(
      value.explanation,
    ) &&
    isBoolean(
      value.inferred,
    ) &&
    isBoolean(
      value.verified,
    ) &&
    isNullableString(
      value.verifiedBy,
    ) &&
    isNullableString(
      value.verifiedAt,
    ) &&
    value.causalClaimAllowed ===
      false &&
    isBoolean(
      value.humanReviewRequired,
    ) &&
    isString(
      value.status,
    ) &&
    isBoolean(
      value.active,
    ) &&
    isNullableString(
      value.validFrom,
    ) &&
    isNullableString(
      value.validUntil,
    ) &&
    isString(
      value.createdAt,
    ) &&
    isString(
      value.updatedAt,
    ) &&
    isNullableString(
      value.createdBy,
    ) &&
    isRecord(
      value.metadata,
    )
  )
}

function isEducationalKnowledgeGraphContext(
  value:
    unknown,
): value is EducationalKnowledgeGraphContext {
  if (
    !isRecord(
      value,
    )
  ) {
    return false
  }

  return (
    isRecord(
      value.metadata,
    ) &&
    isString(
      value.graphId,
    ) &&
    isString(
      value.name,
    ) &&
    isNullableString(
      value.description,
    ) &&
    Array.isArray(
      value.nodes,
    ) &&
    value.nodes.every(
      isEducationalGraphNode,
    ) &&
    Array.isArray(
      value.edges,
    ) &&
    value.edges.every(
      isEducationalGraphEdge,
    ) &&
    Array.isArray(
      value.spatialZones,
    ) &&
    Array.isArray(
      value.seats,
    ) &&
    Array.isArray(
      value.positionSnapshots,
    ) &&
    Array.isArray(
      value.subgroups,
    ) &&
    Array.isArray(
      value.influenceZones,
    ) &&
    Array.isArray(
      value.heatmapCells,
    ) &&
    Array.isArray(
      value.temporalSnapshots,
    ) &&
    Array.isArray(
      value.correlations,
    )
  )
}

function isEducationalGraphQuery(
  value:
    unknown,
): value is EducationalGraphQuery {
  if (
    !isRecord(
      value,
    )
  ) {
    return false
  }

  return (
    isString(
      value.id,
    ) &&
    isStringArray(
      value.startNodeIds,
    ) &&
    isStringArray(
      value.nodeTypes,
    ) &&
    isStringArray(
      value.edgeTypes,
    ) &&
    isNumber(
      value.maximumDepth,
    ) &&
    Number.isInteger(
      value.maximumDepth,
    ) &&
    value.maximumDepth >=
      0 &&
    value.maximumDepth <=
      12 &&
    isNullableString(
      value.startsAt,
    ) &&
    isNullableString(
      value.endsAt,
    ) &&
    isNullableString(
      value.institutionId,
    ) &&
    isNullableString(
      value.classId,
    ) &&
    isNullableString(
      value.lessonId,
    ) &&
    isNullableString(
      value.componentId,
    ) &&
    isNullableString(
      value.curriculumNodeId,
    ) &&
    isBoolean(
      value.includeSpatialData,
    ) &&
    isBoolean(
      value.includeTemporalData,
    ) &&
    isBoolean(
      value.includeEvidence,
    ) &&
    isBoolean(
      value.includeInferredEdges,
    ) &&
    isNullableNumber(
      value.minimumConfidence,
    ) &&
    (
      value.minimumConfidence ===
        null ||
      (
        value.minimumConfidence >=
          0 &&
        value.minimumConfidence <=
          1
      )
    ) &&
    isRecord(
      value.metadata,
    )
  )
}

async function readRequestBody(
  request:
    NextRequest,
): Promise<KnowledgeGraphQueryRequestBody | null> {
  try {
    const body:
      unknown =
        await request.json()

    if (
      !isRecord(
        body,
      )
    ) {
      return null
    }

    return body
  } catch {
    return null
  }
}

function createErrorResponse({
  message,
  status,
  warnings = [],
}: {
  message:
    string

  status:
    number

  warnings?:
    string[]
}): NextResponse {
  return NextResponse.json(
    {
      success:
        false,

      nodes:
        [],

      edges:
        [],

      paths:
        [],

      warnings,

      errors: [
        message,
      ],

      requiresHumanReview:
        true,
    },
    {
      status,

      headers:
        NO_CACHE_HEADERS,
    },
  )
}

export async function POST(
  request:
    NextRequest,
): Promise<NextResponse> {
  const body =
    await readRequestBody(
      request,
    )

  if (!body) {
    return createErrorResponse({
      message:
        'O corpo da requisição deve conter um JSON válido.',

      status:
        400,
    })
  }

  if (
    !isEducationalKnowledgeGraphContext(
      body.context,
    )
  ) {
    return createErrorResponse({
      message:
        'O campo "context" deve conter um contexto válido do grafo educacional.',

      status:
        400,
    })
  }

  if (
    !isEducationalGraphQuery(
      body.query,
    )
  ) {
    return createErrorResponse({
      message:
        'O campo "query" deve conter uma consulta válida do grafo educacional.',

      status:
        400,
    })
  }

  const validateGraph =
    body.validateGraph ===
      undefined
      ? true
      : body.validateGraph

  if (
    typeof validateGraph !==
    'boolean'
  ) {
    return createErrorResponse({
      message:
        'O campo "validateGraph" deve ser booleano quando informado.',

      status:
        400,
    })
  }

  try {
    if (
      validateGraph
    ) {
      const validation =
        validateEducationalKnowledgeGraph(
          body.context,
        )

      if (
        !validation.valid
      ) {
        return NextResponse.json(
          {
            success:
              false,

            nodes:
              [],

            edges:
              [],

            paths:
              [],

            warnings:
              validation.warnings,

            errors:
              validation.errors,

            requiresHumanReview:
              true,

            validationIssues:
              validation.issues,
          },
          {
            status:
              422,

            headers:
              NO_CACHE_HEADERS,
          },
        )
      }
    }

    const result =
      queryEducationalKnowledgeGraph({
        context:
          body.context,

        query:
          body.query,
      })

    return NextResponse.json(
      result,
      {
        status:
          result.success
            ? 200
            : 422,

        headers:
          NO_CACHE_HEADERS,
      },
    )
  } catch (
    error
  ) {
    const message =
      error instanceof Error
        ? error.message
        : 'Erro interno ao consultar o grafo educacional.'

    console.error(
      '[EIOS_KNOWLEDGE_GRAPH_QUERY_ERROR]',
      {
        error:
          message,

        graphId:
          body.context.graphId,

        queryId:
          body.query.id,

        institutionId:
          body.query.institutionId,

        classId:
          body.query.classId,

        lessonId:
          body.query.lessonId,

        componentId:
          body.query.componentId,

        curriculumNodeId:
          body.query.curriculumNodeId,

        maximumDepth:
          body.query.maximumDepth,
      },
    )

    return createErrorResponse({
      message,

      status:
        500,
    })
  }
}