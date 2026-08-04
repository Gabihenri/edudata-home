'use client'

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'

import type {
  TeacherProfileContractVersion,
  TeacherProfileResult,
  TeacherProfileSummary,
} from './teacher-profile.contract'

export type TeacherProfileQueryOptions = {
  enabled?: boolean

  refreshOnFocus?: boolean
}

export type TeacherProfileState = {
  profile:
    TeacherProfileSummary | null

  loading:
    boolean

  refreshing:
    boolean

  error:
    string | null

  warnings:
    string[]

  generatedAt:
    string | null

  contractVersion:
    TeacherProfileContractVersion | null

  lastUpdatedAt:
    string | null

  reload:
    () => Promise<TeacherProfileSummary | null>

  clearError:
    () => void
}

type TeacherProfileApiResponse =
  TeacherProfileResult & {
    error?: string
  }

async function readProfileResponse(
  response:
    Response,
): Promise<TeacherProfileApiResponse> {
  try {
    return await response
      .json() as TeacherProfileApiResponse
  } catch {
    return {
      success:
        false,

      profile:
        null,

      errors: [
        'A resposta da API do Perfil Docente possui formato inválido.',
      ],

      warnings:
        [],
    }
  }
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

function getResponseError(
  result:
    TeacherProfileApiResponse,

  status:
    number,
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
    status ===
    401
  ) {
    return 'Sua sessão expirou. Entre novamente para carregar o Perfil Docente EDI.'
  }

  if (
    status ===
    403
  ) {
    return 'Seu perfil não possui permissão para acessar o Perfil Docente EDI.'
  }

  if (
    status ===
    422
  ) {
    return 'Os dados disponíveis ainda não permitem gerar o Perfil Docente EDI.'
  }

  if (
    status >=
    500
  ) {
    return 'O serviço do Perfil Docente EDI está temporariamente indisponível.'
  }

  return 'Não foi possível carregar o Perfil Docente EDI.'
}

export function useTeacherProfile(
  options:
    TeacherProfileQueryOptions = {},
): TeacherProfileState {
  const {
    enabled =
      true,

    refreshOnFocus =
      false,
  } = options

  const [
    profile,
    setProfile,
  ] = useState<
    TeacherProfileSummary | null
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
    TeacherProfileContractVersion | null
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

  const loadProfile =
    useCallback(
      async (): Promise<
        TeacherProfileSummary | null
      > => {
        if (!enabled) {
          if (
            mounted.current
          ) {
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

        if (
          mounted.current
        ) {
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
              '/api/eios/profile',
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
            await readProfileResponse(
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
            !result.profile
          ) {
            throw new Error(
              getResponseError(
                result,
                response.status,
              ),
            )
          }

          if (
            mounted.current
          ) {
            setProfile(
              result.profile,
            )

            setWarnings(
              normalizeMessages(
                result.warnings,
              ),
            )

            setGeneratedAt(
              result.profile
                .metadata
                .generatedAt ??
              null,
            )

            setContractVersion(
              result.profile
                .metadata
                .contractVersion ??
              null,
            )

            setLastUpdatedAt(
              new Date()
                .toISOString(),
            )

            setError(null)

            hasLoadedOnce.current =
              true
          }

          return result.profile
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
              : 'Não foi possível carregar o Perfil Docente EDI.'

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
      ],
    )

  const reload =
    useCallback(
      async (): Promise<
        TeacherProfileSummary | null
      > =>
        loadProfile(),
      [
        loadProfile,
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

      void loadProfile()
    },
    [
      enabled,
      loadProfile,
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
        void loadProfile()
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
      loadProfile,
      refreshOnFocus,
    ],
  )

  return {
    profile,

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