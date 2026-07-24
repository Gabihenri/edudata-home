import {
  createClient,
  type SupabaseClient,
} from '@supabase/supabase-js'

import type {
  AgendaObjective,
} from '@/lib/agenda/repository/objectives.repository'

export type AgendaPlanningObjectiveRole =
  | 'primary'
  | 'supporting'

export type AgendaPlanningObjectiveMetadata =
  Record<string, unknown>

export type AgendaPlanningObjective = {
  id: string

  planning_id: string
  objective_id: string

  relationship_role:
    AgendaPlanningObjectiveRole

  sequence: number

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

  metadata:
    AgendaPlanningObjectiveMetadata

  created_at: string
  updated_at: string
}

export type AgendaPlanningObjectiveWithObjective =
  AgendaPlanningObjective & {
    objective:
      AgendaObjective | null
  }

export type CreateAgendaPlanningObjectiveInput = {
  planning_id: string
  objective_id: string

  relationship_role?:
    AgendaPlanningObjectiveRole

  sequence?: number

  user_id: string
  organization_id?: string | null
  school_id?: string | null

  created_by?: string | null
  updated_by?: string | null

  metadata?:
    AgendaPlanningObjectiveMetadata
}

export type UpdateAgendaPlanningObjectiveInput = {
  relationship_role?:
    AgendaPlanningObjectiveRole

  sequence?: number

  organization_id?: string | null
  school_id?: string | null

  updated_by?: string | null

  metadata?:
    AgendaPlanningObjectiveMetadata
}

export type AgendaPlanningObjectiveQueryOptions = {
  includeDeleted?: boolean

  planningId?: string | null
  objectiveId?: string | null

  userId?: string | null
  organizationId?: string | null
  schoolId?: string | null

  relationshipRole?:
    AgendaPlanningObjectiveRole | null
}

export type DeleteAgendaPlanningObjectiveContext = {
  actorUserId: string
  reason: string
}

export type RestoreAgendaPlanningObjectiveContext = {
  actorUserId: string
  reason: string
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
        persistSession:
          false,

        autoRefreshToken:
          false,

        detectSessionInUrl:
          false,
      },
    },
  )
}

function normalizeRequiredText(
  value:
    | string
    | null
    | undefined,

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

function normalizeOptionalId(
  value:
    | string
    | null
    | undefined,
): string | null | undefined {
  if (value === undefined) {
    return undefined
  }

  if (value === null) {
    return null
  }

  const normalizedValue =
    value.trim()

  return normalizedValue ||
    null
}

function normalizeSequence(
  value:
    | number
    | null
    | undefined,
): number | undefined {
  if (
    value === undefined ||
    value === null
  ) {
    return undefined
  }

  if (
    !Number.isInteger(value) ||
    value < 1
  ) {
    throw new Error(
      'A sequência deve ser um número inteiro maior ou igual a 1.',
    )
  }

  return value
}

function normalizeRole(
  value:
    | AgendaPlanningObjectiveRole
    | null
    | undefined,
): AgendaPlanningObjectiveRole {
  if (
    value === undefined ||
    value === null
  ) {
    return 'supporting'
  }

  if (
    value !== 'primary' &&
    value !== 'supporting'
  ) {
    throw new Error(
      'O papel do objetivo no planejamento é inválido.',
    )
  }

  return value
}

function normalizeReason(
  value:
    | string
    | null
    | undefined,

  fieldName: string,
): string {
  const reason =
    normalizeRequiredText(
      value,
      fieldName,
    )

  if (
    reason.length >
    2000
  ) {
    throw new Error(
      `${fieldName} não pode ultrapassar 2000 caracteres.`,
    )
  }

  return reason
}

function buildCreatePayload(
  input:
    CreateAgendaPlanningObjectiveInput,
) {
  return {
    planning_id:
      normalizeRequiredText(
        input.planning_id,
        'ID do planejamento',
      ),

    objective_id:
      normalizeRequiredText(
        input.objective_id,
        'ID do objetivo',
      ),

    relationship_role:
      normalizeRole(
        input.relationship_role,
      ),

    sequence:
      normalizeSequence(
        input.sequence,
      ) ?? 1,

    user_id:
      normalizeRequiredText(
        input.user_id,
        'ID do usuário',
      ),

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
      ) ?? null,

    updated_by:
      normalizeOptionalId(
        input.updated_by,
      ) ?? null,

    metadata:
      input.metadata ??
      {},
  }
}

function buildUpdatePayload(
  input:
    UpdateAgendaPlanningObjectiveInput,
) {
  const payload:
    Record<string, unknown> = {}

  if (
    input.relationship_role !==
    undefined
  ) {
    payload.relationship_role =
      normalizeRole(
        input.relationship_role,
      )
  }

  if (
    input.sequence !==
    undefined
  ) {
    payload.sequence =
      normalizeSequence(
        input.sequence,
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

  if (
    input.school_id !==
    undefined
  ) {
    payload.school_id =
      normalizeOptionalId(
        input.school_id,
      ) ?? null
  }

  if (
    input.updated_by !==
    undefined
  ) {
    payload.updated_by =
      normalizeOptionalId(
        input.updated_by,
      ) ?? null
  }

  if (
    input.metadata !==
    undefined
  ) {
    payload.metadata =
      input.metadata
  }

  if (
    Object.keys(payload).length ===
    0
  ) {
    throw new Error(
      'Nenhum campo válido foi informado para atualizar o vínculo.',
    )
  }

  return payload
}

export class PlanningObjectivesRepository {
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
     * As APIs devem injetar um cliente
     * autenticado pelo usuário.
     *
     * O fallback existe apenas para
     * compatibilidade com serviços legados.
     */
    return (
      this.injectedClient ??
      createLegacyServerClient()
    )
  }

  async findAll(
    options:
      AgendaPlanningObjectiveQueryOptions = {},
  ): Promise<
    AgendaPlanningObjective[]
  > {
    let query =
      this.client
        .from(
          'agenda_planning_objectives',
        )
        .select('*')

    if (
      !options.includeDeleted
    ) {
      query =
        query.is(
          'deleted_at',
          null,
        )
    }

    if (
      options.planningId
    ) {
      query =
        query.eq(
          'planning_id',
          options.planningId,
        )
    }

    if (
      options.objectiveId
    ) {
      query =
        query.eq(
          'objective_id',
          options.objectiveId,
        )
    }

    if (
      options.userId
    ) {
      query =
        query.eq(
          'user_id',
          options.userId,
        )
    }

    if (
      options.organizationId
    ) {
      query =
        query.eq(
          'organization_id',
          options.organizationId,
        )
    }

    if (
      options.schoolId
    ) {
      query =
        query.eq(
          'school_id',
          options.schoolId,
        )
    }

    if (
      options.relationshipRole
    ) {
      query =
        query.eq(
          'relationship_role',
          options.relationshipRole,
        )
    }

    const {
      data,
      error,
    } =
      await query
        .order(
          'sequence',
          {
            ascending:
              true,
          },
        )
        .order(
          'created_at',
          {
            ascending:
              true,
          },
        )

    if (error) {
      throw new Error(
        `Erro ao listar vínculos entre planejamentos e objetivos: ${error.message}`,
      )
    }

    return (
      data ??
      []
    ) as AgendaPlanningObjective[]
  }

  async findByPlanningId(
    planningId: string,
  ): Promise<
    AgendaPlanningObjective[]
  > {
    return this.findAll({
      planningId:
        normalizeRequiredText(
          planningId,
          'ID do planejamento',
        ),
    })
  }

  async findByObjectiveId(
    objectiveId: string,
  ): Promise<
    AgendaPlanningObjective[]
  > {
    return this.findAll({
      objectiveId:
        normalizeRequiredText(
          objectiveId,
          'ID do objetivo',
        ),
    })
  }

  async findObjectivesByPlanningId(
    planningId: string,
  ): Promise<
    AgendaPlanningObjectiveWithObjective[]
  > {
    const normalizedPlanningId =
      normalizeRequiredText(
        planningId,
        'ID do planejamento',
      )

    const {
      data,
      error,
    } =
      await this.client
        .from(
          'agenda_planning_objectives',
        )
        .select(
          `
            *,
            objective:agenda_objectives(*)
          `,
        )
        .eq(
          'planning_id',
          normalizedPlanningId,
        )
        .is(
          'deleted_at',
          null,
        )
        .order(
          'sequence',
          {
            ascending:
              true,
          },
        )
        .order(
          'created_at',
          {
            ascending:
              true,
          },
        )

    if (error) {
      throw new Error(
        `Erro ao carregar objetivos do planejamento: ${error.message}`,
      )
    }

    return (
      data ??
      []
    ) as unknown as
      AgendaPlanningObjectiveWithObjective[]
  }

  async findById(
    id: string,
  ): Promise<
    AgendaPlanningObjective | null
  > {
    const relationshipId =
      normalizeRequiredText(
        id,
        'ID do vínculo',
      )

    const {
      data,
      error,
    } =
      await this.client
        .from(
          'agenda_planning_objectives',
        )
        .select('*')
        .eq(
          'id',
          relationshipId,
        )
        .is(
          'deleted_at',
          null,
        )
        .maybeSingle()

    if (error) {
      throw new Error(
        `Erro ao buscar vínculo entre planejamento e objetivo: ${error.message}`,
      )
    }

    return data as
      AgendaPlanningObjective |
      null
  }

  async findRelationship(
    planningId: string,
    objectiveId: string,
    includeDeleted = false,
  ): Promise<
    AgendaPlanningObjective | null
  > {
    let query =
      this.client
        .from(
          'agenda_planning_objectives',
        )
        .select('*')
        .eq(
          'planning_id',
          normalizeRequiredText(
            planningId,
            'ID do planejamento',
          ),
        )
        .eq(
          'objective_id',
          normalizeRequiredText(
            objectiveId,
            'ID do objetivo',
          ),
        )

    if (!includeDeleted) {
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
        .order(
          'created_at',
          {
            ascending:
              false,
          },
        )
        .limit(1)
        .maybeSingle()

    if (error) {
      throw new Error(
        `Erro ao buscar relacionamento existente: ${error.message}`,
      )
    }

    return data as
      AgendaPlanningObjective |
      null
  }

  async create(
    input:
      CreateAgendaPlanningObjectiveInput,
  ): Promise<
    AgendaPlanningObjective
  > {
    const payload =
      buildCreatePayload(
        input,
      )

    const existingRelationship =
      await this.findRelationship(
        payload.planning_id,
        payload.objective_id,
        true,
      )

    if (
      existingRelationship &&
      !existingRelationship.deleted_at
    ) {
      throw new Error(
        'Este objetivo já está vinculado ao planejamento.',
      )
    }

    if (
      existingRelationship?.deleted_at
    ) {
      const {
        data,
        error,
      } =
        await this.client
          .from(
            'agenda_planning_objectives',
          )
          .update({
            relationship_role:
              payload.relationship_role,

            sequence:
              payload.sequence,

            user_id:
              payload.user_id,

            organization_id:
              payload.organization_id,

            school_id:
              payload.school_id,

            updated_by:
              payload.updated_by ??
              payload.user_id,

            deleted_at:
              null,

            deleted_by:
              null,

            deletion_reason:
              null,

            restored_at:
              new Date()
                .toISOString(),

            restored_by:
              payload.updated_by ??
              payload.user_id,

            restore_reason:
              'Vínculo restaurado durante nova associação ao planejamento.',

            metadata:
              payload.metadata,
          })
          .eq(
            'id',
            existingRelationship.id,
          )
          .select('*')
          .single()

      if (error) {
        throw new Error(
          `Erro ao restaurar vínculo entre planejamento e objetivo: ${error.message}`,
        )
      }

      return data as
        AgendaPlanningObjective
    }

    const {
      data,
      error,
    } =
      await this.client
        .from(
          'agenda_planning_objectives',
        )
        .insert(
          payload,
        )
        .select('*')
        .single()

    if (error) {
      throw new Error(
        `Erro ao vincular objetivo ao planejamento: ${error.message}`,
      )
    }

    return data as
      AgendaPlanningObjective
  }

  async createMany(
    inputs:
      CreateAgendaPlanningObjectiveInput[],
  ): Promise<
    AgendaPlanningObjective[]
  > {
    const createdRelationships:
      AgendaPlanningObjective[] = []

    for (
      const input
      of inputs
    ) {
      const relationship =
        await this.create(
          input,
        )

      createdRelationships.push(
        relationship,
      )
    }

    return createdRelationships
  }

  async update(
    id: string,

    input:
      UpdateAgendaPlanningObjectiveInput,
  ): Promise<
    AgendaPlanningObjective
  > {
    const relationshipId =
      normalizeRequiredText(
        id,
        'ID do vínculo',
      )

    const payload =
      buildUpdatePayload(
        input,
      )

    const {
      data,
      error,
    } =
      await this.client
        .from(
          'agenda_planning_objectives',
        )
        .update(
          payload,
        )
        .eq(
          'id',
          relationshipId,
        )
        .is(
          'deleted_at',
          null,
        )
        .select('*')
        .single()

    if (error) {
      throw new Error(
        `Erro ao atualizar vínculo entre planejamento e objetivo: ${error.message}`,
      )
    }

    return data as
      AgendaPlanningObjective
  }

  async softDelete(
    id: string,

    context:
      DeleteAgendaPlanningObjectiveContext,
  ): Promise<void> {
    const relationshipId =
      normalizeRequiredText(
        id,
        'ID do vínculo',
      )

    const actorUserId =
      normalizeRequiredText(
        context.actorUserId,
        'ID do usuário responsável pela exclusão',
      )

    const reason =
      normalizeReason(
        context.reason,
        'Motivo da exclusão',
      )

    const {
      error,
    } =
      await this.client
        .from(
          'agenda_planning_objectives',
        )
        .update({
          deleted_at:
            new Date()
              .toISOString(),

          deleted_by:
            actorUserId,

          deletion_reason:
            reason,

          updated_by:
            actorUserId,
        })
        .eq(
          'id',
          relationshipId,
        )
        .is(
          'deleted_at',
          null,
        )

    if (error) {
      throw new Error(
        `Erro ao remover vínculo entre planejamento e objetivo: ${error.message}`,
      )
    }
  }

  async softDeleteByPlanningId(
    planningId: string,

    context:
      DeleteAgendaPlanningObjectiveContext,
  ): Promise<void> {
    const normalizedPlanningId =
      normalizeRequiredText(
        planningId,
        'ID do planejamento',
      )

    const actorUserId =
      normalizeRequiredText(
        context.actorUserId,
        'ID do usuário responsável pela exclusão',
      )

    const reason =
      normalizeReason(
        context.reason,
        'Motivo da exclusão',
      )

    const {
      error,
    } =
      await this.client
        .from(
          'agenda_planning_objectives',
        )
        .update({
          deleted_at:
            new Date()
              .toISOString(),

          deleted_by:
            actorUserId,

          deletion_reason:
            reason,

          updated_by:
            actorUserId,
        })
        .eq(
          'planning_id',
          normalizedPlanningId,
        )
        .is(
          'deleted_at',
          null,
        )

    if (error) {
      throw new Error(
        `Erro ao remover objetivos do planejamento: ${error.message}`,
      )
    }
  }

  async restore(
    id: string,

    context:
      RestoreAgendaPlanningObjectiveContext,
  ): Promise<
    AgendaPlanningObjective
  > {
    const relationshipId =
      normalizeRequiredText(
        id,
        'ID do vínculo',
      )

    const actorUserId =
      normalizeRequiredText(
        context.actorUserId,
        'ID do usuário responsável pela restauração',
      )

    const reason =
      normalizeReason(
        context.reason,
        'Motivo da restauração',
      )

    const {
      data,
      error,
    } =
      await this.client
        .from(
          'agenda_planning_objectives',
        )
        .update({
          deleted_at:
            null,

          deleted_by:
            null,

          deletion_reason:
            null,

          restored_at:
            new Date()
              .toISOString(),

          restored_by:
            actorUserId,

          restore_reason:
            reason,

          updated_by:
            actorUserId,
        })
        .eq(
          'id',
          relationshipId,
        )
        .not(
          'deleted_at',
          'is',
          null,
        )
        .select('*')
        .single()

    if (error) {
      throw new Error(
        `Erro ao restaurar vínculo entre planejamento e objetivo: ${error.message}`,
      )
    }

    return data as
      AgendaPlanningObjective
  }
}