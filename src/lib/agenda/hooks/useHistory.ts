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

export function useHistory(
  initialFilters: AgendaHistoryFilters = {},
) {
  const initialFiltersRef =
    useRef<AgendaHistoryFilters>(
      initialFilters,
    )

  const [history, setHistory] =
    useState<AgendaHistoryItem[]>([])

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState<string | null>(null)

  const loadHistory = useCallback(
    async (
      filters: AgendaHistoryFilters =
        initialFiltersRef.current,
    ): Promise<void> => {
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
            String(filters.limit),
          )
        }

        const response = await fetch(
          `/api/agenda/history?${params.toString()}`,
          {
            cache: 'no-store',
            credentials: 'include',
          },
        )

        const result =
          (await response.json()) as HistoryResponse

        if (
          !response.ok ||
          !result.success
        ) {
          throw new Error(
            result.error ??
              'Não foi possível carregar o histórico.',
          )
        }

        setHistory(result.data)
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Erro inesperado.',
        )
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  useEffect(() => {
    void loadHistory()
  }, [loadHistory])

  return {
    history,
    loading,
    error,
    reload: loadHistory,
  }
}