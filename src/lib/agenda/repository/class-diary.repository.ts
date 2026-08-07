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
    .select('id,class_id,full_name,enrollment_code,sequence_number,active')
    .eq('user_id', userId)
    .eq('class_id', classId)
    .eq('active', true)
    .is('archived_at', null)
    .order('sequence_number', { ascending: true, nullsFirst: false })
    .order('full_name', { ascending: true })

  if (error) {
    throw new Error(`Não foi possível carregar a lista da turma: ${error.message}`)
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
    .select('id,class_id,full_name,enrollment_code,sequence_number,active')
    .single()

  if (error) {
    throw new Error(`Não foi possível adicionar o estudante: ${error.message}`)
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
    .select('id,student_id,status,notes,lesson_date,updated_at')
    .eq('user_id', userId)
    .eq('class_id', classId)
    .eq('lesson_date', lessonDate)
    .is('archived_at', null)

  if (error) {
    throw new Error(`Não foi possível carregar a frequência: ${error.message}`)
  }

  return data ?? []
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
  const { data, error } = await client
    .from('agenda_attendance_entries')
    .upsert(
      {
        user_id: userId,
        class_id: classId,
        student_id: studentId,
        lesson_date: lessonDate,
        status,
        notes: notes?.trim() || null,
        recorded_by: userId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,class_id,student_id,lesson_date' },
    )
    .select('id,student_id,status,notes,lesson_date,updated_at')
    .single()

  if (error) {
    throw new Error(`Não foi possível salvar a frequência: ${error.message}`)
  }

  return data
}
