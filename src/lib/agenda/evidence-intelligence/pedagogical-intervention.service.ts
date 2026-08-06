/**
 * EduData IA — EIOS
 * Capability 02: Pedagogical Copilot
 *
 * Serviço de aplicação das intervenções pedagógicas.
 *
 * Arquitetura:
 * Framework EDI
 * → EIOS
 * → Core Compartilhado
 * → Produtos Especializados
 *
 * Responsabilidades:
 * - validar e normalizar solicitações;
 * - executar o motor do Pedagogical Copilot;
 * - padronizar erros, avisos e metadados;
 * - criar resumos para interfaces;
 * - preparar os dados para persistência;
 * - manter regras de infraestrutura fora do domínio.
 */

import {
  generatePedagogicalIntervention,
} from './pedagogical-intervention.engine'

import type {
  GeneratePedagogicalInterventionInput,
  PedagogicalIntervention,
  PedagogicalInterventionApiError,
  PedagogicalInterventionApiMeta,
  PedagogicalInterventionApiResponse,
  PedagogicalInterventionMetadata,
  PedagogicalInterventionSummary,
} from './pedagogical-intervention.types'

const SERVICE_NAME =
  'pedagogical-intervention-service'

const SERVICE_VERSION =
  '1.0.1'

const CAPABILITY_NAME =
  'pedagogical_copilot'

export type PedagogicalInterventionServiceOperation =
  | 'validate'
  | 'generate'
  | 'summarize'
  | 'prepare_persistence'

export type PedagogicalInterventionServiceStatus =
  | 'started'
  | 'completed'
  | 'failed'
  | 'rejected'

export type PedagogicalInterventionServiceLog = {
  id: string

  operation:
    PedagogicalInterventionServiceOperation

  status:
    PedagogicalInterventionServiceStatus

  correlationId: string

  startedAt: string

  completedAt: string | null

  durationMs: number | null

  interventionId: string | null

  warnings: string[]

  errors:
    PedagogicalInterventionApiError[]

  metadata:
    PedagogicalInterventionMetadata
}

export type PedagogicalInterventionServiceValidation = {
  valid: boolean

  input:
    GeneratePedagogicalInterventionInput | null

  warnings: string[]

  errors:
    PedagogicalInterventionApiError[]
}

export type PedagogicalInterventionPersistencePayload = {
  id: string

  organizationId: string | null

  schoolId: string | null

  ownerUserId: string | null

  status:
    PedagogicalIntervention['status']

  priority:
    PedagogicalIntervention['priority']

  source:
    PedagogicalIntervention['source']

  sourceProduct:
    PedagogicalIntervention['sourceProduct']

  capability:
    PedagogicalIntervention['capability']

  context:
    PedagogicalIntervention['context']

  diagnostic:
    PedagogicalIntervention['diagnostic']

  plan:
    PedagogicalIntervention['plan']

  expectedEvidence:
    PedagogicalIntervention['expectedEvidence']

  indicators:
    PedagogicalIntervention['indicators']

  successCriteria:
    PedagogicalIntervention['successCriteria']

  schedule:
    PedagogicalIntervention['schedule']

  humanReview:
    PedagogicalIntervention['humanReview']

  teacherDecision:
    PedagogicalIntervention['teacherDecision']

  monitoring:
    PedagogicalIntervention['monitoring']

  effectiveness:
    PedagogicalIntervention['effectiveness']

  explainability:
    PedagogicalIntervention['explainability']

  privacy:
    PedagogicalIntervention['privacy']

  researchEligibility:
    PedagogicalIntervention['researchEligibility']

  traceability:
    PedagogicalIntervention['traceability']

  version:
    PedagogicalIntervention['version']

  engine:
    PedagogicalIntervention['engine']

  metadata:
    PedagogicalInterventionMetadata

  createdAt: string

  updatedAt: string

  archivedAt: string | null
}

export type GeneratePedagogicalInterventionServiceResult = {
  success: boolean

  intervention:
    PedagogicalIntervention | null

  summary:
    PedagogicalInterventionSummary | null

  persistencePayload:
    PedagogicalInterventionPersistencePayload | null

  warnings: string[]

  errors:
    PedagogicalInterventionApiError[]

  logs:
    PedagogicalInterventionServiceLog[]

  meta:
    PedagogicalInterventionApiMeta
}

function nowIso(): string {
  return new Date().toISOString()
}

function normalizeText(
  value:
    string | null | undefined,
): string {
  return typeof value === 'string'
    ? value.trim()
    : ''
}

function normalizeNullableText(
  value:
    string | null | undefined,
): string | null {
  const normalized =
    normalizeText(value)

  return normalized || null
}

function uniqueStrings(
  values:
    Array<string | null | undefined>,
): string[] {
  return Array.from(
    new Set(
      values
        .filter(
          (
            value,
          ): value is string =>
            typeof value === 'string',
        )
        .map(
          value =>
            value.trim(),
        )
        .filter(Boolean),
    ),
  )
}

function createError({
  code,
  message,
  field = null,
  details = {},
}: {
  code: string
  message: string
  field?: string | null
  details?:
    PedagogicalInterventionMetadata
}): PedagogicalInterventionApiError {
  return {
    code,
    message,
    field,
    details,
  }
}

function getErrorMessage(
  error: unknown,
): string {
  if (
    error instanceof Error &&
    error.message.trim()
  ) {
    return error.message.trim()
  }

  if (
    typeof error === 'string' &&
    error.trim()
  ) {
    return error.trim()
  }

  return 'Erro inesperado no serviço de intervenção pedagógica.'
}

function calculateDurationMs(
  startedAt: string,
  completedAt: string,
): number | null {
  const start =
    Date.parse(startedAt)

  const end =
    Date.parse(completedAt)

  if (
    Number.isNaN(start) ||
    Number.isNaN(end)
  ) {
    return null
  }

  return Math.max(
    0,
    end - start,
  )
}

function createLog({
  operation,
  status,
  correlationId,
  startedAt,
  completedAt = null,
  interventionId = null,
  warnings = [],
  errors = [],
  metadata = {},
}: {
  operation:
    PedagogicalInterventionServiceOperation

  status:
    PedagogicalInterventionServiceStatus

  correlationId: string

  startedAt: string

  completedAt?: string | null

  interventionId?: string | null

  warnings?: string[]

  errors?:
    PedagogicalInterventionApiError[]

  metadata?:
    PedagogicalInterventionMetadata
}): PedagogicalInterventionServiceLog {
  return {
    id: [
      'pedagogical-service',
      operation,
      correlationId,
      startedAt,
    ]
      .join('-')
      .toLowerCase()
      .replace(
        /[^a-z0-9]+/g,
        '-',
      )
      .replace(
        /^-+|-+$/g,
        '',
      ),

    operation,

    status,

    correlationId,

    startedAt,

    completedAt,

    durationMs:
      completedAt
        ? calculateDurationMs(
            startedAt,
            completedAt,
          )
        : null,

    interventionId,

    warnings:
      uniqueStrings(warnings),

    errors,

    metadata: {
      serviceName:
        SERVICE_NAME,

      serviceVersion:
        SERVICE_VERSION,

      capability:
        CAPABILITY_NAME,

      ...metadata,
    },
  }
}

function createMeta({
  correlationId,
  generatedAt,
  metadata = {},
}: {
  correlationId: string
  generatedAt: string
  metadata?:
    PedagogicalInterventionMetadata
}): PedagogicalInterventionApiMeta {
  return {
    correlationId,

    generatedAt,

    metadata: {
      serviceName:
        SERVICE_NAME,

      serviceVersion:
        SERVICE_VERSION,

      capability:
        CAPABILITY_NAME,

      ...metadata,
    },
  }
}

function normalizeInput(
  input:
    GeneratePedagogicalInterventionInput,
): GeneratePedagogicalInterventionInput {
  return {
    ...input,

    organizationId:
      normalizeNullableText(
        input.organizationId,
      ),

    schoolId:
      normalizeNullableText(
        input.schoolId,
      ),

    requestedByUserId:
      normalizeNullableText(
        input.requestedByUserId,
      ),

    correlationId:
      normalizeText(
        input.correlationId,
      ),

    constraints:
      uniqueStrings(
        input.constraints,
      ),

    teacherPreferences:
      uniqueStrings(
        input.teacherPreferences,
      ),

    excludedApproaches:
      uniqueStrings(
        input.excludedApproaches,
      ),

    requiredMethodologies:
      Array.from(
        new Set(
          input.requiredMethodologies,
        ),
      ),

    context: {
      ...input.context,

      title:
        normalizeText(
          input.context.title,
        ),

      summary:
        normalizeText(
          input.context.summary,
        ),

      subjectArea:
        normalizeNullableText(
          input.context.subjectArea,
        ),

      component:
        normalizeNullableText(
          input.context.component,
        ),

      gradeLevel:
        normalizeNullableText(
          input.context.gradeLevel,
        ),

      schoolTerm:
        normalizeNullableText(
          input.context.schoolTerm,
        ),

      locationContext:
        normalizeNullableText(
          input.context.locationContext,
        ),

      contextualFactors:
        uniqueStrings(
          input.context.contextualFactors,
        ),

      constraints:
        uniqueStrings(
          input.context.constraints,
        ),

      availableResources:
        uniqueStrings(
          input.context.availableResources,
        ),

      previousActions:
        uniqueStrings(
          input.context.previousActions,
        ),

      teacherObservations:
        uniqueStrings(
          input.context.teacherObservations,
        ),

      audience: {
        ...input.context.audience,

        targetIds:
          uniqueStrings(
            input.context.audience.targetIds,
          ),

        groupId:
          normalizeNullableText(
            input.context.audience.groupId,
          ),

        groupLabel:
          normalizeNullableText(
            input.context.audience.groupLabel,
          ),

        selectionRationale:
          normalizeNullableText(
            input.context
              .audience
              .selectionRationale,
          ),
      },

      links: {
        ...input.context.links,

        organizationId:
          normalizeNullableText(
            input.context
              .links
              .organizationId,
          ),

        schoolId:
          normalizeNullableText(
            input.context.links.schoolId,
          ),

        teacherId:
          normalizeNullableText(
            input.context.links.teacherId,
          ),

        classIds:
          uniqueStrings(
            input.context.links.classIds,
          ),

        planningIds:
          uniqueStrings(
            input.context.links.planningIds,
          ),

        lessonIds:
          uniqueStrings(
            input.context.links.lessonIds,
          ),

        learningObjectiveIds:
          uniqueStrings(
            input.context
              .links
              .learningObjectiveIds,
          ),

        skillIds:
          uniqueStrings(
            input.context.links.skillIds,
          ),

        competencyIds:
          uniqueStrings(
            input.context
              .links
              .competencyIds,
          ),

        curriculumReferenceIds:
          uniqueStrings(
            input.context
              .links
              .curriculumReferenceIds,
          ),

        evidenceIds:
          uniqueStrings(
            input.context.links.evidenceIds,
          ),

        indicatorIds:
          uniqueStrings(
            input.context.links.indicatorIds,
          ),

        assessmentIds:
          uniqueStrings(
            input.context
              .links
              .assessmentIds,
          ),

        assessmentResultIds:
          uniqueStrings(
            input.context
              .links
              .assessmentResultIds,
          ),

        relatedInterventionIds:
          uniqueStrings(
            input.context
              .links
              .relatedInterventionIds,
          ),

        additionalEntities:
          input.context
            .links
            .additionalEntities
            .map(
              entity => ({
                ...entity,

                entityId:
                  normalizeText(
                    entity.entityId,
                  ),

                label:
                  normalizeNullableText(
                    entity.label,
                  ),

                relationship:
                  normalizeNullableText(
                    entity.relationship,
                  ),

                sourceSystem:
                  normalizeNullableText(
                    entity.sourceSystem,
                  ),

                metadata: {
                  ...(entity.metadata ?? {}),
                },
              }),
            )
            .filter(
              entity =>
                Boolean(
                  entity.entityId,
                ),
            ),
      },
    },

    diagnostic: {
      ...input.diagnostic,

      problemStatement:
        normalizeText(
          input.diagnostic
            .problemStatement,
        ),

      pedagogicalInterpretation:
        normalizeText(
          input.diagnostic
            .pedagogicalInterpretation,
        ),

      observedPatterns:
        uniqueStrings(
          input.diagnostic
            .observedPatterns,
        ),

      strengths:
        uniqueStrings(
          input.diagnostic.strengths,
        ),

      learningGaps:
        uniqueStrings(
          input.diagnostic.learningGaps,
        ),

      inclusionBarriers:
        uniqueStrings(
          input.diagnostic
            .inclusionBarriers,
        ),

      engagementFactors:
        uniqueStrings(
          input.diagnostic
            .engagementFactors,
        ),

      additionalEvidenceNeeded:
        uniqueStrings(
          input.diagnostic
            .additionalEvidenceNeeded,
        ),

      assumptions:
        uniqueStrings(
          input.diagnostic.assumptions,
        ),

      limitations:
        uniqueStrings(
          input.diagnostic.limitations,
        ),

      probableCauses:
        input.diagnostic
          .probableCauses
          .map(
            cause => ({
              ...cause,

              category:
                normalizeText(
                  cause.category,
                ),

              description:
                normalizeText(
                  cause.description,
                ),

              evidenceIds:
                uniqueStrings(
                  cause.evidenceIds,
                ),

              validationNotes:
                normalizeNullableText(
                  cause.validationNotes,
                ),
            }),
          )
          .filter(
            cause =>
              Boolean(
                cause.description,
              ),
          ),

      sources:
        input.diagnostic
          .sources
          .map(
            source => ({
              ...source,

              sourceId:
                normalizeNullableText(
                  source.sourceId,
                ),

              description:
                normalizeText(
                  source.description,
                ),

              metadata: {
                ...(source.metadata ?? {}),
              },
            }),
          )
          .filter(
            source =>
              Boolean(
                source.description,
              ),
          ),

      risk: {
        ...input.diagnostic.risk,

        summary:
          normalizeText(
            input.diagnostic
              .risk
              .summary,
          ),

        types:
          Array.from(
            new Set(
              input.diagnostic
                .risk
                .types,
            ),
          ),

        signals:
          uniqueStrings(
            input.diagnostic
              .risk
              .signals,
          ),

        protectiveFactors:
          uniqueStrings(
            input.diagnostic
              .risk
              .protectiveFactors,
          ),

        aggravatingFactors:
          uniqueStrings(
            input.diagnostic
              .risk
              .aggravatingFactors,
          ),

        limitations:
          uniqueStrings(
            input.diagnostic
              .risk
              .limitations,
          ),
      },
    },

    privacy: {
      ...input.privacy,

      legalBasis:
        input.privacy.legalBasis ??
        null,

      retentionPolicy:
        normalizeNullableText(
          input.privacy
            .retentionPolicy,
        ),

      accessRestrictions:
        uniqueStrings(
          input.privacy
            .accessRestrictions,
        ),

      prohibitedUses:
        uniqueStrings(
          input.privacy
            .prohibitedUses,
        ),

      notes:
        normalizeNullableText(
          input.privacy.notes,
        ),
    },

    researchEligibility:
      input.researchEligibility
        ? {
            ...input.researchEligibility,

            restrictions:
              uniqueStrings(
                input
                  .researchEligibility
                  .restrictions ?? [],
              ),

            notes:
              normalizeNullableText(
                input
                  .researchEligibility
                  .notes,
              ),
          }
        : undefined,

    metadata: {
      ...(input.metadata ?? {}),

      serviceName:
        SERVICE_NAME,

      serviceVersion:
        SERVICE_VERSION,

      capability:
        CAPABILITY_NAME,
    },
  }
}

export function validatePedagogicalInterventionRequest(
  input:
    GeneratePedagogicalInterventionInput,
): PedagogicalInterventionServiceValidation {
  const errors:
    PedagogicalInterventionApiError[] =
      []

  const warnings: string[] = []

  if (
    !input ||
    typeof input !== 'object'
  ) {
    return {
      valid:
        false,

      input:
        null,

      warnings:
        [],

      errors: [
        createError({
          code:
            'invalid_request',

          message:
            'A solicitação de intervenção pedagógica é inválida.',
        }),
      ],
    }
  }

  const normalized =
    normalizeInput(input)

  if (!normalized.correlationId) {
    errors.push(
      createError({
        code:
          'missing_correlation_id',

        message:
          'O correlationId é obrigatório.',

        field:
          'correlationId',
      }),
    )
  }

  if (!normalized.context.title) {
    errors.push(
      createError({
        code:
          'missing_context_title',

        message:
          'O título do contexto pedagógico é obrigatório.',

        field:
          'context.title',
      }),
    )
  }

  if (!normalized.context.summary) {
    errors.push(
      createError({
        code:
          'missing_context_summary',

        message:
          'O resumo do contexto pedagógico é obrigatório.',

        field:
          'context.summary',
      }),
    )
  }

  if (
    !normalized.diagnostic
      .problemStatement
  ) {
    errors.push(
      createError({
        code:
          'missing_problem_statement',

        message:
          'A descrição do problema pedagógico é obrigatória.',

        field:
          'diagnostic.problemStatement',
      }),
    )
  }

  if (
    !normalized.diagnostic
      .pedagogicalInterpretation
  ) {
    errors.push(
      createError({
        code:
          'missing_pedagogical_interpretation',

        message:
          'A interpretação pedagógica é obrigatória.',

        field:
          'diagnostic.pedagogicalInterpretation',
      }),
    )
  }

  if (
    normalized.context
      .audience
      .targetIds
      .length === 0
  ) {
    warnings.push(
      'Nenhum sujeito, grupo ou turma foi explicitamente vinculado.',
    )
  }

  if (
    normalized.context
      .links
      .evidenceIds
      .length === 0 &&
    normalized.diagnostic
      .sources
      .length === 0
  ) {
    warnings.push(
      'Nenhuma evidência ou fonte diagnóstica foi vinculada.',
    )
  }

  if (
    normalized.diagnostic
      .requiresAdditionalEvidence
  ) {
    warnings.push(
      'O diagnóstico informa necessidade de evidências adicionais.',
    )
  }

  if (
    normalized.privacy
      .containsSensitiveData &&
    !normalized.privacy.anonymized &&
    !normalized.privacy.pseudonymized
  ) {
    warnings.push(
      'Há dados sensíveis sem anonimização ou pseudonimização.',
    )
  }

  if (
    normalized.privacy
      .containsMinorData &&
    normalized.privacy
      .sensitivity === 'public'
  ) {
    errors.push(
      createError({
        code:
          'minor_data_public_visibility',

        message:
          'Dados de menores não podem ser classificados como públicos.',

        field:
          'privacy.sensitivity',
      }),
    )
  }

  return {
    valid:
      errors.length === 0,

    input:
      errors.length === 0
        ? normalized
        : null,

    warnings:
      uniqueStrings(warnings),

    errors,
  }
}

export function createPedagogicalInterventionSummary(
  intervention:
    PedagogicalIntervention,
): PedagogicalInterventionSummary {
  const completedActionCount =
    intervention.plan.actions
      .filter(
        action =>
          action.executionStatus ===
          'completed',
      )
      .length

  return {
    id:
      intervention.id,

    versionId:
      intervention.version.id,

    versionNumber:
      intervention.version
        .versionNumber,

    title:
      intervention.context.title,

    summary:
      intervention.plan.summary,

    status:
      intervention.status,

    priority:
      intervention.priority,

    riskLevel:
      intervention.diagnostic
        .risk
        .level,

    scope:
      intervention.context
        .audience
        .scope,

    teacherDecision:
      intervention.teacherDecision
        .decision,

    humanReviewStatus:
      intervention.humanReview
        .status,

    executionStatus:
      intervention.monitoring
        .executionStatus,

    evaluationStatus:
      intervention.effectiveness
        ?.status ??
      'not_started',

    objectiveCount:
      intervention.plan
        .objectives
        .length,

    actionCount:
      intervention.plan
        .actions
        .length,

    completedActionCount,

    progressPercentage:
      intervention.monitoring
        .progressPercentage,

    plannedStartAt:
      intervention.schedule
        .plannedStartAt,

    plannedEndAt:
      intervention.schedule
        .plannedEndAt,

    createdAt:
      intervention.createdAt,

    updatedAt:
      intervention.updatedAt,
  }
}

export function preparePedagogicalInterventionPersistence(
  intervention:
    PedagogicalIntervention,
): PedagogicalInterventionPersistencePayload {
  return {
    id:
      intervention.id,

    organizationId:
      intervention.organizationId ??
      null,

    schoolId:
      intervention.schoolId ??
      null,

    ownerUserId:
      intervention.ownerUserId ??
      null,

    status:
      intervention.status,

    priority:
      intervention.priority,

    source:
      intervention.source,

    sourceProduct:
      intervention.sourceProduct,

    capability:
      intervention.capability,

    context:
      intervention.context,

    diagnostic:
      intervention.diagnostic,

    plan:
      intervention.plan,

    expectedEvidence:
      intervention.expectedEvidence,

    indicators:
      intervention.indicators,

    successCriteria:
      intervention.successCriteria,

    schedule:
      intervention.schedule,

    humanReview:
      intervention.humanReview,

    teacherDecision:
      intervention.teacherDecision,

    monitoring:
      intervention.monitoring,

    effectiveness:
      intervention.effectiveness ??
      null,

    explainability:
      intervention.explainability,

    privacy:
      intervention.privacy,

    researchEligibility:
      intervention.researchEligibility,

    traceability:
      intervention.traceability,

    version:
      intervention.version,

    engine:
      intervention.engine,

    metadata: {
      ...intervention.metadata,

      preparedByService:
        SERVICE_NAME,

      preparedByServiceVersion:
        SERVICE_VERSION,

      preparedAt:
        nowIso(),
    },

    createdAt:
      intervention.createdAt,

    updatedAt:
      intervention.updatedAt,

    archivedAt:
      intervention.archivedAt ??
      null,
  }
}

export function generatePedagogicalInterventionService(
  input:
    GeneratePedagogicalInterventionInput,
): GeneratePedagogicalInterventionServiceResult {
  const startedAt =
    nowIso()

  const correlationId =
    normalizeText(
      input?.correlationId,
    ) ||
    `pedagogical-intervention-${startedAt}`

  const logs:
    PedagogicalInterventionServiceLog[] =
      [
        createLog({
          operation:
            'generate',

          status:
            'started',

          correlationId,

          startedAt,

          metadata: {
            stage:
              'request_received',
          },
        }),
      ]

  const validation =
    validatePedagogicalInterventionRequest(
      input,
    )

  if (
    !validation.valid ||
    !validation.input
  ) {
    const completedAt =
      nowIso()

    logs.push(
      createLog({
        operation:
          'validate',

        status:
          'rejected',

        correlationId,

        startedAt,

        completedAt,

        warnings:
          validation.warnings,

        errors:
          validation.errors,

        metadata: {
          stage:
            'request_validation',
        },
      }),
    )

    return {
      success:
        false,

      intervention:
        null,

      summary:
        null,

      persistencePayload:
        null,

      warnings:
        validation.warnings,

      errors:
        validation.errors,

      logs,

      meta:
        createMeta({
          correlationId,

          generatedAt:
            completedAt,

          metadata: {
            status:
              'rejected',
          },
        }),
    }
  }

  const normalizedInput =
    validation.input

  try {
    const result =
      generatePedagogicalIntervention(
        normalizedInput,
      )

    if (
      !result.success ||
      !result.intervention
    ) {
      const completedAt =
        nowIso()

      const errors =
        result.errors.map(
          (
            message,
            index,
          ) =>
            createError({
              code:
                `pedagogical_engine_error_${index + 1}`,

              message,

              details: {
                engineName:
                  result.engine.name,

                engineVersion:
                  result.engine.version,
              },
            }),
        )

      const warnings =
        uniqueStrings([
          ...validation.warnings,
          ...result.warnings,
        ])

      logs.push(
        createLog({
          operation:
            'generate',

          status:
            'failed',

          correlationId,

          startedAt,

          completedAt,

          warnings,

          errors,

          metadata: {
            stage:
              'engine_generation',
          },
        }),
      )

      return {
        success:
          false,

        intervention:
          null,

        summary:
          null,

        persistencePayload:
          null,

        warnings,

        errors,

        logs,

        meta:
          createMeta({
            correlationId,

            generatedAt:
              completedAt,

            metadata: {
              status:
                'failed',
            },
          }),
      }
    }

    const intervention =
      result.intervention

    const summary =
      createPedagogicalInterventionSummary(
        intervention,
      )

    const persistencePayload =
      preparePedagogicalInterventionPersistence(
        intervention,
      )

    const completedAt =
      nowIso()

    const warnings =
      uniqueStrings([
        ...validation.warnings,
        ...result.warnings,
      ])

    logs.push(
      createLog({
        operation:
          'generate',

        status:
          'completed',

        correlationId,

        startedAt,

        completedAt,

        interventionId:
          intervention.id,

        warnings,

        metadata: {
          stage:
            'service_completed',

          persisted:
            false,

          engineName:
            result.engine.name,

          engineVersion:
            result.engine.version,

          versionId:
            intervention.version.id,

          requiresHumanReview:
            intervention.humanReview
              .required,
        },
      }),
    )

    return {
      success:
        true,

      intervention,

      summary,

      persistencePayload,

      warnings,

      errors:
        [],

      logs,

      meta:
        createMeta({
          correlationId,

          generatedAt:
            completedAt,

          metadata: {
            status:
              'completed',

            interventionId:
              intervention.id,

            versionId:
              intervention.version.id,

            persisted:
              false,
          },
        }),
    }
  } catch (error) {
    const completedAt =
      nowIso()

    const serviceError =
      createError({
        code:
          'pedagogical_intervention_service_failure',

        message:
          getErrorMessage(error),

        details: {
          serviceName:
            SERVICE_NAME,

          serviceVersion:
            SERVICE_VERSION,
        },
      })

    logs.push(
      createLog({
        operation:
          'generate',

        status:
          'failed',

        correlationId,

        startedAt,

        completedAt,

        warnings:
          validation.warnings,

        errors: [
          serviceError,
        ],

        metadata: {
          stage:
            'service_exception',
        },
      }),
    )

    return {
      success:
        false,

      intervention:
        null,

      summary:
        null,

      persistencePayload:
        null,

      warnings:
        validation.warnings,

      errors: [
        serviceError,
      ],

      logs,

      meta:
        createMeta({
          correlationId,

          generatedAt:
            completedAt,

          metadata: {
            status:
              'failed',
          },
        }),
    }
  }
}

export function createPedagogicalInterventionApiResponse(
  result:
    GeneratePedagogicalInterventionServiceResult,
): PedagogicalInterventionApiResponse<{
  intervention:
    PedagogicalIntervention

  summary:
    PedagogicalInterventionSummary

  warnings: string[]

  logs:
    PedagogicalInterventionServiceLog[]
}> {
  if (
    !result.success ||
    !result.intervention ||
    !result.summary
  ) {
    return {
      success:
        false,

      data:
        null,

      errors:
        result.errors,

      meta:
        result.meta,
    }
  }

  return {
    success:
      true,

    data: {
      intervention:
        result.intervention,

      summary:
        result.summary,

      warnings:
        result.warnings,

      logs:
        result.logs,
    },

    errors:
      [],

    meta:
      result.meta,
  }
}