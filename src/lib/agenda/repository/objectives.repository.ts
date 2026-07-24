import {
  createClient,
  type SupabaseClient,
} from '@supabase/supabase-js'

export type AgendaObjectiveCategory =
  | 'pedagogico'
  | 'engajamento'
  | 'gestao'
  | 'formacao'
  | 'inclusao'
  | 'desenvolvimento'
  | string

export type AgendaObjectiveStatus =
  | 'rascunho'
  | 'ativo'
  | 'em_acompanhamento'
  | 'concluido'
  | 'suspenso'
  | 'cancelado'
  | 'arquivado'

export type AgendaObjectiveMetadata =
  Record<string, unknown>

export type AgendaObjective = {
  id: string

  title: string
  description: string | null

  category: AgendaObjectiveCategory
  period: string | null

  class_id: string | null
  subject: string | null

  responsible_user_id: string | null

  expected_indicator: string | null
  expected_evidence: string | null

  start_date: string | null
  end_date: string | null

  school_year_id: string | null
  academic_period_id: string | null

  status: AgendaObjectiveStatus
  progress: number

  user_id: string
  organization_id: string | null
  school_id: string | null

  created_by: string | null
  updated_by: string | null

  deleted_at: string | null
  deleted_by: string | null
  deletion_reason: string | null

  restored_at: string | null
  restored_by: string | null
  restore_reason: string | null

  metadata: AgendaObjectiveMetadata

  created_at: string
  updated_at: string
}

export type CreateAgendaObjectiveInput = {
  title: string
  description?: string | null

  category?: AgendaObjectiveCategory
  period?: string | null

  class_id?: string | null
  subject?: string | null

  responsible_user_id?: string | null

  expected_indicator?: string | null
  expected_evidence?: string | null

  start_date?: string | null
  end_date?: string | null

  school_year_id?: string | null
  academic_period_id?: string | null

  status?: AgendaObjectiveStatus
  progress?: number

  user_id: string
  organization_id?: string | null
  school_id?: string | null

  created_by?: string | null
  updated_by?: string | null

  metadata?: AgendaObjectiveMetadata
}

export type UpdateAgendaObjectiveInput =
  Partial<
    Omit<
      CreateAgendaObjectiveInput,
      'user_id'
    >
  > & {
    user_id?: string
  }

export type AgendaObjectiveQueryOptions = {
  includeDeleted?: boolean

  userId?: string | null
  organizationId?: string | null
  schoolId?: string | null

  classId?: string | null
  schoolYearId?: string | null
  academicPeriodId?: string | null

  responsibleUserId?: string | null

  category?: AgendaObjectiveCategory | null
  status?: AgendaObjectiveStatus | null
  statuses?: AgendaObjectiveStatus[]

  subject?: string | null
  period?: string | null

  search?: string | null
}

export type DeleteAgendaObjectiveContext = {
  actorUserId: string
  reason: string
}

export type RestoreAgendaObjectiveContext = {
  actorUserId: string
  reason: string
}

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
  value: string | null | undefined,
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

function normalizeOptionalText(
  value: string | null | undefined,
): string | null | undefined {
  if (value === undefined) {
    return undefined
  }

  if (value === null) {
    return null
  }

  const normalizedValue =
    value.trim()

  return normalizedValue || null
}

function normalizeOptionalId(
  value: string | null | undefined,
): string | null | undefined {
  if (value === undefined) {
    return undefined
  }

  if (value === null) {
    return null
  }

  const normalizedValue =
    value.trim()

  return normalizedValue || null
}

function normalizeProgress(
  value: number | null | undefined,
): number | undefined {
  if (
    value === undefined ||
    value === null
  ) {
    return undefined
  }

  if (!Number.isFinite(value)) {
    throw new Error(
      'O progresso deve ser um número válido.',
    )
  }

  if (value < 0 || value > 100) {
    throw new Error(
      'O progresso deve estar entre 0 e 100.',
    )
  }

  return Number(value.toFixed(2))
}

function normalizeDeletionContext(
  actorUserId?: string,
  reason?: string,
): DeleteAgendaObjectiveContext {
  return {
    actorUserId:
      normalizeRequiredText(
        actorUserId,
        'ID do usuário responsável pela exclusão',
      ),

    reason:
      normalizeRequiredText(
        reason,
        'Motivo da exclusão',
      ),
  }
}

function normalizeRestorationContext(
  actorUserId?: string,
  reason?: string,
): RestoreAgendaObjectiveContext {
  return {
    actorUserId:
      normalizeRequiredText(
        actorUserId,
        'ID do usuário responsável pela restauração',
      ),

    reason:
      normalizeRequiredText(
        reason,
        'Motivo da restauração',
      ),
  }
}

function validateDateRange(
  startDate?: string | null,
  endDate?: string | null,
): void {
  if (!startDate || !endDate) {
    return
  }

  const normalizedStartDate =
    new Date(`${startDate}T00:00:00`)

  const normalizedEndDate =
    new Date(`${endDate}T00:00:00`)

  if (
    Number.isNaN(
      normalizedStartDate.getTime(),
    ) ||
    Number.isNaN(
      normalizedEndDate.getTime(),
    )
  ) {
    throw new Error(
      'O período informado possui uma data inválida.',
    )
  }

  if (
    normalizedEndDate <
    normalizedStartDate
  ) {
    throw new Error(
      'A data final não pode ser anterior à data inicial.',
    )
  }
}

function buildCreatePayload(
  input: CreateAgendaObjectiveInput,
) {
  const title =
    normalizeRequiredText(
      input.title,
      'Título',
    )

  const userId =
    normalizeRequiredText(
      input.user_id,
      'Usuário responsável',
    )

  const progress =
    normalizeProgress(
      input.progress,
    ) ?? 0

  validateDateRange(
    input.start_date,
    input.end_date,
  )

  return {
    title,

    description:
      normalizeOptionalText(
        input.description,
      ) ?? null,

    category:
      normalizeOptionalText(
        input.category,
      ) ?? 'pedagogico',

    period:
      normalizeOptionalText(
        input.period,
      ) ?? null,

    class_id:
      normalizeOptionalId(
        input.class_id,
      ) ?? null,

    subject:
      normalizeOptionalText(
        input.subject,
      ) ?? null,

    responsible_user_id:
      normalizeOptionalId(
        input.responsible_user_id,
      ) ?? null,

    expected_indicator:
      normalizeOptionalText(
        input.expected_indicator,
      ) ?? null,

    expected_evidence:
      normalizeOptionalText(
        input.expected_evidence,
      ) ?? null,

    start_date:
      input.start_date ?? null,

    end_date:
      input.end_date ?? null,

    school_year_id:
      normalizeOptionalId(
        input.school_year_id,
      ) ?? null,

    academic_period_id:
      normalizeOptionalId(
        input.academic_period_id,
      ) ?? null,

    status:
      input.status ?? 'rascunho',

    progress,

    user_id:
      userId,

    organization_id:
      normalizeOptionalId(
        input.organization_id,
      ) ?? null,

    school_id:
      normalizeOptionalId(
        input.school_id,
      ) ?? null,

    created_by:
      normalizeOptionalId(
        input.created_by,
      ) ?? userId,

    updated_by:
      normalizeOptionalId(
        input.updated_by,
      ) ?? userId,

    metadata:
      input.metadata ?? {},
  }
}

function buildUpdatePayload(
  input: UpdateAgendaObjectiveInput,
): Record<string, unknown> {
  validateDateRange(
    input.start_date,
    input.end_date,
  )

  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (input.title !== undefined) {
    payload.title =
      normalizeRequiredText(
        input.title,
        'Título',
      )
  }

  if (input.description !== undefined) {
    payload.description =
      normalizeOptionalText(
        input.description,
      ) ?? null
  }

  if (input.category !== undefined) {
    payload.category =
      normalizeRequiredText(
        input.category,
        'Categoria',
      )
  }

  if (input.period !== undefined) {
    payload.period =
      normalizeOptionalText(
        input.period,
      ) ?? null
  }

  if (input.class_id !== undefined) {
    payload.class_id =
      normalizeOptionalId(
        input.class_id,
      ) ?? null
  }

  if (input.subject !== undefined) {
    payload.subject =
      normalizeOptionalText(
        input.subject,
      ) ?? null
  }

  if (
    input.responsible_user_id !==
    undefined
  ) {
    payload.responsible_user_id =
      normalizeOptionalId(
        input.responsible_user_id,
      ) ?? null
  }

  if (
    input.expected_indicator !==
    undefined
  ) {
    payload.expected_indicator =
      normalizeOptionalText(
        input.expected_indicator,
      ) ?? null
  }

  if (
    input.expected_evidence !==
    undefined
  ) {
    payload.expected_evidence =
      normalizeOptionalText(
        input.expected_evidence,
      ) ?? null
  }

  if (input.start_date !== undefined) {
    payload.start_date =
      input.start_date
  }

  if (input.end_date !== undefined) {
    payload.end_date =
      input.end_date
  }

  if (
    input.school_year_id !==
    undefined
  ) {
    payload.school_year_id =
      normalizeOptionalId(
        input.school_year_id,
      ) ?? null
  }

  if (
    input.academic_period_id !==
    undefined
  ) {
    payload.academic_period_id =
      normalizeOptionalId(
        input.academic_period_id,
      ) ?? null
  }

  if (input.status !== undefined) {
    payload.status =
      input.status
  }

  if (input.progress !== undefined) {
    payload.progress =
      normalizeProgress(
        input.progress,
      )
  }

  if (input.user_id !== undefined) {
    payload.user_id =
      normalizeRequiredText(
        input.user_id,
        'Usuário responsável',
      )
  }

  if (
    input.organization_id !==
    undefined
  ) {
    payload.organization_id =
      normalizeOptionalId(
        input.organization_id,
      ) ?? null
  }

  if (input.school_id !== undefined) {
    payload.school_id =
      normalizeOptionalId(
        input.school_id,
      ) ?? null
  }

  if (input.created_by !== undefined) {
    payload.created_by =
      normalizeOptionalId(
        input.created_by,
      ) ?? null
  }

  if (input.updated_by !== undefined) {
    payload.updated_by =
      normalizeOptionalId(
        input.updated_by,
      ) ?? null
  }

  if (input.metadata !== undefined) {
    payload.metadata =
      input.metadata
  }

  return payload
}

class ObjectivesRepository {
  private get client(): SupabaseClient {
    return createSupabaseClient()
  }

  async findAll(
    options: AgendaObjectiveQueryOptions = {},
  ): Promise<AgendaObjective[]> {
    let query =
      this.client
        .from('agenda_objectives')
        .select('*')

    if (!options.includeDeleted) {
      query =
        query.is(
          'deleted_at',
          null,
        )
    }

    if (options.userId) {
      query =
        query.eq(
          'user_id',
          options.userId,
        )
    }

    if (options.organizationId) {
      query =
        query.eq(
          'organization_id',
          options.organizationId,
        )
    }

    if (options.schoolId) {
      query =
        query.eq(
          'school_id',
          options.schoolId,
        )
    }

    if (options.classId) {
      query =
        query.eq(
          'class_id',
          options.classId,
        )
    }

    if (options.schoolYearId) {
      query =
        query.eq(
          'school_year_id',
          options.schoolYearId,
        )
    }

    if (options.academicPeriodId) {
      query =
        query.eq(
          'academic_period_id',
          options.academicPeriodId,
        )
    }

    if (options.responsibleUserId) {
      query =
        query.eq(
          'responsible_user_id',
          options.responsibleUserId,
        )
    }

    if (options.category) {
      query =
        query.eq(
          'category',
          options.category,
        )
    }

    if (options.status) {
      query =
        query.eq(
          'status',
          options.status,
        )
    }

    if (
      options.statuses &&
      options.statuses.length > 0
    ) {
      query =
        query.in(
          'status',
          options.statuses,
        )
    }

    if (options.subject) {
      query =
        query.eq(
          'subject',
          options.subject,
        )
    }

    if (options.period) {
      query =
        query.eq(
          'period',
          options.period,
        )
    }

    if (options.search?.trim()) {
      const searchTerm =
        options.search
          .trim()
          .replace(/[%_,]/g, ' ')

      query =
        query.or(
          [
            `title.ilike.%${searchTerm}%`,
            `description.ilike.%${searchTerm}%`,
            `subject.ilike.%${searchTerm}%`,
            `expected_indicator.ilike.%${searchTerm}%`,
            `expected_evidence.ilike.%${searchTerm}%`,
          ].join(','),
        )
    }

    const { data, error } =
      await query.order(
        'created_at',
        {
          ascending: false,
        },
      )

    if (error) {
      throw new Error(
        `Erro ao listar objetivos: ${error.message}`,
      )
    }

    return (
      data ?? []
    ) as AgendaObjective[]
  }

  async findById(
    id: string,
  ): Promise<AgendaObjective | null> {
    const objectiveId =
      normalizeRequiredText(
        id,
        'ID do objetivo',
      )

    const { data, error } =
      await this.client
        .from('agenda_objectives')
        .select('*')
        .eq('id', objectiveId)
        .is('deleted_at', null)
        .maybeSingle()

    if (error) {
      throw new Error(
        `Erro ao buscar objetivo: ${error.message}`,
      )
    }

    return data as AgendaObjective | null
  }

  async findByIdIncludingDeleted(
    id: string,
  ): Promise<AgendaObjective | null> {
    const objectiveId =
      normalizeRequiredText(
        id,
        'ID do objetivo',
      )

    const { data, error } =
      await this.client
        .from('agenda_objectives')
        .select('*')
        .eq('id', objectiveId)
        .maybeSingle()

    if (error) {
      throw new Error(
        `Erro ao buscar objetivo incluindo registros excluídos: ${error.message}`,
      )
    }

    return data as AgendaObjective | null
  }

  async findByUserId(
    userId: string,
  ): Promise<AgendaObjective[]> {
    return this.findAll({
      userId:
        normalizeRequiredText(
          userId,
          'ID do usuário',
        ),
    })
  }

  async findBySchoolId(
    schoolId: string,
  ): Promise<AgendaObjective[]> {
    return this.findAll({
      schoolId:
        normalizeRequiredText(
          schoolId,
          'ID da escola',
        ),
    })
  }

  async findByOrganizationId(
    organizationId: string,
  ): Promise<AgendaObjective[]> {
    return this.findAll({
      organizationId:
        normalizeRequiredText(
          organizationId,
          'ID da organização',
        ),
    })
  }

  async findByClassId(
    classId: string,
  ): Promise<AgendaObjective[]> {
    return this.findAll({
      classId:
        normalizeRequiredText(
          classId,
          'ID da turma',
        ),
    })
  }

  async create(
    input: CreateAgendaObjectiveInput,
  ): Promise<AgendaObjective> {
    const payload =
      buildCreatePayload(input)

    const { data, error } =
      await this.client
        .from('agenda_objectives')
        .insert(payload)
        .select('*')
        .single()

    if (error) {
      throw new Error(
        `Erro ao criar objetivo: ${error.message}`,
      )
    }

    return data as AgendaObjective
  }

  async update(
    id: string,
    input: UpdateAgendaObjectiveInput,
  ): Promise<AgendaObjective> {
    const objectiveId =
      normalizeRequiredText(
        id,
        'ID do objetivo',
      )

    const payload =
      buildUpdatePayload(input)

    const { data, error } =
      await this.client
        .from('agenda_objectives')
        .update(payload)
        .eq('id', objectiveId)
        .is('deleted_at', null)
        .select('*')
        .single()

    if (error) {
      throw new Error(
        `Erro ao atualizar objetivo: ${error.message}`,
      )
    }

    return data as AgendaObjective
  }

  async delete(
    id: string,
    actorUserId?: string,
    reason?: string,
  ): Promise<void> {
    const objectiveId =
      normalizeRequiredText(
        id,
        'ID do objetivo',
      )

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
            'agenda_objectives',

          requested_resource_id:
            objectiveId,

          requested_reason:
            context.reason,

          requested_actor_user_id:
            context.actorUserId,
        },
      )

    if (error) {
      throw new Error(
        `Erro ao excluir objetivo: ${error.message}`,
      )
    }
  }

  async restore(
    id: string,
    actorUserId?: string,
    reason?: string,
  ): Promise<AgendaObjective> {
    const objectiveId =
      normalizeRequiredText(
        id,
        'ID do objetivo',
      )

    const context =
      normalizeRestorationContext(
        actorUserId,
        reason,
      )

    const { data, error } =
      await this.client.rpc(
        'restore_agenda_record',
        {
          requested_resource_type:
            'agenda_objectives',

          requested_resource_id:
            objectiveId,

          requested_reason:
            context.reason,

          requested_actor_user_id:
            context.actorUserId,
        },
      )

    if (error) {
      throw new Error(
        `Erro ao restaurar objetivo: ${error.message}`,
      )
    }

    if (!data) {
      throw new Error(
        'A restauração não retornou o objetivo atualizado.',
      )
    }

    return data as unknown as AgendaObjective
  }
}

export const objectivesRepository =
  new ObjectivesRepository()
