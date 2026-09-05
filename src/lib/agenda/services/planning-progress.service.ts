import type { SupabaseClient } from '@supabase/supabase-js'

import {
  InstitutionalAcademicCalendarRepository,
  type AcademicPeriod,
  type InstitutionalCalendarEvent,
  type SchoolCalendarException,
} from '@/lib/agenda/repository/institutional-academic-calendar.repository'
import {
  LessonsRepository,
  type AgendaLesson,
} from '@/lib/agenda/repository/lessons.repository'
import type { AgendaPlanning } from '@/lib/agenda/repository/planning.repository'

export type PlanningProgressStatus =
  | 'sem_execucao'
  | 'atrasado'
  | 'no_ritmo'
  | 'adiantado'
  | 'concluido'

export type PlanningProgress = {
  planningId: string
  plannedLessons: number
  realizedLessons: number
  partiallyRealizedLessons: number
  expectedLessons: number
  executionPercentage: number
  paceDeviation: number
  pacePercentage: number | null
  status: PlanningProgressStatus
  referenceDate: string
}

export type PlanningProgressInput = {
  planning: AgendaPlanning
  userId?: string | null
  referenceDate?: string | Date
}

const REALIZED_STATUS = 'realizada'
const PARTIALLY_REALIZED_STATUS = 'parcialmente_realizada'

function normalizeReferenceDate(value?: string | Date): string {
  if (!value) {
    return new Date().toISOString().slice(0, 10)
  }

  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) {
    throw new Error('Data de referência inválida.')
  }

  return date.toISOString().slice(0, 10)
}

function round(value: number): number {
  return Math.round(value * 100) / 100
}

function parseDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setUTCDate(result.getUTCDate() + days)
  return result
}

function dateRange(start: string, end: string): string[] {
  const first = parseDate(start)
  const last = parseDate(end)
  const dates: string[] = []

  for (let current = first; current <= last; current = addDays(current, 1)) {
    dates.push(formatDate(current))
  }

  return dates
}

function overlaps(date: string, start: string, end: string): boolean {
  return date >= start && date <= end
}

function expandEventDates(event: InstitutionalCalendarEvent): string[] {
  return dateRange(event.start_date, event.end_date)
}

function buildInstructionalDateSet(
  period: AcademicPeriod,
  events: InstitutionalCalendarEvent[],
  exceptions: SchoolCalendarException[],
): Set<string> {
  const instructionalDates = new Set<string>()

  for (const date of dateRange(period.start_date, period.end_date)) {
    const weekday = parseDate(date).getUTCDay()
    if (weekday >= 1 && weekday <= 5) {
      instructionalDates.add(date)
    }
  }

  for (const event of events) {
    for (const date of expandEventDates(event)) {
      if (!overlaps(date, period.start_date, period.end_date)) continue

      if (event.suspends_classes || !event.is_instructional_day) {
        instructionalDates.delete(date)
        continue
      }

      if (event.is_instructional_day && event.counts_as_school_day) {
        instructionalDates.add(date)
      }
    }
  }

  for (const exception of exceptions) {
    if (!overlaps(exception.exception_date, period.start_date, period.end_date)) {
      continue
    }

    if (exception.counts_as_school_day) {
      instructionalDates.add(exception.exception_date)
    } else {
      instructionalDates.delete(exception.exception_date)
    }
  }

  return instructionalDates
}

function countElapsedInstructionalDays(
  instructionalDates: Set<string>,
  referenceDate: string,
): number {
  let count = 0
  for (const date of instructionalDates) {
    if (date <= referenceDate) count += 1
  }
  return count
}

function classify(
  realized: number,
  expected: number,
  planned: number,
  referenceDate: string,
  periodEnd: string,
): PlanningProgressStatus {
  if (planned > 0 && realized >= planned) return 'concluido'
  if (realized === 0) return 'sem_execucao'
  if (expected <= 0) return 'no_ritmo'

  const deviation = realized - expected
  const tolerance = Math.max(1, planned * 0.05)

  if (referenceDate >= periodEnd && realized < planned) return 'atrasado'
  if (deviation < -tolerance) return 'atrasado'
  if (deviation > tolerance) return 'adiantado'
  return 'no_ritmo'
}

export class PlanningProgressService {
  private readonly lessonsRepository: LessonsRepository
  private readonly calendarRepository: InstitutionalAcademicCalendarRepository

  constructor(client: SupabaseClient) {
    this.lessonsRepository = new LessonsRepository(client)
    this.calendarRepository = new InstitutionalAcademicCalendarRepository(client)
  }

  async calculate(input: PlanningProgressInput): Promise<PlanningProgress> {
    const planning = input.planning
    const referenceDate = normalizeReferenceDate(input.referenceDate)

    const lessons: AgendaLesson[] = await this.lessonsRepository.findAll({
      planningId: planning.id,
      userId: input.userId ?? undefined,
      includeDeleted: false,
    })

    const activeLessons = lessons.filter((lesson) => !lesson.deleted_at)
    const plannedLessons = activeLessons.length
    const realizedLessons = activeLessons.filter(
      (lesson) => lesson.status === REALIZED_STATUS,
    ).length
    const partiallyRealizedLessons = activeLessons.filter(
      (lesson) => lesson.status === PARTIALLY_REALIZED_STATUS,
    ).length

    let expectedLessons = 0
    let periodEnd = planning.planned_date ?? referenceDate

    if (planning.academic_period_id) {
      const periods = await this.calendarRepository.findAcademicPeriods({
        schoolYearId: planning.school_year_id ?? undefined,
        schoolId: planning.school_id ?? undefined,
        includeDeleted: false,
      })

      const period = periods.find(
        (candidate) => candidate.id === planning.academic_period_id,
      )

      if (period) {
        periodEnd = period.end_date

        const events = await this.calendarRepository.findInstitutionalEvents({
          schoolId: planning.school_id ?? undefined,
          schoolYearId: planning.school_year_id ?? undefined,
          academicPeriodId: period.id,
          startDate: period.start_date,
          endDate: period.end_date,
          includeDeleted: false,
        })

        const exceptions = await this.calendarRepository.findCalendarExceptions({
          schoolId: planning.school_id ?? undefined,
          schoolYearId: planning.school_year_id ?? undefined,
          startDate: period.start_date,
          endDate: period.end_date,
          includeDeleted: false,
        })

        const instructionalDates = buildInstructionalDateSet(
          period,
          events,
          exceptions,
        )
        const totalInstructionalDays = period.instructional_days_target ?? instructionalDates.size
        const elapsedInstructionalDays = countElapsedInstructionalDays(
          instructionalDates,
          referenceDate,
        )
        const temporalProgress = totalInstructionalDays > 0
          ? Math.min(1, Math.max(0, elapsedInstructionalDays / totalInstructionalDays))
          : 0

        expectedLessons = round(plannedLessons * temporalProgress)
      }
    } else if (planning.planned_date) {
      expectedLessons = referenceDate >= planning.planned_date ? plannedLessons : 0
    }

    const executionPercentage = plannedLessons > 0
      ? round((realizedLessons / plannedLessons) * 100)
      : 0
    const paceDeviation = round(realizedLessons - expectedLessons)
    const pacePercentage = expectedLessons > 0
      ? round((realizedLessons / expectedLessons) * 100)
      : null

    return {
      planningId: planning.id,
      plannedLessons,
      realizedLessons,
      partiallyRealizedLessons,
      expectedLessons,
      executionPercentage,
      paceDeviation,
      pacePercentage,
      status: classify(
        realizedLessons,
        expectedLessons,
        plannedLessons,
        referenceDate,
        periodEnd,
      ),
      referenceDate,
    }
  }
}
