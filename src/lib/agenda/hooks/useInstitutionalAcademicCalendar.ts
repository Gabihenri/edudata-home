'use client'

import {
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react'

import type {
  AcademicCalendarStatus,
  SchoolYear,
} from '@/lib/agenda/repository/institutional-academic-calendar.repository'

import type {
  InstitutionalAcademicCalendarSnapshot,
} from '@/lib/agenda/services/institutional-academic-calendar.service'

export type InstitutionalSchoolYearFilters = {
  organizationId?: string
  schoolId?: string
  year?: number

  statuses?:
    AcademicCalendarStatus[]

  includeDeleted?: boolean
}

export type CreateInstitutionalSchoolYearRequest = {
  organizationId: string
  schoolId: string

  year: number

  name?: string | null

  startDate?: string | null
  endDate?: string | null

  active?: boolean

  status?:
    AcademicCalendarStatus

  timezone?: string

  minimumSchoolDays?: number

  minimumInstructionalHours?:
    number | null

  calendarVersion?: number
}

export type UpdateInstitutionalSchoolYearRequest = {
  year?: number

  name?: string | null

  startDate?: string | null
  endDate?: string | null

  active?: boolean

  status?:
    AcademicCalendarStatus

  timezone?: string

  minimumSchoolDays?: number

  minimumInstructionalHours?:
    number | null

  calendarVersion?: number
}

type BaseCalendarApiResponse = {
  success: boolean
  error?: string
  message?: string
}

type SchoolYearsApiResponse =
  BaseCalendarApiResponse & {
    mode?:
      'school-years'

    total?: number

    data?:
      SchoolYear[]
  }

type SnapshotApiResponse =
  BaseCalendarApiResponse & {
    mode?:
      'snapshot'

    data?:
      InstitutionalAcademicCalendarSnapshot
  }

type SchoolYearMutationApiResponse =
  BaseCalendarApiResponse & {
    data?:
      SchoolYear
  }

const API_URL =
  '/api/agenda/institutional-calendar'

function normalizeRequiredText(
  value: string,
  fieldName: string,
): string {
  const normalizedValue =
    value?.trim()

  if (!normalizedValue) {
    throw new Error(
      `${fieldName} é obrigatório.`,
    )
  }

  return normalizedValue
}

function normalizeOptionalName(
  value:
    | string
    | null
    | undefined,
): string | null | undefined {
  if (
    value === undefined
  ) {
    return undefined
  }

  if (
    value === null
  ) {
    return null
  }

  const normalizedValue =
    value.trim()

  return normalizedValue ||
    null
}

function normalizeOptionalInteger(
  value:
    | number
    | null
    | undefined,

  fieldName: string,
): number | null | undefined {
  if (
    value === undefined
  ) {
    return undefined
  }

  if (
    value === null
  ) {
    return null
  }

  if (
    !Number.isInteger(
      value,
    )
  ) {
    throw new Error(
      `${fieldName} deve ser um número inteiro.`,
    )
  }

  return value
}

function buildSchoolYearsUrl(
  filters:
    InstitutionalSchoolYearFilters,
): string {
  const parameters =
    new URLSearchParams()

  if (
    filters.organizationId
  ) {
    parameters.set(
      'organizationId',
      filters.organizationId,
    )
  }

  if (
    filters.schoolId
  ) {
    parameters.set(
      'schoolId',
      filters.schoolId,
    )
  }

  if (
    filters.year !==
    undefined
  ) {
    parameters.set(
      'year',
      String(
        filters.year,
      ),
    )
  }

  if (
    filters.statuses?.length
  ) {
    parameters.set(
      'statuses',
      filters.statuses.join(
        ',',
      ),
    )
  }

  if (
    filters.includeDeleted
  ) {
    parameters.set(
      'includeDeleted',
      'true',
    )
  }

  const queryString =
    parameters.toString()

  return queryString
    ? `${API_URL}?${queryString}`
    : API_URL
}

async function readApiResponse<
  ResponseType,
>(
  response: Response,
): Promise<ResponseType> {
  try {
    return (
      await response.json()
    ) as ResponseType
  } catch {
    throw new Error(
      'A resposta do servidor é inválida.',
    )
  }
}

function getResponseError(
  result:
    BaseCalendarApiResponse,

  fallbackMessage: string,
): string {
  return (
    result.error?.trim() ||
    fallbackMessage
  )
}

function sortSchoolYears(
  schoolYears:
    SchoolYear[],
): SchoolYear[] {
  return [
    ...schoolYears,
  ].sort(
    (
      firstSchoolYear,
      secondSchoolYear,
    ) => {
      if (
        firstSchoolYear.year !==
        secondSchoolYear.year
      ) {
        return (
          secondSchoolYear.year -
          firstSchoolYear.year
        )
      }

      const firstStartDate =
        firstSchoolYear
          .start_date ??
        ''

      const secondStartDate =
        secondSchoolYear
          .start_date ??
        ''

      return firstStartDate
        .localeCompare(
          secondStartDate,
        )
    },
  )
}

function replaceSchoolYear(
  schoolYears:
    SchoolYear[],

  updatedSchoolYear:
    SchoolYear,
): SchoolYear[] {
  return sortSchoolYears([
    ...schoolYears.filter(
      schoolYear =>
        schoolYear.id !==
        updatedSchoolYear.id,
    ),

    updatedSchoolYear,
  ])
}

function createUpdatePayload(
  input:
    UpdateInstitutionalSchoolYearRequest,
): Record<string, unknown> {
  const payload:
    Record<string, unknown> = {}

  if (
    input.year !==
    undefined
  ) {
    if (
      !Number.isInteger(
        input.year,
      )
    ) {
      throw new Error(
        'Ano letivo deve ser um número inteiro.',
      )
    }

    payload.year =
      input.year
  }

  if (
    input.name !==
    undefined
  ) {
    payload.name =
      normalizeOptionalName(
        input.name,
      )
  }

  if (
    input.startDate !==
    undefined
  ) {
    payload.startDate =
      input.startDate
  }

  if (
    input.endDate !==
    undefined
  ) {
    payload.endDate =
      input.endDate
  }

  if (
    input.active !==
    undefined
  ) {
    payload.active =
      input.active
  }

  if (
    input.status !==
    undefined
  ) {
    payload.status =
      input.status
  }

  if (
    input.timezone !==
    undefined
  ) {
    payload.timezone =
      input.timezone
  }

  if (
    input.minimumSchoolDays !==
    undefined
  ) {
    payload.minimumSchoolDays =
      normalizeOptionalInteger(
        input.minimumSchoolDays,
        'Quantidade mínima de dias letivos',
      )
  }

  if (
    input.minimumInstructionalHours !==
    undefined
  ) {
    payload.minimumInstructionalHours =
      normalizeOptionalInteger(
        input.minimumInstructionalHours,
        'Carga horária mínima',
      )
  }

  if (
    input.calendarVersion !==
    undefined
  ) {
    payload.calendarVersion =
      normalizeOptionalInteger(
        input.calendarVersion,
        'Versão do calendário',
      )
  }

  if (
    Object.keys(
      payload,
    ).length === 0
  ) {
    throw new Error(
      'Informe ao menos um campo para atualização.',
    )
  }

  return payload
}

export function useInstitutionalAcademicCalendar() {
  const [
    schoolYears,
    setSchoolYears,
  ] =
    useState<
      SchoolYear[]
    >([])

  const [
    snapshot,
    setSnapshot,
  ] =
    useState<
      InstitutionalAcademicCalendarSnapshot |
      null
    >(null)

  const [
    selectedSchoolYearId,
    setSelectedSchoolYearId,
  ] =
    useState<string | null>(
      null,
    )

  const [
    loadingSchoolYears,
    setLoadingSchoolYears,
  ] =
    useState(false)

  const [
    loadingSnapshot,
    setLoadingSnapshot,
  ] =
    useState(false)

  const [
    creatingSchoolYear,
    setCreatingSchoolYear,
  ] =
    useState(false)

  const [
    updatingSchoolYearId,
    setUpdatingSchoolYearId,
  ] =
    useState<string | null>(
      null,
    )

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    )

  const lastFiltersRef =
    useRef<
      InstitutionalSchoolYearFilters
    >({})

  const selectedSchoolYearIdRef =
    useRef<string | null>(
      null,
    )

  const snapshotRef =
    useRef<
      InstitutionalAcademicCalendarSnapshot |
      null
    >(null)

  const commitSelectedSchoolYearId =
    useCallback(
      (
        nextId:
          string | null,
      ): void => {
        selectedSchoolYearIdRef.current =
          nextId

        setSelectedSchoolYearId(
          nextId,
        )
      },
      [],
    )

  const commitSnapshot =
    useCallback(
      (
        nextSnapshot:
          InstitutionalAcademicCalendarSnapshot |
          null,
      ): void => {
        snapshotRef.current =
          nextSnapshot

        setSnapshot(
          nextSnapshot,
        )
      },
      [],
    )

  const selectedSchoolYear =
    useMemo(
      () => {
        if (
          snapshot &&
          snapshot
            .schoolYear.id ===
            selectedSchoolYearId
        ) {
          return snapshot
            .schoolYear
        }

        return (
          schoolYears.find(
            schoolYear =>
              schoolYear.id ===
              selectedSchoolYearId,
          ) ??
          null
        )
      },
      [
        schoolYears,
        selectedSchoolYearId,
        snapshot,
      ],
    )

  const loadSnapshot =
    useCallback(
      async (
        schoolYearId: string,
      ): Promise<
        InstitutionalAcademicCalendarSnapshot
      > => {
        const normalizedSchoolYearId =
          normalizeRequiredText(
            schoolYearId,
            'Ano letivo',
          )

        setLoadingSnapshot(
          true,
        )

        setError(
          null,
        )

        try {
          const parameters =
            new URLSearchParams({
              schoolYearId:
                normalizedSchoolYearId,
            })

          const response =
            await fetch(
              `${API_URL}?${parameters.toString()}`,
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
            await readApiResponse<SnapshotApiResponse>(
              response,
            )

          if (
            !response.ok ||
            !result.success ||
            result.mode !==
              'snapshot' ||
            !result.data
          ) {
            throw new Error(
              getResponseError(
                result,
                'Não foi possível carregar o calendário letivo.',
              ),
            )
          }

          commitSnapshot(
            result.data,
          )

          commitSelectedSchoolYearId(
            result.data
              .schoolYear.id,
          )

          return result.data
        } catch (
          snapshotError
        ) {
          const message =
            snapshotError instanceof
              Error
              ? snapshotError.message
              : 'Erro inesperado ao carregar o calendário letivo.'

          setError(
            message,
          )

          throw new Error(
            message,
          )
        } finally {
          setLoadingSnapshot(
            false,
          )
        }
      },
      [
        commitSelectedSchoolYearId,
        commitSnapshot,
      ],
    )

  const loadSchoolYears =
    useCallback(
      async (
        filters:
          InstitutionalSchoolYearFilters = {},
      ): Promise<
        SchoolYear[]
      > => {
        lastFiltersRef.current =
          filters

        setLoadingSchoolYears(
          true,
        )

        setError(
          null,
        )

        try {
          const response =
            await fetch(
              buildSchoolYearsUrl(
                filters,
              ),
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
            await readApiResponse<SchoolYearsApiResponse>(
              response,
            )

          if (
            !response.ok ||
            !result.success ||
            result.mode !==
              'school-years' ||
            !Array.isArray(
              result.data,
            )
          ) {
            throw new Error(
              getResponseError(
                result,
                'Não foi possível carregar os anos letivos.',
              ),
            )
          }

          const nextSchoolYears =
            sortSchoolYears(
              result.data,
            )

          setSchoolYears(
            nextSchoolYears,
          )

          const currentSelectedId =
            selectedSchoolYearIdRef.current

          const candidateSchoolYearId =
            currentSelectedId &&
            nextSchoolYears.some(
              schoolYear =>
                schoolYear.id ===
                currentSelectedId,
            )
              ? currentSelectedId
              : nextSchoolYears[0]
                  ?.id ??
                null

          if (
            !candidateSchoolYearId
          ) {
            commitSelectedSchoolYearId(
              null,
            )

            commitSnapshot(
              null,
            )

            return nextSchoolYears
          }

          const currentSnapshot =
            snapshotRef.current

          if (
            currentSnapshot
              ?.schoolYear.id ===
            candidateSchoolYearId
          ) {
            commitSelectedSchoolYearId(
              candidateSchoolYearId,
            )

            return nextSchoolYears
          }

          try {
            await loadSnapshot(
              candidateSchoolYearId,
            )
          } catch {
            commitSelectedSchoolYearId(
              null,
            )

            commitSnapshot(
              null,
            )
          }

          return nextSchoolYears
        } catch (
          loadError
        ) {
          const message =
            loadError instanceof
              Error
              ? loadError.message
              : 'Erro inesperado ao carregar os anos letivos.'

          setError(
            message,
          )

          setSchoolYears(
            [],
          )

          commitSelectedSchoolYearId(
            null,
          )

          commitSnapshot(
            null,
          )

          return []
        } finally {
          setLoadingSchoolYears(
            false,
          )
        }
      },
      [
        commitSelectedSchoolYearId,
        commitSnapshot,
        loadSnapshot,
      ],
    )

  const reloadSchoolYears =
    useCallback(
      async (): Promise<
        SchoolYear[]
      > => {
        return loadSchoolYears(
          lastFiltersRef.current,
        )
      },
      [
        loadSchoolYears,
      ],
    )

  const reloadSnapshot =
    useCallback(
      async (): Promise<
        InstitutionalAcademicCalendarSnapshot |
        null
      > => {
        const currentSchoolYearId =
          selectedSchoolYearIdRef.current

        if (
          !currentSchoolYearId
        ) {
          return null
        }

        return loadSnapshot(
          currentSchoolYearId,
        )
      },
      [
        loadSnapshot,
      ],
    )

  const selectSchoolYear =
    useCallback(
      async (
        schoolYearId:
          string | null,
      ): Promise<
        InstitutionalAcademicCalendarSnapshot |
        null
      > => {
        if (
          !schoolYearId
        ) {
          commitSelectedSchoolYearId(
            null,
          )

          commitSnapshot(
            null,
          )

          return null
        }

        return loadSnapshot(
          schoolYearId,
        )
      },
      [
        commitSelectedSchoolYearId,
        commitSnapshot,
        loadSnapshot,
      ],
    )

  const createSchoolYear =
    useCallback(
      async (
        input:
          CreateInstitutionalSchoolYearRequest,
      ): Promise<
        SchoolYear
      > => {
        const organizationId =
          normalizeRequiredText(
            input.organizationId,
            'Organização',
          )

        const schoolId =
          normalizeRequiredText(
            input.schoolId,
            'Escola',
          )

        if (
          !Number.isInteger(
            input.year,
          )
        ) {
          throw new Error(
            'Ano letivo deve ser um número inteiro.',
          )
        }

        setCreatingSchoolYear(
          true,
        )

        setError(
          null,
        )

        try {
          const response =
            await fetch(
              API_URL,
              {
                method:
                  'POST',

                headers: {
                  'Content-Type':
                    'application/json',
                },

                credentials:
                  'include',

                cache:
                  'no-store',

                body:
                  JSON.stringify({
                    organizationId,
                    schoolId,

                    year:
                      input.year,

                    name:
                      normalizeOptionalName(
                        input.name,
                      ),

                    startDate:
                      input.startDate,

                    endDate:
                      input.endDate,

                    active:
                      input.active,

                    status:
                      input.status,

                    timezone:
                      input.timezone,

                    minimumSchoolDays:
                      normalizeOptionalInteger(
                        input.minimumSchoolDays,
                        'Quantidade mínima de dias letivos',
                      ),

                    minimumInstructionalHours:
                      normalizeOptionalInteger(
                        input.minimumInstructionalHours,
                        'Carga horária mínima',
                      ),

                    calendarVersion:
                      normalizeOptionalInteger(
                        input.calendarVersion,
                        'Versão do calendário',
                      ),
                  }),
              },
            )

          const result =
            await readApiResponse<SchoolYearMutationApiResponse>(
              response,
            )

          if (
            !response.ok ||
            !result.success ||
            !result.data
          ) {
            throw new Error(
              getResponseError(
                result,
                'Não foi possível criar o ano letivo.',
              ),
            )
          }

          const createdSchoolYear =
            result.data

          setSchoolYears(
            currentSchoolYears =>
              replaceSchoolYear(
                currentSchoolYears,
                createdSchoolYear,
              ),
          )

          const createdSnapshot:
            InstitutionalAcademicCalendarSnapshot = {
              schoolYear:
                createdSchoolYear,

              periods: [],

              events: [],

              operatingHours: [],

              exceptions: [],
            }

          commitSelectedSchoolYearId(
            createdSchoolYear.id,
          )

          commitSnapshot(
            createdSnapshot,
          )

          return createdSchoolYear
        } catch (
          createError
        ) {
          const message =
            createError instanceof
              Error
              ? createError.message
              : 'Erro inesperado ao criar o ano letivo.'

          setError(
            message,
          )

          throw new Error(
            message,
          )
        } finally {
          setCreatingSchoolYear(
            false,
          )
        }
      },
      [
        commitSelectedSchoolYearId,
        commitSnapshot,
      ],
    )

  const updateSchoolYear =
    useCallback(
      async (
        schoolYearId: string,

        input:
          UpdateInstitutionalSchoolYearRequest,
      ): Promise<
        SchoolYear
      > => {
        const normalizedSchoolYearId =
          normalizeRequiredText(
            schoolYearId,
            'Ano letivo',
          )

        const payload =
          createUpdatePayload(
            input,
          )

        setUpdatingSchoolYearId(
          normalizedSchoolYearId,
        )

        setError(
          null,
        )

        try {
          const response =
            await fetch(
              `${API_URL}/${encodeURIComponent(
                normalizedSchoolYearId,
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

                cache:
                  'no-store',

                body:
                  JSON.stringify(
                    payload,
                  ),
              },
            )

          const result =
            await readApiResponse<SchoolYearMutationApiResponse>(
              response,
            )

          if (
            !response.ok ||
            !result.success ||
            !result.data
          ) {
            throw new Error(
              getResponseError(
                result,
                'Não foi possível atualizar o ano letivo.',
              ),
            )
          }

          const updatedSchoolYear =
            result.data

          setSchoolYears(
            currentSchoolYears =>
              replaceSchoolYear(
                currentSchoolYears,
                updatedSchoolYear,
              ),
          )

          const currentSnapshot =
            snapshotRef.current

          if (
            currentSnapshot &&
            currentSnapshot
              .schoolYear.id ===
              updatedSchoolYear.id
          ) {
            commitSnapshot({
              ...currentSnapshot,

              schoolYear:
                updatedSchoolYear,
            })

            commitSelectedSchoolYearId(
              updatedSchoolYear.id,
            )
          }

          return updatedSchoolYear
        } catch (
          updateError
        ) {
          const message =
            updateError instanceof
              Error
              ? updateError.message
              : 'Erro inesperado ao atualizar o ano letivo.'

          setError(
            message,
          )

          throw new Error(
            message,
          )
        } finally {
          setUpdatingSchoolYearId(
            null,
          )
        }
      },
      [
        commitSelectedSchoolYearId,
        commitSnapshot,
      ],
    )

  const clearSnapshot =
    useCallback(
      (): void => {
        commitSnapshot(
          null,
        )

        commitSelectedSchoolYearId(
          null,
        )
      },
      [
        commitSelectedSchoolYearId,
        commitSnapshot,
      ],
    )

  const clearError =
    useCallback(
      (): void => {
        setError(
          null,
        )
      },
      [],
    )

  return {
    schoolYears,
    selectedSchoolYear,
    selectedSchoolYearId,
    snapshot,

    loading:
      loadingSchoolYears ||
      loadingSnapshot ||
      creatingSchoolYear ||
      updatingSchoolYearId !==
        null,

    loadingSchoolYears,
    loadingSnapshot,
    creatingSchoolYear,

    updatingSchoolYear:
      updatingSchoolYearId !==
      null,

    updatingSchoolYearId,

    error,

    loadSchoolYears,
    reloadSchoolYears,

    loadSnapshot,
    reloadSnapshot,

    selectSchoolYear,

    createSchoolYear,
    updateSchoolYear,

    clearSnapshot,
    clearError,
  }
}