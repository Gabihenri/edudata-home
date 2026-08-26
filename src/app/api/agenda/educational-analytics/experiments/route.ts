import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

import { requireFeatureAccess } from '@/lib/access/guards/require-feature-access'
import { requireSessionUser } from '@/lib/auth/session'
import { createEducationalAnalyticsRun } from '@/lib/agenda/repository/educational-analytics.repository'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const FEATURE_CODE = 'agenda.planning'
const NO_CACHE_HEADERS = { 'Cache-Control': 'no-store, no-cache, must-revalidate' }

type ExperimentPayload = {
  id?: string
  experimentType?: string
  targetVariable?: string
  featureVariable?: string
  observationCount?: number
  trainCount?: number
  testCount?: number
  fingerprint?: string
  equation?: string
  metrics?: { mae?: number; rmse?: number; r2?: number | null }
}

function getAccessToken(request: NextRequest): string {
  const token = request.cookies.get('sb-access-token')?.value ?? request.cookies.get('access_token')?.value
  if (!token) throw new Error('Usuário não autenticado.')
  return token
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

function finite(value: number | undefined | null): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireSessionUser()
    await requireFeatureAccess({ userId: user.id, featureCode: FEATURE_CODE, options: { includeUsage: false } })
    const payload = (await request.json()) as ExperimentPayload

    if (!payload.experimentType?.trim() || !payload.targetVariable?.trim() || !payload.featureVariable?.trim()) {
      throw new Error('O experimento não possui as variáveis mínimas para persistência.')
    }

    const client = createAuthenticatedClient(getAccessToken(request))
    const now = new Date().toISOString()
    const analysisId = payload.id?.trim() || crypto.randomUUID()
    const versionId = crypto.randomUUID()
    const correlationId = crypto.randomUUID()
    const fingerprint = payload.fingerprint?.trim() || crypto.randomUUID()

    const run = await createEducationalAnalyticsRun({
      client,
      input: {
        analysis_id: analysisId,
        analysis_key: `experiment:${payload.experimentType}`,
        version_id: versionId,
        version_number: 1,
        version_label: 'v1.0',
        version_status: 'current',
        previous_version_id: null,
        parent_version_id: null,
        is_current_version: true,
        idempotency_key: `experiment:${analysisId}:${fingerprint}`,
        status: 'completed',
        scope: 'personal',
        title: payload.experimentType,
        description: `${payload.targetVariable} ← ${payload.featureVariable}`,
        capability: 'educational_analytics',
        source_product: 'EduData Analytics',
        context: { targetVariable: payload.targetVariable, featureVariable: payload.featureVariable },
        configuration: { experimentType: payload.experimentType, trainCount: payload.trainCount ?? null, testCount: payload.testCount ?? null },
        data_quality: { observationCount: payload.observationCount ?? 0 },
        privacy: { containsPersonalData: false, anonymized: true },
        ethics: { requiresHumanReview: true, causationWarning: true },
        research_eligibility: { eligible: false, purpose: 'operational_experiment' },
        explainability: { equation: payload.equation ?? null, model: 'linear_regression' },
        traceability: { fingerprint, persistedAt: now },
        analytics_payload: { equation: payload.equation ?? null, metrics: { mae: finite(payload.metrics?.mae), rmse: finite(payload.metrics?.rmse), r2: finite(payload.metrics?.r2) } },
        report_payload: null,
        correlation_count: 0,
        pattern_count: 0,
        anomaly_count: 0,
        influence_count: 0,
        prediction_count: 0,
        recommendation_count: 0,
        research_result_count: 0,
        contains_personal_data: false,
        contains_sensitive_data: false,
        contains_minor_data: false,
        anonymized: true,
        pseudonymized: false,
        requires_human_review: true,
        human_review_status: 'pending',
        human_review_payload: {},
        reviewed_at: null,
        reviewed_by: null,
        approved: false,
        approved_at: null,
        approved_by: null,
        user_id: user.id,
        organization_id: null,
        school_id: null,
        owner_user_id: user.id,
        created_by: user.id,
        updated_by: user.id,
        correlation_id: correlationId,
        causation_id: null,
        request_id: null,
        session_id: null,
        trace_id: null,
        warnings: ['Resultado estatístico não estabelece causalidade e requer revisão humana antes de decisão institucional.'],
        errors: [],
        metadata: { experimentFingerprint: fingerprint, persistence: 'institutional' },
        generated_at: now,
        completed_at: now,
        archived_at: null,
      },
    })

    return NextResponse.json({ success: true, experiment: { id: run.id, generatedAt: run.generated_at, reviewStatus: run.human_review_status } }, { status: 201, headers: NO_CACHE_HEADERS })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido.'
    const status = message.toLowerCase().includes('não autenticado') ? 401 : message.includes('mínimas') ? 400 : 500
    return NextResponse.json({ success: false, error: message }, { status, headers: NO_CACHE_HEADERS })
  }
}
