import {
  createClient,
  type SupabaseClient,
} from '@supabase/supabase-js'

export type AgendaEventAuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'restore'

export type AgendaEventAuditChange = {
  field: string
  before: unknown
  after: unknown
}

export type AgendaEventAuditEntry = {
  id: string

  event_id: string

  actor_user_id: string | null
  actor_role: string | null

  organization_id: string | null
  school_id: string | null

  action: AgendaEventAuditAction

  access_scope: string | null

  before_data:
    Record<string, unknown> | null

  after_data:
    Record<string, unknown> | null

  changes: AgendaEventAuditChange[]

  metadata:
    Record<string, unknown>

  occurred_at: string
}

type AgendaEventAuditRow = {
  id: string

  actor_user_id: string | null
  actor_role: string | null

  organization_id: string | null
  school_id: string | null

  action: string

  resource_id: string
  resource_owner_user_id: string | null

  access_scope: string | null
  success: boolean

  before_data: unknown
  after_data: unknown
  metadata: unknown

  occurred_at: string
}

const TRACKED_EVENT_FIELDS = [
  'title',
  'description',
  'event_type',

  'start_at',
  'end_at',

  'status',
  'priority',

  'organization_id',
  'school_id',
  'user_id',

  'planning_id',
  'evidence_id',

  'schedule_mode',

  'recurrence_frequency',
  'recurrence_interval',
  'recurrence_until',

  'series_id',
  'source_template_id',

  'week_reference',
  'original_start_at',

  'is_exception',

  'deleted_at',
  'deleted_by',
  'deletion_reason',

  'restored_at',
  'restored_by',
  'restore_reason',
] as const

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
        detectSessionInUrl: false,
      },
    },
  )
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  )
}

function normalizeRecord(
  value: unknown,
): Record<string, unknown> | null {
  return isRecord(value)
    ? value
    : null
}

function normalizeMetadata(
  value: unknown,
): Record<string, unknown> {
  return isRecord(value)
    ? value
    : {}
}

function normalizeRows<T>(
  value: unknown,
): T[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value as T[]
}

function normalizeRequiredId(
  value: string,
  fieldName: string,
): string {
  const normalizedValue =
    value?.trim()

  if (!normalizedValue) {
    throw new Error(
      `${fieldName} é obrigatório.`,
    )
  }

  return normalizedValue
}

function normalizeLimit(
  value?: number,
): number {
  if (
    value === undefined
  ) {
    return 100
  }

  if (
    !Number.isInteger(value) ||
    value < 1
  ) {
    throw new Error(
      'O limite da auditoria deve ser um número inteiro positivo.',
    )
  }

  return Math.min(
    value,
    500,
  )
}

function isAuditAction(
  value: string,
): value is AgendaEventAuditAction {
  return (
    value === 'create' ||
    value === 'update' ||
    value === 'delete' ||
    value === 'restore'
  )
}

function areValuesEqual(
  firstValue: unknown,
  secondValue: unknown,
): boolean {
  if (
    Object.is(
      firstValue,
      secondValue,
    )
  ) {
    return true
  }

  try {
    return (
      JSON.stringify(
        firstValue,
      ) ===
      JSON.stringify(
        secondValue,
      )
    )
  } catch {
    return false
  }
}

function buildChanges(
  beforeData:
    Record<string, unknown> | null,

  afterData:
    Record<string, unknown> | null,
): AgendaEventAuditChange[] {
  const changes:
    AgendaEventAuditChange[] = []

  for (
    const field
    of TRACKED_EVENT_FIELDS
  ) {
    const beforeValue =
      beforeData?.[field] ??
      null

    const afterValue =
      afterData?.[field] ??
      null

    if (
      areValuesEqual(
        beforeValue,
        afterValue,
      )
    ) {
      continue
    }

    changes.push({
      field,
      before:
        beforeValue,

      after:
        afterValue,
    })
  }

  return changes
}

function assertAuditScope(
  eventId: string,
  resourceOwnerUserId: string,
): {
  eventId: string
  resourceOwnerUserId: string
} {
  return {
    eventId:
      normalizeRequiredId(
        eventId,
        'ID do evento',
      ),

    resourceOwnerUserId:
      normalizeRequiredId(
        resourceOwnerUserId,
        'ID do proprietário do evento',
      ),
  }
}

class EventAuditRepository {
  private get client():
    SupabaseClient {
    return createSupabaseClient()
  }

  async findByEventId(
    eventId: string,
    resourceOwnerUserId: string,
    limit?: number,
  ): Promise<AgendaEventAuditEntry[]> {
    const scope =
      assertAuditScope(
        eventId,
        resourceOwnerUserId,
      )

    const normalizedLimit =
      normalizeLimit(
        limit,
      )

    const {
      data,
      error,
    } =
      await this.client
        .from(
          'identity_audit_logs',
        )
        .select(
          [
            'id',
            'actor_user_id',
            'actor_role',
            'organization_id',
            'school_id',
            'action',
            'resource_id',
            'resource_owner_user_id',
            'access_scope',
            'success',
            'before_data',
            'after_data',
            'metadata',
            'occurred_at',
          ].join(','),
        )
        .eq(
          'product_code',
          'agenda_edi',
        )
        .eq(
          'resource_type',
          'agenda_events',
        )
        .eq(
          'resource_id',
          scope.eventId,
        )
        .eq(
          'resource_owner_user_id',
          scope.resourceOwnerUserId,
        )
        .eq(
          'success',
          true,
        )
        .in(
          'action',
          [
            'create',
            'update',
            'delete',
            'restore',
          ],
        )
        .order(
          'occurred_at',
          {
            ascending: false,
          },
        )
        .limit(
          normalizedLimit,
        )

    if (error) {
      throw new Error(
        `Erro ao carregar versões do evento: ${error.message}`,
      )
    }

    return normalizeRows<
      AgendaEventAuditRow
    >(data)
      .filter(
        (row) =>
          isAuditAction(
            row.action,
          ),
      )
      .map(
        (row) => {
          const beforeData =
            normalizeRecord(
              row.before_data,
            )

          const afterData =
            normalizeRecord(
              row.after_data,
            )

          return {
            id:
              row.id,

            event_id:
              row.resource_id,

            actor_user_id:
              row.actor_user_id,

            actor_role:
              row.actor_role,

            organization_id:
              row.organization_id,

            school_id:
              row.school_id,

            action:
              row.action as
                AgendaEventAuditAction,

            access_scope:
              row.access_scope,

            before_data:
              beforeData,

            after_data:
              afterData,

            changes:
              buildChanges(
                beforeData,
                afterData,
              ),

            metadata:
              normalizeMetadata(
                row.metadata,
              ),

            occurred_at:
              row.occurred_at,
          }
        },
      )
  }
}

export const eventAuditRepository =
  new EventAuditRepository()