/**
 * EduData IA — EIOS
 * Capability 04: Educational Analytics
 *
 * Serviço oficial de execução integrada dos motores analíticos.
 *
 * Arquitetura preservada:
 * Framework EDI
 * → EIOS
 * → Educational Analytics
 * → Core Compartilhado
 * → Produtos Especializados
 *
 * Responsabilidades:
 * - executar o orquestrador de governança e qualidade;
 * - executar Correlation Engine quando habilitado;
 * - executar Pattern Engine quando habilitado;
 * - executar Influence Engine quando houver grafo disponível;
 * - consolidar os resultados no contrato oficial;
 * - preservar explicabilidade, rastreabilidade e revisão humana;
 * - nunca converter associação em causalidade.
 */

import {
  buildEducationalAnalytics,
} from './educational-analytics.engine'

import {
  runCorrelationEngine,
  type CorrelationEngineResult,
} from './correlation.engine'

import {
  runPatternEngine,
  type PatternEngineResult,
} from './pattern.engine'

import {
  runInfluenceEngine,
  type InfluenceEngineInput,
  type InfluenceEngineResult,
} from './influence.engine'

import type {
  AnalyticsCapability,
  AnalyticsMetadata,
  AnalyticsStatus,
  BuildEducationalAnalyticsInput,
  EducationalAnalyticsBuildResult,
  EducationalAnalyticsResult,
} from './analytics.types'

const SERVICE_NAME =
  'eios-educational-analytics-service'

const SERVICE_VERSION =
  '1.0.0'

export type EducationalAnalyticsSpecializedExecution = {
  correlation:
    CorrelationEngineResult | null

  pattern:
    PatternEngineResult | null

  influence:
    InfluenceEngineResult | null
}

export type RunEducationalAnalyticsInput = {
  input:
    BuildEducationalAnalyticsInput

  influenceInput?:
    Omit<
      InfluenceEngineInput,
      'correlationId'
    > | null

  executeCorrelation?: boolean

  executePattern?: boolean

  executeInfluence?: boolean

  metadata?: AnalyticsMetadata
}

export type RunEducationalAnalyticsResult = {
  success: boolean

  analytics:
    EducationalAnalyticsResult | null

  base:
    EducationalAnalyticsBuildResult

  specialized:
    EducationalAnalyticsSpecializedExecution

  executedCapabilities:
    AnalyticsCapability[]

  warnings: string[]

  errors: string[]

  generatedAt: string

  metadata: AnalyticsMetadata
}

function nowIso(): string {
  return new Date()
    .toISOString()
}

function uniqueStrings(
  values:
    Array<string | null | undefined>,
): string[] {
  return Array.from(
    new Set(
      values
        .filter(
          (
            value,
          ): value is string =>
            typeof value === 'string',
        )
        .map(
          value =>
            value.trim(),
        )
        .filter(Boolean),
    ),
  )
}

function isCapabilityEnabled(
  input:
    BuildEducationalAnalyticsInput,
  capability:
    AnalyticsCapability,
): boolean {
  return input.configuration
    .enabledCapabilities
    .includes(capability)
}

function resolveStatus(
  analytics:
    EducationalAnalyticsResult,
  errors: string[],
  warnings: string[],
): AnalyticsStatus {
  if (
    analytics.status === 'failed' ||
    errors.length > 0
  ) {
    return 'failed'
  }

  if (
    analytics.status ===
      'completed_with_warnings' ||
    warnings.length > 0
  ) {
    return 'completed_with_warnings'
  }

  return 'completed'
}

export function runEducationalAnalytics(
  request:
    RunEducationalAnalyticsInput,
): RunEducationalAnalyticsResult {
  const generatedAt =
    nowIso()

  const base =
    buildEducationalAnalytics(
      request.input,
    )

  const specialized:
    EducationalAnalyticsSpecializedExecution = {
      correlation: null,
      pattern: null,
      influence: null,
    }

  const executedCapabilities:
    AnalyticsCapability[] = [
      'educational_analytics',
    ]

  const warnings = [
    ...base.warnings,
  ]

  const errors = [
    ...base.errors,
  ]

  if (
    !base.success ||
    !base.analytics
  ) {
    return {
      success: false,
      analytics:
        base.analytics ?? null,
      base,
      specialized,
      executedCapabilities,
      warnings:
        uniqueStrings(warnings),
      errors:
        uniqueStrings(errors),
      generatedAt,
      metadata: {
        ...(request.metadata ?? {}),
        serviceName:
          SERVICE_NAME,
        serviceVersion:
          SERVICE_VERSION,
        specializedExecution:
          false,
      },
    }
  }

  const shouldExecuteCorrelation =
    request.executeCorrelation ??
    isCapabilityEnabled(
      request.input,
      'correlation_engine',
    )

  const shouldExecutePattern =
    request.executePattern ??
    isCapabilityEnabled(
      request.input,
      'pattern_engine',
    )

  const shouldExecuteInfluence =
    request.executeInfluence ??
    isCapabilityEnabled(
      request.input,
      'influence_engine',
    )

  if (shouldExecuteCorrelation) {
    specialized.correlation =
      runCorrelationEngine({
        observations:
          base.analytics.observations,
        variableDefinitions:
          base.analytics
            .configuration
            .variableDefinitions,
        methods:
          base.analytics
            .configuration
            .correlationMethods,
        minimumPairCount:
          base.analytics
            .configuration
            .minimumSampleSize,
        significanceLevel:
          base.analytics
            .configuration
            .significanceLevel,
        subgroupIds:
          base.analytics
            .context
            .groupIds,
        correlationId:
          request.input
            .correlationId,
        metadata: {
          analysisId:
            base.analytics.id,
          serviceName:
            SERVICE_NAME,
        },
      })

    executedCapabilities.push(
      'correlation_engine',
    )

    warnings.push(
      ...specialized
        .correlation
        .warnings,
    )

    errors.push(
      ...specialized
        .correlation
        .errors,
    )
  }

  if (shouldExecutePattern) {
    specialized.pattern =
      runPatternEngine({
        observations:
          base.analytics.observations,
        variableDefinitions:
          base.analytics
            .configuration
            .variableDefinitions,
        sourceReferences:
          base.analytics.sources,
        externalEventIds:
          base.analytics
            .context
            .externalEventIds,
        requestedByUserId:
          base.analytics
            .context
            .requestedByUserId,
        correlationId:
          request.input
            .correlationId,
        metadata: {
          analysisId:
            base.analytics.id,
          serviceName:
            SERVICE_NAME,
        },
      })

    executedCapabilities.push(
      'pattern_engine',
    )

    warnings.push(
      ...specialized
        .pattern
        .warnings,
    )

    errors.push(
      ...specialized
        .pattern
        .errors,
    )
  }

  if (shouldExecuteInfluence) {
    if (!request.influenceInput) {
      warnings.push(
        'Influence Engine habilitado, mas nenhum grafo de influência foi fornecido.',
      )
    } else {
      specialized.influence =
        runInfluenceEngine({
          ...request.influenceInput,
          correlationId:
            request.input
              .correlationId,
        })

      executedCapabilities.push(
        'influence_engine',
      )

      warnings.push(
        ...specialized
          .influence
          .warnings,
      )

      errors.push(
        ...specialized
          .influence
          .errors,
      )
    }
  }

  const normalizedWarnings =
    uniqueStrings(
      warnings.filter(
        warning =>
          warning !==
          'Motores especializados ainda não foram executados.',
      ),
    )

  const normalizedErrors =
    uniqueStrings(errors)

  const analytics:
    EducationalAnalyticsResult = {
    ...base.analytics,

    correlations:
      specialized.correlation
        ?.correlations ??
      base.analytics.correlations,

    patterns:
      specialized.pattern
        ?.patterns ??
      base.analytics.patterns,

    anomalies:
      specialized.pattern
        ?.anomalies ??
      base.analytics.anomalies,

    influences:
      specialized.influence
        ?.influences ??
      base.analytics.influences,

    warnings:
      normalizedWarnings,

    errors:
      normalizedErrors,

    status:
      resolveStatus(
        base.analytics,
        normalizedErrors,
        normalizedWarnings,
      ),

    completedAt:
      generatedAt,

    metadata: {
      ...base.analytics.metadata,
      ...(request.metadata ?? {}),
      serviceName:
        SERVICE_NAME,
      serviceVersion:
        SERVICE_VERSION,
      orchestrationOnly:
        false,
      specializedEnginesExecuted:
        executedCapabilities
          .filter(
            capability =>
              capability !==
              'educational_analytics',
          ),
      specializedOutputs: {
        correlationMatrices:
          specialized.correlation
            ?.matrices ??
          [],
        influenceNodeMetrics:
          specialized.influence
            ?.nodeMetrics ??
          [],
        influenceCommunities:
          specialized.influence
            ?.communities ??
          [],
        influenceZones:
          specialized.influence
            ?.zones ??
          [],
        influencePropagations:
          specialized.influence
            ?.propagations ??
          [],
      },
    },
  }

  return {
    success:
      analytics.status !==
      'failed',
    analytics,
    base,
    specialized,
    executedCapabilities:
      Array.from(
        new Set(
          executedCapabilities,
        ),
      ),
    warnings:
      normalizedWarnings,
    errors:
      normalizedErrors,
    generatedAt,
    metadata: {
      ...(request.metadata ?? {}),
      serviceName:
        SERVICE_NAME,
      serviceVersion:
        SERVICE_VERSION,
      correlationId:
        request.input
          .correlationId,
    },
  }
}

export function getEducationalAnalyticsServiceInfo() {
  return {
    name:
      SERVICE_NAME,
    version:
      SERVICE_VERSION,
    mode:
      'deterministic' as const,
    capabilities: [
      'educational_analytics',
      'correlation_engine',
      'pattern_engine',
      'influence_engine',
    ] as AnalyticsCapability[],
    guarantees: [
      'single_analytics_contract',
      'correlation_is_not_causation',
      'human_review_preserved',
      'professional_autonomy_preserved',
      'specialized_results_are_traceable',
    ],
  }
}
