import {
  accessRepository,
  type AccessEntitlement,
  type AccessFeature,
  type AccessOrganizationMember,
  type AccessOverride,
  type AccessPlan,
  type AccessSubscription,
  type AccessUserProfile,
} from '@/lib/access/repository/access.repository'

export type ResolvedAccessSource =
  | 'super_admin'
  | 'user_override'
  | 'organization_override'
  | 'user_plan'
  | 'organization_plan'
  | 'none'

export type AccessDenialReason =
  | 'profile_missing'
  | 'profile_inactive'
  | 'feature_disabled'
  | 'quota_exceeded'
  | null

export type AccessDecision = {
  userId: string

  role: AccessUserProfile['role'] | null
  profileStatus:
    | AccessUserProfile['status']
    | null

  featureCode: string
  featureName: string
  featureCategory: string
  featureType:
    | 'boolean'
    | 'quota'

  enabled: boolean
  allowed: boolean

  source: ResolvedAccessSource

  planCode: string | null
  planName: string | null

  organizationId: string | null

  isUnlimited: boolean
  limitValue: number | null

  used: number | null
  remaining: number | null

  periodStart: string | null
  periodEnd: string | null

  reason: AccessDenialReason
}

export type ResolveAccessOptions = {
  includeUsage?: boolean
  periodStart?: string
  periodEnd?: string
}

export type CurrentPlanResult = {
  plan: AccessPlan
  subscription: AccessSubscription
  source:
    | 'user_plan'
    | 'organization_plan'
  organizationId: string | null
}

type PlanContext = {
  planId: string

  subscription: AccessSubscription

  source:
    | 'user_plan'
    | 'organization_plan'

  organizationId: string | null
}

type AccessCandidate = {
  source: Exclude<
    ResolvedAccessSource,
    | 'super_admin'
    | 'user_override'
    | 'none'
  >

  plan: AccessPlan | null

  subscription:
    | AccessSubscription
    | null

  organizationId: string | null

  enabled: boolean
  isUnlimited: boolean
  limitValue: number | null

  sortOrder: number
  createdAt: string
}

export class AccessDeniedError extends Error {
  readonly status = 403
  readonly code = 'ACCESS_DENIED'
  readonly decision: AccessDecision

  constructor(
    message: string,
    decision: AccessDecision,
  ) {
    super(message)

    this.name = 'AccessDeniedError'
    this.decision = decision
  }
}

function normalizeRequiredText(
  value: string,
  fieldName: string,
): string {
  const normalizedValue = value?.trim()

  if (!normalizedValue) {
    throw new Error(
      `${fieldName} é obrigatório.`,
    )
  }

  return normalizedValue
}

function uniqueValues(
  values: Array<string | null>,
): string[] {
  return Array.from(
    new Set(
      values.filter(
        (value): value is string =>
          typeof value === 'string' &&
          value.trim().length > 0,
      ),
    ),
  )
}

function createCurrentMonthPeriod(): {
  periodStart: string
  periodEnd: string
} {
  const now = new Date()

  const periodStart = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      1,
      0,
      0,
      0,
      0,
    ),
  )

  const periodEnd = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth() + 1,
      1,
      0,
      0,
      0,
      0,
    ),
  )

  return {
    periodStart:
      periodStart.toISOString(),

    periodEnd:
      periodEnd.toISOString(),
  }
}

function normalizePeriod(
  options?: ResolveAccessOptions,
): {
  periodStart: string
  periodEnd: string
} {
  if (
    !options?.periodStart &&
    !options?.periodEnd
  ) {
    return createCurrentMonthPeriod()
  }

  if (
    !options.periodStart ||
    !options.periodEnd
  ) {
    throw new Error(
      'Informe o início e o fim do período de consumo.',
    )
  }

  const periodStart = new Date(
    options.periodStart,
  )

  const periodEnd = new Date(
    options.periodEnd,
  )

  if (
    Number.isNaN(periodStart.getTime()) ||
    Number.isNaN(periodEnd.getTime())
  ) {
    throw new Error(
      'O período de consumo é inválido.',
    )
  }

  if (
    periodEnd.getTime() <=
    periodStart.getTime()
  ) {
    throw new Error(
      'O fim do período deve ser posterior ao início.',
    )
  }

  return {
    periodStart:
      periodStart.toISOString(),

    periodEnd:
      periodEnd.toISOString(),
  }
}

function createDeniedDecision(
  userId: string,
  feature: AccessFeature,
  profile:
    | AccessUserProfile
    | null,
  reason: Exclude<
    AccessDenialReason,
    null
  >,
): AccessDecision {
  return {
    userId,

    role:
      profile?.role ?? null,

    profileStatus:
      profile?.status ?? null,

    featureCode:
      feature.code,

    featureName:
      feature.name,

    featureCategory:
      feature.category,

    featureType:
      feature.feature_type,

    enabled: false,
    allowed: false,

    source: 'none',

    planCode: null,
    planName: null,

    organizationId: null,

    isUnlimited: false,
    limitValue: null,

    used: null,
    remaining: null,

    periodStart: null,
    periodEnd: null,

    reason,
  }
}

function getLatestOverridesByOrganization(
  overrides: AccessOverride[],
): Map<string, AccessOverride> {
  const result =
    new Map<string, AccessOverride>()

  for (const override of overrides) {
    const organizationId =
      override.organization_id

    if (
      !organizationId ||
      result.has(organizationId)
    ) {
      continue
    }

    result.set(
      organizationId,
      override,
    )
  }

  return result
}

function getPlanContextPriority(
  source: PlanContext['source'],
): number {
  if (source === 'user_plan') {
    return 2
  }

  return 1
}

function selectBestPlanContext(
  contexts: PlanContext[],
  plans: AccessPlan[],
): {
  context: PlanContext
  plan: AccessPlan
} | null {
  const planMap = new Map(
    plans.map((plan) => [
      plan.id,
      plan,
    ]),
  )

  const candidates = contexts
    .map((context) => {
      const plan =
        planMap.get(context.planId)

      if (!plan) {
        return null
      }

      return {
        context,
        plan,
      }
    })
    .filter(
      (
        candidate,
      ): candidate is {
        context: PlanContext
        plan: AccessPlan
      } => candidate !== null,
    )
    .sort((first, second) => {
      const planDifference =
        second.plan.sort_order -
        first.plan.sort_order

      if (planDifference !== 0) {
        return planDifference
      }

      return (
        getPlanContextPriority(
          second.context.source,
        ) -
        getPlanContextPriority(
          first.context.source,
        )
      )
    })

  return candidates[0] ?? null
}

function selectBestAccessCandidate(
  feature: AccessFeature,
  candidates: AccessCandidate[],
): AccessCandidate | null {
  const enabledCandidates =
    candidates.filter(
      (candidate) =>
        candidate.enabled,
    )

  if (
    enabledCandidates.length === 0
  ) {
    return null
  }

  const sourcePriority: Record<
    AccessCandidate['source'],
    number
  > = {
    organization_override: 3,
    user_plan: 2,
    organization_plan: 1,
  }

  return enabledCandidates
    .sort((first, second) => {
      if (
        first.isUnlimited !==
        second.isUnlimited
      ) {
        return first.isUnlimited
          ? -1
          : 1
      }

      if (
        feature.feature_type ===
        'quota'
      ) {
        const firstLimit =
          first.limitValue ?? 0

        const secondLimit =
          second.limitValue ?? 0

        if (
          firstLimit !== secondLimit
        ) {
          return (
            secondLimit - firstLimit
          )
        }
      }

      const sourceDifference =
        sourcePriority[second.source] -
        sourcePriority[first.source]

      if (sourceDifference !== 0) {
        return sourceDifference
      }

      if (
        first.sortOrder !==
        second.sortOrder
      ) {
        return (
          second.sortOrder -
          first.sortOrder
        )
      }

      return second.createdAt.localeCompare(
        first.createdAt,
      )
    })[0] ?? null
}

function createPlanCandidate(
  context: PlanContext,
  plan: AccessPlan,
  entitlement: AccessEntitlement,
): AccessCandidate {
  return {
    source:
      context.source,

    plan,

    subscription:
      context.subscription,

    organizationId:
      context.organizationId,

    enabled:
      entitlement.enabled,

    isUnlimited:
      entitlement.is_unlimited,

    limitValue:
      entitlement.limit_value,

    sortOrder:
      plan.sort_order,

    createdAt:
      entitlement.created_at,
  }
}

function createOrganizationOverrideCandidate(
  override: AccessOverride,
): AccessCandidate {
  return {
    source:
      'organization_override',

    plan: null,
    subscription: null,

    organizationId:
      override.organization_id,

    enabled:
      override.enabled,

    isUnlimited:
      override.is_unlimited,

    limitValue:
      override.limit_value,

    sortOrder: 0,

    createdAt:
      override.created_at,
  }
}

function getOrganizationIds(
  memberships: AccessOrganizationMember[],
): string[] {
  return uniqueValues(
    memberships.map(
      (membership) =>
        membership.organization_id,
    ),
  )
}

async function loadPlanContexts(
  userId: string,
  memberships: AccessOrganizationMember[],
  blockedOrganizationIds:
    Set<string> = new Set(),
): Promise<PlanContext[]> {
  const userSubscriptionsPromise =
    accessRepository
      .findActiveUserSubscriptions(
        userId,
      )

  const organizationIds =
    getOrganizationIds(memberships)
      .filter(
        (organizationId) =>
          !blockedOrganizationIds.has(
            organizationId,
          ),
      )

  const organizationSubscriptionsPromise =
    accessRepository
      .findActiveOrganizationSubscriptions(
        organizationIds,
      )

  const [
    userSubscriptions,
    organizationSubscriptions,
  ] = await Promise.all([
    userSubscriptionsPromise,
    organizationSubscriptionsPromise,
  ])

  const licenses =
    await accessRepository
      .findActiveOrganizationLicenses(
        organizationSubscriptions.map(
          (subscription) =>
            subscription.id,
        ),
      )

  const licensedSubscriptionIds =
    new Set(
      licenses.map(
        (license) =>
          license.subscription_id,
      ),
    )

  const userContexts: PlanContext[] =
    userSubscriptions.map(
      (subscription) => ({
        planId:
          subscription.plan_id,

        subscription,

        source: 'user_plan',

        organizationId: null,
      }),
    )

  const organizationContexts:
    PlanContext[] =
    organizationSubscriptions
      .filter(
        (subscription) =>
          licensedSubscriptionIds.has(
            subscription.id,
          ),
      )
      .map((subscription) => ({
        planId:
          subscription.plan_id,

        subscription,

        source:
          'organization_plan',

        organizationId:
          subscription.organization_id,
      }))

  return [
    ...userContexts,
    ...organizationContexts,
  ]
}

class AccessService {
  async resolveFeatureAccess(
    userId: string,
    featureCode: string,
    options?: ResolveAccessOptions,
  ): Promise<AccessDecision> {
    const normalizedUserId =
      normalizeRequiredText(
        userId,
        'ID do usuário',
      )

    const normalizedFeatureCode =
      normalizeRequiredText(
        featureCode,
        'Código da funcionalidade',
      )

    const [
      profile,
      feature,
    ] = await Promise.all([
      accessRepository.findUserProfile(
        normalizedUserId,
      ),

      accessRepository.findFeatureByCode(
        normalizedFeatureCode,
      ),
    ])

    if (!feature) {
      throw new Error(
        `Funcionalidade não encontrada: ${normalizedFeatureCode}.`,
      )
    }

    if (!profile) {
      return createDeniedDecision(
        normalizedUserId,
        feature,
        null,
        'profile_missing',
      )
    }

    if (profile.status !== 'active') {
      return createDeniedDecision(
        normalizedUserId,
        feature,
        profile,
        'profile_inactive',
      )
    }

    if (
      profile.role === 'super_admin'
    ) {
      return {
        userId: normalizedUserId,

        role: profile.role,
        profileStatus:
          profile.status,

        featureCode:
          feature.code,

        featureName:
          feature.name,

        featureCategory:
          feature.category,

        featureType:
          feature.feature_type,

        enabled: true,
        allowed: true,

        source: 'super_admin',

        planCode: 'internal',
        planName:
          'Acesso administrativo',

        organizationId: null,

        isUnlimited: true,
        limitValue: null,

        used: null,
        remaining: null,

        periodStart: null,
        periodEnd: null,

        reason: null,
      }
    }

    const userOverride =
      await accessRepository
        .findLatestUserOverride(
          normalizedUserId,
          feature.id,
        )

    if (userOverride) {
      return this.resolveCandidateUsage(
        normalizedUserId,
        profile,
        feature,
        {
          source: 'user_plan',

          plan: null,
          subscription: null,

          organizationId: null,

          enabled:
            userOverride.enabled,

          isUnlimited:
            userOverride.is_unlimited,

          limitValue:
            userOverride.limit_value,

          sortOrder: 0,

          createdAt:
            userOverride.created_at,
        },
        options,
        'user_override',
      )
    }

    const memberships =
      await accessRepository
        .findActiveOrganizationMemberships(
          normalizedUserId,
        )

    const organizationIds =
      getOrganizationIds(memberships)

    const organizationOverrides =
      await accessRepository
        .findOrganizationOverrides(
          organizationIds,
          feature.id,
        )

    const latestOrganizationOverrides =
      getLatestOverridesByOrganization(
        organizationOverrides,
      )

    const blockedOrganizationIds =
      new Set<string>()

    const candidates:
      AccessCandidate[] = []

    for (
      const [
        organizationId,
        override,
      ] of latestOrganizationOverrides
    ) {
      if (!override.enabled) {
        blockedOrganizationIds.add(
          organizationId,
        )

        continue
      }

      candidates.push(
        createOrganizationOverrideCandidate(
          override,
        ),
      )
    }

    const planContexts =
      await loadPlanContexts(
        normalizedUserId,
        memberships,
        blockedOrganizationIds,
      )

    const planIds =
      uniqueValues(
        planContexts.map(
          (context) =>
            context.planId,
        ),
      )

    const [
      plans,
      entitlements,
    ] = await Promise.all([
      accessRepository.findPlansByIds(
        planIds,
      ),

      accessRepository.findEntitlements(
        planIds,
        feature.id,
      ),
    ])

    const planMap = new Map(
      plans.map((plan) => [
        plan.id,
        plan,
      ]),
    )

    const entitlementMap = new Map(
      entitlements.map(
        (entitlement) => [
          entitlement.plan_id,
          entitlement,
        ],
      ),
    )

    for (
      const context of planContexts
    ) {
      const plan =
        planMap.get(context.planId)

      const entitlement =
        entitlementMap.get(
          context.planId,
        )

      if (
        !plan ||
        !entitlement
      ) {
        continue
      }

      candidates.push(
        createPlanCandidate(
          context,
          plan,
          entitlement,
        ),
      )
    }

    const bestCandidate =
      selectBestAccessCandidate(
        feature,
        candidates,
      )

    if (!bestCandidate) {
      return createDeniedDecision(
        normalizedUserId,
        feature,
        profile,
        'feature_disabled',
      )
    }

    return this.resolveCandidateUsage(
      normalizedUserId,
      profile,
      feature,
      bestCandidate,
      options,
    )
  }

  async canUse(
    userId: string,
    featureCode: string,
    options?: ResolveAccessOptions,
  ): Promise<boolean> {
    const decision =
      await this.resolveFeatureAccess(
        userId,
        featureCode,
        options,
      )

    return decision.allowed
  }

  async assertCanUse(
    userId: string,
    featureCode: string,
    options?: ResolveAccessOptions,
  ): Promise<AccessDecision> {
    const decision =
      await this.resolveFeatureAccess(
        userId,
        featureCode,
        options,
      )

    if (decision.allowed) {
      return decision
    }

    if (
      decision.reason ===
      'quota_exceeded'
    ) {
      throw new AccessDeniedError(
        `O limite do recurso ${decision.featureName} foi atingido.`,
        decision,
      )
    }

    if (
      decision.reason ===
      'profile_inactive'
    ) {
      throw new AccessDeniedError(
        'O perfil do usuário está inativo ou suspenso.',
        decision,
      )
    }

    throw new AccessDeniedError(
      `O recurso ${decision.featureName} não está disponível no plano atual.`,
      decision,
    )
  }

  async getCurrentPlan(
    userId: string,
  ): Promise<CurrentPlanResult | null> {
    const normalizedUserId =
      normalizeRequiredText(
        userId,
        'ID do usuário',
      )

    const profile =
      await accessRepository
        .findUserProfile(
          normalizedUserId,
        )

    if (
      !profile ||
      profile.status !== 'active'
    ) {
      return null
    }

    const memberships =
      await accessRepository
        .findActiveOrganizationMemberships(
          normalizedUserId,
        )

    const contexts =
      await loadPlanContexts(
        normalizedUserId,
        memberships,
      )

    const plans =
      await accessRepository
        .findPlansByIds(
          contexts.map(
            (context) =>
              context.planId,
          ),
        )

    const selected =
      selectBestPlanContext(
        contexts,
        plans,
      )

    if (!selected) {
      return null
    }

    return {
      plan: selected.plan,

      subscription:
        selected.context.subscription,

      source:
        selected.context.source,

      organizationId:
        selected.context.organizationId,
    }
  }

  private async resolveCandidateUsage(
    userId: string,
    profile: AccessUserProfile,
    feature: AccessFeature,
    candidate: AccessCandidate,
    options?: ResolveAccessOptions,
    forcedSource?: ResolvedAccessSource,
  ): Promise<AccessDecision> {
    const source =
      forcedSource ??
      candidate.source

    const baseDecision: AccessDecision = {
      userId,

      role: profile.role,
      profileStatus:
        profile.status,

      featureCode:
        feature.code,

      featureName:
        feature.name,

      featureCategory:
        feature.category,

      featureType:
        feature.feature_type,

      enabled:
        candidate.enabled,

      allowed:
        candidate.enabled,

      source,

      planCode:
        candidate.plan?.code ?? null,

      planName:
        candidate.plan?.name ?? null,

      organizationId:
        candidate.organizationId,

      isUnlimited:
        candidate.isUnlimited,

      limitValue:
        candidate.limitValue,

      used: null,
      remaining: null,

      periodStart: null,
      periodEnd: null,

      reason:
        candidate.enabled
          ? null
          : 'feature_disabled',
    }

    if (!candidate.enabled) {
      return baseDecision
    }

    if (
      candidate.isUnlimited ||
      candidate.limitValue === null ||
      options?.includeUsage === false
    ) {
      return baseDecision
    }

    const {
      periodStart,
      periodEnd,
    } = normalizePeriod(options)

    const subjectType =
      candidate.organizationId
        ? 'organization'
        : 'user'

    const subjectId =
      candidate.organizationId ??
      userId

    const usageCounter =
      await accessRepository
        .findUsageCounter(
          subjectType,
          subjectId,
          feature.id,
          periodStart,
          periodEnd,
        )

    const used =
      usageCounter?.quantity ?? 0

    const remaining =
      Math.max(
        candidate.limitValue - used,
        0,
      )

    const allowed =
      used < candidate.limitValue

    return {
      ...baseDecision,

      allowed,

      used,
      remaining,

      periodStart,
      periodEnd,

      reason: allowed
        ? null
        : 'quota_exceeded',
    }
  }
}

export const accessService =
  new AccessService()