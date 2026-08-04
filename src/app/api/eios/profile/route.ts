import {
  NextRequest,
  NextResponse,
} from 'next/server'

import type {
  EducationalContext,
} from '@/lib/eios/context/educational-context.contract'

import {
  createTeacherProfileFromEducationalContext,
} from '@/lib/eios/profile/teacher-profile.service'

export const dynamic =
  'force-dynamic'

export const runtime =
  'nodejs'

const NO_CACHE_HEADERS = {
  'Cache-Control':
    'no-store, no-cache, must-revalidate',
}

type EducationalContextApiResponse = {
  success:
    boolean

  context?:
    EducationalContext | null

  error?:
    string

  errors?:
    string[]

  warnings?:
    string[]
}

function normalizeMessages(
  values:
    unknown,
): string[] {
  if (
    !Array.isArray(
      values,
    )
  ) {
    return []
  }

  return values
    .filter(
      (
        value,
      ): value is string =>
        typeof value ===
          'string' &&
        Boolean(
          value.trim(),
        ),
    )
    .map(
      value =>
        value.trim(),
    )
}

async function readContextResponse(
  response:
    Response,
): Promise<EducationalContextApiResponse> {
  try {
    return await response
      .json() as EducationalContextApiResponse
  } catch {
    return {
      success:
        false,

      context:
        null,

      error:
        'A resposta do Context Engine possui formato inválido.',
    }
  }
}

function createContextUrl(
  request:
    NextRequest,
): URL {
  const contextUrl =
    new URL(
      '/api/eios/context',
      request.url,
    )

  const referenceDate =
    request
      .nextUrl
      .searchParams
      .get(
        'referenceDate',
      )

  const timezone =
    request
      .nextUrl
      .searchParams
      .get(
        'timezone',
      )

  if (
    referenceDate
  ) {
    contextUrl
      .searchParams
      .set(
        'referenceDate',
        referenceDate,
      )
  }

  if (
    timezone
  ) {
    contextUrl
      .searchParams
      .set(
        'timezone',
        timezone,
      )
  }

  return contextUrl
}

function getForwardHeaders(
  request:
    NextRequest,
): Headers {
  const headers =
    new Headers()

  headers.set(
    'Accept',
    'application/json',
  )

  const cookie =
    request.headers.get(
      'cookie',
    )

  if (
    cookie
  ) {
    headers.set(
      'cookie',
      cookie,
    )
  }

  const timezoneHeader =
    request.headers.get(
      'x-edi-timezone',
    )

  if (
    timezoneHeader
  ) {
    headers.set(
      'x-edi-timezone',
      timezoneHeader,
    )
  }

  return headers
}

function getContextError(
  result:
    EducationalContextApiResponse,
): string {
  if (
    result.error?.trim()
  ) {
    return result.error.trim()
  }

  const firstError =
    normalizeMessages(
      result.errors,
    )[0]

  return (
    firstError ??
    'Não foi possível carregar o contexto educacional.'
  )
}

export async function GET(
  request:
    NextRequest,
): Promise<NextResponse> {
  try {
    const contextResponse =
      await fetch(
        createContextUrl(
          request,
        ),
        {
          method:
            'GET',

          headers:
            getForwardHeaders(
              request,
            ),

          cache:
            'no-store',
        },
      )

    const contextResult =
      await readContextResponse(
        contextResponse,
      )

    if (
      !contextResponse.ok ||
      !contextResult.success ||
      !contextResult.context
    ) {
      return NextResponse.json(
        {
          success:
            false,

          profile:
            null,

          error:
            getContextError(
              contextResult,
            ),

          errors:
            normalizeMessages(
              contextResult.errors,
            ),

          warnings:
            normalizeMessages(
              contextResult.warnings,
            ),
        },
        {
          status:
            contextResponse.status,

          headers:
            NO_CACHE_HEADERS,
        },
      )
    }

    const profileResult =
      createTeacherProfileFromEducationalContext(
        contextResult.context,
      )

    if (
      !profileResult.success ||
      !profileResult.profile
    ) {
      return NextResponse.json(
        {
          ...profileResult,

          error:
            profileResult
              .errors[0] ??
            'Não foi possível gerar o Perfil Docente EDI.',
        },
        {
          status:
            422,

          headers:
            NO_CACHE_HEADERS,
        },
      )
    }

    return NextResponse.json(
      profileResult,
      {
        status:
          200,

        headers:
          NO_CACHE_HEADERS,
      },
    )
  } catch (
    error
  ) {
    const message =
      error instanceof Error
        ? error.message
        : 'Erro interno ao gerar o Perfil Docente EDI.'

    console.error(
      '[EIOS_PROFILE_GET_ERROR]',
      {
        error:
          message,
      },
    )

    return NextResponse.json(
      {
        success:
          false,

        profile:
          null,

        error:
          message,

        errors: [
          message,
        ],

        warnings:
          [],
      },
      {
        status:
          500,

        headers:
          NO_CACHE_HEADERS,
      },
    )
  }
}