import {
  evidencesRepository,
  type AgendaEvidence,
  type AgendaEvidenceType,
  type CreateAgendaEvidenceInput,
  type UpdateAgendaEvidenceInput,
} from '@/lib/agenda/repository/evidences.repository'

const ALLOWED_EVIDENCE_TYPES: AgendaEvidenceType[] = [
  'texto',
  'imagem',
  'pdf',
  'link',
]

const DEFAULT_PRIVACY_NOTICE_VERSION =
  'edi-protecao-menores-v1.0'

function normalizeRequiredText(
  value: string | null | undefined,
  fieldName: string,
): string {
  const normalizedValue = value?.trim()

  if (!normalizedValue) {
    throw new Error(`${fieldName} é obrigatório.`)
  }

  return normalizedValue
}

function normalizeOptionalText(
  value: string | null | undefined,
): string | null {
  if (typeof value !== 'string') {
    return null
  }

  return value.trim() || null
}

function normalizeEvidenceType(
  value: string | undefined,
): AgendaEvidenceType {
  const normalizedValue =
    value?.trim().toLowerCase() || 'texto'

  if (
    !ALLOWED_EVIDENCE_TYPES.includes(
      normalizedValue as AgendaEvidenceType,
    )
  ) {
    throw new Error(
      'Tipo de evidência inválido. Use texto, imagem, pdf ou link.',
    )
  }

  return normalizedValue as AgendaEvidenceType
}

function normalizeFileSize(
  value: number | null | undefined,
): number | null {
  if (value === undefined || value === null) {
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
  value: string | null | undefined,
  fieldName: string,
): string | null {
  const normalizedValue =
    normalizeOptionalText(value)

  if (!normalizedValue) {
    return null
  }

  const date = new Date(normalizedValue)

  if (Number.isNaN(date.getTime())) {
    throw new Error(
      `${fieldName} é inválida.`,
    )
  }

  return date.toISOString()
}

function validateExternalUrl(
  value: string | null,
): void {
  if (!value) {
    return
  }

  try {
    const url = new URL(value)

    if (
      url.protocol !== 'https:' &&
      url.protocol !== 'http:'
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
  storageBucket: string | null,
  storagePath: string | null,
): void {
  const hasBucket = Boolean(storageBucket)
  const hasPath = Boolean(storagePath)

  if (hasBucket !== hasPath) {
    throw new Error(
      'O bucket e o caminho do arquivo devem ser informados juntos.',
    )
  }
}

function validateEvidenceReferences(
  evidenceType: AgendaEvidenceType,
  fileUrl: string | null,
  externalUrl: string | null,
  storageBucket: string | null,
  storagePath: string | null,
): void {
  validateStorageReference(
    storageBucket,
    storagePath,
  )

  validateExternalUrl(externalUrl)

  const hasStoredFile =
    Boolean(storageBucket) &&
    Boolean(storagePath)

  if (
    (
      evidenceType === 'imagem' ||
      evidenceType === 'pdf'
    ) &&
    !fileUrl &&
    !hasStoredFile
  ) {
    throw new Error(
      'Envie um arquivo para evidências de imagem ou PDF.',
    )
  }

  if (
    evidenceType === 'link' &&
    !externalUrl
  ) {
    throw new Error(
      'Informe o endereço externo da evidência.',
    )
  }
}

type MinorProtectionInput = {
  containsIdentifiableMinor: boolean

  guardianAuthorizationConfirmed: boolean
  authorizationReference: string | null

  authorizationConfirmedAt: string | null
  authorizationConfirmedBy: string | null

  privacyNoticeVersion: string | null

  evidenceOwnerId: string | null
}

type NormalizedMinorProtection = {
  contains_identifiable_minor: boolean

  guardian_authorization_confirmed: boolean
  authorization_reference: string | null

  authorization_confirmed_at: string | null
  authorization_confirmed_by: string | null

  privacy_notice_version: string
}

function normalizeMinorProtection(
  input: MinorProtectionInput,
): NormalizedMinorProtection {
  const privacyNoticeVersion =
    normalizeOptionalText(
      input.privacyNoticeVersion,
    ) ??
    DEFAULT_PRIVACY_NOTICE_VERSION

  if (!input.containsIdentifiableMinor) {
    return {
      contains_identifiable_minor: false,

      guardian_authorization_confirmed:
        false,

      authorization_reference: null,

      authorization_confirmed_at: null,
      authorization_confirmed_by: null,

      privacy_notice_version:
        privacyNoticeVersion,
    }
  }

  if (
    !input.guardianAuthorizationConfirmed
  ) {
    throw new Error(
      'Confirme que a instituição possui autorização vigente do responsável legal.',
    )
  }

  const authorizationReference =
    normalizeRequiredText(
      input.authorizationReference,
      'Referência da autorização',
    )

  const authorizationConfirmedBy =
    normalizeRequiredText(
      input.authorizationConfirmedBy,
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
      input.authorizationConfirmedAt,
      'Data da confirmação da autorização',
    ) ??
    new Date().toISOString()

  return {
    contains_identifiable_minor: true,

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

class EvidencesService {
  async listAll(): Promise<
    AgendaEvidence[]
  > {
    return evidencesRepository.findAll()
  }

  async getById(
    id: string,
  ): Promise<AgendaEvidence> {
    const normalizedId =
      normalizeRequiredText(
        id,
        'ID da evidência',
      )

    const evidence =
      await evidencesRepository.findById(
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
  ): Promise<AgendaEvidence[]> {
    const normalizedUserId =
      normalizeRequiredText(
        userId,
        'ID do usuário',
      )

    return evidencesRepository.findByUserId(
      normalizedUserId,
    )
  }

  async listBySchoolId(
    schoolId: string,
  ): Promise<AgendaEvidence[]> {
    const normalizedSchoolId =
      normalizeRequiredText(
        schoolId,
        'ID da escola',
      )

    return evidencesRepository.findBySchoolId(
      normalizedSchoolId,
    )
  }

  async listByPlanningId(
    planningId: string,
  ): Promise<AgendaEvidence[]> {
    const normalizedPlanningId =
      normalizeRequiredText(
        planningId,
        'ID do planejamento',
      )

    return evidencesRepository.findByPlanningId(
      normalizedPlanningId,
    )
  }

  async listByEventId(
    eventId: string,
  ): Promise<AgendaEvidence[]> {
    const normalizedEventId =
      normalizeRequiredText(
        eventId,
        'ID do evento',
      )

    return evidencesRepository.findByEventId(
      normalizedEventId,
    )
  }

  async create(
    input: CreateAgendaEvidenceInput,
  ): Promise<AgendaEvidence> {
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
      normalizeOptionalText(
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
          input.contains_identifiable_minor ??
          false,

        guardianAuthorizationConfirmed:
          input.guardian_authorization_confirmed ??
          false,

        authorizationReference:
          normalizeOptionalText(
            input.authorization_reference,
          ),

        authorizationConfirmedAt:
          normalizeOptionalText(
            input.authorization_confirmed_at,
          ),

        authorizationConfirmedBy:
          normalizeOptionalText(
            input.authorization_confirmed_by,
          ),

        privacyNoticeVersion:
          normalizeOptionalText(
            input.privacy_notice_version,
          ),

        evidenceOwnerId: userId,
      })

    return evidencesRepository.create({
      title,
      description,

      evidence_type: evidenceType,

      file_url: fileUrl,
      external_url: externalUrl,

      planning_id:
        normalizeOptionalText(
          input.planning_id,
        ),

      event_id:
        normalizeOptionalText(
          input.event_id,
        ),

      school_id:
        normalizeOptionalText(
          input.school_id,
        ),

      user_id: userId,

      ...minorProtection,

      storage_bucket: storageBucket,
      storage_path: storagePath,

      original_file_name:
        originalFileName,

      file_mime_type:
        fileMimeType,

      file_size_bytes:
        fileSizeBytes,
    })
  }

  async update(
    id: string,
    input: UpdateAgendaEvidenceInput,
  ): Promise<AgendaEvidence> {
    const normalizedId =
      normalizeRequiredText(
        id,
        'ID da evidência',
      )

    const existingEvidence =
      await evidencesRepository.findById(
        normalizedId,
      )

    if (!existingEvidence) {
      throw new Error(
        'Evidência não encontrada.',
      )
    }

    const normalizedInput:
      UpdateAgendaEvidenceInput = {}

    if (input.title !== undefined) {
      normalizedInput.title =
        normalizeRequiredText(
          input.title,
          'Título da evidência',
        )
    }

    if (
      input.description !== undefined
    ) {
      normalizedInput.description =
        normalizeOptionalText(
          input.description,
        )
    }

    if (
      input.evidence_type !== undefined
    ) {
      normalizedInput.evidence_type =
        normalizeEvidenceType(
          input.evidence_type,
        )
    }

    if (input.file_url !== undefined) {
      normalizedInput.file_url =
        normalizeOptionalText(
          input.file_url,
        )
    }

    if (
      input.external_url !== undefined
    ) {
      normalizedInput.external_url =
        normalizeOptionalText(
          input.external_url,
        )
    }

    if (
      input.planning_id !== undefined
    ) {
      normalizedInput.planning_id =
        normalizeOptionalText(
          input.planning_id,
        )
    }

    if (
      input.event_id !== undefined
    ) {
      normalizedInput.event_id =
        normalizeOptionalText(
          input.event_id,
        )
    }

    if (
      input.school_id !== undefined
    ) {
      normalizedInput.school_id =
        normalizeOptionalText(
          input.school_id,
        )
    }

    if (input.user_id !== undefined) {
      normalizedInput.user_id =
        normalizeOptionalText(
          input.user_id,
        )
    }

    if (
      input.storage_bucket !== undefined
    ) {
      normalizedInput.storage_bucket =
        normalizeOptionalText(
          input.storage_bucket,
        )
    }

    if (
      input.storage_path !== undefined
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
      input.file_mime_type !== undefined
    ) {
      normalizedInput.file_mime_type =
        normalizeOptionalText(
          input.file_mime_type,
        )
    }

    if (
      input.file_size_bytes !== undefined
    ) {
      normalizedInput.file_size_bytes =
        normalizeFileSize(
          input.file_size_bytes,
        )
    }

    const finalEvidenceType =
      normalizedInput.evidence_type ??
      existingEvidence.evidence_type

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
      finalFileUrl ?? null,
      finalExternalUrl ?? null,
      finalStorageBucket ?? null,
      finalStoragePath ?? null,
    )

    const protectionWasUpdated =
      input.contains_identifiable_minor !==
        undefined ||
      input.guardian_authorization_confirmed !==
        undefined ||
      input.authorization_reference !==
        undefined ||
      input.authorization_confirmed_at !==
        undefined ||
      input.authorization_confirmed_by !==
        undefined ||
      input.privacy_notice_version !==
        undefined

    if (protectionWasUpdated) {
      const finalUserId =
        normalizedInput.user_id !==
        undefined
          ? normalizedInput.user_id
          : existingEvidence.user_id

      const minorProtection =
        normalizeMinorProtection({
          containsIdentifiableMinor:
            input.contains_identifiable_minor ??
            existingEvidence.contains_identifiable_minor,

          guardianAuthorizationConfirmed:
            input.guardian_authorization_confirmed ??
            existingEvidence.guardian_authorization_confirmed,

          authorizationReference:
            input.authorization_reference !==
            undefined
              ? normalizeOptionalText(
                  input.authorization_reference,
                )
              : existingEvidence.authorization_reference,

          authorizationConfirmedAt:
            input.authorization_confirmed_at !==
            undefined
              ? normalizeOptionalText(
                  input.authorization_confirmed_at,
                )
              : existingEvidence.authorization_confirmed_at,

          authorizationConfirmedBy:
            input.authorization_confirmed_by !==
            undefined
              ? normalizeOptionalText(
                  input.authorization_confirmed_by,
                )
              : existingEvidence.authorization_confirmed_by,

          privacyNoticeVersion:
            input.privacy_notice_version !==
            undefined
              ? normalizeOptionalText(
                  input.privacy_notice_version,
                )
              : existingEvidence.privacy_notice_version,

          evidenceOwnerId:
            finalUserId ?? null,
        })

      Object.assign(
        normalizedInput,
        minorProtection,
      )
    }

    return evidencesRepository.update(
      normalizedId,
      normalizedInput,
    )
  }

  async delete(
    id: string,
  ): Promise<void> {
    const normalizedId =
      normalizeRequiredText(
        id,
        'ID da evidência',
      )

    const existingEvidence =
      await evidencesRepository.findById(
        normalizedId,
      )

    if (!existingEvidence) {
      throw new Error(
        'Evidência não encontrada.',
      )
    }

    await evidencesRepository.delete(
      normalizedId,
    )
  }
}

export const evidencesService =
  new EvidencesService()