import {
  createClient,
  type SupabaseClient,
} from '@supabase/supabase-js'

// ... existing repository implementation preserved ...

  async findOwnedById(
    id: string,
    userId: string,
  ): Promise<AgendaEvidence | null> {
    const evidenceId = normalizeRequiredText(id, 'ID da evidência')
    const ownerId = normalizeRequiredText(userId, 'ID do usuário')

    const { data, error } = await this.client
      .from('agenda_evidences')
      .select('*')
      .eq('id', evidenceId)
      .eq('user_id', ownerId)
      .is('deleted_at', null)
      .maybeSingle()

    if (error) {
      throw new Error(`Erro ao buscar evidência do usuário: ${error.message}`)
    }

    return data as AgendaEvidence | null
  }

