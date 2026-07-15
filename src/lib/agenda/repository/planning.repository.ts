import {
  createClient,
  type SupabaseClient,
} from '@supabase/supabase-js'

export type AgendaPlanning = {
  id: string
  title: string
  description: string | null
  subject: string | null
  class_name: string | null
  objective: string | null
  methodology: string | null
  resources: string | null
  evaluation: string | null
  planned_date: string | null
  status: string
  school_id: string | null
  user_id: string | null
  created_at: string
  updated_at: string
}

export type CreateAgendaPlanningInput = {
  title: string
  description?: string | null
  subject?: string | null
  class_name?: string | null
  objective?: string | null
  methodology?: string | null
  resources?: string | null
  evaluation?: string | null
  planned_date?: string | null
  status?: string
  school_id?: string | null
  user_id?: string | null
}

export type UpdateAgendaPlanningInput =
  Partial<CreateAgendaPlanningInput>

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

class PlanningRepository {
  private get client(): SupabaseClient {
    return createSupabaseClient()
  }

  /**
   * Uso administrativo interno.
   * Não utilizar diretamente em rotas comuns.
   */
  async findAll(): Promise<AgendaPlanning[]> {
    const { data, error } =
      await this.client
        .from('agenda_planning')
        .select('*')
        .order('planned_date', {
          ascending: true,
        })

    if (error) {
      throw new Error(
        `Erro ao listar planejamentos: ${error.message}`,
      )
    }

    return (data ?? []) as AgendaPlanning[]
  }

  async findByUserId(
    userId: string,
  ): Promise<AgendaPlanning[]> {
    const { data, error } =
      await this.client
        .from('agenda_planning')
        .select('*')
        .eq('user_id', userId)
        .order('planned_date', {
          ascending: true,
        })

    if (error) {
      throw new Error(
        `Erro ao listar planejamentos do usuário: ${error.message}`,
      )
    }

    return (data ?? []) as AgendaPlanning[]
  }

  /**
   * Uso administrativo interno.
   * Em rotas autenticadas, utilizar findOwnedById.
   */
  async findById(
    id: string,
  ): Promise<AgendaPlanning | null> {
    const { data, error } =
      await this.client
        .from('agenda_planning')
        .select('*')
        .eq('id', id)
        .maybeSingle()

    if (error) {
      throw new Error(
        `Erro ao buscar planejamento: ${error.message}`,
      )
    }

    return data as AgendaPlanning | null
  }

  async findOwnedById(
    id: string,
    userId: string,
  ): Promise<AgendaPlanning | null> {
    const { data, error } =
      await this.client
        .from('agenda_planning')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .maybeSingle()

    if (error) {
      throw new Error(
        `Erro ao buscar planejamento do usuário: ${error.message}`,
      )
    }

    return data as AgendaPlanning | null
  }

  async create(
    input: CreateAgendaPlanningInput,
  ): Promise<AgendaPlanning> {
    const { data, error } =
      await this.client
        .from('agenda_planning')
        .insert(input)
        .select('*')
        .single()

    if (error) {
      throw new Error(
        `Erro ao criar planejamento: ${error.message}`,
      )
    }

    return data as AgendaPlanning
  }

  /**
   * Uso administrativo interno.
   * Em rotas autenticadas, utilizar updateOwned.
   */
  async update(
    id: string,
    input: UpdateAgendaPlanningInput,
  ): Promise<AgendaPlanning> {
    const { data, error } =
      await this.client
        .from('agenda_planning')
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
        `Erro ao atualizar planejamento: ${error.message}`,
      )
    }

    return data as AgendaPlanning
  }

  async updateOwned(
    id: string,
    userId: string,
    input: UpdateAgendaPlanningInput,
  ): Promise<AgendaPlanning | null> {
    const { data, error } =
      await this.client
        .from('agenda_planning')
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
        `Erro ao atualizar planejamento do usuário: ${error.message}`,
      )
    }

    return data as AgendaPlanning | null
  }

  /**
   * Uso administrativo interno.
   * Em rotas autenticadas, utilizar deleteOwned.
   */
  async delete(
    id: string,
  ): Promise<void> {
    const { error } =
      await this.client
        .from('agenda_planning')
        .delete()
        .eq('id', id)

    if (error) {
      throw new Error(
        `Erro ao excluir planejamento: ${error.message}`,
      )
    }
  }

  async deleteOwned(
    id: string,
    userId: string,
  ): Promise<boolean> {
    const { data, error } =
      await this.client
        .from('agenda_planning')
        .delete()
        .eq('id', id)
        .eq('user_id', userId)
        .select('id')

    if (error) {
      throw new Error(
        `Erro ao excluir planejamento do usuário: ${error.message}`,
      )
    }

    return Array.isArray(data) &&
      data.length > 0
  }
}

export const planningRepository =
  new PlanningRepository()