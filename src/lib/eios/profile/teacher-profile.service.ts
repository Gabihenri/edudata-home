import type {
  EducationalContext,
} from '../context/educational-context.contract'

import {
  TEACHER_PROFILE_CONTRACT_VERSION,
  clampTeacherProfileScore,
  createTeacherProfileDimension,
  getTeacherProfileLevel,
  getTeacherProfileLevelLabel,
  getTeacherProfileSummaryText,
  type TeacherProfileDimension,
  type TeacherProfilePriority,
  type TeacherProfileRecommendation,
  type TeacherProfileResult,
  type TeacherProfileSource,
  type TeacherProfileStatus,
  type TeacherProfileSummary,
} from './teacher-profile.contract'

const PROFILE_SOURCES =
  new Set<TeacherProfileSource>([
    'agenda',
    'professor_digital',
    'professional_development',
    'analytics',
    'institution',
    'manual',
    'integration',
  ])

function average(
  values:
    number[],
): number {
  if (
    values.length ===
    0
  ) {
    return 0
  }

  const total =
    values.reduce(
      (
        accumulator,
        value,
      ) =>
        accumulator +
        value,
      0,
    )

  return clampTeacherProfileScore(
    total /
      values.length,
  )
}

function uniqueStrings(
  values:
    string[],
): string[] {
  return Array.from(
    new Set(
      values.filter(
        value =>
          value.trim().length >
          0,
      ),
    ),
  )
}

function normalizeSources(
  context:
    EducationalContext,
): TeacherProfileSource[] {
  return context
    .metadata
    .sources
    .filter(
      (
        source,
      ): source is TeacherProfileSource =>
        PROFILE_SOURCES.has(
          source as
            TeacherProfileSource,
        ),
    )
}

function calculateSourceCoverageScore(
  sources:
    TeacherProfileSource[],
): number {
  if (
    sources.length ===
    0
  ) {
    return 0
  }

  /*
   * Quatro fontes integradas representam
   * cobertura suficiente para esta versão
   * inicial do Perfil Docente EDI.
   */
  return clampTeacherProfileScore(
    (
      Math.min(
        sources.length,
        4,
      ) /
      4
    ) *
      100,
  )
}

function hasAgendaData(
  context:
    EducationalContext,
): boolean {
  const agenda =
    context.agenda

  return (
    agenda
      .planning
      .counts
      .total >
      0 ||
    agenda
      .objectives
      .counts
      .total >
      0 ||
    agenda
      .lessons
      .counts
      .total >
      0 ||
    agenda
      .evidences
      .counts
      .total >
      0 ||
    agenda
      .tasks
      .counts
      .total >
      0 ||
    agenda
      .calendar
      .records
      .length >
      0
  )
}

function hasEvidenceData(
  context:
    EducationalContext,
): boolean {
  return (
    context
      .agenda
      .evidences
      .counts
      .total >
      0 ||
    context
      .agenda
      .lessons
      .counts
      .completed >
      0
  )
}

function hasExecutionData(
  context:
    EducationalContext,
): boolean {
  return (
    context
      .agenda
      .lessons
      .counts
      .total >
    0
  )
}

function hasProfessionalDevelopmentData(
  context:
    EducationalContext,
): boolean {
  const professional =
    context
      .professionalDevelopment

  return (
    professional.status !==
      'empty' ||
    professional
      .development
      .activePlans >
      0 ||
    professional
      .development
      .completedPlans >
      0 ||
    professional
      .development
      .overdueActions >
      0 ||
    professional
      .development
      .activeCompetencies >
      0 ||
    professional
      .observations
      .totalObservations >
      0
  )
}

function calculateProfessionalDevelopmentScore(
  context:
    EducationalContext,
): number {
  const development =
    context
      .professionalDevelopment
      .development

  const observations =
    context
      .professionalDevelopment
      .observations

  const scores:
    number[] = []

  const totalPlans =
    development.activePlans +
    development.completedPlans

  if (
    totalPlans >
    0
  ) {
    scores.push(
      clampTeacherProfileScore(
        (
          development.completedPlans /
          totalPlans
        ) *
          100,
      ),
    )
  }

  if (
    development.activeCompetencies >
    0
  ) {
    const competenciesWithoutPendingDevelopment =
      Math.max(
        0,
        development.activeCompetencies -
          development
            .competenciesNeedingDevelopment,
      )

    scores.push(
      clampTeacherProfileScore(
        (
          competenciesWithoutPendingDevelopment /
          development.activeCompetencies
        ) *
          100,
      ),
    )
  }

  if (
    observations.totalObservations >
    0
  ) {
    scores.push(
      clampTeacherProfileScore(
        (
          observations.completedObservations /
          observations.totalObservations
        ) *
          100,
      ),
    )
  }

  if (
    scores.length ===
    0
  ) {
    return 0
  }

  const overduePenalty =
    Math.min(
      development.overdueActions *
        5,
      25,
    )

  return clampTeacherProfileScore(
    average(
      scores,
    ) -
      overduePenalty,
  )
}

function calculateDigitalMaturityScore(
  context:
    EducationalContext,
): number {
  const operationalAreas = [
    context
      .agenda
      .planning
      .counts
      .total >
      0,

    context
      .agenda
      .objectives
      .counts
      .total >
      0,

    context
      .agenda
      .lessons
      .counts
      .total >
      0,

    context
      .agenda
      .evidences
      .counts
      .total >
      0,

    context
      .agenda
      .tasks
      .counts
      .total >
      0 ||
      context
        .agenda
        .calendar
        .records
        .length >
        0,

    hasProfessionalDevelopmentData(
      context,
    ),
  ]

  const activeAreas =
    operationalAreas.filter(
      Boolean,
    ).length

  return clampTeacherProfileScore(
    (
      activeAreas /
      operationalAreas.length
    ) *
      100,
  )
}

function getRecommendationPriority(
  score:
    number,

  dataAvailable:
    boolean,
): TeacherProfilePriority {
  if (!dataAvailable) {
    return 'medium'
  }

  if (
    score <
    30
  ) {
    return 'high'
  }

  return 'medium'
}

function createRecommendation({
  id,
  type,
  title,
  description,
  reason,
  expectedImpact,
  source,
  actionLabel,
  actionHref,
  score,
  dataAvailable,
}: {
  id:
    string

  type:
    TeacherProfileRecommendation['type']

  title:
    string

  description:
    string

  reason:
    string

  expectedImpact:
    string

  source:
    TeacherProfileSource

  actionLabel:
    string

  actionHref:
    string

  score:
    number

  dataAvailable:
    boolean
}): TeacherProfileRecommendation {
  return {
    id,

    type,

    priority:
      getRecommendationPriority(
        score,
        dataAvailable,
      ),

    title,

    description,

    reason,

    expectedImpact,

    source,

    actionLabel,

    actionHref,

    requiresConfirmation:
      false,

    automaticExecutionAllowed:
      false,
  }
}

function createRecommendations(
  dimensions:
    TeacherProfileDimension[],
): TeacherProfileRecommendation[] {
  const recommendations:
    TeacherProfileRecommendation[] = []

  const agenda =
    dimensions.find(
      dimension =>
        dimension.id ===
        'agenda',
    )

  const evidence =
    dimensions.find(
      dimension =>
        dimension.id ===
        'evidence',
    )

  const execution =
    dimensions.find(
      dimension =>
        dimension.id ===
        'execution',
    )

  const professionalDevelopment =
    dimensions.find(
      dimension =>
        dimension.id ===
        'professional_development',
    )

  const governance =
    dimensions.find(
      dimension =>
        dimension.id ===
        'governance',
    )

  const digitalMaturity =
    dimensions.find(
      dimension =>
        dimension.id ===
        'digital_maturity',
    )

  if (
    agenda &&
    agenda.score <
      60
  ) {
    recommendations.push(
      createRecommendation({
        id:
          'teacher-profile-agenda',

        type:
          'agenda',

        title:
          'Ampliar o uso da Agenda Inteligente EDI',

        description:
          'Registre planejamentos, objetivos, aulas, tarefas e compromissos com maior frequência.',

        reason:
          agenda.dataAvailable
            ? 'O score operacional da Agenda está abaixo do nível considerado consistente.'
            : 'Ainda não existem registros suficientes da rotina pedagógica.',

        expectedImpact:
          'Melhorar a organização, o histórico docente e a qualidade das recomendações.',

        source:
          'agenda',

        actionLabel:
          'Abrir Agenda EDI',

        actionHref:
          '/agenda/dashboard',

        score:
          agenda.score,

        dataAvailable:
          agenda.dataAvailable,
      }),
    )
  }

  if (
    evidence &&
    evidence.score <
      60
  ) {
    recommendations.push(
      createRecommendation({
        id:
          'teacher-profile-evidence',

        type:
          'evidence',

        title:
          'Fortalecer o registro de evidências',

        description:
          'Documente práticas pedagógicas, produções dos estudantes e intervenções realizadas.',

        reason:
          evidence.dataAvailable
            ? 'A cobertura de evidências está abaixo do nível esperado.'
            : 'Ainda não existem evidências suficientes para sustentar a análise pedagógica.',

        expectedImpact:
          'Aumentar a rastreabilidade das práticas e a qualidade das análises EDI.',

        source:
          'agenda',

        actionLabel:
          'Registrar evidência',

        actionHref:
          '/agenda/evidencias',

        score:
          evidence.score,

        dataAvailable:
          evidence.dataAvailable,
      }),
    )
  }

  if (
    execution &&
    execution.score <
      60
  ) {
    recommendations.push(
      createRecommendation({
        id:
          'teacher-profile-execution',

        type:
          'execution',

        title:
          'Atualizar a execução das aulas',

        description:
          'Mantenha o status das aulas e das ações pedagógicas devidamente registrado.',

        reason:
          execution.dataAvailable
            ? 'A taxa de execução registrada ainda está abaixo do nível consistente.'
            : 'Não existem aulas suficientes para calcular a execução pedagógica.',

        expectedImpact:
          'Melhorar o acompanhamento entre planejamento, realização e evidências.',

        source:
          'agenda',

        actionLabel:
          'Abrir aulas',

        actionHref:
          '/agenda/aulas',

        score:
          execution.score,

        dataAvailable:
          execution.dataAvailable,
      }),
    )
  }

  if (
    professionalDevelopment &&
    professionalDevelopment.score <
      60
  ) {
    recommendations.push(
      createRecommendation({
        id:
          'teacher-profile-development',

        type:
          'professional_development',

        title:
          'Avançar no desenvolvimento profissional',

        description:
          'Atualize objetivos profissionais, competências, formações e ações de desenvolvimento.',

        reason:
          professionalDevelopment.dataAvailable
            ? 'Os registros de desenvolvimento profissional indicam oportunidades de evolução.'
            : 'Ainda não existem dados suficientes sobre desenvolvimento profissional.',

        expectedImpact:
          'Aprimorar o acompanhamento da evolução docente e das competências prioritárias.',

        source:
          'professional_development',

        actionLabel:
          'Abrir plano de desenvolvimento',

        actionHref:
          '/professor-digital/plano',

        score:
          professionalDevelopment.score,

        dataAvailable:
          professionalDevelopment.dataAvailable,
      }),
    )
  }

  if (
    governance &&
    governance.score <
      60
  ) {
    recommendations.push(
      createRecommendation({
        id:
          'teacher-profile-governance',

        type:
          'governance',

        title:
          'Melhorar a qualidade dos dados do perfil',

        description:
          'Complete informações profissionais, institucionais e operacionais ainda ausentes.',

        reason:
          governance.dataAvailable
            ? 'A qualidade geral dos dados está abaixo do nível necessário para análises mais precisas.'
            : 'A qualidade dos dados ainda não pôde ser calculada.',

        expectedImpact:
          'Tornar os indicadores e as recomendações mais completos e confiáveis.',

        source:
          'analytics',

        actionLabel:
          'Atualizar contexto da escola',

        actionHref:
          '/professor-digital/escola',

        score:
          governance.score,

        dataAvailable:
          governance.dataAvailable,
      }),
    )
  }

  if (
    digitalMaturity &&
    digitalMaturity.score <
      60
  ) {
    recommendations.push(
      createRecommendation({
        id:
          'teacher-profile-digital-maturity',

        type:
          'digital_maturity',

        title:
          'Ampliar a integração dos módulos',

        description:
          'Utilize mais áreas do Professor Digital e da Agenda Inteligente EDI.',

        reason:
          'A maturidade digital considera a amplitude de módulos com registros ativos.',

        expectedImpact:
          'Construir um contexto docente mais integrado e reduzir registros fragmentados.',

        source:
          'professor_digital',

        actionLabel:
          'Abrir ambiente docente',

        actionHref:
          '/professor-digital/agenda',

        score:
          digitalMaturity.score,

        dataAvailable:
          digitalMaturity.dataAvailable,
      }),
    )
  }

  return recommendations
}

function determineStatus({
  context,
  availableDimensions,
}: {
  context:
    EducationalContext

  availableDimensions:
    number
}): TeacherProfileStatus {
  if (
    context
      .metadata
      .status ===
    'unavailable'
  ) {
    return 'unavailable'
  }

  if (
    context
      .metadata
      .status ===
    'degraded'
  ) {
    return 'degraded'
  }

  if (
    availableDimensions ===
    0
  ) {
    return 'empty'
  }

  if (
    availableDimensions <
    4
  ) {
    return 'partial'
  }

  return 'available'
}

export function createTeacherProfileFromEducationalContext(
  context:
    EducationalContext | null,
): TeacherProfileResult {
  if (!context) {
    return {
      success:
        false,

      profile:
        null,

      errors: [
        'O contexto educacional não foi informado.',
      ],

      warnings:
        [],
    }
  }

  const sources =
    normalizeSources(
      context,
    )

  const agendaDataAvailable =
    hasAgendaData(
      context,
    )

  const evidenceDataAvailable =
    hasEvidenceData(
      context,
    )

  const executionDataAvailable =
    hasExecutionData(
      context,
    )

  const professionalDevelopmentDataAvailable =
    hasProfessionalDevelopmentData(
      context,
    )

  const governanceDataAvailable =
    context
      .metadata
      .dataQualityScore !==
      null ||
    sources.length >
      0

  const digitalMaturityScore =
    calculateDigitalMaturityScore(
      context,
    )

  const digitalMaturityDataAvailable =
    agendaDataAvailable ||
    professionalDevelopmentDataAvailable

  const governanceScore =
    context
      .metadata
      .dataQualityScore ??
    calculateSourceCoverageScore(
      sources,
    )

  const dimensions:
    TeacherProfileDimension[] = [
      createTeacherProfileDimension({
        id:
          'agenda',

        label:
          'Uso da Agenda Inteligente EDI',

        score:
          context
            .indicators
            .overallScore,

        source:
          'agenda',

        explanation:
          'Síntese dos indicadores de planejamento, objetivos, execução, evidências e organização.',

        dataAvailable:
          agendaDataAvailable,
      }),

      createTeacherProfileDimension({
        id:
          'evidence',

        label:
          'Cultura de evidências',

        score:
          context
            .indicators
            .evidenceScore,

        source:
          'agenda',

        explanation:
          'Mede a cobertura de evidências relacionadas às aulas, objetivos e práticas registradas.',

        dataAvailable:
          evidenceDataAvailable,
      }),

      createTeacherProfileDimension({
        id:
          'execution',

        label:
          'Execução pedagógica',

        score:
          context
            .indicators
            .executionScore,

        source:
          'agenda',

        explanation:
          'Representa a relação entre atividades previstas, realizadas e devidamente registradas.',

        dataAvailable:
          executionDataAvailable,
      }),

      createTeacherProfileDimension({
        id:
          'professional_development',

        label:
          'Desenvolvimento profissional',

        score:
          calculateProfessionalDevelopmentScore(
            context,
          ),

        source:
          'professional_development',

        explanation:
          'Considera planos concluídos, competências em desenvolvimento, observações e ações em atraso.',

        dataAvailable:
          professionalDevelopmentDataAvailable,
      }),

      createTeacherProfileDimension({
        id:
          'governance',

        label:
          'Qualidade e governança dos dados',

        score:
          governanceScore,

        source:
          'analytics',

        explanation:
          context
            .metadata
            .dataQualityScore !==
          null
            ? 'Utiliza o índice de qualidade dos dados calculado pelo Context Engine.'
            : 'Utiliza provisoriamente a cobertura das fontes integradas disponíveis.',

        dataAvailable:
          governanceDataAvailable,
      }),

      createTeacherProfileDimension({
        id:
          'digital_maturity',

        label:
          'Maturidade digital',

        score:
          digitalMaturityScore,

        source:
          'professor_digital',

        explanation:
          'Mede a amplitude de uso dos módulos digitais que compõem o ambiente docente.',

        dataAvailable:
          digitalMaturityDataAvailable,
      }),
    ]

  const ediScore =
    average(
      dimensions.map(
        dimension =>
          dimension.score,
      ),
    )

  const level =
    getTeacherProfileLevel(
      ediScore,
    )

  const availableDimensions =
    dimensions.filter(
      dimension =>
        dimension.dataAvailable,
    ).length

  const status =
    determineStatus({
      context,

      availableDimensions,
    })

  const warnings:
    string[] = [
      ...context
        .metadata
        .warnings,
    ]

  if (
    !agendaDataAvailable
  ) {
    warnings.push(
      'Ainda não existem dados suficientes da Agenda Inteligente EDI.',
    )
  }

  if (
    !professionalDevelopmentDataAvailable
  ) {
    warnings.push(
      'Ainda não existem dados suficientes de desenvolvimento profissional.',
    )
  }

  if (
    context
      .metadata
      .dataQualityScore ===
    null
  ) {
    warnings.push(
      'A qualidade dos dados foi estimada pela cobertura das fontes disponíveis.',
    )
  }

  const normalizedWarnings =
    uniqueStrings(
      warnings,
    )

  const profile:
    TeacherProfileSummary = {
    metadata: {
      contractVersion:
        TEACHER_PROFILE_CONTRACT_VERSION,

      generatedAt:
        new Date()
          .toISOString(),

      status,

      sources,

      dataQualityScore:
        context
          .metadata
          .dataQualityScore,

      warnings:
        normalizedWarnings,

      automatedDecisionAllowed:
        false,

      humanReviewRequired:
        status ===
          'degraded' ||
        status ===
          'unavailable' ||
        (
          context
            .metadata
            .dataQualityScore !==
            null &&
          context
            .metadata
            .dataQualityScore <
            50
        ),

      explainable:
        true,
    },

    ediScore,

    level,

    levelLabel:
      getTeacherProfileLevelLabel(
        level,
      ),

    summary:
      getTeacherProfileSummaryText(
        level,
      ),

    dimensions,

    recommendations:
      createRecommendations(
        dimensions,
      ),
  }

  return {
    success:
      true,

    profile,

    errors:
      [],

    warnings:
      normalizedWarnings,
  }
}