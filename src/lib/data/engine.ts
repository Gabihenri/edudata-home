export interface EngineCapability {
  id: number
  title: string
  description: string
}

export const engineCapabilities: EngineCapability[] = [
  {
    id: 1,
    title: 'EDI Intelligence Engine',
    description:
      'Motor interno do EIOS responsável por recomendações, análise de evidências e inteligência aplicada.',
  },
  {
    id: 2,
    title: 'Knowledge Engine',
    description:
      'Organiza o conhecimento pedagógico, institucional e metodológico da EduData IA.',
  },
  {
    id: 3,
    title: 'Memory Engine',
    description:
      'Mantém memória institucional, histórico de interações e contexto educacional.',
  },
  {
    id: 4,
    title: 'Decision Engine',
    description:
      'Apoia decisões pedagógicas, formativas e institucionais orientadas por evidências.',
  },
  {
    id: 5,
    title: 'Learning Engine',
    description:
      'Permite aprendizagem contínua a partir dos dados produzidos pelos produtos da plataforma.',
  },
  {
    id: 6,
    title: 'Provider Engine',
    description:
      'Permite integração futura com Claude, OpenAI, modelos locais e outros provedores de IA.',
  },
]

export const engine = {
  title: 'EIOS',
  subtitle: 'Educational Intelligence Operating System',
  description:
    'O EIOS é o sistema operacional de inteligência educacional da EduData IA. Ele concentra contexto, memória, conhecimento, recomendações, análise, aprendizagem e apoio à decisão para todos os produtos do ecossistema.',
  capabilities: engineCapabilities.map((capability) => capability.title),
  principle:
    'Nenhum produto possui IA isolada. Todos consomem as capacidades inteligentes do mesmo EIOS.',
}