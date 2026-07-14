import {
  createClient,
  type SupabaseClient,
} from '@supabase/supabase-js'

export type AgendaScheduleTemplate = {
  id: string

  title: string
  description: string | null

  event_type: string
  priority: string

  weekday: number

  start_time: string
  end_time: string | null

  timezone: string

  repeat_interval_weeks: number

  valid_from: string | null
  valid_until: string | null

  active: boolean

  school_id: string | null
  user_id: string | null

  created_at: string
  updated_at: string
}

export type CreateScheduleTemplateInput = {
  title: string
  description?: string | null

  event_type?: string
  priority?: string

  weekday: number

  start_time: string
  end_time?: string | null

  timezone?: string

  repeat_interval_weeks?: number

  valid_from?: string | null
  valid_until?: string | null

  active?: boolean

  school_id?: string | null
  user_id: string
}

export type UpdateScheduleTemplateInput =
  Partial<Omit<CreateScheduleTemplateInput, 'user_id'>>

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

function normalizeTime(
  value: string,
): string {
  const normalizedValue = value.trim()

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

function normalizeDate(
  value: string | null | undefined,
): string | null {
  if (!value) {
    return null
  }

  const normalizedValue = value.trim()

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      normalizedValue,
    )
  ) {
    throw new Error(
      'A data deve estar no formato YYYY-MM-DD.',
    )
  }

  return normalizedValue
}

function buildCreatePayload(
  input: CreateScheduleTemplateInput,
) {
  const title = input.title.trim()

  if (!title) {
    throw new Error(
      'O título do horário-padrão é obrigatório.',
    )
  }

  if (
    !Number.isInteger(input.weekday) ||
    input.weekday < 1 ||
    input.weekday > 7
  ) {
    throw new Error(
      'O dia da semana deve estar entre 1 e 7.',
    )
  }

  const repeatInterval =
    input.repeat_interval_weeks ?? 1

  if (
    !Number.isInteger(repeatInterval) ||
    repeatInterval < 1 ||
    repeatInterval > 52
  ) {
    throw new Error(
      'O intervalo de repetição deve estar entre 1 e 52 semanas.',
    )
  }

  const startTime = normalizeTime(
    input.start_time,
  )

  const endTime = input.end_time
    ? normalizeTime(input.end_time)
    : null

  if (
    endTime &&
    endTime <= startTime
  ) {
    throw new Error(
      'O horário final deve ser posterior ao horário inicial.',
    )
  }

  const validFrom = normalizeDate(
    input.valid_from,
  )

  const validUntil = normalizeDate(
    input.valid_until,
  )

  if (
    validFrom &&
    validUntil &&
    validUntil < validFrom
  ) {
    throw new Error(
      'A data final não pode ser anterior à data inicial.',
    )
  }

  return {
    title,

    description:
      input.description?.trim() || null,

    event_type:
      input.event_type?.trim() ||
      'pedagogico',

    priority:
      input.priority?.trim() ||
      'media',

    weekday: input.weekday,

    start_time: startTime,
    end_time: endTime,

    timezone:
      input.timezone?.trim() ||
      'America/Sao_Paulo',

    repeat_interval_weeks:
      repeatInterval,

    valid_from: validFrom,
    valid_until: validUntil,

    active:
      input.active ?? true,

    school_id:
      input.school_id ?? null,

    user_id: input.user_id,
  }
}

class ScheduleTemplatesRepository {
  private get client(): SupabaseClient {
    return createSupabaseClient()
  }

  async findById(
    id: string,
  ): Promise<AgendaScheduleTemplate | null> {
    const { data, error } =
      await this.client
        .from(
          'agenda_schedule_templates',
        )
        .select('*')
        .eq('id', id)
        .maybeSingle()

    if (error) {
      throw new Error(
        `Erro ao buscar horário-padrão: ${error.message}`,
      )
    }

    return data as AgendaScheduleTemplate | null
  }

  async findByUserId(
    userId: string,
    activeOnly = true,
  ): Promise<AgendaScheduleTemplate[]> {
    let query =
      this.client
        .from(
          'agenda_schedule_templates',
        )
        .select('*')
        .eq('user_id', userId)

    if (activeOnly) {
      query = query.eq('active', true)
    }

    const { data, error } =
      await query
        .order('weekday', {
          ascending: true,
        })
        .order('start_time', {
          ascending: true,
        })

    if (error) {
      throw new Error(
        `Erro ao listar horários-padrão: ${error.message}`,
      )
    }

    return (
      data ?? []
    ) as AgendaScheduleTemplate[]
  }

  async create(
    input: CreateScheduleTemplateInput,
  ): Promise<AgendaScheduleTemplate> {
    const payload =
      buildCreatePayload(input)

    const { data, error } =
      await this.client
        .from(
          'agenda_schedule_templates',
        )
        .insert(payload)
        .select('*')
        .single()

    if (error) {
      throw new Error(
        `Erro ao criar horário-padrão: ${error.message}`,
      )
    }

    return data as AgendaScheduleTemplate
  }

  async update(
    id: string,
    input: UpdateScheduleTemplateInput,
  ): Promise<AgendaScheduleTemplate> {
    const existingTemplate =
      await this.findById(id)

    if (!existingTemplate) {
      throw new Error(
        'Horário-padrão não encontrado.',
      )
    }

    const payload = buildCreatePayload({
      title:
        input.title ??
        existingTemplate.title,

      description:
        input.description !== undefined
          ? input.description
          : existingTemplate.description,

      event_type:
        input.event_type ??
        existingTemplate.event_type,

      priority:
        input.priority ??
        existingTemplate.priority,

      weekday:
        input.weekday ??
        existingTemplate.weekday,

      start_time:
        input.start_time ??
        existingTemplate.start_time,

      end_time:
        input.end_time !== undefined
          ? input.end_time
          : existingTemplate.end_time,

      timezone:
        input.timezone ??
        existingTemplate.timezone,

      repeat_interval_weeks:
        input.repeat_interval_weeks ??
        existingTemplate.repeat_interval_weeks,

      valid_from:
        input.valid_from !== undefined
          ? input.valid_from
          : existingTemplate.valid_from,

      valid_until:
        input.valid_until !== undefined
          ? input.valid_until
          : existingTemplate.valid_until,

      active:
        input.active ??
        existingTemplate.active,

      school_id:
        input.school_id !== undefined
          ? input.school_id
          : existingTemplate.school_id,

      user_id:
        existingTemplate.user_id ?? '',
    })

    const { data, error } =
      await this.client
        .from(
          'agenda_schedule_templates',
        )
        .update(payload)
        .eq('id', id)
        .select('*')
        .single()

    if (error) {
      throw new Error(
        `Erro ao atualizar horário-padrão: ${error.message}`,
      )
    }

    return data as AgendaScheduleTemplate
  }

  async deactivate(
    id: string,
  ): Promise<AgendaScheduleTemplate> {
    const { data, error } =
      await this.client
        .from(
          'agenda_schedule_templates',
        )
        .update({
          active: false,
        })
        .eq('id', id)
        .select('*')
        .single()

    if (error) {
      throw new Error(
        `Erro ao desativar horário-padrão: ${error.message}`,
      )
    }

    return data as AgendaScheduleTemplate
  }

  async activate(
    id: string,
  ): Promise<AgendaScheduleTemplate> {
    const { data, error } =
      await this.client
        .from(
          'agenda_schedule_templates',
        )
        .update({
          active: true,
        })
        .eq('id', id)
        .select('*')
        .single()

    if (error) {
      throw new Error(
        `Erro ao ativar horário-padrão: ${error.message}`,
      )
    }

    return data as AgendaScheduleTemplate
  }

  async delete(
    id: string,
  ): Promise<void> {
    const { error } =
      await this.client
        .from(
          'agenda_schedule_templates',
        )
        .delete()
        .eq('id', id)

    if (error) {
      throw new Error(
        `Erro ao excluir horário-padrão: ${error.message}`,
      )
    }
  }
}

export const scheduleTemplatesRepository =
  new ScheduleTemplatesRepository()