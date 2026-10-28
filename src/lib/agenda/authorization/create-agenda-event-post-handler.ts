import type { AgendaEvent, CreateAgendaEventInput } from '@/lib/agenda'
import { createAfterAuthorization } from './create-after-authorization'

type ScheduleMode = 'pontual' | 'recorrente'

type CreateEventRequestBody = {
  title?: string
  description?: string | null
  eventType?: string
  startAt?: string
  endAt?: string | null
  status?: string
  priority?: string
  schoolId?: string | null
  planningId?: string | null
  evidenceId?: string | null
  scheduleMode?: ScheduleMode
  recurrenceFrequency?: 'none' | 'weekly'
  recurrenceInterval?: number
  recurrenceUntil?: string | null
  sourceTemplateId?: string | null
  weekReference?: string | null
}

type AuthenticatedUser = { id: string }

type JsonResponse = (body: unknown, init?: ResponseInit) => Response

export type AgendaEventPostDependencies = {
  requireSessionUser: () => Promise<AuthenticatedUser>
  requireFeatureAccess: (args: {
    userId: string
    featureCode: 'agenda.events' | 'agenda.recurring'
    options: { includeUsage: true }
  }) => Promise<unknown>
  normalizeSchoolId: (value: unknown) => string | null
  assertActiveSchoolMembership: (userId: string, schoolId: string | null) => Promise<void>
  createSchedule: (input: CreateAgendaEventInput) => Promise<AgendaEvent[]>
  json: JsonResponse
  createErrorResponse: (error: unknown, fallbackMessage: string) => Response
  logError: (error: unknown) => void
}

function normalizeOptionalText(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const normalizedValue = value.trim()
  return normalizedValue || null
}

function normalizeScheduleMode(value: unknown): ScheduleMode {
  return value === 'recorrente' ? 'recorrente' : 'pontual'
}

function normalizeRecurrenceFrequency(
  scheduleMode: ScheduleMode,
  value: unknown,
): 'none' | 'weekly' {
  if (scheduleMode === 'recorrente') return 'weekly'
  return value === 'weekly' ? 'weekly' : 'none'
}

function normalizeRecurrenceInterval(value: unknown): number {
  if (value === undefined || value === null || value === '') return 1
  return Number(value)
}

/**
 * Factory for the HTTP orchestration used by POST /api/agenda/events.
 * Dependencies are injectable so this exact handler can be tested without
 * contacting authentication, Supabase, or production services.
 */
export function createAgendaEventPostHandler(dependencies: AgendaEventPostDependencies) {
  return async function handleAgendaEventPost(
    request: { json: () => Promise<unknown> },
  ): Promise<Response> {
    try {
      const user = await dependencies.requireSessionUser()
      const body = (await request.json()) as CreateEventRequestBody
      const scheduleMode = normalizeScheduleMode(body.scheduleMode)
      const requiredFeature = scheduleMode === 'recorrente'
        ? 'agenda.recurring'
        : 'agenda.events'

      await dependencies.requireFeatureAccess({
        userId: user.id,
        featureCode: requiredFeature,
        options: { includeUsage: true },
      })

      const recurrenceFrequency = normalizeRecurrenceFrequency(
        scheduleMode,
        body.recurrenceFrequency,
      )
      const schoolId = dependencies.normalizeSchoolId(body.schoolId)

      const input: CreateAgendaEventInput = {
        title: typeof body.title === 'string' ? body.title : '',
        description: normalizeOptionalText(body.description),
        event_type: normalizeOptionalText(body.eventType) ?? 'pedagogico',
        start_at: typeof body.startAt === 'string' ? body.startAt : '',
        end_at: normalizeOptionalText(body.endAt),
        status: normalizeOptionalText(body.status) ?? 'planejado',
        priority: normalizeOptionalText(body.priority) ?? 'media',
        school_id: schoolId,
        // Never trust a user_id supplied by the browser.
        user_id: user.id,
        planning_id: normalizeOptionalText(body.planningId),
        evidence_id: normalizeOptionalText(body.evidenceId),
        schedule_mode: scheduleMode,
        recurrence_frequency: recurrenceFrequency,
        recurrence_interval: normalizeRecurrenceInterval(body.recurrenceInterval),
        recurrence_until: normalizeOptionalText(body.recurrenceUntil),
        source_template_id: normalizeOptionalText(body.sourceTemplateId),
        week_reference: normalizeOptionalText(body.weekReference),
        is_exception: false,
      }

      const data = await createAfterAuthorization({
        input,
        authorize: () => dependencies.assertActiveSchoolMembership(user.id, schoolId),
        create: (authorizedInput) => dependencies.createSchedule(authorizedInput),
      })

      return dependencies.json(
        {
          success: true,
          message: scheduleMode === 'recorrente'
            ? `${data.length} eventos semanais foram criados.`
            : 'Evento criado com sucesso.',
          total: data.length,
          data,
        },
        {
          status: 201,
          headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
        },
      )
    } catch (error) {
      dependencies.logError(error)
      return dependencies.createErrorResponse(error, 'Erro interno ao criar evento.')
    }
  }
}
