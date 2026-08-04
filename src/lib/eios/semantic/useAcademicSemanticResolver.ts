'use client'

import {
  useCallback,
  useRef,
  useState,
} from 'react'

import type {
  AcademicSemanticResolutionInput,
  AcademicSemanticResolutionResult,
} from './academic-semantic.contract'

export type AcademicSemanticResolverState = {
  result:
    AcademicSemanticResolutionResult | null

  loading:
    boolean

  error:
    string | null

  resolve:
    (
      input:
        AcademicSemanticResolutionInput,
    ) => Promise<AcademicSemanticResolutionResult | null>

  resolveMany:
    (
      inputs:
        AcademicSemanticResolutionInput[],
    ) => Promise<AcademicSemanticResolutionResult[]>

  clear:
    () => void

  clearCache:
    () => void
}

type SemanticApiResponse =
  AcademicSemanticResolutionResult & {
    error?:
      string
  }

const semanticResolutionCache =
  new Map<
    string,
    AcademicSemanticResolutionResult
  >()

function createCacheKey(
  input:
    AcademicSemanticResolutionInput,
): string {
  return JSON.stringify({
    term:
      input.term
        .trim()
        .toLowerCase(),

    language:
      input.language ??
      'pt-BR',

    expectedDomain:
      input.expectedDomain ??
      null,

    expectedEntityTypes:
      input.expectedEntityTypes ??
      [],

    organizationContext:
      input.organizationContext ??
      null,

    programContext:
      input.programContext ??
      null,
  })
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

async function readResponse(
  response:
    Response,
): Promise<SemanticApiResponse> {
  try {
    return await response
      .json() as SemanticApiResponse
  } catch {
    return {
      success:
        false,

      resolvedEntityType:
        null,

      candidates:
        [],

      warnings:
        [],

      errors: [
        'A resposta da API semântica possui formato inválido.',
      ],

      requiresHumanReview:
        true,
    }
  }
}

function getResponseError(
  response:
    Response,

  result:
    SemanticApiResponse,
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

  if (firstError) {
    return firstError
  }

  if (
    response.status ===
    400
  ) {
    return 'Os dados enviados para resolução semântica são inválidos.'
  }

  if (
    response.status ===
    401
  ) {
    return 'Sua sessão expirou. Entre novamente para utilizar a resolução semântica.'
  }

  if (
    response.status ===
    403
  ) {
    return 'Você não possui permissão para utilizar a resolução semântica.'
  }

  if (
    response.status ===
    422
  ) {
    return 'O termo não pôde ser resolvido com segurança.'
  }

  if (
    response.status >=
    500
  ) {
    return 'O serviço de resolução semântica está temporariamente indisponível.'
  }

  return 'Não foi possível resolver o termo acadêmico.'
}

async function requestResolution(
  input:
    AcademicSemanticResolutionInput,

  signal?:
    AbortSignal,
): Promise<AcademicSemanticResolutionResult> {
  const response =
    await fetch(
      '/api/eios/semantic/academic/resolve',
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
          JSON.stringify(
            input,
          ),
      },
    )

  const result =
    await readResponse(
      response,
    )

  if (
    !response.ok
  ) {
    throw new Error(
      getResponseError(
        response,
        result,
      ),
    )
  }

  return result
}

export function useAcademicSemanticResolver():
  AcademicSemanticResolverState {
  const [
    result,
    setResult,
  ] = useState<
    AcademicSemanticResolutionResult | null
  >(null)

  const [
    loading,
    setLoading,
  ] = useState(false)

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

  const resolve =
    useCallback(
      async (
        input:
          AcademicSemanticResolutionInput,
      ): Promise<AcademicSemanticResolutionResult | null> => {
        const term =
          input.term.trim()

        if (!term) {
          setError(
            'O termo acadêmico é obrigatório.',
          )

          return null
        }

        const normalizedInput:
          AcademicSemanticResolutionInput = {
          ...input,

          term,
        }

        const cacheKey =
          createCacheKey(
            normalizedInput,
          )

        const cachedResult =
          semanticResolutionCache.get(
            cacheKey,
          )

        if (cachedResult) {
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
          const resolution =
            await requestResolution(
              normalizedInput,
              controller.signal,
            )

          if (
            controller.signal
              .aborted ||
            currentRequest !==
              requestSequence.current
          ) {
            return null
          }

          semanticResolutionCache.set(
            cacheKey,
            resolution,
          )

          setResult(
            resolution,
          )

          return resolution
        } catch (
          resolveError
        ) {
          if (
            controller.signal
              .aborted
          ) {
            return null
          }

          const message =
            resolveError instanceof Error
              ? resolveError.message
              : 'Não foi possível resolver o termo acadêmico.'

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

  const resolveMany =
    useCallback(
      async (
        inputs:
          AcademicSemanticResolutionInput[],
      ): Promise<AcademicSemanticResolutionResult[]> => {
        if (
          inputs.length ===
          0
        ) {
          return []
        }

        setLoading(
          true,
        )

        setError(
          null,
        )

        try {
          const resolutions =
            await Promise.all(
              inputs.map(
                async input => {
                  const normalizedInput:
                    AcademicSemanticResolutionInput = {
                    ...input,

                    term:
                      input.term.trim(),
                  }

                  const cacheKey =
                    createCacheKey(
                      normalizedInput,
                    )

                  const cachedResult =
                    semanticResolutionCache.get(
                      cacheKey,
                    )

                  if (
                    cachedResult
                  ) {
                    return cachedResult
                  }

                  const resolution =
                    await requestResolution(
                      normalizedInput,
                    )

                  semanticResolutionCache.set(
                    cacheKey,
                    resolution,
                  )

                  return resolution
                },
              ),
            )

          setResult(
            resolutions[
              resolutions.length -
                1
            ] ??
              null,
          )

          return resolutions
        } catch (
          resolveError
        ) {
          const message =
            resolveError instanceof Error
              ? resolveError.message
              : 'Não foi possível resolver os termos acadêmicos.'

          setError(
            message,
          )

          return []
        } finally {
          setLoading(
            false,
          )
        }
      },
      [],
    )

  const clear =
    useCallback(
      (): void => {
        activeController.current
          ?.abort()

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
        semanticResolutionCache.clear()
      },
      [],
    )

  return {
    result,

    loading,

    error,

    resolve,

    resolveMany,

    clear,

    clearCache,
  }
}