import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

import {
  isAccessDeniedError,
  requireFeatureAccess,
  serializeAccessDeniedError,
} from '@/lib/access/guards/require-feature-access'
import { requireSessionUser } from '@/lib/auth/session'
import {
  reviewEducationalAnalyticsRun,
  type EducationalAnalyticsHumanReviewStatus,
  type EducationalAnalyticsJson,
} from '@/lib/agenda/repository/educational-analytics.repository'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const FEATURE_CODE = 'agenda.planning'
const NO_CACHE_HEADERS = { 'Cache-Control': 'no-store, no-cache, must-revalidate' }

const ALLOWED_STATUSES: readonly EducationalAnalyticsHumanReviewStatus[] = [
  'pending', 'in_review', 'approved', 'approved_with_changes', 'rejected',
]

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function errorResponse(error: unknown) {
  if (isAccessDeniedError(error)) return NextResponse.json(serializeAccessDeniedError(error), { status: 403, headers: NO_CACHE_HEADERS })
  const message = error instanceof Error ? error.message : 'Erro desconhecido.'
  const status = message.toLowerCase().includes('não autenticado') ? 401 : 400
  return NextResponse.json({ success: false, error: message, meta: { generatedAt: new Date().toISOString() } }, { status, headers: NO_CACHE_HEADERS })
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireSessionUser()
    await requireFeatureAccess({ userId: user.id, featureCode: FEATURE_CODE, options: { includeUsage: false } })
    const body: unknown = await request.json()
    if (!isRecord(body)) throw new Error('Dados de revisão inválidos.')
    const status = body.status
    if (typeof status !== 'string' || !ALLOWED_STATUSES.includes(status as EducationalAnalyticsHumanReviewStatus)) throw new Error('Status de revisão inválido.')
    const note = typeof body.note === 'string' ? body.note.trim().slice(0, 4000) : ''
    const approved = typeof body.approved === 'boolean' ? body.approved : undefined
    const { id } = await context.params
    const client = createAuthenticatedClient(getAccessToken(request))
    const row = await reviewEducationalAnalyticsRun({
      client,
      id,
      input: {
        status: status as EducationalAnalyticsHumanReviewStatus,
        reviewedBy: user.id,
        approved,
        payload: { note, source: 'EducationalAnalyticsHistoryPanel', reviewedAt: new Date().toISOString() } as EducationalAnalyticsJson,
      },
    })
    return NextResponse.json({
      success: true,
      review: {
        id: row.id,
        status: row.human_review_status,
        approved: row.approved,
        reviewedAt: row.reviewed_at,
        reviewedBy: row.reviewed_by,
        approvedAt: row.approved_at,
        approvedBy: row.approved_by,
      },
      meta: { generatedAt: new Date().toISOString() },
    }, { status: 200, headers: NO_CACHE_HEADERS })
  } catch (error) {
    console.error('[AGENDA_EDUCATIONAL_ANALYTICS_HISTORY_REVIEW_ERROR]', { message: error instanceof Error ? error.message : 'Erro desconhecido.', occurredAt: new Date().toISOString() })
    return errorResponse(error)
  }
}
