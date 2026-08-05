import type {
  AgendaEvidence,
} from '@/lib/agenda/repository/evidences.repository'

import {
  createAgendaEvidenceCreatedEvent,
  type AgendaEvidenceCreatedEvent,
  type CreateAgendaEvidenceCreatedEventOptions,
} from '@/lib/agenda/events/agenda-evidence-created.event'

import {
  eiosEventBus,
} from '@/lib/eios/events/eios-event-bus.service'

import {
  registerEiosEventHandlers,
  type RegisterEiosEventHandlersResult,
} from '@/lib/eios/events/register-eios-event-handlers.service'

import type {
  EiosEventProcessingResult,
} from '@/lib/eios/events/eios-event.contract'

export type PublishAgendaEvidenceCreatedEventOptions =
  CreateAgendaEvidenceCreatedEventOptions & {
    stopOnHandlerError?:
      boolean

    storeEvent?:
      boolean
  }

export type PublishAgendaEvidenceCreatedEventResult = {
  success:
    boolean

  event:
    AgendaEvidenceCreatedEvent

  processing:
    EiosEventProcessingResult

  handlerRegistration:
    RegisterEiosEventHandlersResult
}

const PUBLISHER_NAME =
  'publish-agenda-evidence-created-event-service'

const PUBLISHER_VERSION =
  '1.1.0'

function nowIso(): string {
  return new Date()
    .toISOString()
}

export async function publishAgendaEvidenceCreatedEvent({
  evidence,
  options = {},
}: {
  evidence:
    AgendaEvidence

  options?:
    PublishAgendaEvidenceCreatedEventOptions
}): Promise<
  PublishAgendaEvidenceCreatedEventResult
> {
  /*
   * O Event Bus atual utiliza armazenamento em memória.
   *
   * Em ambientes serverless, cada instância pode iniciar
   * sem assinaturas registradas. Por isso, o registro dos
   * handlers deve ocorrer imediatamente antes da publicação.
   *
   * O serviço de registro é idempotente:
   *
   * - registra quando a assinatura não existe;
   * - mantém quando já está ativa;
   * - reativa quando estiver inativa.
   */
  const handlerRegistration =
    registerEiosEventHandlers()

  if (
    !handlerRegistration.success ||
    handlerRegistration
      .totalActiveSubscriptions <
      1
  ) {
    throw new Error(
      'Nenhum handler ativo foi registrado para processar o evento evidence.created.',
    )
  }

  const event =
    createAgendaEvidenceCreatedEvent({
      evidence,

      options: {
        ...options,

        metadata: {
          ...options.metadata,

          publisher:
            PUBLISHER_NAME,

          publisherVersion:
            PUBLISHER_VERSION,

          handlerRegistrationMode:
            handlerRegistration
              .storageMode,

          handlerRegistrationProvisional:
            handlerRegistration
              .provisional,

          activeHandlerSubscriptions:
            handlerRegistration
              .totalActiveSubscriptions,

          handlerRegisteredCount:
            handlerRegistration
              .registeredCount,

          handlerAlreadyRegisteredCount:
            handlerRegistration
              .alreadyRegisteredCount,

          handlerReactivatedCount:
            handlerRegistration
              .reactivatedCount,

          publicationPreparedAt:
            nowIso(),
        },
      },
    })

  const processing =
    await eiosEventBus.publish(
      event,
      {
        stopOnHandlerError:
          options.stopOnHandlerError,

        storeEvent:
          options.storeEvent,
      },
    )

  return {
    success:
      processing.success,

    event,

    processing,

    handlerRegistration,
  }
}

export const agendaEvidenceEventPublisher = {
  name:
    PUBLISHER_NAME,

  version:
    PUBLISHER_VERSION,

  publish:
    publishAgendaEvidenceCreatedEvent,
}