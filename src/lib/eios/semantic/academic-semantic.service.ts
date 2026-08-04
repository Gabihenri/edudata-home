import {
  clampAcademicSemanticConfidence,
  normalizeAcademicSemanticTerm,
  type AcademicSemanticAlias,
  type AcademicSemanticAliasContext,
  type AcademicSemanticContext,
  type AcademicSemanticDomain,
  type AcademicSemanticEntityDefinition,
  type AcademicSemanticEntityType,
  type AcademicSemanticLanguageCode,
  type AcademicSemanticResolutionCandidate,
  type AcademicSemanticResolutionInput,
  type AcademicSemanticResolutionResult,
  type AcademicSemanticTranslationRule,
} from './academic-semantic.contract'

type CandidateAccumulator = {
  candidate:
    AcademicSemanticResolutionCandidate

  score:
    number
}

type SemanticServiceOptions = {
  context?:
    AcademicSemanticContext | null

  aliases?:
    AcademicSemanticAlias[]

  translationRules?:
    AcademicSemanticTranslationRule[]

  entityDefinitions?:
    AcademicSemanticEntityDefinition[]
}

const DEFAULT_LANGUAGE:
  AcademicSemanticLanguageCode =
    'pt-BR'

const RESOLUTION_THRESHOLD =
  0.68

const AMBIGUITY_DISTANCE =
  0.08

const MAX_CANDIDATES =
  8

const DOMAIN_BY_ENTITY:
  Record<
    AcademicSemanticEntityType,
    AcademicSemanticDomain
  > = {
    ORGANIZATION:
      'organization',

    INSTITUTION:
      'organization',

    CAMPUS:
      'academic_structure',

    ACADEMIC_UNIT:
      'academic_structure',

    PROGRAM:
      'academic_structure',

    CURRICULUM_MATRIX:
      'curriculum',

    ACADEMIC_COMPONENT:
      'academic_structure',

    ACADEMIC_PERIOD:
      'academic_structure',

    ACADEMIC_OFFERING:
      'academic_structure',

    LEARNING_GROUP:
      'academic_structure',

    PERSON:
      'people',

    LEARNER:
      'people',

    EDUCATOR:
      'people',

    MANAGER:
      'people',

    ACADEMIC_ROLE:
      'people',

    ENROLLMENT:
      'academic_structure',

    LEARNING_EXPERIENCE:
      'learning',

    LEARNING_OUTCOME:
      'curriculum',

    COMPETENCY:
      'curriculum',

    SKILL:
      'curriculum',

    KNOWLEDGE_OBJECT:
      'curriculum',

    ASSESSMENT:
      'assessment',

    ASSESSMENT_ITEM:
      'assessment',

    ASSESSMENT_RESULT:
      'assessment',

    ATTENDANCE_RECORD:
      'learning',

    LEARNING_ARTIFACT:
      'evidence',

    LEARNING_EVIDENCE:
      'evidence',

    INTERVENTION:
      'learning',

    ACADEMIC_EVENT:
      'learning',

    PERFORMANCE_SNAPSHOT:
      'analytics',

    EVOLUTION_INDICATOR:
      'analytics',

    RECOMMENDATION:
      'decision',

    DECISION:
      'decision',

    AUDIT_EVENT:
      'governance',
  }

const CANONICAL_NAMES:
  Record<
    AcademicSemanticEntityType,
    string
  > = {
    ORGANIZATION:
      'Organização',

    INSTITUTION:
      'Instituição de ensino',

    CAMPUS:
      'Campus',

    ACADEMIC_UNIT:
      'Unidade acadêmica',

    PROGRAM:
      'Programa educacional',

    CURRICULUM_MATRIX:
      'Matriz curricular',

    ACADEMIC_COMPONENT:
      'Componente acadêmico',

    ACADEMIC_PERIOD:
      'Período acadêmico',

    ACADEMIC_OFFERING:
      'Oferta acadêmica',

    LEARNING_GROUP:
      'Grupo de aprendizagem',

    PERSON:
      'Pessoa',

    LEARNER:
      'Estudante',

    EDUCATOR:
      'Educador',

    MANAGER:
      'Gestor',

    ACADEMIC_ROLE:
      'Papel acadêmico',

    ENROLLMENT:
      'Vínculo acadêmico',

    LEARNING_EXPERIENCE:
      'Experiência de aprendizagem',

    LEARNING_OUTCOME:
      'Resultado de aprendizagem',

    COMPETENCY:
      'Competência',

    SKILL:
      'Habilidade',

    KNOWLEDGE_OBJECT:
      'Objeto de conhecimento',

    ASSESSMENT:
      'Avaliação',

    ASSESSMENT_ITEM:
      'Item de avaliação',

    ASSESSMENT_RESULT:
      'Resultado de avaliação',

    ATTENDANCE_RECORD:
      'Registro de frequência',

    LEARNING_ARTIFACT:
      'Artefato de aprendizagem',

    LEARNING_EVIDENCE:
      'Evidência de aprendizagem',

    INTERVENTION:
      'Intervenção pedagógica',

    ACADEMIC_EVENT:
      'Evento acadêmico',

    PERFORMANCE_SNAPSHOT:
      'Snapshot de desempenho',

    EVOLUTION_INDICATOR:
      'Indicador de evolução',

    RECOMMENDATION:
      'Recomendação',

    DECISION:
      'Decisão',

    AUDIT_EVENT:
      'Evento de auditoria',
  }

const DEFAULT_ALIASES:
  Record<
    AcademicSemanticEntityType,
    string[]
  > = {
    ORGANIZATION: [
      'organização',
      'rede',
      'grupo educacional',
      'mantenedora',
      'education network',
      'organization',
    ],

    INSTITUTION: [
      'instituição',
      'instituição de ensino',
      'escola',
      'universidade',
      'faculdade',
      'instituto',
      'centro universitário',
      'school',
      'university',
      'college',
      'institution',
    ],

    CAMPUS: [
      'campus',
      'polo',
      'unidade física',
      'campi',
    ],

    ACADEMIC_UNIT: [
      'unidade acadêmica',
      'faculdade',
      'departamento',
      'instituto',
      'coordenação',
      'school unit',
      'academic unit',
      'department',
    ],

    PROGRAM: [
      'programa',
      'curso',
      'graduação',
      'programa de formação',
      'trilha',
      'course program',
      'degree program',
      'program',
    ],

    CURRICULUM_MATRIX: [
      'matriz curricular',
      'grade curricular',
      'currículo',
      'estrutura curricular',
      'curriculum',
      'curriculum matrix',
      'curriculum framework',
    ],

    ACADEMIC_COMPONENT: [
      'componente curricular',
      'disciplina',
      'unidade curricular',
      'matéria',
      'módulo',
      'subject',
      'course',
      'module',
      'academic component',
    ],

    ACADEMIC_PERIOD: [
      'período',
      'período letivo',
      'ano letivo',
      'semestre',
      'bimestre',
      'trimestre',
      'quadrimestre',
      'módulo letivo',
      'academic period',
      'term',
      'semester',
    ],

    ACADEMIC_OFFERING: [
      'oferta',
      'oferta acadêmica',
      'disciplina ofertada',
      'componente ofertado',
      'course offering',
      'class offering',
    ],

    LEARNING_GROUP: [
      'turma',
      'classe',
      'coorte',
      'grupo',
      'sala',
      'section',
      'cohort',
      'class group',
      'learning group',
    ],

    PERSON: [
      'pessoa',
      'usuário',
      'participante',
      'person',
      'user',
    ],

    LEARNER: [
      'estudante',
      'aluno',
      'discente',
      'aprendiz',
      'participante',
      'student',
      'learner',
      'pupil',
    ],

    EDUCATOR: [
      'professor',
      'docente',
      'educador',
      'instrutor',
      'tutor',
      'facilitador',
      'teacher',
      'professor',
      'educator',
      'instructor',
    ],

    MANAGER: [
      'gestor',
      'diretor',
      'coordenador',
      'supervisor',
      'administrador',
      'manager',
      'director',
      'coordinator',
      'administrator',
    ],

    ACADEMIC_ROLE: [
      'perfil',
      'papel',
      'função acadêmica',
      'cargo',
      'role',
      'academic role',
    ],

    ENROLLMENT: [
      'matrícula',
      'vínculo',
      'inscrição',
      'enturmação',
      'enrollment',
      'registration',
    ],

    LEARNING_EXPERIENCE: [
      'aula',
      'encontro',
      'atividade acadêmica',
      'experiência de aprendizagem',
      'laboratório',
      'oficina',
      'seminário',
      'estágio',
      'workshop',
      'lesson',
      'lecture',
      'learning experience',
    ],

    LEARNING_OUTCOME: [
      'resultado de aprendizagem',
      'objetivo de aprendizagem',
      'expectativa de aprendizagem',
      'learning outcome',
      'learning objective',
      'course outcome',
    ],

    COMPETENCY: [
      'competência',
      'competência geral',
      'competência específica',
      'competency',
      'competence',
    ],

    SKILL: [
      'habilidade',
      'descritor',
      'capacidade',
      'skill',
      'ability',
    ],

    KNOWLEDGE_OBJECT: [
      'objeto de conhecimento',
      'conteúdo',
      'unidade temática',
      'tópico',
      'knowledge object',
      'content topic',
    ],

    ASSESSMENT: [
      'avaliação',
      'prova',
      'trabalho',
      'atividade avaliativa',
      'exame',
      'assessment',
      'exam',
      'test',
      'assignment',
    ],

    ASSESSMENT_ITEM: [
      'questão',
      'item',
      'item avaliativo',
      'pergunta',
      'assessment item',
      'question',
    ],

    ASSESSMENT_RESULT: [
      'nota',
      'resultado',
      'conceito',
      'menção',
      'desempenho na avaliação',
      'grade',
      'score',
      'assessment result',
    ],

    ATTENDANCE_RECORD: [
      'frequência',
      'presença',
      'falta',
      'chamada',
      'attendance',
      'presence',
      'absence',
    ],

    LEARNING_ARTIFACT: [
      'artefato',
      'produção',
      'trabalho produzido',
      'arquivo',
      'documento',
      'portfólio',
      'learning artifact',
      'student work',
    ],

    LEARNING_EVIDENCE: [
      'evidência',
      'evidência de aprendizagem',
      'registro pedagógico',
      'prova de aprendizagem',
      'learning evidence',
      'evidence',
    ],

    INTERVENTION: [
      'intervenção',
      'recuperação',
      'recomposição',
      'apoio',
      'tutoria',
      'ação pedagógica',
      'intervention',
      'recovery action',
      'learning support',
    ],

    ACADEMIC_EVENT: [
      'evento',
      'ocorrência',
      'acontecimento acadêmico',
      'academic event',
      'event',
    ],

    PERFORMANCE_SNAPSHOT: [
      'snapshot',
      'retrato de desempenho',
      'estado do desempenho',
      'performance snapshot',
    ],

    EVOLUTION_INDICATOR: [
      'indicador',
      'indicador de evolução',
      'crescimento',
      'progressão',
      'evolution indicator',
      'growth indicator',
    ],

    RECOMMENDATION: [
      'recomendação',
      'sugestão',
      'orientação',
      'recommendation',
      'suggestion',
    ],

    DECISION: [
      'decisão',
      'tomada de decisão',
      'deliberação',
      'decision',
    ],

    AUDIT_EVENT: [
      'auditoria',
      'histórico de alteração',
      'registro de alteração',
      'audit event',
      'change log',
    ],
  }

const BASIC_EDUCATION_HINTS =
  new Set([
    'early_childhood',
    'elementary',
    'secondary',
  ])

const HIGHER_EDUCATION_HINTS =
  new Set([
    'undergraduate',
    'graduate',
    'extension',
  ])

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

function normalizeLanguage(
  language:
    AcademicSemanticLanguageCode | undefined,
): AcademicSemanticLanguageCode {
  return (
    language ??
    DEFAULT_LANGUAGE
  )
}

function resolveAliasContext(
  input:
    AcademicSemanticResolutionInput,
): AcademicSemanticAliasContext {
  const educationLevel =
    input
      .programContext
      ?.educationLevel

  if (
    educationLevel &&
    BASIC_EDUCATION_HINTS.has(
      educationLevel,
    )
  ) {
    return 'basic_education'
  }

  if (
    educationLevel &&
    HIGHER_EDUCATION_HINTS.has(
      educationLevel,
    )
  ) {
    return 'higher_education'
  }

  if (
    educationLevel ===
    'technical'
  ) {
    return 'technical_education'
  }

  if (
    educationLevel ===
    'vocational'
  ) {
    return 'vocational_education'
  }

  if (
    educationLevel ===
    'corporate'
  ) {
    return 'corporate_learning'
  }

  return 'generic'
}

function levenshteinDistance(
  left:
    string,

  right:
    string,
): number {
  const rows =
    left.length +
    1

  const columns =
    right.length +
    1

  const matrix:
    number[][] =
      Array.from(
        {
          length:
            rows,
        },
        () =>
          Array<number>(
            columns,
          ).fill(
            0,
          ),
      )

  for (
    let row =
      0;
    row <
    rows;
    row +=
      1
  ) {
    matrix[row][0] =
      row
  }

  for (
    let column =
      0;
    column <
    columns;
    column +=
      1
  ) {
    matrix[0][column] =
      column
  }

  for (
    let row =
      1;
    row <
    rows;
    row +=
      1
  ) {
    for (
      let column =
        1;
      column <
      columns;
      column +=
        1
    ) {
      const substitutionCost =
        left[
          row -
            1
        ] ===
        right[
          column -
            1
        ]
          ? 0
          : 1

      matrix[row][column] =
        Math.min(
          matrix[
            row -
              1
          ][column] +
            1,

          matrix[row][
            column -
              1
          ] +
            1,

          matrix[
            row -
              1
          ][
            column -
              1
          ] +
            substitutionCost,
        )
    }
  }

  return matrix[
    rows -
      1
  ][
    columns -
      1
  ]
}

function calculateSimilarity(
  left:
    string,

  right:
    string,
): number {
  if (
    left ===
    right
  ) {
    return 1
  }

  const maximumLength =
    Math.max(
      left.length,
      right.length,
    )

  if (
    maximumLength ===
    0
  ) {
    return 1
  }

  const distance =
    levenshteinDistance(
      left,
      right,
    )

  return clampAcademicSemanticConfidence(
    1 -
      distance /
        maximumLength,
  )
}

function isEntityAllowed(
  entityType:
    AcademicSemanticEntityType,

  input:
    AcademicSemanticResolutionInput,
): boolean {
  if (
    input
      .expectedEntityTypes &&
    input
      .expectedEntityTypes
      .length >
      0 &&
    !input
      .expectedEntityTypes
      .includes(
        entityType,
      )
  ) {
    return false
  }

  if (
    input
      .expectedDomain &&
    DOMAIN_BY_ENTITY[
      entityType
    ] !==
      input
        .expectedDomain
  ) {
    return false
  }

  return true
}

function createCandidate({
  entityType,
  matchedTerm,
  matchType,
  confidence,
  explanation,
}: {
  entityType:
    AcademicSemanticEntityType

  matchedTerm:
    string

  matchType:
    AcademicSemanticResolutionCandidate['matchType']

  confidence:
    number

  explanation:
    string
}): AcademicSemanticResolutionCandidate {
  return {
    semanticEntityType:
      entityType,

    canonicalName:
      CANONICAL_NAMES[
        entityType
      ],

    matchedTerm,

    matchType,

    confidence:
      clampAcademicSemanticConfidence(
        confidence,
      ),

    explanation,
  }
}

function mergeCandidate(
  accumulator:
    Map<
      AcademicSemanticEntityType,
      CandidateAccumulator
    >,

  candidate:
    AcademicSemanticResolutionCandidate,
): void {
  const current =
    accumulator.get(
      candidate
        .semanticEntityType,
    )

  if (
    !current ||
    candidate.confidence >
      current.score
  ) {
    accumulator.set(
      candidate
        .semanticEntityType,
      {
        candidate,

        score:
          candidate.confidence,
      },
    )
  }
}

function getEntityDefinitions(
  options:
    SemanticServiceOptions,
): AcademicSemanticEntityDefinition[] {
  return (
    options
      .entityDefinitions ??
    options
      .context
      ?.entityDefinitions ??
    []
  ).filter(
    definition =>
      definition.status ===
        'active' ||
      definition.status ===
        'draft',
  )
}

function getAliases(
  options:
    SemanticServiceOptions,
): AcademicSemanticAlias[] {
  return (
    options.aliases ??
    options
      .context
      ?.aliases ??
    []
  ).filter(
    alias =>
      alias.active,
  )
}

function getTranslationRules(
  options:
    SemanticServiceOptions,
): AcademicSemanticTranslationRule[] {
  return (
    options
      .translationRules ??
    options
      .context
      ?.translationRules ??
    []
  ).filter(
    rule =>
      rule.active,
  )
}

function matchesOrganizationContext(
  alias:
    AcademicSemanticAlias,

  input:
    AcademicSemanticResolutionInput,
): boolean {
  const inputOrganizationId =
    input
      .organizationContext
      ?.organizationId ??
    null

  const inputInstitutionId =
    input
      .organizationContext
      ?.institutionId ??
    null

  if (
    alias.organizationId &&
    alias.organizationId !==
      inputOrganizationId
  ) {
    return false
  }

  if (
    alias.institutionId &&
    alias.institutionId !==
      inputInstitutionId
  ) {
    return false
  }

  return true
}

function matchesTranslationContext(
  rule:
    AcademicSemanticTranslationRule,

  input:
    AcademicSemanticResolutionInput,
): boolean {
  const inputOrganizationId =
    input
      .organizationContext
      ?.organizationId ??
    null

  const inputInstitutionId =
    input
      .organizationContext
      ?.institutionId ??
    null

  const inputEducationLevel =
    input
      .programContext
      ?.educationLevel ??
    null

  if (
    rule.organizationId &&
    rule.organizationId !==
      inputOrganizationId
  ) {
    return false
  }

  if (
    rule.institutionId &&
    rule.institutionId !==
      inputInstitutionId
  ) {
    return false
  }

  if (
    rule.educationLevel &&
    rule.educationLevel !==
      inputEducationLevel
  ) {
    return false
  }

  return true
}

function resolveCanonicalCandidates(
  input:
    AcademicSemanticResolutionInput,

  normalizedTerm:
    string,

  definitions:
    AcademicSemanticEntityDefinition[],

  accumulator:
    Map<
      AcademicSemanticEntityType,
      CandidateAccumulator
    >,
): void {
  const entityTypes =
    Object.keys(
      CANONICAL_NAMES,
    ) as
      AcademicSemanticEntityType[]

  for (
    const entityType
    of entityTypes
  ) {
    if (
      !isEntityAllowed(
        entityType,
        input,
      )
    ) {
      continue
    }

    const canonicalName =
      CANONICAL_NAMES[
        entityType
      ]

    const normalizedCanonicalName =
      normalizeAcademicSemanticTerm(
        canonicalName,
      )

    if (
      normalizedTerm ===
      normalizedCanonicalName
    ) {
      mergeCandidate(
        accumulator,
        createCandidate({
          entityType,

          matchedTerm:
            canonicalName,

          matchType:
            'canonical',

          confidence:
            1,

          explanation:
            'O termo corresponde exatamente ao nome canônico da entidade.',
        }),
      )

      continue
    }

    const similarity =
      calculateSimilarity(
        normalizedTerm,
        normalizedCanonicalName,
      )

    if (
      similarity >=
      0.76
    ) {
      mergeCandidate(
        accumulator,
        createCandidate({
          entityType,

          matchedTerm:
            canonicalName,

          matchType:
            'inferred',

          confidence:
            similarity *
            0.88,

          explanation:
            'O termo possui alta similaridade textual com o nome canônico.',
        }),
      )
    }
  }

  for (
    const definition
    of definitions
  ) {
    if (
      !isEntityAllowed(
        definition.id,
        input,
      )
    ) {
      continue
    }

    const terms = [
      definition
        .canonicalName,

      ...definition
        .aliases,

      ...definition
        .labels
        .flatMap(
          label => [
            label.singular,
            label.plural,
            label.shortLabel ??
              '',
          ],
        ),
    ]

    for (
      const term
      of uniqueStrings(
        terms,
      )
    ) {
      const normalizedDefinitionTerm =
        normalizeAcademicSemanticTerm(
          term,
        )

      if (
        normalizedDefinitionTerm ===
        normalizedTerm
      ) {
        mergeCandidate(
          accumulator,
          createCandidate({
            entityType:
              definition.id,

            matchedTerm:
              term,

            matchType:
              term ===
              definition
                .canonicalName
                ? 'canonical'
                : 'alias',

            confidence:
              term ===
              definition
                .canonicalName
                ? 1
                : 0.96,

            explanation:
              term ===
              definition
                .canonicalName
                ? 'O termo corresponde ao nome canônico registrado no contexto semântico.'
                : 'O termo corresponde a um alias registrado na definição da entidade.',
          }),
        )
      }
    }
  }
}

function resolveDefaultAliasCandidates(
  input:
    AcademicSemanticResolutionInput,

  normalizedTerm:
    string,

  accumulator:
    Map<
      AcademicSemanticEntityType,
      CandidateAccumulator
    >,
): void {
  const entries =
    Object.entries(
      DEFAULT_ALIASES,
    ) as Array<
      [
        AcademicSemanticEntityType,
        string[],
      ]
    >

  for (
    const [
      entityType,
      aliases,
    ]
    of entries
  ) {
    if (
      !isEntityAllowed(
        entityType,
        input,
      )
    ) {
      continue
    }

    for (
      const alias
      of aliases
    ) {
      const normalizedAlias =
        normalizeAcademicSemanticTerm(
          alias,
        )

      if (
        normalizedAlias ===
        normalizedTerm
      ) {
        mergeCandidate(
          accumulator,
          createCandidate({
            entityType,

            matchedTerm:
              alias,

            matchType:
              'alias',

            confidence:
              0.94,

            explanation:
              'O termo corresponde a um alias padrão do vocabulário acadêmico do EIOS.',
          }),
        )

        continue
      }

      const similarity =
        calculateSimilarity(
          normalizedTerm,
          normalizedAlias,
        )

      if (
        similarity >=
        0.84
      ) {
        mergeCandidate(
          accumulator,
          createCandidate({
            entityType,

            matchedTerm:
              alias,

            matchType:
              'inferred',

            confidence:
              similarity *
              0.86,

            explanation:
              'O termo apresenta alta similaridade com um alias padrão do EIOS.',
          }),
        )
      }
    }
  }
}

function resolveCustomAliasCandidates(
  input:
    AcademicSemanticResolutionInput,

  normalizedTerm:
    string,

  language:
    AcademicSemanticLanguageCode,

  aliases:
    AcademicSemanticAlias[],

  accumulator:
    Map<
      AcademicSemanticEntityType,
      CandidateAccumulator
    >,
): void {
  const aliasContext =
    resolveAliasContext(
      input,
    )

  for (
    const alias
    of aliases
  ) {
    if (
      !isEntityAllowed(
        alias
          .semanticEntityType,
        input,
      ) ||
      !matchesOrganizationContext(
        alias,
        input,
      )
    ) {
      continue
    }

    if (
      alias.language !==
        language &&
      alias.language !==
        DEFAULT_LANGUAGE
    ) {
      continue
    }

    if (
      alias.context !==
        'generic' &&
      alias.context !==
        aliasContext
    ) {
      continue
    }

    const normalizedAlias =
      alias.normalizedTerm ||
      normalizeAcademicSemanticTerm(
        alias.term,
      )

    if (
      normalizedAlias !==
      normalizedTerm
    ) {
      continue
    }

    const institutional =
      Boolean(
        alias.organizationId ||
        alias.institutionId,
      )

    const confidence =
      alias.preferred
        ? institutional
          ? 1
          : 0.98
        : institutional
          ? 0.96
          : 0.93

    mergeCandidate(
      accumulator,
      createCandidate({
        entityType:
          alias
            .semanticEntityType,

        matchedTerm:
          alias.term,

        matchType:
          institutional
            ? 'institutional'
            : alias
                .vocabularyType ===
              'integration'
              ? 'integration'
              : 'alias',

        confidence,

        explanation:
          institutional
            ? 'O termo corresponde ao vocabulário configurado para a organização ou instituição.'
            : 'O termo corresponde a um alias ativo do contexto semântico.',
      }),
    )
  }
}

function resolveTranslationCandidates(
  input:
    AcademicSemanticResolutionInput,

  normalizedTerm:
    string,

  language:
    AcademicSemanticLanguageCode,

  rules:
    AcademicSemanticTranslationRule[],

  accumulator:
    Map<
      AcademicSemanticEntityType,
      CandidateAccumulator
    >,
): void {
  for (
    const rule
    of rules
  ) {
    if (
      !isEntityAllowed(
        rule
          .semanticEntityType,
        input,
      ) ||
      !matchesTranslationContext(
        rule,
        input,
      )
    ) {
      continue
    }

    if (
      rule.language !==
        language &&
      rule.language !==
        DEFAULT_LANGUAGE
    ) {
      continue
    }

    const terms = [
      rule
        .preferredSingular,

      rule
        .preferredPlural,

      rule
        .fallbackSingular,

      rule
        .fallbackPlural,
    ]

    const matchedTerm =
      terms.find(
        term =>
          normalizeAcademicSemanticTerm(
            term,
          ) ===
          normalizedTerm,
      )

    if (
      !matchedTerm
    ) {
      continue
    }

    const contextual =
      Boolean(
        rule.organizationId ||
        rule.institutionId ||
        rule.educationLevel,
      )

    const normalizedPriority =
      Math.min(
        20,
        Math.max(
          0,
          rule.priority,
        ),
      )

    const confidence =
      Math.min(
        1,
        (
          contextual
            ? 0.95
            : 0.9
        ) +
          normalizedPriority *
            0.002,
      )

    mergeCandidate(
      accumulator,
      createCandidate({
        entityType:
          rule
            .semanticEntityType,

        matchedTerm,

        matchType:
          contextual
            ? 'institutional'
            : 'translation',

        confidence,

        explanation:
          contextual
            ? 'O termo corresponde à tradução preferencial configurada para o contexto acadêmico atual.'
            : 'O termo corresponde a uma regra ativa de tradução semântica.',
      }),
    )
  }
}

function applyContextBonuses({
  candidates,
  input,
}: {
  candidates:
    AcademicSemanticResolutionCandidate[]

  input:
    AcademicSemanticResolutionInput
}): AcademicSemanticResolutionCandidate[] {
  const aliasContext =
    resolveAliasContext(
      input,
    )

  return candidates.map(
    candidate => {
      let bonus =
        0

      if (
        input
          .expectedDomain &&
        DOMAIN_BY_ENTITY[
          candidate
            .semanticEntityType
        ] ===
          input
            .expectedDomain
      ) {
        bonus +=
          0.04
      }

      if (
        input
          .expectedEntityTypes
          ?.includes(
            candidate
              .semanticEntityType,
          )
      ) {
        bonus +=
          0.05
      }

      if (
        aliasContext ===
          'basic_education' &&
        candidate
          .semanticEntityType ===
          'LEARNING_GROUP'
      ) {
        bonus +=
          0.01
      }

      if (
        aliasContext ===
          'higher_education' &&
        (
          candidate
            .semanticEntityType ===
            'PROGRAM' ||
          candidate
            .semanticEntityType ===
            'ACADEMIC_COMPONENT' ||
          candidate
            .semanticEntityType ===
            'ACADEMIC_OFFERING'
        )
      ) {
        bonus +=
          0.01
      }

      return {
        ...candidate,

        confidence:
          clampAcademicSemanticConfidence(
            candidate.confidence +
              bonus,
          ),
      }
    },
  )
}

function sortCandidates(
  candidates:
    AcademicSemanticResolutionCandidate[],
): AcademicSemanticResolutionCandidate[] {
  return [
    ...candidates,
  ].sort(
    (
      left,
      right,
    ) => {
      if (
        right.confidence !==
        left.confidence
      ) {
        return (
          right.confidence -
          left.confidence
        )
      }

      return left
        .canonicalName
        .localeCompare(
          right
            .canonicalName,
          'pt-BR',
        )
    },
  )
}

function determineHumanReview(
  candidates:
    AcademicSemanticResolutionCandidate[],
): boolean {
  const first =
    candidates[0]

  const second =
    candidates[1]

  if (!first) {
    return true
  }

  if (
    first.confidence <
    RESOLUTION_THRESHOLD
  ) {
    return true
  }

  if (
    second &&
    first.confidence -
      second.confidence <
      AMBIGUITY_DISTANCE
  ) {
    return true
  }

  return false
}

function buildWarnings({
  candidates,
  requiresHumanReview,
}: {
  candidates:
    AcademicSemanticResolutionCandidate[]

  requiresHumanReview:
    boolean
}): string[] {
  const warnings:
    string[] = []

  if (
    candidates.length ===
    0
  ) {
    warnings.push(
      'Nenhuma entidade semântica compatível foi encontrada para o termo informado.',
    )

    return warnings
  }

  if (
    candidates[0]
      .confidence <
    RESOLUTION_THRESHOLD
  ) {
    warnings.push(
      'A melhor correspondência possui confiança abaixo do limite de resolução automática.',
    )
  }

  if (
    requiresHumanReview &&
    candidates.length >
      1
  ) {
    warnings.push(
      'O termo possui mais de uma interpretação plausível e requer confirmação humana.',
    )
  }

  return warnings
}

export function resolveAcademicSemanticTerm(
  input:
    AcademicSemanticResolutionInput,

  options:
    SemanticServiceOptions = {},
): AcademicSemanticResolutionResult {
  const term =
    input.term.trim()

  if (!term) {
    return {
      success:
        false,

      resolvedEntityType:
        null,

      candidates:
        [],

      warnings:
        [],

      errors: [
        'O termo semântico é obrigatório.',
      ],

      requiresHumanReview:
        true,
    }
  }

  const normalizedTerm =
    normalizeAcademicSemanticTerm(
      term,
    )

  if (!normalizedTerm) {
    return {
      success:
        false,

      resolvedEntityType:
        null,

      candidates:
        [],

      warnings:
        [],

      errors: [
        'O termo informado não possui caracteres válidos para resolução semântica.',
      ],

      requiresHumanReview:
        true,
    }
  }

  const language =
    normalizeLanguage(
      input.language,
    )

  const accumulator =
    new Map<
      AcademicSemanticEntityType,
      CandidateAccumulator
    >()

  resolveCanonicalCandidates(
    input,
    normalizedTerm,
    getEntityDefinitions(
      options,
    ),
    accumulator,
  )

  resolveDefaultAliasCandidates(
    input,
    normalizedTerm,
    accumulator,
  )

  resolveCustomAliasCandidates(
    input,
    normalizedTerm,
    language,
    getAliases(
      options,
    ),
    accumulator,
  )

  resolveTranslationCandidates(
    input,
    normalizedTerm,
    language,
    getTranslationRules(
      options,
    ),
    accumulator,
  )

  const candidates =
    sortCandidates(
      applyContextBonuses({
        candidates:
          Array.from(
            accumulator
              .values(),
          ).map(
            value =>
              value.candidate,
          ),

        input,
      }),
    ).slice(
      0,
      MAX_CANDIDATES,
    )

  const requiresHumanReview =
    determineHumanReview(
      candidates,
    )

  const bestCandidate =
    candidates[0] ??
    null

  const resolvedEntityType =
    bestCandidate &&
    !requiresHumanReview &&
    bestCandidate.confidence >=
      RESOLUTION_THRESHOLD
      ? bestCandidate
          .semanticEntityType
      : null

  return {
    success:
      candidates.length >
      0,

    resolvedEntityType,

    candidates,

    warnings:
      buildWarnings({
        candidates,

        requiresHumanReview,
      }),

    errors:
      [],

    requiresHumanReview,
  }
}

export function getAcademicSemanticCanonicalName(
  entityType:
    AcademicSemanticEntityType,
): string {
  return CANONICAL_NAMES[
    entityType
  ]
}

export function getAcademicSemanticDomain(
  entityType:
    AcademicSemanticEntityType,
): AcademicSemanticDomain {
  return DOMAIN_BY_ENTITY[
    entityType
  ]
}

export function getAcademicSemanticDefaultAliases(
  entityType:
    AcademicSemanticEntityType,
): string[] {
  return [
    ...DEFAULT_ALIASES[
      entityType
    ],
  ]
}

export function resolveAcademicSemanticTerms(
  inputs:
    AcademicSemanticResolutionInput[],

  options:
    SemanticServiceOptions = {},
): AcademicSemanticResolutionResult[] {
  return inputs.map(
    input =>
      resolveAcademicSemanticTerm(
        input,
        options,
      ),
  )
}

export const academicSemanticService = {
  resolve:
    resolveAcademicSemanticTerm,

  resolveMany:
    resolveAcademicSemanticTerms,

  getCanonicalName:
    getAcademicSemanticCanonicalName,

  getDomain:
    getAcademicSemanticDomain,

  getDefaultAliases:
    getAcademicSemanticDefaultAliases,
}