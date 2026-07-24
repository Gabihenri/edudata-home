import {
  objectivesRepository,
  type AgendaObjective,
  type AgendaObjectiveCategory,
  type AgendaObjectiveMetadata,
  type AgendaObjectiveQueryOptions,
  type AgendaObjectiveStatus,
  type CreateAgendaObjectiveInput,
  type UpdateAgendaObjectiveInput,
} from '@/lib/agenda/repository/objectives.repository'

export type CreateAgendaObjectiveServiceInput =
  Omit<
    CreateAgendaObjectiveInput,
    | 'user_id'
    | 'created_by'
    | 'updated_by'
  >

export type UpdateAgendaObjectiveServiceInput =
  Omit<
    UpdateAgendaObjectiveInput,
    | 'user_id'
    | 'organization_id'
    | 'created_by'
    | 'updated_by'
  >

export type ObjectiveServiceContext = {
  actorUserId: string

  organizationId?: string | null
  schoolId?: string | null
}

export type UpdateObjectiveServiceContext =
  ObjectiveServiceContext & {
    statusReason?: string | null
  }

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const DATE_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})$/

const OBJECTIVE_STATUSES:
  readonly AgendaObjectiveStatus[] = [
    'rascunho',
    'ativo',
    'em_acompanhamento',
    'concluido',
    'suspenso',
    'cancelado',
    'arquivado',
  ]

const DEFAULT_CATEGORIES:
  readonly AgendaObjectiveCategory[] = [
    'pedagogico',
    'engajamento',
    'gestao',
    'formacao',
    'inclusao',
    'desenvolvimento',
  ]

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
  maximumLength?: number,
  fieldName = 'Campo',
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

function normalizeRequiredId(
  value: string | null | undefined,
  fieldName: string,
): string {
  const normalizedValue =
    normalizeRequiredText(
      value,
      fieldName,
    )

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
  value: string | null | undefined,
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

function normalizeOptionalDate(
  value: string | null | undefined,
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

function normalizeStatus(
  value:
    | AgendaObjectiveStatus
    | undefined,
): AgendaObjectiveStatus {
  if (!value) {
    return 'rascunho'
  }

  if (
    !OBJECTIVE_STATUSES.includes(
      value,
    )
  ) {
    throw new Error(
      'Status do objetivo é inválido.',
    )
  }

  return value
}

function normalizeCategory(
  value:
    | AgendaObjectiveCategory
    | undefined,
): AgendaObjectiveCategory {
  if (!value) {
    return 'pedagogico'
  }

  const normalizedValue =
    normalizeRequiredText(
      value,
      'Categoria',
    )
      .toLowerCase()
      .replace(/\s+/g, '_')

  if (
    !DEFAULT_CATEGORIES.includes(
      normalizedValue,
    )
  ) {
    return normalizedValue
  }

  return normalizedValue
}

function normalizeProgress(
  value: number | undefined,
): number {
  if (value === undefined) {
    return 0
  }

  if (
    !Number.isFinite(value)
  ) {
    throw new Error(
      'O progresso deve ser um número válido.',
    )
  }

  if (
    value < 0 ||
    value > 100
  ) {
    throw new Error(
      'O progresso deve estar entre 0 e 100.',
    )
  }

  return Number(
    value.toFixed(2),
  )
}

function normalizeMetadata(
  value:
    | AgendaObjectiveMetadata
    | undefined,
): AgendaObjectiveMetadata | undefined {
  if (value === undefined) {
    return undefined
  }

  if (
    typeof value !== 'object' ||
    value === null ||
    Array.isArray(value)
  ) {
    throw new Error(
      'Os metadados do objetivo são inválidos.',
    )
  }

  return value
}

function validateDateRange(
  startDate:
    | string
    | null
    | undefined,

  endDate:
    | string
    | null
    | undefined,
): void {
  if (
    !startDate ||
    !endDate
  ) {
    return
  }

  if (
    endDate <
    startDate
  ) {
    throw new Error(
      'A data final não pode ser anterior à data inicial.',
    )
  }
}

function normalizeCreateInput(
  input:
    CreateAgendaObjectiveServiceInput,

  context:
    ObjectiveServiceContext,
): CreateAgendaObjectiveInput {
  const actorUserId =
    normalizeRequiredId(
      context.actorUserId,
      'ID do usuário responsável',
    )

  const startDate =
    normalizeOptionalDate(
      input.start_date,
      'Data inicial',
    )

  const endDate =
    normalizeOptionalDate(
      input.end_date,
      'Data final',
    )

  validateDateRange(
    startDate,
    endDate,
  )

  return {
    title:
      normalizeRequiredText(
        input.title,
        'Título do objetivo',
      ),

    description:
      normalizeOptionalText(
        input.description,
        5000,
        'Descrição',
      ),

    category:
      normalizeCategory(
        input.category,
      ),

    period:
      normalizeOptionalText(
        input.period,
        250,
        'Período',
      ),

    class_id:
      normalizeOptionalId(
        input.class_id,
        'ID da turma',
      ),

    subject:
      normalizeOptionalText(
        input.subject,
        250,
        'Componente curricular',
      ),

    responsible_user_id:
      normalizeOptionalId(
        input.responsible_user_id,
        'ID do responsável',
      ) ?? actorUserId,

    expected_indicator:
      normalizeOptionalText(
        input.expected_indicator,
        3000,
        'Indicador esperado',
      ),

    expected_evidence:
      normalizeOptionalText(
        input.expected_evidence,
        3000,
        'Evidência esperada',
      ),

    start_date:
      startDate,

    end_date:
      endDate,

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

    status:
      normalizeStatus(
        input.status,
      ),

    progress:
      normalizeProgress(
        input.progress,
      ),

    user_id:
      actorUserId,

    organization_id:
      normalizeOptionalId(
        context.organizationId,
        'ID da organização',
      ),

    school_id:
      normalizeOptionalId(
        context.schoolId ??
          input.school_id,
        'ID da escola',
      ),

    created_by:
      actorUserId,

    updated_by:
      actorUserId,

    metadata:
      normalizeMetadata(
        input.metadata,
      ),
  }
}

function normalizeUpdateInput(
  input:
    UpdateAgendaObjectiveServiceInput,

  current:
    AgendaObjective,

  context:
    UpdateObjectiveServiceContext,
): UpdateAgendaObjectiveInput {
  const actorUserId =
    normalizeRequiredId(
      context.actorUserId,
      'ID do usuário responsável',
    )

  const normalizedInput:
    UpdateAgendaObjectiveInput = {
      updated_by:
        actorUserId,
  }

  if (
    input.title !== undefined
  ) {
    normalizedInput.title =
      normalizeRequiredText(
        input.title,
        'Título do objetivo',
      )
  }

  if (
    input.description !==
    undefined
  ) {
    normalizedInput.description =
      normalizeOptionalText(
        input.description,
        5000,
        'Descrição',
      )
  }

  if (
    input.category !==
    undefined
  ) {
    normalizedInput.category =
      normalizeCategory(
        input.category,
      )
  }

  if (
    input.period !==
    undefined
  ) {
    normalizedInput.period =
      normalizeOptionalText(
        input.period,
        250,
        'Período',
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
        250,
        'Componente curricular',
      )
  }

  if (
    input.responsible_user_id !==
    undefined
  ) {
    normalizedInput.responsible_user_id =
      normalizeOptionalId(
        input.responsible_user_id,
        'ID do responsável',
      )
  }

  if (
    input.expected_indicator !==
    undefined
  ) {
    normalizedInput.expected_indicator =
      normalizeOptionalText(
        input.expected_indicator,
        3000,
        'Indicador esperado',
      )
  }

  if (
    input.expected_evidence !==
    undefined
  ) {
    normalizedInput.expected_evidence =
      normalizeOptionalText(
        input.expected_evidence,
        3000,
        'Evidência esperada',
      )
  }

  if (
    input.start_date !==
    undefined
  ) {
    normalizedInput.start_date =
      normalizeOptionalDate(
        input.start_date,
        'Data inicial',
      )
  }

  if (
    input.end_date !==
    undefined
  ) {
    normalizedInput.end_date =
      normalizeOptionalDate(
        input.end_date,
        'Data final',
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
    input.status !==
    undefined
  ) {
    normalizedInput.status =
      normalizeStatus(
        input.status,
      )
  }

  if (
    input.progress !==
    undefined
  ) {
    normalizedInput.progress =
      normalizeProgress(
        input.progress,
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

  const resultingStartDate =
    normalizedInput.start_date !==
    undefined
      ? normalizedInput.start_date
      : current.start_date

  const resultingEndDate =
    normalizedInput.end_date !==
    undefined
      ? normalizedInput.end_date
      : current.end_date

  validateDateRange(
    resultingStartDate,
    resultingEndDate,
  )

  return normalizedInput
}

function normalizeQueryOptions(
  options:
    AgendaObjectiveQueryOptions,
): AgendaObjectiveQueryOptions {
  return {
    includeDeleted:
      options.includeDeleted === true,

    userId:
      normalizeOptionalId(
        options.userId,
        'ID do usuário',
      ),

    organizationId:
      normalizeOptionalId(
        options.organizationId,
        'ID da organização',
      ),

    schoolId:
      normalizeOptionalId(
        options.schoolId,
        'ID da escola',
      ),

    classId:
      normalizeOptionalId(
        options.classId,
        'ID da turma',
      ),

    schoolYearId:
      normalizeOptionalId(
        options.schoolYearId,
        'ID do ano letivo',
      ),

    academicPeriodId:
      normalizeOptionalId(
        options.academicPeriodId,
        'ID do período acadêmico',
      ),

    responsibleUserId:
      normalizeOptionalId(
        options.responsibleUserId,
        'ID do responsável',
      ),

    category:
      options.category
        ? normalizeCategory(
            options.category,
          )
        : options.category,

    status:
      options.status
        ? normalizeStatus(
            options.status,
          )
        : options.status,

    statuses:
      options.statuses?.map(
        (status) =>
          normalizeStatus(status),
      ),

    subject:
      normalizeOptionalText(
        options.subject,
        250,
        'Componente curricular',
      ),

    period:
      normalizeOptionalText(
        options.period,
        250,
        'Período',
      ),

    search:
      normalizeOptionalText(
        options.search,
        250,
        'Busca',
      ),
  }
}

class ObjectivesService {
  async list(
    actorUserId: string,
    options:
      AgendaObjectiveQueryOptions = {},
  ): Promise<AgendaObjective[]> {
    const normalizedActorUserId =
      normalizeRequiredId(
        actorUserId,
        'ID do usuário',
      )

    const normalizedOptions =
      normalizeQueryOptions({
        ...options,

        userId:
          normalizedActorUserId,
      })

    return objectivesRepository.findAll(
      normalizedOptions,
    )
  }

  async getById(
    id: string,
    actorUserId: string,
  ): Promise<AgendaObjective> {
    const objectiveId =
      normalizeRequiredId(
        id,
        'ID do objetivo',
      )

    const normalizedActorUserId =
      normalizeRequiredId(
        actorUserId,
        'ID do usuário',
      )

    const objective =
      await objectivesRepository
        .findById(
          objectiveId,
        )

    if (!objective) {
      throw new Error(
        'Objetivo não encontrado.',
      )
    }

    if (
      objective.user_id !==
      normalizedActorUserId
    ) {
      throw new Error(
        'Você não possui acesso a este objetivo.',
      )
    }

    return objective
  }

  async create(
    input:
      CreateAgendaObjectiveServiceInput,

    context:
      ObjectiveServiceContext,
  ): Promise<AgendaObjective> {
    const normalizedInput =
      normalizeCreateInput(
        input,
        context,
      )

    return objectivesRepository.create(
      normalizedInput,
    )
  }

  async update(
    id: string,

    input:
      UpdateAgendaObjectiveServiceInput,

    context:
      UpdateObjectiveServiceContext,
  ): Promise<AgendaObjective> {
    const current =
      await this.getById(
        id,
        context.actorUserId,
      )

    const normalizedInput =
      normalizeUpdateInput(
        input,
        current,
        context,
      )

    return objectivesRepository.update(
      current.id,
      normalizedInput,
    )
  }

  async remove(
    id: string,
    actorUserId: string,
    reason: string,
  ): Promise<void> {
    const current =
      await this.getById(
        id,
        actorUserId,
      )

    const normalizedReason =
      normalizeRequiredText(
        reason,
        'Motivo da exclusão',
      )

    if (
      normalizedReason.length >
      2000
    ) {
      throw new Error(
        'Motivo da exclusão não pode ultrapassar 2000 caracteres.',
      )
    }

    await objectivesRepository.delete(
      current.id,
      actorUserId,
      normalizedReason,
    )
  }

  async restore(
    id: string,
    actorUserId: string,
    reason: string,
  ): Promise<AgendaObjective> {
    const objectiveId =
      normalizeRequiredId(
        id,
        'ID do objetivo',
      )

    const normalizedActorUserId =
      normalizeRequiredId(
        actorUserId,
        'ID do usuário',
      )

    const normalizedReason =
      normalizeRequiredText(
        reason,
        'Motivo da restauração',
      )

    if (
      normalizedReason.length >
      2000
    ) {
      throw new Error(
        'Motivo da restauração não pode ultrapassar 2000 caracteres.',
      )
    }

    const objective =
      await objectivesRepository
        .findByIdIncludingDeleted(
          objectiveId,
        )

    if (!objective) {
      throw new Error(
        'Objetivo não encontrado.',
      )
    }

    if (
      objective.user_id !==
      normalizedActorUserId
    ) {
      throw new Error(
        'Você não possui acesso a este objetivo.',
      )
    }

    if (!objective.deleted_at) {
      throw new Error(
        'O objetivo não está excluído.',
      )
    }

    return objectivesRepository.restore(
      objectiveId,
      normalizedActorUserId,
      normalizedReason,
    )
  }

  async updateProgress(
    id: string,
    progress: number,
    actorUserId: string,
  ): Promise<AgendaObjective> {
    return this.update(
      id,
      {
        progress:
          normalizeProgress(
            progress,
          ),
      },
      {
        actorUserId,
      },
    )
  }

  async changeStatus(
    id: string,
    status: AgendaObjectiveStatus,
    actorUserId: string,
  ): Promise<AgendaObjective> {
    return this.update(
      id,
      {
        status:
          normalizeStatus(
            status,
          ),
      },
      {
        actorUserId,
      },
    )
  }
}

export const objectivesService =
  new ObjectivesService()
