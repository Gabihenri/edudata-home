export interface PlatformLayer {
  id: number
  title: string
  subtitle: string
  description: string
}

export const platformLayers: PlatformLayer[] = [
  {
    id: 1,
    title: 'Framework EDI',
    subtitle: 'Base metodológica',
    description:
      'Evidências, Inclusão e Inteligência constituem os princípios que orientam toda a plataforma.',
  },
  {
    id: 2,
    title: 'EDI Intelligence Engine',
    subtitle: 'Motor compartilhado',
    description:
      'Todos os produtos utilizam o mesmo núcleo de inteligência para recomendações, análises, personalização e apoio à decisão.',
  },
  {
    id: 3,
    title: 'Produtos',
    subtitle: 'Ecossistema integrado',
    description:
      'Academy, Professor Digital, Agenda Inteligente EDI, Analytics, SGPA, Observatório e Comunidade compartilham o mesmo Core.',
  },
  {
    id: 4,
    title: 'Clientes',
    subtitle: 'Impacto educacional',
    description:
      'Professores, escolas, redes de ensino, universidades e instituições utilizam a mesma plataforma integrada.',
  },
]