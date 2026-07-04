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
    subtitle: 'Patrimônio Metodológico',
    description:
      'Metodologia científica da EduData IA baseada em Evidências, Desenvolvimento e Inteligência. Define os princípios que orientam toda a plataforma.',
  },
  {
    id: 2,
    title: 'EIOS',
    subtitle: 'Educational Intelligence Operating System',
    description:
      'Sistema Operacional de Inteligência Educacional responsável por contexto, memória, conhecimento, recomendações, análise, aprendizagem e apoio à decisão.',
  },
  {
    id: 3,
    title: 'Core Compartilhado',
    subtitle: 'Infraestrutura',
    description:
      'Autenticação, segurança, auditoria, cache, banco de dados, APIs e serviços compartilhados utilizados por todos os produtos da plataforma.',
  },
  {
    id: 4,
    title: 'Produtos Inteligentes',
    subtitle: 'Ecossistema EduData IA',
    description:
      'Professor Digital, Agenda Inteligente EDI, EduData Academy, EduData Analytics, SGPA, Observatório da Educação e Comunidade EduData IA utilizam os mesmos serviços inteligentes do EIOS.',
  },
]

export const platform = {
  title: 'Arquitetura Oficial da EduData IA',
  subtitle: 'Framework EDI → EIOS → Core Compartilhado → Produtos',
  layers: platformLayers,
}