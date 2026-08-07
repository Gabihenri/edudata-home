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

export type PedagogicalContextPeriod = {
  id: string
  name: string
  code: string | null
  sequence: number
  start_date: string
  end_date: string
  status: string
}

type CalendarContext = {
  organization: { id: string }
  school: { id: string }
}

type SchoolYear = {
  id: string
  year: number
  name: string | null
  active: boolean
  status: string
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

  const [academicPeriodId, setAcademicPeriodId] = useState('')
  const [academicPeriods, setAcademicPeriods] = useState<PedagogicalContextPeriod[]>([])
  const [periodsLoading, setPeriodsLoading] = useState(false)
  const [periodsError, setPeriodsError] = useState<string | null>(null)

  const selectedClass = useMemo(
    () => classes.find(item => item.id === classId) ?? null,
    [classes, classId],
  )

  const selectedStudent = useMemo(
    () => students.find(item => item.id === studentId) ?? null,
    [students, studentId],
  )

  const selectedAcademicPeriod = useMemo(
    () => academicPeriods.find(item => item.id === academicPeriodId) ?? null,
    [academicPeriods, academicPeriodId],
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

  const loadAcademicPeriods = useCallback(async () => {
    setPeriodsLoading(true)
    setPeriodsError(null)

    try {
      const contextsResponse = await fetch(
        '/api/agenda/institutional-calendar/contexts?limit=100',
        { credentials: 'include', cache: 'no-store' },
      )

      const contextsBody = await contextsResponse.json() as {
        success?: boolean
        data?: CalendarContext[]
        error?: string
      }

      if (!contextsResponse.ok || !contextsBody.success) {
        throw new Error(contextsBody.error || 'Não foi possível carregar o contexto acadêmico.')
      }

      const context = contextsBody.data?.[0]
      if (!context) {
        setAcademicPeriods([])
        return
      }

      const schoolYearsUrl = new URLSearchParams({
        organizationId: context.organization.id,
        schoolId: context.school.id,
      })

      const schoolYearsResponse = await fetch(
        `/api/agenda/institutional-calendar?${schoolYearsUrl.toString()}`,
        { credentials: 'include', cache: 'no-store' },
      )

      const schoolYearsBody = await schoolYearsResponse.json() as {
        success?: boolean
        data?: SchoolYear[]
        error?: string
      }

      if (!schoolYearsResponse.ok || !schoolYearsBody.success) {
        throw new Error(schoolYearsBody.error || 'Não foi possível carregar o ano letivo.')
      }

      const currentYear = new Date().getFullYear()
      const schoolYear =
        schoolYearsBody.data?.find(item => item.active) ??
        schoolYearsBody.data?.find(item => item.year === currentYear) ??
        schoolYearsBody.data?.[0]

      if (!schoolYear) {
        setAcademicPeriods([])
        return
      }

      const periodsResponse = await fetch(
        `/api/agenda/institutional-calendar/periods?schoolYearId=${encodeURIComponent(schoolYear.id)}`,
        { credentials: 'include', cache: 'no-store' },
      )

      const periodsBody = await periodsResponse.json() as {
        success?: boolean
        data?: PedagogicalContextPeriod[]
        error?: string
      }

      if (!periodsResponse.ok || !periodsBody.success) {
        throw new Error(periodsBody.error || 'Não foi possível carregar os períodos letivos.')
      }

      const periods = [...(periodsBody.data ?? [])].sort(
        (first, second) => first.sequence - second.sequence,
      )

      setAcademicPeriods(periods)

      if (!academicPeriodId && periods.length > 0) {
        const today = new Date().toISOString().slice(0, 10)
        const currentPeriod = periods.find(
          item => item.start_date <= today && item.end_date >= today,
        )
        setAcademicPeriodId(currentPeriod?.id ?? periods[0].id)
      }
    } catch (error) {
      setAcademicPeriods([])
      setPeriodsError(
        error instanceof Error
          ? error.message
          : 'Não foi possível carregar os períodos letivos.',
      )
    } finally {
      setPeriodsLoading(false)
    }
  }, [academicPeriodId])

  useEffect(() => {
    if (!classId) return
    void loadStudents(classId)
  }, [classId, loadStudents])

  useEffect(() => {
    void loadAcademicPeriods()
  }, [loadAcademicPeriods])

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

    academicPeriods,
    periodsLoading,
    periodsError,
    academicPeriodId,
    setAcademicPeriodId,
    selectedAcademicPeriod,
    reloadAcademicPeriods: loadAcademicPeriods,
  }
}
