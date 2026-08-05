import type {
  AgendaEvidence,
} from '@/lib/agenda/repository/evidences.repository'

import type {
  AgendaEvidenceIntelligenceResult,
} from '@/lib/agenda/services/agenda-evidence-intelligence.service'

export type PedagogicalInsightSeverity =
  | 'information'
  | 'attention'
  | 'priority'
  | 'critical'

export type PedagogicalInsightCategory =
  | 'documentation'
  | 'learning_evidence'
  | 'alignment'
  | 'inclusion'
  | 'student_protagonism'
  | 'formative_assessment'
  | 'privacy'
  | 'reliability'
  | 'human_review'

export type PedagogicalInsight = {
  id:
    string

  category:
    PedagogicalInsightCategory

  severity:
    PedagogicalInsightSeverity

  title:
    string

  description:
    string

  recommendation:
    string

  evidence:
    string[]

  priority:
    number

  requiresHumanReview:
    boolean
}

export type PedagogicalDimensionScore = {
  dimension:
    'evidence'
    | 'inclusion'
    | 'intelligence'

  label:
    string

  score:
    number

  level:
    'initial'
    | 'developing'
    | 'adequate'
    | 'advanced'

  explanation:
    string

  strengths:
    string[]

  gaps:
    string[]
}

export type AgendaEvidencePedagogicalInsightsResult = {
  success:
    boolean

  agendaEvidenceId:
    string

  summary:
    string

  evidenceScore:
    number

  inclusionScore:
    number

  intelligenceScore:
    number

  overallScore:
    number

  dimensions:
    PedagogicalDimensionScore[]

  insights:
    PedagogicalInsight[]

  strengths:
    string[]

  improvementOpportunities:
    string[]

  recommendedNextActions:
    string[]

  requiresHumanReview:
    boolean

  generatedAt:
    string

  engine: {
    name:
      string

    version:
      string

    mode:
      'deterministic-rule-based'
  }

  metadata:
    Record<string, unknown>
}

const ENGINE_NAME =
  'agenda-evidence-pedagogical-insights'

const ENGINE_VERSION =
  '1.0.0'

const MINIMUM_DESCRIPTION_LENGTH =
  80

const ADEQUATE_DESCRIPTION_LENGTH =
  180

const ADVANCED_DESCRIPTION_LENGTH =
  350

const LEARNING_TERMS = [
  'aprendizagem',
  'aprendeu',
  'compreendeu',
  'desenvolveu',
  'resolveu',
  'demonstrou',
  'produziu',
  'resultado',
  'desempenho',
  'evolução',
  'avanço',
  'habilidade',
  'competência',
]

const FORMATIVE_ASSESSMENT_TERMS = [
  'avaliação formativa',
  'avaliação diagnóstica',
  'diagnóstico',
  'devolutiva',
  'feedback',
  'rubrica',
  'autoavaliação',
  'acompanhamento',
  'verificação',
  'observação',
  'intervenção',
]

const STUDENT_PROTAGONISM_TERMS = [
  'protagonismo',
  'autonomia',
  'participação',
  'colaboração',
  'investigação',
  'argumentação',
  'produção dos estudantes',
  'produção do estudante',
  'estudantes produziram',
  'alunos produziram',
  'estudantes apresentaram',
  'alunos apresentaram',
]

const INCLUSION_TERMS = [
  'inclusão',
  'acessibilidade',
  'adaptação',
  'adequação',
  'equidade',
  'necessidade específica',
  'educação especial',
  'tecnologia assistiva',
  'diferenciação',
  'apoio individualizado',
  'recurso acessível',
]

const ALIGNMENT_TERMS = [
  'objetivo',
  'habilidade',
  'competência',
  'planejamento',
  'currículo',
  'bncc',
  'sequência didática',
  'intencionalidade',
]

function nowIso(): string {
  return new Date()
    .toISOString()
}

function clampScore(
  value:
    number,
): number {
  return Math.max(
    0,
    Math.min(
      100,
      Math.round(
        value,
      ),
    ),
  )
}

function normalizeText(
  value:
    string | null | undefined,
): string {
  return (
    value ??
    ''
  )
    .trim()
    .toLowerCase()
}

function uniqueStrings(
  values:
    string[],
): string[] {
  return Array.from(
    new Set(
      values
        .map(
          value =>
            value.trim(),
        )
        .filter(
          Boolean,
        ),
    ),
  )
}

function containsAnyTerm(
  content:
    string,
  terms:
    string[],
): boolean {
  return terms.some(
    term =>
      content.includes(
        term,
      ),
  )
}

function countMatchingTerms(
  content:
    string,
  terms:
    string[],
): number {
  return terms.filter(
    term =>
      content.includes(
        term,
      ),
  ).length
}

function isRecord(
  value:
    unknown,
): value is Record<
  string,
  unknown
> {
  return (
    typeof value ===
      'object' &&
    value !==
      null &&
    !Array.isArray(
      value,
    )
  )
}

function extractNormalizedScore(
  value:
    unknown,
): number | null {
  if (
    typeof value ===
      'number' &&
    Number.isFinite(
      value,
    )
  ) {
    if (
      value >= 0 &&
      value <= 1
    ) {
      return value
    }

    if (
      value > 1 &&
      value <= 100
    ) {
      return value /
        100
    }

    return null
  }

  if (
    !isRecord(
      value,
    )
  ) {
    return null
  }

  const candidateKeys = [
    'score',
    'value',
    'normalizedScore',
    'normalizedValue',
    'confidence',
    'qualityScore',
    'reliabilityScore',
  ]

  for (
    const key
    of candidateKeys
  ) {
    const candidate =
      value[key]

    if (
      typeof candidate !==
        'number' ||
      !Number.isFinite(
        candidate,
      )
    ) {
      continue
    }

    if (
      candidate >= 0 &&
      candidate <= 1
    ) {
      return candidate
    }

    if (
      candidate > 1 &&
      candidate <= 100
    ) {
      return candidate /
        100
    }
  }

  return null
}

function resolveDimensionLevel(
  score:
    number,
): PedagogicalDimensionScore['level'] {
  if (
    score >= 85
  ) {
    return 'advanced'
  }

  if (
    score >= 65
  ) {
    return 'adequate'
  }

  if (
    score >= 40
  ) {
    return 'developing'
  }

  return 'initial'
}

function createInsight({
  id,
  category,
  severity,
  title,
  description,
  recommendation,
  evidence,
  priority,
  requiresHumanReview = false,
}: {
  id:
    string

  category:
    PedagogicalInsightCategory

  severity:
    PedagogicalInsightSeverity

  title:
    string

  description:
    string

  recommendation:
    string

  evidence:
    string[]

  priority:
    number

  requiresHumanReview?:
    boolean
}): PedagogicalInsight {
  return {
    id,

    category,

    severity,

    title,

    description,

    recommendation,

    evidence:
      uniqueStrings(
        evidence,
      ),

    priority:
      Math.max(
        1,
        Math.min(
          10,
          Math.round(
            priority,
          ),
        ),
      ),

    requiresHumanReview,
  }
}

function calculateDocumentationScore({
  evidence,
  content,
}: {
  evidence:
    AgendaEvidence

  content:
    string
}): number {
  let score =
    20

  const descriptionLength =
    evidence.description
      ?.trim()
      .length ??
    0

  if (
    evidence.title
      .trim()
      .length >=
    10
  ) {
    score +=
      10
  }

  if (
    descriptionLength >=
    MINIMUM_DESCRIPTION_LENGTH
  ) {
    score +=
      15
  }

  if (
    descriptionLength >=
    ADEQUATE_DESCRIPTION_LENGTH
  ) {
    score +=
      15
  }

  if (
    descriptionLength >=
    ADVANCED_DESCRIPTION_LENGTH
  ) {
    score +=
      10
  }

  if (
    evidence.lesson_id
  ) {
    score +=
      10
  }

  if (
    evidence.objective_id
  ) {
    score +=
      10
  }

  if (
    evidence.planning_id
  ) {
    score +=
      5
  }

  if (
    evidence.class_id
  ) {
    score +=
      5
  }

  if (
    containsAnyTerm(
      content,
      LEARNING_TERMS,
    )
  ) {
    score +=
      10
  }

  return clampScore(
    score,
  )
}

function calculateInclusionScore({
  evidence,
  content,
}: {
  evidence:
    AgendaEvidence

  content:
    string
}): number {
  let score =
    30

  const inclusionMatches =
    countMatchingTerms(
      content,
      INCLUSION_TERMS,
    )

  score +=
    Math.min(
      inclusionMatches *
        12,
      36,
    )

  if (
    !evidence
      .contains_identifiable_minor
  ) {
    score +=
      10
  }

  if (
    evidence
      .contains_identifiable_minor &&
    evidence
      .guardian_authorization_confirmed
  ) {
    score +=
      15
  }

  if (
    evidence
      .contains_identifiable_minor &&
    evidence
      .authorization_reference
  ) {
    score +=
      9
  }

  if (
    containsAnyTerm(
      content,
      STUDENT_PROTAGONISM_TERMS,
    )
  ) {
    score +=
      10
  }

  return clampScore(
    score,
  )
}

function calculateIntelligenceScore({
  evidence,
  content,
  intelligence,
}: {
  evidence:
    AgendaEvidence

  content:
    string

  intelligence:
    AgendaEvidenceIntelligenceResult
}): number {
  let score =
    20

  const qualityScore =
    extractNormalizedScore(
      intelligence.quality,
    )

  const reliabilityScore =
    extractNormalizedScore(
      intelligence.reliability,
    )

  if (
    qualityScore !==
      null
  ) {
    score +=
      qualityScore *
      25
  }

  if (
    reliabilityScore !==
      null
  ) {
    score +=
      reliabilityScore *
      25
  }

  if (
    intelligence
      .classifications
      .length >
    0
  ) {
    score +=
      Math.min(
        intelligence
          .classifications
          .length *
          5,
        15,
      )
  }

  if (
    containsAnyTerm(
      content,
      FORMATIVE_ASSESSMENT_TERMS,
    )
  ) {
    score +=
      10
  }

  if (
    containsAnyTerm(
      content,
      ALIGNMENT_TERMS,
    )
  ) {
    score +=
      10
  }

  if (
    evidence.objective_id
  ) {
    score +=
      5
  }

  if (
    intelligence
      .errors
      .length >
    0
  ) {
    score -=
      20
  }

  return clampScore(
    score,
  )
}

function createEvidenceDimension({
  score,
  strengths,
  gaps,
}: {
  score:
    number

  strengths:
    string[]

  gaps:
    string[]
}): PedagogicalDimensionScore {
  const level =
    resolveDimensionLevel(
      score,
    )

  return {
    dimension:
      'evidence',

    label:
      'Evidência',

    score,

    level,

    explanation:
      level ===
        'advanced'
        ? 'O registro apresenta documentação ampla, contextualizada e vinculada ao ciclo pedagógico.'
        : level ===
            'adequate'
          ? 'O registro apresenta elementos suficientes para apoiar a análise pedagógica.'
          : level ===
              'developing'
            ? 'O registro possui informações relevantes, mas ainda pode ser ampliado.'
            : 'O registro possui poucos elementos para comprovar a ação e a aprendizagem.',

    strengths:
      uniqueStrings(
        strengths,
      ),

    gaps:
      uniqueStrings(
        gaps,
      ),
  }
}

function createInclusionDimension({
  score,
  strengths,
  gaps,
}: {
  score:
    number

  strengths:
    string[]

  gaps:
    string[]
}): PedagogicalDimensionScore {
  const level =
    resolveDimensionLevel(
      score,
    )

  return {
    dimension:
      'inclusion',

    label:
      'Inclusão',

    score,

    level,

    explanation:
      level ===
        'advanced'
        ? 'O registro apresenta indícios consistentes de inclusão, participação e proteção.'
        : level ===
            'adequate'
          ? 'O registro apresenta cuidados de inclusão e proteção, ainda que possa detalhar melhor as estratégias.'
          : level ===
              'developing'
            ? 'Há poucos elementos que permitam avaliar equidade, acessibilidade ou diferenciação.'
            : 'Não há informações suficientes para avaliar práticas inclusivas.',

    strengths:
      uniqueStrings(
        strengths,
      ),

    gaps:
      uniqueStrings(
        gaps,
      ),
  }
}

function createIntelligenceDimension({
  score,
  strengths,
  gaps,
}: {
  score:
    number

  strengths:
    string[]

  gaps:
    string[]
}): PedagogicalDimensionScore {
  const level =
    resolveDimensionLevel(
      score,
    )

  return {
    dimension:
      'intelligence',

    label:
      'Inteligência',

    score,

    level,

    explanation:
      level ===
        'advanced'
        ? 'A evidência possui forte potencial para apoiar análise, acompanhamento e tomada de decisão.'
        : level ===
            'adequate'
          ? 'A evidência oferece informações utilizáveis para acompanhamento pedagógico.'
          : level ===
              'developing'
            ? 'A evidência pode apoiar análises iniciais, mas necessita de maior precisão e conexão com resultados.'
            : 'A evidência ainda não fornece dados suficientes para orientar decisões pedagógicas.',

    strengths:
      uniqueStrings(
        strengths,
      ),

    gaps:
      uniqueStrings(
        gaps,
      ),
  }
}

export function generateAgendaEvidencePedagogicalInsights({
  evidence,
  intelligence,
}: {
  evidence:
    AgendaEvidence

  intelligence:
    AgendaEvidenceIntelligenceResult
}): AgendaEvidencePedagogicalInsightsResult {
  const content =
    normalizeText(
      [
        evidence.title,
        evidence.description,
      ].filter(
        Boolean,
      ).join(
        ' ',
      ),
    )

  const descriptionLength =
    evidence.description
      ?.trim()
      .length ??
    0

  const hasLearningEvidence =
    containsAnyTerm(
      content,
      LEARNING_TERMS,
    )

  const hasFormativeAssessment =
    containsAnyTerm(
      content,
      FORMATIVE_ASSESSMENT_TERMS,
    )

  const hasStudentProtagonism =
    containsAnyTerm(
      content,
      STUDENT_PROTAGONISM_TERMS,
    )

  const hasInclusion =
    containsAnyTerm(
      content,
      INCLUSION_TERMS,
    )

  const hasAlignment =
    evidence.objective_id !==
      null ||
    evidence.planning_id !==
      null ||
    containsAnyTerm(
      content,
      ALIGNMENT_TERMS,
    )

  const evidenceScore =
    calculateDocumentationScore({
      evidence,
      content,
    })

  const inclusionScore =
    calculateInclusionScore({
      evidence,
      content,
    })

  const intelligenceScore =
    calculateIntelligenceScore({
      evidence,
      content,
      intelligence,
    })

  const overallScore =
    clampScore(
      evidenceScore *
        0.4 +
      inclusionScore *
        0.25 +
      intelligenceScore *
        0.35,
    )

  const insights:
    PedagogicalInsight[] = []

  const strengths:
    string[] = []

  const improvementOpportunities:
    string[] = []

  const recommendedNextActions:
    string[] = []

  const evidenceStrengths:
    string[] = []

  const evidenceGaps:
    string[] = []

  const inclusionStrengths:
    string[] = []

  const inclusionGaps:
    string[] = []

  const intelligenceStrengths:
    string[] = []

  const intelligenceGaps:
    string[] = []

  if (
    descriptionLength <
    MINIMUM_DESCRIPTION_LENGTH
  ) {
    const recommendation =
      'Amplie a descrição informando o que foi realizado, quem participou, quais resultados foram observados e como a aprendizagem foi verificada.'

    insights.push(
      createInsight({
        id:
          'documentation-description-insufficient',

        category:
          'documentation',

        severity:
          'priority',

        title:
          'Descrição pedagógica insuficiente',

        description:
          'O registro possui poucos detalhes para sustentar uma análise pedagógica consistente.',

        recommendation,

        evidence: [
          `Descrição com ${descriptionLength} caracteres.`,
        ],

        priority:
          9,
      }),
    )

    improvementOpportunities.push(
      'Ampliar a descrição da evidência.',
    )

    recommendedNextActions.push(
      recommendation,
    )

    evidenceGaps.push(
      'Descrição pouco detalhada.',
    )
  } else {
    strengths.push(
      'Descrição pedagógica registrada.',
    )

    evidenceStrengths.push(
      'Descrição com contexto suficiente.',
    )
  }

  if (
    !hasLearningEvidence
  ) {
    const recommendation =
      'Inclua evidências observáveis de aprendizagem, como respostas, produções, resoluções, evolução, desempenho ou domínio de habilidades.'

    insights.push(
      createInsight({
        id:
          'learning-evidence-not-explicit',

        category:
          'learning_evidence',

        severity:
          'priority',

        title:
          'Aprendizagem não demonstrada explicitamente',

        description:
          'O texto descreve o registro, mas não apresenta elementos claros que comprovem o que os estudantes aprenderam.',

        recommendation,

        evidence: [
          'Não foram identificados termos associados a resultados observáveis de aprendizagem.',
        ],

        priority:
          10,
      }),
    )

    improvementOpportunities.push(
      'Registrar resultados observáveis de aprendizagem.',
    )

    recommendedNextActions.push(
      recommendation,
    )

    evidenceGaps.push(
      'Resultados de aprendizagem não explicitados.',
    )

    intelligenceGaps.push(
      'Poucos dados para inferir aprendizagem.',
    )
  } else {
    strengths.push(
      'O registro apresenta indícios de aprendizagem.',
    )

    evidenceStrengths.push(
      'Há referência a resultados ou aprendizagem.',
    )

    intelligenceStrengths.push(
      'O conteúdo pode apoiar análise de aprendizagem.',
    )
  }

  if (
    !hasAlignment
  ) {
    const recommendation =
      'Vincule a evidência a uma aula, planejamento, objetivo ou habilidade para demonstrar sua intencionalidade pedagógica.'

    insights.push(
      createInsight({
        id:
          'pedagogical-alignment-missing',

        category:
          'alignment',

        severity:
          'attention',

        title:
          'Vínculo pedagógico não identificado',

        description:
          'A evidência não está claramente relacionada a um objetivo, habilidade ou planejamento.',

        recommendation,

        evidence: [
          'Nenhum objetivo ou planejamento foi vinculado.',
        ],

        priority:
          8,
      }),
    )

    improvementOpportunities.push(
      'Relacionar a evidência aos objetivos de aprendizagem.',
    )

    recommendedNextActions.push(
      recommendation,
    )

    evidenceGaps.push(
      'Ausência de vínculo explícito com objetivo ou planejamento.',
    )

    intelligenceGaps.push(
      'Baixa rastreabilidade da intencionalidade pedagógica.',
    )
  } else {
    strengths.push(
      'A evidência possui vínculo com o ciclo pedagógico.',
    )

    evidenceStrengths.push(
      'Vínculo com planejamento, aula ou objetivo.',
    )

    intelligenceStrengths.push(
      'Intencionalidade pedagógica identificável.',
    )
  }

  if (
    !hasFormativeAssessment
  ) {
    const recommendation =
      'Informe como a aprendizagem foi acompanhada: observação, devolutiva, rubrica, atividade diagnóstica, autoavaliação ou outra estratégia formativa.'

    insights.push(
      createInsight({
        id:
          'formative-assessment-not-described',

        category:
          'formative_assessment',

        severity:
          'attention',

        title:
          'Avaliação formativa não descrita',

        description:
          'Não foram identificados procedimentos de acompanhamento ou devolutiva da aprendizagem.',

        recommendation,

        evidence: [
          'Ausência de termos associados a avaliação formativa.',
        ],

        priority:
          7,
      }),
    )

    improvementOpportunities.push(
      'Descrever como a aprendizagem foi acompanhada.',
    )

    recommendedNextActions.push(
      recommendation,
    )

    intelligenceGaps.push(
      'Procedimento de avaliação não informado.',
    )
  } else {
    strengths.push(
      'Há indícios de acompanhamento formativo.',
    )

    intelligenceStrengths.push(
      'Estratégia de avaliação formativa identificada.',
    )
  }

  if (
    !hasStudentProtagonism
  ) {
    const recommendation =
      'Registre como os estudantes participaram, produziram, investigaram, argumentaram ou tomaram decisões durante a atividade.'

    insights.push(
      createInsight({
        id:
          'student-protagonism-not-evidenced',

        category:
          'student_protagonism',

        severity:
          'information',

        title:
          'Protagonismo estudantil pouco visível',

        description:
          'O registro não detalha o papel desempenhado pelos estudantes.',

        recommendation,

        evidence: [
          'Não foram identificados elementos de autonomia, participação ou produção estudantil.',
        ],

        priority:
          5,
      }),
    )

    improvementOpportunities.push(
      'Explicitar a participação e o protagonismo dos estudantes.',
    )

    intelligenceGaps.push(
      'Participação estudantil não detalhada.',
    )
  } else {
    strengths.push(
      'O registro apresenta participação ou protagonismo estudantil.',
    )

    inclusionStrengths.push(
      'Participação dos estudantes identificada.',
    )
  }

  if (
    !hasInclusion
  ) {
    const recommendation =
      'Informe se houve adaptações, recursos acessíveis, diferenciação, apoio individualizado ou estratégias para garantir participação equitativa.'

    insights.push(
      createInsight({
        id:
          'inclusion-not-described',

        category:
          'inclusion',

        severity:
          'attention',

        title:
          'Práticas inclusivas não descritas',

        description:
          'A evidência não fornece informações suficientes para avaliar inclusão, acessibilidade ou equidade.',

        recommendation,

        evidence: [
          'Não foram identificadas estratégias inclusivas no texto.',
        ],

        priority:
          6,
      }),
    )

    improvementOpportunities.push(
      'Descrever estratégias inclusivas e adaptações realizadas.',
    )

    inclusionGaps.push(
      'Estratégias de inclusão não informadas.',
    )
  } else {
    strengths.push(
      'Há referência a práticas inclusivas ou de acessibilidade.',
    )

    inclusionStrengths.push(
      'Estratégia inclusiva identificada.',
    )
  }

  if (
    evidence
      .contains_identifiable_minor
  ) {
    if (
      evidence
        .guardian_authorization_confirmed &&
      evidence
        .authorization_reference
    ) {
      strengths.push(
        'Proteção de menores e autorização registradas.',
      )

      inclusionStrengths.push(
        'Governança de proteção de menores atendida.',
      )
    } else {
      const recommendation =
        'Interrompa o uso da evidência até confirmar e registrar a autorização vigente do responsável legal.'

      insights.push(
        createInsight({
          id:
            'minor-authorization-incomplete',

          category:
            'privacy',

          severity:
            'critical',

          title:
            'Autorização de menor incompleta',

          description:
            'A evidência contém menor identificável, mas a confirmação ou referência da autorização não está completa.',

          recommendation,

          evidence: [
            'Menor identificável registrado.',
            'Autorização ou referência incompleta.',
          ],

          priority:
            10,

          requiresHumanReview:
            true,
        }),
      )

      recommendedNextActions.unshift(
        recommendation,
      )

      inclusionGaps.push(
        'Governança de autorização incompleta.',
      )
    }
  }

  if (
    intelligence
      .requiresHumanReview
  ) {
    insights.push(
      createInsight({
        id:
          'intelligence-human-review-required',

        category:
          'human_review',

        severity:
          'priority',

        title:
          'Revisão profissional necessária',

        description:
          'O Evidence Intelligence determinou que o resultado não deve ser tratado automaticamente.',

        recommendation:
          'Revise o registro, valide suas classificações e confirme as conclusões antes de utilizá-lo em uma decisão pedagógica.',

        evidence: [
          `Status do processamento: ${intelligence.status}.`,
        ],

        priority:
          10,

        requiresHumanReview:
          true,
      }),
    )

    recommendedNextActions.unshift(
      'Realizar revisão humana antes de utilizar o resultado para tomada de decisão.',
    )
  }

  if (
    intelligence
      .errors
      .length >
    0
  ) {
    insights.push(
      createInsight({
        id:
          'intelligence-processing-errors',

        category:
          'reliability',

        severity:
          'critical',

        title:
          'Falhas no processamento inteligente',

        description:
          'O motor registrou erros que reduzem a confiabilidade da análise.',

        recommendation:
          'Revise os erros, corrija o registro quando necessário e execute um novo processamento.',

        evidence:
          intelligence.errors,

        priority:
          10,

        requiresHumanReview:
          true,
      }),
    )

    intelligenceGaps.push(
      'Erros registrados durante o processamento.',
    )
  }

  if (
    intelligence
      .warnings
      .length >
    0
  ) {
    insights.push(
      createInsight({
        id:
          'intelligence-processing-warnings',

        category:
          'reliability',

        severity:
          'attention',

        title:
          'Pontos de atenção do processamento',

        description:
          'O motor identificou condições que devem ser consideradas na interpretação do resultado.',

        recommendation:
          'Leia os avisos e confirme se o registro possui informações suficientes antes de utilizá-lo.',

        evidence:
          intelligence.warnings,

        priority:
          7,

        requiresHumanReview:
          intelligence
            .requiresHumanReview,
      }),
    )
  }

  if (
    evidenceScore >=
      65
  ) {
    strengths.push(
      'Qualidade documental adequada.',
    )
  }

  if (
    inclusionScore >=
      65
  ) {
    strengths.push(
      'Indicadores de inclusão e proteção em nível adequado.',
    )
  }

  if (
    intelligenceScore >=
      65
  ) {
    strengths.push(
      'Potencial adequado para apoiar análise pedagógica.',
    )
  }

  const dimensions:
    PedagogicalDimensionScore[] = [
      createEvidenceDimension({
        score:
          evidenceScore,

        strengths:
          evidenceStrengths,

        gaps:
          evidenceGaps,
      }),

      createInclusionDimension({
        score:
          inclusionScore,

        strengths:
          inclusionStrengths,

        gaps:
          inclusionGaps,
      }),

      createIntelligenceDimension({
        score:
          intelligenceScore,

        strengths:
          intelligenceStrengths,

        gaps:
          intelligenceGaps,
      }),
    ]

  const orderedInsights =
    [...insights].sort(
      (
        first,
        second,
      ) =>
        second.priority -
        first.priority,
    )

  const requiresHumanReview =
    intelligence
      .requiresHumanReview ||
    orderedInsights.some(
      insight =>
        insight
          .requiresHumanReview,
    )

  const summary =
    overallScore >=
      85
      ? 'A evidência apresenta alto potencial documental e analítico, com poucos ajustes necessários.'
      : overallScore >=
          65
        ? 'A evidência apresenta qualidade adequada, mas ainda possui oportunidades de aprimoramento.'
        : overallScore >=
            40
          ? 'A evidência possui elementos relevantes, porém necessita de complementação para apoiar decisões pedagógicas.'
          : 'A evidência possui informações insuficientes e deve ser ampliada antes de ser utilizada em análises pedagógicas.'

  return {
    success:
      intelligence.success,

    agendaEvidenceId:
      evidence.id,

    summary,

    evidenceScore,

    inclusionScore,

    intelligenceScore,

    overallScore,

    dimensions,

    insights:
      orderedInsights,

    strengths:
      uniqueStrings(
        strengths,
      ),

    improvementOpportunities:
      uniqueStrings(
        improvementOpportunities,
      ),

    recommendedNextActions:
      uniqueStrings(
        recommendedNextActions,
      ),

    requiresHumanReview,

    generatedAt:
      nowIso(),

    engine: {
      name:
        ENGINE_NAME,

      version:
        ENGINE_VERSION,

      mode:
        'deterministic-rule-based',
    },

    metadata: {
      agendaEvidenceType:
        evidence.evidence_type,

      descriptionLength,

      hasLearningEvidence,

      hasFormativeAssessment,

      hasStudentProtagonism,

      hasInclusion,

      hasAlignment,

      intelligenceStatus:
        intelligence.status,

      intelligenceClassificationCount:
        intelligence
          .classifications
          .length,

      intelligenceWarningCount:
        intelligence
          .warnings
          .length,

      intelligenceErrorCount:
        intelligence
          .errors
          .length,
    },
  }
}

export const agendaEvidencePedagogicalInsightsService = {
  generate:
    generateAgendaEvidencePedagogicalInsights,
}