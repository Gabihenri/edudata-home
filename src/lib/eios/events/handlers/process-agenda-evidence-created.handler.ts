import type {
  AgendaEvidence,
} from '@/lib/agenda/repository/evidences.repository'

import type {
  EvidenceIntelligenceJsonObject,
  EvidenceIntelligenceRun,
} from '@/lib/agenda/repository/evidence-intelligence-runs.repository'

import type {
  AgendaEvidenceCreatedEventPayload,
} from '@/lib/agenda/events/agenda-evidence-created.event'

import {
  executeAgendaEvidenceIntelligence,
  type AgendaEvidenceIntelligenceFacadeResult,
} from '@/lib/agenda/services/agenda-evidence-intelligence.facade'

import {
  generateAgendaEvidencePedagogicalInsights,
  type AgendaEvidencePedagogicalInsightsResult,
} from '@/lib/agenda/services/agenda-evidence-pedagogical-insights.service'

import {
  evidenceIntelligenceRunsService,
} from '@/lib/agenda/services/evidence-intelligence-runs.service'

import type {
  EiosEventHandler,
} from '@/lib/eios/events/eios-event-bus.service'

import type {
  EiosEvent,
} from '@/lib/eios/events/eios-event.contract'

export type ProcessAgendaEvidenceCreatedHandlerResult = {
  success:
    boolean

  eventId:
    string

  agendaEvidenceId:
    string

  intelligence:
    AgendaEvidenceIntelligenceFacadeResult

  pedagogicalInsights:
    AgendaEvidencePedagogicalInsightsResult

  persistedRun:
    EvidenceIntelligenceRun

  idempotent:
    boolean

  processedAt:
    string
}

const HANDLER_NAME =
  'process-agenda-evidence-created-handler'

const HANDLER_VERSION =
  '1.2.0'

const EVIDENCE_INTELLIGENCE_ENGINE_NAME =
  'evidence-intelligence'

const EVIDENCE_INTELLIGENCE_ENGINE_VERSION =
  '1.1.0'

const DEFAULT_PRIVACY_NOTICE_VERSION =
  'edi-protecao-menores-v1.0'

function nowIso(): string {
  return new Date()
    .toISOString()
}

function isRecord(
  value:
    unknown,
): value is Record<string, unknown> {
  return (
    typeof value ===
      'object' &&
    value !== null &&
    !Array.isArray(
      value,
    )
  )
}

function normalizeOptionalText(
  value:
    unknown,
): string | null {
  if (
    typeof value !==
      'string'
  ) {
    return null
  }

  const normalizedValue =
    value.trim()

  return normalizedValue ||
    null
}

function getErrorMessage(
  error:
    unknown,
): string {
  if (
    error instanceof Error
  ) {
    return error.message
  }

  if (
    typeof error ===
      'string' &&
    error.trim()
  ) {
    return error.trim()
  }

  return 'Erro inesperado ao processar o evento evidence.created.'
}

function toJsonObject(
  value:
    unknown,
): EvidenceIntelligenceJsonObject {
  if (
    isRecord(
      value,
    )
  ) {
    return {
      ...value,
    }
  }

  if (
    value === undefined ||
    value === null
  ) {
    return {}
  }

  return {
    value,
  }
}

function extractNormalizedScore(
  value:
    unknown,
): number | null {
  if (
    typeof value ===
      'number' &&
    Number.isFinite(
      value,
    )
  ) {
    if (
      value >= 0 &&
      value <= 1
    ) {
      return value
    }

    if (
      value > 1 &&
      value <= 100
    ) {
      return value /
        100
    }

    return null
  }

  if (
    !isRecord(
      value,
    )
  ) {
    return null
  }

  const candidateKeys = [
    'score',
    'value',
    'normalizedScore',
    'normalizedValue',
    'confidence',
    'qualityScore',
    'reliabilityScore',
  ]

  for (
    const key
    of candidateKeys
  ) {
    const candidate =
      value[key]

    if (
      typeof candidate !==
        'number' ||
      !Number.isFinite(
        candidate,
      )
    ) {
      continue
    }

    if (
      candidate >= 0 &&
      candidate <= 1
    ) {
      return candidate
    }

    if (
      candidate > 1 &&
      candidate <= 100
    ) {
      return candidate /
        100
    }
  }

  return null
}

function extractConfidenceScore({
  quality,
  reliability,
  validation,
}: {
  quality:
    unknown

  reliability:
    unknown

  validation:
    unknown
}): number | null {
  const validationScore =
    extractNormalizedScore(
      validation,
    )

  if (
    validationScore !==
      null
  ) {
    return validationScore
  }

  const qualityScore =
    extractNormalizedScore(
      quality,
    )

  const reliabilityScore =
    extractNormalizedScore(
      reliability,
    )

  if (
    qualityScore !==
      null &&
    reliabilityScore !==
      null
  ) {
    return (
      qualityScore +
      reliabilityScore
    ) /
      2
  }

  return qualityScore ??
    reliabilityScore
}

function createIdempotencyKey(
  event:
    EiosEvent,
): string {
  return [
    EVIDENCE_INTELLIGENCE_ENGINE_NAME,
    EVIDENCE_INTELLIGENCE_ENGINE_VERSION,
    event.id,
  ].join(':')
}

function assertAgendaEvidenceCreatedEvent(
  event:
    EiosEvent,
): asserts event is EiosEvent<
  AgendaEvidenceCreatedEventPayload
> {
  if (
    event.name !==
      'evidence.created'
  ) {
    throw new Error(
      `Evento incompatível com o handler: ${event.name}.`,
    )
  }

  if (
    event.domain !==
      'evidence'
  ) {
    throw new Error(
      `Domínio incompatível com o handler: ${event.domain}.`,
    )
  }

  if (
    event.action !==
      'created'
  ) {
    throw new Error(
      `Ação incompatível com o handler: ${event.action}.`,
    )
  }

  if (
    event.sourceProduct !==
      'agenda'
  ) {
    throw new Error(
      `Produto de origem incompatível com o handler: ${event.sourceProduct}.`,
    )
  }

  if (
    !isRecord(
      event.payload,
    )
  ) {
    throw new Error(
      'O payload do evento não possui formato válido.',
    )
  }

  const agendaEvidenceId =
    normalizeOptionalText(
      event.payload
        .agendaEvidenceId,
    )

  if (!agendaEvidenceId) {
    throw new Error(
      'O evento não possui agendaEvidenceId.',
    )
  }

  const title =
    normalizeOptionalText(
      event.payload.title,
    )

  if (!title) {
    throw new Error(
      'O evento não possui título da evidência.',
    )
  }
}

function createAgendaEvidenceFromEvent(
  event:
    EiosEvent<
      AgendaEvidenceCreatedEventPayload
    >,
): AgendaEvidence {
  const payload =
    event.payload

  const privacyMetadata =
    event.privacy
      .metadata

  return {
    id:
      payload.agendaEvidenceId,

    title:
      payload.title,

    description:
      payload.description,

    evidence_type:
      payload.evidenceType,

    file_url:
      payload.fileUrl,

    external_url:
      payload.externalUrl,

    planning_id:
      payload.planningId,

    event_id:
      payload.eventId,

    lesson_id:
      payload.lessonId,

    objective_id:
      payload.objectiveId,

    class_id:
      payload.classId,

    reflection_id:
      payload.reflectionId,

    academic_period_id:
      payload.academicPeriodId,

    organization_id:
      payload.organizationId,

    school_id:
      payload.schoolId,

    user_id:
      payload.userId,

    contains_identifiable_minor:
      payload
        .containsIdentifiableMinor,

    guardian_authorization_confirmed:
      payload
        .guardianAuthorizationConfirmed,

    authorization_reference:
      payload.authorizationReference,

    authorization_confirmed_at:
      normalizeOptionalText(
        privacyMetadata
          .authorizationConfirmedAt,
      ),

    authorization_confirmed_by:
      normalizeOptionalText(
        privacyMetadata
          .authorizationConfirmedBy,
      ),

    privacy_notice_version:
      payload
        .privacyNoticeVersion ??
      DEFAULT_PRIVACY_NOTICE_VERSION,

    storage_bucket:
      payload.storageBucket,

    storage_path:
      payload.storagePath,

    original_file_name:
      payload.originalFileName,

    file_mime_type:
      payload.fileMimeType,

    file_size_bytes:
      payload.fileSizeBytes,

    metadata: {
      ...payload.metadata,

      sourceEventId:
        event.id,

      sourceEventName:
        event.name,

      sourceEventVersion:
        event.version,

      eventContractVersion:
        event.contractVersion,

      eventCorrelationId:
        event.correlation
          .correlationId,

      eventCausationId:
        event.correlation
          .causationId,

      eventParentEventId:
        event.correlation
          .parentEventId,

      eventTraceId:
        event.correlation
          .traceId,

      eventSourceProduct:
        event.sourceProduct,

      eventSourceService:
        event.sourceService,

      processedBy:
        HANDLER_NAME,

      handlerVersion:
        HANDLER_VERSION,
    },

    created_by:
      event.actor.id,

    updated_by:
      event.actor.id,

    deleted_at:
      null,

    deleted_by:
      null,

    deletion_reason:
      null,

    restored_at:
      null,

    restored_by:
      null,

    restore_reason:
      null,

    created_at:
      payload.createdAt,

    updated_at:
      payload.updatedAt,
  }
}

function executeIntelligence({
  event,
  evidence,
}: {
  event:
    EiosEvent<
      AgendaEvidenceCreatedEventPayload
    >

  evidence:
    AgendaEvidence
}): AgendaEvidenceIntelligenceFacadeResult {
  return executeAgendaEvidenceIntelligence({
    evidence,

    requestedBy:
      event.actor.id,

    source:
      HANDLER_NAME,

    options: {
      adapterOptions: {
        occurredAt:
          event.occurredAt,

        teacherId:
          event.actor.id,

        additionalMetadata: {
          sourceEventId:
            event.id,

          sourceEventName:
            event.name,

          correlationId:
            event.correlation
              .correlationId,

          causationId:
            event.correlation
              .causationId,

          parentEventId:
            event.correlation
              .parentEventId,

          traceId:
            event.correlation
              .traceId,

          handler:
            HANDLER_NAME,

          handlerVersion:
            HANDLER_VERSION,
        },
      },

      processingOptions: {
        validate:
          true,

        classifyFramework:
          true,

        evaluateQuality:
          true,

        evaluateReliability:
          true,

        detectContradictions:
          false,

        consolidate:
          false,

        linkKnowledgeGraph:
          false,

        allowAutomaticValidation:
          false,

        allowAutomaticClassification:
          true,

        requireHumanReviewForSensitiveData:
          true,

        minimumConfidenceForAutomaticValidation:
          0.9,

        metadata: {
          sourceEventId:
            event.id,

          sourceEventName:
            event.name,

          correlationId:
            event.correlation
              .correlationId,

          causationId:
            event.correlation
              .causationId,

          parentEventId:
            event.correlation
              .parentEventId,

          traceId:
            event.correlation
              .traceId,

          handler:
            HANDLER_NAME,

          handlerVersion:
            HANDLER_VERSION,
        },
      },
    },
  })
}

function generatePedagogicalInsights({
  evidence,
  intelligence,
}: {
  evidence:
    AgendaEvidence

  intelligence:
    AgendaEvidenceIntelligenceFacadeResult
}): AgendaEvidencePedagogicalInsightsResult {
  return generateAgendaEvidencePedagogicalInsights({
    evidence,

    intelligence:
      intelligence.processing,
  })
}

export async function processAgendaEvidenceCreatedEvent(
  receivedEvent:
    EiosEvent,
): Promise<
  ProcessAgendaEvidenceCreatedHandlerResult
> {
  assertAgendaEvidenceCreatedEvent(
    receivedEvent,
  )

  const event =
    receivedEvent

  const evidence =
    createAgendaEvidenceFromEvent(
      event,
    )

  const idempotencyKey =
    createIdempotencyKey(
      event,
    )

  const startResult =
    await evidenceIntelligenceRunsService.start({
      evidenceId:
        evidence.id,

      eventId:
        event.id,

      idempotencyKey,

      engineName:
        EVIDENCE_INTELLIGENCE_ENGINE_NAME,

      engineVersion:
        EVIDENCE_INTELLIGENCE_ENGINE_VERSION,

      contractVersion:
        event.contractVersion,

      processingSource:
        HANDLER_NAME,

      requestedBy:
        event.actor.id,

      correlationId:
        event.correlation
          .correlationId,

      causationId:
        event.correlation
          .causationId,

      parentEventId:
        event.correlation
          .parentEventId,

      traceId:
        event.correlation
          .traceId,

      metadata: {
        handler:
          HANDLER_NAME,

        handlerVersion:
          HANDLER_VERSION,

        eventName:
          event.name,

        eventVersion:
          event.version,

        eventSourceProduct:
          event.sourceProduct,

        eventSourceService:
          event.sourceService,

        containsMinorData:
          event.privacy
            .containsMinorData,

        eventOccurredAt:
          event.occurredAt,

        pedagogicalInsightsEnabled:
          true,
      },
    })

  /*
   * Uma execução finalizada com a mesma chave representa
   * um retry já processado. O resultado persistido é
   * reaproveitado, evitando nova gravação.
   */
  if (
    startResult.idempotent &&
    (
      startResult.run
        .processing_status ===
          'completed' ||
      startResult.run
        .processing_status ===
          'requires_human_review'
    )
  ) {
    const intelligence =
      executeIntelligence({
        event,
        evidence,
      })

    const pedagogicalInsights =
      generatePedagogicalInsights({
        evidence,
        intelligence,
      })

    return {
      success:
        true,

      eventId:
        event.id,

      agendaEvidenceId:
        evidence.id,

      intelligence,

      pedagogicalInsights,

      persistedRun:
        startResult.run,

      idempotent:
        true,

      processedAt:
        startResult.run
          .processed_at ??
        nowIso(),
    }
  }

  const processingRun =
    await evidenceIntelligenceRunsService
      .markProcessing(
        startResult.run.id,
      )

  try {
    const intelligence =
      executeIntelligence({
        event,
        evidence,
      })

    if (
      !intelligence.success
    ) {
      const errors =
        intelligence
          .processing
          .errors

      const message =
        errors.length >
          0
          ? errors.join(
              ' | ',
            )
          : 'O Evidence Intelligence não concluiu o processamento da evidência.'

      await evidenceIntelligenceRunsService.fail(
        processingRun.id,
        {
          error:
            message,

          errors: [
            ...errors,
          ],

          warnings: [
            ...intelligence
              .processing
              .warnings,
          ],

          metadata: {
            intelligenceStatus:
              intelligence
                .processing
                .status,

            requiresHumanReview:
              intelligence
                .processing
                .requiresHumanReview,

            intelligenceCompletedAt:
              intelligence
                .context
                .completedAt,

            pedagogicalInsightsGenerated:
              false,
          },
        },
      )

      throw new Error(
        message,
      )
    }

    const pedagogicalInsights =
      generatePedagogicalInsights({
        evidence,
        intelligence,
      })

    const quality =
      intelligence
        .processing
        .quality

    const reliability =
      intelligence
        .processing
        .reliability

    const validation =
      intelligence
        .processing
        .validation

    const requiresHumanReview =
      intelligence
        .processing
        .requiresHumanReview ||
      pedagogicalInsights
        .requiresHumanReview

    const persistedRun =
      await evidenceIntelligenceRunsService.complete(
        processingRun.id,
        {
          qualityScore:
            extractNormalizedScore(
              quality,
            ),

          reliabilityScore:
            extractNormalizedScore(
              reliability,
            ),

          confidenceScore:
            extractConfidenceScore({
              quality,
              reliability,
              validation,
            }),

          quality:
            toJsonObject(
              quality,
            ),

          reliability:
            toJsonObject(
              reliability,
            ),

          frameworkClassifications: [
            ...intelligence
              .processing
              .classifications,
          ],

          validation:
            toJsonObject(
              validation,
            ),

          explanation: {
            source:
              HANDLER_NAME,

            handlerVersion:
              HANDLER_VERSION,

            engineName:
              EVIDENCE_INTELLIGENCE_ENGINE_NAME,

            engineVersion:
              EVIDENCE_INTELLIGENCE_ENGINE_VERSION,

            intelligenceStatus:
              intelligence
                .processing
                .status,

            agendaEvidenceId:
              evidence.id,

            eventId:
              event.id,

            processedAt:
              intelligence
                .processing
                .processedAt,

            pedagogicalInsights: {
              success:
                pedagogicalInsights
                  .success,

              summary:
                pedagogicalInsights
                  .summary,

              evidenceScore:
                pedagogicalInsights
                  .evidenceScore,

              inclusionScore:
                pedagogicalInsights
                  .inclusionScore,

              intelligenceScore:
                pedagogicalInsights
                  .intelligenceScore,

              overallScore:
                pedagogicalInsights
                  .overallScore,

              dimensions:
                pedagogicalInsights
                  .dimensions,

              insights:
                pedagogicalInsights
                  .insights,

              strengths:
                pedagogicalInsights
                  .strengths,

              improvementOpportunities:
                pedagogicalInsights
                  .improvementOpportunities,

              recommendedNextActions:
                pedagogicalInsights
                  .recommendedNextActions,

              requiresHumanReview:
                pedagogicalInsights
                  .requiresHumanReview,

              generatedAt:
                pedagogicalInsights
                  .generatedAt,

              engine:
                pedagogicalInsights
                  .engine,

              metadata:
                pedagogicalInsights
                  .metadata,
            },
          },

          warnings: [
            ...intelligence
              .processing
              .warnings,
          ],

          errors: [
            ...intelligence
              .processing
              .errors,
          ],

          requiresHumanReview,

          processedAt:
            intelligence
              .processing
              .processedAt,

          metadata: {
            intelligenceStartedAt:
              intelligence
                .context
                .startedAt,

            intelligenceCompletedAt:
              intelligence
                .context
                .completedAt,

            integrationSource:
              intelligence
                .context
                .source,

            eventId:
              event.id,

            idempotencyKey,

            pedagogicalInsightsGenerated:
              true,

            pedagogicalInsightsEngine:
              pedagogicalInsights
                .engine
                .name,

            pedagogicalInsightsVersion:
              pedagogicalInsights
                .engine
                .version,

            pedagogicalInsightsMode:
              pedagogicalInsights
                .engine
                .mode,

            pedagogicalInsightsGeneratedAt:
              pedagogicalInsights
                .generatedAt,

            pedagogicalOverallScore:
              pedagogicalInsights
                .overallScore,

            pedagogicalEvidenceScore:
              pedagogicalInsights
                .evidenceScore,

            pedagogicalInclusionScore:
              pedagogicalInsights
                .inclusionScore,

            pedagogicalIntelligenceScore:
              pedagogicalInsights
                .intelligenceScore,

            pedagogicalInsightCount:
              pedagogicalInsights
                .insights
                .length,

            pedagogicalStrengthCount:
              pedagogicalInsights
                .strengths
                .length,

            pedagogicalImprovementOpportunityCount:
              pedagogicalInsights
                .improvementOpportunities
                .length,

            pedagogicalRecommendedActionCount:
              pedagogicalInsights
                .recommendedNextActions
                .length,

            pedagogicalRequiresHumanReview:
              pedagogicalInsights
                .requiresHumanReview,
          },
        },
      )

    return {
      success:
        true,

      eventId:
        event.id,

      agendaEvidenceId:
        evidence.id,

      intelligence,

      pedagogicalInsights,

      persistedRun,

      idempotent:
        startResult.idempotent,

      processedAt:
        persistedRun
          .processed_at ??
        nowIso(),
    }
  } catch (
    error
  ) {
    const currentRun =
      await evidenceIntelligenceRunsService
        .findById(
          processingRun.id,
        )

    if (
      currentRun &&
      currentRun.processing_status !==
        'failed'
    ) {
      await evidenceIntelligenceRunsService.fail(
        currentRun.id,
        {
          error,

          metadata: {
            eventId:
              event.id,

            agendaEvidenceId:
              evidence.id,

            handler:
              HANDLER_NAME,

            handlerVersion:
              HANDLER_VERSION,

            pedagogicalInsightsGenerated:
              false,
          },
        },
      )
    }

    throw error
  }
}

export const processAgendaEvidenceCreatedHandler:
  EiosEventHandler =
  async event => {
    try {
      const result =
        await processAgendaEvidenceCreatedEvent(
          event,
        )

      console.info(
        '[AGENDA_EVIDENCE_CREATED_EVENT_PROCESSED]',
        {
          eventId:
            result.eventId,

          agendaEvidenceId:
            result.agendaEvidenceId,

          intelligenceRunId:
            result.persistedRun.id,

          persistenceStatus:
            result
              .persistedRun
              .processing_status,

          intelligenceStatus:
            result
              .intelligence
              .processing
              .status,

          requiresHumanReview:
            result
              .pedagogicalInsights
              .requiresHumanReview,

          warningCount:
            result
              .intelligence
              .processing
              .warnings
              .length,

          pedagogicalOverallScore:
            result
              .pedagogicalInsights
              .overallScore,

          pedagogicalEvidenceScore:
            result
              .pedagogicalInsights
              .evidenceScore,

          pedagogicalInclusionScore:
            result
              .pedagogicalInsights
              .inclusionScore,

          pedagogicalIntelligenceScore:
            result
              .pedagogicalInsights
              .intelligenceScore,

          pedagogicalInsightCount:
            result
              .pedagogicalInsights
              .insights
              .length,

          recommendedActionCount:
            result
              .pedagogicalInsights
              .recommendedNextActions
              .length,

          idempotent:
            result.idempotent,

          processedAt:
            result.processedAt,

          handler:
            HANDLER_NAME,

          handlerVersion:
            HANDLER_VERSION,
        },
      )
    } catch (
      error
    ) {
      const message =
        getErrorMessage(
          error,
        )

      console.error(
        '[AGENDA_EVIDENCE_CREATED_EVENT_HANDLER_ERROR]',
        {
          eventId:
            event.id,

          eventName:
            event.name,

          primaryEntityId:
            event.primaryEntity
              .entityId,

          message,

          occurredAt:
            nowIso(),

          handler:
            HANDLER_NAME,

          handlerVersion:
            HANDLER_VERSION,
        },
      )

      throw error
    }
  }

export const agendaEvidenceCreatedEventHandler = {
  name:
    HANDLER_NAME,

  version:
    HANDLER_VERSION,

  handle:
    processAgendaEvidenceCreatedHandler,

  process:
    processAgendaEvidenceCreatedEvent,
}