import {
  scheduleTemplatesRepository,
  type AgendaScheduleTemplate,
  type CreateScheduleTemplateInput,
  type UpdateScheduleTemplateInput,
} from '@/lib/agenda/repository/schedule-templates.repository'

import {
  eventsRepository,
  type AgendaEvent,
  type CreateAgendaEventInput,
} from '@/lib/agenda/repository/events.repository'

type CreateTemplateServiceInput =
  Omit<CreateScheduleTemplateInput, 'user_id'>

export type ApplyTemplateSkipReason =
  | 'already_applied'
  | 'before_validity'
  | 'after_validity'
  | 'outside_interval'

export type ApplyTemplateSkip = {
  templateId: string
  title: string
  reason: ApplyTemplateSkipReason
}

export type ApplyTemplatesResult = {
  weekReference: string
  totalTemplates: number
  totalCreated: number
  totalSkipped: number
  created: AgendaEvent[]
  skipped: ApplyTemplateSkip[]
}

const MILLISECONDS_PER_WEEK =
  7 * 24 * 60 * 60 * 1000

function validateRequiredText(
  value: string,
  fieldName: string,
): string {
  const normalizedValue = value?.trim()

  if (!normalizedValue) {
    throw new Error(`${fieldName} é obrigatório.`)
  }

  return normalizedValue
}

function validateDateKey(
  value: string,
  fieldName: string,
): string {
  const normalizedValue =
    validateRequiredText(value, fieldName)

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      normalizedValue,
    )
  ) {
    throw new Error(
      `${fieldName} deve estar no formato YYYY-MM-DD.`,
    )
  }

  const [year, month, day] =
    normalizedValue.split('-').map(Number)

  const date = new Date(
    Date.UTC(year, month - 1, day),
  )

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error(`${fieldName} é inválida.`)
  }

  return normalizedValue
}

function parseDateKey(
  value: string,
): Date {
  const [year, month, day] =
    value.split('-').map(Number)

  return new Date(
    Date.UTC(year, month - 1, day),
  )
}

function formatDateKey(
  date: Date,
): string {
  const year = date.getUTCFullYear()

  const month = String(
    date.getUTCMonth() + 1,
  ).padStart(2, '0')

  const day = String(
    date.getUTCDate(),
  ).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function addDaysToDateKey(
  dateKey: string,
  numberOfDays: number,
): string {
  const date = parseDateKey(dateKey)

  date.setUTCDate(
    date.getUTCDate() + numberOfDays,
  )

  return formatDateKey(date)
}

function getWeekReference(
  dateKey: string,
): string {
  const date = parseDateKey(dateKey)

  const weekday =
    date.getUTCDay() === 0
      ? 7
      : date.getUTCDay()

  date.setUTCDate(
    date.getUTCDate() - weekday + 1,
  )

  return formatDateKey(date)
}

function getWeekDifference(
  firstWeek: string,
  secondWeek: string,
): number {
  const firstDate =
    parseDateKey(firstWeek)

  const secondDate =
    parseDateKey(secondWeek)

  return Math.floor(
    (
      secondDate.getTime() -
      firstDate.getTime()
    ) / MILLISECONDS_PER_WEEK,
  )
}

function normalizeTime(
  value: string,
): string {
  const normalizedValue =
    value.trim()

  if (
    !/^\d{2}:\d{2}(:\d{2})?$/.test(
      normalizedValue,
    )
  ) {
    throw new Error(
      'O horário deve estar no formato HH:MM.',
    )
  }

  return normalizedValue.length === 5
    ? `${normalizedValue}:00`
    : normalizedValue
}

function getTimeZoneOffsetMilliseconds(
  date: Date,
  timeZone: string,
): number {
  const formatter =
    new Intl.DateTimeFormat(
      'en-US',
      {
        timeZone,
        hourCycle: 'h23',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      },
    )

  const parts =
    formatter.formatToParts(date)

  const values: Record<string, string> = {}

  for (const part of parts) {
    if (part.type !== 'literal') {
      values[part.type] = part.value
    }
  }

  const representedAsUtc = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
    Number(values.second),
  )

  return (
    representedAsUtc -
    date.getTime()
  )
}

function createZonedDateTime(
  dateKey: string,
  timeValue: string,
  timeZone: string,
): string {
  const [year, month, day] =
    dateKey.split('-').map(Number)

  const normalizedTime =
    normalizeTime(timeValue)

  const [hour, minute, second] =
    normalizedTime.split(':').map(Number)

  const localTimestamp = Date.UTC(
    year,
    month - 1,
    day,
    hour,
    minute,
    second,
  )

  let utcTimestamp = localTimestamp

  for (
    let iteration = 0;
    iteration < 3;
    iteration += 1
  ) {
    const offset =
      getTimeZoneOffsetMilliseconds(
        new Date(utcTimestamp),
        timeZone,
      )

    utcTimestamp =
      localTimestamp - offset
  }

  return new Date(
    utcTimestamp,
  ).toISOString()
}

function ensureTemplateOwnership(
  template:
    | AgendaScheduleTemplate
    | null,
  userId: string,
): AgendaScheduleTemplate {
  if (!template) {
    throw new Error(
      'Horário-padrão não encontrado.',
    )
  }

  if (template.user_id !== userId) {
    throw new Error(
      'Você não tem permissão para acessar este horário-padrão.',
    )
  }

  return template
}

function isTemplateInsideValidity(
  template: AgendaScheduleTemplate,
  eventDate: string,
): ApplyTemplateSkipReason | null {
  if (
    template.valid_from &&
    eventDate < template.valid_from
  ) {
    return 'before_validity'
  }

  if (
    template.valid_until &&
    eventDate > template.valid_until
  ) {
    return 'after_validity'
  }

  return null
}

function isTemplateInRecurrenceInterval(
  template: AgendaScheduleTemplate,
  selectedWeek: string,
): boolean {
  const interval =
    template.repeat_interval_weeks || 1

  if (interval === 1) {
    return true
  }

  const anchorDate =
    template.valid_from ??
    template.created_at.slice(0, 10)

  const anchorWeek =
    getWeekReference(anchorDate)

  const difference =
    getWeekDifference(
      anchorWeek,
      selectedWeek,
    )

  if (difference < 0) {
    return false
  }

  return difference % interval === 0
}

function buildEventFromTemplate(
  template: AgendaScheduleTemplate,
  weekReference: string,
  userId: string,
): CreateAgendaEventInput {
  const eventDate =
    addDaysToDateKey(
      weekReference,
      template.weekday - 1,
    )

  const startAt =
    createZonedDateTime(
      eventDate,
      template.start_time,
      template.timezone,
    )

  const endAt =
    template.end_time
      ? createZonedDateTime(
          eventDate,
          template.end_time,
          template.timezone,
        )
      : null

  return {
    title: template.title,

    description:
      template.description,

    event_type:
      template.event_type,

    start_at: startAt,

    end_at: endAt,

    status: 'planejado',

    priority:
      template.priority,

    school_id:
      template.school_id,

    user_id: userId,

    schedule_mode: 'modelo',

    recurrence_frequency:
      'weekly',

    recurrence_interval:
      template.repeat_interval_weeks,

    recurrence_until:
      template.valid_until,

    series_id:
      template.id,

    source_template_id:
      template.id,

    week_reference:
      weekReference,

    original_start_at:
      startAt,

    is_exception: false,
  }
}

class ScheduleTemplatesService {
  async listForUser(
    userId: string,
    activeOnly = true,
  ): Promise<AgendaScheduleTemplate[]> {
    const normalizedUserId =
      validateRequiredText(
        userId,
        'ID do usuário',
      )

    return scheduleTemplatesRepository
      .findByUserId(
        normalizedUserId,
        activeOnly,
      )
  }

  async getForUser(
    id: string,
    userId: string,
  ): Promise<AgendaScheduleTemplate> {
    const normalizedId =
      validateRequiredText(
        id,
        'ID do horário-padrão',
      )

    const normalizedUserId =
      validateRequiredText(
        userId,
        'ID do usuário',
      )

    const template =
      await scheduleTemplatesRepository
        .findById(normalizedId)

    return ensureTemplateOwnership(
      template,
      normalizedUserId,
    )
  }

  async createForUser(
    userId: string,
    input: CreateTemplateServiceInput,
  ): Promise<AgendaScheduleTemplate> {
    const normalizedUserId =
      validateRequiredText(
        userId,
        'ID do usuário',
      )

    return scheduleTemplatesRepository
      .create({
        ...input,
        user_id: normalizedUserId,
      })
  }

  async updateForUser(
    id: string,
    userId: string,
    input: UpdateScheduleTemplateInput,
  ): Promise<AgendaScheduleTemplate> {
    const template =
      await this.getForUser(
        id,
        userId,
      )

    return scheduleTemplatesRepository
      .update(
        template.id,
        input,
      )
  }

  async setActiveForUser(
    id: string,
    userId: string,
    active: boolean,
  ): Promise<AgendaScheduleTemplate> {
    const template =
      await this.getForUser(
        id,
        userId,
      )

    if (active) {
      return scheduleTemplatesRepository
        .activate(template.id)
    }

    return scheduleTemplatesRepository
      .deactivate(template.id)
  }

  async deleteForUser(
    id: string,
    userId: string,
  ): Promise<void> {
    const template =
      await this.getForUser(
        id,
        userId,
      )

    await scheduleTemplatesRepository
      .delete(template.id)
  }

  async applyToWeek(
    userId: string,
    weekReference: string,
    templateIds?: string[],
  ): Promise<ApplyTemplatesResult> {
    const normalizedUserId =
      validateRequiredText(
        userId,
        'ID do usuário',
      )

    const normalizedWeek =
      validateDateKey(
        weekReference,
        'Semana de referência',
      )

    if (
      getWeekReference(
        normalizedWeek,
      ) !== normalizedWeek
    ) {
      throw new Error(
        'A semana de referência deve ser uma segunda-feira.',
      )
    }

    const templates =
      await scheduleTemplatesRepository
        .findByUserId(
          normalizedUserId,
          true,
        )

    const normalizedTemplateIds =
      templateIds
        ?.map((id) => id.trim())
        .filter(Boolean)

    const selectedTemplates =
      normalizedTemplateIds?.length
        ? templates.filter(
            (template) =>
              normalizedTemplateIds.includes(
                template.id,
              ),
          )
        : templates

    if (
      normalizedTemplateIds?.length &&
      selectedTemplates.length !==
        new Set(
          normalizedTemplateIds,
        ).size
    ) {
      throw new Error(
        'Um ou mais horários-padrão não foram encontrados.',
      )
    }

    const existingEvents =
      await eventsRepository
        .findByUserAndWeek(
          normalizedUserId,
          normalizedWeek,
        )

    const alreadyAppliedTemplateIds =
      new Set(
        existingEvents
          .map(
            (event) =>
              event.source_template_id,
          )
          .filter(
            (
              templateId,
            ): templateId is string =>
              Boolean(templateId),
          ),
      )

    const eventsToCreate:
      CreateAgendaEventInput[] = []

    const skipped:
      ApplyTemplateSkip[] = []

    for (
      const template of selectedTemplates
    ) {
      if (
        alreadyAppliedTemplateIds.has(
          template.id,
        )
      ) {
        skipped.push({
          templateId: template.id,
          title: template.title,
          reason: 'already_applied',
        })

        continue
      }

      const eventDate =
        addDaysToDateKey(
          normalizedWeek,
          template.weekday - 1,
        )

      const validityReason =
        isTemplateInsideValidity(
          template,
          eventDate,
        )

      if (validityReason) {
        skipped.push({
          templateId: template.id,
          title: template.title,
          reason: validityReason,
        })

        continue
      }

      if (
        !isTemplateInRecurrenceInterval(
          template,
          normalizedWeek,
        )
      ) {
        skipped.push({
          templateId: template.id,
          title: template.title,
          reason: 'outside_interval',
        })

        continue
      }

      eventsToCreate.push(
        buildEventFromTemplate(
          template,
          normalizedWeek,
          normalizedUserId,
        ),
      )
    }

    const created =
      eventsToCreate.length > 0
        ? await eventsRepository
            .createMany(
              eventsToCreate,
            )
        : []

    return {
      weekReference:
        normalizedWeek,

      totalTemplates:
        selectedTemplates.length,

      totalCreated:
        created.length,

      totalSkipped:
        skipped.length,

      created,

      skipped,
    }
  }
}

export const scheduleTemplatesService =
  new ScheduleTemplatesService()