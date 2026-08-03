'use client'

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'

import type {
  EducationalContext,
  EducationalContextContractVersion,
} from './educational-context.contract'

type EducationalContextApiResponse = {
  success: boolean

  generatedAt?: string

  contractVersion?:
    EducationalContextContractVersion

  context?:
    EducationalContext

  warnings?: string[]

  error?: string

  errors?: string[]
}

export type EducationalContextQueryOptions = {
  referenceDate?: string | Date | null

  timezone?: string | null

  enabled?: boolean

  refreshOnFocus?: boolean
}

export type EducationalContextState = {
  context:
    EducationalContext | null

  loading: boolean

  refreshing: boolean

  error:
    string | null

  warnings:
    string[]

  generatedAt:
    string | null

  contractVersion:
    EducationalContextContractVersion | null

  lastUpdatedAt:
    string | null

  reload:
    () => Promise<
      EducationalContext | null
    >

  clearError:
    () => void
}

function normalizeOptionalText(
  value:
    string | null | undefined,
): string | null {
  const normalizedValue =
    value?.trim()

  return (
    normalizedValue ||
    null
  )
}

function normalizeReferenceDate(
  value:
    string | Date | null | undefined,
): string | null {
  if (!value) {
    return null
  }

  const date =
    value instanceof Date
      ? value
      : new Date(value)

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return null
  }

  return date.toISOString()
}

function detectBrowserTimeZone():
  string | null {
  if (
    typeof Intl ===
    'undefined'
  ) {
    return null
  }

  try {
    return (
      Intl.DateTimeFormat()
        .resolvedOptions()
        .timeZone ||
      null
    )
  } catch {
    return null
  }
}

function createContextUrl({
  referenceDate,
  timezone,
}: {
  referenceDate:
    string | Date | null | undefined

  timezone:
    string | null | undefined
}): string {
  const parameters =
    new URLSearchParams()

  const normalizedReferenceDate =
    normalizeReferenceDate(
      referenceDate,
    )

  const normalizedTimeZone =
    normalizeOptionalText(
      timezone,
    )
    ?? detectBrowserTimeZone()

  if (
    normalizedReferenceDate
  ) {
    parameters.set(
      'referenceDate',
      normalizedReferenceDate,
    )
  }

  if (
    normalizedTimeZone
  ) {
    parameters.set(
      'timezone',
      normalizedTimeZone,
    )
  }

  const query =
    parameters.toString()

  return query
    ? `/api/eios/context?${query}`
    : '/api/eios/context'
}

async function readContextResponse(
  response: Response,
): Promise<
  EducationalContextApiResponse
> {
  try {
    return await response
      .json() as
      EducationalContextApiResponse
  } catch {
    return {
      success:
        false,

      error:
        'A resposta do Context Engine possui formato inválido.',
    }
  }
}

function getResponseError(
  result:
    EducationalContextApiResponse,

  status:
    number,
): string {
  if (
    result.error?.trim()
  ) {
    return result.error.trim()
  }

  const firstError =
    result.errors
      ?.find(
        error =>
          Boolean(
            error?.trim(),
          ),
      )
      ?.trim()

  if (firstError) {
    return firstError
  }

  if (
    status ===
    401
  ) {
    return 'Sua sessão expirou. Entre novamente para carregar o contexto educacional.'
  }

  if (
    status ===
    403
  ) {
    return 'Seu perfil não possui permissão para acessar o Context Engine.'
  }

  if (
    status ===
    422
  ) {
    return 'Os dados disponíveis não permitiram construir o contexto educacional.'
  }

  if (
    status >=
    500
  ) {
    return 'O Context Engine está temporariamente indisponível.'
  }

  return 'Não foi possível carregar o contexto educacional.'
}

export function useEducationalContext(
  options:
    EducationalContextQueryOptions = {},
): EducationalContextState {
  const {
    referenceDate =
      null,

    timezone =
      null,

    enabled =
      true,

    refreshOnFocus =
      false,
  } = options

  const [
    context,
    setContext,
  ] = useState<
    EducationalContext | null
  >(null)

  const [
    loading,
    setLoading,
  ] = useState(
    enabled,
  )

  const [
    refreshing,
    setRefreshing,
  ] = useState(false)

  const [
    error,
    setError,
  ] = useState<
    string | null
  >(null)

  const [
    warnings,
    setWarnings,
  ] = useState<
    string[]
  >([])

  const [
    generatedAt,
    setGeneratedAt,
  ] = useState<
    string | null
  >(null)

  const [
    contractVersion,
    setContractVersion,
  ] = useState<
    EducationalContextContractVersion | null
  >(null)

  const [
    lastUpdatedAt,
    setLastUpdatedAt,
  ] = useState<
    string | null
  >(null)

  const requestSequence =
    useRef(0)

  const mounted =
    useRef(true)

  const hasLoadedOnce =
    useRef(false)

  const abortController =
    useRef<
      AbortController | null
    >(null)

  const clearError =
    useCallback(
      (): void => {
        setError(null)
      },
      [],
    )

  const loadContext =
    useCallback(
      async (): Promise<
        EducationalContext | null
      > => {
        if (!enabled) {
          if (mounted.current) {
            setLoading(false)
            setRefreshing(false)
          }

          return null
        }

        const currentRequest =
          requestSequence.current +
          1

        requestSequence.current =
          currentRequest

        abortController.current
          ?.abort()

        const controller =
          new AbortController()

        abortController.current =
          controller

        if (mounted.current) {
          if (
            hasLoadedOnce.current
          ) {
            setRefreshing(true)
          } else {
            setLoading(true)
          }

          setError(null)
        }

        try {
          const response =
            await fetch(
              createContextUrl({
                referenceDate,

                timezone,
              }),
              {
                method:
                  'GET',

                headers: {
                  Accept:
                    'application/json',
                },

                credentials:
                  'include',

                cache:
                  'no-store',

                signal:
                  controller.signal,
              },
            )

          const result =
            await readContextResponse(
              response,
            )

          if (
            controller.signal
              .aborted ||
            currentRequest !==
              requestSequence.current
          ) {
            return null
          }

          if (
            !response.ok ||
            !result.success ||
            !result.context
          ) {
            throw new Error(
              getResponseError(
                result,
                response.status,
              ),
            )
          }

          if (mounted.current) {
            setContext(
              result.context,
            )

            setWarnings(
              Array.isArray(
                result.warnings,
              )
                ? result.warnings
                    .filter(
                      (
                        warning,
                      ): warning is string =>
                        typeof warning ===
                          'string' &&
                        Boolean(
                          warning.trim(),
                        ),
                    )
                    .map(
                      warning =>
                        warning.trim(),
                    )
                : [],
            )

            setGeneratedAt(
              result.generatedAt
              ?? result.context
                .metadata
                .generatedAt
              ?? null,
            )

            setContractVersion(
              result.contractVersion
              ?? result.context
                .metadata
                .contractVersion
              ?? null,
            )

            setLastUpdatedAt(
              new Date()
                .toISOString(),
            )

            setError(null)

            hasLoadedOnce.current =
              true
          }

          return result.context
        } catch (
          loadError
        ) {
          if (
            controller.signal
              .aborted
          ) {
            return null
          }

          const message =
            loadError instanceof Error
              ? loadError.message
              : 'Não foi possível carregar o contexto educacional.'

          if (
            mounted.current &&
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
            mounted.current &&
            currentRequest ===
              requestSequence.current
          ) {
            setLoading(false)
            setRefreshing(false)
          }
        }
      },
      [
        enabled,
        referenceDate,
        timezone,
      ],
    )

  const reload =
    useCallback(
      async (): Promise<
        EducationalContext | null
      > =>
        loadContext(),
      [
        loadContext,
      ],
    )

  useEffect(
    () => {
      mounted.current =
        true

      return () => {
        mounted.current =
          false

        abortController.current
          ?.abort()
      }
    },
    [],
  )

  useEffect(
    () => {
      if (!enabled) {
        setLoading(false)
        setRefreshing(false)

        return
      }

      void loadContext()
    },
    [
      enabled,
      loadContext,
    ],
  )

  useEffect(
    () => {
      if (
        !enabled ||
        !refreshOnFocus ||
        typeof window ===
          'undefined'
      ) {
        return
      }

      function handleFocus():
        void {
        void loadContext()
      }

      window.addEventListener(
        'focus',
        handleFocus,
      )

      return () => {
        window.removeEventListener(
          'focus',
          handleFocus,
        )
      }
    },
    [
      enabled,
      loadContext,
      refreshOnFocus,
    ],
  )

  return {
    context,

    loading,

    refreshing,

    error,

    warnings,

    generatedAt,

    contractVersion,

    lastUpdatedAt,

    reload,

    clearError,
  }
}