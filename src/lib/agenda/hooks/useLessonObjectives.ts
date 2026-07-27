'use client'

import {
  useCallback,
  useEffect,
  useState,
} from 'react'

import type {
  AgendaLessonObjective,
  AgendaLessonObjectiveMetadata,
  AgendaLessonObjectiveRole,
  AgendaLessonObjectiveWithObjective,
} from '@/lib/agenda/repository/lesson-objectives.repository'

import type {
  LessonObjectiveSelection,
  UpdateLessonObjectiveLinkInput,
} from '@/lib/agenda/services/lesson-objectives.service'

type LessonObjectivesResponse = {
  success: boolean

  total?: number

  data?:
    | AgendaLessonObjective
    | AgendaLessonObjective[]
    | AgendaLessonObjectiveWithObjective[]

  error?: string
  message?: string
}

type LessonObjectivePayload =
  Record<string, unknown>

export type LinkObjectiveToLessonInput = {
  objectiveId: string

  role?:
    AgendaLessonObjectiveRole

  sequence?: number

  organizationId?: string | null
  schoolId?: string | null

  metadata?:
    AgendaLessonObjectiveMetadata
}

export type SynchronizeLessonObjectivesPayload = {
  objectives:
    LessonObjectiveSelection[]

  organizationId?: string | null
  schoolId?: string | null
}

function assignIfDefined(
  payload:
    LessonObjectivePayload,

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
    LinkObjectiveToLessonInput,
): LessonObjectivePayload {
  const payload:
    LessonObjectivePayload = {}

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
    UpdateLessonObjectiveLinkInput,
): LessonObjectivePayload {
  const payload:
    LessonObjectivePayload = {}

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
    SynchronizeLessonObjectivesPayload,
): LessonObjectivePayload {
  const payload:
    LessonObjectivePayload = {
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

async function readLessonObjectivesResponse(
  response: Response,
): Promise<
  LessonObjectivesResponse
> {
  try {
    return await response
      .json() as
      LessonObjectivesResponse
  } catch {
    return {
      success:
        false,

      error:
        'A resposta do servidor possui formato inválido.',
    }
  }
}

function requireLessonObjectiveRecord(
  response: Response,

  result:
    LessonObjectivesResponse,

  fallbackMessage: string,
): AgendaLessonObjective {
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

function requireLessonObjectiveList(
  response: Response,

  result:
    LessonObjectivesResponse,

  fallbackMessage: string,
): AgendaLessonObjectiveWithObjective[] {
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
    AgendaLessonObjectiveWithObjective[]
}

function requireSuccessfulResponse(
  response: Response,

  result:
    LessonObjectivesResponse,

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
    AgendaLessonObjectiveWithObjective[],

  relationship:
    AgendaLessonObjective,
): AgendaLessonObjectiveWithObjective[] {
  const existingRelationship =
    currentRelationships.find(
      currentRelationship =>
        currentRelationship.id ===
        relationship.id,
    )

  const existingObjective =
    currentRelationships.find(
      currentRelationship =>
        currentRelationship.objective_id ===
        relationship.objective_id,
    )?.objective ??
    null

  const normalizedRelationship:
    AgendaLessonObjectiveWithObjective = {
      ...relationship,

      objective:
        existingRelationship
          ?.objective ??
        existingObjective,
    }

  const nextRelationships =
    existingRelationship
      ? currentRelationships.map(
          currentRelationship =>
            currentRelationship.id ===
            relationship.id
              ? normalizedRelationship
              : currentRelationship,
        )
      : [
          ...currentRelationships,
          normalizedRelationship,
        ]

  return nextRelationships.sort(
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
    AgendaLessonObjectiveWithObjective[],

  relationshipId: string,
): AgendaLessonObjectiveWithObjective[] {
  return currentRelationships.filter(
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

export function useLessonObjectives(
  lessonId:
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
    AgendaLessonObjectiveWithObjective[]
  >([])

  const [
    loading,
    setLoading,
  ] = useState(
    Boolean(
      lessonId &&
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

  const requireLessonId =
    useCallback((): string => {
      const normalizedLessonId =
        lessonId?.trim()

      if (!normalizedLessonId) {
        throw new Error(
          'ID da aula não informado.',
        )
      }

      return normalizedLessonId
    }, [
      lessonId,
    ])

  const loadRelationships =
    useCallback(
      async (): Promise<
        AgendaLessonObjectiveWithObjective[]
      > => {
        const normalizedLessonId =
          requireLessonId()

        setLoading(true)
        setError(null)

        try {
          const response =
            await fetch(
              `/api/agenda/lessons/${encodeURIComponent(normalizedLessonId)}/objectives`,
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
            await readLessonObjectivesResponse(
              response,
            )

          const records =
            requireLessonObjectiveList(
              response,
              result,
              'Não foi possível carregar os objetivos da aula.',
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
              'Erro inesperado ao carregar os objetivos da aula.',
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
        requireLessonId,
      ],
    )

  const getRelationship =
    useCallback(
      async (
        relationshipId: string,
      ): Promise<
        AgendaLessonObjective
      > => {
        const normalizedLessonId =
          requireLessonId()

        setError(null)

        try {
          const response =
            await fetch(
              `/api/agenda/lessons/${encodeURIComponent(normalizedLessonId)}/objectives/${encodeURIComponent(relationshipId)}`,
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
            await readLessonObjectivesResponse(
              response,
            )

          const relationship =
            requireLessonObjectiveRecord(
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
        requireLessonId,
      ],
    )

  const linkObjective =
    useCallback(
      async (
        input:
          LinkObjectiveToLessonInput,
      ): Promise<
        AgendaLessonObjective
      > => {
        const normalizedLessonId =
          requireLessonId()

        setMutating(true)
        setError(null)

        try {
          const response =
            await fetch(
              `/api/agenda/lessons/${encodeURIComponent(normalizedLessonId)}/objectives`,
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
            await readLessonObjectivesResponse(
              response,
            )

          const relationship =
            requireLessonObjectiveRecord(
              response,
              result,
              'Não foi possível vincular o objetivo à aula.',
            )

          await loadRelationships()

          return relationship
        } catch (
          linkError
        ) {
          const message =
            getErrorMessage(
              linkError,
              'Erro inesperado ao vincular o objetivo à aula.',
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
        requireLessonId,
      ],
    )

  const synchronizeObjectives =
    useCallback(
      async (
        input:
          SynchronizeLessonObjectivesPayload,
      ): Promise<
        AgendaLessonObjectiveWithObjective[]
      > => {
        const normalizedLessonId =
          requireLessonId()

        setMutating(true)
        setError(null)

        try {
          const response =
            await fetch(
              `/api/agenda/lessons/${encodeURIComponent(normalizedLessonId)}/objectives`,
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
            await readLessonObjectivesResponse(
              response,
            )

          requireLessonObjectiveList(
            response,
            result,
            'Não foi possível sincronizar os objetivos da aula.',
          )

          return await loadRelationships()
        } catch (
          synchronizeError
        ) {
          const message =
            getErrorMessage(
              synchronizeError,
              'Erro inesperado ao sincronizar os objetivos da aula.',
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
        requireLessonId,
      ],
    )

  const updateRelationship =
    useCallback(
      async (
        relationshipId: string,

        input:
          UpdateLessonObjectiveLinkInput,
      ): Promise<
        AgendaLessonObjective
      > => {
        const normalizedLessonId =
          requireLessonId()

        setMutating(true)
        setError(null)

        try {
          const response =
            await fetch(
              `/api/agenda/lessons/${encodeURIComponent(normalizedLessonId)}/objectives/${encodeURIComponent(relationshipId)}`,
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
            await readLessonObjectivesResponse(
              response,
            )

          const relationship =
            requireLessonObjectiveRecord(
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
        requireLessonId,
      ],
    )

  const removeRelationship =
    useCallback(
      async (
        relationshipId: string,
        reason: string,
      ): Promise<void> => {
        const normalizedLessonId =
          requireLessonId()

        setMutating(true)
        setError(null)

        try {
          const response =
            await fetch(
              `/api/agenda/lessons/${encodeURIComponent(normalizedLessonId)}/objectives/${encodeURIComponent(relationshipId)}`,
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
            await readLessonObjectivesResponse(
              response,
            )

          requireSuccessfulResponse(
            response,
            result,
            'Não foi possível remover o objetivo da aula.',
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
              'Erro inesperado ao remover o objetivo da aula.',
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
        requireLessonId,
      ],
    )

  const removeAllRelationships =
    useCallback(
      async (
        reason: string,
      ): Promise<void> => {
        const normalizedLessonId =
          requireLessonId()

        setMutating(true)
        setError(null)

        try {
          const response =
            await fetch(
              `/api/agenda/lessons/${encodeURIComponent(normalizedLessonId)}/objectives`,
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
            await readLessonObjectivesResponse(
              response,
            )

          requireSuccessfulResponse(
            response,
            result,
            'Não foi possível remover os objetivos da aula.',
          )

          setRelationships([])
        } catch (
          removeError
        ) {
          const message =
            getErrorMessage(
              removeError,
              'Erro inesperado ao remover os objetivos da aula.',
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
        requireLessonId,
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
              'Erro inesperado ao definir o objetivo principal da aula.',
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
        AgendaLessonObjective
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
              'Erro inesperado ao ordenar os objetivos da aula.',
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
      !lessonId?.trim() ||
      !autoLoad
    ) {
      setRelationships([])
      setLoading(false)

      return
    }

    void loadRelationships()
  }, [
    lessonId,
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