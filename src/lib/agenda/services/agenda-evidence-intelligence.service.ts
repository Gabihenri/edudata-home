import type {
  AgendaEvidence,
} from '@/lib/agenda/repository/evidences.repository'

import {
  adaptAgendaEvidenceToEducationalEvidence,
  type AgendaEvidenceAdapterOptions,
  type AgendaEvidenceAdapterResult,
} from '@/lib/eios/evidence-intelligence/adapters/agenda-evidence.adapter'

import type {
  EducationalEvidence,
  EvidenceFrameworkClassification,
  EvidenceProcessingOptions,
  EvidenceQualityAssessment,
  EvidenceReliabilityAssessment,
  EvidenceValidationResult,
} from '@/lib/eios/evidence-intelligence/evidence-intelligence.contract'

import {
  evaluateEducationalEvidence,
  validateEducationalEvidence,
  type EvidenceEvaluationResult,
} from '@/lib/eios/evidence-intelligence/evidence-intelligence.service'

export type AgendaEvidenceIntelligenceStatus =
  | 'completed'
  | 'completed_with_warnings'
  | 'requires_human_review'
  | 'failed'

export type AgendaEvidenceIntelligenceOptions = {
  adapterOptions?: AgendaEvidenceAdapterOptions

  processingOptions?: Partial<
    EvidenceProcessingOptions
  >

  requestedBy?: string | null

  source?: string

  throwOnError?: boolean
}

export type AgendaEvidenceIntelligenceResult = {
  success: boolean

  status:
    AgendaEvidenceIntelligenceStatus

  agendaEvidenceId: string

  educationalEvidence:
    EducationalEvidence | null

  adaptation:
    AgendaEvidenceAdapterResult

  validation:
    EvidenceValidationResult | null

  quality:
    EvidenceQualityAssessment | null

  reliability:
    EvidenceReliabilityAssessment | null

  classifications:
    EvidenceFrameworkClassification[]

  warnings: string[]

  errors: string[]

  requiresHumanReview: boolean

  processedAt: string

  processingVersion: string

  metadata: Record<string, unknown>
}

const SERVICE_NAME =
  'agenda-evidence-intelligence'

const SERVICE_VERSION =
  'v1'

const DEFAULT_PROCESSING_OPTIONS:
  EvidenceProcessingOptions = {
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
    source:
      SERVICE_NAME,

    version:
      SERVICE_VERSION,
  },
}

function nowIso(): string {
  return new Date()
    .toISOString()
}

function uniqueStrings(
  values: string[],
): string[] {
  return Array.from(
    new Set(
      values
        .map(
          value =>
            value.trim(),
        )
        .filter(
          Boolean,
        ),
    ),
  )
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

  return 'Erro inesperado ao processar a evidência da Agenda no EIOS.'
}

function mergeProcessingOptions({
  receivedOptions,
  agendaEvidence,
  requestedBy,
  source,
}: {
  receivedOptions?:
    Partial<EvidenceProcessingOptions>

  agendaEvidence:
    AgendaEvidence

  requestedBy:
    string | null

  source:
    string
}): EvidenceProcessingOptions {
  return {
    ...DEFAULT_PROCESSING_OPTIONS,
    ...receivedOptions,

    metadata: {
      ...DEFAULT_PROCESSING_OPTIONS
        .metadata,

      ...receivedOptions
        ?.metadata,

      source,

      service:
        SERVICE_NAME,

      serviceVersion:
        SERVICE_VERSION,

      agendaEvidenceId:
        agendaEvidence.id,

      agendaEvidenceType:
        agendaEvidence
          .evidence_type,

      organizationId:
        agendaEvidence
          .organization_id,

      schoolId:
        agendaEvidence
          .school_id,

      classId:
        agendaEvidence
          .class_id,

      lessonId:
        agendaEvidence
          .lesson_id,

      planningId:
        agendaEvidence
          .planning_id,

      requestedBy,

      requestedAt:
        nowIso(),
    },
  }
}

function determineStatus({
  success,
  warnings,
  errors,
  requiresHumanReview,
}: {
  success: boolean
  warnings: string[]
  errors: string[]
  requiresHumanReview: boolean
}): AgendaEvidenceIntelligenceStatus {
  if (
    !success ||
    errors.length >
      0
  ) {
    return 'failed'
  }

  if (
    requiresHumanReview
  ) {
    return 'requires_human_review'
  }

  if (
    warnings.length >
      0
  ) {
    return 'completed_with_warnings'
  }

  return 'completed'
}

function createFailedResult({
  agendaEvidence,
  adaptation,
  validation = null,
  warnings = [],
  errors,
  requestedBy,
  source,
}: {
  agendaEvidence:
    AgendaEvidence

  adaptation:
    AgendaEvidenceAdapterResult

  validation?:
    EvidenceValidationResult | null

  warnings?: string[]

  errors:
    string[]

  requestedBy:
    string | null

  source:
    string
}): AgendaEvidenceIntelligenceResult {
  const consolidatedWarnings =
    uniqueStrings([
      ...adaptation.warnings,
      ...warnings,
    ])

  const consolidatedErrors =
    uniqueStrings([
      ...adaptation.errors,
      ...errors,
    ])

  return {
    success:
      false,

    status:
      'failed',

    agendaEvidenceId:
      agendaEvidence.id,

    educationalEvidence:
      adaptation.evidence,

    adaptation,

    validation,

    quality:
      adaptation.evidence
        ?.quality ??
      null,

    reliability:
      adaptation.evidence
        ?.reliability ??
      null,

    classifications:
      adaptation.evidence
        ?.frameworkClassifications ??
      [],

    warnings:
      consolidatedWarnings,

    errors:
      consolidatedErrors,

    requiresHumanReview:
      true,

    processedAt:
      nowIso(),

    processingVersion:
      SERVICE_VERSION,

    metadata: {
      service:
        SERVICE_NAME,

      serviceVersion:
        SERVICE_VERSION,

      source,

      requestedBy,

      agendaEvidenceId:
        agendaEvidence.id,

      agendaEvidenceType:
        agendaEvidence
          .evidence_type,

      failed:
        true,
    },
  }
}

function createCompletedResult({
  agendaEvidence,
  adaptation,
  validation,
  evaluation,
  requestedBy,
  source,
}: {
  agendaEvidence:
    AgendaEvidence

  adaptation:
    AgendaEvidenceAdapterResult

  validation:
    EvidenceValidationResult

  evaluation:
    EvidenceEvaluationResult

  requestedBy:
    string | null

  source:
    string
}): AgendaEvidenceIntelligenceResult {
  const warnings =
    uniqueStrings([
      ...adaptation.warnings,
      ...validation.warnings,
      ...evaluation.warnings,
    ])

  const errors =
    uniqueStrings([
      ...adaptation.errors,
      ...validation.errors,
      ...evaluation.errors,
    ])

  const requiresHumanReview =
    adaptation
      .requiresHumanReview ||
    validation
      .requiresHumanReview ||
    evaluation
      .requiresHumanReview

  const success =
    adaptation.success &&
    validation.valid &&
    evaluation.success &&
    errors.length ===
      0

  const status =
    determineStatus({
      success,
      warnings,
      errors,
      requiresHumanReview,
    })

  return {
    success,

    status,

    agendaEvidenceId:
      agendaEvidence.id,

    educationalEvidence:
      evaluation.evidence,

    adaptation,

    validation,

    quality:
      evaluation.quality,

    reliability:
      evaluation.reliability,

    classifications:
      evaluation.classifications,

    warnings,

    errors,

    requiresHumanReview,

    processedAt:
      nowIso(),

    processingVersion:
      SERVICE_VERSION,

    metadata: {
      service:
        SERVICE_NAME,

      serviceVersion:
        SERVICE_VERSION,

      source,

      requestedBy,

      agendaEvidenceId:
        agendaEvidence.id,

      agendaEvidenceType:
        agendaEvidence
          .evidence_type,

      organizationId:
        agendaEvidence
          .organization_id,

      schoolId:
        agendaEvidence
          .school_id,

      classId:
        agendaEvidence
          .class_id,

      lessonId:
        agendaEvidence
          .lesson_id,

      planningId:
        agendaEvidence
          .planning_id,

      objectiveId:
        agendaEvidence
          .objective_id,

      successful:
        success,

      validationValid:
        validation.valid,

      warningCount:
        warnings.length,

      errorCount:
        errors.length,

      requiresHumanReview,

      qualityLevel:
        evaluation
          .quality
          .level,

      reliabilityLevel:
        evaluation
          .reliability
          .confidenceLevel,

      classificationCount:
        evaluation
          .classifications
          .length,
    },
  }
}

export function processAgendaEvidenceIntelligence({
  agendaEvidence,
  options = {},
}: {
  agendaEvidence:
    AgendaEvidence

  options?:
    AgendaEvidenceIntelligenceOptions
}): AgendaEvidenceIntelligenceResult {
  const requestedBy =
    options.requestedBy ??
    agendaEvidence.user_id ??
    agendaEvidence.created_by ??
    null

  const source =
    options.source
      ?.trim() ||
    SERVICE_NAME

  const adaptation =
    adaptAgendaEvidenceToEducationalEvidence({
      evidence:
        agendaEvidence,

      options: {
        ...options
          .adapterOptions,

        teacherId:
          options
            .adapterOptions
            ?.teacherId ??
          agendaEvidence
            .user_id,

        occurredAt:
          options
            .adapterOptions
            ?.occurredAt ??
          agendaEvidence
            .created_at,

        additionalMetadata: {
          ...options
            .adapterOptions
            ?.additionalMetadata,

          integrationService:
            SERVICE_NAME,

          integrationVersion:
            SERVICE_VERSION,

          integrationSource:
            source,

          requestedBy,
        },
      },
    })

  if (
    !adaptation.success ||
    !adaptation.evidence
  ) {
    const result =
      createFailedResult({
        agendaEvidence,

        adaptation,

        errors:
          adaptation.errors
            .length >
          0
            ? adaptation.errors
            : [
                'Não foi possível adaptar a evidência da Agenda para o contrato do EIOS.',
              ],

        requestedBy,

        source,
      })

    if (
      options.throwOnError
    ) {
      throw new Error(
        result.errors[0] ??
        'Falha na adaptação da evidência.',
      )
    }

    return result
  }

  const validation =
    validateEducationalEvidence(
      adaptation.evidence,
    )

  if (
    !validation.valid
  ) {
    const result =
      createFailedResult({
        agendaEvidence,

        adaptation,

        validation,

        warnings:
          validation.warnings,

        errors:
          validation.errors
            .length >
          0
            ? validation.errors
            : [
                'A evidência adaptada não atende ao contrato do Evidence Intelligence.',
              ],

        requestedBy,

        source,
      })

    if (
      options.throwOnError
    ) {
      throw new Error(
        result.errors[0] ??
        'Falha na validação da evidência.',
      )
    }

    return result
  }

  const processingOptions =
    mergeProcessingOptions({
      receivedOptions:
        options
          .processingOptions,

      agendaEvidence,

      requestedBy,

      source,
    })

  try {
    const evaluation =
      evaluateEducationalEvidence({
        evidence:
          adaptation.evidence,

        options:
          processingOptions,
      })

    const result =
      createCompletedResult({
        agendaEvidence,

        adaptation,

        validation,

        evaluation,

        requestedBy,

        source,
      })

    if (
      options.throwOnError &&
      !result.success
    ) {
      throw new Error(
        result.errors[0] ??
        'O Evidence Intelligence não concluiu o processamento.',
      )
    }

    return result
  } catch (
    error
  ) {
    const result =
      createFailedResult({
        agendaEvidence,

        adaptation,

        validation,

        warnings:
          validation.warnings,

        errors: [
          getErrorMessage(
            error,
          ),
        ],

        requestedBy,

        source,
      })

    if (
      options.throwOnError
    ) {
      throw error
    }

    return result
  }
}

export function processAgendaEvidenceIntelligenceSafely({
  agendaEvidence,
  options = {},
}: {
  agendaEvidence:
    AgendaEvidence

  options?:
    Omit<
      AgendaEvidenceIntelligenceOptions,
      'throwOnError'
    >
}): AgendaEvidenceIntelligenceResult {
  return processAgendaEvidenceIntelligence({
    agendaEvidence,

    options: {
      ...options,

      throwOnError:
        false,
    },
  })
}

export function validateAgendaEvidenceIntelligenceResult(
  result:
    AgendaEvidenceIntelligenceResult,
): {
  valid: boolean

  warnings: string[]

  errors: string[]
} {
  const warnings = [
    ...result.warnings,
  ]

  const errors = [
    ...result.errors,
  ]

  if (
    !result
      .agendaEvidenceId
      .trim()
  ) {
    errors.push(
      'O resultado não possui o identificador da evidência da Agenda.',
    )
  }

  if (
    result.success &&
    !result.educationalEvidence
  ) {
    errors.push(
      'O processamento foi marcado como bem-sucedido sem evidência educacional.',
    )
  }

  if (
    result.success &&
    !result.validation
  ) {
    errors.push(
      'O processamento foi marcado como bem-sucedido sem validação.',
    )
  }

  if (
    result.success &&
    result.status ===
      'failed'
  ) {
    errors.push(
      'O resultado possui estado inconsistente: sucesso com status de falha.',
    )
  }

  if (
    !result.success &&
    result.errors.length ===
      0
  ) {
    warnings.push(
      'O processamento falhou sem registrar mensagem de erro.',
    )
  }

  if (
    result.requiresHumanReview &&
    result.status ===
      'completed'
  ) {
    warnings.push(
      'O resultado exige revisão humana, mas foi marcado como concluído sem ressalvas.',
    )
  }

  return {
    valid:
      errors.length ===
      0,

    warnings:
      uniqueStrings(
        warnings,
      ),

    errors:
      uniqueStrings(
        errors,
      ),
  }
}

export const agendaEvidenceIntelligenceService = {
  process:
    processAgendaEvidenceIntelligence,

  processSafely:
    processAgendaEvidenceIntelligenceSafely,

  validate:
    validateAgendaEvidenceIntelligenceResult,
}