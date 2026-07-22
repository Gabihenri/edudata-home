'use client'

import {
  useCallback,
  useRef,
  useState,
} from 'react'

import type {
  AcademicCalendarStatus,
  AcademicPeriod,
  AcademicPeriodType,
} from '@/lib/agenda/repository/institutional-academic-calendar.repository'

export type InstitutionalAcademicPeriodFilters = {
  schoolYearId: string

  statuses?:
    AcademicCalendarStatus[]

  includeDeleted?: boolean
}

export type CreateInstitutionalAcademicPeriodRequest = {
  organizationId: string
  schoolId: string
  schoolYearId: string

  name: string
  code?: string | null

  periodType:
    AcademicPeriodType

  sequence: number

  startDate: string
  endDate: string

  instructionalDaysTarget?:
    number | null

  status?:
    AcademicCalendarStatus
}

export type UpdateInstitutionalAcademicPeriodRequest = {
  name?: string

  code?:
    | string
    | null

  periodType?:
    AcademicPeriodType

  sequence?: number

  startDate?: string
  endDate?: string

  instructionalDaysTarget?:
    number | null

  status?:
    AcademicCalendarStatus
}

type BaseApiResponse = {
  success: boolean
  error?: string
  message?: string
}

type AcademicPeriodsApiResponse =
  BaseApiResponse & {
    mode?:
      'academic-periods'

    total?: number

    data?:
      AcademicPeriod[]
  }

type AcademicPeriodMutationResponse =
  BaseApiResponse & {
    data?:
      AcademicPeriod
  }

const API_URL =
  '/api/agenda/institutional-calendar/periods'

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

function normalizeOptionalText(
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

function normalizeRequiredInteger(
  value: number,
  fieldName: string,
): number {
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

function buildPeriodsUrl(
  filters:
    InstitutionalAcademicPeriodFilters,
): string {
  const schoolYearId =
    normalizeRequiredText(
      filters.schoolYearId,
      'Ano letivo',
    )

  const parameters =
    new URLSearchParams({
      schoolYearId,
    })

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

  return `${API_URL}?${parameters.toString()}`
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
    BaseApiResponse,

  fallbackMessage: string,
): string {
  return (
    result.error?.trim() ||
    fallbackMessage
  )
}

function sortAcademicPeriods(
  periods:
    AcademicPeriod[],
): AcademicPeriod[] {
  return [
    ...periods,
  ].sort(
    (
      firstPeriod,
      secondPeriod,
    ) => {
      if (
        firstPeriod.sequence !==
        secondPeriod.sequence
      ) {
        return (
          firstPeriod.sequence -
          secondPeriod.sequence
        )
      }

      return firstPeriod
        .start_date
        .localeCompare(
          secondPeriod
            .start_date,
        )
    },
  )
}

function replaceAcademicPeriod(
  periods:
    AcademicPeriod[],

  updatedPeriod:
    AcademicPeriod,
): AcademicPeriod[] {
  return sortAcademicPeriods([
    ...periods.filter(
      period =>
        period.id !==
        updatedPeriod.id,
    ),

    updatedPeriod,
  ])
}

function createUpdatePayload(
  input:
    UpdateInstitutionalAcademicPeriodRequest,
): Record<string, unknown> {
  const payload:
    Record<string, unknown> = {}

  if (
    input.name !==
    undefined
  ) {
    payload.name =
      normalizeRequiredText(
        input.name,
        'Nome do período',
      )
  }

  if (
    input.code !==
    undefined
  ) {
    payload.code =
      normalizeOptionalText(
        input.code,
      )
  }

  if (
    input.periodType !==
    undefined
  ) {
    payload.periodType =
      input.periodType
  }

  if (
    input.sequence !==
    undefined
  ) {
    payload.sequence =
      normalizeRequiredInteger(
        input.sequence,
        'Sequência do período',
      )
  }

  if (
    input.startDate !==
    undefined
  ) {
    payload.startDate =
      normalizeRequiredText(
        input.startDate,
        'Data inicial',
      )
  }

  if (
    input.endDate !==
    undefined
  ) {
    payload.endDate =
      normalizeRequiredText(
        input.endDate,
        'Data final',
      )
  }

  if (
    input.instructionalDaysTarget !==
    undefined
  ) {
    if (
      input
        .instructionalDaysTarget ===
      null
    ) {
      payload.instructionalDaysTarget =
        null
    } else {
      payload.instructionalDaysTarget =
        normalizeRequiredInteger(
          input
            .instructionalDaysTarget,
          'Meta de dias letivos',
        )
    }
  }

  if (
    input.status !==
    undefined
  ) {
    payload.status =
      input.status
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

export function useInstitutionalAcademicPeriods() {
  const [
    academicPeriods,
    setAcademicPeriods,
  ] =
    useState<
      AcademicPeriod[]
    >([])

  const [
    loadedSchoolYearId,
    setLoadedSchoolYearId,
  ] =
    useState<string | null>(
      null,
    )

  const [
    loadingAcademicPeriods,
    setLoadingAcademicPeriods,
  ] =
    useState(false)

  const [
    creatingAcademicPeriod,
    setCreatingAcademicPeriod,
  ] =
    useState(false)

  const [
    updatingAcademicPeriodId,
    setUpdatingAcademicPeriodId,
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
      InstitutionalAcademicPeriodFilters |
      null
    >(null)

  const loadAcademicPeriods =
    useCallback(
      async (
        filters:
          InstitutionalAcademicPeriodFilters,
      ): Promise<
        AcademicPeriod[]
      > => {
        const schoolYearId =
          normalizeRequiredText(
            filters.schoolYearId,
            'Ano letivo',
          )

        const normalizedFilters:
          InstitutionalAcademicPeriodFilters = {
            ...filters,
            schoolYearId,
          }

        lastFiltersRef.current =
          normalizedFilters

        setLoadingAcademicPeriods(
          true,
        )

        setError(
          null,
        )

        try {
          const response =
            await fetch(
              buildPeriodsUrl(
                normalizedFilters,
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
            await readApiResponse<AcademicPeriodsApiResponse>(
              response,
            )

          if (
            !response.ok ||
            !result.success ||
            result.mode !==
              'academic-periods' ||
            !Array.isArray(
              result.data,
            )
          ) {
            throw new Error(
              getResponseError(
                result,
                'Não foi possível carregar os períodos letivos.',
              ),
            )
          }

          const nextPeriods =
            sortAcademicPeriods(
              result.data,
            )

          setAcademicPeriods(
            nextPeriods,
          )

          setLoadedSchoolYearId(
            schoolYearId,
          )

          return nextPeriods
        } catch (
          loadError
        ) {
          const message =
            loadError instanceof
              Error
              ? loadError.message
              : 'Erro inesperado ao carregar os períodos letivos.'

          setError(
            message,
          )

          setAcademicPeriods(
            [],
          )

          setLoadedSchoolYearId(
            null,
          )

          throw new Error(
            message,
          )
        } finally {
          setLoadingAcademicPeriods(
            false,
          )
        }
      },
      [],
    )

  const reloadAcademicPeriods =
    useCallback(
      async (): Promise<
        AcademicPeriod[]
      > => {
        if (
          !lastFiltersRef.current
        ) {
          return []
        }

        return loadAcademicPeriods(
          lastFiltersRef.current,
        )
      },
      [
        loadAcademicPeriods,
      ],
    )

  const createAcademicPeriod =
    useCallback(
      async (
        input:
          CreateInstitutionalAcademicPeriodRequest,
      ): Promise<
        AcademicPeriod
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

        const schoolYearId =
          normalizeRequiredText(
            input.schoolYearId,
            'Ano letivo',
          )

        const name =
          normalizeRequiredText(
            input.name,
            'Nome do período',
          )

        const startDate =
          normalizeRequiredText(
            input.startDate,
            'Data inicial',
          )

        const endDate =
          normalizeRequiredText(
            input.endDate,
            'Data final',
          )

        const sequence =
          normalizeRequiredInteger(
            input.sequence,
            'Sequência do período',
          )

        if (
          input
            .instructionalDaysTarget !==
            undefined &&
          input
            .instructionalDaysTarget !==
            null
        ) {
          normalizeRequiredInteger(
            input
              .instructionalDaysTarget,
            'Meta de dias letivos',
          )
        }

        setCreatingAcademicPeriod(
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
                    schoolYearId,

                    name,

                    code:
                      normalizeOptionalText(
                        input.code,
                      ),

                    periodType:
                      input.periodType,

                    sequence,

                    startDate,
                    endDate,

                    instructionalDaysTarget:
                      input
                        .instructionalDaysTarget,

                    status:
                      input.status ??
                      'draft',
                  }),
              },
            )

          const result =
            await readApiResponse<AcademicPeriodMutationResponse>(
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
                'Não foi possível criar o período letivo.',
              ),
            )
          }

          const createdPeriod =
            result.data

          if (
            loadedSchoolYearId ===
            createdPeriod
              .school_year_id
          ) {
            setAcademicPeriods(
              currentPeriods =>
                replaceAcademicPeriod(
                  currentPeriods,
                  createdPeriod,
                ),
            )
          }

          return createdPeriod
        } catch (
          createError
        ) {
          const message =
            createError instanceof
              Error
              ? createError.message
              : 'Erro inesperado ao criar o período letivo.'

          setError(
            message,
          )

          throw new Error(
            message,
          )
        } finally {
          setCreatingAcademicPeriod(
            false,
          )
        }
      },
      [
        loadedSchoolYearId,
      ],
    )

  const updateAcademicPeriod =
    useCallback(
      async (
        academicPeriodId:
          string,

        input:
          UpdateInstitutionalAcademicPeriodRequest,
      ): Promise<
        AcademicPeriod
      > => {
        const normalizedAcademicPeriodId =
          normalizeRequiredText(
            academicPeriodId,
            'Período letivo',
          )

        const payload =
          createUpdatePayload(
            input,
          )

        setUpdatingAcademicPeriodId(
          normalizedAcademicPeriodId,
        )

        setError(
          null,
        )

        try {
          const response =
            await fetch(
              `${API_URL}/${encodeURIComponent(
                normalizedAcademicPeriodId,
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
            await readApiResponse<AcademicPeriodMutationResponse>(
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
                'Não foi possível atualizar o período letivo.',
              ),
            )
          }

          const updatedPeriod =
            result.data

          setAcademicPeriods(
            currentPeriods => {
              const periodExists =
                currentPeriods.some(
                  period =>
                    period.id ===
                    updatedPeriod.id,
                )

              if (!periodExists) {
                return currentPeriods
              }

              return replaceAcademicPeriod(
                currentPeriods,
                updatedPeriod,
              )
            },
          )

          return updatedPeriod
        } catch (
          updateError
        ) {
          const message =
            updateError instanceof
              Error
              ? updateError.message
              : 'Erro inesperado ao atualizar o período letivo.'

          setError(
            message,
          )

          throw new Error(
            message,
          )
        } finally {
          setUpdatingAcademicPeriodId(
            null,
          )
        }
      },
      [],
    )

  const clearAcademicPeriods =
    useCallback(
      (): void => {
        setAcademicPeriods(
          [],
        )

        setLoadedSchoolYearId(
          null,
        )

        setUpdatingAcademicPeriodId(
          null,
        )

        lastFiltersRef.current =
          null
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

  return {
    academicPeriods,
    loadedSchoolYearId,

    loading:
      loadingAcademicPeriods ||
      creatingAcademicPeriod ||
      updatingAcademicPeriodId !==
        null,

    loadingAcademicPeriods,
    creatingAcademicPeriod,

    updatingAcademicPeriod:
      updatingAcademicPeriodId !==
      null,

    updatingAcademicPeriodId,

    error,

    loadAcademicPeriods,
    reloadAcademicPeriods,

    createAcademicPeriod,
    updateAcademicPeriod,

    clearAcademicPeriods,
    clearError,
  }
}