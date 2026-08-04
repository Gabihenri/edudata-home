import {
  NextRequest,
  NextResponse,
} from 'next/server'

import type {
  DecisionRule,
  EducationalDecision,
} from '@/lib/eios/decision-intelligence/decision-intelligence.contract'

import {
  processDecisionIntelligence,
  validateDecisionIntelligenceResult,
  type DecisionIntelligenceProcessingOptions,
  type DecisionIntelligenceResult,
} from '@/lib/eios/decision-intelligence/decision-intelligence.service'

import {
  processDecisionBatch,
  validateDecisionBatchResult,
  type DecisionBatchProcessingOptions,
  type DecisionBatchProcessingResult,
} from '@/lib/eios/decision-intelligence/decision-batch-processing.service'

import {
  supabase,
} from '@/lib/supabaseClient'

export const dynamic =
  'force-dynamic'

export const runtime =
  'nodejs'

const NO_CACHE_HEADERS = {
  'Cache-Control':
    'no-store, no-cache, must-revalidate',
}

const MAXIMUM_BATCH_SIZE =
  500

type DecisionIntelligenceRequestMode =
  | 'single'
  | 'batch'

type DecisionIntelligenceRequestBody = {
  mode?: unknown

  decision?: unknown

  decisions?: unknown

  rules?: unknown

  options?: unknown

  metadata?: unknown
}

type AuthenticatedUser = {
  id: string
  email: string | null
}

type DecisionIntelligenceApiSuccessResponse = {
  success: true

  mode:
    DecisionIntelligenceRequestMode

  data:
    | DecisionIntelligenceResult
    | DecisionBatchProcessingResult

  request: {
    requestedBy: string

    requestedAt: string

    metadata:
      Record<string, unknown>
  }
}

type DecisionIntelligenceApiErrorResponse = {
  success: false

  mode:
    DecisionIntelligenceRequestMode | null

  error: string

  code: string

  details: string[]

  requiresHumanReview: boolean

  requestedAt: string
}

function nowIso(): string {
  return new Date()
    .toISOString()
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

function isStringArray(
  value:
    unknown,
): value is string[] {
  return (
    Array.isArray(
      value,
    ) &&
    value.every(
      isString,
    )
  )
}

function isRequestMode(
  value:
    unknown,
): value is DecisionIntelligenceRequestMode {
  return (
    value ===
      'single' ||
    value ===
      'batch'
  )
}

function isEducationalDecision(
  value:
    unknown,
): value is EducationalDecision {
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
      value.category,
    ) &&
    isString(
      value.title,
    ) &&
    isString(
      value.description,
    ) &&
    isString(
      value.status,
    ) &&
    isString(
      value.priority,
    ) &&
    isString(
      value.severity,
    ) &&
    isString(
      value.urgency,
    ) &&
    isString(
      value.sourceType,
    ) &&
    isString(
      value.generationMethod,
    ) &&
    isNullableString(
      value.organizationId,
    ) &&
    isNullableString(
      value.schoolId,
    ) &&
    Array.isArray(
      value.subjects,
    ) &&
    Array.isArray(
      value.evidenceReferences,
    ) &&
    Array.isArray(
      value.consolidationReferences,
    ) &&
    Array.isArray(
      value.contradictionReferences,
    ) &&
    Array.isArray(
      value.knowledgeGraphReferences,
    ) &&
    Array.isArray(
      value.curriculumReferences,
    ) &&
    Array.isArray(
      value.frameworkClassifications,
    ) &&
    Array.isArray(
      value.risks,
    ) &&
    Array.isArray(
      value.recommendations,
    ) &&
    Array.isArray(
      value.alerts,
    ) &&
    Array.isArray(
      value.actionPlans,
    ) &&
    Array.isArray(
      value.auditTrail,
    ) &&
    isRecord(
      value.explanation,
    ) &&
    isRecord(
      value.privacy,
    ) &&
    isBoolean(
      value.humanReviewRequired,
    ) &&
    isString(
      value.createdAt,
    ) &&
    isString(
      value.updatedAt,
    ) &&
    isRecord(
      value.metadata,
    )
  )
}

function isDecisionRule(
  value:
    unknown,
): value is DecisionRule {
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
      value.code,
    ) &&
    isString(
      value.name,
    ) &&
    isNullableString(
      value.description,
    ) &&
    isBoolean(
      value.active,
    ) &&
    isString(
      value.version,
    ) &&
    isString(
      value.source,
    ) &&
    Array.isArray(
      value.subjectTypes,
    ) &&
    Array.isArray(
      value.categories,
    ) &&
    Array.isArray(
      value.conditions,
    ) &&
    isNumber(
      value.minimumConditionScore,
    ) &&
    isRecord(
      value.outcome,
    ) &&
    isNullableString(
      value.validFrom,
    ) &&
    isNullableString(
      value.validUntil,
    ) &&
    isNullableString(
      value.institutionId,
    ) &&
    isString(
      value.createdAt,
    ) &&
    isString(
      value.updatedAt,
    ) &&
    isNullableString(
      value.createdBy,
    ) &&
    isNullableString(
      value.updatedBy,
    ) &&
    isRecord(
      value.metadata,
    )
  )
}

function isDecisionRules(
  value:
    unknown,
): value is DecisionRule[] {
  return (
    Array.isArray(
      value,
    ) &&
    value.every(
      isDecisionRule,
    )
  )
}

function isSingleProcessingOptions(
  value:
    unknown,
): value is DecisionIntelligenceProcessingOptions {
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

  const booleanFields = [
    'applyRules',
    'applyPrioritization',
    'generateRecommendations',
    'generateAlerts',
    'generateActionPlans',
    'stopOnError',
  ]

  if (
    !booleanFields.every(
      field =>
        value[field] ===
          undefined ||
        isBoolean(
          value[field],
        ),
    )
  ) {
    return false
  }

  const objectFields = [
    'additionalData',
    'prioritizationWeights',
    'recommendationOptions',
    'alertOptions',
    'actionPlanOptions',
  ]

  if (
    !objectFields.every(
      field =>
        value[field] ===
          undefined ||
        isRecord(
          value[field],
        ),
    )
  ) {
    return false
  }

  return (
    value.rules ===
      undefined ||
    isDecisionRules(
      value.rules,
    )
  )
}

function isBatchProcessingOptions(
  value:
    unknown,
): value is DecisionBatchProcessingOptions {
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
    value.executionMode !==
      undefined &&
    value.executionMode !==
      'sequential' &&
    value.executionMode !==
      'parallel'
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
        20
    )
  ) {
    return false
  }

  if (
    value.continueOnError !==
      undefined &&
    !isBoolean(
      value.continueOnError,
    )
  ) {
    return false
  }

  if (
    value.preserveInputOrder !==
      undefined &&
    !isBoolean(
      value.preserveInputOrder,
    )
  ) {
    return false
  }

  if (
    value.rules !==
      undefined &&
    !isDecisionRules(
      value.rules,
    )
  ) {
    return false
  }

  if (
    value.additionalDataByDecisionId !==
      undefined &&
    !isRecord(
      value.additionalDataByDecisionId,
    )
  ) {
    return false
  }

  if (
    value.intelligenceOptions !==
      undefined &&
    !isSingleProcessingOptions(
      value.intelligenceOptions,
    )
  ) {
    return false
  }

  return true
}

function getBearerToken(
  request:
    NextRequest,
): string | null {
  const authorization =
    request.headers.get(
      'authorization',
    )

  if (
    !authorization
  ) {
    return null
  }

  const [
    scheme,
    token,
  ] = authorization
    .trim()
    .split(
      /\s+/,
    )

  if (
    scheme?.toLowerCase() !==
      'bearer' ||
    !token?.trim()
  ) {
    return null
  }

  return token.trim()
}

async function authenticateRequest(
  request:
    NextRequest,
): Promise<AuthenticatedUser | null> {
  const token =
    getBearerToken(
      request,
    )

  if (
    !token
  ) {
    return null
  }

  const {
    data,
    error,
  } =
    await supabase.auth.getUser(
      token,
    )

  if (
    error ||
    !data.user
  ) {
    return null
  }

  return {
    id:
      data.user.id,

    email:
      data.user.email ??
      null,
  }
}

async function readRequestBody(
  request:
    NextRequest,
): Promise<DecisionIntelligenceRequestBody | null> {
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
  code,
  status,
  mode = null,
  details = [],
  requiresHumanReview = false,
}: {
  message:
    string

  code:
    string

  status:
    number

  mode?:
    DecisionIntelligenceRequestMode | null

  details?:
    string[]

  requiresHumanReview?:
    boolean
}): NextResponse<
  DecisionIntelligenceApiErrorResponse
> {
  return NextResponse.json(
    {
      success:
        false,

      mode,

      error:
        message,

      code,

      details,

      requiresHumanReview,

      requestedAt:
        nowIso(),
    },
    {
      status,

      headers:
        NO_CACHE_HEADERS,
    },
  )
}

function createSuccessResponse({
  mode,
  data,
  user,
  metadata,
  status = 200,
}: {
  mode:
    DecisionIntelligenceRequestMode

  data:
    | DecisionIntelligenceResult
    | DecisionBatchProcessingResult

  user:
    AuthenticatedUser

  metadata:
    Record<string, unknown>

  status?:
    number
}): NextResponse<
  DecisionIntelligenceApiSuccessResponse
> {
  return NextResponse.json(
    {
      success:
        true,

      mode,

      data,

      request: {
        requestedBy:
          user.id,

        requestedAt:
          nowIso(),

        metadata: {
          ...metadata,

          userEmail:
            user.email,

          engine:
            'decision-intelligence',

          framework:
            'Framework EDI',

          apiVersion:
            'v1',
        },
      },
    },
    {
      status,

      headers:
        NO_CACHE_HEADERS,
    },
  )
}

function getRequestMetadata(
  value:
    unknown,
): Record<string, unknown> {
  return isRecord(
    value,
  )
    ? value
    : {}
}

function consolidateSingleResult(
  result:
    DecisionIntelligenceResult,
): DecisionIntelligenceResult {
  const validation =
    validateDecisionIntelligenceResult(
      result,
    )

  return {
    ...result,

    success:
      result.success &&
      validation.valid,

    warnings:
      Array.from(
        new Set([
          ...result.warnings,
          ...validation.warnings,
        ]),
      ),

    errors:
      Array.from(
        new Set([
          ...result.errors,
          ...validation.errors,
        ]),
      ),
  }
}

function consolidateBatchResult(
  result:
    DecisionBatchProcessingResult,
): DecisionBatchProcessingResult {
  const validation =
    validateDecisionBatchResult(
      result,
    )

  return {
    ...result,

    success:
      result.success &&
      validation.valid,

    warnings:
      Array.from(
        new Set([
          ...result.warnings,
          ...validation.warnings,
        ]),
      ),

    errors:
      Array.from(
        new Set([
          ...result.errors,
          ...validation.errors,
        ]),
      ),
  }
}

async function processSingleRequest({
  body,
  user,
}: {
  body:
    DecisionIntelligenceRequestBody

  user:
    AuthenticatedUser
}): Promise<NextResponse> {
  if (
    !isEducationalDecision(
      body.decision,
    )
  ) {
    return createErrorResponse({
      message:
        'A decisão educacional enviada é inválida.',

      code:
        'INVALID_DECISION',

      status:
        400,

      mode:
        'single',

      details: [
        'Envie uma EducationalDecision completa e compatível com o contrato oficial.',
      ],
    })
  }

  const rules =
    body.rules ===
      undefined
      ? []
      : body.rules

  if (
    !isDecisionRules(
      rules,
    )
  ) {
    return createErrorResponse({
      message:
        'As regras decisórias enviadas são inválidas.',

      code:
        'INVALID_DECISION_RULES',

      status:
        400,

      mode:
        'single',
    })
  }

  if (
    !isSingleProcessingOptions(
      body.options,
    )
  ) {
    return createErrorResponse({
      message:
        'As opções de processamento da decisão são inválidas.',

      code:
        'INVALID_PROCESSING_OPTIONS',

      status:
        400,

      mode:
        'single',
    })
  }

  const options: DecisionIntelligenceProcessingOptions = {
    ...body.options,

    rules,

    additionalData: {
      ...body.options
        ?.additionalData,

      requestContext: {
        requestedBy:
          user.id,

        requestedAt:
          nowIso(),

        source:
          'decision-intelligence-api',
      },
    },
  }

  try {
    const result =
      consolidateSingleResult(
        processDecisionIntelligence({
          decision:
            body.decision,

          options,
        }),
      )

    return createSuccessResponse({
      mode:
        'single',

      data:
        result,

      user,

      metadata:
        getRequestMetadata(
          body.metadata,
        ),

      status:
        result.success
          ? 200
          : 422,
    })
  } catch (
    error
  ) {
    const message =
      error instanceof Error
        ? error.message
        : 'Erro interno ao processar a decisão educacional.'

    console.error(
      '[EIOS_DECISION_INTELLIGENCE_SINGLE_ERROR]',
      {
        message,

        userId:
          user.id,

        decisionId:
          body.decision.id,

        occurredAt:
          nowIso(),
      },
    )

    return createErrorResponse({
      message,

      code:
        'DECISION_PROCESSING_FAILED',

      status:
        500,

      mode:
        'single',

      requiresHumanReview:
        true,
    })
  }
}

async function processBatchRequest({
  body,
  user,
}: {
  body:
    DecisionIntelligenceRequestBody

  user:
    AuthenticatedUser
}): Promise<NextResponse> {
  if (
    !Array.isArray(
      body.decisions,
    ) ||
    !body.decisions.every(
      isEducationalDecision,
    )
  ) {
    return createErrorResponse({
      message:
        'O lote de decisões enviado é inválido.',

      code:
        'INVALID_DECISION_BATCH',

      status:
        400,

      mode:
        'batch',

      details: [
        'Envie uma lista composta apenas por EducationalDecision completas.',
      ],
    })
  }

  if (
    body.decisions.length ===
      0
  ) {
    return createErrorResponse({
      message:
        'O lote deve conter ao menos uma decisão.',

      code:
        'EMPTY_DECISION_BATCH',

      status:
        400,

      mode:
        'batch',
    })
  }

  if (
    body.decisions.length >
    MAXIMUM_BATCH_SIZE
  ) {
    return createErrorResponse({
      message:
        `O lote ultrapassa o limite de ${MAXIMUM_BATCH_SIZE} decisões.`,

      code:
        'DECISION_BATCH_LIMIT_EXCEEDED',

      status:
        413,

      mode:
        'batch',
    })
  }

  const rules =
    body.rules ===
      undefined
      ? []
      : body.rules

  if (
    !isDecisionRules(
      rules,
    )
  ) {
    return createErrorResponse({
      message:
        'As regras decisórias enviadas são inválidas.',

      code:
        'INVALID_DECISION_RULES',

      status:
        400,

      mode:
        'batch',
    })
  }

  if (
    !isBatchProcessingOptions(
      body.options,
    )
  ) {
    return createErrorResponse({
      message:
        'As opções de processamento em lote são inválidas.',

      code:
        'INVALID_BATCH_OPTIONS',

      status:
        400,

      mode:
        'batch',
    })
  }

  const options: DecisionBatchProcessingOptions = {
    ...body.options,

    rules,

    additionalDataByDecisionId: {
      ...body.options
        ?.additionalDataByDecisionId,

      ...Object.fromEntries(
        body.decisions.map(
          decision => [
            decision.id,
            {
              ...body.options
                ?.additionalDataByDecisionId
                ?.[decision.id],

              requestContext: {
                requestedBy:
                  user.id,

                requestedAt:
                  nowIso(),

                source:
                  'decision-intelligence-api',
              },
            },
          ],
        ),
      ),
    },
  }

  try {
    const result =
      consolidateBatchResult(
        await processDecisionBatch({
          decisions:
            body.decisions,

          options,
        }),
      )

    return createSuccessResponse({
      mode:
        'batch',

      data:
        result,

      user,

      metadata:
        getRequestMetadata(
          body.metadata,
        ),

      status:
        result.success
          ? 200
          : 422,
    })
  } catch (
    error
  ) {
    const message =
      error instanceof Error
        ? error.message
        : 'Erro interno ao processar o lote de decisões.'

    console.error(
      '[EIOS_DECISION_INTELLIGENCE_BATCH_ERROR]',
      {
        message,

        userId:
          user.id,

        decisionCount:
          body.decisions.length,

        occurredAt:
          nowIso(),
      },
    )

    return createErrorResponse({
      message,

      code:
        'DECISION_BATCH_PROCESSING_FAILED',

      status:
        500,

      mode:
        'batch',

      requiresHumanReview:
        true,
    })
  }
}

export async function GET():
  Promise<NextResponse> {
  return NextResponse.json(
    {
      success:
        true,

      engine:
        'decision-intelligence',

      framework:
        'Framework EDI',

      version:
        'v1',

      status:
        'available',

      supportedModes: [
        'single',
        'batch',
      ],

      maximumBatchSize:
        MAXIMUM_BATCH_SIZE,

      authentication:
        'Bearer token required for POST requests',

      timestamp:
        nowIso(),
    },
    {
      status:
        200,

      headers:
        NO_CACHE_HEADERS,
    },
  )
}

export async function POST(
  request:
    NextRequest,
): Promise<NextResponse> {
  const user =
    await authenticateRequest(
      request,
    )

  if (
    !user
  ) {
    return createErrorResponse({
      message:
        'Autenticação obrigatória. Envie um token de acesso válido.',

      code:
        'UNAUTHORIZED',

      status:
        401,
    })
  }

  const body =
    await readRequestBody(
      request,
    )

  if (
    !body
  ) {
    return createErrorResponse({
      message:
        'O corpo da requisição deve conter um JSON válido.',

      code:
        'INVALID_JSON_BODY',

      status:
        400,
    })
  }

  if (
    !isRequestMode(
      body.mode,
    )
  ) {
    return createErrorResponse({
      message:
        'O modo de processamento deve ser "single" ou "batch".',

      code:
        'INVALID_PROCESSING_MODE',

      status:
        400,
    })
  }

  if (
    body.metadata !==
      undefined &&
    !isRecord(
      body.metadata,
    )
  ) {
    return createErrorResponse({
      message:
        'Os metadados da requisição devem ser um objeto válido.',

      code:
        'INVALID_REQUEST_METADATA',

      status:
        400,

      mode:
        body.mode,
    })
  }

  if (
    body.mode ===
      'single'
  ) {
    return processSingleRequest({
      body,
      user,
    })
  }

  return processBatchRequest({
    body,
    user,
  })
}