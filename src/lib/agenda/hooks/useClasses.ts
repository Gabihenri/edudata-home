'use client'

import { useCallback, useEffect, useState } from 'react'

import type {
  AgendaClass,
  CreateAgendaClassInput,
} from '@/lib/agenda'

type ClassesResponse = {
  success: boolean
  total?: number
  data?: AgendaClass[] | AgendaClass
  error?: string
}

export function useClasses() {
  const [classes, setClasses] = useState<AgendaClass[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadClasses = useCallback(async (): Promise<void> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/agenda/classes', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      })

      const result = (await response.json()) as ClassesResponse

      if (!response.ok || !result.success || !Array.isArray(result.data)) {
        throw new Error(
          result.error ?? 'Não foi possível carregar as turmas.',
        )
      }

      setClasses(result.data)
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Erro inesperado ao carregar turmas.',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  const createClass = useCallback(
    async (
      input: CreateAgendaClassInput,
    ): Promise<AgendaClass> => {
      const response = await fetch('/api/agenda/classes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: input.name,
          schoolYear: input.school_year ?? null,
          grade: input.grade ?? null,
          subject: input.subject ?? null,
          studentsCount: input.students_count ?? 0,
          schoolId: input.school_id ?? null,
          teacherId: input.teacher_id ?? null,
          active: input.active ?? true,
        }),
      })

      const result = (await response.json()) as ClassesResponse

      if (
        !response.ok ||
        !result.success ||
        !result.data ||
        Array.isArray(result.data)
      ) {
        throw new Error(
          result.error ?? 'Não foi possível criar a turma.',
        )
      }

      const createdClass = result.data

      setClasses((currentClasses) =>
        [...currentClasses, createdClass].sort((first, second) =>
          first.name.localeCompare(second.name, 'pt-BR'),
        ),
      )

      return createdClass
    },
    [],
  )

  useEffect(() => {
    void loadClasses()
  }, [loadClasses])

  return {
    classes,
    loading,
    error,
    reload: loadClasses,
    createClass,
  }
}