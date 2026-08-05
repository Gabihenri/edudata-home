export const EIOS_EVENT_CONTRACT_VERSION =
  '1.0.0'

export type EiosEventProduct =
  | 'agenda'
  | 'professor-digital'
  | 'academy'
  | 'analytics'
  | 'sgpa'
  | 'observatorio'
  | 'backoffice'
  | 'eios'
  | 'external'

export type EiosEventDomain =
  | 'evidence'
  | 'decision'
  | 'recommendation'
  | 'alert'
  | 'action-plan'
  | 'lesson'
  | 'planning'
  | 'assessment'
  | 'attendance'
  | 'class'
  | 'student'
  | 'teacher'
  | 'organization'
  | 'system'

export type EiosEventAction =
  | 'created'
  | 'updated'
  | 'deleted'
  | 'restored'
  | 'submitted'
  | 'published'
  | 'completed'
  | 'processed'
  | 'generated'
  | 'accepted'
  | 'rejected'
  | 'acknowledged'
  | 'approved'
  | 'cancelled'
  | 'failed'

export type EiosEventName =
  | 'evidence.created'
  | 'evidence.updated'
  | 'evidence.deleted'
  | 'evidence.restored'
  | 'evidence.processed'
  | 'decision.generated'
  | 'decision.updated'
  | 'recommendation.generated'
  | 'recommendation.accepted'
  | 'recommendation.rejected'
  | 'alert.generated'
  | 'alert.acknowledged'
  | 'action-plan.generated'
  | 'action-plan.updated'
  | 'action-plan.approved'
  | 'lesson.created'
  | 'lesson.updated'
  | 'lesson.completed'
  | 'planning.created'
  | 'planning.updated'
  | 'planning.published'
  | 'assessment.created'
  | 'assessment.completed'
  | 'attendance.created'
  | 'attendance.updated'
  | 'system.failed'

export type EiosEventStatus =
  | 'pending'
  | 'processing'
  | 'processed'
  | 'failed'
  | 'ignored'

export type EiosEventPriority =
  | 'low'
  | 'normal'
  | 'high'
  | 'critical'

export type EiosEventActorType =
  | 'user'
  | 'system'
  | 'service'
  | 'integration'
  | 'anonymous'

export type EiosEventEntityType =
  | 'evidence'
  | 'decision'
  | 'recommendation'
  | 'alert'
  | 'action-plan'
  | 'lesson'
  | 'planning'
  | 'assessment'
  | 'attendance'
  | 'class'
  | 'student'
  | 'teacher'
  | 'organization'
  | 'school'
  | 'academic-period'
  | 'unknown'

export type EiosEventMetadata =
  Record<string, unknown>

export type EiosEventActor = {
  id:
    string | null

  type:
    EiosEventActorType

  product:
    EiosEventProduct

  organizationId:
    string | null

  schoolId:
    string | null

  metadata:
    EiosEventMetadata
}

export type EiosEventEntityReference = {
  entityType:
    EiosEventEntityType

  entityId:
    string

  role:
    'primary' |
    'context' |
    'related'

  metadata:
    EiosEventMetadata
}

export type EiosEventCorrelation = {
  correlationId:
    string

  causationId:
    string | null

  parentEventId:
    string | null

  traceId:
    string | null

  metadata:
    EiosEventMetadata
}

export type EiosEventPrivacy = {
  containsPersonalData:
    boolean

  containsSensitiveData:
    boolean

  containsMinorData:
    boolean

  anonymized:
    boolean

  pseudonymized:
    boolean

  consentRequired:
    boolean

  consentConfirmed:
    boolean

  legalBasis:
    string | null

  accessRoles:
    string[]

  metadata:
    EiosEventMetadata
}

export type EiosEventRetryPolicy = {
  enabled:
    boolean

  maximumAttempts:
    number

  attempt:
    number

  retryAfter:
    string | null

  lastError:
    string | null

  metadata:
    EiosEventMetadata
}

export type EiosEventAuditEntry = {
  id:
    string

  eventId:
    string

  action:
    'created' |
    'processing-started' |
    'processed' |
    'failed' |
    'retried' |
    'ignored'

  actorId:
    string | null

  actorType:
    EiosEventActorType

  occurredAt:
    string

  description:
    string

  metadata:
    EiosEventMetadata
}

export type EiosEvent<
  TPayload extends
    EiosEventMetadata =
      EiosEventMetadata,
> = {
  id:
    string

  name:
    EiosEventName

  domain:
    EiosEventDomain

  action:
    EiosEventAction

  version:
    string

  contractVersion:
    string

  status:
    EiosEventStatus

  priority:
    EiosEventPriority

  sourceProduct:
    EiosEventProduct

  sourceService:
    string

  sourceEnvironment:
    'development' |
    'preview' |
    'production' |
    'test'

  actor:
    EiosEventActor

  primaryEntity:
    EiosEventEntityReference

  relatedEntities:
    EiosEventEntityReference[]

  payload:
    TPayload

  correlation:
    EiosEventCorrelation

  privacy:
    EiosEventPrivacy

  retryPolicy:
    EiosEventRetryPolicy

  occurredAt:
    string

  publishedAt:
    string | null

  processingStartedAt:
    string | null

  processedAt:
    string | null

  expiresAt:
    string | null

  auditTrail:
    EiosEventAuditEntry[]

  metadata:
    EiosEventMetadata
}

export type CreateEiosEventInput<
  TPayload extends
    EiosEventMetadata =
      EiosEventMetadata,
> = {
  id?:
    string

  name:
    EiosEventName

  domain:
    EiosEventDomain

  action:
    EiosEventAction

  version?:
    string

  priority?:
    EiosEventPriority

  sourceProduct:
    EiosEventProduct

  sourceService:
    string

  sourceEnvironment?:
    EiosEvent<
      TPayload
    >['sourceEnvironment']

  actor:
    EiosEventActor

  primaryEntity:
    EiosEventEntityReference

  relatedEntities?:
    EiosEventEntityReference[]

  payload:
    TPayload

  correlationId?:
    string

  causationId?:
    string | null

  parentEventId?:
    string | null

  traceId?:
    string | null

  privacy?:
    Partial<EiosEventPrivacy>

  retryPolicy?:
    Partial<EiosEventRetryPolicy>

  occurredAt?:
    string

  expiresAt?:
    string | null

  metadata?:
    EiosEventMetadata
}

export type EiosEventValidationIssue = {
  code:
    string

  field:
    string | null

  severity:
    'warning' |
    'error'

  message:
    string
}

export type EiosEventValidationResult = {
  valid:
    boolean

  issues:
    EiosEventValidationIssue[]

  warnings:
    string[]

  errors:
    string[]
}

export type EiosEventProcessingResult = {
  success:
    boolean

  event:
    EiosEvent

  status:
    EiosEventStatus

  warnings:
    string[]

  errors:
    string[]

  processedAt:
    string
}

export const DEFAULT_EIOS_EVENT_PRIVACY:
  EiosEventPrivacy = {
  containsPersonalData:
    false,

  containsSensitiveData:
    false,

  containsMinorData:
    false,

  anonymized:
    false,

  pseudonymized:
    false,

  consentRequired:
    false,

  consentConfirmed:
    false,

  legalBasis:
    null,

  accessRoles:
    [],

  metadata:
    {},
}

export const DEFAULT_EIOS_EVENT_RETRY_POLICY:
  EiosEventRetryPolicy = {
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

  metadata:
    {},
}

export function createEiosEventId(): string {
  if (
    typeof crypto !==
      'undefined' &&
    typeof crypto.randomUUID ===
      'function'
  ) {
    return crypto.randomUUID()
  }

  return [
    'eios-event',
    Date.now(),
    Math.random()
      .toString(36)
      .slice(2),
  ].join('-')
}

export function createEiosEvent<
  TPayload extends
    EiosEventMetadata,
>(
  input:
    CreateEiosEventInput<TPayload>,
): EiosEvent<TPayload> {
  const occurredAt =
    input.occurredAt ??
    new Date()
      .toISOString()

  const id =
    input.id ??
    createEiosEventId()

  const correlationId =
    input.correlationId ??
    id

  return {
    id,

    name:
      input.name,

    domain:
      input.domain,

    action:
      input.action,

    version:
      input.version ??
      '1.0.0',

    contractVersion:
      EIOS_EVENT_CONTRACT_VERSION,

    status:
      'pending',

    priority:
      input.priority ??
      'normal',

    sourceProduct:
      input.sourceProduct,

    sourceService:
      input.sourceService,

    sourceEnvironment:
      input.sourceEnvironment ??
      'production',

    actor: {
      ...input.actor,

      metadata: {
        ...input.actor.metadata,
      },
    },

    primaryEntity: {
      ...input.primaryEntity,

      metadata: {
        ...input
          .primaryEntity
          .metadata,
      },
    },

    relatedEntities:
      (
        input.relatedEntities ??
        []
      ).map(
        reference => ({
          ...reference,

          metadata: {
            ...reference.metadata,
          },
        }),
      ),

    payload: {
      ...input.payload,
    },

    correlation: {
      correlationId,

      causationId:
        input.causationId ??
        null,

      parentEventId:
        input.parentEventId ??
        null,

      traceId:
        input.traceId ??
        correlationId,

      metadata:
        {},
    },

    privacy: {
      ...DEFAULT_EIOS_EVENT_PRIVACY,
      ...input.privacy,

      accessRoles: [
        ...(
          input.privacy
            ?.accessRoles ??
          DEFAULT_EIOS_EVENT_PRIVACY
            .accessRoles
        ),
      ],

      metadata: {
        ...DEFAULT_EIOS_EVENT_PRIVACY
          .metadata,

        ...input.privacy
          ?.metadata,
      },
    },

    retryPolicy: {
      ...DEFAULT_EIOS_EVENT_RETRY_POLICY,
      ...input.retryPolicy,

      metadata: {
        ...DEFAULT_EIOS_EVENT_RETRY_POLICY
          .metadata,

        ...input.retryPolicy
          ?.metadata,
      },
    },

    occurredAt,

    publishedAt:
      null,

    processingStartedAt:
      null,

    processedAt:
      null,

    expiresAt:
      input.expiresAt ??
      null,

    auditTrail: [
      {
        id:
          `${id}:created`,

        eventId:
          id,

        action:
          'created',

        actorId:
          input.actor.id,

        actorType:
          input.actor.type,

        occurredAt,

        description:
          'Evento criado no barramento interno do EIOS.',

        metadata: {
          sourceService:
            input.sourceService,

          sourceProduct:
            input.sourceProduct,
        },
      },
    ],

    metadata: {
      ...input.metadata,
    },
  }
}

export function isEiosEventExpired(
  event:
    EiosEvent,
  referenceDate =
    new Date(),
): boolean {
  if (!event.expiresAt) {
    return false
  }

  const expiresAt =
    Date.parse(
      event.expiresAt,
    )

  if (
    Number.isNaN(
      expiresAt,
    )
  ) {
    return false
  }

  return (
    expiresAt <=
    referenceDate.getTime()
  )
}

export function getEiosEventTopic(
  event:
    Pick<
      EiosEvent,
      'domain' |
      'action'
    >,
): string {
  return [
    'eios',
    event.domain,
    event.action,
  ].join('.')
}