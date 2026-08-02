import {
  generateTeacherPerformanceSnapshot,
  type CapabilityResultRecord,
  type TeacherPerformanceSnapshotApiData,
  type TeacherSnapshotContext,
  type TeacherSnapshotRole,
} from '@/lib/agenda/services/teacher-intelligence.service'

export const PLANNING_DAILY_PRIORITIES_ENDPOINT =
  '/api/v1/intelligence/planning/daily-priorities'

export const PLANNING_WEEKLY_ANALYSIS_ENDPOINT =
  '/api/v1/intelligence/planning/weekly-analysis'

export const EVIDENCE_COMPLETION_ANALYSIS_ENDPOINT =
  '/api/v1/intelligence/evidence/completion-analysis'

export const TASK_SMART_PRIORITIZATION_ENDPOINT =
  '/api/v1/intelligence/tasks/smart-prioritization'

export const CALENDAR_WORKLOAD_BALANCE_ENDPOINT =
  '/api/v1/intelligence/calendar/workload-balance'

export type TeacherIntelligencePeriod = {
  start?: string
  end?: string
  start_date?: string
  end_date?: string
}

export type TeacherIntelligenceOrchestratorInput = {
  dashboard_intelligence:
    CapabilityResultRecord

  events?:
    CapabilityResultRecord[]

  lessons?:
    CapabilityResultRecord[]

  tasks?:
    CapabilityResultRecord[]

  planning_history?:
    CapabilityResultRecord[]

  snapshot_history?:
    CapabilityResultRecord[]

  period?:
    TeacherIntelligencePeriod

  reference_datetime?:
    string

  teacher_context?:
    TeacherSnapshotContext

  role?:
    TeacherSnapshotRole

  maximum_priorities?:
    number
}

export type TeacherIntelligenceOrchestratorEndpoints = {
  dailyPriorities:
    string

  weeklyAnalysis:
    string

  evidenceAnalysis:
    string

  taskPrioritization:
    string

  workloadBalance:
    string

  teacherSnapshot:
    string
}

export type TeacherIntelligenceOrchestratorOptions = {
  signal?:
    AbortSignal

  endpoints?:
    Partial<
      TeacherIntelligenceOrchestratorEndpoints
    >

  onStepChange?: (
    step:
      TeacherIntelligenceOrchestratorStep,
  ) => void
}

export type TeacherIntelligenceOrchestratorStepId =
  | 'validating'
  | 'daily_priorities'
  | 'weekly_analysis'
  | 'evidence_analysis'
  | 'task_prioritization'
  | 'workload_balance'
  | 'teacher_snapshot'
  | 'completed'

export type TeacherIntelligenceOrchestratorStep = {
  id:
    TeacherIntelligenceOrchestratorStepId

  index:
    number

  total:
    number

  label:
    string
}

export type TeacherIntelligenceCapabilityEnvelope = {
  module:
    string

  contract_version:
    string

  capability:
    CapabilityResultRecord

  result:
    CapabilityResultRecord
}

export type TeacherIntelligenceOrchestratorResult = {
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

  snapshot:
    TeacherPerformanceSnapshotApiData
}

const DEFAULT_ENDPOINTS:
  TeacherIntelligenceOrchestratorEndpoints = {
    dailyPriorities:
      PLANNING_DAILY_PRIORITIES_ENDPOINT,

    weeklyAnalysis:
      PLANNING_WEEKLY_ANALYSIS_ENDPOINT,

    evidenceAnalysis:
      EVIDENCE_COMPLETION_ANALYSIS_ENDPOINT,

    taskPrioritization:
      TASK_SMART_PRIORITIZATION_ENDPOINT,

    workloadBalance:
      CALENDAR_WORKLOAD_BALANCE_ENDPOINT,

    teacherSnapshot:
      '/api/v1/intelligence/teacher/performance-snapshot',
  }

const TOTAL_PROCESSING_STEPS =
  6

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === 'object'
    && value !== null
    && !Array.isArray(value)
  )
}

function ensureRecord(
  value: unknown,
  fieldName: string,
): asserts value is CapabilityResultRecord {
  if (
    !isRecord(value)
    || Object.keys(value).length === 0
  ) {
    throw new Error(
      `O campo '${fieldName}' deve conter um objeto válido.`,
    )
  }
}

function normalizeRecordList(
  value: unknown,
): CapabilityResultRecord[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter(
    isRecord,
  )
}

function normalizeMaximumPriorities(
  value: unknown,
): number {
  if (
    typeof value !== 'number'
    || !Number.isFinite(value)
  ) {
    return 5
  }

  return Math.min(
    5,
    Math.max(
      1,
      Math.trunc(value),
    ),
  )
}

function normalizeRole(
  input:
    TeacherIntelligenceOrchestratorInput,
): TeacherSnapshotRole {
  return (
    input.role
    ?? input.teacher_context?.role
    ?? 'professor'
  )
}

function resolveEndpoints(
  options:
    TeacherIntelligenceOrchestratorOptions,
): TeacherIntelligenceOrchestratorEndpoints {
  return {
    ...DEFAULT_ENDPOINTS,
    ...options.endpoints,
  }
}

function extractErrorMessage(
  value: unknown,
): string | null {
  if (!isRecord(value)) {
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

function parseCapabilityEnvelope(
  value: unknown,
  capabilityId: string,
): TeacherIntelligenceCapabilityEnvelope {
  if (!isRecord(value)) {
    throw new Error(
      `A capacidade '${capabilityId}' retornou uma resposta inválida.`,
    )
  }

  if (value.success !== true) {
    throw new Error(
      extractErrorMessage(value)
      ?? `A capacidade '${capabilityId}' não foi processada.`,
    )
  }

  if (!isRecord(value.data)) {
    throw new Error(
      `A capacidade '${capabilityId}' não retornou o campo 'data'.`,
    )
  }

  if (!isRecord(value.data.result)) {
    throw new Error(
      `A capacidade '${capabilityId}' não retornou um resultado válido.`,
    )
  }

  const returnedCapabilityId =
    value.data.result.capability_id

  if (
    typeof returnedCapabilityId === 'string'
    && returnedCapabilityId !== capabilityId
  ) {
    throw new Error(
      `A API retornou '${returnedCapabilityId}' quando era esperado '${capabilityId}'.`,
    )
  }

  return {
    module:
      typeof value.data.module === 'string'
        ? value.data.module
        : 'agenda',

    contract_version:
      typeof value.data.contract_version === 'string'
        ? value.data.contract_version
        : '',

    capability:
      isRecord(value.data.capability)
        ? value.data.capability
        : {},

    result:
      value.data.result,
  }
}

async function postCapability(
  endpoint: string,
  payload: CapabilityResultRecord,
  capabilityId: string,
  signal?: AbortSignal,
): Promise<TeacherIntelligenceCapabilityEnvelope> {
  const response =
    await fetch(
      endpoint,
      {
        method: 'POST',

        headers: {
          Accept:
            'application/json',

          'Content-Type':
            'application/json',
        },

        body:
          JSON.stringify(payload),

        signal,

        cache:
          'no-store',

        credentials:
          'same-origin',
      },
    )

  let responseBody:
    unknown

  try {
    responseBody =
      await response.json()
  } catch {
    throw new Error(
      `A API da capacidade '${capabilityId}' retornou conteúdo inválido.`,
    )
  }

  if (!response.ok) {
    throw new Error(
      extractErrorMessage(
        responseBody,
      )
      ?? `Não foi possível executar '${capabilityId}'.`,
    )
  }

  return parseCapabilityEnvelope(
    responseBody,
    capabilityId,
  )
}

function notifyStep(
  options:
    TeacherIntelligenceOrchestratorOptions,

  id:
    TeacherIntelligenceOrchestratorStepId,

  index:
    number,

  label:
    string,
): void {
  options.onStepChange?.({
    id,
    index,
    total:
      TOTAL_PROCESSING_STEPS,
    label,
  })
}

function validateInput(
  input:
    TeacherIntelligenceOrchestratorInput,
): void {
  ensureRecord(
    input.dashboard_intelligence,
    'dashboard_intelligence',
  )

  if (
    input.planning_history !== undefined
    && !Array.isArray(
      input.planning_history,
    )
  ) {
    throw new Error(
      "O campo 'planning_history' deve ser uma lista.",
    )
  }

  if (
    input.snapshot_history !== undefined
    && !Array.isArray(
      input.snapshot_history,
    )
  ) {
    throw new Error(
      "O campo 'snapshot_history' deve ser uma lista.",
    )
  }

  if (
    input.events !== undefined
    && !Array.isArray(
      input.events,
    )
  ) {
    throw new Error(
      "O campo 'events' deve ser uma lista.",
    )
  }

  if (
    input.lessons !== undefined
    && !Array.isArray(
      input.lessons,
    )
  ) {
    throw new Error(
      "O campo 'lessons' deve ser uma lista.",
    )
  }

  if (
    input.tasks !== undefined
    && !Array.isArray(
      input.tasks,
    )
  ) {
    throw new Error(
      "O campo 'tasks' deve ser uma lista.",
    )
  }
}

export async function orchestrateTeacherIntelligence(
  input:
    TeacherIntelligenceOrchestratorInput,

  options:
    TeacherIntelligenceOrchestratorOptions = {},
): Promise<TeacherIntelligenceOrchestratorResult> {
  notifyStep(
    options,
    'validating',
    0,
    'Validando dados operacionais',
  )

  validateInput(
    input,
  )

  const endpoints =
    resolveEndpoints(
      options,
    )

  const role =
    normalizeRole(
      input,
    )

  const events =
    normalizeRecordList(
      input.events,
    )

  const lessons =
    normalizeRecordList(
      input.lessons,
    )

  const tasks =
    normalizeRecordList(
      input.tasks,
    )

  const planningHistory =
    normalizeRecordList(
      input.planning_history,
    )

  const snapshotHistory =
    normalizeRecordList(
      input.snapshot_history,
    )

  notifyStep(
    options,
    'daily_priorities',
    1,
    'Organizando prioridades diárias',
  )

  const dailyPrioritiesEnvelope =
    await postCapability(
      endpoints.dailyPriorities,
      {
        dashboard_intelligence:
          input.dashboard_intelligence,

        maximum_priorities:
          normalizeMaximumPriorities(
            input.maximum_priorities,
          ),

        role,
      },
      'planning.daily_priorities',
      options.signal,
    )

  const dailyPriorities =
    dailyPrioritiesEnvelope.result

  notifyStep(
    options,
    'weekly_analysis',
    2,
    'Analisando planejamento semanal',
  )

  const weeklyAnalysisEnvelope =
    await postCapability(
      endpoints.weeklyAnalysis,
      {
        dashboard_intelligence:
          input.dashboard_intelligence,

        daily_priorities:
          dailyPriorities,

        history:
          planningHistory,

        period:
          input.period ?? {},

        role,
      },
      'planning.weekly_planning_analysis',
      options.signal,
    )

  const weeklyAnalysis =
    weeklyAnalysisEnvelope.result

  notifyStep(
    options,
    'evidence_analysis',
    3,
    'Analisando conclusão das evidências',
  )

  const evidenceAnalysisEnvelope =
    await postCapability(
      endpoints.evidenceAnalysis,
      {
        dashboard_intelligence:
          input.dashboard_intelligence,

        weekly_analysis:
          weeklyAnalysis,

        role,
      },
      'evidence.completion_analysis',
      options.signal,
    )

  const evidenceAnalysis =
    evidenceAnalysisEnvelope.result

  notifyStep(
    options,
    'task_prioritization',
    4,
    'Priorizando tarefas',
  )

  const taskPrioritizationEnvelope =
    await postCapability(
      endpoints.taskPrioritization,
      {
        tasks,

        daily_priorities:
          dailyPriorities,

        weekly_analysis:
          weeklyAnalysis,

        evidence_analysis:
          evidenceAnalysis,

        reference_datetime:
          input.reference_datetime,

        role,
      },
      'tasks.smart_prioritization',
      options.signal,
    )

  const prioritizedTasks =
    taskPrioritizationEnvelope.result

  notifyStep(
    options,
    'workload_balance',
    5,
    'Analisando equilíbrio da carga semanal',
  )

  const workloadBalanceEnvelope =
    await postCapability(
      endpoints.workloadBalance,
      {
        events,

        lessons,

        tasks,

        weekly_analysis:
          weeklyAnalysis,

        prioritized_tasks:
          prioritizedTasks,

        period:
          input.period ?? {},

        reference_datetime:
          input.reference_datetime,

        role,
      },
      'calendar.workload_balance',
      options.signal,
    )

  const workloadBalance =
    workloadBalanceEnvelope.result

  notifyStep(
    options,
    'teacher_snapshot',
    6,
    'Consolidando snapshot docente',
  )

  const snapshot =
    await generateTeacherPerformanceSnapshot(
      {
        dashboard_intelligence:
          input.dashboard_intelligence,

        daily_priorities:
          dailyPriorities,

        weekly_analysis:
          weeklyAnalysis,

        evidence_analysis:
          evidenceAnalysis,

        prioritized_tasks:
          prioritizedTasks,

        workload_balance:
          workloadBalance,

        teacher_context:
          input.teacher_context,

        history:
          snapshotHistory,

        role,
      },
      {
        endpoint:
          endpoints.teacherSnapshot,

        signal:
          options.signal,
      },
    )

  notifyStep(
    options,
    'completed',
    6,
    'Snapshot docente concluído',
  )

  return {
    dashboard_intelligence:
      input.dashboard_intelligence,

    daily_priorities:
      dailyPriorities,

    weekly_analysis:
      weeklyAnalysis,

    evidence_analysis:
      evidenceAnalysis,

    prioritized_tasks:
      prioritizedTasks,

    workload_balance:
      workloadBalance,

    snapshot,
  }
}