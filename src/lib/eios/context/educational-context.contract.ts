export const EDUCATIONAL_CONTEXT_CONTRACT_VERSION =
  'educational-context-v1' as const

export type EducationalContextContractVersion =
  typeof EDUCATIONAL_CONTEXT_CONTRACT_VERSION

export type EducationalContextSource =
  | 'agenda'
  | 'professor_digital'
  | 'class_diary'
  | 'professional_development'
  | 'analytics'
  | 'institution'
  | 'manual'
  | 'integration'

export type EducationalContextRole =
  | 'individual_user'
  | 'teacher'
  | 'coordinator'
  | 'supervisor'
  | 'manager'
  | 'institution_administrator'
  | 'system_administrator'

export type EducationalContextAccessScope =
  | 'self'
  | 'assigned_classes'
  | 'assigned_team'
  | 'school'
  | 'organization'
  | 'platform'

export type EducationalContextSensitivity =
  | 'public'
  | 'internal'
  | 'restricted'
  | 'confidential'
  | 'sensitive'

export type EducationalContextStatus =
  | 'empty'
  | 'partial'
  | 'available'
  | 'degraded'
  | 'unavailable'

export type EducationalContextRiskLevel =
  | 'none'
  | 'low'
  | 'medium'
  | 'high'
  | 'critical'

export type EducationalContextPriority =
  | 'low'
  | 'normal'
  | 'medium'
  | 'high'
  | 'critical'

export type EducationalContextRecord =
  Record<string, unknown>

export type EducationalContextIdentifier = {
  userId: string

  organizationId: string | null

  schoolId: string | null

  role: EducationalContextRole

  accessScope: EducationalContextAccessScope
}

export type EducationalContextPeriod = {
  referenceDate: string

  timezone: string

  academicYear: number | null

  academicPeriod: string | null

  periodStart: string | null

  periodEnd: string | null
}

export type EducationalContextMetadata = {
  contractVersion:
    EducationalContextContractVersion

  generatedAt: string

  sources:
    EducationalContextSource[]

  status:
    EducationalContextStatus

  sensitivity:
    EducationalContextSensitivity

  cacheable: boolean

  containsSensitiveData: boolean

  automatedDecisionAllowed: false

  humanReviewRequired: boolean

  dataQualityScore: number | null

  warnings: string[]
}

export type EducationalContextCounts = {
  total: number

  active: number

  pending: number

  completed: number

  overdue: number

  cancelled: number
}

export type EducationalContextPlanningSummary = {
  counts:
    EducationalContextCounts

  withoutObjectives: number

  withoutLessons: number

  dueToday: number

  dueThisWeek: number

  completionRate: number

  records:
    EducationalContextRecord[]
}

export type EducationalContextObjectiveSummary = {
  counts:
    EducationalContextCounts

  withoutEvidence: number

  withoutPlanning: number

  lowProgress: number

  averageProgress: number

  records:
    EducationalContextRecord[]
}

export type EducationalContextLessonSummary = {
  counts:
    EducationalContextCounts

  scheduledToday: number

  scheduledTomorrow: number

  scheduledThisWeek: number

  completedWithoutEvidence: number

  executionRate: number

  records:
    EducationalContextRecord[]
}

export type EducationalContextEvidenceSummary = {
  counts:
    EducationalContextCounts

  withoutLesson: number

  withoutObjective: number

  registeredToday: number

  registeredThisWeek: number

  coverageRate: number

  records:
    EducationalContextRecord[]
}

export type EducationalContextTaskSummary = {
  counts:
    EducationalContextCounts

  dueToday: number

  dueTomorrow: number

  dueThisWeek: number

  overdueHighPriority: number

  records:
    EducationalContextRecord[]
}

export type EducationalContextCalendarSummary = {
  eventsToday: number

  eventsTomorrow: number

  eventsThisWeek: number

  conflictingEvents: number

  workloadLevel:
    | 'low'
    | 'balanced'
    | 'high'
    | 'overloaded'
    | 'unknown'

  records:
    EducationalContextRecord[]
}

export type EducationalContextClassSummary = {
  totalClasses: number

  activeClasses: number

  classesWithoutPlanning: number

  classesWithoutRecentEvidence: number

  records:
    EducationalContextRecord[]
}

export type EducationalContextStudentSummary = {
  totalStudents: number

  activeStudents: number

  studentsNeedingAttention: number

  studentsInRecovery: number

  records:
    EducationalContextRecord[]
}

export type EducationalContextAssessmentSummary = {
  totalAssessments: number

  scheduledAssessments: number

  completedAssessments: number

  pendingGrading: number

  assessmentTypes: number

  gradingSchemes: number

  averageCompletionRate: number

  records:
    EducationalContextRecord[]
}

export type EducationalContextAttendanceSummary = {
  totalRecords: number

  presentRecords: number

  justifiedAbsences: number

  unjustifiedAbsences: number

  attendanceRate: number

  records:
    EducationalContextRecord[]
}

export type EducationalContextClassDiarySummary = {
  status:
    EducationalContextStatus

  classes:
    EducationalContextClassSummary

  students:
    EducationalContextStudentSummary

  assessments:
    EducationalContextAssessmentSummary

  attendance:
    EducationalContextAttendanceSummary

  recoveryActions: {
    total: number

    active: number

    completed: number

    overdue: number

    records:
      EducationalContextRecord[]
  }
}

export type EducationalContextObservationSummary = {
  totalObservations: number

  scheduledObservations: number

  completedObservations: number

  awaitingFeedback: number

  awaitingAcknowledgement: number

  records:
    EducationalContextRecord[]
}

export type EducationalContextDevelopmentSummary = {
  activePlans: number

  completedPlans: number

  overdueActions: number

  activeCompetencies: number

  competenciesNeedingDevelopment: number

  records:
    EducationalContextRecord[]
}

export type EducationalContextProfessionalAttendanceSummary = {
  totalOccurrences: number

  justifiedOccurrences: number

  pendingValidation: number

  unresolvedOccurrences: number

  records:
    EducationalContextRecord[]
}

export type EducationalContextAdministrativeProcessSummary = {
  totalProcesses: number

  underReview: number

  awaitingResponse: number

  completed: number

  archived: number

  records:
    EducationalContextRecord[]
}

export type EducationalContextProfessionalSummary = {
  status:
    EducationalContextStatus

  observations:
    EducationalContextObservationSummary

  development:
    EducationalContextDevelopmentSummary

  professionalAttendance:
    EducationalContextProfessionalAttendanceSummary

  administrativeProcesses:
    EducationalContextAdministrativeProcessSummary

  /*
   * O Context Engine nunca deve incluir, por padrão,
   * conteúdo clínico, diagnóstico, documentos médicos
   * ou detalhes protegidos de processos confidenciais.
   */
  sensitiveDocumentsIncluded: false
}

export type EducationalContextMetric = {
  id: string

  label: string

  value: number

  minimum: number

  maximum: number

  unit:
    | 'count'
    | 'percentage'
    | 'score'
    | 'days'
    | 'hours'

  source:
    EducationalContextSource

  explanation: string
}

export type EducationalContextIndicatorSummary = {
  planningScore: number

  objectiveScore: number

  executionScore: number

  evidenceScore: number

  organizationScore: number

  overallScore: number

  pedagogicalHealthIndex: number

  metrics:
    EducationalContextMetric[]
}

export type EducationalContextAlert = {
  id: string

  priority:
    EducationalContextPriority

  riskLevel:
    EducationalContextRiskLevel

  title: string

  description: string

  reason: string

  source:
    EducationalContextSource

  relatedEntityType: string | null

  relatedEntityId: string | null

  recommendedAction: string | null

  actionHref: string | null

  createdAt: string
}

export type EducationalContextRecommendation = {
  id: string

  priority:
    EducationalContextPriority

  title: string

  description: string

  reason: string

  expectedImpact: string | null

  source:
    EducationalContextSource

  actionLabel: string | null

  actionHref: string | null

  requiresConfirmation: boolean

  automaticExecutionAllowed: false
}

export type EducationalContextInsight = {
  id: string

  title: string

  description: string

  explanation: string

  source:
    EducationalContextSource

  confidence: number | null

  generatedAt: string
}

export type EducationalContextDailyPriority = {
  id: string

  priority:
    EducationalContextPriority

  title: string

  description: string

  reason: string

  actionLabel: string | null

  actionHref: string | null

  dueAt: string | null

  relatedEntityType: string | null

  relatedEntityId: string | null
}

export type EducationalContextDailySummary = {
  greeting: string

  headline: string

  summary: string

  priorities:
    EducationalContextDailyPriority[]

  alerts:
    EducationalContextAlert[]

  recommendations:
    EducationalContextRecommendation[]

  insights:
    EducationalContextInsight[]
}

export type EducationalContext = {
  identity:
    EducationalContextIdentifier

  period:
    EducationalContextPeriod

  metadata:
    EducationalContextMetadata

  agenda: {
    planning:
      EducationalContextPlanningSummary

    objectives:
      EducationalContextObjectiveSummary

    lessons:
      EducationalContextLessonSummary

    evidences:
      EducationalContextEvidenceSummary

    tasks:
      EducationalContextTaskSummary

    calendar:
      EducationalContextCalendarSummary
  }

  classDiary:
    EducationalContextClassDiarySummary

  professionalDevelopment:
    EducationalContextProfessionalSummary

  indicators:
    EducationalContextIndicatorSummary

  dailySummary:
    EducationalContextDailySummary
}

export type CreateEducationalContextInput = {
  identity:
    EducationalContextIdentifier

  period:
    EducationalContextPeriod

  agenda?: {
    planning?:
      EducationalContextRecord[]

    objectives?:
      EducationalContextRecord[]

    lessons?:
      EducationalContextRecord[]

    evidences?:
      EducationalContextRecord[]

    tasks?:
      EducationalContextRecord[]

    calendarEvents?:
      EducationalContextRecord[]
  }

  classDiary?: {
    classes?:
      EducationalContextRecord[]

    students?:
      EducationalContextRecord[]

    assessments?:
      EducationalContextRecord[]

    assessmentScores?:
      EducationalContextRecord[]

    attendanceRecords?:
      EducationalContextRecord[]

    recoveryActions?:
      EducationalContextRecord[]
  }

  professionalDevelopment?: {
    observations?:
      EducationalContextRecord[]

    developmentPlans?:
      EducationalContextRecord[]

    competencies?:
      EducationalContextRecord[]

    professionalAttendance?:
      EducationalContextRecord[]

    administrativeProcesses?:
      EducationalContextRecord[]
  }

  sources:
    EducationalContextSource[]
}

export type EducationalContextResult = {
  success: boolean

  context:
    EducationalContext | null

  errors: string[]

  warnings: string[]
}

export function createEmptyContextCounts():
  EducationalContextCounts {
  return {
    total:
      0,

    active:
      0,

    pending:
      0,

    completed:
      0,

    overdue:
      0,

    cancelled:
      0,
  }
}

export function createEmptyEducationalContext(
  identity:
    EducationalContextIdentifier,

  period:
    EducationalContextPeriod,

  sources:
    EducationalContextSource[] = [],
): EducationalContext {
  const generatedAt =
    new Date()
      .toISOString()

  return {
    identity,

    period,

    metadata: {
      contractVersion:
        EDUCATIONAL_CONTEXT_CONTRACT_VERSION,

      generatedAt,

      sources,

      status:
        'empty',

      sensitivity:
        'internal',

      cacheable:
        false,

      containsSensitiveData:
        false,

      automatedDecisionAllowed:
        false,

      humanReviewRequired:
        false,

      dataQualityScore:
        null,

      warnings:
        [],
    },

    agenda: {
      planning: {
        counts:
          createEmptyContextCounts(),

        withoutObjectives:
          0,

        withoutLessons:
          0,

        dueToday:
          0,

        dueThisWeek:
          0,

        completionRate:
          0,

        records:
          [],
      },

      objectives: {
        counts:
          createEmptyContextCounts(),

        withoutEvidence:
          0,

        withoutPlanning:
          0,

        lowProgress:
          0,

        averageProgress:
          0,

        records:
          [],
      },

      lessons: {
        counts:
          createEmptyContextCounts(),

        scheduledToday:
          0,

        scheduledTomorrow:
          0,

        scheduledThisWeek:
          0,

        completedWithoutEvidence:
          0,

        executionRate:
          0,

        records:
          [],
      },

      evidences: {
        counts:
          createEmptyContextCounts(),

        withoutLesson:
          0,

        withoutObjective:
          0,

        registeredToday:
          0,

        registeredThisWeek:
          0,

        coverageRate:
          0,

        records:
          [],
      },

      tasks: {
        counts:
          createEmptyContextCounts(),

        dueToday:
          0,

        dueTomorrow:
          0,

        dueThisWeek:
          0,

        overdueHighPriority:
          0,

        records:
          [],
      },

      calendar: {
        eventsToday:
          0,

        eventsTomorrow:
          0,

        eventsThisWeek:
          0,

        conflictingEvents:
          0,

        workloadLevel:
          'unknown',

        records:
          [],
      },
    },

    classDiary: {
      status:
        'empty',

      classes: {
        totalClasses:
          0,

        activeClasses:
          0,

        classesWithoutPlanning:
          0,

        classesWithoutRecentEvidence:
          0,

        records:
          [],
      },

      students: {
        totalStudents:
          0,

        activeStudents:
          0,

        studentsNeedingAttention:
          0,

        studentsInRecovery:
          0,

        records:
          [],
      },

      assessments: {
        totalAssessments:
          0,

        scheduledAssessments:
          0,

        completedAssessments:
          0,

        pendingGrading:
          0,

        assessmentTypes:
          0,

        gradingSchemes:
          0,

        averageCompletionRate:
          0,

        records:
          [],
      },

      attendance: {
        totalRecords:
          0,

        presentRecords:
          0,

        justifiedAbsences:
          0,

        unjustifiedAbsences:
          0,

        attendanceRate:
          0,

        records:
          [],
      },

      recoveryActions: {
        total:
          0,

        active:
          0,

        completed:
          0,

        overdue:
          0,

        records:
          [],
      },
    },

    professionalDevelopment: {
      status:
        'empty',

      observations: {
        totalObservations:
          0,

        scheduledObservations:
          0,

        completedObservations:
          0,

        awaitingFeedback:
          0,

        awaitingAcknowledgement:
          0,

        records:
          [],
      },

      development: {
        activePlans:
          0,

        completedPlans:
          0,

        overdueActions:
          0,

        activeCompetencies:
          0,

        competenciesNeedingDevelopment:
          0,

        records:
          [],
      },

      professionalAttendance: {
        totalOccurrences:
          0,

        justifiedOccurrences:
          0,

        pendingValidation:
          0,

        unresolvedOccurrences:
          0,

        records:
          [],
      },

      administrativeProcesses: {
        totalProcesses:
          0,

        underReview:
          0,

        awaitingResponse:
          0,

        completed:
          0,

        archived:
          0,

        records:
          [],
      },

      sensitiveDocumentsIncluded:
        false,
    },

    indicators: {
      planningScore:
        0,

      objectiveScore:
        0,

      executionScore:
        0,

      evidenceScore:
        0,

      organizationScore:
        0,

      overallScore:
        0,

      pedagogicalHealthIndex:
        0,

      metrics:
        [],
    },

    dailySummary: {
      greeting:
        '',

      headline:
        '',

      summary:
        '',

      priorities:
        [],

      alerts:
        [],

      recommendations:
        [],

      insights:
        [],
    },
  }
}