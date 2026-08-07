import type { SupabaseClient } from '@supabase/supabase-js'

import {
  insertActionPlan,
  insertComplianceCheck,
  listComplianceOverview,
} from '@/lib/sgpa/compliance.repository'

export async function getSgpaComplianceOverview({
  client,
  userId,
}: {
  client: SupabaseClient
  userId: string
}) {
  const { checks, plans } = await listComplianceOverview({
    client,
    userId,
  })

  return {
    success: true,
    checks,
    plans,
    summary: {
      checks: checks.length,
      compliant: checks.filter(item => item.status === 'compliant').length,
      attention: checks.filter(item => item.status === 'attention').length,
      nonCompliant: checks.filter(item => item.status === 'non_compliant').length,
      activePlans: plans.filter(item => item.status === 'active').length,
      completedPlans: plans.filter(item => item.status === 'completed').length,
    },
  }
}

export async function createSgpaComplianceCheck({
  client,
  userId,
  input,
}: {
  client: SupabaseClient
  userId: string
  input: Record<string, unknown>
}) {
  const item = await insertComplianceCheck({ client, userId, input })
  return { success: true, item }
}

export async function createSgpaActionPlan({
  client,
  userId,
  input,
}: {
  client: SupabaseClient
  userId: string
  input: Record<string, unknown>
}) {
  const item = await insertActionPlan({ client, userId, input })
  return { success: true, item }
}
