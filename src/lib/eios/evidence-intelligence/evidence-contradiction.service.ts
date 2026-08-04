import {
  type EducationalEvidence,
  type EvidenceContradiction,
} from './evidence-intelligence.contract'

export type EvidenceContradictionSeverity =
  EvidenceContradiction['severity']

export type EvidenceContradictionDetectionOptions = {
  minimumValueDifference:
    number

  criticalValueDifference:
    number

  maximumTemporalDistanceDays:
    number

  compareDifferentSources:
    boolean

  compareCurriculumReferences:
    boolean

  compareAssessments:
    boolean

  detectAttendancePerformanceConflict:
    boolean

  detectInterventionWithoutNeed:
    boolean

  detectCurriculumWithoutEvidence:
    boolean

  detectStatusConflicts:
    boolean

  includeRejectedEvidence:
    boolean

  includeSupersededEvidence:
    boolean
}

export type EvidenceContradictionDetectionResult = {
  success:
    boolean

  contradictions:
    EvidenceContradiction[]

  analyzedEvidenceCount:
    number

  analyzedPairCount:
    number

  warnings:
    string[]

  errors:
    string[]

  requiresHumanReview:
    boolean
}

export type EvidenceContradictionSummary = {
  total:
    number

  unresolved:
    number

  resolved:
    number

  low:
    number

  medium:
    number

  high:
    number

  critical:
    number

  byType:
    Record<
      EvidenceContradiction['contradictionType'],
      number
    >

  requiresHumanReview:
    boolean
}

const DEFAULT_OPTIONS:
  EvidenceContradictionDetectionOptions = {
  minimumValueDifference:
    25,

  criticalValueDifference:
    60,

  maximumTemporalDistanceDays:
    45,

  compareDifferentSources:
    true,

  compareCurriculumReferences:
    true,

  compareAssessments:
    true,

  detectAttendancePerformanceConflict:
    true,

  detectInterventionWithoutNeed:
    true,

  detectCurriculumWithoutEvidence:
    true,

  detectStatusConflicts:
    true,

  includeRejectedEvidence:
    false,

  includeSupersededEvidence:
    false,
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

function createId(
  prefix:
    string,
): string {
  return [
    prefix,
    Date.now(),
    Math.random()
      .toString(36)
      .slice(2, 10),
  ].join(
    '-',
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

function getEvidenceTimestamp(
  evidence:
    EducationalEvidence,
): number | null {
  const date =
    getEvidenceDate(
      evidence,
    )

  if (!date) {
    return null
  }

  const timestamp =
    Date.parse(
      date,
    )

  return Number.isNaN(
    timestamp,
  )
    ? null
    : timestamp
}

function getTemporalDistanceDays(
  evidenceA:
    EducationalEvidence,

  evidenceB:
    EducationalEvidence,
): number | null {
  const timestampA =
    getEvidenceTimestamp(
      evidenceA,
    )

  const timestampB =
    getEvidenceTimestamp(
      evidenceB,
    )

  if (
    timestampA ===
      null ||
    timestampB ===
      null
  ) {
    return null
  }

  return (
    Math.abs(
      timestampA -
      timestampB,
    ) /
    (
      1000 *
      60 *
      60 *
      24
    )
  )
}

function getNumericValue(
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
    return evidence.normalizedValue
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
    return assessmentScore
  }

  if (
    typeof evidence.value ===
      'number' &&
    Number.isFinite(
      evidence.value,
    )
  ) {
    return evidence.value
  }

  return null
}

function getSubjectKeys(
  evidence:
    EducationalEvidence,
): string[] {
  const keys:
    string[] = []

  const references: Array<
    [
      string,
      string | null,
    ]
  > = [
    [
      'organization',
      evidence.organizationId,
    ],
    [
      'institution',
      evidence.institutionId,
    ],
    [
      'campus',
      evidence.campusId,
    ],
    [
      'program',
      evidence.programId,
    ],
    [
      'course',
      evidence.courseId,
    ],
    [
      'component',
      evidence.componentId,
    ],
    [
      'offering',
      evidence.offeringId,
    ],
    [
      'class',
      evidence.classId,
    ],
    [
      'lesson',
      evidence.lessonId,
    ],
    [
      'planning',
      evidence.planningId,
    ],
    [
      'teacher',
      evidence.teacherId,
    ],
    [
      'student',
      evidence.studentId,
    ],
    [
      'student_group',
      evidence.studentGroupId,
    ],
    [
      'academic_period',
      evidence.academicPeriodId,
    ],
  ]

  for (
    const [
      type,
      id,
    ]
    of references
  ) {
    if (id) {
      keys.push(
        `${type}:${id}`,
      )
    }
  }

  for (
    const subject
    of evidence.subjects
  ) {
    keys.push(
      `${subject.subjectType}:${subject.subjectId}`,
    )
  }

  return uniqueStrings(
    keys,
  )
}

function hasSharedSubject(
  evidenceA:
    EducationalEvidence,

  evidenceB:
    EducationalEvidence,
): boolean {
  const keysA =
    new Set(
      getSubjectKeys(
        evidenceA,
      ),
    )

  return getSubjectKeys(
    evidenceB,
  ).some(
    key =>
      keysA.has(
        key,
      ),
  )
}

function getCurriculumKeys(
  evidence:
    EducationalEvidence,
): string[] {
  const keys:
    string[] = []

  for (
    const reference
    of evidence.curriculumReferences
  ) {
    const values: Array<
      [
        string,
        string | null,
      ]
    > = [
      [
        'framework',
        reference.frameworkId,
      ],
      [
        'version',
        reference.versionId,
      ],
      [
        'curriculum_node',
        reference.curriculumNodeId,
      ],
      [
        'competency',
        reference.competencyId,
      ],
      [
        'skill',
        reference.skillId,
      ],
      [
        'knowledge_object',
        reference.knowledgeObjectId,
      ],
      [
        'learning_objective',
        reference.learningObjectiveId,
      ],
    ]

    for (
      const [
        type,
        id,
      ]
      of values
    ) {
      if (id) {
        keys.push(
          `${type}:${id}`,
        )
      }
    }
  }

  return uniqueStrings(
    keys,
  )
}

function hasSharedCurriculumReference(
  evidenceA:
    EducationalEvidence,

  evidenceB:
    EducationalEvidence,
): boolean {
  const keysA =
    new Set(
      getCurriculumKeys(
        evidenceA,
      ),
    )

  return getCurriculumKeys(
    evidenceB,
  ).some(
    key =>
      keysA.has(
        key,
      ),
  )
}

function hasDifferentCurriculumReference(
  evidenceA:
    EducationalEvidence,

  evidenceB:
    EducationalEvidence,
): boolean {
  const keysA =
    getCurriculumKeys(
      evidenceA,
    )

  const keysB =
    getCurriculumKeys(
      evidenceB,
    )

  if (
    keysA.length ===
      0 ||
    keysB.length ===
      0
  ) {
    return false
  }

  return !hasSharedCurriculumReference(
    evidenceA,
    evidenceB,
  )
}

function areSameAssessment(
  evidenceA:
    EducationalEvidence,

  evidenceB:
    EducationalEvidence,
): boolean {
  const assessmentA =
    evidenceA.assessmentReference

  const assessmentB =
    evidenceB.assessmentReference

  if (
    !assessmentA ||
    !assessmentB
  ) {
    return false
  }

  if (
    assessmentA.attemptId &&
    assessmentB.attemptId
  ) {
    return (
      assessmentA.attemptId ===
      assessmentB.attemptId
    )
  }

  if (
    assessmentA.assessmentItemId &&
    assessmentB.assessmentItemId
  ) {
    return (
      assessmentA.assessmentItemId ===
      assessmentB.assessmentItemId
    )
  }

  return Boolean(
    assessmentA.assessmentId &&
    assessmentB.assessmentId &&
    assessmentA.assessmentId ===
      assessmentB.assessmentId,
  )
}

function isPerformanceEvidence(
  evidence:
    EducationalEvidence,
): boolean {
  return [
    'assessment',
    'assessment_item',
    'grade',
    'activity',
    'assignment',
    'project',
    'portfolio',
    'written_production',
    'oral_production',
    'practical_production',
    'laboratory_activity',
    'digital_activity',
    'competency_demonstration',
    'skill_demonstration',
    'learning_objective_progress',
  ].includes(
    evidence.type,
  )
}

function isAttendanceEvidence(
  evidence:
    EducationalEvidence,
): boolean {
  return (
    evidence.type ===
      'attendance' ||
    evidence.type ===
      'absence'
  )
}

function isInterventionEvidence(
  evidence:
    EducationalEvidence,
): boolean {
  return [
    'intervention',
    'recovery_action',
    'recomposition_action',
    'learning_support',
    'accommodation',
    'accessibility_action',
  ].includes(
    evidence.type,
  )
}

function isCurriculumCoverageEvidence(
  evidence:
    EducationalEvidence,
): boolean {
  return [
    'curriculum_coverage',
    'competency_demonstration',
    'skill_demonstration',
    'learning_objective_progress',
  ].includes(
    evidence.type,
  )
}

function isEligibleEvidence(
  evidence:
    EducationalEvidence,

  options:
    EvidenceContradictionDetectionOptions,
): boolean {
  if (
    !options.includeRejectedEvidence &&
    evidence.status ===
      'rejected'
  ) {
    return false
  }

  if (
    !options.includeSupersededEvidence &&
    evidence.status ===
      'superseded'
  ) {
    return false
  }

  return evidence.active
}

function getSeverityByDifference({
  difference,
  criticalDifference,
}: {
  difference:
    number

  criticalDifference:
    number
}): EvidenceContradictionSeverity {
  if (
    difference >=
    criticalDifference
  ) {
    return 'critical'
  }

  if (
    difference >=
    criticalDifference *
      0.75
  ) {
    return 'high'
  }

  if (
    difference >=
    criticalDifference *
      0.45
  ) {
    return 'medium'
  }

  return 'low'
}

function createContradiction({
  evidenceA,
  evidenceB,
  contradictionType,
  severity,
  explanation,
  resolvableAutomatically,
  resolution = null,
  metadata = {},
}: {
  evidenceA:
    EducationalEvidence

  evidenceB:
    EducationalEvidence

  contradictionType:
    EvidenceContradiction['contradictionType']

  severity:
    EvidenceContradictionSeverity

  explanation:
    string

  resolvableAutomatically:
    boolean

  resolution?:
    string | null

  metadata?:
    Record<string, unknown>
}): EvidenceContradiction {
  return {
    id:
      createId(
        'contradiction',
      ),

    evidenceIdA:
      evidenceA.id,

    evidenceIdB:
      evidenceB.id,

    contradictionType,

    severity,

    explanation,

    resolvableAutomatically,

    resolution,

    resolved:
      false,

    resolvedBy:
      null,

    resolvedAt:
      null,

    requiresHumanReview:
      !resolvableAutomatically ||
      severity ===
        'high' ||
      severity ===
        'critical' ||
      evidenceA.privacy
        .containsSensitiveData ||
      evidenceB.privacy
        .containsSensitiveData ||
      evidenceA.privacy
        .containsMinorData ||
      evidenceB.privacy
        .containsMinorData,

    metadata: {
      detectedAt:
        nowIso(),

      engine:
        'evidence-contradiction',

      version:
        'v1',

      evidenceTypeA:
        evidenceA.type,

      evidenceTypeB:
        evidenceB.type,

      sourceTypeA:
        evidenceA.sourceType,

      sourceTypeB:
        evidenceB.sourceType,

      ...metadata,
    },
  }
}

function detectValueContradiction({
  evidenceA,
  evidenceB,
  options,
}: {
  evidenceA:
    EducationalEvidence

  evidenceB:
    EducationalEvidence

  options:
    EvidenceContradictionDetectionOptions
}): EvidenceContradiction | null {
  if (
    !hasSharedSubject(
      evidenceA,
      evidenceB,
    )
  ) {
    return null
  }

  if (
    options.compareCurriculumReferences &&
    getCurriculumKeys(
      evidenceA,
    ).length >
      0 &&
    getCurriculumKeys(
      evidenceB,
    ).length >
      0 &&
    !hasSharedCurriculumReference(
      evidenceA,
      evidenceB,
    )
  ) {
    return null
  }

  const valueA =
    getNumericValue(
      evidenceA,
    )

  const valueB =
    getNumericValue(
      evidenceB,
    )

  if (
    valueA ===
      null ||
    valueB ===
      null
  ) {
    return null
  }

  const difference =
    Math.abs(
      valueA -
      valueB,
    )

  if (
    difference <
    options.minimumValueDifference
  ) {
    return null
  }

  const temporalDistance =
    getTemporalDistanceDays(
      evidenceA,
      evidenceB,
    )

  if (
    temporalDistance !==
      null &&
    temporalDistance >
      options
        .maximumTemporalDistanceDays
  ) {
    return null
  }

  const severity =
    getSeverityByDifference({
      difference,

      criticalDifference:
        options
          .criticalValueDifference,
    })

  return createContradiction({
    evidenceA,
    evidenceB,

    contradictionType:
      'value',

    severity,

    explanation:
      `As evidências apresentam diferença de ${difference.toFixed(2)} pontos para o mesmo contexto educacional.`,

    resolvableAutomatically:
      false,

    metadata: {
      valueA,
      valueB,
      difference,
      temporalDistanceDays:
        temporalDistance,
    },
  })
}

function detectAssessmentContradiction({
  evidenceA,
  evidenceB,
  options,
}: {
  evidenceA:
    EducationalEvidence

  evidenceB:
    EducationalEvidence

  options:
    EvidenceContradictionDetectionOptions
}): EvidenceContradiction | null {
  if (
    !options.compareAssessments ||
    !areSameAssessment(
      evidenceA,
      evidenceB,
    )
  ) {
    return null
  }

  const assessmentA =
    evidenceA.assessmentReference

  const assessmentB =
    evidenceB.assessmentReference

  if (
    !assessmentA ||
    !assessmentB
  ) {
    return null
  }

  const scoreA =
    assessmentA.normalizedScore ??
    getNumericValue(
      evidenceA,
    )

  const scoreB =
    assessmentB.normalizedScore ??
    getNumericValue(
      evidenceB,
    )

  if (
    scoreA ===
      null ||
    scoreB ===
      null
  ) {
    return null
  }

  const difference =
    Math.abs(
      scoreA -
      scoreB,
    )

  const gradeConflict =
    Boolean(
      assessmentA.grade &&
      assessmentB.grade &&
      assessmentA.grade !==
        assessmentB.grade,
    )

  const rubricConflict =
    Boolean(
      assessmentA.rubricLevelId &&
      assessmentB.rubricLevelId &&
      assessmentA.rubricLevelId !==
        assessmentB.rubricLevelId,
    )

  if (
    difference <
      options.minimumValueDifference &&
    !gradeConflict &&
    !rubricConflict
  ) {
    return null
  }

  const severity =
    gradeConflict ||
    rubricConflict
      ? difference >=
          options
            .criticalValueDifference
        ? 'critical'
        : 'high'
      : getSeverityByDifference({
          difference,

          criticalDifference:
            options
              .criticalValueDifference,
        })

  return createContradiction({
    evidenceA,
    evidenceB,

    contradictionType:
      'value',

    severity,

    explanation:
      'As evidências registram resultados incompatíveis para a mesma avaliação, tentativa ou item avaliativo.',

    resolvableAutomatically:
      false,

    metadata: {
      scoreA,
      scoreB,
      difference,
      gradeA:
        assessmentA.grade,
      gradeB:
        assessmentB.grade,
      rubricLevelA:
        assessmentA.rubricLevelId,
      rubricLevelB:
        assessmentB.rubricLevelId,
    },
  })
}

function detectTemporalContradiction({
  evidenceA,
  evidenceB,
}: {
  evidenceA:
    EducationalEvidence

  evidenceB:
    EducationalEvidence
}): EvidenceContradiction | null {
  if (
    !hasSharedSubject(
      evidenceA,
      evidenceB,
    )
  ) {
    return null
  }

  const startsAtA =
    evidenceA
      .temporalContext
      .startsAt

  const endsAtA =
    evidenceA
      .temporalContext
      .endsAt

  const startsAtB =
    evidenceB
      .temporalContext
      .startsAt

  const endsAtB =
    evidenceB
      .temporalContext
      .endsAt

  if (
    !startsAtA ||
    !endsAtA ||
    !startsAtB ||
    !endsAtB
  ) {
    return null
  }

  const startA =
    Date.parse(
      startsAtA,
    )

  const endA =
    Date.parse(
      endsAtA,
    )

  const startB =
    Date.parse(
      startsAtB,
    )

  const endB =
    Date.parse(
      endsAtB,
    )

  if (
    [
      startA,
      endA,
      startB,
      endB,
    ].some(
      Number.isNaN,
    )
  ) {
    return null
  }

  const sameEvent =
    evidenceA.type ===
      evidenceB.type &&
    evidenceA.lessonId ===
      evidenceB.lessonId &&
    evidenceA.classId ===
      evidenceB.classId

  if (!sameEvent) {
    return null
  }

  const intervalsConflict =
    endA <
      startB ||
    endB <
      startA

  if (!intervalsConflict) {
    return null
  }

  return createContradiction({
    evidenceA,
    evidenceB,

    contradictionType:
      'temporal',

    severity:
      'medium',

    explanation:
      'As evidências descrevem o mesmo evento educacional em intervalos temporais incompatíveis.',

    resolvableAutomatically:
      false,

    metadata: {
      startsAtA,
      endsAtA,
      startsAtB,
      endsAtB,
    },
  })
}

function detectCurriculumContradiction({
  evidenceA,
  evidenceB,
  options,
}: {
  evidenceA:
    EducationalEvidence

  evidenceB:
    EducationalEvidence

  options:
    EvidenceContradictionDetectionOptions
}): EvidenceContradiction | null {
  if (
    !options.compareCurriculumReferences ||
    !hasSharedSubject(
      evidenceA,
      evidenceB,
    ) ||
    !hasDifferentCurriculumReference(
      evidenceA,
      evidenceB,
    )
  ) {
    return null
  }

  const temporalDistance =
    getTemporalDistanceDays(
      evidenceA,
      evidenceB,
    )

  if (
    temporalDistance !==
      null &&
    temporalDistance >
      options
        .maximumTemporalDistanceDays
  ) {
    return null
  }

  if (
    !isCurriculumCoverageEvidence(
      evidenceA,
    ) &&
    !isCurriculumCoverageEvidence(
      evidenceB,
    ) &&
    !isPerformanceEvidence(
      evidenceA,
    ) &&
    !isPerformanceEvidence(
      evidenceB,
    )
  ) {
    return null
  }

  return createContradiction({
    evidenceA,
    evidenceB,

    contradictionType:
      'curriculum',

    severity:
      'medium',

    explanation:
      'As evidências do mesmo sujeito e período estão associadas a referências curriculares incompatíveis.',

    resolvableAutomatically:
      false,

    metadata: {
      curriculumKeysA:
        getCurriculumKeys(
          evidenceA,
        ),

      curriculumKeysB:
        getCurriculumKeys(
          evidenceB,
        ),

      temporalDistanceDays:
        temporalDistance,
    },
  })
}

function detectSourceContradiction({
  evidenceA,
  evidenceB,
  options,
}: {
  evidenceA:
    EducationalEvidence

  evidenceB:
    EducationalEvidence

  options:
    EvidenceContradictionDetectionOptions
}): EvidenceContradiction | null {
  if (
    !options.compareDifferentSources ||
    evidenceA.sourceType ===
      evidenceB.sourceType ||
    !hasSharedSubject(
      evidenceA,
      evidenceB,
    )
  ) {
    return null
  }

  const valueA =
    getNumericValue(
      evidenceA,
    )

  const valueB =
    getNumericValue(
      evidenceB,
    )

  if (
    valueA ===
      null ||
    valueB ===
      null
  ) {
    return null
  }

  const difference =
    Math.abs(
      valueA -
      valueB,
    )

  if (
    difference <
    options.minimumValueDifference
  ) {
    return null
  }

  const temporalDistance =
    getTemporalDistanceDays(
      evidenceA,
      evidenceB,
    )

  if (
    temporalDistance !==
      null &&
    temporalDistance >
      options
        .maximumTemporalDistanceDays
  ) {
    return null
  }

  return createContradiction({
    evidenceA,
    evidenceB,

    contradictionType:
      'source',

    severity:
      getSeverityByDifference({
        difference,

        criticalDifference:
          options
            .criticalValueDifference,
      }),

    explanation:
      `Fontes diferentes registram valores incompatíveis para o mesmo contexto educacional.`,

    resolvableAutomatically:
      false,

    metadata: {
      sourceTypeA:
        evidenceA.sourceType,

      sourceTypeB:
        evidenceB.sourceType,

      valueA,
      valueB,
      difference,
    },
  })
}

function detectStatusContradiction({
  evidenceA,
  evidenceB,
  options,
}: {
  evidenceA:
    EducationalEvidence

  evidenceB:
    EducationalEvidence

  options:
    EvidenceContradictionDetectionOptions
}): EvidenceContradiction | null {
  if (
    !options.detectStatusConflicts
  ) {
    return null
  }

  const directlyRelated =
    evidenceA.relatedEvidenceIds.includes(
      evidenceB.id,
    ) ||
    evidenceB.relatedEvidenceIds.includes(
      evidenceA.id,
    ) ||
    evidenceA.supersedesEvidenceId ===
      evidenceB.id ||
    evidenceB.supersedesEvidenceId ===
      evidenceA.id ||
    evidenceA.supersededByEvidenceId ===
      evidenceB.id ||
    evidenceB.supersededByEvidenceId ===
      evidenceA.id

  if (!directlyRelated) {
    return null
  }

  const statusesConflict =
    (
      evidenceA.status ===
        'validated' &&
      evidenceB.status ===
        'rejected'
    ) ||
    (
      evidenceB.status ===
        'validated' &&
      evidenceA.status ===
        'rejected'
    ) ||
    (
      evidenceA.status ===
        'superseded' &&
      evidenceB.status ===
        'superseded'
    )

  if (!statusesConflict) {
    return null
  }

  return createContradiction({
    evidenceA,
    evidenceB,

    contradictionType:
      'status',

    severity:
      'high',

    explanation:
      'Evidências diretamente relacionadas possuem estados incompatíveis no fluxo de validação.',

    resolvableAutomatically:
      false,

    metadata: {
      statusA:
        evidenceA.status,

      statusB:
        evidenceB.status,
    },
  })
}

function detectAttendancePerformanceContradiction({
  evidenceA,
  evidenceB,
  options,
}: {
  evidenceA:
    EducationalEvidence

  evidenceB:
    EducationalEvidence

  options:
    EvidenceContradictionDetectionOptions
}): EvidenceContradiction | null {
  if (
    !options
      .detectAttendancePerformanceConflict ||
    !hasSharedSubject(
      evidenceA,
      evidenceB,
    )
  ) {
    return null
  }

  const attendanceEvidence =
    isAttendanceEvidence(
      evidenceA,
    )
      ? evidenceA
      : isAttendanceEvidence(
          evidenceB,
        )
        ? evidenceB
        : null

  const performanceEvidence =
    isPerformanceEvidence(
      evidenceA,
    )
      ? evidenceA
      : isPerformanceEvidence(
          evidenceB,
        )
        ? evidenceB
        : null

  if (
    !attendanceEvidence ||
    !performanceEvidence
  ) {
    return null
  }

  const attendanceValue =
    getNumericValue(
      attendanceEvidence,
    )

  const performanceValue =
    getNumericValue(
      performanceEvidence,
    )

  if (
    attendanceValue ===
      null ||
    performanceValue ===
      null
  ) {
    return null
  }

  const attendancePercentage =
    attendanceEvidence.type ===
      'absence'
      ? 100 -
        attendanceValue
      : attendanceValue

  const temporalDistance =
    getTemporalDistanceDays(
      attendanceEvidence,
      performanceEvidence,
    )

  if (
    temporalDistance !==
      null &&
    temporalDistance >
      options
        .maximumTemporalDistanceDays
  ) {
    return null
  }

  const highAttendanceLowPerformance =
    attendancePercentage >=
      85 &&
    performanceValue <=
      40

  const lowAttendanceHighPerformance =
    attendancePercentage <=
      40 &&
    performanceValue >=
      85

  if (
    !highAttendanceLowPerformance &&
    !lowAttendanceHighPerformance
  ) {
    return null
  }

  return createContradiction({
    evidenceA:
      attendanceEvidence,

    evidenceB:
      performanceEvidence,

    contradictionType:
      'value',

    severity:
      highAttendanceLowPerformance
        ? 'high'
        : 'medium',

    explanation:
      highAttendanceLowPerformance
        ? 'A frequência elevada contrasta com desempenho muito baixo e exige análise pedagógica contextual.'
        : 'A frequência baixa contrasta com desempenho muito alto e exige verificação da origem e abrangência dos registros.',

    resolvableAutomatically:
      false,

    metadata: {
      attendancePercentage,
      performanceValue,
      temporalDistanceDays:
        temporalDistance,
    },
  })
}

function detectInterventionWithoutNeed({
  intervention,
  referenceEvidence,
  options,
}: {
  intervention:
    EducationalEvidence

  referenceEvidence:
    EducationalEvidence

  options:
    EvidenceContradictionDetectionOptions
}): EvidenceContradiction | null {
  if (
    !options.detectInterventionWithoutNeed ||
    !isInterventionEvidence(
      intervention,
    ) ||
    !isPerformanceEvidence(
      referenceEvidence,
    ) ||
    !hasSharedSubject(
      intervention,
      referenceEvidence,
    )
  ) {
    return null
  }

  const performance =
    getNumericValue(
      referenceEvidence,
    )

  if (
    performance ===
      null ||
    performance <
      85
  ) {
    return null
  }

  const interventionTimestamp =
    getEvidenceTimestamp(
      intervention,
    )

  const referenceTimestamp =
    getEvidenceTimestamp(
      referenceEvidence,
    )

  if (
    interventionTimestamp !==
      null &&
    referenceTimestamp !==
      null &&
    referenceTimestamp >
      interventionTimestamp
  ) {
    return null
  }

  const temporalDistance =
    getTemporalDistanceDays(
      intervention,
      referenceEvidence,
    )

  if (
    temporalDistance !==
      null &&
    temporalDistance >
      options
        .maximumTemporalDistanceDays
  ) {
    return null
  }

  return createContradiction({
    evidenceA:
      intervention,

    evidenceB:
      referenceEvidence,

    contradictionType:
      'value',

    severity:
      'medium',

    explanation:
      'Foi registrada intervenção ou recuperação apesar de evidência recente indicar desempenho elevado.',

    resolvableAutomatically:
      false,

    metadata: {
      performance,
      interventionType:
        intervention.type,
      temporalDistanceDays:
        temporalDistance,
    },
  })
}

function detectCurriculumWithoutEvidence({
  curriculumEvidence,
  referenceEvidence,
  options,
}: {
  curriculumEvidence:
    EducationalEvidence

  referenceEvidence:
    EducationalEvidence

  options:
    EvidenceContradictionDetectionOptions
}): EvidenceContradiction | null {
  if (
    !options.detectCurriculumWithoutEvidence ||
    !isCurriculumCoverageEvidence(
      curriculumEvidence,
    ) ||
    !isPerformanceEvidence(
      referenceEvidence,
    ) ||
    !hasSharedSubject(
      curriculumEvidence,
      referenceEvidence,
    ) ||
    !hasSharedCurriculumReference(
      curriculumEvidence,
      referenceEvidence,
    )
  ) {
    return null
  }

  const curriculumValue =
    getNumericValue(
      curriculumEvidence,
    )

  const performanceValue =
    getNumericValue(
      referenceEvidence,
    )

  if (
    curriculumValue ===
      null ||
    performanceValue ===
      null
  ) {
    return null
  }

  if (
    curriculumValue <
      85 ||
    performanceValue >
      40
  ) {
    return null
  }

  const temporalDistance =
    getTemporalDistanceDays(
      curriculumEvidence,
      referenceEvidence,
    )

  if (
    temporalDistance !==
      null &&
    temporalDistance >
      options
        .maximumTemporalDistanceDays
  ) {
    return null
  }

  return createContradiction({
    evidenceA:
      curriculumEvidence,

    evidenceB:
      referenceEvidence,

    contradictionType:
      'curriculum',

    severity:
      'high',

    explanation:
      'A cobertura ou demonstração curricular foi registrada como elevada, mas o desempenho associado permanece muito baixo.',

    resolvableAutomatically:
      false,

    metadata: {
      curriculumValue,
      performanceValue,
      temporalDistanceDays:
        temporalDistance,
    },
  })
}

function detectClassificationContradiction({
  evidenceA,
  evidenceB,
}: {
  evidenceA:
    EducationalEvidence

  evidenceB:
    EducationalEvidence
}): EvidenceContradiction | null {
  if (
    !hasSharedSubject(
      evidenceA,
      evidenceB,
    )
  ) {
    return null
  }

  const classificationsA =
    evidenceA
      .frameworkClassifications

  const classificationsB =
    evidenceB
      .frameworkClassifications

  if (
    classificationsA.length ===
      0 ||
    classificationsB.length ===
      0
  ) {
    return null
  }

  const primaryA =
    new Set(
      classificationsA.map(
        classification =>
          `${classification.pillar}:${classification.primaryDimension}`,
      ),
    )

  const primaryB =
    classificationsB.map(
      classification =>
        `${classification.pillar}:${classification.primaryDimension}`,
    )

  const hasSharedClassification =
    primaryB.some(
      classification =>
        primaryA.has(
          classification,
        ),
    )

  if (
    hasSharedClassification
  ) {
    return null
  }

  const temporalDistance =
    getTemporalDistanceDays(
      evidenceA,
      evidenceB,
    )

  if (
    temporalDistance !==
      null &&
    temporalDistance >
      30
  ) {
    return null
  }

  if (
    evidenceA.type !==
      evidenceB.type
  ) {
    return null
  }

  return createContradiction({
    evidenceA,
    evidenceB,

    contradictionType:
      'classification',

    severity:
      'low',

    explanation:
      'Evidências do mesmo tipo e contexto receberam classificações EDI incompatíveis.',

    resolvableAutomatically:
      true,

    resolution:
      'Reexecutar a classificação automática e manter a classificação com maior confiança.',

    metadata: {
      classificationsA:
        Array.from(
          primaryA,
        ),

      classificationsB:
        primaryB,

      temporalDistanceDays:
        temporalDistance,
    },
  })
}

function detectPairContradictions({
  evidenceA,
  evidenceB,
  options,
}: {
  evidenceA:
    EducationalEvidence

  evidenceB:
    EducationalEvidence

  options:
    EvidenceContradictionDetectionOptions
}): EvidenceContradiction[] {
  const contradictions:
    Array<
      EvidenceContradiction | null
    > = [
    detectAssessmentContradiction({
      evidenceA,
      evidenceB,
      options,
    }),

    detectValueContradiction({
      evidenceA,
      evidenceB,
      options,
    }),

    detectTemporalContradiction({
      evidenceA,
      evidenceB,
    }),

    detectCurriculumContradiction({
      evidenceA,
      evidenceB,
      options,
    }),

    detectSourceContradiction({
      evidenceA,
      evidenceB,
      options,
    }),

    detectStatusContradiction({
      evidenceA,
      evidenceB,
      options,
    }),

    detectAttendancePerformanceContradiction({
      evidenceA,
      evidenceB,
      options,
    }),

    detectInterventionWithoutNeed({
      intervention:
        evidenceA,

      referenceEvidence:
        evidenceB,

      options,
    }),

    detectInterventionWithoutNeed({
      intervention:
        evidenceB,

      referenceEvidence:
        evidenceA,

      options,
    }),

    detectCurriculumWithoutEvidence({
      curriculumEvidence:
        evidenceA,

      referenceEvidence:
        evidenceB,

      options,
    }),

    detectCurriculumWithoutEvidence({
      curriculumEvidence:
        evidenceB,

      referenceEvidence:
        evidenceA,

      options,
    }),

    detectClassificationContradiction({
      evidenceA,
      evidenceB,
    }),
  ]

  return contradictions.filter(
    (
      contradiction,
    ): contradiction is EvidenceContradiction =>
      contradiction !==
      null,
  )
}

function getContradictionSignature(
  contradiction:
    EvidenceContradiction,
): string {
  const evidenceIds = [
    contradiction.evidenceIdA,
    contradiction.evidenceIdB,
  ].sort()

  return [
    contradiction
      .contradictionType,
    ...evidenceIds,
    contradiction.explanation,
  ].join(
    '|',
  )
}

function deduplicateContradictions(
  contradictions:
    EvidenceContradiction[],
): EvidenceContradiction[] {
  const signatures =
    new Set<string>()

  const result:
    EvidenceContradiction[] =
      []

  for (
    const contradiction
    of contradictions
  ) {
    const signature =
      getContradictionSignature(
        contradiction,
      )

    if (
      signatures.has(
        signature,
      )
    ) {
      continue
    }

    signatures.add(
      signature,
    )

    result.push(
      contradiction,
    )
  }

  return result
}

export function detectEvidenceContradictions({
  evidence,
  options = DEFAULT_OPTIONS,
}: {
  evidence:
    EducationalEvidence[]

  options?:
    EvidenceContradictionDetectionOptions
}): EvidenceContradictionDetectionResult {
  const warnings:
    string[] = []

  const errors:
    string[] = []

  const eligibleEvidence =
    evidence.filter(
      item =>
        isEligibleEvidence(
          item,
          options,
        ),
    )

  if (
    eligibleEvidence.length <
    2
  ) {
    return {
      success:
        true,

      contradictions:
        [],

      analyzedEvidenceCount:
        eligibleEvidence.length,

      analyzedPairCount:
        0,

      warnings: [
        'São necessárias ao menos duas evidências elegíveis para detectar contradições.',
      ],

      errors:
        [],

      requiresHumanReview:
        false,
    }
  }

  const contradictions:
    EvidenceContradiction[] =
      []

  let analyzedPairCount =
    0

  try {
    for (
      let firstIndex =
        0;
      firstIndex <
      eligibleEvidence.length;
      firstIndex +=
        1
    ) {
      const evidenceA =
        eligibleEvidence[
          firstIndex
        ]

      for (
        let secondIndex =
          firstIndex +
          1;
        secondIndex <
        eligibleEvidence.length;
        secondIndex +=
          1
      ) {
        const evidenceB =
          eligibleEvidence[
            secondIndex
          ]

        analyzedPairCount +=
          1

        contradictions.push(
          ...detectPairContradictions({
            evidenceA,
            evidenceB,
            options,
          }),
        )
      }
    }
  } catch (
    error
  ) {
    errors.push(
      error instanceof Error
        ? error.message
        : 'Erro inesperado durante a detecção de contradições.',
    )
  }

  const deduplicated =
    deduplicateContradictions(
      contradictions,
    )

  if (
    deduplicated.length >
    0
  ) {
    warnings.push(
      `${deduplicated.length} contradição(ões) foram detectadas e devem ser consideradas antes da consolidação ou tomada de decisão.`,
    )
  }

  return {
    success:
      errors.length ===
      0,

    contradictions:
      deduplicated,

    analyzedEvidenceCount:
      eligibleEvidence.length,

    analyzedPairCount,

    warnings:
      uniqueStrings(
        warnings,
      ),

    errors:
      uniqueStrings(
        errors,
      ),

    requiresHumanReview:
      deduplicated.some(
        contradiction =>
          contradiction
            .requiresHumanReview ||
          contradiction.severity ===
            'high' ||
          contradiction.severity ===
            'critical',
      ),
  }
}

export function resolveEvidenceContradiction({
  contradiction,
  resolution,
  resolvedBy,
}: {
  contradiction:
    EvidenceContradiction

  resolution:
    string

  resolvedBy:
    string
}): EvidenceContradiction {
  return {
    ...contradiction,

    resolution:
      resolution.trim(),

    resolved:
      true,

    resolvedBy,

    resolvedAt:
      nowIso(),

    requiresHumanReview:
      false,

    metadata: {
      ...contradiction.metadata,

      resolutionMethod:
        'human',

      resolutionRecordedAt:
        nowIso(),
    },
  }
}

export function automaticallyResolveEvidenceContradiction(
  contradiction:
    EvidenceContradiction,
): EvidenceContradiction {
  if (
    !contradiction
      .resolvableAutomatically
  ) {
    return contradiction
  }

  return {
    ...contradiction,

    resolution:
      contradiction.resolution ||
      'Contradição resolvida automaticamente conforme regra do Evidence Intelligence Engine.',

    resolved:
      true,

    resolvedBy:
      'evidence-contradiction-engine',

    resolvedAt:
      nowIso(),

    requiresHumanReview:
      false,

    metadata: {
      ...contradiction.metadata,

      resolutionMethod:
        'automatic',

      resolutionRecordedAt:
        nowIso(),
    },
  }
}

export function summarizeEvidenceContradictions(
  contradictions:
    EvidenceContradiction[],
): EvidenceContradictionSummary {
  const byType:
    EvidenceContradictionSummary['byType'] = {
    value:
      0,

    classification:
      0,

    temporal:
      0,

    subject:
      0,

    curriculum:
      0,

    source:
      0,

    status:
      0,

    other:
      0,
  }

  let unresolved =
    0

  let resolved =
    0

  let low =
    0

  let medium =
    0

  let high =
    0

  let critical =
    0

  for (
    const contradiction
    of contradictions
  ) {
    byType[
      contradiction
        .contradictionType
    ] +=
      1

    if (
      contradiction.resolved
    ) {
      resolved +=
        1
    } else {
      unresolved +=
        1
    }

    switch (
      contradiction.severity
    ) {
      case 'low':
        low +=
          1
        break

      case 'medium':
        medium +=
          1
        break

      case 'high':
        high +=
          1
        break

      case 'critical':
        critical +=
          1
        break
    }
  }

  return {
    total:
      contradictions.length,

    unresolved,

    resolved,

    low,

    medium,

    high,

    critical,

    byType,

    requiresHumanReview:
      contradictions.some(
        contradiction =>
          !contradiction.resolved &&
          (
            contradiction
              .requiresHumanReview ||
            contradiction.severity ===
              'high' ||
            contradiction.severity ===
              'critical'
          ),
      ),
  }
}

export function createDefaultEvidenceContradictionOptions():
  EvidenceContradictionDetectionOptions {
  return {
    ...DEFAULT_OPTIONS,
  }
}

export const evidenceContradictionService = {
  detect:
    detectEvidenceContradictions,

  resolve:
    resolveEvidenceContradiction,

  resolveAutomatically:
    automaticallyResolveEvidenceContradiction,

  summarize:
    summarizeEvidenceContradictions,

  createDefaultOptions:
    createDefaultEvidenceContradictionOptions,
}