import {
  createClient,
  type SupabaseClient,
} from '@supabase/supabase-js'

export type AgendaPlanningStatus =
  | 'rascunho'
  | 'em_revisao'
  | 'em revisão'
  | 'aprovado'
  | 'programado'
  | 'executado'
  | 'arquivado'
  | 'planejado'
  | 'concluido'
  | 'concluído'

export type AgendaPlanningMetadata =
  Record<string, unknown>

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

  planned_start_time: string | null
  planned_end_time: string | null
  duration_minutes: number | null

  status: AgendaPlanningStatus

  class_id: string | null
  school_year_id: string | null
  academic_period_id: string | null

  source_planning_id: string | null

  is_template: boolean
  template_name: string | null

  status_changed_at: string | null
  status_changed_by: string | null
  status_change_reason: string | null

  reviewed_at: string | null
  reviewed_by: string | null

  approved_at: string | null
  approved_by: string | null

  archived_at: string | null
  archived_by: string | null
  archive_reason: string | null

  school_id: string | null
  organization_id: string | null
  user_id: string | null

  created_by: string | null
  updated_by: string | null

  deleted_at: string | null
  deleted_by: string | null
  deletion_reason: string | null

  restored_at: string | null
  restored_by: string | null
  restore_reason: string | null

  metadata: AgendaPlanningMetadata

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

  planned_start_time?: string | null
  planned_end_time?: string | null
  duration_minutes?: number | null

  status?: AgendaPlanningStatus

  class_id?: string | null
  school_year_id?: string | null
  academic_period_id?: string | null

  source_planning_id?: string | null

  is_template?: boolean
  template_name?: string | null

  status_changed_at?: string | null
  status_changed_by?: string | null
  status_change_reason?: string | null

  reviewed_at?: string | null
  reviewed_by?: string | null

  approved_at?: string | null
  approved_by?: string | null

  archived_at?: string | null
  archived_by?: string | null
  archive_reason?: string | null

  school_id?: string | null
  organization_id?: string | null
  user_id?: string | null

  created_by?: string | null
  updated_by?: string | null

  metadata?: AgendaPlanningMetadata
}

export type UpdateAgendaPlanningInput =
  Partial<
    CreateAgendaPlanningInput
  >

export type AgendaPlanningQueryOptions = {
  includeDeleted?: boolean

  statuses?:
    AgendaPlanningStatus[]

  classId?: string | null
  schoolYearId?: string | null
  academicPeriodId?: string | null

  templateOnly?: boolean
}

export type AgendaPlanningVersion = {
  id: string

  action: string

  actor_user_id: string | null
  actor_role: string | null

  before_data:
    | Record<string, unknown>
    | null

  after_data:
    | Record<string, unknown>
    | null

  metadata:
    Record<string, unknown>

  occurred_at: string
}

function createLegacyServerClient():
  SupabaseClient {
  const url =
    process.env
      .NEXT_PUBLIC_SUPABASE_URL

  const key =
    process.env
      .SUPABASE_SERVICE_ROLE_KEY ??
    process.env
      .NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error(
      'Variáveis do Supabase não configuradas.',
    )
  }

  return createClient(
    url,
    key,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  )
}

function normalizeRequiredText(
  value: string,
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

function normalizeReason(
  value: string,
  fieldName: string,
): string {
  const normalizedValue =
    normalizeRequiredText(
      value,
      fieldName,
    )

  if (
    normalizedValue.length >
    2000
  ) {
    throw new Error(
      `${fieldName} não pode ultrapassar 2000 caracteres.`,
    )
  }

  return normalizedValue
}

function normalizeOptionalId(
  value:
    | string
    | null
    | undefined,
): string | null | undefined {
  if (
    value === undefined
  ) {
    return undefined
  }

  if (
    value === null
  ) {
    return null
  }

  return value.trim() ||
    null
}

function normalizeCreateInput(
  input:
    CreateAgendaPlanningInput,
): CreateAgendaPlanningInput {
  return {
    ...input,

    title:
      normalizeRequiredText(
        input.title,
        'Título do planejamento',
      ),

    user_id:
      normalizeOptionalId(
        input.user_id,
      ),

    organization_id:
      normalizeOptionalId(
        input.organization_id,
      ),

    school_id:
      normalizeOptionalId(
        input.school_id,
      ),

    class_id:
      normalizeOptionalId(
        input.class_id,
      ),

    school_year_id:
      normalizeOptionalId(
        input.school_year_id,
      ),

    academic_period_id:
      normalizeOptionalId(
        input.academic_period_id,
      ),

    source_planning_id:
      normalizeOptionalId(
        input.source_planning_id,
      ),
  }
}

function normalizeUpdateInput(
  input:
    UpdateAgendaPlanningInput,
): UpdateAgendaPlanningInput {
  const normalizedInput:
    UpdateAgendaPlanningInput = {
      ...input,
    }

  if (
    input.title !==
    undefined
  ) {
    normalizedInput.title =
      normalizeRequiredText(
        input.title,
        'Título do planejamento',
      )
  }

  if (
    input.user_id !==
    undefined
  ) {
    normalizedInput.user_id =
      normalizeOptionalId(
        input.user_id,
      )
  }

  if (
    input.organization_id !==
    undefined
  ) {
    normalizedInput.organization_id =
      normalizeOptionalId(
        input.organization_id,
      )
  }

  if (
    input.school_id !==
    undefined
  ) {
    normalizedInput.school_id =
      normalizeOptionalId(
        input.school_id,
      )
  }

  if (
    input.class_id !==
    undefined
  ) {
    normalizedInput.class_id =
      normalizeOptionalId(
        input.class_id,
      )
  }

  if (
    input.school_year_id !==
    undefined
  ) {
    normalizedInput.school_year_id =
      normalizeOptionalId(
        input.school_year_id,
      )
  }

  if (
    input.academic_period_id !==
    undefined
  ) {
    normalizedInput.academic_period_id =
      normalizeOptionalId(
        input.academic_period_id,
      )
  }

  if (
    input.source_planning_id !==
    undefined
  ) {
    normalizedInput.source_planning_id =
      normalizeOptionalId(
        input.source_planning_id,
      )
  }

  return normalizedInput
}

export class PlanningRepository {
  private readonly injectedClient:
    | SupabaseClient
    | null

  constructor(
    client?: SupabaseClient,
  ) {
    this.injectedClient =
      client ??
      null
  }

  private get client():
    SupabaseClient {
    /*
     * Compatibilidade temporária com os Services
     * existentes.
     *
     * As novas APIs deverão injetar um cliente
     * autenticado pelo usuário.
     */
    return (
      this.injectedClient ??
      createLegacyServerClient()
    )
  }

  private applyListFilters(
    query: any,
    options:
      AgendaPlanningQueryOptions,
  ): any {
    let filteredQuery =
      query

    if (
      !options.includeDeleted
    ) {
      filteredQuery =
        filteredQuery.is(
          'deleted_at',
          null,
        )
    }

    if (
      options.statuses?.length
    ) {
      filteredQuery =
        filteredQuery.in(
          'status',
          options.statuses,
        )
    }

    if (
      options.classId
    ) {
      filteredQuery =
        filteredQuery.eq(
          'class_id',
          options.classId,
        )
    }

    if (
      options.schoolYearId
    ) {
      filteredQuery =
        filteredQuery.eq(
          'school_year_id',
          options.schoolYearId,
        )
    }

    if (
      options.academicPeriodId
    ) {
      filteredQuery =
        filteredQuery.eq(
          'academic_period_id',
          options.academicPeriodId,
        )
    }

    if (
      options.templateOnly
    ) {
      filteredQuery =
        filteredQuery.eq(
          'is_template',
          true,
        )
    }

    return filteredQuery
  }

  /**
   * Uso administrativo interno.
   * Não utilizar diretamente em rotas comuns.
   */
  async findAll(
    options:
      AgendaPlanningQueryOptions = {},
  ): Promise<
    AgendaPlanning[]
  > {
    let query =
      this.client
        .from(
          'agenda_planning',
        )
        .select('*')

    query =
      this.applyListFilters(
        query,
        options,
      )

    const {
      data,
      error,
    } =
      await query
        .order(
          'planned_date',
          {
            ascending: true,
            nullsFirst: false,
          },
        )
        .order(
          'created_at',
          {
            ascending: false,
          },
        )

    if (error) {
      throw new Error(
        `Erro ao listar planejamentos: ${error.message}`,
      )
    }

    return (
      data ??
      []
    ) as AgendaPlanning[]
  }

  async findByUserId(
    userId: string,

    options:
      AgendaPlanningQueryOptions = {},
  ): Promise<
    AgendaPlanning[]
  > {
    const normalizedUserId =
      normalizeRequiredText(
        userId,
        'ID do usuário',
      )

    let query =
      this.client
        .from(
          'agenda_planning',
        )
        .select('*')
        .eq(
          'user_id',
          normalizedUserId,
        )

    query =
      this.applyListFilters(
        query,
        options,
      )

    const {
      data,
      error,
    } =
      await query
        .order(
          'planned_date',
          {
            ascending: true,
            nullsFirst: false,
          },
        )
        .order(
          'created_at',
          {
            ascending: false,
          },
        )

    if (error) {
      throw new Error(
        `Erro ao listar planejamentos do usuário: ${error.message}`,
      )
    }

    return (
      data ??
      []
    ) as AgendaPlanning[]
  }

  /**
   * Uso administrativo interno.
   * Em rotas autenticadas, utilizar findOwnedById
   * ou um Repository com cliente autenticado e RLS.
   */
  async findById(
    id: string,

    options: {
      includeDeleted?: boolean
    } = {},
  ): Promise<
    AgendaPlanning | null
  > {
    const normalizedId =
      normalizeRequiredText(
        id,
        'ID do planejamento',
      )

    let query =
      this.client
        .from(
          'agenda_planning',
        )
        .select('*')
        .eq(
          'id',
          normalizedId,
        )

    if (
      !options.includeDeleted
    ) {
      query =
        query.is(
          'deleted_at',
          null,
        )
    }

    const {
      data,
      error,
    } =
      await query
        .maybeSingle()

    if (error) {
      throw new Error(
        `Erro ao buscar planejamento: ${error.message}`,
      )
    }

    return (
      data as
        | AgendaPlanning
        | null
    )
  }

  async findOwnedById(
    id: string,
    userId: string,

    options: {
      includeDeleted?: boolean
    } = {},
  ): Promise<
    AgendaPlanning | null
  > {
    const normalizedId =
      normalizeRequiredText(
        id,
        'ID do planejamento',
      )

    const normalizedUserId =
      normalizeRequiredText(
        userId,
        'ID do usuário',
      )

    let query =
      this.client
        .from(
          'agenda_planning',
        )
        .select('*')
        .eq(
          'id',
          normalizedId,
        )
        .eq(
          'user_id',
          normalizedUserId,
        )

    if (
      !options.includeDeleted
    ) {
      query =
        query.is(
          'deleted_at',
          null,
        )
    }

    const {
      data,
      error,
    } =
      await query
        .maybeSingle()

    if (error) {
      throw new Error(
        `Erro ao buscar planejamento do usuário: ${error.message}`,
      )
    }

    return (
      data as
        | AgendaPlanning
        | null
    )
  }

  async create(
    input:
      CreateAgendaPlanningInput,
  ): Promise<
    AgendaPlanning
  > {
    const normalizedInput =
      normalizeCreateInput(
        input,
      )

    const {
      data,
      error,
    } =
      await this.client
        .from(
          'agenda_planning',
        )
        .insert(
          normalizedInput,
        )
        .select('*')
        .single()

    if (error) {
      throw new Error(
        `Erro ao criar planejamento: ${error.message}`,
      )
    }

    return data as
      AgendaPlanning
  }

  /**
   * Uso administrativo interno.
   * Rotas comuns devem utilizar um Repository
   * com cliente autenticado.
   */
  async update(
    id: string,
    input:
      UpdateAgendaPlanningInput,
  ): Promise<
    AgendaPlanning
  > {
    const normalizedId =
      normalizeRequiredText(
        id,
        'ID do planejamento',
      )

    const normalizedInput =
      normalizeUpdateInput(
        input,
      )

    const {
      data,
      error,
    } =
      await this.client
        .from(
          'agenda_planning',
        )
        .update({
          ...normalizedInput,

          updated_at:
            new Date()
              .toISOString(),
        })
        .eq(
          'id',
          normalizedId,
        )
        .is(
          'deleted_at',
          null,
        )
        .select('*')
        .single()

    if (error) {
      throw new Error(
        `Erro ao atualizar planejamento: ${error.message}`,
      )
    }

    return data as
      AgendaPlanning
  }

  async updateOwned(
    id: string,
    userId: string,

    input:
      UpdateAgendaPlanningInput,
  ): Promise<
    AgendaPlanning | null
  > {
    const normalizedId =
      normalizeRequiredText(
        id,
        'ID do planejamento',
      )

    const normalizedUserId =
      normalizeRequiredText(
        userId,
        'ID do usuário',
      )

    const normalizedInput =
      normalizeUpdateInput(
        input,
      )

    /*
     * A propriedade do registro não pode ser
     * alterada pelo navegador.
     */
    delete normalizedInput.user_id

    const {
      data,
      error,
    } =
      await this.client
        .from(
          'agenda_planning',
        )
        .update({
          ...normalizedInput,

          updated_at:
            new Date()
              .toISOString(),
        })
        .eq(
          'id',
          normalizedId,
        )
        .eq(
          'user_id',
          normalizedUserId,
        )
        .is(
          'deleted_at',
          null,
        )
        .select('*')
        .maybeSingle()

    if (error) {
      throw new Error(
        `Erro ao atualizar planejamento do usuário: ${error.message}`,
      )
    }

    return (
      data as
        | AgendaPlanning
        | null
    )
  }

  async softDelete(
    id: string,
    reason: string,
    actorUserId: string,
  ): Promise<
    AgendaPlanning
  > {
    const normalizedId =
      normalizeRequiredText(
        id,
        'ID do planejamento',
      )

    const normalizedReason =
      normalizeReason(
        reason,
        'Motivo da exclusão',
      )

    const normalizedActorUserId =
      normalizeRequiredText(
        actorUserId,
        'Usuário responsável',
      )

    const {
      data,
      error,
    } =
      await this.client.rpc(
        'soft_delete_agenda_record',
        {
          requested_resource_type:
            'planning',

          requested_resource_id:
            normalizedId,

          requested_reason:
            normalizedReason,

          requested_actor_user_id:
            normalizedActorUserId,
        },
      )

    if (error) {
      throw new Error(
        `Erro ao excluir logicamente o planejamento: ${error.message}`,
      )
    }

    if (!data) {
      throw new Error(
        'O planejamento não foi retornado após a exclusão lógica.',
      )
    }

    return data as
      AgendaPlanning
  }

  async restore(
    id: string,
    reason: string,
    actorUserId: string,
  ): Promise<
    AgendaPlanning
  > {
    const normalizedId =
      normalizeRequiredText(
        id,
        'ID do planejamento',
      )

    const normalizedReason =
      normalizeReason(
        reason,
        'Motivo da restauração',
      )

    const normalizedActorUserId =
      normalizeRequiredText(
        actorUserId,
        'Usuário responsável',
      )

    const {
      data,
      error,
    } =
      await this.client.rpc(
        'restore_agenda_record',
        {
          requested_resource_type:
            'planning',

          requested_resource_id:
            normalizedId,

          requested_reason:
            normalizedReason,

          requested_actor_user_id:
            normalizedActorUserId,
        },
      )

    if (error) {
      throw new Error(
        `Erro ao restaurar planejamento: ${error.message}`,
      )
    }

    if (!data) {
      throw new Error(
        'O planejamento não foi retornado após a restauração.',
      )
    }

    return data as
      AgendaPlanning
  }

  async findVersions(
    id: string,
  ): Promise<
    AgendaPlanningVersion[]
  > {
    const normalizedId =
      normalizeRequiredText(
        id,
        'ID do planejamento',
      )

    const {
      data,
      error,
    } =
      await this.client
        .from(
          'identity_audit_logs',
        )
        .select(`
          id,
          action,
          actor_user_id,
          actor_role,
          before_data,
          after_data,
          metadata,
          occurred_at
        `)
        .eq(
          'product_code',
          'agenda_edi',
        )
        .eq(
          'resource_type',
          'agenda_planning',
        )
        .eq(
          'resource_id',
          normalizedId,
        )
        .in(
          'action',
          [
            'create',
            'update',
            'delete',
            'restore',
          ],
        )
        .order(
          'occurred_at',
          {
            ascending: false,
          },
        )

    if (error) {
      throw new Error(
        `Erro ao carregar versões do planejamento: ${error.message}`,
      )
    }

    return (
      data ??
      []
    ) as AgendaPlanningVersion[]
  }

  /**
   * Exclusão física desativada.
   *
   * Método mantido temporariamente apenas para
   * preservar compatibilidade de compilação com
   * o Service legado.
   */
  async delete(
    _id: string,
  ): Promise<void> {
    throw new Error(
      'Exclusão física bloqueada. Utilize a exclusão lógica com justificativa.',
    )
  }

  /**
   * Exclusão física desativada.
   *
   * Método mantido temporariamente apenas para
   * preservar compatibilidade de compilação com
   * o Service legado.
   */
  async deleteOwned(
    _id: string,
    _userId: string,
  ): Promise<boolean> {
    throw new Error(
      'Exclusão física bloqueada. Utilize a exclusão lógica com justificativa.',
    )
  }
}

/**
 * Compatibilidade temporária com os Services atuais.
 *
 * As novas rotas deverão construir:
 *
 * new PlanningRepository(clienteAutenticado)
 *
 * e não depender desta instância global.
 */
export const planningRepository =
  new PlanningRepository()