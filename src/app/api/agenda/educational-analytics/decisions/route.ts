import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { requireSessionUser } from '@/lib/auth/session'
import { analyticsHumanDecisionsRepository } from '@/lib/agenda/repository/analytics-human-decisions.repository'
import { mapAnalyticsDecisionToPedagogicalInterventionInput } from '@/lib/agenda/educational-analytics/analytics-intervention-input.mapper'
import { generatePedagogicalInterventionService } from '@/lib/agenda/evidence-intelligence/pedagogical-intervention.service'
import { createPedagogicalInterventionPersistenceService } from '@/lib/agenda/evidence-intelligence/pedagogical-intervention.persistence.service'
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
  return createClient(url, anonKey, { global: { headers: { Authorization: `Bearer ${accessToken}` } }, auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } })
}

function validateInput(body: Partial<AnalyticsHumanDecisionInput>): AnalyticsHumanDecisionInput {
  if (!body.signalId?.trim()) throw new Error('signalId é obrigatório.')
  if (!body.status || !VALID_STATUSES.includes(body.status)) throw new Error('status é inválido.')
  if (!body.evidenceSnapshot || typeof body.evidenceSnapshot !== 'object' || Array.isArray(body.evidenceSnapshot)) throw new Error('evidenceSnapshot é obrigatório.')
  const justification = body.justification?.trim()
  if (body.status !== 'under_review' && (!justification || justification.length < 12)) throw new Error('Uma justificativa com pelo menos 12 caracteres é obrigatória para esta decisão.')
  return { signalId: body.signalId.trim(), status: body.status, justification, sourceAnalysisId: body.sourceAnalysisId ?? null, evidenceSnapshot: body.evidenceSnapshot }
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
    const client = createAuthenticatedClient(getAccessToken(request))
    const { data: sessionData, error: sessionError } = await client.auth.getUser()
    if (sessionError || !sessionData.user || sessionData.user.id !== user.id) throw new Error('Usuário não autenticado.')

    const decision = await analyticsHumanDecisionsRepository.create(input, user.id)

    if (decision.status !== 'forwarded') {
      return NextResponse.json({ success: true, decision, intervention: null }, { status: 201, headers: NO_CACHE_HEADERS })
    }

    const generationInput = mapAnalyticsDecisionToPedagogicalInterventionInput({
      decision,
      requestedByUserId: user.id,
      privacy: {
        classification: 'institutional',
        containsPersonalData: false,
        containsSensitiveData: false,
        anonymizationRequired: true,
        accessRestrictions: ['Uso institucional autorizado e revisão humana obrigatória.'],
        prohibitedUses: ['Decisão automatizada sobre estudantes ou profissionais.'],
        notes: 'Encaminhamento originado por sinal agregado da EduData Analytics.',
      },
    })

    const generationResult = generatePedagogicalInterventionService(generationInput)
    if (!generationResult.success || !generationResult.intervention) throw new Error('Não foi possível gerar a intervenção pedagógica a partir do sinal analítico.')

    const persistenceService = createPedagogicalInterventionPersistenceService(client)
    const persistenceResult = await persistenceService.persist(generationResult.intervention, {
      userId: user.id,
      sourceAnalysisId: decision.sourceAnalysisId,
      sourceEventId: decision.id,
      idempotencyKey: `analytics-decision:${decision.id}`,
      requestId: decision.id,
    })

    const linkedDecision = await analyticsHumanDecisionsRepository.linkIntervention(decision.id, persistenceResult.intervention.id, user.id)
    return NextResponse.json({ success: true, decision: linkedDecision, intervention: { id: persistenceResult.intervention.id, created: persistenceResult.created, idempotent: persistenceResult.idempotent, summary: persistenceResult.summary } }, { status: persistenceResult.created ? 201 : 200, headers: NO_CACHE_HEADERS })
  } catch (error) {
    return errorResponse(error)
  }
}
