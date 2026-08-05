import type {
  AgendaEvidence,
} from '@/lib/agenda/repository/evidences.repository'

import {
  createAgendaEvidenceCreatedEvent,
  type CreateAgendaEvidenceCreatedEventOptions,
  type AgendaEvidenceCreatedEvent,
} from './agenda-evidence-created.event'

import {
  eiosEventBus,
} from '@/lib/eios/events/eios-event-bus.service'

import type {
  EiosEventProcessingResult,
} from '@/lib/eios/events/eios-event.contract'

export type PublishAgendaEvidenceCreatedEventOptions =
  CreateAgendaEvidenceCreatedEventOptions & {
    stopOnHandlerError?: boolean
    storeEvent?: boolean
  }

export type PublishAgendaEvidenceCreatedEventResult = {
  success: boolean
  event: AgendaEvidenceCreatedEvent
  processing: EiosEventProcessingResult
}

export async function publishAgendaEvidenceCreatedEvent({
  evidence,
  options = {},
}: {
  evidence: AgendaEvidence
  options?: PublishAgendaEvidenceCreatedEventOptions
}): Promise<PublishAgendaEvidenceCreatedEventResult> {

  const event =
    createAgendaEvidenceCreatedEvent({
      evidence,
      options,
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
  }
}

export const agendaEvidenceEventPublisher = {
  publish:
    publishAgendaEvidenceCreatedEvent,
}