import {
  type DecisionAlert,
  type DecisionAudience,
  type DecisionPriority,
  type DecisionRecommendation,
  type DecisionSeverity,
  type EducationalDecision,
} from './decision-intelligence.contract'

export type DecisionAlertGenerationOptions = {
  includeInformationalAlerts:
    boolean

  includeRecommendationAlerts:
    boolean

  includeRiskAlerts:
    boolean

  includeHumanReviewAlerts:
    boolean

  maximumAlertsPerDecision:
    number

  defaultExpirationHours:
    number
}

export type DecisionAlertGenerationResult = {
  success:
    boolean

  decisionId:
    string

  alerts:
    DecisionAlert[]

  warnings:
    string[]

  errors:
    string[]

  requiresHumanReview:
    boolean
}

export type DecisionAlertBatchResult = {
  success:
    boolean

  results:
    DecisionAlertGenerationResult[]

  alerts:
    DecisionAlert[]

  warnings:
    string[]

  errors:
    string[]

  requiresHumanReview:
    boolean
}

const DEFAULT_OPTIONS:
  DecisionAlertGenerationOptions = {
  includeInformationalAlerts:
    true,

  includeRecommendationAlerts:
    true,

  includeRiskAlerts:
    true,

  includeHumanReviewAlerts:
    true,

  maximumAlertsPerDecision:
    10,

  defaultExpirationHours:
    168,
}

function nowIso():
  string {
  return new Date()
    .toISOString()
}

function createId(
  prefix:
    string,
): string {
  return [
    prefix,
    Date.now(),
    Math.random()
      .toString(36)
      .slice(2, 10),
  ].join(
    '-',
  )
}

function uniqueStrings(
  values:
    string[],
): string[] {
  return Array.from(
    new Set(
      values
        .map(
          value =>
            value.trim(),
        )
        .filter(
          Boolean,
        ),
    ),
  )
}

function normalizeOptions(
  options?:
    Partial<DecisionAlertGenerationOptions>,
): DecisionAlertGenerationOptions {
  return {
    includeInformationalAlerts:
      options?.includeInformationalAlerts ??
      DEFAULT_OPTIONS.includeInformationalAlerts,

    includeRecommendationAlerts:
      options?.includeRecommendationAlerts ??
      DEFAULT_OPTIONS.includeRecommendationAlerts,

    includeRiskAlerts:
      options?.includeRiskAlerts ??
      DEFAULT_OPTIONS.includeRiskAlerts,

    includeHumanReviewAlerts:
      options?.includeHumanReviewAlerts ??
      DEFAULT_OPTIONS.includeHumanReviewAlerts,

    maximumAlertsPerDecision:
      Math.max(
        1,
        Math.floor(
          options?.maximumAlertsPerDecision ??
          DEFAULT_OPTIONS.maximumAlertsPerDecision,
        ),
      ),

    defaultExpirationHours:
      Math.max(
        1,
        Math.floor(
          options?.defaultExpirationHours ??
          DEFAULT_OPTIONS.defaultExpirationHours,
        ),
      ),
  }
}

function getAudience(
  decision:
    EducationalDecision,
): DecisionAudience[] {
  if (
    decision.studentId ||
    decision.classId
  ) {
    return [
      'teacher',
      'coordinator',
    ]
  }

  if (
    decision.teacherId
  ) {
    return [
      'coordinator',
      'school_management',
    ]
  }

  if (
    decision.institutionId
  ) {
    return [
      'school_management',
      'institutional_management',
    ]
  }

  return [
    'teacher',
  ]
}

function getExpirationDate(
  hours:
    number,
): string {
  return new Date(
    Date.now() +
      hours *
      60 *
      60 *
      1000,
  ).toISOString()
}

function createAlert({
  decision,
  title,
  message,
  severity,
  priority,
  audience,
  triggeredBy,
  expiresAt,
  metadata = {},
}: {
  decision:
    EducationalDecision

  title:
    string

  message:
    string

  severity:
    DecisionSeverity

  priority:
    DecisionPriority

  audience:
    DecisionAudience[]

  triggeredBy:
    string[]

  expiresAt:
    string | null

  metadata?:
    Record<string, unknown>
}): DecisionAlert {
  return {
    id:
      createId(
        'decision-alert',
      ),

    title,

    message,

    severity,

    priority,

    audience,

    triggeredBy:
      uniqueStrings(
        triggeredBy,
      ),

    acknowledged:
      false,

    acknowledgedBy:
      null,

    acknowledgedAt:
      null,

    expiresAt,

    active:
      true,

    metadata: {
      decisionId:
        decision.id,

      decisionType:
        decision.type,

      category:
        decision.category,

      generatedAt:
        nowIso(),

      generatedBy:
        'decision-alert-engine',

      ...metadata,
    },
  }
}

function generateRiskAlerts({
  decision,
  expirationHours,
}: {
  decision:
    EducationalDecision

  expirationHours:
    number
}): DecisionAlert[] {
  const alerts:
    DecisionAlert[] =
      []

  for (
    const risk
    of decision.risks
  ) {
    if (
      risk.riskLevel ===
        'none' ||
      risk.riskLevel ===
        'low'
    ) {
      continue
    }

    const severity:
      DecisionSeverity =
        risk.severity

    const priority:
      DecisionPriority =
        risk.riskLevel ===
          'critical'
          ? 'critical'
          : risk.riskLevel ===
              'high'
            ? 'urgent'
            : 'high'

    alerts.push(
      createAlert({
        decision,

        title:
          `Risco ${risk.riskType} identificado`,

        message:
          risk.explanation,

        severity,

        priority,

        audience:
          getAudience(
            decision,
          ),

        triggeredBy: [
          ...risk.indicators,
          `risk:${risk.riskType}`,
        ],

        expiresAt:
          getExpirationDate(
            expirationHours,
          ),

        metadata: {
          riskType:
            risk.riskType,

          riskLevel:
            risk.riskLevel,

          probability:
            risk.probability,

          impact:
            risk.impact,

          score:
            risk.score,
        },
      }),
    )
  }

  return alerts
}

function generateRecommendationAlerts({
  decision,
  recommendations,
  expirationHours,
}: {
  decision:
    EducationalDecision

  recommendations:
    DecisionRecommendation[]

  expirationHours:
    number
}): DecisionAlert[] {
  return recommendations
    .filter(
      recommendation =>
        recommendation.priority ===
          'urgent' ||
        recommendation.priority ===
          'critical' ||
        recommendation.urgency ===
          'immediate' ||
        recommendation.urgency ===
          'within_72_hours',
    )
    .map(
      recommendation =>
        createAlert({
          decision,

          title:
            recommendation.title,

          message:
            recommendation.description,

          severity:
            recommendation.priority ===
              'critical'
              ? 'critical'
              : recommendation.priority ===
                  'urgent'
                ? 'high'
                : 'medium',

          priority:
            recommendation.priority,

          audience:
            recommendation.audience,

          triggeredBy: [
            recommendation.id,
            recommendation.actionType,
            ...recommendation.evidenceIds,
          ],

          expiresAt:
            getExpirationDate(
              expirationHours,
            ),

          metadata: {
            recommendationId:
              recommendation.id,

            actionType:
              recommendation.actionType,

            confidence:
              recommendation.confidence,

            requiresApproval:
              recommendation.requiresApproval,
          },
        }),
    )
}

function generateHumanReviewAlert({
  decision,
  expirationHours,
}: {
  decision:
    EducationalDecision

  expirationHours:
    number
}): DecisionAlert | null {
  if (
    !decision.humanReviewRequired
  ) {
    return null
  }

  return createAlert({
    decision,

    title:
      'RevisÃ£o humana necessÃ¡ria',

    message:
      'A decisÃ£o nÃ£o deve ser aprovada ou executada antes da revisÃ£o por responsÃ¡vel autorizado.',

    severity:
      decision.severity ===
        'critical'
        ? 'critical'
        : 'high',

    priority:
      decision.priority ===
        'low' ||
      decision.priority ===
        'medium'
        ? 'high'
        : decision.priority,

    audience: [
      'coordinator',
      'school_management',
    ],

    triggeredBy: [
      decision.id,
      'human_review_required',
    ],

    expiresAt:
      getExpirationDate(
        expirationHours,
      ),

    metadata: {
      reason:
        'human_review_required',

      containsSensitiveData:
        decision.privacy
          .containsSensitiveData,

      containsMinorData:
        decision.privacy
          .containsMinorData,
    },
  })
}

function generateInformationalAlert({
  decision,
  expirationHours,
}: {
  decision:
    EducationalDecision

  expirationHours:
    number
}): DecisionAlert {
  return createAlert({
    decision,

    title:
      'DecisÃ£o educacional gerada',

    message:
      decision.explanation.summary ||
      decision.description,

    severity:
      'informational',

    priority:
      decision.priority,

    audience:
      getAudience(
        decision,
      ),

    triggeredBy: [
      decision.id,
    ],

    expiresAt:
      getExpirationDate(
        expirationHours,
      ),

    metadata: {
      informational:
        true,
    },
  })
}

function getAlertSignature(
  alert:
    DecisionAlert,
): string {
  return [
    alert.title
      .trim()
      .toLocaleLowerCase(
        'pt-BR',
      ),
    alert.message
      .trim()
      .toLocaleLowerCase(
        'pt-BR',
      ),
    alert.priority,
    alert.severity,
    alert.audience
      .slice()
      .sort()
      .join(','),
  ].join(
    '|',
  )
}

function deduplicateAlerts(
  alerts:
    DecisionAlert[],
): DecisionAlert[] {
  const signatures =
    new Set<string>()

  const result:
    DecisionAlert[] =
      []

  for (
    const alert
    of alerts
  ) {
    const signature =
      getAlertSignature(
        alert,
      )

    if (
      signatures.has(
        signature,
      )
    ) {
      continue
    }

    signatures.add(
      signature,
    )

    result.push(
      alert,
    )
  }

  return result
}

function getPriorityWeight(
  priority:
    DecisionPriority,
): number {
  switch (
    priority
  ) {
    case 'critical':
      return 5

    case 'urgent':
      return 4

    case 'high':
      return 3

    case 'medium':
      return 2

    case 'low':
    default:
      return 1
  }
}

function getSeverityWeight(
  severity:
    DecisionSeverity,
): number {
  switch (
    severity
  ) {
    case 'critical':
      return 5

    case 'high':
      return 4

    case 'medium':
      return 3

    case 'low':
      return 2

    case 'informational':
    default:
      return 1
  }
}

function sortAlerts(
  alerts:
    DecisionAlert[],
): DecisionAlert[] {
  return [
    ...alerts,
  ].sort(
    (
      first,
      second,
    ) => {
      const priorityDifference =
        getPriorityWeight(
          second.priority,
        ) -
        getPriorityWeight(
          first.priority,
        )

      if (
        priorityDifference !==
        0
      ) {
        return priorityDifference
      }

      const severityDifference =
        getSeverityWeight(
          second.severity,
        ) -
        getSeverityWeight(
          first.severity,
        )

      if (
        severityDifference !==
        0
      ) {
        return severityDifference
      }

      return first.id.localeCompare(
        second.id,
      )
    },
  )
}

export function generateDecisionAlerts({
  decision,
  options,
}: {
  decision:
    EducationalDecision

  options?:
    Partial<DecisionAlertGenerationOptions>
}): DecisionAlertGenerationResult {
  const normalizedOptions =
    normalizeOptions(
      options,
    )

  const warnings:
    string[] = []

  const errors:
    string[] = []

  const generated:
    DecisionAlert[] =
      []

  if (
    normalizedOptions
      .includeRiskAlerts
  ) {
    generated.push(
      ...generateRiskAlerts({
        decision,

        expirationHours:
          normalizedOptions
            .defaultExpirationHours,
      }),
    )
  }

  if (
    normalizedOptions
      .includeRecommendationAlerts
  ) {
    generated.push(
      ...generateRecommendationAlerts({
        decision,

        recommendations:
          decision.recommendations,

        expirationHours:
          normalizedOptions
            .defaultExpirationHours,
      }),
    )
  }

  if (
    normalizedOptions
      .includeHumanReviewAlerts
  ) {
    const humanReviewAlert =
      generateHumanReviewAlert({
        decision,

        expirationHours:
          normalizedOptions
            .defaultExpirationHours,
      })

    if (
      humanReviewAlert
    ) {
      generated.push(
        humanReviewAlert,
      )
    }
  }

  if (
    normalizedOptions
      .includeInformationalAlerts &&
    generated.length ===
      0
  ) {
    generated.push(
      generateInformationalAlert({
        decision,

        expirationHours:
          normalizedOptions
            .defaultExpirationHours,
      }),
    )
  }

  const deduplicated =
    sortAlerts(
      deduplicateAlerts(
        generated,
      ),
    )

  const alerts =
    deduplicated.slice(
      0,
      normalizedOptions
        .maximumAlertsPerDecision,
    )

  if (
    deduplicated.length >
    alerts.length
  ) {
    warnings.push(
      `O resultado foi limitado a ${normalizedOptions.maximumAlertsPerDecision} alertas.`,
    )
  }

  const requiresHumanReview =
    decision.humanReviewRequired ||
    alerts.some(
      alert =>
        alert.severity ===
          'critical' ||
        alert.priority ===
          'critical',
    )

  return {
    success:
      errors.length ===
      0,

    decisionId:
      decision.id,

    alerts,

    warnings:
      uniqueStrings(
        warnings,
      ),

    errors:
      uniqueStrings(
        errors,
      ),

    requiresHumanReview,
  }
}

export function generateDecisionAlertsBatch({
  decisions,
  options,
}: {
  decisions:
    EducationalDecision[]

  options?:
    Partial<DecisionAlertGenerationOptions>
}): DecisionAlertBatchResult {
  const results =
    decisions.map(
      decision =>
        generateDecisionAlerts({
          decision,
          options,
        }),
    )

  const alerts =
    sortAlerts(
      deduplicateAlerts(
        results.flatMap(
          result =>
            result.alerts,
        ),
      ),
    )

  const warnings =
    uniqueStrings(
      results.flatMap(
        result =>
          result.warnings,
      ),
    )

  const errors =
    uniqueStrings(
      results.flatMap(
        result =>
          result.errors,
      ),
    )

  return {
    success:
      errors.length ===
      0,

    results,

    alerts,

    warnings,

    errors,

    requiresHumanReview:
      results.some(
        result =>
          result
            .requiresHumanReview,
      ),
  }
}

export function acknowledgeDecisionAlert({
  alert,
  acknowledgedBy,
}: {
  alert:
    DecisionAlert

  acknowledgedBy:
    string
}): DecisionAlert {
  return {
    ...alert,

    acknowledged:
      true,

    acknowledgedBy,

    acknowledgedAt:
      nowIso(),

    metadata: {
      ...alert.metadata,

      acknowledgedAt:
        nowIso(),
    },
  }
}

export function deactivateExpiredDecisionAlert(
  alert:
    DecisionAlert,
): DecisionAlert {
  if (
    !alert.expiresAt
  ) {
    return alert
  }

  if (
    Date.parse(
      alert.expiresAt,
    ) >
    Date.now()
  ) {
    return alert
  }

  return {
    ...alert,

    active:
      false,

    metadata: {
      ...alert.metadata,

      expiredAt:
        nowIso(),
    },
  }
}

export function applyDecisionAlerts({
  decision,
  options,
}: {
  decision:
    EducationalDecision

  options?:
    Partial<DecisionAlertGenerationOptions>
}): EducationalDecision {
  const generation =
    generateDecisionAlerts({
      decision,
      options,
    })

  return {
    ...decision,

    alerts:
      generation.alerts,

    humanReviewRequired:
      decision
        .humanReviewRequired ||
      generation
        .requiresHumanReview,

    updatedAt:
      nowIso(),

    auditTrail: [
      ...decision.auditTrail,

      {
        id:
          createId(
            'audit-alert',
          ),

        action:
          'alerted',

        actorId:
          null,

        actorType:
          'service',

        occurredAt:
          nowIso(),

        previousStatus:
          decision.status,

        nextStatus:
          decision.status,

        description:
          'Alertas gerados pelo Decision Alert Engine.',

        changes: {
          alertCount:
            generation
              .alerts
              .length,

          requiresHumanReview:
            generation
              .requiresHumanReview,
        },

        metadata: {
          engine:
            'decision-alert',

          version:
            'v1',

          warnings:
            generation.warnings,
        },
      },
    ],

    metadata: {
      ...decision.metadata,

      alertGeneration: {
        generatedAt:
          nowIso(),

        alertCount:
          generation
            .alerts
            .length,

        warnings:
          generation.warnings,

        errors:
          generation.errors,
      },
    },
  }
}

export function createDefaultDecisionAlertOptions():
  DecisionAlertGenerationOptions {
  return {
    ...DEFAULT_OPTIONS,
  }
}

export const decisionAlertService = {
  generate:
    generateDecisionAlerts,

  generateBatch:
    generateDecisionAlertsBatch,

  acknowledge:
    acknowledgeDecisionAlert,

  deactivateExpired:
    deactivateExpiredDecisionAlert,

  apply:
    applyDecisionAlerts,

  createDefaultOptions:
    createDefaultDecisionAlertOptions,
}
