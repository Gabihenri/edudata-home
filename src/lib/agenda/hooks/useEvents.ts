'use client'

import {
  useCallback,
  useEffect,
  useState,
} from 'react'

import type {
  AgendaEvent,
  CreateAgendaEventInput,
} from '@/lib/agenda'

type EventsResponse = {
  success: boolean
  total?: number
  message?: string

  data?:
    | AgendaEvent[]
    | AgendaEvent

  error?: string
}

function normalizeRequiredText(
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

async function readEventsResponse(
  response: Response,
): Promise<EventsResponse> {
  try {
    return (
      await response.json()
    ) as EventsResponse
  } catch {
    throw new Error(
      'A resposta do servidor é inválida.',
    )
  }
}

export function useEvents() {
  const [events, setEvents] =
    useState<AgendaEvent[]>([])

  const [loading, setLoading] =
    useState(true)

  const [
    deletingEventId,
    setDeletingEventId,
  ] = useState<string | null>(null)

  const [error, setError] =
    useState<string | null>(null)

  const loadEvents =
    useCallback(
      async (): Promise<void> => {
        setLoading(true)
        setError(null)

        try {
          const response =
            await fetch(
              '/api/agenda/events',
              {
                method: 'GET',
                credentials: 'include',
                cache: 'no-store',
              },
            )

          const result =
            await readEventsResponse(
              response,
            )

          if (
            !response.ok ||
            !result.success ||
            !Array.isArray(result.data)
          ) {
            throw new Error(
              result.error ??
                'Não foi possível carregar os eventos.',
            )
          }

          setEvents(result.data)
        } catch (loadError) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Erro inesperado ao carregar eventos.',
          )
        } finally {
          setLoading(false)
        }
      },
      [],
    )

  const createEvent =
    useCallback(
      async (
        input: CreateAgendaEventInput,
      ): Promise<AgendaEvent> => {
        setError(null)

        const response =
          await fetch(
            '/api/agenda/events',
            {
              method: 'POST',

              headers: {
                'Content-Type':
                  'application/json',
              },

              credentials: 'include',

              body: JSON.stringify({
                title: input.title,

                description:
                  input.description ??
                  null,

                eventType:
                  input.event_type ??
                  'pedagogico',

                startAt:
                  input.start_at,

                endAt:
                  input.end_at ??
                  null,

                status:
                  input.status ??
                  'planejado',

                priority:
                  input.priority ??
                  'media',

                schoolId:
                  input.school_id ??
                  null,

                planningId:
                  input.planning_id ??
                  null,

                evidenceId:
                  input.evidence_id ??
                  null,

                scheduleMode:
                  input.schedule_mode ??
                  'pontual',

                recurrenceFrequency:
                  input.recurrence_frequency ??
                  'none',

                recurrenceInterval:
                  input.recurrence_interval ??
                  1,

                recurrenceUntil:
                  input.recurrence_until ??
                  null,

                sourceTemplateId:
                  input.source_template_id ??
                  null,

                weekReference:
                  input.week_reference ??
                  null,
              }),
            },
          )

        const result =
          await readEventsResponse(
            response,
          )

        if (
          !response.ok ||
          !result.success ||
          !result.data
        ) {
          throw new Error(
            result.error ??
              'Não foi possível criar o evento.',
          )
        }

        const createdEvent =
          Array.isArray(result.data)
            ? result.data[0]
            : result.data

        if (!createdEvent) {
          throw new Error(
            'O servidor não retornou o evento criado.',
          )
        }

        setEvents(
          (currentEvents) =>
            [
              ...currentEvents,
              createdEvent,
            ].sort(
              (
                firstEvent,
                secondEvent,
              ) =>
                new Date(
                  firstEvent.start_at,
                ).getTime() -
                new Date(
                  secondEvent.start_at,
                ).getTime(),
            ),
        )

        return createdEvent
      },
      [],
    )

  const deleteEvent =
    useCallback(
      async (
        eventId: string,
        reason: string,
      ): Promise<string> => {
        const normalizedEventId =
          normalizeRequiredText(
            eventId,
            'ID do evento',
          )

        const normalizedReason =
          normalizeRequiredText(
            reason,
            'Motivo da exclusão',
          )

        setDeletingEventId(
          normalizedEventId,
        )

        setError(null)

        try {
          const response =
            await fetch(
              `/api/agenda/events/${encodeURIComponent(
                normalizedEventId,
              )}`,
              {
                method: 'DELETE',

                headers: {
                  'Content-Type':
                    'application/json',
                },

                credentials: 'include',

                body: JSON.stringify({
                  reason:
                    normalizedReason,
                }),
              },
            )

          const result =
            await readEventsResponse(
              response,
            )

          if (
            !response.ok ||
            !result.success
          ) {
            throw new Error(
              result.error ??
                'Não foi possível excluir o evento.',
            )
          }

          setEvents(
            (currentEvents) =>
              currentEvents.filter(
                (event) =>
                  event.id !==
                  normalizedEventId,
              ),
          )

          return (
            result.message ??
            'Evento excluído com sucesso.'
          )
        } catch (deleteError) {
          const message =
            deleteError instanceof Error
              ? deleteError.message
              : 'Erro inesperado ao excluir o evento.'

          setError(message)

          throw new Error(message)
        } finally {
          setDeletingEventId(null)
        }
      },
      [],
    )

  useEffect(() => {
    void loadEvents()
  }, [loadEvents])

  return {
    events,
    loading,
    deletingEventId,
    error,

    reload: loadEvents,
    createEvent,
    deleteEvent,
  }
}