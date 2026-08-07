/** EduData IA — Agenda Inteligente EDI — Assessment Center Engine 1.0 */

import type {
  DiagnosticAssessmentSummary,
  GradebookEntry,
  GradebookSummary,
  LearningClassification,
  LearningClassificationCode,
  StudentAssessmentResult,
} from './assessment-center.contract'
import {
  DEFAULT_LEARNING_CLASSIFICATION_SCALE,
} from './assessment-center.contract'

function clampPercentage(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.min(100, Math.max(0, value))
}

export function classifyLearning({
  percentage,
  scale = DEFAULT_LEARNING_CLASSIFICATION_SCALE,
}: {
  percentage: number | null | undefined
  scale?: LearningClassification[]
}): LearningClassificationCode {
  if (
    percentage === null ||
    percentage === undefined ||
    !Number.isFinite(percentage)
  ) {
    return 'not_classified'
  }

  const normalized = clampPercentage(percentage)
  const orderedScale = [...scale].sort(
    (first, second) => first.priority - second.priority,
  )

  const match = orderedScale.find((level) => {
    const minimum = level.minimumPercentage ?? 0
    const maximum = level.maximumPercentage ?? 100
    return normalized >= minimum && normalized <= maximum
  })

  return match?.code ?? 'not_classified'
}

export function shouldRequireRecovery(
  classification: LearningClassificationCode,
): boolean {
  return (
    classification === 'critical' ||
    classification === 'initial' ||
    classification === 'developing'
  )
}

export function shouldRequireRecomposition(
  classification: LearningClassificationCode,
): boolean {
  return classification === 'critical' || classification === 'initial'
}

export function enrichStudentAssessmentResult({
  result,
  scale = DEFAULT_LEARNING_CLASSIFICATION_SCALE,
}: {
  result: StudentAssessmentResult
  scale?: LearningClassification[]
}): StudentAssessmentResult {
  const classification = classifyLearning({
    percentage: result.percentage,
    scale,
  })

  return {
    ...result,
    classification,
    recoveryRequired: shouldRequireRecovery(classification),
    recompositionRequired:
      shouldRequireRecomposition(classification),
    learningOutcomeResults:
      result.learningOutcomeResults.map((outcome) => ({
        ...outcome,
        classification: classifyLearning({
          percentage: outcome.percentage,
          scale,
        }),
      })),
    updatedAt: new Date().toISOString(),
  }
}

function calculateWeightedAverage(
  entries: GradebookEntry[],
): number | null {
  const numericEntries = entries.filter(
    (entry) =>
      typeof entry.value === 'number' &&
      Number.isFinite(entry.value) &&
      Number.isFinite(entry.weight) &&
      entry.weight > 0,
  )

  if (numericEntries.length === 0) return null

  const totalWeight = numericEntries.reduce(
    (sum, entry) => sum + entry.weight,
    0,
  )

  if (totalWeight <= 0) return null

  return numericEntries.reduce(
    (sum, entry) => sum + (entry.value ?? 0) * entry.weight,
    0,
  ) / totalWeight
}

function calculateSimpleAverage(
  entries: GradebookEntry[],
): number | null {
  const values = entries
    .map((entry) => entry.value)
    .filter(
      (value): value is number =>
        typeof value === 'number' && Number.isFinite(value),
    )

  if (values.length === 0) return null

  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function calculatePercentageAverage(
  entries: GradebookEntry[],
): number | null {
  const values = entries
    .map((entry) => entry.percentage)
    .filter(
      (value): value is number =>
        typeof value === 'number' && Number.isFinite(value),
    )

  if (values.length === 0) return null

  return clampPercentage(
    values.reduce((sum, value) => sum + value, 0) / values.length,
  )
}

function calculateTrend(entries: GradebookEntry[]): GradebookSummary['trend'] {
  const ordered = [...entries]
    .filter((entry) => typeof entry.percentage === 'number')
    .sort(
      (first, second) =>
        new Date(first.recordedAt).getTime() -
        new Date(second.recordedAt).getTime(),
    )

  if (ordered.length < 2) return 'insufficient_data'

  const first = ordered[0].percentage ?? 0
  const last = ordered[ordered.length - 1].percentage ?? 0
  const difference = last - first

  if (Math.abs(difference) < 2) return 'stable'
  return difference > 0 ? 'up' : 'down'
}

export function buildGradebookSummary({
  entries,
  calculationMethod,
}: {
  entries: GradebookEntry[]
  calculationMethod: GradebookSummary['calculationMethod']
}): GradebookSummary {
  if (entries.length === 0) {
    throw new Error('É necessário ao menos um lançamento para consolidar o diário.')
  }

  const reference = entries[0]
  const currentValue =
    calculationMethod === 'weighted_average'
      ? calculateWeightedAverage(entries)
      : calculateSimpleAverage(entries)
  const currentPercentage = calculatePercentageAverage(entries)
  const currentClassification = classifyLearning({
    percentage: currentPercentage,
  })

  return {
    studentId: reference.studentId,
    classId: reference.classId,
    componentId: reference.componentId,
    academicPeriodId: reference.academicPeriodId,
    calculationMethod,
    currentValue,
    currentPercentage,
    currentConcept: null,
    currentClassification,
    assessmentCount: entries.filter((entry) => entry.type === 'assessment').length,
    recoveryCount: entries.filter((entry) => entry.type === 'recovery').length,
    recompositionCount: entries.filter((entry) => entry.type === 'recomposition').length,
    trend: calculateTrend(entries),
    requiresIntervention: shouldRequireRecovery(currentClassification),
    calculatedAt: new Date().toISOString(),
    entryIds: entries.map((entry) => entry.id),
  }
}

export function buildDiagnosticAssessmentSummary({
  assessmentId,
  classId,
  academicPeriodId,
  totalStudents,
  results,
}: {
  assessmentId: string
  classId: string
  academicPeriodId: string
  totalStudents: number
  results: StudentAssessmentResult[]
}): DiagnosticAssessmentSummary {
  const distribution: DiagnosticAssessmentSummary['classificationDistribution'] = {
    critical: 0,
    initial: 0,
    developing: 0,
    adequate: 0,
    proficient: 0,
    advanced: 0,
    not_classified: 0,
  }

  const outcomeCounters = new Map<string, { total: number; low: number }>()

  for (const result of results) {
    distribution[result.classification] += 1

    for (const outcome of result.learningOutcomeResults) {
      const current = outcomeCounters.get(outcome.learningOutcomeId) ?? {
        total: 0,
        low: 0,
      }
      current.total += 1
      if (shouldRequireRecovery(outcome.classification)) current.low += 1
      outcomeCounters.set(outcome.learningOutcomeId, current)
    }
  }

  const rankedOutcomes = [...outcomeCounters.entries()]
    .map(([id, counter]) => ({
      id,
      ratio: counter.total > 0 ? counter.low / counter.total : 0,
    }))
    .sort((first, second) => second.ratio - first.ratio)

  return {
    assessmentId,
    classId,
    academicPeriodId,
    totalStudents,
    assessedStudents: results.filter(
      (result) => result.status !== 'absent' && result.status !== 'excused',
    ).length,
    absentStudents: results.filter((result) => result.status === 'absent').length,
    classificationDistribution: distribution,
    criticalLearningOutcomeIds: rankedOutcomes
      .filter((item) => item.ratio >= 0.5)
      .map((item) => item.id),
    priorityLearningOutcomeIds: rankedOutcomes
      .filter((item) => item.ratio >= 0.3)
      .map((item) => item.id),
    studentsRequiringRecovery: results
      .filter((result) => result.recoveryRequired)
      .map((result) => result.studentId),
    studentsRequiringRecomposition: results
      .filter((result) => result.recompositionRequired)
      .map((result) => result.studentId),
    generatedAt: new Date().toISOString(),
  }
}

export function getAssessmentCenterEngineInfo() {
  return {
    name: 'agenda-assessment-center-engine',
    version: '1.0.0',
    humanReviewRequired: true,
    automaticStudentLabelingProhibited: true,
    supportsDiagnosticAssessment: true,
    supportsGradebook: true,
    supportsLearningClassification: true,
  }
}
