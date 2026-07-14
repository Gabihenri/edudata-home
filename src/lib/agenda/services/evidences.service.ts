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

function normalizeRequiredText(
  value: string | undefined,
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

function validateEvidenceReferences(
  evidenceType: AgendaEvidenceType,
  fileUrl: string | null,
  externalUrl: string | null,
): void {
  if (
    (evidenceType === 'imagem' ||
      evidenceType === 'pdf') &&
    !fileUrl
  ) {
    throw new Error(
      'Envie um arquivo para evidências de imagem ou PDF.',
    )
  }

  if (evidenceType === 'link' && !externalUrl) {
    throw new Error(
      'Informe o endereço externo da evidência.',
    )
  }
}

class EvidencesService {
  async listAll(): Promise<AgendaEvidence[]> {
    return evidencesRepository.findAll()
  }

  async getById(
    id: string,
  ): Promise<AgendaEvidence> {
    const normalizedId = normalizeRequiredText(
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
    const title = normalizeRequiredText(
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

    validateEvidenceReferences(
      evidenceType,
      fileUrl,
      externalUrl,
    )

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

      user_id:
        normalizeOptionalText(
          input.user_id,
        ),
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

    if (input.description !== undefined) {
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

    if (input.event_id !== undefined) {
      normalizedInput.event_id =
        normalizeOptionalText(
          input.event_id,
        )
    }

    if (input.school_id !== undefined) {
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

    validateEvidenceReferences(
      finalEvidenceType,
      finalFileUrl ?? null,
      finalExternalUrl ?? null,
    )

    return evidencesRepository.update(
      normalizedId,
      normalizedInput,
    )
  }

  async delete(id: string): Promise<void> {
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