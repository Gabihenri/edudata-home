import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export type AgendaHistoryItemType =
  | 'evento'
  | 'planejamento'
  | 'evidencia'
  | 'tarefa'

export type AgendaHistoryItem = {
  id: string
  type: AgendaHistoryItemType
  title: string
  description: string | null
  occurred_at: string
  status: string | null
  category: string | null
  school_id: string | null
  user_id: string | null
  class_name: string | null
  subject: string | null
  file_url: string | null
  external_url: string | null
  source_id: string
}

export type AgendaHistoryFilters = {
  startDate?: string | null
  endDate?: string | null
  userId?: string | null
  schoolId?: string | null
  type?: AgendaHistoryItemType | null
  search?: string | null
  limit?: number
}

type AgendaEventRow = {
  id: string
  title: string
  description: string | null
  event_type: string
  start_at: string
  status: string
  school_id: string | null
  user_id: string | null
}

type AgendaPlanningRow = {
  id: string
  title: string
  description: string | null
  subject: string | null
  class_name: string | null
  planned_date: string | null
  status: string
  school_id: string | null
  user_id: string | null
  created_at: string
}

type AgendaEvidenceRow = {
  id: string
  title: string
  description: string | null
  evidence_type: string
  file_url: string | null
  external_url: string | null
  school_id: string | null
  user_id: string | null
  created_at: string
}

type AgendaTaskRow = {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  due_date: string | null
  school_id: string | null
  user_id: string | null
  created_at: string
}

function createSupabaseClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error('Variáveis do Supabase não configuradas.')
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

function normalizeDateBoundary(
  value: string | null | undefined,
  endOfDay = false,
): string | null {
  if (!value?.trim()) {
    return null
  }

  const normalizedValue = value.trim()

  if (normalizedValue.includes('T')) {
    const date = new Date(normalizedValue)

    if (Number.isNaN(date.getTime())) {
      throw new Error('Data do filtro é inválida.')
    }

    return date.toISOString()
  }

  const suffix = endOfDay ? 'T23:59:59.999Z' : 'T00:00:00.000Z'
  const date = new Date(`${normalizedValue}${suffix}`)

  if (Number.isNaN(date.getTime())) {
    throw new Error('Data do filtro é inválida.')
  }

  return date.toISOString()
}

function matchesSearch(
  item: AgendaHistoryItem,
  search: string | null | undefined,
): boolean {
  const normalizedSearch = search?.trim().toLowerCase()

  if (!normalizedSearch) {
    return true
  }

  const searchableContent = [
    item.title,
    item.description,
    item.category,
    item.status,
    item.class_name,
    item.subject,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  return searchableContent.includes(normalizedSearch)
}

class HistoryRepository {
  private get client(): SupabaseClient {
    return createSupabaseClient()
  }

  async findAll(
    filters: AgendaHistoryFilters = {},
  ): Promise<AgendaHistoryItem[]> {
    const startDate = normalizeDateBoundary(filters.startDate)
    const endDate = normalizeDateBoundary(filters.endDate, true)
    const limit =
      Number.isInteger(filters.limit) && Number(filters.limit) > 0
        ? Math.min(Number(filters.limit), 500)
        : 100

    const [
      eventsResult,
      planningResult,
      evidencesResult,
      tasksResult,
    ] = await Promise.all([
      this.loadEvents(filters),
      this.loadPlanning(filters),
      this.loadEvidences(filters),
      this.loadTasks(filters),
    ])

    const history: AgendaHistoryItem[] = [
      ...eventsResult,
      ...planningResult,
      ...evidencesResult,
      ...tasksResult,
    ]
      .filter((item) => {
        const occurredAt = new Date(item.occurred_at).getTime()

        if (Number.isNaN(occurredAt)) {
          return false
        }

        if (startDate && occurredAt < new Date(startDate).getTime()) {
          return false
        }

        if (endDate && occurredAt > new Date(endDate).getTime()) {
          return false
        }

        if (filters.type && item.type !== filters.type) {
          return false
        }

        return matchesSearch(item, filters.search)
      })
      .sort(
        (first, second) =>
          new Date(second.occurred_at).getTime() -
          new Date(first.occurred_at).getTime(),
      )
      .slice(0, limit)

    return history
  }

  private async loadEvents(
    filters: AgendaHistoryFilters,
  ): Promise<AgendaHistoryItem[]> {
    let query = this.client
      .from('agenda_events')
      .select(
        'id, title, description, event_type, start_at, status, school_id, user_id',
      )

    if (filters.userId) {
      query = query.eq('user_id', filters.userId)
    }

    if (filters.schoolId) {
      query = query.eq('school_id', filters.schoolId)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(
        `Erro ao carregar eventos do histórico: ${error.message}`,
      )
    }

    return ((data ?? []) as AgendaEventRow[]).map((event) => ({
      id: `evento-${event.id}`,
      type: 'evento',
      title: event.title,
      description: event.description,
      occurred_at: event.start_at,
      status: event.status,
      category: event.event_type,
      school_id: event.school_id,
      user_id: event.user_id,
      class_name: null,
      subject: null,
      file_url: null,
      external_url: null,
      source_id: event.id,
    }))
  }

  private async loadPlanning(
    filters: AgendaHistoryFilters,
  ): Promise<AgendaHistoryItem[]> {
    let query = this.client
      .from('agenda_planning')
      .select(
        'id, title, description, subject, class_name, planned_date, status, school_id, user_id, created_at',
      )

    if (filters.userId) {
      query = query.eq('user_id', filters.userId)
    }

    if (filters.schoolId) {
      query = query.eq('school_id', filters.schoolId)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(
        `Erro ao carregar planejamentos do histórico: ${error.message}`,
      )
    }

    return ((data ?? []) as AgendaPlanningRow[]).map((planning) => ({
      id: `planejamento-${planning.id}`,
      type: 'planejamento',
      title: planning.title,
      description: planning.description,
      occurred_at: planning.planned_date
        ? `${planning.planned_date}T00:00:00.000Z`
        : planning.created_at,
      status: planning.status,
      category: 'planejamento',
      school_id: planning.school_id,
      user_id: planning.user_id,
      class_name: planning.class_name,
      subject: planning.subject,
      file_url: null,
      external_url: null,
      source_id: planning.id,
    }))
  }

  private async loadEvidences(
    filters: AgendaHistoryFilters,
  ): Promise<AgendaHistoryItem[]> {
    let query = this.client
      .from('agenda_evidences')
      .select(
        'id, title, description, evidence_type, file_url, external_url, school_id, user_id, created_at',
      )

    if (filters.userId) {
      query = query.eq('user_id', filters.userId)
    }

    if (filters.schoolId) {
      query = query.eq('school_id', filters.schoolId)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(
        `Erro ao carregar evidências do histórico: ${error.message}`,
      )
    }

    return ((data ?? []) as AgendaEvidenceRow[]).map((evidence) => ({
      id: `evidencia-${evidence.id}`,
      type: 'evidencia',
      title: evidence.title,
      description: evidence.description,
      occurred_at: evidence.created_at,
      status: null,
      category: evidence.evidence_type,
      school_id: evidence.school_id,
      user_id: evidence.user_id,
      class_name: null,
      subject: null,
      file_url: evidence.file_url,
      external_url: evidence.external_url,
      source_id: evidence.id,
    }))
  }

  private async loadTasks(
    filters: AgendaHistoryFilters,
  ): Promise<AgendaHistoryItem[]> {
    let query = this.client
      .from('agenda_tasks')
      .select(
        'id, title, description, status, priority, due_date, school_id, user_id, created_at',
      )

    if (filters.userId) {
      query = query.eq('user_id', filters.userId)
    }

    if (filters.schoolId) {
      query = query.eq('school_id', filters.schoolId)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(
        `Erro ao carregar tarefas do histórico: ${error.message}`,
      )
    }

    return ((data ?? []) as AgendaTaskRow[]).map((task) => ({
      id: `tarefa-${task.id}`,
      type: 'tarefa',
      title: task.title,
      description: task.description,
      occurred_at: task.due_date ?? task.created_at,
      status: task.status,
      category: task.priority,
      school_id: task.school_id,
      user_id: task.user_id,
      class_name: null,
      subject: null,
      file_url: null,
      external_url: null,
      source_id: task.id,
    }))
  }
}

export const historyRepository = new HistoryRepository()