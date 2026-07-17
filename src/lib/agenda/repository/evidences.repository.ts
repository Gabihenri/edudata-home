import {
  createClient,
  type SupabaseClient,
} from '@supabase/supabase-js'

export type AgendaEvidenceType =
  | 'texto'
  | 'imagem'
  | 'pdf'
  | 'link'

export type AgendaEvidence = {
  id: string

  title: string
  description: string | null

  evidence_type: AgendaEvidenceType

  /*
   * Mantido temporariamente para compatibilidade
   * com evidências antigas que utilizam URL pública.
   */
  file_url: string | null
  external_url: string | null

  planning_id: string | null
  event_id: string | null

  organization_id: string | null
  school_id: string | null
  user_id: string | null

  /*
   * Proteção da imagem e dos dados de menores.
   */
  contains_identifiable_minor: boolean

  guardian_authorization_confirmed: boolean
  authorization_reference: string | null

  authorization_confirmed_at: string | null
  authorization_confirmed_by: string | null

  privacy_notice_version: string

  /*
   * Referências utilizadas pelo armazenamento privado.
   */
  storage_bucket: string | null
  storage_path: string | null

  original_file_name: string | null
  file_mime_type: string | null
  file_size_bytes: number | null

  /*
   * Governança e auditoria.
   */
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

export type CreateAgendaEvidenceInput = {
  title: string
  description?: string | null

  evidence_type?: AgendaEvidenceType

  file_url?: string | null
  external_url?: string | null

  planning_id?: string | null
  event_id?: string | null

  organization_id?: string | null
  school_id?: string | null
  user_id?: string | null

  contains_identifiable_minor?: boolean

  guardian_authorization_confirmed?: boolean
  authorization_reference?: string | null

  authorization_confirmed_at?: string | null
  authorization_confirmed_by?: string | null

  privacy_notice_version?: string

  storage_bucket?: string | null
  storage_path?: string | null

  original_file_name?: string | null
  file_mime_type?: string | null
  file_size_bytes?: number | null

  created_by?: string | null
  updated_by?: string | null
}

export type UpdateAgendaEvidenceInput =
  Partial<CreateAgendaEvidenceInput>

export type DeleteAgendaEvidenceContext = {
  actorUserId: string
  reason: string
}

export type RestoreAgendaEvidenceContext = {
  actorUserId: string
  reason: string
}

const DEFAULT_PRIVACY_NOTICE_VERSION =
  'edi-protecao-menores-v1.0'

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

function normalizeRequiredText(
  value: string | undefined,
  fieldName: string,
): string {
  const normalizedValue =
    value?.trim()

  if (!normalizedValue) {
    throw new Error(
      `${fieldName} é obrigatório.`,
    )
  }

  return normalizedValue
}

function normalizeDeletionContext(
  actorUserId?: string,
  reason?: string,
): DeleteAgendaEvidenceContext {
  const normalizedActorUserId =
    normalizeRequiredText(
      actorUserId,
      'ID do usuário responsável pela exclusão',
    )

  const normalizedReason =
    normalizeRequiredText(
      reason,
      'Motivo da exclusão',
    )

  return {
    actorUserId:
      normalizedActorUserId,

    reason:
      normalizedReason,
  }
}

function normalizeRestorationContext(
  actorUserId?: string,
  reason?: string,
): RestoreAgendaEvidenceContext {
  const normalizedActorUserId =
    normalizeRequiredText(
      actorUserId,
      'ID do usuário responsável pela restauração',
    )

  const normalizedReason =
    normalizeRequiredText(
      reason,
      'Motivo da restauração',
    )

  return {
    actorUserId:
      normalizedActorUserId,

    reason:
      normalizedReason,
  }
}

function buildCreatePayload(
  input: CreateAgendaEvidenceInput,
) {
  return {
    title: input.title,

    description:
      input.description ?? null,

    evidence_type:
      input.evidence_type ?? 'texto',

    file_url:
      input.file_url ?? null,

    external_url:
      input.external_url ?? null,

    planning_id:
      input.planning_id ?? null,

    event_id:
      input.event_id ?? null,

    organization_id:
      input.organization_id ?? null,

    school_id:
      input.school_id ?? null,

    user_id:
      input.user_id ?? null,

    contains_identifiable_minor:
      input.contains_identifiable_minor ??
      false,

    guardian_authorization_confirmed:
      input.guardian_authorization_confirmed ??
      false,

    authorization_reference:
      input.authorization_reference ??
      null,

    authorization_confirmed_at:
      input.authorization_confirmed_at ??
      null,

    authorization_confirmed_by:
      input.authorization_confirmed_by ??
      null,

    privacy_notice_version:
      input.privacy_notice_version ??
      DEFAULT_PRIVACY_NOTICE_VERSION,

    storage_bucket:
      input.storage_bucket ?? null,

    storage_path:
      input.storage_path ?? null,

    original_file_name:
      input.original_file_name ?? null,

    file_mime_type:
      input.file_mime_type ?? null,

    file_size_bytes:
      input.file_size_bytes ?? null,

    created_by:
      input.created_by ?? null,

    updated_by:
      input.updated_by ?? null,
  }
}

function buildUpdatePayload(
  input: UpdateAgendaEvidenceInput,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (input.title !== undefined) {
    payload.title =
      input.title
  }

  if (input.description !== undefined) {
    payload.description =
      input.description
  }

  if (
    input.evidence_type !== undefined
  ) {
    payload.evidence_type =
      input.evidence_type
  }

  if (input.file_url !== undefined) {
    payload.file_url =
      input.file_url
  }

  if (
    input.external_url !== undefined
  ) {
    payload.external_url =
      input.external_url
  }

  if (
    input.planning_id !== undefined
  ) {
    payload.planning_id =
      input.planning_id
  }

  if (input.event_id !== undefined) {
    payload.event_id =
      input.event_id
  }

  if (
    input.organization_id !== undefined
  ) {
    payload.organization_id =
      input.organization_id
  }

  if (input.school_id !== undefined) {
    payload.school_id =
      input.school_id
  }

  if (input.user_id !== undefined) {
    payload.user_id =
      input.user_id
  }

  if (
    input.contains_identifiable_minor !==
    undefined
  ) {
    payload.contains_identifiable_minor =
      input.contains_identifiable_minor
  }

  if (
    input.guardian_authorization_confirmed !==
    undefined
  ) {
    payload.guardian_authorization_confirmed =
      input.guardian_authorization_confirmed
  }

  if (
    input.authorization_reference !==
    undefined
  ) {
    payload.authorization_reference =
      input.authorization_reference
  }

  if (
    input.authorization_confirmed_at !==
    undefined
  ) {
    payload.authorization_confirmed_at =
      input.authorization_confirmed_at
  }

  if (
    input.authorization_confirmed_by !==
    undefined
  ) {
    payload.authorization_confirmed_by =
      input.authorization_confirmed_by
  }

  if (
    input.privacy_notice_version !==
    undefined
  ) {
    payload.privacy_notice_version =
      input.privacy_notice_version
  }

  if (
    input.storage_bucket !== undefined
  ) {
    payload.storage_bucket =
      input.storage_bucket
  }

  if (
    input.storage_path !== undefined
  ) {
    payload.storage_path =
      input.storage_path
  }

  if (
    input.original_file_name !==
    undefined
  ) {
    payload.original_file_name =
      input.original_file_name
  }

  if (
    input.file_mime_type !== undefined
  ) {
    payload.file_mime_type =
      input.file_mime_type
  }

  if (
    input.file_size_bytes !== undefined
  ) {
    payload.file_size_bytes =
      input.file_size_bytes
  }

  if (
    input.created_by !== undefined
  ) {
    payload.created_by =
      input.created_by
  }

  if (
    input.updated_by !== undefined
  ) {
    payload.updated_by =
      input.updated_by
  }

  return payload
}

class EvidencesRepository {
  private get client(): SupabaseClient {
    return createSupabaseClient()
  }

  async findAll(): Promise<
    AgendaEvidence[]
  > {
    const { data, error } =
      await this.client
        .from('agenda_evidences')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', {
          ascending: false,
        })

    if (error) {
      throw new Error(
        `Erro ao listar evidências: ${error.message}`,
      )
    }

    return (data ?? []) as AgendaEvidence[]
  }

  async findById(
    id: string,
  ): Promise<AgendaEvidence | null> {
    const { data, error } =
      await this.client
        .from('agenda_evidences')
        .select('*')
        .eq('id', id)
        .is('deleted_at', null)
        .maybeSingle()

    if (error) {
      throw new Error(
        `Erro ao buscar evidência: ${error.message}`,
      )
    }

    return data as AgendaEvidence | null
  }

  async findByIdIncludingDeleted(
    id: string,
  ): Promise<AgendaEvidence | null> {
    const { data, error } =
      await this.client
        .from('agenda_evidences')
        .select('*')
        .eq('id', id)
        .maybeSingle()

    if (error) {
      throw new Error(
        `Erro ao buscar evidência incluindo registros excluídos: ${error.message}`,
      )
    }

    return data as AgendaEvidence | null
  }

  async findByUserId(
    userId: string,
  ): Promise<AgendaEvidence[]> {
    const { data, error } =
      await this.client
        .from('agenda_evidences')
        .select('*')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .order('created_at', {
          ascending: false,
        })

    if (error) {
      throw new Error(
        `Erro ao listar evidências do usuário: ${error.message}`,
      )
    }

    return (data ?? []) as AgendaEvidence[]
  }

  async findBySchoolId(
    schoolId: string,
  ): Promise<AgendaEvidence[]> {
    const { data, error } =
      await this.client
        .from('agenda_evidences')
        .select('*')
        .eq('school_id', schoolId)
        .is('deleted_at', null)
        .order('created_at', {
          ascending: false,
        })

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
    const { data, error } =
      await this.client
        .from('agenda_evidences')
        .select('*')
        .eq(
          'planning_id',
          planningId,
        )
        .is('deleted_at', null)
        .order('created_at', {
          ascending: false,
        })

    if (error) {
      throw new Error(
        `Erro ao listar evidências do planejamento: ${error.message}`,
      )
    }

    return (data ?? []) as AgendaEvidence[]
  }

  async findByEventId(
    eventId: string,
  ): Promise<AgendaEvidence[]> {
    const { data, error } =
      await this.client
        .from('agenda_evidences')
        .select('*')
        .eq('event_id', eventId)
        .is('deleted_at', null)
        .order('created_at', {
          ascending: false,
        })

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
    const payload =
      buildCreatePayload(input)

    const { data, error } =
      await this.client
        .from('agenda_evidences')
        .insert(payload)
        .select('*')
        .single()

    if (error) {
      throw new Error(
        `Erro ao criar evidência: ${error.message}`,
      )
    }

    return data as AgendaEvidence
  }

  async update(
    id: string,
    input: UpdateAgendaEvidenceInput,
  ): Promise<AgendaEvidence> {
    const payload =
      buildUpdatePayload(input)

    const { data, error } =
      await this.client
        .from('agenda_evidences')
        .update(payload)
        .eq('id', id)
        .is('deleted_at', null)
        .select('*')
        .single()

    if (error) {
      throw new Error(
        `Erro ao atualizar evidência: ${error.message}`,
      )
    }

    return data as AgendaEvidence
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
            'agenda_evidences',

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
        `Erro ao excluir evidência: ${error.message}`,
      )
    }
  }

  async restore(
    id: string,
    actorUserId?: string,
    reason?: string,
  ): Promise<AgendaEvidence> {
    const context =
      normalizeRestorationContext(
        actorUserId,
        reason,
      )

    const {
      data,
      error,
    } = await this.client.rpc(
      'restore_agenda_record',
      {
        requested_resource_type:
          'agenda_evidences',

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
        `Erro ao restaurar evidência: ${error.message}`,
      )
    }

    if (!data) {
      throw new Error(
        'A restauração não retornou a evidência atualizada.',
      )
    }

    return data as unknown as AgendaEvidence
  }
}

export const evidencesRepository =
  new EvidencesRepository()