import type {
  SupabaseClient,
} from '@supabase/supabase-js'

import type {
  InstitutionalPolicy,
  ScorePolicy,
} from './institutional-policy.contract'

type PolicyRow = {
  id: string
  organization_id: string
  code: string
  name: string
  description: string | null
  policy_type: InstitutionalPolicy['policyType']
  status: InstitutionalPolicy['status']
  version: number
  valid_from: string
  valid_until: string | null
  pillars: InstitutionalPolicy['pillars']
  scope: InstitutionalPolicy['scope']
  data_sources: InstitutionalPolicy['dataSources']
  score_policies: InstitutionalPolicy['scorePolicies']
  settings: Record<string, unknown>
  governance: InstitutionalPolicy['governance']
  created_by: string
  updated_by: string
  created_at: string
  updated_at: string
  metadata: Record<string, unknown>
}

function mapPolicyRow(
  row: PolicyRow,
): InstitutionalPolicy {
  return {
    id: row.id,
    contractVersion: 'institutional-policy-v1',
    organizationId: row.organization_id,
    code: row.code,
    name: row.name,
    description: row.description,
    policyType: row.policy_type,
    status: row.status,
    version: row.version,
    validFrom: row.valid_from,
    validUntil: row.valid_until,
    pillars: row.pillars,
    scope: row.scope,
    dataSources: row.data_sources,
    scorePolicies: row.score_policies,
    settings: row.settings,
    governance: row.governance,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    metadata: row.metadata,
  }
}

export async function listInstitutionalPolicies({
  client,
  organizationId,
}: {
  client: SupabaseClient
  organizationId: string
}): Promise<InstitutionalPolicy[]> {
  const { data, error } = await client
    .from('eios_institutional_policies')
    .select('*')
    .eq('organization_id', organizationId)
    .is('archived_at', null)
    .order('code', { ascending: true })
    .order('version', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return ((data ?? []) as PolicyRow[]).map(mapPolicyRow)
}

export async function getActiveInstitutionalPolicy({
  client,
  organizationId,
  code,
  referenceDate = new Date().toISOString(),
}: {
  client: SupabaseClient
  organizationId: string
  code: string
  referenceDate?: string
}): Promise<InstitutionalPolicy | null> {
  const { data, error } = await client
    .from('eios_institutional_policies')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('code', code)
    .eq('status', 'active')
    .lte('valid_from', referenceDate)
    .is('archived_at', null)
    .order('version', { ascending: false })
    .limit(10)

  if (error) {
    throw new Error(error.message)
  }

  const rows = (data ?? []) as PolicyRow[]
  const row = rows.find(
    item => !item.valid_until || item.valid_until >= referenceDate,
  )

  return row ? mapPolicyRow(row) : null
}

export async function createInstitutionalPolicy({
  client,
  policy,
}: {
  client: SupabaseClient
  policy: Omit<InstitutionalPolicy, 'id' | 'createdAt' | 'updatedAt' | 'contractVersion'>
}): Promise<InstitutionalPolicy> {
  const { data, error } = await client
    .from('eios_institutional_policies')
    .insert({
      organization_id: policy.organizationId,
      code: policy.code,
      name: policy.name,
      description: policy.description,
      policy_type: policy.policyType,
      status: policy.status,
      version: policy.version,
      valid_from: policy.validFrom,
      valid_until: policy.validUntil,
      pillars: policy.pillars,
      scope: policy.scope,
      data_sources: policy.dataSources,
      score_policies: policy.scorePolicies,
      settings: policy.settings,
      governance: policy.governance,
      created_by: policy.createdBy,
      updated_by: policy.updatedBy,
      metadata: policy.metadata,
    })
    .select('*')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return mapPolicyRow(data as PolicyRow)
}

export async function replaceScoreGovernance({
  client,
  organizationId,
  policyId,
  userId,
  scores,
}: {
  client: SupabaseClient
  organizationId: string
  policyId: string
  userId: string
  scores: ScorePolicy[]
}): Promise<void> {
  const { error: archiveError } = await client
    .from('eios_score_governance')
    .update({
      archived_at: new Date().toISOString(),
      updated_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq('organization_id', organizationId)
    .eq('policy_id', policyId)
    .is('archived_at', null)

  if (archiveError) {
    throw new Error(archiveError.message)
  }

  if (scores.length === 0) {
    return
  }

  const { error: insertError } = await client
    .from('eios_score_governance')
    .insert(
      scores.map(score => ({
        organization_id: organizationId,
        policy_id: policyId,
        score_type: score.scoreType,
        score_code: score.code,
        score_name: score.name,
        enabled: score.enabled,
        source_rules: score.sources,
        minimum_data_quality: score.minimumDataQuality,
        minimum_sources: score.minimumSources,
        allow_partial_calculation: score.allowPartialCalculation,
        human_review_required: score.humanReviewRequired,
        explanation_required: true,
        created_by: userId,
        updated_by: userId,
        metadata: score.metadata,
      })),
    )

  if (insertError) {
    throw new Error(insertError.message)
  }
}

export async function appendPolicyAuditEvent({
  client,
  organizationId,
  policyId,
  actorUserId,
  eventType,
  previousVersion,
  newVersion,
  reason,
  impactSummary,
  snapshot,
}: {
  client: SupabaseClient
  organizationId: string
  policyId: string | null
  actorUserId: string
  eventType: string
  previousVersion: number | null
  newVersion: number | null
  reason: string | null
  impactSummary: string | null
  snapshot: Record<string, unknown>
}): Promise<void> {
  const { error } = await client
    .from('eios_policy_audit_events')
    .insert({
      organization_id: organizationId,
      policy_id: policyId,
      event_type: eventType,
      previous_version: previousVersion,
      new_version: newVersion,
      actor_user_id: actorUserId,
      reason,
      impact_summary: impactSummary,
      snapshot,
    })

  if (error) {
    throw new Error(error.message)
  }
}
