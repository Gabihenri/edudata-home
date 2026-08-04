import {
  clampEvidenceConfidence,
  clampEvidencePercentage,
  createEmptyEvidenceQualityCriteria,
  getEvidenceConfidenceLevel,
  getEvidenceStrength,
  type EducationalEvidence,
  type EvidenceConfidenceLevel,
  type EvidenceFrameworkClassification,
  type EvidenceFrameworkDimension,
  type EvidenceFrameworkPillar,
  type EvidenceProcessingOptions,
  type EvidenceQualityAssessment,
  type EvidenceQualityCriteria,
  type EvidenceQualityLevel,
  type EvidenceReliabilityAssessment,
  type EvidenceStrength,
  type EvidenceValidationIssue,
  type EvidenceValidationResult,
} from './evidence-intelligence.contract'

export type EvidenceMutationResult = {
  success:
    boolean

  evidence:
    EducationalEvidence | null

  validation:
    EvidenceValidationResult

  warnings:
    string[]

  errors:
    string[]
}

export type EvidenceEvaluationResult = {
  success:
    boolean

  evidence:
    EducationalEvidence

  quality:
    EvidenceQualityAssessment

  reliability:
    EvidenceReliabilityAssessment

  classifications:
    EvidenceFrameworkClassification[]

  warnings:
    string[]

  errors:
    string[]

  requiresHumanReview:
    boolean
}

export type EvidenceBatchValidationResult = {
  valid:
    boolean

  results:
    EvidenceValidationResult[]

  errors:
    string[]

  warnings:
    string[]

  requiresHumanReview:
    boolean
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
    true,

  consolidate:
    true,

  linkKnowledgeGraph:
    true,

  allowAutomaticValidation:
    false,

  allowAutomaticClassification:
    true,

  requireHumanReviewForSensitiveData:
    true,

  minimumConfidenceForAutomaticValidation:
    0.9,

  metadata:
    {},
}

function uniqueStrings(
  values:
    string[],
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

function nowIso():
  string {
  return new Date()
    .toISOString()
}

function isValidDate(
  value:
    string | null,
): boolean {
  if (!value) {
    return true
  }

  return !Number.isNaN(
    Date.parse(
      value,
    ),
  )
}

function isValidInterval(
  startsAt:
    string | null,

  endsAt:
    string | null,
): boolean {
  if (
    !isValidDate(
      startsAt,
    ) ||
    !isValidDate(
      endsAt,
    )
  ) {
    return false
  }

  if (
    !startsAt ||
    !endsAt
  ) {
    return true
  }

  return (
    Date.parse(
      startsAt,
    ) <=
    Date.parse(
      endsAt,
    )
  )
}

function average(
  values:
    number[],
): number | null {
  const finiteValues =
    values.filter(
      value =>
        Number.isFinite(
          value,
        ),
    )

  if (
    finiteValues.length ===
    0
  ) {
    return null
  }

  const total =
    finiteValues.reduce(
      (
        accumulator,
        value,
      ) =>
        accumulator +
        value,
      0,
    )

  return (
    total /
    finiteValues.length
  )
}

function normalizeOptionalConfidence(
  value:
    number | null,
): number | null {
  if (
    value ===
    null
  ) {
    return null
  }

  return clampEvidenceConfidence(
    value,
  )
}

function normalizeOptionalPercentage(
  value:
    number | null,
): number | null {
  if (
    value ===
    null
  ) {
    return null
  }

  return clampEvidencePercentage(
    value,
  )
}

function getQualityLevel(
  score:
    number | null,
): EvidenceQualityLevel {
  if (
    score ===
    null
  ) {
    return 'not_evaluated'
  }

  if (
    score >=
    85
  ) {
    return 'high'
  }

  if (
    score >=
    65
  ) {
    return 'adequate'
  }

  if (
    score >=
    40
  ) {
    return 'partial'
  }

  return 'insufficient'
}

function normalizeQualityCriteria(
  criteria:
    EvidenceQualityCriteria,
): EvidenceQualityCriteria {
  return {
    relevance:
      normalizeOptionalPercentage(
        criteria.relevance,
      ),

    reliability:
      normalizeOptionalPercentage(
        criteria.reliability,
      ),

    validity:
      normalizeOptionalPercentage(
        criteria.validity,
      ),

    completeness:
      normalizeOptionalPercentage(
        criteria.completeness,
      ),

    timeliness:
      normalizeOptionalPercentage(
        criteria.timeliness,
      ),

    consistency:
      normalizeOptionalPercentage(
        criteria.consistency,
      ),

    traceability:
      normalizeOptionalPercentage(
        criteria.traceability,
      ),

    objectivity:
      normalizeOptionalPercentage(
        criteria.objectivity,
      ),

    representativeness:
      normalizeOptionalPercentage(
        criteria.representativeness,
      ),

    accessibility:
      normalizeOptionalPercentage(
        criteria.accessibility,
      ),

    metadata: {
      ...criteria.metadata,
    },
  }
}

function hasPrimarySubject(
  evidence:
    EducationalEvidence,
): boolean {
  return Boolean(
    evidence.studentId ||
    evidence.studentGroupId ||
    evidence.classId ||
    evidence.teacherId ||
    evidence.lessonId ||
    evidence.planningId ||
    evidence.componentId ||
    evidence.courseId ||
    evidence.programId ||
    evidence.institutionId ||
    evidence.subjects.length >
      0,
  )
}

function validateTemporalContext(
  evidence:
    EducationalEvidence,
): EvidenceValidationIssue[] {
  const issues:
    EvidenceValidationIssue[] =
      []

  const temporal =
    evidence.temporalContext

  if (
    !isValidDate(
      temporal.recordedAt,
    )
  ) {
    issues.push({
      code:
        'invalid_temporal_context',

      severity:
        'error',

      evidenceId:
        evidence.id,

      field:
        'temporalContext.recordedAt',

      message:
        'A data de registro da evidência é inválida.',
    })
  }

  if (
    !isValidDate(
      temporal.occurredAt,
    )
  ) {
    issues.push({
      code:
        'invalid_temporal_context',

      severity:
        'error',

      evidenceId:
        evidence.id,

      field:
        'temporalContext.occurredAt',

      message:
        'A data de ocorrência da evidência é inválida.',
    })
  }

  if (
    !isValidInterval(
      temporal.startsAt,
      temporal.endsAt,
    )
  ) {
    issues.push({
      code:
        'invalid_temporal_context',

      severity:
        'error',

      evidenceId:
        evidence.id,

      field:
        'temporalContext',

      message:
        'O intervalo temporal da evidência é inválido.',
    })
  }

  if (
    !isValidInterval(
      temporal.validFrom,
      temporal.validUntil,
    )
  ) {
    issues.push({
      code:
        'invalid_temporal_context',

      severity:
        'error',

      evidenceId:
        evidence.id,

      field:
        'temporalContext',

      message:
        'O intervalo de validade da evidência é inválido.',
    })
  }

  return issues
}

function validateSpatialContext(
  evidence:
    EducationalEvidence,
): EvidenceValidationIssue[] {
  const issues:
    EvidenceValidationIssue[] =
      []

  const spatial =
    evidence.spatialContext

  if (!spatial) {
    return issues
  }

  if (
    spatial.consentRequired &&
    !spatial.consentConfirmed
  ) {
    issues.push({
      code:
        'missing_consent',

      severity:
        'warning',

      evidenceId:
        evidence.id,

      field:
        'spatialContext.consentConfirmed',

      message:
        'A evidência espacial exige consentimento ainda não confirmado.',
    })
  }

  if (
    spatial.accuracy !==
      null &&
    (
      spatial.accuracy <
        0 ||
      !Number.isFinite(
        spatial.accuracy,
      )
    )
  ) {
    issues.push({
      code:
        'invalid_spatial_context',

      severity:
        'error',

      evidenceId:
        evidence.id,

      field:
        'spatialContext.accuracy',

      message:
        'A precisão espacial deve ser um número maior ou igual a zero.',
    })
  }

  return issues
}

function validatePrivacyContext(
  evidence:
    EducationalEvidence,
): EvidenceValidationIssue[] {
  const issues:
    EvidenceValidationIssue[] =
      []

  const privacy =
    evidence.privacy

  if (
    privacy.consentRequired &&
    !privacy.consentConfirmed
  ) {
    issues.push({
      code:
        'missing_consent',

      severity:
        'warning',

      evidenceId:
        evidence.id,

      field:
        'privacy.consentConfirmed',

      message:
        'A evidência exige consentimento ainda não confirmado.',
    })
  }

  if (
    privacy.containsSensitiveData &&
    privacy.sensitivity ===
      'none'
  ) {
    issues.push({
      code:
        'invalid_privacy_context',

      severity:
        'error',

      evidenceId:
        evidence.id,

      field:
        'privacy.sensitivity',

      message:
        'A evidência contém dados sensíveis, mas a sensibilidade está definida como nenhuma.',
    })
  }

  if (
    privacy.containsMinorData &&
    privacy.visibility ===
      'public'
  ) {
    issues.push({
      code:
        'invalid_privacy_context',

      severity:
        'error',

      evidenceId:
        evidence.id,

      field:
        'privacy.visibility',

      message:
        'Evidências com dados de menores não podem possuir visibilidade pública.',
    })
  }

  return issues
}

function validateCurriculumReferences(
  evidence:
    EducationalEvidence,
): EvidenceValidationIssue[] {
  const issues:
    EvidenceValidationIssue[] =
      []

  evidence
    .curriculumReferences
    .forEach(
      (
        reference,
        index,
      ) => {
        const hasReference =
          Boolean(
            reference.frameworkId ||
            reference.versionId ||
            reference.curriculumNodeId ||
            reference.competencyId ||
            reference.skillId ||
            reference.knowledgeObjectId ||
            reference.learningObjectiveId,
          )

        if (!hasReference) {
          issues.push({
            code:
              'invalid_curriculum_reference',

            severity:
              'warning',

            evidenceId:
              evidence.id,

            field:
              `curriculumReferences.${index}`,

            message:
              'A referência curricular não possui identificadores associados.',
          })
        }

        if (
          reference.alignmentConfidence !==
            null &&
          (
            reference.alignmentConfidence <
              0 ||
            reference.alignmentConfidence >
              1
          )
        ) {
          issues.push({
            code:
              'invalid_confidence',

            severity:
              'error',

            evidenceId:
              evidence.id,

            field:
              `curriculumReferences.${index}.alignmentConfidence`,

            message:
              'A confiança do alinhamento curricular deve estar entre 0 e 1.',
          })
        }
      },
    )

  return issues
}

function validateAssessmentReference(
  evidence:
    EducationalEvidence,
): EvidenceValidationIssue[] {
  const issues:
    EvidenceValidationIssue[] =
      []

  const assessment =
    evidence.assessmentReference

  if (!assessment) {
    return issues
  }

  if (
    assessment.score !==
      null &&
    assessment.maximumScore !==
      null &&
    assessment.maximumScore <=
      0
  ) {
    issues.push({
      code:
        'invalid_assessment_reference',

      severity:
        'error',

      evidenceId:
        evidence.id,

      field:
        'assessmentReference.maximumScore',

      message:
        'A pontuação máxima da avaliação deve ser maior que zero.',
    })
  }

  if (
    assessment.normalizedScore !==
      null &&
    (
      assessment.normalizedScore <
        0 ||
      assessment.normalizedScore >
        100
    )
  ) {
    issues.push({
      code:
        'invalid_normalized_value',

      severity:
        'error',

      evidenceId:
        evidence.id,

      field:
        'assessmentReference.normalizedScore',

      message:
        'A pontuação normalizada da avaliação deve estar entre 0 e 100.',
    })
  }

  return issues
}

export function validateEducationalEvidence(
  evidence:
    EducationalEvidence,
): EvidenceValidationResult {
  const issues:
    EvidenceValidationIssue[] =
      []

  if (
    !evidence.id.trim()
  ) {
    issues.push({
      code:
        'missing_identifier',

      severity:
        'error',

      evidenceId:
        null,

      field:
        'id',

      message:
        'O identificador da evidência é obrigatório.',
    })
  }

  if (
    !evidence.title.trim()
  ) {
    issues.push({
      code:
        'missing_title',

      severity:
        'error',

      evidenceId:
        evidence.id || null,

      field:
        'title',

      message:
        'O título da evidência é obrigatório.',
    })
  }

  if (
    !evidence.sourceType
  ) {
    issues.push({
      code:
        'missing_source',

      severity:
        'error',

      evidenceId:
        evidence.id || null,

      field:
        'sourceType',

      message:
        'A origem da evidência é obrigatória.',
    })
  }

  if (
    !hasPrimarySubject(
      evidence,
    )
  ) {
    issues.push({
      code:
        'missing_subject',

      severity:
        'warning',

      evidenceId:
        evidence.id || null,

      field:
        'subjects',

      message:
        'A evidência não possui sujeito educacional associado.',
    })
  }

  if (
    evidence.normalizedValue !==
      null &&
    (
      evidence.normalizedValue <
        0 ||
      evidence.normalizedValue >
        100
    )
  ) {
    issues.push({
      code:
        'invalid_normalized_value',

      severity:
        'error',

      evidenceId:
        evidence.id || null,

      field:
        'normalizedValue',

      message:
        'O valor normalizado da evidência deve estar entre 0 e 100.',
    })
  }

  if (
    evidence.reliability.confidence !==
      null &&
    (
      evidence.reliability.confidence <
        0 ||
      evidence.reliability.confidence >
        1
    )
  ) {
    issues.push({
      code:
        'invalid_confidence',

      severity:
        'error',

      evidenceId:
        evidence.id || null,

      field:
        'reliability.confidence',

      message:
        'A confiança da evidência deve estar entre 0 e 1.',
    })
  }

  if (
    evidence.supersedesEvidenceId ===
      evidence.id ||
    evidence.supersededByEvidenceId ===
      evidence.id
  ) {
    issues.push({
      code:
        'circular_supersession',

      severity:
        'error',

      evidenceId:
        evidence.id || null,

      field:
        'supersedesEvidenceId',

      message:
        'A evidência não pode substituir a si mesma.',
    })
  }

  if (
    !evidence.active &&
    evidence.status !==
      'archived' &&
    evidence.status !==
      'superseded' &&
    evidence.status !==
      'rejected'
  ) {
    issues.push({
      code:
        'inactive_reference',

      severity:
        'warning',

      evidenceId:
        evidence.id || null,

      field:
        'active',

      message:
        'A evidência está inativa, mas seu status não indica arquivamento, substituição ou rejeição.',
    })
  }

  issues.push(
    ...validateTemporalContext(
      evidence,
    ),
  )

  issues.push(
    ...validateSpatialContext(
      evidence,
    ),
  )

  issues.push(
    ...validatePrivacyContext(
      evidence,
    ),
  )

  issues.push(
    ...validateCurriculumReferences(
      evidence,
    ),
  )

  issues.push(
    ...validateAssessmentReference(
      evidence,
    ),
  )

  const errors =
    issues
      .filter(
        issue =>
          issue.severity ===
          'error',
      )
      .map(
        issue =>
          issue.message,
      )

  const warnings =
    issues
      .filter(
        issue =>
          issue.severity ===
          'warning',
      )
      .map(
        issue =>
          issue.message,
      )

  const requiresHumanReview =
    warnings.length >
      0 ||
    evidence.privacy
      .containsSensitiveData ||
    evidence.privacy
      .containsMinorData ||
    evidence.quality
      .humanReviewRequired ||
    evidence.reliability
      .humanReviewRequired ||
    evidence.frameworkClassifications
      .some(
        classification =>
          classification
            .humanReviewRequired,
      )

  return {
    valid:
      errors.length ===
      0,

    evidenceId:
      evidence.id || null,

    issues,

    errors:
      uniqueStrings(
        errors,
      ),

    warnings:
      uniqueStrings(
        warnings,
      ),

    requiresHumanReview,
  }
}

export function validateEducationalEvidenceBatch(
  evidenceList:
    EducationalEvidence[],
): EvidenceBatchValidationResult {
  const results =
    evidenceList.map(
      evidence =>
        validateEducationalEvidence(
          evidence,
        ),
    )

  const duplicateIds =
    new Set<string>()

  const observedIds =
    new Set<string>()

  for (
    const evidence
    of evidenceList
  ) {
    if (
      observedIds.has(
        evidence.id,
      )
    ) {
      duplicateIds.add(
        evidence.id,
      )
    }

    observedIds.add(
      evidence.id,
    )
  }

  for (
    const duplicateId
    of duplicateIds
  ) {
    const result =
      results.find(
        item =>
          item.evidenceId ===
          duplicateId,
      )

    if (!result) {
      continue
    }

    const issue:
      EvidenceValidationIssue = {
      code:
        'duplicate_evidence',

      severity:
        'error',

      evidenceId:
        duplicateId,

      field:
        'id',

      message:
        `A evidência "${duplicateId}" está duplicada.`,
    }

    result.issues.push(
      issue,
    )

    result.errors =
      uniqueStrings([
        ...result.errors,
        issue.message,
      ])

    result.valid =
      false
  }

  const errors =
    uniqueStrings(
      results.flatMap(
        result =>
          result.errors,
      ),
    )

  const warnings =
    uniqueStrings(
      results.flatMap(
        result =>
          result.warnings,
      ),
    )

  return {
    valid:
      errors.length ===
      0,

    results,

    errors,

    warnings,

    requiresHumanReview:
      results.some(
        result =>
          result.requiresHumanReview,
      ),
  }
}

export function normalizeEducationalEvidence(
  evidence:
    EducationalEvidence,
): EducationalEvidence {
  const reliabilityConfidence =
    normalizeOptionalConfidence(
      evidence
        .reliability
        .confidence,
    )

  const normalizedValue =
    normalizeOptionalPercentage(
      evidence.normalizedValue,
    )

  const normalizedAssessment =
    evidence.assessmentReference
      ? {
          ...evidence.assessmentReference,

          normalizedScore:
            normalizeOptionalPercentage(
              evidence
                .assessmentReference
                .normalizedScore,
            ),

          metadata: {
            ...evidence
              .assessmentReference
              .metadata,
          },
        }
      : null

  const normalizedCurriculumReferences =
    evidence
      .curriculumReferences
      .map(
        reference => ({
          ...reference,

          alignmentConfidence:
            normalizeOptionalConfidence(
              reference
                .alignmentConfidence,
            ),

          metadata: {
            ...reference.metadata,
          },
        }),
      )

  const normalizedClassifications =
    evidence
      .frameworkClassifications
      .map(
        classification => ({
          ...classification,

          dimensions:
            Array.from(
              new Set(
                classification
                  .dimensions,
              ),
            ),

          confidence:
            normalizeOptionalConfidence(
              classification
                .confidence,
            ),

          metadata: {
            ...classification.metadata,
          },
        }),
      )

  const normalizedQualityCriteria =
    normalizeQualityCriteria(
      evidence
        .quality
        .criteria,
    )

  const qualityScores = [
    normalizedQualityCriteria
      .relevance,
    normalizedQualityCriteria
      .reliability,
    normalizedQualityCriteria
      .validity,
    normalizedQualityCriteria
      .completeness,
    normalizedQualityCriteria
      .timeliness,
    normalizedQualityCriteria
      .consistency,
    normalizedQualityCriteria
      .traceability,
    normalizedQualityCriteria
      .objectivity,
    normalizedQualityCriteria
      .representativeness,
    normalizedQualityCriteria
      .accessibility,
  ].filter(
    (
      value,
    ): value is number =>
      value !==
      null,
  )

  const qualityScore =
    average(
      qualityScores,
    )

  return {
    ...evidence,

    title:
      evidence.title.trim(),

    description:
      evidence.description
        ?.trim() ||
      null,

    unit:
      evidence.unit
        ?.trim() ||
      null,

    textualContent:
      evidence.textualContent
        ?.trim() ||
      null,

    normalizedValue,

    relatedEvidenceIds:
      Array.from(
        new Set(
          evidence
            .relatedEvidenceIds
            .filter(
              relatedId =>
                relatedId &&
                relatedId !==
                  evidence.id,
            ),
        ),
      ),

    knowledgeGraphEdgeIds:
      Array.from(
        new Set(
          evidence
            .knowledgeGraphEdgeIds
            .filter(
              Boolean,
            ),
        ),
      ),

    curriculumReferences:
      normalizedCurriculumReferences,

    assessmentReference:
      normalizedAssessment,

    frameworkClassifications:
      normalizedClassifications,

    quality: {
      ...evidence.quality,

      criteria:
        normalizedQualityCriteria,

      overallScore:
        qualityScore ===
          null
          ? null
          : clampEvidencePercentage(
              qualityScore,
            ),

      level:
        getQualityLevel(
          qualityScore,
        ),

      strengths:
        uniqueStrings(
          evidence
            .quality
            .strengths,
        ),

      limitations:
        uniqueStrings(
          evidence
            .quality
            .limitations,
        ),

      missingInformation:
        uniqueStrings(
          evidence
            .quality
            .missingInformation,
        ),

      metadata: {
        ...evidence
          .quality
          .metadata,
      },
    },

    reliability: {
      ...evidence.reliability,

      confidence:
        reliabilityConfidence,

      confidenceLevel:
        getEvidenceConfidenceLevel(
          reliabilityConfidence,
        ),

      strength:
        getEvidenceStrength(
          reliabilityConfidence,
        ),

      sourceReliability:
        normalizeOptionalConfidence(
          evidence
            .reliability
            .sourceReliability,
        ),

      internalConsistency:
        normalizeOptionalConfidence(
          evidence
            .reliability
            .internalConsistency,
        ),

      limitations:
        uniqueStrings(
          evidence
            .reliability
            .limitations,
        ),

      metadata: {
        ...evidence
          .reliability
          .metadata,
      },
    },

    privacy: {
      ...evidence.privacy,

      accessRoles:
        uniqueStrings(
          evidence
            .privacy
            .accessRoles,
        ),

      metadata: {
        ...evidence
          .privacy
          .metadata,
      },
    },

    temporalContext: {
      ...evidence.temporalContext,

      recordedAt:
        isValidDate(
          evidence
            .temporalContext
            .recordedAt,
        )
          ? evidence
              .temporalContext
              .recordedAt
          : nowIso(),

      metadata: {
        ...evidence
          .temporalContext
          .metadata,
      },
    },

    spatialContext:
      evidence.spatialContext
        ? {
            ...evidence.spatialContext,

            metadata: {
              ...evidence
                .spatialContext
                .metadata,
            },
          }
        : null,

    subjects:
      evidence.subjects.map(
        subject => ({
          ...subject,

          metadata: {
            ...subject.metadata,
          },
        }),
      ),

    files:
      evidence.files.map(
        file => ({
          ...file,

          metadata: {
            ...file.metadata,
          },
        }),
      ),

    externalReferences:
      evidence.externalReferences.map(
        reference => ({
          ...reference,

          metadata: {
            ...reference.metadata,
          },
        }),
      ),

    interventionReferences:
      evidence.interventionReferences.map(
        reference => ({
          ...reference,

          metadata: {
            ...reference.metadata,
          },
        }),
      ),

    auditTrail: [
      ...evidence.auditTrail,
    ],

    updatedAt:
      nowIso(),

    metadata: {
      ...evidence.metadata,
    },
  }
}

function calculateCompletenessScore(
  evidence:
    EducationalEvidence,
): number {
  const checks = [
    Boolean(
      evidence.id,
    ),
    Boolean(
      evidence.title,
    ),
    Boolean(
      evidence.sourceType,
    ),
    hasPrimarySubject(
      evidence,
    ),
    Boolean(
      evidence.temporalContext
        .recordedAt,
    ),
    evidence.modalities.length >
      0,
    Boolean(
      evidence.description ||
      evidence.textualContent ||
      evidence.value !==
        null,
    ),
    Boolean(
      evidence
        .curriculumReferences
        .length >
        0,
    ),
    Boolean(
      evidence
        .externalReferences
        .length >
        0 ||
      evidence.sourceId,
    ),
    Boolean(
      evidence.createdAt &&
      evidence.updatedAt,
    ),
  ]

  const completed =
    checks.filter(
      Boolean,
    ).length

  return clampEvidencePercentage(
    (
      completed /
      checks.length
    ) *
    100,
  )
}

function calculateTraceabilityScore(
  evidence:
    EducationalEvidence,
): number {
  let score =
    20

  if (
    evidence.sourceId
  ) {
    score +=
      20
  }

  if (
    evidence.externalReferences.length >
    0
  ) {
    score +=
      20
  }

  if (
    evidence.auditTrail.length >
    0
  ) {
    score +=
      20
  }

  if (
    evidence.createdBy ||
    evidence.updatedBy
  ) {
    score +=
      10
  }

  if (
    evidence.files.some(
      file =>
        Boolean(
          file.checksum,
        ),
    )
  ) {
    score +=
      10
  }

  return clampEvidencePercentage(
    score,
  )
}

function calculateTimelinessScore(
  evidence:
    EducationalEvidence,
): number {
  const occurredAt =
    evidence.temporalContext
      .occurredAt

  const recordedAt =
    evidence.temporalContext
      .recordedAt

  if (
    !occurredAt ||
    !recordedAt ||
    !isValidDate(
      occurredAt,
    ) ||
    !isValidDate(
      recordedAt,
    )
  ) {
    return 50
  }

  const difference =
    Math.abs(
      Date.parse(
        recordedAt,
      ) -
      Date.parse(
        occurredAt,
      ),
    )

  const differenceInDays =
    difference /
    (
      1000 *
      60 *
      60 *
      24
    )

  if (
    differenceInDays <=
    1
  ) {
    return 100
  }

  if (
    differenceInDays <=
    7
  ) {
    return 85
  }

  if (
    differenceInDays <=
    30
  ) {
    return 70
  }

  if (
    differenceInDays <=
    90
  ) {
    return 50
  }

  return 30
}

function calculateRelevanceScore(
  evidence:
    EducationalEvidence,
): number {
  let score =
    40

  if (
    hasPrimarySubject(
      evidence,
    )
  ) {
    score +=
      20
  }

  if (
    evidence.curriculumReferences.length >
    0
  ) {
    score +=
      20
  }

  if (
    evidence.classId ||
    evidence.lessonId ||
    evidence.componentId
  ) {
    score +=
      10
  }

  if (
    evidence.frameworkClassifications.length >
    0
  ) {
    score +=
      10
  }

  return clampEvidencePercentage(
    score,
  )
}

function calculateObjectivityScore(
  evidence:
    EducationalEvidence,
): number {
  switch (
    evidence.type
  ) {
    case 'assessment':
    case 'assessment_item':
    case 'grade':
    case 'attendance':
    case 'absence':
    case 'digital_activity':
    case 'sensor_record':
      return 90

    case 'activity':
    case 'assignment':
    case 'project':
    case 'portfolio':
    case 'practical_production':
    case 'laboratory_activity':
      return 75

    case 'teacher_feedback':
    case 'peer_assessment':
    case 'self_assessment':
    case 'observation':
    case 'behavior':
    case 'engagement':
    case 'participation':
      return 60

    default:
      return 65
  }
}

function calculateRepresentativenessScore(
  evidence:
    EducationalEvidence,
): number {
  let score =
    40

  if (
    evidence.studentId ||
    evidence.studentGroupId ||
    evidence.classId
  ) {
    score +=
      20
  }

  if (
    evidence.assessmentReference
  ) {
    score +=
      15
  }

  if (
    evidence.relatedEvidenceIds.length >
    0
  ) {
    score +=
      15
  }

  if (
    evidence.reliability
      .corroborationCount >
    0
  ) {
    score +=
      10
  }

  return clampEvidencePercentage(
    score,
  )
}

function calculateAccessibilityScore(
  evidence:
    EducationalEvidence,
): number {
  let score =
    60

  if (
    evidence.type ===
      'accessibility_action' ||
    evidence.type ===
      'accommodation' ||
    evidence.frameworkClassifications
      .some(
        classification =>
          classification.pillar ===
            'inclusion',
      )
  ) {
    score +=
      20
  }

  if (
    evidence.files.every(
      file =>
        Boolean(
          file.fileName &&
          file.mimeType,
        ),
    )
  ) {
    score +=
      10
  }

  if (
    evidence.textualContent ||
    evidence.description
  ) {
    score +=
      10
  }

  return clampEvidencePercentage(
    score,
  )
}

export function evaluateEvidenceQuality(
  evidence:
    EducationalEvidence,
): EvidenceQualityAssessment {
  const reliabilityPercentage =
    evidence
      .reliability
      .confidence ===
      null
      ? 50
      : clampEvidencePercentage(
          evidence
            .reliability
            .confidence *
          100,
        )

  const criteria:
    EvidenceQualityCriteria = {
    relevance:
      calculateRelevanceScore(
        evidence,
      ),

    reliability:
      reliabilityPercentage,

    validity:
      evidence.reliability
        .verified
        ? 95
        : evidence.reliability
            .validationMethod ===
          'not_validated'
          ? 50
          : 75,

    completeness:
      calculateCompletenessScore(
        evidence,
      ),

    timeliness:
      calculateTimelinessScore(
        evidence,
      ),

    consistency:
      evidence.reliability
        .internalConsistency ===
        null
        ? 60
        : clampEvidencePercentage(
            evidence
              .reliability
              .internalConsistency *
            100,
          ),

    traceability:
      calculateTraceabilityScore(
        evidence,
      ),

    objectivity:
      calculateObjectivityScore(
        evidence,
      ),

    representativeness:
      calculateRepresentativenessScore(
        evidence,
      ),

    accessibility:
      calculateAccessibilityScore(
        evidence,
      ),

    metadata:
      {},
  }

  const scoreValues = [
    criteria.relevance,
    criteria.reliability,
    criteria.validity,
    criteria.completeness,
    criteria.timeliness,
    criteria.consistency,
    criteria.traceability,
    criteria.objectivity,
    criteria.representativeness,
    criteria.accessibility,
  ].filter(
    (
      value,
    ): value is number =>
      value !==
      null,
  )

  const overallScore =
    average(
      scoreValues,
    )

  const normalizedScore =
    overallScore ===
      null
      ? null
      : clampEvidencePercentage(
          overallScore,
        )

  const strengths:
    string[] = []

  const limitations:
    string[] = []

  const missingInformation:
    string[] = []

  Object.entries(
    criteria,
  ).forEach(
    (
      [
        criterion,
        value,
      ],
    ) => {
      if (
        criterion ===
        'metadata' ||
        typeof value !==
          'number'
      ) {
        return
      }

      if (
        value >=
        80
      ) {
        strengths.push(
          `Critério ${criterion} apresenta nível elevado.`,
        )
      }

      if (
        value <
        50
      ) {
        limitations.push(
          `Critério ${criterion} apresenta nível insuficiente.`,
        )
      }
    },
  )

  if (
    !hasPrimarySubject(
      evidence,
    )
  ) {
    missingInformation.push(
      'Sujeito educacional associado.',
    )
  }

  if (
    evidence.curriculumReferences.length ===
    0
  ) {
    missingInformation.push(
      'Referência curricular.',
    )
  }

  if (
    !evidence.description &&
    !evidence.textualContent &&
    evidence.value ===
      null
  ) {
    missingInformation.push(
      'Conteúdo descritivo ou valor observável.',
    )
  }

  const humanReviewRequired =
    evidence.privacy
      .containsSensitiveData ||
    evidence.privacy
      .containsMinorData ||
    (
      normalizedScore !==
        null &&
      normalizedScore <
        65
    )

  return {
    level:
      getQualityLevel(
        normalizedScore,
      ),

    overallScore:
      normalizedScore,

    criteria,

    strengths:
      uniqueStrings(
        strengths,
      ),

    limitations:
      uniqueStrings(
        limitations,
      ),

    missingInformation:
      uniqueStrings(
        missingInformation,
      ),

    evaluatedAt:
      nowIso(),

    evaluatedBy:
      'evidence-intelligence-engine',

    evaluationMethod:
      'automatic',

    humanReviewRequired,

    metadata: {
      engine:
        'evidence-intelligence',

      version:
        'v1',
    },
  }
}

function calculateSourceReliability(
  evidence:
    EducationalEvidence,
): number {
  switch (
    evidence.sourceType
  ) {
    case 'assessment_system':
    case 'attendance_system':
    case 'student_information_system':
    case 'institutional_system':
      return 0.9

    case 'academic_core':
    case 'curriculum_engine':
    case 'semantic_engine':
    case 'knowledge_graph':
      return 0.88

    case 'learning_management_system':
    case 'automatic_import':
    case 'external_integration':
      return 0.82

    case 'agenda':
    case 'professor_digital':
    case 'teacher_manual_entry':
      return 0.75

    case 'student_submission':
    case 'family_submission':
      return 0.65

    case 'sensor':
    case 'iot':
      return 0.8

    case 'research':
      return 0.85

    default:
      return 0.6
  }
}

function calculateInternalConsistency(
  evidence:
    EducationalEvidence,
): number {
  let consistency =
    0.6

  if (
    evidence.normalizedValue !==
      null
  ) {
    consistency +=
      0.1
  }

  if (
    evidence.assessmentReference
      ?.normalizedScore !==
      null &&
    evidence.assessmentReference
      ?.normalizedScore !==
      undefined &&
    evidence.normalizedValue !==
      null
  ) {
    const difference =
      Math.abs(
        evidence
          .assessmentReference
          .normalizedScore -
        evidence.normalizedValue,
      )

    consistency +=
      difference <=
        5
        ? 0.2
        : difference <=
            15
          ? 0.1
          : -0.15
  }

  if (
    evidence.reliability
      .contradictionCount >
    0
  ) {
    consistency -=
      Math.min(
        0.3,
        evidence.reliability
          .contradictionCount *
          0.05,
      )
  }

  return clampEvidenceConfidence(
    consistency,
  )
}

export function evaluateEvidenceReliability(
  evidence:
    EducationalEvidence,
): EvidenceReliabilityAssessment {
  const sourceReliability =
    calculateSourceReliability(
      evidence,
    )

  const internalConsistency =
    calculateInternalConsistency(
      evidence,
    )

  const corroborationBonus =
    Math.min(
      0.15,
      evidence.reliability
        .corroborationCount *
        0.03,
    )

  const contradictionPenalty =
    Math.min(
      0.3,
      evidence.reliability
        .contradictionCount *
        0.06,
    )

  const verificationBonus =
    evidence.reliability
      .verified
      ? 0.12
      : 0

  const confidence =
    clampEvidenceConfidence(
      (
        sourceReliability *
        0.45
      ) +
      (
        internalConsistency *
        0.35
      ) +
      corroborationBonus +
      verificationBonus -
      contradictionPenalty,
    )

  const confidenceLevel:
    EvidenceConfidenceLevel =
      getEvidenceConfidenceLevel(
        confidence,
      )

  const strength:
    EvidenceStrength =
      getEvidenceStrength(
        confidence,
      )

  const limitations:
    string[] = []

  if (
    evidence.reliability
      .corroborationCount ===
    0
  ) {
    limitations.push(
      'A evidência ainda não foi corroborada por outras fontes.',
    )
  }

  if (
    evidence.reliability
      .contradictionCount >
    0
  ) {
    limitations.push(
      'Existem contradições associadas à evidência.',
    )
  }

  if (
    !evidence.reliability
      .verified
  ) {
    limitations.push(
      'A evidência ainda não possui verificação humana ou institucional.',
    )
  }

  const humanReviewRequired =
    confidence <
      0.65 ||
    evidence.privacy
      .containsSensitiveData ||
    evidence.privacy
      .containsMinorData ||
    evidence.reliability
      .contradictionCount >
      0

  return {
    confidence,

    confidenceLevel,

    strength,

    sourceReliability,

    internalConsistency,

    corroborationCount:
      Math.max(
        0,
        evidence.reliability
          .corroborationCount,
      ),

    contradictionCount:
      Math.max(
        0,
        evidence.reliability
          .contradictionCount,
      ),

    verified:
      evidence.reliability
        .verified,

    verifiedBy:
      evidence.reliability
        .verifiedBy,

    verifiedAt:
      evidence.reliability
        .verifiedAt,

    validationMethod:
      evidence.reliability
        .validationMethod,

    explanation:
      'Confiabilidade calculada considerando origem, consistência interna, corroboradores, contradições e verificação.',

    limitations:
      uniqueStrings(
        limitations,
      ),

    humanReviewRequired,

    metadata: {
      engine:
        'evidence-intelligence',

      version:
        'v1',
    },
  }
}

function createClassification({
  pillar,
  dimensions,
  primaryDimension,
  confidence,
  explanation,
}: {
  pillar:
    EvidenceFrameworkPillar

  dimensions:
    EvidenceFrameworkDimension[]

  primaryDimension:
    EvidenceFrameworkDimension

  confidence:
    number

  explanation:
    string
}): EvidenceFrameworkClassification {
  return {
    pillar,

    dimensions:
      Array.from(
        new Set(
          dimensions,
        ),
      ),

    primaryDimension,

    confidence:
      clampEvidenceConfidence(
        confidence,
      ),

    explanation,

    inferred:
      true,

    classifiedBy:
      'evidence_engine',

    humanReviewRequired:
      confidence <
      0.75,

    metadata: {
      engine:
        'evidence-intelligence',

      version:
        'v1',
    },
  }
}

export function classifyEvidenceByFramework(
  evidence:
    EducationalEvidence,
): EvidenceFrameworkClassification[] {
  const classifications:
    EvidenceFrameworkClassification[] =
      []

  switch (
    evidence.type
  ) {
    case 'attendance':
    case 'absence':
      classifications.push(
        createClassification({
          pillar:
            'evidence',

          dimensions: [
            'attendance',
            'participation',
          ],

          primaryDimension:
            'attendance',

          confidence:
            0.95,

          explanation:
            'Registro objetivo relacionado à presença e participação acadêmica.',
        }),
      )
      break

    case 'assessment':
    case 'assessment_item':
    case 'grade':
      classifications.push(
        createClassification({
          pillar:
            'evidence',

          dimensions: [
            'assessment',
            'performance',
            'learning',
          ],

          primaryDimension:
            'assessment',

          confidence:
            0.95,

          explanation:
            'Registro avaliativo relacionado ao desempenho e à aprendizagem.',
        }),
      )

      classifications.push(
        createClassification({
          pillar:
            'intelligence',

          dimensions: [
            'decision_support',
            'performance',
          ],

          primaryDimension:
            'decision_support',

          confidence:
            0.8,

          explanation:
            'O resultado avaliativo pode apoiar decisões pedagógicas.',
        }),
      )
      break

    case 'intervention':
    case 'recovery_action':
    case 'recomposition_action':
    case 'learning_support':
      classifications.push(
        createClassification({
          pillar:
            'intelligence',

          dimensions: [
            'intervention',
            'recovery',
            'recomposition',
            'decision_support',
          ],

          primaryDimension:
            evidence.type ===
              'recovery_action'
              ? 'recovery'
              : evidence.type ===
                  'recomposition_action'
                ? 'recomposition'
                : 'intervention',

          confidence:
            0.92,

          explanation:
            'A evidência registra uma ação pedagógica orientada por necessidade de aprendizagem.',
        }),
      )
      break

    case 'accommodation':
    case 'accessibility_action':
      classifications.push(
        createClassification({
          pillar:
            'inclusion',

          dimensions: [
            'accessibility',
            'equity',
            'institutional_support',
          ],

          primaryDimension:
            'accessibility',

          confidence:
            0.98,

          explanation:
            'A evidência registra medidas de acessibilidade, adaptação ou equidade.',
        }),
      )
      break

    case 'participation':
    case 'engagement':
    case 'interaction':
    case 'behavior':
      classifications.push(
        createClassification({
          pillar:
            'evidence',

          dimensions: [
            evidence.type ===
              'behavior'
              ? 'behavior'
              : evidence.type ===
                  'interaction'
                ? 'interaction'
                : evidence.type ===
                    'engagement'
                  ? 'engagement'
                  : 'participation',
          ],

          primaryDimension:
            evidence.type ===
              'behavior'
              ? 'behavior'
              : evidence.type ===
                  'interaction'
                ? 'interaction'
                : evidence.type ===
                    'engagement'
                  ? 'engagement'
                  : 'participation',

          confidence:
            0.82,

          explanation:
            'A evidência descreve participação, engajamento, interação ou comportamento.',
        }),
      )
      break

    case 'teacher_effort':
    case 'planning_record':
    case 'lesson_record':
      classifications.push(
        createClassification({
          pillar:
            'intelligence',

          dimensions: [
            'teacher_effort',
            'teaching',
            'curriculum',
          ],

          primaryDimension:
            evidence.type ===
              'teacher_effort'
              ? 'teacher_effort'
              : 'teaching',

          confidence:
            0.88,

          explanation:
            'A evidência representa esforço docente, planejamento ou execução pedagógica.',
        }),
      )
      break

    case 'curriculum_coverage':
    case 'competency_demonstration':
    case 'skill_demonstration':
    case 'learning_objective_progress':
      classifications.push(
        createClassification({
          pillar:
            'evidence',

          dimensions: [
            'curriculum',
            'learning',
            'performance',
          ],

          primaryDimension:
            'curriculum',

          confidence:
            0.93,

          explanation:
            'A evidência está diretamente relacionada à progressão curricular.',
        }),
      )
      break

    case 'contextual_event':
    case 'academic_event':
      classifications.push(
        createClassification({
          pillar:
            'intelligence',

          dimensions: [
            'context',
            'decision_support',
          ],

          primaryDimension:
            'context',

          confidence:
            0.78,

          explanation:
            'A evidência representa contexto que pode influenciar a interpretação dos resultados.',
        }),
      )
      break

    default:
      classifications.push(
        createClassification({
          pillar:
            'evidence',

          dimensions: [
            'learning',
          ],

          primaryDimension:
            'learning',

          confidence:
            0.65,

          explanation:
            'Classificação geral aplicada a uma evidência educacional sem regra específica.',
        }),
      )
      break
  }

  if (
    evidence.privacy
      .containsSensitiveData ||
    evidence.privacy
      .containsMinorData
  ) {
    classifications.push(
      createClassification({
        pillar:
          'inclusion',

        dimensions: [
          'equity',
          'institutional_support',
        ],

        primaryDimension:
          'equity',

        confidence:
          0.75,

        explanation:
          'A evidência exige tratamento responsável e análise orientada à equidade.',
      }),
    )
  }

  return classifications
}

export function evaluateEducationalEvidence({
  evidence,
  options = DEFAULT_PROCESSING_OPTIONS,
}: {
  evidence:
    EducationalEvidence

  options?:
    EvidenceProcessingOptions
}): EvidenceEvaluationResult {
  const normalizedEvidence =
    normalizeEducationalEvidence(
      evidence,
    )

  const validation =
    options.validate
      ? validateEducationalEvidence(
          normalizedEvidence,
        )
      : {
          valid:
            true,

          evidenceId:
            normalizedEvidence.id,

          issues:
            [],

          errors:
            [],

          warnings:
            [],

          requiresHumanReview:
            false,
        }

  const reliability =
    options.evaluateReliability
      ? evaluateEvidenceReliability(
          normalizedEvidence,
        )
      : normalizedEvidence.reliability

  const evidenceWithReliability:
    EducationalEvidence = {
    ...normalizedEvidence,

    reliability,
  }

  const quality =
    options.evaluateQuality
      ? evaluateEvidenceQuality(
          evidenceWithReliability,
        )
      : evidenceWithReliability.quality

  const classifications =
    options.classifyFramework
      ? classifyEvidenceByFramework(
          evidenceWithReliability,
        )
      : evidenceWithReliability
          .frameworkClassifications

  const requiresHumanReview =
    validation
      .requiresHumanReview ||
    reliability
      .humanReviewRequired ||
    quality
      .humanReviewRequired ||
    classifications.some(
      classification =>
        classification
          .humanReviewRequired,
    ) ||
    (
      options
        .requireHumanReviewForSensitiveData &&
      (
        evidenceWithReliability
          .privacy
          .containsSensitiveData ||
        evidenceWithReliability
          .privacy
          .containsMinorData
      )
    )

  const nextStatus =
    (
      options
        .allowAutomaticValidation &&
      validation.valid &&
      reliability.confidence !==
        null &&
      reliability.confidence >=
        options
          .minimumConfidenceForAutomaticValidation &&
      !requiresHumanReview
    )
      ? 'validated'
      : evidenceWithReliability.status

  const evaluatedEvidence:
    EducationalEvidence = {
    ...evidenceWithReliability,

    status:
      nextStatus,

    quality,

    frameworkClassifications:
      classifications,

    updatedAt:
      nowIso(),

    auditTrail: [
      ...evidenceWithReliability
        .auditTrail,

      {
        id:
          `audit-${evidenceWithReliability.id}-${Date.now()}`,

        action:
          'updated',

        actorId:
          null,

        actorType:
          'service',

        occurredAt:
          nowIso(),

        previousStatus:
          evidenceWithReliability
            .status,

        nextStatus,

        description:
          'Evidência normalizada, validada e avaliada pelo Evidence Intelligence Engine.',

        changes: {
          validationValid:
            validation.valid,

          qualityLevel:
            quality.level,

          confidence:
            reliability.confidence,

          classificationCount:
            classifications.length,

          requiresHumanReview,
        },

        metadata: {
          engine:
            'evidence-intelligence',

          version:
            'v1',
        },
      },
    ],
  }

  return {
    success:
      validation.valid,

    evidence:
      evaluatedEvidence,

    quality,

    reliability,

    classifications,

    warnings:
      uniqueStrings([
        ...validation.warnings,
        ...quality.limitations,
        ...reliability.limitations,
      ]),

    errors:
      uniqueStrings(
        validation.errors,
      ),

    requiresHumanReview,
  }
}

export function createEvidenceMutation({
  evidence,
  options = DEFAULT_PROCESSING_OPTIONS,
}: {
  evidence:
    EducationalEvidence

  options?:
    EvidenceProcessingOptions
}): EvidenceMutationResult {
  const evaluation =
    evaluateEducationalEvidence({
      evidence,
      options,
    })

  const validation =
    validateEducationalEvidence(
      evaluation.evidence,
    )

  return {
    success:
      evaluation.success &&
      validation.valid,

    evidence:
      evaluation.success
        ? evaluation.evidence
        : null,

    validation,

    warnings:
      uniqueStrings([
        ...evaluation.warnings,
        ...validation.warnings,
      ]),

    errors:
      uniqueStrings([
        ...evaluation.errors,
        ...validation.errors,
      ]),
  }
}

export function createDefaultEvidenceQualityAssessment():
  EvidenceQualityAssessment {
  return {
    level:
      'not_evaluated',

    overallScore:
      null,

    criteria:
      createEmptyEvidenceQualityCriteria(),

    strengths:
      [],

    limitations:
      [],

    missingInformation:
      [],

    evaluatedAt:
      null,

    evaluatedBy:
      null,

    evaluationMethod:
      'not_evaluated',

    humanReviewRequired:
      false,

    metadata:
      {},
  }
}

export const evidenceIntelligenceService = {
  validate:
    validateEducationalEvidence,

  validateBatch:
    validateEducationalEvidenceBatch,

  normalize:
    normalizeEducationalEvidence,

  evaluateQuality:
    evaluateEvidenceQuality,

  evaluateReliability:
    evaluateEvidenceReliability,

  classifyFramework:
    classifyEvidenceByFramework,

  evaluate:
    evaluateEducationalEvidence,

  createMutation:
    createEvidenceMutation,

  createDefaultQualityAssessment:
    createDefaultEvidenceQualityAssessment,
}