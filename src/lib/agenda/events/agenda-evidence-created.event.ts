import type {
  AgendaEvidence,
} from '@/lib/agenda/repository/evidences.repository'

import {
  createEiosEvent,
  type EiosEvent,
  type EiosEventEntityReference,
  type EiosEventMetadata,
} from '@/lib/eios/events/eios-event.contract'

export type AgendaEvidenceCreatedEventPayload =
  EiosEventMetadata & {
    agendaEvidenceId:
      string

    title:
      string

    description:
      string | null

    evidenceType:
      AgendaEvidence['evidence_type']

    fileUrl:
      string | null

    externalUrl:
      string | null

    storageBucket:
      string | null

    storagePath:
      string | null

    originalFileName:
      string | null

    fileMimeType:
      string | null

    fileSizeBytes:
      number | null

    organizationId:
      string | null

    schoolId:
      string | null

    classId:
      string | null

    lessonId:
      string | null

    planningId:
      string | null

    objectiveId:
      string | null

    eventId:
      string | null

    reflectionId:
      string | null

    academicPeriodId:
      string | null

    userId:
      string

    containsIdentifiableMinor:
      boolean

    guardianAuthorizationConfirmed:
      boolean

    authorizationReference:
      string | null

    privacyNoticeVersion:
      string | null

    createdAt:
      string

    updatedAt:
      string

    metadata:
      Record<string, unknown>
  }

export type CreateAgendaEvidenceCreatedEventOptions = {
  requestedBy?:
    string | null

  correlationId?:
    string

  causationId?:
    string | null

  parentEventId?:
    string | null

  traceId?:
    string | null

  sourceEnvironment?:
    EiosEvent['sourceEnvironment']

  expiresAt?:
    string | null

  metadata?:
    Record<string, unknown>
}

export type AgendaEvidenceCreatedEvent =
  EiosEvent<
    AgendaEvidenceCreatedEventPayload
  >

const SOURCE_SERVICE =
  'agenda-evidence-created-event'

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

function resolveEnvironment():
  EiosEvent['sourceEnvironment'] {
  const environment =
    process.env
      .VERCEL_ENV

  if (
    environment ===
      'production'
  ) {
    return 'production'
  }

  if (
    environment ===
      'preview'
  ) {
    return 'preview'
  }

  if (
    process.env.NODE_ENV ===
      'test'
  ) {
    return 'test'
  }

  return 'development'
}

function createRelatedEntities(
  evidence:
    AgendaEvidence,
): EiosEventEntityReference[] {
  const references:
    EiosEventEntityReference[] = []

  if (
    evidence.organization_id
  ) {
    references.push({
      entityType:
        'organization',

      entityId:
        evidence.organization_id,

      role:
        'context',

      metadata: {},
    })
  }

  if (
    evidence.school_id
  ) {
    references.push({
      entityType:
        'school',

      entityId:
        evidence.school_id,

      role:
        'context',

      metadata: {},
    })
  }

  if (
    evidence.class_id
  ) {
    references.push({
      entityType:
        'class',

      entityId:
        evidence.class_id,

      role:
        'context',

      metadata: {},
    })
  }

  if (
    evidence.lesson_id
  ) {
    references.push({
      entityType:
        'lesson',

      entityId:
        evidence.lesson_id,

      role:
        'context',

      metadata: {},
    })
  }

  if (
    evidence.planning_id
  ) {
    references.push({
      entityType:
        'planning',

      entityId:
        evidence.planning_id,

      role:
        'context',

      metadata: {},
    })
  }

  if (
    evidence.academic_period_id
  ) {
    references.push({
      entityType:
        'academic-period',

      entityId:
        evidence.academic_period_id,

      role:
        'context',

      metadata: {},
    })
  }

  return references
}

function createPayload(
  evidence:
    AgendaEvidence,
): AgendaEvidenceCreatedEventPayload {
  return {
    agendaEvidenceId:
      evidence.id,

    title:
      evidence.title,

    description:
      evidence.description,

    evidenceType:
      evidence.evidence_type,

    fileUrl:
      evidence.file_url,

    externalUrl:
      evidence.external_url,

    storageBucket:
      evidence.storage_bucket,

    storagePath:
      evidence.storage_path,

    originalFileName:
      evidence.original_file_name,

    fileMimeType:
      evidence.file_mime_type,

    fileSizeBytes:
      evidence.file_size_bytes,

    organizationId:
      evidence.organization_id,

    schoolId:
      evidence.school_id,

    classId:
      evidence.class_id,

    lessonId:
      evidence.lesson_id,

    planningId:
      evidence.planning_id,

    objectiveId:
      evidence.objective_id,

    eventId:
      evidence.event_id,

    reflectionId:
      evidence.reflection_id,

    academicPeriodId:
      evidence.academic_period_id,

    userId:
      evidence.user_id,

    containsIdentifiableMinor:
      evidence
        .contains_identifiable_minor,

    guardianAuthorizationConfirmed:
      evidence
        .guardian_authorization_confirmed,

    authorizationReference:
      evidence
        .authorization_reference,

    privacyNoticeVersion:
      evidence
        .privacy_notice_version,

    createdAt:
      evidence.created_at,

    updatedAt:
      evidence.updated_at,

    metadata: {
      ...evidence.metadata,
    },
  }
}

export function createAgendaEvidenceCreatedEvent({
  evidence,
  options = {},
}: {
  evidence:
    AgendaEvidence

  options?:
    CreateAgendaEvidenceCreatedEventOptions
}): AgendaEvidenceCreatedEvent {
  const requestedBy =
    normalizeOptionalText(
      options.requestedBy,
    ) ??
    normalizeOptionalText(
      evidence.created_by,
    ) ??
    evidence.user_id

  const containsMinorData =
    evidence
      .contains_identifiable_minor

  const containsPersonalData =
    containsMinorData ||
    Boolean(
      evidence.user_id,
    )

  return createEiosEvent<
    AgendaEvidenceCreatedEventPayload
  >({
    name:
      'evidence.created',

    domain:
      'evidence',

    action:
      'created',

    version:
      '1.0.0',

    priority:
      containsMinorData
        ? 'high'
        : 'normal',

    sourceProduct:
      'agenda',

    sourceService:
      SOURCE_SERVICE,

    sourceEnvironment:
      options.sourceEnvironment ??
      resolveEnvironment(),

    actor: {
      id:
        requestedBy,

      type:
        requestedBy
          ? 'user'
          : 'system',

      product:
        'agenda',

      organizationId:
        evidence.organization_id,

      schoolId:
        evidence.school_id,

      metadata: {
        evidenceUserId:
          evidence.user_id,

        createdBy:
          evidence.created_by,
      },
    },

    primaryEntity: {
      entityType:
        'evidence',

      entityId:
        evidence.id,

      role:
        'primary',

      metadata: {
        evidenceType:
          evidence.evidence_type,

        title:
          evidence.title,
      },
    },

    relatedEntities:
      createRelatedEntities(
        evidence,
      ),

    payload:
      createPayload(
        evidence,
      ),

    correlationId:
      options.correlationId,

    causationId:
      options.causationId,

    parentEventId:
      options.parentEventId,

    traceId:
      options.traceId,

    privacy: {
      containsPersonalData,

      containsSensitiveData:
        containsMinorData,

      containsMinorData,

      anonymized:
        false,

      pseudonymized:
        false,

      consentRequired:
        containsMinorData,

      consentConfirmed:
        containsMinorData
          ? evidence
              .guardian_authorization_confirmed
          : false,

      legalBasis:
        containsMinorData
          ? evidence
              .authorization_reference
          : 'execução de atividade educacional',

      accessRoles: [
        'teacher',
        'coordinator',
        'school_manager',
        'institution_admin',
      ],

      metadata: {
        privacyNoticeVersion:
          evidence
            .privacy_notice_version,

        authorizationConfirmedAt:
          evidence
            .authorization_confirmed_at,

        authorizationConfirmedBy:
          evidence
            .authorization_confirmed_by,
      },
    },

    retryPolicy: {
      enabled:
        true,

      maximumAttempts:
        3,

      attempt:
        0,

      retryAfter:
        null,

      lastError:
        null,

      metadata: {
        strategy:
          'event-bus-default',
      },
    },

    occurredAt:
      evidence.created_at,

    expiresAt:
      options.expiresAt ??
      null,

    metadata: {
      ...options.metadata,

      agendaEvidenceId:
        evidence.id,

      eventFactory:
        SOURCE_SERVICE,

      eventFactoryVersion:
        '1.0.0',
    },
  })
}

export const agendaEvidenceCreatedEventFactory = {
  create:
    createAgendaEvidenceCreatedEvent,
}