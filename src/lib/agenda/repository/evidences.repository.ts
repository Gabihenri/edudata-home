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

  school_id: string | null
  user_id: string | null
  planning_id: string | null
  evidence_id: string | null

  schedule_mode: AgendaScheduleMode
  recurrence_frequency: AgendaRecurrenceFrequency
  recurrence_interval: number
  recurrence_until: string | null

  series_id: string | null
  source_template_id: string | null
  week_reference: string | null
  original_start_at: string | null
  is_exception: boolean

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
  recurrence_frequency?: AgendaRecurrenceFrequency
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
    },
  })
}

function getWeekReference(
  startAt: string,
): string {
  const date = new Date(startAt)

  if (Number.isNaN(date.getTime())) {
    throw new Error(
      'Data inicial inválida para calcular a semana.',
    )
  }

  const localDate = new Date(
    date.toLocaleString('en-US', {
      timeZone: 'America/Sao_Paulo',
    }),
  )

  const day =
    localDate.getDay() === 0
      ? 7
      : localDate.getDay()

  localDate.setDate(
    localDate.getDate() - day + 1,
  )

  const year = localDate.getFullYear()
  const month = String(
    localDate.getMonth() + 1,
  ).padStart(2, '0')
  const calendarDay = String(
    localDate.getDate(),
  ).padStart(2, '0')

  return `${year}-${month}-${calendarDay}`
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
      input.recurrence_frequency ?? 'none',

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
      getWeekReference(input.start_at),

    original_start_at:
      input.original_start_at ?? null,

    is_exception:
      input.is_exception ?? false,
  }
}

class EventsRepository {
  private get client(): SupabaseClient {
    return createSupabaseClient()
  }

  async findAll(): Promise<AgendaEvent[]> {
    const { data, error } =
      await this.client
        .from('agenda_events')
        .select('*')
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
        .maybeSingle()

    if (error) {
      throw new Error(
        `Erro ao buscar evento: ${error.message}`,
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
        .order('start_at', {
          ascending: true,
        })

    if (error) {
      throw new Error(
        `Erro ao listar série de eventos: ${error.message}`,
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

    const payloads = inputs.map(
      buildCreatePayload,
    )

    const { data, error } =
      await this.client
        .from('agenda_events')
        .insert(payloads)
        .select('*')

    if (error) {
      throw new Error(
        `Erro ao criar eventos recorrentes: ${error.message}`,
      )
    }

    return (data ?? []) as AgendaEvent[]
  }

  async update(
    id: string,
    input: UpdateAgendaEventInput,
  ): Promise<AgendaEvent> {
    const payload = {
      ...input,
      updated_at:
        new Date().toISOString(),
    }

    const { data, error } =
      await this.client
        .from('agenda_events')
        .update(payload)
        .eq('id', id)
        .select('*')
        .single()

    if (error) {
      throw new Error(
        `Erro ao atualizar evento: ${error.message}`,
      )
    }

    return data as AgendaEvent
  }

  async delete(id: string): Promise<void> {
    const { error } =
      await this.client
        .from('agenda_events')
        .delete()
        .eq('id', id)

    if (error) {
      throw new Error(
        `Erro ao excluir evento: ${error.message}`,
      )
    }
  }

  async deleteSeriesFromDate(
    seriesId: string,
    startAt: string,
  ): Promise<void> {
    const { error } =
      await this.client
        .from('agenda_events')
        .delete()
        .eq('series_id', seriesId)
        .gte('start_at', startAt)

    if (error) {
      throw new Error(
        `Erro ao excluir eventos futuros da série: ${error.message}`,
      )
    }
  }
}

export const eventsRepository =
  new EventsRepository()