import {
  clampDecisionConfidence,
  clampDecisionPercentage,
  getDecisionConfidenceLevel,
  type DecisionRule,
  type DecisionRuleCondition,
  type DecisionRuleExecutionResult,
  type DecisionRuleOutcome,
  type EducationalDecision,
} from './decision-intelligence.contract'

export type DecisionRuleEvaluationContext = {
  decision: EducationalDecision
  additionalData?: Record<string, unknown>
}

export type DecisionRuleEvaluationResult = {
  success: boolean
  execution: DecisionRuleExecutionResult
  outcome: DecisionRuleOutcome | null
  warnings: string[]
  errors: string[]
}

export type DecisionRuleBatchEvaluationResult = {
  success: boolean
  executions: DecisionRuleExecutionResult[]
  matchedRules: DecisionRule[]
  unmatchedRules: DecisionRule[]
  warnings: string[]
  errors: string[]
}

type ConditionEvaluationResult = {
  conditionId: string
  matched: boolean
  score: number
  warning: string | null
  error: string | null
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.map(value => value.trim()).filter(Boolean)))
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function normalizeComparableValue(value: unknown): unknown {
  return typeof value === 'string'
    ? value.trim().toLocaleLowerCase('pt-BR')
    : value
}

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string' && value.trim()) {
    const normalized = Number(value.replace(',', '.'))
    return Number.isFinite(normalized) ? normalized : null
  }

  return null
}

function getValueByPath(source: unknown, path: string): unknown {
  if (!path.trim()) {
    return undefined
  }

  const segments = path.split('.').map(segment => segment.trim()).filter(Boolean)
  let current: unknown = source

  for (const segment of segments) {
    if (Array.isArray(current)) {
      const arrayIndex = Number(segment)
      if (Number.isInteger(arrayIndex)) {
        current = current[arrayIndex]
        continue
      }

      return current.map(item => isRecord(item) ? item[segment] : undefined)
    }

    if (!isRecord(current)) {
      return undefined
    }

    current = current[segment]
  }

  return current
}

function containsValue(currentValue: unknown, expectedValue: unknown): boolean {
  const normalizedExpected = normalizeComparableValue(expectedValue)

  if (Array.isArray(currentValue)) {
    return currentValue.some(item => normalizeComparableValue(item) === normalizedExpected)
  }

  if (typeof currentValue === 'string') {
    return currentValue
      .toLocaleLowerCase('pt-BR')
      .includes(String(normalizedExpected ?? ''))
  }

  if (isRecord(currentValue)) {
    return Object.values(currentValue).some(
      item => normalizeComparableValue(item) === normalizedExpected,
    )
  }

  return false
}

function valuesAreEqual(currentValue: unknown, expectedValue: unknown): boolean {
  if (Array.isArray(currentValue) && Array.isArray(expectedValue)) {
    return currentValue.length === expectedValue.length &&
      currentValue.every((item, index) => valuesAreEqual(item, expectedValue[index]))
  }

  const currentNumber = toFiniteNumber(currentValue)
  const expectedNumber = toFiniteNumber(expectedValue)

  if (currentNumber !== null && expectedNumber !== null) {
    return currentNumber === expectedNumber
  }

  return normalizeComparableValue(currentValue) === normalizeComparableValue(expectedValue)
}

function valueExists(value: unknown): boolean {
  if (value === undefined || value === null) {
    return false
  }

  if (typeof value === 'string') {
    return Boolean(value.trim())
  }

  if (Array.isArray(value)) {
    return value.length > 0
  }

  return true
}

function evaluateTrend(value: unknown, direction: 'up' | 'down'): boolean {
  if (!Array.isArray(value)) {
    return false
  }

  const numericValues = value
    .map(toFiniteNumber)
    .filter((item): item is number => item !== null)

  if (numericValues.length < 2) {
    return false
  }

  const middle = Math.max(1, Math.floor(numericValues.length / 2))
  const firstPeriod = numericValues.slice(0, middle)
  const secondPeriod = numericValues.slice(middle)

  if (secondPeriod.length === 0) {
    return false
  }

  const firstAverage = firstPeriod.reduce((total, item) => total + item, 0) / firstPeriod.length
  const secondAverage = secondPeriod.reduce((total, item) => total + item, 0) / secondPeriod.length

  return direction === 'up'
    ? secondAverage > firstAverage
    : secondAverage < firstAverage
}

function evaluateConditionOperator({
  condition,
  currentValue,
}: {
  condition: DecisionRuleCondition
  currentValue: unknown
}): boolean {
  const currentNumber = toFiniteNumber(currentValue)
  const expectedNumber = toFiniteNumber(condition.value)

  switch (condition.operator) {
    case 'equals':
      return valuesAreEqual(currentValue, condition.value)
    case 'not_equals':
      return !valuesAreEqual(currentValue, condition.value)
    case 'greater_than':
      return currentNumber !== null && expectedNumber !== null && currentNumber > expectedNumber
    case 'greater_than_or_equal':
      return currentNumber !== null && expectedNumber !== null && currentNumber >= expectedNumber
    case 'less_than':
      return currentNumber !== null && expectedNumber !== null && currentNumber < expectedNumber
    case 'less_than_or_equal':
      return currentNumber !== null && expectedNumber !== null && currentNumber <= expectedNumber
    case 'contains':
      return containsValue(currentValue, condition.value)
    case 'not_contains':
      return !containsValue(currentValue, condition.value)
    case 'in':
      return Array.isArray(condition.value) &&
        condition.value.some(item => valuesAreEqual(currentValue, item))
    case 'not_in':
      return Array.isArray(condition.value) &&
        !condition.value.some(item => valuesAreEqual(currentValue, item))
    case 'exists':
      return valueExists(currentValue)
    case 'not_exists':
      return !valueExists(currentValue)
    case 'between': {
      const secondaryNumber = toFiniteNumber(condition.secondaryValue)
      return currentNumber !== null && expectedNumber !== null && secondaryNumber !== null &&
        currentNumber >= Math.min(expectedNumber, secondaryNumber) &&
        currentNumber <= Math.max(expectedNumber, secondaryNumber)
    }
    case 'changed':
      return Array.isArray(currentValue) && currentValue.length >= 2 &&
        !valuesAreEqual(currentValue[0], currentValue[currentValue.length - 1])
    case 'trend_up':
      return evaluateTrend(currentValue, 'up')
    case 'trend_down':
      return evaluateTrend(currentValue, 'down')
    default:
      return false
  }
}

function getEvaluationSource({
  decision,
  additionalData,
}: DecisionRuleEvaluationContext): Record<string, unknown> {
  return {
    decision,
    additionalData: additionalData ?? {},
    ...decision,
    metadata: {
      ...decision.metadata,
      additionalData: additionalData ?? {},
    },
  }
}

export function evaluateDecisionRuleCondition({
  condition,
  context,
}: {
  condition: DecisionRuleCondition
  context: DecisionRuleEvaluationContext
}): ConditionEvaluationResult {
  try {
    if (!condition.id.trim()) {
      return {
        conditionId: condition.id,
        matched: false,
        score: 0,
        warning: null,
        error: 'A condiÃ§Ã£o da regra nÃ£o possui identificador.',
      }
    }

    if (!condition.field.trim()) {
      return {
        conditionId: condition.id,
        matched: false,
        score: 0,
        warning: null,
        error: 'O campo da condiÃ§Ã£o Ã© obrigatÃ³rio.',
      }
    }

    const source = getEvaluationSource(context)
    const currentValue = getValueByPath(source, condition.field)
    const matched = evaluateConditionOperator({ condition, currentValue })
    const normalizedWeight = clampDecisionPercentage(Math.max(0, condition.weight))

    return {
      conditionId: condition.id,
      matched,
      score: matched ? normalizedWeight : 0,
      warning:
        currentValue === undefined && condition.operator !== 'not_exists'
          ? `O campo "${condition.field}" nÃ£o foi encontrado no contexto da decisÃ£o.`
          : null,
      error: null,
    }
  } catch (error) {
    return {
      conditionId: condition.id,
      matched: false,
      score: 0,
      warning: null,
      error:
        error instanceof Error
          ? error.message
          : 'Erro inesperado ao avaliar a condiÃ§Ã£o da regra.',
    }
  }
}

function calculateConditionScore({
  rule,
  evaluations,
}: {
  rule: DecisionRule
  evaluations: ConditionEvaluationResult[]
}): number {
  if (rule.conditions.length === 0) {
    return 0
  }

  const totalWeight = rule.conditions.reduce(
    (total, condition) => total + Math.max(0, condition.weight),
    0,
  )

  if (totalWeight <= 0) {
    const matchedCount = evaluations.filter(evaluation => evaluation.matched).length
    return clampDecisionPercentage((matchedCount / rule.conditions.length) * 100)
  }

  const matchedWeight = evaluations.reduce(
    (total, evaluation) => total + evaluation.score,
    0,
  )

  return clampDecisionPercentage((matchedWeight / totalWeight) * 100)
}

function validateRuleAvailability(rule: DecisionRule): string[] {
  const errors: string[] = []

  if (!rule.id.trim()) errors.push('A regra nÃ£o possui identificador.')
  if (!rule.code.trim()) errors.push('O cÃ³digo da regra Ã© obrigatÃ³rio.')
  if (!rule.name.trim()) errors.push('O nome da regra Ã© obrigatÃ³rio.')

  if (rule.minimumConditionScore < 0 || rule.minimumConditionScore > 100) {
    errors.push('A pontuaÃ§Ã£o mÃ­nima da regra deve estar entre 0 e 100.')
  }

  if (rule.validFrom && Number.isNaN(Date.parse(rule.validFrom))) {
    errors.push('A data inicial de validade da regra Ã© invÃ¡lida.')
  }

  if (rule.validUntil && Number.isNaN(Date.parse(rule.validUntil))) {
    errors.push('A data final de validade da regra Ã© invÃ¡lida.')
  }

  if (
    rule.validFrom &&
    rule.validUntil &&
    Date.parse(rule.validFrom) > Date.parse(rule.validUntil)
  ) {
    errors.push('O intervalo de validade da regra Ã© invÃ¡lido.')
  }

  return uniqueStrings(errors)
}

function ruleAppliesToDecision({
  rule,
  decision,
}: {
  rule: DecisionRule
  decision: EducationalDecision
}): boolean {
  if (!rule.active) return false

  const now = Date.now()
  if (rule.validFrom && Date.parse(rule.validFrom) > now) return false
  if (rule.validUntil && Date.parse(rule.validUntil) < now) return false
  if (rule.institutionId && rule.institutionId !== decision.institutionId) return false

  if (
    rule.subjectTypes.length > 0 &&
    !decision.subjects.some(subject => rule.subjectTypes.includes(subject.subjectType))
  ) {
    return false
  }

  if (
    rule.categories.length > 0 &&
    !rule.categories.includes(decision.category)
  ) {
    return false
  }

  return true
}

export function evaluateDecisionRule({
  rule,
  context,
}: {
  rule: DecisionRule
  context: DecisionRuleEvaluationContext
}): DecisionRuleEvaluationResult {
  const warnings: string[] = []
  const errors = validateRuleAvailability(rule)

  if (errors.length > 0) {
    return {
      success: false,
      execution: {
        ruleId: rule.id,
        decisionId: context.decision.id,
        matched: false,
        conditionScore: 0,
        matchedConditionIds: [],
        failedConditionIds: rule.conditions.map(condition => condition.id),
        generatedDecisionType: null,
        warnings: [],
        errors,
        metadata: {
          evaluatedAt: new Date().toISOString(),
          ruleCode: rule.code,
        },
      },
      outcome: null,
      warnings: [],
      errors,
    }
  }

  if (!ruleAppliesToDecision({ rule, decision: context.decision })) {
    const execution: DecisionRuleExecutionResult = {
      ruleId: rule.id,
      decisionId: context.decision.id,
      matched: false,
      conditionScore: 0,
      matchedConditionIds: [],
      failedConditionIds: [],
      generatedDecisionType: null,
      warnings: ['A regra nÃ£o se aplica ao contexto atual da decisÃ£o.'],
      errors: [],
      metadata: {
        evaluatedAt: new Date().toISOString(),
        ruleCode: rule.code,
        applicable: false,
      },
    }

    return {
      success: true,
      execution,
      outcome: null,
      warnings: execution.warnings,
      errors: [],
    }
  }

  const evaluations = rule.conditions.map(condition =>
    evaluateDecisionRuleCondition({ condition, context }),
  )

  warnings.push(
    ...evaluations
      .map(evaluation => evaluation.warning)
      .filter((warning): warning is string => Boolean(warning)),
  )

  errors.push(
    ...evaluations
      .map(evaluation => evaluation.error)
      .filter((error): error is string => Boolean(error)),
  )

  const requiredConditionsMatched = rule.conditions
    .filter(condition => condition.required)
    .every(condition =>
      evaluations.some(
        evaluation => evaluation.conditionId === condition.id && evaluation.matched,
      ),
    )

  const conditionScore = calculateConditionScore({ rule, evaluations })
  const matched =
    errors.length === 0 &&
    requiredConditionsMatched &&
    conditionScore >= rule.minimumConditionScore

  const execution: DecisionRuleExecutionResult = {
    ruleId: rule.id,
    decisionId: context.decision.id,
    matched,
    conditionScore,
    matchedConditionIds: evaluations
      .filter(evaluation => evaluation.matched)
      .map(evaluation => evaluation.conditionId),
    failedConditionIds: evaluations
      .filter(evaluation => !evaluation.matched)
      .map(evaluation => evaluation.conditionId),
    generatedDecisionType: matched ? rule.outcome.decisionType : null,
    warnings: uniqueStrings(warnings),
    errors: uniqueStrings(errors),
    metadata: {
      evaluatedAt: new Date().toISOString(),
      ruleCode: rule.code,
      ruleVersion: rule.version,
      requiredConditionsMatched,
      confidence: clampDecisionConfidence(conditionScore / 100),
      confidenceLevel: getDecisionConfidenceLevel(conditionScore / 100),
    },
  }

  return {
    success: errors.length === 0,
    execution,
    outcome: matched ? rule.outcome : null,
    warnings: execution.warnings,
    errors: execution.errors,
  }
}

export function evaluateDecisionRules({
  rules,
  context,
}: {
  rules: DecisionRule[]
  context: DecisionRuleEvaluationContext
}): DecisionRuleBatchEvaluationResult {
  const executions: DecisionRuleExecutionResult[] = []
  const matchedRules: DecisionRule[] = []
  const unmatchedRules: DecisionRule[] = []
  const warnings: string[] = []
  const errors: string[] = []

  for (const rule of rules) {
    const result = evaluateDecisionRule({ rule, context })
    executions.push(result.execution)
    warnings.push(...result.warnings)
    errors.push(...result.errors)

    if (result.execution.matched) {
      matchedRules.push(rule)
    } else {
      unmatchedRules.push(rule)
    }
  }

  return {
    success: errors.length === 0,
    executions,
    matchedRules,
    unmatchedRules,
    warnings: uniqueStrings(warnings),
    errors: uniqueStrings(errors),
  }
}

export function createDecisionRule({
  id,
  code,
  name,
  conditions,
  outcome,
}: {
  id: string
  code: string
  name: string
  conditions: DecisionRuleCondition[]
  outcome: DecisionRuleOutcome
}): DecisionRule {
  const now = new Date().toISOString()

  return {
    id,
    code,
    name,
    description: null,
    active: true,
    version: '1.0.0',
    source: 'institutional_rule',
    subjectTypes: [],
    categories: [],
    conditions,
    minimumConditionScore: 100,
    outcome,
    validFrom: null,
    validUntil: null,
    institutionId: null,
    createdAt: now,
    updatedAt: now,
    createdBy: null,
    updatedBy: null,
    metadata: {},
  }
}

export const decisionRulesService = {
  evaluateCondition: evaluateDecisionRuleCondition,
  evaluateRule: evaluateDecisionRule,
  evaluateRules: evaluateDecisionRules,
  createRule: createDecisionRule,
}
