export interface Course {
  id: string

  slug: string

  title: string

  subtitle: string

  description: string

  category: string

  image: string

  workload: number

  level: string

  mode: string

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