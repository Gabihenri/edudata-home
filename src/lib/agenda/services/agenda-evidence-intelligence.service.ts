import type {
  AgendaEvidence,
} from '@/lib/agenda/repository/evidences.repository'

import {
  adaptAgendaEvidenceToEducationalEvidence,
  type AgendaEvidenceAdapterOptions,
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
} from '@/lib/eios/evidence-intelligence/evidence-intelligence.service'

export type AgendaEvidenceIntelligenceStatus =
  | 'completed'
  | 'requires_human_review'
  | 'failed'

export type AgendaEvidenceIntelligenceOptions = {
  adapterOptions?:
    AgendaEvidenceAdapterOptions

  processingOptions?:
    Partial<EvidenceProcessingOptions>
}

export type AgendaEvidenceIntelligenceResult = {
  success:
    boolean

  status:
    AgendaEvidenceIntelligenceStatus

  agendaEvidenceId:
    string

  evidence:
    EducationalEvidence | null

  validation:
    EvidenceValidationResult | null

  quality:
    EvidenceQualityAssessment | null

  reliability:
    EvidenceReliabilityAssessment | null

  classifications:
    EvidenceFrameworkClassification[]

  warnings:
    string[]

  errors:
    string[]

  requiresHumanReview:
    boolean

  processedAt:
    string
}

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
      'agenda-evidence-intelligence-service',
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

  return 'Não foi possível processar a evidência no Evidence Intelligence.'
}

function mergeProcessingOptions(
  options:
    Partial<EvidenceProcessingOptions> | undefined,

  agendaEvidence:
    AgendaEvidence,
): EvidenceProcessingOptions {
  return {
    ...DEFAULT_PROCESSING_OPTIONS,
    ...options,

    metadata: {
      ...DEFAULT_PROCESSING_OPTIONS
        .metadata,

      ...options
        ?.metadata,

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
    },
  }
}

function createFailedResult({
  agendaEvidence,
  evidence,
  validation,
  warnings,
  errors,
}: {
  agendaEvidence:
    AgendaEvidence

  evidence:
    EducationalEvidence | null

  validation:
    EvidenceValidationResult | null

  warnings:
    string[]

  errors:
    string[]
}): AgendaEvidenceIntelligenceResult {
  return {
    success:
      false,

    status:
      'failed',

    agendaEvidenceId:
      agendaEvidence.id,

    evidence,

    validation,

    quality:
      evidence?.quality ??
      null,

    reliability:
      evidence?.reliability ??
      null,

    classifications:
      evidence
        ?.frameworkClassifications ??
      [],

    warnings:
      uniqueStrings(
        warnings,
      ),

    errors:
      uniqueStrings(
        errors,
      ),

    requiresHumanReview:
      true,

    processedAt:
      nowIso(),
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

          integrationSource:
            'agenda-evidence-intelligence-service',
        },
      },
    })

  if (
    !adaptation.success ||
    !adaptation.evidence
  ) {
    return createFailedResult({
      agendaEvidence,

      evidence:
        adaptation.evidence,

      validation:
        null,

      warnings:
        adaptation.warnings,

      errors:
        adaptation.errors.length >
          0
          ? adaptation.errors
          : [
              'Não foi possível converter a evidência da Agenda para o contrato do EIOS.',
            ],
    })
  }

  const validation =
    validateEducationalEvidence(
      adaptation.evidence,
    )

  if (
    !validation.valid
  ) {
    return createFailedResult({
      agendaEvidence,

      evidence:
        adaptation.evidence,

      validation,

      warnings: [
        ...adaptation.warnings,
        ...validation.warnings,
      ],

      errors:
        validation.errors.length >
          0
          ? validation.errors
          : [
              'A evidência não passou pela validação do Evidence Intelligence.',
            ],
    })
  }

  try {
    const evaluation =
      evaluateEducationalEvidence({
        evidence:
          adaptation.evidence,

        options:
          mergeProcessingOptions(
            options.processingOptions,
            agendaEvidence,
          ),
      })

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
      evaluation.success &&
      errors.length ===
        0

    return {
      success,

      status:
        success
          ? requiresHumanReview
            ? 'requires_human_review'
            : 'completed'
          : 'failed',

      agendaEvidenceId:
        agendaEvidence.id,

      evidence:
        evaluation.evidence,

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
    }
  } catch (
    error
  ) {
    return createFailedResult({
      agendaEvidence,

      evidence:
        adaptation.evidence,

      validation,

      warnings: [
        ...adaptation.warnings,
        ...validation.warnings,
      ],

      errors: [
        getErrorMessage(
          error,
        ),
      ],
    })
  }
}

export const agendaEvidenceIntelligenceService = {
  process:
    processAgendaEvidenceIntelligence,
}