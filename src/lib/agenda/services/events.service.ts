import { randomUUID } from 'node:crypto'

import {
  eventsRepository,
  type AgendaEvent,
  type AgendaRecurrenceFrequency,
  type AgendaScheduleMode,
  type CreateAgendaEventInput,
  type UpdateAgendaEventInput,
} from '@/lib/agenda/repository/events.repository'

const MAX_RECURRENCE_OCCURRENCES = 104
const MAX_DELETION_REASON_LENGTH = 500
const AGENDA_TIMEZONE = 'America/Sao_Paulo'

export type DeleteAgendaEventContext = {
  actorUserId: string
  reason: string
}

function validateRequiredId(
  value: string,
  fieldName: string,
): string {
  const normalizedValue = value?.trim()

  if (!normalizedValue) {
    throw new Error(`${fieldName} é obrigatório.`)
  }

  return normalizedValue
}

function validateDeletionReason(
  value: string,
): string {
  const normalizedValue = value?.trim()

  if (!normalizedValue) {
    throw new Error(
      'Motivo da exclusão é obrigatório.',
    )
  }

  if (
    normalizedValue.length >
    MAX_DELETION_REASON_LENGTH
  ) {
    throw new Error(
      `O motivo da exclusão não pode ultrapassar ${MAX_DELETION_REASON_LENGTH} caracteres.`,
    )
  }

  return normalizedValue
}

function normalizeDeleteContext(
  context: DeleteAgendaEventContext,
): DeleteAgendaEventContext {
  if (!context) {
    throw new Error(
      'Os dados de auditoria da exclusão são obrigatórios.',
    )
  }

  return {
    actorUserId: validateRequiredId(
      context.actorUserId,
      'ID do usuário responsável',
    ),

    reason: validateDeletionReason(
      context.reason,
    ),
  }
}

function validateDateOnly(
  value: string,
  fieldName: string,
): string {
  const normalizedValue = value.trim()

  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedValue)) {
    throw new Error(
      `${fieldName} deve estar no formato YYYY-MM-DD.`,
    )
  }

  const parsedDate = new Date(
    `${normalizedValue}T00:00:00.000Z`,
  )

  if (
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.toISOString().slice(0, 10) !==
      normalizedValue
  ) {
    throw new Error(`${fieldName} é inválida.`)
  }

  return normalizedValue
}

function parseDateTime(
  value: string,
  fieldName: string,
): Date {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    throw new Error(`${fieldName} é inválida.`)
  }

  return date
}

function getDateKeyInTimezone(
  date: Date,
): string {
  const parts = new Intl.DateTimeFormat(
    'en-CA',
    {
      timeZone: AGENDA_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    },
  ).formatToParts(date)

  const year = parts.find(
    (part) => part.type === 'year',
  )?.value

  const month = parts.find(
    (part) => part.type === 'month',
  )?.value

  const day = parts.find(
    (part) => part.type === 'day',
  )?.value

  if (!year || !month || !day) {
    throw new Error(
      'Não foi possível calcular a data da ocorrência.',
    )
  }

  return `${year}-${month}-${day}`
}

function addWeeks(
  date: Date,
  numberOfWeeks: number,
): Date {
  const result = new Date(date)

  result.setUTCDate(
    result.getUTCDate() +
      numberOfWeeks * 7,
  )

  return result
}

function normalizeScheduleMode(
  input: CreateAgendaEventInput,
): AgendaScheduleMode {
  if (input.schedule_mode) {
    return input.schedule_mode
  }

  if (
    input.recurrence_frequency ===
    'weekly'
  ) {
    return 'recorrente'
  }

  return 'pontual'
}

function normalizeRecurrenceFrequency(
  scheduleMode: AgendaScheduleMode,
  frequency:
    | AgendaRecurrenceFrequency
    | undefined,
): AgendaRecurrenceFrequency {
  if (scheduleMode === 'recorrente') {
    return 'weekly'
  }

  return frequency ?? 'none'
}

function normalizeRecurrenceInterval(
  value: number | undefined,
): number {
  const interval = value ?? 1

  if (
    !Number.isInteger(interval) ||
    interval < 1 ||
    interval > 52
  ) {
    throw new Error(
      'O intervalo de repetição deve estar entre 1 e 52 semanas.',
    )
  }

  return interval
}

function validateDateRange(
  startAtValue: string,
  endAtValue?: string | null,
): {
  startAt: Date
  endAt: Date | null
} {
  const startAt = parseDateTime(
    startAtValue,
    'Data inicial do evento',
  )

  if (!endAtValue) {
    return {
      startAt,
      endAt: null,
    }
  }

  const endAt = parseDateTime(
    endAtValue,
    'Data final do evento',
  )

  if (endAt.getTime() < startAt.getTime()) {
    throw new Error(
      'A data final não pode ser anterior à data inicial.',
    )
  }

  return {
    startAt,
    endAt,
  }
}

function normalizeCreateInput(
  input: CreateAgendaEventInput,
): CreateAgendaEventInput {
  const title = input.title?.trim()

  if (!title) {
    throw new Error(
      'Título do evento é obrigatório.',
    )
  }

  if (!input.start_at) {
    throw new Error(
      'Data inicial do evento é obrigatória.',
    )
  }

  validateDateRange(
    input.start_at,
    input.end_at,
  )

  const scheduleMode =
    normalizeScheduleMode(input)

  if (scheduleMode === 'modelo') {
    throw new Error(
      'Horários-padrão devem ser cadastrados como modelos de agenda.',
    )
  }

  const recurrenceFrequency =
    normalizeRecurrenceFrequency(
      scheduleMode,
      input.recurrence_frequency,
    )

  const recurrenceInterval =
    normalizeRecurrenceInterval(
      input.recurrence_interval,
    )

  let recurrenceUntil:
    | string
    | null = null

  if (scheduleMode === 'recorrente') {
    if (!input.recurrence_until) {
      throw new Error(
        'Informe até quando o evento deverá se repetir.',
      )
    }

    recurrenceUntil = validateDateOnly(
      input.recurrence_until,
      'Data final da recorrência',
    )

    const firstOccurrenceDate =
      getDateKeyInTimezone(
        new Date(input.start_at),
      )

    if (
      recurrenceUntil <
      firstOccurrenceDate
    ) {
      throw new Error(
        'A data final da recorrência não pode ser anterior ao primeiro evento.',
      )
    }
  }

  return {
    ...input,

    title,

    description:
      input.description?.trim() ||
      null,

    event_type:
      input.event_type?.trim() ||
      'pedagogico',

    status:
      input.status?.trim() ||
      'planejado',

    priority:
      input.priority?.trim() ||
      'media',

    schedule_mode: scheduleMode,

    recurrence_frequency:
      recurrenceFrequency,

    recurrence_interval:
      recurrenceInterval,

    recurrence_until:
      recurrenceUntil,

    is_exception:
      input.is_exception ?? false,
  }
}

function buildRecurringOccurrences(
  input: CreateAgendaEventInput,
): CreateAgendaEventInput[] {
  const recurrenceUntil =
    input.recurrence_until

  if (!recurrenceUntil) {
    throw new Error(
      'A data final da recorrência é obrigatória.',
    )
  }

  const recurrenceInterval =
    normalizeRecurrenceInterval(
      input.recurrence_interval,
    )

  const {
    startAt,
    endAt,
  } = validateDateRange(
    input.start_at,
    input.end_at,
  )

  const durationInMilliseconds =
    endAt
      ? endAt.getTime() -
        startAt.getTime()
      : null

  const seriesId =
    input.series_id ??
    randomUUID()

  const originalStartAt =
    input.original_start_at ??
    startAt.toISOString()

  const occurrences: CreateAgendaEventInput[] =
    []

  let currentStartAt =
    new Date(startAt)

  while (
    getDateKeyInTimezone(
      currentStartAt,
    ) <= recurrenceUntil
  ) {
    if (
      occurrences.length >=
      MAX_RECURRENCE_OCCURRENCES
    ) {
      throw new Error(
        `A recorrência não pode ultrapassar ${MAX_RECURRENCE_OCCURRENCES} ocorrências.`,
      )
    }

    const currentEndAt =
      durationInMilliseconds !== null
        ? new Date(
            currentStartAt.getTime() +
              durationInMilliseconds,
          )
        : null

    occurrences.push({
      ...input,

      start_at:
        currentStartAt.toISOString(),

      end_at:
        currentEndAt
          ? currentEndAt.toISOString()
          : null,

      schedule_mode: 'recorrente',

      recurrence_frequency:
        'weekly',

      recurrence_interval:
        recurrenceInterval,

      recurrence_until:
        recurrenceUntil,

      series_id: seriesId,

      original_start_at:
        originalStartAt,

      is_exception: false,
    })

    currentStartAt = addWeeks(
      currentStartAt,
      recurrenceInterval,
    )
  }

  return occurrences
}

class EventsService {
  async listAll(): Promise<
    AgendaEvent[]
  > {
    return eventsRepository.findAll()
  }

  async getById(
    id: string,
  ): Promise<AgendaEvent> {
    const normalizedId =
      validateRequiredId(
        id,
        'ID do evento',
      )

    const event =
      await eventsRepository.findById(
        normalizedId,
      )

    if (!event) {
      throw new Error(
        'Evento não encontrado.',
      )
    }

    return event
  }

  async listByUserId(
    userId: string,
  ): Promise<AgendaEvent[]> {
    const normalizedUserId =
      validateRequiredId(
        userId,
        'ID do usuário',
      )

    return eventsRepository.findByUserId(
      normalizedUserId,
    )
  }

  async listByUserAndWeek(
    userId: string,
    weekReference: string,
  ): Promise<AgendaEvent[]> {
    const normalizedUserId =
      validateRequiredId(
        userId,
        'ID do usuário',
      )

    const normalizedWeek =
      validateDateOnly(
        weekReference,
        'Semana de referência',
      )

    return eventsRepository.findByUserAndWeek(
      normalizedUserId,
      normalizedWeek,
    )
  }

  async listBySchoolId(
    schoolId: string,
  ): Promise<AgendaEvent[]> {
    const normalizedSchoolId =
      validateRequiredId(
        schoolId,
        'ID da escola',
      )

    return eventsRepository.findBySchoolId(
      normalizedSchoolId,
    )
  }

  async listBySeriesId(
    seriesId: string,
  ): Promise<AgendaEvent[]> {
    const normalizedSeriesId =
      validateRequiredId(
        seriesId,
        'ID da série',
      )

    return eventsRepository.findBySeriesId(
      normalizedSeriesId,
    )
  }

  async create(
    input: CreateAgendaEventInput,
  ): Promise<AgendaEvent> {
    const events =
      await this.createSchedule(input)

    const firstEvent = events[0]

    if (!firstEvent) {
      throw new Error(
        'Nenhum evento foi criado.',
      )
    }

    return firstEvent
  }

  async createSchedule(
    input: CreateAgendaEventInput,
  ): Promise<AgendaEvent[]> {
    const normalizedInput =
      normalizeCreateInput(input)

    if (
      normalizedInput.schedule_mode ===
        'recorrente' &&
      normalizedInput.recurrence_frequency ===
        'weekly'
    ) {
      const occurrences =
        buildRecurringOccurrences(
          normalizedInput,
        )

      return eventsRepository.createMany(
        occurrences,
      )
    }

    const event =
      await eventsRepository.create({
        ...normalizedInput,

        schedule_mode: 'pontual',

        recurrence_frequency:
          'none',

        recurrence_interval: 1,

        recurrence_until: null,

        series_id: null,

        original_start_at: null,

        is_exception: false,
      })

    return [event]
  }

  async update(
    id: string,
    input: UpdateAgendaEventInput,
  ): Promise<AgendaEvent> {
    const normalizedId =
      validateRequiredId(
        id,
        'ID do evento',
      )

    const existingEvent =
      await eventsRepository.findById(
        normalizedId,
      )

    if (!existingEvent) {
      throw new Error(
        'Evento não encontrado.',
      )
    }

    const startAtValue =
      input.start_at ??
      existingEvent.start_at

    const endAtValue =
      input.end_at !== undefined
        ? input.end_at
        : existingEvent.end_at

    validateDateRange(
      startAtValue,
      endAtValue,
    )

    const normalizedInput:
      UpdateAgendaEventInput = {
        ...input,
      }

    if (input.title !== undefined) {
      const title =
        input.title.trim()

      if (!title) {
        throw new Error(
          'Título do evento não pode ficar vazio.',
        )
      }

      normalizedInput.title =
        title
    }

    if (
      input.description !== undefined
    ) {
      normalizedInput.description =
        input.description?.trim() ||
        null
    }

    if (
      input.event_type !== undefined
    ) {
      normalizedInput.event_type =
        input.event_type.trim() ||
        'pedagogico'
    }

    if (
      input.status !== undefined
    ) {
      normalizedInput.status =
        input.status.trim() ||
        'planejado'
    }

    if (
      input.priority !== undefined
    ) {
      normalizedInput.priority =
        input.priority.trim() ||
        'media'
    }

    if (
      input.recurrence_interval !==
      undefined
    ) {
      normalizedInput.recurrence_interval =
        normalizeRecurrenceInterval(
          input.recurrence_interval,
        )
    }

    if (
      input.recurrence_until !==
        undefined &&
      input.recurrence_until !== null
    ) {
      normalizedInput.recurrence_until =
        validateDateOnly(
          input.recurrence_until,
          'Data final da recorrência',
        )
    }

    return eventsRepository.update(
      normalizedId,
      normalizedInput,
    )
  }

  async delete(
    id: string,
    context: DeleteAgendaEventContext,
  ): Promise<void> {
    const normalizedId =
      validateRequiredId(
        id,
        'ID do evento',
      )

    const normalizedContext =
      normalizeDeleteContext(context)

    const existingEvent =
      await eventsRepository.findById(
        normalizedId,
      )

    if (!existingEvent) {
      throw new Error(
        'Evento não encontrado ou já excluído.',
      )
    }

    await eventsRepository.delete(
      normalizedId,
      normalizedContext.actorUserId,
      normalizedContext.reason,
    )
  }

  async deleteSeriesFromDate(
    seriesId: string,
    startAt: string,
    context: DeleteAgendaEventContext,
  ): Promise<void> {
    const normalizedSeriesId =
      validateRequiredId(
        seriesId,
        'ID da série',
      )

    const normalizedStartAt =
      parseDateTime(
        startAt,
        'Data inicial',
      ).toISOString()

    const normalizedContext =
      normalizeDeleteContext(context)

    await eventsRepository.deleteSeriesFromDate(
      normalizedSeriesId,
      normalizedStartAt,
      normalizedContext.actorUserId,
      normalizedContext.reason,
    )
  }
}

export const eventsService =
  new EventsService()