'use client'

import {
  useCallback,
  useEffect,
  useState,
} from 'react'

import type {
  AgendaObjective,
  AgendaObjectiveCategory,
  AgendaObjectiveQueryOptions,
  AgendaObjectiveStatus,
} from '@/lib/agenda/repository/objectives.repository'

import type {
  CreateAgendaObjectiveServiceInput,
  UpdateAgendaObjectiveServiceInput,
} from '@/lib/agenda/services/objectives.service'

type ObjectivesResponse = {
  success: boolean

  total?: number

  data?:
    | AgendaObjective[]
    | AgendaObjective

  error?: string
  message?: string
}

type ObjectivePayload =
  Record<string, unknown>

export type ObjectiveFilters = {
  status?: AgendaObjectiveStatus | null
  category?: AgendaObjectiveCategory | null

  classId?: string | null
  schoolYearId?: string | null
  academicPeriodId?: string | null

  responsibleUserId?: string | null

  subject?: string | null
  period?: string | null
  search?: string | null
}

function assignIfDefined(
  payload: ObjectivePayload,
  key: string,
  value: unknown,
): void {
  if (value !== undefined) {
    payload[key] = value
  }
}

function createObjectivePayload(
  input:
    | CreateAgendaObjectiveServiceInput
    | UpdateAgendaObjectiveServiceInput,
): ObjectivePayload {
  const payload:
    ObjectivePayload = {}

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
    'category',
    input.category,
  )

  assignIfDefined(
    payload,
    'period',
    input.period,
  )

  assignIfDefined(
    payload,
    'classId',
    input.class_id,
  )

  assignIfDefined(
    payload,
    'subject',
    input.subject,
  )

  assignIfDefined(
    payload,
    'responsibleUserId',
    input.responsible_user_id,
  )

  assignIfDefined(
    payload,
    'expectedIndicator',
    input.expected_indicator,
  )

  assignIfDefined(
    payload,
    'expectedEvidence',
    input.expected_evidence,
  )

  assignIfDefined(
    payload,
    'startDate',
    input.start_date,
  )

  assignIfDefined(
    payload,
    'endDate',
    input.end_date,
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
    'status',
    input.status,
  )

  assignIfDefined(
    payload,
    'progress',
    input.progress,
  )

  assignIfDefined(
    payload,
    'schoolId',
    input.school_id,
  )

  assignIfDefined(
    payload,
    'metadata',
    input.metadata,
  )

  return payload
}

function createQueryString(
  filters: ObjectiveFilters,
): string {
  const parameters =
    new URLSearchParams()

  function addParameter(
    key: string,
    value: string | null | undefined,
  ): void {
    const normalizedValue =
      value?.trim()

    if (normalizedValue) {
      parameters.set(
        key,
        normalizedValue,
      )
    }
  }

  addParameter(
    'status',
    filters.status,
  )

  addParameter(
    'category',
    filters.category,
  )

  addParameter(
    'classId',
    filters.classId,
  )

  addParameter(
    'schoolYearId',
    filters.schoolYearId,
  )

  addParameter(
    'academicPeriodId',
    filters.academicPeriodId,
  )

  addParameter(
    'responsibleUserId',
    filters.responsibleUserId,
  )

  addParameter(
    'subject',
    filters.subject,
  )

  addParameter(
    'period',
    filters.period,
  )

  addParameter(
    'search',
    filters.search,
  )

  const query =
    parameters.toString()

  return query
    ? `?${query}`
    : ''
}

async function readObjectivesResponse(
  response: Response,
): Promise<ObjectivesResponse> {
  try {
    return await response
      .json() as ObjectivesResponse
  } catch {
    return {
      success: false,

      error:
        'A resposta do servidor possui formato inválido.',
    }
  }
}

function requireObjectiveRecord(
  response: Response,
  result: ObjectivesResponse,
  fallbackMessage: string,
): AgendaObjective {
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

function requireObjectiveList(
  response: Response,
  result: ObjectivesResponse,
  fallbackMessage: string,
): AgendaObjective[] {
  if (
    !response.ok ||
    !result.success ||
    !Array.isArray(
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

function requireSuccessfulResponse(
  response: Response,
  result: ObjectivesResponse,
  fallbackMessage: string,
): void {
  if (
    !response.ok ||
    !result.success
  ) {
    throw new Error(
      result.error ??
        fallbackMessage,
    )
  }
}

function addOrReplaceObjective(
  currentObjectives:
    AgendaObjective[],

  objective:
    AgendaObjective,
): AgendaObjective[] {
  const exists =
    currentObjectives.some(
      currentObjective =>
        currentObjective.id ===
        objective.id,
    )

  if (!exists) {
    return [
      objective,
      ...currentObjectives,
    ]
  }

  return currentObjectives.map(
    currentObjective =>
      currentObjective.id ===
      objective.id
        ? objective
        : currentObjective,
  )
}

function removeObjectiveById(
  currentObjectives:
    AgendaObjective[],

  objectiveId: string,
): AgendaObjective[] {
  return currentObjectives.filter(
    objective =>
      objective.id !==
      objectiveId,
  )
}

function getErrorMessage(
  error: unknown,
  fallbackMessage: string,
): string {
  return error instanceof Error
    ? error.message
    : fallbackMessage
}

export function useObjectives(
  initialFilters:
    ObjectiveFilters = {},
) {
  const [
    objectives,
    setObjectives,
  ] = useState<
    AgendaObjective[]
  >([])

  const [
    filters,
    setFilters,
  ] = useState<
    ObjectiveFilters
  >(initialFilters)

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

  const loadObjectives =
    useCallback(
      async (
        requestedFilters:
          ObjectiveFilters =
          filters,
      ): Promise<
        AgendaObjective[]
      > => {
        setLoading(true)
        setError(null)

        try {
          const response =
            await fetch(
              `/api/agenda/objectives${createQueryString(requestedFilters)}`,
              {
                method:
                  'GET',

                credentials:
                  'include',

                cache:
                  'no-store',
              },
            )

          const result =
            await readObjectivesResponse(
              response,
            )

          const records =
            requireObjectiveList(
              response,
              result,
              'Não foi possível carregar os objetivos.',
            )

          setObjectives(
            records,
          )

          return records
        } catch (
          loadError
        ) {
          const message =
            getErrorMessage(
              loadError,
              'Erro inesperado ao carregar objetivos.',
            )

          setError(
            message,
          )

          throw loadError
        } finally {
          setLoading(false)
        }
      },
      [
        filters,
      ],
    )

  const getObjective =
    useCallback(
      async (
        id: string,
      ): Promise<
        AgendaObjective
      > => {
        setError(null)

        try {
          const response =
            await fetch(
              `/api/agenda/objectives/${encodeURIComponent(id)}`,
              {
                method:
                  'GET',

                credentials:
                  'include',

                cache:
                  'no-store',
              },
            )

          const result =
            await readObjectivesResponse(
              response,
            )

          const objective =
            requireObjectiveRecord(
              response,
              result,
              'Não foi possível carregar o objetivo.',
            )

          setObjectives(
            currentObjectives =>
              addOrReplaceObjective(
                currentObjectives,
                objective,
              ),
          )

          return objective
        } catch (
          getError
        ) {
          const message =
            getErrorMessage(
              getError,
              'Erro inesperado ao carregar o objetivo.',
            )

          setError(
            message,
          )

          throw getError
        }
      },
      [],
    )

  const createObjective =
    useCallback(
      async (
        input:
          CreateAgendaObjectiveServiceInput,
      ): Promise<
        AgendaObjective
      > => {
        setMutating(true)
        setError(null)

        try {
          const response =
            await fetch(
              '/api/agenda/objectives',
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
                    createObjectivePayload({
                      ...input,

                      status:
                        input.status ??
                        'rascunho',

                      progress:
                        input.progress ??
                        0,
                    }),
                  ),
              },
            )

          const result =
            await readObjectivesResponse(
              response,
            )

          const objective =
            requireObjectiveRecord(
              response,
              result,
              'Não foi possível criar o objetivo.',
            )

          setObjectives(
            currentObjectives =>
              addOrReplaceObjective(
                currentObjectives,
                objective,
              ),
          )

          return objective
        } catch (
          createError
        ) {
          const message =
            getErrorMessage(
              createError,
              'Erro inesperado ao criar objetivo.',
            )

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

  const updateObjective =
    useCallback(
      async (
        id: string,

        input:
          UpdateAgendaObjectiveServiceInput,
      ): Promise<
        AgendaObjective
      > => {
        setMutating(true)
        setError(null)

        try {
          const response =
            await fetch(
              `/api/agenda/objectives/${encodeURIComponent(id)}`,
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
                    createObjectivePayload(
                      input,
                    ),
                  ),
              },
            )

          const result =
            await readObjectivesResponse(
              response,
            )

          const objective =
            requireObjectiveRecord(
              response,
              result,
              'Não foi possível atualizar o objetivo.',
            )

          setObjectives(
            currentObjectives =>
              addOrReplaceObjective(
                currentObjectives,
                objective,
              ),
          )

          return objective
        } catch (
          updateError
        ) {
          const message =
            getErrorMessage(
              updateError,
              'Erro inesperado ao atualizar objetivo.',
            )

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

  const deleteObjective =
    useCallback(
      async (
        id: string,
        reason: string,
      ): Promise<void> => {
        setMutating(true)
        setError(null)

        try {
          const response =
            await fetch(
              `/api/agenda/objectives/${encodeURIComponent(id)}`,
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
                    reason,
                  }),
              },
            )

          const result =
            await readObjectivesResponse(
              response,
            )

          requireSuccessfulResponse(
            response,
            result,
            'Não foi possível excluir o objetivo.',
          )

          setObjectives(
            currentObjectives =>
              removeObjectiveById(
                currentObjectives,
                id,
              ),
          )
        } catch (
          deleteError
        ) {
          const message =
            getErrorMessage(
              deleteError,
              'Erro inesperado ao excluir objetivo.',
            )

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

  const updateProgress =
    useCallback(
      async (
        id: string,
        progress: number,
      ): Promise<
        AgendaObjective
      > => {
        return updateObjective(
          id,
          {
            progress,
          },
        )
      },
      [
        updateObjective,
      ],
    )

  const changeStatus =
    useCallback(
      async (
        id: string,
        status:
          AgendaObjectiveStatus,
      ): Promise<
        AgendaObjective
      > => {
        return updateObjective(
          id,
          {
            status,
          },
        )
      },
      [
        updateObjective,
      ],
    )

  const updateFilters =
    useCallback(
      (
        nextFilters:
          ObjectiveFilters,
      ) => {
        setFilters(
          nextFilters,
        )
      },
      [],
    )

  useEffect(() => {
    void loadObjectives()
  }, [
    loadObjectives,
  ])

  return {
    objectives,
    setObjectives,

    filters,
    setFilters:
      updateFilters,

    loading,
    mutating,
    error,

    clearError,

    loadObjectives,
    getObjective,
    createObjective,
    updateObjective,
    deleteObjective,

    updateProgress,
    changeStatus,
  }
}
