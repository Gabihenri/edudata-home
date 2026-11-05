import {
  createClient,
  type SupabaseClient,
} from '@supabase/supabase-js'

import {
  NextRequest,
  NextResponse,
} from 'next/server'

import {
  isAccessDeniedError,
  requireFeatureAccess,
  serializeAccessDeniedError,
} from '@/lib/access/guards/require-feature-access'

import {
  requireSessionUser,
} from '@/lib/auth/session'

import {
  loadAgendaOperationalSnapshot,
  type AgendaOperationalSnapshot,
} from '@/lib/agenda/services/operational-snapshot.service'

import {
  loadAgendaLearningContext,
  type AgendaLearningContext,
} from '@/lib/agenda/services/learning-context.service'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type UnknownRecord = Record<string, unknown>
type IntelligenceRole = 'professor' | 'coordenador' | 'diretor' | 'gestor' | 'super_admin'

type IntelligenceBackendResponse = {
  success?: boolean
  message?: string
  detail?: string
  data?: {
    generated_at?: string
    module?: string
    contract_version?: string
    engine?: UnknownRecord
  }
}

const NO_CACHE_HEADERS = { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
const REQUEST_TIMEOUT_MS = 90_000
const MAX_BACKEND_ATTEMPTS = 2
const RETRY_DELAY_MS = 1_500
const ALLOWED_INTELLIGENCE_ROLES = new Set<IntelligenceRole>(['professor', 'coordenador', 'diretor', 'gestor', 'super_admin'])
const ROLE_ALIASES: Record<string, IntelligenceRole> = {
  professor: 'professor', teacher: 'professor', docente: 'professor',
  coordenador: 'coordenador', coordinator: 'coordenador', coordenador_pedagogico: 'coordenador',
  diretor: 'diretor', director: 'diretor', gestor: 'gestor', manager: 'gestor',
  admin: 'super_admin', administrador: 'super_admin', superadmin: 'super_admin',
  super_administrador: 'super_admin', super_admin: 'super_admin',
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function normalizeOptionalText(value: unknown): string | null {
  if (typeof value !== 'string') return null
  return value.trim() || null
}

function normalizeRoleValue(value: unknown): IntelligenceRole | null {
  const normalized = normalizeOptionalText(value)?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[\s-]+/g, '_')
  if (!normalized) return null
  if (ROLE_ALIASES[normalized]) return ROLE_ALIASES[normalized]
  return ALLOWED_INTELLIGENCE_ROLES.has(normalized as IntelligenceRole) ? normalized as IntelligenceRole : null
}

function resolveUserRole(user: unknown): IntelligenceRole {
  if (!isRecord(user)) return 'professor'
  const appMetadata = isRecord(user.app_metadata) ? user.app_metadata : {}
  const userMetadata = isRecord(user.user_metadata) ? user.user_metadata : {}
  for (const candidate of [appMetadata.role, appMetadata.system_role, appMetadata.user_role, appMetadata.profile, userMetadata.role, userMetadata.system_role, userMetadata.user_role, userMetadata.profile]) {
    const role = normalizeRoleValue(candidate)
    if (role) return role
  }
  return 'professor'
}

function getAccessToken(request: NextRequest): string {
  const accessToken = request.cookies.get('sb-access-token')?.value ?? request.cookies.get('access_token')?.value
  if (!accessToken) throw new Error('Usuário não autenticado.')
  return accessToken
}

function createAuthenticatedClient(accessToken: string): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) throw new Error('Variáveis públicas do Supabase não configuradas.')
  return createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
}

function getIntelligenceBackendUrl(): string {
  const baseUrl = process.env.EDI_BACKEND_URL ?? process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_API_URL
  if (!baseUrl?.trim()) throw new Error('A URL do backend EIOS não está configurada.')
  return `${baseUrl.trim().replace(/\/+$/, '').replace(/\/api\/v1$/, '')}/api/v1/intelligence/agenda`
}

function getErrorMessage(error: unknown): string { return error instanceof Error ? error.message : String(error) }
function getErrorCauseCode(error: unknown): string | null {
  return error instanceof Error && isRecord(error.cause) && typeof error.cause.code === 'string' ? error.cause.code : null
}
function isRetryableNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  if (error.name === 'AbortError') return true
  const message = error.message.trim().toLowerCase()
  if (message === 'fetch failed' || ['network', 'socket', 'connection', 'timeout', 'timed out'].some(value => message.includes(value))) return true
  return new Set(['ECONNRESET', 'ECONNREFUSED', 'EAI_AGAIN', 'ENETUNREACH', 'ETIMEDOUT', 'UND_ERR_CONNECT_TIMEOUT', 'UND_ERR_HEADERS_TIMEOUT', 'UND_ERR_SOCKET']).has(getErrorCauseCode(error) ?? '')
}
function wait(delayMs: number): Promise<void> { return new Promise(resolve => setTimeout(resolve, delayMs)) }

async function requireIntelligenceAccess(userId: string): Promise<void> {
  await requireFeatureAccess({ userId, featureCode: 'agenda.planning', options: { includeUsage: false } })
}

function inferContext(userId: string, role: IntelligenceRole, snapshot: AgendaOperationalSnapshot): UnknownRecord {
  const allRecords = [...snapshot.planning, ...snapshot.objectives, ...snapshot.lessons, ...snapshot.evidences]
  const organizationId = allRecords.map(record => normalizeOptionalText(record.organization_id)).find(Boolean) ?? null
  const schoolId = allRecords.map(record => normalizeOptionalText(record.school_id)).find(Boolean) ?? null
  return {
    user_id: userId, organization_id: organizationId, school_id: schoolId, role,
    metadata: {
      source: 'next-agenda-intelligence-route', scope: 'authenticated-user', rls_applied: true,
      snapshot_source: 'operational-snapshot-service', learning_source: 'agenda-learning-events',
      contract_version: 'agenda-operational-v2', role_source: 'authenticated-user-metadata',
    },
  }
}

function createIntelligencePayload({ userId, role, snapshot, learningContext }: {
  userId: string
  role: IntelligenceRole
  snapshot: AgendaOperationalSnapshot
  learningContext: AgendaLearningContext
}): UnknownRecord {
  return {
    context: inferContext(userId, role, snapshot),
    planning: snapshot.planning,
    objectives: snapshot.objectives,
    lessons: snapshot.lessons,
    evidences: snapshot.evidences,
    interactions: learningContext.interactions,
    accepted_recommendations: learningContext.acceptedRecommendations,
  }
}

async function performBackendRequest({ backendUrl, payload, attempt }: { backendUrl: string; payload: UnknownRecord; attempt: number }): Promise<IntelligenceBackendResponse> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  try {
    const response = await fetch(backendUrl, {
      method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-EDI-Contract-Version': 'agenda-operational-v2', 'X-EDI-Request-Attempt': String(attempt) },
      body: JSON.stringify(payload), cache: 'no-store', signal: controller.signal,
    })
    let responseBody: unknown = null
    try { responseBody = await response.json() } catch { responseBody = null }
    const parsedBody = isRecord(responseBody) ? responseBody as IntelligenceBackendResponse : {}
    if (!response.ok || parsedBody.success === false) {
      throw new Error(normalizeOptionalText(parsedBody.detail) ?? normalizeOptionalText(parsedBody.message) ?? `O EDI Intelligence Engine respondeu com status ${response.status}.`)
    }
    return parsedBody
  } finally { clearTimeout(timeoutId) }
}

async function callIntelligenceBackend(payload: UnknownRecord): Promise<IntelligenceBackendResponse> {
  const backendUrl = getIntelligenceBackendUrl()
  let lastError: unknown = null
  for (let attempt = 1; attempt <= MAX_BACKEND_ATTEMPTS; attempt += 1) {
    try { return await performBackendRequest({ backendUrl, payload, attempt }) }
    catch (error) {
      lastError = error
      const retryable = isRetryableNetworkError(error)
      console.error('[EDI_INTELLIGENCE_BACKEND_ATTEMPT_ERROR]', { attempt, maximumAttempts: MAX_BACKEND_ATTEMPTS, backendUrl, retryable, error: getErrorMessage(error), causeCode: getErrorCauseCode(error) })
      if (!retryable || attempt === MAX_BACKEND_ATTEMPTS) break
      await wait(RETRY_DELAY_MS)
    }
  }
  if (lastError instanceof Error && lastError.name === 'AbortError') throw new Error('O EDI Intelligence Engine excedeu o tempo máximo de resposta.')
  if (isRetryableNetworkError(lastError)) throw new Error('Não foi possível estabelecer comunicação com o backend EIOS após duas tentativas.')
  throw lastError instanceof Error ? lastError : new Error('Não foi possível acessar o backend EIOS.')
}

function buildSuccessResponse(backendResponse: IntelligenceBackendResponse): NextResponse {
  const backendData = isRecord(backendResponse.data) ? backendResponse.data : {}
  const engine = isRecord(backendData.engine) ? backendData.engine : {}
  return NextResponse.json({ success: true, generated_at: normalizeOptionalText(backendData.generated_at), module: normalizeOptionalText(backendData.module) ?? 'agenda', contract_version: normalizeOptionalText(backendData.contract_version) ?? 'agenda-operational-v2', engine }, { status: 200, headers: NO_CACHE_HEADERS })
}

function getErrorStatus(error: unknown): number {
  if (isAccessDeniedError(error)) return 403
  if (!(error instanceof Error)) return 500
  const message = error.message.toLowerCase()
  if (message.includes('não autenticado') || message.includes('unauthorized')) return 401
  if (message.includes('não configurada') || message.includes('excedeu')) return 503
  return 500
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await requireSessionUser()
    await requireIntelligenceAccess(user.id)
    const accessToken = getAccessToken(request)
    const client = createAuthenticatedClient(accessToken)
    const [operationalSnapshotResult, learningContext] = await Promise.all([
      loadAgendaOperationalSnapshot({ client, userId: user.id }),
      loadAgendaLearningContext({ client, userId: user.id }),
    ])
    const payload = createIntelligencePayload({
      userId: user.id,
      role: resolveUserRole(user),
      snapshot: operationalSnapshotResult.snapshot,
      learningContext,
    })
    const backendResponse = await callIntelligenceBackend(payload)
    return buildSuccessResponse(backendResponse)
  } catch (error) {
    const status = getErrorStatus(error)
    if (isAccessDeniedError(error)) {
      return NextResponse.json(
        serializeAccessDeniedError(error),
        { status, headers: NO_CACHE_HEADERS },
      )
    }
    return NextResponse.json({ success: false, error: status >= 500 ? 'Não foi possível gerar as orientações da Agenda neste momento.' : getErrorMessage(error) }, { status, headers: NO_CACHE_HEADERS })
  }
}
