import {
  NextRequest,
  NextResponse,
} from 'next/server'

import type {
  AcademicSemanticResolutionInput,
} from '@/lib/eios/semantic/academic-semantic.contract'

import {
  resolveAcademicSemanticTerm,
} from '@/lib/eios/semantic/academic-semantic.service'

export const dynamic =
  'force-dynamic'

export const runtime =
  'nodejs'

const NO_CACHE_HEADERS = {
  'Cache-Control':
    'no-store, no-cache, must-revalidate',
}

type AcademicSemanticResolveRequest = {
  term?:
    unknown

  language?:
    unknown

  expectedDomain?:
    unknown

  expectedEntityTypes?:
    unknown

  organizationContext?:
    unknown

  programContext?:
    unknown
}

function isRecord(
  value:
    unknown,
): value is Record<string, unknown> {
  return (
    typeof value ===
      'object' &&
    value !==
      null &&
    !Array.isArray(
      value,
    )
  )
}

function normalizeString(
  value:
    unknown,
): string | undefined {
  if (
    typeof value !==
    'string'
  ) {
    return undefined
  }

  const normalized =
    value.trim()

  return normalized
    ? normalized
    : undefined
}

function normalizeStringArray(
  value:
    unknown,
): string[] | undefined {
  if (
    !Array.isArray(
      value,
    )
  ) {
    return undefined
  }

  const normalized =
    value
      .filter(
        (
          item,
        ): item is string =>
          typeof item ===
          'string',
      )
      .map(
        item =>
          item.trim(),
      )
      .filter(
        Boolean,
      )

  return normalized.length >
    0
    ? normalized
    : undefined
}

function normalizeContext(
  value:
    unknown,
): Record<string, unknown> | undefined {
  if (
    !isRecord(
      value,
    )
  ) {
    return undefined
  }

  return value
}

function buildResolutionInput(
  body:
    AcademicSemanticResolveRequest,
): AcademicSemanticResolutionInput | null {
  const term =
    normalizeString(
      body.term,
    )

  if (!term) {
    return null
  }

  return {
    term,

    language:
      normalizeString(
        body.language,
      ),

    expectedDomain:
      normalizeString(
        body.expectedDomain,
      ) as AcademicSemanticResolutionInput['expectedDomain'],

    expectedEntityTypes:
      normalizeStringArray(
        body.expectedEntityTypes,
      ) as AcademicSemanticResolutionInput['expectedEntityTypes'],

    organizationContext:
      normalizeContext(
        body.organizationContext,
      ) as AcademicSemanticResolutionInput['organizationContext'],

    programContext:
      normalizeContext(
        body.programContext,
      ) as AcademicSemanticResolutionInput['programContext'],
  }
}

async function readBody(
  request:
    NextRequest,
): Promise<AcademicSemanticResolveRequest | null> {
  try {
    const body =
      await request.json()

    return isRecord(
      body,
    )
      ? body
      : null
  } catch {
    return null
  }
}

export async function POST(
  request:
    NextRequest,
): Promise<NextResponse> {
  const body =
    await readBody(
      request,
    )

  if (!body) {
    return NextResponse.json(
      {
        success:
          false,

        resolvedEntityType:
          null,

        candidates:
          [],

        warnings:
          [],

        errors: [
          'O corpo da requisição deve conter um JSON válido.',
        ],

        requiresHumanReview:
          true,
      },
      {
        status:
          400,

        headers:
          NO_CACHE_HEADERS,
      },
    )
  }

  const input =
    buildResolutionInput(
      body,
    )

  if (!input) {
    return NextResponse.json(
      {
        success:
          false,

        resolvedEntityType:
          null,

        candidates:
          [],

        warnings:
          [],

        errors: [
          'O campo "term" é obrigatório.',
        ],

        requiresHumanReview:
          true,
      },
      {
        status:
          400,

        headers:
          NO_CACHE_HEADERS,
      },
    )
  }

  try {
    const result =
      resolveAcademicSemanticTerm(
        input,
      )

    return NextResponse.json(
      result,
      {
        status:
          result.success
            ? 200
            : 422,

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
        : 'Erro interno ao resolver o termo acadêmico.'

    console.error(
      '[EIOS_ACADEMIC_SEMANTIC_RESOLVE_ERROR]',
      {
        error:
          message,

        term:
          input.term,
      },
    )

    return NextResponse.json(
      {
        success:
          false,

        resolvedEntityType:
          null,

        candidates:
          [],

        warnings:
          [],

        errors: [
          message,
        ],

        requiresHumanReview:
          true,
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