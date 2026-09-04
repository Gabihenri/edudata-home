export type AgendaPlanningPeriodType =
  | 'semanal'
  | 'mensal'
  | 'bimestral'
  | 'trimestral'
  | 'semestral'
  | 'anual'
  | 'personalizado'

export type PlanningExecutionInput = {
  planning_period_type?: AgendaPlanningPeriodType
  planning_start_date?: string | null
  planning_end_date?: string | null
  planned_lessons?: number | null
  completed_lessons?: number
}
