export const INSTITUTIONAL_POLICY_CONTRACT_VERSION =
  'institutional-policy-v1' as const

export type InstitutionalPolicyContractVersion =
  typeof INSTITUTIONAL_POLICY_CONTRACT_VERSION

export type FrameworkPillar =
  | 'evidence'
  | 'inclusion'
  | 'intelligence'
  | 'equity'

export type InstitutionalPolicyType =
  | 'pedagogical'
  | 'intelligence'
  | 'score'
  | 'analytics'
  | 'ai'
  | 'data'
  | 'privacy'
  | 'workflow'
  | 'alerts'
  | 'assessment'
  | 'attendance'
  | 'intervention'
  | 'custom'

export type InstitutionalPolicyStatus =
  | 'draft'
  | 'under_review'
  | 'approved'
  | 'active'
  | 'superseded'
  | 'revoked'
  | 'archived'

export type InstitutionalPolicyScopeType =
  | 'organization'
  | 'school'
  | 'campus'
  | 'segment'
  | 'modality'
  | 'course'
  | 'grade'
  | 'class'
  | 'subject'

export type DataUsageMode =
  | 'disabled'
  | 'context_only'
  | 'alerts'
  | 'dashboard'
  | 'score'
  | 'recommendation'
  | 'research'

export type InstitutionalDataSource =
  | 'assessment'
  | 'diagnostic_assessment'
  | 'gradebook'
  | 'attendance'
  | 'evidence'
  | 'longitudinal_evolution'
  | 'participation'
  | 'engagement'
  | 'occurrence'
  | 'pedagogical_case'
  | 'intervention'
  | 'recovery'
  | 'recomposition'
  | 'planning'
  | 'lesson_record'
  | 'class_diary'
  | 'external_assessment'
  | 'external_system'
  | 'custom'

export type ScoreType =
  | 'learning'
  | 'engagement'
  | 'evidence'
  | 'pedagogical_execution'
  | 'risk'
  | 'equity'
  | 'institutional'
  | 'custom'

export type ScoreSourceRule = {
  source: InstitutionalDataSource
  usage: DataUsageMode[]
  weight: number | null
  required: boolean
  enabled: boolean
  explanationRequired: boolean
  humanReviewRequired: boolean
  metadata: Record<string, unknown>
}

export type ScorePolicy = {
  scoreType: ScoreType
  code: string
  name: string
  description: string | null
  enabled: boolean
  sources: ScoreSourceRule[]
  minimumDataQuality: number | null
  minimumSources: number | null
  allowPartialCalculation: boolean
  humanReviewRequired: boolean
  explanationTemplate: string | null
  metadata: Record<string, unknown>
}

export type InstitutionalPolicyScope = {
  scopeType: InstitutionalPolicyScopeType
  scopeId: string | null
  organizationId: string
  schoolId: string | null
  segment: string | null
  modality: string | null
  courseId: string | null
  grade: string | null
  classId: string | null
  subject: string | null
}

export type InstitutionalPolicyGovernance = {
  requiresApproval: boolean
  approvedBy: string | null
  approvedAt: string | null
  publishedBy: string | null
  publishedAt: string | null
  changeReason: string | null
  impactSummary: string | null
  previousPolicyId: string | null
  supersedesPolicyId: string | null
}

export type InstitutionalPolicy = {
  id: string
  contractVersion: InstitutionalPolicyContractVersion
  organizationId: string
  code: string
  name: string
  description: string | null
  policyType: InstitutionalPolicyType
  status: InstitutionalPolicyStatus
  version: number
  validFrom: string
  validUntil: string | null
  pillars: FrameworkPillar[]
  scope: InstitutionalPolicyScope
  dataSources: ScoreSourceRule[]
  scorePolicies: ScorePolicy[]
  settings: Record<string, unknown>
  governance: InstitutionalPolicyGovernance
  createdBy: string
  updatedBy: string
  createdAt: string
  updatedAt: string
  metadata: Record<string, unknown>
}

export type InstitutionalPolicyEvaluationContext = {
  organizationId: string
  schoolId: string | null
  segment: string | null
  modality: string | null
  courseId: string | null
  grade: string | null
  classId: string | null
  subject: string | null
  referenceDate: string
}

export type DataUsageDecision = {
  source: InstitutionalDataSource
  allowed: boolean
  usage: DataUsageMode[]
  scoreWeight: number | null
  policyId: string
  policyVersion: number
  explanation: string
}

export type ScoreGovernanceDecision = {
  scoreType: ScoreType
  allowed: boolean
  sourceRules: ScoreSourceRule[]
  totalWeight: number
  policyId: string
  policyVersion: number
  validFrom: string
  explanationRequired: boolean
  humanReviewRequired: boolean
  warnings: string[]
}
