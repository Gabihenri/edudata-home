/**
 * EduData IA — EIOS
 * Capability 04: Educational Analytics
 * Sprint 04.14 — Historical Detail & Comparison Service
 *
 * Responsabilidades:
 * - localizar uma execução histórica autorizada a partir do repository oficial;
 * - expor um detalhe estruturado sem alterar o payload persistido;
 * - comparar duas versões da mesma análise;
 * - destacar itens adicionados, removidos e mantidos por categoria;
 * - preservar rastreabilidade, revisão humana e interpretação profissional.
 */

import type {
  SupabaseClient,
} from '@supabase/supabase-js'

import {
  listEducationalAnalyticsHistory,
  type EducationalAnalyticsJson,
  type EducationalAnalyticsRunRow,
} from '@/lib/agenda/repository/educational-analytics.repository'

export type EducationalAnalyticsHistoricalDetail = {
  row: EducationalAnalyticsRunRow
  analytics: EducationalAnalyticsJson
  report: EducationalAnalyticsJson | null
}

export type EducationalAnalyticsCountDelta = {
  base: number
  target: number
  delta: number
}

export type EducationalAnalyticsCollectionDiff = {
  addedIds: string[]
  removedIds: string[]
  maintainedIds: string[]
}

export type EducationalAnalyticsHistoricalComparison = {
  base: EducationalAnalyticsRunRow
  target: EducationalAnalyticsRunRow
  sameAnalysisKey: boolean
  direction:
    | 'forward'
    | 'backward'
    | 'same_version'
  counts: {
    correlations: EducationalAnalyticsCountDelta
    patterns: EducationalAnalyticsCountDelta
    anomalies: EducationalAnalyticsCountDelta
    influences: EducationalAnalyticsCountDelta
    predictions: EducationalAnalyticsCountDelta
    recommendations: EducationalAnalyticsCountDelta
    researchResults: EducationalAnalyticsCountDelta
  }
  collections: {
    correlations: EducationalAnalyticsCollectionDiff
    patterns: EducationalAnalyticsCollectionDiff
    anomalies: EducationalAnalyticsCollectionDiff
    influences: EducationalAnalyticsCollectionDiff
    predictions: EducationalAnalyticsCollectionDiff
    recommendations: EducationalAnalyticsCollectionDiff
    researchResults: EducationalAnalyticsCollectionDiff
  }
  review: {
    baseStatus: string
    targetStatus: string
    baseApproved: boolean
    targetApproved: boolean
  }
  generatedAt: string
  warnings: string[]
}

function normalizeRequiredText(
  value: string | null | undefined,
  fieldName: string,
): string {
  const normalized =
    value?.trim()

  if (!normalized) {
    throw new Error(
      `${fieldName} é obrigatório.`,
    )
  }

  return normalized
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  )
}

function extractIds(
  payload: EducationalAnalyticsJson,
  key: string,
): string[] {
  const value =
    payload[key]

  if (!Array.isArray(value)) {
    return []
  }

  return Array.from(
    new Set(
      value
        .map(item => {
          if (!isRecord(item)) {
            return null
          }

          const id = item.id

          return typeof id === 'string'
            ? id.trim()
            : null
        })
        .filter(
          (id): id is string =>
            Boolean(id),
        ),
    ),
  )
}

function buildCollectionDiff(
  baseIds: string[],
  targetIds: string[],
): EducationalAnalyticsCollectionDiff {
  const base =
    new Set(baseIds)
  const target =
    new Set(targetIds)

  return {
    addedIds:
      targetIds.filter(
        id => !base.has(id),
      ),
    removedIds:
      baseIds.filter(
        id => !target.has(id),
      ),
    maintainedIds:
      targetIds.filter(
        id => base.has(id),
      ),
  }
}

function buildCountDelta(
  base: number,
  target: number,
): EducationalAnalyticsCountDelta {
  return {
    base,
    target,
    delta:
      target - base,
  }
}

async function loadRowsForUser({
  client,
  userId,
}: {
  client: SupabaseClient
  userId: string
}): Promise<EducationalAnalyticsRunRow[]> {
  return listEducationalAnalyticsHistory({
    client,
    options: {
      userId:
        normalizeRequiredText(
          userId,
          'userId',
        ),
      includeArchived: true,
      limit: 200,
    },
  })
}

export async function getEducationalAnalyticsHistoricalDetail({
  client,
  userId,
  runId,
}: {
  client: SupabaseClient
  userId: string
  runId: string
}): Promise<EducationalAnalyticsHistoricalDetail | null> {
  const normalizedRunId =
    normalizeRequiredText(
      runId,
      'runId',
    )

  const rows =
    await loadRowsForUser({
      client,
      userId,
    })

  const row =
    rows.find(
      item => item.id === normalizedRunId,
    ) ?? null

  if (!row) {
    return null
  }

  return {
    row,
    analytics:
      row.analytics_payload,
    report:
      row.report_payload,
  }
}

export async function compareEducationalAnalyticsHistoricalRuns({
  client,
  userId,
  baseRunId,
  targetRunId,
}: {
  client: SupabaseClient
  userId: string
  baseRunId: string
  targetRunId: string
}): Promise<EducationalAnalyticsHistoricalComparison> {
  const rows =
    await loadRowsForUser({
      client,
      userId,
    })

  const baseRun =
    rows.find(
      item =>
        item.id ===
        normalizeRequiredText(
          baseRunId,
          'baseRunId',
        ),
    )

  const targetRun =
    rows.find(
      item =>
        item.id ===
        normalizeRequiredText(
          targetRunId,
          'targetRunId',
        ),
    )

  if (!baseRun || !targetRun) {
    throw new Error(
      'Uma ou ambas as versões solicitadas não foram encontradas no histórico autorizado.',
    )
  }

  const sameAnalysisKey =
    baseRun.analysis_key ===
    targetRun.analysis_key

  const warnings: string[] = []

  if (!sameAnalysisKey) {
    warnings.push(
      'As versões comparadas pertencem a chaves de análise diferentes; a leitura deve ser tratada como comparação exploratória.',
    )
  }

  const basePayload =
    baseRun.analytics_payload
  const targetPayload =
    targetRun.analytics_payload

  const collectionKeys = {
    correlations: 'correlations',
    patterns: 'patterns',
    anomalies: 'anomalies',
    influences: 'influences',
    predictions: 'predictions',
    recommendations: 'recommendations',
    researchResults: 'researchResults',
  } as const

  const collections = {
    correlations:
      buildCollectionDiff(
        extractIds(
          basePayload,
          collectionKeys.correlations,
        ),
        extractIds(
          targetPayload,
          collectionKeys.correlations,
        ),
      ),
    patterns:
      buildCollectionDiff(
        extractIds(
          basePayload,
          collectionKeys.patterns,
        ),
        extractIds(
          targetPayload,
          collectionKeys.patterns,
        ),
      ),
    anomalies:
      buildCollectionDiff(
        extractIds(
          basePayload,
          collectionKeys.anomalies,
        ),
        extractIds(
          targetPayload,
          collectionKeys.anomalies,
        ),
      ),
    influences:
      buildCollectionDiff(
        extractIds(
          basePayload,
          collectionKeys.influences,
        ),
        extractIds(
          targetPayload,
          collectionKeys.influences,
        ),
      ),
    predictions:
      buildCollectionDiff(
        extractIds(
          basePayload,
          collectionKeys.predictions,
        ),
        extractIds(
          targetPayload,
          collectionKeys.predictions,
        ),
      ),
    recommendations:
      buildCollectionDiff(
        extractIds(
          basePayload,
          collectionKeys.recommendations,
        ),
        extractIds(
          targetPayload,
          collectionKeys.recommendations,
        ),
      ),
    researchResults:
      buildCollectionDiff(
        extractIds(
          basePayload,
          collectionKeys.researchResults,
        ),
        extractIds(
          targetPayload,
          collectionKeys.researchResults,
        ),
      ),
  }

  const direction =
    targetRun.version_number ===
    baseRun.version_number
      ? 'same_version'
      : targetRun.version_number >
          baseRun.version_number
        ? 'forward'
        : 'backward'

  return {
    base:
      baseRun,
    target:
      targetRun,
    sameAnalysisKey,
    direction,
    counts: {
      correlations:
        buildCountDelta(
          baseRun.correlation_count,
          targetRun.correlation_count,
        ),
      patterns:
        buildCountDelta(
          baseRun.pattern_count,
          targetRun.pattern_count,
        ),
      anomalies:
        buildCountDelta(
          baseRun.anomaly_count,
          targetRun.anomaly_count,
        ),
      influences:
        buildCountDelta(
          baseRun.influence_count,
          targetRun.influence_count,
        ),
      predictions:
        buildCountDelta(
          baseRun.prediction_count,
          targetRun.prediction_count,
        ),
      recommendations:
        buildCountDelta(
          baseRun.recommendation_count,
          targetRun.recommendation_count,
        ),
      researchResults:
        buildCountDelta(
          baseRun.research_result_count,
          targetRun.research_result_count,
        ),
    },
    collections,
    review: {
      baseStatus:
        baseRun.human_review_status,
      targetStatus:
        targetRun.human_review_status,
      baseApproved:
        baseRun.approved,
      targetApproved:
        targetRun.approved,
    },
    generatedAt:
      new Date().toISOString(),
    warnings,
  }
}
