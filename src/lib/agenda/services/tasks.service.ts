import {
  tasksRepository,
  type AgendaTask,
  type CreateAgendaTaskInput,
  type UpdateAgendaTaskInput,
} from '@/lib/agenda/repository/tasks.repository'

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

function normalizeTaskInput(
  input: CreateAgendaTaskInput,
): CreateAgendaTaskInput {
  const title = input.title?.trim()

  if (!title) {
    throw new Error(
      'Título da tarefa é obrigatório.',
    )
  }

  if (input.due_date) {
    const dueDate = new Date(input.due_date)

    if (Number.isNaN(dueDate.getTime())) {
      throw new Error(
        'Prazo da tarefa é inválido.',
      )
    }
  }

  return {
    ...input,
    title,
    description:
      input.description?.trim() || null,
    status:
      input.status?.trim() || 'pendente',
    priority:
      input.priority?.trim() || 'media',
  }
}

function normalizeUpdateInput(
  input: UpdateAgendaTaskInput,
): UpdateAgendaTaskInput {
  const normalizedInput: UpdateAgendaTaskInput = {
    ...input,
  }

  if (input.title !== undefined) {
    const title = input.title.trim()

    if (!title) {
      throw new Error(
        'Título da tarefa não pode ficar vazio.',
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
      input.status.trim() || 'pendente'
  }

  if (input.priority !== undefined) {
    normalizedInput.priority =
      input.priority.trim() || 'media'
  }

  if (input.due_date) {
    const dueDate = new Date(input.due_date)

    if (Number.isNaN(dueDate.getTime())) {
      throw new Error(
        'Prazo da tarefa é inválido.',
      )
    }
  }

  return normalizedInput
}

class TasksService {
  /**
   * Uso administrativo interno.
   * Não deve ser utilizado diretamente em rotas de usuários.
   */
  async listAll(): Promise<AgendaTask[]> {
    return tasksRepository.findAll()
  }

  async listByUserId(
    userId: string,
  ): Promise<AgendaTask[]> {
    const normalizedUserId =
      normalizeRequiredId(
        userId,
        'ID do usuário',
      )

    return tasksRepository.findByUserId(
      normalizedUserId,
    )
  }

  /**
   * Uso administrativo interno.
   * Nas rotas autenticadas, utilizar getOwnedById.
   */
  async getById(
    id: string,
  ): Promise<AgendaTask> {
    const normalizedId =
      normalizeRequiredId(
        id,
        'ID da tarefa',
      )

    const task =
      await tasksRepository.findById(
        normalizedId,
      )

    if (!task) {
      throw new Error(
        'Tarefa não encontrada.',
      )
    }

    return task
  }

  async getOwnedById(
    id: string,
    userId: string,
  ): Promise<AgendaTask> {
    const normalizedId =
      normalizeRequiredId(
        id,
        'ID da tarefa',
      )

    const normalizedUserId =
      normalizeRequiredId(
        userId,
        'ID do usuário',
      )

    const task =
      await tasksRepository.findOwnedById(
        normalizedId,
        normalizedUserId,
      )

    if (!task) {
      throw new Error(
        'Tarefa não encontrada ou sem permissão de acesso.',
      )
    }

    return task
  }

  async create(
    input: CreateAgendaTaskInput,
  ): Promise<AgendaTask> {
    const normalizedInput =
      normalizeTaskInput(input)

    return tasksRepository.create(
      normalizedInput,
    )
  }

  async createOwned(
    userId: string,
    input: CreateAgendaTaskInput,
  ): Promise<AgendaTask> {
    const normalizedUserId =
      normalizeRequiredId(
        userId,
        'ID do usuário',
      )

    const normalizedInput =
      normalizeTaskInput({
        ...input,
        user_id: normalizedUserId,
      })

    return tasksRepository.create(
      normalizedInput,
    )
  }

  /**
   * Uso administrativo interno.
   * Nas rotas autenticadas, utilizar updateOwned.
   */
  async update(
    id: string,
    input: UpdateAgendaTaskInput,
  ): Promise<AgendaTask> {
    const normalizedId =
      normalizeRequiredId(
        id,
        'ID da tarefa',
      )

    const existingTask =
      await tasksRepository.findById(
        normalizedId,
      )

    if (!existingTask) {
      throw new Error(
        'Tarefa não encontrada.',
      )
    }

    const normalizedInput =
      normalizeUpdateInput(input)

    return tasksRepository.update(
      normalizedId,
      normalizedInput,
    )
  }

  async updateOwned(
    id: string,
    userId: string,
    input: UpdateAgendaTaskInput,
  ): Promise<AgendaTask> {
    const normalizedId =
      normalizeRequiredId(
        id,
        'ID da tarefa',
      )

    const normalizedUserId =
      normalizeRequiredId(
        userId,
        'ID do usuário',
      )

    const existingTask =
      await tasksRepository.findOwnedById(
        normalizedId,
        normalizedUserId,
      )

    if (!existingTask) {
      throw new Error(
        'Tarefa não encontrada ou sem permissão de alteração.',
      )
    }

    const normalizedInput =
      normalizeUpdateInput(input)

    /*
     * O proprietário da tarefa não pode ser alterado
     * pela atualização enviada pelo navegador.
     */
    delete normalizedInput.user_id

    const updatedTask =
      await tasksRepository.updateOwned(
        normalizedId,
        normalizedUserId,
        normalizedInput,
      )

    if (!updatedTask) {
      throw new Error(
        'Tarefa não encontrada ou sem permissão de alteração.',
      )
    }

    return updatedTask
  }

  /**
   * Uso administrativo interno.
   * Nas rotas autenticadas, utilizar deleteOwned.
   */
  async delete(
    id: string,
  ): Promise<void> {
    const normalizedId =
      normalizeRequiredId(
        id,
        'ID da tarefa',
      )

    const existingTask =
      await tasksRepository.findById(
        normalizedId,
      )

    if (!existingTask) {
      throw new Error(
        'Tarefa não encontrada.',
      )
    }

    await tasksRepository.delete(
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
        'ID da tarefa',
      )

    const normalizedUserId =
      normalizeRequiredId(
        userId,
        'ID do usuário',
      )

    const deleted =
      await tasksRepository.deleteOwned(
        normalizedId,
        normalizedUserId,
      )

    if (!deleted) {
      throw new Error(
        'Tarefa não encontrada ou sem permissão de exclusão.',
      )
    }
  }
}

export const tasksService =
  new TasksService()