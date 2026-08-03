import {
  createEmptyContextCounts,
  createEmptyEducationalContext,
  type CreateEducationalContextInput,
  type EducationalContext,
  type EducationalContextAlert,
  type EducationalContextCounts,
  type EducationalContextDailyPriority,
  type EducationalContextInsight,
  type EducationalContextPriority,
  type EducationalContextRecommendation,
  type EducationalContextRecord,
  type EducationalContextResult,
  type EducationalContextSource,
  type EducationalContextStatus,
} from './educational-context.contract'

const ACTIVE_STATUSES =
  new Set([
    'active',
    'ativo',
    'in_progress',
    'in_progression',
    'em_andamento',
    'em_acompanhamento',
    'em_preparacao',
    'scheduled',
    'agendado',
    'agendada',
    'planned',
    'planejado',
    'planejada',
    'rescheduled',
    'reagendado',
    'reagendada',
  ])

const PENDING_STATUSES =
  new Set([
    'pending',
    'pendente',
    'draft',
    'rascunho',
    'open',
    'aberto',
    'aberta',
    'todo',
    'to_do',
    'not_started',
    'nao_iniciado',
    'nao_iniciada',
  ])

const COMPLETED_STATUSES =
  new Set([
    'completed',
    'complete',
    'concluido',
    'concluida',
    'finished',
    'finalizado',
    'finalizada',
    'done',
    'realizado',
    'realizada',
    'partially_completed',
    'parcialmente_realizada',
    'parcialmente_realizado',
  ])

const CANCELLED_STATUSES =
  new Set([
    'cancelled',
    'canceled',
    'cancelado',
    'cancelada',
    'archived',
    'arquivado',
    'arquivada',
    'suspended',
    'suspenso',
    'suspensa',
  ])

const HIGH_PRIORITIES =
  new Set([
    'high',
    'alta',
    'critical',
    'critica',
    'crítica',
    'urgent',
    'urgente',
  ])

const PLANNING_OBJECTIVE_FIELDS = [
  'objective_id',
  'objectiveId',
  'primary_objective_id',
  'primaryObjectiveId',
  'objective',
  'objectives',
]

const PLANNING_LESSON_FIELDS = [
  'planning_id',
  'planningId',
]

const LESSON_EVIDENCE_FIELDS = [
  'lesson_id',
  'lessonId',
]

const OBJECTIVE_EVIDENCE_FIELDS = [
  'objective_id',
  'objectiveId',
]

const DATE_FIELDS = [
  'date',
  'planned_date',
  'plannedDate',
  'scheduled_date',
  'scheduledDate',
  'due_date',
  'dueDate',
  'start_date',
  'startDate',
  'event_date',
  'eventDate',
  'occurred_at',
  'occurredAt',
  'created_at',
  'createdAt',
]

const REGISTRATION_DATE_FIELDS = [
  'created_at',
  'createdAt',
  'registered_at',
  'registeredAt',
  'occurred_at',
  'occurredAt',
  'date',
]

type DateRange = {
  start: Date

  end: Date
}

function isRecord(
  value: unknown,
): value is EducationalContextRecord {
  return (
    typeof value ===
      'object' &&
    value !== null &&
    !Array.isArray(
      value,
    )
  )
}

function asRecordList(
  value:
    EducationalContextRecord[] |
    undefined,
): EducationalContextRecord[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter(
    isRecord,
  )
}

function normalizeText(
  value: unknown,
): string | null {
  if (
    typeof value !==
    'string'
  ) {
    return null
  }

  const normalizedValue =
    value
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(
        /[\u0300-\u036f]/g,
        '',
      )
      .replace(
        /[\s-]+/g,
        '_',
      )

  return (
    normalizedValue ||
    null
  )
}

function readText(
  record:
    EducationalContextRecord,

  fields:
    string[],
): string | null {
  for (
    const field of fields
  ) {
    const value =
      record[field]

    if (
      typeof value ===
        'string' &&
      value.trim()
    ) {
      return value.trim()
    }
  }

  return null
}

function readNumber(
  record:
    EducationalContextRecord,

  fields:
    string[],
): number | null {
  for (
    const field of fields
  ) {
    const value =
      record[field]

    if (
      typeof value ===
        'number' &&
      Number.isFinite(value)
    ) {
      return value
    }

    if (
      typeof value ===
        'string' &&
      value.trim()
    ) {
      const parsedValue =
        Number(value)

      if (
        Number.isFinite(
          parsedValue,
        )
      ) {
        return parsedValue
      }
    }
  }

  return null
}

function readIdentifier(
  record:
    EducationalContextRecord,

  fields:
    string[],
): string | null {
  for (
    const field of fields
  ) {
    const value =
      record[field]

    if (
      typeof value ===
        'string' &&
      value.trim()
    ) {
      return value.trim()
    }

    if (
      typeof value ===
        'number' &&
      Number.isFinite(value)
    ) {
      return String(value)
    }
  }

  return null
}

function hasMeaningfulValue(
  value: unknown,
): boolean {
  if (
    value === null ||
    value === undefined
  ) {
    return false
  }

  if (
    typeof value ===
    'string'
  ) {
    return (
      value.trim().length >
      0
    )
  }

  if (
    Array.isArray(value)
  ) {
    return (
      value.length >
      0
    )
  }

  return true
}

function hasAnyFieldValue(
  record:
    EducationalContextRecord,

  fields:
    string[],
): boolean {
  return fields.some(
    field =>
      hasMeaningfulValue(
        record[field],
      ),
  )
}

function parseDateValue(
  value: unknown,
): Date | null {
  if (
    typeof value !==
      'string' &&
    typeof value !==
      'number' &&
    !(value instanceof Date)
  ) {
    return null
  }

  const date =
    value instanceof Date
      ? new Date(
          value.getTime(),
        )
      : new Date(value)

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return null
  }

  return date
}

function readDate(
  record:
    EducationalContextRecord,

  fields:
    string[] = DATE_FIELDS,
): Date | null {
  for (
    const field of fields
  ) {
    const date =
      parseDateValue(
        record[field],
      )

    if (date) {
      return date
    }
  }

  return null
}

function startOfDay(
  date: Date,
): Date {
  const normalizedDate =
    new Date(date)

  normalizedDate.setHours(
    0,
    0,
    0,
    0,
  )

  return normalizedDate
}

function endOfDay(
  date: Date,
): Date {
  const normalizedDate =
    new Date(date)

  normalizedDate.setHours(
    23,
    59,
    59,
    999,
  )

  return normalizedDate
}

function addDays(
  date: Date,
  days: number,
): Date {
  const result =
    new Date(date)

  result.setDate(
    result.getDate() +
      days,
  )

  return result
}

function createDayRange(
  date: Date,
): DateRange {
  return {
    start:
      startOfDay(date),

    end:
      endOfDay(date),
  }
}

function createWeekRange(
  date: Date,
): DateRange {
  return {
    start:
      startOfDay(date),

    end:
      endOfDay(
        addDays(
          date,
          6,
        ),
      ),
  }
}

function isDateInsideRange(
  date: Date | null,

  range: DateRange,
): boolean {
  if (!date) {
    return false
  }

  const timestamp =
    date.getTime()

  return (
    timestamp >=
      range.start.getTime() &&
    timestamp <=
      range.end.getTime()
  )
}

function isDateBefore(
  date: Date | null,

  reference:
    Date,
): boolean {
  if (!date) {
    return false
  }

  return (
    date.getTime() <
    reference.getTime()
  )
}

function getReferenceDate(
  referenceDate:
    string,
): Date {
  const parsedDate =
    parseDateValue(
      referenceDate,
    )

  return (
    parsedDate ??
    new Date()
  )
}

function normalizePercentage(
  value: number,
): number {
  if (
    !Number.isFinite(
      value,
    )
  ) {
    return 0
  }

  return Math.min(
    100,
    Math.max(
      0,
      Math.round(value),
    ),
  )
}

function calculatePercentage(
  numerator: number,

  denominator: number,
): number {
  if (
    denominator <=
    0
  ) {
    return 0
  }

  return normalizePercentage(
    (
      numerator /
      denominator
    ) *
      100,
  )
}

function average(
  values: number[],
): number {
  if (
    values.length ===
    0
  ) {
    return 0
  }

  const total =
    values.reduce(
      (
        accumulator,
        value,
      ) =>
        accumulator +
        value,
      0,
    )

  return normalizePercentage(
    total /
      values.length,
  )
}

function getRecordStatus(
  record:
    EducationalContextRecord,
): string | null {
  return normalizeText(
    readText(
      record,
      [
        'status',
        'state',
        'situation',
        'situacao',
      ],
    ),
  )
}

function isCompletedRecord(
  record:
    EducationalContextRecord,
): boolean {
  const status =
    getRecordStatus(
      record,
    )

  return (
    status !== null &&
    COMPLETED_STATUSES.has(
      status,
    )
  )
}

function isCancelledRecord(
  record:
    EducationalContextRecord,
): boolean {
  const status =
    getRecordStatus(
      record,
    )

  return (
    status !== null &&
    CANCELLED_STATUSES.has(
      status,
    )
  )
}

function isActiveRecord(
  record:
    EducationalContextRecord,
): boolean {
  const status =
    getRecordStatus(
      record,
    )

  if (!status) {
    return false
  }

  return ACTIVE_STATUSES.has(
    status,
  )
}

function isPendingRecord(
  record:
    EducationalContextRecord,
): boolean {
  const status =
    getRecordStatus(
      record,
    )

  if (!status) {
    return false
  }

  return PENDING_STATUSES.has(
    status,
  )
}

function isOverdueRecord(
  record:
    EducationalContextRecord,

  referenceDate:
    Date,
): boolean {
  if (
    isCompletedRecord(
      record,
    ) ||
    isCancelledRecord(
      record,
    )
  ) {
    return false
  }

  const dueDate =
    readDate(
      record,
      [
        'due_date',
        'dueDate',
        'deadline',
        'end_date',
        'endDate',
        'planned_date',
        'plannedDate',
        'scheduled_date',
        'scheduledDate',
      ],
    )

  return isDateBefore(
    dueDate,
    startOfDay(
      referenceDate,
    ),
  )
}

function buildCounts(
  records:
    EducationalContextRecord[],

  referenceDate:
    Date,
): EducationalContextCounts {
  const counts =
    createEmptyContextCounts()

  counts.total =
    records.length

  for (
    const record of records
  ) {
    if (
      isCancelledRecord(
        record,
      )
    ) {
      counts.cancelled +=
        1

      continue
    }

    if (
      isCompletedRecord(
        record,
      )
    ) {
      counts.completed +=
        1

      continue
    }

    if (
      isOverdueRecord(
        record,
        referenceDate,
      )
    ) {
      counts.overdue +=
        1
    }

    if (
      isActiveRecord(
        record,
      )
    ) {
      counts.active +=
        1

      continue
    }

    counts.pending +=
      1
  }

  return counts
}

function countRecordsInRange(
  records:
    EducationalContextRecord[],

  range:
    DateRange,

  fields:
    string[] = DATE_FIELDS,
): number {
  return records.filter(
    record =>
      isDateInsideRange(
        readDate(
          record,
          fields,
        ),
        range,
      ),
  ).length
}

function getIds(
  records:
    EducationalContextRecord[],

  fields:
    string[] = [
      'id',
      'uuid',
    ],
): Set<string> {
  return new Set(
    records
      .map(
        record =>
          readIdentifier(
            record,
            fields,
          ),
      )
      .filter(
        (
          identifier,
        ): identifier is string =>
          Boolean(identifier),
      ),
  )
}

function countRecordsWithReference(
  records:
    EducationalContextRecord[],

  fields:
    string[],

  targetIds:
    Set<string>,
): number {
  return records.filter(
    record => {
      const referenceId =
        readIdentifier(
          record,
          fields,
        )

      return (
        referenceId !==
          null &&
        targetIds.has(
          referenceId,
        )
      )
    },
  ).length
}

function countHighPriorityOverdueTasks(
  records:
    EducationalContextRecord[],

  referenceDate:
    Date,
): number {
  return records.filter(
    record => {
      if (
        !isOverdueRecord(
          record,
          referenceDate,
        )
      ) {
        return false
      }

      const priority =
        normalizeText(
          readText(
            record,
            [
              'priority',
              'priority_level',
              'priorityLevel',
            ],
          ),
        )

      return (
        priority !==
          null &&
        HIGH_PRIORITIES.has(
          priority,
        )
      )
    },
  ).length
}

function estimateWorkload(
  todayEvents: number,

  todayTasks: number,

  todayLessons: number,
):
  | 'low'
  | 'balanced'
  | 'high'
  | 'overloaded'
  | 'unknown' {
  const workload =
    todayEvents +
    todayTasks +
    todayLessons

  if (
    workload ===
    0
  ) {
    return 'low'
  }

  if (
    workload <=
    4
  ) {
    return 'balanced'
  }

  if (
    workload <=
    7
  ) {
    return 'high'
  }

  return 'overloaded'
}

function determineContextStatus(
  sources:
    EducationalContextSource[],

  recordCount:
    number,

  warnings:
    string[],
): EducationalContextStatus {
  if (
    sources.length ===
    0
  ) {
    return 'empty'
  }

  if (
    warnings.length >
    0
  ) {
    return (
      recordCount >
      0
        ? 'degraded'
        : 'unavailable'
    )
  }

  if (
    recordCount ===
    0
  ) {
    return 'partial'
  }

  return 'available'
}

function getGreeting(
  referenceDate:
    Date,
): string {
  const hour =
    referenceDate.getHours()

  if (
    hour <
    12
  ) {
    return 'Bom dia'
  }

  if (
    hour <
    18
  ) {
    return 'Boa tarde'
  }

  return 'Boa noite'
}

function priorityRank(
  priority:
    EducationalContextPriority,
): number {
  if (
    priority ===
    'critical'
  ) {
    return 5
  }

  if (
    priority ===
    'high'
  ) {
    return 4
  }

  if (
    priority ===
    'medium'
  ) {
    return 3
  }

  if (
    priority ===
    'normal'
  ) {
    return 2
  }

  return 1
}

function sortByPriority<
  Item extends {
    priority:
      EducationalContextPriority
  },
>(
  items: Item[],
): Item[] {
  return [
    ...items,
  ].sort(
    (
      first,
      second,
    ) =>
      priorityRank(
        second.priority,
      ) -
      priorityRank(
        first.priority,
      ),
  )
}

function createAgendaAlerts(
  context:
    EducationalContext,
): EducationalContextAlert[] {
  const alerts:
    EducationalContextAlert[] = []

  const generatedAt =
    context.metadata.generatedAt

  if (
    context.agenda.tasks
      .counts.overdue >
    0
  ) {
    alerts.push({
      id:
        'agenda-overdue-tasks',

      priority:
        context.agenda.tasks
          .overdueHighPriority >
        0
          ? 'critical'
          : 'high',

      riskLevel:
        context.agenda.tasks
          .overdueHighPriority >
        0
          ? 'high'
          : 'medium',

      title:
        'Existem tarefas atrasadas',

      description:
        `${context.agenda.tasks.counts.overdue} tarefa(s) ultrapassaram o prazo previsto.`,

      reason:
        'Tarefas vencidas podem comprometer a organização da rotina e a execução dos planejamentos.',

      source:
        'agenda',

      relatedEntityType:
        'task',

      relatedEntityId:
        null,

      recommendedAction:
        'Revisar e atualizar as tarefas atrasadas.',

      actionHref:
        '/agenda/tarefas',

      createdAt:
        generatedAt,
    })
  }

  if (
    context.agenda.lessons
      .completedWithoutEvidence >
    0
  ) {
    alerts.push({
      id:
        'completed-lessons-without-evidence',

      priority:
        'high',

      riskLevel:
        'medium',

      title:
        'Aulas realizadas sem evidências',

      description:
        `${context.agenda.lessons.completedWithoutEvidence} aula(s) concluída(s) ainda não possuem evidência vinculada.`,

      reason:
        'A ausência de evidências reduz a capacidade de documentar, analisar e acompanhar a prática pedagógica.',

      source:
        'agenda',

      relatedEntityType:
        'lesson',

      relatedEntityId:
        null,

      recommendedAction:
        'Registrar as evidências das aulas concluídas.',

      actionHref:
        '/agenda/evidencias',

      createdAt:
        generatedAt,
    })
  }

  if (
    context.agenda.planning
      .withoutLessons >
    0
  ) {
    alerts.push({
      id:
        'planning-without-lessons',

      priority:
        'medium',

      riskLevel:
        'low',

      title:
        'Planejamentos ainda não executados',

      description:
        `${context.agenda.planning.withoutLessons} planejamento(s) ainda não originaram aulas.`,

      reason:
        'Planejamentos sem execução permanecem como intenção e não alimentam os indicadores de prática.',

      source:
        'agenda',

      relatedEntityType:
        'planning',

      relatedEntityId:
        null,

      recommendedAction:
        'Relacionar os planejamentos às aulas previstas.',

      actionHref:
        '/agenda/aulas',

      createdAt:
        generatedAt,
    })
  }

  return sortByPriority(
    alerts,
  )
}

function createAgendaRecommendations(
  context:
    EducationalContext,
): EducationalContextRecommendation[] {
  const recommendations:
    EducationalContextRecommendation[] = []

  if (
    context.agenda.planning
      .counts.total ===
    0
  ) {
    recommendations.push({
      id:
        'create-first-planning',

      priority:
        'high',

      title:
        'Crie o primeiro planejamento',

      description:
        'Ainda não existem planejamentos registrados no contexto atual.',

      reason:
        'O planejamento é a base para relacionar objetivos, aulas, evidências e indicadores.',

      expectedImpact:
        'Iniciar o ciclo operacional da Agenda Inteligente EDI.',

      source:
        'agenda',

      actionLabel:
        'Criar planejamento',

      actionHref:
        '/agenda/planejamento',

      requiresConfirmation:
        true,

      automaticExecutionAllowed:
        false,
    })
  }

  if (
    context.agenda.objectives
      .counts.active ===
      0 &&
    context.agenda.planning
      .counts.total >
      0
  ) {
    recommendations.push({
      id:
        'create-active-objective',

      priority:
        'high',

      title:
        'Defina um objetivo ativo',

      description:
        'Existem planejamentos, mas nenhum objetivo ativo orientando a execução.',

      reason:
        'Objetivos ativos permitem relacionar a intenção pedagógica às aulas e às evidências.',

      expectedImpact:
        'Aumentar a coerência entre planejamento, execução e acompanhamento.',

      source:
        'agenda',

      actionLabel:
        'Criar objetivo',

      actionHref:
        '/agenda/objetivos',

      requiresConfirmation:
        true,

      automaticExecutionAllowed:
        false,
    })
  }

  if (
    context.agenda.lessons
      .completedWithoutEvidence >
    0
  ) {
    recommendations.push({
      id:
        'register-pending-evidences',

      priority:
        'high',

      title:
        'Registre as evidências pendentes',

      description:
        `${context.agenda.lessons.completedWithoutEvidence} aula(s) realizada(s) ainda precisam de documentação.`,

      reason:
        'Evidências fortalecem o histórico pedagógico e a confiabilidade das análises.',

      expectedImpact:
        'Elevar a cobertura de evidências e melhorar a qualidade do contexto educacional.',

      source:
        'agenda',

      actionLabel:
        'Registrar evidências',

      actionHref:
        '/agenda/evidencias',

      requiresConfirmation:
        true,

      automaticExecutionAllowed:
        false,
    })
  }

  if (
    context.agenda.tasks
      .dueToday >
    0
  ) {
    recommendations.push({
      id:
        'review-today-tasks',

      priority:
        'medium',

      title:
        'Revise as tarefas de hoje',

      description:
        `${context.agenda.tasks.dueToday} tarefa(s) possuem prazo para hoje.`,

      reason:
        'Organizar as tarefas do dia reduz risco de atraso e sobrecarga acumulada.',

      expectedImpact:
        'Melhorar a organização operacional da rotina.',

      source:
        'agenda',

      actionLabel:
        'Abrir tarefas',

      actionHref:
        '/agenda/tarefas',

      requiresConfirmation:
        false,

      automaticExecutionAllowed:
        false,
    })
  }

  return sortByPriority(
    recommendations,
  )
}

function createAgendaPriorities(
  context:
    EducationalContext,
): EducationalContextDailyPriority[] {
  const priorities:
    EducationalContextDailyPriority[] = []

  if (
    context.agenda.tasks
      .counts.overdue >
    0
  ) {
    priorities.push({
      id:
        'resolve-overdue-tasks',

      priority:
        context.agenda.tasks
          .overdueHighPriority >
        0
          ? 'critical'
          : 'high',

      title:
        'Resolver tarefas atrasadas',

      description:
        `${context.agenda.tasks.counts.overdue} tarefa(s) precisam de revisão imediata.`,

      reason:
        'Existem prazos já ultrapassados no contexto operacional.',

      actionLabel:
        'Revisar tarefas',

      actionHref:
        '/agenda/tarefas',

      dueAt:
        null,

      relatedEntityType:
        'task',

      relatedEntityId:
        null,
    })
  }

  if (
    context.agenda.lessons
      .completedWithoutEvidence >
    0
  ) {
    priorities.push({
      id:
        'document-completed-lessons',

      priority:
        'high',

      title:
        'Documentar aulas realizadas',

      description:
        `${context.agenda.lessons.completedWithoutEvidence} aula(s) aguardam evidências.`,

      reason:
        'O registro das evidências completa o ciclo pedagógico e melhora as análises.',

      actionLabel:
        'Registrar evidências',

      actionHref:
        '/agenda/evidencias',

      dueAt:
        null,

      relatedEntityType:
        'lesson',

      relatedEntityId:
        null,
    })
  }

  if (
    context.agenda.lessons
      .scheduledToday >
    0
  ) {
    priorities.push({
      id:
        'follow-today-lessons',

      priority:
        'medium',

      title:
        'Acompanhar as aulas de hoje',

      description:
        `${context.agenda.lessons.scheduledToday} aula(s) estão previstas para hoje.`,

      reason:
        'A execução atualizada mantém planejamento, indicadores e recomendações coerentes.',

      actionLabel:
        'Abrir aulas',

      actionHref:
        '/agenda/aulas',

      dueAt:
        context.period
          .referenceDate,

      relatedEntityType:
        'lesson',

      relatedEntityId:
        null,
    })
  }

  if (
    priorities.length ===
    0
  ) {
    priorities.push({
      id:
        'review-operational-cycle',

      priority:
        'normal',

      title:
        'Revisar o ciclo pedagógico',

      description:
        'Não foram identificadas pendências críticas para o período atual.',

      reason:
        'Uma revisão breve ajuda a manter planejamentos, objetivos, aulas e evidências atualizados.',

      actionLabel:
        'Abrir Dashboard',

      actionHref:
        '/agenda/dashboard',

      dueAt:
        null,

      relatedEntityType:
        null,

      relatedEntityId:
        null,
    })
  }

  return sortByPriority(
    priorities,
  )
}

function createAgendaInsights(
  context:
    EducationalContext,
): EducationalContextInsight[] {
  const insights:
    EducationalContextInsight[] = []

  if (
    context.agenda.lessons
      .counts.total >
    0
  ) {
    insights.push({
      id:
        'lesson-execution-rate',

      title:
        'Execução das aulas',

      description:
        `A taxa atual de execução é de ${context.agenda.lessons.executionRate}%.`,

      explanation:
        'O indicador compara aulas concluídas com o total de aulas não canceladas.',

      source:
        'analytics',

      confidence:
        1,

      generatedAt:
        context.metadata
          .generatedAt,
    })
  }

  if (
    context.agenda.evidences
      .counts.total >
    0 ||
    context.agenda.lessons
      .counts.completed >
    0
  ) {
    insights.push({
      id:
        'evidence-coverage-rate',

      title:
        'Cobertura de evidências',

      description:
        `A cobertura atual das aulas concluídas é de ${context.agenda.evidences.coverageRate}%.`,

      explanation:
        'O indicador considera aulas concluídas que possuem evidência vinculada.',

      source:
        'analytics',

      confidence:
        1,

      generatedAt:
        context.metadata
          .generatedAt,
    })
  }

  if (
    context.agenda.objectives
      .counts.total >
    0
  ) {
    insights.push({
      id:
        'objective-average-progress',

      title:
        'Progresso dos objetivos',

      description:
        `O progresso médio registrado é de ${context.agenda.objectives.averageProgress}%.`,

      explanation:
        'A média utiliza os valores de progresso informados nos objetivos disponíveis.',

      source:
        'analytics',

      confidence:
        1,

      generatedAt:
        context.metadata
          .generatedAt,
    })
  }

  return insights
}

function buildContextFromAgenda(
  input:
    CreateEducationalContextInput,
): EducationalContext {
  const planning =
    asRecordList(
      input.agenda
        ?.planning,
    )

  const objectives =
    asRecordList(
      input.agenda
        ?.objectives,
    )

  const lessons =
    asRecordList(
      input.agenda
        ?.lessons,
    )

  const evidences =
    asRecordList(
      input.agenda
        ?.evidences,
    )

  const tasks =
    asRecordList(
      input.agenda
        ?.tasks,
    )

  const calendarEvents =
    asRecordList(
      input.agenda
        ?.calendarEvents,
    )

  const context =
    createEmptyEducationalContext(
      input.identity,
      input.period,
      input.sources,
    )

  const referenceDate =
    getReferenceDate(
      input.period
        .referenceDate,
    )

  const todayRange =
    createDayRange(
      referenceDate,
    )

  const tomorrowRange =
    createDayRange(
      addDays(
        referenceDate,
        1,
      ),
    )

  const weekRange =
    createWeekRange(
      referenceDate,
    )

  const planningIds =
    getIds(
      planning,
    )

  const objectiveIds =
    getIds(
      objectives,
    )

  const lessonIds =
    getIds(
      lessons,
    )

  const planningIdsWithLessons =
    new Set(
      lessons
        .map(
          lesson =>
            readIdentifier(
              lesson,
              PLANNING_LESSON_FIELDS,
            ),
        )
        .filter(
          (
            identifier,
          ): identifier is string =>
            Boolean(identifier),
        ),
    )

  const lessonIdsWithEvidence =
    new Set(
      evidences
        .map(
          evidence =>
            readIdentifier(
              evidence,
              LESSON_EVIDENCE_FIELDS,
            ),
        )
        .filter(
          (
            identifier,
          ): identifier is string =>
            Boolean(identifier),
        ),
    )

  const objectiveIdsWithEvidence =
    new Set(
      evidences
        .map(
          evidence =>
            readIdentifier(
              evidence,
              OBJECTIVE_EVIDENCE_FIELDS,
            ),
        )
        .filter(
          (
            identifier,
          ): identifier is string =>
            Boolean(identifier),
        ),
    )

  const completedLessons =
    lessons.filter(
      isCompletedRecord,
    )

  const nonCancelledLessons =
    lessons.filter(
      lesson =>
        !isCancelledRecord(
          lesson,
        ),
    )

  const completedLessonsWithEvidence =
    completedLessons.filter(
      lesson => {
        const lessonId =
          readIdentifier(
            lesson,
            [
              'id',
              'uuid',
            ],
          )

        return (
          lessonId !==
            null &&
          lessonIdsWithEvidence.has(
            lessonId,
          )
        )
      },
    )

  const activeObjectives =
    objectives.filter(
      objective =>
        isActiveRecord(
          objective,
        ),
    )

  const objectiveProgressValues =
    objectives
      .map(
        objective =>
          readNumber(
            objective,
            [
              'progress',
              'progress_percentage',
              'progressPercentage',
              'completion_rate',
              'completionRate',
            ],
          ),
      )
      .filter(
        (
          value,
        ): value is number =>
          value !== null,
      )
      .map(
        normalizePercentage,
      )

  const lowProgressObjectives =
    objectives.filter(
      objective => {
        const progress =
          readNumber(
            objective,
            [
              'progress',
              'progress_percentage',
              'progressPercentage',
              'completion_rate',
              'completionRate',
            ],
          )

        return (
          progress !==
            null &&
          progress <
            50 &&
          !isCompletedRecord(
            objective,
          ) &&
          !isCancelledRecord(
            objective,
          )
        )
      },
    )

  context.agenda.planning = {
    counts:
      buildCounts(
        planning,
        referenceDate,
      ),

    withoutObjectives:
      planning.filter(
        record =>
          !hasAnyFieldValue(
            record,
            PLANNING_OBJECTIVE_FIELDS,
          ),
      ).length,

    withoutLessons:
      planning.filter(
        record => {
          const planningId =
            readIdentifier(
              record,
              [
                'id',
                'uuid',
              ],
            )

          return (
            planningId !==
              null &&
            !planningIdsWithLessons.has(
              planningId,
            )
          )
        },
      ).length,

    dueToday:
      countRecordsInRange(
        planning,
        todayRange,
      ),

    dueThisWeek:
      countRecordsInRange(
        planning,
        weekRange,
      ),

    completionRate:
      calculatePercentage(
        planning.filter(
          isCompletedRecord,
        ).length,
        planning.filter(
          item =>
            !isCancelledRecord(
              item,
            ),
        ).length,
      ),

    records:
      planning,
  }

  context.agenda.objectives = {
    counts:
      buildCounts(
        objectives,
        referenceDate,
      ),

    withoutEvidence:
      activeObjectives.filter(
        objective => {
          const objectiveId =
            readIdentifier(
              objective,
              [
                'id',
                'uuid',
              ],
            )

          return (
            objectiveId !==
              null &&
            !objectiveIdsWithEvidence.has(
              objectiveId,
            )
          )
        },
      ).length,

    withoutPlanning:
      objectives.filter(
        objective => {
          const planningId =
            readIdentifier(
              objective,
              [
                'planning_id',
                'planningId',
              ],
            )

          return (
            planningId !==
              null &&
            !planningIds.has(
              planningId,
            )
          )
        },
      ).length,

    lowProgress:
      lowProgressObjectives.length,

    averageProgress:
      average(
        objectiveProgressValues,
      ),

    records:
      objectives,
  }

  context.agenda.lessons = {
    counts:
      buildCounts(
        lessons,
        referenceDate,
      ),

    scheduledToday:
      countRecordsInRange(
        lessons,
        todayRange,
      ),

    scheduledTomorrow:
      countRecordsInRange(
        lessons,
        tomorrowRange,
      ),

    scheduledThisWeek:
      countRecordsInRange(
        lessons,
        weekRange,
      ),

    completedWithoutEvidence:
      completedLessons.filter(
        lesson => {
          const lessonId =
            readIdentifier(
              lesson,
              [
                'id',
                'uuid',
              ],
            )

          return (
            lessonId !==
              null &&
            !lessonIdsWithEvidence.has(
              lessonId,
            )
          )
        },
      ).length,

    executionRate:
      calculatePercentage(
        completedLessons.length,
        nonCancelledLessons.length,
      ),

    records:
      lessons,
  }

  context.agenda.evidences = {
    counts:
      buildCounts(
        evidences,
        referenceDate,
      ),

    withoutLesson:
      evidences.filter(
        evidence => {
          const lessonId =
            readIdentifier(
              evidence,
              LESSON_EVIDENCE_FIELDS,
            )

          return (
            lessonId ===
              null ||
            !lessonIds.has(
              lessonId,
            )
          )
        },
      ).length,

    withoutObjective:
      evidences.filter(
        evidence => {
          const objectiveId =
            readIdentifier(
              evidence,
              OBJECTIVE_EVIDENCE_FIELDS,
            )

          return (
            objectiveId ===
              null ||
            !objectiveIds.has(
              objectiveId,
            )
          )
        },
      ).length,

    registeredToday:
      countRecordsInRange(
        evidences,
        todayRange,
        REGISTRATION_DATE_FIELDS,
      ),

    registeredThisWeek:
      countRecordsInRange(
        evidences,
        weekRange,
        REGISTRATION_DATE_FIELDS,
      ),

    coverageRate:
      calculatePercentage(
        completedLessonsWithEvidence.length,
        completedLessons.length,
      ),

    records:
      evidences,
  }

  context.agenda.tasks = {
    counts:
      buildCounts(
        tasks,
        referenceDate,
      ),

    dueToday:
      countRecordsInRange(
        tasks,
        todayRange,
      ),

    dueTomorrow:
      countRecordsInRange(
        tasks,
        tomorrowRange,
      ),

    dueThisWeek:
      countRecordsInRange(
        tasks,
        weekRange,
      ),

    overdueHighPriority:
      countHighPriorityOverdueTasks(
        tasks,
        referenceDate,
      ),

    records:
      tasks,
  }

  const eventsToday =
    countRecordsInRange(
      calendarEvents,
      todayRange,
    )

  context.agenda.calendar = {
    eventsToday,

    eventsTomorrow:
      countRecordsInRange(
        calendarEvents,
        tomorrowRange,
      ),

    eventsThisWeek:
      countRecordsInRange(
        calendarEvents,
        weekRange,
      ),

    conflictingEvents:
      0,

    workloadLevel:
      estimateWorkload(
        eventsToday,
        context.agenda.tasks
          .dueToday,
        context.agenda.lessons
          .scheduledToday,
      ),

    records:
      calendarEvents,
  }

  const planningScore =
    context.agenda.planning
      .counts.total >
    0
      ? average([
          context.agenda.planning
            .completionRate,

          calculatePercentage(
            context.agenda.planning
              .counts.total -
              context.agenda.planning
                .withoutObjectives,

            context.agenda.planning
              .counts.total,
          ),

          calculatePercentage(
            context.agenda.planning
              .counts.total -
              context.agenda.planning
                .withoutLessons,

            context.agenda.planning
              .counts.total,
          ),
        ])
      : 0

  const objectiveScore =
    context.agenda.objectives
      .counts.total >
    0
      ? average([
          context.agenda.objectives
            .averageProgress,

          calculatePercentage(
            context.agenda.objectives
              .counts.total -
              context.agenda.objectives
                .withoutEvidence,

            context.agenda.objectives
              .counts.total,
          ),
        ])
      : 0

  const executionScore =
    context.agenda.lessons
      .executionRate

  const evidenceScore =
    context.agenda.evidences
      .coverageRate

  const organizationScore =
    tasks.length >
    0
      ? calculatePercentage(
          tasks.length -
            context.agenda.tasks
              .counts.overdue,

          tasks.length,
        )
      : 100

  const availableScores =
    [
      planning.length >
        0
        ? planningScore
        : null,

      objectives.length >
        0
        ? objectiveScore
        : null,

      lessons.length >
        0
        ? executionScore
        : null,

      completedLessons.length >
        0
        ? evidenceScore
        : null,

      tasks.length >
        0
        ? organizationScore
        : null,
    ].filter(
      (
        score,
      ): score is number =>
        score !== null,
    )

  const overallScore =
    availableScores.length >
    0
      ? average(
          availableScores,
        )
      : 0

  const pedagogicalHealthIndex =
    average([
      planningScore,
      objectiveScore,
      executionScore,
      evidenceScore,
      organizationScore,
    ])

  context.indicators = {
    planningScore,

    objectiveScore,

    executionScore,

    evidenceScore,

    organizationScore,

    overallScore,

    pedagogicalHealthIndex,

    metrics: [
      {
        id:
          'planning-score',

        label:
          'Planejamento',

        value:
          planningScore,

        minimum:
          0,

        maximum:
          100,

        unit:
          'score',

        source:
          'analytics',

        explanation:
          'Combina conclusão, vínculo com objetivos e transformação dos planejamentos em aulas.',
      },
      {
        id:
          'objective-score',

        label:
          'Objetivos',

        value:
          objectiveScore,

        minimum:
          0,

        maximum:
          100,

        unit:
          'score',

        source:
          'analytics',

        explanation:
          'Combina progresso médio e cobertura de evidências dos objetivos.',
      },
      {
        id:
          'execution-score',

        label:
          'Execução',

        value:
          executionScore,

        minimum:
          0,

        maximum:
          100,

        unit:
          'score',

        source:
          'analytics',

        explanation:
          'Representa a proporção de aulas concluídas entre as aulas não canceladas.',
      },
      {
        id:
          'evidence-score',

        label:
          'Evidências',

        value:
          evidenceScore,

        minimum:
          0,

        maximum:
          100,

        unit:
          'score',

        source:
          'analytics',

        explanation:
          'Representa a cobertura de evidências das aulas concluídas.',
      },
      {
        id:
          'organization-score',

        label:
          'Organização',

        value:
          organizationScore,

        minimum:
          0,

        maximum:
          100,

        unit:
          'score',

        source:
          'analytics',

        explanation:
          'Representa a proporção de tarefas que não estão atrasadas.',
      },
    ],
  }

  const totalAgendaRecords =
    planning.length +
    objectives.length +
    lessons.length +
    evidences.length +
    tasks.length +
    calendarEvents.length

  const warnings:
    string[] = []

  if (
    input.sources.includes(
      'class_diary',
    ) &&
    !input.classDiary
  ) {
    warnings.push(
      'O Diário de Classe foi declarado como fonte, mas ainda não possui dados disponíveis.',
    )
  }

  if (
    input.sources.includes(
      'professional_development',
    ) &&
    !input
      .professionalDevelopment
  ) {
    warnings.push(
      'O domínio de desenvolvimento profissional foi declarado como fonte, mas ainda não possui dados disponíveis.',
    )
  }

  context.metadata.status =
    determineContextStatus(
      input.sources,
      totalAgendaRecords,
      warnings,
    )

  context.metadata.warnings =
    warnings

  context.metadata.dataQualityScore =
    totalAgendaRecords >
    0
      ? normalizePercentage(
          100 -
            (
              context.agenda
                .evidences
                .withoutLesson +
              context.agenda
                .evidences
                .withoutObjective +
              context.agenda
                .objectives
                .withoutPlanning
            ) *
              5,
        )
      : null

  context.metadata
    .humanReviewRequired =
    context.agenda.tasks
      .counts.overdue >
      0 ||
    context.agenda.lessons
      .completedWithoutEvidence >
      0

  const alerts =
    createAgendaAlerts(
      context,
    )

  const recommendations =
    createAgendaRecommendations(
      context,
    )

  const priorities =
    createAgendaPriorities(
      context,
    )

  const insights =
    createAgendaInsights(
      context,
    )

  context.dailySummary = {
    greeting:
      getGreeting(
        referenceDate,
      ),

    headline:
      priorities[0]
        ?.title ??
      'Ciclo pedagógico atualizado',

    summary:
      [
        `${context.agenda.lessons.scheduledToday} aula(s) prevista(s) para hoje.`,

        `${context.agenda.tasks.dueToday} tarefa(s) com prazo para hoje.`,

        `${context.agenda.lessons.completedWithoutEvidence} aula(s) realizada(s) sem evidência.`,
      ].join(' '),

    priorities,

    alerts,

    recommendations,

    insights,
  }

  return context
}

export function createEducationalContext(
  input:
    CreateEducationalContextInput,
): EducationalContextResult {
  const errors:
    string[] = []

  const warnings:
    string[] = []

  if (
    !input.identity
      .userId
      .trim()
  ) {
    errors.push(
      'O identificador do usuário é obrigatório.',
    )
  }

  if (
    !input.period
      .referenceDate
      .trim()
  ) {
    errors.push(
      'A data de referência é obrigatória.',
    )
  }

  if (
    !input.period
      .timezone
      .trim()
  ) {
    errors.push(
      'O fuso horário é obrigatório.',
    )
  }

  if (
    input.sources.length ===
    0
  ) {
    warnings.push(
      'Nenhuma fonte de dados foi informada.',
    )
  }

  if (
    errors.length >
    0
  ) {
    return {
      success:
        false,

      context:
        null,

      errors,

      warnings,
    }
  }

  try {
    const context =
      buildContextFromAgenda(
        input,
      )

    return {
      success:
        true,

      context,

      errors:
        [],

      warnings: [
        ...warnings,
        ...context.metadata
          .warnings,
      ],
    }
  } catch (error) {
    return {
      success:
        false,

      context:
        null,

      errors: [
        error instanceof Error
          ? error.message
          : 'Não foi possível construir o contexto educacional.',
      ],

      warnings,
    }
  }
}

export const educationalContextService = {
  create:
    createEducationalContext,

  createEmpty:
    createEmptyEducationalContext,
}