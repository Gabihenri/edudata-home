/**
 * EduData IA — EIOS
 * Capability 04: Educational Analytics
 * Sprint 04.12 — Analytics Report Engine
 *
 * Consolida a saída do Educational Analytics no contrato oficial AnalyticsReport.
 *
 * Regras:
 * - não recalcula análises;
 * - não infere causalidade;
 * - não aprova resultados automaticamente;
 * - preserva alertas éticos, privacidade, limitações e revisão humana;
 * - produz narrativa determinística a partir dos resultados já calculados.
 */

import type {
  AnalyticsMetadata,
  AnalyticsReport,
  AnalyticsReportSection,
  EducationalAnalyticsResult,
} from './analytics.types'

const ENGINE_NAME =
  'eios-analytics-report-engine'

const ENGINE_VERSION =
  '1.0.0'

const RULESET_VERSION =
  'analytics-report-ruleset-1.0.0'

export type AnalyticsReportAudience =
  AnalyticsReport['audience']

export type BuildAnalyticsReportInput = {
  analytics:
    EducationalAnalyticsResult

  audience?:
    AnalyticsReportAudience

  title?: string

  subtitle?:
    string | null

  generatedBy?:
    string | null

  metadata?:
    AnalyticsMetadata
}

export type BuildAnalyticsReportResult = {
  success: boolean

  report:
    AnalyticsReport | null

  warnings: string[]

  errors: string[]

  generatedAt: string

  metadata: AnalyticsMetadata
}

function nowIso(): string {
  return new Date()
    .toISOString()
}

function normalizeOptionalText(
  value:
    string | null | undefined,
): string | null {
  return value?.trim() || null
}

function uniqueStrings(
  values:
    Array<string | null | undefined>,
): string[] {
  return Array.from(
    new Set(
      values
        .filter(
          (value): value is string =>
            typeof value === 'string',
        )
        .map(value => value.trim())
        .filter(Boolean),
    ),
  )
}

function createStableHash(
  value: string,
): string {
  let hash = 2166136261

  for (
    let index = 0;
    index < value.length;
    index += 1
  ) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return (hash >>> 0)
    .toString(16)
    .padStart(8, '0')
}

function createReportId(
  analytics:
    EducationalAnalyticsResult,
): string {
  return `analytics-report-${createStableHash(
    `${analytics.id}:${analytics.generatedAt}:${analytics.version.id}`,
  )}`
}

function countLabel(
  count: number,
  singular: string,
  plural: string,
): string {
  return `${count} ${
    count === 1
      ? singular
      : plural
  }`
}

function buildOverviewSection(
  analytics:
    EducationalAnalyticsResult,
): AnalyticsReportSection {
  const quality =
    analytics.dataQuality
      .overallScore

  const qualityText =
    quality === null
      ? 'qualidade global dos dados não determinada'
      : `qualidade global dos dados de ${Math.round(
          quality * 100,
        )}%`

  return {
    id: 'overview',
    title: 'Visão geral',
    description:
      'Síntese do escopo, volume de dados e qualidade da análise.',
    order: 1,
    metricIds:
      uniqueStrings(
        analytics.metricResults
          .map(result => result.metricId),
      ),
    correlationIds: [],
    patternIds: [],
    anomalyIds: [],
    influenceIds: [],
    predictionIds: [],
    recommendationIds: [],
    researchResultIds: [],
    narrative:
      `A análise processou ${countLabel(
        analytics.observations.length,
        'observação',
        'observações',
      )} de ${countLabel(
        analytics.sources.length,
        'fonte',
        'fontes',
      )}, com ${qualityText}.`,
    requiresHumanReview:
      analytics.configuration
        .requireHumanReview,
    metadata: {
      analyticsStatus:
        analytics.status,
      scope:
        analytics.context.scope,
      dataQualityScore:
        quality,
    },
  }
}

function buildEvidenceSection(
  analytics:
    EducationalAnalyticsResult,
): AnalyticsReportSection {
  return {
    id: 'associations-patterns',
    title:
      'Associações, padrões e anomalias',
    description:
      'Resultados descritivos e correlacionais que exigem interpretação contextual.',
    order: 2,
    metricIds: [],
    correlationIds:
      analytics.correlations
        .map(result => result.id),
    patternIds:
      analytics.patterns
        .map(result => result.id),
    anomalyIds:
      analytics.anomalies
        .map(result => result.id),
    influenceIds: [],
    predictionIds: [],
    recommendationIds: [],
    researchResultIds: [],
    narrative:
      `Foram registrados ${countLabel(
        analytics.correlations.length,
        'resultado correlacional',
        'resultados correlacionais',
      )}, ${countLabel(
        analytics.patterns.length,
        'padrão',
        'padrões',
      )} e ${countLabel(
        analytics.anomalies.length,
        'anomalia',
        'anomalias',
      )}. Correlação e associação não constituem evidência causal.`,
    requiresHumanReview: true,
    metadata: {
      causalityStatus:
        'association_only',
    },
  }
}

function buildInfluencePredictionSection(
  analytics:
    EducationalAnalyticsResult,
): AnalyticsReportSection {
  return {
    id: 'influence-prediction',
    title:
      'Influência e projeções',
    description:
      'Leituras estruturais de influência e projeções estatísticas, quando habilitadas.',
    order: 3,
    metricIds: [],
    correlationIds: [],
    patternIds: [],
    anomalyIds: [],
    influenceIds:
      analytics.influences
        .map(result => result.id),
    predictionIds:
      analytics.predictions
        .map(result => result.id),
    recommendationIds: [],
    researchResultIds: [],
    narrative:
      `A execução contém ${countLabel(
        analytics.influences.length,
        'resultado de influência',
        'resultados de influência',
      )} e ${countLabel(
        analytics.predictions.length,
        'projeção',
        'projeções',
      )}. Esses resultados representam sinais analíticos e não decisões automáticas.`,
    requiresHumanReview: true,
    metadata: {
      predictionIsDecision: false,
      influenceIsCausation: false,
    },
  }
}

function buildRecommendationSection(
  analytics:
    EducationalAnalyticsResult,
): AnalyticsReportSection {
  const pendingDecisions =
    analytics.recommendations
      .filter(
        recommendation =>
          recommendation
            .teacherDecision ===
          'pending',
      )
      .length

  return {
    id: 'recommendations',
    title:
      'Recomendações para revisão profissional',
    description:
      'Propostas derivadas dos sinais analíticos que dependem de decisão humana.',
    order: 4,
    metricIds: [],
    correlationIds: [],
    patternIds: [],
    anomalyIds: [],
    influenceIds: [],
    predictionIds: [],
    recommendationIds:
      analytics.recommendations
        .map(result => result.id),
    researchResultIds: [],
    narrative:
      `Foram geradas ${countLabel(
        analytics.recommendations.length,
        'recomendação',
        'recomendações',
      )}; ${countLabel(
        pendingDecisions,
        'permanece pendente de decisão docente',
        'permanecem pendentes de decisão docente',
      )}.`,
    requiresHumanReview: true,
    metadata: {
      pendingTeacherDecisions:
        pendingDecisions,
      automatedDecisionProhibited:
        analytics.ethics
          .automatedDecisionProhibited,
    },
  }
}

function buildResearchSection(
  analytics:
    EducationalAnalyticsResult,
): AnalyticsReportSection {
  return {
    id: 'research',
    title:
      'Pesquisa e hipóteses',
    description:
      'Questões, hipóteses e achados exploratórios sujeitos à validação metodológica e ética.',
    order: 5,
    metricIds: [],
    correlationIds: [],
    patternIds: [],
    anomalyIds: [],
    influenceIds: [],
    predictionIds: [],
    recommendationIds: [],
    researchResultIds:
      analytics.researchResults
        .map(result => result.id),
    narrative:
      analytics.researchResults.length > 0
        ? `A análise contém ${countLabel(
            analytics.researchResults.length,
            'resultado de pesquisa',
            'resultados de pesquisa',
          )}. Hipóteses geradas pelo motor devem ser validadas por revisão humana antes de qualquer conclusão.`
        : 'Nenhum resultado de pesquisa foi gerado nesta execução.',
    requiresHumanReview: true,
    metadata: {
      causalInferenceAllowed:
        analytics.researchEligibility
          .causalInferenceAllowed,
      researchEligible:
        analytics.researchEligibility
          .eligible,
    },
  }
}

function buildGovernanceSection(
  analytics:
    EducationalAnalyticsResult,
): AnalyticsReportSection {
  return {
    id: 'governance',
    title:
      'Governança, ética e privacidade',
    description:
      'Condições de uso, supervisão humana e restrições aplicáveis aos resultados.',
    order: 6,
    metricIds: [],
    correlationIds: [],
    patternIds: [],
    anomalyIds: [],
    influenceIds: [],
    predictionIds: [],
    recommendationIds: [],
    researchResultIds: [],
    narrative:
      'Os resultados devem ser utilizados como apoio à interpretação profissional, preservando autonomia docente, privacidade, não discriminação e rastreabilidade.',
    requiresHumanReview: true,
    metadata: {
      privacyLevel:
        analytics.privacy.level,
      reidentificationRisk:
        analytics.privacy
          .reidentificationRisk,
      professionalAutonomyPreserved:
        analytics.ethics
          .professionalAutonomyPreserved,
    },
  }
}

function buildLimitations(
  analytics:
    EducationalAnalyticsResult,
): string[] {
  return uniqueStrings([
    ...analytics.explainability
      .limitations,
    ...analytics.warnings,
    ...analytics.researchResults
      .flatMap(result => result.limitations),
    'Correlação, associação, influência e previsão não comprovam causalidade.',
    'Resultados analíticos não devem ser utilizados isoladamente para decisões pedagógicas ou administrativas.',
    'Recomendações exigem decisão profissional humana antes de qualquer ação.',
  ])
}

function buildEthicalWarnings(
  analytics:
    EducationalAnalyticsResult,
): string[] {
  return uniqueStrings([
    ...analytics.ethics
      .ethicalWarnings,
    analytics.ethics
      .humanOversightRequired
      ? 'Supervisão humana obrigatória.'
      : null,
    analytics.ethics
      .automatedDecisionProhibited
      ? 'Decisões automatizadas estão proibidas para esta análise.'
      : null,
    analytics.ethics
      .biasAssessmentRequired
      ? 'Avaliação de vieses deve ser considerada na interpretação.'
      : null,
    analytics.ethics
      .inclusionAssessmentRequired
      ? 'Impactos de inclusão devem ser avaliados antes de intervenções.'
      : null,
  ])
}

function buildPrivacyWarnings(
  analytics:
    EducationalAnalyticsResult,
): string[] {
  return uniqueStrings([
    analytics.privacy
      .containsPersonalData
      ? 'A análise contém ou deriva de dados pessoais e exige controle de acesso adequado.'
      : null,
    analytics.privacy
      .containsSensitiveData
      ? 'A análise contém ou deriva de dados sensíveis e requer proteção reforçada.'
      : null,
    analytics.privacy
      .containsMinorData
      ? 'A análise envolve dados de menores e requer tratamento compatível com as regras de proteção aplicáveis.'
      : null,
    analytics.privacy
      .anonymized
      ? 'Os dados foram sinalizados como anonimizados no contrato analítico.'
      : null,
    analytics.privacy
      .pseudonymized
      ? 'Os dados foram sinalizados como pseudonimizados no contrato analítico.'
      : null,
    ...analytics.privacy
      .accessRestrictions,
    ...analytics.privacy
      .prohibitedUses,
  ])
}

function buildSummary(
  analytics:
    EducationalAnalyticsResult,
): string {
  return [
    `Análise ${analytics.analysisKey}.`,
    `${countLabel(
      analytics.correlations.length,
      'correlação',
      'correlações',
    )}, ${countLabel(
      analytics.patterns.length,
      'padrão',
      'padrões',
    )}, ${countLabel(
      analytics.anomalies.length,
      'anomalia',
      'anomalias',
    )}, ${countLabel(
      analytics.influences.length,
      'resultado de influência',
      'resultados de influência',
    )}, ${countLabel(
      analytics.predictions.length,
      'projeção',
      'projeções',
    )} e ${countLabel(
      analytics.recommendations.length,
      'recomendação',
      'recomendações',
    )}.`,
    'A interpretação final permanece sob responsabilidade profissional humana.',
  ].join(' ')
}

export function buildAnalyticsReport(
  input:
    BuildAnalyticsReportInput,
): BuildAnalyticsReportResult {
  const generatedAt =
    nowIso()

  try {
    const analytics =
      input.analytics

    if (!analytics?.id?.trim()) {
      throw new Error(
        'A análise é obrigatória para gerar o relatório.',
      )
    }

    const warnings =
      uniqueStrings([
        ...analytics.warnings,
        analytics.status === 'failed'
          ? 'A análise de origem está marcada como falha.'
          : null,
        analytics.status ===
          'completed_with_warnings'
          ? 'A análise de origem foi concluída com alertas.'
          : null,
      ])

    const sections = [
      buildOverviewSection(analytics),
      buildEvidenceSection(analytics),
      buildInfluencePredictionSection(
        analytics,
      ),
      buildRecommendationSection(
        analytics,
      ),
      buildResearchSection(analytics),
      buildGovernanceSection(analytics),
    ]

    const report:
      AnalyticsReport = {
      id:
        createReportId(analytics),
      analysisId:
        analytics.id,
      title:
        input.title?.trim() ||
        `Relatório analítico — ${analytics.context.title}`,
      subtitle:
        normalizeOptionalText(
          input.subtitle,
        ),
      summary:
        buildSummary(analytics),
      audience:
        input.audience ??
        'teacher',
      sections,
      limitations:
        buildLimitations(analytics),
      ethicalWarnings:
        buildEthicalWarnings(
          analytics,
        ),
      privacyWarnings:
        buildPrivacyWarnings(
          analytics,
        ),
      generatedAt,
      generatedBy:
        normalizeOptionalText(
          input.generatedBy,
        ) ??
        analytics.context
          .requestedByUserId,
      reviewedAt: null,
      reviewedBy: null,
      approved: false,
      exportFormats: [
        'json',
      ],
      metadata: {
        ...(input.metadata ?? {}),
        engineName:
          ENGINE_NAME,
        engineVersion:
          ENGINE_VERSION,
        rulesetVersion:
          RULESET_VERSION,
        sourceAnalysisStatus:
          analytics.status,
        sourceAnalysisVersion:
          analytics.version
            .versionLabel,
        sourceCorrelationId:
          analytics.traceability
            .correlationId,
        requiresHumanReview: true,
        causalConclusionGenerated: false,
      },
    }

    return {
      success: true,
      report,
      warnings,
      errors: [],
      generatedAt,
      metadata: {
        ...(input.metadata ?? {}),
        engineName:
          ENGINE_NAME,
        engineVersion:
          ENGINE_VERSION,
        sectionCount:
          sections.length,
      },
    }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Falha desconhecida no Analytics Report Engine.'

    return {
      success: false,
      report: null,
      warnings: [],
      errors: [message],
      generatedAt,
      metadata: {
        ...(input.metadata ?? {}),
        engineName:
          ENGINE_NAME,
        engineVersion:
          ENGINE_VERSION,
        failure: true,
      },
    }
  }
}

export function getAnalyticsReportEngineInfo() {
  return {
    name:
      ENGINE_NAME,
    version:
      ENGINE_VERSION,
    rulesetVersion:
      RULESET_VERSION,
    mode:
      'deterministic' as const,
    outputContract:
      'AnalyticsReport' as const,
    exportFormats: [
      'json',
    ] as const,
    guarantees: [
      'human_review_required',
      'automatic_approval_prohibited',
      'causal_conclusion_not_generated',
      'privacy_warnings_preserved',
      'ethical_warnings_preserved',
      'traceable_to_source_analysis',
    ],
    limitations: [
      'O motor organiza e narra resultados já existentes; não executa novas análises.',
      'A narrativa é determinística e não substitui interpretação profissional.',
      'Exportação nativa nesta versão é limitada ao contrato JSON.',
    ],
  }
}
