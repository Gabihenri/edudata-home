import type { SupabaseClient } from '@supabase/supabase-js'

import {
  insertResearchStudy,
  listResearchStudies,
} from '@/lib/observatory/research-study.repository'

export async function getObservatoryStudies({
  client,
  userId,
}: {
  client: SupabaseClient
  userId: string
}) {
  const items = await listResearchStudies({ client, userId })

  return {
    success: true,
    items,
    summary: {
      total: items.length,
      active: items.filter(item => item.status === 'active').length,
      completed: items.filter(item => item.status === 'completed').length,
      published: items.filter(item => item.status === 'published').length,
      underReview: items.filter(item => item.status === 'under_review').length,
    },
  }
}

export async function createObservatoryStudy({
  client,
  userId,
  input,
}: {
  client: SupabaseClient
  userId: string
  input: Record<string, unknown>
}) {
  const item = await insertResearchStudy({ client, userId, input })
  return { success: true, item }
}
