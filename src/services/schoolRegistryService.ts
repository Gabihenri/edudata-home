export interface School {
  id: string
  inep?: string

  nome: string

  rede:
    | 'Estadual'
    | 'Municipal'
    | 'Federal'
    | 'Particular'

  estado: string
  cidade: string

  diretor?: string
  coordenador?: string

  email?: string
  telefone?: string

  ativo: boolean
}

export class SchoolRegistryService {
  private schools: School[] = []

  getAll() {
    return this.schools
  }

  getById(id: string) {
    return this.schools.find(s => s.id === id)
  }

  add(school: School) {
    this.schools.push(school)
    return school
  }

  update(id: string, data: Partial<School>) {
    const school = this.getById(id)

    if (!school) return null

    Object.assign(school, data)

    return school
  }

  remove(id: string) {
    this.schools = this.schools.filter(s => s.id !== id)
  }
}

export const schoolRegistry = new SchoolRegistryService()
