import {
  TasksRepository,
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

export class TasksService {
  private readonly repository: TasksRepository

  constructor(repository: TasksRepository = tasksRepository) {
    this.repository = repository
  }

  /**
   * Uso administrativo interno.
   * Não deve ser utilizado diretamente em rotas de usuários.
   */
  async listAll(): Promise<AgendaTask[]> {
    return this.repository.findAll()
  }

  async listByUserId(
    userId: string,
  ): Promise<AgendaTask[]> {
    const normalizedUserId =
      normalizeRequiredId(
        userId,
        'ID do usuário',
      )

    return this.repository.findByUserId(
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
      await this.repository.findById(
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
      await this.repository.findOwnedById(
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

    return this.repository.create(
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

    return this.repository.create(
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
      await this.repository.findById(
        normalizedId,
      )

    if (!existingTask) {
      throw new Error(
        'Tarefa não encontrada.',
      )
    }

    const normalizedInput =
      normalizeUpdateInput(input)

    return this.repository.update(
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
      await this.repository.findOwnedById(
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
      await this.repository.updateOwned(
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
      await this.repository.findById(
        normalizedId,
      )

    if (!existingTask) {
      throw new Error(
        'Tarefa não encontrada.',
      )
    }

    await this.repository.delete(
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
      await this.repository.deleteOwned(
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
