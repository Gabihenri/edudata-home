export type ProfessionalProfileContext = {
  area: string
  stage: string
  experience: string
  interests: string[]
  developmentGoal: string
}

export type ProfessionalTrajectoryRecord = {
  source: 'planning' | 'lesson' | 'objective' | 'evidence'
  title: string
  theme?: string
  area?: string
  category?: string
  tags?: string[]
  status?: string
}

export type ProfessionalTrajectoryAnalysis = {
  summary: string
  recurringThemes: string[]
  historyCount: number
  reflectiveQuestions: string[]
  developmentPossibilities: string[]
  guardrails: {
    institutionalEvaluation: boolean
    professionalScore: boolean
    psychologicalAssessment: boolean
    automaticDecision: boolean
    requiresUserInterpretation: boolean
  }
}

type ApiEnvelope = {
  success: boolean
  message?: string
  error?: string
  data?: {
    result?: {
      summary?: string
      recurring_themes?: string[]
      history_count?: number
      reflective_questions?: string[]
      development_possibilities?: string[]
      guardrails?: {
        institutional_evaluation?: boolean
        professional_score?: boolean
        psychological_assessment?: boolean
        automatic_decision?: boolean
        requires_user_interpretation?: boolean
      }
    }
  }
}

function getApiBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_EDUDATA_API_URL ?? '').replace(/\/$/, '')
}

export async function analyzeProfessionalTrajectory(
  userContext: ProfessionalProfileContext,
  history: ProfessionalTrajectoryRecord[],
): Promise<ProfessionalTrajectoryAnalysis> {
  const baseUrl = getApiBaseUrl()

  if (!baseUrl) {
    throw new Error('O serviço de inteligência profissional ainda não está configurado para este ambiente.')
  }

  const response = await fetch(
    `${baseUrl}/api/v1/intelligence/professor-digital/trajectory-analysis`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: 'professor',
        user_context: {
          area: userContext.area,
          stage: userContext.stage,
          experience: userContext.experience,
          interests: userContext.interests,
          development_goal: userContext.developmentGoal,
        },
        history,
      }),
    },
  )

  const payload = await response.json() as ApiEnvelope

  if (!response.ok || !payload.success || !payload.data?.result) {
    throw new Error(payload.error ?? payload.message ?? 'Não foi possível processar sua leitura profissional agora.')
  }

  const result = payload.data.result

  return {
    summary: result.summary ?? '',
    recurringThemes: Array.isArray(result.recurring_themes) ? result.recurring_themes : [],
    historyCount: typeof result.history_count === 'number' ? result.history_count : history.length,
    reflectiveQuestions: Array.isArray(result.reflective_questions) ? result.reflective_questions : [],
    developmentPossibilities: Array.isArray(result.development_possibilities) ? result.development_possibilities : [],
    guardrails: {
      institutionalEvaluation: result.guardrails?.institutional_evaluation ?? false,
      professionalScore: result.guardrails?.professional_score ?? false,
      psychologicalAssessment: result.guardrails?.psychological_assessment ?? false,
      automaticDecision: result.guardrails?.automatic_decision ?? false,
      requiresUserInterpretation: result.guardrails?.requires_user_interpretation ?? true,
    },
  }
}
