'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { useClasses } from '@/lib/agenda/hooks/useClasses'

export type PedagogicalContextMode = 'individual' | 'institutional'

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

export type PedagogicalContextSchoolYear = {
  id: string
  year: number
  name: string | null
  active: boolean
  status: string
}

export type PedagogicalInstitutionalContext = {
  organization: {
    id: string
    name?: string
  }
  school: {
    id: string
    name?: string
    shortName?: string | null
  }
  role?: string
  roleLabel?: string
  canManage?: boolean
}

type ClassDiaryResponse = {
  success?: boolean
  roster?: PedagogicalContextStudent[]
  error?: string
}

function todayIso() {
  const date = new Date()
  const offset = date.getTimezoneOffset()
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10)
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

  const [institutionalContext, setInstitutionalContext] =
    useState<PedagogicalInstitutionalContext | null>(null)
  const [schoolYear, setSchoolYear] =
    useState<PedagogicalContextSchoolYear | null>(null)

  const [academicPeriodId, setAcademicPeriodId] = useState('')
  const [academicPeriods, setAcademicPeriods] = useState<PedagogicalContextPeriod[]>([])
  const [periodsLoading, setPeriodsLoading] = useState(false)
  const [periodsError, setPeriodsError] = useState<string | null>(null)

  const activeClasses = useMemo(
    () => classes.filter(item => item.active),
    [classes],
  )

  const selectedClass = useMemo(
    () => activeClasses.find(item => item.id === classId) ?? null,
    [activeClasses, classId],
  )

  const selectedStudent = useMemo(
    () => students.find(item => item.id === studentId) ?? null,
    [students, studentId],
  )

  const selectedAcademicPeriod = useMemo(
    () => academicPeriods.find(item => item.id === academicPeriodId) ?? null,
    [academicPeriods, academicPeriodId],
  )

  const mode: PedagogicalContextMode = institutionalContext
    ? 'institutional'
    : 'individual'

  const subject = selectedClass?.subject?.trim() || null

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

      setStudents((body.roster ?? []).filter(student => student.active))
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

  const loadAcademicContext = useCallback(async () => {
    setPeriodsLoading(true)
    setPeriodsError(null)

    try {
      const contextsResponse = await fetch(
        '/api/agenda/institutional-calendar/contexts?limit=100',
        { credentials: 'include', cache: 'no-store' },
      )

      const contextsBody = await contextsResponse.json() as {
        success?: boolean
        data?: PedagogicalInstitutionalContext[]
        error?: string
      }

      if (!contextsResponse.ok || !contextsBody.success) {
        throw new Error(contextsBody.error || 'Não foi possível carregar o contexto acadêmico.')
      }

      const context = contextsBody.data?.[0] ?? null
      setInstitutionalContext(context)

      if (!context) {
        setSchoolYear(null)
        setAcademicPeriods([])
        setAcademicPeriodId('')
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
        data?: PedagogicalContextSchoolYear[]
        error?: string
      }

      if (!schoolYearsResponse.ok || !schoolYearsBody.success) {
        throw new Error(schoolYearsBody.error || 'Não foi possível carregar o ano letivo.')
      }

      const currentYear = new Date().getFullYear()
      const nextSchoolYear =
        schoolYearsBody.data?.find(item => item.active) ??
        schoolYearsBody.data?.find(item => item.year === currentYear) ??
        schoolYearsBody.data?.[0] ??
        null

      setSchoolYear(nextSchoolYear)

      if (!nextSchoolYear) {
        setAcademicPeriods([])
        setAcademicPeriodId('')
        return
      }

      const periodsResponse = await fetch(
        `/api/agenda/institutional-calendar/periods?schoolYearId=${encodeURIComponent(nextSchoolYear.id)}`,
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

      const periods = [...(periodsBody.data ?? [])]
        .filter(period => period.status !== 'archived')
        .sort((first, second) => first.sequence - second.sequence)

      setAcademicPeriods(periods)

      setAcademicPeriodId(currentId => {
        if (currentId && periods.some(period => period.id === currentId)) {
          return currentId
        }

        const today = todayIso()
        const currentPeriod = periods.find(
          period => period.start_date <= today && period.end_date >= today,
        )

        return currentPeriod?.id ?? periods[0]?.id ?? ''
      })
    } catch (error) {
      setInstitutionalContext(null)
      setSchoolYear(null)
      setAcademicPeriods([])
      setAcademicPeriodId('')
      setPeriodsError(
        error instanceof Error
          ? error.message
          : 'Não foi possível carregar o contexto acadêmico.',
      )
    } finally {
      setPeriodsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!classId) {
      setStudentId('')
      setStudents([])
      return
    }

    void loadStudents(classId)
  }, [classId, loadStudents])

  useEffect(() => {
    void loadAcademicContext()
  }, [loadAcademicContext])

  useEffect(() => {
    if (!classId) return

    const stillExists = activeClasses.some(item => item.id === classId)
    if (!stillExists) {
      setClassId('')
      setStudentId('')
      setStudents([])
    }
  }, [activeClasses, classId])

  function changeClass(nextClassId: string) {
    setClassId(nextClassId)
  }

  return {
    mode,
    institutionalContext,
    schoolYear,

    classes: activeClasses,
    classesLoading,
    classesError,
    reloadClasses,

    classId,
    changeClass,
    selectedClass,
    subject,

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
    reloadAcademicPeriods: loadAcademicContext,
  }
}
