'use client'

import { useCallback, useEffect, useState } from 'react'

import type {
  AgendaEvent,
  CreateAgendaEventInput,
} from '@/lib/agenda'

type EventsResponse = {
  success: boolean
  total?: number
  data?: AgendaEvent[] | AgendaEvent
  error?: string
}

export function useEvents() {
  const [events, setEvents] = useState<AgendaEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadEvents = useCallback(async (): Promise<void> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/agenda/events', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      })

      const result = (await response.json()) as EventsResponse

      if (!response.ok || !result.success || !Array.isArray(result.data)) {
        throw new Error(
          result.error ?? 'Não foi possível carregar os eventos.',
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
  }, [])

  const createEvent = useCallback(
    async (
      input: CreateAgendaEventInput,
    ): Promise<AgendaEvent> => {
      const response = await fetch('/api/agenda/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          title: input.title,
          description: input.description ?? null,
          eventType: input.event_type ?? 'pedagogico',
          startAt: input.start_at,
          endAt: input.end_at ?? null,
          status: input.status ?? 'planejado',
          priority: input.priority ?? 'media',
          schoolId: input.school_id ?? null,
          userId: input.user_id ?? null,
          planningId: input.planning_id ?? null,
          evidenceId: input.evidence_id ?? null,
        }),
      })

      const result = (await response.json()) as EventsResponse

      if (
        !response.ok ||
        !result.success ||
        !result.data ||
        Array.isArray(result.data)
      ) {
        throw new Error(
          result.error ?? 'Não foi possível criar o evento.',
        )
      }

      const createdEvent = result.data

      setEvents((currentEvents) =>
        [...currentEvents, createdEvent].sort(
          (firstEvent, secondEvent) =>
            new Date(firstEvent.start_at).getTime() -
            new Date(secondEvent.start_at).getTime(),
        ),
      )

      return createdEvent
    },
    [],
  )

  useEffect(() => {
    void loadEvents()
  }, [loadEvents])

  return {
    events,
    loading,
    error,
    reload: loadEvents,
    createEvent,
  }
}