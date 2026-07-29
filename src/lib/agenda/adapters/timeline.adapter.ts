import type {
  IntelligentTimelineItem,
  IntelligentTimelineStatus,
} from '@/components/dashboard/IntelligentTimeline'

import type {
  AgendaPlanning,
} from '@/lib/agenda/repository/planning.repository'

import type {
  AgendaObjective,
} from '@/lib/agenda/repository/objectives.repository'

import type {
  AgendaLesson,
} from '@/lib/agenda/repository/lessons.repository'

import type {
  AgendaEvidence,
} from '@/lib/agenda/repository/evidences.repository'

export type AgendaTimelineInput = {
  planning?: AgendaPlanning[]
  objectives?: AgendaObjective[]
  lessons?: AgendaLesson[]
  evidences?: AgendaEvidence[]
}

export type AgendaTimelineOptions = {
  referenceDate?: Date
  includePlanning?: boolean
  includeObjectives?: boolean
  includeLessons?: boolean
  includeEvidences?: boolean
}

const COMPLETED_PLANNING_STATUSES =
  new Set([
    'executado',
    'concluido',
    'concluído',
  ])

const CANCELLED_PLANNING_STATUSES =
  new Set([
    'arquivado',
  ])

const COMPLETED_OBJECTIVE_STATUSES =
  new Set([
    'concluido',
  ])

const CANCELLED_OBJECTIVE_STATUSES =
  new Set([
    'cancelado',
    'arquivado',
    'suspenso',
  ])

const COMPLETED_LESSON_STATUSES =
  new Set([
    'realizada',
    'parcialmente_realizada',
  ])

const CANCELLED_LESSON_STATUSES =
  new Set([
    'cancelada',
  ])

function normalizeText(
  value:
    string |
    null |
    undefined,
): string {
  if (
    typeof value !==
    'string'
  ) {
    return ''
  }

  return value.trim()
}

function normalizeDate(
  value:
    string |
    null |
    undefined,
): string | null {
  const normalizedValue =
    normalizeText(
      value,
    )

  if (
    !normalizedValue
  ) {
    return null
  }

  const date =
    new Date(
      normalizedValue,
    )

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return null
  }

  return normalizedValue
}

function combineDateAndTime(
  dateValue:
    string |
    null |
    undefined,

  timeValue:
    string |
    null |
    undefined,
): string | null {
  const date =
    normalizeText(
      dateValue,
    )

  if (
    !date
  ) {
    return null
  }

  const time =
    normalizeText(
      timeValue,
    )

  if (
    !time
  ) {
    return normalizeDate(
      date,
    )
  }

  const combinedValue =
    `${date}T${time}`

  return (
    normalizeDate(
      combinedValue,
    ) ??
    normalizeDate(
      date,
    )
  )
}

function startOfDay(
  value: Date,
): Date {
  const date =
    new Date(
      value,
    )

  date.setHours(
    0,
    0,
    0,
    0,
  )

  return date
}

function isPastDate(
  value: string,
  referenceDate: Date,
): boolean {
  const parsedDate =
    new Date(
      value,
    )

  if (
    Number.isNaN(
      parsedDate.getTime(),
    )
  ) {
    return false
  }

  return (
    startOfDay(
      parsedDate,
    ).getTime() <
    startOfDay(
      referenceDate,
    ).getTime()
  )
}

function joinContext(
  values:
    Array<
      string |
      null |
      undefined
    >,
): string | null {
  const normalizedValues =
    values
      .map(
        normalizeText,
      )
      .filter(
        Boolean,
      )

  if (
    normalizedValues.length ===
    0
  ) {
    return null
  }

  return normalizedValues.join(
    ' · ',
  )
}

function normalizeProgress(
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
    Math.max(
      Math.round(
        value,
      ),
      0,
    ),
    100,
  )
}

function getPlanningStatus(
  planning:
    AgendaPlanning,

  date:
    string,

  referenceDate:
    Date,
): IntelligentTimelineStatus {
  const status =
    normalizeText(
      planning.status,
    ).toLowerCase()

  if (
    COMPLETED_PLANNING_STATUSES
      .has(
        status,
      )
  ) {
    return 'completed'
  }

  if (
    CANCELLED_PLANNING_STATUSES
      .has(
        status,
      )
  ) {
    return 'cancelled'
  }

  if (
    isPastDate(
      date,
      referenceDate,
    )
  ) {
    return 'attention'
  }

  return 'pending'
}

function getObjectiveStatus(
  objective:
    AgendaObjective,

  date:
    string,

  referenceDate:
    Date,
): IntelligentTimelineStatus {
  const status =
    normalizeText(
      objective.status,
    ).toLowerCase()

  if (
    COMPLETED_OBJECTIVE_STATUSES
      .has(
        status,
      ) ||
    objective.progress >=
      100
  ) {
    return 'completed'
  }

  if (
    CANCELLED_OBJECTIVE_STATUSES
      .has(
        status,
      )
  ) {
    return 'cancelled'
  }

  if (
    isPastDate(
      date,
      referenceDate,
    )
  ) {
    return 'attention'
  }

  return 'pending'
}

function getLessonStatus(
  lesson:
    AgendaLesson,

  date:
    string,

  referenceDate:
    Date,
): IntelligentTimelineStatus {
  const status =
    normalizeText(
      lesson.status,
    ).toLowerCase()

  if (
    COMPLETED_LESSON_STATUSES
      .has(
        status,
      )
  ) {
    return 'completed'
  }

  if (
    CANCELLED_LESSON_STATUSES
      .has(
        status,
      )
  ) {
    return 'cancelled'
  }

  if (
    status ===
    'reagendada'
  ) {
    return 'informational'
  }

  if (
    isPastDate(
      date,
      referenceDate,
    )
  ) {
    return 'attention'
  }

  return 'pending'
}

function getPlanningDescription(
  planning:
    AgendaPlanning,
): string {
  const description =
    normalizeText(
      planning.description,
    )

  if (
    description
  ) {
    return description
  }

  const objective =
    normalizeText(
      planning.objective,
    )

  if (
    objective
  ) {
    return objective
  }

  return (
    'Planejamento registrado para organização do ciclo pedagógico.'
  )
}

function getObjectiveDescription(
  objective:
    AgendaObjective,
): string {
  const description =
    normalizeText(
      objective.description,
    )

  if (
    description
  ) {
    return description
  }

  const expectedIndicator =
    normalizeText(
      objective
        .expected_indicator,
    )

  if (
    expectedIndicator
  ) {
    return (
      `Indicador esperado: ${expectedIndicator}`
    )
  }

  return (
    'Objetivo pedagógico em acompanhamento.'
  )
}

function getLessonDescription(
  lesson:
    AgendaLesson,
): string {
  const description =
    normalizeText(
      lesson.description,
    )

  if (
    description
  ) {
    return description
  }

  const nextAction =
    normalizeText(
      lesson.next_action,
    )

  if (
    nextAction
  ) {
    return (
      `Próxima ação: ${nextAction}`
    )
  }

  return (
    'Aula registrada no ciclo pedagógico.'
  )
}

function getEvidenceDescription(
  evidence:
    AgendaEvidence,
): string {
  const description =
    normalizeText(
      evidence.description,
    )

  if (
    description
  ) {
    return description
  }

  return (
    'Evidência pedagógica registrada com rastreabilidade e governança.'
  )
}

function planningToTimelineItem(
  planning:
    AgendaPlanning,

  referenceDate:
    Date,
): IntelligentTimelineItem | null {
  if (
    planning.deleted_at
  ) {
    return null
  }

  const date =
    combineDateAndTime(
      planning.planned_date,
      planning
        .planned_start_time,
    ) ??
    normalizeDate(
      planning.created_at,
    )

  if (
    !date
  ) {
    return null
  }

  const status =
    getPlanningStatus(
      planning,
      date,
      referenceDate,
    )

  return {
    id:
      `planning:${planning.id}`,

    title:
      planning.title,

    description:
      getPlanningDescription(
        planning,
      ),

    date,

    time:
      normalizeText(
        planning
          .planned_start_time,
      ) ||
      null,

    status,

    category:
      'Planejamento',

    href:
      '/agenda/planejamento',

    actionLabel:
      status ===
      'completed'
        ? 'Consultar planejamento'
        : 'Abrir planejamento',

    contextLabel:
      joinContext([
        planning.subject,
        planning.class_name,
      ]),

    relatedRecords:
      null,
  }
}

function objectiveToTimelineItem(
  objective:
    AgendaObjective,

  referenceDate:
    Date,
): IntelligentTimelineItem | null {
  if (
    objective.deleted_at
  ) {
    return null
  }

  const date =
    normalizeDate(
      objective.end_date,
    ) ??
    normalizeDate(
      objective.start_date,
    ) ??
    normalizeDate(
      objective.created_at,
    )

  if (
    !date
  ) {
    return null
  }

  const status =
    getObjectiveStatus(
      objective,
      date,
      referenceDate,
    )

  const progress =
    normalizeProgress(
      objective.progress,
    )

  return {
    id:
      `objective:${objective.id}`,

    title:
      objective.title,

    description:
      getObjectiveDescription(
        objective,
      ),

    date,

    time:
      null,

    status,

    category:
      'Objetivo',

    href:
      '/agenda/objetivos',

    actionLabel:
      status ===
      'completed'
        ? 'Consultar objetivo'
        : 'Acompanhar objetivo',

    contextLabel:
      joinContext([
        objective.subject,
        objective.period,
        `${progress}% concluído`,
      ]),

    relatedRecords:
      null,
  }
}

function lessonToTimelineItem(
  lesson:
    AgendaLesson,

  referenceDate:
    Date,
): IntelligentTimelineItem | null {
  if (
    lesson.deleted_at
  ) {
    return null
  }

  const date =
    normalizeDate(
      lesson.completed_at,
    ) ??
    combineDateAndTime(
      lesson.scheduled_date,
      lesson.start_time,
    ) ??
    normalizeDate(
      lesson.created_at,
    )

  if (
    !date
  ) {
    return null
  }

  const status =
    getLessonStatus(
      lesson,
      date,
      referenceDate,
    )

  return {
    id:
      `lesson:${lesson.id}`,

    title:
      lesson.title,

    description:
      getLessonDescription(
        lesson,
      ),

    date,

    time:
      normalizeText(
        lesson.start_time,
      ) ||
      null,

    status,

    category:
      'Aula',

    href:
      '/agenda/aulas',

    actionLabel:
      status ===
      'completed'
        ? 'Consultar aula'
        : 'Abrir aula',

    contextLabel:
      joinContext([
        lesson.subject,
        lesson.status ===
        'reagendada'
          ? 'Aula reagendada'
          : null,
      ]),

    relatedRecords:
      lesson.skills.length >
      0
        ? lesson.skills.length
        : null,
  }
}

function evidenceToTimelineItem(
  evidence:
    AgendaEvidence,
): IntelligentTimelineItem | null {
  if (
    evidence.deleted_at
  ) {
    return null
  }

  const date =
    normalizeDate(
      evidence.created_at,
    )

  if (
    !date
  ) {
    return null
  }

  const linkedRecords =
    [
      evidence.planning_id,
      evidence.lesson_id,
      evidence.objective_id,
      evidence.event_id,
    ].filter(
      Boolean,
    ).length

  return {
    id:
      `evidence:${evidence.id}`,

    title:
      evidence.title,

    description:
      getEvidenceDescription(
        evidence,
      ),

    date,

    time:
      null,

    status:
      'completed',

    category:
      'Evidência',

    href:
      '/agenda/evidencias',

    actionLabel:
      'Consultar evidência',

    contextLabel:
      joinContext([
        evidence.evidence_type,
        evidence.storage_path
          ? 'Armazenamento protegido'
          : null,
      ]),

    relatedRecords:
      linkedRecords >
      0
        ? linkedRecords
        : null,
  }
}

function compareTimelineItems(
  firstItem:
    IntelligentTimelineItem,

  secondItem:
    IntelligentTimelineItem,
): number {
  const firstDate =
    new Date(
      firstItem.date,
    ).getTime()

  const secondDate =
    new Date(
      secondItem.date,
    ).getTime()

  if (
    Number.isNaN(
      firstDate,
    ) &&
    Number.isNaN(
      secondDate,
    )
  ) {
    return firstItem.title.localeCompare(
      secondItem.title,
      'pt-BR',
    )
  }

  if (
    Number.isNaN(
      firstDate,
    )
  ) {
    return 1
  }

  if (
    Number.isNaN(
      secondDate,
    )
  ) {
    return -1
  }

  return (
    firstDate -
    secondDate
  )
}

export function createAgendaTimelineItems(
  input:
    AgendaTimelineInput,

  options:
    AgendaTimelineOptions = {},
): IntelligentTimelineItem[] {
  const {
    planning =
      [],

    objectives =
      [],

    lessons =
      [],

    evidences =
      [],
  } = input

  const referenceDate =
    options.referenceDate ??
    new Date()

  const includePlanning =
    options.includePlanning ??
    true

  const includeObjectives =
    options.includeObjectives ??
    true

  const includeLessons =
    options.includeLessons ??
    true

  const includeEvidences =
    options.includeEvidences ??
    true

  const timelineItems:
    IntelligentTimelineItem[] = []

  if (
    includePlanning
  ) {
    planning.forEach(
      record => {
        const item =
          planningToTimelineItem(
            record,
            referenceDate,
          )

        if (
          item
        ) {
          timelineItems.push(
            item,
          )
        }
      },
    )
  }

  if (
    includeObjectives
  ) {
    objectives.forEach(
      record => {
        const item =
          objectiveToTimelineItem(
            record,
            referenceDate,
          )

        if (
          item
        ) {
          timelineItems.push(
            item,
          )
        }
      },
    )
  }

  if (
    includeLessons
  ) {
    lessons.forEach(
      record => {
        const item =
          lessonToTimelineItem(
            record,
            referenceDate,
          )

        if (
          item
        ) {
          timelineItems.push(
            item,
          )
        }
      },
    )
  }

  if (
    includeEvidences
  ) {
    evidences.forEach(
      record => {
        const item =
          evidenceToTimelineItem(
            record,
          )

        if (
          item
        ) {
          timelineItems.push(
            item,
          )
        }
      },
    )
  }

  return timelineItems.sort(
    compareTimelineItems,
  )
}