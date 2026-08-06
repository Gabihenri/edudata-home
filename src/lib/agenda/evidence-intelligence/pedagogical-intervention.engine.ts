/**
 * EduData IA — EIOS
 * Capability 02: Pedagogical Copilot
 *
 * Motor determinístico inicial para geração de intervenções pedagógicas.
 *
 * Arquitetura:
 * Framework EDI
 * → EIOS
 * → Core Compartilhado
 * → Produtos Especializados
 *
 * Responsabilidades:
 * - validar entradas;
 * - normalizar dados;
 * - interpretar risco e prioridade;
 * - gerar objetivos;
 * - gerar plano de intervenção;
 * - gerar recomposição e inclusão;
 * - gerar perguntas diagnósticas;
 * - definir evidências esperadas;
 * - definir indicadores e critérios de sucesso;
 * - produzir cronograma;
 * - garantir revisão humana;
 * - preservar autonomia profissional;
 * - registrar versionamento, explicabilidade e rastreabilidade.
 *
 * Este arquivo não depende de React, Next.js, Supabase ou APIs externas.
 */

import type {
  GeneratePedagogicalInterventionInput,
  GeneratePedagogicalInterventionResult,
  PedagogicalAdaptation,
  PedagogicalDiagnosticQuestion,
  PedagogicalExpectedEvidence,
  PedagogicalHumanReview,
  PedagogicalInclusionDimension,
  PedagogicalIntervention,
  PedagogicalInterventionAction,
  PedagogicalInterventionAuditEvent,
  PedagogicalInterventionCheckpoint,
  PedagogicalInterventionDiagnostic,
  PedagogicalInterventionEngineMetadata,
  PedagogicalInterventionExplainability,
  PedagogicalInterventionId,
  PedagogicalInterventionIndicator,
  PedagogicalInterventionMethodology,
  PedagogicalInterventionObjective,
  PedagogicalInterventionPlan,
  PedagogicalInterventionPriority,
  PedagogicalInterventionResearchEligibility,
  PedagogicalInterventionResource,
  PedagogicalInterventionRiskLevel,
  PedagogicalInterventionSchedule,
  PedagogicalInterventionTraceability,
  PedagogicalInterventionVersion,
  PedagogicalMethodologyCategory,
  PedagogicalObjectiveType,
  PedagogicalRecompositionLevel,
  PedagogicalSuccessCriterion,
  PedagogicalTeacherDecision,
} from './pedagogical-intervention.types'

const ENGINE_NAME =
  'eios-pedagogical-copilot'

const ENGINE_VERSION =
  '1.0.0'

const RULESET_VERSION =
  'pedagogical-intervention-rules-1.0.0'

const FRAMEWORK_VERSION =
  'framework-edi-1.0.0'

const DEFAULT_TIMEZONE =
  'America/Sao_Paulo'

type ValidationResult = {
  valid: boolean
  errors: string[]
  warnings: string[]
}

type GenerationContext = {
  generatedAt: string
  interventionId: PedagogicalInterventionId
  versionId: string
  correlationId: string
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
          (
            value,
          ): value is string =>
            typeof value === 'string',
        )
        .map(value => value.trim())
        .filter(Boolean),
    ),
  )
}

function normalizeText(
  value: string | null | undefined,
  fallback = '',
): string {
  if (
    typeof value !== 'string' ||
    !value.trim()
  ) {
    return fallback
  }

  return value.trim()
}

function normalizeNullableText(
  value: string | null | undefined,
): string | null {
  const normalized =
    normalizeText(value)

  return normalized || null
}

function normalizeScore(
  value: number | null | undefined,
): number | null {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value)
  ) {
    return null
  }

  return Math.min(
    100,
    Math.max(0, value),
  )
}

function normalizeProbability(
  value: number | null | undefined,
): number | null {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value)
  ) {
    return null
  }

  if (value > 1) {
    return Math.min(
      1,
      Math.max(0, value / 100),
    )
  }

  return Math.min(
    1,
    Math.max(0, value),
  )
}

function slugify(
  value: string,
): string {
  return value
    .normalize('NFD')
    .replace(
      /[\u0300-\u036f]/g,
      '',
    )
    .toLowerCase()
    .replace(
      /[^a-z0-9]+/g,
      '-',
    )
    .replace(
      /^-+|-+$/g,
      '')
    .slice(0, 60)
}

function createId(
  prefix: string,
  correlationId: string,
  suffix?: string,
): string {
  const normalizedCorrelation =
    slugify(correlationId) ||
    'sem-correlacao'

  const normalizedSuffix =
    suffix
      ? `-${slugify(suffix)}`
      : ''

  return [
    prefix,
    normalizedCorrelation,
    normalizedSuffix,
  ]
    .join('')
    .slice(0, 120)
}

function addDays(
  isoDate: string,
  days: number,
): string {
  const date =
    new Date(isoDate)

  date.setUTCDate(
    date.getUTCDate() + days,
  )

  return date.toISOString()
}

function toIsoDate(
  isoDateTime: string,
): string {
  return isoDateTime.slice(0, 10)
}

function isValidIsoDate(
  value: string | null | undefined,
): boolean {
  if (!value) {
    return false
  }

  return !Number.isNaN(
    Date.parse(value),
  )
}

function getRiskWeight(
  level: PedagogicalInterventionRiskLevel,
): number {
  const weights:
    Record<
      PedagogicalInterventionRiskLevel,
      number
    > = {
      none: 0,
      low: 1,
      moderate: 2,
      high: 3,
      critical: 4,
      undetermined: 2,
    }

  return weights[level]
}

function getPriorityWeight(
  priority: PedagogicalInterventionPriority,
): number {
  const weights:
    Record<
      PedagogicalInterventionPriority,
      number
    > = {
      low: 0,
      moderate: 1,
      high: 2,
      urgent: 3,
      critical: 4,
    }

  return weights[priority]
}

function getDefaultPriority(
  diagnostic: PedagogicalInterventionDiagnostic,
): PedagogicalInterventionPriority {
  const riskLevel =
    diagnostic.risk.level

  if (
    riskLevel === 'critical' ||
    diagnostic.risk
      .requiresImmediateHumanAttention
  ) {
    return 'critical'
  }

  if (riskLevel === 'high') {
    return 'urgent'
  }

  if (riskLevel === 'moderate') {
    return 'high'
  }

  if (riskLevel === 'low') {
    return 'moderate'
  }

  if (
    diagnostic.requiresAdditionalEvidence
  ) {
    return 'moderate'
  }

  return 'low'
}

function resolvePriority(
  input:
    GeneratePedagogicalInterventionInput,
): PedagogicalInterventionPriority {
  const calculated =
    getDefaultPriority(
      input.diagnostic,
    )

  if (!input.preferredPriority) {
    return calculated
  }

  if (
    getPriorityWeight(
      input.preferredPriority,
    ) >=
    getPriorityWeight(calculated)
  ) {
    return input.preferredPriority
  }

  return calculated
}

function validateInput(
  input:
    GeneratePedagogicalInterventionInput,
): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (
    !normalizeText(
      input.correlationId,
    )
  ) {
    errors.push(
      'O correlationId é obrigatório.',
    )
  }

  if (
    !normalizeText(
      input.context.title,
    )
  ) {
    errors.push(
      'O título do contexto pedagógico é obrigatório.',
    )
  }

  if (
    !normalizeText(
      input.context.summary,
    )
  ) {
    errors.push(
      'O resumo do contexto pedagógico é obrigatório.',
    )
  }

  if (
    !normalizeText(
      input.diagnostic.problemStatement,
    )
  ) {
    errors.push(
      'A descrição do problema pedagógico é obrigatória.',
    )
  }

  if (
    !normalizeText(
      input.diagnostic
        .pedagogicalInterpretation,
    )
  ) {
    errors.push(
      'A interpretação pedagógica é obrigatória.',
    )
  }

  if (
    input.context.audience
      .targetIds.length === 0
  ) {
    warnings.push(
      'A intervenção não possui sujeitos ou grupos explicitamente vinculados.',
    )
  }

  if (
    input.context.links
      .evidenceIds.length === 0 &&
    input.diagnostic.sources
      .length === 0
  ) {
    warnings.push(
      'Nenhuma evidência ou fonte diagnóstica foi vinculada.',
    )
  }

  if (
    input.diagnostic
      .requiresAdditionalEvidence
  ) {
    warnings.push(
      'O diagnóstico informa necessidade de evidências adicionais.',
    )
  }

  if (
    input.privacy
      .containsSensitiveData &&
    !input.privacy.anonymized &&
    !input.privacy.pseudonymized
  ) {
    warnings.push(
      'Há dados sensíveis sem anonimização ou pseudonimização.',
    )
  }

  if (
    input.privacy
      .containsMinorData &&
    input.privacy.sensitivity ===
      'public'
  ) {
    errors.push(
      'Dados de menores não podem ser classificados como públicos.',
    )
  }

  if (
    input.context.audience
      .anonymized &&
    input.context.audience
      .targetIds.some(
        targetId =>
          targetId.includes('@'),
      )
  ) {
    warnings.push(
      'Os identificadores do público podem conter informação diretamente identificável.',
    )
  }

  if (
    input.diagnostic.generatedAt &&
    !isValidIsoDate(
      input.diagnostic.generatedAt,
    )
  ) {
    errors.push(
      'A data de geração do diagnóstico é inválida.',
    )
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

function normalizeDiagnostic(
  diagnostic:
    PedagogicalInterventionDiagnostic,
): PedagogicalInterventionDiagnostic {
  return {
    ...diagnostic,

    problemStatement:
      normalizeText(
        diagnostic.problemStatement,
      ),

    pedagogicalInterpretation:
      normalizeText(
        diagnostic
          .pedagogicalInterpretation,
      ),

    observedPatterns:
      uniqueStrings(
        diagnostic.observedPatterns,
      ),

    strengths:
      uniqueStrings(
        diagnostic.strengths,
      ),

    learningGaps:
      uniqueStrings(
        diagnostic.learningGaps,
      ),

    inclusionBarriers:
      uniqueStrings(
        diagnostic.inclusionBarriers,
      ),

    engagementFactors:
      uniqueStrings(
        diagnostic.engagementFactors,
      ),

    probableCauses:
      diagnostic.probableCauses.map(
        cause => ({
          ...cause,

          category:
            normalizeText(
              cause.category,
              'other',
            ),

          description:
            normalizeText(
              cause.description,
            ),

          probability:
            normalizeProbability(
              cause.probability,
            ),

          evidenceIds:
            uniqueStrings(
              cause.evidenceIds,
            ),

          validationNotes:
            normalizeNullableText(
              cause.validationNotes,
            ),
        }),
      ),

    sources:
      diagnostic.sources.map(
        source => ({
          ...source,

          description:
            normalizeText(
              source.description,
            ),

          sourceId:
            normalizeNullableText(
              source.sourceId,
            ),

          relevanceScore:
            normalizeScore(
              source.relevanceScore,
            ),

          reliabilityScore:
            normalizeScore(
              source.reliabilityScore,
            ),

          observedAt:
            isValidIsoDate(
              source.observedAt,
            )
              ? source.observedAt
              : null,

          metadata: {
            ...(source.metadata ?? {}),
          },
        }),
      ),

    risk: {
      ...diagnostic.risk,

      summary:
        normalizeText(
          diagnostic.risk.summary,
          'Risco pedagógico ainda não detalhado.',
        ),

      types:
        Array.from(
          new Set(
            diagnostic.risk.types,
          ),
        ),

      signals:
        uniqueStrings(
          diagnostic.risk.signals,
        ),

      protectiveFactors:
        uniqueStrings(
          diagnostic.risk
            .protectiveFactors,
        ),

      aggravatingFactors:
        uniqueStrings(
          diagnostic.risk
            .aggravatingFactors,
        ),

      probabilityScore:
        normalizeScore(
          diagnostic.risk
            .probabilityScore,
        ),

      impactScore:
        normalizeScore(
          diagnostic.risk
            .impactScore,
        ),

      urgencyScore:
        normalizeScore(
          diagnostic.risk
            .urgencyScore,
        ),

      limitations:
        uniqueStrings(
          diagnostic.risk.limitations,
        ),
    },

    confidenceScore:
      normalizeScore(
        diagnostic.confidenceScore,
      ),

    reliabilityScore:
      normalizeScore(
        diagnostic.reliabilityScore,
      ),

    evidenceSufficiencyScore:
      normalizeScore(
        diagnostic
          .evidenceSufficiencyScore,
      ),

    additionalEvidenceNeeded:
      uniqueStrings(
        diagnostic
          .additionalEvidenceNeeded,
      ),

    assumptions:
      uniqueStrings(
        diagnostic.assumptions,
      ),

    limitations:
      uniqueStrings(
        diagnostic.limitations,
      ),

    generatedAt:
      isValidIsoDate(
        diagnostic.generatedAt,
      )
        ? diagnostic.generatedAt
        : null,
  }
}

function determineRecompositionLevel(
  diagnostic:
    PedagogicalInterventionDiagnostic,
): PedagogicalRecompositionLevel {
  if (
    diagnostic.risk.level ===
      'critical' ||
    diagnostic.risk.level ===
      'high' ||
    diagnostic.learningGaps.length >= 4
  ) {
    return 'intensive'
  }

  if (
    diagnostic.risk.level ===
      'moderate' ||
    diagnostic.learningGaps.length >= 2
  ) {
    return 'targeted'
  }

  if (
    diagnostic.learningGaps.length > 0
  ) {
    return 'preventive'
  }

  return 'continuous'
}

function determineObjectiveTypes(
  diagnostic:
    PedagogicalInterventionDiagnostic,
): PedagogicalObjectiveType[] {
  const types:
    PedagogicalObjectiveType[] = []

  if (
    diagnostic.learningGaps.length > 0
  ) {
    types.push(
      'learning',
      'recomposition',
    )
  }

  if (
    diagnostic.inclusionBarriers
      .length > 0
  ) {
    types.push('inclusion')
  }

  if (
    diagnostic.engagementFactors
      .length > 0 ||
    diagnostic.risk.types.includes(
      'engagement',
    )
  ) {
    types.push('engagement')
  }

  if (
    diagnostic.risk.types.includes(
      'participation',
    )
  ) {
    types.push('participation')
  }

  if (
    diagnostic.risk.types.includes(
      'attendance',
    )
  ) {
    types.push('attendance')
  }

  if (
    diagnostic.risk.types.includes(
      'behavior',
    )
  ) {
    types.push('behavior')
  }

  if (
    diagnostic.risk.types.includes(
      'assessment',
    )
  ) {
    types.push('assessment')
  }

  if (
    diagnostic.risk.types.includes(
      'social_interaction',
    )
  ) {
    types.push('group_dynamics')
  }

  if (types.length === 0) {
    types.push('learning')
  }

  return Array.from(
    new Set(types),
  )
}

function getObjectiveTitle(
  type: PedagogicalObjectiveType,
): string {
  const titles:
    Record<
      PedagogicalObjectiveType,
      string
    > = {
      learning:
        'Avançar a aprendizagem identificada como prioritária',

      recomposition:
        'Recompor aprendizagens essenciais',

      inclusion:
        'Ampliar acesso, participação e inclusão',

      engagement:
        'Fortalecer o engajamento com a aprendizagem',

      participation:
        'Ampliar a participação nas atividades pedagógicas',

      attendance:
        'Fortalecer a continuidade e a frequência pedagógica',

      behavior:
        'Promover condições comportamentais favoráveis à aprendizagem',

      assessment:
        'Produzir evidências avaliativas mais consistentes',

      teacher_practice:
        'Aprimorar a prática pedagógica',

      group_dynamics:
        'Fortalecer as dinâmicas coletivas de aprendizagem',

      organizational:
        'Mobilizar condições organizacionais de apoio',

      other:
        'Atender ao objetivo pedagógico identificado',
    }

  return titles[type]
}

function getObjectiveDescription(
  type: PedagogicalObjectiveType,
  diagnostic:
    PedagogicalInterventionDiagnostic,
): string {
  if (
    type === 'learning' ||
    type === 'recomposition'
  ) {
    return diagnostic.learningGaps
      .length > 0
      ? `Atuar sobre as lacunas: ${diagnostic.learningGaps.join(
          '; ',
        )}.`
      : diagnostic
          .pedagogicalInterpretation
  }

  if (type === 'inclusion') {
    return diagnostic.inclusionBarriers
      .length > 0
      ? `Reduzir as barreiras: ${diagnostic.inclusionBarriers.join(
          '; ',
        )}.`
      : 'Garantir condições de acesso, participação e aprendizagem.'
  }

  if (
    type === 'engagement' ||
    type === 'participation'
  ) {
    return diagnostic.engagementFactors
      .length > 0
      ? `Atuar sobre os fatores: ${diagnostic.engagementFactors.join(
          '; ',
        )}.`
      : 'Ampliar o envolvimento ativo nas situações de aprendizagem.'
  }

  return diagnostic
    .pedagogicalInterpretation
}

function createObjectives(
  diagnostic:
    PedagogicalInterventionDiagnostic,
  priority:
    PedagogicalInterventionPriority,
  context:
    GenerationContext,
  input:
    GeneratePedagogicalInterventionInput,
): PedagogicalInterventionObjective[] {
  const types =
    determineObjectiveTypes(
      diagnostic,
    )

  return types.map(
    (
      type,
      index,
    ) => {
      const objectiveId =
        createId(
          'objective-',
          context.correlationId,
          `${index + 1}-${type}`,
        )

      return {
        id: objectiveId,

        type,

        title:
          getObjectiveTitle(type),

        description:
          getObjectiveDescription(
            type,
            diagnostic,
          ),

        rationale:
          diagnostic
            .pedagogicalInterpretation,

        timeHorizon:
          priority === 'critical' ||
          priority === 'urgent'
            ? 'immediate'
            : priority === 'high'
              ? 'short_term'
              : 'medium_term',

        priority,

        status: 'planned',

        targetValue:
          type === 'learning' ||
          type === 'recomposition'
            ? 'Evidenciar progressão em relação à linha de base.'
            : 'Evidenciar melhoria observável.',

        baselineValue:
          diagnostic
            .evidenceSufficiencyScore,

        unit:
          type === 'learning'
            ? 'evidência pedagógica'
            : null,

        learningObjectiveIds:
          uniqueStrings(
            input.context.links
              .learningObjectiveIds,
          ),

        skillIds:
          uniqueStrings(
            input.context.links.skillIds,
          ),

        competencyIds:
          uniqueStrings(
            input.context.links
              .competencyIds,
          ),

        indicatorIds: [
          createId(
            'indicator-',
            context.correlationId,
            `${index + 1}-${type}`,
          ),
        ],

        successCriterionIds: [
          createId(
            'criterion-',
            context.correlationId,
            `${index + 1}-${type}`,
          ),
        ],

        expectedBy:
          toIsoDate(
            addDays(
              context.generatedAt,
              priority === 'critical'
                ? 7
                : priority === 'urgent'
                  ? 14
                  : priority === 'high'
                    ? 30
                    : 45,
            ),
          ),

        metadata: {
          generatedBy:
            ENGINE_NAME,

          rulesetVersion:
            RULESET_VERSION,
        },
      }
    },
  )
}

function determineInclusionDimensions(
  diagnostic:
    PedagogicalInterventionDiagnostic,
): PedagogicalInclusionDimension[] {
  const dimensions:
    PedagogicalInclusionDimension[] =
      []

  for (
    const barrier of
    diagnostic.inclusionBarriers
  ) {
    const normalized =
      barrier.toLowerCase()

    if (
      normalized.includes(
        'acesso',
      )
    ) {
      dimensions.push('access')
    }

    if (
      normalized.includes(
        'particip',
      )
    ) {
      dimensions.push(
        'participation',
      )
    }

    if (
      normalized.includes(
        'comunica',
      )
    ) {
      dimensions.push(
        'communication',
      )
    }

    if (
      normalized.includes(
        'mobilidade',
      )
    ) {
      dimensions.push('mobility')
    }

    if (
      normalized.includes(
        'visual',
      ) ||
      normalized.includes(
        'audit',
      ) ||
      normalized.includes(
        'sensor',
      )
    ) {
      dimensions.push('sensory')
    }

    if (
      normalized.includes(
        'cognit',
      )
    ) {
      dimensions.push('cognitive')
    }

    if (
      normalized.includes(
        'lingu',
      )
    ) {
      dimensions.push('language')
    }

    if (
      normalized.includes(
        'digital',
      ) ||
      normalized.includes(
        'tecnolog',
      )
    ) {
      dimensions.push('digital')
    }

    if (
      normalized.includes(
        'avalia',
      )
    ) {
      dimensions.push('assessment')
    }
  }

  if (
    diagnostic.inclusionBarriers
      .length > 0 &&
    dimensions.length === 0
  ) {
    dimensions.push('other')
  }

  return Array.from(
    new Set(dimensions),
  )
}

function createAdaptations(
  diagnostic:
    PedagogicalInterventionDiagnostic,
  context:
    GenerationContext,
): PedagogicalAdaptation[] {
  return diagnostic
    .inclusionBarriers
    .map(
      (
        barrier,
        index,
      ) => ({
        id: createId(
          'adaptation-',
          context.correlationId,
          `${index + 1}`,
        ),

        type: 'instruction',

        title:
          `Adaptação para reduzir a barreira ${index + 1}`,

        description:
          `Adequar instruções, recursos, tempo ou forma de participação para reduzir: ${barrier}.`,

        rationale:
          'A adaptação busca ampliar acesso, participação e aprendizagem sem reduzir os objetivos pedagógicos essenciais.',

        targetBarrier:
          barrier,

        resources: [],

        responsibleIds: [],

        required: true,

        status: 'proposed',

        metadata: {
          generatedBy:
            ENGINE_NAME,
        },
      }),
    )
}

function createMethodologies(
  input:
    GeneratePedagogicalInterventionInput,
  diagnostic:
    PedagogicalInterventionDiagnostic,
  context:
    GenerationContext,
): PedagogicalInterventionMethodology[] {
  const requested =
    input.requiredMethodologies

  const inferred:
    PedagogicalMethodologyCategory[] =
      []

  if (
    diagnostic.learningGaps.length > 0
  ) {
    inferred.push(
      'guided_practice',
      'remediation',
      'formative_assessment',
    )
  }

  if (
    diagnostic.engagementFactors
      .length > 0
  ) {
    inferred.push(
      'active_learning',
      'collaborative_learning',
    )
  }

  if (
    diagnostic.inclusionBarriers
      .length > 0
  ) {
    inferred.push(
      'differentiated_instruction',
      'universal_design_for_learning',
    )
  }

  const categories =
    Array.from(
      new Set([
        ...requested,
        ...inferred,
      ]),
    )
      .filter(
        category =>
          !input.excludedApproaches
            .some(
              excluded =>
                excluded
                  .toLowerCase()
                  .includes(
                    category
                      .replaceAll(
                        '_',
                        ' ',
                      ),
                  ),
            ),
      )

  const finalCategories =
    categories.length > 0
      ? categories
      : [
          'guided_practice',
          'formative_assessment',
        ] satisfies PedagogicalMethodologyCategory[]

  return finalCategories.map(
    (
      category,
      index,
    ) => ({
      id: createId(
        'methodology-',
        context.correlationId,
        `${index + 1}-${category}`,
      ),

      category,

      name:
        category
          .split('_')
          .map(
            word =>
              word.charAt(0)
                .toUpperCase() +
              word.slice(1),
          )
          .join(' '),

      description:
        'Metodologia selecionada por regras pedagógicas do EIOS a partir do diagnóstico e das restrições informadas.',

      rationale:
        diagnostic
          .pedagogicalInterpretation,

      implementationGuidance: [
        'Explicitar o objetivo da atividade.',
        'Ativar conhecimentos prévios.',
        'Realizar mediação e acompanhamento formativo.',
        'Registrar evidências durante a execução.',
        'Adaptar a estratégia conforme a resposta dos estudantes.',
      ],

      expectedBenefits: [
        'Maior participação.',
        'Produção de evidências de aprendizagem.',
        'Possibilidade de ajuste pedagógico contínuo.',
      ],

      risksOrLimitations: [
        'A efetividade depende da adequação ao contexto real.',
        'A recomendação requer validação profissional.',
      ],

      resourceIds: [],

      adaptationIds: [],

      metadata: {
        generatedBy:
          ENGINE_NAME,

        rulesetVersion:
          RULESET_VERSION,
      },
    }),
  )
}

function createResources(
  input:
    GeneratePedagogicalInterventionInput,
  context:
    GenerationContext,
): PedagogicalInterventionResource[] {
  const available =
    uniqueStrings([
      ...input.context
        .availableResources,
      ...input.constraints,
    ])

  return available.map(
    (
      resource,
      index,
    ) => ({
      id: createId(
        'resource-',
        context.correlationId,
        `${index + 1}`,
      ),

      type: 'material',

      name: resource,

      description:
        'Recurso informado no contexto da intervenção.',

      url: null,

      required: false,

      available:
        input.context
          .availableResources
          .includes(resource),

      accessibilityNotes: null,

      metadata: {
        generatedBy:
          ENGINE_NAME,
      },
    }),
  )
}

function createDiagnosticQuestions(
  diagnostic:
    PedagogicalInterventionDiagnostic,
  objectives:
    PedagogicalInterventionObjective[],
  context:
    GenerationContext,
): PedagogicalDiagnosticQuestion[] {
  const questions: Array<{
    question: string
    purpose: string
    expectedEvidence: string[]
  }> = []

  for (
    const gap of
    diagnostic.learningGaps
  ) {
    questions.push({
      question:
        `O que o estudante ou grupo já consegue explicar, representar ou aplicar sobre: ${gap}?`,

      purpose:
        'Identificar conhecimentos consolidados, conhecimentos parciais e lacunas específicas.',

      expectedEvidence: [
        'Explicação oral ou escrita.',
        'Resolução de uma situação diagnóstica.',
        'Registro do raciocínio utilizado.',
      ],
    })
  }

  for (
    const barrier of
    diagnostic.inclusionBarriers
  ) {
    questions.push({
      question:
        `Quais condições dificultam o acesso ou a participação diante da barreira: ${barrier}?`,

      purpose:
        'Validar a barreira identificada e orientar adaptações pedagógicas.',

      expectedEvidence: [
        'Observação pedagógica.',
        'Relato profissional.',
        'Participação em atividade adaptada.',
      ],
    })
  }

  if (questions.length === 0) {
    questions.push({
      question:
        'Quais conhecimentos, estratégias e dificuldades aparecem quando o estudante ou grupo realiza uma tarefa relacionada ao objetivo?',

      purpose:
        'Produzir uma linha de base diagnóstica antes da intervenção.',

      expectedEvidence: [
        'Produção inicial.',
        'Observação do processo.',
        'Justificativa da resposta.',
      ],
    })
  }

  return questions.map(
    (
      item,
      index,
    ) => ({
      id: createId(
        'question-',
        context.correlationId,
        `${index + 1}`,
      ),

      type: 'open',

      question: item.question,

      purpose: item.purpose,

      relatedObjectiveIds:
        objectives.map(
          objective =>
            objective.id,
        ),

      expectedEvidence:
        item.expectedEvidence,

      interpretationGuidance: [
        'Não analisar apenas acerto ou erro.',
        'Observar estratégias, justificativas e padrões.',
        'Registrar diferenças entre sujeitos ou grupos.',
        'Evitar conclusões sem evidências suficientes.',
      ],

      accessibilityAdaptations: [
        'Permitir diferentes formas de resposta.',
        'Adequar linguagem, tempo e recursos quando necessário.',
      ],

      order: index + 1,

      required: true,

      metadata: {
        generatedBy:
          ENGINE_NAME,
      },
    }),
  )
}

function createExpectedEvidence(
  objectives:
    PedagogicalInterventionObjective[],
  input:
    GeneratePedagogicalInterventionInput,
  context:
    GenerationContext,
): PedagogicalExpectedEvidence[] {
  return objectives.map(
    (
      objective,
      index,
    ) => ({
      id: createId(
        'expected-evidence-',
        context.correlationId,
        `${index + 1}`,
      ),

      type:
        objective.type ===
          'assessment'
          ? 'assessment_result'
          : objective.type ===
                'participation' ||
              objective.type ===
                'engagement'
            ? 'participation_record'
            : 'student_production',

      title:
        `Evidência esperada — ${objective.title}`,

      description:
        'Registro que permita comparar a situação inicial com os resultados após a intervenção.',

      purpose:
        `Avaliar o avanço relacionado ao objetivo: ${objective.title}.`,

      collectionMethod:
        'Registro pedagógico com produção, observação e devolutiva formativa.',

      frequency:
        'each_checkpoint',

      responsibleIds:
        uniqueStrings([
          input.requestedByUserId,
          input.context.links
            .teacherId,
        ]),

      objectiveIds: [
        objective.id,
      ],

      actionIds: [
        createId(
          'action-',
          context.correlationId,
          `${index + 1}`,
        ),
      ],

      indicatorIds:
        objective.indicatorIds,

      expectedBy:
        addDays(
          context.generatedAt,
          30,
        ),

      required: true,

      anonymizationRequired:
        input.privacy
          .containsSensitiveData ||
        input.privacy
          .containsMinorData,

      aggregationRequired:
        input.context.audience
          .aggregated,

      validationCriteria: [
        'Possuir relação explícita com o objetivo.',
        'Conter data e contexto de produção.',
        'Permitir comparação com a linha de base.',
        'Ser validada pelo professor.',
      ],

      metadata: {
        generatedBy:
          ENGINE_NAME,
      },
    }),
  )
}

function createIndicators(
  objectives:
    PedagogicalInterventionObjective[],
  expectedEvidence:
    PedagogicalExpectedEvidence[],
  diagnostic:
    PedagogicalInterventionDiagnostic,
  context:
    GenerationContext,
): PedagogicalInterventionIndicator[] {
  return objectives.map(
    (
      objective,
      index,
    ) => {
      const evidence =
        expectedEvidence[index]

      return {
        id:
          objective.indicatorIds[0] ??
          createId(
            'indicator-',
            context.correlationId,
            `${index + 1}`,
          ),

        name:
          `Progresso — ${objective.title}`,

        description:
          'Indicador de acompanhamento da evolução entre a linha de base e as evidências produzidas durante a intervenção.',

        type: 'mixed',

        direction: 'increase',

        aggregation:
          objective.type ===
            'group_dynamics'
            ? 'group'
            : 'individual',

        unit:
          'nível de progresso',

        baselineValue:
          diagnostic
            .evidenceSufficiencyScore,

        targetValue:
          'Evolução observável e validada pelo professor.',

        currentValue: null,

        minimumAcceptableValue:
          'Evidência de progresso parcial.',

        measurementMethod:
          'Comparação pedagógica entre evidência inicial, checkpoints e evidência final.',

        dataSource:
          'Evidências registradas e validação profissional.',

        objectiveIds: [
          objective.id,
        ],

        actionIds: [
          createId(
            'action-',
            context.correlationId,
            `${index + 1}`,
          ),
        ],

        evidenceExpectationIds:
          evidence
            ? [evidence.id]
            : [],

        measuredAt: null,

        nextMeasurementAt:
          addDays(
            context.generatedAt,
            14,
          ),

        metadata: {
          generatedBy:
            ENGINE_NAME,
        },
      }
    },
  )
}

function createSuccessCriteria(
  objectives:
    PedagogicalInterventionObjective[],
  expectedEvidence:
    PedagogicalExpectedEvidence[],
  context:
    GenerationContext,
): PedagogicalSuccessCriterion[] {
  return objectives.map(
    (
      objective,
      index,
    ) => {
      const evidence =
        expectedEvidence[index]

      return {
        id:
          objective
            .successCriterionIds[0] ??
          createId(
            'criterion-',
            context.correlationId,
            `${index + 1}`,
          ),

        level: 'expected',

        title:
          `Critério de sucesso — ${objective.title}`,

        description:
          'O objetivo será considerado alcançado quando houver evidências consistentes de progresso, validadas profissionalmente.',

        measurementMethod:
          'Triangulação entre produção, observação, indicador e análise docente.',

        targetValue:
          'Progresso adequado em relação à linha de base.',

        observedValue: null,

        status: 'not_evaluated',

        objectiveIds: [
          objective.id,
        ],

        indicatorIds:
          objective.indicatorIds,

        evidenceExpectationIds:
          evidence
            ? [evidence.id]
            : [],

        evaluationNotes: null,

        metadata: {
          generatedBy:
            ENGINE_NAME,
        },
      }
    },
  )
}

function createActions(
  objectives:
    PedagogicalInterventionObjective[],
  methodologies:
    PedagogicalInterventionMethodology[],
  expectedEvidence:
    PedagogicalExpectedEvidence[],
  diagnosticQuestions:
    PedagogicalDiagnosticQuestion[],
  resources:
    PedagogicalInterventionResource[],
  adaptations:
    PedagogicalAdaptation[],
  priority:
    PedagogicalInterventionPriority,
  context:
    GenerationContext,
): PedagogicalInterventionAction[] {
  return objectives.map(
    (
      objective,
      index,
    ) => {
      const plannedStartAt =
        addDays(
          context.generatedAt,
          index * 2,
        )

      const plannedEndAt =
        addDays(
          plannedStartAt,
          priority === 'critical'
            ? 5
            : 10,
        )

      return {
        id: createId(
          'action-',
          context.correlationId,
          `${index + 1}`,
        ),

        type:
          objective.type ===
            'recomposition'
            ? 'recomposition'
            : objective.type ===
                'inclusion'
              ? 'inclusion'
              : objective.type ===
                  'assessment'
                ? 'assessment'
                : 'instruction',

        title:
          `Ação pedagógica — ${objective.title}`,

        description:
          objective.description,

        rationale:
          objective.rationale,

        priority,

        executionStatus:
          'not_started',

        sequence: index + 1,

        responsibleRoles: [
          'teacher',
        ],

        responsibleIds: [],

        objectiveIds: [
          objective.id,
        ],

        methodologyIds:
          methodologies.map(
            methodology =>
              methodology.id,
          ),

        resourceIds:
          resources.map(
            resource =>
              resource.id,
          ),

        adaptationIds:
          adaptations.map(
            adaptation =>
              adaptation.id,
          ),

        diagnosticQuestionIds:
          diagnosticQuestions.map(
            question =>
              question.id,
          ),

        expectedEvidenceIds:
          expectedEvidence[index]
            ? [
                expectedEvidence[
                  index
                ].id,
              ]
            : [],

        indicatorIds:
          objective.indicatorIds,

        plannedStartAt,

        plannedEndAt,

        actualStartAt: null,

        actualEndAt: null,

        estimatedDurationMinutes:
          50,

        teacherInstructions: [
          'Apresentar o objetivo da ação.',
          'Aplicar a estratégia considerando o contexto e as adaptações necessárias.',
          'Observar processos, não apenas resultados finais.',
          'Registrar evidências e decisões pedagógicas.',
          'Interromper ou adaptar a ação caso ocorram efeitos indesejados.',
        ],

        studentInstructions: [
          'Participar da atividade proposta.',
          'Explicar estratégias e raciocínios.',
          'Registrar dúvidas e aprendizados.',
        ],

        implementationNotes: [],

        completionNotes: null,

        metadata: {
          generatedBy:
            ENGINE_NAME,

          rulesetVersion:
            RULESET_VERSION,
        },
      }
    },
  )
}

function createCheckpoints(
  objectives:
    PedagogicalInterventionObjective[],
  actions:
    PedagogicalInterventionAction[],
  expectedEvidence:
    PedagogicalExpectedEvidence[],
  context:
    GenerationContext,
): PedagogicalInterventionCheckpoint[] {
  const checkpointDays = [
    0,
    14,
    30,
  ]

  const checkpointTypes =
    [
      'diagnostic',
      'monitoring',
      'final_evaluation',
    ] as const

  return checkpointDays.map(
    (
      days,
      index,
    ) => ({
      id: createId(
        'checkpoint-',
        context.correlationId,
        `${index + 1}`,
      ),

      type:
        checkpointTypes[index],

      title:
        index === 0
          ? 'Checkpoint diagnóstico'
          : index === 1
            ? 'Checkpoint de acompanhamento'
            : 'Checkpoint de avaliação',

      description:
        index === 0
          ? 'Registrar a linha de base antes da execução.'
          : index === 1
            ? 'Verificar progresso, dificuldades e necessidade de ajustes.'
            : 'Avaliar resultados, efetividade e continuidade.',

      status: 'pending',

      plannedAt:
        addDays(
          context.generatedAt,
          days,
        ),

      completedAt: null,

      responsibleIds: [],

      actionIds:
        actions.map(
          action =>
            action.id,
        ),

      objectiveIds:
        objectives.map(
          objective =>
            objective.id,
        ),

      indicatorIds:
        objectives.flatMap(
          objective =>
            objective.indicatorIds,
        ),

      evidenceExpectationIds:
        expectedEvidence.map(
          evidence =>
            evidence.id,
        ),

      findings: [],

      decisions: [],

      nextActions: [],

      notes: null,

      metadata: {
        generatedBy:
          ENGINE_NAME,
      },
    }),
  )
}

function createPlan(
  input:
    GeneratePedagogicalInterventionInput,
  diagnostic:
    PedagogicalInterventionDiagnostic,
  priority:
    PedagogicalInterventionPriority,
  objectives:
    PedagogicalInterventionObjective[],
  context:
    GenerationContext,
): {
  plan: PedagogicalInterventionPlan
  expectedEvidence:
    PedagogicalExpectedEvidence[]
  indicators:
    PedagogicalInterventionIndicator[]
  successCriteria:
    PedagogicalSuccessCriterion[]
  schedule:
    PedagogicalInterventionSchedule
} {
  const methodologies =
    createMethodologies(
      input,
      diagnostic,
      context,
    )

  const resources =
    createResources(
      input,
      context,
    )

  const adaptations =
    createAdaptations(
      diagnostic,
      context,
    )

  const diagnosticQuestions =
    createDiagnosticQuestions(
      diagnostic,
      objectives,
      context,
    )

  const expectedEvidence =
    createExpectedEvidence(
      objectives,
      input,
      context,
    )

  const indicators =
    createIndicators(
      objectives,
      expectedEvidence,
      diagnostic,
      context,
    )

  const successCriteria =
    createSuccessCriteria(
      objectives,
      expectedEvidence,
      context,
    )

  const actions =
    createActions(
      objectives,
      methodologies,
      expectedEvidence,
      diagnosticQuestions,
      resources,
      adaptations,
      priority,
      context,
    )

  const checkpoints =
    createCheckpoints(
      objectives,
      actions,
      expectedEvidence,
      context,
    )

  const recompositionLevel =
    determineRecompositionLevel(
      diagnostic,
    )

  const inclusionDimensions =
    determineInclusionDimensions(
      diagnostic,
    )

  const plan:
    PedagogicalInterventionPlan = {
    summary:
      `Plano gerado para responder ao diagnóstico: ${diagnostic.problemStatement}`,

    rationale:
      diagnostic
        .pedagogicalInterpretation,

    guidingPrinciples: [
      'Decisão pedagógica baseada em evidências.',
      'Inclusão e acessibilidade.',
      'Autonomia profissional.',
      'Acompanhamento contínuo.',
      'Explicabilidade e rastreabilidade.',
    ],

    objectives,

    actions,

    recomposition: {
      enabled:
        diagnostic.learningGaps
          .length > 0,

      level:
        diagnostic.learningGaps
          .length > 0
          ? recompositionLevel
          : null,

      identifiedPrerequisites:
        uniqueStrings(
          diagnostic
            .additionalEvidenceNeeded,
        ),

      essentialKnowledge:
        uniqueStrings([
          ...input.context.links
            .learningObjectiveIds,
          ...input.context.links
            .skillIds,
          ...input.context.links
            .competencyIds,
        ]),

      learningGaps:
        diagnostic.learningGaps,

      sequence: [
        'Realizar diagnóstico inicial.',
        'Retomar conhecimentos essenciais.',
        'Aplicar prática guiada.',
        'Oferecer devolutiva formativa.',
        'Verificar consolidação.',
      ],

      recoveryActivities:
        diagnostic.learningGaps
          .map(
            gap =>
              `Atividade focalizada de recuperação sobre: ${gap}.`,
          ),

      reinforcementActivities: [
        'Prática guiada com variação progressiva da complexidade.',
        'Revisão com devolutiva imediata.',
      ],

      consolidationActivities: [
        'Aplicação do conhecimento em nova situação.',
        'Produção autoral ou resolução justificada.',
      ],

      assessmentApproach: [
        'Avaliação diagnóstica.',
        'Acompanhamento formativo.',
        'Comparação entre linha de base e resultado final.',
      ],

      expectedDuration:
        recompositionLevel ===
          'intensive'
          ? '4 a 8 semanas'
          : recompositionLevel ===
              'targeted'
            ? '2 a 4 semanas'
            : '1 a 3 semanas',

      notes:
        'A duração deve ser ajustada pelo professor conforme as evidências produzidas.',
    },

    inclusion: {
      enabled:
        diagnostic
          .inclusionBarriers
          .length > 0,

      dimensions:
        inclusionDimensions,

      identifiedBarriers:
        diagnostic
          .inclusionBarriers,

      accessibilityNeeds:
        diagnostic
          .inclusionBarriers,

      participationSupports: [
        'Oferecer diferentes formas de participação.',
        'Garantir instruções claras e verificáveis.',
        'Permitir tempo e mediação adequados.',
      ],

      differentiatedApproaches: [
        'Variar linguagem, recursos e formas de registro.',
        'Organizar agrupamentos pedagógicos flexíveis.',
        'Adequar complexidade sem reduzir o objetivo essencial.',
      ],

      universalDesignStrategies: [
        'Apresentar informações em múltiplos formatos.',
        'Permitir múltiplas formas de expressão.',
        'Promover diferentes formas de engajamento.',
      ],

      adaptations,

      safeguardingNotes: [
        'Não expor diagnósticos individuais ao grupo.',
        'Não utilizar a intervenção para rotular estudantes.',
        'Preservar confidencialidade e dignidade.',
      ],

      requiresSpecializedHumanReview:
        diagnostic
          .inclusionBarriers
          .length > 0 &&
        (
          input.privacy
            .containsSensitiveData ||
          diagnostic.risk.level ===
            'high' ||
          diagnostic.risk.level ===
            'critical'
        ),

      reviewerRole:
        diagnostic
          .inclusionBarriers
          .length > 0
          ? 'specialized_professional'
          : null,
    },

    methodologies,

    resources,

    diagnosticQuestions,

    differentiationStrategies: [
      'Utilizar agrupamentos flexíveis.',
      'Variar suporte e mediação.',
      'Oferecer diferentes formas de produção.',
      'Ajustar ritmo e complexidade conforme as evidências.',
    ],

    teacherSupportRecommendations: [
      'Validar o diagnóstico antes de executar o plano.',
      'Selecionar apenas estratégias adequadas ao contexto.',
      'Registrar adaptações e decisões.',
      'Reavaliar o plano a cada checkpoint.',
    ],

    organizationalSupportRecommendations: [
      'Garantir tempo para planejamento e acompanhamento.',
      'Disponibilizar recursos acessíveis.',
      'Apoiar articulação entre profissionais quando necessário.',
    ],

    risksAndMitigations: [
      'Risco de generalização indevida: validar individualmente ou por subgrupo.',
      'Risco de rotulação: utilizar linguagem pedagógica e não determinista.',
      'Risco de baixa efetividade: monitorar e adaptar durante a execução.',
      'Risco de exposição: aplicar regras de privacidade e acesso.',
    ],

    alternatives: [
      'Reformular o diagnóstico.',
      'Coletar novas evidências.',
      'Reduzir o escopo da intervenção.',
      'Encaminhar para análise pedagógica especializada.',
    ],

    expectedDuration:
      priority === 'critical'
        ? 'Até 2 semanas para primeira avaliação'
        : priority === 'urgent'
          ? '2 a 4 semanas'
          : '4 a 8 semanas',
  }

  const schedule:
    PedagogicalInterventionSchedule = {
    plannedStartAt:
      context.generatedAt,

    plannedEndAt:
      addDays(
        context.generatedAt,
        priority === 'critical'
          ? 14
          : priority === 'urgent'
            ? 30
            : 60,
      ),

    actualStartAt: null,

    actualEndAt: null,

    timezone:
      DEFAULT_TIMEZONE,

    recurrence: null,

    checkpoints,
  }

  return {
    plan,
    expectedEvidence,
    indicators,
    successCriteria,
    schedule,
  }
}

function shouldRequireHumanReview(
  input:
    GeneratePedagogicalInterventionInput,
  diagnostic:
    PedagogicalInterventionDiagnostic,
): boolean {
  return (
    input.requiredHumanReview ||
    input.privacy
      .containsSensitiveData ||
    input.privacy
      .containsMinorData ||
    diagnostic.risk.level ===
      'high' ||
    diagnostic.risk.level ===
      'critical' ||
    diagnostic.risk
      .requiresImmediateHumanAttention ||
    diagnostic
      .requiresAdditionalEvidence ||
    diagnostic.probableCauses.some(
      cause =>
        cause
          .requiresHumanValidation &&
        !cause.validatedByHuman,
    )
  )
}

function createHumanReview(
  required: boolean,
  generatedAt: string,
): PedagogicalHumanReview {
  return {
    required,

    status:
      required
        ? 'pending'
        : 'not_required',

    reviewerId: null,

    reviewerRole:
      required
        ? 'teacher'
        : null,

    requestedAt:
      required
        ? generatedAt
        : null,

    startedAt: null,

    completedAt: null,

    summary: null,

    comments: [],

    requestedChanges: [],

    approvedElements: [],

    rejectedElements: [],

    limitationsAcknowledged:
      false,

    professionalResponsibilityConfirmed:
      false,
  }
}

function createTeacherDecision():
  PedagogicalTeacherDecision {
  return {
    decision: 'pending',

    teacherId: null,

    decidedAt: null,

    rationale: null,

    adaptations: [],

    rejectedRecommendations: [],

    acceptedRecommendations: [],

    professionalNotes: [],

    requiresNewVersion: false,

    autonomyConfirmed: false,
  }
}

function createExplainability(
  diagnostic:
    PedagogicalInterventionDiagnostic,
  priority:
    PedagogicalInterventionPriority,
  input:
    GeneratePedagogicalInterventionInput,
): PedagogicalInterventionExplainability {
  return {
    summary:
      'A intervenção foi gerada por regras determinísticas do EIOS a partir do contexto, diagnóstico, risco, lacunas, barreiras de inclusão, restrições e preferências informadas.',

    recommendationReasons: [
      {
        id:
          `reason-priority-${priority}`,

        recommendation:
          `Prioridade definida como ${priority}.`,

        rationale:
          `A prioridade foi derivada do risco ${diagnostic.risk.level}, da urgência, da suficiência das evidências e da necessidade de revisão humana.`,

        sourceIds:
          diagnostic.sources
            .map(
              source =>
                source.sourceId,
            )
            .filter(
              (
                sourceId,
              ): sourceId is string =>
                Boolean(sourceId),
            ),

        evidenceIds:
          input.context.links
            .evidenceIds,

        ruleIds: [
          'priority-by-risk',
          'human-review-for-sensitive-or-high-risk',
        ],

        modelFactors: [
          diagnostic.risk.level,
          ...diagnostic.risk.types,
        ],

        confidenceScore:
          diagnostic.confidenceScore,

        limitations:
          diagnostic.limitations,
      },
    ],

    evidenceUsed:
      uniqueStrings([
        ...input.context.links
          .evidenceIds,
        ...diagnostic.sources
          .map(
            source =>
              source.sourceId,
          ),
      ]),

    evidenceNotUsed: [],

    assumptions:
      diagnostic.assumptions,

    limitations:
      uniqueStrings([
        ...diagnostic.limitations,
        ...diagnostic.risk
          .limitations,
        'A primeira versão do motor utiliza regras determinísticas e não substitui a análise profissional.',
      ]),

    uncertaintyFactors:
      uniqueStrings([
        diagnostic
          .requiresAdditionalEvidence
          ? 'Existem evidências adicionais necessárias.'
          : null,

        diagnostic.confidenceScore ===
          null ||
        diagnostic.confidenceScore ===
          undefined
          ? 'A confiança diagnóstica não foi informada.'
          : null,

        diagnostic
          .evidenceSufficiencyScore ===
          null ||
        diagnostic
          .evidenceSufficiencyScore ===
          undefined
          ? 'A suficiência das evidências não foi pontuada.'
          : null,
      ]),

    alternativeInterpretations: [
      'O padrão observado pode ser circunstancial.',
      'As causas prováveis podem mudar após novas evidências.',
      'Diferentes subgrupos podem demandar intervenções distintas.',
    ],

    humanValidationPoints: [
      'Validação do diagnóstico.',
      'Adequação dos objetivos.',
      'Adequação das metodologias.',
      'Adequação das adaptações de inclusão.',
      'Viabilidade do cronograma.',
      'Decisão final do professor.',
    ],
  }
}

function createResearchEligibility(
  input:
    GeneratePedagogicalInterventionInput,
): PedagogicalInterventionResearchEligibility {
  const requested =
    input.researchEligibility ?? {}

  const privacyAllowsResearch =
    (
      input.privacy.anonymized ||
      input.privacy
        .pseudonymized
    ) &&
    !input.privacy.prohibitedUses
      .some(
        prohibitedUse =>
          prohibitedUse
            .toLowerCase()
            .includes('pesquisa'),
      )

  return {
    eligible:
      requested.eligible ??
      privacyAllowsResearch,

    anonymizationRequired:
      requested
        .anonymizationRequired ??
      true,

    aggregationRequired:
      requested
        .aggregationRequired ??
      input.context.audience
        .aggregated,

    longitudinalUseAllowed:
      requested
        .longitudinalUseAllowed ??
      privacyAllowsResearch,

    correlationUseAllowed:
      requested
        .correlationUseAllowed ??
      privacyAllowsResearch,

    groupAnalysisAllowed:
      requested
        .groupAnalysisAllowed ??
      (
        privacyAllowsResearch &&
        input.context.audience
          .aggregated
      ),

    externalEventAnalysisAllowed:
      requested
        .externalEventAnalysisAllowed ??
      false,

    zoneInfluenceAnalysisAllowed:
      requested
        .zoneInfluenceAnalysisAllowed ??
      false,

    hypothesisGenerationAllowed:
      requested
        .hypothesisGenerationAllowed ??
      privacyAllowsResearch,

    humanSubjectsReviewRequired:
      requested
        .humanSubjectsReviewRequired ??
      (
        input.privacy
          .containsSensitiveData ||
        input.privacy
          .containsMinorData
      ),

    restrictions:
      uniqueStrings([
        ...(requested.restrictions ??
          []),

        'Não utilizar dados diretamente identificáveis.',

        input.privacy
          .containsSensitiveData
          ? 'Dados sensíveis exigem governança reforçada.'
          : null,

        input.privacy
          .containsMinorData
          ? 'Dados de menores exigem proteção específica.'
          : null,
      ]),

    notes:
      requested.notes ??
      'A elegibilidade deve ser novamente validada antes de qualquer estudo.',
  }
}

function createEngineMetadata(
  generatedAt: string,
  requiresHumanReview: boolean,
  warnings: string[],
): PedagogicalInterventionEngineMetadata {
  return {
    name:
      ENGINE_NAME,

    version:
      ENGINE_VERSION,

    mode:
      'rules',

    modelName: null,

    provider:
      'EduData IA',

    promptVersion: null,

    rulesetVersion:
      RULESET_VERSION,

    frameworkVersion:
      FRAMEWORK_VERSION,

    generatedAt,

    processingDurationMs: null,

    confidenceScore: null,

    reliabilityScore: null,

    requiresHumanReview,

    warnings,

    limitations: [
      'Motor determinístico inicial.',
      'Não substitui validação profissional.',
      'Não realiza diagnóstico clínico.',
      'Não deve ser utilizado para decisões automatizadas de alto impacto.',
    ],

    metadata: {
      capability:
        'pedagogical_copilot',

      architecture:
        'Framework EDI → EIOS → Core Compartilhado → Produtos Especializados',
    },
  }
}

function createVersion(
  context:
    GenerationContext,
): PedagogicalInterventionVersion {
  return {
    id:
      context.versionId,

    interventionId:
      context.interventionId,

    versionNumber: 1,

    versionLabel: '1.0',

    status: 'current',

    previousVersionId: null,

    parentVersionId: null,

    createdAt:
      context.generatedAt,

    createdBy: null,

    reason:
      'Geração inicial da intervenção pedagógica.',

    changeSummary: [
      'Criação do diagnóstico normalizado.',
      'Criação dos objetivos.',
      'Criação do plano de intervenção.',
      'Criação do cronograma.',
      'Criação dos critérios de sucesso.',
      'Criação da governança e rastreabilidade.',
    ],

    changedFields: [
      'diagnostic',
      'plan',
      'expectedEvidence',
      'indicators',
      'successCriteria',
      'schedule',
      'humanReview',
      'teacherDecision',
      'traceability',
    ],

    engineName:
      ENGINE_NAME,

    engineVersion:
      ENGINE_VERSION,

    modelName: null,

    promptVersion: null,

    rulesetVersion:
      RULESET_VERSION,

    frameworkVersion:
      FRAMEWORK_VERSION,
  }
}

function createAuditEvent(
  context:
    GenerationContext,
  requiresHumanReview: boolean,
): PedagogicalInterventionAuditEvent {
  return {
    id: createId(
      'event-',
      context.correlationId,
      'generated',
    ),

    type: 'generated',

    occurredAt:
      context.generatedAt,

    actorType: 'engine',

    actorId:
      ENGINE_NAME,

    source:
      'eios_engine',

    product:
      'eios_core',

    capability:
      'pedagogical_copilot',

    previousStatus: null,

    newStatus:
      requiresHumanReview
        ? 'awaiting_teacher_decision'
        : 'generated',

    reason:
      'Intervenção criada pelo motor determinístico do Pedagogical Copilot.',

    changedFields: [
      'status',
      'diagnostic',
      'plan',
      'schedule',
      'version',
    ],

    metadata: {
      engineVersion:
        ENGINE_VERSION,

      requiresHumanReview,
    },
  }
}

function createTraceability(
  input:
    GeneratePedagogicalInterventionInput,
  context:
    GenerationContext,
  auditEvent:
    PedagogicalInterventionAuditEvent,
): PedagogicalInterventionTraceability {
  return {
    correlationId:
      context.correlationId,

    causationId: null,

    requestId: null,

    sessionId: null,

    sourceEvidenceIds:
      uniqueStrings(
        input.context.links
          .evidenceIds,
      ),

    sourceAnalysisIds:
      uniqueStrings(
        input.diagnostic.sources
          .filter(
            source =>
              source.sourceType ===
                'analytics' ||
              source.sourceType ===
                'human_review',
          )
          .map(
            source =>
              source.sourceId,
          ),
      ),

    sourceIntelligenceRunIds:
      uniqueStrings(
        input.diagnostic.sources
          .filter(
            source =>
              source.sourceType ===
              'analytics',
          )
          .map(
            source =>
              source.sourceId,
          ),
      ),

    sourceInterventionIds:
      uniqueStrings(
        input.context.links
          .relatedInterventionIds,
      ),

    generatedByCapability:
      'pedagogical_copilot',

    consumedByCapabilities: [
      'learning_graph',
      'educational_analytics',
      'organizational_intelligence',
      'research_intelligence',
    ],

    products: [
      input.sourceProduct,
      'eios_core',
    ],

    auditEvents: [
      auditEvent,
    ],
  }
}

function createGenerationContext(
  input:
    GeneratePedagogicalInterventionInput,
): GenerationContext {
  const generatedAt =
    nowIso()

  const correlationId =
    normalizeText(
      input.correlationId,
      `correlation-${generatedAt}`,
    )

  const interventionId =
    createId(
      'intervention-',
      correlationId,
    )

  const versionId =
    createId(
      'intervention-version-',
      correlationId,
      '1',
    )

  return {
    generatedAt,
    interventionId,
    versionId,
    correlationId,
  }
}

function createFailedResult({
  generatedAt,
  correlationId,
  errors,
  warnings,
}: {
  generatedAt: string
  correlationId: string
  errors: string[]
  warnings: string[]
}): GeneratePedagogicalInterventionResult {
  const requiresHumanReview =
    true

  const engine =
    createEngineMetadata(
      generatedAt,
      requiresHumanReview,
      warnings,
    )

  const traceability:
    PedagogicalInterventionTraceability = {
    correlationId,

    causationId: null,

    requestId: null,

    sessionId: null,

    sourceEvidenceIds: [],

    sourceAnalysisIds: [],

    sourceIntelligenceRunIds: [],

    sourceInterventionIds: [],

    generatedByCapability:
      'pedagogical_copilot',

    consumedByCapabilities: [],

    products: [
      'eios_core',
    ],

    auditEvents: [],
  }

  return {
    success: false,

    intervention: null,

    warnings,

    errors,

    generatedAt,

    engine,

    traceability,
  }
}

export function generatePedagogicalIntervention(
  input:
    GeneratePedagogicalInterventionInput,
): GeneratePedagogicalInterventionResult {
  const context =
    createGenerationContext(
      input,
    )

  const validation =
    validateInput(input)

  if (!validation.valid) {
    return createFailedResult({
      generatedAt:
        context.generatedAt,

      correlationId:
        context.correlationId,

      errors:
        validation.errors,

      warnings:
        validation.warnings,
    })
  }

  try {
    const diagnostic =
      normalizeDiagnostic(
        input.diagnostic,
      )

    const priority =
      resolvePriority({
        ...input,
        diagnostic,
      })

    const objectives =
      createObjectives(
        diagnostic,
        priority,
        context,
        input,
      )

    const {
      plan,
      expectedEvidence,
      indicators,
      successCriteria,
      schedule,
    } = createPlan(
      input,
      diagnostic,
      priority,
      objectives,
      context,
    )

    const requiresHumanReview =
      shouldRequireHumanReview(
        input,
        diagnostic,
      )

    const humanReview =
      createHumanReview(
        requiresHumanReview,
        context.generatedAt,
      )

    const teacherDecision =
      createTeacherDecision()

    const warnings =
      uniqueStrings([
        ...validation.warnings,

        requiresHumanReview
          ? 'A intervenção exige revisão humana antes da execução.'
          : null,

        diagnostic
          .requiresAdditionalEvidence
          ? 'Recomenda-se coletar evidências adicionais.'
          : null,

        diagnostic.risk.level ===
          'critical'
          ? 'O diagnóstico apresenta risco crítico e exige atenção humana imediata.'
          : null,
      ])

    const engine =
      createEngineMetadata(
        context.generatedAt,
        requiresHumanReview,
        warnings,
      )

    const version =
      createVersion(context)

    const auditEvent =
      createAuditEvent(
        context,
        requiresHumanReview,
      )

    const traceability =
      createTraceability(
        input,
        context,
        auditEvent,
      )

    const explainability =
      createExplainability(
        diagnostic,
        priority,
        input,
      )

    const researchEligibility =
      createResearchEligibility(
        input,
      )

    const intervention:
      PedagogicalIntervention = {
      id:
        context.interventionId,

      organizationId:
        normalizeNullableText(
          input.organizationId,
        ),

      schoolId:
        normalizeNullableText(
          input.schoolId,
        ),

      ownerUserId:
        normalizeNullableText(
          input.requestedByUserId,
        ),

      status:
        'awaiting_teacher_decision',

      priority,

      source:
        'eios_engine',

      sourceProduct:
        input.sourceProduct,

      capability:
        'pedagogical_copilot',

      context: {
        ...input.context,

        title:
          normalizeText(
            input.context.title,
          ),

        summary:
          normalizeText(
            input.context.summary,
          ),

        subjectArea:
          normalizeNullableText(
            input.context
              .subjectArea,
          ),

        component:
          normalizeNullableText(
            input.context.component,
          ),

        gradeLevel:
          normalizeNullableText(
            input.context.gradeLevel,
          ),

        schoolTerm:
          normalizeNullableText(
            input.context.schoolTerm,
          ),

        locationContext:
          normalizeNullableText(
            input.context
              .locationContext,
          ),

        audience: {
          ...input.context
            .audience,

          targetIds:
            uniqueStrings(
              input.context
                .audience.targetIds,
            ),

          groupId:
            normalizeNullableText(
              input.context
                .audience.groupId,
            ),

          groupLabel:
            normalizeNullableText(
              input.context
                .audience.groupLabel,
            ),

          selectionRationale:
            normalizeNullableText(
              input.context
                .audience
                .selectionRationale,
            ),
        },

        links: {
          ...input.context.links,

          organizationId:
            normalizeNullableText(
              input.context.links
                .organizationId,
            ),

          schoolId:
            normalizeNullableText(
              input.context.links
                .schoolId,
            ),

          teacherId:
            normalizeNullableText(
              input.context.links
                .teacherId,
            ),

          classIds:
            uniqueStrings(
              input.context.links
                .classIds,
            ),

          planningIds:
            uniqueStrings(
              input.context.links
                .planningIds,
            ),

          lessonIds:
            uniqueStrings(
              input.context.links
                .lessonIds,
            ),

          learningObjectiveIds:
            uniqueStrings(
              input.context.links
                .learningObjectiveIds,
            ),

          skillIds:
            uniqueStrings(
              input.context.links
                .skillIds,
            ),

          competencyIds:
            uniqueStrings(
              input.context.links
                .competencyIds,
            ),

          curriculumReferenceIds:
            uniqueStrings(
              input.context.links
                .curriculumReferenceIds,
            ),

          evidenceIds:
            uniqueStrings(
              input.context.links
                .evidenceIds,
            ),

          indicatorIds:
            uniqueStrings(
              input.context.links
                .indicatorIds,
            ),

          assessmentIds:
            uniqueStrings(
              input.context.links
                .assessmentIds,
            ),

          assessmentResultIds:
            uniqueStrings(
              input.context.links
                .assessmentResultIds,
            ),

          relatedInterventionIds:
            uniqueStrings(
              input.context.links
                .relatedInterventionIds,
            ),

          additionalEntities:
            input.context.links
              .additionalEntities,
        },

        contextualFactors:
          uniqueStrings(
            input.context
              .contextualFactors,
          ),

        constraints:
          uniqueStrings([
            ...input.context
              .constraints,
            ...input.constraints,
          ]),

        availableResources:
          uniqueStrings(
            input.context
              .availableResources,
          ),

        previousActions:
          uniqueStrings(
            input.context
              .previousActions,
          ),

        teacherObservations:
          uniqueStrings(
            input.context
              .teacherObservations,
          ),
      },

      diagnostic,

      plan,

      expectedEvidence,

      indicators,

      successCriteria,

      schedule,

      humanReview,

      teacherDecision,

      monitoring: {
        executionStatus:
          'not_started',

        progressPercentage: 0,

        progressRecords: [],

        currentChallenges: [],

        currentStrengths:
          diagnostic.strengths,

        adjustmentsMade: [],

        nextActions:
          plan.actions.map(
            action =>
              action.title,
          ),

        lastMonitoredAt: null,

        nextMonitoringAt:
          schedule.checkpoints[1]
            ?.plannedAt ??
          null,
      },

      effectiveness: null,

      explainability,

      privacy: {
        ...input.privacy,

        accessRestrictions:
          uniqueStrings(
            input.privacy
              .accessRestrictions,
          ),

        prohibitedUses:
          uniqueStrings([
            ...input.privacy
              .prohibitedUses,
            'Decisão automatizada sem validação profissional.',
            'Rotulação ou discriminação de estudantes.',
            'Exposição pública de informações individuais.',
          ]),

        notes:
          normalizeNullableText(
            input.privacy.notes,
          ),
      },

      researchEligibility,

      traceability,

      version,

      engine,

      createdAt:
        context.generatedAt,

      updatedAt:
        context.generatedAt,

      archivedAt: null,

      metadata: {
        ...(input.metadata ?? {}),

        capability:
          'pedagogical_copilot',

        engineName:
          ENGINE_NAME,

        engineVersion:
          ENGINE_VERSION,

        rulesetVersion:
          RULESET_VERSION,

        frameworkVersion:
          FRAMEWORK_VERSION,

        generatedBy:
          'EIOS',
      },
    }

    return {
      success: true,

      intervention,

      warnings,

      errors: [],

      generatedAt:
        context.generatedAt,

      engine,

      traceability,
    }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Erro inesperado durante a geração da intervenção pedagógica.'

    return createFailedResult({
      generatedAt:
        context.generatedAt,

      correlationId:
        context.correlationId,

      errors: [
        message,
      ],

      warnings:
        validation.warnings,
    })
  }
}