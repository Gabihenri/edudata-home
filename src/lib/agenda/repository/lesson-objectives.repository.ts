import {
  createClient,
  type SupabaseClient,
} from '@supabase/supabase-js'

import type {
  AgendaObjective,
} from '@/lib/agenda/repository/objectives.repository'

export type AgendaLessonObjectiveRole =
  | 'primary'
  | 'supporting'

export type AgendaLessonObjectiveMetadata =
  Record<string, unknown>

export type AgendaLessonObjective = {
  id: string

  lesson_id: string
  objective_id: string

  relationship_role:
    AgendaLessonObjectiveRole

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
    AgendaLessonObjectiveMetadata

  created_at: string
  updated_at: string
}

export type AgendaLessonObjectiveWithObjective =
  AgendaLessonObjective & {
    objective:
      AgendaObjective | null
  }

export type CreateAgendaLessonObjectiveInput = {
  lesson_id: string
  objective_id: string

  relationship_role?:
    AgendaLessonObjectiveRole

  sequence?: number

  user_id: string
  organization_id?: string | null
  school_id?: string | null

  created_by?: string | null
  updated_by?: string | null

  metadata?:
    AgendaLessonObjectiveMetadata
}

export type UpdateAgendaLessonObjectiveInput = {
  relationship_role?:
    AgendaLessonObjectiveRole

  sequence?: number

  organization_id?: string | null
  school_id?: string | null

  updated_by?: string | null

  metadata?:
    AgendaLessonObjectiveMetadata
}

export type AgendaLessonObjectiveQueryOptions = {
  includeDeleted?: boolean

  lessonId?: string | null
  objectiveId?: string | null

  userId?: string | null
  organizationId?: string | null
  schoolId?: string | null

  relationshipRole?:
    AgendaLessonObjectiveRole | null
}

export type DeleteAgendaLessonObjectiveContext = {
  actorUserId: string
  reason: string
}

export type RestoreAgendaLessonObjectiveContext = {
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
    | AgendaLessonObjectiveRole
    | null
    | undefined,
): AgendaLessonObjectiveRole {
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
      'O papel do objetivo na aula é inválido.',
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
    CreateAgendaLessonObjectiveInput,
) {
  return {
    lesson_id:
      normalizeRequiredText(
        input.lesson_id,
        'ID da aula',
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
    UpdateAgendaLessonObjectiveInput,
): Record<string, unknown> {
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

export class LessonObjectivesRepository {
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
     * compatibilidade com serviços internos.
     */
    return (
      this.injectedClient ??
      createLegacyServerClient()
    )
  }

  async findAll(
    options:
      AgendaLessonObjectiveQueryOptions = {},
  ): Promise<
    AgendaLessonObjective[]
  > {
    let query =
      this.client
        .from(
          'agenda_lesson_objectives',
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
      options.lessonId
    ) {
      query =
        query.eq(
          'lesson_id',
          options.lessonId,
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
        `Erro ao listar vínculos entre aulas e objetivos: ${error.message}`,
      )
    }

    return (
      data ??
      []
    ) as AgendaLessonObjective[]
  }

  async findByLessonId(
    lessonId: string,
  ): Promise<
    AgendaLessonObjective[]
  > {
    return this.findAll({
      lessonId:
        normalizeRequiredText(
          lessonId,
          'ID da aula',
        ),
    })
  }

  async findByObjectiveId(
    objectiveId: string,
  ): Promise<
    AgendaLessonObjective[]
  > {
    return this.findAll({
      objectiveId:
        normalizeRequiredText(
          objectiveId,
          'ID do objetivo',
        ),
    })
  }

  async findObjectivesByLessonId(
    lessonId: string,
  ): Promise<
    AgendaLessonObjectiveWithObjective[]
  > {
    const normalizedLessonId =
      normalizeRequiredText(
        lessonId,
        'ID da aula',
      )

    const {
      data,
      error,
    } =
      await this.client
        .from(
          'agenda_lesson_objectives',
        )
        .select(
          `
            *,
            objective:agenda_objectives(*)
          `,
        )
        .eq(
          'lesson_id',
          normalizedLessonId,
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
        `Erro ao carregar objetivos da aula: ${error.message}`,
      )
    }

    return (
      data ??
      []
    ) as unknown as
      AgendaLessonObjectiveWithObjective[]
  }

  async findById(
    id: string,
  ): Promise<
    AgendaLessonObjective | null
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
          'agenda_lesson_objectives',
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
        `Erro ao buscar vínculo entre aula e objetivo: ${error.message}`,
      )
    }

    return data as
      AgendaLessonObjective |
      null
  }

  async findRelationship(
    lessonId: string,
    objectiveId: string,
    includeDeleted = false,
  ): Promise<
    AgendaLessonObjective | null
  > {
    let query =
      this.client
        .from(
          'agenda_lesson_objectives',
        )
        .select('*')
        .eq(
          'lesson_id',
          normalizeRequiredText(
            lessonId,
            'ID da aula',
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
        `Erro ao buscar relacionamento existente entre aula e objetivo: ${error.message}`,
      )
    }

    return data as
      AgendaLessonObjective |
      null
  }

  async create(
    input:
      CreateAgendaLessonObjectiveInput,
  ): Promise<
    AgendaLessonObjective
  > {
    const payload =
      buildCreatePayload(
        input,
      )

    const existingRelationship =
      await this.findRelationship(
        payload.lesson_id,
        payload.objective_id,
        true,
      )

    if (
      existingRelationship &&
      !existingRelationship.deleted_at
    ) {
      throw new Error(
        'Este objetivo já está vinculado à aula.',
      )
    }

    if (
      existingRelationship?.deleted_at
    ) {
      const actorUserId =
        payload.updated_by ??
        payload.user_id

      const {
        data,
        error,
      } =
        await this.client
          .from(
            'agenda_lesson_objectives',
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
              actorUserId,

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
              'Vínculo restaurado durante nova associação à aula.',

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
          `Erro ao restaurar vínculo entre aula e objetivo: ${error.message}`,
        )
      }

      return data as
        AgendaLessonObjective
    }

    const {
      data,
      error,
    } =
      await this.client
        .from(
          'agenda_lesson_objectives',
        )
        .insert(
          payload,
        )
        .select('*')
        .single()

    if (error) {
      throw new Error(
        `Erro ao vincular objetivo à aula: ${error.message}`,
      )
    }

    return data as
      AgendaLessonObjective
  }

  async createMany(
    inputs:
      CreateAgendaLessonObjectiveInput[],
  ): Promise<
    AgendaLessonObjective[]
  > {
    const createdRelationships:
      AgendaLessonObjective[] = []

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
      UpdateAgendaLessonObjectiveInput,
  ): Promise<
    AgendaLessonObjective
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
          'agenda_lesson_objectives',
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
        `Erro ao atualizar vínculo entre aula e objetivo: ${error.message}`,
      )
    }

    return data as
      AgendaLessonObjective
  }

  async softDelete(
    id: string,

    context:
      DeleteAgendaLessonObjectiveContext,
  ): Promise<void> {
    const relationshipId =
      normalizeRequiredText(
        id,
        'ID do vínculo',
      )

    const actorUserId =
      normalizeRequiredText(
        context.actorUserId,
        'ID do usuário responsável pela remoção',
      )

    const reason =
      normalizeReason(
        context.reason,
        'Motivo da remoção',
      )

    const {
      error,
    } =
      await this.client
        .from(
          'agenda_lesson_objectives',
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
        `Erro ao remover vínculo entre aula e objetivo: ${error.message}`,
      )
    }
  }

  async softDeleteByLessonId(
    lessonId: string,

    context:
      DeleteAgendaLessonObjectiveContext,
  ): Promise<void> {
    const normalizedLessonId =
      normalizeRequiredText(
        lessonId,
        'ID da aula',
      )

    const actorUserId =
      normalizeRequiredText(
        context.actorUserId,
        'ID do usuário responsável pela remoção',
      )

    const reason =
      normalizeReason(
        context.reason,
        'Motivo da remoção',
      )

    const {
      error,
    } =
      await this.client
        .from(
          'agenda_lesson_objectives',
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
          'lesson_id',
          normalizedLessonId,
        )
        .is(
          'deleted_at',
          null,
        )

    if (error) {
      throw new Error(
        `Erro ao remover objetivos da aula: ${error.message}`,
      )
    }
  }

  async restore(
    id: string,

    context:
      RestoreAgendaLessonObjectiveContext,
  ): Promise<
    AgendaLessonObjective
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
          'agenda_lesson_objectives',
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
        `Erro ao restaurar vínculo entre aula e objetivo: ${error.message}`,
      )
    }

    return data as
      AgendaLessonObjective
  }
}