import {
  PlanningRepository,
  planningRepository,
  type AgendaPlanning,
  type AgendaPlanningMetadata,
  type AgendaPlanningQueryOptions,
  type AgendaPlanningStatus,
  type AgendaPlanningVersion,
  type CreateAgendaPlanningInput,
  type UpdateAgendaPlanningInput,
} from '@/lib/agenda/repository/planning.repository'

export type DuplicateAgendaPlanningInput = {
  title?: string
  planned_date?: string | null
}

type FindPlanningOptions = {
  includeDeleted?: boolean
}

const PLANNING_STATUSES:
  readonly AgendaPlanningStatus[] = [
    'rascunho',
    'em_revisao',
    'em revisão',
    'aprovado',
    'programado',
    'executado',
    'arquivado',

    // Compatibilidade com registros legados.
    'planejado',
    'concluido',
    'concluído',
  ]

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const DATE_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})$/

const TIME_PATTERN =
  /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/

function normalizeRequiredId(
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

  if (
    !UUID_PATTERN.test(
      normalizedValue,
    )
  ) {
    throw new Error(
      `${fieldName} é inválido.`,
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
    !UUID_PATTERN.test(
      normalizedValue,
    )
  ) {
    throw new Error(
      `${fieldName} é inválido.`,
    )
  }

  return normalizedValue
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

  return value.trim() ||
    null
}

function normalizeRequiredReason(
  value: string | undefined,
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

function normalizePlanningStatus(
  value:
    | AgendaPlanningStatus
    | undefined,
): AgendaPlanningStatus {
  if (!value) {
    return 'rascunho'
  }

  const normalizedValue =
    value.trim() as
      AgendaPlanningStatus

  if (
    !PLANNING_STATUSES.includes(
      normalizedValue,
    )
  ) {
    throw new Error(
      'Status do planejamento é inválido.',
    )
  }

  return normalizedValue
}

function normalizeOptionalDate(
  value:
    | string
    | null
    | undefined,
  fieldName: string,
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

  const match =
    normalizedValue.match(
      DATE_PATTERN,
    )

  if (!match) {
    throw new Error(
      `${fieldName} é inválida.`,
    )
  }

  const year =
    Number(match[1])

  const month =
    Number(match[2])

  const day =
    Number(match[3])

  const parsedDate =
    new Date(
      Date.UTC(
        year,
        month - 1,
        day,
      ),
    )

  if (
    parsedDate.getUTCFullYear() !==
      year ||
    parsedDate.getUTCMonth() !==
      month - 1 ||
    parsedDate.getUTCDate() !==
      day
  ) {
    throw new Error(
      `${fieldName} é inválida.`,
    )
  }

  return normalizedValue
}

function normalizeOptionalTime(
  value:
    | string
    | null
    | undefined,
  fieldName: string,
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

  const match =
    normalizedValue.match(
      TIME_PATTERN,
    )

  if (!match) {
    throw new Error(
      `${fieldName} é inválido.`,
    )
  }

  const hours =
    match[1]

  const minutes =
    match[2]

  const seconds =
    match[3] ?? '00'

  return `${hours}:${minutes}:${seconds}`
}

function normalizeOptionalPositiveInteger(
  value:
    | number
    | null
    | undefined,
  fieldName: string,
): number | null | undefined {
  if (value === undefined) {
    return undefined
  }

  if (value === null) {
    return null
  }

  if (
    !Number.isInteger(value) ||
    value <= 0
  ) {
    throw new Error(
      `${fieldName} deve ser um número inteiro maior que zero.`,
    )
  }

  return value
}

function normalizeMetadata(
  value:
    | AgendaPlanningMetadata
    | undefined,
): AgendaPlanningMetadata | undefined {
  if (value === undefined) {
    return undefined
  }

  if (
    typeof value !== 'object' ||
    value === null ||
    Array.isArray(value)
  ) {
    throw new Error(
      'Os metadados do planejamento são inválidos.',
    )
  }

  return value
}

function validateTimeRange(
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
    startTime &&
    endTime &&
    endTime <= startTime
  ) {
    throw new Error(
      'O horário final deve ser posterior ao horário inicial.',
    )
  }
}

function validateTemplate(
  isTemplate:
    | boolean
    | undefined,
  templateName:
    | string
    | null
    | undefined,
): void {
  if (
    isTemplate === true &&
    !templateName
  ) {
    throw new Error(
      'O nome do modelo é obrigatório.',
    )
  }
}

function normalizeCreateInput(
  input:
    CreateAgendaPlanningInput,
): CreateAgendaPlanningInput {
  const normalizedInput:
    CreateAgendaPlanningInput = {
      ...input,

      title:
        normalizeRequiredText(
          input.title,
          'Título do planejamento',
        ),

      description:
        normalizeOptionalText(
          input.description,
        ),

      subject:
        normalizeOptionalText(
          input.subject,
        ),

      class_name:
        normalizeOptionalText(
          input.class_name,
        ),

      objective:
        normalizeOptionalText(
          input.objective,
        ),

      methodology:
        normalizeOptionalText(
          input.methodology,
        ),

      resources:
        normalizeOptionalText(
          input.resources,
        ),

      evaluation:
        normalizeOptionalText(
          input.evaluation,
        ),

      planned_date:
        normalizeOptionalDate(
          input.planned_date,
          'Data do planejamento',
        ),

      planned_start_time:
        normalizeOptionalTime(
          input.planned_start_time,
          'Horário inicial',
        ),

      planned_end_time:
        normalizeOptionalTime(
          input.planned_end_time,
          'Horário final',
        ),

      duration_minutes:
        normalizeOptionalPositiveInteger(
          input.duration_minutes,
          'Duração',
        ),

      status:
        normalizePlanningStatus(
          input.status,
        ),

      class_id:
        normalizeOptionalId(
          input.class_id,
          'ID da turma',
        ),

      school_year_id:
        normalizeOptionalId(
          input.school_year_id,
          'ID do ano letivo',
        ),

      academic_period_id:
        normalizeOptionalId(
          input.academic_period_id,
          'ID do período acadêmico',
        ),

      source_planning_id:
        normalizeOptionalId(
          input.source_planning_id,
          'ID do planejamento de origem',
        ),

      is_template:
        input.is_template ??
        false,

      template_name:
        normalizeOptionalText(
          input.template_name,
        ),

      status_change_reason:
        normalizeOptionalText(
          input.status_change_reason,
        ),

      archive_reason:
        normalizeOptionalText(
          input.archive_reason,
        ),

      school_id:
        normalizeOptionalId(
          input.school_id,
          'ID da escola',
        ),

      organization_id:
        normalizeOptionalId(
          input.organization_id,
          'ID da organização',
        ),

      user_id:
        normalizeOptionalId(
          input.user_id,
          'ID do usuário',
        ),

      created_by:
        normalizeOptionalId(
          input.created_by,
          'ID do criador',
        ),

      updated_by:
        normalizeOptionalId(
          input.updated_by,
          'ID do responsável pela atualização',
        ),

      metadata:
        normalizeMetadata(
          input.metadata,
        ),
    }

  validateTimeRange(
    normalizedInput
      .planned_start_time,

    normalizedInput
      .planned_end_time,
  )

  validateTemplate(
    normalizedInput
      .is_template,

    normalizedInput
      .template_name,
  )

  return normalizedInput
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
    input.description !==
    undefined
  ) {
    normalizedInput.description =
      normalizeOptionalText(
        input.description,
      )
  }

  if (
    input.subject !==
    undefined
  ) {
    normalizedInput.subject =
      normalizeOptionalText(
        input.subject,
      )
  }

  if (
    input.class_name !==
    undefined
  ) {
    normalizedInput.class_name =
      normalizeOptionalText(
        input.class_name,
      )
  }

  if (
    input.objective !==
    undefined
  ) {
    normalizedInput.objective =
      normalizeOptionalText(
        input.objective,
      )
  }

  if (
    input.methodology !==
    undefined
  ) {
    normalizedInput.methodology =
      normalizeOptionalText(
        input.methodology,
      )
  }

  if (
    input.resources !==
    undefined
  ) {
    normalizedInput.resources =
      normalizeOptionalText(
        input.resources,
      )
  }

  if (
    input.evaluation !==
    undefined
  ) {
    normalizedInput.evaluation =
      normalizeOptionalText(
        input.evaluation,
      )
  }

  if (
    input.planned_date !==
    undefined
  ) {
    normalizedInput.planned_date =
      normalizeOptionalDate(
        input.planned_date,
        'Data do planejamento',
      )
  }

  if (
    input.planned_start_time !==
    undefined
  ) {
    normalizedInput.planned_start_time =
      normalizeOptionalTime(
        input.planned_start_time,
        'Horário inicial',
      )
  }

  if (
    input.planned_end_time !==
    undefined
  ) {
    normalizedInput.planned_end_time =
      normalizeOptionalTime(
        input.planned_end_time,
        'Horário final',
      )
  }

  if (
    input.duration_minutes !==
    undefined
  ) {
    normalizedInput.duration_minutes =
      normalizeOptionalPositiveInteger(
        input.duration_minutes,
        'Duração',
      )
  }

  if (
    input.status !==
    undefined
  ) {
    normalizedInput.status =
      normalizePlanningStatus(
        input.status,
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
    input.school_year_id !==
    undefined
  ) {
    normalizedInput.school_year_id =
      normalizeOptionalId(
        input.school_year_id,
        'ID do ano letivo',
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
    input.source_planning_id !==
    undefined
  ) {
    normalizedInput.source_planning_id =
      normalizeOptionalId(
        input.source_planning_id,
        'ID do planejamento de origem',
      )
  }

  if (
    input.template_name !==
    undefined
  ) {
    normalizedInput.template_name =
      normalizeOptionalText(
        input.template_name,
      )
  }

  if (
    input.status_change_reason !==
    undefined
  ) {
    normalizedInput.status_change_reason =
      normalizeOptionalText(
        input.status_change_reason,
      )
  }

  if (
    input.archive_reason !==
    undefined
  ) {
    normalizedInput.archive_reason =
      normalizeOptionalText(
        input.archive_reason,
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
    input.user_id !==
    undefined
  ) {
    normalizedInput.user_id =
      normalizeOptionalId(
        input.user_id,
        'ID do usuário',
      )
  }

  if (
    input.created_by !==
    undefined
  ) {
    normalizedInput.created_by =
      normalizeOptionalId(
        input.created_by,
        'ID do criador',
      )
  }

  if (
    input.updated_by !==
    undefined
  ) {
    normalizedInput.updated_by =
      normalizeOptionalId(
        input.updated_by,
        'ID do responsável pela atualização',
      )
  }

  if (
    input.status_changed_by !==
    undefined
  ) {
    normalizedInput.status_changed_by =
      normalizeOptionalId(
        input.status_changed_by,
        'ID do responsável pela mudança de status',
      )
  }

  if (
    input.reviewed_by !==
    undefined
  ) {
    normalizedInput.reviewed_by =
      normalizeOptionalId(
        input.reviewed_by,
        'ID do revisor',
      )
  }

  if (
    input.approved_by !==
    undefined
  ) {
    normalizedInput.approved_by =
      normalizeOptionalId(
        input.approved_by,
        'ID do aprovador',
      )
  }

  if (
    input.archived_by !==
    undefined
  ) {
    normalizedInput.archived_by =
      normalizeOptionalId(
        input.archived_by,
        'ID do responsável pelo arquivamento',
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

function removeProtectedCreateFields(
  input:
    CreateAgendaPlanningInput,
): CreateAgendaPlanningInput {
  const protectedInput = {
    ...input,
  }

  delete protectedInput
    .organization_id

  delete protectedInput
    .created_by

  delete protectedInput
    .updated_by

  delete protectedInput
    .status_changed_at

  delete protectedInput
    .status_changed_by

  delete protectedInput
    .status_change_reason

  delete protectedInput
    .reviewed_at

  delete protectedInput
    .reviewed_by

  delete protectedInput
    .approved_at

  delete protectedInput
    .approved_by

  delete protectedInput
    .archived_at

  delete protectedInput
    .archived_by

  delete protectedInput
    .archive_reason

  return protectedInput
}

function removeProtectedUpdateFields(
  input:
    UpdateAgendaPlanningInput,
): UpdateAgendaPlanningInput {
  const protectedInput = {
    ...input,
  }

  delete protectedInput
    .user_id

  delete protectedInput
    .organization_id

  delete protectedInput
    .created_by

  delete protectedInput
    .updated_by

  delete protectedInput
    .source_planning_id

  delete protectedInput
    .status_changed_at

  delete protectedInput
    .status_changed_by

  delete protectedInput
    .reviewed_at

  delete protectedInput
    .reviewed_by

  delete protectedInput
    .approved_at

  delete protectedInput
    .approved_by

  delete protectedInput
    .archived_at

  delete protectedInput
    .archived_by

  return protectedInput
}

function validateMergedPlanning(
  current:
    AgendaPlanning,

  input:
    UpdateAgendaPlanningInput,
): void {
  const startTime =
    input.planned_start_time !==
    undefined
      ? input.planned_start_time
      : current.planned_start_time

  const endTime =
    input.planned_end_time !==
    undefined
      ? input.planned_end_time
      : current.planned_end_time

  const isTemplate =
    input.is_template !==
    undefined
      ? input.is_template
      : current.is_template

  const templateName =
    input.template_name !==
    undefined
      ? input.template_name
      : current.template_name

  validateTimeRange(
    startTime,
    endTime,
  )

  validateTemplate(
    isTemplate,
    templateName,
  )
}

function applyStatusLifecycle(
  current:
    AgendaPlanning,

  input:
    UpdateAgendaPlanningInput,

  actorUserId: string,

  statusReason:
    | string
    | null
    | undefined,
): UpdateAgendaPlanningInput {
  if (
    input.status ===
      undefined ||
    input.status ===
      current.status
  ) {
    return input
  }

  const now =
    new Date()
      .toISOString()

  const lifecycleInput:
    UpdateAgendaPlanningInput = {
      ...input,

      status_changed_at:
        now,

      status_changed_by:
        actorUserId,

      status_change_reason:
        statusReason ??
        null,
  }

  if (
    input.status ===
    'aprovado'
  ) {
    lifecycleInput.approved_at =
      now

    lifecycleInput.approved_by =
      actorUserId
  }

  if (
    input.status ===
    'arquivado'
  ) {
    const archiveReason =
      normalizeRequiredReason(
        statusReason ??
          undefined,

        'Motivo do arquivamento',
      )

    lifecycleInput.archived_at =
      now

    lifecycleInput.archived_by =
      actorUserId

    lifecycleInput.archive_reason =
      archiveReason
  } else if (
    current.status ===
    'arquivado'
  ) {
    lifecycleInput.archived_at =
      null

    lifecycleInput.archived_by =
      null

    lifecycleInput.archive_reason =
      null
  }

  return lifecycleInput
}

export class PlanningService {
  constructor(
    private readonly repository:
      PlanningRepository =
        planningRepository,
  ) {}

  async listAll(
    options:
      AgendaPlanningQueryOptions = {},
  ): Promise<
    AgendaPlanning[]
  > {
    return this.repository
      .findAll(
        options,
      )
  }

  async listByUserId(
    userId: string,

    options:
      AgendaPlanningQueryOptions = {},
  ): Promise<
    AgendaPlanning[]
  > {
    const normalizedUserId =
      normalizeRequiredId(
        userId,
        'ID do usuário',
      )

    return this.repository
      .findByUserId(
        normalizedUserId,
        options,
      )
  }

  async getById(
    id: string,

    options:
      FindPlanningOptions = {},
  ): Promise<
    AgendaPlanning
  > {
    const normalizedId =
      normalizeRequiredId(
        id,
        'ID do planejamento',
      )

    const planning =
      await this.repository
        .findById(
          normalizedId,
          options,
        )

    if (!planning) {
      throw new Error(
        'Planejamento não encontrado.',
      )
    }

    return planning
  }

  async getOwnedById(
    id: string,
    userId: string,

    options:
      FindPlanningOptions = {},
  ): Promise<
    AgendaPlanning
  > {
    const normalizedId =
      normalizeRequiredId(
        id,
        'ID do planejamento',
      )

    const normalizedUserId =
      normalizeRequiredId(
        userId,
        'ID do usuário',
      )

    const planning =
      await this.repository
        .findOwnedById(
          normalizedId,
          normalizedUserId,
          options,
        )

    if (!planning) {
      throw new Error(
        'Planejamento não encontrado ou sem permissão de acesso.',
      )
    }

    return planning
  }

  async create(
    input:
      CreateAgendaPlanningInput,
  ): Promise<
    AgendaPlanning
  > {
    return this.repository
      .create(
        normalizeCreateInput(
          input,
        ),
      )
  }

  async createOwned(
    userId: string,

    input:
      CreateAgendaPlanningInput,
  ): Promise<
    AgendaPlanning
  > {
    const normalizedUserId =
      normalizeRequiredId(
        userId,
        'ID do usuário',
      )

    const protectedInput =
      removeProtectedCreateFields({
        ...input,

        user_id:
          normalizedUserId,
      })

    return this.repository
      .create(
        normalizeCreateInput(
          protectedInput,
        ),
      )
  }

  async update(
    id: string,

    input:
      UpdateAgendaPlanningInput,
  ): Promise<
    AgendaPlanning
  > {
    const currentPlanning =
      await this.getById(
        id,
      )

    const normalizedInput =
      normalizeUpdateInput(
        input,
      )

    validateMergedPlanning(
      currentPlanning,
      normalizedInput,
    )

    return this.repository
      .update(
        currentPlanning.id,
        normalizedInput,
      )
  }

  async updateOwned(
    id: string,
    userId: string,

    input:
      UpdateAgendaPlanningInput,
  ): Promise<
    AgendaPlanning
  > {
    const normalizedUserId =
      normalizeRequiredId(
        userId,
        'ID do usuário',
      )

    const currentPlanning =
      await this.getOwnedById(
        id,
        normalizedUserId,
      )

    const normalizedInput =
      normalizeUpdateInput(
        input,
      )

    const requestedStatusReason =
      normalizedInput
        .archive_reason ??
      normalizedInput
        .status_change_reason

    let protectedInput =
      removeProtectedUpdateFields(
        normalizedInput,
      )

    protectedInput =
      applyStatusLifecycle(
        currentPlanning,
        protectedInput,
        normalizedUserId,
        requestedStatusReason,
      )

    if (
      Object.keys(
        protectedInput,
      ).length === 0
    ) {
      throw new Error(
        'Informe ao menos um campo para atualização.',
      )
    }

    validateMergedPlanning(
      currentPlanning,
      protectedInput,
    )

    const updatedPlanning =
      await this.repository
        .updateOwned(
          currentPlanning.id,
          normalizedUserId,
          protectedInput,
        )

    if (!updatedPlanning) {
      throw new Error(
        'Planejamento não encontrado ou sem permissão de alteração.',
      )
    }

    return updatedPlanning
  }

  async duplicateOwned(
    id: string,
    userId: string,

    input:
      DuplicateAgendaPlanningInput = {},
  ): Promise<
    AgendaPlanning
  > {
    const normalizedUserId =
      normalizeRequiredId(
        userId,
        'ID do usuário',
      )

    const sourcePlanning =
      await this.getOwnedById(
        id,
        normalizedUserId,
      )

    const requestedTitle =
      normalizeOptionalText(
        input.title,
      )

    const requestedDate =
      input.planned_date !==
      undefined
        ? normalizeOptionalDate(
            input.planned_date,
            'Data do planejamento',
          )
        : sourcePlanning
            .planned_date

    const duplicateInput:
      CreateAgendaPlanningInput = {
        title:
          requestedTitle ??
          `Cópia de ${sourcePlanning.title}`,

        description:
          sourcePlanning
            .description,

        subject:
          sourcePlanning
            .subject,

        class_name:
          sourcePlanning
            .class_name,

        objective:
          sourcePlanning
            .objective,

        methodology:
          sourcePlanning
            .methodology,

        resources:
          sourcePlanning
            .resources,

        evaluation:
          sourcePlanning
            .evaluation,

        planned_date:
          requestedDate,

        planned_start_time:
          sourcePlanning
            .planned_start_time,

        planned_end_time:
          sourcePlanning
            .planned_end_time,

        duration_minutes:
          sourcePlanning
            .duration_minutes,

        status:
          'rascunho',

        class_id:
          sourcePlanning
            .class_id,

        school_year_id:
          sourcePlanning
            .school_year_id,

        academic_period_id:
          sourcePlanning
            .academic_period_id,

        source_planning_id:
          sourcePlanning.id,

        is_template:
          false,

        template_name:
          null,

        school_id:
          sourcePlanning
            .school_id,

        user_id:
          normalizedUserId,

        metadata: {
          ...sourcePlanning
            .metadata,

          duplicated_from:
            sourcePlanning.id,

          duplicated_at:
            new Date()
              .toISOString(),
        },
      }

    return this.repository
      .create(
        normalizeCreateInput(
          duplicateInput,
        ),
      )
  }

  async archiveOwned(
    id: string,
    userId: string,
    reason: string,
  ): Promise<
    AgendaPlanning
  > {
    const normalizedReason =
      normalizeRequiredReason(
        reason,
        'Motivo do arquivamento',
      )

    return this.updateOwned(
      id,
      userId,
      {
        status:
          'arquivado',

        status_change_reason:
          normalizedReason,

        archive_reason:
          normalizedReason,
      },
    )
  }

  async softDeleteOwned(
    id: string,
    userId: string,
    reason: string,
  ): Promise<
    AgendaPlanning
  > {
    const normalizedUserId =
      normalizeRequiredId(
        userId,
        'ID do usuário',
      )

    const normalizedReason =
      normalizeRequiredReason(
        reason,
        'Motivo da exclusão',
      )

    const currentPlanning =
      await this.getOwnedById(
        id,
        normalizedUserId,
      )

    return this.repository
      .softDelete(
        currentPlanning.id,
        normalizedReason,
        normalizedUserId,
      )
  }

  async restoreOwned(
    id: string,
    userId: string,
    reason: string,
  ): Promise<
    AgendaPlanning
  > {
    const normalizedUserId =
      normalizeRequiredId(
        userId,
        'ID do usuário',
      )

    const normalizedReason =
      normalizeRequiredReason(
        reason,
        'Motivo da restauração',
      )

    const deletedPlanning =
      await this.getOwnedById(
        id,
        normalizedUserId,
        {
          includeDeleted:
            true,
        },
      )

    if (
      deletedPlanning
        .deleted_at ===
      null
    ) {
      throw new Error(
        'O planejamento não está excluído.',
      )
    }

    return this.repository
      .restore(
        deletedPlanning.id,
        normalizedReason,
        normalizedUserId,
      )
  }

  async listVersionsOwned(
    id: string,
    userId: string,
  ): Promise<
    AgendaPlanningVersion[]
  > {
    const planning =
      await this.getOwnedById(
        id,
        userId,
        {
          includeDeleted:
            true,
        },
      )

    return this.repository
      .findVersions(
        planning.id,
      )
  }

  /**
   * Exclusão física desativada.
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
   */
  async deleteOwned(
    _id: string,
    _userId: string,
  ): Promise<void> {
    throw new Error(
      'Exclusão física bloqueada. Utilize a exclusão lógica com justificativa.',
    )
  }
}

/**
 * Compatibilidade com as rotas existentes.
 *
 * As novas rotas devem criar um PlanningRepository
 * com cliente autenticado e injetá-lo em PlanningService.
 */
export const planningService =
  new PlanningService(
    planningRepository,
  )