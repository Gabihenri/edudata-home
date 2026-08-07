/**
 * EduData IA — EIOS
 * Capability 04.11: Research Engine
 *
 * Motor de pesquisa educacional do Educational Analytics.
 *
 * Responsabilidades:
 * - transformar resultados analíticos em questões de pesquisa;
 * - gerar hipóteses exploratórias quando a governança permitir;
 * - consolidar achados, métodos, limitações e reprodutibilidade;
 * - preservar privacidade, ética, explicabilidade e revisão humana;
 * - impedir que associação, correlação ou previsão sejam tratadas como causalidade.
 *
 * Este engine não executa pesquisa experimental, não substitui aprovação ética
 * e não autoriza inferência causal.
 */

import type {
  AnalyticsDirection,
  AnalyticsMetadata,
  AnalyticsResearchDesign,
  AnalyticsResearchHypothesis,
  AnalyticsResearchQuestion,
  AnalyticsResearchResult,
  AnalyticsTimestamp,
  EducationalAnalyticsResult,
} from './analytics.types'

const ENGINE_NAME =
  'eios-research-engine'

const ENGINE_VERSION =
  '1.0.0'

const RULESET_VERSION =
  'research-ruleset-1.0.0'

const DEFAULT_MAX_QUESTIONS = 12
const DEFAULT_MAX_HYPOTHESES = 12

export type ResearchEngineInput = {
  analytics:
    EducationalAnalyticsResult

  design?:
    AnalyticsResearchDesign | null

  title?: string | null

  populationDescription?:
    string | null

  sampleDescription?:
    string | null

  inclusionCriteria?: string[]

  exclusionCriteria?: string[]

  maximumQuestions?: number

  maximumHypotheses?: number

  requestedByUserId?:
    string | null

  metadata?: AnalyticsMetadata
}

export type ResearchEngineResult = {
  success: boolean

  researchResults:
    AnalyticsResearchResult[]

  warnings: string[]

  errors: string[]

  generatedAt: AnalyticsTimestamp

  metadata: AnalyticsMetadata
}

function nowIso(): AnalyticsTimestamp {
  return new Date().toISOString()
}

function normalizeOptionalText(
  value: string | null | undefined,
): string | null {
  return value?.trim() || null
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

function createStableId(
  prefix: string,
  value: string,
): string {
  return `${prefix}-${createStableHash(value)}`
}

function clampPositiveInteger(
  value: number | null | undefined,
  fallback: number,
): number {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value)
  ) {
    return fallback
  }

  return Math.max(
    1,
    Math.floor(value),
  )
}

function resolveDesign(
  input: ResearchEngineInput,
): AnalyticsResearchDesign {
  if (input.design) {
    return input.design
  }

  const analytics = input.analytics

  if (
    analytics.influences.some(
      influence =>
        influence.type === 'spatial',
    )
  ) {
    return 'spatial_analysis'
  }

  if (analytics.influences.length > 0) {
    return 'network_analysis'
  }

  if (
    analytics.patterns.some(
      pattern =>
        pattern.startAt !== null &&
        pattern.endAt !== null,
    )
  ) {
    return 'longitudinal'
  }

  if (analytics.correlations.length > 0) {
    return 'correlational'
  }

  return 'exploratory'
}

function directionFromCoefficient(
  coefficient: number | null,
): AnalyticsDirection {
  if (
    coefficient === null ||
    !Number.isFinite(coefficient)
  ) {
    return 'undetermined'
  }

  if (coefficient > 0) {
    return 'increasing'
  }

  if (coefficient < 0) {
    return 'decreasing'
  }

  return 'stable'
}

function buildResearchQuestions(
  input: ResearchEngineInput,
  maximumQuestions: number,
): AnalyticsResearchQuestion[] {
  const analytics = input.analytics
  const questions:
    AnalyticsResearchQuestion[] = []

  for (const correlation of analytics.correlations) {
    if (questions.length >= maximumQuestions) break

    questions.push({
      id: createStableId(
        'research-question',
        `${analytics.id}:correlation:${correlation.id}`,
      ),
      question:
        `Como ${correlation.variableXId} e ${correlation.variableYId} se relacionam no contexto analisado?`,
      rationale:
        'A questão foi gerada a partir de uma correlação observada e deve ser interpretada como associação, não causalidade.',
      primaryVariableIds: [
        correlation.variableXId,
        correlation.variableYId,
      ],
      secondaryVariableIds:
        correlation.controlVariableIds,
      targetEntityTypes: [],
      metadata: {
        sourceType: 'correlation',
        sourceId: correlation.id,
        coefficient: correlation.coefficient,
        significant:
          correlation.significance.significant,
      },
    })
  }

  for (const pattern of analytics.patterns) {
    if (questions.length >= maximumQuestions) break

    questions.push({
      id: createStableId(
        'research-question',
        `${analytics.id}:pattern:${pattern.id}`,
      ),
      question:
        `Quais condições estão associadas ao padrão “${pattern.title}” e à sua recorrência no período analisado?`,
      rationale:
        'A questão investiga condições associadas ao padrão sem assumir mecanismo causal.',
      primaryVariableIds:
        pattern.variableIds,
      secondaryVariableIds: [],
      targetEntityTypes: [],
      metadata: {
        sourceType: 'pattern',
        sourceId: pattern.id,
        patternType: pattern.type,
      },
    })
  }

  for (const influence of analytics.influences) {
    if (questions.length >= maximumQuestions) break

    questions.push({
      id: createStableId(
        'research-question',
        `${analytics.id}:influence:${influence.id}`,
      ),
      question:
        'Como a estrutura de relações observada se associa à propagação ou concentração dos fenômenos educacionais analisados?',
      rationale:
        'A influência representa estrutura associativa e não transmissão causal comprovada.',
      primaryVariableIds: [],
      secondaryVariableIds: [],
      targetEntityTypes:
        uniqueStrings([
          influence.sourceEntityType,
          ...influence.targetEntityTypes,
        ]) as AnalyticsResearchQuestion['targetEntityTypes'],
      metadata: {
        sourceType: 'influence',
        sourceId: influence.id,
        influenceType: influence.type,
        causalityStatus:
          influence.causalityStatus,
      },
    })
  }

  for (const prediction of analytics.predictions) {
    if (questions.length >= maximumQuestions) break

    questions.push({
      id: createStableId(
        'research-question',
        `${analytics.id}:prediction:${prediction.id}`,
      ),
      question:
        `Em que condições a projeção do tipo “${prediction.type}” se mantém ou se altera ao longo do acompanhamento?`,
      rationale:
        'A questão propõe validar longitudinalmente uma projeção, sem tratá-la como resultado futuro garantido.',
      primaryVariableIds:
        prediction.inputVariableIds,
      secondaryVariableIds: [],
      targetEntityTypes: [
        prediction.subjectEntityType,
      ],
      metadata: {
        sourceType: 'prediction',
        sourceId: prediction.id,
        riskLevel: prediction.riskLevel,
      },
    })
  }

  if (questions.length === 0) {
    questions.push({
      id: createStableId(
        'research-question',
        `${analytics.id}:exploratory`,
      ),
      question:
        'Quais padrões, diferenças e relações relevantes podem ser identificados nos dados educacionais disponíveis?',
      rationale:
        'Questão exploratória criada porque ainda não existem sinais analíticos especializados suficientes.',
      primaryVariableIds:
        analytics.configuration
          .variableDefinitions
          .map(variable => variable.id),
      secondaryVariableIds: [],
      targetEntityTypes: [],
      metadata: {
        sourceType: 'exploratory',
      },
    })
  }

  return questions
}

function buildResearchHypotheses(
  input: ResearchEngineInput,
  maximumHypotheses: number,
): AnalyticsResearchHypothesis[] {
  const analytics = input.analytics

  if (
    !analytics.researchEligibility
      .hypothesisGenerationAllowed
  ) {
    return []
  }

  const hypotheses:
    AnalyticsResearchHypothesis[] = []

  for (const correlation of analytics.correlations) {
    if (hypotheses.length >= maximumHypotheses) break

    if (
      correlation.coefficient === null ||
      Math.abs(correlation.coefficient) < 0.2
    ) {
      continue
    }

    hypotheses.push({
      id: createStableId(
        'research-hypothesis',
        `${analytics.id}:correlation:${correlation.id}`,
      ),
      type: 'exploratory',
      statement:
        `Existe associação observável entre ${correlation.variableXId} e ${correlation.variableYId} no contexto analisado.`,
      variableIds: [
        correlation.variableXId,
        correlation.variableYId,
      ],
      expectedDirection:
        directionFromCoefficient(
          correlation.coefficient,
        ),
      generatedBy: 'engine',
      validationStatus: 'pending',
      metadata: {
        sourceCorrelationId:
          correlation.id,
        coefficient:
          correlation.coefficient,
        causalityStatus:
          correlation.causalityStatus,
        requiresHumanValidation: true,
      },
    })
  }

  for (const pattern of analytics.patterns) {
    if (hypotheses.length >= maximumHypotheses) break

    if (pattern.variableIds.length === 0) {
      continue
    }

    hypotheses.push({
      id: createStableId(
        'research-hypothesis',
        `${analytics.id}:pattern:${pattern.id}`,
      ),
      type: 'exploratory',
      statement:
        `O padrão “${pattern.title}” apresenta recorrência ou estrutura suficientemente consistente para investigação em novas observações.`,
      variableIds:
        pattern.variableIds,
      expectedDirection:
        pattern.direction,
      generatedBy: 'engine',
      validationStatus: 'pending',
      metadata: {
        sourcePatternId: pattern.id,
        patternType: pattern.type,
        requiresHumanValidation: true,
      },
    })
  }

  return hypotheses
}

function buildFindings(
  analytics: EducationalAnalyticsResult,
): string[] {
  const findings: string[] = []

  if (analytics.correlations.length > 0) {
    findings.push(
      `${analytics.correlations.length} resultado(s) de correlação foram produzidos; correlação não implica causalidade.`,
    )
  }

  if (analytics.patterns.length > 0) {
    findings.push(
      `${analytics.patterns.length} padrão(ões) foram detectados para investigação e acompanhamento.`,
    )
  }

  if (analytics.anomalies.length > 0) {
    findings.push(
      `${analytics.anomalies.length} anomalia(s) foram identificadas e exigem interpretação contextual.`,
    )
  }

  if (analytics.influences.length > 0) {
    findings.push(
      `${analytics.influences.length} relação(ões) de influência estrutural foram identificadas como associação, não causalidade.`,
    )
  }

  if (analytics.predictions.length > 0) {
    findings.push(
      `${analytics.predictions.length} projeção(ões) foram produzidas e devem ser validadas longitudinalmente.`,
    )
  }

  if (analytics.recommendations.length > 0) {
    findings.push(
      `${analytics.recommendations.length} recomendação(ões) permanecem dependentes de decisão humana.`,
    )
  }

  if (findings.length === 0) {
    findings.push(
      'A análise permanece exploratória porque ainda não há resultados especializados suficientes para síntese substantiva.',
    )
  }

  return findings
}

function buildMethods(
  analytics: EducationalAnalyticsResult,
): string[] {
  const methods = [
    'validação e normalização do contrato analítico EIOS',
    'avaliação de qualidade, privacidade e ética',
  ]

  if (analytics.correlations.length > 0) {
    methods.push('análise correlacional')
  }

  if (
    analytics.patterns.length > 0 ||
    analytics.anomalies.length > 0
  ) {
    methods.push('detecção de padrões e anomalias')
  }

  if (analytics.influences.length > 0) {
    methods.push('análise estrutural de influência e rede')
  }

  if (analytics.predictions.length > 0) {
    methods.push('projeção estatística longitudinal')
  }

  return methods
}

function resolveCausalityStatus(
  analytics: EducationalAnalyticsResult,
): AnalyticsResearchResult['explanation']['causalityStatus'] {
  if (analytics.correlations.length > 0) {
    return 'correlation_only'
  }

  if (analytics.influences.length > 0) {
    return 'association_only'
  }

  return 'descriptive_only'
}

export function runResearchEngine(
  input: ResearchEngineInput,
): ResearchEngineResult {
  const generatedAt = nowIso()
  const analytics = input.analytics
  const warnings: string[] = []

  try {
    if (!analytics.researchEligibility.eligible) {
      return {
        success: false,
        researchResults: [],
        warnings: [
          'A análise não está elegível para uso em pesquisa segundo a governança atual.',
        ],
        errors: [],
        generatedAt,
        metadata: {
          engineName: ENGINE_NAME,
          engineVersion: ENGINE_VERSION,
          rulesetVersion: RULESET_VERSION,
          blockedByGovernance: true,
        },
      }
    }

    if (
      analytics.researchEligibility
        .anonymizationRequired &&
      !analytics.privacy.anonymized &&
      !analytics.privacy.pseudonymized
    ) {
      warnings.push(
        'A governança exige anonimização ou pseudonimização antes de uso formal em pesquisa.',
      )
    }

    if (
      analytics.researchEligibility
        .aggregationRequired &&
      !analytics.privacy.aggregated
    ) {
      warnings.push(
        'A governança exige agregação antes de uso formal em pesquisa.',
      )
    }

    const maximumQuestions =
      clampPositiveInteger(
        input.maximumQuestions,
        DEFAULT_MAX_QUESTIONS,
      )

    const maximumHypotheses =
      clampPositiveInteger(
        input.maximumHypotheses,
        DEFAULT_MAX_HYPOTHESES,
      )

    const questions =
      buildResearchQuestions(
        input,
        maximumQuestions,
      )

    const hypotheses =
      buildResearchHypotheses(
        input,
        maximumHypotheses,
      )

    if (
      hypotheses.length === 0 &&
      !analytics.researchEligibility
        .hypothesisGenerationAllowed
    ) {
      warnings.push(
        'A geração de hipóteses está desabilitada pela governança de pesquisa.',
      )
    }

    const variableIds =
      uniqueStrings([
        ...questions.flatMap(
          question => [
            ...question.primaryVariableIds,
            ...question.secondaryVariableIds,
          ],
        ),
        ...hypotheses.flatMap(
          hypothesis =>
            hypothesis.variableIds,
        ),
      ])

    const researchId =
      createStableId(
        'research-result',
        `${analytics.id}:${analytics.version.id}:${generatedAt}`,
      )

    const researchResult:
      AnalyticsResearchResult = {
      id: researchId,
      title:
        normalizeOptionalText(input.title) ??
        `Pesquisa exploratória — ${analytics.context.title}`,
      description:
        'Síntese de pesquisa gerada a partir de resultados analíticos do EIOS, sujeita à revisão metodológica, ética e profissional.',
      design:
        resolveDesign(input),
      questions,
      hypotheses,
      populationDescription:
        normalizeOptionalText(
          input.populationDescription,
        ) ??
        `Escopo analítico: ${analytics.context.scope}.`,
      sampleDescription:
        normalizeOptionalText(
          input.sampleDescription,
        ) ??
        `${analytics.observations.length} observação(ões) disponíveis no contrato analítico.`,
      sampleSize:
        analytics.observations.filter(
          observation =>
            !observation.excluded,
        ).length,
      inclusionCriteria:
        uniqueStrings(
          input.inclusionCriteria ?? [
            'observações autorizadas no contrato EIOS',
            'registros não excluídos pela validação analítica',
          ],
        ),
      exclusionCriteria:
        uniqueStrings(
          input.exclusionCriteria ?? [
            'registros excluídos por qualidade ou ausência de valor válido',
            'atributos bloqueados pelas regras de privacidade e ética',
          ],
        ),
      methods:
        buildMethods(analytics),
      variableIds,
      correlationIds:
        analytics.correlations.map(
          correlation => correlation.id,
        ),
      patternIds:
        analytics.patterns.map(
          pattern => pattern.id,
        ),
      influenceIds:
        analytics.influences.map(
          influence => influence.id,
        ),
      predictionIds:
        analytics.predictions.map(
          prediction => prediction.id,
        ),
      metricResults:
        analytics.metricResults,
      findings:
        buildFindings(analytics),
      limitations:
        uniqueStrings([
          'Associação e correlação não demonstram causalidade.',
          'Projeções não representam resultados futuros garantidos.',
          'Padrões e anomalias dependem da qualidade e cobertura dos dados.',
          'Resultados gerados por engine exigem validação humana.',
          ...analytics.explainability.limitations,
        ]),
      futureQuestions:
        questions
          .slice(0, 5)
          .map(question =>
            `Validar longitudinalmente: ${question.question}`,
          ),
      reproducibility: {
        reproducible: true,
        deterministic: true,
        randomSeed:
          analytics.configuration.randomSeed,
        datasetVersion:
          typeof analytics.metadata.datasetVersion === 'string'
            ? analytics.metadata.datasetVersion
            : null,
        queryVersion:
          typeof analytics.metadata.queryVersion === 'string'
            ? analytics.metadata.queryVersion
            : null,
        codeVersion:
          typeof analytics.metadata.codeVersion === 'string'
            ? analytics.metadata.codeVersion
            : null,
        engineVersion: ENGINE_VERSION,
        rulesetVersion: RULESET_VERSION,
        parameterSnapshot: {
          analysisId: analytics.id,
          analysisVersion:
            analytics.version.versionLabel,
          design:
            resolveDesign(input),
          maximumQuestions,
          maximumHypotheses,
        },
        sourceChecksums:
          uniqueStrings(
            analytics.sources.map(
              source => source.checksum,
            ),
          ),
        executedAt: generatedAt,
        metadata: {
          engineName: ENGINE_NAME,
        },
      },
      ethics: {
        ...analytics.ethics,
        ethicalWarnings:
          uniqueStrings([
            ...analytics.ethics.ethicalWarnings,
            'Uso em pesquisa requer interpretação e revisão humana.',
          ]),
        metadata: {
          ...analytics.ethics.metadata,
          inheritedFromAnalysisId:
            analytics.id,
        },
      },
      privacy: {
        ...analytics.privacy,
        metadata: {
          ...analytics.privacy.metadata,
          inheritedFromAnalysisId:
            analytics.id,
        },
      },
      explanation: {
        summary:
          'Questões, hipóteses e achados foram derivados de resultados analíticos previamente produzidos pelo EIOS.',
        reasons: [
          `${questions.length} questão(ões) de pesquisa foram geradas.`,
          `${hypotheses.length} hipótese(s) exploratória(s) foram geradas.`,
          `${analytics.observations.length} observação(ões) compõem a base analítica.`,
        ],
        rulesApplied: [
          'research_eligibility_check',
          'privacy_requirement_check',
          'hypothesis_generation_guard',
          'correlation_not_causation_guard',
          'human_review_requirement',
        ],
        variablesUsed: variableIds,
        sourceReferences:
          analytics.sources,
        assumptions: [
          'Os dados de origem foram autorizados para o escopo atual.',
          'As relações observadas são contextuais e podem mudar ao longo do tempo.',
        ],
        limitations: [
          'O engine não executa experimento ou quase-experimento.',
          'O engine não aprova protocolo ético.',
          'O engine não estabelece causalidade.',
        ],
        uncertaintyFactors: [
          ...analytics.dataQuality.warnings,
          ...warnings,
        ],
        alternativeExplanations: [
          'Variáveis não observadas podem explicar parte das relações detectadas.',
          'Mudanças contextuais e eventos externos podem alterar os resultados.',
        ],
        causalityStatus:
          resolveCausalityStatus(analytics),
        generatedAt,
        engineName: ENGINE_NAME,
        engineVersion: ENGINE_VERSION,
        metadata: {
          rulesetVersion: RULESET_VERSION,
        },
      },
      validationStatus: 'pending',
      reviewedBy: null,
      reviewedAt: null,
      metadata: {
        ...(input.metadata ?? {}),
        engineName: ENGINE_NAME,
        engineVersion: ENGINE_VERSION,
        rulesetVersion: RULESET_VERSION,
        sourceAnalysisId:
          analytics.id,
        requestedByUserId:
          input.requestedByUserId ??
          analytics.context.requestedByUserId,
        requiresHumanReview: true,
        causalInferencePerformed: false,
      },
    }

    return {
      success: true,
      researchResults: [
        researchResult,
      ],
      warnings:
        uniqueStrings(warnings),
      errors: [],
      generatedAt,
      metadata: {
        ...(input.metadata ?? {}),
        engineName: ENGINE_NAME,
        engineVersion: ENGINE_VERSION,
        rulesetVersion: RULESET_VERSION,
        researchResultCount: 1,
        questionCount:
          questions.length,
        hypothesisCount:
          hypotheses.length,
      },
    }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Falha desconhecida no Research Engine.'

    return {
      success: false,
      researchResults: [],
      warnings: [],
      errors: [message],
      generatedAt,
      metadata: {
        ...(input.metadata ?? {}),
        engineName: ENGINE_NAME,
        engineVersion: ENGINE_VERSION,
        rulesetVersion: RULESET_VERSION,
        failure: true,
      },
    }
  }
}

export function getResearchEngineInfo() {
  return {
    name: ENGINE_NAME,
    version: ENGINE_VERSION,
    rulesetVersion: RULESET_VERSION,
    mode: 'deterministic' as const,
    capabilities: [
      'research_questions',
      'exploratory_hypotheses',
      'research_synthesis',
      'reproducibility',
      'ethics_inheritance',
      'privacy_inheritance',
      'human_review',
    ],
    guarantees: [
      'causal_inference_not_performed',
      'human_review_required',
      'ethical_approval_not_assumed',
      'privacy_governance_preserved',
      'professional_autonomy_preserved',
    ],
    limitations: [
      'Não executa desenho experimental.',
      'Não substitui comitê de ética ou revisão metodológica.',
      'Não estabelece causalidade.',
      'Não acessa banco de dados.',
      'Não aplica RLS.',
    ],
  }
}
