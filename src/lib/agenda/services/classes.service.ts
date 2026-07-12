import {
  classesRepository,
  type AgendaClass,
  type CreateAgendaClassInput,
  type UpdateAgendaClassInput,
} from '@/lib/agenda/repository/classes.repository'

class ClassesService {
  async listAll(): Promise<AgendaClass[]> {
    return classesRepository.findAll()
  }

  async getById(id: string): Promise<AgendaClass> {
    if (!id?.trim()) {
      throw new Error('ID da turma é obrigatório.')
    }

    const agendaClass = await classesRepository.findById(id)

    if (!agendaClass) {
      throw new Error('Turma não encontrada.')
    }

    return agendaClass
  }

  async listByTeacherId(teacherId: string): Promise<AgendaClass[]> {
    if (!teacherId?.trim()) {
      throw new Error('ID do professor é obrigatório.')
    }

    return classesRepository.findByTeacherId(teacherId)
  }

  async listBySchoolId(schoolId: string): Promise<AgendaClass[]> {
    if (!schoolId?.trim()) {
      throw new Error('ID da escola é obrigatório.')
    }

    return classesRepository.findBySchoolId(schoolId)
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

    return classesRepository.create({
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

    const existingClass = await classesRepository.findById(id)

    if (!existingClass) {
      throw new Error('Turma não encontrada.')
    }

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
      normalizedInput.school_year =
        input.school_year?.trim() || null
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

    return classesRepository.update(id, normalizedInput)
  }

  async delete(id: string): Promise<void> {
    if (!id?.trim()) {
      throw new Error('ID da turma é obrigatório.')
    }

    const existingClass = await classesRepository.findById(id)

    if (!existingClass) {
      throw new Error('Turma não encontrada.')
    }

    await classesRepository.delete(id)
  }
}

export const classesService = new ClassesService()