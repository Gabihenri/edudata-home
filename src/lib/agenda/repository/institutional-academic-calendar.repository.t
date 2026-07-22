import type {
  SupabaseClient,
} from '@supabase/supabase-js'

export type Json =
  | string
  | number
  | boolean
  | null
  | Json[]
  | {
      [key: string]:
        | Json
        | undefined
    }

export type AcademicCalendarStatus =
  | 'draft'
  | 'published'
  | 'closed'
  | 'archived'

export type AcademicPeriodType =
  | 'bimester'
  | 'trimester'
  | 'semester'
  | 'quarter'
  | 'term'
  | 'stage'
  | 'custom'

export type InstitutionalCalendarEventType =
  | 'holiday'
  | 'optional_holiday'
  | 'recess'
  | 'planning'
  | 'teacher_training'
  | 'school_council'
  | 'assessment'
  | 'recovery'
  | 'school_saturday'
  | 'closure'
  | 'commemorative'
  | 'operational'
  | 'enrollment'
  | 'deadline'
  | 'other'

export type InstitutionalCalendarScopeLevel =
  | 'national'
  | 'state'
  | 'municipal'
  | 'network'
  | 'organization'
  | 'school'

export type InstitutionalCalendarDateRule =
  | 'fixed_annual'
  | 'year_specific'
  | 'movable'
  | 'conditional'

export type InstitutionalCalendarSourceType =
  | 'legal'
  | 'official'
  | 'institutional'
  | 'imported'
  | 'manual'

export type InstitutionalCalendarPriority =
  | 'normal'
  | 'high'
  | 'critical'

export type InstitutionalCalendarEventStatus =
  | 'draft'
  | 'published'
  | 'cancelled'
  | 'archived'

export type SchoolOperatingHoursStatus =
  | 'active'
  | 'inactive'
  | 'archived'

export type SchoolCalendarOperationMode =
  | 'open'
  | 'closed'
  | 'partial'
  | 'remote'
  | 'replacement'

export type SchoolCalendarExceptionStatus =
  | 'active'
  | 'cancelled'
  | 'archived'

export type SchoolYear = {
  id: string

  organization_id: string
  school_id: string

  year: number

  name: string | null

  start_date: string | null
  end_date: string | null

  active: boolean

  status:
    AcademicCalendarStatus

  timezone: string

  minimum_school_days: number

  minimum_instructional_hours:
    number | null

  calendar_version: number

  published_at: string | null
  published_by: string | null

  closed_at: string | null
  closed_by: string | null

  created_by: string | null
  updated_by: string | null

  deleted_at: string | null
  deleted_by: string | null
  deletion_reason: string | null

  restored_at: string | null
  restored_by: string | null
  restore_reason: string | null

  metadata: Json

  created_at: string
  updated_at: string
}

export type AcademicPeriod = {
  id: string

  organization_id: string
  school_id: string
  school_year_id: string

  name: string
  code: string | null

  period_type:
    AcademicPeriodType

  sequence: number

  start_date: string
  end_date: string

  instructional_days_target:
    number | null

  status:
    AcademicCalendarStatus

  created_by: string | null
  updated_by: string | null

  published_at: string | null
  published_by: string | null

  deleted_at: string | null
  deleted_by: string | null
  deletion_reason: string | null

  restored_at: string | null
  restored_by: string | null
  restore_reason: string | null

  metadata: Json

  created_at: string
  updated_at: string
}

export type InstitutionalCalendarEvent = {
  id: string

  organization_id: string | null
  school_id: string | null

  school_year_id: string | null
  academic_period_id: string | null

  calendar_year: number

  title: string
  description: string | null

  event_type:
    InstitutionalCalendarEventType

  scope_level:
    InstitutionalCalendarScopeLevel

  date_rule:
    InstitutionalCalendarDateRule

  source_type:
    InstitutionalCalendarSourceType

  source_reference: string | null

  jurisdiction_country:
    string | null

  jurisdiction_state:
    string | null

  jurisdiction_city:
    string | null

  start_date: string
  end_date: string

  all_day: boolean

  start_time: string | null
  end_time: string | null

  fixed_month: number | null
  fixed_day: number | null

  calculation_rule: Json

  is_instructional_day: boolean
  counts_as_school_day: boolean
  suspends_classes: boolean
  is_mandatory: boolean

  priority:
    InstitutionalCalendarPriority

  status:
    InstitutionalCalendarEventStatus

  created_by: string | null
  updated_by: string | null

  published_at: string | null
  published_by: string | null

  cancelled_at: string | null
  cancelled_by: string | null
  cancellation_reason: string | null

  deleted_at: string | null
  deleted_by: string | null
  deletion_reason: string | null

  restored_at: string | null
  restored_by: string | null
  restore_reason: string | null

  metadata: Json

  created_at: string
  updated_at: string
}

export type SchoolOperatingHours = {
  id: string

  organization_id: string
  school_id: string
  school_year_id: string

  weekday: number

  shift_code: string
  shift_name: string | null

  start_time: string
  end_time: string

  break_start_time: string | null
  break_end_time: string | null

  lesson_duration_minutes:
    number | null

  is_operating_day: boolean

  status:
    SchoolOperatingHoursStatus

  created_by: string | null
  updated_by: string | null

  deleted_at: string | null
  deleted_by: string | null
  deletion_reason: string | null

  restored_at: string | null
  restored_by: string | null
  restore_reason: string | null

  metadata: Json

  created_at: string
  updated_at: string
}

export type SchoolCalendarException = {
  id: string

  organization_id: string
  school_id: string
  school_year_id: string

  source_event_id: string | null

  exception_date: string

  operation_mode:
    SchoolCalendarOperationMode

  shift_code: string | null

  start_time: string | null
  end_time: string | null

  replacement_date: string | null

  reason: string

  affects_classes: boolean
  counts_as_school_day: boolean

  status:
    SchoolCalendarExceptionStatus

  created_by: string | null
  updated_by: string | null

  deleted_at: string | null
  deleted_by: string | null
  deletion_reason: string | null

  restored_at: string | null
  restored_by: string | null
  restore_reason: string | null

  metadata: Json

  created_at: string
  updated_at: string
}

export type CreateSchoolYearInput = {
  organization_id: string
  school_id: string

  year: number

  name?: string | null

  start_date?: string | null
  end_date?: string | null

  active?: boolean

  status?:
    AcademicCalendarStatus

  timezone?: string

  minimum_school_days?: number

  minimum_instructional_hours?:
    number | null

  calendar_version?: number

  metadata?: Json
}

export type UpdateSchoolYearInput =
  Partial<CreateSchoolYearInput> & {
    published_at?: string | null
    published_by?: string | null

    closed_at?: string | null
    closed_by?: string | null
  }

export type CreateAcademicPeriodInput = {
  organization_id: string
  school_id: string
  school_year_id: string

  name: string
  code?: string | null

  period_type?:
    AcademicPeriodType

  sequence: number

  start_date: string
  end_date: string

  instructional_days_target?:
    number | null

  status?:
    AcademicCalendarStatus

  metadata?: Json
}

export type UpdateAcademicPeriodInput =
  Partial<CreateAcademicPeriodInput> & {
    published_at?: string | null
    published_by?: string | null
  }

export type CreateInstitutionalCalendarEventInput = {
  organization_id?: string | null
  school_id?: string | null

  school_year_id?: string | null
  academic_period_id?: string | null

  calendar_year: number

  title: string
  description?: string | null

  event_type:
    InstitutionalCalendarEventType

  scope_level:
    InstitutionalCalendarScopeLevel

  date_rule?:
    InstitutionalCalendarDateRule

  source_type?:
    InstitutionalCalendarSourceType

  source_reference?: string | null

  jurisdiction_country?:
    string | null

  jurisdiction_state?:
    string | null

  jurisdiction_city?:
    string | null

  start_date: string
  end_date: string

  all_day?: boolean

  start_time?: string | null
  end_time?: string | null

  fixed_month?: number | null
  fixed_day?: number | null

  calculation_rule?: Json

  is_instructional_day?: boolean
  counts_as_school_day?: boolean
  suspends_classes?: boolean
  is_mandatory?: boolean

  priority?:
    InstitutionalCalendarPriority

  status?:
    InstitutionalCalendarEventStatus

  metadata?: Json
}

export type UpdateInstitutionalCalendarEventInput =
  Partial<CreateInstitutionalCalendarEventInput> & {
    published_at?: string | null
    published_by?: string | null
  }

export type CreateSchoolOperatingHoursInput = {
  organization_id: string
  school_id: string
  school_year_id: string

  weekday: number

  shift_code?: string
  shift_name?: string | null

  start_time: string
  end_time: string

  break_start_time?: string | null
  break_end_time?: string | null

  lesson_duration_minutes?:
    number | null

  is_operating_day?: boolean

  status?:
    SchoolOperatingHoursStatus

  metadata?: Json
}

export type UpdateSchoolOperatingHoursInput =
  Partial<CreateSchoolOperatingHoursInput>

export type CreateSchoolCalendarExceptionInput = {
  organization_id: string
  school_id: string
  school_year_id: string

  source_event_id?: string | null

  exception_date: string

  operation_mode:
    SchoolCalendarOperationMode

  shift_code?: string | null

  start_time?: string | null
  end_time?: string | null

  replacement_date?: string | null

  reason: string

  affects_classes?: boolean
  counts_as_school_day?: boolean

  status?:
    SchoolCalendarExceptionStatus

  metadata?: Json
}

export type UpdateSchoolCalendarExceptionInput =
  Partial<CreateSchoolCalendarExceptionInput>

export type SoftDeleteCalendarRecordContext = {
  actorUserId: string
  reason: string
}

export type RestoreCalendarRecordContext = {
  actorUserId: string
  reason: string
}

export type CancelInstitutionalCalendarEventContext = {
  actorUserId: string
  reason: string
}

export type SchoolYearFilters = {
  organizationId?: string
  schoolId?: string
  year?: number

  statuses?:
    AcademicCalendarStatus[]

  includeDeleted?: boolean
}

export type AcademicPeriodFilters = {
  organizationId?: string
  schoolId?: string
  schoolYearId?: string

  statuses?:
    AcademicCalendarStatus[]

  includeDeleted?: boolean
}

export type InstitutionalCalendarEventFilters = {
  organizationId?: string
  schoolId?: string

  schoolYearId?: string
  academicPeriodId?: string

  calendarYear?: number

  startDate?: string
  endDate?: string

  eventTypes?:
    InstitutionalCalendarEventType[]

  scopeLevels?:
    InstitutionalCalendarScopeLevel[]

  statuses?:
    InstitutionalCalendarEventStatus[]

  priorities?:
    InstitutionalCalendarPriority[]

  jurisdictionState?: string
  jurisdictionCity?: string

  includeDeleted?: boolean
}

export type SchoolOperatingHoursFilters = {
  organizationId?: string
  schoolId?: string
  schoolYearId?: string

  weekday?: number
  shiftCode?: string

  statuses?:
    SchoolOperatingHoursStatus[]

  includeDeleted?: boolean
}

export type SchoolCalendarExceptionFilters = {
  organizationId?: string
  schoolId?: string
  schoolYearId?: string

  sourceEventId?: string

  startDate?: string
  endDate?: string

  operationModes?:
    SchoolCalendarOperationMode[]

  statuses?:
    SchoolCalendarExceptionStatus[]

  includeDeleted?: boolean
}

type AcademicCalendarTableName =
  | 'school_years'
  | 'academic_periods'
  | 'institutional_calendar_events'
  | 'school_operating_hours'
  | 'school_calendar_exceptions'

type DatabaseError = {
  message: string
}

function removeUndefinedValues(
  value: Record<string, unknown>,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(value).filter(
      ([, entryValue]) =>
        entryValue !== undefined,
    ),
  )
}

function normalizeRequiredValue(
  value: string,
  fieldName: string,
): string {
  const normalizedValue =
    value.trim()

  if (!normalizedValue) {
    throw new Error(
      `${fieldName} é obrigatório.`,
    )
  }

  return normalizedValue
}

function normalizeMutationContext(
  actorUserId: string,
  reason: string,
): {
  actorUserId: string
  reason: string
} {
  return {
    actorUserId:
      normalizeRequiredValue(
        actorUserId,
        'Usuário responsável',
      ),

    reason:
      normalizeRequiredValue(
        reason,
        'Motivo',
      ),
  }
}

function throwRepositoryError(
  operation: string,
  error: DatabaseError | null,
): never {
  throw new Error(
    `${operation}: ${
      error?.message ??
      'erro desconhecido no banco de dados.'
    }`,
  )
}

export class InstitutionalAcademicCalendarRepository {
  constructor(
    private readonly client:
      SupabaseClient,
  ) {
    if (!client) {
      throw new Error(
        'Cliente Supabase autenticado é obrigatório.',
      )
    }
  }

  private async updateRecord<
    RecordType,
  >(
    table:
      AcademicCalendarTableName,

    id: string,

    payload:
      Record<string, unknown>,

    operation:
      string,
  ): Promise<RecordType> {
    const normalizedId =
      normalizeRequiredValue(
        id,
        'Identificador do registro',
      )

    const {
      data,
      error,
    } =
      await this.client
        .from(table)
        .update(
          removeUndefinedValues(
            payload,
          ),
        )
        .eq(
          'id',
          normalizedId,
        )
        .select('*')
        .single()

    if (error) {
      throwRepositoryError(
        operation,
        error,
      )
    }

    return data as RecordType
  }

  private async softDeleteRecord<
    RecordType,
  >(
    table:
      AcademicCalendarTableName,

    id: string,

    context:
      SoftDeleteCalendarRecordContext,

    operation:
      string,
  ): Promise<RecordType> {
    const normalizedContext =
      normalizeMutationContext(
        context.actorUserId,
        context.reason,
      )

    return this.updateRecord<RecordType>(
      table,
      id,
      {
        deleted_at:
          new Date().toISOString(),

        deleted_by:
          normalizedContext
            .actorUserId,

        deletion_reason:
          normalizedContext.reason,

        restored_at: null,
        restored_by: null,
        restore_reason: null,
      },
      operation,
    )
  }

  private async restoreRecord<
    RecordType,
  >(
    table:
      AcademicCalendarTableName,

    id: string,

    context:
      RestoreCalendarRecordContext,

    operation:
      string,
  ): Promise<RecordType> {
    const normalizedContext =
      normalizeMutationContext(
        context.actorUserId,
        context.reason,
      )

    return this.updateRecord<RecordType>(
      table,
      id,
      {
        deleted_at: null,
        deleted_by: null,
        deletion_reason: null,

        restored_at:
          new Date().toISOString(),

        restored_by:
          normalizedContext
            .actorUserId,

        restore_reason:
          normalizedContext.reason,
      },
      operation,
    )
  }

  async findSchoolYears(
    filters:
      SchoolYearFilters = {},
  ): Promise<SchoolYear[]> {
    let query =
      this.client
        .from('school_years')
        .select('*')

    if (!filters.includeDeleted) {
      query =
        query.is(
          'deleted_at',
          null,
        )
    }

    if (filters.organizationId) {
      query =
        query.eq(
          'organization_id',
          filters.organizationId,
        )
    }

    if (filters.schoolId) {
      query =
        query.eq(
          'school_id',
          filters.schoolId,
        )
    }

    if (
      filters.year !==
      undefined
    ) {
      query =
        query.eq(
          'year',
          filters.year,
        )
    }

    if (
      filters.statuses?.length
    ) {
      query =
        query.in(
          'status',
          filters.statuses,
        )
    }

    const {
      data,
      error,
    } =
      await query
        .order(
          'year',
          {
            ascending: false,
          },
        )
        .order(
          'start_date',
          {
            ascending: true,
          },
        )

    if (error) {
      throwRepositoryError(
        'Erro ao listar anos letivos',
        error,
      )
    }

    return (
      data ?? []
    ) as SchoolYear[]
  }

  async findSchoolYearById(
    id: string,
    includeDeleted = false,
  ): Promise<SchoolYear | null> {
    let query =
      this.client
        .from('school_years')
        .select('*')
        .eq(
          'id',
          normalizeRequiredValue(
            id,
            'Ano letivo',
          ),
        )

    if (!includeDeleted) {
      query =
        query.is(
          'deleted_at',
          null,
        )
    }

    const {
      data,
      error,
    } =
      await query.maybeSingle()

    if (error) {
      throwRepositoryError(
        'Erro ao buscar ano letivo',
        error,
      )
    }

    return data as
      | SchoolYear
      | null
  }

  async createSchoolYear(
    input:
      CreateSchoolYearInput,
  ): Promise<SchoolYear> {
    const payload = {
      organization_id:
        input.organization_id,

      school_id:
        input.school_id,

      year:
        input.year,

      name:
        input.name ?? null,

      start_date:
        input.start_date ?? null,

      end_date:
        input.end_date ?? null,

      active:
        input.active ?? true,

      status:
        input.status ?? 'draft',

      timezone:
        input.timezone ??
        'America/Sao_Paulo',

      minimum_school_days:
        input.minimum_school_days ??
        200,

      minimum_instructional_hours:
        input
          .minimum_instructional_hours ??
        null,

      calendar_version:
        input.calendar_version ?? 1,

      metadata:
        input.metadata ?? {},
    }

    const {
      data,
      error,
    } =
      await this.client
        .from('school_years')
        .insert(payload)
        .select('*')
        .single()

    if (error) {
      throwRepositoryError(
        'Erro ao criar ano letivo',
        error,
      )
    }

    return data as SchoolYear
  }

  async updateSchoolYear(
    id: string,
    input:
      UpdateSchoolYearInput,
  ): Promise<SchoolYear> {
    return this.updateRecord<SchoolYear>(
      'school_years',
      id,
      input as
        Record<string, unknown>,
      'Erro ao atualizar ano letivo',
    )
  }

  async softDeleteSchoolYear(
    id: string,
    context:
      SoftDeleteCalendarRecordContext,
  ): Promise<SchoolYear> {
    return this.softDeleteRecord<SchoolYear>(
      'school_years',
      id,
      context,
      'Erro ao excluir ano letivo',
    )
  }

  async restoreSchoolYear(
    id: string,
    context:
      RestoreCalendarRecordContext,
  ): Promise<SchoolYear> {
    return this.restoreRecord<SchoolYear>(
      'school_years',
      id,
      context,
      'Erro ao restaurar ano letivo',
    )
  }

  async findAcademicPeriods(
    filters:
      AcademicPeriodFilters = {},
  ): Promise<AcademicPeriod[]> {
    let query =
      this.client
        .from('academic_periods')
        .select('*')

    if (!filters.includeDeleted) {
      query =
        query.is(
          'deleted_at',
          null,
        )
    }

    if (filters.organizationId) {
      query =
        query.eq(
          'organization_id',
          filters.organizationId,
        )
    }

    if (filters.schoolId) {
      query =
        query.eq(
          'school_id',
          filters.schoolId,
        )
    }

    if (filters.schoolYearId) {
      query =
        query.eq(
          'school_year_id',
          filters.schoolYearId,
        )
    }

    if (
      filters.statuses?.length
    ) {
      query =
        query.in(
          'status',
          filters.statuses,
        )
    }

    const {
      data,
      error,
    } =
      await query
        .order(
          'sequence',
          {
            ascending: true,
          },
        )
        .order(
          'start_date',
          {
            ascending: true,
          },
        )

    if (error) {
      throwRepositoryError(
        'Erro ao listar períodos letivos',
        error,
      )
    }

    return (
      data ?? []
    ) as AcademicPeriod[]
  }

  async findAcademicPeriodById(
    id: string,
    includeDeleted = false,
  ): Promise<AcademicPeriod | null> {
    let query =
      this.client
        .from('academic_periods')
        .select('*')
        .eq(
          'id',
          normalizeRequiredValue(
            id,
            'Período letivo',
          ),
        )

    if (!includeDeleted) {
      query =
        query.is(
          'deleted_at',
          null,
        )
    }

    const {
      data,
      error,
    } =
      await query.maybeSingle()

    if (error) {
      throwRepositoryError(
        'Erro ao buscar período letivo',
        error,
      )
    }

    return data as
      | AcademicPeriod
      | null
  }

  async createAcademicPeriod(
    input:
      CreateAcademicPeriodInput,
  ): Promise<AcademicPeriod> {
    const payload = {
      organization_id:
        input.organization_id,

      school_id:
        input.school_id,

      school_year_id:
        input.school_year_id,

      name:
        input.name,

      code:
        input.code ?? null,

      period_type:
        input.period_type ??
        'custom',

      sequence:
        input.sequence,

      start_date:
        input.start_date,

      end_date:
        input.end_date,

      instructional_days_target:
        input
          .instructional_days_target ??
        null,

      status:
        input.status ?? 'draft',

      metadata:
        input.metadata ?? {},
    }

    const {
      data,
      error,
    } =
      await this.client
        .from('academic_periods')
        .insert(payload)
        .select('*')
        .single()

    if (error) {
      throwRepositoryError(
        'Erro ao criar período letivo',
        error,
      )
    }

    return data as AcademicPeriod
  }

  async updateAcademicPeriod(
    id: string,
    input:
      UpdateAcademicPeriodInput,
  ): Promise<AcademicPeriod> {
    return this.updateRecord<AcademicPeriod>(
      'academic_periods',
      id,
      input as
        Record<string, unknown>,
      'Erro ao atualizar período letivo',
    )
  }

  async softDeleteAcademicPeriod(
    id: string,
    context:
      SoftDeleteCalendarRecordContext,
  ): Promise<AcademicPeriod> {
    return this.softDeleteRecord<AcademicPeriod>(
      'academic_periods',
      id,
      context,
      'Erro ao excluir período letivo',
    )
  }

  async restoreAcademicPeriod(
    id: string,
    context:
      RestoreCalendarRecordContext,
  ): Promise<AcademicPeriod> {
    return this.restoreRecord<AcademicPeriod>(
      'academic_periods',
      id,
      context,
      'Erro ao restaurar período letivo',
    )
  }

  async findInstitutionalEvents(
    filters:
      InstitutionalCalendarEventFilters = {},
  ): Promise<
    InstitutionalCalendarEvent[]
  > {
    let query =
      this.client
        .from(
          'institutional_calendar_events',
        )
        .select('*')

    if (!filters.includeDeleted) {
      query =
        query.is(
          'deleted_at',
          null,
        )
    }

    if (filters.organizationId) {
      query =
        query.eq(
          'organization_id',
          filters.organizationId,
        )
    }

    if (filters.schoolId) {
      query =
        query.eq(
          'school_id',
          filters.schoolId,
        )
    }

    if (filters.schoolYearId) {
      query =
        query.eq(
          'school_year_id',
          filters.schoolYearId,
        )
    }

    if (filters.academicPeriodId) {
      query =
        query.eq(
          'academic_period_id',
          filters.academicPeriodId,
        )
    }

    if (
      filters.calendarYear !==
      undefined
    ) {
      query =
        query.eq(
          'calendar_year',
          filters.calendarYear,
        )
    }

    if (filters.startDate) {
      query =
        query.gte(
          'end_date',
          filters.startDate,
        )
    }

    if (filters.endDate) {
      query =
        query.lte(
          'start_date',
          filters.endDate,
        )
    }

    if (
      filters.eventTypes?.length
    ) {
      query =
        query.in(
          'event_type',
          filters.eventTypes,
        )
    }

    if (
      filters.scopeLevels?.length
    ) {
      query =
        query.in(
          'scope_level',
          filters.scopeLevels,
        )
    }

    if (
      filters.statuses?.length
    ) {
      query =
        query.in(
          'status',
          filters.statuses,
        )
    }

    if (
      filters.priorities?.length
    ) {
      query =
        query.in(
          'priority',
          filters.priorities,
        )
    }

    if (
      filters.jurisdictionState
    ) {
      query =
        query.eq(
          'jurisdiction_state',
          filters.jurisdictionState,
        )
    }

    if (
      filters.jurisdictionCity
    ) {
      query =
        query.eq(
          'jurisdiction_city',
          filters.jurisdictionCity,
        )
    }

    const {
      data,
      error,
    } =
      await query
        .order(
          'start_date',
          {
            ascending: true,
          },
        )
        .order(
          'priority',
          {
            ascending: false,
          },
        )
        .order(
          'title',
          {
            ascending: true,
          },
        )

    if (error) {
      throwRepositoryError(
        'Erro ao listar eventos institucionais',
        error,
      )
    }

    return (
      data ?? []
    ) as InstitutionalCalendarEvent[]
  }

  async findInstitutionalEventById(
    id: string,
    includeDeleted = false,
  ): Promise<
    InstitutionalCalendarEvent | null
  > {
    let query =
      this.client
        .from(
          'institutional_calendar_events',
        )
        .select('*')
        .eq(
          'id',
          normalizeRequiredValue(
            id,
            'Evento institucional',
          ),
        )

    if (!includeDeleted) {
      query =
        query.is(
          'deleted_at',
          null,
        )
    }

    const {
      data,
      error,
    } =
      await query.maybeSingle()

    if (error) {
      throwRepositoryError(
        'Erro ao buscar evento institucional',
        error,
      )
    }

    return data as
      | InstitutionalCalendarEvent
      | null
  }

  async createInstitutionalEvent(
    input:
      CreateInstitutionalCalendarEventInput,
  ): Promise<
    InstitutionalCalendarEvent
  > {
    const payload = {
      organization_id:
        input.organization_id ?? null,

      school_id:
        input.school_id ?? null,

      school_year_id:
        input.school_year_id ?? null,

      academic_period_id:
        input.academic_period_id ??
        null,

      calendar_year:
        input.calendar_year,

      title:
        input.title,

      description:
        input.description ?? null,

      event_type:
        input.event_type,

      scope_level:
        input.scope_level,

      date_rule:
        input.date_rule ??
        'year_specific',

      source_type:
        input.source_type ??
        'manual',

      source_reference:
        input.source_reference ?? null,

      jurisdiction_country:
        input.jurisdiction_country ??
        'Brasil',

      jurisdiction_state:
        input.jurisdiction_state ??
        null,

      jurisdiction_city:
        input.jurisdiction_city ??
        null,

      start_date:
        input.start_date,

      end_date:
        input.end_date,

      all_day:
        input.all_day ?? true,

      start_time:
        input.start_time ?? null,

      end_time:
        input.end_time ?? null,

      fixed_month:
        input.fixed_month ?? null,

      fixed_day:
        input.fixed_day ?? null,

      calculation_rule:
        input.calculation_rule ?? {},

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
        input.priority ?? 'normal',

      status:
        input.status ?? 'draft',

      metadata:
        input.metadata ?? {},
    }

    const {
      data,
      error,
    } =
      await this.client
        .from(
          'institutional_calendar_events',
        )
        .insert(payload)
        .select('*')
        .single()

    if (error) {
      throwRepositoryError(
        'Erro ao criar evento institucional',
        error,
      )
    }

    return data as
      InstitutionalCalendarEvent
  }

  async updateInstitutionalEvent(
    id: string,
    input:
      UpdateInstitutionalCalendarEventInput,
  ): Promise<
    InstitutionalCalendarEvent
  > {
    return this.updateRecord<InstitutionalCalendarEvent>(
      'institutional_calendar_events',
      id,
      input as
        Record<string, unknown>,
      'Erro ao atualizar evento institucional',
    )
  }

  async cancelInstitutionalEvent(
    id: string,
    context:
      CancelInstitutionalCalendarEventContext,
  ): Promise<
    InstitutionalCalendarEvent
  > {
    const normalizedContext =
      normalizeMutationContext(
        context.actorUserId,
        context.reason,
      )

    return this.updateRecord<InstitutionalCalendarEvent>(
      'institutional_calendar_events',
      id,
      {
        status: 'cancelled',

        cancelled_at:
          new Date().toISOString(),

        cancelled_by:
          normalizedContext
            .actorUserId,

        cancellation_reason:
          normalizedContext.reason,
      },
      'Erro ao cancelar evento institucional',
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
    return this.updateRecord<InstitutionalCalendarEvent>(
      'institutional_calendar_events',
      id,
      {
        status,

        cancelled_at: null,
        cancelled_by: null,
        cancellation_reason: null,
      },
      'Erro ao reativar evento institucional',
    )
  }

  async softDeleteInstitutionalEvent(
    id: string,
    context:
      SoftDeleteCalendarRecordContext,
  ): Promise<
    InstitutionalCalendarEvent
  > {
    return this.softDeleteRecord<InstitutionalCalendarEvent>(
      'institutional_calendar_events',
      id,
      context,
      'Erro ao excluir evento institucional',
    )
  }

  async restoreInstitutionalEvent(
    id: string,
    context:
      RestoreCalendarRecordContext,
  ): Promise<
    InstitutionalCalendarEvent
  > {
    return this.restoreRecord<InstitutionalCalendarEvent>(
      'institutional_calendar_events',
      id,
      context,
      'Erro ao restaurar evento institucional',
    )
  }

  async findOperatingHours(
    filters:
      SchoolOperatingHoursFilters = {},
  ): Promise<
    SchoolOperatingHours[]
  > {
    let query =
      this.client
        .from(
          'school_operating_hours',
        )
        .select('*')

    if (!filters.includeDeleted) {
      query =
        query.is(
          'deleted_at',
          null,
        )
    }

    if (filters.organizationId) {
      query =
        query.eq(
          'organization_id',
          filters.organizationId,
        )
    }

    if (filters.schoolId) {
      query =
        query.eq(
          'school_id',
          filters.schoolId,
        )
    }

    if (filters.schoolYearId) {
      query =
        query.eq(
          'school_year_id',
          filters.schoolYearId,
        )
    }

    if (
      filters.weekday !==
      undefined
    ) {
      query =
        query.eq(
          'weekday',
          filters.weekday,
        )
    }

    if (filters.shiftCode) {
      query =
        query.eq(
          'shift_code',
          filters.shiftCode,
        )
    }

    if (
      filters.statuses?.length
    ) {
      query =
        query.in(
          'status',
          filters.statuses,
        )
    }

    const {
      data,
      error,
    } =
      await query
        .order(
          'weekday',
          {
            ascending: true,
          },
        )
        .order(
          'start_time',
          {
            ascending: true,
          },
        )

    if (error) {
      throwRepositoryError(
        'Erro ao listar horários institucionais',
        error,
      )
    }

    return (
      data ?? []
    ) as SchoolOperatingHours[]
  }

  async findOperatingHoursById(
    id: string,
    includeDeleted = false,
  ): Promise<
    SchoolOperatingHours | null
  > {
    let query =
      this.client
        .from(
          'school_operating_hours',
        )
        .select('*')
        .eq(
          'id',
          normalizeRequiredValue(
            id,
            'Horário institucional',
          ),
        )

    if (!includeDeleted) {
      query =
        query.is(
          'deleted_at',
          null,
        )
    }

    const {
      data,
      error,
    } =
      await query.maybeSingle()

    if (error) {
      throwRepositoryError(
        'Erro ao buscar horário institucional',
        error,
      )
    }

    return data as
      | SchoolOperatingHours
      | null
  }

  async createOperatingHours(
    input:
      CreateSchoolOperatingHoursInput,
  ): Promise<
    SchoolOperatingHours
  > {
    const payload = {
      organization_id:
        input.organization_id,

      school_id:
        input.school_id,

      school_year_id:
        input.school_year_id,

      weekday:
        input.weekday,

      shift_code:
        input.shift_code ??
        'general',

      shift_name:
        input.shift_name ?? null,

      start_time:
        input.start_time,

      end_time:
        input.end_time,

      break_start_time:
        input.break_start_time ??
        null,

      break_end_time:
        input.break_end_time ??
        null,

      lesson_duration_minutes:
        input
          .lesson_duration_minutes ??
        null,

      is_operating_day:
        input.is_operating_day ??
        true,

      status:
        input.status ?? 'active',

      metadata:
        input.metadata ?? {},
    }

    const {
      data,
      error,
    } =
      await this.client
        .from(
          'school_operating_hours',
        )
        .insert(payload)
        .select('*')
        .single()

    if (error) {
      throwRepositoryError(
        'Erro ao criar horário institucional',
        error,
      )
    }

    return data as
      SchoolOperatingHours
  }

  async updateOperatingHours(
    id: string,
    input:
      UpdateSchoolOperatingHoursInput,
  ): Promise<
    SchoolOperatingHours
  > {
    return this.updateRecord<SchoolOperatingHours>(
      'school_operating_hours',
      id,
      input as
        Record<string, unknown>,
      'Erro ao atualizar horário institucional',
    )
  }

  async softDeleteOperatingHours(
    id: string,
    context:
      SoftDeleteCalendarRecordContext,
  ): Promise<
    SchoolOperatingHours
  > {
    return this.softDeleteRecord<SchoolOperatingHours>(
      'school_operating_hours',
      id,
      context,
      'Erro ao excluir horário institucional',
    )
  }

  async restoreOperatingHours(
    id: string,
    context:
      RestoreCalendarRecordContext,
  ): Promise<
    SchoolOperatingHours
  > {
    return this.restoreRecord<SchoolOperatingHours>(
      'school_operating_hours',
      id,
      context,
      'Erro ao restaurar horário institucional',
    )
  }

  async findCalendarExceptions(
    filters:
      SchoolCalendarExceptionFilters = {},
  ): Promise<
    SchoolCalendarException[]
  > {
    let query =
      this.client
        .from(
          'school_calendar_exceptions',
        )
        .select('*')

    if (!filters.includeDeleted) {
      query =
        query.is(
          'deleted_at',
          null,
        )
    }

    if (filters.organizationId) {
      query =
        query.eq(
          'organization_id',
          filters.organizationId,
        )
    }

    if (filters.schoolId) {
      query =
        query.eq(
          'school_id',
          filters.schoolId,
        )
    }

    if (filters.schoolYearId) {
      query =
        query.eq(
          'school_year_id',
          filters.schoolYearId,
        )
    }

    if (filters.sourceEventId) {
      query =
        query.eq(
          'source_event_id',
          filters.sourceEventId,
        )
    }

    if (filters.startDate) {
      query =
        query.gte(
          'exception_date',
          filters.startDate,
        )
    }

    if (filters.endDate) {
      query =
        query.lte(
          'exception_date',
          filters.endDate,
        )
    }

    if (
      filters
        .operationModes
        ?.length
    ) {
      query =
        query.in(
          'operation_mode',
          filters.operationModes,
        )
    }

    if (
      filters.statuses?.length
    ) {
      query =
        query.in(
          'status',
          filters.statuses,
        )
    }

    const {
      data,
      error,
    } =
      await query
        .order(
          'exception_date',
          {
            ascending: true,
          },
        )
        .order(
          'shift_code',
          {
            ascending: true,
          },
        )

    if (error) {
      throwRepositoryError(
        'Erro ao listar exceções do calendário',
        error,
      )
    }

    return (
      data ?? []
    ) as SchoolCalendarException[]
  }

  async findCalendarExceptionById(
    id: string,
    includeDeleted = false,
  ): Promise<
    SchoolCalendarException | null
  > {
    let query =
      this.client
        .from(
          'school_calendar_exceptions',
        )
        .select('*')
        .eq(
          'id',
          normalizeRequiredValue(
            id,
            'Exceção do calendário',
          ),
        )

    if (!includeDeleted) {
      query =
        query.is(
          'deleted_at',
          null,
        )
    }

    const {
      data,
      error,
    } =
      await query.maybeSingle()

    if (error) {
      throwRepositoryError(
        'Erro ao buscar exceção do calendário',
        error,
      )
    }

    return data as
      | SchoolCalendarException
      | null
  }

  async createCalendarException(
    input:
      CreateSchoolCalendarExceptionInput,
  ): Promise<
    SchoolCalendarException
  > {
    const payload = {
      organization_id:
        input.organization_id,

      school_id:
        input.school_id,

      school_year_id:
        input.school_year_id,

      source_event_id:
        input.source_event_id ?? null,

      exception_date:
        input.exception_date,

      operation_mode:
        input.operation_mode,

      shift_code:
        input.shift_code ?? null,

      start_time:
        input.start_time ?? null,

      end_time:
        input.end_time ?? null,

      replacement_date:
        input.replacement_date ??
        null,

      reason:
        input.reason,

      affects_classes:
        input.affects_classes ??
        true,

      counts_as_school_day:
        input.counts_as_school_day ??
        false,

      status:
        input.status ?? 'active',

      metadata:
        input.metadata ?? {},
    }

    const {
      data,
      error,
    } =
      await this.client
        .from(
          'school_calendar_exceptions',
        )
        .insert(payload)
        .select('*')
        .single()

    if (error) {
      throwRepositoryError(
        'Erro ao criar exceção do calendário',
        error,
      )
    }

    return data as
      SchoolCalendarException
  }

  async updateCalendarException(
    id: string,
    input:
      UpdateSchoolCalendarExceptionInput,
  ): Promise<
    SchoolCalendarException
  > {
    return this.updateRecord<SchoolCalendarException>(
      'school_calendar_exceptions',
      id,
      input as
        Record<string, unknown>,
      'Erro ao atualizar exceção do calendário',
    )
  }

  async softDeleteCalendarException(
    id: string,
    context:
      SoftDeleteCalendarRecordContext,
  ): Promise<
    SchoolCalendarException
  > {
    return this.softDeleteRecord<SchoolCalendarException>(
      'school_calendar_exceptions',
      id,
      context,
      'Erro ao excluir exceção do calendário',
    )
  }

  async restoreCalendarException(
    id: string,
    context:
      RestoreCalendarRecordContext,
  ): Promise<
    SchoolCalendarException
  > {
    return this.restoreRecord<SchoolCalendarException>(
      'school_calendar_exceptions',
      id,
      context,
      'Erro ao restaurar exceção do calendário',
    )
  }
}