import type {
  AgendaPlanning,
} from '@/lib/agenda/repository/planning.repository'

export type PlanningProgressStatus =
  | 'sem_base'
  | 'nao_iniciado'
  | 'no_ritmo'
  | 'adiantado'
  | 'atencao'
  | 'atrasado'
  | 'concluido'

export type PlanningProgressSnapshot = {
  plannedLessons: number | null
  completedLessons: number
  expectedLessons: number | null
  completionPercentage: number | null
  expectedPercentage: number | null
  paceDeviationPercentagePoints: number | null
  status: PlanningProgressStatus
  referenceDate: string
}

function clamp(
  value: number,
  minimum: number,
  maximum: number,
): number {
  return Math.min(
    maximum,
    Math.max(minimum, value),
  )
}

function roundPercentage(
  value: number,
): number {
  return Math.round(value * 10) / 10
}

function parseDateAtStartOfDay(
  value: string,
): Date {
  const date = new Date(`${value}T00:00:00`)

  if (Number.isNaN(date.getTime())) {
    throw new Error('Data do planejamento inválida.')
  }

  return date
}

function daysBetweenInclusive(
  start: Date,
  end: Date,
): number {
  const millisecondsPerDay = 24 * 60 * 60 * 1000
  return Math.floor(
    (end.getTime() - start.getTime()) / millisecondsPerDay,
  ) + 1
}

function resolveStatus(
  plannedLessons: number,
  completedLessons: number,
  expectedLessons: number,
  referenceDate: Date,
  endDate: Date,
): PlanningProgressStatus {
  if (completedLessons >= plannedLessons) {
    return 'concluido'
  }

  if (completedLessons === 0 && expectedLessons === 0) {
    return 'nao_iniciado'
  }

  const deviation = completedLessons - expectedLessons

  if (deviation >= 1) {
    return 'adiantado'
  }

  if (deviation >= 0) {
    return 'no_ritmo'
  }

  if (referenceDate > endDate) {
    return 'atrasado'
  }

  return deviation <= -2
    ? 'atrasado'
    : 'atencao'
}

/**
 * Calcula a situação operacional do planejamento sem persistir percentuais.
 * Nesta primeira etapa, o ritmo esperado é distribuído proporcionalmente pelos
 * dias do período. A próxima etapa substituirá esta base pelo calendário letivo
 * e pelos eventos que impactam aulas/dias letivos.
 */
export function calculatePlanningProgress(
  planning: Pick<
    AgendaPlanning,
    | 'planning_start_date'
    | 'planning_end_date'
    | 'planned_lessons'
    | 'completed_lessons'
  >,
  referenceDate = new Date(),
): PlanningProgressSnapshot {
  const plannedLessons = planning.planned_lessons ?? null
  const completedLessons = planning.completed_lessons ?? 0

  const baseSnapshot: PlanningProgressSnapshot = {
    plannedLessons,
    completedLessons,
    expectedLessons: null,
    completionPercentage: null,
    expectedPercentage: null,
    paceDeviationPercentagePoints: null,
    status: 'sem_base',
    referenceDate: referenceDate.toISOString().slice(0, 10),
  }

  if (
    !plannedLessons ||
    plannedLessons <= 0 ||
    !planning.planning_start_date ||
    !planning.planning_end_date
  ) {
    return baseSnapshot
  }

  const startDate = parseDateAtStartOfDay(
    planning.planning_start_date,
  )
  const endDate = parseDateAtStartOfDay(
    planning.planning_end_date,
  )
  const currentDate = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate(),
  )

  if (endDate < startDate) {
    throw new Error(
      'A data final do planejamento não pode ser anterior à data inicial.',
    )
  }

  const totalDays = daysBetweenInclusive(
    startDate,
    endDate,
  )

  const elapsedDays = clamp(
    daysBetweenInclusive(
      startDate,
      currentDate,
    ),
    0,
    totalDays,
  )

  const expectedLessons = Math.min(
    plannedLessons,
    Math.round(
      (plannedLessons * elapsedDays) / totalDays,
    ),
  )

  const completionPercentage = roundPercentage(
    (completedLessons / plannedLessons) * 100,
  )
  const expectedPercentage = roundPercentage(
    (expectedLessons / plannedLessons) * 100,
  )

  return {
    plannedLessons,
    completedLessons,
    expectedLessons,
    completionPercentage,
    expectedPercentage,
    paceDeviationPercentagePoints: roundPercentage(
      completionPercentage - expectedPercentage,
    ),
    status: resolveStatus(
      plannedLessons,
      completedLessons,
      expectedLessons,
      currentDate,
      endDate,
    ),
    referenceDate: currentDate.toISOString().slice(0, 10),
  }
}
