'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { useClasses } from '@/lib/agenda/hooks/useClasses'

export type PedagogicalContextStudent = {
  id: string
  class_id: string
  full_name: string
  enrollment_code: string | null
  sequence_number: number | null
  active: boolean
}

type ClassDiaryResponse = {
  success?: boolean
  roster?: PedagogicalContextStudent[]
  error?: string
}

export function usePedagogicalContext(initialClassId = '') {
  const {
    classes,
    loading: classesLoading,
    error: classesError,
    reload: reloadClasses,
  } = useClasses()

  const [classId, setClassId] = useState(initialClassId)
  const [studentId, setStudentId] = useState('')
  const [students, setStudents] = useState<PedagogicalContextStudent[]>([])
  const [studentsLoading, setStudentsLoading] = useState(false)
  const [studentsError, setStudentsError] = useState<string | null>(null)

  const selectedClass = useMemo(
    () => classes.find(item => item.id === classId) ?? null,
    [classes, classId],
  )

  const selectedStudent = useMemo(
    () => students.find(item => item.id === studentId) ?? null,
    [students, studentId],
  )

  const loadStudents = useCallback(async (nextClassId: string) => {
    const normalizedClassId = nextClassId.trim()

    setStudentId('')
    setStudents([])
    setStudentsError(null)

    if (!normalizedClassId) return

    setStudentsLoading(true)

    try {
      const response = await fetch(
        `/api/agenda/diario-classe?classId=${encodeURIComponent(normalizedClassId)}`,
        {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
          headers: { Accept: 'application/json' },
        },
      )

      const body = await response.json() as ClassDiaryResponse

      if (!response.ok || !body.success) {
        throw new Error(body.error || 'Não foi possível carregar os estudantes da turma.')
      }

      setStudents(body.roster ?? [])
    } catch (error) {
      setStudentsError(
        error instanceof Error
          ? error.message
          : 'Não foi possível carregar os estudantes da turma.',
      )
    } finally {
      setStudentsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!classId) return
    void loadStudents(classId)
  }, [classId, loadStudents])

  function changeClass(nextClassId: string) {
    setClassId(nextClassId)
  }

  return {
    classes,
    classesLoading,
    classesError,
    reloadClasses,
    classId,
    changeClass,
    selectedClass,
    students,
    studentsLoading,
    studentsError,
    studentId,
    setStudentId,
    selectedStudent,
    reloadStudents: () => loadStudents(classId),
  }
}
