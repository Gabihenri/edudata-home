'use client'

import {
  useCallback,
  useEffect,
  useState,
} from 'react'

import type {
  BuildEducationalAnalyticsInput,
} from '@/lib/agenda/educational-analytics/analytics.types'

import type {
  AgendaAnalyticsDatasetQuality,
} from '@/lib/agenda/educational-analytics/agenda-analytics-dataset.service'

import type {
  AgendaOperationalSnapshotSummary,
} from '@/lib/agenda/services/operational-snapshot.service'

export type EducationalAnalyticsDatasetState = {
  data: BuildEducationalAnalyticsInput | null
  quality: AgendaAnalyticsDatasetQuality | null
  operationalSummary: string | null
  generatedAt: string | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

type EducationalAnalyticsDatasetResponse = {
  success: boolean
  generatedAt?: string
  data?: BuildEducationalAnalyticsInput
  quality?: AgendaAnalyticsDatasetQuality
  operationalSummary?: AgendaOperationalSnapshotSummary
  error?: string
}

function normalizeError(
  value: unknown,
): string {
  if (typeof value === 'string' && value.trim()) {
    return value.trim()
  }

  return 'Não foi possível carregar o Dataset Analítico Educacional.'
}

function formatOperationalSummary(
  summary: AgendaOperationalSnapshotSummary | undefined,
): string | null {
  if (!summary) return null

  return [
    `${summary.totalRecords} registros operacionais`,
    `${summary.totalPlanning} planejamentos`,
    `${summary.totalObjectives} objetivos`,
    `${summary.totalLessons} aulas`,
    `${summary.totalEvidences} evidências`,
  ].join(' · ')
}

export function useEducationalAnalyticsDataset(): EducationalAnalyticsDatasetState {
  const [data, setData] =
    useState<BuildEducationalAnalyticsInput | null>(null)
  const [quality, setQuality] =
    useState<AgendaAnalyticsDatasetQuality | null>(null)
  const [operationalSummary, setOperationalSummary] =
    useState<string | null>(null)
  const [generatedAt, setGeneratedAt] =
    useState<string | null>(null)
  const [loading, setLoading] =
    useState(true)
  const [error, setError] =
    useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(
        '/api/agenda/educational-analytics',
        {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
          headers: {
            Accept: 'application/json',
          },
        },
      )

      const payload =
        await response.json() as EducationalAnalyticsDatasetResponse

      if (!response.ok || !payload.success) {
        throw new Error(
          normalizeError(payload.error),
        )
      }

      setData(payload.data ?? null)
      setQuality(payload.quality ?? null)
      setOperationalSummary(
        formatOperationalSummary(payload.operationalSummary),
      )
      setGeneratedAt(
        payload.generatedAt ?? null,
      )
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Não foi possível carregar o Dataset Analítico Educacional.',
      )
      setData(null)
      setQuality(null)
      setOperationalSummary(null)
      setGeneratedAt(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return {
    data,
    quality,
    operationalSummary,
    generatedAt,
    loading,
    error,
    refresh,
  }
}
