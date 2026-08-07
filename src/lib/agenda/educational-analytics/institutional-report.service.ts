/**
 * EduData IA — EIOS
 * Capability 04: Educational Analytics
 * Sprint 04.17.1 — Institutional Report Service
 *
 * Liga o Institutional Report Engine ao histórico persistido do Educational Analytics.
 */

import type {
  SupabaseClient,
} from '@supabase/supabase-js'

import type {
  AnalyticsReport,
} from './analytics.types'

import {
  buildInstitutionalReport,
  type BuildInstitutionalReportResult,
  type InstitutionalReportProfile,
} from './institutional-report.engine'

import {
  getEducationalAnalyticsHistoricalDetail,
} from './educational-analytics-history.service'

export type BuildHistoricalInstitutionalReportInput = {
  client: SupabaseClient
  userId: string
  runId: string
  profile: InstitutionalReportProfile
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

function isAnalyticsReport(
  value: unknown,
): value is AnalyticsReport {
  if (
    typeof value !== 'object' ||
    value === null ||
    Array.isArray(value)
  ) {
    return false
  }

  const candidate =
    value as Record<string, unknown>

  return (
    typeof candidate.id === 'string' &&
    typeof candidate.analysisId === 'string' &&
    typeof candidate.title === 'string' &&
    typeof candidate.summary === 'string' &&
    Array.isArray(candidate.sections) &&
    Array.isArray(candidate.limitations) &&
    Array.isArray(candidate.ethicalWarnings) &&
    Array.isArray(candidate.privacyWarnings)
  )
}

export async function buildHistoricalInstitutionalReport(
  input:
    BuildHistoricalInstitutionalReportInput,
): Promise<BuildInstitutionalReportResult> {
  const userId =
    normalizeRequiredText(
      input.userId,
      'userId',
    )

  const runId =
    normalizeRequiredText(
      input.runId,
      'runId',
    )

  const detail =
    await getEducationalAnalyticsHistoricalDetail({
      client:
        input.client,
      userId,
      runId,
    })

  if (!detail) {
    throw new Error(
      'A execução analítica solicitada não foi encontrada no histórico autorizado.',
    )
  }

  if (!detail.report) {
    throw new Error(
      'A execução selecionada não possui AnalyticsReport persistido.',
    )
  }

  if (!isAnalyticsReport(detail.report)) {
    throw new Error(
      'O relatório persistido não corresponde ao contrato AnalyticsReport esperado.',
    )
  }

  return buildInstitutionalReport({
    report:
      detail.report,
    profile:
      input.profile,
    generatedBy:
      userId,
    metadata: {
      source:
        'educational_analytics_history',
      historicalRunId:
        detail.row.id,
      historicalVersionNumber:
        detail.row.version_number,
      historicalVersionLabel:
        detail.row.version_label,
      historicalReviewStatus:
        detail.row.human_review_status,
      historicalApproved:
        detail.row.approved,
      correlationId:
        detail.row.correlation_id,
    },
  })
}
