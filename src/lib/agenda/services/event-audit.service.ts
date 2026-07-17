import {
  eventAuditRepository,
  type AgendaEventAuditEntry,
} from '@/lib/agenda/repository/event-audit.repository'

import {
  eventsRepository,
  type AgendaEvent,
} from '@/lib/agenda/repository/events.repository'

const DEFAULT_AUDIT_LIMIT = 100
const MAX_AUDIT_LIMIT = 200

export type EventAuditAccessContext = {
  requesterUserId: string
}

export type EventAuditQuery = {
  eventId: string
  limit?: number
}

export type EventAuditResult = {
  event: {
    id: string
    title: string
    ownerUserId: string
    isDeleted: boolean
  }

  total: number
  versions: AgendaEventAuditEntry[]
}

function normalizeRequiredId(
  value: string,
  fieldName: string,
): string {
  const normalizedValue =
    value?.trim()

  if (!normalizedValue) {
    throw new Error(
      `${fieldName} é obrigatório.`,
    )
  }

  return normalizedValue
}

function normalizeLimit(
  value?: number,
): number {
  if (value === undefined) {
    return DEFAULT_AUDIT_LIMIT
  }

  if (
    !Number.isInteger(value) ||
    value < 1
  ) {
    throw new Error(
      'O limite de versões deve ser um número inteiro positivo.',
    )
  }

  return Math.min(
    value,
    MAX_AUDIT_LIMIT,
  )
}

function normalizeAccessContext(
  context: EventAuditAccessContext,
): EventAuditAccessContext {
  if (!context) {
    throw new Error(
      'O contexto de acesso à auditoria é obrigatório.',
    )
  }

  return {
    requesterUserId:
      normalizeRequiredId(
        context.requesterUserId,
        'ID do usuário solicitante',
      ),
  }
}

function normalizeQuery(
  query: EventAuditQuery,
): Required<EventAuditQuery> {
  if (!query) {
    throw new Error(
      'Os dados da consulta de versões são obrigatórios.',
    )
  }

  return {
    eventId:
      normalizeRequiredId(
        query.eventId,
        'ID do evento',
      ),

    limit:
      normalizeLimit(
        query.limit,
      ),
  }
}

function assertEventOwner(
  event: AgendaEvent,
  requesterUserId: string,
): string {
  const ownerUserId =
    event.user_id?.trim()

  if (!ownerUserId) {
    throw new Error(
      'O evento não possui proprietário identificado.',
    )
  }

  if (
    ownerUserId !==
    requesterUserId
  ) {
    throw new Error(
      'O usuário não possui permissão para consultar as versões deste evento.',
    )
  }

  return ownerUserId
}

class EventAuditService {
  async listEventVersions(
    query: EventAuditQuery,
    context: EventAuditAccessContext,
  ): Promise<EventAuditResult> {
    const normalizedQuery =
      normalizeQuery(query)

    const normalizedContext =
      normalizeAccessContext(
        context,
      )

    const event =
      await eventsRepository
        .findByIdIncludingDeleted(
          normalizedQuery.eventId,
        )

    if (!event) {
      throw new Error(
        'Evento não encontrado.',
      )
    }

    const ownerUserId =
      assertEventOwner(
        event,
        normalizedContext
          .requesterUserId,
      )

    const versions =
      await eventAuditRepository
        .findByEventId(
          normalizedQuery.eventId,
          ownerUserId,
          normalizedQuery.limit,
        )

    return {
      event: {
        id:
          event.id,

        title:
          event.title,

        ownerUserId,

        isDeleted:
          Boolean(
            event.deleted_at,
          ),
      },

      total:
        versions.length,

      versions,
    }
  }
}

export const eventAuditService =
  new EventAuditService()