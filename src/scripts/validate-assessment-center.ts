import {
  buildDiagnosticAssessmentSummary,
  buildGradebookSummary,
  classifyLearning,
  shouldRequireRecovery,
  shouldRequireRecomposition,
} from '@/lib/agenda/assessment-center/assessment-center.engine'

import type {
  GradebookEntry,
  StudentAssessmentResult,
} from '@/lib/agenda/assessment-center/assessment-center.contract'

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message)
}

assert(classifyLearning({ percentage: 10 }) === 'critical', '10% deve ser crítico.')
assert(classifyLearning({ percentage: 40 }) === 'initial', '40% deve ser inicial.')
assert(classifyLearning({ percentage: 60 }) === 'developing', '60% deve estar em desenvolvimento.')
assert(classifyLearning({ percentage: 75 }) === 'adequate', '75% deve ser adequado.')
assert(classifyLearning({ percentage: 85 }) === 'proficient', '85% deve ser proficiente.')
assert(classifyLearning({ percentage: 95 }) === 'advanced', '95% deve ser avançado.')
assert(classifyLearning({ percentage: null }) === 'not_classified', 'Valor ausente não deve classificar.')

assert(shouldRequireRecovery('developing'), 'Em desenvolvimento deve exigir recuperação.')
assert(!shouldRequireRecovery('adequate'), 'Adequado não deve exigir recuperação automática.')
assert(shouldRequireRecomposition('critical'), 'Crítico deve sinalizar recomposição.')
assert(!shouldRequireRecomposition('developing'), 'Em desenvolvimento não deve sinalizar recomposição automática.')

const entries: GradebookEntry[] = [
  {
    id: 'g1',
    studentId: 'student-1',
    classId: 'class-1',
    componentId: 'physics',
    academicPeriodId: 'period-1',
    assessmentId: 'a1',
    assessmentResultId: 'r1',
    type: 'assessment',
    title: 'Diagnóstica',
    value: 5,
    percentage: 50,
    concept: null,
    weight: 1,
    classification: 'developing',
    recordedBy: 'user-1',
    recordedAt: '2026-08-01T10:00:00.000Z',
    reason: null,
    supersedesEntryId: null,
    metadata: {},
  },
  {
    id: 'g2',
    studentId: 'student-1',
    classId: 'class-1',
    componentId: 'physics',
    academicPeriodId: 'period-1',
    assessmentId: 'a2',
    assessmentResultId: 'r2',
    type: 'assessment',
    title: 'Formativa',
    value: 8,
    percentage: 80,
    concept: null,
    weight: 2,
    classification: 'proficient',
    recordedBy: 'user-1',
    recordedAt: '2026-08-07T10:00:00.000Z',
    reason: null,
    supersedesEntryId: null,
    metadata: {},
  },
]

const gradebook = buildGradebookSummary({
  entries,
  calculationMethod: 'weighted_average',
})

assert(Math.abs((gradebook.currentValue ?? 0) - 7) < 0.0001, 'Média ponderada esperada = 7.')
assert(gradebook.trend === 'up', 'Tendência deve ser crescente.')

const result: StudentAssessmentResult = {
  id: 'r1',
  assessmentId: 'a1',
  studentId: 'student-1',
  enrollmentId: null,
  classId: 'class-1',
  academicPeriodId: 'period-1',
  status: 'reviewed',
  rawScore: 4,
  normalizedScore: 4,
  percentage: 40,
  concept: null,
  classification: 'initial',
  criterionResults: [],
  learningOutcomeResults: [
    {
      learningOutcomeId: 'skill-1',
      percentage: 40,
      classification: 'initial',
      evidenceIds: [],
    },
  ],
  teacherFeedback: null,
  recoveryRequired: true,
  recompositionRequired: true,
  reviewedBy: 'user-1',
  reviewedAt: '2026-08-07T10:00:00.000Z',
  finalizedBy: null,
  finalizedAt: null,
  createdAt: '2026-08-07T10:00:00.000Z',
  updatedAt: '2026-08-07T10:00:00.000Z',
  metadata: {},
}

const diagnostic = buildDiagnosticAssessmentSummary({
  assessmentId: 'a1',
  classId: 'class-1',
  academicPeriodId: 'period-1',
  totalStudents: 1,
  results: [result],
})

assert(diagnostic.studentsRequiringRecovery.length === 1, 'Diagnóstico deve sinalizar recuperação.')
assert(diagnostic.studentsRequiringRecomposition.length === 1, 'Diagnóstico deve sinalizar recomposição.')
assert(diagnostic.criticalLearningOutcomeIds.includes('skill-1'), 'Habilidade deve ser crítica.')

console.log('Assessment Center validation: OK')
