import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { requireSessionUser } from '@/lib/auth/session'
import { analyticsHumanDecisionsRepository } from '@/lib/agenda/repository/analytics-human-decisions.repository'
import type {
  AnalyticsHumanDecisionInput,
  AnalyticsHumanDecisionStatus,
} from '@/lib/agenda/educational-analytics/analytics-human-decision.types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const NO_CACHE_HEADERS = { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
const VALID_STATUSES: AnalyticsHumanDecisionStatus[] = ['under_review', 'needs_evidence', 'forwarded', 'archived']

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

function validateInput(body: Partial<AnalyticsHumanDecisionInput>): AnalyticsHumanDecisionInput {
  if (!body.signalId?.trim()) throw new Error('signalId é obrigatório.')
  if (!body.status || !VALID_STATUSES.includes(body.status)) throw new Error('status é inválido.')
  if (!body.evidenceSnapshot || typeof body.evidenceSnapshot !== 'object' || Array.isArray(body.evidenceSnapshot)) {
    throw new Error('evidenceSnapshot é obrigatório.')
  }

  const justification = body.justification?.trim()
  if (body.status !== 'under_review' && (!justification || justification.length < 12)) {
    throw new Error('Uma justificativa com pelo menos 12 caracteres é obrigatória para esta decisão.')
  }

  return {
    signalId: body.signalId.trim(),
    status: body.status,
    justification,
    sourceAnalysisId: body.sourceAnalysisId ?? null,
    evidenceSnapshot: body.evidenceSnapshot,
  }
}

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : 'Erro desconhecido.'
  const normalized = message.toLowerCase()
  const status = normalized.includes('não autenticado') ? 401 : normalized.includes('obrigatório') || normalized.includes('inválido') ? 400 : 500
  return NextResponse.json({ success: false, error: status >= 500 ? 'Não foi possível registrar a decisão analítica.' : message }, { status, headers: NO_CACHE_HEADERS })
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireSessionUser()
    const input = validateInput(await request.json())

    // Confirma que a sessão recebida pela rota é válida antes de persistir.
    await createAuthenticatedClient(getAccessToken(request)).auth.getUser()

    const decision = await analyticsHumanDecisionsRepository.create(input, user.id)
    return NextResponse.json({ success: true, decision }, { status: 201, headers: NO_CACHE_HEADERS })
  } catch (error) {
    return errorResponse(error)
  }
}
