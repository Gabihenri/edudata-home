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

export type UpdateAgendaTaskInput =
  Partial<CreateAgendaTaskInput>

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

class TasksRepository {
  private get client(): SupabaseClient {
    return createSupabaseClient()
  }

  async findAll(): Promise<AgendaTask[]> {
    const { data, error } =
      await this.client
        .from('agenda_tasks')
        .select('*')
        .order('due_date', {
          ascending: true,
        })

    if (error) {
      throw new Error(
        `Erro ao listar tarefas: ${error.message}`,
      )
    }

    return (data ?? []) as AgendaTask[]
  }

  async findByUserId(
    userId: string,
  ): Promise<AgendaTask[]> {
    const { data, error } =
      await this.client
        .from('agenda_tasks')
        .select('*')
        .eq('user_id', userId)
        .order('due_date', {
          ascending: true,
        })

    if (error) {
      throw new Error(
        `Erro ao listar tarefas do usuário: ${error.message}`,
      )
    }

    return (data ?? []) as AgendaTask[]
  }

  async findById(
    id: string,
  ): Promise<AgendaTask | null> {
    const { data, error } =
      await this.client
        .from('agenda_tasks')
        .select('*')
        .eq('id', id)
        .maybeSingle()

    if (error) {
      throw new Error(
        `Erro ao buscar tarefa: ${error.message}`,
      )
    }

    return data as AgendaTask | null
  }

  async findOwnedById(
    id: string,
    userId: string,
  ): Promise<AgendaTask | null> {
    const { data, error } =
      await this.client
        .from('agenda_tasks')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .maybeSingle()

    if (error) {
      throw new Error(
        `Erro ao buscar tarefa do usuário: ${error.message}`,
      )
    }

    return data as AgendaTask | null
  }

  async create(
    input: CreateAgendaTaskInput,
  ): Promise<AgendaTask> {
    const { data, error } =
      await this.client
        .from('agenda_tasks')
        .insert(input)
        .select('*')
        .single()

    if (error) {
      throw new Error(
        `Erro ao criar tarefa: ${error.message}`,
      )
    }

    return data as AgendaTask
  }

  async update(
    id: string,
    input: UpdateAgendaTaskInput,
  ): Promise<AgendaTask> {
    const { data, error } =
      await this.client
        .from('agenda_tasks')
        .update({
          ...input,
          updated_at:
            new Date().toISOString(),
        })
        .eq('id', id)
        .select('*')
        .single()

    if (error) {
      throw new Error(
        `Erro ao atualizar tarefa: ${error.message}`,
      )
    }

    return data as AgendaTask
  }

  async updateOwned(
    id: string,
    userId: string,
    input: UpdateAgendaTaskInput,
  ): Promise<AgendaTask | null> {
    const { data, error } =
      await this.client
        .from('agenda_tasks')
        .update({
          ...input,
          updated_at:
            new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', userId)
        .select('*')
        .maybeSingle()

    if (error) {
      throw new Error(
        `Erro ao atualizar tarefa do usuário: ${error.message}`,
      )
    }

    return data as AgendaTask | null
  }

  async delete(
    id: string,
  ): Promise<void> {
    const { error } =
      await this.client
        .from('agenda_tasks')
        .delete()
        .eq('id', id)

    if (error) {
      throw new Error(
        `Erro ao excluir tarefa: ${error.message}`,
      )
    }
  }

  async deleteOwned(
    id: string,
    userId: string,
  ): Promise<boolean> {
    const { data, error } =
      await this.client
        .from('agenda_tasks')
        .delete()
        .eq('id', id)
        .eq('user_id', userId)
        .select('id')

    if (error) {
      throw new Error(
        `Erro ao excluir tarefa do usuário: ${error.message}`,
      )
    }

    return Array.isArray(data) &&
      data.length > 0
  }
}

export const tasksRepository =
  new TasksRepository()