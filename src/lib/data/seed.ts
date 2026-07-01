import { academyCourses } from './academyCourses'
import { database } from './database'
import { AcademyInstructor } from './schema'

const instructors: AcademyInstructor[] = [
  {
    id: '1',
    name: 'Equipe EduData IA',
    email: 'contato@edudata.ai',
    biography:
      'Equipe responsável pelas formações, pesquisas e desenvolvimento do Framework EDI.',
    avatar: '/images/instructors/edudata.png',
    specialties: [
      'Framework EDI',
      'Inteligência Artificial',
      'Gestão Educacional',
      'Ciência de Dados',
    ],
    active: true,
  },
]

export function seedDatabase() {
  database.courses = academyCourses

  database.instructors = instructors

  database.enrollments = []

  console.log('🌱 EduData Academy inicializada com sucesso.')
}