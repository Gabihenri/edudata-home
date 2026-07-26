'use client'

import {
  useCallback,
  useEffect,
  useState,
} from 'react'

import type {
  AgendaLesson,
  AgendaLessonMetadata,
  AgendaLessonStatus,
} from '@/lib/agenda/repository/lessons.repository'

import type {
  CompleteAgendaLessonInput,
  CreateAgendaLessonServiceInput,
  RescheduleAgendaLessonInput,
  UpdateAgendaLessonServiceInput,
} from '@/lib/agenda/services/lessons.service'

type LessonsResponse = {
  success: boolean

  total?: number

  data?:
    | AgendaLesson
    | AgendaLesson[]

  error?: string
  message?: string
}

type LessonPayload =
  Record<string, unknown>

export type LessonFilters = {
  organizationId?: string | null
  schoolId?: string | null

  classId?: string | null
  planningId?: string | null
  academicPeriodId?: string | null

  status?: AgendaLessonStatus | null
  statuses?: AgendaLessonStatus[]

  subject?: string | null

  scheduledDateFrom?: string | null
  scheduledDateTo?: string | null

  search?: string | null
}

export type CreateLessonPayload = {
  title: string

  classId?: string | null
  subject?: string | null

  scheduledDate?: string | null
  startTime?: string | null
  endTime?: string | null

  planningId?: string | null
  academicPeriodId?: string | null

  description?: string | null

  skills?: string[]

  resources?: string | null
  methodology?: string | null

  status?: AgendaLessonStatus

  observations?: string | null
  nextAction?: string | null

  organizationId?: string | null
  schoolId?: string | null

  metadata?: AgendaLessonMetadata
}

export type UpdateLessonPayload =
  Partial<CreateLessonPayload>

function assignIfDefined(
  payload: LessonPayload,
  key: string,
  value: unknown,
): void {
  if (value !== undefined) {
    payload[key] = value
  }
}

function createLessonPayload(
  input:
    | CreateLessonPayload
    | UpdateLessonPayload,
): LessonPayload {
  const payload:
    LessonPayload = {}

  assignIfDefined(
    payload,
    'title',
    input.title,
  )

  assignIfDefined(
    payload,
    'classId',
    input.classId,
  )

  assignIfDefined(
    payload,
    'subject',
    input.subject,
  )

  assignIfDefined(
    payload,
    'scheduledDate',
    input.scheduledDate,
  )

  assignIfDefined(
    payload,
    'startTime',
    input.startTime,
  )

  assignIfDefined(
    payload,
    'endTime',
    input.endTime,
  )

  assignIfDefined(
    payload,
    'planningId',
    input.planningId,
  )

  assignIfDefined(
    payload,
    'academicPeriodId',
    input.academicPeriodId,
  )

  assignIfDefined(
    payload,
    'description',
    input.description,
  )

  assignIfDefined(
    payload,
    'skills',
    input.skills,
  )

  assignIfDefined(
    payload,
    'resources',
    input.resources,
  )

  assignIfDefined(
    payload,
    'methodology',
    input.methodology,
  )

  assignIfDefined(
    payload,
    'status',
    input.status,
  )

  assignIfDefined(
    payload,
    'observations',
    input.observations,
  )

  assignIfDefined(
    payload,
    'nextAction',
    input.nextAction,
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

function createQueryString(
  filters: LessonFilters,
): string {
  const parameters =
    new URLSearchParams()

  function addParameter(
    key: string,
    value:
      | string
      | null
      | undefined,
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
    'organizationId',
    filters.organizationId,
  )

  addParameter(
    'schoolId',
    filters.schoolId,
  )

  addParameter(
    'classId',
    filters.classId,
  )

  addParameter(
    'planningId',
    filters.planningId,
  )

  addParameter(
    'academicPeriodId',
    filters.academicPeriodId,
  )

  addParameter(
    'status',
    filters.status,
  )

  if (
    filters.statuses &&
    filters.statuses.length > 0
  ) {
    parameters.set(
      'statuses',
      filters.statuses.join(','),
    )
  }

  addParameter(
    'subject',
    filters.subject,
  )

  addParameter(
    'scheduledDateFrom',
    filters.scheduledDateFrom,
  )

  addParameter(
    'scheduledDateTo',
    filters.scheduledDateTo,
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

async function readLessonsResponse(
  response: Response,
): Promise<LessonsResponse> {
  try {
    return await response
      .json() as LessonsResponse
  } catch {
    return {
      success: false,

      error:
        'A resposta do servidor possui formato inválido.',
    }
  }
}

function requireLessonRecord(
  response: Response,
  result: LessonsResponse,
  fallbackMessage: string,
): AgendaLesson {
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

function requireLessonList(
  response: Response,
  result: LessonsResponse,
  fallbackMessage: string,
): AgendaLesson[] {
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
  result: LessonsResponse,
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

function addOrReplaceLesson(
  currentLessons:
    AgendaLesson[],

  lesson:
    AgendaLesson,
): AgendaLesson[] {
  const exists =
    currentLessons.some(
      currentLesson =>
        currentLesson.id ===
        lesson.id,
    )

  const nextLessons =
    exists
      ? currentLessons.map(
          currentLesson =>
            currentLesson.id ===
            lesson.id
              ? lesson
              : currentLesson,
        )
      : [
          lesson,
          ...currentLessons,
        ]

  return nextLessons.sort(
    (
      firstLesson,
      secondLesson,
    ) => {
      const firstDate =
        firstLesson
          .scheduled_date ??
        '9999-12-31'

      const secondDate =
        secondLesson
          .scheduled_date ??
        '9999-12-31'

      const dateComparison =
        firstDate.localeCompare(
          secondDate,
        )

      if (
        dateComparison !==
        0
      ) {
        return dateComparison
      }

      const firstTime =
        firstLesson
          .start_time ??
        '23:59:59'

      const secondTime =
        secondLesson
          .start_time ??
        '23:59:59'

      return firstTime.localeCompare(
        secondTime,
      )
    },
  )
}

function removeLessonById(
  currentLessons:
    AgendaLesson[],

  lessonId: string,
): AgendaLesson[] {
  return currentLessons.filter(
    lesson =>
      lesson.id !==
      lessonId,
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

export function useLessons(
  initialFilters:
    LessonFilters = {},
) {
  const [
    lessons,
    setLessons,
  ] = useState<
    AgendaLesson[]
  >([])

  const [
    filters,
    setFilters,
  ] = useState<
    LessonFilters
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

  const loadLessons =
    useCallback(
      async (
        requestedFilters:
          LessonFilters =
          filters,
      ): Promise<
        AgendaLesson[]
      > => {
        setLoading(true)
        setError(null)

        try {
          const response =
            await fetch(
              `/api/agenda/lessons${createQueryString(requestedFilters)}`,
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
            await readLessonsResponse(
              response,
            )

          const records =
            requireLessonList(
              response,
              result,
              'Não foi possível carregar as aulas.',
            )

          setLessons(
            records,
          )

          return records
        } catch (
          loadError
        ) {
          const message =
            getErrorMessage(
              loadError,
              'Erro inesperado ao carregar as aulas.',
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

  const getLesson =
    useCallback(
      async (
        lessonId: string,
      ): Promise<
        AgendaLesson
      > => {
        setError(null)

        try {
          const response =
            await fetch(
              `/api/agenda/lessons/${encodeURIComponent(lessonId)}`,
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
            await readLessonsResponse(
              response,
            )

          const lesson =
            requireLessonRecord(
              response,
              result,
              'Não foi possível carregar a aula.',
            )

          setLessons(
            currentLessons =>
              addOrReplaceLesson(
                currentLessons,
                lesson,
              ),
          )

          return lesson
        } catch (
          getError
        ) {
          const message =
            getErrorMessage(
              getError,
              'Erro inesperado ao carregar a aula.',
            )

          setError(
            message,
          )

          throw getError
        }
      },
      [],
    )

  const createLesson =
    useCallback(
      async (
        input:
          CreateLessonPayload,
      ): Promise<
        AgendaLesson
      > => {
        setMutating(true)
        setError(null)

        try {
          const response =
            await fetch(
              '/api/agenda/lessons',
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
                    createLessonPayload({
                      ...input,

                      status:
                        input.status ??
                        'planejada',

                      skills:
                        input.skills ??
                        [],

                      metadata:
                        input.metadata ??
                        {},
                    }),
                  ),
              },
            )

          const result =
            await readLessonsResponse(
              response,
            )

          const lesson =
            requireLessonRecord(
              response,
              result,
              'Não foi possível criar a aula.',
            )

          setLessons(
            currentLessons =>
              addOrReplaceLesson(
                currentLessons,
                lesson,
              ),
          )

          return lesson
        } catch (
          createError
        ) {
          const message =
            getErrorMessage(
              createError,
              'Erro inesperado ao criar a aula.',
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

  const patchLesson =
    useCallback(
      async (
        lessonId: string,
        payload:
          LessonPayload,
        fallbackMessage: string,
      ): Promise<
        AgendaLesson
      > => {
        const response =
          await fetch(
            `/api/agenda/lessons/${encodeURIComponent(lessonId)}`,
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
                  payload,
                ),
            },
          )

        const result =
          await readLessonsResponse(
            response,
          )

        return requireLessonRecord(
          response,
          result,
          fallbackMessage,
        )
      },
      [],
    )

  const updateLesson =
    useCallback(
      async (
        lessonId: string,

        input:
          UpdateLessonPayload,
      ): Promise<
        AgendaLesson
      > => {
        setMutating(true)
        setError(null)

        try {
          const lesson =
            await patchLesson(
              lessonId,
              {
                action:
                  'update',

                ...createLessonPayload(
                  input,
                ),
              },
              'Não foi possível atualizar a aula.',
            )

          setLessons(
            currentLessons =>
              addOrReplaceLesson(
                currentLessons,
                lesson,
              ),
          )

          return lesson
        } catch (
          updateError
        ) {
          const message =
            getErrorMessage(
              updateError,
              'Erro inesperado ao atualizar a aula.',
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
        patchLesson,
      ],
    )

  const markAsPreparing =
    useCallback(
      async (
        lessonId: string,
      ): Promise<
        AgendaLesson
      > => {
        setMutating(true)
        setError(null)

        try {
          const lesson =
            await patchLesson(
              lessonId,
              {
                action:
                  'prepare',
              },
              'Não foi possível colocar a aula em preparação.',
            )

          setLessons(
            currentLessons =>
              addOrReplaceLesson(
                currentLessons,
                lesson,
              ),
          )

          return lesson
        } catch (
          prepareError
        ) {
          const message =
            getErrorMessage(
              prepareError,
              'Erro inesperado ao colocar a aula em preparação.',
            )

          setError(
            message,
          )

          throw prepareError
        } finally {
          setMutating(false)
        }
      },
      [
        patchLesson,
      ],
    )

  const completeLesson =
    useCallback(
      async (
        lessonId: string,

        input:
          CompleteAgendaLessonInput = {},
      ): Promise<
        AgendaLesson
      > => {
        setMutating(true)
        setError(null)

        try {
          const lesson =
            await patchLesson(
              lessonId,
              {
                action:
                  'complete',

                actualStartAt:
                  input.actualStartAt,

                actualEndAt:
                  input.actualEndAt,

                observations:
                  input.observations,

                nextAction:
                  input.nextAction,

                partiallyCompleted:
                  input.partiallyCompleted ??
                  false,
              },
              'Não foi possível registrar a realização da aula.',
            )

          setLessons(
            currentLessons =>
              addOrReplaceLesson(
                currentLessons,
                lesson,
              ),
          )

          return lesson
        } catch (
          completeError
        ) {
          const message =
            getErrorMessage(
              completeError,
              'Erro inesperado ao concluir a aula.',
            )

          setError(
            message,
          )

          throw completeError
        } finally {
          setMutating(false)
        }
      },
      [
        patchLesson,
      ],
    )

  const rescheduleLesson =
    useCallback(
      async (
        lessonId: string,

        input:
          RescheduleAgendaLessonInput,
      ): Promise<
        AgendaLesson
      > => {
        setMutating(true)
        setError(null)

        try {
          const lesson =
            await patchLesson(
              lessonId,
              {
                action:
                  'reschedule',

                scheduledDate:
                  input.scheduledDate,

                startTime:
                  input.startTime,

                endTime:
                  input.endTime,

                reason:
                  input.reason,
              },
              'Não foi possível reagendar a aula.',
            )

          setLessons(
            currentLessons =>
              addOrReplaceLesson(
                currentLessons,
                lesson,
              ),
          )

          return lesson
        } catch (
          rescheduleError
        ) {
          const message =
            getErrorMessage(
              rescheduleError,
              'Erro inesperado ao reagendar a aula.',
            )

          setError(
            message,
          )

          throw rescheduleError
        } finally {
          setMutating(false)
        }
      },
      [
        patchLesson,
      ],
    )

  const cancelLesson =
    useCallback(
      async (
        lessonId: string,
        reason: string,
      ): Promise<
        AgendaLesson
      > => {
        setMutating(true)
        setError(null)

        try {
          const lesson =
            await patchLesson(
              lessonId,
              {
                action:
                  'cancel',

                reason,
              },
              'Não foi possível cancelar a aula.',
            )

          setLessons(
            currentLessons =>
              addOrReplaceLesson(
                currentLessons,
                lesson,
              ),
          )

          return lesson
        } catch (
          cancelError
        ) {
          const message =
            getErrorMessage(
              cancelError,
              'Erro inesperado ao cancelar a aula.',
            )

          setError(
            message,
          )

          throw cancelError
        } finally {
          setMutating(false)
        }
      },
      [
        patchLesson,
      ],
    )

  const deleteLesson =
    useCallback(
      async (
        lessonId: string,
        reason: string,
      ): Promise<void> => {
        setMutating(true)
        setError(null)

        try {
          const response =
            await fetch(
              `/api/agenda/lessons/${encodeURIComponent(lessonId)}`,
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
            await readLessonsResponse(
              response,
            )

          requireSuccessfulResponse(
            response,
            result,
            'Não foi possível excluir a aula.',
          )

          setLessons(
            currentLessons =>
              removeLessonById(
                currentLessons,
                lessonId,
              ),
          )
        } catch (
          deleteError
        ) {
          const message =
            getErrorMessage(
              deleteError,
              'Erro inesperado ao excluir a aula.',
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

  const changeStatus =
    useCallback(
      async (
        lessonId: string,
        status:
          AgendaLessonStatus,
      ): Promise<
        AgendaLesson
      > => {
        if (
          status ===
          'em_preparacao'
        ) {
          return markAsPreparing(
            lessonId,
          )
        }

        if (
          status ===
          'realizada'
        ) {
          return completeLesson(
            lessonId,
          )
        }

        return updateLesson(
          lessonId,
          {
            status,
          },
        )
      },
      [
        completeLesson,
        markAsPreparing,
        updateLesson,
      ],
    )

  const updateFilters =
    useCallback(
      (
        nextFilters:
          LessonFilters,
      ): void => {
        setFilters(
          nextFilters,
        )
      },
      [],
    )

  useEffect(() => {
    void loadLessons()
  }, [
    loadLessons,
  ])

  return {
    lessons,
    setLessons,

    filters,
    setFilters:
      updateFilters,

    loading,
    mutating,
    error,

    clearError,

    loadLessons,
    getLesson,

    createLesson,
    updateLesson,

    markAsPreparing,
    completeLesson,
    rescheduleLesson,
    cancelLesson,
    changeStatus,

    deleteLesson,
  }
}