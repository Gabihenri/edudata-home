import type {
  AgendaEvidence,
} from '@/lib/agenda/repository/evidences.repository'

import {
  executeAgendaEvidenceIntelligence,
  type AgendaEvidenceIntelligenceFacadeResult,
} from '@/lib/agenda/services/agenda-evidence-intelligence.facade'

import type {
  AgendaEvidenceCreatedEventPayload,
} from '@/lib/agenda/events/agenda-evidence-created.event'

import type {
  EiosEvent,
  EiosEventHandler,
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

  processedAt:
    string
}

const HANDLER_NAME =
  'process-agenda-evidence-created-handler'

const HANDLER_VERSION =
  '1.0.0'

function nowIso(): string {
  return new Date()
    .toISOString()
}

function isRecord(
  value: unknown,
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

function normalizeOptionalText(
  value: unknown,
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
  error: unknown,
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

function assertAgendaEvidenceCreatedEvent(
  event: EiosEvent,
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
      'edi-protecao-menores-v1.0',

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

export function processAgendaEvidenceCreatedEvent(
  event: EiosEvent,
): ProcessAgendaEvidenceCreatedHandlerResult {
  assertAgendaEvidenceCreatedEvent(
    event,
  )

  const evidence =
    createAgendaEvidenceFromEvent(
      event,
    )

  const intelligence =
    executeAgendaEvidenceIntelligence({
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

    throw new Error(
      message,
    )
  }

  return {
    success:
      true,

    eventId:
      event.id,

    agendaEvidenceId:
      evidence.id,

    intelligence,

    processedAt:
      nowIso(),
  }
}

export const processAgendaEvidenceCreatedHandler:
  EiosEventHandler =
  async event => {
    try {
      const result =
        processAgendaEvidenceCreatedEvent(
          event,
        )

      console.info(
        '[AGENDA_EVIDENCE_CREATED_EVENT_PROCESSED]',
        {
          eventId:
            result.eventId,

          agendaEvidenceId:
            result.agendaEvidenceId,

          intelligenceStatus:
            result
              .intelligence
              .processing
              .status,

          requiresHumanReview:
            result
              .intelligence
              .processing
              .requiresHumanReview,

          warningCount:
            result
              .intelligence
              .processing
              .warnings
              .length,

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