import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export type AgendaEvidence = {
  id: string
  title: string
  description: string | null
  evidence_type: string
  file_url: string | null
  external_url: string | null
  planning_id: string | null
  event_id: string | null
  school_id: string | null
  user_id: string | null
  created_at: string
  updated_at: string
}

export type CreateAgendaEvidenceInput = {
  title: string
  description?: string | null
  evidence_type?: string
  file_url?: string | null
  external_url?: string | null
  planning_id?: string | null
  event_id?: string | null
  school_id?: string | null
  user_id?: string | null
}

export type UpdateAgendaEvidenceInput =
  Partial<CreateAgendaEvidenceInput>

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

class EvidencesRepository {
  private get client(): SupabaseClient {
    return createSupabaseClient()
  }

  async findAll(): Promise<AgendaEvidence[]> {
    const { data, error } = await this.client
      .from('agenda_evidences')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Erro ao listar evidências: ${error.message}`)
    }

    return (data ?? []) as AgendaEvidence[]
  }

  async findById(id: string): Promise<AgendaEvidence | null> {
    const { data, error } = await this.client
      .from('agenda_evidences')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) {
      throw new Error(`Erro ao buscar evidência: ${error.message}`)
    }

    return data as AgendaEvidence | null
  }

  async findByUserId(userId: string): Promise<AgendaEvidence[]> {
    const { data, error } = await this.client
      .from('agenda_evidences')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(
        `Erro ao listar evidências do usuário: ${error.message}`,
      )
    }

    return (data ?? []) as AgendaEvidence[]
  }

  async findBySchoolId(schoolId: string): Promise<AgendaEvidence[]> {
    const { data, error } = await this.client
      .from('agenda_evidences')
      .select('*')
      .eq('school_id', schoolId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(
        `Erro ao listar evidências da escola: ${error.message}`,
      )
    }

    return (data ?? []) as AgendaEvidence[]
  }

  async findByPlanningId(
    planningId: string,
  ): Promise<AgendaEvidence[]> {
    const { data, error } = await this.client
      .from('agenda_evidences')
      .select('*')
      .eq('planning_id', planningId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(
        `Erro ao listar evidências do planejamento: ${error.message}`,
      )
    }

    return (data ?? []) as AgendaEvidence[]
  }

  async findByEventId(eventId: string): Promise<AgendaEvidence[]> {
    const { data, error } = await this.client
      .from('agenda_evidences')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(
        `Erro ao listar evidências do evento: ${error.message}`,
      )
    }

    return (data ?? []) as AgendaEvidence[]
  }

  async create(
    input: CreateAgendaEvidenceInput,
  ): Promise<AgendaEvidence> {
    const payload = {
      title: input.title,
      description: input.description ?? null,
      evidence_type: input.evidence_type ?? 'texto',
      file_url: input.file_url ?? null,
      external_url: input.external_url ?? null,
      planning_id: input.planning_id ?? null,
      event_id: input.event_id ?? null,
      school_id: input.school_id ?? null,
      user_id: input.user_id ?? null,
    }

    const { data, error } = await this.client
      .from('agenda_evidences')
      .insert(payload)
      .select('*')
      .single()

    if (error) {
      throw new Error(`Erro ao criar evidência: ${error.message}`)
    }

    return data as AgendaEvidence
  }

  async update(
    id: string,
    input: UpdateAgendaEvidenceInput,
  ): Promise<AgendaEvidence> {
    const payload = {
      ...input,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await this.client
      .from('agenda_evidences')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      throw new Error(`Erro ao atualizar evidência: ${error.message}`)
    }

    return data as AgendaEvidence
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client
      .from('agenda_evidences')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Erro ao excluir evidência: ${error.message}`)
    }
  }
}

export const evidencesRepository = new EvidencesRepository()