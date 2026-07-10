import {
  eventsRepository,
  type AgendaEvent,
  type CreateAgendaEventInput,
  type UpdateAgendaEventInput,
} from '@/lib/agenda/repository/events.repository'

class EventsService {
  async listAll(): Promise<AgendaEvent[]> {
    return eventsRepository.findAll()
  }

  async getById(id: string): Promise<AgendaEvent> {
    if (!id?.trim()) {
      throw new Error('ID do evento é obrigatório.')
    }

    const event = await eventsRepository.findById(id)

    if (!event) {
      throw new Error('Evento não encontrado.')
    }

    return event
  }

  async listByUserId(userId: string): Promise<AgendaEvent[]> {
    if (!userId?.trim()) {
      throw new Error('ID do usuário é obrigatório.')
    }

    return eventsRepository.findByUserId(userId)
  }

  async listBySchoolId(schoolId: string): Promise<AgendaEvent[]> {
    if (!schoolId?.trim()) {
      throw new Error('ID da escola é obrigatório.')
    }

    return eventsRepository.findBySchoolId(schoolId)
  }

  async create(input: CreateAgendaEventInput): Promise<AgendaEvent> {
    const title = input.title?.trim()

    if (!title) {
      throw new Error('Título do evento é obrigatório.')
    }

    if (!input.start_at) {
      throw new Error('Data inicial do evento é obrigatória.')
    }

    const startAt = new Date(input.start_at)

    if (Number.isNaN(startAt.getTime())) {
      throw new Error('Data inicial do evento é inválida.')
    }

    if (input.end_at) {
      const endAt = new Date(input.end_at)

      if (Number.isNaN(endAt.getTime())) {
        throw new Error('Data final do evento é inválida.')
      }

      if (endAt < startAt) {
        throw new Error(
          'A data final não pode ser anterior à data inicial.',
        )
      }
    }

    return eventsRepository.create({
      ...input,
      title,
      event_type: input.event_type?.trim() || 'pedagogico',
      status: input.status?.trim() || 'planejado',
      priority: input.priority?.trim() || 'media',
    })
  }

  async update(
    id: string,
    input: UpdateAgendaEventInput,
  ): Promise<AgendaEvent> {
    if (!id?.trim()) {
      throw new Error('ID do evento é obrigatório.')
    }

    const existingEvent = await eventsRepository.findById(id)

    if (!existingEvent) {
      throw new Error('Evento não encontrado.')
    }

    const startAtValue = input.start_at ?? existingEvent.start_at
    const endAtValue =
      input.end_at !== undefined ? input.end_at : existingEvent.end_at

    const startAt = new Date(startAtValue)

    if (Number.isNaN(startAt.getTime())) {
      throw new Error('Data inicial do evento é inválida.')
    }

    if (endAtValue) {
      const endAt = new Date(endAtValue)

      if (Number.isNaN(endAt.getTime())) {
        throw new Error('Data final do evento é inválida.')
      }

      if (endAt < startAt) {
        throw new Error(
          'A data final não pode ser anterior à data inicial.',
        )
      }
    }

    const normalizedInput: UpdateAgendaEventInput = {
      ...input,
    }

    if (input.title !== undefined) {
      const title = input.title.trim()

      if (!title) {
        throw new Error('Título do evento não pode ficar vazio.')
      }

      normalizedInput.title = title
    }

    if (input.event_type !== undefined) {
      normalizedInput.event_type =
        input.event_type.trim() || 'pedagogico'
    }

    if (input.status !== undefined) {
      normalizedInput.status = input.status.trim() || 'planejado'
    }

    if (input.priority !== undefined) {
      normalizedInput.priority = input.priority.trim() || 'media'
    }

    return eventsRepository.update(id, normalizedInput)
  }

  async delete(id: string): Promise<void> {
    if (!id?.trim()) {
      throw new Error('ID do evento é obrigatório.')
    }

    const existingEvent = await eventsRepository.findById(id)

    if (!existingEvent) {
      throw new Error('Evento não encontrado.')
    }

    await eventsRepository.delete(id)
  }
}

export const eventsService = new EventsService()