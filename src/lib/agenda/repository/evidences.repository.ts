import {
  createClient,
  type SupabaseClient,
} from '@supabase/supabase-js'

export type AgendaEvidenceType =
  | 'texto'
  | 'imagem'
  | 'pdf'
  | 'link'

export type AgendaEvidenceMetadata =
  Record<string, unknown>

export type AgendaEvidence = {
  id: string

  title: string
  description: string | null

  evidence_type:
    AgendaEvidenceType

  /*
   * Mantido para compatibilidade com evidências antigas
   * que utilizam URL pública.
   *
   * Novos arquivos devem utilizar:
   *
   * storage_bucket
   * storage_path
   */
  file_url: string | null
  external_url: string | null

  /*
   * Contexto pedagógico.
   */
  planning_id: string | null
  event_id: string | null

  lesson_id: string | null
  objective_id: string | null
  class_id: string | null

  reflection_id: string | null
  academic_period_id: string | null

  organization_id: string | null
  school_id: string | null
  user_id: string | null

  /*
   * Política institucional de proteção de crianças
   * e adolescentes.
   *
   * Estes campos não devem ser removidos, flexibilizados
   * ou ignorados.
   */
  contains_identifiable_minor:
    boolean

  guardian_authorization_confirmed:
    boolean

  authorization_reference:
    string | null

  authorization_confirmed_at:
    string | null

  authorization_confirmed_by:
    string | null

  privacy_notice_version:
    string

  /*
   * Referências utilizadas pelo armazenamento privado.
   */
  storage_bucket: string | null
  storage_path: string | null

  original_file_name: string | null
  file_mime_type: string | null
  file_size_bytes: number | null

  /*
   * Metadados de integração do EIOS.
   *
   * Exemplos:
   *
   * source
   * inheritedObjectiveIds
   * inheritedFromLesson
   * lessonStatus
   * subject
   */
  metadata:
    AgendaEvidenceMetadata

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

  evidence_type?:
    AgendaEvidenceType

  file_url?: string | null
  external_url?: string | null

  planning_id?: string | null
  event_id?: string | null

  lesson_id?: string | null
  objective_id?: string | null
  class_id?: string | null

  reflection_id?: string | null
  academic_period_id?: string | null

  organization_id?: string | null
  school_id?: string | null
  user_id?: string | null

  /*
   * Política de proteção de crianças e adolescentes.
   */
  contains_identifiable_minor?:
    boolean

  guardian_authorization_confirmed?:
    boolean

  authorization_reference?:
    string | null

  authorization_confirmed_at?:
    string | null

  authorization_confirmed_by?:
    string | null

  privacy_notice_version?:
    string

  storage_bucket?: string | null
  storage_path?: string | null

  original_file_name?: string | null
  file_mime_type?: string | null
  file_size_bytes?: number | null

  metadata?:
    AgendaEvidenceMetadata

  created_by?: string | null
  updated_by?: string | null
}

export type UpdateAgendaEvidenceInput =
  Partial<CreateAgendaEvidenceInput>

export type AgendaEvidenceQueryOptions = {
  includeDeleted?: boolean

  userId?: string | null
  organizationId?: string | null
  schoolId?: string | null

  planningId?: string | null
  eventId?: string | null

  lessonId?: string | null
  objectiveId?: string | null
  classId?: string | null

  reflectionId?: string | null
  academicPeriodId?: string | null

  evidenceType?:
    AgendaEvidenceType | null

  containsIdentifiableMinor?:
    boolean | null

  search?: string | null
}

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

function normalizeDeletionContext(
  actorUserId?: string,
  reason?: string,
): DeleteAgendaEvidenceContext {
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
): RestoreAgendaEvidenceContext {
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

function buildCreatePayload(
  input:
    CreateAgendaEvidenceInput,
) {
  return {
    title:
      input.title,

    description:
      input.description ??
      null,

    evidence_type:
      input.evidence_type ??
      'texto',

    file_url:
      input.file_url ??
      null,

    external_url:
      input.external_url ??
      null,

    planning_id:
      input.planning_id ??
      null,

    event_id:
      input.event_id ??
      null,

    lesson_id:
      input.lesson_id ??
      null,

    objective_id:
      input.objective_id ??
      null,

    class_id:
      input.class_id ??
      null,

    reflection_id:
      input.reflection_id ??
      null,

    academic_period_id:
      input.academic_period_id ??
      null,

    organization_id:
      input.organization_id ??
      null,

    school_id:
      input.school_id ??
      null,

    user_id:
      input.user_id ??
      null,

    /*
     * Política ECA Digital preservada.
     */
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
      input.storage_bucket ??
      null,

    storage_path:
      input.storage_path ??
      null,

    original_file_name:
      input.original_file_name ??
      null,

    file_mime_type:
      input.file_mime_type ??
      null,

    file_size_bytes:
      input.file_size_bytes ??
      null,

    metadata:
      input.metadata ??
      {},

    created_by:
      input.created_by ??
      null,

    updated_by:
      input.updated_by ??
      null,
  }
}

function assignIfDefined(
  payload:
    Record<string, unknown>,

  key: string,
  value: unknown,
): void {
  if (value !== undefined) {
    payload[key] =
      value
  }
}

function buildUpdatePayload(
  input:
    UpdateAgendaEvidenceInput,
): Record<string, unknown> {
  const payload:
    Record<string, unknown> = {
      updated_at:
        new Date()
          .toISOString(),
  }

  assignIfDefined(
    payload,
    'title',
    input.title,
  )

  assignIfDefined(
    payload,
    'description',
    normalizeOptionalText(
      input.description,
    ),
  )

  assignIfDefined(
    payload,
    'evidence_type',
    input.evidence_type,
  )

  assignIfDefined(
    payload,
    'file_url',
    normalizeOptionalText(
      input.file_url,
    ),
  )

  assignIfDefined(
    payload,
    'external_url',
    normalizeOptionalText(
      input.external_url,
    ),
  )

  assignIfDefined(
    payload,
    'planning_id',
    normalizeOptionalId(
      input.planning_id,
    ),
  )

  assignIfDefined(
    payload,
    'event_id',
    normalizeOptionalId(
      input.event_id,
    ),
  )

  assignIfDefined(
    payload,
    'lesson_id',
    normalizeOptionalId(
      input.lesson_id,
    ),
  )

  assignIfDefined(
    payload,
    'objective_id',
    normalizeOptionalId(
      input.objective_id,
    ),
  )

  assignIfDefined(
    payload,
    'class_id',
    normalizeOptionalId(
      input.class_id,
    ),
  )

  assignIfDefined(
    payload,
    'reflection_id',
    normalizeOptionalId(
      input.reflection_id,
    ),
  )

  assignIfDefined(
    payload,
    'academic_period_id',
    normalizeOptionalId(
      input.academic_period_id,
    ),
  )

  assignIfDefined(
    payload,
    'organization_id',
    normalizeOptionalId(
      input.organization_id,
    ),
  )

  assignIfDefined(
    payload,
    'school_id',
    normalizeOptionalId(
      input.school_id,
    ),
  )

  assignIfDefined(
    payload,
    'user_id',
    normalizeOptionalId(
      input.user_id,
    ),
  )

  /*
   * Política ECA Digital preservada.
   */
  assignIfDefined(
    payload,
    'contains_identifiable_minor',
    input.contains_identifiable_minor,
  )

  assignIfDefined(
    payload,
    'guardian_authorization_confirmed',
    input.guardian_authorization_confirmed,
  )

  assignIfDefined(
    payload,
    'authorization_reference',
    normalizeOptionalText(
      input.authorization_reference,
    ),
  )

  assignIfDefined(
    payload,
    'authorization_confirmed_at',
    input.authorization_confirmed_at,
  )

  assignIfDefined(
    payload,
    'authorization_confirmed_by',
    normalizeOptionalId(
      input.authorization_confirmed_by,
    ),
  )

  assignIfDefined(
    payload,
    'privacy_notice_version',
    input.privacy_notice_version,
  )

  assignIfDefined(
    payload,
    'storage_bucket',
    normalizeOptionalText(
      input.storage_bucket,
    ),
  )

  assignIfDefined(
    payload,
    'storage_path',
    normalizeOptionalText(
      input.storage_path,
    ),
  )

  assignIfDefined(
    payload,
    'original_file_name',
    normalizeOptionalText(
      input.original_file_name,
    ),
  )

  assignIfDefined(
    payload,
    'file_mime_type',
    normalizeOptionalText(
      input.file_mime_type,
    ),
  )

  assignIfDefined(
    payload,
    'file_size_bytes',
    input.file_size_bytes,
  )

  assignIfDefined(
    payload,
    'metadata',
    input.metadata,
  )

  assignIfDefined(
    payload,
    'created_by',
    normalizeOptionalId(
      input.created_by,
    ),
  )

  assignIfDefined(
    payload,
    'updated_by',
    normalizeOptionalId(
      input.updated_by,
    ),
  )

  return payload
}

export class EvidencesRepository {
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
     * As APIs do usuário deverão injetar um cliente
     * autenticado, preservando as políticas RLS.
     *
     * O fallback permanece temporariamente para manter
     * compatibilidade com fluxos internos existentes
     * enquanto a API oficial é atualizada.
     */
    return (
      this.injectedClient ??
      createLegacyServerClient()
    )
  }

  async findAll(
    options:
      AgendaEvidenceQueryOptions = {},
  ): Promise<
    AgendaEvidence[]
  > {
    let query =
      this.client
        .from(
          'agenda_evidences',
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

    if (options.userId) {
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

    if (options.schoolId) {
      query =
        query.eq(
          'school_id',
          options.schoolId,
        )
    }

    if (options.planningId) {
      query =
        query.eq(
          'planning_id',
          options.planningId,
        )
    }

    if (options.eventId) {
      query =
        query.eq(
          'event_id',
          options.eventId,
        )
    }

    if (options.lessonId) {
      query =
        query.eq(
          'lesson_id',
          options.lessonId,
        )
    }

    if (options.objectiveId) {
      query =
        query.eq(
          'objective_id',
          options.objectiveId,
        )
    }

    if (options.classId) {
      query =
        query.eq(
          'class_id',
          options.classId,
        )
    }

    if (options.reflectionId) {
      query =
        query.eq(
          'reflection_id',
          options.reflectionId,
        )
    }

    if (
      options.academicPeriodId
    ) {
      query =
        query.eq(
          'academic_period_id',
          options.academicPeriodId,
        )
    }

    if (options.evidenceType) {
      query =
        query.eq(
          'evidence_type',
          options.evidenceType,
        )
    }

    if (
      typeof
        options.containsIdentifiableMinor ===
      'boolean'
    ) {
      query =
        query.eq(
          'contains_identifiable_minor',
          options.containsIdentifiableMinor,
        )
    }

    const normalizedSearch =
      options.search
        ?.trim()

    if (normalizedSearch) {
      const escapedSearch =
        normalizedSearch
          .replaceAll(',', ' ')
          .replaceAll('%', '')

      query =
        query.or(
          [
            `title.ilike.%${escapedSearch}%`,
            `description.ilike.%${escapedSearch}%`,
          ].join(','),
        )
    }

    const {
      data,
      error,
    } =
      await query.order(
        'created_at',
        {
          ascending:
            false,
        },
      )

    if (error) {
      throw new Error(
        `Erro ao listar evidências: ${error.message}`,
      )
    }

    return (
      data ??
      []
    ) as AgendaEvidence[]
  }

  async findById(
    id: string,
  ): Promise<
    AgendaEvidence | null
  > {
    const evidenceId =
      normalizeRequiredText(
        id,
        'ID da evidência',
      )

    const {
      data,
      error,
    } =
      await this.client
        .from(
          'agenda_evidences',
        )
        .select('*')
        .eq(
          'id',
          evidenceId,
        )
        .is(
          'deleted_at',
          null,
        )
        .maybeSingle()

    if (error) {
      throw new Error(
        `Erro ao buscar evidência: ${error.message}`,
      )
    }

    return data as
      AgendaEvidence |
      null
  }

  async findByIdIncludingDeleted(
    id: string,
  ): Promise<
    AgendaEvidence | null
  > {
    const evidenceId =
      normalizeRequiredText(
        id,
        'ID da evidência',
      )

    const {
      data,
      error,
    } =
      await this.client
        .from(
          'agenda_evidences',
        )
        .select('*')
        .eq(
          'id',
          evidenceId,
        )
        .maybeSingle()

    if (error) {
      throw new Error(
        `Erro ao buscar evidência incluindo registros excluídos: ${error.message}`,
      )
    }

    return data as
      AgendaEvidence |
      null
  }

  async findByUserId(
    userId: string,
  ): Promise<
    AgendaEvidence[]
  > {
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
  ): Promise<
    AgendaEvidence[]
  > {
    return this.findAll({
      schoolId:
        normalizeRequiredText(
          schoolId,
          'ID da escola',
        ),
    })
  }

  async findByPlanningId(
    planningId: string,
  ): Promise<
    AgendaEvidence[]
  > {
    return this.findAll({
      planningId:
        normalizeRequiredText(
          planningId,
          'ID do planejamento',
        ),
    })
  }

  async findByEventId(
    eventId: string,
  ): Promise<
    AgendaEvidence[]
  > {
    return this.findAll({
      eventId:
        normalizeRequiredText(
          eventId,
          'ID do evento',
        ),
    })
  }

  async findByLessonId(
    lessonId: string,
  ): Promise<
    AgendaEvidence[]
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
    AgendaEvidence[]
  > {
    return this.findAll({
      objectiveId:
        normalizeRequiredText(
          objectiveId,
          'ID do objetivo',
        ),
    })
  }

  async findByClassId(
    classId: string,
  ): Promise<
    AgendaEvidence[]
  > {
    return this.findAll({
      classId:
        normalizeRequiredText(
          classId,
          'ID da turma',
        ),
    })
  }

  async findByAcademicPeriodId(
    academicPeriodId: string,
  ): Promise<
    AgendaEvidence[]
  > {
    return this.findAll({
      academicPeriodId:
        normalizeRequiredText(
          academicPeriodId,
          'ID do período acadêmico',
        ),
    })
  }

  async create(
    input:
      CreateAgendaEvidenceInput,
  ): Promise<
    AgendaEvidence
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
          'agenda_evidences',
        )
        .insert(
          payload,
        )
        .select('*')
        .single()

    if (error) {
      throw new Error(
        `Erro ao criar evidência: ${error.message}`,
      )
    }

    return data as
      AgendaEvidence
  }

  async update(
    id: string,

    input:
      UpdateAgendaEvidenceInput,
  ): Promise<
    AgendaEvidence
  > {
    const evidenceId =
      normalizeRequiredText(
        id,
        'ID da evidência',
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
          'agenda_evidences',
        )
        .update(
          payload,
        )
        .eq(
          'id',
          evidenceId,
        )
        .is(
          'deleted_at',
          null,
        )
        .select('*')
        .single()

    if (error) {
      throw new Error(
        `Erro ao atualizar evidência: ${error.message}`,
      )
    }

    return data as
      AgendaEvidence
  }

  async delete(
    id: string,
    actorUserId?: string,
    reason?: string,
  ): Promise<void> {
    const evidenceId =
      normalizeRequiredText(
        id,
        'ID da evidência',
      )

    const context =
      normalizeDeletionContext(
        actorUserId,
        reason,
      )

    const {
      error,
    } =
      await this.client.rpc(
        'soft_delete_agenda_record',
        {
          requested_resource_type:
            'agenda_evidences',

          requested_resource_id:
            evidenceId,

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
  ): Promise<
    AgendaEvidence
  > {
    const evidenceId =
      normalizeRequiredText(
        id,
        'ID da evidência',
      )

    const context =
      normalizeRestorationContext(
        actorUserId,
        reason,
      )

    const {
      data,
      error,
    } =
      await this.client.rpc(
        'restore_agenda_record',
        {
          requested_resource_type:
            'agenda_evidences',

          requested_resource_id:
            evidenceId,

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

    return data as unknown as
      AgendaEvidence
  }
}

export const evidencesRepository =
  new EvidencesRepository()