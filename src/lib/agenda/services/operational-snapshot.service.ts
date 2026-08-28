import type {
  SupabaseClient,
} from '@supabase/supabase-js'

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

import type {
  AgendaTask,
} from '@/lib/agenda/repository/tasks.repository'

export type AgendaOperationalSnapshot = {
  planning: AgendaPlanning[]
  objectives: AgendaObjective[]
  lessons: AgendaLesson[]
  evidences: AgendaEvidence[]
  tasks: AgendaTask[]
}

export type AgendaOperationalSnapshotSummary = {
  totalPlanning: number
  totalObjectives: number
  totalLessons: number
  totalEvidences: number
  totalTasks: number
  activeTasks: number
  completedTasks: number
  totalRecords: number
}

export type AgendaOperationalSnapshotResult = {
  snapshot: AgendaOperationalSnapshot
  summary: AgendaOperationalSnapshotSummary
  generatedAt: string
}

type OperationalCollectionError = { message: string }
type OperationalCollectionResult<T> = { data: T[] | null; error: OperationalCollectionError | null }

const MAX_RECORDS_PER_COLLECTION = 5000

const PLANNING_SELECT = ['id','title','description','subject','class_name','objective','methodology','resources','evaluation','planned_date','planned_start_time','planned_end_time','duration_minutes','status','class_id','school_year_id','academic_period_id','source_planning_id','is_template','template_name','status_changed_at','status_changed_by','status_change_reason','reviewed_at','reviewed_by','approved_at','approved_by','archived_at','archived_by','archive_reason','school_id','organization_id','user_id','created_by','updated_by','deleted_at','deleted_by','deletion_reason','restored_at','restored_by','restore_reason','metadata','created_at','updated_at'].join(',')
const OBJECTIVES_SELECT = ['id','title','description','category','period','class_id','subject','responsible_user_id','expected_indicator','expected_evidence','start_date','end_date','school_year_id','academic_period_id','status','progress','user_id','organization_id','school_id','created_by','updated_by','deleted_at','deleted_by','deletion_reason','restored_at','restored_by','restore_reason','metadata','created_at','updated_at'].join(',')
const LESSONS_SELECT = ['id','title','class_id','subject','scheduled_date','start_time','end_time','planning_id','academic_period_id','description','skills','resources','methodology','status','observations','next_action','actual_start_at','actual_end_at','completed_at','completed_by','rescheduled_from_date','rescheduled_at','rescheduled_by','rescheduling_reason','cancelled_at','cancelled_by','cancellation_reason','user_id','organization_id','school_id','created_by','updated_by','deleted_at','deleted_by','deletion_reason','restored_at','restored_by','restore_reason','metadata','created_at','updated_at'].join(',')
const EVIDENCES_SELECT = ['id','title','description','evidence_type','file_url','external_url','planning_id','event_id','lesson_id','objective_id','class_id','reflection_id','academic_period_id','organization_id','school_id','user_id','contains_identifiable_minor','guardian_authorization_confirmed','authorization_reference','authorization_confirmed_at','authorization_confirmed_by','privacy_notice_version','storage_bucket','storage_path','original_file_name','file_mime_type','file_size_bytes','metadata','created_by','updated_by','deleted_at','deleted_by','deletion_reason','restored_at','restored_by','restore_reason','created_at','updated_at'].join(',')
const TASKS_SELECT = ['id','title','description','status','priority','due_date','user_id','created_at','updated_at','deleted_at','metadata'].join(',')

function normalizeUserId(userId: string): string {
  const normalizedUserId = userId.trim()
  if (!normalizedUserId) throw new Error('O usuário é obrigatório para carregar o ciclo operacional.')
  return normalizedUserId
}

function unwrapCollection<T>({ result, collectionName }: { result: OperationalCollectionResult<T>; collectionName: string }): T[] {
  if (result.error) throw new Error(`Não foi possível carregar ${collectionName}: ${result.error.message}`)
  const records = result.data ?? []
  if (records.length > MAX_RECORDS_PER_COLLECTION) throw new Error(`A coleção ${collectionName} ultrapassou o limite operacional permitido.`)
  return records
}

async function loadPlanning({ client, userId }: { client: SupabaseClient; userId: string }): Promise<OperationalCollectionResult<AgendaPlanning>> {
  const { data, error } = await client.from('agenda_planning').select(PLANNING_SELECT).eq('user_id', userId).is('deleted_at', null).order('planned_date', { ascending: true, nullsFirst: false }).order('created_at', { ascending: false }).limit(MAX_RECORDS_PER_COLLECTION)
  return { data: data as AgendaPlanning[] | null, error }
}

async function loadObjectives({ client, userId }: { client: SupabaseClient; userId: string }): Promise<OperationalCollectionResult<AgendaObjective>> {
  const { data, error } = await client.from('agenda_objectives').select(OBJECTIVES_SELECT).eq('user_id', userId).is('deleted_at', null).order('end_date', { ascending: true, nullsFirst: false }).order('created_at', { ascending: false }).limit(MAX_RECORDS_PER_COLLECTION)
  return { data: data as AgendaObjective[] | null, error }
}

async function loadLessons({ client, userId }: { client: SupabaseClient; userId: string }): Promise<OperationalCollectionResult<AgendaLesson>> {
  const { data, error } = await client.from('agenda_lessons').select(LESSONS_SELECT).eq('user_id', userId).is('deleted_at', null).order('scheduled_date', { ascending: true, nullsFirst: false }).order('start_time', { ascending: true, nullsFirst: false }).limit(MAX_RECORDS_PER_COLLECTION)
  return { data: data as AgendaLesson[] | null, error }
}

async function loadEvidences({ client, userId }: { client: SupabaseClient; userId: string }): Promise<OperationalCollectionResult<AgendaEvidence>> {
  const { data, error } = await client.from('agenda_evidences').select(EVIDENCES_SELECT).eq('user_id', userId).is('deleted_at', null).order('created_at', { ascending: false }).limit(MAX_RECORDS_PER_COLLECTION)
  return { data: data as AgendaEvidence[] | null, error }
}

async function loadTasks({ client, userId }: { client: SupabaseClient; userId: string }): Promise<OperationalCollectionResult<AgendaTask>> {
  const { data, error } = await client.from('agenda_tasks').select(TASKS_SELECT).eq('user_id', userId).is('deleted_at', null).order('due_date', { ascending: true, nullsFirst: false }).order('created_at', { ascending: false }).limit(MAX_RECORDS_PER_COLLECTION)
  return { data: data as AgendaTask[] | null, error }
}

function createSummary(snapshot: AgendaOperationalSnapshot): AgendaOperationalSnapshotSummary {
  const totalPlanning = snapshot.planning.length
  const totalObjectives = snapshot.objectives.length
  const totalLessons = snapshot.lessons.length
  const totalEvidences = snapshot.evidences.length
  const totalTasks = snapshot.tasks.length
  const completedTasks = snapshot.tasks.filter(task => task.status === 'completed').length
  const activeTasks = snapshot.tasks.filter(task => task.status === 'pending' || task.status === 'in_progress').length

  return {
    totalPlanning,
    totalObjectives,
    totalLessons,
    totalEvidences,
    totalTasks,
    activeTasks,
    completedTasks,
    totalRecords: totalPlanning + totalObjectives + totalLessons + totalEvidences + totalTasks,
  }
}

export async function loadAgendaOperationalSnapshot({ client, userId }: { client: SupabaseClient; userId: string }): Promise<AgendaOperationalSnapshotResult> {
  const normalizedUserId = normalizeUserId(userId)

  const [planningResult, objectivesResult, lessonsResult, evidencesResult, tasksResult] = await Promise.all([
    loadPlanning({ client, userId: normalizedUserId }),
    loadObjectives({ client, userId: normalizedUserId }),
    loadLessons({ client, userId: normalizedUserId }),
    loadEvidences({ client, userId: normalizedUserId }),
    loadTasks({ client, userId: normalizedUserId }),
  ])

  const snapshot: AgendaOperationalSnapshot = {
    planning: unwrapCollection({ result: planningResult, collectionName: 'os planejamentos' }),
    objectives: unwrapCollection({ result: objectivesResult, collectionName: 'os objetivos' }),
    lessons: unwrapCollection({ result: lessonsResult, collectionName: 'as aulas' }),
    evidences: unwrapCollection({ result: evidencesResult, collectionName: 'as evidências' }),
    tasks: unwrapCollection({ result: tasksResult, collectionName: 'as tarefas' }),
  }

  return { snapshot, summary: createSummary(snapshot), generatedAt: new Date().toISOString() }
}
