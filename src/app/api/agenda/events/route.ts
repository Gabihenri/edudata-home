import {
  NextRequest,
  NextResponse,
} from 'next/server'

import {
  eventsService,
  type AgendaEvent,
  type CreateAgendaEventInput,
} from '@/lib/agenda'

import {
  isAccessDeniedError,
  requireFeatureAccess,
  serializeAccessDeniedError,
} from '@/lib/access/guards/require-feature-access'

import { requireSessionUser } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

type ScheduleMode =
  | 'pontual'
  | 'recorrente'

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

  recurrenceFrequency?:
    | 'none'
    | 'weekly'

  recurrenceInterval?: number
  recurrenceUntil?: string | null

  sourceTemplateId?: string | null
  weekReference?: string | null
}

function normalizeOptionalText(
  value: unknown,
): string | null {
  if (typeof value !== 'string') {
    return null
  }

  const normalizedValue = value.trim()

  return normalizedValue || null
}

function normalizeScheduleMode(
  value: unknown,
): ScheduleMode {
  return value === 'recorrente'
    ? 'recorrente'
    : 'pontual'
}

function normalizeRecurrenceFrequency(
  scheduleMode: ScheduleMode,
  value: unknown,
): 'none' | 'weekly' {
  if (scheduleMode === 'recorrente') {
    return 'weekly'
  }

  return value === 'weekly'
    ? 'weekly'
    : 'none'
}

function normalizeRecurrenceInterval(
  value: unknown,
): number {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return 1
  }

  return Number(value)
}

function getErrorStatus(
  error: unknown,
): number {
  if (error instanceof SyntaxError) {
    return 400
  }

  if (!(error instanceof Error)) {
    return 500
  }

  const message =
    error.message.toLowerCase()

  if (
    message.includes('não autenticado') ||
    message.includes('não autorizado') ||
    message.includes('unauthorized')
  ) {
    return 401
  }

  if (
    message.includes('sem permissão') ||
    message.includes('proibido') ||
    message.includes('forbidden')
  ) {
    return 403
  }

  if (
    message.includes('obrigatório') ||
    message.includes('obrigatória') ||
    message.includes('inválida') ||
    message.includes('inválido') ||
    message.includes('anterior') ||
    message.includes('intervalo') ||
    message.includes('recorrência') ||
    message.includes('ultrapassar')
  ) {
    return 400
  }

  if (
    message.includes('não encontrado')
  ) {
    return 404
  }

  return 500
}

function createErrorResponse(
  error: unknown,
  fallbackMessage: string,
) {
  if (isAccessDeniedError(error)) {
    return NextResponse.json(
      serializeAccessDeniedError(error),
      {
        status: 403,
        headers: {
          'Cache-Control':
            'no-store, no-cache, must-revalidate',
        },
      },
    )
  }

  const message =
    error instanceof Error
      ? error.message
      : fallbackMessage

  return NextResponse.json(
    {
      success: false,
      error: message,
    },
    {
      status: getErrorStatus(error),
      headers: {
        'Cache-Control':
          'no-store, no-cache, must-revalidate',
      },
    },
  )
}

export async function GET(
  request: NextRequest,
) {
  try {
    const user =
      await requireSessionUser()

    await requireFeatureAccess({
      userId: user.id,
      featureCode: 'agenda.events',
      options: {
        includeUsage: false,
      },
    })

    const { searchParams } =
      request.nextUrl

    const weekReference =
      searchParams.get(
        'weekReference',
      ) ??
      searchParams.get('week')

    const seriesId =
      normalizeOptionalText(
        searchParams.get('seriesId'),
      )

    let data: AgendaEvent[]

    if (seriesId) {
      /*
       * Segurança:
       * primeiro busca apenas os eventos pertencentes
       * ao usuário autenticado e, depois, filtra a série.
       *
       * Isso impede que um usuário consulte uma série
       * pertencente a outra conta informando o seriesId
       * diretamente na URL.
       */
      const userEvents =
        await eventsService.listByUserId(
          user.id,
        )

      data = userEvents.filter(
        (event) =>
          event.series_id === seriesId,
      )
    } else if (weekReference) {
      data =
        await eventsService
          .listByUserAndWeek(
            user.id,
            weekReference,
          )
    } else {
      data =
        await eventsService
          .listByUserId(
            user.id,
          )
    }

    return NextResponse.json(
      {
        success: true,
        total: data.length,
        data,
      },
      {
        status: 200,
        headers: {
          'Cache-Control':
            'no-store, no-cache, must-revalidate',
        },
      },
    )
  } catch (error) {
    console.error(
      '[AGENDA_EVENTS_GET_ERROR]',
      error,
    )

    return createErrorResponse(
      error,
      'Erro interno ao listar eventos.',
    )
  }
}

export async function POST(
  request: NextRequest,
) {
  try {
    const user =
      await requireSessionUser()

    const body =
      (await request.json()) as CreateEventRequestBody

    const scheduleMode =
      normalizeScheduleMode(
        body.scheduleMode,
      )

    const requiredFeature =
      scheduleMode === 'recorrente'
        ? 'agenda.recurring'
        : 'agenda.events'

    await requireFeatureAccess({
      userId: user.id,
      featureCode: requiredFeature,
      options: {
        includeUsage: true,
      },
    })

    const recurrenceFrequency =
      normalizeRecurrenceFrequency(
        scheduleMode,
        body.recurrenceFrequency,
      )

    const input: CreateAgendaEventInput = {
      title:
        typeof body.title === 'string'
          ? body.title
          : '',

      description:
        normalizeOptionalText(
          body.description,
        ),

      event_type:
        normalizeOptionalText(
          body.eventType,
        ) ?? 'pedagogico',

      start_at:
        typeof body.startAt === 'string'
          ? body.startAt
          : '',

      end_at:
        normalizeOptionalText(
          body.endAt,
        ),

      status:
        normalizeOptionalText(
          body.status,
        ) ?? 'planejado',

      priority:
        normalizeOptionalText(
          body.priority,
        ) ?? 'media',

      school_id:
        normalizeOptionalText(
          body.schoolId,
        ),

      /*
       * O proprietário do registro sempre será
       * o usuário autenticado no servidor.
       *
       * Nunca aceitar user_id enviado pelo navegador.
       */
      user_id: user.id,

      planning_id:
        normalizeOptionalText(
          body.planningId,
        ),

      evidence_id:
        normalizeOptionalText(
          body.evidenceId,
        ),

      schedule_mode:
        scheduleMode,

      recurrence_frequency:
        recurrenceFrequency,

      recurrence_interval:
        normalizeRecurrenceInterval(
          body.recurrenceInterval,
        ),

      recurrence_until:
        normalizeOptionalText(
          body.recurrenceUntil,
        ),

      source_template_id:
        normalizeOptionalText(
          body.sourceTemplateId,
        ),

      week_reference:
        normalizeOptionalText(
          body.weekReference,
        ),

      is_exception: false,
    }

    const data =
      await eventsService
        .createSchedule(input)

    return NextResponse.json(
      {
        success: true,

        message:
          scheduleMode === 'recorrente'
            ? `${data.length} eventos semanais foram criados.`
            : 'Evento criado com sucesso.',

        total: data.length,
        data,
      },
      {
        status: 201,
        headers: {
          'Cache-Control':
            'no-store, no-cache, must-revalidate',
        },
      },
    )
  } catch (error) {
    console.error(
      '[AGENDA_EVENTS_POST_ERROR]',
      error,
    )

    return createErrorResponse(
      error,
      'Erro interno ao criar evento.',
    )
  }
}