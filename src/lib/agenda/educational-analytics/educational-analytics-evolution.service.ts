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

function safeText(
  value: unknown,
  fallback: string,
): string {
  return typeof value === 'string' && value.trim()
    ? value.trim()
    : fallback
}

function safeNumber(
  value: unknown,
  fallback = 0,
): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? value
    : fallback
}

function safeDateIso(
  value: unknown,
): string {
  if (typeof value === 'string') {
    const parsed = new Date(value)

    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString()
    }
  }

  return new Date(0).toISOString()
}

function readDataQualityScore(
  row: EducationalAnalyticsRunRow,
): number | null {
  const rawContainer = row.data_quality

  if (
    !rawContainer ||
    typeof rawContainer !== 'object' ||
    Array.isArray(rawContainer)
  ) {
    return null
  }

  const container = rawContainer as Record<string, unknown>
  const raw =
    container.overallScore ??
    container.overall_score ??
    container.score

  return typeof raw === 'number' && Number.isFinite(raw)
    ? raw
    : null
}

function toPoint(
  row: EducationalAnalyticsRunRow,
): EducationalAnalyticsEvolutionPoint {
  return {
    runId: safeText(row.id, 'unknown-run'),
    analysisKey: safeText(row.analysis_key, 'unknown-analysis'),
    versionNumber: Math.max(1, Math.trunc(safeNumber(row.version_number, 1))),
    versionLabel: safeText(row.version_label, '1.0'),
    generatedAt: safeDateIso(row.generated_at),
    status: safeText(row.status, 'unknown'),
    approved: row.approved === true,
    humanReviewStatus: safeText(
      row.human_review_status,
      'pending',
    ),
    counts: {
      correlations: Math.max(0, safeNumber(row.correlation_count)),
      patterns: Math.max(0, safeNumber(row.pattern_count)),
      anomalies: Math.max(0, safeNumber(row.anomaly_count)),
      influences: Math.max(0, safeNumber(row.influence_count)),
      predictions: Math.max(0, safeNumber(row.prediction_count)),
      recommendations: Math.max(0, safeNumber(row.recommendation_count)),
      researchResults: Math.max(0, safeNumber(row.research_result_count)),
    },
    dataQualityScore: readDataQualityScore(row),
  }
}

function buildTrend(
  metric: EducationalAnalyticsEvolutionMetric,
  points: EducationalAnalyticsEvolutionPoint[],
): EducationalAnalyticsEvolutionTrend {
  const firstPoint = points.length > 0 ? points[0] : null
  const latestPoint =
    points.length > 0
      ? points[points.length - 1]
      : null

  const first = firstPoint?.counts[metric] ?? 0
  const latest = latestPoint?.counts[metric] ?? 0
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
  const normalizedLimit =
    Number.isFinite(limit)
      ? Math.min(100, Math.max(2, Math.trunc(limit)))
      : 50

  const rows = await listEducationalAnalyticsHistory({
    client,
    options: {
      userId: normalizeRequiredText(userId, 'userId'),
      analysisKey: analysisKey?.trim() || null,
      includeArchived: false,
      limit: normalizedLimit,
    },
  })

  const points = (Array.isArray(rows) ? rows : [])
    .map(toPoint)
    .filter(point => point.runId !== 'unknown-run')
    .sort(
      (first, second) =>
        new Date(first.generatedAt).getTime() -
        new Date(second.generatedAt).getTime(),
    )

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

  const firstPoint = points.length > 0 ? points[0] : null
  const latestPoint =
    points.length > 0
      ? points[points.length - 1]
      : null

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
      firstGeneratedAt: firstPoint?.generatedAt ?? null,
      latestGeneratedAt: latestPoint?.generatedAt ?? null,
    },
    generatedAt: new Date().toISOString(),
    warnings,
  }
}
