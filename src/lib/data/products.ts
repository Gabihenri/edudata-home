export interface Product {
  id: string
  name: string
  description: string
  href: string
  order: number
  featured: boolean
  eios: boolean
  category: string
  audience: string
  objective: string
  outcome: string
}

export const products: Product[] = [
  {
    id: 'professor-digital',
    name: 'Professor Digital',
    description:
      'Copiloto de desenvolvimento e prática profissional para apoiar o professor antes, durante e depois da aula.',
    href: '/professor-digital',
    order: 1,
    featured: true,
    eios: true,
    category: 'Copiloto Pedagógico',
    audience: 'Professor individual e equipes docentes',
    objective:
      'Apoiar o professor a planejar, criar, analisar e decidir melhor com assistência pedagógica do EIOS.',
    outcome:
      'Planejamentos, avaliações, relatórios, recomendações e apoio à recomposição com revisão humana.',
  },
  {
    id: 'agenda-edi',
    name: 'Agenda Inteligente EDI',
    description:
      'Ambiente operacional do trabalho docente: organiza e registra o ciclo pedagógico cotidiano em um único fluxo.',
    href: '/agenda',
    order: 2,
    featured: true,
    eios: true,
    category: 'Operação Pedagógica',
    audience: 'Professor, coordenação pedagógica e gestão escolar',
    objective:
      'Executar e registrar planejamento, aulas, frequência, evidências, avaliações, notas, ocorrências e intervenções.',
    outcome:
      'Histórico pedagógico estruturado, acompanhamento das turmas e dados confiáveis para o EIOS.',
  },
  {
    id: 'academy',
    name: 'EduData Academy',
    description:
      'Ambiente de formação continuada para desenvolver competências profissionais por cursos e trilhas.',
    href: '/academy',
    order: 3,
    featured: true,
    eios: true,
    category: 'Formação e Certificação',
    audience: 'Professores, gestores e profissionais da educação',
    objective:
      'Oferecer formação continuada estruturada em cursos, trilhas, eventos e certificações.',
    outcome:
      'Desenvolvimento profissional registrado, certificados e progressão em trilhas de aprendizagem.',
  },
  {
    id: 'analytics',
    name: 'EduData Analytics',
    description:
      'Camada de análise que transforma dados educacionais em indicadores, comparações e tendências para decisão.',
    href: '/analytics',
    order: 4,
    featured: true,
    eios: true,
    category: 'Inteligência Analítica',
    audience: 'Professores, coordenação, direção, redes e analistas',
    objective:
      'Analisar dados já produzidos pela plataforma e por fontes integradas para identificar evolução, padrões e prioridades.',
    outcome:
      'Dashboards, séries históricas, comparativos, indicadores e exportações analíticas.',
  },
  {
    id: 'sgpa',
    name: 'SGPA',
    description:
      'Sistema de governança e acompanhamento institucional para controlar processos, responsabilidades e conformidade.',
    href: '/sgpa',
    order: 5,
    featured: true,
    eios: true,
    category: 'Governança Institucional',
    audience: 'Coordenação, direção, mantenedoras e gestores de rede',
    objective:
      'Governar decisões, workflows, planos de ação, auditoria, responsabilidades e conformidade institucional.',
    outcome:
      'Rastreabilidade, auditoria, acompanhamento de processos e decisões humanas documentadas.',
  },
  {
    id: 'observatorio',
    name: 'Observatório da Educação',
    description:
      'Ambiente de pesquisa e conhecimento para estudar indicadores, tendências e fenômenos educacionais em escala ampliada.',
    href: '/observatorio',
    order: 6,
    featured: true,
    eios: true,
    category: 'Pesquisa e Conhecimento',
    audience: 'Pesquisadores, universidades, redes de ensino e formuladores de políticas',
    objective:
      'Produzir e disponibilizar estudos, séries históricas, indicadores públicos e benchmarking educacional.',
    outcome:
      'Pesquisas, estudos longitudinais, painéis públicos, benchmarks e conhecimento educacional reutilizável.',
  },
  {
    id: 'comunidade',
    name: 'Comunidade EduData IA',
    description:
      'Rede profissional para troca de práticas, experiências, materiais e colaboração entre educadores.',
    href: '/comunidade',
    order: 7,
    featured: true,
    eios: true,
    category: 'Rede Profissional',
    audience: 'Professores, gestores, pesquisadores e profissionais da educação',
    objective:
      'Conectar pessoas e permitir colaboração, compartilhamento de práticas e construção coletiva de conhecimento.',
    outcome:
      'Rede de práticas, grupos temáticos, materiais compartilhados, eventos e colaboração profissional.',
  },
]