import {
  getEiosEventTopic,
  isEiosEventExpired,
  type EiosEvent,
  type EiosEventAuditEntry,
  type EiosEventDomain,
  type EiosEventName,
  type EiosEventProcessingResult,
  type EiosEventStatus,
} from './eios-event.contract'

export type EiosEventHandler = (
  event: EiosEvent,
) =>
  void |
  Promise<void>

export type EiosEventSubscriptionFilter = {
  eventName?:
    EiosEventName

  domain?:
    EiosEventDomain

  topic?:
    string

  sourceProduct?:
    EiosEvent['sourceProduct']

  sourceService?:
    string
}

export type EiosEventSubscription = {
  id:
    string

  filter:
    EiosEventSubscriptionFilter

  handler:
    EiosEventHandler

  active:
    boolean

  createdAt:
    string

  metadata:
    Record<string, unknown>
}

export type EiosEventPublishOptions = {
  stopOnHandlerError?:
    boolean

  storeEvent?:
    boolean
}

export type EiosEventBusStatistics = {
  storedEvents:
    number

  subscriptions:
    number

  activeSubscriptions:
    number

  pendingEvents:
    number

  processingEvents:
    number

  processedEvents:
    number

  failedEvents:
    number

  ignoredEvents:
    number
}

const DEFAULT_PUBLISH_OPTIONS:
  Required<EiosEventPublishOptions> = {
  stopOnHandlerError:
    false,

  storeEvent:
    true,
}

function nowIso(): string {
  return new Date()
    .toISOString()
}

function createInternalId(
  prefix: string,
): string {
  if (
    typeof crypto !==
      'undefined' &&
    typeof crypto.randomUUID ===
      'function'
  ) {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return [
    prefix,
    Date.now(),
    Math.random()
      .toString(36)
      .slice(2),
  ].join('-')
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

  return 'Erro inesperado durante o processamento do evento.'
}

function createAuditEntry({
  event,
  action,
  description,
  metadata = {},
}: {
  event:
    EiosEvent

  action:
    EiosEventAuditEntry['action']

  description:
    string

  metadata?:
    Record<string, unknown>
}): EiosEventAuditEntry {
  return {
    id:
      createInternalId(
        'eios-event-audit',
      ),

    eventId:
      event.id,

    action,

    actorId:
      null,

    actorType:
      'system',

    occurredAt:
      nowIso(),

    description,

    metadata,
  }
}

function cloneEvent(
  event: EiosEvent,
): EiosEvent {
  return {
    ...event,

    actor: {
      ...event.actor,

      metadata: {
        ...event.actor.metadata,
      },
    },

    primaryEntity: {
      ...event.primaryEntity,

      metadata: {
        ...event
          .primaryEntity
          .metadata,
      },
    },

    relatedEntities:
      event.relatedEntities.map(
        reference => ({
          ...reference,

          metadata: {
            ...reference.metadata,
          },
        }),
      ),

    payload: {
      ...event.payload,
    },

    correlation: {
      ...event.correlation,

      metadata: {
        ...event
          .correlation
          .metadata,
      },
    },

    privacy: {
      ...event.privacy,

      accessRoles: [
        ...event
          .privacy
          .accessRoles,
      ],

      metadata: {
        ...event
          .privacy
          .metadata,
      },
    },

    retryPolicy: {
      ...event.retryPolicy,

      metadata: {
        ...event
          .retryPolicy
          .metadata,
      },
    },

    auditTrail:
      event.auditTrail.map(
        entry => ({
          ...entry,

          metadata: {
            ...entry.metadata,
          },
        }),
      ),

    metadata: {
      ...event.metadata,
    },
  }
}

function matchesSubscription(
  event:
    EiosEvent,

  subscription:
    EiosEventSubscription,
): boolean {
  if (
    !subscription.active
  ) {
    return false
  }

  const {
    filter,
  } = subscription

  if (
    filter.eventName &&
    filter.eventName !==
      event.name
  ) {
    return false
  }

  if (
    filter.domain &&
    filter.domain !==
      event.domain
  ) {
    return false
  }

  if (
    filter.topic &&
    filter.topic !==
      getEiosEventTopic(
        event,
      )
  ) {
    return false
  }

  if (
    filter.sourceProduct &&
    filter.sourceProduct !==
      event.sourceProduct
  ) {
    return false
  }

  if (
    filter.sourceService &&
    filter.sourceService !==
      event.sourceService
  ) {
    return false
  }

  return true
}

function updateEventStatus({
  event,
  status,
  auditAction,
  description,
  metadata = {},
}: {
  event:
    EiosEvent

  status:
    EiosEventStatus

  auditAction:
    EiosEventAuditEntry['action']

  description:
    string

  metadata?:
    Record<string, unknown>
}): EiosEvent {
  const timestamp =
    nowIso()

  return {
    ...event,

    status,

    processingStartedAt:
      status ===
        'processing'
        ? timestamp
        : event
            .processingStartedAt,

    processedAt:
      status ===
        'processed' ||
      status ===
        'failed' ||
      status ===
        'ignored'
        ? timestamp
        : event.processedAt,

    auditTrail: [
      ...event.auditTrail,

      createAuditEntry({
        event,

        action:
          auditAction,

        description,

        metadata,
      }),
    ],
  }
}

export class EiosEventBusService {
  private readonly events =
    new Map<
      string,
      EiosEvent
    >()

  private readonly subscriptions =
    new Map<
      string,
      EiosEventSubscription
    >()

  subscribe({
    filter = {},
    handler,
    metadata = {},
  }: {
    filter?:
      EiosEventSubscriptionFilter

    handler:
      EiosEventHandler

    metadata?:
      Record<string, unknown>
  }): EiosEventSubscription {
    const subscription:
      EiosEventSubscription = {
      id:
        createInternalId(
          'eios-subscription',
        ),

      filter: {
        ...filter,
      },

      handler,

      active:
        true,

      createdAt:
        nowIso(),

      metadata: {
        ...metadata,
      },
    }

    this.subscriptions.set(
      subscription.id,
      subscription,
    )

    return {
      ...subscription,

      filter: {
        ...subscription.filter,
      },

      metadata: {
        ...subscription.metadata,
      },
    }
  }

  unsubscribe(
    subscriptionId: string,
  ): boolean {
    return this.subscriptions
      .delete(
        subscriptionId,
      )
  }

  activateSubscription(
    subscriptionId: string,
  ): boolean {
    const subscription =
      this.subscriptions.get(
        subscriptionId,
      )

    if (!subscription) {
      return false
    }

    this.subscriptions.set(
      subscriptionId,
      {
        ...subscription,

        active:
          true,
      },
    )

    return true
  }

  deactivateSubscription(
    subscriptionId: string,
  ): boolean {
    const subscription =
      this.subscriptions.get(
        subscriptionId,
      )

    if (!subscription) {
      return false
    }

    this.subscriptions.set(
      subscriptionId,
      {
        ...subscription,

        active:
          false,
      },
    )

    return true
  }

  listSubscriptions():
    Omit<
      EiosEventSubscription,
      'handler'
    >[] {
    return Array.from(
      this.subscriptions
        .values(),
    ).map(
      subscription => ({
        id:
          subscription.id,

        filter: {
          ...subscription.filter,
        },

        active:
          subscription.active,

        createdAt:
          subscription.createdAt,

        metadata: {
          ...subscription.metadata,
        },
      }),
    )
  }

  getEvent(
    eventId: string,
  ): EiosEvent | null {
    const event =
      this.events.get(
        eventId,
      )

    return event
      ? cloneEvent(
          event,
        )
      : null
  }

  listEvents({
    status,
    domain,
    eventName,
  }: {
    status?:
      EiosEventStatus

    domain?:
      EiosEventDomain

    eventName?:
      EiosEventName
  } = {}): EiosEvent[] {
    return Array.from(
      this.events.values(),
    )
      .filter(
        event =>
          (
            !status ||
            event.status ===
              status
          ) &&
          (
            !domain ||
            event.domain ===
              domain
          ) &&
          (
            !eventName ||
            event.name ===
              eventName
          ),
      )
      .map(
        cloneEvent,
      )
  }

  async publish(
    receivedEvent:
      EiosEvent,

    receivedOptions:
      EiosEventPublishOptions = {},
  ): Promise<
    EiosEventProcessingResult
  > {
    const options = {
      ...DEFAULT_PUBLISH_OPTIONS,
      ...receivedOptions,
    }

    let event =
      cloneEvent(
        receivedEvent,
      )

    const warnings:
      string[] = []

    const errors:
      string[] = []

    if (
      isEiosEventExpired(
        event,
      )
    ) {
      event =
        updateEventStatus({
          event,

          status:
            'ignored',

          auditAction:
            'ignored',

          description:
            'Evento ignorado porque estava expirado.',

          metadata: {
            expiresAt:
              event.expiresAt,
          },
        })

      if (
        options.storeEvent
      ) {
        this.events.set(
          event.id,
          event,
        )
      }

      return {
        success:
          true,

        event:
          cloneEvent(
            event,
          ),

        status:
          event.status,

        warnings: [
          'O evento estava expirado e não foi processado.',
        ],

        errors:
          [],

        processedAt:
          event.processedAt ??
          nowIso(),
      }
    }

    event = {
      ...event,

      publishedAt:
        event.publishedAt ??
        nowIso(),
    }

    event =
      updateEventStatus({
        event,

        status:
          'processing',

        auditAction:
          'processing-started',

        description:
          'Processamento do evento iniciado pelo barramento interno do EIOS.',
      })

    if (
      options.storeEvent
    ) {
      this.events.set(
        event.id,
        event,
      )
    }

    const matchingSubscriptions =
      Array.from(
        this.subscriptions
          .values(),
      ).filter(
        subscription =>
          matchesSubscription(
            event,
            subscription,
          ),
      )

    if (
      matchingSubscriptions.length ===
        0
    ) {
      warnings.push(
        'Nenhum assinante foi encontrado para o evento.',
      )
    }

    for (
      const subscription
      of matchingSubscriptions
    ) {
      try {
        await subscription
          .handler(
            cloneEvent(
              event,
            ),
          )
      } catch (
        error
      ) {
        const message =
          getErrorMessage(
            error,
          )

        errors.push(
          `Assinatura ${subscription.id}: ${message}`,
        )

        if (
          options.stopOnHandlerError
        ) {
          break
        }
      }
    }

    const consolidatedWarnings =
      uniqueStrings(
        warnings,
      )

    const consolidatedErrors =
      uniqueStrings(
        errors,
      )

    if (
      consolidatedErrors.length >
        0
    ) {
      event = {
        ...event,

        retryPolicy: {
          ...event.retryPolicy,

          attempt:
            event
              .retryPolicy
              .attempt +
            1,

          lastError:
            consolidatedErrors
              .join(' | '),
        },
      }

      event =
        updateEventStatus({
          event,

          status:
            'failed',

          auditAction:
            'failed',

          description:
            'O evento apresentou falha durante o processamento.',

          metadata: {
            errorCount:
              consolidatedErrors
                .length,

            subscriptionCount:
              matchingSubscriptions
                .length,
          },
        })
    } else {
      event =
        updateEventStatus({
          event,

          status:
            'processed',

          auditAction:
            'processed',

          description:
            'Evento processado pelo barramento interno do EIOS.',

          metadata: {
            subscriptionCount:
              matchingSubscriptions
                .length,
          },
        })
    }

    if (
      options.storeEvent
    ) {
      this.events.set(
        event.id,
        event,
      )
    }

    return {
      success:
        consolidatedErrors.length ===
        0,

      event:
        cloneEvent(
          event,
        ),

      status:
        event.status,

      warnings:
        consolidatedWarnings,

      errors:
        consolidatedErrors,

      processedAt:
        event.processedAt ??
        nowIso(),
    }
  }

  async retry(
    eventId: string,
  ): Promise<
    EiosEventProcessingResult
  > {
    const storedEvent =
      this.events.get(
        eventId,
      )

    if (!storedEvent) {
      throw new Error(
        'Evento não encontrado no barramento interno do EIOS.',
      )
    }

    if (
      !storedEvent
        .retryPolicy
        .enabled
    ) {
      throw new Error(
        'A política de repetição está desativada para este evento.',
      )
    }

    if (
      storedEvent
        .retryPolicy
        .attempt >=
      storedEvent
        .retryPolicy
        .maximumAttempts
    ) {
      throw new Error(
        'O evento atingiu o limite máximo de tentativas.',
      )
    }

    const retriableEvent:
      EiosEvent = {
      ...cloneEvent(
        storedEvent,
      ),

      status:
        'pending',

      processingStartedAt:
        null,

      processedAt:
        null,

      retryPolicy: {
        ...storedEvent
          .retryPolicy,

        retryAfter:
          null,
      },

      auditTrail: [
        ...storedEvent
          .auditTrail,

        createAuditEntry({
          event:
            storedEvent,

          action:
            'retried',

          description:
            'Nova tentativa de processamento solicitada.',
        }),
      ],
    }

    return this.publish(
      retriableEvent,
      {
        storeEvent:
          true,
      },
    )
  }

  removeEvent(
    eventId: string,
  ): boolean {
    return this.events
      .delete(
        eventId,
      )
  }

  clearEvents(): void {
    this.events.clear()
  }

  clearSubscriptions(): void {
    this.subscriptions.clear()
  }

  reset(): void {
    this.clearEvents()
    this.clearSubscriptions()
  }

  getStatistics():
    EiosEventBusStatistics {
    const events =
      Array.from(
        this.events.values(),
      )

    const subscriptions =
      Array.from(
        this.subscriptions
          .values(),
      )

    return {
      storedEvents:
        events.length,

      subscriptions:
        subscriptions.length,

      activeSubscriptions:
        subscriptions.filter(
          subscription =>
            subscription.active,
        ).length,

      pendingEvents:
        events.filter(
          event =>
            event.status ===
            'pending',
        ).length,

      processingEvents:
        events.filter(
          event =>
            event.status ===
            'processing',
        ).length,

      processedEvents:
        events.filter(
          event =>
            event.status ===
            'processed',
        ).length,

      failedEvents:
        events.filter(
          event =>
            event.status ===
            'failed',
        ).length,

      ignoredEvents:
        events.filter(
          event =>
            event.status ===
            'ignored',
        ).length,
    }
  }
}

export const eiosEventBus =
  new EiosEventBusService()