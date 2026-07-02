 import { Course } from '@/types/course'

export const academyCourses: Course[] = [
  {
    id: '1',
    slug: 'ia-para-professores',
    title: 'IA para Professores',
    subtitle: 'Inteligência Artificial aplicada à prática docente',
    description:
      'Aprenda a utilizar Inteligência Artificial para planejamento, avaliações, materiais didáticos e apoio pedagógico.',
    category: 'Inteligência Artificial',
    image: '/academy/ia-professores.jpg',
    workload: 20,
    level: 'Básico',
    mode: 'Online',
    price: 'Em definição',
    vacancies: 50,
    certificate: true,
    instructor: 'Equipe EduData IA',
    status: 'Inscrições Abertas',
    featured: true,
    launch: true,
    tags: ['IA', 'Educação', 'ChatGPT', 'Professor Digital'],
    order: 1,
  },
  {
    id: '2',
    slug: 'google-workspace',
    title: 'Google Workspace para Educação',
    subtitle: 'Ferramentas Google para professores',
    description:
      'Domine Google Classroom, Drive, Docs, Forms, Meet e outras ferramentas para educação.',
    category: 'Google Workspace',
    image: '/academy/google-workspace.jpg',
    workload: 20,
    level: 'Básico',
    mode: 'Online',
    price: 'Em definição',
    vacancies: 50,
    certificate: true,
    instructor: 'Equipe EduData IA',
    status: 'Inscrições Abertas',
    featured: true,
    launch: false,
    tags: ['Google', 'Workspace', 'Educação', 'Ferramentas Digitais'],
    order: 2,
  },
  {
    id: '3',
    slug: 'canva-educacional',
    title: 'Canva Educacional',
    subtitle: 'Design para professores',
    description:
      'Crie apresentações, infográficos, atividades, materiais didáticos e recursos visuais profissionais.',
    category: 'Design Educacional',
    image: '/academy/canva.jpg',
    workload: 12,
    level: 'Básico',
    mode: 'Online',
    price: 'Em definição',
    vacancies: 50,
    certificate: true,
    instructor: 'Equipe EduData IA',
    status: 'Inscrições Abertas',
    featured: true,
    launch: false,
    tags: ['Canva', 'Design', 'Materiais Didáticos', 'Educação'],
    order: 3,
  },
  {
    id: '4',
    slug: 'dashboards-educacionais',
    title: 'Dashboards Educacionais',
    subtitle: 'Indicadores para tomada de decisão',
    description:
      'Aprenda a construir dashboards educacionais, organizar indicadores e apoiar decisões baseadas em evidências.',
    category: 'Ciência de Dados',
    image: '/academy/dashboards.jpg',
    workload: 20,
    level: 'Intermediário',
    mode: 'Online',
    price: 'Em definição',
    vacancies: 40,
    certificate: true,
    instructor: 'Equipe EduData IA',
    status: 'Em breve',
    featured: true,
    launch: false,
    tags: ['Dashboard', 'BI', 'Indicadores', 'Dados Educacionais'],
    order: 4,
  },
  {
    id: '5',
    slug: 'framework-edi',
    title: 'Framework EDI',
    subtitle: 'Fundamentos da metodologia EduData IA',
    description:
      'Conheça a metodologia Evidências, Inclusão e Inteligência que fundamenta todo o ecossistema EduData IA.',
    category: 'Framework EDI',
    image: '/academy/framework-edi.jpg',
    workload: 20,
    level: 'Básico',
    mode: 'Online',
    price: 'Em definição',
    vacancies: 50,
    certificate: true,
    instructor: 'Equipe EduData IA',
    status: 'Lançamento',
    featured: true,
    launch: true,
    tags: ['EDI', 'Framework', 'Evidências', 'Inclusão', 'Inteligência'],
    order: 5,
  },
]

export const featuredAcademyCourses = academyCourses
  .filter((course) => course.featured)
  .sort((a, b) => a.order - b.order)

export const academyCategories = Array.from(
  new Set(academyCourses.map((course) => course.category)),
)

export function getAcademyCourseBySlug(slug: string) {
  return academyCourses.find((course) => course.slug === slug)
}

export function getRelatedAcademyCourses(slug: string) {
  const currentCourse = getAcademyCourseBySlug(slug)

  if (!currentCourse) {
    return featuredAcademyCourses.slice(0, 3)
  }

  return academyCourses
    .filter(
      (course) =>
        course.slug !== slug &&
        (course.category === currentCourse.category ||
          course.tags.some((tag) => currentCourse.tags.includes(tag))),
    )
    .slice(0, 3)
}