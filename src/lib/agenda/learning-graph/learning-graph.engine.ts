/**
 * EduData IA — EIOS
 * Capability 03: Learning Graph
 *
 * Motor determinístico do grafo educacional.
 *
 * Responsabilidades:
 * - validar nós e relações;
 * - normalizar identificadores;
 * - impedir duplicações;
 * - verificar integridade referencial;
 * - identificar nós isolados;
 * - calcular componentes conectados;
 * - calcular métricas estruturais;
 * - construir snapshot versionado;
 * - preservar explicabilidade, privacidade e rastreabilidade;
 * - impedir interpretação automática de correlação como causalidade.
 *
 * Este motor:
 * - não acessa banco de dados;
 * - não contém interface;
 * - não substitui os registros operacionais;
 * - não cria relações inferidas sem autorização explícita;
 * - não toma decisões pedagógicas automaticamente.
 */

import type {
  BuildLearningGraphInput,
  LearningGraphBuildResult,
  LearningGraphConfidenceLevel,
  LearningGraphContext,
  LearningGraphEdge,
  LearningGraphEdgeInput,
  LearningGraphMetrics,
  LearningGraphNode,
  LearningGraphNodeInput,
  LearningGraphRelationType,
  LearningGraphSnapshot,
  LearningGraphValidationIssue,
  LearningGraphValidationResult,
  LearningGraphVersion,
} from './learning-graph.types'

const ENGINE_NAME =
  'eios-learning-graph-engine'

const ENGINE_VERSION =
  '1.0.0'

const RULESET_VERSION =
  'learning-graph-ruleset-1.0.0'

const DEFAULT_MAXIMUM_NODES =
  50_000

const DEFAULT_MAXIMUM_EDGES =
  200_000

const NON_CAUSAL_RELATIONS:
  LearningGraphRelationType[] = [
    'correlates_with',
    'associated_with',
    'similar_to',
    'forms_group_with',
    'aggregated_from',
  ]

type NormalizedLearningGraphInput = {
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

  requestedByUserId:
    string | null

  correlationId: string

  causationId:
    string | null

  requestId:
    string | null

  sessionId:
    string | null

  traceId:
    string | null

  sourceEventId:
    string | null

  metadata:
    Record<string, unknown>
}

type GraphAdjacency = Map<
  string,
  Set<string>
>

function nowIso(): string {
  return new Date()
    .toISOString()
}

function normalizeRequiredText(
  value:
    string | null | undefined,
  fieldName:
    string,
): string {
  const normalized =
    value?.trim()

  if (!normalized) {
    throw new Error(
      `${fieldName} é obrigatório.`,
    )
  }

  return normalized
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

function normalizeIdentifier(
  value:
    string | null | undefined,
  fieldName:
    string,
): string {
  const normalized =
    normalizeRequiredText(
      value,
      fieldName,
    )

  if (
    normalized.length > 240
  ) {
    throw new Error(
      `${fieldName} excede o limite permitido.`,
    )
  }

  return normalized
}

function normalizeStringList(
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

function normalizeScore(
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

function normalizeInferenceThreshold(
  value:
    number,
): number {
  if (!Number.isFinite(value)) {
    return 0.75
  }

  return Math.min(
    1,
    Math.max(
      0,
      value,
    ),
  )
}

function stableHash(
  value:
    string,
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

function normalizeDateTime(
  value:
    string | null | undefined,
  fallback:
    string,
): string {
  if (
    !value ||
    Number.isNaN(
      Date.parse(value),
    )
  ) {
    return fallback
  }

  return new Date(value)
    .toISOString()
}

function normalizeNullableDateTime(
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

function confidenceLevelFromScore(
  value:
    number | null,
): LearningGraphConfidenceLevel {
  if (value === null) {
    return 'undetermined'
  }

  if (value >= 0.9) {
    return 'very_high'
  }

  if (value >= 0.75) {
    return 'high'
  }

  if (value >= 0.5) {
    return 'moderate'
  }

  if (value >= 0.25) {
    return 'low'
  }

  return 'very_low'
}

function createIssue({
  code,
  severity,
  message,
  field = null,
  nodeId = null,
  edgeId = null,
  relatedEntityIds = [],
  requiresHumanReview = false,
  metadata = {},
}: {
  code: string

  severity:
    LearningGraphValidationIssue[
      'severity'
    ]

  message: string

  field?: string | null

  nodeId?: string | null

  edgeId?: string | null

  relatedEntityIds?: string[]

  requiresHumanReview?: boolean

  metadata?:
    Record<string, unknown>
}): LearningGraphValidationIssue {
  return {
    code,

    severity,

    message,

    field,

    nodeId,

    edgeId,

    relatedEntityIds:
      normalizeStringList(
        relatedEntityIds,
      ),

    requiresHumanReview,

    metadata,
  }
}

function normalizeContext(
  context:
    LearningGraphContext,
): LearningGraphContext {
  return {
    ...context,

    graphId:
      normalizeIdentifier(
        context.graphId,
        'ID do grafo',
      ),

    graphKey:
      normalizeIdentifier(
        context.graphKey,
        'Chave do grafo',
      ),

    title:
      normalizeRequiredText(
        context.title,
        'Título do grafo',
      ),

    description:
      normalizeOptionalText(
        context.description,
      ),

    organizationId:
      normalizeOptionalText(
        context.organizationId,
      ),

    schoolId:
      normalizeOptionalText(
        context.schoolId,
      ),

    ownerUserId:
      normalizeOptionalText(
        context.ownerUserId,
      ),

    academicPeriodIds:
      normalizeStringList(
        context.academicPeriodIds,
      ),

    classIds:
      normalizeStringList(
        context.classIds,
      ),

    nodeTypes:
      Array.from(
        new Set(
          context.nodeTypes,
        ),
      ),

    relationTypes:
      Array.from(
        new Set(
          context.relationTypes,
        ),
      ),

    privacy: {
      ...context.privacy,

      accessRestrictions:
        normalizeStringList(
          context.privacy
            .accessRestrictions,
        ),

      prohibitedUses:
        normalizeStringList(
          context.privacy
            .prohibitedUses,
        ),

      notes:
        normalizeOptionalText(
          context.privacy.notes,
        ),
    },

    metadata: {
      ...context.metadata,
    },
  }
}

function normalizeNodeInput(
  input:
    LearningGraphNodeInput,
  generatedAt:
    string,
): LearningGraphNodeInput {
  const nodeKey =
    normalizeIdentifier(
      input.nodeKey,
      'Chave do nó',
    )

  const sourceEntityId =
    normalizeIdentifier(
      input.sourceEntity
        .entityId,
      'ID da entidade de origem',
    )

  return {
    ...input,

    nodeKey,

    subtype:
      normalizeOptionalText(
        input.subtype,
      ),

    sourceEntity: {
      ...input.sourceEntity,

      entityId:
        sourceEntityId,

      graphNodeId:
        normalizeOptionalText(
          input.sourceEntity
            .graphNodeId,
        ),

      label:
        normalizeOptionalText(
          input.sourceEntity
            .label,
        ),

      sourceSystem:
        normalizeOptionalText(
          input.sourceEntity
            .sourceSystem,
        ),

      organizationId:
        normalizeOptionalText(
          input.sourceEntity
            .organizationId,
        ),

      schoolId:
        normalizeOptionalText(
          input.sourceEntity
            .schoolId,
        ),

      metadata: {
        ...(
          input.sourceEntity
            .metadata ??
          {}
        ),
      },
    },

    attributes: {
      ...input.attributes,

      title:
        normalizeRequiredText(
          input.attributes.title,
          'Título do nó',
        ),

      description:
        normalizeOptionalText(
          input.attributes
            .description,
        ),

      tags:
        normalizeStringList(
          input.attributes.tags,
        ),

      organizationId:
        normalizeOptionalText(
          input.attributes
            .organizationId,
        ),

      schoolId:
        normalizeOptionalText(
          input.attributes
            .schoolId,
        ),

      ownerUserId:
        normalizeOptionalText(
          input.attributes
            .ownerUserId,
        ),

      classIds:
        normalizeStringList(
          input.attributes
            .classIds,
        ),

      groupIds:
        normalizeStringList(
          input.attributes
            .groupIds,
        ),

      planningIds:
        normalizeStringList(
          input.attributes
            .planningIds,
        ),

      lessonIds:
        normalizeStringList(
          input.attributes
            .lessonIds,
        ),

      learningObjectiveIds:
        normalizeStringList(
          input.attributes
            .learningObjectiveIds,
        ),

      skillIds:
        normalizeStringList(
          input.attributes
            .skillIds,
        ),

      competencyIds:
        normalizeStringList(
          input.attributes
            .competencyIds,
        ),

      curriculumReferenceIds:
        normalizeStringList(
          input.attributes
            .curriculumReferenceIds,
        ),

      evidenceIds:
        normalizeStringList(
          input.attributes
            .evidenceIds,
        ),

      evidenceIntelligenceRunIds:
        normalizeStringList(
          input.attributes
            .evidenceIntelligenceRunIds,
        ),

      pedagogicalAnalysisIds:
        normalizeStringList(
          input.attributes
            .pedagogicalAnalysisIds,
        ),

      interventionIds:
        normalizeStringList(
          input.attributes
            .interventionIds,
        ),

      indicatorIds:
        normalizeStringList(
          input.attributes
            .indicatorIds,
        ),

      assessmentIds:
        normalizeStringList(
          input.attributes
            .assessmentIds,
        ),

      assessmentResultIds:
        normalizeStringList(
          input.attributes
            .assessmentResultIds,
        ),

      learningResultIds:
        normalizeStringList(
          input.attributes
            .learningResultIds,
        ),

      externalEventIds:
        normalizeStringList(
          input.attributes
            .externalEventIds,
        ),

      academicPeriodIds:
        normalizeStringList(
          input.attributes
            .academicPeriodIds,
        ),

      locationIds:
        normalizeStringList(
          input.attributes
            .locationIds,
        ),

      values: {
        ...input.attributes
          .values,
      },

      metadata: {
        ...input.attributes
          .metadata,
      },
    },

    time: {
      ...input.time,

      validFrom:
        normalizeNullableDateTime(
          input.time.validFrom,
        ),

      validUntil:
        normalizeNullableDateTime(
          input.time.validUntil,
        ),

      observedAt:
        normalizeNullableDateTime(
          input.time.observedAt,
        ),

      recordedAt:
        normalizeDateTime(
          input.time.recordedAt,
          generatedAt,
        ),

      academicPeriodId:
        normalizeOptionalText(
          input.time
            .academicPeriodId,
        ),

      timezone:
        normalizeOptionalText(
          input.time.timezone,
        ),
    },

    provenance:
      input.provenance.map(
        item => ({
          ...item,

          sourceId:
            normalizeOptionalText(
              item.sourceId,
            ),

          sourceTable:
            normalizeOptionalText(
              item.sourceTable,
            ),

          sourceField:
            normalizeOptionalText(
              item.sourceField,
            ),

          sourceSystem:
            normalizeRequiredText(
              item.sourceSystem,
              'Sistema de origem',
            ),

          capturedAt:
            normalizeDateTime(
              item.capturedAt,
              generatedAt,
            ),

          observedAt:
            normalizeNullableDateTime(
              item.observedAt,
            ),

          importedAt:
            normalizeNullableDateTime(
              item.importedAt,
            ),

          createdBy:
            normalizeOptionalText(
              item.createdBy,
            ),

          checksum:
            normalizeOptionalText(
              item.checksum,
            ),

          metadata: {
            ...item.metadata,
          },
        }),
      ),

    confidence: {
      ...input.confidence,

      value:
        normalizeScore(
          input.confidence.value,
        ),

      level:
        confidenceLevelFromScore(
          normalizeScore(
            input.confidence.value,
          ),
        ),

      explanation:
        normalizeOptionalText(
          input.confidence
            .explanation,
        ),

      calculatedAt:
        normalizeNullableDateTime(
          input.confidence
            .calculatedAt,
        ),

      method:
        normalizeOptionalText(
          input.confidence.method,
        ),

      engineName:
        normalizeOptionalText(
          input.confidence
            .engineName,
        ),

      engineVersion:
        normalizeOptionalText(
          input.confidence
            .engineVersion,
        ),

      metadata: {
        ...input.confidence
          .metadata,
      },
    },

    explainability: {
      ...input.explainability,

      summary:
        normalizeRequiredText(
          input.explainability
            .summary,
          'Resumo da explicabilidade',
        ),

      reasons:
        normalizeStringList(
          input.explainability
            .reasons,
        ),

      rulesApplied:
        normalizeStringList(
          input.explainability
            .rulesApplied,
        ),

      assumptions:
        normalizeStringList(
          input.explainability
            .assumptions,
        ),

      limitations:
        normalizeStringList(
          input.explainability
            .limitations,
        ),

      uncertaintyFactors:
        normalizeStringList(
          input.explainability
            .uncertaintyFactors,
        ),

      alternativeExplanations:
        normalizeStringList(
          input.explainability
            .alternativeExplanations,
        ),

      generatedAt:
        normalizeDateTime(
          input.explainability
            .generatedAt,
          generatedAt,
        ),

      engineName:
        normalizeOptionalText(
          input.explainability
            .engineName,
        ),

      engineVersion:
        normalizeOptionalText(
          input.explainability
            .engineVersion,
        ),

      metadata: {
        ...input.explainability
          .metadata,
      },
    },

    privacy: {
      ...input.privacy,

      accessRestrictions:
        normalizeStringList(
          input.privacy
            .accessRestrictions,
        ),

      prohibitedUses:
        normalizeStringList(
          input.privacy
            .prohibitedUses,
        ),

      notes:
        normalizeOptionalText(
          input.privacy.notes,
        ),
    },

    researchEligibility: {
      ...input.researchEligibility,

      restrictions:
        normalizeStringList(
          input.researchEligibility
            .restrictions,
        ),

      notes:
        normalizeOptionalText(
          input.researchEligibility
            .notes,
        ),
    },

    traceability: {
      ...input.traceability,

      correlationId:
        normalizeRequiredText(
          input.traceability
            .correlationId,
          'Correlation ID do nó',
        ),

      causationId:
        normalizeOptionalText(
          input.traceability
            .causationId,
        ),

      requestId:
        normalizeOptionalText(
          input.traceability
            .requestId,
        ),

      sessionId:
        normalizeOptionalText(
          input.traceability
            .sessionId,
        ),

      traceId:
        normalizeOptionalText(
          input.traceability
            .traceId,
        ),

      sourceEventId:
        normalizeOptionalText(
          input.traceability
            .sourceEventId,
        ),

      parentNodeIds:
        normalizeStringList(
          input.traceability
            .parentNodeIds,
        ),

      parentEdgeIds:
        normalizeStringList(
          input.traceability
            .parentEdgeIds,
        ),

      relatedNodeIds:
        normalizeStringList(
          input.traceability
            .relatedNodeIds,
        ),

      relatedEdgeIds:
        normalizeStringList(
          input.traceability
            .relatedEdgeIds,
        ),

      createdBy:
        normalizeOptionalText(
          input.traceability
            .createdBy,
        ),

      updatedBy:
        normalizeOptionalText(
          input.traceability
            .updatedBy,
        ),

      reviewedBy:
        normalizeOptionalText(
          input.traceability
            .reviewedBy,
        ),

      metadata: {
        ...input.traceability
          .metadata,
      },
    },

    metadata: {
      ...(input.metadata ?? {}),
    },
  }
}

function normalizeEdgeInput(
  input:
    LearningGraphEdgeInput,
  generatedAt:
    string,
): LearningGraphEdgeInput {
  const confidenceValue =
    normalizeScore(
      input.attributes
        .confidence.value,
    )

  return {
    ...input,

    edgeKey:
      normalizeIdentifier(
        input.edgeKey,
        'Chave da relação',
      ),

    customType:
      normalizeOptionalText(
        input.customType,
      ),

    sourceNodeId:
      normalizeIdentifier(
        input.sourceNodeId,
        'Nó de origem',
      ),

    targetNodeId:
      normalizeIdentifier(
        input.targetNodeId,
        'Nó de destino',
      ),

    reciprocalEdgeId:
      normalizeOptionalText(
        input.reciprocalEdgeId,
      ),

    attributes: {
      ...input.attributes,

      label:
        normalizeOptionalText(
          input.attributes.label,
        ),

      description:
        normalizeOptionalText(
          input.attributes
            .description,
        ),

      weight:
        normalizeScore(
          input.attributes.weight,
        ),

      confidence: {
        ...input.attributes
          .confidence,

        value:
          confidenceValue,

        level:
          confidenceLevelFromScore(
            confidenceValue,
          ),

        explanation:
          normalizeOptionalText(
            input.attributes
              .confidence
              .explanation,
          ),

        calculatedAt:
          normalizeNullableDateTime(
            input.attributes
              .confidence
              .calculatedAt,
          ),

        method:
          normalizeOptionalText(
            input.attributes
              .confidence
              .method,
          ),

        engineName:
          normalizeOptionalText(
            input.attributes
              .confidence
              .engineName,
          ),

        engineVersion:
          normalizeOptionalText(
            input.attributes
              .confidence
              .engineVersion,
          ),

        metadata: {
          ...input.attributes
            .confidence
            .metadata,
        },
      },

      evidence:
        input.attributes
          .evidence
          .map(
            item => ({
              ...item,

              id:
                normalizeIdentifier(
                  item.id,
                  'ID da evidência da relação',
                ),

              relevanceScore:
                normalizeScore(
                  item.relevanceScore,
                ),

              reliabilityScore:
                normalizeScore(
                  item.reliabilityScore,
                ),

              confidenceScore:
                normalizeScore(
                  item.confidenceScore,
                ),

              observedAt:
                normalizeNullableDateTime(
                  item.observedAt,
                ),

              explanation:
                normalizeOptionalText(
                  item.explanation,
                ),

              metadata: {
                ...item.metadata,
              },
            }),
          ),

      conditions:
        normalizeStringList(
          input.attributes
            .conditions,
        ),

      limitations:
        normalizeStringList(
          input.attributes
            .limitations,
        ),

      tags:
        normalizeStringList(
          input.attributes.tags,
        ),

      metadata: {
        ...input.attributes
          .metadata,
      },
    },

    time: {
      ...input.time,

      validFrom:
        normalizeNullableDateTime(
          input.time.validFrom,
        ),

      validUntil:
        normalizeNullableDateTime(
          input.time.validUntil,
        ),

      observedAt:
        normalizeNullableDateTime(
          input.time.observedAt,
        ),

      recordedAt:
        normalizeDateTime(
          input.time.recordedAt,
          generatedAt,
        ),

      academicPeriodId:
        normalizeOptionalText(
          input.time
            .academicPeriodId,
        ),

      timezone:
        normalizeOptionalText(
          input.time.timezone,
        ),
    },

    provenance:
      input.provenance.map(
        item => ({
          ...item,

          sourceId:
            normalizeOptionalText(
              item.sourceId,
            ),

          sourceTable:
            normalizeOptionalText(
              item.sourceTable,
            ),

          sourceField:
            normalizeOptionalText(
              item.sourceField,
            ),

          sourceSystem:
            normalizeRequiredText(
              item.sourceSystem,
              'Sistema de origem da relação',
            ),

          capturedAt:
            normalizeDateTime(
              item.capturedAt,
              generatedAt,
            ),

          observedAt:
            normalizeNullableDateTime(
              item.observedAt,
            ),

          importedAt:
            normalizeNullableDateTime(
              item.importedAt,
            ),

          createdBy:
            normalizeOptionalText(
              item.createdBy,
            ),

          checksum:
            normalizeOptionalText(
              item.checksum,
            ),

          metadata: {
            ...item.metadata,
          },
        }),
      ),

    explainability: {
      ...input.explainability,

      summary:
        normalizeRequiredText(
          input.explainability
            .summary,
          'Resumo da relação',
        ),

      reasons:
        normalizeStringList(
          input.explainability
            .reasons,
        ),

      rulesApplied:
        normalizeStringList(
          input.explainability
            .rulesApplied,
        ),

      assumptions:
        normalizeStringList(
          input.explainability
            .assumptions,
        ),

      limitations:
        normalizeStringList(
          input.explainability
            .limitations,
        ),

      uncertaintyFactors:
        normalizeStringList(
          input.explainability
            .uncertaintyFactors,
        ),

      alternativeExplanations:
        normalizeStringList(
          input.explainability
            .alternativeExplanations,
        ),

      generatedAt:
        normalizeDateTime(
          input.explainability
            .generatedAt,
          generatedAt,
        ),

      engineName:
        normalizeOptionalText(
          input.explainability
            .engineName,
        ),

      engineVersion:
        normalizeOptionalText(
          input.explainability
            .engineVersion,
        ),

      metadata: {
        ...input.explainability
          .metadata,
      },
    },

    privacy: {
      ...input.privacy,

      accessRestrictions:
        normalizeStringList(
          input.privacy
            .accessRestrictions,
        ),

      prohibitedUses:
        normalizeStringList(
          input.privacy
            .prohibitedUses,
        ),

      notes:
        normalizeOptionalText(
          input.privacy.notes,
        ),
    },

    researchEligibility: {
      ...input.researchEligibility,

      restrictions:
        normalizeStringList(
          input.researchEligibility
            .restrictions,
        ),

      notes:
        normalizeOptionalText(
          input.researchEligibility
            .notes,
        ),
    },

    traceability: {
      ...input.traceability,

      correlationId:
        normalizeRequiredText(
          input.traceability
            .correlationId,
          'Correlation ID da relação',
        ),

      causationId:
        normalizeOptionalText(
          input.traceability
            .causationId,
        ),

      requestId:
        normalizeOptionalText(
          input.traceability
            .requestId,
        ),

      sessionId:
        normalizeOptionalText(
          input.traceability
            .sessionId,
        ),

      traceId:
        normalizeOptionalText(
          input.traceability
            .traceId,
        ),

      sourceEventId:
        normalizeOptionalText(
          input.traceability
            .sourceEventId,
        ),

      parentNodeIds:
        normalizeStringList(
          input.traceability
            .parentNodeIds,
        ),

      parentEdgeIds:
        normalizeStringList(
          input.traceability
            .parentEdgeIds,
        ),

      relatedNodeIds:
        normalizeStringList(
          input.traceability
            .relatedNodeIds,
        ),

      relatedEdgeIds:
        normalizeStringList(
          input.traceability
            .relatedEdgeIds,
        ),

      createdBy:
        normalizeOptionalText(
          input.traceability
            .createdBy,
        ),

      updatedBy:
        normalizeOptionalText(
          input.traceability
            .updatedBy,
        ),

      reviewedBy:
        normalizeOptionalText(
          input.traceability
            .reviewedBy,
        ),

      metadata: {
        ...input.traceability
          .metadata,
      },
    },

    metadata: {
      ...(input.metadata ?? {}),
    },
  }
}

function normalizeInput(
  input:
    BuildLearningGraphInput,
  generatedAt:
    string,
): NormalizedLearningGraphInput {
  return {
    context:
      normalizeContext(
        input.context,
      ),

    nodes:
      input.nodes.map(
        node =>
          normalizeNodeInput(
            node,
            generatedAt,
          ),
      ),

    edges:
      input.edges.map(
        edge =>
          normalizeEdgeInput(
            edge,
            generatedAt,
          ),
      ),

    includeArchived:
      input.includeArchived,

    includeHistoricalVersions:
      input
        .includeHistoricalVersions,

    calculateMetrics:
      input.calculateMetrics,

    validateReferentialIntegrity:
      input
        .validateReferentialIntegrity,

    inferRelations:
      input.inferRelations,

    requireHumanReviewForInferences:
      input
        .requireHumanReviewForInferences,

    minimumInferenceConfidence:
      normalizeInferenceThreshold(
        input
          .minimumInferenceConfidence,
      ),

    requestedByUserId:
      normalizeOptionalText(
        input.requestedByUserId,
      ),

    correlationId:
      normalizeRequiredText(
        input.correlationId,
        'Correlation ID do grafo',
      ),

    causationId:
      normalizeOptionalText(
        input.causationId,
      ),

    requestId:
      normalizeOptionalText(
        input.requestId,
      ),

    sessionId:
      normalizeOptionalText(
        input.sessionId,
      ),

    traceId:
      normalizeOptionalText(
        input.traceId,
      ),

    sourceEventId:
      normalizeOptionalText(
        input.sourceEventId,
      ),

    metadata: {
      ...(input.metadata ?? {}),
    },
  }
}

function validateDates(
  validFrom:
    string | null,
  validUntil:
    string | null,
): boolean {
  if (
    !validFrom ||
    !validUntil
  ) {
    return true
  }

  return (
    Date.parse(validUntil) >=
    Date.parse(validFrom)
  )
}

function validateGraph(
  input:
    NormalizedLearningGraphInput,
  generatedAt:
    string,
): LearningGraphValidationResult {
  const issues:
    LearningGraphValidationIssue[] =
      []

  const nodeKeys =
    new Map<
      string,
      number
    >()

  const edgeKeys =
    new Map<
      string,
      number
    >()

  const nodeIds =
    new Set<string>()

  const invalidNodeIds =
    new Set<string>()

  const invalidEdgeIds =
    new Set<string>()

  const orphanNodeIds =
    new Set<string>()

  for (
    const node of input.nodes
  ) {
    const nodeId =
      createStableId(
        'node',
        [
          input.context.graphKey,
          node.nodeKey,
        ].join(':'),
      )

    nodeIds.add(nodeId)

    nodeKeys.set(
      node.nodeKey,
      (
        nodeKeys.get(
          node.nodeKey,
        ) ??
        0
      ) + 1,
    )

    if (
      !validateDates(
        node.time.validFrom,
        node.time.validUntil,
      )
    ) {
      invalidNodeIds.add(
        nodeId,
      )

      issues.push(
        createIssue({
          code:
            'invalid_node_time_interval',

          severity:
            'error',

          message:
            'O término da validade do nó é anterior ao início.',

          field:
            'time',

          nodeId,
        }),
      )
    }

    if (
      node.privacy
        .containsMinorData &&
      node.privacy.level ===
        'public'
    ) {
      invalidNodeIds.add(
        nodeId,
      )

      issues.push(
        createIssue({
          code:
            'minor_data_public_node',

          severity:
            'critical',

          message:
            'Um nó com dados de menores não pode possuir privacidade pública.',

          field:
            'privacy.level',

          nodeId,

          requiresHumanReview:
            true,
        }),
      )
    }

    if (
      node.researchEligibility
        .eligible &&
      node.researchEligibility
        .anonymizationRequired &&
      !node.privacy.anonymized
    ) {
      issues.push(
        createIssue({
          code:
            'research_anonymization_missing',

          severity:
            'warning',

          message:
            'O nó está marcado como elegível para pesquisa, mas requer anonimização.',

          field:
            'privacy.anonymized',

          nodeId,

          requiresHumanReview:
            true,
        }),
      )
    }
  }

  for (
    const edge of input.edges
  ) {
    const edgeId =
      createStableId(
        'edge',
        [
          input.context.graphKey,
          edge.edgeKey,
        ].join(':'),
      )

    edgeKeys.set(
      edge.edgeKey,
      (
        edgeKeys.get(
          edge.edgeKey,
        ) ??
        0
      ) + 1,
    )

    if (
      edge.sourceNodeId ===
      edge.targetNodeId
    ) {
      issues.push(
        createIssue({
          code:
            'self_referencing_edge',

          severity:
            edge.type ===
              'similar_to' ||
            edge.type ===
              'associated_with'
              ? 'warning'
              : 'error',

          message:
            'A relação utiliza o mesmo nó como origem e destino.',

          edgeId,

          relatedEntityIds: [
            edge.sourceNodeId,
          ],

          requiresHumanReview:
            true,
        }),
      )
    }

    if (
      input
        .validateReferentialIntegrity &&
      (
        !nodeIds.has(
          edge.sourceNodeId,
        ) ||
        !nodeIds.has(
          edge.targetNodeId,
        )
      )
    ) {
      invalidEdgeIds.add(
        edgeId,
      )

      issues.push(
        createIssue({
          code:
            'edge_referential_integrity_error',

          severity:
            'error',

          message:
            'A relação referencia um nó inexistente no snapshot.',

          edgeId,

          relatedEntityIds: [
            edge.sourceNodeId,
            edge.targetNodeId,
          ],
        }),
      )
    }

    if (
      !validateDates(
        edge.time.validFrom,
        edge.time.validUntil,
      )
    ) {
      invalidEdgeIds.add(
        edgeId,
      )

      issues.push(
        createIssue({
          code:
            'invalid_edge_time_interval',

          severity:
            'error',

          message:
            'O término da validade da relação é anterior ao início.',

          field:
            'time',

          edgeId,
        }),
      )
    }

    if (
      NON_CAUSAL_RELATIONS.includes(
        edge.type,
      ) &&
      edge.attributes
        .causalityStatus ===
        'supported_causal_relation'
    ) {
      invalidEdgeIds.add(
        edgeId,
      )

      issues.push(
        createIssue({
          code:
            'correlation_marked_as_causation',

          severity:
            'critical',

          message:
            'Uma relação correlacional não pode ser classificada automaticamente como causal.',

          field:
            'attributes.causalityStatus',

          edgeId,

          requiresHumanReview:
            true,
        }),
      )
    }

    if (
      edge.attributes
        .inferredRelation &&
      input
        .requireHumanReviewForInferences &&
      !edge.attributes
        .validatedByHuman
    ) {
      issues.push(
        createIssue({
          code:
            'inferred_edge_requires_review',

          severity:
            'warning',

          message:
            'A relação inferida ainda requer revisão humana.',

          edgeId,

          requiresHumanReview:
            true,
        }),
      )
    }

    const edgeConfidence =
      edge.attributes
        .confidence.value

    if (
      edge.attributes
        .inferredRelation &&
      edgeConfidence !== null &&
      edgeConfidence <
        input
          .minimumInferenceConfidence
    ) {
      invalidEdgeIds.add(
        edgeId,
      )

      issues.push(
        createIssue({
          code:
            'inference_below_confidence_threshold',

          severity:
            'error',

          message:
            'A confiança da relação inferida está abaixo do limite definido.',

          field:
            'attributes.confidence.value',

          edgeId,

          metadata: {
            confidence:
              edgeConfidence,

            minimumConfidence:
              input
                .minimumInferenceConfidence,
          },
        }),
      )
    }
  }

  const duplicatedNodeKeys =
    Array.from(
      nodeKeys.entries(),
    )
      .filter(
        (
          [, count],
        ) =>
          count > 1,
      )
      .map(
        ([key]) =>
          key,
      )

  const duplicatedEdgeKeys =
    Array.from(
      edgeKeys.entries(),
    )
      .filter(
        (
          [, count],
        ) =>
          count > 1,
      )
      .map(
        ([key]) =>
          key,
      )

  for (
    const key of
      duplicatedNodeKeys
  ) {
    issues.push(
      createIssue({
        code:
          'duplicated_node_key',

        severity:
          'error',

        message:
          `A chave de nó "${key}" está duplicada.`,

        field:
          'nodeKey',
      }),
    )
  }

  for (
    const key of
      duplicatedEdgeKeys
  ) {
    issues.push(
      createIssue({
        code:
          'duplicated_edge_key',

        severity:
          'error',

        message:
          `A chave de relação "${key}" está duplicada.`,

        field:
          'edgeKey',
      }),
    )
  }

  const degreeMap =
    new Map<
      string,
      number
    >()

  for (
    const nodeId of nodeIds
  ) {
    degreeMap.set(
      nodeId,
      0,
    )
  }

  for (
    const edge of input.edges
  ) {
    if (
      degreeMap.has(
        edge.sourceNodeId,
      )
    ) {
      degreeMap.set(
        edge.sourceNodeId,
        (
          degreeMap.get(
            edge.sourceNodeId,
          ) ??
          0
        ) + 1,
      )
    }

    if (
      degreeMap.has(
        edge.targetNodeId,
      )
    ) {
      degreeMap.set(
        edge.targetNodeId,
        (
          degreeMap.get(
            edge.targetNodeId,
          ) ??
          0
        ) + 1,
      )
    }
  }

  for (
    const [
      nodeId,
      degree,
    ] of degreeMap.entries()
  ) {
    if (degree === 0) {
      orphanNodeIds.add(
        nodeId,
      )

      issues.push(
        createIssue({
          code:
            'isolated_node',

          severity:
            'information',

          message:
            'O nó não possui relações no snapshot atual.',

          nodeId,
        }),
      )
    }
  }

  const hasBlockingIssues =
    issues.some(
      issue =>
        issue.severity ===
          'error' ||
        issue.severity ===
          'critical',
    )

  return {
    valid:
      !hasBlockingIssues,

    issues,

    nodeCount:
      input.nodes.length,

    edgeCount:
      input.edges.length,

    invalidNodeIds:
      Array.from(
        invalidNodeIds,
      ),

    invalidEdgeIds:
      Array.from(
        invalidEdgeIds,
      ),

    orphanNodeIds:
      Array.from(
        orphanNodeIds,
      ),

    duplicatedNodeKeys,

    duplicatedEdgeKeys,

    generatedAt,

    metadata: {
      engineName:
        ENGINE_NAME,

      engineVersion:
        ENGINE_VERSION,

      rulesetVersion:
        RULESET_VERSION,
    },
  }
}

function createVersion({
  graphEntityKey,
  generatedAt,
  createdBy,
}: {
  graphEntityKey: string

  generatedAt: string

  createdBy:
    string | null
}): LearningGraphVersion {
  return {
    id:
      createStableId(
        'version',
        [
          graphEntityKey,
          generatedAt,
        ].join(':'),
      ),

    graphEntityKey,

    versionNumber:
      1,

    versionLabel:
      '1.0',

    status:
      'current',

    previousVersionId:
      null,

    parentVersionId:
      null,

    isCurrent:
      true,

    createdAt:
      generatedAt,

    createdBy,

    changeReason:
      'Construção inicial do snapshot do Learning Graph.',

    changedFields: [
      'nodes',
      'edges',
      'metrics',
    ],

    metadata: {
      engineName:
        ENGINE_NAME,

      engineVersion:
        ENGINE_VERSION,
    },
  }
}

function materializeNodes(
  input:
    NormalizedLearningGraphInput,
  generatedAt:
    string,
): LearningGraphNode[] {
  return input.nodes.map(
    node => {
      const id =
        createStableId(
          'node',
          [
            input.context.graphKey,
            node.nodeKey,
          ].join(':'),
        )

      return {
        id,

        nodeKey:
          node.nodeKey,

        type:
          node.type,

        subtype:
          node.subtype ??
          null,

        sourceEntity: {
          ...node.sourceEntity,

          graphNodeId:
            id,
        },

        attributes:
          node.attributes,

        time:
          node.time,

        provenance:
          node.provenance,

        confidence:
          node.confidence,

        explainability:
          node.explainability,

        privacy:
          node.privacy,

        researchEligibility:
          node
            .researchEligibility,

        traceability: {
          ...node.traceability,

          correlationId:
            node.traceability
              .correlationId ||
            input.correlationId,

          causationId:
            node.traceability
              .causationId ??
            input.causationId,

          requestId:
            node.traceability
              .requestId ??
            input.requestId,

          sessionId:
            node.traceability
              .sessionId ??
            input.sessionId,

          traceId:
            node.traceability
              .traceId ??
            input.traceId,

          sourceEventId:
            node.traceability
              .sourceEventId ??
            input.sourceEventId,

          createdBy:
            node.traceability
              .createdBy ??
            input
              .requestedByUserId,

          updatedBy:
            node.traceability
              .updatedBy ??
            input
              .requestedByUserId,
        },

        version:
          createVersion({
            graphEntityKey:
              node.nodeKey,

            generatedAt,

            createdBy:
              input
                .requestedByUserId,
          }),

        createdAt:
          generatedAt,

        updatedAt:
          generatedAt,

        archivedAt:
          null,
      }
    },
  )
}

function materializeEdges(
  input:
    NormalizedLearningGraphInput,
  generatedAt:
    string,
): LearningGraphEdge[] {
  return input.edges.map(
    edge => ({
      id:
        createStableId(
          'edge',
          [
            input.context
              .graphKey,
            edge.edgeKey,
          ].join(':'),
        ),

      edgeKey:
        edge.edgeKey,

      type:
        edge.type,

      customType:
        edge.customType ??
        null,

      direction:
        edge.direction,

      sourceNodeId:
        edge.sourceNodeId,

      targetNodeId:
        edge.targetNodeId,

      reciprocalEdgeId:
        edge.reciprocalEdgeId ??
        null,

      attributes:
        edge.attributes,

      time:
        edge.time,

      provenance:
        edge.provenance,

      explainability:
        edge.explainability,

      privacy:
        edge.privacy,

      researchEligibility:
        edge
          .researchEligibility,

      traceability: {
        ...edge.traceability,

        correlationId:
          edge.traceability
            .correlationId ||
          input.correlationId,

        causationId:
          edge.traceability
            .causationId ??
          input.causationId,

        requestId:
          edge.traceability
            .requestId ??
          input.requestId,

        sessionId:
          edge.traceability
            .sessionId ??
          input.sessionId,

        traceId:
          edge.traceability
            .traceId ??
          input.traceId,

        sourceEventId:
          edge.traceability
            .sourceEventId ??
          input.sourceEventId,

        createdBy:
          edge.traceability
            .createdBy ??
          input
            .requestedByUserId,

        updatedBy:
          edge.traceability
            .updatedBy ??
          input
            .requestedByUserId,
      },

      version:
        createVersion({
          graphEntityKey:
            edge.edgeKey,

          generatedAt,

          createdBy:
            input
              .requestedByUserId,
        }),

      createdAt:
        generatedAt,

      updatedAt:
        generatedAt,

      archivedAt:
        null,
    }),
  )
}

function createAdjacency(
  nodes:
    LearningGraphNode[],
  edges:
    LearningGraphEdge[],
): GraphAdjacency {
  const adjacency:
    GraphAdjacency =
      new Map()

  for (
    const node of nodes
  ) {
    adjacency.set(
      node.id,
      new Set(),
    )
  }

  for (
    const edge of edges
  ) {
    if (
      adjacency.has(
        edge.sourceNodeId,
      ) &&
      adjacency.has(
        edge.targetNodeId,
      )
    ) {
      adjacency
        .get(
          edge.sourceNodeId,
        )
        ?.add(
          edge.targetNodeId,
        )

      adjacency
        .get(
          edge.targetNodeId,
        )
        ?.add(
          edge.sourceNodeId,
        )
    }
  }

  return adjacency
}

function calculateConnectedComponents(
  adjacency:
    GraphAdjacency,
): number {
  const visited =
    new Set<string>()

  let components =
    0

  for (
    const nodeId of
      adjacency.keys()
  ) {
    if (
      visited.has(
        nodeId,
      )
    ) {
      continue
    }

    components +=
      1

    const stack = [
      nodeId,
    ]

    while (
      stack.length > 0
    ) {
      const current =
        stack.pop()

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

      for (
        const neighbor of
          adjacency.get(
            current,
          ) ??
          []
      ) {
        if (
          !visited.has(
            neighbor,
          )
        ) {
          stack.push(
            neighbor,
          )
        }
      }
    }
  }

  return components
}

function calculateAverage(
  values:
    Array<
      number | null
    >,
): number | null {
  const validValues =
    values.filter(
      (
        value,
      ): value is number =>
        typeof value ===
          'number' &&
        Number.isFinite(
          value,
        ),
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

function calculateMetrics(
  nodes:
    LearningGraphNode[],
  edges:
    LearningGraphEdge[],
  generatedAt:
    string,
): LearningGraphMetrics {
  const adjacency =
    createAdjacency(
      nodes,
      edges,
    )

  const nodeCount =
    nodes.length

  const edgeCount =
    edges.length

  const activeNodeCount =
    nodes.filter(
      node =>
        node.archivedAt ===
          null &&
        node.attributes.status !==
          'archived',
    ).length

  const activeEdgeCount =
    edges.filter(
      edge =>
        edge.archivedAt ===
        null,
    ).length

  const isolatedNodeCount =
    Array.from(
      adjacency.values(),
    ).filter(
      neighbors =>
        neighbors.size === 0,
    ).length

  const inferredEdgeCount =
    edges.filter(
      edge =>
        edge.attributes
          .inferredRelation,
    ).length

  const humanValidatedEdgeCount =
    edges.filter(
      edge =>
        edge.attributes
          .validatedByHuman,
    ).length

  const possibleDirectedEdges =
    nodeCount > 1
      ? nodeCount *
        (
          nodeCount - 1
        )
      : 0

  const density =
    possibleDirectedEdges > 0
      ? edgeCount /
        possibleDirectedEdges
      : 0

  const averageDegree =
    nodeCount > 0
      ? (
          edgeCount * 2
        ) /
        nodeCount
      : 0

  const confidenceScore =
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
    ])

  const evidenceCoverageScore =
    edgeCount > 0
      ? edges.filter(
          edge =>
            edge.attributes
              .evidence.length >
            0,
        ).length /
        edgeCount
      : null

  const explainableEntityCount =
    [
      ...nodes.filter(
        node =>
          Boolean(
            node.explainability
              .summary,
          ),
      ),

      ...edges.filter(
        edge =>
          Boolean(
            edge.explainability
              .summary,
          ),
      ),
    ].length

  const totalEntities =
    nodeCount +
    edgeCount

  const explainabilityCoverageScore =
    totalEntities > 0
      ? explainableEntityCount /
        totalEntities
      : null

  return {
    nodeCount,

    edgeCount,

    activeNodeCount,

    activeEdgeCount,

    inferredEdgeCount,

    humanValidatedEdgeCount,

    isolatedNodeCount,

    connectedComponentCount:
      calculateConnectedComponents(
        adjacency,
      ),

    density:
      normalizeScore(
        density,
      ),

    averageDegree,

    confidenceScore:
      normalizeScore(
        confidenceScore,
      ),

    evidenceCoverageScore:
      normalizeScore(
        evidenceCoverageScore,
      ),

    explainabilityCoverageScore:
      normalizeScore(
        explainabilityCoverageScore,
      ),

    calculatedAt:
      generatedAt,

    metadata: {
      engineName:
        ENGINE_NAME,

      engineVersion:
        ENGINE_VERSION,

      rulesetVersion:
        RULESET_VERSION,

      densityModel:
        'directed_graph',

      componentsModel:
        'weakly_connected',
    },
  }
}

function createEmptyMetrics(
  generatedAt:
    string,
): LearningGraphMetrics {
  return {
    nodeCount:
      0,

    edgeCount:
      0,

    activeNodeCount:
      0,

    activeEdgeCount:
      0,

    inferredEdgeCount:
      0,

    humanValidatedEdgeCount:
      0,

    isolatedNodeCount:
      0,

    connectedComponentCount:
      null,

    density:
      null,

    averageDegree:
      null,

    confidenceScore:
      null,

    evidenceCoverageScore:
      null,

    explainabilityCoverageScore:
      null,

    calculatedAt:
      generatedAt,

    metadata: {
      engineName:
        ENGINE_NAME,

      engineVersion:
        ENGINE_VERSION,

      metricsCalculated:
        false,
    },
  }
}

function buildSnapshot(
  input:
    NormalizedLearningGraphInput,
  validation:
    LearningGraphValidationResult,
  generatedAt:
    string,
): LearningGraphSnapshot {
  const invalidNodes =
    new Set(
      validation
        .invalidNodeIds,
    )

  const invalidEdges =
    new Set(
      validation
        .invalidEdgeIds,
    )

  const duplicatedNodeKeys =
    new Set(
      validation
        .duplicatedNodeKeys,
    )

  const duplicatedEdgeKeys =
    new Set(
      validation
        .duplicatedEdgeKeys,
    )

  const nodes =
    materializeNodes(
      input,
      generatedAt,
    ).filter(
      node =>
        !invalidNodes.has(
          node.id,
        ) &&
        !duplicatedNodeKeys.has(
          node.nodeKey,
        ),
    )

  const validNodeIds =
    new Set(
      nodes.map(
        node =>
          node.id,
      ),
    )

  const edges =
    materializeEdges(
      input,
      generatedAt,
    ).filter(
      edge =>
        !invalidEdges.has(
          edge.id,
        ) &&
        !duplicatedEdgeKeys.has(
          edge.edgeKey,
        ) &&
        (
          !input
            .validateReferentialIntegrity ||
          (
            validNodeIds.has(
              edge.sourceNodeId,
            ) &&
            validNodeIds.has(
              edge.targetNodeId,
            )
          )
        ),
    )

  const metrics =
    input.calculateMetrics
      ? calculateMetrics(
          nodes,
          edges,
          generatedAt,
        )
      : createEmptyMetrics(
          generatedAt,
        )

  const graphVersion =
    createVersion({
      graphEntityKey:
        input.context
          .graphKey,

      generatedAt,

      createdBy:
        input.requestedByUserId,
    })

  return {
    id:
      input.context
        .graphId,

    snapshotKey: [
      input.context
        .graphKey,
      generatedAt,
    ].join(':'),

    context: {
      ...input.context,

      nodeTypes:
        Array.from(
          new Set(
            nodes.map(
              node =>
                node.type,
            ),
          ),
        ),

      relationTypes:
        Array.from(
          new Set(
            edges.map(
              edge =>
                edge.type,
            ),
          ),
        ),
    },

    nodes,

    edges,

    metrics,

    generatedAt,

    engine: {
      name:
        ENGINE_NAME,

      version:
        ENGINE_VERSION,

      mode:
        input.inferRelations
          ? 'hybrid'
          : 'deterministic',

      rulesetVersion:
        RULESET_VERSION,

      metadata: {
        inferenceEnabled:
          input.inferRelations,

        inferenceImplemented:
          false,

        minimumInferenceConfidence:
          input
            .minimumInferenceConfidence,

        requireHumanReviewForInferences:
          input
            .requireHumanReviewForInferences,
      },
    },

    traceability: {
      correlationId:
        input.correlationId,

      causationId:
        input.causationId,

      requestId:
        input.requestId,

      sessionId:
        input.sessionId,

      traceId:
        input.traceId,

      sourceEventId:
        input.sourceEventId,

      parentNodeIds:
        [],

      parentEdgeIds:
        [],

      relatedNodeIds:
        nodes.map(
          node =>
            node.id,
        ),

      relatedEdgeIds:
        edges.map(
          edge =>
            edge.id,
        ),

      createdBy:
        input.requestedByUserId,

      updatedBy:
        input.requestedByUserId,

      reviewedBy:
        null,

      metadata: {
        engineName:
          ENGINE_NAME,

        engineVersion:
          ENGINE_VERSION,
      },
    },

    version:
      graphVersion,

    warnings:
      validation.issues
        .filter(
          issue =>
            issue.severity ===
              'warning' ||
            issue.severity ===
              'information',
        )
        .map(
          issue =>
            issue.message,
        ),

    errors:
      validation.issues
        .filter(
          issue =>
            issue.severity ===
              'error' ||
            issue.severity ===
              'critical',
        )
        .map(
          issue =>
            issue.message,
        ),

    metadata: {
      ...input.metadata,

      originalNodeCount:
        input.nodes.length,

      originalEdgeCount:
        input.edges.length,

      validNodeCount:
        nodes.length,

      validEdgeCount:
        edges.length,

      validationPassed:
        validation.valid,

      includeArchived:
        input.includeArchived,

      includeHistoricalVersions:
        input
          .includeHistoricalVersions,

      architecture:
        'Framework EDI → EIOS → Core Compartilhado → Produtos Especializados',
    },
  }
}

function validateInputSize(
  input:
    BuildLearningGraphInput,
): void {
  if (
    input.nodes.length >
    DEFAULT_MAXIMUM_NODES
  ) {
    throw new Error(
      `O grafo excede o limite de ${DEFAULT_MAXIMUM_NODES} nós por execução.`,
    )
  }

  if (
    input.edges.length >
    DEFAULT_MAXIMUM_EDGES
  ) {
    throw new Error(
      `O grafo excede o limite de ${DEFAULT_MAXIMUM_EDGES} relações por execução.`,
    )
  }
}

export function validateLearningGraphInput(
  input:
    BuildLearningGraphInput,
): LearningGraphValidationResult {
  const generatedAt =
    nowIso()

  try {
    validateInputSize(
      input,
    )

    const normalized =
      normalizeInput(
        input,
        generatedAt,
      )

    return validateGraph(
      normalized,
      generatedAt,
    )
  } catch (error) {
    return {
      valid:
        false,

      issues: [
        createIssue({
          code:
            'learning_graph_input_invalid',

          severity:
            'critical',

          message:
            error instanceof Error
              ? error.message
              : 'A entrada do Learning Graph é inválida.',

          requiresHumanReview:
            false,

          metadata: {
            engineName:
              ENGINE_NAME,

            engineVersion:
              ENGINE_VERSION,
          },
        }),
      ],

      nodeCount:
        Array.isArray(
          input?.nodes,
        )
          ? input.nodes.length
          : 0,

      edgeCount:
        Array.isArray(
          input?.edges,
        )
          ? input.edges.length
          : 0,

      invalidNodeIds:
        [],

      invalidEdgeIds:
        [],

      orphanNodeIds:
        [],

      duplicatedNodeKeys:
        [],

      duplicatedEdgeKeys:
        [],

      generatedAt,

      metadata: {
        engineName:
          ENGINE_NAME,

        engineVersion:
          ENGINE_VERSION,

        validationFailedBeforeNormalization:
          true,
      },
    }
  }
}

export function buildLearningGraph(
  input:
    BuildLearningGraphInput,
): LearningGraphBuildResult {
  const generatedAt =
    nowIso()

  try {
    validateInputSize(
      input,
    )

    const normalized =
      normalizeInput(
        input,
        generatedAt,
      )

    const validation =
      validateGraph(
        normalized,
        generatedAt,
      )

    const graph =
      buildSnapshot(
        normalized,
        validation,
        generatedAt,
      )

    const warnings =
      validation.issues
        .filter(
          issue =>
            issue.severity ===
              'warning' ||
            issue.severity ===
              'information',
        )
        .map(
          issue =>
            issue.message,
        )

    if (
      normalized.inferRelations
    ) {
      warnings.push(
        'A inferência automática de relações foi solicitada, mas permanece desativada nesta versão do motor. Apenas relações fornecidas explicitamente foram processadas.',
      )
    }

    const errors =
      validation.issues
        .filter(
          issue =>
            issue.severity ===
              'error' ||
            issue.severity ===
              'critical',
        )
        .map(
          issue =>
            issue.message,
        )

    return {
      success:
        validation.valid,

      graph,

      validation,

      warnings:
        normalizeStringList(
          warnings,
        ),

      errors:
        normalizeStringList(
          errors,
        ),

      generatedAt,

      correlationId:
        normalized
          .correlationId,

      metadata: {
        engineName:
          ENGINE_NAME,

        engineVersion:
          ENGINE_VERSION,

        rulesetVersion:
          RULESET_VERSION,

        graphId:
          normalized.context
            .graphId,

        graphKey:
          normalized.context
            .graphKey,

        nodeCount:
          graph.nodes.length,

        edgeCount:
          graph.edges.length,

        validationPassed:
          validation.valid,

        deterministicBuild:
          true,

        automaticCausalInference:
          false,
      },
    }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Não foi possível construir o Learning Graph.'

    const validation:
      LearningGraphValidationResult = {
      valid:
        false,

      issues: [
        createIssue({
          code:
            'learning_graph_engine_failure',

          severity:
            'critical',

          message,

          requiresHumanReview:
            false,

          metadata: {
            engineName:
              ENGINE_NAME,

            engineVersion:
              ENGINE_VERSION,
          },
        }),
      ],

      nodeCount:
        Array.isArray(
          input?.nodes,
        )
          ? input.nodes.length
          : 0,

      edgeCount:
        Array.isArray(
          input?.edges,
        )
          ? input.edges.length
          : 0,

      invalidNodeIds:
        [],

      invalidEdgeIds:
        [],

      orphanNodeIds:
        [],

      duplicatedNodeKeys:
        [],

      duplicatedEdgeKeys:
        [],

      generatedAt,

      metadata: {
        engineName:
          ENGINE_NAME,

        engineVersion:
          ENGINE_VERSION,

        stage:
          'engine_exception',
      },
    }

    return {
      success:
        false,

      graph:
        null,

      validation,

      warnings:
        [],

      errors: [
        message,
      ],

      generatedAt,

      correlationId:
        normalizeOptionalText(
          input?.correlationId,
        ) ??
        createStableId(
          'correlation',
          generatedAt,
        ),

      metadata: {
        engineName:
          ENGINE_NAME,

        engineVersion:
          ENGINE_VERSION,

        rulesetVersion:
          RULESET_VERSION,

        failure:
          true,
      },
    }
  }
}

export function calculateLearningGraphMetrics(
  graph: {
    nodes:
      LearningGraphNode[]

    edges:
      LearningGraphEdge[]
  },
): LearningGraphMetrics {
  return calculateMetrics(
    graph.nodes,
    graph.edges,
    nowIso(),
  )
}

export function getLearningGraphEngineInfo() {
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
      'normalization',
      'referential_integrity',
      'duplicate_detection',
      'orphan_detection',
      'connected_components',
      'graph_density',
      'confidence_coverage',
      'evidence_coverage',
      'explainability_coverage',
      'privacy_validation',
      'research_governance_validation',
      'correlation_causality_separation',
    ],

    limitations: [
      'Não realiza inferência automática de novas relações.',
      'Não executa análise preditiva.',
      'Não interpreta correlação como causalidade.',
      'Não substitui validação humana.',
      'Não acessa diretamente o banco de dados.',
    ],
  }
}