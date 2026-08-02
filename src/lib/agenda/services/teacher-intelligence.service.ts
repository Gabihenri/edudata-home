export const TEACHER_PERFORMANCE_SNAPSHOT_ENDPOINT =
  '/api/v1/intelligence/teacher/performance-snapshot'

export const TEACHER_INTELLIGENCE_HEALTH_ENDPOINT =
  '/api/v1/intelligence/teacher/health'

export type TeacherOperationalStatus =
  | 'excellent'
  | 'stable'
  | 'attention'
  | 'critical'

export type TeacherSnapshotRiskSeverity =
  | 'critical'
  | 'high'
  | 'medium'
  | 'low'

export type TeacherSnapshotRole =
  | 'professor'
  | 'coordenador'
  | 'diretor'
  | 'gestor'
  | 'super_admin'
  | string

export type CapabilityResultRecord =
  Record<string, unknown>

export type TeacherSnapshotContext = {
  user_id?: string | null
  name?: string | null
  role?: TeacherSnapshotRole
  school_id?: string | null
  organization_id?: string | null
}

export type TeacherPerformanceSnapshotRequest = {
  dashboard_intelligence:
    CapabilityResultRecord

  daily_priorities:
    CapabilityResultRecord

  weekly_analysis:
    CapabilityResultRecord

  evidence_analysis:
    CapabilityResultRecord

  prioritized_tasks:
    CapabilityResultRecord

  workload_balance:
    CapabilityResultRecord

  teacher_context?:
    TeacherSnapshotContext

  history?:
    CapabilityResultRecord[]

  context?: {
    role?:
      TeacherSnapshotRole
  }

  role?:
    TeacherSnapshotRole
}

export type TeacherSnapshotCapabilityMetadata = {
  capability_id:
    string

  identity:
    string

  duration_ms:
    number

  execution_mode:
    string

  risk_level:
    string

  audit_required:
    boolean
}

export type TeacherSnapshotSummary = {
  overall_score:
    number

  operational_status:
    TeacherOperationalStatus

  dashboard_score:
    number

  risk_count:
    number

  strength_count:
    number

  recommendation_count:
    number

  next_action_count:
    number
}

export type TeacherSnapshotScores = {
  overall:
    number

  dashboard:
    number

  planning:
    number

  evidences:
    number

  tasks:
    number

  calendar:
    number
}

export type TeacherSnapshotTeacher = {
  user_id:
    string | null

  name:
    string | null

  role:
    string

  school_id:
    string | null

  organization_id:
    string | null
}

export type TeacherSnapshotRisk = {
  code:
    string

  severity:
    TeacherSnapshotRiskSeverity

  area:
    string

  description:
    string
}

export type TeacherSnapshotStrength = {
  code:
    string

  area:
    string

  score:
    number

  description:
    string
}

export type TeacherSnapshotRecommendation = {
  code:
    string

  priority:
    TeacherSnapshotRiskSeverity

  description:
    string

  area:
    string | null

  automatic_action:
    boolean

  professional_decision_required:
    boolean
}

export type TeacherSnapshotNextAction = {
  type:
    | 'priority'
    | 'task'
    | 'recommendation'
    | string

  reference_id:
    string | null

  title:
    string

  priority:
    TeacherSnapshotRiskSeverity

  automatic_action:
    boolean
}

export type TeacherSnapshotHistory = {
  available:
    boolean

  total_records:
    number

  latest:
    CapabilityResultRecord | null

  trend:
    | 'improving'
    | 'declining'
    | 'stable'
    | 'insufficient_data'

  first_score?:
    number

  latest_score?:
    number

  records:
    CapabilityResultRecord[]
}

export type TeacherSnapshotPlanning = {
  score:
    number

  status:
    string

  attention_points:
    number

  coverage:
    unknown

  coherence:
    unknown

  continuity:
    unknown

  daily_priorities: {
    total:
      number

    high:
      number

    medium:
      number

    low:
      number

    items:
      CapabilityResultRecord[]
  }
}

export type TeacherSnapshotEvidences = {
  score:
    number

  status:
    string

  total_evidences:
    number

  total_completed_lessons:
    number

  total_active_objectives:
    number

  total_pending:
    number

  attention_items:
    CapabilityResultRecord[]

  dimensions:
    CapabilityResultRecord[]

  protection:
    CapabilityResultRecord
}

export type TeacherSnapshotTasks = {
  score:
    number

  status:
    string

  total_received:
    number

  total_active:
    number

  total_prioritized:
    number

  critical:
    number

  high:
    number

  medium:
    number

  low:
    number

  overdue:
    number

  without_deadline:
    number

  top_tasks:
    CapabilityResultRecord[]
}

export type TeacherSnapshotCalendar = {
  score:
    number

  status:
    string

  total_items:
    number

  total_events:
    number

  total_lessons:
    number

  total_tasks:
    number

  total_minutes:
    number

  critical_days:
    number

  high_load_days:
    number

  balanced_days:
    number

  overlaps:
    number

  short_intervals:
    number

  period:
    CapabilityResultRecord
}

export type TeacherPerformanceSnapshot = {
  capability_id:
    string

  contract_version:
    string

  generated_at:
    string

  teacher:
    TeacherSnapshotTeacher

  summary:
    TeacherSnapshotSummary

  scores:
    TeacherSnapshotScores

  planning:
    TeacherSnapshotPlanning

  evidences:
    TeacherSnapshotEvidences

  tasks:
    TeacherSnapshotTasks

  calendar:
    TeacherSnapshotCalendar

  risks:
    TeacherSnapshotRisk[]

  strengths:
    TeacherSnapshotStrength[]

  priorities:
    CapabilityResultRecord[]

  recommendations:
    TeacherSnapshotRecommendation[]

  next_actions:
    TeacherSnapshotNextAction[]

  history:
    TeacherSnapshotHistory

  source_capabilities:
    string[]

  metadata:
    CapabilityResultRecord
}

export type TeacherPerformanceSnapshotApiData = {
  module:
    'teacher'

  contract_version:
    'teacher-performance-snapshot-v1'

  capability:
    TeacherSnapshotCapabilityMetadata

  result:
    TeacherPerformanceSnapshot
}

export type TeacherPerformanceSnapshotApiResponse = {
  success:
    boolean

  data:
    TeacherPerformanceSnapshotApiData

  message?:
    string
}

export type TeacherIntelligenceHealthData = {
  service?:
    string

  module?:
    string

  status?:
    string

  execution_layer?:
    string

  capability?:
    string

  source_capabilities?:
    string[]

  generative_ai_used?:
    boolean
}

export type TeacherIntelligenceHealthResponse = {
  success:
    boolean

  data?:
    TeacherIntelligenceHealthData

  message?:
    string
}

export type TeacherIntelligenceRequestOptions = {
  endpoint?:
    string

  signal?:
    AbortSignal
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === 'object'
    && value !== null
    && !Array.isArray(
      value,
    )
  )
}

function ensureRequiredRecord(
  value: unknown,
  fieldName: string,
): asserts value is Record<string, unknown> {
  if (
    !isRecord(
      value,
    )
  ) {
    throw new Error(
      `O campo '${fieldName}' deve conter um objeto válido.`,
    )
  }

  if (
    Object.keys(
      value,
    ).length === 0
  ) {
    throw new Error(
      `O campo '${fieldName}' não pode estar vazio.`,
    )
  }
}

function validateRequest(
  input:
    TeacherPerformanceSnapshotRequest,
): void {
  ensureRequiredRecord(
    input.dashboard_intelligence,
    'dashboard_intelligence',
  )

  ensureRequiredRecord(
    input.daily_priorities,
    'daily_priorities',
  )

  ensureRequiredRecord(
    input.weekly_analysis,
    'weekly_analysis',
  )

  ensureRequiredRecord(
    input.evidence_analysis,
    'evidence_analysis',
  )

  ensureRequiredRecord(
    input.prioritized_tasks,
    'prioritized_tasks',
  )

  ensureRequiredRecord(
    input.workload_balance,
    'workload_balance',
  )

  if (
    input.history !== undefined
    && !Array.isArray(
      input.history,
    )
  ) {
    throw new Error(
      "O campo 'history' deve ser uma lista.",
    )
  }

  if (
    input.history
    && input.history.length > 20
  ) {
    throw new Error(
      "O campo 'history' aceita no máximo 20 registros.",
    )
  }
}

function extractErrorMessage(
  value: unknown,
): string | null {
  if (
    !isRecord(
      value,
    )
  ) {
    return null
  }

  const detail =
    value.detail

  if (
    typeof detail === 'string'
    && detail.trim()
  ) {
    return detail.trim()
  }

  const error =
    value.error

  if (
    typeof error === 'string'
    && error.trim()
  ) {
    return error.trim()
  }

  const message =
    value.message

  if (
    typeof message === 'string'
    && message.trim()
  ) {
    return message.trim()
  }

  return null
}

function isSnapshotApiResponse(
  value: unknown,
): value is TeacherPerformanceSnapshotApiResponse {
  if (
    !isRecord(
      value,
    )
  ) {
    return false
  }

  if (
    value.success !== true
  ) {
    return false
  }

  if (
    !isRecord(
      value.data,
    )
  ) {
    return false
  }

  if (
    value.data.module !==
      'teacher'
  ) {
    return false
  }

  if (
    !isRecord(
      value.data.result,
    )
  ) {
    return false
  }

  return (
    value.data.result.capability_id ===
      'teacher.performance_snapshot'
  )
}

export async function generateTeacherPerformanceSnapshot(
  input:
    TeacherPerformanceSnapshotRequest,

  options:
    TeacherIntelligenceRequestOptions = {},
): Promise<TeacherPerformanceSnapshotApiData> {
  validateRequest(
    input,
  )

  const endpoint =
    options.endpoint?.trim()
    || TEACHER_PERFORMANCE_SNAPSHOT_ENDPOINT

  const response =
    await fetch(
      endpoint,
      {
        method:
          'POST',

        headers: {
          Accept:
            'application/json',

          'Content-Type':
            'application/json',
        },

        body:
          JSON.stringify(
            input,
          ),

        signal:
          options.signal,

        cache:
          'no-store',
      },
    )

  let responseBody:
    unknown

  try {
    responseBody =
      await response.json()
  } catch {
    throw new Error(
      'A API de inteligência docente retornou uma resposta inválida.',
    )
  }

  if (
    !response.ok
  ) {
    throw new Error(
      extractErrorMessage(
        responseBody,
      )
      ?? 'Não foi possível processar o snapshot docente.',
    )
  }

  if (
    !isSnapshotApiResponse(
      responseBody,
    )
  ) {
    throw new Error(
      'O contrato retornado pela inteligência docente é inválido.',
    )
  }

  return responseBody.data
}

export async function checkTeacherIntelligenceHealth(
  options:
    TeacherIntelligenceRequestOptions = {},
): Promise<boolean> {
  const endpoint =
    options.endpoint?.trim()
    || TEACHER_INTELLIGENCE_HEALTH_ENDPOINT

  try {
    const response =
      await fetch(
        endpoint,
        {
          method:
            'GET',

          headers: {
            Accept:
              'application/json',
          },

          signal:
            options.signal,

          cache:
            'no-store',
        },
      )

    if (
      !response.ok
    ) {
      return false
    }

    const responseBody =
      await response.json() as unknown

    if (
      !isRecord(
        responseBody,
      )
    ) {
      return false
    }

    return (
      responseBody.success ===
      true
    )
  } catch {
    return false
  }
}