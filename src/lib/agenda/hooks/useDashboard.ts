'use client'

import { useEffect, useState } from 'react'

import type { AgendaDashboardSummary } from '@/lib/agenda/services'

type DashboardResponse = {
  success: boolean
  data: AgendaDashboardSummary
}

export function useDashboard() {
  const [data, setData] =
    useState<AgendaDashboardSummary | null>(null)

  const [loading, setLoading] = useState(true)

  const [error, setError] = useState<string | null>(null)

  async function load() {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/agenda/dashboard')

      const result =
        (await response.json()) as DashboardResponse

      if (!response.ok || !result.success) {
        throw new Error('Erro ao carregar dashboard.')
      }

      setData(result.data)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Erro inesperado.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  return {
    data,
    loading,
    error,
    reload: load,
  }
}