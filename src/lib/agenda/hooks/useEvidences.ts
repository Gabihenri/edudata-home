'use client'

import { useCallback, useEffect, useState } from 'react'

import type {
  AgendaEvidence,
  CreateAgendaEvidenceInput,
} from '@/lib/agenda'

type EvidencesResponse = {
  success: boolean
  total?: number
  data?: AgendaEvidence[] | AgendaEvidence
  error?: string
}

type UploadResponse = {
  success: boolean
  data: {
    bucket: string
    path: string
    publicUrl: string
  }
  error?: string
}

export function useEvidences() {
  const [evidences, setEvidences] = useState<AgendaEvidence[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadEvidences = useCallback(async (): Promise<void> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/agenda/evidences', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      })

      const result = (await response.json()) as EvidencesResponse

      if (!response.ok || !result.success || !Array.isArray(result.data)) {
        throw new Error(
          result.error ?? 'Não foi possível carregar as evidências.',
        )
      }

      setEvidences(result.data)
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Erro inesperado ao carregar evidências.',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  const uploadEvidence = useCallback(
    async (file: File): Promise<string> => {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(
        '/api/agenda/evidences/upload',
        {
          method: 'POST',
          credentials: 'include',
          body: formData,
        },
      )

      const result =
        (await response.json()) as UploadResponse

      if (!response.ok || !result.success) {
        throw new Error(
          result.error ?? 'Erro ao enviar arquivo.',
        )
      }

      return result.data.publicUrl
    },
    [],
  )

  const createEvidence = useCallback(
    async (
      input: CreateAgendaEvidenceInput,
    ): Promise<AgendaEvidence> => {
      const response = await fetch('/api/agenda/evidences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          title: input.title,
          description: input.description ?? null,
          evidenceType: input.evidence_type ?? 'texto',
          fileUrl: input.file_url ?? null,
          externalUrl: input.external_url ?? null,
          planningId: input.planning_id ?? null,
          eventId: input.event_id ?? null,
          schoolId: input.school_id ?? null,
          userId: input.user_id ?? null,
        }),
      })

      const result = (await response.json()) as EvidencesResponse

      if (
        !response.ok ||
        !result.success ||
        !result.data ||
        Array.isArray(result.data)
      ) {
        throw new Error(
          result.error ?? 'Não foi possível criar a evidência.',
        )
      }

      const createdEvidence = result.data

      setEvidences((currentEvidences) => [
        createdEvidence,
        ...currentEvidences,
      ])

      return createdEvidence
    },
    [],
  )

  useEffect(() => {
    void loadEvidences()
  }, [loadEvidences])

  return {
    evidences,
    loading,
    error,
    reload: loadEvidences,
    createEvidence,
    uploadEvidence,
  }
}