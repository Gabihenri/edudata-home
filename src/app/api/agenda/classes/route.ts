import {
  createClient,
  type SupabaseClient,
} from '@supabase/supabase-js'

import {
  NextRequest,
  NextResponse,
} from 'next/server'

import {
  classesService,
  type CreateAgendaClassInput,
} from '@/lib/agenda'

import {
  requireSessionUser,
} from '@/lib/auth/session'

export const dynamic =
  'force-dynamic'

type CreateClassRequestBody = {
  name?: unknown

  schoolYear?: unknown
  grade?: unknown
  subject?: unknown

  studentsCount?: unknown

  active?: unknown
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
    process.env.NEXT_PUBLIC_SUPABASE_URL

  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

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

function createAuthenticatedClassesService(
  request: NextRequest,
) {
  return classesService.withClient(
    createAuthenticatedClient(
      getAccessToken(request),
    ),
  )
}

function normalizeOptionalText(
  value: unknown,
): string | null {
  if (
    typeof value !==
    'string'
  ) {
    return null
  }

  const normalizedValue =
    value.trim()

  return (
    normalizedValue ||
    null
  )
}

function normalizeName(
  value: unknown,
): string {
  if (
    typeof value !==
    'string'
  ) {
    return ''
  }

  return value.trim()
}

function normalizeStudentsCount(
  value: unknown,
): number {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return 0
  }

  const normalizedValue =
    Number(value)

  if (
    !Number.isInteger(
      normalizedValue,
    ) ||
    normalizedValue < 0
  ) {
    throw new Error(
      'A quantidade de estudantes deve ser um número inteiro igual ou maior que zero.',
    )
  }

  return normalizedValue
}

function normalizeActive(
  value: unknown,
): boolean {
  return value !== false
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
    error.message
      .toLowerCase()

  if (
    message.includes(
      'não autenticado',
    ) ||
    message.includes(
      'não autorizado',
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
      'proibido',
    ) ||
    message.includes(
      'forbidden',
    )
  ) {
    return 403
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
      'número inteiro',
    )
  ) {
    return 400
  }

  if (
    message.includes(
      'não encontrada',
    )
  ) {
    return 404
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

    const service =
      createAuthenticatedClassesService(
        request,
      )

    const data =
      await service
        .listByTeacherId(
          user.id,
        )

    return NextResponse.json(
      {
        success: true,
        total:
          data.length,
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
      '[AGENDA_CLASSES_GET_ERROR]',
      error,
    )

    return createErrorResponse(
      error,
      'Erro interno ao listar turmas.',
    )
  }
}

export async function POST(
  request: NextRequest,
) {
  try {
    const user =
      await requireSessionUser()

    const service =
      createAuthenticatedClassesService(
        request,
      )

    const body =
      (
        await request.json()
      ) as CreateClassRequestBody

    const input:
      CreateAgendaClassInput = {
      name:
        normalizeName(
          body.name,
        ),

      school_year:
        normalizeOptionalText(
          body.schoolYear,
        ),

      grade:
        normalizeOptionalText(
          body.grade,
        ),

      subject:
        normalizeOptionalText(
          body.subject,
        ),

      students_count:
        normalizeStudentsCount(
          body.studentsCount,
        ),

      teacher_id:
        user.id,

      school_id:
        null,

      active:
        normalizeActive(
          body.active,
        ),
    }

    const data =
      await service
        .create(input)

    return NextResponse.json(
      {
        success: true,

        message:
          'Turma criada com sucesso.',

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
      '[AGENDA_CLASSES_POST_ERROR]',
      error,
    )

    return createErrorResponse(
      error,
      'Erro interno ao criar turma.',
    )
  }
}
