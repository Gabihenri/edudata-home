import { NextResponse } from 'next/server'

import {
  isAccessDeniedError,
  requireFeatureAccess,
  serializeAccessDeniedError,
} from '@/lib/access/guards/require-feature-access'
import { requireSessionUser } from '@/lib/auth/session'
import { scheduleTemplatesService } from '@/lib/agenda/services/schedule-templates.service'

export const dynamic = 'force-dynamic'

type CreateScheduleTemplateBody = {
  title?: string
  description?: string | null

  eventType?: string
  priority?: string

  weekday?: number | string

  startTime?: string
  endTime?: string | null

  timezone?: string

  repeatIntervalWeeks?: number | string

  validFrom?: string | null
  validUntil?: string | null

  schoolId?: string | null
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

function normalizeNumber(
  value: unknown,
  defaultValue: number,
): number {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return defaultValue
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

  const message = error.message.toLowerCase()

  if (
    message.includes('não autenticado') ||
    message.includes('não autorizado')
  ) {
    return 401
  }

  if (
    message.includes('obrigatório') ||
    message.includes('obrigatória') ||
    message.includes('inválido') ||
    message.includes('inválida') ||
    message.includes('formato') ||
    message.includes('intervalo') ||
    message.includes('anterior') ||
    message.includes('posterior') ||
    message.includes('entre 1 e 7')
  ) {
    return 400
  }

  if (message.includes('não encontrado')) {
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
          'Cache-Control': 'no-store',
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
        'Cache-Control': 'no-store',
      },
    },
  )
}

export async function GET(
  request: Request,
) {
  try {
    const user = await requireSessionUser()

    await requireFeatureAccess({
      userId: user.id,
      featureCode: 'agenda.templates',
      options: {
        includeUsage: false,
      },
    })

    const { searchParams } = new URL(
      request.url,
    )

    const includeInactive =
      searchParams.get('includeInactive') ===
      'true'

    const data =
      await scheduleTemplatesService.listForUser(
        user.id,
        !includeInactive,
      )

    return NextResponse.json(
      {
        success: true,
        total: data.length,
        data,
      },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      },
    )
  } catch (error) {
    return createErrorResponse(
      error,
      'Não foi possível carregar os horários-padrão.',
    )
  }
}

export async function POST(
  request: Request,
) {
  try {
    const user = await requireSessionUser()

    await requireFeatureAccess({
      userId: user.id,
      featureCode: 'agenda.templates',
      options: {
        includeUsage: true,
      },
    })

    const body =
      (await request.json()) as CreateScheduleTemplateBody

    const data =
      await scheduleTemplatesService.createForUser(
        user.id,
        {
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

          priority:
            normalizeOptionalText(
              body.priority,
            ) ?? 'media',

          weekday: normalizeNumber(
            body.weekday,
            1,
          ),

          start_time:
            typeof body.startTime === 'string'
              ? body.startTime
              : '',

          end_time:
            normalizeOptionalText(
              body.endTime,
            ),

          timezone:
            normalizeOptionalText(
              body.timezone,
            ) ?? 'America/Sao_Paulo',

          repeat_interval_weeks:
            normalizeNumber(
              body.repeatIntervalWeeks,
              1,
            ),

          valid_from:
            normalizeOptionalText(
              body.validFrom,
            ),

          valid_until:
            normalizeOptionalText(
              body.validUntil,
            ),

          active: true,

          school_id:
            normalizeOptionalText(
              body.schoolId,
            ),
        },
      )

    return NextResponse.json(
      {
        success: true,
        message:
          'Horário-padrão salvo com sucesso.',
        data,
      },
      {
        status: 201,
        headers: {
          'Cache-Control': 'no-store',
        },
      },
    )
  } catch (error) {
    return createErrorResponse(
      error,
      'Não foi possível salvar o horário-padrão.',
    )
  }
}