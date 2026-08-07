/** EduData IA — SGPA Compliance Contract 1.0 */

export const SGPA_COMPLIANCE_CONTRACT_VERSION = 'sgpa-compliance-v1' as const

export type ComplianceStatus =
  | 'compliant'
  | 'attention'
  | 'non_compliant'
  | 'not_evaluated'

export type ComplianceSeverity =
  | 'informational'
  | 'low'
  | 'moderate'
  | 'high'
  | 'critical'

export type ComplianceCheck = {
  id: string
  contractVersion: typeof SGPA_COMPLIANCE_CONTRACT_VERSION
  code: string
  title: string
  description: string
  status: ComplianceStatus
  severity: ComplianceSeverity
  organizationId?: string | null
  schoolId?: string | null
  responsibleUserId?: string | null
  evidenceIds: string[]
  finding?: string | null
  recommendation?: string | null
  dueAt?: string | null
  reviewedBy?: string | null
  reviewedAt?: string | null
  createdBy: string
  createdAt: string
  updatedAt: string
  metadata: Record<string, unknown>
}

export type ActionPlanStatus =
  | 'draft'
  | 'active'
  | 'blocked'
  | 'completed'
  | 'cancelled'
  | 'archived'

export type ActionPlanItem = {
  id: string
  title: string
  description: string
  responsibleUserId: string
  dueAt?: string | null
  completed: boolean
  completedAt?: string | null
  evidenceIds: string[]
}

export type InstitutionalActionPlan = {
  id: string
  title: string
  description: string
  status: ActionPlanStatus
  priority: ComplianceSeverity
  complianceCheckIds: string[]
  organizationId?: string | null
  schoolId?: string | null
  ownerUserId: string
  items: ActionPlanItem[]
  successCriteria: string[]
  startedAt?: string | null
  dueAt?: string | null
  completedAt?: string | null
  createdAt: string
  updatedAt: string
  metadata: Record<string, unknown>
}
