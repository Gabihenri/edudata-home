import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export type AgendaClass = {
  id: string
  name: string
  school_year: string | null
  grade: string | null
  subject: string | null
  students_count: number
  school_id: string | null
  teacher_id: string | null
  active: boolean
  created_at: string
  updated_at: string
}

export type CreateAgendaClassInput = {
  name: string
  school_year?: string | null
  grade?: string | null
  subject?: string | null
  students_count?: number
  school_id?: string | null
  teacher_id?: string | null
  active?: boolean
}

export type UpdateAgendaClassInput = Partial<CreateAgendaClassInput>

function createSupabaseClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error('Variáveis do Supabase não configuradas.')
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

class ClassesRepository {
  private get client(): SupabaseClient {
    return createSupabaseClient()
  }

  async findAll(): Promise<AgendaClass[]> {
    const { data, error } = await this.client
      .from('agenda_classes')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      throw new Error(`Erro ao listar turmas: ${error.message}`)
    }

    return (data ?? []) as AgendaClass[]
  }

  async findById(id: string): Promise<AgendaClass | null> {
    const { data, error } = await this.client
      .from('agenda_classes')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) {
      throw new Error(`Erro ao buscar turma: ${error.message}`)
    }

    return data as AgendaClass | null
  }

  async findByTeacherId(teacherId: string): Promise<AgendaClass[]> {
    const { data, error } = await this.client
      .from('agenda_classes')
      .select('*')
      .eq('teacher_id', teacherId)
      .order('name', { ascending: true })

    if (error) {
      throw new Error(
        `Erro ao listar turmas do professor: ${error.message}`,
      )
    }

    return (data ?? []) as AgendaClass[]
  }

  async findBySchoolId(schoolId: string): Promise<AgendaClass[]> {
    const { data, error } = await this.client
      .from('agenda_classes')
      .select('*')
      .eq('school_id', schoolId)
      .order('name', { ascending: true })

    if (error) {
      throw new Error(
        `Erro ao listar turmas da escola: ${error.message}`,
      )
    }

    return (data ?? []) as AgendaClass[]
  }

  async create(input: CreateAgendaClassInput): Promise<AgendaClass> {
    const payload = {
      name: input.name,
      school_year: input.school_year ?? null,
      grade: input.grade ?? null,
      subject: input.subject ?? null,
      students_count: input.students_count ?? 0,
      school_id: input.school_id ?? null,
      teacher_id: input.teacher_id ?? null,
      active: input.active ?? true,
    }

    const { data, error } = await this.client
      .from('agenda_classes')
      .insert(payload)
      .select('*')
      .single()

    if (error) {
      throw new Error(`Erro ao criar turma: ${error.message}`)
    }

    return data as AgendaClass
  }

  async update(
    id: string,
    input: UpdateAgendaClassInput,
  ): Promise<AgendaClass> {
    const payload = {
      ...input,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await this.client
      .from('agenda_classes')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      throw new Error(`Erro ao atualizar turma: ${error.message}`)
    }

    return data as AgendaClass
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client
      .from('agenda_classes')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Erro ao excluir turma: ${error.message}`)
    }
  }
}

export const classesRepository = new ClassesRepository()