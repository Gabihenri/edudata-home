import {
  planningRepository,
  type AgendaPlanning,
  type CreateAgendaPlanningInput,
  type UpdateAgendaPlanningInput,
} from '@/lib/agenda/repository/planning.repository'

function normalizeRequiredId(
  value: string | undefined,
  fieldName: string,
): string {
  const normalizedValue = value?.trim()

  if (!normalizedValue) {
    throw new Error(`${fieldName} é obrigatório.`)
  }

  return normalizedValue
}

function normalizeCreateInput(
  input: CreateAgendaPlanningInput,
): CreateAgendaPlanningInput {
  const title = input.title?.trim()

  if (!title) {
    throw new Error(
      'Título do planejamento é obrigatório.',
    )
  }

  if (input.planned_date) {
    const plannedDate = new Date(
      input.planned_date,
    )

    if (Number.isNaN(plannedDate.getTime())) {
      throw new Error(
        'Data do planejamento é inválida.',
      )
    }
  }

  return {
    ...input,

    title,

    description:
      input.description?.trim() || null,

    status:
      input.status?.trim() || 'rascunho',

    subject:
      input.subject?.trim() || null,

    class_name:
      input.class_name?.trim() || null,

    objective:
      input.objective?.trim() || null,

    methodology:
      input.methodology?.trim() || null,

    resources:
      input.resources?.trim() || null,

    evaluation:
      input.evaluation?.trim() || null,

    school_id:
      input.school_id?.trim() || null,

    user_id:
      input.user_id?.trim() || null,
  }
}

function normalizeUpdateInput(
  input: UpdateAgendaPlanningInput,
): UpdateAgendaPlanningInput {
  const normalizedInput:
    UpdateAgendaPlanningInput = {
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

  if (input.description !== undefined) {
    normalizedInput.description =
      input.description?.trim() || null
  }

  if (input.status !== undefined) {
    normalizedInput.status =
      input.status.trim() || 'rascunho'
  }

  if (input.subject !== undefined) {
    normalizedInput.subject =
      input.subject?.trim() || null
  }

  if (input.class_name !== undefined) {
    normalizedInput.class_name =
      input.class_name?.trim() || null
  }

  if (input.objective !== undefined) {
    normalizedInput.objective =
      input.objective?.trim() || null
  }

  if (input.methodology !== undefined) {
    normalizedInput.methodology =
      input.methodology?.trim() || null
  }

  if (input.resources !== undefined) {
    normalizedInput.resources =
      input.resources?.trim() || null
  }

  if (input.evaluation !== undefined) {
    normalizedInput.evaluation =
      input.evaluation?.trim() || null
  }

  if (input.school_id !== undefined) {
    normalizedInput.school_id =
      input.school_id?.trim() || null
  }

  if (input.planned_date) {
    const plannedDate = new Date(
      input.planned_date,
    )

    if (Number.isNaN(plannedDate.getTime())) {
      throw new Error(
        'Data do planejamento é inválida.',
      )
    }
  }

  return normalizedInput
}

class PlanningService {
  /**
   * Uso administrativo interno.
   * Não utilizar diretamente em rotas comuns.
   */
  async listAll(): Promise<
    AgendaPlanning[]
  > {
    return planningRepository.findAll()
  }

  async listByUserId(
    userId: string,
  ): Promise<AgendaPlanning[]> {
    const normalizedUserId =
      normalizeRequiredId(
        userId,
        'ID do usuário',
      )

    return planningRepository.findByUserId(
      normalizedUserId,
    )
  }

  /**
   * Uso administrativo interno.
   * Em rotas autenticadas, utilizar getOwnedById.
   */
  async getById(
    id: string,
  ): Promise<AgendaPlanning> {
    const normalizedId =
      normalizeRequiredId(
        id,
        'ID do planejamento',
      )

    const planning =
      await planningRepository.findById(
        normalizedId,
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
  ): Promise<AgendaPlanning> {
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
      await planningRepository.findOwnedById(
        normalizedId,
        normalizedUserId,
      )

    if (!planning) {
      throw new Error(
        'Planejamento não encontrado ou sem permissão de acesso.',
      )
    }

    return planning
  }

  async create(
    input: CreateAgendaPlanningInput,
  ): Promise<AgendaPlanning> {
    const normalizedInput =
      normalizeCreateInput(input)

    return planningRepository.create(
      normalizedInput,
    )
  }

  async createOwned(
    userId: string,
    input: CreateAgendaPlanningInput,
  ): Promise<AgendaPlanning> {
    const normalizedUserId =
      normalizeRequiredId(
        userId,
        'ID do usuário',
      )

    const normalizedInput =
      normalizeCreateInput({
        ...input,
        user_id: normalizedUserId,
      })

    return planningRepository.create(
      normalizedInput,
    )
  }

  /**
   * Uso administrativo interno.
   * Em rotas autenticadas, utilizar updateOwned.
   */
  async update(
    id: string,
    input: UpdateAgendaPlanningInput,
  ): Promise<AgendaPlanning> {
    const normalizedId =
      normalizeRequiredId(
        id,
        'ID do planejamento',
      )

    const existingPlanning =
      await planningRepository.findById(
        normalizedId,
      )

    if (!existingPlanning) {
      throw new Error(
        'Planejamento não encontrado.',
      )
    }

    const normalizedInput =
      normalizeUpdateInput(input)

    return planningRepository.update(
      normalizedId,
      normalizedInput,
    )
  }

  async updateOwned(
    id: string,
    userId: string,
    input: UpdateAgendaPlanningInput,
  ): Promise<AgendaPlanning> {
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

    const existingPlanning =
      await planningRepository.findOwnedById(
        normalizedId,
        normalizedUserId,
      )

    if (!existingPlanning) {
      throw new Error(
        'Planejamento não encontrado ou sem permissão de alteração.',
      )
    }

    const normalizedInput =
      normalizeUpdateInput(input)

    /*
     * O proprietário do planejamento não pode
     * ser alterado por dados enviados pelo navegador.
     */
    delete normalizedInput.user_id

    const updatedPlanning =
      await planningRepository.updateOwned(
        normalizedId,
        normalizedUserId,
        normalizedInput,
      )

    if (!updatedPlanning) {
      throw new Error(
        'Planejamento não encontrado ou sem permissão de alteração.',
      )
    }

    return updatedPlanning
  }

  /**
   * Uso administrativo interno.
   * Em rotas autenticadas, utilizar deleteOwned.
   */
  async delete(
    id: string,
  ): Promise<void> {
    const normalizedId =
      normalizeRequiredId(
        id,
        'ID do planejamento',
      )

    const existingPlanning =
      await planningRepository.findById(
        normalizedId,
      )

    if (!existingPlanning) {
      throw new Error(
        'Planejamento não encontrado.',
      )
    }

    await planningRepository.delete(
      normalizedId,
    )
  }

  async deleteOwned(
    id: string,
    userId: string,
  ): Promise<void> {
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

    const deleted =
      await planningRepository.deleteOwned(
        normalizedId,
        normalizedUserId,
      )

    if (!deleted) {
      throw new Error(
        'Planejamento não encontrado ou sem permissão de exclusão.',
      )
    }
  }
}

export const planningService =
  new PlanningService()