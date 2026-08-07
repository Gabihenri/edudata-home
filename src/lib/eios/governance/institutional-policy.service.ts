import type {
  SupabaseClient,
} from '@supabase/supabase-js'

import type {
  DataUsageDecision,
  InstitutionalDataSource,
  InstitutionalPolicy,
  ScoreGovernanceDecision,
  ScorePolicy,
  ScoreSourceRule,
  ScoreType,
} from './institutional-policy.contract'

import {
  appendPolicyAuditEvent,
  createInstitutionalPolicy,
  getActiveInstitutionalPolicy,
  listInstitutionalPolicies,
  replaceScoreGovernance,
} from './institutional-policy.repository'

function normalizeWeight(
  value: number | null,
): number {
  if (value === null || !Number.isFinite(value)) {
    return 0
  }

  return Math.max(0, value)
}

export function validateScorePolicy(
  score: ScorePolicy,
): string[] {
  const warnings: string[] = []

  if (!score.enabled) {
    return warnings
  }

  const enabledSources = score.sources.filter(
    source => source.enabled,
  )

  if (enabledSources.length === 0) {
    warnings.push(
      `O score ${score.name} está habilitado sem fontes de dados.`,
    )
  }

  const scoreSources = enabledSources.filter(
    source => source.usage.includes('score'),
  )

  const totalWeight = scoreSources.reduce(
    (total, source) => total + normalizeWeight(source.weight),
    0,
  )

  if (scoreSources.length > 0 && Math.abs(totalWeight - 100) > 0.001) {
    warnings.push(
      `Os pesos do score ${score.name} totalizam ${totalWeight}%. O esperado é 100%.`,
    )
  }

  for (const source of enabledSources) {
    if (
      source.usage.includes('score') &&
      (source.weight === null || source.weight < 0)
    ) {
      warnings.push(
        `A fonte ${source.source} participa do score, mas não possui peso válido.`,
      )
    }
  }

  return warnings
}

export function validateInstitutionalPolicy(
  policy: Pick<InstitutionalPolicy, 'name' | 'code' | 'validFrom' | 'validUntil' | 'scorePolicies'>,
): string[] {
  const errors: string[] = []

  if (!policy.name.trim()) {
    errors.push('O nome da política é obrigatório.')
  }

  if (!policy.code.trim()) {
    errors.push('O código da política é obrigatório.')
  }

  if (
    policy.validUntil &&
    new Date(policy.validUntil).getTime() <
      new Date(policy.validFrom).getTime()
  ) {
    errors.push('A vigência final não pode ser anterior à vigência inicial.')
  }

  for (const score of policy.scorePolicies) {
    errors.push(...validateScorePolicy(score))
  }

  return errors
}

export async function getInstitutionalGovernanceOverview({
  client,
  organizationId,
}: {
  client: SupabaseClient
  organizationId: string
}) {
  const policies = await listInstitutionalPolicies({
    client,
    organizationId,
  })

  const active = policies.filter(
    policy => policy.status === 'active',
  )

  return {
    organizationId,
    policies,
    totals: {
      policies: policies.length,
      activePolicies: active.length,
      scorePolicies: active.reduce(
        (total, policy) => total + policy.scorePolicies.length,
        0,
      ),
    },
    pillars: ['evidence', 'inclusion', 'intelligence', 'equity'] as const,
    generatedAt: new Date().toISOString(),
  }
}

export async function createAndPublishInstitutionalPolicy({
  client,
  organizationId,
  userId,
  policy,
}: {
  client: SupabaseClient
  organizationId: string
  userId: string
  policy: Omit<
    InstitutionalPolicy,
    | 'id'
    | 'organizationId'
    | 'createdAt'
    | 'updatedAt'
    | 'createdBy'
    | 'updatedBy'
    | 'contractVersion'
  >
}) {
  const validation = validateInstitutionalPolicy(policy)

  if (validation.length > 0) {
    throw new Error(validation.join(' '))
  }

  const created = await createInstitutionalPolicy({
    client,
    policy: {
      ...policy,
      organizationId,
      createdBy: userId,
      updatedBy: userId,
    },
  })

  await replaceScoreGovernance({
    client,
    organizationId,
    policyId: created.id,
    userId,
    scores: created.scorePolicies,
  })

  await appendPolicyAuditEvent({
    client,
    organizationId,
    policyId: created.id,
    actorUserId: userId,
    eventType: created.status === 'active' ? 'policy_activated' : 'policy_created',
    previousVersion: null,
    newVersion: created.version,
    reason: created.governance.changeReason,
    impactSummary: created.governance.impactSummary,
    snapshot: {
      code: created.code,
      policyType: created.policyType,
      status: created.status,
      scope: created.scope,
      scorePolicies: created.scorePolicies,
    },
  })

  return created
}

export async function resolveDataUsage({
  client,
  organizationId,
  policyCode,
  source,
  referenceDate,
}: {
  client: SupabaseClient
  organizationId: string
  policyCode: string
  source: InstitutionalDataSource
  referenceDate?: string
}): Promise<DataUsageDecision | null> {
  const policy = await getActiveInstitutionalPolicy({
    client,
    organizationId,
    code: policyCode,
    referenceDate,
  })

  if (!policy) {
    return null
  }

  const rule = policy.dataSources.find(
    item => item.source === source,
  )

  if (!rule) {
    return {
      source,
      allowed: false,
      usage: ['disabled'],
      scoreWeight: null,
      policyId: policy.id,
      policyVersion: policy.version,
      explanation:
        'A fonte não foi habilitada pela política institucional vigente.',
    }
  }

  return {
    source,
    allowed: rule.enabled && !rule.usage.includes('disabled'),
    usage: rule.usage,
    scoreWeight: rule.usage.includes('score') ? rule.weight : null,
    policyId: policy.id,
    policyVersion: policy.version,
    explanation: rule.enabled
      ? 'Uso autorizado pela política institucional vigente.'
      : 'Uso desabilitado pela política institucional vigente.',
  }
}

export async function resolveScoreGovernance({
  client,
  organizationId,
  policyCode,
  scoreType,
  referenceDate,
}: {
  client: SupabaseClient
  organizationId: string
  policyCode: string
  scoreType: ScoreType
  referenceDate?: string
}): Promise<ScoreGovernanceDecision | null> {
  const policy = await getActiveInstitutionalPolicy({
    client,
    organizationId,
    code: policyCode,
    referenceDate,
  })

  if (!policy) {
    return null
  }

  const score = policy.scorePolicies.find(
    item => item.scoreType === scoreType && item.enabled,
  )

  if (!score) {
    return {
      scoreType,
      allowed: false,
      sourceRules: [],
      totalWeight: 0,
      policyId: policy.id,
      policyVersion: policy.version,
      validFrom: policy.validFrom,
      explanationRequired: true,
      humanReviewRequired: false,
      warnings: [
        'Este score não está habilitado pela política institucional vigente.',
      ],
    }
  }

  const sourceRules: ScoreSourceRule[] = score.sources.filter(
    item => item.enabled,
  )

  const totalWeight = sourceRules
    .filter(item => item.usage.includes('score'))
    .reduce(
      (total, item) => total + normalizeWeight(item.weight),
      0,
    )

  return {
    scoreType,
    allowed: true,
    sourceRules,
    totalWeight,
    policyId: policy.id,
    policyVersion: policy.version,
    validFrom: policy.validFrom,
    explanationRequired: true,
    humanReviewRequired: score.humanReviewRequired,
    warnings: validateScorePolicy(score),
  }
}
