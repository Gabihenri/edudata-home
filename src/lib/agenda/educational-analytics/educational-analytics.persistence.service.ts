/**
 * EduData IA — EIOS
 * Capability 04: Educational Analytics
 * Sprint 04.13 — Persistence Service
 *
 * Responsabilidades:
 * - persistir execuções consolidadas do Educational Analytics;
 * - preservar idempotência e histórico longitudinal;
 * - superseder a versão anterior somente quando necessário;
 * - restaurar a versão anterior se a nova gravação falhar;
 * - persistir relatório sem aprová-lo automaticamente;
 * - respeitar o cliente Supabase autenticado recebido da camada de API.
 */

import type {
  SupabaseClient,
} from '@supabase/supabase-js'

import type {
  RunEducationalAnalyticsWithReportResult,
} from './educational-analytics-report.service'

import {
  createEducationalAnalyticsRun,
  findEducationalAnalyticsRunByIdempotencyKey,
  getCurrentEducationalAnalyticsRun,
  restoreEducationalAnalyticsRunAsCurrent,
  supersedeEducationalAnalyticsRun,
  type CreateEducationalAnalyticsRunInput,
  type EducationalAnalyticsJson,
  type EducationalAnalyticsRunRow,
} from '@/lib/agenda/repository/educational-analytics.repository'

export type PersistEducationalAnalyticsRunInput = {
  client: SupabaseClient
  execution:
    RunEducationalAnalyticsWithReportResult
  userId: string
  idempotencyKey?: string
}

export type PersistEducationalAnalyticsRunResult = {
  persisted: boolean
  reusedExisting: boolean
  row:
    EducationalAnalyticsRunRow | null
  previousVersionId: string | null
  generatedAt: string
  warnings: string[]
}

function nowIso(): string {
  return new Date().toISOString()
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

function asJson(
  value: unknown,
): EducationalAnalyticsJson {
  return value as unknown as
    EducationalAnalyticsJson
}

function buildIdempotencyKey({
  analysisId,
  versionId,
  generatedAt,
}: {
  analysisId: string
  versionId: string
  generatedAt: string
}): string {
  return [
    'educational-analytics',
    analysisId,
    versionId,
    generatedAt,
  ].join(':')
}

export async function persistEducationalAnalyticsRun(
  input:
    PersistEducationalAnalyticsRunInput,
): Promise<PersistEducationalAnalyticsRunResult> {
  const generatedAt =
    nowIso()
  const userId =
    normalizeRequiredText(
      input.userId,
      'userId',
    )
  const analytics =
    input.execution.analytics

  if (!analytics) {
    return {
      persisted: false,
      reusedExisting: false,
      row: null,
      previousVersionId: null,
      generatedAt,
      warnings: [
        'A execução não possui resultado analítico consolidado para persistência.',
      ],
    }
  }

  const idempotencyKey =
    input.idempotencyKey?.trim() ||
    buildIdempotencyKey({
      analysisId:
        analytics.id,
      versionId:
        analytics.version.id,
      generatedAt:
        analytics.generatedAt,
    })

  const existingByIdempotency =
    await findEducationalAnalyticsRunByIdempotencyKey({
      client:
        input.client,
      idempotencyKey,
    })

  if (existingByIdempotency) {
    return {
      persisted: true,
      reusedExisting: true,
      row:
        existingByIdempotency,
      previousVersionId:
        existingByIdempotency
          .previous_version_id,
      generatedAt,
      warnings: [],
    }
  }

  const current =
    await getCurrentEducationalAnalyticsRun({
      client:
        input.client,
      analysisKey:
        analytics.analysisKey,
      userId,
    })

  const versionNumber =
    current
      ? current.version_number + 1
      : Math.max(
          1,
          analytics.version
            .versionNumber,
        )

  const persistenceVersionId =
    `${analytics.id}:v${versionNumber}`

  const report =
    input.execution
      .report
      ?.report ?? null

  const createInput:
    CreateEducationalAnalyticsRunInput = {
    analysis_id:
      analytics.id,
    analysis_key:
      analytics.analysisKey,
    version_id:
      persistenceVersionId,
    version_number:
      versionNumber,
    version_label:
      analytics.version
        .versionLabel ||
      `${versionNumber}.0`,
    version_status:
      'current',
    previous_version_id:
      current?.id ?? null,
    parent_version_id:
      current
        ? current.parent_version_id ??
          current.id
        : null,
    is_current_version:
      true,
    idempotency_key:
      idempotencyKey,
    status:
      analytics.status,
    scope:
      analytics.context.scope,
    title:
      analytics.context.title,
    description:
      analytics.context.description,
    capability:
      'educational_analytics',
    source_product:
      'agenda_inteligente_edi',
    context:
      asJson(analytics.context),
    configuration:
      asJson(analytics.configuration),
    data_quality:
      asJson(analytics.dataQuality),
    privacy:
      asJson(analytics.privacy),
    ethics:
      asJson(analytics.ethics),
    research_eligibility:
      asJson(
        analytics.researchEligibility,
      ),
    explainability:
      asJson(analytics.explainability),
    traceability:
      asJson(analytics.traceability),
    analytics_payload:
      asJson(analytics),
    report_payload:
      report
        ? asJson(report)
        : null,
    correlation_count:
      analytics.correlations.length,
    pattern_count:
      analytics.patterns.length,
    anomaly_count:
      analytics.anomalies.length,
    influence_count:
      analytics.influences.length,
    prediction_count:
      analytics.predictions.length,
    recommendation_count:
      analytics.recommendations.length,
    research_result_count:
      analytics.researchResults.length,
    contains_personal_data:
      analytics.privacy
        .containsPersonalData,
    contains_sensitive_data:
      analytics.privacy
        .containsSensitiveData,
    contains_minor_data:
      analytics.privacy
        .containsMinorData,
    anonymized:
      analytics.privacy.anonymized,
    pseudonymized:
      analytics.privacy.pseudonymized,
    requires_human_review:
      analytics.configuration
        .requireHumanReview,
    human_review_status:
      report?.approved
        ? 'approved'
        : 'pending',
    human_review_payload: {},
    reviewed_at:
      report?.reviewedAt ?? null,
    reviewed_by:
      report?.reviewedBy ?? null,
    approved:
      report?.approved ?? false,
    approved_at:
      report?.approved
        ? report.reviewedAt
        : null,
    approved_by:
      report?.approved
        ? report.reviewedBy
        : null,
    user_id:
      userId,
    organization_id:
      analytics.context
        .organizationId,
    school_id:
      analytics.context.schoolId,
    owner_user_id:
      analytics.context
        .ownerUserId ??
      userId,
    created_by:
      userId,
    updated_by:
      userId,
    correlation_id:
      analytics.traceability
        .correlationId,
    causation_id:
      analytics.traceability
        .causationId,
    request_id:
      analytics.traceability
        .requestId,
    session_id:
      analytics.traceability
        .sessionId,
    trace_id:
      analytics.traceability
        .traceId,
    warnings:
      analytics.warnings,
    errors:
      analytics.errors,
    metadata: {
      ...asJson(analytics.metadata),
      persistenceService:
        'eios-educational-analytics-persistence-service',
      persistenceServiceVersion:
        '1.0.0',
      reportGenerated:
        input.execution.report
          ?.success ?? false,
      persistedAt:
        generatedAt,
    },
    generated_at:
      analytics.generatedAt,
    completed_at:
      analytics.completedAt,
    archived_at: null,
  }

  let previousSuperseded = false

  try {
    if (current) {
      await supersedeEducationalAnalyticsRun({
        client:
          input.client,
        id:
          current.id,
        updatedBy:
          userId,
      })

      previousSuperseded = true
    }

    const row =
      await createEducationalAnalyticsRun({
        client:
          input.client,
        input:
          createInput,
      })

    return {
      persisted: true,
      reusedExisting: false,
      row,
      previousVersionId:
        current?.id ?? null,
      generatedAt,
      warnings: [],
    }
  } catch (error) {
    if (
      current &&
      previousSuperseded
    ) {
      try {
        await restoreEducationalAnalyticsRunAsCurrent({
          client:
            input.client,
          id:
            current.id,
          updatedBy:
            userId,
        })
      } catch {
        // A exceção original é preservada. A falha de restauração
        // será detectável pelo histórico/auditoria da operação.
      }
    }

    throw error
  }
}
