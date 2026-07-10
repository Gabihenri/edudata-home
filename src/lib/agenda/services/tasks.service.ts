import {
  tasksRepository,
  type AgendaTask,
  type CreateAgendaTaskInput,
  type UpdateAgendaTaskInput,
} from '@/lib/agenda/repository/tasks.repository'

class TasksService {
  async listAll(): Promise<AgendaTask[]> {
    return tasksRepository.findAll()
  }

  async getById(id: string): Promise<AgendaTask> {
    if (!id?.trim()) {
      throw new Error('ID da tarefa é obrigatório.')
    }

    const task = await tasksRepository.findById(id)

    if (!task) {
      throw new Error('Tarefa não encontrada.')
    }

    return task
  }

  async create(input: CreateAgendaTaskInput): Promise<AgendaTask> {
    const title = input.title?.trim()

    if (!title) {
      throw new Error('Título da tarefa é obrigatório.')
    }

    if (input.due_date) {
      const dueDate = new Date(input.due_date)

      if (Number.isNaN(dueDate.getTime())) {
        throw new Error('Prazo da tarefa é inválido.')
      }
    }

    return tasksRepository.create({
      ...input,
      title,
      status: input.status?.trim() || 'pendente',
      priority: input.priority?.trim() || 'media',
    })
  }

  async update(
    id: string,
    input: UpdateAgendaTaskInput,
  ): Promise<AgendaTask> {
    if (!id?.trim()) {
      throw new Error('ID da tarefa é obrigatório.')
    }

    const existingTask = await tasksRepository.findById(id)

    if (!existingTask) {
      throw new Error('Tarefa não encontrada.')
    }

    const normalizedInput: UpdateAgendaTaskInput = {
      ...input,
    }

    if (input.title !== undefined) {
      const title = input.title.trim()

      if (!title) {
        throw new Error('Título da tarefa não pode ficar vazio.')
      }

      normalizedInput.title = title
    }

    if (input.status !== undefined) {
      normalizedInput.status = input.status.trim() || 'pendente'
    }

    if (input.priority !== undefined) {
      normalizedInput.priority = input.priority.trim() || 'media'
    }

    if (input.due_date) {
      const dueDate = new Date(input.due_date)

      if (Number.isNaN(dueDate.getTime())) {
        throw new Error('Prazo da tarefa é inválido.')
      }
    }

    return tasksRepository.update(id, normalizedInput)
  }

  async delete(id: string): Promise<void> {
    if (!id?.trim()) {
      throw new Error('ID da tarefa é obrigatório.')
    }

    const existingTask = await tasksRepository.findById(id)

    if (!existingTask) {
      throw new Error('Tarefa não encontrada.')
    }

    await tasksRepository.delete(id)
  }
}

export const tasksService = new TasksService()