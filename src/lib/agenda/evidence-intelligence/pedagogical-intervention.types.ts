/**
 * EduData IA — EIOS
 * Capability 02: Pedagogical Copilot
 *
 * Contrato oficial de domínio para intervenções pedagógicas.
 *
 * Arquitetura preservada:
 * Framework EDI
 * → EIOS
 * → Core Compartilhado
 * → Produtos Especializados
 *
 * Este arquivo não depende de React, Next.js, Supabase ou componentes visuais.
 * Ele deve permanecer reutilizável por engines, APIs, persistência,
 * Learning Graph, Analytics, Research Intelligence e produtos do ecossistema.
 */

/* ==========================================================================
 * TIPOS PRIMITIVOS E UTILITÁRIOS
 * ========================================================================== */

export type PedagogicalInterventionId = string

export type PedagogicalInterventionVersionId = string

export type PedagogicalInterventionEventId = string

export type PedagogicalInterventionObjectiveId = string

export type PedagogicalInterventionActionId = string

export type PedagogicalInterventionIndicatorId = string

export type PedagogicalInterventionCheckpointId = string

export type PedagogicalInterventionEvidenceExpectationId = string

export type PedagogicalInterventionDiagnosticQuestionId = string

export type PedagogicalInterventionMethodologyId = string

export type PedagogicalInterventionResourceId = string

export type PedagogicalInterventionSuccessCriterionId = string

export type PedagogicalInterventionGroupId = string

export type PedagogicalInterventionIsoDateTime = string

export type PedagogicalInterventionIsoDate = string

export type PedagogicalInterventionScore = number

export type PedagogicalInterventionPercentage = number

export type PedagogicalInterventionMetadata =
  Record<string, unknown>

/* ==========================================================================
 * ORIGEM E CAPABILITY
 * ========================================================================== */

export type PedagogicalInterventionCapability =
  | 'pedagogical_copilot'
  | 'evidence_intelligence'
  | 'learning_graph'
  | 'educational_analytics'
  | 'organizational_intelligence'
  | 'research_intelligence'

export type PedagogicalInterventionSource =
  | 'eios_engine'
  | 'professor'
  | 'coordinator'
  | 'director'
  | 'supervision'
  | 'secretariat'
  | 'system_import'
  | 'api'
  | 'research'
  | 'other'

export type PedagogicalInterventionProduct =
  | 'agenda_inteligente_edi'
  | 'professor_digital'
  | 'edudata_analytics'
  | 'sgpa'
  | 'edudata_academy'
  | 'observatorio'
  | 'backoffice'
  | 'experience_manager'
  | 'eios_core'
  | 'other'

/* ==========================================================================
 * PRIORIDADE, RISCO E STATUS
 * ========================================================================== */

export type PedagogicalInterventionPriority =
  | 'low'
  | 'moderate'
  | 'high'
  | 'urgent'
  | 'critical'

export type PedagogicalInterventionRiskLevel =
  | 'none'
  | 'low'
  | 'moderate'
  | 'high'
  | 'critical'
  | 'undetermined'

export type PedagogicalInterventionRiskType =
  | 'learning_gap'
  | 'engagement'
  | 'attendance'
  | 'participation'
  | 'behavior'
  | 'accessibility'
  | 'inclusion'
  | 'assessment'
  | 'progression'
  | 'dropout'
  | 'social_interaction'
  | 'wellbeing_observation'
  | 'data_quality'
  | 'insufficient_evidence'
  | 'other'

export type PedagogicalInterventionStatus =
  | 'draft'
  | 'generated'
  | 'awaiting_teacher_decision'
  | 'accepted'
  | 'adapted'
  | 'rejected'
  | 'scheduled'
  | 'in_progress'
  | 'paused'
  | 'completed'
  | 'cancelled'
  | 'under_evaluation'
  | 'evaluated'
  | 'archived'

export type PedagogicalInterventionExecutionStatus =
  | 'not_started'
  | 'scheduled'
  | 'in_progress'
  | 'partially_completed'
  | 'completed'
  | 'paused'
  | 'cancelled'
  | 'not_applicable'

export type PedagogicalInterventionEvaluationStatus =
  | 'not_started'
  | 'collecting_evidence'
  | 'under_review'
  | 'effective'
  | 'partially_effective'
  | 'ineffective'
  | 'inconclusive'
  | 'requires_continuation'
  | 'requires_redesign'

/* ==========================================================================
 * ESCOPO PEDAGÓGICO
 * ========================================================================== */

export type PedagogicalInterventionScope =
  | 'individual'
  | 'small_group'
  | 'subgroup'
  | 'class'
  | 'multiple_classes'
  | 'school'
  | 'organization'
  | 'network'

export type PedagogicalInterventionTargetType =
  | 'student'
  | 'student_group'
  | 'class'
  | 'teacher'
  | 'teaching_team'
  | 'school'
  | 'organization'
  | 'network'

export type PedagogicalInterventionAudience = {
  scope: PedagogicalInterventionScope

  targetType: PedagogicalInterventionTargetType

  /**
   * IDs internos dos sujeitos ou grupos.
   * Não devem conter nomes, documentos ou dados pessoais diretamente.
   */
  targetIds: string[]

  estimatedParticipants?: number | null

  groupId?: PedagogicalInterventionGroupId | null

  groupLabel?: string | null

  selectionRationale?: string | null

  anonymized: boolean

  aggregated: boolean
}

/* ==========================================================================
 * LIGAÇÕES COM O ECOSSISTEMA E LEARNING GRAPH
 * ========================================================================== */

export type PedagogicalInterventionEntityType =
  | 'organization'
  | 'school'
  | 'user'
  | 'teacher'
  | 'student'
  | 'student_group'
  | 'class'
  | 'planning'
  | 'lesson'
  | 'learning_objective'
  | 'skill'
  | 'competency'
  | 'curriculum_reference'
  | 'evidence'
  | 'indicator'
  | 'assessment'
  | 'assessment_result'
  | 'intervention'
  | 'intervention_action'
  | 'intervention_checkpoint'
  | 'other'

export type PedagogicalInterventionEntityReference = {
  entityType: PedagogicalInterventionEntityType

  entityId: string

  label?: string | null

  relationship?: string | null

  sourceSystem?: string | null

  metadata?: PedagogicalInterventionMetadata
}

export type PedagogicalInterventionContextLinks = {
  organizationId?: string | null

  schoolId?: string | null

  teacherId?: string | null

  classIds: string[]

  planningIds: string[]

  lessonIds: string[]

  learningObjectiveIds: string[]

  skillIds: string[]

  competencyIds: string[]

  curriculumReferenceIds: string[]

  evidenceIds: string[]

  indicatorIds: string[]

  assessmentIds: string[]

  assessmentResultIds: string[]

  relatedInterventionIds: PedagogicalInterventionId[]

  additionalEntities: PedagogicalInterventionEntityReference[]
}

/* ==========================================================================
 * CONTEXTO PEDAGÓGICO
 * ========================================================================== */

export type PedagogicalInterventionEducationalStage =
  | 'early_childhood'
  | 'elementary_initial_years'
  | 'elementary_final_years'
  | 'secondary'
  | 'technical'
  | 'youth_and_adult_education'
  | 'higher_education'
  | 'continuing_education'
  | 'other'
  | 'not_informed'

export type PedagogicalInterventionModality =
  | 'in_person'
  | 'remote'
  | 'hybrid'
  | 'special_education'
  | 'youth_and_adult_education'
  | 'technical'
  | 'other'
  | 'not_informed'

export type PedagogicalInterventionContext = {
  title: string

  summary: string

  educationalStage?: PedagogicalInterventionEducationalStage

  modality?: PedagogicalInterventionModality

  subjectArea?: string | null

  component?: string | null

  gradeLevel?: string | null

  schoolTerm?: string | null

  academicYear?: number | null

  locationContext?: string | null

  audience: PedagogicalInterventionAudience

  links: PedagogicalInterventionContextLinks

  contextualFactors: string[]

  constraints: string[]

  availableResources: string[]

  previousActions: string[]

  teacherObservations: string[]
}

/* ==========================================================================
 * DIAGNÓSTICO
 * ========================================================================== */

export type PedagogicalDiagnosticSourceType =
  | 'evidence'
  | 'assessment'
  | 'indicator'
  | 'teacher_observation'
  | 'student_production'
  | 'attendance_record'
  | 'participation_record'
  | 'behavior_record'
  | 'planning'
  | 'lesson_record'
  | 'historical_data'
  | 'analytics'
  | 'human_review'
  | 'other'

export type PedagogicalDiagnosticSource = {
  sourceType: PedagogicalDiagnosticSourceType

  sourceId?: string | null

  description: string

  relevanceScore?: PedagogicalInterventionScore | null

  reliabilityScore?: PedagogicalInterventionScore | null

  observedAt?: PedagogicalInterventionIsoDateTime | null

  metadata?: PedagogicalInterventionMetadata
}

export type PedagogicalDiagnosticCause = {
  id: string

  category: string

  description: string

  probability?: PedagogicalInterventionScore | null

  evidenceIds: string[]

  requiresHumanValidation: boolean

  validatedByHuman: boolean

  validationNotes?: string | null
}

export type PedagogicalRiskAssessment = {
  level: PedagogicalInterventionRiskLevel

  types: PedagogicalInterventionRiskType[]

  summary: string

  signals: string[]

  protectiveFactors: string[]

  aggravatingFactors: string[]

  probabilityScore?: PedagogicalInterventionScore | null

  impactScore?: PedagogicalInterventionScore | null

  urgencyScore?: PedagogicalInterventionScore | null

  requiresImmediateHumanAttention: boolean

  limitations: string[]
}

export type PedagogicalInterventionDiagnostic = {
  problemStatement: string

  pedagogicalInterpretation: string

  observedPatterns: string[]

  strengths: string[]

  learningGaps: string[]

  inclusionBarriers: string[]

  engagementFactors: string[]

  probableCauses: PedagogicalDiagnosticCause[]

  sources: PedagogicalDiagnosticSource[]

  risk: PedagogicalRiskAssessment

  confidenceScore?: PedagogicalInterventionScore | null

  reliabilityScore?: PedagogicalInterventionScore | null

  evidenceSufficiencyScore?: PedagogicalInterventionScore | null

  requiresAdditionalEvidence: boolean

  additionalEvidenceNeeded: string[]

  assumptions: string[]

  limitations: string[]

  generatedAt?: PedagogicalInterventionIsoDateTime | null
}

/* ==========================================================================
 * OBJETIVOS
 * ========================================================================== */

export type PedagogicalObjectiveType =
  | 'learning'
  | 'recomposition'
  | 'inclusion'
  | 'engagement'
  | 'participation'
  | 'attendance'
  | 'behavior'
  | 'assessment'
  | 'teacher_practice'
  | 'group_dynamics'
  | 'organizational'
  | 'other'

export type PedagogicalObjectiveTimeHorizon =
  | 'immediate'
  | 'short_term'
  | 'medium_term'
  | 'long_term'

export type PedagogicalObjectiveStatus =
  | 'planned'
  | 'in_progress'
  | 'achieved'
  | 'partially_achieved'
  | 'not_achieved'
  | 'cancelled'
  | 'not_evaluated'

export type PedagogicalInterventionObjective = {
  id: PedagogicalInterventionObjectiveId

  type: PedagogicalObjectiveType

  title: string

  description: string

  rationale: string

  timeHorizon: PedagogicalObjectiveTimeHorizon

  priority: PedagogicalInterventionPriority

  status: PedagogicalObjectiveStatus

  targetValue?: number | string | boolean | null

  baselineValue?: number | string | boolean | null

  unit?: string | null

  learningObjectiveIds: string[]

  skillIds: string[]

  competencyIds: string[]

  indicatorIds: PedagogicalInterventionIndicatorId[]

  successCriterionIds:
    PedagogicalInterventionSuccessCriterionId[]

  expectedBy?: PedagogicalInterventionIsoDate | null

  metadata?: PedagogicalInterventionMetadata
}

/* ==========================================================================
 * RECOMPOSIÇÃO
 * ========================================================================== */

export type PedagogicalRecompositionLevel =
  | 'preventive'
  | 'targeted'
  | 'intensive'
  | 'continuous'

export type PedagogicalRecompositionStrategy = {
  enabled: boolean

  level?: PedagogicalRecompositionLevel | null

  identifiedPrerequisites: string[]

  essentialKnowledge: string[]

  learningGaps: string[]

  sequence: string[]

  recoveryActivities: string[]

  reinforcementActivities: string[]

  consolidationActivities: string[]

  assessmentApproach: string[]

  expectedDuration?: string | null

  notes?: string | null
}

/* ==========================================================================
 * INCLUSÃO E ACESSIBILIDADE
 * ========================================================================== */

export type PedagogicalInclusionDimension =
  | 'access'
  | 'participation'
  | 'engagement'
  | 'communication'
  | 'mobility'
  | 'sensory'
  | 'cognitive'
  | 'language'
  | 'socioeconomic'
  | 'cultural'
  | 'digital'
  | 'assessment'
  | 'other'

export type PedagogicalAdaptationType =
  | 'content'
  | 'instruction'
  | 'activity'
  | 'resource'
  | 'time'
  | 'environment'
  | 'communication'
  | 'assessment'
  | 'technology'
  | 'support'
  | 'other'

export type PedagogicalAdaptation = {
  id: string

  type: PedagogicalAdaptationType

  title: string

  description: string

  rationale: string

  targetBarrier?: string | null

  resources: string[]

  responsibleIds: string[]

  required: boolean

  status:
    | 'proposed'
    | 'accepted'
    | 'adapted'
    | 'implemented'
    | 'evaluated'
    | 'rejected'

  metadata?: PedagogicalInterventionMetadata
}

export type PedagogicalInclusionPlan = {
  enabled: boolean

  dimensions: PedagogicalInclusionDimension[]

  identifiedBarriers: string[]

  accessibilityNeeds: string[]

  participationSupports: string[]

  differentiatedApproaches: string[]

  universalDesignStrategies: string[]

  adaptations: PedagogicalAdaptation[]

  safeguardingNotes: string[]

  requiresSpecializedHumanReview: boolean

  reviewerRole?: string | null
}

/* ==========================================================================
 * METODOLOGIAS, RECURSOS E PERGUNTAS DIAGNÓSTICAS
 * ========================================================================== */

export type PedagogicalMethodologyCategory =
  | 'active_learning'
  | 'collaborative_learning'
  | 'problem_based_learning'
  | 'project_based_learning'
  | 'inquiry_based_learning'
  | 'direct_instruction'
  | 'guided_practice'
  | 'peer_learning'
  | 'formative_assessment'
  | 'differentiated_instruction'
  | 'universal_design_for_learning'
  | 'gamification'
  | 'experimentation'
  | 'simulation'
  | 'remediation'
  | 'other'

export type PedagogicalInterventionMethodology = {
  id: PedagogicalInterventionMethodologyId

  category: PedagogicalMethodologyCategory

  name: string

  description: string

  rationale: string

  implementationGuidance: string[]

  expectedBenefits: string[]

  risksOrLimitations: string[]

  resourceIds: PedagogicalInterventionResourceId[]

  adaptationIds: string[]

  metadata?: PedagogicalInterventionMetadata
}

export type PedagogicalResourceType =
  | 'material'
  | 'digital'
  | 'assistive_technology'
  | 'assessment_instrument'
  | 'worksheet'
  | 'video'
  | 'simulation'
  | 'laboratory'
  | 'human_support'
  | 'environment'
  | 'other'

export type PedagogicalInterventionResource = {
  id: PedagogicalInterventionResourceId

  type: PedagogicalResourceType

  name: string

  description?: string | null

  url?: string | null

  required: boolean

  available: boolean

  accessibilityNotes?: string | null

  metadata?: PedagogicalInterventionMetadata
}

export type PedagogicalDiagnosticQuestionType =
  | 'open'
  | 'closed'
  | 'multiple_choice'
  | 'scale'
  | 'observation'
  | 'practical_task'
  | 'reflection'
  | 'oral'
  | 'written'
  | 'other'

export type PedagogicalDiagnosticQuestion = {
  id: PedagogicalInterventionDiagnosticQuestionId

  type: PedagogicalDiagnosticQuestionType

  question: string

  purpose: string

  relatedObjectiveIds:
    PedagogicalInterventionObjectiveId[]

  expectedEvidence: string[]

  interpretationGuidance: string[]

  accessibilityAdaptations: string[]

  order: number

  required: boolean

  metadata?: PedagogicalInterventionMetadata
}

/* ==========================================================================
 * PLANO DE AÇÕES
 * ========================================================================== */

export type PedagogicalActionType =
  | 'diagnostic'
  | 'instruction'
  | 'recomposition'
  | 'reinforcement'
  | 'inclusion'
  | 'adaptation'
  | 'assessment'
  | 'feedback'
  | 'monitoring'
  | 'family_engagement'
  | 'teacher_collaboration'
  | 'organizational_support'
  | 'referral'
  | 'other'

export type PedagogicalActionResponsibleRole =
  | 'teacher'
  | 'coordinator'
  | 'director'
  | 'specialized_professional'
  | 'teaching_team'
  | 'student'
  | 'family'
  | 'organization'
  | 'other'

export type PedagogicalInterventionAction = {
  id: PedagogicalInterventionActionId

  type: PedagogicalActionType

  title: string

  description: string

  rationale: string

  priority: PedagogicalInterventionPriority

  executionStatus: PedagogicalInterventionExecutionStatus

  sequence: number

  responsibleRoles: PedagogicalActionResponsibleRole[]

  responsibleIds: string[]

  objectiveIds: PedagogicalInterventionObjectiveId[]

  methodologyIds: PedagogicalInterventionMethodologyId[]

  resourceIds: PedagogicalInterventionResourceId[]

  adaptationIds: string[]

  diagnosticQuestionIds:
    PedagogicalInterventionDiagnosticQuestionId[]

  expectedEvidenceIds:
    PedagogicalInterventionEvidenceExpectationId[]

  indicatorIds: PedagogicalInterventionIndicatorId[]

  plannedStartAt?: PedagogicalInterventionIsoDateTime | null

  plannedEndAt?: PedagogicalInterventionIsoDateTime | null

  actualStartAt?: PedagogicalInterventionIsoDateTime | null

  actualEndAt?: PedagogicalInterventionIsoDateTime | null

  estimatedDurationMinutes?: number | null

  teacherInstructions: string[]

  studentInstructions: string[]

  implementationNotes: string[]

  completionNotes?: string | null

  metadata?: PedagogicalInterventionMetadata
}

export type PedagogicalInterventionPlan = {
  summary: string

  rationale: string

  guidingPrinciples: string[]

  objectives: PedagogicalInterventionObjective[]

  actions: PedagogicalInterventionAction[]

  recomposition: PedagogicalRecompositionStrategy

  inclusion: PedagogicalInclusionPlan

  methodologies: PedagogicalInterventionMethodology[]

  resources: PedagogicalInterventionResource[]

  diagnosticQuestions: PedagogicalDiagnosticQuestion[]

  differentiationStrategies: string[]

  teacherSupportRecommendations: string[]

  organizationalSupportRecommendations: string[]

  risksAndMitigations: string[]

  alternatives: string[]

  expectedDuration?: string | null
}

/* ==========================================================================
 * EVIDÊNCIAS ESPERADAS
 * ========================================================================== */

export type PedagogicalExpectedEvidenceType =
  | 'student_production'
  | 'assessment_result'
  | 'observation'
  | 'participation_record'
  | 'attendance_record'
  | 'self_assessment'
  | 'peer_assessment'
  | 'teacher_record'
  | 'portfolio'
  | 'performance_task'
  | 'indicator_measurement'
  | 'other'

export type PedagogicalEvidenceCollectionFrequency =
  | 'once'
  | 'daily'
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  | 'each_lesson'
  | 'each_checkpoint'
  | 'continuous'
  | 'custom'

export type PedagogicalExpectedEvidence = {
  id: PedagogicalInterventionEvidenceExpectationId

  type: PedagogicalExpectedEvidenceType

  title: string

  description: string

  purpose: string

  collectionMethod: string

  frequency: PedagogicalEvidenceCollectionFrequency

  responsibleIds: string[]

  objectiveIds: PedagogicalInterventionObjectiveId[]

  actionIds: PedagogicalInterventionActionId[]

  indicatorIds: PedagogicalInterventionIndicatorId[]

  expectedBy?: PedagogicalInterventionIsoDateTime | null

  required: boolean

  anonymizationRequired: boolean

  aggregationRequired: boolean

  validationCriteria: string[]

  metadata?: PedagogicalInterventionMetadata
}

/* ==========================================================================
 * INDICADORES
 * ========================================================================== */

export type PedagogicalIndicatorType =
  | 'quantitative'
  | 'qualitative'
  | 'mixed'

export type PedagogicalIndicatorDirection =
  | 'increase'
  | 'decrease'
  | 'maintain'
  | 'reach'
  | 'avoid'
  | 'observe'

export type PedagogicalIndicatorAggregation =
  | 'individual'
  | 'group'
  | 'class'
  | 'school'
  | 'organization'
  | 'network'

export type PedagogicalInterventionIndicator = {
  id: PedagogicalInterventionIndicatorId

  name: string

  description: string

  type: PedagogicalIndicatorType

  direction: PedagogicalIndicatorDirection

  aggregation: PedagogicalIndicatorAggregation

  unit?: string | null

  baselineValue?: number | string | boolean | null

  targetValue?: number | string | boolean | null

  currentValue?: number | string | boolean | null

  minimumAcceptableValue?: number | string | boolean | null

  measurementMethod: string

  dataSource: string

  objectiveIds: PedagogicalInterventionObjectiveId[]

  actionIds: PedagogicalInterventionActionId[]

  evidenceExpectationIds:
    PedagogicalInterventionEvidenceExpectationId[]

  measuredAt?: PedagogicalInterventionIsoDateTime | null

  nextMeasurementAt?: PedagogicalInterventionIsoDateTime | null

  metadata?: PedagogicalInterventionMetadata
}

/* ==========================================================================
 * CRITÉRIOS DE SUCESSO
 * ========================================================================== */

export type PedagogicalSuccessCriterionLevel =
  | 'minimum'
  | 'expected'
  | 'ideal'

export type PedagogicalSuccessCriterionStatus =
  | 'not_evaluated'
  | 'achieved'
  | 'partially_achieved'
  | 'not_achieved'
  | 'inconclusive'

export type PedagogicalSuccessCriterion = {
  id: PedagogicalInterventionSuccessCriterionId

  level: PedagogicalSuccessCriterionLevel

  title: string

  description: string

  measurementMethod: string

  targetValue?: number | string | boolean | null

  observedValue?: number | string | boolean | null

  status: PedagogicalSuccessCriterionStatus

  objectiveIds: PedagogicalInterventionObjectiveId[]

  indicatorIds: PedagogicalInterventionIndicatorId[]

  evidenceExpectationIds:
    PedagogicalInterventionEvidenceExpectationId[]

  evaluationNotes?: string | null

  metadata?: PedagogicalInterventionMetadata
}

/* ==========================================================================
 * CRONOGRAMA E CHECKPOINTS
 * ========================================================================== */

export type PedagogicalCheckpointType =
  | 'initial'
  | 'diagnostic'
  | 'implementation'
  | 'monitoring'
  | 'formative_evaluation'
  | 'final_evaluation'
  | 'follow_up'
  | 'human_review'
  | 'other'

export type PedagogicalCheckpointStatus =
  | 'pending'
  | 'scheduled'
  | 'completed'
  | 'overdue'
  | 'cancelled'
  | 'rescheduled'

export type PedagogicalInterventionCheckpoint = {
  id: PedagogicalInterventionCheckpointId

  type: PedagogicalCheckpointType

  title: string

  description: string

  status: PedagogicalCheckpointStatus

  plannedAt: PedagogicalInterventionIsoDateTime

  completedAt?: PedagogicalInterventionIsoDateTime | null

  responsibleIds: string[]

  actionIds: PedagogicalInterventionActionId[]

  objectiveIds: PedagogicalInterventionObjectiveId[]

  indicatorIds: PedagogicalInterventionIndicatorId[]

  evidenceExpectationIds:
    PedagogicalInterventionEvidenceExpectationId[]

  findings: string[]

  decisions: string[]

  nextActions: string[]

  notes?: string | null

  metadata?: PedagogicalInterventionMetadata
}

export type PedagogicalInterventionSchedule = {
  plannedStartAt?: PedagogicalInterventionIsoDateTime | null

  plannedEndAt?: PedagogicalInterventionIsoDateTime | null

  actualStartAt?: PedagogicalInterventionIsoDateTime | null

  actualEndAt?: PedagogicalInterventionIsoDateTime | null

  timezone?: string | null

  recurrence?: string | null

  checkpoints: PedagogicalInterventionCheckpoint[]
}

/* ==========================================================================
 * REVISÃO HUMANA E DECISÃO DO PROFESSOR
 * ========================================================================== */

export type PedagogicalHumanReviewStatus =
  | 'not_required'
  | 'pending'
  | 'in_review'
  | 'approved'
  | 'approved_with_changes'
  | 'changes_requested'
  | 'rejected'

export type PedagogicalHumanReviewerRole =
  | 'teacher'
  | 'coordinator'
  | 'director'
  | 'supervisor'
  | 'specialized_professional'
  | 'administrator'
  | 'researcher'
  | 'other'

export type PedagogicalHumanReview = {
  required: boolean

  status: PedagogicalHumanReviewStatus

  reviewerId?: string | null

  reviewerRole?: PedagogicalHumanReviewerRole | null

  requestedAt?: PedagogicalInterventionIsoDateTime | null

  startedAt?: PedagogicalInterventionIsoDateTime | null

  completedAt?: PedagogicalInterventionIsoDateTime | null

  summary?: string | null

  comments: string[]

  requestedChanges: string[]

  approvedElements: string[]

  rejectedElements: string[]

  limitationsAcknowledged: boolean

  professionalResponsibilityConfirmed: boolean
}

export type PedagogicalTeacherDecisionType =
  | 'pending'
  | 'accepted'
  | 'adapted'
  | 'rejected'

export type PedagogicalTeacherDecision = {
  decision: PedagogicalTeacherDecisionType

  teacherId?: string | null

  decidedAt?: PedagogicalInterventionIsoDateTime | null

  rationale?: string | null

  adaptations: string[]

  rejectedRecommendations: string[]

  acceptedRecommendations: string[]

  professionalNotes: string[]

  requiresNewVersion: boolean

  /**
   * Confirma explicitamente que a decisão final é humana
   * e que a recomendação do EIOS não substitui o julgamento profissional.
   */
  autonomyConfirmed: boolean
}

/* ==========================================================================
 * ACOMPANHAMENTO E EXECUÇÃO
 * ========================================================================== */

export type PedagogicalProgressLevel =
  | 'not_observed'
  | 'insufficient'
  | 'initial'
  | 'developing'
  | 'adequate'
  | 'advanced'

export type PedagogicalInterventionProgressRecord = {
  id: string

  recordedAt: PedagogicalInterventionIsoDateTime

  recordedBy?: string | null

  progressLevel: PedagogicalProgressLevel

  summary: string

  achievements: string[]

  difficulties: string[]

  unexpectedEffects: string[]

  actionIds: PedagogicalInterventionActionId[]

  objectiveIds: PedagogicalInterventionObjectiveId[]

  indicatorIds: PedagogicalInterventionIndicatorId[]

  evidenceIds: string[]

  teacherObservations: string[]

  studentFeedback: string[]

  recommendedAdjustments: string[]

  metadata?: PedagogicalInterventionMetadata
}

export type PedagogicalInterventionMonitoring = {
  executionStatus: PedagogicalInterventionExecutionStatus

  progressPercentage?: PedagogicalInterventionPercentage | null

  progressRecords: PedagogicalInterventionProgressRecord[]

  currentChallenges: string[]

  currentStrengths: string[]

  adjustmentsMade: string[]

  nextActions: string[]

  lastMonitoredAt?: PedagogicalInterventionIsoDateTime | null

  nextMonitoringAt?: PedagogicalInterventionIsoDateTime | null
}

/* ==========================================================================
 * AVALIAÇÃO DA INTERVENÇÃO
 * ========================================================================== */

export type PedagogicalInterventionEffect =
  | 'positive'
  | 'neutral'
  | 'negative'
  | 'mixed'
  | 'not_determined'

export type PedagogicalInterventionEffectiveness = {
  status: PedagogicalInterventionEvaluationStatus

  effect: PedagogicalInterventionEffect

  effectivenessScore?: PedagogicalInterventionScore | null

  confidenceScore?: PedagogicalInterventionScore | null

  summary: string

  achievedObjectives:
    PedagogicalInterventionObjectiveId[]

  partiallyAchievedObjectives:
    PedagogicalInterventionObjectiveId[]

  unachievedObjectives:
    PedagogicalInterventionObjectiveId[]

  successfulActions: PedagogicalInterventionActionId[]

  ineffectiveActions: PedagogicalInterventionActionId[]

  evidenceIds: string[]

  indicatorResults: PedagogicalInterventionIndicator[]

  successCriteria: PedagogicalSuccessCriterion[]

  positiveOutcomes: string[]

  negativeOutcomes: string[]

  unintendedOutcomes: string[]

  contributingFactors: string[]

  limitingFactors: string[]

  continuationRecommendations: string[]

  redesignRecommendations: string[]

  evaluatedBy?: string | null

  evaluatedAt?: PedagogicalInterventionIsoDateTime | null

  requiresHumanValidation: boolean
}

/* ==========================================================================
 * EXPLICABILIDADE
 * ========================================================================== */

export type PedagogicalRecommendationReason = {
  id: string

  recommendation: string

  rationale: string

  sourceIds: string[]

  evidenceIds: string[]

  ruleIds: string[]

  modelFactors: string[]

  confidenceScore?: PedagogicalInterventionScore | null

  limitations: string[]
}

export type PedagogicalInterventionExplainability = {
  summary: string

  recommendationReasons: PedagogicalRecommendationReason[]

  evidenceUsed: string[]

  evidenceNotUsed: string[]

  assumptions: string[]

  limitations: string[]

  uncertaintyFactors: string[]

  alternativeInterpretations: string[]

  humanValidationPoints: string[]
}

/* ==========================================================================
 * GOVERNANÇA, PRIVACIDADE E PESQUISA
 * ========================================================================== */

export type PedagogicalDataSensitivity =
  | 'public'
  | 'internal'
  | 'restricted'
  | 'sensitive'
  | 'highly_sensitive'

export type PedagogicalInterventionLegalBasis =
  | 'consent'
  | 'contract'
  | 'legal_obligation'
  | 'public_policy'
  | 'legitimate_interest'
  | 'protection_of_life'
  | 'research'
  | 'not_applicable'
  | 'not_informed'

export type PedagogicalInterventionPrivacy = {
  containsPersonalData: boolean

  containsSensitiveData: boolean

  containsMinorData: boolean

  sensitivity: PedagogicalDataSensitivity

  anonymized: boolean

  pseudonymized: boolean

  aggregated: boolean

  legalBasis?: PedagogicalInterventionLegalBasis | null

  retentionPolicy?: string | null

  accessRestrictions: string[]

  prohibitedUses: string[]

  notes?: string | null
}

export type PedagogicalInterventionResearchEligibility = {
  eligible: boolean

  anonymizationRequired: boolean

  aggregationRequired: boolean

  longitudinalUseAllowed: boolean

  correlationUseAllowed: boolean

  groupAnalysisAllowed: boolean

  externalEventAnalysisAllowed: boolean

  zoneInfluenceAnalysisAllowed: boolean

  hypothesisGenerationAllowed: boolean

  humanSubjectsReviewRequired: boolean

  restrictions: string[]

  notes?: string | null
}

/* ==========================================================================
 * RASTREABILIDADE E AUDITORIA
 * ========================================================================== */

export type PedagogicalInterventionActorType =
  | 'user'
  | 'teacher'
  | 'coordinator'
  | 'director'
  | 'supervisor'
  | 'administrator'
  | 'system'
  | 'engine'
  | 'api'
  | 'researcher'
  | 'other'

export type PedagogicalInterventionEventType =
  | 'created'
  | 'generated'
  | 'updated'
  | 'review_requested'
  | 'review_started'
  | 'review_completed'
  | 'accepted'
  | 'adapted'
  | 'rejected'
  | 'scheduled'
  | 'started'
  | 'paused'
  | 'resumed'
  | 'checkpoint_recorded'
  | 'evidence_linked'
  | 'indicator_updated'
  | 'completed'
  | 'evaluated'
  | 'version_created'
  | 'archived'
  | 'restored'
  | 'other'

export type PedagogicalInterventionAuditEvent = {
  id: PedagogicalInterventionEventId

  type: PedagogicalInterventionEventType

  occurredAt: PedagogicalInterventionIsoDateTime

  actorType: PedagogicalInterventionActorType

  actorId?: string | null

  source: PedagogicalInterventionSource

  product?: PedagogicalInterventionProduct | null

  capability?: PedagogicalInterventionCapability | null

  previousStatus?: PedagogicalInterventionStatus | null

  newStatus?: PedagogicalInterventionStatus | null

  reason?: string | null

  changedFields: string[]

  metadata?: PedagogicalInterventionMetadata
}

export type PedagogicalInterventionTraceability = {
  correlationId: string

  causationId?: string | null

  requestId?: string | null

  sessionId?: string | null

  sourceEvidenceIds: string[]

  sourceAnalysisIds: string[]

  sourceIntelligenceRunIds: string[]

  sourceInterventionIds: PedagogicalInterventionId[]

  generatedByCapability: PedagogicalInterventionCapability

  consumedByCapabilities: PedagogicalInterventionCapability[]

  products: PedagogicalInterventionProduct[]

  auditEvents: PedagogicalInterventionAuditEvent[]
}

/* ==========================================================================
 * VERSIONAMENTO
 * ========================================================================== */

export type PedagogicalInterventionVersionStatus =
  | 'current'
  | 'superseded'
  | 'archived'
  | 'rejected'

export type PedagogicalInterventionVersion = {
  id: PedagogicalInterventionVersionId

  interventionId: PedagogicalInterventionId

  versionNumber: number

  versionLabel: string

  status: PedagogicalInterventionVersionStatus

  previousVersionId?: PedagogicalInterventionVersionId | null

  parentVersionId?: PedagogicalInterventionVersionId | null

  createdAt: PedagogicalInterventionIsoDateTime

  createdBy?: string | null

  reason: string

  changeSummary: string[]

  changedFields: string[]

  engineName?: string | null

  engineVersion?: string | null

  modelName?: string | null

  promptVersion?: string | null

  rulesetVersion?: string | null

  frameworkVersion?: string | null
}

/* ==========================================================================
 * METADADOS DO MOTOR
 * ========================================================================== */

export type PedagogicalInterventionEngineMode =
  | 'rules'
  | 'heuristic'
  | 'statistical'
  | 'machine_learning'
  | 'generative_ai'
  | 'hybrid'
  | 'human_authored'
  | 'imported'

export type PedagogicalInterventionEngineMetadata = {
  name: string

  version: string

  mode: PedagogicalInterventionEngineMode

  modelName?: string | null

  provider?: string | null

  promptVersion?: string | null

  rulesetVersion?: string | null

  frameworkVersion?: string | null

  generatedAt?: PedagogicalInterventionIsoDateTime | null

  processingDurationMs?: number | null

  confidenceScore?: PedagogicalInterventionScore | null

  reliabilityScore?: PedagogicalInterventionScore | null

  requiresHumanReview: boolean

  warnings: string[]

  limitations: string[]

  metadata?: PedagogicalInterventionMetadata
}

/* ==========================================================================
 * CONTRATO PRINCIPAL
 * ========================================================================== */

export type PedagogicalIntervention = {
  id: PedagogicalInterventionId

  /**
   * Identifica a organização responsável pelo registro.
   * Pode ser nulo para usuários individuais sem vínculo institucional.
   */
  organizationId?: string | null

  schoolId?: string | null

  ownerUserId?: string | null

  status: PedagogicalInterventionStatus

  priority: PedagogicalInterventionPriority

  source: PedagogicalInterventionSource

  sourceProduct: PedagogicalInterventionProduct

  capability: 'pedagogical_copilot'

  context: PedagogicalInterventionContext

  diagnostic: PedagogicalInterventionDiagnostic

  plan: PedagogicalInterventionPlan

  expectedEvidence: PedagogicalExpectedEvidence[]

  indicators: PedagogicalInterventionIndicator[]

  successCriteria: PedagogicalSuccessCriterion[]

  schedule: PedagogicalInterventionSchedule

  humanReview: PedagogicalHumanReview

  teacherDecision: PedagogicalTeacherDecision

  monitoring: PedagogicalInterventionMonitoring

  effectiveness?: PedagogicalInterventionEffectiveness | null

  explainability: PedagogicalInterventionExplainability

  privacy: PedagogicalInterventionPrivacy

  researchEligibility:
    PedagogicalInterventionResearchEligibility

  traceability: PedagogicalInterventionTraceability

  version: PedagogicalInterventionVersion

  engine: PedagogicalInterventionEngineMetadata

  createdAt: PedagogicalInterventionIsoDateTime

  updatedAt: PedagogicalInterventionIsoDateTime

  archivedAt?: PedagogicalInterventionIsoDateTime | null

  metadata: PedagogicalInterventionMetadata
}

/* ==========================================================================
 * ENTRADA DO MOTOR
 * ========================================================================== */

export type GeneratePedagogicalInterventionInput = {
  organizationId?: string | null

  schoolId?: string | null

  requestedByUserId?: string | null

  sourceProduct: PedagogicalInterventionProduct

  context: PedagogicalInterventionContext

  diagnostic: PedagogicalInterventionDiagnostic

  preferredPriority?: PedagogicalInterventionPriority | null

  constraints: string[]

  teacherPreferences: string[]

  excludedApproaches: string[]

  requiredMethodologies: PedagogicalMethodologyCategory[]

  requiredHumanReview: boolean

  privacy: PedagogicalInterventionPrivacy

  researchEligibility?:
    Partial<PedagogicalInterventionResearchEligibility>

  correlationId: string

  metadata?: PedagogicalInterventionMetadata
}

/* ==========================================================================
 * SAÍDA DO MOTOR
 * ========================================================================== */

export type GeneratePedagogicalInterventionResult = {
  success: boolean

  intervention: PedagogicalIntervention | null

  warnings: string[]

  errors: string[]

  generatedAt: PedagogicalInterventionIsoDateTime

  engine: PedagogicalInterventionEngineMetadata

  traceability: PedagogicalInterventionTraceability
}

/* ==========================================================================
 * ATUALIZAÇÕES E DECISÕES HUMANAS
 * ========================================================================== */

export type RecordPedagogicalTeacherDecisionInput = {
  interventionId: PedagogicalInterventionId

  expectedVersionId: PedagogicalInterventionVersionId

  teacherId: string

  decision: Exclude<
    PedagogicalTeacherDecisionType,
    'pending'
  >

  rationale: string

  adaptations: string[]

  acceptedRecommendations: string[]

  rejectedRecommendations: string[]

  professionalNotes: string[]

  correlationId: string

  decidedAt: PedagogicalInterventionIsoDateTime
}

export type RecordPedagogicalHumanReviewInput = {
  interventionId: PedagogicalInterventionId

  expectedVersionId: PedagogicalInterventionVersionId

  reviewerId: string

  reviewerRole: PedagogicalHumanReviewerRole

  status: Exclude<
    PedagogicalHumanReviewStatus,
    'not_required' | 'pending' | 'in_review'
  >

  summary: string

  comments: string[]

  requestedChanges: string[]

  approvedElements: string[]

  rejectedElements: string[]

  limitationsAcknowledged: boolean

  professionalResponsibilityConfirmed: boolean

  correlationId: string

  completedAt: PedagogicalInterventionIsoDateTime
}

export type RecordPedagogicalProgressInput = {
  interventionId: PedagogicalInterventionId

  expectedVersionId: PedagogicalInterventionVersionId

  record: PedagogicalInterventionProgressRecord

  correlationId: string
}

/* ==========================================================================
 * RESUMOS PARA APIs, PAINÉIS E LISTAGENS
 * ========================================================================== */

export type PedagogicalInterventionSummary = {
  id: PedagogicalInterventionId

  versionId: PedagogicalInterventionVersionId

  versionNumber: number

  title: string

  summary: string

  status: PedagogicalInterventionStatus

  priority: PedagogicalInterventionPriority

  riskLevel: PedagogicalInterventionRiskLevel

  scope: PedagogicalInterventionScope

  teacherDecision: PedagogicalTeacherDecisionType

  humanReviewStatus: PedagogicalHumanReviewStatus

  executionStatus: PedagogicalInterventionExecutionStatus

  evaluationStatus: PedagogicalInterventionEvaluationStatus

  objectiveCount: number

  actionCount: number

  completedActionCount: number

  progressPercentage?: PedagogicalInterventionPercentage | null

  plannedStartAt?: PedagogicalInterventionIsoDateTime | null

  plannedEndAt?: PedagogicalInterventionIsoDateTime | null

  createdAt: PedagogicalInterventionIsoDateTime

  updatedAt: PedagogicalInterventionIsoDateTime
}

export type PedagogicalInterventionHistoryItem = {
  interventionId: PedagogicalInterventionId

  version: PedagogicalInterventionVersion

  status: PedagogicalInterventionStatus

  teacherDecision: PedagogicalTeacherDecisionType

  humanReviewStatus: PedagogicalHumanReviewStatus

  executionStatus: PedagogicalInterventionExecutionStatus

  evaluationStatus: PedagogicalInterventionEvaluationStatus

  occurredAt: PedagogicalInterventionIsoDateTime

  summary: string

  eventIds: PedagogicalInterventionEventId[]
}

/* ==========================================================================
 * FILTROS E CONSULTAS
 * ========================================================================== */

export type PedagogicalInterventionSortField =
  | 'created_at'
  | 'updated_at'
  | 'priority'
  | 'risk'
  | 'status'
  | 'planned_start_at'
  | 'planned_end_at'

export type PedagogicalInterventionSortDirection =
  | 'asc'
  | 'desc'

export type PedagogicalInterventionQuery = {
  organizationId?: string | null

  schoolId?: string | null

  teacherId?: string | null

  classId?: string | null

  planningId?: string | null

  lessonId?: string | null

  evidenceId?: string | null

  objectiveId?: string | null

  statuses?: PedagogicalInterventionStatus[]

  priorities?: PedagogicalInterventionPriority[]

  riskLevels?: PedagogicalInterventionRiskLevel[]

  scopes?: PedagogicalInterventionScope[]

  teacherDecisions?: PedagogicalTeacherDecisionType[]

  humanReviewStatuses?: PedagogicalHumanReviewStatus[]

  executionStatuses?: PedagogicalInterventionExecutionStatus[]

  evaluationStatuses?: PedagogicalInterventionEvaluationStatus[]

  createdFrom?: PedagogicalInterventionIsoDateTime | null

  createdTo?: PedagogicalInterventionIsoDateTime | null

  plannedFrom?: PedagogicalInterventionIsoDateTime | null

  plannedTo?: PedagogicalInterventionIsoDateTime | null

  search?: string | null

  sortBy?: PedagogicalInterventionSortField

  sortDirection?: PedagogicalInterventionSortDirection

  page?: number

  pageSize?: number
}

/* ==========================================================================
 * CONTRATOS DE API
 * ========================================================================== */

export type PedagogicalInterventionApiError = {
  code: string

  message: string

  field?: string | null

  details?: PedagogicalInterventionMetadata
}

export type PedagogicalInterventionApiMeta = {
  generatedAt: PedagogicalInterventionIsoDateTime

  correlationId: string

  page?: number

  pageSize?: number

  totalItems?: number

  totalPages?: number

  metadata?: PedagogicalInterventionMetadata
}

export type PedagogicalInterventionApiResponse<T> = {
  success: boolean

  data: T | null

  errors: PedagogicalInterventionApiError[]

  meta: PedagogicalInterventionApiMeta
}