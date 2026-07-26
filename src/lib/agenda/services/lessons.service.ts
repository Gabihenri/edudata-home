import {
  LessonsRepository,
  type AgendaLesson,
  type AgendaLessonMetadata,
  type AgendaLessonQueryOptions,
  type AgendaLessonStatus,
  type CreateAgendaLessonInput,
  type UpdateAgendaLessonInput,
} from '@/lib/agenda/repository/lessons.repository'

export type CreateAgendaLessonServiceInput = {
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

  organization_id?: string | null
  school_id?: string | null

  metadata?: AgendaLessonMetadata
}

export type UpdateAgendaLessonServiceInput =
  Partial<
    CreateAgendaLessonServiceInput
  >

export type AgendaLessonActorContext = {
  actorUserId: string

  organizationId?: string | null
  schoolId?: string | null
}

export type CompleteAgendaLessonInput = {
  actualStartAt?: string | null
  actualEndAt?: string | null

  observations?: string | null
  nextAction?: string | null

  partiallyCompleted?: boolean
}

export type RescheduleAgendaLessonInput = {
  scheduledDate: string

  startTime?: string | null
  endTime?: string | null

  reason: string
}

export type CancelAgendaLessonInput = {
  reason: string
}

export type DeleteAgendaLessonInput = {
  reason: string
}

export type RestoreAgendaLessonInput = {
  reason: string
}

const VALID_STATUSES:
  AgendaLessonStatus[] = [
    'planejada',
    'em_preparacao',
    'realizada',
    'parcialmente_realizada',
    'reagendada',
    'cancelada',
  ]

function normalizeRequiredText(
  value:
    | string
    | null
    | undefined,

  fieldName: string,

  maximumLength?: number,
): string {
  const normalizedValue =
    value?.trim()

  if (!normalizedValue) {
    throw new Error(
      `${fieldName} é obrigatório.`,
    )
  }

  if (
    maximumLength &&
    normalizedValue.length >
      maximumLength
  ) {
    throw new Error(
      `${fieldName} não pode ultrapassar ${maximumLength} caracteres.`,
    )
  }

  return normalizedValue
}

function normalizeOptionalText(
  value:
    | string
    | null
    | undefined,

  fieldName: string,

  maximumLength?: number,
): string | null | undefined {
  if (value === undefined) {
    return undefined
  }

  if (value === null) {
    return null
  }

  const normalizedValue =
    value.trim()

  if (!normalizedValue) {
    return null
  }

  if (
    maximumLength &&
    normalizedValue.length >
      maximumLength
  ) {
    throw new Error(
      `${fieldName} não pode ultrapassar ${maximumLength} caracteres.`,
    )
  }

  return normalizedValue
}

function normalizeOptionalId(
  value:
    | string
    | null
    | undefined,

  fieldName: string,
): string | null | undefined {
  return normalizeOptionalText(
    value,
    fieldName,
    36,
  )
}

function normalizeStatus(
  value:
    | AgendaLessonStatus
    | null
    | undefined,
): AgendaLessonStatus | undefined {
  if (
    value === undefined ||
    value === null
  ) {
    return undefined
  }

  if (
    !VALID_STATUSES.includes(
      value,
    )
  ) {
    throw new Error(
      'O status da aula é inválido.',
    )
  }

  return value
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

function normalizeMetadata(
  value:
    | AgendaLessonMetadata
    | null
    | undefined,
): AgendaLessonMetadata | undefined {
  if (
    value === undefined ||
    value === null
  ) {
    return undefined
  }

  if (
    typeof value !==
      'object' ||
    Array.isArray(value)
  ) {
    throw new Error(
      'Os metadados da aula possuem formato inválido.',
    )
  }

  return value
}

function normalizeDate(
  value:
    | string
    | null
    | undefined,

  fieldName: string,
): string | null | undefined {
  const normalizedValue =
    normalizeOptionalText(
      value,
      fieldName,
      10,
    )

  if (
    normalizedValue ===
      undefined ||
    normalizedValue ===
      null
  ) {
    return normalizedValue
  }

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      normalizedValue,
    )
  ) {
    throw new Error(
      `${fieldName} possui formato inválido.`,
    )
  }

  const parsedDate =
    new Date(
      `${normalizedValue}T00:00:00`,
    )

  if (
    Number.isNaN(
      parsedDate.getTime(),
    )
  ) {
    throw new Error(
      `${fieldName} é inválida.`,
    )
  }

  return normalizedValue
}

function normalizeTime(
  value:
    | string
    | null
    | undefined,

  fieldName: string,
): string | null | undefined {
  const normalizedValue =
    normalizeOptionalText(
      value,
      fieldName,
      8,
    )

  if (
    normalizedValue ===
      undefined ||
    normalizedValue ===
      null
  ) {
    return normalizedValue
  }

  if (
    !/^\d{2}:\d{2}(:\d{2})?$/.test(
      normalizedValue,
    )
  ) {
    throw new Error(
      `${fieldName} possui formato inválido.`,
    )
  }

  return normalizedValue
}

function normalizeDateTime(
  value:
    | string
    | null
    | undefined,

  fieldName: string,
): string | null | undefined {
  const normalizedValue =
    normalizeOptionalText(
      value,
      fieldName,
      50,
    )

  if (
    normalizedValue ===
      undefined ||
    normalizedValue ===
      null
  ) {
    return normalizedValue
  }

  const parsedValue =
    new Date(
      normalizedValue,
    )

  if (
    Number.isNaN(
      parsedValue.getTime(),
    )
  ) {
    throw new Error(
      `${fieldName} possui formato inválido.`,
    )
  }

  return parsedValue
    .toISOString()
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
    end <
    start
  ) {
    throw new Error(
      'O término real da aula não pode ser anterior ao início.',
    )
  }
}

function ensureLessonOwnership(
  lesson: AgendaLesson,
  actorUserId: string,
): void {
  if (
    lesson.user_id !==
    actorUserId
  ) {
    throw new Error(
      'A aula informada não pertence ao usuário autenticado.',
    )
  }
}

function createServiceInput(
  input:
    CreateAgendaLessonServiceInput,
): Omit<
  CreateAgendaLessonInput,
  | 'user_id'
  | 'created_by'
  | 'updated_by'
> {
  const startTime =
    normalizeTime(
      input.start_time,
      'Horário inicial',
    )

  const endTime =
    normalizeTime(
      input.end_time,
      'Horário final',
    )

  validateScheduledTimeRange(
    startTime,
    endTime,
  )

  return {
    title:
      normalizeRequiredText(
        input.title,
        'Título da aula',
        240,
      ),

    class_id:
      normalizeOptionalId(
        input.class_id,
        'ID da turma',
      ),

    subject:
      normalizeOptionalText(
        input.subject,
        'Componente curricular',
        250,
      ),

    scheduled_date:
      normalizeDate(
        input.scheduled_date,
        'Data da aula',
      ),

    start_time:
      startTime,

    end_time:
      endTime,

    planning_id:
      normalizeOptionalId(
        input.planning_id,
        'ID do planejamento',
      ),

    academic_period_id:
      normalizeOptionalId(
        input.academic_period_id,
        'ID do período acadêmico',
      ),

    description:
      normalizeOptionalText(
        input.description,
        'Descrição',
        5000,
      ),

    skills:
      normalizeSkills(
        input.skills,
      ),

    resources:
      normalizeOptionalText(
        input.resources,
        'Recursos',
        5000,
      ),

    methodology:
      normalizeOptionalText(
        input.methodology,
        'Metodologia',
        5000,
      ),

    status:
      normalizeStatus(
        input.status,
      ),

    observations:
      normalizeOptionalText(
        input.observations,
        'Observações',
        5000,
      ),

    next_action:
      normalizeOptionalText(
        input.next_action,
        'Próxima ação',
        3000,
      ),

    organization_id:
      normalizeOptionalId(
        input.organization_id,
        'ID da organização',
      ),

    school_id:
      normalizeOptionalId(
        input.school_id,
        'ID da escola',
      ),

    metadata:
      normalizeMetadata(
        input.metadata,
      ),
  }
}

function createUpdateInput(
  input:
    UpdateAgendaLessonServiceInput,
): UpdateAgendaLessonInput {
  const normalizedInput:
    UpdateAgendaLessonInput = {}

  if (
    input.title !==
    undefined
  ) {
    normalizedInput.title =
      normalizeRequiredText(
        input.title,
        'Título da aula',
        240,
      )
  }

  if (
    input.class_id !==
    undefined
  ) {
    normalizedInput.class_id =
      normalizeOptionalId(
        input.class_id,
        'ID da turma',
      )
  }

  if (
    input.subject !==
    undefined
  ) {
    normalizedInput.subject =
      normalizeOptionalText(
        input.subject,
        'Componente curricular',
        250,
      )
  }

  if (
    input.scheduled_date !==
    undefined
  ) {
    normalizedInput.scheduled_date =
      normalizeDate(
        input.scheduled_date,
        'Data da aula',
      )
  }

  if (
    input.start_time !==
    undefined
  ) {
    normalizedInput.start_time =
      normalizeTime(
        input.start_time,
        'Horário inicial',
      )
  }

  if (
    input.end_time !==
    undefined
  ) {
    normalizedInput.end_time =
      normalizeTime(
        input.end_time,
        'Horário final',
      )
  }

  validateScheduledTimeRange(
    normalizedInput.start_time,
    normalizedInput.end_time,
  )

  if (
    input.planning_id !==
    undefined
  ) {
    normalizedInput.planning_id =
      normalizeOptionalId(
        input.planning_id,
        'ID do planejamento',
      )
  }

  if (
    input.academic_period_id !==
    undefined
  ) {
    normalizedInput.academic_period_id =
      normalizeOptionalId(
        input.academic_period_id,
        'ID do período acadêmico',
      )
  }

  if (
    input.description !==
    undefined
  ) {
    normalizedInput.description =
      normalizeOptionalText(
        input.description,
        'Descrição',
        5000,
      )
  }

  if (
    input.skills !==
    undefined
  ) {
    normalizedInput.skills =
      normalizeSkills(
        input.skills,
      )
  }

  if (
    input.resources !==
    undefined
  ) {
    normalizedInput.resources =
      normalizeOptionalText(
        input.resources,
        'Recursos',
        5000,
      )
  }

  if (
    input.methodology !==
    undefined
  ) {
    normalizedInput.methodology =
      normalizeOptionalText(
        input.methodology,
        'Metodologia',
        5000,
      )
  }

  if (
    input.status !==
    undefined
  ) {
    normalizedInput.status =
      normalizeStatus(
        input.status,
      )
  }

  if (
    input.observations !==
    undefined
  ) {
    normalizedInput.observations =
      normalizeOptionalText(
        input.observations,
        'Observações',
        5000,
      )
  }

  if (
    input.next_action !==
    undefined
  ) {
    normalizedInput.next_action =
      normalizeOptionalText(
        input.next_action,
        'Próxima ação',
        3000,
      )
  }

  if (
    input.organization_id !==
    undefined
  ) {
    normalizedInput.organization_id =
      normalizeOptionalId(
        input.organization_id,
        'ID da organização',
      )
  }

  if (
    input.school_id !==
    undefined
  ) {
    normalizedInput.school_id =
      normalizeOptionalId(
        input.school_id,
        'ID da escola',
      )
  }

  if (
    input.metadata !==
    undefined
  ) {
    normalizedInput.metadata =
      normalizeMetadata(
        input.metadata,
      )
  }

  return normalizedInput
}

export class LessonsService {
  constructor(
    private readonly repository:
      LessonsRepository =
        new LessonsRepository(),
  ) {}

  async list(
    userId: string,

    options:
      AgendaLessonQueryOptions = {},
  ): Promise<
    AgendaLesson[]
  > {
    const normalizedUserId =
      normalizeRequiredText(
        userId,
        'ID do usuário',
        36,
      )

    return this.repository
      .findByUserId(
        normalizedUserId,
        options,
      )
  }

  async getById(
    lessonId: string,
    userId: string,
  ): Promise<
    AgendaLesson
  > {
    const normalizedLessonId =
      normalizeRequiredText(
        lessonId,
        'ID da aula',
        36,
      )

    const normalizedUserId =
      normalizeRequiredText(
        userId,
        'ID do usuário',
        36,
      )

    const lesson =
      await this.repository
        .findById(
          normalizedLessonId,
        )

    if (!lesson) {
      throw new Error(
        'Aula não encontrada.',
      )
    }

    ensureLessonOwnership(
      lesson,
      normalizedUserId,
    )

    return lesson
  }

  async create(
    input:
      CreateAgendaLessonServiceInput,

    context:
      AgendaLessonActorContext,
  ): Promise<
    AgendaLesson
  > {
    const actorUserId =
      normalizeRequiredText(
        context.actorUserId,
        'ID do usuário',
        36,
      )

    const normalizedInput =
      createServiceInput(
        input,
      )

    return this.repository.create({
      ...normalizedInput,

      user_id:
        actorUserId,

      organization_id:
        normalizedInput
          .organization_id ??
        normalizeOptionalId(
          context.organizationId,
          'ID da organização',
        ) ??
        null,

      school_id:
        normalizedInput
          .school_id ??
        normalizeOptionalId(
          context.schoolId,
          'ID da escola',
        ) ??
        null,

      created_by:
        actorUserId,

      updated_by:
        actorUserId,
    })
  }

  async update(
    lessonId: string,

    input:
      UpdateAgendaLessonServiceInput,

    context:
      AgendaLessonActorContext,
  ): Promise<
    AgendaLesson
  > {
    const currentLesson =
      await this.getById(
        lessonId,
        context.actorUserId,
      )

    const normalizedInput =
      createUpdateInput(
        input,
      )

    if (
      Object.keys(
        normalizedInput,
      ).length ===
      0
    ) {
      throw new Error(
        'Nenhum campo válido foi informado para atualizar a aula.',
      )
    }

    return this.repository.update(
      currentLesson.id,
      {
        ...normalizedInput,

        updated_by:
          normalizeRequiredText(
            context.actorUserId,
            'ID do usuário',
            36,
          ),
      },
    )
  }

  async changeStatus(
    lessonId: string,

    status:
      AgendaLessonStatus,

    context:
      AgendaLessonActorContext,
  ): Promise<
    AgendaLesson
  > {
    const normalizedStatus =
      normalizeStatus(
        status,
      )

    if (!normalizedStatus) {
      throw new Error(
        'O status da aula é obrigatório.',
      )
    }

    return this.update(
      lessonId,
      {
        status:
          normalizedStatus,
      },
      context,
    )
  }

  async markAsPreparing(
    lessonId: string,

    context:
      AgendaLessonActorContext,
  ): Promise<
    AgendaLesson
  > {
    return this.changeStatus(
      lessonId,
      'em_preparacao',
      context,
    )
  }

  async complete(
    lessonId: string,

    input:
      CompleteAgendaLessonInput,

    context:
      AgendaLessonActorContext,
  ): Promise<
    AgendaLesson
  > {
    const currentLesson =
      await this.getById(
        lessonId,
        context.actorUserId,
      )

    if (
      currentLesson.status ===
      'cancelada'
    ) {
      throw new Error(
        'Uma aula cancelada não pode ser marcada como realizada.',
      )
    }

    const actorUserId =
      normalizeRequiredText(
        context.actorUserId,
        'ID do usuário',
        36,
      )

    const now =
      new Date()
        .toISOString()

    const actualStartAt =
      normalizeDateTime(
        input.actualStartAt,
        'Início real da aula',
      ) ??
      currentLesson
        .actual_start_at ??
      now

    const actualEndAt =
      normalizeDateTime(
        input.actualEndAt,
        'Término real da aula',
      ) ??
      now

    validateActualTimeRange(
      actualStartAt,
      actualEndAt,
    )

    return this.repository.update(
      currentLesson.id,
      {
        status:
          input.partiallyCompleted
            ? 'parcialmente_realizada'
            : 'realizada',

        actual_start_at:
          actualStartAt,

        actual_end_at:
          actualEndAt,

        completed_at:
          now,

        completed_by:
          actorUserId,

        observations:
          normalizeOptionalText(
            input.observations,
            'Observações',
            5000,
          ),

        next_action:
          normalizeOptionalText(
            input.nextAction,
            'Próxima ação',
            3000,
          ),

        updated_by:
          actorUserId,
      },
    )
  }

  async reschedule(
    lessonId: string,

    input:
      RescheduleAgendaLessonInput,

    context:
      AgendaLessonActorContext,
  ): Promise<
    AgendaLesson
  > {
    const currentLesson =
      await this.getById(
        lessonId,
        context.actorUserId,
      )

    if (
      currentLesson.status ===
      'realizada'
    ) {
      throw new Error(
        'Uma aula já realizada não pode ser reagendada.',
      )
    }

    if (
      currentLesson.status ===
      'cancelada'
    ) {
      throw new Error(
        'Uma aula cancelada não pode ser reagendada.',
      )
    }

    const actorUserId =
      normalizeRequiredText(
        context.actorUserId,
        'ID do usuário',
        36,
      )

    const scheduledDate =
      normalizeDate(
        input.scheduledDate,
        'Nova data da aula',
      )

    if (!scheduledDate) {
      throw new Error(
        'A nova data da aula é obrigatória.',
      )
    }

    const startTime =
      normalizeTime(
        input.startTime,
        'Novo horário inicial',
      )

    const endTime =
      normalizeTime(
        input.endTime,
        'Novo horário final',
      )

    validateScheduledTimeRange(
      startTime,
      endTime,
    )

    return this.repository.update(
      currentLesson.id,
      {
        status:
          'reagendada',

        rescheduled_from_date:
          currentLesson
            .scheduled_date,

        scheduled_date:
          scheduledDate,

        start_time:
          startTime,

        end_time:
          endTime,

        rescheduled_at:
          new Date()
            .toISOString(),

        rescheduled_by:
          actorUserId,

        rescheduling_reason:
          normalizeRequiredText(
            input.reason,
            'Motivo do reagendamento',
            2000,
          ),

        updated_by:
          actorUserId,
      },
    )
  }

  async cancel(
    lessonId: string,

    input:
      CancelAgendaLessonInput,

    context:
      AgendaLessonActorContext,
  ): Promise<
    AgendaLesson
  > {
    const currentLesson =
      await this.getById(
        lessonId,
        context.actorUserId,
      )

    if (
      currentLesson.status ===
      'realizada'
    ) {
      throw new Error(
        'Uma aula já realizada não pode ser cancelada.',
      )
    }

    if (
      currentLesson.status ===
      'cancelada'
    ) {
      throw new Error(
        'A aula já está cancelada.',
      )
    }

    const actorUserId =
      normalizeRequiredText(
        context.actorUserId,
        'ID do usuário',
        36,
      )

    return this.repository.update(
      currentLesson.id,
      {
        status:
          'cancelada',

        cancelled_at:
          new Date()
            .toISOString(),

        cancelled_by:
          actorUserId,

        cancellation_reason:
          normalizeRequiredText(
            input.reason,
            'Motivo do cancelamento',
            2000,
          ),

        updated_by:
          actorUserId,
      },
    )
  }

  async remove(
    lessonId: string,

    input:
      DeleteAgendaLessonInput,

    context:
      AgendaLessonActorContext,
  ): Promise<void> {
    const lesson =
      await this.getById(
        lessonId,
        context.actorUserId,
      )

    await this.repository.delete(
      lesson.id,
      {
        actorUserId:
          normalizeRequiredText(
            context.actorUserId,
            'ID do usuário',
            36,
          ),

        reason:
          normalizeRequiredText(
            input.reason,
            'Motivo da exclusão',
            2000,
          ),
      },
    )
  }

  async restore(
    lessonId: string,

    input:
      RestoreAgendaLessonInput,

    context:
      AgendaLessonActorContext,
  ): Promise<
    AgendaLesson
  > {
    const normalizedLessonId =
      normalizeRequiredText(
        lessonId,
        'ID da aula',
        36,
      )

    const actorUserId =
      normalizeRequiredText(
        context.actorUserId,
        'ID do usuário',
        36,
      )

    const deletedLesson =
      await this.repository
        .findByIdIncludingDeleted(
          normalizedLessonId,
        )

    if (!deletedLesson) {
      throw new Error(
        'Aula não encontrada.',
      )
    }

    ensureLessonOwnership(
      deletedLesson,
      actorUserId,
    )

    if (
      !deletedLesson.deleted_at
    ) {
      throw new Error(
        'A aula informada não está excluída.',
      )
    }

    return this.repository.restore(
      normalizedLessonId,
      {
        actorUserId,

        reason:
          normalizeRequiredText(
            input.reason,
            'Motivo da restauração',
            2000,
          ),
      },
    )
  }
}

export const lessonsService =
  new LessonsService()