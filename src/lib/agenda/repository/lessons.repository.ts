import {
  createClient,
  type SupabaseClient,
} from '@supabase/supabase-js'

export type AgendaLessonStatus =
  | 'planejada'
  | 'em_preparacao'
  | 'realizada'
  | 'parcialmente_realizada'
  | 'reagendada'
  | 'cancelada'

export type AgendaLessonMetadata =
  Record<string, unknown>

export type AgendaLesson = {
  id: string

  title: string

  class_id: string | null
  subject: string | null

  scheduled_date: string | null
  start_time: string | null
  end_time: string | null

  planning_id: string | null
  academic_period_id: string | null

  description: string | null

  skills: string[]

  resources: string | null
  methodology: string | null

  status: AgendaLessonStatus

  observations: string | null
  next_action: string | null

  actual_start_at: string | null
  actual_end_at: string | null

  completed_at: string | null
  completed_by: string | null

  rescheduled_from_date: string | null
  rescheduled_at: string | null
  rescheduled_by: string | null
  rescheduling_reason: string | null

  cancelled_at: string | null
  cancelled_by: string | null
  cancellation_reason: string | null

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

  metadata: AgendaLessonMetadata

  created_at: string
  updated_at: string
}

export type CreateAgendaLessonInput = {
  title: string

  class_id?: string | null
  subject?: string | null

  scheduled_date?: string | null
  start_time?: string | null
  end_time?: string | null

  planning_id?: string | null
  academic_period_id?: string | null

  description?: string | null

  skills?: string[]

  resources?: string | null
  methodology?: string | null

  status?: AgendaLessonStatus

  observations?: string | null
  next_action?: string | null

  actual_start_at?: string | null
  actual_end_at?: string | null

  completed_at?: string | null
  completed_by?: string | null

  rescheduled_from_date?: string | null
  rescheduled_at?: string | null
  rescheduled_by?: string | null
  rescheduling_reason?: string | null

  cancelled_at?: string | null
  cancelled_by?: string | null
  cancellation_reason?: string | null

  user_id: string
  organization_id?: string | null
  school_id?: string | null

  created_by?: string | null
  updated_by?: string | null

  metadata?: AgendaLessonMetadata
}

export type UpdateAgendaLessonInput =
  Partial<
    Omit<
      CreateAgendaLessonInput,
      'user_id'
    >
  > & {
    user_id?: string
  }

export type AgendaLessonQueryOptions = {
  includeDeleted?: boolean

  userId?: string | null
  organizationId?: string | null
  schoolId?: string | null

  classId?: string | null
  planningId?: string | null
  academicPeriodId?: string | null

  status?: AgendaLessonStatus | null
  statuses?: AgendaLessonStatus[]

  subject?: string | null

  scheduledDateFrom?: string | null
  scheduledDateTo?: string | null

  search?: string | null
}

export type DeleteAgendaLessonContext = {
  actorUserId: string
  reason: string
}

export type RestoreAgendaLessonContext = {
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

function normalizeOptionalText(
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

function normalizeOptionalId(
  value:
    | string
    | null
    | undefined,
): string | null | undefined {
  return normalizeOptionalText(
    value,
  )
}

function normalizeOptionalDate(
  value:
    | string
    | null
    | undefined,
): string | null | undefined {
  return normalizeOptionalText(
    value,
  )
}

function normalizeOptionalTime(
  value:
    | string
    | null
    | undefined,
): string | null | undefined {
  return normalizeOptionalText(
    value,
  )
}

function normalizeSkills(
  value:
    | string[]
    | null
    | undefined,
): string[] | undefined {
  if (
    value === undefined ||
    value === null
  ) {
    return undefined
  }

  if (!Array.isArray(value)) {
    throw new Error(
      'A lista de habilidades possui formato inválido.',
    )
  }

  const normalizedSkills =
    value
      .map(
        skill =>
          typeof skill ===
          'string'
            ? skill.trim()
            : '',
      )
      .filter(Boolean)

  return Array.from(
    new Set(
      normalizedSkills,
    ),
  )
}

function normalizeStatus(
  value:
    | AgendaLessonStatus
    | null
    | undefined,
): AgendaLessonStatus {
  if (
    value === undefined ||
    value === null
  ) {
    return 'planejada'
  }

  const validStatuses:
    AgendaLessonStatus[] = [
      'planejada',
      'em_preparacao',
      'realizada',
      'parcialmente_realizada',
      'reagendada',
      'cancelada',
    ]

  if (
    !validStatuses.includes(
      value,
    )
  ) {
    throw new Error(
      'O status da aula é inválido.',
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

function validateScheduledTimeRange(
  startTime:
    | string
    | null
    | undefined,

  endTime:
    | string
    | null
    | undefined,
): void {
  if (
    !startTime ||
    !endTime
  ) {
    return
  }

  if (
    endTime <=
    startTime
  ) {
    throw new Error(
      'O horário final deve ser posterior ao horário inicial.',
    )
  }
}

function validateActualTimeRange(
  actualStartAt:
    | string
    | null
    | undefined,

  actualEndAt:
    | string
    | null
    | undefined,
): void {
  if (
    !actualStartAt ||
    !actualEndAt
  ) {
    return
  }

  const start =
    new Date(
      actualStartAt,
    )

  const end =
    new Date(
      actualEndAt,
    )

  if (
    Number.isNaN(
      start.getTime(),
    ) ||
    Number.isNaN(
      end.getTime(),
    )
  ) {
    throw new Error(
      'O período real da aula possui data ou horário inválido.',
    )
  }

  if (
    end <
    start
  ) {
    throw new Error(
      'O término real da aula não pode ser anterior ao início.',
    )
  }
}

function buildCreatePayload(
  input:
    CreateAgendaLessonInput,
) {
  const title =
    normalizeRequiredText(
      input.title,
      'Título da aula',
    )

  const userId =
    normalizeRequiredText(
      input.user_id,
      'ID do usuário',
    )

  const startTime =
    normalizeOptionalTime(
      input.start_time,
    ) ?? null

  const endTime =
    normalizeOptionalTime(
      input.end_time,
    ) ?? null

  validateScheduledTimeRange(
    startTime,
    endTime,
  )

  validateActualTimeRange(
    input.actual_start_at,
    input.actual_end_at,
  )

  return {
    title,

    class_id:
      normalizeOptionalId(
        input.class_id,
      ) ?? null,

    subject:
      normalizeOptionalText(
        input.subject,
      ) ?? null,

    scheduled_date:
      normalizeOptionalDate(
        input.scheduled_date,
      ) ?? null,

    start_time:
      startTime,

    end_time:
      endTime,

    planning_id:
      normalizeOptionalId(
        input.planning_id,
      ) ?? null,

    academic_period_id:
      normalizeOptionalId(
        input.academic_period_id,
      ) ?? null,

    description:
      normalizeOptionalText(
        input.description,
      ) ?? null,

    skills:
      normalizeSkills(
        input.skills,
      ) ?? [],

    resources:
      normalizeOptionalText(
        input.resources,
      ) ?? null,

    methodology:
      normalizeOptionalText(
        input.methodology,
      ) ?? null,

    status:
      normalizeStatus(
        input.status,
      ),

    observations:
      normalizeOptionalText(
        input.observations,
      ) ?? null,

    next_action:
      normalizeOptionalText(
        input.next_action,
      ) ?? null,

    actual_start_at:
      normalizeOptionalText(
        input.actual_start_at,
      ) ?? null,

    actual_end_at:
      normalizeOptionalText(
        input.actual_end_at,
      ) ?? null,

    completed_at:
      normalizeOptionalText(
        input.completed_at,
      ) ?? null,

    completed_by:
      normalizeOptionalId(
        input.completed_by,
      ) ?? null,

    rescheduled_from_date:
      normalizeOptionalDate(
        input.rescheduled_from_date,
      ) ?? null,

    rescheduled_at:
      normalizeOptionalText(
        input.rescheduled_at,
      ) ?? null,

    rescheduled_by:
      normalizeOptionalId(
        input.rescheduled_by,
      ) ?? null,

    rescheduling_reason:
      normalizeOptionalText(
        input.rescheduling_reason,
      ) ?? null,

    cancelled_at:
      normalizeOptionalText(
        input.cancelled_at,
      ) ?? null,

    cancelled_by:
      normalizeOptionalId(
        input.cancelled_by,
      ) ?? null,

    cancellation_reason:
      normalizeOptionalText(
        input.cancellation_reason,
      ) ?? null,

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
      ) ??
      userId,

    updated_by:
      normalizeOptionalId(
        input.updated_by,
      ) ??
      userId,

    metadata:
      input.metadata ??
      {},
  }
}

function buildUpdatePayload(
  input:
    UpdateAgendaLessonInput,
): Record<string, unknown> {
  const payload:
    Record<string, unknown> = {}

  if (
    input.title !==
    undefined
  ) {
    payload.title =
      normalizeRequiredText(
        input.title,
        'Título da aula',
      )
  }

  if (
    input.class_id !==
    undefined
  ) {
    payload.class_id =
      normalizeOptionalId(
        input.class_id,
      ) ?? null
  }

  if (
    input.subject !==
    undefined
  ) {
    payload.subject =
      normalizeOptionalText(
        input.subject,
      ) ?? null
  }

  if (
    input.scheduled_date !==
    undefined
  ) {
    payload.scheduled_date =
      normalizeOptionalDate(
        input.scheduled_date,
      ) ?? null
  }

  if (
    input.start_time !==
    undefined
  ) {
    payload.start_time =
      normalizeOptionalTime(
        input.start_time,
      ) ?? null
  }

  if (
    input.end_time !==
    undefined
  ) {
    payload.end_time =
      normalizeOptionalTime(
        input.end_time,
      ) ?? null
  }

  if (
    input.planning_id !==
    undefined
  ) {
    payload.planning_id =
      normalizeOptionalId(
        input.planning_id,
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

  if (
    input.description !==
    undefined
  ) {
    payload.description =
      normalizeOptionalText(
        input.description,
      ) ?? null
  }

  if (
    input.skills !==
    undefined
  ) {
    payload.skills =
      normalizeSkills(
        input.skills,
      ) ?? []
  }

  if (
    input.resources !==
    undefined
  ) {
    payload.resources =
      normalizeOptionalText(
        input.resources,
      ) ?? null
  }

  if (
    input.methodology !==
    undefined
  ) {
    payload.methodology =
      normalizeOptionalText(
        input.methodology,
      ) ?? null
  }

  if (
    input.status !==
    undefined
  ) {
    payload.status =
      normalizeStatus(
        input.status,
      )
  }

  if (
    input.observations !==
    undefined
  ) {
    payload.observations =
      normalizeOptionalText(
        input.observations,
      ) ?? null
  }

  if (
    input.next_action !==
    undefined
  ) {
    payload.next_action =
      normalizeOptionalText(
        input.next_action,
      ) ?? null
  }

  if (
    input.actual_start_at !==
    undefined
  ) {
    payload.actual_start_at =
      normalizeOptionalText(
        input.actual_start_at,
      ) ?? null
  }

  if (
    input.actual_end_at !==
    undefined
  ) {
    payload.actual_end_at =
      normalizeOptionalText(
        input.actual_end_at,
      ) ?? null
  }

  if (
    input.completed_at !==
    undefined
  ) {
    payload.completed_at =
      normalizeOptionalText(
        input.completed_at,
      ) ?? null
  }

  if (
    input.completed_by !==
    undefined
  ) {
    payload.completed_by =
      normalizeOptionalId(
        input.completed_by,
      ) ?? null
  }

  if (
    input.rescheduled_from_date !==
    undefined
  ) {
    payload.rescheduled_from_date =
      normalizeOptionalDate(
        input.rescheduled_from_date,
      ) ?? null
  }

  if (
    input.rescheduled_at !==
    undefined
  ) {
    payload.rescheduled_at =
      normalizeOptionalText(
        input.rescheduled_at,
      ) ?? null
  }

  if (
    input.rescheduled_by !==
    undefined
  ) {
    payload.rescheduled_by =
      normalizeOptionalId(
        input.rescheduled_by,
      ) ?? null
  }

  if (
    input.rescheduling_reason !==
    undefined
  ) {
    payload.rescheduling_reason =
      normalizeOptionalText(
        input.rescheduling_reason,
      ) ?? null
  }

  if (
    input.cancelled_at !==
    undefined
  ) {
    payload.cancelled_at =
      normalizeOptionalText(
        input.cancelled_at,
      ) ?? null
  }

  if (
    input.cancelled_by !==
    undefined
  ) {
    payload.cancelled_by =
      normalizeOptionalId(
        input.cancelled_by,
      ) ?? null
  }

  if (
    input.cancellation_reason !==
    undefined
  ) {
    payload.cancellation_reason =
      normalizeOptionalText(
        input.cancellation_reason,
      ) ?? null
  }

  if (
    input.user_id !==
    undefined
  ) {
    payload.user_id =
      normalizeRequiredText(
        input.user_id,
        'ID do usuário',
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
    input.created_by !==
    undefined
  ) {
    payload.created_by =
      normalizeOptionalId(
        input.created_by,
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

  validateScheduledTimeRange(
    input.start_time,
    input.end_time,
  )

  validateActualTimeRange(
    input.actual_start_at,
    input.actual_end_at,
  )

  if (
    Object.keys(payload).length ===
    0
  ) {
    throw new Error(
      'Nenhum campo válido foi informado para atualizar a aula.',
    )
  }

  return payload
}

export class LessonsRepository {
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
     * O fallback permanece apenas para
     * compatibilidade com serviços internos.
     */
    return (
      this.injectedClient ??
      createLegacyServerClient()
    )
  }

  private applyFilters(
    query: any,

    options:
      AgendaLessonQueryOptions,
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
      options.userId
    ) {
      filteredQuery =
        filteredQuery.eq(
          'user_id',
          options.userId,
        )
    }

    if (
      options.organizationId
    ) {
      filteredQuery =
        filteredQuery.eq(
          'organization_id',
          options.organizationId,
        )
    }

    if (
      options.schoolId
    ) {
      filteredQuery =
        filteredQuery.eq(
          'school_id',
          options.schoolId,
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
      options.planningId
    ) {
      filteredQuery =
        filteredQuery.eq(
          'planning_id',
          options.planningId,
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
      options.status
    ) {
      filteredQuery =
        filteredQuery.eq(
          'status',
          options.status,
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
      options.subject
    ) {
      filteredQuery =
        filteredQuery.eq(
          'subject',
          options.subject,
        )
    }

    if (
      options.scheduledDateFrom
    ) {
      filteredQuery =
        filteredQuery.gte(
          'scheduled_date',
          options.scheduledDateFrom,
        )
    }

    if (
      options.scheduledDateTo
    ) {
      filteredQuery =
        filteredQuery.lte(
          'scheduled_date',
          options.scheduledDateTo,
        )
    }

    if (
      options.search?.trim()
    ) {
      const searchTerm =
        options.search
          .trim()
          .replace(
            /[%_,]/g,
            ' ',
          )

      filteredQuery =
        filteredQuery.or(
          [
            `title.ilike.%${searchTerm}%`,
            `description.ilike.%${searchTerm}%`,
            `subject.ilike.%${searchTerm}%`,
            `observations.ilike.%${searchTerm}%`,
            `next_action.ilike.%${searchTerm}%`,
          ].join(','),
        )
    }

    return filteredQuery
  }

  async findAll(
    options:
      AgendaLessonQueryOptions = {},
  ): Promise<
    AgendaLesson[]
  > {
    let query =
      this.client
        .from(
          'agenda_lessons',
        )
        .select('*')

    query =
      this.applyFilters(
        query,
        options,
      )

    const {
      data,
      error,
    } =
      await query
        .order(
          'scheduled_date',
          {
            ascending:
              true,

            nullsFirst:
              false,
          },
        )
        .order(
          'start_time',
          {
            ascending:
              true,

            nullsFirst:
              false,
          },
        )
        .order(
          'created_at',
          {
            ascending:
              false,
          },
        )

    if (error) {
      throw new Error(
        `Erro ao listar aulas: ${error.message}`,
      )
    }

    return (
      data ??
      []
    ) as AgendaLesson[]
  }

  async findByUserId(
    userId: string,

    options:
      AgendaLessonQueryOptions = {},
  ): Promise<
    AgendaLesson[]
  > {
    return this.findAll({
      ...options,

      userId:
        normalizeRequiredText(
          userId,
          'ID do usuário',
        ),
    })
  }

  async findByPlanningId(
    planningId: string,

    options:
      AgendaLessonQueryOptions = {},
  ): Promise<
    AgendaLesson[]
  > {
    return this.findAll({
      ...options,

      planningId:
        normalizeRequiredText(
          planningId,
          'ID do planejamento',
        ),
    })
  }

  async findById(
    id: string,
  ): Promise<
    AgendaLesson | null
  > {
    const lessonId =
      normalizeRequiredText(
        id,
        'ID da aula',
      )

    const {
      data,
      error,
    } =
      await this.client
        .from(
          'agenda_lessons',
        )
        .select('*')
        .eq(
          'id',
          lessonId,
        )
        .is(
          'deleted_at',
          null,
        )
        .maybeSingle()

    if (error) {
      throw new Error(
        `Erro ao buscar aula: ${error.message}`,
      )
    }

    return data as
      AgendaLesson |
      null
  }

  async findByIdIncludingDeleted(
    id: string,
  ): Promise<
    AgendaLesson | null
  > {
    const lessonId =
      normalizeRequiredText(
        id,
        'ID da aula',
      )

    const {
      data,
      error,
    } =
      await this.client
        .from(
          'agenda_lessons',
        )
        .select('*')
        .eq(
          'id',
          lessonId,
        )
        .maybeSingle()

    if (error) {
      throw new Error(
        `Erro ao buscar aula incluindo registros excluídos: ${error.message}`,
      )
    }

    return data as
      AgendaLesson |
      null
  }

  async create(
    input:
      CreateAgendaLessonInput,
  ): Promise<
    AgendaLesson
  > {
    const payload =
      buildCreatePayload(
        input,
      )

    const {
      data,
      error,
    } =
      await this.client
        .from(
          'agenda_lessons',
        )
        .insert(
          payload,
        )
        .select('*')
        .single()

    if (error) {
      throw new Error(
        `Erro ao criar aula: ${error.message}`,
      )
    }

    return data as
      AgendaLesson
  }

  async update(
    id: string,

    input:
      UpdateAgendaLessonInput,
  ): Promise<
    AgendaLesson
  > {
    const lessonId =
      normalizeRequiredText(
        id,
        'ID da aula',
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
          'agenda_lessons',
        )
        .update(
          payload,
        )
        .eq(
          'id',
          lessonId,
        )
        .is(
          'deleted_at',
          null,
        )
        .select('*')
        .single()

    if (error) {
      throw new Error(
        `Erro ao atualizar aula: ${error.message}`,
      )
    }

    return data as
      AgendaLesson
  }

  async delete(
    id: string,

    context:
      DeleteAgendaLessonContext,
  ): Promise<void> {
    const lessonId =
      normalizeRequiredText(
        id,
        'ID da aula',
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
      await this.client.rpc(
        'soft_delete_agenda_record',
        {
          requested_resource_type:
            'agenda_lessons',

          requested_resource_id:
            lessonId,

          requested_reason:
            reason,

          requested_actor_user_id:
            actorUserId,
        },
      )

    if (error) {
      throw new Error(
        `Erro ao excluir aula: ${error.message}`,
      )
    }
  }

  async restore(
    id: string,

    context:
      RestoreAgendaLessonContext,
  ): Promise<
    AgendaLesson
  > {
    const lessonId =
      normalizeRequiredText(
        id,
        'ID da aula',
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
      await this.client.rpc(
        'restore_agenda_record',
        {
          requested_resource_type:
            'agenda_lessons',

          requested_resource_id:
            lessonId,

          requested_reason:
            reason,

          requested_actor_user_id:
            actorUserId,
        },
      )

    if (error) {
      throw new Error(
        `Erro ao restaurar aula: ${error.message}`,
      )
    }

    if (!data) {
      throw new Error(
        'A restauração não retornou a aula atualizada.',
      )
    }

    return data as unknown as
      AgendaLesson
  }
}

export const lessonsRepository =
  new LessonsRepository()