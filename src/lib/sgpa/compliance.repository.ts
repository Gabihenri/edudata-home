import type { SupabaseClient } from '@supabase/supabase-js'

const CHECKS = 'sgpa_compliance_checks'
const PLANS = 'sgpa_action_plans'

function required(value: string | null | undefined, field: string): string {
  const normalized = value?.trim()
  if (!normalized) throw new Error(`${field} é obrigatório.`)
  return normalized
}

export async function listComplianceOverview({
  client,
  userId,
}: {
  client: SupabaseClient
  userId: string
}) {
  const normalizedUserId = required(userId, 'userId')

  const [checksResult, plansResult] = await Promise.all([
    client
      .from(CHECKS)
      .select('*')
      .eq('user_id', normalizedUserId)
      .is('archived_at', null)
      .order('created_at', { ascending: false })
      .limit(100),
    client
      .from(PLANS)
      .select('*')
      .eq('user_id', normalizedUserId)
      .is('archived_at', null)
      .order('created_at', { ascending: false })
      .limit(100),
  ])

  if (checksResult.error) {
    throw new Error(`Não foi possível carregar compliance: ${checksResult.error.message}`)
  }
  if (plansResult.error) {
    throw new Error(`Não foi possível carregar planos de ação: ${plansResult.error.message}`)
  }

  return {
    checks: checksResult.data ?? [],
    plans: plansResult.data ?? [],
  }
}

export async function insertComplianceCheck({
  client,
  userId,
  input,
}: {
  client: SupabaseClient
  userId: string
  input: Record<string, unknown>
}) {
  const normalizedUserId = required(userId, 'userId')
  const { data, error } = await client
    .from(CHECKS)
    .insert({
      ...input,
      id: `compliance:${crypto.randomUUID()}`,
      contract_version: 'sgpa-compliance-v1',
      user_id: normalizedUserId,
      created_by: normalizedUserId,
    })
    .select('*')
    .single()

  if (error) {
    throw new Error(`Não foi possível registrar o item de compliance: ${error.message}`)
  }

  return data
}

export async function insertActionPlan({
  client,
  userId,
  input,
}: {
  client: SupabaseClient
  userId: string
  input: Record<string, unknown>
}) {
  const normalizedUserId = required(userId, 'userId')
  const { data, error } = await client
    .from(PLANS)
    .insert({
      ...input,
      id: `action-plan:${crypto.randomUUID()}`,
      user_id: normalizedUserId,
      owner_user_id: normalizedUserId,
    })
    .select('*')
    .single()

  if (error) {
    throw new Error(`Não foi possível registrar o plano de ação: ${error.message}`)
  }

  return data
}
