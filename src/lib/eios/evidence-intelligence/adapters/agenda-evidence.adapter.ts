import type {
  AgendaEvidence,
  AgendaEvidenceMetadata,
  AgendaEvidenceType,
} from '@/lib/agenda/repository/evidences.repository'

import type {
  EducationalEvidence,
  EvidenceAuditEntry,
  EvidenceFileReference,
  EvidenceFrameworkClassification,
  EvidenceModality,
  EvidenceSubjectReference,
  EvidenceType,
} from '../evidence-intelligence.contract'

export type AgendaEvidenceAdapterOptions = {
  occurredAt?: string | null

  teacherId?: string | null
  studentId?: string | null
  studentGroupId?: string | null

  componentId?: string | null
  courseId?: string | null
  programId?: string | null
  offeringId?: string | null

  roomId?: string | null
  classroomMapId?: string | null
  seatId?: string | null
  zoneId?: string | null

  x?: number | null
  y?: number | null
  z?: number | null

  timezone?: string | null

  additionalMetadata?: Record<string, unknown>
}

export type AgendaEvidenceAdapterResult = {
  success: boolean

  evidence: EducationalEvidence | null

  warnings: string[]
  errors: string[]

  requiresHumanReview: boolean
}

function nowIso(): string {
  return new Date().toISOString()
}

function uniqueStrings(
  values: string[],
): string[] {
  return Array.from(
    new Set(
      values
        .map(value => value.trim())
        .filter(Boolean),
    ),
  )
}

function normalizeOptionalText(
  value:
    | string
    | null
    | undefined,
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

function normalizeOptionalNumber(
  value:
    | number
    | null
    | undefined,
): number | null {
  if (
    typeof value !==
      'number' ||
    !Number.isFinite(value)
  ) {
    return null
  }

  return value
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value ===
      'object' &&
    value !==
      null &&
    !Array.isArray(value)
  )
}

function getMetadataString(
  metadata: AgendaEvidenceMetadata,
  key: string,
): string | null {
  const value =
    metadata[key]

  return typeof value ===
    'string'
    ? normalizeOptionalText(value)
    : null
}

function getMetadataNumber(
  metadata: AgendaEvidenceMetadata,
  key: string,
): number | null {
  const value =
    metadata[key]

  if (
    typeof value ===
      'number' &&
    Number.isFinite(value)
  ) {
    return value
  }

  if (
    typeof value ===
      'string' &&
    value.trim()
  ) {
    const parsedValue =
      Number(value)

    return Number.isFinite(
      parsedValue,
    )
      ? parsedValue
      : null
  }

  return null
}

function getMetadataRecord(
  metadata: AgendaEvidenceMetadata,
  key: string,
): Record<string, unknown> {
  const value =
    metadata[key]

  return isRecord(value)
    ? value
    : {}
}

function getAcademicYear(
  evidence: AgendaEvidence,
): number | null {
  const metadataYear =
    getMetadataNumber(
      evidence.metadata,
      'academicYear',
    )

  if (
    metadataYear !==
      null &&
    Number.isInteger(metadataYear)
  ) {
    return metadataYear
  }

  const createdAt =
    Date.parse(
      evidence.created_at,
    )

  if (
    Number.isNaN(createdAt)
  ) {
    return null
  }

  return new Date(
    createdAt,
  ).getUTCFullYear()
}

function mapAgendaEvidenceType(
  evidenceType: AgendaEvidenceType,
): EvidenceType {
  switch (evidenceType) {
    case 'imagem':
      return 'image'

    case 'pdf':
      return 'document'

    case 'link':
      return 'external_record'

    case 'texto':
    default:
      return 'observation'
  }
}

function mapAgendaEvidenceModalities(
  evidence: AgendaEvidence,
): EvidenceModality[] {
  switch (
    evidence.evidence_type
  ) {
    case 'imagem':
      return [
        'image',
      ]

    case 'pdf':
      return [
        'document',
      ]

    case 'link':
      return [
        'text',
      ]

    case 'texto':
    default:
      return [
        'text',
      ]
  }
}

function createSubjects(
  evidence: AgendaEvidence,
  options: AgendaEvidenceAdapterOptions,
): EvidenceSubjectReference[] {
  const subjects:
    EvidenceSubjectReference[] = []

  const studentId =
    normalizeOptionalText(
      options.studentId,
    ) ??
    getMetadataString(
      evidence.metadata,
      'studentId',
    )

  const studentGroupId =
    normalizeOptionalText(
      options.studentGroupId,
    ) ??
    getMetadataString(
      evidence.metadata,
      'studentGroupId',
    )

  const teacherId =
    normalizeOptionalText(
      options.teacherId,
    ) ??
    getMetadataString(
      evidence.metadata,
      'teacherId',
    ) ??
    evidence.user_id

  if (studentId) {
    subjects.push({
      subjectType:
        'student',

      subjectId:
        studentId,

      role:
        'primary',

      metadata: {
        source:
          'agenda-evidence-adapter',
      },
    })
  }

  if (studentGroupId) {
    subjects.push({
      subjectType:
        'student_group',

      subjectId:
        studentGroupId,

      role:
        studentId
          ? 'context'
          : 'primary',

      metadata: {
        source:
          'agenda-evidence-adapter',
      },
    })
  }

  if (evidence.class_id) {
    subjects.push({
      subjectType:
        'class',

      subjectId:
        evidence.class_id,

      role:
        studentId ||
        studentGroupId
          ? 'context'
          : 'primary',

      metadata: {
        source:
          'agenda-evidence-adapter',
      },
    })
  }

  if (evidence.lesson_id) {
    subjects.push({
      subjectType:
        'lesson',

      subjectId:
        evidence.lesson_id,

      role:
        'context',

      metadata: {
        source:
          'agenda-evidence-adapter',
      },
    })
  }

  if (evidence.planning_id) {
    subjects.push({
      subjectType:
        'planning',

      subjectId:
        evidence.planning_id,

      role:
        'context',

      metadata: {
        source:
          'agenda-evidence-adapter',
      },
    })
  }

  if (evidence.objective_id) {
    subjects.push({
      subjectType:
        'learning_objective',

      subjectId:
        evidence.objective_id,

      role:
        'context',

      metadata: {
        source:
          'agenda-evidence-adapter',
      },
    })
  }

  if (evidence.event_id) {
    subjects.push({
      subjectType:
        'event',

      subjectId:
        evidence.event_id,

      role:
        'context',

      metadata: {
        source:
          'agenda-evidence-adapter',
      },
    })
  }

  if (teacherId) {
    subjects.push({
      subjectType:
        'teacher',

      subjectId:
        teacherId,

      role:
        'author',

      metadata: {
        source:
          'agenda-evidence-adapter',
      },
    })
  }

  return subjects
}

function createFiles(
  evidence: AgendaEvidence,
): EvidenceFileReference[] {
  const hasFileReference =
    Boolean(
      evidence.storage_path ||
      evidence.file_url,
    )

  if (!hasFileReference) {
    return []
  }

  const modality:
    EvidenceModality =
      evidence.evidence_type ===
        'imagem'
        ? 'image'
        : evidence.evidence_type ===
            'pdf'
          ? 'document'
          : 'text'

  return [
    {
      id:
        `${evidence.id}:file`,

      fileName:
        evidence.original_file_name ??
        evidence.title,

      mimeType:
        evidence.file_mime_type ??
        'application/octet-stream',

      sizeBytes:
        evidence.file_size_bytes,

      storageProvider:
        evidence.storage_bucket
          ? 'supabase-storage'
          : null,

      storagePath:
        evidence.storage_path,

      publicUrl:
        evidence.file_url,

      checksum:
        null,

      modality,

      containsPersonalData:
        evidence
          .contains_identifiable_minor,

      containsSensitiveData:
        evidence
          .contains_identifiable_minor,

      createdAt:
        evidence.created_at,

      metadata: {
        bucket:
          evidence.storage_bucket,

        agendaEvidenceId:
          evidence.id,

        privacyNoticeVersion:
          evidence
            .privacy_notice_version,
      },
    },
  ]
}

function createFrameworkClassifications(
  evidence: AgendaEvidence,
): EvidenceFrameworkClassification[] {
  const dimensions:
    EvidenceFrameworkClassification['dimensions'] =
      []

  if (evidence.class_id) {
    dimensions.push(
      'learning',
      'teaching',
    )
  }

  if (evidence.objective_id) {
    dimensions.push(
      'curriculum',
    )
  }

  if (evidence.reflection_id) {
    dimensions.push(
      'teacher_effort',
      'decision_support',
    )
  }

  const uniqueDimensions =
    Array.from(
      new Set(
        dimensions.length >
          0
          ? dimensions
          : [
              'context' as const,
            ],
      ),
    )

  const primaryDimension =
    uniqueDimensions[0] ??
    'context'

  return [
    {
      pillar:
        'evidence',

      dimensions:
        uniqueDimensions,

      primaryDimension,

      confidence:
        0.7,

      explanation:
        'Classificação inicial derivada do contexto registrado na Agenda Inteligente EDI.',

      inferred:
        true,

      classifiedBy:
        'rule_engine',

      humanReviewRequired:
        evidence
          .contains_identifiable_minor,

      metadata: {
        agendaEvidenceType:
          evidence.evidence_type,

        adapter:
          'agenda-evidence-adapter',
      },
    },
  ]
}

function createAuditTrail(
  evidence: AgendaEvidence,
): EvidenceAuditEntry[] {
  const entries:
    EvidenceAuditEntry[] = [
      {
        id:
          `${evidence.id}:created`,

        action:
          'created',

        actorId:
          evidence.created_by ??
          evidence.user_id,

        actorType:
          evidence.created_by ||
          evidence.user_id
            ? 'user'
            : 'unknown',

        occurredAt:
          evidence.created_at,

        previousStatus:
          null,

        nextStatus:
          'submitted',

        description:
          'Evidência criada na Agenda Inteligente EDI.',

        changes: {
          source:
            'agenda',
        },

        metadata: {
          adapter:
            'agenda-evidence-adapter',
        },
      },
    ]

  if (
    evidence.updated_at !==
    evidence.created_at
  ) {
    entries.push({
      id:
        `${evidence.id}:updated:${evidence.updated_at}`,

      action:
        'updated',

      actorId:
        evidence.updated_by,

      actorType:
        evidence.updated_by
          ? 'user'
          : 'unknown',

      occurredAt:
        evidence.updated_at,

      previousStatus:
        'submitted',

      nextStatus:
        'submitted',

      description:
        'Evidência atualizada na Agenda Inteligente EDI.',

      changes: {},

      metadata: {
        adapter:
          'agenda-evidence-adapter',
      },
    })
  }

  return entries
}

function validateAgendaEvidence(
  evidence: AgendaEvidence,
): string[] {
  const errors:
    string[] = []

  if (!evidence.id.trim()) {
    errors.push(
      'A evidência da Agenda não possui identificador.',
    )
  }

  if (!evidence.title.trim()) {
    errors.push(
      'A evidência da Agenda não possui título.',
    )
  }

  if (
    Number.isNaN(
      Date.parse(
        evidence.created_at,
      ),
    )
  ) {
    errors.push(
      'A data de criação da evidência é inválida.',
    )
  }

  if (
    Number.isNaN(
      Date.parse(
        evidence.updated_at,
      ),
    )
  ) {
    errors.push(
      'A data de atualização da evidência é inválida.',
    )
  }

  return uniqueStrings(errors)
}

function createWarnings(
  evidence: AgendaEvidence,
  subjects: EvidenceSubjectReference[],
): string[] {
  const warnings:
    string[] = []

  if (
    subjects.length ===
    0
  ) {
    warnings.push(
      'A evidência não possui estudante, turma, aula, planejamento, objetivo ou evento associado.',
    )
  }

  if (
    evidence
      .contains_identifiable_minor &&
    !evidence
      .guardian_authorization_confirmed
  ) {
    warnings.push(
      'A evidência contém menor identificável sem confirmação de autorização do responsável.',
    )
  }

  if (
    evidence.evidence_type ===
      'imagem' ||
    evidence.evidence_type ===
      'pdf'
  ) {
    if (
      !evidence.storage_path &&
      !evidence.file_url
    ) {
      warnings.push(
        'A evidência de arquivo não possui referência de armazenamento.',
      )
    }
  }

  if (
    evidence.evidence_type ===
      'link' &&
    !evidence.external_url
  ) {
    warnings.push(
      'A evidência do tipo link não possui endereço externo.',
    )
  }

  return uniqueStrings(
    warnings,
  )
}

export function adaptAgendaEvidenceToEducationalEvidence({
  evidence,
  options = {},
}: {
  evidence: AgendaEvidence

  options?: AgendaEvidenceAdapterOptions
}): AgendaEvidenceAdapterResult {
  const errors =
    validateAgendaEvidence(
      evidence,
    )

  if (
    errors.length >
    0
  ) {
    return {
      success:
        false,

      evidence:
        null,

      warnings:
        [],

      errors,

      requiresHumanReview:
        true,
    }
  }

  const subjects =
    createSubjects(
      evidence,
      options,
    )

  const warnings =
    createWarnings(
      evidence,
      subjects,
    )

  const teacherId =
    normalizeOptionalText(
      options.teacherId,
    ) ??
    getMetadataString(
      evidence.metadata,
      'teacherId',
    ) ??
    evidence.user_id

  const studentId =
    normalizeOptionalText(
      options.studentId,
    ) ??
    getMetadataString(
      evidence.metadata,
      'studentId',
    )

  const studentGroupId =
    normalizeOptionalText(
      options.studentGroupId,
    ) ??
    getMetadataString(
      evidence.metadata,
      'studentGroupId',
    )

  const roomId =
    normalizeOptionalText(
      options.roomId,
    ) ??
    getMetadataString(
      evidence.metadata,
      'roomId',
    )

  const classroomMapId =
    normalizeOptionalText(
      options.classroomMapId,
    ) ??
    getMetadataString(
      evidence.metadata,
      'classroomMapId',
    )

  const seatId =
    normalizeOptionalText(
      options.seatId,
    ) ??
    getMetadataString(
      evidence.metadata,
      'seatId',
    )

  const zoneId =
    normalizeOptionalText(
      options.zoneId,
    ) ??
    getMetadataString(
      evidence.metadata,
      'zoneId',
    )

  const x =
    normalizeOptionalNumber(
      options.x,
    ) ??
    getMetadataNumber(
      evidence.metadata,
      'x',
    )

  const y =
    normalizeOptionalNumber(
      options.y,
    ) ??
    getMetadataNumber(
      evidence.metadata,
      'y',
    )

  const z =
    normalizeOptionalNumber(
      options.z,
    ) ??
    getMetadataNumber(
      evidence.metadata,
      'z',
    )

  const containsMinorData =
    evidence
      .contains_identifiable_minor

  const consentRequired =
    containsMinorData

  const consentConfirmed =
    containsMinorData
      ? evidence
          .guardian_authorization_confirmed
      : true

  const requiresHumanReview =
    containsMinorData ||
    warnings.length >
      0

  const occurredAt =
    normalizeOptionalText(
      options.occurredAt,
    ) ??
    getMetadataString(
      evidence.metadata,
      'occurredAt',
    ) ??
    evidence.created_at

  const evidenceValue = {
    agendaEvidenceType:
      evidence.evidence_type,

    description:
      evidence.description,

    reflectionId:
      evidence.reflection_id,

    externalUrl:
      evidence.external_url,

    metadata:
      evidence.metadata,
  }

  const educationalEvidence:
    EducationalEvidence = {
    id:
      evidence.id,

    type:
      mapAgendaEvidenceType(
        evidence.evidence_type,
      ),

    title:
      evidence.title,

    description:
      evidence.description,

    status:
      'submitted',

    sourceType:
      'agenda',

    sourceId:
      evidence.id,

    organizationId:
      evidence.organization_id,

    institutionId:
      evidence.school_id,

    campusId:
      null,

    programId:
      normalizeOptionalText(
        options.programId,
      ) ??
      getMetadataString(
        evidence.metadata,
        'programId',
      ),

    courseId:
      normalizeOptionalText(
        options.courseId,
      ) ??
      getMetadataString(
        evidence.metadata,
        'courseId',
      ),

    componentId:
      normalizeOptionalText(
        options.componentId,
      ) ??
      getMetadataString(
        evidence.metadata,
        'componentId',
      ),

    offeringId:
      normalizeOptionalText(
        options.offeringId,
      ) ??
      getMetadataString(
        evidence.metadata,
        'offeringId',
      ),

    classId:
      evidence.class_id,

    lessonId:
      evidence.lesson_id,

    planningId:
      evidence.planning_id,

    teacherId,

    studentId,

    studentGroupId,

    academicPeriodId:
      evidence.academic_period_id,

    subjects,

    curriculumReferences:
      evidence.objective_id
        ? [
            {
              frameworkId:
                getMetadataString(
                  evidence.metadata,
                  'curriculumFrameworkId',
                ),

              versionId:
                getMetadataString(
                  evidence.metadata,
                  'curriculumVersionId',
                ),

              curriculumNodeId:
                getMetadataString(
                  evidence.metadata,
                  'curriculumNodeId',
                ),

              competencyId:
                getMetadataString(
                  evidence.metadata,
                  'competencyId',
                ),

              skillId:
                getMetadataString(
                  evidence.metadata,
                  'skillId',
                ),

              knowledgeObjectId:
                getMetadataString(
                  evidence.metadata,
                  'knowledgeObjectId',
                ),

              learningObjectiveId:
                evidence.objective_id,

              alignmentConfidence:
                0.8,

              alignmentExplanation:
                'Objetivo de aprendizagem associado diretamente à evidência na Agenda.',

              inferred:
                false,

              humanReviewRequired:
                false,

              metadata: {
                source:
                  'agenda',
              },
            },
          ]
        : [],

    assessmentReference:
      null,

    interventionReferences:
      [],

    frameworkClassifications:
      createFrameworkClassifications(
        evidence,
      ),

    modalities:
      mapAgendaEvidenceModalities(
        evidence,
      ),

    value:
      evidenceValue,

    unit:
      null,

    normalizedValue:
      getMetadataNumber(
        evidence.metadata,
        'normalizedValue',
      ),

    textualContent:
      evidence.description ??
      evidence.title,

    temporalContext: {
      occurredAt,

      recordedAt:
        evidence.created_at,

      startsAt:
        getMetadataString(
          evidence.metadata,
          'startsAt',
        ),

      endsAt:
        getMetadataString(
          evidence.metadata,
          'endsAt',
        ),

      validFrom:
        evidence.created_at,

      validUntil:
        null,

      academicYear:
        getAcademicYear(
          evidence,
        ),

      academicPeriodId:
        evidence.academic_period_id,

      sequence:
        getMetadataNumber(
          evidence.metadata,
          'sequence',
        ),

      timezone:
        normalizeOptionalText(
          options.timezone,
        ) ??
        getMetadataString(
          evidence.metadata,
          'timezone',
        ) ??
        'America/Sao_Paulo',

      metadata: {
        source:
          'agenda',
      },
    },

    spatialContext:
      roomId ||
      classroomMapId ||
      seatId ||
      zoneId ||
      x !== null ||
      y !== null ||
      z !== null
        ? {
            institutionId:
              evidence.school_id,

            campusId:
              null,

            buildingId:
              getMetadataString(
                evidence.metadata,
                'buildingId',
              ),

            roomId,

            classroomId:
              evidence.class_id,

            classroomMapId,

            seatId,

            zoneId,

            virtualEnvironmentId:
              getMetadataString(
                evidence.metadata,
                'virtualEnvironmentId',
              ),

            x,
            y,
            z,

            latitude:
              getMetadataNumber(
                evidence.metadata,
                'latitude',
              ),

            longitude:
              getMetadataNumber(
                evidence.metadata,
                'longitude',
              ),

            coordinateSystem:
              getMetadataString(
                evidence.metadata,
                'coordinateSystem',
              ),

            source:
              classroomMapId
                ? 'classroom_map'
                : seatId
                  ? 'seat_assignment'
                  : 'manual',

            accuracy:
              getMetadataNumber(
                evidence.metadata,
                'spatialAccuracy',
              ),

            consentRequired,

            consentConfirmed,

            metadata: {
              ...getMetadataRecord(
                evidence.metadata,
                'spatialMetadata',
              ),

              adapter:
                'agenda-evidence-adapter',
            },
          }
        : null,

    files:
      createFiles(
        evidence,
      ),

    externalReferences:
      evidence.external_url
        ? [
            {
              system:
                'external-web',

              entityType:
                'agenda-evidence-link',

              entityId:
                evidence.id,

              url:
                evidence.external_url,

              importedAt:
                evidence.created_at,

              metadata: {
                source:
                  'agenda',
              },
            },
          ]
        : [],

    relatedEvidenceIds:
      [],

    supersedesEvidenceId:
      null,

    supersededByEvidenceId:
      null,

    quality: {
      level:
        'not_evaluated',

      overallScore:
        null,

      criteria: {
        relevance:
          null,

        reliability:
          null,

        validity:
          null,

        completeness:
          null,

        timeliness:
          null,

        consistency:
          null,

        traceability:
          null,

        objectivity:
          null,

        representativeness:
          null,

        accessibility:
          null,

        metadata: {},
      },

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
        requiresHumanReview,

      metadata: {
        source:
          'agenda-evidence-adapter',
      },
    },

    reliability: {
      confidence:
        null,

      confidenceLevel:
        'unknown',

      strength:
        'inconclusive',

      sourceReliability:
        null,

      internalConsistency:
        null,

      corroborationCount:
        0,

      contradictionCount:
        0,

      verified:
        false,

      verifiedBy:
        null,

      verifiedAt:
        null,

      validationMethod:
        'not_validated',

      explanation:
        'A confiabilidade será calculada pelo Evidence Intelligence Engine.',

      limitations:
        [],

      humanReviewRequired:
        requiresHumanReview,

      metadata: {
        source:
          'agenda-evidence-adapter',
      },
    },

    privacy: {
      visibility:
        containsMinorData
          ? 'restricted'
          : 'private',

      sensitivity:
        containsMinorData
          ? 'sensitive'
          : 'academic',

      containsPersonalData:
        Boolean(
          studentId ||
          studentGroupId ||
          containsMinorData,
        ),

      containsSensitiveData:
        containsMinorData,

      containsMinorData,

      anonymizationRequired:
        containsMinorData,

      pseudonymizationRequired:
        containsMinorData,

      consentRequired,

      consentConfirmed,

      legalBasis:
        getMetadataString(
          evidence.metadata,
          'legalBasis',
        ) ??
        (
          containsMinorData
            ? evidence
                .authorization_reference
            : 'execução de atividade educacional'
        ),

      retentionPolicy:
        getMetadataString(
          evidence.metadata,
          'retentionPolicy',
        ) ??
        evidence
          .privacy_notice_version,

      retentionUntil:
        getMetadataString(
          evidence.metadata,
          'retentionUntil',
        ),

      accessRoles: [
        'teacher',
        'coordinator',
        'school_manager',
        'institution_admin',
      ],

      metadata: {
        guardianAuthorizationConfirmed:
          evidence
            .guardian_authorization_confirmed,

        authorizationReference:
          evidence
            .authorization_reference,

        authorizationConfirmedAt:
          evidence
            .authorization_confirmed_at,

        authorizationConfirmedBy:
          evidence
            .authorization_confirmed_by,

        privacyNoticeVersion:
          evidence
            .privacy_notice_version,
      },
    },

    knowledgeGraphNodeId:
      null,

    knowledgeGraphEdgeIds:
      [],

    version:
      1,

    active:
      evidence.deleted_at ===
      null,

    createdAt:
      evidence.created_at,

    updatedAt:
      evidence.updated_at,

    createdBy:
      evidence.created_by,

    updatedBy:
      evidence.updated_by,

    auditTrail:
      createAuditTrail(
        evidence,
      ),

    metadata: {
      ...evidence.metadata,
      ...options.additionalMetadata,

      adapter:
        'agenda-evidence-adapter',

      adapterVersion:
        'v1',

      agendaEvidenceId:
        evidence.id,

      agendaEvidenceType:
        evidence.evidence_type,

      organizationId:
        evidence.organization_id,

      schoolId:
        evidence.school_id,

      reflectionId:
        evidence.reflection_id,

      privacyNoticeVersion:
        evidence
          .privacy_notice_version,

      adaptedAt:
        nowIso(),
    },
  }

  return {
    success:
      true,

    evidence:
      educationalEvidence,

    warnings,

    errors:
      [],

    requiresHumanReview,
  }
}

export function adaptAgendaEvidenceBatch({
  evidences,
  optionsByEvidenceId = {},
}: {
  evidences: AgendaEvidence[]

  optionsByEvidenceId?: Record<
    string,
    AgendaEvidenceAdapterOptions
  >
}): AgendaEvidenceAdapterResult[] {
  return evidences.map(
    evidence =>
      adaptAgendaEvidenceToEducationalEvidence({
        evidence,

        options:
          optionsByEvidenceId[
            evidence.id
          ] ?? {},
      }),
  )
}

export const agendaEvidenceAdapter = {
  adapt:
    adaptAgendaEvidenceToEducationalEvidence,

  adaptBatch:
    adaptAgendaEvidenceBatch,
}