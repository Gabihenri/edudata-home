import {
  processAgendaEvidenceCreatedHandler,
} from '@/lib/eios/events/handlers/process-agenda-evidence-created.handler'

import {
  eiosEventBus,
  type EiosEventSubscription,
} from '@/lib/eios/events/eios-event-bus.service'

export type EiosEventHandlerRegistrationStatus =
  | 'registered'
  | 'already_registered'
  | 'reactivated'

export type EiosEventHandlerRegistration = {
  registrationKey:
    string

  handlerName:
    string

  handlerVersion:
    string

  subscriptionId:
    string

  eventName:
    'evidence.created'

  sourceProduct:
    'agenda'

  active:
    boolean

  status:
    EiosEventHandlerRegistrationStatus

  registeredAt:
    string
}

export type RegisterEiosEventHandlersResult = {
  success:
    boolean

  provisional:
    true

  storageMode:
    'in-memory'

  registrations:
    EiosEventHandlerRegistration[]

  registeredCount:
    number

  alreadyRegisteredCount:
    number

  reactivatedCount:
    number

  totalActiveSubscriptions:
    number

  completedAt:
    string
}

export type UnregisterEiosEventHandlersResult = {
  success:
    boolean

  removedSubscriptionIds:
    string[]

  removedCount:
    number

  completedAt:
    string
}

type SubscriptionSummary =
  Omit<
    EiosEventSubscription,
    'handler'
  >

const REGISTRY_SERVICE_NAME =
  'register-eios-event-handlers-service'

const REGISTRY_SERVICE_VERSION =
  '1.0.0'

const AGENDA_EVIDENCE_CREATED_HANDLER_NAME =
  'process-agenda-evidence-created-handler'

const AGENDA_EVIDENCE_CREATED_HANDLER_VERSION =
  '1.0.0'

const AGENDA_EVIDENCE_CREATED_REGISTRATION_KEY =
  [
    'eios',
    'agenda',
    'evidence.created',
    AGENDA_EVIDENCE_CREATED_HANDLER_NAME,
    AGENDA_EVIDENCE_CREATED_HANDLER_VERSION,
  ].join(':')

function nowIso(): string {
  return new Date()
    .toISOString()
}

function normalizeOptionalText(
  value: unknown,
): string | null {
  if (
    typeof value !==
      'string'
  ) {
    return null
  }

  const normalizedValue =
    value.trim()

  return normalizedValue ||
    null
}

function getRegistrationKey(
  subscription:
    SubscriptionSummary,
): string | null {
  return normalizeOptionalText(
    subscription
      .metadata
      .registrationKey,
  )
}

function findSubscriptionByRegistrationKey(
  registrationKey: string,
): SubscriptionSummary | null {
  return (
    eiosEventBus
      .listSubscriptions()
      .find(
        subscription =>
          getRegistrationKey(
            subscription,
          ) ===
          registrationKey,
      ) ??
    null
  )
}

function createRegistrationResult({
  subscription,
  status,
}: {
  subscription:
    SubscriptionSummary

  status:
    EiosEventHandlerRegistrationStatus
}): EiosEventHandlerRegistration {
  return {
    registrationKey:
      AGENDA_EVIDENCE_CREATED_REGISTRATION_KEY,

    handlerName:
      AGENDA_EVIDENCE_CREATED_HANDLER_NAME,

    handlerVersion:
      AGENDA_EVIDENCE_CREATED_HANDLER_VERSION,

    subscriptionId:
      subscription.id,

    eventName:
      'evidence.created',

    sourceProduct:
      'agenda',

    active:
      subscription.active,

    status,

    registeredAt:
      subscription.createdAt,
  }
}

function registerAgendaEvidenceCreatedHandler():
  EiosEventHandlerRegistration {
  const existingSubscription =
    findSubscriptionByRegistrationKey(
      AGENDA_EVIDENCE_CREATED_REGISTRATION_KEY,
    )

  if (
    existingSubscription
  ) {
    if (
      existingSubscription.active
    ) {
      return createRegistrationResult({
        subscription:
          existingSubscription,

        status:
          'already_registered',
      })
    }

    const reactivated =
      eiosEventBus
        .activateSubscription(
          existingSubscription.id,
        )

    if (!reactivated) {
      throw new Error(
        'Não foi possível reativar a assinatura do handler evidence.created.',
      )
    }

    const reactivatedSubscription =
      findSubscriptionByRegistrationKey(
        AGENDA_EVIDENCE_CREATED_REGISTRATION_KEY,
      )

    if (
      !reactivatedSubscription
    ) {
      throw new Error(
        'A assinatura do handler foi reativada, mas não pôde ser localizada.',
      )
    }

    return createRegistrationResult({
      subscription:
        reactivatedSubscription,

      status:
        'reactivated',
    })
  }

  const subscription =
    eiosEventBus.subscribe({
      filter: {
        eventName:
          'evidence.created',

        domain:
          'evidence',

        sourceProduct:
          'agenda',
      },

      handler:
        processAgendaEvidenceCreatedHandler,

      metadata: {
        registrationKey:
          AGENDA_EVIDENCE_CREATED_REGISTRATION_KEY,

        handlerName:
          AGENDA_EVIDENCE_CREATED_HANDLER_NAME,

        handlerVersion:
          AGENDA_EVIDENCE_CREATED_HANDLER_VERSION,

        registryService:
          REGISTRY_SERVICE_NAME,

        registryServiceVersion:
          REGISTRY_SERVICE_VERSION,

        storageMode:
          'in-memory',

        provisional:
          true,

        registeredAt:
          nowIso(),
      },
    })

  return createRegistrationResult({
    subscription,

    status:
      'registered',
  })
}

export function registerEiosEventHandlers():
  RegisterEiosEventHandlersResult {
  const registrations = [
    registerAgendaEvidenceCreatedHandler(),
  ]

  const activeSubscriptions =
    eiosEventBus
      .listSubscriptions()
      .filter(
        subscription =>
          subscription.active,
      )

  return {
    success:
      true,

    provisional:
      true,

    storageMode:
      'in-memory',

    registrations,

    registeredCount:
      registrations.filter(
        registration =>
          registration.status ===
          'registered',
      ).length,

    alreadyRegisteredCount:
      registrations.filter(
        registration =>
          registration.status ===
          'already_registered',
      ).length,

    reactivatedCount:
      registrations.filter(
        registration =>
          registration.status ===
          'reactivated',
      ).length,

    totalActiveSubscriptions:
      activeSubscriptions.length,

    completedAt:
      nowIso(),
  }
}

export function unregisterEiosEventHandlers():
  UnregisterEiosEventHandlersResult {
  const subscriptions =
    eiosEventBus
      .listSubscriptions()

  const targetSubscriptions =
    subscriptions.filter(
      subscription =>
        getRegistrationKey(
          subscription,
        ) ===
        AGENDA_EVIDENCE_CREATED_REGISTRATION_KEY,
    )

  const removedSubscriptionIds:
    string[] = []

  for (
    const subscription
    of targetSubscriptions
  ) {
    const removed =
      eiosEventBus.unsubscribe(
        subscription.id,
      )

    if (removed) {
      removedSubscriptionIds.push(
        subscription.id,
      )
    }
  }

  return {
    success:
      removedSubscriptionIds.length ===
      targetSubscriptions.length,

    removedSubscriptionIds,

    removedCount:
      removedSubscriptionIds.length,

    completedAt:
      nowIso(),
  }
}

export function isEiosEventHandlerRegistered({
  registrationKey,
}: {
  registrationKey:
    string
}): boolean {
  const subscription =
    findSubscriptionByRegistrationKey(
      registrationKey,
    )

  return Boolean(
    subscription?.active,
  )
}

export function getEiosEventHandlerRegistrations():
  EiosEventHandlerRegistration[] {
  return eiosEventBus
    .listSubscriptions()
    .filter(
      subscription =>
        getRegistrationKey(
          subscription,
        ) ===
        AGENDA_EVIDENCE_CREATED_REGISTRATION_KEY,
    )
    .map(
      subscription =>
        createRegistrationResult({
          subscription,

          status:
            subscription.active
              ? 'already_registered'
              : 'reactivated',
        }),
    )
}

export const EIOS_EVENT_HANDLER_REGISTRATION_KEYS = {
  agendaEvidenceCreated:
    AGENDA_EVIDENCE_CREATED_REGISTRATION_KEY,
} as const

export const eiosEventHandlerRegistry = {
  register:
    registerEiosEventHandlers,

  unregister:
    unregisterEiosEventHandlers,

  isRegistered:
    isEiosEventHandlerRegistered,

  list:
    getEiosEventHandlerRegistrations,
}