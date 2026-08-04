import {
  NextRequest,
  NextResponse,
} from 'next/server'

import {
  createDefaultEvidenceProcessingOptions,
  type EducationalEvidence,
  type EvidenceConsolidationGroup,
  type EvidenceProcessingOptions,
  type EvidenceProcessingRequest,
} from '@/lib/eios/evidence-intelligence/evidence-intelligence.contract'

import {
  processEvidenceBatch,
  type EvidenceBatchProcessingConfiguration,
} from '@/lib/eios/evidence-intelligence/evidence-batch-processing.service'

export const dynamic =
  'force-dynamic'

export const runtime =
  'nodejs'

const NO_CACHE_HEADERS = {
  'Cache-Control':
    'no-store, no-cache, must-revalidate',
}

type EvidenceProcessingRequestBody = {
  requestId?:
    unknown

  evidence?:
    unknown

  consolidationGroups?:
    unknown

  options?:
    unknown

  configuration?:
    unknown

  requestedBy?:
    unknown

  requestedAt?:
    unknown

  metadata?:
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

function isEducationalEvidence(
  value:
    unknown,
): value is EducationalEvidence {
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
      value.type,
    ) &&
    isString(
      value.title,
    ) &&
    isNullableString(
      value.description,
    ) &&
    isString(
      value.status,
    ) &&
    isString(
      value.sourceType,
    ) &&
    Array.isArray(
      value.subjects,
    ) &&
    Array.isArray(
      value.curriculumReferences,
    ) &&
    Array.isArray(
      value.interventionReferences,
    ) &&
    Array.isArray(
      value.frameworkClassifications,
    ) &&
    Array.isArray(
      value.modalities,
    ) &&
    isRecord(
      value.temporalContext,
    ) &&
    (
      value.spatialContext ===
        null ||
      isRecord(
        value.spatialContext,
      )
    ) &&
    Array.isArray(
      value.files,
    ) &&
    Array.isArray(
      value.externalReferences,
    ) &&
    Array.isArray(
      value.relatedEvidenceIds,
    ) &&
    isRecord(
      value.quality,
    ) &&
    isRecord(
      value.reliability,
    ) &&
    isRecord(
      value.privacy,
    ) &&
    Array.isArray(
      value.knowledgeGraphEdgeIds,
    ) &&
    isNumber(
      value.version,
    ) &&
    isBoolean(
      value.active,
    ) &&
    isString(
      value.createdAt,
    ) &&
    isString(
      value.updatedAt,
    ) &&
    Array.isArray(
      value.auditTrail,
    ) &&
    isRecord(
      value.metadata,
    )
  )
}

function isEvidenceConsolidationGroup(
  value:
    unknown,
): value is EvidenceConsolidationGroup {
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
      value.name,
    ) &&
    isNullableString(
      value.description,
    ) &&
    Array.isArray(
      value.evidenceIds,
    ) &&
    value.evidenceIds.every(
      isString,
    ) &&
    isString(
      value.subjectType,
    ) &&
    isString(
      value.subjectId,
    ) &&
    (
      value.curriculumReference ===
        null ||
      isRecord(
        value.curriculumReference,
      )
    ) &&
    isNullableString(
      value.startsAt,
    ) &&
    isNullableString(
      value.endsAt,
    ) &&
    isString(
      value.aggregationMethod,
    ) &&
    isRecord(
      value.weights,
    ) &&
    isNumber(
      value.minimumEvidenceCount,
    ) &&
    Number.isInteger(
      value.minimumEvidenceCount,
    ) &&
    value.minimumEvidenceCount >=
      1 &&
    isBoolean(
      value.excludeRejectedEvidence,
    ) &&
    isBoolean(
      value.excludeSupersededEvidence,
    ) &&
    isRecord(
      value.metadata,
    )
  )
}

function isEvidenceProcessingOptions(
  value:
    unknown,
): value is EvidenceProcessingOptions {
  if (
    !isRecord(
      value,
    )
  ) {
    return false
  }

  return (
    isBoolean(
      value.validate,
    ) &&
    isBoolean(
      value.classifyFramework,
    ) &&
    isBoolean(
      value.evaluateQuality,
    ) &&
    isBoolean(
      value.evaluateReliability,
    ) &&
    isBoolean(
      value.detectContradictions,
    ) &&
    isBoolean(
      value.consolidate,
    ) &&
    isBoolean(
      value.linkKnowledgeGraph,
    ) &&
    isBoolean(
      value.allowAutomaticValidation,
    ) &&
    isBoolean(
      value.allowAutomaticClassification,
    ) &&
    isBoolean(
      value.requireHumanReviewForSensitiveData,
    ) &&
    isNumber(
      value.minimumConfidenceForAutomaticValidation,
    ) &&
    value.minimumConfidenceForAutomaticValidation >=
      0 &&
    value.minimumConfidenceForAutomaticValidation <=
      1 &&
    isRecord(
      value.metadata,
    )
  )
}

function isBatchConfiguration(
  value:
    unknown,
): value is Partial<EvidenceBatchProcessingConfiguration> {
  if (
    value ===
    undefined
  ) {
    return true
  }

  if (
    !isRecord(
      value,
    )
  ) {
    return false
  }

  if (
    value.concurrency !==
      undefined &&
    (
      !isNumber(
        value.concurrency,
      ) ||
      !Number.isInteger(
        value.concurrency,
      ) ||
      value.concurrency <
        1 ||
      value.concurrency >
        32
    )
  ) {
    return false
  }

  if (
    value.maximumEvidencePerBatch !==
      undefined &&
    (
      !isNumber(
        value.maximumEvidencePerBatch,
      ) ||
      !Number.isInteger(
        value.maximumEvidencePerBatch,
      ) ||
      value.maximumEvidencePerBatch <
        1
    )
  ) {
    return false
  }

  const booleanFields = [
    'stopOnFirstError',
    'continueOnItemFailure',
    'generateKnowledgeGraphLinks',
  ]

  return booleanFields.every(
    field =>
      value[field] ===
        undefined ||
      isBoolean(
        value[field],
      ),
  )
}

async function readRequestBody(
  request:
    NextRequest,
): Promise<EvidenceProcessingRequestBody | null> {
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
  details = [],
}: {
  message:
    string

  status:
    number

  details?:
    string[]
}): NextResponse {
  return NextResponse.json(
    {
      success:
        false,

      status:
        'failed',

      result: {
        success:
          false,

        evidence:
          [],

        validationResults:
          [],

        consolidations:
          [],

        contradictions:
          [],

        knowledgeGraphLinks:
          [],

        warnings:
          [],

        errors: [
          message,
          ...details,
        ],

        requiresHumanReview:
          true,
      },

      metrics:
        null,

      items:
        [],
    },
    {
      status,

      headers:
        NO_CACHE_HEADERS,
    },
  )
}

function createProcessingRequest(
  body:
    EvidenceProcessingRequestBody,
): EvidenceProcessingRequest | null {
  if (
    !isString(
      body.requestId,
    ) ||
    !body.requestId.trim()
  ) {
    return null
  }

  if (
    !Array.isArray(
      body.evidence,
    ) ||
    !body.evidence.every(
      isEducationalEvidence,
    )
  ) {
    return null
  }

  const consolidationGroups =
    body.consolidationGroups ===
      undefined
      ? []
      : body.consolidationGroups

  if (
    !Array.isArray(
      consolidationGroups,
    ) ||
    !consolidationGroups.every(
      isEvidenceConsolidationGroup,
    )
  ) {
    return null
  }

  const defaultOptions =
    createDefaultEvidenceProcessingOptions()

  const options =
    body.options ===
      undefined
      ? defaultOptions
      : body.options

  if (
    !isEvidenceProcessingOptions(
      options,
    )
  ) {
    return null
  }

  const requestedBy =
    body.requestedBy ===
      undefined
      ? null
      : body.requestedBy

  if (
    !isNullableString(
      requestedBy,
    )
  ) {
    return null
  }

  const requestedAt =
    body.requestedAt ===
      undefined
      ? new Date()
          .toISOString()
      : body.requestedAt

  if (
    !isString(
      requestedAt,
    ) ||
    Number.isNaN(
      Date.parse(
        requestedAt,
      ),
    )
  ) {
    return null
  }

  const metadata =
    body.metadata ===
      undefined
      ? {}
      : body.metadata

  if (
    !isRecord(
      metadata,
    )
  ) {
    return null
  }

  return {
    requestId:
      body.requestId.trim(),

    evidence:
      body.evidence,

    consolidationGroups,

    options,

    requestedBy,

    requestedAt,

    metadata,
  }
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

  const processingRequest =
    createProcessingRequest(
      body,
    )

  if (!processingRequest) {
    return createErrorResponse({
      message:
        'Os dados enviados para o processamento de evidências são inválidos.',

      status:
        400,

      details: [
        'Verifique requestId, evidence, consolidationGroups, options, requestedBy, requestedAt e metadata.',
      ],
    })
  }

  if (
    !isBatchConfiguration(
      body.configuration,
    )
  ) {
    return createErrorResponse({
      message:
        'A configuração do processamento em lote é inválida.',

      status:
        400,
    })
  }

  try {
    const execution =
      await processEvidenceBatch({
        request:
          processingRequest,

        configuration:
          body.configuration,
      })

    const statusCode =
      execution.status ===
        'failed'
        ? 422
        : 200

    return NextResponse.json(
      execution,
      {
        status:
          statusCode,

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
        : 'Erro interno ao processar o lote de evidências.'

    console.error(
      '[EIOS_EVIDENCE_PROCESSING_ERROR]',
      {
        error:
          message,

        requestId:
          processingRequest
            .requestId,

        evidenceCount:
          processingRequest
            .evidence
            .length,

        consolidationGroupCount:
          processingRequest
            .consolidationGroups
            .length,

        requestedBy:
          processingRequest
            .requestedBy,
      },
    )

    return createErrorResponse({
      message,

      status:
        500,
    })
  }
}