'use client'

import {
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react'

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

export type DecisionIntelligenceOperation =
  | 'idle'
  | 'single'
  | 'batch'

export type DecisionIntelligenceStatus =
  | 'idle'
  | 'loading'
  | 'success'
  | 'error'

export type DecisionIntelligenceCacheEntry = {
  key: string

  result:
    DecisionIntelligenceResult

  createdAt:
    string

  expiresAt:
    string | null
}

export type DecisionIntelligenceHookOptions = {
  cacheEnabled?: boolean

  cacheTtlMs?: number

  maximumCacheEntries?: number

  defaultRules?: DecisionRule[]

  defaultProcessingOptions?: Omit<
    DecisionIntelligenceProcessingOptions,
    'rules'
  >

  defaultBatchOptions?: Omit<
    DecisionBatchProcessingOptions,
    'rules'
  >
}

export type ProcessDecisionInput = {
  decision:
    EducationalDecision

  rules?:
    DecisionRule[]

  options?:
    Omit<
      DecisionIntelligenceProcessingOptions,
      'rules'
    >

  cacheKey?:
    string

  bypassCache?:
    boolean
}

export type ProcessDecisionBatchInput = {
  decisions:
    EducationalDecision[]

  rules?:
    DecisionRule[]

  options?:
    Omit<
      DecisionBatchProcessingOptions,
      'rules'
    >
}

export type DecisionIntelligenceHookState = {
  status:
    DecisionIntelligenceStatus

  operation:
    DecisionIntelligenceOperation

  loading:
    boolean

  processingSingle:
    boolean

  processingBatch:
    boolean

  success:
    boolean

  error:
    string | null

  result:
    DecisionIntelligenceResult | null

  batchResult:
    DecisionBatchProcessingResult | null

  lastProcessedAt:
    string | null

  cacheSize:
    number
}

const DEFAULT_CACHE_TTL_MS =
  5 * 60 * 1000

const DEFAULT_MAXIMUM_CACHE_ENTRIES =
  50

const decisionIntelligenceCache =
  new Map<
    string,
    DecisionIntelligenceCacheEntry
  >()

function nowIso(): string {
  return new Date()
    .toISOString()
}

function getErrorMessage(
  error:
    unknown,
): string {
  if (
    error instanceof Error
  ) {
    return error.message
  }

  if (
    typeof error ===
      'string' &&
    error.trim()
  ) {
    return error.trim()
  }

  return 'Não foi possível executar a inteligência decisória.'
}

function createDecisionCacheKey(
  decision:
    EducationalDecision,
): string {
  const evidenceSignature =
    decision
      .evidenceReferences
      .map(
        reference => [
          reference.evidenceId,
          reference.relevance,
          reference.confidence,
          reference.supportsDecision,
          reference.contradictsDecision,
        ].join(':'),
      )
      .sort()
      .join('|')

  return [
    'decision-intelligence',
    decision.id,
    decision.updatedAt,
    decision.priority,
    decision.severity,
    decision.urgency,
    evidenceSignature,
  ].join(':')
}

function isCacheEntryValid(
  entry:
    DecisionIntelligenceCacheEntry,
): boolean {
  if (
    !entry.expiresAt
  ) {
    return true
  }

  return (
    Date.parse(
      entry.expiresAt,
    ) >
    Date.now()
  )
}

function getCachedDecisionResult(
  key:
    string,
): DecisionIntelligenceResult | null {
  const entry =
    decisionIntelligenceCache.get(
      key,
    )

  if (
    !entry
  ) {
    return null
  }

  if (
    !isCacheEntryValid(
      entry,
    )
  ) {
    decisionIntelligenceCache.delete(
      key,
    )

    return null
  }

  return entry.result
}

function trimDecisionCache(
  maximumEntries:
    number,
): void {
  const normalizedMaximum =
    Math.max(
      1,
      Math.floor(
        maximumEntries,
      ),
    )

  while (
    decisionIntelligenceCache.size >
    normalizedMaximum
  ) {
    const oldestKey =
      decisionIntelligenceCache
        .keys()
        .next()
        .value as
        string | undefined

    if (
      !oldestKey
    ) {
      return
    }

    decisionIntelligenceCache.delete(
      oldestKey,
    )
  }
}

function setCachedDecisionResult({
  key,
  result,
  cacheTtlMs,
  maximumCacheEntries,
}: {
  key:
    string

  result:
    DecisionIntelligenceResult

  cacheTtlMs:
    number

  maximumCacheEntries:
    number
}): void {
  const createdAt =
    nowIso()

  const normalizedTtl =
    Math.max(
      0,
      cacheTtlMs,
    )

  const expiresAt =
    normalizedTtl > 0
      ? new Date(
          Date.now() +
          normalizedTtl,
        ).toISOString()
      : null

  decisionIntelligenceCache.delete(
    key,
  )

  decisionIntelligenceCache.set(
    key,
    {
      key,
      result,
      createdAt,
      expiresAt,
    },
  )

  trimDecisionCache(
    maximumCacheEntries,
  )
}

function mergeSingleProcessingOptions({
  defaults,
  current,
  rules,
}: {
  defaults?:
    Omit<
      DecisionIntelligenceProcessingOptions,
      'rules'
    >

  current?:
    Omit<
      DecisionIntelligenceProcessingOptions,
      'rules'
    >

  rules:
    DecisionRule[]
}): DecisionIntelligenceProcessingOptions {
  return {
    ...defaults,
    ...current,

    rules,

    additionalData: {
      ...defaults
        ?.additionalData,

      ...current
        ?.additionalData,
    },

    prioritizationWeights: {
      ...defaults
        ?.prioritizationWeights,

      ...current
        ?.prioritizationWeights,
    },

    recommendationOptions: {
      ...defaults
        ?.recommendationOptions,

      ...current
        ?.recommendationOptions,
    },

    alertOptions: {
      ...defaults
        ?.alertOptions,

      ...current
        ?.alertOptions,
    },

    actionPlanOptions: {
      ...defaults
        ?.actionPlanOptions,

      ...current
        ?.actionPlanOptions,
    },
  }
}

function mergeBatchProcessingOptions({
  defaults,
  current,
  rules,
}: {
  defaults?:
    Omit<
      DecisionBatchProcessingOptions,
      'rules'
    >

  current?:
    Omit<
      DecisionBatchProcessingOptions,
      'rules'
    >

  rules:
    DecisionRule[]
}): DecisionBatchProcessingOptions {
  return {
    ...defaults,
    ...current,

    rules,

    intelligenceOptions: {
      ...defaults
        ?.intelligenceOptions,

      ...current
        ?.intelligenceOptions,

      prioritizationWeights: {
        ...defaults
          ?.intelligenceOptions
          ?.prioritizationWeights,

        ...current
          ?.intelligenceOptions
          ?.prioritizationWeights,
      },

      recommendationOptions: {
        ...defaults
          ?.intelligenceOptions
          ?.recommendationOptions,

        ...current
          ?.intelligenceOptions
          ?.recommendationOptions,
      },

      alertOptions: {
        ...defaults
          ?.intelligenceOptions
          ?.alertOptions,

        ...current
          ?.intelligenceOptions
          ?.alertOptions,
      },

      actionPlanOptions: {
        ...defaults
          ?.intelligenceOptions
          ?.actionPlanOptions,

        ...current
          ?.intelligenceOptions
          ?.actionPlanOptions,
      },
    },

    additionalDataByDecisionId: {
      ...defaults
        ?.additionalDataByDecisionId,

      ...current
        ?.additionalDataByDecisionId,
    },
  }
}

export function useDecisionIntelligence(
  options:
    DecisionIntelligenceHookOptions = {},
) {
  const cacheEnabled =
    options.cacheEnabled ??
    true

  const cacheTtlMs =
    options.cacheTtlMs ??
    DEFAULT_CACHE_TTL_MS

  const maximumCacheEntries =
    options.maximumCacheEntries ??
    DEFAULT_MAXIMUM_CACHE_ENTRIES

  const defaultRules =
    options.defaultRules ??
    []

  const [
    status,
    setStatus,
  ] = useState<
    DecisionIntelligenceStatus
  >('idle')

  const [
    operation,
    setOperation,
  ] = useState<
    DecisionIntelligenceOperation
  >('idle')

  const [
    error,
    setError,
  ] = useState<
    string | null
  >(null)

  const [
    result,
    setResult,
  ] = useState<
    DecisionIntelligenceResult | null
  >(null)

  const [
    batchResult,
    setBatchResult,
  ] = useState<
    DecisionBatchProcessingResult | null
  >(null)

  const [
    lastProcessedAt,
    setLastProcessedAt,
  ] = useState<
    string | null
  >(null)

  const [
    cacheVersion,
    setCacheVersion,
  ] = useState(0)

  const executionIdRef =
    useRef(0)

  const clearError =
    useCallback(() => {
      setError(null)

      setStatus(
        currentStatus =>
          currentStatus ===
          'error'
            ? 'idle'
            : currentStatus,
      )
    }, [])

  const clearResult =
    useCallback(() => {
      setResult(null)
      setBatchResult(null)
      setError(null)
      setStatus('idle')
      setOperation('idle')
      setLastProcessedAt(null)
    }, [])

  const clearCache =
    useCallback(() => {
      decisionIntelligenceCache.clear()

      setCacheVersion(
        currentVersion =>
          currentVersion + 1,
      )
    }, [])

  const removeCachedDecision =
    useCallback(
      (
        decisionOrKey:
          EducationalDecision | string,
      ) => {
        const key =
          typeof decisionOrKey ===
            'string'
            ? decisionOrKey
            : createDecisionCacheKey(
                decisionOrKey,
              )

        const removed =
          decisionIntelligenceCache.delete(
            key,
          )

        if (
          removed
        ) {
          setCacheVersion(
            currentVersion =>
              currentVersion + 1,
          )
        }

        return removed
      },
      [],
    )

  const getCachedResult =
    useCallback(
      (
        decisionOrKey:
          EducationalDecision | string,
      ) => {
        const key =
          typeof decisionOrKey ===
            'string'
            ? decisionOrKey
            : createDecisionCacheKey(
                decisionOrKey,
              )

        return getCachedDecisionResult(
          key,
        )
      },
      [],
    )

  const processDecision =
    useCallback(
      async ({
        decision,
        rules,
        options:
          processingOptions,
        cacheKey,
        bypassCache = false,
      }: ProcessDecisionInput):
        Promise<DecisionIntelligenceResult> => {
        const executionId =
          executionIdRef.current +
          1

        executionIdRef.current =
          executionId

        const normalizedCacheKey =
          cacheKey?.trim() ||
          createDecisionCacheKey(
            decision,
          )

        if (
          cacheEnabled &&
          !bypassCache
        ) {
          const cachedResult =
            getCachedDecisionResult(
              normalizedCacheKey,
            )

          if (
            cachedResult
          ) {
            setResult(
              cachedResult,
            )

            setBatchResult(
              null,
            )

            setStatus(
              cachedResult.success
                ? 'success'
                : 'error',
            )

            setOperation(
              'single',
            )

            setError(
              cachedResult.errors[0] ??
              null,
            )

            setLastProcessedAt(
              cachedResult.completedAt,
            )

            return cachedResult
          }
        }

        setStatus('loading')
        setOperation('single')
        setError(null)
        setBatchResult(null)

        try {
          const normalizedRules =
            rules ??
            defaultRules

          const resultValue =
            await Promise.resolve(
              processDecisionIntelligence({
                decision,

                options:
                  mergeSingleProcessingOptions({
                    defaults:
                      options
                        .defaultProcessingOptions,

                    current:
                      processingOptions,

                    rules:
                      normalizedRules,
                  }),
              }),
            )

          const validation =
            validateDecisionIntelligenceResult(
              resultValue,
            )

          const finalResult:
            DecisionIntelligenceResult = {
            ...resultValue,

            success:
              resultValue.success &&
              validation.valid,

            warnings:
              Array.from(
                new Set([
                  ...resultValue.warnings,
                  ...validation.warnings,
                ]),
              ),

            errors:
              Array.from(
                new Set([
                  ...resultValue.errors,
                  ...validation.errors,
                ]),
              ),
          }

          if (
            cacheEnabled &&
            finalResult.success
          ) {
            setCachedDecisionResult({
              key:
                normalizedCacheKey,

              result:
                finalResult,

              cacheTtlMs,

              maximumCacheEntries,
            })

            setCacheVersion(
              currentVersion =>
                currentVersion + 1,
            )
          }

          if (
            executionIdRef.current ===
            executionId
          ) {
            setResult(
              finalResult,
            )

            setStatus(
              finalResult.success
                ? 'success'
                : 'error',
            )

            setError(
              finalResult.errors[0] ??
              null,
            )

            setLastProcessedAt(
              finalResult.completedAt,
            )
          }

          return finalResult
        } catch (
          processingError
        ) {
          const message =
            getErrorMessage(
              processingError,
            )

          if (
            executionIdRef.current ===
            executionId
          ) {
            setResult(null)
            setStatus('error')
            setError(message)
            setLastProcessedAt(
              nowIso(),
            )
          }

          throw new Error(
            message,
          )
        }
      },
      [
        cacheEnabled,
        cacheTtlMs,
        defaultRules,
        maximumCacheEntries,
        options
          .defaultProcessingOptions,
      ],
    )

  const processBatch =
    useCallback(
      async ({
        decisions,
        rules,
        options:
          batchOptions,
      }: ProcessDecisionBatchInput):
        Promise<DecisionBatchProcessingResult> => {
        const executionId =
          executionIdRef.current +
          1

        executionIdRef.current =
          executionId

        setStatus('loading')
        setOperation('batch')
        setError(null)
        setResult(null)

        try {
          const normalizedRules =
            rules ??
            defaultRules

          const resultValue =
            await processDecisionBatch({
              decisions,

              options:
                mergeBatchProcessingOptions({
                  defaults:
                    options
                      .defaultBatchOptions,

                  current:
                    batchOptions,

                  rules:
                    normalizedRules,
                }),
            })

          const validation =
            validateDecisionBatchResult(
              resultValue,
            )

          const finalResult:
            DecisionBatchProcessingResult = {
            ...resultValue,

            success:
              resultValue.success &&
              validation.valid,

            warnings:
              Array.from(
                new Set([
                  ...resultValue.warnings,
                  ...validation.warnings,
                ]),
              ),

            errors:
              Array.from(
                new Set([
                  ...resultValue.errors,
                  ...validation.errors,
                ]),
              ),
          }

          if (
            cacheEnabled
          ) {
            for (
              const item
              of finalResult.results
            ) {
              if (
                !item.success ||
                !item.result
              ) {
                continue
              }

              const sourceDecision =
                decisions.find(
                  decision =>
                    decision.id ===
                    item.decisionId,
                )

              if (
                !sourceDecision
              ) {
                continue
              }

              setCachedDecisionResult({
                key:
                  createDecisionCacheKey(
                    sourceDecision,
                  ),

                result:
                  item.result,

                cacheTtlMs,

                maximumCacheEntries,
              })
            }

            setCacheVersion(
              currentVersion =>
                currentVersion + 1,
            )
          }

          if (
            executionIdRef.current ===
            executionId
          ) {
            setBatchResult(
              finalResult,
            )

            setStatus(
              finalResult.success
                ? 'success'
                : 'error',
            )

            setError(
              finalResult.errors[0] ??
              null,
            )

            setLastProcessedAt(
              finalResult.completedAt,
            )
          }

          return finalResult
        } catch (
          processingError
        ) {
          const message =
            getErrorMessage(
              processingError,
            )

          if (
            executionIdRef.current ===
            executionId
          ) {
            setBatchResult(null)
            setStatus('error')
            setError(message)
            setLastProcessedAt(
              nowIso(),
            )
          }

          throw new Error(
            message,
          )
        }
      },
      [
        cacheEnabled,
        cacheTtlMs,
        defaultRules,
        maximumCacheEntries,
        options
          .defaultBatchOptions,
      ],
    )

  const cancelCurrentOperation =
    useCallback(() => {
      executionIdRef.current +=
        1

      setStatus('idle')
      setOperation('idle')
      setError(null)
    }, [])

  const state =
    useMemo<
      DecisionIntelligenceHookState
    >(
      () => ({
        status,

        operation,

        loading:
          status ===
          'loading',

        processingSingle:
          status ===
            'loading' &&
          operation ===
            'single',

        processingBatch:
          status ===
            'loading' &&
          operation ===
            'batch',

        success:
          status ===
          'success',

        error,

        result,

        batchResult,

        lastProcessedAt,

        cacheSize:
          decisionIntelligenceCache.size,
      }),
      [
        batchResult,
        cacheVersion,
        error,
        lastProcessedAt,
        operation,
        result,
        status,
      ],
    )

  return {
    ...state,

    processDecision,

    processBatch,

    clearError,

    clearResult,

    clearCache,

    removeCachedDecision,

    getCachedResult,

    cancelCurrentOperation,
  }
}

export type UseDecisionIntelligenceReturn =
  ReturnType<
    typeof useDecisionIntelligence
  >