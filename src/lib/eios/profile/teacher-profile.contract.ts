export const TEACHER_PROFILE_CONTRACT_VERSION =
  'teacher-profile-v1' as const

export type TeacherProfileContractVersion =
  typeof TEACHER_PROFILE_CONTRACT_VERSION

export type TeacherProfileStatus =
  | 'empty'
  | 'partial'
  | 'available'
  | 'degraded'
  | 'unavailable'

export type TeacherProfileLevel =
  | 'initial'
  | 'developing'
  | 'intermediate'
  | 'advanced'

export type TeacherProfilePriority =
  | 'low'
  | 'normal'
  | 'medium'
  | 'high'
  | 'critical'

export type TeacherProfileDimensionId =
  | 'agenda'
  | 'planning'
  | 'evidence'
  | 'execution'
  | 'organization'
  | 'professional_development'
  | 'governance'
  | 'digital_maturity'

export type TeacherProfileSource =
  | 'agenda'
  | 'professor_digital'
  | 'professional_development'
  | 'analytics'
  | 'institution'
  | 'manual'
  | 'integration'

export type TeacherProfileDimension = {
  id:
    TeacherProfileDimensionId

  label:
    string

  score:
    number

  minimum:
    0

  maximum:
    100

  source:
    TeacherProfileSource

  explanation:
    string

  dataAvailable:
    boolean
}

export type TeacherProfileRecommendation = {
  id:
    string

  type:
    TeacherProfileDimensionId

  priority:
    TeacherProfilePriority

  title:
    string

  description:
    string

  reason:
    string

  expectedImpact:
    string | null

  source:
    TeacherProfileSource

  actionLabel:
    string | null

  actionHref:
    string | null

  requiresConfirmation:
    boolean

  automaticExecutionAllowed:
    false
}

export type TeacherProfileMetadata = {
  contractVersion:
    TeacherProfileContractVersion

  generatedAt:
    string

  status:
    TeacherProfileStatus

  sources:
    TeacherProfileSource[]

  dataQualityScore:
    number | null

  warnings:
    string[]

  automatedDecisionAllowed:
    false

  humanReviewRequired:
    boolean

  explainable:
    true
}

export type TeacherProfileSummary = {
  metadata:
    TeacherProfileMetadata

  ediScore:
    number

  level:
    TeacherProfileLevel

  levelLabel:
    string

  summary:
    string

  dimensions:
    TeacherProfileDimension[]

  recommendations:
    TeacherProfileRecommendation[]
}

export type TeacherProfileResult = {
  success:
    boolean

  profile:
    TeacherProfileSummary | null

  errors:
    string[]

  warnings:
    string[]
}

export function clampTeacherProfileScore(
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
    100,
    Math.max(
      0,
      Math.round(
        value * 100,
      ) / 100,
    ),
  )
}

export function getTeacherProfileLevel(
  score:
    number,
): TeacherProfileLevel {
  const normalizedScore =
    clampTeacherProfileScore(
      score,
    )

  if (
    normalizedScore >=
    85
  ) {
    return 'advanced'
  }

  if (
    normalizedScore >=
    60
  ) {
    return 'intermediate'
  }

  if (
    normalizedScore >=
    30
  ) {
    return 'developing'
  }

  return 'initial'
}

export function getTeacherProfileLevelLabel(
  level:
    TeacherProfileLevel,
): string {
  if (
    level ===
    'advanced'
  ) {
    return 'Avançado'
  }

  if (
    level ===
    'intermediate'
  ) {
    return 'Intermediário'
  }

  if (
    level ===
    'developing'
  ) {
    return 'Em desenvolvimento'
  }

  return 'Inicial'
}

export function getTeacherProfileSummaryText(
  level:
    TeacherProfileLevel,
): string {
  if (
    level ===
    'advanced'
  ) {
    return [
      'Perfil docente consolidado,',
      'com forte aderência ao Framework EDI',
      'e uso consistente de evidências,',
      'planejamento e inteligência educacional.',
    ].join(' ')
  }

  if (
    level ===
    'intermediate'
  ) {
    return [
      'Perfil docente em evolução consistente,',
      'com boas práticas registradas',
      'e oportunidades de ampliar',
      'a integração entre os módulos.',
    ].join(' ')
  }

  if (
    level ===
    'developing'
  ) {
    return [
      'Perfil docente em desenvolvimento,',
      'com necessidade de ampliar registros,',
      'evidências e acompanhamento',
      'das ações pedagógicas.',
    ].join(' ')
  }

  return [
    'Perfil inicial,',
    'com quantidade limitada de dados',
    'pedagógicos estruturados',
    'para uma análise mais completa.',
  ].join(' ')
}

export function createTeacherProfileDimension({
  id,
  label,
  score,
  source,
  explanation,
  dataAvailable,
}: {
  id:
    TeacherProfileDimensionId

  label:
    string

  score:
    number

  source:
    TeacherProfileSource

  explanation:
    string

  dataAvailable:
    boolean
}): TeacherProfileDimension {
  return {
    id,

    label,

    score:
      clampTeacherProfileScore(
        score,
      ),

    minimum:
      0,

    maximum:
      100,

    source,

    explanation,

    dataAvailable,
  }
}

export function createEmptyTeacherProfile(
  warnings:
    string[] = [],
): TeacherProfileSummary {
  const generatedAt =
    new Date()
      .toISOString()

  return {
    metadata: {
      contractVersion:
        TEACHER_PROFILE_CONTRACT_VERSION,

      generatedAt,

      status:
        'empty',

      sources:
        [],

      dataQualityScore:
        null,

      warnings,

      automatedDecisionAllowed:
        false,

      humanReviewRequired:
        false,

      explainable:
        true,
    },

    ediScore:
      0,

    level:
      'initial',

    levelLabel:
      getTeacherProfileLevelLabel(
        'initial',
      ),

    summary:
      getTeacherProfileSummaryText(
        'initial',
      ),

    dimensions:
      [],

    recommendations:
      [],
  }
}