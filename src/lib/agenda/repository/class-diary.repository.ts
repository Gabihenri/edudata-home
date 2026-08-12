import type { SupabaseClient } from '@supabase/supabase-js'

export type ClassRosterStudent = {
  id: string
  class_id: string
  full_name: string
  enrollment_code: string | null
  sequence_number: number | null
  active: boolean
}

export type AttendanceStatus =
  | 'present'
  | 'absent'
  | 'justified'
  | 'late'
  | 'not_recorded'

const ATTENDANCE_SELECT =
  'id,student_id,status,notes,lesson_date,updated_at'

export async function listClassRoster({
  client,
  userId,
  classId,
}: {
  client: SupabaseClient
  userId: string
  classId: string
}) {
  const { data, error } = await client
    .from('agenda_class_students')
    .select(
      'id,class_id,full_name,enrollment_code,sequence_number,active',
    )
    .eq('user_id', userId)
    .eq('class_id', classId)
    .eq('active', true)
    .is('archived_at', null)
    .order('sequence_number', {
      ascending: true,
      nullsFirst: false,
    })
    .order('full_name', {
      ascending: true,
    })

  if (error) {
    throw new Error(
      `Não foi possível carregar a lista da turma: ${error.message}`,
    )
  }

  return (data ?? []) as ClassRosterStudent[]
}

export async function addClassStudent({
  client,
  userId,
  classId,
  fullName,
  enrollmentCode,
  sequenceNumber,
}: {
  client: SupabaseClient
  userId: string
  classId: string
  fullName: string
  enrollmentCode?: string | null
  sequenceNumber?: number | null
}) {
  const { data, error } = await client
    .from('agenda_class_students')
    .insert({
      user_id: userId,
      class_id: classId,
      full_name: fullName.trim(),
      enrollment_code: enrollmentCode?.trim() || null,
      sequence_number: sequenceNumber ?? null,
    })
    .select(
      'id,class_id,full_name,enrollment_code,sequence_number,active',
    )
    .single()

  if (error) {
    throw new Error(
      `Não foi possível adicionar o estudante: ${error.message}`,
    )
  }

  return data as ClassRosterStudent
}

export async function listAttendanceByDate({
  client,
  userId,
  classId,
  lessonDate,
}: {
  client: SupabaseClient
  userId: string
  classId: string
  lessonDate: string
}) {
  const { data, error } = await client
    .from('agenda_attendance_entries')
    .select(ATTENDANCE_SELECT)
    .eq('user_id', userId)
    .eq('class_id', classId)
    .eq('lesson_date', lessonDate)
    .is('archived_at', null)

  if (error) {
    throw new Error(
      `Não foi possível carregar a frequência: ${error.message}`,
    )
  }

  return data ?? []
}

async function findActiveAttendance({
  client,
  userId,
  classId,
  studentId,
  lessonDate,
}: {
  client: SupabaseClient
  userId: string
  classId: string
  studentId: string
  lessonDate: string
}) {
  const { data, error } = await client
    .from('agenda_attendance_entries')
    .select('id')
    .eq('user_id', userId)
    .eq('class_id', classId)
    .eq('student_id', studentId)
    .eq('lesson_date', lessonDate)
    .is('archived_at', null)
    .maybeSingle()

  if (error) {
    throw new Error(
      `Não foi possível consultar a frequência existente: ${error.message}`,
    )
  }

  return data
}

async function updateActiveAttendance({
  client,
  id,
  userId,
  status,
  notes,
}: {
  client: SupabaseClient
  id: string
  userId: string
  status: AttendanceStatus
  notes?: string | null
}) {
  const { data, error } = await client
    .from('agenda_attendance_entries')
    .update({
      status,
      notes: notes?.trim() || null,
      recorded_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', userId)
    .is('archived_at', null)
    .select(ATTENDANCE_SELECT)
    .maybeSingle()

  if (error) {
    throw new Error(
      `Não foi possível atualizar a frequência: ${error.message}`,
    )
  }

  return data
}

export async function upsertAttendance({
  client,
  userId,
  classId,
  studentId,
  lessonDate,
  status,
  notes,
}: {
  client: SupabaseClient
  userId: string
  classId: string
  studentId: string
  lessonDate: string
  status: AttendanceStatus
  notes?: string | null
}) {
  const existing = await findActiveAttendance({
    client,
    userId,
    classId,
    studentId,
    lessonDate,
  })

  if (existing) {
    const updated = await updateActiveAttendance({
      client,
      id: existing.id,
      userId,
      status,
      notes,
    })

    if (updated) {
      return updated
    }
  }

  const { data, error } = await client
    .from('agenda_attendance_entries')
    .insert({
      user_id: userId,
      class_id: classId,
      student_id: studentId,
      lesson_date: lessonDate,
      status,
      notes: notes?.trim() || null,
      recorded_by: userId,
    })
    .select(ATTENDANCE_SELECT)
    .single()

  if (!error) {
    return data
  }

  /*
   * O banco preserva histórico com archived_at e possui índice único
   * apenas para registros ativos. Se duas gravações simultâneas
   * tentarem criar a mesma frequência, uma delas pode receber 23505.
   * Nesse caso buscamos o registro ativo criado pela outra requisição
   * e o atualizamos.
   */
  if (error.code === '23505') {
    const concurrent = await findActiveAttendance({
      client,
      userId,
      classId,
      studentId,
      lessonDate,
    })

    if (concurrent) {
      const updated = await updateActiveAttendance({
        client,
        id: concurrent.id,
        userId,
        status,
        notes,
      })

      if (updated) {
        return updated
      }
    }
  }

  throw new Error(
    `Não foi possível salvar a frequência: ${error.message}`,
  )
}
