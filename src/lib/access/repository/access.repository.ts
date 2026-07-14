import {
  createClient,
  type SupabaseClient,
} from '@supabase/supabase-js'

export type AccessPlanCode =
  | 'edi_free'
  | 'edi_professor_pro'
  | 'edi_escola'
  | 'edi_rede'

export type AccessSubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'expired'
  | 'suspended'

export type AccessSource =
  | 'default'
  | 'manual'
  | 'trial'
  | 'billing'
  | 'institutional'

export type AccessSubjectType =
  | 'user'
  | 'organization'

export type AccessUserRole =
  | 'professor'
  | 'coordenador'
  | 'diretor'
  | 'administrador'
  | 'super_admin'

export type AccessUserProfile = {
  user_id: string
  role: AccessUserRole
  status:
    | 'active'
    | 'invited'
    | 'suspended'
    | 'inactive'
  display_name: string | null
  phone: string | null
  onboarding_completed: boolean
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export type AccessPlan = {
  id: string
  code: AccessPlanCode | string
  name: string
  description: string | null

  audience:
    | 'individual'
    | 'organization'
    | 'network'

  billing_mode:
    | 'free'
    | 'recurring'
    | 'quote'

  monthly_price_cents: number | null
  yearly_price_cents: number | null
  currency: string

  is_active: boolean
  is_public: boolean
  sort_order: number

  metadata: Record<string, unknown>

  created_at: string
  updated_at: string
}

export type AccessFeature = {
  id: string
  code: string
  name: string
  description: string | null
  category: string

  feature_type:
    | 'boolean'
    | 'quota'

  unit: string | null
  is_active: boolean

  metadata: Record<string, unknown>

  created_at: string
  updated_at: string
}

export type AccessEntitlement = {
  id: string

  plan_id: string
  feature_id: string

  enabled: boolean
  limit_value: number | null
  is_unlimited: boolean

  config: Record<string, unknown>

  created_at: string
  updated_at: string
}

export type AccessSubscription = {
  id: string

  owner_type: AccessSubjectType

  user_id: string | null
  organization_id: string | null

  plan_id: string

  status: AccessSubscriptionStatus
  source: AccessSource

  starts_at: string
  trial_ends_at: string | null

  current_period_start: string | null
  current_period_end: string | null

  cancel_at_period_end: boolean
  ended_at: string | null

  provider: string | null
  provider_customer_id: string | null
  provider_subscription_id: string | null

  created_by: string | null

  metadata: Record<string, unknown>

  created_at: string
  updated_at: string
}

export type AccessOrganizationMember = {
  id: string
  organization_id: string
  user_id: string

  role:
    | 'professor'
    | 'coordenador'
    | 'diretor'
    | 'administrador'

  status:
    | 'invited'
    | 'active'
    | 'suspended'
    | 'removed'

  invited_by: string | null
  joined_at: string | null

  metadata: Record<string, unknown>

  created_at: string
  updated_at: string
}

export type AccessOrganizationLicense = {
  id: string

  organization_id: string
  subscription_id: string

  seat_limit: number | null
  school_limit: number | null

  valid_from: string
  valid_until: string | null

  active: boolean

  metadata: Record<string, unknown>

  created_at: string
  updated_at: string
}

export type AccessOverride = {
  id: string

  subject_type: AccessSubjectType

  user_id: string | null
  organization_id: string | null

  feature_id: string

  enabled: boolean
  limit_value: number | null
  is_unlimited: boolean

  reason: string | null
  expires_at: string | null

  granted_by: string | null

  metadata: Record<string, unknown>

  created_at: string
  updated_at: string
}

export type AccessUsageCounter = {
  id: string

  subject_type: AccessSubjectType

  user_id: string | null
  organization_id: string | null

  feature_id: string

  period_start: string
  period_end: string

  quantity: number

  metadata: Record<string, unknown>

  created_at: string
  updated_at: string
}

function createAccessClient(): SupabaseClient {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL não configurada.',
    )
  }

  if (!serviceRoleKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY não configurada.',
    )
  }

  return createClient(
    url,
    serviceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  )
}

function uniqueValues(
  values: string[],
): string[] {
  return Array.from(
    new Set(
      values
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  )
}

class AccessRepository {
  private get client(): SupabaseClient {
    return createAccessClient()
  }

  async findUserProfile(
    userId: string,
  ): Promise<AccessUserProfile | null> {
    const { data, error } =
      await this.client
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

    if (error) {
      throw new Error(
        `Erro ao consultar o perfil do usuário: ${error.message}`,
      )
    }

    return data as AccessUserProfile | null
  }

  async findFeatureByCode(
    featureCode: string,
  ): Promise<AccessFeature | null> {
    const { data, error } =
      await this.client
        .from('features')
        .select('*')
        .eq('code', featureCode)
        .eq('is_active', true)
        .maybeSingle()

    if (error) {
      throw new Error(
        `Erro ao consultar a funcionalidade: ${error.message}`,
      )
    }

    return data as AccessFeature | null
  }

  async findPlansByIds(
    planIds: string[],
  ): Promise<AccessPlan[]> {
    const normalizedPlanIds =
      uniqueValues(planIds)

    if (normalizedPlanIds.length === 0) {
      return []
    }

    const { data, error } =
      await this.client
        .from('plans')
        .select('*')
        .in('id', normalizedPlanIds)
        .eq('is_active', true)
        .order('sort_order', {
          ascending: false,
        })

    if (error) {
      throw new Error(
        `Erro ao consultar os planos: ${error.message}`,
      )
    }

    return (data ?? []) as AccessPlan[]
  }

  async findActiveUserSubscriptions(
    userId: string,
  ): Promise<AccessSubscription[]> {
    const now =
      new Date().toISOString()

    const { data, error } =
      await this.client
        .from('subscriptions')
        .select('*')
        .eq('owner_type', 'user')
        .eq('user_id', userId)
        .in('status', [
          'active',
          'trialing',
          'past_due',
        ])
        .lte('starts_at', now)
        .or(
          `ended_at.is.null,ended_at.gt.${now}`,
        )
        .or(
          `current_period_end.is.null,current_period_end.gt.${now}`,
        )
        .order('created_at', {
          ascending: false,
        })

    if (error) {
      throw new Error(
        `Erro ao consultar a assinatura do usuário: ${error.message}`,
      )
    }

    return (
      data ?? []
    ) as AccessSubscription[]
  }

  async findActiveOrganizationMemberships(
    userId: string,
  ): Promise<AccessOrganizationMember[]> {
    const { data, error } =
      await this.client
        .from('organization_members')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', {
          ascending: false,
        })

    if (error) {
      throw new Error(
        `Erro ao consultar os vínculos institucionais: ${error.message}`,
      )
    }

    return (
      data ?? []
    ) as AccessOrganizationMember[]
  }

  async findActiveOrganizationSubscriptions(
    organizationIds: string[],
  ): Promise<AccessSubscription[]> {
    const normalizedOrganizationIds =
      uniqueValues(organizationIds)

    if (
      normalizedOrganizationIds.length === 0
    ) {
      return []
    }

    const now =
      new Date().toISOString()

    const { data, error } =
      await this.client
        .from('subscriptions')
        .select('*')
        .eq(
          'owner_type',
          'organization',
        )
        .in(
          'organization_id',
          normalizedOrganizationIds,
        )
        .in('status', [
          'active',
          'trialing',
          'past_due',
        ])
        .lte('starts_at', now)
        .or(
          `ended_at.is.null,ended_at.gt.${now}`,
        )
        .or(
          `current_period_end.is.null,current_period_end.gt.${now}`,
        )
        .order('created_at', {
          ascending: false,
        })

    if (error) {
      throw new Error(
        `Erro ao consultar as assinaturas institucionais: ${error.message}`,
      )
    }

    return (
      data ?? []
    ) as AccessSubscription[]
  }

  async findActiveOrganizationLicenses(
    subscriptionIds: string[],
  ): Promise<AccessOrganizationLicense[]> {
    const normalizedSubscriptionIds =
      uniqueValues(subscriptionIds)

    if (
      normalizedSubscriptionIds.length === 0
    ) {
      return []
    }

    const today =
      new Date().toISOString().slice(0, 10)

    const { data, error } =
      await this.client
        .from('organization_licenses')
        .select('*')
        .in(
          'subscription_id',
          normalizedSubscriptionIds,
        )
        .eq('active', true)
        .lte('valid_from', today)
        .or(
          `valid_until.is.null,valid_until.gte.${today}`,
        )

    if (error) {
      throw new Error(
        `Erro ao consultar as licenças institucionais: ${error.message}`,
      )
    }

    return (
      data ?? []
    ) as AccessOrganizationLicense[]
  }

  async findEntitlements(
    planIds: string[],
    featureId: string,
  ): Promise<AccessEntitlement[]> {
    const normalizedPlanIds =
      uniqueValues(planIds)

    if (normalizedPlanIds.length === 0) {
      return []
    }

    const { data, error } =
      await this.client
        .from('plan_entitlements')
        .select('*')
        .in('plan_id', normalizedPlanIds)
        .eq('feature_id', featureId)
        .eq('enabled', true)

    if (error) {
      throw new Error(
        `Erro ao consultar os recursos dos planos: ${error.message}`,
      )
    }

    return (
      data ?? []
    ) as AccessEntitlement[]
  }

  async findLatestUserOverride(
    userId: string,
    featureId: string,
  ): Promise<AccessOverride | null> {
    const now =
      new Date().toISOString()

    const { data, error } =
      await this.client
        .from('access_overrides')
        .select('*')
        .eq('subject_type', 'user')
        .eq('user_id', userId)
        .eq('feature_id', featureId)
        .or(
          `expires_at.is.null,expires_at.gt.${now}`,
        )
        .order('created_at', {
          ascending: false,
        })
        .limit(1)
        .maybeSingle()

    if (error) {
      throw new Error(
        `Erro ao consultar a liberação manual: ${error.message}`,
      )
    }

    return data as AccessOverride | null
  }

  async findOrganizationOverrides(
    organizationIds: string[],
    featureId: string,
  ): Promise<AccessOverride[]> {
    const normalizedOrganizationIds =
      uniqueValues(organizationIds)

    if (
      normalizedOrganizationIds.length === 0
    ) {
      return []
    }

    const now =
      new Date().toISOString()

    const { data, error } =
      await this.client
        .from('access_overrides')
        .select('*')
        .eq(
          'subject_type',
          'organization',
        )
        .in(
          'organization_id',
          normalizedOrganizationIds,
        )
        .eq('feature_id', featureId)
        .or(
          `expires_at.is.null,expires_at.gt.${now}`,
        )
        .order('created_at', {
          ascending: false,
        })

    if (error) {
      throw new Error(
        `Erro ao consultar as liberações institucionais: ${error.message}`,
      )
    }

    return (
      data ?? []
    ) as AccessOverride[]
  }

  async findUsageCounter(
    subjectType: AccessSubjectType,
    subjectId: string,
    featureId: string,
    periodStart: string,
    periodEnd: string,
  ): Promise<AccessUsageCounter | null> {
    let query =
      this.client
        .from('usage_counters')
        .select('*')
        .eq(
          'subject_type',
          subjectType,
        )
        .eq('feature_id', featureId)
        .eq(
          'period_start',
          periodStart,
        )
        .eq(
          'period_end',
          periodEnd,
        )

    if (subjectType === 'user') {
      query = query.eq(
        'user_id',
        subjectId,
      )
    } else {
      query = query.eq(
        'organization_id',
        subjectId,
      )
    }

    const { data, error } =
      await query.maybeSingle()

    if (error) {
      throw new Error(
        `Erro ao consultar o consumo do recurso: ${error.message}`,
      )
    }

    return data as AccessUsageCounter | null
  }
}

export const accessRepository =
  new AccessRepository()