/**
 * EduData IA — EIOS
 * Capability 04: Educational Analytics
 * Sprint 04.12 — Reporting Service
 *
 * Camada oficial de composição entre a execução analítica e o Analytics Report Engine.
 *
 * Regras:
 * - não altera o núcleo analítico;
 * - gera relatório somente a partir de um EducationalAnalyticsResult já consolidado;
 * - preserva revisão humana, ética, privacidade e rastreabilidade;
 * - falha de geração do relatório não invalida a análise principal.
 */

import {
  buildAnalyticsReport,
  type BuildAnalyticsReportResult,
} from './analytics-report.engine'

import {
  runEducationalAnalytics,
  type RunEducationalAnalyticsInput,
  type RunEducationalAnalyticsResult,
} from './educational-analytics.service'

export type RunEducationalAnalyticsWithReportResult =
  RunEducationalAnalyticsResult & {
    report:
      BuildAnalyticsReportResult | null
  }

export function runEducationalAnalyticsWithReport(
  request:
    RunEducationalAnalyticsInput,
): RunEducationalAnalyticsWithReportResult {
  const result =
    runEducationalAnalytics(request)

  if (!result.analytics) {
    return {
      ...result,
      report: null,
    }
  }

  const report =
    buildAnalyticsReport({
      analytics:
        result.analytics,
      audience:
        'teacher',
      generatedBy:
        result.analytics
          .context
          .requestedByUserId,
      metadata: {
        serviceName:
          'eios-educational-analytics-report-service',
        serviceVersion:
          '1.0.0',
        sourceService:
          'eios-educational-analytics-service',
        correlationId:
          request.correlationId,
      },
    })

  return {
    ...result,
    report,
    metadata: {
      ...result.metadata,
      reportGenerated:
        report.success,
      reportId:
        report.report?.id ?? null,
      reportServiceName:
        'eios-educational-analytics-report-service',
      reportServiceVersion:
        '1.0.0',
    },
  }
}
