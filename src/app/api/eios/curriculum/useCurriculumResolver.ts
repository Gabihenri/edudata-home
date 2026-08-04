'use client'

import {
  useCallback,
  useRef,
  useState,
} from 'react'

import type {
  CurriculumApplicabilityRule,
  CurriculumFramework,
  CurriculumResolutionInput,
  CurriculumResolutionResult,
  CurriculumVersion,
} from './curriculum-intelligence.contract'

export type CurriculumResolverRequest = {
  frameworks:
    CurriculumFramework[]

  versions:
    CurriculumVersion[]

  applicabilityRules:
    CurriculumApplicabilityRule[]

  input:
    CurriculumResolutionInput
}

export type CurriculumResolverState = {
  result:
    CurriculumResolutionResult | null

  loading:
    boolean

  error:
    string | null

  resolve:
    (
      request:
        CurriculumResolverRequest,
    ) => Promise<CurriculumResolutionResult | null>

  clear:
    () => void

  clearCache:
    () => void
}

type CurriculumApiResponse =
  CurriculumResolutionResult & {
    error?:
      string
  }

const curriculumResolutionCache =
  new Map<
    string,
    CurriculumResolutionResult
  >()

function normalizeStringArray(
  values:
    string[] | undefined,
): string[] {
  if (!values) {
    return []
  }

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
    CurriculumResolverRequest,
): string {
  const context =
    request.input.context

  return JSON.stringify({
    frameworkIds:
      request.frameworks
        .map(
          framework =>
            framework.id,
        )
        .sort(),

    versionIds:
      request.versions
        .map(
          version =>
            version.id,
        )
        .sort(),

    applicabilityRuleIds:
      request
        .applicabilityRules
        .map(
          rule =>
            rule.id,
        )
        .sort(),

    context: {
      institutionId:
        context.institutionId,

      campusId:
        context.campusId,

      schoolId:
        context.schoolId,

      programId:
        context.programId,

      courseId:
        context.courseId,

      curriculumMatrixId:
        context.curriculumMatrixId,

      componentId:
        context.componentId,

      offeringId:
        context.offeringId,

      classId:
        context.classId,

      academicPeriodId:
        context.academicPeriodId,

      educationLevel:
        context.educationLevel,

      countryCode:
        context.countryCode,

      stateCode:
        context.stateCode,

      municipalityCode:
        context.municipalityCode,

      academicYear:
        context.academicYear,
    },

    requestedFrameworkIds:
      normalizeStringArray(
        request
          .input
          .requestedFrameworkIds,
      ),

    requestedVersionIds:
      normalizeStringArray(
        request
          .input
          .requestedVersionIds,
      ),

    includeInherited:
      request
        .input
        .includeInherited,

    includeOptional:
      request
        .input
        .includeOptional,
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
): Promise<CurriculumApiResponse> {
  try {
    return await response
      .json() as CurriculumApiResponse
  } catch {
    return {
      success:
        false,

      resolvedFrameworks:
        [],

      primaryFramework:
        null,

      warnings:
        [],

      errors: [
        'A resposta da API curricular possui formato inválido.',
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
    CurriculumApiResponse,
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
    return 'Os dados enviados para resolução curricular são inválidos.'
  }

  if (
    response.status ===
    401
  ) {
    return 'Sua sessão expirou. Entre novamente para consultar o currículo.'
  }

  if (
    response.status ===
    403
  ) {
    return 'Você não possui permissão para consultar esse contexto curricular.'
  }

  if (
    response.status ===
    422
  ) {
    return 'Nenhum currículo aplicável foi encontrado para o contexto informado.'
  }

  if (
    response.status >=
    500
  ) {
    return 'O serviço de resolução curricular está temporariamente indisponível.'
  }

  return 'Não foi possível resolver o currículo aplicável.'
}

function validateRequest(
  request:
    CurriculumResolverRequest,
): string | null {
  if (
    request.frameworks.length ===
    0
  ) {
    return 'É necessário informar ao menos um referencial curricular.'
  }

  if (
    request.versions.length ===
    0
  ) {
    return 'É necessário informar ao menos uma versão curricular.'
  }

  if (
    request
      .applicabilityRules
      .length ===
    0
  ) {
    return 'É necessário informar ao menos uma regra de aplicabilidade curricular.'
  }

  return null
}

async function requestCurriculumResolution(
  request:
    CurriculumResolverRequest,

  signal?:
    AbortSignal,
): Promise<CurriculumResolutionResult> {
  const response =
    await fetch(
      '/api/eios/curriculum/resolve',
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
            request,
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

export function useCurriculumResolver():
  CurriculumResolverState {
  const [
    result,
    setResult,
  ] = useState<
    CurriculumResolutionResult | null
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
        request:
          CurriculumResolverRequest,
      ): Promise<CurriculumResolutionResult | null> => {
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
          curriculumResolutionCache.get(
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
          const resolution =
            await requestCurriculumResolution(
              request,
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

          curriculumResolutionCache.set(
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
              : 'Não foi possível resolver o currículo aplicável.'

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

  const clear =
    useCallback(
      (): void => {
        activeController.current
          ?.abort()

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
        curriculumResolutionCache.clear()
      },
      [],
    )

  return {
    result,

    loading,

    error,

    resolve,

    clear,

    clearCache,
  }
}