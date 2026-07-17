'use client'

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'

import type {
  AgendaHistoryFilters,
  AgendaHistoryItem,
} from '@/lib/agenda'

type HistoryResponse = {
  success: boolean
  total: number
  data: AgendaHistoryItem[]
  error?: string
}

type RestoreEventResponse = {
  success: boolean
  message?: string
  data?: unknown
  error?: string
}

type ApiErrorResponse = {
  success?: boolean
  error?: string
  message?: string
}

async function readJsonResponse<T>(
  response: Response,
): Promise<T | null> {
  try {
    return (await response.json()) as T
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

export function useHistory(
  initialFilters: AgendaHistoryFilters = {},
) {
  const initialFiltersRef =
    useRef<AgendaHistoryFilters>(
      initialFilters,
    )

  const currentFiltersRef =
    useRef<AgendaHistoryFilters>(
      initialFilters,
    )

  const [
    history,
    setHistory,
  ] =
    useState<AgendaHistoryItem[]>([])

  const [
    loading,
    setLoading,
  ] =
    useState(true)

  const [
    error,
    setError,
  ] =
    useState<string | null>(null)

  const [
    restoringEventId,
    setRestoringEventId,
  ] =
    useState<string | null>(null)

  const [
    actionError,
    setActionError,
  ] =
    useState<string | null>(null)

  const [
    actionMessage,
    setActionMessage,
  ] =
    useState<string | null>(null)

  const loadHistory = useCallback(
    async (
      filters: AgendaHistoryFilters =
        currentFiltersRef.current,
    ): Promise<void> => {
      currentFiltersRef.current = {
        ...filters,
      }

      setLoading(true)
      setError(null)

      try {
        const params =
          new URLSearchParams()

        if (filters.userId) {
          params.set(
            'userId',
            filters.userId,
          )
        }

        if (filters.schoolId) {
          params.set(
            'schoolId',
            filters.schoolId,
          )
        }

        if (filters.type) {
          params.set(
            'type',
            filters.type,
          )
        }

        if (filters.search) {
          params.set(
            'search',
            filters.search,
          )
        }

        if (filters.startDate) {
          params.set(
            'startDate',
            filters.startDate,
          )
        }

        if (filters.endDate) {
          params.set(
            'endDate',
            filters.endDate,
          )
        }

        if (filters.limit) {
          params.set(
            'limit',
            String(
              filters.limit,
            ),
          )
        }

        const queryString =
          params.toString()

        const endpoint =
          queryString
            ? `/api/agenda/history?${queryString}`
            : '/api/agenda/history'

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
            HistoryResponse
          >(response)

        if (
          !response.ok ||
          !result?.success
        ) {
          throw new Error(
            result?.error ??
              'Não foi possível carregar o histórico.',
          )
        }

        setHistory(
          Array.isArray(
            result.data,
          )
            ? result.data
            : [],
        )
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Erro inesperado ao carregar o histórico.',
        )
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  const restoreEvent =
    useCallback(
      async (
        eventId: string,
        reason: string,
      ): Promise<boolean> => {
        setActionError(null)
        setActionMessage(null)

        try {
          const normalizedEventId =
            normalizeRequiredText(
              eventId,
              'ID do evento',
            )

          const normalizedReason =
            normalizeRequiredText(
              reason,
              'Motivo da restauração',
            )

          setRestoringEventId(
            normalizedEventId,
          )

          const response =
            await fetch(
              `/api/agenda/events/${encodeURIComponent(
                normalizedEventId,
              )}/restore`,
              {
                method: 'POST',
                cache: 'no-store',
                credentials:
                  'include',

                headers: {
                  Accept:
                    'application/json',

                  'Content-Type':
                    'application/json',
                },

                body:
                  JSON.stringify({
                    reason:
                      normalizedReason,
                  }),
              },
            )

          const result =
            await readJsonResponse<
              RestoreEventResponse
            >(response)

          if (
            !response.ok ||
            !result?.success
          ) {
            const fallbackResult =
              result as
                | ApiErrorResponse
                | null

            throw new Error(
              fallbackResult?.error ??
                fallbackResult?.message ??
                'Não foi possível restaurar o evento.',
            )
          }

          setActionMessage(
            result.message ??
              'Evento restaurado com sucesso.',
          )

          await loadHistory(
            currentFiltersRef.current,
          )

          return true
        } catch (err) {
          setActionError(
            err instanceof Error
              ? err.message
              : 'Erro inesperado ao restaurar o evento.',
          )

          return false
        } finally {
          setRestoringEventId(
            null,
          )
        }
      },
      [loadHistory],
    )

  const clearActionFeedback =
    useCallback(() => {
      setActionError(null)
      setActionMessage(null)
    }, [])

  useEffect(() => {
    void loadHistory(
      initialFiltersRef.current,
    )
  }, [loadHistory])

  return {
    history,
    loading,
    error,
    reload:
      loadHistory,

    restoringEventId,
    actionError,
    actionMessage,

    restoreEvent,
    clearActionFeedback,
  }
}