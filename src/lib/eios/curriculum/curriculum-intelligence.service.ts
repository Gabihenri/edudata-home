import {
  clampCurriculumConfidence,
  clampCurriculumPercentage,
  createEmptyCurriculumCoverageSummary,
  type CurriculumApplicabilityContext,
  type CurriculumApplicabilityRule,
  type CurriculumCoverageRecord,
  type CurriculumCoverageSummary,
  type CurriculumFramework,
  type CurriculumGap,
  type CurriculumIntelligenceContext,
  type CurriculumNode,
  type CurriculumPriority,
  type CurriculumRecommendation,
  type CurriculumResolutionInput,
  type CurriculumResolutionResult,
  type CurriculumResolvedFramework,
  type CurriculumTerritory,
  type CurriculumVersion,
} from './curriculum-intelligence.contract'

export type CurriculumIntelligenceServiceInput = {
  frameworks:
    CurriculumFramework[]

  versions:
    CurriculumVersion[]

  territories?:
    CurriculumTerritory[]

  applicabilityRules:
    CurriculumApplicabilityRule[]

  nodes?:
    CurriculumNode[]

  coverageRecords?:
    CurriculumCoverageRecord[]
}

export type CurriculumCoverageAnalysisInput = {
  nodes:
    CurriculumNode[]

  coverageRecords:
    CurriculumCoverageRecord[]

  context?:
    Partial<CurriculumApplicabilityContext>

  mandatoryOnly?:
    boolean
}

export type CurriculumCoverageAnalysisResult = {
  success:
    boolean

  summary:
    CurriculumCoverageSummary

  applicableNodes:
    CurriculumNode[]

  records:
    CurriculumCoverageRecord[]

  gaps:
    CurriculumGap[]

  recommendations:
    CurriculumRecommendation[]

  warnings:
    string[]

  errors:
    string[]
}

const MAX_RESOLVED_FRAMEWORKS =
  20

const HIGH_CONFIDENCE_THRESHOLD =
  0.85

const MEDIUM_CONFIDENCE_THRESHOLD =
  0.65

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

function normalizeOptionalString(
  value:
    string | null | undefined,
): string | null {
  const normalized =
    value?.trim()

  return normalized
    ? normalized
    : null
}

function sameOptionalValue(
  ruleValue:
    string | null,

  contextValue:
    string | null,
): boolean {
  if (!ruleValue) {
    return true
  }

  return (
    ruleValue ===
    contextValue
  )
}

function sameOptionalNumber(
  ruleValue:
    number | null,

  contextValue:
    number | null,
): boolean {
  if (
    ruleValue ===
    null
  ) {
    return true
  }

  return (
    ruleValue ===
    contextValue
  )
}

function isDateInsideVersion({
  academicYear,
  version,
}: {
  academicYear:
    number | null

  version:
    CurriculumVersion
}): boolean {
  if (
    academicYear ===
    null
  ) {
    return true
  }

  const startYear =
    version.validFrom
      ? new Date(
          version.validFrom,
        ).getUTCFullYear()
      : null

  const endYear =
    version.validUntil
      ? new Date(
          version.validUntil,
        ).getUTCFullYear()
      : null

  if (
    startYear !==
      null &&
    academicYear <
      startYear
  ) {
    return false
  }

  if (
    endYear !==
      null &&
    academicYear >
      endYear
  ) {
    return false
  }

  return true
}

function matchesApplicabilityContext({
  rule,
  inputContext,
}: {
  rule:
    CurriculumApplicabilityRule

  inputContext:
    CurriculumApplicabilityContext
}): boolean {
  const ruleContext =
    rule.context

  return (
    sameOptionalValue(
      ruleContext.institutionId,
      inputContext.institutionId,
    ) &&
    sameOptionalValue(
      ruleContext.campusId,
      inputContext.campusId,
    ) &&
    sameOptionalValue(
      ruleContext.schoolId,
      inputContext.schoolId,
    ) &&
    sameOptionalValue(
      ruleContext.programId,
      inputContext.programId,
    ) &&
    sameOptionalValue(
      ruleContext.courseId,
      inputContext.courseId,
    ) &&
    sameOptionalValue(
      ruleContext.curriculumMatrixId,
      inputContext.curriculumMatrixId,
    ) &&
    sameOptionalValue(
      ruleContext.componentId,
      inputContext.componentId,
    ) &&
    sameOptionalValue(
      ruleContext.offeringId,
      inputContext.offeringId,
    ) &&
    sameOptionalValue(
      ruleContext.classId,
      inputContext.classId,
    ) &&
    sameOptionalValue(
      ruleContext.academicPeriodId,
      inputContext.academicPeriodId,
    ) &&
    (
      !ruleContext.educationLevel ||
      ruleContext.educationLevel ===
        inputContext.educationLevel
    ) &&
    sameOptionalValue(
      ruleContext.countryCode,
      inputContext.countryCode,
    ) &&
    sameOptionalValue(
      ruleContext.stateCode,
      inputContext.stateCode,
    ) &&
    sameOptionalValue(
      ruleContext.municipalityCode,
      inputContext.municipalityCode,
    ) &&
    sameOptionalNumber(
      ruleContext.academicYear,
      inputContext.academicYear,
    )
  )
}

function calculateSpecificity(
  rule:
    CurriculumApplicabilityRule,
): number {
  const context =
    rule.context

  const values = [
    context.institutionId,
    context.campusId,
    context.schoolId,
    context.programId,
    context.courseId,
    context.curriculumMatrixId,
    context.componentId,
    context.offeringId,
    context.classId,
    context.academicPeriodId,
    context.educationLevel,
    context.countryCode,
    context.stateCode,
    context.municipalityCode,
    context.academicYear,
  ]

  return values.filter(
    value =>
      value !==
        null &&
      value !==
        undefined,
  ).length
}

function calculateResolutionConfidence({
  rule,
  version,
}: {
  rule:
    CurriculumApplicabilityRule

  version:
    CurriculumVersion
}): number {
  const specificity =
    calculateSpecificity(
      rule,
    )

  const specificityScore =
    Math.min(
      0.45,
      specificity *
        0.03,
    )

  const mandatoryScore =
    rule.mandatory
      ? 0.2
      : 0.1

  const versionScore =
    version.status ===
      'active'
      ? 0.25
      : version.status ===
          'under_review'
        ? 0.12
        : 0.05

  const priorityScore =
    Math.min(
      0.1,
      Math.max(
        0,
        rule.priority,
      ) /
        100,
    )

  return clampCurriculumConfidence(
    specificityScore +
      mandatoryScore +
      versionScore +
      priorityScore,
  )
}

function getFrameworkSourceExplanation({
  framework,
  version,
  rule,
}: {
  framework:
    CurriculumFramework

  version:
    CurriculumVersion

  rule:
    CurriculumApplicabilityRule
}): string {
  const parts = [
    `${framework.name} — versão ${version.version}.`,
  ]

  if (
    rule.explanation
  ) {
    parts.push(
      rule.explanation,
    )
  }

  parts.push(
    rule.mandatory
      ? 'Aplicação obrigatória para o contexto informado.'
      : 'Aplicação complementar ou opcional para o contexto informado.',
  )

  return parts.join(
    ' ',
  )
}

function createResolvedFramework({
  framework,
  version,
  rule,
}: {
  framework:
    CurriculumFramework

  version:
    CurriculumVersion

  rule:
    CurriculumApplicabilityRule
}): CurriculumResolvedFramework {
  const confidence =
    calculateResolutionConfidence({
      rule,
      version,
    })

  return {
    frameworkId:
      framework.id,

    versionId:
      version.id,

    territoryId:
      rule.territoryId,

    priority:
      rule.priority,

    mandatory:
      rule.mandatory,

    source:
      framework.source,

    explanation:
      getFrameworkSourceExplanation({
        framework,
        version,
        rule,
      }),

    confidence,

    requiresHumanReview:
      confidence <
        MEDIUM_CONFIDENCE_THRESHOLD ||
      version.status !==
        'active',
  }
}

function findFramework(
  frameworks:
    CurriculumFramework[],

  frameworkId:
    string,
): CurriculumFramework | null {
  return (
    frameworks.find(
      framework =>
        framework.id ===
          frameworkId &&
        framework.status !==
          'revoked' &&
        framework.status !==
          'archived',
    ) ??
    null
  )
}

function findVersion(
  versions:
    CurriculumVersion[],

  versionId:
    string,
): CurriculumVersion | null {
  return (
    versions.find(
      version =>
        version.id ===
          versionId &&
        version.status !==
          'revoked' &&
        version.status !==
          'archived',
    ) ??
    null
  )
}

function filterRequestedRules({
  rules,
  input,
}: {
  rules:
    CurriculumApplicabilityRule[]

  input:
    CurriculumResolutionInput
}): CurriculumApplicabilityRule[] {
  return rules.filter(
    rule => {
      if (
        !rule.active
      ) {
        return false
      }

      if (
        input
          .requestedFrameworkIds
          ?.length &&
        !input
          .requestedFrameworkIds
          .includes(
            rule.frameworkId,
          )
      ) {
        return false
      }

      if (
        input
          .requestedVersionIds
          ?.length &&
        !input
          .requestedVersionIds
          .includes(
            rule.versionId,
          )
      ) {
        return false
      }

      if (
        !input.includeOptional &&
        !rule.mandatory
      ) {
        return false
      }

      return matchesApplicabilityContext({
        rule,
        inputContext:
          input.context,
      })
    },
  )
}

function sortResolvedFrameworks(
  frameworks:
    CurriculumResolvedFramework[],
): CurriculumResolvedFramework[] {
  return [
    ...frameworks,
  ].sort(
    (
      left,
      right,
    ) => {
      if (
        left.mandatory !==
        right.mandatory
      ) {
        return left.mandatory
          ? -1
          : 1
      }

      if (
        right.priority !==
        left.priority
      ) {
        return (
          right.priority -
          left.priority
        )
      }

      return (
        right.confidence -
        left.confidence
      )
    },
  )
}

function removeDuplicateFrameworks(
  frameworks:
    CurriculumResolvedFramework[],
): CurriculumResolvedFramework[] {
  const resolved =
    new Map<
      string,
      CurriculumResolvedFramework
    >()

  for (
    const framework
    of frameworks
  ) {
    const key =
      [
        framework.frameworkId,
        framework.versionId,
        framework.territoryId ??
          'global',
      ].join(
        ':',
      )

    const current =
      resolved.get(
        key,
      )

    if (
      !current ||
      framework.priority >
        current.priority ||
      framework.confidence >
        current.confidence
    ) {
      resolved.set(
        key,
        framework,
      )
    }
  }

  return Array.from(
    resolved.values(),
  )
}

export function resolveApplicableCurriculumFrameworks({
  frameworks,
  versions,
  applicabilityRules,
  input,
}: {
  frameworks:
    CurriculumFramework[]

  versions:
    CurriculumVersion[]

  applicabilityRules:
    CurriculumApplicabilityRule[]

  input:
    CurriculumResolutionInput
}): CurriculumResolutionResult {
  const errors:
    string[] = []

  const warnings:
    string[] = []

  if (
    frameworks.length ===
    0
  ) {
    errors.push(
      'Nenhum referencial curricular foi disponibilizado para resolução.',
    )
  }

  if (
    versions.length ===
    0
  ) {
    errors.push(
      'Nenhuma versão curricular foi disponibilizada para resolução.',
    )
  }

  if (
    applicabilityRules.length ===
    0
  ) {
    errors.push(
      'Nenhuma regra de aplicabilidade curricular foi disponibilizada.',
    )
  }

  if (
    errors.length >
    0
  ) {
    return {
      success:
        false,

      resolvedFrameworks:
        [],

      primaryFramework:
        null,

      warnings,

      errors,

      requiresHumanReview:
        true,
    }
  }

  const candidateRules =
    filterRequestedRules({
      rules:
        applicabilityRules,

      input,
    })

  const resolvedFrameworks:
    CurriculumResolvedFramework[] = []

  for (
    const rule
    of candidateRules
  ) {
    const framework =
      findFramework(
        frameworks,
        rule.frameworkId,
      )

    const version =
      findVersion(
        versions,
        rule.versionId,
      )

    if (
      !framework
    ) {
      warnings.push(
        `O referencial ${rule.frameworkId} definido na regra ${rule.id} não foi encontrado ou não está disponível.`,
      )

      continue
    }

    if (
      !version
    ) {
      warnings.push(
        `A versão ${rule.versionId} definida na regra ${rule.id} não foi encontrada ou não está disponível.`,
      )

      continue
    }

    if (
      version.frameworkId !==
      framework.id
    ) {
      warnings.push(
        `A versão ${version.id} não pertence ao referencial ${framework.id}.`,
      )

      continue
    }

    if (
      !isDateInsideVersion({
        academicYear:
          input
            .context
            .academicYear,

        version,
      })
    ) {
      warnings.push(
        `A versão ${version.version} de ${framework.name} não está vigente no ano acadêmico informado.`,
      )

      continue
    }

    resolvedFrameworks.push(
      createResolvedFramework({
        framework,
        version,
        rule,
      }),
    )
  }

  const normalizedFrameworks =
    sortResolvedFrameworks(
      removeDuplicateFrameworks(
        resolvedFrameworks,
      ),
    ).slice(
      0,
      MAX_RESOLVED_FRAMEWORKS,
    )

  if (
    normalizedFrameworks.length ===
    0
  ) {
    warnings.push(
      'Nenhum currículo aplicável foi encontrado para o contexto informado.',
    )
  }

  const primaryFramework =
    normalizedFrameworks[0] ??
    null

  const ambiguousPrimary =
    normalizedFrameworks.length >
      1 &&
    normalizedFrameworks[0]
      .priority ===
      normalizedFrameworks[1]
        .priority &&
    Math.abs(
      normalizedFrameworks[0]
        .confidence -
        normalizedFrameworks[1]
          .confidence,
    ) <
      0.05

  if (
    ambiguousPrimary
  ) {
    warnings.push(
      'Mais de um referencial possui prioridade e confiança semelhantes. A seleção principal requer confirmação humana.',
    )
  }

  const requiresHumanReview =
    normalizedFrameworks.length ===
      0 ||
    ambiguousPrimary ||
    normalizedFrameworks.some(
      framework =>
        framework
          .requiresHumanReview,
    )

  return {
    success:
      normalizedFrameworks.length >
      0,

    resolvedFrameworks:
      normalizedFrameworks,

    primaryFramework,

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

function matchesCoverageContext({
  record,
  context,
}: {
  record:
    CurriculumCoverageRecord

  context:
    Partial<CurriculumApplicabilityContext>
}): boolean {
  return (
    (
      !context.institutionId ||
      record.institutionId ===
        context.institutionId
    ) &&
    (
      !context.programId ||
      record.programId ===
        context.programId
    ) &&
    (
      !context.courseId ||
      record.courseId ===
        context.courseId
    ) &&
    (
      !context.offeringId ||
      record.offeringId ===
        context.offeringId
    ) &&
    (
      !context.classId ||
      record.classId ===
        context.classId
    ) &&
    (
      !context.componentId ||
      record.componentId ===
        context.componentId
    ) &&
    (
      !context.academicPeriodId ||
      record.academicPeriodId ===
        context.academicPeriodId
    )
  )
}

function isApplicableNode({
  node,
  context,
  mandatoryOnly,
}: {
  node:
    CurriculumNode

  context:
    Partial<CurriculumApplicabilityContext>

  mandatoryOnly:
    boolean
}): boolean {
  if (
    !node.active
  ) {
    return false
  }

  if (
    mandatoryOnly &&
    node.priority !==
      'mandatory' &&
    node.priority !==
      'critical'
  ) {
    return false
  }

  if (
    context.educationLevel &&
    node.educationLevel &&
    context.educationLevel !==
      node.educationLevel
  ) {
    return false
  }

  if (
    context.componentId &&
    node.componentId &&
    context.componentId !==
      node.componentId
  ) {
    return false
  }

  if (
    context.programId &&
    node.programId &&
    context.programId !==
      node.programId
  ) {
    return false
  }

  if (
    context.courseId &&
    node.courseId &&
    context.courseId !==
      node.courseId
  ) {
    return false
  }

  return true
}

function calculatePercentage(
  value:
    number,

  total:
    number,
): number {
  if (
    total <=
    0
  ) {
    return 0
  }

  return clampCurriculumPercentage(
    (
      value /
      total
    ) *
      100,
  )
}

function buildCoverageSummary({
  nodes,
  records,
}: {
  nodes:
    CurriculumNode[]

  records:
    CurriculumCoverageRecord[]
}): CurriculumCoverageSummary {
  const summary =
    createEmptyCurriculumCoverageSummary()

  const recordsByNode =
    new Map<
      string,
      CurriculumCoverageRecord
    >()

  for (
    const record
    of records
  ) {
    recordsByNode.set(
      record.curriculumNodeId,
      record,
    )
  }

  summary.totalNodes =
    nodes.length

  summary.mandatoryNodes =
    nodes.filter(
      node =>
        node.priority ===
          'mandatory' ||
        node.priority ===
          'critical',
    ).length

  for (
    const node
    of nodes
  ) {
    const record =
      recordsByNode.get(
        node.id,
      )

    if (!record) {
      continue
    }

    if (
      record.plannedCount >
        0 ||
      record.status !==
        'not_planned'
    ) {
      summary.plannedNodes +=
        1
    }

    if (
      record.lessonCount >
        0 ||
      [
        'worked',
        'assessed',
        'evidenced',
        'consolidated',
        'needs_recovery',
      ].includes(
        record.status,
      )
    ) {
      summary.workedNodes +=
        1
    }

    if (
      record.assessmentCount >
        0 ||
      [
        'assessed',
        'evidenced',
        'consolidated',
        'needs_recovery',
      ].includes(
        record.status,
      )
    ) {
      summary.assessedNodes +=
        1
    }

    if (
      record.evidenceCount >
        0 ||
      [
        'evidenced',
        'consolidated',
      ].includes(
        record.status,
      )
    ) {
      summary.evidencedNodes +=
        1
    }

    if (
      record.status ===
      'consolidated'
    ) {
      summary.consolidatedNodes +=
        1
    }

    if (
      record.status ===
        'needs_recovery' ||
      record.interventionCount >
        0
    ) {
      summary.recoveryNodes +=
        1
    }
  }

  summary.plannedPercentage =
    calculatePercentage(
      summary.plannedNodes,
      summary.totalNodes,
    )

  summary.workedPercentage =
    calculatePercentage(
      summary.workedNodes,
      summary.totalNodes,
    )

  summary.assessedPercentage =
    calculatePercentage(
      summary.assessedNodes,
      summary.totalNodes,
    )

  summary.evidencedPercentage =
    calculatePercentage(
      summary.evidencedNodes,
      summary.totalNodes,
    )

  summary.consolidatedPercentage =
    calculatePercentage(
      summary.consolidatedNodes,
      summary.totalNodes,
    )

  return summary
}

function createGap({
  node,
  type,
  severity,
  explanation,
  recommendedAction,
  requiresHumanReview = false,
}: {
  node:
    CurriculumNode

  type:
    CurriculumGap['type']

  severity:
    CurriculumGap['severity']

  explanation:
    string

  recommendedAction:
    string | null

  requiresHumanReview?:
    boolean
}): CurriculumGap {
  return {
    id:
      [
        'curriculum-gap',
        node.id,
        type,
      ].join(
        ':',
      ),

    curriculumNodeId:
      node.id,

    type,

    severity,

    explanation,

    recommendedAction,

    requiresHumanReview,

    metadata: {
      nodeCode:
        node.code,

      nodeTitle:
        node.title,

      nodePriority:
        node.priority,
    },
  }
}

function severityForPriority(
  priority:
    CurriculumPriority,
): CurriculumGap['severity'] {
  if (
    priority ===
    'critical'
  ) {
    return 'critical'
  }

  if (
    priority ===
    'mandatory' ||
    priority ===
      'essential'
  ) {
    return 'high'
  }

  if (
    priority ===
    'recommended'
  ) {
    return 'medium'
  }

  return 'low'
}

function detectCoverageGaps({
  nodes,
  records,
}: {
  nodes:
    CurriculumNode[]

  records:
    CurriculumCoverageRecord[]
}): CurriculumGap[] {
  const gaps:
    CurriculumGap[] = []

  const recordsByNode =
    new Map<
      string,
      CurriculumCoverageRecord
    >()

  for (
    const record
    of records
  ) {
    recordsByNode.set(
      record.curriculumNodeId,
      record,
    )
  }

  for (
    const node
    of nodes
  ) {
    const record =
      recordsByNode.get(
        node.id,
      )

    const severity =
      severityForPriority(
        node.priority,
      )

    if (!record) {
      gaps.push(
        createGap({
          node,

          type:
            'not_planned',

          severity,

          explanation:
            `O item curricular "${node.title}" ainda não possui registros de planejamento ou execução.`,

          recommendedAction:
            'Revisar o planejamento do período e definir quando este item curricular será trabalhado.',
        }),
      )

      continue
    }

    if (
      record.plannedCount ===
        0 &&
      record.status ===
        'not_planned'
    ) {
      gaps.push(
        createGap({
          node,

          type:
            'not_planned',

          severity,

          explanation:
            `O item curricular "${node.title}" ainda não foi incorporado ao planejamento.`,

          recommendedAction:
            'Vincular o item curricular a um planejamento compatível com a turma e o período.',
        }),
      )
    }

    if (
      record.plannedCount >
        0 &&
      record.lessonCount ===
        0
    ) {
      gaps.push(
        createGap({
          node,

          type:
            'not_worked',

          severity,

          explanation:
            `O item curricular "${node.title}" foi planejado, mas ainda não possui aula ou experiência de aprendizagem registrada.`,

          recommendedAction:
            'Revisar o cronograma e registrar a experiência de aprendizagem correspondente.',
        }),
      )
    }

    if (
      record.lessonCount >
        0 &&
      record.assessmentCount ===
        0
    ) {
      gaps.push(
        createGap({
          node,

          type:
            'not_assessed',

          severity:
            severity ===
              'critical'
              ? 'high'
              : severity,

          explanation:
            `O item curricular "${node.title}" foi trabalhado, mas ainda não possui avaliação vinculada.`,

          recommendedAction:
            'Definir uma avaliação ou estratégia formativa que permita verificar a aprendizagem.',
        }),
      )
    }

    if (
      record.lessonCount >
        0 &&
      record.evidenceCount ===
        0
    ) {
      gaps.push(
        createGap({
          node,

          type:
            'not_evidenced',

          severity:
            severity ===
              'critical'
              ? 'high'
              : severity,

          explanation:
            `O item curricular "${node.title}" foi trabalhado, mas ainda não possui evidências registradas.`,

          recommendedAction:
            'Registrar evidências relacionadas à aula, atividade, avaliação ou produção acadêmica.',
        }),
      )
    }

    if (
      record.averagePerformance !==
        null &&
      node.masteryThreshold !==
        null &&
      record.averagePerformance <
        node.masteryThreshold
    ) {
      gaps.push(
        createGap({
          node,

          type:
            'low_performance',

          severity:
            node.priority ===
              'critical'
              ? 'critical'
              : 'high',

          explanation:
            `O desempenho médio de ${record.averagePerformance} está abaixo do nível de domínio esperado de ${node.masteryThreshold}.`,

          recommendedAction:
            'Analisar os resultados por estudante, avaliação e evidência antes de planejar uma intervenção ou recomposição.',

          requiresHumanReview:
            true,
        }),
      )
    }
  }

  return gaps
}

function recommendationPriorityFromGap(
  gap:
    CurriculumGap,
): CurriculumPriority {
  if (
    gap.severity ===
    'critical'
  ) {
    return 'critical'
  }

  if (
    gap.severity ===
    'high'
  ) {
    return 'mandatory'
  }

  if (
    gap.severity ===
    'medium'
  ) {
    return 'essential'
  }

  return 'recommended'
}

function recommendationTypeFromGap(
  gap:
    CurriculumGap,
): CurriculumRecommendation['type'] {
  if (
    gap.type ===
    'not_planned'
  ) {
    return 'planning'
  }

  if (
    gap.type ===
    'not_assessed'
  ) {
    return 'assessment'
  }

  if (
    gap.type ===
    'not_evidenced'
  ) {
    return 'evidence'
  }

  if (
    gap.type ===
      'low_performance' ||
    gap.type ===
      'missing_prerequisite'
  ) {
    return 'recovery'
  }

  if (
    gap.type ===
      'sequence_break'
  ) {
    return 'sequence'
  }

  return 'review'
}

function createRecommendationsFromGaps(
  gaps:
    CurriculumGap[],
): CurriculumRecommendation[] {
  return gaps.map(
    gap => ({
      id:
        `curriculum-recommendation:${gap.id}`,

      curriculumNodeId:
        gap.curriculumNodeId,

      type:
        recommendationTypeFromGap(
          gap,
        ),

      priority:
        recommendationPriorityFromGap(
          gap,
        ),

      title:
        gap.type ===
          'low_performance'
          ? 'Revisar aprendizagem e planejar intervenção'
          : 'Tratar lacuna curricular identificada',

      description:
        gap.recommendedAction ??
        gap.explanation,

      reason:
        gap.explanation,

      expectedImpact:
        gap.type ===
          'low_performance'
          ? 'Apoiar a recuperação da aprendizagem e acompanhar a evolução posterior.'
          : 'Ampliar a cobertura e a rastreabilidade do currículo.',

      actionLabel:
        null,

      actionHref:
        null,

      confidence:
        gap.requiresHumanReview
          ? 0.65
          : 0.9,

      requiresConfirmation:
        true,

      automaticExecutionAllowed:
        false,

      metadata: {
        gapId:
          gap.id,

        severity:
          gap.severity,
      },
    }),
  )
}

export function analyzeCurriculumCoverage(
  input:
    CurriculumCoverageAnalysisInput,
): CurriculumCoverageAnalysisResult {
  const warnings:
    string[] = []

  const errors:
    string[] = []

  const context =
    input.context ??
    {}

  const mandatoryOnly =
    input.mandatoryOnly ??
    false

  const applicableNodes =
    input.nodes.filter(
      node =>
        isApplicableNode({
          node,
          context,
          mandatoryOnly,
        }),
    )

  const applicableNodeIds =
    new Set(
      applicableNodes.map(
        node =>
          node.id,
      ),
    )

  const records =
    input
      .coverageRecords
      .filter(
        record =>
          applicableNodeIds.has(
            record.curriculumNodeId,
          ) &&
          matchesCoverageContext({
            record,
            context,
          }),
      )

  if (
    applicableNodes.length ===
    0
  ) {
    warnings.push(
      'Nenhum item curricular aplicável foi encontrado para o contexto informado.',
    )
  }

  if (
    applicableNodes.length >
      0 &&
    records.length ===
      0
  ) {
    warnings.push(
      'Existem itens curriculares aplicáveis, mas ainda não há registros de cobertura para o contexto.',
    )
  }

  const summary =
    buildCoverageSummary({
      nodes:
        applicableNodes,

      records,
    })

  const gaps =
    detectCoverageGaps({
      nodes:
        applicableNodes,

      records,
    })

  const recommendations =
    createRecommendationsFromGaps(
      gaps,
    )

  return {
    success:
      errors.length ===
      0,

    summary,

    applicableNodes,

    records,

    gaps,

    recommendations,

    warnings:
      uniqueStrings(
        warnings,
      ),

    errors:
      uniqueStrings(
        errors,
      ),
  }
}

export function buildCurriculumIntelligenceContext({
  baseContext,
  coverageAnalysis,
}: {
  baseContext:
    CurriculumIntelligenceContext

  coverageAnalysis:
    CurriculumCoverageAnalysisResult
}): CurriculumIntelligenceContext {
  const warnings =
    uniqueStrings([
      ...baseContext
        .metadata
        .warnings,

      ...coverageAnalysis
        .warnings,

      ...coverageAnalysis
        .errors,
    ])

  return {
    ...baseContext,

    metadata: {
      ...baseContext
        .metadata,

      generatedAt:
        new Date()
          .toISOString(),

      dataQuality:
        coverageAnalysis
          .applicableNodes
          .length ===
          0
          ? 'insufficient'
          : coverageAnalysis
                .records
                .length ===
              coverageAnalysis
                .applicableNodes
                .length
            ? 'complete'
            : 'partial',

      warnings,

      humanReviewRequired:
        coverageAnalysis
          .gaps
          .some(
            gap =>
              gap.requiresHumanReview ||
              gap.severity ===
                'critical',
          ),
    },

    coverageRecords:
      coverageAnalysis
        .records,

    gaps:
      coverageAnalysis
        .gaps,

    recommendations:
      coverageAnalysis
        .recommendations,
  }
}

export function getCurriculumResolutionConfidenceLabel(
  confidence:
    number,
):
  | 'unknown'
  | 'low'
  | 'medium'
  | 'high'
  | 'verified' {
  const normalized =
    clampCurriculumConfidence(
      confidence,
    )

  if (
    normalized >=
    0.98
  ) {
    return 'verified'
  }

  if (
    normalized >=
    HIGH_CONFIDENCE_THRESHOLD
  ) {
    return 'high'
  }

  if (
    normalized >=
    MEDIUM_CONFIDENCE_THRESHOLD
  ) {
    return 'medium'
  }

  if (
    normalized >
    0
  ) {
    return 'low'
  }

  return 'unknown'
}

export const curriculumIntelligenceService = {
  resolveApplicableFrameworks:
    resolveApplicableCurriculumFrameworks,

  analyzeCoverage:
    analyzeCurriculumCoverage,

  buildContext:
    buildCurriculumIntelligenceContext,

  getConfidenceLabel:
    getCurriculumResolutionConfidenceLabel,
}