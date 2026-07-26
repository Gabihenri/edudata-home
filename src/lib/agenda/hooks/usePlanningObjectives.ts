'use client'

import {
  useCallback,
  useEffect,
  useState,
} from 'react'

import type {
  AgendaPlanningObjective,
  AgendaPlanningObjectiveMetadata,
  AgendaPlanningObjectiveRole,
  AgendaPlanningObjectiveWithObjective,
} from '@/lib/agenda/repository/planning-objectives.repository'

import type {
  PlanningObjectiveSelection,
  UpdatePlanningObjectiveLinkInput,
} from '@/lib/agenda/services/planning-objectives.service'

type PlanningObjectivesResponse = {
  success: boolean

  total?: number

  data?:
    | AgendaPlanningObjective
    | AgendaPlanningObjective[]
    | AgendaPlanningObjectiveWithObjective[]

  error?: string
  message?: string
}

type PlanningObjectivePayload =
  Record<string, unknown>

export type LinkObjectiveToPlanningInput = {
  objectiveId: string

  role?:
    AgendaPlanningObjectiveRole

  sequence?: number

  organizationId?: string | null
  schoolId?: string | null

  metadata?:
    AgendaPlanningObjectiveMetadata
}

export type SynchronizePlanningObjectivesPayload = {
  objectives:
    PlanningObjectiveSelection[]

  organizationId?: string | null
  schoolId?: string | null
}

function assignIfDefined(
  payload:
    PlanningObjectivePayload,

  key: string,
  value: unknown,
): void {
  if (
    value !==
    undefined
  ) {
    payload[key] =
      value
  }
}

function createLinkPayload(
  input:
    LinkObjectiveToPlanningInput,
): PlanningObjectivePayload {
  const payload:
    PlanningObjectivePayload = {}

  assignIfDefined(
    payload,
    'objectiveId',
    input.objectiveId,
  )

  assignIfDefined(
    payload,
    'role',
    input.role,
  )

  assignIfDefined(
    payload,
    'sequence',
    input.sequence,
  )

  assignIfDefined(
    payload,
    'organizationId',
    input.organizationId,
  )

  assignIfDefined(
    payload,
    'schoolId',
    input.schoolId,
  )

  assignIfDefined(
    payload,
    'metadata',
    input.metadata,
  )

  return payload
}

function createUpdatePayload(
  input:
    UpdatePlanningObjectiveLinkInput,
): PlanningObjectivePayload {
  const payload:
    PlanningObjectivePayload = {}

  assignIfDefined(
    payload,
    'role',
    input.role,
  )

  assignIfDefined(
    payload,
    'sequence',
    input.sequence,
  )

  assignIfDefined(
    payload,
    'organizationId',
    input.organizationId,
  )

  assignIfDefined(
    payload,
    'schoolId',
    input.schoolId,
  )

  assignIfDefined(
    payload,
    'metadata',
    input.metadata,
  )

  return payload
}

function createSynchronizePayload(
  input:
    SynchronizePlanningObjectivesPayload,
): PlanningObjectivePayload {
  const payload:
    PlanningObjectivePayload = {
      objectives:
        input.objectives.map(
          (
            selection,
            index,
          ) => ({
            objectiveId:
              selection.objectiveId,

            role:
              selection.role ??
              'supporting',

            sequence:
              selection.sequence ??
              index + 1,

            metadata:
              selection.metadata ??
              {},
          }),
        ),
  }

  assignIfDefined(
    payload,
    'organizationId',
    input.organizationId,
  )

  assignIfDefined(
    payload,
    'schoolId',
    input.schoolId,
  )

  return payload
}

async function readPlanningObjectivesResponse(
  response: Response,
): Promise<
  PlanningObjectivesResponse
> {
  try {
    return await response
      .json() as
      PlanningObjectivesResponse
  } catch {
    return {
      success:
        false,

      error:
        'A resposta do servidor possui formato inválido.',
    }
  }
}

function requirePlanningObjectiveRecord(
  response: Response,

  result:
    PlanningObjectivesResponse,

  fallbackMessage: string,
): AgendaPlanningObjective {
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

function requirePlanningObjectiveList(
  response: Response,

  result:
    PlanningObjectivesResponse,

  fallbackMessage: string,
): AgendaPlanningObjectiveWithObjective[] {
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

  return result.data as
    AgendaPlanningObjectiveWithObjective[]
}

function requireSuccessfulResponse(
  response: Response,

  result:
    PlanningObjectivesResponse,

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

function addOrReplaceRelationship(
  currentRelationships:
    AgendaPlanningObjectiveWithObjective[],

  relationship:
    AgendaPlanningObjective,
): AgendaPlanningObjectiveWithObjective[] {
  const exists =
    currentRelationships.some(
      currentRelationship =>
        currentRelationship.id ===
        relationship.id,
    )

  const normalizedRelationship:
    AgendaPlanningObjectiveWithObjective = {
      ...relationship,

      objective:
        currentRelationships.find(
          currentRelationship =>
            currentRelationship.objective_id ===
            relationship.objective_id,
        )?.objective ??
        null,
    }

  if (!exists) {
    return [
      ...currentRelationships,
      normalizedRelationship,
    ].sort(
      (
        firstRelationship,
        secondRelationship,
      ) =>
        firstRelationship.sequence -
        secondRelationship.sequence,
    )
  }

  return currentRelationships
    .map(
      currentRelationship =>
        currentRelationship.id ===
        relationship.id
          ? {
              ...normalizedRelationship,

              objective:
                currentRelationship
                  .objective,
            }
          : currentRelationship,
    )
    .sort(
      (
        firstRelationship,
        secondRelationship,
      ) =>
        firstRelationship.sequence -
        secondRelationship.sequence,
    )
}

function removeRelationshipById(
  currentRelationships:
    AgendaPlanningObjectiveWithObjective[],

  relationshipId: string,
): AgendaPlanningObjectiveWithObjective[] {
  return currentRelationships
    .filter(
      relationship =>
        relationship.id !==
        relationshipId,
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

export function usePlanningObjectives(
  planningId:
    string | null | undefined,

  options: {
    autoLoad?: boolean
  } = {},
) {
  const autoLoad =
    options.autoLoad ??
    true

  const [
    relationships,
    setRelationships,
  ] = useState<
    AgendaPlanningObjectiveWithObjective[]
  >([])

  const [
    loading,
    setLoading,
  ] = useState(
    Boolean(
      planningId &&
      autoLoad,
    ),
  )

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

  const requirePlanningId =
    useCallback((): string => {
      const normalizedPlanningId =
        planningId?.trim()

      if (!normalizedPlanningId) {
        throw new Error(
          'ID do planejamento não informado.',
        )
      }

      return normalizedPlanningId
    }, [
      planningId,
    ])

  const loadRelationships =
    useCallback(
      async (): Promise<
        AgendaPlanningObjectiveWithObjective[]
      > => {
        const normalizedPlanningId =
          requirePlanningId()

        setLoading(true)
        setError(null)

        try {
          const response =
            await fetch(
              `/api/agenda/planning/${encodeURIComponent(normalizedPlanningId)}/objectives`,
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
            await readPlanningObjectivesResponse(
              response,
            )

          const records =
            requirePlanningObjectiveList(
              response,
              result,
              'Não foi possível carregar os objetivos do planejamento.',
            )

          setRelationships(
            records,
          )

          return records
        } catch (
          loadError
        ) {
          const message =
            getErrorMessage(
              loadError,
              'Erro inesperado ao carregar os objetivos do planejamento.',
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
        requirePlanningId,
      ],
    )

  const getRelationship =
    useCallback(
      async (
        relationshipId: string,
      ): Promise<
        AgendaPlanningObjective
      > => {
        const normalizedPlanningId =
          requirePlanningId()

        setError(null)

        try {
          const response =
            await fetch(
              `/api/agenda/planning/${encodeURIComponent(normalizedPlanningId)}/objectives/${encodeURIComponent(relationshipId)}`,
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
            await readPlanningObjectivesResponse(
              response,
            )

          const relationship =
            requirePlanningObjectiveRecord(
              response,
              result,
              'Não foi possível carregar o vínculo com o objetivo.',
            )

          setRelationships(
            currentRelationships =>
              addOrReplaceRelationship(
                currentRelationships,
                relationship,
              ),
          )

          return relationship
        } catch (
          getError
        ) {
          const message =
            getErrorMessage(
              getError,
              'Erro inesperado ao carregar o vínculo com o objetivo.',
            )

          setError(
            message,
          )

          throw getError
        }
      },
      [
        requirePlanningId,
      ],
    )

  const linkObjective =
    useCallback(
      async (
        input:
          LinkObjectiveToPlanningInput,
      ): Promise<
        AgendaPlanningObjective
      > => {
        const normalizedPlanningId =
          requirePlanningId()

        setMutating(true)
        setError(null)

        try {
          const response =
            await fetch(
              `/api/agenda/planning/${encodeURIComponent(normalizedPlanningId)}/objectives`,
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
                    createLinkPayload(
                      input,
                    ),
                  ),
              },
            )

          const result =
            await readPlanningObjectivesResponse(
              response,
            )

          const relationship =
            requirePlanningObjectiveRecord(
              response,
              result,
              'Não foi possível vincular o objetivo ao planejamento.',
            )

          await loadRelationships()

          return relationship
        } catch (
          linkError
        ) {
          const message =
            getErrorMessage(
              linkError,
              'Erro inesperado ao vincular o objetivo ao planejamento.',
            )

          setError(
            message,
          )

          throw linkError
        } finally {
          setMutating(false)
        }
      },
      [
        loadRelationships,
        requirePlanningId,
      ],
    )

  const synchronizeObjectives =
    useCallback(
      async (
        input:
          SynchronizePlanningObjectivesPayload,
      ): Promise<
        AgendaPlanningObjectiveWithObjective[]
      > => {
        const normalizedPlanningId =
          requirePlanningId()

        setMutating(true)
        setError(null)

        try {
          const response =
            await fetch(
              `/api/agenda/planning/${encodeURIComponent(normalizedPlanningId)}/objectives`,
              {
                method:
                  'PUT',

                headers: {
                  'Content-Type':
                    'application/json',
                },

                credentials:
                  'include',

                body:
                  JSON.stringify(
                    createSynchronizePayload(
                      input,
                    ),
                  ),
              },
            )

          const result =
            await readPlanningObjectivesResponse(
              response,
            )

          requirePlanningObjectiveList(
            response,
            result,
            'Não foi possível sincronizar os objetivos do planejamento.',
          )

          return await loadRelationships()
        } catch (
          synchronizeError
        ) {
          const message =
            getErrorMessage(
              synchronizeError,
              'Erro inesperado ao sincronizar os objetivos do planejamento.',
            )

          setError(
            message,
          )

          throw synchronizeError
        } finally {
          setMutating(false)
        }
      },
      [
        loadRelationships,
        requirePlanningId,
      ],
    )

  const updateRelationship =
    useCallback(
      async (
        relationshipId: string,

        input:
          UpdatePlanningObjectiveLinkInput,
      ): Promise<
        AgendaPlanningObjective
      > => {
        const normalizedPlanningId =
          requirePlanningId()

        setMutating(true)
        setError(null)

        try {
          const response =
            await fetch(
              `/api/agenda/planning/${encodeURIComponent(normalizedPlanningId)}/objectives/${encodeURIComponent(relationshipId)}`,
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
                    createUpdatePayload(
                      input,
                    ),
                  ),
              },
            )

          const result =
            await readPlanningObjectivesResponse(
              response,
            )

          const relationship =
            requirePlanningObjectiveRecord(
              response,
              result,
              'Não foi possível atualizar o vínculo com o objetivo.',
            )

          setRelationships(
            currentRelationships =>
              addOrReplaceRelationship(
                currentRelationships,
                relationship,
              ),
          )

          return relationship
        } catch (
          updateError
        ) {
          const message =
            getErrorMessage(
              updateError,
              'Erro inesperado ao atualizar o vínculo com o objetivo.',
            )

          setError(
            message,
          )

          throw updateError
        } finally {
          setMutating(false)
        }
      },
      [
        requirePlanningId,
      ],
    )

  const removeRelationship =
    useCallback(
      async (
        relationshipId: string,
        reason: string,
      ): Promise<void> => {
        const normalizedPlanningId =
          requirePlanningId()

        setMutating(true)
        setError(null)

        try {
          const response =
            await fetch(
              `/api/agenda/planning/${encodeURIComponent(normalizedPlanningId)}/objectives/${encodeURIComponent(relationshipId)}`,
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
            await readPlanningObjectivesResponse(
              response,
            )

          requireSuccessfulResponse(
            response,
            result,
            'Não foi possível remover o objetivo do planejamento.',
          )

          setRelationships(
            currentRelationships =>
              removeRelationshipById(
                currentRelationships,
                relationshipId,
              ),
          )
        } catch (
          removeError
        ) {
          const message =
            getErrorMessage(
              removeError,
              'Erro inesperado ao remover o objetivo do planejamento.',
            )

          setError(
            message,
          )

          throw removeError
        } finally {
          setMutating(false)
        }
      },
      [
        requirePlanningId,
      ],
    )

  const removeAllRelationships =
    useCallback(
      async (
        reason: string,
      ): Promise<void> => {
        const normalizedPlanningId =
          requirePlanningId()

        setMutating(true)
        setError(null)

        try {
          const response =
            await fetch(
              `/api/agenda/planning/${encodeURIComponent(normalizedPlanningId)}/objectives`,
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
            await readPlanningObjectivesResponse(
              response,
            )

          requireSuccessfulResponse(
            response,
            result,
            'Não foi possível remover os objetivos do planejamento.',
          )

          setRelationships([])
        } catch (
          removeError
        ) {
          const message =
            getErrorMessage(
              removeError,
              'Erro inesperado ao remover os objetivos do planejamento.',
            )

          setError(
            message,
          )

          throw removeError
        } finally {
          setMutating(false)
        }
      },
      [
        requirePlanningId,
      ],
    )

  const setPrimaryObjective =
    useCallback(
      async (
        relationshipId: string,
      ): Promise<void> => {
        setMutating(true)
        setError(null)

        try {
          const currentPrimary =
            relationships.find(
              relationship =>
                relationship
                  .relationship_role ===
                'primary' &&
                relationship.id !==
                relationshipId,
            )

          if (currentPrimary) {
            await updateRelationship(
              currentPrimary.id,
              {
                role:
                  'supporting',
              },
            )
          }

          await updateRelationship(
            relationshipId,
            {
              role:
                'primary',
            },
          )
        } catch (
          primaryError
        ) {
          const message =
            getErrorMessage(
              primaryError,
              'Erro inesperado ao definir o objetivo principal.',
            )

          setError(
            message,
          )

          throw primaryError
        } finally {
          setMutating(false)
        }
      },
      [
        relationships,
        updateRelationship,
      ],
    )

  const setSupportingObjective =
    useCallback(
      async (
        relationshipId: string,
      ): Promise<
        AgendaPlanningObjective
      > => {
        return updateRelationship(
          relationshipId,
          {
            role:
              'supporting',
          },
        )
      },
      [
        updateRelationship,
      ],
    )

  const reorderRelationships =
    useCallback(
      async (
        orderedRelationshipIds:
          string[],
      ): Promise<void> => {
        setMutating(true)
        setError(null)

        try {
          for (
            let index = 0;
            index <
            orderedRelationshipIds.length;
            index += 1
          ) {
            const relationshipId =
              orderedRelationshipIds[
                index
              ]

            if (!relationshipId) {
              continue
            }

            await updateRelationship(
              relationshipId,
              {
                sequence:
                  index + 1,
              },
            )
          }

          await loadRelationships()
        } catch (
          reorderError
        ) {
          const message =
            getErrorMessage(
              reorderError,
              'Erro inesperado ao ordenar os objetivos do planejamento.',
            )

          setError(
            message,
          )

          throw reorderError
        } finally {
          setMutating(false)
        }
      },
      [
        loadRelationships,
        updateRelationship,
      ],
    )

  useEffect(() => {
    if (
      !planningId?.trim() ||
      !autoLoad
    ) {
      setRelationships([])
      setLoading(false)

      return
    }

    void loadRelationships()
  }, [
    planningId,
    autoLoad,
    loadRelationships,
  ])

  return {
    relationships,
    setRelationships,

    objectives:
      relationships
        .map(
          relationship =>
            relationship.objective,
        )
        .filter(
          objective =>
            objective !== null,
        ),

    primaryRelationship:
      relationships.find(
        relationship =>
          relationship
            .relationship_role ===
          'primary',
      ) ??
      null,

    supportingRelationships:
      relationships.filter(
        relationship =>
          relationship
            .relationship_role ===
          'supporting',
      ),

    loading,
    mutating,
    error,

    clearError,

    loadRelationships,
    getRelationship,

    linkObjective,
    synchronizeObjectives,

    updateRelationship,

    setPrimaryObjective,
    setSupportingObjective,

    reorderRelationships,

    removeRelationship,
    removeAllRelationships,
  }
}