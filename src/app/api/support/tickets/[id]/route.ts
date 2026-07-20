import {
  createClient,
  type SupabaseClient,
} from '@supabase/supabase-js'

import {
  NextRequest,
  NextResponse,
} from 'next/server'

import { requireSessionUser } from '@/lib/auth/session'

export const dynamic =
  'force-dynamic'

type RouteContext = {
  params: {
    id: string
  }
}

type CreateSupportMessageBody = {
  message?: unknown
}

const NO_CACHE_HEADERS = {
  'Cache-Control':
    'no-store, no-cache, must-revalidate',
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function normalizeTicketId(
  value: unknown,
): string {
  if (
    typeof value !==
    'string'
  ) {
    throw new Error(
      'O identificador do chamado é inválido.',
    )
  }

  const normalizedValue =
    value.trim()

  if (
    !UUID_PATTERN.test(
      normalizedValue,
    )
  ) {
    throw new Error(
      'O identificador do chamado é inválido.',
    )
  }

  return normalizedValue
}

function normalizeMessage(
  value: unknown,
): string {
  if (
    typeof value !==
    'string'
  ) {
    throw new Error(
      'A mensagem é obrigatória.',
    )
  }

  const normalizedValue =
    value.trim()

  if (!normalizedValue) {
    throw new Error(
      'A mensagem é obrigatória.',
    )
  }

  if (
    normalizedValue.length >
    10000
  ) {
    throw new Error(
      'A mensagem ultrapassa 10000 caracteres.',
    )
  }

  return normalizedValue
}

function getAccessToken(
  request: NextRequest,
): string {
  const accessToken =
    request.cookies.get(
      'sb-access-token',
    )?.value ??
    request.cookies.get(
      'access_token',
    )?.value

  if (!accessToken) {
    throw new Error(
      'Usuário não autenticado.',
    )
  }

  return accessToken
}

function createAuthenticatedClient(
  accessToken: string,
): SupabaseClient {
  const url =
    process.env
      .NEXT_PUBLIC_SUPABASE_URL

  const anonKey =
    process.env
      .NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error(
      'Variáveis públicas do Supabase não configuradas.',
    )
  }

  return createClient(
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
}

function getErrorStatus(
  error: unknown,
): number {
  if (
    error instanceof
    SyntaxError
  ) {
    return 400
  }

  if (
    !(error instanceof Error)
  ) {
    return 500
  }

  const message =
    error.message.toLowerCase()

  if (
    message.includes(
      'não autenticado',
    ) ||
    message.includes(
      'unauthorized',
    )
  ) {
    return 401
  }

  if (
    message.includes(
      'sem permissão',
    ) ||
    message.includes(
      'não possui permissão',
    ) ||
    message.includes(
      'permission denied',
    ) ||
    message.includes(
      'forbidden',
    ) ||
    message.includes(
      'perfil do usuário não está ativo',
    )
  ) {
    return 403
  }

  if (
    message.includes(
      'não encontrado',
    )
  ) {
    return 404
  }

  if (
    message.includes(
      'obrigatório',
    ) ||
    message.includes(
      'obrigatória',
    ) ||
    message.includes(
      'inválido',
    ) ||
    message.includes(
      'inválida',
    ) ||
    message.includes(
      'ultrapassa',
    ) ||
    message.includes(
      'entre 1 e 10000',
    )
  ) {
    return 400
  }

  return 500
}

function createErrorResponse(
  error: unknown,
  fallbackMessage: string,
) {
  const status =
    getErrorStatus(error)

  const message =
    status >= 500
      ? fallbackMessage
      : error instanceof Error
        ? error.message
        : fallbackMessage

  return NextResponse.json(
    {
      success: false,
      error: message,
    },
    {
      status,
      headers:
        NO_CACHE_HEADERS,
    },
  )
}

function normalizeCreatedMessageId(
  value: unknown,
): string {
  if (
    typeof value !==
      'string' ||
    !UUID_PATTERN.test(
      value.trim(),
    )
  ) {
    throw new Error(
      'A mensagem foi processada, mas o identificador não foi retornado.',
    )
  }

  return value.trim()
}

export async function GET(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    await requireSessionUser()

    const ticketId =
      normalizeTicketId(
        context.params.id,
      )

    const accessToken =
      getAccessToken(request)

    const supabase =
      createAuthenticatedClient(
        accessToken,
      )

    const {
      data: ticket,
      error: ticketError,
    } =
      await supabase
        .from(
          'support_tickets',
        )
        .select(`
          id,
          protocol,
          requester_user_id,
          organization_id,
          school_id,
          product_code,
          source_module,
          source_path,
          category,
          subject,
          priority,
          status,
          assigned_to_user_id,
          last_message_at,
          last_requester_message_at,
          last_support_message_at,
          status_changed_at,
          resolved_at,
          closed_at,
          created_at,
          updated_at
        `)
        .eq(
          'id',
          ticketId,
        )
        .maybeSingle()

    if (ticketError) {
      throw new Error(
        ticketError.message,
      )
    }

    if (!ticket) {
      throw new Error(
        'Chamado não encontrado.',
      )
    }

    const {
      data: messages,
      error: messagesError,
    } =
      await supabase
        .from(
          'support_messages',
        )
        .select(`
          id,
          ticket_id,
          author_user_id,
          author_type,
          visibility,
          message_type,
          body,
          created_at
        `)
        .eq(
          'ticket_id',
          ticketId,
        )
        .order(
          'created_at',
          {
            ascending: true,
          },
        )

    if (messagesError) {
      throw new Error(
        messagesError.message,
      )
    }

    const {
      data: statusHistory,
      error:
        statusHistoryError,
    } =
      await supabase
        .from(
          'support_status_history',
        )
        .select(`
          id,
          ticket_id,
          previous_status,
          new_status,
          actor_type,
          visibility,
          reason,
          created_at
        `)
        .eq(
          'ticket_id',
          ticketId,
        )
        .order(
          'created_at',
          {
            ascending: true,
          },
        )

    if (statusHistoryError) {
      throw new Error(
        statusHistoryError.message,
      )
    }

    const {
      data:
        markedReadCount,
      error:
        markReadError,
    } =
      await supabase.rpc(
        'mark_support_ticket_read',
        {
          p_ticket_id:
            ticketId,
        },
      )

    if (markReadError) {
      throw new Error(
        markReadError.message,
      )
    }

    return NextResponse.json(
      {
        success: true,

        data: {
          ticket,

          messages:
            messages ?? [],

          statusHistory:
            statusHistory ?? [],

          markedReadCount:
            typeof markedReadCount ===
              'number'
              ? markedReadCount
              : 0,
        },
      },
      {
        status: 200,
        headers:
          NO_CACHE_HEADERS,
      },
    )
  } catch (error) {
    console.error(
      '[SUPPORT_TICKET_GET_ERROR]',
      error,
    )

    return createErrorResponse(
      error,
      'Não foi possível carregar o chamado.',
    )
  }
}

export async function POST(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    await requireSessionUser()

    const ticketId =
      normalizeTicketId(
        context.params.id,
      )

    const accessToken =
      getAccessToken(request)

    const body =
      (await request.json()) as
        CreateSupportMessageBody

    const message =
      normalizeMessage(
        body.message,
      )

    const supabase =
      createAuthenticatedClient(
        accessToken,
      )

    const {
      data:
        createdMessageData,
      error:
        createdMessageError,
    } =
      await supabase.rpc(
        'send_support_message',
        {
          p_ticket_id:
            ticketId,

          p_body:
            message,

          /*
           * A rota do usuário sempre
           * envia mensagens compartilhadas.
           *
           * Mensagens internas serão
           * tratadas futuramente pela
           * interface administrativa.
           */
          p_visibility:
            'shared',

          p_metadata: {
            channel:
              'internal_support',

            origin:
              'ticket_detail_api',

            version:
              'v1.0',
          },
        },
      )

    if (createdMessageError) {
      throw new Error(
        createdMessageError.message,
      )
    }

    const createdMessageId =
      normalizeCreatedMessageId(
        createdMessageData,
      )

    const {
      data:
        createdMessage,
      error:
        messageQueryError,
    } =
      await supabase
        .from(
          'support_messages',
        )
        .select(`
          id,
          ticket_id,
          author_user_id,
          author_type,
          visibility,
          message_type,
          body,
          created_at
        `)
        .eq(
          'id',
          createdMessageId,
        )
        .eq(
          'ticket_id',
          ticketId,
        )
        .maybeSingle()

    if (messageQueryError) {
      throw new Error(
        messageQueryError.message,
      )
    }

    if (!createdMessage) {
      throw new Error(
        'A mensagem foi registrada, mas não pôde ser recuperada.',
      )
    }

    const {
      data:
        updatedTicket,
      error:
        ticketQueryError,
    } =
      await supabase
        .from(
          'support_tickets',
        )
        .select(`
          id,
          protocol,
          status,
          last_message_at,
          last_requester_message_at,
          last_support_message_at,
          status_changed_at,
          updated_at
        `)
        .eq(
          'id',
          ticketId,
        )
        .maybeSingle()

    if (ticketQueryError) {
      throw new Error(
        ticketQueryError.message,
      )
    }

    return NextResponse.json(
      {
        success: true,

        message:
          'Mensagem enviada com sucesso.',

        data: {
          message:
            createdMessage,

          ticket:
            updatedTicket,
        },
      },
      {
        status: 201,
        headers:
          NO_CACHE_HEADERS,
      },
    )
  } catch (error) {
    console.error(
      '[SUPPORT_TICKET_POST_ERROR]',
      error,
    )

    return createErrorResponse(
      error,
      'Não foi possível enviar a mensagem.',
    )
  }
}