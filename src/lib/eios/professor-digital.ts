export type EiosSource = 'contexto' | 'conhecimento' | 'producao'

export type EiosPossibility = {
  id: string
  title: string
  explanation: string
  sources: EiosSource[]
  nextStep: string
  academyTags: string[]
}

export type ProfessionalWeeklyReport = {
  period: string
  summary: string
  productionCount: number
  themes: string[]
  reflections: string[]
  nextPossibilities: string[]
}

type KnowledgeEntry = {
  theme?: string
  relationship?: string
  question?: string
}

type ProductionEntry = {
  title?: string
  period?: string
  description?: string
  learning?: string
  nextStep?: string
  themes?: string[]
}

type ProfileContext = {
  interests?: string[]
  developmentGoal?: string
}

export function buildProfessionalPossibilities(input: {
  context?: ProfileContext
  knowledge?: KnowledgeEntry[]
  production?: ProductionEntry[]
}): EiosPossibility[] {
  const possibilities: EiosPossibility[] = []
  const context = input.context ?? {}

  for (const entry of input.knowledge ?? []) {
    if (entry.theme && (entry.relationship === 'aprofundar' || entry.relationship === 'desenvolver')) {
      possibilities.push({
        id: `knowledge-${entry.theme.toLowerCase().replace(/\s+/g, '-')}`,
        title: `Aprofundar ${entry.theme}`,
        explanation: entry.question
          ? `Esta possibilidade foi apresentada porque você registrou interesse em aprofundar o tema e formulou a pergunta “${entry.question}”.`
          : `Esta possibilidade foi apresentada porque você indicou ${entry.theme} como um tema relevante para seu desenvolvimento.`,
        sources: ['conhecimento'],
        nextStep: 'Escolher uma pergunta de estudo, uma experiência prática ou uma formação que faça sentido para o seu contexto.',
        academyTags: [entry.theme],
      })
    }
  }

  for (const entry of input.production ?? []) {
    if (entry.title && entry.nextStep) {
      possibilities.push({
        id: `production-${entry.title.toLowerCase().replace(/\s+/g, '-')}`,
        title: `Dar continuidade a ${entry.title}`,
        explanation: `Esta possibilidade foi apresentada a partir do próximo passo que você registrou na sua própria memória profissional: “${entry.nextStep}”.`,
        sources: ['producao'],
        nextStep: 'Decidir se esse próximo passo deve se transformar em estudo, projeto, colaboração ou experiência formativa.',
        academyTags: entry.themes?.filter(Boolean) ?? [],
      })
    }
  }

  if (context.developmentGoal) {
    possibilities.push({
      id: 'development-goal',
      title: 'Explorar o objetivo que você definiu',
      explanation: `Esta possibilidade parte diretamente do objetivo profissional que você registrou: “${context.developmentGoal}”.`,
      sources: ['contexto'],
      nextStep: 'Definir um avanço pequeno e observável que você gostaria de realizar nas próximas semanas.',
      academyTags: context.interests ?? [],
    })
  }

  return possibilities.slice(0, 6)
}

export function buildWeeklyProfessionalReport(input: {
  production?: ProductionEntry[]
  context?: ProfileContext
  knowledge?: KnowledgeEntry[]
  now?: Date
}): ProfessionalWeeklyReport {
  const now = input.now ?? new Date()
  const productions = input.production ?? []
  const themes = Array.from(new Set(productions.flatMap(entry => entry.themes ?? []).filter(Boolean))).slice(0, 8)
  const reflections = productions
    .map(entry => entry.learning)
    .filter((value): value is string => Boolean(value && value.trim()))
    .slice(0, 3)

  const nextPossibilities = buildProfessionalPossibilities(input).map(item => item.title).slice(0, 3)

  const summary = productions.length === 0
    ? 'Ainda não há produções suficientes para uma síntese da semana. O primeiro passo pode ser registrar uma experiência, material, projeto ou aprendizagem que você queira manter na sua memória profissional.'
    : `Nesta leitura reflexiva, sua memória profissional reúne ${productions.length} produção(ões). O objetivo não é medir desempenho, mas tornar visíveis temas, aprendizagens e próximos caminhos que você escolheu registrar.`

  return {
    period: `Semana de ${now.toLocaleDateString('pt-BR')}`,
    summary,
    productionCount: productions.length,
    themes,
    reflections,
    nextPossibilities,
  }
}
