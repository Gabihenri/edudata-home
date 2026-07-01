export type CourseStatus =
  | 'Lançamento'
  | 'Inscrições Abertas'
  | 'Em breve'
  | 'Em andamento'
  | 'Encerrado'

export type CourseLevel =
  | 'Básico'
  | 'Intermediário'
  | 'Avançado'

export type CourseMode =
  | 'Online'
  | 'Presencial'
  | 'Híbrido'

export interface Course {
  id: string

  slug: string

  title: string

  subtitle: string

  description: string

  category: string

  image: string

  workload: number

  level: CourseLevel

  mode: CourseMode

  price: string

  vacancies: number

  certificate: boolean

  instructor: string

  status: CourseStatus

  featured: boolean

  launch: boolean

  tags: string[]

  order: number
}