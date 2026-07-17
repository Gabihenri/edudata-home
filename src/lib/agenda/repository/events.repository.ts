import {
  createClient,
  type SupabaseClient,
} from '@supabase/supabase-js'

export type AgendaScheduleMode =
  | 'pontual'
  | 'recorrente'
  | 'modelo'

export type AgendaRecurrenceFrequency =
  | 'none'
  | 'weekly'

export type AgendaEvent = {
  id: string

  title: string
  description: string | null

  event_type: string

  start_at: string
  end_at: string | null

  status: string
  priority: string

  organization_id: string | null
  school_id: string | null
  user_id: string | null

  planning_id: string | null
  evidence_id: string | null

  schedule_mode: AgendaScheduleMode

  recurrence_frequency:
    AgendaRecurrenceFrequency

  recurrence_interval: number
  recurrence_until: string | null

  series_id: string | null
  source_template_id: string | null

  week_reference: string | null
  original_start_at: string | null

  is_exception: boolean

  created_by: string | null
  updated_by: string | null

  deleted_at: string | null
  deleted_by: string | null
  deletion_reason: string | null

  restored_at: string | null
  restored_by: string | null
  restore_reason: string | null

  created_at: string
  updated_at: string
}

export type CreateAgendaEventInput = {
  title: string
  description?: string | null

  event_type?: string

  start_at: string
  end_at?: string | null

  status?: string
  priority?: string

  school_id?: string | null
  user_id?: string | null

  planning_id?: string | null
  evidence_id?: string | null

  schedule_mode?: AgendaScheduleMode

  recurrence_frequency?:
    AgendaRecurrenceFrequency

  recurrence_interval?: number
  recurrence_until?: string | null

  series_id?: string | null
  source_template_id?: string | null

  week_reference?: string | null
  original_start_at?: string | null

  is_exception?: boolean
}

export type UpdateAgendaEventInput =
  Partial<CreateAgendaEventInput>

export type DeleteAgendaEventContext = {
  actorUserId: string
  reason: string
}

export type RestoreAgendaEventContext = {
  actorUserId: string
  reason: string
}

const AGENDA_TIMEZONE =
  'America/Sao_Paulo'

function createSupabaseClient(): SupabaseClient {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL

  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error(
      'Variáveis do Supabase não configuradas.',
    )
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
}

function getDateKeyInTimeZone(
  date: Date,
): string {
  const parts =
    new Intl.DateTimeFormat('en-CA', {
      timeZone: AGENDA_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(date)

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
      'Não foi possível calcular a data do evento.',
    )
  }

  return `${year}-${month}-${day}`
}

function calculateWeekReference(
  startAt: string,
): string {
  const date = new Date(startAt)

  if (Number.isNaN(date.getTime())) {
    throw new Error(
      'Data inicial inválida para calcular a semana.',
    )
  }

  const localDateKey =
    getDateKeyInTimeZone(date)

  const [
    year,
    month,
    day,
  ] = localDateKey
    .split('-')
    .map(Number)

  const localCalendarDate =
    new Date(
      Date.UTC(
        year,
        month - 1,
        day,
        12,
        0,
        0,
        0,
      ),
    )

  const weekday =
    localCalendarDate.getUTCDay() === 0
      ? 7
      : localCalendarDate.getUTCDay()

  localCalendarDate.setUTCDate(
    localCalendarDate.getUTCDate() -
      weekday +
      1,
  )

  return localCalendarDate
    .toISOString()
    .slice(0, 10)
}

function normalizeDeletionContext(
  actorUserId?: string,
  reason?: string,
): DeleteAgendaEventContext {
  const normalizedActorUserId =
    actorUserId?.trim()

  if (!normalizedActorUserId) {
    throw new Error(
      'ID do usuário responsável pela exclusão é obrigatório.',
    )
  }

  const normalizedReason =
    reason?.trim()

  if (!normalizedReason) {
    throw new Error(
      'Motivo da exclusão é obrigatório.',
    )
  }

  return {
    actorUserId: normalizedActorUserId,
    reason: normalizedReason,
  }
}

function normalizeRestorationContext(
  actorUserId?: string,
  reason?: string,
): RestoreAgendaEventContext {
  const normalizedActorUserId =
    actorUserId?.trim()

  if (!normalizedActorUserId) {
    throw new Error(
      'ID do usuário responsável pela restauração é obrigatório.',
    )
  }

  const normalizedReason =
    reason?.trim()

  if (!normalizedReason) {
    throw new Error(
      'Motivo da restauração é obrigatório.',
    )
  }

  return {
    actorUserId: normalizedActorUserId,
    reason: normalizedReason,
  }
}

function buildCreatePayload(
  input: CreateAgendaEventInput,
) {
  return {
    title: input.title,

    description:
      input.description ?? null,

    event_type:
      input.event_type ?? 'pedagogico',

    start_at: input.start_at,
    end_at: input.end_at ?? null,

    status:
      input.status ?? 'planejado',

    priority:
      input.priority ?? 'media',

    school_id:
      input.school_id ?? null,

    user_id:
      input.user_id ?? null,

    planning_id:
      input.planning_id ?? null,

    evidence_id:
      input.evidence_id ?? null,

    schedule_mode:
      input.schedule_mode ?? 'pontual',

    recurrence_frequency:
      input.recurrence_frequency ??
      'none',

    recurrence_interval:
      input.recurrence_interval ?? 1,

    recurrence_until:
      input.recurrence_until ?? null,

    series_id:
      input.series_id ?? null,

    source_template_id:
      input.source_template_id ?? null,

    week_reference:
      input.week_reference ??
      calculateWeekReference(
        input.start_at,
      ),

    original_start_at:
      input.original_start_at ?? null,

    is_exception:
      input.is_exception ?? false,

    created_by:
      input.user_id ?? null,

    updated_by:
      input.user_id ?? null,
  }
}

function buildUpdatePayload(
  input: UpdateAgendaEventInput,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    updated_at:
      new Date().toISOString(),
  }

  if (input.title !== undefined) {
    payload.title = input.title
  }

  if (input.description !== undefined) {
    payload.description =
      input.description
  }

  if (input.event_type !== undefined) {
    payload.event_type =
      input.event_type
  }

  if (input.start_at !== undefined) {
    payload.start_at =
      input.start_at

    if (
      input.week_reference === undefined
    ) {
      payload.week_reference =
        calculateWeekReference(
          input.start_at,
        )
    }
  }

  if (input.end_at !== undefined) {
    payload.end_at =
      input.end_at
  }

  if (input.status !== undefined) {
    payload.status =
      input.status
  }

  if (input.priority !== undefined) {
    payload.priority =
      input.priority
  }

  if (input.school_id !== undefined) {
    payload.school_id =
      input.school_id
  }

  if (input.user_id !== undefined) {
    payload.user_id =
      input.user_id
  }

  if (input.planning_id !== undefined) {
    payload.planning_id =
      input.planning_id
  }

  if (input.evidence_id !== undefined) {
    payload.evidence_id =
      input.evidence_id
  }

  if (
    input.schedule_mode !== undefined
  ) {
    payload.schedule_mode =
      input.schedule_mode
  }

  if (
    input.recurrence_frequency !==
    undefined
  ) {
    payload.recurrence_frequency =
      input.recurrence_frequency
  }

  if (
    input.recurrence_interval !==
    undefined
  ) {
    payload.recurrence_interval =
      input.recurrence_interval
  }

  if (
    input.recurrence_until !== undefined
  ) {
    payload.recurrence_until =
      input.recurrence_until
  }

  if (input.series_id !== undefined) {
    payload.series_id =
      input.series_id
  }

  if (
    input.source_template_id !==
    undefined
  ) {
    payload.source_template_id =
      input.source_template_id
  }

  if (
    input.week_reference !== undefined
  ) {
    payload.week_reference =
      input.week_reference
  }

  if (
    input.original_start_at !== undefined
  ) {
    payload.original_start_at =
      input.original_start_at
  }

  if (
    input.is_exception !== undefined
  ) {
    payload.is_exception =
      input.is_exception
  }

  return payload
}

class EventsRepository {
  private get client(): SupabaseClient {
    return createSupabaseClient()
  }

  async findAll(): Promise<
    AgendaEvent[]
  > {
    const { data, error } =
      await this.client
        .from('agenda_events')
        .select('*')
        .is('deleted_at', null)
        .order('start_at', {
          ascending: true,
        })

    if (error) {
      throw new Error(
        `Erro ao listar eventos: ${error.message}`,
      )
    }

    return (data ?? []) as AgendaEvent[]
  }

  async findById(
    id: string,
  ): Promise<AgendaEvent | null> {
    const { data, error } =
      await this.client
        .from('agenda_events')
        .select('*')
        .eq('id', id)
        .is('deleted_at', null)
        .maybeSingle()

    if (error) {
      throw new Error(
        `Erro ao buscar evento: ${error.message}`,
      )
    }

    return data as AgendaEvent | null
  }

  async findByIdIncludingDeleted(
    id: string,
  ): Promise<AgendaEvent | null> {
    const { data, error } =
      await this.client
        .from('agenda_events')
        .select('*')
        .eq('id', id)
        .maybeSingle()

    if (error) {
      throw new Error(
        `Erro ao buscar evento com histórico: ${error.message}`,
      )
    }

    return data as AgendaEvent | null
  }

  async findByUserId(
    userId: string,
  ): Promise<AgendaEvent[]> {
    const { data, error } =
      await this.client
        .from('agenda_events')
        .select('*')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .order('start_at', {
          ascending: true,
        })

    if (error) {
      throw new Error(
        `Erro ao listar eventos do usuário: ${error.message}`,
      )
    }

    return (data ?? []) as AgendaEvent[]
  }

  async findByUserAndWeek(
    userId: string,
    weekReference: string,
  ): Promise<AgendaEvent[]> {
    const { data, error } =
      await this.client
        .from('agenda_events')
        .select('*')
        .eq('user_id', userId)
        .eq(
          'week_reference',
          weekReference,
        )
        .is('deleted_at', null)
        .order('start_at', {
          ascending: true,
        })

    if (error) {
      throw new Error(
        `Erro ao listar eventos da semana: ${error.message}`,
      )
    }

    return (data ?? []) as AgendaEvent[]
  }

  async findBySchoolId(
    schoolId: string,
  ): Promise<AgendaEvent[]> {
    const { data, error } =
      await this.client
        .from('agenda_events')
        .select('*')
        .eq('school_id', schoolId)
        .is('deleted_at', null)
        .order('start_at', {
          ascending: true,
        })

    if (error) {
      throw new Error(
        `Erro ao listar eventos da escola: ${error.message}`,
      )
    }

    return (data ?? []) as AgendaEvent[]
  }

  async findBySeriesId(
    seriesId: string,
  ): Promise<AgendaEvent[]> {
    const { data, error } =
      await this.client
        .from('agenda_events')
        .select('*')
        .eq('series_id', seriesId)
        .is('deleted_at', null)
        .order('start_at', {
          ascending: true,
        })

    if (error) {
      throw new Error(
        `Erro ao listar a série de eventos: ${error.message}`,
      )
    }

    return (data ?? []) as AgendaEvent[]
  }

  async create(
    input: CreateAgendaEventInput,
  ): Promise<AgendaEvent> {
    const payload =
      buildCreatePayload(input)

    const { data, error } =
      await this.client
        .from('agenda_events')
        .insert(payload)
        .select('*')
        .single()

    if (error) {
      throw new Error(
        `Erro ao criar evento: ${error.message}`,
      )
    }

    return data as AgendaEvent
  }

  async createMany(
    inputs: CreateAgendaEventInput[],
  ): Promise<AgendaEvent[]> {
    if (inputs.length === 0) {
      return []
    }

    const payloads =
      inputs.map(buildCreatePayload)

    const { data, error } =
      await this.client
        .from('agenda_events')
        .insert(payloads)
        .select('*')

    if (error) {
      throw new Error(
        `Erro ao criar eventos: ${error.message}`,
      )
    }

    return (data ?? []) as AgendaEvent[]
  }

  async update(
    id: string,
    input: UpdateAgendaEventInput,
  ): Promise<AgendaEvent> {
    const payload =
      buildUpdatePayload(input)

    const { data, error } =
      await this.client
        .from('agenda_events')
        .update(payload)
        .eq('id', id)
        .is('deleted_at', null)
        .select('*')
        .single()

    if (error) {
      throw new Error(
        `Erro ao atualizar evento: ${error.message}`,
      )
    }

    return data as AgendaEvent
  }

  async delete(
    id: string,
    actorUserId?: string,
    reason?: string,
  ): Promise<void> {
    const context =
      normalizeDeletionContext(
        actorUserId,
        reason,
      )

    const { error } =
      await this.client.rpc(
        'soft_delete_agenda_record',
        {
          requested_resource_type:
            'agenda_events',

          requested_resource_id:
            id,

          requested_reason:
            context.reason,

          requested_actor_user_id:
            context.actorUserId,
        },
      )

    if (error) {
      throw new Error(
        `Erro ao excluir evento: ${error.message}`,
      )
    }
  }

  async restore(
    id: string,
    actorUserId?: string,
    reason?: string,
  ): Promise<AgendaEvent> {
    const context =
      normalizeRestorationContext(
        actorUserId,
        reason,
      )

    const {
      data,
      error,
    } =
      await this.client.rpc(
        'restore_agenda_record',
        {
          requested_resource_type:
            'agenda_events',

          requested_resource_id:
            id,

          requested_reason:
            context.reason,

          requested_actor_user_id:
            context.actorUserId,
        },
      )

    if (error) {
      throw new Error(
        `Erro ao restaurar evento: ${error.message}`,
      )
    }

    if (!data) {
      throw new Error(
        'A restauração não retornou o evento atualizado.',
      )
    }

    return data as unknown as AgendaEvent
  }

  async deleteSeriesFromDate(
    seriesId: string,
    startAt: string,
    actorUserId?: string,
    reason?: string,
  ): Promise<void> {
    const context =
      normalizeDeletionContext(
        actorUserId,
        reason,
      )

    const events =
      await this.findBySeriesId(
        seriesId,
      )

    const eventsToDelete =
      events.filter(
        (event) =>
          new Date(event.start_at).getTime() >=
          new Date(startAt).getTime(),
      )

    for (const event of eventsToDelete) {
      await this.delete(
        event.id,
        context.actorUserId,
        context.reason,
      )
    }
  }
}

export const eventsRepository =
  new EventsRepository()