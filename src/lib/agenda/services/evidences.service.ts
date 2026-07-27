import {
  EvidencesRepository,
  evidencesRepository,
  type AgendaEvidence,
  type AgendaEvidenceMetadata,
  type AgendaEvidenceQueryOptions,
  type AgendaEvidenceType,
  type CreateAgendaEvidenceInput,
  type DeleteAgendaEvidenceContext,
  type RestoreAgendaEvidenceContext,
  type UpdateAgendaEvidenceInput,
} from '@/lib/agenda/repository/evidences.repository'

const ALLOWED_EVIDENCE_TYPES:
  AgendaEvidenceType[] = [
    'texto',
    'imagem',
    'pdf',
    'link',
  ]

const DEFAULT_PRIVACY_NOTICE_VERSION =
  'edi-protecao-menores-v1.0'

const MAX_DELETION_REASON_LENGTH =
  500

const MAX_RESTORATION_REASON_LENGTH =
  500

export type EvidencePedagogicalContext = {
  planningId?: string | null
  eventId?: string | null

  lessonId?: string | null
  objectiveId?: string | null
  classId?: string | null

  reflectionId?: string | null
  academicPeriodId?: string | null

  organizationId?: string | null
  schoolId?: string | null
}

export type EvidenceQueryInput = {
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
): string | null {
  if (
    typeof value !==
    'string'
  ) {
    return null
  }

  return value.trim() ||
    null
}

function normalizeOptionalId(
  value:
    | string
    | null
    | undefined,
): string | null {
  return normalizeOptionalText(
    value,
  )
}

function normalizeEvidenceType(
  value:
    | string
    | undefined,
): AgendaEvidenceType {
  const normalizedValue =
    value
      ?.trim()
      .toLowerCase() ||
    'texto'

  if (
    !ALLOWED_EVIDENCE_TYPES
      .includes(
        normalizedValue as
          AgendaEvidenceType,
      )
  ) {
    throw new Error(
      'Tipo de evidência inválido. Use texto, imagem, pdf ou link.',
    )
  }

  return normalizedValue as
    AgendaEvidenceType
}

function normalizeFileSize(
  value:
    | number
    | null
    | undefined,
): number | null {
  if (
    value === undefined ||
    value === null
  ) {
    return null
  }

  if (
    !Number.isInteger(value) ||
    value < 0
  ) {
    throw new Error(
      'O tamanho do arquivo é inválido.',
    )
  }

  return value
}

function normalizeDateTime(
  value:
    | string
    | null
    | undefined,

  fieldName: string,
): string | null {
  const normalizedValue =
    normalizeOptionalText(
      value,
    )

  if (!normalizedValue) {
    return null
  }

  const date =
    new Date(
      normalizedValue,
    )

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    throw new Error(
      `${fieldName} é inválida.`,
    )
  }

  return date.toISOString()
}

function normalizeMetadata(
  value:
    | AgendaEvidenceMetadata
    | null
    | undefined,
): AgendaEvidenceMetadata {
  if (
    value === undefined ||
    value === null
  ) {
    return {}
  }

  if (
    typeof value !==
      'object' ||
    Array.isArray(value)
  ) {
    throw new Error(
      'Os metadados da evidência possuem formato inválido.',
    )
  }

  return value
}

function validateExternalUrl(
  value: string | null,
): void {
  if (!value) {
    return
  }

  try {
    const url =
      new URL(value)

    if (
      url.protocol !==
        'https:' &&
      url.protocol !==
        'http:'
    ) {
      throw new Error()
    }
  } catch {
    throw new Error(
      'O endereço externo da evidência é inválido.',
    )
  }
}

function validateStorageReference(
  storageBucket:
    string | null,

  storagePath:
    string | null,
): void {
  const hasBucket =
    Boolean(
      storageBucket,
    )

  const hasPath =
    Boolean(
      storagePath,
    )

  if (
    hasBucket !==
    hasPath
  ) {
    throw new Error(
      'O bucket e o caminho do arquivo devem ser informados juntos.',
    )
  }
}

function validateEvidenceReferences(
  evidenceType:
    AgendaEvidenceType,

  fileUrl:
    string | null,

  externalUrl:
    string | null,

  storageBucket:
    string | null,

  storagePath:
    string | null,
): void {
  validateStorageReference(
    storageBucket,
    storagePath,
  )

  validateExternalUrl(
    externalUrl,
  )

  const hasStoredFile =
    Boolean(
      storageBucket,
    ) &&
    Boolean(
      storagePath,
    )

  if (
    (
      evidenceType ===
        'imagem' ||
      evidenceType ===
        'pdf'
    ) &&
    !fileUrl &&
    !hasStoredFile
  ) {
    throw new Error(
      'Envie um arquivo para evidências de imagem ou PDF.',
    )
  }

  if (
    evidenceType ===
      'link' &&
    !externalUrl
  ) {
    throw new Error(
      'Informe o endereço externo da evidência.',
    )
  }
}

function normalizeDeletionReason(
  value:
    | string
    | null
    | undefined,
): string {
  const normalizedValue =
    normalizeRequiredText(
      value,
      'Motivo da exclusão',
    )

  if (
    normalizedValue.length >
    MAX_DELETION_REASON_LENGTH
  ) {
    throw new Error(
      `O motivo da exclusão não pode ultrapassar ${MAX_DELETION_REASON_LENGTH} caracteres.`,
    )
  }

  return normalizedValue
}

function normalizeRestorationReason(
  value:
    | string
    | null
    | undefined,
): string {
  const normalizedValue =
    normalizeRequiredText(
      value,
      'Motivo da restauração',
    )

  if (
    normalizedValue.length >
    MAX_RESTORATION_REASON_LENGTH
  ) {
    throw new Error(
      `O motivo da restauração não pode ultrapassar ${MAX_RESTORATION_REASON_LENGTH} caracteres.`,
    )
  }

  return normalizedValue
}

function normalizeDeleteContext(
  context:
    DeleteAgendaEvidenceContext,
): DeleteAgendaEvidenceContext {
  if (!context) {
    throw new Error(
      'Os dados de auditoria da exclusão são obrigatórios.',
    )
  }

  return {
    actorUserId:
      normalizeRequiredText(
        context.actorUserId,
        'ID do usuário responsável',
      ),

    reason:
      normalizeDeletionReason(
        context.reason,
      ),
  }
}

function normalizeRestoreContext(
  context:
    RestoreAgendaEvidenceContext,
): RestoreAgendaEvidenceContext {
  if (!context) {
    throw new Error(
      'Os dados de auditoria da restauração são obrigatórios.',
    )
  }

  return {
    actorUserId:
      normalizeRequiredText(
        context.actorUserId,
        'ID do usuário responsável',
      ),

    reason:
      normalizeRestorationReason(
        context.reason,
      ),
  }
}

type MinorProtectionInput = {
  containsIdentifiableMinor:
    boolean

  guardianAuthorizationConfirmed:
    boolean

  authorizationReference:
    string | null

  authorizationConfirmedAt:
    string | null

  authorizationConfirmedBy:
    string | null

  privacyNoticeVersion:
    string | null

  evidenceOwnerId:
    string | null
}

type NormalizedMinorProtection = {
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
}

/*
 * Política de proteção de crianças e adolescentes.
 *
 * Esta função preserva integralmente o comportamento
 * já validado:
 *
 * - exige confirmação da autorização;
 * - exige referência da autorização;
 * - exige identificação do responsável pela confirmação;
 * - confirma que o usuário que envia é o mesmo que declara;
 * - registra data e versão da política;
 * - remove dados de autorização quando não há menor
 *   identificável.
 */
function normalizeMinorProtection(
  input:
    MinorProtectionInput,
): NormalizedMinorProtection {
  const privacyNoticeVersion =
    normalizeOptionalText(
      input
        .privacyNoticeVersion,
    ) ??
    DEFAULT_PRIVACY_NOTICE_VERSION

  if (
    !input
      .containsIdentifiableMinor
  ) {
    return {
      contains_identifiable_minor:
        false,

      guardian_authorization_confirmed:
        false,

      authorization_reference:
        null,

      authorization_confirmed_at:
        null,

      authorization_confirmed_by:
        null,

      privacy_notice_version:
        privacyNoticeVersion,
    }
  }

  if (
    !input
      .guardianAuthorizationConfirmed
  ) {
    throw new Error(
      'Confirme que a instituição possui autorização vigente do responsável legal.',
    )
  }

  const authorizationReference =
    normalizeRequiredText(
      input
        .authorizationReference,
      'Referência da autorização',
    )

  const authorizationConfirmedBy =
    normalizeRequiredText(
      input
        .authorizationConfirmedBy,
      'Usuário responsável pela confirmação',
    )

  const evidenceOwnerId =
    normalizeRequiredText(
      input.evidenceOwnerId,
      'Usuário responsável pela evidência',
    )

  if (
    authorizationConfirmedBy !==
    evidenceOwnerId
  ) {
    throw new Error(
      'A confirmação da autorização deve ser registrada pelo usuário responsável pelo envio.',
    )
  }

  const authorizationConfirmedAt =
    normalizeDateTime(
      input
        .authorizationConfirmedAt,
      'Data da confirmação da autorização',
    ) ??
    new Date()
      .toISOString()

  return {
    contains_identifiable_minor:
      true,

    guardian_authorization_confirmed:
      true,

    authorization_reference:
      authorizationReference,

    authorization_confirmed_at:
      authorizationConfirmedAt,

    authorization_confirmed_by:
      authorizationConfirmedBy,

    privacy_notice_version:
      privacyNoticeVersion,
  }
}

function normalizeQueryInput(
  input:
    EvidenceQueryInput = {},
): AgendaEvidenceQueryOptions {
  return {
    includeDeleted:
      input.includeDeleted ??
      false,

    userId:
      normalizeOptionalId(
        input.userId,
      ),

    organizationId:
      normalizeOptionalId(
        input.organizationId,
      ),

    schoolId:
      normalizeOptionalId(
        input.schoolId,
      ),

    planningId:
      normalizeOptionalId(
        input.planningId,
      ),

    eventId:
      normalizeOptionalId(
        input.eventId,
      ),

    lessonId:
      normalizeOptionalId(
        input.lessonId,
      ),

    objectiveId:
      normalizeOptionalId(
        input.objectiveId,
      ),

    classId:
      normalizeOptionalId(
        input.classId,
      ),

    reflectionId:
      normalizeOptionalId(
        input.reflectionId,
      ),

    academicPeriodId:
      normalizeOptionalId(
        input.academicPeriodId,
      ),

    evidenceType:
      input.evidenceType
        ? normalizeEvidenceType(
            input.evidenceType,
          )
        : null,

    containsIdentifiableMinor:
      typeof
        input
          .containsIdentifiableMinor ===
      'boolean'
        ? input
            .containsIdentifiableMinor
        : null,

    search:
      normalizeOptionalText(
        input.search,
      ),
  }
}

function normalizePedagogicalFields(
  input:
    CreateAgendaEvidenceInput,
) {
  return {
    planning_id:
      normalizeOptionalId(
        input.planning_id,
      ),

    event_id:
      normalizeOptionalId(
        input.event_id,
      ),

    lesson_id:
      normalizeOptionalId(
        input.lesson_id,
      ),

    objective_id:
      normalizeOptionalId(
        input.objective_id,
      ),

    class_id:
      normalizeOptionalId(
        input.class_id,
      ),

    reflection_id:
      normalizeOptionalId(
        input.reflection_id,
      ),

    academic_period_id:
      normalizeOptionalId(
        input.academic_period_id,
      ),

    organization_id:
      normalizeOptionalId(
        input.organization_id,
      ),

    school_id:
      normalizeOptionalId(
        input.school_id,
      ),
  }
}

export class EvidencesService {
  constructor(
    private readonly repository:
      EvidencesRepository =
        evidencesRepository,
  ) {}

  async listAll(
    options:
      EvidenceQueryInput = {},
  ): Promise<
    AgendaEvidence[]
  > {
    return this.repository
      .findAll(
        normalizeQueryInput(
          options,
        ),
      )
  }

  async list(
    options:
      EvidenceQueryInput = {},
  ): Promise<
    AgendaEvidence[]
  > {
    return this.listAll(
      options,
    )
  }

  async getById(
    id: string,
  ): Promise<
    AgendaEvidence
  > {
    const normalizedId =
      normalizeRequiredText(
        id,
        'ID da evidência',
      )

    const evidence =
      await this.repository
        .findById(
          normalizedId,
        )

    if (!evidence) {
      throw new Error(
        'Evidência não encontrada.',
      )
    }

    return evidence
  }

  async listByUserId(
    userId: string,
  ): Promise<
    AgendaEvidence[]
  > {
    return this.repository
      .findByUserId(
        normalizeRequiredText(
          userId,
          'ID do usuário',
        ),
      )
  }

  async listBySchoolId(
    schoolId: string,
  ): Promise<
    AgendaEvidence[]
  > {
    return this.repository
      .findBySchoolId(
        normalizeRequiredText(
          schoolId,
          'ID da escola',
        ),
      )
  }

  async listByPlanningId(
    planningId: string,
  ): Promise<
    AgendaEvidence[]
  > {
    return this.repository
      .findByPlanningId(
        normalizeRequiredText(
          planningId,
          'ID do planejamento',
        ),
      )
  }

  async listByEventId(
    eventId: string,
  ): Promise<
    AgendaEvidence[]
  > {
    return this.repository
      .findByEventId(
        normalizeRequiredText(
          eventId,
          'ID do evento',
        ),
      )
  }

  async listByLessonId(
    lessonId: string,
  ): Promise<
    AgendaEvidence[]
  > {
    return this.repository
      .findByLessonId(
        normalizeRequiredText(
          lessonId,
          'ID da aula',
        ),
      )
  }

  async listByObjectiveId(
    objectiveId: string,
  ): Promise<
    AgendaEvidence[]
  > {
    return this.repository
      .findByObjectiveId(
        normalizeRequiredText(
          objectiveId,
          'ID do objetivo',
        ),
      )
  }

  async listByClassId(
    classId: string,
  ): Promise<
    AgendaEvidence[]
  > {
    return this.repository
      .findByClassId(
        normalizeRequiredText(
          classId,
          'ID da turma',
        ),
      )
  }

  async listByAcademicPeriodId(
    academicPeriodId: string,
  ): Promise<
    AgendaEvidence[]
  > {
    return this.repository
      .findByAcademicPeriodId(
        normalizeRequiredText(
          academicPeriodId,
          'ID do período acadêmico',
        ),
      )
  }

  async create(
    input:
      CreateAgendaEvidenceInput,
  ): Promise<
    AgendaEvidence
  > {
    const title =
      normalizeRequiredText(
        input.title,
        'Título da evidência',
      )

    const evidenceType =
      normalizeEvidenceType(
        input.evidence_type,
      )

    const description =
      normalizeOptionalText(
        input.description,
      )

    const fileUrl =
      normalizeOptionalText(
        input.file_url,
      )

    const externalUrl =
      normalizeOptionalText(
        input.external_url,
      )

    const storageBucket =
      normalizeOptionalText(
        input.storage_bucket,
      )

    const storagePath =
      normalizeOptionalText(
        input.storage_path,
      )

    const originalFileName =
      normalizeOptionalText(
        input.original_file_name,
      )

    const fileMimeType =
      normalizeOptionalText(
        input.file_mime_type,
      )

    const fileSizeBytes =
      normalizeFileSize(
        input.file_size_bytes,
      )

    const userId =
      normalizeOptionalId(
        input.user_id,
      )

    validateEvidenceReferences(
      evidenceType,
      fileUrl,
      externalUrl,
      storageBucket,
      storagePath,
    )

    const minorProtection =
      normalizeMinorProtection({
        containsIdentifiableMinor:
          input
            .contains_identifiable_minor ??
          false,

        guardianAuthorizationConfirmed:
          input
            .guardian_authorization_confirmed ??
          false,

        authorizationReference:
          normalizeOptionalText(
            input
              .authorization_reference,
          ),

        authorizationConfirmedAt:
          normalizeOptionalText(
            input
              .authorization_confirmed_at,
          ),

        authorizationConfirmedBy:
          normalizeOptionalId(
            input
              .authorization_confirmed_by,
          ),

        privacyNoticeVersion:
          normalizeOptionalText(
            input
              .privacy_notice_version,
          ),

        evidenceOwnerId:
          userId,
      })

    const pedagogicalFields =
      normalizePedagogicalFields(
        input,
      )

    return this.repository
      .create({
        title,
        description,

        evidence_type:
          evidenceType,

        file_url:
          fileUrl,

        external_url:
          externalUrl,

        ...pedagogicalFields,

        user_id:
          userId,

        ...minorProtection,

        storage_bucket:
          storageBucket,

        storage_path:
          storagePath,

        original_file_name:
          originalFileName,

        file_mime_type:
          fileMimeType,

        file_size_bytes:
          fileSizeBytes,

        metadata:
          normalizeMetadata(
            input.metadata,
          ),

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
      })
  }

  async update(
    id: string,

    input:
      UpdateAgendaEvidenceInput,
  ): Promise<
    AgendaEvidence
  > {
    const normalizedId =
      normalizeRequiredText(
        id,
        'ID da evidência',
      )

    const existingEvidence =
      await this.repository
        .findById(
          normalizedId,
        )

    if (!existingEvidence) {
      throw new Error(
        'Evidência não encontrada.',
      )
    }

    const normalizedInput:
      UpdateAgendaEvidenceInput = {}

    if (
      input.title !==
      undefined
    ) {
      normalizedInput.title =
        normalizeRequiredText(
          input.title,
          'Título da evidência',
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
      input.evidence_type !==
      undefined
    ) {
      normalizedInput.evidence_type =
        normalizeEvidenceType(
          input.evidence_type,
        )
    }

    if (
      input.file_url !==
      undefined
    ) {
      normalizedInput.file_url =
        normalizeOptionalText(
          input.file_url,
        )
    }

    if (
      input.external_url !==
      undefined
    ) {
      normalizedInput.external_url =
        normalizeOptionalText(
          input.external_url,
        )
    }

    if (
      input.planning_id !==
      undefined
    ) {
      normalizedInput.planning_id =
        normalizeOptionalId(
          input.planning_id,
        )
    }

    if (
      input.event_id !==
      undefined
    ) {
      normalizedInput.event_id =
        normalizeOptionalId(
          input.event_id,
        )
    }

    if (
      input.lesson_id !==
      undefined
    ) {
      normalizedInput.lesson_id =
        normalizeOptionalId(
          input.lesson_id,
        )
    }

    if (
      input.objective_id !==
      undefined
    ) {
      normalizedInput.objective_id =
        normalizeOptionalId(
          input.objective_id,
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
      input.reflection_id !==
      undefined
    ) {
      normalizedInput.reflection_id =
        normalizeOptionalId(
          input.reflection_id,
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
      input.user_id !==
      undefined
    ) {
      normalizedInput.user_id =
        normalizeOptionalId(
          input.user_id,
        )
    }

    if (
      input.storage_bucket !==
      undefined
    ) {
      normalizedInput.storage_bucket =
        normalizeOptionalText(
          input.storage_bucket,
        )
    }

    if (
      input.storage_path !==
      undefined
    ) {
      normalizedInput.storage_path =
        normalizeOptionalText(
          input.storage_path,
        )
    }

    if (
      input.original_file_name !==
      undefined
    ) {
      normalizedInput.original_file_name =
        normalizeOptionalText(
          input.original_file_name,
        )
    }

    if (
      input.file_mime_type !==
      undefined
    ) {
      normalizedInput.file_mime_type =
        normalizeOptionalText(
          input.file_mime_type,
        )
    }

    if (
      input.file_size_bytes !==
      undefined
    ) {
      normalizedInput.file_size_bytes =
        normalizeFileSize(
          input.file_size_bytes,
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

    if (
      input.created_by !==
      undefined
    ) {
      normalizedInput.created_by =
        normalizeOptionalId(
          input.created_by,
        )
    }

    if (
      input.updated_by !==
      undefined
    ) {
      normalizedInput.updated_by =
        normalizeOptionalId(
          input.updated_by,
        )
    }

    const finalEvidenceType =
      normalizedInput
        .evidence_type ??
      existingEvidence
        .evidence_type

    const finalFileUrl =
      normalizedInput.file_url !==
      undefined
        ? normalizedInput.file_url
        : existingEvidence.file_url

    const finalExternalUrl =
      normalizedInput.external_url !==
      undefined
        ? normalizedInput.external_url
        : existingEvidence.external_url

    const finalStorageBucket =
      normalizedInput.storage_bucket !==
      undefined
        ? normalizedInput.storage_bucket
        : existingEvidence.storage_bucket

    const finalStoragePath =
      normalizedInput.storage_path !==
      undefined
        ? normalizedInput.storage_path
        : existingEvidence.storage_path

    validateEvidenceReferences(
      finalEvidenceType,
      finalFileUrl ??
        null,
      finalExternalUrl ??
        null,
      finalStorageBucket ??
        null,
      finalStoragePath ??
        null,
    )

    /*
     * A política de proteção somente é recalculada quando
     * um dos seus campos é alterado.
     */
    const protectionWasUpdated =
      input
        .contains_identifiable_minor !==
        undefined ||
      input
        .guardian_authorization_confirmed !==
        undefined ||
      input
        .authorization_reference !==
        undefined ||
      input
        .authorization_confirmed_at !==
        undefined ||
      input
        .authorization_confirmed_by !==
        undefined ||
      input
        .privacy_notice_version !==
        undefined

    if (
      protectionWasUpdated
    ) {
      const finalUserId =
        normalizedInput.user_id !==
        undefined
          ? normalizedInput.user_id
          : existingEvidence.user_id

      const minorProtection =
        normalizeMinorProtection({
          containsIdentifiableMinor:
            input
              .contains_identifiable_minor ??
            existingEvidence
              .contains_identifiable_minor,

          guardianAuthorizationConfirmed:
            input
              .guardian_authorization_confirmed ??
            existingEvidence
              .guardian_authorization_confirmed,

          authorizationReference:
            input
              .authorization_reference !==
            undefined
              ? normalizeOptionalText(
                  input
                    .authorization_reference,
                )
              : existingEvidence
                  .authorization_reference,

          authorizationConfirmedAt:
            input
              .authorization_confirmed_at !==
            undefined
              ? normalizeOptionalText(
                  input
                    .authorization_confirmed_at,
                )
              : existingEvidence
                  .authorization_confirmed_at,

          authorizationConfirmedBy:
            input
              .authorization_confirmed_by !==
            undefined
              ? normalizeOptionalId(
                  input
                    .authorization_confirmed_by,
                )
              : existingEvidence
                  .authorization_confirmed_by,

          privacyNoticeVersion:
            input
              .privacy_notice_version !==
            undefined
              ? normalizeOptionalText(
                  input
                    .privacy_notice_version,
                )
              : existingEvidence
                  .privacy_notice_version,

          evidenceOwnerId:
            finalUserId ??
            null,
        })

      Object.assign(
        normalizedInput,
        minorProtection,
      )
    }

    return this.repository
      .update(
        normalizedId,
        normalizedInput,
      )
  }

  async delete(
    id: string,

    context:
      DeleteAgendaEvidenceContext,
  ): Promise<void> {
    const normalizedId =
      normalizeRequiredText(
        id,
        'ID da evidência',
      )

    const normalizedContext =
      normalizeDeleteContext(
        context,
      )

    const existingEvidence =
      await this.repository
        .findById(
          normalizedId,
        )

    if (!existingEvidence) {
      throw new Error(
        'Evidência não encontrada ou já excluída.',
      )
    }

    await this.repository
      .delete(
        normalizedId,
        normalizedContext
          .actorUserId,
        normalizedContext
          .reason,
      )
  }

  async restore(
    id: string,

    context:
      RestoreAgendaEvidenceContext,
  ): Promise<
    AgendaEvidence
  > {
    const normalizedId =
      normalizeRequiredText(
        id,
        'ID da evidência',
      )

    const normalizedContext =
      normalizeRestoreContext(
        context,
      )

    const existingEvidence =
      await this.repository
        .findByIdIncludingDeleted(
          normalizedId,
        )

    if (!existingEvidence) {
      throw new Error(
        'Evidência não encontrada.',
      )
    }

    if (
      !existingEvidence
        .deleted_at
    ) {
      throw new Error(
        'A evidência não está excluída.',
      )
    }

    return this.repository
      .restore(
        normalizedId,
        normalizedContext
          .actorUserId,
        normalizedContext
          .reason,
      )
  }
}

export const evidencesService =
  new EvidencesService()