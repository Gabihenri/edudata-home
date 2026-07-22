'use client'

import {
  useCallback,
  useRef,
  useState,
} from 'react'

import type {
  InstitutionalCalendarDateRule,
  InstitutionalCalendarEvent,
  InstitutionalCalendarEventStatus,
  InstitutionalCalendarEventType,
  InstitutionalCalendarPriority,
  InstitutionalCalendarSourceType,
} from '@/lib/agenda/repository/institutional-academic-calendar.repository'

export type InstitutionalAcademicEventFilters = {
  schoolYearId: string

  calendarYear?: number

  startDate?: string
  endDate?: string

  eventTypes?:
    InstitutionalCalendarEventType[]

  statuses?:
    InstitutionalCalendarEventStatus[]

  priorities?:
    InstitutionalCalendarPriority[]

  includeDeleted?: boolean
}

export type CreateInstitutionalAcademicEventRequest = {
  organizationId: string
  schoolId: string
  schoolYearId: string

  academicPeriodId?:
    | string
    | null

  calendarYear: number

  title: string

  description?:
    | string
    | null

  eventType:
    InstitutionalCalendarEventType

  dateRule?:
    InstitutionalCalendarDateRule

  sourceType?:
    InstitutionalCalendarSourceType

  sourceReference?:
    | string
    | null

  jurisdictionCountry?:
    | string
    | null

  jurisdictionState?:
    | string
    | null

  jurisdictionCity?:
    | string
    | null

  startDate: string
  endDate: string

  allDay?: boolean

  startTime?:
    | string
    | null

  endTime?:
    | string
    | null

  fixedMonth?:
    | number
    | null

  fixedDay?:
    | number
    | null

  isInstructionalDay?: boolean
  countsAsSchoolDay?: boolean
  suspendsClasses?: boolean
  isMandatory?: boolean

  priority?:
    InstitutionalCalendarPriority
}

type BaseApiResponse = {
  success: boolean

  error?: string
  message?: string
}

type InstitutionalEventsApiResponse =
  BaseApiResponse & {
    mode?:
      'institutional-calendar-events'

    total?: number

    data?:
      InstitutionalCalendarEvent[]
  }

type InstitutionalEventMutationResponse =
  BaseApiResponse & {
    data?:
      InstitutionalCalendarEvent
  }

const API_URL =
  '/api/agenda/institutional-calendar/events'

const DATE_PATTERN =
  /^\d{4}-\d{2}-\d{2}$/

const TIME_PATTERN =
  /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/

const PRIORITY_ORDER:
  Record<
    InstitutionalCalendarPriority,
    number
  > = {
    critical: 0,
    high: 1,
    normal: 2,
  }

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

function normalizeOptionalInteger(
  value:
    | number
    | null
    | undefined,

  fieldName: string,
): number | null | undefined {
  if (
    value === undefined ||
    value === null
  ) {
    return value
  }

  return normalizeRequiredInteger(
    value,
    fieldName,
  )
}

function normalizeDate(
  value: string,
  fieldName: string,
): string {
  const normalizedValue =
    normalizeRequiredText(
      value,
      fieldName,
    )

  if (
    !DATE_PATTERN.test(
      normalizedValue,
    )
  ) {
    throw new Error(
      `${fieldName} deve utilizar o formato AAAA-MM-DD.`,
    )
  }

  return normalizedValue
}

function normalizeOptionalDate(
  value:
    | string
    | undefined,

  fieldName: string,
): string | undefined {
  if (!value?.trim()) {
    return undefined
  }

  return normalizeDate(
    value,
    fieldName,
  )
}

function normalizeOptionalTime(
  value:
    | string
    | null
    | undefined,

  fieldName: string,
): string | null | undefined {
  if (
    value === undefined
  ) {
    return undefined
  }

  if (
    value === null ||
    !value.trim()
  ) {
    return null
  }

  const normalizedValue =
    value.trim()

  if (
    !TIME_PATTERN.test(
      normalizedValue,
    )
  ) {
    throw new Error(
      `${fieldName} deve utilizar o formato HH:MM.`,
    )
  }

  return normalizedValue
}

function validateCalendarYear(
  value: number,
): number {
  const normalizedValue =
    normalizeRequiredInteger(
      value,
      'Ano do calendário',
    )

  if (
    normalizedValue < 2000 ||
    normalizedValue > 2100
  ) {
    throw new Error(
      'Ano do calendário deve estar entre 2000 e 2100.',
    )
  }

  return normalizedValue
}

function validateDateRange(
  startDate: string,
  endDate: string,
): void {
  if (
    endDate < startDate
  ) {
    throw new Error(
      'A data final não pode ser anterior à data inicial.',
    )
  }
}

function validateOptionalRangeInteger(
  value:
    | number
    | null
    | undefined,

  fieldName: string,

  minimumValue: number,
  maximumValue: number,
): number | null | undefined {
  const normalizedValue =
    normalizeOptionalInteger(
      value,
      fieldName,
    )

  if (
    normalizedValue ===
      undefined ||
    normalizedValue ===
      null
  ) {
    return normalizedValue
  }

  if (
    normalizedValue <
      minimumValue ||
    normalizedValue >
      maximumValue
  ) {
    throw new Error(
      `${fieldName} deve estar entre ${minimumValue} e ${maximumValue}.`,
    )
  }

  return normalizedValue
}

function buildEventsUrl(
  filters:
    InstitutionalAcademicEventFilters,
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
    filters.calendarYear !==
    undefined
  ) {
    parameters.set(
      'calendarYear',
      String(
        validateCalendarYear(
          filters.calendarYear,
        ),
      ),
    )
  }

  const startDate =
    normalizeOptionalDate(
      filters.startDate,
      'Data inicial',
    )

  const endDate =
    normalizeOptionalDate(
      filters.endDate,
      'Data final',
    )

  if (
    startDate &&
    endDate
  ) {
    validateDateRange(
      startDate,
      endDate,
    )
  }

  if (startDate) {
    parameters.set(
      'startDate',
      startDate,
    )
  }

  if (endDate) {
    parameters.set(
      'endDate',
      endDate,
    )
  }

  if (
    filters.eventTypes?.length
  ) {
    parameters.set(
      'eventTypes',
      filters.eventTypes.join(
        ',',
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
    filters.priorities?.length
  ) {
    parameters.set(
      'priorities',
      filters.priorities.join(
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

function sortInstitutionalEvents(
  events:
    InstitutionalCalendarEvent[],
): InstitutionalCalendarEvent[] {
  return [
    ...events,
  ].sort(
    (
      firstEvent,
      secondEvent,
    ) => {
      const startDateComparison =
        firstEvent
          .start_date
          .localeCompare(
            secondEvent
              .start_date,
          )

      if (
        startDateComparison !==
        0
      ) {
        return startDateComparison
      }

      const endDateComparison =
        firstEvent
          .end_date
          .localeCompare(
            secondEvent
              .end_date,
          )

      if (
        endDateComparison !==
        0
      ) {
        return endDateComparison
      }

      const priorityComparison =
        PRIORITY_ORDER[
          firstEvent.priority
        ] -
        PRIORITY_ORDER[
          secondEvent.priority
        ]

      if (
        priorityComparison !==
        0
      ) {
        return priorityComparison
      }

      return firstEvent
        .title
        .localeCompare(
          secondEvent.title,
          'pt-BR',
        )
    },
  )
}

function replaceInstitutionalEvent(
  events:
    InstitutionalCalendarEvent[],

  event:
    InstitutionalCalendarEvent,
): InstitutionalCalendarEvent[] {
  return sortInstitutionalEvents([
    ...events.filter(
      currentEvent =>
        currentEvent.id !==
        event.id,
    ),

    event,
  ])
}

function createEventPayload(
  input:
    CreateInstitutionalAcademicEventRequest,
): Record<string, unknown> {
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

  const calendarYear =
    validateCalendarYear(
      input.calendarYear,
    )

  const title =
    normalizeRequiredText(
      input.title,
      'Título do evento',
    )

  const startDate =
    normalizeDate(
      input.startDate,
      'Data inicial',
    )

  const endDate =
    normalizeDate(
      input.endDate,
      'Data final',
    )

  validateDateRange(
    startDate,
    endDate,
  )

  const allDay =
    input.allDay ??
    true

  const startTime =
    normalizeOptionalTime(
      input.startTime,
      'Horário inicial',
    )

  const endTime =
    normalizeOptionalTime(
      input.endTime,
      'Horário final',
    )

  if (
    !allDay &&
    !startTime
  ) {
    throw new Error(
      'Informe o horário inicial para eventos que não ocupam o dia inteiro.',
    )
  }

  const fixedMonth =
    validateOptionalRangeInteger(
      input.fixedMonth,
      'Mês fixo',
      1,
      12,
    )

  const fixedDay =
    validateOptionalRangeInteger(
      input.fixedDay,
      'Dia fixo',
      1,
      31,
    )

  const dateRule =
    input.dateRule ??
    'year_specific'

  if (
    dateRule ===
      'fixed_annual' &&
    (
      !fixedMonth ||
      !fixedDay
    )
  ) {
    throw new Error(
      'Eventos anuais fixos devem possuir mês e dia.',
    )
  }

  return {
    organizationId,
    schoolId,
    schoolYearId,

    academicPeriodId:
      normalizeOptionalText(
        input.academicPeriodId,
      ),

    calendarYear,

    title,

    description:
      normalizeOptionalText(
        input.description,
      ),

    eventType:
      input.eventType,

    dateRule,

    sourceType:
      input.sourceType ??
      'institutional',

    sourceReference:
      normalizeOptionalText(
        input.sourceReference,
      ),

    jurisdictionCountry:
      normalizeOptionalText(
        input.jurisdictionCountry,
      ) ??
      'Brasil',

    jurisdictionState:
      normalizeOptionalText(
        input.jurisdictionState,
      ),

    jurisdictionCity:
      normalizeOptionalText(
        input.jurisdictionCity,
      ),

    startDate,
    endDate,

    allDay,

    startTime:
      allDay
        ? null
        : startTime,

    endTime:
      allDay
        ? null
        : endTime,

    fixedMonth,
    fixedDay,

    isInstructionalDay:
      input.isInstructionalDay ??
      false,

    countsAsSchoolDay:
      input.countsAsSchoolDay ??
      false,

    suspendsClasses:
      input.suspendsClasses ??
      false,

    isMandatory:
      input.isMandatory ??
      false,

    priority:
      input.priority ??
      'normal',
  }
}

export function useInstitutionalAcademicEvents() {
  const [
    institutionalEvents,
    setInstitutionalEvents,
  ] =
    useState<
      InstitutionalCalendarEvent[]
    >([])

  const [
    loadedSchoolYearId,
    setLoadedSchoolYearId,
  ] =
    useState<string | null>(
      null,
    )

  const [
    loadingInstitutionalEvents,
    setLoadingInstitutionalEvents,
  ] =
    useState(false)

  const [
    creatingInstitutionalEvent,
    setCreatingInstitutionalEvent,
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
      InstitutionalAcademicEventFilters |
      null
    >(null)

  const loadInstitutionalEvents =
    useCallback(
      async (
        filters:
          InstitutionalAcademicEventFilters,
      ): Promise<
        InstitutionalCalendarEvent[]
      > => {
        const schoolYearId =
          normalizeRequiredText(
            filters.schoolYearId,
            'Ano letivo',
          )

        const normalizedFilters:
          InstitutionalAcademicEventFilters = {
            ...filters,
            schoolYearId,
          }

        lastFiltersRef.current =
          normalizedFilters

        setLoadingInstitutionalEvents(
          true,
        )

        setError(
          null,
        )

        try {
          const response =
            await fetch(
              buildEventsUrl(
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
            await readApiResponse<InstitutionalEventsApiResponse>(
              response,
            )

          if (
            !response.ok ||
            !result.success ||
            result.mode !==
              'institutional-calendar-events' ||
            !Array.isArray(
              result.data,
            )
          ) {
            throw new Error(
              getResponseError(
                result,
                'Não foi possível carregar os eventos institucionais.',
              ),
            )
          }

          const nextEvents =
            sortInstitutionalEvents(
              result.data,
            )

          setInstitutionalEvents(
            nextEvents,
          )

          setLoadedSchoolYearId(
            schoolYearId,
          )

          return nextEvents
        } catch (
          loadError
        ) {
          const message =
            loadError instanceof
              Error
              ? loadError.message
              : 'Erro inesperado ao carregar os eventos institucionais.'

          setError(
            message,
          )

          setInstitutionalEvents(
            [],
          )

          setLoadedSchoolYearId(
            null,
          )

          throw new Error(
            message,
          )
        } finally {
          setLoadingInstitutionalEvents(
            false,
          )
        }
      },
      [],
    )

  const reloadInstitutionalEvents =
    useCallback(
      async (): Promise<
        InstitutionalCalendarEvent[]
      > => {
        if (
          !lastFiltersRef.current
        ) {
          return []
        }

        return loadInstitutionalEvents(
          lastFiltersRef.current,
        )
      },
      [
        loadInstitutionalEvents,
      ],
    )

  const createInstitutionalEvent =
    useCallback(
      async (
        input:
          CreateInstitutionalAcademicEventRequest,
      ): Promise<
        InstitutionalCalendarEvent
      > => {
        const payload =
          createEventPayload(
            input,
          )

        setCreatingInstitutionalEvent(
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
                  JSON.stringify(
                    payload,
                  ),
              },
            )

          const result =
            await readApiResponse<InstitutionalEventMutationResponse>(
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
                'Não foi possível criar o evento institucional.',
              ),
            )
          }

          const createdEvent =
            result.data

          if (
            loadedSchoolYearId ===
            createdEvent
              .school_year_id
          ) {
            setInstitutionalEvents(
              currentEvents =>
                replaceInstitutionalEvent(
                  currentEvents,
                  createdEvent,
                ),
            )
          }

          return createdEvent
        } catch (
          createError
        ) {
          const message =
            createError instanceof
              Error
              ? createError.message
              : 'Erro inesperado ao criar o evento institucional.'

          setError(
            message,
          )

          throw new Error(
            message,
          )
        } finally {
          setCreatingInstitutionalEvent(
            false,
          )
        }
      },
      [
        loadedSchoolYearId,
      ],
    )

  const clearInstitutionalEvents =
    useCallback(
      (): void => {
        setInstitutionalEvents(
          [],
        )

        setLoadedSchoolYearId(
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
    institutionalEvents,
    loadedSchoolYearId,

    loading:
      loadingInstitutionalEvents ||
      creatingInstitutionalEvent,

    loadingInstitutionalEvents,
    creatingInstitutionalEvent,

    error,

    loadInstitutionalEvents,
    reloadInstitutionalEvents,

    createInstitutionalEvent,

    clearInstitutionalEvents,
    clearError,
  }
}