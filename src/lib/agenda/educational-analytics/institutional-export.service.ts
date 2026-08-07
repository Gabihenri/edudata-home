/**
 * EduData IA — EIOS
 * Capability 04: Educational Analytics
 * Sprint 04.17.2 — Institutional Export Service
 *
 * Exporta InstitutionalReport sem recalcular a análise e sem criar um novo
 * contrato de inteligência. Suporta JSON canônico e HTML imprimível.
 */

import type {
  SupabaseClient,
} from '@supabase/supabase-js'

import {
  buildHistoricalInstitutionalReport,
} from './institutional-report.service'

import type {
  InstitutionalReport,
  InstitutionalReportProfile,
} from './institutional-report.engine'

export type InstitutionalExportFormat =
  | 'json'
  | 'html'

export type InstitutionalExportDocument = {
  id: string
  runId: string
  analysisId: string
  sourceReportId: string
  profile: InstitutionalReportProfile
  format: InstitutionalExportFormat
  version: string
  fileName: string
  mimeType: string
  hash: string
  generatedAt: string
  generatedBy: string | null
  requiresHumanReview: boolean
  approved: boolean
  publicationAllowed: boolean
  content: string
  metadata: Record<string, unknown>
}

export type BuildInstitutionalExportInput = {
  client: SupabaseClient
  userId: string
  runId: string
  profile: InstitutionalReportProfile
  format: InstitutionalExportFormat
}

const EXPORT_SERVICE_NAME =
  'eios-institutional-export-service'

const EXPORT_SERVICE_VERSION = '1.0.0'
const DOCUMENT_VERSION = '1.0'

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

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80) || 'relatorio'
}

function createStableHash(value: string): string {
  let hash = 2166136261

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return (hash >>> 0)
    .toString(16)
    .padStart(8, '0')
}

function buildCanonicalPayload({
  runId,
  report,
  generatedAt,
}: {
  runId: string
  report: InstitutionalReport
  generatedAt: string
}) {
  return {
    schema:
      'edudata.eios.educational-analytics.institutional-report',
    schemaVersion: DOCUMENT_VERSION,
    runId,
    generatedAt,
    report,
    governance: {
      requiresHumanReview:
        report.governance.requiresHumanReview,
      approved:
        report.governance.approved,
      publicationAllowed:
        report.governance.publicationAllowed,
      reviewedAt:
        report.governance.reviewedAt,
      reviewedBy:
        report.governance.reviewedBy,
      automatedDecisionProhibited: true,
      causalityStatus: 'association_only',
    },
  }
}

function listHtmlItems(
  title: string,
  values: string[],
): string {
  if (values.length === 0) {
    return ''
  }

  return `
    <section class="notice">
      <h3>${escapeHtml(title)}</h3>
      <ul>${values
        .map(value => `<li>${escapeHtml(value)}</li>`)
        .join('')}</ul>
    </section>
  `
}

function buildHtml({
  runId,
  report,
  generatedAt,
  hash,
}: {
  runId: string
  report: InstitutionalReport
  generatedAt: string
  hash: string
}): string {
  const sections = report.sections
    .slice()
    .sort((first, second) => first.order - second.order)
    .map(section => `
      <section class="report-section">
        <div class="section-kicker">${escapeHtml(section.emphasis)}</div>
        <h2>${escapeHtml(section.title)}</h2>
        ${
          section.description
            ? `<p class="muted">${escapeHtml(section.description)}</p>`
            : ''
        }
        ${
          section.narrative
            ? `<p>${escapeHtml(section.narrative)}</p>`
            : ''
        }
        ${
          section.requiresHumanReview
            ? '<p class="review">Requer revisão humana.</p>'
            : ''
        }
      </section>
    `)
    .join('')

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(report.title)}</title>
  <style>
    :root { color-scheme: light; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: #f5f6f8;
      color: #071827;
      line-height: 1.6;
    }
    main {
      width: min(980px, calc(100% - 32px));
      margin: 32px auto;
      background: white;
      border: 1px solid #dbe3ea;
      border-radius: 24px;
      overflow: hidden;
    }
    header {
      background: #071827;
      color: white;
      padding: 36px;
    }
    header .brand {
      font-size: 12px;
      font-weight: 800;
      letter-spacing: .16em;
      text-transform: uppercase;
      color: #67e8f9;
    }
    header h1 { margin: 10px 0 8px; font-size: 30px; line-height: 1.2; }
    header p { margin: 0; color: #cbd5e1; }
    .content { padding: 32px 36px; }
    .summary {
      padding: 20px;
      border: 1px solid #bae6fd;
      background: #ecfeff;
      border-radius: 18px;
      margin-bottom: 24px;
    }
    .report-section {
      padding: 22px 0;
      border-top: 1px solid #e2e8f0;
      break-inside: avoid;
    }
    .section-kicker {
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: .14em;
      color: #0b7491;
    }
    h2 { margin: 6px 0 8px; font-size: 21px; }
    h3 { margin: 0 0 8px; font-size: 16px; }
    p { margin: 8px 0; }
    .muted { color: #64748b; }
    .review { color: #92400e; font-weight: 700; }
    .notice {
      margin-top: 18px;
      padding: 16px 18px;
      border-radius: 16px;
      border: 1px solid #e2e8f0;
      background: #f8fafc;
      break-inside: avoid;
    }
    .notice ul { margin: 8px 0 0 18px; padding: 0; }
    footer {
      padding: 22px 36px;
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      font-size: 12px;
      color: #64748b;
    }
    .governance {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px 18px;
      margin-top: 18px;
      font-size: 13px;
    }
    @media print {
      body { background: white; }
      main {
        width: 100%;
        margin: 0;
        border: 0;
        border-radius: 0;
      }
      @page { size: A4; margin: 12mm; }
      header, footer { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <main>
    <header>
      <div class="brand">EduData IA · EIOS</div>
      <h1>${escapeHtml(report.title)}</h1>
      <p>${escapeHtml(report.subtitle ?? `Perfil: ${report.profile}`)}</p>
    </header>

    <div class="content">
      <section class="summary">
        <strong>Resumo executivo</strong>
        <p>${escapeHtml(report.executiveSummary)}</p>
      </section>

      ${sections}

      ${listHtmlItems('Limitações', report.limitations)}
      ${listHtmlItems('Alertas éticos', report.ethicalWarnings)}
      ${listHtmlItems('Alertas de privacidade', report.privacyWarnings)}

      <section class="notice">
        <h3>Governança</h3>
        <div class="governance">
          <div><strong>Revisão humana:</strong> ${report.governance.requiresHumanReview ? 'obrigatória' : 'não requerida'}</div>
          <div><strong>Aprovado:</strong> ${report.governance.approved ? 'sim' : 'não'}</div>
          <div><strong>Publicação:</strong> ${report.governance.publicationAllowed ? 'permitida' : 'não permitida'}</div>
          <div><strong>Causalidade:</strong> associação apenas</div>
        </div>
      </section>
    </div>

    <footer>
      <div>Run ID: ${escapeHtml(runId)}</div>
      <div>Analysis ID: ${escapeHtml(report.analysisId)}</div>
      <div>Report ID: ${escapeHtml(report.id)}</div>
      <div>Gerado em: ${escapeHtml(generatedAt)}</div>
      <div>Hash: ${escapeHtml(hash)}</div>
      <div>Documento derivado do AnalyticsReport oficial. Não substitui revisão profissional.</div>
    </footer>
  </main>
</body>
</html>`
}

export async function buildInstitutionalExport(
  input: BuildInstitutionalExportInput,
): Promise<InstitutionalExportDocument> {
  const userId = normalizeRequiredText(input.userId, 'userId')
  const runId = normalizeRequiredText(input.runId, 'runId')
  const generatedAt = new Date().toISOString()

  const reportResult =
    await buildHistoricalInstitutionalReport({
      client: input.client,
      userId,
      runId,
      profile: input.profile,
    })

  if (!reportResult.success || !reportResult.report) {
    throw new Error(
      reportResult.errors[0] ||
      'Não foi possível gerar o relatório institucional para exportação.',
    )
  }

  const report = reportResult.report
  const canonical = buildCanonicalPayload({
    runId,
    report,
    generatedAt,
  })
  const canonicalJson = JSON.stringify(canonical, null, 2)
  const hash = createStableHash(canonicalJson)

  const baseName = slugify(
    `${report.title}-${report.profile}-${runId}`,
  )

  const content =
    input.format === 'json'
      ? canonicalJson
      : buildHtml({
          runId,
          report,
          generatedAt,
          hash,
        })

  return {
    id: `${report.id}:export:${input.format}:${hash}`,
    runId,
    analysisId: report.analysisId,
    sourceReportId: report.sourceReportId,
    profile: report.profile,
    format: input.format,
    version: DOCUMENT_VERSION,
    fileName:
      input.format === 'json'
        ? `${baseName}.json`
        : `${baseName}.html`,
    mimeType:
      input.format === 'json'
        ? 'application/json; charset=utf-8'
        : 'text/html; charset=utf-8',
    hash,
    generatedAt,
    generatedBy: report.generatedBy,
    requiresHumanReview:
      report.governance.requiresHumanReview,
    approved: report.governance.approved,
    publicationAllowed:
      report.governance.publicationAllowed,
    content,
    metadata: {
      serviceName: EXPORT_SERVICE_NAME,
      serviceVersion: EXPORT_SERVICE_VERSION,
      documentVersion: DOCUMENT_VERSION,
      sourceInstitutionalReportId: report.id,
      sourceReportId: report.sourceReportId,
      audience: report.audience,
      profile: report.profile,
      hashAlgorithm: 'fnv1a-32',
      derivedWithoutRecalculation: true,
      automatedDecisionProhibited: true,
      causalityStatus: 'association_only',
    },
  }
}

export function getInstitutionalExportServiceInfo() {
  return {
    name: EXPORT_SERVICE_NAME,
    version: EXPORT_SERVICE_VERSION,
    formats: ['json', 'html'] as InstitutionalExportFormat[],
    printReadyHtml: true,
    guarantees: [
      'single_report_source',
      'no_analytics_recalculation',
      'deterministic_hash',
      'human_review_preserved',
      'publication_status_preserved',
      'privacy_and_ethics_preserved',
    ],
  }
}
