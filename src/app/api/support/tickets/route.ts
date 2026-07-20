import {
  createClient,
  type SupabaseClient,
} from '@supabase/supabase-js'

import {
  NextRequest,
  NextResponse,
} from 'next/server'

import { requireSessionUser } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

type SupportCategory =
  | 'technical'
  | 'access'
  | 'billing'
  | 'product'
  | 'pedagogical'
  | 'privacy'
  | 'suggestion'
  | 'other'

type SupportPriority =
  | 'low'
  | 'normal'
  | 'high'
  | 'urgent'

type SupportStatus =
  | 'open'
  | 'in_analysis'
  | 'waiting_user'
  | 'waiting_support'
  | 'resolved'
  | 'closed'
  | 'reopened'

type CreateSupportTicketBody = {
  category?: unknown
  subject?: unknown
  message?: unknown

  productCode?: unknown
  sourceModule?: unknown
  sourcePath?: unknown
  priority?: unknown

  sourceContext?: unknown
}

type SafeContextValue =
  | string
  | number
  | boolean
  | null

type SafeSourceContext = Record<
  string,
  SafeContextValue
>

type OpenSupportTicketResult = {
  ticket_id?: unknown
  protocol?: unknown
}

const NO_CACHE_HEADERS = {
  'Cache-Control':
    'no-store, no-cache, must-revalidate',
}

const SUPPORT_CATEGORIES:
  SupportCategory[] = [
    'technical',
    'access',
    'billing',
    'product',
    'pedagogical',
    'privacy',
    'suggestion',
    'other',
  ]

const SUPPORT_PRIORITIES:
  SupportPriority[] = [
    'low',
    'normal',
    'high',
    'urgent',
  ]

const SUPPORT_STATUSES:
  SupportStatus[] = [
    'open',
    'in_analysis',
    'waiting_user',
    'waiting_support',
    'resolved',
    'closed',
    'reopened',
  ]

function normalizeOptionalText(
  value: unknown,
  maximumLength: number,
): string | null {
  if (typeof value !== 'string') {
    return null
  }

  const normalizedValue =
    value.trim()

  if (!normalizedValue) {
    return null
  }

  if (
    normalizedValue.length >
    maximumLength
  ) {
    throw new Error(
      `O valor informado ultrapassa ${maximumLength} caracteres.`,
    )
  }

  return normalizedValue
}

function normalizeRequiredText(
  value: unknown,
  fieldName: string,
  minimumLength: number,
  maximumLength: number,
): string {
  const normalizedValue =
    normalizeOptionalText(
      value,
      maximumLength,
    )

  if (!normalizedValue) {
    throw new Error(
      `${fieldName} é obrigatório.`,
    )
  }

  if (
    normalizedValue.length <
    minimumLength
  ) {
    throw new Error(
      `${fieldName} deve possuir pelo menos ${minimumLength} caracteres.`,
    )
  }

  return normalizedValue
}

function normalizeCode(
  value: unknown,
  fieldName: string,
  fallbackValue?: string,
): string {
  const normalizedValue =
    normalizeOptionalText(
      value,
      120,
    ) ??
    fallbackValue

  if (!normalizedValue) {
    throw new Error(
      `${fieldName} é obrigatório.`,
    )
  }

  const code =
    normalizedValue.toLowerCase()

  if (
    !/^[a-z0-9][a-z0-9._-]*$/.test(
      code,
    )
  ) {
    throw new Error(
      `${fieldName} possui formato inválido.`,
    )
  }

  return code
}

function normalizeOptionalCode(
  value: unknown,
  fieldName: string,
): string | null {
  const normalizedValue =
    normalizeOptionalText(
      value,
      120,
    )

  if (!normalizedValue) {
    return null
  }

  return normalizeCode(
    normalizedValue,
    fieldName,
  )
}

function normalizeCategory(
  value: unknown,
): SupportCategory {
  const normalizedValue =
    normalizeOptionalText(
      value,
      40,
    )?.toLowerCase()

  if (
    !normalizedValue ||
    !SUPPORT_CATEGORIES.includes(
      normalizedValue as SupportCategory,
    )
  ) {
    throw new Error(
      'A categoria de suporte é inválida.',
    )
  }

  return normalizedValue as SupportCategory
}

function normalizePriority(
  value: unknown,
): SupportPriority {
  const normalizedValue =
    normalizeOptionalText(
      value,
      30,
    )?.toLowerCase() ??
    'normal'

  if (
    !SUPPORT_PRIORITIES.includes(
      normalizedValue as SupportPriority,
    )
  ) {
    throw new Error(
      'A prioridade de suporte é inválida.',
    )
  }

  return normalizedValue as SupportPriority
}

function normalizeStatusFilter(
  value: string | null,
): SupportStatus | null {
  if (!value) {
    return null
  }

  const normalizedValue =
    value.trim().toLowerCase()

  if (
    !SUPPORT_STATUSES.includes(
      normalizedValue as SupportStatus,
    )
  ) {
    throw new Error(
      'O filtro de status é inválido.',
    )
  }

  return normalizedValue as SupportStatus
}

function normalizeCategoryFilter(
  value: string | null,
): SupportCategory | null {
  if (!value) {
    return null
  }

  const normalizedValue =
    value.trim().toLowerCase()

  if (
    !SUPPORT_CATEGORIES.includes(
      normalizedValue as SupportCategory,
    )
  ) {
    throw new Error(
      'O filtro de categoria é inválido.',
    )
  }

  return normalizedValue as SupportCategory
}

function normalizeLimit(
  value: string | null,
): number {
  if (!value) {
    return 50
  }

  const parsedValue =
    Number.parseInt(
      value,
      10,
    )

  if (
    !Number.isInteger(
      parsedValue,
    ) ||
    parsedValue < 1 ||
    parsedValue > 100
  ) {
    throw new Error(
      'O limite deve estar entre 1 e 100.',
    )
  }

  return parsedValue
}

function normalizeSourceContext(
  value: unknown,
): SafeSourceContext {
  if (
    value === undefined ||
    value === null
  ) {
    return {}
  }

  if (
    typeof value !== 'object' ||
    Array.isArray(value)
  ) {
    throw new Error(
      'O contexto de origem é inválido.',
    )
  }

  const entries =
    Object.entries(
      value as Record<
        string,
        unknown
      >,
    )

  if (entries.length > 20) {
    throw new Error(
      'O contexto de origem contém informações demais.',
    )
  }

  const context:
    SafeSourceContext = {}

  for (
    const [
      rawKey,
      rawValue,
    ] of entries
  ) {
    const key =
      rawKey.trim()

    if (
      !key ||
      key.length > 80 ||
      !/^[a-zA-Z0-9._-]+$/.test(
        key,
      )
    ) {
      throw new Error(
        'O contexto de origem contém uma chave inválida.',
      )
    }

    if (rawValue === null) {
      context[key] = null
      continue
    }

    if (
      typeof rawValue ===
        'boolean' ||
      typeof rawValue ===
        'number'
    ) {
      context[key] =
        rawValue

      continue
    }

    if (
      typeof rawValue ===
      'string'
    ) {
      if (
        rawValue.length > 500
      ) {
        throw new Error(
          'O contexto de origem contém um texto muito longo.',
        )
      }

      context[key] =
        rawValue.trim()

      continue
    }

    throw new Error(
      'O contexto de origem aceita somente valores simples.',
    )
  }

  return context
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
      'permission denied',
    ) ||
    message.includes(
      'forbidden',
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
      'já existe',
    ) ||
    message.includes(
      'duplicate',
    )
  ) {
    return 409
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
      'deve possuir',
    ) ||
    message.includes(
      'ultrapassa',
    ) ||
    message.includes(
      'entre 1 e 100',
    ) ||
    message.includes(
      'contexto',
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
      status:
        getErrorStatus(error),

      headers:
        NO_CACHE_HEADERS,
    },
  )
}

function getRpcTicketResult(
  data: unknown,
): {
  id: string
  protocol: string
} {
  const result =
    Array.isArray(data)
      ? data[0]
      : data

  if (
    !result ||
    typeof result !== 'object'
  ) {
    throw new Error(
      'O chamado foi processado, mas o protocolo não foi retornado.',
    )
  }

  const {
    ticket_id: ticketId,
    protocol,
  } =
    result as OpenSupportTicketResult

  if (
    typeof ticketId !==
      'string' ||
    !ticketId.trim() ||
    typeof protocol !==
      'string' ||
    !protocol.trim()
  ) {
    throw new Error(
      'O chamado foi processado, mas os dados de confirmação são inválidos.',
    )
  }

  return {
    id: ticketId,
    protocol,
  }
}

export async function GET(
  request: NextRequest,
) {
  try {
    await requireSessionUser()

    const accessToken =
      getAccessToken(request)

    const status =
      normalizeStatusFilter(
        request.nextUrl
          .searchParams
          .get('status'),
      )

    const category =
      normalizeCategoryFilter(
        request.nextUrl
          .searchParams
          .get('category'),
      )

    const productCode =
      normalizeOptionalCode(
        request.nextUrl
          .searchParams
          .get('productCode'),
        'Produto',
      )

    const limit =
      normalizeLimit(
        request.nextUrl
          .searchParams
          .get('limit'),
      )

    const supabase =
      createAuthenticatedClient(
        accessToken,
      )

    let query =
      supabase
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

    if (status) {
      query =
        query.eq(
          'status',
          status,
        )
    }

    if (category) {
      query =
        query.eq(
          'category',
          category,
        )
    }

    if (productCode) {
      query =
        query.eq(
          'product_code',
          productCode,
        )
    }

    const {
      data,
      error,
    } =
      await query
        .order(
          'last_message_at',
          {
            ascending: false,
          },
        )
        .limit(limit)

    if (error) {
      throw new Error(
        error.message,
      )
    }

    return NextResponse.json(
      {
        success: true,

        total:
          data?.length ?? 0,

        filters: {
          status,
          category,
          productCode,
          limit,
        },

        data:
          data ?? [],
      },
      {
        status: 200,
        headers:
          NO_CACHE_HEADERS,
      },
    )
  } catch (error) {
    console.error(
      '[SUPPORT_TICKETS_GET_ERROR]',
      error,
    )

    return createErrorResponse(
      error,
      'Não foi possível carregar os chamados de suporte.',
    )
  }
}

export async function POST(
  request: NextRequest,
) {
  try {
    await requireSessionUser()

    const accessToken =
      getAccessToken(request)

    const body =
      (await request.json()) as
        CreateSupportTicketBody

    const category =
      normalizeCategory(
        body.category,
      )

    const subject =
      normalizeRequiredText(
        body.subject,
        'O assunto',
        5,
        200,
      )

    const message =
      normalizeRequiredText(
        body.message,
        'A mensagem',
        1,
        10000,
      )

    const productCode =
      normalizeCode(
        body.productCode,
        'O produto',
        'platform',
      )

    const sourceModule =
      normalizeOptionalCode(
        body.sourceModule,
        'O módulo',
      )

    const sourcePath =
      normalizeOptionalText(
        body.sourcePath,
        500,
      )

    const priority =
      normalizePriority(
        body.priority,
      )

    const sourceContext =
      normalizeSourceContext(
        body.sourceContext,
      )

    const supabase =
      createAuthenticatedClient(
        accessToken,
      )

    const {
      data,
      error,
    } = await supabase.rpc(
      'open_support_ticket',
      {
        p_category:
          category,

        p_subject:
          subject,

        p_message:
          message,

        p_product_code:
          productCode,

        p_source_module:
          sourceModule,

        p_source_path:
          sourcePath,

        p_priority:
          priority,

        p_source_context:
          sourceContext,
      },
    )

    if (error) {
      throw new Error(
        error.message,
      )
    }

    const createdTicket =
      getRpcTicketResult(
        data,
      )

    return NextResponse.json(
      {
        success: true,

        message:
          'Chamado aberto com sucesso.',

        data: {
          id:
            createdTicket.id,

          protocol:
            createdTicket.protocol,

          category,
          priority,
          productCode,
          status:
            'open' as const,
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
      '[SUPPORT_TICKETS_POST_ERROR]',
      error,
    )

    return createErrorResponse(
      error,
      'Não foi possível abrir o chamado de suporte.',
    )
  }
}