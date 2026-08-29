'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAgendaIntelligence, type AgendaIntelligenceData } from '@/lib/agenda/hooks/useAgendaIntelligence'
import { orchestrateTeacherIntelligence, type TeacherIntelligenceOrchestratorResult, type TeacherIntelligenceOrchestratorStep } from '@/lib/agenda/services/teacher-intelligence-orchestrator.service'
import type { CapabilityResultRecord, TeacherPerformanceSnapshot, TeacherSnapshotContext, TeacherSnapshotRole } from '@/lib/agenda/services/teacher-intelligence.service'

const AGENDA_INTELLIGENCE_TIMEOUT_MS = 12_000
const OPERATIONAL_SNAPSHOT_MAX_ATTEMPTS = 3
const OPERATIONAL_SNAPSHOT_RETRY_DELAY_MS = 700

export type TeacherCommandCenterStatus = 'idle' | 'loading_agenda' | 'loading_snapshot' | 'processing' | 'success' | 'error' | 'cancelled'
export type TeacherCommandCenterOperationalData = { planning: CapabilityResultRecord[]; objectives: CapabilityResultRecord[]; lessons: CapabilityResultRecord[]; evidences: CapabilityResultRecord[]; tasks: CapabilityResultRecord[] }
export type TeacherCommandCenterOperationalSummary = { totalPlanning: number; totalObjectives: number; totalLessons: number; totalEvidences: number; totalTasks: number; activeTasks: number; completedTasks: number; totalRecords: number }
export type TeacherCommandCenterOperationalResponse = { success: true; generatedAt: string; summary: TeacherCommandCenterOperationalSummary; data: TeacherCommandCenterOperationalData }
export type UseTeacherCommandCenterOptions = { autoLoad?: boolean; role?: TeacherSnapshotRole; teacherContext?: TeacherSnapshotContext; maximumPriorities?: number }
export type UseTeacherCommandCenterResult = { agendaIntelligence: AgendaIntelligenceData | null; operationalData: TeacherCommandCenterOperationalData | null; operationalSummary: TeacherCommandCenterOperationalSummary | null; orchestration: TeacherIntelligenceOrchestratorResult | null; snapshot: TeacherPerformanceSnapshot | null; status: TeacherCommandCenterStatus; currentStep: TeacherIntelligenceOrchestratorStep | null; loading: boolean; refreshing: boolean; error: string | null; generatedAt: string | null; progress: number; load: () => Promise<TeacherPerformanceSnapshot | null>; reload: () => Promise<TeacherPerformanceSnapshot | null>; cancel: () => void; clearError: () => void }
type OperationalSnapshotErrorResponse = { success?: false; error?: string; message?: string }
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null && !Array.isArray(value) }
function normalizeText(value: unknown): string | null { if (typeof value !== 'string') return null; const normalizedValue = value.trim(); return normalizedValue || null }
function normalizeNumber(value: unknown): number { if (typeof value !== 'number' || !Number.isFinite(value)) return 0; return Math.max(Math.trunc(value), 0) }
function normalizeRecordList(value: unknown): CapabilityResultRecord[] { return Array.isArray(value) ? value.filter(isRecord) : [] }
function parseOperationalSnapshot(value: unknown): TeacherCommandCenterOperationalResponse {
  if (!isRecord(value)) throw new Error('O ciclo operacional da Agenda retornou um formato inválido.')
  if (value.success !== true) { const errorResponse = value as OperationalSnapshotErrorResponse; throw new Error(normalizeText(errorResponse.error) ?? normalizeText(errorResponse.message) ?? 'Não foi possível carregar o ciclo operacional da Agenda.') }
  if (!isRecord(value.data)) throw new Error('O ciclo operacional não retornou o campo de dados.')
  const summary = isRecord(value.summary) ? value.summary : {}
  return { success: true, generatedAt: normalizeText(value.generatedAt) ?? new Date().toISOString(), summary: { totalPlanning: normalizeNumber(summary.totalPlanning), totalObjectives: normalizeNumber(summary.totalObjectives), totalLessons: normalizeNumber(summary.totalLessons), totalEvidences: normalizeNumber(summary.totalEvidences), totalTasks: normalizeNumber(summary.totalTasks), activeTasks: normalizeNumber(summary.activeTasks), completedTasks: normalizeNumber(summary.completedTasks), totalRecords: normalizeNumber(summary.totalRecords) }, data: { planning: normalizeRecordList(value.data.planning), objectives: normalizeRecordList(value.data.objectives), lessons: normalizeRecordList(value.data.lessons), evidences: normalizeRecordList(value.data.evidences), tasks: normalizeRecordList(value.data.tasks) } }
}
function normalizeErrorMessage(error: unknown): string { const message = error instanceof Error ? error.message.trim() : ''; if (/^(load failed|failed to fetch|networkerror)$/i.test(message)) return 'Não foi possível concluir a conexão com o ciclo operacional da Agenda. Tente atualizar os dados novamente.'; return message || 'Não foi possível gerar o Centro de Comando Docente.' }
function isAbortError(error: unknown): boolean { return error instanceof DOMException && error.name === 'AbortError' }
function isTransientFetchError(error: unknown): boolean { if (!(error instanceof TypeError)) return false; return /load failed|failed to fetch|networkerror/i.test(error.message) }
function waitForRetry(delayMs: number, signal: AbortSignal): Promise<void> { return new Promise((resolve, reject) => { const timeout = window.setTimeout(resolve, delayMs); signal.addEventListener('abort', () => { window.clearTimeout(timeout); reject(new DOMException('The operation was aborted.', 'AbortError')) }, { once: true }) }) }
function buildFallbackAgendaIntelligence(): AgendaIntelligenceData {
  const generatedAt = new Date().toISOString()
  return { success: true, generated_at: generatedAt, module: 'agenda', contract_version: 'agenda-operational-v1', context: { metadata: { source: 'command-center-fallback', intelligence_mode: 'degraded' } }, contract: { version: 'agenda-operational-v1', mode: 'degraded' }, profile: {}, analytics: { summary: {}, edi_indicators: {}, operational_findings: {}, references: {}, mode: 'degraded' }, insights: { total: 0, summary: {}, insights: [] }, recommendations: { total: 0, summary: {}, recommendations: [] }, learning: { mode: 'degraded', reason: 'intelligence_backend_unavailable' } }
}
function buildTeacherContext({ intelligence, suppliedContext, role }: { intelligence: AgendaIntelligenceData; suppliedContext?: TeacherSnapshotContext; role: TeacherSnapshotRole }): TeacherSnapshotContext {
  const profile = isRecord(intelligence.profile) ? intelligence.profile : {}; const context = isRecord(intelligence.context) ? intelligence.context : {}
  return { user_id: suppliedContext?.user_id ?? normalizeText(profile.user_id) ?? normalizeText(context.user_id), name: suppliedContext?.name ?? normalizeText(profile.name) ?? normalizeText(profile.full_name) ?? normalizeText(context.user_name), role: suppliedContext?.role ?? role, school_id: suppliedContext?.school_id ?? normalizeText(profile.school_id) ?? normalizeText(context.school_id), organization_id: suppliedContext?.organization_id ?? normalizeText(profile.organization_id) ?? normalizeText(context.organization_id) }
}
function buildReferenceDateTime(): string { return new Date().toISOString() }
function buildCurrentWeekPeriod(): { start: string; end: string } { const currentDate = new Date(); const day = currentDate.getDay(); const mondayDifference = day === 0 ? -6 : 1 - day; const startDate = new Date(currentDate); startDate.setDate(currentDate.getDate() + mondayDifference); startDate.setHours(0,0,0,0); const endDate = new Date(startDate); endDate.setDate(startDate.getDate()+6); endDate.setHours(23,59,59,999); return { start: startDate.toISOString(), end: endDate.toISOString() } }
function mapLessonsToCalendarActivities(lessons: CapabilityResultRecord[]): CapabilityResultRecord[] { return lessons.map(lesson => { const scheduledDate = normalizeText(lesson.scheduled_date); const startTime = normalizeText(lesson.start_time); const endTime = normalizeText(lesson.end_time); return { ...lesson, start_at: scheduledDate && startTime ? `${scheduledDate}T${startTime}` : scheduledDate, end_at: scheduledDate && endTime ? `${scheduledDate}T${endTime}` : null, date: scheduledDate, duration_minutes: normalizeNumber(lesson.duration_minutes) || undefined } }) }
function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T | null> { return Promise.race([promise, new Promise<null>(resolve => setTimeout(() => resolve(null), timeoutMs))]) }

export function useTeacherCommandCenter(options: UseTeacherCommandCenterOptions = {}): UseTeacherCommandCenterResult {
  const { autoLoad = true, role = 'professor', teacherContext, maximumPriorities = 5 } = options
  const agendaState = useAgendaIntelligence({ autoLoad: false })
  const [agendaIntelligence, setAgendaIntelligence] = useState<AgendaIntelligenceData | null>(null)
  const [operationalData, setOperationalData] = useState<TeacherCommandCenterOperationalData | null>(null)
  const [operationalSummary, setOperationalSummary] = useState<TeacherCommandCenterOperationalSummary | null>(null)
  const [orchestration, setOrchestration] = useState<TeacherIntelligenceOrchestratorResult | null>(null)
  const [status, setStatus] = useState<TeacherCommandCenterStatus>(autoLoad ? 'loading_agenda' : 'idle')
  const [currentStep, setCurrentStep] = useState<TeacherIntelligenceOrchestratorStep | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const mountedRef = useRef(true); const abortControllerRef = useRef<AbortController | null>(null); const requestSequenceRef = useRef(0); const autoLoadStartedRef = useRef(false)
  const stableTeacherContext = useMemo(() => ({ user_id: teacherContext?.user_id, name: teacherContext?.name, role: teacherContext?.role, school_id: teacherContext?.school_id, organization_id: teacherContext?.organization_id }), [teacherContext?.user_id, teacherContext?.name, teacherContext?.role, teacherContext?.school_id, teacherContext?.organization_id])
  const cancel = useCallback(() => { abortControllerRef.current?.abort(); abortControllerRef.current = null; requestSequenceRef.current += 1; if (mountedRef.current) { setRefreshing(false); setStatus('cancelled') } }, [])
  const loadOperationalSnapshot = useCallback(async (signal: AbortSignal): Promise<TeacherCommandCenterOperationalResponse> => { let lastError: unknown = null; for (let attempt = 1; attempt <= OPERATIONAL_SNAPSHOT_MAX_ATTEMPTS; attempt += 1) { try { const response = await fetch('/api/agenda/operational-snapshot', { method: 'GET', headers: { Accept: 'application/json' }, cache: 'no-store', credentials: 'same-origin', signal }); let responseBody: unknown; try { responseBody = await response.json() } catch { throw new Error('A API do ciclo operacional retornou uma resposta inválida.') }; if (!response.ok) { const errorRecord = isRecord(responseBody) ? responseBody : {}; throw new Error(normalizeText(errorRecord.error) ?? normalizeText(errorRecord.message) ?? 'Não foi possível carregar o ciclo operacional da Agenda.') }; return parseOperationalSnapshot(responseBody) } catch (caughtError) { if (isAbortError(caughtError) || signal.aborted) throw caughtError; lastError = caughtError; if (!isTransientFetchError(caughtError) || attempt === OPERATIONAL_SNAPSHOT_MAX_ATTEMPTS) break; await waitForRetry(OPERATIONAL_SNAPSHOT_RETRY_DELAY_MS * attempt, signal) } } throw lastError ?? new Error('Não foi possível carregar o ciclo operacional da Agenda.') }, [])
  const resolveAgendaIntelligence = useCallback(async (reload: boolean): Promise<AgendaIntelligenceData> => {
    const request = reload ? agendaState.reload() : agendaState.loadIntelligence()
    try {
      const intelligence = await withTimeout(request, AGENDA_INTELLIGENCE_TIMEOUT_MS)
      return intelligence ?? buildFallbackAgendaIntelligence()
    } catch {
      return buildFallbackAgendaIntelligence()
    }
  }, [agendaState.loadIntelligence, agendaState.reload])
  const executeOrchestration = useCallback(async (intelligence: AgendaIntelligenceData): Promise<TeacherPerformanceSnapshot | null> => {
    abortControllerRef.current?.abort(); const controller = new AbortController(); abortControllerRef.current = controller; requestSequenceRef.current += 1; const requestSequence = requestSequenceRef.current; const hasExistingSnapshot = orchestration !== null
    if (mountedRef.current) { setError(null); setCurrentStep(null); setStatus('loading_snapshot'); setRefreshing(hasExistingSnapshot); setAgendaIntelligence(intelligence) }
    try {
      const operationalResponse = await loadOperationalSnapshot(controller.signal)
      if (!mountedRef.current || controller.signal.aborted || requestSequence !== requestSequenceRef.current) return null
      setOperationalData(operationalResponse.data); setOperationalSummary(operationalResponse.summary); setStatus('processing')
      const teacher = buildTeacherContext({ intelligence, suppliedContext: stableTeacherContext, role })
      const result = await orchestrateTeacherIntelligence({ dashboard_intelligence: intelligence, lessons: mapLessonsToCalendarActivities(operationalResponse.data.lessons), events: [], tasks: operationalResponse.data.tasks, planning_history: operationalResponse.data.planning, snapshot_history: [], period: buildCurrentWeekPeriod(), reference_datetime: buildReferenceDateTime(), teacher_context: teacher, role, maximum_priorities: maximumPriorities }, { signal: controller.signal, onStepChange: step => { if (mountedRef.current && !controller.signal.aborted && requestSequence === requestSequenceRef.current) setCurrentStep(step) } })
      if (!mountedRef.current || controller.signal.aborted || requestSequence !== requestSequenceRef.current) return null
      setOrchestration(result); setStatus('success'); return result.snapshot.result
    } catch (caughtError) {
      if (isAbortError(caughtError) || controller.signal.aborted) { if (mountedRef.current && requestSequence === requestSequenceRef.current) setStatus('cancelled'); return null }
      if (mountedRef.current && requestSequence === requestSequenceRef.current) { setError(normalizeErrorMessage(caughtError)); setStatus('error') }; return null
    } finally { if (mountedRef.current && requestSequence === requestSequenceRef.current) setRefreshing(false) }
  }, [loadOperationalSnapshot, maximumPriorities, orchestration, role, stableTeacherContext])
  const load = useCallback(async () => { if (mountedRef.current) setStatus('loading_agenda'); const intelligence = await resolveAgendaIntelligence(false); return executeOrchestration(intelligence) }, [executeOrchestration, resolveAgendaIntelligence])
  const reload = useCallback(async () => { if (mountedRef.current) setStatus('loading_agenda'); const intelligence = await resolveAgendaIntelligence(true); return executeOrchestration(intelligence) }, [executeOrchestration, resolveAgendaIntelligence])
  const clearError = useCallback(() => { if (mountedRef.current) setError(null) }, [])
  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; abortControllerRef.current?.abort() } }, [])
  useEffect(() => { if (!autoLoad || autoLoadStartedRef.current) return; autoLoadStartedRef.current = true; void load() }, [autoLoad, load])
  const snapshot = orchestration?.snapshot.result ?? null
  const generatedAt = snapshot?.generated_at ?? null
  const loading = status === 'loading_agenda' || status === 'loading_snapshot' || status === 'processing'
  const progress = status === 'loading_agenda' ? 15 : status === 'loading_snapshot' ? 40 : status === 'processing' ? 75 : status === 'success' ? 100 : 0
  return { agendaIntelligence, operationalData, operationalSummary, orchestration, snapshot, status, currentStep, loading, refreshing, error, generatedAt, progress, load, reload, cancel, clearError }
}
