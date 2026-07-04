export interface Product {
  id: string
  name: string
  description: string
  href: string
  order: number
  featured: boolean
  eios: boolean
  category: string
}

export const products: Product[] = [
  {
    id: 'professor-digital',
    name: 'Professor Digital',
    description:
      'Plataforma de desenvolvimento profissional orientada pelo Framework EDI e potencializada pelo EIOS.',
    href: '/professor-digital',
    order: 1,
    featured: true,
    eios: true,
    category: 'Desenvolvimento Profissional',
  },
  {
    id: 'agenda-edi',
    name: 'Agenda Inteligente EDI',
    description:
      'Planejamento pedagógico inteligente integrado ao EIOS para organização, acompanhamento e geração de evidências.',
    href: '/agenda',
    order: 2,
    featured: true,
    eios: true,
    category: 'Gestão Pedagógica',
  },
  {
    id: 'academy',
    name: 'EduData Academy',
    description:
      'Ambiente de formação continuada com trilhas personalizadas produzidas pelo EIOS.',
    href: '/academy',
    order: 3,
    featured: true,
    eios: true,
    category: 'Formação',
  },
  {
    id: 'analytics',
    name: 'EduData Analytics',
    description:
      'Inteligência analítica, indicadores estratégicos e apoio à decisão para professores, gestores e redes de ensino.',
    href: '/analytics',
    order: 4,
    featured: true,
    eios: true,
    category: 'Business Intelligence',
  },
  {
    id: 'sgpa',
    name: 'SGPA',
    description:
      'Governança pedagógica, auditoria, conformidade e monitoramento institucional apoiados pelo EIOS.',
    href: '/sgpa',
    order: 5,
    featured: true,
    eios: true,
    category: 'Governança',
  },
  {
    id: 'observatorio',
    name: 'Observatório da Educação',
    description:
      'Centro de estudos, pesquisas, indicadores e tendências educacionais conectado ao conhecimento produzido pelo EIOS.',
    href: '/observatorio',
    order: 6,
    featured: true,
    eios: true,
    category: 'Pesquisa',
  },
  {
    id: 'comunidade',
    name: 'Comunidade EduData IA',
    description:
      'Rede colaborativa para compartilhamento de experiências, conhecimento e inovação educacional.',
    href: '/comunidade',
    order: 7,
    featured: true,
    eios: true,
    category: 'Comunidade',
  },
]