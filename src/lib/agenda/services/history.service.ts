import {
  historyRepository,
  type AgendaHistoryFilters,
  type AgendaHistoryItem,
} from '@/lib/agenda/repository/history.repository'

class HistoryService {
  async list(
    filters: AgendaHistoryFilters = {},
  ): Promise<AgendaHistoryItem[]> {
    if (
      filters.startDate &&
      filters.endDate &&
      new Date(filters.startDate) > new Date(filters.endDate)
    ) {
      throw new Error(
        'A data inicial não pode ser maior que a data final.',
      )
    }

    return historyRepository.findAll(filters)
  }
}

export const historyService = new HistoryService()