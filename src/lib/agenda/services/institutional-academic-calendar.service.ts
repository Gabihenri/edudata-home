import {
  type AcademicCalendarStatus,
  type AcademicPeriod,
  type AcademicPeriodFilters,
  type AcademicPeriodType,
  type CancelInstitutionalCalendarEventContext,
  type CreateAcademicPeriodInput,
  type CreateInstitutionalCalendarEventInput,
  type CreateSchoolCalendarExceptionInput,
  type CreateSchoolOperatingHoursInput,
  type CreateSchoolYearInput,
  InstitutionalAcademicCalendarRepository,
  type InstitutionalCalendarDateRule,
  type InstitutionalCalendarEvent,
  type InstitutionalCalendarEventFilters,
  type InstitutionalCalendarEventStatus,
  type InstitutionalCalendarEventType,
  type InstitutionalCalendarPriority,
  type InstitutionalCalendarScopeLevel,
  type InstitutionalCalendarSourceType,
  type Json,
  type RestoreCalendarRecordContext,
  type SchoolCalendarException,
  type SchoolCalendarExceptionFilters,
  type SchoolCalendarExceptionStatus,
  type SchoolCalendarOperationMode,
  type SchoolOperatingHours,
  type SchoolOperatingHoursFilters,
  type SchoolOperatingHoursStatus,
  type SchoolYear,
  type SchoolYearFilters,
  type SoftDeleteCalendarRecordContext,
  type UpdateAcademicPeriodInput,
  type UpdateInstitutionalCalendarEventInput,
  type UpdateSchoolCalendarExceptionInput,
  type UpdateSchoolOperatingHoursInput,
  type UpdateSchoolYearInput,
} from '@/lib/agenda/repository/institutional-academic-calendar.repository'

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const DATE_PATTERN =
  /^\d{4}-\d{2}-\d{2}$/

const TIME_PATTERN =
  /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/

const CODE_PATTERN =
  /^[a-z0-9][a-z0-9._-]*$/

const ACADEMIC_CALENDAR_STATUSES:
  readonly AcademicCalendarStatus[] = [
    'draft',
    'published',
    'closed',
    'archived',
  ]

const ACADEMIC_PERIOD_TYPES:
  readonly AcademicPeriodType[] = [
    'bimester',
    'trimester',
    'semester',
    'quarter',
    'term',
    'stage',
    'custom',
  ]

const INSTITUTIONAL_EVENT_TYPES:
  readonly InstitutionalCalendarEventType[] = [
    'holiday',
    'optional_holiday',
    'recess',
    'planning',
    'teacher_training',
    'school_council',
    'assessment',
    'recovery',
    'school_saturday',
    'closure',
    'commemorative',
    'operational',
    'enrollment',
    'deadline',
    'other',
  ]

const INSTITUTIONAL_SCOPE_LEVELS:
  readonly InstitutionalCalendarScopeLevel[] = [
    'national',
    'state',
    'municipal',
    'network',
    'organization',
    'school',
  ]

const INSTITUTIONAL_DATE_RULES:
  readonly InstitutionalCalendarDateRule[] = [
    'fixed_annual',
    'year_specific',
    'movable',
    'conditional',
  ]

const INSTITUTIONAL_SOURCE_TYPES:
  readonly InstitutionalCalendarSourceType[] = [
    'legal',
    'official',
    'institutional',
    'imported',
    'manual',
  ]

const INSTITUTIONAL_PRIORITIES:
  readonly InstitutionalCalendarPriority[] = [
    'normal',
    'high',
    'critical',
  ]

const INSTITUTIONAL_EVENT_STATUSES:
  readonly InstitutionalCalendarEventStatus[] = [
    'draft',
    'published',
    'cancelled',
    'archived',
  ]

const OPERATING_HOURS_STATUSES:
  readonly SchoolOperatingHoursStatus[] = [
    'active',
    'inactive',
    'archived',
  ]

const CALENDAR_OPERATION_MODES:
  readonly SchoolCalendarOperationMode[] = [
    'open',
    'closed',
    'partial',
    'remote',
    'replacement',
  ]

const CALENDAR_EXCEPTION_STATUSES:
  readonly SchoolCalendarExceptionStatus[] = [
    'active',
    'cancelled',
    'archived',
  ]

const DEFAULT_TIMEZONE =
  'America/Sao_Paulo'

const MAX_NAME_LENGTH = 180
const MAX_TITLE_LENGTH = 220
const MAX_DESCRIPTION_LENGTH = 5000
const MAX_REASON_LENGTH = 500
const MAX_REFERENCE_LENGTH = 500
const MAX_CODE_LENGTH = 80
const MAX_LOCATION_LENGTH = 180

export type InstitutionalAcademicCalendarSnapshot = {
  schoolYear: SchoolYear

  periods: AcademicPeriod[]

  events:
    InstitutionalCalendarEvent[]

  operatingHours:
    SchoolOperatingHours[]

  exceptions:
    SchoolCalendarException[]
}

function normalizeRequiredText(
  value:
    | string
    | null
    | undefined,

  fieldName: string,

  maximumLength:
    number = MAX_NAME_LENGTH,
): string {
  const normalizedValue =
    value?.trim()

  if (!normalizedValue) {
    throw new Error(
      `${fieldName} é obrigatório.`,
    )
  }

  if (
    normalizedValue.length >
    maximumLength
  ) {
    throw new Error(
      `${fieldName} não pode ultrapassar ${maximumLength} caracteres.`,
    )
  }

  return normalizedValue
}

function normalizeOptionalText(
  value:
    | string
    | null
    | undefined,

  fieldName: string,

  maximumLength:
    number = MAX_DESCRIPTION_LENGTH,
): string | null {
  if (
    value === undefined ||
    value === null
  ) {
    return null
  }

  const normalizedValue =
    value.trim()

  if (!normalizedValue) {
    return null
  }

  if (
    normalizedValue.length >
    maximumLength
  ) {
    throw new Error(
      `${fieldName} não pode ultrapassar ${maximumLength} caracteres.`,
    )
  }

  return normalizedValue
}

function normalizeUuid(
  value:
    | string
    | null
    | undefined,

  fieldName: string,
): string {
  const normalizedValue =
    normalizeRequiredText(
      value,
      fieldName,
      100,
    )

  if (
    !UUID_PATTERN.test(
      normalizedValue,
    )
  ) {
    throw new Error(
      `${fieldName} possui formato inválido.`,
    )
  }

  return normalizedValue
}

function normalizeOptionalUuid(
  value:
    | string
    | null
    | undefined,

  fieldName: string,
): string | null {
  if (
    value === undefined ||
    value === null ||
    !value.trim()
  ) {
    return null
  }

  return normalizeUuid(
    value,
    fieldName,
  )
}

function normalizeInteger(
  value: number,

  fieldName: string,

  minimumValue: number,

  maximumValue: number,
): number {
  if (
    !Number.isInteger(value) ||
    value < minimumValue ||
    value > maximumValue
  ) {
    throw new Error(
      `${fieldName} deve estar entre ${minimumValue} e ${maximumValue}.`,
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

  minimumValue: number,

  maximumValue: number,
): number | null {
  if (
    value === undefined ||
    value === null
  ) {
    return null
  }

  return normalizeInteger(
    value,
    fieldName,
    minimumValue,
    maximumValue,
  )
}

function normalizeEnum<
  EnumValue extends string,
>(
  value: string,

  allowedValues:
    readonly EnumValue[],

  fieldName: string,
): EnumValue {
  const normalizedValue =
    value
      .trim()
      .toLowerCase()

  if (
    !allowedValues.includes(
      normalizedValue as EnumValue,
    )
  ) {
    throw new Error(
      `${fieldName} possui valor inválido.`,
    )
  }

  return normalizedValue as EnumValue
}

function normalizeDate(
  value:
    | string
    | null
    | undefined,

  fieldName: string,
): string {
  const normalizedValue =
    normalizeRequiredText(
      value,
      fieldName,
      10,
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

  const [
    year,
    month,
    day,
  ] =
    normalizedValue
      .split('-')
      .map(Number)

  const parsedDate =
    new Date(
      Date.UTC(
        year,
        month - 1,
        day,
      ),
    )

  if (
    parsedDate.getUTCFullYear() !==
      year ||
    parsedDate.getUTCMonth() !==
      month - 1 ||
    parsedDate.getUTCDate() !==
      day
  ) {
    throw new Error(
      `${fieldName} é inválida.`,
    )
  }

  return normalizedValue
}

function normalizeOptionalDate(
  value:
    | string
    | null
    | undefined,

  fieldName: string,
): string | null {
  if (
    value === undefined ||
    value === null ||
    !value.trim()
  ) {
    return null
  }

  return normalizeDate(
    value,
    fieldName,
  )
}

function validateDateRange(
  startDate:
    string | null,

  endDate:
    string | null,

  startFieldName:
    string = 'Data inicial',

  endFieldName:
    string = 'Data final',
): void {
  if (
    startDate &&
    endDate &&
    endDate < startDate
  ) {
    throw new Error(
      `${endFieldName} não pode ser anterior a ${startFieldName.toLowerCase()}.`,
    )
  }
}

function normalizeTime(
  value:
    | string
    | null
    | undefined,

  fieldName: string,
): string {
  const normalizedValue =
    normalizeRequiredText(
      value,
      fieldName,
      8,
    )

  const match =
    TIME_PATTERN.exec(
      normalizedValue,
    )

  if (!match) {
    throw new Error(
      `${fieldName} deve utilizar o formato HH:MM.`,
    )
  }

  const hours =
    match[1]

  const minutes =
    match[2]

  const seconds =
    match[3] ?? '00'

  return `${hours}:${minutes}:${seconds}`
}

function normalizeOptionalTime(
  value:
    | string
    | null
    | undefined,

  fieldName: string,
): string | null {
  if (
    value === undefined ||
    value === null ||
    !value.trim()
  ) {
    return null
  }

  return normalizeTime(
    value,
    fieldName,
  )
}

function validateTimeRange(
  startTime:
    string | null,

  endTime:
    string | null,

  startFieldName:
    string = 'Horário inicial',

  endFieldName:
    string = 'Horário final',
): void {
  if (
    startTime &&
    endTime &&
    endTime <= startTime
  ) {
    throw new Error(
      `${endFieldName} deve ser posterior a ${startFieldName.toLowerCase()}.`,
    )
  }
}

function normalizeCode(
  value:
    | string
    | null
    | undefined,

  fieldName: string,

  fallbackValue?: string,
): string {
  const normalizedValue =
    (
      value?.trim() ||
      fallbackValue ||
      ''
    ).toLowerCase()

  if (!normalizedValue) {
    throw new Error(
      `${fieldName} é obrigatório.`,
    )
  }

  if (
    normalizedValue.length >
    MAX_CODE_LENGTH ||
    !CODE_PATTERN.test(
      normalizedValue,
    )
  ) {
    throw new Error(
      `${fieldName} possui formato inválido.`,
    )
  }

  return normalizedValue
}

function normalizeOptionalCode(
  value:
    | string
    | null
    | undefined,

  fieldName: string,
): string | null {
  if (
    value === undefined ||
    value === null ||
    !value.trim()
  ) {
    return null
  }

  return normalizeCode(
    value,
    fieldName,
  )
}

function normalizeTimezone(
  value:
    | string
    | null
    | undefined,
): string {
  const normalizedValue =
    normalizeRequiredText(
      value ??
        DEFAULT_TIMEZONE,
      'Fuso horário',
      100,
    )

  if (
    !normalizedValue.includes(
      '/',
    )
  ) {
    throw new Error(
      'O fuso horário deve utilizar um identificador IANA.',
    )
  }

  return normalizedValue
}

function normalizeReason(
  value:
    | string
    | null
    | undefined,

  fieldName: string,
): string {
  return normalizeRequiredText(
    value,
    fieldName,
    MAX_REASON_LENGTH,
  )
}

function normalizeMutationContext(
  context:
    | SoftDeleteCalendarRecordContext
    | RestoreCalendarRecordContext
    | CancelInstitutionalCalendarEventContext,

  reasonFieldName: string,
): {
  actorUserId: string
  reason: string
} {
  if (!context) {
    throw new Error(
      'Os dados de auditoria são obrigatórios.',
    )
  }

  return {
    actorUserId:
      normalizeUuid(
        context.actorUserId,
        'Usuário responsável',
      ),

    reason:
      normalizeReason(
        context.reason,
        reasonFieldName,
      ),
  }
}

function ensureSameValue(
  currentValue: string,

  nextValue:
    | string
    | undefined,

  fieldName: string,
): void {
  if (
    nextValue !== undefined &&
    nextValue !== currentValue
  ) {
    throw new Error(
      `${fieldName} não pode ser alterado após a criação do registro.`,
    )
  }
}

function ensureDateWithinRange(
  date: string,

  startDate:
    string | null,

  endDate:
    string | null,

  fieldName: string,
): void {
  if (
    startDate &&
    date < startDate
  ) {
    throw new Error(
      `${fieldName} não pode ser anterior ao início do ano letivo.`,
    )
  }

  if (
    endDate &&
    date > endDate
  ) {
    throw new Error(
      `${fieldName} não pode ser posterior ao encerramento do ano letivo.`,
    )
  }
}

function normalizeMetadata(
  value:
    | Json
    | undefined,
): Json {
  return value ?? {}
}

function normalizeOptionalState(
  value:
    | string
    | null
    | undefined,
): string | null {
  const normalizedValue =
    normalizeOptionalText(
      value,
      'Estado',
      100,
    )

  if (!normalizedValue) {
    return null
  }

  return normalizedValue
    .toUpperCase()
}

function normalizeSchoolYearFilters(
  filters:
    SchoolYearFilters,
): SchoolYearFilters {
  return {
    organizationId:
      filters.organizationId
        ? normalizeUuid(
            filters.organizationId,
            'Organização',
          )
        : undefined,

    schoolId:
      filters.schoolId
        ? normalizeUuid(
            filters.schoolId,
            'Escola',
          )
        : undefined,

    year:
      filters.year !==
      undefined
        ? normalizeInteger(
            filters.year,
            'Ano letivo',
            2000,
            2100,
          )
        : undefined,

    statuses:
      filters.statuses?.map(
        status =>
          normalizeEnum(
            status,
            ACADEMIC_CALENDAR_STATUSES,
            'Status do ano letivo',
          ),
      ),

    includeDeleted:
      filters.includeDeleted ??
      false,
  }
}

function normalizeAcademicPeriodFilters(
  filters:
    AcademicPeriodFilters,
): AcademicPeriodFilters {
  return {
    organizationId:
      filters.organizationId
        ? normalizeUuid(
            filters.organizationId,
            'Organização',
          )
        : undefined,

    schoolId:
      filters.schoolId
        ? normalizeUuid(
            filters.schoolId,
            'Escola',
          )
        : undefined,

    schoolYearId:
      filters.schoolYearId
        ? normalizeUuid(
            filters.schoolYearId,
            'Ano letivo',
          )
        : undefined,

    statuses:
      filters.statuses?.map(
        status =>
          normalizeEnum(
            status,
            ACADEMIC_CALENDAR_STATUSES,
            'Status do período letivo',
          ),
      ),

    includeDeleted:
      filters.includeDeleted ??
      false,
  }
}

function normalizeInstitutionalEventFilters(
  filters:
    InstitutionalCalendarEventFilters,
): InstitutionalCalendarEventFilters {
  const startDate =
    filters.startDate
      ? normalizeDate(
          filters.startDate,
          'Data inicial',
        )
      : undefined

  const endDate =
    filters.endDate
      ? normalizeDate(
          filters.endDate,
          'Data final',
        )
      : undefined

  validateDateRange(
    startDate ?? null,
    endDate ?? null,
  )

  return {
    organizationId:
      filters.organizationId
        ? normalizeUuid(
            filters.organizationId,
            'Organização',
          )
        : undefined,

    schoolId:
      filters.schoolId
        ? normalizeUuid(
            filters.schoolId,
            'Escola',
          )
        : undefined,

    schoolYearId:
      filters.schoolYearId
        ? normalizeUuid(
            filters.schoolYearId,
            'Ano letivo',
          )
        : undefined,

    academicPeriodId:
      filters.academicPeriodId
        ? normalizeUuid(
            filters.academicPeriodId,
            'Período letivo',
          )
        : undefined,

    calendarYear:
      filters.calendarYear !==
      undefined
        ? normalizeInteger(
            filters.calendarYear,
            'Ano do calendário',
            2000,
            2100,
          )
        : undefined,

    startDate,
    endDate,

    eventTypes:
      filters.eventTypes?.map(
        eventType =>
          normalizeEnum(
            eventType,
            INSTITUTIONAL_EVENT_TYPES,
            'Tipo do evento',
          ),
      ),

    scopeLevels:
      filters.scopeLevels?.map(
        scopeLevel =>
          normalizeEnum(
            scopeLevel,
            INSTITUTIONAL_SCOPE_LEVELS,
            'Escopo do evento',
          ),
      ),

    statuses:
      filters.statuses?.map(
        status =>
          normalizeEnum(
            status,
            INSTITUTIONAL_EVENT_STATUSES,
            'Status do evento',
          ),
      ),

    priorities:
      filters.priorities?.map(
        priority =>
          normalizeEnum(
            priority,
            INSTITUTIONAL_PRIORITIES,
            'Prioridade do evento',
          ),
      ),

    jurisdictionState:
      filters.jurisdictionState
        ? normalizeOptionalState(
            filters.jurisdictionState,
          ) ??
          undefined
        : undefined,

    jurisdictionCity:
      filters.jurisdictionCity
        ? normalizeRequiredText(
            filters.jurisdictionCity,
            'Município',
            MAX_LOCATION_LENGTH,
          )
        : undefined,

    includeDeleted:
      filters.includeDeleted ??
      false,
  }
}

export class InstitutionalAcademicCalendarService {
  constructor(
    private readonly repository:
      InstitutionalAcademicCalendarRepository,
  ) {
    if (!repository) {
      throw new Error(
        'Repositório do calendário institucional é obrigatório.',
      )
    }
  }

  async listSchoolYears(
    filters:
      SchoolYearFilters = {},
  ): Promise<SchoolYear[]> {
    return this.repository
      .findSchoolYears(
        normalizeSchoolYearFilters(
          filters,
        ),
      )
  }

  async getSchoolYear(
    id: string,
    includeDeleted = false,
  ): Promise<SchoolYear> {
    const schoolYear =
      await this.repository
        .findSchoolYearById(
          normalizeUuid(
            id,
            'Ano letivo',
          ),
          includeDeleted,
        )

    if (!schoolYear) {
      throw new Error(
        'Ano letivo não encontrado.',
      )
    }

    return schoolYear
  }

  async createSchoolYear(
    input:
      CreateSchoolYearInput,
  ): Promise<SchoolYear> {
    const organizationId =
      normalizeUuid(
        input.organization_id,
        'Organização',
      )

    const schoolId =
      normalizeUuid(
        input.school_id,
        'Escola',
      )

    const year =
      normalizeInteger(
        input.year,
        'Ano letivo',
        2000,
        2100,
      )

    const startDate =
      normalizeOptionalDate(
        input.start_date,
        'Data inicial',
      )

    const endDate =
      normalizeOptionalDate(
        input.end_date,
        'Data final',
      )

    validateDateRange(
      startDate,
      endDate,
    )

    const status =
      normalizeEnum(
        input.status ??
          'draft',
        ACADEMIC_CALENDAR_STATUSES,
        'Status do ano letivo',
      )

    if (
      status ===
        'published' &&
      (
        !startDate ||
        !endDate
      )
    ) {
      throw new Error(
        'Um ano letivo publicado deve possuir data inicial e data final.',
      )
    }

    return this.repository
      .createSchoolYear({
        organization_id:
          organizationId,

        school_id:
          schoolId,

        year,

        name:
          normalizeOptionalText(
            input.name,
            'Nome do ano letivo',
            MAX_NAME_LENGTH,
          ) ??
          `${year} — Ano letivo`,

        start_date:
          startDate,

        end_date:
          endDate,

        active:
          input.active ??
          status !== 'archived',

        status,

        timezone:
          normalizeTimezone(
            input.timezone,
          ),

        minimum_school_days:
          input.minimum_school_days !==
          undefined
            ? normalizeInteger(
                input.minimum_school_days,
                'Quantidade mínima de dias letivos',
                0,
                366,
              )
            : 200,

        minimum_instructional_hours:
          normalizeOptionalInteger(
            input.minimum_instructional_hours,
            'Carga horária mínima',
            0,
            20000,
          ),

        calendar_version:
          input.calendar_version !==
          undefined
            ? normalizeInteger(
                input.calendar_version,
                'Versão do calendário',
                1,
                9999,
              )
            : 1,

        metadata:
          normalizeMetadata(
            input.metadata,
          ),
      })
  }

  async updateSchoolYear(
    id: string,
    input:
      UpdateSchoolYearInput,
  ): Promise<SchoolYear> {
    const current =
      await this.getSchoolYear(
        id,
      )

    ensureSameValue(
      current.organization_id,
      input.organization_id,
      'A organização',
    )

    ensureSameValue(
      current.school_id,
      input.school_id,
      'A escola',
    )

    const startDate =
      input.start_date !==
      undefined
        ? normalizeOptionalDate(
            input.start_date,
            'Data inicial',
          )
        : current.start_date

    const endDate =
      input.end_date !==
      undefined
        ? normalizeOptionalDate(
            input.end_date,
            'Data final',
          )
        : current.end_date

    validateDateRange(
      startDate,
      endDate,
    )

    const status =
      input.status !==
      undefined
        ? normalizeEnum(
            input.status,
            ACADEMIC_CALENDAR_STATUSES,
            'Status do ano letivo',
          )
        : current.status

    if (
      status ===
        'published' &&
      (
        !startDate ||
        !endDate
      )
    ) {
      throw new Error(
        'Um ano letivo publicado deve possuir data inicial e data final.',
      )
    }

    const payload:
      UpdateSchoolYearInput = {
        organization_id:
          current.organization_id,

        school_id:
          current.school_id,

        year:
          input.year !==
          undefined
            ? normalizeInteger(
                input.year,
                'Ano letivo',
                2000,
                2100,
              )
            : current.year,

        name:
          input.name !==
          undefined
            ? normalizeOptionalText(
                input.name,
                'Nome do ano letivo',
                MAX_NAME_LENGTH,
              )
            : current.name,

        start_date:
          startDate,

        end_date:
          endDate,

        active:
          input.active ??
          current.active,

        status,

        timezone:
          input.timezone !==
          undefined
            ? normalizeTimezone(
                input.timezone,
              )
            : current.timezone,

        minimum_school_days:
          input.minimum_school_days !==
          undefined
            ? normalizeInteger(
                input.minimum_school_days,
                'Quantidade mínima de dias letivos',
                0,
                366,
              )
            : current
                .minimum_school_days,

        minimum_instructional_hours:
          input
            .minimum_instructional_hours !==
          undefined
            ? normalizeOptionalInteger(
                input.minimum_instructional_hours,
                'Carga horária mínima',
                0,
                20000,
              )
            : current
                .minimum_instructional_hours,

        calendar_version:
          input.calendar_version !==
          undefined
            ? normalizeInteger(
                input.calendar_version,
                'Versão do calendário',
                1,
                9999,
              )
            : current
                .calendar_version,

        metadata:
          input.metadata ??
          current.metadata,
      }

    return this.repository
      .updateSchoolYear(
        current.id,
        payload,
      )
  }

  async publishSchoolYear(
    id: string,
    actorUserId: string,
  ): Promise<SchoolYear> {
    const current =
      await this.getSchoolYear(
        id,
      )

    if (
      !current.start_date ||
      !current.end_date
    ) {
      throw new Error(
        'Informe as datas inicial e final antes de publicar o ano letivo.',
      )
    }

    return this.repository
      .updateSchoolYear(
        current.id,
        {
          status:
            'published',

          active:
            true,

          published_at:
            new Date()
              .toISOString(),

          published_by:
            normalizeUuid(
              actorUserId,
              'Usuário responsável',
            ),
        },
      )
  }

  async closeSchoolYear(
    id: string,
    actorUserId: string,
  ): Promise<SchoolYear> {
    const current =
      await this.getSchoolYear(
        id,
      )

    if (
      current.status !==
      'published'
    ) {
      throw new Error(
        'Somente um ano letivo publicado pode ser encerrado.',
      )
    }

    return this.repository
      .updateSchoolYear(
        current.id,
        {
          status:
            'closed',

          active:
            false,

          closed_at:
            new Date()
              .toISOString(),

          closed_by:
            normalizeUuid(
              actorUserId,
              'Usuário responsável',
            ),
        },
      )
  }

  async softDeleteSchoolYear(
    id: string,
    context:
      SoftDeleteCalendarRecordContext,
  ): Promise<SchoolYear> {
    return this.repository
      .softDeleteSchoolYear(
        normalizeUuid(
          id,
          'Ano letivo',
        ),
        normalizeMutationContext(
          context,
          'Motivo da exclusão',
        ),
      )
  }

  async restoreSchoolYear(
    id: string,
    context:
      RestoreCalendarRecordContext,
  ): Promise<SchoolYear> {
    return this.repository
      .restoreSchoolYear(
        normalizeUuid(
          id,
          'Ano letivo',
        ),
        normalizeMutationContext(
          context,
          'Motivo da restauração',
        ),
      )
  }

  async listAcademicPeriods(
    filters:
      AcademicPeriodFilters = {},
  ): Promise<AcademicPeriod[]> {
    return this.repository
      .findAcademicPeriods(
        normalizeAcademicPeriodFilters(
          filters,
        ),
      )
  }

  async getAcademicPeriod(
    id: string,
    includeDeleted = false,
  ): Promise<AcademicPeriod> {
    const period =
      await this.repository
        .findAcademicPeriodById(
          normalizeUuid(
            id,
            'Período letivo',
          ),
          includeDeleted,
        )

    if (!period) {
      throw new Error(
        'Período letivo não encontrado.',
      )
    }

    return period
  }

  async createAcademicPeriod(
    input:
      CreateAcademicPeriodInput,
  ): Promise<AcademicPeriod> {
    const schoolYear =
      await this.getSchoolYear(
        input.school_year_id,
      )

    const organizationId =
      normalizeUuid(
        input.organization_id,
        'Organização',
      )

    const schoolId =
      normalizeUuid(
        input.school_id,
        'Escola',
      )

    if (
      organizationId !==
      schoolYear.organization_id
    ) {
      throw new Error(
        'A organização do período não corresponde ao ano letivo.',
      )
    }

    if (
      schoolId !==
      schoolYear.school_id
    ) {
      throw new Error(
        'A escola do período não corresponde ao ano letivo.',
      )
    }

    const startDate =
      normalizeDate(
        input.start_date,
        'Data inicial',
      )

    const endDate =
      normalizeDate(
        input.end_date,
        'Data final',
      )

    validateDateRange(
      startDate,
      endDate,
    )

    ensureDateWithinRange(
      startDate,
      schoolYear.start_date,
      schoolYear.end_date,
      'A data inicial',
    )

    ensureDateWithinRange(
      endDate,
      schoolYear.start_date,
      schoolYear.end_date,
      'A data final',
    )

    return this.repository
      .createAcademicPeriod({
        organization_id:
          organizationId,

        school_id:
          schoolId,

        school_year_id:
          schoolYear.id,

        name:
          normalizeRequiredText(
            input.name,
            'Nome do período',
            MAX_NAME_LENGTH,
          ),

        code:
          normalizeOptionalCode(
            input.code,
            'Código do período',
          ),

        period_type:
          normalizeEnum(
            input.period_type ??
              'custom',
            ACADEMIC_PERIOD_TYPES,
            'Tipo do período',
          ),

        sequence:
          normalizeInteger(
            input.sequence,
            'Sequência do período',
            1,
            20,
          ),

        start_date:
          startDate,

        end_date:
          endDate,

        instructional_days_target:
          normalizeOptionalInteger(
            input.instructional_days_target,
            'Meta de dias letivos',
            0,
            366,
          ),

        status:
          normalizeEnum(
            input.status ??
              'draft',
            ACADEMIC_CALENDAR_STATUSES,
            'Status do período',
          ),

        metadata:
          normalizeMetadata(
            input.metadata,
          ),
      })
  }

  async updateAcademicPeriod(
    id: string,
    input:
      UpdateAcademicPeriodInput,
  ): Promise<AcademicPeriod> {
    const current =
      await this.getAcademicPeriod(
        id,
      )

    ensureSameValue(
      current.organization_id,
      input.organization_id,
      'A organização',
    )

    ensureSameValue(
      current.school_id,
      input.school_id,
      'A escola',
    )

    ensureSameValue(
      current.school_year_id,
      input.school_year_id,
      'O ano letivo',
    )

    const schoolYear =
      await this.getSchoolYear(
        current.school_year_id,
      )

    const startDate =
      input.start_date !==
      undefined
        ? normalizeDate(
            input.start_date,
            'Data inicial',
          )
        : current.start_date

    const endDate =
      input.end_date !==
      undefined
        ? normalizeDate(
            input.end_date,
            'Data final',
          )
        : current.end_date

    validateDateRange(
      startDate,
      endDate,
    )

    ensureDateWithinRange(
      startDate,
      schoolYear.start_date,
      schoolYear.end_date,
      'A data inicial',
    )

    ensureDateWithinRange(
      endDate,
      schoolYear.start_date,
      schoolYear.end_date,
      'A data final',
    )

    return this.repository
      .updateAcademicPeriod(
        current.id,
        {
          organization_id:
            current.organization_id,

          school_id:
            current.school_id,

          school_year_id:
            current.school_year_id,

          name:
            input.name !==
            undefined
              ? normalizeRequiredText(
                  input.name,
                  'Nome do período',
                  MAX_NAME_LENGTH,
                )
              : current.name,

          code:
            input.code !==
            undefined
              ? normalizeOptionalCode(
                  input.code,
                  'Código do período',
                )
              : current.code,

          period_type:
            input.period_type !==
            undefined
              ? normalizeEnum(
                  input.period_type,
                  ACADEMIC_PERIOD_TYPES,
                  'Tipo do período',
                )
              : current.period_type,

          sequence:
            input.sequence !==
            undefined
              ? normalizeInteger(
                  input.sequence,
                  'Sequência do período',
                  1,
                  20,
                )
              : current.sequence,

          start_date:
            startDate,

          end_date:
            endDate,

          instructional_days_target:
            input
              .instructional_days_target !==
            undefined
              ? normalizeOptionalInteger(
                  input.instructional_days_target,
                  'Meta de dias letivos',
                  0,
                  366,
                )
              : current
                  .instructional_days_target,

          status:
            input.status !==
            undefined
              ? normalizeEnum(
                  input.status,
                  ACADEMIC_CALENDAR_STATUSES,
                  'Status do período',
                )
              : current.status,

          metadata:
            input.metadata ??
            current.metadata,
        },
      )
  }

  async publishAcademicPeriod(
    id: string,
    actorUserId: string,
  ): Promise<AcademicPeriod> {
    const current =
      await this.getAcademicPeriod(
        id,
      )

    return this.repository
      .updateAcademicPeriod(
        current.id,
        {
          status:
            'published',

          published_at:
            new Date()
              .toISOString(),

          published_by:
            normalizeUuid(
              actorUserId,
              'Usuário responsável',
            ),
        },
      )
  }

  async softDeleteAcademicPeriod(
    id: string,
    context:
      SoftDeleteCalendarRecordContext,
  ): Promise<AcademicPeriod> {
    return this.repository
      .softDeleteAcademicPeriod(
        normalizeUuid(
          id,
          'Período letivo',
        ),
        normalizeMutationContext(
          context,
          'Motivo da exclusão',
        ),
      )
  }

  async restoreAcademicPeriod(
    id: string,
    context:
      RestoreCalendarRecordContext,
  ): Promise<AcademicPeriod> {
    return this.repository
      .restoreAcademicPeriod(
        normalizeUuid(
          id,
          'Período letivo',
        ),
        normalizeMutationContext(
          context,
          'Motivo da restauração',
        ),
      )
  }

  async listInstitutionalEvents(
    filters:
      InstitutionalCalendarEventFilters = {},
  ): Promise<
    InstitutionalCalendarEvent[]
  > {
    return this.repository
      .findInstitutionalEvents(
        normalizeInstitutionalEventFilters(
          filters,
        ),
      )
  }

  async getInstitutionalEvent(
    id: string,
    includeDeleted = false,
  ): Promise<
    InstitutionalCalendarEvent
  > {
    const event =
      await this.repository
        .findInstitutionalEventById(
          normalizeUuid(
            id,
            'Evento institucional',
          ),
          includeDeleted,
        )

    if (!event) {
      throw new Error(
        'Evento institucional não encontrado.',
      )
    }

    return event
  }

  private async normalizeInstitutionalEventInput(
    input:
      CreateInstitutionalCalendarEventInput,
  ): Promise<CreateInstitutionalCalendarEventInput> {
    const scopeLevel =
      normalizeEnum(
        input.scope_level,
        INSTITUTIONAL_SCOPE_LEVELS,
        'Escopo do evento',
      )

    let organizationId =
      normalizeOptionalUuid(
        input.organization_id,
        'Organização',
      )

    let schoolId =
      normalizeOptionalUuid(
        input.school_id,
        'Escola',
      )

    if (
      [
        'national',
        'state',
        'municipal',
      ].includes(
        scopeLevel,
      )
    ) {
      organizationId =
        null

      schoolId =
        null
    }

    if (
      scopeLevel ===
        'network' ||
      scopeLevel ===
        'organization'
    ) {
      if (!organizationId) {
        throw new Error(
          'A organização é obrigatória para eventos de rede ou organização.',
        )
      }

      schoolId =
        null
    }

    if (
      scopeLevel ===
      'school'
    ) {
      if (
        !organizationId ||
        !schoolId
      ) {
        throw new Error(
          'A organização e a escola são obrigatórias para eventos escolares.',
        )
      }
    }

    let schoolYearId =
      normalizeOptionalUuid(
        input.school_year_id,
        'Ano letivo',
      )

    const academicPeriodId =
      normalizeOptionalUuid(
        input.academic_period_id,
        'Período letivo',
      )

    if (schoolYearId) {
      const schoolYear =
        await this.getSchoolYear(
          schoolYearId,
        )

      if (
        schoolYear
          .organization_id !==
        organizationId
      ) {
        throw new Error(
          'A organização do evento não corresponde ao ano letivo.',
        )
      }

      if (
        schoolYear.school_id !==
        schoolId
      ) {
        throw new Error(
          'A escola do evento não corresponde ao ano letivo.',
        )
      }
    }

    if (academicPeriodId) {
      const period =
        await this.getAcademicPeriod(
          academicPeriodId,
        )

      if (
        period.organization_id !==
        organizationId
      ) {
        throw new Error(
          'A organização do evento não corresponde ao período letivo.',
        )
      }

      if (
        period.school_id !==
        schoolId
      ) {
        throw new Error(
          'A escola do evento não corresponde ao período letivo.',
        )
      }

      if (
        schoolYearId &&
        period.school_year_id !==
          schoolYearId
      ) {
        throw new Error(
          'O período informado pertence a outro ano letivo.',
        )
      }

      schoolYearId =
        period.school_year_id
    }

    const calendarYear =
      normalizeInteger(
        input.calendar_year,
        'Ano do calendário',
        2000,
        2100,
      )

    const startDate =
      normalizeDate(
        input.start_date,
        'Data inicial',
      )

    const endDate =
      normalizeDate(
        input.end_date,
        'Data final',
      )

    validateDateRange(
      startDate,
      endDate,
    )

    if (
      Number(
        startDate.slice(
          0,
          4,
        ),
      ) !== calendarYear
    ) {
      throw new Error(
        'A data inicial deve pertencer ao ano informado no calendário.',
      )
    }

    const allDay =
      input.all_day ??
      true

    const startTime =
      normalizeOptionalTime(
        input.start_time,
        'Horário inicial',
      )

    const endTime =
      normalizeOptionalTime(
        input.end_time,
        'Horário final',
      )

    if (
      !allDay &&
      !startTime
    ) {
      throw new Error(
        'Eventos com horário definido devem possuir horário inicial.',
      )
    }

    validateTimeRange(
      startTime,
      endTime,
    )

    const dateRule =
      normalizeEnum(
        input.date_rule ??
          'year_specific',
        INSTITUTIONAL_DATE_RULES,
        'Regra de data',
      )

    const fixedMonth =
      normalizeOptionalInteger(
        input.fixed_month,
        'Mês fixo',
        1,
        12,
      )

    const fixedDay =
      normalizeOptionalInteger(
        input.fixed_day,
        'Dia fixo',
        1,
        31,
      )

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

    const jurisdictionState =
      normalizeOptionalState(
        input.jurisdiction_state,
      )

    const jurisdictionCity =
      normalizeOptionalText(
        input.jurisdiction_city,
        'Município',
        MAX_LOCATION_LENGTH,
      )

    if (
      scopeLevel ===
        'state' &&
      !jurisdictionState
    ) {
      throw new Error(
        'Eventos estaduais devem informar o estado.',
      )
    }

    if (
      scopeLevel ===
        'municipal' &&
      (
        !jurisdictionState ||
        !jurisdictionCity
      )
    ) {
      throw new Error(
        'Eventos municipais devem informar estado e município.',
      )
    }

    return {
      organization_id:
        organizationId,

      school_id:
        schoolId,

      school_year_id:
        schoolYearId,

      academic_period_id:
        academicPeriodId,

      calendar_year:
        calendarYear,

      title:
        normalizeRequiredText(
          input.title,
          'Título do evento',
          MAX_TITLE_LENGTH,
        ),

      description:
        normalizeOptionalText(
          input.description,
          'Descrição do evento',
          MAX_DESCRIPTION_LENGTH,
        ),

      event_type:
        normalizeEnum(
          input.event_type,
          INSTITUTIONAL_EVENT_TYPES,
          'Tipo do evento',
        ),

      scope_level:
        scopeLevel,

      date_rule:
        dateRule,

      source_type:
        normalizeEnum(
          input.source_type ??
            'manual',
          INSTITUTIONAL_SOURCE_TYPES,
          'Origem do evento',
        ),

      source_reference:
        normalizeOptionalText(
          input.source_reference,
          'Referência oficial',
          MAX_REFERENCE_LENGTH,
        ),

      jurisdiction_country:
        normalizeOptionalText(
          input.jurisdiction_country ??
            'Brasil',
          'País',
          MAX_LOCATION_LENGTH,
        ),

      jurisdiction_state:
        jurisdictionState,

      jurisdiction_city:
        jurisdictionCity,

      start_date:
        startDate,

      end_date:
        endDate,

      all_day:
        allDay,

      start_time:
        allDay
          ? null
          : startTime,

      end_time:
        allDay
          ? null
          : endTime,

      fixed_month:
        fixedMonth,

      fixed_day:
        fixedDay,

      calculation_rule:
        normalizeMetadata(
          input.calculation_rule,
        ),

      is_instructional_day:
        input.is_instructional_day ??
        false,

      counts_as_school_day:
        input.counts_as_school_day ??
        false,

      suspends_classes:
        input.suspends_classes ??
        false,

      is_mandatory:
        input.is_mandatory ??
        false,

      priority:
        normalizeEnum(
          input.priority ??
            'normal',
          INSTITUTIONAL_PRIORITIES,
          'Prioridade do evento',
        ),

      status:
        normalizeEnum(
          input.status ??
            'draft',
          INSTITUTIONAL_EVENT_STATUSES,
          'Status do evento',
        ),

      metadata:
        normalizeMetadata(
          input.metadata,
        ),
    }
  }

  async createInstitutionalEvent(
    input:
      CreateInstitutionalCalendarEventInput,
  ): Promise<
    InstitutionalCalendarEvent
  > {
    const normalizedInput =
      await this
        .normalizeInstitutionalEventInput(
          input,
        )

    if (
      normalizedInput.status ===
      'cancelled'
    ) {
      throw new Error(
        'Utilize a operação de cancelamento para cancelar um evento.',
      )
    }

    return this.repository
      .createInstitutionalEvent(
        normalizedInput,
      )
  }

  async updateInstitutionalEvent(
    id: string,
    input:
      UpdateInstitutionalCalendarEventInput,
  ): Promise<
    InstitutionalCalendarEvent
  > {
    const current =
      await this.getInstitutionalEvent(
        id,
      )

    if (
      input.status ===
      'cancelled'
    ) {
      throw new Error(
        'Utilize a operação de cancelamento para cancelar um evento.',
      )
    }

    const normalizedInput =
      await this
        .normalizeInstitutionalEventInput({
          organization_id:
            input.organization_id !==
            undefined
              ? input.organization_id
              : current.organization_id,

          school_id:
            input.school_id !==
            undefined
              ? input.school_id
              : current.school_id,

          school_year_id:
            input.school_year_id !==
            undefined
              ? input.school_year_id
              : current.school_year_id,

          academic_period_id:
            input.academic_period_id !==
            undefined
              ? input.academic_period_id
              : current.academic_period_id,

          calendar_year:
            input.calendar_year ??
            current.calendar_year,

          title:
            input.title ??
            current.title,

          description:
            input.description !==
            undefined
              ? input.description
              : current.description,

          event_type:
            input.event_type ??
            current.event_type,

          scope_level:
            input.scope_level ??
            current.scope_level,

          date_rule:
            input.date_rule ??
            current.date_rule,

          source_type:
            input.source_type ??
            current.source_type,

          source_reference:
            input.source_reference !==
            undefined
              ? input.source_reference
              : current.source_reference,

          jurisdiction_country:
            input.jurisdiction_country !==
            undefined
              ? input.jurisdiction_country
              : current
                  .jurisdiction_country,

          jurisdiction_state:
            input.jurisdiction_state !==
            undefined
              ? input.jurisdiction_state
              : current
                  .jurisdiction_state,

          jurisdiction_city:
            input.jurisdiction_city !==
            undefined
              ? input.jurisdiction_city
              : current
                  .jurisdiction_city,

          start_date:
            input.start_date ??
            current.start_date,

          end_date:
            input.end_date ??
            current.end_date,

          all_day:
            input.all_day ??
            current.all_day,

          start_time:
            input.start_time !==
            undefined
              ? input.start_time
              : current.start_time,

          end_time:
            input.end_time !==
            undefined
              ? input.end_time
              : current.end_time,

          fixed_month:
            input.fixed_month !==
            undefined
              ? input.fixed_month
              : current.fixed_month,

          fixed_day:
            input.fixed_day !==
            undefined
              ? input.fixed_day
              : current.fixed_day,

          calculation_rule:
            input.calculation_rule ??
            current.calculation_rule,

          is_instructional_day:
            input.is_instructional_day ??
            current
              .is_instructional_day,

          counts_as_school_day:
            input.counts_as_school_day ??
            current
              .counts_as_school_day,

          suspends_classes:
            input.suspends_classes ??
            current.suspends_classes,

          is_mandatory:
            input.is_mandatory ??
            current.is_mandatory,

          priority:
            input.priority ??
            current.priority,

          status:
            input.status ??
            current.status,

          metadata:
            input.metadata ??
            current.metadata,
        })

    return this.repository
      .updateInstitutionalEvent(
        current.id,
        normalizedInput,
      )
  }

  async publishInstitutionalEvent(
    id: string,
    actorUserId: string,
  ): Promise<
    InstitutionalCalendarEvent
  > {
    const current =
      await this.getInstitutionalEvent(
        id,
      )

    if (
      current.status ===
      'cancelled'
    ) {
      throw new Error(
        'Um evento cancelado deve ser reativado antes da publicação.',
      )
    }

    return this.repository
      .updateInstitutionalEvent(
        current.id,
        {
          status:
            'published',

          published_at:
            new Date()
              .toISOString(),

          published_by:
            normalizeUuid(
              actorUserId,
              'Usuário responsável',
            ),
        },
      )
  }

  async cancelInstitutionalEvent(
    id: string,
    context:
      CancelInstitutionalCalendarEventContext,
  ): Promise<
    InstitutionalCalendarEvent
  > {
    return this.repository
      .cancelInstitutionalEvent(
        normalizeUuid(
          id,
          'Evento institucional',
        ),
        normalizeMutationContext(
          context,
          'Motivo do cancelamento',
        ),
      )
  }

  async reactivateInstitutionalEvent(
    id: string,
    status:
      Exclude<
        InstitutionalCalendarEventStatus,
        'cancelled'
      > = 'draft',
  ): Promise<
    InstitutionalCalendarEvent
  > {
    const normalizedStatus =
      normalizeEnum(
        status,
        [
          'draft',
          'published',
          'archived',
        ] as const,
        'Status de reativação',
      )

    return this.repository
      .reactivateInstitutionalEvent(
        normalizeUuid(
          id,
          'Evento institucional',
        ),
        normalizedStatus,
      )
  }

  async softDeleteInstitutionalEvent(
    id: string,
    context:
      SoftDeleteCalendarRecordContext,
  ): Promise<
    InstitutionalCalendarEvent
  > {
    return this.repository
      .softDeleteInstitutionalEvent(
        normalizeUuid(
          id,
          'Evento institucional',
        ),
        normalizeMutationContext(
          context,
          'Motivo da exclusão',
        ),
      )
  }

  async restoreInstitutionalEvent(
    id: string,
    context:
      RestoreCalendarRecordContext,
  ): Promise<
    InstitutionalCalendarEvent
  > {
    return this.repository
      .restoreInstitutionalEvent(
        normalizeUuid(
          id,
          'Evento institucional',
        ),
        normalizeMutationContext(
          context,
          'Motivo da restauração',
        ),
      )
  }

  async listOperatingHours(
    filters:
      SchoolOperatingHoursFilters = {},
  ): Promise<
    SchoolOperatingHours[]
  > {
    return this.repository
      .findOperatingHours({
        organizationId:
          filters.organizationId
            ? normalizeUuid(
                filters.organizationId,
                'Organização',
              )
            : undefined,

        schoolId:
          filters.schoolId
            ? normalizeUuid(
                filters.schoolId,
                'Escola',
              )
            : undefined,

        schoolYearId:
          filters.schoolYearId
            ? normalizeUuid(
                filters.schoolYearId,
                'Ano letivo',
              )
            : undefined,

        weekday:
          filters.weekday !==
          undefined
            ? normalizeInteger(
                filters.weekday,
                'Dia da semana',
                1,
                7,
              )
            : undefined,

        shiftCode:
          filters.shiftCode
            ? normalizeCode(
                filters.shiftCode,
                'Código do turno',
              )
            : undefined,

        statuses:
          filters.statuses?.map(
            status =>
              normalizeEnum(
                status,
                OPERATING_HOURS_STATUSES,
                'Status do horário',
              ),
          ),

        includeDeleted:
          filters.includeDeleted ??
          false,
      })
  }

  async getOperatingHours(
    id: string,
    includeDeleted = false,
  ): Promise<
    SchoolOperatingHours
  > {
    const operatingHours =
      await this.repository
        .findOperatingHoursById(
          normalizeUuid(
            id,
            'Horário institucional',
          ),
          includeDeleted,
        )

    if (!operatingHours) {
      throw new Error(
        'Horário institucional não encontrado.',
      )
    }

    return operatingHours
  }

  async createOperatingHours(
    input:
      CreateSchoolOperatingHoursInput,
  ): Promise<
    SchoolOperatingHours
  > {
    const schoolYear =
      await this.getSchoolYear(
        input.school_year_id,
      )

    const organizationId =
      normalizeUuid(
        input.organization_id,
        'Organização',
      )

    const schoolId =
      normalizeUuid(
        input.school_id,
        'Escola',
      )

    if (
      organizationId !==
      schoolYear.organization_id ||
      schoolId !==
      schoolYear.school_id
    ) {
      throw new Error(
        'O horário institucional não corresponde ao escopo do ano letivo.',
      )
    }

    const startTime =
      normalizeTime(
        input.start_time,
        'Horário inicial',
      )

    const endTime =
      normalizeTime(
        input.end_time,
        'Horário final',
      )

    validateTimeRange(
      startTime,
      endTime,
    )

    const breakStartTime =
      normalizeOptionalTime(
        input.break_start_time,
        'Início do intervalo',
      )

    const breakEndTime =
      normalizeOptionalTime(
        input.break_end_time,
        'Fim do intervalo',
      )

    if (
      Boolean(
        breakStartTime,
      ) !==
      Boolean(
        breakEndTime,
      )
    ) {
      throw new Error(
        'O início e o fim do intervalo devem ser informados juntos.',
      )
    }

    validateTimeRange(
      breakStartTime,
      breakEndTime,
      'Início do intervalo',
      'Fim do intervalo',
    )

    if (
      breakStartTime &&
      (
        breakStartTime <
          startTime ||
        breakEndTime! >
          endTime
      )
    ) {
      throw new Error(
        'O intervalo deve estar dentro do horário de funcionamento.',
      )
    }

    return this.repository
      .createOperatingHours({
        organization_id:
          organizationId,

        school_id:
          schoolId,

        school_year_id:
          schoolYear.id,

        weekday:
          normalizeInteger(
            input.weekday,
            'Dia da semana',
            1,
            7,
          ),

        shift_code:
          normalizeCode(
            input.shift_code,
            'Código do turno',
            'general',
          ),

        shift_name:
          normalizeOptionalText(
            input.shift_name,
            'Nome do turno',
            MAX_NAME_LENGTH,
          ),

        start_time:
          startTime,

        end_time:
          endTime,

        break_start_time:
          breakStartTime,

        break_end_time:
          breakEndTime,

        lesson_duration_minutes:
          normalizeOptionalInteger(
            input.lesson_duration_minutes,
            'Duração da aula',
            1,
            600,
          ),

        is_operating_day:
          input.is_operating_day ??
          true,

        status:
          normalizeEnum(
            input.status ??
              'active',
            OPERATING_HOURS_STATUSES,
            'Status do horário',
          ),

        metadata:
          normalizeMetadata(
            input.metadata,
          ),
      })
  }

  async updateOperatingHours(
    id: string,
    input:
      UpdateSchoolOperatingHoursInput,
  ): Promise<
    SchoolOperatingHours
  > {
    const current =
      await this.getOperatingHours(
        id,
      )

    ensureSameValue(
      current.organization_id,
      input.organization_id,
      'A organização',
    )

    ensureSameValue(
      current.school_id,
      input.school_id,
      'A escola',
    )

    ensureSameValue(
      current.school_year_id,
      input.school_year_id,
      'O ano letivo',
    )

    const startTime =
      input.start_time !==
      undefined
        ? normalizeTime(
            input.start_time,
            'Horário inicial',
          )
        : current.start_time

    const endTime =
      input.end_time !==
      undefined
        ? normalizeTime(
            input.end_time,
            'Horário final',
          )
        : current.end_time

    validateTimeRange(
      startTime,
      endTime,
    )

    const breakStartTime =
      input.break_start_time !==
      undefined
        ? normalizeOptionalTime(
            input.break_start_time,
            'Início do intervalo',
          )
        : current.break_start_time

    const breakEndTime =
      input.break_end_time !==
      undefined
        ? normalizeOptionalTime(
            input.break_end_time,
            'Fim do intervalo',
          )
        : current.break_end_time

    if (
      Boolean(
        breakStartTime,
      ) !==
      Boolean(
        breakEndTime,
      )
    ) {
      throw new Error(
        'O início e o fim do intervalo devem ser informados juntos.',
      )
    }

    validateTimeRange(
      breakStartTime,
      breakEndTime,
      'Início do intervalo',
      'Fim do intervalo',
    )

    return this.repository
      .updateOperatingHours(
        current.id,
        {
          organization_id:
            current.organization_id,

          school_id:
            current.school_id,

          school_year_id:
            current.school_year_id,

          weekday:
            input.weekday !==
            undefined
              ? normalizeInteger(
                  input.weekday,
                  'Dia da semana',
                  1,
                  7,
                )
              : current.weekday,

          shift_code:
            input.shift_code !==
            undefined
              ? normalizeCode(
                  input.shift_code,
                  'Código do turno',
                )
              : current.shift_code,

          shift_name:
            input.shift_name !==
            undefined
              ? normalizeOptionalText(
                  input.shift_name,
                  'Nome do turno',
                  MAX_NAME_LENGTH,
                )
              : current.shift_name,

          start_time:
            startTime,

          end_time:
            endTime,

          break_start_time:
            breakStartTime,

          break_end_time:
            breakEndTime,

          lesson_duration_minutes:
            input
              .lesson_duration_minutes !==
            undefined
              ? normalizeOptionalInteger(
                  input.lesson_duration_minutes,
                  'Duração da aula',
                  1,
                  600,
                )
              : current
                  .lesson_duration_minutes,

          is_operating_day:
            input.is_operating_day ??
            current.is_operating_day,

          status:
            input.status !==
            undefined
              ? normalizeEnum(
                  input.status,
                  OPERATING_HOURS_STATUSES,
                  'Status do horário',
                )
              : current.status,

          metadata:
            input.metadata ??
            current.metadata,
        },
      )
  }

  async softDeleteOperatingHours(
    id: string,
    context:
      SoftDeleteCalendarRecordContext,
  ): Promise<
    SchoolOperatingHours
  > {
    return this.repository
      .softDeleteOperatingHours(
        normalizeUuid(
          id,
          'Horário institucional',
        ),
        normalizeMutationContext(
          context,
          'Motivo da exclusão',
        ),
      )
  }

  async restoreOperatingHours(
    id: string,
    context:
      RestoreCalendarRecordContext,
  ): Promise<
    SchoolOperatingHours
  > {
    return this.repository
      .restoreOperatingHours(
        normalizeUuid(
          id,
          'Horário institucional',
        ),
        normalizeMutationContext(
          context,
          'Motivo da restauração',
        ),
      )
  }

  async listCalendarExceptions(
    filters:
      SchoolCalendarExceptionFilters = {},
  ): Promise<
    SchoolCalendarException[]
  > {
    const startDate =
      filters.startDate
        ? normalizeDate(
            filters.startDate,
            'Data inicial',
          )
        : undefined

    const endDate =
      filters.endDate
        ? normalizeDate(
            filters.endDate,
            'Data final',
          )
        : undefined

    validateDateRange(
      startDate ?? null,
      endDate ?? null,
    )

    return this.repository
      .findCalendarExceptions({
        organizationId:
          filters.organizationId
            ? normalizeUuid(
                filters.organizationId,
                'Organização',
              )
            : undefined,

        schoolId:
          filters.schoolId
            ? normalizeUuid(
                filters.schoolId,
                'Escola',
              )
            : undefined,

        schoolYearId:
          filters.schoolYearId
            ? normalizeUuid(
                filters.schoolYearId,
                'Ano letivo',
              )
            : undefined,

        sourceEventId:
          filters.sourceEventId
            ? normalizeUuid(
                filters.sourceEventId,
                'Evento de origem',
              )
            : undefined,

        startDate,
        endDate,

        operationModes:
          filters.operationModes?.map(
            operationMode =>
              normalizeEnum(
                operationMode,
                CALENDAR_OPERATION_MODES,
                'Modo de funcionamento',
              ),
          ),

        statuses:
          filters.statuses?.map(
            status =>
              normalizeEnum(
                status,
                CALENDAR_EXCEPTION_STATUSES,
                'Status da exceção',
              ),
          ),

        includeDeleted:
          filters.includeDeleted ??
          false,
      })
  }

  async getCalendarException(
    id: string,
    includeDeleted = false,
  ): Promise<
    SchoolCalendarException
  > {
    const exception =
      await this.repository
        .findCalendarExceptionById(
          normalizeUuid(
            id,
            'Exceção do calendário',
          ),
          includeDeleted,
        )

    if (!exception) {
      throw new Error(
        'Exceção do calendário não encontrada.',
      )
    }

    return exception
  }

  async createCalendarException(
    input:
      CreateSchoolCalendarExceptionInput,
  ): Promise<
    SchoolCalendarException
  > {
    const schoolYear =
      await this.getSchoolYear(
        input.school_year_id,
      )

    const organizationId =
      normalizeUuid(
        input.organization_id,
        'Organização',
      )

    const schoolId =
      normalizeUuid(
        input.school_id,
        'Escola',
      )

    if (
      organizationId !==
      schoolYear.organization_id ||
      schoolId !==
      schoolYear.school_id
    ) {
      throw new Error(
        'A exceção não corresponde ao escopo do ano letivo.',
      )
    }

    const exceptionDate =
      normalizeDate(
        input.exception_date,
        'Data da exceção',
      )

    ensureDateWithinRange(
      exceptionDate,
      schoolYear.start_date,
      schoolYear.end_date,
      'A data da exceção',
    )

    const operationMode =
      normalizeEnum(
        input.operation_mode,
        CALENDAR_OPERATION_MODES,
        'Modo de funcionamento',
      )

    const startTime =
      normalizeOptionalTime(
        input.start_time,
        'Horário inicial',
      )

    const endTime =
      normalizeOptionalTime(
        input.end_time,
        'Horário final',
      )

    validateTimeRange(
      startTime,
      endTime,
    )

    if (
      operationMode ===
        'partial' &&
      (
        !startTime ||
        !endTime
      )
    ) {
      throw new Error(
        'O funcionamento parcial deve possuir horário inicial e final.',
      )
    }

    const replacementDate =
      normalizeOptionalDate(
        input.replacement_date,
        'Data de reposição',
      )

    if (
      operationMode ===
        'replacement' &&
      !replacementDate
    ) {
      throw new Error(
        'A data de reposição é obrigatória.',
      )
    }

    return this.repository
      .createCalendarException({
        organization_id:
          organizationId,

        school_id:
          schoolId,

        school_year_id:
          schoolYear.id,

        source_event_id:
          normalizeOptionalUuid(
            input.source_event_id,
            'Evento de origem',
          ),

        exception_date:
          exceptionDate,

        operation_mode:
          operationMode,

        shift_code:
          normalizeOptionalCode(
            input.shift_code,
            'Código do turno',
          ),

        start_time:
          startTime,

        end_time:
          endTime,

        replacement_date:
          replacementDate,

        reason:
          normalizeReason(
            input.reason,
            'Motivo da exceção',
          ),

        affects_classes:
          input.affects_classes ??
          true,

        counts_as_school_day:
          input.counts_as_school_day ??
          false,

        status:
          normalizeEnum(
            input.status ??
              'active',
            CALENDAR_EXCEPTION_STATUSES,
            'Status da exceção',
          ),

        metadata:
          normalizeMetadata(
            input.metadata,
          ),
      })
  }

  async updateCalendarException(
    id: string,
    input:
      UpdateSchoolCalendarExceptionInput,
  ): Promise<
    SchoolCalendarException
  > {
    const current =
      await this.getCalendarException(
        id,
      )

    ensureSameValue(
      current.organization_id,
      input.organization_id,
      'A organização',
    )

    ensureSameValue(
      current.school_id,
      input.school_id,
      'A escola',
    )

    ensureSameValue(
      current.school_year_id,
      input.school_year_id,
      'O ano letivo',
    )

    const schoolYear =
      await this.getSchoolYear(
        current.school_year_id,
      )

    const exceptionDate =
      input.exception_date !==
      undefined
        ? normalizeDate(
            input.exception_date,
            'Data da exceção',
          )
        : current.exception_date

    ensureDateWithinRange(
      exceptionDate,
      schoolYear.start_date,
      schoolYear.end_date,
      'A data da exceção',
    )

    const operationMode =
      input.operation_mode !==
      undefined
        ? normalizeEnum(
            input.operation_mode,
            CALENDAR_OPERATION_MODES,
            'Modo de funcionamento',
          )
        : current.operation_mode

    const startTime =
      input.start_time !==
      undefined
        ? normalizeOptionalTime(
            input.start_time,
            'Horário inicial',
          )
        : current.start_time

    const endTime =
      input.end_time !==
      undefined
        ? normalizeOptionalTime(
            input.end_time,
            'Horário final',
          )
        : current.end_time

    validateTimeRange(
      startTime,
      endTime,
    )

    const replacementDate =
      input.replacement_date !==
      undefined
        ? normalizeOptionalDate(
            input.replacement_date,
            'Data de reposição',
          )
        : current.replacement_date

    if (
      operationMode ===
        'replacement' &&
      !replacementDate
    ) {
      throw new Error(
        'A data de reposição é obrigatória.',
      )
    }

    return this.repository
      .updateCalendarException(
        current.id,
        {
          organization_id:
            current.organization_id,

          school_id:
            current.school_id,

          school_year_id:
            current.school_year_id,

          source_event_id:
            input.source_event_id !==
            undefined
              ? normalizeOptionalUuid(
                  input.source_event_id,
                  'Evento de origem',
                )
              : current.source_event_id,

          exception_date:
            exceptionDate,

          operation_mode:
            operationMode,

          shift_code:
            input.shift_code !==
            undefined
              ? normalizeOptionalCode(
                  input.shift_code,
                  'Código do turno',
                )
              : current.shift_code,

          start_time:
            startTime,

          end_time:
            endTime,

          replacement_date:
            replacementDate,

          reason:
            input.reason !==
            undefined
              ? normalizeReason(
                  input.reason,
                  'Motivo da exceção',
                )
              : current.reason,

          affects_classes:
            input.affects_classes ??
            current.affects_classes,

          counts_as_school_day:
            input.counts_as_school_day ??
            current
              .counts_as_school_day,

          status:
            input.status !==
            undefined
              ? normalizeEnum(
                  input.status,
                  CALENDAR_EXCEPTION_STATUSES,
                  'Status da exceção',
                )
              : current.status,

          metadata:
            input.metadata ??
            current.metadata,
        },
      )
  }

  async softDeleteCalendarException(
    id: string,
    context:
      SoftDeleteCalendarRecordContext,
  ): Promise<
    SchoolCalendarException
  > {
    return this.repository
      .softDeleteCalendarException(
        normalizeUuid(
          id,
          'Exceção do calendário',
        ),
        normalizeMutationContext(
          context,
          'Motivo da exclusão',
        ),
      )
  }

  async restoreCalendarException(
    id: string,
    context:
      RestoreCalendarRecordContext,
  ): Promise<
    SchoolCalendarException
  > {
    return this.repository
      .restoreCalendarException(
        normalizeUuid(
          id,
          'Exceção do calendário',
        ),
        normalizeMutationContext(
          context,
          'Motivo da restauração',
        ),
      )
  }

  async getSchoolCalendarSnapshot(
    schoolYearId: string,
  ): Promise<
    InstitutionalAcademicCalendarSnapshot
  > {
    const schoolYear =
      await this.getSchoolYear(
        schoolYearId,
      )

    const [
      periods,
      events,
      operatingHours,
      exceptions,
    ] =
      await Promise.all([
        this.listAcademicPeriods({
          organizationId:
            schoolYear
              .organization_id,

          schoolId:
            schoolYear.school_id,

          schoolYearId:
            schoolYear.id,
        }),

        this.listInstitutionalEvents({
          organizationId:
            schoolYear
              .organization_id,

          schoolId:
            schoolYear.school_id,

          schoolYearId:
            schoolYear.id,

          calendarYear:
            schoolYear.year,
        }),

        this.listOperatingHours({
          organizationId:
            schoolYear
              .organization_id,

          schoolId:
            schoolYear.school_id,

          schoolYearId:
            schoolYear.id,
        }),

        this.listCalendarExceptions({
          organizationId:
            schoolYear
              .organization_id,

          schoolId:
            schoolYear.school_id,

          schoolYearId:
            schoolYear.id,
        }),
      ])

    return {
      schoolYear,
      periods,
      events,
      operatingHours,
      exceptions,
    }
  }
}