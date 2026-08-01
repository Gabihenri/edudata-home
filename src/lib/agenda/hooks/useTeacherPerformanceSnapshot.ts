'use client'

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'

import {
  generateTeacherPerformanceSnapshot,
  type TeacherPerformanceSnapshot,
  type TeacherPerformanceSnapshotApiData,
  type TeacherPerformanceSnapshotRequest,
} from '@/lib/agenda/services/teacher-intelligence.service'

export type TeacherPerformanceSnapshotStatus =
  | 'idle'
  | 'loading'
  | 'success'
  | 'error'
  | 'cancelled'

export type GenerateTeacherSnapshotOptions = {
  endpoint?: string
}

export type UseTeacherPerformanceSnapshotOptions = {
  initialRequest?:
    TeacherPerformanceSnapshotRequest | null

  autoGenerate?: boolean

  endpoint?: string
}

export type UseTeacherPerformanceSnapshotResult = {
  data:
    TeacherPerformanceSnapshotApiData | null

  snapshot:
    TeacherPerformanceSnapshot | null

  loading: boolean

  error: string | null

  status:
    TeacherPerformanceSnapshotStatus

  hasData: boolean

  generate: (
    request:
      TeacherPerformanceSnapshotRequest,
    options?:
      GenerateTeacherSnapshotOptions,
  ) => Promise<
    TeacherPerformanceSnapshotApiData | null
  >

  reload: () => Promise<
    TeacherPerformanceSnapshotApiData | null
  >

  cancel: () => void

  clear: () => void

  resetError: () => void
}

function isAbortError(
  error: unknown,
): boolean {
  return (
    error instanceof DOMException &&
    error.name === 'AbortError'
  )
}

function normalizeErrorMessage(
  error: unknown,
): string {
  if (
    error instanceof Error &&
    error.message.trim()
  ) {
    return error.message.trim()
  }

  return (
    'Não foi possível carregar o '
    + 'snapshot de desempenho docente.'
  )
}

export function useTeacherPerformanceSnapshot(
  options:
    UseTeacherPerformanceSnapshotOptions = {},
): UseTeacherPerformanceSnapshotResult {
  const {
    initialRequest = null,
    autoGenerate = false,
    endpoint,
  } = options

  const [
    data,
    setData,
  ] = useState<
    TeacherPerformanceSnapshotApiData | null
  >(null)

  const [
    loading,
    setLoading,
  ] = useState(false)

  const [
    error,
    setError,
  ] = useState<string | null>(
    null,
  )

  const [
    status,
    setStatus,
  ] = useState<
    TeacherPerformanceSnapshotStatus
  >('idle')

  const abortControllerRef =
    useRef<AbortController | null>(
      null,
    )

  const lastRequestRef =
    useRef<
      TeacherPerformanceSnapshotRequest | null
    >(initialRequest)

  const mountedRef =
    useRef(true)

  const requestSequenceRef =
    useRef(0)

  const cancel = useCallback(
    () => {
      const controller =
        abortControllerRef.current

      if (!controller) {
        return
      }

      controller.abort()

      abortControllerRef.current =
        null

      if (!mountedRef.current) {
        return
      }

      setLoading(false)
      setStatus('cancelled')
    },
    [],
  )

  const generate = useCallback(
    async (
      request:
        TeacherPerformanceSnapshotRequest,
      generateOptions:
        GenerateTeacherSnapshotOptions = {},
    ): Promise<
      TeacherPerformanceSnapshotApiData | null
    > => {
      abortControllerRef.current?.abort()

      const controller =
        new AbortController()

      abortControllerRef.current =
        controller

      lastRequestRef.current =
        request

      requestSequenceRef.current += 1

      const requestSequence =
        requestSequenceRef.current

      if (mountedRef.current) {
        setLoading(true)
        setError(null)
        setStatus('loading')
      }

      try {
        const responseData =
          await generateTeacherPerformanceSnapshot(
            request,
            {
              endpoint:
                generateOptions.endpoint ??
                endpoint,

              signal:
                controller.signal,
            },
          )

        if (
          !mountedRef.current ||
          controller.signal.aborted ||
          requestSequence !==
            requestSequenceRef.current
        ) {
          return null
        }

        setData(responseData)
        setError(null)
        setStatus('success')

        return responseData
      } catch (caughtError) {
        if (
          isAbortError(
            caughtError,
          ) ||
          controller.signal.aborted
        ) {
          if (
            mountedRef.current &&
            requestSequence ===
              requestSequenceRef.current
          ) {
            setStatus(
              'cancelled',
            )
          }

          return null
        }

        if (
          !mountedRef.current ||
          requestSequence !==
            requestSequenceRef.current
        ) {
          return null
        }

        const message =
          normalizeErrorMessage(
            caughtError,
          )

        setError(message)
        setStatus('error')

        return null
      } finally {
        if (
          abortControllerRef.current ===
          controller
        ) {
          abortControllerRef.current =
            null
        }

        if (
          mountedRef.current &&
          requestSequence ===
            requestSequenceRef.current
        ) {
          setLoading(false)
        }
      }
    },
    [
      endpoint,
    ],
  )

  const reload = useCallback(
    async (): Promise<
      TeacherPerformanceSnapshotApiData | null
    > => {
      const request =
        lastRequestRef.current

      if (!request) {
        if (
          mountedRef.current
        ) {
          setError(
            'Nenhuma solicitação anterior está disponível para recarregar.',
          )

          setStatus('error')
        }

        return null
      }

      return generate(
        request,
      )
    },
    [
      generate,
    ],
  )

  const clear = useCallback(
    () => {
      abortControllerRef.current?.abort()

      abortControllerRef.current =
        null

      lastRequestRef.current =
        null

      requestSequenceRef.current += 1

      if (!mountedRef.current) {
        return
      }

      setData(null)
      setLoading(false)
      setError(null)
      setStatus('idle')
    },
    [],
  )

  const resetError = useCallback(
    () => {
      if (!mountedRef.current) {
        return
      }

      setError(null)

      setStatus(
        data
          ? 'success'
          : 'idle',
      )
    },
    [
      data,
    ],
  )

  useEffect(
    () => {
      mountedRef.current =
        true

      return () => {
        mountedRef.current =
          false

        abortControllerRef
          .current
          ?.abort()

        abortControllerRef.current =
          null
      }
    },
    [],
  )

  useEffect(
    () => {
      if (
        !autoGenerate ||
        !initialRequest
      ) {
        return
      }

      void generate(
        initialRequest,
      )

      return () => {
        abortControllerRef
          .current
          ?.abort()
      }
    },
    [
      autoGenerate,
      generate,
      initialRequest,
    ],
  )

  return {
    data,

    snapshot:
      data?.result ??
      null,

    loading,

    error,

    status,

    hasData:
      data !== null,

    generate,

    reload,

    cancel,

    clear,

    resetError,
  }
}