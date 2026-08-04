'use client'

import {
  useCallback,
  useRef,
  useState,
} from 'react'

import type {
  EvidenceProcessingRequest,
} from './evidence-intelligence.contract'

import type {
  EvidenceBatchProcessingConfiguration,
  EvidenceBatchProcessingExecution,
} from './evidence-batch-processing.service'

export type EvidenceIntelligenceProcessRequest = {
  request:
    EvidenceProcessingRequest

  configuration?:
    Partial<EvidenceBatchProcessingConfiguration>
}

export type EvidenceIntelligenceHookState = {
  result:
    EvidenceBatchProcessingExecution | null

  loading:
    boolean

  error:
    string | null

  process:
    (
      request:
        EvidenceIntelligenceProcessRequest,
    ) => Promise<EvidenceBatchProcessingExecution | null>

  cancel:
    () => void

  clear:
    () => void

  clearCache:
    () => void
}

type EvidenceIntelligenceApiError = {
  message?:
    string

  error?:
    string

  errors?:
    unknown

  result?:
    {
      errors?:
        unknown
    }
}

const evidenceProcessingCache =
  new Map<
    string,
    EvidenceBatchProcessingExecution
  >()

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

function normalizeStringArray(
  values:
    string[],
): string[] {
  return Array.from(
    new Set(
      values
        .map(
          value =>
            value.trim(),
        )
        .filter(
          Boolean,
        ),
    ),
  ).sort()
}

function createCacheKey(
  request:
    EvidenceIntelligenceProcessRequest,
): string {
  const processingRequest =
    request.request

  return JSON.stringify({
    requestId:
      processingRequest.requestId,

    evidence:
      processingRequest.evidence
        .map(
          evidence => ({
            id:
              evidence.id,

            version:
              evidence.version,

            updatedAt:
              evidence.updatedAt,

            status:
              evidence.status,

            active:
              evidence.active,
          }),
        )
        .sort(
          (
            first,
            second,
          ) =>
            first.id.localeCompare(
              second.id,
            ),
        ),

    consolidationGroups:
      processingRequest
        .consolidationGroups
        .map(
          group => ({
            id:
              group.id,

            evidenceIds:
              normalizeStringArray(
                group.evidenceIds,
              ),

            subjectType:
              group.subjectType,

            subjectId:
              group.subjectId,

            startsAt:
              group.startsAt,

            endsAt:
              group.endsAt,

            aggregationMethod:
              group.aggregationMethod,

            minimumEvidenceCount:
              group.minimumEvidenceCount,
          }),
        )
        .sort(
          (
            first,
            second,
          ) =>
            first.id.localeCompare(
              second.id,
            ),
        ),

    options:
      processingRequest.options,

    configuration:
      request.configuration ??
      null,
  })
}

function validateRequest(
  request:
    EvidenceIntelligenceProcessRequest,
): string | null {
  if (
    !request.request.requestId.trim()
  ) {
    return 'O identificador da requisição é obrigatório.'
  }

  if (
    request.request.evidence.length ===
    0
  ) {
    return 'É necessário informar ao menos uma evidência para processamento.'
  }

  if (
    !request.request.requestedAt ||
    Number.isNaN(
      Date.parse(
        request.request.requestedAt,
      ),
    )
  ) {
    return 'A data da requisição de processamento é inválida.'
  }

  const evidenceIds =
    request.request.evidence.map(
      evidence =>
        evidence.id,
    )

  if (
    evidenceIds.some(
      evidenceId =>
        !evidenceId.trim(),
    )
  ) {
    return 'Todas as evidências devem possuir identificador.'
  }

  if (
    new Set(
      evidenceIds,
    ).size !==
    evidenceIds.length
  ) {
    return 'O lote possui identificadores de evidências duplicados.'
  }

  const concurrency =
    request.configuration
      ?.concurrency

  if (
    concurrency !==
      undefined &&
    (
      !Number.isInteger(
        concurrency,
      ) ||
      concurrency <
        1 ||
      concurrency >
        32
    )
  ) {
    return 'A concorrência do processamento deve estar entre 1 e 32.'
  }

  const maximumEvidencePerBatch =
    request.configuration
      ?.maximumEvidencePerBatch

  if (
    maximumEvidencePerBatch !==
      undefined &&
    (
      !Number.isInteger(
        maximumEvidencePerBatch,
      ) ||
      maximumEvidencePerBatch <
        1
    )
  ) {
    return 'O limite máximo de evidências deve ser um número inteiro maior que zero.'
  }

  return null
}

async function readJsonResponse(
  response:
    Response,
): Promise<unknown> {
  try {
    return await response.json()
  } catch {
    return null
  }
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

function isEvidenceBatchProcessingExecution(
  value:
    unknown,
): value is EvidenceBatchProcessingExecution {
  if (
    !isRecord(
      value,
    )
  ) {
    return false
  }

  return (
    typeof value.status ===
      'string' &&
    isRecord(
      value.result,
    ) &&
    isRecord(
      value.metrics,
    ) &&
    Array.isArray(
      value.items,
    )
  )
}

function getApiErrorMessage({
  response,
  body,
}: {
  response:
    Response

  body:
    unknown
}): string {
  if (
    isRecord(
      body,
    )
  ) {
    const apiError =
      body as EvidenceIntelligenceApiError

    if (
      typeof apiError.message ===
        'string' &&
      apiError.message.trim()
    ) {
      return apiError.message.trim()
    }

    if (
      typeof apiError.error ===
        'string' &&
      apiError.error.trim()
    ) {
      return apiError.error.trim()
    }

    const directErrors =
      normalizeMessages(
        apiError.errors,
      )

    if (
      directErrors.length >
      0
    ) {
      return directErrors[0]
    }

    const resultErrors =
      normalizeMessages(
        apiError.result
          ?.errors,
      )

    if (
      resultErrors.length >
      0
    ) {
      return resultErrors[0]
    }
  }

  if (
    response.status ===
    400
  ) {
    return 'Os dados enviados para o processamento de evidências são inválidos.'
  }

  if (
    response.status ===
    401
  ) {
    return 'Sua sessão expirou. Entre novamente para processar as evidências.'
  }

  if (
    response.status ===
    403
  ) {
    return 'Você não possui permissão para processar essas evidências.'
  }

  if (
    response.status ===
    413
  ) {
    return 'O lote de evidências excede o tamanho permitido.'
  }

  if (
    response.status ===
    422
  ) {
    return 'O lote foi recebido, mas não pôde ser processado integralmente.'
  }

  if (
    response.status ===
    429
  ) {
    return 'Há muitas solicitações de processamento. Aguarde e tente novamente.'
  }

  if (
    response.status >=
    500
  ) {
    return 'O serviço de inteligência de evidências está temporariamente indisponível.'
  }

  return 'Não foi possível processar as evidências.'
}

async function requestEvidenceProcessing({
  request,
  signal,
}: {
  request:
    EvidenceIntelligenceProcessRequest

  signal:
    AbortSignal
}): Promise<EvidenceBatchProcessingExecution> {
  const response =
    await fetch(
      '/api/eios/evidence-intelligence/process',
      {
        method:
          'POST',

        headers: {
          Accept:
            'application/json',

          'Content-Type':
            'application/json',
        },

        credentials:
          'include',

        cache:
          'no-store',

        signal,

        body:
          JSON.stringify({
            requestId:
              request.request.requestId,

            evidence:
              request.request.evidence,

            consolidationGroups:
              request.request
                .consolidationGroups,

            options:
              request.request.options,

            configuration:
              request.configuration,

            requestedBy:
              request.request.requestedBy,

            requestedAt:
              request.request.requestedAt,

            metadata:
              request.request.metadata,
          }),
      },
    )

  const body =
    await readJsonResponse(
      response,
    )

  if (
    !response.ok
  ) {
    throw new Error(
      getApiErrorMessage({
        response,
        body,
      }),
    )
  }

  if (
    !isEvidenceBatchProcessingExecution(
      body,
    )
  ) {
    throw new Error(
      'A API retornou uma resposta de processamento em formato inválido.',
    )
  }

  return body
}

export function useEvidenceIntelligence():
  EvidenceIntelligenceHookState {
  const [
    result,
    setResult,
  ] = useState<
    EvidenceBatchProcessingExecution | null
  >(null)

  const [
    loading,
    setLoading,
  ] = useState(
    false,
  )

  const [
    error,
    setError,
  ] = useState<
    string | null
  >(null)

  const activeController =
    useRef<
      AbortController | null
    >(null)

  const requestSequence =
    useRef(
      0,
    )

  const process =
    useCallback(
      async (
        request:
          EvidenceIntelligenceProcessRequest,
      ): Promise<EvidenceBatchProcessingExecution | null> => {
        const validationError =
          validateRequest(
            request,
          )

        if (
          validationError
        ) {
          setError(
            validationError,
          )

          return null
        }

        const cacheKey =
          createCacheKey(
            request,
          )

        const cachedResult =
          evidenceProcessingCache.get(
            cacheKey,
          )

        if (
          cachedResult
        ) {
          setResult(
            cachedResult,
          )

          setError(
            null,
          )

          return cachedResult
        }

        activeController.current
          ?.abort()

        const controller =
          new AbortController()

        activeController.current =
          controller

        const currentRequest =
          requestSequence.current +
          1

        requestSequence.current =
          currentRequest

        setLoading(
          true,
        )

        setError(
          null,
        )

        try {
          const execution =
            await requestEvidenceProcessing({
              request,
              signal:
                controller.signal,
            })

          if (
            controller.signal
              .aborted ||
            currentRequest !==
              requestSequence.current
          ) {
            return null
          }

          evidenceProcessingCache.set(
            cacheKey,
            execution,
          )

          setResult(
            execution,
          )

          return execution
        } catch (
          processingError
        ) {
          if (
            controller.signal
              .aborted
          ) {
            return null
          }

          const message =
            processingError instanceof Error
              ? processingError.message
              : 'Não foi possível processar as evidências.'

          if (
            currentRequest ===
            requestSequence.current
          ) {
            setError(
              message,
            )
          }

          return null
        } finally {
          if (
            currentRequest ===
            requestSequence.current
          ) {
            setLoading(
              false,
            )
          }
        }
      },
      [],
    )

  const cancel =
    useCallback(
      (): void => {
        activeController.current
          ?.abort()

        activeController.current =
          null

        requestSequence.current +=
          1

        setLoading(
          false,
        )
      },
      [],
    )

  const clear =
    useCallback(
      (): void => {
        activeController.current
          ?.abort()

        activeController.current =
          null

        requestSequence.current +=
          1

        setResult(
          null,
        )

        setError(
          null,
        )

        setLoading(
          false,
        )
      },
      [],
    )

  const clearCache =
    useCallback(
      (): void => {
        evidenceProcessingCache.clear()
      },
      [],
    )

  return {
    result,

    loading,

    error,

    process,

    cancel,

    clear,

    clearCache,
  }
}