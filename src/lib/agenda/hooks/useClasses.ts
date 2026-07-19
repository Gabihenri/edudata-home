'use client'

import {
  useCallback,
  useEffect,
  useState,
} from 'react'

import type {
  AgendaClass,
  CreateAgendaClassInput,
  UpdateAgendaClassInput,
} from '@/lib/agenda'

type ClassesResponse = {
  success: boolean
  total?: number

  data?:
    | AgendaClass[]
    | AgendaClass

  message?: string
  error?: string
}

async function readJsonResponse(
  response: Response,
): Promise<ClassesResponse> {
  try {
    return (
      await response.json()
    ) as ClassesResponse
  } catch {
    throw new Error(
      'A resposta do servidor é inválida.',
    )
  }
}

function getErrorMessage(
  result: ClassesResponse,
  fallbackMessage: string,
): string {
  return (
    result.error ??
    result.message ??
    fallbackMessage
  )
}

function sortClasses(
  classes: AgendaClass[],
): AgendaClass[] {
  return [
    ...classes,
  ].sort(
    (
      firstClass,
      secondClass,
    ) =>
      firstClass.name.localeCompare(
        secondClass.name,
        'pt-BR',
      ),
  )
}

export function useClasses() {
  const [
    classes,
    setClasses,
  ] =
    useState<AgendaClass[]>(
      [],
    )

  const [
    loading,
    setLoading,
  ] =
    useState(true)

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    )

  const loadClasses =
    useCallback(
      async (): Promise<void> => {
        setLoading(
          true,
        )

        setError(
          null,
        )

        try {
          const response =
            await fetch(
              '/api/agenda/classes',
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
            await readJsonResponse(
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
              getErrorMessage(
                result,
                'Não foi possível carregar as turmas.',
              ),
            )
          }

          setClasses(
            sortClasses(
              result.data,
            ),
          )
        } catch (
          loadError
        ) {
          setClasses(
            [],
          )

          setError(
            loadError instanceof
              Error
              ? loadError.message
              : 'Erro inesperado ao carregar turmas.',
          )
        } finally {
          setLoading(
            false,
          )
        }
      },
      [],
    )

  const createClass =
    useCallback(
      async (
        input:
          CreateAgendaClassInput,
      ): Promise<AgendaClass> => {
        const response =
          await fetch(
            '/api/agenda/classes',
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
                JSON.stringify({
                  name:
                    input.name,

                  schoolYear:
                    input.school_year ??
                    null,

                  grade:
                    input.grade ??
                    null,

                  subject:
                    input.subject ??
                    null,

                  studentsCount:
                    input.students_count ??
                    0,

                  active:
                    input.active ??
                    true,
                }),
            },
          )

        const result =
          await readJsonResponse(
            response,
          )

        if (
          !response.ok ||
          !result.success ||
          !result.data ||
          Array.isArray(
            result.data,
          )
        ) {
          throw new Error(
            getErrorMessage(
              result,
              'Não foi possível criar a turma.',
            ),
          )
        }

        const createdClass =
          result.data

        setClasses(
          currentClasses =>
            sortClasses([
              ...currentClasses,
              createdClass,
            ]),
        )

        return createdClass
      },
      [],
    )

  const updateClass =
    useCallback(
      async (
        classId: string,
        input:
          UpdateAgendaClassInput,
      ): Promise<AgendaClass> => {
        const normalizedClassId =
          classId.trim()

        if (
          !normalizedClassId
        ) {
          throw new Error(
            'O ID da turma é obrigatório.',
          )
        }

        const response =
          await fetch(
            `/api/agenda/classes/${encodeURIComponent(
              normalizedClassId,
            )}`,
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
                JSON.stringify({
                  ...(input.name !==
                  undefined
                    ? {
                        name:
                          input.name,
                      }
                    : {}),

                  ...(input.school_year !==
                  undefined
                    ? {
                        schoolYear:
                          input.school_year,
                      }
                    : {}),

                  ...(input.grade !==
                  undefined
                    ? {
                        grade:
                          input.grade,
                      }
                    : {}),

                  ...(input.subject !==
                  undefined
                    ? {
                        subject:
                          input.subject,
                      }
                    : {}),

                  ...(input.students_count !==
                  undefined
                    ? {
                        studentsCount:
                          input.students_count,
                      }
                    : {}),

                  ...(input.active !==
                  undefined
                    ? {
                        active:
                          input.active,
                      }
                    : {}),
                }),
            },
          )

        const result =
          await readJsonResponse(
            response,
          )

        if (
          !response.ok ||
          !result.success ||
          !result.data ||
          Array.isArray(
            result.data,
          )
        ) {
          throw new Error(
            getErrorMessage(
              result,
              'Não foi possível atualizar a turma.',
            ),
          )
        }

        const updatedClass =
          result.data

        setClasses(
          currentClasses =>
            sortClasses(
              currentClasses.map(
                agendaClass =>
                  agendaClass.id ===
                  updatedClass.id
                    ? updatedClass
                    : agendaClass,
              ),
            ),
        )

        return updatedClass
      },
      [],
    )

  useEffect(() => {
    void loadClasses()
  }, [
    loadClasses,
  ])

  return {
    classes,
    loading,
    error,

    reload:
      loadClasses,

    createClass,
    updateClass,
  }
}