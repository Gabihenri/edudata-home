import {
  createClient,
} from '@supabase/supabase-js'

import {
  NextRequest,
  NextResponse,
} from 'next/server'

import {
  requireSessionUser,
} from '@/lib/auth/session'

import {
  requireFeatureAccess,
} from '@/lib/access/guards/require-feature-access'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
) {
  try {
    const user = await requireSessionUser()

    await requireFeatureAccess({
      userId: user.id,
      featureCode: 'agenda.events',
      options: {
        includeUsage: false,
      },
    })

    const eventId =
      request.nextUrl.searchParams.get('eventId')?.trim()

    if (!eventId) {
      return NextResponse.json(
        {
          success: false,
          error: 'eventId é obrigatório.',
        },
        { status: 400 },
      )
    }

    const startDate =
      request.nextUrl.searchParams.get('startDate') ??
      new Date().toISOString().slice(0, 10)

    const requestedDays = Math.min(
      30,
      Math.max(
        1,
        Number(
          request.nextUrl.searchParams.get('days') ?? 14,
        ),
      ),
    )

    const accessToken =
      request.cookies.get('sb-access-token')?.value ??
      request.cookies.get('access_token')?.value

    if (!accessToken) {
      throw new Error('Usuário não autenticado.')
    }

    const url =
      process.env.NEXT_PUBLIC_SUPABASE_URL

    const anonKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url || !anonKey) {
      throw new Error(
        'Variáveis públicas do Supabase não configuradas.',
      )
    }

    const client = createClient(
      url,
      anonKey,
      {
        global: {
          headers: {
            Authorization:
              `Bearer ${accessToken}`,
          },
        },
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      },
    )

    const { data: event } = await client
      .from('agenda_events')
      .select('id')
      .eq('id', eventId)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .maybeSingle()

    if (!event) {
      return NextResponse.json(
        {
          success: false,
          error: 'Evento não encontrado ou não pertence ao usuário autenticado.',
        },
        { status: 404 },
      )
    }

    const { data, error } =
      await client.rpc(
        'agenda_reschedule_candidates',
        {
          requested_event_id: eventId,
          requested_start_date: startDate,
          requested_days: requestedDays,
        },
      )

    if (error) {
      throw new Error(
        `Erro ao calcular horários: ${error.message}`,
      )
    }

    const candidates =
      (data ?? []).filter(
        (candidate: {
          conflict_free?: boolean
        }) => candidate.conflict_free,
      )

    return NextResponse.json(
      {
        success: true,
        eventId,
        startDate,
        days: requestedDays,
        candidates,
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
      '[AGENDA_RESCHEDULE_CANDIDATES_ERROR]',
      error,
    )

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Não foi possível calcular horários alternativos.',
      },
      {
        status: 500,
        headers: {
          'Cache-Control':
            'no-store, no-cache, must-revalidate',
        },
      },
    )
  }
}
