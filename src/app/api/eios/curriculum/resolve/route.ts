import {
  NextRequest,
  NextResponse,
} from 'next/server'

import type {
  CurriculumApplicabilityRule,
  CurriculumFramework,
  CurriculumResolutionInput,
  CurriculumVersion,
} from '@/lib/eios/curriculum/curriculum-intelligence.contract'

import {
  resolveApplicableCurriculumFrameworks,
} from '@/lib/eios/curriculum/curriculum-intelligence.service'

export const dynamic =
  'force-dynamic'

export const runtime =
  'nodejs'

const NO_CACHE_HEADERS = {
  'Cache-Control':
    'no-store, no-cache, must-revalidate',
}

type CurriculumResolveRequestBody = {
  frameworks?:
    unknown

  versions?:
    unknown

  applicabilityRules?:
    unknown

  input?:
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

function isString(
  value:
    unknown,
): value is string {
  return (
    typeof value ===
      'string'
  )
}

function isNullableString(
  value:
    unknown,
): value is string | null {
  return (
    value ===
      null ||
    isString(
      value,
    )
  )
}

function isBoolean(
  value:
    unknown,
): value is boolean {
  return (
    typeof value ===
      'boolean'
  )
}

function isNumber(
  value:
    unknown,
): value is number {
  return (
    typeof value ===
      'number' &&
    Number.isFinite(
      value,
    )
  )
}

function isNullableNumber(
  value:
    unknown,
): value is number | null {
  return (
    value ===
      null ||
    isNumber(
      value,
    )
  )
}

function isStringArray(
  value:
    unknown,
): value is string[] {
  return (
    Array.isArray(
      value,
    ) &&
    value.every(
      item =>
        typeof item ===
        'string',
    )
  )
}

function isCurriculumFramework(
  value:
    unknown,
): value is CurriculumFramework {
  if (
    !isRecord(
      value,
    )
  ) {
    return false
  }

  return (
    isString(
      value.id,
    ) &&
    isNullableString(
      value.code,
    ) &&
    isString(
      value.name,
    ) &&
    isNullableString(
      value.shortName,
    ) &&
    isNullableString(
      value.description,
    ) &&
    isString(
      value.type,
    ) &&
    isString(
      value.source,
    ) &&
    isStringArray(
      value.educationLevels,
    ) &&
    isNullableString(
      value.countryCode,
    ) &&
    isNullableString(
      value.stateCode,
    ) &&
    isNullableString(
      value.municipalityCode,
    ) &&
    isNullableString(
      value.organizationId,
    ) &&
    isNullableString(
      value.institutionId,
    ) &&
    isBoolean(
      value.official,
    ) &&
    isNullableString(
      value.sourceUrl,
    ) &&
    isNullableString(
      value.publisher,
    ) &&
    isString(
      value.status,
    ) &&
    isRecord(
      value.metadata,
    )
  )
}

function isCurriculumVersion(
  value:
    unknown,
): value is CurriculumVersion {
  if (
    !isRecord(
      value,
    )
  ) {
    return false
  }

  return (
    isString(
      value.id,
    ) &&
    isString(
      value.frameworkId,
    ) &&
    isNullableString(
      value.code,
    ) &&
    isString(
      value.name,
    ) &&
    isString(
      value.version,
    ) &&
    isNullableString(
      value.description,
    ) &&
    isNullableString(
      value.validFrom,
    ) &&
    isNullableString(
      value.validUntil,
    ) &&
    isNullableString(
      value.publishedAt,
    ) &&
    isNullableString(
      value.importedAt,
    ) &&
    isNullableString(
      value.sourceHash,
    ) &&
    isNullableString(
      value.previousVersionId,
    ) &&
    isNullableString(
      value.nextVersionId,
    ) &&
    isString(
      value.status,
    ) &&
    isRecord(
      value.metadata,
    )
  )
}

function isApplicabilityContext(
  value:
    unknown,
): value is CurriculumResolutionInput['context'] {
  if (
    !isRecord(
      value,
    )
  ) {
    return false
  }

  return (
    isNullableString(
      value.institutionId,
    ) &&
    isNullableString(
      value.campusId,
    ) &&
    isNullableString(
      value.schoolId,
    ) &&
    isNullableString(
      value.programId,
    ) &&
    isNullableString(
      value.courseId,
    ) &&
    isNullableString(
      value.curriculumMatrixId,
    ) &&
    isNullableString(
      value.componentId,
    ) &&
    isNullableString(
      value.offeringId,
    ) &&
    isNullableString(
      value.classId,
    ) &&
    isNullableString(
      value.academicPeriodId,
    ) &&
    isNullableString(
      value.educationLevel,
    ) &&
    isNullableString(
      value.countryCode,
    ) &&
    isNullableString(
      value.stateCode,
    ) &&
    isNullableString(
      value.municipalityCode,
    ) &&
    isNullableNumber(
      value.academicYear,
    ) &&
    isRecord(
      value.metadata,
    )
  )
}

function isCurriculumApplicabilityRule(
  value:
    unknown,
): value is CurriculumApplicabilityRule {
  if (
    !isRecord(
      value,
    )
  ) {
    return false
  }

  return (
    isString(
      value.id,
    ) &&
    isString(
      value.frameworkId,
    ) &&
    isString(
      value.versionId,
    ) &&
    isNullableString(
      value.territoryId,
    ) &&
    isNumber(
      value.priority,
    ) &&
    isApplicabilityContext(
      value.context,
    ) &&
    isBoolean(
      value.mandatory,
    ) &&
    isBoolean(
      value.active,
    ) &&
    isNullableString(
      value.explanation,
    ) &&
    isRecord(
      value.metadata,
    )
  )
}

function isCurriculumResolutionInput(
  value:
    unknown,
): value is CurriculumResolutionInput {
  if (
    !isRecord(
      value,
    )
  ) {
    return false
  }

  const requestedFrameworkIdsValid =
    value.requestedFrameworkIds ===
      undefined ||
    isStringArray(
      value.requestedFrameworkIds,
    )

  const requestedVersionIdsValid =
    value.requestedVersionIds ===
      undefined ||
    isStringArray(
      value.requestedVersionIds,
    )

  return (
    isApplicabilityContext(
      value.context,
    ) &&
    requestedFrameworkIdsValid &&
    requestedVersionIdsValid &&
    isBoolean(
      value.includeInherited,
    ) &&
    isBoolean(
      value.includeOptional,
    )
  )
}

function normalizeFrameworks(
  value:
    unknown,
): CurriculumFramework[] | null {
  if (
    !Array.isArray(
      value,
    ) ||
    !value.every(
      isCurriculumFramework,
    )
  ) {
    return null
  }

  return value
}

function normalizeVersions(
  value:
    unknown,
): CurriculumVersion[] | null {
  if (
    !Array.isArray(
      value,
    ) ||
    !value.every(
      isCurriculumVersion,
    )
  ) {
    return null
  }

  return value
}

function normalizeApplicabilityRules(
  value:
    unknown,
): CurriculumApplicabilityRule[] | null {
  if (
    !Array.isArray(
      value,
    ) ||
    !value.every(
      isCurriculumApplicabilityRule,
    )
  ) {
    return null
  }

  return value
}

async function readRequestBody(
  request:
    NextRequest,
): Promise<CurriculumResolveRequestBody | null> {
  try {
    const body:
      unknown =
        await request.json()

    if (
      !isRecord(
        body,
      )
    ) {
      return null
    }

    return body
  } catch {
    return null
  }
}

function createErrorResponse({
  message,
  status,
}: {
  message:
    string

  status:
    number
}): NextResponse {
  return NextResponse.json(
    {
      success:
        false,

      resolvedFrameworks:
        [],

      primaryFramework:
        null,

      warnings:
        [],

      errors: [
        message,
      ],

      requiresHumanReview:
        true,
    },
    {
      status,

      headers:
        NO_CACHE_HEADERS,
    },
  )
}

export async function POST(
  request:
    NextRequest,
): Promise<NextResponse> {
  const body =
    await readRequestBody(
      request,
    )

  if (!body) {
    return createErrorResponse({
      message:
        'O corpo da requisição deve conter um JSON válido.',

      status:
        400,
    })
  }

  const frameworks =
    normalizeFrameworks(
      body.frameworks,
    )

  if (!frameworks) {
    return createErrorResponse({
      message:
        'O campo "frameworks" deve conter uma lista válida de referenciais curriculares.',

      status:
        400,
    })
  }

  const versions =
    normalizeVersions(
      body.versions,
    )

  if (!versions) {
    return createErrorResponse({
      message:
        'O campo "versions" deve conter uma lista válida de versões curriculares.',

      status:
        400,
    })
  }

  const applicabilityRules =
    normalizeApplicabilityRules(
      body.applicabilityRules,
    )

  if (!applicabilityRules) {
    return createErrorResponse({
      message:
        'O campo "applicabilityRules" deve conter uma lista válida de regras curriculares.',

      status:
        400,
    })
  }

  if (
    !isCurriculumResolutionInput(
      body.input,
    )
  ) {
    return createErrorResponse({
      message:
        'O campo "input" deve conter um contexto válido para resolução curricular.',

      status:
        400,
    })
  }

  try {
    const result =
      resolveApplicableCurriculumFrameworks({
        frameworks,

        versions,

        applicabilityRules,

        input:
          body.input,
      })

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
        : 'Erro interno ao resolver os currículos aplicáveis.'

    console.error(
      '[EIOS_CURRICULUM_RESOLVE_ERROR]',
      {
        error:
          message,

        institutionId:
          body.input
            .context
            .institutionId,

        programId:
          body.input
            .context
            .programId,

        componentId:
          body.input
            .context
            .componentId,

        classId:
          body.input
            .context
            .classId,

        academicYear:
          body.input
            .context
            .academicYear,
      },
    )

    return createErrorResponse({
      message,

      status:
        500,
    })
  }
}