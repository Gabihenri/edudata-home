export interface AcademyCourse {
  id: string
  slug: string
  title: string
  subtitle: string
  description: string
  category: string

  image: string

  workload: number
  level: 'Básico' | 'Intermediário' | 'Avançado'
  mode: 'Online' | 'Presencial' | 'Híbrido'

  price: string
  vacancies: number

  certificate: boolean

  instructor: string

  status: string

  featured: boolean
  launch: boolean

  tags: string[]

  order: number
}

export interface AcademyEnrollment {
  id: string

  courseId: string

  fullName: string

  email: string

  whatsapp: string

  school: string

  city: string

  state: string

  role: string

  status:
    | 'Pendente'
    | 'Confirmado'
    | 'Matriculado'
    | 'Concluído'
    | 'Cancelado'

  lgpd: boolean

  createdAt: string

  updatedAt: string
}

export interface AcademyInstructor {
  id: string

  name: string

  email: string

  biography: string

  avatar: string

  specialties: string[]

  active: boolean
}