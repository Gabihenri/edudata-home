import { createClient, type SupabaseClient } from '@supabase/supabase-js'

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
}

export type UpdateAgendaEventInput = Partial<CreateAgendaEventInput>

function createSupabaseClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error('Variáveis do Supabase não configuradas.')
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

class EventsRepository {
  private get client(): SupabaseClient {
    return createSupabaseClient()
  }

  async findAll(): Promise<AgendaEvent[]> {
    const { data, error } = await this.client
      .from('agenda_events')
      .select('*')
      .order('start_at', { ascending: true })

    if (error) {
      throw new Error(`Erro ao listar eventos: ${error.message}`)
    }

    return (data ?? []) as AgendaEvent[]
  }

  async findById(id: string): Promise<AgendaEvent | null> {
    const { data, error } = await this.client
      .from('agenda_events')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) {
      throw new Error(`Erro ao buscar evento: ${error.message}`)
    }

    return data as AgendaEvent | null
  }

  async findByUserId(userId: string): Promise<AgendaEvent[]> {
    const { data, error } = await this.client
      .from('agenda_events')
      .select('*')
      .eq('user_id', userId)
      .order('start_at', { ascending: true })

    if (error) {
      throw new Error(`Erro ao listar eventos do usuário: ${error.message}`)
    }

    return (data ?? []) as AgendaEvent[]
  }

  async findBySchoolId(schoolId: string): Promise<AgendaEvent[]> {
    const { data, error } = await this.client
      .from('agenda_events')
      .select('*')
      .eq('school_id', schoolId)
      .order('start_at', { ascending: true })

    if (error) {
      throw new Error(`Erro ao listar eventos da escola: ${error.message}`)
    }

    return (data ?? []) as AgendaEvent[]
  }

  async create(input: CreateAgendaEventInput): Promise<AgendaEvent> {
    const payload = {
      title: input.title,
      description: input.description ?? null,
      event_type: input.event_type ?? 'pedagogico',
      start_at: input.start_at,
      end_at: input.end_at ?? null,
      status: input.status ?? 'planejado',
      priority: input.priority ?? 'media',
      school_id: input.school_id ?? null,
      user_id: input.user_id ?? null,
      planning_id: input.planning_id ?? null,
      evidence_id: input.evidence_id ?? null,
    }

    const { data, error } = await this.client
      .from('agenda_events')
      .insert(payload)
      .select('*')
      .single()

    if (error) {
      throw new Error(`Erro ao criar evento: ${error.message}`)
    }

    return data as AgendaEvent
  }

  async update(
    id: string,
    input: UpdateAgendaEventInput,
  ): Promise<AgendaEvent> {
    const payload = {
      ...input,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await this.client
      .from('agenda_events')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      throw new Error(`Erro ao atualizar evento: ${error.message}`)
    }

    return data as AgendaEvent
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client
      .from('agenda_events')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Erro ao excluir evento: ${error.message}`)
    }
  }
}

export const eventsRepository = new EventsRepository()