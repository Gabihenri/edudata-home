/**
 * EduData IA — EIOS
 * Capability 02: Pedagogical Copilot
 *
 * Serviço de aplicação para geração e preparação de
 * intervenções pedagógicas.
 *
 * Arquitetura:
 * Framework EDI
 * → EIOS
 * → Core Compartilhado
 * → Produtos Especializados
 *
 * Fluxo:
 * API / Produto
 * → PedagogicalInterventionService
 * → PedagogicalInterventionEngine
 * → Contrato de domínio
 *
 * Este serviço:
 * - valida e normaliza solicitações;
 * - centraliza a execução do motor;
 * - padroniza erros e avisos;
 * - produz registros operacionais do EIOS;
 * - prepara dados para persistência futura;
 * - não acessa diretamente React, Next.js ou Supabase.
 */

import {
  generatePedagogicalIntervention,
} from './pedagogical-intervention.engine'

import type {
  GeneratePedagogicalInterventionInput,
  GeneratePedagogicalInterventionResult,
  PedagogicalIntervention,
  PedagogicalInterventionApiError,
  PedagogicalInterventionApiMeta,
  PedagogicalInterventionApiResponse,
  PedagogicalInterventionAuditEvent,
  PedagogicalInterventionMetadata,
  PedagogicalInterventionProduct,
  PedagogicalInterventionSource,
  PedagogicalInterventionSummary,
} from './pedagogical-intervention.types'

const SERVICE_NAME =
  'pedagogical-intervention-service'

const SERVICE_VERSION =
  '1.0.0'

const CAPABILITY_NAME =
  'pedagogical_copilot'

export type PedagogicalInterventionServiceOperation =
  | 'generate'
  | 'validate'
  | 'prepare_persistence'
  | 'summarize'

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

  sourceProduct:
    PedagogicalInterventionProduct

  source:
    PedagogicalInterventionSource

  startedAt: string

  completedAt?: string | null

  durationMs?: number | null

  interventionId?: string | null

  userId?: string | null

  organizationId?: string | null

  schoolId?: string | null

  warnings: string[]

  errors:
    PedagogicalInterventionApiError[]

  metadata:
    PedagogicalInterventionMetadata
}

export type PedagogicalInterventionServiceValidation = {
  valid: boolean

  errors:
    PedagogicalInterventionApiError[]

  warnings: string[]

  normalizedInput:
    GeneratePedagogicalInterventionInput | null
}

export type PedagogicalInterventionPersistencePayload = {
  interventionId: string

  versionId: string

  organizationId: string | null

  schoolId: string | null

  ownerUserId: string | null

  status: string

  priority: string

  source: string

  sourceProduct: string

  capability: string

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
  return new Date()
    .toISOString()
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

function normalizeText(
  value:
    string | null | undefined,
): string {
  if (
    typeof value !== 'string'
  ) {
    return ''
  }

  return value.trim()
}

function normalizeNullableText(
  value:
    string | null | undefined,
): string | null {
  const normalized =
    normalizeText(value)

  return normalized || null
}

function createLogId(
  correlationId: string,
  operation:
    PedagogicalInterventionServiceOperation,
  timestamp: string,
): string {
  const normalized =
    `${correlationId}-${operation}-${timestamp}`
      .toLowerCase()
      .replace(
        /[^a-z0-9]+/g,
        '-',
      )
      .replace(
        /^-+|-+$/g,
        '',
      )

  return `pedagogical-service-${normalized}`
}

function createApiError({
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

function calculateDuration(
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
            input.context.audience
              .targetIds,
          ),

        groupId:
          normalizeNullableText(
            input.context.audience
              .groupId,
          ),

        groupLabel:
          normalizeNullableText(
            input.context.audience
              .groupLabel,
          ),

        selectionRationale:
          normalizeNullableText(
            input.context.audience
              .selectionRationale,
          ),
      },

      links: {
        ...input.context.links,

        organizationId:
          normalizeNullableText(
            input.context.links
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
            input.context.links
              .planningIds,
          ),

        lessonIds:
          uniqueStrings(
            input.context.links.lessonIds,
          ),

        learningObjectiveIds:
          uniqueStrings(
            input.context.links
              .learningObjectiveIds,
          ),

        skillIds:
          uniqueStrings(
            input.context.links.skillIds,
          ),

        competencyIds:
          uniqueStrings(
            input.context.links
              .competencyIds,
          ),

        curriculumReferenceIds:
          uniqueStrings(
            input.context.links
              .curriculumReferenceIds,
          ),

        evidenceIds:
          uniqueStrings(
            input.context.links
              .evidenceIds,
          ),

        indicatorIds:
          uniqueStrings(
            input.context.links
              .indicatorIds,
          ),

        assessmentIds:
          uniqueStrings(
            input.context.links
              .assessmentIds,
          ),

        assessmentResultIds:
          uniqueStrings(
            input.context.links
              .assessmentResultIds,
          ),

        relatedInterventionIds:
          uniqueStrings(
            input.context.links
              .relatedInterventionIds,
          ),

        additionalEntities:
          input.context.links
            .additionalEntities.map(
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
                Boolean(entity.entityId),
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
          .probableCauses.map(
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
        input.diagnostic.sources
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
            input.diagnostic.risk
              .summary,
          ),

        types:
          Array.from(
            new Set(
              input.diagnostic.risk
                .types,
            ),
          ),

        signals:
          uniqueStrings(
            input.diagnostic.risk
              .signals,
          ),

        protectiveFactors:
          uniqueStrings(
            input.diagnostic.risk
              .protectiveFactors,
          ),

        aggravatingFactors:
          uniqueStrings(
            input.diagnostic.risk
              .aggravatingFactors,
          ),

        limitations:
          uniqueStrings(
            input.diagnostic.risk
              .limitations,
          ),
      },
    },

    privacy: {
      ...input.privacy,

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

      legalBasis:
        input.privacy.legalBasis ??
        null,

      retentionPolicy:
        normalizeNullableText(
          input.privacy
            .retentionPolicy,
        ),

      notes:
        normalizeNullableText(
          input.privacy.notes,
        ),
    },

    researchEligibility:
      input.researchEligibility
        ? {
            ...input
              .researchEligibility,

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
    GeneratePedagog