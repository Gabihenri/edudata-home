import { NextResponse } from 'next/server'

import {
  isAccessDeniedError,
  requireFeatureAccess,
  serializeAccessDeniedError,
} from '@/lib/access/guards/require-feature-access'
import { requireSessionUser } from '@/lib/auth/session'
import { scheduleTemplatesService } from '@/lib/agenda/services/schedule-templates.service'

export const dynamic = 'force-dynamic'

type ApplyScheduleTemplatesBody = {
  weekReference?: string
  templateIds?: unknown
}

function normalizeTemplateIds(
  value: unknown,
): string[] | undefined {
  if (value === undefined || value === null) {
    return undefined
  }

  if (!Array.isArray(value)) {
    throw new Error(
      'A lista de horários-padrão é inválida.',
    )
  }

  const templateIds = value
    .filter(
      (item): item is string =>
        typeof item === 'string',
    )
    .map((item) => item.trim())
    .filter(Boolean)

  return Array.from(new Set(templateIds))
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
    message.includes('segunda-feira') ||
    message.includes('lista')
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
      (await request.json()) as ApplyScheduleTemplatesBody

    const weekReference =
      typeof body.weekReference === 'string'
        ? body.weekReference.trim()
        : ''

    const templateIds =
      normalizeTemplateIds(
        body.templateIds,
      )

    const data =
      await scheduleTemplatesService.applyToWeek(
        user.id,
        weekReference,
        templateIds,
      )

    let message: string

    if (
      data.totalCreated > 0 &&
      data.totalSkipped > 0
    ) {
      message =
        `${data.totalCreated} horário(s) aplicado(s). ` +
        `${data.totalSkipped} horário(s) não foram adicionados porque já existiam ou estavam fora do período configurado.`
    } else if (data.totalCreated > 0) {
      message =
        `${data.totalCreated} horário(s)-padrão foram aplicados à semana selecionada.`
    } else if (data.totalTemplates === 0) {
      message =
        'Nenhum horário-padrão ativo foi encontrado.'
    } else {
      message =
        'Nenhum novo evento foi criado. Os horários podem já ter sido aplicados à semana.'
    }

    return NextResponse.json(
      {
        success: true,
        message,
        data,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store',
        },
      },
    )
  } catch (error) {
    return createErrorResponse(
      error,
      'Não foi possível aplicar os horários-padrão.',
    )
  }
}