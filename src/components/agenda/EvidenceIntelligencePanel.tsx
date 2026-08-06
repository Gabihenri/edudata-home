'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  EvidencePedagogicalAnalysis,
  type EvidencePedagogicalAnalysisData,
  type EvidencePedagogicalDimension,
  type EvidencePedagogicalInsight,
} from '@/components/agenda/evidence-intelligence/EvidencePedagogicalAnalysis'

import EvidencePedagogicalCopilot from '@/components/agenda/evidence-intelligence/EvidencePedagogicalCopilot'

import type {
  GeneratePedagogicalInterventionInput,
  PedagogicalInterventionPriority,
  PedagogicalInterventionRiskLevel,
  PedagogicalInterventionRiskType,
} from '@/lib/agenda/evidence-intelligence/pedagogical-intervention.types'

type IntelligenceProcessingStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'requires_human_review'
  | 'failed'
  | 'cancelled'
  | 'ignored'

type HumanReviewStatus =
  | 'not_required'
  | 'pending'
  | 'in_review'
  | 'approved'
  | 'rejected'
  | 'changes_requested'

type IntelligenceRun = {
  id: string

  evidence_id: string

  event_id: string | null

  engine_name: string

  engine_version: string

  processing_status:
    IntelligenceProcessingStatus

  quality_score: number | null

  reliability_score: number | null

  confidence_score: number | null

  quality:
    Record<string, unknown>

  reliability:
    Record<string, unknown>

  framework_classifications:
    unknown[]

  validation:
    Record<string, unknown>

  explanation:
    Record<string, unknown>

  requires_human_review:
    boolean

  human_review_status:
    HumanReviewStatus

  warnings:
    unknown[]

  errors:
    unknown[]

  attempt_count:
    number

  processed_at:
    string | null

  failed_at:
    string | null

  last_error:
    string | null

  created_at:
    string

  updated_at:
    string
}

type IntelligenceApiResponse = {
  success: boolean

  data: {
    evidence: {
      id: string

      title: string

      evidenceType: string

      containsIdentifiableMinor:
        boolean

      createdAt: string

      updatedAt: string
    }

    intelligence: {
      available: boolean

      latest:
        IntelligenceRun | null

      history:
        IntelligenceRun[]

      summary: {
        totalRuns: number

        completedRuns: number

        failedRuns: number

        pendingReviewRuns:
          number

        latestStatus:
          IntelligenceProcessingStatus | null

        latestRequiresHumanReview:
          boolean

        latestProcessedAt:
          string | null

        latestEngineVersion:
          string | null
      }
    }
  }

  meta: {
    includeHistory: boolean

    historyLimit: number

    returnedHistoryItems:
      number

    generatedAt: string
  }
}

type EvidenceIntelligencePanelProps = {
  evidenceId: string

  evidenceTitle?: string

  initiallyOpen?: boolean
}

type LoadingState =
  | 'idle'
  | 'loading'
  | 'success'
  | 'error'

const STATUS_LABELS:
  Record<
    IntelligenceProcessingStatus,
    string
  > = {
    pending:
      'Aguardando análise',

    processing:
      'Analisando',

    completed:
      'Análise concluída',

    requires_human_review:
      'Revisão humana necessária',

    failed:
      'Falha na análise',

    cancelled:
      'Análise cancelada',

    ignored:
      'Análise não executada',
  }

const HUMAN_REVIEW_LABELS:
  Record<
    HumanReviewStatus,
    string
  > = {
    not_required:
      'Não necessária',

    pending:
      'Pendente',

    in_review:
      'Em revisão',

    approved:
      'Aprovada',

    rejected:
      'Rejeitada',

    changes_requested:
      'Ajustes solicitados',
  }

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  )
}

function isFiniteNumber(
  value: unknown,
): value is number {
  return (
    typeof value === 'number' &&
    Number.isFinite(value)
  )
}

function isStringArray(
  value: unknown,
): value is string[] {
  return (
    Array.isArray(value) &&
    value.every(
      item =>
        typeof item === 'string',
    )
  )
}

function uniqueStrings(
  values:
    Array<
      string | null | undefined
    >,
): string[] {
  return Array.from(
    new Set(
      values
        .filter(
          (
            value,
          ): value is string =>
            typeof value ===
            'string',
        )
        .map(
          value =>
            value.trim(),
        )
        .filter(Boolean),
    ),
  )
}

function clampScore(
  value:
    number | null | undefined,
): number | null {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value)
  ) {
    return null
  }

  return Math.min(
    1,
    Math.max(
      0,
      value,
    ),
  )
}

function formatDateTime(
  value:
    string | null,
): string {
  if (!value) {
    return 'Não informado'
  }

  const date =
    new Date(value)

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return 'Data indisponível'
  }

  return date.toLocaleString(
    'pt-BR',
    {
      day:
        '2-digit',

      month:
        '2-digit',

      year:
        'numeric',

      hour:
        '2-digit',

      minute:
        '2-digit',
    },
  )
}

function formatNormalizedScore(
  value:
    number | null,
): string {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value)
  ) {
    return 'Não calculado'
  }

  return `${
    Math.round(
      value * 100,
    )
  }%`
}

function getNormalizedScoreDescription(
  value:
    number | null,
): string {
  if (
    typeof value !== 'number'
  ) {
    return 'Ainda não há pontuação disponível.'
  }

  if (value >= 0.85) {
    return 'Nível elevado.'
  }

  if (value >= 0.65) {
    return 'Nível adequado, com possibilidade de aprimoramento.'
  }

  if (value >= 0.4) {
    return 'Nível intermediário. Recomenda-se complementar o registro.'
  }

  return 'Nível baixo. Recomenda-se revisar e ampliar a evidência.'
}

function getStatusClasses(
  status:
    IntelligenceProcessingStatus,
): string {
  if (
    status === 'completed'
  ) {
    return [
      'border-emerald-200',
      'bg-emerald-50',
      'text-emerald-800',
    ].join(' ')
  }

  if (
    status ===
    'requires_human_review'
  ) {
    return [
      'border-amber-200',
      'bg-amber-50',
      'text-amber-900',
    ].join(' ')
  }

  if (
    status === 'failed'
  ) {
    return [
      'border-rose-200',
      'bg-rose-50',
      'text-rose-800',
    ].join(' ')
  }

  if (
    status === 'processing' ||
    status === 'pending'
  ) {
    return [
      'border-blue-200',
      'bg-blue-50',
      'text-blue-800',
    ].join(' ')
  }

  return [
    'border-slate-200',
    'bg-slate-50',
    'text-slate-700',
  ].join(' ')
}

function stringifyMessage(
  value: unknown,
): string {
  if (
    typeof value === 'string'
  ) {
    return value
  }

  if (
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return String(value)
  }

  if (isRecord(value)) {
    if (
      typeof value.message ===
      'string'
    ) {
      return value.message
    }

    if (
      typeof value.description ===
      'string'
    ) {
      return value.description
    }
  }

  try {
    return JSON.stringify(value)
  } catch {
    return 'Informação indisponível'
  }
}

function getClassificationLabel(
  classification: unknown,
): string {
  if (
    typeof classification ===
    'string'
  ) {
    return classification
  }

  if (
    !isRecord(classification)
  ) {
    return stringifyMessage(
      classification,
    )
  }

  const candidateKeys = [
    'label',
    'name',
    'classification',
    'category',
    'dimension',
    'pillar',
    'type',
  ]

  for (
    const key of candidateKeys
  ) {
    const value =
      classification[key]

    if (
      typeof value === 'string' &&
      value.trim()
    ) {
      return value.trim()
    }
  }

  return stringifyMessage(
    classification,
  )
}

function parseDimension(
  value: unknown,
): EvidencePedagogicalDimension | null {
  if (!isRecord(value)) {
    return null
  }

  const dimension =
    value.dimension

  const level =
    value.level

  if (
    dimension !== 'evidence' &&
    dimension !== 'inclusion' &&
    dimension !== 'intelligence'
  ) {
    return null
  }

  if (
    level !== 'initial' &&
    level !== 'developing' &&
    level !== 'adequate' &&
    level !== 'advanced'
  ) {
    return null
  }

  if (
    typeof value.label !==
      'string' ||
    !isFiniteNumber(
      value.score,
    ) ||
    typeof value.explanation !==
      'string'
  ) {
    return null
  }

  return {
    dimension,

    label:
      value.label,

    score:
      value.score,

    level,

    explanation:
      value.explanation,

    strengths:
      isStringArray(
        value.strengths,
      )
        ? value.strengths
        : [],

    gaps:
      isStringArray(
        value.gaps,
      )
        ? value.gaps
        : [],
  }
}

function parseInsight(
  value: unknown,
): EvidencePedagogicalInsight | null {
  if (!isRecord(value)) {
    return null
  }

  const severity =
    value.severity

  if (
    severity !== 'information' &&
    severity !== 'attention' &&
    severity !== 'priority' &&
    severity !== 'critical'
  ) {
    return null
  }

  if (
    typeof value.id !==
      'string' ||
    typeof value.category !==
      'string' ||
    typeof value.title !==
      'string' ||
    typeof value.description !==
      'string' ||
    typeof value.recommendation !==
      'string' ||
    !isFiniteNumber(
      value.priority,
    ) ||
    typeof value
      .requiresHumanReview !==
      'boolean'
  ) {
    return null
  }

  return {
    id:
      value.id,

    category:
      value.category,

    severity,

    title:
      value.title,

    description:
      value.description,

    recommendation:
      value.recommendation,

    evidence:
      isStringArray(
        value.evidence,
      )
        ? value.evidence
        : [],

    priority:
      value.priority,

    requiresHumanReview:
      value
        .requiresHumanReview,
  }
}

function parsePedagogicalInsights(
  explanation:
    Record<string, unknown>,
): EvidencePedagogicalAnalysisData | null {
  const raw =
    explanation
      .pedagogicalInsights

  if (!isRecord(raw)) {
    return null
  }

  if (
    typeof raw.success !==
      'boolean' ||
    typeof raw.summary !==
      'string' ||
    !isFiniteNumber(
      raw.evidenceScore,
    ) ||
    !isFiniteNumber(
      raw.inclusionScore,
    ) ||
    !isFiniteNumber(
      raw.intelligenceScore,
    ) ||
    !isFiniteNumber(
      raw.overallScore,
    ) ||
    typeof raw
      .requiresHumanReview !==
      'boolean' ||
    typeof raw.generatedAt !==
      'string'
  ) {
    return null
  }

  const dimensions =
    Array.isArray(
      raw.dimensions,
    )
      ? raw.dimensions
          .map(
            parseDimension,
          )
          .filter(
            (
              item,
            ): item is EvidencePedagogicalDimension =>
              item !== null,
          )
      : []

  const insights =
    Array.isArray(
      raw.insights,
    )
      ? raw.insights
          .map(
            parseInsight,
          )
          .filter(
            (
              item,
            ): item is EvidencePedagogicalInsight =>
              item !== null,
          )
      : []

  const rawEngine =
    raw.engine

  const engine =
    isRecord(rawEngine)
      ? {
          name:
            typeof rawEngine.name ===
              'string'
              ? rawEngine.name
              : 'pedagogical-insights',

          version:
            typeof rawEngine.version ===
              'string'
              ? rawEngine.version
              : 'desconhecida',

          mode:
            typeof rawEngine.mode ===
              'string'
              ? rawEngine.mode
              : 'não informado',
        }
      : {
          name:
            'pedagogical-insights',

          version:
            'desconhecida',

          mode:
            'não informado',
        }

  return {
    success:
      raw.success,

    summary:
      raw.summary,

    evidenceScore:
      raw.evidenceScore,

    inclusionScore:
      raw.inclusionScore,

    intelligenceScore:
      raw.intelligenceScore,

    overallScore:
      raw.overallScore,

    dimensions,

    insights,

    strengths:
      isStringArray(
        raw.strengths,
      )
        ? raw.strengths
        : [],

    improvementOpportunities:
      isStringArray(
        raw
          .improvementOpportunities,
      )
        ? raw
            .improvementOpportunities
        : [],

    recommendedNextActions:
      isStringArray(
        raw
          .recommendedNextActions,
      )
        ? raw
            .recommendedNextActions
        : [],

    requiresHumanReview:
      raw.requiresHumanReview,

    generatedAt:
      raw.generatedAt,

    engine,

    metadata:
      isRecord(raw.metadata)
        ? raw.metadata
        : {},
  }
}

function resolvePriority(
  analysis:
    EvidencePedagogicalAnalysisData,
): PedagogicalInterventionPriority {
  const severities =
    analysis.insights.map(
      insight =>
        insight.severity,
    )

  if (
    severities.includes(
      'critical',
    )
  ) {
    return 'critical'
  }

  if (
    severities.includes(
      'priority',
    )
  ) {
    return 'high'
  }

  if (
    severities.includes(
      'attention',
    )
  ) {
    return 'moderate'
  }

  return 'low'
}

function resolveRiskLevel(
  analysis:
    EvidencePedagogicalAnalysisData,
): PedagogicalInterventionRiskLevel {
  if (
    analysis.insights.some(
      insight =>
        insight.severity ===
        'critical',
    )
  ) {
    return 'critical'
  }

  if (
    analysis.insights.some(
      insight =>
        insight.severity ===
        'priority',
    )
  ) {
    return 'high'
  }

  if (
    analysis.insights.some(
      insight =>
        insight.severity ===
        'attention',
    )
  ) {
    return 'moderate'
  }

  if (
    analysis.overallScore <
    0.4
  ) {
    return 'high'
  }

  if (
    analysis.overallScore <
    0.65
  ) {
    return 'moderate'
  }

  return 'low'
}

function resolveRiskTypes(
  analysis:
    EvidencePedagogicalAnalysisData,
): PedagogicalInterventionRiskType[] {
  const types:
    PedagogicalInterventionRiskType[] =
      []

  if (
    analysis.evidenceScore <
    0.65
  ) {
    types.push(
      'insufficient_evidence',
      'data_quality',
    )
  }

  if (
    analysis.inclusionScore <
    0.65
  ) {
    types.push(
      'inclusion',
      'accessibility',
    )
  }

  if (
    analysis.intelligenceScore <
    0.65
  ) {
    types.push(
      'learning_gap',
      'assessment',
    )
  }

  if (
    analysis.insights.some(
      insight =>
        insight.category
          .toLowerCase()
          .includes(
            'engaj',
          ),
    )
  ) {
    types.push(
      'engagement',
    )
  }

  return Array.from(
    new Set(types),
  )
}

function createGenerationInput({
  evidenceId,
  evidenceTitle,
  evidenceType,
  containsIdentifiableMinor,
  latest,
  analysis,
}: {
  evidenceId: string

  evidenceTitle: string

  evidenceType: string

  containsIdentifiableMinor:
    boolean

  latest:
    IntelligenceRun

  analysis:
    EvidencePedagogicalAnalysisData
}): GeneratePedagogicalInterventionInput {
  const priority =
    resolvePriority(
      analysis,
    )

  const riskLevel =
    resolveRiskLevel(
      analysis,
    )

  const riskTypes =
    resolveRiskTypes(
      analysis,
    )

  const insightDescriptions =
    uniqueStrings(
      analysis.insights.map(
        insight =>
          insight.description,
      ),
    )

  const recommendations =
    uniqueStrings([
      ...analysis
        .recommendedNextActions,

      ...analysis.insights.map(
        insight =>
          insight.recommendation,
      ),
    ])

  const identifiedGaps =
    uniqueStrings([
      ...analysis
        .improvementOpportunities,

      ...analysis.dimensions.flatMap(
        dimension =>
          dimension.gaps,
      ),
    ])

  const strengths =
    uniqueStrings([
      ...analysis.strengths,

      ...analysis.dimensions.flatMap(
        dimension =>
          dimension.strengths,
      ),
    ])

  const criticalSignals =
    uniqueStrings(
      analysis.insights
        .filter(
          insight =>
            insight.severity ===
              'critical' ||
            insight.severity ===
              'priority',
        )
        .map(
          insight =>
            insight.description,
        ),
    )

  return {
    organizationId:
      null,

    schoolId:
      null,

    requestedByUserId:
      null,

    sourceProduct:
      'agenda_inteligente_edi',

    context: {
      title:
        `Intervenção pedagógica — ${evidenceTitle}`,

      summary:
        analysis.summary,

      educationalStage:
        'not_informed',

      modality:
        'not_informed',

      subjectArea:
        null,

      component:
        null,

      gradeLevel:
        null,

      schoolTerm:
        null,

      academicYear:
        new Date()
          .getFullYear(),

      locationContext:
        null,

      audience: {
        scope:
          'class',

        targetType:
          'class',

        targetIds:
          [],

        estimatedParticipants:
          null,

        groupId:
          null,

        groupLabel:
          null,

        selectionRationale:
          'Escopo inicial definido a partir da evidência pedagógica. O professor deverá validar os sujeitos e grupos antes da aplicação.',

        anonymized:
          true,

        aggregated:
          true,
      },

      links: {
        organizationId:
          null,

        schoolId:
          null,

        teacherId:
          null,

        classIds:
          [],

        planningIds:
          [],

        lessonIds:
          [],

        learningObjectiveIds:
          [],

        skillIds:
          [],

        competencyIds:
          [],

        curriculumReferenceIds:
          [],

        evidenceIds: [
          evidenceId,
        ],

        indicatorIds:
          [],

        assessmentIds:
          [],

        assessmentResultIds:
          [],

        relatedInterventionIds:
          [],

        additionalEntities: [
          {
            entityType:
              'evidence',

            entityId:
              evidenceId,

            label:
              evidenceTitle,

            relationship:
              'source_evidence',

            sourceSystem:
              'agenda_inteligente_edi',

            metadata: {
              evidenceType,
            },
          },
        ],
      },

      contextualFactors:
        uniqueStrings([
          `Tipo de evidência: ${evidenceType}`,

          ...analysis.dimensions.map(
            dimension =>
              `${dimension.label}: ${dimension.explanation}`,
          ),
        ]),

      constraints:
        containsIdentifiableMinor
          ? [
              'Preservar a identificação e a privacidade de estudantes menores de idade.',
              'Não utilizar os dados para decisões automatizadas sem validação profissional.',
            ]
          : [
              'Não utilizar a recomendação sem validação profissional.',
            ],

      availableResources:
        [],

      previousActions:
        [],

      teacherObservations:
        insightDescriptions,
    },

    diagnostic: {
      problemStatement:
        identifiedGaps[0] ??
        analysis.summary,

      pedagogicalInterpretation:
        analysis.summary,

      observedPatterns:
        insightDescriptions,

      strengths,

      learningGaps:
        identifiedGaps,

      inclusionBarriers:
        analysis.inclusionScore <
        0.65
          ? identifiedGaps
          : [],

      engagementFactors:
        analysis.insights
          .filter(
            insight =>
              insight.category
                .toLowerCase()
                .includes(
                  'engaj',
                ),
          )
          .map(
            insight =>
              insight.description,
          ),

      probableCauses:
        analysis.insights.map(
          (
            insight,
            index,
          ) => ({
            id:
              `cause-${latest.id}-${index + 1}`,

            category:
              insight.category,

            description:
              insight.description,

            probability:
              clampScore(
                insight.priority /
                  100,
              ),

            evidenceIds: [
              evidenceId,
            ],

            requiresHumanValidation:
              true,

            validatedByHuman:
              false,

            validationNotes:
              null,
          }),
        ),

      sources: [
        {
          sourceType:
            'evidence',

          sourceId:
            evidenceId,

          description:
            `Evidência analisada pelo Evidence Intelligence: ${evidenceTitle}`,

          relevanceScore:
            clampScore(
              analysis.evidenceScore,
            ),

          reliabilityScore:
            clampScore(
              latest
                .reliability_score,
            ),

          observedAt:
            latest.processed_at ??
            latest.updated_at,

          metadata: {
            evidenceType,

            intelligenceRunId:
              latest.id,

            engineName:
              latest.engine_name,

            engineVersion:
              latest.engine_version,
          },
        },

        {
          sourceType:
            'analytics',

          sourceId:
            latest.id,

          description:
            'Análise pedagógica produzida pela Capability Evidence Intelligence do EIOS.',

          relevanceScore:
            clampScore(
              analysis.overallScore,
            ),

          reliabilityScore:
            clampScore(
              latest
                .confidence_score,
            ),

          observedAt:
            analysis.generatedAt,

          metadata: {
            engine:
              analysis.engine,
          },
        },
      ],

      risk: {
        level:
          riskLevel,

        types:
          riskTypes,

        summary:
          criticalSignals[0] ??
          `Risco pedagógico classificado como ${riskLevel}.`,

        signals:
          criticalSignals,

        protectiveFactors:
          strengths,

        aggravatingFactors:
          identifiedGaps,

        probabilityScore:
          clampScore(
            1 -
            analysis.overallScore,
          ),

        impactScore:
          riskLevel ===
            'critical'
            ? 1
            : riskLevel ===
                'high'
              ? 0.8
              : riskLevel ===
                  'moderate'
                ? 0.6
                : 0.3,

        urgencyScore:
          priority ===
            'critical'
            ? 1
            : priority ===
                'urgent'
              ? 0.9
              : priority ===
                  'high'
                ? 0.75
                : priority ===
                    'moderate'
                  ? 0.5
                  : 0.25,

        requiresImmediateHumanAttention:
          riskLevel ===
            'critical',

        limitations: [
          'A análise utiliza exclusivamente os dados disponíveis na evidência e deve ser contextualizada pelo professor.',
          'Correlação não deve ser interpretada automaticamente como causalidade.',
        ],
      },

      confidenceScore:
        clampScore(
          latest
            .confidence_score,
        ),

      reliabilityScore:
        clampScore(
          latest
            .reliability_score,
        ),

      evidenceSufficiencyScore:
        clampScore(
          analysis.evidenceScore,
        ),

      requiresAdditionalEvidence:
        analysis.evidenceScore <
        0.65,

      additionalEvidenceNeeded:
        analysis.evidenceScore <
        0.65
          ? [
              'Novos registros de aprendizagem.',
              'Produções ou avaliações complementares.',
              'Observações profissionais contextualizadas.',
            ]
          : [],

      assumptions: [
        'Os dados persistidos representam adequadamente o contexto observado.',
        'A intervenção deverá ser validada pelo professor antes da execução.',
      ],

      limitations: [
        'O motor não substitui o julgamento profissional.',
        'A análise pode não conter todos os fatores contextuais da turma ou dos estudantes.',
      ],

      generatedAt:
        analysis.generatedAt,
    },

    preferredPriority:
      priority,

    constraints:
      containsIdentifiableMinor
        ? [
            'Não expor dados identificáveis de menores.',
            'Manter revisão humana obrigatória.',
          ]
        : [
            'Manter revisão humana antes da execução.',
          ],

    teacherPreferences: [
      'Preservar a autonomia profissional.',
      'Priorizar estratégias viáveis no contexto escolar.',
      'Utilizar evidências para acompanhar os resultados.',
    ],

    excludedApproaches: [
      'Rotulação de estudantes.',
      'Decisões exclusivamente automatizadas.',
      'Recomendações punitivas sem fundamento pedagógico.',
      'Uso de atributos sensíveis para discriminação.',
    ],

    requiredMethodologies: [
      'formative_assessment',
      'differentiated_instruction',
      'remediation',
      'universal_design_for_learning',
    ],

    requiredHumanReview:
      latest
        .requires_human_review ||
      analysis
        .requiresHumanReview ||
      containsIdentifiableMinor,

    privacy: {
      containsPersonalData:
        containsIdentifiableMinor,

      containsSensitiveData:
        containsIdentifiableMinor,

      containsMinorData:
        containsIdentifiableMinor,

      sensitivity:
        containsIdentifiableMinor
          ? 'highly_sensitive'
          : 'restricted',

      anonymized:
        !containsIdentifiableMinor,

      pseudonymized:
        false,

      aggregated:
        true,

      legalBasis:
        'public_policy',

      retentionPolicy:
        'Conforme governança institucional e política de retenção da EduData IA.',

      accessRestrictions: [
        'Acesso limitado ao usuário autorizado e aos perfis institucionais habilitados.',
        'Uso condicionado às políticas RLS e à governança da organização.',
      ],

      prohibitedUses: [
        'Exposição pública de dados pessoais.',
        'Decisão automatizada sem revisão humana.',
        'Uso discriminatório ou punitivo.',
      ],

      notes:
        'A intervenção utiliza vínculos técnicos e dados agregados sempre que possível.',
    },

    researchEligibility: {
      eligible:
        !containsIdentifiableMinor,

      anonymizationRequired:
        true,

      aggregationRequired:
        true,

      longitudinalUseAllowed:
        true,

      correlationUseAllowed:
        true,

      groupAnalysisAllowed:
        true,

      externalEventAnalysisAllowed:
        true,

      zoneInfluenceAnalysisAllowed:
        false,

      hypothesisGenerationAllowed:
        true,

      humanSubjectsReviewRequired:
        containsIdentifiableMinor,

      restrictions: [
        'Uso somente com anonimização, agregação e governança.',
        'Não identificar estudantes, professores ou grupos protegidos.',
      ],

      notes:
        'Elegibilidade final deverá ser validada pelas políticas de Research Intelligence.',
    },

    correlationId:
      [
        'pedagogical-copilot',
        evidenceId,
        latest.id,
      ].join(':'),

    metadata: {
      evidenceId,

      evidenceIntelligenceRunId:
        latest.id,

      evidenceType,

      evidenceTitle,

      analysisEngine:
        analysis.engine,

      sourceEngineName:
        latest.engine_name,

      sourceEngineVersion:
        latest.engine_version,

      generatedFrom:
        'evidence_intelligence',
    },
  }
}

async function readErrorResponse(
  response:
    Response,
): Promise<string> {
  try {
    const body: unknown =
      await response.json()

    if (
      isRecord(body) &&
      typeof body.error ===
        'string'
    ) {
      return body.error
    }
  } catch {
    return `Erro HTTP ${response.status}.`
  }

  return `Erro HTTP ${response.status}.`
}

function getErrorMessage(
  error: unknown,
): string {
  if (
    error instanceof Error
  ) {
    return error.message
  }

  if (
    typeof error === 'string' &&
    error.trim()
  ) {
    return error.trim()
  }

  return 'Não foi possível carregar a análise inteligente.'
}

function ScoreCard({
  label,
  value,
  description,
}: {
  label: string

  value: string

  description: string
}) {
  return (
    <article
      className={[
        'rounded-xl border',
        'border-slate-200',
        'bg-slate-50 p-4',
      ].join(' ')}
    >
      <p
        className={[
          'text-xs font-semibold',
          'uppercase tracking-wide',
          'text-slate-500',
        ].join(' ')}
      >
        {label}
      </p>

      <p
        className={[
          'mt-2 text-2xl',
          'font-bold text-slate-950',
        ].join(' ')}
      >
        {value}
      </p>

      <p
        className={[
          'mt-1 text-xs',
          'leading-5 text-slate-600',
        ].join(' ')}
      >
        {description}
      </p>
    </article>
  )
}

export function EvidenceIntelligencePanel({
  evidenceId,
  evidenceTitle,
  initiallyOpen = false,
}: EvidenceIntelligencePanelProps) {
  const [
    open,
    setOpen,
  ] = useState(
    initiallyOpen,
  )

  const [
    loadingState,
    setLoadingState,
  ] = useState<LoadingState>(
    'idle',
  )

  const [
    data,
    setData,
  ] = useState<
    IntelligenceApiResponse[
      'data'
    ] | null
  >(null)

  const [
    error,
    setError,
  ] = useState<
    string | null
  >(null)

  const loadIntelligence =
    useCallback(
      async ({
        force = false,
      }: {
        force?: boolean
      } = {}): Promise<void> => {
        if (
          !force &&
          loadingState ===
            'loading'
        ) {
          return
        }

        setLoadingState(
          'loading',
        )

        setError(null)

        try {
          const response =
            await fetch(
              `/api/agenda/evidences/${encodeURIComponent(
                evidenceId,
              )}/intelligence?includeHistory=true&limit=10`,
              {
                method:
                  'GET',

                credentials:
                  'include',

                cache:
                  'no-store',

                headers: {
                  Accept:
                    'application/json',
                },
              },
            )

          if (!response.ok) {
            throw new Error(
              await readErrorResponse(
                response,
              ),
            )
          }

          const body =
            await response.json() as
              IntelligenceApiResponse

          if (!body.success) {
            throw new Error(
              'A API não concluiu a consulta da análise.',
            )
          }

          setData(
            body.data,
          )

          setLoadingState(
            'success',
          )
        } catch (loadError) {
          setData(null)

          setError(
            getErrorMessage(
              loadError,
            ),
          )

          setLoadingState(
            'error',
          )
        }
      },
      [
        evidenceId,
        loadingState,
      ],
    )

  useEffect(
    () => {
      if (
        open &&
        loadingState ===
          'idle'
      ) {
        void loadIntelligence()
      }
    },
    [
      loadIntelligence,
      loadingState,
      open,
    ],
  )

  const latest =
    data?.intelligence
      .latest ??
    null

  const history =
    data?.intelligence
      .history ??
    []

  const pedagogicalInsights =
    useMemo(
      () =>
        latest
          ? parsePedagogicalInsights(
              latest.explanation,
            )
          : null,
      [
        latest,
      ],
    )

  const classifications =
    useMemo(
      () =>
        latest
          ?.framework_classifications
          .map(
            getClassificationLabel,
          )
          .filter(
            value =>
              Boolean(
                value.trim(),
              ),
          ) ??
        [],
      [
        latest,
      ],
    )

  const warnings =
    useMemo(
      () =>
        latest
          ?.warnings
          .map(
            stringifyMessage,
          ) ??
        [],
      [
        latest,
      ],
    )

  const errors =
    useMemo(
      () =>
        latest
          ?.errors
          .map(
            stringifyMessage,
          ) ??
        [],
      [
        latest,
      ],
    )

  const generationInput =
    useMemo(
      () => {
        if (
          !data ||
          !latest ||
          !pedagogicalInsights
        ) {
          return null
        }

        return createGenerationInput({
          evidenceId,

          evidenceTitle:
            evidenceTitle ??
            data.evidence.title,

          evidenceType:
            data.evidence
              .evidenceType,

          containsIdentifiableMinor:
            data.evidence
              .containsIdentifiableMinor,

          latest,

          analysis:
            pedagogicalInsights,
        })
      },
      [
        data,
        evidenceId,
        evidenceTitle,
        latest,
        pedagogicalInsights,
      ],
    )

  return (
    <section
      className={[
        'overflow-hidden rounded-2xl',
        'border border-slate-200',
        'bg-white shadow-sm',
      ].join(' ')}
    >
      <button
        type="button"
        onClick={() => {
          setOpen(
            current =>
              !current,
          )
        }}
        className={[
          'flex w-full items-center',
          'justify-between gap-4',
          'px-5 py-4 text-left',
          'transition hover:bg-slate-50',
        ].join(' ')}
        aria-expanded={open}
      >
        <span>
          <span
            className={[
              'block text-sm font-semibold',
              'text-slate-950',
            ].join(' ')}
          >
            Análise inteligente EDI
          </span>

          <span
            className={[
              'mt-1 block text-xs',
              'text-slate-500',
            ].join(' ')}
          >
            {evidenceTitle
              ? `Evidência: ${evidenceTitle}`
              : 'Scores, qualidade, confiabilidade e recomendações pedagógicas.'}
          </span>
        </span>

        <span
          className={[
            'rounded-full border',
            'border-slate-200',
            'bg-slate-50 px-3 py-1',
            'text-xs font-semibold',
            'text-slate-700',
          ].join(' ')}
        >
          {open
            ? 'Ocultar'
            : 'Consultar'}
        </span>
      </button>

      {open ? (
        <div
          className={[
            'border-t border-slate-200',
            'px-5 py-5',
          ].join(' ')}
        >
          {loadingState ===
          'loading' ? (
            <div
              className={[
                'rounded-xl border',
                'border-blue-200',
                'bg-blue-50 px-4 py-4',
                'text-sm text-blue-800',
              ].join(' ')}
            >
              Carregando a análise
              inteligente...
            </div>
          ) : null}

          {loadingState ===
            'error' &&
          error ? (
            <div
              className={[
                'rounded-xl border',
                'border-rose-200',
                'bg-rose-50 px-4 py-4',
              ].join(' ')}
            >
              <p
                className={[
                  'text-sm font-semibold',
                  'text-rose-900',
                ].join(' ')}
              >
                Não foi possível carregar
              </p>

              <p
                className={[
                  'mt-1 text-sm',
                  'text-rose-800',
                ].join(' ')}
              >
                {error}
              </p>

              <button
                type="button"
                onClick={() => {
                  void loadIntelligence({
                    force:
                      true,
                  })
                }}
                className={[
                  'mt-3 rounded-lg',
                  'border border-rose-300',
                  'bg-white px-3 py-2',
                  'text-xs font-semibold',
                  'text-rose-800',
                  'transition hover:bg-rose-100',
                ].join(' ')}
              >
                Tentar novamente
              </button>
            </div>
          ) : null}

          {loadingState ===
            'success' &&
          data &&
          !data.intelligence
            .available ? (
            <div
              className={[
                'rounded-xl border',
                'border-slate-200',
                'bg-slate-50 px-4 py-4',
              ].join(' ')}
            >
              <p
                className={[
                  'text-sm font-semibold',
                  'text-slate-800',
                ].join(' ')}
              >
                Análise ainda não
                disponível
              </p>

              <p
                className={[
                  'mt-1 text-sm',
                  'text-slate-600',
                ].join(' ')}
              >
                A evidência ainda não
                possui uma execução
                persistida do Evidence
                Intelligence.
              </p>
            </div>
          ) : null}

          {loadingState ===
            'success' &&
          latest ? (
            <div className="space-y-6">
              <div
                className={[
                  'flex flex-wrap items-center',
                  'justify-between gap-3',
                ].join(' ')}
              >
                <span
                  className={[
                    'inline-flex rounded-full',
                    'border px-3 py-1',
                    'text-xs font-semibold',
                    getStatusClasses(
                      latest
                        .processing_status,
                    ),
                  ].join(' ')}
                >
                  {
                    STATUS_LABELS[
                      latest
                        .processing_status
                    ]
                  }
                </span>

                <span
                  className={[
                    'text-xs',
                    'text-slate-500',
                  ].join(' ')}
                >
                  Motor{' '}
                  {
                    latest
                      .engine_version
                  }
                  {' · '}
                  {formatDateTime(
                    latest
                      .processed_at ??
                    latest.updated_at,
                  )}
                </span>
              </div>

              {pedagogicalInsights ? (
                <EvidencePedagogicalAnalysis
                  analysis={
                    pedagogicalInsights
                  }
                  evidenceTitle={
                    evidenceTitle ??
                    data?.evidence
                      .title
                  }
                />
              ) : (
                <div
                  className={[
                    'rounded-xl border',
                    'border-slate-200',
                    'bg-slate-50 p-4',
                  ].join(' ')}
                >
                  <p
                    className={[
                      'text-sm font-semibold',
                      'text-slate-800',
                    ].join(' ')}
                  >
                    Leitura pedagógica não
                    disponível nesta
                    execução
                  </p>

                  <p
                    className={[
                      'mt-1 text-sm',
                      'leading-6 text-slate-600',
                    ].join(' ')}
                  >
                    Execuções anteriores à
                    versão pedagógica do
                    motor não possuem
                    scores EDI e
                    recomendações
                    persistidas.
                  </p>
                </div>
              )}

              {pedagogicalInsights ? (
                <EvidencePedagogicalCopilot
                  evidenceId={
                    evidenceId
                  }
                  evidenceIntelligenceRunId={
                    latest.id
                  }
                  sourceAnalysisId={
                    latest.id
                  }
                  sourceEventId={
                    latest.event_id
                  }
                  generationInput={
                    generationInput
                  }
                  initiallyOpen={
                    false
                  }
                  className="mt-6"
                />
              ) : null}

              <section>
                <p
                  className={[
                    'text-xs font-bold',
                    'uppercase',
                    'tracking-[0.14em]',
                    'text-[#0B7491]',
                  ].join(' ')}
                >
                  Qualidade e
                  confiabilidade técnica
                </p>

                <div
                  className={[
                    'mt-4 grid gap-3',
                    'sm:grid-cols-3',
                  ].join(' ')}
                >
                  <ScoreCard
                    label="Qualidade técnica"
                    value={formatNormalizedScore(
                      latest
                        .quality_score,
                    )}
                    description={getNormalizedScoreDescription(
                      latest
                        .quality_score,
                    )}
                  />

                  <ScoreCard
                    label="Confiabilidade"
                    value={formatNormalizedScore(
                      latest
                        .reliability_score,
                    )}
                    description={getNormalizedScoreDescription(
                      latest
                        .reliability_score,
                    )}
                  />

                  <ScoreCard
                    label="Confiança"
                    value={formatNormalizedScore(
                      latest
                        .confidence_score,
                    )}
                    description={getNormalizedScoreDescription(
                      latest
                        .confidence_score,
                    )}
                  />
                </div>
              </section>

              {latest
                .requires_human_review ||
              pedagogicalInsights
                ?.requiresHumanReview ? (
                <div
                  className={[
                    'rounded-xl border',
                    'border-amber-200',
                    'bg-amber-50 px-4 py-4',
                  ].join(' ')}
                >
                  <p
                    className={[
                      'text-sm font-semibold',
                      'text-amber-950',
                    ].join(' ')}
                  >
                    Revisão humana
                    necessária
                  </p>

                  <p
                    className={[
                      'mt-1 text-sm',
                      'leading-6 text-amber-900',
                    ].join(' ')}
                  >
                    Situação:{' '}
                    {
                      HUMAN_REVIEW_LABELS[
                        latest
                          .human_review_status
                      ]
                    }
                    . A interpretação final
                    permanece sob
                    responsabilidade
                    profissional.
                  </p>
                </div>
              ) : null}

              {classifications.length >
              0 ? (
                <section>
                  <h4
                    className={[
                      'text-sm font-semibold',
                      'text-slate-900',
                    ].join(' ')}
                  >
                    Classificações do
                    Framework EDI
                  </h4>

                  <div
                    className={[
                      'mt-3 flex flex-wrap',
                      'gap-2',
                    ].join(' ')}
                  >
                    {classifications.map(
                      (
                        classification,
                        index,
                      ) => (
                        <span
                          key={`${classification}-${index}`}
                          className={[
                            'rounded-full border',
                            'border-cyan-200',
                            'bg-cyan-50',
                            'px-3 py-1',
                            'text-xs font-semibold',
                            'text-[#075F78]',
                          ].join(' ')}
                        >
                          {
                            classification
                          }
                        </span>
                      ),
                    )}
                  </div>
                </section>
              ) : null}

              {warnings.length > 0 ? (
                <div
                  className={[
                    'rounded-xl border',
                    'border-amber-200',
                    'bg-amber-50 p-4',
                  ].join(' ')}
                >
                  <h4
                    className={[
                      'text-sm font-semibold',
                      'text-amber-950',
                    ].join(' ')}
                  >
                    Pontos de atenção
                    técnicos
                  </h4>

                  <ul
                    className={[
                      'mt-2 space-y-2',
                      'text-sm text-amber-900',
                    ].join(' ')}
                  >
                    {warnings.map(
                      (
                        warning,
                        index,
                      ) => (
                        <li
                          key={`${warning}-${index}`}
                        >
                          {warning}
                        </li>
                      ),
                    )}
                  </ul>
                </div>
              ) : null}

              {errors.length > 0 ? (
                <div
                  className={[
                    'rounded-xl border',
                    'border-rose-200',
                    'bg-rose-50 p-4',
                  ].join(' ')}
                >
                  <h4
                    className={[
                      'text-sm font-semibold',
                      'text-rose-950',
                    ].join(' ')}
                  >
                    Erros registrados
                  </h4>

                  <ul
                    className={[
                      'mt-2 space-y-2',
                      'text-sm text-rose-900',
                    ].join(' ')}
                  >
                    {errors.map(
                      (
                        runError,
                        index,
                      ) => (
                        <li
                          key={`${runError}-${index}`}
                        >
                          {runError}
                        </li>
                      ),
                    )}
                  </ul>
                </div>
              ) : null}

              <section
                className={[
                  'rounded-xl border',
                  'border-slate-200',
                  'bg-white p-4',
                ].join(' ')}
              >
                <div
                  className={[
                    'flex flex-wrap items-center',
                    'justify-between gap-2',
                  ].join(' ')}
                >
                  <h4
                    className={[
                      'text-sm font-semibold',
                      'text-slate-900',
                    ].join(' ')}
                  >
                    Histórico de
                    processamento
                  </h4>

                  <span
                    className={[
                      'text-xs',
                      'text-slate-500',
                    ].join(' ')}
                  >
                    {history.length}{' '}
                    execução(ões)
                  </span>
                </div>

                <div className="mt-3 space-y-2">
                  {history.map(
                    run => (
                      <div
                        key={run.id}
                        className={[
                          'flex flex-wrap',
                          'items-center',
                          'justify-between',
                          'gap-2 rounded-lg',
                          'border border-slate-200',
                          'bg-slate-50',
                          'px-3 py-3',
                        ].join(' ')}
                      >
                        <div>
                          <p
                            className={[
                              'text-xs font-semibold',
                              'text-slate-800',
                            ].join(' ')}
                          >
                            {
                              STATUS_LABELS[
                                run
                                  .processing_status
                              ]
                            }
                          </p>

                          <p
                            className={[
                              'mt-1 text-xs',
                              'text-slate-500',
                            ].join(' ')}
                          >
                            {formatDateTime(
                              run
                                .processed_at ??
                              run.updated_at,
                            )}
                          </p>
                        </div>

                        <span
                          className={[
                            'text-xs font-medium',
                            'text-slate-600',
                          ].join(' ')}
                        >
                          versão{' '}
                          {
                            run
                              .engine_version
                          }
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </section>

              <button
                type="button"
                onClick={() => {
                  void loadIntelligence({
                    force:
                      true,
                  })
                }}
                className={[
                  'rounded-lg border',
                  'border-slate-300',
                  'bg-white px-3 py-2',
                  'text-xs font-semibold',
                  'text-slate-700',
                  'transition hover:bg-slate-100',
                ].join(' ')}
              >
                Atualizar análise
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}

export default EvidenceIntelligencePanel