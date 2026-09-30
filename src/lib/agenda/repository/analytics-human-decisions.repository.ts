import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type {
  AnalyticsHumanDecisionInput,
  AnalyticsHumanDecisionRecord,
} from '../educational-analytics/analytics-human-decision.types'

function createSupabaseClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error('Variáveis do Supabase não configuradas.')
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
}

type PersistedDecisionRow = {
  id: string
  signal_id: string
  status: AnalyticsHumanDecisionRecord['status']
  justification: string | null
  source_analysis_id: string | null
  evidence_snapshot: Record<string, unknown>
  intervention_id: string | null
  decided_at: string
  decided_by: string
}

class AnalyticsHumanDecisionsRepository {
  private get client(): SupabaseClient {
    return createSupabaseClient()
  }

  async create(input: AnalyticsHumanDecisionInput, decidedBy: string): Promise<AnalyticsHumanDecisionRecord> {
    const { data, error } = await this.client.from('analytics_human_decisions').insert({
      signal_id: input.signalId,
      status: input.status,
      justification: input.justification?.trim() || null,
      source_analysis_id: input.sourceAnalysisId ?? null,
      evidence_snapshot: input.evidenceSnapshot,
      decided_by: decidedBy,
    }).select('*').single()

    if (error) throw new Error(`Erro ao registrar decisão analítica: ${error.message}`)
    return this.map(data as PersistedDecisionRow)
  }

  async linkIntervention(decisionId: string, interventionId: string, decidedBy: string): Promise<AnalyticsHumanDecisionRecord> {
    const { data, error } = await this.client.from('analytics_human_decisions').update({ intervention_id: interventionId }).eq('id', decisionId).eq('decided_by', decidedBy).select('*').single()
    if (error) throw new Error(`Erro ao vincular intervenção à decisão analítica: ${error.message}`)
    return this.map(data as PersistedDecisionRow)
  }

  async findBySignalId(signalId: string): Promise<AnalyticsHumanDecisionRecord[]> {
    const { data, error } = await this.client.from('analytics_human_decisions').select('*').eq('signal_id', signalId).order('decided_at', { ascending: false })
    if (error) throw new Error(`Erro ao consultar histórico analítico: ${error.message}`)
    return (data ?? []).map(row => this.map(row as PersistedDecisionRow))
  }

  private map(row: PersistedDecisionRow): AnalyticsHumanDecisionRecord {
    return { id: row.id, signalId: row.signal_id, status: row.status, justification: row.justification, sourceAnalysisId: row.source_analysis_id, evidenceSnapshot: row.evidence_snapshot ?? {}, interventionId: row.intervention_id, decidedAt: row.decided_at, decidedBy: row.decided_by }
  }
}

export const analyticsHumanDecisionsRepository = new AnalyticsHumanDecisionsRepository()
