import {
  createClient,
  type SupabaseClient,
} from '@supabase/supabase-js'

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
  source_occurred_at: string

  status: string | null
  category: string | null

  school_id: string | null
  user_id: string | null

  class_name: string | null
  subject: string | null

  file_url: string | null
  external_url: string | null

  source_id: string

  is_deleted: boolean
  deleted_at: string | null
  deleted_by: string | null
  deletion_reason: string | null
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

type GovernanceFields = {
  deleted_at: string | null
  deleted_by: string | null
  deletion_reason: string | null
}

type AgendaEventRow =
  GovernanceFields & {
    id: string
    title: string
    description: string | null

    event_type: string
    start_at: string
    status: string

    school_id: string | null
    user_id: string | null
  }

type AgendaPlanningRow =
  GovernanceFields & {
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

type AgendaEvidenceRow =
  GovernanceFields & {
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

type AgendaTaskRow =
  GovernanceFields & {
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

function createSupabaseClient():
  SupabaseClient {
  const url =
    process.env
      .NEXT_PUBLIC_SUPABASE_URL

  const key =
    process.env
      .SUPABASE_SERVICE_ROLE_KEY ??
    process.env
      .NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error(
      'Variáveis do Supabase não configuradas.',
    )
  }

  return createClient(
    url,
    key,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  )
}

function normalizeOptionalText(
  value: string | null | undefined,
): string | null {
  if (!value) {
    return null
  }

  const normalizedValue =
    value.trim()

  return normalizedValue || null
}

function normalizeDateBoundary(
  value: string | null | undefined,
  endOfDay = false,
): string | null {
  const normalizedValue =
    normalizeOptionalText(value)

  if (!normalizedValue) {
    return null
  }

  if (
    normalizedValue.includes('T')
  ) {
    const date =
      new Date(normalizedValue)

    if (
      Number.isNaN(
        date.getTime(),
      )
    ) {
      throw new Error(
        'Data do filtro é inválida.',
      )
    }

    return date.toISOString()
  }

  const suffix =
    endOfDay
      ? 'T23:59:59.999Z'
      : 'T00:00:00.000Z'

  const date =
    new Date(
      `${normalizedValue}${suffix}`,
    )

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    throw new Error(
      'Data do filtro é inválida.',
    )
  }

  return date.toISOString()
}

function normalizePlanningDate(
  plannedDate: string | null,
  createdAt: string,
): string {
  if (!plannedDate) {
    return createdAt
  }

  if (
    plannedDate.includes('T')
  ) {
    return plannedDate
  }

  return `${plannedDate}T00:00:00.000Z`
}

function normalizeTaskDate(
  dueDate: string | null,
  createdAt: string,
): string {
  if (!dueDate) {
    return createdAt
  }

  if (
    dueDate.includes('T')
  ) {
    return dueDate
  }

  return `${dueDate}T00:00:00.000Z`
}

function getHistoryOccurrence(
  sourceOccurredAt: string,
  deletedAt: string | null,
): string {
  return (
    deletedAt ??
    sourceOccurredAt
  )
}

function getHistoryStatus(
  status: string | null,
  deletedAt: string | null,
): string | null {
  if (deletedAt) {
    return 'excluido'
  }

  return status
}

function matchesSearch(
  item: AgendaHistoryItem,
  search: string | null | undefined,
): boolean {
  const normalizedSearch =
    search
      ?.trim()
      .toLowerCase()

  if (!normalizedSearch) {
    return true
  }

  const deletionTerms =
    item.is_deleted
      ? 'excluido excluído removido exclusao exclusão'
      : 'ativo'

  const searchableContent = [
    item.title,
    item.description,
    item.category,
    item.status,
    item.class_name,
    item.subject,
    item.deletion_reason,
    deletionTerms,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  return searchableContent.includes(
    normalizedSearch,
  )
}

function assertHistoryScope(
  filters: AgendaHistoryFilters,
): void {
  const userId =
    normalizeOptionalText(
      filters.userId,
    )

  const schoolId =
    normalizeOptionalText(
      filters.schoolId,
    )

  if (!userId && !schoolId) {
    throw new Error(
      'Escopo de consulta do histórico é obrigatório.',
    )
  }
}

class HistoryRepository {
  private get client():
    SupabaseClient {
    return createSupabaseClient()
  }

  async findAll(
    filters: AgendaHistoryFilters = {},
  ): Promise<AgendaHistoryItem[]> {
    assertHistoryScope(filters)

    const startDate =
      normalizeDateBoundary(
        filters.startDate,
      )

    const endDate =
      normalizeDateBoundary(
        filters.endDate,
        true,
      )

    const limit =
      Number.isInteger(
        filters.limit,
      ) &&
      Number(filters.limit) > 0
        ? Math.min(
            Number(filters.limit),
            500,
          )
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

    const history:
      AgendaHistoryItem[] = [
        ...eventsResult,
        ...planningResult,
        ...evidencesResult,
        ...tasksResult,
      ]
        .filter((item) => {
          const occurredAt =
            new Date(
              item.occurred_at,
            ).getTime()

          if (
            Number.isNaN(
              occurredAt,
            )
          ) {
            return false
          }

          if (
            startDate &&
            occurredAt <
              new Date(
                startDate,
              ).getTime()
          ) {
            return false
          }

          if (
            endDate &&
            occurredAt >
              new Date(
                endDate,
              ).getTime()
          ) {
            return false
          }

          if (
            filters.type &&
            item.type !==
              filters.type
          ) {
            return false
          }

          return matchesSearch(
            item,
            filters.search,
          )
        })
        .sort(
          (
            first,
            second,
          ) =>
            new Date(
              second.occurred_at,
            ).getTime() -
            new Date(
              first.occurred_at,
            ).getTime(),
        )
        .slice(
          0,
          limit,
        )

    return history
  }

  private async loadEvents(
    filters: AgendaHistoryFilters,
  ): Promise<AgendaHistoryItem[]> {
    let query =
      this.client
        .from(
          'agenda_events',
        )
        .select(
          [
            'id',
            'title',
            'description',
            'event_type',
            'start_at',
            'status',
            'school_id',
            'user_id',
            'deleted_at',
            'deleted_by',
            'deletion_reason',
          ].join(','),
        )

    if (filters.userId) {
      query =
        query.eq(
          'user_id',
          filters.userId,
        )
    }

    if (filters.schoolId) {
      query =
        query.eq(
          'school_id',
          filters.schoolId,
        )
    }

    const {
      data,
      error,
    } = await query

    if (error) {
      throw new Error(
        `Erro ao carregar eventos do histórico: ${error.message}`,
      )
    }

    return (
      (data ?? []) as AgendaEventRow[]
    ).map((event) => {
      const sourceOccurredAt =
        event.start_at

      return {
        id:
          `evento-${event.id}`,

        type:
          'evento',

        title:
          event.title,

        description:
          event.description,

        occurred_at:
          getHistoryOccurrence(
            sourceOccurredAt,
            event.deleted_at,
          ),

        source_occurred_at:
          sourceOccurredAt,

        status:
          getHistoryStatus(
            event.status,
            event.deleted_at,
          ),

        category:
          event.event_type,

        school_id:
          event.school_id,

        user_id:
          event.user_id,

        class_name:
          null,

        subject:
          null,

        file_url:
          null,

        external_url:
          null,

        source_id:
          event.id,

        is_deleted:
          Boolean(
            event.deleted_at,
          ),

        deleted_at:
          event.deleted_at,

        deleted_by:
          event.deleted_by,

        deletion_reason:
          event.deletion_reason,
      }
    })
  }

  private async loadPlanning(
    filters: AgendaHistoryFilters,
  ): Promise<AgendaHistoryItem[]> {
    let query =
      this.client
        .from(
          'agenda_planning',
        )
        .select(
          [
            'id',
            'title',
            'description',
            'subject',
            'class_name',
            'planned_date',
            'status',
            'school_id',
            'user_id',
            'created_at',
            'deleted_at',
            'deleted_by',
            'deletion_reason',
          ].join(','),
        )

    if (filters.userId) {
      query =
        query.eq(
          'user_id',
          filters.userId,
        )
    }

    if (filters.schoolId) {
      query =
        query.eq(
          'school_id',
          filters.schoolId,
        )
    }

    const {
      data,
      error,
    } = await query

    if (error) {
      throw new Error(
        `Erro ao carregar planejamentos do histórico: ${error.message}`,
      )
    }

    return (
      (data ?? []) as AgendaPlanningRow[]
    ).map((planning) => {
      const sourceOccurredAt =
        normalizePlanningDate(
          planning.planned_date,
          planning.created_at,
        )

      return {
        id:
          `planejamento-${planning.id}`,

        type:
          'planejamento',

        title:
          planning.title,

        description:
          planning.description,

        occurred_at:
          getHistoryOccurrence(
            sourceOccurredAt,
            planning.deleted_at,
          ),

        source_occurred_at:
          sourceOccurredAt,

        status:
          getHistoryStatus(
            planning.status,
            planning.deleted_at,
          ),

        category:
          'planejamento',

        school_id:
          planning.school_id,

        user_id:
          planning.user_id,

        class_name:
          planning.class_name,

        subject:
          planning.subject,

        file_url:
          null,

        external_url:
          null,

        source_id:
          planning.id,

        is_deleted:
          Boolean(
            planning.deleted_at,
          ),

        deleted_at:
          planning.deleted_at,

        deleted_by:
          planning.deleted_by,

        deletion_reason:
          planning.deletion_reason,
      }
    })
  }

  private async loadEvidences(
    filters: AgendaHistoryFilters,
  ): Promise<AgendaHistoryItem[]> {
    let query =
      this.client
        .from(
          'agenda_evidences',
        )
        .select(
          [
            'id',
            'title',
            'description',
            'evidence_type',
            'file_url',
            'external_url',
            'school_id',
            'user_id',
            'created_at',
            'deleted_at',
            'deleted_by',
            'deletion_reason',
          ].join(','),
        )

    if (filters.userId) {
      query =
        query.eq(
          'user_id',
          filters.userId,
        )
    }

    if (filters.schoolId) {
      query =
        query.eq(
          'school_id',
          filters.schoolId,
        )
    }

    const {
      data,
      error,
    } = await query

    if (error) {
      throw new Error(
        `Erro ao carregar evidências do histórico: ${error.message}`,
      )
    }

    return (
      (data ?? []) as AgendaEvidenceRow[]
    ).map((evidence) => {
      const sourceOccurredAt =
        evidence.created_at

      return {
        id:
          `evidencia-${evidence.id}`,

        type:
          'evidencia',

        title:
          evidence.title,

        description:
          evidence.description,

        occurred_at:
          getHistoryOccurrence(
            sourceOccurredAt,
            evidence.deleted_at,
          ),

        source_occurred_at:
          sourceOccurredAt,

        status:
          getHistoryStatus(
            null,
            evidence.deleted_at,
          ),

        category:
          evidence.evidence_type,

        school_id:
          evidence.school_id,

        user_id:
          evidence.user_id,

        class_name:
          null,

        subject:
          null,

        file_url:
          evidence.file_url,

        external_url:
          evidence.external_url,

        source_id:
          evidence.id,

        is_deleted:
          Boolean(
            evidence.deleted_at,
          ),

        deleted_at:
          evidence.deleted_at,

        deleted_by:
          evidence.deleted_by,

        deletion_reason:
          evidence.deletion_reason,
      }
    })
  }

  private async loadTasks(
    filters: AgendaHistoryFilters,
  ): Promise<AgendaHistoryItem[]> {
    let query =
      this.client
        .from(
          'agenda_tasks',
        )
        .select(
          [
            'id',
            'title',
            'description',
            'status',
            'priority',
            'due_date',
            'school_id',
            'user_id',
            'created_at',
            'deleted_at',
            'deleted_by',
            'deletion_reason',
          ].join(','),
        )

    if (filters.userId) {
      query =
        query.eq(
          'user_id',
          filters.userId,
        )
    }

    if (filters.schoolId) {
      query =
        query.eq(
          'school_id',
          filters.schoolId,
        )
    }

    const {
      data,
      error,
    } = await query

    if (error) {
      throw new Error(
        `Erro ao carregar tarefas do histórico: ${error.message}`,
      )
    }

    return (
      (data ?? []) as AgendaTaskRow[]
    ).map((task) => {
      const sourceOccurredAt =
        normalizeTaskDate(
          task.due_date,
          task.created_at,
        )

      return {
        id:
          `tarefa-${task.id}`,

        type:
          'tarefa',

        title:
          task.title,

        description:
          task.description,

        occurred_at:
          getHistoryOccurrence(
            sourceOccurredAt,
            task.deleted_at,
          ),

        source_occurred_at:
          sourceOccurredAt,

        status:
          getHistoryStatus(
            task.status,
            task.deleted_at,
          ),

        category:
          task.priority,

        school_id:
          task.school_id,

        user_id:
          task.user_id,

        class_name:
          null,

        subject:
          null,

        file_url:
          null,

        external_url:
          null,

        source_id:
          task.id,

        is_deleted:
          Boolean(
            task.deleted_at,
          ),

        deleted_at:
          task.deleted_at,

        deleted_by:
          task.deleted_by,

        deletion_reason:
          task.deletion_reason,
      }
    })
  }
}

export const historyRepository =
  new HistoryRepository()