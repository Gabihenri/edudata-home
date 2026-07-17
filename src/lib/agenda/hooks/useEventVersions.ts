'use client'

import {
  useCallback,
  useState,
} from 'react'

import type {
  AgendaEventAuditEntry,
} from '@/lib/agenda/repository/event-audit.repository'

export type EventVersionsSummary = {
  id: string
  title: string
  isDeleted: boolean
}

type EventVersionsResponse = {
  success: boolean

  data?: {
    event: EventVersionsSummary
    total: number
    versions: AgendaEventAuditEntry[]
  }

  error?: string
  message?: string
}

async function readJsonResponse<T>(
  response: Response,
): Promise<T | null> {
  try {
    return await response.json() as T
  } catch {
    return null
  }
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

function normalizeLimit(
  value?: number,
): number | undefined {
  if (value === undefined) {
    return undefined
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
    200,
  )
}

export function useEventVersions() {
  const [
    event,
    setEvent,
  ] =
    useState<EventVersionsSummary | null>(
      null,
    )

  const [
    versions,
    setVersions,
  ] =
    useState<AgendaEventAuditEntry[]>([])

  const [
    total,
    setTotal,
  ] =
    useState(0)

  const [
    loading,
    setLoading,
  ] =
    useState(false)

  const [
    error,
    setError,
  ] =
    useState<string | null>(null)

  const [
    selectedEventId,
    setSelectedEventId,
  ] =
    useState<string | null>(null)

  const clear =
    useCallback(() => {
      setEvent(null)
      setVersions([])
      setTotal(0)
      setError(null)
      setSelectedEventId(null)
      setLoading(false)
    }, [])

  const loadEventVersions =
    useCallback(
      async (
        eventId: string,
        limit?: number,
      ): Promise<boolean> => {
        setError(null)
        setLoading(true)

        try {
          const normalizedEventId =
            normalizeRequiredText(
              eventId,
              'ID do evento',
            )

          const normalizedLimit =
            normalizeLimit(
              limit,
            )

          setSelectedEventId(
            normalizedEventId,
          )

          const params =
            new URLSearchParams()

          if (
            normalizedLimit !== undefined
          ) {
            params.set(
              'limit',
              String(
                normalizedLimit,
              ),
            )
          }

          const queryString =
            params.toString()

          const endpoint =
            queryString
              ? `/api/agenda/events/${encodeURIComponent(
                  normalizedEventId,
                )}/versions?${queryString}`
              : `/api/agenda/events/${encodeURIComponent(
                  normalizedEventId,
                )}/versions`

          const response =
            await fetch(
              endpoint,
              {
                method: 'GET',
                cache: 'no-store',
                credentials: 'include',

                headers: {
                  Accept:
                    'application/json',
                },
              },
            )

          const result =
            await readJsonResponse<
              EventVersionsResponse
            >(response)

          if (
            !response.ok ||
            !result?.success ||
            !result.data
          ) {
            throw new Error(
              result?.error ??
                result?.message ??
                'Não foi possível carregar as versões do evento.',
            )
          }

          const loadedVersions =
            Array.isArray(
              result.data.versions,
            )
              ? result.data.versions
              : []

          setEvent(
            result.data.event,
          )

          setVersions(
            loadedVersions,
          )

          setTotal(
            Number.isFinite(
              result.data.total,
            )
              ? result.data.total
              : loadedVersions.length,
          )

          return true
        } catch (err) {
          setEvent(null)
          setVersions([])
          setTotal(0)

          setError(
            err instanceof Error
              ? err.message
              : 'Erro inesperado ao carregar as versões do evento.',
          )

          return false
        } finally {
          setLoading(false)
        }
      },
      [],
    )

  const reload =
    useCallback(
      async (): Promise<boolean> => {
        if (!selectedEventId) {
          return false
        }

        return loadEventVersions(
          selectedEventId,
        )
      },
      [
        loadEventVersions,
        selectedEventId,
      ],
    )

  return {
    event,
    versions,
    total,

    loading,
    error,

    selectedEventId,

    loadEventVersions,
    reload,
    clear,
  }
}