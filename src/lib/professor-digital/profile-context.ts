export type ProfessionalProfileContext = {
  area: string
  stage: string
  experience: string
  interests: string[]
  developmentGoal: string
}

export const PROFESSIONAL_PROFILE_CONTEXT_STORAGE_KEY =
  'edudata-professor-digital-profile-context'

export const emptyProfessionalProfileContext: ProfessionalProfileContext = {
  area: '',
  stage: '',
  experience: '',
  interests: [],
  developmentGoal: '',
}

export function normalizeProfessionalProfileContext(
  value: Partial<ProfessionalProfileContext> | null | undefined,
): ProfessionalProfileContext {
  return {
    area: typeof value?.area === 'string' ? value.area : '',
    stage: typeof value?.stage === 'string' ? value.stage : '',
    experience: typeof value?.experience === 'string' ? value.experience : '',
    interests: Array.isArray(value?.interests)
      ? value.interests.filter((item): item is string => typeof item === 'string')
      : [],
    developmentGoal:
      typeof value?.developmentGoal === 'string' ? value.developmentGoal : '',
  }
}

export function readProfessionalProfileContext(): ProfessionalProfileContext | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const stored = window.localStorage.getItem(PROFESSIONAL_PROFILE_CONTEXT_STORAGE_KEY)

    if (!stored) {
      return null
    }

    return normalizeProfessionalProfileContext(
      JSON.parse(stored) as Partial<ProfessionalProfileContext>,
    )
  } catch {
    window.localStorage.removeItem(PROFESSIONAL_PROFILE_CONTEXT_STORAGE_KEY)
    return null
  }
}

export function writeProfessionalProfileContext(
  context: ProfessionalProfileContext,
): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  try {
    window.localStorage.setItem(
      PROFESSIONAL_PROFILE_CONTEXT_STORAGE_KEY,
      JSON.stringify(normalizeProfessionalProfileContext(context)),
    )
    return true
  } catch {
    return false
  }
}
