import { createClient } from '@supabase/supabase-js'

import {
  NextRequest,
  NextResponse,
} from 'next/server'

import {
  eventsService,
  type AgendaEvent,
} from '@/lib/agenda'

import {
  isAccessDeniedError,
  requireFeatureAccess,
  serializeAccessDeniedError,
} from '@/lib/access/guards/require-feature-access'

import { requireSessionUser } from '@/lib/auth/session'
import { normalizeSchoolId } from '@/lib/agenda/authorization/normalize-school-id'
import { assertActiveSchoolMembership as assertMembershipRule } from '@/lib/agenda/authorization/assert-active-school-membership'
import { createAgendaEventPostHandler } from '@/lib/agenda/authorization/create-agenda-event-post-handler'

export const dynamic = 'force-dynamic'

/**
 * O repositório de eventos pode operar com service_role, que ignora RLS.
 * Por isso, a rota valida explicitamente o vínculo ativo antes de persistir
 * qualquer evento associado a uma escola informada pelo cliente.
 */
async function assertActiveSchoolMembership(
  userId: string,
  schoolId: string | null,
): Promise<void> {
  await assertMembershipRule(
    userId,
    schoolId,
    async (lookupUserId, lookupSchoolId) => {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

      if (!url || !serviceRoleKey) {
        console.error(
          '[AGENDA_EVENT_SCHOOL_MEMBERSHIP_CONFIG_ERROR]',
          'NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausente.',
        )
        throw new Error('Não foi possível validar o vínculo institucional.')
      }

      const client = createClient(url, serviceRoleKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      })

      const { data, error } = await client
        .from('organization_members')
        .select('id, access_starts_at, access_ends_at')
        .eq('user_id', lookupUserId)
        .eq('school_id', lookupSchoolId)
        .ilike('status', 'active')

      if (error) {
        console.error(
          '[AGENDA_EVENT_SCHOOL_MEMBERSHIP_CHECK_ERROR]',
          error,
        )
      }

      return {
        data: (data ?? []) as Array<{
          access_starts_at: string | null
          access_ends_at: string | null
        }> | null,
        error,
      }
    },
  )
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

const handleAgendaEventPost = createAgendaEventPostHandler({
  requireSessionUser,
  requireFeatureAccess,
  normalizeSchoolId,
  assertActiveSchoolMembership,
  createSchedule: (input) => eventsService.createSchedule(input),
  json: (body, init) => NextResponse.json(body, init),
  createErrorResponse,
  logError: (error) => {
    console.error('[AGENDA_EVENTS_POST_ERROR]', error)
  },
})

export async function POST(request: NextRequest) {
  return handleAgendaEventPost(request)
}
