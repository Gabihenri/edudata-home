'use client'

import { useCallback, useEffect, useState } from 'react'

import type {
  AgendaTask,
  CreateAgendaTaskInput,
} from '@/lib/agenda'

type TasksResponse = {
  success: boolean
  total?: number
  data?: AgendaTask[] | AgendaTask
  error?: string
}

export function useTasks() {
  const [tasks, setTasks] = useState<AgendaTask[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadTasks = useCallback(async (): Promise<void> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/agenda/tasks', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      })

      const result = (await response.json()) as TasksResponse

      if (!response.ok || !result.success || !Array.isArray(result.data)) {
        throw new Error(
          result.error ?? 'Não foi possível carregar as tarefas.',
        )
      }

      setTasks(result.data)
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Erro inesperado ao carregar tarefas.',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  const createTask = useCallback(
    async (
      input: CreateAgendaTaskInput,
    ): Promise<AgendaTask> => {
      const response = await fetch('/api/agenda/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          title: input.title,
          description: input.description ?? null,
          status: input.status ?? 'pendente',
          priority: input.priority ?? 'media',
          dueDate: input.due_date ?? null,
          eventId: input.event_id ?? null,
          schoolId: input.school_id ?? null,
          userId: input.user_id ?? null,
        }),
      })

      const result = (await response.json()) as TasksResponse

      if (
        !response.ok ||
        !result.success ||
        !result.data ||
        Array.isArray(result.data)
      ) {
        throw new Error(
          result.error ?? 'Não foi possível criar a tarefa.',
        )
      }

      const createdTask = result.data

      setTasks((currentTasks) => [...currentTasks, createdTask])

      return createdTask
    },
    [],
  )

  useEffect(() => {
    void loadTasks()
  }, [loadTasks])

  return {
    tasks,
    loading,
    error,
    reload: loadTasks,
    createTask,
  }
}
