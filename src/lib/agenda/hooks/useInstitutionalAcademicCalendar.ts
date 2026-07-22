'use client'

import {
  useCallback,
  useEffect,
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

type BaseCalendarApiResponse = {
  success: boolean
  error?: string
  message?: string
}

type SchoolYearsApiResponse =
  BaseCalendarApiResponse & {
    mode?: 'school-years'
    total?: number
    data?: SchoolYear[]
  }

type SnapshotApiResponse =
  BaseCalendarApiResponse & {
    mode?: 'snapshot'

    data?:
      InstitutionalAcademicCalendarSnapshot
  }

type CreateSchoolYearApiResponse =
  BaseCalendarApiResponse & {
    data?: SchoolYear
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

function buildSchoolYearsUrl(
  filters:
    InstitutionalSchoolYearFilters,
): string {
  const parameters =
    new URLSearchParams()

  if (filters.organizationId) {
    parameters.set(
      'organizationId',
      filters.organizationId,
    )
  }

  if (filters.schoolId) {
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

  if (filters.includeDeleted) {
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

export function useInstitutionalAcademicCalendar() {
  const [
    schoolYears,
    setSchoolYears,
  ] =
    useState<SchoolYear[]>([])

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
    useState(true)

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

          setSelectedSchoolYearId(
            currentId => {
              if (
                currentId &&
                nextSchoolYears.some(
                  schoolYear =>
                    schoolYear.id ===
                    currentId,
                )
              ) {
                return currentId
              }

              return (
                nextSchoolYears[0]
                  ?.id ??
                null
              )
            },
          )

          return nextSchoolYears
        } catch (loadError) {
          const message =
            loadError instanceof
              Error
              ? loadError.message
              : 'Erro inesperado ao carregar os anos letivos.'

          setError(
            message,
          )

          return []
        } finally {
          setLoadingSchoolYears(
            false,
          )
        }
      },
      [],
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

          setSnapshot(
            result.data,
          )

          setSelectedSchoolYearId(
            result.data
              .schoolYear.id,
          )

          return result.data
        } catch (snapshotError) {
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
      [],
    )

  const reloadSnapshot =
    useCallback(
      async (): Promise<
        InstitutionalAcademicCalendarSnapshot |
        null
      > => {
        if (
          !selectedSchoolYearId
        ) {
          return null
        }

        return loadSnapshot(
          selectedSchoolYearId,
        )
      },
      [
        loadSnapshot,
        selectedSchoolYearId,
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
        if (!schoolYearId) {
          setSelectedSchoolYearId(
            null,
          )

          setSnapshot(
            null,
          )

          return null
        }

        return loadSnapshot(
          schoolYearId,
        )
      },
      [
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
                      input.name,

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
                      input
                        .minimumSchoolDays,

                    minimumInstructionalHours:
                      input
                        .minimumInstructionalHours,

                    calendarVersion:
                      input
                        .calendarVersion,
                  }),
              },
            )

          const result =
            await readApiResponse<CreateSchoolYearApiResponse>(
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
              sortSchoolYears([
                ...currentSchoolYears.filter(
                  schoolYear =>
                    schoolYear.id !==
                    createdSchoolYear.id,
                ),

                createdSchoolYear,
              ]),
          )

          setSelectedSchoolYearId(
            createdSchoolYear.id,
          )

          setSnapshot({
            schoolYear:
              createdSchoolYear,

            periods: [],

            events: [],

            operatingHours: [],

            exceptions: [],
          })

          return createdSchoolYear
        } catch (createError) {
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
      [],
    )

  const clearSnapshot =
    useCallback(
      (): void => {
        setSnapshot(
          null,
        )

        setSelectedSchoolYearId(
          null,
        )
      },
      [],
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

  useEffect(() => {
    void loadSchoolYears()
  }, [
    loadSchoolYears,
  ])

  return {
    schoolYears,
    selectedSchoolYear,
    selectedSchoolYearId,
    snapshot,

    loading:
      loadingSchoolYears ||
      loadingSnapshot ||
      creatingSchoolYear,

    loadingSchoolYears,
    loadingSnapshot,
    creatingSchoolYear,

    error,

    loadSchoolYears,
    reloadSchoolYears,

    loadSnapshot,
    reloadSnapshot,

    selectSchoolYear,
    createSchoolYear,

    clearSnapshot,
    clearError,
  }
}