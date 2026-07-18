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

type ContactPreference =
  | 'email'
  | 'phone'
  | 'whatsapp'
  | 'no_preference'

type UpgradeRequestBody = {
  requestedPlanCode?: unknown
  featureCode?: unknown

  sourceProduct?: unknown
  sourceModule?: unknown
  sourcePath?: unknown

  contactPreference?: unknown
  contactEmail?: unknown
  contactPhone?: unknown

  commercialContactConsent?: unknown

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

const NO_CACHE_HEADERS = {
  'Cache-Control':
    'no-store, no-cache, must-revalidate',
}

function normalizeOptionalText(
  value: unknown,
  maximumLength: number,
): string | null {
  if (typeof value !== 'string') {
    return null
  }

  const normalizedValue = value.trim()

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

function normalizeEmail(
  value: unknown,
): string | null {
  const email =
    normalizeOptionalText(
      value,
      254,
    )?.toLowerCase() ?? null

  if (!email) {
    return null
  }

  const emailPattern =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!emailPattern.test(email)) {
    throw new Error(
      'O e-mail informado é inválido.',
    )
  }

  return email
}

function normalizePhone(
  value: unknown,
): string | null {
  const phone =
    normalizeOptionalText(
      value,
      30,
    )

  if (!phone) {
    return null
  }

  const digits =
    phone.replace(/\D/g, '')

  if (
    digits.length < 10 ||
    digits.length > 15
  ) {
    throw new Error(
      'O telefone informado é inválido.',
    )
  }

  return phone
}

function normalizeContactPreference(
  value: unknown,
): ContactPreference {
  const normalizedValue =
    normalizeOptionalText(
      value,
      30,
    )?.toLowerCase() ??
    'email'

  const acceptedValues:
    ContactPreference[] = [
      'email',
      'phone',
      'whatsapp',
      'no_preference',
    ]

  if (
    !acceptedValues.includes(
      normalizedValue as ContactPreference,
    )
  ) {
    throw new Error(
      'A preferência de contato é inválida.',
    )
  }

  return normalizedValue as ContactPreference
}

function normalizeConsent(
  value: unknown,
): true {
  if (value !== true) {
    throw new Error(
      'Confirme a autorização para contato sobre o upgrade.',
    )
  }

  return true
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
      'O contexto da solicitação é inválido.',
    )
  }

  const entries =
    Object.entries(
      value as Record<string, unknown>,
    )

  if (entries.length > 20) {
    throw new Error(
      'O contexto da solicitação contém informações demais.',
    )
  }

  const context: SafeSourceContext = {}

  for (
    const [rawKey, rawValue]
    of entries
  ) {
    const key = rawKey.trim()

    if (
      !key ||
      key.length > 80 ||
      !/^[a-zA-Z0-9._-]+$/.test(key)
    ) {
      throw new Error(
        'O contexto da solicitação contém uma chave inválida.',
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
      context[key] = rawValue
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
          'O contexto da solicitação contém um texto muito longo.',
        )
      }

      context[key] =
        rawValue.trim()

      continue
    }

    throw new Error(
      'O contexto da solicitação aceita somente valores simples.',
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
  if (error instanceof SyntaxError) {
    return 400
  }

  if (!(error instanceof Error)) {
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
      'forbidden',
    )
  ) {
    return 403
  }

  if (
    message.includes(
      'já possui',
    ) ||
    message.includes(
      'já existe',
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
      'não encontrado',
    ) ||
    message.includes(
      'não está disponível',
    ) ||
    message.includes(
      'ultrapassa',
    ) ||
    message.includes(
      'autorização',
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
      status: getErrorStatus(error),
      headers: NO_CACHE_HEADERS,
    },
  )
}

export async function GET(
  request: NextRequest,
) {
  try {
    const user =
      await requireSessionUser()

    const accessToken =
      getAccessToken(request)

    const supabase =
      createAuthenticatedClient(
        accessToken,
      )

    const {
      data,
      error,
    } = await supabase
      .from('upgrade_requests')
      .select(`
        id,
        current_plan_code,
        current_plan_name,
        requested_plan_code,
        requested_plan_name,
        feature_code,
        feature_name,
        source_product,
        source_module,
        source_path,
        status,
        request_count,
        first_requested_at,
        last_requested_at,
        contacted_at,
        approved_at,
        converted_at,
        created_at,
        updated_at
      `)
      .eq(
        'user_id',
        user.id,
      )
      .order(
        'last_requested_at',
        {
          ascending: false,
        },
      )
      .limit(50)

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
      '[UPGRADE_REQUESTS_GET_ERROR]',
      error,
    )

    return createErrorResponse(
      error,
      'Erro interno ao consultar solicitações de upgrade.',
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
        UpgradeRequestBody

    const requestedPlanCode =
      normalizeCode(
        body.requestedPlanCode,
        'Plano solicitado',
        'edi_professor_pro',
      )

    const featureCode =
      body.featureCode ===
        undefined ||
      body.featureCode === null ||
      body.featureCode === ''
        ? null
        : normalizeCode(
            body.featureCode,
            'Recurso solicitado',
          )

    const sourceProduct =
      normalizeCode(
        body.sourceProduct,
        'Produto de origem',
        'agenda_edi',
      )

    const sourceModule =
      normalizeOptionalText(
        body.sourceModule,
        120,
      )?.toLowerCase() ??
      null

    const sourcePath =
      normalizeOptionalText(
        body.sourcePath,
        500,
      )

    const contactPreference =
      normalizeContactPreference(
        body.contactPreference,
      )

    const contactEmail =
      normalizeEmail(
        body.contactEmail,
      )

    const contactPhone =
      normalizePhone(
        body.contactPhone,
      )

    const commercialContactConsent =
      normalizeConsent(
        body.commercialContactConsent,
      )

    const sourceContext =
      normalizeSourceContext(
        body.sourceContext,
      )

    if (
      contactPreference ===
        'email' &&
      !contactEmail
    ) {
      /*
       * O banco poderá utilizar o e-mail
       * da conta autenticada quando este
       * campo não for enviado.
       */
    }

    if (
      (
        contactPreference ===
          'phone' ||
        contactPreference ===
          'whatsapp'
      ) &&
      !contactPhone
    ) {
      /*
       * O banco poderá utilizar o telefone
       * já existente no perfil do usuário.
       */
    }

    const supabase =
      createAuthenticatedClient(
        accessToken,
      )

    const {
      data,
      error,
    } = await supabase.rpc(
      'register_upgrade_request',
      {
        p_requested_plan_code:
          requestedPlanCode,

        p_feature_code:
          featureCode,

        p_source_product:
          sourceProduct,

        p_source_module:
          sourceModule,

        p_source_path:
          sourcePath,

        p_contact_preference:
          contactPreference,

        p_contact_email:
          contactEmail,

        p_contact_phone:
          contactPhone,

        p_commercial_contact_consent:
          commercialContactConsent,

        p_source_context:
          sourceContext,
      },
    )

    if (error) {
      throw new Error(
        error.message,
      )
    }

    if (
      typeof data !== 'string' ||
      !data.trim()
    ) {
      throw new Error(
        'A solicitação foi processada, mas o identificador não foi retornado.',
      )
    }

    return NextResponse.json(
      {
        success: true,

        message:
          'Solicitação de upgrade registrada. A equipe da EduData IA entrará em contato.',

        data: {
          id: data,
          requestedPlanCode,
          featureCode,
          sourceProduct,
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
      '[UPGRADE_REQUESTS_POST_ERROR]',
      error,
    )

    return createErrorResponse(
      error,
      'Erro interno ao registrar a solicitação de upgrade.',
    )
  }
}