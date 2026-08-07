/** EduData IA — Observatório da Educação — Research Study Contract 1.0 */

export const OBSERVATORY_STUDY_CONTRACT_VERSION = 'observatory-study-v1' as const

export type ObservatoryStudyStatus =
  | 'draft'
  | 'under_review'
  | 'active'
  | 'completed'
  | 'published'
  | 'archived'

export type ObservatoryStudy = {
  id: string
  contractVersion: typeof OBSERVATORY_STUDY_CONTRACT_VERSION
  title: string
  researchQuestion: string
  scope: string
  methodologySummary: string
  findingsSummary?: string | null
  status: ObservatoryStudyStatus
  public: boolean
  authorUserId: string
  organizationId?: string | null
  schoolId?: string | null
  datasetRefs: string[]
  indicatorRefs: string[]
  startedAt?: string | null
  completedAt?: string | null
  publishedAt?: string | null
  reviewedBy?: string | null
  reviewedAt?: string | null
  createdAt: string
  updatedAt: string
  metadata: Record<string, unknown>
}
