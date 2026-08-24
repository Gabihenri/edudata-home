import {
  type SupabaseClient,
} from '@supabase/supabase-js'

export type AgendaLearningContextEvent = {
  recommendation_id: string | null
  recommendation_type: string | null
  context_type: string | null
  outcome: string
  executed: boolean | null
  result: string | null
  created_at: string
}

export type AgendaLearningContext = {
  interactions: AgendaLearningContextEvent[]
  acceptedRecommendations: number
}

const DEFAULT_LIMIT = 100

export async function loadAgendaLearningContext({
  client,
  userId,
  limit = DEFAULT_LIMIT,
}: {
  client: SupabaseClient
  userId: string
  limit?: number
}): Promise<AgendaLearningContext> {
  const safeLimit = Math.min(
    Math.max(limit, 1),
    DEFAULT_LIMIT,
  )

  const { data, error } = await client
    .from('agenda_learning_events')
    .select(
      'recommendation_id, recommendation_type, context_type, outcome, executed, result, created_at',
    )
    .eq('user_id', userId)
    .eq('module', 'agenda')
    .order('created_at', {
      ascending: false,
    })
    .limit(safeLimit)

  if (error) {
    throw error
  }

  const interactions =
    (data ?? []) as
      AgendaLearningContextEvent[]

  return {
    interactions,
    acceptedRecommendations:
      interactions.filter(
        event =>
          event.outcome ===
          'accepted',
      ).length,
  }
}
