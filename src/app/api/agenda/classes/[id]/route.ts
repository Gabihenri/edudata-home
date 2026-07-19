import {
  NextRequest,
  NextResponse,
} from 'next/server'

import {
  classesService,
  type UpdateAgendaClassInput,
} from '@/lib/agenda'

import {
  requireSessionUser,
} from '@/lib/auth/session'

export const dynamic =
  'force-dynamic'

type RouteContext = {
  params: {
    id: string
  }
}

type UnknownRecord =
  Record<string, unknown>

const NO_CACHE_HEADERS = {
  'Cache-Control':
    'no-store, no-cache, must-revalidate',
}

function isRecord(
  value: unknown,
): value is UnknownRecord {
  return (
    typeof value ===
      'object' &&
    value !== null &&
    !Array.isArray(value)
  )
}

function hasOwnProperty(
  record: UnknownRecord,
  key: string,
): boolean {
  return Object.prototype
    .hasOwnProperty.call(
      record,
      key,
    )
}

function normalizeName(
  value: unknown,
): string {
  if (
    typeof value !==
    'string'
  ) {
    throw new Error(
      'O nome da turma é inválido.',
    )
  }

  const normalizedValue =
    value.trim()

  if (!normalizedValue) {
    throw new Error(
      'O nome da turma é obrigatório.',
    )
  }

  return normalizedValue
}

function normalizeOptionalText(
  value: unknown,
  fieldName: string,
): string | null {
  if (
    value === null ||
    value === undefined
  ) {
    return null
  }

  if (
    typeof value !==
    'string'
  ) {
    throw new Error(
      `${fieldName} inválido.`,
    )
  }

  const normalizedValue =
    value.trim()

  return (
    normalizedValue ||
    null
  )
}

function normalizeStudentsCount(
  value: unknown,
): number {
  if (
    value === null ||
    value === undefined ||
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
  if (
    typeof value !==
    'boolean'
  ) {
    throw new Error(
      'A situação da turma é inválida.',
    )
  }

  return value
}

async function readRequestBody(
  request: NextRequest,
): Promise<UnknownRecord> {
  let body: unknown

  try {
    body =
      await request.json()
  } catch {
    throw new Error(
      'Os dados enviados são inválidos.',
    )
  }

  if (!isRecord(body)) {
    throw new Error(
      'Os dados enviados são inválidos.',
    )
  }

  return body
}

function getErrorStatus(
  error: unknown,
): number {
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
      'não possui permissão',
    ) ||
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
      'não encontrada',
    ) ||
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
      'número inteiro',
    ) ||
    message.includes(
      'ao menos um campo',
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

export async function PATCH(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const user =
      await requireSessionUser()

    const classId =
      context.params.id
        ?.trim()

    if (!classId) {
      throw new Error(
        'O ID da turma é obrigatório.',
      )
    }

    const existingClass =
      await classesService
        .getById(classId)

    /*
     * Segurança:
     * o professor somente pode atualizar
     * turmas pertencentes à própria conta.
     */
    if (
      existingClass.teacher_id !==
      user.id
    ) {
      throw new Error(
        'Você não possui permissão para atualizar esta turma.',
      )
    }

    const body =
      await readRequestBody(
        request,
      )

    const input:
      UpdateAgendaClassInput = {}

    if (
      hasOwnProperty(
        body,
        'name',
      )
    ) {
      input.name =
        normalizeName(
          body.name,
        )
    }

    if (
      hasOwnProperty(
        body,
        'schoolYear',
      )
    ) {
      input.school_year =
        normalizeOptionalText(
          body.schoolYear,
          'O ano letivo',
        )
    }

    if (
      hasOwnProperty(
        body,
        'grade',
      )
    ) {
      input.grade =
        normalizeOptionalText(
          body.grade,
          'A série ou etapa',
        )
    }

    if (
      hasOwnProperty(
        body,
        'subject',
      )
    ) {
      input.subject =
        normalizeOptionalText(
          body.subject,
          'A disciplina ou área',
        )
    }

    if (
      hasOwnProperty(
        body,
        'studentsCount',
      )
    ) {
      input.students_count =
        normalizeStudentsCount(
          body.studentsCount,
        )
    }

    if (
      hasOwnProperty(
        body,
        'active',
      )
    ) {
      input.active =
        normalizeActive(
          body.active,
        )
    }

    if (
      Object.keys(input)
        .length === 0
    ) {
      throw new Error(
        'Informe ao menos um campo para atualizar.',
      )
    }

    /*
     * teacher_id e school_id não são aceitos
     * pelo navegador e permanecem inalterados.
     */
    const data =
      await classesService
        .update(
          classId,
          input,
        )

    return NextResponse.json(
      {
        success: true,

        message:
          'Turma atualizada com sucesso.',

        data,
      },
      {
        status: 200,
        headers:
          NO_CACHE_HEADERS,
      },
    )
  } catch (error) {
    console.error(
      '[AGENDA_CLASS_PATCH_ERROR]',
      error,
    )

    return createErrorResponse(
      error,
      'Não foi possível atualizar a turma.',
    )
  }
}