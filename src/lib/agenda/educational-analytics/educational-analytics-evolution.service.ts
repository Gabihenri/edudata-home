/**
 * EduData IA — EIOS
 * Capability 04: Educational Analytics
 * Sprint 04.15 — Evolution Dashboard Service
 *
 * Consolida o histórico persistido em séries longitudinais leves para dashboard.
 * Não recalcula análises nem infere causalidade.
 */

import type { SupabaseClient } from '@supabase/supabase-js'

import {
  listEducationalAnalyticsHistory,
  type EducationalAnalyticsRunRow,
} from '@/lib/agenda/repository/educational-analytics.repository'

export type EducationalAnalyticsEvolutionMetric =
  | 'correlations'
  | 'patterns'
  | 'anomalies'
  | 'influences'
  | 'predictions'
  | 'recommendations'
  | 'researchResults'

export type EducationalAnalyticsEvolutionPoint = {
  runId: string
  analysisKey: string
  versionNumber: number
  versionLabel: string
  generatedAt: string
  status: string
  approved: boolean
  humanReviewStatus: string
  counts: Record<EducationalAnalyticsEvolutionMetric, number>
  dataQualityScore: number | null
}

export type EducationalAnalyticsEvolutionTrend = {
  metric: EducationalAnalyticsEvolutionMetric
  first: number
  latest: number
  delta: number
  direction: 'up' | 'down' | 'stable'
}

export type EducationalAnalyticsEvolutionResult = {
  points: EducationalAnalyticsEvolutionPoint[]
  trends: EducationalAnalyticsEvolutionTrend[]
  summary: {
    totalVersions: number
    approvedVersions: number
    pendingReviewVersions: number
    firstGeneratedAt: string | null
    latestGeneratedAt: string | null
  }
  generatedAt: string
  warnings: string[]
}

function normalizeRequiredText(
  value: string | null | undefined,
  fieldName: string,
): string {
  const normalized = value?.trim()

  if (!normalized) {
    throw new Error(`${fieldName} é obrigatório.`)
  }

  return normalized
}

function readDataQualityScore(
  row: EducationalAnalyticsRunRow,
): number | null {
  const raw = row.data_quality?.overallScore

  return typeof raw === 'number' && Number.isFinite(raw)
    ? raw
    : null
}

function toPoint(
  row: EducationalAnalyticsRunRow,
): EducationalAnalyticsEvolutionPoint {
  return {
    runId: row.id,
    analysisKey: row.analysis_key,
    versionNumber: row.version_number,
    versionLabel: row.version_label,
    generatedAt: row.generated_at,
    status: row.status,
    approved: row.approved,
    humanReviewStatus: row.human_review_status,
    counts: {
      correlations: row.correlation_count,
      patterns: row.pattern_count,
      anomalies: row.anomaly_count,
      influences: row.influence_count,
      predictions: row.prediction_count,
      recommendations: row.recommendation_count,
      researchResults: row.research_result_count,
    },
    dataQualityScore: readDataQualityScore(row),
  }
}

function buildTrend(
  metric: EducationalAnalyticsEvolutionMetric,
  points: EducationalAnalyticsEvolutionPoint[],
): EducationalAnalyticsEvolutionTrend {
  const first = points[0]?.counts[metric] ?? 0
  const latest = points.at(-1)?.counts[metric] ?? 0
  const delta = latest - first

  return {
    metric,
    first,
    latest,
    delta,
    direction:
      delta === 0
        ? 'stable'
        : delta > 0
          ? 'up'
          : 'down',
  }
}

export async function buildEducationalAnalyticsEvolution({
  client,
  userId,
  analysisKey,
  limit = 50,
}: {
  client: SupabaseClient
  userId: string
  analysisKey?: string | null
  limit?: number
}): Promise<EducationalAnalyticsEvolutionResult> {
  const rows = await listEducationalAnalyticsHistory({
    client,
    options: {
      userId: normalizeRequiredText(userId, 'userId'),
      analysisKey: analysisKey?.trim() || null,
      includeArchived: false,
      limit: Math.min(100, Math.max(2, Math.trunc(limit))),
    },
  })

  const points = rows
    .slice()
    .sort(
      (first, second) =>
        new Date(first.generated_at).getTime() -
        new Date(second.generated_at).getTime(),
    )
    .map(toPoint)

  const metrics: EducationalAnalyticsEvolutionMetric[] = [
    'correlations',
    'patterns',
    'anomalies',
    'influences',
    'predictions',
    'recommendations',
    'researchResults',
  ]

  const warnings: string[] = []

  if (points.length < 2) {
    warnings.push(
      'São necessárias pelo menos duas versões persistidas para interpretar evolução longitudinal.',
    )
  }

  const analysisKeys = new Set(
    points.map(point => point.analysisKey),
  )

  if (analysisKeys.size > 1 && !analysisKey?.trim()) {
    warnings.push(
      'O painel reúne diferentes chaves de análise; use o filtro analysisKey para uma leitura longitudinal estritamente comparável.',
    )
  }

  return {
    points,
    trends: metrics.map(metric => buildTrend(metric, points)),
    summary: {
      totalVersions: points.length,
      approvedVersions:
        points.filter(point => point.approved).length,
      pendingReviewVersions:
        points.filter(
          point => point.humanReviewStatus === 'pending',
        ).length,
      firstGeneratedAt: points[0]?.generatedAt ?? null,
      latestGeneratedAt: points.at(-1)?.generatedAt ?? null,
    },
    generatedAt: new Date().toISOString(),
    warnings,
  }
}
