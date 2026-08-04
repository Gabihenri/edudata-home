import {
  clampEvidenceConfidence,
  clampEvidencePercentage,
  getEvidenceConfidenceLevel,
  getEvidenceStrength,
  type EducationalEvidence,
  type EvidenceAggregationMethod,
  type EvidenceConsolidatedResult,
  type EvidenceConsolidationGroup,
  type EvidenceQualityLevel,
  type EvidenceStrength,
} from './evidence-intelligence.contract'

export type EvidenceConsolidationValidationIssue = {
  code:
    | 'missing_group_identifier'
    | 'missing_group_name'
    | 'missing_subject'
    | 'missing_evidence'
    | 'duplicate_evidence_reference'
    | 'invalid_minimum_evidence_count'
    | 'invalid_weight'
    | 'evidence_not_found'
    | 'subject_mismatch'
    | 'curriculum_mismatch'
    | 'insufficient_evidence'
    | 'invalid_temporal_interval'

  severity:
    | 'warning'
    | 'error'

  groupId:
    string | null

  evidenceId:
    string | null

  message:
    string
}

export type EvidenceConsolidationValidationResult = {
  valid:
    boolean

  issues:
    EvidenceConsolidationValidationIssue[]

  warnings:
    string[]

  errors:
    string[]
}

export type EvidenceConsolidationExecutionResult = {
  success:
    boolean

  result:
    EvidenceConsolidatedResult | null

  evidence:
    EducationalEvidence[]

  validation:
    EvidenceConsolidationValidationResult

  warnings:
    string[]

  errors:
    string[]
}

export type EvidenceBatchConsolidationResult = {
  success:
    boolean

  results:
    EvidenceConsolidatedResult[]

  executions:
    EvidenceConsolidationExecutionResult[]

  warnings:
    string[]

  errors:
    string[]

  requiresHumanReview:
    boolean
}

type WeightedEvidenceValue = {
  evidenceId:
    string

  value:
    number

  weight:
    number

  occurredAt:
    string | null

  confidence:
    number | null

  qualityScore:
    number | null
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

  return (
    finiteValues.reduce(
      (
        total,
        value,
      ) =>
        total +
        value,
      0,
    ) /
    finiteValues.length
  )
}

function median(
  values:
    number[],
): number | null {
  const finiteValues =
    values
      .filter(
        value =>
          Number.isFinite(
            value,
          ),
      )
      .sort(
        (
          first,
          second,
        ) =>
          first -
          second,
      )

  if (
    finiteValues.length ===
    0
  ) {
    return null
  }

  const middle =
    Math.floor(
      finiteValues.length /
      2,
    )

  if (
    finiteValues.length %
      2 ===
    0
  ) {
    return (
      finiteValues[
        middle -
        1
      ] +
      finiteValues[
        middle
      ]
    ) /
    2
  }

  return finiteValues[
    middle
  ]
}

function standardDeviation(
  values:
    number[],
): number | null {
  const mean =
    average(
      values,
    )

  if (
    mean ===
    null ||
    values.length ===
    0
  ) {
    return null
  }

  const variance =
    values.reduce(
      (
        total,
        value,
      ) =>
        total +
        (
          value -
          mean
        ) **
          2,
      0,
    ) /
    values.length

  return Math.sqrt(
    variance,
  )
}

function getEvidenceDate(
  evidence:
    EducationalEvidence,
): string | null {
  return (
    evidence
      .temporalContext
      .occurredAt ||
    evidence
      .temporalContext
      .recordedAt ||
    evidence.createdAt ||
    null
  )
}

function getEvidenceNumericValue(
  evidence:
    EducationalEvidence,
): number | null {
  if (
    evidence.normalizedValue !==
    null &&
    Number.isFinite(
      evidence.normalizedValue,
    )
  ) {
    return clampEvidencePercentage(
      evidence.normalizedValue,
    )
  }

  const assessmentScore =
    evidence
      .assessmentReference
      ?.normalizedScore

  if (
    assessmentScore !==
      null &&
    assessmentScore !==
      undefined &&
    Number.isFinite(
      assessmentScore,
    )
  ) {
    return clampEvidencePercentage(
      assessmentScore,
    )
  }

  if (
    typeof evidence.value ===
      'number' &&
    Number.isFinite(
      evidence.value,
    )
  ) {
    return clampEvidencePercentage(
      evidence.value,
    )
  }

  return null
}

function getEvidenceWeight({
  evidence,
  group,
}: {
  evidence:
    EducationalEvidence

  group:
    EvidenceConsolidationGroup
}): number {
  const configuredWeight =
    group.weights[
      evidence.id
    ]

  if (
    typeof configuredWeight ===
      'number' &&
    Number.isFinite(
      configuredWeight,
    ) &&
    configuredWeight >
      0
  ) {
    return configuredWeight
  }

  const confidence =
    evidence
      .reliability
      .confidence ??
    0.5

  const quality =
    evidence
      .quality
      .overallScore ===
      null
      ? 0.5
      : evidence
          .quality
          .overallScore /
        100

  return Math.max(
    0.1,
    (
      confidence *
      0.6
    ) +
      (
        quality *
        0.4
      ),
  )
}

function isEvidenceInsideInterval({
  evidence,
  startsAt,
  endsAt,
}: {
  evidence:
    EducationalEvidence

  startsAt:
    string | null

  endsAt:
    string | null
}): boolean {
  const evidenceDate =
    getEvidenceDate(
      evidence,
    )

  if (!evidenceDate) {
    return true
  }

  const timestamp =
    Date.parse(
      evidenceDate,
    )

  if (
    Number.isNaN(
      timestamp,
    )
  ) {
    return false
  }

  if (
    startsAt &&
    timestamp <
      Date.parse(
        startsAt,
      )
  ) {
    return false
  }

  if (
    endsAt &&
    timestamp >
      Date.parse(
        endsAt,
      )
  ) {
    return false
  }

  return true
}

function matchesSubject({
  evidence,
  group,
}: {
  evidence:
    EducationalEvidence

  group:
    EvidenceConsolidationGroup
}): boolean {
  switch (
    group.subjectType
  ) {
    case 'student':
      return (
        evidence.studentId ===
          group.subjectId ||
        evidence.subjects.some(
          subject =>
            subject.subjectType ===
              'student' &&
            subject.subjectId ===
              group.subjectId,
        )
      )

    case 'student_group':
      return (
        evidence.studentGroupId ===
          group.subjectId ||
        evidence.subjects.some(
          subject =>
            subject.subjectType ===
              'student_group' &&
            subject.subjectId ===
              group.subjectId,
        )
      )

    case 'class':
      return (
        evidence.classId ===
          group.subjectId ||
        evidence.subjects.some(
          subject =>
            subject.subjectType ===
              'class' &&
            subject.subjectId ===
              group.subjectId,
        )
      )

    case 'teacher':
      return (
        evidence.teacherId ===
          group.subjectId ||
        evidence.subjects.some(
          subject =>
            subject.subjectType ===
              'teacher' &&
            subject.subjectId ===
              group.subjectId,
        )
      )

    case 'lesson':
      return (
        evidence.lessonId ===
          group.subjectId ||
        evidence.subjects.some(
          subject =>
            subject.subjectType ===
              'lesson' &&
            subject.subjectId ===
              group.subjectId,
        )
      )

    case 'planning':
      return (
        evidence.planningId ===
          group.subjectId ||
        evidence.subjects.some(
          subject =>
            subject.subjectType ===
              'planning' &&
            subject.subjectId ===
              group.subjectId,
        )
      )

    case 'component':
      return (
        evidence.componentId ===
          group.subjectId ||
        evidence.subjects.some(
          subject =>
            subject.subjectType ===
              'component' &&
            subject.subjectId ===
              group.subjectId,
        )
      )

    case 'course':
      return (
        evidence.courseId ===
          group.subjectId ||
        evidence.subjects.some(
          subject =>
            subject.subjectType ===
              'course' &&
            subject.subjectId ===
              group.subjectId,
        )
      )

    case 'program':
      return (
        evidence.programId ===
          group.subjectId ||
        evidence.subjects.some(
          subject =>
            subject.subjectType ===
              'program' &&
            subject.subjectId ===
              group.subjectId,
        )
      )

    case 'institution':
      return (
        evidence.institutionId ===
          group.subjectId ||
        evidence.subjects.some(
          subject =>
            subject.subjectType ===
              'institution' &&
            subject.subjectId ===
              group.subjectId,
        )
      )

    case 'curriculum':
      return evidence
        .curriculumReferences
        .some(
          reference =>
            reference.curriculumNodeId ===
              group.subjectId ||
            reference.frameworkId ===
              group.subjectId ||
            reference.versionId ===
              group.subjectId,
        )

    case 'competency':
      return evidence
        .curriculumReferences
        .some(
          reference =>
            reference.competencyId ===
            group.subjectId,
        )

    case 'skill':
      return evidence
        .curriculumReferences
        .some(
          reference =>
            reference.skillId ===
            group.subjectId,
        )

    case 'knowledge_object':
      return evidence
        .curriculumReferences
        .some(
          reference =>
            reference.knowledgeObjectId ===
            group.subjectId,
        )

    case 'learning_objective':
      return evidence
        .curriculumReferences
        .some(
          reference =>
            reference.learningObjectiveId ===
            group.subjectId,
        )

    case 'assessment':
      return (
        evidence
          .assessmentReference
          ?.assessmentId ===
        group.subjectId
      )

    case 'assessment_item':
      return (
        evidence
          .assessmentReference
          ?.assessmentItemId ===
        group.subjectId
      )

    case 'intervention':
      return evidence
        .interventionReferences
        .some(
          reference =>
            reference.interventionId ===
            group.subjectId,
        )

    case 'event':
    case 'resource':
    case 'campus':
    case 'other':
      return evidence.subjects.some(
        subject =>
          subject.subjectType ===
            group.subjectType &&
          subject.subjectId ===
            group.subjectId,
      )

    default:
      return false
  }
}

function matchesCurriculumReference({
  evidence,
  group,
}: {
  evidence:
    EducationalEvidence

  group:
    EvidenceConsolidationGroup
}): boolean {
  const expected =
    group.curriculumReference

  if (!expected) {
    return true
  }

  return evidence
    .curriculumReferences
    .some(
      reference =>
        (
          !expected.frameworkId ||
          reference.frameworkId ===
            expected.frameworkId
        ) &&
        (
          !expected.versionId ||
          reference.versionId ===
            expected.versionId
        ) &&
        (
          !expected.curriculumNodeId ||
          reference.curriculumNodeId ===
            expected.curriculumNodeId
        ) &&
        (
          !expected.competencyId ||
          reference.competencyId ===
            expected.competencyId
        ) &&
        (
          !expected.skillId ||
          reference.skillId ===
            expected.skillId
        ) &&
        (
          !expected.knowledgeObjectId ||
          reference.knowledgeObjectId ===
            expected.knowledgeObjectId
        ) &&
        (
          !expected.learningObjectiveId ||
          reference.learningObjectiveId ===
            expected.learningObjectiveId
        ),
    )
}

function filterEligibleEvidence({
  evidence,
  group,
}: {
  evidence:
    EducationalEvidence[]

  group:
    EvidenceConsolidationGroup
}): EducationalEvidence[] {
  const referencedIds =
    new Set(
      group.evidenceIds,
    )

  return evidence.filter(
    item =>
      (
        referencedIds.size ===
          0 ||
        referencedIds.has(
          item.id,
        )
      ) &&
      (
        !group.excludeRejectedEvidence ||
        item.status !==
          'rejected'
      ) &&
      (
        !group.excludeSupersededEvidence ||
        item.status !==
          'superseded'
      ) &&
      item.active &&
      matchesSubject({
        evidence:
          item,

        group,
      }) &&
      matchesCurriculumReference({
        evidence:
          item,

        group,
      }) &&
      isEvidenceInsideInterval({
        evidence:
          item,

        startsAt:
          group.startsAt,

        endsAt:
          group.endsAt,
      }),
  )
}

export function validateEvidenceConsolidationGroup({
  group,
  evidence,
}: {
  group:
    EvidenceConsolidationGroup

  evidence:
    EducationalEvidence[]
}): EvidenceConsolidationValidationResult {
  const issues:
    EvidenceConsolidationValidationIssue[] =
      []

  if (
    !group.id.trim()
  ) {
    issues.push({
      code:
        'missing_group_identifier',

      severity:
        'error',

      groupId:
        null,

      evidenceId:
        null,

      message:
        'O identificador do grupo de consolidação é obrigatório.',
    })
  }

  if (
    !group.name.trim()
  ) {
    issues.push({
      code:
        'missing_group_name',

      severity:
        'error',

      groupId:
        group.id ||
        null,

      evidenceId:
        null,

      message:
        'O nome do grupo de consolidação é obrigatório.',
    })
  }

  if (
    !group.subjectId.trim()
  ) {
    issues.push({
      code:
        'missing_subject',

      severity:
        'error',

      groupId:
        group.id ||
        null,

      evidenceId:
        null,

      message:
        'O sujeito da consolidação é obrigatório.',
    })
  }

  if (
    group.minimumEvidenceCount <
      1 ||
    !Number.isInteger(
      group.minimumEvidenceCount,
    )
  ) {
    issues.push({
      code:
        'invalid_minimum_evidence_count',

      severity:
        'error',

      groupId:
        group.id ||
        null,

      evidenceId:
        null,

      message:
        'A quantidade mínima de evidências deve ser um número inteiro maior ou igual a um.',
    })
  }

  if (
    !isValidInterval(
      group.startsAt,
      group.endsAt,
    )
  ) {
    issues.push({
      code:
        'invalid_temporal_interval',

      severity:
        'error',

      groupId:
        group.id ||
        null,

      evidenceId:
        null,

      message:
        'O intervalo temporal do grupo de consolidação é inválido.',
    })
  }

  const duplicateEvidenceIds =
    group.evidenceIds.filter(
      (
        evidenceId,
        index,
        values,
      ) =>
        values.indexOf(
          evidenceId,
        ) !==
        index,
    )

  if (
    duplicateEvidenceIds.length >
    0
  ) {
    issues.push({
      code:
        'duplicate_evidence_reference',

      severity:
        'warning',

      groupId:
        group.id ||
        null,

      evidenceId:
        null,

      message:
        'O grupo possui referências duplicadas de evidências.',
    })
  }

  for (
    const [
      evidenceId,
      weight,
    ]
    of Object.entries(
      group.weights,
    )
  ) {
    if (
      !Number.isFinite(
        weight,
      ) ||
      weight <=
        0
    ) {
      issues.push({
        code:
          'invalid_weight',

        severity:
          'error',

        groupId:
          group.id ||
          null,

        evidenceId,

        message:
          `O peso configurado para a evidência "${evidenceId}" deve ser maior que zero.`,
      })
    }
  }

  const evidenceById =
    new Map(
      evidence.map(
        item => [
          item.id,
          item,
        ],
      ),
    )

  for (
    const evidenceId
    of group.evidenceIds
  ) {
    if (
      !evidenceById.has(
        evidenceId,
      )
    ) {
      issues.push({
        code:
          'evidence_not_found',

        severity:
          'warning',

        groupId:
          group.id ||
          null,

        evidenceId,

        message:
          `A evidência "${evidenceId}" não foi encontrada.`,
      })
    }
  }

  const eligibleEvidence =
    filterEligibleEvidence({
      evidence,
      group,
    })

  if (
    eligibleEvidence.length ===
    0
  ) {
    issues.push({
      code:
        'missing_evidence',

      severity:
        'error',

      groupId:
        group.id ||
        null,

      evidenceId:
        null,

      message:
        'Nenhuma evidência elegível foi encontrada para o grupo.',
    })
  } else if (
    eligibleEvidence.length <
    group.minimumEvidenceCount
  ) {
    issues.push({
      code:
        'insufficient_evidence',

      severity:
        'warning',

      groupId:
        group.id ||
        null,

      evidenceId:
        null,

      message:
        `O grupo possui ${eligibleEvidence.length} evidência(s) elegível(is), abaixo do mínimo de ${group.minimumEvidenceCount}.`,
    })
  }

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

  return {
    valid:
      errors.length ===
      0,

    issues,

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

function buildWeightedValues({
  evidence,
  group,
}: {
  evidence:
    EducationalEvidence[]

  group:
    EvidenceConsolidationGroup
}): WeightedEvidenceValue[] {
  return evidence
    .map(
      item => {
        const value =
          getEvidenceNumericValue(
            item,
          )

        if (
          value ===
          null
        ) {
          return null
        }

        return {
          evidenceId:
            item.id,

          value,

          weight:
            getEvidenceWeight({
              evidence:
                item,

              group,
            }),

          occurredAt:
            getEvidenceDate(
              item,
            ),

          confidence:
            item
              .reliability
              .confidence,

          qualityScore:
            item
              .quality
              .overallScore,
        }
      },
    )
    .filter(
      (
        item,
      ): item is WeightedEvidenceValue =>
        item !==
        null,
    )
}

function aggregateNumericValues({
  values,
  method,
}: {
  values:
    WeightedEvidenceValue[]

  method:
    EvidenceAggregationMethod
}): number | null {
  if (
    values.length ===
    0
  ) {
    return null
  }

  const numericValues =
    values.map(
      item =>
        item.value,
    )

  switch (
    method
  ) {
    case 'count':
      return clampEvidencePercentage(
        values.length,
      )

    case 'sum':
      return clampEvidencePercentage(
        numericValues.reduce(
          (
            total,
            value,
          ) =>
            total +
            value,
          0,
        ),
      )

    case 'average':
      return average(
        numericValues,
      )

    case 'weighted_average': {
      const totalWeight =
        values.reduce(
          (
            total,
            item,
          ) =>
            total +
            item.weight,
          0,
        )

      if (
        totalWeight <=
        0
      ) {
        return average(
          numericValues,
        )
      }

      return (
        values.reduce(
          (
            total,
            item,
          ) =>
            total +
            (
              item.value *
              item.weight
            ),
          0,
        ) /
        totalWeight
      )
    }

    case 'median':
      return median(
        numericValues,
      )

    case 'minimum':
      return Math.min(
        ...numericValues,
      )

    case 'maximum':
      return Math.max(
        ...numericValues,
      )

    case 'latest': {
      const ordered =
        values
          .filter(
            item =>
              Boolean(
                item.occurredAt,
              ),
          )
          .sort(
            (
              first,
              second,
            ) =>
              Date.parse(
                second.occurredAt ??
                '',
              ) -
              Date.parse(
                first.occurredAt ??
                '',
              ),
          )

      return (
        ordered[0]
          ?.value ??
        values[
          values.length -
          1
        ].value
      )
    }

    case 'proportion':
      return clampEvidencePercentage(
        (
          numericValues.filter(
            value =>
              value >=
              60,
          ).length /
          numericValues.length
        ) *
        100,
      )

    case 'consensus':
      return median(
        numericValues,
      )

    case 'trend':
    case 'rule_based':
    case 'custom':
    default:
      return average(
        numericValues,
      )
  }
}

function calculateCoverage({
  eligibleCount,
  referencedCount,
  minimumCount,
}: {
  eligibleCount:
    number

  referencedCount:
    number

  minimumCount:
    number
}): number {
  const expectedCount =
    referencedCount >
      0
      ? referencedCount
      : minimumCount

  if (
    expectedCount <=
    0
  ) {
    return 100
  }

  return clampEvidencePercentage(
    (
      eligibleCount /
      expectedCount
    ) *
    100,
  )
}

function calculateConsistency(
  values:
    WeightedEvidenceValue[],
): number | null {
  const numericValues =
    values.map(
      item =>
        item.value,
    )

  const deviation =
    standardDeviation(
      numericValues,
    )

  if (
    deviation ===
    null
  ) {
    return null
  }

  return clampEvidenceConfidence(
    1 -
      Math.min(
        1,
        deviation /
          50,
      ),
  )
}

function calculateConsolidatedConfidence({
  evidence,
  consistency,
  coverage,
}: {
  evidence:
    EducationalEvidence[]

  consistency:
    number | null

  coverage:
    number | null
}): number | null {
  const confidenceValues =
    evidence
      .map(
        item =>
          item
            .reliability
            .confidence,
      )
      .filter(
        (
          value,
        ): value is number =>
          value !==
          null,
      )

  const averageConfidence =
    average(
      confidenceValues,
    )

  if (
    averageConfidence ===
      null
  ) {
    return null
  }

  const normalizedCoverage =
    coverage ===
      null
      ? 0.5
      : coverage /
        100

  const normalizedConsistency =
    consistency ??
    0.5

  const evidenceVolumeBonus =
    Math.min(
      0.1,
      evidence.length *
        0.01,
    )

  return clampEvidenceConfidence(
    (
      averageConfidence *
      0.6
    ) +
      (
        normalizedConsistency *
        0.25
      ) +
      (
        normalizedCoverage *
        0.15
      ) +
      evidenceVolumeBonus,
  )
}

function getConsolidatedQualityLevel(
  evidence:
    EducationalEvidence[],
): EvidenceQualityLevel {
  const scores =
    evidence
      .map(
        item =>
          item
            .quality
            .overallScore,
      )
      .filter(
        (
          value,
        ): value is number =>
          value !==
          null,
      )

  const score =
    average(
      scores,
    )

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

function calculateTrend(
  values:
    WeightedEvidenceValue[],
): EvidenceConsolidatedResult['trend'] {
  const chronological =
    values
      .filter(
        item =>
          Boolean(
            item.occurredAt,
          ),
      )
      .sort(
        (
          first,
          second,
        ) =>
          Date.parse(
            first.occurredAt ??
            '',
          ) -
          Date.parse(
            second.occurredAt ??
            '',
          ),
      )

  if (
    chronological.length <
    2
  ) {
    return 'insufficient_data'
  }

  const splitIndex =
    Math.max(
      1,
      Math.floor(
        chronological.length /
        2,
      ),
    )

  const firstPeriod =
    chronological.slice(
      0,
      splitIndex,
    )

  const secondPeriod =
    chronological.slice(
      splitIndex,
    )

  const firstAverage =
    average(
      firstPeriod.map(
        item =>
          item.value,
      ),
    )

  const secondAverage =
    average(
      secondPeriod.map(
        item =>
          item.value,
      ),
    )

  if (
    firstAverage ===
      null ||
    secondAverage ===
      null
  ) {
    return 'insufficient_data'
  }

  const difference =
    secondAverage -
    firstAverage

  if (
    difference >=
    20
  ) {
    return 'strong_growth'
  }

  if (
    difference >=
    7
  ) {
    return 'growth'
  }

  if (
    difference <=
    -20
  ) {
    return 'strong_decline'
  }

  if (
    difference <=
    -7
  ) {
    return 'decline'
  }

  return 'stable'
}

function buildExplanation({
  group,
  eligibleEvidence,
  normalizedValue,
  confidence,
  trend,
}: {
  group:
    EvidenceConsolidationGroup

  eligibleEvidence:
    EducationalEvidence[]

  normalizedValue:
    number | null

  confidence:
    number | null

  trend:
    EvidenceConsolidatedResult['trend']
}): string {
  const valueDescription =
    normalizedValue ===
      null
      ? 'sem valor numérico consolidado'
      : `com valor consolidado de ${normalizedValue.toFixed(2)}`

  const confidenceDescription =
    confidence ===
      null
      ? 'sem confiança calculável'
      : `com confiança de ${(confidence * 100).toFixed(2)}%`

  return [
    `Consolidação "${group.name}" processada a partir de ${eligibleEvidence.length} evidência(s)`,
    valueDescription,
    confidenceDescription,
    `utilizando o método ${group.aggregationMethod}`,
    `com tendência classificada como ${trend}.`,
  ].join(
    ' ',
  )
}

export function consolidateEvidenceGroup({
  group,
  evidence,
}: {
  group:
    EvidenceConsolidationGroup

  evidence:
    EducationalEvidence[]
}): EvidenceConsolidationExecutionResult {
  const validation =
    validateEvidenceConsolidationGroup({
      group,
      evidence,
    })

  if (
    !validation.valid
  ) {
    return {
      success:
        false,

      result:
        null,

      evidence:
        [],

      validation,

      warnings:
        validation.warnings,

      errors:
        validation.errors,
    }
  }

  const eligibleEvidence =
    filterEligibleEvidence({
      evidence,
      group,
    })

  const numericValues =
    buildWeightedValues({
      evidence:
        eligibleEvidence,

      group,
    })

  const normalizedValue =
    aggregateNumericValues({
      values:
        numericValues,

      method:
        group.aggregationMethod,
    })

  const consistency =
    calculateConsistency(
      numericValues,
    )

  const coverage =
    calculateCoverage({
      eligibleCount:
        eligibleEvidence.length,

      referencedCount:
        group.evidenceIds.length,

      minimumCount:
        group.minimumEvidenceCount,
    })

  const confidence =
    calculateConsolidatedConfidence({
      evidence:
        eligibleEvidence,

      consistency,

      coverage,
    })

  const confidenceLevel =
    getEvidenceConfidenceLevel(
      confidence,
    )

  const strength:
    EvidenceStrength =
      getEvidenceStrength(
        confidence,
      )

  const qualityLevel =
    getConsolidatedQualityLevel(
      eligibleEvidence,
    )

  const trend =
    calculateTrend(
      numericValues,
    )

  const rejectedEvidenceCount =
    evidence.filter(
      item =>
        (
          group.evidenceIds.length ===
            0 ||
          group.evidenceIds.includes(
            item.id,
          )
        ) &&
        item.status ===
          'rejected',
    ).length

  const limitations:
    string[] = []

  const warnings: string[] = [
    ...validation.warnings,
  ]

  if (
    eligibleEvidence.length <
    group.minimumEvidenceCount
  ) {
    limitations.push(
      'Quantidade de evidências abaixo do mínimo definido para a consolidação.',
    )
  }

  if (
    numericValues.length ===
    0
  ) {
    limitations.push(
      'Nenhuma evidência possui valor numérico utilizável.',
    )
  }

  if (
    confidence ===
      null
  ) {
    limitations.push(
      'Não foi possível calcular confiança consolidada.',
    )
  }

  if (
    consistency !==
      null &&
    consistency <
      0.6
  ) {
    warnings.push(
      'As evidências apresentam baixa consistência entre seus valores.',
    )
  }

  if (
    coverage <
    70
  ) {
    warnings.push(
      'A cobertura do conjunto de evidências está abaixo de 70%.',
    )
  }

  if (
    rejectedEvidenceCount >
    0
  ) {
    warnings.push(
      `${rejectedEvidenceCount} evidência(s) rejeitada(s) foram identificadas no conjunto de origem.`,
    )
  }

  const requiresHumanReview =
    eligibleEvidence.length <
      group.minimumEvidenceCount ||
    confidence ===
      null ||
    confidence <
      0.65 ||
    qualityLevel ===
      'insufficient' ||
    consistency ===
      null ||
    consistency <
      0.6 ||
    eligibleEvidence.some(
      item =>
        item
          .quality
          .humanReviewRequired ||
        item
          .reliability
          .humanReviewRequired ||
        item
          .privacy
          .containsSensitiveData ||
        item
          .privacy
          .containsMinorData,
    )

  const result:
    EvidenceConsolidatedResult = {
    id:
      `consolidated-${group.id}-${Date.now()}`,

    consolidationGroupId:
      group.id,

    subjectType:
      group.subjectType,

    subjectId:
      group.subjectId,

    evidenceIds:
      eligibleEvidence.map(
        item =>
          item.id,
      ),

    evidenceCount:
      evidence.length,

    validEvidenceCount:
      eligibleEvidence.length,

    rejectedEvidenceCount,

    normalizedValue:
      normalizedValue ===
        null
        ? null
        : clampEvidencePercentage(
            normalizedValue,
          ),

    strength,

    confidence,

    confidenceLevel,

    qualityLevel,

    trend,

    consistency,

    coverage,

    explanation:
      buildExplanation({
        group,
        eligibleEvidence,
        normalizedValue,
        confidence,
        trend,
      }),

    limitations:
      uniqueStrings(
        limitations,
      ),

    warnings:
      uniqueStrings(
        warnings,
      ),

    requiresHumanReview,

    calculatedAt:
      nowIso(),

    calculationVersion:
      'evidence-consolidator-v1',

    metadata: {
      aggregationMethod:
        group.aggregationMethod,

      minimumEvidenceCount:
        group.minimumEvidenceCount,

      numericEvidenceCount:
        numericValues.length,

      excludedEvidenceCount:
        Math.max(
          0,
          evidence.length -
            eligibleEvidence.length,
        ),

      curriculumReference:
        group.curriculumReference,

      startsAt:
        group.startsAt,

      endsAt:
        group.endsAt,
    },
  }

  return {
    success:
      true,

    result,

    evidence:
      eligibleEvidence,

    validation,

    warnings:
      result.warnings,

    errors:
      [],
  }
}

export function consolidateEvidenceBatch({
  groups,
  evidence,
}: {
  groups:
    EvidenceConsolidationGroup[]

  evidence:
    EducationalEvidence[]
}): EvidenceBatchConsolidationResult {
  const executions =
    groups.map(
      group =>
        consolidateEvidenceGroup({
          group,
          evidence,
        }),
    )

  const results =
    executions
      .map(
        execution =>
          execution.result,
      )
      .filter(
        (
          result,
        ): result is EvidenceConsolidatedResult =>
          result !==
          null,
      )

  const warnings =
    uniqueStrings(
      executions.flatMap(
        execution =>
          execution.warnings,
      ),
    )

  const errors =
    uniqueStrings(
      executions.flatMap(
        execution =>
          execution.errors,
      ),
    )

  return {
    success:
      errors.length ===
      0,

    results,

    executions,

    warnings,

    errors,

    requiresHumanReview:
      results.some(
        result =>
          result
            .requiresHumanReview,
      ) ||
      executions.some(
        execution =>
          !execution.success,
      ),
  }
}

export function createEvidenceConsolidationGroup({
  id,
  name,
  subjectType,
  subjectId,
  evidenceIds = [],
  aggregationMethod = 'weighted_average',
  minimumEvidenceCount = 2,
}: {
  id:
    string

  name:
    string

  subjectType:
    EvidenceConsolidationGroup['subjectType']

  subjectId:
    string

  evidenceIds?:
    string[]

  aggregationMethod?:
    EvidenceAggregationMethod

  minimumEvidenceCount?:
    number
}): EvidenceConsolidationGroup {
  return {
    id,

    name,

    description:
      null,

    evidenceIds:
      Array.from(
        new Set(
          evidenceIds.filter(
            Boolean,
          ),
        ),
      ),

    subjectType,

    subjectId,

    curriculumReference:
      null,

    startsAt:
      null,

    endsAt:
      null,

    aggregationMethod,

    weights:
      {},

    minimumEvidenceCount:
      Math.max(
        1,
        Math.floor(
          minimumEvidenceCount,
        ),
      ),

    excludeRejectedEvidence:
      true,

    excludeSupersededEvidence:
      true,

    metadata:
      {},
  }
}

export const evidenceConsolidatorService = {
  validateGroup:
    validateEvidenceConsolidationGroup,

  consolidate:
    consolidateEvidenceGroup,

  consolidateBatch:
    consolidateEvidenceBatch,

  createGroup:
    createEvidenceConsolidationGroup,
}