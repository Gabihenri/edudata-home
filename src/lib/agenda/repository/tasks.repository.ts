'use server'

import {
  createClient,
  type SupabaseClient,
} from '@supabase/supabase-js'

export type AgendaTask = {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  due_date: string | null
  event_id: string | null
  school_id: string | null
  user_id: string | null
  created_at: string
  updated_at: string
}

export type CreateAgendaTaskInput = {
  title: string
  description?: string | null
  status?: string
  priority?: string
  due_date?: string | null
  event_id?: string | null
  school_id?: string | null
  user_id?: string | null
}

export type UpdateAgendaTaskInput = Partial<CreateAgendaTaskInput>

function createSupabaseClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error('Variáveis do Supabase não configuradas.')
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
}

function mapTaskRow(data: Record<string, unknown>): AgendaTask {
  return {
    id: String(data.id),
    title: String(data.title),
    description: typeof data.description === 'string' ? data.description : null,
    status: String(data.status),
    priority: String(data.priority),
    due_date: typeof data.due_at === 'string'
      ? data.due_at
      : typeof data.due_date === 'string'
        ? data.due_date
        : null,
    event_id: typeof data.event_id === 'string' ? data.event_id : null,
    school_id: typeof data.school_id === 'string' ? data.school_id : null,
    user_id: typeof data.user_id === 'string' ? data.user_id : null,
    created_at: String(data.created_at),
    updated_at: String(data.updated_at),
  }
}

function normalizeStatus(status: string): string {
  const normalized = status
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()

  const aliases: Record<string, string> = {
    pendente: 'pending',
    pending: 'pending',
    andamento: 'in_progress',
    em_andamento: 'in_progress',
    in_progress: 'in_progress',
    concluida: 'completed',
    concluido: 'completed',
    finalizada: 'completed',
    finalizado: 'completed',
    done: 'completed',
    completed: 'completed',
    cancelada: 'cancelled',
    cancelado: 'cancelled',
    encerrada: 'cancelled',
    encerrado: 'cancelled',
    cancelled: 'cancelled',
  }

  const resolved = aliases[normalized]
  if (!resolved) throw new Error('Status da tarefa é inválido.')
  return resolved
}

class TasksRepository {
  private get client(): SupabaseClient {
    return createSupabaseClient()
  }

  async findAll(): Promise<AgendaTask[]> {
    const { data, error } = await this.client
      .from('agenda_tasks')
      .select('*')
      .is('archived_at', null)
      .order('due_at', { ascending: true })

    if (error) throw new Error(`Erro ao listar tarefas: ${error.message}`)
    return (data ?? []).map(row => mapTaskRow(row as Record<string, unknown>))
  }

  async findByUserId(userId: string): Promise<AgendaTask[]> {
    const { data, error } = await this.client
      .from('agenda_tasks')
      .select('*')
      .eq('user_id', userId)
      .is('archived_at', null)
      .order('due_at', { ascending: true })

    if (error) throw new Error(`Erro ao listar tarefas do usuário: ${error.message}`)
    return (data ?? []).map(row => mapTaskRow(row as Record<string, unknown>))
  }

  async findById(id: string): Promise<AgendaTask | null> {
    const { data, error } = await this.client
      .from('agenda_tasks')
      .select('*')
      .eq('id', id)
      .is('archived_at', null)
      .maybeSingle()

    if (error) throw new Error(`Erro ao buscar tarefa: ${error.message}`)
    return data ? mapTaskRow(data as Record<string, unknown>) : null
  }

  async findOwnedById(id: string, userId: string): Promise<AgendaTask | null> {
    const { data, error } = await this.client
      .from('agenda_tasks')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .is('archived_at', null)
      .maybeSingle()

    if (error) throw new Error(`Erro ao buscar tarefa do usuário: ${error.message}`)
    return data ? mapTaskRow(data as Record<string, unknown>) : null
  }

  async create(input: CreateAgendaTaskInput): Promise<AgendaTask> {
    const payload = {
      user_id: input.user_id,
      title: input.title,
      description: input.description ?? null,
      status: normalizeStatus(input.status ?? 'pending'),
      priority: input.priority ?? 'medium',
      due_at: input.due_date ?? null,
      source_type: 'manual',
      metadata: {
        event_id: input.event_id ?? null,
        school_id: input.school_id ?? null,
      },
    }

    const { data, error } = await this.client
      .from('agenda_tasks')
      .insert(payload)
      .select('*')
      .single()

    if (error) throw new Error(`Erro ao criar tarefa: ${error.message}`)
    return mapTaskRow(data as Record<string, unknown>)
  }

  async update(id: string, input: UpdateAgendaTaskInput): Promise<AgendaTask> {
    const payload: Record<string, unknown> = {}
    if (input.title !== undefined) payload.title = input.title
    if (input.description !== undefined) payload.description = input.description
    if (input.priority !== undefined) payload.priority = input.priority
    if (input.due_date !== undefined) payload.due_at = input.due_date

    if (input.status !== undefined) {
      const { data, error } = await this.client.rpc('set_agenda_task_status', {
        p_task_id: id,
        p_new_status: normalizeStatus(input.status),
        p_reason: null,
      })
      if (error) throw new Error(`Erro ao atualizar status da tarefa: ${error.message}`)
      return mapTaskRow(data as Record<string, unknown>)
    }

    const { data, error } = await this.client
      .from('agenda_tasks')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw new Error(`Erro ao atualizar tarefa: ${error.message}`)
    return mapTaskRow(data as Record<string, unknown>)
  }

  async updateOwned(id: string, userId: string, input: UpdateAgendaTaskInput): Promise<AgendaTask | null> {
    const existing = await this.findOwnedById(id, userId)
    if (!existing) return null

    if (input.status !== undefined) {
      const { data, error } = await this.client.rpc('set_agenda_task_status', {
        p_task_id: id,
        p_new_status: normalizeStatus(input.status),
        p_reason: null,
      })
      if (error) throw new Error(`Erro ao atualizar status da tarefa: ${error.message}`)
      return mapTaskRow(data as Record<string, unknown>)
    }

    const payload: Record<string, unknown> = {}
    if (input.title !== undefined) payload.title = input.title
    if (input.description !== undefined) payload.description = input.description
    if (input.priority !== undefined) payload.priority = input.priority
    if (input.due_date !== undefined) payload.due_at = input.due_date

    const { data, error } = await this.client
      .from('agenda_tasks')
      .update(payload)
      .eq('id', id)
      .eq('user_id', userId)
      .select('*')
      .maybeSingle()

    if (error) throw new Error(`Erro ao atualizar tarefa do usuário: ${error.message}`)
    return data ? mapTaskRow(data as Record<string, unknown>) : null
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client
      .from('agenda_tasks')
      .update({ archived_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw new Error(`Erro ao arquivar tarefa: ${error.message}`)
  }

  async deleteOwned(id: string, userId: string): Promise<boolean> {
    const { data, error } = await this.client
      .from('agenda_tasks')
      .update({ archived_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select('id')

    if (error) throw new Error(`Erro ao arquivar tarefa do usuário: ${error.message}`)
    return Array.isArray(data) && data.length > 0
  }
}

export const tasksRepository = new TasksRepository()
