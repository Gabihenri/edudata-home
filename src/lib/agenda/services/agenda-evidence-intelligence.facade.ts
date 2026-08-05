import type {
  AgendaEvidence,
} from '@/lib/agenda/repository/evidences.repository'

import {
  processAgendaEvidenceIntelligence,
  type AgendaEvidenceIntelligenceOptions,
  type AgendaEvidenceIntelligenceResult,
} from '@/lib/agenda/services/agenda-evidence-intelligence.service'

export type AgendaEvidenceIntelligenceFacadeInput = {
  evidence:
    AgendaEvidence

  requestedBy?:
    string | null

  source?:
    string

  options?:
    AgendaEvidenceIntelligenceOptions
}

export type AgendaEvidenceIntelligenceFacadeResult = {
  success:
    boolean

  processing:
    AgendaEvidenceIntelligenceResult

  context: {
    agendaEvidenceId:
      string

    requestedBy:
      string | null

    source:
      string

    startedAt:
      string

    completedAt:
      string
  }
}

const DEFAULT_SOURCE =
  'agenda-evidence-intelligence-facade'

function nowIso(): string {
  return new Date()
    .toISOString()
}

function normalizeOptionalText(
  value:
    string | null | undefined,
): string | null {
  if (
    typeof value !==
      'string'
  ) {
    return null
  }

  return value.trim() ||
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

  return 'Erro inesperado na integração da evidência da Agenda com o EIOS.'
}

function createFallbackProcessingResult({
  evidence,
  error,
}: {
  evidence:
    AgendaEvidence

  error:
    unknown
}): AgendaEvidenceIntelligenceResult {
  return {
    success:
      false,

    status:
      'failed',

    agendaEvidenceId:
      evidence.id,

    evidence:
      null,

    validation:
      null,

    quality:
      null,

    reliability:
      null,

    classifications:
      [],

    warnings:
      [],

    errors: [
      getErrorMessage(
        error,
      ),
    ],

    requiresHumanReview:
      true,

    processedAt:
      nowIso(),
  }
}

export function executeAgendaEvidenceIntelligence({
  evidence,
  requestedBy,
  source,
  options = {},
}: AgendaEvidenceIntelligenceFacadeInput):
  AgendaEvidenceIntelligenceFacadeResult {
  const startedAt =
    nowIso()

  const normalizedRequestedBy =
    normalizeOptionalText(
      requestedBy,
    ) ??
    evidence.user_id ??
    evidence.created_by ??
    null

  const normalizedSource =
    normalizeOptionalText(
      source,
    ) ??
    DEFAULT_SOURCE

  let processing:
    AgendaEvidenceIntelligenceResult

  try {
    processing =
      processAgendaEvidenceIntelligence({
        agendaEvidence:
          evidence,

        options: {
          ...options,

          adapterOptions: {
            ...options
              .adapterOptions,

            teacherId:
              options
                .adapterOptions
                ?.teacherId ??
              normalizedRequestedBy,

            additionalMetadata: {
              ...options
                .adapterOptions
                ?.additionalMetadata,

              facade:
                DEFAULT_SOURCE,

              integrationSource:
                normalizedSource,

              requestedBy:
                normalizedRequestedBy,

              startedAt,
            },
          },

          processingOptions: {
            ...options
              .processingOptions,

            metadata: {
              ...options
                .processingOptions
                ?.metadata,

              facade:
                DEFAULT_SOURCE,

              integrationSource:
                normalizedSource,

              requestedBy:
                normalizedRequestedBy,

              startedAt,
            },
          },
        },
      })
  } catch (
    error
  ) {
    console.error(
      '[AGENDA_EVIDENCE_INTELLIGENCE_FACADE_ERROR]',
      {
        agendaEvidenceId:
          evidence.id,

        requestedBy:
          normalizedRequestedBy,

        source:
          normalizedSource,

        message:
          getErrorMessage(
            error,
          ),

        occurredAt:
          nowIso(),
      },
    )

    processing =
      createFallbackProcessingResult({
        evidence,
        error,
      })
  }

  const completedAt =
    nowIso()

  if (
    !processing.success
  ) {
    console.warn(
      '[AGENDA_EVIDENCE_INTELLIGENCE_NOT_COMPLETED]',
      {
        agendaEvidenceId:
          evidence.id,

        status:
          processing.status,

        warningCount:
          processing
            .warnings
            .length,

        errorCount:
          processing
            .errors
            .length,

        requiresHumanReview:
          processing
            .requiresHumanReview,

        requestedBy:
          normalizedRequestedBy,

        source:
          normalizedSource,

        completedAt,
      },
    )
  }

  return {
    success:
      processing.success,

    processing,

    context: {
      agendaEvidenceId:
        evidence.id,

      requestedBy:
        normalizedRequestedBy,

      source:
        normalizedSource,

      startedAt,

      completedAt,
    },
  }
}

export const agendaEvidenceIntelligenceFacade = {
  execute:
    executeAgendaEvidenceIntelligence,
}