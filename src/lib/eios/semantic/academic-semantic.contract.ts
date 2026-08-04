import type {
  AcademicEducationLevel,
  AcademicOrganizationType,
  AcademicPeriodType,
} from '@/lib/eios/academic/academic-learning.contract'

export const ACADEMIC_SEMANTIC_CONTRACT_VERSION =
  'academic-semantic-v1' as const

export type AcademicSemanticContractVersion =
  typeof ACADEMIC_SEMANTIC_CONTRACT_VERSION

export type AcademicSemanticRecord =
  Record<string, unknown>

export type AcademicSemanticStatus =
  | 'draft'
  | 'active'
  | 'deprecated'
  | 'archived'

export type AcademicSemanticScope =
  | 'global'
  | 'international'
  | 'national'
  | 'regional'
  | 'state'
  | 'municipal'
  | 'network'
  | 'institutional'
  | 'campus'
  | 'school'
  | 'program'
  | 'course'
  | 'offering'
  | 'user'

export type AcademicSemanticDomain =
  | 'organization'
  | 'academic_structure'
  | 'people'
  | 'curriculum'
  | 'learning'
  | 'assessment'
  | 'evidence'
  | 'analytics'
  | 'decision'
  | 'governance'

export type AcademicSemanticEntityType =
  | 'ORGANIZATION'
  | 'INSTITUTION'
  | 'CAMPUS'
  | 'ACADEMIC_UNIT'
  | 'PROGRAM'
  | 'CURRICULUM_MATRIX'
  | 'ACADEMIC_COMPONENT'
  | 'ACADEMIC_PERIOD'
  | 'ACADEMIC_OFFERING'
  | 'LEARNING_GROUP'
  | 'PERSON'
  | 'LEARNER'
  | 'EDUCATOR'
  | 'MANAGER'
  | 'ACADEMIC_ROLE'
  | 'ENROLLMENT'
  | 'LEARNING_EXPERIENCE'
  | 'LEARNING_OUTCOME'
  | 'COMPETENCY'
  | 'SKILL'
  | 'KNOWLEDGE_OBJECT'
  | 'ASSESSMENT'
  | 'ASSESSMENT_ITEM'
  | 'ASSESSMENT_RESULT'
  | 'ATTENDANCE_RECORD'
  | 'LEARNING_ARTIFACT'
  | 'LEARNING_EVIDENCE'
  | 'INTERVENTION'
  | 'ACADEMIC_EVENT'
  | 'PERFORMANCE_SNAPSHOT'
  | 'EVOLUTION_INDICATOR'
  | 'RECOMMENDATION'
  | 'DECISION'
  | 'AUDIT_EVENT'

export type AcademicSemanticRelationType =
  | 'BELONGS_TO'
  | 'PART_OF'
  | 'CONTAINS'
  | 'OFFERS'
  | 'USES'
  | 'ASSIGNED_TO'
  | 'ENROLLED_IN'
  | 'TEACHES'
  | 'LEARNS_IN'
  | 'PARTICIPATES_IN'
  | 'RESPONSIBLE_FOR'
  | 'COLLABORATES_IN'
  | 'PLANS'
  | 'DELIVERS'
  | 'ATTENDS'
  | 'PRODUCES'
  | 'USES_RESOURCE'
  | 'ALIGNS_WITH'
  | 'DEVELOPS'
  | 'ASSESSES'
  | 'ASSESSED_BY'
  | 'EVIDENCES'
  | 'SUPPORTED_BY'
  | 'DERIVED_FROM'
  | 'RELATED_TO'
  | 'EQUIVALENT_TO'
  | 'COMPLEMENTS'
  | 'UNFOLDS'
  | 'REPLACES'
  | 'PREREQUISITE_OF'
  | 'COREQUISITE_OF'
  | 'PRECEDES'
  | 'FOLLOWS'
  | 'TRIGGERS'
  | 'RESPONDS_TO'
  | 'ASSOCIATED_WITH'
  | 'CONTRIBUTES_TO'
  | 'INFORMS'
  | 'RECOMMENDS'
  | 'SUPPORTS_DECISION'
  | 'RESULTS_IN'
  | 'VALIDATED_BY'
  | 'CREATED_BY'
  | 'UPDATED_BY'
  | 'GOVERNED_BY'

export type AcademicSemanticPersonRole =
  | 'learner'
  | 'educator'
  | 'teacher'
  | 'professor'
  | 'tutor'
  | 'instructor'
  | 'facilitator'
  | 'coordinator'
  | 'supervisor'
  | 'manager'
  | 'director'
  | 'administrator'
  | 'researcher'
  | 'advisor'
  | 'reviewer'
  | 'observer'
  | 'support_professional'
  | 'other'

export type AcademicSemanticLearningGroupType =
  | 'class'
  | 'cohort'
  | 'section'
  | 'team'
  | 'laboratory_group'
  | 'project_group'
  | 'research_group'
  | 'tutorial_group'
  | 'training_group'
  | 'custom'

export type AcademicSemanticExperienceType =
  | 'lesson'
  | 'lecture'
  | 'class'
  | 'workshop'
  | 'laboratory'
  | 'seminar'
  | 'tutorial'
  | 'mentoring'
  | 'internship'
  | 'field_activity'
  | 'technical_visit'
  | 'research'
  | 'project'
  | 'simulation'
  | 'extension_activity'
  | 'independent_study'
  | 'remote_session'
  | 'hybrid_session'
  | 'assessment_session'
  | 'other'

export type AcademicSemanticArtifactType =
  | 'document'
  | 'presentation'
  | 'image'
  | 'video'
  | 'audio'
  | 'source_code'
  | 'notebook'
  | 'dataset'
  | 'report'
  | 'essay'
  | 'portfolio'
  | 'project'
  | 'experiment'
  | 'prototype'
  | 'model'
  | 'rubric'
  | 'assessment'
  | 'observation'
  | 'external_link'
  | 'other'

export type AcademicSemanticVocabularyType =
  | 'canonical'
  | 'institutional'
  | 'regional'
  | 'product'
  | 'integration'
  | 'translation'
  | 'legacy'

export type AcademicSemanticAliasContext =
  | 'basic_education'
  | 'higher_education'
  | 'technical_education'
  | 'vocational_education'
  | 'corporate_learning'
  | 'international_education'
  | 'generic'

export type AcademicSemanticLanguageCode =
  | 'pt-BR'
  | 'en-US'
  | 'es'
  | string

export type AcademicSemanticLabel = {
  language:
    AcademicSemanticLanguageCode

  singular:
    string

  plural:
    string

  shortLabel:
    string | null

  description:
    string | null
}

export type AcademicSemanticAlias = {
  id:
    string

  semanticEntityType:
    AcademicSemanticEntityType

  term:
    string

  normalizedTerm:
    string

  language:
    AcademicSemanticLanguageCode

  context:
    AcademicSemanticAliasContext

  vocabularyType:
    AcademicSemanticVocabularyType

  organizationId:
    string | null

  institutionId:
    string | null

  active:
    boolean

  preferred:
    boolean

  metadata:
    AcademicSemanticRecord
}

export type AcademicSemanticEntityDefinition = {
  id:
    AcademicSemanticEntityType

  domain:
    AcademicSemanticDomain

  canonicalName:
    string

  canonicalDescription:
    string

  labels:
    AcademicSemanticLabel[]

  aliases:
    string[]

  parentEntityType:
    AcademicSemanticEntityType | null

  abstract:
    boolean

  sensitive:
    boolean

  personalData:
    boolean

  supportsVersioning:
    boolean

  supportsTemporalHistory:
    boolean

  supportsDigitalTwin:
    boolean

  status:
    AcademicSemanticStatus

  metadata:
    AcademicSemanticRecord
}

export type AcademicSemanticRelationDefinition = {
  id:
    AcademicSemanticRelationType

  canonicalName:
    string

  description:
    string

  sourceEntityTypes:
    AcademicSemanticEntityType[]

  targetEntityTypes:
    AcademicSemanticEntityType[]

  inverseRelation:
    AcademicSemanticRelationType | null

  symmetric:
    boolean

  transitive:
    boolean

  temporal:
    boolean

  allowsMultiple:
    boolean

  supportsConfidence:
    boolean

  causalMeaningAllowed:
    boolean

  status:
    AcademicSemanticStatus

  metadata:
    AcademicSemanticRecord
}

export type AcademicSemanticOrganizationContext = {
  organizationId:
    string | null

  institutionId:
    string | null

  campusId:
    string | null

  unitId:
    string | null

  organizationType:
    AcademicOrganizationType | null

  educationLevels:
    AcademicEducationLevel[]

  countryCode:
    string | null

  stateCode:
    string | null

  municipalityCode:
    string | null

  preferredLanguage:
    AcademicSemanticLanguageCode

  metadata:
    AcademicSemanticRecord
}

export type AcademicSemanticProgramContext = {
  programId:
    string | null

  curriculumMatrixId:
    string | null

  componentId:
    string | null

  academicPeriodId:
    string | null

  offeringId:
    string | null

  learningGroupId:
    string | null

  educationLevel:
    AcademicEducationLevel | null

  periodType:
    AcademicPeriodType | null

  metadata:
    AcademicSemanticRecord
}

export type AcademicSemanticConceptReference = {
  semanticEntityType:
    AcademicSemanticEntityType

  entityId:
    string

  externalSystem:
    string | null

  externalEntityType:
    string | null

  externalEntityId:
    string | null

  metadata:
    AcademicSemanticRecord
}

export type AcademicSemanticEntityInstance = {
  id:
    string

  semanticEntityType:
    AcademicSemanticEntityType

  canonicalId:
    string | null

  organizationContext:
    AcademicSemanticOrganizationContext | null

  programContext:
    AcademicSemanticProgramContext | null

  name:
    string

  description:
    string | null

  externalReferences:
    AcademicSemanticConceptReference[]

  validFrom:
    string | null

  validUntil:
    string | null

  active:
    boolean

  version:
    string | null

  metadata:
    AcademicSemanticRecord
}

export type AcademicSemanticRelationInstance = {
  id:
    string

  relationType:
    AcademicSemanticRelationType

  source:
    AcademicSemanticConceptReference

  target:
    AcademicSemanticConceptReference

  validFrom:
    string | null

  validUntil:
    string | null

  confidence:
    number | null

  explanation:
    string | null

  evidenceIds:
    string[]

  causalClaimAllowed:
    false

  createdAt:
    string

  createdBy:
    string | null

  metadata:
    AcademicSemanticRecord
}

export type AcademicSemanticLearningExperience = {
  id:
    string

  semanticEntityType:
    'LEARNING_EXPERIENCE'

  type:
    AcademicSemanticExperienceType

  offeringId:
    string

  learningGroupId:
    string

  componentId:
    string

  academicPeriodId:
    string

  educatorIds:
    string[]

  learnerIds:
    string[]

  planningId:
    string | null

  title:
    string

  description:
    string | null

  startsAt:
    string

  endsAt:
    string | null

  learningOutcomeIds:
    string[]

  artifactIds:
    string[]

  evidenceIds:
    string[]

  metadata:
    AcademicSemanticRecord
}

export type AcademicSemanticLearningArtifact = {
  id:
    string

  semanticEntityType:
    'LEARNING_ARTIFACT'

  type:
    AcademicSemanticArtifactType

  title:
    string

  description:
    string | null

  createdBy:
    string

  createdAt:
    string

  learningExperienceId:
    string | null

  assessmentId:
    string | null

  learnerId:
    string | null

  educatorId:
    string | null

  learningOutcomeIds:
    string[]

  evidenceIds:
    string[]

  storageReference:
    string | null

  externalUrl:
    string | null

  metadata:
    AcademicSemanticRecord
}

export type AcademicSemanticLearningGroup = {
  id:
    string

  semanticEntityType:
    'LEARNING_GROUP'

  type:
    AcademicSemanticLearningGroupType

  institutionId:
    string

  programId:
    string | null

  offeringId:
    string | null

  academicPeriodId:
    string

  name:
    string

  code:
    string | null

  educatorIds:
    string[]

  learnerIds:
    string[]

  active:
    boolean

  metadata:
    AcademicSemanticRecord
}

export type AcademicSemanticPerson = {
  id:
    string

  semanticEntityType:
    | 'PERSON'
    | 'LEARNER'
    | 'EDUCATOR'
    | 'MANAGER'

  displayName:
    string

  roles:
    AcademicSemanticPersonRole[]

  organizationIds:
    string[]

  institutionIds:
    string[]

  active:
    boolean

  containsPersonalData:
    true

  metadata:
    AcademicSemanticRecord
}

export type AcademicSemanticTranslationRule = {
  id:
    string

  semanticEntityType:
    AcademicSemanticEntityType

  organizationId:
    string | null

  institutionId:
    string | null

  educationLevel:
    AcademicEducationLevel | null

  context:
    AcademicSemanticAliasContext

  language:
    AcademicSemanticLanguageCode

  preferredSingular:
    string

  preferredPlural:
    string

  fallbackSingular:
    string

  fallbackPlural:
    string

  active:
    boolean

  priority:
    number

  metadata:
    AcademicSemanticRecord
}

export type AcademicSemanticMappingRule = {
  id:
    string

  sourceSystem:
    string

  sourceEntityType:
    string

  sourceField:
    string | null

  sourceValue:
    string | null

  targetEntityType:
    AcademicSemanticEntityType

  transformation:
    | 'direct'
    | 'normalized'
    | 'lookup'
    | 'composite'
    | 'custom'

  transformationExpression:
    string | null

  organizationId:
    string | null

  institutionId:
    string | null

  active:
    boolean

  metadata:
    AcademicSemanticRecord
}

export type AcademicSemanticResolutionInput = {
  term:
    string

  language?:
    AcademicSemanticLanguageCode

  organizationContext?:
    Partial<AcademicSemanticOrganizationContext>

  programContext?:
    Partial<AcademicSemanticProgramContext>

  expectedDomain?:
    AcademicSemanticDomain

  expectedEntityTypes?:
    AcademicSemanticEntityType[]
}

export type AcademicSemanticResolutionCandidate = {
  semanticEntityType:
    AcademicSemanticEntityType

  canonicalName:
    string

  matchedTerm:
    string

  matchType:
    | 'canonical'
    | 'alias'
    | 'translation'
    | 'institutional'
    | 'integration'
    | 'inferred'

  confidence:
    number

  explanation:
    string
}

export type AcademicSemanticResolutionResult = {
  success:
    boolean

  resolvedEntityType:
    AcademicSemanticEntityType | null

  candidates:
    AcademicSemanticResolutionCandidate[]

  warnings:
    string[]

  errors:
    string[]

  requiresHumanReview:
    boolean
}

export type AcademicSemanticMetadata = {
  contractVersion:
    AcademicSemanticContractVersion

  generatedAt:
    string

  status:
    AcademicSemanticStatus

  scope:
    AcademicSemanticScope

  language:
    AcademicSemanticLanguageCode

  warnings:
    string[]

  containsPersonalData:
    boolean

  containsSensitiveData:
    boolean

  automatedDecisionAllowed:
    false

  causalClaimAllowed:
    false

  humanReviewRequired:
    boolean

  explainable:
    true
}

export type AcademicSemanticContext = {
  metadata:
    AcademicSemanticMetadata

  organization:
    AcademicSemanticOrganizationContext | null

  program:
    AcademicSemanticProgramContext | null

  entityDefinitions:
    AcademicSemanticEntityDefinition[]

  relationDefinitions:
    AcademicSemanticRelationDefinition[]

  aliases:
    AcademicSemanticAlias[]

  translationRules:
    AcademicSemanticTranslationRule[]

  mappingRules:
    AcademicSemanticMappingRule[]

  entityInstances:
    AcademicSemanticEntityInstance[]

  relationInstances:
    AcademicSemanticRelationInstance[]
}

export type AcademicSemanticResult = {
  success:
    boolean

  context:
    AcademicSemanticContext | null

  errors:
    string[]

  warnings:
    string[]
}

export function normalizeAcademicSemanticTerm(
  value:
    string,
): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(
      /[\u0300-\u036f]/g,
      '',
    )
    .replace(
      /[^a-z0-9]+/g,
      '_',
    )
    .replace(
      /^_+|_+$/g,
      '')
}

export function clampAcademicSemanticConfidence(
  value:
    number,
): number {
  if (
    !Number.isFinite(
      value,
    )
  ) {
    return 0
  }

  return Math.min(
    1,
    Math.max(
      0,
      Math.round(
        value *
          10000,
      ) /
        10000,
    ),
  )
}

export function createEmptyAcademicSemanticContext():
  AcademicSemanticContext {
  return {
    metadata: {
      contractVersion:
        ACADEMIC_SEMANTIC_CONTRACT_VERSION,

      generatedAt:
        new Date()
          .toISOString(),

      status:
        'draft',

      scope:
        'global',

      language:
        'pt-BR',

      warnings:
        [],

      containsPersonalData:
        false,

      containsSensitiveData:
        false,

      automatedDecisionAllowed:
        false,

      causalClaimAllowed:
        false,

      humanReviewRequired:
        false,

      explainable:
        true,
    },

    organization:
      null,

    program:
      null,

    entityDefinitions:
      [],

    relationDefinitions:
      [],

    aliases:
      [],

    translationRules:
      [],

    mappingRules:
      [],

    entityInstances:
      [],

    relationInstances:
      [],
  }
}