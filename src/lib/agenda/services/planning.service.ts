import {
  planningRepository,
  type AgendaPlanning,
  type CreateAgendaPlanningInput,
  type UpdateAgendaPlanningInput,
} from '@/lib/agenda/repository/planning.repository'

class PlanningService {
  async listAll(): Promise<AgendaPlanning[]> {
    return planningRepository.findAll()
  }

  async getById(id: string): Promise<AgendaPlanning> {
    if (!id?.trim()) {
      throw new Error('ID do planejamento é obrigatório.')
    }

    const planning = await planningRepository.findById(id)

    if (!planning) {
      throw new Error('Planejamento não encontrado.')
    }

    return planning
  }

  async create(
    input: CreateAgendaPlanningInput,
  ): Promise<AgendaPlanning> {
    const title = input.title?.trim()

    if (!title) {
      throw new Error('Título do planejamento é obrigatório.')
    }

    if (input.planned_date) {
      const plannedDate = new Date(input.planned_date)

      if (Number.isNaN(plannedDate.getTime())) {
        throw new Error('Data do planejamento é inválida.')
      }
    }

    return planningRepository.create({
      ...input,
      title,
      status: input.status?.trim() || 'rascunho',
      subject: input.subject?.trim() || null,
      class_name: input.class_name?.trim() || null,
      objective: input.objective?.trim() || null,
      methodology: input.methodology?.trim() || null,
      resources: input.resources?.trim() || null,
      evaluation: input.evaluation?.trim() || null,
    })
  }

  async update(
    id: string,
    input: UpdateAgendaPlanningInput,
  ): Promise<AgendaPlanning> {
    if (!id?.trim()) {
      throw new Error('ID do planejamento é obrigatório.')
    }

    const existingPlanning = await planningRepository.findById(id)

    if (!existingPlanning) {
      throw new Error('Planejamento não encontrado.')
    }

    const normalizedInput: UpdateAgendaPlanningInput = {
      ...input,
    }

    if (input.title !== undefined) {
      const title = input.title.trim()

      if (!title) {
        throw new Error(
          'Título do planejamento não pode ficar vazio.',
        )
      }

      normalizedInput.title = title
    }

    if (input.status !== undefined) {
      normalizedInput.status = input.status.trim() || 'rascunho'
    }

    if (input.subject !== undefined) {
      normalizedInput.subject = input.subject?.trim() || null
    }

    if (input.class_name !== undefined) {
      normalizedInput.class_name = input.class_name?.trim() || null
    }

    if (input.objective !== undefined) {
      normalizedInput.objective = input.objective?.trim() || null
    }

    if (input.methodology !== undefined) {
      normalizedInput.methodology =
        input.methodology?.trim() || null
    }

    if (input.resources !== undefined) {
      normalizedInput.resources = input.resources?.trim() || null
    }

    if (input.evaluation !== undefined) {
      normalizedInput.evaluation = input.evaluation?.trim() || null
    }

    if (input.planned_date) {
      const plannedDate = new Date(input.planned_date)

      if (Number.isNaN(plannedDate.getTime())) {
        throw new Error('Data do planejamento é inválida.')
      }
    }

    return planningRepository.update(id, normalizedInput)
  }

  async delete(id: string): Promise<void> {
    if (!id?.trim()) {
      throw new Error('ID do planejamento é obrigatório.')
    }

    const existingPlanning = await planningRepository.findById(id)

    if (!existingPlanning) {
      throw new Error('Planejamento não encontrado.')
    }

    await planningRepository.delete(id)
  }
}

export const planningService = new PlanningService()