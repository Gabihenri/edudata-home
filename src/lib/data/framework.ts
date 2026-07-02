export interface FrameworkPillar {
  id: number
  title: string
  description: string
}

export const frameworkPillars: FrameworkPillar[] = [
  {
    id: 1,
    title: 'Evidências',
    description:
      'Transformar dados educacionais em evidências confiáveis para orientar decisões pedagógicas e institucionais.',
  },
  {
    id: 2,
    title: 'Inclusão',
    description:
      'Promover acessibilidade, equidade e desenvolvimento para todos os estudantes e profissionais da educação.',
  },
  {
    id: 3,
    title: 'Inteligência',
    description:
      'Aplicar Inteligência Artificial, Ciência de Dados e inovação para potencializar a aprendizagem e a gestão.',
  },
]

export const framework = {
  title: 'Framework EDI',

  subtitle:
    'A base metodológica que conecta todos os produtos da Plataforma EduData IA.',

  principle:
    'Toda solução da EduData IA nasce do Framework EDI e compartilha o mesmo EDI Intelligence Engine.',
}