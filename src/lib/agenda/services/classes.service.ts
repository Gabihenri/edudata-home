import type { SupabaseClient } from '@supabase/supabase-js'

import {
  ClassesRepository,
  classesRepository,
  type AgendaClass,
  type CreateAgendaClassInput,
  type UpdateAgendaClassInput,
} from '@/lib/agenda/repository/classes.repository'

class ClassesService {
  private readonly repository: ClassesRepository

  constructor(repository: ClassesRepository = classesRepository) {
    this.repository = repository
  }

  withClient(client: SupabaseClient): ClassesService {
    return new ClassesService(new ClassesRepository(client))
  }

  async listAll(): Promise<AgendaClass[]> {
    return this.repository.findAll()
  }

  async getById(id: string): Promise<AgendaClass> {
    if (!id?.trim()) {
      throw new Error('ID da turma é obrigatório.')
    }

    const agendaClass = await this.repository.findById(id)

    if (!agendaClass) {
      throw new Error('Turma não encontrada.')
    }

    return agendaClass
  }

  async getOwnedById(
    id: string,
    teacherId: string,
  ): Promise<AgendaClass> {
    if (!id?.trim()) {
      throw new Error('ID da turma é obrigatório.')
    }

    if (!teacherId?.trim()) {
      throw new Error('ID do professor é obrigatório.')
    }

    const agendaClass = await this.repository.findOwnedById(id, teacherId)

    if (!agendaClass) {
      throw new Error('Turma não encontrada.')
    }

    return agendaClass
  }

  async listByTeacherId(teacherId: string): Promise<AgendaClass[]> {
    if (!teacherId?.trim()) {
      throw new Error('ID do professor é obrigatório.')
    }

    return this.repository.findByTeacherId(teacherId)
  }

  async listBySchoolId(schoolId: string): Promise<AgendaClass[]> {
    if (!schoolId?.trim()) {
      throw new Error('ID da escola é obrigatório.')
    }

    return this.repository.findBySchoolId(schoolId)
  }

  async create(input: CreateAgendaClassInput): Promise<AgendaClass> {
    const name = input.name?.trim()

    if (!name) {
      throw new Error('Nome da turma é obrigatório.')
    }

    const studentsCount = input.students_count ?? 0

    if (!Number.isInteger(studentsCount) || studentsCount < 0) {
      throw new Error(
        'Quantidade de estudantes deve ser um número inteiro igual ou maior que zero.',
      )
    }

    return this.repository.create({
      ...input,
      name,
      school_year: input.school_year?.trim() || null,
      grade: input.grade?.trim() || null,
      subject: input.subject?.trim() || null,
      students_count: studentsCount,
      active: input.active ?? true,
    })
  }

  async update(
    id: string,
    input: UpdateAgendaClassInput,
  ): Promise<AgendaClass> {
    if (!id?.trim()) {
      throw new Error('ID da turma é obrigatório.')
    }

    const existingClass = await this.repository.findById(id)

    if (!existingClass) {
      throw new Error('Turma não encontrada.')
    }

    return this.updateNormalized(id, input)
  }

  async updateOwned(
    id: string,
    teacherId: string,
    input: UpdateAgendaClassInput,
  ): Promise<AgendaClass> {
    if (!id?.trim()) {
      throw new Error('ID da turma é obrigatório.')
    }

    if (!teacherId?.trim()) {
      throw new Error('ID do professor é obrigatório.')
    }

    const existingClass = await this.repository.findOwnedById(id, teacherId)

    if (!existingClass) {
      throw new Error('Turma não encontrada.')
    }

    const normalizedInput = this.normalizeUpdateInput(input)

    return this.repository.updateOwned(id, teacherId, normalizedInput)
  }

  async delete(id: string): Promise<void> {
    if (!id?.trim()) {
      throw new Error('ID da turma é obrigatório.')
    }

    const existingClass = await this.repository.findById(id)

    if (!existingClass) {
      throw new Error('Turma não encontrada.')
    }

    await this.repository.delete(id)
  }

  async deleteOwned(id: string, teacherId: string): Promise<void> {
    if (!id?.trim()) {
      throw new Error('ID da turma é obrigatório.')
    }

    if (!teacherId?.trim()) {
      throw new Error('ID do professor é obrigatório.')
    }

    const existingClass = await this.repository.findOwnedById(id, teacherId)

    if (!existingClass) {
      throw new Error('Turma não encontrada.')
    }

    await this.repository.deleteOwned(id, teacherId)
  }

  private async updateNormalized(
    id: string,
    input: UpdateAgendaClassInput,
  ): Promise<AgendaClass> {
    const normalizedInput = this.normalizeUpdateInput(input)
    return this.repository.update(id, normalizedInput)
  }

  private normalizeUpdateInput(
    input: UpdateAgendaClassInput,
  ): UpdateAgendaClassInput {
    const normalizedInput: UpdateAgendaClassInput = {
      ...input,
    }

    if (input.name !== undefined) {
      const name = input.name.trim()

      if (!name) {
        throw new Error('Nome da turma não pode ficar vazio.')
      }

      normalizedInput.name = name
    }

    if (input.school_year !== undefined) {
      normalizedInput.school_year = input.school_year?.trim() || null
    }

    if (input.grade !== undefined) {
      normalizedInput.grade = input.grade?.trim() || null
    }

    if (input.subject !== undefined) {
      normalizedInput.subject = input.subject?.trim() || null
    }

    if (input.students_count !== undefined) {
      if (
        !Number.isInteger(input.students_count) ||
        input.students_count < 0
      ) {
        throw new Error(
          'Quantidade de estudantes deve ser um número inteiro igual ou maior que zero.',
        )
      }

      normalizedInput.students_count = input.students_count
    }

    return normalizedInput
  }
}

export { ClassesService }
export const classesService = new ClassesService()
