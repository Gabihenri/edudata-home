import {
  evidencesRepository,
  type AgendaEvidence,
  type CreateAgendaEvidenceInput,
  type UpdateAgendaEvidenceInput,
} from '@/lib/agenda/repository/evidences.repository'

class EvidencesService {
  async listAll(): Promise<AgendaEvidence[]> {
    return evidencesRepository.findAll()
  }

  async getById(id: string): Promise<AgendaEvidence> {
    if (!id?.trim()) {
      throw new Error('ID da evidência é obrigatório.')
    }

    const evidence = await evidencesRepository.findById(id)

    if (!evidence) {
      throw new Error('Evidência não encontrada.')
    }

    return evidence
  }

  async listByUserId(userId: string): Promise<AgendaEvidence[]> {
    if (!userId?.trim()) {
      throw new Error('ID do usuário é obrigatório.')
    }

    return evidencesRepository.findByUserId(userId)
  }

  async listBySchoolId(schoolId: string): Promise<AgendaEvidence[]> {
    if (!schoolId?.trim()) {
      throw new Error('ID da escola é obrigatório.')
    }

    return evidencesRepository.findBySchoolId(schoolId)
  }

  async listByPlanningId(
    planningId: string,
  ): Promise<AgendaEvidence[]> {
    if (!planningId?.trim()) {
      throw new Error('ID do planejamento é obrigatório.')
    }

    return evidencesRepository.findByPlanningId(planningId)
  }

  async listByEventId(eventId: string): Promise<AgendaEvidence[]> {
    if (!eventId?.trim()) {
      throw new Error('ID do evento é obrigatório.')
    }

    return evidencesRepository.findByEventId(eventId)
  }

  async create(
    input: CreateAgendaEvidenceInput,
  ): Promise<AgendaEvidence> {
    const title = input.title?.trim()

    if (!title) {
      throw new Error('Título da evidência é obrigatório.')
    }

    const evidenceType =
      input.evidence_type?.trim().toLowerCase() || 'texto'

    const allowedTypes = ['texto', 'imagem', 'pdf', 'link']

    if (!allowedTypes.includes(evidenceType)) {
      throw new Error(
        'Tipo de evidência inválido. Use texto, imagem, pdf ou link.',
      )
    }

    const fileUrl = input.file_url?.trim() || null
    const externalUrl = input.external_url?.trim() || null

    if (
      evidenceType === 'imagem' ||
      evidenceType === 'pdf'
    ) {
      if (!fileUrl) {
        throw new Error(
          'Uma URL de arquivo é obrigatória para evidências de imagem ou PDF.',
        )
      }
    }

    if (evidenceType === 'link' && !externalUrl) {
      throw new Error(
        'Uma URL externa é obrigatória para evidências do tipo link.',
      )
    }

    return evidencesRepository.create({
      ...input,
      title,
      description: input.description?.trim() || null,
      evidence_type: evidenceType,
      file_url: fileUrl,
      external_url: externalUrl,
    })
  }

  async update(
    id: string,
    input: UpdateAgendaEvidenceInput,
  ): Promise<AgendaEvidence> {
    if (!id?.trim()) {
      throw new Error('ID da evidência é obrigatório.')
    }

    const existingEvidence = await evidencesRepository.findById(id)

    if (!existingEvidence) {
      throw new Error('Evidência não encontrada.')
    }

    const normalizedInput: UpdateAgendaEvidenceInput = {
      ...input,
    }

    if (input.title !== undefined) {
      const title = input.title.trim()

      if (!title) {
        throw new Error('Título da evidência não pode ficar vazio.')
      }

      normalizedInput.title = title
    }

    if (input.description !== undefined) {
      normalizedInput.description =
        input.description?.trim() || null
    }

    if (input.evidence_type !== undefined) {
      const evidenceType =
        input.evidence_type.trim().toLowerCase() || 'texto'

      const allowedTypes = ['texto', 'imagem', 'pdf', 'link']

      if (!allowedTypes.includes(evidenceType)) {
        throw new Error(
          'Tipo de evidência inválido. Use texto, imagem, pdf ou link.',
        )
      }

      normalizedInput.evidence_type = evidenceType
    }

    if (input.file_url !== undefined) {
      normalizedInput.file_url = input.file_url?.trim() || null
    }

    if (input.external_url !== undefined) {
      normalizedInput.external_url =
        input.external_url?.trim() || null
    }

    const finalEvidenceType =
      normalizedInput.evidence_type ??
      existingEvidence.evidence_type

    const finalFileUrl =
      normalizedInput.file_url !== undefined
        ? normalizedInput.file_url
        : existingEvidence.file_url

    const finalExternalUrl =
      normalizedInput.external_url !== undefined
        ? normalizedInput.external_url
        : existingEvidence.external_url

    if (
      (finalEvidenceType === 'imagem' ||
        finalEvidenceType === 'pdf') &&
      !finalFileUrl
    ) {
      throw new Error(
        'Uma URL de arquivo é obrigatória para evidências de imagem ou PDF.',
      )
    }

    if (
      finalEvidenceType === 'link' &&
      !finalExternalUrl
    ) {
      throw new Error(
        'Uma URL externa é obrigatória para evidências do tipo link.',
      )
    }

    return evidencesRepository.update(id, normalizedInput)
  }

  async delete(id: string): Promise<void> {
    if (!id?.trim()) {
      throw new Error('ID da evidência é obrigatório.')
    }

    const existingEvidence = await evidencesRepository.findById(id)

    if (!existingEvidence) {
      throw new Error('Evidência não encontrada.')
    }

    await evidencesRepository.delete(id)
  }
}

export const evidencesService = new EvidencesService()