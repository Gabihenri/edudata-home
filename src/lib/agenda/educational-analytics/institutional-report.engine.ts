/**
 * EduData IA — EIOS
 * Capability 04: Educational Analytics
 * Sprint 04.17.1 — Institutional Report Engine
 *
 * Especializa o AnalyticsReport oficial para diferentes públicos institucionais
 * sem criar um segundo contrato de relatório.
 *
 * Regras:
 * - deriva exclusivamente de AnalyticsReport já gerado;
 * - não recalcula análises;
 * - não infere causalidade;
 * - não aprova relatório automaticamente;
 * - preserva ética, privacidade, limitações e revisão humana;
 * - adapta ordem, destaque e narrativa ao público autorizado.
 */

import type {
  AnalyticsMetadata,
  AnalyticsReport,
  AnalyticsReportSection,
} from './analytics.types'

export type InstitutionalReportProfile =
  | 'teacher'
  | 'coordination'
  | 'direction'
  | 'supervision'
  | 'secretariat'
  | 'research'
  | 'technical'

export type InstitutionalReportSectionView = {
  id: string
  title: string
  description: string | null
  narrative: string | null
  order: number
  sourceSectionId: string
  requiresHumanReview: boolean
  emphasis:
    | 'primary'
    | 'secondary'
    | 'supporting'
  metadata: AnalyticsMetadata
}

export type InstitutionalReport = {
  id: string
  sourceReportId: string
  analysisId: string
  profile: InstitutionalReportProfile
  audience: AnalyticsReport['audience']
  title: string
  subtitle: string | null
  executiveSummary: string
  sections: InstitutionalReportSectionView[]
  limitations: string[]
  ethicalWarnings: string[]
  privacyWarnings: string[]
  governance: {
    requiresHumanReview: boolean
    approved: boolean
    reviewedAt: string | null
    reviewedBy: string | null
    publicationAllowed: boolean
  }
  generatedAt: string
  generatedBy: string | null
  metadata: AnalyticsMetadata
}

export type BuildInstitutionalReportInput = {
  report: AnalyticsReport
  profile: InstitutionalReportProfile
  generatedBy?: string | null
  metadata?: AnalyticsMetadata
}

export type BuildInstitutionalReportResult = {
  success: boolean
  report: InstitutionalReport | null
  warnings: string[]
  errors: string[]
  generatedAt: string
  metadata: AnalyticsMetadata
}

const ENGINE_NAME =
  'eios-institutional-report-engine'

const ENGINE_VERSION =
  '1.0.0'

const PROFILE_SECTION_ORDER: Record<
  InstitutionalReportProfile,
  string[]
> = {
  teacher: [
    'overview',
    'associations-patterns',
    'recommendations',
    'influence-prediction',
    'governance',
    'research',
  ],
  coordination: [
    'overview',
    'associations-patterns',
    'recommendations',
    'influence-prediction',
    'governance',
    'research',
  ],
  direction: [
    'overview',
    'recommendations',
    'associations-patterns',
    'governance',
    'influence-prediction',
    'research',
  ],
  supervision: [
    'overview',
    'associations-patterns',
    'governance',
    'recommendations',
    'influence-prediction',
    'research',
  ],
  secretariat: [
    'overview',
    'governance',
    'associations-patterns',
    'recommendations',
    'influence-prediction',
    'research',
  ],
  research: [
    'overview',
    'associations-patterns',
    'research',
    'influence-prediction',
    'governance',
    'recommendations',
  ],
  technical: [
    'overview',
    'associations-patterns',
    'influence-prediction',
    'research',
    'governance',
    'recommendations',
  ],
}

function nowIso(): string {
  return new Date().toISOString()
}

function uniqueStrings(
  values: Array<string | null | undefined>,
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

function profileToAudience(
  profile: InstitutionalReportProfile,
): AnalyticsReport['audience'] {
  switch (profile) {
    case 'teacher':
      return 'teacher'
    case 'coordination':
      return 'coordinator'
    case 'direction':
      return 'director'
    case 'supervision':
      return 'supervision'
    case 'secretariat':
      return 'secretariat'
    case 'research':
      return 'researcher'
    case 'technical':
      return 'custom'
  }
}

function profileTitle(
  profile: InstitutionalReportProfile,
): string {
  switch (profile) {
    case 'teacher':
      return 'Relatório Pedagógico'
    case 'coordination':
      return 'Relatório de Coordenação Pedagógica'
    case 'direction':
      return 'Relatório Executivo de Gestão'
    case 'supervision':
      return 'Relatório de Supervisão Educacional'
    case 'secretariat':
      return 'Relatório Institucional'
    case 'research':
      return 'Relatório de Pesquisa Educacional'
    case 'technical':
      return 'Relatório Técnico do Educational Analytics'
  }
}

function sectionEmphasis(
  profile: InstitutionalReportProfile,
  sectionId: string,
): InstitutionalReportSectionView['emphasis'] {
  const primaryByProfile: Record<
    InstitutionalReportProfile,
    string[]
  > = {
    teacher: [
      'overview',
      'recommendations',
      'associations-patterns',
    ],
    coordination: [
      'overview',
      'associations-patterns',
      'recommendations',
    ],
    direction: [
      'overview',
      'recommendations',
      'governance',
    ],
    supervision: [
      'overview',
      'governance',
      'associations-patterns',
    ],
    secretariat: [
      'overview',
      'governance',
    ],
    research: [
      'overview',
      'research',
      'associations-patterns',
    ],
    technical: [
      'overview',
      'associations-patterns',
      'influence-prediction',
      'governance',
    ],
  }

  if (
    primaryByProfile[profile]
      .includes(sectionId)
  ) {
    return 'primary'
  }

  if (
    sectionId === 'governance' ||
    sectionId === 'recommendations' ||
    sectionId === 'research'
  ) {
    return 'secondary'
  }

  return 'supporting'
}

function buildExecutiveSummary(
  source: AnalyticsReport,
  profile: InstitutionalReportProfile,
): string {
  const prefix =
    profile === 'teacher'
      ? 'Síntese para apoio ao trabalho pedagógico.'
      : profile === 'coordination'
        ? 'Síntese para acompanhamento pedagógico e coordenação de ações.'
        : profile === 'direction'
          ? 'Síntese executiva para apoio à gestão e priorização institucional.'
          : profile === 'supervision'
            ? 'Síntese para acompanhamento, supervisão e garantia de qualidade.'
            : profile === 'secretariat'
              ? 'Síntese institucional para leitura agregada, governança e planejamento.'
              : profile === 'research'
                ? 'Síntese para interpretação metodológica e formulação de hipóteses de pesquisa.'
                : 'Síntese técnica da execução do Educational Analytics.'

  return [
    prefix,
    source.summary,
    source.approved
      ? 'O relatório possui aprovação humana registrada.'
      : 'O relatório ainda requer revisão humana antes de qualquer publicação ou uso decisório.',
  ].join(' ')
}

function buildSectionView({
  section,
  profile,
  order,
}: {
  section: AnalyticsReportSection
  profile: InstitutionalReportProfile
  order: number
}): InstitutionalReportSectionView {
  return {
    id:
      `${profile}:${section.id}`,
    title:
      section.title,
    description:
      section.description,
    narrative:
      section.narrative,
    order,
    sourceSectionId:
      section.id,
    requiresHumanReview:
      section.requiresHumanReview,
    emphasis:
      sectionEmphasis(
        profile,
        section.id,
      ),
    metadata: {
      ...section.metadata,
      sourceSectionId:
        section.id,
      institutionalProfile:
        profile,
    },
  }
}

function orderSections(
  sections: AnalyticsReportSection[],
  profile: InstitutionalReportProfile,
): InstitutionalReportSectionView[] {
  const configuredOrder =
    PROFILE_SECTION_ORDER[profile]

  const byId =
    new Map(
      sections.map(section => [
        section.id,
        section,
      ]),
    )

  const ordered =
    configuredOrder
      .map(id => byId.get(id))
      .filter(
        (
          section,
        ): section is AnalyticsReportSection =>
          Boolean(section),
      )

  const remaining =
    sections
      .filter(
        section =>
          !configuredOrder
            .includes(section.id),
      )
      .sort(
        (first, second) =>
          first.order - second.order,
      )

  return [
    ...ordered,
    ...remaining,
  ].map(
    (section, index) =>
      buildSectionView({
        section,
        profile,
        order: index + 1,
      }),
  )
}

export function buildInstitutionalReport(
  input: BuildInstitutionalReportInput,
): BuildInstitutionalReportResult {
  const generatedAt =
    nowIso()

  try {
    const source = input.report

    if (!source?.id?.trim()) {
      throw new Error(
        'O AnalyticsReport de origem é obrigatório.',
      )
    }

    const warnings =
      uniqueStrings([
        ...source.limitations,
        ...source.ethicalWarnings,
        ...source.privacyWarnings,
        source.approved
          ? null
          : 'O relatório institucional não pode ser tratado como publicado/aprovado até a conclusão da revisão humana.',
      ])

    const requiresHumanReview =
      source.sections.some(
        section =>
          section.requiresHumanReview,
      ) ||
      !source.approved

    const publicationAllowed =
      source.approved &&
      !requiresHumanReview

    const report:
      InstitutionalReport = {
      id:
        `${source.id}:institutional:${input.profile}`,
      sourceReportId:
        source.id,
      analysisId:
        source.analysisId,
      profile:
        input.profile,
      audience:
        profileToAudience(input.profile),
      title:
        `${profileTitle(input.profile)} — ${source.title}`,
      subtitle:
        source.subtitle,
      executiveSummary:
        buildExecutiveSummary(
          source,
          input.profile,
        ),
      sections:
        orderSections(
          source.sections,
          input.profile,
        ),
      limitations:
        [...source.limitations],
      ethicalWarnings:
        [...source.ethicalWarnings],
      privacyWarnings:
        [...source.privacyWarnings],
      governance: {
        requiresHumanReview,
        approved:
          source.approved,
        reviewedAt:
          source.reviewedAt,
        reviewedBy:
          source.reviewedBy,
        publicationAllowed,
      },
      generatedAt,
      generatedBy:
        input.generatedBy ??
        source.generatedBy,
      metadata: {
        ...source.metadata,
        ...(input.metadata ?? {}),
        engineName:
          ENGINE_NAME,
        engineVersion:
          ENGINE_VERSION,
        institutionalProfile:
          input.profile,
        sourceReportId:
          source.id,
        sourceAudience:
          source.audience,
        derivedWithoutRecalculation:
          true,
        automatedDecisionProhibited:
          true,
      },
    }

    return {
      success: true,
      report,
      warnings,
      errors: [],
      generatedAt,
      metadata: {
        engineName:
          ENGINE_NAME,
        engineVersion:
          ENGINE_VERSION,
        profile:
          input.profile,
        sourceReportId:
          source.id,
      },
    }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Erro desconhecido na geração do relatório institucional.'

    return {
      success: false,
      report: null,
      warnings: [],
      errors: [message],
      generatedAt,
      metadata: {
        engineName:
          ENGINE_NAME,
        engineVersion:
          ENGINE_VERSION,
        profile:
          input.profile,
      },
    }
  }
}

export function getInstitutionalReportEngineInfo() {
  return {
    name: ENGINE_NAME,
    version: ENGINE_VERSION,
    deterministic: true,
    derivesFrom:
      'AnalyticsReport',
    guarantees: [
      'single_report_contract',
      'no_analytics_recalculation',
      'no_automatic_approval',
      'human_review_preserved',
      'privacy_warnings_preserved',
      'ethical_warnings_preserved',
      'professional_autonomy_preserved',
    ],
  }
}
