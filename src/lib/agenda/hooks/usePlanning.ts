'use client'

import { useCallback, useEffect, useState } from 'react'

import type {
  AgendaPlanning,
  CreateAgendaPlanningInput,
} from '@/lib/agenda'

type PlanningResponse = {
  success: boolean
  total?: number
  data?: AgendaPlanning[] | AgendaPlanning
  error?: string
}

export function usePlanning() {
  const [planning, setPlanning] = useState<AgendaPlanning[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadPlanning = useCallback(async (): Promise<void> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/agenda/planning', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      })

      const result = (await response.json()) as PlanningResponse

      if (!response.ok || !result.success || !Array.isArray(result.data)) {
        throw new Error(
          result.error ?? 'Não foi possível carregar os planejamentos.',
        )
      }

      setPlanning(result.data)
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Erro inesperado ao carregar planejamentos.',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  const createPlanning = useCallback(
    async (
      input: CreateAgendaPlanningInput,
    ): Promise<AgendaPlanning> => {
      const response = await fetch('/api/agenda/planning', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          title: input.title,
          description: input.description ?? null,
          subject: input.subject ?? null,
          className: input.class_name ?? null,
          objective: input.objective ?? null,
          methodology: input.methodology ?? null,
          resources: input.resources ?? null,
          evaluation: input.evaluation ?? null,
          plannedDate: input.planned_date ?? null,
          status: input.status ?? 'rascunho',
          schoolId: input.school_id ?? null,
          userId: input.user_id ?? null,
        }),
      })

      const result = (await response.json()) as PlanningResponse

      if (
        !response.ok ||
        !result.success ||
        !result.data ||
        Array.isArray(result.data)
      ) {
        throw new Error(
          result.error ?? 'Não foi possível criar o planejamento.',
        )
      }

      const createdPlanning = result.data

      setPlanning((currentPlanning) => [
        ...currentPlanning,
        createdPlanning,
      ])

      return createdPlanning
    },
    [],
  )

  useEffect(() => {
    void loadPlanning()
  }, [loadPlanning])

  return {
    planning,
    loading,
    error,
    reload: loadPlanning,
    createPlanning,
  }
}