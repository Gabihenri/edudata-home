'use client'

import {
  useCallback,
  useEffect,
  useState,
} from 'react'

import type {
  AgendaPlanning,
  CreateAgendaPlanningInput,
  UpdateAgendaPlanningInput,
} from '@/lib/agenda'

type PlanningResponse = {
  success: boolean

  total?: number

  data?:
    | AgendaPlanning[]
    | AgendaPlanning

  error?: string
  message?: string
}

type PlanningPayload =
  Record<string, unknown>

function assignIfDefined(
  payload: PlanningPayload,
  key: string,
  value: unknown,
): void {
  if (value !== undefined) {
    payload[key] = value
  }
}

function createPlanningPayload(
  input:
    | CreateAgendaPlanningInput
    | UpdateAgendaPlanningInput,
): PlanningPayload {
  const payload:
    PlanningPayload = {}

  assignIfDefined(
    payload,
    'title',
    input.title,
  )

  assignIfDefined(
    payload,
    'description',
    input.description,
  )

  assignIfDefined(
    payload,
    'subject',
    input.subject,
  )

  assignIfDefined(
    payload,
    'className',
    input.class_name,
  )

  assignIfDefined(
    payload,
    'objective',
    input.objective,
  )

  assignIfDefined(
    payload,
    'methodology',
    input.methodology,
  )

  assignIfDefined(
    payload,
    'resources',
    input.resources,
  )

  assignIfDefined(
    payload,
    'evaluation',
    input.evaluation,
  )

  assignIfDefined(
    payload,
    'plannedDate',
    input.planned_date,
  )

  assignIfDefined(
    payload,
    'plannedStartTime',
    input.planned_start_time,
  )

  assignIfDefined(
    payload,
    'plannedEndTime',
    input.planned_end_time,
  )

  assignIfDefined(
    payload,
    'durationMinutes',
    input.duration_minutes,
  )

  assignIfDefined(
    payload,
    'status',
    input.status,
  )

  assignIfDefined(
    payload,
    'classId',
    input.class_id,
  )

  assignIfDefined(
    payload,
    'schoolYearId',
    input.school_year_id,
  )

  assignIfDefined(
    payload,
    'academicPeriodId',
    input.academic_period_id,
  )

  assignIfDefined(
    payload,
    'isTemplate',
    input.is_template,
  )

  assignIfDefined(
    payload,
    'templateName',
    input.template_name,
  )

  assignIfDefined(
    payload,
    'schoolId',
    input.school_id,
  )

  assignIfDefined(
    payload,
    'statusChangeReason',
    input.status_change_reason,
  )

  assignIfDefined(
    payload,
    'archiveReason',
    input.archive_reason,
  )

  return payload
}

async function readPlanningResponse(
  response: Response,
): Promise<PlanningResponse> {
  try {
    return await response
      .json() as
        PlanningResponse
  } catch {
    return {
      success: false,

      error:
        'A resposta do servidor possui formato inválido.',
    }
  }
}

function requirePlanningRecord(
  response: Response,
  result: PlanningResponse,
  fallbackMessage: string,
): AgendaPlanning {
  if (
    !response.ok ||
    !result.success ||
    !result.data ||
    Array.isArray(
      result.data,
    )
  ) {
    throw new Error(
      result.error ??
        fallbackMessage,
    )
  }

  return result.data
}

export function usePlanning() {
  const [
    planning,
    setPlanning,
  ] = useState<
    AgendaPlanning[]
  >([])

  const [
    loading,
    setLoading,
  ] = useState(true)

  const [
    mutating,
    setMutating,
  ] = useState(false)

  const [
    error,
    setError,
  ] = useState<
    string | null
  >(null)

  const clearError =
    useCallback(() => {
      setError(null)
    }, [])

  const loadPlanning =
    useCallback(
      async (): Promise<void> => {
        setLoading(true)
        setError(null)

        try {
          const response =
            await fetch(
              '/api/agenda/planning',
              {
                method: 'GET',

                credentials:
                  'include',

                cache:
                  'no-store',
              },
            )

          const result =
            await readPlanningResponse(
              response,
            )

          if (
            !response.ok ||
            !result.success ||
            !Array.isArray(
              result.data,
            )
          ) {
            throw new Error(
              result.error ??
                'Não foi possível carregar os planejamentos.',
            )
          }

          setPlanning(
            result.data,
          )
        } catch (
          loadError
        ) {
          const message =
            loadError instanceof
            Error
              ? loadError.message
              : 'Erro inesperado ao carregar planejamentos.'

          setError(
            message,
          )
        } finally {
          setLoading(false)
        }
      },
      [],
    )

  const getPlanning =
    useCallback(
      async (
        id: string,
      ): Promise<
        AgendaPlanning
      > => {
        setError(null)

        const response =
          await fetch(
            `/api/agenda/planning/${encodeURIComponent(id)}`,
            {
              method: 'GET',

              credentials:
                'include',

              cache:
                'no-store',
            },
          )

        const result =
          await readPlanningResponse(
            response,
          )

        const record =
          requirePlanningRecord(
            response,
            result,
            'Não foi possível carregar o planejamento.',
          )

        setPlanning(
          (
            currentPlanning,
          ) => {
            const exists =
              currentPlanning
                .some(
                  (
                    currentRecord,
                  ) =>
                    currentRecord.id ===
                    record.id,
                )

            if (!exists) {
              return [
                record,
                ...currentPlanning,
              ]
            }

            return currentPlanning
              .map(
                (
                  currentRecord,
                ) =>
                  currentRecord.id ===
                  record.id
                    ? record
                    : currentRecord,
              )
          },
        )

        return record
      },
      [],
    )

  const createPlanning =
    useCallback(
      async (
        input:
          CreateAgendaPlanningInput,
      ): Promise<
        AgendaPlanning
      > => {
        setMutating(true)
        setError(null)

        try {
          const response =
            await fetch(
              '/api/agenda/planning',
              {
                method:
                  'POST',

                headers: {
                  'Content-Type':
                    'application/json',
                },

                credentials:
                  'include',

                body:
                  JSON.stringify(
                    createPlanningPayload(
                      {
                        ...input,

                        status:
                          input.status ??
                          'rascunho',
                      },
                    ),
                  ),
              },
            )

          const result =
            await readPlanningResponse(
              response,
            )

          const createdPlanning =
            requirePlanningRecord(
              response,
              result,
              'Não foi possível criar o planejamento.',
            )

          setPlanning(
            (
              currentPlanning,
            ) => [
              createdPlanning,
              ...currentPlanning,
            ],
          )

          return createdPlanning
        } catch (
          createError
        ) {
          const message =
            createError instanceof
            Error
              ? createError.message
              : 'Erro inesperado ao criar planejamento.'

          setError(
            message,
          )

          throw createError
        } finally {
          setMutating(false)
        }
      },
      [],
    )

  const updatePlanning =
    useCallback(
      async (
        id: string,

        input:
          UpdateAgendaPlanningInput,
      ): Promise<
        AgendaPlanning
      > => {
        setMutating(true)
        setError(null)

        try {
          const response =
            await fetch(
              `/api/agenda/planning/${encodeURIComponent(id)}`,
              {
                method:
                  'PATCH',

                headers: {
                  'Content-Type':
                    'application/json',
                },

                credentials:
                  'include',

                body:
                  JSON.stringify(
                    createPlanningPayload(
                      input,
                    ),
                  ),
              },
            )

          const result =
            await readPlanningResponse(
              response,
            )

          const updatedPlanning =
            requirePlanningRecord(
              response,
              result,
              'Não foi possível atualizar o planejamento.',
            )

          setPlanning(
            (
              currentPlanning,
            ) =>
              currentPlanning
                .map(
                  (
                    currentRecord,
                  ) =>
                    currentRecord.id ===
                    updatedPlanning.id
                      ? updatedPlanning
                      : currentRecord,
                ),
          )

          return updatedPlanning
        } catch (
          updateError
        ) {
          const message =
            updateError instanceof
            Error
              ? updateError.message
              : 'Erro inesperado ao atualizar planejamento.'

          setError(
            message,
          )

          throw updateError
        } finally {
          setMutating(false)
        }
      },
      [],
    )

  const archivePlanning =
    useCallback(
      async (
        id: string,
        reason: string,
      ): Promise<
        AgendaPlanning
      > => {
        const normalizedReason =
          reason.trim()

        if (
          !normalizedReason
        ) {
          throw new Error(
            'Motivo do arquivamento é obrigatório.',
          )
        }

        return updatePlanning(
          id,
          {
            status:
              'arquivado',

            status_change_reason:
              normalizedReason,

            archive_reason:
              normalizedReason,
          },
        )
      },
      [
        updatePlanning,
      ],
    )

  const deletePlanning =
    useCallback(
      async (
        id: string,
        reason: string,
      ): Promise<
        AgendaPlanning
      > => {
        const normalizedReason =
          reason.trim()

        if (
          !normalizedReason
        ) {
          throw new Error(
            'Motivo da exclusão é obrigatório.',
          )
        }

        setMutating(true)
        setError(null)

        try {
          const response =
            await fetch(
              `/api/agenda/planning/${encodeURIComponent(id)}`,
              {
                method:
                  'DELETE',

                headers: {
                  'Content-Type':
                    'application/json',
                },

                credentials:
                  'include',

                body:
                  JSON.stringify({
                    reason:
                      normalizedReason,
                  }),
              },
            )

          const result =
            await readPlanningResponse(
              response,
            )

          const deletedPlanning =
            requirePlanningRecord(
              response,
              result,
              'Não foi possível excluir o planejamento.',
            )

          setPlanning(
            (
              currentPlanning,
            ) =>
              currentPlanning
                .filter(
                  (
                    currentRecord,
                  ) =>
                    currentRecord.id !==
                    deletedPlanning.id,
                ),
          )

          return deletedPlanning
        } catch (
          deleteError
        ) {
          const message =
            deleteError instanceof
            Error
              ? deleteError.message
              : 'Erro inesperado ao excluir planejamento.'

          setError(
            message,
          )

          throw deleteError
        } finally {
          setMutating(false)
        }
      },
      [],
    )

  useEffect(() => {
    void loadPlanning()
  }, [
    loadPlanning,
  ])

  return {
    planning,

    loading,
    mutating,
    error,

    reload:
      loadPlanning,

    clearError,

    getPlanning,
    createPlanning,
    updatePlanning,
    archivePlanning,
    deletePlanning,
  }
}